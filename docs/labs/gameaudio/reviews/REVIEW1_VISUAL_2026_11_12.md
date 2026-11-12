# Game Audio Lab — visual and function review (browser, 390×844, sound OFF)

Reviewer: the visual/function reviewer (the only one with the browser). Web preview `#labpreview/GameAudioLab`, phone size 390×844, sound never turned on.
Status of this file: COMPLETE for this round. Pages 1–12 were walked in full (every dock key, every tray chip, goals in order, one wrong and one right check answer). Pages 13–22 and the end screen got a quick pass only (section "Pages 13–22" below), and that pass was cut short several times because the preview refreshed back to page 1 about every 30–60 seconds while builders were saving files; what could not be finished is listed under "Could not check".

Format: `[S1|S2|S3] pNN — what — where — fix`. Line numbers were read on 2026-11-12 about 13:00–13:20 while the files were still being edited; re-check before use.

Not repeated here because the main session already has it: scene state carried between pages (it caused: p06 "Press OPEN DOOR" when the key reads CLOSE DOOR; p07 rings and a red lamp on a generator that reads OFF, from the p05 alarm; p10 STEP walking into the south wall; p12 opening with the generator VIRTUAL after p11 sent YOU 14 m away), and the generator control's names.

## S1

- [S1] p05 (also true wherever a bus is soloed or muted) — SOLO changes the SOLO readout, the tray text and the log, and the PICTURE STAYS THE SAME. With SOLO = AMBIENCE, DIALOGUE or INTERFACE the generator (and its alarm) keep the same full rings as with SOLO = OFF; the fountain keeps its rings with SOLO = EFFECTS. The page says "With AMBIENCE alone, the wind and the fountain stay and the alarm is gone", and p02 says "The log and the rings in the picture tell you the same thing your ears would." With sound off the student cannot find which category holds the alarm from the picture: a control that changes nothing the student can see. — `scene/GaScene.tsx` `soundingOf` (lines 55–72) computes a ring from distance and the door only; it never reads `s.bus[...]` (solo, mute, db). — In `soundingOf`, read the event's bus: when that bus is muted, or another bus is soloed, mark the source silent and draw it the way a virtual source is drawn (one dashed grey ring) or draw no rings; also add the bus level to `db`.

## S2

