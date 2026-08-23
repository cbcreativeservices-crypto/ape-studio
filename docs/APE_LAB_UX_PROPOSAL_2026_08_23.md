# APE Lab UX — Global Interaction Architecture Proposal
**2026-08-23 · research + synthesis (11-agent workflow: 4 surveys, 4 designs, 3 judges) · status: AWAITING OWNER APPROVAL**

---

## 1. The problem, measured (not guessed)

Every interactive lab is one vertical ScrollView: display panel, readout cards, sliders,
chip banks stacked into 1.8–3.5 viewports of content. Reaching a control scrolls the
display — and usually the readouts — off screen. Verified worst cases:

| Screen | Stack height | The failure |
|---|---|---|
| **Room Builder** (wave) | ~2,300–2,600dp (3.5 viewports) | Readouts sit ABOVE the display; source sliders 2.3 screens BELOW it. The module's own "delay the sub" exercise cannot be watched while performed. |
| **LiveSpectrumEq** (EQ 11) | ~1,240dp | Controls ABOVE the display — on a 550dp Android, chips and bars can never co-exist; challenge instructions 700–1,000px from their controls. |
| **Harmonograph** | worst single-screen ratio | The figure is always off-screen while adjusting. |
| **GraphicTruth** (EQ 10) | ~1,300dp | Invented a readout row 313px above the faders because the finger hides the values. |
| **Mic Principles** | — | 10 section chips ≈ 130–170dp tax on EVERY section. |

