# Study-Loop Pedagogy Audit — 2026-09-13 (report-only)

Dual-hat pass (learning science + product design) over the study loop:
Flashcards → Fill-in-Blank → Matching → Scenarios → Topic Quiz, plus the
Dashboard gate and the retention layer. All paths absolute; no source edits made.

Files read: `C:\Users\profe\dev\ape-studio\src\screens\study\FlashcardsScreen.tsx`,
`FillInBlankScreen.tsx`, `MatchingScreen.tsx`, `ScenariosScreen.tsx`,
`C:\Users\profe\dev\ape-studio\src\screens\quiz\QuizScreen.tsx`,
`C:\Users\profe\dev\ape-studio\src\screens\results\ResultsScreen.tsx`,
`C:\Users\profe\dev\ape-studio\src\screens\dashboard\DashboardScreen.tsx`,
`C:\Users\profe\dev\ape-studio\src\features\study\sentences.ts`, `api.ts`,
`scenarioHomework.ts`, `C:\Users\profe\dev\ape-studio\src\features\notifications\weeklyConcept.ts`.

---

## What is already GOOD — do not touch

These are genuinely strong; several are best-in-class for a study app.

1. **Scenarios is the pedagogical gold standard of the loop.**
   - Inline verdict + explanation on every answer (`ScenariosScreen.tsx:578-587`): "✓ Correct — / ✕ Not quite —" followed by the authored explanation. This is textbook immediate elaborative feedback.
   - The end-of-round report (`ScenariosScreen.tsx:383-448`, built in `scenarioHomework.ts:195-221`) clusters by concept category into "WHAT YOU'VE GOT DOWN" / "REVISIT THESE" / "WORTH A SECOND LOOK", and the missed list re-shows prompt + answer + explanation. This is exactly the "resurface what was weak" beat the rest of the loop lacks — it is the template to copy, not to change.
   - Three rounds over the same term pool = built-in within-topic spaced re-exposure.

2. **Completion requires retrieval success, not exposure.** `studyDisplayPct` (`api.ts:281-300`) credits an item only when answered CORRECTLY once (`correct >= 1`, line 296) for every method past flashcards. A wrong answer keeps the item in play until it is retrieved correctly — the loop cannot be completed by clicking through. (Retrieval practice done right.)

3. **Fill-in-blank shows the right answer on a miss.** `cellState` (`FillInBlankScreen.tsx:365-372`): correct term always green, wrong pick red — "you see both your mistake and the right answer" — and the screen-reader announcement names the answer (`FillInBlankScreen.tsx:301-303`). The judged moment is not colour-only.

4. **The sentence machinery is principled desirable difficulty.** `sentences.ts` — one randomly-chosen sentence per showing so learners "spot meaning anywhere in a definition instead of pattern-matching the first sentence" (header, lines 7-10); anti-leak masking with variant/partial/prefix detection (`leakPatternsV2`, lines 146-178); distractors that deliberately SHARE a word with the answer (`pickDistractors`, lines 346-356) so surface matching fails and meaning has to be processed; matching clues tiered to never contain the pair's own term (`matchingClueV2`, lines 397-420). Also the sequence genuinely scaffolds: flashcards (exposure, 6 elaboration views incl. MISTAKES and RELATED TERMS — `FlashcardsScreen.tsx:98-105`, `levelText` 156-188) → FIB (cued recognition) → matching (discrimination among neighbours) → scenarios (application + explanation) → quiz (transfer). The staged unlock has real pedagogical content behind it.

5. **Flashcards protects the learner's earned state and resumes intelligently.** Known is non-destructive/never regresses (header lines 13-17), resume lands on the first unseen card (`FlashcardsScreen.tsx:1095-1104`), and the 1.5s dwell guard (`:563-567`) stops credit-farming by fast swiping.

6. **Quiz results include a per-question wrong-answer review** — question, your answer, correct answer (`ResultsScreen.tsx:166-177`) — and the partial-pass copy states the exact requirement (`:139-149`). The scenarios round-report + this review are the loop's two honest feedback documents.

---

## Findings (each: experience → principle → minimal proposal → effort)

