DJ Systems Lab, Stage 1: cognitive-learning design review (screens 1–12)

This was a review only. I edited nothing and ran no build, commit or publish.

**What I read:** every page file in C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\, plus bits.tsx, dock.tsx, trays.tsx, DjRack.tsx, DJSystemsLabScreen.tsx, booth/setup.ts, booth/useBoothAudio.ts and art/sceneText.tsx. I opened all 15 screenshots in docs\labs\dj\screens\ and read the owner's outline.

**One finding behind several others.** `SceneText` (art/sceneText.tsx:54) does not draw any in-scene print that would fall below 9 pt. That is correct under the house rule. But it means the printed legends on the gear vanish at phone scale:
- the mixer's meter names, size 6.4 (MixerTop.tsx:131)
- the input selector legend, size 6.2 (MixerTop.tsx:86)
- "DECK A (REAR)" and "MIXER (REAR)", size 9 (RearPanels.tsx:41/58/78)

So on several screens the callouts are the only labels a learner sees, and some needed callouts are missing.

## CROSS-CUTTING

X1 MAJOR — no "what you are looking at" line. On every page, Step 1 opens with the concept. Each page's `a11y` string already describes the picture, but only screen readers get it. Fix: add one plain line as the first line of Step 1, drawn from that string. For example:
- p04: "You are looking at the whole booth from BEHIND: deck A, the mixer and deck B along the table, the PA speakers at the top corners, the booth monitors inside them, the power strip below."
- p07: "You are looking at the mixer's headphone and booth controls, your headphones, and a booth monitor."

X2 MAJOR — too much to read before doing anything. Step 1 usually carries two dense paragraphs plus 6 or 7 Terms (p03 has 7, a ladder and 4 numeric notes; p05, p06, p09, p10, p11 and p12 have 6 each). Fix: keep Step 1 to three sentences and at most 4 terms. Move the other terms inline at first use, as "(… means …)".

X3 MINOR — Check yourself repeats the fault. On p06, p09, p10 and p11 the CHECK YOURSELF question is the same scenario as the TROUBLESHOOT card on the same page. Fix: aim the question at a different idea from the outline row (specific swaps are in the per-screen lists).

X4 MINOR — the DECKS key reads "—" when nothing plays (dock.tsx:224 and every page-local DECKS key). Fix: valueLabel `'STOPPED'`.

X5 MAJOR — the what's-left screen gives no guidance. Every row shows the same HANDS_ON sentence (DJSystemsLabScreen.tsx:47; seen in 12b_finish_whats_left_390.jpg). It ends "NEXT moves on without counting it", which does not tell a learner what is missing. Fix: show each screen's unmet goal labels, for example "Left: Fix the silent start · Pass the check". The goal lists already exist on each page.

X6 MINOR — the word "free". "free deck" appears at p05:100,175,188,198,217 and p12:351. It is not upsell copy, but a wide "free" sweep will flag it. Fix: say "the spare deck" or "the deck the crowd is not hearing".

**House rules: passes**
- NEXT is never blocked.
- FINISH leads to the what's-left screen.
- The Skia floor is 9 pt and well text is 12–14.5 pt; dock labels are 12 pt and values 14 pt with fitValue.
- Readouts print their number beside their word.
- No upsell copy is shown to members.
- Trays are the shared DockTray. The MODULE ▾ contents control belongs to the shell; I did not check whether it opens centred.

## SCREEN 1 — Welcome (p01Welcome.tsx)
1. MAJOR, L48/L53/L113 — "Work out a loud night" ticks on any chip tap, so there is no task and no evidence. Fix: make the goal "Find the loudest level that keeps a 4-hour set at or under 100 %" and latch when 88 dBA with 4 h is selected. Do text: "Pick 4 h, then find the loudest level that stays green or amber at 100 % or less."
2. MINOR, L143–158 — three keys do overlapping jobs: PLAY A, LISTEN, and DECKS (which contains PLAY A and LISTEN again). Fix: drop `boothKey` on this page and keep PLAY A, LISTEN, RESET, STOP.
3. MINOR, L66 — the strip says "YOU / YOUR HEADPHONES" while the bezel and the LISTEN tray say "PHONES". Fix: strip top word "PHONES".
4. MINOR, L211–212 — the fault's hint and "why" lean on the headphone cue, which is not taught until Screen 7. Fix the why: "You were listening as the headphones, and nothing was being sent to them yet (Screen 7 shows how). Check WHO you are listening as before touching a volume."
5. MINOR, L170 — the "A phone has one headphone output…" sentence repeats the LISTEN tray word for word (dock.tsx:178). Delete it from Step 2.

