$:.push File.expand_path("lib", __dir__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |spec|
  spec.name = "maillog"
  spec.version = "0.0.1"
  spec.authors     = ["Elektra UI team"]
  spec.summary     = "An Elektra plugin"
  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end
end
