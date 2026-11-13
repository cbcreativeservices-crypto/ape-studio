# Bug test GA2 — Game Audio Lab, pages 12 to 22 and the END screen (2026-11-13)

Tester: GA2 (one of four). Browser pane, own tab, 390 x 844 emulated, sound OFF (Sound Safety never accepted).
URL: `http://localhost:8142/#labpreview/GameAudioLab`. Evidence: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\bugtest_ga2\`.

Method notes: the strips are Skia canvases (WebGL, cannot be read back), so each strip was read three ways: its accessibility label (the strip's own summary, drawn from the same model), a 2x/3x CSS magnification of the canvas, and the readouts/log. The browser pane was HIDDEN for the whole run (`tabs_context`), so the canvas repaints late (about 0.5–1 s); every "strip lags" observation was re-checked after a 1 s wait before judging.

Counts: **2 S1, 5 S2, 10 S3** (17 bugs). Plus two held frame faults seen again (not re-reported).

## 1. Controls table

### Page 12 — Walls, doors and rooms
| Control | Purpose | Result | Seen |
|---|---|---|---|
| WALK fader | Move along the path west–east | PASS | Drag to far west: COURTYARD · 8.1 m TO WALL, GEN 1 VIRTUAL, card explains 12 m max. Door closed: stops at wall, log NOTE "no step was taken" |
| ‹ STEP WEST / STEP EAST › | One step with a footstep | PASS | 0.7 m per step (3.8 m to wall → 6 steps → 0.4 m IN); log footstep on wood |
| WALK dock key | Shows side of wall | FAIL (S2) | Value "WORKSHOP" is cut to "WORKSH…" in the key (B-03) |
| OPEN/CLOSE DOOR | Door | PASS | DOOR readout, GEN 1 MUFFLED/CLEAR, strip curve flat 0 dB ↔ −9 dB + 900 Hz low-pass bend, a11y label agrees |
| ROOM ▸ tray: GENERATOR 1 | Start/stop the source | PASS | PLAYING 1, VOICES 2/16; strip title "IF GENERATOR 1 PLAYED" (amber, dashed curve) when off |
| ROOM ▸ REVERB / DRY | Reverb send | PASS | DRY: strip "DRY: NOTHING SENT", tail removed, log "MIX: SETTING workshop reverb: OFF"; REVERB inside −11 dB, outside −18 dB |
| SOUND / ■ STOP | (frame) | not re-tested here | — |
| Check | | PASS | Wrong answer "Calculates…" explained; correct latches |
| Goals (5) | | PASS | All five latched from the written steps |
| Screen guide (5 steps) | | PASS with S3 | Step 1 says GEN 1 reads MUFFLED or CLEAR only; it also reads OFF and VIRTUAL (B-17) |
| FULL SCREEN 1x/2x/FIT | | PASS | Strip grows with the scene (2x: 748 x 99; FIT 672 x 89) and pans with it |

### Page 13 — Output formats
| Control | Purpose | Result | Seen |
|---|---|---|---|
| FACING fader | Turn the listener | PASS | 90°→185°→10°→315°→40°; FOUNTAIN readout BEHIND/LEFT/AHEAD agrees with the scene and the strip dot |
| OUTPUT ▸ STEREO | Stereo pan | PASS | Strip: dot on the ear line, "AHEAD AND BEHIND LOOK THE SAME"; L −11.1 / R −22.8 dB facing 90° (fountain behind-left) |
| OUTPUT ▸ HEADPHONE 3D | Binaural | PASS | Head circle, dot moves round it; "ESTIMATED: LEVEL IS NOT ALL"; log RENDERER: headphone 3D |
| OUTPUT ▸ MONO | Downmix | FAIL (S2) | Both bars equal, but they move by 2–3 dB as you turn without moving (B-04) |
| SCENE | Fountain + beds | PASS | PLAYING 3; strip "NO POSITIONED SOUND IS PLAYING" when off / after ■ STOP |
| ■ STOP | | PASS | Log "STOP ALL…"; strip empty |
| Goals (4), check | | PASS | Wrong "Each ear cup…" explained; all goals latched |
| Clean open from p12 | | PASS | Player back at 5.2, 5.0 facing 90°, door closed, generator off |

### Page 14 — Adaptive music
| Control | Purpose | Result | Seen |
|---|---|---|---|
| MUSIC ▸ START / STOP MUSIC | | PASS | Strip clock runs; stop clears pending and stinger |
| MUSIC ▸ CALM/PULSE/DRIVE | Layers | PASS | PENDING tray countdown 1.2→0.8→0.4 s then "Nothing is waiting."; log QUEUED → APPLIED exactly at the bar |
| MUSIC ▸ MOOD CALM / ALERT | State | PASS | "Add PULSE and DRIVE" queued; change of mind → "WITHDRAWN: a newer one replaces it" |
| MUSIC ▸ STINGER | | PASS | PENDING readout counts 6.1→0.3 s, then PLAYING 1, log "its hit lands on the line" |
| CHANGE AT ▸ NOW/BEAT/BAR/PHRASE | Boundary | PASS (BAR, PHRASE tested) | Strip countdown agrees with PENDING (3.3 s / 3.3 s seen) |
| Strip accessibility label | | FAIL (S3) | Beat number lags up to one beat, reads "bar 4, beat 4" right after START (B-11) |
| Goals (5), check | | PASS | Wrong "ALERT for one bar…" explained |

### Page 15 — Dialogue and languages
| Control | Purpose | Result | Seen |
|---|---|---|---|
| LINES ▸ GREETING · 80 | | PASS | SPEAKING GREET, PRIORITY 80; strip bar fills 0.5 of 2.8 s; caption in tray and well |
| LINES ▸ WARNING · 95 | Interrupt | PASS | Strip "interrupted at 0.7 seconds"; log "INTERRUPTED by a more important line" |
| GREETING during WARNING | Refuse | PASS | Tray "REFUSED · Guide: greeting REFUSED…"; strip marks refusal |
| LANGUAGE ▸ SPANISH | | PASS (first time seen on screen; audit section 6 item) | Strip bars 3.4 s / 2.0 s (English 2.8 / 1.7); START line names vo_guide_greeting_ES.wav; caption "El generador está en el taller. Sigue el camino de piedra."; switching back to ENGLISH mid-line keeps the Spanish caption and 3.4 s for the take already playing (correct) |
| ■ STOP mid-line | | PASS | Caption returns to "Quiet: nobody is speaking." |
| Goals (5), check | | PASS | |

### Page 16 — The game mix
| Control | Purpose | Result | Seen |
|---|---|---|---|
| SOUNDS ▸ SCENE / GENERATOR 1 / MUSIC | Busy scene | PASS | Meters: ambience −8, effects −20, music −3 dB |
| SOUNDS ▸ GUIDE LINE | Duck | PASS | DUCK DUCKING; strip "ambience ducked −8 dB, music ducked −10 dB, effects ducked −5 dB"; back to READY when the line ends; log DUCK on/off |
| SOUNDS ▸ CHAT LINE | No duck | PASS | DUCK stays READY; chat meter −6 dB |
| SOUNDS ▸ ALARM / VISUAL CUE | | PASS | OVERHEAT sign by generator |
| MIX ▸ DUCK ON / OFF | | PASS | DUCK OFF: line plays, nothing ducked |
| MIX ▸ MUTE / SOLO ×6 | | PASS | Strip MUTED / SOLO / SILENT per bus; selected bus marked ▸ in amber |
| BUS key chooser + fader | | PASS (S3 notes) | EFFECTS chosen: readout label becomes EFFECTS, fader 0 → −24 dB, meter −20 → −44 dB. Chooser marks the chosen bus by highlight and its blurb (acceptable); log prints "-24 dB" with ASCII hyphen (B-15) |
| Goals (5), check | | PASS | |

### Page 17 — Budgets and voice limits
| Control | Purpose | Result | Seen |
|---|---|---|---|
| BUDGET fader, ‹ FEWER / MORE › | | PASS | 16→12→8→4→2→1; held at 1 by the protected alarm |
| BURST | | PASS | Budget 8, 5 loops: 9 STOLEN (5 loops went virtual, 4 impacts stopped) and loops return after; arithmetic checked |
| SOUNDS ▸ ALARM, then BURST | | PASS | Alarm kept (protected), 10 more stolen |
| Budget 1 + BURST | | PASS | REFUSED 12; strip "✕ REFUSED 12" |
| SOUNDS ▸ SCENE / GENERATOR 1 / STEP / WARNING LINE | | PASS (STEP, WARNING not individually judged) | |
| Strip accessibility label | | FAIL (S3) | Says loops are "waiting … after theirs was stolen" when they gave up their voice because BUDGET was lowered (B-08) |
| Goals (4), check | | PASS | |
| First-visit intro card | | (known held frame fault) | Rose over the open SOUNDS tray one second after the page opened — the held fault (2), not re-reported |
| ‹ FEWER at the protected floor | | FAIL (S2) | ALARM + WARNING LINE, FEWER ×6: stays "2 VOICES", nothing on screen says why (B-05) |

### Page 18 — Multiplayer sound
| Control | Purpose | Result | Seen |
|---|---|---|---|
| SEND ▸ DOOR · NEW ID | World action | PASS | "on its way" at 92/184 ms, "played" at 312 ms (0.25 s); door opens, door_open.wav START; card both machines PLAYED |
| SEND ▸ A1 AGAIN (ID CHECK ON) | Duplicate | PASS | Strip and card "ignored as a duplicate"; log "ARRIVED AGAIN: it was already handled, so it is ignored" |
| ID CHECK toggle | | PASS | Readout ON/OFF; log "MIX: SETTING network ID check: OFF/ON" |
| A1 AGAIN (ID CHECK OFF) | Double | PASS | "played a second time, a double", door does not move again; earlier "ignored" result kept on the strip |
| ALERT TO YOU / ALERT TO OTHER | Private | PASS | A2 plays the interface cue here only; A3 plays nothing here |
| CHAT LINE | Stand-in chat | PASS | CHAT bus START |
| ■ STOP while an action travels | | FAIL (S1) | Card stays "… ON ITS WAY" on both machines forever (B-02) |
| Goals (4), check | | PASS | Wrong "Play the door again…" explained |

### Page 19 — Testing and fault finding (all five faults from a clean open)
| Control | Purpose | Result | Seen |
|---|---|---|---|
| Fixing before the symptom | Must not count | PASS | Fault 1 started then DOOR FILE corrected at once: FAULTS 1 → 0, FIXED stays 0, chip back to "not started" |
| Fault 1 (door file) | | PASS | TEST ▸ OPEN DOOR: chain strip "door layer: its file is not in the build"; log FAULT "door_open_v2.wav is NOT IN THE BUILD"; FIX door_open.wav → FIXED 1; next door press: chain all green |
| Fault 2 (voice bus) | | PASS | GUIDE LINE → EFFECTS bus, mix strip shows no duck; FIX DIALOGUE → FIXED 2; next line: DUCK on, ambience −8/effects −5/music −10 |
| Fault 3 (takes) | | PASS | STEP: GUIDE ×3: takes strip "take 1 of 4 again ×3, Variation is off"; FIX VARIATION · ON → FIXED 3; new steps take 4, 1, 3 with ±cents |
| Fault 4 (surface scope) | | PASS | Guide on wood logs "SWITCH surface = stone"; sync strip "the guide's read stone"; FIX FOR EACH CHARACTER → wood |
| Fault 5 (orphan loop) | | PASS (S3 note) | REMOVE GENERATOR 2: log FAULT ORPHAN, PLAYING 2, voices strip keeps HUM 2 / FAN 2 (not marked as having no owner, B-10); FIX + ADD/REMOVE → stopped, FIXED 5 |
| TEST tray: STEP: YOU, YOU: STONE PATH / WORKSHOP | | PASS (not every path) | |
| Check | | PASS | |

### Page 20 — Finding your way in the tools (operable tool-window display)
| Control | Purpose | Result | Seen |
|---|---|---|---|
| WINDOW slider 0…8 | Light each window | PASS | 1 SOUNDS … 8 PROFILER, each lit and given the room; label "WINDOW n · NAME" |
| TOOL ▸ ANY / WWISE / FMOD STUDIO / UNITY / UNREAL ENGINE | Relabel | PASS | Profiler reads Profiler layout / Profiler window / Audio Profiler module / Audio Insights; Unreal windows read Random node in a Sound Cue, Sound Cue or MetaSound Source, Sound Submix, Control Bus Mix |
| SCENE ▸ door / GENERATOR 1 / STEP / MUSIC / GUIDE LINE | Windows show what plays | PASS | "Playing now: Generator, Door, Footstep…"; music window play line, mixer meters, audition "PLAYING 3.8 s" |
| Profiler window time | | FAIL (S3) | Prints the lab's running clock "MIX 1096.7 s" (B-12) |
| Six checks (wrong first on all six) | | PASS | Six wrong explanations shown; page marked done after the sixth |
| FULL SCREEN 1.5x/2x | | PASS | Stage re-lays out larger, text ≥ 9 px |

### Page 21 — Game audio today
| Control | Purpose | Result | Seen |
|---|---|---|---|
| TOPIC ▸ RULES | | PASS | Generator on, mix strip; SPEED 0→100 %: EFFECTS −22 → −17 dB |
| TOPIC ▸ SPACE | | PASS | Wall strip, −9 dB / 900 Hz, OPEN DOOR key |
| TOPIC ▸ MUSIC | | PASS | Music strip, "ALERT waits… 2.8 seconds to go"; CALM/ALERT key |
| TOPIC ▸ ACCESS | | PASS | Alarm + OVERHEAT sign, greeting caption, lines strip |
| TOPIC ▸ TEST | | PASS | Budget 8, burst: strip 8/8, STOLEN in log |
| TOPIC ▸ AI | Says no AI | PASS | Note "This lab uses no AI…", scene quiet, empty bus meters |
| SPEED slider on page open / AI / MUSIC / ACCESS | | FAIL (S1) | Moves the number only; nothing plays (B-01) |
| Two checks | | PASS | Wrong first; page done |

### Page 22 — Capstone (all seven goals from a clean open, by the hints, sound off)
| Control | Purpose | Result | Seen |
|---|---|---|---|
| SHOW A HINT | | PASS | One hint at a time, follows the first open goal |
| MOVE ▸ STEP FORWARD / GO: GRAVEL / GO: WORKSHOP | | PASS | Goal 1 (stone take 3, 2; gravel take 2) and goal 3 (ZONE line) latched |
| SOUNDS ▸ GENERATOR 1 + SPEED slider after closing | | PASS | Goal 2 latched at 94 % |
| SOUNDS ▸ SCENE, OPEN DOOR | | PASS | Goal 4 (rattle layer) |
| SOUNDS ▸ GUIDE LINE | | PASS | Goal 5, mix strip ducked |
| MUSIC ▸ MUSIC ON, ALERT | | PASS | Strip switches to MUSIC; goal 6 "APPLIED exactly on the bar line" |
| SOUNDS ▸ VISUAL CUE, ALARM | | PASS | Goal 7; "All seven are met…" note |
| Slider under open MOVE/SOUNDS tray | Known shared-frame fault | Title tells the truth | MOVE tray title "CLOSE THIS: THE SLIDER TURNS YOU" with the SOUNDS slider below; SOUNDS tray "CLOSE THIS: THE SLIDER IS SPEED" with the MOVE slider below. Not re-reported |
| REPORT ▸ PLATFORM / LISTENING | | PASS | One choice each (CONSOLE replaced by XR); summary card text complete; SHARE SUMMARY not pressed (brief) |
| CLEAN SCENE | | PASS | Scene clean, goals stay ✓ |
| Check (optional) | | PASS | |
| Strip follows the tray | | PASS | MIX ↔ MUSIC; mood frame orange at ALERT |
| Music bus meter at ALERT | | FAIL (S3) | "+2 dB" in red (B-09) |
| FULL SCREEN 1.5x | | PASS | Music strip grows with the scene (561 x 74) |
| 320 px wide trays | | FAIL (S2) | Chips the hints name fall below the fold (B-06) |

### END screen
| Control | Purpose | Result | Seen |
|---|---|---|---|
| FINISH › | Reach the end screen | PASS | "WHAT'S LEFT · 11 pages still to go" + guest note |
| Page rows 01–11 | Jump | PASS (not each) | |
| REVIEW ▾ / HIDE ▴ | | PASS | Lists 12–22 ✓ DONE; page 15 opened from it on a clean scene with goals empty (fresh practice), still counted done |
| PRACTICE AGAIN / DONE · BACK TO LABS / DISCUSS | | NOT TESTED | Brief forbids DONE and DISCUSS; PRACTICE AGAIN would wipe the other testers' shared progress state, so not pressed |
| First-visit intro card | | (known held frame fault) | "WHERE YOU ARE" card arrived a second late over the list |

### Navigation between pages 12–22
| Path | Result | Seen |
|---|---|---|
| NEXT / PREV / page list | PASS | Every page opened on a clean scene: p12 → p13 (player reset, generator off), p16 bus fader −24 dB → p22 faders 0 dB, p14 music running + stinger waiting → p15 PLAYING 0, p15 line speaking → p14 STOPPED, p17 budget 1 → p18 0/16 |
| Browser BACK | NOT TESTABLE | Lab pages push no history ("no back history") |

## 2. Bugs (most serious first)

**B-01 · p21 Game audio today · S1** — SPEED is the page's slider (the dock opens on it) but does nothing on page open, and on the AI, MUSIC and ACCESS topics.
Steps: open p21; do not choose a TOPIC; drag SPEED from 40 % to 100 %. Or choose TOPIC ▸ AI and drag SPEED.
Expected: the slider changes something the learner can see, or is not offered.
Happened: only the label changes ("GENERATOR 1 · 100%"); PLAYING 0, the scene says "Nothing positioned is sounding", every bus "nothing playing". House rule: a word that changes while the picture stays still.
Evidence: `measurements.md` (p21 section).
Cause: `pages/p21Today.tsx:173` puts `speedKey(s)` in the dock for every topic, and `initialParam: 'speed-generator-1'` (l.174) makes it the first control.
Smallest fix: show SPEED only for RULES, SPACE and TEST (the topics with the generator running), and open the page with TOPIC as the first key; or start the page on RULES.

**B-02 · p18 Multiplayer sound · S1** — ■ STOP while an action travels leaves the card saying it is still on its way, forever.
Steps: open p18 › SEND › DOOR · NEW ID › within 0.25 s press ■ STOP. Wait.
Expected: the card says the message was dropped (STOP ALL withdrew it), or clears.
Happened: 3 s and later, both machines still read "… ON ITS WAY", the card "It is on its way: it arrives 0.25 seconds after it was sent." The door never moves, the strip omits A5, and the log's last lines are "STOP ALL … every waiting change is withdrawn" and "Action A5 (door) SENT: it arrives in 0.25 s" (no line saying A5 was dropped). A lie on screen.
Evidence: `B-02_p18_on_its_way_forever_after_STOP.jpg`, `measurements.md`.
Cause: `pages/p18Multiplayer.tsx:107-118` shows the pending card whenever `arrival` is null; a withdrawn flight never produces an arrival.
Smallest fix: when the model withdraws the flight (stopAll), give the card a "NOT DELIVERED · ■ STOP" state (or clear `last`), and log one NETWORK line "Action A5 withdrawn by STOP ALL".

**B-03 · p12 Walls, doors and rooms · S2** — WALK key value cut at 390 wide.
Steps: open p12, open the door, STEP EAST until you are inside.
Expected: the WALK key reads WORKSHOP.
Happened: the key reads "WORKSH…" (zoomed capture). A cut-off label.
Evidence: `B-03_p12_walk_key_WORKSH_cut_390.jpg`.
Cause: `p12Walls.tsx:84` `formatShort: () => walkPlace(gaGet())` returns "WORKSHOP" into a key about 60 px wide.
Smallest fix: a short form of six letters or fewer for the key (for example YARD / ROOM, or INSIDE / OUTSIDE), keeping WORKSHOP on the fader line.

**B-04 · p13 Output formats · S2** — In MONO the level still changes with direction, while the screen says direction is gone.
Steps: open p13 › SCENE on › OUTPUT ▸ HEADPHONE 3D › OUTPUT ▸ MONO › drag FACING without moving.
Expected (from the tray blurb "Distance still sets the level. Direction is gone." and step 3 "In MONO both bars stay equal as you turn"): the two equal bars stay at one level.
Happened: both bars equal, but they move: −16.3 dB (fountain ahead) / −17.4 / −18.3 dB (fountain left): 2 dB from turning alone (up to 3 dB with STEREO). Guide try-this "Choose MONO and turn all the way around. You can no longer tell where the fountain is" is contradicted by the meter.
Evidence: `measurements.md` (B-04 section, numbers from the strip label).
Cause: `model/gaModel.ts:2083` `if (s.mono) l = r = (l + r) / 2;` folds AFTER the equal-power pan (centre −3 dB, side −6 dB).
Smallest fix: decide which is true and make both say it: either fold power-preserving (`l = r = Math.sqrt((l*l + r*r) / 2)`, constant for an equal-power pan; the engine's mono node must match), or keep the fold and say in the blurb that a mono fold of a panned sound still changes level by up to 3 dB with direction (the pan law).

**B-05 · p17 Budgets and voice limits · S2** — ‹ FEWER silently does nothing at the protected floor; the reason is filtered out of the page's log.
Steps: open p17 › SOUNDS ▸ ALARM, WARNING LINE › press ‹ FEWER six times.
Expected: something on screen says why the budget stops at 2.
Happened: BUDGET stays "2 VOICES"; the page log (STOP/REFUSED/STATE only) shows nothing. The model did write the reason ("BUDGET: 1 asked, but 2 protected voices are sounding. The budget stays at 2"), as a MIX line the page hides. Only the guide's try-this explains it.
Evidence: `measurements.md`.
Cause: `p17Budgets.tsx:244` `only={['stop', 'refused', 'state']}`; model `gaModel.ts:1617`.
Smallest fix: let MIX lines that begin "BUDGET:" through the filter, or print "HELD AT 2 · PROTECTED" on the fader line while `budgetHeld`.

**B-06 · p22 Capstone (and dock) at 320 px wide · S2** — chips the hints name fall below the tray's fold.
Steps: emulate 320 x 700, open p22, open SOUNDS, MOVE, REPORT.
Expected: every chip a hint or step names is visible.
Happened: the dock wraps to two rows; SOUNDS: ALARM and VISUAL CUE 15 px and CLEAN SCENE 63 px below the fold (goal 7's hint names both); MOVE: GO: WORKSHOP 15 px below (goal 3's hint); REPORT: the five LISTENING chips 46 px below (step 4 names LISTENING); "HANDHEL" cut. At 390 x 844 all fit.
Evidence: `B-06_p22_report_tray_320x700_below_fold.jpg`, `measurements.md`.
Cause: the six-key dock wraps at 320 and the tray height is fixed for one dock row (shared frame plus p22 trays).
Smallest fix: keep the dock on one row at 320 (smaller key padding) or let the tray height follow the dock height.

**B-07 · p12 strip at 320 px wide · S2** — wall strip text collides.
Steps: emulate 320 x 700, open p12.
Happened: "IF GENERATOR 1 PLAYED" runs about 30 px into the REVERB window (through the tail); "900 Hz" touches "ROOM REVERB"; "ROOM REVERB" touches "1.5 s". At 390 it just fits (the D touches the divider).
Evidence: `B-07_p12_strip_text_collision_320_mag2.5x.png`, `B-07_p12_320x700.jpg`.
Cause: `scene/hud/bWall.tsx:90-93,145` fixed column fractions (readout column 0.385W+17 … 0.7W−9 = 68 px at W 298).
Smallest fix: shorter title at narrow widths ("IF GEN 1 PLAYED" / "GEN 1 · PLAYING"), or give the readout column a minimum width.

**B-08 · p17/p21 voices strip label · S3** — the accessibility label says loops are "Waiting for a voice after theirs was stolen" when they gave up their voice because BUDGET was lowered (the page itself says that is not a theft). `scene/hud/cModel.ts:328`. Fix: "Waiting for a voice:" without the cause, or name the cause per voice.

**B-09 · p22 (and p16) music bus meter · S3** — at MOOD ALERT (three layers) the MUSIC bus reads "+2 dB" in peak red (rgb 255,95,78). Nothing on p16 or p22 says what 0 dB means on these computed meters, so a learner reads it as clipping in the default scene. Evidence `B-09_p22_music_bus_plus2dB_red.jpg`. Fix: one line on p16 about the meter's 0 dB, or trim the layers so ALERT stays under 0.

**B-10 · p19 fault 5 voices strip · S3** — the orphan's slots read "HUM 2 40 / FAN 2 40" like any live voice (no "NO OWNER" mark); the label is 1 px from the priority so it reads "HUM 240" (name ends x134.3, "40" starts x135.3, 9–9.5 px text). The strip that is meant to show the orphan does not say it. Evidence `B-10_p19_orphan_HUM2_40_crowded.png`. Fix: mark slots whose owner is gone ("NO OWNER"), and add 3 px between name and priority.

**B-11 · p14/p21/p22 music strip label · S3** — the strip's spoken beat lags up to one beat: right after START it reads "bar 4, beat 4" for about a beat, and it said "pulse sounds" while still "bar 3, beat 4" (the change lands on the bar line). `scene/hud/bMusic.tsx:94` floors ABSOLUTE scene time (`Math.floor(now / B_BEAT_S) * B_BEAT_S`), not time since `music.t0`. Fix: floor `(now − t0)` and add `t0` back. (The drawn play line uses `now` and is right.)


**B-12 · p20 profiler window · S3** — the PROFILER prints the lab's running clock ("MIX 1096.7 s" after 18 minutes in the lab), not time on this page or since the event; no learner can use that number. `scene/hud/cToolsStage.tsx:491` `log.t.toFixed(1)`. Evidence `B-12_p20_profiler_MIX_1096s.png`. Fix: seconds since the page opened (or since the line), or no time.

**B-13 · Console · S3** — 0 errors, but the Reanimated warning "using shared value's .value inside reanimated inline style … If you want a component to update when shared value changes you should use the shared value directly" floods: 7,677+ in the run; 216 in 3 s on p16 with the duck running, 476 in 3 s on p17 during BURST, 8 on p18. On the web the meters still move (re-render); on a phone a style built from `.value` at render may NOT update between renders. Unverified on a device. Candidates: `scene/hud/cKit.tsx:185`, `cMix.tsx:73`, `cNet.tsx:60`, `cToolsStage.tsx:318`. Fix: read `.value` only inside `useAnimatedStyle`.

**B-14 · p14 music · S3** — a request that changes nothing still waits: after a withdraw, ALERT queued "Add PULSE and DRIVE (that is what plays now, so nothing changes): lands at the end of the phrase in 4.5 s", with PENDING counting and the strip's diamond for a change that does nothing. Also MOOD ALERT while DRIVE already sounds says "Add PULSE and DRIVE". Fix: a request equal to what sounds withdraws the waiting one and queues nothing; word the add as "Add PULSE".

**B-15 · p16 log · S3** — "MIX: BUS EFFECTS: -24 dB" uses an ASCII hyphen; every other number in the lab uses "−" ("−24 dB" on the readout above it).

**B-16 · 320 px wide, small cuts · S3** — p20 profiler "the log is emp…" (9 px, ellipsis); readout labels "SURFA…", "PLAYI…" on p22 and p12 (the house rule allows a cropped readout to drop its label; here it is cut, not dropped).

**B-17 · p12 small truths · S3** — (a) guide step 1: "GEN 1 shows MUFFLED … and CLEAR when it is not": it also shows OFF and VIRTUAL; (b) card row "WORKSHOP REVERB: On, heard from outside" while GEN 1 is VIRTUAL and the strip says "NOT PLAYED NOW"; (c) strip label grammar "the generator 1 is playing". (`guides/p12.ts:15`, `p12Walls.tsx:187`, `bModel bWallSummary`).

**Held frame faults seen again (not re-reported):** (2) the first-visit intro card rose over the open SOUNDS tray on p17 a second after opening, and arrived late over the END screen list; (3) tray titles' "stays open …" is cut on p22 ("stays op…"). The p22 slider-under-tray fault: both tray titles tell the truth (checked above).

## 3. Not tested, and why
- **Sound**: never heard (Sound Safety not accepted, brief). All judgements are from the model, the strips, readouts and log.
- **Motion smoothness**: the Browser pane was hidden the whole run (`tabs_context`), so frames were throttled (canvas lagged 0.5–1 s). Movement was judged from successive readings, never from smoothness; the waiting stinger's pennant before it sounded could not be captured in a screenshot (it is in the strip label and code).
- **Reduce motion**: not switchable here; read in code (`bClock.useBNow` steps every 0.1–0.25 s, `bWall` jumps, `cMix`/`cVoices` use `useDecorativeMotion`). Not seen on screen.
- **A real phone**, Android BACK, rotation, landscape full screen: no device in this run.
- **Browser BACK**: the lab pushes no history in this preview.
- **END screen PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, DISCUSS, SHARE SUMMARY**: forbidden by the brief or would reset shared progress used by the other testers.
- **CHANGE AT ▸ NOW and NEXT BEAT** on p14 (BAR and PHRASE tested); whether a stinger with CHANGE AT NOW still counts as "on a boundary" was not checked.
- **Each screen guide step by step**: done on p12 (all five steps, highlights checked); pages 13–22 and END were checked by reading their guide text against what the screen did (findings in B-04, B-05, B-17), not by stepping each guide on screen.
- **p19 TEST tray paths**: YOU: WORKSHOP with the door closed (blocked heading) and STEP: YOU were not individually judged.
