#!/usr/bin/env python3
"""
Import composizione corporea da Garmin Connect → API Palestrina.
Gira in GitHub Actions (cron). Riprende la sessione salvata (stringa token in un
Secret), legge l'ultima misura della bilancia e la invia a ?action=addMeasure.

Env richiesti:
  GARMIN_TOKENS     stringa token prodotta da scripts/garmin_login_local.py
  PALESTRINA_URL    URL /exec della Web App
  PALESTRINA_TOKEN  il token (Proprietà script SECRET)

NB: usa l'API Garmin NON ufficiale (garminconnect): può cambiare.
"""
import json, os, sys, datetime, urllib.parse, urllib.request


def need(name):
    v = os.environ.get(name)
    if not v:
        sys.exit("Manca la variabile d'ambiente %s" % name)
    return v


def g2kg(v):
    return round(v / 1000.0, 1) if isinstance(v, (int, float)) and v else None


def num(v, d=1):
    return round(v, d) if isinstance(v, (int, float)) else None


def main():
    url = need("PALESTRINA_URL")
    token = need("PALESTRINA_TOKEN")
    gtok = need("GARMIN_TOKENS")

    from garminconnect import Garmin
    g = Garmin()
    g.login(gtok)  # riprende e rinnova la sessione dalla stringa token

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
