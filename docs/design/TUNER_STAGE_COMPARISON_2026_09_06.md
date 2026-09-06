# Stage tuner — comparison of the two research reports (2026-09-06)

Report A: `TUNER_STAGE_RESEARCH_2026_09_06.md` (ccode, forums + 2026 guides + manufacturers).
Report B: the owner's ChatGPT report ("CenterLock Stage Tuner").

## 1. Where they agree (high confidence — both found it independently)

- **Readability from standing height beats precision.** Big note name, unmistakable flat/sharp direction, near-black ground with very bright primaries, a daylight palette, portrait and landscape.
- **Strobe is an expert mode, not the default.** Both cite Peterson's own point that a string is never perfectly stable, so a strobe never quite stops — frustrating as the only view.
- **Colour is never the only channel.** Position, arrows, words and colour together; red/green alone fails colour-blind players and coloured stage light.
- **Fast acquisition, then damping.** Lock quickly, then hold still; a flickering cents number is useless; over-damping feels delayed.
- **Octave must be visible and correct.** Showing "E" without E1/E2/E4 is a defect; bass B0 (30.87 Hz) and E1 (41.20 Hz) must not be read as their louder octave harmonics.
- **Presets one tap away, never menus while holding an instrument.** Instrument, tuning and A4 set before the set.
- **Polyphonic is a check, not the tuner.** Less reliable, about 3 cents, weak for bass and violin.
- **Keep the screen awake. No audible confirmation by default.**
- **The phone mic is the real limitation.** Loud stages and low bass defeat an air mic; both reports say so plainly.

## 2. What Report B adds that A missed

| Item | Why it matters | Take it? |
|---|---|---|
| **Positive "locked" confirmation with a hold time** (≈350 ms inside the zone before IN TUNE; no repeat until the pitch leaves and returns) | Prevents the flicker-confirm that players hate; gives a definite end state | **Yes** — core of the design |
| **Individual string targets + manual string lock** | Stops the target changing while the player is still tuning (a top app complaint), and prevents right-note-wrong-octave | **Yes** |
| **Mirror/converging meter** (Korg Pitchblack X) as a distance-readable motion | Two sides closing on a centre reads from across a room | **Yes, as the meter motion**; treat "stage performers favour it" as one product's feature, not a surveyed preference |
| **Violin as a separate tuning model** (perfect fifths at A4: G3 195.56 · D4 293.33 · A4 440 · E5 660; equal-temperament alternative; tune A first) | A real second audience; the fifths maths is correct | **Yes, phase 2** — guitar and bass first |
| **String strip with checkmarks; tuned-string status** | Progress at a glance, and beginners never lose their place | **Yes** |
| **Input source and confidence meter** (built-in mic, USB-C interface, contact mic when available) | Honest about signal quality; an interface is the only real fix for loud stages | **Yes for the confidence meter now; interface/contact input is an engine item to scope** |
| **Hide non-essential controls after ~2 s** | The screen becomes the meter | **Yes** |
| A named concept ("CenterLock") and a screen-region layout | Makes the spec buildable | **Yes, as the working name** |

## 3. What Report A adds that B missed

