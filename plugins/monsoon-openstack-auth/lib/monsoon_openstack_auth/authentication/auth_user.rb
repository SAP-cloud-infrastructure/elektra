module MonsoonOpenstackAuth
  module Authentication
    class AuthUser
      attr_reader :context

      def initialize(token_hash)
        raise MonsoonOpenstackAuth::Authentication::MalformedToken.new("Token is nil.") if token_hash.nil?
        raise MonsoonOpenstackAuth::Authentication::MalformedToken.new("Token should be a hash.") unless token_hash.is_a?(Hash)
        @context = token_hash
      end

      def enabled?
        @enabled ||= @context.dig("user", "enabled")
      end

      # Returns the token value (auth_token)
      def token
        @token ||= @context["value"]
      end

      def is_admin_project_token?
        @is_admin_project_token ||= @context.dig("is_admin_project")
      end

      def id
        @id ||= @context.dig("user", "id")
      end

      def name
        @name ||= @context.dig("user", "name")
      end

      def description
        @description ||= @context.dig("user", "description")
      end

      def user_domain_id
        @user_domain_id ||= @context.dig("user", "domain", "id")
      end

      def user_domain_name
        @user_domain_name ||= @context.dig("user", "domain", "name")
      end

      def domain_id
        @domain_id ||= @context.dig("domain", "id")
      end

      def domain_name
        @domain_name ||= @context.dig("domain", "name")
      end

      def project_id
        @project_id ||= @context.dig("project", "id")
      end

      def project_name
        @project_name ||= @context.dig("project", "name")
      end

      def project_parent_id
        @project_parent_id ||= @context.dig("project", "parent_id")
      end

      def project_domain_id
        @project_domain_id ||= @context.dig("project", "domain", "id")
      end

      def project_domain_name
        @project_domain_name ||= @context.dig("project", "domain", "name")
      end

      def project_scoped
        @project_scoped ||= @context.dig("project")
      end

      def domain_scoped
        @domain_scoped ||= @context.dig("domain")
      end

      def token_expires_at
        @token_expires_at ||= DateTime.parse(@context["expires_at"])
      end

      def token_expired?
        token_expires_at<Time.now
      end

      def token_issued_at
        @token_issued_at ||= DateTime.parse(@context["issued_at"])
      end

      def service_catalog
        @service_catalog ||= (@context["catalog"] || @context["serviceCatalog"] || [])
      end

      def has_service?(type)
        catch(:found) do
          service_catalog.each { |service| throw(:found, true) if service["type"]==type }
          # not found
          false
        end
      end

      def roles
        @roles ||= (@context["roles"] || @context.dig("user", "roles") || [])
      end

      def role_names
        @role_names ||= roles.nil? ? [] : roles.collect{|r| r.is_a?(Hash) ? r["name"] : r}
      end

      def has_role?(name)
        catch(:found) do
          roles.each { |role| throw(:found, true) if role["name"]==name }
          # not found
          false
        end
      end

      def admin?
        if @is_admin.nil?
          @is_admin = catch(:found) do
            # return true if found
            roles.each{ |role| throw(:found, true) if role["name"]=="admin" }
            # else return false
            false
          end
        end
        @is_admin
      end


      def service_url(type, options={})
        region = options[:region] || default_services_region
        interface = options[:interface] || 'public'

        service = service_catalog.select do |service|
          service["type"]==type.to_s
        end.first

        return nil unless service

        endpoint = service["endpoints"].select do |endpoint|
          (endpoint["region_id"]==region.to_s || endpoint["region"]==region.to_s) && endpoint["interface"]==interface.to_s
        end.first

        return nil unless endpoint

        endpoint["url"]
      end


      # Returns the first endpoint region for first non-identity service
      # in the service catalog
      def default_services_region
        @default_services_region ||= catch(:found) do
          service_catalog.each do |service|
            throw(:found, service["endpoints"].first["region"]) if service["type"]!="identity" and service["endpoints"] and service["endpoints"].first
          end
          ''
        end
        @default_services_region.empty? ? nil : @default_services_region
      end

      # Returns list of unique region name values found in service catalog
      def available_services_regions
        unless @regions
          @regions = []
          service_catalog.each do |service|
            next if service["type"]=="identity"
            (service["endpoints"] || []).each do |endpint|
              @regions << endpint['region']
            end
          end
          @regions.uniq!
        end
        @regions
      end

      def is_allowed?(actions, params={})
        authorizer.is_allowed?(actions, params)
      end

      def required_roles(rules)
        authorizer.required_roles(rules)
      end

      protected

      def authorizer
        @authorizer ||= MonsoonOpenstackAuth::Authorization::UserAuthorizer.new(self)
      end
    end
  end
end
