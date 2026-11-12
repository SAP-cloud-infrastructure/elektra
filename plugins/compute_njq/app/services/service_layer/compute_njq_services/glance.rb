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

      # Pages through Glance (default page size 25) by following the last image
      # id as marker until an empty page comes back. Mirrors the legacy
      # image_services/image.rb#all_images so per-visibility loads are complete.
      def glance_all_images(filter = {})
        all = glance_images(filter)
        return all if all.empty?

        loop do
          page = glance_images(filter.merge("marker" => all.last["id"]))
          break if page.empty?

          all += page
        end
        all
      end
    end
  end
end
