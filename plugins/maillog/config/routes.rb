Maillog::Engine.routes.draw do
  root 'application#index'
  get '/' => 'application#index', :as => :maillog
  # POC to use maillog via service endpoint so we do not have cors problems - to be implemented
  #scope '/api' do
  #  get '/search' => 'api#search', :as => :search_maillog
  #end
end
