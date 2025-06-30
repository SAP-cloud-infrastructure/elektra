# frozen_string_literal: true

require "spec_helper"
require_relative "../factories/factories"

describe Automation::RunsController, type: :controller, :skip do
  routes { Automation::Engine.routes }

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
    client = double("arc_client").as_null_object
    automation_service = double("automation_service").as_null_object
    automation_run_service = double("automation_run_service").as_null_object

    allow(UserProfile).to receive(:tou_accepted?).and_return(true)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :elektron,
    ).and_return(double("elektron").as_null_object)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :client,
    ).and_return(client)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :automation_service,
    ).and_return(automation_service)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :automation_run_service,
    ).and_return(automation_run_service)
  end

  describe "GET 'show'" do
    context "automation_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token["roles"] << {
            "id" => "automation_role",
            "name" => "automation_admin",
          }
          token
        end
      end
      it "returns http success" do
        get :show, params: default_params.merge(id: "run_id")
        expect(response).to be_successful
        expect(response).to render_template(:show)
      end
    end
    context "automation_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token["roles"] << {
            "id" => "automation_role",
            "name" => "automation_viewer",
          }
          token
        end
      end
      it "returns http success" do
        get :show, params: default_params.merge(id: "run_id")
        expect(response).to be_successful
        expect(response).to render_template(:show)
      end
    end
    context "other roles" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token
        end
      end
      it "not allowed" do
        get :show, params: default_params.merge(id: "run_id")
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'show_log'" do
    context "automation_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token["roles"] << {
            "id" => "automation_role",
            "name" => "automation_admin",
          }
          token
        end
      end
      it "returns http success" do
        get :show_log, params: default_params.merge(id: "run_id")
        expect(response).to be_successful
        expect(response).to render_template(:show_log)
      end
    end
    context "automation_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token["roles"] << {
            "id" => "automation_role",
            "name" => "automation_viewer",
          }
          token
        end
      end
      it "returns http success" do
        get :show_log, params: default_params.merge(id: "run_id")
        expect(response).to be_successful
        expect(response).to render_template(:show_log)
      end
    end
    context "other roles" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
          token
        end
      end
      it "not allowed" do
        get :show_log, params: default_params.merge(id: "run_id")
        expect(response).to_not be_successful
      end
    end
  end
end
