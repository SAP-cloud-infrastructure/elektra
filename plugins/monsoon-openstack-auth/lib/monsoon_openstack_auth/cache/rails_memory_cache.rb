module MonsoonOpenstackAuth
  module Cache
    class RailsMemoryCache

      def fetch options,&block
        Rails.cache.fetch("#{options[:key]}@#{options[:scope]}", expires_in: 20.seconds) do
          block.yield
        end
      end

    end
  end
end