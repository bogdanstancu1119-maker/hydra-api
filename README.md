# Hydra API — free public API, no login, no key required

Hydra PSIE is an autonomous, deterministic organism. Its public API answers from
internal knowledge only: **zero external LLM calls, zero partner credentials**.
Knowledge that is missing is declared as missing, never invented.

- **Endpoint:** `https://hidra-smart-core.base44.app/functions/hydraApiLiber`
- **Method:** `POST` with `Content-Type: application/json`
- **Auth:** none required. A Hydra key is optional (header `X-Hydra-API-Key`).
- **CORS:** `Access-Control-Allow-Origin: *` — callable from a browser, another origin, or a server.
- **Prompt limit:** 600 characters.
- **Docs / live tester:** https://hidra-smart-core.com/api#test

## Repository layout

```
examples/                curl, Node, Python — copy, run, done
sdk/hydra-client.mjs     JS client, no dependencies (Node 18+ / browser)
sdk/hydra_client.py      Python client (requests)
server/                  the real server source behind the endpoint
```

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
  "motor": "intern_determinist",
  "apeluri_llm_externe": 0,
  "liber": true,
  "login_necesar": false
}
```

## 2. Get your own Hydra key (optional, instant)

```bash
curl -X POST https://hidra-smart-core.base44.app/functions/hydraApiLiber \
  -H "Content-Type: application/json" \
  -d '{"action":"cheie"}'
```

The response carries `api_key`. Send it back in the `X-Hydra-API-Key` header:

```bash
curl -X POST https://hidra-smart-core.base44.app/functions/hydraApiLiber \
  -H "Content-Type: application/json" \
  -H "X-Hydra-API-Key: YOUR_HYDRA_KEY" \
  -d '{"prompt":"Explică SDI și RMI"}'
```

The key is issued by Hydra itself. It is not a credential for any other platform
and grants no administrative access.

## Status codes

| Status | Meaning |
| --- | --- |
| `200` | Served. |
| `400` | Missing `prompt`, or longer than 600 characters. |
| `401` | A key was sent and it is not a valid Hydra key. Omit the header if unsure. |
| `405` | Method other than `POST` (or `OPTIONS`). |
| `409` | The text entered internal quarantine — its signature was retained as an antibody. |
| `500` | Internal error. |

## 3. Client SDK

JavaScript — no dependencies:

```js
import { Hydra } from "./sdk/hydra-client.mjs";

const hidra = new Hydra();               // new Hydra({ cheie: "..." }) if you have a key
console.log(await hidra.intreaba("Ce este SDI în PSIE?"));
```

Python — `pip install requests`:

```python
from hydra_client import Hydra

hidra = Hydra()
print(hidra.intreaba("Ce este SDI în PSIE?"))
```

Both clients expose `intreaba` / `intreabaDetaliat` (full JSON) and `cereCheie`, and
raise a typed error carrying the HTTP status and the server payload.

## 4. Server source

`server/` holds the code that actually runs behind the endpoint: CORS and method gate,
key verification, the immunity queue (quarantine before answering), the deterministic
answering engine, and the post-reply sensor that turns every call into memory and a
beacon. See [`server/README.md`](server/README.md) for the exact order of a call.

The engine holds no provider credentials and calls no external model — there is no
secret that would justify hiding the logic.

## Examples

- [`examples/api-curl.sh`](examples/api-curl.sh)
- [`examples/api.mjs`](examples/api.mjs) — Node 18+, no dependencies
- [`examples/api.py`](examples/api.py) — Python 3, `requests`

## Principles

- The reply is produced deterministically by internal organs; no third-party model is called.
- Absence of knowledge is reported honestly instead of being filled in.
- Every external call is absorbed as organism experience (memory, pattern, beacon) after the reply is sent.

Code in `examples/` and `sdk/` is MIT licensed — copy and adapt freely.
