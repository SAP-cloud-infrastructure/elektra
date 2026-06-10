# frozen_string_literal: true

require "spec_helper"

RSpec.describe HttpMetricsCollectorMiddleware do
  let(:registry) { Prometheus::Client::Registry.new }
  let(:app) { ->(env) { [status, headers, body] } }
  let(:middleware) { described_class.new(app, registry: registry) }
  let(:status) { 200 }
  let(:headers) { { "Content-Type" => "text/html" } }
  let(:body) { ["OK"] }

  let(:env) do
    Rack::MockRequest.env_for(
      "/test/path",
      method: "GET",
      "HTTP_HOST" => "localhost",
      "action_dispatch.request.path_parameters" => {
        controller: "test_controller",
        action: "index",
        domain_id: "default",
        project_id: "test-project",
      },
    )
  end

  describe "#trace" do
    context "when the app raises an exception" do
      let(:exception) { StandardError.new("Test error") }
      let(:app) { ->(_env) { raise exception } }

      it "increments the exceptions counter with exception class label" do
        # Make a successful call first to initialize metrics
        begin
          middleware.call(Rack::MockRequest.env_for("/system"))
        rescue StandardError
          # First call might fail, that's ok
        end

        exceptions_counter = registry.get(:http_server_exceptions_total)
        initial_count =
          begin
            exceptions_counter.get(labels: { exception: "StandardError" })
          rescue StandardError
            0
          end

        begin
          middleware.call(env)
        rescue StandardError
          # Expected to raise
        end

        new_count =
          exceptions_counter.get(labels: { exception: "StandardError" })
        expect(new_count).to eq(initial_count + 1)
      end

      it "logs the exception with context" do
        expect(Rails.logger).to receive(:error).with(
          /Exception in \/test\/path \(test_controller\/index\): StandardError - Test error/,
        )
        expect(Rails.logger).to receive(:error).with(/spec\/middleware/)

        expect { middleware.call(env) }.to raise_error(StandardError)
      end

      it "re-raises the exception" do
        allow(Rails.logger).to receive(:error)
        expect { middleware.call(env) }.to raise_error(StandardError, "Test error")
      end
    end

    context "when the app succeeds" do
      it "records the request metrics" do
        # Make the call
        middleware.call(env)

        # Verify counters were incremented
        requests_counter = registry.get(:http_server_requests_total)
        durations_histogram =
          registry.get(:http_server_request_duration_seconds)

        expect(requests_counter).not_to be_nil
        expect(durations_histogram).not_to be_nil

        # Check that metrics exist with our labels
        labels = {
          code: "200",
          method: "get",
          host: "localhost",
          domain: "default",
          project: "test-project",
          controller: "test_controller",
          action: "index",
          plugin: "",
          xhr: false,
        }

        expect(requests_counter.get(labels: labels)).to eq(1)
        # For histogram, just verify it was recorded (value exists)
        histogram_value = durations_histogram.get(labels: labels)
        expect(histogram_value).to be_a(Hash)
        expect(histogram_value).to have_key("sum")
        expect(histogram_value["sum"]).to be > 0
      end
    end
  end

  describe "#record" do
    context "when metrics recording fails" do
      before do
        allow_any_instance_of(Prometheus::Client::Counter).to receive(
          :increment,
        ).and_raise(StandardError.new("Metrics error"))
      end

      it "logs the error" do
        expect(Rails.logger).to receive(:error).with(
          /Failed to record HTTP metrics: StandardError - Metrics error/,
        )

        middleware.call(env)
      end

      it "returns nil and continues" do
        allow(Rails.logger).to receive(:error)

        expect { middleware.call(env) }.not_to raise_error
      end
    end
  end
end
