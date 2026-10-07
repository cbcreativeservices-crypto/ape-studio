"""Print the extracted block structure of one or more guides (inspection aid).
Usage: python dump.py <rawdir> 01-pop 02-hip-hop-rap ..."""
import json, sys, os

sys.stdout.reconfigure(encoding="utf-8")
raw = sys.argv[1]
for f in sys.argv[2:]:
    print("=====", f)
    for b in json.load(open(os.path.join(raw, f + ".json"), encoding="utf-8")):
        if b["kind"] == "p":
            flags = ("#" if b["numbered"] else "") + ("B" if b["allBold"] else "")
            print(f'[{b["style"]}{flags}|{b["boldPrefix"][:40]}] {b["text"]}')
        else:
            print("TABLE")
            for r in b["rows"]:
                print("   |", " || ".join(r))
