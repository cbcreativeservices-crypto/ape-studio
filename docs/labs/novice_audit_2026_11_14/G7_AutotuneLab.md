# G7 · AutotuneLab (Autotune Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/AutotuneLab`.
LabShell frame (F1–F8 in `G7_OscillatorLab.md`); same three-popup stack (term "Vocal tuning pass" → Sound Safety → intro). PLAY (the demo melody) not played: the core of this lab is HEARING the snap vs glide, so the sound-off judgement below is about the picture and words only.

## Page 1 · EXPLORE tab · `#labpreview/AutotuneLab`

| Field | Finding |
|---|---|
| First look | Thin vertical grey lines with note names along the top (G♯3, A3, A♯3 … F4) and six small amber squiggles at different heights, each tagged "+38¢", "−32¢", "+22¢"… Thinks: "a piano roll turned sideways? what's ¢?" |
| Overwhelm | 3 — the picture is sparse, but its reading rule is unusual ("time runs downward within each note"), the readouts are AMOUNT / SPEED / NOTE / ENDS ("NOTE —", "ENDS 0¢" mean nothing yet), and LAB NOTES mention τ = 0.12 s and −20 dBFS. |
| Knows what it is learning? | Partly → yes after the intro: term card "A round of fixing notes that are slightly out of tune. Software nudges each note to the right pitch, like snapping it to the correct key." — clear; intro: "error is counted in cents, 100 to a semitone. AMOUNT sets how far a note is pulled toward the correct pitch, SPEED how fast." — clear. Lab name "AUTOTUNE" is the word beginners know — a good hook. |
| Knows what to do first? | Yes: intro "Slide AMOUNT to OFF and back to 100%. Then switch SPEED between FAST — SNAP and SLOW — GLIDE and watch ENDS". Sliding AMOUNT to OFF visibly changes the squiggles: each note turns into a dashed straight segment beside its line and ENDS reads 45¢. That works without sound. |
| Words they would not know | cents / ¢ (explained in intro only) · semitone · G♯3, A♯3 (note names with octave numbers) · retune speed · ENDS · NOTE · τ (time constant) · dBFS · uncalibrated · generator · vibrato · hard-tune. |
| Follows / continues? | Mostly. The main hurdle is the picture's orientation: time runs DOWN inside each little note while pitch runs LEFT–RIGHT, and the six notes are scattered with no visible order (which is first?). Every pitch-correction screen a hobbyist has seen runs time left→right. A beginner would not know which of the six squiggles is "the melody" order or why notes sit at different heights. |
| What works | Term card wording. The before/after of AMOUNT OFF (dashed, off the line) vs 100% (curves onto the line). The error tags (+38¢, −45¢) right next to each note. CHECK YOURSELF Q1 "Why does FAST retune sound robotic?" — a reason to care. |
| Suggestions | 1. (M) Add a one-line legend in the display: "Each amber mark = one sung note. Its top = start, its bottom = end. The line it should land on = the right note." Or number the notes 1–6 in melody order. 2. (M) Explain ¢ on the display itself the first time: "¢ = cents; 100 cents = one piano key". 3. (S) Rename ENDS → "ENDS OFF BY" so "ENDS 45¢" reads as a sentence. 4. (S) Hide τ and dBFS lines under a fold. 5. (S) Sound off: add a short visual "replay" (animate the curve drawing from top to bottom when SPEED changes) so FAST vs SLOW is SEEN as snap vs glide. |
| Hobbyist | Uses Auto-Tune/Melodyne; the cents grid and retune speed map directly. Would find the vertical time axis odd at first. |

## Page 2 · LEARN tab

| Field | Finding |
|---|---|
| First look | Paragraph "Pitch correction measures each sung note, finds the nearest line on a grid, and pulls the note toward it. Pitch error is counted in cents: 100 cents make one semitone." |
| Overwhelm | 2 — the shortest, clearest LEARN page in my group. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes — GUIDED STEPS start with "Slide AMOUNT all the way left, to OFF". |
| Words they would not know | semitone (not defined: "one step on a piano, white or black key"), τ (step 3 "Each τ closes only about two-thirds of the gap"), ratio. |
| Follows / continues? | Yes. |
| What works | COMMON MISTAKES are practical and honest ("correction polishes a good performance, it doesn't replace singing in tune"; "the nearest line is not always the right note"). |
| Suggestions | 1. (S) Define semitone in the first paragraph. 2. (S) Replace "Each τ" in step 3 with "every 0.4 s". |
| Hobbyist | Excellent, especially the "nearest line can be outside the key" warning. |

## Page 3 · CHECK tab (4 questions)

| Field | Finding |
|---|---|
| First look | Q1 "On the cents grid, how many cents make one semitone?" |
| Overwhelm | 1–2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes; the CHECK intro says "read ENDS before you answer" — a good bridge to EXPLORE. |
| Words they would not know | semitone, vibrato, CORRECTION AMOUNT (dock says AMOUNT). |
| Follows / continues? | Yes; no WHAT'S LEFT link at the end (same as Oscillator/Noise/Harmonic). |
| What works | Q4 (40 cents flat at 50% → 20 cents flat) is answerable by trying it on EXPLORE. |
| Suggestions | 1. (S, SHARED F8). 2. (S) Add the end-of-lab "what's next" (SHARED). |
| Hobbyist | Easy. |

## Lab verdict — AutotuneLab

**Beginner's journey:** A beginner arrives with a word they already know ("Autotune") and gets a clear definition and a clear first action. Sliding AMOUNT to OFF and back shows the notes leaving and re-joining their lines, which works even without sound. The picture's reading rule (time runs down each note, pitch runs across) is unusual and unexplained on the display, so the learner sees "squiggles near lines" rather than "a melody being tuned". The heart of the lab — robotic snap vs natural glide — is a sound and is not available sound-off.

**3 biggest orientation problems**
1. The cents grid has no on-display legend for its unusual orientation or note order.
2. ¢ / cents / semitone are explained in popups and LEARN, not on the display where the numbers are.
3. The snap-vs-glide payoff needs sound; there is no visual animation of the speed difference.

**3 best things**
1. Familiar hook ("Autotune") + plain term card.
2. AMOUNT OFF ↔ 100% visible before/after.
3. LEARN's short, honest COMMON MISTAKES.

**First 30 seconds rewrite:** "This singer is a bit out of tune on purpose. Each amber mark is one note; the grey line beside it is where it should be. Slide AMOUNT to OFF — see how far off each note is (in cents: 100 cents = one piano key). Slide it back to 100% — watch them snap onto their lines."
