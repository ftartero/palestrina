# CLAUDE.md — guida al progetto per Claude

Questo file serve a Claude (o Claude Code) per lavorare su questo repo mantenendone coerenza e qualità. **Leggilo prima di modificare.**

## Cos'è

**Palestrina** è una web-app personale per registrare gli allenamenti, usata dal telefono **durante** la sessione. È nata per il programma *Upper Body 90* di Flavio (sviluppo parte alta con una macchina multi-gym + panca + manubri 3 kg + bici) ma deve restare **generica**: nuovi programmi si aggiungono come file dati, senza toccare la logica.

Il **frontend** è una PWA statica pubblicata su **GitHub Pages**; il **backend** è un Google Apps Script che espone un'**API JSON** su un Foglio Google. iPhone e PC che aprono il link vedono gli stessi dati.

## Principi da rispettare

- **Zero dipendenze nel frontend.** `index.html` è vanilla HTML/CSS/JS, un solo file. Niente framework, niente build, niente CDN. Deve funzionare aperto da `file://` e da un host statico.
- **Mobile-first, uso "sudato".** Celle grandi, tasti `+`/`−` da 50px, tocco facile, poco scrolling per esercizio. Testo e UI in **italiano**.
- **Codice colore per muscolo** (CSS var `--petto --dorso --spalle --braccia --core`): è la firma visiva, richiama il cartello della macchina. Mantienilo.
- **Dati dell'utente sacri.** Non introdurre modifiche che possano perdere `sessions`/`measures`. La fonte autorevole è il Foglio; il `localStorage` è solo cache/uso offline.
- **CORS/compatibilità:** il POST al backend deve restare **`Content-Type: text/plain`** (nessun header custom, nessun `application/json`): così non scatta il preflight e la chiamata cross-origin verso Apps Script funziona. Il GET è semplice, con il token in query string.
- **Nessun segreto nel repo.** Il repo è **pubblico**: `config.js`/token non si committano mai. Il token vive in `localStorage` (client) e nelle Proprietà script (backend).
- **Contenuti di allenamento e alimentazione: moderati e basati su evidenze.** Range 8–15 rip, volume ~10 serie/gruppo/sett, proteine ~1.6–2.0 g/kg, dimagrimento lento 0.25–0.4 kg/sett, obiettivo estetico sano (uomo ~12% grasso). **Mai** suggerire diete estreme, deficit aggressivi, digiuni spinti o toni ossessivi. In caso di dubbio, resta prudente e rimanda al medico.

## Architettura

```
[ PWA statica su GitHub Pages ]  index.html + programs/*.js + manifest + sw + icons
        |   config (URL /exec + token) salvata in localStorage — MAI nei file
        |
        |  GET  ?token=…                 → legge {sessions, measures}
        |  POST body=JSON  (text/plain)  → salva tutto lo stato
        v
[ Google Apps Script Web App ]  <-->  [ Foglio Google nel Drive dell'utente ]
        (apps-script/Codice.gs)          DB!A1 = JSON autorevole
        Esegui come: Io · Accesso:        fogli "Sessioni"/"Misure" = copia leggibile
        Chiunque · token in Proprietà
        script (chiave "SECRET")
```

- **Sync:** all'avvio l'app mostra la cache locale, poi fa `pull()` (GET) e si allinea al Foglio. Ogni azione (salva sessione, aggiungi/elimina misura) chiama `push()` (POST con **tutto** lo stato). Il server riscrive `DB!A1` e rigenera i fogli leggibili (`mirror`).
- **Config lato client:** al primo avvio l'app chiede **URL `/exec`** e **token** (schermata di config e sezione in Guida); li salva in `localStorage` (`ub90_cfg`). Non finiscono in nessun file pubblicato.
- **Auth lato server:** `authorized()` confronta `?token=` con la Proprietà script `SECRET`. Endpoint pubblico ("Chiunque") ma inutile senza token.

## File

| File | Ruolo |
|---|---|
| `index.html` | Tutta l'app: stile, stato, render, sync via `fetch`, schermata di config. Non contiene dati di programma. |
| `programs/*.js` | Un programma = `window.PROGRAM = { id, name, height, targetFat, baseline, ex, workouts }`. |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: installabile e offline. |
| `apps-script/Codice.gs` | Backend API: `doGet`/`doPost`, token da Proprietà script, DB + mirror. |
| `apps-script/appsscript.json` | Manifest Apps Script: `access: ANYONE_ANONYMOUS`, `executeAs: USER_DEPLOYING`. |
| `apps-script/LEGGIMI-deploy.md` | Setup backend + Secret CI. |
| `.github/workflows/deploy-pages.yml` | Pubblica il frontend su Pages a ogni push (auto). |
| `.github/workflows/deploy-appsscript.yml` | Deploya il backend con `clasp` a ogni push (auto). |

## Modello dati

```js
session = { id:Number, date:"YYYY-MM-DD", type:"A"|"B",
            entries:{ <exKey>:Number|null, … }, note:String }
measure = { id:Number, date:"YYYY-MM-DD", weight:Number, fat:Number|null, waist:Number|null }
```
Le chiavi degli esercizi (`exKey`) sono condivise fra schede quando l'esercizio è lo stesso (es. `lat`, `tricep` stanno in A e B): così il "peso dell'ultima volta" si trascina. La baseline misure del programma viene inserita al primo avvio se il Foglio è vuoto.

## Aggiungere un nuovo programma

