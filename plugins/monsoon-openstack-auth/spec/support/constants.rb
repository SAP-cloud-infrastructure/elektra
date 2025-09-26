module Constants
  def self.keystone_api_params
    {
      openstack_auth_url: 'http://localhost:5000/v3/auth/tokens',
      openstack_userid: '8d5732a0ebd9485396351d74e24c9647',
      openstack_api_key: 'openstack'
    }
  end
  
  def self.authority_api_params
    {
      openstack_auth_url: 'http://localhost:8183/v3/auth/tokens',
      openstack_userid: 'u-admin',
      openstack_api_key: 'secret'
    }
  end




end