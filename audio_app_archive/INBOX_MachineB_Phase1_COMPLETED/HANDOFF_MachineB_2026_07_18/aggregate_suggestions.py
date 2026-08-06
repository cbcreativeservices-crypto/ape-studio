#!/usr/bin/env python3
"""aggregate_suggestions.py — collect all actionable committee suggestions.

Scans committee_OUTPUT for the given group range (default: groups > 80, the new
pass), maps every non-OK review / suggestion to its packet via the authored id
index, writes corrections_todo.json, and prints a verdict/severity tally plus the
list of NEEDS_REVISION terms.

Usage: python3 aggregate_suggestions.py [minGroup]   # default minGroup=81
"""
import json, os, glob, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))

def id_to_packet():
    m = {}
    for f in glob.glob(os.path.join(ROOT,"authored_OUTPUT","mb*.json")):
        pk = os.path.basename(f)[:6]
        d = json.load(open(f))
        for a in d["authored"]:
            m[a["id"]] = (pk, a["term"])
    return m

def main():
    ming = int(sys.argv[1]) if len(sys.argv) > 1 else 81
    idx = id_to_packet()
    todo = []
    verdicts = Counter()
    sev = Counter()
    needs_rev = []
    for f in sorted(glob.glob(os.path.join(ROOT,"committee_OUTPUT","*.json"))):
        d = json.load(open(f))
        g = int(d.get("group",0))
        if g < ming:
            continue
        role = d.get("expert","?")
        for r in d.get("reviews",[]):
            verdicts[r.get("verdict")] += 1
            if r.get("verdict") == "NEEDS_REVISION":
                pk = idx.get(r["id"],("?",r.get("term")))[0]
                needs_rev.append((pk, r["id"], r.get("term"), role))
            for s in r.get("suggestions",[]):
                sev[s.get("severity")] += 1
                pk, term = idx.get(r["id"], ("?", r.get("term")))
                todo.append({
                    "pkt": pk, "id": r["id"], "term": r.get("term"),
                    "field": s.get("field"), "severity": s.get("severity"),
                    "verdict": r.get("verdict"), "expert": role,
                    "issue": s.get("issue"), "suggestion": s.get("suggestion"),
                })
    todo.sort(key=lambda x: (x["pkt"], x["id"]))
    with open(os.path.join(ROOT,"corrections_todo.json"),"w") as f:
        json.dump(todo, f, ensure_ascii=False, indent=1)
    print("verdict tally:", dict(verdicts))
    print("severity tally:", dict(sev))
    print(f"total actionable suggestions: {len(todo)}")
    bypk = Counter(t["pkt"] for t in todo)
    print("suggestions per packet:")
    for pk in sorted(bypk): print(f"  {pk}: {bypk[pk]}")
    print(f"\nNEEDS_REVISION terms ({len(needs_rev)}):")
    for pk,i,term,role in sorted(needs_rev):
        print(f"  {pk} {term} [{role}]")

if __name__ == "__main__":
    main()
