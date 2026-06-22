# frozen_string_literal: true

require "spec_helper"

RSpec.describe SLIMetricsMiddleware do
  let(:registry) { Prometheus::Client::Registry.new }
  let(:app) { ->(_env) { [200, { "Content-Type" => "text/html" }, ["OK"]] } }
  let(:middleware) { described_class.new(app, registry: registry) }

  def make_env(path, method: "GET")
    Rack::MockRequest.env_for(path, method: method)
  end

  describe "#initialize" do
    it "registers the elektra_sli histogram" do
      middleware
      expect(registry.get(:elektra_sli)).not_to be_nil
    end

    it "registers the histogram with path and method labels" do
      middleware.call(make_env("/monsoon3/abc123/compute/instances"))
      histogram = registry.get(:elektra_sli)
      value = histogram.get(labels: { path: "compute", method: "get" })
      expect(value).to be_a(Hash)
    end

    it "uses API-proxy-appropriate histogram buckets" do
      middleware.call(make_env("/monsoon3/abc123/compute/instances"))
      histogram = registry.get(:elektra_sli)
      buckets = histogram.get(labels: { path: "compute", method: "get" })

      expect(buckets).to have_key("0.05")
      expect(buckets).to have_key("0.1")
      expect(buckets).to have_key("0.5")
      expect(buckets).to have_key("1.0")
      expect(buckets).to have_key("2.5")
      expect(buckets).to have_key("5.0")
      expect(buckets).to have_key("10.0")
      expect(buckets).to have_key("30.0")
    end

    it "does not use the default sub-5ms buckets" do
      middleware.call(make_env("/monsoon3/abc123/compute/instances"))
      histogram = registry.get(:elektra_sli)
      buckets = histogram.get(labels: { path: "compute", method: "get" })

      expect(buckets).not_to have_key("0.005")
      expect(buckets).not_to have_key("0.01")
      expect(buckets).not_to have_key("0.025")
    end
  end

  describe "#call" do
    context "when path is excluded" do
      it "does not record metrics for /metrics" do
        middleware.call(make_env("/metrics"))
        expect(registry.get(:elektra_sli)).to be_nil
      end

      it "does not record metrics for /assets/ paths" do
        middleware.call(make_env("/assets/application.js"))
        expect(registry.get(:elektra_sli)).to be_nil
      end

      it "does not record metrics for /system/ paths" do
        middleware.call(make_env("/system/health"))
        expect(registry.get(:elektra_sli)).to be_nil
      end

      it "still calls the app for excluded paths" do
        called = false
        counting_app = ->(_env) { called = true; [200, {}, ["OK"]] }
        described_class.new(counting_app, registry: registry).call(make_env("/metrics"))
        expect(called).to be true
      end
    end

    context "plugin extraction from URL structure /:domain_id/:project_id/:plugin/..." do
      it "extracts the plugin from the third path segment" do
        middleware.call(make_env("/monsoon3/abc123/compute/instances"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "compute", method: "get" })
        expect(value["count"]).to eq(1)
      end

      it "extracts networking plugin correctly" do
        middleware.call(make_env("/monsoon3/abc123/networking/routers"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "networking", method: "get" })
        expect(value["count"]).to eq(1)
      end

      it "uses 'root' for the root path" do
        middleware.call(make_env("/"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "root", method: "get" })
        expect(value["count"]).to eq(1)
      end

      it "uses 'root' for domain-only paths (/:domain_id)" do
        middleware.call(make_env("/monsoon3"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "root", method: "get" })
        expect(value["count"]).to eq(1)
      end

      it "uses 'root' for domain+project paths without plugin (/:domain_id/:project_id)" do
        middleware.call(make_env("/monsoon3/abc123"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "root", method: "get" })
        expect(value["count"]).to eq(1)
      end

      it "does not capture domain UUID in the path label" do
        middleware.call(make_env("/monsoon3-d2b33a9d-2fa7-4d3f-a946-4afdf59d995f/abc123/compute/instances"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "compute", method: "get" })
        expect(value["count"]).to eq(1)
      end
    end

    context "method label" do
      %w[GET POST PUT DELETE PATCH].each do |http_method|
        it "records lowercase method label for #{http_method}" do
          middleware.call(make_env("/monsoon3/abc123/compute/instances", method: http_method))
          histogram = registry.get(:elektra_sli)
          value = histogram.get(labels: { path: "compute", method: http_method.downcase })
          expect(value["count"]).to eq(1)
        end
      end
    end

    context "duration recording" do
      it "records a positive duration" do
        middleware.call(make_env("/monsoon3/abc123/compute/instances"))
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "compute", method: "get" })
        expect(value["sum"]).to be > 0
      end

      it "increments count on each request" do
        3.times { middleware.call(make_env("/monsoon3/abc123/compute/instances")) }
        histogram = registry.get(:elektra_sli)
        value = histogram.get(labels: { path: "compute", method: "get" })
        expect(value["count"]).to eq(3)
      end
    end

    context "passthrough behaviour" do
      it "returns the app response unchanged" do
        app_with_response = ->(_env) { [201, { "X-Custom" => "header" }, ["Created"]] }
        mw = described_class.new(app_with_response, registry: registry)
        status, headers, body = mw.call(make_env("/monsoon3/abc123/compute/instances"))

        expect(status).to eq(201)
        expect(headers["X-Custom"]).to eq("header")
        expect(body).to eq(["Created"])
      end

      it "propagates exceptions from the app without recording metrics" do
        failing_app = ->(_env) { raise RuntimeError, "app failure" }
        mw = described_class.new(failing_app, registry: registry)

        expect { mw.call(make_env("/monsoon3/abc123/compute/instances")) }.to raise_error(RuntimeError, "app failure")
      end
    end
  end
end
