# AP&E — MIDI Amplitude Color Scheme (reference of record)

**Date:** 2026-08-17 · **Scope:** how amplitude/level maps to color anywhere a
student sees it **drawn** (not read as text is a special case — see §5.6).
**Source of truth:** `src/features/tools/levelColor.ts` (owner standard
2026-07-31). One ramp, app-wide, so "red = loud, blue = quiet" transfers between
every tool and lab and the color itself teaches level.

---

## 1. What it is

The scheme is the **MIDI note-velocity ramp**. Silence is velocity 0 = **blue**
at the zero/mid line; as amplitude grows away from that line the color climbs

> **blue → green → yellow → orange → red** (louder = redder).

Because there is exactly ONE ramp, amplitude reads identically across every
meter, waveform, spectrogram, and readout. The mid line (0 amplitude) is ALWAYS
drawn MIDI-0 blue (`MIDLINE_BLUE`).

There is a *second, older* coloring used only by the LED segment meter's default
mode — a **positional green→red** scale (green 0–10, yellow 11–14, orange 15–17,
red 18–20). That is NOT the MIDI scheme; the MIDI (blue→red) ramp is opted into
per meter via the `midi` flag (§7).

---

## 2. The ramp (canonical stops)

`LOUDNESS_STOPS` — indexed by `pos`, where **pos 0 = loudest (full scale)** and
**pos 1 = silence (the mid line)**:

| pos | color | band |
|---|---|---|
| 0.00 | `#ff5f4e` | full scale — **red** |
| 0.14 | `#e6902f` | orange — only the hot top |
| 0.30 | `#e8c341` | yellow — a thin "getting hot" band |
| 0.48 | `#3fae52` | **green** — healthy range, upper edge |
| 0.72 | `#3fae52` | **green** — healthy range, lower edge |
| 1.00 | `#2f74ff` | silence / mid line — **MIDI-0 blue** (`MIDLINE_BLUE`) |

**Design intent (owner 2026-08-07):** GREEN is deliberately WIDE — the
"good/healthy" operating band should dominate the middle of the scale, so
moderate levels read green rather than jumping to yellow. Two identical green
stops (0.48 and 0.72) hold a solid green plateau; yellow is a thin band near the
top; orange/red are reserved for hot → clipping; blue holds a wide floor below
0.72.

`MIDLINE_BLUE = #2f74ff` — the color of every amplitude mid/zero line and the
center of every waveform.

---

## 3. Execution — the color functions (the API)

All live in `src/features/tools/levelColor.ts`. Colors are computed by linear
RGB interpolation between the stops (`hexToRgb` → lerp → `rgbToHex`).

| Export | Signature | Returns / use |
|---|---|---|
| `MIDLINE_BLUE` | const `#2f74ff` | The zero/mid-line and silence color. |
| `LOUDNESS_STOPS` | `{pos,color}[]` | The canonical stop table (§2). |
| `levelColor(l)` | `l` 0=silence…1=full scale → hex | The core lookup. `levelColor(0)===MIDLINE_BLUE`. Internally `pos = 1 − l`. |
| `levelColorForDb(db, minDb=-60, maxDb=0)` | dB → hex | Maps a **numeric dB** onto the ramp; ≤minDb blue, ≥maxDb red. Non-finite/null → `MIDLINE_BLUE`. Default −60…0 dBFS window matches the meters. |
| `heatColor(t01)` | `t01` 0=silence…1=loud → hex | Heat-map / spectrogram cell color. Same ramp, but the bottom 10% **fades to BLACK** (`k = min(1, t/0.1)`) so ZERO signal is genuinely dark, not a lit wall of blue. Blue re-emerges the moment there is anything to show. |
| `WAVE_LEVEL_STOPS` | `{offset,color}[]` | Symmetric SVG gradient stops for a **zero-centred waveform**: `offset` 0 (top,+FS)=red → 0.5 (center,0)=blue → 1 (bottom,−FS)=red. Magnitude drives color: `color = levelColor(|1 − 2·offset|)`. |
| `rampColors(level, steps=6)` | → `[base…tip]` | Gradient colors for a **level-encoding bar**: blue base climbing to `levelColor(level)` at the tip. For `expo-linear-gradient` `colors`. |
| `rampColorsSymmetric(level, half=3)` | → `[tip…center…tip]` | Same, but for a **zero-centred (bipolar) bar**: blue at the center line, peak color at BOTH tips. |

---

## 4. Delivery — how the color reaches each display type

- **Level/VU bars & fills** → `rampColors(level)` (or `rampColorsSymmetric` for
  bipolar) fed straight to an `expo-linear-gradient` `colors` prop. **Standing
  ruling (owner 2026-08-16):** a bar whose SIZE encodes level must show the ramp
  **climbing to its peak color at the tip only** — never a whole bar flooded with
  the peak color. Base→tip maps left→right (horizontal) or bottom→top (vertical).
