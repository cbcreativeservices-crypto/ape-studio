# Gear-Faithful Lab Controls — Design Pass (2026-09-11)

**Brief (owner, 2026-09-11, in substance):** "We are teaching audio, and most audio equipment
has fairly common controls and layout. Our users are beginners — part of learning is getting
comfortable with how things LOOK and are LAID OUT. Many labs have controls where the layout
could have better real-world context and recognition. Don't just make a mobile app container —
incorporate the look and feel of the devices."

**Anchor case:** the Beginning Mixing console (pages 5 · 7 · the Final page) rendered by
`MiniConsole` — today a column of generic stepper buttons per channel. Spec'd in Part 1.

**Scope:** design only. No code changed, no copy changed. Every current-state claim cites the
file it was read from. Two hats were worn throughout: product/UI design AND the working
engineer's "would I recognise this at a real desk?" test.

**The one-sentence diagnosis from the full survey (Part 2):** the app's skeuomorphism today
lives almost entirely in DISPLAYS (the VU faces, the rack-device drawings, the jack field, the
tube cutaway, the recessed-glass stages) while the CONTROLS are one shared flat lane, three
parallel generic sliders, and rounded-rect chips. The fix is not thirty redesigns — it is one
small gear-control kit (Part 3) plus a handful of targeted conversions, ranked in Part 2.

---

## 0 · The precedents this design extends (nothing new is invented)

