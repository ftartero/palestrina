# Palestrina servita da Apps Script (HtmlService)

In questa modalità **l'app e i dati vivono nello stesso progetto Apps Script**
del Foglio: nessun hosting esterno, **niente token nel client**. Il browser
parla col server via `google.script.run` (same-origin). Accesso ristretto al
tuo account Google ("Solo io").

> Compromesso: così **non c'è PWA offline né uso da `file://`** — l'app va
> caricata dalla rete a ogni apertura e serve login Google.

## File (da mettere nell'editor Apps Script del Foglio `Palestrina DB`, in `Il mio Drive/Sport/Palestrina`)

| File nell'editor | Sorgente nel repo |
|---|---|
| `Codice.gs` (script) | `apps-script/Codice.gs` |
| `index.html` (file HTML) | `apps-script/index.html` |
| `program.html` (file HTML) | `apps-script/program.html` |

I nomi dei file HTML nell'editor devono essere **esattamente** `index` e
`program` (Apps Script aggiunge lui l'estensione `.html`).

## Passi

1. Apri il Foglio `Palestrina DB` (in `Il mio Drive/Sport/Palestrina`) → **Estensioni → Apps Script**.
2. **Script**: nel file `Codice.gs` incolla `apps-script/Codice.gs` (sostituendo
   tutto). Se resta il vecchio backend con token/`doPost`, va rimosso: questo lo
   rimpiazza del tutto.
3. **index.html**: `+` accanto a "File" → **HTML** → nome `index` → incolla
   `apps-script/index.html`.
4. **program.html**: `+` → **HTML** → nome `program` → incolla
   `apps-script/program.html`.
5. Salva (💾).
6. **Distribuisci → Nuova distribuzione** → ⚙️ **Applicazione web**:
   - **Esegui come:** `Io (flavio.tartero@…)`
   - **Chi ha accesso:** **Solo io**
   - **Distribuisci** → autorizza col tuo account.
7. Apri l'**URL Web App** (`…/exec`): parte l'app. Su iPhone: Safari → apri il
   link → *Condividi → Aggiungi a Home* (sarà un collegamento, non una PWA
   offline).

## Aggiornare l'app dopo una modifica

Con il **deploy automatico** (sotto) attivo, non serve fare nulla a mano: a ogni
push su `main` che tocca `apps-script/`, la GitHub Action aggiorna il progetto e
ridistribuisce la Web App (stesso URL `/exec`).

Fallback manuale: ricopia i file cambiati nell'editor, poi **Distribuisci →
Gestisci distribuzioni → ✏️ → Versione: Nuova**.

## Deploy automatico (GitHub Actions + clasp)

Il workflow `.github/workflows/deploy-appsscript.yml` usa
[`clasp`](https://github.com/google/clasp) per caricare il codice e aggiornare
la Web App. Setup **una-tantum** (le credenziali sono tue: Claude non può
crearle):

1. **Abilita l'Apps Script API**: vai su <https://script.google.com/home/usersettings>
   e attiva *Google Apps Script API*.
2. **Genera le credenziali clasp** sul tuo PC:
   ```bash
   npm install -g @google/clasp@2.4.2
   clasp login            # apre il browser, autorizza col tuo account
   ```
   Copia il contenuto del file `~/.clasprc.json` (su Windows:
   `%USERPROFILE%\.clasprc.json`).
3. Nel repo GitHub → **Settings → Secrets and variables → Actions**:
   - **Secret** `CLASPRC_JSON` = il contenuto di `~/.clasprc.json` (credenziale
     sensibile: dà accesso al tuo Apps Script).
   - **Secret** `SCRIPT_ID` = l'*ID script* (editor Apps Script → ⚙️
     Impostazioni progetto → "ID script").
   - **Variable** `DEPLOYMENT_ID` = l'*ID distribuzione* della Web App (è la
     stringa lunga `AKfycb…` dentro l'URL `/exec`, oppure Distribuisci →
     Gestisci distribuzioni → ID distribuzione).
4. Fai partire il workflow (un push, oppure **Actions → Deploy Apps Script →
   Run workflow**). Da qui in poi ogni push aggiorna l'app da solo.

Il file `apps-script/appsscript.json` fissa nel codice `executeAs: USER_DEPLOYING`
e `access: MYSELF` → la Web App resta **Esegui come: Io · Accesso: Solo io** a
ogni deploy.

## Note
- **Un solo esercizio manuale** resta il deploy: l'editor Apps Script non è
  pilotabile da qui. In alternativa puoi sincronizzare i file con
  [`clasp`](https://github.com/google/clasp) da riga di comando.
- I fogli leggibili `DB`/`Sessioni`/`Misure` si creano da soli al primo
  salvataggio, come prima.
- Backup: **Guida → Scarica backup .json** (dentro il sandbox di Apps Script il
  download potrebbe non partire su alcuni browser: in tal caso esporta dal
  Foglio).
