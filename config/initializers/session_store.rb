# Be sure to restart your server when you modify this file.
Rails.application.config.session_store :active_record_store,
                                       key: "_monsoon-dashboard_session"

# Rails.application.config.session_store :cookie_store,
#   key: "_monsoon-dashboard_session",
#   secure: Rails.env.production?,
#   httponly: true,
#   same_site: :lax