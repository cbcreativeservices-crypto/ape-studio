# VU meter change orders — TABLED to 2026-08-19 (owner)

Owner prepared these 2026-08-18 but chose to table all VU-meter changes until a
deeper dive. All items below affect the VU meters. Screen:
`src/screens/tools/SplMeterScreen.tsx` (see [[spl-vu-meter-restructure]] in
memory for the current structure).

## STATUS (updated 2026-08-19)
- ✅ **Items 1 & 2 DONE** (commit `caf44e5`): Full VU settings bar + LED
  hide/show with the meter centering when the LED is hidden.
- ⏳ **Items 3–12 still TABLED** — owner is doing these in a dedicated
  before-bed session (it's a thought-out sequence). Do NOT start until then.
- Recommended order when reopened: **3 + 10** (double-range toggle + Full VU
  opens in auto), then **4 → 5 → 6** (LED readout relocation + widen VU + red
  above 100 + 105 dB range) as one layout pass, then **7, 9** (long-press /
  tap gestures). **BLOCKED on owner input:** #8 needs the LED colour-scheme
  example images; #11 needs a confirm (borderline non-VU); #12 skins design.

## Full VU screen
1. ✅ **Add VU settings buttons** to the Full VU screen, along the bottom (which
   settings TBD with owner — likely mirror the home's Range · Weighting ·
   Response · Peak Hold). — DONE (bottom bar in landscape, column in portrait).
2. ✅ **LED hide/show:** allow the right-side vertical LED meter in Full VU to be
   hidden/shown. When hidden, **center the VU meter** in the freed space — it does
   NOT need to zoom/enlarge, just center. — DONE.

## Range
3. **"Double range" toggle**, placed next to the RANGE title. Doubles the VU's dB
   range span.
   - Normal, range [80]: 80 dB at 0 VU, 60 dB at −20 VU (a 20 dB span).
   - Toggled ON, range [80]: 80 dB at 0 VU, and at −40 (where −20 used to be) it
     reads 40 dB — a **40 dB span (doubled)**. The VU tick increments AND the dB
     reference labels change accordingly.

## SPL Meter Home — right vertical LED meter + VU width
4. On the SPL Meter Home, the right vertical LED meter: move the **PK # readout to
   the TOP** of the meter, the **AVG # readout below it**, then the LED meter below
   that. Remove the separate PK#/AVG# column that currently sits next to the
   vertical LED, and **widen the VU meter (left)** to occupy that freed space.

## LED meter readouts — color + range (list 2)
5. **PK and AVG # readouts** (above the vertical LED meter): show in **RED when
   above 100 dB**; show their normal colors only **below 100 dB**.
6. **Extend the dB LED meter range up to 105 dB** (everything above 100 shown red).
7. **Long-press the purple AVG # readout** (wherever it ends up) → open a **color
   palette wheel** to pick a custom color instead of purple.
8. **Long-press the PK # readout** (wherever it ends up) → change the LED meter
   color scheme from the default "MIDI" scheme to other preset LED color choices.
   ⚠️ Owner referenced "see attached examples" but **no image was attached** —
   get the color-scheme examples from the owner tomorrow.
9. **Click the red MAX # readout** (bottom-left corner of the VU meter) → **reset
   (clear) the peak hold**.

## Full VU range
10. Full VU (fullscreen) should **open in AUTO (double range)**. (Ties to the
    double-range toggle, item 3.)

## SPL Log
11. The **SPL Log should match the current dB-scale (unit) setting** — i.e. the
    session-log Leq readouts follow the selected SPL/A/C/FS unit rather than the
    fixed Leq(A)/Leq(Z) columns. (Borderline non-VU; owner may want this done
    sooner — confirm.)

## VU skins
12. Add **selectable VU types / skins** — the user can choose between different
    VU meter looks. (Design/skins TBD with owner.)

---
More lists may follow; non-SPL-meter items get done same-day, SPL/VU items append
here.
