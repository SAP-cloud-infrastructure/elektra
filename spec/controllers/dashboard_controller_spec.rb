require 'spec_helper'

describe DashboardController, type: :controller do
  controller do
    def index
      head :ok
    end
  end

  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
    FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],default_params[:project_id])
  end

  before :each do
    stub_authentication
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :index, {domain_id: AuthenticationStub.domain_id}
      expect(response).to be_success
    end
  end

  describe 'rescope_token' do
    context 'project id is provided' do
      context 'and user has access to project' do
        before :each do
          project = double('Project', id: default_params[:project_id])
          allow(controller.service_user.identity).to receive(:user_projects).and_return([project])
        end

        it 'should rescope' do
          expect(controller).to receive(:authentication_rescope_token)
          get :index, default_params
        end
      end
      context 'and user has no access to project' do
        before :each do
          project = double('Project', id: '123456')
          allow(controller.service_user.identity).to receive(:user_projects).and_return([project])
        end

        it 'should render unauthorized page' do
          get :index, default_params
          expect(response).to render_template('application/exceptions/unauthorized')
        end
      end

      context 'and project does not exists' do
        before :each do
          allow_any_instance_of(Dashboard::RescopingService).to(
            receive(:project_friendly_id)
              .with(default_params[:domain_id], 'BAD_PROJECT').and_return(nil)
          )
        end
        it 'should render project not found page' do
          get :index, domain_id: default_params[:domain_id], project_id: 'BAD_PROJECT'
          expect(response).to render_template('application/exceptions/project_not_found')
        end
      end

      context 'and user has no access to the requested domain' do
        before :each do
          allow(Rails.cache).to receive(:fetch)
            .with("user_domain_role_assignments/#{AuthenticationStub.test_token['user']['id']}/#{default_params[:domain_id]}", anything)
            .and_return false
        end

        it 'should return with ok header' do
          get :index, default_params
          expect(response).to have_http_status(200)
        end

        it 'should not render unauthorized template' do
          get :index, default_params
          expect(response).not_to render_template('application/exceptions/unauthorized')
        end
      end
    end

    context 'project id is nil and domain id is provided' do
      context 'and user has access to domain' do
        before :each do
          allow(Rails.cache).to receive(:fetch)
            .with("user_domain_role_assignments/#{AuthenticationStub.test_token['user']['id']}/#{default_params[:domain_id]}", anything)
            .and_return true
        end

        it 'should return with ok header' do
          get :index, domain_id: default_params[:domain_id]
          expect(response).to have_http_status(200)
        end

        it 'should render the domain page' do
          expect(controller).to receive(:authentication_rescope_token)
          get :index, { domain_id: default_params[:domain_id] }
        end
      end

      context 'and user has no access to the requested domain' do
        before :each do
          allow(Rails.cache).to receive(:fetch)
            .with("user_domain_role_assignments/#{AuthenticationStub.test_token['user']['id']}/#{default_params[:domain_id]}", anything)
            .and_return false
        end

        it 'should return with ok header' do
          get :index, domain_id: default_params[:domain_id]
          expect(response).to have_http_status(200)
        end

        it 'should not render unauthorized template' do
          get :index, domain_id: default_params[:domain_id]
          expect(response).not_to render_template('application/exceptions/unauthorized')
        end

        it 'should rescope to unscoped token' do
          expect(controller).to receive(:authentication_rescope_token).with(
            domain: nil, project: nil
          )
          get :index, domain_id: default_params[:domain_id]
        end
      end
    end
  end
end
