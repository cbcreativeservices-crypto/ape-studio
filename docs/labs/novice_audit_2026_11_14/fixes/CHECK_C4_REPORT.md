# CHECK C4 report: F7, F8, F9 (lab fix round 1, 2026-11-14)

Checker C4. Built-in pane only, one tab of my own (tab-35, 390x844; 320 for the Membrane title), closed at the end. Preview http://localhost:8142. Nothing edited except this file. Sound Safety: KEEP SOUND OFF every time; no PRINT / SHARE / DOWNLOAD. No storage keys removed. `ape:dev:entitlement` untouched. One harmless page-side change on my own tab only: `navigator.mediaDevices.getUserMedia` wrapped (to count calls) on the EQ Lab module-1 page; gone after the next reload.

## 1. Summary

**Checked 59 · PASS 48 · FAIL 7 · NOT SEEABLE 4**

FAIL-5 is the serious one: a tap on a fader's "+" or "−" key can jump the fader to its end instead of moving one step. It comes from the shared lane step code, not from F7, F8 or F9, and it affects a large share of the app's faders. The other six are small: wording, a 320-only title cut, and one web-only caption.

## 2. Table

| Lab | Fix (group + item #) | Steps | Seen | Result |
|---|---|---|---|---|
| EQ Lab mod 1 | F7-1 mic off on arrival | Opened `EqModule/spectrum`; NEXT then PREV (fresh mount), waited 6 s; getUserMedia wrapped | Bezel MIC "OFF"; "The microphone is off. Tap MIC, or tap the display, to let it listen to your room."; 0 getUserMedia calls | PASS |
| EQ Lab mod 11 | F7-1 mic off on arrival | Reload `EqModule/liveEq`, GOT IT, VIEW tray | MIC "OFF"; "The microphone is off. Tap the display, or VIEW › MIC OFF — START…"; tray "MICROPHONE · MIC OFF — START" | PASS |
| EQ Lab 1 + 11 | F7-1 mic starts only on a tap (phone) | Tapped MIC on the web | Nothing happens on the web: there is no getUserMedia anywhere in src, so the web has no mic engine | NOT SEEABLE (phone only; code SeeingFrequency.tsx:313-322, :343 has no auto-start) |
| Compression | F7-2 + ph2 MODEL GR, sound off | KEEP SOUND OFF; SOURCE → SINE 440 Hz | "GR 15.0 dB MODEL" (a11y "not heard: sound is off") = (−20 − −40) × 0.75; sound-off line "…On SINE 440 Hz, GR shows the MODEL value." | PASS |
| Compression | F7-2 one GR story | Same state, read GAIN REDUCTION line | It still says "…nothing is measured here and GR reads — dB…" beside "GR 15.0 dB MODEL" | **FAIL-1** |
| Gate | F7-2 one GR story | Open, read | GR "— dB"; caption agrees; "The live GR readout needs sound." | PASS |
| Equalizer | F7-3 GAIN/Q locked by shape | TYPE → HIGH-PASS, tap GAIN; LOW-PASS; PEAK | HP: GAIN "—", Q "—", keys LOCKED, tap prints "GAIN — locked: a pass filter has no gain…"; LP: GAIN locked, Q 1.4 live; PEAK: +6 dB / 1.4 restored | PASS |
| Binaural | F7-4 +30° = 261 µs, ±1° keys | "+1° ›" once (−60 → −59°, 488 → 481 µs), then 89 more | "+30° front-right", ITD "261 µs", THE TWO CUES "≈ 261 µs" | PASS |
| Binaural | F7-4a stage drag snaps | Tried a drag on the stage | Drag did not grab in the scaled pane | NOT SEEABLE (code BinauralLabScreen.tsx:647 `binSnapAz`) |
| Flanger | F7-5 "in Hz" wording | No preview route; read code | Rack copy says "in Hz" (fxLabConfigs.tsx:778, 784, 870, 875); the guide's WHAT YOU'RE LEARNING line does not | **FAIL-2** |
| Equalizer, Compression, Gate, Binaural | F7-6 WHERE TO START silent first | Read the intro cards / guides | Binaural "Slide AZ from 0° to +90°…watch ITD climb to 656 µs. Then put on headphones and tap ▶"; Equalizer seen by F7; Compression/Gate guides open on a drag | PASS |
| Delay, Reverb, Chorus, Flanger, Limiter | F7-6 WHERE TO START silent first | No preview route; read *ScreenGuides.ts | Each `start` opens on a silent move (FDBK 0 %, RT60, bold line, CENTER, CEILING) | NOT SEEABLE (no route; code OK) |
| Equalizer, Gate, Stereo, Binaural (+ Compression by F7) | F7 ph2 FINISH · SEE WHAT'S LEFT | CHECK tab | FINISH present in each; Equalizer FINISH → "Where you are · EQUALIZER LAB · Only the check is left…" | PASS |
| Delay, Reverb, Chorus, Flanger, Phaser, Limiter, Distortion, Phase | F7 ph2 FINISH | — | webPreviews.tsx registers only EqLab, CompressionLab, GateLab, StereoLab of the FxLabScreen labs | NOT SEEABLE (no route; the same FxLabScreen checkEnd path works in 4 labs) |
| Equalizer, Compression, Gate, Stereo, Binaural | F7 ph2 sound-off lines + captions | Read under the display | e.g. Stereo "Sound off? The two traces show what you would hear…"; captions "shape / where / how much / how wide", "acts above / how hard / turned down", "which sound / direction / how far away / far ear late" | PASS |
| Compression, Binaural | F7 ph2b CHECK YOURSELF reasons + second miss | Wrong pick, then a second different wrong pick | 1st: own reason only ("A higher RATIO only acts harder once…"); 2nd: reason + explanation | PASS |
| EQ Lab end | F7 ph2 end rows "Still to open" | `EqModule/challenges` → FINISH · SEE WHAT'S LEFT | "01 Seeing Frequency · Still to open: Live spectrum…" … "14 Fix the Signal · Still to open…"; HOW A MODULE COUNTS once; end guide "Read WHERE TO START at the top…" | PASS |
| Delay / De-Esser / Distortion | F7-7b,d,a copy | Code | fxLabConfigs.tsx:429 "…nothing is fed back, so no second repeat follows."; DeEsserLabScreen.tsx:404 "(fixed at 4:1 in this lab)"; distortionScreenGuides.ts:110,134 "GUIDED STEPS 2 and 3" | PASS (code) |
| Bass | F8-1 no "FRET FRET" | Lane read | "FRET  12 of 12", word once | PASS |
| Bass | regression next to F8-1 | Real tap on the FRET lane's "+" from OPEN; "−" from 12 | OPEN → "12 of 12" in one tap; 12 → OPEN in one tap | **FAIL-5** |
| Harmonics | F8-3 SLOPE unit; ph2 sound-off, captions, FINISH | Read bezel, CHECK tab | "SLOPE / −6.0 / dB/OCT", key kept; "the pitch / overtone share / how spiky"; FINISH present | PASS |
| Drum Tuning ch2 s5 | F8-4 REVEAL KEY waits | REVEAL KEY at WALKED 1/13 | "Walk the whole drum first: 12 spots have not been looked at yet…"; KEY stays hidden | PASS |
| Drum Tuning ch2 s5 | F8-5 found/missed words | Walked 13/13; flagged Worn head (real) + Debris (not there); REVEAL | KEY "2 MISSED"; "You found 1 fault and missed 2, flagged 1 line that was not there — no credit yet." | PASS |
| Drum Tuning ch5 s4 | F8-6 GOAL SHORT intro | Read intro; ✓ CHECK; DAMPING +4; ✓ CHECK with no strike | Intro "The step opens on GOAL SHORT: raise DAMPING, tap ✓ CHECK…"; "Goal met. Sustain 0.36 s — short." | PASS |
| Drum Tuning ch3 s2 | F8-7 CAN'T LISTEN NOW | ▶ TAP with sound off, then the new key | "◉ CAN'T LISTEN NOW · SHOW THE MAP" → LUG PITCH 243 Hz, SPREAD 195 ¢, "Shown without listening: the map says lug 2 is the highest…" | PASS |
| Drum Tuning ch7 s2 | F8-8 CAN'T LISTEN NOW | ▶ STRIKE with sound off, then the new key | "◉ CAN'T LISTEN NOW · USE THE READOUTS" → "Working from the readouts: SPREAD reads 226 ¢ and BEAT 8.4 Hz… Now open WHERE?"; WHERE? key appears | PASS |
| Drum Tuning ch7 s4 | F8-9 review line | Opened the review | "Cleared 0 of 5; you have not named a cause yet." | PASS |
| Drum Tuning ch7 s3 | F8 ph2 decision-card reasons | Two different wrong picks | 1st "✗ The drum still sounds wrong… What does a device leave out?"; 2nd adds the explanation | PASS |
| Tuning | F8-11 ch 0/7/11 marked by NEXT | NEXT on ch1, ch8, ch12 (0-based 0, 7, 11); then contents | "Module 1 … done", "Module 8 … done", "Module 12 … done"; task chapters not marked | PASS |
| Tuning | F8 ph2 chapter finish lines, captions | WHAT'S LEFT; bezels | "HOW A CHAPTER COUNTS…"; rows "Still to do: …" (e.g. "the mini challenge, place a 3:2 ratio on the pitch rail."); captions "starting note", "twice the root", "latest note", "its ratio", "off equal" | PASS |
| Cymatics | F8-12 HOME opens | `#labpreview/CymaticsLab` | Home with studios, modules, the check | PASS |
| Cymatics | F8-13 check on both end screens | HOME → SEE WHAT'S LEFT; `CymaticsModule/experiments` → FINISH | Both: "…modules plus the check not done yet", 5 questions drawn, a CHECK row, HOW A MODULE COUNTS | PASS |
| Cymatics Membrane | F8-14 title not cut (390) | Measured title box | "MEMBRANE & LOUDSPEAKER", 48 px tall = scrollHeight 48 | PASS |
| Cymatics Membrane | F8-14 at 320 | Reloaded at 320 | Box 61 px wide, scrollHeight 96 > 48: reads "MEMBR / ANE & …" | **FAIL-3** |
| Cymatics Gallery | F8-15 empty intro | Opened with no cards | "No cards yet? Open a studio from NOTHING SAVED YET and press SAVE…" | PASS |
| Ear Training | F8-21 "n answers" + NEEDS SOUND | Frequency Recognition; one answer | Before: "— · last 20"; question "Which tone is higher?  NEEDS SOUND"; after: "0% · 1 answer" | PASS |
| Speech | F8-23 five stages | Page 2 intro | "How a voice is built in five stages…" | PASS |
| Speech, Envelope | F8-24 GOT IT line | Speech p9, Envelope p6 GOT IT › | "✓ THIS PAGE IS DONE · NEXT MOVES ON" on both | PASS |
| Speech | F8 ph2 lab-local reasons | p11, two different wrong picks | Reason, then reason + explanation; the 2nd miss says "Put a finger on your throat" twice in a row | **FAIL-4** |
| Envelope | F8 ph2 lab-local reasons | p7, two different wrong picks | "The release is the fade at the end… Look at the other end of the shape."; then reason + explanation | PASS |
| Noise, Harmonics, Autotune, Harmonograph, Bass | F8 ph2 FINISH + sound-off lines | Each: CHECK tab; read the line | FINISH in all 5 (Oscillators seen by F8); e.g. Autotune "Sound off? AMOUNT and SPEED still redraw each note: watch ENDS." | PASS |
| Harmonograph (+ Oscillators, Noise, Modular, Bass by code) | F8-20 silent first step | Intro card; guides | "Watch the pen draw at the opening 3:2. Open TUNE…"; the guides open on WAVE, COLOR, PATCH, FRET | PASS |
| Miking I01a | F9-1 Contents → Module 1 keeps NEXT | Contents → Module 1, walk 1→6 | "step 1 of 6" … "6 of 6"; last NEXT "Next: Mic it — where the mics go" (no FINISH) | PASS |
| Miking I01a | F9-2 first-render flash | MutationObserver on body while NEXT into 2.1 and 3.1 | No node, text or aria-label with TAKEAWAY or FINISH recorded | PASS (DOM); painted-frame check NOT SEEABLE (phone) |
| Miking F01 | F9-3a overlapping zone counts; 3c wording; 3d AIM | ZONE ▸ "Close, in front or to one side" | NOW "Zone: Close, in front or to one side…"; "done ✓ — the mic rested in two different zones… (In front, a little to one side; Close, in front or to one side)"; bezel "≈ 0° off target", dock "↓ ≈ 50°" | PASS |
| Miking F01 | Next to F9-4a: NOW line wording | Read NOW line | "Zone: …to one side, A suggested start: …" / "…, Start about…" (comma then a capital) | **FAIL-6** |
| Miking E07 | F9 ph2 ZONE across mic types | Picked guitar 12th fret, then piano treble | SETUP → "SMALL COND", then "SMALL COND · grand piano"; activity "done ✓", then "3 different zones" | PASS |
| Miking M10 | F9 ph2 ZONE | Picked "Far out, in a front corner" | SETUP → "PENCIL"; "done ✓" | PASS |
| Miking F10 | F9 ph2 ZONE (own studio) | Picked seated, then singer | "none yet" → "one so far" → "done ✓ — the rig rested in two different zones" | PASS |
| Miking B13 | F9-3b sport ZONE; 4d "center" | ZONE C, then "Lower at M, on A" | TARGET follows (C, then A); "done ✓ … on an approved place"; dock "AIM: center" | PASS |
| Miking M01 | F9-8 Kick one-zone key | SETUP → Boundary; ZONE; pick "Level with the front head" | ZONE now lists every zone; SETUP → "DYN · CARD"; counted | PASS |
| Miking M01 | F9 ph2 end rows | Contents → What's left | "01 … Still to do: answer its 2 checks." … "05 … put the wedge in the mic's quiet side (live), then answer its 4 checks." | PASS |
| Miking M01 | Next to the F9 end rows: units | Same screen | "8 pages not done yet" / "HOW A PAGE COUNTS" / "Start with the first page", but the body says "A module counts…" | **FAIL-7** |
| Miking M11 | F9-7 STAGE prompt | Walked to 4.1 | "Tap STAGE ▸ and go through the stages…"; key "STAGE: 1 of 4 · one mic" | PASS |
| Miking C05C, I01a, F01, E07 | F9-4b "a ukulele"; ABOUT chip; "Can't listen now?"; no ".." | Read | "New to miking a ukulele" (0 × "an ukulele"); one chip "ABOUT"; "Can't listen now? Nothing in this lab makes a sound…"; no ".." found | PASS |
| Mic Selection | F9-6a SHOW WHAT FITS (lesson 9) | Live vocal → SHOW WHAT FITS ▾ | 4 lines with lessons, e.g. "Feedback rejection → a directional pattern… (Lesson 3)"; "Next, the challenge asks you to choose one and defend it." | PASS |
| Mic Selection | F9-6b COMPARE keeps the mic | Ribbon → COMPARE → Condenser → COMPARING | "Pick one more microphone to place beside Ribbon."; both cards; COMPARING → Condenser only | PASS |
| Mic Selection | F9-6c photo names | Computed style | 11px | PASS |
| Mic Selection | F9 ph2 check cards (lesson 9) | Two different wrong picks | "NOT QUITE — TRY ANOTHER · A label describes common use…", then "NOT QUITE · Plenty of mics sold for vocals… " + explanation | PASS |

Tally: 59 rows. PASS 48: the "PASS (DOM)" row (Miking flash) and the "PASS (code)" row (Delay / De-Esser / Distortion copy) count as PASS. FAIL 7. NOT SEEABLE 4: EQ mic tap on a phone, the Binaural drag, silent starts in the 5 route-less labs, FINISH in the 8 route-less labs. Two partial gaps sit inside other rows: the painted frame of the Miking flash (phone only), and Flanger on screen (no route; it is FAIL-2 from code).

## 3. FAIL list

**FAIL-5 (HIGH, shared, regression next to F8-1): the fader "+" / "−" keys jump to the end in one tap**
- Repro:
  1. `#labpreview/BassLab`, KEEP SOUND OFF, EXPLORE. FRET reads OPEN.
  2. Tap the "+" at the right end of the FRET lane (a11y "FRET: one step up…"), a real click.
  3. FRET reads "12 of 12". One tap on "−" goes straight back to OPEN. The guide asks for FRET 7 and FRET 5, which the keys can never reach.
- Cause:
  - `src/screens/lab/rack/RackUnit.tsx:1019` calls `laneStepValue(param.value, dir, param.format)`.
  - `src/screens/lab/rack/laneStep.ts:39-50` walks until `format(next)` differs from `format(cur)`.
  - Bass's format ignores its argument (`BassLabScreen.tsx:503`, `format: () => (fret === 0 ? 'OPEN' : …)`), so the readout never changes during the walk and it runs to 0 or 1.
- Reach: `format: () =>` appears 299 times in 105 files under src/screens/lab, including EQ Lab mod 1 LOW CUT (`SeeingFrequency.tsx:338`), Miking, Cymatics, Tuning ch7 and Digital/Gain/Wave modules. Every such lane without its own `nudges` should behave the same way. I confirmed it on Bass only.

**FAIL-1 (low; web and builds without effect audio): the GR caption contradicts the MODEL value**
- Repro: `#labpreview/CompressionLab`, KEEP SOUND OFF, SOURCE → SINE 440 Hz.
- The bezel shows "GR 15.0 dB MODEL". The GAIN REDUCTION line under it still says "…nothing is measured here and GR reads — dB…", and adds "On CLICK, the GR PEAK…" even though the source is SINE. The Limiter takes the same path.
- Suspect: `src/screens/lab/FxLabScreen.tsx:125`. The MODEL sentence is used only when `soundOff && fxReady`. When `fxReady` is false (lines 132-134), the old "— dB" sentence prints while `grModelDb` (line 629, `silent` at 651) still fills the cell. On a phone with effect audio this does not happen.

**FAIL-2 (low, wording): Flanger guide still says "evenly spaced notches" without "in Hz"**
- `src/screens/lab/flangerScreenGuides.ts:50`, the WHAT YOU'RE LEARNING line: "…cancels the dry sound at evenly spaced notches…". Line 103 also reads "a row of evenly spaced notches".
- This is the first card the learner reads over the octave-scale picture. The rack copy itself is fixed.
- Could not be seen on screen: there is no preview route.

**FAIL-3 (low, 320 only): the Membrane studio title is still cut**
- Repro: viewport 320x844, reload `#labpreview/CymaticsMembraneStudio`.
- The header title box is 61 px wide and needs 96 px of height for 48 px of room, so it reads "MEMBR / ANE & …" with a break inside the word.
- Fine at 390. Suspect: `MembraneStudioScreen.tsx:490` (title) with `kit/LabNavBar.tsx:128` (2-line cap).

**FAIL-4 (low, wording): Speech check, the second miss repeats itself**
- Repro: `#labpreview/SpeechLab`, module 11, card "S and Z…". Pick "Z is louder…", then "Z rounds the lips…".
- The screen shows: "The lips stay the same for both. Put a finger on your throat and say each one. Same mouth, folds off versus on. Put a finger on your throat: Z buzzes…"
- Suspect: `src/screens/lab/speech/speechCheckWhy.ts:25` (and the other "why" on that card). The why repeats the explanation's own instruction.

**FAIL-6 (low, wording, next to F9-4a): the Miking NOW line runs label and band together**
- Repro: `MikingLesson/F01`, 4.2 (the same in E07 and M10).
- NOW reads "Zone: In front, a little to one side, Start about 0.9–1.8 m…" and "…Close, in front or to one side, A suggested start: …". There is a comma, then a capital.
- Suspect: `sceneWords.ts` micWords `zoneLabel` (`${z.label}, ${z.band}`). An em dash or a full stop between them would read cleanly.

**FAIL-7 (low, wording): the Miking end screen mixes "page" and "module"**
- Repro: `MikingLesson/M01` → contents → What's left.
- "8 pages not done yet", "HOW A PAGE COUNTS" and "Start with the first page" sit beside "A module counts the moment its activity is done…" (the `howItCounts` from F9 phase 2) and module rows.
- Suspect: the unit word passed to LabEndScreen from `MikingLessonScreen.tsx`, against `engine/progress/missingLine.ts` / `howItCounts`.

## 4. Other notes (not counted)

- The 8 effect labs without a preview route (Delay, Reverb, Chorus, Flanger, Phaser, Limiter, Distortion, Phase) cannot be checked on screen. Adding them to `src/dev/webPreviews.tsx` LAB_PREVIEW_SCREENS would let a later round see them.
- Phaser's WHERE TO START still opens on "Tap ▶ and watch the amber dips sweep" (phaserScreenGuides.ts:49). It was not in F7's item-6 list.
- Drum Tuning ch3 s2: after SHOW THE MAP, the line "YOU ARE LOOKING AT: an uneven head with its color map hidden" is not updated.
- Miking studios disagree about the starting pose:
  - F01, E07 and M10 count the start zone at once ("one so far").
  - F10 says "none yet" while the rig already sits in a zone.
  - B13 also says "none yet" at the start.
  - The words also switch between "two different zones" and "3 different zones".
- Binaural bezel AZ cell drops its key and wraps "+30" / "° front-right". This was already recorded by G6 (line 16); it is not a regression.
- Number-of-total counters seen ("WALKED 1 / 13", "MET 0 / 4", "(cleared 0 of 5)", "0 of 7 correct this visit", "LESSON 1 · 1 OF 11"). Each looks older than this round; I did not check git history.
- Not re-checked, because F7/F8/F9 already saw them working on screen: Harmonics labels after SQUARE, E11 group ZONE, A04b "a euphonium", Mic Selection lesson 4 card.