- [S2] p02, p07, p08 — SPEED changes the SPEED readout and prints VALUE lines; the generator in the picture is identical at 0 %, 40 % and 100 % (same rings, same colour, same pace). p02 tells the sound-off student that the rings say what the ears would. — `GaScene.tsx` `soundingOf` ignores the layer's `speedGain`; `Generator` (line 218) takes no speed. — Let the ring colour include the speed gain and/or let the ring pace follow speed; or change `pages/p02Reacts.tsx:67` to say that with sound off SPEED is read in the SPEED readout and the VALUE lines.
- [S2] p05 — ALARM ON is almost invisible in the picture: the only sign is the generator's lamp (about 2 px on a phone, and dim half the time); the alarm's rings are merged into the generator's rings because both share one owner and position (`soundingOf` key, lines 65–69). The warning sign (`AlarmSign`) appears only with the visual-cue option, which this page does not switch on. — `GaScene.tsx:250–251`, `:551`. — Give the alarm its own mark whenever it plays (a pulsing red ring of a different radius, or the sign), not only under the accessibility option.
- [S2] p05 — GUIDE LINE: nothing happens at the GUIDE in the picture while the line plays (no rings, no speech mark); only PLAYING and the log move. — `model/gaDefs.ts:214–221` (`vo_greeting` is `spatial: false`), so `soundingOf` skips it. — Draw a small speaking mark at the guide while an instance owned by `guide` is playing.
- [S2] p03, p04, p05 — Dock key VALUES of exactly eight letters are cut with "…" in a five-key dock: p03 BUDGET "EXPAND…" (always, it is the default) and PLATFORM "HANDHE…"; p04 GAMES "PLATFO…", "ADVENT…", "STRATE…", "OPEN W…", "NARRAT…"; p05 SOLO "AMBIEN…". Measured: text 60.5 px in a 60.0 px box at 14 px; nine letters and more are shrunk to fit correctly, eight are not. — values: `pages/p03Platforms.tsx:72` (`GA_BUDGET_WORD`), `data/gaPlatforms.ts` and `data/gaGenres.ts` `short`, `data/gaFamilies.ts` labels. — Keep short values to seven letters or fewer (EXPAND → "16 MAX" / "WIDE", NARRATIV → "STORY", AMBIENCE → "AMBIENT"), or fix the fit threshold in the rack key (shared kit) so 60.5 > 60.0 triggers the shrink.
- [S2] p04 — GAMES tray: after a kind of game is chosen its description is BELOW the twelve chips, under the tray's fold ("more ↓"); the card in the well is behind the tray. The thing the student is told to read is not visible without scrolling inside the tray. (The LISTENING tray on p03 shows it above the chips.) — `pages/p04Games.tsx:118–132`. — Show the chosen description above the chips, or make the tray not sticky so the card in the well is seen.
- [S2] p06 — TROUBLESHOOT "THE DOOR WITH NO SOUND" shows ✓ FIXED before the student has pressed START THE FAULT: step 3 of the same page (choose door_open_v2, press the door, choose door_open.wav, press again) sets both `sawMissing` and `repaired`, which are the card's only inputs. START THE FAULT is never offered. — `pages/p06Pipeline.tsx:130–131`. — Track a `started` flag set by `onStart`; `armed = started && (missing || !repairedSinceStart)`, `fixed = started && repairedSinceStart && !missing`.
- [S2] p07 — TROUBLESHOOT "THE LOOP WITH NO OWNER": after START THE FAULT nothing matches the symptom ("A generator was taken out of the scene, but its hum is still there"): no generator has been removed and PLAYING is unchanged. The student is not told to make it happen until the first hint. — `pages/p07Instances.tsx` FaultCard `symptom` (near line 165). — Replacement symptom: "A tester reports a hum with no generator. Start the fault, add generator 2, start it, then remove it. Watch PLAYING."
- [S2] p10 — Readout strip prints two bare words, "WORKSHOP  PREPARED" (or "COURTYARD  PREPARED"): the labels ZONE and WIND FILE are dropped because the values are too long (the label comes back for "RAW CUT"). The student cannot tell what PREPARED describes. — `pages/p10Loops.tsx` `readouts`. — Shorter values: ZONE "ROOM"/"YARD" (or "INSIDE"/"OUTSIDE"), WIND FILE "LOOP"/"RAW".
- [S2] p12 — Readout label is cut: "GENERAT…" (61.4 px in 56.8 px). And the WALK lane caption is cut: "YOU ARE IN THE COURTYARD · 8.6 m FRO…" (310 px in 260 px). — `pages/p12Walls.tsx` `readouts` and `walkKey` `format` (near lines 54–70, 126). — Label "GEN" (as p07 uses "GEN 1"); caption "COURTYARD · 8.6 m TO WALL" / "WORKSHOP · 5.3 m IN".
- [S2] p12 — Goal "Hear the generator through the closed door" ticks while the card says "STATE: VIRTUAL: tracked, not played" (YOU more than 13 m away): nothing is heard and the picture shows the grey dashed ring. — `pages/p12Walls.tsx:105` (`gen.playing && gen.obstructed`). — Also require that the generator's voices are not virtual. (A clean scene on page open removes the usual cause, but the WALK lane can still take YOU out of range on this page.)
- [S2] p10, p11 — "find the ZONE line in the log" / "walk away … until the log says VIRTUAL": every STEP prints four lines (TRIGGER, EVENT, START, STOP) and the page log shows four to six, so the ZONE / VIRTUAL line is pushed out by the next step. On p11 the log held four footstep lines one step after the generator went virtual. — `pages/p10Loops.tsx`, `pages/p11Distance.tsx` `<ActivityLog … />`. — Pass `only={['state', 'failed', 'mix']}` to these two logs (as p03 already filters), or point the text at the card/readout: "until STATE on the card reads VIRTUAL".
- [S2] p03 — BUDGET changes only the second number of VOICES (0/16 ↔ 0/8). No key on this page starts a sound, so nothing shows what a budget does; SOUND and ■ STOP also have nothing to act on. — `pages/p03Platforms.tsx:127`. — Add the scene background or the generator to this page (a toggle), or say in step 3 that the effect of a budget is shown on the Budgets page and that here only the limit changes.
- [S2] scene (seen on p04) — In OVERHEAD CAMERA the camera and its dashed ring sit exactly on the door: they cover the door leaf and cross the "DOOR CLOSED/OPEN" label. — `GaScene.tsx:348–366` (`CameraMark` at `WORLD_W/2, WORLD_H/2` = 8, 5; the door is at 9, 4–6). — Draw the camera mark smaller and off the door (for example at 8, 2.2 with a thin line to the scene centre), or hide the door label while the camera is the listener.
- [S2] scene (p08, p10, p12) — When YOU stand in the workshop the two people overlap: YOU's ring crosses the GUIDE's ring and the YOU label touches it. At phone size the two figures read as one shape. — `model/gaWorld.ts:64` (guide at 11.2, 6.6) against the workshop place used by `goTo('workshop')` and the doorway walk line y = 5. — Move the guide's start away from the walk line (for example 11.4, 8.0) or the workshop place further east.
- [S2] scene (p11, p12) — YOU can walk to x = 0.4 m, where the larger-than-life figure, its ring and its wedge are cut by the edge of the picture. — `model/gaWorld.ts:70–71` (`walkTo` clamps at 0.4; the ring radius is 0.74, `GaScene.tsx:314`). — Clamp at 0.9 m from each edge.
- [S2] scene quality, all scene pages — (a) The generator reads as a small red radio or television (a round "speaker", slots, a knob), not a generator; no pull-cord housing, exhaust or handle that says engine. (b) The two people are one identical figure: a blue shoulder oval and a bare skin-coloured head oval, about 25 px across on the phone; they read as blobs. YOU and GUIDE differ only by ring colour, the word under them and the wedge (so not colour alone, but the figures themselves give no help). (c) Labels collide: "YOU" beside "CRATE" after two steps south (p05, reads "YOU CRATE"); "MAX 13 m" printed on top of YOU (p11, `GaScene.tsx:471–477` places it on the ring toward the listener); "DOOR CLOSED" over the wall edge always, and over YOU when YOU stand at the door (p08); "WORKSHOP" under generator 2's rings (p07). (d) Scene text shows a gap after T: "FOUNT AIN", "CRAT E" (shared `dj/art/sceneText`). — `scene/GaScene.tsx` `Generator` 218–255, `Person` 309–321, `Labels` 421–441. — Redraw the generator from a real top view (frame, tank with cap, recoil-starter housing, exhaust); give the people hair and arms and give the guide a different top (a cap or another shirt colour plus shape); nudge labels away from each other (YOU label above the figure when the crate label is near; MAX label on the far side of the listener).

