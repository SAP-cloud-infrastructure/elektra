EmailService::Engine.routes.draw do
  root 'application#index'
  get '/' => 'application#index', :as => :email_service

  match 'cronus-proxy/*path' => 'cronus_proxy#forward', via: %i[get post patch put delete]
end
