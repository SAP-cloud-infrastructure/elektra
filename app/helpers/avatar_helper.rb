module AvatarHelper
  def avatar_image_tag(options = {})
    size = options.delete(:size) || 24
    
    # Build avatar URL with email and name as params
    avatar_url = "/#{@scoped_domain_fid}"
    avatar_url += "/#{@scoped_project_fid}" if @scoped_project_fid 
    avatar_url += "/avatar?size=#{size}"
    avatar_url += "&email=#{CGI.escape(current_user.email)}" if current_user&.email
    avatar_url += "&name=#{CGI.escape(current_user.name)}" if current_user&.name
    
    fallback_url = asset_path("avatar_default.svg")
    
    tag.div do
      concat tag.span(class: "spinner-gray")
      concat tag.img(
        src: avatar_url,
        width: 0,
        height: 0,
        onerror: "var s=this.previousElementSibling; if(s)s.remove(); this.src='#{fallback_url}'; this.width='#{size}'; this.height='#{size}';",
        onload: "var s=this.previousElementSibling; if(s)s.remove(); this.width='#{size}'; this.height='#{size}';",
        loading: "lazy",
        **options
      )
    end
  end
end
