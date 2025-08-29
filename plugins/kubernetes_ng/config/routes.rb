KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root

  scope "/api" do
    resources :clusters, only: [:index, :show], param: :name
    resources :cloud_profiles, only: [:index], path: "cloud-profiles"
  end

  get "/*path", to: "application#show", via: :all
end
