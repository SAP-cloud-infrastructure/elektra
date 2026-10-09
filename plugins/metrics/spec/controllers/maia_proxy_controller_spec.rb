# frozen_string_literal: true
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and elektra contributors
# SPDX-License-Identifier: Apache-2.0

require "spec_helper"

describe Metrics::MaiaProxyController, type: :controller do
  routes { Metrics::Engine.routes }

  let(:default_params) do
    { domain_id: AuthenticationStub.domain_id, project_id: AuthenticationStub.project_id }
  end
  let(:roles) { ["monitoring_viewer"] }
  let(:http) { instance_double(Net::HTTP) }
  let(:upstream) do
    Net::HTTPOK.new("1.1", "200", "OK").tap do |response|
      response["Content-Type"] = "text/html; charset=utf-8"
      allow(response).to receive(:body).and_return("<html>Maia</html>")
    end
  end

  before do
    FriendlyIdEntry.find_or_create_entry("Domain", nil, AuthenticationStub.domain_id, "default")
    FriendlyIdEntry.find_or_create_entry(
      "Project", AuthenticationStub.domain_id, AuthenticationStub.project_id, AuthenticationStub.project_id
    )
    stub_authentication do |token|
      token["roles"] = roles.map { |name| { "name" => name } }
      token
    end
    allow(controller).to receive(:current_region).and_return("testregion")
    allow(Net::HTTP).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(upstream)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MAIA_HOST").and_return(nil)
    allow(ENV).to receive(:[]).with("MAIA_HOST_TESTREGION").and_return(nil)
  end

  def forward(path, **params)
    get :forward, params: default_params.merge(path: path).merge(params)
  end

  it "passes through HTML and its content type without the dashboard layout" do
    forward("ui/query")
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq("<html>Maia</html>")
    expect(response.content_type).to eq("text/html; charset=utf-8")
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "uses the session token, ignoring browser authentication headers and cookies" do
    request.headers["X-Auth-Token"] = "browser-token"
    request.headers["Authorization"] = "Bearer browser-token"
    request.cookies["X-Auth-Token"] = "browser-token"
    expect(http).to receive(:request) do |upstream_request|
      expect(upstream_request).to be_a(Net::HTTP::Get)
      expect(upstream_request["X-Auth-Token"]).to eq(AuthenticationStub.test_token["value"])
      expect(upstream_request["Authorization"]).to be_nil
      expect(upstream_request["Cookie"]).to be_nil
      expect(upstream_request.path).not_to include(AuthenticationStub.test_token["value"])
      upstream
    end
    forward("api/v1/whoami")
  end

  it "does not expose upstream cookies or CORS headers" do
    upstream["Set-Cookie"] = "X-Auth-Token=upstream-secret"
    upstream["Access-Control-Allow-Origin"] = "*"
    upstream["X-Auth-Token"] = "upstream-secret"
    forward("api/v1/whoami")
    expect(response.headers["Set-Cookie"].to_s).not_to include("upstream-secret")
    expect(response.headers["X-Auth-Token"]).to be_nil
    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    expect(response.body).not_to include("upstream-secret")
  end

  it "preserves API query parameters, including project selection and repeated selectors" do
    expect(http).to receive(:request) do |upstream_request|
      uri = URI.parse(upstream_request.path)
      expect(uri.path).to eq("/api/v1/query")
      expect(Rack::Utils.parse_nested_query(uri.query)).to include(
        "query" => 'up{job="api"}', "project_id" => AuthenticationStub.project_id,
        "match" => %w[up other]
      )
      upstream
    end
    forward("api/v1/query", query: 'up{job="api"}', match: %w[up other])
  end

  %w[ui/query ui/manifest.json ui/assets/index-123.js ui/assets/index-123.css api/v1/labels -/ready].each do |path|
    it "forwards #{path}" do
      expect(http).to receive(:request) do |upstream_request|
        expect(URI.parse(upstream_request.path).path).to eq("/#{path}")
        upstream
      end
      forward(path)
      expect(response).to have_http_status(:ok)
    end
  end

  %w[federate metrics Default ui ui-example ui/graph -/ready-extra api/v10/query ui/assets/../query ui/assets/%2e%2e/query ui//assets/index.js].each do |path|
    it "rejects #{path} before opening a connection" do
      forward(path)
      expect(response).to have_http_status(:forbidden)
      expect(Net::HTTP).not_to have_received(:start)
    end
  end

  it "uses TLS and bounded connection/read timeouts" do
    expect(Net::HTTP).to receive(:start).with(
      "maia.testregion.cloud.sap", 443, use_ssl: true, open_timeout: 5, read_timeout: 30
    ).and_yield(http)
    forward("ui/query")
  end

  it "supports an operator-configured local upstream" do
    allow(ENV).to receive(:[]).with("MAIA_HOST").and_return("http://127.0.0.1:9091")
    expect(Net::HTTP).to receive(:start).with(
      "127.0.0.1", 9091, use_ssl: false, open_timeout: 5, read_timeout: 30
    ).and_yield(http)
    forward("ui/query")
  end

  it "prefers the per-region host override" do
    allow(ENV).to receive(:[]).with("MAIA_HOST").and_return("https://unused.example.com")
    allow(ENV).to receive(:[]).with("MAIA_HOST_TESTREGION").and_return("https://maia.example.com")
    expect(Net::HTTP).to receive(:start).with(
      "maia.example.com", 443, use_ssl: true, open_timeout: 5, read_timeout: 30
    ).and_yield(http)
    forward("ui/query")
  end

  [Net::OpenTimeout, Net::ReadTimeout].each do |error|
    it "returns 504 for #{error}" do
      allow(Net::HTTP).to receive(:start).and_raise(error)
      forward("ui/query")
      expect(response).to have_http_status(:gateway_timeout)
    end
  end

  [Errno::ECONNREFUSED, OpenSSL::SSL::SSLError].each do |error|
    it "returns 502 for #{error}" do
      allow(Net::HTTP).to receive(:start).and_raise(error)
      forward("ui/query")
      expect(response).to have_http_status(:bad_gateway)
    end
  end

  it "does not follow or expose an upstream redirect" do
    redirect = Net::HTTPFound.new("1.1", "302", "Found")
    redirect["Location"] = "https://maia.example.com/Default?x-auth-token=secret"
    allow(http).to receive(:request).and_return(redirect)
    forward("ui/query")
    expect(response).to have_http_status(:bad_gateway)
    expect(response.headers["Location"]).to be_nil
    expect(response.body).not_to include("secret")
    expect(http).to have_received(:request).once
  end

  it "preserves an upstream 401 for the SPA's session error handling" do
    allow(upstream).to receive(:code).and_return("401")
    forward("api/v1/projects")
    expect(response).to have_http_status(:unauthorized)
  end

  context "with production forgery protection enabled" do
    around do |example|
      original = described_class.allow_forgery_protection
      described_class.allow_forgery_protection = true
      example.run
    ensure
      described_class.allow_forgery_protection = original
    end

    it "serves a non-XHR module script from the static assets directory" do
      upstream["Content-Type"] = "text/javascript"
      allow(upstream).to receive(:body).and_return("console.log('Maia')")
      forward("ui/assets/index-123.js")
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/javascript")
      expect(response.body).to eq("console.log('Maia')")
    end

    it "retains the JavaScript response protection on API paths" do
      upstream["Content-Type"] = "text/javascript"
      expect { forward("api/v1/query") }.to raise_error(ActionController::InvalidCrossOriginRequest)
    end
  end

  context "without a monitoring role" do
    let(:roles) { ["member"] }

    it "denies access using the real policy before opening a connection" do
      forward("api/v1/query", format: :json)
      expect(response).to have_http_status(:forbidden)
      expect(Net::HTTP).not_to have_received(:start)
    end
  end

  context "with monitoring_admin" do
    let(:roles) { ["monitoring_admin"] }

    it "permits access using the real policy" do
      forward("api/v1/query")
      expect(response).to have_http_status(:ok)
    end
  end
end
