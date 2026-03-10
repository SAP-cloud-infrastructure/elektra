# frozen_string_literal: true

# for ajax calls we do not need permission check and all other checks done by
# Dashboard Controller. So we use Scope Controller with authentication

class AjaxController < ::ScopeController
  include Rescue

  authentication_required domain: lambda { |c|
                                    c.instance_variable_get(:@scoped_domain_id)
                                  },
                          domain_name: lambda { |c|
                            c.instance_variable_get(:@scoped_domain_name)
                          },
                          project: lambda { |c|
                            c.instance_variable_get(:@scoped_project_id)
                          },
                          rescope: true

  before_action :load_active_project

  protected

  def load_active_project
    return unless @scoped_project_id
    return unless respond_to?(:services) && services.respond_to?(:identity)

    # load active project. Try first from ObjectCache and then from API

    cached_active_project = ObjectCache.where(id: @scoped_project_id).first
    @active_project = if cached_active_project
      Identity::Project.new(services.identity, cached_active_project.payload)
    else
      respond_to?(:service_user) ? service_user.identity.find_project(@scoped_project_id) : nil
    end

    return if @active_project && @active_project.name == @scoped_project_name

    @active_project =
      services.identity.find_project(
        @scoped_project_id,
        subtree_as_ids: true,
        parents_as_ids: true
      )
    FriendlyIdEntry.update_project_entry(@active_project) if @active_project
  rescue StandardError => e
    # Silently fail if identity service is not available or other errors occur
    # This allows API controllers that don't need @active_project to work without it
    Rails.logger.debug "Could not load active project: #{e.message}"
    @active_project = nil
  end
end
