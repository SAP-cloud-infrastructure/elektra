require "kubernetes_ng/version"
require "kubernetes_ng/engine"

module KubernetesNg
  # Custom error class for landscape-related errors
  class LandscapeError < StandardError; end

  # Central landscape configuration - single source of truth
  # Maps landscape_name to service endpoint and display settings
  LANDSCAPES = {
    'prod' => {
      service: 'persephone-prod',
      display_name: '',
      nav_label: 'Kubernetes',
      user_facing: true
    },
    'canary' => {
      service: 'persephone-canary',
      display_name: 'Canary',
      nav_label: 'Kubernetes Canary',
      user_facing: true
    },
    'qa' => {
      service: 'persephone-qa',
      display_name: 'QA',
      nav_label: 'Kubernetes QA',
      user_facing: false  # Internal/QA only - only visible in qa-de-1 region
    }
  }.freeze

  # Helper methods for accessing landscape data
  def self.allowed_landscapes
    LANDSCAPES.keys
  end

  def self.service_for(landscape_name)
    LANDSCAPES.dig(landscape_name, :service)
  end

  def self.display_name_for(landscape_name)
    LANDSCAPES.dig(landscape_name, :display_name) || landscape_name.capitalize
  end

  def self.nav_label_for(landscape_name)
    LANDSCAPES.dig(landscape_name, :nav_label)
  end

  # Landscapes shown in error messages
  def self.user_facing_landscapes
    LANDSCAPES.select { |_, config| config[:user_facing] }.keys
  end
end
