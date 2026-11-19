ComputeNjq::Engine.routes.draw do
  root to: "application#show", as: :start

  # JSON BFF endpoints consumed by the React widget.
  namespace :api do
    resources :instances, only: %i[index show create update destroy] do
      member do
        # Full instance detail (all legacy Show tabs), aggregated server-side.
        get :detail
        # vROps / Thanos sizing + guest-tools metrics, proxied server-side.
        get :metrics
        # Generic lifecycle action: body { action_name: "start"|"stop"|... }.
        post :action
        # Edit Tags: replace the full tag set, body { tags: [...] }.
        put :tags, action: :set_tags
        # Admin recovery: force vm_state, body { state: "active"|"error" }.
        post :reset_status
        # Resize: change the server's flavor, body { flavor_id: "..." }.
        put :resize
        # Snapshot: create a Glance image of the server, body { snapshot: { name } }.
        post :snapshot
      end
    end
    get "form_options/flavors", to: "form_options#flavors"
    get "form_options/images", to: "form_options#images"
    get "form_options/keypairs", to: "form_options#keypairs"
    get "form_options/networks", to: "form_options#networks"
    get "form_options/subnets", to: "form_options#subnets"
    get "form_options/security_groups", to: "form_options#security_groups"
    get "form_options/availability_zones", to: "form_options#availability_zones"
    get "form_options/volume_types", to: "form_options#volume_types"
    # Image status reads (snapshot polling), kept generic/reusable.
    resources :images, only: %i[show]
  end

  # Catch-all: every non-API path renders the single React mount point so that
  # TanStack Router owns client-side routing.
  get "*path", to: "application#show", constraints: ->(req) { !req.xhr? && req.format.html? }
end
