# Import peso da Garmin → Palestrina (via Apple Salute + Shortcut iOS)

La bilancia Garmin scrive peso e % grasso in **Apple Salute**; uno **Shortcut**
legge l'ultimo valore e lo manda all'API di Palestrina. **Nessuna credenziale
Garmin** in gioco.

## 1) Fai arrivare TUTTI i dati in Apple Salute

iPhone → **Impostazioni → Salute → Accesso ai dati e dispositivi → Garmin
Connect** → attiva le voci in **scrittura**:

- **Peso** ✅
- **Percentuale di grasso corporeo** ✅ (se spenta, in Salute vedi solo il peso)
- *(facoltativi, l'app non li usa: BMI, Massa corporea magra)*

Nota: **massa muscolare / acqua / massa ossea** non esistono come tipi standard
di Apple Salute → non arriveranno mai. Il **girovita** non lo misura la bilancia
(resta manuale nell'app, e viene preservato quando arriva un dato da Garmin).

Verifica in **Salute → Sfoglia → Corpo**: devono comparire *Peso* **e**
*Percentuale di grasso corporeo* con le date giuste.

## 2) L'API che riceve il dato

`POST …/exec?token=TOKEN&action=addMeasure` con body JSON:

```json
{ "weight": 74.1, "fat": 17.2, "date": "2026-08-05" }
```

- `weight` obbligatorio (kg), `fat` opzionale (%), `date` opzionale (default:
  oggi). Inserisce o **aggiorna** la misura di quella data (niente doppioni).

## 3) Lo Shortcut "Palestrina ← Salute"

App **Comandi (Shortcuts)** → nuovo comando, aggiungi in ordine:

1. **Trova campioni di salute** — Tipo: *Peso* · Ordina per *Data di fine* ·
   *Ultimo* · Limite **1**. → salva in variabile **Peso**.
2. **Trova campioni di salute** — Tipo: *Percentuale di grasso corporeo* ·
   Ultimo · Limite 1. → variabile **Grasso**.
   - ⚠️ Salute può dare il grasso come **frazione** (0,172) invece che 17,2. Fai
     un test: se il valore è < 1, aggiungi **Calcola: Grasso × 100**.
3. **Data corrente** → **Formatta data** → formato personalizzato `yyyy-MM-dd`.
   → variabile **Oggi**.
4. **Ottieni contenuto di URL**:
   - URL: `https://script.google.com/macros/s/AKfycb…/exec?token=IL_TUO_TOKEN&action=addMeasure`
   - Metodo: **POST**
   - Corpo richiesta: **JSON** con campi:
     - `weight` → variabile **Peso** (numero)
     - `fat` → variabile **Grasso** (numero)
     - `date` → variabile **Oggi** (testo)
   *(Con lo Shortcut non c'è CORS: il tipo di contenuto non conta.)*
5. *(facoltativo)* **Mostra notifica** con il risultato per conferma.

Assicurati che Salute e lo Shortcut usino i **kg** (non lb).

## 4) Quando parte

- **Consigliato — Automazione giornaliera:** Comandi → *Automazione* → *Ora del
  giorno* (es. 8:00) → *Esegui comando* → "Palestrina ← Salute" → disattiva
  *Chiedi prima di eseguire*. Gira da sola, non serve aprire l'app.
- **Manuale:** metti lo Shortcut in Home e lancialo dopo esserti pesato.
- **Dall'app (opzionale):** possiamo aggiungere in Palestrina un pulsante che
  apre lo Shortcut via `shortcuts://run-shortcut?name=Palestrina%20%E2%86%90%20Salute`
  (comodo, ma cambia app per un attimo). Dimmi se lo vuoi.

## Sicurezza
Nessuna credenziale Garmin: lo Shortcut usa solo Apple Salute (locale) e chiama
la tua API col token. Tienilo privato come sempre.
