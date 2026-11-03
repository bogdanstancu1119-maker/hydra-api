import { PSIE_ADN } from './psieAdn.ts';
import { cautaOrganePentruContext } from './registruOrgane.ts';

const norm = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function cereCheieHydra(prompt) {
  return /\b(api|token)\b/.test(norm(prompt)) && /\b(chei\w*|key\w*|token\w*|cle\w*|clave\w*|chave\w*|schlussel\w*)\b/.test(norm(prompt));
}

// Cunoaștere publică deja integrată, nu memorii private și nu un model extern.
// Potrivirea lexicală este declarată; nu este o măsură a adevărului afirmațiilor.
export function raspundeApiIntern(prompt, body = {}) {
  const stop = new Set(['care', 'este', 'pentru', 'despre', 'vreau', 'spune', 'what', 'with', 'this', 'that', 'comment', 'quero']);
  const tokeni = [...new Set(norm(prompt).match(/[\p{L}\p{N}]{3,}/gu) || [])].filter((t) => !stop.has(t));
  const fragmente = PSIE_ADN.split(/\n\s*\n/).map((text, index) => ({ text, index,
    scor: tokeni.reduce((sum, token) => sum + (norm(text).includes(token) ? 1 : 0), 0) }));
  const cunostinte = fragmente.filter((f) => f.scor > 0).sort((a, b) => b.scor - a.scor || a.index - b.index).slice(0, 2);
  const organe = cautaOrganePentruContext(prompt).slice(0, 3);
  const surse = [...cunostinte.map(() => 'PSIE_ADN'), ...organe.map((o) => o.nume)];
  const raspuns = [...cunostinte.map((f) => f.text.trim()), ...organe.map((o) => `${o.nume}: ${o.rol}`)].join('\n\n');
  return { raspuns: raspuns || 'Nu am cunoaștere internă verificată pentru această întrebare. Nu inventez un răspuns și nu apelez un LLM extern.',
    status: raspuns ? 'cunoastere_interna' : 'cunostinte_insuficiente', metoda: 'extracție deterministă din ADN și registrul propriu; nu execută organele enumerate', surse: [...new Set(surse)] };
}