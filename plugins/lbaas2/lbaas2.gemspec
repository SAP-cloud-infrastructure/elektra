$:.push File.expand_path("lib", __dir__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |spec|
  spec.name = "lbaas2"
  spec.version = "0.0.1"
  spec.authors = [" Write your name"]
  spec.email = [" Write your email address"]
  spec.homepage = ""
  spec.summary = " Summary of Lbaas2."
  spec.description = " Description of Lbaas2."
  spec.license = "Apache License 2.0"

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

  spec.add_dependency "rails"
end
