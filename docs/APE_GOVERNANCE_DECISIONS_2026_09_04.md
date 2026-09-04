# AP&E — Governance & Decisions Log (2026-09-04)

Rulings of record from the Audio Career Finder build (`audio-tools-engine`
branch). Successor to `APE_GOVERNANCE_DECISIONS_2026_08_21.md`; earlier logs
stand. R-numbers restart at R1 per house style. Full copy trail:
`docs/APE_CAREER_FINDER_COPY_2026_09_04.md`. Assistant memory:
`career-finder-2026-09-04`.

## R1 — AUDIO CAREER FINDER IS FREE, NO ACCOUNT, DEVICE-LOCAL

The owner ruled the Career Finder (Career Discovery Lab, Beta) is free for
everyone including signed-out users, requires no account, and its record lives
only on the device (`ape:careerfinder:v1`, wiped on account switch via
`clearLocalAccountData`). It is the intended new-user front door and a
membership hook. This is deliberately outside the entitlement ladder — do not
gate it.

## R2 — THE GRAND AUDIO CAREER INDEX IS BUNDLED (workbook v2, 1,902 titles)

The owner's workbook `Pro_Audio_Training_Academy_Grand_Audio_Career_Index-2.xlsx`
is the source of truth. It is compiled into `src/data/careerIndex.json` +
`careerFamilies.json` by `scripts/build-career-index.py`, which resolves every
family's field/subject/topic links against the LIVE v3 curriculum so all gs
numbers are real. The build applies `scripts/career-index-overrides.json` on
top for the industry-review corrections (see R5) — the workbook stays the
source; rebuild after any workbook change. No SQL, no runtime fetch: the index
ships in the app. Career families are matched by exact name across the JSON and
`src/features/careerfinder/families.ts`; a rename in one place must be made in
both, or the build fails loudly.

## R3 — HONESTY CONTRACT (locked): exploration, not a verdict

No percentages, no aptitude/talent claims, no AI, no "best career". Explanations
are deterministic templates built from the family's dimensions and the user's
actual answers. "I don't know enough about this" is missing evidence, never a
low score. A profile-clarity label (Clear / Broad / Early — "Developing" was
renamed to avoid the school-rubric read) describes the answers, never grades the
person. Regulated professions (audiology, SLP, medical sonography, music
therapy, PE acoustics, law, defense) carry a plain statement that Academy study
is NOT a route to any licence or credential. A methodology page states what is
measured, what is not, the provisional weights, the source organizations (named
with an explicit no-endorsement / not-reviewed line), and a suggest-a-correction
path. A forbidden-claims test guards the copy (`test/careerFinder.test.ts`).

## R4 — THE 42 FAMILY DESCRIPTIONS ARE NEW COPY, AWAITING RATIFICATION

The owner directed ccode to write all 42 one-sentence family descriptions as
new copy (the workbook did not supply them). These, plus every question,
answer-scale, screen and template string that was NOT verbatim in the owner's
brief, are logged in `docs/APE_CAREER_FINDER_COPY_2026_09_04.md` for
ratification (mark ✅ / ✏️ / ❌). Until ratified they ship as written. The
brief's own copy ships verbatim.

## R5 — REVIEW CORRECTIONS APPLIED; SIX QUESTION REWORDINGS DEFERRED TO OWNER

Three specialist agents (product design, cognitive-learning/career-development,
audio-industry accuracy) reviewed the first build; all findings were applied
EXCEPT where the brief said "create these records exactly". Those exceptions —
six jargon/valence question rewordings and the midpoint label "Neutral" →
"Neither like nor dislike" — are NOT applied and are the owner's call (listed on
the copy sheet §4). Data corrections that WERE applied live in the overrides
file: 8 licensed-title flags, a Professional-Engineer note on 33 consulting
acoustics engineers, 3 sonar titles moved to Defense, craft-family preparation
defaults re-tabled, orientation/title-class fixes, and 106 rows demoted from
audio-core to audio-specialized (a row the workbook calls "closely related /
supporting" cannot also be audio-core). Family dimension fixes (Theatre
MS-first, Stagecraft BM-first, Instrument Building BM/CP/PC, Acoustic
Construction BM/AR/SD) resolved three pairs of families that were permanently
tied on identical dimension triples.

## R6 — EXPLORE ENTRY: A BUTTON BY "SUBJECTS" THAT OPENS A POPUP (iterated)

The entry point moved through the owner's live direction: a container between
the intro and SUBJECTS → collapsed-by-default card → moved above the curriculum
block → FINAL: a green `AUDIO CAREER FINDER · BETA` button to the right of the
amber "SUBJECTS" label, opening the green container as a popup (DimModal, so the
low-light wash still applies) with the START / CONTINUE / RESULTS button. The
entry routes by state to the right screen.

## R7 — NAVIGATION: HONEST BACK, QUIZ/RESULTS ALTERNATE BY REPLACE

Owner: "exit and return needs to be thought through better." Quiz and results
alternate at one stack depth via `navigation.replace` (finishing replaces the
quiz, so a swipe-back never lands on question 28). Every back-arrow is an honest
`goBack`; family screens return to their origin ("Back to results" / "Back to
all families"). "Change my answers" rewinds to question 1 and keeps the
completed state (answers save live; only Finish re-freezes). Change and reset
are now full-width buttons under a "CHANGE OR START OVER" heading — RESET & START
OVER is a red destructive button — because the muted text links were hard to
find on return (owner: "very hard to figure out how to reset and start over").

## Process note of record

The whole Career Finder feature was built and iterated under an explicit,
sustained owner go-ahead ("Begin", "make this really really nice", plus repeated
same-day change requests). This is the sanctioned counterpart to the 2026-08-16
overspend reprimand: acting at scale here was directed, not unilateral. Gate
held throughout — `tsc --noEmit` clean and `npm test` green (228 tests) before
every commit; each change verified in the 8090 web preview. On-device pass on
the phone build still owed (web preview proves bundle + mount + logic, not
device behaviour).
