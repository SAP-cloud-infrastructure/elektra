# frozen_string_literal: true

module ServiceLayer
  module ComputeNgServices
    # Glance (image) access, implemented independently of the image plugin.
    module Glance
      # Image catalog as raw hashes, used to resolve a server's image name.
      def glance_images(filter = {})
        elektron_glance.get("images", filter).body["images"] || []
      end
    end
  end
end
