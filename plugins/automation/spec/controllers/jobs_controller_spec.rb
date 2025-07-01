# frozen_string_literal: true

require "spec_helper"
require_relative "../factories/factories"

describe Automation::JobsController, type: :controller  do
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
    before :each do
      @job = ::Automation::FakeFactory.new.job
      @payload = @job.payload
      @log = ::Automation::FakeFactory.new.log

      allow_any_instance_of(ServiceLayer::AutomationService).to receive(
        :job,
      ).with(@job.id).and_return(@job)
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(
        :node,
      ).with(any_args).and_return(::Automation::FakeFactory.new.node)
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(
        :job_log,
      ).with(@job.id).and_return(@log)
    end

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
      it "returns http success and renders the right template" do
        get :show, params: default_params.merge(id: @job.id)
        expect(response).to be_successful
        expect(response).to render_template(:show)
      end

      it "should assign the log and payload" do
        get :show, params: default_params.merge(id: @job.id)
        expect(@log).to include(assigns(:truncated_log).data_output)
        expect(@payload).to include(assigns(:truncated_payload).data_output)
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
      it "returns http success and renders the right template" do
        get :show, params: default_params.merge(id: @job.id)
        expect(response).to be_successful
        expect(response).to render_template(:show)
      end
    end
    context "other roles" do
      before :each do
        stub_authentication do |token|
          token["roles"].delete_if { |h| h["id"] == "automation_role" }
        end
      end
      it "not allowed" do
        get :show, params: default_params.merge(id: @job.id)
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'show_data'" do
    context "plain text" do
      before :each do
        @job = ::Automation::FakeFactory.new.job
        @payload = @job.payload
        @log = ::Automation::FakeFactory.new.log

        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :job,
        ).with(@job.id).and_return(@job)
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :job_log,
        ).with(@job.id).and_return(@log)
      end

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
        it "returns http success and render the template for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(@payload)
        end

        it "returns http success and render the template for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(@log)
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
        it "returns http success and render the template for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(@payload)
        end

        it "returns http success and render the template for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(@log)
        end
      end
      context "other roles" do
        before :each do
          stub_authentication do |token|
            token["roles"].delete_if { |h| h["id"] == "automation_role" }
          end
        end
        it "not allowed for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to_not be_successful
        end

        it "not allowed for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to_not be_successful
        end
      end
    end

    context "json" do
      before :each do
        @job =
          ::Automation::FakeFactory.new.job(
            payload:
              '{"run_list": ["role[landscape]","recipe[ids::certificate]"]}',
          )
        @payload = @job.payload
        @log = '{"test": ["miau","bup", "kuack"]}'

        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :job,
        ).with(@job.id).and_return(@job)
        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :job_log,
        ).with(@job.id).and_return(@log)
      end

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
        it "returns http success and render the template for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(
            JSON.pretty_generate(JSON.parse(@payload)),
          )
        end

        it "returns http success and render the template for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(JSON.pretty_generate(JSON.parse(@log)))
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
        it "returns http success and render the template for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(
            JSON.pretty_generate(JSON.parse(@payload)),
          )
        end

        it "returns http success and render the template for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to be_successful
          expect(response).to render_template(:show_data)
          expect(assigns(:data)).to eq(JSON.pretty_generate(JSON.parse(@log)))
        end
      end
      context "other roles" do
        before :each do
          stub_authentication do |token|
            token["roles"].delete_if { |h| h["id"] == "automation_role" }
          end
        end
        it "not allowed for payload" do
          get :show_data,
              params: default_params.merge(id: @job.id, attr: "payload")
          expect(response).to_not be_successful
        end

        it "not allowed for log" do
          get :show_data, params: default_params.merge(id: @job.id, attr: "log")
          expect(response).to_not be_successful
        end
      end
    end
  end
end
