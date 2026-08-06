#!/usr/bin/env python3
"""
AP&E plain_english READABILITY GATE  —  run this BEFORE handing any batch back.

Checks every plain_english value against the standing rule:
  Flesch-Kincaid grade <= 9  (a standard 14-year-old must understand it)

Usage:
    python3 check_readability.py <folder-of-authored-or-corrected-json>
    python3 check_readability.py authored_OUTPUT

Exit code 0 = all pass. Exit code 1 = failures listed (fix them, re-run).

WHY THIS EXISTS: on a 382-term batch the 3-expert committee flagged 129
readability problems by eye; this script then found 100 MORE it had missed.
Human-style review does not catch this reliably. Always run the gate.
"""
import json, glob, os, re, sys, statistics

VOWELS = "aeiouy"

def syllables(word):
    w = re.sub(r'[^a-z]', '', word.lower())
    if not w: return 0
    n, prev = 0, False
    for ch in w:
        v = ch in VOWELS
        if v and not prev: n += 1
        prev = v
    if w.endswith('e') and n > 1: n -= 1
    return max(n, 1)

def fk(text):
    """Returns (grade, reading_ease, words_per_sentence) or None."""
    if not text or not text.strip(): return None
    sents = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    words = re.findall(r"[A-Za-z']+", text)
    if not sents or not words: return None
    S, W = len(sents), len(words)
    SY = sum(syllables(w) for w in words)
    grade = 0.39*(W/S) + 11.8*(SY/W) - 15.59
    ease  = 206.835 - 1.015*(W/S) - 84.6*(SY/W)
    return round(grade,1), round(ease,1), round(W/S,1)

def longest_sentence(text):
    return max((len(re.findall(r"[A-Za-z']+", s)) for s in re.split(r'[.!?]+', text) if s.strip()), default=0)

def main(folder):
    rows, missing = [], 0
    for f in sorted(glob.glob(os.path.join(folder, '*.json'))):
        try: d = json.load(open(f, encoding='utf-8'))
        except Exception as e:
            print(f"!! CANNOT PARSE {os.path.basename(f)}: {e}"); return 1
        entries = d.get('authored') or d.get('corrections') or d.get('rewrites') or []
        for e in entries:
            fields = e.get('fields') or e.get('corrected') or e
            pe = fields.get('plain_english') if isinstance(fields, dict) else None
            if not pe: missing += 1; continue
            r = fk(pe)
            if r: rows.append((e.get('term','?'), r[0], r[1], longest_sentence(pe), pe))
    if not rows:
        print("No plain_english values found — check the folder path."); return 1
    grades = [r[1] for r in rows]
    fails  = [r for r in rows if r[1] > 9]
    longs  = [r for r in rows if r[3] > 20]
    print(f"plain_english checked : {len(rows)}   (entries without plain_english: {missing})")
    print(f"mean FK grade         : {statistics.mean(grades):.1f}")
    print(f"max  FK grade         : {max(grades)}")
    print(f"PASS (<=9)            : {len(rows)-len(fails)}/{len(rows)}")
    print(f"FAIL (>9)             : {len(fails)}")
    print(f"sentences over 20 words: {len(longs)}")
    if fails:
        print("\n--- FAILURES (rewrite these, then re-run) ---")
        for t, g, ease, ls, pe in sorted(fails, key=lambda x: -x[1]):
            print(f"\n  {t}   FK grade {g} | ease {ease} | longest sentence {ls} words")
            print(f"    {pe[:220]}")
        print("\nFIX: split into 2-4 short sentences (<=20 words each). The words are usually")
        print("already simple - it is sentence LENGTH that fails. Never change the facts.")
        return 1
    print("\nGATE PASSED - all plain_english at grade 9 or below.")
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'authored_OUTPUT'))
