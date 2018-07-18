# frozen_string_literal: true

module Identity
  # This class implements domain actions
  class DomainsController < ::DashboardController
    authorization_required additional_policy_params: {
      domain_id: proc { @scoped_domain_id }
    }, except: %i[show auth_projects]

    def show
      @domain = service_user.identity.find_domain(@scoped_domain_id)
    end

    def index
      @domains = services.identity.domains
    end

    def auth_projects
      projects = service_user.identity.cached_user_projects(
        current_user.id, domain_id: @scoped_domain_id
      ).sort_by(&:name)

      render json: { auth_projects: projects }
    end
  end
end
