# Group F8b: items to build (waves 1-3, owner go 2026-11-15)

Labs: Tuning & Temperament; Cymatics; Harmonograph; Speech & Voice; Ear Training Lab; Bass Guitar Physics

Items: 17 (wave 1: 11, wave 2: 2, wave 3: 4). Build wave 1 first, then 2, then 3.

## Wave 1

### TU-04 · Tuning & Temperament · wave 1
- **Beginner problem:** In the Just Intonation chapter three dock keys read LOCKED, which looks like a members-only lock, when they only mean 'not yet, reveal more notes first'.
- **Change to make:** A key that is not ready yet reads 'after 2 notes' or 'after all 8', dimmed, instead of LOCKED.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/rack/RackUnit.tsx:588 (and :640, :691) every locked key prints value="LOCKED"; src/screens/lab/tuning/chapters/ch7Just.tsx:169 and :185-186 PLAY, TONIC and RETUNE use it; the reason shows only after a tap
- **Source in the audit:** Report §6 top problem 3, part 2 (G7_TuningLab ch 8)
### CY-01 · Cymatics · wave 1
- **Beginner problem:** The home shows four bright studio buttons before the eight learn modules, and the lab's designed 17-experiment series is hidden inside module 8.
- **Change to make:** The learn modules come first, the studios move below them under a 'Studios, free play' heading, and START THE SERIES gets its own spot on the home after module 1.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cymatics/CymaticsHomeScreen.tsx:190-205 the four studio buttons still sit above LEARN & EXPERIMENT at :207-212; the START HERE row at :172-182 predates the audit and the source comment at :166-171 still describes the problem
- **Source in the audit:** Report §6 top problem 1 (G7_CymaticsLab home, module 8)
### CY-03 · Cymatics · wave 1
- **Beginner problem:** Readouts and labels use math or model names such as '(2,0)+(0,2)', 'P5', 'S+H', 'a/a꜀', 'Ritz' and 'Bessel'.
- **Change to make:** Readouts get short plain captions, and the values and notes would say things like 'fifth', 'Sand + heat', '1.6x the shake needed' and 'drumhead modes'.
- **Already partly built; what is still missing:** The values themselves still read as math codes; only captions under them were added.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: plain first-visit captions on every readout (src/screens/lab/cymatics/modules/modNodes.tsx:131 caption 'which pattern'; LiquidStudioScreen.tsx:533 'vs threshold'), STRNG now reads under SYSTEM 'what vibrates' (modSystems.tsx:488). Still there: src/features/cymatics/plateBezel.ts:15-21 MODE value still '(2,0)+(0,2)'-style; modHarmony.tsx:60 short 'P5'; modChange.tsx:51 and PlateStudioScreen.tsx:99 'S+H'; LiquidStudioScreen.tsx:533 key 'a/a꜀'; modNodes.tsx:125 model note still names 'Ritz' and 'Bessel'
- **Source in the audit:** Report §6 top problem 3 (G7_CymaticsLab modules 2, 3, 5, 6, Liquid studio)
### CY-04 · Cymatics · wave 1
- **Beginner problem:** The home's first picture carries the badge 'SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN', and there is no simple numbered path under 'Does a note have a shape?'.
- **Change to make:** Under one sand-plate picture: 'Does a note have a shape? Let's test it. 1 Watch sand find the still lines. 2 Change one thing. 3 Run the experiments.', with a plain one-line badge.
- **Already partly built; what is still missing:** The hero badge is still jargon, and the path is one small line rather than three numbered steps that each open their place.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cymatics/CymaticsHomeScreen.tsx:178-181 START HERE already names the path in one line and :184 the 'Does 440 Hz have a shape?' hook (both before the audit); :164 the hero badge is still the all-caps jargon line
- **Source in the audit:** Report §6 First 30 s
### HG-03 · Harmonograph · wave 1
- **Beginner problem:** The SHAPE key reads '90°·M·R', a code no beginner can decode.
- **Change to make:** The key reads in words, such as '90° · medium · rotary', or shows only the setting that changed.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/HarmonographLabScreen.tsx:605 valueLabel `${phase}°·${damping.label[0]}${rotary ? '·R' : ''}`
- **Source in the audit:** Report §6 top problem 3
### HG-04 · Harmonograph · wave 1
- **Beginner problem:** The intro starts with 'Musical intervals are frequency ratios' instead of telling a beginner what this old machine does.
- **Change to make:** The intro opens: 'This old machine draws music. Two swinging arms move the pen. When their speeds make a musical interval, the drawing closes into a neat shape. Tap TUNE, then 2:1 OCTAVE, and watch.'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/harmonographScreenGuides.ts:40-41 the EXPLORE intro learning and start lines are unchanged
- **Source in the audit:** Report §6 First 30 s
### VOX-05 · Speech & Voice · wave 1
- **Beginner problem:** The lab's best hook, 'put a finger on your throat and say sss, then zzz', is buried in module 3 instead of opening the lab.
- **Change to make:** Module 1 opens: 'Put a finger on your throat and say sss, then zzz. Feel the buzz? That buzz is your voice. This lab follows it from your lungs to the microphone.'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/speech/speechPagesA.tsx:65 module 1 still opens 'Speech is air, a buzz, a set of resonating cavities...'; the throat line is only at :184 (module 3)
- **Source in the audit:** Report §6 First 30 s
### ET-02 · Ear Training Lab · wave 1
- **Beginner problem:** The hub lists 14 modules in one flat list with no groups or suggested order, and nothing says that Comb Filtering builds on Delay and Polarity.
- **Change to make:** The modules sit in four labelled groups (Tone, Level and dynamics, Time and space, Faults and pitch), with a 'start here' badge on module 1 and every module still open.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/eartraining/EarTrainingLabScreen.tsx:122-150 one 'MODULES' heading over a single flat map of EAR_MODULES
- **Source in the audit:** Report §6 top problem 2 + First 30 s, part 2
### ET-03 · Ear Training Lab · wave 1
- **Beginner problem:** Level names and playback notes use jargon such as '±12 dB, 4 coarse bands', 'Dry vs wet', 'Copy at 0 dB', 'Temporal, not spectral' and 'transducer'.
- **Change to make:** Those lines are reworded in plain words, for example 'Dry vs wet (no reverb vs reverb)' and 'any speaker or headphones'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/ear/modules/tone.ts:299 '±12 dB, 4 coarse bands'; src/features/ear/modules/time.ts:165 'Copy at 0 dB — deep combs', :344 'Dry vs wet', :75 'Temporal, not spectral'; src/features/ear/modules/dynamics.ts:36 'any transducer'
- **Source in the audit:** Report §6 top problem 3 (G7_EarTrainingLab second pass)
### ET-04 · Ear Training Lab · wave 1
- **Beginner problem:** The hub opens with a technical paragraph about analyzers and adaptive levels instead of a simple picture of what ear training is.
- **Change to make:** The hub opens: 'Ear training is like learning to name colors, but for sound. Start with Frequency Recognition. Play all three first, then answer.'
- **Already partly built; what is still missing:** The hub's opening paragraph is still the technical one.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: the 'play every clip first' line and the sound-off way out in the drill (src/screens/lab/eartraining/EarModuleScreen.tsx:735, earLabEnd.ts:41). Not built: src/screens/lab/eartraining/EarTrainingLabScreen.tsx:117 the hub still opens on the analyzers / 'level adapts on your last twenty answers' paragraph
- **Source in the audit:** Report §6 First 30 s, part 1
### BA-02 · Bass Guitar Physics · wave 1
- **Beginner problem:** The LEARN tab's intro sends a beginner to COMMON MISTAKES and the FORMULA first, and a first visit now opens on LEARN.
- **Change to make:** The LEARN intro says 'Read GUIDED STEPS 1 to 3 with EXPLORE open' first, and the formula comes later.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/bassScreenGuides.ts:116 start: 'Read COMMON MISTAKES first, then FORMULA / CONCEPT'
- **Source in the audit:** Report §6 top problem 2 (G7_BassLab LEARN)
## Wave 2

