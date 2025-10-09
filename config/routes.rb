# frozen_string_literal: true

Rails.application.routes.draw do
  scope '/v2/:domain_id' do 
    scope module: 'v2' do 
      get "/login", to: 'session#login'
      post "/create", to: 'session#create'
    end
  end

  scope '/v2/:domain_id(/:project_id)(/:plugin)' do 
    scope module: 'v2' do 
      get '/', to: 'debug#index'
    end
  end


  post '/verify-auth-token', to: 'auth_token#verify'

  mount MonsoonOpenstackAuth::Engine => '/:domain_fid/auth'

  get '/error-404', to: 'errors#error_404'

  # "jump to" routes
  # if project_id is known then the domain name or id is unnecessary
  # the jump controller will try to redirect to the requested url
  get '/_/:project_id(/*rest)', to: 'jump#index'
  # jump to a specific object like instance or network
  get '/_jump_to/:object_id', to: 'jump#show'

  # https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  scope '/system' do
    # The kubelet uses liveness probes to know when to restart a container. For example,
    # liveness probes could catch a deadlock, where an application is running, but unable
    # to make progress.
    # check without db connection
    get :liveliness, to: 'health#liveliness'
    # The kubelet uses readiness probes to know when a container is ready to start accepting traffic.
    # A Pod is considered ready when all of its containers are ready.
    # check with db connection
    get :readiness, to: 'health#readiness'
    # The kubelet uses startup probes to know when a container application has started. If such a
    # probe is configured, it disables liveness and readiness checks until it succeeds, making sure
    # those probes don't interfere with the application startup.
    # check with db connection and js
    get :startprobe, to: 'health#startprobe'

    get :notifications, to: 'global_notifications#index'
  end

  # mount Cloudops::Engine => '/ccadmin/cloud_admin/cloudops', as: 'cloudops'
  get '/cloudops',
      to:
        redirect(
          "/#{Rails.application.config.cloud_admin_domain}/" \
            "#{Rails.configuration.cloud_admin_project}/cloudops"
        )

  scope '/:domain_id(/:project_id)(/:plugin)' do
    get 'os-api/__auth_token', to: 'os_api#auth_token'
    get 'os-api/__token', to: 'os_api#token'
    match 'os-api(/*path)', to: 'os_api#reverse_proxy', via: :all

    resources :cache, only: %i[index show] do
      collection do
        get 'csv'
        get 'types'
        get 'users'
        get 'groups'
        get 'domain_projects'
        get 'projects'
        get 'live_search'
        get 'related-objects' => 'cache#related_objects'
        post 'objects' => 'cache#cache_objects'
        get 'objects-by-ids' => 'cache#objects_by_ids'
      end
    end
  end

  scope '/:domain_id' do
    match '/', to: 'pages#show', id: 'landing', via: :get, as: :landing_page

    scope '(/:project_id)' do
      scope module: 'dashboard' do
        post 'accept_terms_of_use'
        get 'terms_of_use'
      end

      ###################### MOUNT PLUGINS #####################
      Core::PluginsManager.mountable_plugins.each do |plugin|
        next if %w[docs cloudops tools].include?(plugin.name)

        Logger.new(STDOUT).debug(
          "Mount plugin #{plugin.mount_point} as #{plugin.name}_plugin"
        )
        # mount point is the name of the plugin
        mount plugin.engine_class => "/#{plugin.mount_point}",
              :as => "#{plugin.name}_plugin"
      end
      ######################## END ############################
      Logger.new(STDOUT).debug('Mount plugin tools as cc_tools_plugin')
      mount Tools::Engine => '/cc-tools', :as => :cc_tools_plugin
    end

    Logger.new(STDOUT).debug('Mount plugin cloudops as cloudops_plugin')
    mount Cloudops::Engine =>
            "/#{Rails.configuration.cloud_admin_project}" \
              '/cloudops',
          :as => 'cloudops_plugin',
          :defaults => {
            project_id: Rails.configuration.cloud_admin_project
          },
          :constraints => {
            domain_id: Rails.application.config.cloud_admin_domain
          }
  end

  scope module: 'identity' do
    get '/:domain_id/home' => 'domains#show', :as => :domain_home
    get '/:domain_id/:project_id/home' => 'projects#show', :as => :project_home
  end

  # in case someone tries to call a project url without the trailing '/home'
  get '/:domain_id/:project_id', to: redirect('/%{domain_id}/%{project_id}/home')
  
  # route for overwritten High Voltage Pages controller
  get '/pages/*id' => 'pages#show', :as => :core_page, :format => false

  # root to: 'pages#show', id: 'landing'

  root(
    to:
      redirect do |_params, request|
        domain_id = request.query_parameters['domain_id']
        "/#{domain_id || Rails.application.config.default_domain}"
      end
  )

  # route all other urls to 404 page ignoring all formats except html
  get '*path',
      to: 'errors#error_404',
      via: :all,
      constraints: ->(req) { req.format == :html }
end
