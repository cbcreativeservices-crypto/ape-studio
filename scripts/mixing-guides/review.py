"""Second-pass review of the CONVERTED guides (inspection aid): sentences that
name people/places with 2+ capitalised words anywhere (sentence starts too),
or that use attribution verbs. Usage: python review.py <repo-or-out-root> [pattern]"""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
root = sys.argv[1]
d = os.path.join(root, "src", "screens", "lab", "mixingGuides", "data", "guides")
ATTR = re.compile(r"\b(engineer|mixer|designer|producer)s?\b[^.]{0,60}\b(says?|said|notes?|noted|describes?|cites?|reports?|reported|recommends?|uses?|used|favors?|runs?|ran|keeps?)\b|\bas [A-Z]\w+ (?:put|says|describes)|\b(?:famously|according)\b", re.I)
NAMES = re.compile(r"\b[A-Z][a-zà-ÿ’'.]+(?:\s+[A-Z][\wà-ÿ’'.]+)+")
extra = re.compile(sys.argv[2]) if len(sys.argv) > 2 else None


def strings(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, list):
        for x in v:
            yield from strings(x)
    elif isinstance(v, dict):
        for k, x in v.items():
            if k not in ("references", "id", "title"):
                yield from strings(x)


for f in sorted(os.listdir(d)):
    src = open(os.path.join(d, f), encoding="utf-8").read()
    g = json.loads(src[src.index("= {") + 2: src.rindex(";")])
    seen = set()
    for t in strings(g):
        for s in re.split(r"(?<=[.!?;])\s+", t):
            if s in seen:
                continue
            hit = ATTR.search(s) or (extra and extra.search(s))
            names = [m for m in NAMES.findall(s) if not re.match(r"^(Live|Studio|The|In|On|For|A|At|Keep|Use|Mix|Check|If|When|Mistake)\b", m)]
            if hit or names:
                seen.add(s)
                print(f"{f[:3]} {'A' if hit else ' '} {names[:4]} :: {s[:220]}")
