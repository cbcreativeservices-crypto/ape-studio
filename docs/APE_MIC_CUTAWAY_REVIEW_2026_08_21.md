# Deep Review — Dynamic Mic Capsule Cutaway (Computer B, v1)

> **STATUS 2026-08-22 — FIXES APPLIED on Computer A.** MUST-FIX #1+#2, SHOULD-FIX
> #3+#4 and the NIT dead-defs are done via `docs/art/mic-cutaway/patch_mic_cutaway.mjs`
> (outputs `mic_cutaway_wide.svg` + `mic_cutaway_phone.svg` + spliced previews;
> browser-verified, zero console errors, no label collisions/clipping by `getBBox()`).
> #5: coil stays copper — APE convention set, check the loudspeaker asset against it.
> #6 resolved by web verification: Bauer US 2,237,298 CONFIRMED (filed as Baumzweiger);
> Seeler citations correctly scoped to Unidyne III (not humbucking); **"RCA BK-16A"
> UNVERIFIABLE — no such model in any web-accessible RCA archive** (annotated in
> REPORT_dynamic_mic.md; humbucking history = Electro-Voice/Al Kahn 1934, unpatented).
> Full change list: `docs/art/mic-cutaway/APE_CHANGES_2026_08_22.md`. Remaining:
> RN port into the Mic Principles lab (owner decision).

