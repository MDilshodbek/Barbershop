#!/usr/bin/env bash
set -euo pipefail

echo "==> Resetting repository to clean state"
git reset --hard

echo "==> Checking out master branch"
git checkout master

echo "==> Pulling latest production code"
git pull origin master

docker compose up -d