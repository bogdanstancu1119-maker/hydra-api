# Contractul public al API-ului Hydra (v1)

Acest document descrie **exact** ce se întâmplă cu un apel, ce e garantat și ce
lipsește încă. Scopul lui nu e marketing: un dezvoltator trebuie să poată decide
dacă se bazează pe API citind doar acest fișier.

Endpoint: `POST https://hidra-smart-core.base44.app/functions/hydraApiLiber`

## 0. Stare verificată

- **Ultima verificare: 2026-11-03, 18:13 UTC** (15:13 în America/Cayenne), rulată direct
  pe endpoint-ul public, nu pe o copie locală, imediat după deploy.
- **Rezultat: 9/9 puncte trec.** Buildul publicat este versiunea contractului v1
  (sursa din `server/`, `sha256 4a803596617df025e2f5cc0e0cd9f75e678c268df00ee039dbb2af50f85f02f1`).
  Verificat live: `OPTIONS` → `204` + `access-control-allow-origin: *`; `200` cu
  `versiune: "v1"`, `raspuns` real, `motor: "intern_determinist"` și `apeluri_llm_externe: 0`;
  `400` cu `prompt_too_long`; `400` cu `prompt_missing`; `405` cu `method_not_allowed`;
  `401` cu `invalid_key`; `Authorization: Bearer` ignorat, adică `200`, conform §2.
- **Cum verifici singur, fără să ne crezi:** `node verify.mjs` (în acest repository).
  Rulează aceleași verificări și tipărește PASS/FAIL pentru fiecare. Dacă îl rulezi mai
  târziu și pică, înseamnă că producția s-a schimbat față de acest document — crede
  rularea, nu textul.

## 1. Endpoint-ul și pagina — două lucruri diferite

| Ce | Adresă | La ce folosește |
| --- | --- | --- |
| **API-ul** | `https://hidra-smart-core.base44.app/functions/hydraApiLiber` | singurul host care servește API-ul; aici trimiți `POST` |
| **Pagina + testerul** | `https://hidra-smart-core.com/api` | documentația publică și testerul din browser; `hidra-smart-core.com` este pagina platformei, **nu** host de API |

Dacă trimiți `POST` către `hidra-smart-core.com` primești pagina, nu un răspuns de API.
Testerul din pagină cheamă endpoint-ul `base44.app` din browser, ca să vezi exact ce
primește un client real.

## 2. Cerere

| Câmp | Tip | Obligatoriu | Semnificație |
| --- | --- | --- | --- |
| `prompt` | string | da (exceptând `action`) | întrebarea; maximum **600** caractere după `trim()` |
| `action` | string | nu | `"cheie"` cere o cheie Hydra nouă, fără să fie nevoie de prompt |
| `api_key` | string | nu | alternativă la antetul `X-Hydra-API-Key` |
| `unitar_total` / `unitar_autotest` | boolean | nu | **rezervat platformei**: întoarce un puls de sănătate (`{ok:true, organ, stare:"viu"}`). Nu este pentru uz public. |

**Autentificarea nu este obligatorie.** Nu există cont, login, token de acces sau aprobare.
API-ul răspunde identic fără nicio cheie.

**Cheia Hydra este opțională** și, în `v1`, nu schimbă nimic funcțional: nu dă cotă mai
mare, nu dă prioritate, nu identifică apelantul. Este doar o cheie emisă de organism,
pe care o poți purta ca să demonstrezi că ai trecut prin poartă.

- Antet citit: `X-Hydra-API-Key: hydra_<uuid>.<hex>`
- Alternativă în body: `{"api_key": "..."}`.
- **`Authorization: Bearer …` nu este citit** (verificat 2026-11-03): antetul e permis de
  CORS, dar serverul îl ignoră, deci nu primești `401`, primești `200`. Folosește
  `X-Hydra-API-Key`.
- Dacă trimiți o cheie în antetul corect și nu e validă: `401` cu `code: "invalid_key"`.

## 3. Limite — două lucruri care se confundă des

