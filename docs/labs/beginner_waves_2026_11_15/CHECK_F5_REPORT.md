# CHECK F5 report (independent checker, 2026-11-15)

Group F5: Understanding Level & Amplitude, Foundations of Sound, Sound Playground, Microphone Principles, Wave Physics, Speaker Placement, Room Design. Checked on branch `ota-after-approval-39-23` (builder commit 499fd2e5), web preview http://localhost:8142 at 390 x 844 (one tab, closed at the end). No file under `src/` or `test/` was changed.

## 1. Summary

- **PASS: 27**
- **FAIL: 0**
- **NOT SEEABLE: 3** (AMP-04, AMP-01, SC-02/EQL-02: Understanding Level & Amplitude has no `#labpreview` route; checked in code only)
- HELD by the builder (not graded): FO-01's ruler sub-part (owner decision). SHARED NEED 1 (every-visit captions) is a frame decision; not graded.
- F5 tests run: `test/labWaves_20261115_F5.test.ts`, `test/labFixes_20261114_F5.test.ts`, `test/screenGuide_foundations_20261031.test.ts`, `test/screenGuide_micspeaker_20261031.test.ts`: 259 pass, 0 fail.

Special checks the coordinator asked for:
- **Floating EAR (Foundations module 1): unchanged.** On screen at the right of the particle field. The commit touches no ear code or art.
- **Molecule tracer: unchanged.** The two pink tracer parcels with their swing marks are on module 1; `tracer.ts` is not in the commit.
- **Red "CANCELED — SILENT" line: unchanged.** Module 10, PRESET 180°: the text is on the display, color rgb(255,141,122) (#ff8d7a), 9 px, same line in viz.tsx (3057). The commit does not touch it.
- **Signal Detective-style hint under the tapped wrong option: works.** Foundations module 9 check: I tapped the MIDDLE wrong option ("It doesn't — equal amplitude..."). The red reason line appeared directly under that option and above the third option. After the right answer, the hint went away and the ✓ reveal sits under the options.

## 2. Table

Builder-unseen items first (priority), then the rest.

| ID | Result | What I did and saw (390 x 844) | If FAIL: what to fix |
|---|---|---|---|
| FO-03 (modules 8, 9, 11) | PASS | **M8:** the intro card says "Tap 440 Hz · +2 octaves on the OCTAVES key". The tray reads 110 Hz / 220 Hz · +1 octave / 440 Hz · +2 octaves / 880 Hz · +3 octaves. ABOVE 110 reads "+1.00 octave", then "+3.00 octaves" after 880 (fits its cell). The PITCH lane reads "880 Hz · 3.00 octaves". No "8ve" anywhere. **M9:** "SEND and HEARD count in dB: how much stronger or weaker, compared with a reference. +6 dB is about twice the signal, −6 dB about half." It comes right before the shortened sweep paragraph, and dB is used nowhere earlier in the course (grep). **M11:** "H1, the fundamental (F0 on the readouts: the note itself)". The F0 readout above shows "base note". The every-visit captions part is SHARED NEED 1, not graded. | |
| RO-03 (Room treatment) | PASS | Module 6 Add treatment: the second LAB NOTES paragraph opens with the shared RT60 sentence, then "a room with every wall absorbed sounds dead and fatiguing". It is the same length as before (line in, line out). The readouts carry "mids ring" / "lows ring". Small note: the BASS TRAP caption (modTreatment.tsx:240, "watch RT60 125 ≈ fall") can show above the definition in reading order. Not a fail: the readout caption is on screen with it. | |
| SH-76 (Wave M8 tray) | PASS | Standing Wave Lab, MODE tray: the selected chip's line shows above the chips: "(1,0) The lowest side-to-side note: half a wave across the width.". After (2,1): "One whole wave across and half a wave down the depth." This matches the guide's axis rule (first number = width). The 34 Hz readout matches c/(2·5 m). | |
| SN-F6a-1 | PASS | See the special checks above (Foundations M9). Mic PICKUP PATTERNS: the right answer shows the reveal under the options with the new "rear ports (...)" gloss. | |
| FO-02 | PASS | M7 cover: there is no THE GOAL box. After tapping TIME, THE GOAL appears above the "Called it — TIME" line. | |
| FO-01 (built part) | PASS | After TIME, the display shows the "1 · FREEZE" (amber) / "2 · DRAG THE PROBE" chips at its top, THE MIC'S OUTPUT alone, and "SAME WAVE, IN THE ROOM ›". FREEZE is the dock's first key. FREEZE turned step 1 green and step 2 amber. PROBE + turned both green. The room key drew THE ROOM above, plus "SAME SPOT: 4.9 ms ago = 1.67 m past". The PROBE caption appears only then. All tags measured ≥ 9 px. | |
| RO-06 | PASS | Room Design opens on "1 · Create the room" with the floor plan. The card reads "Build a model of your room in steps: size, speakers, where you sit, suggested setups, panels, your report..." and its first step is "Drag a corner of the room to reshape it". | |
| RO-02 | PASS | Explore placement: the plan caption is two SVG lines, "Lowest front-to-back bass note (34.3 Hz)" / "At ear height: red piles up, blue vanishes (shape only)", 9.5 px, ending at x 171/219 on the glass. The axis is right: nx runs along the 5 m length. Note under SH-26. | |
| WA-09 | PASS | Room Builder (M16): WHAT TO TRY comes before OUTSIDE THE ROOM in the panel. The model note is still present. | |
| WA-05 | PASS | M15 opens its text with the shared RT60 sentence above the reverb paragraph. M2 was checked in code: the sentence comes before "the RT60 table" and one sentence went out. | |
| WA-06 | PASS | Wave home: one intro line, four headings (SOUND MEETS A WALL / SOUND BENDS AND ADDS UP / SPEAKERS / ECHO AND REVERB), then PUT IT ALL TOGETHER · MODULE 16. Each row has a plain subtitle at 13 px ("how sound bounces off walls"…). Numbers and order are unchanged. The page is a little longer (15 subtitles), but it is grouped and plain, as the item asked. | |
| SH-35 | PASS | Room Builder dock: FREQ, ROOM, WALLS, SRC, LAYERS. In code, Diffusion, Cardioid Sub and Beam Steer now put FREQ first and LAYERS last. | |
| MI-04 | PASS | The lab opens on PICKUP PATTERNS with "A microphone hears some directions better than others. Drag the speaker around the mic and watch PICKUP...". Module 10 is "FOR THE CURIOUS: INSIDE THE CAPSULE" with FINISH ›. The cutaway art is untouched. Wording nit: the title and blurb both start "For the curious" (said twice in a row). Could drop it from the blurb. | |
| MI-03 | PASS | WHAT'S HAPPENING: "...where the monitor wedge (a floor speaker pointing back at the performer) lives." This comes before the check. The reveal: "rear ports (the small openings behind the grille that make it directional; ...)". | |
| SPK-02 | PASS | TOP VIEW text: "PATTERN (how wide they spread)", "Black seats (dead zones)", "FILLS (small speakers on the stage lip)". WHAT'S HAPPENING: "overlap (cover the same seats)", "mains (the main speakers)". | |
| SPK-03 | PASS | After SPKR 2 on, a blue ring sits on the SPK 2 box on the map (zoomed screenshot) and EDIT reads SPK 2. | |
| SPK-01 | PASS | Module 2: "SIDE VIEW: stage on the left, back wall on the right", 9.5 px, x 17–240, top of the display, not cut. | |
| SPK-04 | PASS | Code: learning "A speaker is a flashlight for sound ... Dark seats can't hear well."; start "Your job: light up every seat. ...". The card was already dismissed in the preview, so I did not see it this run (the builder did). | |
| PG-02 | PASS | Dock: FREQ, LEVEL, SOURCE, PLAY. The SOURCE tray shows SINE / SQUARE / SAW / TRIANGLE and a closed MORE CONTROLS. The fold holds the noise choices, delay, balance and EQ. TRY THIS lines now say where (MORE CONTROLS). | |
| PG-01 | PASS | Subtitle: "Best after Foundations of Sound; every control here was taught there ›". Tapping it opened Foundations of Sound. The display and dock did not move. | |
| SH-64 | PASS | PINK NOISE selected: FREQ reads "locked — noise and sweeps have no single pitch: pick a wave shape." | |
| SH-14 | PASS | Code: M10 "(Needs sound. Sound off? PRESET 180° shows the moment they cancel.)"; M7 cover "(Needs sound. Sound off? The picture is enough.)". These match the other listening steps. | |
| SH-37 | PASS | Code: the VizUnavailableCard no longer says "update the app". The dev-build line on M10 ("install the newest dev build") showed in the preview because it is a __DEV__ build. That is expected. | |
| SH-26 | PASS (note) | The codes the builder named are spelled out (F0, octave, dB, RT60, bass-map caption, Wave MODE chips). Note: in Room Design Explore placement, the dock key still reads "axial (1,0,0) 34.3 Hz", and the first line of the reading text says "axial mode (1,0,0) at 34.3 Hz: ...". These sit right under the now-plain plan caption, so the code is still met in words a beginner can't read. Suggest a wave-4 follow-up: plain dock label "front-to-back · 34.3 Hz" and the same lead in the text. | |
| SH-11, SH-12, SH-15, SH-27, SH-36 | PASS (agree with NOT A BUG / one fix) | Foundations and the Playground show the shared "Sound off?" line. Wave, Mic, Speaker and Room show no sound-off line, which is right: they play no sound (Speaker says "This lab teaches visually — no audio playback"). Readouts with sound off show values (TONE OFF, HEARD as a model value). I found no cut tag in the labels I measured. | |
| AMP-04 | NOT SEEABLE (no route) | Code: the one intro card says "This lab teaches one thing: the color key every Academy display uses for level: cooler means less, warmer means more. Shown on six displays, then three quick questions." It matches three questions (q 0..2). Wording nit: two colons in one sentence. **Phone check:** open the lab from the Labs menu and confirm only ONE popup appears before the page. | |
| AMP-01 | NOT SEEABLE (no route) | Code: each VizCard caption ends with a "Look for:" line, and the 78-vs-PEAK sentence is gone from the paragraph above (line out). Wording risk: SPL METER "a big number, a cool color: its own scale". 78 dB SPL is drawn green-yellow (levelColor at 0.63), cooler than PEAK's orange but not a "cool" blue. Suggest "a big number, only mid-scale color: its own scale". **Phone check:** look at the six cards at 390 for caption wrap and confirm the SPL color matches the words. | |
| SC-02 / EQL-02 | NOT SEEABLE (no route) | Code: GATE_INTRO reads "A one-time stop, about a minute: ... Your lesson opens right after." This is F7a's text, restored as the builder said. **Phone check:** open any visualizer tool before passing the primer. | |

## 3. Other things noticed in passing

1. **Foundations M7, before the room is shown:** the first text paragraph says "Follow its cable down: the mic cannot see the room". The cable strip and the room mic are hidden until "SAME WAVE, IN THE ROOM ›" is tapped, so a beginner reading it first has no cable to follow. Small wording fix: "Follow its cable (shown with the room)" or move "Follow its cable down" into the room paragraph.
2. **Foundations M7, frozen with the room shown:** the frost corners (owner design 2026-08-27, viz.tsx FrostCorner) sit over the ends of the top label row. "THE" of "THE ROOM — CAMERA FLASH" and the end of "MEASURED: every point · one instant" are partly hidden at 390. The DOM text is not clipped; it is the corner ornament on top. This looks pre-existing: the corners always sat on the DualDomainView's top row. Not caused by F5, but more visible now that the room is the second step. For the owner, if wanted: inset the label row by the corner size while frozen.
3. **Foundations M8 OCTAVES tray:** the longer "+1 octave" labels now wrap the four chips to two rows (880 alone on the second). It reads fine; noted only because the tray is a little taller.
4. **Foundations M9:** with WHERE TO START open as a bottom note plus the dock, the reading area between the display and the dock is about 150 px tall at 390 x 844. This is not an F5 change (shared frame); noted for S.
5. The preview viewport twice changed from 390 x 844 to 414 x 755 on its own (the pane resized). I re-set it, and all measurements above were taken at 390 wide.
