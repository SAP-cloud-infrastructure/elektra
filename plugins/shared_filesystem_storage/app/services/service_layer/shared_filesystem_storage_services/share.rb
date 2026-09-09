# frozen_string_literal: true

module ServiceLayer
  module SharedFilesystemStorageServices
    # This module implements Openstack Manila Share API
    module Share
      def share_map
        @share_map ||= class_map_proc(SharedFilesystemStorage::Share)
      end

      def shares(filter = {})
        elektron_shares.get("shares", filter).map_to("body.shares", &share_map)
      end

      def shares_detail(filter = {})
        elektron_shares.get(
          "shares/detail",
          filter,
          { headers: { "X-OpenStack-Manila-API-Version" => "2.8" } },
        ).map_to("body.shares", &share_map)
      end

      def find_share!(id)
        elektron_shares.get("shares/#{id}").map_to("body.share", &share_map)
      end

      def find_share(id)
        find_share!(id)
      rescue Elektron::Errors::ApiResponse => _e
        nil
      end

      def new_share(params = {})
        share_map.call(params)
      end

      def share_types
        types.map_to("body.share_types") do |params|
          SharedFilesystemStorage::ShareType.new(self, params)
        end
      end

      def all_share_types
        elektron_shares
          .get(
            "types",
            {
              is_public: "all",
              headers: {
                "X-OpenStack-Manila-API-Version" => "2.46",
              },
            },
          )
          .map_to("body.share_types") do |params|
            SharedFilesystemStorage::ShareType.new(self, params)
          end
      end

      def share_export_locations(share_id)
        elektron_shares
          .get("shares/#{share_id}/export_locations")
          .map_to("body.export_locations") do |params|
            SharedFilesystemStorage::ShareExportLocation.new(self, params)
          end
      end

      def availability_zones
        path =
          if microversion_newer_than?(2.6)
            "availability-zones"
          else
            "os-availability-zone"
          end
        elektron_shares
          .get(path)
          .map_to("body.availability_zones") do |params|
            SharedFilesystemStorage::AvailabilityZone.new(self, params)
          end
      end

      def share_volumes
        types.map_to("body.share_volumes") do |params|
          SharedFilesystemStorage::ShareVolume.new(self, params)
        end
      end

      def list_all_major_versions
        elektron_shares.get("/").map_to("body.versions" => OpenStruct)
      end

      ################# INTERFACE METHODS ######################
      def create_share(params)
        elektron_shares
          .post(
            "shares",
            headers: {
              "X-OpenStack-Manila-API-Version" => "2.84",
            },
          ) do
            { share: params }
          end
          .body["share"]
      end

      def update_share(share_id, params)
        elektron_shares.put("shares/#{share_id}") { { share: params } }.body[
          "share"
        ]
      end

      def delete_share(share_id)
        elektron_shares.delete("shares/#{share_id}")
      end

      def shrink_share_size(share_id, new_size)
        elektron_shares.post("shares/#{share_id}/action") do
          { shrink: { new_size: new_size } }
        end
      end

      def extend_share_size(share_id, new_size)
        elektron_shares.post("shares/#{share_id}/action") do
          { extend: { new_size: new_size } }
        end
      end

      def reset_share_state(share_id, new_state)
        elektron_shares.post("shares/#{share_id}/action") do
          { reset_status: { status: new_state } }
        end
      end

      def force_delete_share(share_id)
        elektron_shares.post("shares/#{share_id}/action") do
          { force_delete: nil }
        end
      end

      def revert_share_to_snapshot(share_id, snapshot_id)
        elektron_shares.post("shares/#{share_id}/action") do
          { revert: { snapshot_id: snapshot_id } }
        end
      end

      protected

      def types
        @types ||= elektron_shares.get("types")
      end
    end
  end
end
