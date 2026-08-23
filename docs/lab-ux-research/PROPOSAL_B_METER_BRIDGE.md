# Meter Bridge

## SUMMARY
Meter Bridge reorganizes every lab module around a console metaphor the app already speaks: the display becomes a pinned "meter bridge" at the top of the screen with its readouts drawn inside the glass, and every adjustable parameter compresses into a bottom-docked Param Rail of value-chips — the exact label-over-amber-value anatomy of the tools' ctrlBar. Tapping a chip opens an ephemeral bottom-docked control surface (a FaderSheet for continuous parameters, an OptionDeck grid for collections like 12 wall materials) sized so the bridge never leaves the screen: cause lives in the bottom thumb zone, effect in the top third, always co-visible by geometry rather than by luck of scroll position. The scrolling lesson body (prose, checks, notices-at-bottom) survives unchanged in the middle and simply dims while a surface is open. Nearly everything is built from existing parts — DragSlider's anchored-drag math powers the FaderSheet, LabChip powers the OptionDeck, the SplMeter popup skin becomes shared surfaceStyles, and ScrollLockProvider keeps governing in-display gestures like MultiBand's node-drag. Migration is incremental and high-leverage: a Harmonograph pilot proves the kit in one file, waveLayout.tsx converts all 16 Wave Physics modules in a single place, and an extracted shared module host fixes LiveSpectrumEq (the worst measured offender) while setting up digital/meter/gain for free. No new native modules; Reanimated (already installed) animates the sheets; PanResponder gesture rules carry over verbatim.

# METER BRIDGE — a global lab architecture for cause→effect co-visibility

## 1. CONCEPT

**Every lab module becomes a mixing console in miniature: the display is the *meter bridge* — pinned at the top with its readouts drawn inside the glass — and every adjustable parameter lives in a bottom-docked *Param Rail* of value-chips that open ephemeral bottom control surfaces sized so the bridge never leaves the screen.**

On a real console, the meter bridge is mounted *above* the work surface precisely so your eyes stay on the meters while your hands work the strip below. That is the owner's non-negotiable stated as furniture: the thing you adjust is in the bottom thumb zone, the thing it changes is in the top third, and the two are co-visible **by geometry, not by luck of scroll position**.

