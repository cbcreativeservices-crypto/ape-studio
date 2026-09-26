# Lab legibility pass — FULL SCREEN + 9 pt labels in eleven more labs (2026-09-25 → 26, overnight)

Brief: `docs/LAB_FULLSCREEN_AND_9PT_HANDOFF_2026_09_25.md`. Owner's rulings that night, added to the brief:
*"full screen should still be interactive with the controls locked at bottom … the user must still be able to
adjust and view their changes to controls"* — and afterwards *"wire in the actual bass note recordings that are
in the DB to the bass guitar lab"*.

**Everything below is committed on `audio-tools-engine` and NOT published, NOT built.** Rule met: no text on a
lab display renders under 9 pt at phone width 375 and 390 (normal height ≥ 700). Every display in the eleven labs
has a FULL SCREEN view (zoom 1× / 1.5× / 2× / 3×, drag to pan, every orientation, honesty badge along) **with the
lab's controls docked at the bottom of it** — and Sound Systems, which had a view-only full screen, now has its
dock in there too.

## 1 · The shared pieces (rack/, kit/)

| Commit | What |
|---|---|
| `f3be3797` | FULL SCREEN moved into the shared rack. `RackStage.fullScreen` (opt-in): the RackUnit owns the modal and renders its own dock (fader lane + keys) and trays INSIDE the full-screen view, sharing state — one lane, one bound param, one open tray whichever surface is showing. The tray backdrop is clear in there (`DockTray dim={false}`) so the drawing stays bright for A/B. `StageTextScale` context (+ `useStageTextScale()`) = rendered width ÷ glass width, for React-Native text laid over Skia canvases (the Skia trap). `StageFit` / `StageBox` moved to `rack/StageFit.tsx`. `kit/ExpandableFigure` for figures NOT on a rack: the figure as before, a "⤢ FULL SCREEN" button directly UNDER it, a `controls` slot for the page's own controls (rendered twice, state lives in the page). Sound Systems migrated (`fullScreen: rack.fullScreen !== false`). |
| `7a397c3c` | Dev harness `#labpreview/<Screen>/<id>` (App.tsx) — any lab screen in the web preview by name, for measuring. |
| `eeece891` | Full-screen title shrinks on one line (a long title pushed the zoom row and clipped ✕ at 390 — found by the Speech pass). |
| `62ae564b` | The zoomed drawing pans SIDEWAYS: the outer scroller no longer centres its child, so the inner horizontal scroller is the viewport's width and owns the overflow (found by the Sound Systems re-check; the bug predates tonight — 2× and 3× could not be dragged left/right). |

Verified in the harness: Sound Systems LEARN 1 full screen shows the STATION lane + STATION / STAGE IN / HOUSE keys
at the bottom; STAGE IN opens its tray over the dock with the map still bright; picking Analog snake redraws the map;
at 2× the horizontal scroller reports 748 px of content in a 390 px viewport and moves.

## 2 · Before / after — every lab, every display (smallest text on the display, pt)

Measured in the web preview (own server on 8092) by an in-page walk: SVG text = font-size × the text's screen
transform (`getScreenCTM`, both axes — so a `preserveAspectRatio="none"` stretch shows up as sx ≠ sy); React-Native
text = its computed font size; nothing in these labs paints words INTO a Skia canvas, so every number is measured,
none estimated. "Under 9" counts labels under 8.95 after the change. "FS" = FULL SCREEN present, with the controls
that dock under the drawing.

### 2.1 Cable Dressing & Installation (`26fb82d3`) — 360-unit drawings render 358 px at 390, 343 at 375
| Stage | Before @390 | After @390 | After @375 | Under 9 | FS |
|---|---|---|---|---|---|
| 5 Support (SpanArt) | 7.8 | 10.14 | 9.67 | 0 | yes — P1–P5 + CHECK SPACING |
| 7 Walls (RoomSvg) | 8.9 | 10.44 | 10.0 | 0 | yes — X-RAY toggle |
| 9 Floor (StagePlan / FohPlan / BackstagePlan / CoilArt) | 6.96 (18 of 26) | 9.94 | 9.51 | 0 of 31 | yes ×4 — the three calls / route cards / coil buttons |
| 10 Signal (FieldArt) | 6.5 (5 of 5) | 9.93 | 9.53 | 0 | yes — source chips, exposure, DISTANCE, step/balanced chips |
| 11 Building (BuildingArt) | 5.5 (6 of 6) | 9.94 | 9.51 | 0 | yes — three space pickers |
| 12 Identify (SystemArt / SlackArt) | 6.5 (8 of 8) | 9.93 / 11.39 | 9.53 / 10.9 | 0 | yes ×2 — service-loop slider + notes + confirm |
| 13 Final Inspection (FacilityScene) | 7.9 (19 of 20) | 10.44 | 10.0 | 0 of 19 | yes — markers tappable at 1× and 2×; counter + opened finding |

