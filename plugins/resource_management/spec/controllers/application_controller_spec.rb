require 'spec_helper'

describe ResourceManagement::DomainAdminController, type: :controller do
  routes { ResourceManagement::Engine.routes }

  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
    FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],default_params[:project_id])
  end

  before :each do
    stub_authentication do |token|
      # domain admin
      token["roles"] << {"id"=>"2", "name"=>"admin"}
      token["domain"] = {"id"=>"1", "name"=>"test"}
    end
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :index, params: default_params
      expect(response).to be_success
    end
  end
end
