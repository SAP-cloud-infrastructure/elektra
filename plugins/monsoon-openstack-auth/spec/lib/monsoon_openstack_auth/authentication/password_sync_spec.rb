require 'spec_helper'

describe MonsoonOpenstackAuth::Authentication::PasswordSync do
  let(:api_client) { double('api_client') }
  let(:logger) { double('logger', error: nil) }
  let(:user_id) { 'D123456' }
  let(:password) { 'new-password' }

  subject(:service) { described_class.new(api_client, logger: logger) }

  def auth_error(code)
    MonsoonOpenstackAuth::ConnectionDriver::AuthenticationError.new('failed', code)
  end

  describe '#call' do
    context 'when the password is already current (attempt 1 succeeds)' do
      it 'returns success without a second attempt' do
        expect(api_client).to receive(:validate_credentials).once.and_return({ 'token' => {} })

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::SUCCESS)
        expect(result).to be_success
      end
    end

    context 'when the password was outdated (attempt 1 401, attempt 2 succeeds)' do
      it 'retries once and returns success' do
        expect(api_client).to receive(:validate_credentials)
          .and_raise(auth_error(401))
        expect(api_client).to receive(:validate_credentials)
          .and_return({ 'token' => {} })

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::SUCCESS)
      end
    end

    context 'when the password is genuinely wrong (two 401s)' do
      it 'returns invalid_credentials' do
        expect(api_client).to receive(:validate_credentials)
          .twice.and_raise(auth_error(401))

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::INVALID_CREDENTIALS)
        expect(result).not_to be_success
      end
    end

    context 'when a 401 has no error code in the body (code nil)' do
      it 'still treats it as an auth failure and retries' do
        expect(api_client).to receive(:validate_credentials)
          .twice.and_raise(auth_error(nil))

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::INVALID_CREDENTIALS)
      end
    end

    context 'when Keystone returns a 5xx on attempt 1' do
      it 'returns service_unavailable without retrying' do
        expect(api_client).to receive(:validate_credentials)
          .once.and_raise(auth_error(500))

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::SERVICE_UNAVAILABLE)
      end
    end

    context 'when attempt 1 is a 401 but the retry hits a 5xx' do
      it 'returns service_unavailable' do
        expect(api_client).to receive(:validate_credentials)
          .and_raise(auth_error(401))
        expect(api_client).to receive(:validate_credentials)
          .and_raise(auth_error(503))

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::SERVICE_UNAVAILABLE)
      end
    end

    context 'when an unexpected error is raised' do
      it 'returns service_unavailable and logs' do
        expect(api_client).to receive(:validate_credentials)
          .and_raise(StandardError.new('boom'))
        expect(logger).to receive(:error)

        result = service.call(user_id, password)

        expect(result.status).to eq(described_class::SERVICE_UNAVAILABLE)
      end
    end

    context 'with blank input' do
      it 'returns invalid_credentials for a blank user id' do
        expect(api_client).not_to receive(:validate_credentials)
        expect(service.call('', password).status).to eq(described_class::INVALID_CREDENTIALS)
      end

      it 'returns invalid_credentials for a blank password' do
        expect(api_client).not_to receive(:validate_credentials)
        expect(service.call(user_id, '').status).to eq(described_class::INVALID_CREDENTIALS)
      end
    end
  end
end
