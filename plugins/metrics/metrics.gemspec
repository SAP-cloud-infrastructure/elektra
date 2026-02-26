$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "metrics"
  s.version = "0.0.1"
  s.authors = ["Hans-Georg Winkler"]
  s.email = ["hans-georg.winkler@sap.com"]
  s.homepage = ""
  s.summary = "accessing metrics and alarms"
  s.description = "accessing metrics and alarms thrue maia service"
  s.license = "Apache License 2.0"

  s.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
end
