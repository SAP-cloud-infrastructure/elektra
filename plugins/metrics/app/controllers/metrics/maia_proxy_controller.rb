# frozen_string_literal: true
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and elektra contributors
# SPDX-License-Identifier: Apache-2.0

require "net/http"

module Metrics
  class MaiaProxyController < ::DashboardController
    authorization_context "metrics"
    authorization_required

    # Browsers load module scripts as non-XHR requests. Exempt static assets
    # from the JavaScript response check while keeping API responses protected.
    skip_after_action :verify_same_origin_request, if: :static_asset_request?

    def forward
      unless allowed_path?
        render json: { error: "Forbidden path" }, status: :forbidden and return
      end

      uri = URI.parse("#{maia_host}#{upstream_path}")
      uri.query = request.query_string if request.query_string.present?

      upstream = Net::HTTP.start(
        uri.host, uri.port,
        use_ssl: uri.scheme == "https", open_timeout: 5, read_timeout: 30
      ) do |http|
        upstream_request = Net::HTTP::Get.new(uri.request_uri)
        # Authenticate upstream with the session token, not browser headers.
        upstream_request["X-Auth-Token"] = current_user.token
        http.request(upstream_request)
      end

      # An upstream redirect could send the browser outside Elektra.
      if upstream.is_a?(Net::HTTPRedirection)
        render json: { error: "Unexpected upstream redirect" }, status: :bad_gateway and return
      end

      # Do not forward upstream headers: Maia's auth cookie must stay server-side.
      response.headers["Cache-Control"] = "no-store"
      render plain: upstream.body,
             status: upstream.code.to_i,
             content_type: upstream["content-type"] || "application/octet-stream"
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error("Metrics: Maia proxy timeout: #{e.class}")
      render json: { error: "Upstream timeout" }, status: :gateway_timeout
    rescue SocketError, SystemCallError, IOError, Timeout::Error, OpenSSL::SSL::SSLError,
           Net::HTTPBadResponse, Net::ProtocolError, URI::InvalidURIError, URI::InvalidComponentError => e
      Rails.logger.error("Metrics: Maia proxy error: #{e.class}")
      render json: { error: "Proxy error" }, status: :bad_gateway
    end

    private

    def upstream_path
      "/#{params[:path]}"
    end

    def allowed_path?
      path = upstream_path
      # Reject traversal and encoded delimiters before constructing the upstream URI.
      return false if path.match?(/[\\%?#\x00-\x20]/) || path.include?("//")
      return false if path.split("/").any? { |part| %w[. ..].include?(part) }

      %w[/ui/query /ui/manifest.json /-/ready].include?(path) ||
        path.start_with?("/ui/assets/", "/api/v1/")
    end

    def static_asset_request?
      action_name == "forward" && request.get? && allowed_path? && upstream_path.start_with?("/ui/assets/")
    end

    def maia_host
      region_key = "MAIA_HOST_#{current_region.upcase.tr('-', '_')}"
      ENV[region_key].presence || ENV["MAIA_HOST"].presence || "https://maia.#{current_region}.cloud.sap"
    end
  end
end
