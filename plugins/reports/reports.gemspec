$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "reports"
  s.version     = "0.0.1"
  s.authors     = [" Write your name"]
  s.email       = [" Write your email address"]
  s.homepage    = ""
  s.summary     = " Summary of Reports."
  s.description = " Description of Reports."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]

  
  
end
