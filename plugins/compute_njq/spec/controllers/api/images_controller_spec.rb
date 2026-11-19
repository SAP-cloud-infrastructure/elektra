# frozen_string_literal: true
require "spec_helper"

RSpec.describe ComputeNjq::Api::ImagesController, type: :controller do
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
      "Project", default_params[:domain_id], default_params[:project_id], default_params[:project_id]
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:current_region).and_return("qa-de-1")
    allow(compute_service).to receive(:scoped).and_return(scoped_service)
    allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).and_return(true)
  end

  describe "GET #show" do
    it "returns the shaped image status" do
      allow(scoped_service).to receive(:find_image_status).with("img-7").and_return(
        { id: "img-7", name: "snap-1", status: "saving" }
      )

      get :show, params: default_params.merge(id: "img-7")

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq(
        "image" => { "id" => "img-7", "name" => "snap-1", "status" => "saving" }
      )
    end
  end
end
