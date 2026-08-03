# CLAUDE.md — guida al progetto per Claude

Questo file serve a Claude (o Claude Code) per lavorare su questo repo mantenendone coerenza e qualità. Leggilo prima di modificare.

## Cos'è

**Palestrina** è una web-app personale per registrare gli allenamenti, usata dal telefono **durante** la sessione. È nata per il programma *Upper Body 90* di Flavio (sviluppo parte alta con una macchina multi-gym + panca + manubri 3 kg + bici) ma deve restare **generica**: nuovi programmi si aggiungono come file dati, senza toccare la logica.

## Principi da rispettare

- **Zero dipendenze nel frontend.** `index.html` è vanilla HTML/CSS/JS, un solo file. Niente framework, niente build, niente CDN. Deve funzionare aperto da `file://` e da un host statico.
- **Mobile-first, uso "sudato".** Celle grandi, tasti `+`/`−` da 50px, tocco facile, poco scrolling per esercizio. Testo e UI in **italiano**.
- **Codice colore per muscolo** (CSS var `--petto --dorso --spalle --braccia --core`): è la firma visiva, richiama il cartello della macchina. Mantienilo.
- **Dati dell'utente sacri.** Non introdurre modifiche che possano perdere `sessions`/`measures`. La fonte autorevole è il Foglio; il `localStorage` è solo cache/uso offline.
- **Contenuti di allenamento e alimentazione: moderati e basati su evidenze.** Range 8–15 rip, volume ~10 serie/gruppo/sett, proteine ~1.6–2.0 g/kg, dimagrimento lento 0.25–0.4 kg/sett, obiettivo estetico sano (uomo ~12% grasso). **Mai** suggerire diete estreme, deficit aggressivi, digiuni spinti o toni ossessivi. In caso di dubbio, resta prudente e rimanda al medico.

## Architettura

```
[ index.html (shell) ]  --carica-->  config.js (URL+token)  +  programs/<attivo>.js (dati)
        |
        |  GET  ?token=…                 → legge {sessions, measures}
        |  POST body=JSON  (text/plain)  → salva tutto lo stato
        v
[ Google Apps Script Web App ]  <-->  [ Foglio Google nel Drive dell'utente ]
        (backend/apps-script.gs)         DB!A1 = JSON autorevole
                                          fogli "Sessioni"/"Misure" = copia leggibile
```

- **Sync:** all'avvio l'app mostra subito la cache locale, poi fa `pull()` (GET) e si allinea al Foglio. Ogni azione (salva sessione, aggiungi/elimina misura) chiama `push()` (POST con **tutto** lo stato). Il server riscrive `DB!A1` e rigenera i fogli leggibili.
- **CORS:** funziona perché il GET è semplice e il POST usa `Content-Type: text/plain` (nessun preflight) con il token in query string. **Non** aggiungere header custom né `Content-Type: application/json` al POST: romperebbe le chiamate cross-origin verso Apps Script.

## File

| File | Ruolo |
|---|---|
| `index.html` | Tutta l'app: stile, stato, render, sync. Non contiene dati di programma. |
| `programs/*.js` | Un programma = `window.PROGRAM = { id, name, height, targetFat, baseline, ex, workouts }`. |
| `config.js` | `window.CONFIG = { API_URL, TOKEN }`. **Non versionato** (`.gitignore`). Modello in `config.example.js`. |
| `backend/apps-script.gs` | `doGet`/`doPost`, token check, DB + mirror. |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: installabile e offline. |
| `docs/LEGGIMI-installazione.md` | Setup passo-passo per l'utente. |

## Modello dati

```js
session = { id:Number, date:"YYYY-MM-DD", type:"A"|"B",
            entries:{ <exKey>:Number|null, … }, note:String }
measure = { id:Number, date:"YYYY-MM-DD", weight:Number, fat:Number|null, waist:Number|null }
```
Le chiavi degli esercizi (`exKey`) sono condivise fra schede quando l'esercizio è lo stesso (es. `lat`, `tricep` stanno in A e B): così il "peso dell'ultima volta" si trascina. La baseline misure del programma viene inserita al primo avvio se il Foglio è vuoto.

