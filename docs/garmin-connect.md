# Import dati corporei da Garmin Connect (opzione A)

Un workflow GitHub Actions gira ogni mattina, legge da **Garmin Connect** l'ultima
misura della bilancia (peso, % grasso, **massa muscolare, % acqua, massa ossea,
grasso viscerale, età metabolica**) e la scrive nel Foglio via l'API Palestrina
(`?action=addMeasure`, upsert per data). I dati compaiono nella schermata
**Misure**.

> Usa l'API Garmin **non ufficiale** (libreria `garminconnect`/`garth`): comoda
> ma può rompersi se Garmin cambia qualcosa. In quel caso rifai il login (punto 1)
> e aggiorna il Secret. Nessuna credenziale Garmin finisce nel repo: nel Secret
> c'è solo un **token di sessione** (rinnovabile), non la password.

## 1) Genera il token di sessione (sul tuo PC, una volta)

```bash
pip install -U garminconnect
python scripts/garmin_login_local.py
```
Inserisci email/password Garmin (e il codice MFA se attivo). Viene creato
**`garmin_token.txt`** (una stringa con i token di sessione). Copiane **tutto**
il contenuto, poi cancellalo.

## 2) Metti i Secret nel repo

GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valore |
|---|---|
| `GARMIN_TOKENS` | il contenuto di `garmin_token.txt` |
| `PALESTRINA_URL` | l'URL `/exec` della Web App |
| `PALESTRINA_TOKEN` | il token (Proprietà script `SECRET`) |

## 3) Prova

Actions → **Import Garmin** → **Run workflow**. Nei log vedi la misura inviata e
la risposta del backend. Poi apri Palestrina → **Misure**: dovresti vedere anche
muscolo/acqua/ossa/viscerale/età metabolica.

Da lì in poi parte **da sola ogni mattina** (cron `0 6 * * *` UTC). L'orario si
cambia nel workflow.

## Note e manutenzione

- Il token di sessione dura a lungo (mesi) e si rinnova ad ogni run. Se il
  workflow inizia a fallire con errori di login, **rifai il punto 1** e aggiorna
  `GARMIN_TOKENS`.
- Il **girovita** non è misurato dalla bilancia: resta manuale nell'app e viene
  **preservato** quando arriva un dato da Garmin (l'upsert fa merge per data).
- Se cambi account/bilancia Garmin: rigenera il token (punto 1).
- **Massa muscolare / acqua / ossa** in Garmin sono in grammi: lo script le
  converte in kg. La % grasso e la % acqua sono già percentuali.
