module KubernetesNg
  class CloudProfilesController < ApplicationController
    def index
      handle_api_call do
        kubernetes_service.list_cloud_profiles
      end
    end
  end
end
