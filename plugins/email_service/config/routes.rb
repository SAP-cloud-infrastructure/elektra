EmailService::Engine.routes.draw do
  root 'maillog#index'
  get '/maillog' => 'maillog#index', :as => :maillog
end
