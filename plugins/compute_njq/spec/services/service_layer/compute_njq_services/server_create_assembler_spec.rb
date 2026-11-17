# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::ServerCreateAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::ServerCreateAssembler
    end
  end

  let(:valid_attrs) do
    {
      "name" => "web-01",
      "flavor_id" => "f1",
      "image_id" => "i1",
      "keypair" => "my-key",
      "availability_zone" => "az-1",
      "network_id" => "n1",
      "security_groups" => ["default"],
      "user_data" => "hello",
    }
  end

  describe "#create_instance" do
    # By default the submitted image_id is a Glance image, not a volume.
    before do
      allow(test_class).to receive(:cinder_volume).and_return(nil)
      allow(test_class).to receive(:glance_image).and_return({ "name" => "ubuntu", "buildnumber" => "42" })
    end

    it "builds the Nova payload and posts it, returning the UI-shaped instance" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1", name: "web-01" })

      result = test_class.create_instance(valid_attrs)

      expect(result).to eq({ id: "s1", name: "web-01" })
      expect(captured["name"]).to eq("web-01")
      expect(captured["flavorRef"]).to eq("f1")
      expect(captured["imageRef"]).to eq("i1")
      expect(captured["key_name"]).to eq("my-key")
      expect(captured["availability_zone"]).to eq("az-1")
      expect(captured["max_count"]).to eq(1)
      expect(captured["min_count"]).to eq(1)
      expect(captured["security_groups"]).to eq([{ "name" => "default" }])
      expect(captured["networks"]).to eq([{ "uuid" => "n1" }])
    end

    it "returns the UI-shaped instance from find_instance (B2 regression guard)" do
      allow(test_class).to receive(:nova_create_server).and_return({ "id" => "s1" })
      shaped = { id: "s1", name: "web-01", status: { state: "active", transition: nil } }
      allow(test_class).to receive(:find_instance).with("s1").and_return(shaped)

      result = test_class.create_instance(valid_attrs)
      expect(result).to eq(shaped)
    end

    it "base64-encodes user_data exactly once" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs)
      expect(captured["user_data"]).to eq(Base64.strict_encode64("hello"))
    end

    it "omits user_data when blank" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs.merge("user_data" => ""))
      expect(captured).not_to have_key("user_data")
    end

    it "raises RequestError when a required field is missing" do
      expect { test_class.create_instance(valid_attrs.merge("flavor_id" => "")) }
        .to raise_error(ComputeNjq::RequestError, /flavor/)
    end

    it "rejects a name ending in dot+number" do
      expect { test_class.create_instance(valid_attrs.merge("name" => "web.1")) }
        .to raise_error(ComputeNjq::RequestError, /name/)
    end

    it "boots from a new volume via block_device_mapping_v2 when custom_root_disk is set" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs.merge("custom_root_disk" => "1", "custom_root_disk_size" => "64"))

      expect(captured).not_to have_key("imageRef")
      expect(captured["block_device_mapping_v2"]).to eq([{
        "boot_index" => 0,
        "uuid" => "i1",
        "source_type" => "image",
        "destination_type" => "volume",
        "volume_size" => 64,
        "delete_on_termination" => true,
      }])
    end

    it "includes the volume_type in the block device mapping when provided" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(
        valid_attrs.merge("custom_root_disk" => "1", "custom_root_disk_size" => "64", "volume_type" => "vt1"),
      )

      expect(captured["block_device_mapping_v2"].first).to include("volume_type" => "vt1")
    end

    it "omits volume_type from the block device mapping when blank" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs.merge("custom_root_disk" => "1", "custom_root_disk_size" => "64"))

      expect(captured["block_device_mapping_v2"].first).not_to have_key("volume_type")
    end

    it "keeps imageRef and omits block_device_mapping_v2 without custom_root_disk" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs)
      expect(captured["imageRef"]).to eq("i1")
      expect(captured).not_to have_key("block_device_mapping_v2")
    end

    it "attaches image_name and build number metadata on a plain image boot" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      allow(test_class).to receive(:glance_image).with("i1").and_return(
        { "name" => "ubuntu-24.04", "buildnumber" => "7" },
      )

      test_class.create_instance(valid_attrs)

      expect(captured["metadata"]).to eq({ "image_name" => "ubuntu-24.04", "image_buildnumber" => "7" })
    end

    it "omits metadata when the image cannot be resolved on a plain image boot" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      allow(test_class).to receive(:glance_image).with("i1").and_return(nil)

      test_class.create_instance(valid_attrs)

      expect(captured).not_to have_key("metadata")
    end

    it "boots from an existing bootable volume when the image_id resolves to a volume" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      allow(test_class).to receive(:cinder_volume).with("i1").and_return(
        { "id" => "i1", "volume_image_metadata" => { "hypervisor_type" => "kvm" } },
      )

      test_class.create_instance(valid_attrs)

      expect(captured).not_to have_key("imageRef")
      expect(captured["block_device_mapping_v2"]).to eq([{
        "boot_index" => 0,
        "uuid" => "i1",
        "source_type" => "volume",
        "destination_type" => "volume",
        "delete_on_termination" => false,
      }])
      expect(captured["metadata"]).to eq({ "hypervisor_type" => "kvm" })
    end

    it "does not probe for a volume when custom_root_disk is set (image boot wins)" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      # Even if the id happened to be a volume, custom_root_disk gating skips the probe.
      allow(test_class).to receive(:cinder_volume).and_raise("cinder_volume must not be called")

      test_class.create_instance(valid_attrs.merge("custom_root_disk" => "1", "custom_root_disk_size" => "64"))

      expect(captured["block_device_mapping_v2"].first["source_type"]).to eq("image")
    end

    it "passes a fixed_ip through on the network entry (no subnet, no port)" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      expect(test_class).not_to receive(:neutron_create_port)

      test_class.create_instance(valid_attrs.merge("fixed_ip" => "10.0.0.5"))

      expect(captured["networks"]).to eq([{ "uuid" => "n1", "fixed_ip" => "10.0.0.5" }])
    end

    it "pre-creates a port and attaches it when a subnet is chosen" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })
      expect(test_class).to receive(:neutron_create_port).with(
        network_id: "n1", subnet_id: "sub1", security_groups: ["default"]
      ).and_return({ "id" => "port-1" })

      test_class.create_instance(valid_attrs.merge("subnet_id" => "sub1"))

      expect(captured["networks"]).to eq([{ "port" => "port-1" }])
    end

    it "rolls back a created port when the server create fails" do
      allow(test_class).to receive(:neutron_create_port).and_return({ "id" => "port-1" })
      allow(test_class).to receive(:nova_create_server).and_raise(
        Elektron::Errors::ApiResponse.new(double(code: 403, body: { "message" => "quota" })),
      )
      expect(test_class).to receive(:neutron_delete_port).with("port-1")

      expect do
        test_class.create_instance(valid_attrs.merge("subnet_id" => "sub1"))
      end.to raise_error(Elektron::Errors::ApiResponse)
    end
  end
end
