# AP&E Glossary — Batch 1 Summary Report

**Batch:** 1 of ~24 · **Scope:** first 50 terms alphabetically (the "A" set)
**Date:** 2026-06-20 · **Status:** CANDIDATE / PENDING APPROVAL
**Master output:** `AP&E_Glossary_v6_Batch1_MASTER.xlsx`

---

## At a glance

| Metric | Count |
|--------|------:|
| Terms reviewed | 50 |
| Terms modified (content revised → *Pending Approval*) | 15 |
| Terms kept *approved* (Media recommendation added only) | 35 |
| Media fields populated (were blank) | 49 of 50 |
| Misplaced Media notes corrected (data integrity) | 4 |
| Self-referential Related Terms fixed | 6 |
| Technical-accuracy revisions | 3 |
| Category corrections | 3 |
| Terms reopened from prior batches | 0 (first batch) |
| Duplicate / cluster groups identified | 3 |
| Weight % left blank (not fabricated) | 18 |
| Decision Log standards created | 19 |

## Terms modified (15)

**Data-integrity — wrong Media note replaced:** 12AU7 / ECC82 · 12AX7 / ECC83 · Acoustic baffle · ADR
**Technical-accuracy revision:** A-weighting · Active ribbon microphone · AES67
**Category correction:** Absorption · Absorption coefficient · (AES67, above)
**Self-reference removed from Related Terms:** About Me Page · Accountability · Active Listening · Adaptability · Advertising · Advisory Board

## What was found

**1. Media-note drift (systemic).** Four legitimate media notes had migrated onto unrelated rows — an ADSR-envelope video on the *12AU7* tube, a graphic-EQ image on the *12AX7* tube, an absorption-table image on *Acoustic baffle*, and a sidechain-ducking video on *ADR*. The pattern (each tagged "ONE video for [topic]") suggests row-shift during a prior authoring pass. **Likely affects later batches — flagged for per-batch media audit.**

**2. Self-referential cross-references.** Six MUSI108/MUSI205B career terms listed themselves in Related Terms. Removed and replaced with genuine neighbors.

**3. Technical imprecisions.** (a) *A-weighting* said it "emphasizes midrange" — corrected to pass mid near-unity while attenuating the extremes. (b) *Active ribbon microphone* claimed active circuitry yields "line-level impedance" — corrected (output stays mic level; impedance is merely low/consistent). (c) *AES67* was defined as "AES3 over IP" — corrected to an audio-over-IP interoperability standard (RTP/PTP, uncompressed PCM).

**4. Category inconsistency.** The catch-all "Audio Technology" is used for unrelated concepts; "Sound Reinforcement" was wrongly on *AES67*. Three clear fixes applied; a file-wide taxonomy is **proposed but not yet applied** (needs approval).

**5. Weight % blanks — not fabricated.** 18 of 50 are blank. Per your constitution (no hallucinated dimensions), these are flagged for the course blueprint rather than guessed.

## Duplicate / cluster groups identified

- **ADC cluster:** `ADC` · `A/D converter (ADC)` · `ADC / DAC` — overlapping; retained, cross-referenced. Confirm intent.
- **A-weighting pair:** `A-weighted (dBA)` (metric) · `A-weighting` (filter) — now reciprocally linked.
- **AFL pair:** `AFL & PFL (monitor bus modes)` · `AFL (After-Fade Listen)` — overlapping; retained.

## Cross-reference issues

- 6 self-references removed (X-1, now Locked).
- 1 missing reciprocal link added (A-weighting → A-weighted (dBA)).
- Related-Terms capitalization normalized on revised terms; file-wide pass pending (X-2).

## Items requiring future review

1. **Approve the Category taxonomy** (Decision Log §6) before file-wide application.
2. **Provide Weight % source** (course blueprint) or confirm leaving blanks.
3. **Audit media-note alignment** in every subsequent batch (drift is systemic).
4. **Confirm** retention of the ADC / A-weighting / AFL near-duplicate clusters.
5. **Approve** file-wide Related-Terms capitalization normalization.

## Verification performed

- Row count preserved: 1,203 data rows (was 1,203). ✓
- Sheets preserved: Instructions, Glossary, Valid Topics. ✓
- Columns preserved: 18. ✓
- All 50 batch Media fields non-blank. ✓
- Exactly 15 terms flagged *Revised* globally — no spillover to the other 1,153. ✓
- 4 corrected-media terms confirmed by spot-check. ✓

**Nothing in this batch is marked Final or Production-Ready.** All 15 revisions are *Candidate / Pending Approval* per your constitution.
