require_relative '../../config/initializers/domain_config'

test_config = {
  'domains' => [
    {
      'name' => 'any domain',
      'regex' => '.*',
      'floating_ip_networks' => [
        'FloatingIP-external-%DOMAIN_NAME%-07',
        'FloatingIP-external-%DOMAIN_NAME%-06',
        'FloatingIP-external-%DOMAIN_NAME%-05',
        'FloatingIP-external-%DOMAIN_NAME%-04',
        'FloatingIP-external-%DOMAIN_NAME%-03',
        'FloatingIP-external-%DOMAIN_NAME%-02',
        'FloatingIP-external-%DOMAIN_NAME%-01',
        'FloatingIP-external-%DOMAIN_NAME%',
        'Converged Cloud External'
      ],
      'dns_c_subdomain' => true,
      'check_cidr_range' => true,
      'terms_of_use_name' => 'actual_terms'
    },
    {
      'name' => 'inheritance',
      'regex' => '^inheritance-.*$',
      'disabled_plugins' => [
        'automation',
        'reports',
        'masterdata_cockpit',
        'webconsole',
        'dns_service',
        'email_service'
      ],
      'disabled_features' => [
        'documentation',
        'support',
        'domain_switcher',
        'internal_help_links',
        'terms_of_use',
        'networking_backup'
      ],
      'terms_of_use_name' => 'inheritance_terms',
      'floating_ip_networks' => ['FloatingIP-external-inheritance-01'],
      'dns_c_subdomain' => false,
      'check_cidr_range' => false,
      'federation' => true,
      'idp' => 'mario@foo.corp'
    },
    {
      'name' => 'inheritance-child',
      'regex' => '^inheritance-child.*$',
      'idp' => 'luigi@foo.corp'
    }
  ]
}

