
module Maillog
  # Maillog ApplicationController
  class ApiController < ::DashboardController

    # POC to use maillog via service endpoint so we do not have cors problems - to be implemented
    #def search
    #  result = services.maillog.search(params)
    #  render json: result.body
    #end

  end
end