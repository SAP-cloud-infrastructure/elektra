class AvatarsController < ::AjaxController
  def show
    size = params[:size] || 24
    cache_key = "avatar/#{current_user.id}/#{size}"
    
    if stale?(etag: cache_key, last_modified: 1.hour.ago, public: false)
      cached_avatar = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
        fetch_avatar(size)
      end
      
      if cached_avatar
        send_data cached_avatar[:data],
                  type: cached_avatar[:content_type],
                  disposition: 'inline'
      else
        redirect_to gravatar_url(size), allow_other_host: true
      end
    end
  end
  
  private
  
  def fetch_avatar(size)
    avatar_url = build_avatar_url(size)
    
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
  
  def build_avatar_url(size)
    url_template = ENV["MONSOON_DASHBOARD_AVATAR_URL"]
    
    if url_template.present?
      url = url_template.gsub('#{current_user.email}', current_user.email.to_s)
                        .gsub('#{current_user.name}', current_user.name.to_s)
      url.gsub(/size=\d+x\d+/, "size=#{size}x#{size}")
         .gsub(/s=\d+/, "s=#{size}")
    else
      raise "No avatar URL configured"
    end
  rescue StandardError => e
    Rails.logger.debug("Avatar URL error: #{e.message}, using Gravatar")
    gravatar_url(size)
  end
  
  def gravatar_url(size)
    email_hash = Digest::MD5.hexdigest(current_user.email.to_s.downcase.strip)
    "https://www.gravatar.com/avatar/#{email_hash}?d=mm&s=#{size}"
  end
end