## S3

- [S3] p04, p10, p11, p13 (FACING lane) — The caption "YOU FACE 275° (0° = up the picture)" runs across the lane and is printed over the fader thumb between about 180° and 300°. — `pages/shared.tsx:88`. — `format: (v) => \`FACING ${deg}°\``; "0° = up the picture" is already said in the lesson text.
- [S3] all pages with SPEED — The log prints `PARAMETER speed = 0.87 on generator-1` while the readout, the key and the lane print 87 %, and it shows the internal id. — `model/gaModel.ts:830`. — `PARAMETER speed = 87% on generator 1 …`. Same id in the screen-reader summary "Sounding now: generator-1" (`GaScene.tsx:500`).
- [S3] p09 — "press the door key": on this page the door is a chip in the SETUP tray, not a key. — `pages/p09Variation.tsx` step 3. — "press OPEN DOOR in the same tray".
- [S3] p08 — START THE FAULT while YOU stand on the wood floor shows no symptom (the guide is on wood too); the page's own WORKSHOP chip leaves YOU there. — `pages/p08GameSyncs.tsx:223–226`. — Symptom text: "Stand on GRAVEL, start the fault, then press STEP: GUIDE."
- [S3] p08 — STATE CALM/ALERT changes the table and the log only; nothing in the scene or the sound changes on this page (no music is running here). — `pages/p08GameSyncs.tsx:145–149`. — Say so in step 3 ("you will hear the state on the Music page"), or show the mood as a word in the scene.
- [S3] p04, p05, p07–p12 group trays — Tray chips are 35 px high (the option trays use 44 px). — `pages/chAViews.tsx` / `pages/chbBits.tsx` chip style. — 44 px minimum height.
- [S3] p07 — MACHINES tray needs scrolling inside the tray to reach its note and its log ("more ↓") at 390×844. — `pages/p07Instances.tsx:41–69`. — Drop the tray log (the page log is enough) or the third row's heading.
- [S3] p08, p11 — Page title wraps to two lines ("Triggers, states, switches, parameters", "Emitters, the listener and distance") and pushes the display 28 px down. — `PageDef.title`. — Shorter titles ("Triggers, states, switches", "Emitters and distance").
- [S3] p06 — The missing file is named "door_open_v2" with no extension beside "door_open.wav" and "door_latch_rattle.wav". — `pages/data/chbPipeline.ts` `CHB_MISSING_FILE`, `model/gaModel.ts:563`. — "door_open_v2.wav".
- [S3] p03 — LISTEN readout prints "HEADPH" for headphones. — `data/gaPlatforms.ts` `short`. — "PHONES".
- [S3] shared kit, seen on every page — The lane pop-up repeats the label: "LEVEL LAB LEVEL 69%"; the header has two identical ⓘ buttons side by side (accuracy note, screen guide).

