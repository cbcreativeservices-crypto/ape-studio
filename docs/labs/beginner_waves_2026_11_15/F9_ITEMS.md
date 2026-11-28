# Group F9: items to build (waves 1-3, owner go 2026-11-15)

Labs: All labs (shared); Microphone Selection Lab; Miking Labs (7 families, 128 lessons); Labs menu (fork, Fundamentals, Advanced)

Items: 16 (wave 1: 6, wave 2: 5, wave 3: 5). Build wave 1 first, then 2, then 3.

## Wave 1

### SH-38 · All labs (shared) · wave 1
- **Beginner problem:** All-caps lines like 'TEACHING MODEL · NOT A MEASUREMENT' read as a warning.
- **Change to make:** Each is now one small plain sentence, such as 'This picture is a model of the EQ, not a meter.'
- **Already partly built; what is still missing:** Three Miking chart notes still say 'NOT A MEASUREMENT' in capitals.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/rack/rackTypes.ts:120 modelNote wins over badge; set in all effect labs (fxLabConfigs.tsx:254, :429 ...) and 56 files. Still in caps: src/screens/lab/miking/lessons/shared/measure/ProductTools.tsx:148, RoomTools.tsx:156, SurveyTools.tsx:171 chart notes
- **Source in the audit:** Report §2 pattern 10, suggested change 2 (merged with §3 row 12, owner decision 3)
### SH-49 · All labs (shared) · wave 1
- **Beginner problem:** Some tap targets are tiny or sit on top of each other, so a needed spot cannot be hit.
- **Change to make:** Small or stacked targets would be made larger or spaced apart in each lab.
- **Already partly built; what is still missing:** Cable Dressing's small circles and Mic Selection's small photo names were not confirmed fixed.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Round 1 report §2: Sound Systems capstone 2 can be completed, DJ screen 24 has 44 pt switches, Stage Plot objects no longer stack, Wave marks got name tags (src/screens/lab/wave/sceneNameTags.ts). Cable Dressing stage 13 circles and Mic Selection 9 px names were not checked here (per-lab checkers).
- **Source in the audit:** Report §2 pattern 14 (no suggested-change list; one item for the pattern)
### MS-02 · Microphone Selection Lab · wave 1
- **Beginner problem:** Tapping a mic photo or CHECK MY REASONING changes a card below the fold with no scroll, and COMPARE used to drop the mic on show.
- **Change to make:** COMPARE keeps the current mic as the first pick, and the page scrolls so the new card or verdict comes into view.
- **Already partly built; what is still missing:** Nothing scrolls the mic card or the challenge verdict into view yet.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/micselect/MicSelectLabScreen.tsx:198-207 COMPARE keeps the current mic. Not built: :208-212 a photo tap only sets the pick, and the only scroll in the file is :1085 (to the top on a lesson change), so the card and the challenge verdict still appear off screen
- **Source in the audit:** Report §6 top problem 2
### MS-03 · Microphone Selection Lab · wave 1
- **Beginner problem:** Lesson 8's chips read only A, B and C, and lesson 9 ended on a capitalized question with nothing after it.
- **Change to make:** The chips read 'A · Studio', 'B · Loud stage', 'C · Outdoors', and lesson 9's question now has a tap-to-show answer that points back to each lesson.
- **Already partly built; what is still missing:** The lesson 8 chips still show only a letter.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/micselect/MicSelectLabScreen.tsx:700 JobFit (SHOW WHAT FITS) after the lesson 9 question. Not built: :618 the chip label is title.split('·')[0], so it prints just 'A', 'B', 'C' (titles at src/screens/lab/micselect/micSelectData.ts:648, 654, 660)
- **Source in the audit:** Report §6 top problem 3
### MK-02 · Miking Labs (7 families, 128 lessons) · wave 1
- **Beginner problem:** One lesson used several names for its parts (stage, module, page, step), a dock key called STEP opens a list instead of stepping, and jumping to Module 1 from the contents sent the learner toward FINISH.
- **Change to make:** 'Module' is now used everywhere and the contents jump lands on a normal step 1; still to do is renaming the STEP key and making the journey map list the eight modules.
- **Already partly built; what is still missing:** The dock key is still called STEP and the journey map still counts 6 stages against 8 modules.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/miking/MikingLessonScreen.tsx:243-255 step titles kept with their page (contents bug), :490 noun='module'; src/screens/lab/miking/MikingHubScreen.tsx:91 'modules done'. Not built: src/screens/lab/miking/engine/journeyKit.tsx:52 map still reads 'THE JOURNEY · 6 STAGES' beside 8 modules; src/screens/lab/miking/pages/PSound.tsx:170 dock key still 'STEP' (a tray via tapsWhenFew), and 29 lesson files still use label 'STEP'
- **Source in the audit:** Report §6 top problem 2 (G8_MikingLesson A5 suggestions 1, 9, 13)
### MK-11 · Miking Labs (7 families, 128 lessons) · wave 1
- **Beginner problem:** On the Placement Studio, the main hands-on step, the mic is hard to find on the drawing and the blue suggested zones are barely visible at phone size.
- **Change to make:** The mic is drawn in a high-contrast color with a halo, and the blue starting zones are drawn large and clear enough to see on a phone.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/miking/engine/scene/PlacementScene.tsx:69 and :1921 idle zones still drawn 'faint'; git log shows the fix rounds changed only sceneWords.ts, placementDock.ts, readoutText.ts and useRig.ts in engine/scene, not PlacementScene.tsx. Not checked on screen (code reading only)
- **Source in the audit:** G8_MikingLesson A2 module 4 Place the mic (Overwhelm 4, likely quit point) and A5 suggestion 3
## Wave 2

