$:.push File.expand_path("../lib", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'lookup'
  s.version     = '0.0.1'
  s.authors     = ['Maurice Schreiber']
  s.email       = ['maurice.schreiber@sap.com']
  s.homepage    = ''
  s.summary     = 'Summary of Lookup.'
  s.description = 'Description of Lookup.'
  s.license     = 'MIT'

  s.files = Dir['{app,config,db,lib}/**/*', 'MIT-LICENSE', 'Rakefile', 'README.rdoc']
end
