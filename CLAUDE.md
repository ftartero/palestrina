# CLAUDE.md — guida al progetto per Claude

Questo file serve a Claude (o Claude Code) per lavorare su questo repo mantenendone coerenza e qualità. **Leggilo prima di modificare.**

## Cos'è

**Palestrina** è una web-app personale per registrare gli allenamenti, usata dal telefono **durante** la sessione. È nata per il programma *Upper Body 90* di Flavio (sviluppo parte alta con una macchina multi-gym + panca + manubri 3 kg + bici) ma deve restare **generica**: nuovi programmi si aggiungono come file dati, senza toccare la logica.

L'app è **servita da Google Apps Script** (`HtmlService`) dallo stesso progetto del Foglio che fa da database: nessun hosting esterno, **nessun token nel client**, accesso ristretto al proprietario. (Una precedente variante statica/PWA è stata ritirata.)

## Principi da rispettare

- **Zero dipendenze nel frontend.** HTML/CSS/JS vanilla, niente framework, niente build, niente CDN. L'app è `apps-script/index.html` (più `apps-script/program.html`, incluso lato server).
- **Mobile-first, uso "sudato".** Celle grandi, tasti `+`/`−` da 50px, tocco facile, poco scrolling per esercizio. Testo e UI in **italiano**.
- **Codice colore per muscolo** (CSS var `--petto --dorso --spalle --braccia --core`): è la firma visiva, richiama il cartello della macchina. Mantienilo.
- **Dati dell'utente sacri.** Non introdurre modifiche che possano perdere `sessions`/`measures`. La fonte autorevole è il Foglio; il `localStorage` è solo cache/uso in-sessione.
- **Contenuti di allenamento e alimentazione: moderati e basati su evidenze.** Range 8–15 rip, volume ~10 serie/gruppo/sett, proteine ~1.6–2.0 g/kg, dimagrimento lento 0.25–0.4 kg/sett, obiettivo estetico sano (uomo ~12% grasso). **Mai** suggerire diete estreme, deficit aggressivi, digiuni spinti o toni ossessivi. In caso di dubbio, resta prudente e rimanda al medico.

## Architettura

```
[ Browser (iPhone/PC), loggato in Google — accesso "Solo io" ]
        |
        |  doGet()                            → HtmlService serve index.html
        |                                        (+ program.html via include('program'))
        |  google.script.run.getState()       → legge {sessions, measures}
        |  google.script.run.saveState(tutto) → salva TUTTO lo stato
        v
[ Google Apps Script — apps-script/Codice.gs ]  <-->  [ Foglio Google nel Drive dell'utente ]
        Esegui come: Io · Accesso: Solo io            DB!A1 = JSON autorevole
                                                       fogli "Sessioni"/"Misure" = copia leggibile
```

