EmailService::Engine.routes.draw do
  root 'application#index'
  get '/' => 'application#index', :as => :email_service
end
