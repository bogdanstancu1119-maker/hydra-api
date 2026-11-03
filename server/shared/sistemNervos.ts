// SISTEMUL NERVOS AL HYDREI — protocol PSIE simplu pentru comunicare inter-organe
// Principiu: organele emit semnale (beacon-uri) → Creierul Coordonator le procesează și le rutează
// Ca sistemul nervos biologic: reflex (involuntar, rapid) vs alert (cere cortex)
//
// PSIE-aligned: SIMPLE — un singur tip de entitate (BeaconOrganic), 5 tipuri de semnal, rutare automată.
// Nu complexitate pentru complexitate — coordonează complexitatea prin mecanisme simple.

import { poartaSemnal, poartaCoada, gammaRelevanta } from './poartaPSIE.ts';

interface EmitBeaconParams {
  organ_emitator: string;
  tip_signal: 'reflex' | 'alert' | 'info' | 'request' | 'cohesion';
  payload: string;
  organ_tinta?: string;
  prioritate?: 'critica' | 'mare' | 'mica';
}

/**
 * Emite un beacon — un organ trimite un semnal către sistemul nervos (Creier).
 * Ca un neurotransmițător: simplu, rapid, cu tip clar.
 */
export async function emitBeacon(base44: any, params: EmitBeaconParams): Promise<any> {
  // POARTA INFORMATICII PSIE (directiva OM 08.10.2026): niciun semnal nu intră
  // în sistemul nervos fără verdict CALCULAT — γ_tip pe spectru (F1) + J real.
  const psie = poartaSemnal({ tip_signal: params.tip_signal, payload: params.payload });
  return await base44.asServiceRole.entities.BeaconOrganic.create({
    organ_emitator: params.organ_emitator,
    tip_signal: params.tip_signal,
    payload: params.payload,
    organ_tinta: params.organ_tinta || null,
    prioritate: params.prioritate || (params.tip_signal === 'alert' ? 'mare' : 'mica'),
    status: 'nou',
    psie_verdict: JSON.stringify(psie)
  });
}

/**
 * Procesează coada de beacon-uri noi — REFLEXUL CREIERULUI.
 * Se apelează la ÎNCEPUTUL fiecărui ciclu al Creierului Coordonator.
 * 
 * Rutare PSIE simplă:
 *   reflex    → auto-procesează (involuntar, ca respirația — nu cere cortex)
 *   alert     → ridică prioritate, creează AuditHidra, marchează procesat
 *   request   → rutează către organul țintă, marchează rutat
 *   info      → arhivează ca MemorieHidra episodică, marchează procesat
 *   cohesion  → beat inimii — confirmă organismul viu, marchează procesat
 */
