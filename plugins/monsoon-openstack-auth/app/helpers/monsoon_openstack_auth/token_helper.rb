module MonsoonOpenstackAuth
  module TokenHelper

    def self.included(base)
      base.send :helper_method,:dump_openstack_token,:os_token,:os_domain,:os_project if base.respond_to? :helper_method
    end

    def os_token
      session[MonsoonOpenstackAuth::Authentication::TokenStore::SESSION_NAME]

    end

    def dump_openstack_token
      return unless session

      if os_token && os_token.is_a?(Hash)
        content = render partial: "layouts/monsoon_openstack_auth/token_debug", locals:{token:os_token}

        content.is_a?(Array) ? content.first : content # Not quite sure why this is returning an array in some rails versions, but check just in case
      end
    end


    def os_domain
      if os_token[:domain]
        os_token[:domain][:id]
      elsif os_token[:project] && os_token[:project][:domain]
         os_token[:project][:domain][:id]
      end
    end
    alias_method :current_organization,:os_domain

    def os_project
      if os_token[:project]
        os_token[:project][:id]
      end
  end
    alias_method :current_project,:os_project


  end
end
