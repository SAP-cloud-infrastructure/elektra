KubernetesNg::Engine.routes.draw do
  root to: "application#show", as: :root
  # API routes
  scope "/api" do
    resources :clusters, only: [:index, :show, :create, :destroy, :update], param: :name do
      collection do
        patch 'confirm-deletion(/:name)', to: 'clusters#confirm_for_deletion'
        delete 'confirm-deletion-and-destroy(/:name)', to: 'clusters#confirm_deletion_and_destroy'
        # for testing only, to access the functions from the browser, to be removed or comment out later
        # get 'create(/:name)', to: 'clusters#create'
        # get 'destroy(/:name)', to: 'clusters#destroy'
        # get 'update(/:name)', to: 'clusters#update'
        # get 'confirm-deletion-and-destroy(/:name)', to: 'clusters#confirm_deletion_and_destroy'
        # get 'confirm-deletion(/:name)', to: 'clusters#confirm_deletion'

      end
    end
    resources :cloud_profiles, only: [:index], path: "cloud-profiles"
    get 'permissions(/:resource(/:verb))', to: 'permissions#index'
  end
end