## SCREEN 2 — Gear (p02Gear.tsx)
1. MAJOR, L283–292 — the OUTPUT key changes the drawing only in SYSTEM → LAPTOP; in the other 11 views it does nothing. Fix: give it `locked: 'Open SYSTEM → LAPTOP + CONTROLLER to see where the software sends its audio'` unless mode is system/laptop. Also show the SENDS TO bezel cell (L250) only in that view.
2. MAJOR, OUTPUT label — "OUTPUT" does not match the bezel word "SENDS TO" or the hint "Open OUTPUT" (L344), so the learner has to match two names. Fix: rename the key "SENDS TO" (8 characters, same as QUANTIZE, which fits). Hint 3 becomes "Open SENDS TO and pick the controller's outputs."
3. MAJOR, L230–231 — Practice is "open all eight" and "compare all four", which is browsing. Fix: add a job-matching task using the same EQUIPMENT key. A prompt line in the well cycles "Show me what lets the ROOM hear the mix / lets YOU hear the next track / MIXES / PLAYS". The goal ticks when the matching piece is selected (speaker, headphones, mixer, player or turntable).
4. MAJOR, wording L31/L41/L48 — "phono level", "built-in preamp", "RIAA curve" and "MIDI or HID" appear before Screen 3 defines them. Fixes:
   - turntable: "…its signal is very small and needs a special PHONO input (Screen 3), unless it has its own built-in booster."
   - vinyl system: "The question: is the mixer giving the turntable's tiny signal its own PHONO input?"
   - Controller term: "…send control messages over USB to software."
5. MINOR, L257 — the EQUIPMENT key value is cut at the first word ("MEDIA", "AUDIO", "POWERED"), which is ambiguous. Fix: an explicit short list TURNTABLE, PLAYER, MIXER, CTRL+LAPTOP, STANDALONE, INTERFACE, PHONES, SPEAKER.
6. MINOR, L176 (screenshot 02b) — the bottom callout is cut off ("CONTROLLER + INTERFACE: OUT…"), and it is the callout that shows the fix. Fix: shorten to "OUTPUTS HERE" (red version: "OUTPUTS: SILENT").
7. MINOR, L308 — Step 3 repeats the tray blurb. Replace with "Each system answers one question — which device makes the sound the room hears?"

## SCREEN 3 — Connections (p03Connect.tsx)
1. MAJOR — this is the heaviest screen: 7 Terms (L33–41), a five-attribute framework, a level ladder plus four dBu/dBV lines (L108–110), and 11 sockets. Fixes: delete the ladderNote lines (keep mV/V on the bars); cut Terms to Line, Phono, Mic, Balanced; fold RIAA into Phono and dBu/dBV into Line.
2. MAJOR, L134–139 — the CH1 input selector (LINE/PHONO/USB) lives on the mixer's top, but the drawing shows only rear panels, so the change appears only in the bezel word. Fix: on MixerRear, outline the jack pair the selector is listening to in green, with a callout "SELECTOR → LINE"/"→ PHONO". Grey out the other pair.
3. MAJOR, L168 — "Identify six sockets" counts browsing. Fix: reverse it into find-the-socket prompts: "Which socket sends the mix to the PA?" (MASTER), "Which carries no audio at all?" (AC IN or LAN), "Where does a raw turntable go?" (PHONO). Tick 3 correct answers made through IDENTIFY.
4. MINOR, L235 — the IDENTIFY value shows "CH1" for both CH1 LINE IN and CH1 PHONO IN. Fix: short labels LINE IN / PHONO IN / MASTER / BOOTH / GND / USB / LAN / DIGITAL / AC / SWITCH / AUDIO OUT.
5. MINOR, L212–213 — the bezel words "LEFT ←" / "RIGHT ←" are cryptic. Fix: "CH1 LEFT GETS" / "CH1 RIGHT GETS"; they will crop to their numbers anyway.
6. MINOR, L77 — "MIDI-style or HID messages" is jargon. Fix: "control messages (knob and button moves)".

