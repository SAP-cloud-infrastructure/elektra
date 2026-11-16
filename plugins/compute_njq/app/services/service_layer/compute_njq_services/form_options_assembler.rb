# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Maps raw Nova/Neutron/Glance hashes into the lean, structured option shapes
    # the create form consumes. No label/markup generation — the UI decides
    # presentation. This replaces the legacy grouped_* helpers' string-label logic
    # with explicit fields (hypervisor_type etc.) the React layer filters on.
    module FormOptionsAssembler
      # Nova reports hypervisor via extra_specs; normalise to a small vocabulary.
      HYPERVISOR_MAP = {
        "QEMU" => "kvm",
        "CH" => "kvm",
        "VMware vCenter Server" => "vmware",
        "ironic" => "baremetal",
      }.freeze

      def form_flavors
        nova_flavors.map do |f|
          raw_hv = f.dig("extra_specs", "capabilities:hypervisor_type")
          raw_public = f.fetch("os-flavor-access:is_public", f["is_public"])
          {
            id: f["id"],
            name: f["name"],
            vcpus: f["vcpus"],
            ram: f["ram"],
            disk: f["disk"],
            hypervisor_type: HYPERVISOR_MAP[raw_hv],
            is_public: raw_public == true || raw_public == "1",
          }
        end
      end

      def form_keypairs
        nova_keypairs.map { |k| { name: k["name"] } }
      end

      def form_availability_zones
        nova_availability_zones
          .select { |az| az.dig("zoneState", "available") }
          .map { |az| { name: az["zoneName"] } }
      end

      def form_networks
        neutron_networks.map { |n| { id: n["id"], name: n["name"] } }
      end

      def form_security_groups
        neutron_security_groups.map { |sg| { id: sg["id"], name: sg["name"] } }
      end

      # q → Glance name filter; marker/limit → pagination. next_marker is the last
      # image id when a full page was returned, else nil (end of list).
      def form_images(q: nil, marker: nil, limit: 50)
        filter = { "limit" => limit }
        filter["name"] = q if q.present?
        filter["marker"] = marker if marker.present?

        raw = glance_images(filter)
        images = raw.map do |i|
          {
            id: i["id"],
            name: i["name"],
            visibility: i["visibility"],
            hypervisor_type: i["hypervisor_type"],
            min_disk: i["min_disk"],
            size: i["size"],
          }
        end

        { images: images, next_marker: raw.length == limit ? raw.last["id"] : nil }
      end
    end
  end
end
