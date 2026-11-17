# frozen_string_literal: true

require "base64"

module ServiceLayer
  module ComputeNjqServices
    # The single write-side transformation seam: validates the UI payload and
    # builds the Nova POST /servers body. This consolidates logic the legacy
    # plugin scattered across the controller and Compute::Server#attributes_for_create.
    module ServerCreateAssembler
      REQUIRED = %w[name flavor_id image_id keypair network_id].freeze
      # A Nova name must not look like "foo.123" (mirrors the legacy model rule).
      NAME_FORBIDDEN = /\A.*\.\d+\z/

      def create_instance(attrs)
        validate!(attrs)
        # A subnet choice means we must pre-create a Neutron port and attach the
        # instance to it. Track it so we can roll it back if the server create
        # fails (mirrors the legacy controller's port cleanup on error).
        created_port_id = nil
        payload = build_payload(attrs)
        if attrs["subnet_id"].present?
          port = neutron_create_port(
            network_id: attrs["network_id"],
            subnet_id: attrs["subnet_id"],
            security_groups: Array(attrs["security_groups"]).reject(&:blank?),
          )
          created_port_id = port["id"]
          payload["networks"] = [{ "port" => created_port_id }]
        end

        begin
          created = nova_create_server(payload)
        rescue StandardError
          neutron_delete_port(created_port_id) if created_port_id
          raise
        end
        find_instance(created["id"])
      end

      private

      def validate!(attrs)
        REQUIRED.each do |key|
          raise ComputeNjq::RequestError, "#{key.sub('_id', '')} is required" if attrs[key].blank?
        end
        if attrs["name"].to_s.match?(NAME_FORBIDDEN)
          raise ComputeNjq::RequestError, "name must not end with a dot followed by a number"
        end
      end

      def build_payload(attrs)
        payload = {
          "name" => attrs["name"],
          "flavorRef" => attrs["flavor_id"],
          "imageRef" => attrs["image_id"],
          "key_name" => attrs["keypair"],
          "availability_zone" => attrs["availability_zone"],
          "max_count" => 1, # v1: exactly one instance. Single place to lift later.
          "min_count" => 1,
          "networks" => [build_network(attrs)],
        }
        payload["user_data"] = Base64.strict_encode64(attrs["user_data"]) if attrs["user_data"].present?

        groups = Array(attrs["security_groups"]).reject(&:blank?)
        payload["security_groups"] = groups.map { |name| { "name" => name } } if groups.any?

        apply_boot_source!(payload, attrs)

        payload.delete_if { |_k, v| v.blank? && v != 1 }
      end

      # The Nova network entry, mirroring the legacy rule: a fixed IP (without a
      # subnet) rides along with the network uuid. A subnet is handled one level
      # up by pre-creating a port, which replaces this entry entirely.
      def build_network(attrs)
        network = { "uuid" => attrs["network_id"] }
        network["fixed_ip"] = attrs["fixed_ip"] if attrs["fixed_ip"].present?
        network
      end

      # Decides how the instance boots from the submitted image_id, mirroring the
      # legacy controller's three-way branch:
      #   1. a bootable volume (the id resolves to a Cinder volume, and custom
      #      root disk is off) → boot from that existing volume, kept on delete;
      #   2. a custom root disk → boot from a new volume created from the image,
      #      optionally of a chosen premium volume type, deleted on termination;
      #   3. a plain image → leave imageRef as-is (Nova boots the image directly).
      def apply_boot_source!(payload, attrs)
        image_id = attrs["image_id"]

        # Only probe for a volume when custom root disk is off (legacy gating):
        # the two are mutually exclusive in the UI.
        unless truthy(attrs["custom_root_disk"])
          volume = cinder_volume(image_id)
          if volume
            payload["block_device_mapping_v2"] = [{
              "boot_index" => 0,
              "uuid" => volume["id"],
              "source_type" => "volume",
              "destination_type" => "volume",
              "delete_on_termination" => false,
            }]
            payload["metadata"] = volume["volume_image_metadata"] if volume["volume_image_metadata"].present?
            payload.delete("imageRef")
            return
          end
        end

        # Custom root disk: boot from a new volume created from the image instead
        # of booting the image directly. volume_type is set for disk-less KVM
        # flavors (the UI sends the chosen premium volume type id); otherwise Nova
        # picks the default type.
        return unless truthy(attrs["custom_root_disk"])

        bdm = {
          "boot_index" => 0,
          "uuid" => image_id,
          "source_type" => "image",
          "destination_type" => "volume",
          "volume_size" => attrs["custom_root_disk_size"].to_i,
          "delete_on_termination" => true,
        }
        bdm["volume_type"] = attrs["volume_type"] if attrs["volume_type"].present?
        payload["block_device_mapping_v2"] = [bdm]
        payload.delete("imageRef")
      end

      def truthy(value)
        value == true || value == "1" || value == "true"
      end
    end
  end
end