- **Waveforms & oscilloscopes** → `WAVE_LEVEL_STOPS` as SVG `<Stop>`s on a
  gradient whose axis is mapped to the **pixels of ±full scale** (`userSpaceOnUse`)
  so color tracks true level regardless of vertical zoom; the zero line is drawn
  `MIDLINE_BLUE`.
- **Spectrograms & heat maps** → `heatColor(t01)` sampled into an RGB LUT and
  written per cell (and into the legend strip).
- **RTA / spectrum bars** → a gradient built from `LOUDNESS_STOPS` (red at 0 dBFS
  → blue at the floor) painted across the spectrum columns.
- **Numeric dB readouts** → `levelColorForDb(db)` as the `Text` `color`, so a
  number carries the same blue→red language as the meter beside it.
- **LED segment strips** → the `LedMeter` `midi` prop recolors the strip with
  `levelColor(i/20)` per segment (§7).

---

## 5. Current use — inventory by display category

Verified against `src/` (28 consumer files import `levelColor.ts`, plus the
`LedMeter.midi` application).

### 5.1 LED segment meters
- `src/components/LedMeter.tsx` — 21-segment strip; `midi` mode = `levelColor(i/20)`
  per segment (blue→red), default = positional green→red. `LedMeterWell` wraps
  `<LedMeter … midi />`.
- `src/screens/lab/amplitude/AmplitudeOrientation.tsx` — hand-built LED segments
  colored `levelColor((i+0.5)/n)`.

### 5.2 Level / VU bars & fills (all `rampColors` / `rampColorsSymmetric`, + `levelColor` tints)
- `src/screens/tools/MultiMeterScreen.tsx` — SPL fill bar `rampColors(splFrac)`.
- `src/screens/lab/gain/gainViz.tsx` — vertical + horizontal gain-stage meters
  (`rampColors` fill + `levelColor` tint).
- `src/screens/lab/HarmonicStems.tsx` — stem level bar `rampColors(frac)`.
- `src/screens/lab/foundations/bits.tsx` — level bar `rampColors(value)` + a
  `levelColor(value)` accent when `levelTint` is set.
- `src/screens/lab/gain/modules/modExplore.tsx` — node meters tinted `levelColor(…)`.
- `src/screens/lab/amplitude/AmplitudeOrientation.tsx` — bipolar `rampColorsSymmetric`
  bar + unipolar `rampColors` bar.

### 5.3 Waveforms & oscilloscopes (all `WAVE_LEVEL_STOPS` + `MIDLINE_BLUE`)
- `src/screens/tools/WaveformScreen.tsx`, `src/screens/tools/SignalGenScreen.tsx`
  (gated by its COLORS toggle — §8), `src/screens/lab/OscillatorLabScreen.tsx`,
  `src/screens/lab/tube/viz.tsx`, `src/screens/lab/digital/vizSignal.tsx`
  (+`levelColor` amp tint), `src/screens/lab/foundations/viz.tsx` (+ vertical
  amplitude scale + tick tints), `src/screens/lab/fxAnim.tsx`.
- Demos: `src/components/tooldemos/WaveformDemo.tsx`, `…/SignalGenDemo.tsx`.

### 5.4 Spectrograms & heat maps (all `heatColor`)
- `src/screens/tools/SpectrogramScreen.tsx` (raster + 32-cell legend; readout via
  `levelColorForDb`), `src/screens/tools/MultiMeterScreen.tsx` (built-in
  spectrogram), `src/screens/lab/meter/vizSpectral.tsx` (+ `levelColor` cell tint,
  `LOUDNESS_STOPS` gradient), `src/screens/lab/wave/vizWave.tsx` (SPL heat + node
  tint), `src/screens/lab/micspeaker/viz.tsx` (2-D SPL field + radial glow),
  `src/screens/lab/HarmonicsView.tsx` (spectrogram + per-harmonic tint + waveform).
- Demo: `src/components/tooldemos/SpectrogramDemo.tsx` (`levelColor` cells).

### 5.5 RTA / spectrum bars (all `LOUDNESS_STOPS`)
- `src/screens/tools/RtaScreen.tsx` — `rtaBarFillMidi` gradient (gated by COLORS
  toggle — §8; readouts via `levelColorForDb`).
- `src/screens/lab/eq/modules/LiveSpectrumEq.tsx`, `…/SeeingFrequency.tsx`,
  `src/screens/lab/meter/vizMeters.tsx`.

