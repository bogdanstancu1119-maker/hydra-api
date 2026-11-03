# Sursa serverului — poarta publică `hydraApiLiber`

Acesta este codul care rulează efectiv în spatele endpoint-ului public. Este publicat
ca referință de arhitectură: oricine poate citi exact ce se întâmplă cu un apel,
fără să creadă o promisiune.

```
server/
  functions/hydraApiLiber/entry.ts   handler-ul HTTP (POST, CORS, cheie, ordine)
  shared/pulsUnitar.ts               poarta pulsului unitar (semnătură/origine)
  shared/ordineFunctionare.ts        ordinea imunității: carantina înainte de răspuns
  shared/hydraApiKeys.ts             emiterea și verificarea cheilor Hydra
  shared/hydraApiIntern.ts           motorul determinist care compune răspunsul
  shared/sistemNervos.ts             beacon-ul către creierul coordonator
```

## Ce face un apel, în ordine

1. **Metodă** — doar `POST` (și `OPTIONS` pentru CORS). Altfel `405`.
2. **Pulsul unitar** — poarta verifică forma cererii; ce nu trece e refuzat devreme.
3. **Cheia** — dacă e trimisă, trebuie să fie o cheie Hydra validă, altfel `401`.
4. **Lungimea** — promptul peste 600 de caractere este refuzat cu `400`.
5. **Ordinea imunității** — textul trece întâi prin organul extern. Ce seamănă cu un
   atac (virus, vierme, bombă publicitară, parazit) intră în carantină: semnătura îi
   este reținută ca anticorp și primești `409`. Nu ajunge nici la motor, nici la emiterea de chei.
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
importate de el.
