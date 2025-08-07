class ProjectProfile < ApplicationRecord
  serialize :wizard_payload, coder: YAML
  before_save :write_wizard_status

  STATUS_DONE = "done"
  STATUS_SKIPPED = "skipped"
  STATUS_PENDING = "pending"

  def self.find_project_id(project_id)
    self.where(project_id: project_id).first
  end

  def self.find_or_create_by_project_id(project_id)
    profile = self.where(project_id: project_id).first
    unless profile
      profile = self.create(project_id: project_id, wizard_payload: {})
    end
    profile
  end

  def wizard_payload
    return @wizard_payload if @wizard_payload
    @wizard_payload = read_attribute("wizard_payload") || {}
  end

  def wizard_status(key)
    wizard_payload[key]["status"] if wizard_payload[key]
  end

  def wizard_data(key)
    hash = wizard_payload[key]
    return hash["data"].with_indifferent_access if hash and hash["data"]
  end

  def wizard_finished?(*service_names)
    status = true
    service_names = service_names.first if service_names.first.is_a?(Array)

    service_names.each do |service_name|
      status &=
        (
          wizard_payload[service_name] and
            (
              wizard_payload[service_name]["status"] == STATUS_DONE or
                wizard_payload[service_name]["status"] == STATUS_SKIPPED
            )
        )
    end
    status
  end

  def wizard_skipped?(service_name)
    status = true
    status &=
      (
        wizard_payload[service_name] and
          wizard_payload[service_name]["status"] == STATUS_SKIPPED
      )
    status
  end

  def update_wizard_status(service_name, status, data = nil)
    wizard_payload[service_name] ||= {}
    wizard_payload[service_name]["status"] = status
    wizard_payload[service_name]["data"] = data
    update_attribute(:wizard_payload, wizard_payload)
  end

  private

  def write_wizard_status
    write_attribute("wizard_payload", wizard_payload)
  end
end
