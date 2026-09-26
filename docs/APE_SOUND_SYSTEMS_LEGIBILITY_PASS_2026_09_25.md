# Sound Systems Lab — display legibility pass (9 pt minimum)

2026-09-25 · owner ruling: *"do both - 9 pt minimum"* · client drawing text only (no data, no grading, no DB).

**Rule met:** no text drawn on a display (the glass) renders below 9 pt at phone width 375 and 390 with normal
height (≥ 700 tall). Measured in the `ape-web` preview (localhost:8091, `#soundsystemspreview`), every rack page,
every mode, by a DOM walk. SVG text size is measured as `font-size × getScreenCTM()` scale — i.e. the real rendered
size including every nested transform (a glyph's inner `scale()`), which is stricter than viewBox-fit alone. DOM
text is its computed font size. Region: above HIDE DISPLAY (the glass, its bezel and the honesty badge).

## Before / after — smallest text on each rack page (pt)

"Before" was measured at 390 × 844 on the unchanged code with the brief's formula (viewBox fit only — it
*under*-states nothing on the drawings but misses glyph legends inside standalone glyph SVGs < 40 px wide). The
pre-change code was no longer being served when the 375 pass ran, so the 375 "before" was **not measured**; at
375 the plot, map and strip drawings are height-limited exactly as at 390, and the 354-wide diagrams are ~4 %
smaller than at 390.

| Page | Display | Before @390 | After @390 | After @375 | SE 375×667 (not required) |
|---|---|---|---|---|---|
| LEARN 1 | System map | 2.6 | 9.21 | 9.21 | 7.26 |
| LEARN 2 | System map (bench) | 2.6 | 9.21 | 9.21 | 7.26 |
| LEARN 3 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 5 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 8 | Sub feed router | 5.0 | 9.65 | 9.25 | 7.96 |
| LEARN 9 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 10 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 11 | FOH / monitor split | 5.0 | 9.65 | 9.25 | 8.76 |
| LEARN 13 | Parallel load rig | 3.8 | 10.09 | 9.66 | 9.66 |
| LEARN 14 | Power band | 2.6 | 9.50 | 9.50 | 9.50 |
| LEARN 16 | Gain chain meters | 5.2 | 9.00 | 9.00 | 6.68 |
| LEARN 17 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 18 | Venue plot + delay overlay | 3.6 | 9.30 | 9.30 | 7.33 |
| LEARN 20 | Feedback loop | 3.2 | 9.65 | 9.25 | 8.34 |
| LEARN 21 | System map (bench) | 2.6 | 9.21 | 9.21 | 7.26 |
| BUILD 1–11 | Venue plot | 3.6 | 9.30 | 9.30 | 7.33 |
| ROUTE 1 | Channel strip | 4.1 | 9.21 | 9.21 | 7.26 |
| ROUTE 2 | Bus bank | 8.5 | 9.00 | 9.00 | 9.00 |
| ROUTE 4 | Bus bank | 8.5 | 9.00 | 9.00 | 9.00 |
| ROUTE 5 | Bus bank | 8.5 | 9.00 | 9.00 | 9.00 |
| ROUTE 6 | Bus bank | 9.0 | 9.00 | 9.00 | 9.00 |
| ROUTE 7 | Bus bank | 8.5 | 9.00 | 9.00 | 9.00 |
| ROUTE 8 | Output patch | 5.0 | 9.65 | 9.25 | 8.76 |
| OPERATE 1 | Power rack | 2.9 | 9.00 | 9.00 | 9.00 |
| OPERATE 2 | Line check strips | 4.6 | 9.28 | 9.25 | 7.32 |
| OPERATE 3 | Gain chain meters | 5.2 | 9.00 | 9.00 | 6.68 |
| OPERATE 4 | Feedback loop | 3.2 | 9.65 | 9.25 | 8.34 |
| OPERATE 5 | Power rack | 2.9 | 9.00 | 9.00 | 9.00 |
| TROUBLESHOOT 2–6 | System map (bench) | 2.6 | 9.21 | 9.21 | 7.26 |

The 9.00 rows are DOM text authored at exactly 9 (ChainMeter stage labels, bus scribble strips, power-rack labels).
Document pages (LEARN 4, 6, 7, 12, 15, 19, 22, 23; ROUTE 3; TROUBLESHOOT 1) have no glass and are out of scope; the
TROUBLESHOOT 1 worked example uses the same map, so it reads at ≥ 9.3 there too.

