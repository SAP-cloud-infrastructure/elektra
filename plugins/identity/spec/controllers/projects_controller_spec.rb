# frozen_string_literal: true

require 'spec_helper'

describe Identity::ProjectsController, type: :controller do
  routes { Identity::Engine.routes }

  default_params = { domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id }

  before(:all) do
    # DatabaseCleaner.clean
    @domain_friendly_id_entry = FriendlyIdEntry.find_or_create_entry(
      'Domain', nil, default_params[:domain_id], 'default'
    )
    @project_friendly_id_entry = FriendlyIdEntry.find_or_create_entry(
      'Project', default_params[:domain_id], default_params[:project_id],
      default_params[:project_id]
    )
  end

  before :each do
    stub_authentication
    allow(UserProfile).to receive(:tou_accepted?).and_return true
  end

  describe 'GET index' do
    it 'returns http success' do
      get :user_projects, params: default_params
      expect(response).to be_success
    end
  end

  describe 'GET show' do
    subject { get :show, params: default_params }

    before :each do
      @profile = ProjectProfile
                 .find_or_create_by_project_id(default_params[:project_id])
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:cost_control).and_return(true)
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:networking).and_return(true)
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:resource_management).and_return(true)
    end

    context 'unfinshed wizard state' do
      before :each do
        @profile.update_wizard_status('cost_control', nil)
        @profile.update_wizard_status('resource_management', nil)
        @profile.update_wizard_status('networking', nil)
      end

      it 'should redirect to the wizard page' do
        expect(subject).to redirect_to(
          action: :show_wizard, domain_id: default_params[:domain_id],
          project_id: default_params[:project_id]
        )
      end
    end

    context 'wizard finished' do
      before :each do
        @profile.update_wizard_status('cost_control',
                                      ProjectProfile::STATUS_DONE)
        @profile.update_wizard_status('resource_management',
                                      ProjectProfile::STATUS_DONE)
        @profile.update_wizard_status('networking', ProjectProfile::STATUS_DONE)
      end

      it 'should render project page' do
        expect(subject).to render_template(:show)
      end
    end
  end

  describe 'GET show_wizard' do
    subject { get :show_wizard, params: default_params, xhr: true}
    before :each do
      @profile = ProjectProfile
                 .find_or_create_by_project_id(default_params[:project_id])
      @profile.update_wizard_status('cost_control', nil)
      @profile.update_wizard_status('resource_management', nil)
      @profile.update_wizard_status('networking', nil)
      allow(controller)
        .to receive(:update_resource_management_wizard_status).and_return(true)
      allow(controller)
        .to receive(:update_networking_wizard_status).and_return(true)
      allow(controller)
        .to receive(:update_cost_control_wizard_status).and_return(true)
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:cost_control).and_return(true)
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:networking).and_return(true)
      allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
        .to receive(:available?).with(:resource_management).and_return(true)
    end

    it 'should set wizard_finished to true' do
      subject
      expect(assigns(:wizard_finished)).to eq(true)
    end

    context 'cost_control is not finished' do
      before :each do
        allow(controller)
          .to receive(:update_cost_control_wizard_status).and_return(false)
      end

      it 'should set wizard_finished to false' do
        subject
        expect(assigns(:wizard_finished)).to eq(false)
      end
    end

    context 'networking is not finished' do
      before :each do
        allow(controller)
          .to receive(:update_networking_wizard_status).and_return(false)
      end

      it 'should set wizard_finished to false' do
        subject
        expect(assigns(:wizard_finished)).to eq(false)
      end
    end

    context 'cost_control service is not available' do
      before :each do
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:cost_control).and_return(false)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:networking).and_return(true)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:resource_management).and_return(true)
      end

      it 'should set resource_management_service_available to enabled' do
        subject
        expect(assigns(:resource_management_service_available)).to eq(true)
      end

      it 'should set networking_service_available to enabled' do
        subject
        expect(assigns(:networking_service_available)).to eq(true)
      end

      it 'should not set cost_control_service_available' do
        subject
        expect(assigns(:cost_control_service_available)).to be(nil)
      end

      it 'should set wizard_finished to true' do
        subject
        expect(assigns(:wizard_finished)).to eq(true)
      end
    end

    context 'cost_control and networking services are not available' do
      before :each do
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:cost_control).and_return(false)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:networking).and_return(false)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:resource_management).and_return(true)
      end

      it 'should set resource_management_service_available to enabled' do
        subject
        expect(assigns(:resource_management_service_available)).to eq(true)
      end

      it 'should not set networking_service_available' do
        subject
        expect(assigns(:networking_service_available)).to be(nil)
      end

      it 'should not set cost_control_service_available' do
        subject
        expect(assigns(:cost_control_service_available)).not_to eq(true)
      end

      it 'should set wizard_finished to true' do
        subject
        expect(assigns(:wizard_finished)).to eq(true)
      end
    end

    context 'no service is available' do
      before :each do
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:cost_control).and_return(false)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:networking).and_return(false)
        allow_any_instance_of(::Core::ServiceLayer::ServicesManager)
          .to receive(:available?).with(:resource_management).and_return(false)
      end

      it 'should no set resource_management_service_available' do
        subject
        expect(assigns(:resource_management_service_available)).to be(nil)
      end

      it 'should not set networking_service_available' do
        subject
        expect(assigns(:networking_service_available)).to be(nil)
      end

      it 'should not set cost_control_service_available' do
        subject
        expect(assigns(:cost_control_service_available)).to be(nil)
      end

      it 'should set wizard_finished to true' do
        subject
        expect(assigns(:wizard_finished)).to eq(true)
      end
    end
  end
end