| Precedent | Where | What we take from it |
|---|---|---|
| **The Rack Unit** — "reading may scroll; operating may not"; recessed-glass stage, bezel readouts, dock + one shared ParamLane | `C:\Users\profe\dev\ape-studio\src\screens\lab\LabShell.tsx` · `C:\Users\profe\dev\ape-studio\src\screens\lab\rack\RackUnit.tsx` · `C:\Users\profe\dev\ape-studio\src\screens\lab\rack\rackTypes.ts` | Faceplate/panel material language, the layout law, the tray grammar (`TrayOption`, rackTypes.ts:50), the drag-tag "value never hidden under the finger" rule |
| **Photoreal VU faces** — measured geometry, real-signal-only needle | `C:\Users\profe\dev\ape-studio\src\screens\tools\SkinnedVu.tsx` (SPL face) · `C:\Users\profe\dev\ape-studio\src\screens\tools\SkinnedTunerVu.tsx` (edgewise tuner VU) · `C:\Users\profe\dev\ape-studio\src\screens\lab\meter\vizMeters.tsx` (classic VU at ~line 730, screws at ~198) | The bar for "photoreal": geometry measured, never formula-guessed; print margins; **integrity — displays render only real engine values, never a fake reading** |
| **The jog wheel** — SSL-style dished rotary, Skia | `C:\Users\profe\dev\ape-studio\src\components\JogWheel.tsx` (+ `src\components\jogwheel\`) | The app's rotary material: matte sandblasted black, **world-fixed overhead key light 30° to the viewer's left**, no specular hot spot, `accessibilityRole="adjustable"` + actions (line ~678). GearKnob is this object at 40 pt, in SVG |
| **The console fader that already exists** | `C:\Users\profe\dev\ape-studio\src\features\study\PresetFader.tsx` | Matte body panel, recessed slot groove, tick stops, brushed-metal cap with grip grooves + centre indicator line (CAP_W 49 / CAP_H 30 / BODY_W 32) — the cap drawing, verbatim |
| **The gesture-proven vertical fader** | `C:\Users\profe\dev\ape-studio\src\screens\lab\eq\modules\eqBits.tsx` (`VerticalFader` line 26, `GraphicBoard` line 98; also consumed by `C:\Users\profe\dev\ape-studio\src\screens\lab\gain\gainViz.tsx:135`) | The exact PanResponder recipe that lets a vertical fader live inside a horizontal scroller: capture at touch-start, scroll-lock, anchored `dy`, hand off ONLY clearly-horizontal gestures (`onPanResponderTerminationRequest: dx > dy + 6`, lines 57–77) — already solved, already shipped |
| **The illuminated hardware buttons that already exist** | `C:\Users\profe\dev\ape-studio\src\components\GlassButton.tsx` (backlit scribble-strip glass key: metal rim, smoked glass, LED label, ~2 px key travel, 7 tints) · `C:\Users\profe\dev\ape-studio\src\components\SwitchButton.tsx` (illuminated pro-audio pushbutton — today used only by Dashboard/CourseSelection) | GearButton starts from these, it does not replace them |
| **The breathing thumb** | `C:\Users\profe\dev\ape-studio\src\features\lab\attentionPulse.tsx` (`usePulseStyle`, 4 s loop, reduced-motion safe) | Every interactive cap/pointer breathes (owner standard 2026-09-05) |
| **The amplitude colour ramp** | `C:\Users\profe\dev\ape-studio\src\features\tools\levelColor.ts` (`levelColor`, `levelColorForDb`) | LEVEL readouts/lanes speak the one app-wide ramp; **it outranks any palette lifted from gear photos** (owner ruling 2026-08-28) |

---

# PART 1 · THE CHANNEL STRIP

## 1.1 What is on screen today — the problem, precisely

`MiniConsole` (`C:\Users\profe\dev\ape-studio\src\screens\lab\mixing\kit.tsx`; `Strip` ~line
448, `MiniConsole` ~line 496) renders each channel as an **88 pt-wide rounded card**
(`styles.strip: width: 88`) containing, top to bottom:

1. Track name (TOP — real consoles write it at the BOTTOM, on tape)
2. `+` button · mono dB readout · `−` button (fader as a stepper, ±2 dB per tap)
3. `◀` button · `C`/`L25`/`R50` readout · `▶` button (pan as a stepper, ±25 per tap)
4. `MUTE` full-width button (DAW-red when engaged — the one gear convention it keeps, by
   deliberate comment in the file)
5. `Ø` full-width polarity button

All controls are the generic `Btn` from
`C:\Users\profe\dev\ape-studio\src\screens\lab\tuning\components\primitives.tsx` (line 106) —
rounded-rectangle text buttons. The strips ride a horizontal `ScrollView` with the
"`N` CHANNELS — SWIPE →" cue. It is functional and honest (real dB, wired into the real render
via `useMixPlayback` → `renderMix` in
`C:\Users\profe\dev\ape-studio\src\screens\lab\mixing\audio\mixAudio.ts`), and its stepper
design was a deliberate WCAG 2.5.7 choice ("steppers, not drags", kit.tsx header). But it
reads as a settings panel. A beginner finishes the lab having never seen the shape of a
console channel.

It appears on: `pagesB.tsx` page 5 (fader+pan+mute+Ø) and page 7 (`show={{fader:false}}`,
pan+mute only), `pagesD.tsx` Final page (fader+pan+mute+Ø), and `pagesAdvD.tsx` (Advanced
Mixing final) — all under `C:\Users\profe\dev\ape-studio\src\screens\lab\mixing\`.

## 1.2 The strip, top to bottom (the real-console order, honestly subsetted)

A real strip is ~90 mm wide and a metre tall. We have a **96 pt column** (widened from 88 —
still ~3.5 strips visible on a 375 pt phone) and ~420 pt of height. The design must say what
survives that width honestly:

**Survives:** input zone (Ø now; TRIM knob when a lab's model drives it) · PAN as a rotary
knob · MUTE (and SOLO if approved, §1.5) as square illuminated buttons · a real vertical fader
with cap, travel slot and printed dB scale · the wired dB value window · scribble strip at the
bottom.

**Cut, and why:** per-channel EQ and aux-send knob blocks. The Beginning Mixing model
(`TrackSettings`, `mixAudio.ts` line 361: `faderDb, pan, mute, polarity, clipGainDb, hpHz?,
eq?, comp?`) only exposes EQ/HPF and compression on later teaching pages, and a four-knob EQ
block at 96 pt would be a decorative miniature no finger can operate. Instead, on pages where
the model has no such control the strip carries **blind panels**: labelled blank zones ("EQ",
"SENDS") in the correct strip position. A labelled blind is how real consoles ship unfitted
options; it builds layout recognition ("this is where EQ lives on a strip") without ever
rendering a dead control — which keeps the no-fake-controls faith with the no-fake-meters
rule.

```
┌──────────────┐
│ ● Ø   (TRIM) │  INPUT zone. Ø moves UP here from the bottom — on every real
│              │  desk polarity lives beside the mic pre. TRIM knob renders
│              │  only when the page's model drives it (clipGainDb).
├──────────────┤
│  EQ ──────── │  Blind panels: printed labels on blank faceplate, only on
│  SENDS ───── │  pages whose model has no such control. Anatomy, not fakery.
├──────────────┤
│    ( PAN )   │  GearKnob 40 pt: amber pointer, L·C·R arc ticks printed on
│    L  C  R   │  the faceplate, centre detent with haptic.
├──────────────┤
│ [SOLO][MUTE] │  Square illuminated GearButtons (SOLO pending owner call,
│              │  §1.5). 44 pt hit each (visual ~34 pt + hit slop).
├──────────────┤
│   ┌──────┐   │  Value window: the REAL wired dB readout, restyled as the
│   │ -4.0 │   │  little display digital desks put above the fader. Tap =
│   └──────┘   │  NudgePopup (the WCAG 2.5.7 stepper alternative, §1.3).
│ +12 ┤        │
│  +6 ┤  ║     │  GearFader: 160 pt recessed travel slot, brushed cap with
│   0 ╣══█══   │  grip grooves + centre line (PresetFader's cap language),
│ -10 ┤  ║     │  printed dB scale, UNITY tick at 0 dB — longer and amber.
│ -20 ┤  ║     │
│ -40 ┤  ║     │
│  -∞ ┤  ║     │
├──────────────┤
│ ▓▓ KICK ▓▓   │  ScribbleStrip: the name at the BOTTOM on "tape" — the one
└──────────────┘  light element on the dark panel, which is what makes an
                   8-strip console scannable at a glance.
```

The strips sit on one **ConsoleFrame**: a shared rack-panel background in the Rack Unit's
faceplate material (dark `#101013`-family panel, hairline separations, subtle vertical brushed
gradient via the `expo-linear-gradient` already used in `RackUnit.tsx`), strips divided by
engraved separator lines rather than floating as separate cards. The existing "`8` CHANNELS —
SWIPE →" cue and the visible horizontal scroll indicator stay exactly as they are (kit.tsx
design pass 6 made off-screen strips discoverable; that survives).

## 1.3 Fader spec (the heart of it)

**Geometry.** Travel slot 160 pt tall × 6 pt wide, recessed (inner shadow top edge, hairline
light bottom edge — PresetFader's slot). Cap: 34 × 18 pt brushed-metal rounded rect, three
grip grooves, 1 pt centre indicator line (`PresetFader.tsx` cap, scaled down). Invisible hit
area: the strip's full 96 pt width × cap ± 22 pt (≥ 44 pt everywhere).

**Scale + taper.** Printed left of the slot: `+12 · +6 · 0 · −10 · −20 · −40 · ∞` with tick
marks, minor ticks between +12…−20. The 0 dB (unity) tick is full-width and amber
(`colors.amber`, `C:\Users\profe\dev\ape-studio\src\theme\tokens.ts` line 22). Position↔dB is
a real fader law, piecewise-linear through anchors
`+12→1.00 · 0→0.76 · −10→0.55 · −20→0.40 · −40→0.18 · −60(−∞)→0.00` — most of the travel
spent where mixing happens, like a 100 mm fader. The cap position IS the value; the value
window always agrees (one source of truth: `faderDb`).

**Gestures — honest and complete:**

| Gesture | Result |
|---|---|
| Vertical drag anywhere in the strip's fader zone | **Relative** ride: `dy` from touch-down applies to the value at touch-down. The cap never jumps to the finger — grabbing a fader must not move it. (This deliberately differs from `VerticalFader`'s tap-jump, which is right for a graphic-EQ board and wrong for a mix fader.) Resolution follows the taper — ≈0.4 dB/pt near unity. |
| Long-press the cap 250 ms, then drag | **FINE** mode: 10× resolution (≈0.1 dB per 2.5 pt). Haptic tick on entry, "FINE" tag on the value window, exits on release. |
| Double-tap the cap | Snap to **unity (0 dB)** — the console reflex worth training. |
| Tap the value window | **NudgePopup** (compact, per the compact-popup rule): `+1 · −1 · +0.1 · −0.1 · UNITY · −∞`, 44 pt buttons, live readout. This is the WCAG 2.5.7 single-pointer non-drag alternative and the direct successor of today's +/− steppers — nothing is lost for motor users. |
| Overshoot at either end | Rubber-band: the cap resists past the end stop and springs back (Reanimated; reduced-motion = hard stop, no spring). |

