DJ Systems Lab, Stage 2: cognitive-learning design review (screens 13–24 and the whole 24-screen lab)

This was a review only. I edited no code and ran no build, commit or publish. This report is the only file I wrote.

**Branch and commit:** worktree C:\Users\profe\dev\ape-dj-lab, branch dj-lab, head 72242637 (the merge of dj-lab-b).

**What I read:** src/screens/lab/dj/pages/p13–p24, shared.tsx, s2kit.tsx, eventShared.tsx, registry.ts, registryRuntime.ts, index.ts, dock.tsx, trays.tsx, bits.tsx, DJSystemsLabScreen.tsx, booth/setup.ts, model/djCapstone.ts (faults, debrief and transition grading), plus kit/labEnd.ts, LabEndScreen.tsx and PagedLab.tsx (the optional-path changes). I also read the owner's outline and the Stage 1 learning review, whose standard I applied here.

**Screenshots:** I opened all 17 images in docs/labs/dj/screens/stage2/ and all 19 in stage2b/. Those images were taken on the two branches before the merge, so their headers read "13 / 18" and "18 / 18".

**Live preview:** port 8093, #labpreview/DJSystemsLab, 390×844, in a tab of my own. I checked these, then set the viewport back to desktop and closed the tab:
- the CONTENTS list (now 1 / 24, with "(optional)" on 16–18);
- screen 24 on arrival;
- the what's-left screen: 21 of 21 required pages, with OPTIONAL PATHS · 3 listed separately.

**What already works (passes):**
- Every new screen opens Step 1 with a "You are looking at…" line.
- Every Step 1 has 4 terms or fewer.
- Every screen has its own fault card with hints and a "why".
- Most Practice goals are latched from real evidence (render readings, meters, model state), not from taps.
- NEXT is never blocked, and credit only latches.
- FaultCard has PRACTISE AGAIN.
- Drawn text is held at 9 pt or more (SceneText minPt 8.9 everywhere I checked). Tray text is 11–14 pt.
- No "free" or upsell copy appears in 13–24, and there is no raw Alert.
- Readouts keep their number beside their word; the dropped labels in stage2b are D36 crops, and they keep the number.
- The what's-left screen counts only required screens and lists 16–18 under their own heading.

---

## SCREEN 13 — Effects and their routing (p13Effects.tsx)

