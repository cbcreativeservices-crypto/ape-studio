"""Inspection aid: print, guide by guide, every sentence of learner text that
carries a brand/model/authority hit (B), a citation form (C), or a run of
capitalised names (N, people/places/venues — reviewed by hand).
Usage: python flag_report.py <dir-of-guide-json> [first-guide-number last-guide-number]"""
import json, os, re, sys
from flags import BRAND_RE, CITE_RE

sys.stdout.reconfigure(encoding="utf-8")
d = sys.argv[1]
lo, hi = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1, 50)
NAME_RE = re.compile(r"(?<![.!?:]\s)(?<!^)\b[A-Z][a-zà-ÿ’']+(?:\s+(?:de|da|do|von|van|of|the)?\s*[A-Z][\wà-ÿ’']+)+")


def units(g):
    for k in ["purpose", "instruments", "arrangement", "dynamics", "balance", "vocals", "loudness", "notes"]:
        for i, b in enumerate(g[k]):
            yield f"{k}[{i}]", (b.get("label", "") + " " + b["text"]).strip()
    for k, v in g["glance"].items():
        yield f"glance.{k}", v
    for k in ["eq", "compression", "fx", "liveStudio"]:
        for i, r in enumerate(g[k]["rows"]):
            for c, v in r.items():
                yield f"{k}.rows[{i}].{c}", v
        for i, b in enumerate(g[k]["notes"]):
            yield f"{k}.notes[{i}]", (b.get("label", "") + " " + b["text"]).strip()


for f in sorted(os.listdir(d)):
    n = int(f[:2])
    if not lo <= n <= hi:
        continue
    g = json.load(open(os.path.join(d, f), encoding="utf-8"))
    print(f"===== {f}")
    for path, t in units(g):
        for s in re.split(r"(?<=[.!?])\s+(?=[A-Z“])", t):
            tags = ("B" if BRAND_RE.search(s) else "") + ("C" if CITE_RE.search(s) else "") + ("N" if NAME_RE.search(s) else "")
            if tags:
                hits = sorted(set(m.group(0) for m in BRAND_RE.finditer(s)))
                print(f"[{tags}] {path}: {s}" + (f"   <<{', '.join(hits)}>>" if hits else ""))
