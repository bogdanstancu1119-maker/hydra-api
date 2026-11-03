# Sursa serverului — poarta publică `hydraApiLiber`

Acesta este codul din spatele endpoint-ului public, publicat ca referință de arhitectură:
oricine poate citi exact ce se întâmplă cu un apel, fără să creadă o promisiune.

```
server/
  functions/hydraApiLiber/entry.ts   handler-ul HTTP (POST, CORS, cheie, ordine), versiunea contractului v1
  shared/pulsUnitar.ts               poarta pulsului unitar (semnătură/origine)
  shared/ordineFunctionare.ts        ordinea imunității: carantina înainte de răspuns
  shared/hydraApiKeys.ts             emiterea și verificarea cheilor Hydra
  shared/hydraApiIntern.ts           motorul determinist care compune răspunsul
  shared/sistemNervos.ts             beacon-ul către creierul coordonator
```

Modulele de mai sus importă, la rândul lor, organe interne care **nu** sunt publicate aici
(`organExtern.ts`, `psieAdn.ts`, `registruOrgane.ts`, `poartaPSIE.ts`). Importurile au fost
lăsate vizibile intenționat: se vede exact ce lipsește, nu se sugerează un arbore complet.

## Ce build este acesta

- `entry.ts` publicat aici: `sha256 4a803596617df025e2f5cc0e0cd9f75e678c268df00ee039dbb2af50f85f02f1`
- Acesta este codul care **rulează acum în producție** (contract v1), verificat pe endpoint
  la 2026-11-03, 18:13 UTC: `code` și `versiune` sunt prezente în fiecare răspuns.
- Dovada se obține rulând `node verify.mjs` din rădăcina repository-ului: scriptul spune
  PASS/FAIL pentru fiecare punct al contractului, direct pe endpoint.

## Ce face un apel, în ordine

1. **Metodă** — doar `POST` (și `OPTIONS` pentru CORS). Altfel `405`.
2. **Pulsul unitar** — poarta verifică forma cererii; ce nu trece e refuzat devreme.
3. **Cheia** — opțională. Dacă e trimisă în `X-Hydra-API-Key` (sau `api_key` în body) și nu
   e validă, primești `401`. Antetul `Authorization` este permis de CORS, dar necitit.
4. **Lungimea** — promptul peste 600 de caractere este refuzat cu `400`. Nu există cotă de
   tokenuri; aceasta este singura limită aplicată pe conținut.
5. **Ordinea imunității** — textul trece întâi prin organul extern. Ce seamănă cu un atac
   (virus, vierme, bombă publicitară, parazit) intră în carantină: semnătura îi este
   reținută ca anticorp și primești `409` cu `ordine: {motiv, risc, tip, semnaturi}`.
   Nu ajunge nici la motor, nici la emiterea de chei.
6. **Răspunsul** — compus determinist de motorul intern, zero apeluri LLM externe.
7. **Senzorul** — după răspuns (`waitUntil`, deci fără să întârzie poarta), apelul devine
   memorie, recurența devine tipar, iar un beacon anunță creierul coordonator.

## De ce sursa e publică

- Motorul nu are credențiale de furnizor și nu cheamă modele externe: nu există secret
  care să justifice ascunderea logicii.
- Nimic din acest cod nu oferă acces administrativ. Cheile emise aici sunt chei Hydra,
  valabile doar pentru poarta publică.
- Orice modificare a comportamentului se vede în diff, nu în comunicate.

## Rulare

Codul folosește runtime-ul de backend al platformei (`createClientFromRequest`,
`base44:runtime`, entitățile organismului). Este publicat ca referință, nu ca pachet
instalabil: `entry.ts` se poate citi integral, iar `shared/` reflectă exact modulele
importate direct de el.
