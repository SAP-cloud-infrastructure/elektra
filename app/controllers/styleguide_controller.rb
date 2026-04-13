# app/controllers/styleguide_controller.rb

class StyleguideController < ActionController::Base
  # Use ActionController::Base directly to bypass all authentication
  # from ApplicationController and DashboardController

  # Routes are only available in development/test (see routes.rb)
  # No additional auth needed here

  layout 'styleguide'

  def index
    # Overview page with links to all component pages
  end

  def buttons
    # All button variants
  end

  def forms
    # All form components and states
  end

  def modals
    # Modal examples
  end

  def tables
    # Table examples
  end

  def alerts
    # Alert/notification examples
  end

  def navigation
    # Navigation components (navbar, tabs, breadcrumbs)
  end

  def typography
    # Typography examples
  end

  def panels
    # Panel/Card examples
  end

  def grid
    # Grid system examples
  end
end
