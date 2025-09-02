KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root

  scope "/api" do
    resources :clusters, only: [:index, :show, :create, :destroy, :update], param: :name do
      collection do
        # for testing only, to access the functions from the browser, to be removed or comment out later
        get 'create', to: 'clusters#create'
        get 'destroy(/:name)', to: 'clusters#destroy'
      end
    end
    resources :cloud_profiles, only: [:index], path: "cloud-profiles"
    get 'permissions(/:resource(/:verb))', to: 'permissions#index'
  end

  get "/*path", to: "application#show", via: :all
end
