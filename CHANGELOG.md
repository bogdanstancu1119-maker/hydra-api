# Changelog — Hydra API

Formatul urmează [Keep a Changelog](https://keepachangelog.com/); versiunea contractului
este cea din câmpul `versiune` al răspunsului, nu un prefix în cale.

## [v1.0.0] — 2026-11-03

Prima versiune publică cu contract scris și verificabil.

### Adăugat
- `versiune: "v1"` în fiecare răspuns de succes și în fiecare eroare.
- `code` stabil în fiecare eroare: `prompt_missing`, `prompt_too_long`, `invalid_key`,
  `method_not_allowed`, `quarantine`, `internal_error`. Clientul se ramifică pe `code`,
  nu pe textul din `error`.
- `CONTRACT.md`: câmpuri garantate, limite reale, retenție, ce înseamnă CORS deschis,
  tratarea abuzului, goluri asumate.
- `CHANGELOG.md` (acest fișier).
- `verify.mjs`: verificare reproductibilă a contractului, fără dependențe.
- `sdk/hydra_client.py` și `examples/api.py` rescrise pe biblioteca standard Python:
  fără `pip install`, rulabile direct pe Python 3.9+.
- `HydraError.cod` / `HydraError.status` / `HydraError.payload` în ambele SDK-uri.

### Schimbat
- Documentația separă explicit **endpoint-ul** (`hidra-smart-core.base44.app/functions/hydraApiLiber`)
  de **pagina platformei și testerul** (`hidra-smart-core.com/api`).
- Limitele sunt scrise ca două lucruri distincte: **fără cotă de tokenuri/credite și fără
  limită de ritm** pe de o parte, **600 de caractere per prompt, aplicată** pe de altă parte.
- Autentificarea este declarată neobligatorie, iar cheia Hydra opțională și fără efect
  funcțional în `v1`.
- `Authorization: Bearer …` este documentat ca **necitit** de server (verificat 2026-11-03);
  se folosește `X-Hydra-API-Key`.
- `server/README.md` publică hash-ul sursei și spune deschis dacă buildul live corespunde.

### Verificat live (2026-11-03, 18:04 UTC)
- `POST` cu prompt scurt → `200`, `~1.7 s`, CORS `*`.
- `OPTIONS` → `204`, `POST, OPTIONS`.
- Prompt de 700 de caractere → `400`.
- `GET` → `405`.

### Rămas deschis
- Buildul care răspunde acum este dinaintea contractului: `code` și `versiune` lipsesc
  până la deploy-ul versiunii salvate. Nu se ascunde; se notează în `CONTRACT.md` §0 și
  `README.md` §Last verified.
