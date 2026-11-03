"""Hydra API — exemplu minim, fără dependențe (biblioteca standard Python 3.9+).

Rulare:
    python3 examples/api.py

Contract: CONTRACT.md v1. Endpoint-ul e pe base44.app; hidra-smart-core.com este pagina.
"""
import json
import urllib.error
import urllib.request

ENDPOINT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber"
LIMITA_PROMPT = 600


def post(corp: dict, cheie: str | None = None) -> tuple[int, dict]:
    antete = {"Content-Type": "application/json"}
    if cheie:
        antete["X-Hydra-API-Key"] = cheie
    cerere = urllib.request.Request(
        ENDPOINT, data=json.dumps(corp).encode("utf-8"), headers=antete, method="POST"
    )
    try:
        with urllib.request.urlopen(cerere, timeout=60) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        brut = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(brut)
        except json.JSONDecodeError:
            return e.code, {"brut": brut[:300]}


def intreaba(prompt: str, cheie: str | None = None) -> str:
    if len(prompt) > LIMITA_PROMPT:
        raise ValueError(f"Prompt maxim {LIMITA_PROMPT} caractere")
    status, date = post({"prompt": prompt}, cheie)
    if status != 200:
        # ramifică pe `code` (contract v1), nu pe textul din `error`
        raise RuntimeError(f"HTTP {status} {date.get('code', '')}: {date.get('error', 'refuzat')}")
    return date["raspuns"]


def cere_cheie() -> str:
    status, date = post({"action": "cheie"})
    if status != 200 or "api_key" not in date:
        raise RuntimeError(f"HTTP {status}: cheie neemisă")
    return date["api_key"]


if __name__ == "__main__":
    print("== 1. Fără cheie ==")
    print(intreaba("Ce este SDI în PSIE?")[:400], "…\n")

    print("== 2. Prompt prea lung (400) ==")
    status, date = post({"prompt": "x" * 700})
    print(status, json.dumps(date, ensure_ascii=False), "\n")

    print("== 3. Cheie proprie (opțională) ==")
    cheie = cere_cheie()
    print("cheie emisă:", cheie[:20] + "…")
    print(intreaba("Explică SDI și RMI", cheie)[:200], "…")
