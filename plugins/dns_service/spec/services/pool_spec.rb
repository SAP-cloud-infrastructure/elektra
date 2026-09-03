# frozen_string_literal: true

require "spec_helper"

describe ServiceLayer::DnsServiceServices::Pool do
  # Build a minimal host object that includes the module under test
  let(:service_class) do
    Class.new(Core::ServiceLayer::Service) { include ServiceLayer::DnsServiceServices::Pool }
  end

  let(:elektron_dns) { double("elektron_dns") }

  let(:service) do
    instance = service_class.allocate
    allow(instance).to receive(:elektron_dns).and_return(elektron_dns)
    instance
  end

  let(:pool_a) { double("Pool", id: "pool-aaa") }
  let(:pool_b) { double("Pool", id: "pool-bbb") }

  describe "#pool_shares" do
    context "when the API returns shares" do
      it "returns the list of shares" do
        response = double("response")
        allow(response).to receive(:body).and_return(
          { "shared_pools" => [{ "target_domain_id" => "domain-111" }] },
        )
        allow(elektron_dns).to receive(:get).with("pools/pool-aaa/shares", all_projects: true).and_return(response)

        expect(service.pool_shares("pool-aaa")).to eq([{ "target_domain_id" => "domain-111" }])
      end
    end

    context "when the API returns an error" do
      it "returns nil" do
        response_double = double("response", code: "404", code_type: nil, error_type: nil, body: {}, message: "not found")
        allow(elektron_dns).to receive(:get).and_raise(Elektron::Errors::ApiResponse.new(response_double))

        expect(service.pool_shares("pool-aaa")).to be_nil
      end
    end
  end

  describe "#pools_for_domain" do
    before do
      pools_response = double("response")
      allow(pools_response).to receive(:map_to).with("body.pools", any_args).and_return([pool_a, pool_b])
      allow(pools_response).to receive(:body).and_return({ "metadata" => {} })
      allow(elektron_dns).to receive(:get).with("pools", {}).and_return(pools_response)
    end

    context "when domain_id is blank" do
      it "returns all pools without filtering when nil" do
        expect(service.pools_for_domain(nil)).to eq([pool_a, pool_b])
      end

      it "returns all pools without filtering when empty string" do
        expect(service.pools_for_domain("")).to eq([pool_a, pool_b])
      end
    end

    context "when pool_a is shared to the domain" do
      before do
        allow(service).to receive(:pool_shares).with("pool-aaa").and_return(
          [{ "target_domain_id" => "domain-111" }],
        )
        allow(service).to receive(:pool_shares).with("pool-bbb").and_return([])
      end

      it "returns only the shared pool" do
        expect(service.pools_for_domain("domain-111")).to eq([pool_a])
      end

      it "excludes pools not shared to the domain" do
        result = service.pools_for_domain("domain-111")
        expect(result).not_to include(pool_b)
      end
    end

    context "when no pools are shared to the domain" do
      before do
        allow(service).to receive(:pool_shares).and_return([])
      end

      it "returns an empty list" do
        expect(service.pools_for_domain("domain-111")).to eq([])
      end
    end

    context "when pool_shares API is unavailable (returns nil)" do
      before do
        allow(service).to receive(:pool_shares).and_return(nil)
      end

      it "falls back to all pools" do
        expect(service.pools_for_domain("domain-111")).to eq([pool_a, pool_b])
      end
    end

    context "when pool_shares raises an unexpected error" do
      before do
        allow(service).to receive(:pool_shares).and_raise(StandardError, "unexpected")
      end

      it "falls back to all pools" do
        expect(service.pools_for_domain("domain-111")).to eq([pool_a, pool_b])
      end
    end
  end
end