Moved (meaning kept): "MAX SAG ½ UNIT" below the guide with a tick; "PERFORMER LANE" on a dark tag painted last;
"AISLE (EGRESS)" split either side of route A; "SVC DOOR" two lines; "OVERHEAD · RATED PTS" → "OVERHEAD / RATED
POINTS" where route C lands; "DOCK" painted after the band that hid it; "LOAD-IN / FORKLIFT" → "… FORKLIFT PATH";
"MON WORLD" two lines; "RATED + MARKED" below the protector; "DOOR SWING" under the arc; the Stage 10 source ROLE
line moved out of the drawing into the caption under it; "BALANCED + SHIELD" → "BALANCED / + SHIELD"; the Stage 11
"RATED · SEE PLANS" placard to the right of the sleeve; Stage 12 patch lanes respaced; Stage 13 "EQUIP ROOM" under
the rack and "STAGE" lower-right, clear of every pooled finding position. Nothing dropped; photos and
`defectArt.ts` untouched.

### 2.2 De-Esser & Sibilance Control (`6293cb24`)
| Page | Before @390 (under 9) | After @390 | After @375 | Under 9 | FS |
|---|---|---|---|---|---|
| 1 What Sibilance Is | 8.5 (26 of 27) | 9.45 | 9.06 | 0 | yes ×2 — ‹ › JUMP TO AN S + readout |
| 2 Why EQ Is Not Enough | 8.5 (54 of 54) | 9.47 | 9.07 | 0 | yes — EQ / DE-ESSER toggle |
| 3 The Detection Path | 8.5 (11) | 9.45 | 9.06 | 0 | yes — block card + NEXT BLOCK / WALK THE SIGNAL |
| 4 Threshold | 8.5 (30) | 9.46 | 9.08 | 0 | yes — threshold slider + crossing count |
| 5 Choosing the Frequency | 8.5 (9) | 9.45 | 9.06 | 0 | yes — frequency + width sliders, sibilant chips |
| 6 Reading Gain Reduction | 8.5 (30) | 9.46 | 9.08 | 0 | yes — range + threshold + peak line |
| 7 Broadband vs Split-Band | 8.5 (26 of 27) | 9.45 | 9.06 | 0 | yes ×2 — mode toggle + stepper |
| 8 Over-De-Essing | 8.5 (18) | 9.48 | 9.07 | 0 | yes — "how hard" slider + stage eyebrow |
| 9 Connections & Check | no drawing | — | — | — | — |

Page 2 declutter: the two stacked strips (54 labels) are ONE drawing sharing one x-grid; the legend once; the
fifteen identical "−8" numbers became one lane line ("−8 dB ON EVERY FRAME — VOWELS AND GAPS TOO", only when the
model says every frame loses the same); de-esser mode keeps per-frame numbers on the frames that lose something.
Figure titles/captions moved out of the SVG onto the page. `preserveAspectRatio="none"` stretch gone (sx = sy).

### 2.3 Wave Physics Laboratory (`58b6fe79`) — 16 modules, all labels React-Native text over Skia
| Module | Before @390 | After @390 / @375 | Under 9 | FS |
|---|---|---|---|---|
| Reflection, Diffusion, Comb, Echo, Reverberation | 8 (walls) + 8 ray labels overlapping | 9 / 9 | 0 | yes |
| Absorption, Interference, Standing wave, Coverage, Line array, Delay align, Cardioid sub, Beam steer, Room Builder | 8 (walls) | 9 / 9 | 0 | yes |
| Refraction, Diffraction | 8 (scene labels) | 9 / 9 | 0 | yes |

