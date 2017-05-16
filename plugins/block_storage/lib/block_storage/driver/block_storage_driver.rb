module BlockStorage
  module Driver
    class BlockStorageDriver < Interface
      include Core::ServiceLayer::FogDriver::ClientHelper

      class Error < StandardError; end;

      def initialize(params)
        super(params)
        @connection = ::Fog::Volume::OpenStack.new(auth_params)
      end

      #
      # Volumes
      #

      def volumes(filter={})
        handle_response { @connection.list_volumes_detailed(filter).body['volumes'] }
      end

      def get_volume(id)
        handle_response { @connection.get_volume_details(id).body['volume'] }
      end

      def create_volume(params={})
        name = params.delete("name")
        description = params.delete("description")
        size = params.delete("size")

        handle_response{ @connection.create_volume(name, description, size, params).body['volume'] }
      end

      def update_volume(id, params={})
        handle_response{ @connection.update_volume(id, params).body['volume'] }
      end

      def delete_volume(id)
        handle_response{ @connection.delete_volume(id) }
      end


      #
      # Snapshots
      #

      def snapshots(filter={})
        handle_response { @connection.list_snapshots(filter).body['snapshots'] }
      end

      def get_snapshot(id)
        handle_response { @connection.get_snapshot_details(id).body['snapshot'] }
      end

      def create_snapshot(params={})
        volume_id = params["volume_id"]
        name = params["name"]
        description = params["description"]
        force = params["force"]
        handle_response{ @connection.create_snapshot(volume_id, name, description, force).body['snapshot'] }
      end

      def update_snapshot(id, params={})
        handle_response{ @connection.update_snapshot(id, params).body['snapshot'] }
      end

      def delete_snapshot(id)
        handle_response{ @connection.delete_snapshot(id) }
      end

      def test(filter={})
        puts "test"
      end

      def reset_status(id,status={})
        data = {
          "os-reset_status" => {
          }
        }
        ["status","attach_status","migration_status"].each do |key|
          data["os-reset_status"][key.to_s] = (status[key.to_sym] || status[key.to_s])
        end
        handle_response{ @connection.action(id, data)}
      end

      def force_delete(id)
        data = {
          "os-force_delete" => nil
        }
        handle_response{ @connection.action(id, data)}
      end

      def reset_snapshot_status(id,status={})
        data = {
          "os-reset_status" => {
          }
        }
        ["status","attach_status","migration_status"].each do |key|
          data["os-reset_status"][key.to_s] = (status[key.to_sym] || status[key.to_s])
        end
        handle_response{ @connection.snapshot_action(id, data)}
      end
    end
  end
end
