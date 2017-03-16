require 'spec_helper'

describe Identity::Projects::RequestWizardController, type: :controller do
  routes { Identity::Engine.routes }



  default_params = {domain_id: AuthenticationStub.domain_id}

  before(:all) do
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
  end

  before(:each) do
    stub_authentication
    stub_admin_services

    identity_driver = double('identity_service_driver').as_null_object
    allow_any_instance_of(ServiceLayer::IdentityService).to receive(:driver).and_return(identity_driver)
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :new, default_params
      expect(response).to be_success
    end
  end

end
