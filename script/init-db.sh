#!/bin/sh
set -e

export PGHOST=${ELEKTRA_POSTGRESQL_SERVICE_HOST:-${POSTGRES_ELEKTRA_SERVICE_HOST:-${POSTGRES_SERVICE_HOST:-postgres}}}
export PGUSER=${MONSOON_DB_USER:-postgres}
export PGPASSWORD=$MONSOON_DB_PASSWORD
export PGDATABASE=${MONSOON_DB_NAME:-monsoon-dashboard_production}

dbs=$(psql -tlA)
if echo "$dbs" | grep -q $PGDATABASE; then
  if psql -c "\dt schema_migrations" | grep -q "No matching relations found"; then
    echo "Table schema_migrations not found. Running db:setup"
    rake db:setup
  else
    echo "Running db:migrate"
    rake db:migrate
  fi
else
  echo "Database $PGDATABASE not found. Running db:setup"
  rake db:setup
fi

unset PGHOST PGUSER PGPASSWORD PGDATABASE

