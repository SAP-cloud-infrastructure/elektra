require 'net/http'
require 'uri'
require 'json'

class CoreApplicationMailer < ActionMailer::Base
  layout "mailer"

  def send_custom_email(recipient:, subject:, body_html:)
    # Get the token form the cloud_admin instance
    token = cloud_admin.instance_variable_get(:@api_client).token   

    uri = URI.parse(Rails.configuration.limes_mail_server_endpoint)
    uri.query = URI.encode_www_form({ from: 'elektra' })
   
    # Set up the body for the request
    body = {
      recipients: [recipient],
      subject: subject,
      mime_type: 'text/html',
      mail_text: body_html
    }.to_json

    # Set up headers
    headers = {
      'Content-Type' => 'application/json',
      'X-Auth-Token' =>  token
    }

    # Create http client  
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    # Create the HTTP request
    request = Net::HTTP::Post.new(uri, headers)
    request.body = body

    # Make the request and handle the response
    response = http.request(request)

    Rails.logger.info "Email API Response: #{response.code} - #{response.body}"
  end

  private

  def cloud_admin
    @cloud_admin ||=
      Core::ServiceLayer::ServicesManager.new(
        Core::ApiClientManager.cloud_admin_api_client,          
      )
  end

end
