# frozen_string_literal: true

require "prometheus/middleware/collector"
require_relative "../../lib/core/plugins_manager"

# HttpMetricsMiddleware is a Rack middleware that provides an implementation of a
# elektra HTTP tracer.
class HttpMetricsCollectorMiddleware < Prometheus::Middleware::Collector
  LABELS = %i[code method host domain project controller action plugin xhr]
  EXCLUDE_PATHS = %w[/metrics /system /assets]

  def init_request_metrics
    @requests =
      @registry.counter(
        :"#{@metrics_prefix}_requests_total",
        docstring:
          "The total number of HTTP requests handled by the Rack application.",
        labels: LABELS,
      )
    @durations =
      @registry.histogram(
        :"#{@metrics_prefix}_request_duration_seconds",
        docstring: "The HTTP response duration of the Rack application.",
        labels: LABELS,
        buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
      )
  end

  # Override trace method to properly catch exceptions
  def trace(env)
    response = nil
    duration = realtime { response = yield }
    record(env, response.first.to_s, duration)
    return response
  rescue => exception
    # Track exception - using only exception label to match parent's counter definition
    @exceptions.increment(labels: { exception: exception.class.name })

    raise
  end

  def record(env, code, duration)
    path = generate_path(env)
    return if path.starts_with? *EXCLUDE_PATHS

    path_params = env["action_dispatch.request.path_parameters"] || {}
    plugin_name = (path_params[:controller] || "").split("/").first
    request = ActionDispatch::Request.new env

    custom_labels = {
      code: code,
      method: env["REQUEST_METHOD"].downcase,
      host: env["HTTP_HOST"].to_s,
      # path is not needed cause we have the domain, project and action and plugin
      domain: path_params[:domain_id] || "",
      project: path_params[:project_id] || "",
      controller: path_params[:controller] || "",
      action: path_params[:action] || "",
      plugin: Core::PluginsManager.has?(plugin_name) ? plugin_name : "",
      xhr: request.xhr?,
    }

    @requests.increment(labels: custom_labels)
    @durations.observe(duration, labels: custom_labels)
  rescue => e
    Rails.logger.error("Failed to record HTTP metrics: #{e.class} - #{e.message}")
    Rails.logger.error(e.backtrace.first(5).join("\n")) if Rails.env.development?
    nil
  end
end
