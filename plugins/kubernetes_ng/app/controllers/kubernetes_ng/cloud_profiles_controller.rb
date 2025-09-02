module KubernetesNg
  class CloudProfilesController < ApplicationController
    def index
      handle_api_call do
        services.kubernetes_ng.list_cloud_profiles
      end
    end
  end
end
