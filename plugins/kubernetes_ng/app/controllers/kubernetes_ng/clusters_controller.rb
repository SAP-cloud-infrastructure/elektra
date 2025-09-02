module KubernetesNg
  class ClustersController < ApplicationController
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
      # todo here we need to translate or copy the data over from the request parameters
      # example data, this needs to be commented out!
      cluster_params = {
        name: 'hgws-test',
        region: 'qa-de-1',
        infrastructure: 'openstack',
        version: '1.25.4',
        cloud_profile_name: 'openstack',                          # this should be set from the API?
        networking: {type: 'calico'},                             # this should be set from the API?
        secret_binding_name: "XXX",                               # this should be set from the API?
        purpose: 'testing',
        workers: [
          {
            name: 'worker-pool-1',
            machine_type: 'g_c4_m16',
            architecture: 'amd64',
            machine_image: {
              name: 'flatcar',
              version: '1.0.0'
            },
            container_runtime: 'containerd',
            min: 2,
            max: 5,
            max_surge: 1,
            zones: ['qa-de-1a']
          }
        ],
        auto_update: {
          os: true,
          kubernetes: true
        }
      }

      handle_api_call do
        services.kubernetes_ng.create_cluster(@scoped_project_id, cluster_params)
      end
    end

    def mark_and_delete
      handle_api_call(auto_render: false) do
        services.kubernetes_ng.mark_cluster_for_deletion(@scoped_project_id, params[:name])
        render json: services.kubernetes_ng.destroy_cluster(@scoped_project_id, params[:name])
      end
    end

    def destroy
      handle_api_call do
        services.kubernetes_ng.destroy_cluster(@scoped_project_id, params[:name])
      end
    end

    def mark_for_deletion
      handle_api_call do
        services.kubernetes_ng.mark_cluster_for_deletion(@scoped_project_id, params[:name])
      end
    end

    def update
      # TODO: Implement update action if UI is ready
    end

  end
end
