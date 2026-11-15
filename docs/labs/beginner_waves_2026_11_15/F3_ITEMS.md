# Group F3: items to build (waves 1-3, owner go 2026-11-15)

Labs: Game Audio Lab (NEW); Stage Plot and Channel Designer (NEW)

Items: 13 (wave 1: 4, wave 2: 5, wave 3: 4). Build wave 1 first, then 2, then 3.

## Wave 1

### GA-04 · Game Audio Lab (NEW) · wave 1
- **Beginner problem:** Several step 3s still ask for three or four actions in one sentence, so a beginner does the first one and skips the rest.
- **Change to make:** Those steps become short numbered parts (a, b, c), one action each.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gameaudio/pages/p07Instances.tsx:160 one sentence with four actions (SPEED 2, GENERATOR 1 off, REMOVE GENERATOR 2, start the fault); p08GameSyncs.tsx:240 three actions in one sentence
- **Source in the audit:** Report §6 top problem 3, part 2, and Before-release bullet 'split multi-action steps into a/b/c'
### GA-05 · Game Audio Lab (NEW) · wave 1
- **Beginner problem:** Walking works three different ways on neighboring pages, and walking back through the door with a degrees slider is where a beginner gives up.
- **Change to make:** The walk pages all use the same friendly control, such as a WALK slider with step left and step right buttons.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gameaudio/pages/p10Loops.tsx:125 and p11Distance.tsx:113 still use FACING plus STEP; p12Walls.tsx:164 uses its own WALK slider with STEP WEST / STEP EAST (:93-94)
- **Source in the audit:** Report §6 top problem 3, part 3, and Before-release bullet 'one walking control across pages 10-12'
### GA-17 · Game Audio Lab (NEW) · wave 1
- **Beginner problem:** The capstone page did not say its goals reset when you leave, and it shows two separate activity logs.
- **Change to make:** The page says the marks start empty when you come back, and one log with a filter would replace the two.
- **Already partly built; what is still missing:** The capstone still shows two activity logs instead of one.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/gameaudio/bitsLogic.ts:175 'these marks start empty when you come back' under every page's goals. Not built: pages/p22Capstone.tsx:388 and :394 still draw two ActivityLog boxes
- **Source in the audit:** Before-release page fix: page 22 (say goals reset when you leave; one activity log, not two)
### PLOT-02 · Stage Plot and Channel Designer (NEW) · wave 1
- **Beginner problem:** Every tab showed its full professional depth on day one: SETUP's 25 fields, INPUTS' stage boxes and DI sections, and three zero counts on MONITORS.
- **Change to make:** SETUP now shows only the band and performers open with five folded parts; INPUTS and MONITORS would fold their advanced parts the same way and lead with the question card.
- **Already partly built; what is still missing:** INPUTS still shows every advanced section for a one-row list, and MONITORS still opens with three zero counts.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/stageplot/SetupArea.tsx:444 FoldSection for THE GIG (and four more), src/features/stageplot/spSetupFolds.ts. Not built: src/screens/lab/stageplot/InputsArea.tsx:352-356 OrderPanel, DiPanel, BoxPanel, SummaryPanel, ExtrasPanel always open; MonitorsArea.tsx:296 the three counts still come before the questions at :330
- **Source in the audit:** Report §6 top problem 2, with First 30 s 'keep advanced sections folded' and Before-release bullet 'fold THE GIG … NOTES' (G5 INPUTS and MONITORS screens)
## Wave 2

