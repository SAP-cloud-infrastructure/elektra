#!/bin/bash

# Playwright Test Runner for Elektra (using Docker container)
# Similar to Cypress run.sh, uses official Playwright Docker image
# Can be run from project root or e2e directory
# Usage: ./e2e/run-playwright.sh [options] [test-name]

function show_help() {
  echo "Usage: run-playwright.sh [OPTIONS] [TESTNAME]"
  echo ""
  echo "Options:"
  echo "  -h, --host HOST          Set base URL (default: http://localhost:3000)"
  echo "  -p, --profile PROFILE    Test profile: smoke (default: smoke)"
  echo "  -b, --browser BROWSER    Browser to use: chromium, firefox, webkit, all (default: chromium)"
  echo "  --headed                 Run tests in headed mode (show browser - requires DISPLAY)"
  echo "  --debug                  Run tests in debug mode"
  echo "  --ui                     Run tests in UI mode (interactive - requires DISPLAY)"
  echo "  --help                   Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./e2e/run-playwright.sh                            # Run smoke tests on localhost:3000"
  echo "  ./e2e/run-playwright.sh --host http://localhost:4001  # Custom host"
  echo "  ./e2e/run-playwright.sh --profile smoke health     # Run only health smoke tests"
  echo "  ./e2e/run-playwright.sh --browser firefox          # Run on Firefox"
  echo "  ./e2e/run-playwright.sh --browser all              # Run on all browsers"
  echo ""
  echo "MAC users: ./e2e/run-playwright.sh --host http://host.docker.internal:3000"
  exit 0
}

# Default values
HOST="http://localhost:3000"
PROFILE="smoke"
BROWSER="chromium"
HEADED=""
DEBUG=""
UI=""
TESTNAME=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--host)
      HOST="$2"
      shift 2
      ;;
    -p|--profile)
      PROFILE="$2"
      shift 2
      ;;
    -b|--browser)
      BROWSER="$2"
      shift 2
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    --ui)
      UI="--ui"
      shift
      ;;
    --help)
      show_help
      ;;
    --)
      # Ignore npm/pnpm separator
      shift
      ;;
    *)
      TESTNAME="$1"
      shift
      ;;
  esac
done

# Detect if we're running from root or e2e directory
if [ -f "playwright.config.ts" ]; then
  # Running from project root
  PROJECT_ROOT="$PWD"
elif [ -f "../playwright.config.ts" ]; then
  # Running from e2e directory
  PROJECT_ROOT="$(cd .. && pwd)"
else
  echo "ERROR: Cannot find playwright.config.ts"
  echo "Please run this script from project root or e2e directory"
  exit 1
fi

# Load environment variables from .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -o allexport
  source "$PROJECT_ROOT/.env"
  set +o allexport
fi

# Export environment variables for Playwright
export BASE_URL="$HOST"
export TEST_DOMAIN="${TEST_DOMAIN:-cc3test}"

# Build test path
if [ -n "$TESTNAME" ]; then
  TEST_SPEC="e2e/playwright/${PROFILE}/${TESTNAME}"
else
  TEST_SPEC="e2e/playwright/${PROFILE}"
fi

# Build browser project flag
if [ "$BROWSER" = "all" ]; then
  PROJECT_FLAG=""
else
  PROJECT_FLAG="--project=$BROWSER"
fi

echo "=========================================="
echo "Playwright E2E Test Runner (Docker)"
echo "=========================================="
echo "Base URL:  $BASE_URL"
echo "Profile:   $PROFILE"
echo "Browser:   $BROWSER"
echo "Test:      ${TESTNAME:-all tests in profile}"
echo "Domain:    $TEST_DOMAIN"
echo "=========================================="
echo ""

if [[ "${PROFILE}" == "smoke" ]]; then
  echo "Running SMOKE tests - no authentication required."
  echo "These tests verify that plugins are loaded and basic pages render correctly."
else
  echo "Please Note: member/admin tests require test credentials in .env file"
fi
echo ""

# Pull latest Playwright Docker image
echo "Checking for Playwright Docker image..."
docker pull mcr.microsoft.com/playwright:v1.59.1-noble

# Run Playwright in Docker container
# Similar to Cypress setup - mount project directory and use --network=host
docker run --rm \
  --volume "$PROJECT_ROOT:/work" \
  --workdir "/work" \
  --env BASE_URL="$BASE_URL" \
  --env TEST_DOMAIN="$TEST_DOMAIN" \
  --env TEST_MEMBER_USER="$TEST_MEMBER_USER" \
  --env TEST_MEMBER_PASSWORD="$TEST_MEMBER_PASSWORD" \
  --env TEST_ADMIN_USER="$TEST_ADMIN_USER" \
  --env TEST_ADMIN_PASSWORD="$TEST_ADMIN_PASSWORD" \
  --network=host \
  --ipc=host \
  mcr.microsoft.com/playwright:v1.59.1-noble \
  /bin/bash -c "npx playwright test $TEST_SPEC $PROJECT_FLAG $HEADED $DEBUG $UI"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed (exit code: $EXIT_CODE)"
  echo ""
  echo "To view the HTML report, run:"
  echo "  npx playwright show-report"
fi

exit $EXIT_CODE