### LM-04 · Labs menu (fork, Fundamentals, Advanced) · wave 2
- **Beginner problem:** The Fundamentals menu's opening text lists topics but never says which tile to open first or what to take next.
- **Change to make:** Under the title a line reads: New to audio? Start with the first tile, Understanding Level & Amplitude, then Foundations of Sound.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/EarLabScreen.tsx:58-70 FUNDAMENTALS_INTRO and FUNDAMENTALS_INTRO_MEMBER still only list 'level and amplitude, the foundations of sound, and wave physics'
- **Source in the audit:** Report §6 First 30 s part 1
### MS-01 · Microphone Selection Lab · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Lesson 2 drops sixteen spec words on the beginner at once in one flat list, with no hint which ones matter now.
- **Change to make:** The sixteen chips sit in four small labeled groups, and one line says the next lessons cover the first few in depth so the rest can be skimmed.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micselect/MicSelectLabScreen.tsx:303-311 CHAR_INTRO then all CHARACTERISTICS chips in one wrap; src/screens/lab/micselect/micSelectData.ts:238-240 intro says 'tap each one'
- **Source in the audit:** Report §6 top problem 1 (G8_MicSelectLab lesson 2, Overwhelm 4)
### MS-04 · Microphone Selection Lab · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Lesson 1 opens on a dense warning paragraph about transducer principles and form factors before the beginner sees a single mic card.
- **Change to make:** Lesson 1 opens on the photo grid split into 'HOW IT WORKS INSIDE' and 'SHAPE OR JOB', with the line 'Tap a mic to see what it's good at, and what it's not', and the warning shortened or moved below.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/micselect/MicSelectLabScreen.tsx:246 LessonBanner CLASS_NOTE still comes first, :248 'TAP A MICROPHONE', :254 one ungrouped grid; src/screens/lab/micselect/micSelectData.ts:44-47 the 'These are NOT equivalent categories' paragraph
- **Source in the audit:** Report §6 First 30 s (G8_MicSelectLab lesson 1)
### MK-03 · Miking Labs (7 families, 128 lessons) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** 126 of 128 silent lessons tell the learner to 'listen' or 'LISTEN FOR', and the two-mic module piles on 8 to 12 number terms like delta-t and first notch.
- **Change to make:** A 'Can't listen now? Nothing here makes a sound' line now points at the card and readouts, and readouts carry plain captions such as 'a dip in tone'; the 'LISTEN FOR' label and the formula sentences are still there.
- **Already partly built; what is still missing:** The shared 'LISTEN FOR' label still asks a silent learner to listen, and the two-mic step still reads as formulas.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/miking/engine/steps.tsx:96 adds LISTEN_LINES from engine/listenLine.ts; src/screens/lab/miking/engine/rack/bezelCaptions.ts:16-18 'a dip in tone', 'extra distance', 'arrives later'. Not built: src/screens/lab/miking/engine/kit.tsx:45 still prints 'LISTEN FOR ·'; src/screens/lab/miking/pages/PTwoMic.tsx:180 still says 'notches at odd multiples of 1 ÷ (2 Δt)'
- **Source in the audit:** Report §6 top problem 3
### MK-06 · Miking Labs (7 families, 128 lessons) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The hub's 'starting points, not rules' note sits under 16 to 24 tiles where a beginner never scrolls, and it also tells them to listen.
- **Change to make:** One short 'starting points, not rules; silent drawings, no sound' line sits right under the hub heading.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/miking/MikingHubScreen.tsx:109 the note is the last thing in the scroll and says 'Move the mic, listen, and trust your ears'
- **Source in the audit:** Report §6 First 30 s, 'starting-point wording moves to the top' (G8_MikingHub suggestion 3)
## Wave 3

