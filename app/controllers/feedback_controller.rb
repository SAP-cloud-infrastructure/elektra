class FeedbackController < ScopeController
  def show
    render :show
  end

  def create
    if feedback_params[:feedback_message].blank?
      @message = 'Feedback message is required'
      @success = false
      render :create
      return
    end

    FeedbackMailer.user_feedback(
      feedback_message: feedback_params[:feedback_message],
      context: enriched_context
    ).deliver_now

    @message = 'Thank you for your feedback!'
    @success = true
  rescue StandardError => e
    Rails.logger.error "Failed to send feedback: #{e.message}"
    @message = 'Failed to send feedback'
    @success = false
  end

  private

  def feedback_params
    params.permit(
      :feedback_message,
      context: [:page_url, :browser, :viewport]
    )
  end

  def enriched_context
    context = (feedback_params[:context] || {}).to_h
    context.merge(
      domain_id: current_user&.user_domain_id,
      domain_name: current_user&.user_domain_name,
      project_id: @scoped_project_id,
      project_name: @scoped_project_name
    )
  end
end
