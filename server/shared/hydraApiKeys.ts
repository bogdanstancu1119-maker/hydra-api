import { secrets } from 'base44:runtime';

// Chei proprii Hydra, limitate la poarta publică; fără acces la seif sau administrare.
const encoder = new TextEncoder();
async function signingKey() {
  const secret = secrets.get('HYDRA_PUBLIC_API_SIGNING_KEY');
  if (!secret) throw new Error('Semnarea cheilor Hydra nu este configurată');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function emiteCheieHydra() {
  const id = crypto.randomUUID();
  const signature = await crypto.subtle.sign('HMAC', await signingKey(), encoder.encode(`hydra-public-v1:${id}`));
  const hex = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
  return `hydra_${id}.${hex}`;
}
export async function verificaCheieHydra(token) {
  const match = /^hydra_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([0-9a-f]{64})$/.exec(String(token));
  if (!match) return false;
  const signature = Uint8Array.from(match[2].match(/../g), (b) => parseInt(b, 16));
  return crypto.subtle.verify('HMAC', await signingKey(), signature, encoder.encode(`hydra-public-v1:${match[1]}`));
}