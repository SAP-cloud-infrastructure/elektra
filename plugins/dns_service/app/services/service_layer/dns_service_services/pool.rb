# frozen_string_literal: true

module ServiceLayer
  module DnsServiceServices
    # This module implements Openstack Designate Pool API
    module Pool
      def pool_map
        @pool_map ||= class_map_proc(DnsService::Pool)
      end

      def pools(filter = {})
        response = elektron_dns.get("pools", filter)
        {
          items: response.map_to("body.pools", &pool_map),
          total: response.body.fetch("metadata", {}).fetch("total_count", nil),
        }
      end

      def pool_shares(pool_id)
        response = elektron_dns.get("pools/#{pool_id}/shares", all_projects: true)
        response.body.fetch("shared_pools", [])
      rescue Elektron::Errors::ApiResponse => e
        nil
      end

      # Returns only pools that have been shared to the given keystone domain_id.
      # Falls back to all pools if the pool shares API is unavailable.
      def pools_for_domain(domain_id)
        all_pools = pools[:items]
        return all_pools if domain_id.blank?

        # nil from pool_shares means the API is not supported — fall back to all pools
        shares_by_pool = all_pools.index_with { |pool| pool_shares(pool.id) }
        return all_pools if shares_by_pool.values.any?(&:nil?)

        all_pools.select do |pool|
          shares_by_pool[pool].any? { |s| s["target_domain_id"] == domain_id }
        end
      rescue StandardError
        pools[:items]
      end

      def find_pool!(id)
        elektron_dns.get("pools/#{id}").map_to("body", &pool_map)
      end

      def find_pool(id)
        find_pool!(id)
      rescue Elektron::Errors::ApiResponse => e
        nil
      end
    end
  end
end
