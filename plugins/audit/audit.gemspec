$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "audit"
  s.version     = "0.0.1"
  s.authors     = [" Write your name"]
  s.email       = [" Write your email address"]
  s.homepage    = ""
  s.summary     = " Summary of Audit."
  s.description = " Description of Audit."
  s.license     = "Apache-2.0"

  s.files = Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.rdoc"]
end