| Limită | Stare | Detaliu |
| --- | --- | --- |
| **Cotă de tokenuri / credite** | **nu există** | nu se numără tokenuri, nu se consumă credite, nu există plan |
| **Limită de ritm (cereri/secundă, pe zi)** | **nu există, nici aplicată, nici declarată** | nu promitem o cifră pe care nu o impunem |
| **Mărimea promptului** | **600 caractere, aplicată** | peste limită: `400` cu `code: "prompt_too_long"` |
| **Mărimea body-ului** | nedeclarată | nu există limită proprie verificată; ține-te la un `prompt` normal |
| **Cache** | `Cache-Control: no-store` | fiecare răspuns e proaspăt |

Faptul că nu există cotă nu înseamnă că poți trimite orice volum: vezi §8 despre abuz.

## 4. Răspuns (200)

Câmpurile de mai jos sunt contractul minim pe care te poți baza în `v1`:

| Câmp | Tip | Semnificație |
| --- | --- | --- |
| `prompt` | string | promptul normalizat primit înapoi |
| `raspuns` | string | textul răspunsului; niciodată `null` |
| `status` | `"cunoastere_interna"` \| `"cunostinte_insuficiente"` | acoperire internă, sau declararea onestă a lipsei |
| `metoda` | string | cum a fost compus răspunsul (extracție deterministă din ADN și registrul propriu) |
| `surse` | string[] | de unde provine textul (`PSIE_ADN`, nume de organe) |
| `versiune` | `"v1"` | versiunea contractului, prezentă în fiecare răspuns (verificat live) |
| `motor` | `"intern_determinist"` | motorul; constant în `v1` |
| `apeluri_llm_externe` | number | `0` — nicio platformă externă nu e chemată |
| `liber` | boolean | `true` — fără login |
| `login_necesar` | boolean | `false` |

Când `status` este `cunostinte_insuficiente`, `raspuns` spune explicit că nu există
cunoaștere internă verificată. API-ul **nu inventează** un răspuns și nu apelează un
model extern: absența e declarată, nu umplută.

Cererea de cheie întoarce: `api_key`, `tip`, `endpoint`, `header`, `raspuns`, `versiune`.

## 5. Erori — ce se întâmplă la fiecare cod

Fiecare eroare are `error` (text pentru om), `code` (stabil, pentru cod) și `versiune`.
Ramificația în client se face pe `code`, niciodată pe text. Toate codurile de mai jos sunt
verificate live în producție (vezi §0).

| HTTP | `code` | Ce s-a întâmplat | Ce faci |
| --- | --- | --- | --- |
| `200` | — | servit normal | citește `raspuns` și `status` |
| `400` | `prompt_missing` | body-ul nu conține `prompt` (și nu e o cerere de cheie) | trimite `{"prompt": "..."}` |
| `400` | `prompt_too_long` | promptul depășește 600 de caractere după `trim()` | scurtează promptul; nu reîncerca identic |
| `401` | `invalid_key` | ai trimis `X-Hydra-API-Key` (sau `api_key` în body) și nu e o cheie Hydra validă | scoate cheia și retrimite, sau cere una nouă cu `{"action":"cheie"}` |
| `405` | `method_not_allowed` | altă metodă decât `POST` (`GET`, `PUT`, `DELETE`) | folosește `POST` cu `Content-Type: application/json` |
| `409` | `quarantine` | textul a trecut prin organul de imunitate și a fost clasat ca atac (virus, vierme, atac cibernetic, bombă publicitară, parazit). Semnătura lui a fost reținută ca anticorp, ca să fie recunoscut altă dată. **Textul nu ajunge la motor și nu se emite cheie.** | reformulează fără tiparele de atac. Răspunsul conține `ordine: {motiv, risc, tip, semnaturi}` — citește-l ca să înțelegi de ce. Retrimiterea aceluiași text dă același `409` |
| `500` | `internal_error` | excepție internă, fără detalii publice | reîncearcă o dată; dacă persistă, raportează promptul și ora |

Exemplu de eroare completă:

```json
{
  "error": "Prompt maxim 600 caractere",
  "code": "prompt_too_long",
  "versiune": "v1"
}
```

## 6. Chei

