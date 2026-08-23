# Faceplate — the pinned on-stage instrument

## SUMMARY
Every lab module becomes a fixed rack instrument: a pinned FACEPLATE (interactive display "Glass" + a 52px "Deck" of value-buttons) that never scrolls, with all prose, mistakes, and checks scrolling beneath it as "Paper". Parameters live ON the Glass as a small grammar of handles — nodes, edge-grips, region targets — generalized from MultiBand's proven node-drag PanResponder, with readout tags that ride the finger and a persistent in-glass ReadoutRail (VuMeterView cornerReadouts precedent). Everything that cannot live on-stage collapses into the Deck, which is the SplMeter value-button→popup idiom finally extracted into shared components; popups dock BELOW the glass so cause→effect is visible even while choosing among 12 wall materials. Because the Faceplate sits outside the ScrollView (MultiMeter pinned-status-bar precedent), the drag-vs-scroll war on the display disappears entirely — no stickyHeaderIndices, no new native modules, PanResponder only. Discoverability is solved explicitly: a one-time handle shimmer, a HANDLES overlay mode next to the existing display-guide button, and a hard rule that every on-stage handle also has a Deck route (which doubles as the screen-reader fallback). Precision comes from anchored-dx coarse drags plus "afterglow steppers" and full-width PopFaders for fine adjustment. Migration is incremental per host: MultiBand pilots it (shortest distance), Wave Physics converts 16 modules through the single WaveLayout file (biggest leverage), Harmonograph proves the LabShell adapter for the 11 one-screen labs.

# FACEPLATE — a pinned on-stage instrument for every lab

## 1. CONCEPT

**Every lab module is a rack unit bolted to the top of the screen: the display IS the control surface (handles on the Glass), the numbers live IN the glass, one thin Deck of value-buttons holds what can't live on-stage, and everything else — prose, mistakes, checks — is Paper that scrolls underneath the unit.**

Why this optimizes learning: the owner's core complaint is that cause and effect get separated by scrolling — you reach the material chips and the RT60 readout is 800px away (wave PanelCard, survey 2), or the LiveSpectrumEq bars need scroll≥195 while its HPF chips need scroll≤70 (survey 1). Pinning the display+controls as one fixed unit makes separation *structurally impossible*: the thing you touch, the picture it changes, and the number that proves it are all inside one ~300px faceplate that cannot leave the screen. Direct manipulation goes further: for the parameter each module *teaches*, the handle sits on the visualization itself, so the student's finger is literally on the curve/wall/node — the cause and the effect are the same pixels. This is not speculative in this codebase: MultiBand's on-graph node drag (MultiBand.tsx:125-163) and GraphicTruth's in-panel faders are the two spots students can already "touch the physics," and they are the two best-behaved layouts in the audit.

## 2. ANATOMY

Portrait phone, 375×812 (≈690dp usable under chrome; design floor 550dp Androids):

```
┌──────────────────────────────────┐
│ ◂  ROOM ACOUSTICS · ABSORPTION ⓘ │  existing fixed header (~44)
│ ◂ PREV          4/16      NEXT ▸ │  existing module nav (~21)
╞══════════ FACEPLATE (pinned, not in scroll) ══════════╡
│ ┌──────────────────────────────┐ │
│ │ RT60 0.48s │ α 0.71 │ ⓘ  ⤢  │ │  ← ReadoutRail: mono cells IN the
│ │──────────────────────────────│ │    glass (long-press = help)
│ │      ╔════════════╗          │ │
│ │  ▐▓▓ ║   room     ║  ◈       │ │  GLASS 200–260px
│ │  edge║   scene    ║ node     │ │  Skia/SVG viz + SVG handle layer
│ │  grip╚════════════╝ handle   │ │  ◈ = node · ▐▓▓ = edge-grip
│ │        ┌─────────┐           │ │  ⊕ = region target
│ │     ⊕  │ 2.1 m   │← drag tag │ │  tag rides above the finger
│ │        └─────────┘           │ │
│ └──────────────────────────────┘ │
│ ┌───────┬────────┬───────┬─────┐ │  DECK 52px: value-buttons
│ │ WALL  │MATERIAL│ LEVEL │  ⋯  │ │  (Oswald label / mono amber value)
│ │ NORTH │ BRICK  │ -12dB │ ALL │ │  tap → PopSheet; ⋯ = every param
│ └───────┴────────┴───────┴─────┘ │
╞═══════════ scrolls under the faceplate ═══════════════╡
│ ▾ WHAT'S HAPPENING                │  PAPER (ScrollView +
│   prose · layers · mistakes       │  ScrollLockProvider kept for
│   [ CheckQuestion ]               │  legacy inner interactives)
│   honesty badge / notices (BOTTOM)│
└──────────────────────────────────┘
```

