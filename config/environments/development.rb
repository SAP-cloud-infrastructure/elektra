require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # if the dev enviornemnt not running localy this config is needed e.g. workspaces 
  config.hosts << /.*\.cloud\.sap/

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true

    config.cache_store = :memory_store
    config.public_file_server.headers = {
      "Cache-Control" => "public, max-age=#{2.days.to_i}"
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # web_console is only working when you accessing from localhost
  # if you running the development server on a remote machine use TRUSTED_IP
  # for that take a look to the .env.bak and set the variable or run "TRUSTED_IP=192.168.1.1 forman start"
  if ENV['TRUSTED_IP']
    # use web_console not only on localhost
    config.web_console.whitelisted_ips = ENV['TRUSTED_IP']
    puts "=> Trusted IP #{ENV['TRUSTED_IP']}"
  end

  # Mailer configuration for inquiries/requests
  config.action_mailer.perform_deliveries = false

  puts "=> Region: #{ENV['MONSOON_DASHBOARD_REGION']}" if ENV['MONSOON_DASHBOARD_REGION']
  puts "=> Auth Endpoint #{ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']}" if ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']

  # reduce active record logging
  config.after_initialize do
    if ENV['ACTIVE_RECORD_QUIET']
      ActiveRecord::Base.logger = Rails.logger.clone
      ActiveRecord::Base.logger.level = Logger::INFO
      puts "=> ActiveRecord Logging: QUIET"
    end
  end

  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  puts "=> Elektron Logging: QUIET" if ENV['ELEKTRON_QUIET']

  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true

  
  # Uncomment this line when testing email service
  # When generating URLs (like admin_inquiries_url) from a background job or a mailer, you need to tell Rails what host to use from rails c.
  # config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
end
