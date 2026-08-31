# Lab design + learning pass — 2026-08-31

**Pro Audio Training Academy** · owner-commissioned unattended day run.

## THE BRIEF (owner, before leaving)

Two agents, working as a pair, across every Audio Fundamentals and Advanced
Training lab:

1. **Design agent** — assess, **grade**, and report improvements.
2. **Learning & cognition agent** — expert in understanding and retention —
   works *with* the design critique to redesign the lab optimally.

Owner rulings for this run:
- **Implement everything the agents recommend**, including labs the owner had
  previously approved and including core visuals.
- **Commit and push as I go** (`origin/audio-tools-engine`).
- If a lab fights back twice: **log it blocked, move on.** Do not burn the day.
- Owner away until ~22:00. Do not stop. A retry after the 5-hour window should
  resume from this file with no further instruction.

### The one carve-out I hold
I will not remove an **honesty/accuracy disclaimer** — "ILLUSTRATIVE MODEL — NOT
A MEASUREMENT", "UNCALIBRATED", "SYNTHESIZED TEACHING SIGNAL", "ESTIMATED". Those
govern what the app *claims*, not how it looks; changing them would make the
product assert something untrue. If an agent recommends it, everything else in
that recommendation ships and the disclaimer item is written up for the owner.

## HOW TO RESUME (read this first after any compaction, retry or model switch)

The browser is a **single shared resource** — agents cannot drive it in
parallel without corrupting each other's navigation. The cycle is therefore
strictly sequential, one lab at a time:

1. Open the lab, capture evidence.
2. **Design agent** → graded critique.
3. **Learning agent** → responds to that critique, reconciles, proposes the redesign.
4. Synthesise → implement → `tsc` + browser verify → **one commit per lab** → push.

Update this lab's row the moment its state changes. Resume at the first row that
is not `pushed`.

**Environment:** Metro on **8090** (web preview), browser pane must stay visible,
app boots to guest mode. Member labs unlock by **long-pressing the "Pro Audio
Training Academy" wordmark on Home** (cycles mock entitlement to `academy`).
Scope every synthetic tap to elements NOT inside `[aria-hidden="true"]` — React
Navigation keeps earlier screens mounted underneath and they WILL be clicked
otherwise. JS calls time out at 45 s, so keep each browser step small.

## STATUS

Legend: `pending` · `assessed` (design agent done) · `paired` (learning agent
done) · `implemented` · `pushed` · `blocked: reason`

### Audio Fundamentals (13)

| # | Lab | State |
|---|---|---|
| 1 | Understanding Level & Amplitude | pushed |
| 2 | Foundations of Sound | pending |
| 3 | Sound Playground | pending |
| 4 | Microphone Principles | pending |
| 5 | Wave Physics Laboratory | pending |
| 6 | Speaker Placement & Coverage | pending |
| 7 | Digital Audio Systems | pending |
| 8 | Visual Audio Analysis | pending |
| 9 | Signal Chain Builder | pending |
| 10 | Signal Detective | pending |
| 11 | Cable & Connector Fundamentals | pending |
| 12 | Cable Dressing & Installation | pending |
| 13 | Gain Staging | pending |

### Advanced Training Labs (25)

| # | Lab | State |
|---|---|---|
| 14 | Audio Calculator Laboratory | pending |
| 15 | Vacuum Tube Fundamentals | pending |
| 16 | Distortion | pending |
| 17 | Compression | pending |
| 18 | Gate / Expander | pending |
| 19 | Limiter | pending |
| 20 | Equalizer | pending |
| 21 | EQ Lab | pending |
| 22 | Bass Guitar Physics | pending |
| 23 | Microphone Selection Lab | pending |
| 24 | Chorus | pending |
| 25 | Flanger | pending |
| 26 | Phaser | pending |
| 27 | Phase | pending |
| 28 | Autotune | pending |
| 29 | Harmonograph | pending |
| 30 | Stereo Imaging | pending |
| 31 | Binaural Panner | pending |
| 32 | Oscillators | pending |
| 33 | Noise | pending |
| 34 | Harmonics | pending |
| 35 | FM Synthesis | pending |
| 36 | Delay | pending |
| 37 | Reverb | pending |
| 38 | Modular Synth | pending |

## GRADES & FINDINGS

### 1 · Understanding Level & Amplitude — PUSHED

**Design grades:** hierarchy C+ · density B · affordance C− · copy B+ · idiom B− · first-15s B−.
**Learning grades:** sequencing B− · load B · **interaction F** · **recognition C−** · **retention F** · misconceptions B.

**Shipped:** the RAMP CHECK (3 retrieval trials gating credit: decode / transfer
to an unfamiliar pad-grid display / spot-the-violation where the broken RTA
draws its LOUD band blue — never quiet-as-red); single completion control that
records orientation + af_amplitude credit in one press (closes the lost-credit
trap); rule primed above the ramp + para 2 moved to the six cards (re-seated,
never reworded); title2 → amber eyebrow; honesty line promoted into the
LEARNING CONVENTION card as a badge; axis/tick contrast 8px 2.6:1 → 9.5px
proper; 44pt back; TEST YOURSELF AGAIN replay on revisits.

**Verified:** walked as a fresh student — 3 wrong answers produced their
corrective lines, pass enabled the button, one press wrote both storage flags.

