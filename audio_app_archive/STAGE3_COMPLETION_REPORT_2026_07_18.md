# STAGE 3 — COMPLETE ✅ (2026-07-18, Claude Code local session)

Re-homed all 3,665 live glossary terms onto v2 topics. Additive only; v1 untouched.

## What was executed
1. **v1→v2 map rebuilt** (prior ROUTING_RULES artifact was lost with the container; rebuilt from
   `APE_Course_Topic_Matrix_v2 (2).json` [canonical 26/203, verified = deployed v2 achievements],
   `APE_TOPIC_EXPANSION_2026_07_16.md`, and the deployed topic lists):
   - 28 v1 topics map 1:1 → `stage3_map_20260718` (kept in DB).
   - 23 v1 split topics (2,540 term-links) routed per-term by 13 parallel routing agents using
     `stage3_rehoming_2026_07_18/ROUTING_GUIDANCE.md`. Assignments in
     `stage3_rehoming_2026_07_18/routed_<v1gs>.tsv` and DB table `stage3_routed_20260718`
     (checksum-verified byte-identical to the TSVs; 2,540 rows).
2. **Link insert**: 4,632 new `glossary_topics` rows (4,682 v1 links → 50 deduped where two v1
   links of one term converged on the same v2 topic). Coverage pre-verified: 2,540 routed +
   2,142 one-to-one = 4,682 = every live link; 0 unmatched, 0 bad targets.
3. **The 7 Stage-4 collision terms linked** (CSV-intended homes, as secondary links):
   Base→890, Capture→1890, CLAP→1910, Emitter→890, Gate→890, Heater→690, Pad→910.
   (The CSV meant new senses — transistor terminals, tube heater, PCB pad — while the live rows
   define the audio senses. Flag for Stage 5: these definitions may need sense disambiguation.)

## ⚠️ Design deviation — primary flags (matters for Stage 6)
Partial unique index `ux_glossary_topics_one_primary` enforces ONE primary link per glossary term
**across versions**. Live terms keep their v1 primary until cutover, so **all Stage-3 v2 links were
inserted `is_primary=false`**. The intended v2 primary for each live term (= its v1 primary link
mapped to v2) is recorded in **`stage3_primary_intent_20260718`** (3,665 rows, one per live term,
all referencing existing links). **Stage 6 must flip primaries**: set the v1 links' `is_primary`
false and the intent rows' links true (or equivalent single UPDATE), before/with activating v2.

## Verified state after Stage 3
- glossary 14,249 (unchanged) · pending 10,584 (unchanged)
- v2 links 15,223 = 10,584 (Stage 4) + 4,632 (Stage 3) + 7 (collisions) · 0 orphans
- live terms with ≥1 v2 link: 3,665 / 3,665 · v1 links 4,682 (unchanged) · v1 active, v2 draft
- 14 v2 topics still have 0 terms — all expected: 140 Batteries (pending Booth), 860/870
  commercial cards (unsourced), 920 Bench Test, 1410–1490 audiology/perception stream (separate
  July-16 backlog insert), 1680 Immersive Music Prod, 1950 Load-In/Strike.
- Hot children after Stage 3: 1230 → 293, 1012 → 227, 212 → 207 (rebalance flag still open).

## Routing judgment calls (for Booth spot-check)
Agents flagged low-confidence routings; full notes in their TSVs' companion (this report). Notables:
- v1 gs3 'Vacuum tube' → 170 (misfiled in v1; no good target) · gs24 'RIAA equalization curve' →
  990 (likely misfiled) · gs42 'ADR' → 1200 (film term; no post target in that group).
- Terms with no clean target in their group's family were routed to the group default rather than
  cross-family (e.g. gs13 'Headphone'/'Soundbar' → 640). Booth can re-route individually later —
  all additive rows, term-level UPDATEs are safe.

## Rollback (Stage 3 only)
```sql
DELETE FROM glossary_topics gt USING achievements a, glossary g
WHERE a.id=gt.achievement_id AND g.id=gt.glossary_id
  AND a.curriculum_version_id='51c1d5db-1d05-4d43-8853-5fa1503fb751'
  AND g.definition <> '(pending)';
DROP TABLE stage3_primary_intent_20260718;
```
(Stage-4 links are only on pending terms, so this cleanly targets Stage-3 + collision rows.)

## BLOCKED — need two files from the claude.ai Project (download to local Downloads)
1. `CROSSLIST_ASSIGNMENT_v2_FINAL_2026_07_18.csv` → unblocks **Stage 4b** (6,676 cross-lists).
2. `GLOSSARY_LEGAL_TRADEMARK_COPYRIGHT_GUIDANCE` → required before **Stage 5** authoring
   (10,584 pending definitions).
Neither file exists anywhere on this machine (searched Downloads, Documents, OneDrive, temp).

## Next
Stage 4b (needs file 1) → Stage 5 authoring (needs file 2; overnight batched; QA sample before
cutover) → Stage 6 cutover (gated; includes the primary-flag flip above + progress mapping +
quiz re-point + courses/public_course_topics from the canonical matrix).
