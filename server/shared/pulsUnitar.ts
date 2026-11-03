// POARTA PULSULUI UNITAR (OM 14.10.2026 — remedierea autonomă a testului total):
// chemarea totală ({unitar_total}) și testul autonom ({unitar_autotest}) bat pulsul
// FIECĂRUI organ ca să măsoare viața — nu să-i ceară treaba grea. Organele care nu
// recunoșteau pulsul răspundeau 400/500/timeout sau porneau munca greă la ping
// (bursa rulaa predicții la ping!). Poarta răspunde instant, ușor, onest:
// organul e VIU și-și cunoaște pulsul, fără să consume și fără să mintă.
// Ciclurile reale (actiune/ciclu/status) rămân neschimbate — poarta se
// deschide DOAR la pulsul unitar. Determinist, zero LLM.

export function poartaPulsUnitar(body: any, nume: string): Response | null {
  if (!body || (body.unitar_total !== true && body.unitar_autotest !== true)) return null;
  return Response.json({
    ok: true,
    organ: nume,
    stare: 'viu',
    puls: 'unitar',
    scop: String(body.scop_unitar || '').slice(0, 200),
    la: new Date().toISOString(),
  });
}