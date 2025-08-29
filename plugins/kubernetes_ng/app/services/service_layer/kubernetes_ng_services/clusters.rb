module ServiceLayer
  module KubernetesNgServices
    # This module implements Openstack Domain API
    module Clusters

      def list_clusters(project_id)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.get("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots")
        shoot_items = response&.body&.dig("items") || []
        return shoot_items.map { |shoot| convert_shoot_to_cluster(shoot) }.compact
      end

      def show_cluster_by_name(project_id, cluster_name)
        return nil unless cluster_name
        namespace = "garden-#{project_id}"
        response = elektron_gardener.get("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}")
        shoot_body = response&.body
        return convert_shoot_to_cluster(shoot_body)
      end

      def create_cluster(project_id, cluster_spec)
        # elektron_gardener("gardener", headers:{"Content-Type": "application/json-patch+json"}).post("apis/authorization.k8s.io/v1/selfsubjectaccessreviews")
      end

      def delete_cluster(project_id, cluster_name)
      end

      def update_cluster(project_id, cluster_name, cluster_spec)
      end

      ## Helper Methods

      # Convert a single shoot API response to cluster format
      def convert_shoot_to_cluster(shoot)
        return nil unless shoot.is_a?(Hash)
        
        metadata = shoot.dig('metadata') || {}
        spec = shoot.dig('spec') || {}
        status = shoot.dig('status') || {}
        
        {
          # List view fields
          uid: metadata['uid'],
          name: metadata['name'],
          region: spec['region'],
          infrastructure: spec.dig('provider', 'type'),
          status: get_cluster_status(shoot),
          version: spec.dig('kubernetes', 'version'),
          readiness: get_cluster_readiness(shoot),
          purpose: spec['purpose'],
          # State details for operations tracking
          state_details: get_state_details(shoot),
          # Worker nodes configuration
          workers: safe_map_workers(spec.dig('provider', 'workers')),
          # Maintenance configuration
          maintenance: get_maintenance_info(spec),
          # Last maintenance state
          last_maintenance: get_last_maintenance_info(status),
          # Auto update settings
          auto_update: get_auto_update_settings(spec)
        }.compact
      end

      private

      # Helper function to determine cluster status from last operation
      def get_cluster_status(shoot)
        last_operation = shoot.dig('status', 'lastOperation')
        return "Unknown" unless last_operation
        
        # Possible states: Aborted, Processing, Succeeded, Error, Failed
        state = last_operation['state']
        case state
        when "Failed"
          "Error"
        when "Succeeded"
          "Operational"
        when "Processing"
          "Reconciling"
        else
          state || "Unknown"
        end
      end

      # Helper function to calculate readiness based on conditions
      def get_cluster_readiness(shoot)
        conditions = shoot.dig('status', 'conditions')
        return { status: "Unknown", conditions: [] } unless conditions.is_a?(Array)
        
        # Mapping of condition types to display abbreviations
        condition_display_names = {
          'APIServerAvailable' => 'API',
          'ControlPlaneHealthy' => 'CP',
          'ObservabilityComponentsHealthy' => 'OC',
          'EveryNodeReady' => 'N',
          'SystemComponentsHealthy' => 'SC'
        }
        
        # Count conditions with status "True"
        healthy_count = conditions.count { |c| c['status'] == 'True' }
        
        {
          status: "#{healthy_count}/#{conditions.length}",
          conditions: conditions.map do |condition|
            {
              display_value: condition_display_names[condition['type']] || condition['type'],
              type: condition['type'],
              status: condition['status']
            }
          end
        }
      end

      # Extract detailed state information from last operation
      def get_state_details(shoot)
        last_operation = shoot.dig('status', 'lastOperation')
        return nil unless last_operation
        
        {
          state: last_operation['state'],
          progress: last_operation['progress'].is_a?(Numeric) ? last_operation['progress'] : nil,
          type: last_operation['type'],
          description: last_operation['description'],
          last_transition_time: last_operation['lastUpdateTime']
        }.compact
      end

      # Safely map worker nodes configuration
      def safe_map_workers(workers)
        return [] unless workers.is_a?(Array)
        
        workers.filter_map do |worker|
          next unless worker.is_a?(Hash) && worker['name']
          
          machine = worker.dig('machine') || {}
          image = machine.dig('image') || {}
          cri = worker.dig('cri') || {}
          
          {
            name: worker['name'],
            architecture: machine['architecture'],
            machine_type: machine['type'],
            machine_image: {
              name: image['name'],
              version: image['version']
            }.compact,
            container_runtime: cri['name'],
            min: worker['minimum'],
            max: worker['maximum'],
            actual: nil, # Would need separate API call
            max_surge: worker['maxSurge'],
            zones: worker['zones']
          }.compact
        end
      end

      # Extract maintenance window information
      def get_maintenance_info(spec)
        maintenance = spec.dig('maintenance')
        hibernation = spec.dig('hibernation')
        time_window = maintenance&.dig('timeWindow') || {}
        
        {
          start_time: time_window['begin'] || '',
          timezone: hibernation&.dig('schedules', 0, 'location') || '',
          window_time: time_window['end'] || ''
        }
      end

      # Extract last maintenance operation info
      def get_last_maintenance_info(status)
        last_maintenance = status.dig('lastMaintenance')
        return {} unless last_maintenance
        
        {
          # Possible states: Processing, Succeeded, Error
          state: last_maintenance['state']
        }.compact
      end

      # Extract auto-update settings
      def get_auto_update_settings(spec)
        auto_update = spec.dig('maintenance', 'autoUpdate') || {}
        
        {
          os: auto_update['machineImageVersion'] || false,
          kubernetes: auto_update['kubernetesVersion'] || false
        }
      end

    end
  end
end