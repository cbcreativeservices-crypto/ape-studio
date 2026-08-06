#!/usr/bin/env python3
"""make_assignments.py — split corrections_todo.json into per-range assignment files.

Buckets the actionable suggestions by packet-number range so one correction agent
can own a contiguous range. New range files are numbered after the existing
corrections_log (which ends at range_08), i.e. starting at range_09.

Usage: python3 make_assignments.py
Writes corrections_assign/range_NN.json = {"range":NN,"packets":[...],"items":[...]}
"""
import json, os, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
# contiguous buckets over the newly-reviewed range mb0341-431
BUCKETS = [(341,380),(381,410),(411,431)]

def main():
    todo = json.load(open(os.path.join(ROOT,"corrections_todo.json")))
    os.makedirs(os.path.join(ROOT,"corrections_assign"), exist_ok=True)
    # next range number after existing corrections_log
    existing = [int(os.path.basename(p)[6:8]) for p in glob.glob(os.path.join(ROOT,"corrections_log","range_*.json"))]
    start = (max(existing)+1) if existing else 0
    created = []
    for bi,(lo,hi) in enumerate(BUCKETS):
        rn = start + bi
        items = [t for t in todo if t["pkt"]!="?" and lo <= int(t["pkt"][2:]) <= hi]
        pkts = sorted({t["pkt"] for t in items})
        out = {"range": rn, "span": f"mb{lo:04d}-mb{hi:04d}", "packets": pkts, "items": items}
        with open(os.path.join(ROOT,"corrections_assign",f"range_{rn:02d}.json"),"w") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        created.append((rn, len(items), len(pkts)))
    for rn,n,p in created:
        print(f"range_{rn:02d}: {n} suggestions across {p} packets")

if __name__ == "__main__":
    main()
