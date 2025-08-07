# frozen_string_literal: true

require "spec_helper"
require_relative "../factories/factories"

describe Automation::AutomationsController, type: :controller do
  skip "Temporarily skipping all tests in this file"
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
    @automation_service = double("automation_service").as_null_object
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
    ).and_return(@automation_service)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :automation_run_service,
    ).and_return(automation_run_service)
  end

  describe "GET 'index'" do
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
        get :index, params: default_params
        expect(response).to be_successful
        expect(response).to render_template(:index)
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
        get :index, params: default_params
        expect(response).to be_successful
        expect(response).to render_template(:index)
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
        get :index, params: default_params
        expect(response).to_not be_successful
      end
    end

    describe "@pag_params" do
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
      it "should set up pagination object" do
        get :index, params: default_params
        expect(assigns(:pag_params)).to eq(
          automation: {
            page: 0,
          },
          run: {
            page: 0,
          },
        )
      end

      it "should set the righ params when loading the page" do
        get :index,
            params:
              default_params.merge(
                pag_params: {
                  automation: {
                    page: "2",
                  },
                  run: {
                    page: "3",
                  },
                },
              )
        expect(assigns(:pag_params)).to eq(
          automation: {
            page: "2",
          },
          run: {
            page: "3",
          },
        )
      end

      it "should updated just the run param when ajax" do
        get :index,
            params: default_params.merge(page: "5", model: "run"),
            xhr: true
        expect(assigns(:pag_params)).to eq(
          automation: {
            page: 0,
          },
          run: {
            page: "5",
          },
        )
      end

      it "should updated just the automation param when ajax" do
        get :index,
            params: default_params.merge(page: "5", model: "automation"),
            xhr: true
        expect(assigns(:pag_params)).to eq(
          automation: {
            page: "5",
          },
          run: {
            page: 0,
          },
        )
      end
    end
  end

  describe "GET 'new'" do
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
        get :new, params: default_params
        expect(response).to be_successful
        expect(response).to render_template(:new)
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
      it "not allowed" do
        get :new, params: default_params
        expect(response).to_not be_successful
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
        get :new, params: default_params
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'create'" do
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
      it "redirect when automation valid" do
        automation = ::Automation::FakeFactory.new.automation_form_chef
        expect(
          post(
            :create,
            params:
              default_params.merge(
                forms_chef_automation: automation.attributes,
              ),
          ),
        ).to redirect_to(automations_path(default_params))
      end

      it "return success and render new when automation invalid" do
        post :create, params: default_params
        expect(response).to be_successful
        expect(response).to render_template(:new)
        expect(flash.now[:error]).to_not be_nil
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
      it "not allowed" do
        post :create, params: default_params
        expect(response).to_not be_successful
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
        post :create, params: default_params
        expect(response).to_not be_successful
      end
    end
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )

        get :show, params: default_params.merge(id: "automation_id")
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )
        get :show, params: default_params.merge(id: "automation_id")
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )
        get :show, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'edit'" do
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )

        get :edit, params: default_params.merge(id: "automation_id")
        expect(response).to be_successful
        expect(response).to render_template(:edit)
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
      it "not allowed" do
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )
        get :edit, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )
        get :edit, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'update'" do
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
      it "should return to the edit view with an error if type have been changed" do
        automation = ::Automation::FakeFactory.new.automation_form_chef
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :automation,
        ).and_return(automation)

        get :update,
            params:
              default_params.merge(
                id: "automation_id",
                forms_chef_automation:
                  automation.attributes.merge(type: "other_type"),
              )
        expect(response).to be_successful
        expect(response).to render_template(:edit)
        expect(flash.now[:error]).to_not be_nil
      end

      it "returns http success and shows edit view when automation is invalid" do
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )

        get :update, params: default_params.merge(id: "automation_id")
        expect(response).to be_successful
        expect(response).to render_template(:edit)
      end

      it "should redirect to the automations index view when update is successful" do
        automation = ::Automation::FakeFactory.new.automation_form_chef
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :automation,
        ).and_return(automation)

        expect(
          get(
            :update,
            params:
              default_params.merge(
                id: "automation_id",
                forms_chef_automation: automation.attributes,
              ),
          ),
        ).to redirect_to(automations_path(default_params))
      end

      it "something wrong happens show a flash error" do
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :automation,
        ).and_raise
        get :update, params: default_params.merge(id: "automation_id")
        expect(response).to be_successful
        expect(response).to render_template(:edit)
        expect(flash.now[:error]).to_not be_nil
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
      it "not allowed" do
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )

        get :update, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
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
        allow(@automation_service).to receive(:attributes_to_form).and_return(
          {},
        )

        get :update, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'destroy'" do
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
      it "returns http success and renders view" do
        delete :destroy, params: default_params.merge(id: "automation_id")
        expect(response).to be_successful
        expect(response).to render_template(
          "automation/automations/update_item",
        )
      end

      it "something wrong happens show a flash error" do
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :automation,
        ).and_raise
        delete :destroy, params: default_params.merge(id: "automation_id")
        expect(response).to be_successful
        expect(response).to render_template(
          "automation/automations/update_item",
        )
        expect(flash.now[:error]).to_not be_nil
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
      it "not allowed" do
        delete :destroy, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
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
        delete :destroy, params: default_params.merge(id: "automation_id")
        expect(response).to_not be_successful
      end
    end
  end
end
