# frozen_string_literal: true

# This class generates the skeleton of a dashboard plugin.
class PluginSkeletonGenerator
  extend Forwardable
  def_delegators :@context,
                 :options,
                 :copy_file,
                 :remove_file,
                 :gsub_file,
                 :create_file,
                 :generate,
                 :name
  attr_reader :plugin_path

  def initialize(context, plugin_path)
    @context = context
    @plugin_path = plugin_path
  end

  def run
    plugin_options =
      "--skip-gemfile --skip-bundle --skip-git --skip-test --skip-puma --skip-javascript --skip-gemfile-entry"
    plugin_options += " --mountable" if options.mountable?
    plugin_options += " --full" if options.service_layer? && !options.mountable?

    generate(:plugin, "#{plugin_path}/#{name}", plugin_options)

    replace_test_with_spec
    update_dependencies_to_gemspec
    add_controller_spec
    add_policy

    create_service_layer_service if options.service_layer?

    update_license_in_readme
  end

  def add_policy
    copy_file "shared/config/policy.json",
              "#{plugin_path}/#{name}/config/policy.json"
  end

  def create_service_layer_service
    copy_file "shared/app/services/service_layer/service.rb",
              "#{plugin_path}/#{name}/app/services/service_layer/#{name}_service.rb"
  end

  def update_dependencies_to_gemspec
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              %r{require_relative "lib/.+/version"},
              "$:.push File.expand_path(\"../lib\", __FILE__)"

    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.version[^\n]*/,
              "spec.version     = \"0.0.1\""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.authors[^\n]*/,
              "spec.authors     = [\"Elektra UI team\"]"
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.description[^\n]*/,
              ""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.summary[^\n]*/,
              'spec.summary     = "An Elektra plugin"'

    # remove unnecessary infos
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.metadata[^\n]*/,
              ""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec.homepage[^\n]*/,
              ""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec", /spec.email[^\n]*/, ""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec", /#[^\n]*/, ""
    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec", /(\s*\n)+/, "\n"

    gsub_file "#{plugin_path}/#{name}/#{name}.gemspec",
              /spec\.add_dependency "rails[^\n]*\n/,
              ""
  end

  def replace_test_with_spec
    create_file "#{plugin_path}/#{name}/spec/.keep"
  end

  def update_license_in_readme
    # Update the license reference in README.md
    readme_path = "#{plugin_path}/#{name}/README.md"
    gsub_file readme_path, 
      "The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).",
      "The gem is available as open source under the terms of the [Apache License 2.0](https://opensource.org/licenses/Apache-2.0)."
  end

  def add_controller_spec
    copy_file "shared/spec/controllers/application_controller_spec.rb",
              "#{plugin_path}/#{name}/spec/controllers/application_controller_spec.rb"
  end
end
