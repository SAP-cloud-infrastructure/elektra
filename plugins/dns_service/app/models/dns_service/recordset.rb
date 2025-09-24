# frozen_string_literal: true

module DnsService
  # represents the openstack dns recordset
  class Recordset < Core::ServiceLayer::Model
    validate :end_with_dot

    TYPE_LABELS = {
      "A - Address record" => "a",
      "AAAA - IPv6 address record" => "aaaa",
      "CAA - Certification Authority Authorization record" => "caa",
      "CERT - Certificate record" => "cert",
      "CNAME - Canonical name record" => "cname",
      "HTTPS - Hypertext Transfer Protocol Secure record" => "https",
      "MX - Mail exchange record" => "mx",
      "NS - Nameserver record" => "ns",
      "PTR - Pointer record" => "ptr",
      "SPF - Sender Policy Framework record" => "spf",
      "SRV - Service locator record" => "srv",
      "SVCB  - Service Binding record" => "svcb",
      "TXT - Text record" => "txt",
    }.freeze

    CONTENT_LABELS = {
      a: {
        label: "IPv4 Address",
        type: "string",
      },
      aaaa: {
        label: "IPv6 Address",
        type: "string",
      },
      caa: {
        label: "Certification Authority Authorization",
        type: "string",
      },
      cert: {
        label: "Certificate",
        type: "string",
      },
      cname: {
        label: "Canonical Name",
        type: "string",
      },
      mx: {
        label: "Mail Server",
        type: "string",
      },
      ns: {
        label: "Record Data",
        type: "string",
      },
      ptr: {
        label: "PTR Domain Name",
        type: "string",
      },
      spf: {
        label: "Text",
        type: "text",
      },
      srv: {
        label: "Record Data",
        type: "string",
      },
      txt: {
        label: "Text",
        type: "text",
      },
      svcb: {
        label: "Record Data",
        type: "string",
      },
      https: {
        label: "Record Data",
        type: "string",
      }
    }.freeze

    validates :type, presence: { message: "Please select a type" }
    validates :records, presence: { message: "Please provide a content" }

    def attributes_for_create
      {
        "type" => (read("type").nil? ? nil : read("type").upcase),
        "name" =>
          (
            if read("name").present?
              "#{read("name")}.#{read("zone_name")}"
            else
              read("zone_name")
            end
          ),
        "records" =>
          (read("records").is_a?(Array) ? read("records") : [read("records")]),
        "ttl" => (read("ttl").present? ? read("ttl").to_i : nil),
        "description" => read("description"),
        #'zone_id'     => read('zone_id')
      }.delete_if { |_k, v| v.blank? }
    end

    def attributes_for_update
      {
        "records" =>
          (read("records").is_a?(Array) ? read("records") : [read("records")]),
        "ttl" => (read("ttl").present? ? read("ttl").to_i : nil),
        "description" => read("description"),
        "project_id" => read("project_id"),
      }.delete_if { |_k, v| v.blank? }
    end

    # cname: foo.bla.sap.
    # mx:    10 smtpdem02.bla.sap.
    # ptr:   1.0.0.10.in-addr.arpa.
    # srv:   _service._proto.name. TTL class SRV priority weight port target.
    def end_with_dot
      if type == "cname" or type == "mx" or type == "ptr" or type == "srv" or
           type == "ns"
        records.each do |value|
          unless value.end_with?(".")
            errors.add(
              "records",
              "#{CONTENT_LABELS[type.to_sym][:label]} should end with a dot.",
            )
          end
        end
      end
    end

    def perform_service_create(create_attributes)
      service.create_recordset(zone_id, create_attributes)
    end

    def perform_service_update(id, update_attributes)
      service.update_recordset(zone_id, id, update_attributes)
    end

    def perform_service_delete(id)
      service.delete_recordset(zone_id, id)
    end
  end
end
