# STAGE 4B — COMPLETE ✅ (2026-07-18, Claude Code local session)

Cross-list (secondary, is_primary=false) `glossary_topics` links inserted from the canonical
`CROSSLIST_ASSIGNMENT_v2_FINAL_2026_07_18.csv` (from `ccode_inputs.zip`). Additive only; v1 untouched.

## Numbers
- Input: **6,676 CSV rows** → 6,627 distinct terms → **8,413 unique (term → v2 topic) links** after
  name→gs resolution and dedupe.
- **Inserted: 7,979 links** (7,973 exact-match + 6 recovered via case-insensitive term match).
- Not inserted, by design:
  - **351** — cross-list target = the term's existing primary topic (already linked; no-op).
  - **83 links / 75 terms** — the term does not exist in glossary at all (present in the crosslist
    CSV but absent from the final TERM_ASSIGNMENT insert — mostly Brand-rule removals like
    Rekordbox/Serato/Traktor/Countryman/Lake and AI-term variants). Full list:
    `STAGE4B_SKIPPED_TERMS_2026_07_18.csv`. Idempotent to re-run if Booth reinstates any.
  - **61 pairs** — target name **"Music Theory"** has no v2 topic (mostly DJ phrase/key terms).
    Flagged: create a topic or re-target if wanted.

## Name → gs resolution (audit table kept in DB: `stage4b_namemap_20260718`, 70 names)
Exact/ROUTING_RULES defaults used throughout (Mixing→1080, Recording Arts→1010, Live Sound→1930,
Synthesis→1380, Mastering→1160, Film & Game Audio→1230, Critical Listening→1510, Microphones→210,
Audio Electronics→880, Smaart / Measurement→550, Monitoring / Loudspeaker→1820, DJ Sound→690, etc.).
Judgment mappings (flag for Booth spot-check): **Digital Audio→1810** (converter-stage terms),
**Music Production→1680** (immersive-music-mix terms), **Loudness / Metering→1220** (broadcast
context), **Audiology→1410** (family default), Equalization & "Equalization (EQ)"→460,
Mixers & "Mixers"→290, HiFi / Consumer & Consumer Audio Systems→940, Radio Production & Live
Broadcast→1200, Cloud / Emerging→1840, Manufacturing / QC→930.

## Integrity (verified on live DB after insert)
- Staging table `stage4b_links_20260718` checksum-verified **byte-identical** to the locally
  resolved link list (8,413 rows, order-independent md5 hashsum match) before insert.
- v2 links now **23,202** (was 15,223). v1 links 4,682 (unchanged). glossary 14,249 (unchanged).
- 0 orphan links · 0 multi-primary terms · every term still has exactly 1 primary link.
- Empty v2 topics 14 → **9** (cross-lists populated 860 Architectural Audio, 1410 Hearing Anatomy,
  1420 Hearing Protection, 1490 Voice & Vocal Perception, 1680 Immersive Music Production).
  Remaining 9 empty are the expected set (140 Batteries, 870 Audio Technician, 920 Bench Test,
  1430/1450/1460/1470/1480 audiology-stream, 1950 Load-In/Strike).

## Stage 3 note (routing-rules reconciliation)
Stage 3 ran BEFORE `ROUTING_RULES_2026_07_17.md` resurfaced (in the zip); routing was rebuilt
independently. Post-hoc comparison: defaults and families match the original rules almost entirely.
Known divergences (all additive, term-level UPDATEs safe if Booth wants them changed):
- v1 gs27 Ear Training: some artifact-ID terms routed to 1540 (rules said all→1500).
- v1 gs3: file-format terms (WAV/MP3/CD…) routed to 340; Dante→420; Word Clock→440 (rules kept
  everything in 160/170/180).
- v1 gs18 Consumer Audio split per-term 940/950 (rules mapped label→940 only).
- Troubleshooting default 580 vs rules' 590 (per-term routing, few affected).

## Rollback (Stage 4b only)
```sql
DELETE FROM glossary_topics gt USING stage4b_links_20260718 s, glossary g, achievements a
WHERE g.term = s.term AND a.curriculum_version_id='51c1d5db-1d05-4d43-8853-5fa1503fb751'
  AND a.global_sequence = s.v2_gs AND gt.glossary_id = g.id AND gt.achievement_id = a.id
  AND gt.is_primary = false;
```
(Slight over-delete risk only for the 351 pre-existing overlaps — those are primary links and the
`is_primary=false` guard protects them.)

## Remaining pipeline
- **Stage 5** — author 10,584 `(pending)` definitions (overnight, batched; wording per
  `GLOSSARY_LEGAL_TRADEMARK_COPYRIGHT_GUIDANCE_2026_07_17.md`). QA sample before cutover.
- **Stage 6** — cutover (gated): courses/`public_course_topics` from the canonical matrix, student
  progress remap, quiz re-point, **primary-flag flip via `stage3_primary_intent_20260718`**
  (see STAGE3 report), activate v2.
- H1/H2/H3 studio terms (2,337) still to recover from Booth's pastes (Stage-4 repeat).
