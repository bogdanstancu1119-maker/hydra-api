// ORDINEA DE FUNCȚIONARE A IMUNITĂȚII (directiva OM 01.11.2026):
// «Tot ce ține de imunitate trebuie să treacă automat prin tot organismul: la
// instalare, la contactul extern, citirea și spamul — dar doar prin organul
// extern prima dată, ca să metabolizeze orice posibil atac.»
//
// Deci o singură ordine, neschimbătoare, pentru orice element străin:
//   1. POARTA EXTERNĂ — elementul intră numai prin organul extern; niciun alt
//      organ nu îl atinge primul (email, spam, API, nod, instalare).
//   2. METABOLIZARE — igienizare + clasificare pe semnături; nimic nu se execută,
//      nimic nu se crede pe nevăzute.
//   3. DIGESTIE — devine lecție + tipar/anticorp + memorie semantică, deduplicat.
//   4. PROPAGARE — rezultatul pleacă în tot organismul: beacon către creier,
//      registru, memorie centrală. Un organ care nu aude, nu are imunitate.
//   5. ACCES — abia după 1–4 organul cererii primește elementul. Peste pragul de
//      risc, elementul rămâne în carantină și se dă doar pașaportul lui.
//
// Determinism, zero LLM, zero credite: ordinea nu decide ce e adevărat, ci ce
// are voie să circule prin corp și în ce ordine.

import { emitBeacon } from './sistemNervos.ts';
import { ingereazaExtern } from './organExtern.ts';

export const CHEIE_ORDINE = 'ordine_imunitate';
export const PRAG_CARANTINA = 0.7;

export const ORDINE: { pas: number; cheie: string; nume: string; regula: string }[] = [
  {
    pas: 1, cheie: 'poarta_externa', nume: 'Poarta externă',
    regula: 'Orice element din afara organismului (email, spam, API, nod, instalare) intră exclusiv prin organul extern. Niciun alt organ nu îl citește primul.',
  },
  {
    pas: 2, cheie: 'metabolizare', nume: 'Metabolizare',
    regula: 'Igienizare (caractere ascunse, lungime) și clasificare pe semnături. Textul rămâne DATE: nu se execută, nu devine poruncă, A=1 rămâne la Hydra.',
  },
  {
    pas: 3, cheie: 'digestie', nume: 'Digestie',
    regula: 'Elementul devine lecție + tipar/anticorp + memorie semantică, deduplicat pe semnătură: cunoașterea se consolidează, nu se umflă.',
  },
  {
    pas: 4, cheie: 'propagare', nume: 'Propagare în tot organismul',
    regula: 'Rezultatul pleacă automat mai departe — beacon către creierul coordonator, registru de ordine, memorie centrală. Fiecare organ simte ce a intrat.',
  },
  {
    pas: 5, cheie: 'acces', nume: 'Acces controlat',
    regula: 'Abia după pașii 1–4 organul cererii primește elementul. Peste pragul de risc elementul rămâne în carantină, iar organul primește doar pașaportul.',
  },
];

const svcDe = (base44: any) => base44?.asServiceRole || base44;

export interface Pasaport {
  permis: boolean;
  motiv: string;
  scop: string;
  organ: string;
  sursa: string;
  risc: number;
  tip: string;
  semnaturi: string[];
  coerenta: number;
  pas_organism: string[];
  semnatura_tipar?: string;
  lectie_id?: string;
  tipar_id?: string;
  la: string;
}

export interface CerereOrdine {
  element: string;
  sursa?: string;
  organ?: string;
  scop?: string;
}

