$:.push File.expand_path("../lib", __FILE__)
Gem::Specification.new do |spec|
  spec.name        = "kubernetes_ng"
  spec.version     = "0.0.1"
  spec.authors     = ["Elektra UI team"]
  spec.summary     = "An Elektra plugin"
  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
  end
  spec.metadata = { "mount_path" => "kubernetes-gardener" }
  end
