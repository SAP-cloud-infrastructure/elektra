source 'https://rubygems.org'

# https://bundler.io/v1.5/gemfile.html
# https://guides.rubygems.org/patterns/#semantic-versioning
# Note: check Dockerfile for Version dependencies!
#       Because we install gems with native extension before running bundle install
#       This avoids recompiling them everytime the Gemfile.lock changes.
#       The versions need to be kept in sync with the Gemfile.lock

# Avoid g++ dependency https://github.com/knu/ruby-domain_name/issues/3
# # unf is pulled in by the ruby-arc-client
gem 'unf', '>= 0.2.0beta2'

gem 'jsbundling-rails'
# https://rubygems.org/gems/rails/versions
gem 'rails', '7.1.6'
gem 'benchmark', require: false  # Ruby 3.4 compatibility
gem 'ostruct'
gem 'csv'

gem 'bootstrap-sass'
gem 'haml-rails'
gem 'redcarpet'
gem 'simple_form'
gem 'spinners'

gem 'filewatcher'
gem 'font-awesome-sass', '~>4'
gem 'friendly_id'
gem 'high_voltage'
gem 'kaminari'
gem 'simple-navigation' # Navigation menu builder
gem 'nokogiri', '>= 1.18.9'

gem 'responders'

# Database
gem 'activerecord-session_store'
gem 'pg', '1.3.4'

# Openstack
gem 'net-ssh'
# ed25519 support for ssh keys
gem 'bcrypt_pbkdf', '>= 1.0', '< 2.0'
gem 'ed25519', '>= 1.2', '< 2.0'
gem 'netaddr', '2.0.4'

gem 'ruby-radius'

# Extras
gem 'config', '~> 2.2.1'

# Prometheus instrumentation
gem 'prometheus-client'

# Sentry client
gem 'httpclient' # The only faraday backend that handled no_proxy :|
gem 'sentry-raven'
gem 'faraday-httpclient', '~> 2.0'

# See https://github.com/sstephenson/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
# gem 'jbuilder', '~> 2.0'
# bundle exec rake doc:rails generates the API under doc/api.
gem 'sdoc', '~> 2.6.0', group: :doc

# if you update puma check Dockerfile for Version dependencies!
# gem 'puma', '= 4.3.9', require: false
gem 'puma', '6.4.3'
###################### PLUGINS #####################

# backlist plugins (global)
black_list = [''] # e.g. ['compute']
if ENV.key?('BLACK_LIST_PLUGINS')
  ENV['BLACK_LIST_PLUGINS'].split(',').each { |plugin_name| black_list << plugin_name.strip }
end

# load all plugins except blacklisted plugins
Dir.glob('plugins/*').each do |plugin_path|
  gemspec path: plugin_path unless black_list.include?(plugin_path.gsub('plugins/', ''))
end

# maillog
gem 'aws-sdk-cloudwatch'
gem 'aws-sdk-ses'
gem 'aws-sdk-sesv2'
######################## END #######################

group :api_client do
  gem 'elektron', git: 'https://github.com/sapcc/elektron', tag: 'v2.2.5'
  # gem 'elektron', path: '../elektron'
end

# Avoid double log lines in development
# See: https://github.com/heroku/rails_stdout_logging/issues/1
group :production do
  # We are not using the railtie because it comes to late,
  # we are setting the logger in production.rb
  gem 'rails_stdout_logging', require: 'rails_stdout_logging/rails'
end

group :development, :production do
  # Views and Assets
  gem 'sass-rails'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console'
  # this version is the last version that works with mitmproxy
  # if you use the versions above you will get "Excon::Error::ProxyConnectionError" if you use http_proxy env with Excon
  gem 'excon', '0.112.0'
end

group :development, :test do
  gem 'dotenv-rails'

  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug'

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'

  gem 'foreman', '~> 0.87.0'

  # Testing

  # gem 'factory_girl_rails', '~> 4.0'
  gem 'database_cleaner'
  gem 'factory_bot_rails'

  gem 'listen'
  gem 'prettier'
  gem 'pry-rails'
end

group :test do
  gem 'rails-controller-testing'
end


gem "rspec-rails", "~> 7.1"