1. **MAJOR, L185–216 (FX KNOB): one key hides three controls.** TIME, FEEDBACK and LEVEL/RETURN all sit behind a chooser. The short value is either "½B" or "55%", so the dock does not say which knob it is showing. This is the same problem the Stage 1 review found on p07 PHONES (#3).
   - Fix: make `formatShort` carry the knob's name: `T ½B` / `FB 55%` / `WET 50%` (or `RTN 50%` on SEND).
   - Fix: change the dock label with the focus, e.g. `label: focus === 'time' ? 'FX TIME' : focus === 'feedback' ? 'FEEDBACK' : fx.route === 'SEND' ? 'RETURN' : 'DRY/WET'` (FEEDBACK is 8 characters, the QUANTIZE width).

2. **MINOR, L184–191 / L241: dead control on arrival.** The screen opens on FX KNOB (`initialParam: 'fxknob'`) while the effect is OFF. Moving LEVEL or FEEDBACK then changes nothing anyone can hear or see on the scope, which breaks D75.
   - Fix: `locked: !fx.on ? 'Press FX ON first (FX key) — the knobs shape an effect that is running' : …`.
   - Fix: `initialParam: 'fx'`.

3. **MINOR, L237: the CH1 FADER key is truncated.** It reads "CH1 FADE…" at 390 px (screenshot 13_effects_390.jpg).
   - Fix: in dock.tsx L71 (`channelFaderKey`), use `label: \`FADER ${ch}\`` (7 characters).
   - p15 has the same problem.

4. **MINOR, L257 vs L232: the note and the readout use different words.** The safety note says "Watch MIX BUS PEAK", but the readout cell is "BUS PEAK".
   - Fix: rename the cell `'MIX BUS PEAK'`. It crops to its number anyway (D36).

5. **MINOR, L261: one sentence holds four separate tasks** (echo on every beat, echo out, a reverb on both decks, a master sweep).
   - Fix: split it into four short lines, each with its own goal chip beside it: "1. Echo on every beat (TIME 1 BEAT). 2. Echo out: pull CH1 FADER down. 3. One REVERB on both decks with the SENDs. 4. Sweep the MASTER with FILTER or FLANGER."

6. **MINOR, L268–276: Check yourself tests recall, not evidence.** It asks where a wet mix comes from as a multiple-choice question.
   - Fix: make it evidence. Start a state with REVERB on MASTER and both decks up, then ask: "Make deck B dry while deck A keeps its reverb — without turning the effect off." Latch on `route === 'CH1'`, or SEND with `send[2] === 0`, with both decks playing.
   - That would also stop the Step 5 task (L267, "effect on deck B only") being the only evidence item there.

7. **MINOR, L33 (Terms): one word is undefined.** "Crossfader" appears in ROUTE_BLURB without a definition (it is Screen 8 vocabulary, so this is acceptable). The Insert term does explain "after the fader". No change is needed beyond #5.

## SCREEN 14 — Playback speed, pitch and key (p14Key.tsx)

1. **MAJOR, L217–234 vs L193–197 / L202: the fault repeats the guided practice exactly.**
   - Step 2 has the learner match the tempo without key lock and hear it go flat.
   - Step 3 has them press KEY LOCK.
   - The fault "THE NEW TRACK SOUNDS SOUR" is that same state, with the same fix.
   - So the learner is not diagnosing anything; they are repeating a recipe.
   - Fix: plant a different cause with the same symptom. KEY LOCK ON, tempos matched, but KEY SHIFT left at +1 from the last blend. B KEY then reads a semitone sharp and clashes; STRETCH reads ≠ NONE with the tempo unchanged.
   - `fixed`: `rel !== 'OUT OF TUNE' && (B.keyShift ?? 0) === 0 && B.keyLock`.
   - Hints: "Read B KEY and STRETCH: the key moved, but the tempo did not." / "Something is shifting the key on purpose." / "Open KEY and set KEY SHIFT to 0."

2. **MINOR, L170: "st" is never explained** in the B PITCH readout ("−0.56 st").
   - Fix: add `sub: 'SEMITONES'` and drop the "st" from the value. Alternatively, define "st" in the Semitone term: "(written st on the readouts)".

3. **MINOR, L214: a wrong-answer line uses maths jargon:** "12·log2(0.88) ≈ −2.2 semitones".
   - Fix: "That is what happens with key lock OFF: about one semitone per 6 %, so 12 % slower is about two semitones flat."

4. **MINOR, L177: the KEY key's value is cryptic.** It reads "0 · ±8" (screenshot 14_key_matched_flat_390.jpg).
   - Fix: `valueLabel: \`SHIFT ${shift > 0 ? '+' : ''}${shift}\``. The range already shows on the plot axis.

5. **MINOR, L208–216: Check yourself is a listening prediction, not evidence.**
   - Fix: "Set deck B 12 % slower with KEY LOCK on and read STRETCH — what does the readout warn you about?" Latch on STRETCH AUDIBLE while B plays and pitch ≤ −11.5. Keep the explanation as the feedback.

## SCREEN 15 — Stems and source separation (p15Stems.tsx)

1. **MAJOR, L153 / L181: the drawing shows only one deck, but the lesson is about two.** The drawing shows the stem lanes of the selected deck only (`sel`). The Practice blend (L203, "A's DRUMS off and B's on") and the CH2 FADER key both concern deck B. With deck A selected, moving CH2 FADER changes nothing on the drawing (D75), and the learner cannot see both decks' stems at once.
   - Fix: while both decks play, draw both decks as two compact four-lane columns (A on the left, B on the right), each lane lit or dark.
   - Fix: add a "CH2 → MIX" level bar beside B's column.
   - Otherwise, at least lock CH2 FADER while `sel === 'A'`: "Select DECK B in STEMS to see it". The first fix is better.

2. **MAJOR, L41 / L160–161: the A STEMS / B STEMS readouts print initials.** They read "D B C –", and the fault's first hint (L233) tells the learner to read exactly this cell. A beginner has to decode the letters.
   - Fix: a missing part is named, e.g. `v: g.bass === 0 ? 'NO BASS' : …`. When more than one part is off, use "2 OFF" with a sub line naming them.
   - Fix: `vA11y` already spells them out; use the same words on screen.

3. **MINOR, L166–180 vs L64–70: the same control appears twice.** SOURCE is a dock key AND a row in the STEMS tray.
   - Fix: delete the WHERE THE STEMS COME FROM row from StemTray (keep the dock key, which has the better blurbs).
   - Fix: set `valueLabel` 'SEPARATED' instead of 'SEPAR.' (9 characters; measure it with fitValue).

4. **MINOR, L190–191: Step 1 has 4 sentences** (the limit is 3).
   - Fix: delete "Where the parts come from matters:" and merge: "A stem player mutes or turns down one part while the rest plays. ORIGINAL stems are the real parts; SEPARATED stems are software's guess from the finished mix (here, a labelled simulation)."

5. **MINOR, L195: "the drop" and "the hook" are not defined.**
   - Fix: "(it is in the drop — the busiest, fullest part: every part playing)" and "the hook (the catchy melody) is gone".

6. **MINOR, L211–217: Check yourself is recall.** Step 3 (L199) has already said why the hats leak.
   - Fix: make it evidence. "Deck B on SEPARATED: mute its MELODY and read MELODY LEFT. Now find the SOURCE where a muted melody is truly gone." Latch on `B.stemFrom === 'ORIGINAL' && gB.lead === 0 && B.playing`, after a SEPARATED reading has been seen.

## SCREEN 16 — Laptop software and audio interfaces, OPTIONAL (p16Laptop.tsx)

1. **MAJOR, L192: the optional-path note points the wrong way.** It says "you can go straight on to the next screens", but the next two screens (17 and 18) are optional too. A standalone learner who follows it lands on turntables.
   - Fix: "An optional screen, for a laptop rig. On a standalone or media-player system, skip to Screen 19 (Microphones) — nothing on 16–18 is needed after it."
   - Fix: add a button, `SKIP TO SCREEN 19 ›` → `ctx.goTo(DJ_PAGE_NO.indexOf(19))`. See WHOLE-LAB W1.

2. **MAJOR, L136 / L139: no feedback when a stable buffer is not the smallest.** The goals "Stable buffer, two decks" and "96 kHz…" latch only on the SMALLEST stable buffer. A learner who picks a larger buffer gets 20 s CLEAN and nothing else; the goal stays unmet and nothing says why.
   - Fix: when `clean20 && l.buffer > stableBuffer(l.workload, l.rate)`, show a Note: "Clean — but a smaller buffer may manage too, with less latency. Try one step down."

3. **MINOR, L233 vs L179: the hint names a key that does not exist.** Hint 3 says "Open OUTPUTS"; the key is "OUTPUT".
   - Fix: hint text "Open OUTPUT…".
   - Fix: the OUTPUT value "1→1 2→2" crops to "1→1 2…" (screenshot). Use `valueLabel` 'MATCHED' / 'CHECK'.

4. **MINOR, L204: the task wording is muddled.** "while both decks play two decks' work" is unclear.
   - Fix: "Find the SMALLEST buffer that runs 20 s with no dropouts, with both decks playing and the workload on TWO DECKS."

5. **MINOR, L32 / L56: "samples" and "sample rate" are used but never defined,** although sample rate is an outline topic.
   - Fix: Buffer term: "…How many samples (the numbers that make up digital sound, tens of thousands every second — the SAMPLE RATE) the software works out at a time…"
   - Fix: in Latency, "converter" → "the interface".

6. **MINOR, L180: the RIG value "MIX CTL" is cryptic.**
   - Fix: "BOTH IN" / "CTL OUT" / "MIX OUT".

7. **MINOR, L210–218: Check yourself is recall.**
   - Fix: make it evidence. Start a state with the mixer's USB out and the device on BUILT-IN, then ask: "The room is silent and the mixer is not in the device list — get the music to the crowd." Latch on the device being MIXER USB with CH1 rms > −50.

## SCREEN 17 — Vinyl turntables and phono audio, OPTIONAL (p17Vinyl.tsx)

1. **MAJOR, L247 vs L214: the first instruction names a key that does not exist.** Step 2's first instruction is "Open TURNTABLE and start it", but the key is labelled PLATTER. (The screenshot shows it was once "TURNTAB…"; the label was changed and the copy was not.)
   - Fix: "Open PLATTER and start the turntable."

2. **MAJOR, L251 vs L271–286: the learner is walked through the fault before the fault card.** Step 3 has them switch the preamp to LINE into PHONO ("two phono stages — loud, boomy, distorted"). The fault card is then exactly that state, so it is recall, not diagnosis.
   - Fix: plant the OPPOSITE fault. A raw turntable (preamp PHONO) plugged into CH1 LINE, selector on LINE: thin, quiet, no bass (`phonoCount` 0, the PhonoChain draws it).
   - Symptom: "The record is very quiet and thin, with no bass, even with the trim up."
   - `fixed`: `phonoCount(booth) === 1 && !!channelRoute(booth, 1).L`.
   - Keep Step 3's two-stage demo as the Observe.

3. **MINOR, L273 / L283: the fault text mentions a trim the screen does not have.** The symptom says "even with the trim down" and hint 3 says "Then reset the trim", but there is no TRIM control on this screen.
   - Fix: delete both phrases. Otherwise add a trim row to the PHONO tray; deleting is the simpler fix.

4. **MAJOR, L244: the optional-path note points the wrong way** (same as p16 #1). The next screen (18) is optional too.
   - Fix: use the same wording and the same SKIP TO SCREEN 19 › button.

5. **MINOR, L209: the PHONO value crops.** "RAW→PHONO" shows as "RAW→PH…".
   - Fix: `valueLabel: phonoCount(booth) === 1 ? '1 STAGE' : phonoCount(booth) === 2 ? '2 STAGES' : 'NO STAGE'`.
   - This is also the screen's own lesson word.

6. **MINOR, L205: "STAGES" alone is ambiguous.**
   - Fix: `k: 'PHONO STAGES'`. It crops to its number (D36).

7. **MINOR, load: this is the heaviest new screen.** It has three views and about 14 controls: force method, scale, anti-skate, slipmat, preamp switch, plug target, selector, ground, monitor level, monitor stand, feet.
   - Fix: drop the SLIPMAT chip (no goal, no visible effect beyond a callout). Move it to a Note line: "A slipmat lets the record slip for cueing; it is not part of the signal."

## SCREEN 18 — Digital vinyl systems, OPTIONAL (p18Dvs.tsx)

1. **MAJOR, L236: the optional-path note points the wrong way** (same as p16 #1).
   - Fix: "On a standalone system, go on to Screen 19." Here "the next screen" is actually right, so say "the next screen (19)".
   - Fix: add one line: "This screen builds on Screen 16 (laptop audio) and 17 (turntables) — do those first if you can."

2. **MINOR, L272: the hints name readouts that do not exist.** They say "Read CROWD HEARS and CH1 INPUT", but the readout is "CROWD" and the key is "CH1 IN".
   - Fix: "Read CROWD on the strip and CH1 IN in the dock, and look at the map…"

3. **MINOR, L256–262: Check yourself depends on another optional screen.** It relies on buffers, which only Screen 16 teaches, and the latency figure is told, not measured.
   - Fix: add the inline definition "(a buffer is the chunk of sound the computer works on at a time — Screen 16)". Better, make it evidence: show `rt` in a readout cell called ROUND TRIP and ask the learner to read it.

## SCREEN 19 — Microphones, announcements and talkover (p19Mic.tsx)

1. **MAJOR, L426–434 with L414: Check yourself gives its answer away, and Step 5 has no independent task.** The check asks about a wireless receiver on LINE overloading MIC 2. The overload Note at L414 states that answer word for word whenever the learner tries it. Step 5 also has no "On your own" task (13–18 all have one).
   - Fix: replace the multiple-choice question with an evidence task. "On your own: the WIRELESS receiver is in MIC 2 and the voice crunches even with GAIN at the bottom — make it clean (MIC PEAK −10…−3, no clip)."
   - Latch on `m.device === 'WIRELESS' && m.rxOut === 'MIC' && speaking && micPk in range && clean`.
   - Hide the L414 Note until the learner has had 10 s with the overload.

2. **MINOR, L402 / L388: the screen opens on a locked key.** It opens on GAIN, which is locked until the mic is plugged in.
   - Fix: `initialParam: 'mic'`.

3. **MINOR, L398: the ROUTE key is overloaded and its value names the wrong thing.** The tray holds talkover, the two sends, the mic position, the booth level and the view. Its value shows the mic POSITION ("DECKS"), yet the screen's fault is a SEND.
   - Fix: `valueLabel` shows the sends, e.g. `REC ${m.toRec ? 'ON' : 'OFF'}`.
   - Fix: move "WHERE IS THE MIC" plus SEE into the MIC tray, under a "ROOM" heading.

4. **MINOR, eventShared.tsx L174: VOICE IN prints "CRD✓ BTH— REC✓".** In the stage2b screenshot its label is dropped, so only the abbreviations remain. This cell is the fault's evidence.
   - Fix: `v: ['CROWD', 'BOOTH', 'REC'].filter(in).join(' + ') || 'NONE'`, with a sub line `NOT IN: REC`.

5. **MINOR, L69: the Look line is about 50 words.**
   - Fix: "You are looking at the mixer's front panel with its two mic inputs, the mic on its cable, the music's dip, and four meters: MIC, CROWD, BOOTH, REC."

6. **MINOR, L63: the Feedback term uses "loop gains 0 dB".**
   - Fix: "…When the sound comes round louder each time, it rings by itself…"

## SCREEN 20 — PA speakers, subs and venue connections (p20Pa.tsx)

1. **MAJOR, L360–366: Check yourself tests content the screen never teaches.** The question is about the Y-cable and the MONO master. Nothing on the screen covers summing, a MONO switch or Y-cables, even though "stereo/mono feeds, summing" is in the outline row.
   - Fix (first choice): teach it. Add a VENUE-tray row "THE BAR HAS ONE INPUT", with chips `Y-CABLE (L + R joined)` and `MIXER MONO → MASTER L`. Draw the Y-cable red on HANDOFF with a callout "OUTPUTS FIGHTING". Then the check becomes an evidence task.
   - Fix (minimum): add one Step 3 line: "A venue with ONE input gets a mono mix: the mixer's MONO switch or a summing box — never a Y-cable joining two outputs."

2. **MAJOR, L195: the booth control is filed under the wrong heading.** BOOTH −/+ sits under "THE TURNTABLE ON THE TABLE · BOOTH LEVEL". The safety note (L352) tells the learner to "Turn the BOOTH down", and the dose goal depends on it, but they will not look under a turntable heading.
   - Fix: give BOOTH −/+ its own row, "BOOTH MONITORS · LEVEL n%". Move it to the VENUE tray beside the engineer row.

3. **MAJOR, L369–380 / L280: the fault depends on an optional screen, and repeats it.** The fault is turntable acoustic feedback. It depends on Screen 17 (optional), where the same howl was already the Step 5 task. A standalone learner meets a "stylus" and "isolation feet" for the first time here, and hears no howl ("never played").
   - Fix: plant a core PA fault that uses this screen's own views. For example, DJ L and DJ R swapped on the stage box, plus the subs set to stereo, so the room's left plays the right channel. Or the 20 m run on the UNBALANCED lead, with a hum on the floor. Both are already modelled (`venueSwapped`; the UNBAL callout).
   - If the turntable howl stays: rename the cell `k: 'TURNTABLE LOOP'` to match hint 1 (L377), and add the line "(the turntable's stylus picks up the table shaking — Screen 17)".

4. **MINOR, L352: the safety note uses jargon.** "85 dBA / 8-hour reference (3 dB exchange)" goes back to the jargon that Screen 1 deliberately avoided.
   - Fix: "…is over the guideline from Screen 1 (85 dBA for 8 hours, half the time for every 3 dB more)…"

5. **MINOR, L257 / ROOM view: the map's left and right are flipped without explanation.** It shows PA R on the viewer's left (screenshot 20a), because the DJ faces down the page. The Look line does not say so.
   - Fix: add to LOOK.ROOM: "The booth is at the top, facing the floor — so the DJ's LEFT is on your right."

6. **MINOR, L193: a control with no goal adds load.** TOPS: POWERED/PASSIVE has no goal and no fault on top of a seven-goal screen. Keep it, but make the toggle optional reading: move it below the crossover row with "(see the difference in SYSTEM)".

7. **MINOR: Step 5 has no "On your own" task.**
   - Fix: "On your own: tops BEHIND THE DJ — bring your 4-hour dose back to 100 % or less without moving them" (booth level and engineer's gain only).

## SCREEN 21 — Recording and streaming (p21Rec.tsx)

1. **MINOR, L247 / L209: the screen opens on a locked key.** It opens on REC GAIN, which is locked until a TAP is chosen.
   - Fix: `initialParam: 'tap'`.

2. **MINOR, L209: REC GAIN is not locked on LOOPBACK.** On LOOPBACK the recorder is not drawn and the tap records nothing here, yet REC GAIN stays live.
   - Fix: `locked: rec.tap === 'NONE' || rec.tap === 'LOOPBACK' ? …`, with the LOOPBACK reason "Loopback records the computer's own output — there is no recorder input here."

3. **MINOR, L156: the playback goal latches only at the very end of the take** (`player.finished`). A learner who recorded two minutes has to sit through all of it.
   - Fix: latch when playback has passed the first voice mark plus 2 s. Otherwise, add the line "Play the take to its end (or record a short one)".

4. **MINOR, L268–275: Check yourself (the monitoring loop) is recall of a term.** Nothing on the screen shows such a loop.
   - Fix: add a LOOPBACK chip "APP MONITORS ITS INPUT → CH 1" that draws the loop and builds a quiet, capped echo. The check then becomes: "Stop the echo without stopping the stream."
   - Lighter fix: keep the question, and add "(see Terms: Monitoring loop)" so it reads as a reading check.

5. **MINOR, L51: "split lead" is not defined.**
   - Fix: "…joined by a split lead (two RCA plugs into one small stereo plug) into its LINE IN…"

6. **MINOR: Step 5 has no "On your own" task.**
   - Fix: "On your own: record 10 s from BOOTH OUT, move the BOOTH, then play it back and point to the jump in the take." Latch when a BOOTH-tap take shows ≥ 3 dB of change.

## SCREEN 22 — Hybrid DJ systems (p22Hybrid.tsx)

1. **MAJOR, L263 with L330: drift is never shown, yet the check asks about it.** On INTERNAL, ITS BAR 1 reads "OWN TEMPO", so the learner cannot see drift on screen. The check then asks them to predict it.
   - Fix: on INT, compute the phase against deck A anyway and show it ("+0.31 BEATS, DRIFTING"), with a sub line `DRIFT`.
   - The check can then become evidence: "Set the machine to INT at 122.0 with deck A at 122.6, start it on the one, and read ITS BAR 1 after 30 s." Latch when |barBeats| ≥ 0.25 is seen on INT after an on-the-one start.

2. **MINOR, L315: the copy names a readout that does not exist.** It says "DRUM MACHINE reads deck A's tempo"; the cell is "MACHINE".
   - Fix: "MACHINE reads…"

3. **MINOR, L135: "beat counter" is jargon.**
   - Fix: "THE MIXER'S CLOCK SWITCH (which channel's tempo it sends)".

4. **MINOR: Step 5 has no "On your own" task.**
   - Fix: "On your own: start the drum machine on the next bar with the armed START, then move deck A's tempo 1 % — it must stay ON THE ONE."

## SCREEN 23 — Performer changeovers and backup playback (p23Changeover.tsx)

1. **MAJOR, L278 with djCapstone.ts L227–235: the "no gap" rule is not enforced, and a failure is never shown.**
   - `transitionStepBy` clears `failed` the moment `done` becomes true (`failed: done ? null : s.failed`). A changeover that left the room silent mid-way therefore still ticks "Change over with no gap" on the next clean chunk with CH 2 up and CH 1 down.
   - The failure message is never shown on this screen.
   - Fix (model): once `failed`, stay failed until re-armed. Only `started && !failed` can become done. A re-arm happens when both sources are back in the start state (old up, new down).
   - Fix (test): add a test to test/djChangeover.test.ts: "a gap then a finished change is NOT done".
   - Fix (page): show `trans.current.failed` as a Note under Step 3, plus "Bring CH 1 back up and CH 2 down to try again."

2. **MAJOR, L256 / L263 / L275: one mistake fails a goal for the rest of the visit, with no way to retry.** "Connect with CH 2 down" can be failed permanently. `hotSeen` latches on the first hot patch and never resets.
   - Fix: reset `hotSeen.current = false` when USB 2 is unplugged.
   - Fix: when `hotSeen` is set, add to the HOT note: "Unplug USB 2, pull CH 2 down and connect again."

3. **MAJOR, prerequisite (optional skip): laptop audio over USB is only explained on optional Screen 16.** This screen runs on two laptops over the mixer's USB 1 / USB 2 with the channel selector on USB. A standalone learner who skipped 16 meets this here for the first time.
   - Fix: add a Step 1 sentence: "Each laptop's music reaches the mixer over its USB cable, on the channel whose input selector is set to USB (Screen 16 shows more)."
   - Fix: add a Term `USB audio`.

4. **MINOR, L334–340: Check yourself repeats the practice.** The trim question repeats "Match levels in the headphones", which the learner has just done.
   - Fix: aim it at an outline idea not yet checked — independent backups. "DJ 2's laptop and the backup stick hold the same set. Which failure would the stick NOT save you from?" (answer: the mixer's power, or the MASTER cable). The PREDICT model already grades this.

5. **MINOR, L49: "a DI's ground lift" is undefined jargon.**
   - Fix: "…an isolator (a small box that breaks the ground in the lead)…" and drop "DI".

6. **MINOR, L54: the Look line is about 55 words.** Shorten it to the board's three columns and the power row.

## SCREEN 24 — Troubleshooting and the complete system challenge (p24Capstone.tsx)

1. **BLOCKER, L340 / L350 with booth/setup.ts L47–59: "Power up safely" ticks itself on arrival.**
   - What I saw live: on arriving at screen 24 from the contents list, "✓ Power up safely: speakers last" was already ticked while the readout said POWER 0/7. The what's-left row for 24 also leaves it out.
   - Cause: `useScreenSetup` applies `prepared` (everything OFF) in a layout effect, AFTER the first render. That first render sees the previous screen's booth, which was fully powered, so `allOn && !thumped` is true and `useVisitGoals` latches it for good.
   - Fix (general): `useScreenSetup` returns `ready` (false until its layout effect has run). `useVisitGoals` takes `ready` and latches nothing before it. Every screen benefits, because any goal can be satisfied by a leftover booth (e.g. p13's FX state on returning from p14).
   - Fix (local, as well): require a power event this visit: `allOn && lastPower != null && !thumped.current`.

2. **MAJOR, L352 with djCapstone.ts L227–235: the clean-transition goal is not graded properly** (same model bug as p23 #1). "A clean transition: no gap, no clip" is cleared by any later clean chunk with B up and A down, and the failure reason is never shown.
   - It also interacts with the planted fault. TRIM_HOT clips CH 1 from the moment the doors open, so an early attempt "fails" silently.
   - Fix: the p23 #1 model fix, plus a Note under Step 2 showing `trans.current.failed`. When the planted fault is still active, add "— fix the event's fault first."

3. **MAJOR, L424 vs L446–456: the doors open from a button the learner cannot find.** Step 2 says "Then open the doors (below)". The doors are actually opened by the fault card's generic button "START THE FAULT", three steps further down, in CHECK YOURSELF. Its preamble reads "Something will go wrong in the booth…".
   - Until it is pressed, the cue, transition and announcement goals of Steps 2 and 4 cannot latch (all gated on `doorsOpen`), and nothing says why.
   - Fix: add an optional `startLabel` / `intro` to FaultCard and pass `startLabel="OPEN THE DOORS"` here. Also put an `OPEN THE DOORS ›` chip in the EVENT tray (same `setDoorsOpen` + `plant`).
   - Fix: change Step 2 to "…then open the doors: EVENT → OPEN THE DOORS (or the red card in step 5)."
   - Fix: until the doors open, show under the Step 4 goals: "The show starts when the doors open."

4. **MAJOR, L336 / L372: a thump fails the power goal with no route back explained.** One thump makes "Power up safely" unreachable until REPLAY THIS EVENT, and the THUMP text (trays.tsx L111) does not say so.
   - Fix: on this screen, add after the THUMP text: "To earn the safe power-up, switch everything OFF and press REPLAY THIS EVENT (EVENT tray) — the same faults come back."
   - Better: re-arm the goal when every device is OFF again (`POWERED.every(d => !booth.power[d])` resets `thumped`).

5. **MINOR, L259–286: the debrief can be answered by matching words, and its feedback says little.**
   - The distractors come from other subsystems, so the right option can usually be picked by matching words to the symptom ("CH 2" → the CH 2 option).
   - Wrong answers only get "That belongs to a different fault."
   - Fix (feedback): name what that option would mean, e.g. "That is the cause when: ${FAULTS[thatFault].symptom}". `debriefOptions` knows the fault ids, so return them with the options.
   - Fix (evidence part): make THE EVIDENCE part a point-at-it task. "Tap the card on the board where the signal stopped" (FlowBoard node ids per fault: CH2_SELECTOR → c2, MASTER_R → paR, REC_NO_MIC → mc…).

6. **MINOR, L283: only the first fault is debriefed.** When an event plants two faults, the second one is only told.
   - Fix: run `Debrief` for each fault in turn ("FAULT 1 OF 2"). Keep the goal latched when the first is done, and show the second as practice.

7. **MINOR, L399–408: the FADER 2 key also moves CH 1.** It carries CH 1 ↓/↑ nudges, so one key moves two faders.
   - Fix: label it `FADERS`, with `format` "CH 2 n% · CH 1 m%".

8. **MINOR, L212–251: the EVENT tray holds nine things.** Power, view, mic, record, REC GAIN, PA L cord, isolation, output cables and replay are all in one sheet, and the repairs for four faults live there.
   - Fix: give each block its existing heading in Oswald 11, and put a small row separator between POWER / THE SHOW (mic, record) / THE OUTPUTS (cords, cables) / THIS EVENT.

9. **MINOR, board diagnosis: REC_CLIP is hard to see on the board.** Its symptom says the recorder's "CLIP light keeps flashing", but the RECORDER card's sub line only says RECORDING / STOPPED.
   - Fix: sub `RECORDING · CLIP` (red) when `last.ext.clipped.rec > 0`.

**What is right about the capstone:**
- The fault bank covers every outline item on row 24: silence, distortion, hum, a missing channel, cue, recording and playback.
- None of the faults needs an optional screen.
- Each fault shows on the board (a dark or red card, or a card's sub line).
- Faults are combined only when they cannot hide each other.
- The event number replays the same faults.

The design is fair and evidence-led. The problems are its grading and how the learner finds its controls (#1–#4), not its idea.

---

## WHOLE LAB (24 screens; 16–18 optional)

W1. **MAJOR: there is no way to skip the optional paths, and the notes say the wrong thing.**
- Nothing on screen 15 tells a standalone learner to skip.
- NEXT from 15 lands on 16.
- 16 and 17 tell them to "go straight on to the next screens", which are also optional.
- CONTENTS only adds "(optional)" to the titles (seen live), with no grouping.
- Fix (screen 15): at the end of Step 5, add a Note plus button. "Next: three OPTIONAL equipment screens (laptop, turntables, DVS). On a standalone or media-player rig? SKIP TO SCREEN 19 — MICROPHONES ›" → `ctx.goTo(DJ_PAGE_NO.indexOf(19))`.
- Fix (screens 16–18): the same button in Step 1. p16 and p17 also get the wording fix.
- Fix (CONTENTS): dim the optional rows (`textSub`), or put a small "OPTIONAL PATHS" separator above row 16. This needs a `LabNavUnit` flag in the shared shell.

W2. **MAJOR: two required screens lean on the optional ones.**
- p20's fault is the turntable acoustic loop (17's concept and its isolation feet; see p20 #3).
- p23 runs on laptop USB audio pairs (16's concept; see p23 #3).
- p21 LOOPBACK and p22 USB-host are fine; their Terms cover them.
- p18 builds on both 16 and 17; say so (p18 #1).
- After those fixes, 19–24 can be taken without 16–18. The capstone already needs nothing optional.

W3. **MAJOR: words in the text that do not match the controls.** The Stage 1 review flagged this class (p02 OUTPUT vs SENDS TO) and it is back:

| Screen | The text says | The screen has |
|---|---|---|
| p13 | MIX BUS PEAK | BUS PEAK |
| p16 | OUTPUTS | OUTPUT |
| p17 | TURNTABLE | PLATTER |
| p18 | CROWD HEARS / CH1 INPUT | CROWD / CH1 IN |
| p20 | TURNTABLE LOOP | TURNTABLE |
| p22 | DRUM MACHINE | MACHINE |
| p24 | open the doors | START THE FAULT |

- Fix: one sweep. Every capitalised control or readout word in a Do, P or hint must equal a dock `label`, a tray head or a bezel `k`.
- A test can enforce it: collect `label`, `k` and tray heads, then scan the copy for capitalised words of two or more letters that are not in that set or the Terms.

W4. **MAJOR: dock keys still crop.**
- "CH1 FADE…" (p13, p15, from `channelFaderKey`).
- The p17 PHONO value "RAW→PH…".
- The p16 OUTPUT value "1→1 2…".
- Fixes: p13 #3, p17 #5, p16 #3.
- Re-measure every 13–24 key label and value at 390 px with fitValue.

W5. **MAJOR: Step 5 on 19–23 has no independent challenge.**
- On 13–18, Step 5 opens with an "On your own:" evidence task.
- On 19–23 it has only a multiple-choice check and the fault. Three of those checks are recall (p19, p21, p23), and one tests untaught content (p20).
- Fix: an "On your own" task for each, as given per screen (p19 #1, p20 #7, p21 #6, p22 #4, p23 #4).

W6. **MAJOR: two faults replay the guided steps.**
- p14's fault replays the Practice; p17's fault replays the Observe.
- Fix: plant the different causes given in p14 #1 and p17 #2. The rest of 13–24 pass: each fault is a different cause from the Practice and from the check.

W7. **MAJOR: "what this lab covers" lines 13–18 (registry.ts L56–61) are vague.** They were written without seeing the screens. Some miss the main skill, and one spelling differs from the screen. Suggested lines:

| Screen | Suggested line |
|---|---|
| 13 | Put an effect on one channel, the master or a send; time it in beats; set feedback and dry/wet; and keep a return from looping. |
| 14 | Hear how speed moves pitch, keep the key with key lock, shift it in semitones, and listen for stretch artifacts. ("artefacts" vs the screen's "Artifacts": use one spelling; the screen and its Term say "artifacts".) |
| 15 | Mute and swap stems in a blend, and hear the leakage that separated stems leave behind. |
| 16 (optional) | Send a laptop's decks to the right mixer channels, and find the smallest buffer that plays without dropouts. |
| 17 (optional) | Set tracking force and anti-skate by the method, use exactly one phono stage, ground the turntable, and stop it howling. |
| 18 (optional) | Route a control record to the software, choose ABSOLUTE, RELATIVE or INTERNAL, calibrate, and keep the control tone off the PA. |

Lines 19–24 match their screens. If the drift readout (p22 #1) lands, 22 could add "and hear drift without clock".

W8. **MINOR: three names for one thing.**
- The header says MODULE n / 24, the what's-left screen says "21 pages of 21", and the outline and the copy say "Screen".
- Fix (shell, PagedLab): let a lab pass its noun (`noun="screen"`), used by LabNavBar and LabEndScreen alike.

W9. **MINOR: long walls of text in what's-left.** Each row lists every unmet goal; for a fresh learner that is 21 rows of 6–8 goals.
- Fix: list the first three, then "+ n more" (`leftLine`).

W10. **MINOR: the "You are looking at…" lines have grown.** On 19, 20, 21 and 23 they run to 40–55 words.
- Fix: keep each to about 25 words, naming the 3–4 things the learner needs first. The `a11y` string can keep the full description.

W11. **MINOR: the CONTENTS list is a drop-down under the header, not a centred popup.** This is the shared shell (LabNavBar). It is navigation, not a milestone or feedback surface, so this may be fine; it is the owner's call whether the popups-not-pulldowns rule covers it.

W12. **MINOR, housekeeping (not learner-facing):** the header comments in DJSystemsLabScreen.tsx L4, L18 and in pages/index.ts still say "13–18 (branch dj-lab, merged later)".

**Sequence and prerequisites:**
- 13–15 build correctly on 10 (tempo pre-matched, said so).
- 19 → 20 → 21 → 23 → 24 spiral well. The mic's REC send is the 19 fault, the 21 start state and a 24 fault. The ground loop is in 23 and in 24's PA_HUM. Trim matching is in 6, 23 and 24.
- The ending's move to 24 is clean: p12 no longer has its old list. Covers lists all 24 screens by outline number, ticks per screen and marks "(optional)". FINISH leads to what's-left, which counts 21 required screens.

---

## TOP 5 MUST-FIX

1. **The capstone's "Power up safely" ticks itself on arrival (BLOCKER).**
   - Where: p24 L350 with booth/setup.ts L52.
   - Fix: return a `ready` flag from `useScreenSetup` and let `useVisitGoals` latch nothing before it. On p24, also require a power event this visit.
2. **Clean transitions are not graded properly.**
   - Where: djCapstone.ts L227–235, used by p23 L278 and p24 L352. A gap, then a finished change, still passes, and the failure is never shown.
   - Fix: keep `failed` until re-armed, show the reason, and add the missing test.
3. **The capstone's flow cannot be found or recovered.**
   - Rename the doors button OPEN THE DOORS, offer it from Step 2 or the EVENT tray, and say why the show goals wait (p24 #3).
   - Re-arm the power goal after a thump, or tell the learner to use REPLAY (p24 #4).
   - Reset p23's `hotSeen` on unplug (p23 #2).
4. **Optional paths 16–18 cannot really be skipped yet.**
   - Add SKIP TO SCREEN 19 on 15–18 and correct the notes on 16 and 17 (W1).
   - Replace or explain p20's turntable-feedback fault (p20 #3).
   - Add the USB-audio sentence to p23 (p23 #3).
5. **Copy and keys that do not match, and checks that are not evidence.**
   - One sweep to make every named control match the dock and the readouts (W3), and stop the cropped dock keys (W4).
   - Teach summing or the MONO switch before p20's Y-cable check (p20 #1).
   - Give 19–23 an "On your own" evidence task in Step 5 (W5).
   - Re-plant the p14 and p17 faults so they are not the guided steps again (W6).
