# frozen_string_literal: true

module Networking
  module Networks
    # list, create and delete subnets
    class SubnetsController < DashboardController
      def index
        render json:
                 services.networking.subnets(network_id: params[:network_id]),
               status: 200
      end

      def create
        subnet =
          services.networking.new_subnet(
            params[:subnet].merge(network_id: params[:network_id]),
          )
        subnet.check_cidr_range = @domain_config&.check_cidr_range?
        if subnet.save
          render json: subnet, status: 201
        else
          render json: { errors: subnet.errors }, status: 400
        end
      end

      def destroy
        subnet = services.networking.new_subnet
        subnet.id = params[:id]
        if subnet.destroy
          head 204
        else
          render json: { errors: subnet.errors }, status: 400
        end
      end
    end
  end
end
