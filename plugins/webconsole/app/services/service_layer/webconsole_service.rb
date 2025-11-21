# frozen_string_literal: true

module ServiceLayer
  # webconsole
  class WebconsoleService < Core::ServiceLayer::Service
    def available?(_action_name_sym = nil)
      elektron.service?("webcli") && elektron.service?("identity")
    end

    def url()
      region=elektron.available_services_regions[0]
      body = elektron.service("webcli").get("auth/#{elektron.user_name}",{headers: {"X-OS-Region": region}}).body
      body["url"]
    end
  end
end