## Pages 1–12, in one line each

p01: no defects found (all four goals tick in order with sound off; check feedback correct).
p02: SPEED not in the picture (above). Everything else works; door leaf, lamp, rings and log all respond.
p03: BUDGET (above), "EXPAND…" (above). All seven platform cards and five listening setups open.
p04: FACING turns YOU and the wedge; GEN PAN R 96 % → R 65 % under the camera and stays still while YOU turn, as the text says. Camera over the door, GAMES tray fold, cut values (above).
p05: SOLO (S1), alarm, guide line (above). STEP moves YOU; CRATE rings; goals tick correctly.
p06: chain cards, FAULT line and goals work. FIXED too early (above).
p07: add / start / speed / stop / remove all show in the picture and readouts; orphan rings stay where generator 2 was. Fault symptom (above).
p08: surface switch follows where YOU stand; closed door stops YOU with a clear message. People overlap in the workshop (above).
p09: take strip, AVOID REPEAT, RATTLE all work; goals tick at the right moment.
p10: crossing, RAW CUT, pile-up fault and its fix work. Readout labels (above).
p11: distance, pan, MIN/MAX rings and VIRTUAL (grey dashed ring, VOICES drops) all work. FULL SCREEN opens, controls stay docked and work, 2× is sharp, closes cleanly.
p12: door, WALK, STEP WEST/EAST, REVERB/DRY work; closed door stops WALK at the wall with a message. Cut label and caption (above).

FULL SCREEN (p02, p11): opens, zoom chips 1× / 1.5× / 2× / FIT / 3×, readouts on top, dock and lane stay and work, closes cleanly. In portrait at 1× the drawing is the same size as inline (370×231) with a hint to turn the phone or tap FIT.

