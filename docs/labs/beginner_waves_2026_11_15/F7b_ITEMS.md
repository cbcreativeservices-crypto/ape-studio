# Group F7b: items to build (waves 1-3, owner go 2026-11-15)

Labs: Delay; Reverb; Flanger; Phaser; Distortion; Phase; Chorus

Items: 24 (wave 1: 12, wave 2: 10, wave 3: 2). Build wave 1 first, then 2, then 3.

## Wave 1

### DL-01 · Delay · wave 1
- **Beginner problem:** The Delay picture opens at 50% feedback, so the echoes of one click overlap the next click's echoes and OUT looks like a barcode.
- **Change to make:** The lab opens at feedback 0%, so each gray click comes back once in blue, with a line on the picture saying that is the echo.
- **Already partly built; what is still missing:** The lab still opens on the busy 50% picture; only the popup tells the learner to set 0% first.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/delayScreenGuides.ts:53 EXPLORE WHERE TO START now begins 'Set FDBK to 0% and watch OUT: each gray click comes back once'. Not built: src/screens/lab/fxLabConfigs.tsx:373 FEEDBACK initial is still 0.5, and nothing on the picture names the echo
- **Source in the audit:** Report §6 top problem 1 + First 30 s (G6_DelayLab EXPLORE suggestion 1)
### DL-02 · Delay · wave 1
- **Beginner problem:** The lab uses three tempos: the click runs at 90 BPM, the notes call 375 ms a quarter note at 160 BPM, and LEARN works at 120 BPM.
- **Change to make:** One tempo everywhere, for example a 120 BPM click with a 500 ms default, so the echoes land on the clicks the learner sees.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:356 source srcClick(90); :365 TIME initial 375; :442 caption prints 'a quarter-note at 160 BPM' (60000/375); src/screens/lab/delayScreenGuides.ts:88 LEARN uses 120 BPM. F7_REPORT 'Not checked' left it as a copy choice
- **Source in the audit:** Report §6 top problem 2 (G6_DelayLab suggestion 2, G6b_DelayLab LEARN suggestion 3)
### DL-03 · Delay · wave 1
- **Beginner problem:** LEARN's WHERE TO START sends the beginner first to the formula at the bottom, to work out a quarter note at 120 BPM.
- **Change to make:** WHERE TO START begins with the silent slapback step on EXPLORE (feedback 0%, time all the way down) and leaves the formula for last.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/delayScreenGuides.ts:88 learn.intro.start still 'Scroll to FORMULA / CONCEPT and work out a quarter note at 120 BPM'; src/screens/lab/LabShell.tsx:505 rack labs now open on LEARN on a first visit, so this is the first instruction a newcomer reads
- **Source in the audit:** Report §6 top problem 3, part 1 (G6b_DelayLab LEARN suggestion 1)
### RV-04 · Reverb · wave 1
- **Beginner problem:** The first instruction does not tie the decay control to rooms a beginner knows.
- **Change to make:** The first pointer reads like 'Drag DECAY: small room to big hall, and watch the sound last longer.'
- **Already partly built; what is still missing:** The first instruction still talks about a slope rather than a small room growing into a big hall.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/reverbScreenGuides.ts:63 EXPLORE start now opens on the silent RT60 drag; the choices are named BOOTH to CAVERN (fxLabConfigs.tsx:511-515). Not built: the start line speaks of 'the slope of the amber wash', not rooms; the cloud picture is RV-02
- **Source in the audit:** Report §6 First 30 s (G6_ReverbLab first-30-s rewrite)
### FL-03 · Flanger · wave 1
- **Beginner problem:** The same moving part is called RATE on the readout strip and SWEEP on the dock key.
- **Change to make:** One name everywhere, for example SWEEP on both, with RATE and DEPTH inside its tray.
- **Already partly built; what is still missing:** The readout still says RATE and the key still says SWEEP; only a first-visit caption links them.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/fxLabConfigs.tsx:852 the RATE cell has the first-visit caption 'sweep speed'. Not built: :852 bezel key still 'RATE' while :858 the dock group is still labeled 'SWEEP'
- **Source in the audit:** Report §6 top problem 3 (G6_FlangerLab suggestion 2)
### PS-02 · Phaser · wave 1
- **Beginner problem:** The lab notes define the lesson only by comparing it with the flanger, which helps nobody who opens Phaser first.
- **Change to make:** The notes first say what a phaser is on its own (a few uneven dips that sweep) and give the flanger comparison second.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:951-954 intro still ends 'Compare the sparse, UNEVEN notches below with the flanger's even comb — that difference is the whole lesson.'
- **Source in the audit:** Report §6 top problem 2 (G6_PhaserLab suggestion 2)
### PS-03 · Phaser · wave 1
- **Beginner problem:** The dips keep sweeping while the learner counts them, so a beginner likely counts three instead of four and doubts the rule.
- **Change to make:** Every counting step says to set the sweep to STATIC first, or the lab starts with the dips held still.
- **Already partly built; what is still missing:** The LEARN instruction, which is what a newcomer reads first, still asks for a count while the dips move.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/phaserScreenGuides.ts:49 EXPLORE start now 'Open SWEEP, set DEPTH (SWEEP) to STATIC'. Not built: :84 LEARN start (the first page on a first visit) still 'step STAGES to 8 and count the dips' with no STATIC; src/screens/lab/fxLabConfigs.tsx:1010 DEPTH initial still 0.5
- **Source in the audit:** Report §6 top problem 3 (G6b_PhaserLab LEARN suggestion 1)
### DS-03 · Distortion · wave 1
- **Beginner problem:** Keys and choices use math codes: SOFT (TANH), TUBE (ASYM) and a key just called OS.
- **Change to make:** The choices read HARD (flat tops), SOFT (rounded), TUBE (lopsided), and the key reads OVERSAMPLING or a plain short form.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1615-1616 choices 'SOFT (TANH)', 'TUBE (ASYM)'; :1621 key short 'OS'; only the TYPE, DRIVE and MIX readouts got first-visit captions (:1638-1640)
- **Source in the audit:** Report §6 top problem 3 (G6_DistortionLab suggestions 2 and 3, G6b_DistortionLab LEARN suggestion 4)
### DS-05 · Distortion · wave 1
- **Beginner problem:** A learner who picks 'oversampling only changes the display' is told to switch it at high DRIVE and compare OUT, but the picture never changes with oversampling, so the hint cannot be followed.
- **Change to make:** The reply says the picture does not change but the sound does, which is why the oversampling step needs ears.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/lab/understandingChecks.ts:732 why: 'Switch it at a high DRIVE and compare OUT'; src/screens/lab/fxLabConfigs.tsx:1574-1575 'the only place the OS key shows, since neither drawing takes it'; content.ts step 4 says 'The display doesn't change'
- **Source in the audit:** G6b_DistortionLab CHECK suggestion 1 (Q3 oversampling trap)
### PH-03 · Phase · wave 1
- **Beginner problem:** LEARN's WHERE TO START sends the beginner to the Greek-letter formula as the second thing to read.
- **Change to make:** WHERE TO START says to do the flip-and-mono step on EXPLORE and watch the output go flat; the formula comes last.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/phaseScreenGuides.ts:99 learn start still 'Then find φ(f) = −2πfτ under FORMULA / CONCEPT'; src/screens/lab/LabShell.tsx:505 LEARN is the first page on a first visit
- **Source in the audit:** Report §6 top problem 3 (G6b_PhaseLab LEARN suggestion 1)
### PH-05 · Phase · wave 1
- **Beginner problem:** When the flip plus mono makes OUT go flat, nothing on the picture names what just happened, and the first step still talks about hearing it.
- **Change to make:** At that moment the picture says 'Silence: the two sides erased each other', and the first step reads 'Flip R, then listen in MONO'.
- **Already partly built; what is still missing:** The word 'silence' sits in the caption below, not on the flat line itself, and the first step still opens on ▶.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/fxLabConfigs.tsx:1729 caption '…= silence. That is total cancellation'; :1806 'fold to mono and it CANCELS'; :1721 sound-off line. Not built: no label on the glass itself (fxAnim.tsx stereo flow has no cancel text), and src/screens/lab/phaseScreenGuides.ts:63 start opens 'Tap ▶… hear the tone vanish'
- **Source in the audit:** Report §6 First 30 s, part 2 (G6_PhaseLab suggestion 2)
### PH-06 · Phase · wave 1
- **Beginner problem:** Guided steps need DLY R at exactly 1.1 ms and 2.3 ms, which is very hard to hit with the fader on a phone.
- **Change to make:** The DLY R lane gets small minus and plus 0.1 ms buttons so the step values can be set exactly.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1759 DLY R fader 0 to 10 ms with snap 0.1 and no nudges (F7 added nudges only to Binaural AZ; the fader type already supports them)
- **Source in the audit:** G6b_PhaseLab LEARN suggestion 4 (exact DLY R values)
## Wave 2