### GA-01 · Game Audio Lab (NEW) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Many pages still show a row of 6 or 7 new words to tap, so one idea looks like seven and a beginner starts skimming.
- **Change to make:** Each page's word row keeps only the 2 to 4 words that page actually uses, and the others move to the page that teaches them.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gameaudio/pages/p05Sounds.tsx:51, p13Formats.tsx:46 and p14Music.tsx:55 still list 7 terms each; p06Pipeline.tsx:47, p09Variation.tsx:42, p11Distance.tsx:49 and p17Budgets.tsx:60 list 6. Only old page 4 got shorter, by the split (p04Games.tsx:47 has 1)
- **Source in the audit:** Report §6 top problem 1, with the 'cut chip rows to 2-4 words' Before-release bullet (G5 pages 2, 5, 6, 9, 13, 14)
### GA-07 · Game Audio Lab (NEW) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Tool brand names and pro details, like the Wwise and FMOD paragraph in page 8's first step, sit in the main text a beginner must read.
- **Change to make:** Those passages move into a closed PRO NOTE or Go deeper fold at the end of the step, with nothing removed.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gameaudio/pages/p08GameSyncs.tsx:230 the Wwise / RTPC / FMOD paragraph is still open in step 1; p07Instances.tsx:162 'Some tools keep such a value…' open; p13Formats.tsx:116 four brand renderers open; no fold of any kind exists in the lab's pages
- **Source in the audit:** Before-release bullet 'move tool and pro notes (pages 7, 8, 12, 13, 16, 17) into a PRO NOTE fold'
### GA-08 · Game Audio Lab (NEW) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The output formats page is still the heaviest in the lab: four brand names, seven new words and an experience that needs headphones.
- **Change to make:** The page opens with its question (two speakers, yet sound from behind you, how?), keeps stereo, headphone 3D and mono, and folds surround and brand names away.
- **Already partly built; what is still missing:** Only the no-headphones line was added; the page is still as long and as word-heavy as before.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/gameaudio/pages/p13Formats.tsx:125 'No headphones? Read the strip instead.' Not built: p13Formats.tsx:116 object audio and Dolby Atmos, DTS:X, Windows Sonic, Tempest still open in step 1; :46 seven terms
- **Source in the audit:** Report §6 top problem 4 (old page 13 Output formats, Overwhelm 5; now page 15)
### GA-12 · Game Audio Lab (NEW) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** From page 1 every page shows a VOICES number and dB values that nothing explains, and page 1 only says a later page explains them.
- **Change to make:** Page 1 adds one line, 'a voice is one sound playing right now', and the numbers that are not yet taught are hidden or marked as coming later.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gameaudio/GaLab.tsx:307-308 PLAYING and VOICES are added to every page's readouts; pages/p01Welcome.tsx:111 'PLAYING and VOICES count what is sounding now. Page 8 explains them.' with no meaning of voice
- **Source in the audit:** Report §6 First 30 s, part 3 (hide VOICES and dB until taught; add 'voice = one sound playing right now')
### PLOT-08 · Stage Plot and Channel Designer (NEW) · wave 2
- **Beginner problem:** The library shows six equal START buttons and never says Blank stage is the learning path that completes the lab.
- **Change to make:** Blank stage is marked as the recommended start for learners, with '5 guided steps, completes this lab'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/stageplot/ProjectLibrary.tsx:220-229 every template gets the same START; src/features/stageplot/spTemplates.ts:47 Blank stage only says 'Nothing is placed and nothing is assumed.'
- **Source in the audit:** Report §6 First 30 s, part 2 (one recommended button, START FROM A BLANK STAGE, 5 guided steps)
## Wave 3

### GA-02 · Game Audio Lab (NEW) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Readouts and words like VOICES, take, dB and bar appear many pages before anything says what they mean.
- **Change to make:** Each of these words gets a short plain meaning on the page where the learner first meets it.
- **Already partly built; what is still missing:** The captions show on a first visit only and are two words long; take, dB, bar and voice still have no plain meaning where they first appear.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/gameaudio/bitsLogic.ts:100-129 a small caption under readouts on a first visit only (VOICES 'used/max', SOLO 'heard alone', DUCK 'others dip', PAN 'left / right'). Not built: pages/p02Reacts.tsx:72 still says 'an opening take' with no meaning; pages/p14Music.tsx:196 uses 'bar' undefined; no line in the lab explains dB; voice is first defined on the budgets page (p17Budgets.tsx)
- **Source in the audit:** Report §6 top problem 2, merged with the Before-release bullet 'explain voice, take, virtual, dB, pan, bar, SOLO, bus and ducking where they first appear'
### GA-11 · Game Audio Lab (NEW) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Page 1 opens on the picture with no caption on it; the 'this is a game world from above' sentence sits under the display, and nothing says a game asks for sounds.
- **Change to make:** One short caption on the picture says what it is and that a game asks for sounds when things happen, with one instruction: set LEVEL low, then press SCENE.
- **Already partly built; what is still missing:** The caption on the picture and the 'a game asks for sounds' idea are still missing.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/gameaudio/GaLab.tsx:284 and :330 a 'drawing…' line instead of a blank panel. Already there before the audit: pages/p01Welcome.tsx:107 the 'You are looking down…' line, but in step 1 under the display. Not built: no caption on the picture itself and no 'asks for sounds' sentence
- **Source in the audit:** Report §6 First 30 s, parts 1 and 2 (labelled picture with one caption, and one instruction)
### PLOT-10 · Stage Plot and Channel Designer (NEW) · wave 3
- **Beginner problem:** The tab bar grows '? 1' marks with nothing on screen saying what they mean.
- **Change to make:** The first time a mark appears, a short line says '? = a question for you to answer in this tab'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/stageplot/StagePlotLabScreen.tsx:374 and :389-391 draw '? n' on the tab with no legend; the only explanation is in the guided task text (GuidedTask.tsx:30)
- **Source in the audit:** Before-release bullet 'add a legend for the ? 1 markers'
### PLOT-15 · Stage Plot and Channel Designer (NEW) · wave 3
- **Beginner problem:** On a full plot the white numbers and blue M codes are not in the KEY, which explains symbols only.
- **Change to make:** The KEY gets one more line: a boxed number is an input channel, an M code is a monitor mix.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/stageplot/spSymbols.ts:971-975 spPlotKey lists only the kinds of objects; src/screens/lab/stageplot/stage/StageKey.tsx draws only those entries
- **Source in the audit:** Before-release bullet 'add a KEY legend for the white numbers and M-codes on examples'
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