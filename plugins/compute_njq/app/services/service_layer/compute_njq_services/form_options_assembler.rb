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

      # Loads the full image catalog for the create dialog, per visibility.
      #
      # This mirrors the legacy compute controller exactly (SAP-specific, not
      # vanilla OpenStack, and intentionally so): private, shared and public are
      # each loaded and fully paged, then merged and de-duplicated by id. Loading
      # per visibility — rather than one unfiltered call — is required because in
      # some environments not all images are visible when no visibility filter is
      # given. The UI filters/groups this list by the selected flavor's hypervisor.
      def form_images
        raw =
          %w[private shared public]
            .flat_map { |visibility| glance_all_images("visibility" => visibility) }
            .uniq { |i| i["id"] }
            # Legacy drops nameless images entirely (instances_helper.rb:98) and
            # never falls back to the id; we additionally treat whitespace-only
            # names as blank.
            .reject { |i| i["name"].nil? || i["name"].to_s.strip.empty? }

        images = raw.map do |i|
          {
            id: i["id"],
            name: i["name"],
            visibility: i["visibility"],
            # Two hypervisor fields coexist: hypervisor_type is the legacy
            # property, img_hv_type the newer one. The UI's image<->flavor
            # coupling decides which to honour, so we pass both through raw.
            hypervisor_type: i["hypervisor_type"],
            img_hv_type: i["img_hv_type"],
            # image_type == "snapshot" promotes an image into the snapshot group.
            image_type: i["image_type"],
            disk_format: i["disk_format"],
            buildnumber: i["buildnumber"],
            min_disk: i["min_disk"],
            size: i["size"],
          }
        end

        { images: images }
      end
    end
  end
end