- **Faceplate = Glass + Deck**, a sibling ABOVE the ScrollView, exactly how MultiMeter pins its status bar + SPL meter above its scroll (MultiMeterScreen.tsx:1002-1116). No `stickyHeaderIndices`, no absolute-position tricks, Fabric-safe plain layout.
- **Glass**: the module's Skia/SVG viz (heights are already props — meter/wave viz parameterized, survey 3) with two overlays: the ReadoutRail (in-glass numeric truth, precedents: VuMeterView `cornerReadouts` vizMeters.tsx:758-771, SplDialView center readout :2743, MultiMeter's in-plot Hz·dB cursor chip :1159-1229) and the handle layer.
- **Deck**: the SplMeterScreen ctrlBar anatomy verbatim (:1566-1596, styles :2569-2591) — flex-1 value-buttons, 9.5px Oswald label over 14px mono amber value — finally extracted to a shared component. Deck rows: max 2 (104px hard cap). The last button is **⋯ ALL**, opening the complete parameter list (the a11y/discoverability floor, section 3/7).
- **Budget**: rail lives inside the glass height; faceplate = glass 200–260 + deck 52 + 16 padding ≈ **270–330px**. Paper gets ≈240px on an 812 phone, ≈120px on 550dp — so the rail carries a **collapse chevron (⤢)** that shrinks the glass to a 96px mini-strip (rail + thumbnail) when the student is deep in Paper/CheckQuestion — the SplMeter collapsible-gauge move (:1598-1632). ReadoutGrid rows, standalone readout containers, and chip walls above the display are deleted; that's where the height comes from (Absorption alone reclaims ~3 cell rows + 3 chip rows ≈ 250px, survey 2).

## 3. INTERACTIONS

**Handle grammar** (the discoverability problem, solved explicitly):
- **Node ◈** — a point parameter (band freq/gain, source position): 22px ring, 3px stroke in the parameter's MIDI ramp color (`gainColor`/`levelColor` — the app's existing teaching language), dark #0c0c0f core with a 2×2 grip-dot matrix (the hardware-fader knurl cue). 44px invisible hit slop.
- **Edge-grip ▐▓▓** — a draggable boundary (HPF cutoff line, wall position, crossover): the line plus a 28×18px tab with three tick marks at its midpoint.
- **Region ⊕** — drag-inside-area (listener/mic position in RoomScene, Binaural stage): crosshair + dashed halo circle.
- Anything grabbable is stroked at full opacity in ramp/amber color; non-interactive geometry never exceeds 40% stroke opacity. That contrast rule alone is the passive affordance.
- **Active feedback**: on touch the handle scales 1.15×, fires a haptic tick (ToolsHub press precedent), and its **drag tag** appears — a mono chip riding 28px above-left of the finger showing `1.2 kHz · +4.5 dB` (generalizing MultiMeter's cursor chip; kills GraphicTruth's 313px-away activeBar for good).
- **Taught, not guessed**: (1) one-time-per-module 600ms shimmer pulse across all handles on first mount (persisted flag, same local-persistence pattern as labCompletion); (2) a **✋ HANDLES** button next to the existing DisplayGuideButton that overlays name labels on every handle; (3) long-press any handle → `getControlLesson` for that parameter (the guided-lesson contract every control already honors — survives the redesign by design).

