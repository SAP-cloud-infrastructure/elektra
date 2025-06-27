# frozen_string_literal: true

module Identity
  # This class implements project actions
  class ProjectsController < ::DashboardController
    before_action :project_id_required, except: %i[index create new]
    before_action :get_project_id,
                  except: %i[index create new show view show_wizard]

    # load @project because we do not want to use the @active_project from the object cache
    # in case the description was changed we want to show the user the changes immediately
    before_action :get_project,
                  only: %i[
                    show
                    view
                    show_wizard
                    enable_sharding
                    sharding_skip_wizard_confirm
                  ]

    # check wizard state and redirect unless finished
    before_action :check_wizard_status, only: [:show]
    before_action :api_endpoints, only: %i[download_openrc download_openrc_ps1]
    before_action { @scoped_project_fid = params[:project_id] || @project_id }

    authorization_required(
      context: 'identity',
      additional_policy_params: {
        project: proc { { id: @project_id, domain_id: @scoped_domain_id } }
      }
    )

    def show
      return unless @project.nil?

      # this is a fallback if something goes wrong to load the project
      get_project
    end

    def view
    end

    def edit
      @project = services.identity.find_project(@project_id)
    end

    def update
      params[:project][:enabled] = params[:project][:enabled] == true || params[:project][:enabled] == 'true'

      @project = service_user.identity.new_project(params[:project])
      @project.id = @project_id
      @project.domain_id = @scoped_domain_id
      if @project.save && audit_logger.info(current_user, 'has updated', @project)
        flash[:notice] = "Project #{@project.name} successfully updated."
        redirect_to plugin('identity').project_path(project_id: @project.id)
      else
        flash.now[:error] = @project.errors.full_messages.to_sentence
        render action: :edit
      end
    end

    def show_wizard
      load_and_update_wizard_status if request.xhr?
    end

    def destroy
      flash.now[:error] = 'Deleting projects is currently not allowed because \
      it creates orphaned dependant objects in backend services.'
      render action: :show
    end

    def enable_sharding
      @project_wizard = false
      @project_wizard = true if params['project_wizard'] == 'true'
      return unless params['enable'] == 'true'

      service_user_project = service_user.identity.find_project(@project_id)
      tags = service_user_project.tags
      tags << 'sharding_enabled'
      service_user_project.tags = tags
      if service_user_project.save &&
         audit_logger.info(
           current_user,
           'sharding enabled',
           service_user_project
         )
        unless @project_wizard
          flash[
            :notice
          ] = 'Sharding activation was successfull. You can now use all available shards.'
        end
      else
        unless params['modal']
          flash[:error] = service_user_project
                          .errors
                          .full_messages
                          .to_sentence
        end
      end
      return if @project_wizard

      redirect_to "#{plugin('resources').v2_project_path}#/PAYG%20Availability"

      # if project_wizard just load enable_sharding.js.erb that is closing the modal window
    end

    def api_endpoints
      @token = current_user.token
      @identity_url = current_user.service_url('identity')
    end

    def download_openrc
      out_data =
        "export OS_AUTH_URL=#{@identity_url}\n" \
          "export OS_IDENTITY_API_VERSION=3\n" \
          "export OS_PROJECT_NAME=\"#{@scoped_project_name}\"\n" \
          "export OS_PROJECT_DOMAIN_NAME=\"#{@scoped_domain_name}\"\n" \
          "export OS_USERNAME=#{current_user.name}\n" \
          "export OS_USER_DOMAIN_NAME=\"#{@scoped_domain_name}\"\n" \
          "echo \"Please enter your OpenStack Password: \"\n" \
          "read -sr OS_PASSWORD_INPUT\n" \
          "export OS_PASSWORD=$OS_PASSWORD_INPUT\n" \
          "export OS_REGION_NAME=#{current_region}\n"

      send_data(
        out_data,
        type: 'text/plain',
        filename: "openrc-#{@scoped_domain_name}-#{@scoped_project_name}",
        dispostion: 'inline',
        status: :ok
      )
    end

    def download_openrc_ps1
      out_data =
        "$env:OS_AUTH_URL=\"#{@identity_url}\"\r\n" \
          "$env:OS_IDENTITY_API_VERSION=\"3\"\r\n" \
          "$env:OS_PROJECT_NAME=\"#{@scoped_project_name}\"\r\n" \
          "$env:OS_PROJECT_DOMAIN_NAME=\"#{@scoped_domain_name}\"\r\n" \
          "$env:OS_USERNAME=\"#{current_user.name}\"\r\n" \
          "$env:OS_USER_DOMAIN_NAME=\"#{@scoped_domain_name}\"\r\n" \
          "$Password = Read-Host -Prompt \"Please enter your OpenStack Password\" -AsSecureString\r\n" \
          "$env:OS_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))\r\n" \
          "$env:OS_REGION_NAME=\"#{current_region}\"\r\n" 

      send_data(
        out_data,
        type: 'text/plain',
        filename: "openrc-#{@scoped_domain_name}-#{@scoped_project_name}.ps1",
        dispostion: 'inline',
        status: :ok
      )
    end

    def sharding_skip_wizard_confirm
      # placeholder
    end

    def sharding_skip_wizard
      skip_wizard = params[:project][:skip_wizard] || false
      project_profile =
        ProjectProfile.find_or_create_by_project_id(@scoped_project_id)
      return unless skip_wizard

      project_profile.update_wizard_status(
        'sharding',
        ProjectProfile::STATUS_SKIPPED
      )
    end

    def check_delete
      if params['prodel'].nil?
        # initial load for empty form
        @prodel = Prodel.new(project_domain_name: '', project_name: '')
        return
      end
      project_name_or_id = params['prodel']['project_name'] || ''
      project_domain_name_or_id = params['prodel']['project_domain_name'] || ''
      @prodel = Prodel.new(project_domain_name: project_domain_name_or_id, project_name: project_name_or_id)
      return unless @prodel.valid?

      # assume that project id was provided
      if @prodel.project_domain_name.blank?
        begin
          @project_to_delete = services.identity.find_project!(project_name_or_id)
        rescue StandardError => e
          flash.now[:error] = "No Project with id '#{project_name_or_id}' found"
          return
        end
      # assume that both domain id/name and project id/name were provided
      else
        begin
          @prodel_project_domain = services.identity.find_domains_by_name(project_domain_name_or_id)
        rescue StandardError => e
          flash.now[:error] = "No Domain with name or id '#{project_domain_name_or_id}' found"
          return
        end
        if @prodel_project_domain.length.zero?
          begin
            @prodel_project_domain = services.identity.find_domain!(project_domain_name_or_id)
          rescue StandardError => e
            flash.now[:error] = "No Domain with name or id '#{project_domain_name_or_id}' found"
            return
          end
        else
          @prodel_project_domain = @prodel_project_domain[0]
        end
        @project_to_delete = services.identity.find_project_by_name_or_id(@prodel_project_domain.id,
                                                                          project_name_or_id)
      end
      if !@project_to_delete.nil?
        begin
          @resources = services.identity.get_project_resources(@project_to_delete.id)
        rescue Elektron::Errors::ApiResponse => e
          errorBody = e.response.body.to_h
          message = errorBody['message'] || errorBody['status']
          flash.now[:error] =
            "Cannot check '#{project_name_or_id}' in domain '#{project_domain_name_or_id}', prodel API: #{message}"
        end
      else
        flash.now[:error] =
          "No Project with name or id '#{project_name_or_id}' found in domain '#{project_domain_name_or_id}'"
        nil
      end
    end

    def delete_with_prodel
      project_to_delete_id = params['project_to_delete_id'] || ''
      project_to_delete_name = params['project_to_delete_name'] || ''
      prodel_project_domain_name = params['prodel_project_domain_name'] || ''
      if !project_to_delete_id.blank?
        begin
          services.identity.delete_project_with_prodel(project_to_delete_id)
          flash.now[:success] = "Project '#{project_to_delete_name}' in domain '#{prodel_project_domain_name}' deleted"
        rescue Elektron::Errors::ApiResponse => e
          errorBody = e.response.body.to_h
          message = errorBody['message'] || errorBody['status']
          flash.now[:error] =
            "Cannot delete project '#{project_to_delete_name || project_to_delete_id}' in domain '#{prodel_project_domain_name}', prodel API: #{message}"
        end
      else
        flash.now[:error] = 'Cannot delete, no project_to_delete_id given!'
      end
      @prodel = Prodel.new(project_domain_name: '', project_name: '')
      render action: :check_delete
    end

    private

    def get_project
      get_project_id
      @project =
        services.identity.find_project(
          @project_id,
          subtree_as_ids: true,
          parents_as_ids: true
        )
      @sharding_enabled = @project.sharding_enabled if @project
    end

    def get_project_id
      @project_id = params[:id] || params[:project_id]
      entry =
        FriendlyIdEntry.find_by_class_scope_and_key_or_slug(
          'Project',
          @scoped_domain_id,
          @project_id
        )
      @project_id = entry.key if entry
    end

    def check_wizard_status
      # disable wizard for cloud_admin project
      return if %w[ccadmin cloud_admin].include?(@scoped_domain_name)

      # for all services that implements a wizard integration do
      # check the order in /elektra/plugins/identity/spec/controllers/projects_controller_spec.rb
      service_names =
        %w[masterdata_cockpit networking].keep_if do |name|
          services.available?(name.to_sym) && plugin_available?(name)
        end

      # ProjectProfile /elektra/app/models
      project_profile =
        ProjectProfile.find_or_create_by_project_id(@scoped_project_id)

      # check the status in the project_profiles database
      # if all is done do not show the wizard
      return if project_profile.wizard_finished?(service_names)

      redirect_to plugin('identity').project_wizard_url
    end

    # show the status of all implented wizard steps
    def load_and_update_wizard_status
      @wizard_finished = true
      @project_profile =
        ProjectProfile.find_or_create_by_project_id(@scoped_project_id)

      domain_config = DomainConfig.new(@scoped_domain_name)

      # for all services that implements a wizard integration do
      # check the order in /elektra/plugins/identity/spec/controllers/projects_controller_spec.rb
      %w[
        sharding
        masterdata_cockpit
        networking
      ].each do |service_name|
        if service_name == 'sharding'
          logger.info 'sharding is no service'
        else
          next unless services.available?(service_name.to_sym) && plugin_available?(service_name)
        end
        # set instance variable service available to true
        instance_variable_set("@#{service_name}_service_available", true)
        # check database for finished wizard step otherwise check update_SERVICE_wizard_status()
        # Note: if the wizard done state is set disable this for debugging
        #       or just delete the entry in the database "DELETE from project_profiles WHERE project_id=''"
        if @project_profile.wizard_finished?(service_name) ||
           @project_profile.wizard_skipped?(service_name)
          next
        end

        # check wizard status for service_name
        @wizard_finished &=
          begin
            send("update_#{service_name}_wizard_status")
          rescue StandardError => _e
            instance_variable_set("@#{service_name}_service_available", false)
            false
          end
      end
    end

    ################### HELPER METHODS #########################
    # this functions are called from load_and_update_wizard_status()

    # MASTERDATA
    def update_masterdata_cockpit_wizard_status
      project_masterdata = nil
      @project_masterda_is_complete = false
      @project_masterdata_missing_attributes = nil
      begin
        project_masterdata =
          services.masterdata_cockpit.get_project(@scoped_project_id)
        # @project_masterda_is_complete is used in plugins/identity/app/views/identity/projects/_wizard_steps.html.haml
        @project_masterda_is_complete = project_masterdata.is_complete
      rescue StandardError
        # the api will return with 404 if no masterdata was found all other cases will return false -> service not available
        # if e.code == 404
        #  return true
        # else
        #  return false
        # end
      end

      if project_masterdata && @project_masterda_is_complete
        @project_profile.update_wizard_status(
          'masterdata_cockpit',
          ProjectProfile::STATUS_DONE
        )
      elsif project_masterdata && !@project_masterda_is_complete
        # @project_masterdata_missing_attributes is used in plugins/identity/app/views/identity/projects/_wizard_steps.html.haml
        @project_masterdata_missing_attributes =
          project_masterdata.missing_attributes
        @project_profile.update_wizard_status('masterdata_cockpit', nil)
      else
        @project_profile.update_wizard_status('masterdata_cockpit', nil)
      end

      @project_profile.wizard_finished?('masterdata_cockpit')
    end

    # SHARDING
    def update_sharding_wizard_status
      sharding_enabled = @project.sharding_enabled

      if sharding_enabled == true
        @project_profile.update_wizard_status(
          'sharding',
          ProjectProfile::STATUS_DONE
        )
      else
        @project_profile.update_wizard_status('sharding', nil)
      end

      @project_profile.wizard_finished?('sharding')
    end

    # NETWORKING
    def update_networking_wizard_status
      # ensure current user has the network admin role (UNTREATED EDGE CASE: current user isn't admin. Might have to add some stuff for this)
      if current_user.has_role?('admin') &&
         !current_user.has_role?('network_admin')
        network_admin_role =
          services.identity.grant_project_user_role_by_role_name(
            @scoped_project_id,
            current_user.id,
            'network_admin'
          )
        # HACK: extend current_user context to add the new assigned role
        current_user.context['roles'] << {
          'id' => network_admin_role.id,
          'name' => network_admin_role.name
        }
      end

      # get external networks for this project (using the current user context -> this will retrieve both self-owned and shared networks)
      external_nets = services.networking.networks('router:external' => true)

      # mark wizard done if project has at least one external network. Either shared or owned
      if external_nets.blank?
        @project_profile.update_wizard_status('networking', nil)
      else
        @project_profile.update_wizard_status(
          'networking',
          ProjectProfile::STATUS_DONE
        )
      end

      @project_profile.wizard_finished?('networking')
    end
  end
end
