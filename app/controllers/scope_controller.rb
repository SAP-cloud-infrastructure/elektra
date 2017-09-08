# frozen_string_literal: true

# This class guarantees that a scope is presented.
# All subclasses which require a scope (e.g. domain_id/projects or domain_id/project_id/instances)
# should inherit from this class.
class ScopeController < ::ApplicationController
  prepend_before_action :load_scoped_objects

  def load_scoped_objects
    # initialize scoped domain's and project's friendly id
    # use existing, user's or default domain
    domain_id = (params[:domain_id] ||
                 Rails.application.config.service_user_domain_name)
    project_id = params[:project_id]

    @scoped_domain_fid = @scoped_domain_id = domain_id
    @scoped_project_fid = @scoped_project_id = project_id

    # try to find or create friendly_id entry for domain
    rescoping_service = Dashboard::RescopingService.new(service_user)
    domain_friendly_id = rescoping_service.domain_friendly_id(
      @scoped_domain_fid
    )

    unless domain_friendly_id
      raise Core::Error::DomainNotFound, "Domain #{domain_id} not found!"
    end

    # set scoped domain parameters
    @scoped_domain_id   = domain_friendly_id.key
    @scoped_domain_fid  = domain_friendly_id.slug
    @scoped_domain_name = domain_friendly_id.name

    # try to load or create friendly_id entry for project
    if @scoped_project_id
      project_friendly_id = rescoping_service.project_friendly_id(
        @scoped_domain_id, @scoped_project_fid
      )
    end

    if project_friendly_id
      # set scoped project parameters
      @scoped_project_id   = project_friendly_id.key
      @scoped_project_fid  = project_friendly_id.slug
      @scoped_project_name = project_friendly_id.name
    end

    # if (domain_id != @scoped_domain_fid && domain_id != @scoped_domain_name) ||
    #    project_id != @scoped_project_fid
    if domain_id != @scoped_domain_fid || project_id != @scoped_project_fid
      # url_for does not work for plugins. Use path instead!

      if @scoped_domain_id
        # replace domain_id with domain friendly id
        new_path = request.path.gsub(
          %r{^\/#{domain_id}\/(?<rest>.*)},
          '/' + @scoped_domain_fid + '/\k<rest>'
        )

        unless new_path.include?(@scoped_domain_fid)
          new_path = "/#{@scoped_domain_fid}#{new_path}"
        end
        # replace project_id with freindly id if given
        if @scoped_project_id
          new_path = new_path.gsub(
            %r{^\/(?<domain>.+)\/#{project_id}\/(?<rest>.*)},
            '/\k<domain>/' + @scoped_project_fid + '/\k<rest>'
          )
        end
        redirect_to new_path
      end
    end

    @policy_default_params = { target: {} }
    @policy_default_params[:target][:scoped_domain_name] = @scoped_domain_name
    @policy_default_params[:target][:scoped_project_name] = @scoped_project_name

    @can_access_domain = !@scoped_domain_name.nil?
    @can_access_project = !@scoped_project_name.nil?
  end

  rescue_from(
    'Core::Error::ServiceUserNotAuthenticated', 'Core::Error::DomainNotFound'
  ) do |exception|
    render_exception_page(
      exception,
      title: 'Unsupported Domain',
      description: -> (_e, controller) { "A domain with the name <b>#{controller.params[:domain_id]}</b> doesn't seem to exist. Please check the spelling and try again" },
      details: :message,
      warning: true
    )
  end
end