### F1 — Fill-in-blank wrong answer: 950 ms to encode a correction, then gone
`FillInBlankScreen.tsx:54` (`FEEDBACK_MS = 950`) and `answer()` `:317-324`: on ANY answer — right or wrong — the coloring holds 950 ms and auto-advances. On a miss the learner sees the green correct cell for under a second, with no why: no definition line, no link between the sentence and the term that fits it.
**Why it matters:** immediate elaborative feedback is what turns an error into learning; a sub-second flash is judgment, not teaching — especially since the sentence often DESCRIBES the answer without naming it (57% of the corpus, header of `blankOut` `:65-72`), so the connection is not self-evident.
**Proposal (S):** branch the timeout — correct keeps the 950 ms auto-advance; wrong holds the board and shows a one-line teach strip (the term + first sentence of `question.item.definition`, already in memory) with a tap-to-continue, exactly the scenarios banner pattern (`ScenariosScreen.tsx:578-587`). No new data needed.

### F2 — Matching wrong pick is a dead end: "Not a match", 650 ms, no resolution
`MatchingScreen.tsx:362` announces only "Not a match."; `:389-394` flashes red for `WRONG_FLASH_MS = 650` and clears. The learner is never told which term the clue described — they can only re-guess. Trial-and-error can even solve boards without reading (last pairs by elimination).
**Why it matters:** unresolved errors get re-encoded; feedback that says only "wrong" invites guessing strategies instead of discrimination.
**Proposal (M):** keep the in-board flash (revealing mid-board would kill the exercise) but add a 2-3 line board-complete recap before the auto-advance (`:380-387`): "You missed: <term> — <the clue sentence>" for pairs answered wrong on this board (already tracked in `states` attempts/correct per item). Skip the recap on clean boards so fast learners never see it.

### F3 — Quiz review shows the correct answer but never the why (known gap D-3)
`ResultsScreen.tsx:15-16` documents it: "Explanations are NOT client-readable — quiz_questions is admin-only; gap D-3 logged for the backend session." So the highest-stakes wrong-answer moment in the app (28/30 needed) teaches less than the free scenarios drills do.
**Why it matters:** the post-test review is the single highest-leverage feedback event (hypercorrection effect — confident errors corrected with explanation stick best); on a fail it is also the map for the retake.
**Proposal (M, server-touching — owner call, backend is frozen):** have `submit_quiz` include `explanation` per wrong slot in `wrong_answers` (it is grading server-side already, so no client-readable table is exposed); render it as a third line in the existing review card (`:169-175`). Client half is trivial.

### F4 — The locked state is silent at the exact moment of frustration
Locked method/quiz switches are DEAD disabled caps (`DashboardScreen.tsx:1679-1681`, `:1725`, `:1804-1806`): they "travel + click on touch but open nothing". The only explanation is the accessibility label — a sighted learner tapping a dark panel gets zero words. The quiz panel's whole story while locked is `LOCKED` / `GATES UNMET` (`:1770-1775`), and `:1824-1825` explicitly renders no gate-line "the sequence itself is the guidance".
**Why it matters:** a gate the learner cannot read is experienced as broken, not as a curriculum; goal-gradient motivation needs the NEXT step named ("finish Matching — 3 terms left"), and note the membership lock already got this right ("the sheet is the sales moment, a dead button is not", `:1560-1566`) — the pedagogy lock deserves the same courtesy.
**Proposal (S):** make dead caps pressable → a small themed popup (never Alert, per popup standard) naming the specific unmet prerequisite from state already computed at `:1219-1230`, e.g. "Powers on when Flashcards hits 100% — 4 terms left" / for the quiz, the per-method checklist. Copy needs owner ratification.

