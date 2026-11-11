require "compute_njq/version"
require "compute_njq/engine"

module ComputeNjq
  # Compute plugin, no-jQuery edition: a self-contained React/BFF rewrite of the
  # legacy `compute` plugin. It talks directly to the OpenStack APIs (Nova,
  # Neutron, Glance, Cinder) and never reaches into other plugins' service
  # layers — cross-service joins happen only in this plugin's BFF.

  # Raised when the BFF receives a malformed or invalid client request.
  class RequestError < StandardError; end
end
