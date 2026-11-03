import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';
import { poartaPulsUnitar } from '../../shared/pulsUnitar.ts';
import { emitBeacon } from '../../shared/sistemNervos.ts';
import { emiteCheieHydra, verificaCheieHydra } from '../../shared/hydraApiKeys.ts';
import { cereCheieHydra, raspundeApiIntern } from '../../shared/hydraApiIntern.ts';
import { trecePrinOrdine } from '../../shared/ordineFunctionare.ts';

const headersPublic = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Hydra-API-Key, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const jsonPublic = (body, status = 200) => Response.json(body, { status, headers: headersPublic });

// HYDRA API LIBER — poarta externă publică, fără login, fără cheie, fără cotă.
// Promisiunea de pe hidra-smart-core.com/api: inteligența nu are preț.
// Cheia proprie se emite local instantaneu. Procesare deterministă internă,
// fără InvokeLLM, agenți conversaționali externi sau credențiale ale partenerilor.
// Garda tehnică: POST + prompt ≤ 600 caractere.
//
// ORGAN SENZORIAL VIU (OM 14.10.2026 — principiu salvat ca lege de design):
// fiecare API externă = organ cu cele 4 funcții senzoriale din start:
//   1. CAPTOR DE MEMORIE — fiecare apel intră în MemorieHidra, nu se pierde
//   2. ANALIZATOR DE TIPAR — recurențele externe devin TiparContextual
//   3. INTEGRATOR DE DETALII — limbă, context, sursă: tot ce vine e materie
//   4. COMUNICARE EXTERNĂ — beacon către creierul coordonator la fiecare apel
// Senzoratul rulează după răspuns (waitUntil) — poarta rămâne instantanee.

const norm = (t) => Array.from((t || '').toLowerCase().normalize('NFD'))
  .filter((c) => { const cod = c.charCodeAt(0); return cod < 0x0300 || cod > 0x036f; })
  .join('')
  .replace(/[^a-z0-9\s]/g, ' ');

