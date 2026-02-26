$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = "inquiry"
  s.version = "0.0.1"
  s.authors = ["Write your name"]
  s.email = ["Write your email address"]
  s.homepage = ""
  s.summary = "Summary of Inquiry."
  s.description = "Description of Inquiry."
  s.license = "Apache License 2.0"

  s.files =
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.rdoc"]

  s.add_runtime_dependency "aasm"
  s.add_runtime_dependency "kaminari"
  s.add_runtime_dependency "bootstrap-kaminari-views"
  s.metadata = { "mount_path" => "request" }
end
