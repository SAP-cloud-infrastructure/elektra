class UserProfile < ApplicationRecord
  has_many :domain_profiles

  scope :search_by_name, ->(name) {
    where('full_name ILIKE ? or name ILIKE ?', "%#{name}%", "%#{name}%")
  }

  def self.tou_accepted?(user_id, domain_id, version)
    p = UserProfile.tou(user_id, domain_id, version)
    p.present?
  end

  def self.tou(user_id, domain_id, version)
    UserProfile.find_by(uid: user_id).domain_profiles.find_by(
      domain_id: domain_id, tou_version: version
    )
  rescue
    false
  end
end
