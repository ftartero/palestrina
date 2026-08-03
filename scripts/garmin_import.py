#!/usr/bin/env python3
"""
Import composizione corporea da Garmin Connect → API Palestrina.
Gira in GitHub Actions (cron). Riprende una sessione salvata (garth) da un
Secret, legge l'ultima misura e la invia a ?action=addMeasure.

Env richiesti:
  GARMIN_TOKENS_B64   base64 di un tar.gz della cartella ~/.garminconnect
                      (prodotto una volta con scripts/garmin_login_local.py)
  PALESTRINA_URL      URL /exec della Web App
  PALESTRINA_TOKEN    il token (Proprietà script SECRET)

NB: usa l'API Garmin NON ufficiale (garminconnect/garth): può cambiare.
"""
import base64, io, json, os, sys, tarfile, datetime, urllib.parse, urllib.request

HOME = os.path.expanduser("~")
TOKDIR = os.path.join(HOME, ".garminconnect")


def need(name):
    v = os.environ.get(name)
    if not v:
        sys.exit("Manca la variabile d'ambiente %s" % name)
    return v


def restore_tokens():
    raw = base64.b64decode(need("GARMIN_TOKENS_B64"))
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as t:
        t.extractall(HOME)  # ripristina la cartella .garminconnect


def g2kg(v):
    return round(v / 1000.0, 1) if isinstance(v, (int, float)) and v else None


def num(v, d=1):
    return round(v, d) if isinstance(v, (int, float)) else None


def main():
    url = need("PALESTRINA_URL")
    token = need("PALESTRINA_TOKEN")
    restore_tokens()

    from garminconnect import Garmin
    g = Garmin()
    g.login(TOKDIR)  # riprende e rinnova la sessione

    today = datetime.date.today()
    start = today - datetime.timedelta(days=14)
    bc = g.get_body_composition(start.isoformat(), today.isoformat()) or {}
    entries = [e for e in (bc.get("dateWeightList") or []) if e.get("weight")]
    if not entries:
        print("Nessuna misura Garmin negli ultimi 14 giorni.")
        return
    e = max(entries, key=lambda x: x.get("date") or 0)

    measure = {
        "date": e.get("calendarDate") or today.isoformat(),
        "weight": g2kg(e.get("weight")),
        "fat": num(e.get("bodyFat")),
        "muscle": g2kg(e.get("muscleMass")),
        "water": num(e.get("bodyWater")),
        "bone": g2kg(e.get("boneMass")),
        "visceral": e.get("visceralFat"),
        "metabolicAge": e.get("metabolicAge"),
    }
    measure = {k: v for k, v in measure.items() if v is not None}
    if "weight" not in measure:
        print("Ultima misura senza peso, salto.")
        return

    api = url + "?token=" + urllib.parse.quote(token) + "&action=addMeasure"
    req = urllib.request.Request(
        api, data=json.dumps(measure).encode("utf-8"),
        method="POST", headers={"Content-Type": "text/plain"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode()
    print("Inviata misura:", measure)
    print("Risposta backend:", body)
    if '"error"' in body:
        sys.exit("Il backend ha risposto con errore.")


if __name__ == "__main__":
    main()