### TU-01 · Tuning & Temperament · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Even with BASIC on, the readouts, trays and cards from chapter 5 onward show algebra such as 't = √5/2', '⁴√5', '2^(1/3)' and '81/64', and the meantone chapter is where a beginner would quit.
- **Change to make:** In BASIC the readouts and trays use words (for example 'D, halfway to E'), and the derivation boxes and fraction chains fold under the MATH switch.
- **Already partly built; what is still missing:** The algebra is still the main text of the readouts, trays and derivation boxes in BASIC; only small plain captions were added under them.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: every readout got a plain caption (src/screens/lab/tuning/chapters/ch9Meantone.tsx:119 caption 'whole tone'), and some lines are MATH-only (ch4Harmonics.tsx:168-187). Still shown in BASIC: ch9Meantone.tsx:119 and :124 keys 't = √5/2' and 'g = ⁴√5'; ch9Meantone.tsx:240-249 the equation stage is not gated by mathView; ch4Harmonics.tsx:34-35 tray labels 'Equal-tempered 2^(1/3)' and 'Pythagorean 81/64'; ch6Comma.tsx:101-108 THE DERIVATION always shown; ch12Tradeoffs.tsx:15 formulas in the system cards
- **Source in the audit:** Report §6 top problem 1 (G7_TuningLab ch 5, 7, 10, 13)
### CY-02 · Cymatics · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** One lab uses three ways to move around (home cards, a module stepper, and tabbed studios), so a beginner keeps relearning the controls.
- **Change to make:** The lab would use one navigation frame throughout, or at least say on each studio how it relates to the modules.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cymatics/CymaticsHomeScreen.tsx:190-212 home cards; CymaticsModuleScreen.tsx module stepper; PlateStudioScreen.tsx, LiquidStudioScreen.tsx, MembraneStudioScreen.tsx each a LabShell studio with tabs
- **Source in the audit:** Report §6 top problem 2
## Wave 3

