# frozen_string_literal: true

module ServiceLayer
  class DnsServiceService < Core::ServiceLayer::Service
    # middleware for elektron to setup headers based on params
    class SetupHeadersMiddleware < ::Elektron::Middlewares::Base
      def call(request_context)
        # In this case it is meaningless. But in the case that this middlware
        # would be added directly to the electron client, this middleware
        # would apply to all services and then we should filter
        # for service name.
        unless request_context.service_name == "dns"
          return @next_middleware.call(request_context)
        end

        # user needs to have admin privileges to ask for all projects
        all_projects = request_context.params.delete(:all_projects)

        # user needs to have admin privileges to impersonate another project
        # don't ask for all and one project at the same time
        project_id =
          request_context.params.delete(:project_id) unless all_projects

        request_context.options[:headers] ||= {}
        if project_id
          request_context.options[:headers][
            "X-Auth-Sudo-Project-Id"
          ] = project_id
        elsif all_projects
          request_context.options[:headers][
            "X-Auth-All-Projects"
          ] = all_projects.to_s
        end
        @next_middleware.call(request_context)
      end
    end

    include DnsServiceServices::Zone
    include DnsServiceServices::Pool
    include DnsServiceServices::Recordset
    include DnsServiceServices::ZoneTransfer
    include DnsServiceServices::Ptr

    def available?(_action_name_sym = nil)
      elektron.service?("dns")
    end

    def elektron_dns
      @elektron_dns ||= create_elektron_service
    end

    private

    def create_elektron_service
      dns = elektron.service("dns", path_prefix: "/v2")
      dns.middlewares.add(SetupHeadersMiddleware)
      dns
    end
  end
end
