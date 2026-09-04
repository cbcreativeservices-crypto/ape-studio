# Computer C — Task 10 return: review & decisions

**Status:** Report/propose only. **Nothing applied.** This doc is for your
decisions before any database change. Validated by me end-to-end on 2026-09-03.

---

## Executive summary

Computer C audited the entry-path question bank for coherence (Part A) and swept
for residual "leak" language (Part B). The return is **complete, internally
consistent, and mechanically clean** — every count I re-derived matches C's
claims, and I independently re-verified the Part B rewrites.

- **Part A — coherence:** 2,222 records, **0 K1** (no wrong, unanswerable, or
  dangerous keys), 14 K2, 73 K3, 2,135 cleared (96.1%). **86 proposed fixes**;
  **none moves a correct answer.**
- **Part B — leaks:** 302 records, **299 rewrites**, all leak-clean.
- **Headline risk is low.** The single most important number — K1 = 0 — means no
  auditor, across 2,222 reads plus 800 blind second reads, found a keyed answer a
  knowledgeable student would be marked wrong on. C is careful to call this a
  bound, not a proof of zero.

Five issues are **bigger than one record** and need your direction. They're in
the Decisions section. The rest is mechanical and ready to package as guarded
SQL whenever you say go.

---

## What I independently verified

| Check | C's claim | My result |
|---|---|---|
| Part A canonical slices / records | 23 / 2,222 | 23 / **2,222** ✅ |
| Part A severity | 0 K1 / 14 K2 / 73 K3 / 2,135 cleared | **exact match** ✅ |
| Part A fixes by field | expl 23 / options 35 / qtext 28 = 86 | **exact match** ✅ |
| `moves_the_key` = true | 0 | **0** ✅ |
| `requires_correct_answer_sync` | 2 (98cfd5de, e6a9ea72) | **2, same ids** ✅ |
| Part B records / rewrites | 302 / 299 | **302 / 299** ✅ |
| Part B new_span lands in field | — | **299/299** ✅ |
| Part B smart-dash/quote left behind | 0 | **0** ✅ |
| Task-9 glossary residue | 45 | **45** ✅ |

The inflated raw count you might see if you unzip and glob naively (3,822) is the
Safety batch's `pass1/` + `pass2/` raw double-pass copies. Canonical merged
returns are the top-level `*_RETURN.json` in each batch folder.

---

## Part A — coherence findings (87 flagged)

All 87 are K2 (explanation) or K3 (stem/distractor). No K1. Every fix was checked
to not move the key. C's own grouping of the recurring causes:

1. **Explanations written for a different option set** (~⅓ of all K3s). The
   explanation names distractors that aren't in the option list — an *assembly*
   defect (explanation and options came from different generations of the item),
   not bad authoring. A script can find any remainder: explanations naming an
   option-like phrase absent from `options_json`.
2. **Off-domain filler distractors** ("a 70V tap", "a DI box", bowed-string
   options in a USB-noise item) that make the key findable on format alone.
   Concentrated in Safety 001–004 and G&S 009/011.
3. **Orphan stems** — 12 items whose stem refers to the glossary headword by
   pronoun ("this condition", "the term") but the headword never made it in.
4. **Glossary-poisoned items** — see Decision 1.

