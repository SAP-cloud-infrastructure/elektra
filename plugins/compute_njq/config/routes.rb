ComputeNjq::Engine.routes.draw do
  root to: "application#show", as: :start

  # JSON BFF endpoints consumed by the React widget.
  namespace :api do
    resources :instances, only: %i[index show create]
    get "form_options/flavors", to: "form_options#flavors"
    get "form_options/images", to: "form_options#images"
    get "form_options/keypairs", to: "form_options#keypairs"
    get "form_options/networks", to: "form_options#networks"
    get "form_options/security_groups", to: "form_options#security_groups"
    get "form_options/availability_zones", to: "form_options#availability_zones"
  end

  # Catch-all: every non-API path renders the single React mount point so that
  # TanStack Router owns client-side routing.
  get "*path", to: "application#show", constraints: ->(req) { !req.xhr? && req.format.html? }
end
