# Palestrina

App minimale per seguire e registrare i propri allenamenti in palestra, comoda da usare dal telefono durante la sessione. Nasce per il programma **Upper Body 90** ma è pensata per ospitare **più programmi** nel tempo.

- **Frontend:** un unico file statico (`index.html`), nessuna dipendenza, funziona anche offline (PWA installabile).
- **Backend:** un Foglio Google nel tuo Drive + un piccolo Google Apps Script (`backend/apps-script.gs`) che fa da API. I dati vivono lì, quindi **iPhone e PC vedono gli stessi dati**.
- **Codice colore per muscolo** come sul cartello della macchina (petto, dorso, spalle, braccia, core).

## Avvio rapido

1. Crea il backend e collega la config seguendo **[docs/LEGGIMI-installazione.md](docs/LEGGIMI-installazione.md)**.
2. Copia `config.example.js` in `config.js` e compila `API_URL` e `TOKEN` (questo file non va su GitHub).
3. Apri `index.html` in locale, oppure pubblicalo gratis (Netlify Drop / GitHub Pages) e apri il link su iPhone e PC.

## Struttura

```
index.html                 app (shell) — non contiene dati di programma
programs/upper-body-90.js  definizione del programma (esercizi + schede)
config.example.js          modello di config; copia in config.js (ignorato da git)
backend/apps-script.gs     API su Google Apps Script + Foglio
manifest.webmanifest, sw.js, icons/   PWA installabile / offline
docs/                      istruzioni
CLAUDE.md                  guida per manutenere il progetto con Claude
```

## Aggiungere un programma

Copia `programs/upper-body-90.js`, cambia `id`/`name`/`ex`/`workouts`, e aggiorna il tag `<script src="programs/…">` in `index.html`. Dettagli in `CLAUDE.md`.

## Sicurezza

`config.js` contiene URL e token e **non è versionato**. Chi ha URL + token può leggere/scrivere sul Foglio: tienili privati.

## Licenza

MIT — vedi `LICENSE`.
