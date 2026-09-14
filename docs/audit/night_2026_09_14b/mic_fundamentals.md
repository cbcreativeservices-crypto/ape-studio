# Mic/Speaker + Fundamentals-Visual Labs — Final-Polish Audit

Night 2026-09-14b. REPORT ONLY (no edits, no commits). Auditor: mic/speaker + fundamentals group.

Scope: Microphone Principles (all scenes) · Speaker Coverage · Mic Selection · Amplitude · Foundations · Wave Physics · Digital Audio · Visual Audio Analysis (Meter) · Signal Chain · Gain Staging.

Legend for findings: `[CLASS] SEVERITY — file:line — problem — fix`.
CLASS ∈ {SVG-BLACK, ANIM, PERF, ASSET, COPY, COGNITION, LAYOUT, GATE, DEADCODE, CORRECTNESS}.

---

## ★ SVG-BLACK-FALLBACK CLASS — group-wide verdict

**The shipped mic-capsule bug is FIXED and verified, and no other instance of the class exists anywhere in this group.**

- `micCutawayAsset.ts` is the ONLY url()-based react-native-svg asset in the entire scope. Verified each `<SvgXml>` layer is a self-contained document with its own `<defs>`:
  - `MIC_BASE_XML` (line 13): defines gSteel, gShell, gMagnet, gPole, gCavity, gFrontCav, gDia, gDiaIn, gSpacer, gFelt, gLead, gTerminal, gFlux, gVent, gStrutM (+ gWave/gNearC/gNearR/gTurn/gGlow/gDomeSheen) — every `url(#…)` it references resolves in its own defs.
  - `MIC_GLOW_XML` (line 16): defines **and** references gGlow (+ glowHalo). Self-contained.
  - `MIC_WAVE_XML` (line 17): defines **and** references gNearC, gNearR, gWave. Self-contained.
  - `MIC_CURRENT_POS_XML` / `MIC_CURRENT_NEG_XML` (lines 14–15): solid colors, zero url() refs, no defs needed. Correct.
  - No referenced-but-undefined gradient remains. This is exactly the bddc99c1 fix and it is intact.
- Everywhere else in the group the drawing engine is Skia (`@shopify/react-native-skia`): gradients are `<LinearGradient>`/`<RadialGradient>` **children of `<Path>`**, and blur is Skia `BlurMask`. Neither is url-resolved, so neither can fall back to opaque black. `digital/vizChain.tsx` uses a JS variable literally named `clipPath` (line 897) that is a **Skia path**, not an SVG `<clipPath>` — not the bug.
- Grep sweeps run across all of `src/screens/lab`: `url(#`, `SvgXml`, `<Defs`, `feGaussianBlur`, `<filter`, `mask=`, `mixBlendMode`. Within this group only `micCutawayAsset.ts` (fixed) surfaced url() refs.

**Conclusion: the SVG-black class is CLEAR for the mic/fundamentals group.** (Sub-lab agents re-ran the same hunt in their areas; their results are folded into the per-lab sections below.)

---

## Microphone Principles — `src/screens/lab/micspeaker/`

Files: `MicPrinciplesLabScreen.tsx` (1516 lines), `MicCutaway.tsx`, `micCutawayAsset.ts`, `viz.tsx` (4113 lines), `skiaGate.ts`, `units.ts`.

Overall infrastructure is strong: a `__DEV__` guard (MicPrinciplesLabScreen.tsx:1376) throws if `SECTIONS` keys drift from `MIC_PRINCIPLES_UNITS`; keyed remount per section (`key={s.key}`) guarantees animation teardown on section change; `running={focused}` gates every clock; honesty badges present on every stage.

