class FeedbackController < ActionController::Base
  include MonsoonOpenstackAuth::Authentication
  include Services
  include CurrentUserWrapper

  authentication_required rescope: false

  # Skip CSRF for external calls from Aurora (they share SSO cookie for auth)
  skip_before_action :verify_authenticity_token, only: [:create]

  before_action :validate_api_token, only: [:create]
  before_action :validate_feedback_params, only: [:create]

  def create
    begin
      FeedbackMailer.user_feedback(
        user_email: current_user.email,
        user_name: current_user.full_name || current_user.name,
        feedback_message: feedback_params[:feedback_message],
        user_metadata: enriched_metadata
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

  def feedback_params
    params.require(:feedback).permit(
      :feedback_message,
      user_metadata: {}
    )
  end

  def enriched_metadata
    metadata = feedback_params[:user_metadata] || {}
    metadata.merge(
      user_id: current_user.id,
      user_name: current_user.name,
      domain_id: current_user.user_domain_id
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
  end

  def validate_api_token
    provided_token = request.headers['X-Feedback-API-Token']
    expected_token = ENV['FEEDBACK_API_TOKEN']

    # In development, allow without token for easier testing
    if Rails.env.development? && expected_token.blank?
      Rails.logger.warn "⚠️  DEVELOPMENT MODE: API token validation disabled (FEEDBACK_API_TOKEN not set)"
      return
    end

    # In production/staging, token is required
    if expected_token.blank?
      Rails.logger.error "FEEDBACK_API_TOKEN is not configured in #{Rails.env} environment"
      render json: {
        status: 'error',
        message: 'Service unavailable: API token not configured'
      }, status: :service_unavailable
      return
    end

    # Validate token
    unless provided_token.present? && ActiveSupport::SecurityUtils.secure_compare(provided_token, expected_token)
      Rails.logger.warn "Unauthorized feedback API call - IP: #{request.remote_ip}, Referer: #{request.referer}"
      render json: {
        status: 'error',
        message: 'Unauthorized: Invalid or missing API token'
      }, status: :unauthorized
      return
    end

    Rails.logger.info "Authorized feedback API call from #{request.referer || 'unknown source'}"
  end
end
