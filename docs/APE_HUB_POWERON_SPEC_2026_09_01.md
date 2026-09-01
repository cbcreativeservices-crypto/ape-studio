# Tools Hub power-on sequence — implementation spec (2026-09-01)

Animate the 8 tile displays on ToolsHubScreen powering on like real audio hardware —
staggered, per-tile characterful, deterministic — replacing today's identical 260 ms fade.

## 1 · Research findings (decision-driving)

- **LED-backlit LCD**: light is instant but drivers ramp luminance over ~100–300 ms as PWM
  locks; occasionally a single-frame flicker at strike. → fast ramp + optional one-dip flicker.
- **CCFL LCD**: the tube *strikes* (brief stutter/flicker) then brightens over seconds. Full
  warm-up is far too slow to copy; we borrow only the strike-stutter followed by a ramp.
- **CRT / phosphor scope**: slow bloom with a brief brightness **overshoot** that settles —
  the classic "power on" read. → overshoot-then-settle = Disney follow-through, sells physicality.
- **VFD / segment displays**: near-instant, but real gear runs an all-segments **test blink**
  (1–2 rapid pulses) at boot before showing data.
- **Incandescent VU lamps** (analog meters): pure slow thermal ramp, zero flicker, warm cast.
- **Rack gear**: power sequencers bring channels up **one at a time** (inrush limiting) — a rack
  never lights all at once. Car clusters do a needle-sweep "welcome ceremony" as a self-test;
  it reads as *quality*, not decoration.
- **Stagger interval**: Material choreography says list entrances start ≤20 ms apart — but that
  makes items read as ONE gesture. We want the opposite: distinguishable sequenced power-ups.
  Below ~50 ms events fuse; above ~120 ms it reads as lag. **60–90 ms** reads as intentional
  hardware sequencing. (Material/Carbon choreography + squash/overlap-action principles.)

## 2 · Sequence design

**Layer model (honesty-safe).** Only two things animate, both pure opacity on the native driver:
1. `lit` — the opacity of the existing deferred content block (static art / SPL skin / sim / live
   wrapper). This IS the backlight: beneath it sits the dark cap (`#0b0c0e`), so 0 = screen off.
   Replaces the current `fade` value outright.
2. `bloom` — a new absolute-fill overlay inside `ToolStrip` (above content, per-tool tint color,
   `pointerEvents="none"`), used for overshoot/strike flashes. Rests at 0.

No data layers are touched: live minis still self-gate on real frames (`LiveShell`), sims keep
their DEMO tag, the SPL needle stays resting. §1.7 intact — we animate glass/backlight only.

**Stagger.** Reading order (= `TILE_ORDER` index), base interval **70 ms**, plus deterministic
jitter from the existing `CHASSIS_SEED`: `jitter = (seed % 47) − 23` ms (±23), clamped ≥ 0 total.
Same every open; jitter kills the metronome without randomness. Narrative bonus: the analog VU
(index 0) strikes FIRST but reaches full glow LAST — analog warms while digital snaps on.

| # | tile | seed | start (ms) | persona | `lit` curve (Animated.sequence of timings) | `bloom` | ends ≈ |
|---|------|------|-----------|---------|--------------------------------------------|---------|--------|
| 0 | spl | 11 | 0 | VU lamp warm-up | 0→1, 620 ms, `Easing.inOut(quad)` | warm `rgba(255,190,120,B)` 0→.10 (300 ms)→0 (320 ms) | 620 |
| 1 | multimeter | 23 | 70 | DSP LCD boot | 0→.85 (140)→.7 (50 dip)→1 (120), `out(quad)` | cool `rgba(200,225,255,B)` 0→.30 (40)→0 (70) | 380 |
| 2 | waveform | 37 | 154 | CRT bloom | 0→1, 320 ms, `out(cubic)` | `rgba(210,235,255,B)` 0→.45 (180, `out(cubic)`)→0 (380, `in(quad)`) — overshoot+settle | 714 |
| 3 | rta | 51 | 215 | LED ladder strike | 0→1 (60)→.55 (40)→1 (80) — snappiest | none | 395 |
| 4 | spectrogram | 61 | 295 | TFT clean ramp | 0→1, 420 ms, `inOut(sine)` | none | 715 |
| 5 | signalgen | 71 | 351 | VFD segment test | 0→1 (50)→.25 (70)→1 (50)→.35 (60)→1 (110) | cyan `rgba(140,255,230,.08)` single 60 ms pulse | 691 |
| 6 | rt60 | 83 | 434 | CCFL strike+ramp | 0→.6 (180)→.5 (80)→.75 (90)→1 (280), final leg `out(quad)` | none | 1064 |
| 7 | hzcounter | 97 | 497 | tuner blink | 0→1 (70)→.6 (50)→1 (90) | `rgba(140,255,230,.06)` 40 ms pulse | 707 |