### CAPSULE scene — GRADE A
- MicCutaway asset fix verified (see SVG-BLACK section). Honesty badge is thorough and correct (MicPrinciplesLabScreen.tsx:371 — "MOVING-COIL DYNAMIC CUTAWAY — ILLUSTRATIVE MODEL · coil travel exaggerated ~1,000×…").
- `MicCutaway.tsx` animation is clean: one Reanimated phase clock + one march clock, both `cancelAnimation`'d in the effect cleanup and when `running=false` (MicCutaway.tsx:58-72). Group-level opacity/transform only; static art parsed once. GOOD — this is the model the rest of the labs should imitate.
- Device-only check: confirm the amber current overlay and the marching wave layer render with gradients (not black) on a real pre-/post-Skia device — the fix is verified in source but the original failure was device-only.

### POLAR scene — GRADE B
- **[COGNITION/CORRECTNESS] MAJOR (owner-decision) — MicPrinciplesLabScreen.tsx:88-139 + viz.tsx:1053-1057 — the polar drag COLLISION FLOOR still models the RETIRED claves silhouette, not the speaker cabinet that is actually drawn.** The source art was changed from claves to a speaker `CabinetSide` (viz.tsx:1166-1187, owner 2026-08-05), but the keep-out geometry is still `CLAVES_COLLIDERS` / `clavesScaleForMic` (viz.tsx) mirrored as `CLAVES_CIRCLES` / `POLAR_CLAVES_S` / `clampPolarSource` (screen). Numerically the claves silhouette (~54×48 px at the derived scale) is LARGER than the drawn cabinet (~33×28 px at scale 1.55), so the error is conservative — the cabinet is held slightly farther from the mic than its own edges require (a small unexplained gap), NOT an overlap. Fix: re-derive the colliders from `CabinetSide`'s actual path extents and rename the constants; verify on device the cabinet can sit right up to the mic as the badge implies.
- **[DEADCODE] SAFE-FIX — viz.tsx:465-591 (`CLAVES_ANGLE`…`buildClaves`…`Claves`) — dead code.** The `Claves` component and `buildClaves` are never rendered (grep for `<Claves` = 0 hits); only the collider constants/`clavesScaleForMic` remain in use (by the stale collision math above). Remove the dead drawing code and the stale claves prose (viz.tsx:1032-1057; screen 72-95) once the collision model is re-derived.
- **[COGNITION] MINOR (owner-decision) — viz.tsx:1166-1187 — the source cabinet radiates its OWN red→blue glow field on top of the mic's pickup heat field.** Two red regions share one panel (mic on-axis pickup + speaker cone), while the badge (screen:481) explains only the pickup field `r(θ)×1/d`. Could blur the "read the pickup pattern" lesson. Consider a one-line badge addition or dimming the source field further. Device-only to judge severity.
- GOOD: drag has a discoverability chip that clears on first pan (screen:505-509); anchored-drag base math avoids the "whip to opposite end" bug; NULL readout tinted red; `fmtDb1` normalizes "-0.0".

### DISTANCE scene — GRADE A
- The direct/room share bug (frozen bars) is fixed and documented (screen:568-582): both bars now show each source's SHARE, crossing at ~12 in (critical distance), matching the caption and the check. Math is honest (inverse-square direct, ~constant room). Bars/bezel wear the amplitude ramp. Per-frame wavefronts are small (4 arcs) and the heat field is `useMemo`'d (viz.tsx:1229). No issues.

### PROXIMITY scene — GRADE A
- `d01=0` starts far (12 in, no boost); CARDIOID vs OMNI A/B is a clean single-variable experiment; OMNI drives the response flat (dbAt→0) and drops the vStops. Honest badge. Ramp on the BOOST cell. No issues.

### OFF-AXIS scene — GRADE A-
- **[COPY] MINOR (owner-decision) — MicPrinciplesLabScreen.tsx:830 — the `@8 kHz` bezel cell is a level-bearing dB readout but is tinted a fixed blue `#7fd4ff`** rather than by magnitude via the amplitude ramp, unlike every other level readout on the screen. It reads as a deliberate "HF = blue" cue, so likely intentional, but it is the one level cell that does not follow the ramp standard. Confirm intent or switch to `levelColorForDb`.
- GOOD: continuous ANGLE lane + preset chips; teaches "duller before quieter" with a matching check comparing @100 Hz vs @8 kHz cells.

