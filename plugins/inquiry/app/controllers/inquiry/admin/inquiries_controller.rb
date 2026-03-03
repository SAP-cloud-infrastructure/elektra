module Inquiry
  module Admin
    class InquiriesController < ::Inquiry::InquiriesController
      # Override authorization to always require 'update' permission for all actions
      def authorization_rule_name
        "inquiry:inquiry_update"
      end
    end
  end
end