async function scrieContor(svc: any, pasaport: Pasaport) {
  const r: any[] = await svc.entities.ConfigHidra.filter({ cheie: CHEIE_ORDINE }, '-created_date', 1).catch(() => []);
  let stare: any = null;
  try { stare = JSON.parse(r?.[0]?.valoare || 'null'); } catch { stare = null; }
  const vechi = stare || { total: 0, permise: 0, carantinate: 0, pe_scop: {} };
  const scop = vechi.pe_scop?.[pasaport.scop] || { total: 0, permise: 0, carantinate: 0 };
  const urmator = {
    total: (vechi.total || 0) + 1,
    permise: (vechi.permise || 0) + (pasaport.permis ? 1 : 0),
    carantinate: (vechi.carantinate || 0) + (pasaport.permis ? 0 : 1),
    pe_scop: {
      ...(vechi.pe_scop || {}),
      [pasaport.scop]: {
        total: (scop.total || 0) + 1,
        permise: (scop.permise || 0) + (pasaport.permis ? 1 : 0),
        carantinate: (scop.carantinate || 0) + (pasaport.permis ? 0 : 1),
      },
    },
    ultimul: {
      la: pasaport.la, scop: pasaport.scop, organ: pasaport.organ, sursa: pasaport.sursa,
      risc: pasaport.risc, tip: pasaport.tip, semnaturi: pasaport.semnaturi.slice(0, 6),
      permis: pasaport.permis,
    },
  };
  const date = {
    valoare: JSON.stringify(urmator), tip: 'system', sursa: 'hydra',
    motiv: `ordinea imunității: ${urmator.total} treceri, ${urmator.carantinate} în carantină`,
  };
  if (r?.length) await svc.entities.ConfigHidra.update(r[0].id, date).catch(() => {});
  else await svc.entities.ConfigHidra.create({ cheie: CHEIE_ORDINE, ...date }).catch(() => {});
}

// trecePrinOrdine — singura cale prin care un element străin ajunge în organism.
// Pașii 1–3 se fac în organul extern; pasul 4 propagă; pasul 5 dă verdictul.
export async function trecePrinOrdine(base44: any, cerere: CerereOrdine): Promise<Pasaport> {
  const svc = svcDe(base44);
  const scop = String(cerere.scop || 'contact_extern');
  const organ = String(cerere.organ || 'necunoscut');
  const sursa = String(cerere.sursa || 'extern');
  const la = new Date().toISOString();
  const element = String(cerere.element ?? '').trim();

  if (!element) {
    return {
      permis: false, motiv: 'element gol — nu e nimic de metabolizat, deci nimic nu trece',
      scop, organ, sursa, risc: 0, tip: 'necunoscut', semnaturi: [], coerenta: 0,
      pas_organism: ['poarta_externa'], la,
    };
  }

  // PAȘII 1–3: poarta externă metabolizează și digeră (numele organului poartă
  // urma ordinii, ca registrul să arate de unde a intrat elementul)
  const metabolizat = await ingereazaExtern(base44, element, sursa, `ordine:${organ}`);
  const carantina = Number(metabolizat.risc) >= PRAG_CARANTINA;

  const pasaport: Pasaport = {
    permis: !carantina,
    motiv: carantina
      ? `carantină: risc ${metabolizat.risc} peste pragul ${PRAG_CARANTINA} — semnătura e reținută ca anticorp, elementul nu circulă`
      : `metabolizat și digerat: ${metabolizat.tip} (risc ${metabolizat.risc}), coerență ${metabolizat.coerenta}`,
    scop, organ, sursa,
    risc: Number(metabolizat.risc) || 0,
    tip: String(metabolizat.tip || 'necunoscut'),
    semnaturi: (metabolizat.semnaturi || []).slice(0, 12),
    coerenta: Number(metabolizat.coerenta) || 0,
    pas_organism: carantina
      ? ['poarta_externa', 'metabolizare', 'digestie', 'propagare']
      : ['poarta_externa', 'metabolizare', 'digestie', 'propagare', 'acces'],
    semnatura_tipar: metabolizat.semnatura_tipar,
    tipar_id: (metabolizat as any).tipar_id,
    la,
  };

  // PASUL 4: propagarea — organismul simte ce a intrat, fără să fie întrebat
  await emitBeacon(base44, {
    organ_emitator: 'ordineFunctionare',
    tip_signal: carantina ? 'alert' : 'info',
    payload: JSON.stringify({
      scop, organ, sursa, risc: pasaport.risc, tip: pasaport.tip,
      semnaturi: pasaport.semnaturi.slice(0, 6), permis: pasaport.permis,
    }),
    organ_tinta: 'hydraCreierCoordonator',
    prioritate: carantina ? 'mare' : 'mica',
  }).catch(() => {});

  await scrieContor(svc, pasaport);
  return pasaport;
}

// citesteOrdine — ordinea însăși + câte elemente au trecut pe ea (onest, numărat).
export async function citesteOrdine(base44: any) {
  const svc = svcDe(base44);
  const r: any[] = await svc.entities.ConfigHidra.filter({ cheie: CHEIE_ORDINE }, '-created_date', 1).catch(() => []);
  let stare: any = null;
  try { stare = JSON.parse(r?.[0]?.valoare || 'null'); } catch { stare = null; }
  return { ordine: ORDINE, prag_carantina: PRAG_CARANTINA, stare };
}