A text-box collision check (every pair of SVG text boxes on the glass, and any text box leaving its drawing) found
**no overlaps and nothing outside a drawing** on any page at 390 and 375, including a probed bench (Intermittent
cable case, six stations read), a patched output panel (a wrong, two right) and a part in hand on BUILD 1. Each
redrawn display was screenshotted at 390 and 375 and looked at.

## How each display was brought to 9 pt

- **Shared numbers.** Plot text is `PLOT_FS` = 13 units (plot draws at 0.715 px/unit → 9.3 pt). Diagrams are
  354 wide and draw at ≥ 0.963 px/unit on a 375 phone, so their text is `FS` = 9.6 units (≥ 9.25 pt). The system
  map is `MAP_FS` = 9.6. The meter drawing is 9.8 units (0.94 px/unit).
- **System map** (`art/SystemMap.tsx`): re-laid out from 354 × 288 to **354 × 246** so it fills the glass's width
  (it was height-limited at 0.82; now 0.96). Rings 21, glyphs 30, lanes 78 apart, columns 66. The lane names run up
  the left edge. Each **cable label is printed under the station it feeds, in the cable's colour** (runs between
  neighbouring stations are too short to carry a readable word). A long reading wraps onto two lines above the
  bottom lane. The "not probed" lamp is larger with a readable "?".
- **Venue plot** (`art/VenueView.tsx`): every word at 13 units with a dark halo, drawn over the floor field so the
  tint never veils it; RISER under the riser's front edge, SR mid-wing, SL above the racks, LIP between the sub and
  the front fill, BARRIER below its line — each where no position's glyph or ring can land.
- **Channel strip** (ROUTE 1): redrawn at 354 × 246 (was 354 × 314, height-limited at 0.75). Block names only.
- **Output patch** (ROUTE 8): 354 × 160; bus on the tape, OUT n, destination on two lines, ✓ / ✗ on the cable.
- **Line check strips** (OPERATE 2), **sub feed router** (LEARN 8), **split** (LEARN 11), **feedback loop**
  (LEARN 20, OPERATE 4): same geometry, words at 9.6 and re-placed to clear the drawing; the processor box widened
  to carry PROCESSOR; long status lines anchored to the right edge.
- **Gain chain** (LEARN 16, OPERATE 3): headroom numbers and the inherited-clip ↑ at 9.8.
- **Load rig** (LEARN 13): 8.5 units (was 8, inside a stray nested `<Svg>` that is now a `<G>`).
- **Equipment glyphs**: the silk-screen legends (IN / OUT, CH1 / CH2, DI, TX · ST — 2–4 pt at any glyph size) are no
  longer drawn on a display (`GearInSvg` always, `GearGlyph legends={false}` on the gain chain, the power band and
  the power rack). The glyphs in cards and on the hub keep them as texture.
