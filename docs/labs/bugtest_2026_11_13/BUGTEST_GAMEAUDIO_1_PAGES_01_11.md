# Bug test GA1 — Game Audio Lab, pages 1 to 11 (2026-11-13)

Tester: GA1. Own tab (tab-31), 390 x 844 (and 320 x 700 for the narrow checks), guest, **SOUND OFF throughout** (Sound Safety opened once from the SOUND key and was closed with KEEP SOUND OFF). No source file, storage or server was touched.
Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\bugtest_ga1\` (27 captures, names below).

**Counts: S1 = 3 · S2 = 8 · S3 = 20.**

---

## 1. Screens and controls

| Page | Control | Purpose | Result | What I saw |
|---|---|---|---|---|
| shared | SOUND key (off → on) | ask for sound | PASS | opens Sound Safety; KEEP SOUND OFF closes it, SOUND stays OFF |
| shared | SOUND key (on → off) | switch sound off | NOT TESTED | needs the Safety acknowledgment (forbidden) |
| shared | ■ STOP | stop everything | PASS | PLAYING → 0, log "STOP ALL" on every page tried (1, 2, 7, 10) |
| shared | PLAYING / VOICES / SOUND | what sounds now | PASS (S3 notes) | agree with picture and log; VIRTUAL counted as playing (by design) |
| shared | Activity log | requests and answers | PASS with S3 | times since page open; filtered logs say what they show (p3, p8, p10, p11); doubled words "Door · door · door_open.wav"; STOP ALL printed twice when the app is left (B-S3-01) |
| shared | WORDS ON THIS SCREEN chips | show the meaning | PASS | definition opens under the chips |
| shared | OPEN IN GLOSSARY | full entry | FAIL | "Audio listener" → server 500, popup "Couldn't load this term" (B-S2-07); "Game audio" shows a teaser, full text 401 for a guest |
| shared | Screen guide (ⓘ) | explain the screen | PASS with faults | 5 steps; step 1 lights the display, step 2 the dock; p6 guide names the planted fault (B-S1-02); p6 step 1 names the lesson cards while lighting the display |
| shared | Page list / NEXT / PREV / contents | move between pages | PASS | finished page reopened: "You finished this page before, and that is kept." Contents open: picture shrinks, labels collide (B-S3-12) |
| shared | HIDE DISPLAY / FULL SCREEN / zoom chips | reading / big view | PASS (S3) | controls stay docked, readouts on top; FIT centres on the middle, YOU off screen (B-S3-17) |
| shared | Browser BACK | — | PASS | stays on the page, no crash |
| shared | Goal chips | latch only when it happened | PASS except p1 order (B-S2-01) | |
| 1 | LEVEL fader | lab level | PASS | 70 % −3 dB → 31 % −10 dB → 98 % 0 dB; strip marker and bars move (−18 dB at 31 %, −8 dB at 98 %) |
| 1 | SCENE | background on/off | PASS | 3 START lines, PLAYING 3 (4 with a bird), room tone ZERO |
| 1 | strip (level bars) | level per scene sound | PASS (S3) | no row for the bird while PLAYING reads 4 |
| 1 | check | | PASS | wrong answer explained, right latches |
| 2 | SPEED | parameter on the generator | PASS | 0–100 % reachable; kept while off ("it is not running"); rings denser at 100 % |
| 2 | OPEN/CLOSE DOOR | door event | PASS | TRIGGER + EVENT + 2 START; door closed turns generator rings green |
| 2 | GEN 1 | start/stop generator | PASS | |
| 2 | double tap door | | PASS | two takes, consistent log |
| 3 | PLATFORM (7 cards) | read a card | PASS | readout, key "n SEEN", lesson card all agree |
| 3 | LISTENING (5 setups) | how the player hears | PASS (S3) | strip draws each; TV and SOUNDBAR pictures almost identical (B-S3-13) |
| 3 | BUDGET / COMPACT / EXPANDED | voice limit | PASS | VOICES 0/8 ↔ 0/16, MIX lines; resets on the next page |
| 3 | two checks | | PASS | |
| 4 | GAMES (12 demos) | one true demonstration each | FAIL ×2 | RHYTHM shows nothing (B-S2-02); RACING names an unseen SPEED (B-S2-03); others PASS (S3 notes) |
| 4 | LISTENER tray | whose ears | PASS | 0°: YOU R 81 % → CAMERA R 55 %; FACING under camera keeps R 55 %; YOUR EARS at 185° → L 79 % |
| 4 | FACING | turn the player | PASS | |
| 4 | two checks | | PASS | |
| 5 | PLAY tray (7 chips) | play each kind | PASS | lamp per kind lights with its dB |
| 5 | ALARM | the quiet important sound | FAIL | no lamp of its own (B-S2-04) |
| 5 | SOLO (OFF + 4) | one category alone | FAIL (text) | "SOLO marks the other kinds SILENT" false with AMBIENCE (B-S2-05); EFFECTS solo correct |
| 5 | LEVEL / check | | PASS | |
| 6 | OPEN/CLOSE DOOR | the chain | PASS | card 1 switches door_open.wav ↔ door_close.wav; strip RATTLE starts at 1 s |
| 6 | START THE FAULT / DOOR FILE | planted fault | FAIL | named before the symptom by the guide and the hints (B-S1-02, B-S1-03); after the symptom: FAULT line, MISSING, strip NOT IN THE BUILD, repair → FIXED |
| 6 | strip (chain) | event → file → voice | PASS | |
| 7 | GENERATORS tray | add / on / remove / rule | PASS (S3) | two instances, 4 voices; remove stops loop; orphan with rule LEAVE IT PLAYING; blank band in tray after remove (B-S3-15) |
| 7 | SPEED 1 / SPEED 2 | per-generator speed | PASS | only GEN 2 changes; SPEED 2 LOCKED when gen 2 gone |
| 7 | fault card | orphan loop | PASS (S3) | FIXED without re-testing a removal (B-S3-10) |
| 8 | STEP tray, places | trigger / switch | PASS | YOUR FLOOR GRAVEL, GUIDE FLOOR WOOD; strip "· SENT" |
| 8 | SPEED + chooser | parameter | PASS | |
| 8 | MOOD | global state | PASS | ALERT frame seen (orange border, MOOD · ALERT) — first sighting on screen |
| 8 | SCOPE / fault card | planted fault | FAIL | hints name the cause before the symptom (B-S1-03); after symptom GUIDE FLOOR GRAVEL + table mark; fix → FIXED |
| 9 | STEP, SETUP (VARIATION, AVOID REPEAT, RATTLE), door | variation and layers | PASS | OFF → SAME TAKE ×4 all 1/4; ON → 22 steps no repeat; AVOID OFF → repeats; RATTLE off → one START |
| 9 | strip (takes) | last 8 takes | PASS | real cents and dB |
| 10 | SOUNDS tray, STEP, FACING, WIND FILE | zones and loops | PASS | 2 crossings → 2 ZONE lines; RAW CUT → JUMP, JUMPS 1 after 10 s |
| 10 | fault card | bed pile-up | FAIL | SOUNDS tray shows "✓ ON EVERY UPDATE" while the card says nothing names it (B-S1-01); symptom ×4 copies, fix OK |
| 10 | picture (first arrival) | | FAIL | blank picture, CanvasKit abort (B-S2-08) |
| 11 | SOURCES tray, FACING, STEP | distance and pan | PASS (S3) | walk to VIRTUAL from 3 starts (start 250°, fountain 270°, south-west corner); back in range "played again"; YOU walks into the fountain (B-S3-08) |
| 11 | check | | PASS | heading printed twice (B-S3-07) |
| 320 wide | readouts and keys | | FAIL | cut labels and a cut value (B-S2-06) |

---

## 2. Bugs (most serious first)

### B-S1-01 · page 10 · S1 — the planted fault names itself in the tray the learner must open
Steps: open page 10 → TROUBLESHOOT card → START THE FAULT → do what the card says: "Start the fault and switch SCENE on" → SCENE is only in the SOUNDS tray → open SOUNDS.
Expected: nothing names the fault until the background has grown (lead's decision 10). Card text says "The fault is now active. Nothing on this page names it yet."
Happened: the tray shows row "A BED STARTS" with "✓ ON EVERY UPDATE" ticked — the cause, in plain sight, before one step is taken. The guide's step 3 also says "With ON EVERY UPDATE, each step inside a zone starts that zone's bed again".
Evidence: `p10_fault_tray_names_rule.jpg`.
Cause: `pages\p10Loops.tsx:67-70` (rule chips always shown with their ✓), `guides\p10.ts:27`. Smallest fix: while the fault is unnamed (no `bedPileUp` fact since START), draw the rule row without a tick (or hide it) the way p06/p08 lock DOOR FILE / SCOPE; reword the guide line to the symptom only.

### B-S1-02 · page 6 · S1 — the screen guide names the missing file and how it got there
Steps: page 6 → START THE FAULT (do not press the door yet) → ⓘ → NEXT to "2 · WHAT YOU CONTROL".
Expected: the DOOR FILE readout reads "?" and the key is locked, so nothing should name the fault.
Happened: the guide reads "DOOR FILE sets which file name the door layer asks for: door_open.wav, which is in the build, or door_open_v2.wav, which is not." and "On the TROUBLESHOOT card, START THE FAULT sets DOOR FILE to the missing name for you." The answer is one tap away at any time. (Also, before the symptom, card 2 EVENT already prints "door asks for door_open_v2.wav" next to card 1 "door_close.wav" — by design "as a real tool would", but it makes the comparison the hints ask for possible without meeting the symptom.)
Evidence: text captured in the run (guide step 2); `p06_fault_unnamed_strip.png`.
Cause: `pages\guides\p06.ts:19-20`. Fix: describe DOOR FILE as "which file name the door layer asks for", without naming the wrong file or saying the fault sets it.

### B-S1-03 · pages 6, 8, 10 (shared FaultCard) · S1 — SHOW A HINT gives the cause before the symptom
Steps: page 8 → STEP tray → GRAVEL → START THE FAULT → press SHOW A HINT three times (do not press STEP: GUIDE).
Expected: hints only after the symptom (the card itself says "First make the symptom in the report happen").
Happened: all three hints show while the fault is unnamed: "The guide has not moved. Its switch is following your position, and the table marks that row." and "Open SCOPE in the dock" — while SCOPE is LOCKED ("Press STEP: GUIDE first"). Same card on page 6 (hint 3: "choose the file that is in the build") and page 10 (hint 3: "change the rule under A BED STARTS").
Evidence: run text (card, hints and locked SCOPE key captured together).
Cause: `bits.tsx:256-265` — hints are rendered whatever `seen` is. Fix: show SHOW A HINT only when `seen` is true (or show hint 1 only, which is symptom-level).

### B-S2-01 · page 1 · S2 — the safe-order lesson's goals latch in the unsafe order
Steps: clean open (reload) → SCENE on at 70 % → drag LEVEL to 31 % → ■ STOP.
Expected: the page's one lesson is "level low first, then start"; the goals should not reward the "common mistake" the page names.
Happened: ✓ Set LEVEL low, ✓ Start the scene, ✓ Stop the scene — all latch.
Cause: `pages\p01Welcome.tsx:73-79` (independent conditions). Fix: count "Start the scene" only when the scene started with LEVEL already ≤ 40 % (or add "in this order" and check the order).

### B-S2-02 · page 4 · S2 — RHYTHM demonstration shows nothing
Steps: page 4 → GAMES → RHYTHM.
Expected: a demonstration the learner can see (brief: each of the twelve runs and the line is true).
Happened: picture unchanged, PLAYING 0, VOICES 0/16; the tray covers the log, whose only line is "MUSIC Three layers START…". The line itself admits "The picture has no place for music".
Evidence: `p04_rhythm_demo_nothing_moves.png`. Cause: `pages\data\gaGenres.ts:161-164` + music not counted (HELD item). Fix: give RHYTHM a visible demo (e.g. a footstep or impact posted on the beat, so PLAYING pulses), or show the music clock strip while it runs.

### B-S2-03 · page 4 · S2 — RACING line names a SPEED the page never shows
Steps: page 4 → GAMES → RACING.
Happened: line "One sound keeps playing while its SPEED rises to 90%". Page 4 has no SPEED key, readout or strip; the value jumps (one dispatch), it does not rise. Only the rings get denser.
Evidence: `p04_racing_demo.png`. Cause: `gaGenres.ts:140-141`. Fix: show GEN SPEED in a readout during the demo, or reword to what is seen ("the generator's rings speed up: one sound, its speed changed").

### B-S2-04 · page 5 · S2 — the ALARM, the page's key sound, has no lamp of its own
Steps: page 5 → PLAY → SCENE on → ALARM on.
Expected: "The strip under the picture lights each kind while it plays."
Happened: ALARM readout ON, PLAYING 3 → 4, but no lamp changes: the alarm is folded into LOCAL with the fountain and LOCAL stays "−8 dB" (the fountain dominates). Only with EFFECTS soloed does LOCAL show the alarm (−21 dB).
Evidence: `p05_alarm_on_no_lamp.png`. Cause: `scene\hud\aModel.ts:174` (`alarm: 'local'`). Fix: give the alarm its own cell, or show LOCAL as two values (fountain / alarm).

### B-S2-05 · page 5 · S2 — "SOLO marks the other kinds SILENT" is false for AMBIENCE
Steps: page 5 → SCENE on, ALARM on → SOLO → AMBIENCE.
Happened: no SILENT anywhere; idle cells are struck through, LOCAL still reads −8 dB, and the alarm being shut out shows only as a 6 px glyph with no word. SILENT appears only with EFFECTS solo (AMBIENCE BED · SILENT).
Evidence: `p05_solo_ambience_no_SILENT.png`. Cause: `aModel.ts:238-244` (alarm and fountain share one cell, "part" drawn as a glyph, `aLevels.tsx:96`). Fix: same as B-S2-04; or reword step 3.

### B-S2-06 · pages 3, 4, 5, 6, 8, 10, 11 at 320 wide · S2 — cut labels and a cut value
Steps: resize to 320 x 700; open each page.
Happened (measured scrollWidth > clientWidth): PLAYING → "PLAYI…" on every page; page 8 "YOUR FL…", "GUIDE FL…", "VOIC…", "SOU…", strip "NONE SENT Y…", "GENERATOR 1…"; page 3 BUDGET key value "16 M…" (a cut VALUE) and fader caption "…16 VOICES A…"; page 6 "DOOR FILE"; page 10 "COURTYARD WIND", "LOOP · POSITION"; page 11 DISTANCE value wraps to "14.2 / m".
Evidence: `w320_p08_readouts_cut.jpg`, `w320_p03_budget_key_cut.jpg`, `w320_p11_readouts_cut.jpg`.
Fix: let the shared bezel drop labels whole (house rule: drop the label, never the number) below 360 wide; shorten BUDGET key to "16".

### B-S2-07 · page 1 (glossary) · S2 — "Audio listener" cannot be opened
Steps: page 1 → chip "Audio listener" → OPEN IN GLOSSARY (twice).
Happened: request `glossary_browse_v?…term=ilike.Audio listener` returns HTTP 500 both times; popup "Couldn't load this term — please check your connection". "Game audio" on the same page returns 200 (teaser; full text 401 for a guest).
Evidence: `p01_glossary_audio_listener_fails.jpg`. Cause: server side (a 500, not an empty result) — check that the term exists and why the view errors for this name.

### B-S2-08 · page 10 (web preview) · S2 — picture blank after walking pages 1→10
Steps: walk pages 1 to 10 in one session with many controls used.
Happened: page 10's picture was an empty dark box; console: CanvasKit "RuntimeError: Aborted()" in PictureRecorder (repeated), "Could not create surface"; 5,356+ console messages buffered (mostly the reanimated warning "using shared value's .value inside reanimated inline style", plus "SkPath.quadTo() is deprecated"). A reload fixed it.
Evidence: `p10_blank_picture_canvaskit_abort.jpg`. Note: other testers' tabs share the same browser GPU, so the cause may be partly environmental; the warning flood is not.

### S3 (polish)
- **B-S3-01 · all pages** — leaving the app (tab hidden) prints "GAME · STOP ALL…" **twice** at the same second, labelled GAME as if the game asked, and stops the scene. Reproduced by fronting my own blank tab; it also happened twice unprompted (other testers' tabs). `engine\useGaSound.ts:99-103` (player.pause dispatches stopAll; app-wide stop runs it twice). Fix: one line, worded "The app stopped all sound (you left the app)".
- **B-S3-02 · pages 2, 6, 9** — log "Door · door · door_open.wav" prints "door" three times (`model\gaModel.ts:956`). Fix: omit the layer name when it equals the event label.
- **B-S3-03 · pages 2, 6, 9** — "Door · rattle, 1 s later" START line is stamped at the door's time, not 1 s later, while page 6's strip shows it 1 s later.
- **B-S3-04 · page 9 / page 10** — "SETTING door rattle layer: OFF" and "SETTING courtyard wind file" are tagged MIX; they are not mix changes.
- **B-S3-05 · page 4** — every GAMES pick restarts the log clock at 0.0 s ("time since the page opened" is then false) and clears the previous log.
- **B-S3-06 · page 4** — ACTION: PLAYING/VOICES read 12 at 0.12 s though the impacts are "in 0.3 s" (delayed starts counted at once); SPORTS: "An impact, then a voice" — both start at 0.0 s.
- **B-S3-07 · page 11** — heading "CHECK YOURSELF" printed twice (`p11Distance.tsx:148` eyebrow). Pages 6–10 use "QUESTION", pages 1–5 none: inconsistent.
- **B-S3-08 · page 11** — YOU can walk into the fountain basin (drawn on top of it). Evidence `p11_you_inside_fountain.png`.
- **B-S3-09 · page 11** — card "DIRECTION straight behind" with "PAN LEFT 4%"; page says straight behind pans to the centre. PAN also shows a value for a VIRTUAL (not played) source.
- **B-S3-10 · pages 7, 8** — FIXED appears as soon as the rule is flipped (after ■ STOP); no removal / guide step proves the repair (page 6 does require the door to play again).
- **B-S3-11 · page 7** — START THE FAULT ticks "✓ LEAVE IT PLAYING" in the GENERATORS tray the learner must open (same pattern as B-S1-01, page outside the brief's list).
- **B-S3-12 · contents list** — with the list open the picture shrinks and labels collide ("FOUNTAIN"/"DOOR CLOSED", "YOU"/"CRATE"). `contents_open_labels_collide.jpg`. Also page 11 "YOU" label over "COURTYARD" in the south-west corner (`p11_you_label_over_courtyard.png`).
- **B-S3-13 · page 3** — TV SPEAKERS and SOUNDBAR strip pictures differ only by 2 vs 5 dots of 1.2–1.5 px (`bOutput.tsx:204-221`); no TV drawn.
- **B-S3-14 · page 1** — the bird has a START line but no GAME line, and no strip row while PLAYING reads 4.
- **B-S3-15 · page 7** — after REMOVE GENERATOR 2 the GENERATORS tray keeps an empty band at its top (`p07_orphan_fault_tray_gap.jpg`).
- **B-S3-16 · page 6 guide** — step 1 "Three cards show its chain…" lights the display, not the cards; the chain strip itself is not described in "What you're seeing" (`p06_guide_step1_points_display.jpg`). Page 1 step 1/3 likewise talk about the log while lighting the display.
- **B-S3-17 · full screen** — FIT centres on the middle of the scene: YOU (south-west) is off screen until dragged; the 1× chip keeps an outline while FIT is selected.
- **B-S3-18 · sliders** — role=slider with no arrow-key support (focus + ArrowLeft does nothing).
- **B-S3-19 · console** — continuous reanimated warning flood and Skia `quadTo` deprecation warnings (see B-S2-08).
- **B-S3-20 · page 7** — first-visit intro card rose over the open GENERATORS tray a second after it opened (known HELD frame fault (2); confirmed on screen) (`p07_intro_card_over_tray.jpg`).

---

## 3. Not tested, and why
- **Anything heard; SOUND on → off.** Needs the Sound Safety acknowledgment, which is the owner's. SOUND off → on → KEEP SOUND OFF was tested.
- **Reduce motion on screen.** Could not switch it in the preview; read in code: `GaScene.tsx:1158`, `aParts.tsx:81`, `bClock.ts:74`, `cKit.tsx` all gate on `useDecorativeMotion()`.
- **A real phone.** Web preview only. B-S2-08 may be web-only (CanvasKit).
- **Long text in a field.** No text field in pages 1–11.
- **Undo / redo.** None in this slice.
- **Glossary full definitions.** Guest RPC returns 401 in the preview; only the by-name lookup could be judged.
- **Motion smoothness.** My tab was fronted while judging, but other testers' tabs repeatedly took focus (see B-S3-01), so frame-rate judgements were not made.
