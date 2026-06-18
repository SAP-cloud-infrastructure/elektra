module Core
  # implements service layer
  module ServiceLayer
    class ServiceNotFoundError < StandardError
    end
    class ServiceParentError < StandardError
    end

    # This class manages services
    class ServicesManager
      @service_classes_mutex = Mutex.new

      class << self
        def service_class(service_name)
          @service_classes_mutex.synchronize { @service_classes ||= {} }

          unless @service_classes[service_name]
            # construct the class name of requested service.
            # For example ServiceLayer::IdentityService.
            # Services must be located in app/services/service_layer
            class_name = service_name.to_s.classify
            # if service_name contains a "s" at the end then add a s
            # to the class_name
            class_name += "s" if service_name.to_s.last == "s"
            # build the complete class name
            class_name = "::ServiceLayer::#{class_name}Service"
            # try to evaluate the class
            @service_classes_mutex.synchronize do
              @service_classes[service_name] = Object.const_get(class_name)
            end
          end

          if Rails.env.development?
            # reload class
            Object.const_get(@service_classes[service_name].name)
          else
            @service_classes[service_name]
          end
        rescue StandardError
          nil
        end

        # create a service for given params
        def service(service_name, api_client)
          klazz = service_class(service_name)

          # raise an error unless the class inherits from Service
          unless klazz < Core::ServiceLayer::Service
            raise ServiceParentError,
                  "service #{klazz.name} is not a subclass of \
                  Core::ServiceLayer::Service"
          end

          # create an instance of the service class
          klazz.try(:new, api_client)
        end
      end

      def initialize(api_client)
        @api_client = api_client
      end

      def has_service_endpoint?(name_or_sym, options = {})
        service_name = name_or_sym.to_s
        @api_client.service_url(service_name, options) != nil
      end

      def available?(service_name, action_name = nil)
        send(service_name.to_sym).send(:available?, action_name.try(:to_sym))
      rescue StandardError
        false
      end

      # this method is called every time the services.identity or
      # services.volume ect. in controller is requested.
      # See InstanceMethods#services
      def method_missing(method_sym, *arguments, &block)
        if self.class.service_class(method_sym)
          # load service from cache if available
          service = instance_variable_get("@#{method_sym}")
          return service if service

          service = self.class.service(method_sym, @api_client)
          service.service_manager = self
          instance_variable_set("@#{method_sym}", service)
        else
          super
        end
      end

      def respond_to_missing?(method_sym, *arguments, &block)
        if self.class.service_class(method_sym)
          true
        else
          super
        end
      end
    end
  end
end
