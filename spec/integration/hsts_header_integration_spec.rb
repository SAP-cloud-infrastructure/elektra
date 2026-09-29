# frozen_string_literal: true

require "spec_helper"

# Regression test for the HSTS security finding:
# the Strict-Transport-Security header must be set on *every* production response
# — including the unauthenticated 302 redirect to the login form — so browsers
# learn the HTTPS-only policy on first contact and are protected against
# SSL-stripping.
#
# The header is configured via config.action_dispatch.default_headers in
# config/environments/production.rb. The test suite boots in the "test"
# environment, so we cannot observe the production default headers on a live
# request here; instead we assert the production environment file configures the
# header with the expected policy. Setting it as a default header (rather than
# enabling config.force_ssl) guarantees it is emitted on all responses without an
# HTTP->HTTPS redirect that would break the plain-HTTP health probes behind the
# TLS-terminating ingress.
describe "HSTS default header (production)" do
  let(:production_env_source) do
    Rails.root.join("config", "environments", "production.rb").read
  end

  it "configures Strict-Transport-Security as a default header" do
    expect(production_env_source).to match(
      /config\.action_dispatch\.default_headers\[["']Strict-Transport-Security["']\]/,
    )
  end

  it "uses a one-year max-age and includes subdomains" do
    expect(production_env_source).to match(/max-age=31536000/)
    expect(production_env_source).to match(/includeSubDomains/)
  end

  it "does not enable force_ssl (would break plain-HTTP health probes)" do
    active_lines =
      production_env_source.lines.reject { |line| line.strip.start_with?("#") }
    expect(active_lines.join).not_to match(/config\.force_ssl\s*=\s*true/)
  end
end
