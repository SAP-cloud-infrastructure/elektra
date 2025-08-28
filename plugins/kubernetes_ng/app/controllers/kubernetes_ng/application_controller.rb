# frozen_string_literal: true

module KubernetesNg
  class ApplicationController < AjaxController

    def list_cloud_profiles
      render json: services.kubernetes_ng.list_cloud_profiles
    end

  end
end