### RV-01 · Reverb · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first readout and the subtitle use the code RT60 for 'how long the echo lasts'.
- **Change to make:** The readout and subtitle lead with the words DECAY TIME, with RT60 kept beside them.
- **Already partly built; what is still missing:** The bezel and subtitle still lead with RT60; the plain words show only on a first visit and on the key.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/fxLabConfigs.tsx:548 bezel RT60 has the first-visit caption 'decay time'; :509 the fader key's label is 'RT60 (DECAY TIME)'. Not built: :494 subtitle still 'RT60 · Pre-delay · Damping' and the bezel cell is still 'RT60' after the first visit
- **Source in the audit:** Report §6 top problem 1 (G6_ReverbLab suggestion 1)
### RV-03 · Reverb · wave 2
- **Beginner problem:** Moving pre-delay from 0 to 60 ms shifts the wash by only a few pixels on a phone, so the guided step looks like nothing happened.
- **Change to make:** A small labeled bracket marks the pre-delay gap between the click and the wash, or the first fraction of a second is shown zoomed in.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/lab/fxViz.tsx:878-879 DecayCurveGraph draws the flat pre-delay segment with no label or bracket; src/screens/lab/fxAnim.tsx:1286 the glass only glides the start point; src/features/lab/guidedLessons/content.ts:158 step still promises the jump 'nearly one 100 ms tick'
- **Source in the audit:** Report §6 top problem 3 (G6b_ReverbLab LEARN suggestion 2)
### CH-01 · Chorus · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The card promises one singer turning into a small choir, but the picture shows one wave that slowly swells and thins.
- **Change to make:** On a first visit the picture shows two or three faint copies drifting against the gray original, then their bold sum.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:651 caption still 'gray = your voice, blue = the delayed copy' (one copy); :717-726 the anim model carries one delay, no extra voices
- **Source in the audit:** Report §6 top problem 1 + First 30 s, part 1 (G6_ChorusLab suggestion 1)
### CH-02 · Chorus · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab opens on a sine, which hides what the DELAY key does, and at 0.25 Hz one swell takes about 4 seconds, so a quick look shows a still wave.
- **Change to make:** The first view moves within 2 seconds and the DELAY key shows its effect on the default source, or says to switch to pink noise.
- **Already partly built; what is still missing:** The default is still the slow sine, so the motion is slow and DELAY looks dead until the learner switches source.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/chorusScreenGuides.ts:46 EXPLORE start now says 'Watch the bold line on OUT for a few seconds'. Not built: src/screens/lab/fxLabConfigs.tsx:654 sine is still the first source, :653 caption still admits 'on a sine, each setting should sound the same', :677 RATE initial still 0.25
- **Source in the audit:** Report §6 top problem 2 (G6_ChorusLab suggestions 2 and 5, G6b_ChorusLab LEARN suggestion 1)
### CH-03 · Chorus · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The check and the lab notes compare chorus with a flanger, which comes in the next lab, so a learner going in order has not met it.
- **Change to make:** The flanger question moves to the Flanger lab or says '(the next lab)' with one line on how a flanger sounds, and the notes drop the comparison.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/lab/understandingChecks.ts:510-526 CHORUS question 'vs-flanger' still asks 'Compared with a flanger, a chorus uses…'; :497 a Q2 option is 'A flanger'; src/screens/lab/fxLabConfigs.tsx:646 the EXPLORE intro still names 'a flanger's sweeping jet'
- **Source in the audit:** Report §6 top problem 3 (G6b_ChorusLab CHECK suggestion 1, G6_ChorusLab suggestion 4)
### FL-02 · Flanger · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** LEARN starts on the formula and lists three controls the rack does not have, which makes it the heaviest LEARN of the modulation labs.
- **Change to make:** WHERE TO START points at the first paragraph and the CENTER drag, and the three missing controls fold into one 'other controls you will meet' line.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/flangerScreenGuides.ts:86 learn start still 'Scroll to FORMULA / CONCEPT and read it'; src/features/lab/guidedLessons/content.ts:225-227 entries 'LFO Waveform: No key on this rack', 'Stereo width: Fixed at 90°', 'Through-Zero (TZF): No key on this rack'
- **Source in the audit:** Report §6 top problem 2 (G6b_FlangerLab LEARN suggestions 1, 2 and 5)
### PS-01 · Phaser · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The Phaser card is eight sentences long and fills the phone screen before the learner has touched anything.
- **Change to make:** The card is two sentences, such as 'A phaser makes a few dips in the sound and sweeps them up and down, a swirling whoosh. More STAGES means more dips.'
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:312 PhaserLab plainEnglish still the eight-sentence text (all-pass filters, phase, notches, LFO, stages, rate and depth, flanger)
- **Source in the audit:** Report §6 top problem 1 + First 30 s, part 1 (G6_PhaserLab suggestion 1)
### DS-04 · Distortion · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The Distortion card ends on 'harmonic and intermodulation content', the hardest words in it.
- **Change to make:** The card says 'Push a sound harder than the equipment can carry and its shape gets squashed; that adds new tones', and stops there.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:320 DistortionLab plainEnglish still ends 'These are called harmonic and intermodulation content.'
- **Source in the audit:** Report §6 First 30 s, part 1 (G6_DistortionLab suggestion 4)
### PH-01 · Phase · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The keys and the stage label are codes: POL, DLY R, FOLD and 'R: Ø · DLY'.
- **Change to make:** The keys read in words, such as FLIP R, DELAY R and LISTEN: STEREO / MONO, with Ø explained once as 'flipped upside down'.
- **Already partly built; what is still missing:** The dock keys and the stage label are still codes; plain words show only on the readouts during a first visit.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/fxLabConfigs.tsx:1779-1781 first-visit bezel captions 'upside down?', 'R arrives late', 'listen as'. Not built: :1749, :1762, :1770 dock keys still 'DLY R', 'POL', 'FOLD'; src/screens/lab/fxAnim.tsx:181 stage pill still 'R: Ø · DLY'
- **Source in the audit:** Report §6 top problem 1 (G6_PhaseLab suggestion 1)
### PH-04 · Phase · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The Phase card opens on 'where a wave is in its up-and-down cycle' and ends on comb filtering and speaker alignment.
- **Change to make:** The card opens 'Two copies of a sound can help each other or erase each other.'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:328 PhaseLab plainEnglish unchanged, ending 'Phase drives comb filtering, mono compatibility, and speaker alignment.'
- **Source in the audit:** Report §6 First 30 s, part 1 (card line)
## Wave 3

