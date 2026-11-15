# Group F6a: items to build (waves 1-3, owner go 2026-11-15)

Labs: Digital Audio Systems; Visual Audio Analysis (Meter Lab); Signal Detective; Gain Staging; Signal Chain Builder; Patchbay Signal Flow & Normalling

Items: 22 (wave 1: 9, wave 2: 7, wave 3: 6). Build wave 1 first, then 2, then 3.

## Wave 1

### DG-01 · Digital Audio Systems · wave 1
- **Beginner problem:** Each module teaches one idea well, then piles two or three more lessons into the same scroll, so a beginner cannot tell the core from the extras.
- **Change to make:** The second lesson on a page folds away under its own PART 2 heading, so the page opens on the one core idea.
- **Already partly built; what is still missing:** Modules 1, 5 and 6 still show their extra lessons open, and Module 8 still puts the cable and clock detail before the myth summary.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/digital/modules/modAnalog.tsx:897 'PART 2 · THE ANTI-ALIASING FILTER' startOpen={false}; modQuant.tsx:335 'PART 2 · DITHER'; modDac.tsx:349 'PART 2 · OVERSAMPLING…' and :592 'PART 2 · MYTHS, DATA RATE…'. Not built: modAnalog.tsx:363-372 Module 1 still shows CREST FACTOR, POLARITY and the 'band-limited (12 harmonics)' note open; modChain.tsx:224 Module 5 chain diagram and :487 Module 6 'HOW A FLOAT NUMBER WORKS' are not folded; modDac.tsx:574-590 Module 8 keeps the clocking/cable card open and folds the myth wall the audit wanted first
- **Source in the audit:** Report §6 top problem 1 (G2_DigitalLab modules 1, 2, 3, 5, 6, 7, 8)
### DG-05 · Digital Audio Systems · wave 1
- **Beginner problem:** Module 1's readouts are bare codes (PEAK, RMS, FS) and the extra ideas after the first step sit open on the first page of the lab.
- **Change to make:** Each Module 1 readout gets a few plain words, and the extra detail moves under a 'More detail' fold.
- **Already partly built; what is still missing:** PEAK and FS still have no plain words, and the extra Module 1 detail is not folded.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/digital/modules/modAnalog.tsx:320 PERIOD caption 'one cycle' and :322 RMS caption 'average'. Not built: :321 PEAK has no caption and still reads '0.75 FS'; :363-372 CREST FACTOR, POLARITY and the band-limited note are not folded
- **Source in the audit:** Report §6 First 30 s, part 2 (Module 1)
### MT-01 · Visual Audio Analysis (Meter Lab) · wave 1
- **Beginner problem:** At phone width readout names vanished when a value got long, so the learner lost the word the card told them to watch.
- **Change to make:** Long values put their unit on a second line or use a shorter name, so the readout name stays.
- **Already partly built; what is still missing:** The Spectrum (LEVEL, TILT) and Spectrogram (TIME) readouts still use the long values that lost their names at phone width.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/meter/modules/modMeterA.tsx:360-364 CLIP with OVER on its own line; :521-535 PEAK and PK HOLD with OVR on its own line; :839-858 all five Loudness readouts with units on sub lines and short names. Not built: modMeterB.tsx:312-313 Spectrum LEVEL '-8.0 dB rel' and TILT '/oct' still one long value; :470 Spectrogram TIME 'new → right' unchanged (these two pages were not re-measured on screen by the fixers; I could not check them)
- **Source in the audit:** Report §6 top problem 1 (G2_MeterLab modules 1, 2, 4, 5, 6)
### MT-03 · Visual Audio Analysis (Meter Lab) · wave 1
- **Beginner problem:** Waterfall opens with six dock keys and a 3-D picture nobody has seen, and Loudness shows three new units at once.
- **Change to make:** On a first visit Waterfall starts with only Q RING and REPLAY, and Loudness starts with the one big INTEGRATED number, the rest shown after the first move.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/modules/modMeterB.tsx:721-803 Waterfall still has six dock keys (DAMPING, EQ, ROOM, REVERB, REPLAY, Q RING) and opens on DAMPING (:813); modMeterA.tsx:839-858 Loudness still shows INTEGRATED, LRA, SAMPLE PK, TRUE PK and TP GAP together from the start
- **Source in the audit:** Report §6 top problem 3 (G2_MeterLab modules 4 and 7; Waterfall scored Overwhelm 5)
### MT-06 · Visual Audio Analysis (Meter Lab) · wave 1
- **Beginner problem:** The Oscilloscope page opens its dock on the PHASE slider, which does nothing until X-Y is on, so a beginner's first drag shows no change.
- **Change to make:** The dock opens on SIGNAL, the card's first step.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/modules/modMeterC.tsx:614 ScopeModule still has initialParam="phase"
- **Source in the audit:** G2_MeterLab module 10 (Oscilloscope), suggestion 1
### SD-01 · Signal Detective · wave 1
- **Beginner problem:** After a wrong answer the hint, and the NEXT QUESTION button, appear below the four answers, out of sight in a small reading space.
- **Change to make:** The hint shows right under the tapped answer or above the options, and NEXT QUESTION is always in view.
- **Already partly built; what is still missing:** The hint still sits below all four answers and NEXT QUESTION is still not in the dock or pinned in view.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** Built (shared): src/screens/lab/rack/RackUnit.tsx:192-418 the display now folds to a strip when the reading area is scrolled on a phone, giving more room. Not built: src/screens/lab/foundations/bits.tsx:131-136 the hint is still drawn after all the options; src/screens/lab/meter/modules/modMeterC.tsx:1439-1449 NEXT QUESTION is still a chip in the scroll, and the dock (:1402-1405) holds only ‹ CASE / CASE ›
- **Source in the audit:** Report §6 top problem 1 (G2_MeterModule_detective)
### SD-02 · Signal Detective · wave 1
- **Beginner problem:** After CASE › the reading area keeps its old scroll spot, so the new question's title is out of sight and a beginner may miss that a new question started.
- **Change to make:** Moving to a new case or question scrolls the reading area back to the top of the question.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/modules/modMeterC.tsx:1393-1396 goCase only resets idx and step; it never calls the rack's scrollWellTo, which exists at src/screens/lab/rack/RackUnit.tsx:230 and is offered to children at :977
- **Source in the audit:** Report §6 top problem 2 (G2_MeterModule_detective)
### GN-03 · Gain Staging · wave 1
- **Beginner problem:** In the seven-stage modules the SIG and CLIP lights are tiny dots, so a beginner cannot see which ones are dark, and the dock keys read like '6·6·0 dB'.
- **Change to make:** Bigger lights with a glow, clear dock key values, and Module 6 starting with X-RAY on so the meters are understood first.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gain/gainViz.tsx:492 led still 9 x 9; src/screens/lab/gain/modules/modExplore.tsx:130 and :142 valueLabel '${g.eq}·${g.comp} dB' and '${g.fad}·${g.bus}·${g.out} dB'; :89 Module 6 X-RAY still starts false
- **Source in the audit:** Report §6 top problem 3 (G2_GainLabHome modules 6 and 7)
### GN-05 · Gain Staging · wave 1
- **Beginner problem:** Module 1's first step says 'Stop when STATUS reads HOT', but one drag of the sensitive fader skips HOT and lands on CLIP.
- **Change to make:** The first step reads 'Push SOURCE up until a box turns red.', a goal the learner can actually hit.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gain/gainScreenGuides.ts:103 start line still 'Stop when STATUS reads HOT, then keep going until it reads CLIP'; src/screens/lab/gain/modules/modLearn.tsx:90 the SOURCE fader still maps the whole range in one sweep
- **Source in the audit:** Report §6 First 30 s, part 2 (Module 1)
## Wave 2