The arithmetic (from the surveys): usable viewport is ~600–700dp (550 on small Androids). A bridge of ≤250dp + a rail of ~52dp + an ephemeral sheet of ≤220dp = ≤522dp — cause and effect fit simultaneously even on the 550dp worst case (with the bridge's compact-height rule, below). Today, LiveSpectrumEq needs scroll ≤70 *and* ≥195 at once — impossible; Wave modules put 800–900dp between the material chips and the RT60 readout they change. Meter Bridge makes that class of failure structurally unbuildable.

Why this optimizes *learning* specifically: the module's key parameter is one tap (or zero taps — see hero fader) from a large, comfortable control whose result is on screen the entire time; readouts stop being a separate container you scroll to and become part of the picture (the number lives *on* the thing it measures); and the rail itself is a glanceable "console tape" of every current value — the state of the experiment is always legible, which is itself teaching.

---

## 2. ANATOMY

Portrait phone, top to bottom. Fixed things are FIXED; only the lesson body scrolls.

```
┌─────────────────────────────────────────┐
│ ◂ BACK   EQ · MODULE 5        ⓘ ACC    │ ← host chrome (unchanged, ~100–122dp)
│        ◂ PREV              NEXT ▸       │
├─────────────────────────────────────────┤
│ ╔═════════════════════════════════════╗ │
│ ║ RT60 1.42s   α 0.32   ▸ PEAK −6 dB ║ │ ← ReadoutStrip: mono values INSIDE
│ ║ ┌─────────────────────────────────┐ ║ │   the panel glass (~24dp, replaces
│ ║ │                                 │ ║ │   whole ReadoutGrid rows)
│ ║ │        DISPLAY CANVAS           │ ║ │ ← THE BRIDGE (pinned, never scrolls)
│ ║ │   150–250dp · in-display drag   │ ║ │   canvas keeps its own gestures
│ ║ │   (node-drag / source-drag)     │ ║ │   (MultiBand nodes, RoomScene drag)
│ ║ │                                 │ ║ │
│ ║ └─────────────────────────────────┘ ║ │
│ ║ SIMULATED ROOM — NOT A MEASUREMENT  ║ │ ← honesty Badge stays per-display
│ ╚═════════════════════════════════════╝ │
│  ABSORPTION ─────────●────────  α 0.32  │ ← HERO FADER (optional, ~34dp): the
├─────────────────────────────────────────┤   module's ONE key param, zero taps
│ ░ scrolling lesson body ░░░░░░░░░░░░░░ │
│ ░ explain · mistakes · CheckQuestion ░ │ ← dims to 40% while a surface is open
│ ░ captions · notices AT THE BOTTOM   ░ │   (owner standard: notices at bottom)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────────────┤
│ ╭─────────────────────────────────────╮ │
│ │ FADER SHEET            (ephemeral)  │ │ ← bottom-docked surface, ≤220dp;
│ │ ROOM ABSORPTION           α 0.32    │ │   OR an OptionDeck grid here;
│ │ ├──────────●────────────────────┤   │ │   bridge stays fully visible above
│ │ 0.05                       0.95     │ │
│ │ ⟲ RESET                    ⓘ   ✕   │ │ ← reset in-container (owner standard)
│ ╰─────────────────────────────────────╯ │
│ ┌───────┬───────┬───────┬───────┬─────┐ │
│ │ FREQ  │ GAIN  │  Q    │ MAT'L │  ▶  │ │ ← PARAM RAIL (pinned, ~52dp):
│ │ 820Hz │+4.0dB │ 1.4   │ BRICK │PLAY │ │   label over amber mono value —
│ └───────┴───────┴───────┴───────┴─────┘ │   the tools ctrlBar anatomy exactly
└─────────────────────────────────────────┘
```

**Where everything lives:**

- **Display** — in the bridge, pinned outside the ScrollView. Canvases keep their current heights (eq curves 150, digital 184, wave 250, meter 170–300); wave/meter viz already take a height prop, so a `compactHeight` (~150–170) kicks in on short viewports or when a tall surface is open (animated with Reanimated, which is installed and already used by Harmonograph).
- **Readouts** — inside the bridge, two tiers: (a) *ReadoutStrip*, an overlay row of mono `k v` pairs rendered in the panel glass above the canvas — zero Skia work, ships day one, replaces ReadoutGrid's 2–3 46dp rows with one 24dp line; (b) *in-canvas readouts* where the viz earns it, following the existing prior art (VuMeterView `cornerReadouts`, SplDialView center digital, MultiMeter cursor chip). Long-press a readout = help, per the tools idiom.
- **Primary control** — the optional hero fader directly under the bridge (a slim DragSlider row): the one thing the module *teaches by adjusting* costs zero taps. Everything else is one tap away in the rail.
- **Secondary controls** — ParamChips in the rail → FaderSheet.
- **Option collections** — ParamChips in the rail → OptionDeck (see §3).
- **Prose / checks / notices** — the scrolling body, unchanged, with bottom padding for the rail. Notices stay at the very bottom (owner rev 24 standard).

Rail capacity is **one row, max 5 chips**. Modules with more parameters use *group chips* (rhyming with the proven select-then-edit prior art: M11's harmonic buttons → one shared slider; Room Builder's wall chip → one material row). Example — the Foundations Playground's ~800dp of controls (3 sliders + 6 chip rows) becomes: `SOURCE · TONE · SPACE · EQ · ▶PLAY`, each group chip opening a sheet with its 2–3 compact controls.

---

## 3. INTERACTIONS

**Adjusting the primary parameter (e.g. Wave Absorption's α):** it is the hero fader — drag it directly; RoomScene repaints and RT60/α update in the ReadoutStrip above, live, nothing moves. Zero taps, zero scroll. (Where a module has no single hero, the leftmost rail chip is the designated primary.)

**Adjusting a secondary parameter (e.g. EQ band Q):** tap the `Q 1.4` chip → the FaderSheet slides up (Reanimated, ~180ms) docked above the rail; the chip goes active-amber. Drag the sheet's large horizontal slider — this is DragSlider's exact anchored-dx PanResponder math (grant sets value from locationX, moves apply `g.dx` to the anchor; `foundations/bits.tsx:140–163`) on a taller 44dp track, so the whip-to-the-end bug class stays fixed. The value updates in three places at once: big mono in the sheet, the chip in the rail, and the bridge's curve/readout. **Release does NOT close the sheet** — learning is wiggle-and-watch, so the sheet stays until dismissed (backdrop tap, ✕, Android back, or tapping another chip, which *swaps sheet content in place* — no close/reopen flicker). Optional `detents` snap to pedagogically meaningful values (octave centers, unity gain). ⟲ RESET and ⓘ help live in the sheet (reset-in-container standard; help via the existing `useToolHelp`/guided-lesson plumbing).

**An option collection (12 wall materials):** tap `MAT'L BRICK` → the OptionDeck rises: a 3-column flexWrap grid of LabChips (12 chips ≈ 4 rows × ~42dp + header ≈ 200dp — bridge still fully visible). Tapping a material **applies live and keeps the deck open** — the whole point is A/B-ing brick vs. foam while watching RT60 move in the bridge. `photoHint` long-press still opens material photos; plain long-press still opens the control's guided lesson (both must survive, and do, because the deck renders real LabChips). DONE/backdrop closes. *This is a deliberate, principled deviation from the tools' pick-applies-and-closes popup: tool settings are pick-once configuration; lab options are compare-many experiments.* Composite cases (Room Builder: which wall × which material) render as a group sheet — a small selector row above the deck grid.

**In-display gestures are untouched and get better:** MultiBand's node-drag on the graph (`MultiBand.tsx:125–163`) and RoomScene's source/listener drag remain the canvas's own PanResponders under ScrollLockProvider — and because the bridge is pinned, they are now *always reachable* without scrolling. The surface backdrop dims and blocks only the lesson-body region; the bridge stays fully interactive while a sheet is open (drag a node with the Q sheet up — both effects visible).

**Readout updates:** state flows exactly as today (module state → viz props); ReadoutStrip text throttles like the tools' text readouts; anything frame-rate lives in the canvas on the UI thread.

**Never leaves the screen:** the display, its in-glass readouts, the honesty badge, the hero fader, the param rail. **Ephemeral:** fader sheets and option decks. **Scrolls:** prose, mistakes, CheckQuestion, notices. **Android back chain** (per `SplMeterScreen.tsx:784–800`): open surface → closes surface; else → leaves screen.

**One-handed reachability:** every adjustable thing sits in the bottom ~40% (rail ≥44dp touch targets at the screen's bottom edge; sheets dock directly above it). The most-used chip goes rightmost, in the right-thumb arc. Only in-display drags ask the thumb to travel — acceptable for the occasional direct-manipulation gesture, and those are two-handed-friendly by nature.

---

## 4. COMPONENTS

New shared kit in `C:\Users\profe\dev\ape-studio\src\features\lab\paramRail\` (plus small edits to LabShell and one host extraction). Everything composes from existing primitives.

```ts
// paramSpec.ts — the one grammar every lab speaks
export type ParamSpec =
  | { kind: 'fader'; key: string; label: string;          // 'GAIN'
      value: number;                                       // 0..1 (DragSlider convention)
      format: (v: number) => string;                       // '+4.0 dB' — chip + sheet + strip
      onChange: (v: number) => void;
      detents?: number[];                                  // snap points (octave centers…)
      tint?: string; levelTint?: boolean;                  // MIDI ramp for LEVEL params
      onReset?: () => void; helpKey?: string;
      hero?: boolean }                                     // render as the always-on slim fader
  | { kind: 'options'; key: string; label: string;
      selectedId: string;
      options: { id: string; label: string; photoHint?: boolean }[];
      onSelect: (id: string) => void;
      columns?: 2 | 3; helpKey?: string }
  | { kind: 'group'; key: string; label: string;
      valueSummary: string;                                // shown on the chip
      params: ParamSpec[] }                                // 2–3 compact controls per sheet
  | { kind: 'action'; key: string; label: string;
      onPress: () => void; active?: boolean; tint?: string }; // PLAY, AUDITION, RESET ALL
```

```ts
// StagePanel.tsx — the bridge
export function StagePanel(props: {
  height: number; compactHeight?: number;                  // Reanimated height when a surface is open / short viewport
  readouts?: { k: string; v: string; tint?: string; helpKey?: string }[];  // ReadoutStrip in the glass
  badge?: ReactNode;                                       // honesty Badge (digital/bits Badge)
  onGuide?: () => void;                                    // DisplayGuideButton slot
  children: ReactNode;                                     // the Skia/SVG canvas, gestures intact
});
```

```ts
// ParamRail.tsx + ControlSurfaceLayer.tsx — rail + ephemeral surfaces
export function ParamRail(props: { params: ParamSpec[]; activeKey: string | null;
  onActivate: (key: string | null) => void });             // chips: tools ctrlBar anatomy, long-press = guided lesson

export function ControlSurfaceLayer(props: {              // in-tree absolute overlay — NEVER a native Modal
  active: ParamSpec | null; onClose: () => void;           // (de-modalized 2026-08-19 rule)
  bottomInset: number });                                  // renders FaderSheet | OptionDeck | GroupSheet
```

**How existing pieces map in:**

| Existing | Role in Meter Bridge |
|---|---|
| `DragSlider` (bits.tsx:93, 30 files) | Its anchored-dx PanResponder is the FaderSheet engine (44dp track variant) and renders the hero fader as-is. API untouched — un-migrated labs unaffected. |
| `LabChip` (LabShell.tsx:49, 23 files) | The OptionDeck's rows, verbatim — keeps `photoHint` + long-press lessons for free. |
| `PanelCard` / panel tokens | StagePanel's shell (#131316, r12, p12). |
| SplMeter popup skin (:1996–2040, PopupOpt :259, styles :2569–2628) | Extracted to shared `surfaceStyles` (backdrop rgba(0,0,0,.72), card #141418 / border #2b2b33 / r14, amber-selected opts) — sheets/decks use it; tools screens can converge on it later, retiring their screen-local copies. |
| `ScrollLockProvider` / `InteractionZone` | Unchanged — still governs in-display drags. Sheets live *outside* the ScrollView, so they need no lock at all (one gesture-conflict class deleted). |
| `ReadoutGrid` (digital/bits.tsx:41) | Its `{k,v,helpKey}` shape *is* the ReadoutStrip's props — migration is moving the array, not rewriting it. Stays available for un-migrated labs. |
| `WaveLayout` (waveLayout.tsx:19) | Rewritten once to emit `bridge` + `railParams` instead of stacked slots — by its own design comment, this converts all 16 wave modules in one file. |
| 5 module hosts (eq/digital/meter/gain/wave `*ModuleScreen.tsx`) | Copy-pasted chrome extracted into one `LabModuleHost` accepting `{ bridge, railParams, children }` — touches 5 files, unlocks every module lab. |
| `LabShell` (11 labs) | Additive optional props `bridge` + `railParams`; omitted = exactly today's behavior. |
| `useToolHelp` / GuidedLessonSheet / DisplayGuideButton | Wired into chip long-press, sheet ⓘ, readout long-press — the lesson system survives intact (hard requirement). |
| `EqAuditionBar`, `EngineGate` | Dock as `action` chips / render at zero height as today. |

---

## 5. THEME

The metaphor is native to the app's rack-gear language: labs finally look like the instrument the tools already are.

- **The bridge** reads as recessed glass in the rack — the ToolsHub cutout language (metallic bezel, dark seam, display cap that sinks on press) applied to the lab display, with readouts as backlit mono legends *inside* the glass, exactly like VuMeterView's corner readouts and SplDialView's center digital.
- **The rail** is a channel strip: the tools ctrlBar value-button anatomy verbatim — bg #131316, border #26262c, r10, Oswald label over amber mono value, `"LABEL: value. Tap to change."` a11y. One change: **labels render at 12px** (MIN_FONT), with sanctioned abbreviations (FREQ, MAT'L, ABSORB) — the tools' 9.5px is noted as legacy precedent, not copied into new components.
- **The sheets** wear the tools popup card skin (#141418, #2b2b33, r14) docked to the bottom with a slim grab notch — the same object as the VU-fullscreen chooser, in a new position.
- **Color grammar:** amber = adjustable/active (active chip = amber border + #1d1708, the existing token pair); green = go (PLAY chips); level-type faders use `levelTint` so the MIDI blue→red ramp keeps teaching amplitude everywhere; honesty badges keep their muted treatment. Haptic + sink on chip press, per ToolsHub tiles.
- **Rhyme summary vs. owner's 2026-08-19 tool standards:** value-button→popup grammar — identical; notices at bottom — kept; reset in-container — in-sheet ⟲; landscape fullscreen — the rail *is* the LEFT control column rotated (FS_CTRL_W=108), so a future lab fullscreen inherits the tools layout with the same components (out of v1 scope).

---

## 6. MIGRATION

The kit is purely additive: an un-migrated lab renders exactly as today. A lab adopts in three mechanical moves — (1) lift its display + readouts into a StagePanel, (2) express its controls as `ParamSpec[]`, (3) delete the freed control/readout sections from its scroll body. Checks, prose, lessons, honesty copy: untouched.

**Conversion order:**

1. **Harmonograph** (pilot, smallest surface, worst single-screen ratio). Survey 3 calls it the worst offender — figure *always* off-screen while adjusting — yet its inventory is tiny: 2 DragSliders + 4 chip rows in one LabShell file, and it already uses Reanimated. Proves StagePanel + rail + FaderSheet + OptionDeck end-to-end in one contained, visually spectacular lab; also lands the LabShell `bridge/railParams` props for the other 10 shell labs.
2. **Wave Physics via `waveLayout.tsx`** (maximum leverage per file). One rewrite converts all 16 modules — the file's own comment promises exactly this single-place reorder. Exercises the hard cases: 9-material OptionDeck with photoHints, α/RT60 into the bridge strip, RoomScene in-display drag coexisting with open sheets, SceneHero compact heights. Room Builder (already bypasses WaveLayout) waits for the group-sheet pattern to settle.
3. **EQ host + LiveSpectrumEq** (worst measured offender + host extraction). LiveSpectrumEq is the one module where co-visibility is geometrically impossible today on 550dp viewports, and its guided-challenge cards sit 700–1000px from the controls they direct — with a pinned bridge, challenge text scrolls while the bars stay visible. Doing it via the `LabModuleHost` extraction means digital's 8, meter's 11, and gain's 8 modules become ParamSpec-translation chores afterward, not layout projects.

**Stays untouched:** Cable wizard, Calc (both audited as non-sufferers), TubeReference browser, Tube pager (already a donor pattern), gain's prose modules 1–5, CheckQuestion, the guided-lesson system, honesty badges/ratified copy, DragSlider/LabChip public APIs, all backend.

---

## 7. RISKS & COSTS

- **Gesture conflicts** — *Low, net-negative.* Sheets sit outside the ScrollView: no scroll-lock needed, deleting one conflict class. In-display drags keep their proven capture-claim PanResponders. New edge: the surface backdrop must cover only the body region so the bridge stays interactive — a layout constraint, not a responder negotiation. GraphicBoard's horizontal scroll keeps its existing horizontal-handoff rule (`eqBits.tsx:72`).
- **Skia/perf** — *Medium.* The pinned canvas renders whenever it renders today — no new cost. ReadoutStrip is RN Text over the panel (throttled like tools text readouts), not per-frame Skia. In-canvas readouts (phase 2) follow the shipped SVG animatedProps pattern (PeakAvgMeterView). Bridge height animation via Reanimated on the container; viz get a height prop they mostly already accept.
- **Fabric constraints** — *Medium, mitigated.* LayoutAnimation is unreliable on Fabric → all surface enter/exit and bridge resizing uses Reanimated 4.5.1 (installed, already used by Harmonograph). In-tree overlays (never native Modals) respect the de-modalized rule that fixed the iOS black-screen.
- **a11y** — *Medium work, clear spec.* Chips: `"LABEL: value. Tap to change. Long-press for its lesson."` Sheets: focus moves in on open, restores on close; Android back chain per SplMeter precedent; all fonts ≥12; all targets ≥44dp. Open surfaces announce via `accessibilityLiveRegion` on the big value.
- **Small screens (550dp)** — compact-bridge rule (canvas → `compactHeight` while a surface is open) keeps bridge+sheet+rail ≤ ~462dp. The lesson body may be fully covered while a sheet is open — acceptable; it's dimmed context, not the task.
- **Discoverability** — chips must read as controls, not readouts. Mitigations: press sink + haptic (ToolsHub), a one-time shimmer on a module's first open, and the guided-lesson system already pointing at controls.

**Effort (S ≈ a focused session, M ≈ 2–3, L ≈ a week of sessions):**

| Piece | Size |
|---|---|
| `surfaceStyles` extraction from SplMeter popup | S |
| ParamChip + ParamRail | S |
| ControlSurfaceLayer (state, backdrop, back-chain, Reanimated) | M |
| FaderSheet (DragSlider engine, detents, reset, help) | M |
| OptionDeck + group sheets | S–M |
| StagePanel + ReadoutStrip | M |
| LabShell `bridge/railParams` props | S |
| Harmonograph pilot | S–M |
| `LabModuleHost` extraction (5 hosts) | M |
| Wave conversion via waveLayout.tsx | M |
| EQ LiveSpectrumEq + remaining EQ modules | M |
| In-canvas readouts per viz family (deferrable — strip works without) | M each |
| digital/meter/gain module translations (after host lands) | M total |

Total to "system proven + three flagship labs converted": roughly **3 M-blocks of foundation + 3 M-blocks of conversion**. No new native modules anywhere in scope.

---

## 8. TRADEOFFS

- **One tap of distance for non-hero parameters.** A slider you could once (sometimes) see is now behind a chip. Bought back three ways: the hero fader keeps the *teaching* parameter at zero taps; the sheet's fader is bigger and more precise than the 49dp inline rows; and the inline slider you "saved" today was frequently off-screen from its effect anyway — a visible chip beats an invisible slider.
- **Prose loses prominence.** The lesson body drops below a pinned bridge; explanatory text is read by scrolling, not passed en route to controls. Accepted deliberately — the owner's hierarchy is *learning by adjusting*; the guided-lesson system remains the narrative channel, and checks still gate progress.
- **No two faders visible at once** (outside group sheets). Comparing two continuous params means chip-switching. Group sheets (2–3 compact controls) cover the common pairs; a future XY-pad surface covers true 2-D params (PAN/ZOOM).
- **A sanctioned deviation from the tools popup:** decks stay open on select instead of pick-closes. One grammar, two verbs — *configure* (tools: pick and done) vs. *experiment* (labs: compare and watch). Documented in the kit so it reads as intent, not drift.
- **Pinned real estate is spent forever.** ~300dp (bridge + rail) is committed on every migrated module, shrinking the resting reading window to ~250–350dp. That is the thesis: this app teaches through the display, so the display earns permanent residency.
- **Landscape fullscreen deferred.** The rail is designed to rotate into the tools' LEFT control column, but v1 ships portrait-only.
- **Big-board edge case:** GraphicTruth's 10-fader in-panel board already achieves co-visibility and would fight a bottom-sheet idiom — it keeps its in-bridge board (the bridge simply pins it), showing the system bends rather than breaks for direct-manipulation displays.

---

### Appendix (optional, explicitly flagged): native additions NOT in scope
`react-native-gesture-handler` would give the sheets grab-notch drag-to-dismiss with velocity physics. It is a native module → new dev build → owner-gated decision. Nothing in this proposal depends on it; PanResponder + Reanimated cover v1 fully.