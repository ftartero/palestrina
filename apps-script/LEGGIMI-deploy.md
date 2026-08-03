# Backend Palestrina (Google Apps Script — API JSON)

Il backend è un Google Apps Script legato a un Foglio del tuo Drive. Espone
un'API JSON che il frontend (PWA su GitHub Pages) chiama via `fetch`:

- `GET  …/exec?token=…`  → `{ sessions, measures }`
- `POST …/exec?token=…`  (body JSON, `text/plain`) → salva tutto, `{ ok:true }`

I dati vivono nel Foglio: `DB!A1` = JSON autorevole; fogli `Sessioni`/`Misure`
= copia leggibile (create in automatico al primo salvataggio).

## File (nell'editor Apps Script del Foglio, in `Il mio Drive/Sport/Palestrina`)

| File nell'editor | Sorgente nel repo |
|---|---|
| `Codice.gs` | `apps-script/Codice.gs` |
| `appsscript.json` (manifest) | `apps-script/appsscript.json` |

> Il deploy è **automatico** via `clasp` (vedi sotto): normalmente non incolli
> nulla a mano. La prima volta serve però il setup qui descritto.

## Setup una-tantum

1. **Foglio + progetto:** crea il Foglio (es. `Palestrina DB`), poi *Estensioni →
   Apps Script*. Se parti a mano, incolla `Codice.gs` e `appsscript.json`.
2. **Token nel backend (NON nel repo):** *Impostazioni progetto → Proprietà
   script → Aggiungi proprietà*: chiave **`SECRET`**, valore **un token lungo e
   non banale** (es. una frase-parola casuale). È lo stesso che inserirai
   nell'app.
3. **Abilita l'Apps Script API:** <https://script.google.com/home/usersettings>.
4. **Deploy Web App:** *Distribuisci → Nuova distribuzione → App web* →
   **Esegui come: Io** · **Chi ha accesso: Chiunque** → autorizza. Copia l'URL
   `/exec`.
5. **CI del backend** (auto-deploy ad ogni push): nel repo GitHub → *Settings →
   Secrets and variables → Actions*:
   - Secret `CLASPRC_JSON` = contenuto di `~/.clasprc.json` (da `clasp login`).
   - Secret `SCRIPT_ID` = *ID script* (Impostazioni progetto).
   - Variable `DEPLOYMENT_ID` = l'ID nella stringa `AKfycb…` dell'URL `/exec`.

Il manifest fissa `access: ANYONE_ANONYMOUS` ed `executeAs: USER_DEPLOYING`: la
Web App resta pubblica (protetta dal token) ed eseguita come te.

## Frontend (GitHub Pages)

Il workflow `.github/workflows/deploy-pages.yml` pubblica i file statici a ogni
push (repo **pubblico**; Pages si abilita da solo al primo run). Aperto il link
di Pages, alla prima volta incolla **URL `/exec`** e **token**: restano nel
`localStorage` del dispositivo, non nel sito.

## Aggiornare
Push su `main`: il frontend va su Pages e il backend si ridistribuisce con clasp,
**da soli**. Se cambi lo shell PWA (`index.html`, programma, icone) ricordati di
**incrementare `V` in `sw.js`**.

## Se qualcosa non torna
- L'app dice **token errato** → la Proprietà `SECRET` ≠ token inserito.
- Il `GET` restituisce una **pagina di login Google** invece di JSON → in
  *Gestisci distribuzioni* l'accesso non è **Chiunque**: correggilo (una volta).
- Errore **CORS** nel browser ma i dati ci sono → è stato aggiunto un header o
  `application/json` al POST: dev'essere `text/plain` (l'app lo fa già).
