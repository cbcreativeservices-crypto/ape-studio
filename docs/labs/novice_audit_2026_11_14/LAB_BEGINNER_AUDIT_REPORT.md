# Lab beginner audit: the merged report (2026-11-14)

This report merges the overnight beginner audit of every lab. It is an audit only: no app file was changed, and no G* file was changed. Every number comes from the auditors' files in this folder. Where I counted, I say what I counted.

Words used in this report:
- **Popup**: any card or sheet that covers the page (term card, intro card, Sound Safety sheet, screen-guide bubble).
- **Silent learner**: someone with sound off. The whole audit was done with sound off.
- **Shared frame**: the parts many labs reuse: the rack display, the dock and its trays, the intro card, the screen guide, the Sound Safety sheet, the check (quiz) card and the end screen ("What's left").
- **Overwhelm**: the auditors' 1-5 score per page (1 calm, 5 "wants to leave").

---

## 1. At a glance

**What was audited.** All 60 entries of the Labs menu, plus the Labs menu itself. I counted the 60 from the app's lab list (22 subjects). Signal Detective counts as its own entry. Miking Labs counts as one entry (7 families, 128 lessons).

**How.** Ten auditors (G1-G8, plus follow-ups G1b, G5b, G5c, G6b) walked each page in the web preview at phone size (390 x 844), with sound OFF. Each page was judged twice: as a total beginner (no audio words at all) and as a hobbyist (home studio, knows the basic words).

