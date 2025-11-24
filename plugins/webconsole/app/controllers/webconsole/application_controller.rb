module Webconsole
  class ApplicationController < DashboardController
    include UrlHelper

    authorization_context "webconsole"
    # enforce permission checks. This will automatically investigate the rule name.
    authorization_required

    def show
      @token = current_user.token
      @webcli_endpoint = current_user.service_url("webcli")
      @identity_url = current_user.service_url("identity")
      @region = current_region
      @user_name = current_user.name
    end

    def current_context
      result = {
        token: current_user.token,
        webcli_endpoint: current_user.service_url("webcli"),
        identity_url: current_user.service_url("identity"),
        region: current_region,
        user_name: current_user.name,
        url: services.webconsole.get_url(current_region) 
      }

      help_file = File.join(Rails.root, "plugins/webconsole/webconsole_help.md")

      if File.exist?(help_file)
        # load general help content
        general_help_file =
          File.join(Rails.root, "plugins/webconsole/webconsole_general_help.md")
        general_help_source =
          File.new(general_help_file, "r").read if File.exist?(
          general_help_file,
        )
        # replace placeholders inside this content
        general_help_source =
          general_help_source
            .gsub('#{@scoped_domain_name}', @scoped_domain_name)
            .gsub('#{@scoped_project_name}', @scoped_project_name)
            .gsub('#{@active_project.id}', @active_project.id)
            .gsub('#{@token}', current_user.token)
            .gsub('#{@sap_docu_url}', sap_url_for("documentation"))
        # load plugin specific help content
        source = File.new(help_file, "r").read
        # create renderer
        markdown =
          Redcarpet::Markdown.new(
            Redcarpet::Render::HTML,
            autolink: true,
            tables: true,
          )

        # concat and bind general and specific help contents
        result[
          :help_html
        ] = "#{markdown.render(general_help_source)}#{markdown.render(source)}"
      end

      render json: result
    end

    def redirect_to(options = {}, response_status = {})
      if request.xhr?
        head :ok, location: url_for(options)
      else
        super options, response_status
      end
    end
  end
end
