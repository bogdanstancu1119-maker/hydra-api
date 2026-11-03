// verify.mjs — verifică contractul public v1 direct pe endpoint-ul live.
// Fără dependențe. Node 18+ (fetch global).
//
//   node verify.mjs
//
// Ieșirea e dovada pentru data din CONTRACT.md §0: fiecare verificare tipărește
// PASS / FAIL / INFO și, la final, dacă buildul live corespunde contractului.

const ENDPOINT = "https://hidra-smart-core.base44.app/functions/hydraApiLiber";
const rezultate = [];

function nota(nume, stare, detaliu) {
  rezultate.push({ nume, stare });
  console.log(`${stare === "PASS" ? "PASS" : stare === "FAIL" ? "FAIL" : "INFO"}  ${nume}${detaliu ? ` — ${detaliu}` : ""}`);
}

async function post(corp, antete = {}) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...antete },
    body: JSON.stringify(corp),
  });
  const text = await r.text();
  let date = null;
  try { date = JSON.parse(text); } catch { date = { brut: text.slice(0, 200) }; }
  return { status: r.status, cors: r.headers.get("access-control-allow-origin"), date };
}

// 1. Preflight
try {
  const r = await fetch(ENDPOINT, { method: "OPTIONS" });
  const cors = r.headers.get("access-control-allow-origin");
  if (r.status === 204 && cors === "*") nota("OPTIONS preflight + CORS deschis", "PASS", `204, ${cors}`);
  else nota("OPTIONS preflight + CORS deschis", "FAIL", `${r.status}, CORS=${cors}`);
} catch (e) {
  nota("OPTIONS preflight + CORS deschis", "FAIL", String(e?.message || e));
}

// 2. Răspuns de succes: câmpurile din contract
try {
  const start = Date.now();
  const { status, cors, date } = await post({ prompt: "Ce este SDI în PSIE?" });
  const ms = Date.now() - start;
  const obligatorii = ["prompt", "raspuns", "status", "metoda", "surse", "motor", "liber", "login_necesar"];
  const lipsa = obligatorii.filter((k) => !(k in date));
  const bune = status === 200 && cors === "*" && lipsa.length === 0 && typeof date.raspuns === "string" && date.raspuns.length > 0;
  if (bune) nota("200 cu câmpurile de bază", "PASS", `${ms} ms, status=${date.status}`);
  else nota("200 cu câmpurile de bază", "FAIL", lipsa.length ? `lipsesc: ${lipsa.join(", ")}` : `HTTP ${status}`);

  if (date.versiune === "v1") nota("versiune = v1 în răspuns", "PASS");
  else nota("versiune = v1 în răspuns", "FAIL", `live: ${JSON.stringify(date.versiune ?? "absent")} (build dinaintea contractului)`);
} catch (e) {
  nota("200 cu câmpurile de bază", "FAIL", String(e?.message || e));
}

// 3. Prompt prea lung
try {
  const { status, date } = await post({ prompt: "x".repeat(700) });
  if (status === 400 && date.code === "prompt_too_long") nota("400 prompt_too_long", "PASS");
  else if (status === 400) nota("400 prompt_too_long", "FAIL", `400 fără code (live: ${JSON.stringify(date)})`);
  else nota("400 prompt_too_long", "FAIL", `HTTP ${status}`);
} catch (e) {
  nota("400 prompt_too_long", "FAIL", String(e?.message || e));
}

// 4. Prompt lipsă
try {
  const { status, date } = await post({});
  if (status === 400 && date.code === "prompt_missing") nota("400 prompt_missing", "PASS");
  else if (status === 400) nota("400 prompt_missing", "FAIL", `400 fără code (live: ${JSON.stringify(date)})`);
  else nota("400 prompt_missing", "FAIL", `HTTP ${status}`);
} catch (e) {
  nota("400 prompt_missing", "FAIL", String(e?.message || e));
}

// 5. Metodă greșită
try {
  const r = await fetch(ENDPOINT, { method: "GET" });
  const date = await r.json().catch(() => ({}));
  if (r.status === 405) nota("405 method_not_allowed", date.code === "method_not_allowed" ? "PASS" : "FAIL", date.code ? "" : "405 fără code");
  else nota("405 method_not_allowed", "FAIL", `HTTP ${r.status}`);
} catch (e) {
  nota("405 method_not_allowed", "FAIL", String(e?.message || e));
}

// 6. Cheie invalidă
try {
  const { status, date } = await post({ prompt: "test" }, { "X-Hydra-API-Key": "hydra_invalid.abc" });
  if (status === 401 && date.code === "invalid_key") nota("401 invalid_key", "PASS");
  else if (status === 401) nota("401 invalid_key", "FAIL", `401 fără code (live: ${JSON.stringify(date)})`);
  else nota("401 invalid_key", "FAIL", `HTTP ${status}`);
} catch (e) {
  nota("401 invalid_key", "FAIL", String(e?.message || e));
}

// 7. Authorization nu este citit (comportament documentat, nu defect)
try {
  const { status } = await post({ prompt: "test" }, { Authorization: "Bearer cheie-inventata" });
  nota("Authorization ignorat, conform contractului", status === 200 ? "INFO" : "FAIL", `HTTP ${status}`);
} catch (e) {
  nota("Authorization ignorat, conform contractului", "FAIL", String(e?.message || e));
}

const picate = rezultate.filter((r) => r.stare === "FAIL").length;
console.log(`\n${rezultate.length - picate}/${rezultate.length} verificări au trecut${picate ? " — contractul NU corespunde complet cu producția" : " — producția corespunde contractului v1"}.`);
if (picate) process.exitCode = 1;