| Item | Why it matters | Take it? |
|---|---|---|
| **Low-string physics and the acceptance test.** B1 ≈ 61 Hz, B0 ≈ 31 Hz: detection needs several cycles, so the lock is inherently slower; praised hardware is judged on exactly this | Sets a measurable target: B1/E1 lock time and stability, tested, not assumed | **Yes** |
| **Why octave errors happen** (weak fundamental, pluck near the bridge, fresh strings, sympathetic ringing) and the **12th-fret harmonic** workaround | Lets the app *explain* a bad reading instead of showing a wrong one | **Yes** — a one-line coaching hint when confidence is low on a low string |
| **Colour as a magnitude spectrum** (violet → blue → cyan → green → yellow → orange → red) | Error size reads as colour at distance, and it is not red/green-only | **Yes**, alongside position and words |
| **Orientation flip** | Floor and headstock use | **Yes** (landscape/portrait already in B) |
| **Mute is part of the tuner** and the etiquette behind it | The app never emits sound while tuning; "ask for pitch in the wedge" | **Yes** — an explicit silent rule, plus reference-tone only on demand |
| **Sweetened tunings** (Peterson) and A4 down to 415 | Compensates real guitar intonation; baroque/orchestral references | **Later** — presets first |
| **App latency numbers** (150–250 ms behind hardware) | A budget to beat, measurable in dev | **Yes** — add timing marks |
| **Honesty line** about the microphone on the stage view | Matches the app's ratified honesty standard | **Yes** |
| What the app already has (A4 432–444, ±50 ¢ arc, ±5 ¢ band, YIN engine) | The build starts from facts | **Yes** |

## 4. Where they differ, and the resolution

| Topic | Report A | Report B | Resolution |
|---|---|---|---|
| **In-tune zone** | Field: typical ±3, good pedals ±1; app today: ±5 band, <1 ¢ "in tune" | ±2 ¢ default, validate with musicians | **±2 ¢ confirmation zone**, with the ±5 ¢ "close" band still drawn so the approach is visible; expert strobe view for ±0.1 |
| **Lock speed** | <≈200 ms acquisition where the signal allows | 350 ms hold before confirming | Not a conflict: **acquire fast, confirm after 350 ms stable**. Measure the hold from lock, not from note onset, so low B is not punished twice |
| **Default meter** | Centre-seeking needle/bar (what most players use) | Mirror/convergence meter | **Converging meter with a fixed −50…+50 scale and a centre target** — it is still centre-seeking, just readable farther away |
| **Haptic on lock** | Not covered | One haptic pulse, optional | **Yes**, through the app's existing haptics gate, never repeating until re-entry |
| **Scope of instruments** | Guitar and bass | Guitar, bass, violin | Guitar 6/7 and bass 4/5/6 first; violin model second |
| **Evidence quality** | Forum quotes and numbered specs | Product features and reviews; self-rated "moderate to high" | Both are review-and-forum based; neither is a survey. Treat every threshold above as a starting value to validate on device with real players |

## 5. Merged direction for the build

**CenterLock Stage Tuner** (working name), as a new full-screen tool in Measurement & Analysis, sharing the existing YIN engine:

1. **Default view:** converging meter on a fixed −50…+50 ¢ scale; enormous note + octave; string identity; direction words; large signed cents; colour spectrum for magnitude; positive IN TUNE lock after 350 ms inside ±2 ¢ with one haptic, no repeat until re-entry.
2. **String strip** with per-string status and manual lock on tap; targets never change on their own while a string is being tuned.
3. **Presets one tap deep:** instrument (guitar 6/7, bass 4/5/6; violin later), tuning (standard, drop, open, capo offset), A4 (415–444).
4. **Low-string honesty:** octave always visible, fundamental preferred over overtones, a confidence meter, and a coaching hint ("try the 12th-fret harmonic") when confidence stays low on a low string. B1/E1 lock time is the acceptance test.
5. **Expert modes:** Strobe Precision (labelled ±0.1 ¢) and Manual String.
6. **Stage rules:** silent by default, reference tone only on demand, keep-awake, controls fade after 2 s, portrait and landscape, daylight palette, the mic honesty line.
7. **Measure it:** dev timing marks from note onset to lock and to confirm, compared against the 150–250 ms app-latency figure.

## 6. Decisions for the owner before design starts

1. Confirm the ±2 ¢ confirmation zone and 350 ms hold as the starting values.
2. Guitar + bass first, violin second — or all three in one pass.
3. Whether an external input (USB-C interface) is in scope for the engine this cycle, or the honesty line carries it.
4. The tool's name on the hub tile and whether it replaces or sits beside the existing Frequency Counter & Tuner mode.
