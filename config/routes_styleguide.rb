# config/routes.rb

Rails.application.routes.draw do
  # Existing routes...

  # Bootstrap Styleguide (only in development & test)
  # Used for visual regression testing without authentication
  if Rails.env.development? || Rails.env.test?
    namespace :styleguide do
      get '/', to: 'styleguide#index', as: :root
      get :buttons
      get :forms
      get :modals
      get :tables
      get :alerts
      get :navigation
      get :typography
      get :panels
      get :grid
    end
  end
end
