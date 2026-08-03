# Palestrina

App minimale per seguire e registrare i propri allenamenti in palestra, comoda da usare dal telefono durante la sessione. Nasce per il programma **Upper Body 90** ma è pensata per ospitare **più programmi** nel tempo.

- **Servita da Google Apps Script:** l'app e i dati vivono nello stesso progetto Apps Script del tuo Foglio Google. `doGet` restituisce l'HTML, il client parla col server via `google.script.run` (same-origin) → **niente token nel client, niente CORS**. iPhone e PC che aprono l'URL vedono gli stessi dati.
- **Frontend:** HTML/CSS/JS vanilla, nessuna dipendenza. Un unico `apps-script/index.html`, con il programma incluso da `apps-script/program.html`.
- **Accesso ristretto:** il deployment è pubblicato con *Accesso: Solo io* → solo il tuo account Google può usarla.
- **Codice colore per muscolo** come sul cartello della macchina (petto, dorso, spalle, braccia, core).

> Nota: essendo servita da Apps Script (iframe sandbox), **non** è una PWA offline e non gira da `file://`. Serve connessione e login Google.

## Avvio rapido

1. Crea un Foglio Google nel tuo Drive (es. `Palestrina DB`).
2. Nel Foglio: **Estensioni → Apps Script** e incolla i file di `apps-script/` (`Codice.gs`, e i file HTML `index` e `program`).
3. **Distribuisci → App web** con *Esegui come: Io* e *Chi ha accesso: Solo io*.
4. Apri l'URL `/exec` (loggato col tuo account) da iPhone e PC.

Passo-passo completo: **[apps-script/LEGGIMI-deploy.md](apps-script/LEGGIMI-deploy.md)**.

## Struttura

```
apps-script/Codice.gs         backend: doGet + getState/saveState + Foglio
apps-script/index.html        app (shell) — non contiene dati di programma
apps-script/program.html      definizione del programma (esercizi + schede)
apps-script/LEGGIMI-deploy.md istruzioni di deploy
CLAUDE.md                     guida per manutenere il progetto con Claude
```

## Aggiungere un programma

Copia `apps-script/program.html`, cambia `id`/`name`/`ex`/`workouts`. Se aggiungi o rinomini chiavi esercizio, allinea `COLS` in `apps-script/Codice.gs`. Dettagli in `CLAUDE.md`.

## Sicurezza

Non c'è alcun token nel client: la protezione è l'accesso Google del deployment (*Solo io*). Solo il tuo account, loggato, può aprire l'app e leggere/scrivere il Foglio.

## Licenza

MIT — vedi `LICENSE`.
