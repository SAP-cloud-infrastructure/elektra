require 'elektron'
require 'securerandom'

module ElektronMiddlewares
  class ObjectCache < Elektron::Middlewares::Base
    ID_KEYS = %w[id floating_ip]
    BLACKLIST_PARENT_KEYS = %w[version versions]

    def call(request_context)
      response = @next_middleware.call(request_context)
      debug = request_context.options[:debug]

      if debug
        Rails.logger.debug('\033[1;36m########### ObjectCache ##########')
      end

      begin
        objects = if response.code.to_i >= 400
                    # response contains an api error
                    [error_object(response, request_context)]
                  elsif response.body
                    # find objects to be cached
                    find_objects(response.body)
                  end
        ::ObjectCache.cache_objects(objects) if objects
      rescue StandardError => e
        Rails.logger.debug("ObjectCache ERROR: #{e}") if debug
      end

      Rails.logger.debug("########## End ##########\033[0m") if debug
      response
    end

    def error_object(response, request_context)
      data = { 'body' => response.body }
      # try to find request id in headers
      response.header.each_header do |_, v|
        data['id'] = v if v.start_with?('req-')
      end
      # req id not found -> generate an id
      data['id'] ||= SecureRandom.hex
      data['cached_object_type'] = 'error'
      # add some useful infos from request context into object data
      %w[service_name http_method service_url path project_id params data].each do |method_name|
        v = request_context.send(method_name)
        data[method_name] = v if v
      end
      data
    end

    def find_objects(data, parent_key = nil)
      # ignore black listed keys.
      return nil if BLACKLIST_PARENT_KEYS.include?(parent_key)

      if data.is_a?(Hash)
        # only objects with key id are important.
        if data['id']
          # return nil if object contains only the id key.
          # There is no more data available!
          return nil if data.keys.length == 1
          # store the object type inside the object itself.
          data['cached_object_type'] = parent_key.singularize if parent_key
          return [data]
        end
        # objects does not contain the id attribute
        # -> search recursively for objects.
        objects = data.keys.each_with_object([]) do |key, array|
          object = find_objects(data[key], key)
          array << object if object
        end
        return objects.flatten

      elsif data.is_a?(Array)
        objects = data.each_with_object([]) do |hash, array|
          object = find_objects(hash, parent_key)
          array << object if object
        end
        return objects.flatten
      end
      nil
    end
  end
end
