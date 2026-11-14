# G2 · DigitalLab (Digital Audio Sampling & Conversion Lab) — beginner orientation audit

Walked 2026-11-14 at 390 px wide (390 x 780 frame, see G2_PROGRESS.md for why), sound OFF. Modules opened with `#labpreview/DigitalModule/<id>`. The lab HOME (`labs/digital`) has no preview route; see the HOME entry at the end for how it was checked.

---

## Page: Module 1 · The Analog Signal · `#labpreview/DigitalModule/analog`

| Field | Finding |
|---|---|
| First look | Intro card over a dark rack. Behind it: a speaker-to-mic drawing and a big moving coloured wave. After GOT IT the eye goes to the glowing yellow/green wave, then to the gold "New: tap ⓘ to have this screen explained" bubble. Thinks: "a sound wave picture". |
| Overwhelm | 3. The display alone is calm and pretty, but below it are 4 readouts (FREQ / PERIOD / PEAK / RMS with "FS"), a small-caps caption line that runs off the edge ("COLOR · LOUDNESS (blu…"), HIDE DISPLAY / FULL SCREEN, a long text well, and a 5-key dock (FREQ, AMP, ZOOM, WAVE, MODS). |
| Knows what it is learning? | Partly. The intro card says it plainly ("air pressure moves a mic diaphragm, which makes a continuously varying voltage"). Without the card they would think "this is how a speaker makes a wave", because the speaker is the biggest object and sits first on the left; the mic is small and the word MIC is tiny under the stand. |
| Knows what to do first? | Yes, thanks to the card: "Slide FREQ up and watch PERIOD shrink." The FREQ slider is already open above the dock, so the first step is obvious. Tried: WAVE → SQUARE; the trace became a square and RMS went 0.53 → 0.63 FS. That works, but nothing says WHY RMS rose; the beginner sees a number change and does not know if that was the point. |
| Words they would not know | voltage, diaphragm, capsule (text), PERIOD (explained only in the screen guide), PEAK, RMS, FS (readouts, explained only in the screen guide step 1: "level in FS (full scale): fractions of the converter's max"), CREST FACTOR, POLARITY, "band-limited (12 harmonics)", analog-to-digital converter, preamp. "ms" and "Hz" never explained on this page. |
| Follows / continues? | Mostly. Text well ends with a MYTH/REALITY card, a CHECK YOURSELF question, and "NEXT: SAMPLING & SAMPLE RATE ›" — a clear next step. Would quit at the CREST FACTOR / POLARITY / "BAND-LIMITED (12 HARMONICS)" block: three expert labels in a row with no words. |
| What works | (1) The intro card's two headings WHAT YOU'RE LEARNING / WHERE TO START: exactly right. (2) The picture: one event shown as speaker → air → mic → voltage, in one frame. (3) The MYTH ("ones and zeros come out of the mic") is the exact belief a beginner holds; great hook. (4) Screen guide step 1 explains FS, RMS and PERIOD in plain words and lights up the display it is talking about. (5) The WAVE tray "stays open — compare while you watch", with a one-line caption per wave ("Those vertical edges are high harmonics…"). |
| Suggestions | 1. (S) Put a 3-word gloss under each readout label the first time (PERIOD "one cycle's time", PEAK "highest point", RMS "average strength", FS "of max"). The guide already has the words; the beginner never opens the guide. SHARED (BezelReadouts) if done as a tap-to-gloss. 2. (S) After a WAVE change, one line of feedback: "Square: same peak, more average strength, so RMS rises." Right now the change is silent. 3. (S) Label the mic bigger and add "your voice / instrument" near the speaker, so it reads "sound reaching a mic", not "a speaker demo". 4. (M) Hide CREST FACTOR / POLARITY / "band-limited" behind a "More detail" fold on Module 1; they are three new ideas on the first page of the lab. 5. (S) The caption line "ILLUSTRATIVE MODEL, SLOWED · ONE EVENT, 3 VIEWS…" is cut off at 390; shorten to "Slowed-down model: one sound, three views". SHARED pattern (rack caption). 6. (S) The "New: tap ⓘ" bubble is good; make the intro card's EXPLAIN THIS SCREEN the gold (primary) button on Module 1 of every lab, so a first-timer takes the tour. SHARED (intro card). |
| Hobbyist | Knows Hz and peak; RMS and crest factor are half-known. Enjoys the myth card. Might be bored by the slow wave, but the square-wave RMS jump is a nice "oh". |

