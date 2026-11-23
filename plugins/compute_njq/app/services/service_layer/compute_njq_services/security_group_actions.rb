# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Set the security groups on a Nova server by writing the full desired set
    # to each of its Neutron ports. SG membership lives on the port in this
    # plugin (attach_interface sets it there too), and the detail Security
    # Groups tab shows the aggregated server-wide set — so editing writes one
    # desired set to every port rather than diffing per port.
    module SecurityGroupActions
      def set_instance_security_groups(server_id, security_groups:)
        groups = Array(security_groups).map(&:to_s).reject(&:empty?).uniq
        raise ComputeNjq::RequestError, "at least one security group is required" if groups.empty?

        ports = neutron_ports_for_device(server_id)
        raise ComputeNjq::RequestError, "no ports found for instance" if ports.empty?

        ports.each { |port| neutron_update_port(port["id"], security_groups: groups) }
        { ok: true }
      end
    end
  end
end
