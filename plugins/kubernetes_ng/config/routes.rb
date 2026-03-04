KubernetesNg::Engine.routes.draw do
  # Define API routes as a reusable lambda
  api_routes = lambda do
    resources :clusters, only: [:index, :show, :create, :destroy, :update], param: :name do
      member do
        put 'replace', to: 'clusters#replace_cluster'
      end
      collection do
        patch 'confirm-deletion(/:name)', to: 'clusters#confirm_for_deletion'
        delete 'confirm-deletion-and-destroy(/:name)', to: 'clusters#confirm_deletion_and_destroy'
        get 'external-networks', to: 'clusters#external_networks'
        get 'kubeconfig(/:name)', to: 'clusters#kubeconfig'
      end
    end
    resources :cloud_profiles, only: [:index], path: "cloud-profiles"
    get 'permissions(/:resource(/:verb))', to: 'permissions#index'
  end

  # API routes (for UI use without service_name, service_name will be injected in controller from session)
  scope "/api", &api_routes

  # Service-scoped routes (e.g., /prod, /canary, /qa for UI)
  get ":service_name", to: "application#show", as: :service

  # Service-scoped API routes (e.g., /prod/api, /canary/api, /qa/api just for API calls with explicit service_name in URL)
  scope "/:service_name/api", &api_routes

  # Catch-all for frontend routes → let React handle routing
  get ':service_name/*path', to: 'application#show', constraints: ->(req) do
    !req.xhr? && req.format.html?
  end

  # Catch-all for legacy routes without service_name
  get '*path', to: 'application#show', constraints: ->(req) do
    !req.xhr? && req.format.html?
  end

  # Root route redirects to default service (handled by controller)
  root to: "application#show", as: :root
end
