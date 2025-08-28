KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root

  scope "/api" do
    get "cloud-profiles", to: "api#list_cloud_profiles"
    get "clusters", to: "api#list_clusters"
  end

  get "/*path", to: "application#show", via: :all
end
