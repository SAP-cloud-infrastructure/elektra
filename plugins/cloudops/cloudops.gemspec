$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "cloudops"
  s.version = "0.0.1"
  s.authors = ["Andreas Pfau"]
  s.email = ["andreas.pfau@sap.com"]
  s.homepage = ""
  s.summary = " Summary of Cloudops."
  s.description = " Description of Cloudops."
  s.license = "Apache License 2.0"

  s.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
end
