# Group F5: items to build (waves 1-3, owner go 2026-11-15)

Labs: Wave Physics Laboratory; Speaker Placement & Coverage; Room Design & Monitoring; Understanding Level & Amplitude; Foundations of Sound; Sound Playground; Microphone Principles

Items: 19 (wave 1: 4, wave 2: 8, wave 3: 7). Build wave 1 first, then 2, then 3.

## Wave 1

### WA-09 · Wave Physics Laboratory · wave 1
- **Beginner problem:** Room Builder's text opens on 'what the neighbors hear', a topic no earlier module taught, while the three recipes the intro promised come later.
- **Change to make:** The page opens on WHAT TO TRY with its three recipes, and the neighbors section moves below.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/wave/modules/modWaveB.tsx:2220 'OUTSIDE THE ROOM - WHAT THE NEIGHBORS HEAR' is first in the panel; WHAT TO TRY follows at :2227
- **Source in the audit:** G1b_WaveLab module 16, suggestion 1 (Overwhelm 4-5)
### SPK-03 · Speaker Placement & Coverage · wave 1
- **Beginner problem:** Tapping SPKR 2 silently changes which speaker the sliders move, and nothing on the map marks the chosen speaker.
- **Change to make:** The readout says which speaker the sliders move, and the chosen speaker is highlighted on the map.
- **Already partly built; what is still missing:** The map still does not show which speaker is selected.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: EDIT readout shows 'SPK 2' with first-visit caption 'sliders move' (src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:322-327; bezelCaptions.ts:120), and the slider reads 'spk 2' in blue (:373-377). Not built: the map draws no highlight on the selected box
- **Source in the audit:** Report §6 top problem 3
### SPK-04 · Speaker Placement & Coverage · wave 1
- **Beginner problem:** The intro card has the flashlight idea but does not give the beginner a clear job.
- **Change to make:** The card reads 'A speaker is a flashlight for sound. Dark seats can't hear well. Your job: light up every seat.'
- **Already partly built; what is still missing:** The card still lacks the plain goal 'dark seats can't hear well; light up every seat'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micspeaker/micSpeakerScreenGuides.ts:396-397 the learning line has the flashlight sentence; the start line is 'Tap SPKR 2 and find the hot ridge...' with no 'light up every seat' goal
- **Source in the audit:** Report §6 First 30 s
### RO-02 · Room Design & Monitoring · wave 1
- **Beginner problem:** Readouts and the plan caption use acoustician shorthand such as 'RATIO S:M:L', 'EARLY <15ms' and 'MODE (1,0,0) ... AXIAL ... SHAPE, NOT EXCITATION'.
- **Change to make:** The readouts carry plain captions, and the plan caption reads like 'Lowest front-to-back bass note (34 Hz): red piles up, blue vanishes'.
- **Already partly built; what is still missing:** The bass-map caption on the plan is still in code words, and readout captions show on the first visit only.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: first-visit captions 'room shape', 'quick echoes', 'room note' (src/screens/lab/foundations/bezelCaptions.ts:126-136). Not built: the on-plan caption src/screens/lab/roomdesign/RoomPlanView.tsx:676 still 'MODE (n,n,n) ... AXIAL · PRESSURE AT EAR HEIGHT · SHAPE, NOT EXCITATION'
- **Source in the audit:** Report §6 top problem 2, part 1 (RATIO S:M:L, (1,0,0) AXIAL)
## Wave 2

