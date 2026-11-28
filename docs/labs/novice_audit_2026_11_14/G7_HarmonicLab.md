# G7 · HarmonicLab (Harmonic Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/HarmonicLab`.
LabShell frame (see F1–F8 in `G7_OscillatorLab.md`). Popup order on open: term card "Harmonics" → Sound Safety → intro card (same three-popup stack, F1).
MODE → REAL SIGNAL was NOT tapped (it listens through the microphone; needs a phone and permission). Guided step 6 therefore not walked.

## Page 1 · EXPLORE tab · `#labpreview/HarmonicLab`

| Field | Finding |
|---|---|
| First look | A stack of coloured horizontal stripes (red at the bottom, green at the top) with tiny green code labels "1: 100 G2 +35¢", "11: 1.1k C#6 −14¢", and a sideways piano keyboard on the right. Thinks: "some kind of music/equaliser screen… what are G2 and +35¢?" |
| Overwhelm | 4 — the busiest rack in my first four labs: three header buttons (`?`, `ⓘ`, `ⓘ`), four readouts (F0, THD 75.2 %, CREST 5.8 dB, SLOPE −6.0 with no unit), a fader that is always on screen, a 5-key dock (F0 / PRESET / THD CALC / AXIS / MODE), then in LAB NOTES 12 stems with music-interval names, 10 group buttons (ODD/EVEN, ENVELOPE, SPACING, SOLO ODD…, NORMALIZE, SNAPSHOT A, A/B GHOST). With the display and dock pinned, the scrolling area left for reading is about a third of the phone. |
| Knows what it is learning? | Partly. Term card: "Harmonics are extra tones that sit above a note's main pitch… A flute and a guitar differ because their harmonics differ." — excellent, the best term card so far. Intro card: "Why timbre is a harmonic recipe… and why the ear follows levels far more than phase." — "timbre" and "phase" unexplained. |
| Knows what to do first? | Partly. The intro says "Tap ▶ on the default SAW. In LAB NOTES tap MUTE EVEN and watch THD and CREST drop." A beginner does not know what THD or CREST are and MUTE EVEN is several screens down inside LAB NOTES. What they would actually tap first: PRESET (a word they half know). Tapping PRESET → SQUARE works well: half the stripes vanish, the wave turns square, the tray explains "Odd harmonics only… Hollow and reedy — a clarinet-like recipe." |
| Words they would not know | additive synthesis · spectrum · distortion (subtitle) · G2 / C#6 (note names) · ¢ / cents · F0 · THD · CREST · SLOPE (no unit shown) · ANALYTIC MODEL · LOG ♪ / LIN · MODEL / REAL SIGNAL · dB re full scale · partials · Fourier synthesis · stems · Root / 8ve / P5 / M3 / ♭7 / 9 / ♯11 (music intervals over each stem) · SOLO / MUTE · NORMALIZE · SNAPSHOT / A/B GHOST · THD+N · dBFS · SYM CLIP / ASYM CLIP / SOFT SAT / HARD CLIP. |
| Follows / continues? | The PRESET tray is a clear success. THD CALC is a dead end for a beginner: a popup of pure formula (√(a₂² + a₃² + … + a₁₂²) ÷ a₁ × 100, 20·log₁₀, a list of a₃/a₁ ratios) and "a THD+N figure here would be fabricated". THD itself is never described in plain words on EXPLORE, and LEARN's CONTROLS defines CREST and SLOPE but not THD. Labels on the stripe display stay on EMPTY harmonics after SQUARE ("2: 200 G3 +35¢" sits beside a blank row), while the harmonics that ARE lit (5, 7, 9) have no label — so the labels point to the wrong rows for the learner's eye. Would quit at THD CALC or at the stems' interval names. |
| What works | Term card. PRESET tray (stays open, one-line plain description, instant change). The wave strip under the stripes showing the summed shape. The stems (drag a ball up/down) are the most hands-on control in the whole group — great for learning "recipe" — but they are hidden below the fold. |
| Suggestions | 1. (L) Start beginners with the STEMS visible and the readouts hidden: move "HARMONIC STEMS" up directly under the display (or make it the display), and fold THD/CREST/SLOPE into a "Measurements" row that opens on tap. The stems ARE the recipe; the readouts are for the second visit. 2. (M) Give THD one plain sentence wherever it first appears (readout ⓘ or THD CALC top line): "THD = how much of the sound is harmonics rather than the main note. 0 % = a pure tone." Put the formula under it. 3. (M) Label only the rows that are lit, or dim labels of empty rows, so after SQUARE the learner sees "3", "5", "7" next to the lit stripes. 4. (M) Two `ⓘ` icons in the header (one is "About accuracy and calibration", one is "Explain this screen") look identical. Give the accuracy one a different glyph or a word ("accuracy"). (SHARED if other labs use the accuracy chip beside ⓘ.) 5. (S) Show the unit with SLOPE ("−6 dB/oct") and a word: "falls fast/slow". 6. (S) Under the stems, swap the interval names (P5, M3, ♭7, ♯11) for "×2, ×3, ×4…" first, with a toggle "show as musical intervals" for musicians. 7. (S) Hide the always-on F0 fader until the F0 key is tapped (it eats reading space on a phone). |
| Hobbyist | Will love SYM/ASYM CLIP and the stems; THD and CREST are familiar. Will notice that the first half overlaps Oscillator Lab (same five waves). |

