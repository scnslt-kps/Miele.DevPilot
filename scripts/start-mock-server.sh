#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export OPENAI_MOCK=true
export BASE_PATH="${BASE_PATH:-/Miele.DevPilot}"
export PORT="${PORT:-3000}"

node server.mjs
