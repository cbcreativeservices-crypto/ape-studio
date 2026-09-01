# Colour-Customization Picker Redesign — "Show, don't label"

**Design spec · 2026-09-01 · implementation-ready · NO source files changed yet**

Owner brief: the member colour popups are "nice, but complex to understand (not intuitive)".
Nothing in the current UI *shows* what LEVEL / SOLID COLOUR / AVERAGE MARKER / "RTA BAR
COLOUR" actually recolour on the instrument. This spec adds a **target diagram** — a small
react-native-svg drawing of the *real* instrument with the affected part lit in the
currently-picked colour and everything else in dim steel — to every colour category on
every customization surface, and restructures the popups into left-aligned grouped cards
a first-time user parses in one glance.

Scope of surfaces (all four member colour surfaces in the app today):

| # | Surface | File | Colour categories |
|---|---------|------|-------------------|
| 1 | SPL Meter LED popup | `C:\Users\profe\dev\ape-studio\src\components\LedColorPicker.tsx` | LEVEL (scheme or flat), AVERAGE MARKER (flat) |
| 2 | RTA bar colour | `C:\Users\profe\dev\ape-studio\src\components\ColorWheelButton.tsx` built-in picker, launched from `src/screens/tools/RtaScreen.tsx` (~line 1086) | RTA BAR COLOUR (flat) |
| 3 | Tuner colour | same built-in picker, launched from `src/screens/tools/FrequencyCounterScreen.tsx` (~line 819) | TUNER COLOUR (flat) |
| 4 | Waveform trace colour | inline popup in `src/screens/tools/WaveformScreen.tsx` (`wavePopup === 'color'`, ~line 827; wheel at ~line 651) | TRACE COLOUR (flat) |

Hard constraints honoured throughout (do not re-litigate during implementation):

- **Data model unchanged.** `levelPref`/`avgPref`/`rtaColor`/`tunerColor`/`waveColor`
  stay `null | schemeId | '#hex'` strings via `useToolColorPref`. Presentation only.
- **The white peak-hold cap always stays white** — every LED diagram draws it white in
  every state, including custom schemes/flats.
- **The Loudness ramp stays the labelled, honoured default** (governance:
  `[[integrity-and-governance]]`). The default chip keeps the "Loudness" label and gains
  a visible DEFAULT tag.
- **Entitlement gating untouched.** `ColorWheelButton`'s member gate and popup are out of
  scope; everything here renders inside already-gated member modals.
- **No new dependencies.** `react-native-svg` only. No PNGs — diagrams must scale, obey
  tokens, and ship weightlessly.
- Tap targets ≥ 44 pt. Titles `fonts.oswaldSemiBold`, body `fonts.barlowRegular`, colours
  from `src/theme/tokens.ts`.
- All copy that did not exist before is flagged **NEW COPY — owner review**.

---

## 1 · Shared component family — `src/components/ColorTargetDiagrams.tsx` (NEW FILE)

One new file exporting five small pure SVG diagrams plus the shared section header. All
diagrams are **props-driven and stateless**, so they live-update for free whenever the
parent's pref state changes (the pick handlers already write parent state immediately —
that is the whole live-preview mechanism; see §4.5).

### 1.0 Shared conventions

```ts
import type { LedStop } from '../features/tools/ledScheme';

/** Every diagram takes the LIVE pref colour; null = that tool's default. */
export type DiagramTint = {
  /** '#rrggbb' flat pick, or null for the tool default. */
  tint: string | null;
  /** What null means for THIS instrument (e.g. '#5fd9c4' teal, LED_AVG_DEFAULT). */
  defaultTint: string;
};
```

- **Dim-steel palette** (the "not the target" ink — fixed, never the pref colour):
  - `DIM_LIT = '#3d4049'` — parts of the instrument that are *on* but not being coloured
  - `DIM_UNLIT = '#1a1a1f'` — unlit LED segments / background geometry
  - `DIM_LINE = '#565a63'` — dim marker lines, ticks
  - housing stroke `#33333c` (matches existing chip borders), housing fill `#0b0b0e`
- **Slot size:** every diagram renders inside a fixed **64 × 56** slot (the header's
  diagram well, §1.6). Each SVG declares its own `viewBox` and is drawn at slot size with
  `preserveAspectRatio="xMidYMid meet"` — geometry below is in viewBox units.
