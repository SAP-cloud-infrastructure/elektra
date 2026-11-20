# frozen_string_literal: true

module ComputeNjq
  module Api
    # Serves the create-form dropdown data. Every list is returned whole and the
    # UI searches/filters it client-side — images included: they are loaded fully
    # (per visibility) so the flavor<->image coupling can filter them in React.
    class FormOptionsController < Api::BaseController
      def flavors
        handle_api_call { { flavors: compute_service.form_flavors } }
      end

      def keypairs
        handle_api_call { { keypairs: compute_service.form_keypairs } }
      end

      def networks
        handle_api_call { { networks: compute_service.form_networks } }
      end

      def subnets
        handle_api_call { { subnets: compute_service.form_subnets, fixed_ip_ports: compute_service.form_fixed_ip_ports } }
      end

      def security_groups
        handle_api_call { { security_groups: compute_service.form_security_groups } }
      end

      def availability_zones
        handle_api_call { { availability_zones: compute_service.form_availability_zones } }
      end

      def volume_types
        handle_api_call { { volume_types: compute_service.form_volume_types } }
      end

      # Attach-FIP modal data: free FIPs to pick from, plus external networks to
      # allocate a new FIP from.
      def floating_ip_options
        handle_api_call do
          {
            available_floating_ips: compute_service.form_available_floating_ips,
            external_networks: compute_service.form_external_networks,
          }
        end
      end

      # Attach-interface modal data: networks, subnets, and security groups.
      def interface_options
        handle_api_call do
          {
            networks: compute_service.form_networks,
            subnets: compute_service.form_subnets,
            security_groups: compute_service.form_security_groups,
          }
        end
      end

      def images
        handle_api_call { compute_service.form_images }
      end
    end
  end
end
