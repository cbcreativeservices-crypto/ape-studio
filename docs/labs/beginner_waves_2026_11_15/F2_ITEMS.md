# Group F2: items to build (waves 1-3, owner go 2026-11-15)

Labs: Sound Systems Lab; DJ Systems Lab; All labs (shared)

Items: 13 (wave 1: 5, wave 2: 4, wave 3: 4). Build wave 1 first, then 2, then 3.

## Wave 1

### SS-09 · Sound Systems Lab · wave 1
- **Beginner problem:** The faulty station used to read 'OK · HUM' or 'OK · WRONGCONTENT', and some stations still contradict their own name, such as 'Monitor EQ: Not in the monitor path'.
- **Change to make:** Badges say the problem in plain words with no 'OK' in front, and every station gives a reading that makes sense for its name.
- **Already partly built; what is still missing:** The feedback case's Monitor EQ reading and the powered-top case split into two stations still confuse.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/soundsystems/fixHelpers.ts:20-33 a flagged healthy station reads the flag alone ('HUM', 'WRONG CONTENT'). Still there: src/features/soundsystems/faults.ts:666 'Not in the monitor path.' on the feedback case; :348 'Powered cabinet — the amplifier is inside it.' with the hum shown on a separate loudspeaker station
- **Source in the audit:** G5c cross-case finding 4 (and G5b 'OK badges')
### SS-11 · Sound Systems Lab · wave 1
- **Beginner problem:** On 'Trace the signal' the dock button is called NEXT, the same word as the page's own NEXT button, so a beginner leaves the page by mistake.
- **Change to make:** The dock button gets its own name, such as STATION, as other pages already use.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/soundsystems/pagesLearnA.tsx:201 dock key label: 'NEXT' (page 1 at :72 already uses 'STATION')
- **Source in the audit:** G5 page 2 'Trace the signal', suggestion 1 (G5 problem 2)
### DJ-04 · DJ Systems Lab · wave 1
- **Beginner problem:** Many goals only tick while a deck is playing, so a learner who does the right thing with the deck stopped sees no tick and no reason.
- **Change to make:** When the action is right but the deck is stopped, the goal says 'Right, now press PLAY to hear it'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/dj/bits.tsx:95-107 goal chips show only ✓ or ○ with no waiting line; e.g. src/screens/lab/dj/pages/p15Stems.tsx:135 'mute the melody' counts only while the deck plays
- **Source in the audit:** Report §6 top problem 3, part 1 (G5b screens 3, 7, 14, 15, 17)
### DJ-05 · DJ Systems Lab · wave 1
- **Beginner problem:** The intro card and the page's own step name different first controls, so a beginner does not know which to do first.
- **Change to make:** The intro card's 'where to start' and the page's first step name the same first action.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Screen 1: src/screens/lab/dj/djScreenGuides.ts:30 starts with the exposure tile, p01Welcome.tsx:202 starts with STOP then PLAY A. Screen 3: djScreenGuides.ts:93 starts with PATCH, p03Connect.tsx:437 starts with IDENTIFY
- **Source in the audit:** Report §6 top problem 3, part 2 (G5 screens 1, 2, 3)
### DJ-08 · DJ Systems Lab · wave 1
- **Beginner problem:** On the final event, a learner who fixes the faults first can let the playing track run out, and then the clean-transition goal keeps failing with no word that the music has ended.
- **Change to make:** A deck about to run out shows 'TRACK ENDING' in time, or the on-air track keeps going during the event so the transition can always be tried.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/dj/model/djCapstone.ts:510 the only message is 'The room went quiet during the change'; no track-ending warning or loop anywhere in src/screens/lab/dj (grep). The auditor inferred the track ran out but did not prove it
- **Source in the audit:** Report §6 fault result (screen 24 transition not passed) and G5c screen 24, suggestion 3
## Wave 2

