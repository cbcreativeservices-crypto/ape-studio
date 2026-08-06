# Duplicate-Topic Consolidation Plan (CANDIDATE)
_2026-08-01 · Machine A · 28 topic pairs · pending Booth approval_

## What & why
28 topics exist as two `achievements` rows — a **draft** categorization row (`course_id` NULL) and an **active**, course-linked row. Their glossary terms are split between the two, which double-counts topics and would corrupt certificate rollups.

## Rule applied
Keep the **active (course-linked)** row as canonical (it is part of the live curriculum). Migrate the draft duplicate's glossary links and the denormalized `glossary.achievement_id` onto the active row, promoting the primary link where needed, then set the draft row `is_active=false` (retired). No `achievements` row is deleted yet — deletion waits on the FK pre-flight.

## Files
- `APE_TOPIC_CONSOLIDATION_APPLY_2026_08_01.sql` — the merge, one transaction + VERIFY (expect 0/0).
- `APE_TOPIC_CONSOLIDATION_PREFLIGHT_2026_08_01.sql` — run first to list what else references these rows before any hard delete.

## The 28 pairs (canonical ← merged)
| Topic | Keep (active) | Merge+retire (draft) | Terms after |
|---|---|---|--:|
| Amplifiers | `d3228341` (36) | `eb10acd3` (111) | 147 |
| Analog Live Sound | `518a11dc` (66) | `fa3fa679` (13) | 79 |
| Assisted Listening Systems | `762d01b3` (51) | `75ed360a` (5) | 56 |
| Audio Career Exploration | `30d1f510` (134) | `f482144c` (0) | 134 |
| Audio System Design | `38f5d4d9` (53) | `7294afe5` (52) | 105 |
| Copyright, Publishing & Licensing | `ca29aaa4` (56) | `cd81ec36` (0) | 56 |
| Corporate AV | `cdb5ba27` (45) | `7d098dac` (0) | 45 |
| Digital Live Sound | `aaf2939d` (10) | `8db281ce` (64) | 74 |
| Distributed Audio Systems | `b692402f` (9) | `873348dd` (0) | 9 |
| Documentation & Diagrams | `2e0ad475` (8) | `ff5f3513` (61) | 69 |
| Dynamics Processing | `fd3b3424` (58) | `d42dcf1d` (234) | 292 |
| Ear Training | `6b5b715c` (8) | `eba54a3f` (0) | 8 |
| Equalization (EQ) | `f88ae2dc` (68) | `07df90cd` (76) | 144 |
| Grounding & Electrical | `d392b133` (73) | `041c8d66` (3) | 76 |
| Industry Foundations | `5d104354` (46) | `681cb58c` (23) | 69 |
| MIDI | `e9807c40` (58) | `575d5f16` (73) | 131 |
| Music Entrepreneurship | `14eb6897` (82) | `ecf9ca06` (68) | 150 |
| Plugins & Virtual Instruments | `af40f73e` (300) | `13e902c2` (0) | 300 |
| Portfolio Development | `2e29b1bc` (44) | `130626bc` (0) | 44 |
| Professional Audio Safety | `eebac0e9` (96) | `e5451add` (24) | 120 |
| Project Management | `ca3d3ca8` (90) | `7106239e` (45) | 135 |
| RF Wireless Systems | `53fae3ee` (53) | `173a5d7e` (104) | 157 |
| Signal Path & Levels | `0377f51c` (96) | `544770a6` (0) | 96 |
| Sound & Acoustics | `595c0857` (203) | `cf8ef23a` (24) | 227 |
| System Maintenance | `3822d771` (45) | `e2979cc0` (0) | 45 |
| Vacuum Tubes | `e7fe45bf` (85) | `3283d1e2` (0) | 85 |
| Vehicle Audio | `27e990bb` (78) | `f7a42023` (0) | 78 |
| Workplace Skills | `036e7ed0` (51) | `89bd470d` (0) | 51 |

## Note
Two pairs are near-even splits (Audio System Design 53/52, Equalization 68/76, Dynamics 58/234, RF 53/104, MIDI 58/73, Digital Live 10/64) — the active row is still kept as canonical for course alignment, but flag if you'd rather keep the draft as home for any of these.
After consolidation the 28 duplicates collapse to 28 single topics; re-run the distribution dashboard to refresh counts.