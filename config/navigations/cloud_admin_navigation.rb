# -*- coding: utf-8 -*-
# Configures your navigation
SimpleNavigation::Configuration.run do |navigation|
  # Specify a custom renderer if needed.
  # The default renderer is SimpleNavigation::Renderer::List which renders HTML lists.
  # The renderer can also be specified as option in the render_navigation call.
  #navigation.renderer = Your::Custom::Renderer

  # Specify the class that will be applied to active navigation items. Defaults to 'selected'
  navigation.selected_class = "active"

  # Specify the class that will be applied to the current leaf of
  # active navigation items. Defaults to 'simple-navigation-active-leaf'
  navigation.active_leaf_class = "nav-active-leaf"

  # Specify if item keys are added to navigation items as id. Defaults to true
  # navigation.autogenerate_item_ids = true

  # You can override the default logic that is used to autogenerate the item ids.
  # To do this, define a Proc which takes the key of the current item as argument.
  # The example below would add a prefix to each key.
  #navigation.id_generator = Proc.new {|key| "my-prefix-#{key}"}

  # If you need to add custom html around item names, you can define a proc that
  # will be called with the name you pass in to the navigation.
  # The example below shows how to wrap items spans.
  #navigation.name_generator = Proc.new {|name, item| "<span>#{name}</span>"}

  # Specify if the auto highlight feature is turned on (globally, for the whole navigation). Defaults to true
  # navigation.auto_highlight = true

  # Specifies whether auto highlight should ignore query params and/or anchors when
  # comparing the navigation items with the current URL. Defaults to true
  #navigation.ignore_query_params_on_auto_highlight = true
  #navigation.ignore_anchors_on_auto_highlight = true

  # If this option is set to true, all item names will be considered as safe (passed through html_safe). Defaults to false.
  #navigation.consider_item_names_as_safe = false

  # Define the primary navigation
  navigation.items do |primary|
    # Add an item to the primary navigation. The following params apply:
    # key - a symbol which uniquely defines your navigation item in the scope of the primary_navigation
    # name - will be displayed in the rendered navigation. This can also be a call to your I18n-framework.
    # url - the address that the generated item links to. You can also use url_helpers (named routes, restful routes helper, url_for etc.)
    # options - can be used to specify attributes that will be included in the rendered navigation item (e.g. id, class etc.)
    #           some special options that can be set:
    #           :if - Specifies a proc to call to determine if the item should
    #                 be rendered (e.g. <tt>if: -> { current_user.admin? }</tt>). The
    #                 proc should evaluate to a true or false value and is evaluated in the context of the view.
    #           :unless - Specifies a proc to call to determine if the item should not
    #                     be rendered (e.g. <tt>unless: -> { current_user.admin? }</tt>). The
    #                     proc should evaluate to a true or false value and is evaluated in the context of the view.
    #           :method - Specifies the http-method for the generated link - default is :get.
    #           :highlights_on - if autohighlighting is turned off and/or you want to explicitly specify
    #                            when the item should be highlighted, you can set a regexp which is matched
    #                            against the current URI.  You may also use a proc, or the symbol <tt>:subpath</tt>.
    #

    primary.item :ccadmin,
                "Cloud Administration",
                nil,
                html: {
                  class: "fancy-nav-header",
                  "data-icon": "cloud-admin-icon",
                },
                if: -> {
                  (current_user and
                    current_user.is_allowed?("cloud_admin") || current_user and
                    current_user.is_allowed?(
                      "context_is_cloud_compute_admin",
                    ) || current_user and
                    current_user.is_allowed?(
                      "context_is_cloud_sharedfilesystem_viewer",
                    )
                  ) ||
                  plugin_available?(:inquiry) ||
                  plugin_available?(:resources) ||
                  plugin_available?(:compute) ||
                  plugin_available?(:shared_filesystem_storage) ||
                  plugin_available?(:lookup) ||
                  plugin_available?(:identity)  
                } do |ccadmin_nav|
      ccadmin_nav.item :requests,
                      "Manage Requests",
                      plugin("inquiry").admin_inquiries_path,
                      if: -> { plugin_available?(:inquiry) }
      ccadmin_nav.item :resources,
                      "Cluster Resources Administration",
                      -> {
                        plugin("resources").v2_cluster_path(cluster_id: "current")
                      },
                      if: -> { plugin_available?(:resources) }
      ccadmin_nav.item :flavors,
                      "Manage Flavors",
                      -> { plugin("compute").flavors_path },
                      if: -> { plugin_available?(:compute) },
                      highlights_on: -> {
                        params[:controller][%r{flavors/?.*}]
                      }
      ccadmin_nav.item :hypervisors,
                      "Compute Host Aggregates & Hypervisors",
                      -> { plugin("compute").host_aggregates_path },
                      if: -> {
                        plugin_available?(:compute) && current_user and
                          current_user.is_allowed?(
                            "context_is_cloud_compute_admin",
                          )
                      },
                      highlights_on: -> {
                        params[:controller][%r{host_aggregates/?.*}]
                      }
      ccadmin_nav.item :network_stats,
                      "Share Aggregates",
                      lambda {
                        plugin(
                          "shared_filesystem_storage",
                        ).cloud_admin_pools_path
                      },
                      highlights_on: -> { params[:controller][%r{pools/?.*}] },
                      if: -> {
                        plugin_available?(:shared_filesystem_storage) &&
                        current_user.is_allowed?(
                          "context_is_cloud_sharedfilesystem_viewer",
                        )
                      }
      ccadmin_nav.item :lookup,
                      "OpenStack Object Lookup",
                      -> { plugin("lookup").root_path },
                      highlights_on: -> { params[:controller][%r{lookup/?.*}] },
                      if: -> {
                        plugin_available?(:lookup)
                      }
      ccadmin_nav.item :delete_project_check,
                      "OpenStack Delete Project Check",
                      -> { plugin("identity").check_delete_project_path },
                      if: -> { services.available?(:identity,:elektron_prodel) && plugin_available?(:identity) }
                      #highlights_on:
                      #  proc {
                      #    params[:controller][%r{check_delete/.*}]
                      #  }
    end

    primary.item :cloudops,
                "Cloudops",
                nil,
                html: {
                  class: "fancy-nav-header",
                  "data-icon": "cloud-admin-icon",
                },
                if: -> { 
                  plugin_available?(:cloudops) ||
                  plugin_available?(:cc_tools) ||
                  plugin_available?(:keppel)
                 } do |cloudops_nav|
      cloudops_nav.item :user_role_assignments,
                        "Cloudops Tools",
                        -> { plugin("cloudops").start_path },
                        if: -> {
                          plugin_available?(:cloudops)
                        }
      cloudops_nav.item :castellum_errors,
                        "Castellum Errors",
                        -> { plugin("cc_tools").castellum_errors_path },
                        if: -> {
                          plugin_available?(:cc_tools) && services.tools.has_castellum? and current_user and
                            current_user.is_allowed?(
                              "tools:show_castellum_errors",
                            )
                        },
                        highlights_on: -> {
                          params[:controller][%r{cc-tools/castellum/?.*}]
                        }
      cloudops_nav.item :limes_errors,
                        "Limes Errors",
                        -> { plugin("cc_tools").limes_errors_path },
                        if: -> {
                          plugin_available?(:cc_tools) && services.tools.has_limes? and current_user and
                            current_user.is_allowed?("tools:show_limes_errors")
                        },
                        highlights_on: -> {
                          params[:controller][%r{cc-tools/limes/?.*}]
                        }
      cloudops_nav.item :keppel_admin,
                        "All Keppel Accounts",
                        -> { plugin("keppel").start_path },
                        if: -> {
                          plugin_available?(:keppel) && services.available?("keppel") and current_user and
                            current_user.is_allowed?("keppel_cloud_viewer")
                        },
                        highlights_on: -> {
                          params[:controller][%r{keppel/?.*}]
                        }
      cloudops_nav.item :archer,
                        "All Archer Services",
                        -> { plugin("networking").archer_widget_path },
                        if: -> {
                          plugin_available?(:networking) &&
                            current_user.has_service?("endpoint-services")
                        },
                        highlights_on: %r{networking/widget/archer/?.*}
    end

    # primary.item :account, 'Account', nil, html: {class: "fancy-nav-header", 'data-icon': "fa fa-user fa-fw" } do |account_nav|
    #   account_nav.item :credentials, 'Credentials', plugin('identity').credentials_path, if: Proc.new { plugin_available?('identity') }
    #
    #   account_nav.dom_attributes = {class: 'content-list'}
    # end

    # Add an item which has a sub navigation (same params, but with block)
    # primary.item :key_2, 'name', url, options do |sub_nav|
    #   # Add an item to the sub navigation (same params again)
    #   sub_nav.item :key_2_1, 'name', url, options
    # end

    # You can also specify a condition-proc that needs to be fullfilled to display an item.
    # Conditions are part of the options. They are evaluated in the context of the views,
    # thus you can use all the methods and vars you have available in the views.
    # primary.item :key_3, 'Admin', url, class: 'special', if: -> { current_user.admin? }
    # primary.item :key_4, 'Account', url, unless: -> { logged_in? }

    # you can also specify html attributes to attach to this particular level
    # works for all levels of the menu
    primary.dom_attributes = { class: "fancy-nav", role: "menu" }

    # You can turn off auto highlighting for a specific level
    #primary.auto_highlight = false
  end
end
