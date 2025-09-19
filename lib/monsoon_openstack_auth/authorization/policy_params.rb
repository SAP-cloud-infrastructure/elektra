module MonsoonOpenstackAuth
  module Authorization
    class PolicyParams
      def self.build(params={})
        policy_params = {}
        params.each do |name,value|
          policy_params[name.to_sym]=convert_to_object(value)
        end
        policy_params
      end
      
      def self.convert_to_object(params)
        if params.is_a?(Hash)
          converted_params = {}
          
          params.each do |k,v|
            converted_params[k.to_sym] = convert_to_object(v)
          end
          
          return OpenStruct.new(converted_params)
        else
          return params
        end
      end
    end
  end
end