**Primary parameter (the thing the module teaches)** — e.g. absorption coefficient via material, EQ band freq/gain, source distance: drag its on-stage handle. One PanResponder on the whole glass, MultiBand's exact proven mechanics (MultiBand.tsx:125-163): capture-claim on touch-down, grant grabs the **nearest handle within a 28-viewBox-unit radius**, anchored dx/dy in viewBox space (never locationX rebasing — the whip bug class is already solved), `onPanResponderTerminationRequest: () => false`. The glass is NOT inside the ScrollView, so the drag-vs-scroll war that produced three generations of fixes (owner 2026-07-29/30, 2026-08-07, 2026-08-23) simply does not exist on the faceplate. Tap (<8px, <250ms) = select; drag = adjust; long-press (350ms static) = lesson. A grab-radius miss falls through to the scene gesture (pan/zoom) where the viz has one, else no-op.

**Precision (fine after coarse)**: on release, the drag tag stays lit for 2s and sprouts **afterglow steppers** — a ± pair beside the tag nudging one honest step (0.5 dB, 1 Hz-cent, 0.1 m). For full precision, the parameter's Deck button opens a **PopFader**: a full-width DragSlider (343px of travel vs a 108px fader = 3× finer) + steppers + in-popup RESET, in a card that **docks directly under the faceplate**, backdrop only over Paper — the glass stays fully visible while you drag. This is the owner's "popup fader" spitball realized in the tools' de-modalized in-tree overlay anatomy (SplMeterScreen.tsx:1996-2040; native Modals are banned by the modal-over-modal iOS black-screen lesson).

**Secondary parameter (no natural spatial home)** — e.g. Q, signal source, playback level: it lives on the Deck as a value-button. Tap → PopFader (continuous) or OptionSheet (enumerated). Picking an option applies + closes in one tap (tools rule); faders close on ✕/backdrop. Android back unwinds popup → (fullscreen) → screen (BackHandler chain, SplMeterScreen.tsx:784-800).

**Option collection (12 wall materials)** — the select-then-edit pattern Room Builder already invented (modWaveB.tsx:1293,1347), promoted to grammar: **the Deck is the inspector of the current on-stage selection.** Tap a wall in the scene (it outlines amber, its material tag lights) → the Deck's WALL/MATERIAL buttons retarget to it → tap MATERIAL → OptionSheet grid of LabChips (3-4 per row; `photoHint` long-press photos preserved) docked under the faceplate → tap BRICK: sheet closes, the wall re-textures, RT60/α update in the rail — **display, selection, and consequence never leave the screen at any point in the flow.** Chip walls stop costing permanent rows anywhere.

**Readouts**: two tiers, both in-glass. The ReadoutRail holds the module's teaching payload (α, RT60, LUFS…) as mono cells, updating live, long-press = help (ReadoutGrid's helpKey contract carried over). The drag tag shows the touched parameter during gestures. Nothing numeric renders outside the faceplate except quiz feedback in Paper.

**What never leaves the screen**: the Glass, the ReadoutRail, the Deck, and — during any popup — the Glass still (popups dock below it). Notices stay at scroll-bottom per the owner standard; honesty badges stay per-display, rendered at the glass's bottom edge.

## 4. COMPONENTS

New, in `src/screens/lab/stage/` (all PanResponder + rn-svg/Skia; zero new native deps):