**Scroller coexistence.** The horizontal channel scroller stays. Every GearFader/GearKnob
claims the touch at touch-start (`onStartShouldSetPanResponderCapture: () => true`), locks the
host scroll, and **releases only clearly-horizontal gestures** via
`onPanResponderTerminationRequest: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy) + 6` — the exact
shipped recipe from `VerticalFader` (`eqBits.tsx` lines 57–77), already proven inside the
1/3-octave `GraphicBoard`'s horizontal scroller. Horizontal swipes on the panel between
controls, on blind zones, and on the scribble strip scroll the console. Same law as
`LabShell`'s `InteractionZone`: "inside a zone the object wins, everywhere else the screen
scrolls" (`LabShell.tsx` header).

**Accessibility (the +/− promise, kept):**
- `accessibilityRole="adjustable"`; label "KICK fader"; `accessibilityValue`
  `{min: −60, max: +12, now, text: "minus 4 dB"}` (−60 announced as "off").
- `accessibilityActions` increment/decrement = ±1 dB (screen-reader swipe up/down) — the
  pattern `ParamLane` (`C:\Users\profe\dev\ape-studio\src\screens\lab\rack\ParamLane.tsx`
  ~line 95) and `JogWheel` (~line 678) already implement.
- The NudgePopup gives sighted motor-impaired users the same steppers as before.
- The cap breathes via `usePulseStyle()` (`attentionPulse.tsx`); reduced motion holds it
  bright and still.

**Honesty.** The value window shows `faderDb` — the very number `renderMix` consumes. **No
channel meters are drawn**: a lit LED ladder that isn't metering is exactly the fake meter the
integrity rules prohibit, and the mix engine is decide→render→listen, not live-streaming
per-track levels. (If a real per-track RMS tap from the rendered buffers is ever exposed, a
post-render "this render's level" ladder would be honest — future option, explicitly NOT in
this pass.) On the level-slider colour standard (owner 2026-09-05, LEVEL sliders on the MIDI
ramp): a photoreal fader slot with a colour-ramp fill would read as a meter, which the honesty
rules forbid here. Proposed reconciliation, for the owner to ratify: the GearFader joins the
standard's exemption list, and the amplitude ramp speaks through the value-window text instead
(`levelColorForDb`, the sanctioned readout colouring in `levelColor.ts` line ~111).

## 1.4 Pan knob spec

