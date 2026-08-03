#!/usr/bin/env python3
"""
DA ESEGUIRE SUL TUO PC, UNA VOLTA.
Fa il login a Garmin Connect (gestisce l'MFA) e produce il token di sessione
in base64 da incollare nel Secret GitHub GARMIN_TOKENS_B64.

Prerequisito:  pip install -U garminconnect
Uso:           python scripts/garmin_login_local.py
Output:        garmin_tokens_b64.txt  (NON committarlo: è la tua sessione Garmin)
"""
import base64, io, os, tarfile, getpass
from garminconnect import Garmin

email = input("Email Garmin: ").strip()
pw = getpass.getpass("Password Garmin: ")

g = Garmin(email=email, password=pw, return_on_mfa=True)
res1, res2 = g.login()
if res1 == "needs_mfa":
    code = input("Codice MFA (SMS/app): ").strip()
    g.resume_login(res2, code)

TOKDIR = os.path.expanduser("~/.garminconnect")
g.garth.dump(TOKDIR)

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as t:
    t.add(TOKDIR, arcname=".garminconnect")
b64 = base64.b64encode(buf.getvalue()).decode()
with open("garmin_tokens_b64.txt", "w") as f:
    f.write(b64)

print("\nOK. Apri garmin_tokens_b64.txt e copia TUTTO nel Secret GARMIN_TOKENS_B64.")
print("Poi cancella il file. NON committarlo.")
