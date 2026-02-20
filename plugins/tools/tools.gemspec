$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "tools"
  s.version = "0.0.1"
  s.authors = ["Andreas Pfau"]
  s.email = ["andreas.pfau@sap.com"]
  s.homepage = ""
  s.summary = "Tools Plugin."
  s.description =
    "This plugin implements tools like universal search using the react lib"
  s.license = "Apache License 2.0"

  s.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
end
