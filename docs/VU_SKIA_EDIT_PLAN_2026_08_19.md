# VU meter — exact edit plan (Skia internals) — drafted 2026-08-18 for the 08-19 session

Everything left on the tabled VU list lives in the Skia meter components. This is the
apply-and-verify plan. **Nothing here is shipped yet** — each item needs on-device eyes
(meter colors/scale/hit-testing). Two files only:

- `src/screens/lab/meter/vizMeters.tsx` — `VuMeterView` (needle, from L732) and
  `PeakAvgMeterView` (vertical LED, from L2829).
- `src/screens/tools/SplMeterScreen.tsx` — the feeders (brackets, range, layout).

Line numbers are as of commit `caf44e5`; they drift as edits land — the code anchors are
the real locators.

Suggested order: **#5 → #6 → #9 → #3 → #10 → #7 → #4** (cheap/independent first; #4 the
structural layout last). #8 stays blocked.

---

## #5 — PK / AVG number readouts turn RED above 100 dB (normal color below)  [SMALL]

**Where:** `PeakAvgMeterView`, the two `AnimatedTextInput`s:
- PK readout — style `color: '#ffffff'` at ~L3163, driven by `pkMaxReadoutProps` (L3061,
  value = `lHold.value + splOffset`).
- AVG readout — style `color: '#d69bff'` at ~L3188, driven by `avgReadoutProps` (L3055,
  value = `liveRms.value + splOffset`).

**Edit:** these are Reanimated inputs, so animate the color. Add two `useAnimatedStyle`
hooks next to the existing `useAnimatedProps` (L3055–3070):
```ts
const OVER = '#ff3b2f'; // reuse the same red as the over-100 frame stroke (redStrokeOn)
const pkColorStyle = useAnimatedStyle(() => {
  const hv = lHold.value; const s = hv === hv && hv > -119 ? hv + splOffset : -120;
  return { color: s > 100 ? OVER : '#ffffff' };
}, [lHold, splOffset]);
const avgColorStyle = useAnimatedStyle(() => {
  const r = liveRms.value; const s = r === r && r > -119 ? r + splOffset : -120;
  return { color: s > 100 ? OVER : '#d69bff' };
}, [liveRms, splOffset]);
```
Then append the style to each input: `style={[{...existing...}, pkColorStyle]}` /
`avgColorStyle`. Drop the hardcoded `color` from the base style object (the animated one
wins, but remove it to avoid confusion).

**Verify:** play >100 dB SPL est. (or lower `splOffset` via calibrate) — both numbers flip
red at the threshold, back to white/purple below. Confirm the threshold matches the frame
flash (which already trips at `av + splOffset > 100`, L2955).

**Open Q:** owner said "above 100 red" — is that `> 100` (strict) or `>= 100`? Using `>100`.

---

## #6 — Extend the LED meter to 105 dB, everything above 100 shown red  [MEDIUM, Skia]

**Where:** `PeakAvgMeterView` scale constants L2884–2889:
`SPL_BOT=40, SPL_TOP=100, SPL_SPAN=60, SEG=60`; ticks/numerals arrays at L2906 and L3135
(`[40,50,60,70,80,90,100]`); unlit stack `G` L2896–2913; peak loudness gradient L3113–3120
keyed `barTop..barBot`.

**Edit:**
1. `SPL_TOP = 105` (→ SPL_SPAN 65, SEG 65 auto). The `ySpl` remap and all path loops follow
   automatically since they derive from these consts.
2. Numerals/ticks: keep the decade labels `[40..100]` and ADD a `105` numeral+tick, OR label
   `[40,50,60,70,80,90,100,105]`. (105 is off-decade — decide with owner; simplest is add
   just the `105` cap tick so it reads "top = 105".)
3. **Red above 100:** add a dedicated red path for the 100→105 segments rather than relying
   on the MIDI gradient. In the static `G` useMemo build a `redZone` rect from `ySpl(105)` to
   `ySpl(100)` across the bar, and draw the *lit* peak fill above 100 in solid red. Cleanest:
   in `litPeak` (L2988) split the fill — segments with `loS >= 100` use a red path, the rest
   the loudness gradient. Then render two `<Path>`s (gradient for ≤100, `color="#ff3b2f"` for
   >100). Keeps "everything above 100 red" literal and honest.

