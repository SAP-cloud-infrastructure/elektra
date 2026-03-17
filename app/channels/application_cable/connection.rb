module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end
    
    private

    def find_verified_user
      # return if no domain provided
      return reject_unauthorized_connection unless request.params[:domain_id]

      # Get auth token value from session (cookie-based)
      auth_token_value = request.session[:auth_token_value]
      return reject_unauthorized_connection unless auth_token_value

      # Validate token and extract user_id
      begin
        api_client = MonsoonOpenstackAuth.api_client
        token = api_client.validate_token(auth_token_value)

        return reject_unauthorized_connection unless token

        # Extract user_id from validated token
        user_id = token.dig(:user, :id) || token.dig(:user, 'id')
        user_id || reject_unauthorized_connection
      rescue StandardError => e
        Rails.logger.error "WebSocket auth failed: #{e.message}"
        reject_unauthorized_connection
      end
    end
  end
end
