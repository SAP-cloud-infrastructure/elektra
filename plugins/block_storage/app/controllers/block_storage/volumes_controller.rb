# frozen_string_literal: true

require_dependency 'block_storage/application_controller'

module BlockStorage
  # volumes controller
  class VolumesController < BlockStorage::ApplicationController
    authorization_context 'block_storage'
    authorization_required except: %i[availability_zones images]

    def index
      limit = (params[:limit] || 20).to_i
      sort_key = (params[:sort_key] || 'name')
      sort_dir = (params[:sort_dir] || 'asc')
      
      if params[:search_type] == 'id'
        volume = services.block_storage.find_volume!(params[:search_term]) rescue nil
        extend_volume_data(volume) if volume
        volumes = volume ? [volume] : []
      else 
        filters = { sort_key: sort_key, sort_dir: sort_dir, limit: limit + 1 }
        filters[:marker] = params[:marker] if params[:marker]
        filters[params[:search_type]] = params[:search_term] if params[:search_type] 

        volumes = services.block_storage.volumes_detail(filters)
        extend_volume_data(volumes)
      end    

      # byebug
      render json: { 
        items: volumes[0...limit], 
        has_next: volumes.length > limit,
        page: (params[:page] || 1).to_i,
        limit: limit, sort_dir: sort_dir, sort_key: sort_key
      }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def show
      volume = services.block_storage.find_volume!(params[:id])
      extend_volume_data(volume)

      render json: { volume: volume }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    # POST /volumes
    def create
      volume = services.block_storage.new_volume
      volume.attributes = params[:volume]

      if volume.save
        audit_logger.info(current_user, 'has created', volume)
        extend_volume_data(volume)
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {created: volume.to_json}

        render json: volume
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def update
      volume = services.block_storage.find_volume!(params[:id])

      if volume.update(params[:volume])
        audit_logger.info(current_user, 'has updated', volume)
        extend_volume_data(volume)
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {updated: volume.to_json}
        
        render json: volume
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    # DELETE /volumes/1
    def destroy
      volume = services.block_storage.new_volume
      volume.id = params[:id]

      if volume.destroy
        audit_logger.info(current_user, 'has deleted', volume)
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {deleted: params[:id]}
        
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def attach
      volume = services.block_storage.new_volume
      volume.id = params[:id]

      if volume.attach_to_server(params[:server_id], params[:device])
        audit_logger.info(current_user, "has attached #{volume.id} to #{params[:server_id]}")
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {attached: params[:id]}
        
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def detach
      volume = services.block_storage.find_volume!(params[:id])
      attachment = volume.attachments.find { |a| a['attachment_id'] == params[:attachment_id] }

      if volume.detach(attachment['server_id'])
        audit_logger.info(current_user, "has detached #{volume.id} #{attachment['server_id']}")
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {detached: params[:id]}
        
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def reset_status
      # there is a bug in cinder permissions check.
      # The API does not allow volume admin to change
      # the state. For now we switch to cloud admin.
      # TODO: switch back to service.block_storage once
      # the API is fixed
      volume = cloud_admin.block_storage.find_volume(params[:id])

      if volume.reset_status(params[:status])
        audit_logger.info(current_user, 'has reset volume', volume.id)
        render json: volume
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def extend_size
      volume = services.block_storage.find_volume(params[:id])

      if volume.extend_size(params[:size])
        audit_logger.info(current_user, 'has extended volume size', volume.id, params[:size])
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def to_image
      volume = services.block_storage.new_volume
      volume.id = params[:id]

      if volume.upload_to_image(params[:image])
        audit_logger.info(current_user, 'has uploaded volume to image', volume.id, params[:image])
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def force_delete
      volume = services.block_storage.new_volume
      volume.id = params[:id]

      if volume.force_delete
        audit_logger.info(current_user, 'has deleted (force-delete)', volume.id)
        
        ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes", {deleted: params[:id]}
        
        head 202
      else
        render json: { errors: volume.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def availability_zones
      render json: { availability_zones: cloud_admin.compute.availability_zones }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def images
      render json: { images: cloud_admin.image.images }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def types
      render json: { images: cloud_admin.block_storage.volume_types }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.cod
    end

    def available_servers
      render json: services.compute.servers
    end

    protected
    # this method extends volumes with data from cache
    def extend_volume_data(volumes)
      volumes = [volumes] unless volumes.is_a?(Array)

      user_ids = []
      server_ids = []
      volumes.each do |volume|
        user_ids << volume.user_id
        server_ids << volume.attachments.collect { |a| a['server_id']}
      end

      cached_users = ObjectCache.where(id: user_ids).each_with_object({}) do |u,map|
        map[u.id] = u
      end

      cached_servers = ObjectCache.where(id: server_ids.flatten).each_with_object({}) do |s,map|
        map[s.id] = s
      end

      volumes.each do |volume|
        if cached_users[volume.user_id]
          volume.user_name = "#{cached_users[volume.user_id].payload['description']} (#{cached_users[volume.user_id].name})"
        end
        volume.attachments.each do |attachment|
          if cached_servers[attachment['server_id']]
            attachment['server_name'] = cached_servers[attachment['server_id']].name
          end
        end
      end
    end
  end
end