The five fanned arrival labels ("19.9 ms / −5 dB", colliding) are now one legend stack beside the head, one row
per arrival in time order in its tick's colour on a dark halo — same numbers, nothing dropped. Bezel truncations at
375 fixed: Echo (5 → 4 cells: DIRECT · GAP · 1ST REFL · ECHO; the dropped cell = DIRECT + GAP, still in the well),
Refraction (whole m/s on the bezel, 0.1 m/s in the well; "RAY @150m" → "RAY 150m"), Diffusion ("SPECULAR" →
"MIRROR", "SCATTERED" → "SCATTER" on the bezel; the well and prose keep "specular"), Room Builder ("12.0×8.0" →
"12×8"). Labels grow in full screen (≈18 pt at 2×); `RoomSceneView` reports the room's aspect so the zoomed canvas
is the room's shape.

### 2.4 Visual Audio Analysis — the meter lab (`a360c57f`)
| Module | Before @390 (under 9) | After @390 / @375 | Under 9 | FS |
|---|---|---|---|---|
| Waveform | 7 (6) | 9 / 9 | 0 | yes — GAIN lane, DC, SIGNAL, Ø POL, DC→0 |
| Peak Meter | 6.5 (14) | 9 / 9 | 0 | yes — GAIN, SIGNAL tray opens inside |
| VU | 6.5 ("PEAK", 1) | 9 / 9 | 0 | yes |
| Loudness | 9 (0) | 9 / 9 | 0 | yes |
| Spectrum | 8 (14) | 9 / 9 | 0 | yes |
| Spectrogram | 7.5 (5) | 9 / 9 | 0 | yes |
| Waterfall | 10 (0) | 10 / 10 | 0 | yes |
| Phase / Correlation | 7 (8) | 9 / 9 | 0 | yes |
| Stereo | 7 (3) | 9 / 9 | 0 | yes |
| Scope | 7 (2) | 9 / 9 | 0 | yes |
| Signal Detective | 7 (6) | 9 / 9 | 0 | yes — PREV / NEXT |

`Lbl` (vizMeters) floors at 9 × StageTextScale; a new `Ax` helper does the same in vizSpectral; every text-holding
gutter scales so nothing collides at 2×. Nothing shortened or dropped. The shared SPL / RTA / Waveform tools were
re-checked after the `Lbl` change: LED meter captions 8 → 9 fit, nothing clipped, no tool needed an opt-out.

### 2.5 Speech & Voice (`309e60b3`)
| Page | Figure | Before @390 (under 9) | After @390 | After @375 | FS |
|---|---|---|---|---|---|
| 1 The Speech System | HeadCrossSection | 9.03 (0 of 13) | 10.74 | 10.29 | yes — readout + 11 part buttons |
| 2 How a Voice Is Made | stage strip · head | 8.5 (5 of 10) | 9.50 · 10.74 | 9.50 · 10.29 | yes — strip + PREVIOUS / NEXT STAGE / PLAY |
| 3 Voiced vs Unvoiced | VocalFolds | 8.5 (1 of 4) | 9.48 | 9.07 | yes — UNVOICED / VOICED |
| 4 Vowels & Formants | VowelChart · FormantChart | 8.5 (17) | 9.48 · 9.45 | 9.06 | yes ×2 — vowel buttons |
| 5 Consonant Families | energy band | 8.5 (9) | 9.44 | 9.08 | yes — family buttons |
| 6 Why Pop Filters Work | PopFilterDiagram · TraceChart | 8.5 (5) | 9.46 · 9.45 | 9.08 | yes — NO FILTER / WITH A POP FILTER |
| 7 Why Sibilance Exists | SpectrumBars | 8.5 (10) | 9.48 | 9.07 | yes — VOWEL / "S" |
| 8 The Distance Effect | DbBars | 8.5 (11 of 16) | 9.46 | 9.06 | yes — 1" / 6" / 12" |
| 9 Voices Differ | RangeBars | 8.5 (8 of 11) | 9.47 | 9.07 | yes (static) |
| 10 Speech Problem Simulator | spectrum / waveform | 8.5 (10) | 9.48 | 9.07 | yes — 8 problem chips, one wrapper hosts both |

