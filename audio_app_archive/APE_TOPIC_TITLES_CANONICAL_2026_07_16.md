# CANONICAL TOPIC TITLES + OVERHAUL RECORD
**Pro Audio Training Academy · 2026-07-16 · Prof. Booth rulings**
**STATUS: CANONICAL (design record).** Use these exact title strings in client + backend. They SUPERSEDE prior card/topic names. **No DB writes made by this note** — execution pending Booth greenlight.

## Context (topic overhaul, 2026-07-16)
- Moving OFF the fixed 50-topic / course-number model. Course numbers (MUSI/AUDI) do not appear in the commercial app.
- **Album % progression is PARKED** until glossary/terms/topics settle.
- Topic count **51 → 64** (4 splits + 9 new topics; 5 renames + amp fold — renames/folds don't add count).
- **Design principle:** single-topic courses are self-contained (many buyers take exactly one). A specialized topic carries some foundational/basic terms — some assumed, some **reused from another topic**. Glossary multi-topic model (one term → many topics) supports this natively; reuse terms, do not duplicate.

## Splits — FINAL (4)
- gs3 `Connectors & I/O Connections` (202 terms) → **Connectors & Cables** (~130) · **I/O Connections** (~72)
- gs7 `Mixers & Recorders` (112) → **Mixers** · **Recorders**
- gs23 `Audio Measurement & Optimization` (229) → **Audio Measurement** (~186) · **System Optimization** (~43)
- gs33 `Soldering & Repair` (194) → **Soldering** (76) · **Repair** (118) — exact per-term classification in `gs33_soldering_repair_split_2026_07_16.csv`

Term-count basis: gs3 & gs23 partitioned by glossary `category` (approx, ±few edge terms); gs33 classified term-by-term (exact). Category-based term reassignment to be applied at DB-execution time.

*(gs6 was originally slated to split into Amplifiers + Loudspeakers; REVERSED 2026-07-16 — see Amplifier ruling below. gs6 now becomes a single renamed topic. gs3 cable placement: cables grouped with Connectors per Booth ruling.)*

## Renames — FINAL (5, NOT yet applied to DB)
- gs6 `Amps & Loudspeakers` → **`Loudspeaker Fundamentals`** (loudspeaker/equipment basics)
- gs13 `Loudspeaker System Deployment` → **`Loudspeaker Deployment`** (setup, use, configuration)
- gs18 `Consumer Audio Systems` → **`HiFi Consumer Audio`** (absorbs the Hi-Fi card)
- gs20 `Commercial Audio Systems` → **`Commercial 70/100V Systems`**
- gs42 `Podcasting & Broadcast Audio` → **`Podcasting & Broadcast`**

## Amplifier ruling — FINAL
- **gs12 `Amplifiers` = the single canonical amplifier topic** (46 terms, amp-focused).
- The intro course's amplifier coverage **reuses/cross-lists gs12** (no second "Amplifiers" topic — avoids a name collision and a sub-floor term pool).
- **Execution action (at DB time):** the ~7–16 amplifier-related terms currently under gs6 fold into gs12 (7 are already shared). gs6 → Loudspeaker Fundamentals keeps the ~120 loudspeaker terms. Triage which foundational amp terms (e.g. Amplifier, Watt) also stay cross-listed in the intro context.

## New topics to create (9)
Architectural Audio · Audio Electronics · Audio Technician · Audiology · DJ Sound · Live Sound · Road Crew · Theatrical Sound · Worship Sound

*(Audiology added after the initial 15-card set — needs card art + a Course Select card. Proposed card_id `topic:audiology`.)*

## The 15 single-topic card titles — CANONICAL (Course Select)

| # | Canonical title | card_id | Status | Current DB topic |
|---|-----------------|---------|--------|------------------|
| 1 | Architectural Audio | topic:architectural | **NEW** | — |
| 2 | Assisted Listening Systems | topic:assist | existing | gs17 Assisted Listening Systems |
| 3 | Audio Electronics | topic:audio-elect | **NEW** | — |
| 4 | Audio Technician | topic:audio-tech | **NEW** | — |
| 4b | Audiology | topic:audiology *(proposed)* | **NEW** (no card art yet) | — |
| 5 | Commercial 70/100V Systems | topic:commercial | **RENAME** | gs20 Commercial Audio Systems |
| 6 | Corporate AV | topic:corporate | existing | gs19 Corporate AV |
| 7 | DJ Sound | topic:dj | **NEW** | — |
| 8 | Film & Game Audio | topic:film | existing | gs44 Film & Game Audio |
| 9 | HiFi Consumer Audio | topic:hifi | **RENAME (merge)** | gs18 Consumer Audio Systems |
| 10 | Live Sound | topic:live-sound | **NEW** | — |
| 11 | Podcasting & Broadcast | topic:podcast | **RENAME** | gs42 Podcasting & Broadcast Audio |
| 12 | Road Crew | topic:road-crew | **NEW** | — |
| 13 | Theatrical Sound | topic:theatrical | **NEW** | — |
| 14 | Vehicle Audio | topic:vehicle | existing | gs22 Vehicle Audio |
| 15 | Worship Sound | topic:worship | **NEW** | — |

## Overlap note
New topic **Live Sound** overlaps existing gs14 Analog Live Sound / gs15 Digital Live Sound — intentional per the reuse principle; share foundational terms, do not duplicate.

## Still OPEN (separate passes, not blocking title adoption)
- Music vs Audio **diploma-track** assignment for all 64 topics.
- `global_sequence` numbering for the 9 new topics + the 4 split halves.
- Term reassignment at execution: gs3/gs23 split partitions (category-based) + gs33 split (CSV).
- Amplifier term fold gs6→gs12 (execution).
- Audiology card art + card_id wiring (see ccode handoff §5).
- Glossary/term buildout per new topic.
- Album % denominator (parked).

---
*Author: AP&E Studio (governance chat). For Claude Code / ccode (client + backend): treat the titles above as source of truth for topic labels.*
