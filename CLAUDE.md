# CLAUDE.md — guida al progetto per Claude

Questo file serve a Claude (o Claude Code) per lavorare su questo repo mantenendone coerenza e qualità. **Leggilo prima di modificare.**

## Cos'è

**Palestrina** è una web-app personale per registrare gli allenamenti, usata dal telefono **durante** la sessione. È nata per il programma *Upper Body 90* di Flavio (sviluppo parte alta con una macchina multi-gym + panca + manubri 3 kg + bici) ma deve restare **generica**: nuovi programmi si aggiungono come file dati, senza toccare la logica.

## Come viene servita (importante)

Ci sono **due varianti** dello stesso frontend. Condividono modello dati, UI e lo stesso Foglio Google; cambiano solo *dove gira* e *come parla col backend*.

- **Attiva — Apps Script / HtmlService (`apps-script/`).** L'app è servita dallo **stesso** progetto Apps Script del Foglio: `doGet` restituisce l'HTML, il client dialoga col server via **`google.script.run`** (same-origin). **Niente token nel client, niente CORS.** Accesso ristretto al proprietario ("Solo io"). **Costo:** niente PWA offline, niente `file://` (gira in un iframe sandbox: il service worker non parte). È questa la variante da far evolvere salvo indicazione diversa.
- **Legacy — statica / PWA (root del repo).** `index.html` + `config.js` (token) + `sw.js`: funziona da `file://` e da host statico, installabile e offline, POST `text/plain` verso Apps Script. Rimane come alternativa offline; **non è la variante primaria**.

> ⚠️ **Duplicazione da tenere presente.** Logica dell'app e dati del programma esistono in due copie (root e `apps-script/`). Se tocchi la logica, **applica la modifica alla variante che stai sviluppando** e, se vuoi mantenerle allineate, all'altra — oppure proponi di **ritirare la legacy** e documentalo. Non far divergere le due in silenzio.

## Principi da rispettare

- **Zero dipendenze nel frontend.** HTML/CSS/JS vanilla. Niente framework, niente build, niente CDN. La variante attiva è un unico `apps-script/index.html` (più `apps-script/program.html` incluso lato server); la legacy è un unico `index.html`.
- **Mobile-first, uso "sudato".** Celle grandi, tasti `+`/`−` da 50px, tocco facile, poco scrolling per esercizio. Testo e UI in **italiano**.
- **Codice colore per muscolo** (CSS var `--petto --dorso --spalle --braccia --core`): è la firma visiva, richiama il cartello della macchina. Mantienilo.
- **Dati dell'utente sacri.** Non introdurre modifiche che possano perdere `sessions`/`measures`. La fonte autorevole è il Foglio; il `localStorage` è solo cache/uso in-sessione.
- **Contenuti di allenamento e alimentazione: moderati e basati su evidenze.** Range 8–15 rip, volume ~10 serie/gruppo/sett, proteine ~1.6–2.0 g/kg, dimagrimento lento 0.25–0.4 kg/sett, obiettivo estetico sano (uomo ~12% grasso). **Mai** suggerire diete estreme, deficit aggressivi, digiuni spinti o toni ossessivi. In caso di dubbio, resta prudente e rimanda al medico.

## Architettura (variante attiva: Apps Script)

```
[ Browser (iPhone/PC), loggato in Google — accesso "Solo io" ]
        |
        |  doGet()                         → HtmlService serve index.html
        |                                     (+ program.html incluso via include('program'))
        |  google.script.run.getState()    → legge {sessions, measures}
        |  google.script.run.saveState(tutto) → salva TUTTO lo stato
        v
[ Google Apps Script — apps-script/Codice.gs ]  <-->  [ Foglio Google nel Drive dell'utente ]
        Esegui come: Io · Accesso: Solo io            DB!A1 = JSON autorevole
                                                       fogli "Sessioni"/"Misure" = copia leggibile
```

- **Sync:** all'avvio l'app mostra subito la cache locale, poi chiama `getState()` e si allinea al Foglio. Ogni azione (salva sessione, aggiungi/elimina misura) chiama `saveState()` con **tutto** lo stato. Il server riscrive `DB!A1` e rigenera i fogli leggibili (`mirror`).
- **Nessun token, nessun CORS:** `google.script.run` è same-origin. La sicurezza è l'**accesso Google** del deployment (vedi "Sicurezza"). Non reintrodurre `fetch`/token nella variante Apps Script: sono superflui e romperebbero il modello.
- **Programma incluso lato server:** `index.html` usa `<?!= include('program') ?>`, e `Codice.gs` definisce `include(name)`. I file HTML nell'editor si chiamano esattamente `index` e `program`.

