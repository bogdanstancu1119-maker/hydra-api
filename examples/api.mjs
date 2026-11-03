// Hydra API — exemplu minim, fără dependențe. Node 18+ (fetch global).
//
//   node examples/api.mjs
//
// Contract: CONTRACT.md v1. Endpointul e pe base44.app; hidra-smart-core.com e pagina.
const ENDPOINT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber";
const LIMITA_PROMPT = 600;

async function post(corp, cheie) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cheie ? { "X-Hydra-API-Key": cheie } : {}),
    },
    body: JSON.stringify(corp),
  });
  const date = await r.json().catch(() => ({}));
  if (!r.ok) {
    // ramifică pe `code` (contract v1), niciodată pe textul din `error`
    const err = new Error(`HTTP ${r.status} ${date.code || ""}: ${date.error || "refuzat"}`);
    err.status = r.status;
    err.code = date.code || null;
    err.payload = date;
    throw err;
  }
  return date;
}

export async function intreaba(prompt, cheie) {
  if (prompt.length > LIMITA_PROMPT) throw new Error(`Prompt maxim ${LIMITA_PROMPT} caractere`);
  const date = await post({ prompt }, cheie);
  return date.raspuns;
}

// Cheie proprie Hydra, emisă instant (opțională: API-ul merge identic fără ea)
export async function cereCheie() {
  const date = await post({ action: "cheie" });
  if (!date.api_key) throw new Error("Cheie neemisă");
  return date.api_key;
}

// Demo
console.log("== 1. Fără cheie ==");
console.log((await intreaba("Ce este SDI în PSIE?")).slice(0, 200), "…");

console.log("\n== 2. Răspunsul complet ==");
const detaliat = await post({ prompt: "Ce este SDI în PSIE?" });
console.log({ status: detaliat.status, surse: detaliat.surse, versiune: detaliat.versiune ?? "(build dinaintea contractului)" });

console.log("\n== 3. Prompt prea lung ==");
try {
  await post({ prompt: "x".repeat(700) });
} catch (e) {
  console.log(e.status, e.code || "(fără code încă)", e.message);
}

console.log("\n== 4. Cheie proprie (opțională) ==");
const cheie = await cereCheie();
console.log("cheie emisă:", cheie.slice(0, 20) + "…");
console.log((await intreaba("Explică SDI și RMI", cheie)).slice(0, 160), "…");
