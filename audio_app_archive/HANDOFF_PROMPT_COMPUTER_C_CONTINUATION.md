# ⇩ PASTE INTO COMPUTER C — CONTINUATION JOB (Phase-2 backlog tail) ⇩

You are **Computer C**. You already finished the 1,312 new-term batch. **This is a new, separate assignment:** the **tail end of Computer B's Phase-2 backlog**. Computer B authored the first portion and is now offline (usage cap) until Wednesday; **it cannot be reached and does not know about you.** To guarantee you never redo B's work, this package contains **only the last 3,005 terms of B's list — packets `a0565` through `a0909`** — which are deep in the portion B had **not** started. Do not request or touch any packet numbered below `a0565`.

**Scope: 3,005 terms · 345 packets (`a0565.json`…`a0909.json`).**

## These terms ALREADY EXIST in the database
Unlike your last batch (brand-new rows), these are **existing glossary rows** that currently have empty/placeholder fields. You are **filling them in**. Each term carries `id`, `term`, `topic`, `difficulty`, current (mostly empty) field values, and an **`empty_fields`** list. **Author only the fields named in `empty_fields`.** Never change `id` or `term`. Machine A will apply your output as **keyed UPDATEs** (not inserts), matched on `id`.

## The pipeline — every term, no exceptions
1. **Author** the fields in `empty_fields` — `briefs/AUTHORING_BRIEF.md`. Write `authored_OUTPUT/<same-name>.json`.
2. **Committee (mandatory)** — all three experts (audio-technical / learning-cognition / language) over every term: `briefs/BRIEF_COMMON.md` first, then `BRIEF_AUDIO.md` + `BRIEF_COGNITION.md` + `BRIEF_LANGUAGE.md`. Write `committee_OUTPUT/`.
3. **Corrections** — apply every committee fix, web-verifying each — `briefs/EDITOR_BRIEF.md`. Write `corrected_OUTPUT/`.
4. **Readability gate (do not skip)** — `python3 tools/check_readability.py corrected_OUTPUT`, then `briefs/REWRITE_BRIEF.md` until it passes.

## Four rules that override everything
1. **Never author without the full 3-expert committee.** Standing rule from Prof. Booth.
2. **No placeholders, ever.** `(pending)` / `(definition pending)` = not written. Cannot verify a fact from a qualifying source? **Leave that field blank and FLAG it** — do not guess.
3. **`plain_english` ≤ grade 9** — a 14-year-old must understand it; sentences ≤ 20 words. The failure mode is the ONE GIANT RUN-ON SENTENCE — split into 2–4 short ones. **The committee does not catch these by eye — you MUST run the gate script** and fix every failure.
4. **Strict sourcing.** Wikipedia, Reddit, forums, blogs, SEO/AI text, and vendor *marketing* do NOT count — pointers only, never cited. Every required source is a standards body (AES, IEC, ITU-R, SMPTE/EBU, IEEE, ANSI, NIST, FCC, OSHA, NEC/NFPA), a manufacturer's **technical** doc, or a recognised professional text (Ballou, McCarthy, Yamaha SR Handbook, Rane, AES papers, Sound on Sound). **≥2 per fact, ≥3 for safety/electrical/rigging.** Sources go in a `sources` array, never inside field text.

## Safety
Much of the backlog is electrical, rigging, power, soldering, and hearing-exposure content. State established standards-based practice only; put dangerous common practices in `common_mistakes` prefixed **"UNSAFE:"**; ≥3 sources. If unsure and it touches safety, **flag it — do not guess.**

## Merge safety & the DB
Keep list fields (`related_terms`, `common_mistakes`, `scenario_contexts`) as JSON **arrays**. Never alter `id`/`term`. **You never write to the database — Machine A is the sole writer** and applies your `corrected_OUTPUT/` as backed-up, checksum-verified UPDATEs. Report anything you leave blank/flagged in `COMPLETION_NOTES.md` (Machine A adds those to Prof. Booth's master flagged-terms register).

## Deadline
15 August, zero placeholders. Checkpoint every packet to disk as you go; after each wave verify what actually landed (agents sometimes report success without writing). ~8–10 concurrent agents per wave.

**Start with `packets/a0565.json` and work forward to `a0909.json`.** Hand back `authored_OUTPUT/`, `committee_OUTPUT/`, `corrected_OUTPUT/`, and `COMPLETION_NOTES.md`.

---
⇧ END OF PROMPT ⇧
