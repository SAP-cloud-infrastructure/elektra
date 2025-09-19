module MonsoonOpenstackAuth
  module ConnectionDriver
    class Interface

      # returns a token as hash
      def validate_token(auth_token)
        raise MonsoonOpenstackAuth::ConnectionDriver::InterfaceNotImplementedError.new("validate_token is not implemented yet!")
      end
  
      # returns a token as hash
      def authenticate_with_credentials(username,password, user_domain_params=nil)
        raise MonsoonOpenstackAuth::ConnectionDriver::InterfaceNotImplementedError.new("authenticate_with_credentials is not implemented yet!")
      end

      # returns a token as hash
      def authenticate_with_token(token, scope=nil)
        raise MonsoonOpenstackAuth::ConnectionDriver::InterfaceNotImplementedError.new("authenticate_with_token is not implemented yet!")
      end

      # returns a token as hash
      def authenticate_external_user(headers, scope=nil)
        raise MonsoonOpenstackAuth::ConnectionDriver::InterfaceNotImplementedError.new("authenticate_external_user is not implemented yet!")
      end
    
      def authenticate_with_access_key(access_key, scope=nil)
        raise MonsoonOpenstackAuth::ConnectionDriver::InterfaceNotImplementedError.new("authenticate_with_access_key is not implemented yet!")
      end

    end
  end
end