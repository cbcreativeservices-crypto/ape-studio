# G3 · CalcLab (Audio Calculator Laboratory): beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound off, tab-7.

How it was reached (and a choice I made, per the overnight rule): the harness hash `#calclabpreview` shows the home, but tapping any calculator there fails ("The action 'NAVIGATE' … 'CalcWorkspace' was not handled", console), because the harness registers no sibling screens. So I walked the lab in the **full app** at `http://localhost:8142/` → Home → OPEN CALCULATORS, which opens the real CalcLab and real workspace screens. Only normal taps and typed numbers; nothing shared or saved on purpose (SHARE / COPY RESULT, SAVE, SAVE RESULT, SHARE AS TEXT / IMAGE and ＋ NEW were not pressed). SEND → was pressed once (Mic Output & Preamp Gain) to see what chaining does; it only sets an in-app "chain" banner.

Scope: the home groups the 166 calculators into 10 subject sections (WAVES & TIME … ELECTRONICS); each section opens a popup list of "workspace" screens (56 in all), and each workspace holds several calculators chosen under WHAT ARE YOU CALCULATING?. **All 56 workspace screens were opened and used hands-on**, at least one calculator each (two or three in several), always typing the screen's own grey example values; plus the home, the four home extras (✓ "How this calculation is verified", π Symbol Key, Saved Projects, Saved Results), the Calculator Workflows list, and one full workflow run (Delay Speaker Setup, steps 1-3 + Results). Sections 1-10 below hold the first workspace of each section in full table form; "Every remaining workspace" below them covers the other 46 row by row. The workspaces share one screen design (YOUR ANSWER / FUNCTION / SIG FIGS / INPUTS / WHAT ARE YOU CALCULATING? / WHY THIS MATTERS / PRACTICAL EXAMPLE / COMMON MISTAKES / IN THE GLOSSARY, and one shared guide card), so the full-table judgement in Section 1 applies to all of them.

---

## Page 0 · Calculator Lab home
| Field | Finding |
|---|---|
| First look | Σ icon and title, a row of four small header icons (✓, π KEY, ⓘ), two folds (▸ CUSTOM CALCULATOR WORKFLOWS, ▾ ABOUT THIS LAB), then ten section cards each with a one-line note and "N CALCULATORS ›". Thinks: "a big toolbox, organised by topic". |
| Overwhelm | 2. Ten cards is a lot, but each has a plain note ("Frequency, wavelength, delay, phase — the physics under everything."). |
| Knows what it is learning? | Partly. ABOUT THIS LAB is clear ("Every calculator here shows the result AND the reasoning… Results can be SENT into another calculator"). The guide card says "How the everyday numbers of audio work … come from short formulas". A beginner still asks: "Which one do I need?" There is no "start here" or "most used". |
| Knows what to do first? | Yes with the guide ("Tap WAVES & TIME, open Sound & Wave and type 100 in FREQUENCY… PERIOD reads 10 ms"), a very good concrete first task. Without it, they would scroll the ten cards. |
| Words they would not know | dB, SPL, sensitivity, impedance, 70 V, latency, cents, modes, reverberation, Q, bandwidth, reactance, ampacity (all in the section notes). The ✓ icon in the header has no label. |
| Follows / continues? | Yes. A section card opens a popup list of workspaces with a ✕ (a popup, not a new page; good). |
| What works | Topic grouping with honest calculator counts; the ABOUT THIS LAB promise; the guide's concrete first task with the expected answer ("PERIOD reads 10 ms") so the learner knows they did it right. |
| Suggestions | 1. (S) Add a "START HERE — 3 calculators everyone uses" strip above the sections (e.g. Sound & Wave, dB ↔ ratio, Distance · Delay). 2. (S) Label the header icons in words on first visit (✓ = ?, π KEY = symbols key). 3. (S) In each section note, swap one jargon word for a plain one ("Q, bandwidth" → "how wide an EQ boost is"). |
| Hobbyist | Will go straight to the section they need (tempo / delay, dB). Likes the counts. |

## Section 1 · WAVES & TIME (20 calculators) · workspace used: **Sound & Wave**
Workspaces listed in the popup: Sound & Wave · Distance · Delay · Samples · Phase & Time Offset · Comb Filter · Analog Alignment · Intermodulation Products (each with a one-line subtitle like "Meters ↔ milliseconds ↔ samples").

| Field | Finding |
|---|---|
| First look | Header "SOUND & WAVE / Frequency · period · wavelength · speed of sound", then a box "YOUR ANSWER — PERIOD FROM FREQUENCY · Your answer appears here. Fill in the values below to calculate." Then FUNCTION, SIG FIGS 4 ▸, FORMULA / π KEY, INPUTS (FREQUENCY with a grey "100"), then WHAT ARE YOU CALCULATING? with six choices, each with its formula (T = 1 / f, λ = c / f, c = 331.3 · √(1 + T/273.15)…). |
| Overwhelm | 3. The answer box on top is right; but the choice of WHAT to calculate sits BELOW the inputs, and every choice shows a formula with Greek letters. |
| Knows what it is learning? | Yes once the result appears; the WHY THIS MATTERS and PRACTICAL EXAMPLE folds are excellent ("A 100 Hz tone at 20 °C… λ ≈ 3.43 m… why a mic 0.86 m from a wall notches near 100 Hz"). |
| Knows what to do first? | Partly. The guide says "Type the gray example value into each box". The grey "100" looks like a value already entered; a beginner waits for an answer that never comes. |
| Words they would not know | period, wavelength, λ, ω, SIG FIGS, Hz ⇄ (unit switch), "Frequencies hiding in a distance (reverse)", LFO, DSP, axial mode, ISO 3382. |
| Follows / continues? | Yes. Typing 100 gave at once: "PERIOD 10 ms ⇄ · SEND → · CYCLES PER SECOND 100 · ▸ WORKED STEPS · SHARE / COPY RESULT". Switching to "Wavelength from frequency" KEPT 100 Hz but showed no answer until AIR TEMPERATURE was typed, again because the grey "20" is only a hint. After typing 20: "WAVELENGTH λ 3.432 m · HALF WAVE λ/2 1.716 m · QUARTER WAVE λ/4 0.858 m · EIGHTH WAVE λ/8 0.429 m", each with SEND →. Instant, clear feedback. |
| What works | Answer first, reasoning below; live recalculation; WHY THIS MATTERS + PRACTICAL EXAMPLE + COMMON MISTAKES on every calculator (the best teaching content in the lab); the glossary chips that "keep your inputs" when opened; SEND → chaining. |
| Suggestions | 1. (S, applies to all workspaces) Pre-fill the example values (as real values, editable) OR show a one-tap "USE EXAMPLE" button; grey placeholders that look like entered numbers are the biggest first-use trap. 2. (S, all) Move WHAT ARE YOU CALCULATING? above INPUTS; the beginner chooses the question before typing. 3. (S, all) Hide the formulas in the choice list behind the π KEY (show plain names only: "How long is one cycle?", "How long is one wave in the air?"). 4. (S) "CYCLES PER SECOND 100" under the period result repeats the input in other words; label it "(your input)" or drop it. 5. (S) SIG FIGS needs a plain label ("decimal places shown"). |
| Hobbyist | Uses it for delay and quarter-wave absorber depth; loves the practical example. |

