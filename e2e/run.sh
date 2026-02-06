#!/bin/bash

if [ ! -f "cypress.config.js" ]; then
  echo "ERROR: you need to run this script in e2e folder!"
  exit 1
fi

function help_me() {

  echo "Usage: run.sh --host|-h HOST --profile|-p admin|member|smoke --e2e-path|-e2e  --record|-r --browser|-b chrome|firefox|electron* --debug|-d CYPRESS-DEBUG-FLAG* TESTNAME* "
  echo "       run.sh --help                                                   # will print out this message"
  echo "       run.sh --host http://localhost:3000 landingpage                 # will only run landingpage tests"
  echo "       run.sh --host http://localhost:3000 --debug 'cypress:network:*' # will show debug information about the networking"
  echo "       run.sh --e2e_path                                               # this optional if not set \$PWD is used"
  echo "       run.sh --record                                                 # record your test in cypress-dashboard"
  echo "       run.sh --browser chrome                                         # choose browser to test (default is chrome)"
  echo ""
  echo "MAC users: ./run.sh --host http://host.docker.internal:3000"
  echo ""
  echo "Debugging options: https://docs.cypress.io/guides/references/troubleshooting#Log-sources"
  echo "cypress:cli                 The top-level command line parsing problems"
  echo "cypress:server:args         Incorrect parsed command line arguments"
  echo "cypress:server:specs        Not finding the expected specs"
  echo "cypress:server:project      Opening the project"
  echo "cypress:server:browsers     Finding installed browsers"
  echo "cypress:launcher            Launching the found browser"
  echo "cypress:network:*           Adding network interceptors"
  echo "cypress:net-stubbing*       Network interception in the proxy layer"
  echo "cypress:server:reporter     Problems with test reporters"
  echo "cypress:server:preprocessor Processing specs"
  echo "cypress:server:plugins      Running the plugins file and bundling specs"
  echo "cypress:server:socket-e2e   Watching spec files"
  echo "cypress:server:task         Invoking the cy.task() command"
  echo "cypress:server:socket-base  Debugging cy.request() command"
  exit 1
}

# this is the default cypress command that is used without --record option
CY_CMD="cypress"
if [[ "$1" == "--help" ]]; then
  help_me
else
  while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
    -h | --host)
      HOST="$2"
      shift # past argument
      shift # past value
      ;;
    -p | --profile)
      PROFILE="$2"
      SPECS_FOLDER="cypress/integration/$PROFILE/**/*"
      shift # past argument
      shift # past value
      ;;
    -d | --debug)
      DEBUG="$2"
      shift # past argument
      shift # past value
      ;;
    -e2e | --e2e-path) # local path for e2e
      E2E_PATH="$2"
      shift # past argument
      shift # past value
      ;;
    -b | --browser)
      CYPRESS_BROWSER="$2"
      shift # past argument
      shift # past value
      ;;
    -r | --record)
      hostname=$(hostname)
      CI_BUID_ID="$(date) - DEV - $hostname"
      CY_CMD="cypress-cloud"
      shift # past argument
      ;;
    *) # test folder
      SPECS_FOLDER="cypress/integration/$PROFILE/$1*"
      shift # past argument
      ;;
    esac
  done
fi

if [[ -z "${E2E_PATH}" ]]; then
  E2E_PATH=$PWD
fi

if [[ -z "${CYPRESS_BROWSER}" ]]; then
  CYPRESS_BROWSER="chrome"
fi

echo "check for latest cypress image"
docker pull keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/cypress/included:15.10.0

# https://docs.cypress.io/guides/guides/command-line#cypress-run
# --ci-build-id https://docs.cypress.io/guides/guides/command-line#cypress-run-ci-build-id-lt-id-gt
# --paralell    https://docs.cypress.io/guides/guides/parallelization#Turning-on-parallelization
# https://docs.sorry-cypress.dev/guide/get-started
# NOTE: for record you will find all other options in the currents.config.js file
if [[ -n "${CI_BUID_ID}" ]]; then
  CY_OPTIONS=(--record --parallel --ci-build-id "$CI_BUID_ID - $CYPRESS_BROWSER")
fi

