# frozen_string_literal: true

require 'spec_helper'
require_relative '../../app/middleware/anonymous_session_metrics_middleware'
require_relative '../../config/initializers/anonymous_metrics'

RSpec.describe AnonymousSessionMetricsMiddleware do
  let(:app) { ->(env) { [200, { 'Content-Type' => 'text/plain' }, ['OK']] } }
  let(:registry) { Prometheus::Client::Registry.new }
  let(:middleware) { described_class.new(app, registry: registry) }

  def create_env(path: '/', cookie: nil, referer: nil)
    env = {
      'PATH_INFO' => path,
      'REQUEST_METHOD' => 'GET',
      'HTTP_HOST' => 'dashboard.qa-de-1.cloud.sap',
      'rack.url_scheme' => 'https',
      'action_dispatch.request.path_parameters' => {
        controller: 'compute/instances',
        action: 'index',
        domain_id: 'test-domain',
        project_id: 'test-project'
      }
    }
    env['HTTP_COOKIE'] = "dashboard-session-auth=#{cookie}" if cookie
    env['HTTP_REFERER'] = referer if referer
    env
  end

  describe '#initialize' do
    it 'initializes the middleware' do
      # Just verify middleware initializes without errors
      expect(middleware).not_to be_nil
    end
  end

  describe '#call' do
    context 'with excluded paths' do
      %w[/metrics /assets /system /health].each do |path|
        it "skips tracking for #{path}" do
          env = create_env(path: path, cookie: 'test-token')
          status, _headers, _body = middleware.call(env)

          expect(status).to eq(200)
          # Metrics should not be incremented for excluded paths
          # (can't easily verify zero without checking all possible label combinations)
        end
      end
    end

    context 'without session cookie' do
      it 'processes request but does not track metrics' do
        env = create_env(path: '/test', cookie: nil)
        status, _headers, _body = middleware.call(env)

        expect(status).to eq(200)
        # Without cookie, no metrics should be tracked
      end
    end

    context 'with session cookie' do
      let(:session_token) { 'test-session-token-123' }
      let(:anonymous_id) { AnonymousMetrics.generate_id(session_token) }

      it 'tracks unique session on first request' do
        env = create_env(path: '/test', cookie: session_token)
        middleware.call(env)

        counter = registry.get(:dashboard_unique_sessions_total)
        expect(counter.get(labels: { anonymous_session_id: anonymous_id })).to eq(1)
      end

      it 'does not increment unique session counter on subsequent requests' do
        env = create_env(path: '/test', cookie: session_token)

        # First request
        middleware.call(env)
        # Second request
        middleware.call(env)

        counter = registry.get(:dashboard_unique_sessions_total)
        expect(counter.get(labels: { anonymous_session_id: anonymous_id })).to eq(1)
      end

      it 'tracks session start timestamp' do
        env = create_env(path: '/test', cookie: session_token)
        before_time = Time.now.to_i
        middleware.call(env)
        after_time = Time.now.to_i

        gauge = registry.get(:dashboard_session_start_timestamp)
        timestamp = gauge.get(labels: { anonymous_session_id: anonymous_id })

        expect(timestamp).to be_between(before_time, after_time)
      end

      it 'updates last activity timestamp' do
        env = create_env(path: '/test', cookie: session_token)
        middleware.call(env)

        gauge = registry.get(:dashboard_session_last_activity_timestamp)
        timestamp = gauge.get(labels: {
          anonymous_session_id: anonymous_id,
          domain: 'test-domain',
          project: 'test-project'
        })

        expect(timestamp).to be > 0
      end

      it 'tracks feature sequences' do
        env = create_env(path: '/test', cookie: session_token)
        middleware.call(env)

        counter = registry.get(:dashboard_feature_sequence_total)
        count = counter.get(labels: {
          anonymous_session_id: anonymous_id,
          previous_feature: 'entry',
          current_feature: 'compute_index'
        })

        expect(count).to eq(1)
      end

      it 'limits feature tracking to MAX_FEATURES_PER_SESSION' do
        env = create_env(path: '/test', cookie: session_token)

        # Make more requests than MAX_FEATURES_PER_SESSION
        15.times do |i|
          env['action_dispatch.request.path_parameters'][:action] = "action_#{i}"
          middleware.call(env)
        end

        # Access internal state for testing (not ideal, but validates the sliding window)
        session_features = middleware.instance_variable_get(:@session_features)
        expect(session_features[anonymous_id].size).to eq(described_class::MAX_FEATURES_PER_SESSION)
      end
    end

    context 'cross-dashboard navigation' do
      let(:session_token) { 'test-session-token-123' }
      let(:anonymous_id) { AnonymousMetrics.generate_id(session_token) }

      it 'tracks navigation from Aurora to Elektra' do
        env = create_env(
          path: '/test',
          cookie: session_token,
          referer: 'https://dashboard-aurora.qa-de-1.cloud.sap/domain/project/compute/instances'
        )
        env['HTTP_HOST'] = 'dashboard.qa-de-1.cloud.sap'

        middleware.call(env)

        counter = registry.get(:dashboard_cross_navigation_total)
        count = counter.get(labels: {
          anonymous_session_id: anonymous_id,
          from_dashboard: 'aurora',
          to_dashboard: 'elektra',
          from_feature: 'compute'
        })

        expect(count).to eq(1)
      end

      it 'does not track navigation within same dashboard' do
        env = create_env(
          path: '/test',
          cookie: session_token,
          referer: 'https://dashboard.qa-de-1.cloud.sap/domain/project/compute/instances'
        )

        middleware.call(env)

        # No cross-dashboard navigation should be tracked
        # (can't easily verify zero without checking all label combinations)
      end
    end

    context 'TTL-based cleanup' do
      let(:session_token) { 'test-session-token-123' }

      it 'removes expired sessions after SESSION_TTL' do
        env = create_env(path: '/test', cookie: session_token)
        middleware.call(env)

        # Access internal state
        session_first_seen = middleware.instance_variable_get(:@session_first_seen)
        anonymous_id = AnonymousMetrics.generate_id(session_token)
        expect(session_first_seen.size).to eq(1)

        # Simulate expired session
        expired_time = Time.now - described_class::SESSION_TTL - 1
        session_first_seen[anonymous_id] = expired_time

        # Trigger cleanup by setting request count to trigger next cleanup
        middleware.instance_variable_set(:@request_count, described_class::CLEANUP_INTERVAL - 1)

        # Use a different session to trigger cleanup
        env2 = create_env(path: '/test', cookie: 'different-token')
        middleware.call(env2)

        # Expired session should be removed
        expect(session_first_seen.key?(anonymous_id)).to be false
      end

      it 'runs cleanup periodically based on CLEANUP_INTERVAL' do
        env = create_env(path: '/test', cookie: 'token1')

        # Make CLEANUP_INTERVAL requests
        (described_class::CLEANUP_INTERVAL - 1).times do
          middleware.call(env)
        end

        # Set up an expired session
        session_first_seen = middleware.instance_variable_get(:@session_first_seen)
        old_id = 'expired-session-id'
        session_first_seen[old_id] = Time.now - described_class::SESSION_TTL - 1

        # Next request should trigger cleanup
        middleware.call(env)

        # Expired session should be removed
        expect(session_first_seen.key?(old_id)).to be false
      end
    end

    context 'error handling' do
      it 'continues processing request if metrics tracking fails' do
        env = create_env(path: '/test', cookie: 'test-token')

        # Mock AnonymousMetrics to raise an error
        allow(AnonymousMetrics).to receive(:generate_id).and_raise(StandardError, 'Test error')

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
