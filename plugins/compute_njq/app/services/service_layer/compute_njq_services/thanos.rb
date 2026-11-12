# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Thanos (vROps metrics) access. The legacy Show view fetched these three
    # PromQL queries directly from the browser; here they are proxied through
    # the BFF so the React layer only ever consumes plain, UI-ready JSON (the
    # "no raw HTML / no jQuery DOM-poking" Kernregel), and so the queries and
    # their region interpolation stay server-side.
    module Thanos
      THANOS_HOST = "thanos-internal-scaleout.%<region>s.cloud.sap"

      # vCPU sizing recommendation for the instance. Returns the recommended
      # vCPU count (a string, as Thanos reports it) or nil when there is no
      # recommendation (i.e. the current sizing is OK).
      def thanos_cpu_recommendation(instance_id)
        query = <<~PROMQL.gsub(/\s+/, " ").strip
          sum by (instance_uuid) (vrops_virtualmachine_number_vcpus_total{instance_uuid="#{instance_id}"}
          - vrops_virtualmachine_oversized_vcpus and vrops_virtualmachine_oversized_vcpus != 0
          and on (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes < 256000000))
          or (vrops_virtualmachine_number_vcpus_total{instance_uuid="#{instance_id}"}
          + vrops_virtualmachine_undersized_vcpus and vrops_virtualmachine_undersized_vcpus != 0
          and on (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes < 256000000))
        PROMQL

        thanos_scalar(query)
      end

      # Memory sizing recommendation (in GB, rounded to 2 decimals) or nil when
      # the current sizing is OK.
      def thanos_memory_recommendation(instance_id)
        query = <<~PROMQL.gsub(/\s+/, " ").strip
          ((sum by (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes{instance_uuid="#{instance_id}"})
          - sum by (instance_uuid) (vrops_virtualmachine_oversized_memory))/1024/1024
          and sum by (instance_uuid) (vrops_virtualmachine_oversized_memory != 0)
          and on (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes < 256000000))
          or ((sum by (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes{instance_uuid="#{instance_id}"})
          + sum by (instance_uuid) (vrops_virtualmachine_undersized_memory))/1024/1024
          and sum by (instance_uuid) (vrops_virtualmachine_undersized_memory != 0)
          and on (instance_uuid) (vrops_virtualmachine_config_hardware_memory_kilobytes < 256000000))
        PROMQL

        value = thanos_scalar(query)
        return nil if value.nil?

        (value.to_f * 100).round / 100.0
      end

      # VMware guest-tools status: { installed:, target:, state: }. state is one
      # of "not_found" / "outdated" / "up_to_date". Returns nil when no powered-on
      # guest-tools metric exists for the instance (legacy "not found").
      def thanos_guest_tools(instance_id)
        target =
          thanos_metric_field(
            "group by (guest_tools_target_version) (vrops_virtualmachine_guest_tools_target_version_info)",
            "guest_tools_target_version",
          )

        installed =
          thanos_metric_field(
            <<~PROMQL.gsub(/\s+/, " ").strip,
              group by (instance_uuid, project, guest_tools_version)
              (vrops_virtualmachine_guest_tools_version{instance_uuid="#{instance_id}"})
              AND on (instance_uuid) (vrops_virtualmachine_runtime_powerstate{state="Powered On"})
            PROMQL
            "guest_tools_version",
          )

        return nil if installed.nil? || installed.to_s == "0"

        state =
          if target && semver_greater?(target, installed)
            "outdated"
          else
            "up_to_date"
          end

        { installed: installed, target: target, state: state }
      end

      private

      # Runs a PromQL instant query and returns the scalar value of the first
      # result (result[0].value[1]), or nil when there is no result.
      def thanos_scalar(query)
        results = thanos_query(query)
        return nil if results.empty?

        results.dig(0, "value", 1)
      end

      # Runs a PromQL instant query and returns a metric label of the first
      # result (result[0].metric[field]), or nil when there is no result.
      def thanos_metric_field(query, field)
        results = thanos_query(query)
        return nil if results.empty?

        results.dig(0, "metric", field)
      end

      def thanos_query(query)
        uri = URI("https://#{format(THANOS_HOST, region: scoped_region)}/api/v1/query")
        uri.query = URI.encode_www_form(query: query)

        response = Net::HTTP.get_response(uri)
        raise Net::HTTPError.new(response.message, response) unless response.is_a?(Net::HTTPSuccess)

        body = JSON.parse(response.body)
        body.dig("data", "result") || []
      end

      # Numeric, dot-segment comparison matching the legacy
      # localeCompare(numeric) check: true when target > installed.
      def semver_greater?(target, installed)
        a = target.to_s.split(".").map(&:to_i)
        b = installed.to_s.split(".").map(&:to_i)
        ([a.size, b.size].max).times do |i|
          av = a[i] || 0
          bv = b[i] || 0
          return true if av > bv
          return false if av < bv
        end
        false
      end
    end
  end
end
