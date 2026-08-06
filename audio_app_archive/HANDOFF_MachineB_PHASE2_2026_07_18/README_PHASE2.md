# AP&E GLOSSARY — MACHINE B, PHASE 2 (the remaining build-out)
**Created 2026-07-18 by the Machine A session · Prof. Booth's AP&E Studio project**

Machine A has **stopped processing terms**. You are now the sole processor for the entire remaining glossary build-out. This package is self-contained — you do **NOT** need database access.

**Do not start this until your Phase-1 package (`HANDOFF_MachineB_2026_07_18`, 3,609 terms) is finished and handed back.**

---

## SCOPE

**7,820 terms · 62,431 fields · 909 packets · 98 topics.** These are exclusively yours — they do not overlap your Phase-1 batch or anything already completed.

Largest topics: Session Setup & Signal Flow (71 packets) · Console Architecture & Signal Flow (57) · Road Crew (42) · Passive Components (29) · Stereo & Ensemble Miking (28) · Acoustic Principles & Room Behavior (25) · Instrument & Close Miking (22) · System Deployment & Rigging (22) · Session Workflow/Takes/Documentation (21) · Dante Fundamentals & Routing (20) · Room Treatment Layout (19) · Theatrical Sound (19).

**Deadline: 15 August launch with ZERO placeholders.**

---

## WHAT'S HERE

```
HANDOFF_PROMPT.md         <- the prompt to start the session with
README_PHASE2.md          <- this file
MANIFEST.json             <- 909 packets: topic, term count, field count
ASSIGNED_TERM_IDS.txt     <- the 7,820 term IDs that are yours
briefs/
  AUTHORING_BRIEF.md      <- STEP 1 authoring standard
  BRIEF_COMMON.md         <- STEP 2 committee shared brief (RAISED BAR v2 + both new rules)
  BRIEF_AUDIO.md          <- committee: audio technical
  BRIEF_COGNITION.md      <- committee: learning / cognition
  BRIEF_LANGUAGE.md       <- committee: language / communications
  EDITOR_BRIEF.md         <- STEP 3 applying committee corrections
  REWRITE_BRIEF.md        <- STEP 4 plain_english readability rewrites
tools/
  check_readability.py    <- THE GATE. Run before handing anything back.
packets/  a0001.json … a0909.json   <- ~9 terms each, with current values + empty_fields
authored_OUTPUT/    committee_OUTPUT/    corrected_OUTPUT/
```

Each term carries: `id` (never change), `term`, `topic`, `difficulty`, current values of all 8 content fields, and **`empty_fields`** — exactly what to author.

> A `definition` of `"(pending)"` **or** `"(definition pending)"` is a PLACEHOLDER = empty. Both mean the same thing. Author it.

---

## THE FOUR-STEP PIPELINE (every term, no exceptions)

### STEP 1 — Author
One expert-researcher agent per packet. It reads `briefs/AUTHORING_BRIEF.md` + its packet, authors only the fields in each term's `empty_fields`, and writes `authored_OUTPUT/<same-name>.json`.

### STEP 2 — Committee (mandatory)
Build review packets (~35 terms) from your authored output and run **three independent experts over every term**: audio technical, learning/cognition, language/communications. All three read `BRIEF_COMMON.md` first. Write to `committee_OUTPUT/`.

A healthy result is ~90% of terms coming back OK. A flood of Low-severity style flags means the raised-bar rules aren't being followed.

### STEP 3 — Corrections
Editor agents apply every committee suggestion (`briefs/EDITOR_BRIEF.md`), web-verifying each technical fix. Reconcile when two experts flag the same field. If a suggestion is itself wrong, keep the original and say why in `notes`. Write to `corrected_OUTPUT/`.

### STEP 4 — Readability gate (do not skip)
```
python3 tools/check_readability.py corrected_OUTPUT
```
Exit 0 = pass. Any failures are listed with the text and the reason — rewrite them using `briefs/REWRITE_BRIEF.md` and re-run until it passes.