### SH-44 · All labs (shared) · wave 3
- **Beginner problem:** The Labs menu shows subject names with no line saying what each subject is about.
- **Change to make:** Each subject heading in the Labs menu would show its one-sentence description.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Descriptions exist in src/screens/lab/labCatalog.ts:211, :232, :249 but are drawn only on the old category screen (src/screens/lab/LabCategoryScreen.tsx:98); src/screens/lab/EarLabScreen.tsx never reads .description
- **Source in the audit:** Report §2 pattern 13, suggested change 2 (merged with §3 row 16 'subject descriptions shown')
### LM-03 · Labs menu (fork, Fundamentals, Advanced) · wave 3
- **Beginner problem:** Each subject's one-line plain description and the done check mark only lived on an old screen nobody reaches, so 'Signal' or 'Modulation' is never explained before its tiles.
- **Change to make:** Each subject heading shows its one-line description under it, and a finished lab's tile shows a check mark.
- **Already partly built; what is still missing:** The subject descriptions are still not shown under the headings.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/EarLabScreen.tsx:45-49 and :352 the tile reads useLabDone and shows '✓ DONE'. Not built: src/screens/lab/EarLabScreen.tsx:400-403 CategoryLabel prints only the name and the lab count, while the text exists at src/screens/lab/labCatalog.ts:137-138 (description), e.g. :249
- **Source in the audit:** Report §6 top problem 3 and First 30 s part 3
### MK-04 · Miking Labs (7 families, 128 lessons) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** A family hub opens on a long list-style paragraph and never says where a newcomer should begin.
- **Change to make:** One line at the top of each hub reads: New to miking? Start with Lead Vocal (or Kick Drum or Acoustic Guitar); modules 1 and 2 give you the foundation.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/miking/MikingHubScreen.tsx:81 the hub shows only lab.blurb above the tiles
- **Source in the audit:** Report §6 First 30 s, hub
### MK-05 · Miking Labs (7 families, 128 lessons) · wave 3
- **Beginner problem:** The Start-here step never says a lesson is about 30 steps long or that a beginner can stop after module 2 and come back.
- **Change to make:** The Start-here step says modules 1 and 2 are the foundation, modules 3 to 8 go deeper, and it is fine to stop after module 2.
- **Already partly built; what is still missing:** No sentence gives the lesson's size or says modules 3 to 8 are deeper and can wait.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/miking/engine/journeyKit.tsx:56,61 the map tags stages 1-2 '· FOUNDATION'; src/screens/lab/miking/engine/journey.ts:33 an 'Advanced' stage. Not built: src/screens/lab/miking/engine/journey.ts:96-108 journeyIntro says nothing about length or a stopping point
- **Source in the audit:** Report §6 First 30 s, lesson (G8_MikingLesson suggestion 17)
### MK-10 · Miking Labs (7 families, 128 lessons) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Module 6 'Two microphones' is engineering math, the auditor's 'a beginner leaves here' page, and nothing on it says it is fine to skim for now.
- **Change to make:** Modules 5 to 7 carry a small 'Advanced: read it, skim the numbers, come back later' tag on their goal line and in the contents, with every module still open.
- **Already partly built; what is still missing:** The advanced modules themselves still carry no 'fine to skim for now' marker.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/miking/engine/journey.ts:33 the journey map groups modules 5-7 under 'Advanced'. Not built: no optional-depth tag on the module or in the contents (no such wording in src/screens/lab/miking/MikingLessonScreen.tsx or engine/steps.tsx; the GO DEEPER fold in engine/foldRule.ts only folds long reading lists)
- **Source in the audit:** G8_MikingLesson A2 module 6 (Overwhelm 5) and A5 suggestion 5
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