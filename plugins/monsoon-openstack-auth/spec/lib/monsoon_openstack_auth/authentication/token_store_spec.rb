require 'spec_helper'

describe MonsoonOpenstackAuth::Authentication::TokenStore do
  before :each do
    @session = {}
    @session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME] = { tokens: {} }
    tokens = {}

    6.times do |i|
      tokens["token#{i}"] = HashWithIndifferentAccess.new({
        expires_at: (Time.now+1.hour).to_s,
        value: "token#{i}"
      })
      if i%2==0
        tokens["token#{i}"][:domain] = {id: "id#{i}", name: "domain#{i}"}
      else
        tokens["token#{i}"][:project] = {id: "id#{i}", name: "project#{i}", domain: {id: "id#{i-1}", name: "domain#{i-1}"}}
      end
    end
    tokens["token6"] = HashWithIndifferentAccess.new({
      expires_at: (Time.now+1.hour).to_s,
      value: "token6"
    })

    tokens["token7"] = HashWithIndifferentAccess.new({
      expires_at: (Time.now+1.hour).to_s,
      value: "token7",
      domain: {id: 7, name: "domain7"}
    })

    tokens["token8"] = HashWithIndifferentAccess.new({
      expires_at: (Time.now+1.hour).to_s,
      value: "token8",
      domain: {id: 7, name: "domain7"}
    })


    @tokens = @session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME][:tokens] = tokens
    @store = MonsoonOpenstackAuth::Authentication::TokenStore.new(@session)
  end

  describe 'initialize' do
    it "should create a new token_store object" do
      expect(MonsoonOpenstackAuth::Authentication::TokenStore.new(@session)).not_to be(nil)
    end
  end

  describe '#find_by_scope' do
    # find_token_by_scope(scope={domain_id:nil,domain_name:nil,project_id:nil,project_name:nil})
    it "should find one token by domain name" do
      expect(@store.find_by_scope(domain_name: 'domain0')).to eq(HashWithIndifferentAccess.new(@tokens["token0"]))
    end

    it "should find one token by domain id" do
      expect(@store.find_by_scope(domain_id: 'id2')).to eq(HashWithIndifferentAccess.new(@tokens["token2"]))
    end

    it "should find one token by domain name and project id" do
      expect(@store.find_by_scope(domain_name: 'domain0', project_id: 'id1')).to eq(HashWithIndifferentAccess.new(@tokens["token1"]))
    end

    it "should find one token by domain id and project id" do
      expect(@store.find_by_scope(domain_id: 'id0', project_id: 'id1')).to eq(HashWithIndifferentAccess.new(@tokens["token1"]))
    end

    it "should find one token by domain name and project name" do
      expect(@store.find_by_scope(domain_name: 'domain2', project_name: 'project3')).to eq(HashWithIndifferentAccess.new(@tokens["token3"]))
    end

    it "should find one token by domain id and project name" do
      expect(@store.find_by_scope(domain_id: 'id2', project_name: 'project3')).to eq(HashWithIndifferentAccess.new(@tokens["token3"]))
    end

    it "should not find token by domain id" do
      expect(@store.find_by_scope(domain_id: 'id3')).to be(nil)
    end
  end

  describe 'set_token' do

    context "token store is empty" do

    end

    context "token store contains already tokens" do
      # try to add token with the same value
      it "should do nothing" do
        token = {
          domain: {id: "id0", name: "domain0"},
          expires_at: (Time.now+1.hour).to_s,
          value: "token0"
        }
        expect(@store.instance_variable_get(:@tokens)).not_to receive(:[]=)
        @store.set_token(token)
      end

      it "should update existing token by domain" do
        token = {
          domain: {id: "id2", name: "domain2"},
          expires_at: (Time.now+1.hour).to_s,
          value: "token_new"
        }
        expect {
          expect(@store.instance_variable_get(:@tokens)).to receive(:[]=).and_call_original
          @store.set_token(token)
        }.not_to change(@store.instance_variable_get(:@tokens), :size)
      end

      it "should update existing token by domain and project" do
        token = {
          project: {id: "id3", name: "project3", domain: {id: "id2", name: "domain2"}},
          expires_at: (Time.now+1.hour).to_s,
          value: "token_xx"
        }
        expect {
          expect(@store.instance_variable_get(:@tokens)).to receive(:[]=).and_call_original
          @store.set_token(token)
        }.not_to change(@store.instance_variable_get(:@tokens), :size)
      end

      it "should add new token" do
        token = {
          domain: {id: "id10", name: "domain10"},
          expires_at: (Time.now+1.hour).to_s,
          value: "token_10"
        }
        expect {
          expect(@store.instance_variable_get(:@tokens)).to receive(:[]=).and_call_original
          @store.set_token(token)
        }.to change(@store.instance_variable_get(:@tokens), :size).by(1)
      end

    end
  end

  # describe "token store object" do
  #   describe "token_presented?" do
  #     context "token is presented" do
  #       let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ monsoon_openstack_auth_token: ApiStub.keystone_token.merge(expires_at:(Time.now+1.day).to_s )}) }
  #
  #       it "should return true" do
  #         expect(token_store.token_presented?).to eq(true)
  #       end
  #     end
  #
  #     context "token is empty" do
  #       let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ }) }
  #       it "should return false" do
  #         expect(token_store.token_presented?).to eq(false)
  #       end
  #     end
  #   end
  #
  #   describe "token_valid?" do
  #     context "token is presented and valid" do
  #       let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ monsoon_openstack_auth_token: ApiStub.keystone_token.merge(expires_at:(Time.now+1.day).to_s )}) }
  #
  #       it "should return true" do
  #         expect(token_store.token_valid?).to eq(true)
  #       end
  #     end
  #
  #     context "token is not presented" do
  #       let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ }) }
  #       it "should return false" do
  #         expect(token_store.token_valid?).to eq(false)
  #       end
  #     end
  #
  #     context "token is presented but invalid" do
  #       let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ monsoon_openstack_auth_token: ApiStub.keystone_token.merge(expires_at:(Time.now-1.day).to_s ) }) }
  #       it "should return false" do
  #         expect(token_store.token_valid?).to eq(false)
  #       end
  #     end
  #   end
  #
  #   describe "token_eql?" do
  #     let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ monsoon_openstack_auth_token: ApiStub.keystone_token.merge(value:ApiStub.keystone_token["value"])}) }
  #
  #     it "should return true" do
  #       expect(token_store.token_eql?(ApiStub.keystone_token["value"])).to eq(true)
  #     end
  #
  #     it "should return false" do
  #       expect(token_store.token_eql?(ApiStub.authority_token["value"])).to eq(false)
  #     end
  #   end
  #
  #   describe "token" do
  #     let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({ monsoon_openstack_auth_token: ApiStub.keystone_token}) }
  #     it "should return the token" do
  #       expect(token_store.token).to eq(ApiStub.keystone_token)
  #     end
  #   end
  #
  #   describe "token=" do
  #     let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({})}
  #     it "should set token" do
  #       token_store.token=ApiStub.keystone_token
  #       expect(token_store.token).to eq(ApiStub.keystone_token)
  #     end
  #   end
  #
  #   describe "delete_token" do
  #     let(:token_store) { MonsoonOpenstackAuth::Authentication::TokenStore.new({monsoon_openstack_auth_token: ApiStub.keystone_token})}
  #     it "should delete token" do
  #       expect(token_store.token).to eq(ApiStub.keystone_token)
  #       token_store.delete_token
  #       expect(token_store.token).to eq(nil)
  #     end
  #   end
  # end
end
