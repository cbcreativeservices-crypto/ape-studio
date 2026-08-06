# AP&E Glossary — Authoring + Committee Review Spec (2026-07-29)

Applies to **Computer B** and **Computer C**. Your term list is in your own `Computer<X>_terms.csv`
(columns: term, subject, landing_topic, status, source_batch). **Author only your file** — B and C cover
different subjects and must not research the same area. Return corrected output to **Machine A** (sole DB
writer); you never write to the database.

---

## WORKFLOW (strict order)

**PASS 1 — Graduate-Student Author.** A "graduate student" agent drafts all 8 fields for every term:
competent, well-read, writes clearly for a lay reader, sources as it goes. Produces a complete first
draft of every term.

**PASS 2 — Committee Review + Corrections + Readability Gate.** After you author a batch, run the
4-member committee below over it, apply corrections, then run the readability gate, before anything is
considered done.

**PASS 3 (later, after authoring is approved).** B and C switch to building **questions + scenarios** per
term. Not part of this handoff — wait for the go-ahead.

## THE 8 FIELDS (Pass 1 output, per term)
`definition` · `plain_english` (FK grade ≤ 9, sentences ≤ 20 words) · `purpose_function` ·
`practical_application` · `category`/topic (use the `landing_topic` from your CSV — do not re-topic) ·
`related_terms` [array] · `common_mistakes` [array] · `scenario_contexts` [array]. Also set `difficulty`;
equation terms fill `formula_symbolic` + `formula_words`. No placeholders / no "TBD" in any field.

## RESEARCH PRIORITY (where to look)
Look in this order — but see the committee's **Source-quality rule**: lower tiers are *pointers only* and
can never be cited or counted as corroboration.
1. Professional organizations & respected companies (AES, IEC, ISO, ANSI/ASA, ITU-R, SMPTE, IASA, NEDCC,
   LoC; manufacturer technical/service docs).
2. Academia & published research (journals, JASA, peer-reviewed papers, textbooks, university courseware).
3. Popular websites & social-media reference sources.  4. User forums.  5. Wikipedia.

Keep the `landing_topic` assignments; they define your batches (each is 80–200 terms).

---

# COMMITTEE REVIEW SPEC

You are running the **same 4-member committee review + corrections pipeline** used on the other machines.
This document defines the committee only — it assumes you already know how to author terms. After you
author a batch, run this committee pass over it, then apply corrections, then the readability gate, before
anything is considered done.

Work in **topic-coherent batches of ~250 terms**, cut at topic boundaries so a single topic is never split
across batches (this avoids re-finding the same research sources in two different waves). Within a batch,
build review packets of ~35 terms per group and run all reviewers per group.

---
## THE COMMITTEE — four independent expert reviewers, every term
Every authored term is reviewed **independently by all four experts** (Prof. Booth's standing rule: never
author without committee). Each expert reads the whole entry (definition, plain_english, purpose_function,
practical_application, category, related_terms, common_mistakes, scenario_contexts, plus difficulty and
topic) and critiques it **through their own lens only**.

1. **Audio Technical Expert** — senior audio systems engineer/technician. Lens: TECHNICAL ACCURACY.
   Factual/technical errors, wrong specs/units/standards/model names, outdated or unsafe practice,
   technically wrong related_terms or scenarios. For any Medium/High flag they MUST web-verify the correct
   fact first and state the verification (source) inside the issue. Safety-critical errors (mains, rigging,
   loads, hearing) = High.
2. **Learning / Cognition Expert** — learning scientist for technical/vocational education. Lens: DOES THIS
   TEACH WELL at the stated difficulty? Cognitive load, scaffolding, unstated prerequisites, analogy
   quality, whether common_mistakes target real misconceptions, whether the difficulty tag fits. (This
   expert also proposes a difficulty level for any term whose difficulty is missing/null.) Does not judge
   pure technical accuracy unless it creates a learning trap.
3. **Language / Communications Expert** — technical editor + plain-language communicator. Lens: CLARITY AND
   CORRECT WRITING. Grammar, syntax, wrong words, real ambiguity, run-ons, undefined jargon in
   plain_english, duplicate list items. Offers a concrete rewrite for anything flagged. Does NOT change
   technical meaning.
4. **Legal Researcher (NEW)** — IP attorney/researcher (copyright, trademark, patent). Lens: LEGAL RISK AND
   IP OWNERSHIP. Has **two distinct jobs** — see next section. Does not judge technical accuracy, pedagogy,
   or style.

---
## THE LEGAL EXPERT'S TWO ROLES
### Job 1 — Copyright / originality (feeds the corrections pass)
The glossary must be **our own original IP**. For every term, check each field's text for content that is
**copied verbatim or closely paraphrased from a copyrighted source** — dictionaries, encyclopedias
(including Wikipedia), manufacturer manuals/marketing, textbooks, standards documents, other glossaries, or
web content. Use web search/fetch to compare suspect phrasings against likely sources; quote the
overlapping span and name the suspected source.
- **Not infringement — leave OK:** facts, spec values, a standard's exact defined term, short factual
  phrases, and the headword itself are not copyrightable. Do not flag these.
- **Flag it:** distinctive sentences, analogies, or a multi-clause definition that tracks a specific
  source's wording. Give a concrete original rewrite that keeps the facts but is our own expression.
- Severity: **High** = substantial verbatim copying of protectable expression; **Medium** = close
  paraphrase that should be reworded to be safely original; **Low** = minor echo. Bias to OK — most terms
  authored from multiple sources are already original.
