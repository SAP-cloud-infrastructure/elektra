module NavigationHelper
  def navigation_context(domain, project)
    if domain != "ccadmin"
      :services
    elsif project == "cloud_admin"
      :cloud_admin
    else
      :services
    end
  end

  # Load the current project for navigation visibility checks
  # Uses ObjectCache for performance, same approach as DashboardController#load_active_project
  def load_project_for_navigation
    return nil unless @scoped_project_id

    cached_project = ObjectCache.where(id: @scoped_project_id).first
    cached_project ? Identity::Project.new(services.identity, cached_project.payload) : nil
  end
end