40 pt **GearKnob**: the JogWheel's material at small scale — matte near-black puck, world-fixed
overhead-left key light, no hot spot, a 2 pt amber pointer from centre to rim. Printed on the
faceplate around it: an 11-tick arc with `L · C · R` legends, centre tick longer. Rendered in
`react-native-svg` with static shading — eight knobs per console must cost nothing per frame;
Skia stays reserved for the one hero object per screen (the JogWheel's own rule).

- **Drag:** vertical, relative (up = clockwise = right) — the DAW touch-knob standard, and
  vertical never fights the horizontal channel scroller. Full travel ≈120 pt for L100→R100.
  Same capture/handoff recipe as the fader.
- **Centre detent:** snaps to C within ±4, haptic tick on entering (`expo-haptics`, already a
  RackUnit dependency).
- **Double-tap:** centre.
- **Tap the pan legend** (the `L25` readout under the knob): NudgePopup `◀5 · ▶5 · ◀25 · ▶25 ·
  CENTRE` — supersedes today's ±25 steppers without losing them.
- **A11y:** `adjustable`; label "KICK pan"; value text "centre" / "left 25" / "right 50" (the
  wording today's strip already announces); increment/decrement = 5.
- Page 7's off-centre risk line (`pagesB.tsx` `styles.riskLine`) is untouched below the
  console — it already reads like an operator's warning.

## 1.5 Buttons, polarity, solo

- **MUTE:** square illuminated GearButton. Unlit: engraved dark cap, printed "MUTE". Lit:
  `colors.red` face glow + bright inner border — the DAW-red convention the current console
  keeps deliberately (comment in kit.tsx `Strip`). Visual ~34 pt, hit 44 pt.
  `accessibilityRole="button"`, `accessibilityState.selected`; spoken labels unchanged
  ("KICK mute/unmute"). Implementation starts from `SwitchButton.tsx` / `GlassButton.tsx`.
- **Ø (polarity):** small round button in the INPUT zone at the top — where it lives on real
  strips, beside the pre. Lit `colors.amber` when inverted. Label "Ø" unchanged.
- **SOLO — flagged, not assumed.** The owner's brief asks for solo, but **solo exists nowhere
  in the mix model** (`TrackSettings`, `mixAudio.ts:361` — no solo field) nor in the ratified
  copy. It can be added honestly with zero DSP work: solo is client-derived muting (any solo
  lit ⇒ non-solo tracks are handed to `renderMix` muted), and it fits decide→render→listen
  exactly like mute. But it is a NEW control on a ratified surface → **owner call before
  build**. The strip reserves the position either way; until approved, the Beginning lab
  ships MUTE-only — a lone MUTE on the strip is itself a real console idiom (many desks put
  solo on the master section).

## 1.6 Scribble strip

The name plate moves from the strip's top to the **bottom** — real consoles write the name on
tape below the fader. Rendering: a light "tape" band (desaturated warm off-white in the
`#d8cfa8` family, hairline top/bottom edges) carrying the track name in dark
`fonts.oswaldSemiBold` caps — deliberately the ONE light element on the dark panel.
`accessibilityRole="header"` moves with it; acceptable because every control's spoken label
already carries the track name ("KICK fader…"), exactly as today's `Strip` does. If header-last
reading order confuses in the device pass, an invisible header at the strip top restores order
without changing the visual — logged as a device-pass check.

Colour note: the tape band is a MATERIAL colour, not a signal colour — it does not touch the
amplitude ramp and therefore does not collide with the colour standard.

## 1.7 Copy-freeze flags (mixing copy ratified 2026-09-11 — nothing rewritten silently)

1. **"`N` CHANNELS — SWIPE →"** cue (kit.tsx `styles.consoleCue`) — kept verbatim.
2. **Console footnotes** ("LEAD and BGV are synth stand-ins…", `pagesB.tsx:65`,
   `pagesD.tsx:305`) — kept verbatim, still directly under the console.
3. **"RESET MIX"** button + a11y string — kept.
4. **Goal chips** ("Shape at least five tracks"): `countTouched` (kit.tsx) reads values, not
   gestures, so knob/fader edits already count identically — verified, no copy change.
5. **NEW strings the strip introduces** — "SOLO" (if approved), "FINE", NudgePopup labels
   ("UNITY", "CENTRE", "−∞"), blind-panel labels ("EQ", "SENDS"). New control chrome, not
   rewritten ratified copy — but they appear on a ratified surface, so they go to the owner
   as an additions list for ratification, never silently.
6. Page 7's `show={{fader:false}}` console simply renders strips without the fader zone
   (pan knob + MUTE + scribble) — MORE console-like, not less. No copy touched.

---

# PART 2 · THE FULL LAB SURVEY

Method: three parallel code surveys covered every directory and root screen under
`C:\Users\profe\dev\ape-studio\src\screens\lab\`; file paths below are from those reads, not
memory. "Real audio" = wired to `ApeDsp`/a player; "visual-only" labs say so on screen and
must stay honest through any re-skin.

## 2.1 Ranked upgrades — most recognition-learning per unit of work

| # | Upgrade | What changes | Why it ranks here | Effort |
|---|---|---|---|---|
| 1 | **Mixing console → GearStrip** (Part 1) — `src\screens\lab\mixing\kit.tsx` MiniConsole; pages 5/7/Final + `pagesAdvD.tsx` | Stepper cards → real strip: pan knob, illuminated MUTE, capped fader with dB scale, scribble at bottom | The owner's anchor case; the single most universal piece of audio gear; four ratified pages inherit at once | **L** |
| 2 | **ParamLane → console-fader skin** — `src\screens\lab\rack\ParamLane.tsx` | The ONE shared lane every rack lab binds gets the recessed slot + brushed cap + printed end ticks (horizontal GearFader variant). API untouched; internals already proven | Highest leverage per point of effort in the codebase: foundations, digital, eq, meter, micspeaker, tube, wave, fx, modular, oscillator-family, harmonograph, binaural, autotune, FM and bass ALL inherit a hardware fader in one file | **S–M** |
| 3 | **FxLab dynamics honesty + gear** — `src\screens\lab\FxLabScreen.tsx` (GR text at lines ~305–347) + `src\screens\lab\fxLabConfigs.tsx` (compression L746, gate L861, limiter L953) | (a) The REAL `GrMeter` bar (already built: `src\features\lab\fxViz.tsx:706`, already fed by real `ApeDsp.fxGrStatus()`) is today used only by SignalChainLabScreen — wire it into the three dynamics labs' stage/bezel; (b) RATIO / ATTACK / RELEASE trays become **detented GearKnobs** whose detents are exactly the current taught tray values (labels verbatim — compressor copy re-ratified 2026-09-09) | A gain-reduction meter IS the face of a compressor; the data is already real, the meter already exists — this is recognition for near-zero honesty risk. Knob detents keep the discrete-taught-values pedagogy | **M** (a alone: **S**) |
| 4 | **VerticalFader → gear skin** — `src\screens\lab\eq\modules\eqBits.tsx:26` (used by `GraphicTruth.tsx:164`, `GraphicVsParametric.tsx:110`, `gain\gainViz.tsx:135`) | The 3 px line + grey block becomes a mini slot + capped fader (GearFader-mini). Gestures untouched — they are the house recipe | A graphic EQ that finally LOOKS like a graphic EQ, and the gain lab's device chain inherits; tiny file, huge recognition | **S** |
| 5 | **Envelope lab ADSR → synth fader bank** — `src\screens\lab\envelope\EnvelopeLabScreen.tsx:101–105` (five `ControlSlider`s from `amp\kit.tsx`) | Attack/Decay/Sustain/Release/Hold as a labelled vertical mini-fader bank — the universal synth-panel idiom | ADSR is the one place a fader bank is the textbook picture of the concept itself; lab stays visual-only and keeps its ILLUSTRATIVE badge | **M** |
| 6 | **De-esser → processor panel** — `src\screens\lab\deesser\DeEsserLabScreen.tsx` (six `ControlSlider`s, lines 190–370) | Threshold/frequency/range as GearKnobs on a small processor faceplate; meters keep their "conceptual" badges verbatim | A single-purpose rack processor is knobs-on-a-half-rack in real life; moderate value, self-contained | **M** |
| 7 | **Modular CUTOFF + FM INDEX → hero GearKnob** — `src\screens\lab\ModularLabScreen.tsx:345` · `src\screens\lab\FmLabScreen.tsx:229` | The one bound continuous param per lab becomes a large filter-style knob (the modular-synth icon); trays stay trays | Synthesis IS knob country; but each is one screen, so it ranks below the shared-kit wins | **S each** |
| 8 | **Oscillator/Noise source pick → rotary selector** — `src\screens\lab\OscillatorLabScreen.tsx:296` · `src\screens\lab\NoiseLabScreen.tsx:252` | Optional: waveform/colour tray rendered as a detented chicken-head selector (function-generator idiom). Tray (with its teaching blurbs) remains the fallback and the a11y path | Nice recognition, but the sticky tray's blurbs are doing real teaching — do not lose them; lowest priority | **S–M** |
| 9 | **SignalChain pills → illuminated buttons** — `src\screens\lab\SignalChainLabScreen.tsx:362–376` | The nine bypass pills on the glass become square lit GearButtons (channel-insert idiom). GR meters there are already real | Cheap coherence win on the capstone screen | **S** |

Everything not in this table is KEEP or LEAVE — detail below, and the do-not-touch list in
Part 4.

## 2.2 Lab-by-lab verdicts

Legend: **KEEP** = already gear-faithful (or inherits from #2/#4 for free) · **UPGRADE** =
convert, as specified · **LEAVE** = gear idiom would hurt clarity; do not force the metaphor.

| Lab / screen | Real-world counterpart | Renders today (cited) | Verdict | Effort |
|---|---|---|---|---|
| **mixing** (Beginning + Advanced) | Console channel strips | Stepper-button cards (`mixing\kit.tsx` MiniConsole) | **UPGRADE → GearStrip** (Part 1) | L |
| **FxLab: compression / gate / limiter** | Rack dynamics: knobs + GR meter | One ParamLane (threshold) + trays; GR as TEXT only (`FxLabScreen.tsx:305–347`); real `GrMeter` exists unused (`fxViz.tsx:706`) | **UPGRADE** — wire real GR meter; detented knobs | M |
| **FxLab: EQ / delay / reverb / chorus / flanger / phaser / distortion / phase / stereo** | FX rack units / pedals | One ParamLane + sticky trays w/ teaching blurbs (`fxLabConfigs.tsx` per-variant lines) | **KEEP** + inherit lane skin (#2); trays' blurbs are pedagogy, not a compromise | — |
| **eq** (15 modules) | Parametric/graphic EQ | Rack docks + the real `GraphicBoard` vertical fader bank (`eqBits.tsx`) | **UPGRADE** the VerticalFader skin (#4); rest KEEP | S |
| **gain** | Signal-chain rack devices | Already draws rack devices with screws, nameplates, SIG/CLIP LEDs, TRS patch cable (`gain\gainViz.tsx:337,358`) + VerticalFaders per stage | **KEEP** — inherits #4; already the strongest device skeuomorphism among labs. Visual-only (no audio imports in `gain\`) and honest about it | — |
| **meter** | Metering instruments | Displays already photoreal (classic VU `meter\vizMeters.tsx:730`, screws :198, bezel wells :440,668); controls are dock keys | **KEEP** — displays are the teaching object; inherits #2 | — |
| **foundations** | Test-bench generator | 14 RackUnits, faders/trays/toggles (`FoundationsCourseScreen.tsx`), real ApeDsp audio | **KEEP** — inherits #2 | — |
| **digital** | Converter bench | Rack grammar throughout (`digital\modules\*`), Sampling module real audio | **KEEP** — inherits #2 | — |
| **tube** | Tube amp internals | Glass-envelope stage art (`VacuumTubeLabScreen.tsx` CutawayViz :288); dock controls; visual-only, says so on screen (:156) | **KEEP** — the tube is the hardware; inherits #2 | — |
| **wave** (16 modules) | Room acoustics — no device | Conceptual physics visualisers on WaveLayout/rack (`wave\modules\waveLayout.tsx:46`); pure-JS model, badged | **LEAVE** displays (a room is not a rack unit); inherits #2 for its lanes | — |
| **patchbay** | Patchbay jack field | Tap-to-patch jack field, bay, spring cutaway (`patchbay\art\PatchPairView.tsx`, `StudioBayView.tsx`, `JackCutaway.tsx`) | **KEEP** — the house benchmark for drawn-hardware-you-operate | — |
| **micspeaker** (Mic Principles + Speaker Coverage) | Microphones/speakers themselves | Drag-on-display polar/distance/placement surfaces (`micspeaker\viz.tsx:1059,1194,1576,2743,2134,2429`); visual-only, says so | **KEEP** — direct manipulation of the pictured device beats adding panel chrome | — |
| **bass** | Instrument fretboard | True-geometry tappable SVG fretboard (`BassLabScreen.tsx:551`) + mode/string trays + fret/node lane | **KEEP** — already instrument-shaped | — |
| **modular** | Modular synth | Patch diagram + chips + CUTOFF lane (`ModularLabScreen.tsx:345`), real ApeDsp | **UPGRADE-lite** — hero cutoff knob (#7) | S |
| **FM** | FM synth | INDEX lane + trays + STRIKE action (`FmLabScreen.tsx:229,276`), real audio | **UPGRADE-lite** — index knob (#7) | S |
| **oscillator / noise** | Function generator | Trays only, no fader (`OscillatorLabScreen.tsx:296`, `NoiseLabScreen.tsx:252,289`), real audio | **UPGRADE-optional** — rotary selector (#8), tray stays the a11y/teaching path | S–M |
| **signalchain** | Channel insert chain | Tappable pills on glass + the fleet's only real GR bar meters (`SignalChainLabScreen.tsx:362–376,400–411`) | **UPGRADE-lite** — pills → lit buttons (#9) | S |
| **envelope** | Synth ADSR panel | Five ControlSliders (`EnvelopeLabScreen.tsx:101–105`), visual-only by design | **UPGRADE** — ADSR fader bank (#5) | M |
| **deesser** | De-esser half-rack | Six ControlSliders + tappable path diagram (`DeEsserLabScreen.tsx:190–370`), visual-only, meters badged conceptual | **UPGRADE** — knob panel (#6), badges verbatim | M |
| **amp** (8 modules) | Amplifier bench | 19 ControlSliders + segmented pickers + scope-rig transport (`amp\AmpRig.tsx:275–285`), visual-only | **LEAVE** core (the scope rig is a measurement view, not an amp front panel); optional: DRIVE/level sliders inherit any future shared-slider skin | — |
| **eartraining** | None — blind listening | Transport + answer chips, real audio (`eartraining\EarModuleScreen.tsx:418–488`) | **LEAVE** — deliberately anti-visual; gear dressing would bias and distract from listening | — |
| **tuning** (14 chapters) | None — math/ratios | Btn/RatioTile/DragRail/keyboard (`tuning\components\`), real audio bursts | **LEAVE** — conceptual; a cents rail is not hardware and should not pretend | — |
| **harmonic** (HarmonicStems) | Additive synth stems | 12 draggable stems w/ select/solo/phase sheet (`HarmonicStems.tsx`), real ApeDsp | **LEAVE** — the stems ARE the spectrum display; fader caps on them would clutter the chart they teach from | — |
| **harmonograph** | The harmonograph machine | Machine drawing + OSC1/OSC2/PLAT lanes (`HarmonographLabScreen.tsx:373–399`) | **KEEP** — it already depicts its own device; inherits #2 | — |
| **binaural** | None (spatial hearing) | Drag-the-source overhead stage + AZ/DIST lanes (`BinauralLabScreen.tsx:494–539`), real engine | **LEAVE** — a plan view is the correct representation, not a panel | — |
| **autotune** | Plugin (software) UI | AMOUNT lane + SPEED tray (`AutotuneLabScreen.tsx:256–288`), real audio | **LEAVE** — its real-world counterpart is software; hardware skin would be a false referent | — |
| **speech / micselect / cable / cableinstall / connectorselect / amplitude** | Anatomy, photos, decisions | Tap-based decision/anatomy surfaces; cable labs use real photography (`cable\connectorImages.ts`), cableinstall's rich SVG hardware art (`cableinstall\cableArt.tsx`), connectorselect's tester Lamp (`connectorselect\art.tsx:222`) | **LEAVE** — these already show real gear as subject matter; their controls are answers, not operations | — |
| **calc** | Calculator | Numeric inputs/pickers (`calc\`) | **LEAVE** — not an audio-control surface | — |

## 2.3 Cross-cutting facts the ranking rests on

- The labs contain **zero rotary knobs**; the app's only rotary (`JogWheel.tsx`) and its
  photoreal pushbutton (`SwitchButton.tsx`) are used solely by Dashboard/CourseSelection.
- **One** continuous control serves every rack lab (`ParamLane`, horizontal) — which is
  exactly why upgrade #2 is the leverage play.
- Three parallel generic slider implementations exist (`amp\kit.tsx` ControlSlider ×30 call
  sites, `foundations\bits.tsx` DragSlider ×~30 app-wide, `rack\ParamLane.tsx`) — the gear kit
  is also the long-term consolidation path.
- Real audio labs: eartraining, foundations, digital (sampling), eq (native FX), tuning,
  mixing, and every ApeDsp root screen (fx, modular, oscillator, noise, signalchain, bass,
  autotune, binaural, fm, harmonic, harmonograph). Visual-only (honest, badged): gain, meter,
  micselect, micspeaker, patchbay, speech, tube, wave, amp, amplitude, envelope, deesser,
  cable, cableinstall, connectorselect. Any re-skin must preserve every honesty badge
  verbatim and add no unwired displays.

---

# PART 3 · THE SHARED GEAR KIT

One kit, drawn once, used everywhere — no five hand-rolled knobs. Proposed home:
`src\components\gear\` (beside `JogWheel.tsx`/`GlassButton.tsx`/`SwitchButton.tsx`, which it
extends; tools may reuse it, so it does not live under `screens\lab\`).

All components share: the world-fixed light (overhead key 30° viewer-left — `JogWheel.tsx`
convention), 44 pt minimum hit targets with invisible slop, `usePulseStyle` breathing on
interactive members, reduced-motion compliance via `animationsAllowed()`
(`src\features\settings\a11y.ts`), and the capture-at-start / release-only-horizontal gesture
recipe (`eqBits.tsx:57–77`).

### GearKnob
```
{ label: string; value: number; min: number; max: number;
  defaultValue?: number;              // double-tap target (pan: centre)
  onChange: (v: number) => void; onActive?: (a: boolean) => void;
  format: (v: number) => string;      // spoken + legend text
  size?: 'S'|'M'|'L';                 // 32 / 40 / 56 pt
  detents?: { value: number; label?: string }[];  // taught values; haptic snap
  detentOnly?: boolean;               // selector-switch mode (osc waveform)
  centerDetent?: boolean;             // pan behaviour
  taper?: 'lin'|'log';
  tint?: string; level?: boolean;     // level ⇒ readout via levelColorForDb
  a11yLabel: string; step: number;    // increment/decrement quantum
  disabled?: boolean; }
```
Role `adjustable`; increment/decrement = `step`; long-press = FINE (10×); tap-the-legend opens
NudgePopup. SVG, static shading; arc ticks printed on the parent faceplate, pointer amber.

### GearFader
```
{ valueDb: number; min?: -60; max?: +12; unityDb?: 0;
  taper?: FaderLaw;                   // the §1.3 anchor table by default
  onChange: (db: number) => void; onActive?: (a: boolean) => void;
  height?: number;                    // 160 default; 108 'mini' for GraphicBoard
  orientation?: 'vertical'|'horizontal'; // horizontal = the ParamLane re-skin
  showScale?: boolean; format: (db: number) => string;
  a11yLabel: string; step?: number;   // a11y increment, 1 dB default
  level?: boolean; disabled?: boolean; }
```
Cap/slot drawing from `PresetFader.tsx`; relative drag, FINE long-press, double-tap-unity,
rubber-band ends; NudgePopup via the paired ValueWindow. The `mini` height drops the printed
scale to end ticks + centre tick (GraphicBoard's current visual budget).

### GearButton
```
{ label: string; lit: boolean;
  litColor?: 'red'|'amber'|'gold'|'green';   // theme tokens only — never sampled from photos
  shape?: 'square'|'round'; size?: number;    // visual pt; hit stays ≥44
  onPress: () => void; onLongPress?: () => void;
  a11yLabel: string; selected?: boolean; }
```
Starts from `SwitchButton.tsx`/`GlassButton.tsx`: engraved cap, ~2 px key travel, LED glow
when lit. Role `button` + `accessibilityState.selected`.

### ScribbleStrip
`{ name: string; onPress?: () => void; a11yRole?: 'header' }` — the tape name plate (§1.6).

### StripFrame / ConsoleFrame
`StripFrame { width?: 96; children (zone slots: input / blinds / pan / buttons / fader /
scribble) }` — one strip's faceplate with engraved separators and blind-panel support.
`ConsoleFrame { children; channelsLabel: string }` — the shared rack panel + horizontal
scroller + the existing swipe cue + visible indicator (kit.tsx behaviour preserved).

### ValueWindow
`{ text: string; db?: number; tag?: 'FINE' }` — mono LED-style window; when `db` is given the
text tints via `levelColorForDb` (`levelColor.ts`) — the sanctioned way the amplitude ramp
enters the strip. Tap opens NudgePopup when paired with a control.

### NudgePopup
`{ title: string; readout: string; actions: {label, delta|set}[]; onClose }` — compact modal
(house `DimModal`, as `PresetFader.tsx` uses); 44 pt steppers; the universal WCAG 2.5.7
alternative for every knob and fader in the kit. Popups stay compact per the audio-tool UI
standard; in landscape/fullscreen labs any notice text stays at the bottom.

### GrMeterFace (adoption, not creation)
The real `GrMeter` (`src\features\lab\fxViz.tsx:706`) framed in the meter lab's bezel language
(`meter\vizMeters.tsx`) for the FxLab dynamics stages. Input: real `fxGrStatus()` only — the
component refuses decoration by construction (no data prop, no meter).

**Consolidation path (later, not this pass):** ControlSlider (`amp\kit.tsx:137`), DragSlider
(`foundations\bits.tsx:138`) and ParamLane converge on GearFader variants — one gesture
engine, one skin, thirty-plus call sites. Not required for any upgrade above; noted so the
kit's API is designed to absorb them.

---

# PART 4 · DO NOT TOUCH

Where the current presentation is already right, or where hardware skin would damage teaching:

1. **patchbay** — `src\screens\lab\patchbay\art\*`: the jack field, bay and spring cutaway are
   the house benchmark for operable drawn hardware. Owner already rates it good.
2. **eartraining** — `src\screens\lab\eartraining\EarModuleScreen.tsx`: blind listening is the
   pedagogy; visual gear would bias answers and add noise. Chips stay chips.
3. **tuning** — `src\screens\lab\tuning\`: ratios, commas and cents are mathematics; the
   DragRail/keyboard/ratio tiles are conceptual instruments, not hardware surrogates.
4. **meter lab displays** — `src\screens\lab\meter\vizMeters.tsx`: already photoreal, already
   honest; re-skinning its dock keys as knobs would add nothing a reader of meters needs.
5. **gain lab device chain** — `src\screens\lab\gain\gainViz.tsx`: already draws the rack.
6. **micspeaker drag displays** — `src\screens\lab\micspeaker\viz.tsx`: dragging the pictured
   mic/speaker directly is stronger than any panel between finger and object.
7. **bass fretboard** (`BassLabScreen.tsx:551`), **harmonograph machine**
   (`HarmonographMachine.tsx`), **tube cutaway** (`tube\VacuumTubeLabScreen.tsx`) — each
   already depicts its own device.
8. **wave / binaural / amplitude / envelope-chart / speech / amp scope-rig visualisers** —
   conceptual physics and anatomy views. A room mode, a head plan, an ADSR curve and a larynx
   are not rack gear; forcing panel chrome onto them would teach a false referent. (Envelope's
   CONTROLS upgrade in #5 does not touch its ILLUSTRATIVE-badged chart.)
9. **autotune** — its real-world counterpart is a software plugin; hardware skin = wrong lesson.
10. **cable / cableinstall / connectorselect / micselect** — decision-and-anatomy labs whose
    gear realism already lives in photography and scene art; their buttons are ANSWERS, and
    answers should look like answers.
11. **calc** — calculators are calculators.
12. **Every honesty badge and "no audio playback" notice** in the visual-only labs — carried
    through any re-skin verbatim, in its current position.
13. **All ratified copy** — mixing (2026-09-11), compressor + RF (re-ratified 2026-09-09),
    patchbay, connector-select, and the rest of the governed sheets: layout may re-house
    strings; no string changes without owner ratification (additions list in §1.7.5).

---

# PART 5 · Decisions this pass needs from the owner

1. **SOLO on the mixing strip** — approve adding it (client-derived mutes; §1.5) or ship
   MUTE-only.
2. **New chrome strings** for ratification: "SOLO", "FINE", "UNITY", "CENTRE", "−∞", "EQ",
   "SENDS" (§1.7.5).
3. **Level-slider colour standard vs photoreal fader slot** — confirm the GearFader exemption
   with the ramp speaking through the value window instead (§1.3 Honesty).
4. **Build order** — recommended: #2 (ParamLane skin) → #1 (GearStrip) → #3a (GR meter) →
   #4 → #3b → #5/#6 → the S-tier options (#7–#9).

---

# BUILD LOG — what was actually implemented, 2026-09-11 evening

Written after the fact against the plan above. Every item device-passed by the
owner except where stated.

| # | Item | State | Commits |
|---|---|---|---|
| 1 | **GearStrip channel strip** — gear order, non-linear fader taper, pan pot, illuminated MUTE, scribble strip at the bottom | ✅ **device-passed** | `29eb2a78` |
| 2 | **ParamLane console-fader skin** — ~15 rack labs in one file | ✅ EQ device-passed; other rack labs inherit, untested | `35d0a7f7` |
| 3 | **GR meter in the dynamics labs** | ✅ built; **needle never seen moving** (web sim has no engine) | `1171f20d`, `1e4d9a20` |
| — | Drag-vs-scroll: PagedLab scroll-lock provider | ✅ device-passed | `32081def` |
| — | Pan band off-limits to the channel scroller | ✅ device-passed | `2c7ed895`, `9327e8e6` |
| — | Double-tap → home (unity / centre / declared) | ✅ built | `35d0a7f7` |
| — | SOLO on the scribble strip + solo-in-place render | ✅ built, **not yet heard** | `2c7ed895` |
| — | Pan readout above the pot | ✅ | `fbf82eed` |
| — | **Dynamics envelope follower** (see below) | ✅ preview-verified | `4c11e317`, `0407aa6b` |

## The finding that mattered most: the dynamics heroes had no time domain

Owner, device pass: *"the waveforms in the compression lab do not look correct
according to the settings I'm inputting."*

They were right, and the cause was structural rather than cosmetic. The
`dynamics` anim model carried threshold, ratio, range, ceiling and makeup — and
**not attack or release**. `DynamicsFlow` applied the static transfer curve
instantaneously at every point, i.e. it drew a **zero-attack, zero-release
compressor**: exactly the thing the lab exists to teach you a compressor is not.
Switching `0.5 ms FAST` to `25 ms PUNCH` moved nothing, while the tray's own
blurb promised "the first 25 ms sneak through untouched".

Two changes were needed, and **one alone would not have worked**:

1. **The envelope follower.** A real one-pole follower now runs along the OUT
   path — attack coefficient while reduction deepens, release while it recovers
   — with a one-burst pre-roll, because a follower is causal and starting from
   zero paints a fake first hit at the panel edge every frame.
2. **The test signal had to change.** The old input was a 4.5-second sine swell,
   and a compressor tracks a slow swell almost perfectly *whatever* its time
   constants are. A correctly-wired follower on the old wave would STILL have
   shown almost no difference. ⚠️ **The visual was not merely un-wired, it was
   un-wireable — the test signal could not express the parameter.** The input is
   now a repeating transient, which is the signal the lab's own copy describes
   and already offers as a source (`srcClick` at 120 BPM).

**The general lesson, worth more than the fix:** when a control appears not to
work, check whether the *test signal* can express it before assuming the maths
is wrong. A parameter can be perfectly implemented and still invisible.

## The sweep that followed

Applying the morning's lesson (one complaint, three surfaces), all twelve effect
configs were diffed: declared `paramId`s vs `paramId`s the `anim()` mapping
reads.

- **Real, fixed:** gate `holdMs` — same class, only drawable once the follower
  existed (hold is state over time, not a function of level).
- **False positives:** `modMode` on chorus/flanger/phaser — a FIXED param that
  already selects the hero's flavour by another path.
- **Honest omissions, now recorded rather than unnoticed:** delay `dampHz`,
  reverb `reverbDampHz` (a monochrome trace is the wrong instrument for a
  filter), distortion `oversample` (no waveform-visible consequence), stereo
  `bassMonoHz` and phase `widthPct` (stereo-image params; the hero draws one
  trace).

## Device pass — the dynamics hero, after the fix

✅ **Owner confirmed the compression lab's controls now drive the display.**

⚠️ **What cured it is NOT established.** Between the report and the confirmation
two things changed: the `Math.exp`-per-sample hoist (`c1db13d3` — ~340
transcendentals per frame per lab on the UI thread, down to ~5), and a reload.
"Reloaded and it works" is equally consistent with the perf fix curing a
stutter and with the device having been on a stale bundle the whole time. Both
remain plausible; neither is proven, and the perf fix is worth keeping on its
own terms regardless — 340 exp/frame violated this file's own standards header.

**The trap worth remembering** is that the compression lab has TWO displays and
only one of them can answer the question being asked of it. The animated hero
has a time axis and shows attack/release; **DESIGNED RESPONSE is a transfer
curve, which is time-independent by definition and CANNOT show them, ever.**
Changing ENV and watching the curve will always look broken. That is correct
behaviour, and it is not signposted anywhere on screen.

## Open for the owner

1. **The GR needle has never been seen moving.** The web sim has no audio
   engine; this needs a device pass with the source over the threshold. The
   specific question: does 20 Hz make a fast vs slow RELEASE legible? If not,
   the honest fix is engine-side peak-since-last-read — a native change.
2. **SOLO has never been heard**, only seen. Solo-in-place is wired into
   `renderMix`; it needs one listen to confirm.
3. **The dynamics hero now has a stated time base (900 ms) that appears nowhere
   on screen.** Saying so would be new copy and needs ratification.
4. **`home` values are declared nowhere.** Double-tap-to-home works on the
   mixing fader (unity) and pan pot (centre), but no rack-lab fader declares
   its `home`, so the lane's double-tap is inert. Walking the ~15 configs is
   mechanical but needs judgement: a gain has an honest unity, a delay time
   does not.
5. **Rack labs other than EQ have not been looked at** since inheriting the new
   lane.
