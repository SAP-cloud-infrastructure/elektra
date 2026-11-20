# frozen_string_literal: true

require "spec_helper"

# Routing is asserted against the engine's own routes (as maia_proxy_routing_spec
# does), so paths are relative to the engine mount — the dashboard scope segments
# (domain_id/project_id) are added by the host mount, not the engine.
describe "compute_njq floating ip routes", type: :routing do
  routes { ComputeNjq::Engine.routes }

  it "routes attach_floating_ip to the instances controller" do
    expect(post: "/api/instances/s1/attach_floating_ip").to route_to(
      controller: "compute_njq/api/instances", action: "attach_floating_ip", id: "s1"
    )
  end

  it "routes detach_floating_ip to the instances controller" do
    expect(post: "/api/instances/s1/detach_floating_ip").to route_to(
      controller: "compute_njq/api/instances", action: "detach_floating_ip", id: "s1"
    )
  end

  it "routes floating_ip_options to the form_options controller" do
    expect(get: "/api/form_options/floating_ip_options").to route_to(
      controller: "compute_njq/api/form_options", action: "floating_ip_options"
    )
  end
end
