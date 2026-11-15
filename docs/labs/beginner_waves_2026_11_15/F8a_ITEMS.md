# Group F8a: items to build (waves 1-3, owner go 2026-11-15)

Labs: Oscillators; Noise; FM Synthesis; Modular Synth; Sound Envelope & Transients; Autotune; Harmonics

Items: 23 (wave 1: 10, wave 2: 4, wave 3: 9). Build wave 1 first, then 2, then 3.

## Wave 1

### OSC-04 · Oscillators · wave 1
- **Beginner problem:** Below the display, LAB NOTES talks like an engineer (band-limited, Nyquist, sidebands, Bessel) before the two friendly check questions.
- **Change to make:** The two check questions come first, and THE SOUND and FM / AM notes fold under GO DEEPER, with nothing removed.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/OscillatorLabScreen.tsx:378-405 THE SOUND and 'FM · AM' blocks still sit above the CheckQuestion cards at :408-437, no fold
- **Source in the audit:** Report §6 top problem 3, part 2 (G7_OscillatorLab page 1 suggestion 3)
### OSC-05 · Oscillators · wave 1
- **Beginner problem:** The intro card's first line uses harmonics, fundamental and timbre, and never says the plain idea: every sound shape is simple tones stacked like a recipe, and bar 1 is the note.
- **Change to make:** The intro card opens with: every sound shape is built from simple tones stacked up, like a recipe; bar 1 is the note.
- **Already partly built; what is still missing:** The recipe idea is there but in jargon, and nothing says bar 1 is the note.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/oscillatorScreenGuides.ts:41 learning line is 'a recipe of harmonics: which multiples of the fundamental are present ... sets the timbre'
- **Source in the audit:** Report §6 First 30 s, part 1
### NOI-04 · Noise · wave 1
- **Beginner problem:** Nothing on arrival says noise here is a hiss with no note that engineers use on purpose to test speakers and rooms.
- **Change to make:** The intro card adds: noise here is a hiss with no note; engineers use it on purpose to test speakers and rooms.
- **Already partly built; what is still missing:** The 'no pitch' half is there; the 'used on purpose to test speakers and rooms' half is not, and 'dB per octave' is still in the first line.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/noiseScreenGuides.ts:41 learning line says 'noise has no pitch: its color is a slope in dB per octave', but nothing about using it on purpose to test speakers and rooms
- **Source in the audit:** Report §6 First 30 s, part 1
### FM-01 · FM Synthesis · wave 1
- **Beginner problem:** The display's legend, caption and note speak math: Bessel, aliased past Nyquist, reflected below 0 Hz.
- **Change to make:** The legend reads 'green = the note, amber = new tones FM adds', the caption drops 'Bessel', and the rare dashed and red cases move to the ⓘ.
- **Already partly built; what is still missing:** The legend, the caption, the note under the display and the subtitle still use the math words.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/FmLabScreen.tsx:289-298 plain readout captions ('the note', 'the shaker', 'how hard', 'how wide'). Not built: :612 legend still lists 'reflected below 0 Hz · red dashed = ALIASED past Nyquist'; :258-259 caption 'watch the Bessel sidebands'; :284-285 note 'from the Bessel math'; :242 subtitle is five jargon words
- **Source in the audit:** Report §6 top problem 1 (G7_FmLab page 1 suggestions 3, 5, 6)
### FM-02 · FM Synthesis · wave 1
- **Beginner problem:** FM is both the lab's name and a readout that means the modulator's pitch.
- **Change to make:** The readout is renamed MOD, so FM only ever means the technique.
- **Already partly built; what is still missing:** The readout is still called FM.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/FmLabScreen.tsx:290 readout still { k: 'FM' } but now carries the first-visit caption 'the shaker'
- **Source in the audit:** Report §6 top problem 2 (G7_FmLab page 1 suggestion 1)
### FM-04 · FM Synthesis · wave 1
- **Beginner problem:** The intro card says sidebands and starts with play, instead of 'FM shakes one tone with another; drag INDEX'.
- **Change to make:** The intro card opens with 'FM shakes one tone with another, which makes new tones', and the first step is dragging INDEX, with play second.
- **Already partly built; what is still missing:** The intro still starts with play and uses 'sidebands' unexplained.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fmScreenGuides.ts:52 start line already says to ride INDEX but begins 'Tap ▶'; :51 learning line uses 'sidebands' with no plain gloss
- **Source in the audit:** Report §6 First 30 s
### MOD-03 · Modular Synth · wave 1
- **Beginner problem:** THE VOICE, AS SOUND bar graph, the clearest sound-off picture of what CUTOFF does, is buried deep in LAB NOTES.
- **Change to make:** The bar graph moves up next to the case, for example as a second view of the display, so a silent learner sees the filter work.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/ModularLabScreen.tsx:647 'THE VOICE, AS SOUND' still sits in the scrolling well after the long notes
- **Source in the audit:** Report §6 top problem 3 (G7_ModularLab page 1 suggestion 3)
### MOD-04 · Modular Synth · wave 1
- **Beginner problem:** The intro card names VCO, VCF and VCA but never says in plain words that sound flows along the amber cable from tone to filter to volume to out.
- **Change to make:** The intro card reads: sound flows along the amber cable, TONE, FILTER, VOLUME, OUT; the colored cables turn knobs for you; tap PATCH then WOBBLE.
- **Already partly built; what is still missing:** The WOBBLE first step is done; the plain 'sound flows along the amber cable' line is not.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/modular/modularScreenGuides.ts:47 start line already begins 'Tap PATCH → WOBBLE and watch a blue LFO cable'; :45 learning line still leads with VCO / VCF / VCA and has no amber-cable path
- **Source in the audit:** Report §6 First 30 s
### ENV-04 · Sound Envelope & Transients · wave 1
- **Beginner problem:** The 'Try it' line says to drag ATTACK and watch the gold dots, but never says what that means: a snap at the start, or a slow fade-in.
- **Change to make:** The line reads: drag ATTACK left and the sound starts with a snap; drag it right and it fades in slowly; that rise is the attack.
- **Already partly built; what is still missing:** The Try-it line still does not say what the learner should notice.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/envelope/EnvelopeLabScreen.tsx:124 Try-it line 'drag ATTACK all the way left, then all the way right. Watch the two gold dots'; later step intros are already inline (SHARED_API.md:286-290, automatic for Envelope)
- **Source in the audit:** Report §6 First 30 s, part 1
### AUT-04 · Autotune · wave 1
- **Beginner problem:** The intro card starts with PLAY, which does nothing with sound off, and never says how to read the marks.
- **Change to make:** The intro card says each amber mark is one sung note and the gridline it lands on is the right note, then 'slide AMOUNT to OFF, then back to 100%', with play second.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/autotuneScreenGuides.ts:38 start line begins 'Tap PLAY and listen'. Note: the audit's wording 'the grey line beside it is where it should be' is wrong; in the code gray is the note as sung and the target is the gridline (AutotuneLabScreen.tsx:379, :639)
- **Source in the audit:** Report §6 First 30 s
## Wave 2

