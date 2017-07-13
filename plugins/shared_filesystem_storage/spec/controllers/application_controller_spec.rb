require 'spec_helper'

describe SharedFilesystemStorage::ApplicationController, type: :controller do
  routes { SharedFilesystemStorage::Engine.routes }

  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default')
    FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],default_params[:project_id])
  end

  before :each do
    stub_authentication
  end

  describe "GET 'show'" do
    it "returns http success" do
      get :show, default_params
      expect(response).to be_success
    end
  end
end
