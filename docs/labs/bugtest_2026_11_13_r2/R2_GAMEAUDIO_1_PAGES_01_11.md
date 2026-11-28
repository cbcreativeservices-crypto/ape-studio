# Round 2 bug test R2-GA1 — Game Audio Lab, pages 1 to 11 (2026-11-13)

Tester: R2-GA1. Own tab (tab-48) in the Browser pane, fronted while testing. 390 x 844, plus 375 x 667 and 320 x 700. Guest, `#labpreview/GameAudioLab`. **SOUND OFF throughout**: Sound Safety opened once from the SOUND key and was closed with KEEP SOUND OFF. I changed no source file and no storage, ran no git and no eas.
Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r2_ga1\`

**New bugs: S1 = 0 · S2 = 4 · S3 = 12.** Round-1 regressions: none. Of the 31 round-1 items: 17 FIXED, 5 PARTLY FIXED or BROKEN DIFFERENTLY, 7 STILL BROKEN (all S3), 1 NOT REPRODUCED, 1 HELD (server).

---

## 1. Round 1 re-check

| Round-1 ID | Status | Evidence (what I did → what I saw) |
|---|---|---|
| B-S1-01 p10 tray names the fault | **FIXED** | START THE FAULT → SOUNDS: row reads "A BED STARTS · ?" with "Switch SCENE on and take a few steps … Then this rule opens." No ✓. After 4 steps (BEDS 2→6, FAULT ×4) the row opens with "✓ ON EVERY UPDATE". See new bug R2-GA1-01 for what still points at it. |
| B-S1-02 p6 guide names the file | **FIXED** | Guide step 2 now reads "DOOR FILE sets which file name the door layer asks for. It stays locked until …". No file name. (But see R2-GA1-01: step 1 now says the "?" marks the fault.) |
| B-S1-03 hints before the symptom (p6, p7, p8, p10) | **FIXED** | SHOW A HINT pressed 3–4 times after START, before the symptom: one hint only, the symptom-level one ("First make the problem happen …"); the button then goes. After the symptom: all three hints. |
| B-S2-01 p1 goals latch in the unsafe order | **FIXED** | SCENE on at 70% → LEVEL 27% → ■ STOP: "✓ Set LEVEL low", "○ Then start the scene, with LEVEL already low", "✓ Stop". SCENE on again at 27%: goal 2 latches. |
| B-S2-02 p4 RHYTHM shows nothing | **FIXED** (S3 note) | RHYTHM: PLAYING 0 → 1 at 2.53 s (the stinger lands on the bar line) → 0 at 4.65 s. But VOICES reads 0/16 while PLAYING reads 1, against p2/p7's "VOICES counts the sound files they are playing" (R2-GA1-12). |
| B-S2-03 p4 RACING names an unseen SPEED | **BROKEN DIFFERENTLY** (S3) | Line now "The generator starts, then runs faster: its rings crowd closer." Both actions run in one tick: there is no slower moment to compare, and the picture matches HORROR's (generator at 40%) at phone size. `p04_racing_demo.png` vs `p04_horror_demo_same_picture.png`. |
| B-S2-04 p5 ALARM has no lamp | **FIXED** | New ALARM readout: SCENE + ALARM on → "ALARM −29 dB" (LEVEL 100%), LOCAL −8 dB (the fountain). |
| B-S2-05 p5 SOLO "SILENT" false for AMBIENCE | **FIXED** | AMBIENCE solo → ALARM "SILENT"; EFFECTS solo → AMBIENCE BED "SILENT", LOCAL −29 dB (after the 0.5 s bus fade), ALARM −29 dB; DIALOGUE / INTERFACE → all SILENT. `p05_effects_solo_alarm.png` |
| B-S2-06 cut labels/values at 320 | **FIXED** (readouts) | 320 x 700, pages 2–11: no readout or strip text with "…" or scrollWidth > clientWidth. Short keys are used: DIST., EARS, FILE, VARY, TAKE, YOU/GUIDE; strip WIND, LOOP. New dock problems at 320/375: R2-GA1-04, R2-GA1-10. |
| B-S2-07 glossary "Audio listener" 500 | **HELD** (server), changed | OPEN IN GLOSSARY now shows the opening of the entry plus "the full definition couldn't be loaded just now. Close the term and open it again to retry." No failed popup. `p01_glossary_audio_listener_teaser.jpg` |
| B-S2-08 p10 blank picture / CanvasKit abort | **NOT REPRODUCED** | I walked pages 1→11 with many controls, twice, plus resizes: p10 drew every time. Console: no CanvasKit abort, no Reanimated inline-style flood. One error only: the guest glossary 401. |
| B-S3-01 app stop printed twice as GAME | **FIXED** | Tab hidden at start → one line: "STOP · ALL SOUND, by the app: you left the app (or the app muted itself for safety) …". |
| B-S3-02 "Door · door · door_open.wav" | **STILL BROKEN** | p2, p6, p9: "START Door · door · door_open.wav → EFFECTS bus". |
| B-S3-03 rattle "1 s later" stamped at the door's time | **STILL BROKEN** | p2: "16.0s START Door · rattle, 1 s later" on the same line-time as the door. VOICES also counts it at once (2/16 straight after the press). |
| B-S3-04 MIX tag on settings | **STILL** (now documented) | "27.4s MIX SETTING door rattle layer: OFF", "MIX SETTING courtyard wind file: RAW CUT". The p9 guide now says "Each change in SETUP prints a MIX line". |
| B-S3-05 p4 each pick restarts the log clock | **STILL BROKEN** | After minutes on p4, EDUCATIONAL → log "0.0s START Overheat alarm …", earlier lines gone (`runDemo` dispatches `enterPage`, which sets `tPage`). |
| B-S3-06 ACTION / SPORTS timing | **PARTLY FIXED** | SPORTS line no longer says "then". ACTION: "Twelve crate impacts in 0.3 s" while PLAYING/VOICES read 12/12 at 85 ms, then 11, 8, 5, 3, 0 by 1.28 s. |
| B-S3-07 p11 heading twice | **FIXED** as asked | p11 eyebrow is now "QUESTION", as on p6–10. Pages 6–11 still print "CHECK YOURSELF" with "QUESTION" under it; pages 1–5 print "CHECK YOURSELF" only. |
| B-S3-08 YOU walks into the fountain | **STILL BROKEN** | p11: from the north-west corner, FACING 90°, 5 steps east: YOU is drawn on top of the basin, with no NOTE in the log. The guide says a wall, the door or the edge stops you "and a NOTE in the log says why". `p11_you_on_fountain.png` |
| B-S3-09 p11 "straight behind" with PAN 4% | **FIXED** | FACING 250°: "almost straight behind (177° to your left)", PAN LEFT 4%. When VIRTUAL: readout PAN "—", card "none: not played (VIRTUAL)". |
| B-S3-10 FIXED without proof (p7, p8) | **FIXED** | p7: flip to STOP ITS LOOP + ■ STOP → card stays active; add → on → remove (PLAYING 1→0) → "✓ FIXED". p8: SCOPE back to FOR EACH CHARACTER → still active; STEP: GUIDE → FIXED. (p10 does not follow the rule: R2-GA1-09.) |
| B-S3-11 p7 START ticks the wrong rule | **FIXED** (tick) | After START the rule row is locked: "WHEN A GENERATOR IS REMOVED · ?" and "Remove a running generator 2 first …". See R2-GA1-01. |
| B-S3-12 contents open: labels collide | **FIXED** | p2 with the contents open: FOUNTAIN, DOOR OPEN, YOU, CRATE and GENERATOR 1 are clear of each other. `contents_open_p02.jpg` |
| B-S3-13 p3 TV vs SOUNDBAR pictures | **PARTLY FIXED** | The soundbar is now a 5 x 32 box with 5 dots. The TV is still two dots on an edge-on screen. Both keep the same L/R rays and labels, so they are hard to tell apart at phone size. `p03_tv_strip.png`, `p03_soundbar_strip.png` |
| B-S3-14 p1 bird: no GAME line, no strip row | **PARTLY FIXED** | The log is now one line: "START Bird · call take 2 of 3 → AMBIENCE bus … · 5 calls so far". The strip still has three rows (WIND, FOUNTAIN, ROOM TONE) while PLAYING reads 4. |
| B-S3-15 p7 tray band after REMOVE | **STILL BROKEN** | After REMOVE GENERATOR 2 the GENERATORS tray has a 50 px empty child between its title (top 482) and its first row (top 562). DOM: a `flexGrow:1` view with `marginTop`. `p07_tray_gap_after_remove.jpg` |
| B-S3-16 guide step 1 lights the display but talks about the log/cards | **PARTLY FIXED** | p6 step 1 now describes the strip ("The strip under the picture follows the chain …"). p1 step 1 still ends with "The activity log lists each request …" while only the display is lit. |
| B-S3-17 FIT puts YOU off screen | **FIXED** | p11 FULL SCREEN → FIT: YOU is at the left edge, visible. The 1× chip no longer stays outlined. `p11_fullscreen_fit.jpg` |
| B-S3-18 sliders have no keyboard | **STILL BROKEN** | The LEVEL slider is `role=slider`, `aria-valuenow=100`, `tabIndex=-1`: it cannot be focused. |
| B-S3-19 console flood | **FIXED** | There are no Reanimated warnings. The Skia `SkPath.*` deprecation warnings remain, once each. |
| B-S3-20 p7 intro card rises over the open tray | **FIXED** | p7's intro (`i16gc7fs`, unseen at the start). I opened GENERATORS 54 ms after arriving: no card over the tray, none after I closed it 2 s later, and it was not marked seen (introHold "drop"). `p07_tray_open_no_intro_card.jpg` |

---

## 2. New bugs

### R2-GA1-01 · pages 6, 7, 8, 10 · S2 — after START THE FAULT, the screen still points at the planted fault before the symptom
Steps (p6, clean open): step 4 → START THE FAULT. Do not press the door key.
Expected: the card's own words: "The fault is now active. Nothing on this page names it yet."
What happened:
- The only things on the whole screen that change are the DOOR FILE readout ("FOUND" → "?") and the DOOR FILE dock key (→ "LOCKED", reason "Press the door key first and read the log. Then DOOR FILE opens."). The broken link is singled out before the door is pressed. `p06_fault_started_doorfile_question_locked.jpg`
- The guide says so outright. p6 step 1: "DOOR FILE shows FOUND or MISSING, and a question mark while a fault you started has not been found yet." p7 step 2 and p10 step 2: "While a fault you started has not shown itself, the row reads ? instead."
- The same happens on the other three pages:
  - p7: the rule row becomes "WHEN A GENERATOR IS REMOVED · ?" (locked).
  - p8: the SCOPE key becomes "?" and LOCKED.
  - p10: the SOUNDS tray shows "A BED STARTS · ?" (locked).
- On p10 the lesson itself names the cause, directly above the card. Step 3 says "… start the fault on the TROUBLESHOOT card", then the note "A COMMON MISTAKE: Starting a background loop again on every position update in one area. The copies stack, get louder and use voices." That is the planted fault in words. p8 does the same: "Setting a switch for everyone when it belongs to one character."

Cause: `pages\p06Pipeline.tsx:88` (fileWord '?') and `:106` (locked); `p07Instances.tsx:64-66`; `p08GameSyncs.tsx:184-197`; `p10Loops.tsx:67-69`; guides `p06.ts:15`, `p07.ts` (control step 4), `p10.ts:20`; the notes at `p10Loops.tsx:221` and `p08GameSyncs.tsx:252`.
Smallest fix: while unnamed, keep the setting looking as it did before START, without "?" or LOCKED: show the old value and let the chooser open. Or lock every chain setting on the page the same way, so none stands out. Drop the "? while a fault you started …" sentences from the guides. Move the p8/p10 "common mistake" notes below the card, or show them only after FIXED.

### R2-GA1-02 · page 4 · S2 — guide and check feedback say the camera puts the generator "nearer the center"; at the page's own opening facing it goes farther
Steps: open p4 (YOU FACE 90°) → GEN PAN reads "L 25%". Open LISTENER and choose OVERHEAD CAMERA.
Expected (guide step 3): "From the camera the generator sits nearer the center, because the camera is high above the scene." The check's wrong-answer feedback says the same: "They sit less far to the side, because the camera is high above them."
What happened: GEN PAN goes from "L 25%" to "R 55%": farther from the center, and on the other side. It is only nearer at facings such as 0° (the TRY THIS facing).
Evidence: `p04_camera_listener_tray.jpg` (CAMERA, R 55%); the readout values above.
Cause: `pages\guides\p04.ts` (changes step 2) and the `p04Games.tsx` check feedback. The text describes the 0° case as if it were general.
Fix: say what is always true, for example "From the camera, left and right follow the picture, not the way you face, so FACING no longer changes GEN PAN." Or open the page at FACING 0°.

### R2-GA1-03 · page 9 · S2 — the "last eight takes" strip forgets footsteps whenever the door plays
Steps: p9 → STEP ×16 (the strip is full: "4/4 2/4 1/4 4/4 4/4 2/4 3/4 2/4") → OPEN DOOR, CLOSE DOOR, OPEN DOOR, CLOSE DOOR.
Expected: the eight newest footstep takes stay. The lesson says "The strip under the picture shows the last eight takes", and step 3 asks for door presses right after stepping.
What happened: each door press blanks one more slot. After 4 presses the strip reads "· · · · · · · 2/4", while LAST TAKE still says 2.
Cause: `model\gaModel.ts:969-981` pushes every layer's take (the door's 1-of-1 too) into `recentTakes` and trims to GA_TAKES_MAX. `scene\hud\aModel.ts:592` filters `of > 1` only after that trim.
Fix: push only when `list.length > 1`, or filter before the trim.

### R2-GA1-04 · shared dock, pages 9 and 10 at 320 wide · S2 — keys under the 44 pt touch target
Steps: 320 x 700, open p10. Measure the dock keys.
Expected (round-2 brief, `dockFit.ts` DOCK_MIN_KEY_W = 44): six keys on one row, each at least 44 wide.
What happened: p10 FACING 45, **STEP 33**, SOUNDS 54, WIND FILE 60, SOUND 52, **■ STOP 40**. p9 **LEVEL 43, STEP 43**, OPEN DOOR 57, SETUP 47, SOUND 52, **■ STOP 43**. (p8's six keys are 46–52, fine.) Text is 12 px. `w320_p10_dock_step_33px.png`
Cause: `rack\dockFit.ts:190-191`. When the needs fit (`wrap` false), `across()` takes `dockKeyWidths` as it is. Its proportional branch (`:130`) shrinks a short-worded key such as STEP below 44, and the 44 floor is only checked on the tight path (`:210`).
Fix: apply `Math.max(DOCK_MIN_KEY_W, …)` in `across()`, taking the difference from the widest keys, before returning the one-row result.

### R2-GA1-05 · page 10 · S3 — FIXED appears after ■ STOP alone, without proving the repair
Steps: p10 → START THE FAULT → SCENE on → 4 steps (BEDS 6) → SOUNDS: ONCE, WITH THE SCENE → ■ STOP.
Expected: as on p6–p8 since B-S3-10, FIXED only after a proof, such as SCENE on again and a few steps with BEDS staying at 2. Hint 3 asks for exactly that: "■ STOP silences everything, then switch SCENE on again."
What happened: "✓ FIXED" appears the moment ■ STOP empties the beds (BEDS 0).
Cause: `p10Loops.tsx:197`: `fixed={pileSeen && !bedPileUp && beds.room <= 1 && beds.yard <= 1}`.
Fix: require a step taken with the scene on after the rule was corrected (useCountWhen on the step count), as p8 does.

(R2-GA1-05 to R2-GA1-16 are S3.)

### R2-GA1-06 · page 4 · S3 — a goal latches from a demonstration
Steps: p4 → GAMES → STRATEGY.
What happened: "✓ Listen from the overhead camera" latches. The learner never used the LISTENER tray.
Cause: `p04Games.tsx:143` counts `listener:camera` from any source.
Fix: count it only when the camera is chosen in the LISTENER tray, or while no demonstration is running.

### R2-GA1-07 · page 4 · S3 — OPEN WORLD: GEN PAN shows a pan for a generator that is not played
Steps: GAMES → OPEN WORLD.
What happened: GEN PAN "L 17%", while the line says the generator is "tracked, not played". Page 11 shows "—" in this case.
Evidence: `p04_openworld_genpan_for_virtual.png`
Fix: print "—" while the generator is VIRTUAL, as p11 does.

### R2-GA1-08 · page 11 (also p4 OPEN WORLD) · S3 — YOU is cut by the picture edge, and labels pile up in the corner
Steps: p11 → FACING 250°, walk to VIRTUAL → FACING 0°, walk to the edge.
What happened: at the top-left corner, "YOU" and "BEHIND YOU" overlap and the YOU token is half outside the picture. At 320 wide, "BEHIND YOU", "YOU", "MIN 1.5 m" and "FOUNTAIN" pile up around the fountain.
Evidence: `p11_corner_labels_overlap.png`, `w320_p11_labels_collide.jpg`

### R2-GA1-09 · page 9 at 375 x 667 · S3 — the dock's OPEN DOOR key reads "OPEN D…" for about 1.8 s on every arrival
Steps: 375 x 667, from page 10 → PREV to p9 (or pick p9 from the page list). Read the dock.
What happened: the key's text is 12 px in a 47 px box ("OPEN D…") for 1.81–1.88 s, measured three times. It then shrinks to 9 px and fits. On page 8 → 9 by the page list it is sometimes cut too.
Evidence: `w375_p09_open_door_cut.png`
Cause: the shrink-to-fit in DockButton runs late (after a measurement or runSoon). On a phone this happens on every visit.

### R2-GA1-10 · page 9 · S3 — the takes strip and LAST TAKE disagree after door presses
This is the visible half of R2-GA1-03: LAST TAKE "2" while the strip shows only one take. It is fixed by the same change.

### R2-GA1-11 · page 6 · S3 — before the fault is started, DOOR FILE already gives away its answer
Steps: p6, no fault → open DOOR FILE.
What happened: the option `door_open_v2.wav` reads "… No file with that name is in the build." A learner who opens it first solves the card before starting it.
Fix: give that option a neutral blurb ("a newer file name") until the fault has been met.

### R2-GA1-12 · page 4 RHYTHM · S3 — PLAYING 1 while VOICES 0
Steps: GAMES → RHYTHM. Watch the readouts for 5 s.
What happened: at 2.53 s PLAYING reads 1 and VOICES reads 0/16. The music stinger counts as an instance but uses no voice (music is not counted, a HELD item). This goes against "VOICES counts the sound files they are playing" (p2 guide, p7 lesson).
Fix: count the stinger's voice, or add a word to the line ("music is not counted in VOICES here").

### R2-GA1-13 · page 4 RACING · S3 — see the B-S2-03 row above
The line promises a change ("then runs faster … crowd closer") that the learner cannot see: no before-state, and the picture is the same as HORROR at 40%.
Fix: dispatch the speed change after a short delay (for example 1.5 s), or reword to "runs fast: its rings crowd close".

### R2-GA1-14 · all pages (web preview) · S3 — the guest reminder fell back to a native `window.confirm`
Console: "Page dialog suppressed (confirm): 'You’re not signed in … Close the app first and it’s erased.'" `lib\confirm.ts:109-110` falls back to `window.confirm` when the AppDialog host is not mounted. This is probably preview-only (`#labpreview` may not mount the host), but it is a raw platform dialog. Check that the real app route mounts the host before GuestStartReminder can fire.

