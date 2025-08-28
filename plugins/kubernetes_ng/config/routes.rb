KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root

  scope "/api" do
    resources :entries, only: %i[index create update destroy]
    resources :cloud_profiles, only: %i[index], path: "cloud-profiles"
  end

  get "/*path", to: "application#show", via: :all
end
