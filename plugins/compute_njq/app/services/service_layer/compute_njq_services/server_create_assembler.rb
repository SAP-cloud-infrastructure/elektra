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
        created = nova_create_server(build_payload(attrs))
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
          "networks" => [{ "uuid" => attrs["network_id"] }],
        }
        payload["user_data"] = Base64.strict_encode64(attrs["user_data"]) if attrs["user_data"].present?

        groups = Array(attrs["security_groups"]).reject(&:blank?)
        payload["security_groups"] = groups.map { |name| { "name" => name } } if groups.any?

        payload.delete_if { |_k, v| v.blank? && v != 1 }
      end
    end
  end
end
