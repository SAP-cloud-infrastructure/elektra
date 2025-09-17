# frozen_string_literal: true

module ServiceLayer
  module ImageServices
    module Image
      def image_map
        @image_map ||= class_map_proc(::Image::Image)
      end

      # use this with pagination options, otherwise you will get a
      # maxium of 25 images (glance default limit)
      # https://docs.openstack.org/api-ref/image/v2/index.html#list-images
      def images(filter = {})
        elektron_images.get('images', filter).map_to('body.images', &image_map)
      end

      def all_images(filter = {})
        all_images = images(filter)
        last_image = all_images.last

        if last_image
          # we have always pagination in glance (default limit 25), so we need to loop over all pages
          while (images_page = images(filter.merge(marker: last_image.id))).count > 0
            last_image = images_page.last
            all_images += images_page
          end
        end

        all_images
      end

      def new_image(attributes = {})
        image_map.call(attributes)
      end

      def find_image!(id)
        return nil if id.blank?
        elektron_images.get("images/#{id}").map_to('body', &image_map)
      end

      def find_image(id)
        find_image!(id)
      rescue Elektron::Errors::ApiResponse => _e
        nil
      end

      def set_image_visibility(id, visibility)
        elektron_images.patch(
          "images/#{id}",
          headers: {
            'Content-Type' => 'application/openstack-images-v2.1-json-patch'
          }
        ) do
          [
            {
              op: 'replace',
              path: '/visibility',
              value: visibility
            }
          ].to_json
        end.body
      end

      ################# INTERFACE METHODS ######################
      def delete_image(id)
        elektron_images.delete("images/#{id}")
      end
    end
  end
end
