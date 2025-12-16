module KubernetesNg
  class ClustersController < ApplicationController
    rescue_from ServiceLayer::KubernetesNgServices::Clusters::KubeconfigGenerationError, with: :render_kubeconfig_error

    def index
      handle_api_call do
        services.kubernetes_ng.list_clusters(@scoped_project_id)
      end
    end

    def show
      handle_api_call do
        services.kubernetes_ng.show_cluster_by_name(@scoped_project_id, params[:name])
      end
    end

    def create     
      cluster_defaults = { region: current_region }

      permitted_params = cluster_params.to_h
      cluster_params_with_defaults = permitted_params.merge(cluster_defaults).with_indifferent_access

      handle_api_call do
        services.kubernetes_ng.create_cluster(@scoped_project_id, cluster_params_with_defaults)
      end
    end

    def confirm_deletion_and_destroy
      handle_api_call(auto_render: false) do
        services.kubernetes_ng.confirm_cluster_deletion(@scoped_project_id, params[:name])
        render json: services.kubernetes_ng.destroy_cluster(@scoped_project_id, params[:name])
      end
    end

    def destroy
      handle_api_call do
        services.kubernetes_ng.destroy_cluster(@scoped_project_id, params[:name])
      end
    end

    def confirm_deletion
      handle_api_call do
        services.kubernetes_ng.confirm_cluster_deletion(@scoped_project_id, params[:name])
      end
    end

    def update
      # todo here we need to translate or copy the data over from the request parameters
      # example data, this needs to be commented out!
      cluster_params = {
        purpose: 'testing-2'
      }
      # Note: this is not working
      #{
      #    "apiVersion": "v1",
      #    "code": 400,
      #    "kind": "Status",
      #    "message": "error decoding patch: json: cannot unmarshal object into Go value of type []handlers.jsonPatchOp",
      #    "metadata": {},
      #    "reason": "BadRequest",
      #    "status": "Failure"
      #}

      handle_api_call do
        services.kubernetes_ng.update_cluster(@scoped_project_id, params[:name], cluster_params)
      end
    end

    def external_networks
      handle_api_call do
        services.networking
                .project_networks(@scoped_project_id)
                .select do |n|
                  n.attributes["router:external"] == true &&
                  n.attributes["shared"] == true
                end
      end
    end

    def kubeconfig
      handle_api_call do
        services.kubernetes_ng.admin_kubeconfig_cluster(@scoped_project_id, params[:name])
      end
    end

    private

    def render_kubeconfig_error(error)
      render json: {
          message: "Kubeconfig generation failed: #{error.message}"
      }, status: :internal_server_error
    end

    def cluster_params
      params.require(:cluster).permit(
        :name,
        :cloudProfileName,
        :region,
        :kubernetesVersion,
        :domain_id,
        :project_id,
        infrastructure: [:floatingPoolName, :apiVersion, :networkWorkers],
        networking: [:pods, :nodes, :services],
        workers: [
          :name,
          :id,
          :machineType,
          { machineImage: [:name, :version] },
          :minimum,
          :maximum,
          zones: []
        ]
      )
    end

  end
end