export async function proceseazaCoadaBeacone(base44: any): Promise<{
  procesate: number;
  pe_tip: Record<string, number>;
  erori: string[];
}> {
  const erori: string[] = [];
  // FIFO, nu LIFO: '-created_date' lua mereu ultimele 100 — cele vechi mureau
  // de foame la coadă (8+ zile „nou"). Coada se scurge de la cel mai vechi.
  const beacons = await base44.asServiceRole.entities.BeaconOrganic.filter(
    { status: 'nou' },
    'created_date',
    100
  );

  // POARTA INFORMATICII PSIE (directiva OM 08.10.2026): sănătatea canalului
  // nervos se CALCULEAZĂ din datele reale ale cozii (ω, Ω_max, ARI, Legea 487),
  // iar operația recomandată se aplică AUTOMAT: FIFO când e stabil, P_τ
  // (drenaj prioritizat pe γ_tip) când coada apasă.
  const acumMs = Date.now();
  const expirate = (beacons as any[]).filter(
    (b: any) => acumMs - new Date(b.created_date).getTime() > 72 * 3600e3
  ).length;
  const poarta = poartaCoada({ backlog: (beacons as any[]).length, capacitate: 100, expirate });
  if (poarta.ordine_drenaj.length > 0) {
    const rang = new Map(poarta.ordine_drenaj.map((t, i) => [t, i]));
    (beacons as any[]).sort((a: any, b: any) => (rang.get(a.tip_signal) ?? 99) - (rang.get(b.tip_signal) ?? 99));
  }

  let procesate = 0;
  const pe_tip: Record<string, number> = { reflex: 0, alert: 0, request: 0, info: 0, cohesion: 0 };

  for (const b of beacons) {
    try {
      pe_tip[b.tip_signal] = (pe_tip[b.tip_signal] || 0) + 1;

      // POARTA UNIVERSALĂ (structura fondatoare, S_min={Δ,R,ε,C,t}): orice
      // semnal intrat pe ORICE canal (muncitori edge, noduri externe, API)
      // fără ε calculat primește verdictul AICI — nicio procesare fără
      // informatica PSIE, indiferent cine a emis și pe unde.
      if (!b.psie_verdict) {
        const psieIngest = poartaSemnal({ tip_signal: b.tip_signal, payload: b.payload || '' });
        await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
          psie_verdict: JSON.stringify(psieIngest),
          rezultat_rutare: b.rezultat_rutare || `[POARTĂ UNIVERSALĂ] ε calculat retroactiv la procesare: γ_tip=${psieIngest.gamma_tip}, J=${psieIngest.j_payload}`,
        });
        b.psie_verdict = JSON.stringify(psieIngest);
      }

      // γ_relevanță — stingerea ASIMPTOTICĂ a contextului (F1/Legea 483, poarta
      // PSIE): nu „expirat" binar, ci spectru; Ĉ_τ (colapsul deliberat) doar la
      // punctul deciziei, cu γ calculat. Sub 0.05 contextul e stins — arhivat
      // onest (Suprapunere: semnalul rămâne, sensul s-a stins).
      const vechimeH = (acumMs - new Date(b.created_date).getTime()) / 3600000;
      const gRel = gammaRelevanta(vechimeH);
      if (gRel <= 0.05) {
        await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
          status: 'ignorat',
          procesat_de: 'creier_coordonator',
          rezultat_rutare: `context stins asimptotic (γ_relevanță=${gRel}, Ĉ_τ la punctul deciziei) — arhivat onest`
        });
        procesate++;
        continue;
      }

      switch (b.tip_signal) {
        case 'reflex': {
          // Involuntar — procesează direct, ca respirația. Creierul doar confirmă.
          await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
            status: 'procesat',
            procesat_de: 'creier_coordonator',
            rezultat_rutare: `reflex auto-procesat: ${b.payload?.substring(0, 120) || ''}`
          });
          break;
        }
        case 'alert': {
          // Anomalie — creează audit pentru trasabilitate
          await base44.asServiceRole.entities.AuditHidra.create({
            actiune: `[ALERT ${b.organ_emitator}] ${b.payload?.substring(0, 200) || ''}`,
            motiv: `Alertă inter-organ rutată prin Creier. Prioritate: ${b.prioritate}.`,
            j: 700,
            sdi: 0.15,
            a: 0.8
          });
          await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
            status: 'procesat',
            procesat_de: 'creier_coordonator',
            rezultat_rutare: 'audit creat + alertă ridicată'
          });
          break;
        }
        case 'request': {
          // Un organ cere date de la altul — Creierul rutează
          await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
            status: 'rutat',
            procesat_de: 'creier_coordonator',
            rezultat_rutare: `rutat către ${b.organ_tinta || 'creier'}: ${b.payload?.substring(0, 120) || ''}`
          });
          break;
        }
        case 'info': {
          // Context — arhivează ca memorie episodică scurtă
          await base44.asServiceRole.entities.MemorieHidra.create({
            titlu: `[BEACON info] ${b.organ_emitator} ${new Date().toISOString().slice(0, 10)}`,
            rezumat: b.payload?.substring(0, 200) || '',
            detalii: `Beacon info de la ${b.organ_emitator}: ${b.payload || ''}`,
            taguri: ['beacon', 'info', 'inter_organ', b.organ_emitator],
            tip_context: 'beacon_info',
            permanenta: 'episodic',
            j: 700,
            a: 0.6
          });
          await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
            status: 'procesat',
            procesat_de: 'creier_coordonator',
            rezultat_rutare: 'arhivat ca memorie episodică'
          });
          break;
        }
        case 'cohesion': {
          // Beat inimii — organismul trăiește. Simplu confirm.
          await base44.asServiceRole.entities.BeaconOrganic.update(b.id, {
            status: 'procesat',
            procesat_de: 'creier_coordonator',
            rezultat_rutare: 'cohesion confirmat — organism viu'
          });
          break;
        }
      }
      procesate++;
    } catch (e) {
      erori.push(`beacon ${b.id}: ${e.message}`);
    }
  }

  return { procesate, pe_tip, erori, psie_coada: poarta };
}

/**
 * Emite un beat de coeziune — ca ritmul cardiac.
 * Apelat automat de workflow-uri pentru a confirma organismul viu.
 */
export async function emitCohesionBeat(base44: any, organ: string, payload: string): Promise<void> {
  await emitBeacon(base44, {
    organ_emitator: organ,
    tip_signal: 'cohesion',
    payload,
    prioritate: 'mica'
  });
}