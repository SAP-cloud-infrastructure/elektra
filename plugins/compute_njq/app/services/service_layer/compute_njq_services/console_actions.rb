# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Open an instance's Nova remote console. The console type depends on the
    # hypervisor: KVM/QEMU uses VNC (novnc), Cloud Hypervisor and Ironic use a
    # serial console, VMware uses MKS (webmks). The type is keyed off the raw
    # Nova hypervisor string from the flavor's extra_specs (not the normalised
    # family) because QEMU and CH both normalise to "kvm" yet need different
    # consoles. The returned URL carries a short-lived token, so callers fetch
    # it fresh on every open.
    module ConsoleActions
      CONSOLE_BY_HYPERVISOR = {
        "QEMU" => %w[vnc novnc],
        "CH" => %w[serial serial],
        "VMware vCenter Server" => %w[mks webmks],
        "ironic" => %w[serial shellinabox],
      }.freeze
      DEFAULT_CONSOLE = %w[mks webmks].freeze

      def instance_console(server_id)
        server = nova_server(server_id)
        raw_hv = server.dig("flavor", "extra_specs", "capabilities:hypervisor_type")
        protocol, type = CONSOLE_BY_HYPERVISOR.fetch(raw_hv, DEFAULT_CONSOLE)
        console = nova_remote_console(server_id, protocol: protocol, type: type)
        { url: console["url"], type: console["type"], protocol: console["protocol"] }
      end
    end
  end
end