## Section 2 · LEVELS & DECIBELS (17 calculators) · workspace used: **Audio Level Converter**
Workspaces listed: Audio Level Converter · Compressor Math · Loudness Normalization · Loudness & True-Peak (BS.1770-5) (plus others in the registry for this section that the popup groups here).

| Field | Finding |
|---|---|
| First look | "AUDIO LEVEL CONVERTER / dBu · dBV · voltage · amplitude & power ratios", YOUR ANSWER box, one input LEVEL (dBu) with grey "4", then **ten** choices under WHAT ARE YOU CALCULATING? each with a log formula. |
| Overwhelm | 4. Ten functions; the words dBu, dBV, dBFS, dBm all within one screen. The intro line ("The translator between the meter and the wire") is excellent, but it sits under FUNCTION / SIG FIGS / FORMULA. |
| Knows what it is learning? | Partly: "levels in dB vs real volts". The WHY THIS MATTERS ("the ~12 dB gap between pro and consumer gear") gives a real reason to care. |
| Knows what to do first? | Partly (same grey-placeholder trap). |
| Words they would not know | dB, dBu, dBV, dBFS, dBm, RMS, amplitude vs power ratio, log10, gain staging, alignment level. |
| Follows / continues? | Yes. 4 dBu → "VOLTAGE (RMS) 1.228 V · SEND → · SAME LEVEL IN dBV 1.782 dB". (Small: the second line is labelled dBV but its unit reads "dB".) Switching to "dB from an AMPLITUDE ratio" and typing −2 gave a clear refusal in words, twice: "⚠ AMPLITUDE RATIO can't be negative — enter a positive value." and "⚠ Can't be negative." under the field. Good recovery. |
| What works | Refusing impossible input in plain words; COMMON MISTAKES that name the classic traps (10 vs 20·log10; "+3 dB is not twice as loud"); the honest note that dBFS cannot be converted to volts here. |
| Suggestions | 1. (S) Show the unit as "dBV" on the SAME LEVEL IN dBV line. 2. (M) Split the ten functions into two groups with headings: "Levels ↔ volts" (dBu, dBV) and "Ratios ↔ dB". 3. (S) A one-line "What is a dB?" link at the very top for first-timers (the glossary chip is at the bottom). |
| Hobbyist | The +4 dBu / −10 dBV explanation is the single most useful thing for an interface owner. |

## Section 3 · SPL & HEARING SAFETY (13 calculators) · workspace used: **SPL & Distance**
Workspaces listed: SPL & Distance · Adding Sound Sources · Exposure & Allowable Time.

| Field | Finding |
|---|---|
| First look | "SPL & DISTANCE / Inverse square · line sources · custom falloff · required source level", inputs KNOWN LEVEL L₁ (grey 100), REFERENCE DISTANCE d₁ (grey 1), NEW DISTANCE d₂ (grey 8). |
| Overwhelm | 3. Subscripts (L₁, d₁, d₂) look like maths homework; four functions with log formulas. |
| Knows what it is learning? | Yes: "How level changes as you move toward or away from a source." Plain and clear. |
| Knows what to do first? | Partly (grey placeholders again). |
| Words they would not know | SPL, inverse square, line source, falloff, free-field, critical distance, reverberant field. |
| Follows / continues? | Yes. 100 / 1 / 8 → "LEVEL AT d₂ 81.94 dB SPL · CHANGE −18.06 dB". |
| What works | "−6 dB per doubling of distance" stated next to the formula; the honest model note ("Treat these results as the classroom model, never as a venue prediction"); the practical example (100 dB at 2 m → 16 m). |
| Suggestions | 1. (S) Replace subscripts in labels with words ("Level you know", "…measured at (m)", "New distance (m)"); keep L₁ in the formula only. 2. (S) After the result, a plain comparison: "−18 dB ≈ a bit less than a quarter as loud". |
| Hobbyist | Useful for monitor placement. |

## Section 4 · SPEAKERS & POWER (28 calculators) · workspace used: **Loudspeaker SPL & Amplifier Power**
Workspaces listed: Power · Voltage · Current · Impedance · Limiter Threshold · Loudspeaker SPL & Amplifier Power · Speaker Impedance Combinations · Speaker Cable Loss · Constant-Voltage (70 V / 100 V) Systems · Crossover Components · Line-Array & Polar · Driver Excursion & Enclosures.