**Verify:** on-device — the bar now tops at 105; the 100–105 band lights solid red; the
40–100 region keeps the MIDI ramp; ticks/numerals aligned.

**Open Q:** does the frame-flash-red (L2955/3072) stay as-is on top of this, or is it now
redundant given the LED itself reds? Recommend keep both (frame flash = transient clip cue).

---

## #9 — Tap the red MAX # (bottom-left of the VU) to reset peak hold  [SMALL–MEDIUM]

**Where:** `VuMeterView` renders `cornerReadouts.maxText` as an RN `<Lbl>` at bottom-left
(~L1226–1232). The reset handler `resetPeakHold` lives in `SplMeterScreen` (L549) and is
already wired to the PEAK HOLD cell.

**Edit:**
1. Add an optional prop to `VuMeterView`: `onResetMax?: () => void`.
2. Wrap the maxText `<Lbl>` (L1226–1232) in a `<Pressable onPress={p.onResetMax} hitSlop={10}
   accessibilityLabel="Reset peak hold">` (only when `onResetMax` is set). The Lbl is an RN
   overlay above the Canvas, so it takes the tap fine.
3. In `SplMeterScreen`, pass `onResetMax={resetPeakHold}` to both `VuTopMeter` calls (home
   L1483, Full VU L1778) — and thread it through the `VuTopMeter` wrapper (L105) as a new
   prop → `cornerReadouts` is already passed; add `onResetMax` alongside.

**Verify:** tap the MAX number → the peak-hold cap + PK MAX readout clear. Confirm it doesn't
also toggle START/STOP (the dial toggle is a different Pressable — the MAX Lbl sits above it,
so its own Pressable should capture; verify no pass-through).

---

## #3 — Double-range toggle (next to the RANGE title)  [MEDIUM]

Doubles the dB span the VU maps. Normal RANGE 80: 80 @ 0 VU, 60 @ −20 (20 dB span). Doubled:
80 @ 0 VU, 40 @ −40 i.e. at the −20 mark it reads 40 (40 dB span). Needle deflection per dB
halves; bracket labels change.

**Needle math** — `VuMeterView` L939:
```ts
target = d === d && d > -120 ? RMS0 * Math.pow(10, (Math.min(12, d) - LIVE0) / 20) : 0;
```
Add prop `dbPerVuFactor?: number` (default 1). Change `/ 20` → `/ (20 * factor)`. With
factor 2, a signal 40 dB below `LIVE0` parks where 20 dB did → the scale spans 40 dB. (0 VU
unchanged since exponent 0.) **One-line change + one prop.**

**Bracket labels** — `SplMeterScreen` `vuBrackets` L976–981:
```ts
const span = vuDoubleRange ? 40 : 20;
const vuBrackets = {
  lowText: `${rangeRef - span}`,       // −20 mark
  mid10Text: `${rangeRef - span / 2}`, // −10 mark
  mid5Text: `${rangeRef - span / 4}`,  // −5 mark
  highText: `${rangeRef}`,             // 0 mark
};
```

**State + toggle:**
1. `const [vuDoubleRange, setVuDoubleRange] = useState(false);` near `rangeDb` (L796).
2. `const dbPerVuFactor = vuDoubleRange ? 2 : 1;` — pass to every `VuTopMeter` (home L1483,
   Full VU L1778) → thread through the `VuTopMeter` wrapper (L105) to `VuMeterView`.
3. Toggle UI "next to the RANGE title": add a `2×` / `DOUBLE` toggle chip in the range chooser
   popup header (the popup titled `RANGE · dB AT 0 VU`, L1818+), OR a small pill on the RANGE
   ctrl-bar button. Recommend the popup header — it's literally next to the RANGE title.

**Verify:** toggle on → the −20 bracket reads `rangeRef−40`, mids update, and a −40 dB signal
parks at −20 VU (needle swings half as far per dB). 0 VU unchanged.

**Open Q:** does the numeric help text (L1746) that says "…→ RANGE−20 at −20" need to reflect
the doubled span? Update it to use `span`.

---