- These findings go in the normal reviewer suggestions array (field = the affected field) so editors
  rewrite them into unique IP during corrections.
### Job 2 — Legal-citation / mark flagging (a SEPARATE report, applied AFTER review)
Identify every **term, product name, brand, technology, or standard that carries a trademark, registered
mark, copyright, or other legal-attribution requirement**, so the correct symbol/notice (® ™ ©, or a
standards/patent attribution) can be added *after* the committee pass. **Do not edit field text for this** —
record it in a separate list. For each: the mark/name as it appears, the mark type (® registered trademark,
™ unregistered trademark, © copyright, or standard/patent attribution), the **web-verified owner/holder**
(e.g. Dante® — Audinate; Serato®; rekordbox® — AlphaTheta/Pioneer; Shure®; QLab™ — Figure 53; Bluetooth®;
Wi-Fi®; SMPTE®), a confidence flag (verified/unverified — mark unverified if you cannot confirm the owner to
an authoritative source), and where/how attribution should appear. This list is a deliverable for the
post-review production step that inserts the symbols; it is never merged as a text edit.

---
## SHARED REVIEW RULES (all four experts)
- **Bias to OK.** It is expected and correct that most terms come back "OK — no changes" (a healthy result
  is ~90% OK). Do not manufacture issues or nitpick. Quality of the few flags beats volume.
- **Coverage:** output exactly **one review object per term** in the packet, in the same order. No term
  skipped. (Verify counts; re-run any reviewer file whose count ≠ the packet's term count.)
- **Severity ladder (strict):** High = a factual/technical error, unsafe guidance, self-contradiction, or
  substantial copyright infringement that would mislead or expose the product. Medium = a real
  accuracy/safety/comprehension/originality improvement a professional would actually make. Low = a genuine
  clarity/grammar problem or a missing difficulty tag — not a style preference.
- **Do NOT flag house style:** list-item capitalization, serial/terminal punctuation, and hyphenation are
  intentional per-entry conventions, not errors.
- **Source-quality rule (applies to every reviewer who cites a source, and to editors):** Wikipedia, Reddit,
  forums, Quora/StackExchange, blogs, SEO/content-farm pages, AI-generated text, and vendor marketing **do
  not count** as authoritative — pointers only, never corroboration, never cited. Every required source must
  be a standards body (AES, IEC, IEEE, ANSI/ESTA, OSHA, NEC/NFPA, ASME, ISO, ITU, SMPTE/EBU, FCC, MIDI
  Association, etc.), manufacturer technical/service documentation, or a recognised professional text/
  peer-reviewed source. ≥2 sources per fact, ≥3 for safety-critical.
- **plain_english reading level:** must read at Flesch-Kincaid grade ≤ 9 (a standard 14-year-old); sentences
  ≤ 20 words; simplify the language, never the facts.

### Reviewer output (one JSON file per expert per group)
```
{ "expert":"audio|cognition|language|legal", "group":<n>,
  "reviews":[
    {"id":"<uuid>","term":"<term>","verdict":"OK|MINOR|NEEDS_REVISION",
     "suggestions":[{"field":"<field>","severity":"High|Medium|Low",
                     "issue":"<what; for Med/High technical or copyright, include the web-verified fact/source>",
                     "suggestion":"<concrete fix / original rewrite>"}]}
  ],
  // LEGAL EXPERT ONLY — additional top-level array (Job 2):
  "legal_citations":[
    {"id":"<uuid>","term":"<term>","mark":"<name as it appears>",
     "mark_type":"registered_trademark|trademark|copyright|standard_or_patent_attribution",
     "symbol":"®|™|©|(cite)","owner":"<verified owner>","confidence":"verified|unverified",
     "where":"<where attribution applies>","note":"<short note>"}
  ]
}
```
OK terms: verdict "OK", empty suggestions. Validate JSON parses before finishing.

---
## AFTER REVIEW — corrections, then the readability gate
1. **Aggregate** each term's suggestions from all four experts. Split them:
   - **Difficulty** recommendations → a **separate report** (difficulty is a structural field owned by the
     database writer; do NOT write it into the merge payload).
   - **Term-rename / duplicate-entry** flags → the same report (merge safety: never change the `term`
     string — the database matches on id/term).
   - **Legal-citation** flags → the separate legal-citations report (post-review symbol pass).
   - **Everything else** (technical, clarity, pedagogy, and legal copyright rewrites) → editor packets.
2. **Editors** apply every remaining suggestion. Web-verify each technical/factual fix against acceptable
   sources before writing; if a suggestion is itself wrong, keep the original and say why. Legal copyright
   suggestions = originality rewrites that preserve all facts but change the expression. Reconcile when two
   experts flag the same field. Output only the changed fields per term.
   **Merge safety (absolute):** never output `id`, `term`, or `difficulty` as changed fields; keep list
   fields (related_terms, common_mistakes, scenario_contexts) as complete JSON arrays; preserve any
   "UNSAFE:" prefixes; no source citations inside field text.
3. **Readability gate:** run a Flesch-Kincaid check over every corrected `plain_english`; rewrite any that
   exceed grade 9 or contain a sentence over 20 words (split into short sentences; never change the facts),
   and re-run until it passes. This gate is authoritative — do not rely on the committee to catch
   reading-level issues by eye.

## What to hand back per batch
The four experts' review files (audit trail), the corrected output (the payload to merge), the difficulty
report, the legal-citations report, and short completion notes (terms reviewed, OK rate, corrections
applied, any copyright rewrites, anything left for a human to rule on). The committee-reviewed + corrected
output is what gets exported for glossary upload — never the authored-only draft.
