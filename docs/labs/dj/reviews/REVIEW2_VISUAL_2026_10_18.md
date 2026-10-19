# DJ Systems Lab, screens 13–24: skeptical visual review (2026-10-18, second pass)

Review only: no code was changed and nothing was committed. Worktree `C:\Users\profe\dev\ape-dj-lab`, branch `dj-lab`, head 72242637.

**How it was checked**
- The pages were served by `dj-web-8093` and driven in Playwright at 390×844. Most captures are at device pixel ratio 3, which matches a phone. The Playwright page is visible, so animation ran at full frame rate, unlike the hidden built-in pane. Sound stayed OFF ("KEEP SOUND OFF"); the booth still renders and meters with sound off.
- **Captures:** 106 files in `C:\Users\profe\AppData\Local\Temp\claude\dj_visual_review2\`.
  - `sNN_*_390.png`: the phone view.
  - `sNN*_hi.png`: the display at 3× pixel density.
  - `sNN_full_1x|3x_*.png`: FULL SCREEN.
  - `chkNN_*.png`: the screen 1–12 spot-checks.
  - Files starting with `_` are working shots.
- **Full screen** was checked at 1× and 3× on screens 13, 14, 16, 18, 19, 20, 21, 22 and 23, and at 2× on screen 13.
- **Screens 1–12 spot-check:** screens 4, 9 and 11 still match `docs/labs/dj/screens/final/`. The only difference is the module counter, which now reads "/ 24". Screen 11 shows the rebuilt waveform renderer, with peak and RMS and the grid drawn on top.
- **Viewports reset:** the built-in pane is back to desktop, and the Playwright window is back to 1280×800.

**Overall verdict.** The new GEAR art is mostly at the Stage 1 tier or close to it: the powered top and sub, the handheld mics, the laptop, the recorder, the drum machine, the control vinyl at 3×, the stage box, and every real-signal plot (the FX scope, the DVS ring, the pitch plot). Three things pull the lab down:
- **One drawing is still primitive:** screen 17's booth side view and tonearm side view.
- **Callouts and labels collide with gear and with each other** on almost every new screen. The Stage 1 callout rewrite does not hold for the new art.
- **Several new screens ignore the standards Stage 1 just set:**
  - the shared waveform renderer;
  - meter scales;
  - one scale per drawing;
  - cables that stay traceable;
  - readouts pinned above the zoom.

---

## BLOCKERS

1. **BLOCKER: Screen 17 ROOM view is labelled boxes.**
   - **Where:** `art/vinylArt.tsx` RoomView. **Captures:** `s17f_room_hi.png`, `s17g_room_fixed_hi.png`.
   - **Problem:** The "booth side view" is a rounded rectangle with "TURNTABLE" printed on it, a plain dark rectangle with "MONITOR" printed on it, a slab table on two sticks, and isolation feet drawn as purple squares. The word "MONITOR" runs past the right edge of its box. The "acoustic loop" is a dashed arc plus a thin blue curve that dips under the table to the monitor stand, so it reads as a cable. This is exactly the "box for a speaker" stand-in that the 2026-07-29 ruling bans (rule 1).
   - **Redraw:** A side elevation at ONE stated scale (about 0.45 px/mm at 390).
     - A table with an apron and four legs drawn in perspective pairs.
     - The turntable in side profile: plinth with feet, platter rim with strobe dots, the record edge, the arm pillar with the counterweight and the arm lift.
     - The booth monitor in three-quarter view, so its woofer and tweeter read: cabinet depth, front baffle, port. Either on the table on a decoupling pad, or on its own stand (tripod or pole) for "ON A STAND, AWAY".
     - Isolation feet as real domed pucks under the plinth.
     - The loop drawn as TWO labelled paths: the AIR path (three soft wavefront arcs from the monitor's face to the platter, amber), and the ELECTRICAL path marked as an overlay ("stylus → mixer → monitor", blue, dashed, with an arrow).
     - Loop gain shown by the thickness or brightness of the air arcs.

2. **BLOCKER: Screen 17 tonearm side view: "lift the arm to balance" does not move the arm, and the arm is not the real geometry.**
   - **Where:** `art/vinylArt.tsx` ArmSide, lines 52–53 (`ang = v.armUp ? Math.min(rest, floatTilt(v) * 1.6) : rest`). **Captures:** `s17b_playing_hi.png` vs `s17c_arm_lifted_hi.png`: the drawing is the same pixel for pixel; only the header changes to "FRONT DIPS".
   - **Problem, the lesson:** Lifted and dipping, the angle is clamped to the resting angle, so the arm still sits on the record. The balancing lesson (float level, front dips, tail heavy) never shows.
   - **Problem, the geometry:**
     - The pivot stands about 30 % of the panel above the record, so the arm comes down at about 9°.
     - The headshell is drawn along the tube, so the cartridge digs into the vinyl.
     - A real arm plays almost parallel to the record, which is the VTA reference.
   - **Problem, the parts:** The parts are primitives: one line for the tube, two rounded rectangles for the headshell, a flat rectangle for the pillar, a plain block for the counterweight with a dark band but no numbers on the ring, and a black ball for the anti-skate.
   - **Redraw:**
     - Pillar height set so the tube is parallel to the record at play.
     - LIFTED: the cue lever raises the arm 8–10 mm clear of the record, then the arm tilts by `floatTilt` about the gimbal. FRONT DIPS is the headshell lower than level, but still in the air. TAIL HEAVY rises. BALANCED is level, with a green spirit line.
     - The gimbal bearing housing as a ring and yoke, the arm-height collar, and the arm rest with its clip.
     - The counterweight as a lit cylinder with a printed dial ring (0–4 g, legends at 9 pt or more), the reading taken at a pointer line.
     - The headshell with its finger lift, and the cartridge body parallel to the record with a visible cantilever and stylus.
     - The anti-skate dial as a knurled knob with numbers.
     - The STYLUS SCALE as a real gauge: a beam or digital pad under the stylus with its LCD.

3. **BLOCKER: Screen 17 top-view halos stay at the arm's REST position when the arm swings onto the record.**
   - **Where:** `pages/p17Vinyl.tsx` callouts/halos (they come from fixed rest anchors, not from the rotated arm). **Captures:** `s17b_playing_hi.png`, `s17c_arm_lifted_hi.png`, `s17e_phono_double_loose_hi.png`.
   - **Problem:** HEADSHELL + CARTRIDGE rings and points at the empty arm rest beside the pitch fader while the headshell is about 50 mm away on the record. The COUNTERWEIGHT halo is also offset once the arm rotates. This is the same failure as Stage 1's Blocker 2: a callout that points at the wrong thing.
   - **Fix:** Derive both halos and their leader anchors from the same arm transform the drawing uses (`angleForRadius(...)` in `TurntableTop.tsx` line 130). Add a geometry invariant test: the halo centre stays within 3 mm of the headshell and counterweight centres at rest, at the lead-in and at the run-out.

## MAJOR: screens 13–17

4. **MAJOR: Screen 13 FX scope: at 390 the echo cannot be seen, and at 2×/3× the scope scrolls away.**
   - **Where:** `art/fxArt.tsx` FxScope; `pages/p13Effects.tsx` 88. **Captures:** `s13c_echo_on_ch1_390.png` and `_z13scope.png` (1×, the white and blue traces lie on top of each other); `s13_full_2x_topleft.png` (2×, the echo steps ARE visible); `s13_full_2x_open.png` and `s13_full_3x_open.png` (the scope is gone).
   - **Problem at 390:** The lesson text says "each repeat is a step of blue". At 390 the 3.2 s window in about 340 px puts a ½-beat repeat 26 px apart on top of continuous music on a 48 dB scale, so IN and OUT overlap. The ONE DELAY bar sits on the baseline, across the trace.
   - **Problem at zoom:** The scope is a `screenOverlay` that zooms and scrolls with the drawing, so it is not "readouts on top" (D35).
   - **Fix:**
     - Draw OUT − IN as a separate filled "wet" band (blue) above a thin dry line (white), so a repeat is a visible step even under continuous music.
     - Or show a 1.6 s window at 390 and keep 3.2 s in full screen.
     - Lift the ONE DELAY bracket above the trace with end ticks.
     - Pin every `screenOverlay` plot to the glass in full screen, the way the bezel strip is pinned, and zoom only the gear under it.

5. **MAJOR: Screen 13 routing map: crossings look like junctions, and two send taps are merged into one lane.**
   - **Where:** `art/fxArt.tsx` FxRouteMap, lines 260–262. **Captures:** `s13_full_3x_open.png`, `s13_full_2x_open.png`, `_z13scope.png`.
   - **Problem:** The SEND 1 tap (x 104) and the SEND 2 tap (x 106) run 2 mm apart down the same column, so they read as one double line (D69). The SEND 1 tap also crosses the CH2 → INSERT 2 wire with no hop or gap, which looks like a junction (charter §2).
   - **Fix:**
     - Give each tap its own lane at least 6 mm apart (SEND 1 down at x 102, SEND 2 at x 110), entering SEND FX at two separate y values.
     - Draw a 3 mm keyline gap or a hop on the crossing wire at every crossing. A junction dot appears only where the model joins.
     - Pass `flow` to the send, tap and return wires too: at present only the channel wires pulse.

6. **MAJOR: Screen 13 FX panel legends.**
   - **Where:** `art/fxArt.tsx` FxPanel (LEG = 4; the TYPE and CH SELECT legends are 3.2 mm, the SEND legends 3.4 mm, the RETURN legend 3.2 mm). **Captures:** `s13_full_1x.png` (no legends), `s13_full_2x_panelL.png` and `s13_full_2x_panelR.png` (only LEVEL, FEEDBACK and ON), `s13_full_3x_panelL.png` and `s13_full_3x_panelR.png`.
   - **Problem:**
     - At 2× the TYPE selector and CH SELECT show a pointer with no positions, so the knob position means nothing.
     - The CH SELECT knob has no title at any zoom.
     - The 2-position RETURN switch carries one string, "RETURN TO BUS · CH2", under the switch instead of a word at each end.
     - At 3× the panel sits in a large empty black band.
   - **Fix:**
     - Author the position legends at 3.6–4 mm so they appear from 2×.
     - Print "CH SELECT" over the route knob.
     - Print "BUS" and "CH2" at the two switch ends, with a "RETURN" title above.
     - Trim the full-screen frame height to the panel.

7. **MAJOR: Screen 14 composition.**
   - **Where:** `art/keyArt.tsx` KeyStrip; `pages/p14Key.tsx` stage. **Captures:** `s14_key_390.png`, `_z14.png`, `s14d_keylock_390.png`, `s14_full_1x.png`, `s14_full_3x_open.png`.
   - **Problems:**
     - **Text collision:** The A marker's letter (y = inner.y − 12k) prints on the same baseline as "B · D minor" (y = b.y + 27k), so when A sits under the right-aligned word you get "B A D minor" (`s14d`, `s14_full_1x`).
     - **Crowded plot:** The two plots float over a cropped deck B. A white jog-ring arc shows between them, and the player-screen chip "±0.4" peeks out behind the pitch plot (`s14_full_1x`).
     - **Unlabelled keys:** At 390 the tempo column's red key and the two dark keys above TEMPO B have no labels.
     - **3× zoom:** It blows the plots up into an empty grid and giant keys, with the dot and curve off screen.
   - **Fix:**
     - Put the deck markers on their own row above the strip, under the title row.
     - Crop the gear to the tempo column only, as a labelled inset on the right, or dim deck B to 40 % behind a solid panel.
     - Label the column keys (TEMPO RANGE, MASTER TEMPO, …) as callouts.
     - Pin the plots in full screen (see finding 4) so only the column zooms.

8. **MAJOR: Screen 15 stem lanes are below the Stage 1 waveform standard, and the pads are flat buttons.**
   - **Where:** `art/stemArt.tsx`. **Captures:** `_z15.png`, `_z15e.png`, `s15b_playing_390.png`, `s15e_separated_melody_off_390.png`.
   - **Problem:**
     - Each lane is one solid mirrored fill: no peak envelope over an RMS core, no beat or bar grid, no keylines. The Stage 1 renderer on screen 11 already does all of these.
     - The four "pads" are flat-fill rounded rectangles with the stem name: UI buttons, not a player's rubber pads.
     - With SEPARATED and MELODY muted, the leftover ghost is drawn in the same dim green as a muted lane, so "a ghost of it stays" cannot be told from "muted".
   - **Fix:**
     - Route the lanes through the shared waveform renderer (`waveDraw.tsx` / `waveHeadroom.ts`): peak at 55 %, RMS at 100 %, grid on top with keylines, in the stem colours.
     - Pads: a rubber cap with a radial gradient, inner glow when lit, a 1 px top-left rim light, and the stem name as a silk legend under the pad.
     - Muted lane: a 45° hatch at 12 % with "MUTED" at 9 pt. Leakage drawn as a BRIGHT thin trace on top, labelled "LEFT IN −18 dB".

9. **MAJOR: Screen 16 mixes three scales in one drawing.**
   - **Where:** `art/laptopArt.tsx` RIG, lines 24–28 (the laptop at ×0.8, the controller at ×0.48, the mixer at ×1). **Captures:** `s16_laptop_hi.png`, `s16b_hi.png`.
   - **Problem:** A two-deck controller (about 500 mm) is drawn the same width as a 13-inch laptop (about 305 mm). This is the Stage 1 finding 14 class (D67).
   - **Fix:** Draw all three at one factor. If they do not fit at 390, show the laptop and controller at 1.0 with the mixer cropped at the frame edge, or move to a two-row layout: the laptop and controller on top, the mixer below at the same scale. State "drawn to one scale" in the a11y text.

10. **MAJOR: Screen 16 callouts cover the mixer, and the USB plug at the mixer is hidden.**
    - **Where:** `pages/p16Laptop.tsx` 160–161. **Captures:** `s16_laptop_hi.png`, `s16b_hi.png`, `s16_full_1x.png`, `s16_full_3x_open.png`.
    - **Problem:**
      - "USB · AUDIO BOTH WAYS" lies over the laptop screen and the mixer's CH1 input selector.
      - "USB · CONTROL + POWER, NO AUDIO" covers the mixer's CH1 fader and the left end of the crossfader.
      - The "CH1 USB" chip covers the mixer-end USB plug, so the cable seems to end at a selector LED.
      - In full screen 1× the "CH2 USB" chip moves onto CH2's knobs.
    - **Fix:**
      - Pass `RIG_BODIES` as HARD obstacles, not `soft`.
      - Put both cable labels as flags ON the cable runs, in the open lane between the laptop and the mixer and between the laptop and the controller.
      - Draw the mixer's rear USB-B socket with the plug body seated in it, visibly separate from the CH1/CH2 input-selector LEDs.
      - Keep the "CH1 USB" and "CH2 USB" chips above the mixer's top edge with their leaders going down to the selectors.

11. **MAJOR: Screen 17 PHONO view: the ground wire, the PHONO/LINE switch and the RCA leads are never drawn.**
    - **Where:** `art/vinylArt.tsx` PhonoChain and the p17 stage. **Captures:** `s17d_phono_hi.png`, `s17e_phono_double_loose_hi.png`.
    - **Problem:** "LOOSE" ground and "LINE (preamp on)" change only the block boxes and the bezel ("HUM: NO GND"). The physical cause the learner is asked to fix is not in the picture.
    - **Fix:** Add a rear-panel inset of the turntable (in the style of the mixer rear panels):
      - the RCA pair with its cable;
      - the ground lug with a spade terminal on a thin grey ground lead to the mixer's GND post — when LOOSE, the spade hangs off the post with a 50 Hz wobble glyph;
      - the PHONO / LINE slide switch with legends.
      Keep the four-block chain as the diagram above it.

## MAJOR: screens 18–24

12. **MAJOR: Screen 18 (DVS): the connections are boxes only; no cable is drawn.**
    - **Where:** `art/dvsArt.tsx` DvsRoute; `pages/p18Dvs.tsx`. **Captures:** `s18b_playing_hi.png`, `s18c_hum_dusty_hi.png`.
    - **Problem:** The screen teaches "the control tone goes in through the mixer's PHONO jacks and over USB", yet the scene shows only the turntable. There are no RCA leads to PHONO, no ground lead, no USB to the laptop, and no laptop. The control record is a flat white disc at 390: its grooves are only visible at 3×.
    - **Good:** The ring is the real render signal, and it wobbles and fuzzes correctly.
    - **Fix:**
      - Under the map, add the turntable rear with its RCA pair, plus the ground lead running to a mixer-rear inset (PHONO 1, GND post, USB-B), and a USB cable to the laptop's edge. Each cable gets a flag ("CTRL L/R", "USB").
      - Draw the timecode grooves at 0.18 alpha black on white so they read at 1×.
      - Give the control record a printed label (side marks and the lead-in arrow), not a blank black disc.

13. **MAJOR: Screen 19: the meters have no scale, and their labels sit on the LED cells.**
    - **Where:** `pages/p19Mic.tsx` meter column; `art/parts.tsx` LedColumn. **Captures:** `s19_hi.png`, `s19b_talking_hi.png`.
    - **Problem:** The rotated "MIC / CROWD / BOOTH / REC" labels are drawn over the bottom eight cells of each ladder. There is no dB scale. Stage 1 finding 5 set the bar: −24, −12, −6, −2, 0 and a CLIP cap. The lesson asks for "speech peaks between −10 and −3 dBFS" and the meter cannot show that range.
    - **Fix:**
      - Labels under the ladders, horizontal, at 9 pt.
      - A printed scale strip on the left of the MIC ladder at 9 pt.
      - A green target band (−10 to −3) bracketed beside the MIC ladder.
      - The peak segment at #ff5a48.

14. **MAJOR: Screen 19: the mixer front is overcrowded, and labels overlap gear.**
    - **Where:** `pages/p19Mic.tsx` callouts; `art/MicGear.tsx`. **Captures:** `s19b_talking_hi.png`, `s19c_wireless_hi.png`, `s19_full_1x.png`.
    - **Problem:**
      - "GAIN 1 +35 dB", "MIC ON", "TALK OVER", the cable flag "MIC", the MUSIC DIP bar and its "0" end label all share one band about 80 px tall.
      - The XLR cable crosses the MUSIC DIP bar's scale and hides its "0".
      - Unplugged, the dangling male XLR lies over the mixer front's right end and the TALK OVER chip.
      - In WIRELESS, the receiver panel is squeezed between the mic and the mixer: the "MUSIC DIP" chip covers the receiver's MIC/LINE switch, and both antennas run behind the mic body to the frame top.
      - The plugged XLR at MIC 1 is a black disc, with no plug body or strain relief.
    - **Fix:**
      - Move the MUSIC DIP bar out of the gear: make it a bezel-style strip pinned above the meters, or put it under the mixer front.
      - Put the receiver BESIDE the mixer, on the right, at the same scale.
      - Route the mic cable around the right of the mixer into MIC 1 from below, as it would drop to a front-panel socket.
      - Draw the plugged XLR as a barrel with a latch tab and a boot, in slight perspective, with a cast shadow.
      - Park an unplugged lead in clear space below the panel.

15. **MAJOR: Screen 20 HANDOFF: labels sit on the cable flags, and the two XLR runs share a lane.**
    - **Where:** `pages/p20Pa.tsx` handoff callouts; `art/VenueGear.tsx`. **Captures:** `s20_hi.png`, `s20b_handoff_patched_hi.png`.
    - **Problem:**
      - Unpatched: the "MASTER R" chip prints over the "MST R" cable flag, and the MASTER L leader runs down through the MST L cable.
      - Patched: the "MASTER L" chip collides with the "MST L" flag, and "DJ R ← MASTER R" sits on the MST R run.
      - MST L and MST R travel right in one lane about 4 px apart, so they cannot be traced (D69).
      - About 40 % of the glass above the panels is empty.
      - The stage box's scribble strips are blank, although the lesson is "inputs labelled DJ L and DJ R".
    - **Fix:**
      - Lift the mixer and stage box into the upper third.
      - Run MST L and MST R in two lanes at least 10 mm apart (L above, R below, never crossing), with velcro ties.
      - Put the socket callouts below the panels and the cable flags in the upper lanes.
      - Write "DJ L" / "DJ R" in marker style on the tape strips once patched.

16. **MAJOR: Screen 20 ROOM: the field does not always agree with its −6 dB edges, and spaced subs are drawn without interference.**
    - **Where:** `art/PlanView.tsx`; `model/djRoom.ts` `coverageGrid` / `topsDbaAt` / `subsRelAt`. **Captures:**
      - `s20c_room_hi.png` (CORNERS, STRAIGHT);
      - `s20f_room_frontcorners_hi.png`;
      - `s20g_room_behinddj_hi.png`;
      - `s20e_room_subs_hi.png`;
      - `s20_full_3x_room_open.png`.
    - **Problem:**
      - **Coverage edges:** In CORNERS, STRAIGHT, the region outside each top's outer dashed −6 dB line (towards the side walls) is as hot as the region inside it. The dashed lines therefore do not mark a visible edge, and real mid-band coverage falls about 10 dB within 30° outside the nominal angle.
      - **Overlapping edges:** In FRONT CORNERS, the two inward edges almost coincide, forming a dashed band under the SUBS chip.
      - **Subs:** The SUBS (BASS) map sums the two subs smoothly. Two subs about 7 m apart make a power alley down the centre and lobes and nulls off-axis: the most visible physics of spaced subs.
      - **Smaller points:**
        - At 390 the tops and subs (true footprints) are about 12 px marks with a white pivot dot, which reads as a primitive.
        - The heat legend covers a corner of the field.
        - In BEHIND THE DJ, the PA R / PA L chips sit on the glass's top edge.
        - Full screen 3× opens on a featureless colour wash.
    - **Fix:**
      - Check the tops' polar model against a horn's real off-axis roll-off (the audio reviewer should confirm), so the colour visibly drops across each dashed edge.
      - Draw only ONE edge where two coincide.
      - Either model the subs coherently at about 60 Hz (show lobing), or say once, in plain words, "bass drawn without interference — real spaced subs make loud and quiet spots".
      - Hold the speaker glyphs at a minimum 18 px with the horn mouth drawn, and print "TOP + SUB" when stacked.
      - Move the legend outside the field, or make it translucent.
      - Open full screen centred on the booth.

17. **MAJOR: Screen 20 SYSTEM: the crossover plot does not say which curve is which, and its floor is clipped.**
    - **Where:** `pages/p20Pa.tsx` / `art/VenueGear.tsx` crossover plot. **Captures:** `s20h_system_xover_off_hi.png`, `s20i_system_xover_on_hi.png`.
    - **Problem:**
      - **Curves:** Lavender (sub), blue (tops) and white (sum) carry no labels or legend.
      - **Y axis:** It prints only "+6" and "0 dB".
      - **Floor:** The curves clamp into flat lines at the plot floor, as if the filters stop falling. A 24 dB/oct slope keeps falling.
      - **X axis:** It labels only 20, 100 Hz and 2k Hz.
      - **Good:** The speaker drawings are at the Stage 1 tier: trapezoid top with waveguide and 12-inch cone behind the grille, sub with ports and feet, true relative sizes.
    - **Fix:**
      - End labels on each curve ("TOPS", "SUB", "SUM").
      - The y axis at −6, −12 and −18 dB, with the plot floor labelled.
      - Let the curves leave through the floor instead of clamping.
      - X labels at 50, 200 and 500 Hz.
      - Mark the −6 dB crossing point with a dot, since LR4 tops and sub meet at −6 dB.

18. **MAJOR: Screen 21: the take lane has no level scale, and the callouts sit on the split lead.**
    - **Where:** `art/RecorderGear.tsx` take lane; `pages/p21Rec.tsx`. **Captures:** `s21b_recording_hi.png`, `s21c_take_hi.png`.
    - **Problem:**
      - At −19 dBFS the take fills about 4 % of a tall lane. Scaling it true is honest, but with no dBFS scale and no target band, "small" does not read as "too quiet". The lane is also a single blue fill, not the shared renderer.
      - "REC OUT → RECORDER" lies over the start of the white and red RCA runs, and "LINE IN" covers the moulded splitter.
      - The 3.5 mm plug at the recorder's side is almost invisible.
    - **Fix:**
      - A dBFS scale on the lane edge (0, −6, −12, −24), a shaded −12 to −3 dBFS target band, and peak plus RMS from the shared renderer.
      - Flags placed off the cables, in the open band below them.
      - Draw the 3.5 mm TRS plug larger: barrel, two insulator rings, boot, seated in the recorder's LINE IN socket, with a "LINE IN" legend printed on the recorder's side.

19. **MAJOR: Screen 22: leaders strike through the display, and callouts cover the step keys.**
    - **Where:** `pages/p22Hybrid.tsx` callouts; `art/DrumMachine.tsx`. **Captures:** `s22_hi.png`, `s22b_patched_hi.png`.
    - **Problem:**
      - The "INTERNAL TEMPO" leader crosses the display's "120.0" digits.
      - "STEP LIGHTS = ITS BEAT" covers step keys 1–4 and their LEDs.
      - The "MIDI · CLOCK CH 1" chip sits on the exact point where the MIDI lead crosses the DM L / DM R runs, so you cannot see which passes over which.
      - At 390 the drum machine's four pads are flat dark rectangles with no rubber tone, and the 16 steps have no group marks.
      - **Good:** At 3× the legends do appear (MIDI IN (A), MIDI OUT, TEMPO, LEVEL, SHAKER, RIM, STEPS 1–16).
    - **Fix:**
      - Point the leader at the display's edge, not across it.
      - Put the step callout below the step row.
      - Move the MIDI flag onto the vertical part of the MIDI lead.
      - Draw a 3 mm gap at the crossing.
      - Pads: radial gradient plus a top rim light.
      - Steps: a printed bar line every 4 steps (1, 5, 9, 13).

20. **MAJOR: Screen 23 changeover board: text collides, the ground-loop path is hidden, and the power lanes merge.**
    - **Where:** `art/EventFlow.tsx` (labels at a fixed 9 pt, `useLabelMm`, inside tiles sized in mm); `pages/p23Changeover.tsx`. **Captures:** `s23_hi.png`, `s23b_hum_hi.png`.
    - **Problem, text:**
      - "NOT CONNECTED" runs into the "USB 2" wire label.
      - "DECK B · BACKUP" runs past its tile into "LINE".
      - "READY · USB 2" and "PLAYING · USB 1" collide with the wire labels.
      - "INPUT USB 1" and "HUM · USB 2" end under the tile's meter ladder.
      - "ANOTHER CIRCUIT" touches the tile edge.
      - Prediction badges 1 and 3 sit on the wire junctions.
    - **Problem, the ground loop:** The amber dashed loop runs behind the DECK B tile, and the "GROUND LOOP · HUM" leader points at DECK B. The cause is DJ 2's laptop charger, so the picture blames the wrong device.
    - **Problem, the power lines:** They are drawn as doubled grey lines that merge into one trunk (x ≈ 388) and cross the CH 2 inputs without a gap.
    - **Fix:**
      - Measure each label and size the tile to `max(mmWidth, textWidth + 2 × pad)`, or wrap the subtitle onto a second line.
      - Reserve a fixed slot for the meter ladder.
      - Wire labels go on the wire's own lane, centred between the tiles, never inside a tile's margin.
      - Route the loop around the tiles (laptop DJ 2 → charger → wall socket → booth strip → mixer → USB 2 → laptop DJ 2) and point the leader at the laptop DJ 2 → wall socket segment.
      - One power line per device, 6 mm lanes, hops at crossings.

21. **MAJOR: Screen 24 board power wiring cannot be traced.**
    - **Where:** `art/EventFlow.tsx`; `pages/p24Capstone.tsx`. **Capture:** `s24_hi.png`.
    - **Problem:** Every power lead is a doubled line. The PA L / PA R leads run down the right edge, then left above the WALL SOCKET tile, and end at the BOOTH STRIP. The WALL SOCKET tile has no line at all, so the board does not say what is on which circuit, which is the whole point of the power row.
    - **Fix:** As finding 20: one line per lead, its own lane, an arrowhead or plug glyph at the outlet end, and the WALL SOCKET's leads drawn in.

## MAJOR: across the new screens

22. **MAJOR: Full-screen zoom placement and pinned readouts.**
    - **Where:** `rack/StageFullScreen.tsx` together with the Scene `screenOverlay` used by p13, p14, p16, p17 and p18. **Captures:**
      - `s13_full_3x_open.png`;
      - `s14_full_3x_open.png`;
      - `s16_full_3x_open.png`;
      - `s18_full_3x_open.png`;
      - `s19_full_3x_open.png`;
      - `s20_full_3x_room_open.png`;
      - `s21_full_3x_open.png`;
      - `s22_full_3x_open.png`;
      - `s23_full_3x_open.png`.
    - **Opening position:** The top-left opening the builder reported did NOT reproduce on the web. At device pixel ratio 3, every screen checked opened CENTRED: scrollLeft 366 of 747 and scrollTop about half, at both 2× and 3×. Centred is not good either: 14 opens on an empty plot grid, 20 on a colour wash, 13 on the middle of the map, 23 between tiles. (The phone build may still behave as the builder reported; that is not verified here.)
    - **Pinned readouts:** The `screenOverlay` plots (FX scope, pitch plot and key strip, audio setup, arm side view, DVS scope and map) zoom and scroll WITH the gear, so at 2×/3× the live display is off screen or blown up.
    - **Legends at zoom:**
      - Most in-gear legends reach 9 pt only at 3×: screens 13, 19, 22.
      - The screen 13 FX panel's position legends never appear at 2×.
    - **Fix:**
      - Open each zoom step on the screen's FOCUS part (the haloed or selected part, from its part box), clamped to the content.
      - Pin `screenOverlay` content to the glass in full screen and zoom only the scene.
      - Re-author legends at 3.6–4 mm so 2× shows them.

23. **MAJOR: Dock keys cut off their values (D36).**
    - **Where:** the dock key renderer (`dock.tsx`). **Captures:**
      - `s13_effects_390.png` ("ECHO O…", "CH1 FADE…");
      - `s15b_playing_390.png` ("ORIGIN…");
      - `s16_laptop_390.png` ("1→1 2…");
      - `s23_full_3x_topleft.png` ("0 MARK…").
    - **Problem:** "ECHO O…" loses the ON/OFF state, which is the one word that matters.
    - **Fix:** Use `fitValue` on the dock value, and drop or shorten the label first ("FX · OFF", "SRC · ORIG", "OUT · 1/2 3/4", "MARKED 0"), never the value.

## MINOR

24. **Screen 17:**
    - The vinyl shows a hard horizontal seam: the right half above the centre line is lighter (`s17b_playing_hi.png`). The grooves are drawn twice (0.10 black and 0.10 white, `TurntableTop.tsx` 259/271) with a split. Blend them in one conic pass.
    - The red strobe-lamp glow spills over about 25 % of the plinth. Cap the glow radius at about 6 mm.
    - The "RECORD ON ITS SLIPMAT" chip floats with no leader.
    - "PLATTER (picks up the shaking)" is the only mixed-case callout in the lab, and it covers the strobe lamp.

25. **Screen 17 RIAA curve:** Its 20 kHz end reads about −16.6 dB against the RIAA playback value of −19.6 dB (`s17e`; plot geometry: 0 dB at y 369, −20 at y 440, curve end at y 428). The audio reviewer should check `RIAA_PLAYBACK` (the biquad fit), or the axis.

26. **Screen 14:** The A marker letter collides with the B key word. Fixed by the layout in finding 7; listed so it is retested.

27. **Screen 20 HANDOFF / 21 / 24:** Large empty bands in the glass:
    - the top 40 % on 20;
    - the band between the recorder and the take frame on 21;
    - about 85 px above and 65 px below the booth on 24, with a two-tone backdrop (`s24b_booth_hi.png`).
    Fit the frame to the content.

28. **Inconsistent FULL SCREEN step row:** 19 shows 1× 1.5× FIT 2× 3×; 22, 23 and 20 show 1× FIT 1.5× 2× 3×, or put FIT elsewhere; 13, 14 and 16 have no FIT. Use one order everywhere.

29. **Text floor:** `minPt={8.9}` appears in EventFlow (5), VenueGear (5), PlanView (3), p19Mic (3), RecorderGear (2), SystemMap (2) and cables (1). It is below the house floor `MIN_TEXT_PT = 9`. If it is a rounding tolerance, fix it once in `SceneText` (compare against `9 − 1e-3`), not per call.

30. **Motion:**
    - One clock (`useMotion`) everywhere, and the decorative flow is gated by `useDecorativeMotion` (`flowMotion`). The lesson loops are now registered in `patternP10b` (this closes Stage 1 finding 19).
    - Not every live wire carries the flow pulse: the screen 13 send/return wires and the screen 18 DVS map have none. Pass `flow` consistently.
    - Reduced motion was not exercised in this pass.

31. **Meters:** The LED colours follow the house ramp (`ledColour` → `levelColorForDb`), with white peak-hold caps. No new screen was driven into clip, so the #ff5a48 peak segment was not seen on 13–24: not verified.

## Other observations (not visual, but seen while testing)

- **CanvasKit ran out after a long session.** After about 10 screens with several 3× zooms at device pixel ratio 3, screen 23's canvas came up blank. The console showed `RuntimeError: Aborted()` and `Could not create surface` (`s23_BLANK_after_canvaskit_abort_390.png`); a reload fixed it. This may be web-only memory pressure from large zoom surfaces, but check that baked `SkImage`/`SkPicture` objects (the PlanView heat field, the scope paths) are disposed when a setting or screen changes.
- **Screen 13 render did not start on first entry.** Entered from the module list with deck A started (and the sound warning answered "KEEP SOUND OFF"), the booth gave no render for over 25 s: BUS PEAK "—", an empty scope, even after STOP and PLAY. Leaving the screen and coming back fixed it. Seen once, not reproduced.

## The 5 changes that would most raise the lab

1. **Redraw screen 17's side views as real objects.** The booth elevation, with table, turntable, monitor on its stand, feet, and the air and electrical loop drawn separately. The tonearm, which really lifts and floats by its imbalance, with real gimbal, pillar, counterweight ring and cartridge. Tie the top-view halos to the arm transform. These are the lab's three BLOCKERS.
2. **One callout-placement pass for 13–24, using hard obstacles.** Feed every gear body, display, cable lane and flag in as hard obstacles; no leader across a readout; flags on cable lanes; tiles sized to their text. This clears findings 7, 10, 14, 15, 18, 19, 20 and 26 together.
3. **Full screen as a working surface.** Pin the `screenOverlay` displays above the zoom, open each zoom step on the focus part, and author legends so they show from 2×. This covers findings 4, 6 and 22.
4. **Apply the Stage 1 standards the new screens skipped.**
   - The shared waveform renderer on the stems and take lanes.
   - dB scales and target bands on every meter and level lane (screens 19 and 21).
   - Labelled crossover curves.
   - One scale per drawing (screen 16).
   - Cable dressing on 13, 20, 23 and 24: own lanes, hops at crossings, no merged runs.
5. **Show the physical causes the lessons name.** The ground wire, the PHONO/LINE switch and the RCA leads on 17. The DVS cabling on 18. The −6 dB edges agreeing with the field, and sub interference shown or disclosed, on 20.