- **Accessibility:** diagrams are decorative — wrap in a `View` with
  `importantForAccessibility="no-hide-descendants"` / `accessibilityElementsHidden`.
  Meaning is carried by the header title + subtitle.
- **Gradient sampling:** `levelColor.ts` keeps a private `sampleStops()`. Export it as
  `stopsColorAt(stops, pos)` (pos 0 = loud/top … 1 = quiet/bottom, i.e. raw stop space)
  so the LED diagram can tint per-segment without duplicating interpolation. ~3-line
  change, no behavioural effect on existing callers.

### 1.1 `LedLevelDiagram` — for the LEVEL section (SPL LED popup)

A faithful miniature of `PeakAvgMeterView` (`src/screens/lab/meter/vizMeters.tsx`
~line 2822): vertical segmented bar, purple average fill at the bottom, loudness-coloured
peak fill above it, bright average line, **white peak-hold cap**, ticks on the right.

```ts
export function LedLevelDiagram(p: {
  /** LIVE level pref, exactly as stored: null | scheme id | '#hex'. */
  pref: string | null;
}): ReactNode
```

Internally resolve with the existing `resolveLedFill(pref)` → `{flat}` or `{stops}` —
identical decode path to the real meter, so the diagram can never disagree with it.

Geometry — `viewBox="0 0 36 56"`:

| Element | Spec |
|---|---|
| Housing well | `Rect x=9 y=1.5 w=18 h=53 rx=3.5` fill `#0b0b0e`, stroke `#33333c`, strokeWidth 1 |
| Segments | 13 slots, `x=11.5 w=13 h=3.0`, pitch 3.8: `segY(i) = 52.6 − (i+1)·3.8`, `i=0` bottom … `i=12` top |
| Demo pose (static) | average sits at the top of segment 3; peak at the top of segment 9 — a healthy mid-scale reading |
| Segments 0–3 (below avg) | `DIM_LIT` — this is the avg-fill region, *not* this section's target |
| Segments 4–9 (the peak fill — THE TARGET) | live colour: flat → all six in `flat`; scheme → per-segment `stopsColorAt(stops, 1 − i/12)` (so the bar's top segment maps stop pos 0, matching the real meter's orientation) |
| Segments 10–12 | `DIM_UNLIT` |
| Average marker line | `Rect x=8 y=segY(3)−0.8 w=20 h=1.6` fill `DIM_LINE` (dimmed — it belongs to the other section) |
| **White peak-hold cap** | `Rect x=11.5 y=segY(9)−2.8 w=13 h=2` fill `#ffffff` — **always white, in every state** |
| Scale ticks | 3 ticks `x=28.5→30.5`, y = segY(2), segY(6), segY(10), stroke `#3c3c3c` sw 1 |

With the default (`pref = null`) the six target segments sample `LOUDNESS_STOPS` — the
diagram literally shows the governed blue→green→…→red ramp climbing the bar.

### 1.2 `LedAvgDiagram` — for the AVERAGE MARKER section

Same geometry as 1.1 with the emphasis inverted:

- Segments 4–9 (peak fill): `DIM_LIT`. Segments 10–12: `DIM_UNLIT`.
- Segments 0–3 (the avg fill — THE TARGET): resolved avg colour at 80 % opacity
  (`fillOpacity={0.8}`, matching the real meter where the avg fill reads slightly
  quieter than its line).
- Average marker line (THE TARGET): `Rect x=8 y=segY(3)−0.9 w=20 h=1.8`, full-opacity
  resolved avg colour.
- **White cap stays white** (same rect as 1.1).
- Props: `{ tint: string | null }`; resolved colour = `tint ?? LED_AVG_DEFAULT`
  (`#b45bff` from `ledScheme.ts`).

### 1.3 `RtaBarsDiagram` — for RTA BAR COLOUR

`viewBox="0 0 88 44"`. A 10-bar spectrum silhouette:

- Baseline: `Line x1=3 x2=85 y=40` stroke `#2b2b33` sw 1.
- Bars: `x(i) = 4 + i·8.2`, `w=6.2`, `rx=1`, heights (px up from y=40):
  `[10, 17, 26, 34, 38, 33, 25, 18, 12, 8]` (musical mid-low bump). Fill = resolved tint.