## Page 2 · LEARN tab

| Field | Finding |
|---|---|
| First look | Paragraph "Most steady pitched sounds are a stack of sine waves called harmonics…", then the LEARN intro card on top. |
| Overwhelm | 3 — very long CONTROLS list (13 entries including phase, PWM, MODE, AXIS, CREST, SLOPE), six GUIDED STEPS, five mistakes, four tips, formula. |
| Knows what it is learning? | Yes from the paragraph ("Which harmonics are there, and how loud each one is, makes the timbre: the tone color… You met these shapes in Oscillators; here you take them apart.") — a good bridge from the previous lab. But the LEARN intro card says "The words and formulas of additive synthesis: fundamental, harmonic, partial, odd and even, duty cycle and phase, and the Fourier series" — a list of jargon as the goal. |
| Knows what to do first? | Yes: intro says "Read the PRO TIPS line on building a square. Then on EXPLORE pick SINE and drag H3, H5 and H7…" — specific, though it sends the reader to the BOTTOM of the page first. |
| Words they would not know | cents (explained in brackets — good), RMS (explained), PWM, polarity, heatmap, dBFS, alias, Σ, ∝, sin(nπd)/(nπ). THD is used in GUIDED STEPS 3–5 without ever being defined on this page. |
| Follows / continues? | Mostly. GUIDED STEP 3 ("tap MUTE EVEN in LAB NOTES. Then pick PRESET → SQUARE. NOTICE THD falls from 75.2 % to 43.8 %") is the key experiment but its result is a number the learner cannot interpret. |
| What works | COMMON MISTAKES "You can read the timbre from the wave's shape… Judge tone color by the bands" — a great, surprising idea. PRO TIP "build a square from a SINE by dragging H3/H5/H7" — the best hands-on exercise in the group. |
| Suggestions | 1. (M) Add a THD entry to CONTROLS in plain words. 2. (M) Promote the PRO TIP "build a square from SINE" to GUIDED STEP 1 — it is the clearest "I made this" moment. 3. (S) Rewrite the LEARN intro "WHAT YOU'RE LEARNING" as an idea, not a word list: "How a sound's colour comes from which harmonics it has and how loud each is — and why the wave's shape can fool you." |
| Hobbyist | Good depth; phase vs level is valuable. |

## Page 3 · CHECK tab (4 questions)

| Field | Finding |
|---|---|
| First look | Question 1 "The fundamental is 100 Hz. Where does the 3rd harmonic sit?" — friendly arithmetic. Intro card follows. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes. |
| Words they would not know | AMPLITUDE, partial, PHASES, "1/n of the fundamental's level". Q3 (phase) needs LEARN; a beginner who only played EXPLORE never met phase (it is behind a long-press on a stem). |
| Follows / continues? | Yes; no "what next" at the end (shared). |
| What works | Q1 is a perfect beginner question — answerable from the labels on the display. |
| Suggestions | 1. (S) Q3 answer text "the ear is largely insensitive to the phases of a steady tone's partials" → "your ear hardly notices where each harmonic starts; it hears how loud each one is". 2. (S, SHARED F8). |
| Hobbyist | Fine. |

## Lab verdict — HarmonicLab

**Beginner's journey:** The term card is lovely ("A flute and a guitar differ because their harmonics differ") and makes them curious. Then they face the busiest screen so far: stripes labelled with note codes and cents, four number readouts, a fader, five dock keys. PRESET gives them a win (SQUARE empties half the stripes). The real treasure, twelve draggable stems where they can build a sound by hand, is below the fold and labelled with music-theory intervals. The numbers the lab asks them to watch (THD, CREST) are never put into plain words, so the key experiments end in "a number changed" rather than "I understand".

**3 biggest orientation problems**
1. Too many readouts/controls at once; the hands-on stems are hidden while the measurements are up front.
2. THD is the headline readout and is never explained in words (only a formula popup).
3. Display labels mark empty harmonics and miss the lit ones after a preset change, so the picture and the labels disagree.

**3 best things**
1. Term card wording.
2. PRESET tray with one-line descriptions.
3. The stems + PRO TIP "build a square from a sine".

**First 30 seconds rewrite:** Card: "A flute and a guitar playing the same note sound different because of their harmonics — quieter tones stacked above the note. Here you can build a sound from 12 of them." → open with PRESET = SINE (one stripe, one stem) and the stems directly under the display → hint on stem H3: "Drag me up. Hear/see the sound get richer." → after the drag: "You just added a harmonic. Keep going: H5, H7 → you're building a square wave." Readouts THD/CREST/SLOPE hidden until the learner taps "Show measurements".
