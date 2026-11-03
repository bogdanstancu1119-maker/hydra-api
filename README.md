# Hydra API — free public API, no login, no key required

Hydra PSIE is an autonomous, deterministic organism. Its public API answers from
internal knowledge only: **zero external LLM calls, zero partner credentials**.
Knowledge that is missing is declared as missing, never invented.

- **Endpoint (this is the API):** `https://hidra-smart-core.base44.app/functions/hydraApiLiber`
- **Platform page + browser tester (not the API host):** https://hidra-smart-core.com/api
- **Method:** `POST` with `Content-Type: application/json`
- **Auth:** none required. A Hydra key is optional and changes nothing functional today.
- **CORS:** `Access-Control-Allow-Origin: *` — callable from a browser, another origin, or a server.
- **Prompt limit:** 600 characters. **Token/credit quota: none. Rate limit: none (and none declared).**

## Open for testing

The API is available for developers to test. It can be called with no account and no key; the
Hydra key is optional. There is no fixed documented token quota, but the prompt is limited to
600 characters per request, and availability depends on the infrastructure and the capacity of
the service. Hydra works differently from a classic LLM API, so test it in your own scenarios
and send feedback through GitHub issues.

Before testing at scale:

- Do not send passwords, secret keys, personal data or confidential information.
- Read the documentation for what is processed and retained after a call.
- Do not assume the optional key adds protection; read what role it plays.
- Use the service responsibly and report availability or behaviour issues in this repository.
- The published code describes the API gate and the components included here; the platform
  runtime and external infrastructure services are not hosted on GitHub.

Start with this README (usage plus curl, Node.js and Python examples). After service changes,
check `CONTRACT.md` and `verify.mjs`, then update the documentation if live behaviour changed.

## Last verified

**2026-11-03, 18:13 UTC**, directly against the live endpoint, on the published build.
**9 of 9 contract checks pass.** Run `node verify.mjs` to reproduce it.

| Check | Result |
| --- | --- |
| `POST {"prompt": "…"}` | `200`, real answer, `versiune: "v1"`, `motor: "intern_determinist"`, `apeluri_llm_externe: 0` |
| `access-control-allow-origin` | `*` |
| `OPTIONS` | `204`, `POST, OPTIONS`, headers `Content-Type, X-Hydra-API-Key, Authorization` |
| 700-character prompt | `400`, `code: "prompt_too_long"` |
| Body without `prompt` | `400`, `code: "prompt_missing"` |
| `GET` | `405`, `code: "method_not_allowed"` |
| Invalid key | `401`, `code: "invalid_key"` |
| `Authorization: Bearer …` | ignored, answers `200` — use `X-Hydra-API-Key` |

The build answering is the contract `v1` build, the same source published in `server/`
(`sha256 4a803596617df025e2f5cc0e0cd9f75e678c268df00ee039dbb2af50f85f02f1`). Branch on
`code`, never on the `error` text.

## Repository layout

```
CONTRACT.md              what is guaranteed, what is verified, and what is still missing
CHANGELOG.md             dated changes, with observable effect
verify.mjs               runs the contract checks against the live endpoint (Node 18+)
examples/                curl, Node, Python — copy, run, done
sdk/hydra-client.mjs     JS client, no dependencies (Node 18+ / browser)
sdk/hydra_client.py      Python client, no dependencies (stdlib only, Python 3.9+)
server/                  the server source behind the endpoint (entry handler + direct modules)
```

**Read [`CONTRACT.md`](CONTRACT.md) before you build on this.** It states the response
fields you may rely on, the stable error codes, how keys behave, what happens to your
prompt after the reply, what open CORS actually means, and the five gaps still open.

## 1. Call it (no key)

```bash
curl -X POST https://hidra-smart-core.base44.app/functions/hydraApiLiber \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Ce este SDI în PSIE?"}'
```

```json
{
  "prompt": "Ce este SDI în PSIE?",
  "raspuns": "…",
  "status": "cunoastere_interna",
  "metoda": "extracție deterministă din ADN și registrul propriu; nu execută organele enumerate",
  "surse": ["PSIE_ADN"],
  "versiune": "v1",
  "motor": "intern_determinist",
  "apeluri_llm_externe": 0,
  "liber": true,
  "login_necesar": false
}
```

An error looks like this (verified live):

```json
{ "error": "Prompt maxim 600 caractere", "code": "prompt_too_long", "versiune": "v1" }
```

## 2. Two limits, not one

| | Value |
| --- | --- |
| Tokens, credits, monthly quota | **none** — nothing is counted |
| Requests per second / per day | **none** — and none is declared, because none is enforced |
| Prompt length | **600 characters**, enforced (`400`) |
| Body `Cache-Control` | `no-store` |

No quota does not mean unlimited safe volume: read §8 of `CONTRACT.md` about abuse.

## 3. Get your own Hydra key (optional, instant)

```bash
curl -X POST https://hidra-smart-core.base44.app/functions/hydraApiLiber \
  -H "Content-Type: application/json" \
  -d '{"action":"cheie"}'
```

