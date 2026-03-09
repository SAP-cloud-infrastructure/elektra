KubernetesNg::Engine.routes.draw do
  # Landscape-scoped routes (e.g., /prod, /canary, /qa for UI)
  get ":landscape_name", to: "application#show", as: :service

  # Landscape-scoped API routes (e.g., /prod/api, /canary/api, /qa/api)
  scope "/:landscape_name/api" do
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

  # Catch-all for frontend routes → let React handle routing
  get ':landscape_name/*path', to: 'application#show', constraints: ->(req) do
    !req.xhr? && req.format.html?
  end

  # Root route redirects to default landscape (handled by controller)
  root to: "application#show", as: :root
end