| Field | Finding |
|---|---|
| First look | "Sensitivity · power · distance · headroom → will it be loud enough?" A question a beginner actually has. Five inputs (SENSITIVITY dB SPL (1W/1m), AMPLIFIER POWER W, LISTENING DISTANCE m, HEADROOM dB, NUMBER OF SPEAKERS). |
| Overwhelm | 3. Five inputs, three functions. |
| Knows what it is learning? | Yes; the subtitle is the best in the lab. |
| Knows what to do first? | Partly. **I filled four of the five boxes and left NUMBER OF SPEAKERS showing its grey "1": no answer appeared, and the box still said only "Your answer appears here. Fill in the values below to calculate." Nothing said which box was missing.** A beginner who thinks the grey 1 counts will decide the calculator is broken. |
| Words they would not know | sensitivity (1W/1m), headroom, free-field, reverberant support. |
| Follows / continues? | After typing 1: "PREDICTED SPL (one speaker, after headroom) 97.99 dB SPL · SPL AT 1 m (after headroom, before distance loss) 118 dB SPL". But the subtitle asked "will it be loud enough?" and the answer is a bare number; a beginner cannot tell whether 98 dB is loud. |
| What works | The question-shaped subtitle; the practical example that ends in a verdict ("One box cannot do that — which is exactly the answer this workspace exists to give you before load-in"); the reverse function (required amplifier power). |
| Suggestions | 1. (M, all workspaces) When inputs are missing, name them: "Still needed: NUMBER OF SPEAKERS". 2. (S) Add a plain-language anchor next to SPL results ("≈ 98 dB SPL: a loud club; long exposure needs hearing protection"), linking to the SPL & Hearing Safety section. 3. (S) "SIG FIGS 4" makes "97.99" look precise for a rough model; 3 figures ("98.0") may read more honestly on this one. |
| Hobbyist | Exactly the "is my PA enough?" question; they will love the reverse mode. |

## Section 5 · MICS & RECORDING (10 calculators) · workspace used: **Mic Output & Preamp Gain**
Workspaces listed: Mic Output & Preamp Gain · Stereo-Mic Geometry · Mic Sensitivity Converter · RF & Link Budget.

| Field | Finding |
|---|---|
| First look | "Sensitivity → voltage → dBu → gain: the whole input chain"; two inputs MIC SENSITIVITY (mV/Pa) (grey 2) and SOURCE SPL AT THE MIC (grey 94). |
| Overwhelm | 3. Few inputs, but mV/Pa, 20 µPa and dBV/dBu appear immediately. |
| Knows what it is learning? | Yes: "how much gain my preamp needs". WHY THIS MATTERS ("a dynamic mic on a quiet source can need 60+ dB while a condenser on a drum needs 10") is a perfect reason to care. |
| Knows what to do first? | Partly (grey placeholders). |
| Words they would not know | sensitivity (mV/Pa), pascal, preamp gain, pad, dBV / dBu, converter. |
| Follows / continues? | Yes: 2 / 94 → "OUTPUT VOLTAGE 2.005 mV · OUTPUT LEVEL (dBV) −53.96 dB · OUTPUT LEVEL (dBu) −51.74 dB". **SEND → test:** pressing SEND → on the dBu line put a banner mid-page ("CHAIN: OUTPUT LEVEL (dBu) from Mic Output & Preamp Gain is ready — any matching input offers 'USE'. ✕ CLEAR"). Switching to "Required preamp gain to a target level" offered no USE anywhere, and the same banner then followed me into every other workspace I opened (File Size, BPM, Room Modes, Q, Voltage Drop…) where nothing could use it. |
| What works | The chain idea, and the practical example that ends with a usable number ("needs ≈ 56 dB of gain"). |
| Suggestions | 1. (M) After SEND →, tell the learner where it can go ("Use it in: Required preamp gain › Limiter Threshold ›") right at the button, and hide the banner in workspaces with no matching input. 2. (S) Units: the dBV / dBu lines read "dB" (label in brackets); show "dBV" / "dBu" as the unit. 3. (S) Explain mV/Pa once ("how many millivolts the mic gives for a standard loud-ish sound, 94 dB"). |
| Hobbyist | The most practical workspace for a home recordist. |

## Section 6 · DIGITAL AUDIO (23 calculators) · workspace used: **File Size & Recording Time**
Workspaces listed: Buffer & Round-Trip Latency · FFT & Frequency Resolution · File Size & Recording Time · Clock Drift · Network-Audio Bandwidth · Timecode · FIR Filter Length · Convolution Resources · Bit Depth · Dynamic Range.

| Field | Finding |
|---|---|
| First look | "How big audio files get and how long a card or drive lasts." Inputs SAMPLE RATE (kHz), BIT DEPTH (bit), CHANNELS, DURATION (min). Everyday and concrete. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Partly (placeholders). |
| Words they would not know | PCM, sample rate, bit depth, kbit/s vs MB (bits vs bytes is explained in COMMON MISTAKES). |
| Follows / continues? | Yes: 48 / 24 / 2 / 60 → "FILE SIZE 1037 MB · DATA RATE 2304 kbit/s · PER MINUTE 17.28 MB · PER HOUR 1.037 GB". Clear. |
| What works | A question everyone has ("will my card last the gig?"); the practical example ("A 64 GB card holds … ≈ 61.7 hours"). |
| Suggestions | 1. (S) Offer the common formats as one-tap presets (44.1/16, 48/24, 96/24) so a beginner doesn't have to know the numbers. 2. (S) "1037 MB" and "1.037 GB" are the same number twice; show one. |
| Hobbyist | Will use it. |

## Section 7 · MUSIC & PRODUCTION (8 calculators) · workspace used: **BPM & Delay Time**
Workspaces listed: BPM & Delay Time · Pitch · Note · Cents.

| Field | Finding |
|---|---|
| First look | "Tempo → delay times · LFO rates · pre-delay", one input TEMPO (BPM). |
| Overwhelm | 1. |
| Knows what it is learning? | Yes: "set my delay to the song's tempo". |
| Knows what to do first? | Yes (one box). |
| Words they would not know | LFO, pre-delay, dotted, triplet. |
| Follows / continues? | Yes: 120 → "ONE BEAT (QUARTER NOTE) 500 ms · DOTTED 8TH 375 ms · 8TH-NOTE TRIPLET 166.7 ms · ONE BAR OF 4/4 2000 ms" plus a full table (whole → 32nd × straight / dotted / triplet). The best result layout in the lab. |
| What works | One input, many useful outputs, a table a musician can read; "A delay set to a musical division sits IN the groove". |
| Suggestions | 1. (S) A TAP TEMPO button would let a beginner find BPM by ear (fits the "BPM from a measured interval" reverse function). |
| Hobbyist | Daily use. |

