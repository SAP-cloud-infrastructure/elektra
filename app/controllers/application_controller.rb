require 'core/audit_logger'
# This class implements functionality to support modal views.
# All subclasses which require modal views should inherit from this class.
class ApplicationController < ActionController::Base

  layout 'application'
  include ApplicationHelper

  # includes services method
  # use: services.SERVICE_NAME.METHOD_NAME
  # (e.g. services.identity.auth_projects)
  include Services
  include CurrentUserWrapper
  include Core::Paginatable

  extend ErrorRenderer


  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :modal?, :plugin_name, :modal_size
  helper_method :release_state

  # Overwrite this method in your controller if you want to set the release
  # state of your plugin to a different value. A tag will be displayed in
  # the main toolbar next to the page header
  # DON'T OVERWRITE THE VALUE HERE IN THE DASHBOARD CONTROLLER
  # Possible values:
  # ----------------
  # "public_release"  (plugin is properly live and works, default)
  # "experimental"    (for plugins that barely work or don't work at all)
  # "tech_preview"    (early preview for a new feature that probably still
  #                    has several bugs)
  # "beta"            (if it's almost ready for public release)
  def release_state
    'public_release'
  end

  # catch all api errors and render exception page

  rescue_from 'Elektron::Errors::Request' do |exception|
    options = {
      title: 'Backend Slowdown Detected',
      description:
        'We are currently experiencing a higher latency in our ' \
          'backend calls. This should be fixed momentarily. Please ' \
          'try again in a couple of minutes.',
      warning: true,
      sentry: false
    }

    # send to sentry if exception isn't a timeout error
    options[:sentry] = true unless exception.message == 'Net::ReadTimeout'

    render_exception_page(exception, options)
  end

  def modal?
    @modal = request.xhr? && params[:modal] ? true : false if @modal.nil?
    @modal
  end

  def modal_size
    params[:modal_size] || 'modal-xl'
  end

  def render(*args)
    options = args.extract_options!
    options[:layout] = 'modal' if modal?
    super(*args, options)
  end

  def redirect_to(options = {}, response_options = {})
    if request.format == Mime[:json] || modal? || params[:polling_service] ||
      params[:do_not_redirect]
      head :ok, location: url_for(options)
    else
      # NOTE: please do not use "allow_other_host: true" here just pass it as an option from the controller where redirect_to is called
      super options, response_options
    end
  end

  def plugin_name
    if @plugin_name.blank?
      tokens = self.class.name.split('::').collect(&:underscore)
      @plugin_name = tokens.find { |t| Core::PluginsManager.plugin?(t) }
    end
    @plugin_name
  end
end