Every `lit` ends at exactly 1 (no permanently dimmed tile). Last activity ≈ **1.06 s** after
`ready` — inside the 1.6 s budget with headroom for the ~350 ms deferred-ready delay itself.
Delays via `Animated.delay` at the head of each sequence — nothing runs on JS per frame, and
after completion all values are static (bloom overlays sit at opacity 0; leave them mounted).

**Optional phase 2 (needs an owner honesty ruling — NOT in this build):** a one-time VU
needle sweep on the SPL skin (car-cluster self-test idiom). It would touch `SkinnedVu` and
arguably shows a "reading"; hold until the owner rules it a self-test, not a fake meter.

## 3 · Implementation plan

- **Owner: `ToolStrip`** (ToolsHubScreen.tsx) — it already owns the `ready` gate and the fade.
  No new component needed; add a small module-level `POWER_PERSONA: Record<ToolKey, {...}>`
  table (per-tile sequence builder + bloom color) either inline or in `src/screens/tools/powerOn.ts`.
- **Props**: `ToolStrip` gains `index: number` (pass from the `TILE_ORDER.map` in the screen —
  `TILE_ORDER.indexOf` not needed, map already has the index via `toolByKey` chain; pass it down
  through `ToolTile`). Seed comes from `CHASSIS_SEED[tool]` (already exported in-file).
- **Animated values**: per tile, `lit = useRef(new Animated.Value(0))` (renamed `fade`) and
  `bloom = useRef(new Animated.Value(0))`. Both `useNativeDriver: true` throughout.
- **Trigger**: in the existing `useEffect` on `ready` — guard with a `ran = useRef(false)` so
  HMR/re-renders never restart it. Branch:
  - `animationsAllowed()` (import from `src/features/settings/a11y.ts` — it ORs the app's
    `reduceAnimations` with OS reduce-motion) → `Animated.parallel([litSeq, bloomSeq]).start()`.
  - else → exactly today's `Animated.timing(lit, {toValue: 1, duration: 260, out(quad)})`,
    no delay, no stagger, no bloom. Identical to current behavior.
  - Effect cleanup: `lit.stopAnimation(); bloom.stopAnimation();` (fast back-nav mid-sequence).
- **Render**: content `Animated.View` opacity = `lit` (unchanged position); add
  `<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {backgroundColor: PERSONA[tool].bloomColor, opacity: bloom}]} />`
  as the LAST child inside `tileStrip`'s root (clipped by its radius, above content, below the
  sibling `TileGlass` in `tileCap` — glass sheen stays on top, correct physically).
- **Re-visits: play on EVERY fresh mount of the hub** (recommended). The screen unmounts on
  back-out, so each navigation to the hub replays; a focus-return from a tool does NOT remount
  and does not replay (`ready` already true) — correct: the rack is "already powered". Rationale:
  the sequence rides the deferred-`ready` mount that happens every open anyway — it converts
  today's perf-driven blank-then-pop into an intentional power-up, so replaying is a feature,
  not a cost. A once-per-session flag would leave later opens with the old pop it was hiding.
- **Interactivity**: untouched — the `Pressable` frame never waits on the sequence; press
  glow (`tileGlowLight`) is an independent value and composites fine mid-power-on.

## 4 · Risks & mitigations

- **8 parallel animations**: all native-driver opacity timings — no JS frames, no layout. The
  real cost moment remains the simultaneous content MOUNT at `ready` (unchanged). Do NOT
  stagger mounting itself: delaying mounts would push SVG/PNG inflation into the animation
  window and cause mid-sequence jank. Mount all at once (opacity 0), animate opacity only.
- **LiveShell double-fade**: live minis fade in when frames flow; if frames arrive mid-power-on
  the two opacities multiply — reads as the display warming into live data. Acceptable; no code.
- **Deferred-ready interplay**: keep the `InteractionManager` + 350 ms fallback exactly as-is;
  the sequence keys off the same single `ready` flip. Never start animations before `ready`.
- **HMR / re-entry**: `ran` ref guard + effect cleanup `stopAnimation` prevent double-runs and
  orphaned sequences. Never call `setValue` on `lit` while a sequence owns it.
- **Sequence dips on Android**: opacity dips (flicker) on the native driver are safe; avoid
  running two animations on the same value concurrently (sequence-only per value).
- **Reduce-motion flips mid-screen**: read `animationsAllowed()` once at the `ready` flip;
  a mid-sequence OS toggle finishes the current run — fine (sub-second, ends at full lit).
- **Timing drift**: `Animated.delay` is a zero-to-zero timing — safe with the native driver;
  do not use `setTimeout` for stagger (would fire during nav-transition JS contention).
- **Verify** (per dev-mode memory): 8081 dev client on device for feel; web preview (8090)
  renders the same RN Animated path. Get a designer-agent critique before calling it done.
