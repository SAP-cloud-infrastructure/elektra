$:.push File.expand_path("lib", __dir__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |spec|
  spec.name = "object_storage"
  spec.version = "0.0.1"
  spec.authors = ["Andreas Pfau"]
  spec.email = ["andreas.pfau@sap.com"]
  spec.homepage = ""
  spec.summary = "Manage objects in swift"
  spec.license = "Apache License 2.0"

  spec.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
end
