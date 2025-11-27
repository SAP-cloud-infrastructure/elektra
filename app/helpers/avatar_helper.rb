module AvatarHelper
  def avatar_image_tag(options = {})
    size = options.delete(:size) || 24

    # Use our backend to serve the avatar
    avatar_url = "/#{@scoped_domain_fid}"
    avatar_url += "/#{@scoped_project_fid}" if @scoped_project_fid 
    avatar_url += "/avatar?size=#{size}"
    fallback_url = asset_path("avatar_default.svg")
    
    tag.div do
      concat tag.span(class: "spinner-gray")
      concat tag.img(
        src: avatar_url,
        width: 0,
        height: 0,
        onerror: "this.src='#{fallback_url}'; this.previousElementSibling.remove(); this.width='#{size}'; this.height='#{size}';",
        onload: "this.previousElementSibling.remove(); this.width='#{size}'; this.height='#{size}';",
        loading: "lazy",
        **options
      )
    end
  end
end
