# The Rack Unit

## SUMMARY
Every lab module becomes a fixed 1U instrument faceplate: a PINNED glass stage (display + readouts printed on its bezel) that never scrolls, a channel-strip DOCK pinned at the bottom (one shared param fader lane + a row of value-buttons in the tools' ctrlBar anatomy), and only the "service manual" — prose, mistakes, checks, bottom notices — scrolling in the well between them. Cause→effect is structurally guaranteed: the thing you adjust (dock/lane/on-glass gesture) and the thing it changes (stage + bezel readouts) are both permanently on screen, because neither lives inside the ScrollView anymore. Density comes from select-then-edit (N sliders collapse into 1 lane + N value-buttons, generalizing the existing M11 and Room Builder patterns) and from the Dock Tray — the tools' value-button→popup idiom re-anchored as a bottom drawer that covers only the scroll well, so a student can A/B twelve wall materials while watching RT60 move live on the glass. It is built almost entirely from existing parts: SplMeter's ctrlBar/PopupOpt extracted into shared DockButton/DockTray, DragSlider's anchored-dx guts as ParamLane, ReadoutGrid's {k,v,helpKey} contract as BezelReadouts, ScrollLockProvider unchanged, guided-lesson long-press and photoHint preserved everywhere. Migration is opt-in per module: Harmonograph pilots it (worst display-to-controls ratio, smallest surface), LiveSpectrumEq proves it in a module host with a live mic (worst inversion — controls above display), then WaveLayout converts 15 wave modules in one file, with Room Builder as the multi-tray stress test. No new native modules; PanResponder only; MIN_FONT 12 enforced in all new components.

# The Rack Unit — a global instrument-panel architecture for APE Studio labs

---

## 1. CONCEPT

**Every lab module is a piece of rack gear, not a document: a pinned glass display with its readouts printed on the bezel, a channel-strip dock of controls at the base of the faceplate, and only the "service manual" (prose, mistakes, checks, notices) scrolling between them.**

Why this optimizes learning: the owner's non-negotiable is *cause → effect always on screen*. Today that fails because display, readouts, and controls are all siblings inside one ScrollView — reaching a control mechanically scrolls the display away (Survey 2: Room Builder's material chips sit 800–900dp below the readouts they change; Survey 1: LiveSpectrumEq's chips and bars cannot co-exist on a 550dp viewport). The Rack Unit fixes this **structurally, not per-lab**: the display and the controls are simply *removed from the scroller*. There is no scroll position at which cause and effect separate, in any lab, ever. It is also how real gear works — you never scroll a compressor to find its threshold knob — which makes the idiom thematic, learnable once, and a direct rhyme with the tools standards (ToolsHub's recessed-glass tiles, SplMeter's ctrlBar value-buttons and popups, MultiMeter's pinned status bar — the one tool screen that already solved this exact problem, MultiMeterScreen.tsx:1002-1116).

---

## 2. ANATOMY

Portrait phone, top to bottom. Fixed chrome (existing host header + PREV/NEXT, ~85–122dp) is untouched. Below it, three zones; **only the middle one scrolls**.

```
┌────────────────────────────────────────┐
│ ←  ROOM BUILDER            ⓘ ACCURACY │  CHROME (existing, unchanged)
│        ◀ PREV          NEXT ▶          │  ~85–122dp
├════════════════════════════════════════┤
│ ╔════════ recessed glass stage ══════╗ │
│ ║ ┌──────────────────────────────┐   ║ │  STAGE  (pinned — outside the
│ ║ │                              │   ║ │  ScrollView; NEVER moves)
│ ║ │   Skia/SVG display           │   ║ │  glass 160–250dp (default 200)
│ ║ │   · drag sources/nodes       │   ║ │  in-display gestures live here,
│ ║ │     directly on the glass    │   ║ │  now free of scroll contention
│ ║ │                              │   ║ │
│ ║ └──────────────────────────────┘   ║ │
│ ║ RT60 0.48s│ α̅ 0.31 │MODE 86Hz│⚠ ⓘ ║ │  BEZEL: readout legends (mono ≥12,
│ ╚════════════════════════════════════╝ │  level-tinted) + honesty micro-badge
├────────────────────────────────────────┤  + display-guide ⓘ.  ~34dp strip
│ ░░░░░░░░  SCROLL WELL  ░░░░░░░░░░░░░░  │
│ ░ explainer prose                   ░  │  THE ONLY SCROLLER (flex:1,
│ ░ WHAT'S HAPPENING (collapsible)    ░  │  ~230–350dp of window).
│ ░ COMMON MISTAKES                   ░  │  Variable content height lives
│ ░ CheckQuestion (display visible    ░  │  here — a 2600dp Room Builder
│ ░   above it while answering)       ░  │  and a 750dp FindFrequency use
│ ░ notices — BOTTOM (owner standard) ░  │  the identical frame.
├────────────────────────────────────────┤
│ ┃ ROOM WIDTH ────────●─────── 8.4 m ┃  │  PARAM LANE — the one shared
│ ┃ (label + fader + mono value,     ┃  │  horizontal fader, ~52dp, bound
│ ┃  tinted per bound parameter)     ┃  │  to the selected dock button
│ ┌────────┬────────┬────────┬───────┐  │
│ │ROOM W ▪│ ROOM L │ WALL ▸ │SRCS ▸ │  │  DOCK — value-buttons (tools
│ │ 8.4 m  │ 6.0 m  │ BRICK  │  2    │  │  ctrlBar anatomy, ~54dp):
│ └────────┴────────┴────────┴───────┘  │  tap = bind lane · ▸ = open tray
└────────────────────────────────────────┘  long-press = guided lesson
```