```ts
// The pinned host — replaces the per-module raw stack ordering.
export function FaceplateHost(props: {
  glass: ReactNode;            // a <StageGlass>
  deck: DeckButton[];          // 1–2 rows, last = auto "⋯ ALL"
  children: ReactNode;         // Paper (scrolled; ScrollLockProvider kept)
  collapsedGlass?: ReactNode;  // 96px mini-strip when chevron-collapsed
});

export type StageHandle = {
  id: string;
  kind: 'node' | 'edge' | 'region';
  x: number; y: number;                    // viewBox coords (caller projects)
  axis?: 'x' | 'y' | 'xy';                 // which drags apply
  color?: string;                          // MIDI ramp via gainColor/levelColor
  label: string;                           // 'FREQ / GAIN'
  tag: string;                             // '1.2k · +4.5 dB' (drag tag text)
  onDrag: (dxVb: number, dyVb: number, phase: 'grant'|'move'|'end') => void;
  onTap?: () => void;                      // select / toggle
  lessonKey?: string;                      // long-press → getControlLesson
  fine?: { step: string; onNudge: (dir: 1 | -1) => void };  // afterglow ±
};

export function StageGlass(props: {
  height: number;                          // 200–260 portrait
  viewBox: [number, number];
  children: ReactNode;                     // the viz, pointerEvents="none"
  handles: StageHandle[];
  selectedId?: string; onSelect?: (id: string | null) => void;
  rail?: RailCell[];                       // { k, v, color?, helpKey? }
  badge?: ReactNode;                       // honesty Badge, bottom edge
  onGuide?: () => void; onHandlesOverlay?: () => void;
});
// One capture-claim PanResponder; nearest-enabled-handle grab w/ 28-unit
// radius + selected-handle stickiness; anchored dx/dy (MultiBand math).

export function DeckStrip({ buttons }: { buttons: DeckButton[] });
export type DeckButton = {
  label: string; value: string; tint?: string;
  onPress: () => void; onLongPress?: () => void;   // long-press = help
  a11y?: { increment?: () => void; decrement?: () => void };
};

export function PopSheet(props: {                  // in-tree overlay, docked
  visible: boolean; title: string; onClose: () => void;
  children: ReactNode;                             // backdrop covers Paper only
});
export function PopFader(props: {                  // inside PopSheet
  label: string; value01: number; onChange: (v: number) => void;
  readout: string; onReset?: () => void;
  step?: { label: string; onNudge: (d: 1 | -1) => void };
});
export function OptionSheet(props: {               // inside PopSheet
  options: { label: string; selected: boolean; onPress: () => void;
             photoHint?: string }[];               // LabChip grid, 1-tap apply
});
```

**Existing pieces map in, not out**: `DragSlider` (bits.tsx:93) is the engine inside PopFader unchanged — its 30 call sites migrate by relocation, not rewrite. `LabChip` renders OptionSheet rows (photoHint intact). `PanelCard`/`CollapsibleSection` keep framing Paper. `ScrollLockProvider` still wraps Paper for legacy inner interactives during migration. `ValueButton`/`PopSheet` are extractions of SplMeterScreen's ctrlBar + popupCard + PopupOpt (:1566-1596, :1996-2040, :259-272) — the labs finally *consume* the tools standard instead of rhyming with it from afar. `ResponseCurveGraph`, `RoomSceneView`, meter viz all slot into StageGlass as children since their heights are already props. `EqAuditionBar` and `EngineGate` mount as an optional second Deck row. `GuidedLessonSheet` is reached from handle long-press via `lessonKey`. `useToolHelp`/`HelpHead` back the rail's long-press help.

## 5. THEME