### STEREO scene — GRADE A
- Rewritten per owner "explain better/EZ" pass: each technique leads with a plain sentence + "reach for it when" + IN-MONO trade, with precise geometry one layer down. The mono-fold check is technically correct (AB thins from time→phase cancellation; XY folds clean; MS collapses to MID). No issues.

### PLOSIVES / HANDLING scenes — GRADE A
- Plosives: blue=air/amber=voice badge, ramp on the BLAST cell, honest note per barrier. Handling: RIGID vs SHOCK A/B, 90%↔15% with ramp, correct "vibration through solids" check. `ShockMountView` fixed-height scale-to-fit is handled (screen:993-999). No issues.

### HAND GRIP scene — GRADE A
- Grip zones derived from the drawn geometry, thresholds mirrored between screen and viz with the comment explaining why (pre-Skia clients). WHY-IT-HAPPENS cutaway gates on Skia with a fallback card. Anchored-drag Y math. PATTERN state (INTACT/DEGRADING/COLLAPSED) tracks the zone. No issues.

### MISTAKES scene — GRADE A
- **Verified NOT a bug:** `SpotTheMistake` builds `options:[target,...decoys]` with `correctIdx:0`, but `CheckQuestion` (foundations/bits.tsx:48-55) shuffles the PRESENTATION order on mount and checks correctness by ORIGINAL index — so the correct answer is NOT always shown first. Recognition drill is sound. GOOD.

### Screen-level — GRADE A-
- **[COPY] MINOR (safe-fix) — MicPrinciplesLabScreen.tsx:878, 938, 1037 — stale section-number comments.** Header comments read "5 · Plosives", "6 · Handling", "7 · Stereo", but after the STEREO reorder (documented at :1365) the actual `SECTIONS` order is stereo(5)→pop(6)→shock(7). The dev-guard proves keys match units.ts; only the numeric comments are stale. Renumber the comments.
- GOOD: `viz` resolved once via `useState(() => requireMsViz())`; `!skiaAvailable` shows `VizUnavailableCard` in every well; guided-lesson wiring consistent.

## Speaker Coverage — `SpeakerCoverageLabScreen.tsx` — GRADE A
- No findings of substance. Excellent: `__DEV__` key-drift guard (:188); `Legend` swatches are SAMPLED from the map's own `jetColor` so they cannot drift from the map (:60-84); honesty badges are short enough to survive two lines at 375 px without truncation (:44-50); conditional LINE-ARRAY and REAR-DELAY "conceptual model, not SPL/true time-alignment" disclaimers (:588-600); `VizUnavailableCard` fallback on every stage; stage-left/right perspective bug fixed and documented (:198-202). All Skia, no url() SVG, no image assets. Device-only: verify the tall "L" stage + dock reconciliation on a short/rotated viewport.

## MicCutaway / micCutawayAsset / viz clocks — GRADE A
- Covered above. Shared clocks `usePhaseClock`/`useVizClock` (foundations/viz.tsx:193-232) use `useFrameCallback` + `setActive(running)` — stop on blur and auto-clean on unmount. No animation leak.

---

## Mic Selection — `src/screens/lab/micselect/**` — GRADE A-
**SVG-black: NOT PRESENT — zero react-native-svg; all Skia.** No animation anywhere (no timers/loops/derived values) → no leaks, no per-frame cost; all geometry in `useMemo`.
- `MicSelectLabScreen.tsx` — A-. GOOD: guest-rule gate treats a not-yet-resolved tier as non-guest so signed-in users resume (963-970); `useShuffledRows` anti-gaming; `verdictFor` encodes OUTCOME not raw pickup (273-280); textbook polar math; unusually complete a11y.
  - **[LAYOUT] MINOR (owner-decision, device-verify) — MicSelectLabScreen.tsx:308-321 — PatternsStep's six source labels (width 88, two lines) are placed at computed x/y with no collision avoidance on a ~200-240px plot; adjacent sources (0° WANTED vs 38° Audience) can overlap and edge labels can clip the `overflow:hidden` stageBox on narrow phones.** Fix: shrink font, radial-outward offset, or half-plane left/right anchoring.
  - **[GATE] MINOR (owner-decision) — MicSelectLabScreen.tsx:22 & micArt.tsx:14 — imports Skia statically with NO skiaGate/VizUnavailableCard, unlike the rest of the group.** Moot in the current app (the route is wrapped by `withAmplitudeOrientation`, which also imports Skia statically, so a pre-Skia client white-screens at boot first) — inconsistency only, no new failure mode.
