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
    it "loads images per visibility (private, shared, public), maps them, and de-dupes by id" do
      allow(test_class).to receive(:glance_all_images).with("visibility" => "private").and_return([
        { "id" => "i1", "name" => "ubuntu", "visibility" => "private", "os_hash_value" => nil,
          "hypervisor_type" => "kvm", "img_hv_type" => "kvm", "image_type" => nil,
          "disk_format" => "qcow2", "buildnumber" => "42", "min_disk" => 10, "size" => 1024 },
      ])
      allow(test_class).to receive(:glance_all_images).with("visibility" => "shared").and_return([
        { "id" => "i2", "name" => "debian", "visibility" => "shared",
          "hypervisor_type" => "kvm", "min_disk" => 10, "size" => 2048 },
      ])
      # Overlaps i1 (shared with a project): the private copy wins, the dup is dropped.
      allow(test_class).to receive(:glance_all_images).with("visibility" => "public").and_return([
        { "id" => "i1", "name" => "ubuntu", "visibility" => "public" },
        { "id" => "i3", "name" => "suse", "visibility" => "public", "hypervisor_type" => "vmware" },
      ])

      result = test_class.form_images

      expect(result).not_to have_key(:next_marker)
      expect(result[:images].map { |i| i[:id] }).to eq(%w[i1 i2 i3])
      expect(result[:images].first).to eq(
        { id: "i1", name: "ubuntu", visibility: "private", hypervisor_type: "kvm", img_hv_type: "kvm",
          image_type: nil, disk_format: "qcow2", buildnumber: "42", min_disk: 10, size: 1024 },
      )
    end

    it "passes through image_type for snapshot detection and the extra label fields" do
      allow(test_class).to receive(:glance_all_images).and_return([])
      allow(test_class).to receive(:glance_all_images).with("visibility" => "private").and_return([
        { "id" => "snap", "name" => "my-snapshot", "visibility" => "private", "image_type" => "snapshot",
          "img_hv_type" => "baremetal", "disk_format" => "vmdk", "buildnumber" => nil },
      ])

      image = test_class.form_images[:images].first
      expect(image).to include(
        id: "snap", image_type: "snapshot", img_hv_type: "baremetal", disk_format: "vmdk", buildnumber: nil,
      )
    end

    it "returns an empty list when no images are visible" do
      allow(test_class).to receive(:glance_all_images).and_return([])
      expect(test_class.form_images).to eq({ images: [] })
    end

    it "drops images with a nil or blank name (matching the legacy helper)" do
      allow(test_class).to receive(:glance_all_images).and_return([])
      allow(test_class).to receive(:glance_all_images).with("visibility" => "public").and_return([
        { "id" => "named", "name" => "ubuntu", "visibility" => "public" },
        { "id" => "nil",   "name" => nil,      "visibility" => "public" },
        { "id" => "blank", "name" => "   ",    "visibility" => "public" },
      ])
      expect(test_class.form_images[:images].map { |i| i[:id] }).to eq(%w[named])
    end
  end
end
