module MonsoonOpenstackAuth
  module Authentication
    # Encapsulates the "sync a rotated password" flow against Keystone without
    # creating a session.
    #
    # Mechanism: validating credentials against Keystone triggers the backend
    # password sync as a side effect. For an outdated password the first attempt
    # returns 401 (and triggers the sync); an immediate retry then returns 201.
    # If the password was already current, the first attempt returns 201 right
    # away. Two consecutive 401s mean the password is genuinely wrong.
    #
    # The call is unscoped (by user id), so no domain is required and the token
    # is discarded — this flow never creates a session.
    class PasswordSync
      # Result states exposed to the caller / UI.
      SUCCESS             = :success
      INVALID_CREDENTIALS = :invalid_credentials
      SERVICE_UNAVAILABLE = :service_unavailable

      Result = Struct.new(:status, :message, keyword_init: true) do
        def success?
          status == SUCCESS
        end
      end

      def initialize(api_client = MonsoonOpenstackAuth.api_client, logger: MonsoonOpenstackAuth.logger)
        @api_client = api_client
        @logger = logger
      end

      # Runs the sync for the given username and new password.
      #
      # The user is identified by name within the given domain (what users type).
      #
      # @return [Result]
      def call(username, password, domain_name = nil)
        return invalid_credentials if username.to_s.empty? || password.to_s.empty?

        # Attempt 1: already current -> done; outdated -> 401 but sync fired.
        attempt(username, password, domain_name)
      rescue MonsoonOpenstackAuth::ConnectionDriver::AuthenticationError => e
        if server_error?(e)
          service_unavailable
        else
          # Attempt 2: the sync from attempt 1 should now have landed.
          retry_after_sync(username, password, domain_name)
        end
      rescue StandardError => e
        @logger.error "PasswordSync -> unexpected error: #{e.class}: #{e.message}"
        service_unavailable
      end

      private

      def retry_after_sync(username, password, domain_name)
        attempt(username, password, domain_name)
      rescue MonsoonOpenstackAuth::ConnectionDriver::AuthenticationError => e
        # Second failure: 5xx -> service issue; otherwise the password is wrong.
        server_error?(e) ? service_unavailable : invalid_credentials
      rescue StandardError => e
        @logger.error "PasswordSync -> unexpected error on retry: #{e.class}: #{e.message}"
        service_unavailable
      end

      # Performs a single validation. Returns a SUCCESS Result or raises
      # AuthenticationError.
      def attempt(username, password, domain_name)
        @api_client.validate_credentials(username, password, domain_name)
        success
      end

      # A 5xx (or connection-level) failure is reported as service unavailable so
      # we never mistake a Keystone outage for a wrong password.
      def server_error?(error)
        code = error.respond_to?(:code) ? error.code.to_i : 0
        code >= 500
      end

      def success
        Result.new(status: SUCCESS, message: 'Your password has been synchronized. Please sign in via Single Sign-On.')
      end

      def invalid_credentials
        Result.new(
          status: INVALID_CREDENTIALS,
          message: 'We could not confirm your new password. If you just changed it, please try once more. ' \
                   'If the problem continues, check your credentials.'
        )
      end

      def service_unavailable
        Result.new(
          status: SERVICE_UNAVAILABLE,
          message: 'The authentication service is temporarily unavailable. Please try again later.'
        )
      end
    end
  end
end
