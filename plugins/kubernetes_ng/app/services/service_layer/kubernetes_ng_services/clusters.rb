module ServiceLayer
  module KubernetesNgServices
    # This module implements Openstack Domain API
    module Clusters
      class KubeconfigGenerationError < StandardError; end

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
        shoot_body = response&.body
        return convert_shoot_to_cluster(shoot_body)
      end
      
      def confirm_cluster_deletion(project_id, cluster_name)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.patch("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}", 
            headers: {
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
        namespace = "garden-#{project_id}"
        response = elektron_gardener.patch("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}", 
            headers:{
              "Content-Type": "application/json-patch+json",
            }) do
          convert_cluster_to_shoot(cluster_spec)
        end
        return response&.body
      end

      def admin_kubeconfig_cluster(project_id, cluster_name, expiration_seconds = 28800)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.post(
          "apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots/#{cluster_name}/adminkubeconfig",
          headers: { "Content-Type" => "application/json" }
        ) do
          {
            spec: {
              expirationSeconds: expiration_seconds # Hardcoded to 8 hours
            }
          }
        end

        decode_kubeconfig(response&.body, cluster_name)
      end

      private

      # Decode the kubeconfig from the API response
      # Raises KubeconfigGenerationError on failure
      def decode_kubeconfig(response_body, cluster_name)
        kubeconfig_base64 = deep_fetch(response_body, "status", "kubeconfig")

        unless kubeconfig_base64
          Rails.logger.error("Kubeconfig not found in response for cluster #{cluster_name}")
          raise KubeconfigGenerationError, "Kubeconfig not found in API response"
        end

        begin
          # Base64.decode64 is lenient and won’t raise an exception for most malformed strings
          # use strict_decode64 to ensure proper error handling
          Base64.strict_decode64(kubeconfig_base64)
        rescue ArgumentError => e
          Rails.logger.error("Failed to decode kubeconfig for cluster #{cluster_name}: #{e.message}")
          raise KubeconfigGenerationError, "Invalid base64 encoding"
        end
      end

      # Helper method for deep fetching nested hash values
      # Usage: deep_fetch(obj, :key1, :key2, :key3)
      # dig alternative that returns nil if a key isn't an existing hash
      def deep_fetch(obj, *keys)
        keys.reduce(obj) do |current, key|
          hash = Hash.try_convert(current)
          return nil unless hash
          hash[key]
        end
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
          createdBy: metadata.dig('annotations', 'gardener.cloud/created-by'),
          isDeleted: get_cluster_deletion_status(metadata),
          region: spec['region'],
          infrastructure: deep_fetch(spec, 'provider', 'type'),
          status: get_cluster_status(shoot),          
          version: deep_fetch(spec, 'kubernetes', 'version'),
          readiness: get_cluster_readiness(shoot),
          purpose: spec['purpose'],
          addOns: get_enabled_add_ons(spec),
          cloudProfileName: spec['cloudProfileName'],
          namespace: metadata.dig('namespace'),
          secretBindingName: spec['secretBindingName'],          
          lastOperation: safe_map_last_operation(status['lastOperation']),
          lastOperationSummary: get_last_operation_summary(status['lastOperation']),
          lastErrors: safe_map_last_errors(status['lastErrors']),
          labels: metadata['labels'] || {},
          # Worker nodes configuration
          workers: safe_map_workers(deep_fetch(spec, 'provider', 'workers')),
          # Maintenance configuration
          maintenance: get_maintenance_info(spec),
          # Last maintenance state
          lastMaintenance: get_last_maintenance_info(status),
          # Auto update settings
          autoUpdate: get_auto_update_settings(spec),
          raw: shoot
        }.compact
      end
      
      # Convert cluster format back to shoot API format
      def convert_cluster_to_shoot(raw_cluster)
        # Ensure we have a proper Hash, supporting Rails params or any hash-like input
        cluster =
          if raw_cluster.respond_to?(:to_unsafe_h)
            raw_cluster.to_unsafe_h
          elsif raw_cluster.is_a?(Hash)
            raw_cluster
          else
            {}
          end

        # Return nil if the result is empty
        return nil if cluster.empty?

        {
          'metadata' => build_shoot_metadata(cluster),
          'spec' => build_shoot_spec(cluster)
        }.compact
      end
      
      def get_cluster_deletion_status(metadata)
        deletion_timestamp = deep_fetch(metadata, 'deletionTimestamp')
        !deletion_timestamp.nil?
      end

      # returns summary of last operation "{type} {state} ({progress})"
      def get_last_operation_summary(last_operation)
        return nil unless last_operation.is_a?(Hash)
        type = last_operation['type']
        state = last_operation['state']
        progress = last_operation['progress'].is_a?(Numeric) ? "#{last_operation['progress']}%" : nil

        summary_parts = []
        summary_parts << type if type
        summary_parts << state if state
        summary_parts << "(#{progress})" if progress

        summary_parts.empty? ? nil : summary_parts.join(' ')
      end

      def get_enabled_add_ons(spec)
        add_ons = deep_fetch(spec, 'addons')
        return [] unless add_ons.is_a?(Hash)
        add_ons.filter_map do |key, value|
          key if value['enabled'] == true
        end
      end

      # convert_shoot_to_cluster -> Helper functions
      # Shoots will be automatically labeled with the shoot.gardener.cloud/status label. Its value might either be healthy, 
      # progressing, unhealthy or unknown depending on the .status.conditions, .status.lastOperation, and status.lastErrors 
      # of the Shoot. This can be used as an easy filter method to find shoots based on their "health" status.
      def get_cluster_status(shoot)
        status = deep_fetch(shoot, 'metadata', 'labels', 'shoot.gardener.cloud/status')
        # ensure we return knowing values only
        valid_statuses = ['healthy', 'progressing', 'unhealthy', 'unknown']
        unless valid_statuses.include?(status)
          status = 'unknown'
        end
        return status
      end
      
      # Helper function to calculate readiness based on conditions
      def get_cluster_readiness(shoot)
        conditions = deep_fetch(shoot, 'status', 'conditions')
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
              displayValue: condition_display_names[condition['type']] || condition['type'],
              type: condition['type'],
              status: condition['status'],
              message: condition['message'],
              lastUpdateTime: condition['lastUpdateTime'],
            }
          end
        }
      end    
      
      def safe_map_last_operation(last_operation)
        return nil unless last_operation.is_a?(Hash)

        {
          description: last_operation['description'],
          lastUpdateTime: last_operation['lastUpdateTime'],
          progress: last_operation['progress'].is_a?(Numeric) ? last_operation['progress'] : nil,
          state: last_operation['state'],
          type: last_operation['type']
        }.compact
      end

      def safe_map_last_errors(last_errors)
        return [] unless last_errors.is_a?(Array)
        last_errors.filter_map do |error|
          next unless error.is_a?(Hash) && error['description'] && error['taskID']

          {
            description: error['description'],
            taskID: error['taskID'],
            lastUpdateTime: error['lastUpdateTime']
          }.compact
        end
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
            machineType: machine['type'],
            machineImage: {
              name: image['name'],
              version: image['version']
            }.compact,
            containerRuntime: cri['name'],
            min: worker['minimum'],
            max: worker['maximum'],
            actual: nil, # Would need separate API call
            maxSurge: worker['maxSurge'],
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
          startTime: time_window['begin'] || '',
          timezone: deep_fetch(hibernation, 'schedules', 0, 'location') || '',
          windowTime: time_window['end'] || ''
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
        auto_update = deep_fetch(spec, 'maintenance', 'autoUpdate') || {}
        
        {
          os: auto_update['machineImageVersion'] || false,
          kubernetes: auto_update['kubernetesVersion'] || false
        }
      end
      
      # convert_cluster_to_shoot -> helper functions
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

        # Cloud profile
        if (cloud_profile_name = cluster[:cloudProfileName] || cluster[:cloud_profile_name]) # Handle both camelCase and snake_case
          spec['cloudProfile'] = { 'name' => cloud_profile_name }
        end

        # Networking configuration
        spec['networking'] = cluster[:networking].transform_keys(&:to_s) if cluster[:networking]
        
        # Provider configuration
        if cluster[:infrastructure] || cluster[:workers]&.any?
          spec['provider'] = build_provider_spec(cluster)
        end
        
        # Kubernetes version
        if cluster[:kubernetesVersion]
          spec['kubernetes'] = { 'version' => cluster[:kubernetesVersion] }
        end
        
        # Maintenance configuration
        if cluster[:maintenance] || cluster[:autoUpdate] || cluster[:auto_update] # Handle both camelCase and snake_case
          spec['maintenance'] = build_maintenance_spec(cluster)
        end
        
        # Hibernation configuration
        if deep_fetch(cluster, :maintenance, :timezone)
          spec['hibernation'] = build_hibernation_spec(cluster)
        end
        
        spec.empty? ? nil : spec
      end
      
      # Build provider specification
      def build_provider_spec(cluster)
        provider = {}
        
        if (provider_type = cluster[:cloudProfileName] || cluster[:cloud_profile_name]) # Handle both camelCase and snake_case
          provider['type'] = provider_type
        end        
        

        # build infrastructureConfig
        infrastructureConfig = {}
        if (api = deep_fetch(cluster, :infrastructure, :apiVersion))
          infrastructureConfig['apiVersion'] = api
        end

        if (fp = deep_fetch(cluster, :infrastructure, :floatingPoolName))
          infrastructureConfig['floatingPoolName'] = fp
        end

        if (nw = deep_fetch(cluster, :infrastructure, :networkWorkers))
          infrastructureConfig['networks'] = { 'workers' => nw }
        end
        provider['infrastructureConfig'] = infrastructureConfig unless infrastructureConfig.empty?
        
        # build workers
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
        worker_spec['minimum'] = worker[:minimum] if worker[:minimum]
        worker_spec['maximum'] = worker[:maximum] if worker[:maximum]
        worker_spec['maxSurge'] = worker[:maxSurge] || worker[:max_surge] if worker[:maxSurge] || worker[:max_surge] # Handle both camelCase and snake_case
        worker_spec['zones'] = worker[:zones] if worker[:zones]
        
        # Machine configuration
        if worker[:machineType] || worker[:machine_type] || worker[:architecture] || worker[:machineImage] || worker[:machine_image] # Handle both camelCase and snake_case
          worker_spec['machine'] = build_machine_spec(worker)
        end
        
        # Container runtime
        if worker[:containerRuntime] || worker[:container_runtime] # Handle both camelCase and snake_case
          worker_spec['cri'] = { 'name' => worker[:containerRuntime] || worker[:container_runtime] }
        end
        
        worker_spec.empty? ? nil : worker_spec
      end
      
      # Build machine specification for worker
      def build_machine_spec(worker)
        machine = {}
        machine['type'] = worker[:machineType] || worker[:machine_type] if worker[:machineType] || worker[:machine_type] # Handle both camelCase and snake_case
        machine['architecture'] = worker[:architecture] if worker[:architecture]
        
        machine_image = worker[:machineImage] || worker[:machine_image] # Handle both camelCase and snake_case
        if machine_image
          if machine_image[:name] || machine_image[:version]
            machine['image'] = {
              'name' => machine_image[:name],
              'version' => machine_image[:version]
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
          if maint[:startTime] || maint[:start_time] || maint[:windowTime] || maint[:window_time] # Handle both camelCase and snake_case
            maintenance['timeWindow'] = {
              'begin' => maint[:startTime] || maint[:start_time],
              'end' => maint[:windowTime] || maint[:window_time]
            }.compact
          end
        end
        
        # Auto update settings
        auto_update = cluster[:autoUpdate] || cluster[:auto_update] # Handle both camelCase and snake_case
        if auto_update
          maintenance['autoUpdate'] = {
            'machineImageVersion' => auto_update[:os] || false,
            'kubernetesVersion' => auto_update[:kubernetes] || false
          }
        end
        
        maintenance
      end
      
      # Build hibernation specification
      def build_hibernation_spec(cluster)
        timezone = deep_fetch(cluster, :maintenance, :timezone)
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
