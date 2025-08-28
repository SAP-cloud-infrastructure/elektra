# frozen_string_literal: true

require "spec_helper"

describe "PLUGIN_NAME_CAMELIZE"::ApplicationController, type: :controller do
  routes { "PLUGIN_NAME_CAMELIZE"::Engine.routes }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      "Domain",
      nil,
      default_params[:domain_id],
      "default",
    )
    FriendlyIdEntry.find_or_create_entry(
      "Project",
      default_params[:domain_id],
      default_params[:project_id],
      default_params[:project_id],
    )
  end

  before :each do
    stub_authentication
  end

  describe "GET index" do
    it "returns http success" do
      get :show, params: default_params
      expect(response).to be_successful
    end
  end
end