The faceplate is literally the ToolsHub tile grammar promoted to full size: the Glass is a **recessed display cutout** — 1px metallic bezel gradient, dark seam, smoked-glass overlay (`TileGlass`), sitting in the rack-gray panel field (`PanelFace`, ToolsHubScreen.tsx:206-284). Handles glow amber/ramp against #131316 glass; selection = amber halo (#1d1708 fill + rgba(255,198,77,.55) border — the exact active-chip tokens). The Deck reads as the unit's front-panel button row: #131316 buttons, #26262c borders, Oswald 9.5px labels, mono amber values — pixel-identical to SplMeter's ctrlBar so a student who has used the SPL meter already knows the idiom (one idiom, learned once — across tools AND labs). PopSheets are the tools' popup card (#141418, radius 14, border #2b2b33). The MIDI blue→red ramp remains the single color language for level/gain everywhere (levelColor.ts), including handle strokes and rail cells. Notices at the bottom, reset inside the thing it resets (in-popup RESET, tap-to-reset rail cells where honest), honesty Badge pinned at the glass edge: all three owner standards land verbatim. A later landscape fullscreen (appendix-adjacent, no native work: `screenOrientationSafe` already exists) uses the LEFT 106-108px column of the same Deck buttons — the WaveformScreen fsRoot anatomy.

## 6. MIGRATION

The design is adopted **per host**, and each host conversion is mechanical because module code splits naturally into {viz, params, prose}:

- **Step 0 (shared, no lab touched)**: build ValueButton/DeckStrip/PopSheet/PopFader/OptionSheet by extracting SplMeter's inlines; build StageGlass by generalizing MultiBand's PanResponder; build FaceplateHost. Tools screens can optionally re-consume the extractions later (RTA is the least-migrated tool and would benefit, but that is out of scope).
- **Lab 1 — EQ lab (EqModuleScreen host)**: shortest distance. **MultiBand** is 80% converted already (node-drag exists): band chips + F/G sliders → deleted (nodes + drag tag replace them), Q → Deck PopFader + afterglow steppers, done — the pilot proves Glass/Deck/tag on real hardware. Then **LiveSpectrumEq**, the single worst offender (controls *above* display; co-visibility mathematically impossible on 550dp — survey 1): HPF/slope chips → edge-grip on the curve + Deck; guided-challenge cards stay in Paper but now direct at an always-visible display. Converting the best and worst case in one host validates the range.
- **Lab 2 — Wave Physics**: maximum leverage. WaveLayout (waveLayout.tsx:19) was explicitly built so reordering is "a single-place change (not 16 edits)" — it becomes the FaceplateHost adapter: readouts slot → ReadoutRail, display slot → StageGlass child, controls slot → Deck + handles. RoomSceneView is already drag-in-canvas (source/listener → region handles for free). Material/wall chips → the inspector flow. Room Builder (the 3.5-viewport monster) is the stress test and converts last within the lab.
- **Lab 3 — Harmonograph via a LabShell pinned variant**: the worst single-screen offender (figure always off-screen, survey 3) and deliberately small — it proves `LabShell` can grow a `faceplate` prop (Glass+Deck pinned above its existing tab/scroll structure) that then unlocks the other 10 one-screen labs (Binaural next: its draggable stage is already the primary gesture) without touching them yet.
- Then: meter modules (viz heights are props → Glass-ready), digital, gain (DeviceCard chain gets a pinned Master-meter rail, fixing the system-level cause→effect break), foundations Playground (source chips → Deck OptionSheet).
- **Untouched**: Cable Lab (stepped wizard — reading, not adjusting), Calc (form with working pin-on-focus), TubeReference/TubeCard (browser), gain modLearn 1–5 and other prose-only modules, foundations course steps 1–14 (already ~fit), CheckQuestion, guided-lesson content, honesty badges, all ratified copy.

Old and new coexist indefinitely: FaceplateHost is opt-in per module screen; unconverted labs keep ScrollLockProvider behavior unchanged.

## 7. RISKS & COSTS

