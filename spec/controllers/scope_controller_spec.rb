require 'spec_helper'

describe ScopeController, type: :controller do
  controller do
    def index
      head :ok
    end
  end

  default_params = {domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id}

  before(:all) do
    @domain_friendly_id = FriendlyIdEntry.find_or_create_entry('Domain',nil,default_params[:domain_id],'default 1')
    @project_friendly_id = FriendlyIdEntry.find_or_create_entry('Project',default_params[:domain_id],default_params[:project_id],'project 1')
  end

  before :each do
    stub_authentication
  end

  context "domain_id is provided, project_id is not provided" do

    request_params = {domain_id: default_params[:domain_id]}

    describe "GET 'index'" do
      it "returns http success" do
        get :index, params: {domain_id: @domain_friendly_id.slug}
        expect(response).to be_success
      end

      it "redirects to the same action with friendly ids for domain" do
        get :index, params: {domain_id: AuthenticationStub.domain_id}
        expect(response).to redirect_to("/#{@domain_friendly_id.slug}/scope")
      end
    end
  end

  context "domain_id and project_id are provided" do

    describe "GET 'index'" do
      it "returns http success" do
        get :index, params: {domain_id: @domain_friendly_id.slug, project_id: @project_friendly_id.slug}
        expect(response).to be_success
      end

      it "redirects to the same action with friendly ids for domain and project" do
        get :index, params: default_params
        expect(response).to redirect_to("/#{@domain_friendly_id.slug}/scope")
      end
    end
  end

end
