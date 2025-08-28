module KubernetesNg
  class ApiController < ApplicationController
    def list_cloud_profiles
      render json: services.kubernetes_ng.list_cloud_profiles
    end

    def list_clusters
      render json: services.kubernetes_ng.list_clusters(current_project_id)
    end

    def show_cluster
      render json: services.kubernetes_ng.show_cluster(params[:id])
    end
  end
end