| Group | Labs | Page entries (from each group's own totals) |
|---|---|---|
| G1 | Amplitude, Foundations of Sound, Sound Playground, Microphone Principles, Wave Physics, Speaker Placement, Room Design | 56 (G1b re-walked Wave modules 7-16 by hand: 10 more) |
| G2 | Digital Audio, Visual Audio Analysis (Meter), Signal Detective, Signal Chain Builder, Gain Staging, Patchbay | 58 |
| G3 | Cable Fundamentals, Connector Selection, Cable Dressing, Vacuum Tube, Amplifier, Calculator Lab | 128 (Calculator Lab alone: 63 screens, incl. all 56 workspaces) |
| G4 | Beginning Mixing, Advanced Mixing, Mastering, Mixing Guides, Pre-Production, Post-Production | 164 (my sum: 17 + 21 + 40 + 52 + 15 + 19); plus all 43 Mastering practice cards |
| G5 | Game Audio, Stage Plot, Sound Systems, DJ Systems | 82 (G5b added 50 hands-on entries, G5c added 33) |
| G6 | Equalizer, EQ Lab, Compression, Gate, Limiter, Smart Processors, Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase, Stereo, Binaural | 69 (G6b re-walked 20 by hand; its file says 21, its own breakdown adds to 20) |
| G7 | Oscillators, Noise, Harmonics, FM, Modular, Envelope, Autotune, Tuning, Drum Tuning, Cymatics, Harmonograph, Speech, Ear Training, Bass | 130 |
| G8 | Labs menu, Microphone Selection, Miking (7 hubs + 128 lessons) | 150 (3 + 12 + 7 + 128); every step of every Miking lesson was opened: "3,700+ step screens" |

First-pass entries: 837 (sum of the column). Follow-up entries: 113 (10 + 50 + 33 + 20). Total: 950.

**The 5 biggest takeaways**
1. **The first ten seconds are the worst ten seconds.** Two to four popups arrive before the first touch, and late ones swallow the first tap. Named in 49 labs.
2. **The Sound Safety sheet keeps coming back.** It says "This warning appears once." G6 saw it on 13 of 13 sound labs, DJ Systems on 23 screens.
3. **A silent learner often has no first step.** Many "where to start" lines begin with ▶. Yet the best labs (Game Audio, Gain Staging, Patchbay, De-Esser, Speech) prove silent teaching works.
4. **Checks and credit send mixed signals.** Wrong-answer feedback equals the right-answer text in all 10 effect-lab checks (G6b). Credit and "done" are given for walking past in some labs and withheld after full work in others.
5. **The words and codes sit exactly where the eye lands.** Readouts like GR, RT60, FDBK, F0 and LOSS/BNC appear first, and readout labels drop at phone width.

---

## 2. The cross-lab patterns, ranked

Ranked by how much each one hurts a beginner, times how many labs it touches. "SHARED" means one change in the shared frame fixes many labs at once.

### Pattern 1 · Popups pile up before the first tap, and late ones swallow taps (SHARED)
- **What a beginner experiences:** they open a lab and close a term card. Then they get a long Sound Safety sheet, then a "What you're learning" card, then a "New: tap ⓘ" bubble. When they finally tap, a card that arrived a second late eats the tap, and "nothing happened".
- **Labs (49 named in the files):**
  - Amplitude, Foundations, Playground, Mic, Wave, Room
  - Signal Chain, Digital, Gain
  - Cable, Connector Selection, Cable Dressing, Amplifier, Calculator
  - Beginning Mixing, Mastering, Mixing Guides, Pre-Prod, Post-Prod
  - Game Audio, Sound Systems, DJ
  - all 13 sound labs of G6 plus EQ Lab home
  - Oscillators, Noise, Harmonics, FM, Modular, Autotune, Harmonograph, Bass, Envelope, Tuning, Drum Tuning
  - Mic Selection, Miking
- **Examples:**
  - Equalizer: "Three different popups before touching anything is the main load." (G6_EqLab.md)
  - Signal Chain: "Four interruptions in a row, each with its own button" (G2_SignalChainLab.md)
  - Late arrivals: G6b found the first tap after the safety sheet ignored in Chorus, Flanger, Phaser, Distortion and Phase. It also found the first-visit popup "arrives ~1 s after the page in every LEARN/CHECK".
  - DJ: "on screens 17-21 my first tap was swallowed".
  - Sound Systems: the intro card swallows the first NEXT tap on every LEARN page.
  - Cable Lab: "My first tap on NEXT › was swallowed by the tip".
- **Suggested change:**
  - One popup at a time, at most two before the first touch.
  - Merge the term card into the intro card.
  - A popup must appear before the page can be tapped, or wait until the learner is idle; it never accepts a tap in its first moment.
  - It never opens on top of an open tray or console.
  - Hide the "New: tap ⓘ" bubble once the guide has been used.
- **Size:** M (G7 rates the full merge L). **SHARED:** intro card, screen guide, Sound Safety host.

### Pattern 2 · The Sound Safety sheet returns, and sometimes behaves oddly (SHARED)
- **What a beginner experiences:** they chose KEEP SOUND OFF. The sheet ("This warning appears once.") comes back on the next lab, the next screen, or twice in a row. They stop trusting what the app says.
- **Labs (17 explicit):**
  - Equalizer, Compression, Gate, Limiter, Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase, Stereo, Binaural (G6: "appeared on EVERY sound-lab arrival (13 labs)")
  - DJ Systems: on screens 1 and 3-24 across the three auditors; twice in a row on screens 11, 12, 13, 14 and 20
  - Beginning Mixing (pages 4 and 8)
  - Advanced Mixing (page 8)
  - Modular
- **Examples:**
  - DJ, G5c, screen 13: it quotes "This warning appears once." and the sheet reopened.
  - Equalizer: the sheet appeared and then vanished "without me pressing either KEEP SOUND OFF or I UNDERSTAND".
  - Limiter: the sheet was "semi-transparent for ~2 s… its text and the lab text overlap and are both unreadable".
  - Compression and Signal Chain: KEEP SOUND OFF is below the fold, so you must scroll inside the sheet to reach it.
  - DJ, G5b: three Sound Safety popups opened by a fault's playback took the taps meant for the lesson (screens 17, 18, 20).
- **Suggested change:**
  - Honour the choice for the session (or device), and make "appears once" true or reword it.
  - Pin KEEP SOUND OFF and ENABLE SOUND so both are always visible.
  - Never open the sheet in the middle of a tap.
  - Several auditors suggest showing it on the first ▶ instead of on arrival. That changes the safety flow, so it is your call.
- **Size:** M. **SHARED:** Sound Safety sheet.

### Pattern 3 · The first step needs sound, so a silent learner is stuck
- **What a beginner experiences:** "Set SOURCE to PINK NOISE and tap ▶." With sound off, nothing visible happens and nothing says why.
- **Labs:**
  - Equalizer, Compression, Gate, Limiter, Delay, Reverb, Chorus, Flanger, Binaural (G6 list)
  - Signal Chain, Playground
  - Foundations module 11: it asks for PLAY but has no PLAY key
  - Beginning Mixing pages 4 and 5; Mastering module 1 step 3; several Advanced Mixing pages
  - Oscillators, Noise, Harmonics, Modular, Bass, Tuning chapter 1
  - Ear Training (all drills)
  - Drum Tuning chapter 3 step 2 and chapter 7 step 2: "the step cannot be finished without sound"
  - Game Audio page 13 (headphones)
- **Examples:**
  - Equalizer: "Sound-off and web users currently have no first step that works."
  - Signal Chain: "Tapped ▶: nothing visible happened — OUT stayed IDLE, no GR number, no message."
  - Beginning Mixing page 4: "After KEEP SOUND OFF, nothing happens and nothing says why".
- **The counter-proof:** Game Audio's log writes "(not heard: sound is off)" and still teaches. Phase, Stereo and Distortion have silent recipes that work.
- **Suggested change:**
  - Every WHERE TO START gets a silent first step ("Drag the FREQ fader and watch the bump").
  - Add a frame line: "Sound off? You can still do every step; the readouts show what you would hear."
  - Mark sound-only steps and goal chips "needs sound".
  - Every listening step gets a "can't listen now" path.
- **Size:** S per lab (copy), M for the frame line and the needs-sound tags. **SHARED** (frame line, tags) plus per-lab copy.

### Pattern 4 · Wrong-answer feedback gives the answer away, or is the same for every wrong answer (SHARED: check card)
- **What a beginner experiences:** the "wrong" box prints the full right answer, so they learn to tap anything and read. Or every wrong option gets the same vague line, so they cannot tell why they were wrong.
- **Labs:**
  - All 10 effect-lab checks walked by G6b (Binaural, Gate, Limiter, Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase): "wrong-answer feedback = right-answer text".
  - The 8 G7 rack labs (Oscillators, Noise, Harmonics, FM, Modular, Autotune, Harmonograph, Bass): the wrong box "names the right answer… immediately".
  - Mastering: the opposite fault. The same generic ✗ for every wrong option, "after SEVEN identical lines" on one module 4 card. G4 states 31 of 43 cards show it, but only 14 are traceable card by card in the file.
  - Game Audio page 19: the FIX tray "opens with the right tab already selected and ticked".
  - Connector Selection page 15: "every one of the nine answers is FALSE, and the guide card says so".
  - Cable Dressing stage 1: "The card titles give the answer away".
  - Sound Systems: the setting lines give the answer away "in 12 of 22 cases".
  - The right answer is often the longest option: Stereo, EQ Lab and most effect labs (Reverb is the exception).
- **Examples:**
  - Gate: "Q3's feedback ('HOLD keeps the gate open for a minimum time') is word-for-word Q4's right answer."
  - Limiter Q2's wrong-answer text states the number: "the limiter holds them down by 5 dB."
- **Good models already in the app:**
  - Drum Tuning chapter 4 step 4 gives a hint first.
  - Phaser Q1/Q4, Reverb Q1 and Flanger Q3 say which control the wrong idea belongs to.
  - Patchbay page 4 names the misconception.
- **Suggested change:**
  - Each wrong option gets its own one-line reason, or a hint pointing to the picture.
  - Show the answer only after a second miss.
  - Balance option lengths in the copy.
- **Size:** M (component) plus S per question set. **SHARED:** check component.

### Pattern 5 · Credit and "done" mean different things in different labs (and many counters show N of total)
- **What a beginner experiences:** in one lab, opening pages gives "LAB COMPLETE". In another, finishing every page still says "13 pages still to finish". They cannot tell what "done" means.
- **Labs: credit for walking past**
  - Foundations: "✓ 14 CREDITED" after answering 2 checks.
  - Mic: "✓ 10 CREDITED" with none answered.
  - Wave: "✓ 16 CREDITED" with none answered.
  - Vacuum Tube: "✓ 9 DONE" after paging through.
  - Digital and Gain: a ✓ "as soon as a module is OPENED" (the home guide says this is by design).
  - Mixing Guides: "✓ 50 DONE" after one MARK AS READ.
  - Mastering: "· credited" after the last card, right or wrong. Module 3 step 3's + CONNECT "auto-builds the CORRECT chain".
  - Sound Systems: an answer at 0 probes counts as solved; "REQS already reads 1/8" before anything is placed; FINISH says "LAB COMPLETE" after one mode.
  - DJ screen 14: "'✓ Lock the key' was already ticked when the fault started".
  - Game Audio page 19: faults 1-4 count as fixed without a re-run.
- **Labs: the reverse**
  - Beginning Mixing: "13 pages still to finish" after all 16 were walked.
  - Advanced Mixing page 1 says Beginning is not done after it was walked.
  - Envelope, Tuning ("14 chapters not done yet" after all were worked) and Speech say "not done" after full visits.
- **N of total shown by the app itself.** Your rule is that progress never shows "N of total". Examples quoted in the files:
  - The module strip "MODULE n / N" in most paged labs.
  - "✓ 14 CREDITED"; "CHAIN 0/9" (Signal Chain).
  - "LESSON 1 · 1 OF 12" (Cable).
  - "16 pages still to finish before this lab counts toward your credit" (Connector Selection).
  - "LEARN 0/22 … TROUBLESHOOT 0/22" on the Sound Systems hub.
  - "MODULE n / 50" plus "Mixing guide 1 of 50".
  - "Reasoning: 1/3 key factors selected" (Mic Selection).
  - "0 OF 6 CORRECT" (Envelope); "Trial 1 of 10" (Ear Training); "FRET FRET 3 of 12" (Bass).
  - Some are values, not progress: "VOICES 0/16" (a budget), "TREATED 0/14", "1/4 walls fiberglass".
- **Suggested change:**
  - Decide one meaning of "done" (for example: a module counts when its own goal or check is met). Show it the same way everywhere.
  - Make each end-screen row say what is missing on that page.
  - Never remove credit already earned.
  - Review the counters against the no-N-of-total rule. Several auditors' own suggestions would add more counters ("JOBS FOUND 1 of 4", "FAULT 1 OF 2", "PAGE 1 of 9", "Step 2 of 6"); I have not carried those into this report.
- **Size:** M (a policy, then a sweep). **SHARED:** end screen, paged-lab strip.

### Pattern 6 · Jargon and codes where the eye lands first; labels drop at phone width (SHARED: bezel readouts)
- **What a beginner experiences:** the first thing they read is "GR — dB", "RT60", "FDBK", "F0 · THD 75.2 % · CREST 5.8 dB", "LOSS/BNC" or "MC · PB". Readouts lose their label at 390 wide, leaving a bare "+6.6 OVR".
- **Labs:** almost every lab. The clearest examples:
  - Wave: "LOSS/BNC", "FRESNEL N".
  - Reverb: the main control is named "RT60".
  - Harmonics: "F0, THD 75.2 %, CREST 5.8 dB, SLOPE −6.0".
  - Harmonograph: "SHAPE '90°·M·R'".
  - Phase: "R: Ø · DLY", "POL".
  - Advanced Mixing page 15: "'BS.1770', 'ITU-R', 'integrated loudness', 'true peak', 'dBTP' all in the first box".
  - Mixing Guides: AT A GLANCE opens with "95–100 dBA LAeq,15min".
  - Digital: "FS" means full scale in module 1 and sample rate in modules 2 and 7.
- **Labels dropping:**
  - Meter module 4 "lost 4 of its 5 labels".
  - Gain module 2's tag reads "TOO" ("LOW" cut off).
  - Digital modules 1, 2, 4 and 8.
  - Game Audio "WIND F…"; Sound Systems "Lead vo…" and "PROBE ▸ NO"; Miking dock "POSITI…", "SIDE…".
  - Labs menu: "34 of 65" tile blurbs cut at three lines, "so the visible words are often the hardest ones".
- **Suggested change:**
  - Plain-word captions on the bezel readouts on first visit (Equalizer: "where / how much / how wide / shape").
  - A tap chip that explains Hz and dB at first sight.
  - Spell out codes on first view ("F0 · the note").
  - Keep labels at 390 by shortening the value. Your D36 rule (a cropped readout drops its label, never its number) still stands; the auditors ask for room, not for dropped numbers.
- **Size:** M for captions, S for each truncation fix. **SHARED:** rack bezel, DockTray labels.

### Pattern 7 · Too much at once: reference-manual pages and two lessons per page
- **What a beginner experiences:** a wall. A connector record longer than the phone screen, 33 questions on one form, six readouts, or a 1,073-word step.
- **Labs and examples:**
  - Cable Lab lesson 3: "One connector's record is longer than the phone screen."
  - Pre-Production stage 1: "33 questions (17 marked required)".
  - Stage Plot SETUP: "Roughly 25 fields and switches on one scroll for an empty plot."
  - Sound Systems capstone 6: "about 160 tap targets in a phone-width popup".
  - Amplifier module 7 step 2 "holds six sections in one step".
  - Miking ensemble lesson E16 step 3.3: 1,073 words.
  - Mastering module 1 step 3: "a hardware face, a graph, six number cells, and seven paragraphs".
  - Two lessons per page: Game Audio pages 4 and 10; Advanced Mixing pages 7, 8, 10, 11 and 13; Digital modules 2, 3, 7 and 8.
- **Suggested change:** put the beginner core first and fold the depth ("PRO NOTE", "MORE FOR LARGER SHOWS ▾", "Go deeper"). Keep one new idea per page.
- **Size:** M per lab.

### Pattern 8 · The reading slot is too small, and trays cover what to watch (SHARED: rack layout, DockTray)
- **What a beginner experiences:** the lesson text lives in a narrow slot between the pinned display and the dock. An open tray then covers the readout the step tells them to watch, or the NEXT button.
- **Examples:**
  - Wave: "All the module's teaching text … scroll through a 228 px window (27 % of the screen)".
  - Foundations: "only about 6 lines of lesson text are visible".
  - Signal Detective: "about 230 px tall between the display and the dock".
  - Delay: the FDBK tray "covers DESIGNED RESPONSE, the exact place step 2 tells you to look", in a window "only ~150 px tall".
  - DJ: trays "cover the lower half of the lesson".
  - Sound Systems: "the FAULT tray from the last case was still open over the lower page and took the tap".
  - Digital module 7: "the dock stack covers the lower third of the screen".
- **Suggested change:**
  - Trays never cover the readout a step points to, or NEXT.
  - Trays close on scroll or on a tap outside, and a stray tap never resets work.
  - Give the reading well more room while reading (for example, shrink the display).
- **Size:** M. **SHARED:** DockTray, rack layout.

### Pattern 9 · Words and picture disagree; one control has several names
- **What a beginner experiences:** the text says one thing and the picture shows another, so they decide they misunderstood.
- **Examples:**
  - Flanger: "the text says 'evenly spaced notches'… on screen the notches look… NOT evenly spaced".
  - Compression: "Three different GR numbers disagree on one screen".
  - Amplitude: the rule "warmer = more", next to meters drawing 78 green-yellow and −3 orange.
  - Meter module 9: "a single point at center" while the picture shows a vertical line.
  - Wave module 11: "THE WRONG TOOL" improved the seat ("SUM −4.4 → −1.7 dB").
  - Sound Systems OPERATE 3: "✓ No stage clipping" while VERDICT reads CLIPPING.
  - DJ screen 6: "the learner sees '✓ fixed' next to 'OVER'".
- **One control, many names:**
  - LOW CUT/HPF, RATE/SWEEP, MIX/WET, FDBK/FEEDBACK, PRE/PRE-DLY/Pre-delay.
  - FOLD/MONO-FOLD/MONO CHECK, dips/notches, Lissajous/Goniometer.
  - SNAPSHOT/ELAPSED/SCROLL (Meter module 6), HOT INTO LIMITER/SQUASH (Signal Chain), INPUT GAIN/PREAMP (Gain).
  - MODULE/LESSON/CHAPTER/STAGE/STEP for the same thing (Mic Selection, Tuning, Drum Tuning, Miking).
- **Suggested change:** one name per control everywhere (card, dock, readout, check). A copy sweep per lab, then fix each mismatch.
- **Size:** S per item.

### Pattern 10 · Developer notes and all-caps disclaimers shown to learners
- **What a beginner experiences:** "install the newest dev build", "update the app to see it", or an all-caps "NOT A MEASUREMENT" line that reads as a warning.
- **Examples:**
  - Foundations module 10: "install the newest dev build to HEAR the drifting-phase demo".
  - Playground: "update the app to hear the full sound."
  - Compression, Gate and Limiter: "update the app to see it".
  - Binaural: "install the v7 build".
  - Sound Systems: the code word "OK · WRONGCONTENT".
  - Disclaimers: "TEACHING MODEL · … NOT A MEASUREMENT" (Equalizer), "SIMPLIFIED BS.1770-STYLE TEACHING MODEL" printed twice (Meter module 4).
- **Note:** G7 found the Oscillators and FM developer text is `__DEV__` only, so it is not in store builds. The others were not checked that way. Verify each before fixing.
- **Suggested change:** remove the developer lines from learner builds. Rewrite the disclaimers as one small plain sentence ("This picture is a model of the EQ, not a meter").
- **Size:** S. **SHARED** for the disclaimer badge.

### Pattern 11 · Two look-alike help icons, and an accuracy note in concept labs (SHARED: header)
- **What a beginner experiences:** two ⓘ icons side by side, or ? next to ⓘ. One explains the screen; the other opens app Help or an accuracy note about measuring tools. "A beginner cannot tell them apart."
- **Labs:** Signal Chain, Gain, Speaker, Room, Mastering, Amplifier, Equalizer, EQ Lab, Harmonics, the rack labs of G7, Sound Systems, DJ, Miking.
- **Related:** the accuracy chip shows in concept labs (Gain home, Beginning Mixing, the Miking calibration text). Your D37 rule keeps that chip to live tools and measuring labs only.
- **Suggested change:** label them in words ("HELP" / "EXPLAIN") or give the accuracy note its own glyph. Drop the accuracy chip from concept labs.
- **Size:** S. **SHARED:** header.

### Pattern 12 · Checks and pages that dead-end; the end says what is left, not what was learned (SHARED: check card, end screen)
- **What a beginner experiences:** "Check passed." and then nothing. Or an end screen listing "21 pages not done yet", with the same sentence on every row.
- **Examples:**
  - Effect labs: no next step after "Check passed." in 9 of 10 (G6b; only Binaural has FINISH).
  - G7 rack labs: no end page after CHECK (Oscillators, Noise, Harmonics, Autotune, Harmonograph, Bass).
  - Patchbay page 7: the jacks unlock only after the right answer.
  - Mic Selection lesson 9: a question with "nothing after it".
  - Mastering review: no button back to practice.
  - Game Audio end screen: "21 pages not done yet." A learner who did the work "feels they failed."
- **Suggested change:**
  - Every check ends with "FINISH · SEE WHAT'S LEFT".
  - End screens open with a "What you learned" recap, name the missing item on each row, say the shared sentence once, and suggest a next lab.
  - The Mastering end screen (each row names its missing piece) and the Drum Tuning WHAT'S LEFT are the models.
- **Size:** S (FINISH), M (recap slot). **SHARED.**

### Pattern 13 · No "start here" in the menus, hubs and lab homes
- **What a beginner experiences:** a long A→Z list that opens on vacuum tubes, or a home with 13 doors and the designed path last.
- **Examples:**
  - Advanced menu: "Nothing points a beginner to a first lab." "The first subject a newcomer sees is tubes and amplifier classes".
  - Microphone Selection sits last in Instruments & Recording, "after 128 miking lessons".
  - Cymatics: "Too many doors on the home, studios first; the designed path is last".
  - Most rack labs open on EXPLORE, while the plain explanation sits on LEARN.
  - Stage Plot: "the GUIDED TASK, the best path for a newcomer, is hidden behind 'SHOW THE STEPS' and labelled OPTIONAL".
  - Calculator Lab: "There is no 'start here' or 'most used'".
- **Suggested change:**
  - A START HERE tag on the first Fundamentals tile and on one lesson per Miking family. These are markers only, never locks.
  - Show subject descriptions; they exist in the data but appear only on the old category screen.
  - Rack labs open on LEARN on the first visit, or carry the strip "New here? Read LEARN first".
- **Size:** S-M. **SHARED:** Labs menu, hubs, rack frame.

### Pattern 14 · Tiny or overlapping tap targets
- **Examples:**
  - Sound Systems capstone 2: two needed positions sit 18 units apart under a 22-unit tap circle, so requirements 3 and 4 cannot both be done (confirmed in code by G5b).
  - DJ screen 24: power buttons "26 px wide by 35 px tall", each named only "OFF".
  - Cable Dressing stage 13: "small grey circles on a dark drawing".
  - Wave: speaker and listener are "~6 px marks with no labels".
  - Mic Selection: "12 photos with 9 px names".
  - Binaural and Stage Plot: objects stack on one spot.
- **Size:** S-L. Sound Systems capstone 2 is a blocker (see section 7).

### Smaller recurring patterns
- **Empty box or late drawing on arrival:** Foundations modules 6, 8 and 12; Mic modules 5 and 10; Wave module 8; Game Audio pages 5, 6, 7 and 12 ("a blank black panel for 1-3 s"); Miking placement steps ("2–9 s"). Fix: a "drawing…" placeholder. S, SHARED.
- **Hidden long-press help:** Tube ("every control long-presses for its own entry"), Foundations, Mic, Speaker, the G7 trays. Fix: a visible ⓘ in the open tray. S, SHARED.
- **An intro popup on every step:** Drum Tuning: "about 36 GOT IT taps for a full run". Envelope, Tuning and Speech too. Fix: a popup on the first step only, inline after that. S, SHARED.
- **Glossary term cards that contradict the lab:**
  - Connector Selection: "Each family fits its own jack and carries its own kind of signal".
  - Cable Dressing: "arranging cables so they are neat and tidy" vs the lab's "not 'make the wires look neat.'"
  - Noise: "everything you didn't want in the signal", then the lab plays noise on purpose.
  - Fix: S each.
- **House slang "ride" and "lane":** Foundations, Room, Wave, Sound Systems. Fix: "slide". S.
- **A red "Not Ready 0 / 100" on a brand-new project:** Pre-Production and Post-Production ("I'm already failing"). Fix: neutral grey until the first answer. S.

---

## 3. Shared-frame changes

"Labs helped" counts the labs named for that problem in the auditors' files. Where a change applies to every lab using a frame part, I say so.

| # | Change | Labs helped | Size |
|---|---|---|---|
| 1 | **Arrival order.** One popup at a time, at most two before the first touch. Merge the term card into the intro card. A popup appears before the page is tappable or waits for idle, and never takes a tap. It never opens over a tray or console. | 49 named (pattern 1 list) | M |
| 2 | **Sound Safety.** Honour KEEP SOUND OFF for the session. Make "appears once" true or reword it. Pin both buttons. Never open mid-tap. Optional (your call): show it on the first ▶, not on arrival. | 17 explicit (13 G6 sound labs, DJ, Beginning Mixing, Advanced Mixing, Modular); every lab with a ▶ | M |
| 3 | **Silent path.** A frame line "Sound off? You can still do every step"; "needs sound" tags on sound-only steps and goals; show stored values when sound is off; a "can't listen now" path for listening steps. | The pattern 3 list, about 30 labs | M |
| 4 | **Check card.** A per-option wrong reason or hint first, the answer after a second miss; balanced option lengths; "FINISH · SEE WHAT'S LEFT" after a pass. | 10 effect labs (G6b), 8 G7 rack labs, Mastering, EQ Lab, Smart Processors | M |
| 5 | **End screen ("What's left").** A "What you learned" recap; the missing item on each row; the shared sentence once; a next-lab suggestion; a state-aware WHERE TO START. | Every paged lab; named: Amplitude, Foundations, Mic, Wave, Digital, Patchbay, Beginning Mixing, Advanced Mixing, Mastering, Mixing Guides, Game Audio, Sound Systems, EQ Lab, Envelope, Tuning, Speech, FM, Modular | M |
| 6 | **Header icons.** Words or distinct glyphs for ? / ⓘ / the accuracy ⓘ; the accuracy chip removed from concept labs (D37). | 13 named (pattern 11) | S |
| 7 | **Bezel readouts.** Plain-word captions on first visit; an Hz/dB tap chip; keep labels at 390 by shortening values (within D36); fix "dBFS dBFS". | All rack labs; label drops named in Digital, Meter, Signal Chain, Gain, Wave, Game Audio, Sound Systems, Miking, Binaural | M |
| 8 | **DockTray.** Never cover the step's readout or NEXT; close on scroll or tap outside; a stray tap never resets work; two-line labels instead of truncation; the same key order on every page; one-shot keys do not stay lit; equal −/+ steps on every lane; larger end targets. | Delay, Phase, Digital, Wave, DJ, Sound Systems, Game Audio, Miking, EQ Lab (⚡ button), Connector Selection (⚡ button) | M |
| 9 | **Reading well.** More room for lesson text on a phone (for example, shrink the pinned display while reading). | Foundations, Wave, Mic, Speaker, Room, Signal Detective, Equalizer, Delay, Harmonics | M-L |
| 10 | **Screen guide and coach tip.** Hide "New: tap ⓘ" once the guide is used; never cover NEXT; hold until an intro animation ends; never open over an error. | Amplitude, Cable, Connector Selection, Cable Dressing, Vacuum Tube, Game Audio, Equalizer | S |
| 11 | **Rack labs open on LEARN** on the first visit, or show the strip "New here? Read LEARN first". Each LEARN guided step becomes a tap-to-try link into EXPLORE. | 13 G6 rack labs and 8 G7 rack labs | S (strip), M (links) |
| 12 | **Disclaimer badge.** One small plain sentence instead of all-caps "NOT A MEASUREMENT" lines. | Equalizer and all effect labs, Meter, Foundations, Wave, the G7 rack labs | S |
| 13 | **Drawing placeholder** ("drawing…") instead of an empty black box. | Foundations, Mic, Wave, Game Audio, Miking | S |
| 14 | **Visible help instead of long-press only.** | Vacuum Tube, Foundations, Mic, Speaker, G7 trays | S |
| 15 | **Intro popups on the first step only,** inline afterwards. | Drum Tuning, Envelope, Tuning, Speech | S |
| 16 | **Labs menu and hubs.** START HERE markers (never locks); subject descriptions shown; the ✓ done mark on tiles; Microphone Selection first in Instruments & Recording. | Labs menu, all 7 Miking hubs, Mic Selection | S-M |
| 17 | **One name per unit of progress** (module / lesson / chapter / step), and a sweep of the strip against your no-N-of-total rule. | Most paged labs | S |

---

## 4. Quick wins (small changes, high impact)

1. Make popups ignore taps until they are fully shown, and never open a popup on top of an open tray. Ends most "my tap did nothing" moments. (Shared, S)
2. Pin KEEP SOUND OFF where it can be seen without scrolling, and stop the sheet reopening after a choice. (Shared, S-M)
3. Add a silent first step to every WHERE TO START. (Per-lab copy, S each)
4. Add "FINISH · SEE WHAT'S LEFT" after "Check passed." in the effect labs and the G7 rack labs. (Shared, S)
5. Hide the "New: tap ⓘ" bubble once the guide has been used. (Shared, S)
6. Put words on the two header ⓘ icons, and drop the accuracy chip from concept labs (D37). (Shared, S)
7. Remove the developer lines: "install the newest dev build", "update the app to see it", "install the v7 build", "OK · WRONGCONTENT". (S)
8. Fix the Miking contents → Module 1 bug that turns NEXT into "FINISH · SEE WHAT'S LEFT" (reproduced by hand on Hi-Hat). (S-M)
9. Rewrite the three glossary term cards that contradict their labs (Connector Selection, Cable Dressing, Noise). (S)
10. Close the Sound Systems FAULT tray at the start of each case; it covers NEXT and lets a 0-probe answer count. (S)
11. Typos: the double full stops in every Sound Systems capstone ("One presenter..") and Miking ("cushioning.."); "an euphonium", "an ukulele"; "dBFS dBFS" in DJ; "FRET FRET" in Bass; "1 required decisions made" in Pre-Production. (S)
12. Labs menu: a START HERE tag on "Understanding Level & Amplitude", and Microphone Selection first in Instruments & Recording. (S)
13. Stage Plot: open the GUIDED TASK by default on a blank stage and drop "(OPTIONAL)"; make PLACE ON THE STAGE place the performer, or rename it GO TO THE STAGE. (S)
14. Game Audio:
    - page 11 key reads "SOURCES ▸ NONE" while a source is ticked;
    - page 21 says "Choose a TOPIC under the picture" when the key is in the dock;
    - page 19's FIX tray should open on a neutral tab. (S each)
15. Pre-Production and Post-Production: show a new project in neutral grey, not red "Not Ready 0 / 100". (S)
16. Equalizer: grey out GAIN and Q when the shape ignores them, as EQ Lab module 6 already does. (S)
17. End screens: print the shared sentence once, not once per row (Beginning Mixing printed it 13 times). (S)

---

## 5. What already works: copy it across

| Pattern | Where it lives | Copy to |
|---|---|---|
| A log that says what you would hear: "(not heard: sound is off)", and "Cannot play sound right now? The log and the rings show what your ears would hear." | Game Audio pages 1-2 | Every lab with ▶ |
| Reactive coaching box: "The fader is down and the output is quieter — but it is STILL distorted." | Gain Staging module 5 | Rack labs (G2 marks it a SHARED candidate) |
| Predict-before-you-act, with feedback that quotes the prediction | Miking M1 step 4; Patchbay pages 7 and 11; Cymatics; Tuning chapter 13 "decide before you open" | Checks everywhere |
| Wrong answers that name the misconception or the right control | Patchbay page 4; Phaser Q1/Q4; Reverb Q1; Flanger Q3; Connector Selection page 9 verdict rows | The shared check card |
| Hint first, answer later | Drum Tuning chapter 4 step 4 | The shared check card |
| "YOU ARE LOOKING AT:" captions on the display | Drum Tuning | Every rack display |
| "▸ Try it:" first-step line on every module | Envelope | Rack labs |
| On-picture labels (REAR MIC, FRONT SUB, AUDIENCE ↓) | Wave module 12 | Every Wave module |
| Grey out controls a choice does not use | EQ Lab module 6 | Equalizer, other racks |
| Live sentence feedback after each move | De-Esser (Smart Processors) pages 4, 5, 8; Distortion DRIVE caption | Rack labs |
| One framing question on every page, plus "NEXT: <title>" | Microphone Selection; Beginning Mixing | Paged labs |
| A recap that says what you now know | Foundations module 14 (13 lines); Sound Systems LEARN page 22 | End screen |
| End-screen rows that name the missing piece | Mastering end screen; Drum Tuning WHAT'S LEFT | The shared end screen |
| "Fixed." paragraphs that turn a fault into a rule | DJ Systems (every fault) | Sound Systems, Game Audio faults |
| Proof readouts in words: "WEDGE n HEARS", "CH1 R GETS", "VOICE IN" | Sound Systems ROUTE / BUILD; DJ | Signal-flow labs |
| Questions, not errors: "Performer 1 has no monitor. Is that intended?" | Stage Plot MONITORS | Production labs, forms |
| "WHAT THIS PLAN IS STILL MISSING" plus NEXT OUTSTANDING | Pre-Production | Post-Production, Stage Plot |
| A drawing with live ✓/⚠/△ tags, plus reasons | Microphone Selection lesson 3 | Placement pages |
| Sentence verdicts and honest refusals: "NOT A REFLECTION…", "8 is not a prime" | Calculator Lab | All calculators (e.g. the AWG message) |
| "Nothing is lost and there is no score" | Vacuum Tube, Mic Selection, Room ("No score, on purpose: a room is never 'solved', it is understood") | All checks |
| Tray choices with a one-line meaning | Equalizer TYPE; Meter module 5 ("chase grounding and cables, not EQ"); Oscillators WAVE | All trays |
| "WORDS YOU WILL HEAR" box; MID (SHARED) / SIDE (DIFF) glossed labels | Patchbay page 9; Meter module 9 | Jargon-heavy pages |
| A mid-lab recap with a map of part two | Patchbay page 13 | Long labs (Sound Systems LEARN, Tuning, Game Audio) |
| Start-here page with a journey map and a "New to miking / I already mic" fork | Miking lesson step 1 | Other long labs |

---

## 6. Per lab

Order follows the app's menu: the Labs menu first, then Sound, Acoustics, Signal, Mixing, Production, Live Sound, Game Audio, Equalization, Dynamics, Time Effects, Modulation, Distortion, Phase, Synthesis, Stereo & Spatial, Pitch & Tuning, Visualization, Instruments & Recording, Voice, Electronics, Ear Training, Calculator Lab.

"Overwhelm" is the median of the auditors' page scores (ranges counted at their midpoint).

### Labs menu (fork, Fundamentals, Advanced)
- **Overwhelm:** 2 (scores 1, 2, 3).
- **Journey:** The fork is calm and a beginner rightly picks Fundamentals, whose first tile is the right first lab. Nothing says so. The Advanced menu is about seven phone screens of A→Z, starting with tubes. The Greek family names hide where "my guitar" lives.
- **Top problems:**
  1. No start-here anywhere.
  2. 34 of 65 tile blurbs are cut at three lines, and they are lists of terms.
  3. Subject descriptions and the ✓ exist only on the old category screen.
- **Strengths:**
  1. The fork's reason to start: "Required for every Academy certificate".
  2. The Sound → Acoustics → Signal order.
- **First 30 s:** "New to audio? Start with the first tile — Understanding Level & Amplitude — then Foundations of Sound." Add a START HERE tag and a one-line description under each subject.
- **File:** G8_LabsMenu.md

### SOUND

#### Understanding Level & Amplitude
- **Overwhelm:** 2 (3, 1).
- **Journey:** The colour key ("blue = less, red = more") lands in seconds, and the check is kind. In between, six untouchable chart cards form a wall. The burst cannot be seen, and the meter colours seem to break the rule just taught.
- **Top problems:**
  1. No "look for" line per chart. The good lines are hidden behind ⓘ.
  2. The burst is invisible at 390 wide.
  3. Meter colours contradict "warmer = more".
- **Strengths:**
  1. The colour bar with its quiet/loud rows.
  2. "Do not worry about what those tools are yet".
- **First 30 s:** one popup only ("This lab teaches one thing: the colour key used on every screen"). One "Look for:" line per card, and the burst drawn red.
- **File:** G1_AmplitudeLab.md

#### Foundations of Sound
- **Overwhelm:** 2-3 (module 7 is 1 before answering and 5 after).
- **Journey:** Modules 1-6 are a genuinely good beginner course: one picture, one idea, one slider. Module 7 is "the cliff", a two-ruler, fifteen-label display. After it, symbols pile up in a slot about six lines tall. The 13-line recap at the end is the best summary in G1's set.
- **Top problems:**
  1. Module 7 is too dense, and its GOAL box gives away the prediction.
  2. dB, Hz, 8ve, F0 and λ are never explained ("dB (still never defined in plain words in this course)").
  3. Developer text in module 10, and module 11 asks for PLAY with no PLAY key.
- **Strengths:**
  1. One idea per module, with hints that point back to the picture.
  2. The "YOU BUILT THE WHOLE MODEL" recap.
- **First 30 s:** "14 short modules. Each shows ONE idea about sound… Start: watch the pink dots — they never leave home." Module 1 shows only the air picture and PITCH as LOW/MID/HIGH.
- **File:** G1_FoundationsCourse.md

#### Sound Playground
- **Overwhelm:** 4.
- **Journey:** Opened straight from the menu, it is a synthesizer with about 25 jargon choices. The intro card's two concrete steps rescue the first minute, but then there is no path. It suits someone who has finished the course.
- **Top problems:**
  1. It does not say it comes after Foundations of Sound.
  2. About 17 SOURCE and 10 FX options at once.
  3. Its biggest instruction needs sound, and it shows developer text.
- **Strengths:**
  1. TRY THIS with ↻ ANOTHER.
  2. Every change ripples through all three views.
- **First 30 s:** "This is the Foundations of Sound toolbox… If you have not done that lab yet, start there." Show only FREQ, LEVEL and four wave shapes; put "More controls" behind a fold.
- **File:** G1_FoundationsPlayground.md

#### Microphone Principles
- **Overwhelm:** 2 (module 1 is 5).
- **Journey:** It opens on its hardest page: a 15-label capsule cutaway and an equation, with nothing to touch. Modules 2-9 are single hands-on demos. Dragging the speaker into the null is the best moment.
- **Top problems:**
  1. Module 1 is intimidating.
  2. The DISTANCE slider runs the opposite way in modules 3 and 4.
  3. Words are used before they are defined (monitor wedge, omni, ports).
- **Strengths:**
  1. "DRAG THE SPEAKER — ANYWHERE" with NULL ≤ −26 dB.
  2. Trays that explain the chosen option.
- **First 30 s:** open on pickup patterns ("A microphone hears some directions better than others. Drag the speaker around the mic…"). Move the capsule cutaway to the end as "For the curious".
- **File:** G1_MicLab.md

### ACOUSTICS

#### Wave Physics Laboratory
- **Overwhelm:** 3-4 (home and modules 1-6 mostly 4; modules 7-16 mostly 3 on screen per G1b).
- **Journey:** The home is a calm but ungrouped list of physics titles, and each module is "written for an acoustics student". On screen, modules 7-16 are "much friendlier than their text": one striking picture reacts to one tap. The trouble is below the picture: a 228 px reading slot, number tiles, and 6 px unlabelled marks.
- **Top problems:**
  1. The 228 px reading letterbox.
  2. Pictures without words (no labels, no heat-map key, an unmarked side view).
  3. The cause is drawn tiny and the effect huge; readouts are codes ("LOSS/BNC"); RT60 is used from module 2 but defined in module 15.
- **Strengths:**
  1. One big changing picture per module.
  2. Check hints that send the eye to the exact place; capstones "the best assessment design in my seven labs".
- **First 30 s:** "Sound in rooms, in 4 parts." In each module, name every object on the picture and give one sentence plus one button (module 7: "A wall bounces a copy of the voice back into the mic. Press MIC →").
- **Files:** G1_WaveLab.md, G1b_WaveLab.md (G1b wins for modules 7-16)

#### Speaker Placement & Coverage
- **Overwhelm:** 2.
- **Journey:** "The friendliest lab in my set." Half the seats are dark, there is one obvious fix, and the flashlight analogy works. Module 2 silently switches to a side view, and module 3 defines words after they were used.
- **Top problems:**
  1. The unlabelled side view.
  2. The vocabulary comes last.
  3. Tapping SPKR 2 silently changes which speaker the sliders move.
- **Strengths:**
  1. "A loudspeaker works like a flashlight for sound."
  2. READING THE COLORS in plain words.
- **First 30 s:** "A speaker is a flashlight for sound. Dark seats can't hear well. Your job: light up every seat."
- **File:** G1_SpeakerLab.md

#### Room Design & Monitoring
- **Overwhelm:** 3.
- **Journey:** It opens with a text page about kinds of numbers and hearing safety. From module 2 it is the most practical lab: a floor plan of "my room", a bass map, ABSORB NEXT. The Review page buries its advice under tables.
- **Top problems:**
  1. Module 1 has no picture ("terms and conditions").
  2. Shorthand: "RATIO S:M:L", "(1,0,0) AXIAL"; RT60 is never defined.
  3. The Review order, plus "6 untreated" vs "2 early" reflections.
- **Strengths:**
  1. The floor plan the learner builds and drags.
  2. "No score, on purpose: a room is never 'solved', it is understood."
- **First 30 s:** open on the floor plan: "Build a model of your room in 5 steps: size → speakers → where you sit → panels → your report". The Review page opens on TRY FIRST.
- **File:** G1_RoomDesignLab.md

### SIGNAL

#### Digital Audio Systems
- **Overwhelm:** 4.
- **Journey:** Every module starts well, with one first action and visible feedback. Then 2-3 extra lessons pile up in all-caps captions full of abbreviations. The learner finishes step 1 "feeling smart and then hits a wall".
- **Top problems:**
  1. Extra lessons stacked in each module.
  2. Abbreviations ("FS" means two things).
  3. Readout labels drop exactly where the card points.
- **Strengths:**
  1. Intro card with WHAT YOU'RE LEARNING / WHERE TO START.
  2. Feedback in words ("ALIAS ≈ 18 kHz — THE DOTS FIT THIS"); MYTH/REALITY cards.
- **First 30 s:** "Your voice is air. A microphone turns it into electricity… 8 short steps. Start with Step 1." One START button, and everything after the MYTH card under "More detail".
- **File:** G2_DigitalLab.md

#### Visual Audio Analysis (Meter Lab)
- **Overwhelm:** 2 (Waterfall 5).
- **Journey:** A calm home with the right goal ("Learn to READ the meters"). Most modules have one question and one control, with verdicts a silent learner can read. Loudness and Waterfall are the hard pages.
- **Top problems:**
  1. Labels vanish at phone width.
  2. Numbers disagree on one screen ("PK 5.5" vs "PEAK +0.0").
  3. Waterfall and Loudness start with everything visible (6 keys).
- **Strengths:**
  1. One-line tray meanings with a real action.
  2. Verdict rows that light up; the "READ THE AXES FIRST" fold.
- **First 30 s:** "Every meter answers one question about a sound. In 11 short pages you will learn which question each one answers…" Each row carries its question ("Peak — Will it clip?").
- **File:** G2_MeterLab.md

#### Signal Chain Builder
- **Overwhelm:** 3 (arrival 4).
- **Journey:** The rack says "effects in a row, on or off" at once. But the first minute is four popups deep, and with sound off, ▶ shows nothing and nothing explains why.
- **Top problems:**
  1. A sound-off dead end.
  2. Four interruptions before the lab.
  3. Abbreviated unit names, and the lab opens on EXPLORE.
- **Strengths:**
  1. A realistic rack with settings printed under each unit.
  2. Named scenarios.
- **First 30 s:** "Sound goes through these boxes left to right, like guitar pedals… Turn on DIST (distortion) and LIMIT (a loudness ceiling)." With sound off, show the GR labelled "what the limiter would do".
- **File:** G2_SignalChainLab.md

#### Signal Detective
- **Overwhelm:** 2.
- **Journey:** "The right ending for the lab": an honest quiz that rewards reading the axes. The problems are mechanical.
- **Top problems:**
  1. The hint and NEXT sit below the fold in a ~230 px slot.
  2. The scroll position carries over to the next case.
  3. The display overlay gives the answer away ("CREST 4.7 dB · DC +0.35").
- **Strengths:**
  1. Wrong answers teach ("The horizontal axis here is TIME").
  2. Only two dock keys.
- **First 30 s:** "No labels here. Look at the picture: what runs left to right? what runs up? Then pick the meter."
- **File:** G2_MeterModule_detective.md

#### Cable & Connector Fundamentals
- **Overwhelm:** 3.
- **Journey:** It starts well with the "what travels?" quiz, and lessons 4, 8 and 10 are some of the best learning in the app. Lessons 2, 3, 5 and 6 read like reference manuals, and most beginners would stall in lesson 3.
- **Top problems:**
  1. Reference-card density.
  2. Core words never defined ("open" sounds like "the way is open").
  3. Two NEXT buttons, mixed counters, and "0 UNITS CLEARED" unexplained.
- **Strengths:**
  1. Lesson 4's "THE HONEST RESULT OF CHOOSING WRONG".
  2. Drawings to scale.
- **First 30 s:** show a mic, a guitar, a speaker and a wall socket: cables carry a whisper, a shout, data or mains, so ask "what travels here?". The glossary card waits until lesson 2.
- **File:** G3_CableLab.md

#### Audio Connectors & Cable Selection
- **Overwhelm:** 2.
- **Journey:** The friendlier cable lab: "○ goal" pills define done, and four questions (FIT · SIGNAL · CONSTRUCTION · SAFETY) double as the verdict. It stumbles on words used early and a glossary card that teaches the misconception.
- **Top problems:**
  1. The glossary card contradicts the lab.
  2. "Balanced" is explained only on page 8.
  3. Silent red marks on page 6, and page 15's answers are all FALSE.
- **Strengths:**
  1. Verdict rows that show which reasoning step failed.
  2. Real photos next to drawings.
- **First 30 s:** the stripped-cable photo with "ask four questions — does it fit, what signal, what cable, is it safe?". Say this is the "choosing" lab and Fundamentals is the "naming" lab.
- **File:** G3_ConnectorSelectLab.md

#### Cable Dressing & Installation
- **Overwhelm:** 3.
- **Journey:** The most professional feel of the three: drawn scenes, scored verdicts, a live twist meter. From stage 6, trade vocabulary and long colour-key paragraphs pile up.
- **Top problems:**
  1. Legend paragraphs above the drawings, and the colour key changes on stage 8.
  2. Feedback out of sight, or answers given away by card titles.
  3. Unglossed trade words, plus a contradicting glossary card.
- **Strengths:**
  1. Every option scored ("it finished LAST at 62/100").
  2. The over-under coil with its TWIST meter; problem before rule.
- **First 30 s:** stage 1's four close-ups, untitled: "Only one would pass a professional inspection — and it is not the prettiest. Which one?"
- **File:** G3_CableInstallLab.md

#### Patchbay Signal Flow & Normalling
- **Overwhelm:** 2.
- **Journey:** "The most carefully taught lab of my six": one rule built up one idea per page, a recap at page 13, the same mantra at the end. The weak spots are page 1 with no picture, 23 pages with no resting point, and runs of text-only quiz pages.
- **Top problems:**
  1. No picture of a patchbay on page 1.
  2. Page 7's hint names a "top jack" that is not there, and the jacks unlock only after the right answer.
  3. "15 pages still to go" without saying what is missing.
- **Strengths:**
  1. Predict-before-patching.
  2. Self-ticking task chips; "WORDS YOU WILL HEAR".
- **First 30 s:** show the 8-pair bay first: "This is a patchbay: every cable in a studio ends here. Top row: sound comes OUT of gear. Bottom row: sound goes IN." Say there are two parts and they can stop after part one.
- **File:** G2_PatchbayLab.md

#### Gain Staging
- **Overwhelm:** 2.
- **Journey:** "The most beginner-friendly lab of my six": one picture, 1-2 controls, one idea per page. Module 5's coaching box is the model for other labs.
- **Top problems:**
  1. Gain (the knob) vs level (the result) is never named.
  2. One control has three names, and status words point at the wrong problem.
  3. Tiny dots in the 7-stage modules.
- **Strengths:**
  1. Module 5 coaching.
  2. The module 8 "?" mystery.
- **First 30 s:** "Sound travels through several boxes before it reaches a speaker. Each box needs the right amount: too little and you hear hiss, too much and it crunches." Module 1: "Push SOURCE up until a box turns red."
- **File:** G2_GainLabHome.md

### MIXING

#### Beginning Mixing
- **Overwhelm:** 3.
- **Journey:** A friendly rhythm on every page: idea, cards, picture, a check that explains, goal chips, a named NEXT. The weight is 4-8 new terms per opening paragraph, and pictures below the controls on a phone. With sound off, about half the goals are unreachable.
- **Top problems:**
  1. Jargon in the first lines ("Eight new terms at once").
  2. The picture sits below the buttons that change it.
  3. Sound-only feedback with no silent fallback.
- **Strengths:**
  1. Wrong-answer reasons.
  2. Page 12, "a model for the lab".
- **First 30 s:** skip the "bring in a pro" popup on arrival (keep it as a link). One card that names what the 16 short pages cover, worded as knowledge, not skills. Show the mantra once.
- **File:** G4_BeginningMixingLab.md

#### Advanced Mixing
- **Overwhelm:** 3 for a hobbyist; "a wall (overwhelm 4-5 on most pages)" for a total beginner.
- **Journey:** A real step up with the same rhythm. Phase, Stems, Diagnosis and Aux Routing work silently. Most pages carry two lessons, and about a third of the goals need sound.
- **Top problems:**
  1. Two lessons per page.
  2. Dense opening paragraphs with nested brackets.
  3. Drawings that start empty or BYPASSED and "look broken".
- **Strengths:**
  1. Predict-then-reveal.
  2. One 8-track session throughout; the drawing above the controls on page 5.
- **First 30 s:** say it follows Beginning Mixing and what the 20 short pages cover. On page 2: "Page 20 will show these back to you."
- **File:** G4_AdvancedMixingLab.md

#### Mastering Lab
- **Overwhelm:** 2 (two 5s, on the LISTEN steps).
- **Journey:** It opens with "the single best beginner picture" in G4's labs: many mix lines merging into one file. A calm five-beat rhythm repeats, and the EXPLORE steps work silently. The LISTEN steps are cockpits that teach little without sound.
- **Top problems:**
  1. The LISTEN cockpits.
  2. Names drift between intro, list and readout.
  3. A generic, identical ✗ for every wrong option.
- **Strengths:**
  1. The merge picture with CAN / CANNOT.
  2. One-control EXPLORE steps with plain one-liners ("Huge peak, tiny average").
- **First 30 s:** merge the glossary popup into the intro card: "Mastering is the last step before release: one finished song file in, one release-ready file out." Then "Drag the gold STAGE handle".
- **File:** G4_MasteringLab.md

#### Mixing Guides
- **Overwhelm:** 2 on the hub; 4-5 inside a guide.
- **Journey:** The hub is inviting. The two top lines of each guide (what the audience expects, MIX PRIORITY #1) are "the best beginner content in the whole mixing area". Below them, each guide is a 2,186-3,058-word reference.
- **Top problems:**
  1. AT A GLANCE opens with "LAeq,15min" and "LUFS-I".
  2. No signposting of core vs reference sections.
  3. English studio slang is not glossed (808, pocket), though non-English terms are. Plus "MODULE n / 50".
- **Strengths:**
  1. MIX PRIORITY #1.
  2. Glossed non-English terms; search by country.
- **First 30 s:** "Pick a music style… New to mixing? Open Pop first." In each guide, a three-item "Start here" (Balance & blend, Common mistakes, Reference recordings). The world map stays as it is.
- **File:** G4_MixingGuides.md

### PRODUCTION

#### Audio Pre-Production
- **Overwhelm:** 4.
- **Journey:** A calm start, and NEXT OUTSTANDING guides well. But a new project opens with a red "Not Ready 0 / 100", and the stages are long phone forms. The broken-plan exercises are the most motivating part.
- **Top problems:**
  1. Long single-scroll stages (33 questions on stage 1).
  2. Up to three warning boxes stacked at the top.
  3. Exercises open the plain stage with no reminder of the exercise goal.
- **Strengths:**
  1. WHAT THIS PLAN IS STILL MISSING.
  2. The BLOCKED state for safety.
- **First 30 s:** "Plan a recording or a show before anyone presses record." A new project in neutral grey, and sub-steps inside each stage.
- **File:** G4_PreProdLab.md

#### Audio Post-Production
- **Overwhelm:** 3.
- **Journey:** Better organised than Pre-Production, with eight stages in three chapters and a memorable WHY THIS MATTERS. New problems: steps that depend on another stage, and a percentage that can drop.
- **Top problems:**
  1. Cross-stage dependencies (+0.4 dBTP "produced NO finding").
  2. Long forms with up to 30 Not applicable buttons.
  3. Podcast scenarios under a Live project; the percentage falls 33 % → 31 %.
- **Strengths:**
  1. The chapters plus WHY THIS MATTERS.
  2. Honest options ("I am assuming the usual").
- **First 30 s:** "You've been handed a folder of recordings… three chapters… follow NEXT OUTSTANDING."
- **File:** G4_PostProdLab.md

### LIVE SOUND

#### Sound Systems Lab
- **Overwhelm:** LEARN 4; BUILD peaks at 5 inside the CONSOLE panels; ROUTE 2.5-3; OPERATE 3; TROUBLESHOOT 2-3 (only 2 scores given).
- **Journey:** LEARN opens well, but from chapter 5 the formulas come before the plain idea, and G5 expects a stall "between pages 8 and 13". ROUTE is the gentlest and most complete practice. TROUBLESHOOT is the most motivating, but "solved" can be reached without the thinking. BUILD is the most ambitious and the most fragile on a phone.
- **Top problems:**
  1. Jargon and formulas before the idea ("Ztot = 1 ÷ Σ(1/Zi)").
  2. Feedback that says "fine" when it isn't (wrong links get a green ✓ and LIVE).
  3. "Any order" with no recommended path; the intro card arrives late and lands on what the learner opened.
- **Strengths:**
  1. Memorable rules ("Insert = through. Send = copy. Assignment = where the main path goes.").
  2. Mistakes explained in physical words, and "HEARS" proof readouts.
- **First 30 s:** one hub card: "SOURCE → STAGE INPUT → MIXER → PROCESSING → AMPLIFIER → SPEAKER → LISTENER. Start with LEARN." The other modes say "best after LEARN chapter n" as a hint, never a lock.
- **Files:** G5_SoundSystemsLab.md, G5b_SoundSystemsLab.md, G5c_SoundSystemsLab.md (G5c wins)

#### DJ Systems Lab
- **Overwhelm:** 3.5.
- **Journey:** A realistic booth; "two decks and a mixer" is grasped at once, and screen 2's "four jobs" idea is strong. The weight comes from the frame: a fault card on every screen from screen 1, layout paragraphs before the idea, and dBFS targets. Hands-on, every fault can be solved with patience, and each "Fixed." line teaches a rule.
- **Top problems:**
  1. Two jobs per screen from screen 1.
  2. Late popups take taps, and trays cover the lesson.
  3. Goals stay silent while the deck is stopped; the first step disagrees with the intro card.
- **Strengths:**
  1. The booth drawing teaches by sight.
  2. "Fixed." paragraphs, readouts in words, and the four-part debrief on screen 24.
- **First 30 s:** a caption over the booth: "Every DJ setup does four jobs: PLAY the music, MIX it, let YOU hear the next track, let the ROOM hear the mix." Start fault cards from screen 3, and say once that sound is optional.
- **Fault result (reconciled):**
  - 23 of 25 fault cards fixed with a "Fixed." line.
  - Screen 6: goal ticked, fix not confirmed.
  - Screen 1: fault never started.
  - Screen 24's clean-transition goal was not passed.
- **Files:** G5_DJSystemsLab.md, G5b_DJSystemsLab.md, G5c_DJSystemsLab.md

#### Stage Plot and Channel Designer (NEW)
- **Overwhelm:** 3 (library 2; SETUP 4; STAGE 3; INPUTS 4; MONITORS 3; EXPORT 3; Four-piece example 4).
- **Screens walked:** 7. Only 1 of the 6 examples was opened, and the file gives no reason.
- **Journey, screen by screen:**
  - **Library:** calm, and the purpose sentence is clear, but it hides behind ⓘ. Nothing says Blank stage is the learning path.
  - **SETUP:** about 25 fields, nothing folded. The GUIDED TASK, the best path for a newcomer, is closed and marked OPTIONAL.
  - **STAGE:** an excellent orientation frame ("stage right is on your left"), and an add flow that teaches "a symbol is not an input". But the intro card's advice creates a duplicate performer, and new objects stack on one spot.
  - **INPUTS:** the right definitions, but every advanced section shows for a one-row list.
  - **MONITORS:** "Is that intended?" question cards, among the best forms in the app.
  - **EXPORT:** a sensible order with REVIEW → GO TO ›. Completion needs a real download, print or share.
  - **Four-piece example:** a professional plot whose numbers and M-codes are not in the KEY, with no first step.
- **Top problems:**
  1. The guided path is hidden and labelled optional.
  2. Full professional depth on day one.
  3. Hand-offs that mislead: PLACE ON THE STAGE does not place, and the STAGE card's advice duplicates the performer.
  4. Completion needs a real file: "a learner who will not or cannot download a file (school device, no printer) cannot finish."
  5. The example has no lesson.
- **Strengths:**
  1. "What does this symbol stand for?" with "Nothing is added until you say so."
  2. Plain help at the point of need ("A click is a metronome that only the players hear.").
  3. Questions, not errors ("Performer 1 has no monitor. Is that intended?"), and the OBJECTS ON THE STAGE list that needs no drag.
- **First 30 s:** show the purpose openly in the library with a small picture of a finished plot ("A stage plot tells the venue's sound engineer who stands where, what to plug in, and what each performer needs to hear"). Offer one recommended button, "START FROM A BLANK STAGE (5 guided steps)". Pin the five steps as a checklist on every tab. Keep advanced sections folded until a step needs them.
- **Before release, the auditor's list:**
  - Open the guided task by default and drop "(OPTIONAL)".
  - Fold THE GIG, TECHNICAL CONTACT, REVISION AND STATUS, STAGE SIZE and NOTES.
  - Make PLACE ON THE STAGE place.
  - Add a legend for the "? 1" markers.
  - Place new objects at a free spot; default "Who plays or sings it" to the existing performer.
  - Close the palette after an add, so the result is visible.
  - Name a monitor mix after its performer.
  - Make EXPORT's card button names match the screen.
  - Add a KEY legend for the white numbers and M-codes on examples.
  - Say in the library what each example teaches.
  - Whether a preview should count as completion is your credit decision.
- **File:** G5_StagePlotLab.md

### GAME AUDIO

#### Game Audio Lab (NEW)
- **Overwhelm:** 3 (range 2-5; page 13 Output formats is 5).
- **Pages:** 22 + end screen. G5b re-walked pages 17 and 19 hands-on.
- **Journey:**
  - Pages 1-7 and 15-19 work well: one idea, a few keys, and an activity log that answers every press in plain sentences, even with sound off.
  - Pages 8, 10, 12, 13 and 17 pile up 4-7 new terms, tool brand names and dB/Hz maths. A beginner starts skimming at page 8 and is most likely to quit at page 13 ("the longest word list, and the experience depends on hearing").
  - Page 20 is a superb map of the real tools, but it drops the five-step format and ends in six recall checks.
  - G5b: pages 17 (voice budget: all 3 goals, check passed) and 19 (five faults, FIXED 5) work fully with sound off.
  - The end screen says what is left, never what was learned.
- **Top problems:**
  1. Too many new words per page (chip rows of 5-7 terms; Wwise/FMOD/RTPC in page 8's step 1).
  2. Readouts used long before they are explained: "the VOICES readout has been on every page since page 1" (defined on page 17); "take" defined on page 9; dB never.
  3. Two lessons on one page (pages 4 and 10), multi-action step 3s, and three different walking controls on pages 10-12; the dock order changes on page 18.
  4. Page 13 is a quit point.
  5. The FIX tray pre-selects the answer (page 19), and the end screen discourages ("21 pages not done yet.").
- **Strengths:**
  1. The log and readouts teach without sound ("(not heard: sound is off)"; "the SAME instance i12 changes, nothing restarts").
  2. Practice ticks on real actions, faults to find, and hints to ask for (the page 6 door fault; page 19 baseline before faults).
  3. Pictures that show the rule: MIN/MAX rings, the camera-as-listener icon, DUCK tags.
- **First 30 s:**
  - Draw the picture with its labels already on, and one caption: "This is a game world from above. YOU are the player. A game does not play one soundtrack: it ASKS for sounds…"
  - One instruction: "Set LEVEL low, then press SCENE."
  - Hide VOICES, dB and the strip's numbers until the pages that teach them; add "voice = one sound playing right now".
  - Move page 21's "two kinds of knowledge" box to page 1 as the reason to care.
- **Before release, the auditor's list:**
  - Lab-wide:
    - Explain voice, take, virtual, dB, pan, bar, SOLO, bus and ducking where they first appear.
    - Cut chip rows to the 2-4 words each page uses.
    - Move tool and pro notes (pages 7, 8, 12, 13, 16, 17) into a "PRO NOTE" fold.
    - Split multi-action steps into a/b/c.
    - One walking control across pages 10-12.
    - Keep the same dock key order on every page.
  - Page fixes (S):
    - Page 11 "SOURCES ▸ NONE".
    - Page 21's pointer.
    - Page 17: "impact × 4" vs "TAKEN 9"; BUDGET steps of 4 ("16 → 12 → 8"); add a "Kept: ALARM (protected)" line.
    - Page 19: open the FIX tray on a neutral tab; every fault needs a re-run before it counts (today faults 1-4 do not, fault 5 does); fault 5's card says to press ■ STOP first.
    - Page 22: say on the page that goals reset when you leave; one activity log, not two.
  - Frame:
    - Draw the picture before the intro card.
    - A "drawing the scene…" placeholder for the 1-3 s blank panel.
    - Dock labels must not truncate ("WIND F…").
  - End screen: a "You learned" recap, and say per page what is missing, in words, not as N of total.
- **Files:** G5_GameAudioLab.md, G5b_GameAudioLab.md

### EQUALIZATION

#### Equalizer
- **Overwhelm:** 3 (EXPLORE 4).
- **Journey:** A kind one-line card, then a stack of popups before any touch. After that, the FREQ fader and trays are friendly and the picture answers every move. The readouts are bare units, the "aha" needs sound, and LEARN sits one tab to the left of where the lab opens.
- **Top problems:**
  1. Three popups before the first touch.
  2. Bare-unit readouts, and GAIN/Q stay lit when the shape ignores them.
  3. The first step needs sound, and no "next" signpost.
- **Strengths:**
  1. The IN → EQ → OUT picture with dots on the curve.
  2. Trays with one line per TYPE; LEARN's GUIDED STEPS (NOTICE / WHY).
- **First 30 s:** "The tone knobs of audio… In this lab you control ONE of those knobs." Then "Drag me. Watch the bump move along the green line."
- **File:** G6_EqLab.md (it also defines the shared effects frame)

#### EQ Lab (home + 15 modules)
- **Overwhelm:** 3.
- **Journey:** The calmest menu in G6's set, with a numbered path. But the first tap leads to an unannounced colour primer, then the most technical module. Modules 2-6 are true beginner pages, and the TRAIN pages restore confidence.
- **Top problems:**
  1. Module 1 is harder than module 2, and the primer detour is unannounced.
  2. Jargon spikes in modules 7, 10 and 11.
  3. The check gives answers away by length.
- **Strengths:**
  1. Module 2 "Why We Use EQ" ("Model page").
  2. Module 6 greys out unused controls.
- **First 30 s:** "15 short lessons. Start at 1 — about 2 minutes each." Make "Why We Use EQ" lesson 1.
- **File:** G6_EqLabHome.md

### DYNAMICS

#### Compression
- **Overwhelm:** 3.
- **Journey:** A strong first sentence ("makes loud parts quieter") is buried under three popups and a five-term card. The picture responds silently, but nothing points a silent learner to it.
- **Top problems:**
  1. Three GR numbers disagree on one screen, plus "update the app to see it".
  2. The popup stack.
  3. Studio slang in the trays ("glue", "squash").
- **Strengths:**
  1. The dotted "untouched" outline against the solid OUT spike.
  2. The LEARN bridge: "EQ changed which frequencies are loud; compression changes when the sound is loud."
- **First 30 s:** "Compressor — an automatic hand on the volume knob." Then "Drag THRESH down."
- **File:** G6_CompressionLab.md

#### Gate / Expander
- **Overwhelm:** 4.
- **Journey:** A jargon title, then the safety sheet again. The default source hides three of the five controls. LEARN's first paragraph explains the gate beautifully, then buries it under six absent controls.
- **Top problems:**
  1. The card leads with "Downward expansion".
  2. The default CLICK source makes RANGE/HOLD/RELEASE look dead.
  3. One check question's feedback answers the next question.
- **Strengths:**
  1. "a gate works on the other side of the line".
  2. RANGE tray consequences.
- **First 30 s:** "Noise gate — it mutes the gaps." Default source: PINK NOISE bursts.
- **Files:** G6_GateLab.md, G6b_GateLab.md

#### Limiter
- **Overwhelm:** 4.
- **Journey:** The simplest lab to operate (three keys), but the heaviest arrival: a seven-sentence card and a grey block for a picture. The promised GR number never appears.
- **Top problems:**
  1. An overlong card with no "do Compression first" pointer.
  2. GR stays "— dB".
  3. Wrong-answer text states the number.
- **Strengths:**
  1. The three-key dock.
  2. "GR never moves… it is doing exactly nothing, which is fine".
- **First 30 s:** "Limiter — a ceiling for loudness." A drum-hit wave under a dashed CEILING line: "Drag it down."
- **Files:** G6_LimiterLab.md, G6b_LimiterLab.md

#### Smart Processors Lab (De-Esser)
- **Overwhelm:** 2.
- **Journey:** "The most beginner-friendly lab in my set": it starts from a phrase anyone can say, adds one idea per page, gives live words after each move and does not need sound. The one wall is page 3.
- **Top problems:**
  1. Page 3 shows split-band four pages early.
  2. The hub check sits right under the lab card.
  3. Leftover jargon ("hard-knee", "gain computer").
- **Strengths:**
  1. The letter-by-letter strip.
  2. Feedback sentences after each move; page 9's "what to do next" links.
- **First 30 s:** "De-esser — it softens the hissy S sounds in a voice, and only those." START ›.
- **File:** G6_SmartProcessorsLab.md

### TIME EFFECTS

#### Delay
- **Overwhelm:** 3.
- **Journey:** The best-known topic ("echo") with a perfect card. But the default picture is a barcode of overlapping echoes. FDBK 0 % gives the ideal silent picture.
- **Top problems:**
  1. A busy default picture.
  2. Three different tempos across the lab (90, 160 and 120 BPM).
  3. WHERE TO START is formula-first; the FDBK tray covers the readout the step points to.
- **Strengths:**
  1. The intro card.
  2. "spacing = delay time, shrinking height = feedback".
- **First 30 s:** open at FDBK 0 %: "Each grey click comes back once, in blue — that's the echo."
- **Files:** G6_DelayLab.md, G6b_DelayLab.md

#### Reverb
- **Overwhelm:** 3.
- **Journey:** A friendly "clap in a hall" card, then the most code-worded rack. G6b calls the check "the best-written check in my set", but half of it repeats EXPLORE's cards.
- **Top problems:**
  1. The main control is named "RT60".
  2. A dB view as the only picture.
  3. The pre-delay change is "a shift of only a few pixels".
- **Strengths:**
  1. "thousands of reflections arriving so close together…".
  2. Q1's feedback, which names the control each idea belongs to.
- **First 30 s:** a hand-clap spike with a fading cloud; "small room → big hall" on DECAY.
- **Files:** G6_ReverbLab.md, G6b_ReverbLab.md

### MODULATION

#### Chorus
- **Overwhelm:** 3.
- **Journey:** The card's choir metaphor is right, but the picture shows one slowly breathing wave. LEARN has "the best WHERE TO START in the effects set".
- **Top problems:**
  1. The picture does not show a choir.
  2. The default SINE hides DELAY, and motion is slow.
  3. The check asks about the flanger before it is taught.
- **Strengths:**
  1. "two players who are never quite together".
  2. "Right answers stay right."
- **First 30 s:** one grey wave plus two faint drifting copies; pointers on RATE, then DEPTH.
- **Files:** G6_ChorusLab.md, G6b_ChorusLab.md

#### Flanger
- **Overwhelm:** 3.
- **Journey:** The "jet" card and the CENTER drag work silently. The core claim "evenly spaced" contradicts the log-axis picture.
- **Top problems:**
  1. Words and picture disagree.
  2. LEARN lists absent controls and is formula-first.
  3. RATE on the bezel, SWEEP on the key.
- **Strengths:**
  1. The jet metaphor.
  2. The CENTER caption that changes as promised.
- **First 30 s:** a spectrum with dips labelled "cancelled here"; a pointer on CENTER.
- **Files:** G6_FlangerLab.md, G6b_FlangerLab.md

#### Phaser
- **Overwhelm:** 3.
- **Journey:** An eight-sentence card (the longest in G6's set), then the clearest modulation rack: countable dips.
- **Top problems:**
  1. The card's length.
  2. The lesson is defined only by comparison with the flanger.
  3. The dips sweep while you count them.
- **Strengths:**
  1. STAGES 4 → 8 doubles the dips.
  2. Q1/Q4 feedback, "the model for the whole app".
- **First 30 s:** "Phaser — a swirling 'whoosh'." "Tap 8. Count the dips."
- **Files:** G6_PhaserLab.md, G6b_PhaserLab.md

### DISTORTION

#### Distortion
- **Overwhelm:** 3.
- **Journey:** The most self-explaining picture: tops sliced at the red lines. Odd and even harmonics are told, never drawn, and the starting pointer is broken.
- **Top problems:**
  1. Harmonics are not drawn.
  2. WHERE TO START points to a missing line.
  3. Maths labels (TANH, ASYM, OS).
- **Strengths:**
  1. The dashed "would-have-been" peak.
  2. "so far DRIVE is just gain".
- **First 30 s:** "Push a sound harder than the equipment can carry." A pointer on DRIVE, with harmonic bars.
- **Files:** G6_DistortionLab.md, G6b_DistortionLab.md

### PHASE

#### Phase
- **Overwhelm:** 3.
- **Journey:** The strongest silent "aha" in the effects set: flip plus mono gives a flat line. Then the delay half drops into Lissajous views and a Greek-letter formula.
- **Top problems:**
  1. Code-word keys ("R: Ø · DLY", "POL").
  2. No plain caption for Lissajous or correlation.
  3. LEARN starts on "φ(f) = −2πfτ".
- **Strengths:**
  1. The recipe caption that produces the flat line.
  2. "Polarity and phase are easy to mix up."
- **First 30 s:** "Two copies of a sound can help each other or erase each other." FLIP R → LISTEN: MONO → "Silence — they cancelled."
- **Files:** G6_PhaseLab.md, G6b_PhaseLab.md

### SYNTHESIS

#### Oscillators
- **Overwhelm:** 2.
- **Journey:** WAVE → SQUARE gives a real "aha": the even bars vanish. Nobody says what a bar is, so it reads as "a pretty change rather than an idea".
- **Top problems:**
  1. The goal arrives as the third popup.
  2. The lab opens on EXPLORE while the explanation is on LEARN.
  3. The bars have no caption.
- **Strengths:**
  1. The WAVE tray.
  2. LEARN's GUIDED STEPS.
- **First 30 s:** "Every sound shape is built from simple tones stacked up — like a recipe. Bar 1 is the note." Then "Tap WAVE, pick SQUARE."
- **File:** G7_OscillatorLab.md (it also defines the rack frame F1-F8)

#### Noise
- **Overwhelm:** 2-3.
- **Journey:** The term card says noise is unwanted, then the lab plays it on purpose. The COLOR tray is rewarding, but the flat white line argues with "sounds bright".
- **Top problems:**
  1. The term card contradicts the lab.
  2. No axis labels.
  3. The core lesson needs sound.
- **Strengths:**
  1. Colour chips with one line each.
  2. All lines crossing at 1 kHz.
- **First 30 s:** "Noise here is a hiss with no note. Engineers use it on purpose to test speakers and rooms." Add "rumble ← → hiss" under the axis.
- **File:** G7_NoiseLab.md

#### Harmonics
- **Overwhelm:** 3.
- **Journey:** A lovely term card, then the busiest screen in G7's group. The draggable stems, the real treasure, sit below the fold.
- **Top problems:**
  1. Too many readouts, and the reading area is a third of the phone.
  2. THD is explained only by a formula popup.
  3. Labels sit on empty rows after a preset change.
- **Strengths:**
  1. "A flute and a guitar differ because their harmonics differ."
  2. The PRESET tray.
- **First 30 s:** open on SINE with the stems under the display; "Drag H3 up"; measurements behind "Show measurements".
- **File:** G7_HarmonicLab.md

#### FM Synthesis
- **Overwhelm:** 2-3.
- **Journey:** The INDEX fader satisfies even silently. A "wall of maths labels" sits on the display, and the lab ends well with WHAT'S LEFT.
- **Top problems:**
  1. Maths vocabulary on the display.
  2. "FM" means both the lab and a readout.
  3. No visual anchor for pitched vs bell.
- **Strengths:**
  1. The INDEX fader.
  2. RATIO tray lines.
- **First 30 s:** "FM = shake one tone with another… Drag INDEX."
- **File:** G7_FmLab.md

#### Modular Synth
- **Overwhelm:** 3.
- **Journey:** A real-looking case invites play, and WOBBLE's blue cable shows the change silently. The case is "a wall of tiny acronyms" with no tour.
- **Top problems:**
  1. Tiny acronym labels.
  2. The module tap sheets are announced only deep in LAB NOTES.
  3. The best silent picture is buried in LAB NOTES.
- **Strengths:**
  1. Colour-coded cables.
  2. "SEQ, LFO and ENV make no sound… CV… turns another module's setting for you."
- **First 30 s:** "Sound flows along the amber cable: TONE → FILTER → VOLUME → OUT… Tap PATCH → WOBBLE."
- **File:** G7_ModularLab.md

#### Sound Envelope & Transients
- **Overwhelm:** 2.
- **Journey:** "The friendliest lab in my group": A/D/S/R written on the chart, and a "Try it" line on each module. It ends with two near-identical quizzes.
- **Top problems:**
  1. Module 5's dB numbers have no caption.
  2. Two back-to-back quizzes.
  3. Feedback blurs: a GOT IT button vanishes with no message.
- **Strengths:**
  1. "▸ Try it:".
  2. Common Sound Shapes with real instruments.
- **First 30 s:** "Drag ATTACK left — the sound starts with a snap." Add "ms = thousandths of a second".
- **File:** G7_EnvelopeLab.md

### STEREO & SPATIAL

#### Stereo Imaging
- **Overwhelm:** 3 (one score given).
- **Journey:** A concrete card and a recipe whose merge is visible without sound. Naming and M/S jargon slow the learner down.
- **Top problems:**
  1. Three names for one action (MONO-FOLD / FOLD / MONO CHECK).
  2. MID/SIDE never glossed.
  3. The right answer is always the longest.
- **Strengths:**
  1. "Wider sounds bigger — until you fold to mono".
  2. A state-aware WHAT'S LEFT popup.
- **First 30 s:** a pointer on WIDTH, then MONO CHECK ("how a phone speaker hears your mix").
- **File:** G6_StereoLab.md

#### Binaural Panner
- **Overwhelm:** 2.
- **Journey:** The drag on the top-down stage is the most satisfying direct manipulation in G6's set. The stage never shows which ear is late, and front reads the same as behind.
- **Top problems:**
  1. The far ear is never shown.
  2. A developer note ("install the v7 build").
  3. Behind equals front with no explanation.
- **Strengths:**
  1. The anchored drag.
  2. "the far ear hears LATER… and DARKER" (but hidden in LAB NOTES).
- **First 30 s:** a lit LEFT ear tagged "LEFT ear hears it first". "Drag me to the other side of your head."
- **Files:** G6_BinauralLab.md, G6b_BinauralLab.md

### PITCH & TUNING

#### Autotune
- **Overwhelm:** 2.
- **Journey:** A familiar hook and a first action that works silently (AMOUNT OFF ↔ 100 %). The picture's reading rule is unexplained.
- **Top problems:**
  1. No legend for the orientation.
  2. ¢ explained only in popups.
  3. No visual of FAST vs SLOW.
- **Strengths:**
  1. The hook plus the term card.
  2. "The shortest, clearest LEARN page in my group."
- **First 30 s:** "Each amber mark is one note; the grey line beside it is where it should be… (100 cents = one piano key)."
- **File:** G7_AutotuneLab.md

#### Tuning & Temperament
- **Overwhelm:** 3 (chapter 10 is 5).
- **Journey:** The "best opening sentence in my group", and hands-on chapters. From chapter 5, BASIC mode still shows algebra, and chapter 10 "is where a beginner would quit". The reason to care arrives in chapter 13.
- **Top problems:**
  1. BASIC mode is not basic ("t = √5/2 · 1.118034").
  2. The reason to care comes late.
  3. "Done" is invisible, and LOCKED keys mean "not yet".
- **Strengths:**
  1. Chapter 7's spiral, "the single best picture in the lab".
  2. Chapter 13's "decide before you open".
- **First 30 s:** "Your piano, your guitar and your phone are all tuned the same way — but it isn't the only way." Mark chapter 10 "deeper (optional)".
- **File:** G7_TuningLab.md

#### Drum Tuning
- **Overwhelm:** 2.
- **Journey:** "The most beginner-friendly 'real-world skill' lab." The problems are navigation: two step counters, MODULE vs CHAPTER, and an intro popup on all 36 steps.
- **Top problems:**
  1. Counter and naming clash ("STEP 4/7" vs "STEP 1/4").
  2. About 36 GOT IT taps for a full run.
  3. Two steps cannot be finished without sound.
- **Strengths:**
  1. "YOU ARE LOOKING AT:" captions.
  2. A WHAT'S LEFT that names the missing task, "the best end page in my group".
- **First 30 s:** "Chapter 1 · Learn — How a drum makes sound. YOU ARE LOOKING AT: a tom cut in half." No popup.
- **File:** G7_DrumTuningLab.md

### VISUALIZATION

#### Cymatics
- **Overwhelm:** 3.
- **Journey:** An irresistible hook ("Does 440 Hz have a shape?") and predict-first design. The path is the problem: 13 doors, studios first, the 17-experiment series buried as module 8, and three navigation frames in one lab.
- **Top problems:**
  1. Too many doors, with the designed path last.
  2. Three navigation frames.
  3. Maths names on readouts ("(2,0)+(0,2)").
- **Strengths:**
  1. Predict-first.
  2. "A pattern belongs to a resonance, not to a frequency".
- **First 30 s:** one sand-plate picture: "Does a note have a shape? Let's test it. ① Watch sand… ② Change one thing… ③ Run the experiments." Studios after, as free play.
- **File:** G7_CymaticsLab.md

#### Harmonograph
- **Overwhelm:** 2.
- **Journey:** "The most inviting first picture in my group." The machine dominates the small drawing, and the lab opens detuned, so the first figure "doesn't close".
- **Top problems:**
  1. The drawing inset is too small.
  2. It opens on the exception.
  3. "SHAPE '90°·M·R'".
- **Strengths:**
  1. The machine illustration.
  2. Interval names in words ("PERFECT 5TH").
- **First 30 s:** "This old machine draws music… Tap TUNE → 2:1 OCTAVE and watch." Drawing large, machine small.
- **File:** G7_HarmonographLab.md

### INSTRUMENTS & RECORDING

#### Bass Guitar Physics
- **Overwhelm:** 2.
- **Journey:** One slider makes "shorter string = higher note" visible: "the clearest cause-and-effect in my group".
- **Top problems:**
  1. Interval names are not glossed.
  2. LEARN sends the reader to the formula first.
  3. "FRET FRET".
- **Strengths:**
  1. LENGTH %.
  2. The fraction strip above the frets.
- **First 30 s:** "Press a string and less of it can swing — so the note goes up. Slide FRET to 12: half the string, double the pitch."
- **File:** G7_BassLab.md

#### Microphone Selection Lab
- **Overwhelm:** 2 (lesson 2 is 4).
- **Journey:** One framing question on every page keeps the learner oriented, and the lab improves as it goes. The hardest part is the first two lessons, exactly where a beginner decides whether to continue.
- **Top problems:**
  1. The hardest words come first ("Sixteen terms at once" in lesson 2).
  2. Taps change things off screen, and COMPARE drops the current mic.
  3. Small gaps: unnamed A/B/C chips, and lesson 9 ends on a question with nothing after it.
- **Strengths:**
  1. Lesson 3's stage drawing with live tags, "The best page of the lab".
  2. Challenge partial credit and "change one variable".
- **First 30 s:** lesson 1 opens on the photo grid split into "HOW IT WORKS INSIDE" and "SHAPE OR JOB": "Tap a mic to see what it's good at — and what it's not."
- **File:** G8_MicSelectLab.md

#### Miking Labs (7 families, 128 lessons)
- **Overwhelm:** hubs 2 (Drums, Strings) to 4 (Sports & Broadcast). Inside a lesson: 2 in module 1, 3 in modules 2-4, 4 in module 5, 5 in module 6 ("Two microphones"), back to 2-3.
- **Journey:** A newcomer picks a familiar instrument and lands on an excellent Start-here page: a journey map, silence stated, and a "New to miking / I already mic" fork. Modules 1-2 are plain and full of predict-then-check. From module 3, the ~29-step, ~7,000-word lesson turns into engineer readouts and "listen for…" lines in a silent lab. "Most beginners will stop in module 4 or module 6."
- **Top problems:**
  1. No start-here and no sense of size per family.
  2. Several names for the same thing (STAGE / MODULE / Page / STEP); a STEP key that opens a tray; plus the contents → Module 1 bug.
  3. "listen / LISTEN FOR" in 126 of 128 silent lessons, and 8-12 number terms on the two-mic step.
- **Strengths:**
  1. PREDICT FIRST that quotes the learner's prediction.
  2. "Choose again" with reasons, no locks anywhere, and the M11 channel-cost readouts.
- **First 30 s:**
  - Hub: "New to miking? Start with Lead Vocal (or Kick Drum / Acoustic Guitar)… modules 1–2 give you the foundation."
  - Lesson: say on Start-here that modules 1-2 are the foundation and 3-8 go deeper.
  - Markers only, never locks. Starting-point wording stays and moves to the top. No citations.
- **Files:** G8_MikingHub.md, G8_MikingLesson.md

### VOICE

#### Speech & Voice
- **Overwhelm:** 2.
- **Journey:** "The most relatable lab in my group": body-first ("finger on your throat"), and pictures carry it with sound off. It ends with two quizzes.
- **Top problems:**
  1. Vowels taught as tongue position with only a spectrum.
  2. dB values with no plain anchor.
  3. Two back-to-back quizzes, and an intro popup on all 12 modules.
- **Strengths:**
  1. Voiced vs Unvoiced, "the best SOUND-FREE learning moment in my group".
  2. CAUSE → HEAR → FIX pages.
- **First 30 s:** "Put a finger on your throat and say 'sss', then 'zzz'. Feel the buzz? That buzz is your voice."
- **File:** G7_SpeechLab.md

### ELECTRONICS

#### Vacuum Tube Fundamentals
- **Overwhelm:** 2.
- **Journey:** Calm and well paced: one idea per module, instant drawing response, narrated steps. It weakens at module 4 (watch only), modules 7-8 (unlabelled graphs, "tanh"), and long-press-only help.
- **Top problems:**
  1. Help is hidden behind long-press.
  2. Graphs and faders fight the mental model.
  3. Module 8 talks about sound with none played.
- **Strengths:**
  1. Remove-a-part with recovery ("Tap CONTROL GRID to add it back").
  2. "nothing is lost and there is no score".
- **First 30 s:** "A tube is a valve for electrons: a tiny voltage controls a big flow." The first tap removes the grid: "No grid → … no amplifier."
- **File:** G3_TubeLab.md

#### Amplifier Principles
- **Overwhelm:** 4 (the highest median in G3).
- **Journey:** A strong spine: one question, predict-then-try, word readouts. But it is written at technician level: formulas from module 1, five readouts at once, and the final exam on the home screen.
- **Top problems:**
  1. Maths too early.
  2. Too many readouts and sections.
  3. The order: the check comes first, and a 12-bullet safety list comes before the task.
- **Strengths:**
  1. "The input signal steers; the power supply pays."
  2. Tasks with a stop condition.
- **First 30 s:** one line ("the power supply pays, your signal steers") and a single START. Module 1 shows one readout and a guess-first prompt. Collapse the final check; do not hide it.
- **File:** G3_AmpLab.md

### EAR TRAINING

#### Ear Training Lab
- **Overwhelm:** 2 (only 2 scores in the file).
- **Journey:** "The best-motivated lab in my group", with excellent coaching. Its value is sound, so a silent learner gets little. It accepts answers without playing.
- **Top problems:**
  1. Answers are scored without playing ("100% · last 20" after one guess).
  2. 14 modules with no grouping or order.
  3. Jargon in the level subtitles.
- **Strengths:**
  1. LISTEN FOR coaching ("boom (Bass), mud (Low Mid), honk (Mid)").
  2. "Hear it again with the answer in mind".
- **First 30 s:** "Ear training is like learning to name colours, but for sound… Play all three first, then answer." Four labelled groups, and "start here" on module 1. A "needs sound" path must not lock out silent users.
- **File:** G7_EarTrainingLab.md

### CALCULATOR LAB

#### Audio Calculator Laboratory
- **Overwhelm:** 3 (home 2; the sections walked score 1-4; Electronics not scored).
- **Journey:** "For a beginner, this lab is a reference library, not a lesson." 56 well-built workspaces with instant answers and outstanding WHY THIS MATTERS / PRACTICAL EXAMPLE / COMMON MISTAKES folds. First contact is hard. The guided Workflows suit beginners best but are hidden in a fold.
- **Top problems:**
  1. Grey placeholders look like values, and a missing box gives no named message.
  2. Answers without meaning ("RT60 0.3 s, 6% voltage drop…").
  3. No beginner path, and units drift.
- **Strengths:**
  1. The three teaching folds.
  2. Sentence verdicts and refusals ("NOT A REFLECTION…").
- **First 30 s:** "Pick a job, get a number you can use." Three job buttons that run pre-filled workflows, then "Or browse all 166 calculators by topic ›".
- **File:** G3_CalcLab.md

---

## 7. Possible bugs noticed in passing (not orientation; verify before fixing)

| Lab | What was seen | File |
|---|---|---|
| Mastering | Module 6 step 1, Kick preset at GAIN 0.0 dB: "PEAK 1.6 (above 0 dBFS) and TRUE PK −5.0 (BELOW the sample peak)". Organ −5.7 / −8.8 too. The card says true peak "can exceed the sample peak". | G4_MasteringLab.md |
| Mastering | Module 3 step 3: pressing + CONNECT repeatedly "auto-builds the CORRECT chain". A module shows "· credited" after its last card, right or wrong. | G4_MasteringLab.md |
| Mixing Guides | "✓ 50 DONE" after MARK AS READ on one guide; the hub had shown "0 read". G4's guess: visiting counts as done. Not verified in code. | G4_MixingGuides.md |
| Sound Systems | BUILD capstone 2: "Center cluster" (180,110) and "Sub · center" (180,128) sit 18 units apart under a 22-unit tap circle, so requirements 3 and 4 cannot both be met. Confirmed in code by G5b. | G5b_SoundSystemsLab.md |
| Sound Systems | Wrong links get a green ✓ and LIVE (capstones 2, 5, 9). "REQS already reads 1/8" before anything is placed. A 0-probe answer counts as solved. FINISH says "LAB COMPLETE" after one mode. | G5b, G5c |
| Sound Systems | OPERATE 3: "✓ No stage clipping" next to "VERDICT CLIPPING". OPERATE 5: the screen-reader label is inverted on power-down. "OK · WRONGCONTENT" badge text. Double full stops in every capstone. | G5b, G5c |
| Wave Physics | Module 11: "THE WRONG TOOL" improved the seat (SUM −4.4 → −1.7 dB); SUM −0.1 dB while "OFF BY still says −8.02 ms"; the REQ label drops at 14.98 ms. | G1b_WaveLab.md |
| Wave Physics | Module 16: "12.00 m" / "8.00 m" clipped; the DEPTH fader thumb sits under the "more ↓" overlay and cannot be dragged (at 770 tall). Module 10: the BOXES value "4" clipped. Module 9: vs ON-AXIS "stuck" at −12.0 dB. Home says "THE 15 MODULES"; the strip says "1 / 16". | G1b_WaveLab.md, G1_WaveLab.md |
| Patchbay | Page 7 is locked until the right answer, and its hint names a "top jack" that is not there. The first load froze the browser for about a minute. | G2_PatchbayLab.md |
| Miking | Contents → Module 1 turns NEXT into "FINISH · SEE WHAT'S LEFT ›" on every step of module 1 (reproduced by hand on Hi-Hat). A first-render flash of the previous module on step 3.1 in 127 of 128 lessons. | G8_MikingLesson.md |
| DJ Systems | Screen 6: goal ticked, but MIX BUS still "OVER". Screen 10: "+0.06 beat" shows on both pass and fail. Screen 24: "THE ROOM: MUSIC" at +4 dB does not count until ≤ +3 dB. "dBFS dBFS" on screens 7 and 21. Screen 24 power buttons named only "OFF", 26 px wide. Screen 11: a tray tap resets the fault. Screen 14: a free tick. | G5c_DJSystemsLab.md, G5b_DJSystemsLab.md |
| Game Audio | Page 17: "impact × 4" but "TAKEN 9"; BUDGET moves in steps of 4. Page 19: the FIX tray opens pre-ticked; faults 1-4 count without a re-run, fault 5 needs one. Page 11: "SOURCES ▸ NONE" while a source is chosen. | G5_GameAudioLab.md, G5b_GameAudioLab.md |
| Stage Plot | PLACE ON THE STAGE does not place. New objects stack on one spot. "Who plays or sings it" defaults to "Nobody" although Performer 1 exists. The palette reopens over the result. | G5_StagePlotLab.md |
| Compression, Gate, Limiter | Three GR values disagree ("GR PEAK 5.5 dB" / "GR — dB" / "0.0 dB"), plus "update the app to see it". | G6_CompressionLab.md, G6_GateLab.md, G6_LimiterLab.md |
| EQ Lab | Modules 1 and 11 show "MIC: LIVE on arrival" with no tap (web; needs a phone to confirm). Worth checking first: a microphone that turns on by itself. | G6_EqLabHome.md |
| Equalizer, Limiter | The Sound Safety sheet vanished on its own without a choice (Equalizer); it was semi-transparent over the lab text for ~2 s (Limiter). | G6_EqLab.md, G6_LimiterLab.md |
| Binaural | The AZ fader jumped from +132° to +180°. 259 µs shown vs LEARN's 261. "install the v7 build" note. | G6b_BinauralLab.md |
| Foundations | Module 1: FREQ ×4 while MODEL ×1.8, unexplained. Module 9: the "40Hz" label overlaps "0dB"; the slider bottom is 90 Hz vs the card's 80 Hz. Module 11 asks for PLAY but has no PLAY key. The cancelled (silent) sum in module 10 is drawn red. | G1_FoundationsCourse.md |
| Microphone Principles | The DISTANCE slider runs opposite ways in modules 3 and 4. | G1_MicLab.md |
| Room Design | After adding bass traps, "TREATED stays 0/14". "6 untreated wall reflections inside 15 ms" vs "2 early wall reflections within 15 ms". | G1_RoomDesignLab.md |
| Sound Playground | The check uses 295 Hz; the page shows 290 Hz. The header says FOUNDATIONS PLAYGROUND; the tile says Sound Playground. | G1_FoundationsPlayground.md |
| Meter | Module 1: overlay "PK 5.5" vs readout "PEAK +0.0"; "DC +0.02" vs "DC +4.0%". Module 9: "a single point at center" vs a vertical line. | G2_MeterLab.md |
| Signal Chain | SCENE reads "SQUASH" while the button says "HOT INTO LIMITER". ▶ shows nothing with sound off. | G2_SignalChainLab.md |
| Gain Staging | Module 8 shows "FINISH · SEE WHAT'S LEFT ›" before the puzzle is solved; inspected columns go back to "?". Module 3: at +40 dB all stages clip at once. | G2_GainLabHome.md |
| Calculator Lab | "SAME LEVEL IN dBV 1.782 dB" (dB where dBV/dBu is meant; also in Mic Output, Limiter Threshold, Compressor). AWG refusal "must be from -3 to 18" vs the title "14 AWG – 4/0". Loudspeaker SPL gives no answer and names no missing box. A workflow's "PRIMARY RESULT 375" has no unit. "654.5 samples". | G3_CalcLab.md |
| Cable Dressing | Stage 3 marks the winning pick with a ✕. Stage 4: "− EASE" makes the number go up. Stage 14 shows "OVERALL 0", and the guide names a "REVIEW RESULTS" button that is not there. | G3_CableInstallLab.md |
| Connector Selection | Page 15: all nine answers are FALSE. Page 6's explanations render only when everything is right. An unlabelled ⚡ button floats on page 14. | G3_ConnectorSelectLab.md |
| Cable Fundamentals | "MODULE 1 / 11" vs "LESSON 1 · 1 OF 12". CONTENTS opens as a pull-down (your rule is popups, not pulldowns). | G3_CableLab.md |
| Vacuum Tube | Tube Reference rows out of order ("01-09 then 38-40"). "✓ 9 DONE" after paging through. | G3_TubeLab.md |
| Amplifier | Module 7: "SOURCE 80% of clip" on the display vs "SOURCE 50%" on the fader. Module 5's heading does not match its step count. | G3_AmpLab.md |
| Beginning Mixing | Page 15's inspection "passes even before a sample rate is chosen". Page 4's caption spoils the blind vote. The end shows "13 pages still to finish" after all 16 were walked. The ACCURACY chip appears in a concept lab (D37). | G4_BeginningMixingLab.md |
| Advanced Mixing | Page 1 says Beginning Mixing is not done after it was walked. A fourth pick on page 2 is silently ignored. Page 2's promise is kept only after page 20's seventh step. | G4_AdvancedMixingLab.md |
| Pre-Prod / Post-Prod | Post-Production's percentage fell 33 % → 31 %. Stage 7's +0.4 dBTP gives no finding. The save-failure message guesses "free up some space". "1 required decisions made". Exercise numbers skip 3 and 6. | G4_PreProdLab.md, G4_PostProdLab.md |
| Envelope, Tuning, Speech | WHAT'S LEFT says "not done" after every page was opened and worked. Speech's module 1 ✓ was lost after a reload (possibly preview data). | G7_EnvelopeLab.md, G7_TuningLab.md, G7_SpeechLab.md |
| Ear Training | Answers are accepted without playing anything ("100% · last 20" after one guess). | G7_EarTrainingLab.md |
| Drum Tuning | Chapter 2 step 5: REVEAL KEY works after viewing 1 of 13 spots, and "2 of 4 right" counts un-ticked lines as right. Chapter 5 step 4: the intro says GOAL BEND; the page opens on GOAL SHORT. | G7_DrumTuningLab.md |
| Harmonics, Bass | Display labels point at empty harmonics after a preset change; SLOPE "−6.0" has no unit. Bass bubble "FRET FRET 3 of 12". | G7_HarmonicLab.md, G7_BassLab.md |
| Cymatics | The Membrane title is clipped at 390 ("MEMBRANE & LOUDSPEAKER …"). The lab's check is reachable only from the studios. | G7_CymaticsLab.md |
| Amplitude | The WAVEFORM burst is not visible at 390. What's left still says "Pass CHECK YOURSELF" after the check was passed. | G1_AmplitudeLab.md |
| Microphone Selection | Lesson 9 ends on a question with nothing after it. COMPARE drops the current mic. Photo names are 9 px. | G8_MicSelectLab.md |
| Labs menu | 34 of 65 tile blurbs are cut at three lines. The ✓ done mark is missing on tiles. | G8_LabsMenu.md |
| Many labs (rule check) | "N of total" counters shown by the app, against your rule that progress never shows N of total. Examples: "MODULE n / N" strips; "✓ 14 CREDITED"; "CHAIN 0/9"; "LEARN 0/22"; "LESSON 1 · 1 OF 12"; "Mixing guide 1 of 50"; "0 OF 6 CORRECT"; "Trial 1 of 10"; "Reasoning: 1/3 key factors selected". Some are values, not progress ("VOICES 0/16", "TREATED 0/14"). | Most files; full lists in section 2, pattern 5 |

---

## 8. Limits of this audit

- **Nothing was heard.** Sound was OFF for the whole walk, by rule. Every listening step, ▶, drill and "hear it" was judged as a silent learner would meet it.
- **The browser pane was shared and often hidden or resized.**
  - The pane holds 9 tabs, and it was full for long stretches; several auditors reused finished auditors' tabs.
  - It was hidden or resized by the host, so many "first look" judgements rest on page text, not a screenshot.
  - Because of this, G1 judged Wave modules 7-16 from text only; G1b then re-walked them by hand.
  - G6's drags failed because of how the tool mapped the pane, not the app; G6b re-walked them.
  - G5b's drag lanes did not respond to the tool; G5c moved them with a scripted slow drag.
  - G7 navigated another auditor's tab for a few seconds by mistake and put it back.
- **Saved data vanished every 1-2 s during G4.**
  - G4 saw its practice projects, and its own probe key, deleted within one to two seconds, even while its tab sat on another page.
  - The cause is NOT verified. G4's guess is the app's own guest clean-up running in another tab of the shared browser, but no tab or code path was identified.
  - So Pre-Production and Post-Production persistence across screens was not judged. One Post-Production check that did not tick may be the wipe or a real mismatch.
  - G4 also wrote a probe key itself (later removed) and drove some taps by script.
- **G2 worked outside the pane, in a tab of your real Chrome, on the local preview only** (http://localhost:8142), inside a 390-wide frame (390 x 780).
  - The brief said never to use your Chrome. G2 did so because the pane was full after repeated tries.
  - G2 says it set three keys there: `ape:dev:entitlement = academy`, plus `ape:intro:introVideo` and `ape:onboarding:introVideoStarted`.
  - It says it then restored them (entitlement back to "anonymous", the other two removed) and closed its tab.
  - It left the normal-tap side effects (intro-card "seen" flags, the sound-safety choice) in that Chrome profile, for localhost:8142 only.
  - I have not verified any of this.
- **Not reached, and why** (from the PROGRESS files):
  - **Cymatics:** HOME does not open in the preview (route not registered), so it was judged from source. The Plate drawing is native-only. Gallery colour/compare/print need a saved pattern; SAVE was not pressed.
  - **Microphone needed:** Harmonics' REAL SIGNAL mode and Foundations' module 13 tool cards. They need a phone and mic permission.
  - **Sign-in needed:** the Vacuum Tube card body needs an Academy sign-in, which was off-limits.
  - **No preview route:** the old LabCategoryScreen was reviewed from source only.
  - **Stage Plot:** completion was not tested (download, print and share are forbidden). 5 of 6 examples were not opened; the file gives no reason.
  - **Sound Systems:**
    - LEARN pages 3-23 were read, not driven. The reason given is time, a scope reason.
    - BUILD capstone 1 was not built, and capstones 6-8 and 10 only partly (another scope reason).
    - Capstone 2 is blocked by the overlap bug.
    - Only 1 of 10 capstones was passed end to end.
  - **DJ Systems:** screen 1's fault was never started, and screen 24's transition goal failed (deck A ran out of music).
  - **Miking:** dock keys were operated in full only on M01 and sampled on 4 more lessons. Every step of all 128 lessons was opened and read.
  - **Calculator Lab:** one workflow was run, and only the empty face of Saved Results was seen.
  - **Pages behind the shared end screen:** the What's left pages of Speaker, Room and Playground were not reopened.
  - **Phone checks still needed:**
    - EQ Lab's "MIC: LIVE on arrival";
    - the DJ screen 6 latch and finger use of the 26 px buttons;
    - Sound Systems ROUTE drag strips;
    - Stage Plot's SHARE PDF wording;
    - Game Audio's blank-panel delay.
- **Preview-only effects:**
  - The "?" key does nothing in the preview harness (there is no Help screen there).
  - Some developer text (Oscillators, FM) is `__DEV__` only and does not reach store builds.
  - Other developer lines were not checked this way.
- **Saved data changed by normal taps** in the shared browser: credits, a plot "Test Trio", DJ and Sound Systems settings, and a Game Audio budget of 1. The coordinator restores it.
- **Counts I could not reconcile** (the later or raw file wins where one exists):
  - G6b says 21 entries; its breakdown adds to 20.
  - G6b says Sound Safety on 10 of 10 arrivals; its Binaural file says it did not meet the sheet fresh, so 9 of 10.
  - G5b says 5 of 22 cases solved; its entries show 6 (G5c's count stands).
  - G5b says DJ "fixed on 13"; its entries show 10 fully fixed.
  - Mastering's "31 of 43 cards" with a generic ✗ is traceable on only 14 cards in the file.
  - Mixing Guides' "20 plain, 26 partly" headlines: the table gives 21 and 25. The keys caution "in 30 guides": the table gives 29.
  - Amplifier "15 steps": the file's step counts add to 16.
  - Calculator Lab: 63 screens stated; 64 rows (the extra row is the workflows fold).
  - Reverb's OUT ruler: about 1 s (G6) vs about 3 s (G6b); I take G6b.

---

## Suggested order if you want to build

I recommend this order.

1. **Shared frame first.** One change here helps dozens of labs.
   1. Arrival order and tap-swallowing (section 3, row 1).
   2. Sound Safety behaviour (row 2).
   3. The silent-learner line and "needs sound" tags (row 3).
   4. The check card: per-option reasons and FINISH after a pass (row 4).
   5. The end screen recap (row 5).
   6. Header icons (row 6).
   7. Then trays, bezel captions and the reading well.
2. **Then the quick wins** in section 4. Start with the ones that look like bugs to a learner: the Miking contents → Module 1 jump, the developer lines, the FAULT tray, "dBFS dBFS", the typos, and the glossary cards that contradict their labs.
3. **Then verify the possible bugs in section 7** before touching them. Start with:
   - EQ Lab's "MIC: LIVE on arrival";
   - Sound Systems capstone 2;
   - Mixing Guides "50 DONE";
   - the Mastering Kick true peak;
   - the Compression/Gate/Limiter GR mismatch.
   Decide the meaning of "done", and the counter question under your no-N-of-total rule, in the same pass.
4. **Then per lab, hardest first for a beginner:**
   - Game Audio and Stage Plot, the two new labs, before they are listed.
   - Then Sound Playground, Digital, Amplifier, Pre-Production, Gate, Limiter and the Sound Systems LEARN chapters (median overwhelm 4).
   - Then Wave and Foundations module 7.
   - The calm labs (Gain, Patchbay, Meter, Smart Processors, Envelope, Speech, Drum Tuning) are the models to copy from, not the ones to fix first.
