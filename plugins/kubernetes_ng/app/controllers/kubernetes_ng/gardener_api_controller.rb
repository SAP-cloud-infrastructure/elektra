# frozen_string_literal: true

module KubernetesNg
  class GardenerApiController < Api::BaseController
    rescue_from ServiceLayer::KubernetesNgServices::GardenerApi::KubeconfigGenerationError, with: :render_kubeconfig_error

    def kubeconfig
      handle_api_call do
        kubernetes_service.gardener_api_kubeconfig
      end
    end

    private

    def render_kubeconfig_error(error)
      render json: {
        message: "Kubeconfig generation failed: #{error.message}"
      }, status: :internal_server_error
    end
  end
end