### TU-03 · Tuning & Temperament · wave 3
- **Beginner problem:** A learner who worked every chapter was told '14 chapters not done yet' because each chapter counts only on its own small task, and that task was never named.
- **Change to make:** The contents list shows a check mark as each chapter's task is done, WHAT'S LEFT names each missing task, and chapters that finish on a plain button now also finish on NEXT.
- **Already partly built; what is still missing:** Inside each chapter there is still no 'To finish this chapter: ...' line; the learner only finds the task on WHAT'S LEFT.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/tuning/chapters/index.ts:61-76 CHAPTER_FINISH names each chapter's task; src/screens/lab/tuning/TuningLabScreen.tsx:351-352 WHAT'S LEFT shows it plus a how-it-counts line; :286 contents rows carry done; :293-296 NEXT marks the ackDone chapters 0, 7 and 11. No 'To finish this chapter' line inside the chapters themselves (CHAPTER_FINISH is used only on the end screen)
- **Source in the audit:** Report §6 top problem 3, part 1 (G7_TuningLab WHAT'S LEFT page)
### TU-05 · Tuning & Temperament · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The meantone chapter is the hardest page in the lab, and nothing tells a beginner it is a deeper chapter they can come back to.
- **Change to make:** The chapter list marks meantone as 'deeper (optional)', and BASIC gives a three-sentence plain version of the idea.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/tuning/chapters/index.ts:51 the meantone chapter has no optional mark; index.ts:70 CHAPTER_FINISH[9] still requires its task for the lab to count
- **Source in the audit:** Report §6 First 30 s, part 2 (G7_TuningLab ch 10, Overwhelm 5)
### VOX-02 · Speech & Voice · wave 3
- **Beginner problem:** The Distance Effect shows values like '+6 dB', '-14 dB' and '+42 dB' with no plain idea of how big a change that is.
- **Change to make:** A short anchor sits by the bars, for example '+6 dB = clearly louder, +10 dB = about twice as loud'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/speech/speechPagesB.tsx:311 the readout lists raw dB values; :321-325 lead and footnote give no plain anchor
- **Source in the audit:** Report §6 top problem 2 (G7_SpeechLab module 8)
### BA-04 · Bass Guitar Physics · wave 3
- **Beginner problem:** The opening should say in plain words why a pressed string sounds higher and point at fret 12 as the first thing to try.
- **Change to make:** The intro starts with sliding FRET to 12 and watching LENGTH read 50%; the plain 'less of it can swing' sentence and a pulsing target dot at fret 12 are not there.
- **Already partly built; what is still missing:** The plain 'press a string and less of it can swing, so the note goes up' sentence and a fret-12 target dot are still missing.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/bassScreenGuides.ts:46 start now leads with 'slide FRET to 12 and watch FREQ double while LENGTH reads 50%'. Not built: :44 the learning line is unchanged, and there is no target dot at fret 12 in BassLabScreen.tsx
- **Source in the audit:** Report §6 First 30 s
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