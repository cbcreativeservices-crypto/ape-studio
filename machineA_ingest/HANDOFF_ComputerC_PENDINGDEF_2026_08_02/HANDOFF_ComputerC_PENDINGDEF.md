# HANDOFF — Computer C · PENDING-DEFINITION wave (2026-08-02)

**You are Computer C.** This is a **definition-only** job. There are **1,530 existing glossary rows**
whose 7 supporting fields are already authored, but whose `definition` is still the placeholder
`(pending)`. Write a real `definition` for each — nothing else. Machine A applies your work as
**UPDATE** keyed by `id`.

`source_batch = PENDINGDEF_2026_08_02`. Run everything through the toolkit
(`computerC_pipeline_toolkit.zip`): `build_packets.py` → author → `verify.py`/`fk_gate.py` →
`build_review.py` → committee → `aggregate_suggestions.py` → `build_delivery.py PENDINGDEF_2026_08_02`.

## 1. Input CSV
Machine A produces **`ComputerC_PENDINGDEF_terms.csv`** by running `EXPORT_pendingdef_1530.sql` in
Supabase and downloading. Columns:

| column | meaning |
|---|---|
| `id` | glossary UUID — **frozen**; how Machine A UPDATEs the row (build_packets carries it through → UPDATE mode) |
| `term` | headword — **frozen** |
| `primary_topic` | the term's topic — author in this context; used for packet grouping |
| `source_batch` | `PENDINGDEF_2026_08_02` |
| `authored_fields` | `definition` — the **only** field you write |
| `difficulty` | existing difficulty — **DB-owned; do not change** |
| `existing_plain_english` / `existing_purpose_function` / `existing_practical_application` / `existing_category` / `existing_related_terms` / `existing_common_mistakes` / `existing_scenario_contexts` | the term's already-authored fields — your **anchor**: the definition must be fully consistent with them |
| `concept_hint` | = the existing plain_english (packet pointer) |

## 2. What to write
- **Only `definition`.** One tight, technical paragraph, fully consistent with the term's existing 7
  fields (do not contradict them, and do not rewrite them).
- Author **independently and sourced** — do **not** copy or paraphrase the `existing_*` fields or any
  external source; they are context/anchor, not text to reword. `definition` is a fresh, precise
  technical statement in our own words.
- Leave `plain_english`, `purpose_function`, `practical_application`, `category`, `related_terms`,
  `common_mistakes`, `scenario_contexts`, and `difficulty` **untouched** (Machine A will not write them).
- `(pending)` is **not** a real definition — treat every one as missing and replace it.

## 3. Rules (from AUTHORING_GUIDE_shared.md)
- **≥2 authoritative sources per fact (≥3 if safety-critical).** Standards bodies / manufacturer
  technical docs / recognized professional texts only — Wikipedia/forums/marketing are pointers, never
  cited or counted.
- **No verbatim copying**; write the definition in our own words; where it derives from a standard,
  name the controlling standard as plain fact (no parenthetical citations in the text).
- **plain_english is not being authored this wave**, so the FK gate applies only if you touch it (you
  shouldn't). Keep definitions technically complete.
- **Flag, don't guess.** If a term genuinely cannot be sourced, set `confidence:"FLAG-FOR-REVIEW"`,
  leave `definition` empty, put the reason in `flags`. Expect few flags — most are established
  electronics/hardware/session terms.
- **Safety:** these topics include electronics, power, rigging, repair — keep any hazard framing
  accurate; do not invent ratings, clearances, or voltages.

## 4. Scope by topic (heaviest first; 1,530 total)
Session Workflow/Takes/Documentation 156 · Theatrical Sound 155 · Electromechanical Parts & Hardware
115 · Passive Components 107 · Loudspeaker/Transducer Engineering 107 · Active Devices & Semiconductors
94 · Circuits & Topologies 77 · Worship Sound 67 · AI Source Separation & Restoration 40 · Repair 40 ·
Podcast Production 39 · Preamp & Converter Engineering 38 · Concert-Audio Slang 35 · Synthesis
Types/Modular/CV 35 · Analog Tape 31 · DAW: Logic/Ableton/Cubase/REAPER (~112) · then a long tail. The
CSV is authoritative.

## 5. Deliverable → Machine A (UPDATE)
`build_delivery.py PENDINGDEF_2026_08_02` → the corrected merge payload keyed by `id`, carrying only
the authored `definition` (+ `id`/`term` for reference), plus the four review files, difficulty report
(advisory), legal-citations report, and completion notes. Do **not** write to the database.

_Note for Machine A: the `(pending)` emptiness bug should be fixed upstream so the export empty-check
treats `(pending)` as empty going forward._