## SCREEN 4 — Build (p04Build.tsx; screenshots 04, 04b)
1. MAJOR, L96–102 — the map has callouts for PA, BOOTH and POWER STRIP only. The three rear panels along the table and the headphones carry no visible name (the 9 mm print drops out), so a beginner cannot tell deck A from the mixer. Fix: add callouts DECK A, MIXER, DECK B and HEADPHONES.
2. MAJOR, trays.tsx:89 — THUMP feedback is a red sentence inside the POWER tray only, and the drawing does not react. Fix: flash the speaker that thumped on the map (red halo plus a "THUMP" callout for about 1 s). When the ON-order goal is missed, add a well line: "That order thumped a live speaker. Switch everything OFF and try again: players and mixer first, speakers last."
3. MINOR, L110 — CROWD MUSIC/SILENT does not show which side, yet the fault is "half the PA". Fix: make the bezel "PA L · R" with ✓/— per side.
4. MINOR, L140 — the behind-the-booth viewpoint is mentioned only through "channel 2's inputs on the LEFT". Fix: put the viewpoint in the X1 caption.
5. MINOR, L167 — "the booth monitors sound odd" is vague. Fix: "…and the left booth monitor is playing the crowd's mix."

## SCREEN 5 — Load and play (p05Play.tsx; screenshot 05)
1. MAJOR, L175 vs setup L80–83 — the copy says deck A "plays to the crowd — it is ON AIR", but the screen opens with ON AIR: NOTHING and the drawing shows only deck B. Fix: make it the first Explore step: "Choose DECK A in BROWSE and press PLAY A — the readout says ON AIR: DECK A. Now switch to DECK B." Add a goal "Put deck A on air".
2. MAJOR, L122 — the view is a single deck, so the lesson "which deck is on air" is never drawn. Fix: keep the operated deck large and add a small on-air marker for the other deck at the glass edge ("DECK A ▶ ON AIR", red) from `onAir()`. Or use the 'booth' view with the operated deck highlighted.
3. MAJOR, L216 — hint 1 says "Look at the faders", but no fader is on screen. Fix: "Look at ON AIR on the readout strip and at deck A's screen: a new title, stopped at its first beat."
4. MINOR, L155 — the key named "JOG" is really a track-position (search) slider. Fix: label it "SEARCH B", or keep JOG and turn the drawn jog ring while it is moved.
5. MINOR, L190 — playlists and media preparation are only a Note. Fix: optional mini-task "Load the 124-BPM track next to deck A's 122" (or similar), so crate reading is practised.

## SCREEN 6 — Gain and meters (p06Gain.tsx; screenshot 06)
1. MAJOR, L73–78 — this is the "read meters" screen, yet the four LED columns are unlabelled (the 6.4 mm print drops out). Fix: callouts "CH1", "L", "R", "CH2" under the columns.
2. MAJOR, L97 — "move the channel fader in your mind" turns the key lesson (the meter reads before the fader) into imagining. Fix: add a CH1 FADER chip to the DECKS tray or a key (drop MASTER into DECKS if the dock is full). Do: "Pull CH1 FADER down: the CH1 meter stays, MASTER falls."
3. MAJOR, missing outline topic — "Input selection" is not taught here. Fix: swap CHECK YOURSELF for an evidence task. Deck B plays but CH2 PEAK reads "—" because CH2's input selector is on PHONO. Ticks when the selector is set to LINE. Show the selector with a callout on the drawing; it sits at the top of each strip in the screenshot.
4. MINOR, L54 — "Nothing clips" can tick the moment both decks play, before any work. Fix: merge into goal 3: "Matched within 2 dB, both in −9…−4, nothing clipping".
5. MINOR, L83 — MIX BUS shows "—" in green before any sound. Fix: grey (`colors.textSub`) when `last` is null.

## SCREEN 7 — Headphone cue (p07Cue.tsx; screenshot 07)
1. MAJOR, L150–152 — no crowd or master meter is drawn, so "the crowd hears nothing of it" and "Booth down, crowd unchanged" (L111) cannot be seen. Fix: add a fourth LED column "CROWD" (bus or master tap) beside BOOTH, and a callout "CROWD HEARS: A".
2. MAJOR — there is no channel fader, so "the cue is taken BEFORE the fader" (L186, L191) is never shown. Fix: put a CH2 FADER chip in the CUE tray. Practice line: "Bring CH2 up: the CROWD meter jumps. Back down: only your headphones carry B."
3. MAJOR, L158–177 — the PHONES key hides two controls (LEVEL and CUE↔MASTER) behind a chooser and shows "45 %" for either. Fix: label by mode ("PHONES LVL" vs "CUE↔MST"), or make CUE↔MASTER its own key and move BOOTH into the CUE tray.
4. MINOR, L203–211 — the check is recall. Fix: "Make the booth 6 dB quieter without the crowd changing — read BOOTH on the drawing."