- Peak-hold caps: `Rect w=6.2 h=1` sitting 2.5 px above each bar top, fill `DIM_LINE`
  (dim — the pref does not colour PK-hold; keeps the drawing honest).
- Props: `DiagramTint`; RTA passes `defaultTint = '#5fd9c4'` (`WAVE_COLOR_SWATCHES[0]`).

### 1.4 `WaveTraceDiagram` — for the Waveform trace colour

`viewBox="0 0 88 44"`:

- Mid line: `Line x1=2 x2=86 y=22` stroke `#2b2b33` sw 1 (dim structural line — do NOT
  draw it MIDLINE_BLUE here; a blue line in a colour picker would read as a pickable
  colour, and the flat-trace mode this pref governs doesn't ramp anyway).
- Trace (THE TARGET): decaying sine, stroke = resolved tint, sw 2.4, `strokeLinecap="round"`,
  fill none:
  `M2 22 C7 5 12 5 17 22 C22 39 27 39 32 22 C37 7 42 7 47 22 C52 36 57 36 62 22 C67 12 72 12 77 22 C80 27 83 27 86 24`
- Props: `DiagramTint`, `defaultTint = '#5fd9c4'`.

### 1.5 `TunerDiagram` — for TUNER COLOUR

`viewBox="0 0 88 44"`. Needle-over-scale glyph:

- Scale ticks: 7 verticals at `x = 14 + i·10` (i=0..6), `y=6→14`, stroke `DIM_LINE`
  sw 1.5 — except the centre tick (x=44), which is THE TARGET's centre marker:
  `y=3→16`, stroke = resolved tint, sw 2.5.
- Glow (TARGET): `Circle cx=44 cy=12 r=6` fill = tint, `fillOpacity=0.25`.
- Needle (TARGET): `Line x1=44 y1=41 x2=44 y2=11` stroke = tint, sw 2.5, round cap —
  drawn dead-vertical = in tune (this pref is the *in-tune* colour).
- Pivot: `Circle cx=44 cy=41 r=2.5` fill `DIM_LINE`.
- Props: `DiagramTint`; FrequencyCounter passes its in-tune green as `defaultTint`
  (read the tool's existing in-tune constant at wiring time — do not invent a hex).

### 1.6 `PickerSectionHeader` — the shared header anatomy

The core of the "better title layout" fix. Every colour category on every surface gets
the same left-aligned header row:

```
┌──────────┐  LEVEL                          ← Oswald SemiBold 13 / ls 1.4 / colors.amber
│ diagram  │  The moving loudness fill      ← Barlow 12 / lh 16 / colors.textMuted
│  64×56   │
└──────────┘
```

```ts
export function PickerSectionHeader(p: {
  diagram: ReactNode;          // one of the five diagrams, LIVE-updating
  title: string;               // short category name, UPPERCASE
  subtitle: string;            // one line: WHAT this colours on the instrument
}): ReactNode
```

- Row: `flexDirection:'row'`, `alignItems:'center'`, `gap:12`, `marginBottom:10`.
- Diagram well: `width:64 height:56 borderRadius:10 borderWidth:1 borderColor:'#2b2b33'
  backgroundColor:'#101014'` — a tiny recessed "glass display", echoing the ToolsHub
  rack language, `alignItems/justifyContent:'center'`.
- Title: `fonts.oswaldSemiBold`, 13, letterSpacing 1.4, `colors.amber`, left-aligned.
- Subtitle: `fonts.barlowRegular`, 12, lineHeight 16, `colors.textMuted`, left-aligned,
  `numberOfLines={2}` guard.
- The text column gets `flex:1` so long subtitles wrap instead of pushing width.
- Header (title + subtitle) is one accessibility element:
  `accessibilityLabel = "{title}. {subtitle}"`; diagram hidden (see 1.0).

---

## 2 · Surface (a): `LedColorPicker.tsx` — the SPL "LED METER COLOUR" modal

### 2.1 Problem being fixed

Today the modal stacks LEVEL / SOLID COLOUR / AVERAGE MARKER as centred labels at nearly
identical size/weight, with nothing indicating which pixels of the meter each governs,
and SOLID COLOUR reads as a third sibling section rather than a sub-option of LEVEL.

### 2.2 New structure — two grouped cards

Keep the modal chrome as-is (scrim, 360-max card, `#141418`, maxHeight 86 %, radius 16,
padding 20, centred amber title `LED METER COLOUR`, bottom DONE button). Inside the
scroll area, replace the flat stack with **two section cards**:

```
            LED METER COLOUR                    ← unchanged modal title

╔════════════════════════════════════════╗     SECTION CARD 1
║ [LedLevelDiagram]  LEVEL               ║
║    (live)          The moving loudness ║
║                    fill                ║
║ ┌────────┐┌────────┐┌────────┐         ║     scheme chips, 3-across
║ │Loudness││  VU    ││ Amber  │         ║
║ │DEFAULT ││        ││        │         ║
║ └────────┘└────────┘└────────┘         ║
║ ┌────────┐┌────────┐                   ║
║ │  Blue  ││  Mono  │                   ║
║ └────────┘└────────┘                   ║
║ SOLID COLOUR — one colour instead      ║     sub-head, left-aligned
║ ● ● ● ● ● ●                            ║     44-pt swatches
║ ● ● ● ● ● ●                            ║
║ ＋ SPECTRUM                            ║
╚════════════════════════════════════════╝
╔════════════════════════════════════════╗     SECTION CARD 2
║ [LedAvgDiagram]   AVERAGE MARKER       ║
║    (live)         The average-level    ║
║                   line and readout     ║
║ ⦿DEF ● ● ● ● ●                        ║
║ ● ● ● ● ● ● ●                          ║
║ ＋ SPECTRUM                            ║
╚════════════════════════════════════════╝
  The white peak-hold cap keeps its
  reference colour.                            ← footnote (existing copy, trimmed)

              [ DONE ]
```

Card style: `borderRadius:12 borderWidth:1 borderColor:'#26262e'
backgroundColor:'#17171c' padding:12`, cards separated by `gap:14` in the scroll
content. The slightly-lifted card surface against the `#141418` modal is what makes the
two groups read as two *objects* instead of one run-on list.

### 2.3 Section headers (live diagrams)

- Card 1 header: `PickerSectionHeader` with `diagram={<LedLevelDiagram pref={levelPref}/>}`,
  `title="LEVEL"`, `subtitle="The moving loudness fill"`
  (**NEW COPY — owner review**).
- Card 2 header: `diagram={<LedAvgDiagram tint={avgPref}/>}`, `title="AVERAGE MARKER"`,
  `subtitle="The average-level line and its readout"` (**NEW COPY — owner review**).

Because the diagrams take the live `levelPref`/`avgPref` props the modal already holds,
**every tap on a chip or swatch repaints the little meter instantly** — the user sees
"oh, THAT part changes" before ever closing the modal. This is the core intuition fix.

### 2.4 Inside card 1 (LEVEL)

- **Scheme chips**: same behaviour, restyled to fit 3-across inside the card
  (~288 pt content width): chip `width:88`, `SchemeSwatch w={80} h={28}`, label
  Oswald SemiBold 10.5 / ls 0.8 / textSecondary. Grid `justifyContent:'flex-start'`,
  `gap:8` (left-aligned — everything in the redesigned modal ranges left).
  Chip height lands ≈ 52 pt (≥ 44 ✓).
- **The Loudness chip stays first and stays labelled "Loudness"**, and gains a micro-tag
  under the label: `DEFAULT` — Oswald SemiBold 8.5 / ls 1 / textMuted
  (**NEW COPY — owner review**; satisfies the governance rule that the amplitude ramp is
  the labelled default).
- **SOLID COLOUR sub-section**: demoted to a clearly subordinate sub-head *inside* the
  LEVEL card, left-aligned: `SOLID COLOUR — one colour instead of a scheme`
  (**NEW COPY — owner review**), Oswald SemiBold 10.5 / ls 1.2 / textMuted,
  `marginTop:10 marginBottom:6`.
  **It inherits the section's diagram — no second drawing.** Rationale: a solid pick is
  just another value of the same LEVEL target, and the header diagram already flips from
  gradient to flat fill the moment a swatch is tapped, which *demonstrates* the
  scheme-vs-solid distinction better than a second static drawing could. Two mini meters
  inside one card would also imply two different targets — the exact confusion we're
  removing.
- Swatches: keep 44 × 44 circles, gap 9, `justifyContent:'flex-start'`. Selected state
  unchanged (white 3 pt ring) — the ring plus the live diagram together are sufficient;
  no checkmark glyph.
- `＋ SPECTRUM` link: keep amber Oswald 11.5 style but give it a real target:
  `minHeight:44`, `justifyContent:'center'`, `alignSelf:'flex-start'`,
  `paddingHorizontal:4` (today it's a 24-pt-tall centred text — under target size).

### 2.5 Inside card 2 (AVERAGE MARKER)

- DEF chip: unchanged behaviour (null → default purple), still the first swatch, still
  44 pt, keeps the `DEF` label; it already renders *in* `LED_AVG_DEFAULT` purple which
  now visibly matches the diagram's default marker.
- Swatch grid + `＋ SPECTRUM`: same treatment as card 1.

### 2.6 Spectrum sub-view keeps its context

Today tapping `＋ SPECTRUM` swaps the whole body for the wheel under a centred
`LEVEL · CUSTOM` label — the user loses sight of what they're colouring. New:

- Replace the label with the same `PickerSectionHeader` for the active target
  (`LEVEL` or `AVERAGE MARKER` title, same subtitle), diagram included.
- **Live preview while dragging the wheel**: add an optional presentation-only prop to
  `SpectrumColorPicker`:

  ```ts
  /** Fires on every hue/lightness change with the candidate colour (before USE). */
  onLiveChange?: (hex: string) => void;
  ```

  Call it at the end of `updateHue`/`updateLight` (and once on mount with the seeded
  colour). `LedColorPicker` holds a transient `previewHex` state fed **only to the
  diagram** while the spectrum view is open; nothing is persisted until `USE` fires the
  real `onPick`. Data model untouched.
- Keep the `‹ BACK` control; give it `minHeight:44`.

### 2.7 Footnote

Keep one footnote under the cards (Barlow 12.5 / lh 18 / textMuted, now left-aligned):
`The white peak-hold cap keeps its reference colour.` — existing ratified copy, minus
the now-redundant first sentence ("Recolours the moving LED" is carried by the LEVEL
subtitle). Trimming an existing sentence = flag as **NEW COPY — owner review** to be safe.

---

## 3 · Surface (b): `ColorWheelButton.tsx` built-in picker (RTA + Tuner)

The built-in picker is deliberately generic — keep it that way. It learns two optional
presentation props; each call site supplies its own diagram:

```ts
/** Renders the live target diagram in the picker header. `liveHex` is the
 *  currently-selected value (falls back to `current` prop; null = default). */
renderDiagram?: (liveHex: string | null) => ReactNode;
/** One-line "what this colours" subtitle under pickerTitle. */
subtitle?: string;
```

### 3.1 Header

When `renderDiagram` is present, replace the lone centred `pickerTitle` with
`PickerSectionHeader` (diagram + `pickerTitle` + `subtitle`), left-aligned at the top of
the card. Without `renderDiagram`, current rendering is preserved (no regression for any
future generic use).

### 3.2 Selection behaviour — stay open, preview, DONE

Today the built-in picker **closes on every pick**, which would make the live diagram
pointless. When `renderDiagram` is provided:

- Tapping a swatch / DEF / scheme chip calls `onPick(...)` as today (the tool behind the
  modal updates too — prefs are immediate) **but keeps the modal open** so the diagram
  and the ring move together and the user can compare colours rapidly.
- Add a DONE button (copy `LedColorPicker`'s `doneBtn` style exactly: Oswald 13 / ls 1.4,
  `#1c1c22` fill, `#3a3a44` border, radius 10, `paddingVertical:8` + `minHeight:44`).
  Scrim tap still dismisses.
- Spectrum branch: pass `onLiveChange` into `SpectrumColorPicker` (§2.6) to drive
  `renderDiagram(previewHex)` while dragging; `USE` commits and returns to the swatch
  view (still open).
- Without `renderDiagram`: keep today's close-on-pick (unchanged surfaces stay stable).

### 3.3 RTA wiring (`RtaScreen.tsx` ~line 1086)

```tsx
<ColorWheelButton
  ...existing props...
  pickerTitle="RTA BAR COLOUR"                          // existing copy
  subtitle="The spectrum bars, when COLORS is off"      // NEW COPY — owner review
  renderDiagram={(hex) => <RtaBarsDiagram tint={hex} defaultTint={WAVE_COLOR_SWATCHES[0]} />}
/>
```

The existing `pickerNote` ("Applies when COLORS (the level ramp) is off.") is superseded
by the subtitle — drop it at this call site (its content survives, shortened).

### 3.4 Tuner wiring (`FrequencyCounterScreen.tsx` ~line 819)

```tsx
<ColorWheelButton
  ...existing props...
  pickerTitle="TUNER COLOUR"                                  // existing copy
  subtitle="The in-tune needle, centre marker and glow"       // NEW COPY — owner review (reworded from the existing pickerNote)
  renderDiagram={(hex) => <TunerDiagram tint={hex} defaultTint={IN_TUNE_GREEN} />}
/>
```

`IN_TUNE_GREEN` = the tuner's existing in-tune colour constant in
`FrequencyCounterScreen.tsx` (use the real constant; do not hardcode a new hex). Drop the
now-redundant `pickerNote` at this call site.

### 3.5 Default chip

The generic picker's `DEF` chip (shown when no schemes) stays; its 46-pt size and white
selected ring are unchanged. Where the tool has a *specific* default colour (RTA teal,
tuner green), fill the DEF chip with that colour instead of the neutral `#1a1a1f`, via a
new optional `defaultSwatchColor?: string` prop — the chip then previews what "default"
actually is, matching the diagram. `DEF` text stays (white, existing style).

---

## 4 · Surface (c): `WaveformScreen.tsx` inline trace-colour popup (~line 827)

The waveform popup is the screen's shared settings popup; the `'color'` branch currently
renders bare swatches. Redesign that branch only:

- Prepend `PickerSectionHeader`:
  - `diagram={<WaveTraceDiagram tint={waveColor} defaultTint={WAVE_COLOR_SWATCHES[0]} />}`
  - `title="TRACE COLOUR"` (**NEW COPY — owner review**; the popup currently has no title
    for this branch)
  - `subtitle="The waveform line — picking a colour turns COLORS off"`
    (**NEW COPY — owner review**; surfaces the existing auto-disable behaviour that
    today happens silently)
- Swatches: keep the existing `styles.swatch` sizing (verify ≥ 44 pt; raise to 44 if the
  current style is smaller), `justifyContent:'flex-start'`.
- **Keep the popup open on pick** (remove `setWavePopup(null)` from the swatch handler
  for this branch only): the trace behind the popup *and* the diagram update instantly;
  the popup's existing dismiss affordance closes it. Other popup branches (zoom, window…)
  keep close-on-pick — they are value pickers, not colour comparisons.
- Spectrum branch: same `onLiveChange` preview into the header diagram; `USE` commits
  and returns to the swatch view.
- Note: this branch already maps `WAVE_COLOR_SWATCHES[0]` → `null` (default). Unchanged.

### 4.5 Live-update contract (all surfaces) — summary

| Interaction | Diagram source | Update path |
|---|---|---|
| Tap scheme chip / swatch / DEF | the persisted pref state (`levelPref`, `avgPref`, `current`, `waveColor`) | pick handler sets state → re-render → diagram repaints. No new state. |
| Drag spectrum wheel | transient `previewHex` local state | new `onLiveChange` prop (presentation-only) |
| Open the picker | persisted pref | diagram shows the *current* configuration on arrival — the popup now doubles as a legend for what's already set |

---

## 5 · Type, spacing & hierarchy system (all surfaces)

| Role | Spec |
|---|---|
| Modal title (`LED METER COLOUR`) | unchanged: Oswald SemiBold 14 / ls 1.8 / `colors.amber` / centred — the only centred text left |
| Section title (in `PickerSectionHeader`) | Oswald SemiBold 13 / ls 1.4 / `colors.amber` / left |
| Section subtitle | Barlow Regular 12 / lh 16 / `colors.textMuted` / left |
| Sub-head (`SOLID COLOUR — …`) | Oswald SemiBold 10.5 / ls 1.2 / `colors.textMuted` / left |
| Chip labels | Oswald SemiBold 10.5 / ls 0.8 / `colors.textSecondary` (existing) |
| DEFAULT micro-tag | Oswald SemiBold 8.5 / ls 1 / `colors.textMuted` |
| Footnote | Barlow Regular 12.5 / lh 18 / `colors.textMuted` / left |
| Section card | `#17171c` fill, 1 pt `#26262e` border, radius 12, padding 12, 14 pt between cards |
| Diagram well | 64 × 56, `#101014` fill, 1 pt `#2b2b33` border, radius 10 |
| Grids | left-aligned (`flex-start`), swatch gap 9, chip gap 8 |
| Selected state | existing white 3 pt ring on chips/swatches — plus the live diagram itself, which is the real "you are here" indicator |
| Tap targets | swatches 44, chips ≥ 52 tall, ＋ SPECTRUM / ‹ BACK / DONE all `minHeight:44` |

Why this hierarchy works at a glance on a 360-pt modal: **one** amber centred line names
the modal; **two** bordered cards partition the two targets physically; inside each card
the eye lands on a picture of the instrument first, the amber name second, the
plain-language one-liner third, and only then the options. Centred-vs-left alignment is
no longer doing hierarchy work it can't do.

---

## 6 · Copy inventory

| Where | Copy | Status |
|---|---|---|
| LEVEL subtitle | "The moving loudness fill" | **NEW COPY — owner review** |
| AVERAGE MARKER subtitle | "The average-level line and its readout" | **NEW COPY — owner review** |
| SOLID COLOUR sub-head | "SOLID COLOUR — one colour instead of a scheme" | **NEW COPY — owner review** |
| Loudness chip tag | "DEFAULT" | **NEW COPY — owner review** |
| LED footnote | "The white peak-hold cap keeps its reference colour." | existing sentence, first sentence removed — **owner review the trim** |
| RTA subtitle | "The spectrum bars, when COLORS is off" | **NEW COPY — owner review** (replaces existing pickerNote) |
| Tuner subtitle | "The in-tune needle, centre marker and glow" | **NEW COPY — owner review** (reword of existing pickerNote) |
| Waveform title | "TRACE COLOUR" | **NEW COPY — owner review** |
| Waveform subtitle | "The waveform line — picking a colour turns COLORS off" | **NEW COPY — owner review** |
| Everything else (`LED METER COLOUR`, `RTA BAR COLOUR`, `TUNER COLOUR`, `Loudness`, scheme names, `DEF`, `＋ SPECTRUM`, `DONE`, `USE`, `‹ BACK`) | unchanged | ratified as-is |

---

## 7 · File plan & acceptance checklist

**New file:** `C:\Users\profe\dev\ape-studio\src\components\ColorTargetDiagrams.tsx`
(five diagrams + `PickerSectionHeader` + `DiagramTint` type).

**Edited (presentation only):**
- `src/components/LedColorPicker.tsx` — cards, headers, sub-head, alignment, spectrum
  preview, tap-target fixes.
- `src/components/ColorWheelButton.tsx` — `renderDiagram` / `subtitle` /
  `defaultSwatchColor` props, stay-open + DONE when diagrammed.
- `src/components/SpectrumColorPicker.tsx` — optional `onLiveChange`.
- `src/features/tools/levelColor.ts` — export `stopsColorAt` (rename/expose of the
  private `sampleStops`).
- `src/screens/tools/RtaScreen.tsx`, `FrequencyCounterScreen.tsx` — pass diagram +
  subtitle, drop superseded `pickerNote`s.
- `src/screens/tools/WaveformScreen.tsx` — `'color'` popup branch header + stay-open.
- `src/screens/tools/SplMeterScreen.tsx` — **no changes** (its `LedColorPicker` call
  already passes live prefs both directions).

**Acceptance (device pass, member account):**
1. SPL popup: two cards; LEVEL diagram repaints on every scheme/swatch tap; white cap
   visibly white under Loudness, VU, Amber, Blue, Mono, any flat, and any spectrum pick.
2. AVERAGE diagram shows purple by default; marker line + bottom fill recolour on pick;
   peak region stays dim steel.
3. Loudness chip shows DEFAULT tag and is selected when `levelPref === null`.
4. Spectrum wheel drags repaint the section diagram live before USE; backing out without
   USE leaves prefs untouched.
5. RTA/Tuner pickers open with the diagram showing the *current* colour, stay open on
   pick, DONE closes; non-diagram uses of `ColorWheelButton` (if any appear later)
   behave exactly as today.
6. Waveform colour branch: trace behind the popup, the diagram, and the ring all agree
   on every tap.
7. VoiceOver/TalkBack: each section header reads "{title}. {subtitle}"; diagrams silent;
   all controls ≥ 44 pt.
8. Web preview (8090) renders all SVGs (no Skia involved — plain react-native-svg).
