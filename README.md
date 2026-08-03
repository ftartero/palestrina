# Palestrina

App minimale per seguire e registrare i propri allenamenti in palestra, comoda da usare dal telefono durante la sessione. Nasce per il programma **Upper Body 90** ma è pensata per ospitare **più programmi** nel tempo.

- **Frontend:** una PWA statica (`index.html`, nessuna dipendenza), installabile e offline, pubblicata su **GitHub Pages**.
- **Backend:** un Foglio Google nel tuo Drive + un piccolo Google Apps Script (`apps-script/Codice.gs`) che espone un'**API JSON**. I dati vivono lì, quindi **iPhone e PC vedono gli stessi dati**.
- **Config sul dispositivo:** al primo avvio l'app chiede l'URL della Web App e un token, salvati in `localStorage`. **Niente segreti nei file** (il repo è pubblico).
- **Codice colore per muscolo** come sul cartello della macchina (petto, dorso, spalle, braccia, core).

## Avvio rapido

1. Crea il backend (Foglio + Apps Script) e imposta il token seguendo **[apps-script/LEGGIMI-deploy.md](apps-script/LEGGIMI-deploy.md)**.
2. Apri il link di GitHub Pages su iPhone e PC; alla prima apertura incolla **URL `/exec`** e **token**.
3. Su iPhone: *Condividi → Aggiungi a Home* per installarla come app (icona, schermo intero, uso offline dell'ultimo stato).

## Struttura

```
index.html                 app (shell) — non contiene dati di programma
programs/upper-body-90.js  definizione del programma (esercizi + schede)
manifest.webmanifest, sw.js, icons/   PWA installabile / offline
apps-script/Codice.gs      API JSON su Google Apps Script + Foglio
apps-script/appsscript.json  manifest Apps Script (access: Chiunque)
.github/workflows/         deploy automatico: Pages (frontend) + clasp (backend)
CLAUDE.md                  guida per manutenere il progetto con Claude
```

## Aggiungere un programma

Copia `programs/upper-body-90.js`, cambia `id`/`name`/`ex`/`workouts`, aggiorna il tag `<script src="programs/…">` in `index.html` e, se cambi le chiavi esercizio, `COLS` in `apps-script/Codice.gs`. Dettagli in `CLAUDE.md`.

## Sicurezza

Il repo è **pubblico** e **non contiene segreti**: il token sta nel `localStorage` del dispositivo e nella Proprietà script `SECRET` del backend. Chi ha URL + token può leggere/scrivere sul Foglio: usa un token lungo e tienilo privato.

## Licenza

MIT — vedi `LICENSE`.
