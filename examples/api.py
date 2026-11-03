"""Hydra API — free public endpoint, no login, no key required."""
import requests

ENDPOINT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber"


def intreaba(prompt: str, cheie: str | None = None) -> str:
    if len(prompt) > 600:
        raise ValueError("Prompt maxim 600 caractere")

    headers = {"Content-Type": "application/json"}
    if cheie:
        headers["X-Hydra-API-Key"] = cheie

    r = requests.post(ENDPOINT, json={"prompt": prompt}, headers=headers, timeout=60)
    date = r.json()
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {date.get('error', 'cerere refuzată')}")
    return date["raspuns"]


def cere_cheie() -> str:
    r = requests.post(ENDPOINT, json={"action": "cheie"}, timeout=60)
    date = r.json()
    if r.status_code != 200 or "api_key" not in date:
        raise RuntimeError(f"HTTP {r.status_code}: cheie neemisă")
    return date["api_key"]


if __name__ == "__main__":
    print(intreaba("Ce este SDI în PSIE?"))
