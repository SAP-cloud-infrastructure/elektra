# frozen_string_literal: true

require 'spec_helper'

RSpec.describe OauthProxyProtectionMiddleware do
  let(:app) { ->(env) { [status, headers, body] } }
  let(:middleware) { described_class.new(app) }
  let(:env) { Rack::MockRequest.env_for('/test/path') }
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:body) { ['{"error":"test"}'] }

  describe '#call' do
    context 'when response status is 401' do
      let(:status) { 401 }

      it 'converts status to 200' do
        status, _, _ = middleware.call(env)
        expect(status).to eq(200)
      end

      it 'preserves headers' do
        _, returned_headers, _ = middleware.call(env)
        expect(returned_headers).to eq(headers)
      end

      it 'preserves body' do
        _, _, returned_body = middleware.call(env)
        expect(returned_body).to eq(body)
      end

      it 'logs a warning' do
        expect(Rails.logger).to receive(:warn).with(/Intercepted 401/)
        middleware.call(env)
      end
    end

    context 'when response status is 403' do
      let(:status) { 403 }

      it 'converts status to 200' do
        status, _, _ = middleware.call(env)
        expect(status).to eq(200)
      end

      it 'preserves headers' do
        _, returned_headers, _ = middleware.call(env)
        expect(returned_headers).to eq(headers)
      end

      it 'preserves body' do
        _, _, returned_body = middleware.call(env)
        expect(returned_body).to eq(body)
      end

      it 'logs a warning' do
        expect(Rails.logger).to receive(:warn).with(/Intercepted 403/)
        middleware.call(env)
      end
    end

    context 'when response status is 200' do
      let(:status) { 200 }

      it 'passes through unchanged' do
        returned_status, returned_headers, returned_body = middleware.call(env)
        expect(returned_status).to eq(200)
        expect(returned_headers).to eq(headers)
        expect(returned_body).to eq(body)
      end

      it 'does not log' do
        expect(Rails.logger).not_to receive(:warn)
        middleware.call(env)
      end
    end

    context 'when response status is 404' do
      let(:status) { 404 }

      it 'passes through unchanged' do
        returned_status, returned_headers, returned_body = middleware.call(env)
        expect(returned_status).to eq(404)
        expect(returned_headers).to eq(headers)
        expect(returned_body).to eq(body)
      end

      it 'does not log' do
        expect(Rails.logger).not_to receive(:warn)
        middleware.call(env)
      end
    end

    context 'when response status is 500' do
      let(:status) { 500 }

      it 'passes through unchanged' do
        returned_status, returned_headers, returned_body = middleware.call(env)
        expect(returned_status).to eq(500)
        expect(returned_headers).to eq(headers)
        expect(returned_body).to eq(body)
      end

      it 'does not log' do
        expect(Rails.logger).not_to receive(:warn)
        middleware.call(env)
      end
    end
  end
end
