# frozen_string_literal: true

module SharedFilesystemStorage
  # shares
  class SharesController < ApplicationController
    def index
      per_page = (params[:per_page] || 10).to_i
      current_page = (params[:page] || 1).to_i

      shares =
        services.shared_filesystem_storage.shares_detail(
          limit: per_page + 1,
          offset: (current_page - 1) * per_page,
        )

      render json: {
               shares: shares[0..per_page - 1],
               has_next: shares.length > per_page,
             }
    end

    def export_locations
      render json:
               services.shared_filesystem_storage.share_export_locations(
                 params[:id],
               )
    end

    def show
      render json: services.shared_filesystem_storage.find_share(params[:id])
    end

    def availability_zones
      render json: services.shared_filesystem_storage.availability_zones
    end

    def update
      share = services.shared_filesystem_storage.new_share(share_params)
      share.id = params[:id]

      if share.save
        render json: share
      else
        render json: { errors: share.errors }
      end
    end

    def update_size
      share = services.shared_filesystem_storage.find_share(params[:id])

      if share.update_size(params[:size])
        render json: share
      else
        render json: { errors: share.errors }
      end
    end

    def create
      share = services.shared_filesystem_storage.new_share(share_params)
      share.share_type ||= "default"

      if share.save
        render json: share
      else
        render json: { errors: share.errors }
      end
    end

    def destroy
      share = services.shared_filesystem_storage.new_share
      share.id = params[:id]

      if share.destroy
        head :no_content
      else
        render json: { errors: share.errors }
      end
    end

    def reset_status
      share = services.shared_filesystem_storage.find_share(params[:id])

      if share.reset_state(params[:status])
        render json: share
      else
        render json: { errors: share.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def revert_to_snapshot
      share = services.shared_filesystem_storage.find_share(params[:id])

      if share.revert_to_snapshot(params[:snapshot_id])
        head 202
      else
        render json: { errors: share.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    def force_delete
      share = services.shared_filesystem_storage.new_share
      share.id = params[:id]

      if share.force_delete
        head 202
      else
        render json: { errors: share.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    end

    protected

    def share_params
      params.require(:share).permit(
        :share_proto,
        :size,
        :name,
        :description,
        :display_name,
        :display_description,
        :share_type,
        :volume_type,
        :snapshot_id,
        :metadata,
        :share_network_id,
        :consistency_group_id,
        :availability_zone,
        :mount_point_name,
      )
    end
  end
end
