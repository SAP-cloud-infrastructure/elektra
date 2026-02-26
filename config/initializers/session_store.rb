# # Be sure to restart your server when you modify this file.
# Rails.application.config.session_store :active_record_store,
#                                        key: "_monsoon-dashboard_session"

# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
                                       key: "_monsoon-dashboard_session",
                                       expire_after: 14.days,         # Optional: session expiration
                                       secure: Rails.env.production?,
                                       httponly: true,
                                       same_site: :lax

