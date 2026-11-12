ComputeNjq::Engine.routes.draw do
  root to: "application#show", as: :start

  # JSON BFF endpoints consumed by the React widget.
  namespace :api do
    resources :instances, only: %i[index show] do
      member do
        # Full instance detail (all legacy Show tabs), aggregated server-side.
        get :detail
        # vROps / Thanos sizing + guest-tools metrics, proxied server-side.
        get :metrics
      end
    end
  end

  # Catch-all: every non-API path renders the single React mount point so that
  # TanStack Router owns client-side routing.
  get "*path", to: "application#show", constraints: ->(req) { !req.xhr? && req.format.html? }
end