### F5 — Nothing resurfaces the learner's OWN weak terms
Every miss is recorded (`attempts`/`correct` per item in `ItemStates`, mirrored + synced), but nothing reads it back as a study cue: the flashcards deck filters by known/flagged/starred/unseen (`FlashcardsScreen.tsx:538-557`) — flagging is entirely manual; FIB/matching working order puts `attempts < 2` first (`FillInBlankScreen.tsx:237-244`, `MatchingScreen.tsx:150-154`) but never sorts missed-often items forward; the scenarios report NAMES the weak categories but its "Focus your next pass on" advice has no button.
**Why it matters:** error-driven selective restudy is the cheapest spaced-practice win available — the data is already on the server, only the loop back into the deck is missing.
**Proposal (M):** derive a "Tricky" set client-side (`attempts - correct >= 2`, union across the three answer methods' item_states) and surface it as (a) one more view chip in flashcards next to KNOWN/FLAGGED — the chip/list plumbing already exists (`:544-556`, `TermListSelKey`), and (b) the destination of a "Review these" button on the scenarios report cards (`ScenariosScreen.tsx:411-423`).

### F6 — Completion moments for FIB / Matching / Flashcards are an anticlimax
At 100% the only change is that auto-advance stops ([53]: `FillInBlankScreen.tsx:320-323`, `MatchingScreen.tsx:380-386`) — the learner is left on a live question board with no recap, no accuracy readout, no pointer to the newly-powered next method. Flashcards has no completion beat at all (the LED just fills). Contrast: scenarios ends every round with a report and the quiz ends with Results/Trophy.
**Why it matters:** a closure beat is where consolidation and forwarding happen — recap the weak items (F5's data), confirm the achievement, and hand off ("Matching unlocked ▸") so the staged rack reads as progress, not as silence.
**Proposal (M):** one shared lightweight interstitial (modal or inline card) on first reaching 100% per method: accuracy, the 3 lowest-accuracy terms (from local `states`), and a button to the next unlocked stage. Reuse the round-report visual language (`ScenariosScreen.tsx` report styles).

### F7 — Scenarios: the explanation auto-advances in 3 s even when you were WRONG
`ScenariosScreen.tsx:54` (`EXPLANATION_MS = 3000`) and `judge()` `:282-283`: right or wrong, the banner with the full explanation departs after 3 seconds (tap-to-skip exists; there is no tap-to-stay — tapping the banner ADVANCES, `:579`).
**Why it matters:** the learner who most needs the explanation (the one who missed) gets the same 3-second window as the one skimming a confirmation; reading + processing a correction in 3 s while feeling the miss is rushed.
**Proposal (S):** on `correct === false`, do not arm the auto-advance — require the tap (relabel the hint "tap to continue"). Correct keeps the 3 s flow. One-line branch at `:283`.

### F8 — Retention layer is generic, not personal
The weekly concept notifications are category-subscription misconceptions (`weeklyConcept.ts:7-49` — 7 fixed categories, server picks the concept); the 7 local reminders are schedule-generic. Nothing between sessions touches the learner's own flagged, starred, or missed terms; the "CONTINUE LEARNING" resume banner (`lastStudyLocation`) restores PLACE but not WEAKNESS.
**Why it matters:** spacing works best on the learner's own error set; the app already owns both halves (a per-user miss record and a notification pipeline) but never joins them.
**Proposal (L server / M client-only):** client-only first step — a Dashboard "Since last time" card listing 3 terms from the F5 "Tricky" set with a one-tap jump into flashcards on that list. The server-cron personalization (weekly notification seeded from the user's misses) is a later phase and gated on the notifications revoke work anyway (see security-review-2026-08-28).

### F9 (minor) — Flashcards deck at 0 remaining shows "0 / 0", not a state
When every card is known-hidden the counter renders `0 / 0` (`FlashcardsScreen.tsx:1224`) with Prev/Next disabled — functional, but the moment of finishing a deck deserves at least a "All cards marked known — Review or Reset Deck" line. Folded into F6's interstitial if built; otherwise a one-line empty-state text (S).

---

## Ranked list — learning impact per effort

| # | Finding | Effort | Why this rank |
|---|---------|--------|---------------|
| 1 | F1 FIB: hold + teach-line on wrong answers | S | Highest-frequency wrong-answer moment in the whole loop; pattern already exists in scenarios |
| 2 | F4 Dashboard: locked taps explain themselves | S | Every learner hits this wall; state already computed; pure copy + popup |
| 3 | F7 Scenarios: no auto-advance on a miss | S | One-line branch; protects the loop's best feedback from its own timer |
| 4 | F5 "Tricky terms" set (flashcards chip + report button) | M | Turns already-collected miss data into selective restudy; unlocks F8 |
| 5 | F3 Quiz explanations in wrong_answers | M (server) | Biggest single feedback upgrade, but backend is frozen — owner scheduling call |
| 6 | F6 Method-completion recap interstitial | M | Closure + forwarding beat; reuse round-report visuals; absorbs F2 + F9 |
| 7 | F2 Matching board-complete miss recap | M | Subsumed by F6 if built; standalone otherwise |
| 8 | F8 Personal retention nudges | M–L | Client card first; server personalization later, gated on notifications work |

*Report only — nothing was changed. Copy in proposals 1, 2, 6 would be governed copy and needs owner ratification before shipping.*
