class DashboardController < ::ScopeController
  include UrlHelper
  include AvatarHelper
  include Rescue

  prepend_before_action :define_after_login_url

  authentication_required domain: lambda { |c|
    c.instance_variable_get(:@scoped_domain_id)
  },
                          domain_name: lambda { |c|
                            c.instance_variable_get(:@scoped_domain_name)
                          },
                          project: lambda { |c|
                            c.instance_variable_get(:@scoped_project_id)
                          },
                          two_factor: :two_factor_required?

  before_action { params.delete(:after_login) }                    
  before_action :check_terms_of_use, except: %i[accept_terms_of_use terms_of_use]
  before_action :raven_context, except: [:terms_of_use]
  before_action :load_active_project, except: %i[terms_of_use]
  before_action :set_mailer_host, except: %i[terms_of_use]

  def check_terms_of_use
    @orginal_url = request.original_url
    return if tou_accepted? || @domain_config&.feature_hidden?('terms_of_use')

    render action: :accept_terms_of_use
  end

  def accept_terms_of_use
    if params[:terms_of_use]
      # user has accepted terms of use -> save the accepted version in the domain profile
      # 30.03.2021: change domain_profiles.create to create! so that an exception is thrown in case something goes wrong (would have saved me a day of debugging if we had had that)
      UserProfile
        .create_with(
          name: current_user.name,
          email: current_user.email,
          full_name: current_user.full_name
        )
        .find_or_create_by(uid: current_user.id)
        .domain_profiles
        .create!(
          tou_version: Settings.send(@domain_config&.terms_of_use_name).version,
          domain_id: current_user.user_domain_id
        )
      # redirect to original path, this is the case after the TOU view
      if params[:orginal_url]
        redirect_to params[:orginal_url]
      elsif plugin_available?('identity')
        redirect_to main_app.domain_home_path(domain_id: @scoped_domain_fid)
      else
        redirect_to main_app.root_path
      end
    else
      check_terms_of_use
    end
  end

  def terms_of_use
    if current_user
      @tou =
        UserProfile.tou(
          current_user.id,
          current_user.user_domain_id,
          Settings.send(@domain_config&.terms_of_use_name).version
        )
    end
    render action: :terms_of_use
  end

  private 

  def load_active_project
    return unless @scoped_project_id

    @active_project ||=
      services.identity.find_project(
        @scoped_project_id,
        subtree_as_ids: true,
        parents_as_ids: true
      )
  end

  def define_after_login_url
    requested_url = request.env['REQUEST_URI']
    referer_url = request.referer
    referer_url =
      begin
        "#{URI(referer_url).path}?#{URI(referer_url).query}"
      rescue StandardError
        nil
      end

    unless params[:after_login]
      params[:after_login] = if requested_url =~ /(\?|&)modal=true/ &&
                                referer_url =~ /(\?|&)overlay=.+/
                               referer_url
                             else
                               requested_url
                             end
    end
  end

  def tou_accepted?
    UserProfile.tou_accepted?(
      current_user.id,
      current_user.user_domain_id,
      Settings.send(@domain_config&.terms_of_use_name).version
    )
  end

  def set_mailer_host
    ActionMailer::Base.default_url_options[:host] = request.host_with_port
    ActionMailer::Base.default_url_options[:protocol] = request.protocol
  end

  def raven_context
    @sentry_user_context =
      {
        ip_address: request.ip,
        id: current_user.id,
        email: current_user.email,
        username: current_user.name,
        domain: current_user.user_domain_name,
        name: current_user.full_name
      }.reject { |_, v| v.nil? }

    Raven.user_context(@sentry_user_context)

    tags = {}
    tags[:request_id] = request.uuid if request.uuid
    tags[:plugin] = plugin_name if try(:plugin_name).present?
    if current_user.domain_id
      tags[:domain_id] = current_user.domain_id
      tags[:domain_name] = current_user.domain_name
    elsif current_user.project_id
      tags[:project_id] = current_user.project_id
      tags[:project_name] = current_user.project_name
      tags[:project_domain_id] = current_user.project_domain_id
      tags[:project_domain_name] = current_user.project_domain_name
    end
    @sentry_tags_context = tags
    Raven.tags_context(tags)
  end  

  def load_help_text
    # Different types of help files are supported:
    # These files are searched in the corresponding plugin directory in the following order:
    # 1. Plugin-specific help file (e.g., plugin_SERVICE_NAME_help.md)
    # 2. General plugin help file (e.g., plugin_help.md)
    # 3. Plugin-specific help links file (e.g., plugin_SERVICE_NAME_help_links.md)
    # 4. General plugin help links file (e.g., plugin_help_links.md)
    # 5. Plugin-specific external help links file (e.g., plugin_SERVICE_NAME_help_links_external.md)
    # 6. General plugin external help links file (e.g., plugin_help_links_external.md)
    #
    # Whether internal or external links are rendered depends on the domain configuration,
    # which is determined by calling feature_hidden?("internal_help_links").

    plugin_path = params[:controller]

    plugin_index =
      Core::PluginsManager.available_plugins.find_index do |p|
        plugin_path.starts_with?(p.name)
      end

    plugin = Core::PluginsManager.available_plugins.fetch(plugin_index, nil) unless plugin_index.blank?

    return if plugin.blank?

    # get name of the specific service inside the plugin
    # remove plugin name from path
    path = plugin_path.split('/')
    path.shift
    service_name = path.join('_')

    # try to find the help file, check first for service specific help file,
    # next for general plugin help file
    help_file = File.join(plugin.path, "plugin_#{service_name}_help.md")
    # second try to find the general help file
    help_file = File.join(plugin.path, 'plugin_help.md') unless File.exist?(help_file)

    help_links = ''
    # try to find the links file, check first for service specific links file,
    # next for general plugin links file
    help_links = File.join(plugin.path, "plugin_#{service_name}_help_links.md")
    # second try to find the general links file
    help_links = File.join(plugin.path, 'plugin_help_links.md') unless File.exist?(help_links)
    help_links_external = File.join(plugin.path, "plugin_#{service_name}_help_links_external.md")
    # second try to find the general links file
    unless File.exist?(help_links_external)
      help_links_external = File.join(plugin.path, 'plugin_help_links_external.md')
    end

    # load plugin specific help text
    @plugin_help_text = File.new(help_file, 'r').read if File.exist?(help_file)

    # load plugin specific help links
    if @domain_config&.feature_hidden?('internal_help_links')
      # Load external Help
      # load plugin specific help external links
      if File.exist?(help_links_external)
        plugin_help_links_external = File.new(help_links_external, 'r').read
        if @plugin_help_links
          @plugin_help_links += plugin_help_links_external
        elsif plugin_help_links_external
          @plugin_help_links = plugin_help_links_external
        end
      end
    elsif File.exist?(help_links)
      # load internal help links
      @plugin_help_links = File.new(help_links, 'r').read
      # replace internal links with the placeholder of the correct url
      @plugin_help_links = @plugin_help_links.gsub('#{@sap_docu_url}', sap_url_for('documentation'))
    end
  end
end