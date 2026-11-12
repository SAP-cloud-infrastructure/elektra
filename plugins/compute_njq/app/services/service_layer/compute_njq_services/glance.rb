# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Glance (image) access, implemented independently of the image plugin.
    module Glance
      # Image catalog as raw hashes, used to resolve a server's image name. The
      # InstanceAssembler caches the small derived id->name map rather than this
      # (potentially large) full list, so this stays a plain fetch.
      def glance_images(filter = {})
        elektron_glance.get("images", filter).body["images"] || []
      end
    end
  end
end
