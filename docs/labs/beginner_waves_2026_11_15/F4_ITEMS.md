# Group F4: items to build (waves 1-3, owner go 2026-11-15)

Labs: Beginning Mixing; Advanced Mixing; Mastering Lab; Mixing Guides; Audio Pre-Production; Audio Post-Production; All labs (shared)

Items: 19 (wave 1: 8, wave 2: 6, wave 3: 5). Build wave 1 first, then 2, then 3.

## Wave 1

### BM-02 · Beginning Mixing · wave 1
- **Beginner problem:** On a phone the picture that reacts sits below the buttons that change it, or the channel to move is off screen, so 'watch it change' happens out of sight.
- **Change to make:** The picture moves above the list of buttons (or stays pinned), and the console opens scrolled to the channel the page asks you to move.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixing/pagesA.tsx:125-129 page 2 PrepArt still drawn after the seven-step ConceptList; pagesC.tsx:276-292 page 11 TermsArt still after the six term rows
- **Source in the audit:** Report §6 top problem 2 (G4 pages 2, 5, 7, 11)
### BM-06 · Beginning Mixing · wave 1
- **Beginner problem:** On page 1 the mixer's mantra is printed twice in a row, once as a grey line and again in the gold box, which looks like a glitch.
- **Change to make:** The mantra shows once on page 1, inside THE MIXER'S MANTRA box.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/kit/PagedLab.tsx:683 prints subtitle on page 1, and both mixing screens pass subtitle={MIX_MANTRA} (BeginningMixingLabScreen.tsx:88); src/screens/lab/mixing/pagesA.tsx:44 then draws <MixMantra /> with the same sentence
- **Source in the audit:** Report §6 First 30 s, part 3 (G4 page 1 suggestion 2)
### AM-03 · Advanced Mixing · wave 1
- **Beginner problem:** Some drawings open on a dark compressor reading 'BYPASSED' with dashes, and page 6's peak and crest numbers only appear after sound plays, so a silent learner sees what looks broken.
- **Change to make:** The starting drawing says in words what it shows ('No compressor yet: tap a version to see one'), and page 6 shows its numbers without sound.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixing/advPlots.tsx:195 page 8 starts with settings null, drawn as '— BYPASSED' by advArt.tsx:378; pagesAdvC.tsx:256 page 14 starts 'clean' (no chain); pagesAdvB.tsx:62 'Play a version to measure its peak, RMS and crest factor' (F4 phase 2 notes the silent measurement as not done)
- **Source in the audit:** Report §6 top problem 3 (pages 6, 8, 14)
### MA-01 · Mastering Lab · wave 1
- **Beginner problem:** The LISTEN steps show a full limiter or EQ faceplate, six readouts and long mechanics notes, with the plain habit line last.
- **Change to make:** Each LISTEN step leads with what to listen for and the habit, and folds the mechanics and honesty notes under GO DEEPER.
- **Already partly built; what is still missing:** Module 5 step 3 and Module 6 step 2 still show the full notes with no beginner-first order or fold.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built for M1 S3: src/screens/lab/mastering/modules/mod1What.tsx:141-158 HOW THIS COMPARISON WORKS GoDeeper fold. Not built: mod5Workflow.tsx:136-140 faceplate note first, habit last, no fold; mod6Loudness.tsx:220-232 four mechanics notes, no fold
- **Source in the audit:** Report §6 top problem 1 (M1 S3, M5 S3, M6 S2)
### MA-02 · Mastering Lab · wave 1
- **Beginner problem:** The same option has different names in the intro card, the dock list and the readout (STEREO vs 'Stereo / spatial', QUIET MID vs 'Quiet song in the middle').
- **Change to make:** Each option uses one name everywhere: card, dock, readout and guide.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mastering/modules/mod4Tools.tsx:20 dock reads STEREO while :121 and masteringContent.ts:148 read 'Stereo / spatial'; masteringContent.ts:287 'Quiet song in the middle' vs short 'QUIET MID'; F4 left these for the owner (phase 1 'not checked')
- **Source in the audit:** Report §6 top problem 2
### MG-01 · Mixing Guides · wave 1
- **Beginner problem:** Right under the two plain top lines, every guide shows AT A GLANCE with 'dBA LAeq,15min' and 'LUFS-I', the first numbers a beginner meets.
- **Change to make:** AT A GLANCE moves below the guide's sections, or keeps only origin and tempo on top with the level numbers in a fold.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixingGuides/MixingGuideScreen.tsx:192-202 AT A GLANCE block still drawn straight after the priority card and the starting-points line
- **Source in the audit:** Report §6 top problem 1
### PP-04 · Audio Pre-Production · wave 1
- **Beginner problem:** The start screen's opening words are a long sentence and do not say that the lab asks a producer's questions one stage at a time and tells you what is still missing.
- **Change to make:** The start screen opens with 'Plan a recording or a show before anyone presses record' and one line on how the stages work.
- **Already partly built; what is still missing:** The short plain first line and the 'one stage at a time' promise are not there.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/production/labs.ts:48-50 blurb 'Everything that should happen before recording ... Build a plan, find what is missing' already gives the purpose; src/screens/lab/production/ProductionLabScreen.tsx:354-358 START A PROJECT line unchanged
- **Source in the audit:** Report §6 First 30 s, part 1
### PO-02 · Audio Post-Production · wave 1
- **Beginner problem:** Stages are long forms with up to 30 identical 'Not applicable to this project' links and legal or safety boxes before the first question.
- **Change to make:** Optional questions are now folded, which hides their links too; the remaining links could become smaller and the boxes merged.
- **Already partly built; what is still missing:** The not-applicable link is still on every shown question, and the stacked boxes are unchanged (see PP-02).
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/production/ProductionStageScreen.tsx:482-518 optional questions folded (same screen as Pre-Production). Not built: src/screens/lab/production/FieldRow.tsx:136-142 every shown question still has its full 'Not applicable to this project' link; ProductionStageScreen.tsx:402-404 boxes still stacked
- **Source in the audit:** Report §6 top problem 2
## Wave 2

