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

  it "returns the full image list (loaded per visibility, no params)" do
    allow(scoped_service).to receive(:form_images).with(no_args)
      .and_return({ images: [{ id: "i1" }] })
    get :images, params: default_params
    expect(response).to have_http_status(:success)
    body = JSON.parse(response.body)
    expect(body["images"]).to eq([{ "id" => "i1" }])
  end

  it "returns keypairs" do
    allow(scoped_service).to receive(:form_keypairs).and_return([{ name: "k1" }])
    get :keypairs, params: default_params
    expect(JSON.parse(response.body)).to eq("keypairs" => [{ "name" => "k1" }])
  end

  it "returns networks" do
    allow(scoped_service).to receive(:form_networks).and_return([{ id: "n1", name: "default" }])
    get :networks, params: default_params
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("networks" => [{ "id" => "n1", "name" => "default" }])
  end

  it "returns security_groups" do
    allow(scoped_service).to receive(:form_security_groups).and_return([{ id: "sg1", name: "default" }])
    get :security_groups, params: default_params
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("security_groups" => [{ "id" => "sg1", "name" => "default" }])
  end

  it "returns availability_zones" do
    allow(scoped_service).to receive(:form_availability_zones).and_return([{ name: "az-1" }])
    get :availability_zones, params: default_params
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("availability_zones" => [{ "name" => "az-1" }])
  end
end
