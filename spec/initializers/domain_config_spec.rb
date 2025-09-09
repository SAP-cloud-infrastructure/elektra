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
      'name' => 'marioworld',
      'regex' => '^marioworld-.*$',
      'disabled_plugins' => [
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
      'terms_of_use_name' => 'marioworld_terms',
      'floating_ip_networks' => ['FloatingIP-external-marioworld-01'],
      'dns_c_subdomain' => false,
      'check_cidr_range' => false,
      'federation' => true,
      'idp' => 'https://mario.world.corp'
    },
    {
      'name' => 'marioworld-and-luigi',
      'regex' => '^marioworld-and-luigi.*$',
      'idp' => 'https://marioworld-and-luigi.world.corp'
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

  describe 'test config with marioworld' do
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

      it 'merges configs for marioworld domain (matches "any domain" and "marioworld")' do
        config = DomainConfig.new('marioworld-domain')
        domain_config = config.instance_variable_get(:@domain_config)
        
        # Should have properties from both configs, with marioworld overriding any domain config
        expect(domain_config['dns_c_subdomain']).to be false # overridden by marioworld domain config
        expect(domain_config['check_cidr_range']).to be false # overridden by marioworld domain config
        expect(domain_config['terms_of_use_name']).to eq('marioworld_terms') # overridden by marioworld domain config
        expect(domain_config['federation']).to be true # from marioworld domain config
        expect(domain_config['idp']).to eq('https://mario.world.corp') # from marioworld domain config
      end

      it 'merges configs for specific marioworld domain (matches all three)' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        domain_config = config.instance_variable_get(:@domain_config)
        
        # Should have properties from all configs, with most specific overriding
        expect(domain_config['dns_c_subdomain']).to be false # from marioworld domain config
        expect(domain_config['federation']).to be true # from marioworld domain config
        expect(domain_config['idp']).to eq('https://marioworld-and-luigi.world.corp') # overridden by specific child config
        expect(domain_config['terms_of_use_name']).to eq('marioworld_terms') # from marioworld domain config
      end
    end

    describe '#plugin_hidden?' do
      it 'returns false for regular domain (no disabled plugins)' do
        config = DomainConfig.new('regular-domain')
        expect(config.plugin_hidden?('reports')).to be false # not set in any domain config
      end

      it 'returns true if the plugin is disabled in marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.plugin_hidden?('reports')).to be true # from marioworld domain config
        expect(config.plugin_hidden?('masterdata_cockpit')).to be true # from marioworld domain config
      end

      it 'returns false if the plugin is not disabled in marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.plugin_hidden?('some_other_plugin')).to be false # not set in marioworld domain config
      end

      it 'works with specific marioworld domain (inherits disabled plugins)' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.plugin_hidden?('reports')).to be true # from marioworld domain config
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

      it 'returns marioworld-specific networks for marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        networks = config.floating_ip_networks
        
        # Should use marioworld config networks, not the general ones
        expect(networks).to eq(['FloatingIP-external-marioworld-01']) # from marioworld domain config
      end

      it 'replaces %DOMAIN_NAME% with the scoped domain name' do
        config = DomainConfig.new('test-domain')
        networks = config.floating_ip_networks
        
        expect(networks.first).to eq('FloatingIP-external-test-domain-07') # from any domain config
      end

      it 'inherits marioworld networks for specific marioworld domain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        networks = config.floating_ip_networks
        
        # Should inherit from marioworld config since specific config doesn't override
        expect(networks).to eq(['FloatingIP-external-marioworld-01'])# from marioworld domain config
      end
    end

    describe '#dns_c_subdomain?' do
      it 'returns true for regular domain (from any domain config)' do
        config = DomainConfig.new('regular-domain')
        expect(config.dns_c_subdomain?).to be true # from any domain config
      end

      it 'returns false for marioworld domain (overridden by marioworld config)' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.dns_c_subdomain?).to be false # from marioworld domain config
      end

      it 'returns false for specific marioworld domain (inherited from marioworld config)' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.dns_c_subdomain?).to be false # from marioworld domain config
      end
    end

    describe '#check_cidr_range?' do
      it 'returns true for regular domain (from any domain config)' do
        config = DomainConfig.new('regular-domain')
        expect(config.check_cidr_range?).to be true # from any domain config
      end

      it 'returns false for marioworld domain (overridden by marioworld config)' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.check_cidr_range?).to be false # from marioworld domain config
      end

      it 'returns false for specific marioworld domain (inherited from marioworld config)' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.check_cidr_range?).to be false # from marioworld domain config
      end
    end

    describe '#feature_hidden?' do
      it 'returns false for regular domain (no disabled features)' do
        config = DomainConfig.new('regular-domain')
        expect(config.feature_hidden?('documentation')).to be false # not set in any domain config
      end

      it 'returns true if the feature is disabled in marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.feature_hidden?('documentation')).to be true # from marioworld domain config
        expect(config.feature_hidden?('support')).to be true # from marioworld domain config
        expect(config.feature_hidden?('domain_switcher')).to be true # from marioworld domain config
      end

      it 'returns false if the feature is not disabled' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.feature_hidden?('some_other_feature')).to be false # not set in marioworld domain config
      end

      it 'inherits disabled features for specific marioworld domain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.feature_hidden?('documentation')).to be true # from marioworld domain config
        expect(config.feature_hidden?('support')).to be true # from marioworld domain config
      end
    end

    describe '#federation?' do
      it 'returns false for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.federation?).to be false # not set in any domain config
      end

      it 'returns true for marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.federation?).to be true # from marioworld domain config
      end

      it 'inherits federation setting for specific marioworld domain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.federation?).to be true # from marioworld domain config
      end
    end

    describe '#terms_of_use_name' do
      it 'returns actual_terms for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.terms_of_use_name).to eq('actual_terms') # from any domain config
      end

      it 'returns marioworld_terms for marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.terms_of_use_name).to eq('marioworld_terms') # from marioworld domain config
      end

      it 'inherits marioworld terms for specific marioworld domain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.terms_of_use_name).to eq('marioworld_terms') # from marioworld domain config
      end
    end

    describe '#idp?' do
      it 'returns false for regular domain' do
        config = DomainConfig.new('regular-domain')
        expect(config.idp?).to be false
      end

      it 'returns marioworld idp for general marioworld domain' do
        config = DomainConfig.new('marioworld-domain')
        expect(config.idp?).to eq(URI.encode_www_form_component('https://mario.world.corp')) # from marioworld domain config
      end

      it 'returns overridden idp for specific marioworld domain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        expect(config.idp?).to eq(URI.encode_www_form_component('https://marioworld-and-luigi.world.corp')) # from marioworld child config
      end
    end

    describe 'marioworld behavior' do
      it 'demonstrates complete marioworld chain' do
        config = DomainConfig.new('marioworld-and-luigi-test')
        
        # From "any domain" (base layer)
        expect(config.floating_ip_networks).not_to include('Converged Cloud External')
        
        # From "marioworld" (middle layer) - overrides base
        expect(config.federation?).to be true
        expect(config.dns_c_subdomain?).to be false
        expect(config.plugin_hidden?('reports')).to be true
        
        # From "marioworld-and-luigi" (top layer) - overrides middle
        expect(config.idp?).to eq(URI.encode_www_form_component('https://marioworld-and-luigi.world.corp'))
      end

      it 'shows different marioworld for different domains' do
        regular_config = DomainConfig.new('some-regular-domain')
        marioworld_config = DomainConfig.new('marioworld-something')
        specific_config = DomainConfig.new('marioworld-and-luigi-something')
        
        # Regular domain - only inherits from "any domain"
        expect(regular_config.dns_c_subdomain?).to be true
        expect(regular_config.federation?).to be false
        
        # General marioworld domain - inherits from "any domain" + "marioworld"
        expect(marioworld_config.dns_c_subdomain?).to be false
        expect(marioworld_config.federation?).to be true
        expect(marioworld_config.idp?).to eq(URI.encode_www_form_component('https://mario.world.corp'))

        # Specific marioworld (marioworld-and-luigi) domain - inherits from all three
        expect(specific_config.dns_c_subdomain?).to be false
        expect(specific_config.federation?).to be true
        expect(specific_config.idp?).to eq(URI.encode_www_form_component('https://marioworld-and-luigi.world.corp'))
      end
    end
  end
end