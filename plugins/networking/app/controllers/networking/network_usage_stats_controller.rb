# frozen_string_literal: true

module Networking
  # Implements Network actions
  class NetworkUsageStatsController < DashboardController
    authorization_required context: "::networking"

    def index
      # load ids of external networks. Only external networks host floating ips
      external_network_ids =
        services
          .networking
          .networks("router:external" => true, :fields => ["id"])
          .collect(&:id)

      # load network <-> project id map based on rbac and filtered by external
      # networks.
      network_project_ids_map =
        load_network_project_ids_map(external_network_ids)

      # load network usage map: netowrk id => usage data and
      # filter by external networks
      networks_usage = load_networks_usage(external_network_ids)

      # load porject quota map: project id => quota data
      project_quotas = load_project_quotas

      # build statistics
      networks_usage_stats =
        network_project_ids_map.each_with_object(
          [],
        ) do |(network_id, project_ids), stats|
          # skip networks without ip availability data (e.g. network no longer
          # external or not accessible) to avoid null usage entries
          next if networks_usage[network_id].nil?

          # calculate the sum of approved floating ips of all projects
          approved_quota_sum = 0
          project_ids.each do |id|
            if project_quotas[id].nil? || project_quotas[id].floatingip.nil?
              next
            end
            approved_quota_sum += project_quotas[id].floatingip.to_i
          end

          # build projects array and extend it with data from cache.
          projects =
            project_ids.each_with_object([]) do |project_id, list|
              cached_project =
                ObjectCache
                  .where(cached_object_type: "project", id: project_id)
                  .pluck(:name, :domain_id)
                  .first

              list << {
                id: project_id,
                name: cached_project && cached_project[0],
                domain_id: cached_project && cached_project[1],
                quota: project_quotas[project_id],
              }
            end

          stats << {
            usage: networks_usage[network_id],
            floating_ip_quota: approved_quota_sum,
            projects: projects,
          }
        end

      render json: { network_usage_stats: networks_usage_stats }
    end

    protected

    def load_network_project_ids_map(relevant_ids = nil)
      options = { object_type: "network", fields: %w[target_tenant object_id] }
      services
        .networking
        .rbacs(options)
        .each_with_object({}) do |rbac, map|
          network_id = rbac.read("object_id")
          next unless relevant_ids.nil? || relevant_ids.include?(network_id)
          map[network_id] ||= []
          map[network_id] << rbac.target_tenant
        end
    end

    def load_networks_usage(relevant_ids = nil)
      services
        .networking
        .network_ip_availabilities
        .each_with_object({}) do |availability, usage|
          unless relevant_ids.nil? ||
                   relevant_ids.include?(availability.network_id)
            next
          end
          usage[availability.network_id] = availability
        end
    end

    def load_project_quotas
      services
        .networking
        .quotas
        .each_with_object({}) do |quota, map|
          project_id = quota.project_id || quota.tenant_id
          map[project_id] = quota
        end
    end
  end
end
