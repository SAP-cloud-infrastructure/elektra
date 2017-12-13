# frozen_string_literal: true

module Core
  module ServiceLayerNg
    # Service class
    # each service in app/services/service_layer should inherit from this class.
    # It provides the context of current user
    class Service
      attr_accessor :services
      attr_reader :api_client, :region

      def initialize(api_client)
        @api_client = api_client
        @region = Rails.configuration.default_region
      end

      def available?(_action_name_sym = nil)
        false
      end

      def api
        @api ||= ::Core::Api::ClientWrapper.new(@api_client, self)
      end

      def elektron(options = {})
        key = options.to_s
        @elektron_clients ||= {}
        @elektron_clients[key] ||= Elektron.client(
          {
            token_context: {
              'catalog' => @api_client.auth.catalog,
              'expires_at' => @api_client.auth.instance_variable_get(:@expires)
            },
            token: @api_client.auth.token
          },
          {
            debug: options[:debug],
            interface: (options[:interface] || ENV['DEFAULT_SERVICE_INTERFACE'] || 'internal'),
            region: (options[:region] || @region)
          }
        )
      end

      # def inspect
      #   {}.to_s
      # end

      # This method is used to map raw data to a Object.
      def self.map_to(klazz, data, options = {}, &block)
        if data.is_a?(Array)
          data.collect do |item|
            create_map_object(klazz, item.merge(options), &block)
          end
        elsif data.is_a?(Hash)
          create_map_object(klazz, data.merge(options), &block)
        elsif data.is_a?(ActionController::Parameters)
          create_map_object(klazz, data.to_unsafe_hash.merge(options), &block)
        else
          data
        end
      end

      def map_to(klass, data, options = {})
        if data.is_a?(Array)
          data.collect do |item|
            klass.send(:new, self, (item || {}).merge(options))
          end
        elsif data.is_a?(Hash)
          klass.send(:new, self, data.merge(options))
        elsif data.is_a?(ActionController::Parameters)
          klass.send(:new, self, data.to_unsafe_hash.merge(options))
        else
          data
        end
      end

      # CGI.escape, but without special treatment on spaces
      def self.escape(str, extra_exclude_chars = '')
        str.gsub(/([^a-zA-Z0-9_.-#{extra_exclude_chars}]+)/) do
          '%' + $1.unpack('H2' * $1.bytesize).join('%').upcase
        end
      end

      def escape(str, extra_exclude_chars = '')
        self.class.escape(str, extra_exclude_chars)
      end

      # def catalog
      #   api_client.instance_variable_get('@auth').catalog
      # end

    end
  end
end
