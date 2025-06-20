module ServiceLayer
  module DnsServiceServices
    module Ptr

      def floatingip_map
        @floatingip_map ||= class_map_proc(Networking::FloatingIp)
      end

      def list_floating_ips_ptr_records
        elektron_dns.get("reverse/floatingips").map_to(
          "body.floatingips",
          &floatingip_map
        )
      end
    end
  end
end