### 5.6 Numeric dB readouts (all `levelColorForDb`, tinting the text)
- `src/screens/tools/SplMeterScreen.tsx` (Peak / Peak-Hold, incl. fullscreen),
  `src/screens/tools/MultiMeterScreen.tsx` (A-Fast/Peak/Z-Fast/Peak-Hold),
  `src/screens/tools/WaveformScreen.tsx` (peakDb), `src/screens/tools/RtaScreen.tsx`,
  `src/screens/tools/SpectrogramScreen.tsx`.

### 5.7 Everything else
- `src/screens/lab/eq/modules/eqMath.ts` — `levelColor(db/maxDb)` colors an EQ band by gain.
- `src/screens/lab/amplitude/AmplitudeOrientation.tsx` — the **color-language
  orientation screen**; the single biggest consumer, exercising every export
  (mid-line, wave, heat, LED, bars) as the teaching surface for the whole scheme.

---

## 6. Settings / tunable knobs

Change these in ONE place (`levelColor.ts`) and every display follows:

- **Ramp shape** — `LOUDNESS_STOPS` positions + colors (§2). Widen/narrow green,
  move the yellow band, etc.
- **Mid-line / silence color** — `MIDLINE_BLUE`.
- **Numeric window** — `levelColorForDb` defaults `minDb=-60`, `maxDb=0` (per-call
  overridable).
- **Heat-map silence floor** — `heatColor`'s `k = min(1, t/0.1)` (0.1 = the
  fraction of the ramp over which brightness climbs from black to full).
  **Owner ruling 2026-08-28: blue fades to BLACK at zero signal.** The floor
  used to be 0.22, i.e. silence still rendered as a lit deep navy; on a 2-D
  field or a spectrogram that painted "no signal" as a solid blue area. Only
  `t < 0.1` changed — every value at or above 0.1 is bit-identical.
- **Bar resolution** — `rampColors(level, steps=6)`, `rampColorsSymmetric(level, half=3)`.
- **Waveform stop density** — `WAVE_LEVEL_STOPS` offset array.

Per-display opt-ins (NOT in `levelColor.ts`):
- `LedMeter` `midi` flag (§7).
- The user-facing **COLORS** toggle on RTA and SignalGen (§8).

---

## 7. LED-meter `midi` mode — status & a documentation conflict to resolve

`src/components/LedMeter.tsx` renders the 21-segment strip in one of two color
modes: **default positional green→red**, or **`midi` = the blue→red velocity
ramp** (`levelColor(i/20)`).

**Who passes `midi` today:**
- `DashboardScreen.tsx:482` — glass **study-method / quiz progress meters**
  (`flat midi`, owner 2026-08-13).
- `DashboardScreen.tsx:1388` — **Overall / Total Progress vertical VU column**
  (`vertical midi`).
- `LedMeterWell` (`LedMeter.tsx:118`) — the wrapper used by all four study-method
  screens: `FlashcardsScreen`, `FillInBlankScreen`, `MatchingScreen`,
  `ScenariosScreen`.

**Who does NOT (kept on the default green→red for contrast):** `EnrollmentScreen`
LedMeters, and the powered-off dashboard method panel (`filled={0}`).

> **Resolved 2026-08-17.** The `LedMeter.midi` prop comments (LedMeter.tsx:23–24
> and 54–57) previously read *"experimental… likely revert… used only by the Total
> Progress vertical meter"* — now corrected to the **standard** established by the
> owner 2026-08-13 ruling: `midi` is the study-method progress-meter standard (the
> dashboard glass method/quiz meters + all four study screens via `LedMeterWell`).
> The **Total Progress vertical column** (DashboardScreen.tsx:1385) remains a
> deliberately-isolated experimental comparison and keeps its own call-site note.
> The `levelColor.ts` ramp itself was never in question.

---

## 8. The user-facing "COLORS" toggle (separate mechanism)

`RtaScreen.tsx` and `SignalGenScreen.tsx` expose a **COLORS** toggle (`midiColors`,
owner 2026-08-05) that switches those displays' spectrum/scope onto this same ramp
(`LOUDNESS_STOPS` / `WAVE_LEVEL_STOPS`). This is a per-screen display option, NOT
the `LedMeter` `midi` prop — don't conflate them.

---

## 9. Governance references

- `levelColor.ts` header — amplitude color standard (owner 2026-07-31); green-wide
  tuning (2026-08-07); unify all heat maps (2026-08-02); dB-readout tint (2026-08-12).
- `APE_GOVERNANCE_DECISIONS_2026_08_17.md` R3 — the **LEVEL-BAR RAMP STANDARD**
  (owner 2026-08-16): bars encode level by climbing to a tip color via
  `rampColors`/`rampColorsSymmetric`; the applied/audited surface list.
