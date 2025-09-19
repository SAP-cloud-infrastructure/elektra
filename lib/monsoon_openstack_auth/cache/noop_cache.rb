module MonsoonOpenstackAuth
  module Cache
    class NoopCache

      def fetch options,&block
          block.yield
      end

    end
  end
end