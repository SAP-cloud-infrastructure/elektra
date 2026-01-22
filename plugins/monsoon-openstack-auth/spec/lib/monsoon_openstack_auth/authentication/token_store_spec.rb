require 'spec_helper'

RSpec.describe MonsoonOpenstackAuth::Authentication::TokenStore do
  let(:session) { {} }
  let(:token_store) { described_class.new(session) }
  
  let(:domain_token) do
    HashWithIndifferentAccess.new({
      'value' => 'domain_token_123',
      'expires_at' => (Time.now + 1.hour).to_s,
      'issued_at' => Time.now.to_s,
      'domain' => {
        'id' => 'domain_123',
        'name' => 'test_domain'
      },
      'user' => {
        'id' => 'user_123',
        'name' => 'testuser',
        'domain' => {
          'id' => 'domain_123',
          'name' => 'test_domain'
        }
      }
    })
  end

  let(:project_token) do
    HashWithIndifferentAccess.new({
      'value' => 'project_token_456',
      'expires_at' => (Time.now + 1.hour).to_s,
      'issued_at' => Time.now.to_s,
      'project' => {
        'id' => 'project_456',
        'name' => 'test_project',
        'domain' => {
          'id' => 'domain_123',
          'name' => 'test_domain'
        }
      },
      'user' => {
        'id' => 'user_123',
        'name' => 'testuser',
        'domain' => {
          'id' => 'domain_123',
          'name' => 'test_domain'
        }
      }
    })
  end

  let(:unscoped_token) do
    HashWithIndifferentAccess.new({
      'value' => 'unscoped_token_789',
      'expires_at' => (Time.now + 1.hour).to_s,
      'issued_at' => Time.now.to_s,
      'user' => {
        'id' => 'user_123',
        'name' => 'testuser',
        'domain' => {
          'id' => 'domain_123',
          'name' => 'test_domain'
        }
      }
    })
  end

  let(:expired_token) do
    token = domain_token.deep_dup
    token['expires_at'] = (Time.now - 1.hour).to_s
    token['value'] = 'expired_token_999'
    token
  end

  describe '#initialize' do
    it 'initializes session structure' do
      token_store # This triggers initialization
      expect(session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME]).to be_a(Hash)
      expect(session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]).to eq({})
    end

    it 'reuses existing session structure if present' do
      existing_data = { tokens: { 'key' => 'value' } }
      session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME] = existing_data
      
      store = described_class.new(session)
      expect(session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]).to eq({ 'key' => 'value' })
    end
  end

  describe '#set_token' do
    it 'stores token with correct key' do
      token_store.set_token(domain_token)
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[domain_token['value']]).to eq(domain_token)
    end

    it 'returns token if already present with same value' do
      token_store.set_token(domain_token)
      result = token_store.set_token(domain_token)
      expect(result).to eq(domain_token)
    end

    it 'replaces token with same scope but different value' do
      token_store.set_token(domain_token)
      
      new_token = domain_token.deep_dup
      new_token['value'] = 'new_domain_token_123'
      
      token_store.set_token(new_token)
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[domain_token['value']]).to be_nil
      expect(tokens[new_token['value']]).to eq(new_token)
    end

    it 'allows multiple tokens for different projects in same domain' do
      token_store.set_token(domain_token)
      token_store.set_token(project_token)
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens.size).to eq(2)
      expect(tokens[domain_token['value']]).to eq(domain_token)
      expect(tokens[project_token['value']]).to eq(project_token)
    end

    it 'converts to HashWithIndifferentAccess if needed' do
      plain_hash = domain_token.to_hash
      token_store.set_token(plain_hash)
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      stored = tokens[domain_token['value']]
      expect(stored).to be_a(HashWithIndifferentAccess)
    end
  end

  describe '#find_by_scope' do
    context 'finding by domain' do
      before do
        token_store.set_token(domain_token)
      end

      it 'finds token by domain_id' do
        result = token_store.find_by_scope(domain_id: 'domain_123')
        expect(result['value']).to eq(domain_token['value'])
      end

      it 'finds token by domain_name' do
        result = token_store.find_by_scope(domain_name: 'test_domain')
        expect(result['value']).to eq(domain_token['value'])
      end
    end

    context 'finding by project' do
      before do
        token_store.set_token(project_token)
      end

      it 'finds token by project_id' do
        result = token_store.find_by_scope(project_id: 'project_456')
        expect(result['value']).to eq(project_token['value'])
      end

      it 'finds token by project_name' do
        result = token_store.find_by_scope(domain_name: "test_domain", project_name: 'test_project')
        expect(result['value']).to eq(project_token['value'])
      end

      it 'finds token by domain_id and project_id' do
        result = token_store.find_by_scope(domain_id: 'domain_123', project_id: 'project_456')
        expect(result['value']).to eq(project_token['value'])
      end

      it 'finds token by domain_name and project_name' do
        result = token_store.find_by_scope(domain_name: 'test_domain', project_name: 'test_project')
        expect(result['value']).to eq(project_token['value'])
      end
    end

    context 'finding unscoped token' do
      before do
        token_store.set_token(unscoped_token)
      end
      it 'finds unscoped token when no scope provided' do
        # Remove domain and project scoped tokens
        token_store.delete_token(domain_token)
        token_store.delete_token(project_token)
        
        result = token_store.find_by_scope({})
        expect(result['value']).to eq(unscoped_token['value'])
      end
    end

    context 'when token not found' do
      it 'returns nil for nonexistent project' do
        result = token_store.find_by_scope(project_id: 'nonexistent_project')
        expect(result).to be_nil
      end

      it 'returns nil for nonexistent domain' do
        result = token_store.find_by_scope(domain_id: 'nonexistent_domain')
        expect(result).to be_nil
      end
    end

    context 'with expired tokens' do
      it 'returns nil for expired token' do
        token_store.set_token(expired_token)
        result = token_store.find_by_scope(domain_id: expired_token['domain']['id'])
        expect(result).to be_nil
      end

      it 'deletes expired token when found' do
        token_store.set_token(expired_token)
        token_store.find_by_scope(domain_id: expired_token['domain']['id'])
        
        tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
        expect(tokens[expired_token['value']]).to be_nil
      end
    end
  end

  describe '#find_by_value' do
    before { token_store.set_token(domain_token) }

    it 'finds token by value' do
      result = token_store.find_by_value(domain_token['value'])
      expect(result['value']).to eq(domain_token['value'])
    end

    it 'returns nil for nonexistent value' do
      result = token_store.find_by_value('nonexistent_token')
      expect(result).to be_nil
    end

    it 'returns nil and deletes expired token' do
      token_store.set_token(expired_token)
      result = token_store.find_by_value(expired_token['value'])
      
      expect(result).to be_nil
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[expired_token['value']]).to be_nil
    end
  end

  describe '#find_all_by_user_domain' do
    let(:other_domain_token) do
      token = domain_token.deep_dup
      token['value'] = 'other_domain_token'
      token['domain']['id'] = 'other_domain'
      token['domain']['name'] = 'other_domain_name'
      token['user']['domain']['id'] = 'other_domain'
      token['user']['domain']['name'] = 'other_domain_name'
      token
    end

    before do
      token_store.set_token(domain_token)
      token_store.set_token(project_token)
      token_store.set_token(other_domain_token)
    end

    it 'finds all tokens by user domain ID' do
      results = token_store.find_all_by_user_domain('domain_123')
      expect(results.length).to eq(2) # domain_token and project_token
      expect(results.map { |t| t['value'] }).to include(domain_token['value'], project_token['value'])
    end

    it 'finds all tokens by user domain name' do
      results = token_store.find_all_by_user_domain('test_domain')
      expect(results.length).to eq(2)
    end

    it 'returns empty array if no tokens found' do
      results = token_store.find_all_by_user_domain('nonexistent_domain')
      expect(results).to eq([])
    end

  end

  describe '#delete_all_by_user_domain' do
    let(:other_domain_token) do
      token = domain_token.deep_dup
      token['value'] = 'other_domain_token'
      token['domain']['id'] = 'other_domain'
      token['domain']['name'] = 'other_domain_name'
      token['user']['domain']['id'] = 'other_domain'
      token['user']['domain']['name'] = 'other_domain_name'
      token
    end

    before do
      token_store.set_token(domain_token)
      token_store.set_token(project_token)
      token_store.set_token(other_domain_token)
    end

    it 'deletes all tokens for user domain by ID' do
      token_store.delete_all_by_user_domain('domain_123')
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[domain_token['value']]).to be_nil
      expect(tokens[project_token['value']]).to be_nil
      expect(tokens[other_domain_token['value']]).not_to be_nil
    end

    it 'deletes all tokens for user domain by name' do
      token_store.delete_all_by_user_domain('test_domain')
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[domain_token['value']]).to be_nil
      expect(tokens[project_token['value']]).to be_nil
      expect(tokens[other_domain_token['value']]).not_to be_nil
    end
  end

  describe '#delete_all_tokens' do
    before do
      token_store.set_token(domain_token)
      token_store.set_token(project_token)
    end

    it 'deletes all tokens' do
      token_store.delete_all_tokens
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens).to eq({})
    end
  end

  describe '#delete_token' do
    before do
      token_store.set_token(domain_token)
      token_store.set_token(project_token)
    end

    it 'deletes specific token' do
      token_store.delete_token(domain_token)
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens[domain_token['value']]).to be_nil
      expect(tokens[project_token['value']]).not_to be_nil
    end
  end

  describe '#token_valid?' do
    it 'returns true for valid token' do
      expect(token_store.token_valid?(domain_token)).to be true
    end

    it 'returns false for expired token' do
      expect(token_store.token_valid?(expired_token)).to be false
    end

    it 'returns false for token without expires_at' do
      token = domain_token.deep_dup
      token.delete('expires_at')
      expect(token_store.token_valid?(token)).to be false
    end
  end

  describe 'multi-domain token isolation' do
    let(:domain1_project_token) do
      token = project_token.deep_dup
      token['value'] = 'domain1_project_token'
      token['user']['domain']['id'] = 'domain1'
      token['user']['domain']['name'] = 'domain1_name'
      token['project']['domain']['id'] = 'domain1'
      token['project']['id'] = 'project1'
      token
    end

    let(:domain2_project_token) do
      token = project_token.deep_dup
      token['value'] = 'domain2_project_token'
      token['user']['domain']['id'] = 'domain2'
      token['user']['domain']['name'] = 'domain2_name'
      token['project']['domain']['id'] = 'domain2'
      token['project']['id'] = 'project2'
      token
    end

    before do
      token_store.set_token(domain1_project_token)
      token_store.set_token(domain2_project_token)
    end

    it 'isolates tokens by user domain' do
      domain1_tokens = token_store.find_all_by_user_domain('domain1')
      domain2_tokens = token_store.find_all_by_user_domain('domain2')
      
      expect(domain1_tokens.length).to eq(1)
      expect(domain2_tokens.length).to eq(1)
      expect(domain1_tokens.first['value']).to eq('domain1_project_token')
      expect(domain2_tokens.first['value']).to eq('domain2_project_token')
    end

    it 'deletes only tokens from specified user domain' do
      token_store.delete_all_by_user_domain('domain1')
      
      tokens = session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens]
      expect(tokens['domain1_project_token']).to be_nil
      expect(tokens['domain2_project_token']).not_to be_nil
    end
  end
end