All under 9 after: 0. Wording changes: `folds apart · open "V" for breathing` → `folds apart · the breathing "V"`;
the vowel-chart tongue caption moved to the left edge. Fixed in passing: page 9 rendered a developer note as
learner text. `preserveAspectRatio="none"` gone everywhere.

### 2.6 Foundations of Sound — course + Playground (`fa535552`)
The handoff's script missed a CSS `transform: scale` on M7 and M11: they really rendered at **7.33** and **7.23**.
| Screen | Before @390 | After @390 / @375 | Under 9 | FS |
|---|---|---|---|---|
| M1, M5, M8, M12, M13 | 12 | 12 | 0 | yes |
| M2, M3, M4, M10, M14 | 8.5 | 9 | 0 | yes |
| M6 Wavelength | 8.5 | 9 | 0 | yes |
| M7 Dual Domain display | 7.33 (19) | 9 (20.8 at 2×) | 0 | yes — PROBE lane, FREQ tray opens inside |
| M9 Loudness vs Amplitude | 7 (12) | 9 | 0 | yes |
| M11 Harmonics | 7.23 (7) | 9 (20 at 2×) | 0 | yes |
| Playground | 8.5 (7) | 9 (18.3 at 2×) | 0 | yes — the three views at full height each |

M9 "YOU SEND — same at every Hz" moved from the curve's HF fall to the left end above the line; its dB numbers
7.5 → 9 with a wider gutter; "WHAT YOU HEAR — LEVEL × EAR CURVE" 7 → 9 on its own band. Nothing shortened or
dropped. Dual Domain / Harmonic Stacker now paint through a scaled Skia group so their fixed heights grow with the box.

### 2.7 Mic Principles (`3107cbb7`)
| Tab | Before @390 (under 9) | After @390 / @375 | Under 9 | FS |
|---|---|---|---|---|
| Proximity | 8.0 / 8.5 (12) | 9.0 / 9.0 | 0 | yes — dock + MIC tray inside |
| Off-Axis | 8.0 / 8.5 (12) | 9.0 / 9.0 | 0 | yes — dock + PRESET tray (picking 90° redrew the curve) |
| Capsule (cut-away) | 9.73 (0) | 9.73 / 9.3 | 0 | yes — ExpandableFigure, no controls (pure reading) |
| Polar, Distance, Stereo, Plosives, Handling, Hand Grip, Mistakes | 9.5–12 | unchanged | 0 | no (out of scope) |

"dB" moved from the top-left corner (collided with the ceiling label at 9) to a right-aligned heading over the dB
column. Nothing shortened or dropped.

### 2.8 Amplifier lab (`78b652c9`) — 360-unit drawings render 332 px at 390, 317 at 375; labels now 10.5 units
| Module | Before @390 (under 9) | After @390 | After @375 | Under 9 | FS |
|---|---|---|---|---|---|
| 1 What | 7.84 (7) | 9.68 | 9.24 | 0 | yes ×2 — input-level slider |
| 2 Devices | 7.84 (11) | 9.65 | 9.24 | 0 | yes ×2 — device selector + control; Np + Ns |
| 3 Bias | 10 (0) | 10 | 10 | 0 | yes ×4 — bias / conduction-angle controls |
| 4 Classes | 10 (0) | 10 | 10 | 0 | yes ×2 — class selector + level + the class's control |
| 5 Class D | 7.84 (16) | 9.66 | 9.24 | 0 | yes ×3 — level (+ "output panel shows") |
| 6 Supply | 7.84 (11) | 9.68 | 9.25 | 0 | yes ×2 — supply selector; level + rail + load |
| 7 Real-world | 7.84 (8) | 9.63 | 9.25 | 0 | yes — the three gain sliders |
| 8 Apply | 10 (0) | 10 | 10 | 0 | yes ×2 — all seven challenge controls, two abreast |

