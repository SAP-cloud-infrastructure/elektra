KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root
  # API routes
  scope "/api" do
    resources :clusters, only: [:index, :show, :create, :destroy, :update], param: :name do
      collection do
        # for testing only, to access the functions from the browser, to be removed or comment out later
        # get 'create', to: 'clusters#create'
        # get 'destroy(/:name)', to: 'clusters#destroy'
        # get 'update(/:name)', to: 'clusters#update'
        get 'mark-and-delete(/:name)', to: 'clusters#mark_and_delete'
        delete 'mark-and-delete(/:name)', to: 'clusters#mark_and_delete'
        get 'mark-for-deletion(/:name)', to: 'clusters#mark_for_deletion'

      end
    end
    resources :cloud_profiles, only: [:index], path: "cloud-profiles"
    get 'permissions(/:resource(/:verb))', to: 'permissions#index'
  end
end