- Standing render/integrity rule recorded in assistant memory `integrity-and-governance`.

---

## 10. TWO RAMPS: meters vs fields (owner 2026-08-28)

The owner, looking at the Mic Principles DISTANCE field: *"it takes so little
space to go from red to green, yet then green takes the entire screen across
just to start blue. This is not a gradient, it is skewed, it must show a
gradient that doesn't need interpretation."*

Both ramps carry the SAME hue order and the SAME meaning (blue = quiet,
red = loud). Only the SPACING differs, because **a meter JUDGES a level while a
field MAPS one**:

| | `LOUDNESS_STOPS` → `levelColor()` | `FIELD_STOPS` → `fieldLevelColor()` |
|---|---|---|
| Used by | meters, bars, waveforms, readouts | 2-D heat fields, gradients (`heatColor`) |
| Green | **deliberately WIDE** (two identical stops) so the healthy operating range dominates — the 2026-08-07 ruling, which STANDS | evenly spaced |
| Reads | "am I in the good range?" | "how much quieter is it over there?" |

Pick by asking what the surface is FOR. Never widen the field ramp's plateau to
match the meter's, and never flatten the meter's green to match the field's.

**Blue fades to BLACK at zero signal** (owner 2026-08-28). `heatColor` used to
floor brightness at 0.22, so true silence still rendered as a lit deep navy — a
2-D field showed a wall of blue where there was NO signal. The bottom 10% of the
ramp now fades all the way out, so "dark = nothing there" is honest.

---

## 11. Sweep 2026-08-28 — where the standard does NOT apply

Owner: *"look for and correct any other screens/labs where this should be
corrected."* Corrected: Foundations `LevelMeterBar`, the digital gain-staging and
float/fixed meters, the Oscillator's 12 harmonic bars, Foundations spectrum
sticks, the RT60 decay trace, FREQUENCY COUNTER + EXPOSURE MONITOR level
readouts, the Amplitude Orientation readouts, and the ToolsHub tile ramps (which
had drifted onto near-miss hexes and are now DERIVED from `levelColor`).

Four surfaces were checked and **deliberately left alone**. The standard governs
anything whose SIZE or HEIGHT encodes AMPLITUDE. It does not govern:

1. **Series identity** — `vizChain` trace colours (HELD vs CODE OUT, FLOAT vs
   FIXED) and `SplDemo`'s PEAK/RMS/SLOW bars. These distinguish *which signal*,
   not *how loud*; ramping them would make three traces one colour and destroy
   the comparison that IS the lesson.
2. **Regulatory thresholds** — the Exposure Monitor dose bar. Dose is
   accumulated exposure against a legal limit, and its green/amber/red steps ARE
   the 80% warning and 100% limit. A smooth ramp would erase the two boundaries
   a listener needs to act on.
3. **Quantities that are not levels** — `fxViz` `GrMeter`. Gain reduction is how
   much the compressor is REMOVING; more GR means the signal got *quieter*, so
   the amplitude ramp would be actively backwards there. Amber is correct.

Each is commented in place with this reasoning, so the next sweep doesn't
"fix" them.

### RESOLVED — the CSD waterfall (owner 2026-08-28)

`src/screens/lab/meter/vizSpectral.tsx` `WF_HEAT_STOPS` **inverted the
standard**: white-hot peaks → orange → deep RED base, so the quietest part of
the display was the reddest. Because the whole ramp sat in the amber family,
only red and yellow ever appeared and the mountains carried no level
information. It had been built against a CSD reference screenshot (2026-07-29),
so it was raised rather than silently converted.

Owner ruled: *"the waterfall is not showing level via our colors, look at the
scale in the same reference, if the level goes down, it color matches."*

**The reference's own dB scale is the authority.** A reference look never
outranks the level standard where the two disagree — matching a screenshot's
palette is not a reason to teach a student that quiet is red. The waterfall now
uses `fieldLevelColor` anchored to the full dB axis, so colour maps onto the
scale the display already prints: +12 red · 0/−10 orange · −20 yellow · −30
yellow-green · −40 green · −50 teal · −60 blue. The ridge stroke rides the same
ramp (lifted 35% toward white) instead of a fixed white-hot colour, which was a
second reason the display read amber regardless of level.

**Time direction.** Owner, same ruling: *"do not rewind time by showing the
waterfall in reverse - show one direction (time)."* The collapse phase cleared
the range front-first, draining the oldest, most-decayed slices before the
newest — the range retreating and the decay un-decaying, once per loop. Build
and clear now both sweep back → front.

**Rule to carry forward:** when a reference look and the level standard
disagree, the standard wins, and any animation of a time axis runs in ONE
direction — a loop may cut, but it may never play backwards.