# find the host if nothing was given
if [[ -z "${HOST}" ]]; then
  if [ -f "/usr/local/bin/wb" ]; then
    # this runs only in workspaces!!!
    APP_PORT=$(wb elektra 'echo $PORT' | tail -1 | tr -d '\r')
    SHOW_APP_PORT="APP_PORT      => $APP_PORT"
    HOST="http://localhost:$APP_PORT"
  fi

  if [[ -z "${APP_PORT}" ]]; then
    echo "ERROR: no APP_PORT found"
    echo ""
    help_me
  fi
fi

if [[ -z "${PROFILE}" ]]; then
  echo "ERROR: no PROFILE found"
  echo ""
  help_me
fi

if [[ -z "${SPECS_FOLDER}" ]]; then
  echo "ERROR: no SPECS_FOLDER found"
  echo ""
  help_me
fi

if [[ -z "${HOST}" ]]; then
  echo "ERROR: no HOST found"
  echo ""
  help_me
fi

# get test user and password (not required for smoke profile)
set -o allexport
source ../.env
set +o allexport

# smoke profile does not require authentication
if [[ "${PROFILE}" == "smoke" ]]; then
  TEST_USER=""
  TEST_PASSWORD=""
  # TEST_DOMAIN is optional for smoke tests, default to cc3test if not set
  if [[ -z "${TEST_DOMAIN}" ]]; then
    TEST_DOMAIN="cc3test"
  fi
else
  TEST_USER=$TEST_MEMBER_USER
  TEST_PASSWORD=$TEST_MEMBER_PASSWORD

  if [[ "${PROFILE}" == "admin" ]]; then
    TEST_USER=$TEST_ADMIN_USER
    TEST_PASSWORD=$TEST_ADMIN_PASSWORD

    if [[ -z "${TEST_ADMIN_USER}" ]]; then
      echo "ERROR: no TEST_ADMIN_USER found please check .env"
      exit 1
    fi

    if [[ -z "${TEST_ADMIN_PASSWORD}" ]]; then
      echo "ERROR: no TEST_ADMIN_PASSWORD found please check .env"
      exit 1
    fi
  else
    if [[ -z "${TEST_MEMBER_USER}" ]]; then
      echo "ERROR: no TEST_MEMBER_USER found please check .env"
      exit 1
    fi

    if [[ -z "${TEST_MEMBER_PASSWORD}" ]]; then
      echo "ERROR: no TEST_MEMBER_PASSWORD found please check .env"
      exit 1
    fi
  fi

  if [[ -z "${TEST_DOMAIN}" ]]; then
    echo "ERROR: no TEST_DOMAIN found please check .env"
    exit 1
  fi
fi

# show all hidden chars for debugging
# https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
# echo $HOST | cat -A

echo "$SHOW_APP_PORT"
echo "HOST          => $HOST"
echo "BROWSER       => $CYPRESS_BROWSER"
echo "SPECS_FOLDER  => $SPECS_FOLDER"
echo "E2E_PATH      => $E2E_PATH"
echo "PROFILE       => $PROFILE"
echo "TEST_DOMAIN   => $TEST_DOMAIN"
echo "TEST_USER     => $TEST_USER"
if [[ -n "$DEBUG" ]]; then
  echo "DEBUG:        => $DEBUG"
fi
echo ""
if [[ "${PROFILE}" == "smoke" ]]; then
  echo "Running SMOKE tests - no authentication required."
  echo "These tests verify that plugins are loaded and basic pages render correctly."
else
  echo "Please Note: the e2e tests run only with QA-DE-1, (your local elektra that is configured for qa-de-1"
  echo "or https://dashboard-e2e.qa-de-1.cloud.sap) because the Test-User,Domain and Project is only configured there."
fi
echo ""

docker run --rm -it \
  --volume "$E2E_PATH:/e2e" \
  --workdir "/e2e" \
  --env DEBUG="$DEBUG" \
  --env CYPRESS_BASE_URL="$HOST" \
  --env CYPRESS_TEST_PASSWORD="$TEST_PASSWORD" \
  --env CYPRESS_TEST_USER="$TEST_USER" \
  --env CYPRESS_TEST_DOMAIN="$TEST_DOMAIN" \
  --entrypoint $CY_CMD \
  --network=host \
  keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/cypress/included:15.10.0 run "${CY_OPTIONS[@]}" --spec "$SPECS_FOLDER" --browser "$CYPRESS_BROWSER"
# NOTE: for testing and debug inside the container use --entrypoint /bin/bash
# https://hub.docker.com/r/cypress/included/tags
# cypress/included:15.10.0