Console: no application errors on pages 1–12 (only the browser's "Blocked call to navigator.vibrate" lines, caused by scripted taps).

## Pages 13–22 and the end screen (quick pass, 390×844, sound OFF)

Seen with the clean scene on every page open (it works: each of these pages opened with YOU at the start, the door closed, nothing playing, an empty log).

### S1

- [S1] p16 — Same fault as p05, on the page that teaches it: with EFFECTS under MUTE ticked (log: "BUS sfx: 0 dB, MUTED") the generator keeps its full rings and the alarm keeps its OVERHEAT sign and rings. MUTE and SOLO change words only; the picture does not show a silenced bus. — `scene/GaScene.tsx` `soundingOf`. — Same fix as the p05 item: a muted or soloed-out source is drawn silent.

### S2

- [S2] p13 — Two labels are printed on top of each other: "FOUNTAIN" and "MIN 1.5 m" (white on green, neither can be read). The page selects the fountain and also shows names. — `GaScene.tsx` `Labels` line 436 (name at y + 1.85) and `Range` lines 461–469 (MIN label falls back to y + min + 0.55 = the same place). — When a source is selected, print its name above it, or put the MIN label on the ring's side.
- [S2] p14 — While the music plays (MUSIC key reads PLAYING, lanes read HEARD) the readouts say PLAYING 0 and VOICES 0/16. p01 tells the student that PLAYING counts the sounds that are running. — `GaLab.tsx:175–176` count `s.inst` only; the music is kept elsewhere. — Count the music layers in PLAYING/VOICES, or say on p14 that the music is counted on its own readout.
- [S2] p14 — The only picture of the music (the three-lane card) is in the well, behind the MUSIC tray, which stays open; the tray says "compare while you watch" and the scene shows nothing for music. — `pages/p14Music.tsx` tray. — Put the three lane states (HEARD / ZERO LEVEL / PENDING) in the tray, or do not keep this tray open.
- [S2] p14 — A lane reads "HEARD" while SOUND is OFF (the log, correctly, says "not heard: sound is off"). — `pages/p14Music.tsx` / `data/chcMusicVoice.ts` lane word. — "ON" / "AT ZERO LEVEL", or "HEARD" only when sound is on.
- [S2] p15 — While the guide speaks nothing marks the guide in the picture (same as the p05 GUIDE LINE item). Also: the SPEAKING readout loses its label when the value is "GREETING" (bare word), and the LINES key value "GREETING" is cut to "GREETI…" (eight letters). — `pages/p15Dialogue.tsx` readouts and `valueLabel`. — Values "GREET" / "WARN"; speaking mark at the guide.
- [S2] p16 — Readout label cut: "MUSIC B…" (59.8 px in 56.8 px). — `pages/p16Mix.tsx` readouts. — Label "BUS" with the value "MUSIC 0 dB", or "MUSIC".
- [S2] p16 — With ALARM and VISUAL CUE on, the word "OVERHEAT" runs into the "GENERATOR" label (they touch and read as one line), and the sign sits on the generator's rings. — `GaScene.tsx:381–386` (sign at x − 1.75, word at y + 1.05) against the name at y + 1.4. — Put the sign above the generator, or hide the GENERATOR name while the sign is up.
- [S2] p18 — DOOR · NEW ID plays the door's sound (rings at the door, START lines) while the door in the picture stays closed and its label keeps "DOOR CLOSED". The thing the control is about does not move. — `model/gaModel.ts:1055` posts `door_open` without changing `s.doorOpen`. — Toggle the door for a world action (and for its ignored duplicate, leave it), or name the chip "DOOR SOUND · NEW ID" and say the door itself is on the other machine.
- [S2] p18 — SEND key value "NONE YET" is cut to "NONE Y…" (eight letters). The ID CHECK toggle label measures 49.7 px in a 46 px box. — `pages/p18Multiplayer.tsx`. — "NONE"; check the toggle label on the phone.
- [S2] p22 — Six keys in the dock (57 px each): the fourth key's label is cut, "SUMMA…". — `pages/p22Capstone.tsx` keys. — Label "CARD" or "SUM"; or move SUMMARY into the WORLD tray so the dock has five keys.
- [S2] end screen — Every one of the 22 rows carries the same sentence, "Counts once its practice goals and its check are done; NEXT moves on without counting it." That is not true for p20 and p21 (no practice goals) and it contradicts p22 ("This check is optional. The seven requirements are what this page counts"). — `GameAudioLabScreen.tsx:30` (`HANDS_ON`, one string for all pages). — Give p20/p21 "Counts once its check is done." and p22 "Counts once its seven requirements are done."

### S3

- [S3] p13 — "MAX 9 m" is printed across the door and the edge of YOU's wedge; readable, crowded.
- [S3] p13 — SCENE toggle reads "SCENE ON: on" to a screen reader. — `pages/p13Formats.tsx:74`. — Keep the label "SCENE".
- [S3] p16 — MUTE and SOLO rows: six chips squeezed into one row (CHAT is 34 px wide, 35 px high). — `pages/p16Mix.tsx` MIX tray. — Two rows of three, 44 px high.
- [S3] p18 — SEND tray needs scrolling to reach CHAT LINE ("more ↓"), which step 3 asks for.
- [S3] p19 — FIX tray names the good file "door" where p06 calls it "door_open.wav". — `pages/data/gaFaults.ts`. — One name on both pages.
- [S3] p20 — In the tool picture the numbers do not follow reading order (top row 1, 5, 3; then 2, 6; then 4, 7) while the list under it runs 1–7; GAME INFO has an empty upper half. — `pages/cheToolMap.tsx`. — Renumber in reading order, or lay the panels out in number order.
- [S3] p22 — WORLD tray title is cut: "WORLD · THE SLIDER IS THE GENERATOR'S SPEED · st…". — tray title in `pages/p22Capstone.tsx`. — "WORLD · SLIDER = GENERATOR SPEED".

### One line each

p13: FACING turns the FOUNTAIN readout AHEAD/BEHIND; OUTPUT changes the readout, the log and (I assume) the sound, nothing in the picture; goals for 3D and MONO ticked with sound off. Label collision (above).
p14: START, layers, MOOD, STINGER and CHANGE AT all answer in the log and PENDING readout; four goals ticked with sound off. PLAYING 0 (above).
p15: interrupt and refuse work and are logged; Spanish caption and file change together; goals tick in order.
p16: DUCK readout, bus fader, MUTE/SOLO log lines, VISUAL CUE sign all respond; picture ignores MUTE (S1).
p17: BURST 12, STOLEN and REFUSED counts, protected alarm, BUDGET lane and FEWER/MORE all work; three goals ticked. No defects found in the quick pass.
p18: ignore / double / private alerts / chat all work and the two-machines card follows. Door leaf (above).
p19: TEST and FIX trays open and list every action and setting; faults not run (1 and 4 already known; the preview refreshed before 2, 3, 5 could be run).
p20: no clipped or overlapping text; smallest text 9.5 px. Numbering (above).
p21: no defects found (document page, no clipped text, smallest text 9.5 px).
p22: WORLD tray chips work; three of the seven requirements ticked from the scene (door with rattle, ducked guide line, alarm with visual cue). Header NEXT becomes FINISH. "SUMMA…" (above).
End screen: the in-flow FINISH link opens "WHAT'S LEFT": "22 pages still to go. You are not signed in, so nothing here is saved yet", then 22 rows (number, title, the sentence above, ›), PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, Discuss this lab. No clipped text.

Seen changing while I worked (builders): one ⓘ in the header instead of two, lane caption "THIS LAB · 70%", a redrawn generator, WORKSHOP label moved to the top, the guide moved lower with a dashed ring, "Triggers, states, switches" as the p08 title. I did not re-review pages 1–12 after these changes.

## Could not check

- p19 faults 2, 3 and 5; p22 MOVE, MUSIC and SUMMARY trays, the remaining four requirements and the check; p12 and p13 check answers. The preview refreshed to page 1 before each could be finished.
- p22 FULL SCREEN, tray layout: it opened, the six keys stayed docked and ENGINE worked from the tray (PLAYING went to 1), but in my one capture the WORLD tray showed only its first row above the lane, with the other rows under the lane and dock. This may be the tray's slide-up caught half-way in the hidden pane. Check on the phone: FULL SCREEN on p22, open WORLD, are all three rows visible?
- Any sound (sound was never switched on; the Sound Safety acknowledgment was not touched).
- Whether the display's first appearance is slow on a phone: in the hidden browser pane the scene stayed blank up to about 40 s after a page opened while controls were in use, and appeared a few seconds after the page was left idle or a screenshot was taken. This looks like the pane (layout callbacks wait for a drawn frame), not the lab.
- When the page intro card appears: on p03 it came up after I had already used the tray, again probably the hidden pane's timers.
- Returns to page 1 with a fresh scene: first seen right after closing FULL SCREEN on p02 (not reproduced in three more tries), then many more times during pages 13–22. Lab files were being saved each time, so this is most likely the dev fast-refresh, not the lab. Worth one check on a quiet build: does anything in the lab itself ever send the student back to page 1?
- For a few seconds after one refresh the scene drew with no labels at all (no YOU, GUIDE, FOUNTAIN); the labels were back on the next view. Probably the scene fonts loading.
- Text fit on a real phone: the "…" cuts above were measured in the web preview (0.5 px over); the native text measure can differ.