### SH-71 · All labs (shared) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The production labs flag gaps as findings and blockers rather than as gentle questions.
- **Change to make:** Gaps would be asked as questions, such as 'No monitor for this performer. Is that intended?'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** 'Is that intended?' appears only in src/features/stageplot/spReview.ts; production findings read 'WHAT THIS PLAN IS STILL MISSING' (src/screens/lab/production/ProductionStageScreen.tsx:530)
- **Source in the audit:** Report §5 row 16: questions, not errors ('Performer 1 has no monitor. Is that intended?'), copy to production labs and forms
### BM-04 · Beginning Mixing · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first thing a newcomer meets is a full-screen, five-paragraph 'Knowing When to Bring In a Pro' note, which reads like a disclaimer before they have done anything.
- **Change to make:** The note no longer opens by itself on arrival; it stays as the small 'When to bring in a pro' link on the first page.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/kit/PagedLab.tsx:696 ProNoteIntro still mounted for both mixing labs; src/screens/lab/mastering/MasteringLabScreen.tsx:586 same on Mastering; src/features/lab/ProNote.tsx:4-8 shown once per device on first open, owner text 2026-10-07
- **Source in the audit:** Report §6 First 30 s, part 1 (also Mastering and Mixing Guides arrival)
### AM-02 · Advanced Mixing · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Opening paragraphs are dense, with brackets inside brackets and standards names (BS.1770, ITU-R, dBTP) in the first box a learner reads.
- **Change to make:** Each of those blocks starts with one plain sentence, the bracketed asides become short separate lines, and the standards names move under the plain idea.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixing/pagesAdvA.tsx:303 WHEN EACH TOOL WINS still one paragraph with two nested asides; pagesAdvD.tsx:77-78 'BS.1770-STYLE ESTIMATES' eyebrow and ITU-R line first; pagesAdvA.tsx:58 page 1 lede unchanged
- **Source in the audit:** Report §6 top problem 2 (pages 1, 4, 14, 15)
### PP-02 · Audio Pre-Production · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Up to three LEGAL, SAFETY and QUALIFIED PERSONNEL boxes stack before the first question, so a stage reads as 'dangerous and legal' on arrival.
- **Change to make:** The boxes at the top of a stage merge into one short line with a tap for detail, or each moves next to the questions it is about.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/production/ProductionStageScreen.tsx:402-404 every stage notice drawn in a row after WHY THIS MATTERS, :460-462 more per section; Notice at :563-569 unchanged
- **Source in the audit:** Report §6 top problem 2
### PP-06 · Audio Pre-Production · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** On a new project the packet opens with about 83 rows of what is left before the document even starts.
- **Change to make:** While a project is barely started, WHAT'S LEFT shows one line per stage ('Stage 1: 17 questions ›') that opens to the full rows.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/production/ProductionPacketScreen.tsx:228-253 every open item is drawn as its own row, grouped by stage, with no short form (owner ruling 2, 2026-10-04 asked for the actual items, not counts)
- **Source in the audit:** G4_PreProdLab Production Packet (scored Overwhelm 5 on a fresh project)
### PO-03 · Audio Post-Production · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** On a Live performance project, most exercises describe 'an episode' or 'an interview' under a chip that says Live performance or event.
- **Change to make:** Each exercise either gets a scenario that fits the project type or names its own setting ('This exercise uses a podcast episode').
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/production/ProductionActivityScreen.tsx:164-168 shows the podcast prompt above the project's pathway label; src/features/production/postprod/stage1.data.ts:570-572 exercise 1 is 'an episode', 'Northgate, episode 4'
- **Source in the audit:** Report §6 top problem 3, part 1
## Wave 3

