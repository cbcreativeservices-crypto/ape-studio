# Study-method TEXT audit — Flashcards · Fill-in-the-Blank · Matching (2026-09-05)

**Owner brief:** "sometimes the answer is already written in the question; sometimes there is no way to know what the question even is." Test the three Dashboard study methods extensively across at least 15 random topics and report.

**Owner's four rulings (before the run):** flip the dev bypass so every method opens in the web preview (restore after) · all 166 topics mechanically + 15 seeded-random topics by eye · a *leak* = the term, any word variant of it (plural / -ing / -ed / -er…), any significant word of a multi-word answer, or its abbreviation · fix the generators, add a client stopgap, and list corpus rows for the owner (DB is frozen — ccode never writes to it).

---

## 1. Plain-language result

The problem was real and much bigger than a few bad rows — it was the sentence-picking rules, not the glossary:

| What the learner saw | Before (all 27,201 items, 166 topics) | After |
|---|---|---|
| Fill-in-the-Blank shows a sentence with **no blank at all** (nothing to fill in) | **57.6%** of items *always*, another 31.0% *sometimes* | **0%** — every question has a blank |
| Fill-in-the-Blank sentence still contains a **variant or part of the answer** ("Bouncing…" for *Bounce*, "…power…" for *Phantom Power*) | **87.2%** of items had at least one such sentence; 53.7% in *every* sentence | **0%** |
| Fill-in-the-Blank offers a **wrong option that is visibly in the sentence** | common (51% of clue sentences named another topic term) | filtered out (a distractor is only used if it is *not* in the sentence) |
| Matching clue **gives away its own answer** (exact term / abbreviation / word variant) | **61.6%** of the clues the old filter accepted | **0%** |
| Matching clue had to be **masked with "___"** because no clean sentence existed | 11.8% (old rule) / would be 54.8% if every partial word were masked | **12.4%** — tiered rule keeps clues readable |
| Matching clue **names another term on the same 4-pair board** | not measured before | 2.4% residual (the rule prefers the sentence with the fewest) |
| Broken glossary rows (empty / placeholder / self-referential) | 0 real ones (4 "placeholder" hits are legitimate uses of the word, e.g. *Scratch DX*) | — |
| **Duplicate term inside one topic** (owner list, §4) | **5 rows** | client guard so a duplicate is never its own distractor |

Numbers come from running the app's **real** sentence code over every active v3 glossary row (`scripts/study-text-audit.mjs`, read-only, publishable key). Both JSON reports are in `docs/study_text_audit_baseline.json` and `docs/study_text_audit_after.json`.

## 2. Why it happened

* **FIB blanked only the raw term** (with its parenthetical, no word boundary). Most definitions describe a term without repeating it verbatim — so nothing was blanked and the learner saw a bare sentence. When the term *was* present, its other forms ("compresses", "SPL") stayed visible.
* **Matching's leak filter** only knew the exact term, its plural and its abbreviation — not "-ing/-ed/-er" variants or the significant words of a multi-word answer.
* **Distractors were random**, so a wrong option could be sitting in the sentence.

## 3. What changed in the app

| File | Change |
|---|---|
| `src/features/study/sentences.ts` (new, dependency-free) | Shared sentence rules for the app **and** the audit harness: `wordRoot` stemmer, `leakPatternsV2` (exact / abbreviation / variant / partial), `findLeaks`, `maskLeaks`, `fibSentence`, `matchingClueV2` (tiered). The original `splitSentences` / `randomSentence` / `matchingSentence` live here unchanged and are re-exported from `study/api.ts`. |
| `src/screens/study/FillInBlankScreen.tsx` | Uses `fibSentence`: prefers a sentence that names the term (masked, with every variant/partial masked too); if no sentence names the term, shows the describing sentence **with a trailing blank** so there is always somewhere to put the answer. Distractors never appear in the sentence and are never a same-text duplicate of the answer. |
| `src/screens/study/MatchingScreen.tsx` | Uses `matchingSentenceV2` with the board's own terms: never an exact/abbreviation/variant leak → fewest partial words → fewest other board terms → only if every sentence hard-leaks, the best one masked "___". |
| `test/studySentences.test.ts` | 9 rule tests (237 total pass). |
| `scripts/study-text-audit.mjs` | Re-runnable scan: `node scripts/study-text-audit.mjs baseline --pick` / `after`. |

Ratified copy, gates, the DB and the glossary views were **not** touched.

## 4. Corpus rows for the owner (DB is frozen — your edit, whenever convenient)

Five terms appear **twice** in their topic (two glossary rows, same term). Until merged, the client guard keeps the duplicate out of the FIB options; in Matching a board could in theory hold both.

| Topic | Term | glossary_id (2nd row) |
|---|---|---|
| 3050 Digital Audio – Sampling, Quantization & Formats | Nyquist Frequency | `83fe7d0d-c8c6-4c43-9ef9-e874b8086b96` |
| 3050 Digital Audio – Sampling, Quantization & Formats | quantization | `ae50c9be-2bc6-44af-b7ec-e8ad17351c5e` |
| 3180 Amplifiers | Damping Factor | `5a2a19fe-8403-4f3b-aa4f-66a38531f2d1` |
| 4290 Loudness & Listening Environments | Categorical Loudness Scaling | `4c5b5a80-473a-4ef4-9b5b-0df33a9519d7` |
| 4300 Speech & Voice Perception | Diagnostic Rhyme Test | `cd95d1e6-d6bf-4fd9-8592-41dba70ae59d` |

Nothing else in the corpus needs a row edit: `corpus_unrescuable = 0` (every item now yields a clean FIB sentence and a non-leaking Matching clue).

## 5. Eyes-on pass — 15 seeded-random topics (seed 20260905)

gs 4460 Audio Restoration & Archival · 3840 Recording Fundamentals & Signal Chain · 3210 Enclosure, Horn & Radiation Engineering · 3890 Instrument Mixing – Drums & Percussion · 3540 Repair · 4130 Post Workflow, Spotting & Sessions · 3850 Session Workflow, Takes & Documentation · 4450 Tape Recording, Formats & Formulations · 3860 Band Tracking Workflow & Arrangement · 3830 Preamp & Converter Engineering · 4210 Film Scoring – Technology & MIDI Mockups · 4200 Film Scoring – Composition & Orchestration · 3670 Stage Geography & Backstage · 4060 Sample Editing & Beat Programming · 4170 ADR & Looping

Three reader agents (academy tier, web preview, bypass on) read 12 flashcards, 20 FIB questions and 5 matching boards per topic on the **fixed** build.

_(results appended below when the readers finish)_

## 6. Restore checklist

- [ ] `src/config/devMode.ts` → `bypassMethodLocks: false` (flipped `true` for this audit only).