**Where everything lives:**
- **Display** → stage glass. Displays already take height props (Survey 3: meter 170–300, wave RoomSceneView h param, ResponseCurveGraph height param), so compact stage variants need no viz rewrites. Stage sizes: S=160, M=200 (default), L=250 (earned only by display-is-the-control modules like Binaural). On short Androids (~550dp usable) the clamp drops one size automatically.
- **Readouts** → the bezel strip: 2–5 legend windows under the same glass, using ReadoutGrid's exact `{k, v, helpKey}` contract (digital/bits.tsx:41). This is the global default for "readouts inside the display" — an RN overlay strip, viz-agnostic. Per-viz **in-canvas** readouts (VuMeterView `cornerReadouts` vizMeters.tsx:758, SplDialView center digits, Spl3dGauge centerText) remain a phase-2 upgrade path per display, not a prerequisite.
- **Primary control** → whichever surface teaches best: the lane pre-bound to the module's key parameter, **or** the glass itself (MultiBand node-drag, Binaural stage drag, RoomScene source drag stay primary — the stage being pinned means these gestures no longer fight the scroller at all).
- **Secondary controls** → dock buttons that re-bind the lane (select-then-edit — the proven M11 shared-slider and Room Builder wall-chip patterns, FoundationsCourseScreen.tsx:852-883, modWaveB.tsx:1293, promoted to the architecture).
- **Option collections** (12 materials, 8 HPF freqs, 10 sections) → Dock Trays (§3). More than ~5 dock params → **banks**: a slim bank-tab row above the strip (SOURCE / TONE / FX), exactly like paging a digital console — Playground's existing section heads become its banks.

**Budget check (390×~700 usable):** stage 200+34 bezel+frame ≈ 244; dock 54+52+gaps ≈ 118; well ≈ 320. Worst case (550 usable): stage S=160 → well ≈ 220 — tight but the well only holds scrollable prose/checks, which is exactly what scrolling is for.

---

## 3. INTERACTIONS

**Adjust the primary parameter.** Module declares `initialParam`; on mount the lane is already bound to it (button lit amber). Drag the lane thumb — anchored-dx math and auto scroll-lock inherited from DragSlider (foundations/bits.tsx:93), though lock is now nearly moot since the lane sits outside the scroller. Display and bezel update live: canvas via existing SharedValue/state paths; bezel text throttled ~15–30Hz (the PeakAvgMeterView animatedProps precedent, vizMeters.tsx:3074, is the escape hatch if JS-state text ever janks). **Nothing moves. Nothing can move.**

**Adjust a secondary parameter.** Tap its dock button → lane re-binds: button gets the amber-selected treatment, lane relabels/retints, thumb animates to the new value (~120ms). Drag. One motor pattern — *tap the legend, ride the fader* — repeated in every lab; learned once, per the owner's mandate. Haptic tick on select (ToolsHub press haptic).