### FL-04 · Flanger · wave 3
- **Beginner problem:** The dips on the spectrum carry no label, so 'notch' has no picture, and the first pointer used to need sound.
- **Change to make:** The dips are labeled 'cancelled here' on a first view, and the first step is the silent CENTER drag.
- **Already partly built; what is still missing:** No dip on the picture is labeled as a cancelled frequency.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/flangerScreenGuides.ts:51 EXPLORE start now 'Drag CENTER from 2.0 ms down to 0.50 ms and see the notches spread apart'; fxLabConfigs.tsx:851 CENTER caption 'notch spacing'. Not built: fxLabConfigs.tsx:617-631 combSweepHero draws the curves with no label on any dip
- **Source in the audit:** Report §6 First 30 s (G6_FlangerLab suggestion 3)
### PH-02 · Phase · wave 3
- **Beginner problem:** The delay half drops the learner into the Lissajous scope with no plain line saying what the drawing shows.
- **Change to make:** One caption explains the scope ('a drawing of L against R: upright means the same, flat means opposite'), next to the correlation meter's words.
- **Already partly built; what is still missing:** The scope itself still has no plain sentence saying what its line means.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/features/lab/fxViz.tsx:1076 the correlation meter prints words ('mono / in phase', 'ANTI-PHASE — cancels in mono'); src/screens/lab/fxLabConfigs.tsx:1809 'Identical channels: a vertical line, correlation +1.' Not built: no line anywhere says what the scope plots; fxViz.tsx:1052-1055 it carries only the letters M, S, L, R
- **Source in the audit:** Report §6 top problem 2 (G6_PhaseLab suggestion 4, G6b_PhaseLab LEARN suggestion 3)
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