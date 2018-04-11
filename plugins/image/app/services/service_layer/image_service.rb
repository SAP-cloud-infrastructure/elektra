# frozen_string_literal: true

module ServiceLayer
  # implements images api
  class ImageService < Core::ServiceLayer::Service
    include ImageServices::Image
    include ImageServices::Member

    def available?(_action_name_sym = nil)
      elektron.service?('image')
    end

    def versions
      @versions ||= elektron_images.get('/', path_prefix: '/').body['versions']
    end

    def current_version
      version = versions.find { |v| v['status'] == 'CURRENT' }
      return unless version
      version['id']
    end

    def elektron_images
      @elektron_images ||= elektron.service(
        'image', path_prefix: '/v2'
      )
    end
  end
end
