#!/usr/bin/env python3
"""verify_committee.py — check committee coverage for review groups.

For each group number given (or all groups present in review_packets/), verify:
  - all three role files exist (audio, cognition, language)
  - each role's reviews count == the group's term count
  - each role's review ids match the group's term ids, in order
  - every verdict is OK|MINOR|NEEDS_REVISION; suggestions well-formed
Exit 0 iff no errors.

Usage:
  python3 verify_committee.py 81 82 83
  python3 verify_committee.py all
"""
import json, os, glob, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ROLES = ["audio","cognition","language"]
VERDICTS = {"OK","MINOR","NEEDS_REVISION"}

def group_terms(g):
    p = os.path.join(ROOT,"review_packets",f"group_{g:03d}.json")
    if not os.path.exists(p): return None
    return json.load(open(p))["terms"]

def main():
    args = sys.argv[1:]
    if not args or args==["all"]:
        gs = sorted(int(os.path.basename(p)[6:9]) for p in glob.glob(os.path.join(ROOT,"review_packets","group_*.json")))
    else:
        gs = [int(a) for a in args]
    errs=[]
    for g in gs:
        terms = group_terms(g)
        if terms is None:
            errs.append(f"group {g}: no review_packets/group_{g:03d}.json"); continue
        want_ids = [t["id"] for t in terms]
        for role in ROLES:
            cf = os.path.join(ROOT,"committee_OUTPUT",f"{role}_{g:03d}.json")
            if not os.path.exists(cf):
                errs.append(f"group {g}: missing {role}_{g:03d}.json"); continue
            try:
                d=json.load(open(cf))
            except Exception as e:
                errs.append(f"group {g} {role}: JSON parse error: {e}"); continue
            revs=d.get("reviews",[])
            if len(revs)!=len(want_ids):
                errs.append(f"group {g} {role}: {len(revs)} reviews != {len(want_ids)} terms")
            got=[r.get("id") for r in revs]
            for k,(a,b) in enumerate(zip(got,want_ids)):
                if a!=b:
                    errs.append(f"group {g} {role}: id order mismatch at {k}: {a} != {b}"); break
            for r in revs:
                if r.get("verdict") not in VERDICTS:
                    errs.append(f"group {g} {role}: bad verdict {r.get('verdict')!r} for {r.get('id')}")
                for s in r.get("suggestions",[]):
                    if s.get("severity") not in {"High","Medium","Low"}:
                        errs.append(f"group {g} {role}: bad severity for {r.get('id')}")
                    if not s.get("field"):
                        errs.append(f"group {g} {role}: suggestion missing field for {r.get('id')}")
    for e in errs: print("ERROR", e)
    print(f"\nverify_committee.py: {len(gs)} group(s), {len(errs)} error(s)")
    sys.exit(1 if errs else 0)

if __name__=="__main__":
    main()
