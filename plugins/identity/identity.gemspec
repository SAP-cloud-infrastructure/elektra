$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "identity"
  s.version = "0.0.1"
  s.authors = ["Andreas Pfau"]
  s.email = ["andreas.pfau@sap.com"]
  s.homepage = ""
  s.summary = "Identity"
  s.description = "Description of Identity."
  s.license = "MIT"

  s.files =
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
end
