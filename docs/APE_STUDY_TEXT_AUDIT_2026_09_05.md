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
| Matching clue had **something hidden** ("___" / "…") | 11.8% | 47.5% (only the giveaway words and other pairs' names) |
| Matching clue **names another term on the same 4-pair board** | not measured before | **0.1%** (the name is hidden as "…") |
| Matching clue with **three or more hidden words** | — | 5.6% |
| Fill-in-the-Blank with **more than one answer blank** ("______ … ______", the fragmentation both readers flagged) | common | **0%** — exactly one answer blank, and only ever on the exact term; a hidden *word* of the answer is an ellipsis "…" |
| Fill-in-the-Blank question with **three or more hidden words** | — | 1.9% (was 8% in reader 1's sample); two hidden words 9.1% |
| Fill-in-the-Blank hides **half a hyphenated compound** ("DC-______") | — | **0%** (the whole compound is hidden) |
| Fill-in-the-Blank shows a word of the answer that **none of the other 3 options has** (incl. a visible prefix like "in alt" for *in altissimo*) | — | **0%** (words shared with a distractor stay visible on purpose: 47.2%) |
| Fill-in-the-Blank sentence that *describes* the answer, so the blank sits at the **end** | — | 63.3% |
| A near-duplicate row offered as its own distractor ("Overtones" for *Overtone*) | possible | **never** (client guard; 259 such pairs listed for the owner, §4) |
| Broken glossary rows (empty / placeholder / self-referential) | 0 real ones (4 "placeholder" hits are legitimate uses of the word, e.g. *Scratch DX*) | — |
| **Duplicate term inside one topic** (owner list, §4) | **5 rows** | client guard so a duplicate is never its own distractor |
| **Flashcards MISTAKES side** silently showed the definition under the MISTAKES label whenever `common_mistakes` was null (eyes-on reader caught it on "ADR Taker"). The column is masked server-side for non-members, so every guest/free card did this; whether members get data is unverified (§4) | 100% of cards seen by anon | the card now says why: member-feature line for non-members, "not written yet" line for members with an empty row, then the definition |

Numbers come from running the app's **real** sentence code over every active v3 glossary row (`scripts/study-text-audit.mjs`, read-only, publishable key). Both JSON reports are in `docs/study_text_audit_baseline.json` and `docs/study_text_audit_after.json`.

## 2. Why it happened

* **FIB blanked only the raw term** (with its parenthetical, no word boundary). Most definitions describe a term without repeating it verbatim — so nothing was blanked and the learner saw a bare sentence. When the term *was* present, its other forms ("compresses", "SPL") stayed visible.
* **Matching's leak filter** only knew the exact term, its plural and its abbreviation — not "-ing/-ed/-er" variants or the significant words of a multi-word answer.
* **Distractors were random**, so a wrong option could be sitting in the sentence.

## 3. What changed in the app

| File | Change |
|---|---|
| `src/features/study/sentences.ts` (new, dependency-free) | Shared sentence rules for the app **and** the audit harness: `wordRoot` stemmer (roots ≥ 4 letters), `leakPatternsV2` (each "A / B" alias exact / abbreviation / variant / partial, words ≥ 3 letters), `findLeaks`, `leakSpans` + `maskLeaksFor` (**discriminative**: a partial word is hidden only when no other option on screen shares it; the exact term or first leak is the one answer blank "______", further hidden words and other options' names are "…"; a parenthetical glued to a hidden span is dropped; hyphenated compounds are hidden whole), `pickDistractors` (prefers terms sharing a word with the answer; never one named in the text; never a same-text duplicate), `fibSentence` (ranks sentences by extra gaps needed), `matchingClueV2` (no hard leak → fewest gaps → fewest other board terms → no pronoun opener; "___" then "…"). The original `splitSentences` / `randomSentence` / `matchingSentence` live here unchanged and are re-exported from `study/api.ts`. |
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

Nothing else in the corpus *blocks* a clean question: `corpus_unrescuable = 1` (a one-line definition, "Opposite of high-pass filter." for *Low-Pass Filter*).

**Near-duplicate rows (259 pairs, 1% of the corpus — owner, whenever convenient).** Two glossary rows with the same words in the same order, differing only by plural / inflection / case / parenthetical: "Overtone" ↔ "Overtones", "Wind effect" ↔ "Wind effects", "Decibel (dB)" ↔ "Decibel", "Cylindrical waves" ↔ "Cylindrical Wave" … The full list is `nearDupPairs` in `docs/study_text_audit_after.json`. The app never offers one as the other's distractor now, but each pair still produces two near-identical flashcards/questions. Spelling-variant rows the key cannot catch were also seen by the readers: "Automated Dialogue Replacement" ↔ "Automatic dialog replacement" (topic 4170), "Overdub" ↔ "Overdubbing", "Bench test" ↔ "Bench testing", "Tom gate" ↔ "Tom gating".

**Other corpus notes from the readers (no rule can fix these):** lowercase term rows ("jump cut", "rhythm", "ursatz", "in altissimo", "music performance anxiety"); fragment definitions ("Tape marks locating set pieces, stands, or performers' positions." for *Spike Mark*); definitions that differ only by the answer itself (*Second wing* / *Third wing*; *Wild pickup* / *Tail pickup* / *Mid-sentence pickup* — the question is unanswerable by design); "Downstage center" defined as generic downstage; "Deck" ↔ "Stage deck" defined alike; "Aluminum boom pole … Carbon fiber is also electrically conductive" (non sequitur); one weak clue for *Technical workbench* (about ESD practice).

**The MISTAKES flashcard side — what is actually known (owner / Computer A).** `common_mistakes` is masked per entitlement *server-side* (`glossary_study_v` / `glossary_full_v` via `has_academy_access()`, backend handoff 2026-07-16). The audit harness and the web preview only ever read as **anon**, so the NULL on all 27,201 rows is the mask working as designed — it is *not* proof the column is empty. ccode cannot check the academy view of it (no session on the web preview; anon has no SELECT on `glossary.common_mistakes`, PostgREST `42501`). What is unverified and needs Computer A: whether the base column is populated at all (the term-buckets export carries `common_mistakes`), and whether an academy session actually receives it. Until then the card no longer repeats the definition under the MISTAKES label silently: non-members see "Common-mistakes notes are an Academy member feature", members with an empty row see "No common-mistakes note written for this term yet" — both followed by the definition. `plain_english` and `scenario_contexts` are present on every row. No SQL was run by ccode. Handoff note: `docs/CCODE_TO_COMPA_MISTAKES_SIDE_2026_09_05.md`.

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

### Reader 2 (topics 4130, 3850, 4450, 3860, 3830 — on the round-3 rules)

50 flashcards, 80 FIB questions, 20 matching boards (80 clues) read. Flashcards clean; every FIB question had a blank; no crashes, no reload.

* **Fragmentation was the dominant defect** (~30 instances): a definition that repeats the answer's words produced 2–5 blanks for one answer ("A ___ is a storage ___, typically on networked or ___-access storage, that holds a ___'s media" for *Shared project volume*; "multiple Take are captured" when the plural was blanked).
* **Blanks glued to hyphens**: "DC-______", "long-______, double-______, triple-______", "front-of-______".
* **Alias / abbreviation leaks**: "Lip sync (AV sync): …" for *Lip Sync / AV Sync*; "______ (also called production sound)"; "(Ms)" beside the blank for *Saturation magnetization*; "(nWb/m)" for *nanoweber*; "(ARM)" for *ARM-Enabled Track*; "(dipping)" for *Boom dip* (3-letter word was below my threshold).
* **Distractor visible**: "A clapperboard with a built-in timecode generator" with the option *Clapperboard / Slate*; "the same as a sample-and-hold" with *Sample-and-hold circuit*; the clue for *Register change* mentioning "chorus" with *Chorus section* on the board.
* Corpus notes for the owner: near-synonym option sets ("Live Tracking / Live Capture / Live Off the Floor"; "Hidden microphone placement" vs "Microphone concealment"); lowercase term "jump cut"; one definition non sequitur ("Aluminum boom pole … Carbon fiber is also electrically conductive").
* Interaction note (not text): in Matching a pair sometimes needed a second click after the panel grew — buttons shift as content reflows.

**Round 4 fix (from this reader):** hidden text is now computed as spans — the exact term (or first leak) is the *one* answer blank, every further hidden word is an ellipsis "…", a parenthetical glued to a hidden span is dropped, spans widen across hyphens so a compound is hidden whole; sentences are ranked by how many extra gaps they would need; "A / B" terms match each alias; 3-letter words count ("dip" → "dipping"); an option is "named" by any alias or by the head of a 3-word name, and other options named in the text are hidden as "…".

### Reader 3 (topics 4210, 4200, 3670, 4060, 4170 + spot re-check of 3850 / 4450 — on the round-4 rules)

40 flashcards, 80 FIB questions, ~17 matching boards read, plus the re-check. No crashes, no reload.

* **Flashcards clean** (40/40). **Every FIB question had exactly one blank.** The "…" gaps "mostly still read cleanly"; one clue with four gaps (*Step resolution*, every gap the word "step") was hard to parse.
* **Spot re-check: the multi-gap garbling and the "(Ms)" / "nWb" abbreviation leaks are gone** ("nanowebers per meter (nWb/m)" now appears only where it is spelled out and not adjacent to the blank).
* Remaining rule findings → **round 5**: a hidden *word* of the answer was promoted to the answer blank mid-sentence ("so it fits the ______," for *Music editing*; "and ______ the grain's tonal character" for *Grain shape*) — the blank now sits only on the exact term, otherwise it trails; a visible prefix leaked ("in alt" for *in altissimo*) — prefixes of long answer words are now hidden; near-duplicate rows could be their own distractor — guarded.
* Corpus findings → §4 (lowercase rows, fragment definitions, twins that differ only by the answer, spelling-variant duplicates).
* **App-mechanics finding, filed (not text):** in Matching, tapping NEXT past an unsolved board carried the unmatched pairs forward, so the pool grew 4 → 6 → 7, and on one board two clues could not be matched to any remaining term; the page text also lagged the last match until an explicit wait. This needs a device pass — it may be the intended carry-over, or a state bug.

## 6. Restore checklist

- [x] `src/config/devMode.ts` → `bypassMethodLocks: false` — restored 2026-09-05 after reader 3 (the flip never entered git history).
