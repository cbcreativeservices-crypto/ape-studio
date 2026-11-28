# G7 · OscillatorLab (Oscillator Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF (Sound Safety closed with KEEP SOUND OFF). Preview: `http://localhost:8142/#labpreview/OscillatorLab`.
The lab is ONE LabShell screen with three tabs (LEARN / EXPLORE / CHECK). It opens on EXPLORE.

## Shared frame judged once here (LabShell + rack + dock + guides) — applies to OscillatorLab, NoiseLab, HarmonicLab, FmLab, ModularLab, AutotuneLab and any other LabShell lab in my group

What a newcomer meets, in order:
1. A first-visit TERM card over the rack ("Oscillator — An oscillator is the part of a synth that makes the raw sound…", CONTINUE). Plain, short, good. It covers the display, so the very first impression is a sentence, not a machine. Keep.
2. Behind it: header (‹, title, subtitle "Waveforms · Spectra · Harmonic recipes", amber `?`, amber `ⓘ`, round ▶), three tabs LEARN / EXPLORE / CHECK, the rack display (wave strip, 12 bars, readout strip WAVE / F0 / VIEW + a small ⓘ), a badge "ANALYTIC MODEL — NOT A MEASUREMENT", HIDE DISPLAY / FULL SCREEN, a one-line caption, LAB NOTES, and a three-key dock at the bottom (WAVE / F0 / SPKR).
3. CORRECTED after NoiseLab (same frame, clean walk): closing the term card brings up the full SOUND SAFETY WARNING by itself (about 450 words, red, legal-sounding); closing that (KEEP SOUND OFF) brings up the "WHAT YOU'RE LEARNING / WHERE TO START" intro card. So a newcomer meets THREE popups in a row before touching the lab: definition → legal warning → the actual orientation. In Oscillator my tap on `?` happened to land while the safety warning was arriving, so I thought `?` had opened it; it had not. Each tab (LEARN, CHECK) shows its own intro card on first visit, about a second after the tab opens, and on CHECK it swallowed my first tap on an answer.
4. `?` did nothing visible in the preview (source: HelpKey navigates to the app's Help screen, which the preview harness does not have — on a phone it opens the general app Help page, not help for this lab). A coach bubble "New: tap ⓘ to have this screen explained" appeared over the LEARN/EXPLORE tabs.
5. ⓘ opens a stepped SCREEN GUIDE docked at the bottom: dots + "1 · WHAT YOU'RE SEEING", ‹ INTRO / NEXT ›. It lights the part of the screen it talks about (the display gets an amber ring). This is the best orientation tool in the frame.

Shared-frame suggestions (marked SHARED; I will not repeat them per lab, only refer to them as F1–F8):
- **F1 (L, SHARED)** Three popups stack before the lab can be touched (term card → Sound Safety → intro card). The intro card ("WHAT YOU'RE LEARNING / WHERE TO START") is the one that orients, and it comes LAST, when the learner has already been tapping "close" twice and is in close-the-popup mode. Suggest: merge the term definition INTO the intro card (term on top, "what you'll learn" and "where to start" below, one button), and move the safety warning to the first ▶ press (F3). One card, then the lab.
- **F2 (M, SHARED)** Two help buttons side by side (`?` and `ⓘ`) with no labels is a guessing game. A beginner cannot tell them apart. Suggest: one button ("Help" or "Guide") that opens the screen guide, with "App help" as its last line; or give each a 1-word caption under the icon ("help" / "guide").
- **F3 (M, SHARED)** The Sound Safety warning arriving by itself, uninvited, right after the term card is startling and long (about 450 words). It should appear only when the learner first asks for sound (▶), with one plain line on top: "This lab can make sound. Read this once before you turn sound on." Then the learner knows why it is there.
- **F4 (M, SHARED)** Open each lab on LEARN (or on a short "Start here" step) for a first visit, or put a one-line strip above the tabs: "New here? Read LEARN first (2 min), then play in EXPLORE, then try CHECK." The three tab names are good, but nothing says they are an order.
- **F5 (M, SHARED)** The badge "ANALYTIC MODEL — NOT A MEASUREMENT" is the first words under the display and means nothing to a beginner (it sounds like a warning). Suggest plain words: "A drawing worked out from the maths — not measured from your phone."
- **F6 (S, SHARED)** Readout labels and dock keys use short codes (F0, SPKR, VIEW IDEAL). The dock and readouts are the controls a beginner touches first, so the first time, show the long name: "F0 · the note (pitch)", "SPKR · phone-speaker view".
- **F7 (S, SHARED)** "Long-press any control for its own entry" is a hidden gesture; beginners on a phone rarely long-press. Keep it, but add a visible ⓘ on the open tray (the WAVE tray already has room) so the lesson entry is one tap.
- **F8 (S, SHARED)** The CHECK tab's "NOT QUITE — TRY ANOTHER" box names the right answer ("The sawtooth has the full harmonic series…") immediately. That removes the second try. Suggest the wrong-answer box give a hint first ("Look at which bars are lit on SAW"), and reveal the answer only after a second miss.

What works in the frame (keep):
- Term card first: one idea, plain words, before any machine.
- The screen guide (ⓘ): stepped, short bullets, highlights the part it describes, has an INTRO page with "WHAT YOU'RE LEARNING / WHERE TO START".
- Tabs LEARN / EXPLORE / CHECK are good names and a good order.
- The dock's open tray stays open with a one-line description of the selected choice ("SQUARE — Odd harmonics at 1/n: hollow, reedy, strong. Watch the recipe bars — every even slot is empty."). Picture changes instantly. This is excellent feedback.
- CHECK: "no score, nothing is lost", "4 still to get right" — calm and encouraging.

---

## Page 1 · EXPLORE tab (the rack) · `#labpreview/OscillatorLab`

| Field | Finding |
|---|---|
| First look | The rainbow-coloured jagged wave and the tall orange/green bar on the left of the bar chart. Thinks: "a music visualiser / an equaliser". The term card ("Oscillator") is on top first, which helps. |
| Overwhelm | 3 — the display is calm, but under it come a warning-style badge, two buttons, a caption, and a long LAB NOTES block with "Fourier recipe", "band-limited", "H1–H12", "1/n²", "fc ± n·fm (FM, Bessel amplitudes)". |
| Knows what it is learning? | Partly. From the term card: "an oscillator makes the raw sound". From the caption: "pick a waveform… the shape, the harmonic recipe and the sound stay in lockstep". They do NOT learn the real goal (shape = recipe of harmonics; recipe = tone colour; F0 = pitch) unless they find the intro via ⓘ. |
| Knows what to do first? | Partly. Would tap the ▶ (sound off, so nothing) or the WAVE key in the dock. WAVE is right. Nothing says "start here". |
| Words they would not know | oscillator (explained by the term card) · waveform · spectra · harmonic / harmonic recipe · SAW · F0 · Hz · VIEW IDEAL · ANALYTIC MODEL · Fourier · band-limited · H1–H12 · relative amplitudes · odd only · pulse nulls · duty cycle · high-passed · 150 Hz, −12 dB/oct · SPKR · FM · AM · native DSP / ape-dsp engine (dev build only) · sidebands · fc ± n·fm · Bessel · 1/n² (in CHECK YOURSELF). |
| Follows / continues? | Yes for the play part: tapping WAVE → SQUARE empties every even bar instantly and the tray says so in words. That is a real "aha". Would quit when reading LAB NOTES ("THE SOUND" and "FM · AM" are written for engineers). No pointer at the end of EXPLORE to "now try CHECK". |
| What works | WAVE tray: stays open, one-sentence description per wave, bars change at once. Twelve numbered bars are easy to count. Two CHECK YOURSELF questions in LAB NOTES tie the picture to an idea. |
| Suggestions | 1. (L, SHARED F1) Put the EXPLORE intro ("Every classic wave is a recipe of harmonics… Tap ▶, then open WAVE…") FIRST, merged with the term card, not third behind the safety warning. 2. (M) Add a caption under the bars at first visit: "Each bar is one ingredient (a pure tone). Bar 1 is the note you hear; bars 2–12 add colour." Today the bars have only numbers. 3. (M) Move "THE SOUND" and "FM · AM" lower or behind a "For the curious" fold; their words (high-passed, −12 dB/oct, sidebands, Bessel) are the densest on the page and come before the two friendly CHECK YOURSELF questions. 4. (S) Rename the caption to a first step: "Start: tap WAVE and switch between SINE, SQUARE and SAW. Watch which bars light up." 5. (S) The CHECK YOURSELF questions use "1/n²" and "1/n of the fundamental" — say "falling away fast" / "each one a bit weaker" for beginners. 6. (S, dev builds only) The developer sentences "This engine build predates the additive generator… v3 dev build" and "NEEDS NEW NATIVE DSP… ape-dsp engine" appear in the web preview (they are `__DEV__` only in source, so a store build shows plain text instead — no learner impact, but anyone reviewing in the preview reads them). |
| Hobbyist | Gets it fast and enjoys the SQUARE/TRIANGLE comparison. Would want to hear it; with sound off the tones are only pictures. Might want a "show me odd/even" highlight. |

## Page 2 · LEARN tab (the guided lesson as one page)

| Field | Finding |
|---|---|
| First look | A grey paragraph that starts "An oscillator is a synth's sound source…". Thinks: "the reading part". Calm. |
| Overwhelm | 2 — long, but well structured: intro paragraph, WHAT YOU WILL UNDERSTAND, CONTROLS, GUIDED STEPS (numbered, each with NOTICE / WHY), COMMON MISTAKES, PRO TIPS, FORMULA. |
| Knows what it is learning? | Yes. The first paragraph explains harmonics, fundamental, timbre (tone colour) and pitch in plain words — best plain-English opening in the lab. |
| Knows what to do first? | Yes — read. GUIDED STEPS say exactly what to tap ("Set WAVE to SINE and tap ▶"). But the steps are on LEARN and the controls are on EXPLORE, so the learner has to remember a step, switch tab, do it, switch back. |
| Words they would not know | duty cycle (explained in its entry), Nyquist, sample rate, band-limiting, aliasing, sidebands, carrier, modulator, fc ± n·fm, tremolo, partials, octave, 1/n², ∝ sin(π·n·d) (FORMULA). FM/AM parts are heavy for a beginner. |
| Follows / continues? | Yes up to GUIDED STEPS. Would stop at FORMULA / CONCEPT (pure maths). No "now go to EXPLORE" button at the end. |
| What works | The opening paragraph; WHAT YOU WILL UNDERSTAND; GUIDED STEPS with NOTICE / WHY; COMMON MISTAKES written as the wrong belief in quotes, then the fix. |
| Suggestions | 1. (L, SHARED) Let GUIDED STEPS run ON the EXPLORE screen (a small step card over the dock: "Step 2 of 6 — pick SQUARE. Notice: even bars go empty.") so the learner does and reads in one place. 2. (M) Put "Try it now → EXPLORE" buttons after the GUIDED STEPS heading and at the end of the page. 3. (S) Fold FM / AM entries and FORMULA under "Going further". 4. (S) Explain "octave" the first time ("an octave = double the pitch; the same note, higher"). |
| Hobbyist | Likes COMMON MISTAKES and PRO TIPS. The aliasing tip ("sweep a saw upward on a synth that can switch band-limiting off") is a good real-world hook. |

## Page 3 · CHECK tab (CHECK YOUR UNDERSTANDING, 4 questions)

| Field | Finding |
|---|---|
| First look | "CHECK YOUR UNDERSTANDING" heading, then question 1 in a card. The intro card pops up over it about a second later. |
| Overwhelm | 2 — four clear multiple-choice questions, calm wording. |
| Knows what it is learning? | Yes — it is a quiz on this lab. |
| Knows what to do first? | Yes — tap an answer. (First tap was swallowed by the late intro card.) |
| Words they would not know | "1/n of the fundamental", "1/n²", "duty cycle", "Nyquist frequency", "aliasing" — all in the questions/answers. A beginner who skipped LEARN cannot answer Q2 or Q4. |
| Follows / continues? | Yes. Wrong answer → "NOT QUITE — TRY ANOTHER" with the full reason (which names the right answer). No pointer to the next lab after passing (source: no what's-left page, `checkEnd` not given for this lab). |
| What works | "Answer all 4… nothing is lost and there is no score." "4 still to get right" counter. Immediate feedback in words. |
| Suggestions | 1. (M, SHARED F8) Hint first, answer on second miss. 2. (M) After the last right answer, show "You've finished the Oscillator Lab. You learned: … Next: Noise Lab / Harmonic Lab." 3. (S) Make the CHECK intro card appear before the page is tappable, or not at all on a quiz page (it blocked the first answer). |
| Hobbyist | Fine, maybe a little easy except Q4 (Nyquist). |

## Lab verdict — OscillatorLab

**Beginner's journey:** They meet a friendly one-line definition of an oscillator, then a colourful machine with numbered bars and codes (SAW, F0, SPKR). With no prompt they tap WAVE, try SQUARE, and genuinely see half the bars disappear — a real learning moment. But nobody told them WHY bars matter (each bar is a pure tone that adds colour), so the moment is a pretty change rather than an idea. The LEARN tab explains everything well, but it sits on another tab and the learner was dropped on EXPLORE first. With sound off, "the tone colour shifts but the pitch stays put" can only be taken on trust.

**3 biggest orientation problems**
1. The goal of the page ("a wave's shape is a recipe of harmonics; recipe = tone colour, F0 = pitch") arrives as the third popup in a row, after a definition and a long legal warning, when the learner is already tapping to dismiss (F1, F3).
2. The lab opens on EXPLORE, while the plain-English explanation and the step-by-step are on LEARN, a tab away from the controls they describe (F4, LEARN suggestion 1).
3. The bars have no caption saying what a bar IS; LAB NOTES speaks engineer (band-limited, −12 dB/oct, Bessel) above the friendly CHECK YOURSELF questions.

**3 best things**
1. The WAVE tray: stays open, one plain sentence per wave, instant picture change.
2. LEARN's opening paragraph and GUIDED STEPS with NOTICE / WHY.
3. CHECK's calm framing ("no score, nothing is lost").

**First 30 seconds rewrite:** Term card (as now) → intro card: "In this lab you'll see that every sound shape is built from simple tones stacked up — like a recipe. Bar 1 is the note. Bars 2–12 are the ingredients that give it colour." → one pulsing hint on the WAVE key: "Tap me, then pick SQUARE." → when they pick it, a one-line toast: "See? Every even bar is empty. That's why a square sounds hollow." → small chip "Next: try TRIANGLE".
