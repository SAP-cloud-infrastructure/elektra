# frozen_string_literal: true
require "spec_helper"

RSpec.describe ComputeNjq::Api::FormOptionsController, type: :controller do
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
      "Project", default_params[:domain_id], default_params[:project_id], default_params[:project_id],
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:current_region).and_return("qa-de-1")
    controller.instance_variable_set(:@scoped_project_id, "project_123")
    allow(compute_service).to receive(:scoped).and_return(scoped_service)
  end

  it "returns flavors" do
    allow(scoped_service).to receive(:form_flavors).and_return([{ id: "f1", name: "m1.small" }])
    get :flavors, params: default_params
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("flavors" => [{ "id" => "f1", "name" => "m1.small" }])
  end

  it "returns images with search params and next_marker" do
    allow(scoped_service).to receive(:form_images).with(q: "ubuntu", marker: nil, limit: 50)
      .and_return({ images: [{ id: "i1" }], next_marker: nil })
    get :images, params: default_params.merge(q: "ubuntu")
    expect(response).to have_http_status(:success)
    body = JSON.parse(response.body)
    expect(body["images"]).to eq([{ "id" => "i1" }])
    expect(body["next_marker"]).to be_nil
  end

  it "returns keypairs" do
    allow(scoped_service).to receive(:form_keypairs).and_return([{ name: "k1" }])
    get :keypairs, params: default_params
    expect(JSON.parse(response.body)).to eq("keypairs" => [{ "name" => "k1" }])
  end
end
