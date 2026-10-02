require 'spec_helper'

describe MonsoonOpenstackAuth::PasswordSyncController, type: :controller do
  let(:domain_id) { 'test_domain_123' }
  let(:user_id) { 'D123456' }
  let(:password) { 'new-password' }

  before do
    @routes = MonsoonOpenstackAuth::Engine.routes
  end

  describe 'GET #new' do
    it 'renders the sync form' do
      get :new, params: { domain_fid: domain_id }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST #create' do
    let(:sync_service) { instance_double(MonsoonOpenstackAuth::Authentication::PasswordSync) }

    before do
      allow(MonsoonOpenstackAuth::Authentication::PasswordSync).to receive(:new).and_return(sync_service)
    end

    def result(status, message = 'msg')
      MonsoonOpenstackAuth::Authentication::PasswordSync::Result.new(status: status, message: message)
    end

    it 'passes the user id and password to the sync service' do
      expect(sync_service).to receive(:call).with(user_id, password)
        .and_return(result(MonsoonOpenstackAuth::Authentication::PasswordSync::SUCCESS))

      post :create, params: { domain_fid: domain_id, username: user_id, password: password }
    end

    context 'on success' do
      before do
        allow(sync_service).to receive(:call)
          .and_return(result(MonsoonOpenstackAuth::Authentication::PasswordSync::SUCCESS, 'synced'))
      end

      it 'renders the page with the synced state and a notice' do
        post :create, params: { domain_fid: domain_id, username: user_id, password: password }

        expect(response).to have_http_status(:success)
        expect(assigns(:synced)).to be true
        expect(flash.now[:notice]).to eq('synced')
      end

      it 'never creates a session' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession).not_to receive(:create_from_login_form)

        post :create, params: { domain_fid: domain_id, username: user_id, password: password }
      end
    end

    context 'on invalid credentials' do
      before do
        allow(sync_service).to receive(:call)
          .and_return(result(MonsoonOpenstackAuth::Authentication::PasswordSync::INVALID_CREDENTIALS, 'nope'))
      end

      it 'renders the page with an error' do
        post :create, params: { domain_fid: domain_id, username: user_id, password: password }

        expect(response).to have_http_status(:success)
        expect(assigns(:error)).to eq('nope')
        expect(flash.now[:alert]).to eq('nope')
      end
    end

    context 'on service unavailable' do
      before do
        allow(sync_service).to receive(:call)
          .and_return(result(MonsoonOpenstackAuth::Authentication::PasswordSync::SERVICE_UNAVAILABLE, 'later'))
      end

      it 'renders the page with the service-unavailable state' do
        post :create, params: { domain_fid: domain_id, username: user_id, password: password }

        expect(response).to have_http_status(:success)
        expect(assigns(:service_unavailable)).to be true
        expect(flash.now[:alert]).to eq('later')
      end
    end
  end
end
