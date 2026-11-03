#!/usr/bin/env bash
# Hydra API — exemplu complet cu curl. Fără login, fără cheie obligatorie.
# Contract: CONTRACT.md v1. Endpointul e pe base44.app; hidra-smart-core.com e pagina.
set -euo pipefail

ENDPOINT="https://hidra-smart-core.base44.app/functions/hydraApiLiber"

echo "== 1. Întrebare (fără cheie) =="
curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Ce este SDI în PSIE?"}' \
  -w '\nHTTP %{http_code}\n' | head -c 900
echo

echo "== 2. Prompt prea lung — 400 =="
curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$(printf 'x%.0s' {1..700})\"}" \
  -w '\nHTTP %{http_code}\n'
echo

echo "== 3. Metodă greșită — 405 =="
curl -sS -X GET "$ENDPOINT" -w '\nHTTP %{http_code}\n'
echo

echo "== 4. Cheie proprie Hydra (opțională, emisă instant) =="
curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"action":"cheie"}' \
  -w '\nHTTP %{http_code}\n' | head -c 600
echo

# 5. Cu cheia primită (înlocuiește YOUR_HYDRA_KEY):
#    se folosește antetul X-Hydra-API-Key; Authorization: Bearer NU este citit
# curl -sS -X POST "$ENDPOINT" \
#   -H "Content-Type: application/json" \
#   -H "X-Hydra-API-Key: YOUR_HYDRA_KEY" \
#   -d '{"prompt":"Explică SDI și RMI"}'