## Section 8 · ROOMS & ACOUSTICS (21 calculators) · workspace used: **Room Modes (Axial)**
Workspaces listed: Room Modes (Axial) · Reverberation Time (Sabine) · Acoustic Treatment Planner · Critical Distance · Schroeder Frequency · Boundary Interference · Reflection Path · Eyring & Millington RT · QRD Diffuser · Panel & Helmholtz Absorbers · Transmission Loss.

| Field | Finding |
|---|---|
| First look | "Axial standing waves from room dimensions"; inputs ROOM LENGTH, WIDTH, CEILING HEIGHT, AIR TEMPERATURE. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "where the low end of the room will peak, null, and ring". |
| Knows what to do first? | Yes (room dimensions are something everyone can measure). |
| Words they would not know | axial, standing wave, mode, (1,0,0) notation, Schroeder, Sabine, RT60, SBIR, QRD, Helmholtz (in the list). |
| Follows / continues? | Yes: 5 / 4 / 2.5 / 20 → three fundamentals and two plain-word warnings: "NEAR-COINCIDENT L2 (68.64 Hz) and H1 (68.64 Hz) sit within 5% — expect a stronger buildup there." plus a sorted table of all modes. |
| What works | The verdict in words ("expect a stronger buildup there"): the kind of interpretation the rest of the lab mostly lacks. |
| Suggestions | 1. (S) Replace "(1,0,0)" with "(length)" in the result labels. 2. (S) Add a small bar chart of the modes along a frequency line so clusters and gaps are visible at a glance. |
| Hobbyist | Very useful for a bedroom studio. |

## Section 9 · FILTERS & EQ (6 calculators) · workspace used: **Q · Bandwidth · Band Edges** (the only workspace in this section)

| Field | Finding |
|---|---|
| First look | "What a filter's Q knob actually means"; inputs LOWER FREQUENCY, UPPER FREQUENCY. Six functions with formulas like f1,f2 = fc·(√(1+1/4Q²) ∓ 1/2Q). |
| Overwhelm | 3 (the formulas). |
| Knows what it is learning? | Yes: "how wide is my EQ bell". |
| Knows what to do first? | Partly. |
| Words they would not know | Q, bandwidth, geometric mean, octave, −3 dB edges, parametric. |
| Follows / continues? | Yes: 100 / 400 → "CENTER FREQUENCY (geometric) 200 Hz · ARITHMETIC AVERAGE (for contrast) 250 Hz · WIDTH IN OCTAVES 2 · BANDWIDTH 300 Hz · Q OF THIS BAND 0.6667". Showing the "wrong" average for contrast is excellent teaching. |
| What works | The contrast line; "Q 1.41 ≈ one octave" in WHY THIS MATTERS. |
| Suggestions | 1. (M) A small drawn EQ bell with the two edges and the centre marked would make Q visible; this is the one workspace that most needs a picture. |
| Hobbyist | Useful; they know Q from their EQ plug-in. |

## Section 10 · ELECTRONICS (20 calculators) · ALL 7 workspaces walked
| Workspace | What I typed → what it showed | Beginner notes |
|---|---|---|
| Basic Electronics | Series resistance 8, 8, 16 → "TOTAL RESISTANCE 32 Ω"; switched to Parallel → "3.2 Ω" (inputs kept: good). | One comma-separated box is clever but unusual; seven functions. No drawing of series vs parallel. |
| Transformer Ratios | 600 / 150 Ω → "TURNS RATIO (N:1) 2 · VOLTAGE RATIO 2 · CURRENT RATIO 2 · IMPEDANCE RATIO 4". | Ratios shown as bare numbers ("2"); "2 : 1" would read better. |
| Pads & Attenuators | 20 dB / 600 Ω → "SERIES ARMS R1 = R2 490.9 Ω · SHUNT R3 121.2 Ω · MULTIPLIER K 10". | **No circuit drawing**: a beginner cannot tell where R1, R2, R3 go in a "T" or "Pi". |
| Voltage Drop | 16 AWG / 30 m / 3 A / 48 V / 75 °C → "ROUND-TRIP RESISTANCE 0.9613 Ω · VOLTAGE DROP 2.884 V · DROP AS PERCENT 6.008 % · VOLTAGE AT LOAD 45.12 V · POWER LOST IN CABLE 8.652 W". | No verdict: is 6% acceptable? AWG only (no mm²) while length is in metres. |
| Rack Power & Heat | 800 W / 120 V / 10 °F → "AC CURRENT 6.667 A · HEAT OUTPUT (BTU/hr) 2730 · COOLING AIRFLOW (CFM) 252.8". | US units (°F, BTU/hr, CFM, 120 V) while other workspaces use °C and metres. |
| Complex Impedance | 8 Ω / 1 mH / 10 µF / 1000 Hz → "|Z| 12.52 Ω · PHASE ANGLE −50.29° · XL 6.283 Ω · XC 15.92 Ω". | Never says whether R, L and C are in series or parallel. |
| Conductor Ampacity (NEC) | 12 AWG / 90 / 60 / 30 / 3 → "TABLE 310.16 AMPACITY 30 A … TERMINATION LIMIT 20 A · ALLOWABLE 20 A · MAX OVERCURRENT DEVICE 20 A · MAX CONTINUOUS LOAD 16 A" plus a plain WHICH TERMINAL RATING note. Then I typed an impossible size, 50 → "⚠ CONDUCTOR SIZE (AWG) must be from -3 to 18." | Refused in words (good, D53) but the words say "**-3 to 18**" while the function is titled "14 AWG – 4/0": a beginner has never seen a negative wire gauge. Say "from 18 AWG down to 4/0 (type 4/0 as …)". |

Section verdict: the electronics workspaces are accurate and well explained in text, but they are the ones that most need a small schematic (pads, series/parallel, RLC) and a one-line verdict ("6% drop: more than the usual 3-5% target").

---

