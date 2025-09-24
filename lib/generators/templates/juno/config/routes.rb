%{PLUGIN_NAME_CAMELIZE}::Engine.routes.draw do
  root to: "application#show", as: :root

  scope "/%{PLUGIN_NAME}-api" do
    resources :entries, only: %i[index create update destroy]
  end

  get "/*path", to: "application#show", via: :all
end
