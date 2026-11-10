# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNgServices::Nova do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNgServices::Nova } }

  let(:elektron_nova) do
    double("elektron_nova").tap do |mock|
      allow(mock).to receive(:get).with("servers/detail", {}).and_return(
        double("response", body: { "servers" => [{ "id" => "s1" }] }),
      )
      allow(mock).to receive(:get).with("servers/s1").and_return(
        double("response", body: { "server" => { "id" => "s1" } }),
      )
      allow(mock).to receive(:get).with("flavors/detail").and_return(
        double("response", body: { "flavors" => [{ "id" => "f1", "name" => "m1.small" }] }),
      )
    end
  end

  before { allow(test_class).to receive(:elektron_nova).and_return(elektron_nova) }

  describe "#nova_servers" do
    it "returns the servers array" do
      expect(test_class.nova_servers).to eq([{ "id" => "s1" }])
    end

    it "returns [] when the body has no servers" do
      allow(elektron_nova).to receive(:get).with("servers/detail", {}).and_return(
        double("response", body: {}),
      )
      expect(test_class.nova_servers).to eq([])
    end
  end

  describe "#nova_server" do
    it "returns a single server hash" do
      expect(test_class.nova_server("s1")).to eq({ "id" => "s1" })
    end
  end

  describe "#nova_flavors" do
    it "returns the flavors array" do
      expect(test_class.nova_flavors).to eq([{ "id" => "f1", "name" => "m1.small" }])
    end
  end
end