### HAR-01 · Harmonics · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The screen shows four readouts, a fader and five keys at once, and the draggable stems, the real hands-on part, sit far down in LAB NOTES.
- **Change to make:** The stems sit straight under the display, and THD, CREST and SLOPE hide behind a 'Show measurements' key until the learner asks.
- **Already partly built; what is still missing:** The stems are still below the fold and the measurements are still always on screen.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/rack/RackUnit.tsx:883 the display now folds to a slim strip when the notes are scrolled (shared S3, automatic); HarmonicsView.tsx:1664-1679 first-visit captions. Not built: HarmonicsView.tsx:1876 the stems still come after the color legend and notes in the well; all four readouts always show; :1777 the F0 fader is always open
- **Source in the audit:** Report §6 top problem 1 (G7_HarmonicLab page 1 suggestions 1 and 7)
### HAR-04 · Harmonics · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab opens on the full SAW recipe, and the first step talks about THD falling, a number the beginner cannot read yet.
- **Change to make:** The lab opens on SINE (one band, one stem) with the hint 'Drag H3 up', so the learner builds a sound by hand from the start.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/HarmonicsView.tsx:1057 the starting preset is 'saw'; src/screens/lab/harmonicScreenGuides.ts:48 start line is 'Pick PRESET → SQUARE ... THD falls from 75.2 % to 43.8 %'
- **Source in the audit:** Report §6 First 30 s
### MOD-01 · Modular Synth · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The case and the subtitle are a wall of acronyms (VCO, VCF, VCA, OFS, V/OCT) with no plain names and no first-visit tour.
- **Change to make:** Plain names show under the main boxes (tone, filter, volume, wobbler), or a short first-visit tour lights the four audio boxes one at a time.
- **Already partly built; what is still missing:** The case itself still has no plain names and no tour, and the subtitle is still acronyms.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/ModularLabScreen.tsx:391-401 plain first-visit readout captions ('tone shape', 'filter peak', 'wobbler'). Not built: :344 subtitle still 'VCO · VCF · VCA · LFO · Envelope · Sequencer'; :894, :932-933 the case legends are acronyms only. The legends are already 9 pt (:1054), so 'tiny' is a reading-load problem, not a size breach
- **Source in the audit:** Report §6 top problem 1 (G7_ModularLab page 1 suggestions 1, 2, 6)
### AUT-01 · Autotune · wave 2
- **Beginner problem:** The display never says how to read it: time runs down inside each note, pitch runs across, and the six notes have no order.
- **Change to make:** A one-line key on the display says each amber mark is one sung note, its top is the start and its bottom the end, and the line it lands on is the right note; the notes are numbered 1 to 6.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/AutotuneLabScreen.tsx:596-661 the grid draws note names and cents tags only, no key and no note numbers; the reading rule is only in LAB NOTES 'READING THE GRID' at :377-382
- **Source in the audit:** Report §6 top problem 1 (G7_AutotuneLab page 1 suggestion 1)
## Wave 3

