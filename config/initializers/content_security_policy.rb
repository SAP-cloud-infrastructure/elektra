region = ENV["MONSOON_DASHBOARD_REGION"] || "eu-de-1"
domains = ["dashboard.#{region}.cloud.sap"]

Rails.application.config.content_security_policy do |policy|
  policy.default_src :self  

  # JAVASCRIPT SOURCES
  if Rails.env.development?
    policy.script_src :self, :unsafe_inline, :unsafe_eval, 
                      "http://localhost:3012", 
                      "https://cdn.jsdelivr.net"
  else
    policy.script_src :self, :unsafe_eval
  end

  # CSS SOURCES
  if Rails.env.development?
    policy.style_src :self, :unsafe_inline,
                     "https://cdn.jsdelivr.net", 
                     "https://fonts.googleapis.com"
  else
    policy.style_src :self
  end

  policy.img_src :self, :data, :https

  # NETWORK CONNECTIONS
  connect_sources = [:self, :https, :wss, *domains]
  if Rails.env.development?
    connect_sources += [
      "ws://localhost:3012",
      "wss://localhost:3012",
      "http://localhost:3012"
    ]
  end
  policy.connect_src(*connect_sources)

  policy.frame_ancestors :self
  policy.frame_src :self, "*.cloud.sap" 
  policy.form_action :self
  policy.object_src :none
  policy.base_uri :self
  
  font_sources = [:self, :data, :https]
  font_sources += ["https://fonts.gstatic.com"] if Rails.env.development?
  policy.font_src(*font_sources)

  policy.media_src :self, :https
end

# Only generate nonces in production/staging
if Rails.env.production? || Rails.env.staging?
  Rails.application.config.content_security_policy_nonce_generator = ->(request) { 
    SecureRandom.base64(16) # Better than session.id
  }
  Rails.application.config.content_security_policy_nonce_directives = %w(script-src style-src)
else
  # No nonces in development - simpler debugging
  Rails.application.config.content_security_policy_nonce_generator = nil
  Rails.application.config.content_security_policy_nonce_directives = []
end