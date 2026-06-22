# frozen_string_literal: true
require "benchmark"

# This middleware collects the Service Level Indicator metrics
class SLIMetricsMiddleware
  def initialize(app, options = {})
    @app = app
    @registry = options[:registry] || Prometheus::Client.registry
    @path = options[:path] || "/metrics"
    @histogram =
      @registry.get(:elektra_sli) ||
        @registry.histogram(
          :elektra_sli,
          docstring: "Request duration for Elektra plugins in seconds.",
          labels: %i[plugin method],
          buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
        )
  end

  def call(env)
    path_info = env["PATH_INFO"]
    
    # ignore /metrics, /assets, and /system/* paths
    if should_skip_path?(path_info)
      return @app.call(env)
    end
    # Extract plugin name from first path segment
    domain = extract_plugin(path_info)
    
    response = nil
    duration = Benchmark.realtime { response = @app.call(env) }
    
    @histogram.observe(
      duration,
      labels: {
        plugin: domain,
        method: env["REQUEST_METHOD"].downcase,
      },
    )
    
    response
  end

  private

  def should_skip_path?(path_info)
    path_info == "/metrics" || 
      path_info.start_with?("/assets/", "/system/")
  end

  def extract_plugin(path_info)
    # Extract first path segment as plugin name, e.g., "/compute/v2/..." -> "compute"
    segments = path_info.split("/").reject(&:empty?)
    segments.first || "root"
  end
end
