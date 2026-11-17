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

      # Available AZs, sorted by name descending (mirrors the legacy
      # sort_by!(&:zoneName).reverse!). No preferred-AZ heuristic and no
      # preselection — the UI leaves the choice to the user ("Any AZ").
      def form_availability_zones
        nova_availability_zones
          .select { |az| az.dig("zoneState", "available") }
          .map { |az| { name: az["zoneName"] } }
          .sort_by { |az| az[:name] }
          .reverse
      end

      def form_networks
        neutron_networks.map { |n| { id: n["id"], name: n["name"] } }
      end

      # Subnets for the advanced network options, shaped for the UI. The whole
      # list is returned; the form filters it client-side by network_id. cidr is
      # shown in the label so the user can pick the right subnet.
      def form_subnets
        neutron_subnets.map do |s|
          { id: s["id"], name: s["name"], cidr: s["cidr"], network_id: s["network_id"] }
        end
      end

      # Root-disk volume types offered when booting a disk-less KVM flavor from a
      # new volume. Mirrors the legacy render_available_volume_types(..., "premium")
      # helper: only types whose name starts with "premium" (the bootable root
      # volume tier), in Cinder's returned order. The UI submits the type id.
      VOLUME_TYPE_PREFIX = "premium"
      def form_volume_types
        cinder_volume_types
          .select { |vt| vt["name"].to_s.start_with?(VOLUME_TYPE_PREFIX) }
          .map { |vt| { id: vt["id"], name: vt["name"] } }
      end

      # Security groups carry their owning project so the UI can group them (the
      # list includes shared SGs from other projects — no tenant filter). The
      # project id is resolved to a "<domain>/<project>" label via Elektra's
      # ObjectCache (same source the legacy compute form used); when a project is
      # not cached, the raw id is used as the label so grouping still works.
      def form_security_groups
        groups = neutron_security_groups
        labels = project_labels(groups.map { |sg| sg["project_id"] || sg["tenant_id"] })
        groups.map do |sg|
          project_id = sg["project_id"] || sg["tenant_id"]
          { id: sg["id"], name: sg["name"], project_id: project_id, project_label: labels[project_id] || project_id }
        end
      end

      # Batch-resolves a list of project ids to "<domain>/<project>" (or just
      # "<project>") labels via the ObjectCache. Returns a { project_id => label }
      # map; ids missing from the cache are simply absent (callers fall back to
      # the raw id). Used for both security-group grouping and private-image
      # owner labels.
      def project_labels(project_ids)
        ids = Array(project_ids).compact.uniq
        return {} if ids.empty?

        ObjectCache
          .where(id: ids)
          .includes(:domain)
          .each_with_object({}) do |project, map|
            label = project.name
            label = "#{project.domain.name}/#{label}" if project.domain
            map[project.id] = label
          end
      rescue StandardError
        # The labels are a nicety; never let a cache lookup failure break the
        # form. Fall back to raw ids (handled by the caller).
        {}
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

        # Resolve owner project labels for private images only (the UI shows the
        # ". Project: <name>" suffix for private images, mirroring the legacy
        # image_label_for_select). Public/shared images don't carry the suffix.
        private_owner_ids = raw.select { |i| i["visibility"] == "private" }.map { |i| i["owner"] }
        owner_labels = project_labels(private_owner_ids)

        images = raw.map do |i|
          owner = i["owner"]
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
            # Secondary sort key (name, then created) within a visibility group.
            created: i["created_at"],
            # Owner project; only private images get a resolved label suffix.
            owner: owner,
            owner_label: (i["visibility"] == "private" ? owner_labels[owner] : nil),
          }
        end

        # Bootable volumes can also serve as a boot source; they ride along in the
        # same payload so the UI can offer them as a dedicated group in the image
        # picker (and the create path resolves an id to a volume vs an image).
        { images: images, volumes: form_bootable_volumes }
      end

      # Bootable volumes shaped for the image picker. The UI groups these under a
      # "Bootable Volumes" heading and couples them to the selected flavor's
      # hypervisor via the volume's image metadata (hypervisor_type/img_hv_type),
      # exactly like the legacy grouped_images volume items.
      def form_bootable_volumes
        cinder_bootable_volumes.map do |v|
          meta = v["volume_image_metadata"] || {}
          {
            id: v["id"],
            name: v["name"].presence || v["id"],
            size: v["size"],
            availability_zone: v["availability_zone"],
            disk_format: meta["disk_format"],
            hypervisor_type: meta["hypervisor_type"],
            img_hv_type: meta["img_hv_type"],
          }
        end
      end
    end
  end
end
