# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
                                       key: "_monsoon-dashboard_session",
                                       expire_after: 14.days,         # Optional: session expiration
                                       secure: Rails.env.production?,
                                       httponly: true,
                                       same_site: :lax

