"""hydra-api-client — client Python pentru API-ul public Hydra PSIE.

    from hydra_client import Hydra
    hidra = Hydra()
    print(hidra.intreaba("Ce este SDI în PSIE?"))

Necesită: requests
"""
from __future__ import annotations

import requests

ENDPOINT_IMPLICIT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber"


class HydraError(RuntimeError):
    def __init__(self, message: str, status: int = 0, payload: dict | None = None):
        super().__init__(message)
        self.status = status
        self.payload = payload or {}


class Hydra:
    def __init__(self, endpoint: str = ENDPOINT_IMPLICIT, cheie: str | None = None, timeout: int = 60):
        self.endpoint = endpoint
        self.cheie = cheie
        self.timeout = timeout

    @property
    def antete(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.cheie:
            h["X-Hydra-API-Key"] = self.cheie
        return h

    def _post(self, corp: dict) -> dict:
        r = requests.post(self.endpoint, json=corp, headers=self.antete, timeout=self.timeout)
        date = r.json() if r.content else {}
        if r.status_code != 200:
            raise HydraError(date.get("error", f"HTTP {r.status_code}"), r.status_code, date)
        return date

    def intreaba(self, prompt: str) -> str:
        """Întreabă organismul. Întoarce doar răspunsul."""
        text = (prompt or "").strip()
        if not text:
            raise HydraError("Lipsește promptul", 400)
        if len(text) > 600:
            raise HydraError("Prompt maxim 600 caractere", 400)
        return self._post({"prompt": text})["raspuns"]

    def intreaba_detaliat(self, prompt: str) -> dict:
        """Răspunsul complet: prompt, răspuns, motor, apeluri_llm_externe, liber."""
        return self._post({"prompt": (prompt or "").strip()})

    def cere_cheie(self) -> str:
        """Cere o cheie proprie Hydra, emisă instant de organism."""
        date = self._post({"action": "cheie"})
        if not date.get("api_key"):
            raise HydraError("Cheie neemisă", 200, date)
        self.cheie = date["api_key"]
        return self.cheie


if __name__ == "__main__":
    print(Hydra().intreaba("Ce este SDI în PSIE?"))
