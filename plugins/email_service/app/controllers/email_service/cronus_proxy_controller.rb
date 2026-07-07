module EmailService
  class CronusProxyController < ::DashboardController
    protect_from_forgery with: :exception

    ALLOWED_PREFIXES = %w[
      /v1/header-domains
      /v1/compliance
      /v1/receiving
      /v1/whoami
    ].freeze

    def forward
      cronus_path = "/#{params[:path]}"

      unless ALLOWED_PREFIXES.any? { |prefix| cronus_path.start_with?(prefix) }
        render json: { error: "Forbidden path" }, status: :forbidden and return
      end

      cred = ec2_credential
      unless cred
        render json: { error: "No EC2 credentials found for this project." }, status: :unprocessable_entity and return
      end

      base_url = cronus_endpoint
      query    = request.query_string.present? ? "?#{request.query_string}" : ""
      uri      = URI.parse("#{base_url}#{cronus_path}#{query}")

      http         = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"

      req_class = {
        "GET"    => Net::HTTP::Get,
        "POST"   => Net::HTTP::Post,
        "DELETE" => Net::HTTP::Delete,
        "PATCH"  => Net::HTTP::Patch,
        "PUT"    => Net::HTTP::Put,
      }.fetch(request.method, Net::HTTP::Get)

      req = req_class.new(uri.request_uri)
      req["Content-Type"]      = "application/json"
      req["X-Keystone-Access"] = cred["access"]
      req["X-Keystone-Secret"] = cred["secret"]

      req.body = request.body.read if request.body.present? && !%w[GET DELETE].include?(request.method)

      response = http.request(req)

      render plain: response.body, status: response.code.to_i, content_type: "application/json"
    rescue => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    def cronus_endpoint
      # cronus-api is the management/harmonized API, distinct from the cronus relay endpoint in the catalog
      "https://cronus-api.#{current_region}.cloud.sap"
    end

    def ec2_credential
      all_creds = services.identity.ec2_credentials(current_user.id)
      matching = all_creds.select { |c| (c.respond_to?(:tenant_id) ? c.tenant_id : c["tenant_id"]) == @scoped_project_id }
      cred = matching.last
      return nil unless cred
      access = cred.respond_to?(:access) ? cred.access : cred["access"]
      secret = cred.respond_to?(:secret) ? cred.secret : cred["secret"]
      return nil if access.blank? || secret.blank?
      { "access" => access, "secret" => secret }
    rescue => e
      Rails.logger.error("EmailService: EC2 credential error: #{e.class} #{e.message}")
      nil
    end
  end
end
