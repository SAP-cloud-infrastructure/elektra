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
          docstring: "A histogram if sli",
          labels: %i[path method],
        )
  end

  def call(env)
    path_info = env["PATH_INFO"]
    
    # ignore /metrics, /assets, and /system/* paths
    unless ["/metrics", "/assets"].include?(path_info) || 
            path_info.start_with?("/assets/", "/system/")
      
      # Extract domain (first path segment)
      domain = extract_domain(path_info)
      
      response = nil
      duration = Benchmark.realtime { response = @app.call(env) }
      @histogram.observe(
        duration,
        labels: {
          path: domain,
          method: env["REQUEST_METHOD"].downcase,
        },
      )
      return response
    end
    
    @app.call(env)
  end
end
