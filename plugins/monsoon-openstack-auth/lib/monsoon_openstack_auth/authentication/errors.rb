module MonsoonOpenstackAuth
  module Authentication
    class MalformedToken < StandardError; end
    class InvalidRegion < StandardError; end
    class InvalidAuthToken < StandardError; end
    class InvalidUserCredentials < StandardError; end
    class NotAuthorized < StandardError; end
  end
end