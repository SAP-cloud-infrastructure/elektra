require 'spec_helper'

describe Compute::InstancesController, type: :controller do
  routes { Compute::Engine.routes }



  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    #DatabaseCleaner.clean
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
    FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],default_params[:project_id])
  end

  before :each do
    stub_authentication
    allow_any_instance_of(ServiceLayerNg::ComputeService)
      .to receive(:servers).and_return([])

    allow_any_instance_of(ServiceLayerNg::ComputeService)
      .to receive(:usage).and_return(double('usage', instances: 1, ram: 2, cores: 4))  
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :index, default_params
      expect(response).to be_success
    end
  end

end
