"""List IMAP folders + message counts for hej@ mailbox (aliases share inbox)."""
from pathlib import Path
import imaplib

env = {}
for line in Path(".env.local").read_text(encoding="utf-8", errors="ignore").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k.strip()] = v.strip().strip('"').strip("'")

user = env.get("HEJ_EMAIL_USER") or env.get("HEJ_EMAIL")
pwd = env.get("HEJ_EMAIL_PASSWORD")
host = env.get("HEJ_IMAP_HOST", "imap.domeneshop.no")
if not user or not pwd:
    raise SystemExit("MISSING_CREDS")

M = imaplib.IMAP4_SSL(host)
M.login(user, pwd)
typ, boxes = M.list()
print("boxes", len(boxes or []))
for b in boxes or []:
    print(b.decode(errors="replace"))

for folder in ["INBOX", "Sent", "INBOX.Sent", "Junk", "Spam", "INBOX.Junk", "Trash", "INBOX.Trash"]:
    try:
        typ, data = M.select(folder, readonly=True)
        if typ != "OK":
            print("skip", folder, typ)
            continue
        typ, data = M.search(None, "ALL")
        ids = data[0].split() if data and data[0] else []
        typ, data = M.search(None, "UNSEEN")
        u = data[0].split() if data and data[0] else []
        print(folder, "messages", len(ids), "unseen", len(u))
    except Exception as e:
        print("err", folder, type(e).__name__, str(e)[:80])
M.logout()
