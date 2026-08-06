#!/usr/bin/env python3
"""build_review.py — assemble committee review packets from authored output.

Because the original topic-ordered groups 1-80 are already fully reviewed, this
reconstruction only builds NEW groups for authored terms that do NOT yet have a
committee review, numbered starting AFTER the highest existing group (so existing
committee_OUTPUT files are never invalidated).

Each review entry merges the packet base (id, term, topic, difficulty) with the
current field values (packet original value, overridden by the authored value).

Usage:
  python3 build_review.py                # all un-reviewed authored terms
  python3 build_review.py 341 431        # only authored packets in [start,end]
Writes review_packets/group_NNN.json = {"group":N,"terms":[...full entries...]}
and prints the group numbers created.
"""
import json, os, glob, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
FIELDS = ["definition","plain_english","purpose_function","practical_application",
          "category","related_terms","common_mistakes","scenario_contexts"]
CHUNK = 35

def reviewed_ids():
    ids = set()
    maxg = 0
    for f in glob.glob(os.path.join(ROOT,"committee_OUTPUT","*.json")):
        d = json.load(open(f))
        maxg = max(maxg, int(d.get("group",0)))
        for r in d.get("reviews",[]):
            ids.add(r["id"])
    return ids, maxg

def load_packet(num):
    p = os.path.join(ROOT,"packets",f"{num}.json")
    return json.load(open(p)) if os.path.exists(p) else None

def main():
    lo, hi = 1, 431
    if len(sys.argv) == 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    done_ids, maxg = reviewed_ids()
    entries = []
    missing_pkt = []
    for i in range(lo, hi+1):
        num = "mb%04d" % i
        apath = os.path.join(ROOT,"authored_OUTPUT",f"{num}.json")
        if not os.path.exists(apath):
            continue
        au = json.load(open(apath))
        pkt = load_packet(num)
        pkt_terms = {t["id"]: t for t in pkt["terms"]} if pkt else {}
        for a in au["authored"]:
            if a["id"] in done_ids:
                continue  # already reviewed
            if a.get("confidence") == "FLAG-FOR-REVIEW" or not a.get("fields"):
                continue  # flagged/blank — nothing to review (goes to Booth)
            base = pkt_terms.get(a["id"], {})
            if not base:
                missing_pkt.append(num)
            entry = {
                "id": a["id"], "term": a["term"],
                "topic": base.get("topic", au.get("topic","")),
                "difficulty": base.get("difficulty"),
            }
            for fld in FIELDS:
                val = a.get("fields",{}).get(fld, base.get(fld))
                entry[fld] = val
            entries.append(entry)
    # chunk & number after maxg
    created = []
    os.makedirs(os.path.join(ROOT,"review_packets"), exist_ok=True)
    for j in range(0, len(entries), CHUNK):
        g = maxg + 1 + (j // CHUNK)
        chunk = entries[j:j+CHUNK]
        out = {"group": g, "terms": chunk}
        with open(os.path.join(ROOT,"review_packets",f"group_{g:03d}.json"),"w") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        created.append((g, len(chunk)))
    print(f"un-reviewed authored terms in [{lo},{hi}]: {len(entries)}")
    print(f"existing max group: {maxg}; created groups: {[g for g,_ in created]}")
    for g,n in created: print(f"  group_{g:03d}: {n} terms")
    if missing_pkt:
        print(f"WARN: {len(set(missing_pkt))} packet(s) not staged (base fields fell back to authored/topic): {sorted(set(missing_pkt))[:10]}")

if __name__ == "__main__":
    main()