### AMP-04 · Understanding Level & Amplitude · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Two popups arrived back to back, and the intro card promises lessons on peak, RMS and dB SPL that the page itself never gives.
- **Change to make:** One popup only, saying the lab teaches one thing: the color key used on every screen, shown on six displays, then three quick questions.
- **Already partly built; what is still missing:** The single card still promises the peak, RMS and dB SPL differences instead of saying the lab teaches one thing.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built (shared): the word card now rides inside the intro card, src/features/lab/screenGuide/ScreenGuide.tsx:467 setLabTermCarrier, used by the lab's ScreenGuideHost at src/screens/lab/amplitude/AmplitudeOrientation.tsx:1068. Not built: src/screens/lab/amplitude/amplitudeScreenGuides.ts:71 still 'Also how amplitude, level, peak, RMS and dB SPL differ.'
- **Source in the audit:** Report §6 First 30 s, part 1 (one popup only, 'This lab teaches one thing')
### FO-01 · Foundations of Sound · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** After the time-or-space guess, module 7 turns into the busiest screen of the course: about 15 small labels, two rulers running opposite ways, and the three steps hidden in the text.
- **Change to make:** The answer shows in two steps (first the recording view, then the room on a tap), the steps sit on the display with FREEZE first, and the room ruler reads left to right.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/foundations/FoundationsCourseScreen.tsx:1028-1031 the whole DualDomainView appears at once after the guess; :981 the dock still opens on PROBE; :1056-1066 the 1-2-3 steps are in the reading well, not on the display
- **Source in the audit:** Report §6 top problem 1, part 1 (module 7 too dense; G1 module 7 suggestions 2-4)
### FO-02 · Foundations of Sound · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Right under the time-or-space question, THE GOAL box already says 'Studio waveforms draw TIME', so the guess is spoiled.
- **Change to make:** THE GOAL box stays hidden until the learner has tapped TIME or SPACE.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/foundations/FoundationsCourseScreen.tsx:1040-1047 the GOAL card renders before and regardless of the guess ('Studio waveforms draw TIME. Sound itself travels through SPACE.')
- **Source in the audit:** Report §6 top problem 1, part 2 (THE GOAL box gives the answer away)
### PG-02 · Sound Playground · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The SOURCE tray shows about 17 choices and the FX tray about 10, most in jargon, all at once.
- **Change to make:** The trays open on FREQ, LEVEL and the four wave shapes, and a 'More controls' fold holds noise, harmonics, phase and effects.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx:431-537 WAVE, NOISE · SWEEP, HARMONIC RICHNESS, PHASE · POLARITY, DELAY and EQ LOW-PASS sections all drawn together; :120-124 FX buttons still read 'LPF 2 kHz', 'Q 0.7'
- **Source in the audit:** Report §6 top problem 2 and First 30 s, part 2 (show FREQ, LEVEL and four shapes; 'More controls' fold)
### MI-04 · Microphone Principles · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first thing a beginner meets is the hardest page, instead of the hands-on 'drag the speaker' demo that is the lab's best moment.
- **Change to make:** The lab opens on PICKUP PATTERNS with 'A microphone hears some directions better than others. Drag the speaker around the mic...', and INSIDE THE CAPSULE moves to the end as 'For the curious'.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx:1563 SECTIONS still starts with 'capsule' (INSIDE THE CAPSULE), then 'polar' at :1564
- **Source in the audit:** Report §6 First 30 s (open on pickup patterns; capsule cutaway to the end as 'For the curious')
### WA-06 · Wave Physics Laboratory · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The home page is one long list of 15 physics titles with no grouping or plain subtitles.
- **Change to make:** The list is grouped under four plain headings (walls, bending and adding, speakers, echo and reverb), each row with a plain subtitle.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/wave/WaveLabHomeScreen.tsx:106 one heading 'MODULES 1-15' over a single list (the 15 vs 16 count was fixed, :127)
- **Source in the audit:** Report §6 First 30 s, part 1 ('Sound in rooms, in 4 parts')
### SPK-02 · Speaker Placement & Coverage · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The words used in modules 1 and 2 (fills, mains, dead zone, overlap, dispersion) are only defined in module 3, at the end.
- **Change to make:** The vocabulary page moves to the start, or each word gets a short plain meaning where modules 1 and 2 first use it.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:214-216 order is still TOP VIEW, SIDE VIEW, READING IT (vocabulary last)
- **Source in the audit:** Report §6 top problem 2
### RO-06 · Room Design & Monitoring · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab opens on the text module instead of the floor plan, which is what a beginner came for.
- **Change to make:** The lab opens on the floor plan with a card: 'Build a model of your room in steps: size, speakers, where you sit, suggested setups, panels, your report', and the first instruction is to drag the corners.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/roomdesign/registry.ts:13 module 1 is still 'intro' (What a room model can tell you); the new 'Suggested setups' module (:17) makes it seven modules, so the card would list six steps
- **Source in the audit:** Report §6 First 30 s, part 1 (open on the floor plan with a step card)
## Wave 3