## #10 — Full VU opens in double-range  [TRIVIAL, depends on #3]

Owner: "VU in fullscreen mode opens in auto (double range)."

**Edit (after #3):** simplest coherent option — when Full VU opens, force double-range. In the
`setVuFsOpen(true)` opener, also `setVuDoubleRange(true)`. OR give Full VU its own factor:
pass `dbPerVuFactor={2}` to the Full VU `VuTopMeter` (L1778) regardless of the home toggle,
leaving the home on the user's toggle.

**Open Q (decide with owner):** should Full VU ALWAYS be doubled (independent of the home
toggle), or should opening Full VU flip the shared toggle on? Recommend Full-VU-always-2 via
its own prop — keeps home and Full VU independent.

---

## #7 — Long-press the AVG # → custom color (color wheel)  [MEDIUM–LARGE, custom UI]

**Where:** AVG readout `AnimatedTextInput` (L3173, `pointerEvents="none"`), color currently
`AVG_PURPLE`/`#d69bff`.

**Edit:**
1. Make the AVG color a prop: `avgColor?: string` on `PeakAvgMeterView` (default `#d69bff`);
   use it for the AVG fill (`AVG_PURPLE` L2858 / L3106), the AVG readout, and the "AVG" legend.
2. Overlay a `Pressable` (not the pointerEvents-none input) over the AVG readout region with
   `onLongPress` → open a color-picker overlay.
3. **Color wheel:** the project has NO picker library. Options: (a) build a Skia HSV hue-ring +
   value slider (~a component); (b) ship a curated swatch palette (fast, honest, less UI).
   Recommend (b) a swatch grid first, add a wheel later if owner insists.
4. Persist the chosen color (AsyncStorage) and pass to `PeakAvgMeterView`.

**Note:** interacts with #5 — when AVG > 100 it goes red regardless of custom color (owner's
red-over-100 rule wins). Keep #5's red override on top.

---

## #4 — SPL HOME layout: PK# on top, AVG# below, LED below; widen the VU  [LARGE, structural]

Owner: move the PK#/AVG# numbers to sit ABOVE the vertical LED (PK top, AVG below, then the LED
bar), REMOVE the separate readout column beside the LED, and WIDEN the VU (left) into the freed
space.

**Where:** `PeakAvgMeterView` reserves a LEFT readout column via `readoutW` (L2864) that holds
the PK/AVG numbers (L3144–3194). Home layout: `topRow` with `topLeftCol` (VU, width `leftColW`)
+ `SideLed` (width `ledW`), L1472–1513.

**Approach (keep the shared-value plumbing inside the component):** add a layout variant to
`PeakAvgMeterView`, e.g. `readouts: 'left' | 'top'` (default 'left' for back-compat). In 'top'
mode: `readoutW = 0` (bar goes full width, narrower overall), and render PK/AVG as a stacked
header ABOVE the bar (reuse `pkMaxReadoutProps` / `avgReadoutProps` — same SharedValues, just
repositioned). Then in `SplMeterScreen`: pass `readouts="top"` to the home `SideLed` (L1511),
shrink `ledW`, and widen `vuW`/`leftColW` to fill the reclaimed width.

**Verify:** heavy on-device iteration — column widths, the VU getting wider without distorting
its aspect, PK/AVG legibility stacked on top. Do this one LAST and expect a couple of passes.

**Open Q:** does Full VU also get the 'top' layout, or only the home? Owner spec was HOME only.

---

## #8 — Long-press the PK # → choose LED color scheme (MIDI vs others)  [BLOCKED]

Blocked: the "see attached examples" color-scheme reference images were never provided. Needs
the example images before the preset schemes can be built. The mechanism would mirror #7
(long-press overlay on the PK readout → scheme picker; the schemes swap `LOUDNESS_STOPS` /
the LED ramp). Get the images from the owner first.

---

## Prereqs / notes
- The iOS landscape issue (Full VU / readout won't rotate) is likely the stale binary — verify
  with a fresh EAS `development` build BEFORE trusting any Full-VU verification here.
- Keep the no-fake-meters standard: any weighting/level label stays honest (dBFS domain on the
  uncalibrated tool); the SPL scale here is already an ESTIMATE badged as such.
