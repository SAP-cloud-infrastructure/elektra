#!/bin/bash
# Quick test to check if styleguide routes are available

echo "Checking styleguide routes in development mode..."
echo ""

cd "$(dirname "$0")/.."

RAILS_ENV=development bundle exec rails runner "
  puts 'Rails Environment: ' + Rails.env
  puts ''

  routes = Rails.application.routes.routes.select { |r| r.path.spec.to_s.include?('styleguide') }

  if routes.empty?
    puts '❌ No styleguide routes found!'
    puts ''
    puts 'This could mean:'
    puts '  1. Routes are only enabled in development/test (current: ' + Rails.env + ')'
    puts '  2. There is a syntax error in config/routes.rb'
    puts '  3. Rails needs to be restarted'
  else
    puts '✅ Found ' + routes.count.to_s + ' styleguide routes:'
    puts ''
    routes.each do |route|
      verb = route.verb.to_s.ljust(6)
      path = route.path.spec.to_s.ljust(40)
      controller = route.defaults[:controller] || '?'
      action = route.defaults[:action] || '?'
      puts \"  #{verb} #{path} #{controller}##{action}\"
    end
    puts ''
    puts 'Try accessing: http://localhost:3000/styleguide'
  end
"
