# frozen_string_literal: true

require "spec_helper"

describe DnsService::RequestZoneWizardController, type: :controller do
  routes { DnsService::Engine.routes }

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

  before :each do
    stub_authentication
    allow_any_instance_of(DomainConfig).to receive(:disabled_dns_providers?).and_return(nil)
  end

  let(:dns_service) { double("dns_service") }

  let(:pool_with_share) do
    double(
      "Pool",
      id: "pool-aaa",
      name: "shared-pool",
      attributes: { "attributes" => { "label" => "shared-pool" }, "ns_records" => [] },
    )
  end

  let(:pool_without_share) do
    double(
      "Pool",
      id: "pool-bbb",
      name: "restricted-pool",
      attributes: { "attributes" => { "label" => "restricted-pool" }, "ns_records" => [] },
    )
  end

  describe "GET 'new'" do
    context "when only one pool is shared to the current domain" do
      before do
        allow(controller.cloud_admin).to receive(:dns_service).and_return(dns_service)
        allow(dns_service).to receive(:pools_for_domain).and_return([pool_with_share])
      end

      it "returns http success" do
        get :new, params: default_params
        expect(response).to be_successful
      end

      it "assigns only the pool shared to the current domain" do
        get :new, params: default_params
        expect(assigns(:pools)).to eq([pool_with_share])
      end

      it "does not include pools not shared to the domain" do
        get :new, params: default_params
        expect(assigns(:pools)).not_to include(pool_without_share)
      end
    end

    context "when the pool shares API is unavailable (fallback to all pools)" do
      before do
        allow(controller.cloud_admin).to receive(:dns_service).and_return(dns_service)
        allow(dns_service).to receive(:pools_for_domain).and_return([pool_with_share, pool_without_share])
      end

      it "assigns all pools" do
        get :new, params: default_params
        expect(assigns(:pools)).to contain_exactly(pool_with_share, pool_without_share)
      end
    end
  end
end
