# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = "1.0"

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in the app/assets
# folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )

# Precompile D3 v3 for networking topology
Rails.application.config.assets.precompile += %w( d3.v3.min.js )

# Bootstrap 5 migration: Bootstrap's SCSS now ships via the npm package
# (bootstrap@5), which lives in node_modules. The former `bootstrap-sass` gem
# put Bootstrap on the Sass load path automatically; the npm package does not,
# so add node_modules to the Sprockets asset paths to resolve
# `@import "bootstrap/scss/bootstrap"`.
Rails.application.config.assets.paths << Rails.root.join("node_modules")
