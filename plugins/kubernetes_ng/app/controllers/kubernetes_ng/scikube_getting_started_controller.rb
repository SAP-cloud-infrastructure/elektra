# frozen_string_literal: true

module KubernetesNg
  class ScikubeGettingStartedController < Api::BaseController

    def show
      handle_api_call do
        kubernetes_service.scikube_getting_started_markdown
      end
    end

  end
end
