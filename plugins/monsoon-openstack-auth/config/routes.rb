MonsoonOpenstackAuth::Engine.routes.draw do
  resources :sessions, only: [:create]

  get 'sessions(/:domain_id)/new' => 'sessions#new', as: :new_session
  get 'login(/:domain_name)' => 'sessions#new', as: :login
  get 'logout', to: 'sessions#destroy'
  match 'consume-auth-token' => 'sessions#consume_auth_token',
        via: %i[get post],
        as: :consume_auth_token

  get 'passcode' => 'sessions#two_factor', as: :two_factor
  post 'passcode' => 'sessions#check_passcode', as: :check_passcode
end
