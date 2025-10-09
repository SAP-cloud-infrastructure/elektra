#!/bin/bash

# exit when any command fails
set -e

if [ ! -f README.md ]; then
  echo "Execute this script from the toplevel directory."
  exit 1
fi

if [ "$1" == "--help" ]; then
  echo "this script is for debugging to checkout a specific version (default is HEAD) and prepare elektra to run"
  echo "Usage: checkout_and_prepare.sh COMMIT*"
  exit 0
fi

COMMIT=${1-HEAD}
echo "INFO: please be aware that you should stop puma first!"
read -p "INFO: prepare elektra for $COMMIT ? (y/n)" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  git checkout $COMMIT && 
  rm -rf ./node_modules/ &&
  pnpm i &&
  bundle install &&
  echo "" &&
  echo "INFO: Checkout and preparations for release $COMMIT done" &&
  git show $COMMIT &&
  echo "" &&
  echo "INFO: You can now start puma testing."
else
  echo ""
  echo "INFO: canceled!"
fi

