# StageDeck — Fixed Stage, Console Layers

## SUMMARY
StageDeck turns every lab module into a hardware unit: a recessed glass STAGE (display + readouts drawn inside the glass) is pinned to the top and never moves, and all controls live below in fixed-height, horizontally paged CONTROL DECKS selected by a console-style layer-key rail — the exact mental model of a digital mixer's fader layers, which is on-theme for a pro-audio academy. Nothing on the operating surface ever scrolls vertically, so cause→effect co-visibility is guaranteed structurally rather than re-litigated per lab layout. Option collections (wall materials, mic patterns, HPF slopes) become 3-column grid-picker decks or tools-standard value-buttons that open the SplMeter-style in-tree popup; readouts reuse the ReadoutGrid item shape but render as in-glass corner cells (VuMeterView cornerReadouts prior art), with a large "active value" ghost in the glass while any control is being dragged (the onActive plumbing already exists). Long-form prose obeys one law — reading may scroll, operating may not — so LEARN mode, the guided-lesson sheets, and a new READ overlay absorb all ratified copy verbatim while EXPLORE stays zero-scroll. The kit is ~9 shared components, most of them extractions of proven code (SplMeter popup, InteractionZone capture-lock, ReadoutGrid cells), and DragSlider/LabChip/CheckQuestion survive unchanged. Migration is per-lab opt-in: EQ modules pilot the hard cases, Wave Physics converts 16 modules through the single-file WaveLayout adapter, and the Foundations Playground kills the worst single screen; Cable, Calc, and Tube Reference stay untouched. The honest costs: only one deck of controls is visible at a time, deck curation is real per-module design work, and the 550dp Android floor imposes a permanent editorial budget.

# StageDeck — Fixed Stage, Console Layers

A zero-scroll global lab architecture for APE Studio. Everything below is grounded in the four surveys and spot-verified against `C:\Users\profe\dev\ape-studio\src\screens\lab\LabShell.tsx` and `C:\Users\profe\dev\ape-studio\src\screens\lab\wave\modules\waveLayout.tsx`.

---

## 1. CONCEPT

**Every lab module is a piece of rack hardware: one fixed glass display (the STAGE, with its readouts printed inside the glass) pinned to the top of the screen, and one fixed-height bank of controls below it that PAGES sideways through labeled CONTROL DECKS — exactly like the fader-layer keys on a digital mixing console. The operating surface never scrolls vertically; only reading surfaces (LEARN, lesson sheets, popups) may.**

Why this optimizes learning: the owner's core complaint — "adjust a parameter and the result scrolls out of view" — is a *layout-order* bug that today must be re-fixed in every module (Survey 2: wave modules run 1500–2600dp, 2.2–3.5 viewports, with materials chips a full viewport below the RT60 readout they change; Survey 1: LiveSpectrumEq physically cannot show chips and bars together on a 550dp phone). StageDeck makes co-visibility a *structural invariant*: because the display and its readouts are outside the paging area and the paging area never scrolls, **any control the user touches, in any deck, is by construction on screen at the same time as its effect**. The "key thing the module teaches" gets Deck 1, so the primary cause→effect loop is the zero-effort default. And the console-layer metaphor is itself curriculum: students of a pro-audio academy will run real desks whose control surfaces page through layers — the labs teach the idiom of the gear they're training for.

---

## 2. ANATOMY

### 2.1 Vertical budget math (375×812 iPhone, the design target)