Four-axis adversarial review of the candidate asset on `E:\` (`dynamic_mic_capsule_cutaway.svg`
+ `MOTION_…md` + `preview_…html` + `REPORT_dynamic_mic.md`): physics accuracy,
implementation correctness, visual design, RN integration/performance.

## Verdict
**Accept — with required fixes.** The asset is genuinely high quality: the
electro-acoustics are accurate and internally consistent (no wrong-tier errors),
the SVG/keyframe implementation is numerically sound (no breaks), and the palette
is on-brand. Two things MUST change before it's shown to learners, and it needs a
phone-oriented composition. Integration is low-risk: **pure react-native-svg +
Reanimated, NO new native build** (unlike the expo-iap incident).

---

## 🔴 MUST FIX (before it goes in front of learners)

1. **Honesty caveat is doc-only — surface it on-screen.** The drawing is a full
   CARDIOID (rear ports, phase-shift passage, two cavities) but is animated with
   the resistance-controlled `v ∝ p` (omni/pressure) model. The correcting caveat
   — a real cardioid is **mass-controlled above ~100 Hz, diaphragm displacement
   ~180° from pressure** — exists ONLY in `MOTION…md §0(ii)`, which learners never
   see. As shipped, it teaches the wrong mechanism for a cardioid. Put the caveat
   (and the "current overlay assumes a connected resistive load" note) into the
   on-screen text / SVG / the app caption that frames it. The honesty must travel
   with the asset. *(Physics review, MISLEADING #1.)*

2. **Composed as a wide poster — not phone-ready.** Capsule occupies the left
   ~23% of the 4:3 `viewBox`; labels are `font-size 8` (~6px effective at 375px,
   below the app's 12px floor); material coding rides on `stroke-width 0.35–0.42`
   hatch that goes sub-pixel and **vanishes** on phone, collapsing cup/housing/
   magnet/pole into flat blocks. Needs a **portrait/near-square phone crop
   centered on the capsule + gap**, ~11–12px labels, and heavier hatch (or
   tone/gradient material separation). Keep the wide layout only for the large lab
   view. *(Design review, BLOCKERS #1–2.)*

## 🟠 SHOULD FIX
3. **Right-side leaders cross the animated wavefield** and will tangle with the
   pulsing wave lines; the pole-region trio (MAGNETIC GAP / PHASE-SHIFT PASSAGE /
   POLE PLATE) dots are stacked ~6px apart → ambiguous. Shorten/elbow the right
   leaders; fan the three dots. *(Design SHOULD-FIX #3.)*
4. **Diaphragm PET tone competes with amber.** The dome gradient (`#e8d9b8→
   #7a5a2c`) is the biggest/warmest shape and shares command-amber's hue, so the
   actual teaching cue (amber ⊗ current + velocity at the gap) is subordinated.
   Cool/neutralize the PET toward pale grey-beige so amber owns "energy."
   *(Design SHOULD-FIX #4.)*
5. **Coil color consistency.** Voice + humbucking coils render COPPER here; the
   brief names "blue coil windings" as a companion convention. Confirm against the
   finalized loudspeaker cutaway so the two flagship assets match. *(Design #5.)*
6. **Verify citations.** RCA BK-16A is cited for diaphragm/gap figures but RCA's
   small mics in that lineage are largely RIBBONS — confirm it's a moving-coil
   dynamic, else the figures are on the wrong archetype. Quick-confirm the Bauer
   (US 2,237,298) and Seeler patent numbers too. *(Physics NIT #7.)*

## 🟢 NITs (optional polish)
- Humbucker extent: `MOTION §1` says r30→44 but the SVG rects give r30.5→42.5
  (static, cosmetic).
- Dead `gHum` / `gAOring` gradients (unreferenced).
- `MOTION §3` claims amber is confined to current/coil/labels, but label text is
  actually grey — doc overstates the amber footprint.
- Flux-return run visually overlaps the rear-port felt (section-through-a-port
  convention is stated, but reads as flux crossing air).
- Sweeping compression LINE opacity → 0 exactly at the dome; arrival is shown by
  the separate `sfNearComp` band. Start the line fade a few units left if you want
  the line to visibly contact.

## ✅ Verified correct (so it's not re-litigated)
- **Physics:** `e = B·l·v` (output peaks with velocity/pressure, displacement
  lags 90° — the thing most mic diagrams get wrong, done right); Faraday/Lenz
  sign chain independently re-derived (v×B → ⊗/⊙ → lug A = + = pin 2, Shure
  convention); flux loop stays in steel + crosses the radial gap where the coil
  sits (checked against every part's extents); humbucking coil series-opposing
  outside the motor; exaggerations (~10³× excursion, gap/wire) all declared.
- **Implementation:** every animated id exists; roll arc length constant to
  ~0.01% across all 5 keys (genuinely inextensible); lead wires constant length;
  dash-offset chain is exactly cumulative-arc-length mod 18 (continuous "current");
  dome sphere verified exactly (center (19.8,180) R140.2); wavefront reaches the
  diaphragm exactly at the pressure peak (φ=π/2); preview loop seams cleanly.
- **Design:** palette lifted straight from `theme/tokens.ts`; the label-collision
  fix the report claims is verified clean.

## Integration notes (for when we build it)
- **No new native build.** Pure `react-native-svg` 15 + Reanimated 4 (already in
  the binary). Ships over Metro/OTA.
- **Perf (given the recent CPU-runaway watchdog):** do NOT rebuild the roll/lead
  `points` strings (25–66 pts) per frame — crossfade the 5 precomputed keyframes
  by opacity (the Harmonograph `TracePass` trick). Drive ONE UI-thread phase
  `SharedValue`; compute `sinφ/cosφ/A` once in `useDerivedValue`; every element
  reads via `useAnimatedProps` (scalars only). **Pause on blur/background** —
  including the "permanent" field/rear-path clocks (a永-running visual clock is
  the shape of the watchdog kill). ~60–70 animated nodes; fine if every prop is a
  scalar.
- **Porting:** SVGR (svgo:false already set) for the static layers; **hand-author**
  the ~15 animated elements as `Animated.createAnimatedComponent` + `useAnimatedProps`.
  Namespace the 24 generic gradient ids (`gSteel`→`gSteel_mic`, …) to avoid the
  known cross-SVG collision. Strip `textLength`/`lengthAdjust` when labels are on.
  Mirror `src/screens/lab/HarmonographLabScreen.tsx` + `src/components/JogWheel.tsx`.
- **Home:** the app already has a companion **Mic Principles lab**
  (`src/screens/lab/micspeaker/`) — natural place for it.

## Best owner of the fixes
The asset is generated by Computer B's Python pipeline (`build_mic.py`, `geom_mic.py`,
`gen_spec_mic.py`). The composition/label/hatch/tone fixes (MUST-FIX #2, SHOULD-FIX
#3–4) are cleanest **regenerated at the source**, not hand-patched on the SVG.
The on-screen caveat (MUST-FIX #1) can live in the app caption regardless.
