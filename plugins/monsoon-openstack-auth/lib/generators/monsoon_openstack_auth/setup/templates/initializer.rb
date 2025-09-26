MonsoonOpenstackAuth.configure do |config|
  # connection driver, default MonsoonOpenstackAuth::Driver::Default (Fog)
  # config.connection_driver = DriverClass
  config.connection_driver.api_endpoint = ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']
  config.connection_driver.api_userid   = ENV['MONSOON_OPENSTACK_AUTH_API_USERID']
  config.connection_driver.api_password = ENV['MONSOON_OPENSTACK_AUTH_API_PASSWORD']
  config.connection_driver.ssl_verify_peer = false
  
  # config.connection_driver.ssl_ca_path  = PATH
  # config.connection_driver.ssl_ca_file = FILE
  
  # optional, default=true
  config.token_auth_allowed = true
  # optional, default=true
  config.basic_auth_allowed = true
  # optional, default=true
  config.sso_auth_allowed   = true
  # optional, default=true
  config.form_auth_allowed  = true
  
  # optional, default= last url before redirected to form
  #config.login_redirect_url = '/'
  
  # optional, default=false
  config.debug=true
end