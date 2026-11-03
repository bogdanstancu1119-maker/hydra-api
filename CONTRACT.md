# Contractul public al API-ului Hydra (v1)

Acest document descrie **exact** ce se întâmplă cu un apel, ce e garantat și ce
lipsește încă. Scopul lui nu e marketing: un dezvoltator trebuie să poată decide
dacă se bazează pe API citind doar acest fișier.

Endpoint: `POST https://hidra-smart-core.base44.app/functions/hydraApiLiber`

## 1. Cerere

| Câmp | Tip | Obligatoriu | Semnificație |
| --- | --- | --- | --- |
| `prompt` | string | da (exceptând `action`) | întrebarea; maximum **600** caractere după `trim()` |
| `action` | string | nu | `"cheie"` cere o cheie Hydra nouă, fără să fie nevoie de prompt |
| `api_key` | string | nu | alternativă la antetul `X-Hydra-API-Key` |
| `unitar_total` / `unitar_autotest` | boolean | nu | **rezervat platformei**: întoarce un puls de sănătate (`{ok:true, organ, stare:"viu"}`) fără să consume nimic. Nu este pentru uz public. |

Antet opțional: `X-Hydra-API-Key: hydra_<uuid>.<hex>`. Dacă e trimis și nu e valid, primești `401`.

## 2. Răspuns (200)

Câmpurile de mai jos sunt cele returnate **acum**. Ele sunt contractul minim pe care
te poți baza în `v1`:

| Câmp | Tip | Semnificație |
| --- | --- | --- |
| `prompt` | string | promptul normalizat primit înapoi |
| `raspuns` | string | textul răspunsului; niciodată `null` |
| `status` | `"cunoastere_interna"` \| `"cunostinte_insuficiente"` | dacă răspunsul are acoperire internă sau organismul declară lipsa |
| `metoda` | string | cum a fost compus răspunsul (extracție deterministă din ADN și registrul propriu) |
| `surse` | string[] | de unde provine textul (`PSIE_ADN`, nume de organe) |
| `versiune` | `"v1"` | versiunea contractului |
| `motor` | `"intern_determinist"` | motorul; constant în `v1` |
| `apeluri_llm_externe` | number | `0` — nicio platformă externă nu e chemată |
| `liber` | boolean | `true` — fără login |
| `login_necesar` | boolean | `false` |

Când `status` este `cunostinte_insuficiente`, `raspuns` spune explicit că nu există
cunoaștere internă verificată. API-ul **nu inventează** un răspuns și nu apelează un
model extern: absența e declarată, nu umplută.

Cererea de cheie întoarce: `api_key`, `tip`, `endpoint`, `header`, `raspuns`, `versiune`.

## 3. Erori

Fiecare eroare are `error` (text pentru om) și `code` (stabil, pentru cod):

| HTTP | `code` | Cauză |
| --- | --- | --- |
| `400` | `prompt_missing` | lipsește `prompt` |
| `400` | `prompt_too_long` | peste 600 de caractere |
| `401` | `invalid_key` | s-a trimis o cheie Hydra care nu e validă |
| `405` | `method_not_allowed` | altă metodă decât `POST` (sau `OPTIONS`) |
| `409` | `quarantine` | textul a intrat în carantină; semnătura i-a fost reținută ca anticorp. Răspunsul include `ordine: {motiv, risc, tip, semnaturi}` |
| `500` | `internal_error` | eroare internă |

Ramificația recomandată în cod: pe `code`, niciodată pe textul din `error`.

## 4. Chei

- Format: `hydra_<uuid-v4>.<hex-64>`, semnată HMAC-SHA256 de organism.
- **Fără expirare, fără revocare, fără identitate de apelant.** O cheie valabilă rămâne
  valabilă; nu poți afla cine a folosit-o și nu poți anula una singură.
- Nu oferă acces administrativ, nu descifrează nimic, nu e o cheie a altei platforme.
- Este complet opțională: API-ul răspunde identic fără ea.

## 5. Datele tale — retenție reală

Acesta este punctul pe care majoritatea API-urilor îl ascund, deci îl spunem direct:

- Fiecare `prompt` este **stocat** ca experiență a organismului (`MemorieHidra`):
  promptul integral plus primii 2000 de caractere din răspuns, cu marcaj de timp și user-agent trunchiat.
- Când mai multe apeluri se repetă pe aceleași cuvinte, recurența devine **tipar intern**
  (`TiparContextual`) — fără promptul integral, doar semnătura tokenilor.
- Un **beacon** intern anunță creșterea coordonatorului organismului.
- **Nu există încă** termen de păstrare, ștergere la cerere sau opțiune de ne-stocare.

Consecință practică: **nu trimite date personale, secrete, chei sau conținut confidențial.**
Tratează poarta ca un loc public.

## 6. Limite

- Momentan **nu există limită de ritm, cotă sau dimensiune maximă de body declarată** pe
  lângă limita de 600 de caractere. Nu promitem o cifră pe care nu o aplicăm.
- `Cache-Control: no-store`; CORS `*`; `OPTIONS` răspunde `204`.

## 7. Versionare

- Endpointul este fix, fără prefix de versiune în cale; versiunea contractului vine în câmpul `versiune`.
- **Nu există încă o politică scrisă de deprecare.** Până apare una, orice câmp poate fi
  adăugat, iar câmpurile din tabelul de la §2 nu se elimină fără anunț în acest fișier.

## 8. Ce lipsește încă (goluri asumate)

1. **Controlul retenției** — flag `no_store` și politică de ștergere (acum: nimic nu se șterge).
2. **Limite declarate și aplicate** — ritm pe cheie/IP, mărime de body.
3. **Politică de deprecare** — termen minim de preaviz, jurnal de modificări.
4. **Chei cu identitate și revocare** — acum sunt anonime și veșnice.
5. **Specificație mașină** — OpenAPI/JSON Schema publicată, ca SDK-urile să fie generate, nu scrise de mână.

Fiecare dintre ele se închide în cod, nu în comunicate: când e rezolvat, apare aici cu
dovada (comportamentul nou), nu cu o promisiune.
