# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Snapshot (Create Image): captures a server's disk as a new Glance image.
    # Nova's createImage action returns the new image's URL in the Location
    # response header; we extract the id so the client can poll its status. This
    # spans Nova (the action) and Glance (the status read), hence its own module.
    module Snapshot
      TERMINAL_OK = "active"
      TERMINAL_FAILURE = %w[killed deleted error].freeze

      def create_instance_snapshot(id, name)
        name = name.to_s.strip
        raise ComputeNjq::RequestError, "Snapshot name must not be blank" if name.empty?

        response = elektron_nova.post("servers/#{id}/action") do
          { "createImage" => { "name" => name, "metadata" => {} } }
        end
        image_id = image_id_from_location(response) || newest_image_id_by_name(name)
        { image_id: image_id }
      end

      def find_image_status(id)
        img = glance_image(id)
        return nil if img.nil?

        { id: img["id"], name: img["name"], status: img["status"] }
      end

      private

      def image_id_from_location(response)
        location = response.header["Location"] || response.header["location"]
        location&.split("/")&.last
      end

      def newest_image_id_by_name(name)
        glance_images("name" => name).max_by { |i| i["created_at"].to_s }&.dig("id")
      end
    end
  end
end