### SS-01 · Sound Systems Lab · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** From chapter 5 on, pages show formulas and words like comb-filter before saying the idea in plain words, so a beginner stalls.
- **Change to make:** Each heavy page opens with one plain sentence of the idea, and the formula moves under a fold the learner can open.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/soundsystems/pagesLearnB.tsx:698-699 the load page still prints 'Ztot = 1 ÷ Σ(1/Zi)' first, then the paragraph, no fold; src/screens/lab/soundsystems/pagesLearnA.tsx:435 'comb-filter' still used with no plain meaning on the page
- **Source in the audit:** Report §6 top problem 1 (G5 pages 5, 8-18)
### SS-10 · Sound Systems Lab · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The console panel in the later capstones crams 40 to 80 small controls into one phone popup, with three routing ideas at once.
- **Change to make:** The panel shows only what the current step needs (for example GROUP, then EFFECTS, then DCA), with the rest folded away.
- **Already partly built; what is still missing:** Capstones 7, 8 and 10 still show the full dense panel.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/soundsystems/pagesBuild.tsx:530 the 'core channels first, MORE CHANNELS' fold applies only to capstone 6 (capstone.id === 'monitors'); capstones 7, 8 and 10 still open the full panel
- **Source in the audit:** G5b BUILD capstones 7, 8, 10 (Overwhelm 5 inside CONSOLE)
### DJ-10 · DJ Systems Lab · wave 2
- **Beginner problem:** Several faults only count as fixed after a second step the learner is not told about at that moment, such as bringing the fader back up or talking into the mic.
- **Change to make:** Once the first half of the fix is done, a line says what to do next to prove it, for example 'Routed. Now press TALK NOW'.
- **Already partly built; what is still missing:** The next step shows only if the learner opens the third hint; nothing tells them at the moment the first half is done.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** The missing step is now in the last hint: src/screens/lab/dj/pages/p10Tempo.tsx:313 '…then bring CH2 back UP'; p11Grid.tsx:305 'set a NEW loop'; p19Mic.tsx:776 'Then TALK again'. No line appears on its own after the first half is done
- **Source in the audit:** G5c cross-screen finding 3 (screens 10, 11, 19)
### DJ-11 · DJ Systems Lab · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Screen 4 opens with a paragraph of about 100 words about mirror views, scale and house left before the one idea of the screen.
- **Change to make:** Step 1 is cut to two sentences (you are behind the booth so left and right swap; plug 9 cables, then switch things on with speakers last), and the rest moves to the screen guide.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/dj/pages/p04Build.tsx:136 the LOOK text is still about 100 words of layout description
- **Source in the audit:** G5 screen 4 (Overwhelm 5), suggestion 1
## Wave 3

### SH-69 · All labs (shared) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** After fixing a fault in Sound Systems, nothing turns the fix into a rule to remember.
- **Change to make:** Each fixed fault would end with a short 'Fixed.' paragraph stating the lesson.
- **Already partly built; what is still missing:** Sound Systems faults have no 'Fixed.' paragraph.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Game Audio has one: src/screens/lab/gameaudio/pages/data/gaFaults.ts; no 'Fixed.' paragraph found in src/screens/lab/soundsystems/
- **Source in the audit:** Report §5 row 14: DJ 'Fixed.' paragraphs that turn a fault into a rule, copy to Sound Systems and Game Audio faults
### SS-04 · Sound Systems Lab · wave 3
- **Beginner problem:** The home page never shows the whole signal chain in one line or says on screen to start with LEARN.
- **Change to make:** One card at the top of the home page reads SOURCE → STAGE INPUT → MIXER → PROCESSING → AMPLIFIER → SPEAKER → LISTENER and 'Start with LEARN'.
- **Already partly built; what is still missing:** The chain line and a 'start with LEARN' mark are not on the home page itself, only in a popup that closes.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/soundsystems/soundsystemsScreenGuides.ts:29 the intro popup does say 'Tap the LEARN card first'; but SoundSystemsLabScreen.tsx:165-167 has no chain and the mode cards (:170-192) carry no START HERE; LEARN page 1 has the order only inside a body sentence (pagesLearnA.tsx:161)
- **Source in the audit:** Report §6 First 30 s, part 1 (also G5 first-30-s rewrite)
### DJ-06 · DJ Systems Lab · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Screen 1 opens by describing the drawing, and the lab's big idea (every DJ setup does four jobs) only appears on screen 2.
- **Change to make:** A caption over the booth on screen 1 says: every DJ setup does four jobs: PLAY the music, MIX it, let YOU hear the next track, let the ROOM hear the mix.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/dj/pages/p01Welcome.tsx:196-197 screen 1 opens with the 'You are looking at…' line and the lab summary; the four-jobs sentence is only at src/screens/lab/dj/pages/p02Gear.tsx:583
- **Source in the audit:** Report §6 First 30 s, part 1
### DJ-13 · DJ Systems Lab · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The gain goal on screen 6 is a range of moving dBFS numbers, so a beginner cannot tell when they are inside it.
- **Change to make:** A green band on the channel meter shows the target, the way screen 19 already does for the microphone.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/dj/pages/p06Gain.tsx:223 the target is numbers only ('−21…−15 dBFS with its peaks under −3'); screen 19 already has a green bracket (p19Mic.tsx:730)
- **Source in the audit:** G5 screen 6 suggestion 1, G5b screen 6 suggestion 2, G5c screen 21 suggestion 1
## Sweep items: do these in EVERY lab you own (shared suggestions, per-lab work)