### AMP-01 · Understanding Level & Amplitude · wave 3
- **Beginner problem:** The six chart cards have a title and a caption but nothing says what to notice, and the good pointers sit only in the help guide behind the info icon.
- **Change to make:** Each of the six cards gets one short 'Look for:' line, for example WAVEFORM 'taller = louder; the tall spot is the burst'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/amplitude/AmplitudeOrientation.tsx:242-259 VizCard draws only title, picture and caption; the pointer lines exist only in the guide, src/screens/lab/amplitude/amplitudeScreenGuides.ts:54-59 (TRY_BURST, TRY_SPL, TRY_SCOPE)
- **Source in the audit:** Report §6 top problem 1 (also First 30 s, 'Look for' line per card)
### FO-03 · Foundations of Sound · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Symbols such as dB, 8ve, F0 and λ appear on keys and readouts with no plain meaning, and dB is never defined in the course.
- **Change to make:** Each symbol gets a plain meaning where it first appears, dB gets a one-line definition before module 9, and '8ve' reads 'octave'.
- **Already partly built; what is still missing:** dB is still never explained in plain words, '8ve' still shows on keys, and the captions show on the first visit only.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: Hz is defined in module 5 (src/screens/lab/foundations/FoundationsCourseScreen.tsx:1876) and first-visit readout captions give F0 'base note', λ 'one wave long', ABOVE 110 'octaves up' (src/screens/lab/foundations/bezelCaptions.ts:85-101). Not built: no plain dB definition in module 9's text (FoundationsCourseScreen.tsx:1968-1972); '8ve' still on the OCTAVES keys and readout (:1107, :1127)
- **Source in the audit:** Report §6 top problem 2 (dB, Hz, 8ve, F0, λ never explained)
### PG-01 · Sound Playground · wave 3
- **Beginner problem:** Opened from the menu, the Playground never says it is meant after Foundations of Sound, so it looks like a place to start.
- **Change to make:** The intro card and the top of the page say 'Best after Foundations of Sound; every control here was taught there', with a way to go to that lab.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/foundations/foundationsScreenGuides.ts:562-563 card mentions 'every property from Foundations of Sound' but never says to do that lab first; src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx:610 subtitle 'Drive the views, hear the change - experiment freely'
- **Source in the audit:** Report §6 top problem 1 and First 30 s, part 1 ('the Foundations of Sound toolbox... start there')
### MI-03 · Microphone Principles · wave 3
- **Beginner problem:** Words like 'monitor wedge' and 'rear ports' are used in the text and in the checks without ever saying what they are.
- **Change to make:** Each gets a few plain words where it first appears, for example 'monitor wedge (a floor speaker pointing back at the performer)'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx:531 and :539 'monitor wedge' in the text and check question with no gloss; :548 'rear ports' unexplained. OMNI does have a plain tray blurb at :78
- **Source in the audit:** Report §6 top problem 3 (monitor wedge, omni, ports used before defined)
### WA-05 · Wave Physics Laboratory · wave 3
- **Beginner problem:** RT60 is used on the page from module 2 on, but its plain meaning is only in the help guide and in a check answer in module 15.
- **Change to make:** Module 2's text and the top of module 15 say once: 'RT60 is how long the room takes to fall 60 dB, about to silence'.
- **Already partly built; what is still missing:** The lesson text itself still never says what RT60 means before using it.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: guide line src/screens/lab/wave/waveScreenGuides.ts:120 and first-visit caption 'ring time' (bezelCaptions.ts:79). Not built: page text src/screens/lab/wave/modules/modWaveA.tsx:609 uses 'the RT60 table' with no definition; module 15 defines it only in the check reveal, src/screens/lab/wave/modules/modWaveB.tsx:1689
- **Source in the audit:** Report §6 top problem 3, part 3 (RT60 used from module 2, defined in module 15)
### SPK-01 · Speaker Placement & Coverage · wave 3
- **Beginner problem:** Module 2 silently switches from a top view to a side view, so a beginner first reads it as the same room, only shorter.
- **Change to make:** The display says 'SIDE VIEW: stage on the left, back wall on the right'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micspeaker/viz.tsx:3872 SideCoverageView draws no text label; src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:215 the module blurb does not say it is a side view
- **Source in the audit:** Report §6 top problem 1
### RO-03 · Room Design & Monitoring · wave 3
- **Beginner problem:** RT60 is used as a readout and in the treatment text but never defined in this lab.
- **Change to make:** The treatment page says once: 'RT60 is how long the room rings after a sound stops'.
- **Already partly built; what is still missing:** No sentence on the page says what RT60 means.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: first-visit captions 'mids ring' / 'lows ring' (src/screens/lab/foundations/bezelCaptions.ts:133-134). Not built: src/screens/lab/roomdesign/modules/modTreatment.tsx:239 and :335 use RT60 with no definition
- **Source in the audit:** Report §6 top problem 2, part 2 (RT60 never defined)
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