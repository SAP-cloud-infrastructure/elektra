module Compute
  module Forms
    class ConfirmHardReset < Core::ServiceLayer::Model
      def initialize(attributes = {})
        super(nil, attributes) # no driver
      end

      validates_presence_of :name
      validate { errors.add(:name, "not correct!") if name != instance_name }
    end
  end
end
