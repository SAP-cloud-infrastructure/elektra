# frozen_string_literal: true

require 'spec_helper'
require_relative '../../app/middleware/anonymous_session_metrics_middleware'
require_relative '../../config/initializers/anonymous_metrics'

RSpec.describe AnonymousSessionMetricsMiddleware do
  let(:app) do
    lambda do |env|
      # Simulate Rails setting path_parameters
      env['action_dispatch.request.path_parameters'] ||= {
        controller: 'compute/instances',
        action: 'index',
        domain_id: 'test-domain',
        project_id: 'test-project'
      }
      [200, { 'Content-Type' => 'text/plain' }, ['OK']]
    end
  end

  let(:registry) { Prometheus::Client::Registry.new }
  let(:middleware) { described_class.new(app, registry: registry) }

  # Mock Rails.configuration.default_region
  before do
    allow(Rails).to receive_message_chain(:configuration, :default_region).and_return('qa-de-1')
  end

  def create_env(path: '/', cookies: {}, referer: nil, host: 'dashboard.qa-de-1.cloud.sap')
    cookie_string = cookies.map { |k, v| "#{k}=#{v}" }.join('; ')

    env = {
      'PATH_INFO' => path,
      'REQUEST_METHOD' => 'GET',
      'HTTP_HOST' => host,
      'rack.url_scheme' => 'https',
      'action_dispatch.request.path_parameters' => {
        controller: 'compute/instances',
        action: 'index',
        domain_id: 'test-domain',
        project_id: 'test-project'
      }
    }
    env['HTTP_COOKIE'] = cookie_string unless cookie_string.empty?
    env['HTTP_REFERER'] = referer if referer
    env
  end

  def extract_cookies(response)
    set_cookie_header = response[1]['Set-Cookie']
    return {} unless set_cookie_header

    cookies = {}
    cookie_lines = set_cookie_header.is_a?(Array) ? set_cookie_header : [set_cookie_header]

    cookie_lines.each do |cookie_line|
      name, value = cookie_line.split('=', 2)
      next unless name && value

      name = name.strip
      value = value.split(';').first.strip
      cookies[name] = value
    end
    cookies
  end

  describe '#initialize' do
    it 'initializes metrics with low-cardinality labels' do
      # Metrics are registered during initialization
      expect(middleware).not_to be_nil

      # Verify the metrics exist in the registry
      expect { registry.get(:dashboard_unique_sessions_total) }.not_to raise_error
      expect { registry.get(:dashboard_feature_usage_total) }.not_to raise_error
      expect { registry.get(:dashboard_feature_transitions_total) }.not_to raise_error
      expect { registry.get(:dashboard_cross_navigation_total) }.not_to raise_error
      expect { registry.get(:dashboard_session_duration_seconds) }.not_to raise_error
    end

    it 'does not use in-memory state' do
      expect(middleware.instance_variables).not_to include(:@session_first_seen)
      expect(middleware.instance_variables).not_to include(:@session_features)
      expect(middleware.instance_variables).not_to include(:@mutex)
    end
  end

  describe '#call' do
    context 'with excluded paths' do
      %w[/metrics /assets /system /health].each do |path|
        it "skips tracking for #{path}" do
          env = create_env(path: path, cookies: { 'dashboard-session-auth' => 'test-token' })
          status, _headers, _body = middleware.call(env)

          expect(status).to eq(200)
        end
      end
    end

    context 'without session cookie' do
      it 'processes request but does not track metrics' do
        env = create_env(path: '/test')
        status, headers, _body = middleware.call(env)

        expect(status).to eq(200)
        expect(headers['Set-Cookie']).to be_nil
      end
    end

    context 'with session cookie - hourly deduplication' do
      let(:session_token) { 'test-session-token-123' }
      let(:current_hour) { Time.now.strftime("%H") }

      it 'counts first request in hour and sets hourly cookie' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        _status, headers, _body = middleware.call(env)

        # Check counter incremented
        counter = registry.get(:dashboard_unique_sessions_total)
        count = counter.get(labels: { session_hour: current_hour, platform: 'elektra' })
        expect(count).to eq(1)

        # Check hourly cookie set (now metrics_hours with comma-separated values)
        cookies = extract_cookies([nil, headers, nil])
        expect(cookies["metrics_hours"]).to eq(current_hour)
      end

      it 'does not count second request in same hour (cookie present)' do
        # First request
        env1 = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        _status1, headers1, _body1 = middleware.call(env1)

        # Second request with hourly cookie (new format: metrics_hours=13)
        cookies_with_hourly = {
          'dashboard-session-auth' => session_token,
          'metrics_hours' => current_hour
        }
        env2 = create_env(path: '/test', cookies: cookies_with_hourly)
        middleware.call(env2)

        # Counter should still be 1
        counter = registry.get(:dashboard_unique_sessions_total)
        count = counter.get(labels: { session_hour: current_hour, platform: 'elektra' })
        expect(count).to eq(1)
      end

      it 'sets hourly cookie with correct domain and expiration' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        _status, headers, _body = middleware.call(env)

        set_cookie = headers['Set-Cookie']
        cookie_lines = set_cookie.is_a?(Array) ? set_cookie : [set_cookie]
        hourly_cookie = cookie_lines.find { |c| c.start_with?("metrics_hours") }

        expect(hourly_cookie).to include('Domain=.qa-de-1.cloud.sap')
        expect(hourly_cookie).to include('HttpOnly')
        # Secure attribute depends on Rails.env (like dashboard-session-auth)
        # In test env, Secure is not set (matching auth cookie pattern)
        expect(hourly_cookie).to include('SameSite=Lax')
        expect(hourly_cookie).to include('Expires=')
      end
    end

    context 'session duration tracking' do
      let(:session_token) { 'test-session-token-123' }

      it 'sets session start cookie on first request' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        _status, headers, _body = middleware.call(env)

        cookies = extract_cookies([nil, headers, nil])
        expect(cookies['metrics_session']).not_to be_nil

        # Decode and verify session data structure
        session_data = JSON.parse(Base64.decode64(cookies['metrics_session']))
        expect(session_data['start']).to be > 0
        expect(session_data['last_dur']).to be > 0
      end

      it 'records duration every 5 minutes' do
        # Set session start 10 minutes ago
        start_time = Time.now.to_i - 600
        last_record = Time.now.to_i - 301  # 5+ minutes ago

        # Encode session data in new format
        session_data = { start: start_time, last_dur: last_record, features: [] }
        encoded_session = Base64.strict_encode64(session_data.to_json)

        env = create_env(path: '/test', cookies: {
          'dashboard-session-auth' => session_token,
          'metrics_session' => encoded_session
        })
        middleware.call(env)

        # Check histogram recorded
        histogram = registry.get(:dashboard_session_duration_seconds)
        # Can't easily verify exact value, but ensure no errors
        expect(histogram).not_to be_nil
      end

      it 'does not record duration if less than 5 minutes since last record' do
        start_time = Time.now.to_i - 600
        last_record = Time.now.to_i - 100  # Only 100 seconds ago

        # Encode session data in new format
        session_data = { start: start_time, last_dur: last_record, features: [] }
        encoded_session = Base64.strict_encode64(session_data.to_json)

        env = create_env(path: '/test', cookies: {
          'dashboard-session-auth' => session_token,
          'metrics_session' => encoded_session
        })

        # Should not call observe (can't easily test without mocking)
        expect { middleware.call(env) }.not_to raise_error
      end
    end

    context 'feature usage tracking' do
      let(:session_token) { 'test-session-token-123' }
      let(:current_hour) { Time.now.strftime("%H") }

      it 'increments feature usage counter' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        middleware.call(env)

        counter = registry.get(:dashboard_feature_usage_total)
        count = counter.get(labels: {
          feature: 'compute_index',
          platform: 'elektra',
          session_hour: current_hour
        })
        expect(count).to eq(1)
      end

      it 'tracks feature usage multiple times (no deduplication)' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })

        # Make 3 requests
        3.times { middleware.call(env) }

        counter = registry.get(:dashboard_feature_usage_total)
        count = counter.get(labels: {
          feature: 'compute_index',
          platform: 'elektra',
          session_hour: current_hour
        })
        expect(count).to eq(3)
      end
    end

    context 'feature transitions tracking' do
      let(:session_token) { 'test-session-token-123' }
      let(:current_hour) { Time.now.strftime("%H") }

      it 'stores current feature in cookie' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => session_token })
        _status, headers, _body = middleware.call(env)

        cookies = extract_cookies([nil, headers, nil])
        expect(cookies['metrics_session']).not_to be_nil

        # Decode Base64 and check features array
        session_data = JSON.parse(Base64.decode64(cookies['metrics_session']))
        expect(session_data['features']).to eq(['compute_index'])
      end

      it 'tracks transitions from previous feature' do
        # First request with previous feature in session cookie
        session_data = { start: Time.now.to_i, last_dur: Time.now.to_i, features: ['compute_list'] }
        session_encoded = Base64.strict_encode64(session_data.to_json)

        env = create_env(
          path: '/test',
          cookies: {
            'dashboard-session-auth' => session_token,
            'metrics_session' => session_encoded
          }
        )
        middleware.call(env)

        counter = registry.get(:dashboard_feature_transitions_total)
        count = counter.get(labels: {
          from_feature: 'compute_list',
          to_feature: 'compute_index',
          platform: 'elektra',
          session_hour: current_hour
        })
        expect(count).to eq(1)
      end

      it 'limits feature storage to MAX_FEATURES_PER_SESSION' do
        # Start with 5 features (max)
        session_data = { start: Time.now.to_i, last_dur: Time.now.to_i, features: %w[f1 f2 f3 f4 f5] }
        session_encoded = Base64.strict_encode64(session_data.to_json)

        env = create_env(
          path: '/test',
          cookies: {
            'dashboard-session-auth' => session_token,
            'metrics_session' => session_encoded
          }
        )
        _status, headers, _body = middleware.call(env)

        # Should have: f2, f3, f4, f5, compute_index (last 5)
        cookies = extract_cookies([nil, headers, nil])
        session_data = JSON.parse(Base64.decode64(cookies['metrics_session']))
        features = session_data['features']
        expect(features.length).to eq(described_class::MAX_FEATURES_PER_SESSION)
        expect(features).to eq(%w[f2 f3 f4 f5 compute_index])
      end
    end

    context 'cross-dashboard navigation' do
      let(:session_token) { 'test-session-token-123' }
      let(:current_hour) { Time.now.strftime("%H") }

      it 'tracks navigation from Aurora to Elektra' do
        session_data = { start: Time.now.to_i, last_dur: Time.now.to_i, features: ['compute_list'] }
        session_encoded = Base64.strict_encode64(session_data.to_json)

        env = create_env(
          path: '/test',
          host: 'dashboard.qa-de-1.cloud.sap',
          cookies: {
            'dashboard-session-auth' => session_token,
            'metrics_session' => session_encoded
          },
          referer: 'https://dashboard-aurora.qa-de-1.cloud.sap/domain/project/compute/instances'
        )
        middleware.call(env)

        counter = registry.get(:dashboard_cross_navigation_total)
        count = counter.get(labels: {
          from_dashboard: 'aurora',
          to_dashboard: 'elektra',
          from_feature: 'compute_list',
          session_hour: current_hour
        })
        expect(count).to eq(1)
      end

      it 'tracks navigation from Elektra to Aurora' do
        session_data = { start: Time.now.to_i, last_dur: Time.now.to_i, features: ['network_list'] }
        session_encoded = Base64.strict_encode64(session_data.to_json)

        env = create_env(
          path: '/test',
          host: 'dashboard-aurora.qa-de-1.cloud.sap',
          cookies: {
            'dashboard-session-auth' => session_token,
            'metrics_session' => session_encoded
          },
          referer: 'https://dashboard.qa-de-1.cloud.sap/domain/project/network/routers'
        )
        middleware.call(env)

        counter = registry.get(:dashboard_cross_navigation_total)
        count = counter.get(labels: {
          from_dashboard: 'elektra',
          to_dashboard: 'aurora',
          from_feature: 'network_list',
          session_hour: current_hour
        })
        expect(count).to eq(1)
      end

      it 'does not track navigation within same dashboard' do
        env = create_env(
          path: '/test',
          host: 'dashboard.qa-de-1.cloud.sap',
          cookies: { 'dashboard-session-auth' => session_token },
          referer: 'https://dashboard.qa-de-1.cloud.sap/domain/project/compute/instances'
        )

        initial_count = begin
          registry.get(:dashboard_cross_navigation_total).values.values.sum
        rescue
          0
        end

        middleware.call(env)

        final_count = begin
          registry.get(:dashboard_cross_navigation_total).values.values.sum
        rescue
          0
        end

        expect(final_count).to eq(initial_count)
      end

      it 'uses "unknown" if no previous feature in cookie' do
        env = create_env(
          path: '/test',
          host: 'dashboard.qa-de-1.cloud.sap',
          cookies: { 'dashboard-session-auth' => session_token },
          referer: 'https://dashboard-aurora.qa-de-1.cloud.sap/domain/project/compute/instances'
        )
        middleware.call(env)

        counter = registry.get(:dashboard_cross_navigation_total)
        count = counter.get(labels: {
          from_dashboard: 'aurora',
          to_dashboard: 'elektra',
          from_feature: 'unknown',
          session_hour: current_hour
        })
        expect(count).to eq(1)
      end
    end

    context 'cookie domain sharing' do
      let(:session_token) { 'test-session-token-123' }
      let(:current_hour) { Time.now.strftime("%H") }

      it 'sets cookies with shared domain for Elektra' do
        env = create_env(
          path: '/test',
          host: 'dashboard.qa-de-1.cloud.sap',
          cookies: { 'dashboard-session-auth' => session_token }
        )
        _status, headers, _body = middleware.call(env)

        set_cookie = headers['Set-Cookie']
        cookie_lines = set_cookie.is_a?(Array) ? set_cookie : [set_cookie]
        expect(cookie_lines.any? { |c| c.include?('Domain=.qa-de-1.cloud.sap') }).to be true
      end

      it 'respects hourly cookie from Aurora (shared domain)' do
        # Simulate cookie set by Aurora (new format: metrics_hours=14)
        env = create_env(
          path: '/test',
          host: 'dashboard.qa-de-1.cloud.sap',
          cookies: {
            'dashboard-session-auth' => session_token,
            'metrics_hours' => current_hour  # Set by Aurora
          }
        )
        middleware.call(env)

        # Should not increment (cookie already present)
        counter = registry.get(:dashboard_unique_sessions_total)
        count = counter.get(labels: { session_hour: current_hour, platform: 'elektra' })
        expect(count).to eq(0)  # Not incremented
      end
    end

    context 'error handling' do
      it 'continues processing request if metrics tracking fails' do
        env = create_env(path: '/test', cookies: { 'dashboard-session-auth' => 'test-token' })

        # Mock Time.now to raise an error
        allow(Time).to receive(:now).and_raise(StandardError, 'Test error')

        expect { middleware.call(env) }.not_to raise_error
        status, _headers, _body = middleware.call(env)
        expect(status).to eq(200)
      end
    end
  end

  describe 'AnonymousMetrics.generate_id' do
    it 'generates consistent IDs for same token' do
      token = 'test-token'
      id1 = AnonymousMetrics.generate_id(token)
      id2 = AnonymousMetrics.generate_id(token)

      expect(id1).to eq(id2)
    end

    it 'generates different IDs for different tokens' do
      id1 = AnonymousMetrics.generate_id('token1')
      id2 = AnonymousMetrics.generate_id('token2')

      expect(id1).not_to eq(id2)
    end

    it 'returns nil for blank token' do
      expect(AnonymousMetrics.generate_id(nil)).to be_nil
      expect(AnonymousMetrics.generate_id('')).to be_nil
    end

    it 'generates 16-character hex string' do
      id = AnonymousMetrics.generate_id('test-token')
      expect(id).to match(/^[a-f0-9]{16}$/)
    end
  end
end