# Every remaining workspace, walked one by one (coordinator: no depth cuts)
Each row: what I typed (always the screen's own grey example values, typed for real), what YOUR ANSWER showed, and the beginner's main snag. All share the workspace layout judged in Section 1.

## WAVES & TIME: all 6 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| Sound & Wave | (Section 1 above) | |
| Distance · Delay · Samples | 30 m, 20 °C → "DELAY 87.41 ms · SAME DELAY 87410 µs · SPEED OF SOUND USED 343.2 m/s" + a samples table at 44.1 / 48 / 96 kHz ("3855 / 4196 / 8391"). | Clear and useful. The intro ("Sound in air, time on the clock, and samples in the box are three views of the same journey") is excellent. |
| Phase & Time Offset | 1000 Hz, 0.5 ms → "PHASE (WRAPPED 0–360°) 180° · FULL CYCLES LATE 0 · TOTAL PHASE ROTATION 180°". | 180° is the moment two copies cancel, but the result does not say so. Add a one-word verdict ("180° = opposite: they cancel at this frequency"). "Wrapped" is jargon. |
| Comb Filter | 0.5 ms → "FIRST NULL 1000 Hz · NULL/NULL SPACING 2000 Hz · FIRST PEAK 2000 Hz" + a table of 8 nulls and peaks. | The table headers are formulas ("NULL (2k−1)/(2Δt)", "PEAK k/Δt"). Plain headers ("Dip" / "Boost") and a small comb drawing would make the idea visible. |
| Analog Alignment | 1.2 m, 20 °C, 48000 → "DELAY TO ALIGN 3.496 ms · DELAY IN SAMPLES 167.83 samples". | Never says WHICH source gets the delay (the nearer one). Sample rate is typed as "48000" here but as "48" (kHz) in File Size: same quantity, two conventions. |
| Intermodulation Products | 19000 / 20000 Hz → "2ND-ORDER DIFFERENCE 1000 Hz · SUM 39000 Hz · 3RD-ORDER LOWER 18000 Hz · UPPER 21000 Hz" + a products table. | The key lesson of this example (two inaudible-ish high tones make an AUDIBLE 1 kHz tone) is not stated in the result; flag which products fall inside 20 Hz–20 kHz. |

## LEVELS & DECIBELS: all 4 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| Audio Level Converter | (Section 2 above) | |
| Compressor Math | −20 / 4 / −8 → "OUTPUT LEVEL −17 dB · GAIN REDUCTION 9 dB · INPUT ABOVE THRESHOLD 12 dB". | Clear arithmetic; the intro ("lets only 1/ratio of every extra decibel through") is the best plain explanation of ratio I have seen. A small input→output line drawing (knee) would make it stick. Units read only "dB" (dB of what?). |
| Loudness Normalization | −9 / −14 / −0.5 / −1 → "GAIN CHANGE −5 dB · RESULTING TRUE PEAK −5.5 · HEADROOM TO CEILING 4.5 dB" + a COMMON LOUDNESS TARGETS table (Spotify −14 LUFS, Apple Music −16, YouTube about −14 … each with source and date). | The targets table with "Playback level — loud tracks are turned down; not a mastering requirement" is excellent myth-busting. LUFS / dBTP / true peak are not defined on the face of the page. |
| Loudness & True-Peak (BS.1770-5) | 48000 → "MOMENTARY WINDOW (400 ms) 19200 samples · SHORT-TERM WINDOW (3 s) 144000 samples · BLOCK STEP 4800 samples". Switched to "Loudness difference & perceived ratio", −14 / −20 → "DIFFERENCE (LU) 6 · PERCEIVED LOUDNESS RATIO 1.516× · WHICH SOUNDS LOUDER: A sounds about 1.516× as loud as B." | The default function (window sizes in samples) is the least useful for a beginner; the second one ends in a plain sentence verdict ("A sounds about 1.516× as loud as B"), which is the model every workspace should follow. Open on that one. "BS.1770-5", "K-weighting", "gating" in the title and intro. |

## SPL & HEARING SAFETY: all 3 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| SPL & Distance | (Section 3 above) | |
| Adding Sound Sources | "95, 92, 88" → "COMBINED LEVEL 97.31 dB SPL · INCREASE OVER LOUDEST: The sum sits 2.306 dB above the loudest single source (95 dB SPL)." + a share-of-energy table (58.8% / 29.5% / 11.7%). | Excellent: the sentence verdict and the share table make "decibels don't add" visible. The intro's "uncorrelated" needs a plain gloss ("different sounds, not copies of the same one"). |
| Exposure & Allowable Time | 94 dBA, NIOSH-style → "ALLOWABLE TIME 60 min · CRITERION: … Every 3 dB above 85 halves the time." Then the same 94 dBA under OSHA-style → "275.7 min · … Every 5 dB above 90 halves the time." | The honest "criterion always shown" is right, but a beginner now holds two answers for the same sound (1 hour vs 4.6 hours) and is never told which one to protect their hearing by. Add one plain line: "For your own hearing, use the NIOSH-style figure (the more protective recommendation); the OSHA figure is a US workplace legal limit." Five functions with dose formulas (Σ tᵢ/Tᵢ) are heavy for a safety tool aimed at everyone. |

## SPEAKERS & POWER: all 9 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| Loudspeaker SPL & Amplifier Power | (Section 4 above) | |
| Power · Voltage · Current · Impedance | 28.3 V RMS / 8 Ω → "POWER 100.1 W · CURRENT 3.538 A". | Seven functions incl. RMS / peak / peak-to-peak; "RMS" is never glossed on the face. Clear result. |
| Limiter Threshold | 500 W / 8 Ω → "MAX CONTINUOUS VOLTAGE 63.25 V · AS A LEVEL (dBu) 38.24 dB"; then "Processor limiter threshold" kept 500 / 8 and asked for two more boxes; 32 dB / 3 dB → "THRESHOLD (dBu) 3.239 dB · (dBV) 1.021 dB · VOLTAGE 1.125 V" + "WHAT THIS IS: An RMS/average protection starting point…" + "AMP INPUT KNOBS: This assumes the amp's input knobs … sit where its gain spec was measured…". | The WHAT THIS IS / AMP INPUT KNOBS notes are exactly the plain interpretation beginners need. Unit labels again "dB" instead of "dBu"/"dBV". |
| Speaker Impedance Combinations | "8, 8, 4" parallel → "TOTAL 2 Ω · POWER SHARE 25% / 25% / 50% · AMPLIFIER LOAD WARNING: Ztot = 2 Ω is below most amplifiers' 4 Ω rating — check the amp before wiring this." | Excellent: a warning in words. A small series vs parallel wiring drawing would help first-timers. |
| Speaker Cable Loss | 30 m / 16 AWG / 8 Ω / 500 W → "LOOP RESISTANCE 0.7905 Ω · LEVEL LOSS −0.8184 dB · POWER LOST 8.992 % · WATTS HEATING THE CABLE 44.96 W · DAMPING-FACTOR CEILING: …limits system damping factor to ~10.1". | Gauge in AWG only, length in metres. No "is this acceptable?" verdict for 0.8 dB / 9%. "Damping factor" unexplained on the face. |
| Constant-Voltage (70 V / 100 V) Systems | Twelve "10" taps typed as a comma list, 250 W, 70.7 V, 1 dB → "SYSTEM LOAD (12 speakers) 120 W · SUGGESTED AMP ≥ 151.1 W · REMAINING 130 W · AMP USED 48 % · LINE CURRENT 1.697 A". | Typing twelve "10"s is tedious; allow "12 × 10". "AMP USED 48%" is a nice plain gauge. |
| Crossover Components | 2500 Hz / 8 Ω → "CAPACITOR (µF) — high-pass 7.958 · INDUCTOR (mH) — low-pass 0.5093". | Never says which part goes to the tweeter and which to the woofer, and no circuit picture; a beginner cannot build or picture it. |
| Line-Array & Polar | 2 m / 20 °C → "DIRECTIVITY ONSET (L = λ) 171.6 Hz · TIGHT CONTROL ABOVE (L = 2λ) 343.2 Hz". | "L = λ" labels assume the formula is known; "directivity" not glossed. |
| Driver Excursion & Enclosures | 0.05 m² / 5 mm / 40 Hz / 1 m → "MAX SPL AT DISTANCE 100.6 dB SPL · PEAK VOLUME DISPLACEMENT 250 cm³". | Cone area in m² (0.05) where a beginner knows "a 12-inch woofer"; offer a driver-size picker. Sd / Xmax jargon. |

## MICS & RECORDING: all 4 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| Mic Output & Preamp Gain | (Section 5 above) | |
| Stereo-Mic Geometry | 40 cm / 30° / 20 °C → "PATH DIFFERENCE 20 cm · ARRIVAL DELAY Δt 0.5827 ms · FIRST MONO COMB NULL 858 Hz". | "Source angle 30°" measured from where? A tiny top-down drawing (two mics, a source, the angle) is needed. Good link to the comb idea. |
| Mic Sensitivity Converter | 15 mV/Pa → "SENSITIVITY (dBV/Pa) −36.48". | **The answer heading is upper-cased to "YOUR ANSWER — MV/PA → dBV/PA"**: "MV" reads as megavolts. Keep unit case (mV) in headings. |
| RF & Link Budget | 50 m / 550 MHz → "FREE-SPACE PATH LOSS 61.23 dB · WAVELENGTH 54.51 cm". | The question a wireless-mic user has ("will my link work?") is the second function (link margin); the default gives a bare loss number with no verdict. Open on link margin, or add "this alone doesn't tell you if it works — see Link margin ›". |

## DIGITAL AUDIO: all 9 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| File Size & Recording Time | (Section 6 above) | |
| Buffer & Round-Trip Latency | 128 / 48 kHz → "BUFFER LATENCY 2.667 ms · BUFFERS PER SECOND 375". Switched to "Round-trip monitoring latency": the 128 I had typed did not carry into the new INPUT BUFFER / OUTPUT BUFFER boxes (different fields); typed 128 / 128 / 1.5 → "ROUND-TRIP LATENCY 6.833 ms · 328 samples · INPUT / OUTPUT / PROCESSING 2.667 + 2.667 + 1.5 ms". | Subtitle promises "what the artist feels", but no verdict on whether 6.8 ms is felt. One line ("under about 10 ms most performers don't notice") would answer the real question. The round-trip function should be the default. |
| FFT & Frequency Resolution | 4096 / 48 / 100 → "BIN SPACING 11.72 Hz · WINDOW DURATION 85.33 ms · CYCLES OF YOUR FREQUENCY IN THE WINDOW 8.533". | FFT, bins, window: all unexplained on the face; the intro's "you cannot have sharp frequency detail and sharp timing from the same transform" is a good plain hook. |
| Clock Drift | 48000 Hz / 50 ppm / 60 min → "SAMPLES SLIPPED 8640 · TIME ERROR 180 ms · TIME PER 1-SAMPLE SLIP 416.7 ms". | Sample rate is entered in **Hz (48000)** here and in Network / FIR / Convolution / Alignment, but in **kHz (48)** in File Size, Buffer and FFT. Pick one. "ppm" needs a gloss. |
| Network-Audio Bandwidth | 64 ch / 48000 / 24 → "RAW DATA RATE 73.73 Mbit/s · PER-CHANNEL 1.152 Mbit/s · RAW BYTES PER SECOND 9.216 MB/s". | No verdict ("fits on a 100 Mbit link? a gigabit link?"), which is the question a beginner has. |
| Timecode | 9000 frames / 25 fps → "TOTAL TIME 360 s · WHOLE SECONDS 360 s · TIMECODE 00 : 06 : 00 : 00". | Clear. "SMPTE", "pulldown", "29.97" need a gloss; "TOTAL TIME" and "WHOLE SECONDS" repeat the same 360 s. |
| FIR Filter Length | 48000 / 100 / 60 → "FILTER TAPS (N) 1310 · LATENCY 13.64 ms · LATENCY IN SAMPLES 654.5 samples". | Specialist page (linear-phase, taps, stopband); fine for a hobbyist-plus. A half sample ("654.5 samples") puzzles a beginner who thinks samples are whole; a short note would help. |
| Convolution Resources | 2 s / 48000 / 2 → "IR LENGTH IN TAPS 96000 samples · DIRECT-FORM LOAD (GMAC/s) 9.216 · IR MEMORY (32-bit float) 0.768 MB". | "GMAC/s" means nothing to a beginner; compare to something ("about what one laptop core can do"). |
| Bit Depth · Dynamic Range | 24 → "THEORETICAL SNR 146.3 dB · DYNAMIC RANGE 144.5 dB · SNR WITH TPDF DITHER 141.5 dB · QUANTIZATION LEVELS 2^N **1.678e7**". | "1.678e7" is calculator notation; write "16.8 million". TPDF dither unexplained. The intro ("Each bit … adds about 6 dB") is excellent. |

## MUSIC & PRODUCTION: both workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| BPM & Delay Time | (Section 7 above) | |
| Pitch · Note · Cents | 452 Hz / A4 440 → "NEAREST NOTE A4 (MIDI 69) · TUNING OFFSET 46.6 cents sharp of A4 · CENTS OFF 46.58 cents · EXACT A4 440 Hz · ADJACENT NOTES G#4 = 415.3 Hz below · A#4 = 466.2 Hz above." | Very good: sentence verdicts ("46.6 cents sharp of A4") and neighbours. Define "cent" once ("1/100 of a semitone; about 5-10 cents is where trained ears notice"). |

## ROOMS & ACOUSTICS: all 11 workspaces
| Workspace | Typed → shown | Beginner notes |
|---|---|---|
| Room Modes (Axial) | (Section 8 above) | |
| Reverberation Time (Sabine) | 100 m³ / A 54 → "RT60 0.2981 s". | A bare number: is 0.3 s dead or live? Add a band ("0.2-0.4 s: typical control room; 1-2 s: church"). "TOTAL ABSORPTION A = 54" has no unit a beginner can relate to (m² sabins); they cannot know their own room's A. |
| Acoustic Treatment Planner | 150 / 1.2 / 0.5 / 2.88 / 0.9 → "ABSORPTION TO ADD ΔA 28.18 m² · PANELS NEEDED 11 · PREDICTED RT60 WITH 11 PANELS 0.4965 s". | The best "shopping answer" in the lab (a whole number of panels). But it needs CURRENT RT60, which a beginner cannot know; link "measure it with the RT tool ›" or "estimate it from the Sabine workspace ›". |
| Critical Distance | 300 / 0.8 / Q 1 → "CRITICAL DISTANCE Dc 1.096 m · Dc IN FEET 3.596 ft". | Clear intro ("Closer than Dc you hear mostly the source; farther, mostly the room"). "DIRECTIVITY (Q)" reuses the letter Q that means filter width in FILTERS & EQ; say "speaker directivity factor (not EQ Q)". |
| Schroeder Frequency | 50 m³ / 0.4 s → "SCHROEDER FREQUENCY 178.9 Hz · MODAL REGION (below) 178.9 Hz". | The second line repeats the same number; say "Below 178.9 Hz: treat with bass traps / placement; above: absorption and diffusion" (a verdict that tells the learner what to do). |
| Boundary Interference | 0.6 m → "FIRST CANCELLATION 143 Hz · FIRST REINFORCEMENT 286 Hz · SECOND CANCELLATION 429 Hz · SECOND REINFORCEMENT 572 Hz". | Practical and clear; COMMON MISTAKES ("Trying to EQ a boundary dip back…") is exactly the beginner trap. A one-line "move the speaker closer than X or farther than Y" would turn it into an action. |
| Reflection Path | 0.3 / 0.75 m → "PATH DIFFERENCE 0.45 m · ARRIVAL DELAY 1.311 ms · COMB SPACING 762.7 Hz · FIRST NULL 381.3 Hz". Then direct 1 m (longer than the reflection) → "NOT A REFLECTION: The reflected path (0.75 m) is shorter than the direct path (1 m). A reflection goes source → surface → listener, so it can never arrive by a shorter route than the straight line — check which distance is which." | **The best impossible-input message in the lab** (D53 done right): it names the mistake, explains the physics and tells the learner what to check. Use it as the model for the AWG "-3 to 18" message. |
| Eyring & Millington RT | 120 / 160 / 0.3 → "RT60 (EYRING) 0.3385 s · RT60 (SABINE) 0.4025 s · SABINE OVER-ESTIMATE 18.89 %". | Good side-by-side; "−ln(1−ā)" in the intro is pure maths for a beginner. |
| QRD Diffuser | 7 / 500 / 5 / 20 → "DEEPEST WELL 19.61 cm · LOW EDGE 500 Hz · HIGH EDGE 3432 Hz · TOTAL PANEL WIDTH 35 cm" + a well-by-well depth table. Then N = 8 → "⚠ 8 is not a prime number (or is above 199), so this is no quadratic-residue diffuser. Use a prime such as 7, 11, 13 or 17." | Excellent refusal with suggestions. The depth table begs for a little drawing of the wells (a DIY builder would cut from it). "n² mod N" in the intro is explained ("the remainder after dividing n² by N"): good. |
| Panel & Helmholtz Absorbers | 5 kg/m² / 5 cm → "RESONANT FREQUENCY 119.9 Hz · USEFUL BAND (≈ ±½ oct) 84.77–169.5 Hz". | A beginner has "a sheet of 6 mm plywood", not a kg/m² figure; a material picker (plywood / MDF / plasterboard) would make this usable. |
| Transmission Loss | 25 kg/m² / 125 Hz → "TRANSMISSION LOSS 22.9 dB · TL ONE OCTAVE UP 28.92 dB" + a table 125 Hz-4 kHz. | Same kg/m² issue; also no plain anchor ("23 dB: you will still clearly hear a drum kit next door"). |

## Home extras and the Calculator Workflows (reached from the home)
| Screen | What I did → what it showed | Beginner notes |
|---|---|---|
| ✓ (header) "How this calculation is verified" | Tapped → a card "VERIFIED CALCULATION: Built to be a source you can trust in the field…" + GOT IT. | Reassuring, but the ✓ icon has no label; a beginner would never guess it opens this. |
| π KEY → Symbol Key | Tapped → "SYMBOL KEY · Greek letters & math symbols used in the calculators": π, Σ, Δ, λ, ω, Ω, φ, θ, α, ā, ρ, τ, µ, η, δ, ε, β, operators… each with a plain meaning and an example from the lab ("λ = c / f"), several with TAP FOR GLOSSARY DEFINITION. | Excellent beginner aid. It deserves a more visible name than "π KEY" ("What do these symbols mean?") and a link from every formula line in the workspaces. |
| ▸ CUSTOM CALCULATOR WORKFLOWS (fold on the home) | Opened → "Run several calculators as one guided sequence…", ＋ NEW WORKFLOW, MY WORKFLOWS & TEMPLATES ›, SAVED PROJECTS ›, SAVED RESULTS ›, and the persistent "⛓ CHAIN ACTIVE: OUTPUT LEVEL (dBu)… ✕ CLEAR" banner from my earlier SEND →. | The workflows are the closest thing the lab has to guided beginner tasks, but they hide in a closed fold at the top of the home. |
| Calculator Workflows (templates list) | Read: 18+ templates (Delay Speaker Setup, Loudspeaker SPL Estimate, Amplifier & Loudspeaker Matching, Speaker Cable Loss, Room Mode Review, Tempo & Delay Time, Wavelength & Frequency, Ohm's Law, … Speaker Protection Limiter), each with numbered steps, ▶ RUN and DUPLICATE & CUSTOMIZE. My first ▶ RUN tap was swallowed by the guide card (SHARED pattern). | A great idea: real jobs as step lists. These should be the beginner's front door ("Start with a job, not a formula"). |
| Workflow run: Delay Speaker Setup (3 steps + Results) | Step 1 (speed of sound): 20 °C → "343.2 m/s · TRAVEL PER MILLISECOND 34.32 cm · DELAY PER METER 2.914 ms…". Step 2 (delay from distance) asked for AIR TEMPERATURE again; the 20 °C from step 1 was NOT carried (both fields empty; no ⤵ USE offered). 30 m + 20 °C → "DELAY 87.41 ms". Step 3 (latency of one buffer): 128 / 48 → result. FINISH ✓ → a report: **"PRIMARY RESULT 375"** (no unit; it is "buffers per second" from step 3), then INPUTS, RESULTS, NOTES (the speed-of-sound note appears twice), WARNINGS, "Report ID: WF-20261114-…", YOUR NOTES, SAVE RESULT / SHARE AS TEXT / SHARE AS IMAGE (not pressed). | Three problems a beginner hits in one run: (1) the guide card on the run screen talks about a different template ("In the Ohm's Law template, type 40 in VOLTAGE (RMS)…"); (2) the workflow promise ("one calculation's answer becomes the next one's input") is not kept here: step 2 re-asks the temperature from step 1; (3) the report's PRIMARY RESULT is the least useful number (375 buffers/s, unlabelled) while the number the job needs (the delay to set, 87.41 ms, ideally plus the 2.667 ms processor latency) is buried in the RESULTS list. |
| Saved Projects | Read: "A project stores a venue or rig's values — room dimensions, temperature, listener distance, impedance, target SPL — so any workflow can pull them in with one tap." (did not create one). | Clear purpose. An empty-state line ("No projects yet") like Saved Results has would help. |
| Saved Results | Read: "Nothing saved yet — finish a workflow run and tap SAVE RESULT on its summary." | Good empty state (the three-face rule: loading / unreadable / truly empty; only the empty face was seen). |

---

## CalcLab: overall verdict
For a beginner, this lab is a reference library, not a lesson: 56 well-built workspaces, each with an instant answer, a worked-steps fold and three outstanding teaching folds (WHY THIS MATTERS, PRACTICAL EXAMPLE, COMMON MISTAKES). Once a number is typed, the feedback is instant and the best workspaces end in a plain sentence ("A sounds about 1.516× as loud as B", "46.6 cents sharp of A4", "Ztot = 2 Ω is below most amplifiers' 4 Ω rating", "NOT A REFLECTION…"). But the first contact is hard: ten topic cards and no "start here"; each workspace opens on formulas and a choice list placed below the inputs; grey example values look like entered numbers, so nothing happens and nothing says which box is missing; most results are bare numbers with no "is this good?" anchor; and units and conventions drift between workspaces (sample rate in Hz vs kHz, °F/BTU vs °C, AWG only, "dB" printed where dBu/dBV is meant, "MV/PA", "1.678e7", gauge "-3 to 18"). The guided Workflows, which would suit a beginner best, are hidden in a fold and, in the one I ran, did not chain values and headlined the wrong number.

**3 biggest orientation problems**
1. The empty-input trap: grey placeholders look like values; a missing box gives no named message; the user does not know they must type everything (seen in every workspace; worst in Loudspeaker SPL with five boxes).
2. Answers without meaning: most results lack a verdict or a familiar anchor (RT60 0.3 s, 6% voltage drop, 61 dB path loss, 6.8 ms latency, 98 dB SPL, 180°), so the beginner gets a number but not understanding.
3. No beginner path: no start-here, workflows hidden, formulas before plain questions, and inconsistent units/notation across workspaces.

**3 best things**
1. The three teaching folds on every calculator (WHY THIS MATTERS / PRACTICAL EXAMPLE / COMMON MISTAKES): genuinely excellent content.
2. Sentence verdicts and impossible-input refusals where they exist (Reflection Path's "NOT A REFLECTION", QRD's "8 is not a prime… use 7, 11, 13 or 17", Impedance's 2 Ω warning, Pitch's "46.6 cents sharp").
3. The Symbol Key and the in-place glossary chips that keep your inputs.

**First 30 seconds, rewritten**
Home opens with: "Pick a job, get a number you can use." Three big buttons: "How much delay for a delay speaker?", "Will my PA be loud enough?", "How many acoustic panels do I need?" (each runs a workflow with values pre-filled from the example, editable). Under them: "Or browse all 166 calculators by topic ›". Inside any workspace, the first line is the plain question ("How long is one wave of this note in the air?"), the example values are real and editable, and the answer ends with one sentence that says what the number means.

Source check (after the walk): `registry.ts` confirms the 10 sections and the workspace count; `calcScreenGuides.ts` holds the shared guide cards (the workflow-run guide that names the Ohm's Law template is a shared card, which is why it does not match the template being run).
