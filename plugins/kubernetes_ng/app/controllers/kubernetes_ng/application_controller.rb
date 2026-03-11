# frozen_string_literal: true

module KubernetesNg
  class ApplicationController < DashboardController

    def show
      @landscape_name = params[:landscape_name]

      # Redirect to default landscape if no landscape_name provided
      if @landscape_name.blank?
        redirect_to plugin('kubernetes_ng').service_path(landscape_name: 'prod')
        return
      end

      # Validate landscape_name is allowed
      unless KubernetesNg.allowed_landscapes.include?(@landscape_name)
        redirect_to plugin('kubernetes_ng').service_path(landscape_name: 'prod')
        return
      end
    end

  end
end
