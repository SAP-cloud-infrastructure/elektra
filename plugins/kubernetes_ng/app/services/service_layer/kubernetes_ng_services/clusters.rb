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
        namespace = "garden-#{project_id}"
        response = elektron_gardener.post("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots", 
            headers:{"Content-Type": "application/json"
          }) do
          convert_cluster_to_shoot(cluster_spec)
        end
        return response&.body
      end

      def mark_cluster_for_deletion(project_id, cluster_name)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.patch("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}", headers: {
              "Content-Type": "application/json-patch+json",
            }) do
          [
            {
              op: "add",
              path: "/metadata/annotations/confirmation.gardener.cloud~1deletion",
              value: "true",
            },
          ]
        end
        shoot_body = response&.body
        return convert_shoot_to_cluster(shoot_body)
      end 

      def destroy_cluster(project_id, cluster_name)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.delete("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}")
        shoot_body = response&.body
        return convert_shoot_to_cluster(shoot_body)
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

      # Convert cluster format back to shoot API format
      def convert_cluster_to_shoot(cluster)
        return nil unless cluster.is_a?(Hash)
        
        {
          'metadata' => build_shoot_metadata(cluster),
          'spec' => build_shoot_spec(cluster)
        }.compact
      end

      private

      # convert_shoot_to_cluster -> Helper functions

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

      # convert_cluster_to_shoot -> helper funtions

      # Build metadata section for shoot
      def build_shoot_metadata(cluster)
        metadata = {}
        metadata['uid'] = cluster[:uid] if cluster[:uid]
        metadata['name'] = cluster[:name] if cluster[:name]
        metadata.empty? ? nil : metadata
      end

      # Build spec section for shoot
      def build_shoot_spec(cluster)
        spec = {}
        
        # Basic fields
        spec['region'] = cluster[:region] if cluster[:region]
        spec['purpose'] = cluster[:purpose] if cluster[:purpose]
        spec['cloudProfileName'] = cluster[:cloud_profile_name] if cluster[:cloud_profile_name]
        spec['networking'] = cluster[:networking] if cluster[:networking]
        spec['secretBindingName'] = cluster[:secret_binding_name] if cluster[:secret_binding_name]

        # Provider configuration
        if cluster[:infrastructure] || cluster[:workers]&.any?
          spec['provider'] = build_provider_spec(cluster)
        end
        
        # Kubernetes version
        if cluster[:version]
          spec['kubernetes'] = { 'version' => cluster[:version] }
        end
        
        # Maintenance configuration
        if cluster[:maintenance] || cluster[:auto_update]
          spec['maintenance'] = build_maintenance_spec(cluster)
        end
        
        # Hibernation configuration
        if cluster.dig(:maintenance, :timezone)
          spec['hibernation'] = build_hibernation_spec(cluster)
        end
        
        spec.empty? ? nil : spec
      end

      # Build provider specification
      def build_provider_spec(cluster)
        provider = {}
        
        provider['type'] = cluster[:infrastructure] if cluster[:infrastructure]
        
        if cluster[:workers]&.any?
          provider['workers'] = cluster[:workers].map do |worker|
            build_worker_spec(worker)
          end.compact
        end
        
        provider
      end

      # Build individual worker specification
      def build_worker_spec(worker)
        return nil unless worker.is_a?(Hash)
        
        worker_spec = {}
        worker_spec['name'] = worker[:name] if worker[:name]
        worker_spec['minimum'] = worker[:min] if worker[:min]
        worker_spec['maximum'] = worker[:max] if worker[:max]
        worker_spec['maxSurge'] = worker[:max_surge] if worker[:max_surge]
        worker_spec['zones'] = worker[:zones] if worker[:zones]
        
        # Machine configuration
        if worker[:machine_type] || worker[:architecture] || worker[:machine_image]
          worker_spec['machine'] = build_machine_spec(worker)
        end
        
        # Container runtime
        if worker[:container_runtime]
          worker_spec['cri'] = { 'name' => worker[:container_runtime] }
        end
        
        worker_spec.empty? ? nil : worker_spec
      end

      # Build machine specification for worker
      def build_machine_spec(worker)
        machine = {}
        machine['type'] = worker[:machine_type] if worker[:machine_type]
        machine['architecture'] = worker[:architecture] if worker[:architecture]
        
        if worker[:machine_image]
          image = worker[:machine_image]
          if image[:name] || image[:version]
            machine['image'] = {
              'name' => image[:name],
              'version' => image[:version]
            }.compact
          end
        end
        
        machine
      end

      # Build maintenance specification
      def build_maintenance_spec(cluster)
        maintenance = {}
        
        # Time window
        if cluster[:maintenance]
          maint = cluster[:maintenance]
          if maint[:start_time] || maint[:window_time]
            maintenance['timeWindow'] = {
              'begin' => maint[:start_time],
              'end' => maint[:window_time]
            }.compact
          end
        end
        
        # Auto update settings
        if cluster[:auto_update]
          auto_update = cluster[:auto_update]
          maintenance['autoUpdate'] = {
            'machineImageVersion' => auto_update[:os] || false,
            'kubernetesVersion' => auto_update[:kubernetes] || false
          }
        end
        
        maintenance
      end

      # Build hibernation specification
      def build_hibernation_spec(cluster)
        timezone = cluster.dig(:maintenance, :timezone)
        return nil unless timezone
        
        {
          'schedules' => [
            { 'location' => timezone }
          ]
        }
      end

    end
  end
end