module MonsoonOpenstackAuth
  class SetupGenerator < Rails::Generators::Base
    source_root File.expand_path('../templates', __FILE__)

    def add_route
      if open('config/routes.rb').grep(/mount MonsoonOpenstackAuth::Engine => '\/auth'/).size>0
        shell.say_status 'route exists', "mount MonsoonOpenstackAuth::Engine => '/auth'", :green    
      else
        route "mount MonsoonOpenstackAuth::Engine => '/auth'"
      end
    end
  
    def copy_initializer_file
      if File.exists?("config/initializers/monsoon_openstack_auth.rb")
        shell.say_status 'file exists', "config/initializers/monsoon_openstack_auth.rb", :green        
      else
        copy_file "initializer.rb", "config/initializers/monsoon_openstack_auth.rb"
      end
    end
    
    def copy_env_file
      if File.exists?(".env")
        shell.say_status 'file exists', ".env", :green        
      else
        copy_file "env", ".env"
      end
    end
  end
end
