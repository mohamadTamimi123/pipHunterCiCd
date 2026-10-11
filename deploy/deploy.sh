#!/usr/bin/env bash
# Pull both repos and rebuild/restart the stack. Run on the server from any directory.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"

if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "Missing $DEPLOY_DIR/.env - copy .env.example and fill it in first." >&2
  exit 1
fi

git -C "$ROOT/pipHunterCiCd" pull --ff-only
git -C "$ROOT/piphunter-ui" pull --ff-only

cd "$DEPLOY_DIR"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose ps
