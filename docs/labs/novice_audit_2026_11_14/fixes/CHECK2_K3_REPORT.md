# Check round 2 · K3 · F5 + F6 phase 3 (2026-11-14)

Status: DONE.

**Summary: 52 checked · 43 PASS · 8 FAIL · 1 NOT SEEABLE (Tube card counter, PASS by code).** The 8 FAIL rows come down to 5 problems (F-1 to F-5 below). The core "done = work done" rule works in every lab I opened: no module turned ✓ on opening or on a wrong answer, and each one turned ✓ on the right answer or the goal.

Scope: F5_REPORT Phase 3 (Foundations, Mic Principles, Wave, Speaker Placement, Room Design, Playground, Amplitude) and F6_REPORT Phase 3 (Digital, Tube, Meter, Gain, Amp, Cable, Patchbay, Cable Dressing).

Browser: built-in pane, one tab of my own, 390x844. Sound always KEPT OFF.

## Keys removed on my tab (localStorage, shared by every 8142 tab)

None. `ape:intro:labLearnFirst` was not present in localStorage at all, so I removed nothing. The first-visit intro cards showed anyway, because each new page load started a fresh guest session.

## Notes on the pane
- At start, localStorage on 8142 held no `ape:labProgress` at all (fresh after the restart), so every "no ✓ → ✓" step below starts from empty progress. My answers wrote real units into the shared `ape:labProgress` (e.g. `af_foundations: ["0"]`).
- My first tab (tab-2) was taken over by another agent (it jumped to EarModule, then to `?f3=40#labpreview/GameAudioLab`) after I fronted it. I left tab-2 to them and continued in tab-5, which I never fronted. I closed tab-5 at the end. I used one tab per lab by navigating it to each new route rather than opening and closing a tab per lab.
- `ape:labProgress` disappeared between page loads. This looks like the guest wipe on each new load (D57, a guest's work is ephemeral). So every lab was checked in one load: CONTENTS ○/✓ and the What's left rows, not storage.

## Results

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Foundations | Module turns ✓ only after its CHECK | Fresh progress. Opened module 1, GOT IT on intro. CONTENTS (MODULE 1 ▾) | "○ 01 WHAT IS SOUND?" | PASS |
| Foundations | … wrong answer does not credit | Picked "The air near the clap traveled across to your ear" | red + reason "Watch a pink tracer dot: it rocks around its mark…"; CONTENTS still "○ 01" | PASS |
| Foundations | … right answer credits | Picked "A pattern of pressure changes — each molecule only rocked in place" | "CHECK YOURSELF · ✓"; CONTENTS "✓ 01"; storage `{"units":{"af_foundations":["0"]}}` | PASS |
| Foundations | Strip has no N of total | Read strip | "MODULE 1 ▾" (no "/ 14") | PASS |
| Foundations | CONTENTS is a popup | Tapped MODULE ▾ | Centered card "CONTENTS ✕" over the page | PASS (Escape does not close it; ✕ does) |
| Foundations | Model note plain | Read rack | "A picture of the idea, slowed down so you can see it. Not a measurement." (M1); "The sum is drawn exactly from the math, slowed down so you can see it." (M10) | PASS |
| Foundations | All-caps disclaimer still on screen | Read M1 well | "CONCEPTUAL MODEL — SLOWED FOR VISIBILITY (real air moves at the audio rate, thousands of times faster)" in the reading well (F5 left the in-well ConceptBadge by choice) | LISTED (not a fail by F5's scope; still an all-caps disclaimer on screen) |
| Foundations | Module 10 still red + CANCELED — SILENT | Module 10, PRESET tray → 180°, closed tray | Flat RED line in SUM = A + B, label "CANCELED — SILENT" (rgb 255,141,122) on it; SUM "CANCELED"; slider "180° — CANCELED" | PASS |
| Foundations | Open tray shows ⓘ | PRESET tray | "PRESET · stays open — compare while you watch ⓘ ✕" | PASS |
| Foundations | Step intro inline after the first | Module 10 (second module of visit) | WHERE TO START shown inline above the dock, not a popup | PASS |
| Foundations | Module 3 (no card) counts on NEXT only | New load (tab-5). CONTENTS → 03; CONTENTS → 05 (jump away); CONTENTS shows "○ 03"; back to 03, pressed "NEXT: AMPLITUDE ›" at its foot | CONTENTS "✓ 03" only after NEXT | PASS |
| Mic Principles | Module without a card counts on NEXT | Opened module 1 INSIDE THE CAPSULE: CONTENTS "○ 01"; pressed "NEXT: PICKUP PATTERNS ›" | "✓ 01" | PASS |
| Mic Principles | Module 2 ✓ only after its check | Opened module 2: "○ 02". Wrong pick "In front of the mic, facing the singer" | reason "In front is where the mic hears best, so the wedge would feed straight back…"; still "○ 02" | PASS |
| Mic Principles | … right answer | Picked "Behind the mic, in the null" | "✓ 02" | PASS |
| Mic Principles | End rows + one unit word | WHAT'S LEFT | "8 modules still to finish…", HOW A MODULE COUNTS, rows "Still to do: answer its CHECK YOURSELF right." / module 7 "read it through and press NEXT at its foot."; "✓ 2 CREDITED"; strip "MODULE 2 ▾" | PASS |
| Mic Principles | Model note plain | Module 2 rack | Still all caps under the display: "CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASURED POLAR RESPONSE · color = the pattern's sensitivity b…" and it is CUT at 390 | FAIL (see F-1) |
| Mic Principles | All-caps lines in module 1 (not a rack) | Module 1 | "SIMPLIFIED MODEL — coil speed follows the sound…", "MOVING-COIL DYNAMIC CUTAWAY — ILLUSTRATIVE MODEL · …" | LISTED (MicPrinciplesLabScreen.tsx:409, :412) |
| Speaker Placement | Module ✓ only after its check | Opened module 1: CONTENTS "○ 01". Wrong "Cleaner, louder sound — two speakers always beat one" → reason "Two arrivals of the same signal do not simply add…", still "○ 01". Right "Rough, comb-filtered sound…" | "✓ 01" | PASS |
| Speaker Placement | End rows, unit word | WHAT'S LEFT | "2 modules still to finish…", HOW A MODULE COUNTS "…Opening a module does not count it…", rows "Still to do: answer its CHECK YOURSELF right."; strip "MODULE 1 ▾" (no more "section") | PASS |
| Speaker Placement | Model note plain | Module 1 rack | Still all caps: "CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION" | FAIL (see F-1) |
| Wave | Module ✓ only after its check | Module 1 Reflection: CONTENTS "○ 01". Wrong "A rendering error in the simulation" → "It is drawn on purpose: it predicts where and when each bounce arrives.", still "○ 01". Right "A modeling idea that predicts the bounce's path, time and level" | "✓ 01" | PASS |
| Wave | Strip / model note / drawing… | Modules 1, 2, 11, 14 | "MODULE 1 ▾"; "A teaching model drawn from geometry, not a full simulation of the room."; module 11 showed "drawing…" in the glass while its intro card was up | PASS |
| Wave | GO DEEPER fold, closed by default, nothing missing | Module 1: tapped "GO DEEPER ▾" | Opens to AT THE LISTENER numbers + COMMON MISTAKES; module 2 also has the fold after its check | PASS |
| Wave | Beginner core first (modules with no `explain`) | Modules 11 and 14 (code: also 9, 13, 15) | Well goes straight from FULL SCREEN to CHECK YOURSELF. Module 14's only teaching paragraph ("A room gives you both at once … ~50 ms …") and module 11's "Watch the null … DRAG THE LISTENER" line plus round-1 W2's one-cycle caption are now inside GO DEEPER | FAIL (see F-2) |
| Room Design | Reading module counts on NEXT; hands-on module on first change | New load. CONTENTS all "○". Picked "Module 2, Create the room" in CONTENTS (the next module) | "✓ 01" (CONTENTS jump to idx+1 goes through the same `goNext` as NEXT, RoomDesignLabScreen.tsx:178-189; a jump to any other module does not count). Module 2 "○ 02" on arrival | PASS (note: CONTENTS → the very next module counts a reading module, same as NEXT) |
| Room Design | … hands-on module | Module 2: tapped "+" on LENGTH (5.00 → 5.25 m) | "✓ 02" | PASS |
| Room Design | Review order + GO DEEPER | CONTENTS → 06 Review | Opens on "SUGGESTED NEXT STEPS" (TRY FIRST …), then "GO DEEPER ▾ The room and layout table, the modes, the reflections and the decay times.", then MEASURE VERSUS ESTIMATE open | PASS |
| Room Design | Model note | Module 2 | "CALCULATED · dimensions, area and volume are exact arithmetic from your entries" (tier label + plain words, not a NOT-A-MEASUREMENT line) | PASS |
| Sound Playground | MARK AS REVIEWED only after the check | Opened: "Answer CHECK YOURSELF right and MARK AS REVIEWED appears here." Wrong "The pitch drops toward the cutoff" → "A filter changes how strong each part is, not where it sits…", still no button. Right "Nothing — its only partial sits far below the cutoff" | "CHECK YOURSELF · ✓" then "MARK AS REVIEWED" appears | PASS |
| Sound Playground | Model note / all caps | Rack + well | Rack: "The air is slowed down; the waveform and spectrum come from the math, not a meter." Well still has "CONCEPTUAL MODEL — SLOWED FOR VISIBILITY (…)" and "ANALYTIC — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT (…)" | PASS (rack); LISTED (in-well all caps, F5 left them by choice) |
| Amplitude | "QUESTION 1" | Full app: Skip video → LABS → Understanding Level & Amplitude | "CHECK YOURSELF — THREE QUICK READS / QUESTION 1 / Which shows MORE level?"; "UNDERSTOOD — MARK REVIEWED" is disabled until the check passes (AmplitudeOrientation.tsx:1033) | PASS |
| Digital | Module 2 needs BOTH checks | `DigitalModule/sampling`, fresh load: CONTENTS "○ 02". Part-1 CHECK_ALIAS: wrong "A 6 kHz alias (30k − 24k)" → "The fold is measured from the nearest multiple of the sample RATE, not from Nyquist."; right "An 18 kHz alias (\|30k − 48k\|)" → "CHECK YOURSELF · ✓" | CONTENTS still "○ 02" after part 1 alone | PASS |
| Digital | … PART 2 fold + CHECK_AA | Tapped "▸ PART 2 · THE ANTI-ALIASING FILTER" (was collapsed): the AA lesson + its check appear. Wrong "It is cheaper to build the electronics that way" → "Cost is not the reason…"; right "After sampling, an alias looks like real audio — no filter can split them" | CONTENTS "✓ 02" only now | PASS |
| Digital | End rows + HOW IT COUNTS | WHAT'S LEFT | "7 modules still to finish…"; "A module counts once every CHECK YOURSELF on it is answered right."; rows "Still to do: answer its CHECK YOURSELF right." / "Still to do: answer all 2 of its CHECK YOURSELF questions right." / "all 5 …"; "✓ 1 CREDITED" | PASS (odd English: "all 2 of its" should read "both of its") |
| Digital | Model note | Module 2 rack | Still ALL CAPS and cut at 390: "EVERY DOT IS A MEASUREMENT OF THE CONTINUOUS SIGNAL — NOT A BLOCK OF SOUND. BELOW NYQUIST THE DOTS DESCRIBE IT …"; in-well "SYNTHESIZED PREDICTION — THE GENERATOR PLAYS …", "SIMPLE MODEL OF HOW THE FILTER TURNS DOWN HIGH FREQUENCIES — NOT EVERY DETAIL OF A REAL FILTER", "FILTER BYPASSED — …" | FAIL (see F-1) |
| Digital | Cut text at 390 | Module 2 dock | FREQ fader label "1 kHz — sweep through Nyqu…" cut | LISTED (pre-existing, not round 2) |
| Vacuum Tube | Saturation counts only when driven to SATURATED | Fresh load, CONTENTS → 08. DRIVE 20% CLEAN; "+"×3 → 26% CLEAN; dragged → 52% "WARMING" — CONTENTS "○ 08"; dragged → 98% "SATURATED · soft clipping" | CONTENTS "✓ 08" only after SATURATED | PASS |
| Vacuum Tube | Amplify: new check | Module 4: "Your signal wiggles the GRID a little. What leaves the PLATE?" Wrong "The same small wiggle, unchanged" → "The grid only gates the big cathode-to-plate stream. Compare the blue wave with the amber one."; right "A bigger copy, flipped upside down" | "✓ 04" only after the right answer | PASS |
| Vacuum Tube | Tube vs Transistor: new check | Module 9: "Which one needs a heater warm-up and hundreds of volts to work?" Wrong "Both, equally" → "Only one of them boils electrons off a hot cathode…"; right "The tube" | "✓ 09" | PASS |
| Vacuum Tube | End rows, HOW IT COUNTS, unit word | WHAT'S LEFT | "HOW A MODULE COUNTS: A module counts once its own task is done…"; rows "Still to do: tap every part chip once." / "warm the tube up to steady current (stage 5)." / "switch in the high-voltage supply (B+)." / "look at all three types."; strip "MODULE"; "✓ 1 DONE" | PASS |
| Vacuum Tube | Tube card counter gone | In-lab "TUBE REF ›" does nothing in the preview (TubeReference is not a preview screen). Code: TubeCardScreen.tsx:479 prints "NN · short", no "/ 40" | — | PASS by code; NOT SEEABLE on screen |
| Vacuum Tube | Model note | Module 1 rack | Still all caps: "ILLUSTRATIVE MODEL — SCHEMATIC CROSS-SECTION, NOT MEASURED TUBE DATA" | FAIL (see F-1) |
| Meter | Goal = its check; plain model note | `MeterModule/peak` fresh: CONTENTS "○ 02". Wrong "Yes — the same peak means the same loudness" → "Peak shows only the single highest point. Compare the RMS and CREST readouts…", still "○ 02"; right "No — same peak, very different average energy" | "✓ 02"; rack note "A built-in teaching signal, levels in dBFS, not a measurement of real audio." | PASS |
| Meter | Odd English (house slang) | Module 2 well | "Ride the GAIN lane and drive the columns into the OVER lamp…" ('ride'/'lane' were replaced in F5's labs, not here) | LISTED |
| Gain | Input Gain First goal | `GainModule/input` fresh: STATUS LOW, PREAMP −30 dB, CONTENTS "○ 02". Dragged INPUT GAIN +0 → +19 dB | PREAMP "HEALTHY", STATUS "OK"; CONTENTS "✓ 02" | PASS |
| Gain | Multiple Gain Stages starts unbalanced | CONTENTS → 06 | "BALANCE —" and "Not balanced yet — flip on the X-Ray, find the stage that is too hot or too weak, and fix it THERE." (did not solve it) | PASS (start state only) |
| Amp | Module 7 step 2 split, order | `AmpModule/realworld`: step 1 "1 · GAIN STRUCTURE", NEXT → step 2 = "2 · SPEAKER-LOAD BUILDER / 3 · POWER AND CURRENT / 4 · BRIDGED OPERATION" ending "NEXT: LOUDNESS, RISK AND SPEC SHEETS ›" → step 3 = "5 · WATTS AND LOUDNESS / 6 · CLIPPING… / 7 · OPERATING-PRACTICE INSPECTION / 8 · SPECIFICATION DECODER" + "CHECK YOURSELF · 4 TO ANSWER" | In order, nothing missing | PASS |
| Amp | Counters gone | Header and strip on 7 and 8 | "Module 7" (no "of 8"), "MODULE 7 · STEP 3 ▾"; module 8 "PICTURE 1", "SCORE 0 right"; no "n of N" / "n / N" line on the page | PASS |
| Amp | Dead tap from the inline intro | Step 2 has no dock; the inline WHERE TO START card sits over the foot of the well and covers "NEXT: LOUDNESS, RISK AND SPEC SHEETS ›" — my tap on it went into the card and nothing happened; after ✕ it works | — | FAIL (see F-3) |
| Cable Fundamentals | Lesson 3 connector record folded | `CableLab` → CONTENTS → Lesson 3 | Record opens on photo/name/cautions; "CONTACTS & USES ▸ / CABLE BEHIND IT ▸ / CONNECTING IT ▸ / STRENGTHS & LIMITS ▸ / MISTAKES & LOOK-ALIKES ▸ / INSPECT & TEST ▸" all closed | PASS |
| Cable Fundamentals | One unit word | Strip vs lesson header | Strip "LESSON 3 ▾", header "LESSON 3", but the progress line right under it reads "0 UNITS CLEARED" | FAIL (see F-5) |
| Patchbay | Unit word + counters | `PatchbayLab`: strip; CONTENTS → page 11 | Strip "PAGE 1 ▾" / "PAGE 11 ▾", CONTENTS "Page 11, Predict before patching"; page 11 shows "PREDICT 1 … PREDICT 4"; no "n OF N" line on pages 1 or 11 | PASS |
| Cable Dressing | Unit word | `CableInstallLab` strip | "STAGE INTRO ▾", "STAGE 4 ▾", CONTENTS "Stage 4, …" | PASS |
| Cable Dressing | Counters gone | Stage 3, 4, 5 page text | Stage 3: "INSTALLATION 1 OF 2 — STAGE INPUT BOX → CONTROL-ROOM RACK", "INSTALLATION 2 OF 2 — …" (F6 says this became "INSTALLATION n"). Stage 4: "BEND 1 …" and "4 bends still outside spec" are fixed, but "0 of 4 pull events explored" remains. Stage 5: "0 correct · 0 of 17 sorted", "ITEM 1 OF 17" | FAIL (see F-4) |
| Foundations | End rows "Still to do" | CONTENTS → WHAT'S LEFT | "13 modules still to finish…"; rows "Still to do: answer its CHECK YOURSELF right. Inside: …"; module 3 "Still to do: read it through and press NEXT at its foot."; HOW A MODULE COUNTS "…Opening a module does not count it…"; "✓ 1 CREDITED". Module 10 (opened) still listed | PASS |

## FAIL list

### F-1 · Model notes still ALL CAPS in Mic Principles, Speaker Placement, Digital and Vacuum Tube (decision 3)
F5 adopted S3's plain `modelNote` only for Foundations, the Playground and Wave, through `foundations/modelNotes.ts`. F6 adopted it only for Meter. The other rack labs in scope still show the old all-caps line under the display:
- **Mic module 2** (`#labpreview/MicPrinciples`, NEXT once): "CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASURED POLAR RESPONSE · color = the pattern's sensitivity b…". It is also **cut at 390**: the element is 370×39 with a 2-line clamp, and scrollHeight is 56. Source: src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx:494. The module 6 badge at :1227 has the same issue ("…NOT A MEASUREMENT…").
- **Speaker module 1** (`#labpreview/SpeakerCoverage`): "CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION". Source: src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:69 (and SIDE_BADGE at :70).
- **Digital module 2** (`#labpreview/DigitalModule/sampling`): "EVERY DOT IS A MEASUREMENT OF THE CONTINUOUS SIGNAL — NOT A BLOCK OF SOUND. BELOW NYQUIST THE DOTS DESCRIBE IT …". This one is also cut at 390. Source: src/screens/lab/digital/modules/modAnalog.tsx:795.
- **Vacuum Tube module 1** (`#labpreview/VacuumTube`): "ILLUSTRATIVE MODEL — SCHEMATIC CROSS-SECTION, NOT MEASURED TUBE DATA". Source: src/screens/lab/tube/VacuumTubeLabScreen.tsx:299.

Repro: open each route at 390x844, close the intro card, and read the line under the bezel, above HIDE DISPLAY.

All-caps lines inside the reading well, which both fixers left by choice:
- Foundations: "CONCEPTUAL MODEL — SLOWED FOR VISIBILITY …"
- Playground: "ANALYTIC — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT …"
- Mic module 1: MicPrinciplesLabScreen.tsx:409, :412
- Digital: "SYNTHESIZED PREDICTION — …" and "SIMPLE MODEL OF HOW THE FILTER … — NOT EVERY DETAIL OF A REAL FILTER"
- Wave: in-well Badges such as modWaveB.tsx:1367 and :1654

### F-2 · Wave: five modules open with no beginner text, because the teaching prose is folded under GO DEEPER (decision 5)
`waveLayout.tsx:117-122` puts the whole `readouts` slot inside `<GoDeeper>`. Five modules pass no `explain` prop and keep their only teaching prose inside `readouts`:
- 9 Coverage
- 11 Delay Alignment
- 13 Beam Steering
- 14 Echo
- 15 Reverb

For these, the reading well goes straight from FULL SCREEN to CHECK YOURSELF.

Repro:
1. Open `#labpreview/WaveModule/echo` and close the intro card.
2. The well reads "▾ CHECK YOURSELF · A strong reflection arrives 20 ms after the direct sound. What do you hear?" with no explanation above it.
3. The paragraph that teaches the answer ("A room gives you both at once … when a late reflection's gap crosses ~50 ms its verdict flips…", modWaveB.tsx:1640-1647) appears only after you tap GO DEEPER ▾.

In module 11 (`#labpreview/WaveModule/delayalign`), two captions are hidden under GO DEEPER:
- the only instruction, "Watch the null … DRAG THE LISTENER…" (modWaveB.tsx:961-963);
- round-1 W2's one-cycle caption (modWaveB.tsx:956-960).

Nothing is deleted, but the beginner core is no longer first. Suspected fix site: waveLayout.tsx:114-122 (keep `readouts` captions out of the fold), or give those five modules an `explain`.

### F-3 · The "inline" step intro is a floating card that covers the foot of the well (shared S1, ScreenGuide.tsx:832 `ScreenIntroInline`)
On a later step, the intro is not placed in the page flow. It floats above the dock, about 200 px tall, over the bottom of the reading well.

Repro (dead tap):
1. Open `#labpreview/AmpModule/realworld` and press GOT IT.
2. Press NEXT to reach STEP 2.
3. Scroll the well to the bottom. "NEXT: LOUDNESS, RISK AND SPEC SHEETS ›" sits under the WHERE TO START card, and tapping it does nothing (the tap lands on the card).
4. After ✕, NEXT works.

The same card also covered CHECK YOURSELF options:
- Mic module 2: "Behind the mic, in the null" hidden; my first tap on an option went into the card.
- Tube modules 4 and 9: the third option and NEXT hidden.

It needs a ✕ first, and a learner may not know that.

### F-4 · Cable Dressing: N-of-total counters still on screen (decision 2)
F6's table says "INSTALLATION n OF N → INSTALLATION n", but only KnowScene.tsx:365 changed. Repro at `#labpreview/CableInstallLab`, CONTENTS:
- **Stage 3**: "INSTALLATION 1 OF 2 — STAGE INPUT BOX → CONTROL-ROOM RACK" (scenes/RouteScene.tsx:600).
- **Stage 4**: "0 of 4 pull events explored" (scenes/MechScene.tsx:1092).
- **Stage 5**: "0 correct · 0 of 17 sorted" and "ITEM 1 OF 17" (scenes/SupportsScene.tsx:715, :720; also the result line at :828).

Not opened, seen in code only:
- WallsScene.tsx:719 "WALL n OF N"
- FireScene.tsx:844 "IDENTIFY EACH SPACE — n OF N"
- FireScene.tsx:899 "ONE RATED-WALL PENETRATION — n OF N"

The same pattern in Cable Fundamentals (F6 did not claim these; seen in code only):
- lesson05.tsx:162 "ROUTING PICKS · n OF N"
- lesson11.tsx:412 "· n OF N"
- lesson02.tsx:152 "LAYER n OF N"
- lesson12.tsx:130 "n of N solved" (screen-reader line)

### F-5 · Cable Fundamentals: the unit word is mixed, LESSON in the strip and UNITS in the progress line (decision 3)
Repro: open `#labpreview/CableLab` (or lesson 3). The strip and header read "LESSON 1", and the line right under them reads "0 UNITS CLEARED". Source: src/screens/lab/cable/CableLabScreen.tsx:177 (`${cleared} UNIT(S) CLEARED`, a11y "lab units cleared"). It should be "0 LESSONS CLEARED" (or "DONE").

## Other observations (not counted as FAIL)

These are not counted as FAIL.

- **Foundations module 10, PRESET tray open at 390x844**: the display shrinks, and the flat red sum line and its "CANCELED — SILENT" label slip behind the bezel readouts. Only the edge of the label shows. The tray says "stays open — compare while you watch". Closing the tray shows the line and the label correctly. This is a shared rack layout matter and may not be new in round 2.
- **Room Design**: picking the very next module in CONTENTS counts a reading module, just like NEXT does (RoomDesignLabScreen.tsx:178-189). This matches "counts when you move on", so it is noted, not failed.
- **Odd English**:
  - Digital end rows: "answer all 2 of its CHECK YOURSELF questions right" (should be "both").
  - Meter module 2: "Ride the GAIN lane …" (house slang that F5 removed from its own labs).
  - Digital module 2: "ride the FREQ fader".
- **Cut at 390 (looks pre-existing)**: Digital module 2's FREQ fader label "1 kHz — sweep through Nyqu…".
- **Preview-only**:
  - Tube "TUBE REF ›" does nothing (TubeReference is not a preview screen).
  - A floating ⚡ dev button sits over the left dock tile (Foundations PITCH, Cable Dressing). This is F6's shared need from round 1.
- **Wrong-answer reasons**: every wrong answer I picked showed its own reason line (round-2 "why"), and no card reordered itself.

## Not checked, and why

- Wave 16 Room Builder (all four cards), Foundations 14 (three course checks), Mic 10 MISTAKES (three picture rounds): I credited one ordinary module per lab and did not walk the multi-card goals.
- Gain Multiple Gain Stages: I saw only the unbalanced start ("Not balanced yet"); I did not balance it to see ✓.
- Cable Dressing "RESUME — STAGE n": needs a stored resume point.
- Amplitude's just-passed end-screen wording.
- First visit opening on LEARN: none of the labs above has a LEARN tab on the strip I used, and the `labLearnFirst` key was absent.
- Ear Training, Sound Systems titles, Game Audio splits: not in my scope (F5/F6 only).