## SCREEN 8 — Faders (p08Faders.tsx; screenshot 08)
1. MAJOR, L87/L154–161 — "Hear two copies add +6 dB" ticks the moment the demo chip is pressed (the demo sets CUT, the middle position, both playing). There is no comparison and no evidence. Fix: make it two steps — "Pull CH2 to 0 and read MIX BUS; bring it back to 85 %." Latch when the bus peak rises 5.5–6.5 dB between the two states, and show a delta cell "TWO COPIES +6.0 dB".
2. MINOR, plots.tsx:78–79 — the curve plot has only end letters, not which line is which side. Fix: legend "— side A  — side B" in the plot's colours.
3. MINOR, L207 — hint 1 cites "the channel meter", which this lower-mixer view does not show. Fix: "CH2 → MIX on the readout strip says −∞ dB: deck B reaches the channel but not the mix."
4. MINOR, L135 — the key value "1·85%" is cryptic. Fix: "CH1 85%".
5. MINOR, L28 — "square-law" is jargon. Fix: "On this mixer, half way up is about −12 dB — much quieter than half."
6. MINOR, L190–197 — the check is a fact question. Fix: an evidence version — "Two different tracks, CUT, crossfader in the middle: bring CH2 up and read how much MIX BUS rises" (answer ≈ +3 dB).

## SCREEN 9 — EQ and filters (p09Eq.tsx; screenshot 09)
1. MAJOR, L86 vs L88–91 — the HIGH/MID/LOW callouts point at CH1, the highlight is on CH2's whole EQ column, and the FILTER callout points at CH2 while CH1's filter is the one lit. The learner cannot tell which knob the key moves. Fix: highlight only the selected knob, and give it the callout `CH${eqSel.ch} ${BAND_WORD}`. Do the same for the filter. Add "CH1"/"CH2" strip labels.
2. MAJOR, RESO key L153–161 — with both filters off it moves nothing visible or audible, which breaks D75 ("a fader with no effect is locked"). Fix: `locked: 'Turn a FILTER first — resonance only shows at the filter's edge'` while both filters are 0. Rename "RESO" to "RESONANCE" (measure at 9 pt; QUANTIZE already fits).
3. MAJOR, L55–56 — the bass handover needs alternating one EQ key between CH1 LOW and CH2 LOW through a chooser, while the plot and bezel show only one channel. Fix: on this screen use dedicated keys LOW 1 and LOW 2, with a group "EQ+FILTER" for the rest. Bezel: "CH1 LOW · CH2 LOW · FILTER · RES".
4. MINOR, L113/L138 — the short values "2L 0" and "1 OFF" are cryptic. Fix: "2 LOW 0" / "CH1 OFF".
5. MINOR, L159 — "(Q 0.8)" is undefined jargon. Remove it.
6. MINOR, L187–195 — the check repeats the fault. Fix: "Make deck A sound far away without touching its EQ" (latch on filter LP > 60 % on CH1).

## SCREEN 10 — Tempo (p10Tempo.tsx; screenshot 10)
1. MAJOR, L147–159 — "Start B on a phrase" needs a press within ±0.35 beat of A's phrase start, and a miss gives no feedback. Fix: after each start, show a line: "B started 1.4 beats after A's phrase began — CUE B BACK TO BAR 1 and press on the ONE when A PHRASE reads 1 / 8." Also flash the A PHRASE cell on bar 8 as a count-in.
2. MINOR, L219 — "Deck A … is playing to the crowd" is false on entry. Fix: "Deck A (122 BPM) will play to the crowd; deck B (126 BPM) is cued in your headphones…"
3. MINOR — there is no instruction to leave deck A alone. Add to Step 2: "Deck A is on air — never touch its tempo; match B to A."
4. MINOR, L98–102 — CUE B BACK TO BAR 1 is hidden in the JOG tray. Move it under PLAY B, or describe it in Step 2.
5. MINOR, L237–245 — the check repeats the fault (offset with matched BPMs). Fix: a drift scenario — "The flam grows over 8 bars — which control?"

