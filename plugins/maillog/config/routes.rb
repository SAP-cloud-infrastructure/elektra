Maillog::Engine.routes.draw do
  root 'maillog#index'
  get '/' => 'maillog#index', :as => :maillog
end