Split onto two lines, same words: DRIVER / OUTPUT, OUTPUT / FILTER, INPUT / CONV., HF / SWITCH, HF / XFMR,
RECT. / REG. "CONTROLLED CURRENT (to load)" → "CONTROLLED CURRENT" (the green wire runs into the LOAD box and the
note under the diagram says "…to the load"). One rig title shortened to one line ("DEVICE CURRENT (gold) — 0 to
full conduction only"; the cutoff/saturation explanation stays in the card). WavePanel's `preserveAspectRatio`
box follows the viewBox ratio at every size. Model files untouched.

### 2.9 EQ Lab — the frequency scale (`8ed7fbc8`) — one graph, many labs
`ResponseCurveGraph` (`src/features/lab/fxViz.tsx`) was a 320-unit viewBox in a 100 %-wide SVG with "meet": at
any width ≥ 320 it drew at exactly 1:1, so its 8-unit tick labels were 8 px on the glass AND in any enlargement.
It now draws at its pixel width, tick labels 9 × max(1, width ÷ 320), the label strip scales with the text, the
edge "20k" is clamped inside the graph. The other fxViz graphs' 7/8 pt labels (Transfer / Echo / Decay) went to 9.
| Module | Before @390 | After @390 | After @375 | Under 9 | FS |
|---|---|---|---|---|---|
| Seeing Frequency, Live Spectrum + EQ | 10 (RN axis text) | 10 | 10 | 0 | yes — axis labels × StageTextScale |
| Why We Use EQ | 8.0 | 9.34 | 9.0 | 0 | yes — chips + GAIN slider |
| Camera Analogy | 8.0 | 9.34 | 9.00 | 0 | yes — room + response as one figure; chips + PAN / ZOOM |
| Parametric Controls, Q & Bandwidth, Filter Shapes | 8.0 | 9.90 | 9.48 | 0 | yes — dock + lane (2× 732×1222, 20.6 px) |
| Filter Slopes, Find Frequency, Match the Curve, Fix the Signal | 8.0 | 10.01 | 9.59 | 0 | yes |
| Graphic vs Parametric, What a Graphic EQ Really Does | 8.0 (scale) / 9 (board) | 9.90 / 9 | 9.48 / 9 | 0 | yes — the fader board under the curve |
| Multi-Band | 8.0 | 10.01 | 9.59 | 0 | yes — node drag works on the glass AND in full screen; BAND tray opens inside |
| EQ Challenges | 8.0 | 9.34 | 9.0 | 0 | yes — the three strategy keys |

Nothing shortened or dropped. Also re-checked where the graph is shared: Wave Comb's secondary curve (340×165,
9 px, no clip), Compression / Gate / Stereo screens (TransferCurveGraph labels 9 at 1:1). Reverb / Delay / Chorus /
Flanger / Phaser use the same measured-width path (no preview hash for them; not screenshotted).

### 2.10 Oscillator Lab — Explore (`20a8fc69`) and Envelope Lab (`2160048d`)
| Display | Before @390 (under 9) | After @390 | After @375 | Under 9 | FS |
|---|---|---|---|---|---|
| Oscillator glass (strip + H1–H12) | 8.0 (12) | 9.0 (18.3 at 2×) | 9.0 | 0 | yes — WAVE tray opens inside |
| Envelope p1 Explorer chart | 8.5 (3) | 9.48 (19.0 at 2×) | 9.06 | 0 | yes — A/D/S/R sliders + the chart's ▶ SWEEP |
| Envelope p2 Gallery · Speech | 8.5 | 9.48 | 9.06 | 0 | yes — presets (Speech static) |
| Envelope p3 Transient | 8.5 | 9.48 | 9.06 | 0 | yes — the three onsets |
| Envelope p4 Duration timeline | 8.5 (18) | 9.48 | 9.06 | 0 | yes — seven numbered buttons |
| Envelope p5 Peak / Avg | 8.5 | 9.48 | 9.06 | 0 | yes — the two shapes |

Nothing shortened or dropped. Envelope p1's Hold + curve toggles + RESET stay page-only (all seven outgrew an
812-tall phone's dock).

### 2.11 Sound Systems — re-check after the migration (no change needed)
Button exactly where it was (drawings yes; ROUTE 2/4–7 bus banks, LEARN 14 power band, OPERATE 1/5 power rack
no). LEARN 1 / 3 / ROUTE 1 / ROUTE 8 / OPERATE 2 still 9.21 / 9.30 / 9.21 / 9.65→9.25 / 9.28→9.25 at 390→375, 0
under 9. Dock + trays inside full screen verified on LEARN 1 (STAGE IN), BUILD 1 (parts bin, placing a part) and
ROUTE 1.

