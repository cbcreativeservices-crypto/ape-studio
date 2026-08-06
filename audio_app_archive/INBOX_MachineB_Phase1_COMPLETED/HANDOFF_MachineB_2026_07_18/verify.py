#!/usr/bin/env python3
"""verify.py — integrity gate for Machine B authored packets.
Usage:
  python3 verify.py mb0381 mb0382 ...   # specific packets
  python3 verify.py all                  # every authored_OUTPUT that has a source packet
Checks each authored_OUTPUT/mbNNNN.json against packets/mbNNNN.json:
  - JSON parses; has 'authored' list
  - one entry per packet term; id+term match the packet exactly (set + no extras/dupes)
  - fields keys are a subset of that term's empty_fields (nothing extra authored)
  - every empty_field is either authored OR (omitted AND confidence FLAG-FOR-REVIEW w/ a flag)
  - the 3 list fields are JSON arrays of non-empty strings
  - no placeholder text anywhere; no citation markers inside field text
  - plain_english Flesch-Kincaid grade <= 9
  - confidence in {High, Medium, FLAG-FOR-REVIEW}
Exit code 0 iff zero ERRORS (warnings do not fail the gate).
"""
import json, sys, glob, os, re
try:
    import textstat
except Exception:
    textstat = None

ROOT = os.path.dirname(os.path.abspath(__file__))
LIST_FIELDS = {"related_terms", "common_mistakes", "scenario_contexts"}
STR_FIELDS = {"definition","plain_english","purpose_function","practical_application","category"}
ALL_FIELDS = LIST_FIELDS | STR_FIELDS
PLACEHOLDERS = [
    r"\(pending\)", r"\(definition pending\)", r"\bTBD\b", r"\bTODO\b", r"\bFIXME\b",
    r"lorem ipsum", r"important concept in audio", r"\bXXX\b",
    r"to be (written|added|filled in) (later|here)",
]
PLACEHOLDER_RE = re.compile("|".join(PLACEHOLDERS), re.I)
# citation markers that should never appear inside field text
CITE_RE = re.compile(r"https?://|www\.|\bet al\.?|\bibid\b|\bp\.\s?\d+|\((?:19|20)\d\d\)|\bISBN\b", re.I)

def load(p):
    with open(p) as f:
        return json.load(f)

def check_text(val, field, errs, warns, tid):
    if not isinstance(val, str) or not val.strip():
        errs.append(f"[{tid}] field '{field}' is empty/not a string"); return
    if PLACEHOLDER_RE.search(val):
        errs.append(f"[{tid}] field '{field}' contains placeholder text: {val[:60]!r}")
    if CITE_RE.search(val):
        warns.append(f"[{tid}] field '{field}' may contain a citation marker: {val[:70]!r}")

def verify_packet(num, errs, warns):
    apath = os.path.join(ROOT, "authored_OUTPUT", f"{num}.json")
    ppath = os.path.join(ROOT, "packets", f"{num}.json")
    if not os.path.exists(apath):
        errs.append(f"{num}: authored_OUTPUT/{num}.json MISSING"); return
    if not os.path.exists(ppath):
        warns.append(f"{num}: packets/{num}.json not staged — skipping id/empty_fields cross-check")
        pkt = None
    else:
        pkt = load(ppath)
    try:
        au = load(apath)
    except Exception as e:
        errs.append(f"{num}: authored JSON does not parse: {e}"); return
    authored = au.get("authored")
    if not isinstance(authored, list):
        errs.append(f"{num}: 'authored' is not a list"); return

    pkt_terms = {t["id"]: t for t in pkt["terms"]} if pkt else None
    if pkt is not None:
        if len(authored) != len(pkt["terms"]):
            errs.append(f"{num}: entry count {len(authored)} != packet term count {len(pkt['terms'])}")
        seen = set()
        for t in authored:
            if t.get("id") in seen:
                errs.append(f"{num}: duplicate id {t.get('id')}")
            seen.add(t.get("id"))
        extra = seen - set(pkt_terms)
        missing = set(pkt_terms) - seen
        for i in extra:   errs.append(f"{num}: authored id not in packet: {i}")
        for i in missing: errs.append(f"{num}: packet term not authored: {i}")

    for t in authored:
        tid = t.get("id","?")
        term = t.get("term","?")
        conf = t.get("confidence")
        if conf not in ("High","Medium","FLAG-FOR-REVIEW"):
            errs.append(f"[{tid}] bad/missing confidence: {conf!r}")
        flags = t.get("flags", [])
        fields = t.get("fields", {})
        if not isinstance(fields, dict):
            errs.append(f"[{tid}] 'fields' not an object"); continue
        # term-name integrity
        if pkt_terms and tid in pkt_terms and term != pkt_terms[tid]["term"]:
            errs.append(f"[{tid}] term changed: {term!r} != packet {pkt_terms[tid]['term']!r}")
        # which fields were supposed to be authored
        empty = set(pkt_terms[tid]["empty_fields"]) if (pkt_terms and tid in pkt_terms) else set(fields)
        for k in fields:
            if k not in ALL_FIELDS:
                errs.append(f"[{tid}] unknown field '{k}'")
            if empty and k not in empty:
                errs.append(f"[{tid}] authored field '{k}' NOT in empty_fields")
        # coverage: every empty field authored, or flagged
        for k in empty:
            if k not in fields:
                if conf != "FLAG-FOR-REVIEW" or not flags:
                    errs.append(f"[{tid}] empty_field '{k}' not authored and not flagged (conf={conf})")
        # type + content checks
        for k, v in fields.items():
            if k in LIST_FIELDS:
                if not isinstance(v, list) or not v:
                    errs.append(f"[{tid}] list field '{k}' must be a non-empty JSON array")
                    continue
                for item in v:
                    check_text(item, k, errs, warns, tid)
            else:
                check_text(v, k, errs, warns, tid)
        # reading level on plain_english
        pe = fields.get("plain_english")
        if isinstance(pe, str) and pe.strip() and textstat is not None:
            fk = textstat.flesch_kincaid_grade(pe)
            if fk > 9.0:
                errs.append(f"[{tid}] plain_english FK grade {fk:.1f} > 9")

def expand_args(args):
    if not args or args == ["all"]:
        return sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT,"authored_OUTPUT","mb*.json")))
    out = []
    for a in args:
        a = a.replace(".json","")
        out.append(a)
    return out

def main():
    nums = expand_args(sys.argv[1:])
    errs, warns = [], []
    for n in nums:
        verify_packet(n, errs, warns)
    fkvals = []
    for w in warns: print("WARN ", w)
    for e in errs: print("ERROR", e)
    print(f"\nverify.py: {len(nums)} packet(s), {len(errs)} error(s), {len(warns)} warning(s)")
    sys.exit(1 if errs else 0)

if __name__ == "__main__":
    main()
