# Palestrina servita da Apps Script (HtmlService)

In questa modalità **l'app e i dati vivono nello stesso progetto Apps Script**
del Foglio: nessun hosting esterno, **niente token nel client**. Il browser
parla col server via `google.script.run` (same-origin). Accesso ristretto al
tuo account Google ("Solo io").

> Compromesso: così **non c'è PWA offline né uso da `file://`** — l'app va
> caricata dalla rete a ogni apertura e serve login Google.

## File (da mettere nell'editor Apps Script del Foglio `Palestrina DB`)

| File nell'editor | Sorgente nel repo |
|---|---|
| `Codice.gs` (script) | `apps-script/Codice.gs` |
| `index.html` (file HTML) | `apps-script/index.html` |
| `program.html` (file HTML) | `apps-script/program.html` |

I nomi dei file HTML nell'editor devono essere **esattamente** `index` e
`program` (Apps Script aggiunge lui l'estensione `.html`).

## Passi

1. Apri il Foglio `Palestrina DB` → **Estensioni → Apps Script**.
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
Ricopia i file cambiati nell'editor, poi **Distribuisci → Gestisci
distribuzioni → ✏️ → Versione: Nuova**. Senza "Nuova versione" l'URL continua a
servire la versione vecchia.

## Note
- **Un solo esercizio manuale** resta il deploy: l'editor Apps Script non è
  pilotabile da qui. In alternativa puoi sincronizzare i file con
  [`clasp`](https://github.com/google/clasp) da riga di comando.
- I fogli leggibili `DB`/`Sessioni`/`Misure` si creano da soli al primo
  salvataggio, come prima.
- Backup: **Guida → Scarica backup .json** (dentro il sandbox di Apps Script il
  download potrebbe non partire su alcuni browser: in tal caso esporta dal
  Foglio).
