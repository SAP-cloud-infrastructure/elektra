$:.push File.expand_path("lib", __dir__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |spec|
  spec.name = "email_service"
  spec.version = "0.0.1"
  spec.authors = ["Sirajudheen Mohamed Ali"]
  spec.email = ["sirajudheen.mohamed.ali@sap.com"]
  spec.homepage = ""
  spec.summary = "EmailService AWS SES Proxy"
  spec.description = "EmailService UI elektra plugin for Cronus"
  spec.license = "Apache License 2.0"

  spec.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata["allowed_push_host"] = " Set to 'http://mygemserver.com'"
  else
    raise "RubyGems 2.0 or newer is required to protect against " \
            "public gem pushes."
  end

  spec.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]

  spec.add_dependency "aws-sdk-ses"
  spec.add_dependency "aws-sdk-sesv2"
  spec.add_dependency 'aws-sdk-cloudwatch'
  spec.add_dependency "virtus"
end
