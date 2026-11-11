$:.push File.expand_path("../lib", __FILE__)

require "compute_njq/version"

Gem::Specification.new do |spec|
  spec.name        = "compute_njq"
  spec.version     = ComputeNjq::VERSION
  spec.authors     = ["Elektra UI team"]
  spec.summary     = "Elektra compute plugin (React/BFF, no jQuery)"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,lib}/**/*", "Apache License 2.0", "Rakefile", "README.md"]
  end

  spec.metadata = { "mount_path" => "compute-njq" }
end
