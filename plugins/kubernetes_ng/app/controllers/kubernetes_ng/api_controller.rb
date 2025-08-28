module KubernetesNg
  class ApiController < ApplicationController
    def index
      render json: services.kubernetes_ng.list_cloud_profiles
    end
  end
end
