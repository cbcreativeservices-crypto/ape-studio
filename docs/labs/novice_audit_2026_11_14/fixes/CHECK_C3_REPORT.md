# CHECK C3 report: F5 + F6 fixes (lab fix round 1, 2026-11-14)

Checker C3. Read-only except this file. Built-in pane, one tab (tab-34), 390x844 (390x770 and 320 where width matters). Sound Safety: KEEP SOUND OFF only. Note: the pane renders the page at about 0.61 scale, so on-screen positions were read from the DOM (getBoundingClientRect / innerText) as well as from screenshots.

Status: IN PROGRESS (saved as I go).

## Summary

(pending)

## Table

| Lab | Fix (group + item #) | Steps | Seen | Result |
|---|---|---|---|---|
| Wave home | F5 W7 | Opened #labpreview/WaveLab | "MODULES 1–15", "PUT IT ALL TOGETHER · MODULE 16", subtitle "One room model · sixteen modules"; no "THE 15 MODULES" | PASS |
| Wave home end | F5 phase 2 end rows + recap (S4 labId) | Tapped SEE WHAT'S LEFT | Each row "Not opened yet. Inside: <line>"; the rule once under HOW A MODULE COUNTS; WHAT THIS LAB COVERS (4 bullets); AFTER THIS LAB · Speaker Placement & Coverage | PASS (minor wording note N1) |
| Wave 11 | F5 W1 | ALIGN tray → MAIN POLARITY Ø | SUM −4.4 → −1.7 dB; caption "Better at this seat (SUM -4.4 dB → -1.7 dB), by luck: a flip shifts the main by half a cycle, which only suits this seat at 100 Hz. Move XOVER or drag the listener and the gain comes and goes. A DELAY fixes the TIME, at every frequency." | PASS |
| Wave 11 | F5 W2 | Read SUM cell at start; dragged listener far right with the flip on | "SUM −4.4 dB / OUT OF STEP"; after the drag "SUM −0.4 dB / LUCKY FLIP" | PASS |
| Wave 11 | F5 W3 | Dragged the listener glyph to the far right | REQ "16.0 ms", OFF BY "−16.0 ms", both keys (REQ, OFF BY) still shown; well table keeps "15.97 ms" | PASS |
| Wave 11 | F5 W9 name tags | Looked at the room | SUB, MAIN, YOU (drag) beside their glyphs, apart | PASS |
| Wave 11 | Reading-well fold (S3) | Scrolled the well to CHECK YOURSELF | Display folded to a slim strip with OPEN DISPLAY; bezel row kept | PASS |
| Wave 11 | F5 phase 2 `why` (first miss) | Picked "Polarity must always be flipped…" | Only its reason: "Polarity and delay are different tools; here the flip helped only by luck."; same option again: no reveal | PASS (second-different-miss checked on Foundations, below) |
| Wave 10 | F5 W5 | Looked at the dock; BOXES key → fader dragged right | Dock: FREQ 1 kHz / BOXES 4 / SPLAY 4.0° / HEIGHT 0.90 m / LAYERS; fader reads "8 boxes"; bezel BOXES 8, LEN 1.98 → 3.83 m; map changed | PASS |
| Wave 10 | F5 W9 | Looked at the room | "LINE ARRAY" beside the boxes, "YOU (drag)" beside the listener | PASS |
| Wave 9 | F5 W6 | GOT IT on intro; dragged the listener to the top-left corner (behind/beside the box) | vs ON-AXIS "≤ −12 dB / vs straight on"; well: "The listener is outside the beam. This model stops at 12 dB down beside and behind the box, so vs ON-AXIS reads “≤ −12 dB”: at least that much quieter. A real speaker can fall further." | PASS |
| Wave 16 | F5 W4 | 390x770: ROOM key → tray; DEPTH slider dragged left; also at 320x770 | WIDTH 12.00 m and DEPTH side by side, no "more ↓"; DEPTH 8.00 → 3.00 m; at 320 both sliders and values fit | PASS |
| Wave 16 | F5 W9 name tags | Looked at the room at 500 Hz (default) at 390x844 and 390x770 | "YOU (drag)" tag at x161-227, y272-283 sits ON the "RING GAP > λ" plate at x134-211, y269-280 (both rects from the DOM) | **FAIL** (F-1) |
| Wave 3 | F5 W12 | GOT IT; ARRIVALS layer is on by default (LAYERS P·R·A) | Row "15.5 ms  spread" on one line (x285-369, one 11 px row); no wrap into the next row | PASS |

## FAIL list

### F-1 (F5 W9, Wave 16 Room Builder): the YOU (drag) name tag covers the "RING GAP > λ" plate
- Repro: open `#labpreview/WaveModule/builder` at 390x844 (or 390x770). Default FREQ 500 Hz, room 12 × 8 m. Look at the bottom-left inside the room: "YOU (drag)" is drawn on top of "RING GAP > λ" (DOM rects: tag 161,272 66x11; plate 134,269 77x11).
- Cause: the tag placer's `placed` list (src/screens/lab/wave/vizWave.tsx ~2487) holds only the source/listener glyphs and tags already placed; it does not include the RING GAP plate (vizWave.tsx:2433-2438, drawn at geo.x0 + 3·ts, geo.y1 − 17·ts) or the probe labels. F5's claim "never over another tag or glyph" does not hold for this label.
- Fix idea: push the RING GAP plate's rect (when `ringGapWide`) into `placed` before placing tags.

## Notes (not fails)

- N1 (Wave end rows): rows are the module's WHAT YOU'RE LEARNING line verbatim, so module 2 reads "Not opened yet. Inside: in Reflection every bounce lost energy. Here you see how much…" — reads a little oddly after "Inside:". Wording only.

## Saved-data keys removed on my tab

(none yet)
