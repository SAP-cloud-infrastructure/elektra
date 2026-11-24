# frozen_string_literal: true

module ComputeNjq
  class ApplicationController < DashboardController
    # Renders the single HAML mount point; React owns everything below it.
    def show; end

    # GET /:scope/compute-njq/instances/:id/console
    # Standalone, chrome-less web-console page (its own slim layout — no Elektra
    # header/sidebar), opened in a new tab from the React console panel. The Nova
    # console URL is embedded in an iframe on this *dashboard-origin* page so the
    # console's wss:// handshake carries the dashboard Origin the proxy expects
    # (opening the raw Nova URL as a top-level tab fails the handshake). The URL
    # carries a short-lived token, so the page is never cached — "Reload Console"
    # reloads it to mint a fresh URL.
    def console
      response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
      response.headers["Pragma"] = "no-cache"
      response.headers["Expires"] = "0"

      compute_service = services.compute_njq.scoped(@scoped_project_id, current_region)
      @instance = compute_service.find_instance(params[:id])
      begin
        @console = compute_service.instance_console(params[:id])
      rescue StandardError => e
        @console_error = "Failed to get remote console: #{e.message}"
        @console = nil
      end
      render layout: "compute_njq/console"
    end

    # compute_njq is a rewrite of the compute plugin and shares its Limes quota
    # category. plugin_name stays "compute_njq" (JS/CSS/policy), but the quota
    # usage widget in the main toolbar must query the "compute" category.
    def quota_project
      "compute"
    end

    private

    # Dashboard#load_help_text resolves the plugin directory via
    # `controller_path.starts_with?(plugin.name)`, which matches "compute"
    # before "compute_njq" (compute_njq starts with compute) and therefore looks
    # for help files in the wrong plugin. We override it to load the help text
    # and links from *this* plugin's directory, mirroring the core behaviour
    # (internal vs. external links, #{@sap_docu_url} interpolation).
    def load_help_text
      plugin = Core::PluginsManager.plugin("compute_njq")
      return if plugin.blank?

      help_file = File.join(plugin.path, "plugin_help.md")
      help_links = File.join(plugin.path, "plugin_help_links.md")
      help_links_external = File.join(plugin.path, "plugin_help_links_external.md")

      @plugin_help_text = File.read(help_file) if File.exist?(help_file)

      if @domain_config&.feature_hidden?("internal_help_links")
        @plugin_help_links = File.read(help_links_external) if File.exist?(help_links_external)
      elsif File.exist?(help_links)
        @plugin_help_links = File.read(help_links).gsub('#{@sap_docu_url}', sap_url_for("documentation"))
      end
    end
  end
end