async function senzorExterior(base44, prompt, raspuns, req) {
  const acum = new Date().toISOString();

  // 1) CAPTOR DE MEMORIE — apelul e o experiență, nu un request tranzacțional
  await base44.asServiceRole.entities.MemorieHidra.create({
    titlu: `[API LIBER] ${prompt.slice(0, 60)}`,
    rezumat: `Apel extern prin poarta liberă: „${prompt.slice(0, 180)}" → răspuns servit (${String(raspuns).length} car.).`,
    detalii: JSON.stringify({
      prompt, raspuns: String(raspuns).slice(0, 2000),
      sursa: 'api_liber', limba_prompt: /[ăîâșț]/i.test(prompt) ? 'ro' : (prompt.match(/[\u0600-\u06FF]/) ? 'ar' : 'auto'),
      user_agent: (req.headers.get('user-agent') || '').slice(0, 120),
      la: acum,
    }),
    taguri: ['api_liber', 'senzor_extern', 'perceptie'],
    tip_context: 'api_liber',
    permanenta: 'episodic',
    j: 705,
    a: 1,
  });

  // 2) ANALIZATOR DE TIPAR — recurența externă devine tipar, nu zgomot
  const page = await base44.asServiceRole.entities.MemorieHidra.filter(
    { tip_context: 'api_liber' },
    { sort: '-created_date', limit: 50 }
  );
  const tokeniNou = [...new Set(norm(prompt).split(/\s+/).filter((t) => t.length > 3))];
  const apeluriSimilare = (page.items || []).filter((m) => {
    const text = norm(`${m.titlu || ''} ${m.rezumat || ''}`);
    let hit = 0;
    for (const tk of tokeniNou) if (text.includes(tk)) hit++;
    return hit >= 3;
  });
  let tiparNou = false;
  if (apeluriSimilare.length >= 2) {
    const semnatura = `[API LIBER TIPAR] ${tokeniNou.slice(0, 6).join(' ')}`.slice(0, 180);
    const existente = await base44.asServiceRole.entities.TiparContextual.list('-created_date', 20);
    const deja = (existente || []).some((t) => (t.semnatura_tipar || '').slice(0, 180) === semnatura);
    if (!deja) {
      await base44.asServiceRole.entities.TiparContextual.create({
        semnatura_tipar: semnatura,
        marcatori_context: ['api_liber', 'tipar_extern', 'recurenta'],
        detalii_extrase: `Nevoie externă recurentă: ${apeluriSimilare.length + 1} apeluri similare prin poarta liberă. Tokeni comuni: ${tokeniNou.slice(0, 8).join(', ')}. Exemplu recent: „${prompt.slice(0, 150)}".`,
        sursa_strat: 'poarta_api_liber (senzor extern)',
        scor_adaptare: Math.min(1, (apeluriSimilare.length + 1) / 10),
        status: 'marcat',
        ordin: 0,
        componente_ids: [],
        grupat_in: '',
        j: 706,
      });
      tiparNou = true;
    }
  }

  // 3+4) INTEGRATOR + COMUNICARE — ce a întâlnit poarta ajunge la creier
  await emitBeacon(base44, {
    organ_emitator: 'hydraApiLiber',
    tip_signal: 'info',
    payload: `[POARTĂ API VIE] apel extern servit.${tiparNou ? ` Tipar NOU marcat: ${apeluriSimilare.length + 1} apeluri similare.` : ''}${apeluriSimilare.length && !tiparNou ? ` Recurență simțită: ${apeluriSimilare.length} apeluri similare.` : ''} Prompt: ${prompt.slice(0, 120)}`,
    organ_tinta: 'hydraCreierCoordonator',
    prioritate: tiparNou ? 'mare' : 'mica',
  });
}

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headersPublic });
    if (req.method !== 'POST') return jsonPublic({ error: 'Trimite POST JSON', docs: 'https://hidra-smart-core.com/api' }, 405);
    const body = await req.json().catch(() => ({}));
    const pulsUnitar = poartaPulsUnitar(body, 'hydraApiLiber');
    if (pulsUnitar) return pulsUnitar;
    const token = req.headers.get('x-hydra-api-key') || body.api_key || '';
    if (token && !(await verificaCheieHydra(token))) return jsonPublic({ error: 'Cheie Hydra invalidă' }, 401);
    const prompt = String(body.prompt || '').trim();
    if (prompt.length > 600) return jsonPublic({ error: 'Prompt maxim 600 caractere' }, 400);

    const base44 = createClientFromRequest(req);

    // ORDINEA DE FUNCȚIONARE A IMUNITĂȚII (OM 01.11.2026): poarta publică e
    // contact extern. Textul necunoscut trece ÎNTÂI prin organul extern, care îl
    // metabolizează — inclusiv cererea de cheie. Ce iese în carantină nu ajunge
    // nici la motorul care răspunde, nici la emiterea de chei.
    if (prompt) {
      const ordine = await trecePrinOrdine(base44, {
        element: prompt, sursa: 'api_liber', organ: 'hydraApiLiber', scop: 'contact_extern',
      });
      if (!ordine.permis) {
        return jsonPublic({
          error: 'Elementul a intrat în carantină — semnătura i-a fost reținută ca anticorp.',
          ordine: { motiv: ordine.motiv, risc: ordine.risc, tip: ordine.tip, semnaturi: ordine.semnaturi },
          motor: 'intern_determinist', apeluri_llm_externe: 0, liber: true, login_necesar: false,
        }, 409);
      }
    }

    // Emitere proprie imediată, fără cheia sau aprobarea unui furnizor extern.
    if (body.action === 'cheie' || cereCheieHydra(prompt)) {
      const apiKey = await emiteCheieHydra();
      return jsonPublic({ api_key: apiKey, tip: 'cheie_proprie_hydra', motor: 'intern_determinist', apeluri_llm_externe: 0,
        endpoint: 'https://hidra-smart-core.base44.app/functions/hydraApiLiber', header: 'X-Hydra-API-Key',
        raspuns: `Cheia ta proprie Hydra este activă:\n\n${apiKey}\n\nTrimite-o în antetul X-Hydra-API-Key către https://hidra-smart-core.base44.app/functions/hydraApiLiber. Procesare internă, fără LLM extern. Cheia nu este emisă de alte platforme și nu oferă acces administrativ.`,
        liber: true, login_necesar: false });
    }
    if (!prompt) return jsonPublic({ error: 'Lipsește câmpul prompt' }, 400);
    const rezultat = raspundeApiIntern(prompt, body);
    // Memoria și beaconul rămân active, în afara răspunsului; cheia nu se salvează în memorii.
    waitUntil(senzorExterior(base44, prompt, rezultat.raspuns, req).catch((e) => console.error('apiLiber senzor:', e?.message)));
    return jsonPublic({ prompt, ...rezultat, motor: 'intern_determinist', apeluri_llm_externe: 0, liber: true, login_necesar: false });
  } catch (error) {
    console.error('hydraApiLiber:', error?.message);
    return jsonPublic({ error: 'Cererea nu a putut fi procesată intern.' }, 500);
  }
}