**One K3 has no fix, by design** (`19aca9ec`): the keyed option contradicts
itself ("disconnect the one device's power cable" then "reconnect devices one at
a time"). C filed it as an advisory because the correct repair is a rewrite of
the scenario, not a field edit — flagging for an author.

Topic spread (K1/K2/K3/cleared): Pro Audio Safety 0/5/43/744 · Grounding &
Electrical 0/2/15/313 · DAW Fundamentals & Session Management 0/7/11/782 ·
Workplace Skills 0/0/4/296.

---

## Part B — leak findings (302)

299 rewrites, 11 no-change. Classes: HARD 287, SOFT_OTHER 22, SPEAKER 1. Every
rewrite verified leak-clean (no meta-language, no smart dashes). Two things to
know before any SQL:

- **69 rewrites are pure deletions** — removing "(glossary definition)" and
  similar parentheticals. Safe; `new_span` is empty by design.
- **A dozen rewrites have longer-than-usual spans** because a pre-existing em/en
  dash near the leak was folded into the same edit (C's verifier rejects a smart
  dash *anywhere* in the field). The splice invariant still holds, so
  occurrence-guarded SQL is safe.

---

## Decisions needed (your call / Computer A's)

| # | Decision | My recommendation | Owner | Effort |
|---|---|---|---|---|
| 1 | **Wrong glossary entries poison their items** | **Fix at source + regenerate** *(your choice)* | Computer A | Medium |
| 2 | **50 "standard" Safety rows have no options/key** | Route to the `standard`-difficulty owner; can't be served as-is | You / Comp A | Medium |
| 3 | **Off-domain glossary content** in a pro-audio bank | Remove or replace the 3 terms | You / Comp A | Small |
| 4 | **45 Task-9 rewrites still name the glossary** | Apply a follow-up cleanup net | mechanical | Small |
| 5 | **When to apply the 86 + 299 mechanical fixes** | Guarded SQL package on your go | me | Small |

### Decision 1 — glossary bug *(you chose: fix at source + regenerate)*

Three glossary records are wrong and every item generated from them inherits it:

- `6bf82ba6` **"Sample-based Track"** — defined as "a track built from samples";
  the term actually means the sample (absolute-time) timebase, and the set's own
  Tick-based Track items use it that way. **5 of 5 items** flagged.
- `e9c93b33` + `cae583a0` **HEAT (Drive / Tone)** — say the controls are
  per-channel; Avid's HEAT Option Guide documents them as **master-section**
  controls. **4 K2 + 1 K3** across 5 items.

Per your decision, the durable fix is correcting the 3 glossary records and
**regenerating** the ~10 affected items rather than patching them one by one.
That's a Computer A job (it owns generation). C's item-level fixes stand as the
fallback/stopgap if you want the bank correct *before* regeneration lands.
**Recommended next step:** hand these 3 glossary ids + the ~10 item ids to
Computer A as a scoped regenerate task; I can draft that handoff.

### Decision 2 — 50 optionless "standard" rows

All 50 (Part B slice 003) are `usage=graded_quiz`, `difficulty=standard`, general
crew-safety topics (hazard vs risk, PPE, PASS, fire classes, 911/AED, ladders,
heat illness). Their `options_json` and `correct_answer` are literally `None`.
C fixed the leak in their *explanations* but did not invent options or keys.
**As delivered these rows cannot be served as quiz items.** This is independent
of the leak work and belongs with whoever owns the `standard` difficulty value —
either author options+keys, or retire the rows.

### Decision 3 — off-domain content

Three glossary terms don't belong in a pro-audio curriculum: asteroseismology
(`f572fc96`), seismology (`e49c6600`, `fc740207` — volcanic tremor, seismic
arrivals). Small cleanup; route with Decision 1 to Computer A.

### Decision 4 — Task-9 glossary residue (45 ids)

45 earlier Task-9 rewrites still end in "(glossary definition)" because Task 9's
minimum-span rule stripped only the column token. C listed all 45 (with file +
field) in `TASK9_GLOSSARY_RESIDUE.json`. Mechanical to clean in the same pass as
Part B. Recommend folding into the Decision-5 package.

### Decision 5 — applying the mechanical fixes

The 86 Part A fixes + 299 Part B rewrites (+ 45 residue) are ready to become a
guarded, reversible SQL package (same 00–99 pattern as the topic-name codify:
precheck → backup → md5/occurrence-guarded apply → verify → rollback). **Two care
items when we do:**

- **2 records need a paired `correct_answer` update** (`98cfd5de` occlusion;
  `e6a9ea72` HEAT) — the options fix rewords the keyed option, so the stored key
  string must change with it. C annotated both.
- **Ordering for 4 shared Safety records** (`04eadedc`, `6114df22`, `8d43224b`,
  `a5f8d754`): **Part B first** (span rewrites, occurrence-guarded), **then Part
  A** (full-field replacement, already leak-clean).

---

## Suggested sequence

1. **You decide** 1–3 above (2 and 3 can go to Computer A with 1).
2. I draft the **Computer A regenerate handoff** (glossary fixes + affected items
   + off-domain terms) — Decisions 1 & 3.
3. On your go, I build the **guarded SQL package** for the mechanical fixes —
   Decisions 4 & 5 — dry-run it, and either hand it to you or apply it.
4. The 50 optionless rows (Decision 2) wait on your call about the `standard`
   difficulty value.

Nothing here is applied until you say so. Tell me which pieces to start on.

---

## Appendix — file inventory

- Part A: `T10A_slice_001–023_RETURN.json` (safety 001–008 double-passed, with
  `pass1/`, `pass2/`, `adjudication/`, `tools/`).
- Part B: `T10B_slice_001–004_RETURN.json`, `TASK9_GLOSSARY_RESIDUE.json`,
  `REWRITER_BRIEF_10B.md`, `tools/`.
- Cover notes per batch + `TASK10_RUN_SUMMARY.md`.
