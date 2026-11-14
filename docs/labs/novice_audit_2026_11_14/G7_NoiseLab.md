# G7 · NoiseLab (Noise Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/NoiseLab` (needs a full page load; a hash change alone kept the previous lab on screen).
Same LabShell frame as OscillatorLab (LEARN / EXPLORE / CHECK, rack, dock, term card → Sound Safety → intro card). Shared-frame findings F1–F8 are in `G7_OscillatorLab.md` and are not repeated here.

## Page 1 · EXPLORE tab · `#labpreview/NoiseLab`

| Field | Finding |
|---|---|
| First look | The term card "Noise", then (after safety and intro cards) five coloured straight lines crossing at a white dot, with colour names stacked on the right (VIOLET, BLUE, WHITE, PINK, BROWN). Thinks: "a graph of colours… a chart of something going up and down". |
| Overwhelm | 3 — calm picture, but there is no label on the up/down axis, the readouts are codes ("SLOPE −3 dB/OCT", "OUT −26 dBFS"), and the badge is "IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT". |
| Knows what it is learning? | Partly, and at first WRONGLY. The term card defines noise as "everything you didn't want in the signal… hiss and hum… a high signal-to-noise ratio so the wanted sound dominates". The lab is about noise COLOURS as useful test sounds. The beginner's first idea ("noise = the bad stuff") is the opposite of what the page then shows ("play pink, it's the reference"). The intro card that follows fixes it ("Unlike Oscillators' pitched tones, noise has no pitch: its color is a slope…"). |
| Knows what to do first? | Yes once the intro card is read: "Tap COLOR, pick PINK and tap ▶. Tap WHITE while it plays…". Without sound, tapping WHITE does give visible feedback: the white line turns bold and flat, SLOPE changes to 0 dB/OCT, and the tray says "Equal energy per Hz — sounds bright because every higher octave holds twice the bandwidth." |
| Words they would not know | signal-to-noise ratio (term card) · spectral slope · dB per octave / dB/OCT · energy per octave / per Hz · dBFS · OUT · Hz, 1k, 20k (axis) · broadband · sub-bass · high-pass · roll-off · uncalibrated · dB SPL · "anchored at 1 kHz" · bandwidth (tray). |
| Follows / continues? | Mostly. The key confusion: WHITE is drawn FLAT, yet the lab says it "sounds bright". A beginner reads "flat line = even sound", so the picture and the ear disagree, and the explanation ("each octave up is twice as wide in hertz") needs the idea of an octave on a log axis, which is not explained here. Without sound, "hear the hiss rise" cannot happen at all. Would quit in LAB NOTES at "OUTPUT LEVEL — PLAY outputs −20 dBFS · uncalibrated — digital output level, not dB SPL… pink −6 dB, brown −14 dB". |
| What works | The COLOR tray: five coloured chips that look like their names, stays open, one plain sentence per colour ("Equal energy per OCTAVE — roughly matches how we hear. The mixing and measurement reference."). The bold selected line against the faint others. Every line crossing one dot is a clean visual idea. |
| Suggestions | 1. (L) Replace or follow the term card with the lab's own meaning: "Here 'noise' is a sound made on purpose — a hiss with no note — used to test rooms and speakers. Its 'colour' says whether it leans to rumble or hiss." (Term card is glossary-verbatim from `labTermIntroData.ts`, so this may mean choosing a different glossary row, e.g. "Pink noise" or "White noise", for this lab.) 2. (M) Label the vertical axis in words: "louder ↑ / quieter ↓", and the horizontal: "low (rumble) ← → high (hiss)". 3. (M) Add a second, optional view "as your ear hears it (per octave)" where WHITE tilts UP and PINK is flat, or at least a caption under WHITE: "Flat here, but it SOUNDS bright: each step to the right holds more of the high sounds." The flat-white paradox is the hardest idea in the lab and the picture currently argues against the ear. 4. (S) Rename the caption "Pick a color — switch colors WHILE it plays" to a sound-off-friendly first step: "Pick a colour and watch its line tilt. Tilting down = more rumble; tilting up = more hiss." 5. (S) Move OUTPUT LEVEL (dBFS / dB SPL / −14 dB) under a "Technical" fold. |
| Hobbyist | Knows pink noise from speaker setup; will enjoy SPKR on BROWN (the 150 Hz hump). May want an octave-band view, which the lab does not have. |