Counter-evidence that co-visibility teaches: the modules that already keep control+display
together (FindFrequency, MultiBand's on-graph nodes, SeeingFrequency) are the ones that
feel right today.

Existing seeds of the solution, already in the app: value-button→popup (SplMeter ctrlBar,
:1566/:2569), pinned status bar outside the scroller (MultiMeter :1002-1116), in-canvas
readouts (VU cornerReadouts), select-then-edit shared sliders (Foundations M11, Room
Builder wall chips), `onDragActive` plumbing on every slider, and `WaveLayout` — a single
file that owns the layout of 15 wave modules.

## 2. Process

4 independent architectures were designed against the survey facts, then scored by 3
adversarial judges (pedagogy · engineering-on-this-codebase · design language):

| Proposal | Pedagogy | Engineering | Design | Mean |
|---|---|---|---|---|
| **A — The Rack Unit** (pinned instrument faceplate) | **87** | **86** | **87** | **86.7 — winner** |
| B — Meter Bridge (hero fader + bottom sheets) | 85 | 80 | 83 | 82.7 |
| D — Faceplate (handles on the glass) | 68 | 68 | 73 | 69.7 |
| C — StageDeck (zero-scroll paged decks) | 71 | 62 | 66 | 66.3 |

All three judges independently instructed: **build on A's spine, graft the best of B/C/D.**
Full texts: `docs/lab-ux-research/` (4 proposals + judge panel + survey facts).

## 3. The system — "The Rack Unit"

> **The law: reading may scroll; operating may not.**
> Every lab module becomes a piece of rack gear, not a document.

Portrait phone, three zones; only the middle one scrolls:

```
┌──────────────────────────────────────┐
│ chrome (unchanged header + prev/next)│
├══════════════════════════════════════┤
│ ╔══════ recessed glass STAGE ══════╗ │  PINNED — outside the ScrollView.
│ ║   Skia/SVG display               ║ │  Sized at mount (S160/M200/L250),
│ ║   on-glass drags stay primary    ║ │  NEVER resized during interaction.
│ ║──────────────────────────────────║ │
│ ║ RT60 0.48s│LVL −9.2│ARR 21ms│ ⓘ  ║ │  BEZEL — readouts printed ON the
│ ╚══════════════════════════════════╝ │  display (ReadoutGrid contract).
├──────────────────────────────────────┤
│ ░ SCROLL WELL — prose, mistakes,   ░ │  The only scroller. CheckQuestion
│ ░ checks, notices at bottom        ░ │  answered with the display visible.
├──────────────────────────────────────┤
│ ┃ ROOM WIDTH ────●────────  8.4 m ┃  │  PARAM LANE — one shared fader,
│ ┌───────┬───────┬────────┬────────┐  │  PRE-BOUND to the module's
│ │ROOM W▪│DEPTH  │WALLS ▸ │SRCS ▸  │  │  teaching parameter (hard rule:
│ │ 8.4 m │ 6.0 m │ BRICK  │  2     │  │  every module declares initialParam).
│ └───────┴───────┴────────┴────────┘  │  DOCK — tools-anatomy value-buttons.
└──────────────────────────────────────┘
```

**The mechanisms (spine = A, grafts marked):**

1. **Pinned stage + bezel readouts.** Display and readouts leave the scroller — there is
   no scroll position at which cause and effect separate, in any lab, ever. Stage frame =
   the ToolsHub recessed-glass tile grown to full width. In-canvas corner readouts are a
   per-display phase-2 upgrade *(graft C: tl/tr/bl/br corner-cell positions)*.
2. **Param lane, pre-bound.** The module's key teaching parameter costs ZERO taps — the
   lane is bound to it on mount. One motor pattern everywhere: *tap the legend, ride the
   fader.* The kit refuses to render without `initialParam` *(judges: keep structural,
   not conventional)*.
3. **Dock value-buttons → trays.** The tools' ctrlBar→popup idiom, re-anchored: trays
   slide up over the WELL ONLY — the glass stays bright and live. Teaching collections
   (12 wall materials) use **sticky trays**: pick-applies-and-stays-open, so a student
   A/Bs FOAM→BRICK→CURTAIN while RT60 moves on the bezel. Collections that ARE the
   lesson render as a persistent 3-column grid picker *(graft C)*. Doctrine, documented:
   *tools popups configure (pick-and-close); lab trays experiment (stay open)* *(graft B)*.
4. **Group sheets for interacting pairs.** Freq+Q, attack+release: 2–3 co-taught params
   share one sheet; tapping another chip swaps content in place *(graft B — replaces A's
   third-tier banks for most cases; bank tabs only for genuinely dense modules,
   SOURCE/TONE/FX naming per C)*.
5. **Drag tag.** During ANY drag, an in-glass value chip rides the interaction — powered
   by the `onDragActive`/`onActive` plumbing that already exists on every slider. Retires
   GraphicTruth's 313px-distant activeBar *(graft D — highest value per cost in the field)*.
6. **On-glass handles where the parameter is spatial.** MultiBand nodes, RoomScene
   source/listener, Binaural stage stay primary — pinning frees them from the scroll war.
   Every handle is mirrored by a dock route (a11y invariant) *(graft D, scoped)*.
7. **Two button verbs, visually distinct.** Fader chips (tiny lane glyph) BIND the lane;
   ▸ chips OPEN trays; toggles/actions get a non-value-button skin — the value-button
   keeps one meaning per surface *(judge 3's coherence fix)*.

**Killed by the panel (do not build):** horizontal control paging (same-axis gesture war);
prose/checks exiled to overlays (ratified copy stays inline in the well); display resizing
while a control is open (never resize a live Skia canvas); timed/disappearing controls;
any new component under MIN_FONT 12 (the tools' 9.5px is legacy, not precedent).

**Constraints honored:** PanResponder only — no new native modules, no new build; Fabric-safe
in-tree overlays (never native Modal); MIN_FONT 12; guided-lesson long-press + photoHint +
honesty badges survive; ratified copy untouched; notices at bottom; reset in-tray.

## 4. Components (all extraction, not invention)

New under `src/screens/lab/rack/`: **RackUnit** (frame: stage/well/dock),
**DockButton** (SplMeter ctrlBarBtn, fonts at 12/14), **DockTray** (de-modalized in-tree
overlay, LabChips inside, in-tray RESET, BackHandler-first), **ParamLane** (DragSlider's
anchored-dx guts as a channel fader), **BezelReadouts** (ReadoutGrid items as bezel
legend windows), typed **ParamSpec** grammar *(graft B)*, **useStageBudget** one-place
vertical math *(graft C)*. Integration: optional `stage/params/banks` props on LabShell;
per-module `rack: true` flag in the 5 module hosts; `WaveLayout` as the 15-module adapter.
DragSlider/ReadoutGrid/CheckQuestion/GuidedLessons untouched at their existing call sites.

## 5. Migration (consensus order, opt-in per module)

| Step | Target | Why | Effort |
|---|---|---|---|
| 0 | Build the kit | Additive only; zero regression surface | ~1 session |
| 1 | **Harmonograph** | Worst ratio, smallest surface — dramatic before/after | M |
| 2 | **LiveSpectrumEq** (host flag) | Worst inversion; proves live-mic pinned stage | M |
| 3 | **Wave via WaveLayout**, then **Room Builder** by hand | 15 modules in one file; the stress test | M–L |
| 4 | Playground (banks), meter host, digital host, MicPrinciples (10 chips → 1 tray), rest of EQ | Steady rollout | M each |
| — | LabModuleHost extraction (5 copy-pasted hosts → 1) | AFTER two proven converts — cleanup, not dependency *(graft B, resequenced)* | M |

**Never converted:** Cable wizard, Calc, Tube pager, prose-only modules, hub menus, tools.

## 6. Open decisions for the owner

1. **Approve the direction?** (Rack Unit spine + grafts as above.)
2. **Pilot** = Harmonograph first, or jump straight to Room Builder as the flagship demo?
3. **Optional appendix, explicitly NOT in scope unless approved:** adding
   react-native-gesture-handler (native module → NEW BUILD) would enable pinch-on-glass
   zoom; nothing in this plan depends on it.

*Interactive before/after mock: `docs/art/mic-cutaway/labux_before.html` /
`labux_after.html` (served on :8123). Research corpus: `docs/lab-ux-research/`.*