- **Sync:** all'avvio l'app mostra subito la cache locale, poi chiama `getState()` e si allinea al Foglio. Ogni azione (salva sessione, aggiungi/elimina misura) chiama `saveState()` con **tutto** lo stato. Il server riscrive `DB!A1` e rigenera i fogli leggibili (`mirror`).
- **Niente token, niente CORS:** `google.script.run` è same-origin; la sicurezza è l'**accesso Google** del deployment (vedi "Sicurezza"). Non reintrodurre `fetch`/token: sono superflui e romperebbero il modello.
- **Programma incluso lato server:** `index.html` usa `<?!= include('program') ?>` e `Codice.gs` definisce `include(name)`. Nell'editor Apps Script i file HTML si chiamano esattamente `index` e `program`.
- **Non gira da `file://`:** dipende dal bridge `google.script.run`, che esiste solo dentro Apps Script (l'app è in un iframe sandbox: niente service worker, niente PWA offline). Per i test locali si **stubba** `google.script.run` (vedi "Test").

## File

| File | Ruolo |
|---|---|
| `apps-script/Codice.gs` | `doGet` (serve l'app), `include`, `getState`/`saveState`, `readDB`/`writeDB`/`mirror`. |
| `apps-script/index.html` | Tutta l'app: stile, stato, render, sync via `google.script.run`. Non contiene dati di programma. |
| `apps-script/program.html` | Il programma attivo come `<script>` incluso in `index.html`. |
| `apps-script/LEGGIMI-deploy.md` | Come incollare i file nell'editor e distribuire (Accesso: Solo io). |
| `README.md`, `LICENSE` | Descrizione e licenza. |

## Modello dati

```js
session = { id:Number, date:"YYYY-MM-DD", type:"A"|"B",
            entries:{ <exKey>:Number|null, … }, note:String }
measure = { id:Number, date:"YYYY-MM-DD", weight:Number, fat:Number|null, waist:Number|null }
```
Le chiavi degli esercizi (`exKey`) sono condivise fra schede quando l'esercizio è lo stesso (es. `lat`, `tricep` stanno in A e B): così il "peso dell'ultima volta" si trascina. La baseline misure del programma viene inserita al primo avvio se il Foglio è vuoto.

## Aggiungere un nuovo programma

1. Copia `apps-script/program.html` e ridefinisci `window.PROGRAM` (`id`, `name`, `height`, `targetFat`, `baseline`, `ex`, `workouts`). Usa le CSS var esistenti per i colori muscolo.
2. Se **aggiungi o rinomini chiavi esercizio**, aggiorna anche `COLS` in `apps-script/Codice.gs`: serve alla copia leggibile del foglio "Sessioni" (accoppiamento voluto ma da non dimenticare).
3. Ridistribuisci (nuova versione) e testa.

**Backend condiviso:** oggi tutti i programmi userebbero lo stesso Foglio. Se in futuro servono più programmi contemporaneamente, aggiungi un campo `program` ai record e filtra, **oppure** usa un Foglio/Deployment per programma. Non mescolare a caso: decidi e documenta. Un **selettore di programma** nell'UI è in roadmap.

## Sicurezza

- La protezione è l'**accesso Google del deployment**. Distribuisci con **Esegui come: Io** e **Chi ha accesso: Solo io** → solo il tuo account, loggato, può aprire l'app e chiamare `getState`/`saveState`. **Nessun token nel client, nessun segreto da pubblicare.**
- **Esegui come: Io** è necessario perché lo script scrive sul *tuo* Foglio.
- Cambiare accesso o codice = **ridistribuire**: Gestisci distribuzioni → ✏️ → Versione: Nuova. Senza "Nuova versione" l'URL serve la versione vecchia.

## Test (obbligatorio prima di consegnare modifiche)

Non esiste build: si verifica in un browser headless controllando la console. **Atteso: nessun errore JS.** Si simula l'`include` del programma e si **stubba** `google.script.run` (in questo ambiente il browser è già presente; senza `executable_path` Playwright usa quello installato):

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

## Deploy

**Automatico (CI):** il workflow `.github/workflows/deploy-appsscript.yml` usa `clasp` per caricare `apps-script/` nel progetto e aggiornare la Web App a ogni push su `main` (stesso URL `/exec`). Il manifest `apps-script/appsscript.json` fissa `access: MYSELF` / `executeAs: USER_DEPLOYING` (= Solo io / Esegui come Io). Setup una-tantum dei Secret (`CLASPRC_JSON`, `SCRIPT_ID`, variabile `DEPLOYMENT_ID`) e abilitazione dell'Apps Script API: vedi **`apps-script/LEGGIMI-deploy.md`**.

**Manuale (fallback):** incolla `Codice.gs` + i file HTML `index`/`program` nell'editor del Foglio, **Distribuisci → Gestisci distribuzioni → Versione: Nuova**.

## Git / branch

Si lavora **sempre su `main`**: commit diretti sul ramo principale, niente branch di feature separati salvo richiesta esplicita. Commit piccoli e verificabili (test headless verde prima di committare).

## Funzioni recenti

- **Timer di recupero**: parte da solo quando spunti ✓ un esercizio (durata predefinita 60/90/120s in Guida, disattivabile). Pill fissa con ±15s, pausa, chiudi; allarme sonoro (WebAudio) + vibrazione dove supportata (iOS Safari non vibra). Stato in `localStorage` (`ub90_rest`, `ub90_autorest`), non nel modello dati.
- **Mappa muscoli**: in Allena, SVG inline fronte/retro che evidenzia i gruppi della scheda A/B coi colori muscolo. Le regioni si derivano dal campo `group` degli esercizi via `groupToRegions()` (keyword: petto/dorso/trapez/anterior/posterior/laterale/bicip/tricip/addome/obliqu). I deltoidi laterali illuminano le spalle su entrambe le viste.

## Idee / roadmap

- Modifica di un record già salvato (oggi si può solo eliminare).
- Selettore di programma nell'UI quando ci sarà più di un programma.
- Grafico progressi carichi per esercizio; export CSV (oggi c'è già il backup JSON).
- **Import automatico peso/%grasso da Garmin** (bilancia → Garmin Connect): non fattibile dentro Apps Script (auth complessa, niente API personale). Servirebbe un middleware schedulato con le credenziali Garmin che scrive nel Foglio. Idea parcheggiata.

## Stile delle risposte

Codice ordinato, commenti in italiano, identificatori in inglese. Modifiche piccole e verificabili. Non aggiungere dipendenze. Se una richiesta rischia di rompere il modello dati o la sicurezza, **segnalalo invece di procedere**.
