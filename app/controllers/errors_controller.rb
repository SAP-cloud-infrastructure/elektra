# This class is used by ShowException middleware. See config/environments/production.rb
class ErrorsController < ActionController::Base
  include CurrentUserWrapper
  layout "plain"

  # Introduced skip auth token since responding js generates following error:
  # Security warning: an embedded <script> tag on another site requested protected JavaScript. If you know what you're doing, go ahead and disable forgery protection on this action to permit cross-origin JavaScript embedding.
  skip_before_action :verify_authenticity_token, if: :js_request?

  def error_404
    render action: :page_not_found
  end

  def show
    bc = ActiveSupport::BacktraceCleaner.new
    bc.add_filter { |line| line.gsub(Rails.root.to_s, "") } # strip the Rails.root prefix
    bc.add_silencer { |line| line =~ /puma|rubygems/ } # skip any lines from puma or rubygems

    @exception = request.env["action_dispatch.exception"]
    @exception_wrapper = ActionDispatch::ExceptionWrapper.new(bc, @exception)
    @status_code = @exception_wrapper.status_code
    @rescue_response =
      ActionDispatch::ExceptionWrapper.rescue_responses[@exception.class.name]
    @sentry_event_id = Raven.last_event_id
    @sentry_user_context =
      if current_user
        {
          ip_address: request.ip,
          id: current_user.id,
          email: current_user.email,
          username: current_user.name,
          domain: current_user.user_domain_name,
          name: current_user.full_name,
        }.reject { |_, v| v.nil? }
      else
        {}
      end

    respond_to do |format|
      format.html { render :show, status: @status_code, layout: !request.xhr? }
      format.json { render json: { error: details }, status: @status_code }
      format.js { render json: { error: details }, status: @status_code }
    end
  end

  protected

  def js_request?
    request.format.js?
  end

  def debug_visible?
    params[:debug]
  end
  helper_method :debug_visible?

  def details
    @details ||=
      {}.tap do |h|
        key = @exception.class.name.underscore
        name = @exception.class.name
        message = @exception.message
        token = Raven.last_event_id || request.uuid || "n/a"
        description = "There are no further details available. Sorry!"

        I18n.with_options scope: [:exception, :show, @rescue_response],
                          name: name,
                          message: message,
                          token: token do |i18n|
          h[:title] = i18n.t("#{key}.title", default: name).html_safe
          h[:subtitle] = i18n.t("#{key}.subtitle", default: message).html_safe
          h[:description] = i18n.t(
            "#{key}.description",
            default: description,
          ).html_safe
        end

        # h[:env]       = request.env # commented since it blows up the json redering. If needed we should select needed attributes from the env
        h[:name] = @exception.class.name
        h[:message] = @exception.message
        h[:token] = token
        h[:backtrace] = Rails.env.production? ? "" : (@exception_wrapper&.application_trace&.join("\n") || "") # do not render the backtrace in production
        h[:source] = (
          if @exception.respond_to?(:annoted_source_code)
            @exception.annoted_source_code
          else
            ""
          end
        )
      end
  end
  helper_method :details
end
