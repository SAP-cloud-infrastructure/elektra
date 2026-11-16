# frozen_string_literal: true

module ComputeNjq
  module Api
    # Serves the create-form dropdown data. Small lists are returned whole (the
    # UI searches them client-side); images support server-side search + paging.
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

      def security_groups
        handle_api_call { { security_groups: compute_service.form_security_groups } }
      end

      def availability_zones
        handle_api_call { { availability_zones: compute_service.form_availability_zones } }
      end

      def images
        handle_api_call do
          compute_service.form_images(
            q: params[:q].presence,
            marker: params[:marker].presence,
            limit: (params[:limit] || 50).to_i,
          )
        end
      end
    end
  end
end
