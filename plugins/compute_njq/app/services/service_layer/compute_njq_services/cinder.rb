# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Cinder (block storage) access, implemented independently of the
    # block_storage plugin. Only the slice the instance detail needs
    # (resolving attached volumes) lives here.
    module Cinder
      # Fetches a single volume as a raw hash, or nil when it cannot be
      # resolved (e.g. deleted, or no permission). Mirrors the legacy
      # `attached_volumes` behaviour that silently drops unresolvable volumes.
      def cinder_volume(id)
        elektron_cinder.get("volumes/#{id}").body["volume"]
      rescue Elektron::Errors::ApiResponse
        nil
      end

      # All volume types (public and private) as raw hashes, used to offer a
      # root-disk volume type for boot-from-volume. is_public=None asks Cinder
      # for every type regardless of visibility (mirrors the legacy
      # services.block_storage.volume_types call). Returns [] on error so the
      # form degrades gracefully instead of blowing up.
      def cinder_volume_types
        elektron_cinder.get("types?is_public=None").body["volume_types"] || []
      rescue Elektron::Errors::ApiResponse
        []
      end

      # Statuses that make a bootable volume unusable as a boot source; mirrors
      # the legacy bootable_volumes_for_instance reject list.
      UNUSABLE_VOLUME_STATUSES = %w[
        deleting in-use error error_deleting error_backing-up error_restoring error_extending
      ].freeze

      # Bootable volumes usable as an instance boot source: Cinder filters
      # bootable=true server-side (microversion 3.34 like the legacy call), then
      # we drop volumes in a transient/broken status. Returns [] on error.
      def cinder_bootable_volumes
        elektron_cinder
          .get("volumes/detail", { "bootable" => true }, headers: { "OpenStack-API-Version" => "volume 3.34" })
          .body["volumes"]
          &.reject { |v| UNUSABLE_VOLUME_STATUSES.include?(v["status"]) } || []
      rescue Elektron::Errors::ApiResponse
        []
      end
    end
  end
end
