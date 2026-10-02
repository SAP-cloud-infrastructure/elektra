module MonsoonOpenstackAuth
  # Internal status codes exchanged between the BFF (Rails) and the UI/JS caller
  # for the SSO verify flow. These are NOT HTTP statuses: the response is always
  # HTTP 200 so the OAuth proxy does not treat it as "re-authenticate" (which
  # would trigger a redirect loop). The real outcome is carried in the payload.
  module AuthStatus
    OK                  = 'AUTH_OK'
    NO_ACCESS           = 'AUTH_NO_ACCESS'
    FAILED              = 'AUTH_FAILED'
    SERVICE_UNAVAILABLE = 'AUTH_SERVICE_UNAVAILABLE'
  end
end
