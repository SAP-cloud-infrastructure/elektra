MonsoonOpenstackAuth::Engine.routes.draw do
  resources :sessions, only: [:create]

  get 'sessions(/:domain_id)/new' => 'sessions#new', as: :new_session
  get 'login(/:domain_name)' => 'sessions#new', as: :login
  get 'logout', to: 'sessions#destroy'

  get 'passcode' => 'sessions#two_factor', as: :two_factor
  post 'passcode' => 'sessions#check_passcode', as: :check_passcode

  get 'password_sync' => 'password_sync#new', as: :password_sync
  post 'password_sync' => 'password_sync#create', as: :create_password_sync
end
