#!/usr/bin/env python3
"""
AP&E Studio — hardened trophy-icon uploader (2026-07-08).

Fixes vs the original: SOURCE_DIR is baked in (no env-var/path mistakes), the
requests-install hint uses THIS interpreter, and the FIRST failure prints the
full server response so the cause (bad key / wrong key type / policy) is obvious.

RUN (PowerShell):
  python -m pip install requests
  $env:SUPABASE_SERVICE_ROLE_KEY = "<SERVICE ROLE key, Dashboard -> Settings -> API>"
  python "C:\\Users\\profe\\dev\\ape-studio\\docs\\upload_trophy_icons.py"

The key MUST be the *service_role* secret (NOT the anon/publishable key) — anon
is blocked by storage RLS and will 403.
"""
import os
import sys
import glob
import datetime

# Tee everything to a log file the build assistant can read directly, so the
# result doesn't depend on copy-pasting the terminal.
LOG_PATH = r"C:\Users\profe\dev\ape-studio\docs\upload_result.log"
_logf = open(LOG_PATH, "w", encoding="utf-8")

def log(*args):
    line = " ".join(str(a) for a in args)
    print(line)
    _logf.write(line + "\n")
    _logf.flush()

log(f"# trophy upload run {datetime.datetime.now().isoformat(timespec='seconds')}")

try:
    import requests
except ImportError:
    log("ERROR: 'requests' not installed for this Python.")
    log(f"  Fix:  \"{sys.executable}\" -m pip install requests")
    sys.exit(1)

SUPABASE_URL = "https://yjgolswjggmlpeowvtxr.supabase.co"
BUCKET = "trophy-icons"
SOURCE_DIR = r"C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP\trophy_icons_source"

# Key source, in order: env var, then a plain-text file next to this script.
# The FILE path is the easy one — paste the key into it with Notepad, save.
KEY_FILE = r"C:\Users\profe\dev\ape-studio\docs\service_key.txt"
KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
if not KEY and os.path.exists(KEY_FILE):
    KEY = open(KEY_FILE, encoding="utf-8").read().strip()
    log(f"Using key from file ({len(KEY)} chars).")
if not KEY:
    log("ERROR: no key. Paste the service_role secret into this file and save it:")
    log(f"  {KEY_FILE}")
    sys.exit(1)

# Guard against pasting PLACEHOLDER text instead of the real key. Two ways it
# has happened: the '<...>' with '→' arrows, and the 'eyJ...paste-...here...'
# example. Real keys are one token: no spaces, no '...', no example words.
bad_chars = [c for c in "<>→ " if c in KEY] + [c for c in KEY if ord(c) > 126]
placeholder_words = [w for w in ("paste", "here", "actual", "your", "example", "...") if w in KEY.lower()]
if bad_chars or placeholder_words:
    log("ERROR: that is placeholder text, not a real key.")
    if bad_chars:
        log("  invalid characters:", sorted(set(bad_chars)))
    if placeholder_words:
        log("  placeholder words/patterns:", placeholder_words)
    log("  Get the REAL key: Dashboard -> Project Settings -> API keys ->")
    log("  the 'secret' key (likely 'sb_secret_...') or legacy 'service_role' (eyJ...).")
    log("  Tip: set it with a prompt so there's no example to copy:")
    log('     $env:SUPABASE_SERVICE_ROLE_KEY = Read-Host "Paste the service_role key"')
    sys.exit(1)
if len(KEY) < 40:
    log(f"WARNING: key looks too short ({len(KEY)} chars) — is it the full key?")

files = sorted(glob.glob(os.path.join(SOURCE_DIR, "*.png")))
if not files:
    log(f"No .png files found in:\n  {SOURCE_DIR}\nCheck the folder path.")
    sys.exit(1)

log(f"Found {len(files)} PNG files. Uploading to bucket '{BUCKET}'...\n")

ok, fail = [], []
for i, path in enumerate(files):
    fname = os.path.basename(path)
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{requests.utils.quote(fname)}"
    with open(path, "rb") as fh:
        resp = requests.post(
            url,
            headers={
                "apikey": KEY,
                "Authorization": f"Bearer {KEY}",
                "Content-Type": "image/png",
                "x-upsert": "true",  # idempotent: re-runs overwrite instead of 409
            },
            data=fh.read(),
        )
    if resp.status_code in (200, 201):
        ok.append(fname)
        log(f"  OK   {fname}")
    else:
        fail.append((fname, resp.status_code))
        log(f"  FAIL {fname} -> {resp.status_code}: {resp.text[:300]}")
        if len(fail) == 1:
            log("  ^ first failure detail above. Common cause: wrong key (use service_role).")

log(f"\nDone. {len(ok)} uploaded, {len(fail)} failed.")
if fail:
    sys.exit(2)