describe DomainConfig do
  # Mock Rails.logger to avoid dependency issues during testing
  before(:all) do
    unless defined?(Rails)
      stub_const('Rails', double('Rails'))
      allow(Rails).to receive(:logger).and_return(double('Logger', info: nil))
    end
  end

  it 'contains a class variable domain_config_file' do
    expect(DomainConfig.class_variable_get(:@@domain_config_file)).to be_a(Hash)
  end

  describe 'test config with inheritance' do
    before :each do
      DomainConfig.class_variable_set(:@@domain_config_file, test_config)
    end

    describe '#initialize' do
      it 'merges configs for regular domain (only matches "any domain")' do
        config = DomainConfig.new('regular-domain')
        domain_config = config.instance_variable_get(:@domain_config)
        
        expect(domain_config['dns_c_subdomain']).to be true # from any domain config
        expect(domain_config['check_cidr_range']).to be true #
        expect(domain_config['terms_of_use_name']).to eq('actual_terms') # from any domain config
        expect(domain_config['federation']).to be_nil # not set in any domain config
      end

      it 'merges configs for inheritance domain (matches "any domain" and "inheritance")' do
        config = DomainConfig.new('inheritance-domain')
        domain_config = config.instance_variable_get(:@domain_config)
        
        # Should have properties from both configs, with inheritance overriding any domain config
        expect(domain_config['dns_c_subdomain']).to be false # overridden by inheritance domain config
        expect(domain_config['check_cidr_range']).to be false # overridden by inheritance domain config
        expect(domain_config['terms_of_use_name']).to eq('inheritance_terms') # overridden by inheritance domain config
        expect(domain_config['federation']).to be true # from inheritance domain config
        expect(domain_config['idp']).to eq('mario@foo.corp') # from inheritance domain config
      end

      it 'merges configs for specific inheritance domain (matches all three)' do
        config = DomainConfig.new('inheritance-child-test')
        domain_config = config.instance_variable_get(:@domain_config)
        
        # Should have properties from all configs, with most specific overriding
        expect(domain_config['dns_c_subdomain']).to be false # from inheritance domain config
        expect(domain_config['federation']).to be true # from inheritance domain config
        expect(domain_config['idp']).to eq('luigi@foo.corp') # overridden by specific child config
        expect(domain_config['terms_of_use_name']).to eq('inheritance_terms') # from inheritance domain config
      end
    end

    describe '#plugin_hidden?' do
      it 'returns false for regular domain (no disabled plugins)' do
        config = DomainConfig.new('regular-domain')
        expect(config.plugin_hidden?('automation')).to be false # not set in any domain config
      end

      it 'returns true if the plugin is disabled in inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.plugin_hidden?('automation')).to be true # from inheritance domain config
        expect(config.plugin_hidden?('reports')).to be true # from inheritance domain config
        expect(config.plugin_hidden?('masterdata_cockpit')).to be true # from inheritance domain config
      end

      it 'returns false if the plugin is not disabled in inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.plugin_hidden?('some_other_plugin')).to be false # not set in inheritance domain config
      end

      it 'works with specific inheritance domain (inherits disabled plugins)' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.plugin_hidden?('automation')).to be true # from inheritance domain config
        expect(config.plugin_hidden?('reports')).to be true # from inheritance domain config
      end
    end

    describe '#floating_ip_networks' do
      it 'returns networks with domain substitution for regular domain' do
        config = DomainConfig.new('regular-domain')
        networks = config.floating_ip_networks
        
        expect(networks).to include('FloatingIP-external-regular-domain-07') # from any domain config
        expect(networks).to include('FloatingIP-external-regular-domain') # from any domain config
        expect(networks).to include('Converged Cloud External') # from any domain config
        expect(networks.length).to eq(9)
      end

      it 'returns inheritance-specific networks for inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        networks = config.floating_ip_networks
        
        # Should use inheritance config networks, not the general ones
        expect(networks).to eq(['FloatingIP-external-inheritance-01']) # from inheritance domain config
      end

      it 'replaces %DOMAIN_NAME% with the scoped domain name' do
        config = DomainConfig.new('test-domain')
        networks = config.floating_ip_networks
        
        expect(networks.first).to eq('FloatingIP-external-test-domain-07') # from any domain config
      end

      it 'inherits inheritance networks for specific inheritance domain' do
        config = DomainConfig.new('inheritance-child-test')
        networks = config.floating_ip_networks
        
        # Should inherit from inheritance config since specific config doesn't override
        expect(networks).to eq(['FloatingIP-external-inheritance-01'])# from inheritance domain config
      end
    end

    describe '#dns_c_subdomain?' do
      it 'returns true for regular domain (from any domain config)' do
        config = DomainConfig.new('regular-domain')
        expect(config.dns_c_subdomain?).to be true # from any domain config
      end

      it 'returns false for inheritance domain (overridden by inheritance config)' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.dns_c_subdomain?).to be false # from inheritance domain config
      end

      it 'returns false for specific inheritance domain (inherited from inheritance config)' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.dns_c_subdomain?).to be false # from inheritance domain config
      end
    end

    describe '#check_cidr_range?' do
      it 'returns true for regular domain (from any domain config)' do
        config = DomainConfig.new('regular-domain')
        expect(config.check_cidr_range?).to be true # from any domain config
      end

      it 'returns false for inheritance domain (overridden by inheritance config)' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.check_cidr_range?).to be false # from inheritance domain config
      end

      it 'returns false for specific inheritance domain (inherited from inheritance config)' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.check_cidr_range?).to be false # from inheritance domain config
      end
    end

    describe '#feature_hidden?' do
      it 'returns false for regular domain (no disabled features)' do
        config = DomainConfig.new('regular-domain')
        expect(config.feature_hidden?('documentation')).to be false # not set in any domain config
      end

      it 'returns true if the feature is disabled in inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.feature_hidden?('documentation')).to be true # from inheritance domain config
        expect(config.feature_hidden?('support')).to be true # from inheritance domain config
        expect(config.feature_hidden?('domain_switcher')).to be true # from inheritance domain config
      end

      it 'returns false if the feature is not disabled' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.feature_hidden?('some_other_feature')).to be false # not set in inheritance domain config
      end

      it 'inherits disabled features for specific inheritance domain' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.feature_hidden?('documentation')).to be true # from inheritance domain config
        expect(config.feature_hidden?('support')).to be true # from inheritance domain config
      end
    end

    describe '#federation?' do
      it 'returns false for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.federation?).to be false # not set in any domain config
      end

      it 'returns true for inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.federation?).to be true # from inheritance domain config
      end

      it 'inherits federation setting for specific inheritance domain' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.federation?).to be true # from inheritance domain config
      end
    end

    describe '#terms_of_use_name' do
      it 'returns actual_terms for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.terms_of_use_name).to eq('actual_terms') # from any domain config
      end

      it 'returns inheritance_terms for inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.terms_of_use_name).to eq('inheritance_terms') # from inheritance domain config
      end

      it 'inherits inheritance terms for specific inheritance domain' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.terms_of_use_name).to eq('inheritance_terms') # from inheritance domain config
      end
    end

    describe '#idp?' do
      it 'returns false for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.idp?).to be false
      end

      it 'returns inheritance idp for general inheritance domain' do
        config = DomainConfig.new('inheritance-domain')
        expect(config.idp?).to eq('mario@foo.corp') # from inheritance domain config
      end

      it 'returns overridden idp for specific inheritance domain' do
        config = DomainConfig.new('inheritance-child-test')
        expect(config.idp?).to eq('luigi@foo.corp') # from inheritance child config
      end
    end

    describe 'inheritance behavior' do
      it 'demonstrates complete inheritance chain' do
        config = DomainConfig.new('inheritance-child-test')
        
        # From "any domain" (base layer)
        expect(config.floating_ip_networks).not_to include('Converged Cloud External')
        
        # From "inheritance" (middle layer) - overrides base
        expect(config.federation?).to be true
        expect(config.dns_c_subdomain?).to be false
        expect(config.plugin_hidden?('automation')).to be true
        
        # From "inheritance-child" (top layer) - overrides middle
        expect(config.idp?).to eq('luigi@foo.corp')
      end

      it 'shows different inheritance for different domains' do
        regular_config = DomainConfig.new('some-regular-domain')
        inheritance_config = DomainConfig.new('inheritance-something')
        specific_config = DomainConfig.new('inheritance-child-something')
        
        # Regular domain - only inherits from "any domain"
        expect(regular_config.dns_c_subdomain?).to be true
        expect(regular_config.federation?).to be false
        
        # General inheritance domain - inherits from "any domain" + "inheritance"
        expect(inheritance_config.dns_c_subdomain?).to be false
        expect(inheritance_config.federation?).to be true
        expect(inheritance_config.idp?).to eq('mario@foo.corp')
        
        # Specific inheritance domain - inherits from all three
        expect(specific_config.dns_c_subdomain?).to be false
        expect(specific_config.federation?).to be true
        expect(specific_config.idp?).to eq('luigi@foo.corp')
      end
    end
  end
end