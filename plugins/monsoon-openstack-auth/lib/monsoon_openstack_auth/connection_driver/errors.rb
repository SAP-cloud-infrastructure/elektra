module MonsoonOpenstackAuth
  module ConnectionDriver
    class UnknownConnectionDriver < StandardError; end
    class MalformedApiEndpoint < StandardError; end
    class ConfigurationError < StandardError; end
    class InterfaceNotImplementedError < NoMethodError; end
    class ConnectionError < StandardError; end
    
    class AuthenticationError < StandardError
      attr_reader :code
      def initialize(*args)
        super(args.first)
        @code = args.second if args.length>1
      end
    end
  end
end