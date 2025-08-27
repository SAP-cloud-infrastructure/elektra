Compute::Engine.routes.draw do
  resources :instances do
    member do
      get "console"
      get "console_log"
      get "update_item"
      get "new_size"
      get "tags"
      get "new_snapshot"
      get "new_status"
      get "attach_interface"
      put "detach_interface"
      put "reset_status"
      put "create_interface"
      get "remove_interface"
      put "resize"
      put "create_image"
      put "confirm_resize"
      put "revert_resize"
      put "stop"
      put "start"
      put "pause"
      put "suspend"
      put "resume"
      put "reboot"
      get "new_floatingip"
      put "attach_floatingip"
      get "remove_floatingip"
      put "detach_floatingip"
      get "edit_securitygroups"
      put "assign_securitygroups"
      put "lock"
      put "unlock"
      post "hard_reset"
      get "confirm_hard_reset"
      post "pre_hard_reset"
    end
  end

  resources :keypairs

  resources :host_aggregates

  resources :services, constraints: { id: %r{[^\/]+} } do
    member do
      put "enable"
      get "confirm-disable", to: "services#confirm_disable"
      put "disable"
    end
  end

  resources :hypervisors do
    resources :servers, module: :hypervisors, except: %i[edit update show]
  end

  resources :flavors, except: [:show] do
    resources :members, module: :flavors, except: %i[edit update show]
    resources :metadata,
              module: :flavors,
              except: %i[edit update show],
              param: :key
  end
end