### SH-11 · All labs (shared) · wave 1
- **Beginner problem:** Many first steps say 'tap ▶ and listen', so a learner with sound off has nothing to do.
- **Change to make:** Each lab's WHERE TO START would open with a step that can be seen without sound, such as dragging a fader and watching the picture.
- **Already partly built; what is still missing:** Labs outside the effect group were not checked one by one, so some WHERE TO START lines may still begin with a listening step.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built in the 12 effect labs, whose sound-off lines name a silent step (src/screens/lab/fxLabConfigs.tsx:173, :344, :491 ...). Each lab's own guide text was not read one by one; per-lab checkers cover that.
- **Source in the audit:** Report §2 pattern 3, suggested change 1 ('every WHERE TO START gets a silent first step')
### SH-15 · All labs (shared) · wave 1
- **Beginner problem:** With sound off, live readouts sit empty, so the learner cannot see what they would have heard.
- **Change to make:** A readout shows a stored or model value, marked as not heard, while sound is off.
- **Already partly built; what is still missing:** Only two lab files fill in a stored value; other live readouts still go blank with sound off.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** API built: src/screens/lab/rack/rackTypes.ts:64 BezelItem.silent. Used only in src/screens/lab/FxLabScreen.tsx and src/screens/lab/foundations/FoundationsCourseScreen.tsx.
- **Source in the audit:** Report §3 row 3 ('show stored values when sound is off')
### SH-27 · All labs (shared) · wave 1
- **Beginner problem:** At phone width, labels were cut to things like 'POSITI…' or 'TOO', leaving a bare number.
- **Change to make:** A dock label that cannot fit now wraps to two lines at 9 pt instead of being cut.
- **Already partly built; what is still missing:** Labels drawn inside a lab's own picture still depend on each lab's fix.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/rack/DockButton.tsx:261 numberOfLines={labelWraps ? 2 : 1}. Tags drawn by a lab's own picture (Gain stage tag, Sound Systems wedge names) were S3 shared needs for those labs; not re-checked here.
- **Source in the audit:** Report §2 pattern 6, suggested change 4 (merged with §3 row 8 'two-line labels instead of truncation')
### SH-35 · All labs (shared) · wave 1
- **Beginner problem:** In some labs the dock keys change order from page to page.
- **Change to make:** Each lab would keep the same dock key order on every page.
- **Already partly built; what is still missing:** No lab-by-lab check of key order was done after the fix rounds.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** SHARED_API S3 §6 left key order to each lab (it is the lab's own params list); not checked lab by lab here, so the closest status is PARTLY
- **Source in the audit:** Report §3 row 8 ('the same key order on every page')
### SH-36 · All labs (shared) · wave 1
- **Beginner problem:** One control has several names (LOW CUT/HPF, MIX/WET, FDBK/FEEDBACK), and words and picture sometimes disagree.
- **Change to make:** Each control would use one name everywhere: card, dock, readout and check.
- **Already partly built; what is still missing:** A lab-by-lab sweep of control names across cards, docks and readouts has not been done.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Check prompts now use the labs' real control names (S2 P2-3, e.g. Chorus 'MIX', FM 'INDEX' in src/features/lab/understandingChecks.ts); no full name sweep per lab is recorded
- **Source in the audit:** Report §2 pattern 9, suggested change
### SH-64 · All labs (shared) · wave 1
- **Beginner problem:** Controls that do nothing for the current choice still look live.
- **Change to make:** A control the choice ignores is greyed out with a reason.
- **Already partly built; what is still missing:** Other rack labs with controls that do nothing in some modes have not been checked or greyed out.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Equalizer built: src/screens/lab/fxLabConfigs.tsx:234-238 ignoredBy (GAIN on pass filters, Q on high-pass). ignoredBy is used nowhere else (only FxLabScreen.tsx and fxLabConfigs.tsx)
- **Source in the audit:** Report §5 row 9: grey out controls a choice does not use (EQ Lab module 6), copy to Equalizer and other racks
### SH-12 · All labs (shared) · wave 2
- **Beginner problem:** With sound off, nothing on screen said the steps can still be done by watching.
- **Change to make:** A 'Sound off? You can still do every step' line shows at the top of the lesson while sound is off.
- **Already partly built; what is still missing:** Labs with a ▶ outside that list have no sound-off line yet.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Frame: src/screens/lab/rack/silentRules.ts:8 SOUND_OFF_LINE, drawn by RackUnit.tsx:481. Used in 20 lab files: all 12 effect labs, Signal Chain, Mastering, both Mixing labs, DJ, Game Audio, Bass, Modular, Autotune, Harmonograph, FM, Harmonics, Noise, Oscillator, Binaural, Foundations. Not found in EQ Lab, Tuning, Drum Tuning, Cymatics, Wave, Mic, Speaker, Room, Digital, Gain, Meter, Amp, Tube, Sound Systems.
- **Source in the audit:** Report §2 pattern 3, suggested change 2 (merged with §3 row 3 'frame line')
### SH-14 · All labs (shared) · wave 2
- **Beginner problem:** A listening step gives a learner who cannot use sound no way forward.
- **Change to make:** Every listening step would offer a 'can't listen now' way past it.
- **Already partly built; what is still missing:** Other labs with listening steps have no shared 'can't listen now' path.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Found in Miking (src/screens/lab/miking/engine/listenLine.ts), Game Audio, Signal Chain, Digital and Binaural; owner decision 4 gives Ear Training its own 'needs sound' way out. No shared 'can't listen now' control exists in src/screens/lab/rack/.
- **Source in the audit:** Report §2 pattern 3, suggested change 4 (merged with §3 row 3 'can't listen now path')
### SH-37 · All labs (shared) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Learners saw developer lines such as 'install the newest dev build' and 'update the app to see it'.
- **Change to make:** Developer-build lines now show only in development builds, but store builds still say 'update the app to hear it' in several labs.
- **Already partly built; what is still missing:** About ten 'update the app to hear or see it' lines remain for phones whose app is older than the feature.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Dev-only now: src/screens/lab/foundations/FoundationsCourseScreen.tsx:1411 __DEV__, src/screens/lab/BinauralLabScreen.tsx:449, src/screens/lab/FmLabScreen.tsx:403. Still in store text: FmLabScreen.tsx:405, HarmonographLabScreen.tsx:754, HarmonicsView.tsx:2013, ModularLabScreen.tsx:673, BassLabScreen.tsx:589, cymatics/CymaticsHomeScreen.tsx:61, foundations/bits.tsx:464
- **Source in the audit:** Report §2 pattern 10, suggested change 1
### SH-26 · All labs (shared) · wave 3
- **Beginner problem:** Codes such as F0, THD, LOSS/BNC and 'FS' were used with no spelled-out meaning.
- **Change to make:** Each code would be spelled out the first time it appears, such as 'F0 · the note'.
- **Already partly built; what is still missing:** Codes inside lesson text and dock keys are not spelled out by any shared rule.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Readout codes now get first-visit captions (SH-24), and Digital 'FS' has one meaning (round 1 report §2). Codes in lesson text and dock labels have no shared rule; not checked lab by lab.
- **Source in the audit:** Report §2 pattern 6, suggested change 3 ('spell out codes on first view')
### SH-76 · All labs (shared) · wave 3
- **Beginner problem:** Some tray choices are bare names with no line saying what they mean.
- **Change to make:** Each tray choice would carry a one-line meaning.
- **Already partly built; what is still missing:** Not every tray choice has been checked for a one-line meaning.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** The tray option has a blurb field (src/screens/lab/rack/rackTypes.ts:145) and many labs fill it (e.g. fxLabConfigs.tsx 23 blurbs); trays were not checked one by one
- **Source in the audit:** Report §5 row 21: tray choices with a one-line meaning (Equalizer TYPE, Meter module 5), copy to all trays