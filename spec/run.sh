#!/bin/bash

ELEKTRA_PORT=$(wb elektra 'echo $PORT' | tail -1 | tr -d '\r')

if [[ -n "$ELEKTRA_PORT" ]]; then
  echo "Workspaces and Elektra found :-)"
  wb elektra "RAILS_ENV='test' bundle exec rspec"
  wb elektra "pnpm test"
  exit
else
  echo "Try to run local mode..."
  RAILS_ENV='test' bundle exec rspec
  pnpm test
  exit
fi