### DG-04 · Digital Audio Systems · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab home opens with a long paragraph of 13 arrow-joined technical words and 11 shortcut chips, while the best plain overview hides in the last chip.
- **Change to make:** The home opens with 'Your voice is air. A microphone turns it into electricity…', 8 short steps and one big START button, with the shortcuts folded away.
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/digital/DigitalLabHomeScreen.tsx:110-114 the arrow-joined paragraph is unchanged; :135 SECONDARY TOOLS and :146 LEARNING chips still open; :148 the GUIDED LESSON chip still sits last on the page
- **Source in the audit:** Report §6 First 30 s, part 1 (lab home)
### MT-04 · Visual Audio Analysis (Meter Lab) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The home opens by listing nine display names a beginner has never heard of.
- **Change to make:** The home opens with 'Every meter answers one question about a sound. In 11 short pages you will learn which question each one answers, then prove it in Signal Detective.'
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/MeterLabHomeScreen.tsx:88-91 still 'Every professional display — waveform, peak, VU, LUFS, spectrum, spectrogram, waterfall, phase, scope — tells a story…'
- **Source in the audit:** Report §6 First 30 s, part 1 (lab home)
### MT-05 · Visual Audio Analysis (Meter Lab) · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Each module row shows a name and a blurb full of jargon ("Amplitude, polarity, clipping, transients, DC offset"), not the plain question that meter answers.
- **Change to make:** Each row carries its question in plain words under the name, such as 'Peak: Will it clip?' or 'Phase: Will it survive mono?'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/modules/registry.ts:12-22 the 11 blurbs are unchanged (e.g. :12 'Amplitude, polarity, clipping, transients, DC offset — the picture every DAW shows you.', :15 'LUFS: momentary, short-term, integrated, LRA, true peak…')
- **Source in the audit:** Report §6 First 30 s, part 2 (G2_MeterLab home suggestion 2)
### SC-05 · Signal Chain Builder · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The intro card's first step is a string of tray names and codes (SCENARIO, CLEAR CHAIN, SINE 220, LIMIT, GR) with no plain picture of what the rack is.
- **Change to make:** The card opens with 'Sound goes through these boxes left to right, like guitar pedals. Each box changes what the next one receives. Turn on DIST (distortion) and LIMIT (a loudness ceiling)…'.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/chainScreenGuides.ts:48 start line still 'Tap SCENARIO → ⟲ CLEAR CHAIN, set SOURCE to SINE 220, tap ▶. Put LIMIT in via MODULES and read its GR…'
- **Source in the audit:** Report §6 First 30 s, part 1
### GN-02 · Gain Staging · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** One control has three names (INPUT GAIN, the PREAMP fader, PREAMP), the status words do not match the color key, and in the TOO LOW case STATUS reads HOT when the lesson is about hiss.
- **Change to make:** One name for the control, the same words in the status and the color key, and a status word for the noise problem.
- **Effect it must have:** fix a wrong turn, with nothing new on screen
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gain/modules/modLearn.tsx:153 'INPUT GAIN' vs :191 'the PREAMP fader' vs :248 'PREAMP'; :42-44 legend TOO LOW / OVERLOAD vs src/screens/lab/gain/gainViz.tsx:174-179 status OK / HOT / CLIP; no NOISY status (F6 left the HOT reading on purpose)
- **Source in the audit:** Report §6 top problem 2 (G2_GainLabHome modules 1, 2, 4)
### GN-04 · Gain Staging · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The home opens with a textbook paragraph about operating levels and headroom instead of a picture a beginner can feel.
- **Change to make:** The home opens with 'Sound travels through several boxes before it reaches a speaker. Each box needs the right amount: too little and you hear hiss, too much and it crunches.'
- **Effect it must have:** take something away (less to read or decide)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gain/GainLabHomeScreen.tsx:99-102 the paragraph 'Gain staging is not about making everything as loud as possible — it’s about maintaining an appropriate operating level…' is unchanged
- **Source in the audit:** Report §6 First 30 s, part 1 (lab home)
### PB-01 · Patchbay Signal Flow & Normalling · wave 2 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** Page 1 talks about the top row and the bottom row of a patchbay but never shows one, so a beginner who has never seen a patchbay has nothing to look at.
- **Change to make:** Page 1 opens on the 8-pair bay picture with the top row marked OUT and the bottom row IN, and 'This is a patchbay: every cable in a studio ends here.'
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/patchbay/pagesA.tsx:34-61 PageDirection is still text cards only (Lead, two Cards, the mantra), no drawing
- **Source in the audit:** Report §6 top problem 1, plus First 30 s (show the bay first)
## Wave 3

