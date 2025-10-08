# spec/controllers/auth_token_controller_spec.rb
require 'spec_helper'

RSpec.describe AuthTokenController, type: :controller do
  let(:valid_token) { 'valid_auth_token_123' }
  let(:invalid_token) { 'invalid_token' }
  let(:keystone_endpoint) { 'https://keystone.example.com' }
  let(:domain_name) { 'test_domain' }
  
  before do
    stub_const('KEYSTONE_ENDPOINT', keystone_endpoint)
    allow(Rails.application).to receive(:secret_key_base).and_return('test_secret_key')
  end

  describe 'POST #verify' do
    context 'when token is blank' do
      it 'returns bad request error' do
        post :verify, params: { token: '' }
        
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Auth token is required' })
      end

      it 'returns bad request error when token is nil' do
        post :verify, params: {}
        
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Auth token is required' })
      end
    end

    context 'when token is valid' do
      let(:success_response_body) do
        {
          'token' => {
            'user' => {
              'domain' => {
                'name' => domain_name
              }
            }
          }
        }
      end

      before do
        stub_keystone_request(valid_token, Net::HTTPOK.new('1.1', '200', 'OK'), success_response_body)
      end

      it 'successfully verifies token and renders redirect view' do
        post :verify, params: { token: valid_token }
        
        expect(response).to have_http_status(:ok)
        expect(response).to render_template(:redirect)
        expect(assigns(:domain_name)).to eq(domain_name)
        expect(assigns(:auth_token)).to be_present
      end

      it 'encodes the auth token' do
        verifier = instance_double(ActiveSupport::MessageVerifier)
        allow(ActiveSupport::MessageVerifier).to receive(:new).and_return(verifier)
        allow(verifier).to receive(:generate).with(valid_token).and_return('encoded_token')
        
        post :verify, params: { token: valid_token }
        
        expect(assigns(:auth_token)).to eq('encoded_token')
      end
    end

    context 'when keystone returns success but domain name is missing' do
      let(:response_without_domain) do
        {
          'token' => {
            'user' => {}
          }
        }
      end

      before do
        stub_keystone_request(valid_token, Net::HTTPOK.new('1.1', '200', 'OK'), response_without_domain)
      end

      it 'sets error when domain name is not found' do
        post :verify, params: { token: valid_token }
        
        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('Domain ID not found in response')
      end
    end

    context 'when keystone returns authentication failure' do
      before do
        stub_keystone_request(invalid_token, Net::HTTPUnauthorized.new('1.1', '401', 'Unauthorized'), {})
      end

      it 'sets authentication failed error' do
        post :verify, params: { token: invalid_token }
        
        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('Authentication failed')
      end
    end

    context 'when keystone returns invalid JSON' do
      before do
        stub_keystone_request_with_invalid_json(valid_token)
      end

      it 'handles JSON parsing error' do
        post :verify, params: { token: valid_token }
        
        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('Invalid JSON response')
        expect(assigns(:details)).to be_present
      end
    end

    context 'when network error occurs' do
      before do
        # Mock the HTTP request to raise an error when request is made
        http_mock = instance_double(Net::HTTP)
        allow(Net::HTTP).to receive(:new).and_return(http_mock)
        allow(http_mock).to receive(:use_ssl=)
        allow(http_mock).to receive(:verify_mode=)
        allow(http_mock).to receive(:request).and_raise(StandardError.new('Network error'))
      end

      it 'handles network errors' do
        post :verify, params: { token: valid_token }
        
        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('An error occurred')
        expect(assigns(:details)).to eq('Network error')
      end
    end

    context 'HTTPS configuration' do
      it 'configures SSL when endpoint uses HTTPS' do
        http_mock = instance_double(Net::HTTP)
        allow(Net::HTTP).to receive(:new).and_return(http_mock)
        allow(http_mock).to receive(:use_ssl=)
        allow(http_mock).to receive(:verify_mode=)
        allow(http_mock).to receive(:request).and_return(
          Net::HTTPOK.new('1.1', '200', 'OK').tap do |response|
            allow(response).to receive(:body).and_return({
              'token' => {
                'user' => {
                  'domain' => { 'name' => domain_name }
                }
              }
            }.to_json)
          end
        )

        post :verify, params: { token: valid_token }
        
        expect(http_mock).to have_received(:use_ssl=).with(true)
      end
    end

    context 'SSL verification configuration' do
      before do
        allow(ENV).to receive(:[]).with('ELEKTRA_SSL_VERIFY_PEER').and_return('false')
        allow(ENV).to receive(:[]).with('MONSOON_OPENSTACK_AUTH_API_ENDPOINT').and_return(keystone_endpoint)
        allow(ENV).to receive(:[]).with('MONSOON_DASHBOARD_REGION').and_return('eu-de-1')
      end

      it 'disables SSL verification when configured' do
        http_mock = instance_double(Net::HTTP)
        allow(Net::HTTP).to receive(:new).and_return(http_mock)
        allow(http_mock).to receive(:use_ssl=)
        allow(http_mock).to receive(:verify_mode=)
        allow(http_mock).to receive(:request).and_return(
          Net::HTTPOK.new('1.1', '200', 'OK').tap do |response|
            allow(response).to receive(:body).and_return({
              'token' => {
                'user' => {
                  'domain' => { 'name' => domain_name }
                }
              }
            }.to_json)
          end
        )

        post :verify, params: { token: valid_token }
        
        expect(http_mock).to have_received(:verify_mode=).with(0)
      end
    end
  end

  describe '#verify_authenticity_token' do
    context 'in development environment' do
      before do
        allow(Rails.env).to receive(:development?).and_return(true)
      end

      it 'skips CSRF protection' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end

    context 'in test environment' do
      before do
        allow(Rails.env).to receive(:test?).and_return(true)
      end

      it 'skips CSRF protection' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end

    context 'in production with allowed origin' do
      before do
        allow(Rails.env).to receive(:development?).and_return(false)
        allow(Rails.env).to receive(:test?).and_return(false)
        allow(ENV).to receive(:[]).with('MONSOON_DASHBOARD_REGION').and_return('eu-de-1')
        request.headers['Origin'] = 'https://identity-3.eu-de-1.cloud.sap'
      end

      it 'allows request from trusted origin' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end
  end

  describe '#allowed_origin?' do
    before do
      allow(ENV).to receive(:[]).with('MONSOON_DASHBOARD_REGION').and_return('eu-de-1')
    end

    it 'returns true for trusted origin' do
      request.headers['Origin'] = 'https://identity-3.eu-de-1.cloud.sap'
      expect(controller.send(:allowed_origin?)).to be true
    end

    it 'returns false for untrusted origin' do
      request.headers['Origin'] = 'https://malicious-site.com'
      expect(controller.send(:allowed_origin?)).to be false
    end

    it 'returns false when origin header is missing' do
      expect(controller.send(:allowed_origin?)).to be false
    end
  end

  describe '#encode_auth_token' do
    it 'uses MessageVerifier to encode token' do
      verifier = instance_double(ActiveSupport::MessageVerifier)
      allow(ActiveSupport::MessageVerifier).to receive(:new)
        .with(Rails.application.secret_key_base)
        .and_return(verifier)
      allow(verifier).to receive(:generate).with('test_token').and_return('encoded_token')

      result = controller.send(:encode_auth_token, 'test_token')
      
      expect(result).to eq('encoded_token')
    end
  end

  private

  def stub_keystone_request(token, response_object, response_body)
    http_mock = instance_double(Net::HTTP)
    request_mock = instance_double(Net::HTTP::Get)
    
    allow(Net::HTTP).to receive(:new).and_return(http_mock)
    allow(Net::HTTP::Get).to receive(:new).and_return(request_mock)
    
    allow(http_mock).to receive(:use_ssl=)
    allow(http_mock).to receive(:verify_mode=)
    allow(request_mock).to receive(:[]=)
    
    allow(response_object).to receive(:body).and_return(response_body.to_json)
    allow(http_mock).to receive(:request).and_return(response_object)
  end

  def stub_keystone_request_with_invalid_json(token)
    http_mock = instance_double(Net::HTTP)
    request_mock = instance_double(Net::HTTP::Get)
    response_mock = Net::HTTPOK.new('1.1', '200', 'OK')
    
    allow(Net::HTTP).to receive(:new).and_return(http_mock)
    allow(Net::HTTP::Get).to receive(:new).and_return(request_mock)
    
    allow(http_mock).to receive(:use_ssl=)
    allow(http_mock).to receive(:verify_mode=)
    allow(request_mock).to receive(:[]=)
    
    allow(response_mock).to receive(:body).and_return('invalid json response')
    allow(http_mock).to receive(:request).and_return(response_mock)
  end
end