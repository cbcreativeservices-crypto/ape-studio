#!/usr/bin/env python3
# Resolve a docs/CROSS_SESSION_HANDOFF.md merge conflict: keep every LOG entry from both sides (newest first).
# Usage (from the repo root, mid-merge):
#   git show :2:docs/CROSS_SESSION_HANDOFF.md > ours.md ; git show :3:docs/CROSS_SESSION_HANDOFF.md > theirs.md
#   python -I scripts/merge-handoff-log.py ours.md theirs.md docs/CROSS_SESSION_HANDOFF.md
"""Union two versions of CROSS_SESSION_HANDOFF.md: same preamble, LOG entries
from both sides (deduped by header line), newest first. Text after the LOG is
taken from 'ours' (both sides share it apart from LOG entries)."""
import re, sys
ours, theirs, out = sys.argv[1:4]
read = lambda p: open(p, encoding='utf-8', newline='').read().replace('\r\n', '\n')
A, B = read(ours), read(theirs)
MARK = '## LOG (newest first)\n'
pa, la = A.split(MARK, 1)
pb, lb = B.split(MARK, 1)
def entries(log):
    parts = re.split(r'(?m)^(?=### \d{4}-\d{2}-\d{2} )', log)
    head, ents = parts[0], parts[1:]
    return head, ents
ha, ea = entries(la)
hb, eb = entries(lb)
seen, merged = set(), []
for e in ea + eb:
    key = e.split('\n', 1)[0].strip()
    if key in seen:
        continue
    seen.add(key)
    merged.append(e if e.endswith('\n\n') else e.rstrip('\n') + '\n\n')
def stamp(e):
    m = re.match(r'### (\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?', e)
    return (m.group(1), m.group(2) or '00:00')
merged.sort(key=stamp, reverse=True)
text = pa + MARK + ha + ''.join(merged)
open(out, 'w', encoding='utf-8', newline='').write(text.replace('\n', '\r\n'))
print('entries ours', len(ea), 'theirs', len(eb), 'merged', len(merged))