Fixed host chrome (Survey 1, measured on EqModuleScreen): `insets.top ~47 + header (back+title+AccuracyNote) ~44 + PREV/NEXT nav ~21 ≈ 112–122px`, plus bottom inset ~34 → **usable ≈ 656px** (survey range 632–690; I budget to the task's conservative 632). The Android floor (732px devices) is **~550px**.

| Zone | 812 phone (632 budget) | 550 floor | Notes |
|---|---|---|---|
| **STAGE** (bezel + glass viz + in-glass readouts + in-glass honesty badge) | **316** | **250** | Viz canvas ~280 / ~218. Every current display fits or has a height prop: eq curves 150–164, digital 184, meter 170–300 (VU 270→ prop to 220 at floor), wave RoomScene 250, harmonograph 320→280 (param). Readouts cost **zero rows** — they're overlays. |
| **DECK RAIL** (layer keys) | **36** | **36** | 3–5 labeled tabs, Oswald 12 caps, amber underline on active. |
| **DECK VIEWPORT** (one deck visible, neighbor peeks) | **232** | **208** | Fixed height; the whole point is that its contents are curated to fit, never scrolled. |
| **NOTICE TICKER** (owner standard: notices at bottom) | **24** | **24** (folds into in-glass badge < 520) | One 12px line; tap opens the full ratified notice as a popup. |
| Inter-zone gaps (3×8) | **24** | **32** | |
| **Total** | **632** ✓ | **550** ✓ | |

**Deck capacity check at 232px:** 3 × DragSlider (~52 each, Survey 3) = 156 + one caption line + padding ✓. GridPicker 3 cols × 4 rows of 44dp cells + gaps ≈ 200 ✓ (12 wall materials fit one deck). CheckDeck: 2-line prompt (32) + 2 rows of answer chips (~96) + CHECK button (40) ≈ 168 ✓. At the 208 floor: 3 sliders still fit; grids drop to 40dp rows (still ≥ the current 34dp LabChip, and we keep 44 wherever 4 rows aren't needed).

### 2.2 Wireframe (portrait phone, a Wave "Absorption" module in StageDeck)

```
┌───────────────────────────────────────┐  375 × 812
│ ◀  WAVE PHYSICS · ABSORPTION    ⓘACC │  host header ~44  (unchanged)
│        ◀ PREV   7 / 16   NEXT ▶       │  module nav ~21   (unchanged)
├───────────────────────────────────────┤
│ ╔═══════════════════════════════════╗ │ ┐
│ ║ RT60 0.48s ▸            α̅  0.72  ║ │ │  in-glass readout cells (tl/tr)
│ ║                                   ║ │ │
│ ║          ROOM SCENE VIZ           ║ │ │  STAGE 316
│ ║      (source/listener drag        ║ │ │  recessed glass in rack bezel;
│ ║        stays in-canvas)           ║ │ │  display gestures unchanged
│ ║            ┌─────────┐            ║ │ │
│ ║            │ 0.35 α  │◀ active-   ║ │ │  ghost value while dragging
│ ║            └─────────┘  readout   ║ │ │  (onDragActive plumbing)
│ ║ ▸SIMULATED             ⓘ DISPLAY ║ │ │  honesty badge + guide in-glass
│ ╚═══════════════════════════════════╝ │ ┘
│ ┌───────────────────────────────────┐ │
│ │  MAIN   ROOM   MATERIALS   CHECK  │ │  DECK RAIL 36 — layer keys,
│ │  ▔▔▔▔                             │ │  active = amber underline
│ ├───────────────────────────────────┤▌│ ┐
│ │ ABSORB MIX        ──●────────  .35│▌│ │
│ │ ROOM SIZE         ─────●───── 240m│▌│ │  DECK 232 — one deck visible;
│ │ SOURCE LEVEL      ────────●──  86 │▌│ │  ▌= next deck peeking 12dp;
│ │                                   │▌│ │  swipe or tap a layer key
│ │ · more absorption, faster decay · │▌│ │  one-line deck caption
│ └───────────────────────────────────┘▌│ ┘
│  SIM values · long-press any ⓘ = help │  NOTICE TICKER 24
└───────────────────────────────────────┘
```

The MATERIALS deck (same viewport, reached by one swipe or one tap):

```
├───────────────────────────────────────┤
│ │  MAIN   ROOM   MATERIALS   CHECK  │ │
│ │                ▔▔▔▔▔▔▔▔▔          │ │
│ ├───────────────────────────────────┤ │
│ │ [CONCRETE] [BRICK  ] [GLASS  ]    │ │  GridPicker: 3 cols,
│ │ [DRYWALL ] [WOOD   ] [CARPET📷]   │ │  44dp cells, LabChip visuals,
│ │ [CURTAIN ] [FOAM 📷] [FIBERGL📷]  │ │  📷 = photoHint long-press
│ │ [PEOPLE  ] [ …     ] [ …     ]    │ │  (materialPhotos.ts preserved)
│ └───────────────────────────────────┘ │
```

Where things live, definitively:
- **Display** → STAGE glass. In-display gestures (MultiBand node-drag, RoomScene source/listener drag, Binaural stage drag) stay exactly where they are.
- **Readouts** → in-glass corner/edge cells (never a separate container row again). Prior art: `vizMeters.tsx` VuMeterView `cornerReadouts` (:758–771, :1216–1241), SplDialView center readout, Spl3dGauge `centerText`.
- **Primary control** → Deck 1 ("MAIN"), top slider — or the on-stage gesture when the parameter is spatial.
- **Secondary controls** → subsequent decks, grouped by teaching intent (one deck = one lesson beat).
- **Option collections** → a GridPicker deck (≤12 options), or a ValueButton in a deck opening the tools-standard OptionPopup (>12 options, or infrequent settings).
- **Checks** → the last deck ("CHECK"), verdict in a popup card.
- **Prose/captions** → one 12px caption line per deck; everything longer goes to LEARN / lesson sheets / the READ overlay (§3.5).
- **Notices** → bottom ticker (owner's notices-at-bottom standard, Survey 4 §5); AccuracyNote stays in the header as today.

---

## 3. INTERACTIONS

### 3.1 Primary parameter
Deck 1 is selected on entry. The teaching parameter's DragSlider (unchanged component, `foundations/bits.tsx:93`) sits at the top of it. The user drags; DragSlider's existing capture-phase scroll-lock (owner's 2026-07-29/30 systemic fix, `LabShell.tsx:182–217`) freezes the deck pager for the gesture's duration; the STAGE — which is *outside* the pager and never scrolls — animates live. While the finger is down, `onDragActive`/`onActive` (already reported by DragSlider and VerticalFader, `eqBits.tsx:34,105` — today consumed only by GraphicTruth) drives the STAGE's **active-readout ghost**: a large mono value drawn in the glass near the action (rhymes with MultiMeter's in-plot cursor chip, `MultiMeterScreen.tsx:1159–1229`). This replaces GraphicTruth's activeBar, which today sits 313px from the faders it narrates. Where the parameter is spatial, the primary gesture is *on the stage itself* — the MultiBand node-drag pattern (`MultiBand.tsx:125–163`) generalized.

### 3.2 Secondary parameter
Tap its layer key on the rail (or swipe the deck sideways — both always work). The deck slides; the STAGE does not move a pixel. Adjust; same lock, same ghost readout. **Deck switching is a tap or one thumb-swipe — strictly cheaper than today's 400–900px scroll hunts, and it never costs display visibility.**

### 3.3 Option collection (e.g. 12 wall materials)
- **≤12 options that ARE the lesson** (Absorption's materials, Reflection's surfaces): a GridPicker deck. Tap selects (amber-active LabChip visuals); the α/RT60 cells in the glass react instantly. Long-press keeps its two current meanings: guided-lesson help everywhere, and photos on `photoHint` chips (foam/fiberglass) — both non-negotiable survivals.
- **Options that CONFIGURE rather than teach** (HPF slope, view mode, meter range) or collections >12: a **ValueButton** (label over current amber value, tools anatomy from `SplMeterScreen.tsx:1566–1596`) inside a deck → tap opens the **OptionPopup** (in-tree absolute overlay, backdrop `rgba(0,0,0,.72)`, PopupOpt grid, pick-applies-and-closes in one tap, in-popup RESET — `SplMeterScreen.tsx:1996–2040, :259–272`). This is the owner's spitballed "popup fader" made literal with his own 2026-08-19 tools standard.
- **Select-then-edit compression** (proven in M11 harmonics and Room Builder walls, Survey 2): Room Builder's 4 walls become 4 ValueButtons ("NORTH: BRICK") in the ROOM deck, each opening the material popup — 10 materials × 4 walls collapses from ~6 chip rows into one 52px row.

### 3.4 Readouts
In-glass cells reuse the ReadoutGrid item contract `{k, v, helpKey}` (`digital/bits.tsx:41`) so every module's existing readout data maps 1:1. Text updates throttled exactly as the tools do (Survey 4 §6); values level-colored via `levelColor.ts`. Long-press a cell = its help (tools convention). **What never leaves the screen: the stage, its readouts, the honesty badge, the rail, the active deck, and the ticker.**

### 3.5 Captions, checks, and long-form LEARN content
One law: **reading scrolls, operating doesn't.**
- Each deck gets one optional 12px caption line.
- **CheckDeck**: prompt (≤2 lines) + answer chips + CHECK button fit the 232 viewport (§2.1). "Set-the-display-to-X" checks are *better* here than today — the user manipulates other decks while the prompt persists one tap away and the stage stays visible. Verdict + explanation render in a **VerdictPopup** (tools popup card; long explanations scroll *inside* the card — allowed, it's reading). Today's verdicts land below the fold even in the best module (FindFrequency, Survey 1).
- **Long-form prose** (explain/mistakes/ratified copy): in LabShell labs it lives where it already does — the LEARN tab. In module-host labs (eq/wave/digital/meter/gain have no LabShell) the rail's last item is **READ ▸**, opening a full-height in-tree overlay sheet that scrolls the module's complete prose verbatim. Nothing is cut — ratified copy is *rehoused*, not edited. Guided lessons (GuidedLessonSheet, DisplayGuideButton, control long-press — used by 23–29 files) carry the contextual layer unchanged.

---

## 4. COMPONENTS

New shared kit under `src/screens/lab/stage/` (names final-ish, props sketched):

```ts
// useStageBudget.ts — the zone math, one place
function useStageBudget(): { stageH: number; railH: 36; deckH: number; tickerH: number }
// deckH = usable < 600 ? 208 : 232; stageH = usable - deckH - rail - ticker - gaps, clamp [220, 340]

// LabStage.tsx — the fixed glass
type StageReadout = { k: string; v: string; pos: 'tl'|'tr'|'bl'|'br'; tint?: string; helpKey?: string };
type LabStageProps = {
  height: number;                       // from useStageBudget
  children: (s: { width: number; height: number }) => ReactNode;  // the viz, sized to the glass
  readouts?: StageReadout[];            // overlay cells, pointerEvents="none"
  activeReadout?: { label: string; value: string; tint?: string } | null;  // drag ghost
  badge?: string;                       // honesty badge, in-glass bottom-left (per-display, non-negotiable)
  onGuide?: () => void;                 // ⓘ WHAT THE DISPLAY SHOWS (DisplayGuideButton)
};

// DeckPager.tsx (+ internal DeckRail)
type DeckSpec = {
  id: string;
  label: string;                        // layer-key text, Oswald 12 caps
  render: (d: { width: number; height: number }) => ReactNode;
  caption?: string;                     // the one 12px line
  badge?: 'check-done' | number;
};
type DeckPagerProps = { decks: DeckSpec[]; height: number; initial?: string; onDeckChange?: (id: string) => void };
// horizontal ScrollView, snapToInterval = width-24 (12dp neighbor peek), scrollEnabled = !locked

// GridPicker.tsx — LabChip visuals in a picker grid
type GridPickerProps<T extends string> = {
  options: { id: T; label: string; photoHint?: boolean; tint?: string }[];
  value: T; onChange: (id: T) => void;
  columns?: 2 | 3 | 4;                  // default 3; cells ≥44dp tall
  onLongPress?: (id: T) => void;        // help / photos
};

// ValueButton.tsx + OptionPopup.tsx — EXTRACTED from SplMeterScreen (today screen-local)
type ValueButtonProps = { label: string; value: string; onPress: () => void; tint?: string };
type OptionPopupProps = {
  visible: boolean; title: string; onClose: () => void;
  options: { id: string; label: string; selected?: boolean }[];
  onPick: (id: string) => void;         // applies + closes, one tap
  onReset?: () => void;                 // reset lives in the popup (owner standard)
};                                       // IN-TREE absolute overlay — never a native Modal (de-modalized 2026-08-19)

// StageLayout.tsx — the module contract (WaveLayout's successor)
type StageModuleSpec = {
  stage: LabStageProps['children'];
  readouts: StageReadout[];
  activeReadout?: LabStageProps['activeReadout'];
  badge?: string;
  decks: DeckSpec[];                    // CHECK deck auto-appended from `check`
  check?: CheckSpecCompat;              // existing CheckQuestion spec shape, rehoused
  notice?: string;                      // bottom ticker
  read?: ReactNode;                     // full prose for the READ overlay (verbatim ratified copy)
};

// CheckDeck.tsx + VerdictPopup.tsx — rehouses CheckQuestion's spec, not its 260–340dp card
// ReadSheet.tsx — full-height in-tree overlay, ScrollView inside (reading may scroll)
```

**One modification to existing code:** the ScrollLock context (`LabShell.tsx:165`) currently carries only the *setter*; DeckPager also needs to *read* the locked state. Extend the context value to `{ locked, setLocked }` (or add a sibling state context) — small, backward-compatible, and every drag primitive (DragSlider, VerticalFader, RoomSceneView, InteractionZone) keeps working with zero changes because they only call the setter.

**How existing pieces map — mostly unchanged:**
- **DragSlider** (30 files): untouched; it just renders inside decks. Its `onDragActive` finally gets a universal consumer (the stage ghost).
- **VerticalFader / GraphicBoard**: GraphicTruth's board (123dp faders) moves *into the stage glass* — it already lives in-panel today, proving the pattern; vertical drags don't fight a horizontal pager.
- **LabChip** (23 files): becomes GridPicker's cell; standalone uses continue.
- **ReadoutGrid**: its `{k,v,helpKey}` items feed StageReadout cells directly; the component itself remains for LEARN surfaces.
- **PanelCard**: supplies the stage bezel + deck body styling (tokens #131316 / #26262c).
- **ScrollLockProvider / InteractionZone**: the gesture backbone, reused as-is (plus the read extension above).
- **WaveLayout** (`waveLayout.tsx:19`): rewritten as a thin adapter emitting a StageModuleSpec — its named slots (readouts/layers/display/guide/controls/mistakes/check) already partition content exactly along StageDeck's seams. This converts all 16 wave modules in one file, precisely the "single-place change" its own comment promises.
- **CheckQuestion** (29 files): spec format preserved; only the rendering rehoused in converted labs.
- **Tools popup idiom**: extracted, not reinvented — labs and tools converge on one shared component (RTA, the least-migrated tool, becomes a future beneficiary).

---

## 5. THEME

StageDeck *is* the app's gear language, extended one metaphor deeper:

- **The stage** is a recessed glass display in a rack blank — the ToolsHub cutout anatomy (`ToolsHubScreen.tsx:206–284`): metallic bezel gradient, dark seam, glass that sits 1px sunken. Readouts printed inside the glass read as a hardware unit's LCD — MAX/RANGE in the VU glass corners already look exactly like this.
- **The deck rail** is a row of console **layer keys** — the soft-key page buttons under every digital mixer's display. Active key: amber underline + amber text; inactive: textSub; press: the ToolsHub sink + haptic. A student who internalizes "select a layer, the bank re-purposes" has learned a real console skill.
- **Value-buttons and popups** are pixel-for-pixel the tools standard (Oswald label over mono amber value; centered card, #141418, PopupOpt chips, amber-border selected) — one exception: labels render at MIN_FONT 12 rather than the tools' 9.5px, per the labs mandate (noting the survey's finding that 9px precedents already violate it; labs won't add more).
- **Amplitude/tint language**: `levelColor.ts` ramp colors readouts and slider tints — the app-wide teaching language, uninterrupted.
- **Owner standards honored explicitly**: notices at the bottom (ticker), reset in-container (in-popup RESET; peak-hold-style ⟲ on stage cells where relevant), AccuracyNote in the header, no fake data (readout cells only ever show real engine values; EngineGate still renders null at zero height cost), honesty badge *inside* the glass so it can never scroll away from the display it qualifies.
- **Android back order** follows the tools chain (`SplMeterScreen.tsx:784–800`): popup → READ overlay → screen.

---

## 6. MIGRATION

StageLayout is opt-in per module screen; unconverted labs keep today's scroll path indefinitely. Shared kit first, then labs one at a time.

**Phase 0 — the kit** (no lab changes): useStageBudget, LabStage, DeckPager, GridPicker, ValueButton/OptionPopup extraction, StageLayout, CheckDeck/VerdictPopup, ReadSheet, ScrollLock read-extension.

**Lab 1 — EQ modules (`EqModuleScreen`, 7 modules).** The pilot, because it's the hardest test with the most prior art already in place: MultiBand's on-stage node drag, GraphicTruth's in-panel fader board, the onActive plumbing, live-engine audition, and the single worst inversion in the estate (LiveSpectrumEq's controls-above-display, provably unfixable by reordering on 550dp phones). Seven structurally diverse modules exercise every deck type. It's member-gated content, so pilot iteration happens off the free funnel.

**Lab 2 — Wave Physics (16 modules).** The tonnage win: the WaveLayout→StageLayout adapter converts 15 modules in one file; Room Builder (the 3.5-viewport worst offender, which bypasses WaveLayout at `modWaveB.tsx:1222`) gets a bespoke pass — wall ValueButtons → material popup, sources as a select-then-edit deck. Wave Physics is one of the three FREE labs (2026-08-23 split), so this converts a storefront lab immediately after the pilot proves the system.

**Lab 3 — Foundations Playground.** The worst single screen (~1800–1900dp; bottom SOURCE chips = display entirely gone) in another free storefront lab, and the heaviest GridPicker/popup workout (3 sliders + 6 chip rows). The 14 course steps stay as-is — they already fit reasonably and have their own mitigations (TEXT collapse, nav dots).

**Then, in rough order:** meter modules (11 — hero-panel structure maps almost mechanically), Harmonograph (worst one-screen LabShell lab: figure 320 + 350dp of controls below), digital (8), Mic Principles (its 10 section chips become… a deck rail — the sections are already decks in spirit; the 130–170dp chip header repeated per section disappears), gain (Master meter pins as a stage readout while the device chain pages — fixing the system-level cause→effect break Survey 3 identified), Binaural.

**Stays untouched:** Cable Lab (a stepped reading wizard — no co-visibility problem), Calc (keyboard-pinned form, works), Tube Reference (a browser), the Tube lab (already a section pager — cite it as the in-house donor of the paging idea), all guided-lesson infrastructure, CheckQuestion specs, LEARN prose surfaces, and the five module hosts' header/nav chrome (a shared-host extraction across the 5 copy-pasted hosts is a worthwhile *separate* cleanup, not a prerequisite).

---

## 7. RISKS & COSTS

- **Gesture conflicts (the big one): horizontal deck paging vs horizontal DragSliders.** Mitigated by the mechanism the codebase already trusts: DragSlider claims at touch-down and sets the scroll lock via context (capture-phase, `LabShell.tsx:188–217`); DeckPager reads the extended lock state and sets `scrollEnabled=false` — identical to how the vertical ScrollViews behave today, rotated 90°. Residual risk: a swipe *beginning* on deck padding while intending a slider — low, but test flick-heavy use on Android early in the pilot. VerticalFaders are orthogonal to the pager axis: no conflict. All PanResponder — RNGH stays uninstalled.
- **Skia/perf.** Net positive: the stage mounts once and never remounts on deck changes (today, scrolling Skia canvases re-rasterize on every frame of scroll). Decks are light Views; lazy-mount non-adjacent decks. In-glass readouts are `pointerEvents="none"` RN Text overlays — the proven-safe pattern from the SPL/VU restructure ("pointerEvents-none over Skia"). Text throttling as in the tools.
- **Fabric/New Arch.** Nothing new: in-tree overlays instead of native Modals (the de-modalized lesson — modal-over-modal went black on iOS), absolute positioning over Skia proven, ScrollView `pagingEnabled`/`snapToInterval` is core RN. No new native modules.
- **A11y.** Paged content must not be swipe-only: rail keys are real `accessibilityRole="tab"` buttons (they are the primary path, swipe is the shortcut); deck changes announced; stage readout cells get accessibilityLabels; GridPicker cells ≥44dp (an *improvement* on today's 34dp LabChips); MIN_FONT 12 enforced (costs some density vs the tools' 9.5px labels — accepted).
- **Short-phone floor.** Below ~520 usable: ticker folds into the in-glass badge, rail drops to 32, stage clamps at 220. The 208dp deck is a hard editorial budget — some modules will have to merge or split decks. This is a feature (it forces curation) and a cost (see §8).
- **Effort (honest):** Kit — useStageBudget **S**, LabStage **M**, DeckPager+rail **M**, GridPicker **S**, ValueButton/OptionPopup extraction **S–M**, StageLayout **S**, CheckDeck+VerdictPopup **M**, ReadSheet **S**, ScrollLock extension **S** → kit ≈ one focused build week. Conversions — EQ **L** (7 bespoke modules, the pilot always costs most), Wave adapter **M** + Room Builder **M**, Playground **L**, meter **M**, remaining labs **S–M** each. Full estate: several weeks, safely incremental, shippable after any lab.
- **Optional appendix — explicitly flagged native-build options, NOT required:** `react-native-pager-view` (native paging feel) or react-native-gesture-handler (simultaneous-gesture arbitration). Both mean a new dev build; the ScrollView + scroll-lock design above needs neither.

---

## 8. TRADEOFFS

1. **Only one deck of controls is visible at a time.** A scroll surface shows breadth; a deck shows depth. A learner can't glance at the whole control estate. Mitigations — labeled rail, neighbor peek — reduce but don't remove it. The bet: for *learning*, one adjustable thing with its effect visible beats six visible things with the effect off-screen.
2. **Deck curation is real design work per module.** Grouping controls into ≤5 decks of ≤232dp is editorial judgment the old "stack everything" layout never demanded. Wave's adapter softens this for 16 modules; everywhere else it's honest per-module effort. The system gives you the frame, not the taste.
3. **Co-taught parameters must share a deck.** Two controls in different decks can't be worked in one continuous gesture flow. Modules teaching an interaction (e.g. frequency *and* Q) must budget both into one deck.
4. **Prose is demoted on the operating surface.** One caption line per deck; everything else is a tap away (LEARN / READ / lessons). Learners who read while twiddling lose ambient context. Ratified copy is fully preserved — but rehoused, and rehousing changes reading behavior.
5. **Checks lose persistent inline presence**; prompts compress to two lines and verdicts move to popups. Richer scenario checks give up some of their card-format breathing room.
6. **Fixed deck height wastes space in simple modules** (one slider floating in 232dp). Spec allows a per-module deckH override with the stage absorbing the difference, but the default trades whitespace for cross-lab consistency — deliberately.
7. **The zero-scroll budget is permanent editorial pressure.** On 550dp Androids something occasionally has to go — a fourth readout, a sixth deck. That constraint is the design: it's what guarantees the owner never again ships a module where the cause scrolls away from the effect.