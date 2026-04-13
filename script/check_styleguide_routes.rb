#!/usr/bin/env ruby
# frozen_string_literal: true

# Test script to verify styleguide routes are loaded

ENV['RAILS_ENV'] ||= 'development'
require_relative '../config/environment'

puts "Rails Environment: #{Rails.env}"
puts "Styleguide routes should be #{Rails.env.development? || Rails.env.test? ? 'ENABLED' : 'DISABLED'}"
puts "\nSearching for styleguide routes:\n\n"

Rails.application.routes.routes.each do |route|
  if route.path.spec.to_s.include?('styleguide')
    puts "  #{route.verb.ljust(6)} #{route.path.spec.to_s.ljust(40)} #{route.defaults[:controller]}##{route.defaults[:action]}"
  end
end

styleguide_count = Rails.application.routes.routes.count { |r| r.path.spec.to_s.include?('styleguide') }

puts "\nTotal styleguide routes found: #{styleguide_count}"

if styleguide_count == 0
  puts "\n⚠️  WARNING: No styleguide routes found!"
  puts "This is expected in production, but should show routes in development/test."
end
