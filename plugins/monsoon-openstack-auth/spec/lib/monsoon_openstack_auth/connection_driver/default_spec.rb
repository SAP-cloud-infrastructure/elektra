require 'spec_helper'

describe MonsoonOpenstackAuth::ConnectionDriver::Default do
  before :each do
    @connection = double('excon').as_null_object
    allow(::Excon).to receive(:new).and_return(@connection)
    @driver = MonsoonOpenstackAuth::ConnectionDriver::Default.new

    allow(@driver).to receive(:authenticate)
  end

  describe 'validate_token' do
    it 'should call get method on connection with headers' do
      expect(@connection).to receive(:get).with(
        headers: {
          'Content-Type' => 'application/json',
          'X-Auth-Token' => 'token',
          'X-Subject-Token' => 'token'
        }
      )
      @driver.validate_token('token')
    end
  end


  describe 'authenticate_with_credentials' do
    context 'user_domain_params are nil' do
      it 'should call authenitcate without scope' do
        @driver.authenticate_with_credentials('user', 'password')
        expect(@driver).to have_received(:authenticate).with(
          auth: {
            identity: {
              methods: ['password'],
              password: { user: { id: 'user', password: 'password' } }
            }
          }
        )
      end
    end

    context 'user_domain_params contains domain key' do
      it 'should call authenitcate with scope including domain id' do
        @driver.authenticate_with_credentials(
          'user', 'password', domain: 'default'
        )
        expect(@driver).to have_received(:authenticate).with(
          auth: {
            identity: {
              methods: ['password'],
              password: {
                user: {
                  name: 'user',
                  password: 'password',
                  domain: { id: 'default' }
                }
              }
            }
          }
        )
      end
    end

    context 'user_domain_params contains domain_name key' do
      it 'should authenticate with domain_id' do
        # First call with domain_name fails
        expect(@driver).to receive(:authenticate).with(
          hash_including(auth: {
            identity: {
              methods: ['password'],
              password: {
                user: {
                  name: 'user',
                  password: 'password',
                  domain: { id: 'default' }
                }
              }
            }
          }
        )).and_return(true)

        result = @driver.authenticate_with_credentials(
          'user', 'password', domain: 'default'
        )
      end
    end

    it 'should retry with domain_id when domain_name fails' do
      call_count = 0
      allow(@driver).to receive(:authenticate) do |auth|
        call_count += 1
        if call_count == 1
          # First call should have domain name
          expect(auth[:auth][:identity][:password][:user][:domain]).to eq({ name: 'default' })
          raise StandardError.new("Auth failed")
        else
          # Second call should have domain id
          expect(auth[:auth][:identity][:password][:user][:domain]).to eq({ id: 'default' })
          true
        end
      end

      result = @driver.authenticate_with_credentials(
        'user', 'password', domain_name: 'default'
      )
      
      expect(@driver).to have_received(:authenticate).twice
      expect(result).to eq(true)
    end
  end

  describe 'authenticate_with_token' do
    context 'scope is nil' do
      it 'should call authenitcate without scope' do
        @driver.authenticate_with_token('test_token')
        expect(@driver).to have_received(:authenticate).with({ auth: { identity: {methods: ['token'], token: {id: 'test_token'} }}}   )
      end
    end

    context 'scope is not nil' do
      it 'should call authenitcate with scope' do
        @driver.authenticate_with_token('test_token', domain: { id: 'default' })
        expect(@driver).to have_received(:authenticate).with(
          auth: {
            identity: { methods: ['token'], token: { id: 'test_token' } },
            scope: { domain: { id: 'default' } }
          }
        )
      end
    end
  end

  describe 'authenticate_with_access_key' do
    context 'scope is nil' do
      it 'should call authenitcate without scope' do
        @driver.authenticate_with_access_key('key')
        expect(@driver).to have_received(:authenticate).with(
          auth: {
            identity: { methods: ['access-key'], access_key: { key: 'key' } }
          }
        )
      end
    end

    context 'scope is not nil' do
      it 'should call authenitcate with scope' do
        @driver.authenticate_with_access_key('key', domain: { id: 'default' })
        expect(@driver).to have_received(:authenticate).with(
          auth: {
            identity: {
              methods: ['access-key'], access_key: { key: 'key' }
            },
            scope: { domain: { id: 'default' } }
          }
        )
      end
    end
  end

  describe 'authenticate_external_user' do
    context 'scope is nil' do
      it 'should call authenitcate without scope' do
        @driver.authenticate_external_user('test')
        expect(@driver).to have_received(:authenticate).with(
          {
            auth: {
              identity: {
                methods: ['external'],
                external: {}
              },
              scope: 'unscoped'
            }
          }, 'test'
        )
      end
    end

    context 'scope is not nil' do
      it 'should call authenitcate with scope' do
        @driver.authenticate_external_user('test', domain: 'default')
        expect(@driver).to have_received(:authenticate).with(
          {
            auth: {
              identity: {
                methods: ['external'],
                external: {}
              },
              scope: { domain: 'default' }
            }
          }, 'test'
        )
      end
    end
  end

end
