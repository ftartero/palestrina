# Palestrina — installazione

Due pezzi: il **backend** (un Foglio Google nel tuo Drive) e il **frontend** (questo repo).
Una volta collegati, iPhone e PC vedono **gli stessi dati**, perché arrivano dal Foglio.

---

## 1) Backend — Foglio Google + Apps Script (una volta sola, ~10 min)

1. Vai su **drive.google.com** col tuo account → **Nuovo → Fogli Google**. Rinominalo, es. `Palestrina DB`. (Resta nel tuo My Drive.)
2. Nel foglio: menu **Estensioni → Apps Script**.
3. Cancella il codice di esempio e **incolla tutto** il contenuto di `backend/apps-script.gs`.
4. In cima, cambia `SECRET` con **una parola tua** (es. `tartero-gym-7788`). Segnatela.
5. Salva.
6. In alto a destra: **Distribuisci → Nuova distribuzione**. Tipo **App web**:
   - **Esegui come:** Io · **Chi ha accesso:** Chiunque → **Distribuisci** → autorizza col tuo account.
7. Copia l'**URL della Web App** (finisce con `/exec`).

## 2) Frontend — configura il repo

8. Copia `config.example.js` in **`config.js`**.
9. In `config.js` metti l'URL `/exec` in `API_URL` e la stessa parola di `SECRET` in `TOKEN`. Salva.
   `config.js` è ignorato da git: tiene il token fuori da GitHub.

## 3) Usare l'app

- **Sul PC (locale):** apri `index.html` col browser.
- **Su iPhone / ovunque (consigliato):** pubblica gratis e apri il **link**:
  - **Netlify Drop** — `app.netlify.com/drop`, trascina la **cartella del repo** (con `config.js` dentro) → indirizzo `https://…`.
  - oppure **GitHub Pages** (repo privato, o inietta `config.js` in deploy: non pubblicare il token).
- Aggiungi il link alla schermata Home: essendo una PWA si installa come app (icona, schermo intero, uso offline dell'ultimo stato).

---

### Note
- Serve **connessione** per sincronizzare; offline vedi l'ultimo stato e sincronizzi dopo (Guida → Sincronizza ora).
- Chi ha **URL + token** può leggere/scrivere: tienili per te.
- Nel Foglio: schede leggibili **Sessioni** e **Misure** + scheda tecnica **DB** (non toccare `DB`). Per aggiungere/correggere dati usa l'app.
- Backup extra: **Guida → Scarica backup .json**.
