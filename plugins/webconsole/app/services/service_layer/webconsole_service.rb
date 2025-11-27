# frozen_string_literal: true

module ServiceLayer
  # webconsole
  class WebconsoleService < Core::ServiceLayer::Service
    def available?(_action_name_sym = nil)
      elektron.service?("webcli") && elektron.service?("identity")
    end

    def get_url(region)
      response = elektron.service("webcli",{interface: "public"}).get(
        "auth/#{elektron.user_name}",
        {},
        { headers: { "X-OS-Region" => region } }
      )
      
      # Response body is a Hash in dev but a JSON string in prod - normalize it
      body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body
      body["url"]
    rescue => e
      Rails.logger.error("Webconsole URL fetch failed: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      raise  
    end
  end
end
