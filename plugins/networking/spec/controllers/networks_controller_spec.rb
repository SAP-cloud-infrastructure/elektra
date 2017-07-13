require 'spec_helper'

describe Networking::Networks::PrivateController, type: :controller do
  routes { Networking::Engine.routes }



  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    #DatabaseCleaner.clean
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
    FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],default_params[:project_id])
  end

  before :each do
    stub_authentication
    allow_any_instance_of(ServiceLayerNg::NetworkingService)
      .to receive(:api).and_return(
        double('api', networking: double('networking').as_null_object)
      )
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :index, default_params
      expect(response).to be_success
    end
  end
end
