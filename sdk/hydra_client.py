"""hydra-api-client — client Python pentru API-ul public Hydra PSIE.

Fără dependențe: doar biblioteca standard (urllib). Python 3.9+.

    from hydra_client import Hydra, HydraError
    hidra = Hydra()
    print(hidra.intreaba("Ce este SDI în PSIE?"))

Endpoint: https://hidra-smart-core.base44.app/functions/hydraApiLiber
Contract: CONTRACT.md (v1). Pagina + testerul sunt pe hidra-smart-core.com, nu aici.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional

ENDPOINT_IMPLICIT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber"
LIMITA_PROMPT = 600


class HydraError(RuntimeError):
    """Eroare de API: `status` (HTTP), `cod` (stabil, din contract) și `payload` brut."""

    def __init__(self, message: str, status: int = 0, payload: Optional[dict] = None):
        super().__init__(message)
        self.status = status
        self.payload = payload or {}
        self.cod = self.payload.get("code")


class Hydra:
    def __init__(self, endpoint: str = ENDPOINT_IMPLICIT, cheie: Optional[str] = None, timeout: int = 60):
        self.endpoint = endpoint
        self.cheie = cheie
        self.timeout = timeout

    @property
    def antete(self) -> dict:
        h = {"Content-Type": "application/json", "User-Agent": "hydra-api-client-python"}
        if self.cheie:
            h["X-Hydra-API-Key"] = self.cheie
        return h

    def _post(self, corp: dict) -> dict:
        cerere = urllib.request.Request(
            self.endpoint,
            data=json.dumps(corp).encode("utf-8"),
            headers=self.antete,
            method="POST",
        )
        try:
            with urllib.request.urlopen(cerere, timeout=self.timeout) as r:
                brut = r.read().decode("utf-8")
                return json.loads(brut) if brut else {}
        except urllib.error.HTTPError as e:
            brut = e.read().decode("utf-8", "replace")
            try:
                date: Any = json.loads(brut) if brut else {}
            except json.JSONDecodeError:
                date = {"brut": brut[:300]}
            raise HydraError(date.get("error", f"HTTP {e.code}"), e.code, date) from None
        except urllib.error.URLError as e:
            raise HydraError(f"rețea: {e.reason}", 0, {}) from None

    def intreaba(self, prompt: str) -> str:
        """Întreabă organismul. Întoarce doar textul răspunsului."""
        text = (prompt or "").strip()
        if not text:
            raise HydraError("Lipsește promptul", 400, {"code": "prompt_missing"})
        if len(text) > LIMITA_PROMPT:
            raise HydraError(f"Prompt maxim {LIMITA_PROMPT} caractere", 400, {"code": "prompt_too_long"})
        return self._post({"prompt": text})["raspuns"]

    def intreaba_detaliat(self, prompt: str) -> dict:
        """Răspunsul complet: raspuns, status, metoda, surse, versiune, motor."""
        return self._post({"prompt": (prompt or "").strip()})

    def cere_cheie(self) -> str:
        """Cere o cheie proprie Hydra, emisă instant de organism (opțională)."""
        date = self._post({"action": "cheie"})
        if not date.get("api_key"):
            raise HydraError("Cheie neemisă", 200, date)
        self.cheie = date["api_key"]
        return self.cheie


if __name__ == "__main__":
    try:
        print(Hydra().intreaba("Ce este SDI în PSIE?"))
    except HydraError as e:
        print(f"eroare {e.status} {e.cod or ''}: {e}")
