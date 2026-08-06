# ⇩ PASTE THIS INTO MACHINE B TO AUTHOR THE ADDITIONAL (MISSING-SHORTHAND) TERMS ⇩

---

**This is a NEW, standalone batch: 150 terms · 1,200 fields · 16 packets.** They are common-shorthand / alias terms an audit found missing from the glossary (e.g. *Outcue*, *Deadwax*, *Clockwheel*, *Headstage*, *Spinorama*). Prof. Booth approved this exact list. Do **not** add, drop, or re-scope terms.

These terms do **not exist in the database yet.** You AUTHOR them from scratch — every field in each term's `empty_fields` (all 8). Machine A will INSERT your returned output into production (with backup + checksum). **You never write to any database.** Never change a term's `id` (Machine A inserts on that id) or its `term`.

Read `README.md`, then run our standard four-step pipeline on every term:

1. **Author** — `briefs/AUTHORING_BRIEF.md`. Author all 8 fields. Keep `id`, `term`, `topic`, `topic_id`, `difficulty`, and any `cross_list_topics` exactly as given. Honor each term's `authoring_note` if present (canonical headword / scope guidance).
2. **Committee (mandatory)** — all three experts over every term: `BRIEF_COMMON.md` + `BRIEF_AUDIO.md` + `BRIEF_COGNITION.md` + `BRIEF_LANGUAGE.md`.
3. **Corrections** — `briefs/EDITOR_BRIEF.md`, web-verifying each technical fix.
4. **Readability gate (do not skip)** — `python3 tools/check_readability.py corrected_OUTPUT`, then `briefs/REWRITE_BRIEF.md` until it passes.

**The four rules that override everything:**
- **Never author without the committee.** Every term, all three experts. Standing rule from Prof. Booth.
- **No placeholders, ever.** `(definition pending)` / `(pending)` = not written. Author it. Cannot confirm a fact from a qualifying source? Leave that field blank and flag it.
- **Source quality.** Wikipedia, Reddit, forums, Quora, blogs, SEO/AI text and vendor *marketing* do NOT count — pointers only, never cited. Every source must be a standards body (FCC Part 73/11 & EAS rules, AES, ITU-R BS.1770/EBU R128, IEC, IEEE, SMPTE), manufacturer *technical* documentation, or a recognised professional text. ≥2 per fact, ≥3 for safety/regulatory.
- **`plain_english` ≤ grade 9** — a 14-year-old must understand it, sentences ≤ 20 words. Run the gate; do not trust the committee's eye.

**Domain notes for this batch:**
- **Broadcast/FCC terms** (EAS Header, Required Weekly/Monthly Test, Percent Modulation, RPU, RDS/RBDS) are regulatory — cite FCC rules (47 CFR Part 73/11) and manufacturer docs, not hobby sites.
- **Audiophile "tweak" terms are NOT in this batch on purpose.** If a term's accepted engineering basis is thin (it won't be, for these), state the mainstream measurement view; never present marketing claims as fact.
- **Listening descriptors** (Euphonic, PRaT, Microdetail…) are subjective vocabulary — define them as *perceptual descriptors* with the technical correlate where one exists; don't overstate.

**Deadline: 15 August, zero placeholders.** Checkpoint every packet to disk as you go. When done or paused, hand back `authored_OUTPUT/`, `committee_OUTPUT/`, `corrected_OUTPUT/`, and `COMPLETION_NOTES.md` (packets done, anything left blank/flagged and why, anything Booth must rule on).

---
⇧ END OF PROMPT ⇧
