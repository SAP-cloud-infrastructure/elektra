# frozen_string_literal: true

require_relative "./elektron_middlewares/debug_logger"
require_relative "./elektron_middlewares/user_logger"
require_relative "./elektron_middlewares/service_user_logger"
require_relative "./elektron_middlewares/cloud_admin_logger"
require_relative "./elektron_middlewares/object_cache"
require_relative "./elektron_middlewares/request_uuid"

module Core
  # this class manages the api clients for service user.
  # The client is created for each domain (organization) and
  # stored in class variable.
  class ApiClientManager
    @service_user_api_client_mutex = Mutex.new
    @cloud_admin_api_client_mutex = Mutex.new

    def self.default_client_params
      {
        region: Rails.configuration.default_region,
        interface: ENV["DEFAULT_SERVICE_INTERFACE"] || "internal",
        debug: Rails.env.development? && ENV["ELEKTRON_QUIET"] != "true",
        http_client: {
          open_timeout: nil,
          read_timeout: 60,
          verify_ssl: Rails.configuration.ssl_verify_peer,
          keep_alive_timeout: 5,
        },
      }
    end

    def self.service_user_api_client(scope_domain)
      return nil if scope_domain.nil?

      @service_user_api_client_mutex.synchronize do
        @service_user_api_clients ||= {}

        # the service user clients are created per domain (organization)
        # and are stored in class variable
        unless @service_user_api_clients[scope_domain]
          @service_user_api_clients[
            scope_domain
          ] = create_service_user_api_client(scope_domain)
        end
      end
      @service_user_api_clients[scope_domain]
    end

    def self.cloud_admin_api_client(auth_url = ::Core.keystone_auth_endpoint)
      @cloud_admin_api_client_mutex.synchronize do
        @cloud_admin_api_clients ||= {}
    
        # Ensure an API client is created per unique auth_url
        unless @cloud_admin_api_clients[auth_url]
          @cloud_admin_api_clients[auth_url] = create_cloud_admin_api_client(auth_url)
        end
      end
      @cloud_admin_api_clients[auth_url]

    end

    def self.user_api_client(current_user)
      create_user_api_client(current_user)
    end

    def self.create_user_api_client(current_user)
      client =
        ::Elektron.client(
          {
            token_context: current_user.context,
            token: current_user.token,
            url: ::Core.keystone_auth_endpoint,
          },
          default_client_params,
        )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::RequestUUID,
        before: ::Elektron::Middlewares::ResponseErrorHandler,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::ObjectCache,
        before: ::Elektron::Middlewares::ResponseErrorHandler,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::UserLogger,
        before: ::Core::ElektronMiddlewares::ObjectCache,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::DebugLogger,
        before: ::Core::ElektronMiddlewares::UserLogger,
      )
      client
    end

    ####################################################
    # Service User is the Domain Admin  
    # 
    # Due to the switch to application credentials, we now use 
    # the cloud_admin user as the service user if application credentials are available. 
    # 
    # Reason:  
    # - Application credentials cannot be rescoped. They can just be created for a specific project in a domain.
    # - Application credentials are being created for the cloud_admin project in the ccadmin domain.  
    # - Since application credentials are created in the cloud_admin project in the ccadmin domain,  
    #   we map the cloud_admin as the service user.  
    # 
    # Uses of Service User:
    # - find or create friendly_id entry for domain: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/services/dashboard/rescoping_service.rb#L21
    # - try to find or create friendly_id entry for domain: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/controllers/scope_controller.rb#L33
    # - try to find domain in friendly ids: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/helpers/view_helper.rb#L70
    # - load user details for current_user: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/controllers/concerns/current_user_wrapper.rb#L31
    # - find user when adding it to a group: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/identity/groups_controller.rb#L38
    # - find a domain in domains controller: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/identity/domains_controller.rb#L12
    # - to update a project: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/identity/projects_controller.rb#L50
    # - to filter out roles: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/concerns/identity/restricted_roles.rb#L15
    # - to fetch cached projects for an user id: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/networking/app/controllers/networking/networks/access_controller.rb#L15
    # - to find project for an user id: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/image/app/controllers/image/os_images/private/members_controller.rb#L18
    # - search live against API in the cache controller: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/controllers/cache_controller.rb#L266
    # - load active project if not in cache: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/app/controllers/dashboard_controller.rb#L247    
    # - get the user name from the openstack id: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/key_manager/app/controllers/key_manager/secrets_controller.rb#L25
    # - get the admins for a project: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/inquiry/app/controllers/inquiry/inquiries_controller.rb#L70
    # - add the admin roles to the project so we need to use the service user to assign the basic admin roles: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/identity/domains/create_wizard_controller.rb#L97
    # - get the user name from the openstack id if available: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/key_manager/app/controllers/key_manager/containers_controller.rb#L19
    # - get the admins for a domain: https://github.com/sapcc/elektra/blob/7c748022a3d6afb110611c354468bed81f2bcf3c/plugins/identity/app/controllers/identity/projects/request_wizard_controller.rb#L37
    #  
    ####################################################

    def self.create_service_user_api_client(scope_domain)
      # If application credentials are available, use the `cloud_admin` user instead of the `service_user`, as application credentials cannot be rescoped.
      if Rails.application.config.use_app_credentials
        return create_cloud_admin_api_client
      end

      auth_config = {
        url: ::Core.keystone_auth_endpoint,
        user_name: Rails.application.config.service_user_id,
        user_domain_name: Rails.application.config.service_user_domain_name,
        password: Rails.application.config.service_user_password,
        scope_domain_name: scope_domain,
      }

      begin
        client = ::Elektron.client(auth_config, default_client_params)
        client.middlewares.add(
          ::Core::ElektronMiddlewares::RequestUUID,
          before: ::Elektron::Middlewares::ResponseErrorHandler,
        )
        client.middlewares.add(
          ::Core::ElektronMiddlewares::ObjectCache,
          before: ::Elektron::Middlewares::ResponseErrorHandler,
        )
        client.middlewares.add(
          ::Core::ElektronMiddlewares::ServiceUserLogger,
          before: ::Core::ElektronMiddlewares::ObjectCache,
        )
        client.middlewares.add(
          ::Core::ElektronMiddlewares::DebugLogger,
          before: ::Core::ElektronMiddlewares::ServiceUserLogger,
        )
        client
      rescue ::Elektron::Errors::ApiResponse => _e
        unless auth_config[:scope_domain_id]
          auth_config.delete(:scope_domain_name)
          auth_config[:scope_domain_id] = scope_domain
          retry
        end

        raise ::Core::Error::ServiceUserNotAuthenticated, <<~ERROR
                Could not authenticate service user.
                domain: #{scope_domain}
              ERROR
      end
    end

    def self.create_cloud_admin_api_client(auth_url)
      auth_params = {
        url: auth_url,
        scope_project_name: Rails.configuration.cloud_admin_project,
        scope_project_domain_name: Rails.configuration.cloud_admin_domain
      }

      # if application credentials exist, use them instead of service user
      if Rails.application.config.use_app_credentials
        auth_params[:application_credential] = {
          'id' => Rails.application.config.app_cred_id,
          'secret' => Rails.application.config.app_cred_secret
        }
      else
        auth_params.merge!(
          user_name: Rails.application.config.service_user_id,
          user_domain_name: Rails.application.config.service_user_domain_name,
          password: Rails.application.config.service_user_password
        )
      end
      client = ::Elektron.client(auth_params, default_client_params)

      client.middlewares.add(
        ::Core::ElektronMiddlewares::RequestUUID,
        before: ::Elektron::Middlewares::ResponseErrorHandler,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::ObjectCache,
        before: ::Elektron::Middlewares::ResponseErrorHandler,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::CloudAdminLogger,
        before: ::Core::ElektronMiddlewares::ObjectCache,
      )
      client.middlewares.add(
        ::Core::ElektronMiddlewares::DebugLogger,
        before: ::Core::ElektronMiddlewares::CloudAdminLogger,
      )
      client
    end
  end
end
