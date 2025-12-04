# frozen_string_literal: true

class AvatarsController < ApplicationController
  def show
    size = params[:size] || 24
    email = params[:email]
    name = params[:name]
    
    # Validate params exist
    return head :bad_request unless email.present?
    
    cache_key = "avatar/#{Digest::MD5.hexdigest(email)}/#{size}"
    
    if stale?(etag: cache_key, last_modified: 1.hour.ago, public: false)
      cached_avatar = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
        fetch_avatar(size, email, name)
      end
      
      if cached_avatar
        send_data cached_avatar[:data],
                  type: cached_avatar[:content_type],
                  disposition: 'inline'
      else
        redirect_to gravatar_url(size, email), allow_other_host: true
      end
    end
  end
  
  private
  
  def fetch_avatar(size, email, name)
    avatar_url = build_avatar_url(size, email, name)
    
    uri = URI.parse(avatar_url)
    response = Net::HTTP.start(uri.host, uri.port,
                               use_ssl: uri.scheme == 'https',
                               open_timeout: 2,
                               read_timeout: 3) do |http|
      http.request(Net::HTTP::Get.new(uri.request_uri))
    end
    
    if response.is_a?(Net::HTTPSuccess)
      {
        data: response.body,
        content_type: response['content-type'] || 'image/jpeg'
      }
    else
      nil
    end
  rescue StandardError => e
    Rails.logger.warn("Failed to fetch avatar from source: #{e.message}")
    nil
  end
  
  def build_avatar_url(size, email, name)
    url_template = ENV["MONSOON_DASHBOARD_AVATAR_URL"]
    
    if url_template.present?
      url = url_template.gsub('#{email}', email.to_s)
                        .gsub('#{name}', name.to_s)
      url.gsub(/size=\d+x\d+/, "size=#{size}x#{size}")
         .gsub(/s=\d+/, "s=#{size}")
    else
      raise "No avatar URL configured"
    end
  rescue StandardError => e
    Rails.logger.debug("Avatar URL error: #{e.message}, using Gravatar")
    gravatar_url(size, email)
  end
  
  def gravatar_url(size, email)
    email_hash = Digest::MD5.hexdigest(email.to_s.downcase.strip)
    "https://www.gravatar.com/avatar/#{email_hash}?d=mm&s=#{size}"
  end
end
