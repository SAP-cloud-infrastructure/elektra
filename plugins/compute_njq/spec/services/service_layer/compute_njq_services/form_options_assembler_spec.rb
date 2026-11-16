# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::FormOptionsAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::FormOptionsAssembler
    end
  end

  describe "#form_flavors" do
    it "maps raw nova flavors to the structured shape" do
      allow(test_class).to receive(:nova_flavors).and_return([
        { "id" => "f1", "name" => "m1.small", "vcpus" => 2, "ram" => 2048, "disk" => 20,
          "os-flavor-access:is_public" => true,
          "extra_specs" => { "capabilities:hypervisor_type" => "QEMU" } },
      ])
      expect(test_class.form_flavors).to eq([
        { id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
      ])
    end

    it "normalises is_public from os-flavor-access:is_public (false and '1')" do
      allow(test_class).to receive(:nova_flavors).and_return([
        { "id" => "priv", "name" => "p1", "vcpus" => 1, "ram" => 512, "disk" => 10,
          "os-flavor-access:is_public" => false, "extra_specs" => {} },
        { "id" => "pub", "name" => "p2", "vcpus" => 1, "ram" => 512, "disk" => 10,
          "os-flavor-access:is_public" => "1", "extra_specs" => {} },
      ])
      result = test_class.form_flavors
      expect(result.map { |f| [f[:id], f[:is_public]] }).to eq([["priv", false], ["pub", true]])
    end

    it "falls back to the is_public key when os-flavor-access:is_public is absent" do
      allow(test_class).to receive(:nova_flavors).and_return([
        { "id" => "f1", "name" => "m1.small", "vcpus" => 1, "ram" => 512, "disk" => 10,
          "is_public" => true, "extra_specs" => {} },
      ])
      expect(test_class.form_flavors.first[:is_public]).to be(true)
    end
  end

  describe "#form_keypairs" do
    it "maps to name-only" do
      allow(test_class).to receive(:nova_keypairs).and_return([{ "name" => "k1" }])
      expect(test_class.form_keypairs).to eq([{ name: "k1" }])
    end
  end

  describe "#form_availability_zones" do
    it "keeps only available zones, mapped to name" do
      allow(test_class).to receive(:nova_availability_zones).and_return([
        { "zoneName" => "az-1", "zoneState" => { "available" => true } },
        { "zoneName" => "az-2", "zoneState" => { "available" => false } },
      ])
      expect(test_class.form_availability_zones).to eq([{ name: "az-1" }])
    end
  end

  describe "#form_networks" do
    it "maps to id + name" do
      allow(test_class).to receive(:neutron_networks).and_return([{ "id" => "n1", "name" => "private" }])
      expect(test_class.form_networks).to eq([{ id: "n1", name: "private" }])
    end
  end

  describe "#form_security_groups" do
    it "maps to id + name" do
      allow(test_class).to receive(:neutron_security_groups).and_return([{ "id" => "sg1", "name" => "default" }])
      expect(test_class.form_security_groups).to eq([{ id: "sg1", name: "default" }])
    end
  end

  describe "#form_images" do
    it "maps images and returns the last id as next_marker when a full page is returned" do
      allow(test_class).to receive(:glance_images).with({ "limit" => 2 }).and_return([
        { "id" => "i1", "name" => "ubuntu", "visibility" => "public", "os_hash_value" => nil,
          "hypervisor_type" => "kvm", "min_disk" => 10, "size" => 1024 },
        { "id" => "i2", "name" => "debian", "visibility" => "public",
          "hypervisor_type" => "kvm", "min_disk" => 10, "size" => 2048 },
      ])
      result = test_class.form_images(limit: 2)
      expect(result[:images].first).to eq(
        { id: "i1", name: "ubuntu", visibility: "public", hypervisor_type: "kvm", min_disk: 10, size: 1024 },
      )
      expect(result[:next_marker]).to eq("i2")
    end

    it "returns next_marker nil when fewer than limit images come back" do
      allow(test_class).to receive(:glance_images).with({ "limit" => 50, "name" => "zzz" }).and_return([])
      expect(test_class.form_images(q: "zzz", limit: 50)).to eq({ images: [], next_marker: nil })
    end
  end
end
