"""Personal nudge to free users with exactly 1 saved analysis (not mass).
From info@. Link: upload + soft Premium. Usage: python scripts/send-info-oneleft.py
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

# Exactly 1 saved (from D1): next save fills free plan — activation + soft upsell.
RECIPIENTS = [
    ("Pontus", "pontus@osterlindh.com"),
    ("Per", "en_berg@live.se"),
    ("Matthias", "cpfisken1@gmail.com"),
]

UPLOAD = "https://elbespararen.se/upload"
CHECKOUT = "https://elbespararen.se/dashboard?checkout=1"

def body_for(name: str) -> str:
    hi = f"Hej {name}," if name else "Hej,"
    return f"""{hi}

Du har 1 av 2 gratisplatser kvar på Elbespararen — ladda upp nästa elräkning så ser du om kostnaden går rätt väg:

{UPLOAD}

När gratisplanen är full (2/2) sparas nya analyser inte utan Premium (49 kr/år, ca 4 kr/mån). Då öppnas betalningen här om du vill låsa upp historik + CSV:

{CHECKOUT}

Hälsningar
Mikael / Elbespararen
info@elbespararen.se
"""

def send_one(name: str, to: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "1 gratisplats kvar — ladda upp nästa faktura"
    msg["From"] = f"Elbespararen <{from_}>"
    msg["To"] = to
    msg["Reply-To"] = from_
    msg.attach(MIMEText(body_for(name), "plain", "utf-8"))
    with smtplib.SMTP(host, port, timeout=30) as s:
        s.starttls()
        s.login(user, pwd)
        s.sendmail(from_, [to], msg.as_string())
    print("OK", to)

if __name__ == "__main__":
    for name, to in RECIPIENTS:
        try:
            send_one(name, to)
        except Exception as e:
            print("FAIL", to, type(e).__name__, str(e)[:120])
