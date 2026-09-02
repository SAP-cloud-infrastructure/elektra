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
        elektron_dns.get("pools/#{pool_id}/shares", all_projects: true).map_to("body.shares")
      rescue Elektron::Errors::ApiResponse
        []
      end

      # Returns only pools that have been shared to the given keystone domain_id.
      # Falls back to all pools if the pool shares API is unavailable.
      def pools_for_domain(domain_id)
        all_pools = pools[:items]
        return all_pools if domain_id.blank?

        all_pools.select do |pool|
          shares = pool_shares(pool.id)
          shares.any? { |s| s["target_keystone_id"] == domain_id }
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