### OSC-03 · Oscillators · wave 3
- **Beginner problem:** The twelve bars carry only the numbers 1 to 12, so nobody says that each bar is one pure tone and bar 1 is the note you hear.
- **Change to make:** A short line under the bars reads: each bar is one pure tone; bar 1 is the note, bars 2 to 12 add its color.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/OscillatorLabScreen.tsx:621-633 the bars print only the numbers; :363-365 the LAB NOTES line says 'H1–H12 relative amplitudes'; the plain meaning is only inside the ⓘ guide (oscillatorScreenGuides.ts:47)
- **Source in the audit:** Report §6 top problem 3, part 1 (G7_OscillatorLab page 1 suggestion 2)
### NOI-02 · Noise · wave 3
- **Beginner problem:** The chart has no words on its axes, only 20, 100, 1k, 20k and Hz, so a beginner cannot tell what up, down, left or right mean.
- **Change to make:** The chart reads 'louder' up and 'quieter' down, and 'rumble' at the left and 'hiss' at the right under the frequency numbers.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/NoiseLabScreen.tsx:621-637 the only axis text is the Hz unit and the four frequency ticks; no vertical label at all
- **Source in the audit:** Report §6 top problem 2 + First 30 s part 2 ('rumble ← → hiss' under the axis)
### NOI-03 · Noise · wave 3
- **Beginner problem:** The core lesson, hearing the hiss rise and why a flat white line sounds bright, needs sound, and the picture seems to argue with the words.
- **Change to make:** With sound off the lab says each color still shows its tilt, and a line next to WHITE would say why flat still sounds bright, using the 50 Hz versus 5,000 Hz example from LEARN.
- **Already partly built; what is still missing:** Nothing on EXPLORE yet explains, without sound, why a flat white line sounds bright.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/NoiseLabScreen.tsx:266 soundOffLine 'Sound off? Each color still shows its tilt'; noiseScreenGuides.ts:43 silent first step. Not built: the WHITE line at NoiseLabScreen.tsx:82 still says 'twice the bandwidth' with no plain example; the clear example stays on LEARN only
- **Source in the audit:** Report §6 top problem 3 (G7_NoiseLab page 1 suggestion 3, LEARN suggestion 1)
### HAR-02 · Harmonics · wave 3
- **Beginner problem:** THD is the headline number, but the THD CALC sheet opens straight on a formula and LEARN has no plain THD entry.
- **Change to make:** THD CALC opens with one sentence: THD is how much of the sound is harmonics rather than the main note, and 0 % is a pure tone; the formula follows.
- **Already partly built; what is still missing:** The THD CALC sheet and LEARN still give no plain sentence for THD.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/HarmonicsView.tsx:1667 THD readout caption 'overtone share' (first visit). Not built: :2097-2099 the sheet's first lines are the title and 'THD % = √(a₂² + … )'; src/features/lab/guidedLessons/content.ts:618-619 has no THD control entry
- **Source in the audit:** Report §6 top problem 2 (G7_HarmonicLab page 1 suggestion 2, LEARN suggestion 1)
### FM-03 · FM Synthesis · wave 3
- **Beginner problem:** Nothing on the graph marks the in-tune positions, so with sound off the pitched-versus-bell difference between RATIO 2 and 1.41 is hard to see.
- **Change to make:** Faint vertical lines at whole multiples of the note show the sticks landing on them for a clear note, or between them for a bell.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/FmLabScreen.tsx:543-560 the graph draws only the two level guides and frequency ticks, no harmonic grid
- **Source in the audit:** Report §6 top problem 3 (G7_FmLab page 1 suggestion 2)
### MOD-02 · Modular Synth · wave 3
- **Beginner problem:** Each module opens a 'what this does' sheet when tapped, but the only place that says so is one sentence deep in LAB NOTES.
- **Change to make:** A line under the case reads 'Tap any box to learn what it does'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/ModularLabScreen.tsx:627 'Tap any module for what it does.' is still only in the LAB NOTES paragraph; the ⓘ guide mentions it at modular/modularScreenGuides.ts:59
- **Source in the audit:** Report §6 top problem 2
### ENV-01 · Sound Envelope & Transients · wave 3
- **Beginner problem:** On Peak vs Average the dB numbers come first, and dB is never explained, so the beginner loses the idea in numbers.
- **Change to make:** A plain caption comes before the numbers: a big gap means a spiky sound like a drum, a small gap a steady sound like a trumpet; dB is glossed once as a step of loudness.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/envelope/EnvelopeLabScreen.tsx:381-385 the chart caption is 'levels relative to the chart’s full scale' and the dB readout (:384) comes before the plain sentence (:385); no dB gloss anywhere on the page
- **Source in the audit:** Report §6 top problem 1 (G7_EnvelopeLab module 5 suggestions 1 and 2)
### AUT-02 · Autotune · wave 3
- **Beginner problem:** The ¢ sign is on every note, but what a cent is (100 cents = one piano key) is only in popups and LEARN.
- **Change to make:** The display explains ¢ the first time: '¢ = cents; 100 cents = one piano key'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/AutotuneLabScreen.tsx:658 tags print '+38¢' with no gloss; :313 ENDS got the caption 'still off by' but nothing explains cents; the shared units chip covers only Hz and dB (src/screens/lab/rack/bezelRules.ts:34-40)
- **Source in the audit:** Report §6 top problem 2 (G7_AutotuneLab page 1 suggestions 2 and 3)
### AUT-03 · Autotune · wave 3
- **Beginner problem:** The heart of the lab, a robotic snap versus a natural glide, is a sound, and with sound off the difference is hard to see.
- **Change to make:** When SPEED changes, the corrected curve replays from top to bottom so FAST is seen as a snap and SLOW as a glide.
- **Already partly built; what is still missing:** There is no replay when SPEED changes and nothing tells the learner to watch the bend.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/AutotuneLabScreen.tsx:574-587 a dot already rides the corrected curves on a silent loop when decorative motion is on (from 2026-10-16), and the curves re-bend when SPEED changes; nothing replays on a SPEED change or points the eye at the bend
- **Source in the audit:** Report §6 top problem 3 (G7_AutotuneLab page 1 suggestion 5)
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