1. Copia `programs/upper-body-90.js` in `programs/<nome>.js`, cambia `id`/`name`/`height`/`targetFat`/`baseline`/`ex`/`workouts`. Usa le CSS var esistenti per i colori muscolo.
2. In `index.html` cambia il tag `<script src="programs/upper-body-90.js">` verso il nuovo file (o introduci un selettore — in roadmap).
3. Se **aggiungi o rinomini chiavi esercizio**, aggiorna anche `COLS` in `apps-script/Codice.gs` (per la copia leggibile del foglio "Sessioni").
4. Testa.

**Backend condiviso:** oggi tutti i programmi userebbero lo stesso Foglio. Se in futuro servono più programmi contemporaneamente, aggiungi un campo `program` ai record e filtra, **oppure** usa un Foglio/Deployment per programma. Non mescolare a caso: decidi e documenta.

## Sicurezza

- Il repo è **pubblico**: **mai committare** token/URL. Il token sta nel **`localStorage`** del client (schermata di config) e nella **Proprietà script `SECRET`** del backend (Impostazioni progetto → Proprietà script). L'URL `/exec` non è segreto (senza token risponde `unauthorized`).
- L'endpoint è pubblicato come "Chiunque": la protezione è il **token**. Adeguato per dati personali a basso rischio, non per dati sensibili. **Usa un token lungo e non banale.**
- Cambiare token = aggiornare la Proprietà `SECRET` e il token nell'app (Guida → Collegamento). Il codice del backend si ridistribuisce da solo (CI), ma la Proprietà script si imposta a mano una volta.

## Test (obbligatorio prima di consegnare modifiche)

Non esiste build: si verifica caricando l'app in un browser headless con il **backend mockato** (route su `script.google.com`). **Atteso: nessun errore JS.**

```python
# richiede playwright + chromium
import os
from playwright.sync_api import sync_playwright
errs=[]; store={"sessions":[],"measures":[]}
def handle(route, req):
    import json
    if req.method=="POST":
        try: store.update(json.loads(req.post_data or "{}"))
        except: pass
        route.fulfill(status=200, content_type="application/json", body='{"ok":true}')
    else:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(store))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':820})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.route('**/script.google.com/**', handle)
    pg.goto('file://'+os.getcwd()+'/index.html'); pg.wait_for_timeout(400)
    pg.fill('#cfg_url','https://script.google.com/macros/s/ABC/exec'); pg.fill('#cfg_token','x')
    pg.click('[data-act=saveConfig]'); pg.wait_for_timeout(400)
    for nav in ['storico','misure','info','allena']:
        pg.click(f'[data-nav={nav}]'); pg.wait_for_timeout(120)
    b.close()
print('ERRORI:', [e for e in errs if 'net::ERR' not in e and 'manifest' not in e.lower()] or 'nessuno')
```
Verifica a mano: `+`/`−`, spunta ✓ (parte il timer), salva sessione, aggiungi/elimina misura, espandi storico. Deve funzionare **sia** da `file://` **sia** da http.

## Deploy

- **Frontend (Pages) — automatico:** `.github/workflows/deploy-pages.yml` pubblica i file statici su GitHub Pages a ogni push. Repo **pubblico**; Pages si abilita dal workflow (`configure-pages` con `enablement`). Se cambi lo **shell** (`index.html`, programma, icone), **incrementa `V` in `sw.js`** per invalidare la cache PWA.
- **Backend (Apps Script) — automatico:** `.github/workflows/deploy-appsscript.yml` usa `clasp` per aggiornare la Web App. **Una tantum:** Apps Script API attiva, Secret `CLASPRC_JSON`/`SCRIPT_ID`, variabile `DEPLOYMENT_ID`, e Proprietà script `SECRET`. Dettagli in `apps-script/LEGGIMI-deploy.md`.

## Git / branch

Si lavora **sempre su `main`**: commit diretti sul ramo principale, niente branch di feature separati salvo richiesta esplicita. Commit piccoli e verificabili (test headless verde prima di committare). Nessun segreto committato (il repo è pubblico).

## Funzioni recenti

- **Timer di recupero**: parte da solo quando spunti ✓ un esercizio (durata 60/90/120s in Guida, disattivabile). Pill fissa con ±15s, pausa, chiudi; allarme sonoro (WebAudio) + vibrazione dove supportata (iOS Safari non vibra). Stato in `localStorage` (`ub90_rest`, `ub90_autorest`), non nel modello dati.
- **Mappa muscoli**: in Allena, SVG inline fronte/retro (senza gambe) che evidenzia i gruppi della scheda A/B coi colori muscolo. Regioni derivate dal campo `group` via `groupToRegions()`; i deltoidi laterali illuminano le spalle su entrambe le viste.

## Idee / roadmap

- Modifica di un record già salvato (oggi si può solo eliminare).
- Selettore di programma nell'UI quando ci sarà più di un `programs/*.js`.
- Grafico progressi carichi per esercizio; export CSV (oggi c'è già il backup JSON).
- **Import automatico peso/%grasso da Garmin** (bilancia → Garmin Connect): non fattibile direttamente (auth complessa, niente API personale). Servirebbe un middleware schedulato con le credenziali Garmin che scrive nel Foglio. Idea parcheggiata.

## Stile delle risposte

Codice ordinato, commenti in italiano, identificatori in inglese. Modifiche piccole e verificabili. Non aggiungere dipendenze. Se una richiesta rischia di rompere il modello dati, la sicurezza o la compatibilità cross-origin, **segnalalo invece di procedere**.