- `micArt.tsx` — A. GOOD: `MicVisual` shows remote photo, **falls back to code-drawn `MicArt` on error/null URL — never a blank** (asset-resolution risk fully absorbed); `zoomable={false}` guard prevents button-in-button on web. No findings.
- `micDrawings.tsx` — A. Canonical HandheldMic/CondenserMic, memoized, Skia `BlurMask` (not feGaussianBlur). No findings.
- `micImages.ts` — A-. **[ASSET] MINOR (owner-decision) — micImages.ts:14-27 — 12 remote Supabase bucket WebP URLs; static audit can't re-verify the network. Risk mitigated by the MicArt fallback (missing photo → code-art, never a crash/blank). Owner spot-check if any bucket files were renamed since 2026-08-17.**
- `micSelectData.ts` — A. Strong honesty ("every curve is fictional but realistic — read the SHAPE, not a brand"; no brands; spec-honesty voice throughout); Locker exercise verified solvable (≥9 achievable); challenge answers pedagogically correct. No typos.

## Amplitude — `src/screens/lab/amplitude/**` — GRADE A-
**SVG-black: ZERO instances — all Skia + expo-linear-gradient.** Asset refs resolve (Bravura.otf present; levelColor SSoT exports; nav routes; lab keys).
- `AmplitudeOrientation.tsx` (1303 lines) — A-. GOOD: `LEARNING CONVENTION` + `HONESTY_LINE` ("Illustrative training graphics — not live measurements") present; non-colour cues everywhere; RampCheck (3 retrieval trials) replaces self-report "UNDERSTOOD" — strengthens §1.7. All colour from the SSoT.
  - **[COPY] MINOR (owner-decision) — AmplitudeOrientation.tsx:582/655/906 — a11y/label copy says "dark blue" for the lowest level, but `heatColor(0)` = `#000000` (SSoT fades bottom 10% to black), so the gradient bar's leftmost slice / arrow low end / spectrogram silence floor render near-black.** Cosmetic (only ~first 2% is near-black). The black silence-floor is the owner-ruled standard — reword copy to "deep blue/black for silence"; do NOT change `heatColor`.
  - **[CORRECTNESS] SAFE-FIX (optional) — AmplitudeOrientation.tsx:728 — `CheckRta` finds the tallest bar via float-equality `h === 0.92`; fragile if the H array is edited. Use `Math.max(...H)`.**

