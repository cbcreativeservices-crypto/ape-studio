# DJ Systems Lab Stage 1: skeptical visual review (2026-10-18)

This was a review only. Captures (32) are in `C:\Users\profe\AppData\Local\Temp\claude\dj_visual_review\` (s01_… to s12_…, s02_<item>.png, ref_miking_M01_step2.jpg). The pane was hidden (about 3 fps), so motion was judged from code. The sound was muted.

## BLOCKERS
1. **Screen 11's lesson cannot be seen.** Where: `art/plots.tsx` WaveLane 169–174, `art/waves.ts`, `PlayerTop.tsx` 118–122, and `gear.tsx` 259–276 (the laptop deck B is a solid bar). Deck B's lane is a solid slab, and the beat lines are drawn BEFORE the wave, so the wave hides them.
   Redraw:
   - Scale each lane so the 99th-percentile peak reaches about 80 % of the half-height.
   - Draw a peak envelope at about 55 % opacity plus an RMS core at full opacity.
   - Draw the grid ON TOP: beat lines 1 px white at 0.5, bar lines 2 px amber, each with a 1 px dark keyline.
   - Optionally tint the low band so kicks stand out. Keep the house loudness ramp.
2. **Screen 9 callouts point at the wrong channel.** Where: `pages/p09Eq.tsx` 86–92. HIGH, MID and LOW are hard-coded to `STRIP_X[1]` (CH1) while the halo and plot are on CH2. FILTER points at CH2 while CH1's filter is lit.
   Fix:
   - Derive every callout from `eqSel.ch` / `filtCh`, with labels on the strip's outer side.
   - The CH1 filter knob is cut by the glass edge; adjust the view's y and h.
3. **The power-strip end of every mains cord is drawn as an IEC C13.** Where: `art/cables.tsx` 42–50.
   Fix: add a third PlugFace kind `'mains'` for the outlet end: a moulded plug about 34×40 mm with a strain-relief boot. The device end stays IEC C13.

## MAJOR: realism and finish
4. **No printed legends at any zoom.** Where: `MixerTop.tsx` LEG = 7.6 and legends of 6–6.4 mm; `sceneText.tsx` 54 hides anything under 9 pt; `RearPanels.tsx` prints only the panel title. Even at Full Screen 3× the mixer is about 1.05 pt/mm.
   Fix:
   - Author legends at real silk-screen size (2.5–3.5 mm).
   - Add a zoom tier where legends draw once they render at 9 pt or more, and make 3× actually reach about 3.2 pt/mm.
   - Rear panels: grouped legend boxes "CH2 · PHONO / LINE · CH1", "MASTER OUT (BAL)", "BOOTH OUT", "AC IN", with a hairline bracket over each socket group.
   - Player keys: LOAD, BACK, IN/OUT, SYNC, MASTER, QUANTIZE, hot-cue numbers.
5. **The meters have no scale on the meter screen.** Where: `MixerTop.tsx` Meters 122–135.
   Fix: a printed scale between L and R at −24, −12, −6, −2 and 0, plus a CLIP cap. At 390 px, put a bezel-style scale strip beside the halo in screen points (9 pt or more).
6. **The headphones are in an impossible projection.** Where: `gear.tsx` Headphones 62–96. The headband is a front view, but the cups are face-on discs (a side view).
   Redraw in three-quarter or front view:
   - Each cup an upright oval about 70×95 mm, nearly edge-on.
   - Shell gradient lit from the upper left, a pleated cushion ring, and a swivel yoke.
   - A padded headband with stitching, and steel sliders into the yokes.
   - L/R embossed on the yokes.
   - A coiled cable drawn as overlapping lit ellipses, ending in a proper jack (shell, collar, sleeve, ring, tip, two insulator bands).
7. **The powered speaker is a flat box.** Where: `gear.tsx` PowerSpeaker 180–193.
   Redraw:
   - A trapezoidal cabinet with a 6–8 mm side-wall highlight.
   - A flared waveguide horn: elliptical throat in a rounded-rect mouth, with radial falloff.
   - A 12-inch woofer (cone, surround, dust cap) seen through a grille at about 0.55 opacity with lit hole edges.
   - A top handle cut-out and a pole-mount cup.
8. **The controller, laptop and interface are below the PlayerTop/MixerTop tier.** Where: `gear.tsx` ControllerTop 296–406, Laptop 235–289, InterfaceTop 413–431; `p02Gear.tsx` 114.
   - Controller: the mixer section is a slab, the meters are static and off the levelColor ramp, there are no browse, loop, sync or load controls, and the pad colours are arbitrary. Rebuild it with Knob, Fader, Key and LedColumn at true positions, plus loop, hot cues 1–4, sync and shift.
   - Laptop: its front elevation is mixed with a top-down controller. Draw it top-down, with keycaps and a trackpad.
   - Interface: it has no output jacks. Add two TRS outputs and a phones jack. Its USB cable ends in mid-air; give every USB run a real cable with a USB-A plug at the laptop and USB-B/C seated in a socket.
9. **Turntable problems.** Where: `TurntableTop.tsx` 44–50, 211–222; `boothGeometry.ts` TT 103–111; `p02Gear.tsx` 71.
   - The arm is 160 mm at rest and 193 mm playing, against 230 mm effective. Make it one fixed-length arm that rotates (pivot-to-spindle about 215 mm, effective 230 mm).
   - At rest the finger lift collides with the pitch-fader slot (x about 424 vs 425). Move the rest post so the headshell clears it, about 20 mm left.
   - An S-tube of about 8.5 mm, with a lift lever on its own base.
   - The START/STOP callout covers the start key and the 33 key.
   - Vinyl: the sheen is two hard pie wedges. Use two soft conic highlight bands (a SweepGradient with blurred alpha), and grooves at about 0.10 alpha white (currently invisible).
10. **Dimensions disagree with SOURCES (D67).** Where: `boothGeometry.ts` 60 and 75 vs `SOURCES.md` 61.
    - The player screen is 204×120 mm (about 9.2 inch) against 7 inch (about 155×87 mm).
    - The tempo fader is 140 mm against 100 mm.
    - Re-flow the hot-cue row and tempo column from the anchors. Check the player depth of 410 mm.

## MAJOR: crowding, overlaps and clipping
11. **The callout layout ignores the drawing.** Where: `Scene.tsx` layoutCallouts 94–122. It only pushes callouts apart from each other, downward, caps the width at 160 and never wraps.
    Callouts landing on controls:
    - Screen 2 player: HOT CUES on QUANTIZE.
    - Screen 2 mixer: MASTER·BOOTH over CH2 LOW, and PHONES over CH2 FILTER.
    - Screen 5: CUE and PLAY on the jog rim.
    - Screen 7: PHONES/BOOTH LEVEL over CH2 knobs; the "L: —" and "R: —" chips on the cups and cable, with "L - R" colliding.
    - Screen 10: TEMPO B covers jog B.
    - Screen 4: PA L and BOOTH L cover the cabinets.
    - 02b: the label is truncated ("CONTROLLER + INTERFACE: OUT…").

    Fix:
    - Feed the part boxes (mixerPartBox, playerPartBox, turntablePartBox) in as obstacles.
    - Try eight candidate sides and score them by overlap.
    - Wrap to two lines instead of cutting.
    - Prefer the margins, with leaders crossing at most one control.
    - Consider the Miking style: plain text, a dot and a hairline leader.
12. **The player's bar.beat readout is clipped.** Where: `PlayerTop.tsx` 155 (a SharedValue with align right); `sceneText.tsx` 57–60 only measures plain strings. It shows only "5" (D36). Fix: measure in a derived value and translate, or right-align into a fixed-width monospace slot.
13. **Screen 10's decks are cropped.** Where: `boothGeometry.ts` VIEWS.jogs 157. Deck A is a sliver, and Full Screen keeps the same crop with about 100 px empty (D35).
    Fix:
    - At 390: deck B whole; deck A as a labelled tempo-column inset; the mixer from the channel faders down.
    - Full Screen: a frame that fits both decks whole.
14. **The Screen 4 room map is at mixed scales.** Where: `SystemMap.tsx` 27–40, 170–195. The PA is at 0.42 and the monitors at 0.36, but the rears and the 330 mm strip are at 1.0. The speakers float with no stands, and each speaker input is a grey dot under a FRONT view.
    Redraw as a two-band elevation:
    - Room band: a floor line, PA on tripod stands, booth monitors, all at one stated factor, with a "room not to scale" note.
    - Patch band: real SpeakerRear input plates (combo socket plus IEC) at 1.0 beside the player and mixer rears, with cables running to those plates and the strip at the same scale.

## MAJOR: cables (D69)
15. **No cable labels; same-colour runs cannot be told apart.** Where: `SystemMap.tsx` 197 (labelAt is never passed), `cables.tsx` 58. Master XLR, booth TRS and phones are all black; the mains cords are #0e0e10 on near-black; only R carries a dash pattern.
    Fix:
    - A 9 pt label flag on every run ("MST L", "BTH R", "PWR PA L").
    - A jacket tone and pattern per type: XLR dark grey with a fine stripe, TRS black with dots, mains thicker with a ribbed highlight.
    - Velcro ties every 60 mm on parallel lanes.
16. **The booth R cable runs over the booth L plug.** Where: `SystemMap.tsx` routeOf 115–118, booth.L (138, 40) and booth.R (138, 70). Fix: route R sideways first (x + 14, then up), or downward. Add an invariant test: no route passes within one plug radius of another plug.
17. **Loose ends and plug bodies look primitive.** Where: `cables.tsx` 52–56. A loose plug is a lollipop (a rounded rect and a dot), the cables hang dead straight, and a plugged RCA looks almost the same as an empty one.
    Redraw:
    - Loose end: a catenary sag (a quad curve dipping 15–20 mm) ending in a side-view RCA (coloured collar, nickel barrel with a highlight, pin, split ground sleeve, boot).
    - Plugged state: a short protruding barrel in slight perspective, with a blurred cast shadow.

## MINOR
18. **The signal flow is a static glow.** `p04Build.tsx` 104 always passes flow; `useBoothAudio.ts` 31–33 describes a pulse that does not exist. Add a slow dash-offset travel along live runs from `clock`, gated by `audio.flowMotion`.
19. **Lesson loops are not registered** in `test/patternP10b_20261002.test.ts` (platter, jog, waveform scroll, meters). The motion otherwise follows the charter. Note: the 90 strobe dots at true speed alias at 60 Hz; draw the stroboscopic truth instead (dots still at 0 % pitch, drifting in proportion to the pitch offset).
20. **Rear panels have hard shadows and no depth** (`RearPanels.tsx` 27). Blur the shadow; add a 4 mm top lip and vent slots.
21. **Screen 5 empty deck.** The playhead strikes through "NO TRACK", and the zoom centre line crosses "BROWSE TO LOAD". Hide both lines with no track loaded.
22. **Screen 1.** An empty band of about 45 px under the table (`BoothStage.tsx` 62–65). The mixer's front headphone jacks read as "o o" at 3×; draw knurled jack nuts on a chamfered lip.
23. **Web loading gaps.** Full Screen 3× is blank for about 3 s; Scene fonts load per canvas (titles pop in late); the perspective chips are empty for about 2 s; the callout chips stay 10.5 pt at every zoom (D35 says everything zooms).
24. **Screen 2's bezel shows "SENDS TO CONTROLLER" for every item**, including the turntable and speaker.

## The five changes that would most raise the lab
1. Rebuild the waveform renderer once, for every lane, player screen and laptop: headroom scaling, peak plus RMS, and the grid on top with keylines.
2. Printed silk-screen legends and meter scales that appear with zoom (3× really reaching about 3 pt/mm); fix the bar.beat clipping.
3. Rewrite the callout placement to avoid controls, using part boxes as obstacles, wrapping and Miking-style labels; fix the Screen 9 mismatch and every overlap in finding 11.
4. Redraw Screen 4 as a consistent-scale room plus patch elevation: stands, real speaker rear plates, correct mains plugs, labelled, patterned and tied runs, sagging loose ends with real plug bodies, and the booth L/R crossing fixed.
5. Bring the Screen 2 gallery up to the PlayerTop/MixerTop tier: headphones, speaker, controller, top-down laptop, interface outputs with a connected USB, the turntable at its true arm geometry, and Screen 10 framing in Full Screen.
