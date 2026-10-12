"""Count messages in hej@ IMAP inbox. Prints counts only — no message bodies."""
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
typ, data = M.select("INBOX")
print("select", typ, data[0].decode() if data and data[0] else None)
typ, data = M.search(None, "ALL")
ids = data[0].split() if data and data[0] else []
print("messages", len(ids))
typ, data = M.search(None, "UNSEEN")
uids = data[0].split() if data and data[0] else []
print("unseen", len(uids))
M.logout()
