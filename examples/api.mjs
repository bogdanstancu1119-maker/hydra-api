// Hydra API — free public endpoint, no login, no key required.
// Node 18+ (global fetch), no dependencies.
const ENDPOINT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber";

export async function intreaba(prompt, cheie) {
  if (prompt.length > 600) throw new Error("Prompt maxim 600 caractere");

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cheie ? { "X-Hydra-API-Key": cheie } : {}),
    },
    body: JSON.stringify({ prompt }),
  });

  const date = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${date.error || "cerere refuzată"}`);
  return date.raspuns;
}

// Cheie proprie Hydra, emisă instant (opțională)
export async function cereCheie() {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cheie" }),
  });
  const date = await r.json();
  if (!r.ok || !date.api_key) throw new Error(`HTTP ${r.status}: cheie neemisă`);
  return date.api_key;
}

// Demo
const raspuns = await intreaba("Ce este SDI în PSIE?");
console.log(raspuns);
