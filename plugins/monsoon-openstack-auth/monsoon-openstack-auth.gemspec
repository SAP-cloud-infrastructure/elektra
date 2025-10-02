$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "monsoon-openstack-auth"
  s.version     = "0.0.1"
  s.authors     = ["Andreas Pfau", "Torsten Lesmann"]
  s.email       = ["andreas.pfau@sap.com", "torsten.lesmann@sap.com"]
  s.homepage    = "https://github.com/sapcc/monsoon-openstack-auth"
  s.summary     = "Authenticate against Openstack Keystone."
  s.description = "This gem enables authentication for Ruby on Rails applications against Openstack Keystone Service using the Identity API v3."

  s.files = Dir["{app,config,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["spec/**/*"]

  s.add_dependency 'hashie'
  s.add_dependency 'uglifier', '>= 1.3.0'
  s.add_dependency 'rails'
  s.add_dependency 'excon'
end

