# frozen_string_literal: true

# rspec does not load sassc gem. I don't why, but this hack helps!
require File.join(Gem.loaded_specs["sassc"].full_gem_path, "lib/sassc")

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= "test"
require File.expand_path("../config/environment", __dir__)
require "rspec/rails"

require File.join(
          Gem.loaded_specs["monsoon-openstack-auth"].full_gem_path,
          "spec/support/authentication_stub",
        )

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
Dir[Rails.root.join("spec/support/**/*.rb")].each { |f| require f }

# Checks for pending migrations before tests are run.
# If you are not using ActiveRecord, you can remove this line.
ActiveRecord::Migration.maintain_test_schema!

# Define custom ordering strategy
module AuthFirstOrdering
  def self.order(examples)
    auth_examples = []
    other_examples = []
    
    examples.each do |example|
      file_path = example.metadata[:example_group][:file_path]
      if file_path.include?('plugins/monsoon-openstack-auth')
        auth_examples << example
      else
        other_examples << example
      end
    end
    
    puts "Auth plugin tests: #{auth_examples.length}, Other tests: #{other_examples.length}"
    
    # Return auth tests first, then others
    auth_examples + other_examples
  end
end


RSpec.configure do |config|
  config.full_backtrace = false

  # ## Mock Framework
  #
  # If you prefer to use mocha, flexmock or RR, uncomment the appropriate line:
  #
  # config.mock_with :mocha
  # config.mock_with :flexmock
  # config.mock_with :rr

  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # If true, the base class of anonymous controllers will be inferred
  # automatically. This will be the default behavior in future versions of
  # rspec-rails.
  config.infer_base_class_for_anonymous_controllers = true

  # Run specs in random order to surface order dependencies. If you find an
  # order dependency and want to debug it, you can fix the order by providing
  # the seed, which is printed after each run.
  #     --seed 1234

  # Custom order: Run monsoon-openstack-auth tests first to prevent authentication 
  # stub pollution. Other plugins (lbaas2, email) modify authentication_stub data,
  # but random order can cause auth tests to reset stubs mid-execution, leading 
  # to flaky tests and state pollution between plugins.
  config.register_ordering :auth_first do |examples|
    auth_tests, other_tests = examples.partition do |example|
      example.metadata[:example_group][:file_path].include?('plugins/monsoon-openstack-auth')
    end
    auth_tests.shuffle + other_tests.shuffle
  end

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explictly tag your specs with their type, e.g.:
  #
  #     describe UsersController, :type => :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://relishapp.com/rspec/rspec-rails/v/3-0/docs
  config.infer_spec_type_from_file_location!

  config.include FactoryBot::Syntax::Methods

  config.include AuthenticationStub

  config.before(:suite) { DatabaseCleaner.strategy = :truncation }

  config.before(:all) do
    DatabaseCleaner.start

    # set test config variables
    Rails.configuration.keystone_endpoint =
      "http://localhost:8183/v3/auth/tokens"
    Rails.configuration.default_region = "europe"
    Rails.configuration.service_user_id = "test"
    Rails.configuration.service_user_password = "test"
    Rails.configuration.service_user_domain_name = "test"
  end
  config.after(:all) { DatabaseCleaner.clean }

  config.before(:each) do
    stub_authentication

    # stub region detection
    region =
      (
        AuthenticationStub.test_token["catalog"].first["endpoints"].first[
          "region"
        ] ||
          AuthenticationStub.test_token["catalog"].first["endpoints"].first[
            "region_id"
          ]
      )
    allow(Core).to receive(:locate_region).and_return(region)

    # stub service user and cloud admin
    service_user =
      double(
        "service_user",
        id: "123",
        name: "service_user_name",
        email: "service_user_email",
        full_name: "service_user_fullname",
      ).as_null_object
    cloud_admin = double("cloud_admin").as_null_object

    # allow_any_instance_of(ServiceLayer::IdentityService)
    #   .to receive(:has_domain_access).and_return true
    # allow_any_instance_of(ServiceLayer::IdentityService)
    #   .to receive(:has_project_access).and_return true

    user_identity = double("user identity service").as_null_object
    allow_any_instance_of(::ApplicationController).to receive(
      :services,
    ).and_wrap_original do |m|
      services = m.call
      allow(services).to receive(:identity).and_return user_identity
      services
    end

    allow(user_identity).to receive(:has_domain_access).and_return true
    allow(user_identity).to receive(:has_project_access).and_return true

    allow_any_instance_of(::ApplicationController).to receive(
      :service_user,
    ).and_return(service_user)
    allow_any_instance_of(::ApplicationController).to receive(
      :cloud_admin,
    ).and_return(cloud_admin)

    # stub user_projects which is called in each request
    allow_any_instance_of(::DashboardController).to receive(
      :load_active_project,
    ).and_return([])

    # stub check_terms_of_use which is called in each request
    allow_any_instance_of(::DashboardController).to receive(
      :check_terms_of_use,
    ).and_return(true)
  end
end