## Page: Module 2 · Sampling & Sample Rate · `#labpreview/DigitalModule/sampling`

| Field | Finding |
|---|---|
| First look | A tall yellow sine with white dots on it and one green dot. Thinks: "dots on a wave — maybe the dots are the digital part". That is the right idea. |
| Overwhelm | 4. The display has 4 readouts (FS / INPUT / NYQUIST / READS AS), then 4 more boxes (INTERVAL 20.833 µs, SAMPLES/CYCLE, f/NYQUIST 0.04×, "24-BIT STEREO 2.304 Mb/s"), then a fold diagram (fs/2, fs, 3fs/2), then an anti-alias filter section with CUTOFF / SLOPE 24 dB/oct / INPUT ATTEN, then MYTH, then a quiz. Dock: FREQ, ZOOM, RATE, ALIAS, CUTOFF (LOCKED). That is two lessons (sampling + anti-alias filter) on one page. |
| Knows what it is learning? | Partly. Intro card: "Sampling measures a wave at regular moments… above it, it folds down as a false lower tone, an alias." "Nyquist" is defined in the same sentence; good. But "fold" is a metaphor they cannot picture yet. |
| Knows what to do first? | Yes: "push FREQ past NYQUIST and watch READS AS turn red." Did it: at 30 kHz READS AS went red "18 kHz" and a red curve appeared with the header "ALIAS ≈ 18 kHz — THE DOTS FIT THIS". The feedback is good. The second step ("tap PLAY INPUT, then PLAY PREDICTED ALIAS, to hear the fold") needs sound; with sound off there is no other way to "get" the fold except the dense picture, where a 30 kHz and an 18 kHz wave both look like a solid comb. |
| Words they would not know | Nyquist (defined in card), alias (defined), FS — and here FS means SAMPLE RATE (48 kHz), while one page earlier FS meant FULL SCALE (PEAK 0.75 FS). Same two letters, two meanings, two pages apart. Also: kHz, µs, "f / NYQUIST 0.04×", "24-BIT STEREO 2.304 Mb/s", anti-alias filter, CUTOFF, SLOPE dB/oct, ATTEN, "band-limited", "reconstruction". |
| Follows / continues? | Partly. They can finish the first step; they will stall at the anti-alias filter section (a second idea with its own graph and three numbers) and the quiz uses "|30k − 48k|" maths notation. At 14 kHz the INPUT and READS AS readouts LOST their labels (two bare "14.27 kHz" boxes): a beginner cannot tell which is which. Labels came back at 30 kHz. |
| What works | (1) Dots ON the curve: the clearest possible picture of "sampling". (2) READS AS turning red + the red "the dots fit this" curve: real feedback after an action. (3) The FREQ slider caption "1 kHz — sweep through Nyquist" tells you what to do with it. (4) MYTH: "192 kHz has smoother curves" — exactly the hobbyist myth. |
| Suggestions | 1. (S) Stop using "FS" for sample rate on the readout; write "RATE 48 kHz" (or "SAMPLES/SEC"). FS already means full scale one page earlier. 2. (M) Split the anti-alias filter section into its own step, revealed AFTER the student has made an alias ("Now stop it happening: open AA FILTER"). One idea at a time. 3. (S) With sound off, add a "slow it down" view: when READS AS is red, auto-zoom so only ~3 cycles of the alias show, so the lower wave is SEEN, not just a comb. 4. (S) Keep readout labels at 390 px for this page (shorter values, e.g. "14.3k"), or the student loses track of INPUT vs READS AS. SHARED (BezelReadouts cropping rule). 5. (S) Move INTERVAL / SAMPLES-PER-CYCLE / f-over-NYQUIST / bit-rate boxes under a "Numbers" fold; keep only SAMPLES / CYCLE visible (the one that explains the picture). 6. (S) Quiz: write "30 kHz minus 24 kHz" in words, not "|30k − 48k|". |
| Hobbyist | Will love READS AS and the fold; finally sees why 44.1/48 k is enough. The "FS" double meaning will trip them too. |

