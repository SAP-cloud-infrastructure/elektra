#!/bin/bash

# Playwright Test Runner for Elektra (using Docker container)
# Similar to Cypress run.sh, uses official Playwright Docker image
# Can be run from project root or e2e directory
# Usage: ./e2e/run.sh [options] [test-name]

function show_help() {
  echo "Usage: run.sh [OPTIONS] [TESTNAME]"
  echo ""
  echo "Options:"
  echo "  -h, --host HOST          Set base URL (default: http://localhost:3000)"
  echo "  -p, --profile PROFILE    Test profile: smoke (default: smoke)"
  echo "  -b, --browser BROWSER    Browser to use: chromium, firefox, webkit, all (default: chromium)"
  echo "  --headed                 Run tests in headed mode (show browser - requires DISPLAY)"
  echo "  --debug                  Run tests in debug mode"
  echo "  --ui                     Run tests in UI mode (interactive - requires DISPLAY)"
  echo "  --pull                   Force pull latest Docker image"
  echo "  --help                   Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./e2e/run.sh                              # Run smoke tests on localhost:3000"
  echo "  ./e2e/run.sh --host http://localhost:PORT # Custom host"
  echo "  ./e2e/run.sh --profile smoke health       # Run only health smoke tests"
  echo "  ./e2e/run.sh --browser firefox            # Run on Firefox"
  echo "  ./e2e/run.sh --browser all                # Run on all browsers"
  echo "  ./e2e/run.sh --pull                       # Force pull latest image"
  echo ""
  echo "MAC users: ./e2e/run.sh --host http://host.docker.internal:3000"
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
PULL_IMAGE=false

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
    --pull)
      PULL_IMAGE=true
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
if [ -f "package.json" ]; then
  # Running from project root
  PROJECT_ROOT="$PWD"
elif [ -f "../package.json" ]; then
  # Running from e2e directory
  PROJECT_ROOT="$(cd .. && pwd)"
else
  echo "ERROR: Cannot find package.json"
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

# Build test path (relative to project root)
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

# Docker image configuration - extract actually installed version
cd "$PROJECT_ROOT"
PLAYWRIGHT_VERSION=$(pnpm list @playwright/test --depth=0 --json 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0))[0]?.devDependencies?.['@playwright/test']?.version || ''" 2>/dev/null)

if [ -z "$PLAYWRIGHT_VERSION" ]; then
  echo "ERROR: Could not detect installed @playwright/test version"
  echo "Please run: pnpm install"
  exit 1
fi

PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

# Ensure results directory exists with correct permissions
mkdir -p "$PROJECT_ROOT/e2e/playwright-results"

# Pull Docker image only if requested or if it doesn't exist
if [[ "$PULL_IMAGE" == "true" ]]; then
  echo "Pulling latest Playwright Docker image..."
  docker pull $PLAYWRIGHT_IMAGE
elif ! docker image inspect $PLAYWRIGHT_IMAGE &> /dev/null; then
  echo "Playwright Docker image not found locally. Pulling..."
  docker pull $PLAYWRIGHT_IMAGE
else
  echo "Using existing Playwright Docker image: $PLAYWRIGHT_IMAGE"
fi
echo ""

# Run Playwright in Docker container
# Mount entire project so node_modules/@playwright/test is available
# Use --user to avoid creating root-owned files
docker run --rm \
  --user "$(id -u):$(id -g)" \
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
  $PLAYWRIGHT_IMAGE \
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
