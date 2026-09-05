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
| Matching clue shows a word of its answer that **no other term on the board has** (the giveaway reader 1 found) | ~60 of 100 sampled clues | **0%** — blanked as "___"; words shared with other board terms stay readable (21.4% of clues) |
| Matching clue had **something masked** ("___") | 11.8% | 43.4% (only the giveaway words) |
| Matching clue **names another term on the same 4-pair board** | not measured before | 2.6% residual (the rule prefers the sentence with the fewest) |
| Fill-in-the-Blank question with **three or more blanks** | — | 3.7% (was 8% in reader 1's sample before round 3); two blanks 15.2% |
| Fill-in-the-Blank shows a word of the answer that **none of the other 3 options has** | — | **0%** (words shared with a distractor stay visible on purpose: 39.3%) |
| Fill-in-the-Blank sentence that *describes* the answer, so the blank sits at the **end** | — | 43.4% |
| Broken glossary rows (empty / placeholder / self-referential) | 0 real ones (4 "placeholder" hits are legitimate uses of the word, e.g. *Scratch DX*) | — |
| **Duplicate term inside one topic** (owner list, §4) | **5 rows** | client guard so a duplicate is never its own distractor |
| **Flashcards MISTAKES side** — the study view returns *no* common-mistakes text for **any** of the 27,201 rows, so that side silently showed the definition under the MISTAKES label (eyes-on reader caught it on "ADR Taker") | **100%** of cards | the card now says "(No common-mistakes note written for this term yet — here is its definition.)" — the data itself is an owner item (§4) |

Numbers come from running the app's **real** sentence code over every active v3 glossary row (`scripts/study-text-audit.mjs`, read-only, publishable key). Both JSON reports are in `docs/study_text_audit_baseline.json` and `docs/study_text_audit_after.json`.

## 2. Why it happened

* **FIB blanked only the raw term** (with its parenthetical, no word boundary). Most definitions describe a term without repeating it verbatim — so nothing was blanked and the learner saw a bare sentence. When the term *was* present, its other forms ("compresses", "SPL") stayed visible.
* **Matching's leak filter** only knew the exact term, its plural and its abbreviation — not "-ing/-ed/-er" variants or the significant words of a multi-word answer.
* **Distractors were random**, so a wrong option could be sitting in the sentence.

## 3. What changed in the app

| File | Change |
|---|---|
| `src/features/study/sentences.ts` (new, dependency-free) | Shared sentence rules for the app **and** the audit harness: `wordRoot` stemmer (roots ≥ 4 letters), `leakPatternsV2` (exact / abbreviation / variant / partial), `findLeaks`, `maskLeaksFor` (**discriminative**: a partial word is blanked only when no other option on screen shares it), `pickDistractors` (prefers terms sharing a word with the answer; never one named in the sentence; never a same-text duplicate), `fibSentence`, `matchingClueV2`. The original `splitSentences` / `randomSentence` / `matchingSentence` live here unchanged and are re-exported from `study/api.ts`. |
| `src/screens/study/FillInBlankScreen.tsx` | One call to `fibSentence` with the topic's other terms: sentence that names the term preferred (fewest answer-words to hide, no dangling "It…" opener), masked against the four options actually shown; if no sentence names the term, the describing sentence gets a **trailing blank** so there is always somewhere to put the answer. |
| `src/screens/study/MatchingScreen.tsx` | `matchingSentenceV2` with the board's four terms: never an exact/abbreviation/variant leak → fewest board-distinctive answer words → fewest other board terms → no pronoun opener; the distinctive words are masked "___", shared ones stay readable. |
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

**The MISTAKES flashcard side has no data (owner / Computer A).** `glossary_study_v.common_mistakes` is NULL for all 27,201 rows, and the anon role has no SELECT on `glossary.common_mistakes` (PostgREST answers `42501 … GRANT SELECT ON public.glossary`), so the app cannot see whatever the term-buckets export holds. Until the view exposes it, the side shows the honest fallback line plus the definition. `plain_english` and `scenario_contexts` are present on every row. No SQL was run by ccode.

**Flashcards fallback copy (non-ratified, new 2026-09-05, flagged for your review):** "(No common-mistakes note written for this term yet — here is its definition.)" — same shape for plain-English / purpose & application / scenarios / related-terms sides when those are ever empty.

## 5. Eyes-on pass — 15 seeded-random topics (seed 20260905)

gs 4460 Audio Restoration & Archival · 3840 Recording Fundamentals & Signal Chain · 3210 Enclosure, Horn & Radiation Engineering · 3890 Instrument Mixing – Drums & Percussion · 3540 Repair · 4130 Post Workflow, Spotting & Sessions · 3850 Session Workflow, Takes & Documentation · 4450 Tape Recording, Formats & Formulations · 3860 Band Tracking Workflow & Arrangement · 3830 Preamp & Converter Engineering · 4210 Film Scoring – Technology & MIDI Mockups · 4200 Film Scoring – Composition & Orchestration · 3670 Stage Geography & Backstage · 4060 Sample Editing & Beat Programming · 4170 ADR & Looping

Reader agents (academy tier, web preview, bypass on) read 12 flashcards, 20 FIB questions and 5 matching boards per topic on the **fixed** build, **one reader at a time**.

*Harness lesson (cost one wasted run):* three readers in parallel share the preview's origin storage, so every reload's guest wipe erased the other readers' enrollments and the app appeared to "reset itself" every few actions. That first run still caught two real defects — the trailing blank being appended after partial-word blanks ("…effects ______. ______", fixed in `fibSentence`) and the MISTAKES flashcard side showing the definition (§4).

### Reader 1 (topics 4460, 3840, 3210, 3890, 3540 — on round-2 rules, before the discriminative fix)

60 flashcards, 101 FIB questions, 25 matching boards (100 clues) read.

* **Flashcards: clean.** All 60 fronts/definitions and the sampled plain-English / purpose / scenarios sides matched their labels. One stylistic fragment ("Audio Interface" purpose side is telegraphic).
* **Fill-in-the-Blank: every question had a blank; ~75–80% clean.** What was still wrong: *over-blanking* — masking every repeat of the answer's words produced 3–6 blanks in 8 of 101 questions ("The physical ______ of broken or failed joints in magnetic ______, including old ______ … on a ______ block so the ______ can be safely played" for *Tape splice repair*); one absurd blank over the word "not" (root of "Note" in *Ghost-Note Detail*); 6 visible variant/abbreviation leaks ("extracted" for *Wall-profile extraction*, "VCA" for *Drum VCA*, "tom-tom" for *Tom gating*); ~15 clues opening with a dangling "It / This / The term".
* **Matching: the worst remaining problem.** My round-2 rule deliberately left partial words visible for readability; the reader found ~60 of 100 clues carrying words of their own answer, some carrying *every* word ("Snare Reverb Send" clue contained snare, reverb and send; "Floor-tom processing" contained floor tom and processing; "Bias whistle", "Cue foil").
* Corpus notes for the owner: near-duplicate term pairs produce near-identical questions ("Overdub" / "Overdubbing", "Bench test" / "Bench testing", "Bias Adjustment" / "Bias-current adjustment", "ASIO" / "Audio Stream Input/Output", "Tom gate" / "Tom gating"); one weak clue ("Technical workbench" — its sentence is about ESD practice). No crashes, no console errors, no reload during the run.

**Round 3 fix (from this reader):** a partial word only gives the answer away if it *discriminates among the options on screen*. FIB distractors now prefer terms that share a word with the answer, and both methods blank only the words that appear in the answer and in **none** of the other options/board terms; short roots (≤3 letters) are no longer stemmed; sentences opening with a dangling pronoun are chosen last. Re-scan of all 27,201 items after round 3: hard leaks 0, unshared-word leaks 0, FIB questions with 3+ blanks 3.8% (from 8% in the reader's sample), distractor named in its sentence 0.

### Readers 2 and 3 (final build)

_(appended when they finish)_

## 6. Restore checklist

- [ ] `src/config/devMode.ts` → `bypassMethodLocks: false` (flipped `true` for this audit only).
