require 'yaml'

# there are unit tests for this file. Have a look at elektra/spec/initializers/domain_config_spec.rb

class DomainConfig
  # the order of the domains is important, the last matching domain will be used
  # we use a class variable to load the config only once
  # and make it possible to override the config in the tests

  # load the domain config from a yaml file and initialize the class
  # use support/domain_config_dev.yaml as fallback for local development

  # check if file exists
  if File.exist?("#{File.dirname(__FILE__)}/../support/domain_config.local.yaml")
    @@domain_config_file = YAML.load_file("#{File.dirname(__FILE__)}/../support/domain_config.local.yaml") || {}
  elsif File.exist?("#{File.dirname(__FILE__)}/../support/domain_config.yaml")
    @@domain_config_file = YAML.load_file("#{File.dirname(__FILE__)}/../support/domain_config.yaml") || {}
  else
    raise 'DomainConfig: No domain config file found'
  end

  def initialize(scoped_domain_name)
    update_domain(scoped_domain_name)
  end

  def update_domain(scoped_domain_name)
    @scoped_domain_name = scoped_domain_name
    # initialize the domain config using the find_config method
    @domain_config = find_config(@@domain_config_file, scoped_domain_name)
  end

  # returns true or false if plugin with name is hidden
  # this method allows to hide plugins for specific domains
  # it is used for building the services menu (config/navigation/*)
  def plugin_hidden?(name)
    @domain_config.fetch('disabled_plugins', []).include?(name.to_s)
  end

  def feature_hidden?(name)
    @domain_config.fetch('disabled_features', []).include?(name.to_s)
  end

  def federation?
    @domain_config.fetch('federation', false)
  end

  def terms_of_use_name
    @domain_config.fetch("terms_of_use_name", "actual_terms")
  end

  def floating_ip_networks
    # fetch floating_ip_networks from config
    # and replace #{domain_name} in each network name with the scoped domain name
    @domain_config.fetch('floating_ip_networks', []).map do |network_name|
      network_name.gsub('%DOMAIN_NAME%', @scoped_domain_name)
    end
  end

  def dns_c_subdomain?
    @domain_config.fetch('dns_c_subdomain', false)
  end

  def check_cidr_range?
    @domain_config.fetch('check_cidr_range', true)
  end

  def idp?
    @domain_config.fetch('idp', false)
  end

  private

  def find_config(domains_config, scoped_domain_name)
    # to allow to match the last matching domain config, we reverse the list
    # it allows us to define a config matching all domains at the top and then
    # override it with a more specific config.
    domains_config.fetch('domains', []).reverse.find do |domain_config|
      regex_pattern = Regexp.new(domain_config.fetch('regex', ''))
      scoped_domain_name =~ regex_pattern
    end || {}
  end
end
