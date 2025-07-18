module ApplicationHelper
  def qa?
    current_region.start_with?("qa-")
  end
  
  def cached_object(searchTerm, options = {})
    objects =
      ObjectCache.where(["id = :term OR name = :term", term: searchTerm])
    objects = objects.where(cached_object_type: options[:type]) if options.key?(
      :type,
    )

    if objects.first
      capture do
        if block_given?
          yield(objects.first.payload)
        else
          content_tag(:span) do
            if options[:url]
              concat link_to(
                       objects.first.name,
                       options[:url],
                       data: {
                         modal: true,
                       },
                     )
            else
              concat objects.first.name
            end
            concat tag(:br)
            concat content_tag(:span, objects.first.id, class: "info-text")
          end
        end
      end
    else
      searchTerm
    end
  end

  def page_title
    "SAP Cloud Infrastructure #{@scoped_domain_name if @scoped_domain_name} #{current_region if respond_to?(:current_region) and current_region}"
  end

  def render_paginatable(items, filter = {}, options = {})
    return if !@pagination_enabled || !items || items.length.zero?
    content_tag(:div, class: "pagination") do
      if @pagination_current_page > 1 || @pagination_has_next
        concat(
          content_tag(
            :span,
            "#{@pagination_seen_items + 1} - #{@pagination_seen_items + items.length} ",
            class: "current-window",
          ),
        )
        if @pagination_current_page > 1
          concat(" | ")
          if filter.key?(:search) and filter.key?(:searchfor)
            concat(
              link_to(
                "Previous Page",
                page: @pagination_current_page - 1,
                marker: items.first.id,
                reverse: true,
                search: filter[:search],
                searchfor: filter[:searchfor],
              ),
            )
          else
            concat(
              link_to(
                "Previous Page",
                page: @pagination_current_page - 1,
                marker: items.first.id,
                reverse: true,
              ),
            )
          end
        end
        if @pagination_has_next
          concat(" | ")
          if filter.key?(:search) and filter.key?(:searchfor)
            concat(
              link_to(
                "Next Page",
                page: @pagination_current_page + 1,
                marker: items.last.id,
                search: filter[:search],
                searchfor: filter[:searchfor],
              ),
            )
          else
            concat(
              link_to(
                "Next Page",
                page: @pagination_current_page + 1,
                marker: items.last.id,
              ),
            )
          end
        end
        unless options[:disable_show_all]
          concat(" | ")
          if filter.key?(:search) and filter.key?(:searchfor)
            concat(
              link_to(
                "All",
                per_page: 9999,
                search: filter[:search],
                searchfor: filter[:searchfor],
              ),
            )
          else
            concat(link_to("All", per_page: 9999))
          end
        end
      end
    end
  end

  # This class is used to create scoped urls for plugin url helpers
  class PluginUrlHelper
    # helper is ApplicationHelper, scope is a hash ({domain_id: DOMAIN_ID, project_id: PROJECT_ID})
    def initialize(helper, plugin_name, scope)
      @plugin_name = plugin_name
      @plugin = helper.send("#{plugin_name}_plugin")
      @main_app = helper.main_app
      @scope = scope
    end

    # delegate all methods to the plugin_helper.
    # Clean the scope parameters before delegation!
    # DEPRECTAED!!! But still nedeed for controller tests :(
    def method_missing(method, *args, &block)
      if method.to_s.ends_with?("_path") || method.to_s.ends_with?("_url")
        # extract options (last args hash member)
        options = args.extract_options!

        # build the scope (delete scope values from options)
        @scope[:domain_id] = options.delete(:domain_id) if options.key?(
          :domain_id,
        )
        @scope[:project_id] = options.delete(:project_id) if options.key?(
          :project_id,
        )
        # add prefix to the path
        options[:script_name] = @main_app.send(
          "#{@plugin_name}_plugin_path",
          @scope,
        )

        # add scope to args to avoid failing tests for redirects.
        # The behavior of tests has changed since rails 5.1.3
        # Redirections in tests lose the scope parameters
        # (domain_id and project_id).
        args << options.merge(@scope)

        # build the path
        @plugin.send(method, *args)
      else
        @plugin.send(method, *args, &block)
      end
    end

    def respond_to_missing?(method_name, include_private = false)
      @plugin.respond_to? method_name
    end
  end
  
  class UnavailablePluginURLHelper
    def self.method_missing(method, *args, &block)
      "##{method.to_s}-plugin-not-available"
    end
  end

  def plugin(name)
    return UnavailablePluginURLHelper unless plugin_available?(name)
    # raise "Plugin #{name} not available!" unless plugin_available?(name)
    PluginUrlHelper.new(
      self,
      name,
      domain_id: @scoped_domain_fid,
      project_id: @scoped_project_fid,
    )
  end

  def plugin_available?(name)
    # domain_config is referenced in the scope_controller and initialize on Rails startup
    # this mehtod is used to check if a plugin is available for the current domain when rendering the navigations
    # The server side part is done in the scope_controller
    # do not check if @domain_config is nil, this is the case for controllers inheriting not from ScopeController 
    unless @domain_config.nil? 
      return false if @domain_config.plugin_hidden?(name.to_s)
    end
    self.respond_to?("#{name}_plugin".to_sym)
  end

  def byte_to_human(bytes)
    kb = bytes.to_f / 1024
    return "#{bytes}Byte" if kb < 1
    mb = kb / 1024
    return "#{kb.round(2)}KB" if mb < 1
    gb = mb / 1024
    return "#{mb.round(2)}MB" if gb < 1
    tb = gb / 1024
    return "#{gb.round(2)}GB" if tb < 1
    return "#{tb.round(2)}TB"
  end

  # ---------------------------------------------------------------------------------------------------
  # Errors Helper
  # ---------------------------------------------------------------------------------------------------
  def render_errors(errors = [])
    content_tag(:ul) do
      errors.each do |error|
        concat(
          content_tag(:li, "#{error.attribute.capitalize}: #{error.message}"),
        )
      end
    end
  end

  # ---------------------------------------------------------------------------------------------------
  # Breadcrumb/Hierarchy Helpers
  # ---------------------------------------------------------------------------------------------------
  def current_project_parents
    current_project =
      ObjectCache.where(
        cached_object_type: "project",
        id: @scoped_project_id,
      ).first
    return [] unless current_project
    parent_id = current_project.payload["parent_id"]
    parents = []
    while parent =
            ObjectCache.where(
              cached_object_type: "project",
              id: parent_id,
            ).first
      parent_id = parent.payload["parent_id"]
      parents << parent
    end

    parents.reverse unless block_given?
    parents.reverse.each { |project| yield(project) }
  end

  def active_project_tree(active_project, auth_projects, options = {})
    tree = active_project.subprojects_ids
    tree = { active_project.id => tree }
    parent_ids = active_project.parents_project_ids
    unless parent_ids.blank?
      parent_ids.compact.each { |key| tree = { key => tree } }
    end

    capture do
      concat subprojects_tree(
               tree,
               auth_projects,
               options.merge(active_project: active_project),
             )
    end
  end

  # render project tree
  def subprojects_tree(subprojects, auth_projects, options = {})
    unless auth_projects.is_a?(Hash)
      auth_projects =
        auth_projects.each_with_object({}) do |project, hash|
          hash[project.id] = project
        end
    end

    content_tag(:ul, class: options.delete(:class)) do
      if subprojects.is_a?(Array)
        subprojects = subprojects.compact
        subprojects
          .map do |subproject_id|
            subproject = auth_projects[subproject_id]
            next if subproject.nil? or subproject.id.nil?
            if options[:active_project] and
                 options[:active_project].id == subproject.id
              content_tag(
                :li,
                options[:active_project].name,
                class: "current-project",
              )
            else
              id =
                (
                  if subproject.respond_to?(:friendly_id)
                    subproject.friendly_id
                  else
                    subproject.id
                  end
                )
              content_tag(
                :li,
                link_to(
                  subproject.name,
                  main_app.project_home_path(
                    domain_id: @scoped_domain_fid,
                    project_id: id,
                  ),
                ),
                id: subproject.id,
              )
            end
          end
          .join("\n")
          .html_safe
      elsif subprojects.is_a?(Hash)
        result = []

        # remove unauthorized project keys. Empty
        subprojects =
          subprojects.each_with_object({}) do |(k, v), hash|
            auth_projects[k].nil? ?
              (v.each { |sub_k, sub_v| hash[sub_k] = sub_v } if v.is_a?(Hash)) :
              hash[k] = v
          end

        subprojects.each do |k, v|
          project = auth_projects[k]

          if project or v.is_a?(Hash)
            is_active_project =
              (
                options[:active_project] and
                  options[:active_project].id == project.id
              )

            if project
              result << content_tag(
                :li,
                id: k,
                class: is_active_project ? "current-project" : "",
              ) do
                capture do
                  if is_active_project
                    concat project.name
                  else
                    id =
                      (
                        if project.respond_to?(:friendly_id)
                          project.friendly_id
                        else
                          project.id
                        end
                      )
                    concat link_to project.name,
                                   main_app.project_home_path(
                                     domain_id: @scoped_domain_fid,
                                     project_id: id,
                                   )
                  end
                  if v.is_a?(Hash)
                    concat subprojects_tree(v, auth_projects, options)
                  end
                end
              end
            end
          end
        end
        result.join("\n").html_safe
      end
    end
  end

  def parents_tree(parents_project_ids, auth_projects, options = {})
    unless parents_project_ids.blank?
      parents_project_ids = parents_project_ids.compact
      auth_projects =
        auth_projects.inject({}) do |hash, pr|
          hash[pr.id] = pr
          hash
        end unless auth_projects.is_a?(Hash)

      if parents_project_ids and parents_project_ids.length > 0
        content_tag(:ul, class: options[:class]) do
          project_id = parents_project_ids.last
          new_parents_project_ids = parents_project_ids[0..-2]
          project = auth_projects[project_id]

          project = nil if (project and project.name == "Project 1_1_1")

          capture do
            if options[:active_project] and
                 options[:active_project].id == project.id
              concat content_tag(
                       :li,
                       options[:active_project].name,
                       class: "current-project",
                     )
            else
              if project
                concat content_tag(
                         :li,
                         link_to(
                           project.name,
                           plugin("identity").project_path(
                             project_id: project.id,
                           ),
                         ),
                         id: project.id,
                       )
              end
            end
            concat parents_tree(new_parents_project_ids, auth_projects)
          end
        end
      end
    end
  end

  # ---------------------------------------------------------------------------------------------------
  # Text Helpers
  # ---------------------------------------------------------------------------------------------------

  def processed_controller_name
    name = controller.controller_name
    return "Services" if name == "pages"

    name.humanize
  end

  def selected_service_name
    return unless current_user
    context =
      (current_user.is_allowed?("cloud_admin")) ? :cloud_admin : :services # this might be a bit ugly. But since we have two separate navs for general services and cloud admin services we have to somehow specify the correct context
    name = active_navigation_item_name(context: context, level: :all)
    name = "Services" if name.blank?
    name
  end

  def selected_category_icon
    return unless current_user
    active_item = active_navigation_item(context: :services, level: 1)
    icon_class = "services-icon"
    icon_class = "#{active_item.key}-icon" if active_item
    icon_class
  end

  def selected_admin_service_name
    name = active_navigation_item_name(context: :admin, level: :all)
    name = "Admin" if name.blank?
    name
  end

  # OLD VERSION!
  # def active_service_breadcrumb
  #   return unless current_user
  #   context = (current_user && current_user.is_allowed?('cloud_admin')) ? :cloud_admin : :services # this might be a bit ugly. But since we have two separate navs for general services and cloud admin services we have to somehow specify the correct context
  #   active_service = active_navigation_item_name(context: context, :level => :all)
  #   crumb = "Home" # Default case, only visible on domain home page
  #   if active_service.blank?
  #     crumb = "Project Overview" unless @active_project.blank? # no service selected, if project is available this is the project home page -> print project name
  #   else
  #     crumb = active_service # print active service name
  #   end
  #   crumb
  # end

  # returns an array with crumb and url
  def active_service_breadcrumb
    return unless current_user
    context =
      (
        if (current_user && current_user.is_allowed?("cloud_admin"))
          :cloud_admin
        else
          :services
        end
      ) # this might be a bit ugly. But since we have two separate navs for general services and cloud admin services we have to somehow specify the correct context
    active_service = active_navigation_item(context: context, level: :all)
    url = request.fullpath # defaults to currenr url
    crumb = "Home" # Default case, only visible on domain home page
    if active_service.blank?
      crumb = "Project Overview" unless @active_project.blank? # no service selected, if project is available this is the project home page -> print project name
    else
      crumb = active_service.name # print active service name
      url = active_service.url
    end
    [crumb, url]
  end

  def body_class
    css_class = controller.controller_name

    page_id = params[:id].split("/").last if params[:id]
    css_class << " #{page_id}" if css_class == "pages"

    css_class
  end

  def domain_class
    "#{@scoped_domain_fid.split("-").first}" if @scoped_domain_fid
  end

  def external_link_to(name, url)
    content_tag :a, href: url do
      # content_tag :span, class: "glyphicon glyphicon-share-alt"
      concat content_tag :span, class: "fa fa-external-link"
      concat name
    end
  end

  def release_state_tag(release_state, explanation = nil)
    unless explanation
      explanation =
        case release_state
        when "experimental"
          "Experimental: There will be errors and/or missing features!"
        when "tech_preview"
          "Tech Preview: Functional preview. Not feature complete."
        when "beta"
          "Beta: Working towards the public release"
        end
    end

    capture do
      content_tag :span,
              class: "release-state release-state-#{release_state}",
              data: {
                toggle: "tooltip",
              },
              title: explanation do
        concat content_tag :i, nil, class: "#{release_state}-icon"
        concat " "
        concat release_state.titleize
      end
    end
  end
end
