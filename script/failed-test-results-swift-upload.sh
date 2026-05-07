#!/usr/bin/env bash

# exit on error
set -e

function help() {
  echo "Usage: failed-test-results-swift-upload.sh --container||-c --root-path||-rp --name||-n --version||-v
  example: ./script/failed-test-results-swift-upload.sh --root-path /work/e2e/playwright-results --container playwright --name smoke --version 1.0.0
  --container    -> Swift container name where to upload results (required)
  --root-path    -> absolute path to the test results directory (required)
  --name         -> name of the test run: smoke, ui, etc. (required)
  --version      -> version number for grouping results (required)

  possible ENV Vars:
  * OS_USER_DOMAIN_NAME: per default this is not set
  * OS_PROJECT_DOMAIN_NAME: default is ccadmin
  * OS_PROJECT_NAME: default is master
  * OS_PROJECT_ID: per default this is not set
  * OS_AUTH_URL: default is https://identity-3.qa-de-1.cloud.sap/v3
  * OS_USERNAME: this is not optional
  * OS_PASSWORD: this is not optional"
  exit
}

if [[ "$1" == "--help" ]]; then
  help
fi

if [[ -z "$OS_USERNAME" ]]; then
  echo "no OS_USERNAME given"
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case $1 in
  --root-path | -rp)
    ROOT_PATH="$2"
    shift # past argument
    shift # past value
    ;;
  --version | -v)
    VERSION="$2"
    shift # past argument
    shift # past value
    ;;
  --name | -n)
    NAME="$2"
    shift # past argument
    shift # past value
    ;;
  --container | -c)
    CONTAINER="$2"
    shift # past argument
    shift # past value
    ;;
  --help)
    help
    ;;
  *)
    echo "$1 unkown option!"
    exit 1
    ;;
  esac
done

# Hard-coded for elektra project
PROJECT="elektra-failed"

if [[ -z "$CONTAINER" ]]; then
  echo "Error: no CONTAINER given 😐"
  exit 1
fi

if [[ -z "$VERSION" ]]; then
  echo "Error: no VERSION given 😐"
  exit 1
fi

if [ ! -d "$ROOT_PATH" ]; then
  echo "Error: directory ROOT_PATH $ROOT_PATH does not exist 😐"
  exit 1
fi

if [[ -z "$OS_AUTH_URL" ]]; then
  OS_AUTH_URL="https://identity-3.qa-de-1.cloud.sap/v3"
fi

if [[ -z "$OS_PROJECT_DOMAIN_NAME" ]]; then
  OS_PROJECT_DOMAIN_NAME="ccadmin"
fi

if [[ -z "$OS_PROJECT_NAME" ]]; then
  OS_PROJECT_NAME="master"
fi

export OS_AUTH_VERSION=3
echo "OS_AUTH_URL: $OS_AUTH_URL"
export OS_AUTH_URL=$OS_AUTH_URL

if [[ -n "$OS_PROJECT_DOMAIN_NAME" ]]; then
  echo "OS_PROJECT_DOMAIN_NAME: $OS_PROJECT_DOMAIN_NAME"
  export OS_PROJECT_DOMAIN_NAME=$OS_PROJECT_DOMAIN_NAME
fi

echo "OS_USER_DOMAIN_NAME: $OS_USER_DOMAIN_NAME"
export OS_USER_DOMAIN_NAME=$OS_USER_DOMAIN_NAME

echo "OS_PROJECT_NAME: $OS_PROJECT_NAME"
export OS_PROJECT_NAME=$OS_PROJECT_NAME

if [[ -n "$OS_PROJECT_ID" ]]; then
  export OS_PROJECT_ID=$OS_PROJECT_ID
  echo "OS_PROJECT_ID: $OS_PROJECT_ID"
fi

echo "OS_PROJECT_ID: $OS_PROJECT_ID"
echo "OS_USERNAME: $OS_USERNAME"
export OS_USERNAME=$OS_USERNAME
export OS_PASSWORD=$OS_PASSWORD

# auth swift and set OS_STORAGE_URL and OS_AUTH_TOKEN
eval "$(swift auth)"

echo "----------------------------------"
echo "use CONTAINER   = $CONTAINER"
echo "----------------------------------"

# https://docs.openstack.org/ocata/cli-reference/swift.html
function upload() {

  cd "$ROOT_PATH"

  if [ -z "$(ls -A .)" ]; then
    echo "The directory $ROOT_PATH is empty, nothing to upload to swift..."
  else
    # Upload to: elektra/VERSION/NAME/
    UPLOAD_DIR="$PROJECT/$VERSION/$NAME/"
    mkdir -p /tmp/$UPLOAD_DIR

    # Copy all files and directories from ROOT_PATH
    # This works for any test framework (Playwright, Cypress, Jest, etc.)
    cp -R . /tmp/$UPLOAD_DIR

    cd /tmp/
    echo "Swift upload from $ROOT_PATH to container $CONTAINER and destination $UPLOAD_DIR"
    swift upload --skip-identical --changed "$CONTAINER" $UPLOAD_DIR &&
      echo "----------------------------------" &&
      echo "upload done 🙂"
  fi
}

upload
