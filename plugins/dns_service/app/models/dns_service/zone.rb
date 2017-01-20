module DnsService
  class Zone < Core::ServiceLayer::Model
    def attributes_for_create
      zone_attributes = attributes
      zone_attributes[:ttl] = zone_attributes[:ttl].to_i if zone_attributes[:ttl]
      zone_attributes[:name] = zone_attributes[:name].strip if zone_attributes[:name]
      zone_attributes[:email] = zone_attributes[:email].strip if zone_attributes[:email]
      zone_attributes.delete(:id)
      zone_attributes.delete_if { |k, v| v.blank? }
    end

    def attributes_for_update
      zone_attributes = attributes
      zone_attributes[:ttl] = zone_attributes[:ttl].to_i if zone_attributes[:ttl]
      zone_attributes[:email] = zone_attributes[:email].strip if zone_attributes[:email]
      zone_attributes[:project_id] = zone_attributes[:project_id].strip if zone_attributes[:project_id]
      zone_attributes.delete(:name)
      zone_attributes.delete_if { |k, v| v.blank? }
    end

    # msp to driver create method
    def perform_driver_create(create_attributes)
      # TODO: remove this line
      create_attributes[:attributes] = (create_attributes[:attributes].nil? ? {internal: 'true'} : create_attributes[:attributes])

      name  = create_attributes.delete("name")
      email = create_attributes.delete("email")
      @driver.create_zone(name, email, create_attributes)
    end
  end
end
