# Connector labs — code audit (Track B, overnight 2026-09-14b)

All four grade A · 0 critical · 0 major. Facts authored through a verified-record
layer with per-claim sourceNotes; later labs re-render from those records.

| Lab | Grade | Notes |
|---|---|---|
| Cable & Connector Fundamentals (12) | A | prior useShuffled hooks-crash FIXED & clean; XLR/AES3/SPDIF/DMX/speakON/PoE/MIDI all correct |
| Connector & Cable Selection | A | validateSelectionData machine-checks every can:true; roster 22 vs brief "20" — owner ruling |
| Cable Dressing & Installation (13) | A | authority-class model, no universal numbers by design; Skia art clean |
| Patchbay Signal Flow (8) | A | normalling engine impeccable (thru/full/half, top=tap bottom=break); tablet tap-target caveat |

## Owner-glance / verify-on-device (not bugs)
- Connector Selection roster: 22 built vs brief's "20" (self-flagged in roster.ts,
  test pins 22, no user-facing count). One-line owner decision.
- Patchbay tap-targets: previously lab-breaking on tablets (>~680pt), fix in place
  (%-of-art band, minHeight 44) but dev harness caps ≤480pt so it's invisible to
  devs — deserves a real tablet pass (this lab is the af_patchbay credit).
- Cable Fundamentals: 48 connector photos depend on live glossary-images Supabase
  bucket; graceful if missing but an unverifiable external dependency.

No SVG-black, no Skia black-fallback, no conditional hooks, no dead-ends,
no strand-on-error across all four.
