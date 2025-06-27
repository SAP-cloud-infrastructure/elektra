# frozen_string_literal: true

module Identity
  # This class implements domain actions
  class DomainsController < ::DashboardController
    authorization_required additional_policy_params: {
                             domain_id: proc { @scoped_domain_id },
                           },
                           except: %i[show auth_projects]
    
    before_action :api_endpoints, only: %i[download_openrc download_openrc_ps1]

    def show
      @domain = service_user.identity.find_domain(@scoped_domain_id)
    end

    def index
      @domains = services.identity.domains
    end

    # to render the projects menu on domain and project level
    # this function is called anytime elektra view es rerendered
    def auth_projects
      projects =
        services.identity.auth_projects(@scoped_domain_id).sort_by(&:name)

      updated_projects = projects.map do |project|
        project.domain_id = @scoped_domain_fid
        project
      end
      
      render json: { auth_projects: updated_projects }
    end

    def api_endpoints
      @token = current_user.token
      @identity_url = current_user.service_url('identity')
    end

    def download_openrc_ps1
      out_data =
        "$env:OS_AUTH_URL=\"#{@identity_url}\"\r\n" \
          "$env:OS_IDENTITY_API_VERSION=\"3\"\r\n" \
          "$env:OS_USERNAME=\"#{current_user.name}\"\r\n" \
          "$env:OS_USER_DOMAIN_NAME=\"#{@scoped_domain_name}\"\r\n" \
          "$env:OS_DOMAIN_NAME=\"#{@scoped_domain_name}\"\r\n" \
          "$Password = Read-Host -Prompt \"Please enter your OpenStack Password\" -AsSecureString\r\n" \
          "$env:OS_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))\r\n" \
          "$env:OS_REGION_NAME=\"#{current_region}\"\r\n"

      send_data(
        out_data,
        type: 'text/plain',
        filename: "openrc-#{@scoped_domain_name}.ps1",
        dispostion: 'inline',
        status: :ok
      )
    end

    def download_openrc
      out_data =
        "export OS_AUTH_URL=#{@identity_url}\n" \
          "export OS_IDENTITY_API_VERSION=3\n" \
          "export OS_USERNAME=#{current_user.name}\n" \
          "export OS_USER_DOMAIN_NAME=\"#{@scoped_domain_name}\"\n" \
          "export OS_DOMAIN_NAME=\"#{@scoped_domain_name}\"\n" \
          "echo \"Please enter your OpenStack Password: \"\n" \
          "read -sr OS_PASSWORD_INPUT\n" \
          "export OS_PASSWORD=$OS_PASSWORD_INPUT\n" \
          "export OS_REGION_NAME=#{current_region}\n"

      send_data(
        out_data,
        type: 'text/plain',
        filename: "openrc-#{@scoped_domain_name}",
        dispostion: 'inline',
        status: :ok
      )
    end

  end
end
