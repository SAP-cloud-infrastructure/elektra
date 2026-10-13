class PagesController < ActionController::Base
  include HighVoltage::StaticPage

  layout :layout_for_page

  helper_method :current_region, :current_domain, :domain_config

  private

  def current_region
    ENV["MONSOON_DASHBOARD_REGION"] || "eu-de-1"
  end

  def current_domain
    params[:domain_id]
  end

  def domain_config    # the presence of this variable is tested in spec/controllers/scope_controller_spec.rb
    @domain_config ||= DomainConfig.new(current_domain)
  end

  def layout_for_page
    case params[:id]
    when "landing"
      "juno-fullscreen"
    else
      "noscope"
    end
  end
end
