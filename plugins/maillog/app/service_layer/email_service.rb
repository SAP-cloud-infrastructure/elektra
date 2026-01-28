module ServiceLayer
  class EmailService < Core::ServiceLayer::Service
    include EmailService::NebulaAccount
    include EmailService::CronusAccount
    # include EmailServiceServices::Template

    def available?(_action_name_sym = nil)
      elektron.service?("nebula")
    end

    def elektron_nebula
      @elektron_nebula ||=
        elektron.service("nebula", path_prefix: "/v1")
    end

    def elektron_cronus
      @elektron_cronus ||= elektron.service("email-aws", path_prefix: "/v2")
    end
  end
end