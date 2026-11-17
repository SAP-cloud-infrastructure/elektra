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
    end
  end
end
