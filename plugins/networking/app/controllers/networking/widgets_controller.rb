module Networking
  # Implements Network actions
  class WidgetsController < DashboardController
    # set policy context
    authorization_context "networking"
    # enforce permission checks. This will automatically
    # investigate the rule name.
    authorization_required only: %i[ports bgp_vpns archer]

    def bgp_vpns
    end

    def security_groups
    end

    def ports
    end

    def archer
      @archer_endpoint = ENV['ARCHER_ENDPOINT'] ||
        current_user.service_url('endpoint-services')
      @quota_service = "endpoint_services"
    end
  end
end