### Variante legacy statica (per contesto)

`index.html` (root) carica `config.js` (URL+token) e `programs/<attivo>.js`, fa `GET ?token=…` per leggere e `POST body=JSON` (**`Content-Type: text/plain`**, nessun preflight) per salvare. **CORS:** funziona proprio perché GET è semplice e il POST è `text/plain` col token in query string. **Non** aggiungere header custom né `application/json` al POST della legacy: romperebbe le chiamate cross-origin verso Apps Script.

## File

| File | Ruolo |
|---|---|
| **`apps-script/Codice.gs`** | Variante attiva. `doGet` (serve l'app), `include`, `getState`/`saveState`, `readDB/writeDB/mirror`. |
| **`apps-script/index.html`** | Variante attiva. Tutta l'app (stile, stato, render, sync via `google.script.run`). |
| **`apps-script/program.html`** | Variante attiva. Il programma come `<script>` incluso in `index.html`. |
| **`apps-script/LEGGIMI-deploy.md`** | Come incollare i file nell'editor e distribuire (Accesso: Solo io). |
| `index.html` | Variante legacy statica: shell PWA. Non contiene dati di programma. |
| `programs/*.js` | Variante legacy: `window.PROGRAM = { id, name, height, targetFat, baseline, ex, workouts }`. |
| `config.js` | Solo legacy: `window.CONFIG = { API_URL, TOKEN }`. **Non versionato** (`.gitignore`). Modello in `config.example.js`. |
| `backend/apps-script.gs` | Backend legacy (token + `doGet`/`doPost` che restituiscono JSON). |
| `manifest.webmanifest`, `sw.js`, `icons/` | Solo legacy: PWA installabile e offline. |
| `docs/LEGGIMI-installazione.md` | Setup della variante legacy statica. |

## Modello dati (identico nelle due varianti)

```js
session = { id:Number, date:"YYYY-MM-DD", type:"A"|"B",
            entries:{ <exKey>:Number|null, … }, note:String }
measure = { id:Number, date:"YYYY-MM-DD", weight:Number, fat:Number|null, waist:Number|null }
```
Le chiavi degli esercizi (`exKey`) sono condivise fra schede quando l'esercizio è lo stesso (es. `lat`, `tricep` stanno in A e B): così il "peso dell'ultima volta" si trascina. La baseline misure del programma viene inserita al primo avvio se il Foglio è vuoto.

## Aggiungere un nuovo programma

**Variante attiva (Apps Script):**
1. Copia `apps-script/program.html` e ridefinisci `window.PROGRAM` (`id`, `name`, `height`, `targetFat`, `baseline`, `ex`, `workouts`). Usa le CSS var esistenti per i colori muscolo.
2. Se **aggiungi o rinomini chiavi esercizio**, aggiorna anche `COLS` in `apps-script/Codice.gs`: serve alla copia leggibile del foglio "Sessioni" (accoppiamento voluto ma da non dimenticare).
3. Ridistribuisci (nuova versione) e testa.

**Variante legacy:** copia `programs/upper-body-90.js`, cambia i campi, aggiorna il tag `<script src="programs/…">` in `index.html` (o introduci un selettore), e allinea `COLS` in `backend/apps-script.gs`.

**Backend condiviso:** oggi tutti i programmi userebbero lo stesso Foglio. Se in futuro servono più programmi contemporaneamente, aggiungi un campo `program` ai record e filtra, **oppure** usa un Foglio/Deployment per programma. Non mescolare a caso: decidi e documenta. Un **selettore di programma** nell'UI è in roadmap.

## Sicurezza

- **Variante attiva:** la protezione è l'**accesso Google del deployment**. Distribuisci con **Esegui come: Io** e **Chi ha accesso: Solo io** → solo il tuo account, loggato, può aprire l'app e chiamare `getState`/`saveState`. **Nessun token nel client, nessun segreto da pubblicare.** "Esegui come: Io" è necessario perché lo script scrive sul *tuo* Foglio. Cambiare accesso o codice = **ridistribuire** (Gestisci distribuzioni → ✏️ → Versione: Nuova).
- **Variante legacy:** la protezione è il **token** in query string dentro `config.js`. Adeguata per dati personali a basso rischio, non per dati sensibili. **Mai committare `config.js`** né il token (è in `.gitignore`; se lo vedi tracciato, rimuovilo). Chiunque abbia URL+token legge/scrive.

## Test (obbligatorio prima di consegnare modifiche)

Non esiste build: si verifica in un browser headless controllando la console. **Atteso: nessun errore JS.** Testa la variante che tocchi.

**Variante attiva (Apps Script)** — si simula l'`include` del programma e si stubba `google.script.run` (in questo ambiente il browser è già presente; senza `executable_path` Playwright usa quello installato):

```python
# richiede playwright + chromium
import os, tempfile
from playwright.sync_api import sync_playwright
BASE="apps-script"
idx=open(f"{BASE}/index.html",encoding="utf-8").read()
prog=open(f"{BASE}/program.html",encoding="utf-8").read()
idx=idx.replace("<?!= include('program') ?>", prog)         # 1) include
assert "<?" not in idx, "scriptlet Apps Script non risolti"
STUB="""<script>
window.__calls=[];window.__store={sessions:[],measures:[]};
window.google={script:{run:(function(){function r(){var s=function(){},f=function(){};var a={
 withSuccessHandler:function(fn){s=fn;return a},withFailureHandler:function(fn){f=fn;return a},
 getState:function(){window.__calls.push('getState');setTimeout(function(){s(JSON.parse(JSON.stringify(window.__store)))},5)},
 saveState:function(p){window.__calls.push('saveState');window.__store={sessions:p.sessions||[],measures:p.measures||[]};setTimeout(function(){s({ok:true})},5)}};return a}
 return {withSuccessHandler:function(fn){return r().withSuccessHandler(fn)},withFailureHandler:function(fn){return r().withFailureHandler(fn)},
 getState:function(){return r().getState()},saveState:function(p){return r().saveState(p)}}})()}};
</script>"""
idx=idx.replace("<head>","<head>\n"+STUB,1)                 # 2) stub bridge
t=tempfile.NamedTemporaryFile("w",suffix=".html",dir=BASE,delete=False,encoding="utf-8");t.write(idx);t.close()
errs=[]
try:
    with sync_playwright() as p:
        b=p.chromium.launch();pg=b.new_page(viewport={'width':420,'height':820})
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.goto('file://'+t.name);pg.wait_for_timeout(400)
        for nav in ['storico','misure','info','allena']:
            pg.click(f'[data-nav={nav}]');pg.wait_for_timeout(120)
        calls=pg.evaluate('window.__calls');b.close()
finally: os.unlink(t.name)
print('ERRORI:', [e for e in errs if 'net::ERR' not in e] or 'nessuno')
print('bridge:', calls)   # atteso: getState + almeno un saveState (seed baseline)
```
Verifica a mano nell'app reale: `+`/`−`, spunta ✓, salva sessione, aggiungi/elimina misura, espandi nello storico.

**Variante legacy:** carica `file://…/index.html` con `pg.route('**/script.google.com/**', lambda r: r.abort())` (simula offline) e controlla zero errori JS su tutte le tab. Deve funzionare **sia** da `file://` **sia** da http.

## Deploy

- **Variante attiva (Apps Script):** vedi **`apps-script/LEGGIMI-deploy.md`**. In breve: incolla `Codice.gs` + i file HTML `index`/`program` nell'editor del Foglio, **Distribuisci → App web** (Esegui come: Io · Accesso: Solo io). Dopo ogni modifica: **Gestisci distribuzioni → Versione: Nuova**, altrimenti l'URL serve la versione vecchia.
- **Variante legacy (statica):** doppio clic su `index.html` (locale), oppure Netlify Drop / GitHub Pages con `config.js` (non pubblicare il token). Se cambi lo shell (`index.html`, programma, icone), **incrementa `V` in `sw.js`** per invalidare la cache PWA.

## Git / branch

Si lavora **sempre su `main`**: commit diretti sul ramo principale, niente branch di feature separati salvo richiesta esplicita. Commit piccoli e verificabili (test headless verde prima di committare). `config.js` non va mai committato (è in `.gitignore`).

## Idee / roadmap

- Modifica di un record già salvato (oggi si può solo eliminare).
- Timer di recupero fra le serie nella schermata Allena.
- Selettore di programma nell'UI quando ci sarà più di un programma.
- Grafico progressi carichi per esercizio; export CSV (oggi c'è già il backup JSON).
- Decidere se **ritirare la variante legacy statica** per avere un'unica fonte.

## Stile delle risposte

Codice ordinato, commenti in italiano, identificatori in inglese. Modifiche piccole e verificabili. Non aggiungere dipendenze. Se una richiesta rischia di rompere il modello dati, la sicurezza o l'allineamento fra le due varianti, **segnalalo invece di procedere**.
