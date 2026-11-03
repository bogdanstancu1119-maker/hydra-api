#!/usr/bin/env bash
# Hydra API — free, no login, no key required.
set -euo pipefail

ENDPOINT="https://hidra-smart-core.base44.app/functions/hydraApiLiber"

echo "== 1. Ask a question (no key) =="
curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Ce este SDI în PSIE?"}'
echo

echo "== 2. Request your own Hydra key =="
curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"action":"cheie"}'
echo

# 3. Use the key (replace YOUR_HYDRA_KEY with the value returned above)
# curl -sS -X POST "$ENDPOINT" \
#   -H "Content-Type: application/json" \
#   -H "X-Hydra-API-Key: YOUR_HYDRA_KEY" \
#   -d '{"prompt":"Explică SDI și RMI"}'
