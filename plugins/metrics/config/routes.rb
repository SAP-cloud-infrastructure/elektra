Metrics::Engine.routes.draw do
  get "/" => "application#index", :as => :index

  # Attach the session token server-side so the Maia link contains no token.
  # Preserve asset extensions in the wildcard path.
  get "maia/*path" => "maia_proxy#forward", as: :maia_proxy, format: false
end
