# frozen_string_literal: true

Rails.application.routes.draw do
  mount MonsoonOpenstackAuth::Engine => '/:domain_fid/auth'

  scope '/system' do
    # check without db connection
    get :liveliness, to: 'health#liveliness'
    # check with db connection
    get :readiness, to: 'health#readiness'
  end

  # mount Cloudops::Engine => '/ccadmin/cloud_admin/cloudops', as: 'cloudops'
  get '/cloudops', to: redirect(
    "/#{Rails.application.config.cloud_admin_domain}/" \
    "#{Rails.configuration.cloud_admin_project}/cloudops"
  )

  scope '/:domain_id(/:project_id)(/:plugin)' do
    resources :cache, only: %i[index show] do
      collection do
        get 'types'
        get 'users'
        get 'domain_projects'
        get 'projects'
        get 'start_live_search'
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
        next if ['docs','cloudops'].include?(plugin.name)
        Logger.new(STDOUT).debug(
          "Mount plugin #{plugin.mount_point} as #{plugin.name}_plugin"
        )
        # mount point is the name of the plugin
        mount plugin.engine_class => "/#{plugin.mount_point}",
              as: "#{plugin.name}_plugin"
      end
      ######################## END ############################
    end

    mount Cloudops::Engine => "/#{Rails.configuration.cloud_admin_project}" \
                              "/cloudops", as: 'cloudops_plugin', defaults: { project_id: Rails.configuration.cloud_admin_project },
                              constraints: { domain_id: Rails.application.config.cloud_admin_domain }
  end

  scope module: 'identity' do
    get '/:domain_id/home' => 'domains#show', as: :domain_home
    get '/:domain_id/:project_id/home' => 'projects#show', as: :project_home
  end

  # route for overwritten High Voltage Pages controller
  get '/pages/*id' => 'pages#show', as: :core_page, format: false

  # root to: 'pages#show', id: 'landing'

  root(to: redirect do |_params, request|
    domain_id = request.query_parameters['domain_id']
    "/#{domain_id || Rails.application.config.default_domain}"
  end)

  # route all other urls to 404 page ignoring all formats except html
  get '*path', to: 'errors#error_404', via: :all,
               constraints: ->(req) { req.format == :html }
end
