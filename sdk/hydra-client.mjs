// @hydra/api-client — client Node/browser pentru API-ul public Hydra PSIE.
// Fără dependențe. Node 18+ sau orice browser modern (fetch global).
//
//   import { Hydra, HydraError } from "./hydra-client.mjs";
//   const hidra = new Hydra();
//   console.log(await hidra.intreaba("Ce este SDI în PSIE?"));
//
// Contract: CONTRACT.md v1. Endpointul e pe base44.app; hidra-smart-core.com e pagina.

const ENDPOINT_IMPLICIT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber";
const LIMITA_PROMPT = 600;

export class HydraError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "HydraError";
    this.status = status;          // HTTP real (0 = eroare de rețea)
    this.payload = payload || {};  // corpul brut al serverului
    this.cod = this.payload.code || null; // codul stabil din contractul v1
  }
}

export class Hydra {
  constructor({ endpoint = ENDPOINT_IMPLICIT, cheie = null, timeoutMs = 60000 } = {}) {
    this.endpoint = endpoint;
    this.cheie = cheie;
    this.timeoutMs = timeoutMs;
  }

  get antete() {
    return {
      "Content-Type": "application/json",
      ...(this.cheie ? { "X-Hydra-API-Key": this.cheie } : {}),
    };
  }

  async _post(corp) {
    const control = new AbortController();
    const ceas = setTimeout(() => control.abort(), this.timeoutMs);
    try {
      const r = await fetch(this.endpoint, {
        method: "POST",
        headers: this.antete,
        body: JSON.stringify(corp),
        signal: control.signal,
      });
      const date = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new HydraError(date.error || `HTTP ${r.status}`, r.status, date);
      }
      return date;
    } finally {
      clearTimeout(ceas);
    }
  }

  /** Întreabă organismul. Întoarce doar răspunsul. */
  async intreaba(prompt) {
    const text = String(prompt || "").trim();
    if (!text) throw new HydraError("Lipsește promptul", 400, { code: "prompt_missing" });
    if (text.length > LIMITA_PROMPT) throw new HydraError(`Prompt maxim ${LIMITA_PROMPT} caractere`, 400, { code: "prompt_too_long" });
    const date = await this._post({ prompt: text });
    return date.raspuns;
  }

  /** Răspunsul complet: prompt, raspuns, status, metoda, surse, versiune, motor. */
  async intreabaDetaliat(prompt) {
    return this._post({ prompt: String(prompt || "").trim() });
  }

  /** Cere o cheie proprie Hydra, emisă instant de organism (opțională). */
  async cereCheie() {
    const date = await this._post({ action: "cheie" });
    if (!date.api_key) throw new HydraError("Cheie neemisă", 200, date);
    this.cheie = date.api_key;
    return date.api_key;
  }
}

export default Hydra;