## Foundations — `src/screens/lab/foundations/**` — GRADE A / A-
**SVG-black: ZERO instances — all Skia + expo-linear-gradient.** Clocks confirmed leak-free (frame callbacks `setActive(running)`-gated; audio/timers torn down on blur). All static geometry in `useMemo`; only moving paths in worklets.
- `skiaGate.ts` — A. Correct native probe; web branch gates on `globalThis.CanvasKit` (real sharp-edge fix); inline-require. Honest degrade path.
- `units.ts` — A. Pure data, index-keyed `'0'…'13'` immutable, count kept honest by the screen's dev guard.
- `bits.tsx` — A. `CheckQuestion` shuffle + `solvedRef` synchronous double-credit guard; `DragSlider` full adjustable a11y; `VizUnavailableCard` honest fallback.
- `viz.tsx` (3259 lines) — A. Disciplined; physics kept honest in shape (p ∝ cos(ωt−kx); ωₙ=n·ω₀ phase-lock). Minor non-defect: `RateComparatorView.makeSide()` calls `useDerivedValue` twice via a helper (stable hook order; would break only if a 3rd side were added conditionally). DEVICE-ONLY: all particle/cone/sparkle/orbit motion.
- `FoundationsCourseScreen.tsx` (2393 lines) — A-. GOOD: every rack has `StageFallback`→`VizUnavailableCard`; engine-version gating honest (additive v3 / stereo v5 / fx v6 each show "needs newer dev build", no fabricated stand-in); `useCourseTone` teardown correct; predict-first M7.
  - **[COGNITION] MINOR (owner-decision) — FoundationsCourseScreen.tsx:1148-1152 vs viz.tsx:2532 — M9 bezel prints `HEARD = sendDb + sensDb` UNCLAMPED while `EqualLoudnessView.heard()` floors at −60 dB; at the range corner (80 Hz, LEVEL −44) the bezel shows ≈"−68 dB" while the drawn dot sits at the −60 floor.** Clamp the bezel sum to ≥ −60 to match the graph, or leave (teaching point is the SEND−HEARD difference).
- `FoundationsPlaygroundScreen.tsx` (880 lines) — A. Honesty actively de-overclaimed ("Drive the views, hear the change" since BALANCE/DELAY have no drawn twin); `stop()` calls `fxReset()` so no effect leaks to other labs; display EQ uses the same RBJ math the DSP runs. DEVICE-ONLY: sweep-pause, per-source air modes, crest-under-compression time-lock.

## Wave Physics — `src/screens/lab/wave/**`
_(pending sub-agent audit)_

## Digital Audio — `src/screens/lab/digital/**`
_(pending sub-agent audit)_

## Visual Audio Analysis / Meter — `src/screens/lab/meter/**`
_(pending sub-agent audit)_

## Gain Staging — `src/screens/lab/gain/**`
## Signal Chain — `SignalChainLabScreen.tsx`
_(pending sub-agent audit)_

---
## Owner-glance items landed (main session, 2026-09-15)
Safe comment/robustness fixes applied (see _FIXES.md). These remain for owner:
- **POLAR collision floor (MAJOR, owner-decision):** keep-out geometry still
  models the RETIRED claves silhouette, not the drawn speaker cabinet. Error is
  CONSERVATIVE (claves silhouette larger → cabinet held slightly farther than its
  own edges require; a small unexplained gap, NOT an overlap). Fix = re-derive
  colliders from CabinetSide path extents + rename constants; then remove dead
  `Claves`/`buildClaves` drawing code (viz.tsx:465-591) which is coupled to it.
  NOT done autonomously (couples geometry + dead-code + device verify).
- POLAR: drawn cabinet radiates its own red→blue glow over the mic pickup field;
  badge explains only the pickup field. Consider dimming source field / badge note.
- OFF-AXIS @8kHz bezel cell tinted fixed blue #7fd4ff, not by magnitude via the
  ramp like every other level cell — confirm intent or use levelColorForDb.
- Amplitude a11y copy says "dark blue" for the lowest level but heatColor(0)=#000
  (bottom 10% fades to black per the owner-ruled silence-floor standard). Reword
  copy to "deep blue/black for silence"; do NOT change heatColor.
- Foundations M9 bezel prints HEARD=sendDb+sensDb UNCLAMPED while the drawn dot
  floors at −60 dB; at 80 Hz / −44 the bezel shows ≈−68 while the dot sits at −60.
- Mic Selection PatternsStep: six source labels placed with no collision
  avoidance on a ~200-240px plot — can overlap/clip on narrow phones (device-verify).
- Mic Selection imports Skia statically without skiaGate/VizUnavailableCard
  (moot today — withAmplitudeOrientation also imports Skia statically — inconsistency only).
- External bucket deps (12 mic-selection WebP, connector photos): can't re-verify
  network; MicArt code-drawn fallback absorbs missing mic photos (never blank).
