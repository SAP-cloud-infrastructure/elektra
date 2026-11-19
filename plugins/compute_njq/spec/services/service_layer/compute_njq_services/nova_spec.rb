# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Nova do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNjqServices::Nova } }

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

  describe "#nova_keypairs" do
    it "returns the keypair hashes unwrapped" do
      allow(elektron_nova).to receive(:get).with("os-keypairs").and_return(
        double("response", body: { "keypairs" => [{ "keypair" => { "name" => "my-key" } }] }),
      )
      expect(test_class.nova_keypairs).to eq([{ "name" => "my-key" }])
    end

    it "returns [] when there are no keypairs" do
      allow(elektron_nova).to receive(:get).with("os-keypairs").and_return(
        double("response", body: {}),
      )
      expect(test_class.nova_keypairs).to eq([])
    end
  end

  describe "#nova_availability_zones" do
    it "returns the availabilityZoneInfo array" do
      allow(elektron_nova).to receive(:get).with("os-availability-zone").and_return(
        double("response", body: { "availabilityZoneInfo" => [{ "zoneName" => "az-1" }] }),
      )
      expect(test_class.nova_availability_zones).to eq([{ "zoneName" => "az-1" }])
    end
  end

  describe "#nova_create_server" do
    it "posts the payload wrapped under :server and returns the created server" do
      allow(elektron_nova).to receive(:post).with("servers").and_yield.and_return(
        double("response", body: { "server" => { "id" => "s1" } }),
      )
      expect(test_class.nova_create_server({ "name" => "web-01" })).to eq({ "id" => "s1" })
    end
  end

  describe "#nova_server_action" do
    it "posts the given body to the server action endpoint and returns the response body" do
      captured = nil
      allow(elektron_nova).to receive(:post).with("servers/s1/action") do |&block|
        captured = block.call
        double("response", body: { "ok" => true })
      end
      result = test_class.nova_server_action("s1", { "os-start" => nil })
      expect(captured).to eq({ "os-start" => nil })
      expect(result).to eq({ "ok" => true })
    end
  end

  describe "#nova_delete_server" do
    it "deletes the server and returns the response body" do
      allow(elektron_nova).to receive(:delete).with("servers/s1").and_return(
        double("response", body: {}),
      )
      expect(test_class.nova_delete_server("s1")).to eq({})
    end
  end

  describe "#nova_set_locked_metadata" do
    it "puts the locked metadata key with the given value" do
      captured = nil
      allow(elektron_nova).to receive(:put).with("servers/s1/metadata/locked") do |&block|
        captured = block.call
        double("response", body: {})
      end
      test_class.nova_set_locked_metadata("s1", "true")
      expect(captured).to eq({ "meta" => { "locked" => "true" } })
    end
  end

  describe "#nova_update_server" do
    it "puts the attrs wrapped under :server and returns the server body" do
      captured = nil
      allow(elektron_nova).to receive(:put).with("servers/s1") do |&block|
        captured = block.call
        double("response", body: { "server" => { "id" => "s1", "name" => "web-02" } })
      end
      result = test_class.nova_update_server("s1", { "name" => "web-02" })
      expect(captured).to eq({ server: { "name" => "web-02" } })
      expect(result).to eq({ "id" => "s1", "name" => "web-02" })
    end
  end

  describe "#nova_set_server_tags" do
    it "puts the tag set to the tags endpoint and returns the response body" do
      captured = nil
      allow(elektron_nova).to receive(:put).with("servers/s1/tags") do |&block|
        captured = block.call
        double("response", body: { "tags" => %w[web prod] })
      end
      result = test_class.nova_set_server_tags("s1", %w[web prod])
      expect(captured).to eq({ "tags" => %w[web prod] })
      expect(result).to eq({ "tags" => %w[web prod] })
    end
  end
end