## Page: Module 3 · Quantization & Bit Depth · `#labpreview/DigitalModule/quant`

| Field | Finding |
|---|---|
| First look | A smooth amber sine with a green stepped line hugging it. Thinks: "the green one is the digital copy and it is a bit jagged". Right idea. |
| Overwhelm | 4. Readouts BITS / LEVELS / TH. SNR / PEAK, a 4-colour legend line (AMBER = ORIGINAL · BLUE = SAMPLED · GREEN = STORED/RESULT · RED = ROUNDING ERROR) of which only two colours are visible at first, then STEP SIZE / HEADROOM, a "REAL CONVERTERS — THEORY VS PRACTICE" block with a formula (6.02·N + 1.76 dB) and "ENOB", a dither section with an "ERROR HISTOGRAM", a "NOISE SPECTRUM — SIMPLIFIED SHAPE", "RPDF/TPDF/1ST-ORDER SHAPING", and TWO quizzes. Dock: LEVEL, BITS, ERROR, DITHER. |
| Knows what it is learning? | Partly. Card: "Quantization rounds each sample to the nearest level step. Bit depth sets how many steps exist, and so the noise floor; dither turns rounding distortion into gentle, steady noise." Three ideas in one sentence (steps, noise floor, dither). |
| Knows what to do first? | Yes: "Switch BITS from 4-BIT to 16-BIT and watch LEVELS and TH. SNR jump." But I pressed ERROR first (it sits in the middle of the dock and has a lamp, so it looks like the main switch): the whole picture turned into a red zig-zag "ERROR VIEW — VERTICAL ZOOM ×16 (±½ STEP FILLS THE PANEL)". A beginner has no idea what they are now looking at, and the original wave is gone. |
| Words they would not know | quantization, bit depth, 2ᴺ, levels, TH. SNR (abbreviation of an unknown term), dBFS, dB, STEP SIZE "1/8 FS", HEADROOM, ENOB, dither, histogram, "correlated", RPDF/TPDF, FFT, "noise floor". |
| Follows / continues? | They can finish step 1 (BITS) and see the staircase get finer. They will quit in the dither section: histogram + simplified spectrum + three dither types, all in caps captions. |
| What works | (1) "Sampling measured WHEN; quantization measures HOW LOUD." — the best one-line link between two modules in the lab. (2) The staircase over the original wave. (3) "Quantization bites hardest on quiet signals: ride the LEVEL fader down and watch" — a clear action with a reason. (4) The "theory vs practice" note is honest (hobbyist gold). |
| Suggestions | 1. (S) Spell out TH. SNR as "SIGNAL-TO-NOISE" on the readout, at least the first time; an abbreviation of an unknown word is doubly unknown. 2. (S) When ERROR is turned on, keep a faint copy of the wave and add one line: "Red = what rounding threw away, magnified 16×". 3. (M) Move dither (histogram, spectrum strip, RPDF/TPDF) into a second step that unlocks after the BITS step, or a "Next idea: dither" fold. One new idea at a time. 4. (S) Legend: show only the colours on screen now (amber, green); add blue/red when they appear. 5. (S) First quiz uses the formula; give the answer path in words ("each bit adds about 6 dB"). |
| Hobbyist | Knows 16 vs 24-bit; the ENOB note and "dither is not magic resolution" quiz are the payoff. The error view is the part they will find cool once explained. |

## Page: Module 4 · Binary Sample Values · `#labpreview/DigitalModule/binary`

