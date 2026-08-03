#!/usr/bin/env python3
"""
DA ESEGUIRE SUL TUO PC, UNA VOLTA.
Login a Garmin Connect (gestisce l'MFA) e salva il TOKEN DI SESSIONE come
stringa, da incollare nel Secret GitHub GARMIN_TOKENS.

Prerequisito:  pip install -U garminconnect
Uso:           python scripts/garmin_login_local.py
Output:        garmin_token.txt  (NON committarlo: è la tua sessione Garmin)
"""
import getpass
from garminconnect import Garmin

email = input("Email Garmin: ").strip()
pw = getpass.getpass("Password Garmin: ")

g = Garmin(email=email, password=pw, return_on_mfa=True)
res1, res2 = g.login()
if res1 == "needs_mfa":
    code = input("Codice MFA (SMS/app): ").strip()
    g.resume_login(res2, code)

token = g.client.dumps()  # stringa con i token OAuth di sessione
with open("garmin_token.txt", "w", encoding="utf-8") as f:
    f.write(token)

print("\nOK. Apri garmin_token.txt e copia TUTTO nel Secret GARMIN_TOKENS.")
print("Poi cancella il file. NON committarlo.")
