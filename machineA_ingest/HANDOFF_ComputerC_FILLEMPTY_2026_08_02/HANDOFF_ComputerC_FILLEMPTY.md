# HANDOFF — Computer C · FILL-EMPTY wave (2026-08-02)

**You are Computer C.** This is a **fill-empty** job, **not** new authoring. There are **657 existing glossary rows** that already have a good `definition` but are missing some or all of the other **7 content fields**. Author only the missing fields for each term, preserving everything already there. Machine A is the sole DB writer and will apply your work as **UPDATEs** (keyed by `id`).

`source_batch` for this wave: `FILLEMPTY_2026_08_02`.

---

## 1. Your input

Machine A will drop **`ComputerC_FILLEMPTY_terms.csv`** in this folder (generated from `EXPORT_657_stubs.sql`). Columns:

| column | meaning |
|---|---|
| `id` | glossary UUID — **frozen**, return it unchanged (this is how Machine A UPDATEs the row) |
| `term` | the term — **frozen** |
| `primary_topic` | the term's topic — author *in this topic's context* |
| `difficulty` | existing difficulty (may be blank) — **DB-writer owned; do not change** |
| `empty_fields` | `;`-separated list of exactly which fields to author for this row |
| `existing_definition` | the definition already in the DB — **frozen anchor; do not rewrite it** |

**Author only the fields named in `empty_fields`.** 655 of the 657 rows have all 7 empty; 2 are partial — for those, fill *only* the listed fields and leave the rest alone.

---

## 2. The 8-field contract (author the empties only)

`definition` *(already present — do not touch)* · **`plain_english`** · **`purpose_function`** · **`practical_application`** · **`category`** *(text)* · **`related_terms[]`** · **`common_mistakes[]`** · **`scenario_contexts[]`**. List fields are JSON arrays. If a term is equation-bearing you may also supply `formula_symbolic` + `formula_words`.

Everything you author must be **consistent with the existing `definition`** — it is the source of truth for what the term means. Do not contradict or redefine it.

---

## 3. Workflow — standard established formula

1. **Pass 1 — Graduate-Student Author:** draft the missing fields for every term, batched by `primary_topic`.
2. **Pass 2 — 4-member committee + corrections + readability gate:** independent review by **Audio Technical**, **Learning/Cognition**, **Language/Communications**, and **Legal Researcher** experts → aggregate → editor corrections (changed fields only, web-verified) → **Flesch-Kincaid gate** (`plain_english` grade ≤ 9 / ≤ 20-word sentences). Work in topic-coherent batches (~200 terms, ~35-term review groups). Keep the bias-to-OK discipline; log OK-rate.
3. **Hand back to Machine A:** the four review files, the **corrected merge payload** (never the authored-only draft), a difficulty-recommendation report (advisory only), a legal-citations report, and completion notes.

---

## 4. Rules

- **No verbatim copying.** Author every field originally; where a term derives from a standard/paper, **cite the controlling standard** in your sources — never paste or closely paraphrase.
- **`plain_english` at a 14-year-old level** (Flesch-Kincaid grade ≤ 9). No placeholders, no "TBD", no boilerplate.
- **`category`** = a short classifying label consistent with the term's `primary_topic` (e.g. the sub-area the term belongs to). One value, text.
- **Source priority:** professional orgs / standards bodies → academia/research → reputable sites → forums → Wikipedia.
- **Safety:** prefix the specific mistake with `UNSAFE:` for any hazard-bearing term (electrical, rigging, hearing, pyro, working-at-height, etc.). Flag any un-sourceable or uncertain term for Booth — do not guess.
- **Do not** change `id`, `term`, `definition`, or `difficulty`. Do not merge citations into field text.

---

## 5. Deliverable → Machine A (UPDATE, not INSERT)

Return the **corrected merge payload** keyed by `id`, carrying only the fields you authored (plus `id`/`term` for reference). Machine A applies them as `UPDATE glossary SET <authored fields> WHERE id=...` and mirrors nothing to `glossary_topics` except difficulty (which you are not setting). Do **not** write to the database. Keep `source_batch = FILLEMPTY_2026_08_02` in payload metadata.

---

## 6. Scope — 657 rows by topic (author in-topic)

| primary_topic | rows |
|---|--:|
| Sound for Picture — Post Workflow & Deliverables | 124 |
| Foley Performance & Recording | 43 |
| Session Workflow, Takes & Documentation | 36 |
| Podcast Production | 31 |
| Orchestral, Choir & Acoustic-Ensemble Mixing | 26 |
| Music Entrepreneurship | 23 |
| Themed Entertainment / Haunt Audio | 23 |
| Creative & Advanced Mix Processing | 23 |
| Beatmatching, Mixing & FX | 21 |
| Film Scoring | 21 |
| Show Control, Cueing & Communications | 16 |
| DAW: Studio One | 16 |
| AI Source Separation & Restoration | 13 |
| Live Sound — Monitor Engineering | 12 |
| Audio Restoration & Archival | 12 |
| DAW: REAPER | 12 |
| Session Setup & Signal Flow | 11 |
| Live Sound — Soundcheck / Rehearsal / Virtual Soundcheck | 11 |
| Loudspeaker / Transducer Engineering | 10 |
| Console Architecture & Signal Flow | 9 |
| DAW Fundamentals & Session Management | 8 |
| Analog Tape / Tape Machines | 8 |
| System Deployment & Rigging | 8 |
| Mastering Fundamentals & Chain | 8 |
| Theatrical Sound (commercial card) | 8 |
| Road Crew | 8 |
| DAW: Logic | 7 |
| Racks, Patchbays & Wiring Infrastructure | 7 |
| Rigging Hardware, Loads & Motorized Flying | 6 |
| DAW: Ableton Live | 6 |
| System & Live Troubleshooting Method | 6 |
| AI/ML Foundations for Audio | 6 |
| DAW: Cubase/Nuendo | 5 |
| Repair | 5 |
| SFX Editorial & Sound Design | 5 |
| _…tail (Re-Recording & Final Mix 4, Project Mgmt 4, Concert-Audio Slang 4, and ~35 more topics at 1–3 each)_ | ~72 |
| **Total** | **657** |

The CSV is the authoritative list; this table is for batching/planning.