## 3 · Bass Guitar Lab — the real recordings (`db203299`)
PLAY now streams the RECORDING of the selected note from the `lab-audio` bucket: 52 chromatic notes (four strings
× frets 0–12) and 16 natural harmonics (four strings × ½ ⅓ ¼ ⅕), all 72 `bass_fretboard` rows public.
`features/lab/bassSamples.ts` derives the asset key from the selection; `test/bassSamples.test.ts` checks every
derivable key against the published mapping. The additive string model plays only when a recording cannot be
fetched, and the screen says which is sounding. Picking another note while one rings plays the new one; the
transport drops back when the clip ends; stops on blur and on any app-wide mute. Verified: three derived keys
returned signed URLs with the expected durations (playback itself cannot be heard in the harness).

## 4 · Verification
`npx tsc --noEmit -p .` clean; `npm test` **1,995 / 1,995** (was 1,991 — four new guard tests). Every redrawn
display was screenshotted at 390 and 375 and in full screen at 1× and 2× with the dock visible; trays opened inside
full screen on the rack labs; page controls changed the picture inside full screen on the inline-figure labs.

## 6 · Morning walkthrough with the owner (2026-09-26) — five rulings, applied to every full-screen lab

Ruled on Wave Physics · Reflection, then applied everywhere so all labs behave the same:
| Ruling | Where it lives | Commits |
|---|---|---|
| The zoom hint rolls down out of the way on a tap; a `?` chip rolls it back | shared `StageFullScreen` | `800b9a9f` |
| The lab's readouts run across the top of full screen, under the zoom bar | shared (rack bezel passes through); inline-figure labs put their live readouts at the top of the dock | `c3e80579` + per-lab |
| With a tray open, the dock rises above the tray card so lane + keys stay usable, and drops back on close | shared `StageFullScreen` / `RackUnit` / `DockTray` | `f8b9d79d` |
| HIDE DISPLAY / FULL SCREEN row is thinner: 34 pt visible, 44 pt touch target kept by hit slop | shared `RackUnit` (+ guard test) | `2d392040` |
| EVERYTHING in the drawing zooms with the step — objects, glyphs, icons, ticks, strokes, halos, legends, fader boards | per lab | Wave `89cb3917` · Mic `5d80ba6a` · Sound Systems `41f92f3a` · Oscillator `0063c87d` · Foundations `ae5e259b` · Meter `f031688a` · EQ `7cc09e12` · Cable Install `9ce7586c` · De-Esser `205426d2` · Speech `02054a6a` · Amplifier `62ec9832` · Envelope `ab23175b` |

Each lab's parity report (element · glass · 2× · 3×) is in the session scratchpad; every element scales by
the measured step (2.03 / 3.05), nothing in a drawing stays phone-sized. Deliberately kept at size: dock
chrome and genuine controls (Cable Install's 44 pt marker hit areas, the M7 predict-first question).
Tools sharing the meter drawings (SPL / RTA) are unchanged (scale = 1 outside a rack).

## 5 · Not reached / leftovers (the next candidates, not asked for)
- **SE 375×667** reported only, not required (full screen covers it). Landscape not screenshotted.
- **Bezel value truncation** (shared `BezelReadouts`): Loudness meter ("INTEGRAT…", "-15.9LU…"); Sound Systems
  ("REVERB HEA…", "SMALL POWERED-LOU…") — a shared component change; a shrink would go under 9 pt, so it needs
  shorter values or two-line cells.
- Sound Systems LEARN 18 arrival timeline in the well (~5 pt); LEARN 16 / OPERATE 3 ChainMeter's view-built glyph
  row keeps its size in full screen.
- VU and Stereo (meter lab) at 1× full screen fill a tall portrait box with the face low and empty space above —
  legible, not height-filling.
- Cable Install (pre-existing, seen in the harness): after a hard reload with a stored `ape:ciStep`, the stage
  body sometimes does not mount until PREV/NEXT is pressed once (`CableInstallLabScreen.tsx` resume path).
- A page that swaps between two components that each own an ExpandableFigure loses the open modal — host both
  drawings in one wrapper (Speech page 10 does).
- Font-fix-only labs from the handoff §7 (Gain Staging, dynamics GR meter, Digital Audio captions, Mixing console
  page, Calculator header, Patchbay 8.9) — untouched.