### DG-02 · Digital Audio Systems · wave 3
- **Beginner problem:** Readouts and dock keys use short codes a beginner does not know, and FS meant two different things on two pages.
- **Change to make:** FS now means only full scale (the sample rate reads RATE), most readouts carry a small plain caption, and the remaining codes would be spelled out.
- **Already partly built; what is still missing:** Dock keys and readouts such as RESET REG, ZOH, OS RATE, ISP FREQ, STD, ANLG and A+D CLIP are still codes with no words.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built: src/screens/lab/digital/modules/modDac.tsx:270 'RATE' replaces FS; modQuant.tsx:272 TH. SNR now has caption 'over hiss'; modAnalog.tsx:320,322 captions 'one cycle', 'average'. Not built: modQuant.tsx:475 dock key still 'RESET REG'; modDac.tsx:105 'ZOH', :194 'OS RATE', :209 'ISP FREQ', :271 MODE reads 'STD'; modChain.tsx:188 'A+D CLIP' / 'AN. CLIP'; vizChain.tsx:1071 'ANLG'
- **Source in the audit:** Report §6 top problem 2 (G2_DigitalLab modules 1-8)
### SD-04 · Signal Detective · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The intro card asks the right question but never says plainly that the labels are hidden and that a wrong answer shows a clue.
- **Change to make:** The card opens with 'No labels here. Look at the picture: what runs left to right? what runs up? Then pick the meter. Wrong answers show you the clue.'
- **Already partly built; what is still missing:** The 'no labels here' and 'wrong answers show you the clue' sentences are not on the card.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/meter/meterScreenGuides.ts:439 the start line already says 'say what runs across and what runs up before you tap'; it does not say there are no labels or that wrong answers give a clue
- **Source in the audit:** Report §6 First 30 s
### SC-02 · Signal Chain Builder · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** A first visit put four interruptions in a row before the lab: the color orientation page, a term card, the Sound Safety sheet and the intro card.
- **Change to make:** The term card now sits inside the intro card, Sound Safety asks once per app session with both buttons always in view, and the color page would at least say why it appeared.
- **Already partly built; what is still missing:** The full color-orientation page still comes first and does not tell the learner it is one time only and that their lab opens right after.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** Built (shared): src/features/intro/screenIntros.ts:187 offerLabTermToCard (term shown inside the intro card); src/features/audio/soundSafetyAck.ts:283 once per session after KEEP SOUND OFF; src/features/audio/SoundSafetyWarning.tsx:305 buttons pinned in a footer. Not built: src/screens/lab/amplitude/AmplitudeOrientation.tsx:1169-1180 the full color-orientation page still replaces the lab on first entry, and its line at :98-99 does not say it is one-time or that the lab opens next
- **Source in the audit:** Report §6 top problem 2 (G2_SignalChainLab page 0, arrival)
### SC-03 · Signal Chain Builder · wave 3
- **Beginner problem:** Every unit on the rack is a short code (EQ, COMP, GATE, DIST, MOD, LIMIT) with no plain meaning anywhere on the rack or the LEARN page.
- **Change to make:** Each unit shows a few plain words the first time, such as DIST 'distortion' and LIMIT 'a loudness ceiling'.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/SignalChainLabScreen.tsx:77-85 units still carry only label codes and a setting; src/screens/lab/chainRack.tsx:247 draws only {u.label}
- **Source in the audit:** Report §6 top problem 3, part 1 (abbreviated unit names)
### GN-01 · Gain Staging · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The dock shows the knob setting (INPUT GAIN +25 dB) next to the level it produces (PREAMP −5 dB), and nothing says why the two numbers differ.
- **Change to make:** The two numbers are labeled as the knob and the level, with one sentence: 'The knob adds gain; the level is what comes out.'
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/gain/modules/modLearn.tsx:153 dock 'INPUT GAIN' and :176 bezel 'PREAMP' level, with no knob/level wording anywhere in modLearn.tsx (no 'knob' in the file)
- **Source in the audit:** Report §6 top problem 1 (G2_GainLabHome module 2 onward)
### PB-04 · Patchbay Signal Flow & Normalling · wave 3 · owner approved 2026-11-15 ("build waves 1 thru 3")
- **Beginner problem:** The lab runs 23 pages with no resting point, and nothing on page 1 or at the page 13 recap says it is fine to stop after part one.
- **Change to make:** Page 1 says the lab has two parts and that you can stop after part one, and the page 13 recap offers 'Good place to stop' with a way back to the lab list.
- **Effect it must have:** add ONE short line at the moment it is needed (guardrail: a line in, a line out)
- **Where the checker found it (2026-11-15, a lead, verify it):** src/screens/lab/patchbay/pagesA.tsx:37-41 page 1 lead has no two-parts line; src/screens/lab/patchbay/pagesB.tsx:267-275 page 13 only previews part two ('PART TWO STARTS ON THE NEXT PAGE'), no stopping point
- **Source in the audit:** Report §6 top problem 3 part 2 and First 30 s (two parts, a place to stop)
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