| Field | Finding |
|---|---|
| First look | A blue wave drawn as dots on vertical sticks, one green dot highlighted with a green line. Below: SAMPLE #7, DECIMAL 1,935, HEX 0x078F, and an UNLABELLED "-24.6 dBFS". Thinks: "a chart of numbers". |
| Overwhelm | 4 for a true beginner (binary, hex, two's complement, 16 switches), 2 for anyone who did school computing. Dock is calm: SAMPLE + RESET REG. |
| Knows what it is learning? | Yes. Card: "A recording is a list of signed whole numbers, one per sample. Decimal, binary, hex and dBFS are different ways of writing the same value." Clear. |
| Knows what to do first? | Partly. Card says "read DECIMAL, HEX and LEVEL" — but at 390 px the LEVEL readout has LOST its label (shows only "-24.6 dBFS"). Card then says "Below the display, tap the SIGN switch" — the switches are far down the scroll well, below a two's-complement table; nothing says "scroll down". |
| Words they would not know | integer, signed, binary, hex, "0x", dBFS, NORMALIZED, "% OF FS", two's complement, unsigned, MSB, LSB, high/low byte, register ("RESET REG" — the dock key name is jargon). |
| Follows / continues? | They can move SAMPLE and see numbers change. They would likely stop at the two's-complement table (a dense 3-column table at phone width). The bit switches are the fun part and come too late. |
| What works | (1) The green cursor dot links "this number" to "this point on the wave". (2) One stored number shown five ways at once is a strong idea. (3) Bit weights printed under each switch (16,384 · 8,192 …) so flipping is self-explaining. |
| Suggestions | 1. (S) Keep the LEVEL label at phone width (this is the readout the card names). SHARED (BezelReadouts drop-label rule vs intro-card wording). 2. (M) Move "FLIP THE REGISTER YOURSELF" (the 16 switches) ABOVE the two's-complement table; play first, explanation second. 3. (S) Rename RESET REG to "RESET SWITCHES". 4. (S) Card: "scroll down to the 16 switches" instead of "below the display". 5. (S) One plain sentence before HEX: "Hex is a short way programmers write the same binary." |
| Hobbyist | Will skim this; useful mainly for "why one more negative code". Might find it the least musical page. |

## Page: Module 5 · Analog-to-Digital Conversion · `#labpreview/DigitalModule/adc`

| Field | Finding |
|---|---|
| First look | An amber wave in a box with dashed lines labelled "0 dBFS (full scale) … analog rail … noise floor", two tall bar meters ANLG / DIG on the right, and a coloured bar TOO LOW / RIGHT / TOO HIGH under it. Thinks: "a level-setting page". |
| Overwhelm | 2. One dock key (INPUT). The calmest, clearest page in the lab. |
| Knows what it is learning? | Partly. Card: "How a converter turns a voltage into samples, block by block, and why gain is set before conversion." The display teaches the second half (gain); the "block by block" half is a separate chain diagram further down the scroll. |
| Knows what to do first? | Yes. "Pull INPUT to the bottom… Push it to the top for A+D CLIP. Then bring it back until ZONE reads RIGHT." Did it: at +12 dB the wave got flat tops, PEAK read "0.0 OVER", ZONE "A+D CLIP", and the text below switched to the TOO HIGH explanation. Excellent feedback loop. |
| Words they would not know | dBFS, analog rail, noise floor, SNR, HEADROOM, saturation, ANLG/DIG, "A+D CLIP", AA FILT, "S & H", QUANT, ENCODE, PCM (chain blocks), capacitor, quantizer, DAW. |
| Follows / continues? | Yes for the gain exercise. The chain diagram (MIC · PREAMP · AA FILT · S&H · QUANT · ENCODE · PCM) with SIMPLIFIED / STANDARD / X-RAY tabs is a second lesson and uses five abbreviations in a row. CHECK YOURSELF (rounded peaks = analog clip) is a great real-world question. |
| What works | (1) TOO LOW / RIGHT / TOO HIGH band: a goal anyone can read. (2) ZONE readout in words. (3) The text below changes with the zone, so reading and doing agree. (4) "RIGHT: peaks around −18…−10 dBFS" gives a real target. |
| Suggestions | 1. (S) Spell out ANLG / DIG as ANALOG / DIGITAL (there is room) and "A+D CLIP" as "BOTH CLIP". 2. (S) Chain blocks: write AA FILT as "FILTER", S & H as "HOLD", keep the abbreviation as a small second line. 3. (S) Put the chain diagram behind its own heading: "Part 2: the trip inside the converter". 4. (S) This page is the natural "first win" of the lab; point to it from the lab home as a beginner start (see HOME). |
| Hobbyist | The analog-vs-digital clip difference (rounded vs flat) is new to many hobbyists and lands well. |

## Page: Module 6 · Digital Processing & Formats · `#labpreview/DigitalModule/processing`

| Field | Finding |
|---|---|
| First look | Two small side-by-side panels: green wave "FLOAT INTERNAL PATH" and amber wave "FIXED-POINT RENDER (24-BIT)" with a red dashed "0 dBFS" line. Thinks: "two versions of the same thing; one is clipped". |
| Overwhelm | 4. Readouts FLOAT BUS / FIXED / TRIM, then four result boxes, then a range bar with "~±770 dB for 32-bit float", then "HOW A FLOAT NUMBER WORKS" with SIGN / EXPONENT / MANTISSA and a note about "IEEE-754", then MYTH, quiz. Dock: GAIN, TRIM, VALUE. |
| Knows what it is learning? | Partly. Card: "Why levels above 0 dBFS are safe while tracks are summed in floating point but clip in a fixed-point file…" Beginners do not know "summed", "floating point", "fixed-point file", or why a level "above 0" could exist. |
| Knows what to do first? | Yes: "Compare FLOAT BUS and FIXED… Turn TRIM on". Did it: left read "restored: −6.0 dBFS — intact", right "quieter — still clipped". Very clear result. But the page OPENS already over zero (+6), so they never see the moment it goes over; the cause is skipped. |
| Words they would not know | float / floating point, fixed-point, bus, render, 24-bit, TRIM, dBFS above zero, exponent, mantissa, decade, IEEE-754, DAW. |
| Follows / continues? | The TRIM step is followable. The float-number anatomy (VALUE key) is a separate maths lesson; they stop there. |
| What works | (1) Side-by-side "same bus, two fates" — perfect compare picture. (2) Result captions in plain words: "intact" vs "still clipped". (3) MYTH: "32-bit float means nothing can ever clip". |
| Suggestions | 1. (S) Open with GAIN at 0 dB and the card saying "Push GAIN above 0 and watch the right side flatten", so the student causes the problem before fixing it. 2. (S) One plain line under the panels: "Left = inside your recording software (can go over 0). Right = the file you export (cannot)." 3. (M) Move "HOW A FLOAT NUMBER WORKS" (VALUE key) to a fold "Extra: how the computer stores these numbers". 4. (S) Rename the dock key VALUE to "FLOAT NUMBER". |
| Hobbyist | Very relevant: many have seen red clip lights on a DAW bus and wondered. The 32-bit float myth is the hook. |

## Page: Module 7 · D-to-A Reconstruction · `#labpreview/DigitalModule/dac`

| Field | Finding |
|---|---|
| First look | A yellow sine passing through blue dots, with grey staircase steps behind it. Thinks: "the smooth line is the real sound, the steps are the digital version". Close to right. |
| Overwhelm | 4. Display readouts FS / MODE "STD" / LAYERS "4/4"; then a D-to-A chain diagram, an oversampling section with a "DRAWN SPECTRUM · SQUARE-ROOT FREQUENCY SCALE" and "FIRST IMAGE AT / FILTER TRANSITION", then an INTER-SAMPLE PEAK EXPLORER with SAMPLE PEAK / TRUE PEAK "dBTP" / METER MISSES. Dock: MODE, LAYERS, OS RATE, ISP FREQ, PHASE (5 keys, 3 of them abbreviations). With the LAYERS tray open plus the ISP FREQ lane open, the dock stack covers the lower third of the screen. |
| Knows what it is learning? | Partly. Card: "How a DAC turns samples back into one smooth, continuous wave, not a staircase, and why the true peak between samples can be higher than any sample." Two ideas; "DAC" is never spelled out on the page (only in the home guide). |
| Knows what to do first? | Partly. Card: "In LAYERS, turn off SAMPLES and ZOH and compare RECONSTRUCTED with ORIGINAL." But the dock opens on ISP FREQ (the second task), not LAYERS. Did it: turned off SAMPLES and ZOH — one yellow line remains. RECONSTRUCTED and ORIGINAL lie exactly on top of each other, so it LOOKS like one line went missing. That identity is the whole point of the module, but nothing on the display says "two lines, perfectly on top of each other". The card also says "TRUE PK … SAMPLE PK"; the page says TRUE PEAK / SAMPLE PEAK. |
| Words they would not know | DAC, ZOH ("zero-order hold"), band-limited interpolation, reconstruction filter, MODE STD, oversampling / OS RATE, "image", spectrum, √f, ISP, inter-sample peak, dBTP, true peak, PHASE, PCM. |
| Follows / continues? | The LAYERS part is followable with the card. The oversampling spectrum is a third idea and will lose them. The inter-sample-peak explorer is genuinely useful but sits deep in the scroll. |
| What works | (1) The layered picture (steps, dots, curve) with on/off toggles: the right way to bust the staircase myth. (2) "Not straight lines between dots. Not stair steps." — short and memorable. (3) SAMPLES (METER SEES) vs RECONSTRUCTED (DAC MAKES) labels in the ISP explorer: plain and exact. (4) "METER MISSES 0.08 dB" readout: tells you the consequence in words. |
| Suggestions | 1. (S) When only RECONSTRUCTED + ORIGINAL are on, flash a caption on the display: "Both lines are here — they sit exactly on top of each other." 2. (S) Open the dock on LAYERS (the card's first step), not ISP FREQ. 3. (S) Spell out ZOH as "HOLD STEPS" on the LAYERS chip; spell DAC once in the first paragraph. 4. (M) Fold the oversampling spectrum into "Extra: why converters run faster inside"; it is not needed for either of the two card goals. 5. (S) Rename dock keys: OS RATE → "OVERSAMPLE", ISP FREQ → "PEAK TEST FREQ", MODE STD → "MODE STANDARD". Match the card's words to the page's words (TRUE PEAK, not TRUE PK). |
| Hobbyist | The inter-sample peak explorer is exactly why mastering engineers use true-peak limiters; a hobbyist will value it but may never scroll down to it. |

## Page: Module 8 · Errors & Limits · `#labpreview/DigitalModule/errors`

| Field | Finding |
|---|---|
| First look | Two rows of tick marks at the top (IDEAL CLOCK green, WITH JITTER red), then a yellow sine with red dots and little blue whiskers. Thinks: "the red dots are wrong somehow". |
| Overwhelm | 4. The display itself is fine (one dock key: JITTER). The scroll well is the longest in the lab: jitter text, a "clock inside the audio" section (AES3, 110 Ω, XLR, S/PDIF, 75 Ω coax, RCA, TOSLINK, AES3id, BNC), a network section (Dante, AES67, Ethernet, PTP), WHEN IT GOES WRONG, then the full "MYTH vs REALITY" wall (with formulas like 6.02·24 + 1.76, TPDF, ENOB), then three CHECK YOURSELF quizzes. |
| Knows what it is learning? | Partly. Card: "What jitter is: a timing error in the sample clock that becomes a value error, biggest on steep slopes, and why one clock times a whole digital system." The lab home and the module list sell this module as "Myth vs reality … the misconception-busting heart of the lab", but the card only mentions jitter; the myth wall is unannounced. |
| Knows what to do first? | Yes: "Slide JITTER to the top and watch the whiskers grow on the steep parts." Did it: PEAK DEV went to ±8.0 ns and the whiskers grew; red dots shifted. The whiskers are very small at phone size, so "grow" is subtle. At 390 px the INTERVAL readout lost its label ("20.83 µs @48k" with no name). |
| Words they would not know | jitter, clock, ns, µs, slope, ADC/DAC, buffered, reclocked, AES3, Ω, S/PDIF, coax, TOSLINK, BNC, Dante, AES67, PTP, clock master, ENOB, TPDF, SNR. |
| Follows / continues? | They can do the jitter step. They will be lost in the cable-standards paragraph (8 standards and 3 impedances in 5 lines). The myth wall is the best ending of any module, but it is buried under the clock section. FINISH › takes them to WHAT'S LEFT (below). |
| What works | (1) "Measure the right voltage at the wrong moment and you store a wrong value" — a beginner-proof sentence. (2) "error ≈ slope × timing error" drawn as whiskers that are biggest on the steep parts. (3) WHEN IT GOES WRONG names what you HEAR (clicks, pops, dropouts) — real-world reason to care. (4) The third quiz (two clock masters → clicks) is practical. |
| Suggestions | 1. (M) Put MYTH vs REALITY FIRST in the scroll well (it is the review of the whole lab) and the cable/network standards last, behind a fold "For when you wire real gear". 2. (S) Add "and the big myths of digital audio" to the intro card, so the student knows the summary is here. 3. (S) Make the whiskers thicker or add a max-error readout in words ("biggest error: on the steep part"). 4. (S) Keep the INTERVAL label at phone width. SHARED (readout label drop). |
| Hobbyist | The cable/clocking section is the most useful part for anyone with an interface and a second digital device. The myth wall is great. |

## Page: WHAT'S LEFT (end screen, from Module 8 FINISH ›)

| Field | Finding |
|---|---|
| First look | Big title WHAT'S LEFT, a line "7 modules still to go…", then a list of module names with › arrows, a green "✓ 1 DONE", and big buttons PRACTICE AGAIN FROM THE START / DONE · BACK TO LABS / DISCUSS THIS LAB ›. |
| Overwhelm | 1. |
| Knows what it is learning? | The intro card says "A review of the digital chain: measuring time, measuring level, conversion, rebuilding the wave and timing errors". The page itself has NO review: it is a to-do list of module names. |
| Knows what to do first? | Yes: tap the first row. |
| Words they would not know | none. |
| Follows / continues? | Yes, clear exits. NOTE: I opened all 8 modules but each by a fresh deep link (a reload, guest session), so "7 still to go / 1 done" was an artifact of my reloads. Checked later in the member route: in these module labs a ✓ appears as soon as a module is OPENED (seen on the Gain lab home after opening Module 1), which matches the home guide ("A ✓ marks a module you've opened"). The Patchbay lab counts a page done only when its tasks are finished — two different meanings of "done" across labs (see G2_PatchbayLab.md). |
| What works | Exits are always open; "Practicing again, reviewing and leaving are always open." is reassuring. |
| Suggestions | 1. (M) Add a 4-line "What you now know" recap above the list (the home guide's `teaches` list is ready-made: "Time and level are measured separately…", "Digital audio is not stair steps…", "Clipping at or before the converter is permanent…"). SHARED (LabEndScreen) — every lab's end screen would gain from a recap slot. 2. (S) Make the intro card match the page ("Here is what you have not opened yet"), or make the page match the card. SHARED. |
| Hobbyist | Fine. |

## Page: LAB HOME · `labs/digital` (DigitalLabHomeScreen) — walked on screen (late in the run)

How reached: this home has no `#labpreview` route. Late in the run I set the dev-web member flag (`ape:dev:entitlement = academy`, the same dev toggle the pane's seed tab uses) in my own Chrome tab's storage for localhost:8142, then went Home → OPEN LABS → EXPLORE FUNDAMENTALS → Signal → "Digital Audio Systems" tile, exactly as a member would. (Restored at the end; see G2_PROGRESS.md.)

| Field | Finding |
|---|---|
| First look | TWO popups in a row before the page: first a glossary term card "Digital Audio" ("Digital audio is sound stored as a stream of numbers. To create it, the sound is measured many times per second and each measurement is saved as a number…", CONTINUE), then the lab intro card. Behind them: a row of small caps step words SOUND › ANALOG › SAMPLES › NUMBERS › PROCESSING › RECONSTRUCTION › AMPLIFIER › LOUDSPEAKER › SOUND (wraps to 2 lines at 390 px, not tappable), then a paragraph with 13 arrow-joined terms, then THE EIGHT MODULES. |
| Overwhelm | 3. The module list itself is calm; below it are 8 SECONDARY TOOLS chips (3 calculators + 5 shortcuts into modules) and 3 LEARNING chips, two of which (MYTH vs REALITY, KNOWLEDGE CHECKS) open the same Module 8. |
| Knows what it is learning? | Yes. The glossary card is the clearest plain-language sentence in the whole lab, and it comes first. Subtitle: "Explore how analog sound becomes digital data — and how digital data becomes sound again." Intro card: "sampling measures the wave in time, bit depth measures its level, and a converter rebuilds a smooth wave from the numbers." |
| Knows what to do first? | Yes per the card: "Read the top row from SOUND to SOUND… Then tap the first module's name… and tap OPEN". |
| Words they would not know | anti-aliasing filter, quantization, preamp, reconstruction, binary data (all in the first paragraph, before any module explains them); chips: DATA-RATE, BUFFER LATENCY, FFT RESOLUTION, DITHER COMPARATOR, TRUE-PEAK. |
| Follows / continues? | The module list is followable. The 11 chips look like 11 more things to do; a beginner cannot tell that 8 of them are doors into the same modules. |
| Hidden gem | The ⓘ GUIDED LESSON chip (last row, bottom of the page) opens an excellent plain overview: "In Foundations of Sound you saw sound as a wave of air pressure. Here you follow it into a computer and back out. A mic turns the pressure into a smooth voltage. A converter then measures that voltage in two separate ways: in time (sample rate) and in level (bit depth)…", then "WHAT YOU WILL UNDERSTAND" (4 bullets) and "CONTROLS". This is exactly what a newcomer needs first, and it is the last chip on the page. |
| What works | (1) The glossary term card on arrival. (2) The SOUND…SOUND chain row as a one-line map. (3) Accordion rows with a one-line blurb before OPEN. (4) The guided lesson text. |
| Suggestions | 1. (M) Put the GUIDED LESSON's first paragraph and "WHAT YOU WILL UNDERSTAND" at the TOP of the home (or make it the intro card's EXPLAIN button target), instead of a chip at the bottom. SHARED (every lab home has this chip). 2. (M) Fold SECONDARY TOOLS and LEARNING into one "Shortcuts" fold for first visits. 3. (S) Make the chain row tappable as the module index (SAMPLES → Module 2, NUMBERS → Module 4…). 4. (S) Cut the 13-arrow paragraph to one sentence. 5. (S) SHARED: two popups stack on first arrival (term card, then intro card); show the intro card only after the term card, with a visible "1 of 2"-style hint or merge them. |
| Hobbyist | Will jump straight to ALIASING EXPLORER or TRUE-PEAK EXPLORER; the chips serve them well. |

---

## DigitalLab — overall verdict

The beginner's journey: every module opens with a good intro card (WHAT YOU'RE LEARNING / WHERE TO START) and a first action that gives real, visible feedback (the alias turning red, the clip zone flipping, TRIM restoring one side). The pictures are honest and beautiful. But every module then stacks two or three further lessons (anti-alias filter, dither, oversampling, float anatomy, cable standards) into the same scroll well, written in caps captions full of abbreviations, so a newcomer finishes step 1 feeling smart and then hits a wall. Readout labels that vanish at phone width (INPUT / READS AS in M2, LEVEL in M4, INTERVAL in M8) take away the words the intro card just told them to look at. Without sound, the alias step (M2) is only half understood.

**3 biggest orientation problems**
1. One module = one display + 2–3 extra lessons in the scroll well (M2 filter, M3 dither, M6 float anatomy, M7 oversampling, M8 cable standards). Beginners cannot tell the core from the extras.
2. Abbreviations of words they do not know: FS (two meanings: full scale in M1, sample rate in M2/M7), TH. SNR, ANLG/DIG, ZOH, OS RATE, ISP FREQ, RESET REG, MODE STD, dBTP.
3. Readout labels dropped at 390 px exactly where the intro card names that readout (M4 LEVEL; M2 INPUT/READS AS mid-sweep).

**3 best things**
1. The intro card's two plain headings and one concrete first action on every module.
2. Feedback after the first action is real and in words (READS AS red, ZONE "A+D CLIP", "intact" vs "still clipped", METER MISSES).
3. MYTH / REALITY cards that name the exact beliefs beginners and hobbyists hold.

**"First 30 seconds" rewrite (lab home + Module 1)**
Home: "Your voice is air. A microphone turns it into electricity. This lab shows how a computer turns that electricity into numbers, and back into sound. 8 short steps. Start with Step 1." One big START button; the chain row below it doubles as the index; shortcuts folded away.
Module 1: keep the card; under the display, three glossed readouts ("PITCH 220 Hz · HEIGHT 0.75 of max · AVERAGE 0.53 of max"); everything after the MYTH card folded under "More detail".

