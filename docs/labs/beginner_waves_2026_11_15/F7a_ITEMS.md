# Group F7a: items to build (waves 1-3, owner go 2026-11-15)

Labs: Gate / Expander; Limiter; Smart Processors Lab (De-Esser); Stereo Imaging; Binaural Panner; Equalizer; EQ Lab (home + 15 modules); Compression

Items: 26 (wave 1: 11, wave 2: 10, wave 3: 5). Build wave 1 first, then 2, then 3.

## Wave 1

### GATE-05 · Gate / Expander · wave 1
- **Beginner problem:** LEARN's control list has eleven entries and six of them are controls this lab does not have, so a beginner stops reading.
- **Change to make:** The list would split into 'On this screen' and a folded 'On real gates (for later)'.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/lab/guidedLessons/content.ts:374-378 hysteresis, lookahead, sidechain, key filter, listen all 'Not on this screen' in the main list; no fold for them in the LEARN renderer (searched)
- **Source in the audit:** G6_GateLab LEARN, Overwhelm 4, suggestion 1 (also the page's own top problem 3)
### LIM-06 · Limiter · wave 1
- **Beginner problem:** LEARN lists five or more controls this lab does not have right in the main list.
- **Change to make:** Those entries would fold under 'On real limiters (for later)'.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/lab/guidedLessons/content.ts:424-430 drive, attack, lookahead, true peak, character, dither all 'Not on this screen' in the main list
- **Source in the audit:** G6_LimiterLab LEARN, Overwhelm 4, suggestion 1
### DES-01 · Smart Processors Lab (De-Esser) · wave 1
- **Beginner problem:** Page 3's block diagram shows the split-band wiring four pages before split-band is taught.
- **Change to make:** Page 3 would show only the main path and the 'ear' path, and the band split and sum would join on page 7.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/deesser/deEsserModel.ts:64 DEFAULTS mode 'split'; src/screens/lab/deesser/DeEsserLabScreen.tsx:209-211 page 3 diagram follows that mode, so it opens split-band
- **Source in the audit:** Report §6 top problem 1
### DES-02 · Smart Processors Lab (De-Esser) · wave 1
- **Beginner problem:** The hub's five-question check sits right under the only lab card, so a beginner may answer before doing the lesson.
- **Change to make:** The check would be labeled 'After the De-Esser lab' or folded until the lab has been visited.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/deesser/SmartProcessorsLabScreen.tsx:94 LabUnderstandingBlock directly after the single row, no label
- **Source in the audit:** Report §6 top problem 2
### DES-03 · Smart Processors Lab (De-Esser) · wave 1
- **Beginner problem:** Leftover jargon like 'hard-knee', 'gain computer' and a ratio with no control confuse a beginner.
- **Change to make:** The ratio is now said to be fixed at 4:1; 'gain computer' and 'hard-knee' would become plain words like 'the part that decides how much to turn down'.
- **Already partly built; what is still missing:** 'Gain computer' on the hub and 'hard-knee' on page 4 are still there.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/deesser/DeEsserLabScreen.tsx:409 'ratio (fixed at 4:1 in this lab)'. Still: SmartProcessorsLabScreen.tsx:69 'a gain computer'; DeEsserLabScreen.tsx:278 '(in this hard-knee model)'
- **Source in the audit:** Report §6 top problem 3
### DES-04 · Smart Processors Lab (De-Esser) · wave 1
- **Beginner problem:** The hub row has a long technical blurb and a small green OPEN tag that reads like a status, not a button.
- **Change to make:** The row would read 'De-esser: it softens the hissy S sounds in a voice, and only those' with a clear START › button.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/deesser/SmartProcessorsLabScreen.tsx:46 blurb 'A compressor that listens only to the hiss — detection path…'; :85 'OPEN' tag
- **Source in the audit:** Report §6 First 30 s (hub card wording and START ›)
### DES-05 · Smart Processors Lab (De-Esser) · wave 1
- **Beginner problem:** Page 7 opens on the 'th' frame, which has no reduction, so switching between broadband and split-band shows nothing at first.
- **Change to make:** Page 7 would open already on an S frame, so the first mode switch shows the difference.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/deesser/DeEsserLabScreen.tsx:420 useState(0) selects PHRASE[0]; src/features/deesser/deEsserModel.ts:27 frame 0 is 'th', not sibilant
- **Source in the audit:** G6_SmartProcessorsLab page 7, suggestion 1
### ST-01 · Stereo Imaging · wave 1
- **Beginner problem:** One action has three names on screen: MONO-FOLD in the caption, FOLD on the key and MONO CHECK in the tray.
- **Change to make:** The key, the caption and the tray would all say MONO CHECK.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1876 caption 'hit MONO-FOLD'; :1925 label 'MONO-FOLD', short 'FOLD'; :1928 choice 'MONO CHECK'
- **Source in the audit:** Report §6 top problem 1
### ST-04 · Stereo Imaging · wave 1
- **Beginner problem:** The first step still opens with tapping play, and the mono check is never tied to why it matters, such as phone speakers.
- **Change to make:** The first step would start with dragging WIDTH, then MONO CHECK described as how a phone speaker hears the mix.
- **Already partly built; what is still missing:** The first step still begins with play, and the phone-speaker reason is not on the MONO CHECK control.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/stereoScreenGuides.ts:50 start still 'Tap ▶ and open LAB NOTES. Slide WIDTH…'; :61 FOLD described as 'as a single speaker would'; the phone-speaker reason is only in a check reveal (fxLabConfigs.tsx:1981)
- **Source in the audit:** Report §6 First 30 s (pointer on WIDTH, then MONO CHECK as 'how a phone speaker hears your mix')
### BIN-04 · Binaural Panner · wave 1
- **Beginner problem:** The words say 'far ear' but never name which ear, LEFT or RIGHT, hears the sound first.
- **Change to make:** The cue line would read like 'Object 1 is on your RIGHT, so your LEFT ear hears it 0.49 ms later and quieter.'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/BinauralLabScreen.tsx:419 'far-ear delay ≈ … µs · far-ear level' with no side named; :42 of binauralScreenGuides.ts asks for a drag but names no ear
- **Source in the audit:** Report §6 First 30 s ('LEFT ear hears it first', 'Drag me to the other side of your head')
### BIN-05 · Binaural Panner · wave 1
- **Beginner problem:** Dragging one sound object onto another hides it completely, so the learner thinks it vanished.
- **Change to make:** Objects at the same spot would be nudged apart, or the hidden one's ring drawn on top, so none ever disappears.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/BinauralLabScreen.tsx:708-723 each object drawn at its own position with no overlap check
- **Source in the audit:** G6b_BinauralLab EXPLORE finding (c), suggestion 4
## Wave 2

### EQ-06 · Equalizer · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first card says an equalizer 'boosts or cuts chosen frequencies' without saying in everyday words what that means.
- **Change to make:** The card would read like 'the tone knobs of audio: bass, middle, treble; in this lab you control ONE of those knobs.'
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:229-233 card text unchanged; it is copied word for word from the live glossary row, so a change means a new glossary row or re-wiring
- **Source in the audit:** Report §6 First 30 s, card text
### EQL-01 · EQ Lab (home + 15 modules) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Module 1, the live room spectrum with HPF and FFT readouts, is harder than module 2, which is the true beginner page.
- **Change to make:** 'Why We Use EQ' would become module 1 and 'Seeing Frequency' module 2.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/eq/modules/registry.ts:59-67 spectrum is still first, whyEq second; modules are credited by id (EqModuleScreen markLabVisit with meta.id), so a swap would not move earned credit
- **Source in the audit:** Report §6 top problem 1, part 1, plus First 30 s part 2 ('Make Why We Use EQ lesson 1')
### EQL-03 · EQ Lab (home + 15 modules) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Modules 7, 10 and 11 use words like Butterworth, poles, phase, COMB and FFT with no plain-word line.
- **Change to make:** Each would get one plain sentence, for example 'each step down an octave is 12 dB quieter', and the code words would be explained or hidden.
- **Already partly built; what is still missing:** Module 7 still leads with Butterworth and poles, module 10 still offers PHASE with no explanation, and module 11 still shows COMB.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/eq/modules/LiveSpectrumEq.tsx:443 plain modelNote replaced the 'dBFS · UNCALIBRATED' line. Still: FilterSlopes.tsx:126 'Butterworth response — n poles'; FilterSlopes.tsx:32-37 tray lines in poles; LiveSpectrumEq.tsx:396 key value 'COMB'; GraphicTruth.tsx:49-57 PHASE view with no plain line
- **Source in the audit:** Report §6 top problem 2 (jargon in modules 7, 10, 11)
### CMP-02 · Compression · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The RATIO tray says GLUE, LIMIT, 'workhorse' and 'squash', and the key reads ATK/REL, which a beginner does not know.
- **Change to make:** The ratio lines would say gentle, medium, strong and almost a wall, and the key would read SPEED with 'attack = how fast it grabs, release = how fast it lets go'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1151-1154 '2:1 GLUE', 'The workhorse… squash', '20:1 LIMIT'; :1195 key label 'ATK/REL'
- **Source in the audit:** Report §6 top problem 3 (studio slang in the trays)
### CMP-03 · Compression · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first card packs threshold, ratio, attack, release and make-up gain into one breath.
- **Change to make:** The card would read 'Compressor: an automatic hand on the volume knob. When a sound gets too loud, it turns it down a little.'
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:246-248 card still the five-term glossary row 'Dynamic range compression'
- **Source in the audit:** Report §6 First 30 s, card text
### GATE-01 · Gate / Expander · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** A learner who tapped Gate is greeted by a card titled 'Downward expansion', with the gate mentioned last.
- **Change to make:** The card would be titled 'Noise gate' and say first what it is for: it mutes the gaps so background hiss goes quiet.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:251-257 term 'Downward expansion', gate in the last sentence; text is the live glossary row
- **Source in the audit:** Report §6 top problem 1 plus First 30 s card ('Noise gate, it mutes the gaps')
### GATE-02 · Gate / Expander · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The default CLICK source makes RANGE, HOLD and RELEASE look dead, and the caption admits it.
- **Change to make:** The lab would open on a source where all five controls show a change, or gray those three keys with 'try PINK NOISE to see this'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1307 sources still [CLICK 90, PINK]; :1296-1297 caption 'RANGE, HOLD and RELEASE barely change what you hear'; :1302 an earlier audit decision (2026-11-05) chose words over a new default
- **Source in the audit:** Report §6 top problem 2 plus First 30 s default source (PINK NOISE)
### LIM-01 · Limiter · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The first card is seven sentences of mixing jargon (infinite ratio, lookahead, master bus, squash).
- **Change to make:** The card would be two sentences: 'A limiter is a ceiling for loudness. Nothing gets past the line you set.'
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/features/intro/labTermIntroData.ts:259-265 card still the seven-sentence glossary row
- **Source in the audit:** Report §6 top problem 1, part 1, plus First 30 s card ('a ceiling for loudness')
### LIM-05 · Limiter · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab opens on a steady tone drawn as a gray block, which does not look like sound and hides the release control.
- **Change to make:** The lab would open on a drum-hit source, so the tops of the hits visibly flatten at the dashed ceiling line.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/fxLabConfigs.tsx:1450-1455 sources still [SINE 440, CLICK 120, PINK], the comment calls the order a recorded decision
- **Source in the audit:** Report §6 First 30 s, picture (drum hit under a dashed CEILING line)
### BIN-01 · Binaural Panner · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The stage never shows which ear is the far one, so dragging from left to right gives the same numbers and seems to change nothing.
- **Change to make:** The head would show L and R with the far ear dimmed or marked 'late', switching sides as the object crosses the middle.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/BinauralLabScreen.tsx:700-704 only the owner's head icon is drawn, no ear marks; :259 bezel ITD has no side
- **Source in the audit:** Report §6 top problem 1 (and G6b suggestion 1)
## Wave 3

### EQ-05 · Equalizer · wave 3
- **Beginner problem:** Nothing at the end of EXPLORE or LEARN tells the learner to go on to CHECK next.
- **Change to make:** A short last line on EXPLORE and LEARN would say 'Done here? Try CHECK'; the check itself now ends with FINISH and a way on.
- **Already partly built; what is still missing:** The end of the EXPLORE and LEARN tabs still has no line pointing to CHECK.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/FxLabScreen.tsx:790-796 FINISH · SEE WHAT'S LEFT after the check in every effect lab. Not built: no next-tab line in src/screens/lab/LabShell.tsx or the rack (searched, none found)
- **Source in the audit:** Report §6 top problem 3, part 2 (no 'next' signpost)
### EQL-02 · EQ Lab (home + 15 modules) · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Opening module 1 first shows a color-language primer with a different title, so the learner thinks they opened the wrong lesson.
- **Change to make:** The primer would say it is a one-time, one-minute stop and that the learner returns to the lesson right after.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/amplitude/AmplitudeOrientation.tsx:98-99 intro line still only 'Before using our audio visualizers, learn the color language…'; :74 notes this copy is near-verbatim owner spec
- **Source in the audit:** Report §6 top problem 1, part 2 (primer detour unannounced)
### EQL-05 · EQ Lab (home + 15 modules) · wave 3
- **Beginner problem:** The menu does not say how long each module takes, to start at 1, or to do the one-page Equalizer lab first.
- **Change to make:** The top line would read '15 short modules. Start at 1, about 2 minutes each. New to EQ? Do the Equalizer lab first.'
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/eq/EqLabHomeScreen.tsx:117-120 still 'Start by seeing the real frequency content of the room… Modules build in a deliberate order'
- **Source in the audit:** Report §6 First 30 s, part 1 (menu top line)
### LIM-02 · Limiter · wave 3
- **Beginner problem:** Nothing tells a newcomer that Limiter builds on Compression, so 'ratio' and 'threshold' arrive unexplained.
- **Change to make:** The intro popup would add 'New to this? Do Compression first.'
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/limiterScreenGuides.ts:46-47 learning and start lines have no Compression pointer (searched the guides, none)
- **Source in the audit:** Report §6 top problem 1, part 2 (no 'do Compression first' pointer)
### BIN-03 · Binaural Panner · wave 3
- **Beginner problem:** Moving a sound behind the head reads exactly like the front, with nothing on screen saying that is expected.
- **Change to make:** When the object is near the front or back line, one line would say 'front and behind give the same cues here, which is why your brain mixes them up'.
- **Already partly built; what is still missing:** There is no line that appears at the moment the object reaches the front or back line.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/BinauralLabScreen.tsx:421-422 THE TWO CUES always says behind-the-head is 'only gently hinted', but nothing changes when the object reaches 0° or 180°
- **Source in the audit:** Report §6 top problem 3 (and G6b suggestion 2)
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