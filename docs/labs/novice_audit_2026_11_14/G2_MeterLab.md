# G2 · MeterLab (Visual Audio Analysis Lab) — beginner orientation audit

Walked 2026-11-14 at 390 px wide (390 x 780 frame, see G2_PROGRESS.md), sound OFF. Home `#labpreview/MeterLab`; modules `#labpreview/MeterModule/<id>`. Module 11 (Signal Detective) has its own file, G2_MeterModule_detective.md, as assigned.

---

## Page: LAB HOME · `#labpreview/MeterLab`

| Field | Finding |
|---|---|
| First look | Intro card first. After GOT IT: the title VISUAL AUDIO ANALYSIS LAB and a calm list of 11 numbered rows (Waveform, Peak Meter, VU / RMS Meter, Loudness Meter, Spectrum Analyzer, Spectrogram, Waterfall (CSD), Phase Meter, Stereo Image, Oscilloscope, Signal Detective). Thinks: "a course with 11 lessons about meters". |
| Overwhelm | 2. Only one paragraph and a list. Calm. The paragraph opens with nine display names in a row ("waveform, peak, VU, LUFS, spectrum, spectrogram, waterfall, phase, scope"), most of them unknown. |
| Knows what it is learning? | Partly. Subtitle "Learn to READ the meters — not just open them" is excellent. Card: "Why every display answers a different question about the same sound (peak, average, loudness, frequency, decay, stereo), and why you read any display's axes first." "Axes" is a school-maths word most adults have forgotten. |
| Knows what to do first? | Yes. Card: "Tap Waveform, read its one-line description, then tap OPEN to start Module 1." Did it: the row opened, showed a blurb and a green OPEN button; OPEN went straight to Module 1. Works first time. |
| Words they would not know | VU, LUFS, RMS, spectrum, spectrogram, waterfall, CSD, phase, scope, "axes", DAW (in the Waveform blurb: "Amplitude, polarity, clipping, transients, DC offset — the picture every DAW shows you" — five unknown words in one blurb). Footer: RT60, SPL. |
| Follows / continues? | Yes. Clear list, clear OPEN, SEE WHAT'S LEFT, USE WHAT YOU LEARNED → measurement tools. |
| What works | (1) The subtitle. (2) Accordion rows: one blurb, then OPEN; nothing opens by surprise. (3) The card's note that Signal Detective "hides each meter's name" tells you the finale is a test — a reason to pay attention. (4) "come back here whenever a display doesn't make sense yet" — a reason to return. |
| Suggestions | 1. (S) Rewrite row 1's blurb for a beginner: "What a recording looks like as a picture, and what its shape tells you." Save the jargon for inside the module. Same for other blurbs (Loudness: "LUFS: momentary, short-term, integrated, LRA, true peak" is five unknowns). 2. (S) Under each row title, add the plain QUESTION that meter answers (the card's own idea): Peak "Will it clip?", VU "How loud does it feel?", Spectrum "Which pitches are in it?", Phase "Will it survive mono?". This turns 11 names into 11 questions. 3. (S) Card: replace "read any display's axes first" with "always check what the sides of the picture measure first". |
| Hobbyist | Recognises most names; the "question per meter" framing would be the useful hook. Will skip straight to Spectrum or Loudness. |

## Page: Module 1 · Waveform · `#labpreview/MeterModule/waveform`