- **Gesture conflicts**: on-glass conflicts are *reduced* (glass leaves the ScrollView; the entire drag-vs-scroll fix history stops applying there). Residual risks: nearest-handle mis-grabs when handles cluster (mitigation: 28-unit radius, selected-handle stickiness, per-kind priority node>edge>region; MultiBand ships this logic today at :139-151); tap-vs-drag-vs-long-press thresholds need one round of device tuning (the owner tests on phone — plan for it). Paper keeps ScrollLockProvider so legacy inner sliders behave until relocated.
- **Skia/perf**: handle layer is SVG stacked over Skia with `pointerEvents="none"` on the viz — both patterns are proven in-app (PeakAvgMeterView's in-canvas SVG readouts :3074-3221; the "pointerEvents-none over Skia" SPL/VU lesson). Drag tag position can use reanimated (installed, 4.5.1, already used by Harmonograph) to avoid per-frame setState; parameter state updates throttle through the existing rAF loop idiom. Fabric: plain sibling layout, no sticky indices, in-tree overlays not native Modals (the de-modalized rule) — nothing exotic.
- **Accessibility**: on-stage handles are invisible to screen readers; the **Deck-completeness rule** is the answer — every handle parameter appears in the Deck or its ⋯ ALL sheet, with `accessibilityActions` increment/decrement on value-buttons and full PopFader operability. When `AccessibilityInfo.isScreenReaderEnabled`, StageGlass swaps its PanResponder for focusable per-handle proxies that open PopFaders. Fonts: values/tags mono 12+ (MIN_FONT); Deck labels at 9.5px Oswald follow the shipped tools precedent but should be flagged to the owner as a standing MIN_FONT exception to ratify.
- **Small phones**: 550dp viewport leaves ~120px of Paper under a full faceplate — the collapse chevron and compact glass heights (wave 250→220, binaural 330→260) are load-bearing, not nice-to-have.
- **Effort** (S ≈ half-day, M ≈ 1–2 days, L ≈ 3–5 days, solo): ValueButton/DeckStrip extraction **S** · PopSheet+OptionSheet+PopFader (docking, BackHandler, a11y) **M** · StageGlass+handles+tag+rail **L** (the core bet) · shimmer + HANDLES overlay **S** · FaceplateHost + EqModuleScreen wiring **M** · MultiBand pilot **S** · LiveSpectrumEq **M** · WaveLayout adapter + wave handle wiring **L** · LabShell faceplate variant + Harmonograph **M**. Phase 1 (shared kit + EQ pilot) ≈ 2 weeks; each subsequent lab S–M.

## 8. TRADEOFFS

- **Paper loses real estate.** A pinned 270–330px faceplate means less visible prose at any moment; the collapse chevron is the escape hatch, but reading-heavy moments now cost a tap. Chosen deliberately: the labs are adjustment-first, reading-second.
- **Secondary parameters cost one tap.** Persistent DragSlider rows had zero-tap access; Deck→PopFader adds a tap for anything off-stage. The trade is exact: the *taught* parameter gets faster (finger on the physics), the peripheral ones get slightly slower.
- **Handles are less self-evident than sliders** for a first-time student. Mitigated three ways (shimmer, HANDLES overlay, Deck completeness), but a slider's affordance is genuinely stronger; we are trading first-30-seconds obviousness for every-session-after directness.
- **Rotary/ring gestures are cut from v1.** Q-type parameters do not get an on-stage gesture (no ring handles); they live in PopFaders/steppers. Honest scope control over a gesture PanResponder disambiguates poorly.
- **One idiom flattens per-lab character.** Bespoke layouts (Tube pager, Playground's sprawl) get normalized; some charm is sacrificed for the learned-once grammar the owner asked for.
- **Migration debt window**: until a host converts, its labs keep the old anatomy — the app will show two idioms for some weeks. Accepted per the incremental-migration non-negotiable.
- **No react-native-gesture-handler** means no simultaneous-recognizer niceties (pinch-while-drag, two-finger fine mode). *Optional appendix, clearly flagged as a native-build decision*: adding RNGH + a build would enable pinch-zoom on scenes and a two-finger fine-gear drag; nothing in this proposal depends on it.