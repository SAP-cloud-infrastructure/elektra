# frozen_string_literal: true

module Compute
  # Implements Server actions
  class InstancesController < Compute::ApplicationController
    before_action :all_projects
    before_action :automation_data, only: %i[new create]

    authorization_context "compute"
    authorization_required except: %i[
                            new_floatingip
                            attach_floatingip
                            detach_floatingip
                            remove_floatingip
                            attach_interface
                            create_interface
                            remove_interface
                            detach_interface
                            detach_floatingip
                            new_snapshot
                            update_item
                            new_size
                            automation_script
                            new_status
                          ]

    def index
      per_page = params[:per_page] || 20
      @instances = []

      filter = {}
      @search = nil
      @searchfor = nil

      if params.include?(:search)
        if not params[:search].blank?
          @search = params[:search]
          @searchfor = "#{params[:searchfor]}"
          filter = { @searchfor.downcase() => @search }
        else
          params.delete(:search)
          params.delete(:searchfor)
        end
      end

      # search with filter or for all
      if (@searchfor and @searchfor.downcase() != "id") or filter.empty?
        if @scoped_project_id
          # reverse: true changes the order direction
          @instances =
            paginatable(
              per_page: per_page.to_i,
              reverse: true,
            ) do |pagination_options|
              services.compute.servers(
                @admin_option.merge(pagination_options).merge(filter),
              )
            end
          @instances = [] if @instances.nil?
        end
        # search with ID
      elsif not @search.blank?
        @instances = []
        instance = services.compute.find_server(@search)
        @instances << instance if instance
      end

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if request.xhr?
        render partial: "list", locals: { instances: @instances }
      else
        # comon case, render index page with layout
        render action: :index
      end
    end

    def console
      @instance = services.compute.find_server(params[:id])
      hypervisor = @instance.attributes["OS-EXT-SRV-ATTR:host"] || ""
      begin
        if hypervisor.to_s.include?("nova-compute-ironic")
          @console = services.compute.remote_console(params[:id], "serial", "shellinabox")
        else
          @console = services.compute.remote_console(params[:id])
        end
      rescue StandardError => e
        @console_error = "Failed to get remote console: #{e.message}"
        @console = nil
      end
      respond_to do |format|
        format.html { render action: :console, layout: "compute/console" }
        format.json { render json: { url: @console.url } }
      end
    end

    def pre_hard_reset
      @instance = services.compute.find_server(params[:id])
      @form =
        Compute::Forms::ConfirmHardReset.new(
          params.require(:forms_confirm_hard_reset),
        )
      unless @form.validate
        render action: "confirm_hard_reset"
        return
      end
    end

    def confirm_hard_reset
      @instance = services.compute.find_server(params[:id])
      @form = Compute::Forms::ConfirmHardReset.new()
    end

    def show
      @instance = services.compute.find_server(params[:id])
      @current_region = ENV["MONSOON_DASHBOARD_REGION"]
      return if @instance.blank?
      load_security_groups(@instance)
    end

    def console_log
      @log =
        begin
          services.compute.console_log(params[:id])
        rescue StandardError
          nil
        end
    end

    def tags
    end

    def new
      @available_volume_types = services.block_storage.volume_types
      @instance               = services.compute.new_server
      @flavors                = services.compute.flavors
      @images                 = services.image.all_images
      @fixed_ip_ports         = services.networking.fixed_ip_ports
      @subnets                = services.networking.subnets
      @bootable_volumes =
        services
          .block_storage
          .volumes_detail(bootable: true)
          .select { |v| %w[available downloading].include?(v.status) }

      if params[:image_id]
        # preselect image_id
        image = @images.find { |i| i.id == params[:image_id] }
        @instance.image_id = image.id if image
      end

      azs = services.compute.availability_zones
      if azs
        @availability_zones = azs.select { |az| az.zoneState["available"] }
        @availability_zones.sort_by!(&:zoneName).reverse!
      else
        @instance.errors.add :availability_zone, "not available"
      end

      # prefered_availability_zone
      index =
        @availability_zones.index do |az|
          az.zoneName == prefered_availability_zone
        end
      az = @availability_zones.delete_at(index) if index
      @availability_zones.unshift(az) if az

      # @security_groups = services.networking.security_groups(tenant_id: @scoped_project_id)
      # to get shared security groups the tenant_id filter should be ignored
      @security_groups = services.networking.security_groups

      @private_networks =
        services.networking.project_networks(
          @scoped_project_id,
          "router:external" => false,
        ) if services.networking.available?

      @keypairs =
        services.compute.keypairs.collect do |kp|
          Hashie::Mash.new({ id: kp.name, name: kp.name })
        end

      if @private_networks.blank?
        @instance.errors.add :private_network, "not available"
      end
      @instance.errors.add :image, "not available" if @images.blank?

      # @instance.flavor_id             = @flavors.first.try(:id)
      # @instance.image_id              = params[:image_id] || @images.first.try(:id)
      @instance.availability_zone_id = @availability_zones.first.try(:id)
      #@instance.network_ids            = [{ id: @private_networks.first.try(:id) }]
      @instance.security_groups = [
        @security_groups.find { |sg| sg.name == "default" }.try(:id),
      ] if @instance.security_groups.blank? # if no security group has been selected force select the default group
      @instance.keypair_id = @keypairs.first["name"] unless @keypairs.blank?

      @instance.max_count = 1
    end

    # update instance table row and details view (ajax call)
    def update_item
      @action_from_show = params[:action_from_show] == "true" || false
      @instance =
        begin
          services.compute.find_server(params[:id])
        rescue StandardError
          nil
        end
      @target_state = params[:target_state]

      load_security_groups(@instance) if @action_from_show

      if @instance and @instance.power_state.to_i != @target_state.to_i
        # translate target_state number to human readable string
        @instance.task_state ||= task_state(@target_state)
      end
    end

    def create
      volume_type = ""
      # TODO: check that we need the mapping here and what volume type to use! 😵‍💫
      volume_mapping = @domain_config.compute_volume_mapping
      # set image_id if baremetal_image_id or vmware_image_id or kvm_image_id is set
      if params[:server][:baremetal_image_id] != ""
        params[:server][:baremetal_image_id]
        volume_type = volume_mapping["baremetal"] || "baremetal"
      elsif params[:server][:vmware_image_id] != ""
        params[:server][:image_id] = params[:server][:vmware_image_id]
        volume_type = volume_mapping["vmware"] || "vmware"  
      elsif params[:server][:kvm_image_id] != ""
        params[:server][:image_id] = params[:server][:kvm_image_id]
        volume_type = volume_mapping["kvm"] || "kvm"
      end
      params[:server].delete(:baremetal_image_id)
      params[:server].delete(:vmware_image_id)
      params[:server].delete(:kvm_image_id)
      
      @instance = services.compute.new_server

      # remove empty security groups from params
      if params[:server] && !params[:server][:security_groups].blank?
        params[:server][:security_groups] = params[:server][
          :security_groups
        ].delete_if { |sg| sg.empty? }
      end

      # add all attributes from create dialog to instance
      @instance.attributes = params[@instance.model_name.param_key]
      @bootable_volumes =
        services
          .block_storage
          .volumes_detail(bootable: true)
          .select { |v| %w[available downloading].include?(v.status) }
      @images = services.image.all_images

      if @instance.image_id
        # check if image id is a bootable volume
        if !params[:server][:custom_root_disk] ||
             params[:server][:custom_root_disk] == "0"
          volume = @bootable_volumes.find { |v| v.id == @instance.image_id }
        end

        # Bootable Volume as image source
        if volume
          # imageRef is a bootable volume!
          @instance.block_device_mapping_v2 = [
            {
              boot_index: 0,
              uuid: volume.id,
              source_type: "volume",
              destination_type: "volume",
              volume_type: volume_type,
              delete_on_termination: false,
            },
          ]
          @instance.metadata = volume.volume_image_metadata
        else
          image = @images.find { |i| i.id == @instance.image_id }

          if image
            @instance.metadata = {
              image_name: (image.name || "").truncate(255),
              image_buildnumber: (image.buildnumber || "").truncate(255),
            }

            # use custom root disk size if selected
            if params[:server][:custom_root_disk] == "1"
              @instance.block_device_mapping_v2 = [
                {
                  boot_index: 0,
                  uuid: image.id,
                  volume_size: params[:server][:custom_root_disk_size],
                  source_type: "image",
                  destination_type: "volume",
                  delete_on_termination: true,
                },
              ]
              # this is only for model check
              @instance.custom_root_disk = 1
              @instance.custom_root_disk_size =
                params[:server][:custom_root_disk_size]
            end
          end
        end
      end

      if @instance.valid? && @instance.network_ids &&
           @instance.network_ids.length.positive?
        if @instance.network_ids.first["port"].present?
          # port is presented -> pre-resereved fixed IP is selected
          # use provided port id and update security group on port
          @port =
            services.networking.new_port(
              security_groups: @instance.security_groups,
            )
          # set id
          @port.id = @instance.network_ids.first["port"]
        elsif @instance.network_ids.first["id"].present? &&
              @instance.network_ids.first["subnet_id"].present?
          # port id isn't given but networkid and subnet id are provided.
          # -> create a port with network and subnet
          @port =
            services.networking.new_port(
              network_id: @instance.network_ids.first["id"],
              fixed_ips: [
                { subnet_id: @instance.network_ids.first["subnet_id"] },
              ],
              security_groups: @instance.security_groups,
            )
        end

        if @port
          # create or update port
          if @port.id || @port.save
            @instance.network_ids.first["port"] = @port.id
          else
            @port.errors.each { |k, v| @instance.errors.add(k, v) }
          end
        elsif @instance.security_groups.present?
          @security_groups = services.networking.security_groups
          @instance.security_groups =
            @instance
              .security_groups
              .each_with_object([]) do |sg_id, array|
                security_group = @security_groups.find { |sg| sg_id == sg.id }
                array << security_group.name if security_group
              end
        end
      end

      if @instance.errors.empty? && @instance.save
        flash.now[:notice] = "Instance successfully created."
        audit_logger.info(current_user, "has created", @instance)
        @instance = services.compute.find_server(@instance.id)
      else
        if @port && @port.id && !@port.fixed_ip_port? &&
             params[:server][:network_ids].first["port"].blank?
          @port.destroy
        end
        @available_volume_types = services.block_storage.volume_types
        @flavors                = services.compute.flavors
        @availability_zones     = services.compute.availability_zones
        @security_groups       ||= services.networking.security_groups
        @fixed_ip_ports         = services.networking.fixed_ip_ports
        @subnets                = services.networking.subnets

        @private_networks =
          services
            .networking
            .project_networks(@scoped_project_id)
            .delete_if { |n| n.attributes["router:external"] == true }
        @keypairs =
          services.compute.keypairs.collect do |kp|
            Hashie::Mash.new({ id: kp.name, name: kp.name })
          end
        render action: :new
      end
    end

    def edit
      @instance = services.compute.find_server(params[:id])
      @action_from_show = params[:action_from_show] == "true" || false
      if @instance.blank?
        flash.now[
          :error
        ] = "We couldn't retrieve the instance details. Please try again."
      end
    end

    def update
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.new_server(params[:server])
      @instance.id = params[:id]
      if @instance.save
        flash.now[:notice] = "Server successfully updated."
        if @action_from_show
          @instance = services.compute.find_server(params[:id])
          load_security_groups(@instance)
        end
        respond_to do |format|
          format.html { redirect_to instances_url }
          format.js { render "update", formats: :js }
        end
      else
        render action: :edit
      end
    end

    def new_floatingip
      @action_from_show = params[:action_from_show] == "true" || false
      enforce_permissions("::networking:floating_ip_associate")
      @instance = services.compute.find_server(params[:id])
      collect_available_ips

      @floating_ip = services.networking.new_floating_ip
    end

    # attach existing floating ip to a server interface.
    def attach_floatingip
      @action_from_show = params[:action_from_show] == "true" || false
      enforce_permissions("::networking:floating_ip_associate")

      # get instance
      @instance = services.compute.find_server(params[:id])

      # first ensure that both floating ip and fixed ip have been provided
      if params[:floating_ip][:id].blank? ||
           params[:floating_ip][:fixed_ip_address].blank?
        collect_available_ips
        @floating_ip = services.networking.new_floating_ip
        flash.now[
          :error
        ] = "Please specify both a floating IP and the interface to attach to."

        render action: :new_floatingip and return
      end

      # get project ports
      ports = services.networking.ports(device_id: params[:id])
      # find port which contains the fixed ip or take the first one.

      port =
        ports.find do |prt|
          prt
            .fixed_ips
            .collect { |ip| ip["ip_address"] }
            .include?(params[:floating_ip][:fixed_ip_address])
        end || ports.first

      # update floating ip with the new assigned interface ip
      @floating_ip =
        services.networking.find_floating_ip!(params[:floating_ip][:id])
      @floating_ip.port_id = port.id
      @floating_ip.fixed_ip_address = params[:floating_ip][:fixed_ip_address]

      if @floating_ip.save
        # add floating ip to instance to make it visible in the view
        # example: {\"version\"=>4, \"addr\"=>\"10.237.208.46\", \"OS-EXT-IPS:type\"=>\"floating\", \"OS-EXT-IPS-MAC:mac_addr\"=>\"fa:16:3e:a0:1b:e9\"}
        @instance.addresses.each do |network, addresses|
          next unless addresses.find do |addr|
            addr["OS-EXT-IPS:type"] == "fixed" && addr["addr"] == @floating_ip.fixed_ip_address
          end
          addresses << {
            "version" => 4,
            "addr" => @floating_ip.floating_ip_address,
            "OS-EXT-IPS:type" => "floating",
            "OS-EXT-IPS-MAC:mac_addr" => port.mac_address,
          }
        end

        load_security_groups(@instance) if @action_from_show
        respond_to do |format|
          format.html { redirect_to instances_url }
          format.js {}
        end
      else
        collect_available_ips
        render action: :new_floatingip
      end
    end

    def remove_floatingip
      @action_from_show = params[:action_from_show] == "true" || false
      enforce_permissions("::networking:floating_ip_disassociate")
      @instance = services.compute.find_server(params[:id])
      @floating_ip = services.networking.new_floating_ip
    end

    def detach_floatingip
      @action_from_show = params[:action_from_show] == "true" || false
      enforce_permissions("::networking:floating_ip_disassociate")

      @floating_ip =
        services.networking.find_floating_ip(
          params[:floating_ip][:floating_ip_id],
        )

      if @floating_ip && @floating_ip.detach
        @instance = services.compute.find_server(params[:id])

        # because of a delay we have to delete the floating ip from instance manually
        @instance.addresses.each do |network,addresses|
          addresses.delete_if do |addr| 
            addr["OS-EXT-IPS:type"] == "floating" && addr["addr"] == @floating_ip.floating_ip_address
          end
        end    

        load_security_groups(@instance) if @action_from_show
        respond_to do |format|
          format.html { redirect_to instances_url }
          format.js {}
        end
      else
        if @floating_ip.nil?
          @floating_ip = services.networking.new_floating_ip
          @floating_ip.errors.add(:floating_ip, "Not found.")
        end
        # create instance to show the form which needs the instance object
        @instance = services.compute.find_server(params[:id])
        render action: :remove_floatingip
      end
    end

    def attach_interface
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.find_server(params[:id])
      @os_interface = services.compute.new_os_interface(params[:id])
      @os_interface.fixed_ips = []
      @networks = services.networking.networks("router:external" => false)
      @security_groups = services.networking.security_groups

      @fixed_ip_ports =
        services.networking.fixed_ip_ports.select { |ip| ip.device_id.blank? }
      @subnets = services.networking.subnets
    end

    def create_interface
      @action_from_show = params[:action_from_show] == "true" || false
      if params[:os_interface][:security_groups].present?
        params[:os_interface][:security_groups] = params[:os_interface][
          :security_groups
        ].delete_if(&:blank?)
      end

      @os_interface =
        services.compute.new_os_interface(params[:id], params[:os_interface])
      
      if @os_interface.valid? && @os_interface.net_id.present?
        if @os_interface.port_id.present?
          @port =
            services.networking.new_port(
              security_groups: @os_interface.security_groups,
            )
          @port.id = @os_interface.port_id
        elsif @os_interface.net_id.present? && @os_interface.subnet_id.present?
          ip_adress = { 
            subnet_id: @os_interface.subnet_id
          }
          unless @os_interface.fixed_ips[0]["ip_address"].blank?
            ip_adress[:ip_address] = @os_interface.fixed_ips[0]["ip_address"]
          end

          @port =
            services.networking.new_port(
              network_id: @os_interface.net_id,
              fixed_ips: [ip_adress],
              security_groups: @os_interface.security_groups,
            )
        end

        if @port
          if @port.id || @port.save
            @os_interface.port_id = @port.id
          else
            @port.errors.each { |k, v| @os_interface.errors.add(k, v) }
          end
        end
      end

      if @os_interface.errors.empty? && @os_interface.save
        @instance = services.compute.find_server(params[:id])
        load_security_groups(@instance) if @action_from_show
        respond_to do |format|
          format.html { redirect_to instances_url }
          format.js {}
        end
      else
        if @port && @port.id && !@port.fixed_ip_port? &&
             params[:os_interface][:port_id].blank?
          @port.destroy
        end
        @networks = services.networking.networks("router:external" => false)
        @fixed_ip_ports = services.networking.fixed_ip_ports
        @subnets = services.networking.subnets
        @security_groups = services.networking.security_groups
        render action: :attach_interface
      end
    end

    def remove_interface
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.find_server(params[:id])
      @os_interface = services.compute.new_os_interface(params[:id])
      # keep only fixed ip
      @instance.addresses.each do |_network_name, ips|
        ips.keep_if { |ip| ip["OS-EXT-IPS:type"] == "fixed" }
      end
    end

    def detach_interface
      @action_from_show = params[:action_from_show] == "true" || false
      # create a new os_interface model based on params
      @os_interface =
        services.compute.new_os_interface(params[:id], params[:os_interface])

      # load all attached server interfaces
      all_server_interfaces = services.compute.server_os_interfaces(params[:id])
      # find the one which should be deleted
      interface =
        all_server_interfaces.find do |i|
          i.fixed_ips.first["ip_address"] == @os_interface.ip_address
        end

      success =
        if interface
          # destroy
          @os_interface.id = @os_interface.port_id = interface.port_id
          @os_interface.destroy
        else
          @os_interface.errors.add(:address, "Not found.")
          false
        end

      if success
        # load instance after deleting os interface!!!

        # try to update instance state
        timeout = 60
        sleep_time = 3
        loop do
          @instance = services.compute.find_server(params[:id])
          interfaces =
            @instance.addresses.values.flatten.select do |ip|
              ip["addr"] == @os_interface.ip_address
            end
          break if timeout <= 0 || interfaces.length.zero?
          timeout -= sleep_time
          sleep(sleep_time)
        end

        load_security_groups(@instance) if @action_from_show

        respond_to do |format|
          format.html { redirect_to instances_url }
          format.js {}
        end
      else
        @instance = services.compute.find_server(params[:id])
        @os_interface.ip_address = params[:os_interface][:ip_address]
        render action: :detach_interface
      end
    end

    def new_size
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.find_server(params[:id])
      @flavors = services.compute.flavors
    end

    def resize
      @close_modal = true
      execute_instance_action("resize", params[:server][:flavor_id])
    end

    def new_status
      @instance = services.compute.find_server(params[:id])
    end

    def reset_status
      @close_modal = true
      execute_instance_action(:reset_vm_state, params[:server][:status])
    end

    def new_snapshot
      @action_from_show = params[:action_from_show] == "true" || false
    end

    def create_image
      @close_modal = true
      execute_instance_action("create_image", params[:snapshot][:name])
    end

    def confirm_resize
      execute_instance_action
    end

    def revert_resize
      execute_instance_action
    end

    def stop
      execute_instance_action
    end

    def start
      execute_instance_action
    end

    def pause
      execute_instance_action
    end

    def suspend
      execute_instance_action
    end

    def resume
      execute_instance_action
    end

    def reboot
      execute_instance_action
    end

    def destroy
      execute_instance_action("terminate")
    end

    def lock
      execute_instance_action
    end

    def unlock
      execute_instance_action
    end

    def hard_reset
      execute_instance_action("reboot", "HARD")
    end

    def automation_script
      accept_header =
        begin
          body = JSON.parse(request.body.read)
          os_type = body.fetch("vmwareOstype", "")
          if os_type.include? "windows"
            "text/x-powershellscript"
          else
            "text/cloud-config"
          end
        rescue => exception
          Rails.logger.error "Compute-plugin: automation_script: error getting os_type: #{exception.message}"
        end
      script =
        services.automation.node_install_script(
          "",
          { "headers" => { "Accept" => accept_header } },
        )
      render json: { script: script }
    end

    def automation_data
      @automation_script_action = automation_script_instances_path
    end

    def two_factor_required?
      if action_name == "console"
        true
      else
        super
      end
    end

    def edit_securitygroups
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.find_server(params[:id])
      @instance_security_groups = @instance.security_groups_details
      @instance_security_groups_keys = []
      @security_groups = services.networking.security_groups
      @instance_security_groups.each do |sg|
        @instance_security_groups_keys << sg.id
        # delete existing groups from security groups list
        @security_groups.delete_if { |group| group.id == sg.id }
        # then re-add existing groups to the beginning of the list
        # have to retrieve the group from nova because the groups obtained via @instance.security_groups_details don't contain all the info
        grp = services.networking.find_security_group!(sg.id)
        @security_groups.unshift(grp)
      end
    end

    def assign_securitygroups
      @action_from_show = params[:action_from_show] == "true" || false
      @instance = services.compute.find_server(params[:id])
      @instance_security_groups = @instance.security_groups_details
      @instance_security_groups_ids = []
      @instance_security_groups.each do |sg|
        @instance_security_groups_ids << sg.id
      end

      to_be_assigned = []
      to_be_unassigned = []

      sgs = params["sgs"]
      if sgs.blank?
        flash.now[
          :error
        ] = "Please assign at least one security group to the server"
        @instance = services.compute.find_server(params[:id])
        @instance_security_groups = @instance.security_groups_details
        @instance_security_groups_keys = []
        @instance_security_groups.each do |sg|
          @instance_security_groups_keys << sg.id
        end
        @security_groups = services.networking.security_groups
        render action: :edit_securitygroups and return
      else
        sgs.each do |sg|
          to_be_assigned << sg unless @instance_security_groups_ids.include?(sg)
        end
        @instance_security_groups_ids.each do |sg|
          to_be_unassigned << sg unless sgs.include?(sg)
        end

        begin
          to_be_assigned.uniq.each do |sg|
            execute_instance_action("assign_security_group", sg, false)
          end

          to_be_unassigned.uniq.each do |sg|
            execute_instance_action("unassign_security_group", sg, false)
          end

          if @action_from_show
            respond_to do |format|
              format.html do
                redirect_to plugin("compute").instance_path(id: @instance.id)
              end
            end
          else
            respond_to { |format| format.html { redirect_to instances_url } }
          end
        rescue => e
          @instance = services.compute.find_server(params[:id])
          @instance_security_groups = @instance.security_groups_details
          @instance_security_groups_keys = []
          @instance_security_groups.each do |sg|
            @instance_security_groups_keys << sg.id
          end
          @security_groups = services.networking.security_groups
          flash.now[
            :error
          ] = "An error happend while assigning/unassigned security groups to the server. Error: #{e}"
          render action: :edit_securitygroups and return
        end
      end
    end

    private

    def load_security_groups(instance)
      # @instance_security_groups = instance.security_groups_details

      @instance_security_groups =
        instance
          .security_groups_details
          .each_with_object({}) do |sg, map|
            next if map[sg.id]
            map[sg.id] = services.networking.find_security_group(sg.id)
          end
          .values
    end

    # This method finds the availability zone with the most avalilable RAM.
    # It use the elektra object cache.
    def prefered_availability_zone
      # load host aggregates from cache and build a map host -> availability_zone
      aggregates =
        ObjectCache.where(cached_object_type: "aggregate").pluck("payload")
      host_az_map =
        aggregates.each_with_object({}) do |payload, map|
          payload["hosts"].each do |host|
            map[host] = payload["availability_zone"]
          end
        end

      # load hypervisor data from elektra object cache
      hypervisor_data =
        ObjectCache.where(cached_object_type: "hypervisor").pluck(
          "payload->'service'->'host'",
          "payload->'memory_mb'",
          "payload->'memory_mb_used'",
        )

      # build sums for used and available RAM per availability zone
      az_capacities =
        hypervisor_data.each_with_object(
          {},
        ) do |(host, memory_mb, memory_mb_used), map|
          az = host_az_map[host]
          if !host.blank? && az
            map[az] ||= {
              availability_zone: az,
              memory_mb: 0,
              memory_mb_used: 0,
            }
            map[az][:memory_mb] += (memory_mb || 0)
            map[az][:memory_mb_used] += (memory_mb_used || 0)
          end
        end

      # sort by most available RAM
      azs =
        az_capacities.values.sort_by! do |data|
          data[:memory_mb] - data[:memory_mb_used]
        end
      # return last element
      azs.last[:availability_zone]
    rescue StandardError
      nil
    end
    ################################ END ####################################

    def collect_available_ips
      @grouped_fips = {}
      networks = {}
      subnets = {}
      services
        .networking
        .project_floating_ips(@scoped_project_id)
        .each do |fip|
          if fip.fixed_ip_address.nil?
            networks[
              fip.floating_network_id
            ] = services.networking.find_network(
              fip.floating_network_id,
            ) unless networks[fip.floating_network_id]
            net = networks[fip.floating_network_id]
            next unless net
            unless net.subnets.blank?
              net.subnets.each do |subid|
                subnets[subid] = services.networking.find_subnet(
                  subid,
                ) unless subnets[subid]
                sub = subnets[subid]
                cidr = NetAddr.parse_net(sub.cidr)
                if cidr.contains(NetAddr.parse_ip(fip.floating_ip_address))
                  @grouped_fips[sub.name] ||= []
                  @grouped_fips[sub.name] << fip #[fip.floating_ip_address, fip.id]
                  break
                end
              end
            else
              @grouped_fips[net.name] ||= []
              @grouped_fips[net.name] << fip #[fip.floating_ip_address, fip.id]
            end
          end
        end
    end

    def execute_instance_action(
      action = action_name,
      options = nil,
      with_rendering = true
    )
      instance_id = params[:id]
      @instance =
        begin
          services.compute.find_server(instance_id)
        rescue StandardError
          nil
        end
      # reload view if action was trigered from instances show view
      @action_from_show = params[:action_from_show] == "true" || false

      @target_state = nil
      if @instance and (@instance.task_state || "") != "deleting"
        # trigger the instance action
        result =
          (
            if options.nil?
              @instance.send(action)
            else
              @instance.send(action, options)
            end
          )
        if result
          audit_logger.info(
            current_user,
            "has triggered action",
            action,
            "on",
            @instance,
          )
          # cool down and wait a little ;-)
          sleep(2)
          @instance =
            begin
              services.compute.find_server(instance_id)
            rescue StandardError
              nil
            end
          # translate taget state
          @target_state = target_state_for_action(action)
          @instance.task_state ||= task_state(@target_state) if @instance
        end
      end

      if @action_from_show
        @terminate = action == "terminate"
        load_security_groups(@instance)
      end
      if with_rendering
        render template: "compute/instances/update_item", formats: :js
      end
    end

    def target_state_for_action(action)
      case action
      when "start"
        Compute::Server::RUNNING
      when "stop"
        Compute::Server::SHUT_DOWN
      when "shut_off"
        Compute::Server::SHUT_OFF
      when "pause"
        Compute::Server::PAUSED
      when "suspend"
        Compute::Server::SUSPENDED
      when "block"
        Compute::Server::BLOCKED
      end
    end

    # translate taget state that is vissible during the action
    # is in progress
    def task_state(target_state)
      target_state = target_state.to_i if target_state.is_a?(String)
      case target_state
      when Compute::Server::RUNNING
        "starting"
      when Compute::Server::SHUT_DOWN
        "powering-off"
      when Compute::Server::SHUT_OFF
        "powering-off"
      when Compute::Server::PAUSED
        "pausing"
      when Compute::Server::SUSPENDED
        "suspending"
      when Compute::Server::BLOCKED
        "blocking"
      when Compute::Server::BUILDING
        "creating"
      end
    end

    def active_project_id
      unless @active_project_id
        local_project =
          Project.find_by_domain_fid_and_fid(
            @scoped_domain_fid,
            @scoped_project_fid,
          )
        @active_project_id = local_project.key if local_project
      end
      return @active_project_id
    end

    def all_projects
      @all_projects = current_user.is_allowed?("compute:all_projects")
      @admin_option = @all_projects ? { all_tenants: 1 } : {}
    end

    def instance_params
      params.require(:instance).permit(:q)
    end
  end
end