| Field | Finding |
|---|---|
| First look | A tall red/amber waveform of bursts (speech) between two red rails, with tiny overlay text "PK -2.5 RMS -12.5 CREST 10.0 dB" and "DC +0.01" in the corner. Thinks: "the sound picture from my phone's voice recorder". Good match. |
| Overwhelm | 3. Two sets of numbers: the small overlay in the display (PK / RMS / CREST / DC) AND the readout row below (PEAK / RMS / CREST / DC / CLIP). Dock: GAIN, DC, SIGNAL, Ø POL, DC→0. |
| Knows what it is learning? | Partly. Card: "How a waveform shows peak level, not loudness; what clipping looks like and why turning down can't undo it; and how DC offset pushes the whole wave off center." Three ideas, and "DC offset" is never explained in plain words on screen. |
| Knows what to do first? | Yes: "On SPEECH, drag GAIN up to +3.0 dB and watch CLIP change from CLEAN to OVER as the wave turns red." Did it (overshot to +8 dB on the first drag; the lane is sensitive): the wave turned solid red and flat at the rails. Feedback is strong. BUT at that moment the CLIP readout lost its label (just "+5.4 OVER"), and the numbers disagree with each other: overlay "PK 5.5" vs readout "PEAK +0.0"; overlay "DC +0.02" vs readout "DC +4.0%". A beginner sees two different "peak" numbers and two different "DC" numbers on one screen and does not know which to believe. |
| Words they would not know | dBFS, PK, RMS, CREST, DC, DC offset, rails, polarity, "Ø POL" (symbol), "DC→0", transients, headroom, "SYNTHESIZED TEACHING SIGNAL". |
| Follows / continues? | Yes for the clip step. The "READING THE PICTURE — CUE BY CUE" text is good but long. The Ø POL key (a symbol) will be pressed by curiosity and the result (picture flips, numbers don't) is not explained on the display. |
| What works | (1) "HEIGHT is amplitude — the peak readout, nothing more." and "FLAT TOPS at the rails are clipping" — cue-by-cue reading in plain words. (2) The common-mistakes list ("Trying to fix a clipped peak with a fader"). (3) The quiz about a flat line sitting ABOVE the center (DC offset) is a perfect "read the picture" test. |
| Suggestions | 1. (S) Show ONE set of numbers. Either drop the overlay text in the display corner or label it "before clipping" so PK 5.5 vs PEAK 0.0 is explained ("the wave wanted +5.5; the file stores 0.0"). That difference is actually the lesson — say it. 2. (S) Make DC units match (both % or both plain). 3. (S) Keep the CLIP label when it shows OVER — it is the readout the card points at. SHARED (readout label drop). 4. (S) Rename Ø POL to "FLIP" (with Ø small) and DC→0 to "REMOVE DC". 5. (S) Add a plain gloss for DC offset in the card: "the whole wave sits off the middle line". |
| Hobbyist | Knows clipping; DC offset and polarity flip are the new bits and well shown. Will notice the PK vs PEAK mismatch too. |

## Page: Module 2 · Peak Meter · `#labpreview/MeterModule/peak`

| Field | Finding |
|---|---|
| First look | Two tall LED-style bars (L and R) in a dark bezel with a scale 0 to −60 and a small OVER box at the top. Thinks: "volume bars, like on a stereo". |
| Overwhelm | 2. Readouts PEAK / PK HOLD / OVERS / RMS / CREST. Dock: GAIN, SIGNAL, RESET HOLD. Clear. |
| Knows what it is learning? | Yes. Card: "What a sample peak meter answers (will it clip?), why peak hold keeps a missed peak on record, and why equal peaks can hide very different average energy." Phrased as a question: good. |
| Knows what to do first? | Yes: "On KICK DRUM, raise GAIN from −6.0 dB to +0.0 dB and watch the OVER lamp light and OVERS count. Then pull GAIN back down and see PK HOLD keep your highest peak." Did it: OVER lit red, OVERS counted to 21. But at that moment PEAK and PK HOLD both lost their labels: two bare boxes "+6.6 OVR" side by side. The second step of the card (watch PK HOLD) is exactly the one you can no longer find. |
| Words they would not know | dBFS, sample peak, PK HOLD, OVERS, RMS, CREST, "instantaneous". |
| Follows / continues? | Yes. The text is short and the next step is clear. |
| What works | (1) The OVER lamp + OVERS count: a clear "you did it" moment. (2) "the highest recent peak kept on screen so you can mix without staring" — a reason to care. (3) Dock is small (3 keys). |
| Suggestions | 1. (S) Never drop the PEAK / PK HOLD labels when they show OVR; shorten the value instead ("+6.6!"). SHARED (BezelReadouts). 2. (S) Spell PK HOLD as "HOLD" (or "HIGHEST") on the readout. 3. (S) The card says "KICK DRUM", the dock says "KICK"; use the same word. |
| Hobbyist | Comfortable here; the "equal peaks, different average" quiz is the takeaway. |

## Page: Module 3 · VU / RMS Meter · `#labpreview/MeterModule/vu`

| Field | Finding |
|---|---|
| First look | A warm, glowing vintage VU meter with a needle and a red PEAK lamp. The most inviting picture in the lab. Thinks: "an old-school volume meter". |
| Overwhelm | 2. Readouts PEAK / RMS / CREST / NDL MAX. Dock: GAIN, SIGNAL. Calm. |
| Knows what it is learning? | Yes. Card: "Why a VU needle reads average level, which is closer to how loud a sound feels, and why it lags far behind fast peaks on purpose." Clear and relatable ("how loud it feels"). |
| Knows what to do first? | Yes: "Pick SNARE and watch the PEAK lamp flash while the needle only flicks partway up. Then switch SIGNAL to ORGAN and see the needle climb and sit." Did it: on SNARE the needle stayed near the left; on ORGAN it climbed to about 0 and sat. The SIGNAL tray describes each signal ("A sharp crack with a short rattle: a huge peak over a tiny average…"). Excellent. |
| Words they would not know | VU, RMS, NDL MAX (abbreviation of "needle maximum"), ballistics, "~300 ms", dBFS, crest factor. |
| Follows / continues? | Yes. "Lower peak, higher needle — that is RMS versus peak made physical" is a great summary line. |
| What works | (1) The realistic VU meter. (2) SIGNAL tray one-line descriptions of each sound, so a sound-off student still knows what the signal is like. (3) The SNARE vs ORGAN contrast is a single, clean experiment. |
| Suggestions | 1. (S) Rename NDL MAX to "NEEDLE MAX" (there is room). 2. (S) The caption "NEEDLE ~300 ms — BY DESIGN" could read "The needle is slow on purpose (about ⅓ second)". 3. (S) With SNARE the PEAK lamp flash is brief; add a small "flashes: N" counter so a student who blinked still sees it happened. |
| Hobbyist | Will enjoy it; many own plugin VUs and never knew why they lag. |

## Page: Module 4 · Loudness Meter · `#labpreview/MeterModule/loudness`

| Field | Finding |
|---|---|
| First look | A huge amber number "-15.9" with "LUFS INTEGRATED" under it. Two bars M and S on the left with a "STREAMING ≈ −14 (varies)" marker, a small graph on the right "SHORT-TERM · SPED UP". Thinks: "a loudness score; −15.9 is… good? bad?" |
| Overwhelm | 4. Display + readout row (5 numbers), a disclaimer printed TWICE in a row ("SIMPLIFIED BS.1770-STYLE TEACHING MODEL — not a compliance meter (ITU-R BS.1770-5 measurement needs real DSP)" appears as the caption AND again as the first line of the well), MOMENTARY RANGE, long text. Dock: SIGNAL only. |
| Knows what it is learning? | Partly. Card: "How LUFS measures loudness the way streaming and broadcast do, over three time windows; why LRA shows dynamics, not loudness; and why true peak can top sample peak." Three ideas and three unknown terms (LUFS, LRA, true peak). The tie to streaming (Spotify-style) is the one hook a beginner gets. |
| Knows what to do first? | Yes: "Pick MUSIC MIX and read the big LUFS INTEGRATED number first. Then switch to SPEECH and compare INTEGRATED and TP GAP." At 390 px the readout row has lost 4 of its 5 labels: it shows "-15.9 LUFS", "LRA 2.8LU", "-5.2 dBFS", "-4.3 dBTP", "+0.9 dB". TP GAP (named by the card) is the unlabelled "+0.9 dB". The card says MUSIC MIX / KICK DRUM; the tray says MUSIC / KICK. |
| Words they would not know | LUFS, LU, LRA, integrated, momentary, short-term, M / S (here M = momentary, but on the Phase page M = Mid!), true peak, dBTP, TP GAP, BS.1770, ITU-R, DSP, gating, "perception-weighted". |
| Follows / continues? | Partly. The "WHY EVERYONE NORMALIZES BY INTEGRATED LUFS" text (momentary 400 ms = "loud RIGHT NOW", short-term 3 s = "this section") is good plain language, but it is below the fold and after the duplicated disclaimer. They would likely leave with "−14 is the streaming number" and nothing about LRA. |
| What works | (1) The single big number: one thing to look at first. (2) The STREAMING ≈ −14 marker on the bars: gives the number a target and a real-world reason. (3) The plain questions for each window ("what is loud RIGHT NOW" / "how loud is this section"). |
| Suggestions | 1. (S) Remove the duplicate disclaimer; keep one short caption ("Teaching model, not an official meter"). 2. (S) Keep the TP GAP and INTEGRATED labels at 390 px. SHARED (readout label drop). 3. (S) Put a one-line verdict under the big number, e.g. "1.9 quieter than streaming's −14 target". 4. (M) Teach one window at a time: first INTEGRATED only; reveal M / S bars and LRA after the first SIGNAL change. 5. (S) M and S mean Momentary/Short-term here but Mid/Side two pages later — write MOMENT / SHORT on the bars. |
| Hobbyist | This is the module they came for (streaming targets). The true-peak gap is useful. Will be annoyed by the doubled disclaimer. |

## Page: Module 5 · Spectrum Analyzer · `#labpreview/MeterModule/spectrum`

| Field | Finding |
|---|---|
| First look | A green/blue "mountain range" of thin bars with three humps and a "221 Hz" marker on the highest one. Thinks: "a graphic equaliser picture". Close enough. |
| Overwhelm | 2. One dock key (PATTERN), readouts PATTERN / PEAK / LEVEL / TILT. The PATTERN tray (7 shapes, each with a one-line description) is the whole lesson. |
| Knows what it is learning? | Yes. Card: "How to read a spectrum by its shape: where the energy sits, smooth noise vs spiky notes, hum from AC power as a family of spikes, feedback as one spike." Concrete, visual, real. |
| Knows what to do first? | Yes: "Open PATTERN and flip through all seven shapes. Then switch between MAINS HUM and FEEDBACK and watch PEAK jump from 60 Hz to 1.7 kHz." Did it: MAINS HUM shows a comb of spikes from 60 Hz, PEAK reads 60 Hz, and the tray says "If you see this, chase grounding and cables, not EQ." Perfect real-world feedback. At 390 px LEVEL and TILT lost their labels ("-8.0 dB rel", "-1.6/oct"). |
| Words they would not know | Hz / kHz (axis), formants, "dB rel", TILT "/oct" (octave), harmonics, mains, rolloff. |
| Follows / continues? | Yes. "Three questions decode any spectrum" (WHERE is the energy · SMOOTH or spiky · what CHANGES) is a teachable method. Best module in the lab for a beginner. |
| What works | (1) "Left = lows, right = highs, height = energy" — the axes in one line, right under the display. (2) Each pattern has a "tell" and an action ("chase grounding, not EQ"). (3) One control. |
| Suggestions | 1. (S) Label the x-axis numbers with words once ("20 Hz = deep rumble … 20k = highest you can hear"). 2. (S) Drop TILT from the beginner's readout row (it needs "octave"); show it in the guide. 3. (S) Keep LEVEL's label. SHARED. |
| Hobbyist | Very useful: hum vs feedback vs cymbal tells are the practical payoff. |

## Page: Module 6 · Spectrogram · `#labpreview/MeterModule/spectrogram`

| Field | Finding |
|---|---|
| First look | A black panel with striped coloured blocks (speech) scrolling, a colour bar HI/LO on the right, "FREQUENCY ↑" on the left and "OLDER ← TIME → NOW" at the bottom. Thinks: "a heat map, maybe a recording over time". |
| Overwhelm | 2. Readouts are the axis key itself (TIME new → right · FREQ ↑ up · LEVEL = color · MODE SCROLL): clever. Dock: PATTERN, VIEW. |
| Knows what it is learning? | Yes. Card: "time across, frequency up and level as color, so up means higher pitch, not louder". And the first thing in the well is an OPEN fold "READ THE AXES FIRST" that says "The #1 error … reading a spectrogram like a waveform, where up means loud. Here, up means HIGH-PITCHED." Spot on. |
| Knows what to do first? | Yes: "Pick WHISTLE, then FEEDBACK, and compare their single lines". Did it: WHISTLE drew one thin wavy line; the tray says "a pure tone with a little vibrato. The simplest picture a spectrogram can draw." Clear. Mismatch: the card says set VIEW to "SNAPSHOT — FULL 5 s", the dock key reads "ELAPSED", and the MODE readout reads "SCROLL" — three names for the view setting. At 390 px the TIME readout lost its label ("new → right"). |
| Words they would not know | formant, harmonics, vibrato (in tray text), "ELAPSED", "SCROLL", decay. |
| Follows / continues? | Yes. |
| What works | (1) Readouts used as the axis legend. (2) "READ THE AXES FIRST" open by default, directly under the display. (3) Tray captions say how each sound PAINTS. |
| Suggestions | 1. (S) Use one name for the view setting in card, dock and readout (e.g. "LIVE / WHOLE 5 s"). 2. (S) Put Hz ticks on the frequency axis (even just "low / mid / high"). 3. (S) Keep the TIME readout's label. SHARED. |
| Hobbyist | Great for spotting feedback and sibilance; the snapshot view is the useful one. |

## Page: Module 7 · Waterfall (CSD) · `#labpreview/MeterModule/waterfall`

| Field | Finding |
|---|---|
| First look | A flat 3-D slab of orange/green on a tilted grid with axes "dB", "Hz" and "TIME 0s…6s" going into the screen. Thinks: "a 3-D graph… of what?" |
| Overwhelm | 5. The busiest module: 3-D picture with three axes, readouts RT-125 / RT-4k / RIDGE / VS NEARBY, a 6-key dock (DAMPING, EQ, ROOM, REVERB, REPLAY, Q RING) and the longest text in the lab (~5,400 characters). "CSD" is never spelled out. |
| Knows what it is learning? | Partly. Card: "How a waterfall shows each frequency dying away, why level and decay are different things, and how to spot a ridge that rings longer than its neighbors." "Dying away" is good plain language; "ridge" and "rings" are not obvious. |
| Knows what to do first? | Yes: "Tap Q RING on and watch RIDGE jump to 1.2 kHz". Did it: RIDGE turned red "1.2 kHz", VS NEARBY "3.0×", a tiny spike appeared on the slab with "RINGS 1.2k" under the axis. The readout is clear; the picture change is very small at phone width (the slab is shallow, the "collapsing mountain range" is hard to see in a 390 px wide 3-D view). Card says "RT·4k and RT·125"; the readouts say "RT-4k / RT-125". |
| Words they would not know | CSD, RT60, RT·125 / RT·4k (decay time at a frequency), RIDGE, Q, Q RING, damping, "VS NEARBY 3.0×", amplitude, X/Y/Z axes. |
| Follows / continues? | Partly. They can do the Q RING step and read RIDGE. They will not get "level vs decay" from a still 3-D slab; REPLAY helps but the shape is small. They would quit in the text (X/Y/Z axis explanation is good, but it is followed by a lot more). |
| What works | (1) "The mountain range collapsing toward you IS decay" — a strong image in words. (2) The axis legend boxes (X — ACROSS frequency, Y — UP amplitude, Z — TOWARD YOU time). (3) RIDGE as a readout in words ("none" → "1.2 kHz"). |
| Suggestions | 1. (S) Spell out CSD once ("cumulative spectral decay: how each pitch fades") in the title area. 2. (M) For a first visit, hide EQ / ROOM / REVERB; start with only Q RING and REPLAY, then reveal the rest. 6 keys is too many for a 3-D picture nobody has seen before. 3. (S) Rename RT-125 / RT-4k to "LOW FADE / HIGH FADE (s)" on the readout; keep RT60 in the text. 4. (M) In FULL SCREEN or landscape the slab will read better; on a phone, suggest it: "Turn your phone sideways for this one". 5. (S) Make card and readout spell RT the same way. |
| Hobbyist | RT60 is known to room-treatment hobbyists; the damping comparison is useful. Still hard to read at phone size. |

## Page: Module 8 · Phase Meter · `#labpreview/MeterModule/phase`

| Field | Finding |
|---|---|
| First look | A horizontal bar "CORRELATION" from −1 to +1 with a needle near +1, and a circle with crosshairs (L, R, M, S labels) containing a cloud of green dots. Thinks: "a target with dots… a radar?" |
| Overwhelm | 3. Readouts CORR / WIDTH / PHASE / MONO FOLD; three verdict rows (+1 MONO-SAFE, ~0 WIDE, −1 MONO-DEATH) and a coloured verdict line. Dock: PHASE, WIDTH. |
| Knows what it is learning? | Partly. Card: "How correlation shows whether left and right move together, and why a mix near −1 can sound wide in stereo yet cancel when summed to mono." "Summed to mono" assumes they know mono. |
| Knows what to do first? | Yes: "Read CORR and MONO FOLD at the start. Drag PHASE to 180° and watch both fall." Did it: CORR −0.91 in red, MONO FOLD −13.6 dB, the −1 MONO-DEATH row lit red, verdict "CANCELLATION". Excellent feedback, in words, on three levels. |
| Words they would not know | correlation, ρ (Greek letter on the bar), phase, degrees, mono, "summed", MONO FOLD, goniometer, L/R/M/S on the circle (M and S never explained on this page), anti-phase, polarity. |
| Follows / continues? | Yes for the verdict rows. The dot-cloud (goniometer) explanation is good but sits below the verdicts; the circle is the biggest thing on screen and is explained last. |
| What works | (1) The three verdict rows (+1 / ~0 / −1) with plain names; the active one lights up. (2) The verdict sentence in colour ("summed to one speaker this signal keeps its body"). (3) A real reason to care (phones and club systems play mono). |
| Suggestions | 1. (S) Add a one-line caption to the circle: "Each dot = one instant. Up-and-down line = mono, ball = wide, flat line = trouble." (the words exist in the well). 2. (S) Replace "ρ" with "CORR" on the bar. 3. (S) Say what mono is in the card: "played through one speaker (phones, club PA)". 4. (S) "MONO-DEATH" is vivid but alarming; "CANCELS IN MONO" is clearer. |
| Hobbyist | Very practical; the goniometer reading guide is the bit they will screenshot. |

## Page: Module 9 · Stereo Image · `#labpreview/MeterModule/stereo`

| Field | Finding |
|---|---|
| First look | A half-circle with L, C, R around it and a single gold spike straight up the middle, plus two bars MID and SIDE. Thinks: "the sound is in the middle". Right. |
| Overwhelm | 2. Readouts PRESET / MID (SHARED) / SIDE (DIFF). One dock key: PRESET (MONO, NARROW, WIDE, HARD L-R, MID-SIDE). |
| Knows what it is learning? | Yes. Card: "How Mid (what both channels share) and Side (what differs) set stereo width…" The readout labels themselves carry the gloss (SHARED / DIFF). |
| Knows what to do first? | Yes: "Step PRESET from MONO to NARROW to WIDE … Then pick HARD L-R and look at the middle." Did it: HARD L-R drew two blue fans at L and R with nothing in the middle; tray: "maximum separation with a hole in the middle — the classic 1960s mix layout." Picture and words agree. Small mismatch: MONO text says "a single point at center" while the picture shows a vertical line. |
| Words they would not know | Mid, Side (glossed), "L + R", "L − R" (maths), panned, mono. |
| Follows / continues? | Yes. |
| What works | (1) Glossed readout labels "MID (SHARED)" and "SIDE (DIFF)" — the model to copy elsewhere. (2) One control, five presets with one-line descriptions. (3) The "hole in the middle" picture. |
| Suggestions | 1. (S) Change "a single point at center" to "a single line straight up the middle" to match the picture. 2. (S) Spell "DIFF" as "DIFFERENT" (room exists). 3. (S) Add the phone-speaker reason: "Anything only in SIDE vanishes on one speaker." (now only in the card). |
| Hobbyist | Clear and useful; the MID-SIDE preset invites them to try M/S EQ later. |

## Page: Module 10 · Oscilloscope · `#labpreview/MeterModule/scope`

| Field | Finding |
|---|---|
| First look | A classic green oscilloscope trace (sine) on a grid, "CH 1 · SWEEP LOCK" and "TRIG" in the corners. Thinks: "a heartbeat monitor / the wave again". |
| Overwhelm | 2. Readouts MODE / SIGNAL / CORR "—" / WIDTH "—" (two dashes that mean "not used in this mode"). Dock: SIGNAL, X-Y, WIDTH, PHASE. |
| Knows what it is learning? | Partly. Card: "How an oscilloscope shows the raw voltage over time, how harmonics give each wave its shape, and how X-Y mode draws left against right." "Harmonics" and "X-Y" are new. The page feels like a repeat of Module 1 (Waveform) until X-Y. |
| Knows what to do first? | Partly. Card says "Switch SIGNAL between SINE and SQUARE", but the dock opens with the PHASE lane, which does nothing until X-Y is on. A beginner drags the open lane first and sees no change. |
| Words they would not know | voltage, CH 1, SWEEP LOCK, TRIG, X-Y, Lissajous (row blurb), harmonics, CORR, ballistics, weighting. |
| Follows / continues? | Yes, but the purpose vs Module 1 is unclear ("what is the difference between a waveform and a scope?"). The text says it ("no averaging, no ballistics"), but a beginner does not know what averaging and ballistics were. |
| What works | (1) "what is the signal actually DOING right now?" — a clear question. (2) MYTH: "If no meter shows red, nothing is clipping anywhere." Excellent, practical. |
| Suggestions | 1. (S) Open the dock on SIGNAL (the card's first step), not PHASE; or grey out PHASE/WIDTH until X-Y is on. 2. (S) First line: "Module 1 showed seconds of sound; the scope zooms in to a few thousandths of a second." That answers "why again?". 3. (S) Hide CORR / WIDTH readouts in TIME mode instead of showing "—". 4. (S) Hide or gloss "CH 1 · SWEEP LOCK / TRIG". |
| Hobbyist | X-Y Lissajous is the fun bit; the clip MYTH is the useful one. |

(Module 11 Signal Detective: see G2_MeterModule_detective.md. The lab's WHAT'S LEFT screen is the shared LabEndScreen; its finding is in G2_DigitalLab.md and applies here too.)

---

## MeterLab — overall verdict

The beginner's journey: the home is calm and the subtitle "Learn to READ the meters" sets the right goal. Most modules are built around ONE question and ONE control, and the best of them (Spectrum, Spectrogram, Stereo Image, Phase, VU) give a feedback moment in words that a total beginner can read without sound: "MAINS HUM … chase grounding, not EQ", "MONO-DEATH", "a hole in the middle". The two hard pages are Loudness (three new units at once and a duplicated legal disclaimer) and Waterfall (a 3-D picture, six dock keys and the longest text in the lab). Across the lab, the readout row drops its labels at 390 px exactly when the numbers matter most (OVER, TP GAP, LEVEL), and the same letters mean different things on different pages (M = Momentary on Loudness, Mid on Phase/Stereo).

**3 biggest orientation problems**
1. Readout labels vanish at phone width when a value goes long (PEAK / PK HOLD at OVER, CLIP, 4 of 5 Loudness labels, LEVEL/TILT, TIME) — the student loses the word the card told them to watch. SHARED.
2. Duplicate or disagreeing numbers on one screen: Waveform shows PK 5.5 in the display and PEAK +0.0 in the readout, DC +0.02 vs DC +4.0%; Loudness prints its disclaimer twice.
3. Waterfall and Loudness start with everything visible (6 keys / 3 units) instead of one idea first.

**3 best things**
1. One question per meter, one main control, and a tray where every choice has a one-line plain description.
2. Verdict text that changes with the picture (MONO-SAFE / MONO-DEATH rows, MAINS HUM advice, "hole in the middle").
3. "READ THE AXES FIRST" opened under the Spectrogram — the lab's own thesis, shown at the right moment.

**"First 30 seconds" rewrite (home)**
"Every meter answers one question about a sound. In 11 short pages you will learn which question each one answers, then prove it in the Signal Detective game, where the meter names are hidden." Then each row shows its question in plain words under the name ("Peak — Will it clip?"), and Module 1 opens with only GAIN and SIGNAL in the dock.


