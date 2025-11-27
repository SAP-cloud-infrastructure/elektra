module UrlHelper
  # prefixed to not interfere with ActionDispatch::Routing::UrlFor
  def sap_url_for(servicename)
    # special handling for global services
    region = servicename == "documentation" ? "global" : "#{current_region}"

    return "https://#{servicename}.#{region}.#{request.domain}/"
  end
end
