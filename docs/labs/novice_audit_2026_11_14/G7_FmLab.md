# G7 · FmLab (FM Synth Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/FmLab`.
LabShell frame (F1–F8 in `G7_OscillatorLab.md`). Same three-popup stack on open (term card "Frequency modulation synthesis" → Sound Safety → intro). This lab ALSO has a fourth page: WHAT'S LEFT (from CHECK's "FINISH · SEE WHAT'S LEFT ›").
STRIKE / ENV BELL / PLUCK not judged by ear (sound off). The FM voice text in the preview is the `__DEV__` version ("needs the v7 engine build — this dev client predates it"); store builds show "This version of the app cannot play the FM voice yet… update the app to hear the voice."

## Page 1 · EXPLORE tab · `#labpreview/FmLab`

| Field | Finding |
|---|---|
| First look | A green stick and four amber "lollipops" on a dark graph with "fc 220" in green and "|J| 1 / 0.5" on the right edge. Thinks: "a bar chart… what is |J|?" |
| Overwhelm | 4 — subtitle is five jargon words ("Carrier · Modulator · Ratio · Index · Sidebands"); a colour legend of four kinds of stick including "dim dashed = reflected below 0 Hz · red dashed = ALIASED past Nyquist"; readouts FC / FM / I / BW; badge "SIDEBAND SPECTRUM — BESSEL AMPLITUDES Jₖ(I) · EACH AT FC ± k·FM"; caption "watch the Bessel sidebands". |
| Knows what it is learning? | Partly. Term card is good ("one fast wobbling tone to shake the pitch of another tone… a plain tone can turn bright, metallic, or bell-like"). Intro card: "How one sine wobbling another creates sidebands: the ratio sets where they land, pitched or bell-like, and the index sets how many are strong." — clear if you know "sidebands". |
| Knows what to do first? | Yes: intro says "ride INDEX from 0 to 8… Then switch RATIO between 1 and 1.41 ✳". Dragging the INDEX fader gives strong, satisfying feedback: sticks multiply and spread, BW climbs. RATIO tray has one plain line per choice ("√2 — irrational, so the sidebands fall BETWEEN the harmonics. Nothing lines up: instant bell / metallic clang."). |
| Words they would not know | carrier · modulator · ratio · index (I) · sidebands · |J| / Jₖ · Bessel · fc / FC · FM (as a READOUT it means the modulator's frequency, while the lab is called FM — two meanings of the same two letters) · BW / bandwidth · kHz · Nyquist · ALIASED · "reflected below 0 Hz" · harmonic series · irrational · ENV · SUSTAIN / PLUCK / BELL (plain enough) · Carson bandwidth (LAB NOTES) · 24 kHz Nyquist limit. |
| Follows / continues? | The INDEX and RATIO play is followable and fun even silent. They would not understand dashed sticks ("reflected below 0 Hz") or red ones. Without sound, the core payoff — "pitched vs bell" — is only words; the picture difference between RATIO 2 and 1.41 (sticks on or between a grid) is subtle because the graph has no harmonic grid to land "on". |
| What works | INDEX fader: the best "turn a knob, see more stuff" moment in my group. RATIO tray sentences. The ✳ marking the "odd one out" ratio. CHECK YOURSELF Q1 asks a sound question ("You want a bell… which ratio family?"). |
| Suggestions | 1. (M) Rename the FM readout to "MOD" (modulator) so "FM" means only the technique. 2. (M) Draw faint vertical "harmonic" lines (multiples of the note) on the graph, so "on the series" vs "between" is visible at a glance when switching RATIO 2 ↔ 1.41. 3. (M) Shorten the legend for first view: "green = the note · amber = new tones FM adds"; move dashed/red/aliased to the ⓘ. 4. (S) Subtitle: replace the five-term list with a sentence: "Shake one tone with another to make bells and bright synths." 5. (S) Rewrite the badge: "Each stick is one tone FM creates; height = how loud." Bessel can live in the ⓘ. 6. (S) Remove "Bessel" from the caption ("watch the Bessel sidebands"). |
| Hobbyist | Will enjoy this; FM is famously confusing on hardware synths and the stick graph helps. Will want to hear BELL envelopes. |

## Page 2 · LEARN tab

| Field | Finding |
|---|---|
| First look | Paragraph "In Harmonics you built a tone by adding sines one at a time. FM synthesis gets a whole family of frequencies from just two." — a good bridge. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes from the paragraph. The LEARN intro card says "The words and math of FM in one place: carrier, modulator, ratio, index, sidebands, Bessel amplitudes, Carson's bandwidth and aliasing." — a jargon list as the goal. |
| Knows what to do first? | The intro card says "Read COMMON MISTAKES and FORMULA / CONCEPT" first — it sends a beginner straight to the formula y(t) = sin(2π·fc·t + I·sin(2π·fm·t)). That is the wrong first stop for a novice. |
| Words they would not know | phase, sidebands (explained), Bessel, radians, Carson's rule, Nyquist (explained in step 6), vibrato (explained — good). |
| Follows / continues? | Yes through GUIDED STEPS (clear NOTICE/WHY; step 4 "the green carrier stick vanishes" is a great surprise). |
| What works | COMMON MISTAKE "FM is just fast vibrato" — a beginner's natural guess, answered in plain words. PRO TIP "work in this order: ratio for the character, index for the brightness, then an envelope" — real-world take-away. |
| Suggestions | 1. (M) Change the LEARN intro "WHERE TO START" to "Read the first paragraph and GUIDED STEPS 1–3", not FORMULA. 2. (S) Move the "vibrato" mistake to the top of COMMON MISTAKES (it is the beginner's mental model). |
| Hobbyist | Great; the PRO TIP order is gold. |

## Page 3 · CHECK tab (4 questions)

| Field | Finding |
|---|---|
| First look | Q1 "The carrier is 200 Hz and the modulator is 100 Hz. Where do the first pair of sidebands sit?" — arithmetic. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes. |
| Words they would not know | MODULATION INDEX (dock says INDEX), √2. |
| Follows / continues? | Yes, and this lab has "FINISH · SEE WHAT'S LEFT ›" at the bottom — a clear next step (Oscillator, Noise and Harmonic do not). |
| What works | Q4 ("With the modulation index at 0, what do you hear?") is answerable from one fader move. |
| Suggestions | 1. (S, SHARED F8). |
| Hobbyist | Easy. |

## Page 4 · WHAT'S LEFT (from CHECK → FINISH)

| Field | Finding |
|---|---|
| First look | "‹ BACK TO THE LAB", "Where you are", "WHAT'S LEFT", one row "Understanding check". Its own intro card pops up over it. |
| Overwhelm | 1–2 (but a popup on a 1-row page is overkill). |
| Knows what it is learning? | Yes — where they stand. |
| Knows what to do first? | Yes: tap the CHECK row, or DONE · BACK TO LABS. |
| Words they would not know | "counts toward your credit" (what credit?). |
| Follows / continues? | Yes. Buttons: PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, DISCUSS THIS LAB ›. "Practicing again or reviewing never removes credit" — reassuring. |
| What works | A real end-of-lab page with a clear way out. |
| Suggestions | 1. (S, SHARED) Skip the intro popup on this page; the page explains itself. 2. (S) Add one line "What you learned here: ratio = where the new tones land; index = how many." — the brief's "end of page says what was learned". 3. (S) "jump straight to any of them" when there is one row → "jump straight back to it". |
| Hobbyist | Fine. |

## Lab verdict — FmLab

**Beginner's journey:** The term card explains FM in everyday words, and the INDEX fader gives an immediate, satisfying picture: more index, more sticks. Around that good core sits a wall of maths labels (|J|, Jₖ(I), Bessel, Carson, Nyquist, aliased, reflected below 0 Hz) right on the display and in its badge. The key lesson (simple ratio = clear note, odd ratio = bell) is a sound difference; with sound off the picture shows it only faintly, because nothing on the graph marks where "in tune" positions are. The lab ends well, with a WHAT'S LEFT page.

**3 biggest orientation problems**
1. Maths vocabulary in the display legend, badge and caption (Bessel, Jₖ, aliased, reflected below 0 Hz).
2. "FM" is both the lab's name and a readout meaning "modulator frequency".
3. The pitched-vs-bell idea has no visual anchor (no harmonic grid) and the LEARN intro sends beginners to the formula first.

**3 best things**
1. INDEX fader → sticks multiply instantly.
2. RATIO tray one-liners and the ✳ marker.
3. WHAT'S LEFT end page with a clear exit.

**First 30 seconds rewrite:** "FM = shake one tone (the carrier, green) with another (the modulator). The shaking makes NEW tones — the amber sticks. Drag INDEX to shake harder and watch more sticks appear. Then try RATIO 1.41 ✳: the sticks fall between the grid lines — that's what makes a bell." Graph shows a faint grid of in-tune positions; legend shows only green/amber.
