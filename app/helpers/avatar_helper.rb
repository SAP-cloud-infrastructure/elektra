module AvatarHelper
  def avatar_image_tag(options = {})
    size = options.delete(:size) || 24
    cssClass = options.delete(:class) || ""
    
    avatar_url = begin
      # Safely interpolate the environment variable
      url_template = ENV["MONSOON_DASHBOARD_AVATAR_URL"]
      if url_template.present?
        # Use gsub to replace placeholder with actual email
        url = url_template.gsub('#{current_user.email}', current_user.email.to_s)
                          .gsub('#{current_user.name}', current_user.name.to_s)
        # Replace size parameter
        url.gsub(/size=\d+x\d+/, "size=#{size}x#{size}")
           .gsub(/s=\d+/, "s=#{size}")
      else
        raise "No avatar URL configured"
      end
    rescue StandardError => e
      Rails.logger.debug("Avatar URL error: #{e.message}, falling back to Gravatar")
      email_hash = Digest::MD5.hexdigest(current_user.email.to_s.downcase.strip)
      "https://www.gravatar.com/avatar/#{email_hash}?d=mm&s=#{size}"
    end
    
    tag.div(class: "avatar #{cssClass}") do
      tag.img(
        src: avatar_url,
        onerror: "this.remove()",
        loading: "lazy",
        **options
      )
    end
  end
end