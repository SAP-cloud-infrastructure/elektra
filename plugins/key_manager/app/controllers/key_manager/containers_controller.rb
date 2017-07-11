module KeyManager

  class ContainersController < ::KeyManager::ApplicationController
    before_action :container_form_attr, only: [:new, :create]

    helper :all

    def index
      containers()
    end

    def show
      @container = services.key_manager.container(params[:id])
      # get the user name from the openstack id
      begin
        @user = service_user.identity.find_user(@container.creator_id).name
      rescue
        nil
      end
    end

    def new
    end

    def create
      @container = services.key_manager.new_container(container_params)
      if @container.valid? && @container.save
        redirect_to plugin('key_manager').containers_path()
      else
        flash_message_from_key([:secret_refs, :global], @container)
        render action: "new"
      end
    end

    def destroy
      # delete container
      @container = services.key_manager.container(params[:id])

      @container.destroy
      flash.now[:success] = "Container #{@container.name} was successfully removed."
      # grap a new list of secrets
      containers()

      # render
      render action: "index"
    end

    private

    def flash_message_from_key(keys, container)
      keys.each do |value|
        unless container.errors.messages[value].blank?
          container.errors.messages[value].each do |msg|
            if value == :secret_refs
              msg = "Secrets #{msg}"
            end
            if flash.now[:danger].nil?
              flash.now[:danger] = msg
            else
              flash.now[:danger] << " " + msg
            end
          end
        end
      end
    end

    def containers
      page = params[:page]||1
      per_page = 10
      offset = (page.to_i - 1) * per_page
      result = services.key_manager.containers({sort: 'created:desc', limit: per_page, offset: offset})
      @containers = Kaminari.paginate_array(result[:elements], total_count: result[:total_elements]).page(page).per(per_page)
    end

    def container_form_attr
      @types = ::KeyManager::Container::Type.to_hash
      @selected_type = params.fetch('container', {}).fetch('type', nil) || params[:container_type] || ::KeyManager::Container::Type::GENERIC
      @container = ::KeyManager::Container.new({})
      @selected_secrets = {}

      # get all secrets
      @secrets = []
      offset = 0
      limit = 100
      begin
        secrets_chunk = services.key_manager.secrets({sort: 'created:desc', offset: offset, limit: limit})
        @secrets += secrets_chunk[:elements] unless secrets_chunk[:elements].blank?
        offset += limit
      end while offset < secrets_chunk[:total_elements].to_i

      # sort by type
      @symmetrics = []
      @public_keys = []
      @private_keys = []
      @passphrases = []
      @certificates = []
      @secrets.each do |element|
        case element.secret_type
          when Secret::Type::SYMMETRIC
            @symmetrics << element
          when Secret::Type::PUBLIC
            @public_keys << element
          when Secret::Type::PRIVATE
            @private_keys << element
          when Secret::Type::PASSPHRASE
            @passphrases << element
          when Secret::Type::CERTIFICATE
            @certificates << element
          else
        end
      end
    end

    def container_params
      unless params['container'].blank?
        container = params.clone.fetch('container', {})

        # remove if blank
        container.delete_if { |key, value| value.blank? }

        # add secrets
        case container['type']
          when Container::Type::CERTIFICATE
            secrets = container.fetch('secrets', {}).fetch(Container::Type::CERTIFICATE, {})
            unless secrets.blank?
              secrets.delete_if { |key, value| value.blank? }
              container['secret_refs'] = []
              secrets.each do |key, value|
                container['secret_refs'] << {name: key, secret_ref: value}
              end
            end
            @selected_secrets = secrets
          when Container::Type::RSA
            secrets = container.fetch('secrets', {}).fetch(Container::Type::RSA, {})
            unless secrets.blank?
              secrets.delete_if { |key, value| value.blank? }
              container['secret_refs'] = []
              secrets.each do |key,value|
                container['secret_refs'] << {name: key, secret_ref: value}
              end
            end
            @selected_secrets = secrets
          when Container::Type::GENERIC
            secrets = container.fetch('secrets', {}).fetch(Container::Type::GENERIC, {})
            unless secrets.blank?
              container['secret_refs'] = []
              secrets.each do |key, value|
                container['secret_refs'] << value
              end
            end
            @selected_secrets = secrets
        end

        return container
      end
      return {}
    end

  end

end
