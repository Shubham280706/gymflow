#!/usr/bin/env bash
# Starts a local n8n wired to this app. Usage: npm run n8n
set -euo pipefail
cd "$(dirname "$0")/.."

# read CRON_SECRET from .env.local without exporting everything else
CRON_SECRET="$(grep -E '^CRON_SECRET=' .env.local | cut -d= -f2-)"
[ -n "$CRON_SECRET" ] || { echo "CRON_SECRET missing in .env.local" >&2; exit 1; }

export N8N_USER_FOLDER="$PWD/.n8n"                 # workflows + credentials live here (git-ignored)
export N8N_PORT="${N8N_PORT:-5678}"
export GENERIC_TIMEZONE="Asia/Kolkata"
export TZ="Asia/Kolkata"
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false          # the workflows read $env.GYMFLOW_*
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_PERSONALIZATION_ENABLED=false

export GYMFLOW_URL="${GYMFLOW_URL:-http://localhost:3000}"
export GYMFLOW_SECRET="$CRON_SECRET"
export WHATSAPP_PHONE_NUMBER_ID="${WHATSAPP_PHONE_NUMBER_ID:-REPLACE_WITH_PHONE_NUMBER_ID}"

exec npx --yes n8n@2.46.6 start