- **Bus bank** (ROUTE 2, 4–7): scribble strip 8.5 → 9 and allowed two lines (it was truncating, e.g. "AUX 1 ·
  SINGER'S WEDGE"). **Pre-existing overflow fixed:** the MAIN MIX column on ROUTE 2 listed ten contributors in room
  for six and pushed its own title off the top of the glass; the row budget now uses the real row height (21 pt)
  and ends with the existing "+n more" line.
- **Power rack** labels 8.5 → 9.

## Audio-accuracy self-review — every label shortened, moved or removed

| Where | Was on the drawing | Now | Meaning unchanged? / where it lives |
|---|---|---|---|
| Map, LEARN 1 | NETWORK · BOTH WAYS / MULTICORE + RETURNS (on the run) | NETWORK / MULTICORE, under CONSOLE | Yes. Both-ways is still drawn (double run, two arrowheads); the STAGE IN options and the ONE MAP card say it in words. |
| Map, LEARN 1 | MAIN L/R, AUX 1 · PRE, AUX 2 · stereo, LOW, SUB OUT (on the runs) | Same words (stereo → STEREO), under the station each feeds, in the cable's colour | Yes — the same labels, moved off the run. |
| Map, LEARN 1 | Monitor amp at column 0.9 | Column 1 | Position only; same lane, same links. |
| Map, bench | "POWERED CABINET (AMP INSIDE)" | POWERED CABINET | The parenthetical stays in the PROBE list, the accessibility label and the case text; the glyph is a powered cabinet. |
| Map, bench | Reading "OK · INTERMITTENT" etc. under each probed station | The flag word when the station has one (INTERMITTENT, HUM, WRONG CONTENT…), else the signal word (OK, NO SIGNAL, LOW, HOT, CLIP) | The full reading is on the bezel (READS), in the PROBE list and in the reading card; ring colour + lamp unchanged. "WRONGCONTENT" is printed as WRONG CONTENT. |
| Map | Lane names above each lane | Rotated up the left edge | Same words. |
| Plot | WING (×2) | removed | Repeated label; the wings are the dark offstage bands SR / SL sit in; "wings either side" is in the BUILD 1 text and every wing position is named "…wing". |
| Plot | Position names under each target ring (5.5 units) | removed from the plot | Listed in the in-hand card as **STANDS AT · …** (`pagesBuild.tsx`), and each placed device's card names its position. |
| Plot, LEARN 18 | "DELAY TOWERS · 30 m FROM THE MAINS", "0 ms set · 87.4 ms needed" | a dimension line mains → delay row with "30 m" | NEEDED / SET / ERROR are on the bezel; DISTANCE on the dock ("30 m from the mains to the delays"); the ring still turns green when aligned, and so does the "30 m". |
| Channel strip | sub-captions: mic level → line level · compressor · gate · wedges — the fader cannot touch it · reverb — follows the fader · this channel alone → recorder · a hand on the fader — no audio here · → then main · L/R OR GROUP — ONE OR THE OTHER; BOTH IS THE DOUBLE-ROUTING FAULT | removed from the drawing | All in the station card (`STATIONS` in `pagesRoute.tsx`). Added so nothing is lost: **fader** "A DCA or a mute group acts here too — a hand on the fader, with no audio of its own."; **sends** "effects — the reverb here —"; **assignment** "both is the double-routing fault." |
| Sub feed router | box sub-captions "post-fader", "from MAIN · own fader" | removed | The PATH card: "post-fader aux send", "Main mix … → matrix with its own level". |
| Sub feed router | XOVER 80–120 Hz (one line, mono) | XOVER / 80–120 Hz | Same words, two lines. |
| Sub feed router | △ VOCAL IN THE SUBS | △ VOCAL / IN THE SUBS | Same words, two lines. |
| Output patch | status line UNPATCHED / PLAYS ITS FEED / WRONG FEED | ✓ / ✗ on the cable, tape colour | The words are the bezel's FED FROM (UNPATCHED / the bus), the SOCKET list ("— correct." / the why) and the verdict lines in the well. |
| Output patch | destination "PROC 1 · L" on one line | PROC 1 / L | Same words, two lines. Bus tape now upper case (MATRIX 2). |
| Gain chain | GREY HAZE = NOISE FLOOR along the foot | removed | Added to ChainMeterKey on both pages: "▒ grey haze · the noise floor, accumulated stage by stage". |
| Glyphs | IN / OUT, CH1 / CH2, DI, TX · ST silk-screen | not drawn on displays | Panel printing, never readable at glyph size; every glyph is still named by its label. |
| Feedback loop | NULL above the mic axis (collided with the cable) | below the axis, same side | Same word, same null (behind the mic). |

Nothing that a page grades, checks or computes changed: no engine file was touched; the capstone checklists,
fault grades, patch answers, bezel values and every blurb are as they were, apart from the three sentences added
to the ROUTE 1 station cards above.

## Full-screen flag (lead's request)

`fullScreen: false` set on the View-built stages: **ROUTE 2, 4, 5, 6, 7** (BusBank) and **LEARN 14** (PowerBand).
OPERATE 1 / 5 use `StageBox` (turns it off itself). LEARN 16 / OPERATE 3 (ChainMeterStage) are left on: the meter
drawing is SVG and grows, but the glyph row and the label row under it are View-built at fixed sizes — worth a look
in the full-screen view.

## Not done / flagged

- **Short phones (375 × 667)** are 6.7–8.8 pt on the L-stage drawings because the frame drops a size; the lead's
  full-screen view covers them (per the brief). Numbers above.
- **LEARN 18's arrival timeline** (`ArrivalTimeline`) sits in the WELL, not the glass, and still prints 5-unit text
  (~5 pt). Out of this rule's scope; worth the same treatment.
- Bezel values truncate on a few pages at 375 (e.g. "REVERB HEA…", "CROSSOVER…", "SMALL POWERED-LOU…") — the bezel is
  the shared RackUnit's, not touched here.

## Verification

- `npx tsc --noEmit -p .` — clean.
- `npm test` — **1,991 pass, 0 fail**.
- Browser: `ape-web` at localhost:8091, Playwright, 390 × 844, 375 × 812 and 375 × 667, fresh storage per mode.
