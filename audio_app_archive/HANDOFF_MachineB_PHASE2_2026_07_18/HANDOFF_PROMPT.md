# ⇩ PASTE THIS INTO MACHINE B TO START PHASE 2 ⇩

---

Your Phase-1 package (3,609 terms, mb0001–mb0431) has been received and independently verified by Machine A. It passed cleanly: **3,609/3,609 terms, no missing or extra IDs, no altered `id`/`term`, no type errors, nothing written outside `empty_fields`, zero placeholder text, zero non-qualifying sources.** Plain-English averaged Flesch-Kincaid grade 5.8, with only 29 entries above grade 9 (those were remediated on our side). That is excellent work — keep exactly that standard.

Two notes on Phase 1, for your awareness only — no action needed:
- The 28 terms you flagged rather than guessed were the right call. The 17 you left entirely blank (Basic Folder, Catch the solo, Miss the solo, Navigation Memory, Polar window, rubbery, RipX DeepMix, Accent supervision, Age matching, Audio behavior, Emotional performance, Finger tap, Found Prop and a few others) are with Prof. Booth for a ruling. Do not revisit them.
- Machine A remains the sole database writer. You never write to any database.

---

**You are now the sole processor for the entire remaining glossary build-out. This is Phase 2.**

Read `README_PHASE2.md` in this folder and follow it exactly. Start with packet `a0001.json`.

**Scope:** 7,820 terms · 62,431 fields · 909 packets · 98 topics. These are exclusively yours — no overlap with Phase 1 or anything already completed. Biggest blocks: Session Setup & Signal Flow (71 packets), Console Architecture & Signal Flow (57), Road Crew (42), Passive Components (29), Stereo & Ensemble Miking (28).

**The pipeline for every single term — no exceptions:**
1. **Author** the fields listed in that term's `empty_fields` — `briefs/AUTHORING_BRIEF.md`
2. **Committee** — all three experts review every term — `briefs/BRIEF_COMMON.md` + `BRIEF_AUDIO.md` + `BRIEF_COGNITION.md` + `BRIEF_LANGUAGE.md`
3. **Corrections** — apply the committee's suggestions — `briefs/EDITOR_BRIEF.md`
4. **Readability gate** — run `python3 tools/check_readability.py corrected_OUTPUT` and fix every failure before handing back

**Four rules that override everything else:**
- **Never author without the committee.** Every term gets all three experts. Standing rule from Prof. Booth.
- **No placeholders, ever.** A `definition` of `(pending)` or `(definition pending)` means NOT WRITTEN — author it. The product cannot launch with placeholder text.
- **Strict sourcing.** Wikipedia, Reddit, forums, Quora, blogs, hobbyist sites, SEO/AI-generated content and vendor marketing do **not** count toward the required sources — pointers only, never corroboration, never cited. Every source must be a standards body, manufacturer technical documentation, or a recognised professional text. ≥2 per fact, ≥3 for safety-critical. Cannot confirm it? Leave the field blank and flag it.
- **`plain_english` at grade ≤ 9** — a standard 14-year-old must understand it, sentences ≤ 20 words. Run the gate script; do not rely on the committee to catch these by eye. On our own batch the committee flagged 129 and the script found 100 more.

**Merge safety:** never alter a term's `id` or `term` — the merge matches on `id`. Keep list fields (`related_terms`, `common_mistakes`, `scenario_contexts`) as JSON arrays, never strings. No citations inside field text; sources go in the `sources` array.

**Deadline: 15 August launch, zero placeholders.** Work in checkpointed batches — write every packet's output to disk as you go so a usage cap never costs you work, and verify what actually landed on disk before moving on (agents sometimes report success without writing).

When you finish, or when you pause, hand back `authored_OUTPUT/`, `committee_OUTPUT/`, `corrected_OUTPUT/`, and a `COMPLETION_NOTES.md` listing packets completed, terms left blank/flagged and why, suggestions you declined and why, and anything Prof. Booth must rule on.

---

⇧ END OF PROMPT ⇧
