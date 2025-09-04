ALLOWED_ROLES = %w[
  admin
  audit_viewer
  compute_admin
  compute_admin_wsg
  compute_viewer
  dns_viewer
  dns_webmaster
  image_admin
  image_viewer
  keymanager_admin
  keymanager_viewer
  kubernetes_admin
  kubernetes_member
  loadbalancer_admin
  loadbalancer_viewer
  loadbalancer_poolmemberadmin
  member
  masterdata_admin
  masterdata_viewer
  monitoring_viewer
  network_admin
  network_viewer
  objectstore_admin
  objectstore_viewer
  role_admin
  role_viewer
  reader
  resource_admin
  resource_viewer
  sharedfilesystem_admin
  sharedfilesystem_viewer
  volume_admin
  volume_viewer
  securitygroup_viewer
  securitygroup_admin
  registry_viewer
  registry_admin
  email_admin
  email_user
].freeze

BETA_ROLES = %w[].freeze

# not even cloud admins are allowed to assign these, they're intentionally
# restricted to a few technical users and CAM-managed groups (and those
# assignments are maintained in helm-charts)
BLACKLISTED_ROLES = %w[
  cloud_dns_resource_admin
  cloud_registry_admin
  cloud_registry_viewer
  cloud_resource_admin
  cloud_resource_viewer
  resource_service
  cloud_objectstore_admin
  cloud_objectstore_viewer
  cloud_masterdata_admin
  cloud_masterdata_viewer
  cloud_persephone_admin
  cloud_persephone_viewer
].freeze
