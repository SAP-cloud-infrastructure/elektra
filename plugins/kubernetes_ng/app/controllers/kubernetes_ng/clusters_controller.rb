module KubernetesNg
  class ClustersController < ApplicationController
    def index
      render json: services.kubernetes_ng.list_clusters(@scoped_project_id)
    end

    def show
      render json: services.kubernetes_ng.show_cluster_by_name(@scoped_project_id, params[:name])
    end
  end
end
