class FeedbackController < ActionController::Base
  include MonsoonOpenstackAuth::Authentication
  include Services
  include CurrentUserWrapper

  authentication_required rescope: false, except: [:cors_preflight]

  # CSRF protection enabled for maximum security
  # Aurora must first call /system/feedback_token to get CSRF token
  # Skip CSRF only for:
  # - OPTIONS preflight (CORS)
  # - Token endpoint (to get the CSRF token)
  skip_before_action :verify_authenticity_token, only: [:cors_preflight, :csrf_token]
  protect_from_forgery with: :null_session, except: [:cors_preflight]

  before_action :set_cors_headers
  before_action :check_rate_limit, only: [:create]
  before_action :validate_feedback_params, only: [:create]

  # OPTIONS endpoint for CORS preflight
  def cors_preflight
    head :ok
  end

  # Endpoint for Aurora to get CSRF token
  def csrf_token
    render json: {
      csrf_token: form_authenticity_token
    }, status: :ok
  end

  def create
    begin
      FeedbackMailer.user_feedback(
        feedback_message: feedback_params[:feedback_message],
        context: enriched_context
      ).deliver_now

      render json: {
        status: 'success',
        message: 'Feedback submitted successfully'
      }, status: :ok
    rescue EmailDeliveryError => e
      Rails.logger.error "Failed to send feedback email: #{e.message}"
      render json: {
        status: 'error',
        message: 'Failed to send feedback email',
        error: e.message
      }, status: :service_unavailable
    rescue StandardError => e
      Rails.logger.error "Unexpected error sending feedback: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: {
        status: 'error',
        message: 'An unexpected error occurred',
        error: e.message,
        error_class: e.class.name
      }, status: :internal_server_error
    end
  end

  private

  def set_cors_headers
    request_origin = request.headers['Origin']
    allowed_origin = nil

    # In development, allow localhost:3001 (Aurora dev server)
    if Rails.env.development? && request_origin == 'http://localhost:3001'
      allowed_origin = request_origin
    else
      # Production: strict Aurora-only CORS
      aurora_origin = if Rails.application.config.respond_to?(:aurora_host)
                        "https://#{Rails.application.config.aurora_host}"
                      else
                        # Fallback: construct from region and tld
                        "https://dashboard-aurora.#{Rails.application.config.region}.#{Rails.application.config.tld}"
                      end
      allowed_origin = aurora_origin if request_origin == aurora_origin
    end

    # Set CORS headers if origin is allowed
    if allowed_origin
      response.headers['Access-Control-Allow-Origin'] = allowed_origin
      response.headers['Access-Control-Allow-Credentials'] = 'true'
      response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
      response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token'
      response.headers['Access-Control-Allow-Age'] = '3600' # Cache preflight for 1 hour
    end
  end

  def feedback_params
    params.require(:feedback).permit(
      :feedback_message,
      context: [:page_url, :source, :browser, :browser_version, :viewport, :feature, :action]
    )
  end

  def enriched_context
    context = feedback_params[:context] || {}
    context.merge(
      domain_id: current_user.user_domain_id,
      domain_name: current_user.user_domain_name,
      project_id: @scoped_project_id,
      project_name: @scoped_project_name
    )
  end

  def validate_feedback_params
    if feedback_params[:feedback_message].blank?
      render json: {
        status: 'error',
        message: 'Missing required field: feedback_message'
      }, status: :bad_request
      return
    end

    # Validate message length
    if feedback_params[:feedback_message].length > 10_000
      render json: {
        status: 'error',
        message: 'Feedback message too long (maximum 10,000 characters)'
      }, status: :bad_request
      return
    end
  end

  def check_rate_limit
    # Rate limit per user: 10 feedback submissions per hour
    rate_limit_key = "feedback:rate_limit:user:#{current_user.id}"
    rate_limit_max = 10
    rate_limit_period = 1.hour

    count = Rails.cache.read(rate_limit_key) || 0

    if count >= rate_limit_max
      Rails.logger.warn "Rate limit exceeded for user #{current_user.id} - IP: #{request.remote_ip}"
      render json: {
        status: 'error',
        message: 'Too many feedback submissions. Please try again later.'
      }, status: :too_many_requests
      return
    end

    # Increment counter
    Rails.cache.write(rate_limit_key, count + 1, expires_in: rate_limit_period)
  end
end
