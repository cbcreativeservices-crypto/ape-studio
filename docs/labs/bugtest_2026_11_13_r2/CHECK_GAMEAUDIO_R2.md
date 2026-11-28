# CHECK R2-GA: independent check of the round-2 Game Audio Lab fixes (2026-11-13)

**Checker:** independent, read-only plus temporary mutations.
**What I read:** `FIX_GAMEAUDIO_R2.md`, both R2 bug reports, and `git diff -- src/screens/lab/gameaudio test`. I also read `kit/PagedLab.tsx`, `features/lab/pagedProgress.ts` and `features/lab/trainingCompletion.ts` for the credit.
**Limits I kept:**
- No git writes, no eas, no servers, no package.json.
- Nothing in `rack/` or Stage Plot was touched.
- No browser storage was written. Sound stayed OFF: Sound Safety never appeared.
- I used my own tab (tab-57) at 390×844, 375×667 and 320×700. I reset the viewport and closed the tab at the end.
- The preview re-mounted to page 1 twice while I worked (other people's saves). Every result below was taken after I confirmed the page number.

## Results

| Check | Result |
|---|---|
| Tests: `node --test --test-timeout=120000 test/gameAudio*.test.ts test/labRegistration_20261113.test.ts test/screenGuide_gameaudio_20261112.test.ts` | **792 tests, 792 pass, 0 fail** (4.1 s) |
| `npx tsc --noEmit -p .` | **exit 0, no output** |
| Mutations | 55 applied one at a time, each restored. The `git diff -- src/screens/lab/gameaudio` hash was the same before and after (`00ae358b…ee97`). **49 caught, 6 not caught** (table below). |

## Ways I broke it (ranked)

### C-1 · S3 · pages 6, 7, 8, 10 and p19 fault 5: a second round of the same fault on one visit reads FIXED without the proof
Each page's proof is latched once per visit. The latches are:
- `p06Pipeline.tsx:74` `repairedSinceStart`
- `p07Instances.tsx:103` `repaired`
- `p08GameSyncs.tsx:148` `repaired`
- `p10Loops.tsx:136` `proved`
- `gaFaults.ts:310` `proved`, a count that never resets

After the first FIXED, the learner can set the wrong value again by hand. The card then goes active again, and the next repair reads FIXED with no re-test: exactly the B-S3-10 / R2-GA1-05 / R2-GA2-01 behaviour the round fixed. Seen on screen at 390:
- **p7:** START → add, on, remove → STOP ITS LOOP → ■ STOP → add, on, remove → ✓ FIXED (correct). Then LEAVE IT PLAYING → add, on, remove (PLAYING 1) → STOP ITS LOOP → **■ STOP → ✓ FIXED**, with no removal tested.
- **p10:** first round correct (fix → STEP 4 beds still → ■ STOP → SCENE on, BEDS 2 → STEP → FIXED). Then ON EVERY UPDATE → STEP ×2 (BEDS 3, active) → ONCE, WITH THE SCENE → **■ STOP → BEDS 0, ✓ FIXED**.
- **p6:** after FIXED, door_open_v2.wav → CLOSE DOOR (symptom, active) → door_open.wav → **✓ FIXED with no door press**.
- **p19 fault 5:** after FIXED 1, FIX ▸ LEAVE IT PLAYING → add, on, remove (orphan) → FIX ▸ STOP ITS LOOP → **■ STOP → FAULTS 0**. The FIXED counter stays at 1, so no extra count is earned, but the card closes without the re-test.

Severity is S3: the first, real FIXED was earned properly, and no credit is gained.
**Smallest fix:** count the proof only after the newest symptom. Keep the symptom count at which the proof was taken, for example `useCountWhen(..., ok && count > provedAtSymptom)`. In `benchAdvance`, reset `proved` to 0 whenever `symptomCount(orphan) > 0`.

### C-2 · S3 · pages 8 and 10: the "common mistake" note still names the cause before the symptom
The notes moved below the card (`p08GameSyncs.tsx:260`, `p10Loops.tsx:229`). They are still always rendered, one scroll under the card:
- p10: "Starting a background loop again on every position update in one area…"
- p8: "Setting a switch for everyone when it belongs to one character…"

Steps: clean open of p10 → START THE FAULT → scroll a little past the card. The cause is in words while the card says "Nothing on this page names it yet." The tester's brief offered "below the card", but the owner's rule ("nothing on screen points at it before the symptom") is not met.
**Smallest fix:** render each note only when `!unnamed` (or once `pileSeen` / `wrongSeen`), or only after FIXED.

### C-3 · S3 · p7 and p19: ADD GENERATOR 2 refused over an orphan gives no feedback where it is pressed
p7: START → add, on, remove (orphan) → in the still-open GENERATORS tray press ADD GENERATOR 2.
- The tray does not change at all.
- The REFUSED line goes only into the activity log under the card, which the tray covers ("stays open").
- p19's TEST tray behaves the same way.

The learner sees a dead button. Model: `gaModel.ts:1507-1511`. Trays: `p07Instances.tsx:64`, `p19Testing.tsx:102`.
**Smallest fix:** while a stray loop owns `generator-2`, show a one-line TrayNote in place of (or under) the chip, for example "GENERATOR 2's old loop still plays: ■ STOP first". The chip could also read `ADD GENERATOR 2 · ■ STOP FIRST`.

### C-4 · S3 (design question for the owner) · p6: during the concealment the readout and its spoken label state something false
Between START and the symptom:
- DOOR FILE reads FOUND.
- Its accessibility label says "the door event asks for door_open.wav and door_close.wav, which are in the build".
- Guide p06 (seeing step 3) defines DOOR FILE as "whether the build holds the file the door layer asks for".

All three are false at that moment (`p06Pipeline.tsx:92-95`). This is the chosen trade-off: show the pre-START value. p7, p8 and p10 do the same with their rule rows. It is not a leak. I report it so the owner knowingly accepts a deliberately false readout and screen-reader sentence.
**Alternative:** use neutral wording during the concealment. For example, the a11y label could say "the door layer asks for its file by name; press the door key to test it", keeping the visible word as is.

### C-5 · S3 (wording) · the new short key "PLAY"
At 320 on every page, and at 375 on p8, the PLAYING readout reads **PLAY 0**. This reads like a command or button, not a count, and it is next to SND. The lesson and guide words ("PLAYING reads 1 when it lands", "PLAYING counts…") then name a key that is not on screen.
**Suggestion:** a short key that is not a verb, for example "INST." (the readout counts instances), or "PLAYS".

## What held (tried and not broken)

### Planted faults (390)
- **p6, clean open, START:** the only on-screen change is the card's own line plus SHOW A HINT. DOOR FILE reads FOUND, the chooser opens on ● door_open.wav with the neutral blurb, and the chain cards say "door asks for door_open.wav". The full page text was diffed before and after.
- **p6, picking the shown value:** no change. Then OPEN DOOR → MISSING, the chooser updates live to ● v2 with the full blurb, the goal "Break the chain" is ✓, door_open.wav → FOUND, CLOSE DOOR → ✓ FIXED.
- **p6, other value first:** START → pick v2 → MISSING (the learner's own choice), card still "Nothing … names it" → door → active "Find its cause". ■ STOP mid-fault: no change.
- **p6, leave and return:** going to p7 and back gives FOUND and START THE FAULT again (a clean scene).
- **p7, p8, p10:** a whole-page text diff at START shows only the card line. The rule rows show ✓ STOP ITS LOOP, ✓ ONCE, WITH THE SCENE and SCOPE LOCAL, and switch live to the real value right after the symptom.
  - Picking ✓ STOP ITS LOOP (the shown value) changed nothing.
  - FULL SCREEN on p7 mid-fault keeps the concealment, in the tray and on the card.
- **p10 proof:** fix → STEP with copies stacked: not fixed. ■ STOP: not fixed. SCENE on (BEDS 2): not fixed. STEP: ✓ FIXED.
- **START twice:** START only shows while the card is idle (`bits.tsx:255`). A re-START after a pre-symptom revert records the current value, so it is clean.

### p19 fault 5 (390)
- ADD over the orphan is refused (FAULTS 1, FIXED 0).
- **Odd order:** ■ STOP with the rule still wrong → FAULTS 1. Fix the rule → FAULTS 1. ADD → GENERATOR 2 · OFF (comes in OFF). REMOVE while OFF → still FAULTS 1. ADD, on, REMOVE → **FAULTS 0, FIXED 1**.

### Other fixes
- **p14 stinger goal:** CHANGE AT ▸ NOW + STINGER: "STINGER played immediately" and the goal stays ○. NEXT BEAT + STINGER: ○ while it waits, then ✓ after the beat.
- **p9 strip:** STEP ×16, then 4 door presses. The strip's label lists the same 8 takes before and after, and LAST TAKE stays 4.
- **p4:**
  - GEN PAN reads "—" at page open, under STRATEGY and under OPEN WORLD (VIRTUAL).
  - STRATEGY leaves the camera goal ○.
  - LISTENER ▸ OVERHEAD CAMERA latches it (GEN PAN R 55%); YOUR EARS → "—" again.
  - The camera's "high above" reason is true to the model (`GA_CAMERA_HEIGHT = 6`, used by `stereoPan`).
- **p12:** the wall title shows a visible gap: "IF GEN 1 PLAYED" (zoomed at 390).
- **Narrow keys:** a scan of the readout row on pages 2–22 found no cut and no "…" on any page, at 320×700 or at 375×667 (page-open state).
  - At 320: PLAY / SND everywhere.
  - At 375: VARY / TAKE on p9.
  - ZONE is dropped beside COURTYARD on p10 at 320 (house rule D36).
- **Credit:** `optionalPage={noPageOptional}` makes `allDone` = `pagesWithCheck.every(i => completed.includes(i))`, so every index 0…21 (and the check page, if one is ever authored) is required.
  - A stray stored index such as 22 or 99, or a duplicate, cannot stand in for a missing page.
  - `labComplete` reads `allDone(progress.completed)`, never the stored `done` flag.
  - All 22 GA pages are `manualDone`, so NEXT alone marks nothing.
  - `trainingCompletion.ts` has no GA backfill from the stored `done` flag.
  - Residual, not GA's: a stored `done: true` from the old rule is never cleared (`pagedProgress.ts:92`), but nothing reads it for `tr_game_audio`.
- **Text fixes:** what each page shows matches what it says on p12 (title), p14 (strip label), p17 (both voices protected, matching HELD: 2 PROTECTED), p21 (sounds are built on first use and cached: `gaSoundBank.ts:16`) and p20 (SIMPLIFIED below 360). I verified p15 and p22 only through the source and the mutations.

## Mutation table
Each mutation was applied alone; then the test set ran; then the original bytes were restored and the hash checked. All 55 restores were confirmed. Script: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\ga_mut\mutate.mjs`, raw results in `mut_results.json` beside it.

### NOT CAUGHT (no test fails)
| # | Fix undone | File | Effect if it regressed |
|---|---|---|---|
| M03 | p6 START records the planted value: `plant.start(missing)` → `plant.start(true)` | p06Pipeline.tsx:155 | DOOR FILE reads **MISSING** in red the moment START is pressed: the whole R2-GA1-01 leak is back on p6 |
| M04 | p6 shown value = real value: `shownMissing = plant.shown` → `missing` | p06Pipeline.tsx:77 | Same: readout, key and chooser name the fault at START |
| M07 | p8 SCOPE shows the real scope: `shownGlobal = plant.shown` → `global` | p08GameSyncs.tsx:143 | SCOPE reads **GLOBAL** at START: the p8 leak is back |
| M19 | fault 5 proof counts a removal made with the rule still wrong (drop `!faultSet(id, next)`) | gaFaults.ts:310 | The test "a removal tested with the rule still wrong proves nothing" still passes: the wrong-rule removal makes an orphan, not a `cleanRemove`, so this guard is never exercised. Low risk, but the guard is untested. |
| M25 | narrow orphan slot keeps its priority number | scene/hud/cVoices.tsx:90 | "HUM…" is cut again (R2-GA2-08) |
| M52 | p10 hint 3 loses "take a step: BEDS stays at 2" | p10Loops.tsx:223 | The hint no longer asks for the proof that FIXED now needs |

M03, M04 and M07 matter most. The R2-GA1-01 tests check `plant.shown` on the p7 and p10 rows, the chooser, the chain cards and the absence of "?" and locks. Nothing pins the p6 readout and key line (`shownMissing`), the p8 `shownGlobal` line, or the value passed to `start()`.
**Smallest fix:** a test that asserts `const shownMissing = plant.shown;`, `const shownGlobal = plant.shown;` and that each `onStart` calls `plant.start(<the current value>)` before planting. Better, a rendered or pure test: START, then the readout word equals the pre-START word.

### CAUGHT (49)
M01 concealment off · M02 picking the shown value applies · M05 v2 blurb · M06 p7 row · M08 p10 row · M09 / M10 notes back above the card · M11 / M12 guide "?" sentences · M13 / M14 p10 proof · M15 recentTakes trim · M16 / M17 addMachine adopt / ON · M18 faultOpen re-test · M20 / M21 stingerOnLine · M22 bModel wording · M23 bLines cross · M24 p17 explain · M26 / M27 p21 text · M28 SIMPLIFIED · M29 wall spaces · M30 door label · M31 "level zero level" · M32 "1 second" · M33 camera goal · M34 / M35 GEN PAN "—" · M36–M38 p4 camera wording · M39 / M40 RACING / RHYTHM · M41 / M42 credit `optionalPage` · M43 / M44 B-S3-02 / -03 · M45 / M46 keepClock · M47 / M48 PLAY / SND · M49 kNarrow passed on · M50 / M51 p19 hint / guide · M53 p6 chain cards · M54 / M55 locks back

Most of these are source-text (regex) tests. They catch a revert of the exact line but not an equivalent regression written differently. The behaviour holes C-1 and C-3 are not covered by any test.
