Networking::Engine.routes.draw do
  root to: 'networks#index'
  resources :floating_ips

  resources :security_groups, except:[:edit,:update] do
    resources :rules, module: :security_groups
  end

  resources :routers do
    get 'topology'
    get 'node_details'
  end

  resources :network_wizard, only: [:new,:create]

  namespace :cloud_admin do
    resources :network_usage_stats, only: [:index]
  end

  namespace :networks do
    %i(external private).each do |type|
      resources type do
        resources :access
      end
    end
  end

  get "networks/:network_id/subnets" => 'networks#subnets', as: :network_subnets
end