### R2-GA1-15 · credit (code) · S3 — `tr_game_audio` is reported correctly; one hardening point
Read in `kit\PagedLab.tsx:251-258, 311-318`, `features\lab\labCompletion.ts:517-580`, `features\lab\pagedProgress.ts:25-30`.
- It reports only when `progress.completed.length >= 22`. GA appends no check page, so `pagesWithCheck.length` = 22.
- It is reported "once" in effect: the effect re-runs on every visit to a finished lab, but `recordUnit` returns early when `set.has(unitId)`. In a members-only preview `markLabUnit` returns at `getLabPreview().active`.
- Hardening point: `allDone` counts the entries, not the page indexes, and `cleanCompleted` keeps any non-negative integer. A stored list with an index ≥ 22 (an older layout or a corrupt copy) plus 21 real pages would report the credit with one page not done.
- Fix: `completed.filter(i => i < pagesWithCheck.length).length`, or check `every(i => completed.includes(i))`.

### R2-GA1-16 · log wording · S3 — the learner's own ■ STOP is logged as a GAME request
p1, p10: pressing ■ STOP prints "GAME · STOP ALL: every instance is stopped …". GAME means "what the game asked for", and the app's own stop now says "by the app". A learner's stop could read "STOP · ALL SOUND, by you (■ STOP)".

