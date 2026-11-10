# frozen_string_literal: true

require "spec_helper"

RSpec.describe ComputeNg::Api::InstancesController, type: :controller do
  routes { ComputeNg::Engine.routes }

  let(:compute_service) { double("compute_ng_service") }
  let(:scoped_service) { double("scoped_compute_ng_service") }
  let(:services_mock) { double("services", compute_ng: compute_service) }

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
        allow(scoped_service).to receive(:list_instances).and_raise(ComputeNg::RequestError.new("bad filter"))

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
end