---

## THE FOUR RULES THAT OVERRIDE EVERYTHING

1. **Never author without the committee.** Every term gets all three experts. Standing rule from Prof. Booth.
2. **No placeholders, ever.** `(pending)` / `(definition pending)` = not written. The product cannot launch with them.
3. **Source quality.** Wikipedia, Reddit, forums, Quora/StackExchange, blogs, SEO pages, AI-generated text and vendor marketing **do not count** toward the required sources — pointers only, never corroboration, never cited. Every required source must be a standards body (AES, NEC/NFPA 70 & 70E, OSHA 1910/1926, ANSI/ESTA E1, IPC, IEC, IEEE, SMPTE/EBU, ITU, MIDI Association), manufacturer technical documentation, or a recognised professional text (Ballou, McCarthy, Yamaha SR Handbook, Rane notes, AES papers, Sound on Sound). ≥2 per fact, ≥3 for safety-critical. **Cannot confirm it? Leave the field blank and flag it.**
4. **`plain_english` at grade ≤ 9** — a standard 14-year-old must understand it. Sentences ≤ 20 words. Technical precision lives in `definition`; plain_english simplifies the LANGUAGE, never the facts.

**On rule 4 — learn from our mistake:** the failure mode is almost never vocabulary, it's ONE GIANT RUN-ON SENTENCE. Fix by splitting into 2–4 short sentences; the words are usually already simple. And critically: **the committee does not catch these reliably by eye.** On the last 382-term batch it flagged 129 and the gate script found **100 more**. Run the script. Always.

Some entries score high purely from unavoidable long words (the headword itself, brand names like *Thunderbolt*, or *insulation*/*environment*). Simplify what's avoidable, accept the rest — do not distort meaning to chase a number.

---

## SAFETY CONTENT

Much of this batch is electrical, rigging and power work (Road Crew, System Deployment & Rigging, Passive Components, Session Setup). For anything touching mains voltage, grounding/bonding, soldering irons/fumes/lead, batteries, rigging, ladders, fall protection or hearing exposure: state established standards-based practice only. Never present an unsafe shortcut or folklore as correct. Dangerous common practices belong in `common_mistakes` prefixed **"UNSAFE:"**. Three sources minimum.

---

## WHAT TO SEND BACK

1. **`corrected_OUTPUT/`** — the final payload (this is what gets applied)
2. **`authored_OUTPUT/`** and **`committee_OUTPUT/`** — the audit trail
3. **`COMPLETION_NOTES.md`** — packets completed, total terms, anything left blank/flagged and why, suggestions you declined and why, anything Prof. Booth must rule on

**Merge safety — non-negotiable:** never alter `id` or `term` (the merge matches on `id` and will reject mismatches). Keep list fields (`related_terms`, `common_mistakes`, `scenario_contexts`) as JSON **arrays**, never strings. No source citations inside field content — sources go in the `sources` array.

---

## PRACTICAL NOTES

- **Checkpoint constantly.** Write every packet's output to disk as you go. Usage caps interrupt long runs; with files on disk nothing is ever lost. After each wave, verify what actually landed — agents sometimes report success without writing.
- **Pace:** ~8–10 concurrent agents is a workable wave. 909 packets is a large program — expect multiple sessions.
- **If a term's scope or sense is ambiguous, flag it — don't guess.** The term list is fixed and approved; do not add, remove or re-scope terms.

---

## STATUS AT HANDOFF (2026-07-18)

- Glossary: **14,249 terms** across 245 topics.
- Backlog: **11,429 terms** need work — 3,609 in your Phase-1 package, **7,820 here**.
- Completed and live: MUSI 190 + AUDI 201 launch corpus (1,843 terms, fully authored, committee-reviewed, readability-corrected) plus 382 terms finished by Machine A on 2026-07-18.
- Machine A remains the database writer. It applies your returned JSON with backup, checksum verification and a changelog. You never write to the database.