- Format: `hydra_<uuid-v4>.<hex-64>`, semnată HMAC-SHA256 de organism.
- **Fără expirare, fără revocare, fără identitate de apelant.** O cheie valabilă rămâne
  valabilă; nu poți afla cine a folosit-o și nu poți anula una singură.
- Nu oferă acces administrativ, nu descifrează nimic, nu e o cheie a altei platforme.
- Este complet opțională: API-ul răspunde identic fără ea.
- Emiterea e instant și nelimitată prin `{"action":"cheie"}`; nu are sens să strângi chei.

## 7. Datele tale — retenție reală

Punctul pe care majoritatea API-urilor îl ascund, deci îl spunem direct:

- Fiecare `prompt` este **stocat** ca experiență a organismului (`MemorieHidra`):
  promptul integral plus primii 2000 de caractere din răspuns, cu marcaj de timp și
  user-agent trunchiat.
- Când mai multe apeluri se repetă pe aceleași cuvinte, recurența devine **tipar intern**
  (`TiparContextual`) — fără promptul integral, doar semnătura tokenilor.
- Un **beacon** intern anunță creșterea coordonatorului organismului.
- Senzorul rulează **după** ce ai primit răspunsul, deci nu îți întârzie apelul.
- **Nu există încă** termen de păstrare, ștergere la cerere sau opțiune de ne-stocare.

Consecință practică: **nu trimite date personale, secrete, chei sau conținut confidențial.**
Tratează poarta ca un loc public.

## 8. Abuz și ce înseamnă practic CORS deschis

- `Access-Control-Allow-Origin: *` înseamnă că **orice pagină web** poate chema API-ul
  din browserul vizitatorului. Nu există cookie-uri sau sesiuni de protejat, deci nu e
  o scurgere de date între site-uri; înseamnă însă că API-ul poate fi încorporat, oglindit
  sau revândut de altcineva fără să te întrebe.
- `Access-Control-Allow-Headers: Content-Type, X-Hydra-API-Key, Authorization` —
  `Authorization` e permis de CORS, dar **necitit** de server (vezi §2).
- **Fără cheie nu există identitate**, deci nu putem atribui abuzul cuiva.
- Singura apărare aplicată azi: **carantina** din §5 (clasificare deterministă pe text,
  semnătură reținută) plus limita de 600 de caractere. Nu există limită de ritm, blocare
  pe IP sau verificare de origine.
- Urmarea onestă: dacă API-ul e lovit cu volum, singurul efect garantat este că
  organismul învață tiparul; nu promitem că rămâne disponibil sub abuz.

## 9. Versionare și jurnal de modificări

- Endpointul este fix, fără prefix de versiune în cale; versiunea contractului vine în
  câmpul `versiune`.
- **Nu există încă o politică scrisă de deprecare.** Până apare una, câmpurile din §4 nu
  se elimină fără anunț în acest fișier.
- Modificările sunt în [`CHANGELOG.md`](CHANGELOG.md), cu dată și efect observabil.

## 10. Ce lipsește încă (goluri asumate)

1. **Controlul retenției** — flag `no_store` și politică de ștergere (acum: nimic nu se șterge).
2. **Limite declarate și aplicate** — ritm pe cheie/IP, mărime de body.
3. **Politică de deprecare** — termen minim de preaviz, jurnal de modificări (jurnalul există, politica nu).
4. **Chei cu identitate și revocare** — acum sunt anonime și veșnice.
5. **Specificație mașină** — OpenAPI/JSON Schema publicată, ca SDK-urile să fie generate, nu scrise de mână.

Fiecare dintre ele se închide în cod, nu în comunicate: când e rezolvat, apare aici cu
dovada (comportamentul nou), nu cu o promisiune.

## 11. Verificare reproductibilă

```bash
node verify.mjs
```

Scriptul (fără dependențe, Node 18+) trimite cererile reale și tipărește PASS/FAIL pentru:
`OPTIONS`, răspuns `200` cu câmpurile din §4, `prompt_too_long`, `prompt_missing`,
`method_not_allowed`, `invalid_key`. Ieșirea e dovada pentru data din §0; dacă îl rulezi
mai târziu și pică, înseamnă că producția s-a schimbat față de acest document.
