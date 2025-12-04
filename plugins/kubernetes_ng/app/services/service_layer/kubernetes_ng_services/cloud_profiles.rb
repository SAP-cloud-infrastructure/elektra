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
          
          {
            uid: metadata['uid'],
            name: metadata['name'],
            provider: spec['type'],
            providerConfig: extract_provider_config(spec),
            kubernetesVersions: safe_map_versions(kubernetes['versions']), # Changed from kubernetes_versions
            machineTypes: safe_map_machine_types(spec['machineTypes']), # Changed from machine_types
            machineImages: safe_map_machine_images(spec['machineImages']), # Changed from machine_images
            regions: safe_map_regions(spec['regions']),
            volumeTypes: safe_map_volume_types(spec['volumeTypes']) # Changed from volume_types
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
      
      def safe_map_machine_images(machine_images)
        return [] unless machine_images.is_a?(Array)
        
        machine_images.filter_map do |mi|
          next unless mi.is_a?(Hash) && mi['name']
          
          versions = mi['versions'].is_a?(Array) ? mi['versions'].filter_map { |v| v['version'] if v.is_a?(Hash) } : []
          
          {
            name: mi['name'],
            versions: versions
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
      
      def safe_map_volume_types(volume_types)
        return [] unless volume_types.is_a?(Array)
        
        volume_types.filter_map do |vt|
          next unless vt.is_a?(Hash) && vt['name']
          
          {
            name: vt['name']
          }
        end
      end
    end
  end 
end
