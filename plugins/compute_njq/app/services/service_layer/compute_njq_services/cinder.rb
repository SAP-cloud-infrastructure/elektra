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
    end
  end
end
