$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "resources"
  s.version = "0.0.1"
  s.authors = [" Write your name"]
  s.email = [" Write your email address"]
  s.homepage = ""
  s.summary = " Summary of Resources."
  s.description = " Description of Resources."
  s.license = "Apache License 2.0"

  s.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
end