## Page 2 · LEARN tab

| Field | Finding |
|---|---|
| First look | A paragraph "Noise is sound with no pitch: energy spread across every frequency at once…", then its own intro card pops up over it. |
| Overwhelm | 2–3 — well organised, but long; "Real-world noises" lists ten noise types and the FORMULA uses 1/f, f², 20·log₁₀, RMS, critical band. |
| Knows what it is learning? | Yes. The opening paragraph is plain and fixes the term card's meaning. |
| Knows what to do first? | Yes. The LEARN intro card says "Read the first COMMON MISTAKES line and the BROWN entry. Then open EXPLORE…" — a specific first action, very good. |
| Words they would not know | dB per octave, hertz/octave relationship, equal-loudness contour (explained in brackets — good), HVAC (explained), RF (explained), noise floor (explained in mistakes), SNR (explained), masking (explained), RMS, critical band, ∝. |
| Follows / continues? | Yes through GUIDED STEPS and COMMON MISTAKES. FORMULA loses them. |
| What works | COMMON MISTAKES line 1 ("White noise is flat, so it's neutral." → the 5–10 kHz vs 50–100 Hz example) is the single best explanation of the flat-white paradox in the lab — and it is buried on LEARN. Brackets that explain HVAC, RF, equal-loudness at first use. |
| Suggestions | 1. (M) Bring that COMMON MISTAKES line 1 example onto EXPLORE, next to WHITE (see EXPLORE suggestion 3). 2. (S) Fold "Gray", "Real-world noises" and FORMULA under "Going further". 3. (S, SHARED) "Try it on EXPLORE →" button after GUIDED STEPS. |
| Hobbyist | The hum vs buzz and SNR vs masking mistakes are genuinely useful real-world knowledge. |

## Page 3 · CHECK tab (4 questions)

| Field | Finding |
|---|---|
| First look | "CHECK YOUR UNDERSTANDING", question 1; intro card over it after a second. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes. The CHECK intro card is helpful: "Unsure what SLOPE means? Open EXPLORE first, tap VIOLET and watch SLOPE and the line." |
| Words they would not know | "equal energy per hertz", "−3 dB per octave" (Q2 is a pure number-recall question), "tweeters" (Q4 answer). |
| Follows / continues? | Yes. No "what next" after passing (same as Oscillator). |
| What works | Q1 asks the real idea (why white sounds bright). Q3 uses sound pictures ("rumble, surf or distant thunder"). |
| Suggestions | 1. (S) Q2 tests a number; a beginner-friendlier version: "Pink noise compared with white: does it lean toward the lows or the highs?" with the number in the explanation. 2. (S, SHARED F8) hint before answer. |
| Hobbyist | Easy. |

## Lab verdict — NoiseLab

**Beginner's journey:** The very first sentence tells them noise is the unwanted stuff; two popups later they are told to play it on purpose. Once the intro card is read, the COLOR tray is easy and rewarding to tap: each colour has its own chip, its line goes bold, and one sentence says what it sounds like. The big idea (white is flat but sounds bright; pink is the even one) is stated, but the picture shows white flat, so the eye argues with the words, and with sound off the learner cannot settle it by ear. The LEARN page contains the perfect explanation, one tab away.

**3 biggest orientation problems**
1. The term card's meaning of "noise" (unwanted signal) contradicts the lab's (a test sound with a colour).
2. The chart has no words on its axes, and its flat-white line contradicts the ear without an on-screen explanation.
3. Sound-off: "hear the hiss rise" is the core lesson and needs sound; the page gives no sound-free substitute (e.g. "imagine a shhh vs a rumble" or a short audio-free comparison).

**3 best things**
1. Coloured chips that look like their names, with a one-line description each.
2. Every line crossing one dot at 1 kHz — a strong, simple picture of "tilt".
3. COMMON MISTAKES line 1 (5,000 Hz vs 50 Hz octave widths).

**First 30 seconds rewrite:** One card: "Noise here is a hiss with no note. Engineers use it on purpose to test speakers and rooms. Each 'colour' leans differently: BROWN rumbles, WHITE hisses, PINK sits evenly in between. Tap COLOR and watch the line tilt." Then the chart with "rumble ← → hiss" under the axis.
