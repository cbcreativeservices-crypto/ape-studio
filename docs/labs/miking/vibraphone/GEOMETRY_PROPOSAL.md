# I07 Vibraphone: GEOMETRY PROPOSAL (and §A, the MALLET-BAR FAMILY used by I07–I10)

Status: PROPOSAL. No app code. Sources: `vibraphone/SOURCES.md` (§0 keys, §1 Shure). Value
classes: `hihat/GEOMETRY_PROPOSAL.md` header (DRAWING DEFAULT = "drawing default, not a
published figure", `placeholder: true`, never a readout).

---

## §A. Mallet-bar family (build once; marimba, xylophone, glockenspiel are parameter rows)

### A1. Frame M (mallet frame)
mm. Origin = the floor point under the centre of the keyboard's plan rectangle (mid-length,
mid-depth). **+x toward the audience** (from the naturals row, where the player stands, to the
accidentals row); **+y down** (floor y = 0; height h ↦ y = −h); **+z along the keyboard toward
the treble** (the player's right). Player stands at −x. Views: front (from the audience, looking
−x: screen X = −z… or the player's view, owner choice), side (end view from the treble end), top.

### A2. Parameter row (one per instrument)

| Param | Meaning |
|---|---|
| `lowKey`, `highKey` | range on the 88-key scale (A0 = 1) |
| `wLow`, `wHigh` | natural-bar width at the low and high end (linear taper across the naturals) |
| `t` | bar thickness (low, high) |
| `Lframe`, `Dlow`, `Dhigh` | frame length; frame depth at the low and high ends (trapezoid plan) |
| `hBars` | bar-plane height (inside the frame's height range) |
| `LbarLow` | longest bar length; `LbarMin` floor |
| resonators | `res.kind` (tube / Helmholtz-bass / box / none), `res.d` |
| extras | damper bar + pedal; fans + shaft + motor box; case + lid; gas spring |

### A3. Keyboard layout rule (DERIVED from the parameters; same for all four)
- Naturals row centred at x = −xRow, accidentals row at x = +xRow, xRow = DRAWING DEFAULT
  0.22 × Dmean. Accidentals sit 15 higher than naturals (DRAWING DEFAULT; "black and natural
  rows", lesson).
- Natural n (0-based, low to high) has width w_n = wLow + (wHigh − wLow)·n/(N−1); gap g = 6
  (DRAWING DEFAULT); z positions cumulative, centred so the row is centred on z = 0.
- An accidental is centred on the gap between its two neighbouring naturals (piano layout).
  Accidental width = the mean of its two neighbours (DRAWING DEFAULT).
- Bar length (DRAWING DEFAULT model): L(k) = max(LbarMin, LbarLow · 2^(−(k − lowKey)/24)).
  Only the marimba's LbarLow is sourced (620, YMH-MG1); the others use 0.6 × Dlow.
- Suspension cords/posts at 0.224 L from each bar end (DRAWING DEFAULT; the textbook first-mode
  node position of a uniform free bar — not re-checked today; undercut bars differ).

### A4. Resonators (DERIVED acoustics, DRAWING-DEFAULT pipes)
Yamaha: the pipe is open under the bar and closed at the far end, and "it would resonate even
without one end being closed off, but that would require a pipe twice the length" (YMH-MG2). So
the acoustic length is a quarter wavelength: **L_ac(f) = c / (4 f)**, c from `CALC-C` at the lab's
20 °C (343.21 m/s), f = 442 · 2^((k − 49)/12) (A = 442 Hz: Yamaha and Adams pitch). The physical
pipe is shorter than L_ac by an end correction (UNKNOWN today → DRAWING DEFAULT 0.6 × pipe radius).
Yamaha tunes resonators for "23°C, or 73.4°F" (YMH-CARE): at 23 °C c = 344.97 m/s (DERIVED), 0.5 %
longer — not material at drawing scale; say "tuned for a warm room".

| Note (key) | f (Hz) | L_ac = c/4f (mm) |
|---|---|---|
| C2 (16) | 65.70 | 1305.9 |
| A2 (25) | 110.50 | 776.5 |
| C3 (28) | 131.41 | 653.0 |
| F3 (33) | 175.41 | 489.2 |
| C4 (40) | 262.81 | 326.5 |
| F4 (45) | 350.82 | 244.6 |
| C5 (52) | 525.63 | 163.2 |
| F5 (57) | 701.63 | 122.3 |
| C6 (64) | 1051.26 | 81.6 |
| F6 (69) | 1403.26 | 61.1 |
| C7 (76) | 2102.52 | 40.8 |
| C8 (88) | 4205.04 | 20.4 |
| E8 (92) | 5298.01 | 16.2 |

Consequences the drawing must respect (SOURCED reasons, DERIVED numbers):
- A C2 quarter-wave (1306) is taller than the marimba's bar plane (Adams Alpha 900–1040 high), so
  the bass pipes cannot hang straight: Yamaha YM-5100A uses "Helmholtz (C16 to F21)" bass
  resonators and Adams Alpha "bass resonators … Rooted in the principles of the Helmholtz
  resonator" → draw the low register as wide boxes, not long tubes.
- Some pipes are decorative or stopped midway to form an arch: "on some instruments, pipes are
  added where there are no tone plates"; "With these, the pipes are closed off midway" (YMH-MG2).
  The VISIBLE pipe length is therefore not a pitch readout. Never print a visible pipe length.
- Glockenspiel/xylophone resonators on Yamaha are "only essential accidental resonators"
  (YMH-YX500, YMH-YG2500): draw tubes under the naturals and only some accidentals.

### A5. Player and mallet envelopes (ILLUSTRATIVE unless stated)
- Player stands at x = −(Dlow/2 + 250) (DRAWING DEFAULT), facing +x, centred on the played span.
- Mallet length 431.8 (VF-M212/M171, TRIAL any mallet); 2 or 4 mallets.
- `ko.mallet` = the volume over the played span from the bar plane up to **hBars + 350**
  (DRAWING DEFAULT: raised-mallet height), extended 150 past each end of the played span and
  across both rows. Shure's 457.2 sits 107 above it — the build must keep the published band and
  flag any overlap rather than move it.
- `ko.player` = body slab x ∈ [player − 200, player + 150], h 0–1750; arms reach to the far row.
- `ko.pedal` / `ko.foot` (vibraphone, YG-2500): box at the centre of the player side on the floor,
  300 × 120 × 100 (DRAWING DEFAULT).
- `ko.instrument`: frame, rails, resonators, motor box (no clamping to bars, cords, resonators —
  lesson rule).

### A6. Shared zones (Shure, SOURCED; xylophone/marimba/vibraphone only)
- `zone.mallet.shure.spaced`: two mics aimed down, mic.ref at hBars + 457.2, spaced 609.6 apart
  along z, centred on the played span (x = 0 in the row-gap).
- `zone.mallet.shure.xy`: two mics, grilles together (coincident), 135° included angle, at
  hBars + 457.2 over the played-span centre, the bisector pointing down.
- `zone.mallet.one`: one mic, each lesson's own TRIAL band (labelled "lesson trial").
Readouts: height above the bar plane; coverage angle needed to see both ends of the played span
from the mic (DERIVED); path difference low-end vs high-end bar to each mic → Δt
(`SOURCES_SHARED.md`); mono-sum preview.

---

## §B. Vibraphone parameter row (default: Adams Concert Vibraphone)

| Param | Value | Class | Source |
|---|---|---|---|
| range | F3–F6 (keys 33–69); 37 bars: 22 naturals, 15 accidentals (DERIVED) | SOURCED | ADAMS-VIBC |
| wLow / wHigh | 57 / 38 | SOURCED | ADAMS-VIBC (YMH-YV2700 1 1/2–2 1/4 in agrees) |
| t | 12.7 | TRIAL (Yamaha "x 1/2"") | YMH-YV2700 |
| Lframe / Dlow / Dhigh | 1530 / 750 / 560 | SOURCED | ADAMS-VIBC |
| hBars | 940 (inside "87-101 cm") | DRAWING DEFAULT | ADAMS-VIBC range |
| LbarLow / LbarMin | 450 (0.6 × Dlow) / 180 | DRAWING DEFAULT | — |
| naturals row length | Σw + 21·6 = 1045 + 126 = 1171 < 1530 (fits) | DERIVED | |
| resonators | tubes, Ø 60 (DRAWING DEFAULT), L_ac per §A4 | DERIVED / DRAWING DEFAULT | YMH-HUB-VGC |
| fans | one disc per tube at the tube top, on one shaft per row; motor box at the low end; speed range "25-150" rpm (Adams, printed "rmp") / Yamaha YVM200 "25-145rpm" | SOURCED words / range; geometry DRAWING DEFAULT | ADAMS-VIBC, YMH-YV2700, YMH-FANS |
| damper bar | felt bar under the bars along the row centre line, up (touching) when the pedal is released | SOURCED behaviour; position DRAWING DEFAULT | YMH-HUB-VIBE |
| pedal | centre of the player side | DRAWING DEFAULT | |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.vibe.one` | one mic 450–750 above the central played region, angled to hear the full range | lesson TRIAL | lesson L10 |
| `zone.vibe.shure.*` | §A6 | SOURCED | S-LIVE / S-RECBK |
| `zone.vibe.under` | below the resonator openings (deliberate alternative), clear of fans, motor, pedal | lesson alternative; position DRAWING DEFAULT | lesson L11 |

Motor state (off / speed) and pedal state (damped / ringing) are SOURCE controls, not mic moves.
Tests: every resonator's L_ac matches §A4 to 0.1 mm; 22 + 15 bars; the naturals row fits Lframe.
Owner: hBars, bar-length model, fan geometry, player stance.
