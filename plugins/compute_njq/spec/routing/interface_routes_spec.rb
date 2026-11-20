# frozen_string_literal: true
require "spec_helper"

RSpec.describe "interface routes", type: :routing do
  routes { ComputeNjq::Engine.routes }

  it "routes attach_interface" do
    expect(post: "/api/instances/s1/attach_interface").to route_to(
      controller: "compute_njq/api/instances", action: "attach_interface", id: "s1",
    )
  end

  it "routes detach_interface" do
    expect(post: "/api/instances/s1/detach_interface").to route_to(
      controller: "compute_njq/api/instances", action: "detach_interface", id: "s1",
    )
  end

  it "routes attached_interfaces" do
    expect(get: "/api/instances/s1/attached_interfaces").to route_to(
      controller: "compute_njq/api/instances", action: "attached_interfaces", id: "s1",
    )
  end

  it "routes interface_options" do
    expect(get: "/api/form_options/interface_options").to route_to(
      controller: "compute_njq/api/form_options", action: "interface_options",
    )
  end
end
