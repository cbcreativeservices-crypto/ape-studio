# Group F6b: items to build (waves 1-3, owner go 2026-11-15)

Labs: All labs (shared); Cable & Connector Fundamentals; Audio Connectors & Cable Selection; Cable Dressing & Installation; Vacuum Tube Fundamentals; Amplifier Principles; Audio Calculator Laboratory

Items: 23 (wave 1: 11, wave 2: 9, wave 3: 3). Build wave 1 first, then 2, then 3.

## Wave 1

### SH-49 · All labs (shared) · wave 1
- **Beginner problem:** Some tap targets are tiny or sit on top of each other, so a needed spot cannot be hit.
- **Change to make:** Small or stacked targets would be made larger or spaced apart in each lab.
- **Already partly built; what is still missing:** Cable Dressing's small circles and Mic Selection's small photo names were not confirmed fixed.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Round 1 report §2: Sound Systems capstone 2 can be completed, DJ screen 24 has 44 pt switches, Stage Plot objects no longer stack, Wave marks got name tags (src/screens/lab/wave/sceneNameTags.ts). Cable Dressing stage 13 circles and Mic Selection 9 px names were not checked here (per-lab checkers).
- **Source in the audit:** Report §2 pattern 14 (no suggested-change list; one item for the pattern)
### CF-01 · Cable & Connector Fundamentals · wave 1
- **Beginner problem:** Lessons 3, 5, 6 and 7 read like reference manuals: each connector record is longer than the phone screen, so a beginner cannot tell the must-know line from specialist detail.
- **Change to make:** Each connector record opens folded on its photo, name and cautions, and the long essay and list blocks fold behind a 'more' line.
- **Already partly built; what is still missing:** Only lesson 3 opens folded; the records and long blocks in lessons 5, 6 and 7 still open in full.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/cable/lessons/lesson03.tsx:136 <ConnectorCard rec={rec} folded /> (connectorCard.tsx:173 CONTACTS & USES starts closed). Not built: lesson05.tsx:126, lesson06.tsx:86 and lesson07.tsx:175/200 still render ConnectorCard unfolded; lesson06.tsx:89 WHAT THE CARDS TEACH essays always shown in full (guide cableScreenGuides.ts:205 'They always show in full'); lesson07.tsx:178 THE NEVER LIST unfolded
- **Source in the audit:** Report §6 top problem 1 (G3_CableLab lessons 3, 5, 6, 7; lessons 3 and 6 scored Overwhelm 5)
### CS-05 · Audio Connectors & Cable Selection · wave 1
- **Beginner problem:** The lab used to open on a glossary card before the stripped-cable photo, and the four questions sit below the cable-parts block.
- **Change to make:** The opening shows the stripped-cable photo with the 'three things in your hand' line and the four questions (fit, signal, cable, safe) as the habit, with no separate glossary card first.
- **Already partly built; what is still missing:** The four questions are not named in the opening line; they come after the cable-parts block.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/connectorselect/pagesA.tsx:160 the three-things lead and :167 the photo come first; the term card is now inside the one intro card (S1 item 1, ScreenGuide carrier). Not built: pagesA.tsx:175-182 ASK THESE FOUR QUESTIONS still sits after the parts drawing and 8-part list, not in the opening line
- **Source in the audit:** Report §6 First 30 s, part 1
### CI-01 · Cable Dressing & Installation · wave 1
- **Beginner problem:** Long color-key and engineering notes sit above or beside the drawings, so the beginner reads about reverse-racked switches and punch-downs before seeing the task, and stage 8 switches to a different color key.
- **Change to make:** The keys move into a 'Color key' fold under each drawing, the rack-engineering sentence goes, and stage 8 keeps the lab's one color key or flags the change on the drawing.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cableinstall/scenes/RackScene.tsx:2132-2134 the 90-word note ('The switch is reverse-racked... punch-downs... PDU') sits above the stage 6 rack; CeilingScene.tsx:992-994 'These colors differ from the cable-type key'; FloorScene.tsx:1723 the ~150-word stage 9 key is plain text, not folded (stage 11 already folds its key, FireScene.tsx:969)
- **Source in the audit:** Report §6 top problem 1 (G3_CableInstallLab stages 6, 8, 9, 11)
### TB-01 · Vacuum Tube Fundamentals · wave 1
- **Beginner problem:** The lab's main help sits behind long-press, which most beginners never try, and every module still says 'every control long-presses for its own entry'.
- **Change to make:** Each open tray now shows a visible ⓘ for its control; the module line would point at that ⓘ instead of long-press.
- **Already partly built; what is still missing:** The module line and the guides still tell the learner to long-press, and the readouts have no visible help.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/rack/DockTray.tsx:266-280 a visible ⓘ in every open tray with a helpKey (shared S3, owner decision 3); the GUIDED LESSON row is tappable (VacuumTubeLabScreen.tsx:175-180). Not built: VacuumTubeLabScreen.tsx:181 still reads 'every control long-presses for its own entry'; tubeScreenGuides.ts:31 'Long-press ... to read its Guided Lesson entry'; bezel cells stay long-press only (rack/BezelReadouts.tsx:6). Not checked on screen whether fader lanes show the tray ⓘ
- **Source in the audit:** Report §6 top problem 1
### TB-04 · Vacuum Tube Fundamentals · wave 1
- **Beginner problem:** Module 1 opens with two sentences that disagree ('tap each piece to learn its job' versus 'tap a part to REMOVE it') and the word 'pentode', and nothing says in one line what a tube is.
- **Change to make:** Module 1 opens with 'A tube is a valve for electrons: a tiny voltage controls a big flow', one matching instruction ('tap a part to take it out and see what stops working') and a 'start here' mark on PARTS.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/tube/VacuumTubeLabScreen.tsx:930 blurb 'tap each piece to learn its job' vs :317 'tap a part to REMOVE it ... (Drawn as a pentode — the fullest version.)'
- **Source in the audit:** Report §6 First 30 s, part 1 (also G3_TubeLab page 1 suggestions 1 and 3)
### TB-05 · Vacuum Tube Fundamentals · wave 1
- **Beginner problem:** When the first part is removed, the result appears as an ordinary line of text rather than a clear 'no grid, no amplifier' moment.
- **Change to make:** Removing the control grid shows the result in large type ('No grid → the flow can't be controlled → no amplifier') followed by 'Next: warm it up ›'.
- **Already partly built; what is still missing:** The result line is not made prominent and does not point to the next module.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/tube/VacuumTubeLabScreen.tsx:228-231 the missing part's physics line plus 'Tap X to add it back', shown at :284 and :313. Not built: it uses the plain styles.readout text, with no large-type result and no 'next: warm it up' pointer
- **Source in the audit:** Report §6 First 30 s, part 2
### AMPL-02 · Amplifier Principles · wave 1
- **Beginner problem:** Modules 1 and 4 show five readouts before the learner knows what three of them mean, and module 7 step 2 held six sections in one step.
- **Change to make:** Module 7 step 2 is now two steps and every readout has a plain caption; modules 1 and 4 would show only the readouts their lesson uses.
- **Already partly built; what is still missing:** Modules 1 and 4 still show all five readouts at once.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/amp/modules/mod7RealWorld.tsx:225 'Loads, power and bridging' and :355 'Loudness, risk and spec sheets' (split); AmpRig.tsx:238-243 captions; mod4Classes.tsx:317 class table already 'three headline rows per class'. Not built: mod1What.tsx:137-140 OUTPUT plus the full rigStatusBezel (SUPPLY, HEAT, EFFIC., LOAD) although rigStatusBezel takes a `pick` list (AmpRig.tsx:235); mod4Classes.tsx:230-233 five readouts
- **Source in the audit:** Report §6 top problem 2 (modules 1, 4, 7)
### AMPL-03 · Amplifier Principles · wave 1
- **Beginner problem:** The lab's final five-question check sits open on the home screen of a lab the learner has not started, which reads as 'you will fail this'.
- **Change to make:** The final check folds under 'Final check: after the modules' on the home, still one tap away.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/amp/AmpLabHomeScreen.tsx:229-231 <LabUnderstandingBlock labId="amp"/> renders the full check on the home; src/components/LabUnderstandingBlock.tsx:28-36 has no fold
- **Source in the audit:** Report §6 top problem 3, part 1 (also First 30 s 'collapse the final check; do not hide it')
### AMPL-05 · Amplifier Principles · wave 1
- **Beginner problem:** The home opens with a long three-part question, while the lab's best sentence, 'the power supply pays, your signal steers', appears only inside module 1.
- **Change to make:** The home's first line becomes 'The power supply pays, your signal steers', above the single START button.
- **Already partly built; what is still missing:** The steer-and-pay line is not on the home screen.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/amp/AmpLabHomeScreen.tsx:201-211 one START · MODULE 1 button. Not built: :182-185 the home body is still 'One question runs through every module: what is the amplifier doing, what load does it see, and where does the extra output energy come from?'
- **Source in the audit:** Report §6 First 30 s, part 1 (home)
### AMPL-06 · Amplifier Principles · wave 1
- **Beginner problem:** Module 1 has a guess-first prompt, but it sits under five readouts and a paragraph, and nothing says 'you predicted X, now push LEVEL'.
- **Change to make:** Module 1 opens with one readout (OUTPUT CLEAN) and the guess-first prompt on top.
- **Already partly built; what is still missing:** Module 1 still opens with five readouts, and the prompt is not the first thing seen.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/amp/modules/mod1What.tsx:155-165 PREDICT, THEN TRY with three choices, and :178-184 'You called it' feedback after crossing. Not built: :137-140 five readouts; the prompt comes after the opening paragraph (:148-153)
- **Source in the audit:** Report §6 First 30 s, part 2 (module 1)
## Wave 2

### CF-02 · Cable & Connector Fundamentals · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The words each lesson hinges on (level, balanced, powered versus passive, protocol, and OPEN versus CLOSED on the tester) are used before they are ever explained, and OPEN sounds like 'the way is open'.
- **Change to make:** One plain line defines each word where it first matters, for example 'CLOSED = connected, OPEN = a gap' above the tester table and 'Powered = the amp is inside the box' at the top of lesson 5.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cable/lessons/lesson10.tsx:107-111 the map header PATH / EXPECTED / MEASURED has no OPEN/CLOSED key; lesson01.tsx:86-90 the chips start with no 'level' line ('level (how big the signal is)' exists only in the guide card, cableScreenGuides.ts:44); data/lesson05.ts:28-37 'POWERED LOUDSPEAKER' with no powered/passive definition; data/lesson06.ts:21 and :114 use 'protocol' with no plain meaning
- **Source in the audit:** Report §6 top problem 2 (G3_CableLab pages 1, 3, 5, 6, 10)
### CF-04 · Cable & Connector Fundamentals · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Lesson 1 opens on a grid of twelve category chips that reads like a list to memorize, before the learner is asked anything.
- **Change to make:** Lesson 1 opens on a mic, a guitar, a speaker and a wall socket with one line ('cables carry a whisper, a shout, data or mains') and the first 'what travels here?' question, with the twelve categories shown after, grouped AUDIO / DATA / POWER.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cable/lessons/lesson01.tsx:86-95 'WHAT CAN TRAVEL THROUGH A CABLE?' and the 12 flat chips come first; the pair quiz starts only at :103
- **Source in the audit:** Report §6 First 30 s, part 1
### CF-05 · Cable & Connector Fundamentals · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first card a beginner meets defines 'Cables (audio)' with balanced, unbalanced, coax, shielding, strain relief and gauge, on a page that is about what travels, not how cables are built.
- **Change to make:** The term card waits until lesson 2 (cable builds), or lesson 1 shows a term about signal level instead.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:122-128 CableLab term 'Cables (audio)' with the builds text, shown on lab entry (now inside the intro card, S1 item 1)
- **Source in the audit:** Report §6 First 30 s, part 2
### CI-02 · Cable Dressing & Installation · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Stage 1's card titles gave the answer away, stage 6 explains each find below the drawing and the suspect list where the eye is not, and stage 2 locks every answer on the first pick.
- **Change to make:** Stage 1 shows neutral close-ups until the pick; stage 6 would show each find's explanation next to the drawing; stage 2 would allow one more try or say why it locks.
- **Already partly built; what is still missing:** Stage 6 feedback still lands below the drawing, and stage 2 still locks on the first pick without saying why.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/cableinstall/scenes/WhyScene.tsx:35-67 'blind' captions, names revealed after the pick (:162, :195). Not built: RackScene.tsx:2235-2238 the find's explanation renders after the counter and the suspect list, below the rack; KnowScene.tsx:312 'each call locks once made' and :355 'Every answer locks when you make it' with no reason given
- **Source in the audit:** Report §6 top problem 2 (stages 1, 2, 6)
### CI-04 · Cable Dressing & Installation · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab opens on an INTRO page with a 50-word sentence listing eight duties and a regulatory note, before any task.
- **Change to make:** The lab opens straight on stage 1's four close-ups, and the long paragraph and regulatory note move behind SOURCES / STANDARDS.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/cableinstall/CableInstallLabScreen.tsx:636-643 IntroStage still shows the scene, the long lead paragraph and CI_GOVERN_NOTE above START LAB
- **Source in the audit:** Report §6 First 30 s, part 1
### TB-02 · Vacuum Tube Fundamentals · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The GRID V fader is in percent, so low percent means most negative and no current, and the bias and saturation graphs have no axis words; the 'tanh' word was in a caption.
- **Change to make:** 'tanh' is gone from the caption; the fader ends would read in words (closes / opens) and the graph axes would say 'grid voltage in' and 'current out'.
- **Already partly built; what is still missing:** The grid fader still reads in percent, and the curves still have no axis words.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/tube/VacuumTubeLabScreen.tsx:808 modelNote 'A normalized soft-clipping curve' (no tanh). Not built: VacuumTubeLabScreen.tsx:418-424 GRID V still formats as percent; viz.tsx:1330 the bias curve has axis ticks only, no axis words or region labels
- **Source in the audit:** Report §6 top problem 2 (modules 3, 7, 8)
### AMPL-01 · Amplifier Principles · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Formulas and real units arrive from module 1 (Av = Vout / Vin, 20·log10, P = 14.1² ÷ 8), and Class D's PWM duty and module 6's Vrms / √2 come with no plain bridge first, which is where an adult with no maths in years wants to leave.
- **Change to make:** Module 1's 'Three kinds of gain' and the watts arithmetic move into LEARN MORE, and modules 2, 5 and 6 open with a plain sentence or analogy (a fast light switch for Class D) before any formula.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/amp/modules/mod1What.tsx:204-208 FormulaCard 'Three kinds of gain' shown open; :227 and :236 P = Vrms²/R arithmetic in the main card; mod2Devices.tsx:259/265 and mod6Supply.tsx:218 FormulaCards open; no analogy in mod5ClassD.tsx (no 'switch' or 'analogy' text)
- **Source in the audit:** Report §6 top problem 1 (G3_AmpLab modules 1, 2, 5, 6)
### CA-03 · Audio Calculator Laboratory · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Units and notation drifted: 'dB' where dBu or dBV was meant, 'MV/PA', '1.678e7', a gauge range of '-3 to 18', and sample rate typed in Hz in some workspaces and kHz in others.
- **Change to make:** Answers now print dBu, dBV or dBFS as named, mV/Pa keeps its case, big counts are written out, and the gauge refusal is in words; sample rate would use one convention everywhere.
- **Already partly built; what is still missing:** Sample rate still asks for kHz in some workspaces and Hz in others.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/calc/calcUnits.ts:676 namedOutputUnit; CalcWorkspaceScreen.tsx:420 mV/Pa and dBV/Pa case kept; workspaces/digitalAdv.ts:660 'THAT IS' row; ampacity.ts:347 rangeMsg. Not built: timePhase.ts:679-681 SAMPLE RATE default kHz ('48') vs digitalAdv.ts:86 and :183 ('48000', Hz)
- **Source in the audit:** Report §6 top problem 3, part 2 (units drift)
### CA-04 · Audio Calculator Laboratory · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The home has ten topic cards and no 'start here', and the guided Workflows, which suit a beginner best, sit in a closed fold.
- **Change to make:** The home opens with 'Pick a job, get a number you can use', three job buttons that run pre-filled workflows, then 'Or browse all 166 calculators by topic ›'.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/calc/CalcLabScreen.tsx:104 wfOpen defaults to collapsed ('owner 2026-08-09') and :183 '▸ CUSTOM CALCULATOR WORKFLOWS'; no start-here or job buttons on the home
- **Source in the audit:** Report §6 top problem 3, part 1 (no beginner path) and First 30 s
## Wave 3

### CS-02 · Audio Connectors & Cable Selection · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** 'Balanced' is used from page 1 but only explained on page 8, and protocol, level, phantom power and DI are used before they are explained.
- **Change to make:** Page 2's BALANCED MONO view says in one line what balanced buys you (two copies, one flipped, so noise cancels), and protocol, phantom power and DI get a short gloss where they first appear.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/connectorselect/pagesA.tsx:206-221 page 2 says 'balanced MONO' with no meaning; the first plain explanation is still data/practice.ts:39 (page 8); pagesA.tsx:161 LessonCard on page 1 still uses 'protocol'
- **Source in the audit:** Report §6 top problem 2 (G3_ConnectorSelectLab pages 1, 2, 5, 8, 9)
### CS-06 · Audio Connectors & Cable Selection · wave 3
- **Beginner problem:** Neither cable lab says how it relates to the other, so a beginner does not know which to do first and feels deja vu.
- **Change to make:** One line on page 1 says this is the 'choosing' lab, Cable & Connector Fundamentals is the 'naming' lab, and either can come first.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/connectorselect/pagesA.tsx:159-161 page 1 has the station tag, lead and lesson card, no line about the sister lab ('Fundamentals' appears only in code comments, e.g. ConnectorSelectLabScreen.tsx:10)
- **Source in the audit:** Report §6 First 30 s, part 2
### CI-03 · Cable Dressing & Installation · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Building-trade words (OD, raceway, plenum, rated wall, riser, pull, fill, SR / SL) appear with no plain meaning, and the 'Cable dressing' glossary card used to say 'neat and tidy'.
- **Change to make:** The glossary card now agrees with the lab; each trade word would get a one-line meaning at first use, for example 'OD = the cable's outside diameter'.
- **Already partly built; what is still missing:** The trade words still have no one-line meaning on the stages where they first appear.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/features/intro/labTermIntroData.ts:151-152 'not just making them look neat'. Not built: scenes/MechScene.tsx:325 and :486 '× OD' with no gloss on the page; WallsScene.tsx:674 'RACEWAY — PICK THE ROUTE' with no meaning in the stage text (plenum is glossed only in the guide, cableInstallScreenGuides.ts:429)
- **Source in the audit:** Report §6 top problem 3 (stages 3, 4, 7, 8, 9, 11; also quick win 9)
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