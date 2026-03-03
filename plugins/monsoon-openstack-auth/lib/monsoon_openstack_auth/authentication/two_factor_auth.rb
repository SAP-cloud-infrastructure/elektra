module MonsoonOpenstackAuth
  module Authentication
    class TwoFactorAuth
      TWO_FACTOR_AUTHENTICATION = 'two_factor_authentication'

      class << self
        # Generate proper encryption key for two-factor cookie
        def encryption_key
          @encryption_key ||= ActiveSupport::KeyGenerator.new(
            Rails.application.secret_key_base
          ).generate_key('two_factor_cookie', ActiveSupport::MessageEncryptor.key_len)
        end

        def check_two_factor(controller, username, passcode)
          if MonsoonOpenstackAuth.configuration.two_factor_authentication_method.call(username, passcode)
            set_two_factor_cookie(controller)
            true
          else
            false
          end
        end

        # check if cookie for two factor authentication is valid
        def two_factor_cookie_valid?(controller)
          return false unless controller.request.cookies[TWO_FACTOR_AUTHENTICATION]

          crypt = ActiveSupport::MessageEncryptor.new(encryption_key)
          value = begin
            crypt.decrypt_and_verify(controller.request.cookies[TWO_FACTOR_AUTHENTICATION])
          rescue StandardError
            nil
          end
          value == 'valid'
        end

        # set cookie for two factor authentication
        def set_two_factor_cookie(controller)
          crypt = ActiveSupport::MessageEncryptor.new(encryption_key)
          value = crypt.encrypt_and_sign('valid')
          domain = MonsoonOpenstackAuth.configuration.two_factor_domain
          controller.response.set_cookie(TWO_FACTOR_AUTHENTICATION,
                                         { value: value, expires: Time.now + 4.hours, path: '/', domain: domain })
        end
      end
    end
  end
end
