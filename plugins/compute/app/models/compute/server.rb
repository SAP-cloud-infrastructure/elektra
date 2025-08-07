# frozen_string_literal: true

require "base64"

module Compute
  # Represents the Openstack Server
  class Server < Core::ServiceLayer::Model
    validates :name, presence: { message: "Please provide a name" }
    validates :image_id,
              presence: {
                message: "Please select an image",
              },
              if: :new?
    validates :flavor_id,
              presence: {
                message: "Please select a flavor",
              },
              if: :new?
    validates :custom_root_disk_size,
              if: :custom_root_disk?,
              numericality: {
                only_integer: true,
              }
    validate :validate_network, if: :new?
    validates :keypair_id,
              presence: {
                message:
                  "Please choose a keypair for us to provision to the server.
      Otherwise you will not be able to log in.",
              },
              if: :new?

    validates_format_of :name, without: /\A.*\.\d+\Z/

    NO_STATE = 0
    RUNNING = 1
    BLOCKED = 2
    PAUSED = 3
    SHUT_DOWN = 4
    SHUT_OFF = 5
    CRASHED = 6
    SUSPENDED = 7
    FAILED = 8
    BUILDING = 9

    def power_state_string
      case power_state
      when RUNNING
        "Running"
      when BLOCKED
        "Blocked"
      when PAUSED
        "Paused"
      when SHUT_DOWN
        "Shut down"
      when SHUT_OFF
        "Shut off"
      when CRASHED
        "Crashed"
      when SUSPENDED
        "Suspended"
      when FAILED
        "Failed"
      when BUILDING
        "Building"
      else
        "No State"
      end
    end

    def attributes_for_create
      params =
        {
          "name" => read("name"),
          "imageRef" => read("image_id"),
          "flavorRef" => read("flavor_id"),
          "max_count" => read("max_count"),
          "min_count" => read("min_count"),
          # Optional
          "availability_zone" => read("availability_zone_id"),
          "key_name" => read("keypair_id"),
          "metadata" => read("metadata"),
          "user_data" => Base64.encode64(read("user_data")),
          "block_device_mapping_v2" => read("block_device_mapping_v2"),
        }.delete_if { |_k, v| v.blank? }

      params.delete("imageRef") if params["block_device_mapping_v2"]

      security_group_names = read("security_groups")
      if security_group_names && security_group_names.is_a?(Array)
        params["security_groups"] = security_group_names.collect do |sg|
          { "name" => sg }
        end
      end

      networks = read("network_ids")
      if networks && networks.is_a?(Array)
        params["networks"] = {}
        params["networks"] = networks.collect do |n|
          network = {}
          network["uuid"] = n["id"] if n["port"].blank?
          network["fixed_ip"] = n["fixed_ip"] if n["port"].blank?
          network["port"] = n["port"]
          network["tag"] = n["tag"]
          network.delete_if { |_k, v| v.blank? }
          network
        end
      end
      params
    end

    # overwrite user_data method to get the raw test without html encoding
    def user_data
      attributes[:user_data]
    end 

    def custom_root_disk_size
      read("custom_root_disk_size")
    end

    def custom_root_disk?
      return true if read("custom_root_disk").to_i == 1
      return false
    end

    def attributes_for_update
      { "name" => read("name") }.delete_if { |_k, v| v.blank? }
    end

    def security_groups
      read("security_groups") || []
    end

    def security_groups_details
      @service.security_groups_details(id)
    end

    def availability_zone
      read("OS-EXT-AZ:availability_zone")
    end

    def power_state
      read("OS-EXT-STS:power_state")
    end

    def vm_state
      read("OS-EXT-STS:vm_state")
    end

    def attr_host
      read("OS-EXT-SRV-ATTR:host")
    end

    def volumes_attached
      read("os-extended-volumes:volumes_attached")
    end

    def root_disk_device_name
      read("OS-EXT-SRV-ATTR:root_device_name")
    end

    def task_state
      task_state = read("OS-EXT-STS:task_state")
      return nil if task_state.blank? || task_state.casecmp("none").zero?
      task_state
    end

    # borrowed from fog
    def ip_addresses
      addresses ? addresses.values.flatten.map { |x| x["addr"] } : []
    end

    def floating_ips
      addresses&.values.flatten.select do |ip|
        ip["OS-EXT-IPS:type"] == "floating"
      end
    end

    def floating_ips_by_network
      addresses&.each_with_object({}) do |(network_name, ips), hash|
        hash[network_name] = ips.select do |ip|
          ip["OS-EXT-IPS:type"] == "floating"
        end
      end || {}
    end

    def fixed_ips_by_network
      addresses&.each_with_object({}) do |(network_name, ips), hash|
        hash[network_name] = ips.select do |ip| 
          ip["OS-EXT-IPS:type"] == "fixed" 
        end
      end || {}
    end

    def check_ip_to_floating_ip_one_to_one_relation
      floating_ips_by_network.each do |networkname, fips|
        # for debugging
        # puts fips.length
        # puts fixed_ips_by_network[networkname].length

        # check if there is only one floating IP and one fixed IP
        if fixed_ips_by_network[networkname].length > 1 && fips.length > 1 
          return false
        elsif fixed_ips_by_network[networkname].length > 1 && fips.length == 1
          return false 
        elsif fixed_ips_by_network[networkname].length == 1 && fips.length > 1
          # that should not happen
          return false
        end 
      end
      return true
    end 

    # This methods converts addresses to a map between fixed and floating ips.
    # return:
    # [
    #   {
    #     'fixed' => { 'addr' => ADDRESS, 'network_name' => NETWORK_NAME},
    #     'floating' => { 'addr' => ADDRESS, 'network_name' => NETWORK_NAME}
    #   },
    #   ...
    # ]
    def ip_maps(project_floating_ips = [])
      return @all_ip_maps if @all_ip_maps
      return {} unless addresses

      ip_network_names = {}
      server_floating_ips = []
      server_floating_ips_and_network = {}
      server_fixed_ips = []
      server_fixed_ips_and_network = {}
      # byebug
      # extract the fips and fixed ips for the server
      addresses.each do |network_name, ips|
        ips.each do |ip|
          ip_network_names[ip["addr"]] = network_name
          if ip["OS-EXT-IPS:type"] == "floating"
            # store the floating ips, this is needed if we have multiple floating ips in one network
            server_floating_ips << ip["addr"]
            # store the floating ips and the network name
            # this is needed to check if there is only one floating IP and one fixed IP
            server_floating_ips_and_network[network_name] ||= []
            server_floating_ips_and_network[network_name] << ip["addr"]
          end

          if ip["OS-EXT-IPS:type"] == "fixed"
            # store the fixed ips, this is needed if we have multiple fixed ips in one network
            server_fixed_ips << ip["addr"]
            # store the fixed ips and the network name
            # this is needed to check if there is only one floating IP and one fixed IP
            server_fixed_ips_and_network[network_name] ||= []
            server_fixed_ips_and_network[network_name] << ip["addr"]
          end
        end
      end

      fip_ip_one_to_one_maps = []
      # if the project_floating_ips is empty, we can assume that floating IP is associated with the fixed IP one to one
      if project_floating_ips.length == 0
        # check each network if there is only one floating IP and one fixed IP
        server_floating_ips_and_network.each do |network_name, fips|
          # check if there is only one floating IP and one fixed IP
          if fips.length == 1 && server_fixed_ips_and_network[network_name].length == 1
            # if there is only one floating IP and one fixed IP, we can assume that the floating IP is associated with the fixed IP
            
            # load the floating IP object to access the floating IP ID
            floating_ip = @service.service_manager.networking.floating_ips({floating_ip_address: fips.first}).first
            # byebug
            fip_ip_one_to_one_maps << 
              {
                "fixed" => {
                  "addr" => server_fixed_ips_and_network[network_name].first,
                  "network_name" => network_name,
                },
                "floating" => {
                  "addr" => fips.first,
                  "network_name" => network_name,
                  # add floating IP ID to the map
                  "id" => floating_ip&.id,
                },
              }
          end
        end
      end

      # if there are multiple floating IPs in the network, we need to check which floating IP is associated with which fixed IP
      # iterate over an array of floating IP objects, check if each floating IP address is associated with a server, 
      # and build a hash that maps fixed IP addresses of the server to corresponding floating IP addresses.
      # project_floating_ips is an array of floating IP objects and have the information about the fixed IP address
      fixed_floating_map =
        project_floating_ips.each_with_object({}) do |fip, map|
          next unless server_floating_ips.include?(fip.floating_ip_address)
          map[fip.fixed_ip_address] = fip
        end

      ip_maps =
        addresses
          .values
          .flatten
          .each_with_object([]) do |ip, array|
            # only fixed IPs
            next if ip["OS-EXT-IPS:type"] == "floating"

            fixed_address = ip["addr"]
            # filter out fixed IPs that are already associated with a floating IP
            next if fip_ip_one_to_one_maps.any? { |m| m["fixed"]["addr"] == fixed_address }
            floating_ip = fixed_floating_map[fixed_address]
            data = {
              "fixed" => {
                "addr" => fixed_address,
                "network_name" => ip_network_names[fixed_address],
              },
            }
            if floating_ip
              data["floating"] = {
                "addr" => floating_ip.floating_ip_address,
                "id" => floating_ip.id,
                "network_name" =>
                  ip_network_names[floating_ip.floating_ip_address],
              }
            end
            array << data
          end

        # merge and sort the results
        @all_ip_maps = (ip_maps || []) + (fip_ip_one_to_one_maps || [])
        @all_ip_maps.sort_by! { |mapping| mapping.dig("fixed", "network_name") }
        return @all_ip_maps
    end

    def fixed_ips
      ip_addresses_by_type("fixed")
    end

    def floating_ip_addresses
      ip_addresses_by_type("floating")
    end

    # borrowed from fog
    def ip_addresses_by_type(type)
      ips =
        if addresses
          addresses
            .values
            .flatten
            .select { |data| data["OS-EXT-IPS:type"] == "floating" }
            .map { |addr| addr["addr"] }
        else
          []
        end
      return [] if ips.empty?
      # Return them all, leading with manually assigned addresses
      manual = ips.map { |addr| addr["ip"] }

      ips.sort do |a, b|
        a_manual = manual.include? a
        b_manual = manual.include? b

        if a_manual && !b_manual
          -1
        elsif !a_manual && b_manual
          1
        else
          0
        end
      end
      ips.empty? ? manual : ips
    end

    def image_object
      return nil unless image["id"]
      @image_object ||= @service.find_image(image["id"], true)
    rescue StandardError
      nil
    end

    def metadata
      attribute_to_object("metadata", Compute::Metadata)
    end

    def networks
      attribute_to_object("networks", Compute::Metadata)
    end

    def attached_volumes
      return [] if volumes_attached.empty?
      @service.volumes(self)
    end

    ####################### ACTIONS #####################
    def add_fixed_ip(network_id)
      requires :id
      rescue_api_errors { @service.add_fixed_ip(id, network_id) }
      return false unless errors.blank?
      true
    end

    def remove_fixed_ip(ip_address)
      requires :id
      rescue_api_errors { @service.remove_fixed_ip(id, ip_address) }
      return false unless errors.blank?
    end

    def terminate
      requires :id
      rescue_api_errors { @service.delete_server id }
      return false unless errors.blank?
    end

    def rebuild(
      image_ref,
      name,
      admin_pass = nil,
      metadata = nil,
      personality = nil
    )
      requires :id
      @service.rebuild_server(
        id,
        image_ref,
        name,
        admin_pass,
        metadata,
        personality,
      )
      true
    end

    def resize(flavor_ref)
      requires :id
      rescue_api_errors { @service.resize_server(id, flavor_ref) }
      # handle special errors
      unless errors.blank?
        if errors.full_messages.to_sentence ==
             "Api No valid host was found. No valid host found for resize"
          errors.delete(:api)
          errors.add(
            :api,
            'Instance resize not possible at this time: there is not enough free capacity for an automatic resize. please open an ITSM ticket for Service Offering "GCS-SAP Cloud Infrastructure API Services"',
          )
        end
        return false
      else
        return true
      end
    end

    def revert_resize
      requires :id
      rescue_api_errors { @service.revert_resize_server(id) }
      return false unless errors.blank?
      true
    end

    def confirm_resize
      requires :id
      rescue_api_errors { @service.confirm_resize_server(id) }
      return false unless errors.blank?
      true
    end

    def reboot(type = "SOFT")
      requires :id
      rescue_api_errors { @service.reboot_server(id, type) }
      return false unless errors.blank?
      true
    end

    def stop
      requires :id
      rescue_api_errors { @service.stop_server(id) }
    end

    def pause
      requires :id
      rescue_api_errors { @service.pause_server(id) }
    end

    def suspend
      requires :id
      rescue_api_errors { @service.suspend_server(id) }
    end

    def start
      requires :id
      rescue_api_errors do
        case status.downcase
        when "paused"
          @service.unpause_server(id)
        when "suspended"
          @service.resume_server(id)
        else
          @service.start_server(id)
        end
      end
    end

    def locked?
      metadata.locked == true || metadata.locked == "true" || locked == true || locked == "true"
    end

    def lock
      # Since the locked attribute is available in version 2.9 and we use 2.1
      # we need to simulate this attribute. For that we use the server
      # metadata
      requires :id
      tries = 1
      begin
        # try to update locked attribute in server metadata.
        # It can fail with 409 if server already locked.
        @service.update_metadata_key(id, "locked", "true")
        @service.lock_server(id)
      rescue Elektron::Errors::ApiResponse => e
        if e.code == 409 && !locked? && tries > 0
          tries -= 1
          # unlock server and try again to lock
          @service.unlock_server(id) && retry
        end
      ensure
        self.attributes = @service.find_server(id).attributes
        true
      end
    end

    def unlock
      requires :id
      begin
        @service.unlock_server(id)
        @service.update_metadata_key(id, "locked", "false")
      ensure
        self.attributes = @service.find_server(id).attributes
        true
      end
    end

    def create_image(name, metadata = {})
      requires :id
      rescue_api_errors { @service.create_image(id, name, metadata) }
      return false unless errors.blank?
      true
    end

    def reset_vm_state(vm_state)
      requires :id
      rescue_api_errors { @service.reset_server_state id, vm_state }
      return false unless errors.blank?
      true
    end

    def attach_volume(volume_id, device_name)
      requires :id
      rescue_api_errors { @service.attach_volume(volume_id, id, device_name) }
      return false unless errors.blank?
      true
    end

    def detach_volume(volume_id)
      requires :id
      rescue_api_errors { @service.detach_volume(id, volume_id) }
      return false unless errors.blank?
      true
    end

    def assign_security_group(sg_id)
      requires :id
      rescue_api_errors { @service.add_security_group(id, sg_id) }
      return false unless errors.blank?
      true
    end

    def unassign_security_group(sg_id)
      requires :id
      rescue_api_errors { @service.remove_security_group(id, sg_id) }
      return false unless errors.blank?
      true
    end

    protected

    def new?
      id.nil?
    end

    def validate_network
      ids =
        network_ids.each_with_object([]) do |n, a|
          a << n["id"] unless n["id"].blank?
        end

      if network_ids && network_ids.length.positive? && ids.length.positive?
        return
      end
      errors.add(:network_ids, "Please select a network")
    end
  end
end
