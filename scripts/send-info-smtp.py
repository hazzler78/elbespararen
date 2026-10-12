"""Personal Premium nudge from info@ (brand) via Domeneshop SMTP.
Same mailbox auth as hej@; From/Reply-To = info@ for brand separation.
Usage: python scripts/send-info-smtp.py
"""
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

env = {}
for line in Path(".env.local").read_text(encoding="utf-8", errors="ignore").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k.strip()] = v.strip().strip('"').strip("'")

from_ = env.get("MAIL_FROM") or "info@elbespararen.se"
user = env.get("HEJ_EMAIL_USER") or env.get("HEJ_EMAIL") or from_
pwd = env.get("HEJ_EMAIL_PASSWORD")
host = env.get("HEJ_SMTP_HOST", "smtp.domeneshop.no")
port = int(env.get("HEJ_SMTP_PORT", "587"))
if not pwd:
    raise SystemExit("MISSING_SMTP")

# Hottest free users at/over save wall (not mass). Hidden ≈ max(0, saved - 2).
# Pass recipients via CLI: python scripts/send-info-smtp.py oliver peter
# Default: none (avoid accidental resends). Explicit names required.
ALL_LEADS = {
    "oliver": ("Oliver", "axelsson.oliver@icloud.com", 6),
    "peter": ("Peter", "peter@phsalj.se", 1),
    "mattias": ("Mattias", "mattiasborjesson89@gmail.com", 0),  # 2/2 full
    "tor": ("Tor", "tor.odqvistextra@gmail.com", 0),  # 2/2 full
}

CHECKOUT = "https://elbespararen.se/dashboard?checkout=1"

def body_for(name: str, hidden: int) -> str:
    hi = f"Hej {name}," if name else "Hej,"
    lock = (
        f"Just nu syns bara 2 av dina sparade fakturor — {hidden} analys"
        f"{'' if hidden == 1 else 'er'} är dolda bakom gratisgränsen."
        if hidden > 0
        else "Din gratisplan är full (2/2 sparade fakturor) — nästa analys sparas inte utan Premium."
    )
    return f"""{hi}

{lock}

Premium kostar 49 kr/år (ca 4 kr/mån) och låser upp hela historiken + CSV-export.

Logga in så öppnas betalningen direkt (Stripe, säkert):
{CHECKOUT}

Hälsningar
Mikael / Elbespararen
info@elbespararen.se
"""

def send_one(name: str, to: str, hidden: int) -> None:
    msg = MIMEMultipart("alternative")
    subject = (
        f"{hidden} analys{'er' if hidden != 1 else ''} dolda — Premium 49 kr/år"
        if hidden > 0
        else "Gratisplanen full — Premium 49 kr/år"
    )
    msg["Subject"] = subject
    msg["From"] = f"Elbespararen <{from_}>"
    msg["To"] = to
    msg["Reply-To"] = from_
    msg.attach(MIMEText(body_for(name, hidden), "plain", "utf-8"))
    with smtplib.SMTP(host, port, timeout=30) as s:
        s.starttls()
        s.login(user, pwd)
        s.sendmail(from_, [to], msg.as_string())
    print("OK", to, f"hidden={hidden}")

if __name__ == "__main__":
    import sys
    keys = [a.lower() for a in sys.argv[1:] if a.lower() in ALL_LEADS]
    if not keys:
        raise SystemExit("Usage: python scripts/send-info-smtp.py mattias tor")
    for key in keys:
        name, to, hidden = ALL_LEADS[key]
        try:
            send_one(name, to, hidden)
        except Exception as e:
            print("FAIL", to, type(e).__name__, str(e)[:120])