### BM-01 · Beginning Mixing · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Most pages open with a paragraph that drops four to eight new words at once (EQ, sends, sample rate, bit depth) and never says the idea in plain words first.
- **Change to make:** Each heavy page gets one plain first line, such as 'EQ means turning up or down only some pitches of one sound' or 'Sample rate is how many snapshots per second'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixing/pagesC.tsx:60 page 8 lede still assumes EQ is known; pagesC.tsx:216 page 10 and :272 page 11 ledes unchanged; pagesD.tsx:182 page 15 lede, and no plain line for sample rate or bit depth anywhere in pagesD.tsx (no 'snapshot' text in the mixing folder)
- **Source in the audit:** Report §6 top problem 1 (G4 pages 3, 8, 9, 10, 11, 15)
### MG-02 · Mixing Guides · wave 3
- **Beginner problem:** Nothing marks which of the 13 sections are the beginner core and which are reference tables, and OPEN ALL dumps about 2,500 words.
- **Change to make:** Each guide shows a small 'Start here' tag on Balance and blend, Common mistakes and Reference recordings, with the tables marked as reference.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixingGuides/MixingGuideScreen.tsx:210-212 all 13 sections drawn alike by Section (:239-253), no tag; :206-207 OPEN ALL unchanged
- **Source in the audit:** Report §6 top problem 2 + First 30 s part 2 (a three-item 'Start here')
### MG-06 · Mixing Guides · wave 3
- **Beginner problem:** The hub never tells a total beginner which guide to open first.
- **Change to make:** The hub's top line adds 'New to mixing? Open Pop first: every guide has the same layout.'
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/mixingGuides/MixingGuidesHubScreen.tsx:172-174 intro line lists the sections only; no 'start with' pointer on the hub
- **Source in the audit:** Report §6 First 30 s, part 1
### PO-01 · Audio Post-Production · wave 3
- **Beginner problem:** Values set in stage 1 (sample rate, loudness, true-peak ceiling) are judged in stages 3 and 7 with no view of them there, and a measured +0.4 dBTP raised no finding.
- **Change to make:** A true peak above 0 dBTP with no ceiling now raises a finding; stages 3 and 7 would also show the stage 1 values they compare against.
- **Already partly built; what is still missing:** Stages 3 and 7 still do not show the stage 1 settings they are checked against.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/features/production/postprod/logic2.ts:276 and postprod/stage7.data.ts:472 rule 'finish-true-peak-over-zero-no-ceiling'. Not built: src/screens/lab/production/ProductionStageScreen.tsx:395-447 shows no read-only stage 1 values on later stages
- **Source in the audit:** Report §6 top problem 1
### PO-06 · Audio Post-Production · wave 3
- **Beginner problem:** The start screen does not say 'you've been handed a folder of recordings, three chapters, follow NEXT OUTSTANDING'.
- **Change to make:** The start screen adds one line naming the three chapters and telling the learner to follow NEXT OUTSTANDING.
- **Already partly built; what is still missing:** The three chapters and the 'follow NEXT OUTSTANDING' tip are not in the start text.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/production/labs.ts:59-61 subtitle and blurb already say 'a folder of recordings through to a verified delivery'; chapters exist at :67-70 but the start text does not name them or NEXT OUTSTANDING
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