Smartops::Engine.routes.draw do
  root to: "application#show", as: :start


  namespace :api do
    resources :jobs, only: [:index, :show, :update]
  end

  get '*path', to: 'application#show'
end