**Work an option collection (12 wall materials).** Tap `WALL ▸ BRICK` → the **Dock Tray** slides up from the dock: same card tokens as the tools popup (bg #141418, border #2b2b33, r14, backdrop rgba(0,0,0,0.72) — SplMeterScreen.tsx:2002, 2592-2628) but **anchored above the dock with its top edge stopping below the stage, and the backdrop dimming only the well**. This is the one deliberate divergence from the tools popup, and it is the load-bearing one: the glass stays bright and live, so tapping BRICK → FOAM → CURTAIN animates RT60/α on the bezel *while the tray is open* — A/B comparison is the lesson. Two modes: `sticky` (teaching collections stay open for A/B; ✕ / backdrop / Android-back closes — BackHandler chain per SplMeterScreen.tsx:784-800) and default apply-and-close (tools parity, for set-and-forget settings). Chips inside are LabChips, so `photoHint` long-press → material photo (materialPhotos.ts) survives unchanged. RESET lives in-tray (in-container rule, per SplMeter's in-popup RESET :2033).

**Readouts.** Always in the bezel. Mono ≥12, level-tinted via levelColor.ts (the app-wide teaching ramp). Long-press a bezel cell = its helpKey lesson (ReadoutGrid contract preserved). Tap-to-reset cells (PK HOLD style) keep the tools' tap/⟲ behavior.

**Never leaves the screen:** stage, bezel readouts, param lane, dock strip. **Always reachable by long-press:** guided lessons on every dock button, bezel cell, and the stage guide ⓘ (GuidedLessonSheet + controlKey registry untouched — 23 files keep working).

**Gestures, precisely:** all PanResponder (RNGH not installed — unchanged). Lane = horizontal capture-claim, no conflict with the vertical well. On-glass drags = existing PanResponders, minus their scroll-lock burden. Tray content taller than the tray scrolls internally (its own bounded ScrollView — legal, it's outside the main scroller). Well = a plain ScrollView still wrapped in ScrollLockProvider for legacy in-well widgets (a CheckQuestion drag, a stray DragSlider mid-prose).

---

## 4. COMPONENTS

New shared components (all under `src/screens/lab/rack/`), built by extraction, not invention:

```ts
// RackUnit.tsx — the frame. Owns pinned stage + well + dock.
type RackUnitProps = {
  stage: {
    render: (w: number, h: number) => ReactNode; // existing height-param'd viz
    size?: 'S' | 'M' | 'L';                      // 160 | 200 | 250, auto-drops on short viewports
    bezel?: BezelItem[];                         // readouts ON the display
    badge?: string;                              // honesty micro-badge (must stay per-display)
    onGuide?: () => void;                        // DisplayGuideButton slot
  };
  params: DockParam[];        // ≤5 flat; more → banks
  banks?: { id: string; label: string; params: DockParam[] }[];
  initialParam?: string;
  children: ReactNode;        // THE SCROLL WELL: prose, mistakes, CheckQuestion, notices(bottom)
};

type BezelItem = { k: string; v: string; tint?: string; helpKey?: string;
                   onPress?: () => void /* tap-to-reset cells */ };

type DockParam =
  | { kind: 'fader'; id: string; label: string; value: number;      // 0..1
      onChange: (v: number) => void; format: (v: number) => string;
      taper?: 'lin' | 'log'; tint?: string; helpKey?: string }
  | { kind: 'options'; id: string; label: string; valueLabel: string;
      options: { id: string; label: string; photoHint?: string }[];
      onSelect: (id: string) => void; sticky?: boolean;             // sticky = A/B tray
      onReset?: () => void; helpKey?: string }
  | { kind: 'toggle'; id: string; label: string; value: boolean;
      onToggle: () => void; helpKey?: string }
  | { kind: 'action'; id: string; label: string; onPress: () => void };
```

- **`DockButton`** — SplMeter's ctrlBarBtn extracted verbatim (flex:1, r10, border #26262c, bg #131316, padV 9; SplMeterScreen.tsx:2569-2591) with fonts bumped to spec: Oswald **12** label / mono **14** amber value (not the tools' 9.5 — new components honor MIN_FONT 12). a11y: `"LABEL: value. Tap to adjust."` + long-press lesson.
- **`DockTray`** — the de-modalized in-tree overlay (never a native Modal — the 2026-08-19 iOS black-screen lesson), bottom-anchored, `maxHeight = window − stage`, PopupOpt-grid of **LabChips** (LabShell.tsx:49 — keeps photoHint + long-press), in-tray RESET, BackHandler-first close.
- **`ParamLane`** — DragSlider's anchored-dx + lock internals re-skinned as a 44dp-track channel fader with in-lane label + mono value. DragSlider itself is **not modified** — its 30 call sites are untouched.
- **`BezelReadouts`** — ReadoutGrid's items rendered as bezel legend windows; ReadoutGrid itself untouched.
- **Stage frame** — the ToolsHub tile anatomy reused: metallic bezel gradient → dark seam → glass cap with 1px TILE_SINK (ToolsHubScreen.tsx:206-284).

Integration points:
- **`LabShell`** gains optional `stage`/`params`/`banks` props (LabShell.tsx:219). Present → header + tabs pinned, RackUnit fills the rest, children go to the well. Absent → exact current behavior. One change reaches all 11 LabShell labs.
- **Module hosts** (5 copy-pasted \*ModuleScreen.tsx) get a per-module `rack: true` registry flag: rack modules render **outside** the host ScrollView as flex:1; legacy modules keep the ScrollView. This is the entire incremental-migration mechanism. (Optionally extract the shared host later; not required for v1.)
- **`WaveLayout`** (waveLayout.tsx:19) becomes the adapter for all 16 wave modules: `readouts→bezel`, `display→stage.render`, `controls→params`, `explain/mistakes/check→well` — honoring its own comment that a reorder should be "a single-place change (not 16 edits)."
- **Unchanged and load-bearing:** ScrollLockProvider/InteractionZone, CheckQuestion, GuidedLessonSheet/DisplayGuideButton, EqAuditionBar (a natural dock `action`/strip row), EngineGate (zero-height, sits in the stage), levelColor.ts, AccuracyNote.

---

## 5. THEME

The stage **is** a ToolsHub tile grown to full width: recessed smoked glass sunk 1px into the faceplate, metallic bezel, dark seam — the dashboard/ToolsHub language, so a student moving from the tools rack into a lab reads the same machine. Bezel readouts render as backlit legend windows silk-screened on the bezel (Oswald 12 letterspaced keys, mono amber values), the exact idiom of SplMeter's ctrlBar and MultiMeter's pinned status cells. The dock is the channel strip at the base of a 1U face: GlassButton-lineage backlit keys, selected state = amber border + #1c1608 fill (the PopupOpt selected treatment, so labs and tools light up identically). The lane is a console fader lying on its side, thumb and track tinted by the bound parameter — band tints in EQ, MIDI amplitude ramp for level params — keeping levelColor.ts as the app-wide teaching color language. Trays are drawers sliding out of the faceplate, in the tools' popup card tokens. Every tools standard is honored literally: notices at the well's bottom, multi-option settings as value-buttons→popups, reset in-container, AccuracyNote in the header; the landscape-fullscreen LEFT-column standard maps 1:1 later because a dock strip rotated 90° *is* the left control column (WaveformScreen FS_CTRL_W=108).

---

## 6. MIGRATION

**Phase 0 — build the kit (no lab changes).** DockButton, DockTray, ParamLane, BezelReadouts, RackUnit + LabShell props + host `rack` flag. Everything is additive; zero regression surface. Ship behind nothing — unused code until a module opts in.

**Phase 1 — three converts, chosen to de-risk in order:**
1. **Harmonograph** (HarmonographLabScreen.tsx:241-368) — Survey 3's WORST offender (figure always off-screen while adjusting), yet the smallest surface: one screen, LabShell-based, 2 sliders + 4 chip rows + ~90dp readouts → stage L (figure at 240) + bezel + lane + ~6 dock buttons with 2 trays. Proves stage/lane/tray/sticky end-to-end and gives the owner a dramatic before/after on the worst case.
2. **LiveSpectrumEq** (via EqModuleScreen `rack` flag) — Survey 1's worst inversion (controls ABOVE the display; co-visibility impossible on 550dp). Proves the module-host path, a **live-mic Skia stage** pinned with EngineGate, HPF/slope collections as trays, and guided-challenge cards reading from the well while the bars they direct stay on the glass — instructions currently 700–1000px from their controls.
3. **Wave Physics via WaveLayout** — the mass-migration payoff: 15 modules convert in one file (readouts→bezel, sliders→lane-bound params, material chips→sticky trays). Then **Room Builder** by hand as the stress test: WALL/MATERIAL/SOURCES banks + trays collapse a 2300–2600dp scroll (3.5 viewports) into one fixed faceplate.

**Phase 2:** Foundations Playground (banks: SOURCE/TONE/FX), meter host (11 modules — hero PanelCard maps almost 1:1), digital host, MicPrinciples (its 10 section chips become one `options` tray, reclaiming 130–170dp from *every* section), remaining EQ modules (MultiBand keeps node-drag as primary; GraphicTruth keeps GraphicBoard **in-stage** as the sanctioned multi-fader exception, retiring its 313px-distant activeBar readout into the bezel).

**Stays untouched:** Cable wizard, Calc screens (pinInputs already solve their problem), Tube pager (already the pattern's cousin — a donor, not a patient), TubeReference browser, gain modLearn prose modules 1–5, hub homes/accordions, CheckQuestion internals, guided-lesson registry, all ratified copy, and the tools screens themselves.

---

## 7. RISKS & COSTS

- **Gesture conflicts** — *reduced*, not added: stage and dock leave the scroller, so display drags and lane drags can't fight scrolling; only legacy in-well widgets still need ScrollLockProvider (kept). Tray-internal scroll is isolated. Residual: lane drag vs. accidental well fling at the boundary — 8dp dead zone above the lane. **S.**
- **Skia/perf/Fabric** — one always-mounted canvas = today's steady state; bezel text throttled 15–30Hz (or SVG animatedProps per the PeakAvgMeterView precedent) avoids re-render storms; in-tree absolute overlays are the tools' proven de-modalized pattern on Fabric (no Modal-over-Modal). Watch: tray animation over a live Skia stage on old Androids → animate `translateY` with the installed reanimated 4.5.1, never layout. **M** to validate on device.
- **Short viewports (550dp)** — stage auto-drops a size; well bottoms out ~220dp; CheckQuestion scrolls (that's fine — the display it references is pinned above it). **S.**
- **a11y** — dock buttons labeled "X: value. Tap to adjust"; lane gets `adjustable` role + increment/decrement actions (a real accessibility *gain* over raw pan-only sliders); 44px targets throughout; MIN_FONT 12 enforced in all new components (deliberately not copying tools' 9.5/9 precedents). **S.**
- **Discoverability** — select-then-edit hides sliders behind buttons: mitigate with always-visible values, amber selected state, a one-time pulse on the dock at first lab open, and guided lessons on long-press. **S.**
- **Migration correctness** — per-module opt-in flag means a broken convert never takes down a host; WaveLayout conversion is the one wide blast radius → convert behind the flag module-by-module even within wave. **M.**
- **Effort:** kit (DockButton **S**, DockTray **M**, ParamLane **S**, BezelReadouts **S**, RackUnit+LabShell+host flags **M**) ≈ 1 focused build session. Harmonograph **M**. LiveSpectrumEq **M**. WaveLayout+15 **M–L**, Room Builder **L**. Phase 2 per host **M** each. No native modules, no new build anywhere in this plan.

---

## 8. TRADEOFFS

- **Simultaneity for visibility.** One lane means you tweak one parameter at a time; today's stacked-sliders view of 3 params at once is gone (sanctioned exception: GraphicBoard's 10 in-stage faders). For *teaching* — isolate one variable, watch its effect — this is arguably a feature, but a power user loses a grip.
- **Reading room.** The well is ~230–350dp instead of the full window; long prose scrolls more in a smaller pane. Cause→effect is bought with reading comfort — the right trade for interactive modules, which is why prose-only modules (gain modLearn) simply don't adopt the rack.
- **One tap of distance.** Option chips move from always-visible rows into trays; current choice shows only as a value string until opened. The sticky tray recovers A/B flow, but glanceability of the *whole* option set is sacrificed.
- **Fixed overhead.** The dock costs ~118dp even on a one-parameter module; trivial modules may feel over-instrumented (they may run stage-plus-lane, dockless).
- **Uniformity over bespoke charm.** Sixteen wave modules stop having sixteen layouts. That is the point — one idiom, learned once — but per-module layout experimentation now happens inside the frame, not instead of it.
- **Vertical faders recede.** VerticalFader survives only inside GraphicBoard; the "channel strip" reads horizontal on portrait phones.
- **No landscape fullscreen in v1.** Deferred, but the dock⇄left-column mapping keeps the door open at zero redesign cost.

---

### Appendix (optional, explicitly flagged — requires a NEW NATIVE BUILD)
Adding `react-native-gesture-handler` would enable pinch-on-glass (Q width on MultiBand, room zoom in Room Builder) and buttery simultaneous-gesture arbitration. It is a native module: per project rules this is a separately-approved build decision, and **nothing above depends on it** — the entire architecture ships on PanResponder.