## SCREEN 11 — Beatgrids (p11Grid.tsx; screenshot 11)
1. BLOCKER, L157–158 / WaveLane — the screen's evidence ("the tall kick peaks fall BETWEEN the lines") is not visible. B's lane is a solid wall of waveform with no readable beat lines, and A's lane shows only two edge lines. Fix: zoom the lanes to about 2 bars and draw every beat line (thin, high contrast) and bar line (bold) over the wave. Mark the true kicks distinctly, for example a low-band-only waveform or a kick-tick row under each lane, so "lines vs kicks" is visible at 390 px.
2. MAJOR, L189 — QUANTIZE toggles a lamp, but nothing on the screen shows its effect. Fix: add a Practice goal: "With QUANTIZE on, press LOOP 4 BEATS a little late — the loop bracket snaps to a grid line. Turn it off and try again — it starts where you pressed." Draw the loop start bracket on B's lane.
3. MINOR, L106–123 — pressing SYNC B with one deck stopped does nothing silently. Fix: `setMsg('Play both decks first, then SYNC.')`.
4. MINOR, L168 — the bezel says "FIRST BEAT OFF" for a half-BPM grid even though the first beat is right. Fix: one cell GRID with values RIGHT / FIRST BEAT LATE / HALF BPM.
5. MINOR, L235 — the fault ticks once the BPM is ×2, but the existing loop is still 8 real beats. Fix: also require a new LOOP 4 BEATS press, and show "LOOP = 4 REAL BEATS" on the lane.
6. MINOR, sequencing — loops are used here (L70, fault) before Screen 12 teaches them. Add the inline definition: "a loop repeats a stretch of the track".

## SCREEN 12 — Loops and samples (p12Loops.tsx; screenshots 12, 12b)
1. MAJOR, L285 / SamplerTray — firing a pad changes nothing on the drawing; only the bezel word PRIVATE or ON AIR shows anything. Fix: flash the host deck's pad row and draw two small meters "PHONES" / "CROWD" that show the hit landing in one and not the other.
2. MAJOR, L359–361 — the WHAT YOU CAN DO NOW list shows ✓ on all 12 items whether or not they were done. Fix: tick per screen from `isDone`, otherwise use a plain "•". Retitle it "WHAT THIS LAB COVERS".
3. MINOR, L198 — "Loop, then exit on time" never checks timing. Fix: rename to "Loop, then exit", or latch only when the exit lands within 1/16 beat of the loop end.
4. MINOR, L320–328 — the second check is arithmetic trivia. Fix: "Stretch the intro: run an 8-beat loop and exit so deck B's next bar 1 lands on A's phrase start."
5. MINOR, L313–318 — the first check repeats Screen 5 (spiral review is fine). Keep it, but only one check should be required (L202 "Pass both checks").
6. MINOR, L285 — the key says "SAMPLE"; the device is the sampler. Rename to "SAMPLER" (7 characters, fits).

## TOP 5 MUST-FIX
1. **p11 grid evidence is invisible (BLOCKER).** Zoom the lanes to about 2 bars, draw high-contrast beat and bar lines, and mark the true kicks so a learner can see lines missing the kicks.
2. **Unlabelled pictures (X1 plus labels).** Add a one-line "You are looking at…" first line on every screen. Add the missing callouts where in-scene print drops below 9 pt: p04 DECK A / MIXER / DECK B / HEADPHONES, p06 meter columns CH1 · L · R · CH2, p09 the selected knob plus CH1/CH2 strip labels.
3. **Dead or unclear controls.**
   - p09 RESO: lock it while the filters are off, and rename it RESONANCE.
   - p02 OUTPUT: lock it outside the laptop view, and rename it SENDS TO.
   - p11 QUANTIZE: give it a visible snap task.
   - p12 SAMPLER pads: make a hit visible on the drawing.
   - p03 input selector: show the chosen input on the drawing.
4. **The main claim is not drawn.**
   - p05: the screen opens with nothing on air; add the on-air marker and fix the opening copy.
   - p06: replace "fader in your mind" with a real fader.
   - p07: add a CROWD meter and a CH2 fader.
   - p08: the +6 dB demo ticks itself; make it a measured comparison.
5. **Practice that is browsing, and an ending that does not guide.** Replace the browse and tap-to-tick goals (p01 tile, p02 open-all, p03 identify-six) with find-the-answer tasks. Add miss feedback to p04 power order and p10 phrase start. Make the what's-left rows list each screen's unmet goals instead of the generic HANDS_ON sentence.
