# frozen_string_literal: true

require "spec_helper"

RSpec.describe ComputeNjq::Api::InstancesController, type: :controller do
  routes { ComputeNjq::Engine.routes }

  let(:compute_service) { double("compute_njq_service") }
  let(:scoped_service) { double("scoped_compute_njq_service") }
  let(:services_mock) { double("services", compute_njq: compute_service) }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry("Domain", nil, default_params[:domain_id], "default")
    FriendlyIdEntry.find_or_create_entry(
      "Project",
      default_params[:domain_id],
      default_params[:project_id],
      default_params[:project_id],
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:current_region).and_return("qa-de-1")
    controller.instance_variable_set(:@scoped_project_id, "project_123")
    allow(compute_service).to receive(:scoped).and_return(scoped_service)
  end

  describe "GET #index" do
    let(:instances) { [{ id: "s1", name: "web-01" }] }

    it "returns the aggregated instances as JSON" do
      allow(scoped_service).to receive(:list_instances).and_return(instances)

      get :index, params: default_params

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("instances" => [{ "id" => "s1", "name" => "web-01" }])
    end

    it "passes only non-blank filter params to the service" do
      allow(scoped_service).to receive(:list_instances).and_return([])

      get :index, params: default_params.merge(name: "web", status: "")

      expect(scoped_service).to have_received(:list_instances).with({ name: "web" })
    end

    context "when the backend raises an Elektron API error" do
      it "renders the error envelope with the upstream status" do
        allow(scoped_service).to receive(:list_instances).and_raise(
          Elektron::Errors::ApiResponse.new(double(code: 404, body: { "message" => "not found" })),
        )

        get :index, params: default_params

        expect(response).to have_http_status(404)
        body = JSON.parse(response.body)
        expect(body["error"]).to eq("API Error")
        expect(body["code"]).to eq(404)
      end
    end

    context "when a domain request error is raised" do
      it "renders a 400 envelope" do
        allow(scoped_service).to receive(:list_instances).and_raise(ComputeNjq::RequestError.new("bad filter"))

        get :index, params: default_params

        expect(response).to have_http_status(:bad_request)
        body = JSON.parse(response.body)
        expect(body).to include("error" => "Request Error", "code" => 400, "message" => "bad filter")
      end
    end
    context "when the backend raises an unexpected error" do
      it "renders a generic 500 envelope instead of leaking a raw error" do
        allow(scoped_service).to receive(:list_instances).and_raise(TypeError.new("String does not have #dig method"))

        get :index, params: default_params

        expect(response).to have_http_status(500)
        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Internal Server Error")
        expect(body["code"]).to eq(500)
        # The raw error message must not leak to the client.
        expect(body["message"]).not_to include("dig")
      end
    end
  end

  describe "GET #show" do
    it "returns a single instance" do
      allow(scoped_service).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      get :show, params: default_params.merge(id: "s1")

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("instance" => { "id" => "s1" })
    end
  end

  describe "POST #create" do
    let(:create_params) do
      { name: "web-01", flavor_id: "f1", image_id: "i1", keypair: "my-key",
        availability_zone: "az-1", network_id: "n1", security_groups: ["default"], user_data: "" }
    end

    it "creates the instance and returns it" do
      allow(scoped_service).to receive(:create_instance).and_return({ "id" => "s1", "name" => "web-01" })
      post :create, params: default_params.merge(instance: create_params)
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("instance" => { "id" => "s1", "name" => "web-01" })
    end

    it "passes the permitted attributes to the service" do
      captured = nil
      allow(scoped_service).to receive(:create_instance) { |a| captured = a; { "id" => "s1" } }
      post :create, params: default_params.merge(instance: create_params)
      expect(captured["name"]).to eq("web-01")
      expect(captured["security_groups"]).to eq(["default"])
    end

    it "un-nests the instance key so create_params is never empty" do
      captured = nil
      allow(scoped_service).to receive(:create_instance) { |a| captured = a; { "id" => "s1" } }
      post :create, params: default_params.merge(instance: create_params)
      expect(captured).not_to be_empty
      expect(captured["name"]).to eq("web-01")
    end

    it "renders a 400 envelope when the service rejects the payload" do
      allow(scoped_service).to receive(:create_instance).and_raise(ComputeNjq::RequestError.new("flavor is required"))
      post :create, params: default_params.merge(instance: create_params.merge(flavor_id: ""))
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to include("error" => "Request Error", "code" => 400)
    end

    it "passes through an upstream Nova quota error with its status" do
      allow(scoped_service).to receive(:create_instance).and_raise(
        Elektron::Errors::ApiResponse.new(double(code: 403, body: { "message" => "Quota exceeded" })),
      )
      post :create, params: default_params.merge(instance: create_params)
      expect(response).to have_http_status(403)
      expect(JSON.parse(response.body)["code"]).to eq(403)
    end
  end

  describe "GET #detail" do
    it "returns the aggregated instance detail" do
      allow(scoped_service).to receive(:find_instance_detail).with("s1").and_return({ id: "s1", name: "web-01" })

      get :detail, params: default_params.merge(id: "s1")

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("instance" => { "id" => "s1", "name" => "web-01" })
    end

    it "returns a null instance when the server is not found" do
      allow(scoped_service).to receive(:find_instance_detail).with("missing").and_return(nil)

      get :detail, params: default_params.merge(id: "missing")

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("instance" => nil)
    end
  end

  describe "GET #metrics" do
    it "returns the proxied Thanos metrics" do
      allow(scoped_service).to receive(:thanos_cpu_recommendation).with("s1").and_return("4")
      allow(scoped_service).to receive(:thanos_memory_recommendation).with("s1").and_return(8.0)
      allow(scoped_service).to receive(:thanos_guest_tools).with("s1").and_return(
        { installed: "12.0.0", target: "12.0.0", state: "up_to_date" },
      )

      get :metrics, params: default_params.merge(id: "s1")

      expect(response).to have_http_status(:success)
      body = JSON.parse(response.body)
      expect(body["metrics"]["cpu_recommendation"]).to eq("4")
      expect(body["metrics"]["memory_recommendation"]).to eq(8.0)
      expect(body["metrics"]["guest_tools"]["state"]).to eq("up_to_date")
    end
  end
end
