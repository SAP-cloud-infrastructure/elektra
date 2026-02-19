module ServiceLayer
  class MaillogService < Core::ServiceLayer::Service

    def available?(_action_name_sym = nil)
      elektron.service?("nebula")
    end


    # this for POC only to use maillog with elektron
    # but at the moment there is no proper maillog service endpoint in openstack catalog
    # elektron can only work with existing service endpoints
    #def search(params = {})
    #  # use rails https request to nebula maillog search endpoint
    #  uri = URI.parse('https://maillog.eu-de-1.cloud.sap/v1/mails/search')
    #  request = Net::HTTP::Get.new(uri)
    #  http = Net::HTTP.new(uri.host, uri.port)
    #  http.use_ssl = true
    #  http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    #  response = http.request(request)
    #  puts response.body
    #  #elektron.service("nebula").get(
    #  #  "/mails/search",
    #  #  params
    #  #)
    #end

  end
end