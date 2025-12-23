# frozen_string_literal: true

module ServiceLayer
  class SmartopsService < Core::ServiceLayer::Service

    include ServiceLayer::SmartopsServices::Jobs

    def available?(_action_name_sym = nil)
      elektron.service?("smartops")
    end

    def elektron_smartops
      @elektron_identity ||= elektron.service("smartops", path_prefix: "/v1")
    end

  end
end
