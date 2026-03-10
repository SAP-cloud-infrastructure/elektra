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
end
