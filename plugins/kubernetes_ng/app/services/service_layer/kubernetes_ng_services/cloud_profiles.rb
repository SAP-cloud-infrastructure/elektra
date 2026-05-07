module ServiceLayer
  module KubernetesNgServices
    # This module implements Openstack Domain API
    module CloudProfiles
      
      def list_cloud_profiles
        response = elektron_gardener.get("apis/core.gardener.cloud/v1beta1/cloudprofiles")
        cloud_profiles = response&.body&.dig("items") || []

        cloud_profiles.map do |item|
          next unless item.is_a?(Hash)

          metadata = item.dig('metadata') || {}
          spec = item.dig('spec') || {}
          kubernetes = spec.dig('kubernetes') || {}

          # Extract provider config machine images for region filtering
          provider_config_machine_images = extract_provider_config_machine_images(spec)

          {
            uid: metadata['uid'],
            name: metadata['name'],
            provider: spec['type'],
            providerConfig: extract_provider_config(spec),
            kubernetesVersions: safe_map_versions(kubernetes['versions']), # Changed from kubernetes_versions
            machineTypes: safe_map_machine_types(spec['machineTypes']), # Changed from machine_types
            machineImages: safe_map_machine_images(spec['machineImages'], provider_config_machine_images), # Changed from machine_images
            regions: safe_map_regions(spec['regions'])
          }
        end.compact
      end
      
      private

      def extract_provider_config(spec)
        provider_config = spec['providerConfig']
        return {} unless provider_config.is_a?(Hash) && provider_config['apiVersion']
        {
          apiVersion: provider_config['apiVersion']
        }
      end

      def extract_provider_config_machine_images(spec)
        provider_config = spec['providerConfig']
        return {} unless provider_config.is_a?(Hash)

        machine_images = provider_config['machineImages']
        return {} unless machine_images.is_a?(Array)

        # Build a lookup structure: { image_name => { version => [region_names] } }
        lookup = {}
        machine_images.each do |mi|
          next unless mi.is_a?(Hash) && mi['name']

          image_name = mi['name']
          lookup[image_name] ||= {}

          versions = mi['versions']
          next unless versions.is_a?(Array)

          versions.each do |version_info|
            next unless version_info.is_a?(Hash) && version_info['version']

            version = version_info['version']
            regions = version_info['regions']
            next unless regions.is_a?(Array)

            region_names = regions.filter_map { |r| r['name'] if r.is_a?(Hash) }
            lookup[image_name][version] = region_names
          end
        end

        lookup
      end

      def filter_versions_by_region(image_name, versions, provider_config_lookup, current_region)
        return versions unless provider_config_lookup[image_name]

        versions.select do |version|
          region_list = provider_config_lookup.dig(image_name, version)
          # Include version if it's available in the current region
          region_list && region_list.include?(current_region)
        end
      end

      def safe_map_versions(versions)
        return [] unless versions.is_a?(Array)
        
        versions.filter_map do |v|
          v['version'] if v.is_a?(Hash) && v['version']
        end
      end
      
      def safe_map_machine_types(machine_types)
        return [] unless machine_types.is_a?(Array)
        
        machine_types.filter_map do |mt|
          next unless mt.is_a?(Hash) && mt['name']
          
          {
            name: mt['name'],
            architecture: mt['architecture'],
            cpu: mt['cpu'],
            memory: mt['memory']
          }.compact
        end
      end
      
      def safe_map_machine_images(machine_images, provider_config_machine_images)
        return [] unless machine_images.is_a?(Array)

        machine_images.filter_map do |mi|
          next unless mi.is_a?(Hash) && mi['name']

          # Extract versions from spec/machineImages
          spec_versions = mi['versions'].is_a?(Array) ? mi['versions'].filter_map { |v| v['version'] if v.is_a?(Hash) } : []

          # Filter versions by checking availability in providerConfig for the current region
          available_versions = if region && provider_config_machine_images.is_a?(Hash)
            filter_versions_by_region(mi['name'], spec_versions, provider_config_machine_images, region)
          else
            # If no region configured, return all versions
            spec_versions
          end

          {
            name: mi['name'],
            versions: available_versions
          }
        end
      end
      
      def safe_map_regions(regions)
        return [] unless regions.is_a?(Array)

        regions.filter_map do |region|
          next unless region.is_a?(Hash) && region['name']

          zones = region['zones'].is_a?(Array) ? region['zones'].filter_map { |z| z['name'] if z.is_a?(Hash) } : []

          {
            name: region['name'],
            zones: zones.empty? ? nil : zones
          }.compact
        end
      end
    end
  end
end
