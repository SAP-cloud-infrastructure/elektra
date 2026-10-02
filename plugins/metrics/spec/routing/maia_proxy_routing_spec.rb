# frozen_string_literal: true
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and elektra contributors
# SPDX-License-Identifier: Apache-2.0

require "spec_helper"

describe "Maia proxy routing", type: :routing do
  routes { Metrics::Engine.routes }

  %w[ui/query ui/assets/index-123.js ui/assets/index-123.css ui/manifest.json api/v1/query -/ready].each do |path|
    it "preserves the complete #{path} path" do
      expect(get: "/maia/#{path}").to route_to(
        controller: "metrics/maia_proxy", action: "forward", path: path
      )
    end
  end

  it "does not expose POST through the browser proxy" do
    expect(post: "/maia/api/v1/query").not_to be_routable
  end

  it "generates the dashboard link with the engine's domain and project scope" do
    mount = Rails.application.routes.url_helpers.metrics_plugin_path(domain_id: "domain", project_id: "project")
    path = Metrics::Engine.routes.url_helpers.maia_proxy_path(path: "ui/query", script_name: mount)
    expect(path).to eq("/domain/project/metrics/maia/ui/query")
    expect(Rails.application.routes.recognize_path(path)).to include(
      controller: "metrics/maia_proxy", action: "forward", path: "ui/query",
      domain_id: "domain", project_id: "project"
    )
  end
end