## Aggiungere un nuovo programma

1. Copia `programs/upper-body-90.js` in `programs/<nome>.js`.
2. Cambia `id`, `name`, `height`, `targetFat`, `baseline`, e ridefinisci `ex` e `workouts`. Usa le CSS var esistenti per i colori muscolo.
3. In `index.html` cambia il tag `<script src="programs/upper-body-90.js">` verso il nuovo file (oppure introduci un selettore di programma — vedi sotto).
4. Testa (sezione "Test").

**Backend condiviso:** oggi tutti i programmi userebbero lo stesso Foglio. Se in futuro servono più programmi contemporaneamente, aggiungi un campo `program` ai record e filtra per programma, **oppure** usa un Foglio/Deployment per programma (config diversa). Non mescolare a caso: decidi e documenta.

## Sicurezza

- **Mai committare `config.js`** né il token. È in `.gitignore`; se lo vedi tracciato, rimuovilo.
- L'endpoint è pubblicato come "Chiunque": la protezione è il **token** in query string. È adeguato per dati personali a basso rischio, non per dati sensibili.
- Cambiare token = aggiornare `SECRET` (script) e `TOKEN` (`config.js`), poi **ridistribuire**: Distribuisci → Gestisci distribuzioni → (matita) → Versione: Nuova.

## Test (obbligatorio prima di consegnare modifiche)

Non esiste build: si verifica caricando l'app in un browser headless e controllando la console.

```bash
# richiede playwright + chromium
python3 - <<'PY'
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':420,'height':820})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.route('**/script.google.com/**', lambda r: r.abort())  # simula offline
    pg.goto('file://'+__import__('os').getcwd()+'/index.html')
    pg.wait_for_timeout(600)
    for nav in ['storico','misure','info','allena']:
        pg.click(f'[data-nav={nav}]'); pg.wait_for_timeout(150)
    b.close()
print('ERRORI:', [e for e in errs if 'net::ERR' not in e] or 'nessuno')
PY
```
Attesi: nessun errore JS (a parte la rete bloccata di proposito). Verifica a mano: `+`/`−`, spunta ✓, salva sessione (con config valida), aggiungi misura, espandi/elimina nello storico. Deve funzionare **sia** da `file://` **sia** da http.

## Deploy

- **Locale (PC):** doppio clic su `index.html`.
- **Link (consigliato per iPhone):** trascina la **cartella** (con `config.js` incluso) su Netlify Drop → indirizzo `https://` gratuito. Oppure GitHub Pages (in tal caso o repo **privato**, o inietta `config.js` in fase di deploy: non pubblicare il token).
- **PWA/offline:** se cambi lo shell (`index.html`, il programma, le icone), **incrementa `V` in `sw.js`** (es. `palestrina-v2`) per invalidare la cache, altrimenti gli utenti vedono la versione vecchia.

## Idee / roadmap

- Selettore di programma nell'UI quando ci sarà più di un `programs/*.js`.
- Grafico progressi carichi per esercizio; export CSV (oggi c'è già il backup JSON).
- Timer di recupero fra le serie.

## Git / branch

Si lavora **sempre su `main`**: commit diretti sul ramo principale, niente branch di feature separati salvo richiesta esplicita. Commit piccoli e verificabili (test headless verde prima di committare). `config.js` non va mai committato (è in `.gitignore`).

## Stile delle risposte

Codice ordinato, commenti in italiano, identificatori in inglese. Modifiche piccole e verificabili. Non aggiungere dipendenze. Se una richiesta rischia di rompere il modello dati o la compatibilità cross-origin, segnalalo invece di procedere.