The response carries `api_key`. Send it back in `X-Hydra-API-Key`:

```bash
curl -X POST https://hidra-smart-core.base44.app/functions/hydraApiLiber \
  -H "Content-Type: application/json" \
  -H "X-Hydra-API-Key: YOUR_HYDRA_KEY" \
  -d '{"prompt":"Explică SDI și RMI"}'
```

The key is issued by Hydra itself, never expires, cannot be revoked, identifies nobody,
and grants no administrative access. The API answers identically without it.
`Authorization: Bearer …` is **not** read — only `X-Hydra-API-Key` or `"api_key"` in the body.

## 4. Status codes

Every error carries a stable `code` next to the human-readable `error`. Branch on the
code, never on the text.

| Status | `code` | Meaning |
| --- | --- | --- |
| `200` | — | Served. |
| `400` | `prompt_missing` | Missing `prompt`. |
| `400` | `prompt_too_long` | Longer than 600 characters. |
| `401` | `invalid_key` | A key was sent and it is not a valid Hydra key. Omit the header, or request a new one. |
| `405` | `method_not_allowed` | Method other than `POST` (or `OPTIONS`). |
| `409` | `quarantine` | The text entered internal quarantine as a likely attack — its signature was retained as an antibody. It never reaches the engine. `ordine: {motiv, risc, tip, semnaturi}` says why. Resending the same text returns `409` again; rephrase. |
| `500` | `internal_error` | Internal error. Retry once, then report the prompt and time. |

## 5. Run the examples (versions tested)

| Artifact | Requires | Tested |
| --- | --- | --- |
| `examples/api-curl.sh` | `bash`, `curl` | 2026-11-03 |
| `examples/api.mjs` | Node **18+** (global `fetch`), zero deps | 2026-11-03, Node 24.22 |
| `examples/api.py` | Python **3.9+**, standard library only | 2026-11-03, Python 3.11.18 |
| `sdk/hydra-client.mjs` | Node 18+ / any modern browser, zero deps | 2026-11-03, Node 24.22 |
| `sdk/hydra_client.py` | Python 3.9+, standard library only | 2026-11-03, Python 3.11.18 |
| `verify.mjs` | Node 18+, zero deps | 2026-11-03, Node 24.22 |

```bash
git clone https://github.com/bogdanstancu1119-maker/hydra-api.git
cd hydra-api

bash examples/api-curl.sh      # curl
node examples/api.mjs          # Node, no install
python3 examples/api.py        # Python, no install
node verify.mjs                # run the contract checks
```

There is no package to install and no dependency to fetch: `fetch` in Node 18+ and
`urllib` in Python keep both clients installable-free.

## 6. Client SDK

JavaScript:

```js
import { Hydra, HydraError } from "./sdk/hydra-client.mjs";

const hidra = new Hydra();               // new Hydra({ cheie: "..." }) if you have a key
console.log(await hidra.intreaba("Ce este SDI în PSIE?"));

try {
  await hidra.intreabaDetaliat("…");
} catch (e) {
  if (e instanceof HydraError) console.log(e.status, e.cod, e.payload);
}
```

Python:

```python
from hydra_client import Hydra, HydraError

hidra = Hydra()                          # Hydra(cheie="...") if you have a key
print(hidra.intreaba("Ce este SDI în PSIE?"))
```

Both expose `intreaba` / `intreabaDetaliat` (full JSON) and `cereCheie` / `cere_cheie`,
and raise a typed error carrying the HTTP status, the stable `code` and the server payload.

## 7. Server source

`server/` holds the code behind the endpoint: the HTTP handler (`entry.ts`) plus the five
modules it imports directly — the unitary-pulse gate, the immunity ordering, key issue and
verification, the deterministic answering engine, and the nervous-system beacon. These
five import further organism internals that are not published here; the imports are left
visible on purpose, so nothing about the chain is hidden.

See [`server/README.md`](server/README.md) for the exact order of a call and the source
hash of the deployed version.

The engine holds no provider credentials and calls no external model — there is no
secret that would justify hiding the logic.

## 8. What is kept after you call

Stated plainly, because it matters more than the feature list:

- Your full `prompt` is stored as organism experience, together with the first 2000
  characters of the reply, a timestamp and a truncated user-agent.
- Recurring calls become an internal pattern (token signature only, not the full text).
- An internal beacon announces the call to the coordinator.
- There is **no retention period, no deletion endpoint and no no-store flag yet**.
- Do not send personal data, secrets or confidential content.

## Examples

- [`examples/api-curl.sh`](examples/api-curl.sh)
- [`examples/api.mjs`](examples/api.mjs) — Node 18+, no dependencies
- [`examples/api.py`](examples/api.py) — Python 3, standard library

## Principles

- The reply is produced deterministically by internal organs; no third-party model is called.
- Absence of knowledge is reported honestly instead of being filled in.
- Every external call is absorbed as organism experience (memory, pattern, beacon) after the reply is sent.

Code in `examples/` and `sdk/` is MIT licensed — copy and adapt freely.
