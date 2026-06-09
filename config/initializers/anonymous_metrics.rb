# frozen_string_literal: true

require 'digest'

# Generates anonymous session IDs from session tokens
# Provides privacy-preserving tracking for metrics
module AnonymousMetrics
  # Salt for hashing - MUST be configured in environment
  # Falls back to secret_key_base if not set (not recommended for production)
  SALT = ENV['METRICS_SALT'] || Rails.application.secrets.secret_key_base

  # Generate anonymous ID from session token
  # Uses SHA256 for irreversible hashing to protect privacy
  #
  # @param session_token [String] The session token from cookie
  # @return [String, nil] 16-character hex string or nil if no token
  def self.generate_id(session_token)
    return nil if session_token.blank?

    # SHA256 hash for privacy (irreversible)
    # Take first 16 characters for manageable label size in Prometheus
    Digest::SHA256.hexdigest("#{session_token}-#{SALT}")[0..15]
  end

  # Verify the salt is properly configured
  # Logs a warning if using the default secret_key_base
  def self.verify_salt!
    if SALT == Rails.application.secrets.secret_key_base
      Rails.logger.warn(
        "[AnonymousMetrics] METRICS_SALT not set, using secret_key_base " \
        "(not recommended for production). Set METRICS_SALT environment variable."
      )
    else
      Rails.logger.info("[AnonymousMetrics] Using dedicated METRICS_SALT")
    end
  end
end

# Verify salt configuration on initialization
AnonymousMetrics.verify_salt!
