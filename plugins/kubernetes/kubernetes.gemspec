$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "kubernetes"
  s.version = "0.0.1"
  s.authors = ["Esther Schmitz"]
  s.email = [" Write your email address"]
  s.homepage = ""
  s.summary = "Kubernetes as a service plugin"
  s.description = "Kubernetes as a service plugin"
  s.license = "MIT"

  s.files =
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
end
