Maillog::Engine.routes.draw do
  root 'application#index'
  get '/' => 'application#index', :as => :maillog
end