---

## 3. Control table (new in round 2, or tested differently)

| Page | Control | Purpose | Result | What I saw |
|---|---|---|---|---|
| shared | SOUND (off → on) | ask for sound | PASS | Sound Safety opened; KEEP SOUND OFF; SOUND stays OFF |
| shared | SOUND (on → off) | switch sound off | NOT TESTED on screen; code PASS | `GaLab.tsx:257-259` calls `disableSound` → `useGaSound.ts:141-151` stops all, shuts the output, readout → OFF |
| shared | ⓘ guide, pages 1–11 | explain the screen | PASS (S2/S3 above) | walked all 5 steps on every page; first tap on p1 right after Sound Safety did nothing, second opened it |
| shared | page list (contents) | jump to a page | PASS | every page 2–11 reached by the list; scene clean on arrival; a fault left mid-way is gone on return (p6) |
| shared | NEXT / PREV | move | PASS | — |
| shared | FULL SCREEN / FIT / ✕ | big view | PASS | p11 FIT shows YOU; p4 GAMES tray inside full screen: the dock lifts above the tray, all 12 chips reachable |
| shared | dock at 320 | one row, ≥ 44, ≥ 9 pt | FAIL | R2-GA1-04 |
| shared | tray titles at 320 | title never cut | PASS | 16 trays on p3–p11: no cut text, no "…" |
| shared | readouts at 320 / 375 | label whole, short or gone | PASS | no "…" in any readout or strip on p2–p11 |
| shared | first-visit intro vs open tray | card waits | PASS (branch "tray first") | B-S3-20 row |
| shared | console | — | PASS | only the guest glossary 401 and the Skia deprecation warnings |
| 1 | LEVEL, SCENE, ■ STOP, goals, check, guide | safe order | PASS | B-S2-01 row |
| 2 | SPEED (off and on), OPEN/CLOSE DOOR (double tap), GEN 1, check | event vs parameter | PASS | "PARAMETER speed = 87% on GENERATOR 1 (it is not running)"; the same instance i70 while running |
| 3 | 7 PLATFORM cards, 5 LISTENING setups, BUDGET nudges, 2 checks | — | PASS | key "7 SEEN", strip per setup, VOICES 0/8 ↔ 0/16 |
| 4 | 12 GAMES, LISTENER tray, FACING, 2 checks | — | PASS except R2-GA1-02, -06, -07, -12, -13 | each line checked against readouts and picture |
| 5 | PLAY ×7, SOLO ×5, ALARM readout, check | — | PASS | each kind lights its cell (STEP MOVEMENT −1 dB, door ACTIONS −6, CRATE IMPACTS −5, GUIDE DIALOGUE 0 and beds ducked −8 → −16, INTERFACE −4) |
| 6 | door, DOOR FILE, fault, hints, check | — | PASS except R2-GA1-01, -11 | — |
| 7 | GENERATORS, SPEED 1/2, fault, check | — | PASS except R2-GA1-01; B-S3-15 | — |
| 8 | STEP tray, SPEED + generator chooser, MOOD, SCOPE, fault, check | — | PASS except R2-GA1-01 | GUIDE FLOOR stays WOOD until the symptom, then "COPIED FROM YOU" |
| 9 | STEP, door, SETUP ×3, 2 checks | — | PASS except R2-GA1-03 | OFF 1,1,1,1; ON 14 steps with no repeat; AVOID REPEAT OFF repeats (3,3,3) |
| 10 | SOUNDS, STEP, FACING, WIND FILE, fault, 2 checks | — | PASS except R2-GA1-01, -05 | 2 ZONE lines; RAW CUT "JUMPS 1" at 9.7 s |
| 11 | SOURCES, FACING, STEP, check | — | PASS except B-S3-08, R2-GA1-08 | VIRTUAL reached facing 250° (12.3 m) and again from the north edge; "back in range: played again" |

---

## 4. Not tested, and why
- **Anything heard; SOUND on → off on screen.** Both need the Sound Safety acknowledgment, which is the owner's. Read in code instead (table above).
- **Intro card branch "card already up, then a tray opens".** The only unseen intro in my slice (p7) was used for the "tray first" branch. Opening ⓘ on p7 later marked it seen (by design: `open()` claims the offer). No unseen card was left to raise, and I may not edit storage.
- **The members gate** (Home → OPEN LABS → Game Audio · 1 Lab) and `tr_game_audio` on a real account. Not in my slice beyond the code read (R2-GA1-15).
- **Reduce motion on screen.** It cannot be switched in the preview; round 1's code read still stands.
- **A real phone.** Web preview only. Some web-only points (R2-GA1-09, R2-GA1-14) may differ on a phone.
- **Long text, undo/redo.** Pages 1–11 have no text field and no undo.
