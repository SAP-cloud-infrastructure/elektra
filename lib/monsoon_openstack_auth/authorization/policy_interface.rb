module MonsoonOpenstackAuth
  module Authorization
    class PolicyInterface
      def role_names; raise "Not implemented yet"; end
      def project_domain_id; raise "Not implemented yet"; end
      def domain_id; raise "Not implemented yet"; end
      def domain_name; raise "Not implemented yet"; end
      def admin?; raise "Not implemented yet"; end
      def project_id; raise "Not implemented yet"; end
      def id; raise "Not implemented yet"; end
    end
  end
end