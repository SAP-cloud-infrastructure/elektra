#!/bin/bash
set -e

if [[ -z "$APP_PORT" ]]; then
  APP_PORT="3000"
fi

echo "Cleaning assets..."
rm -rf public/assets tmp/cache

echo "Precompiling assets..."
RAILS_ENV=production SECRET_KEY_BASE=top_secret bin/rails assets:precompile

echo "Starting Rails server with bundled client assets for production on port $APP_PORT..."
bin/rails s -b 0.0.0.0 -p $APP_PORT

echo "Do you want to cleanup static assets? (y/n)"
read -r CLEANUP_CONFIRM

if [[ "$CLEANUP_CONFIRM" == "y" ]]; then
  echo "Cleaning up static assets..."
  rm -rf public/assets tmp/cache
else
  echo "Skipping static assets cleanup."
fi
