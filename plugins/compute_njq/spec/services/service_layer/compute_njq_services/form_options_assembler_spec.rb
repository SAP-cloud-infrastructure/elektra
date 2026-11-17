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

  describe "#form_volume_types" do
    it "keeps only premium-prefixed types, mapped to id + name, in order" do
      allow(test_class).to receive(:cinder_volume_types).and_return([
        { "id" => "vt1", "name" => "premium_ssd" },
        { "id" => "vt2", "name" => "standard" },
        { "id" => "vt3", "name" => "premium_perf" },
      ])
      expect(test_class.form_volume_types).to eq([
        { id: "vt1", name: "premium_ssd" },
        { id: "vt3", name: "premium_perf" },
      ])
    end
  end

  describe "#form_security_groups" do
    it "maps to id + name + project, resolving the project label from the cache" do
      allow(test_class).to receive(:neutron_security_groups).and_return([
        { "id" => "sg1", "name" => "default", "project_id" => "p1" },
      ])
      allow(test_class).to receive(:project_labels).and_return({ "p1" => "monsoon3/demo" })

      expect(test_class.form_security_groups).to eq([
        { id: "sg1", name: "default", project_id: "p1", project_label: "monsoon3/demo" },
      ])
    end

    it "falls back to the raw project id when the project is not cached" do
      allow(test_class).to receive(:neutron_security_groups).and_return([
        { "id" => "sg2", "name" => "shared", "tenant_id" => "p2" },
      ])
      allow(test_class).to receive(:project_labels).and_return({})

      expect(test_class.form_security_groups).to eq([
        { id: "sg2", name: "shared", project_id: "p2", project_label: "p2" },
      ])
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
          image_type: nil, disk_format: "qcow2", buildnumber: "42", min_disk: 10, size: 1024,
          created: nil, owner: nil, owner_label: nil },
      )
    end

    it "resolves the owner project label only for private images" do
      allow(test_class).to receive(:glance_all_images).and_return([])
      allow(test_class).to receive(:glance_all_images).with("visibility" => "private").and_return([
        { "id" => "p", "name" => "priv", "visibility" => "private", "owner" => "o1", "created_at" => "2026-01-01" },
      ])
      allow(test_class).to receive(:glance_all_images).with("visibility" => "public").and_return([
        { "id" => "q", "name" => "pub", "visibility" => "public", "owner" => "o2" },
      ])
      allow(test_class).to receive(:project_labels).and_return({ "o1" => "monsoon3/demo" })

      images = test_class.form_images[:images].index_by { |i| i[:id] }
      expect(images["p"]).to include(owner: "o1", owner_label: "monsoon3/demo", created: "2026-01-01")
      # Public images never carry an owner label suffix.
      expect(images["q"]).to include(owner: "o2", owner_label: nil)
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
