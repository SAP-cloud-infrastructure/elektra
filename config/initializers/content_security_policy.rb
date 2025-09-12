# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

# Rails.application.configure do
#   config.content_security_policy do |policy|
#     policy.default_src :self, :https
#     policy.font_src    :self, :https, :data
#     policy.img_src     :self, :https, :data
#     policy.object_src  :none
#     policy.script_src  :self, :https
#     policy.style_src   :self, :https
#     # Specify URI for violation reports
#     # policy.report_uri "/csp-violation-report-endpoint"
#   end
#
#   # Generate session nonces for permitted importmap, inline scripts, and inline styles.
#   config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
#   config.content_security_policy_nonce_directives = %w(script-src style-src)
#
#   # Report violations without enforcing the policy.
#   # config.content_security_policy_report_only = true
# end

domains = ["dashboard.#{ENV["MONSOON_DASHBOARD_REGION"] || "*"}.cloud.sap"]

Rails.application.config.content_security_policy do |policy|
  # =============================================================================
  # CONTENT SECURITY POLICY (CSP) CONFIGURATION
  # =============================================================================
  # This CSP configuration provides a balance between security and functionality.
  # It prevents most XSS attacks while allowing Rails and modern JS frameworks to work.

  # DEFAULT SOURCE - Fallback for all unspecified directives
  # Only allows resources from same origin unless overridden by specific directives
  # ✅ Allowed: <link rel="manifest" href="/manifest.json">
  # ❌ Blocked: <iframe src="https://external-site.com/widget">
  policy.default_src :self

  # JAVASCRIPT SOURCES - Controls where JS can be loaded from and executed
  # :self = same origin scripts only
  # :unsafe_inline = allows <script>code</script> and onclick="code" (needed for Rails)
  # :unsafe_eval = allows eval(), new Function(), setTimeout(string) (needed for frameworks)
  # ✅ Allowed: <script src="/app.js">, <script>console.log('test')</script>, eval('code')
  # ❌ Blocked: <script src="https://external-cdn.com/malicious.js">
  policy.script_src :self, :unsafe_inline, :unsafe_eval

  # CSS SOURCES - Controls where stylesheets can be loaded from
  # :unsafe_inline = allows <style>css</style> and style="css" attributes (needed for Rails)
  # ✅ Allowed: <link href="/app.css">, <div style="color: red">, <style>.class{}</style>
  # ❌ Blocked: <link href="https://external-cdn.com/bootstrap.css">
  policy.style_src :self, :unsafe_inline

  # IMAGE SOURCES - Controls where images can be loaded from
  # :data = allows data:image/png;base64,... URLs (common for icons)
  # :https = allows images from any HTTPS domain (CDNs, user uploads, etc.)
  # ✅ Allowed: <img src="/logo.png">, <img src="data:image/png;base64,...">, 
  #            <img src="https://cdn.example.com/photo.jpg">
  # ❌ Blocked: <img src="http://insecure-site.com/image.jpg">
  policy.img_src :self, :data, :https

  # NETWORK CONNECTIONS - Controls AJAX, fetch(), WebSocket connections
  # :https = allows API calls to any HTTPS endpoint (flexible for external APIs)
  # :wss = allows secure WebSocket connections (wss://)
  # *domains = spreads custom domain list (e.g., other cloud.sap subdomains)
  # ✅ Allowed: fetch('/api/users'), fetch('https://api.github.com/data'), 
  #            new WebSocket('wss://socket.io'), fetch('https://your-custom-domains.com')
  # ❌ Blocked: fetch('http://api.example.com/data'), new WebSocket('ws://insecure.com')
  policy.connect_src :self, :https, :wss, *domains

  # FRAME ANCESTORS - Controls who can embed this page in iframes (anti-clickjacking)
  # :self = only same origin can embed your pages
  # ✅ Allowed: <iframe src="https://yourdomain.com/widget"> (on yourdomain.com)
  # ❌ Blocked: <iframe src="https://yourdomain.com/page"> (on external-site.com)
  policy.frame_ancestors :self

  # FRAME SOURCES - Controls what iframes this page can embed
  # :self = can embed iframes from same origin
  # "*.cloud.sap" = can embed iframes from any cloud.sap subdomain
  # ✅ Allowed: <iframe src="/internal-widget">, 
  #            <iframe src="https://ccloudshell-qa.eu-de-1.cloud.sap"> QA case
  #            <iframe src="https://ccloudshell.eu-de-2.cloud.sap"> Prod case
  # ❌ Blocked: <iframe src="https://external-malicious-site.com">
  if ENV["MONSOON_DASHBOARD_REGION"].start_with?("qa")
      policy.frame_src :self, "*.eu-de-1.cloud.sap" 
  else
    policy.frame_src :self, "*.#{ENV["MONSOON_DASHBOARD_REGION"]}.cloud.sap"
  end

  # FORM ACTIONS - Controls where forms can submit data
  # :self = forms can only submit to same origin
  # ✅ Allowed: <form action="/users" method="post">
  # ❌ Blocked: <form action="https://evil.com/steal-data" method="post">
  policy.form_action :self

  # OBJECT SOURCES - Controls plugins and embedded objects
  # :none = completely blocks all plugins (Flash, Java applets, etc.)
  # ❌ Blocked: <object data="malicious.swf">, <embed src="plugin.swf">
  # Why: These are security risks and rarely needed in modern web apps
  policy.object_src :none

  # BASE URI - Restricts the <base> tag to prevent URL manipulation attacks
  # :self = <base> tag can only point to same origin
  # ✅ Allowed: <base href="/subdirectory/">
  # ❌ Blocked: <base href="https://evil.com/"> (prevents relative URL hijacking)
  policy.base_uri :self

  # FONT SOURCES - Controls web font loading
  # :data = allows data:font/woff2;base64,... URLs (embedded fonts)
  # :https = allows fonts from CDNs like Google Fonts, Font Awesome
  # ✅ Allowed: url('/fonts/custom.woff'), url('data:font/woff2;base64,...'),
  #             url('https://fonts.googleapis.com/css2?family=Roboto')
  # ❌ Blocked: url('http://insecure-fonts.com/font.woff')
  policy.font_src :self, :data, :https

  # MEDIA SOURCES - Controls audio and video sources
  # :https = allows media from CDNs and external sources
  # ✅ Allowed: <video src="/demo.mp4">, <audio src="https://cdn.example.com/music.mp3">
  # ❌ Blocked: <video src="http://insecure-cdn.com/video.mp4">
  policy.media_src :self, :https

  # =============================================================================
  # SECURITY VS FUNCTIONALITY TRADE-OFFS:
  # =============================================================================
  # CURRENT CONFIG: Balanced - functional but reasonably secure
  # - Allows Rails/JS frameworks to work (:unsafe_inline, :unsafe_eval)
  # - Allows external HTTPS APIs (:https in connect_src)
  # - Blocks most XSS attacks from external sources
  #
  # MORE SECURE (will break functionality!!!):
  # policy.script_src :self  # No inline JS - requires code refactoring
  # policy.connect_src :self, *domains  # Only your domains - blocks external APIs
end
