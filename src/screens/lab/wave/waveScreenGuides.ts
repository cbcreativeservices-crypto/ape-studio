/**
 * Wave Physics Laboratory — "explain this screen" content (owner 2026-10-31,
 * the Screen Guide pilot). One guide per module (keyed by WaveModuleId) plus
 * one for the lab home.
 *
 * Every line was written against the module's own code (modWaveA / modWaveB /
 * vizWave): the names are the on-screen names (bezel keys, dock labels, layer
 * chips, labels drawn on the display), and every number quoted in TRY THIS is
 * what the engine prints for that setting (default scene unless the step says
 * otherwise). Change a module's labels, ranges or default scene → update its
 * guide here; test/screenGuide_20261031.test.ts pins the shape.
 *
 * STEPPED (owner review 2026-10-31: "too much to scroll"): each section is one
 * step and must fit a 375×812 phone with no scrolling, beside the area it
 * explains — so each section is held to SCREEN_GUIDE_BUDGET (types.ts):
 * seeing / changes / teaches sit in the space under the display (~430
 * characters), control sits over the display (~700), one TRY THIS experiment
 * rides a strip above the dock (~200). Tighten wording; never cut accuracy.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; no build notes in learner text.
 *
 * Layer chip names differ by file and are quoted as drawn: modules 1–8 say
 * WAVE FIELD for the loudness map, modules 9–15 and the Room Builder say HEAT.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { WaveModuleId } from './modules/registry';

export const WAVE_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'The Wave Physics menu: experiments on how sound travels, bounces, bends and adds up.',
    'THE 15 MODULES: one row per experiment. A ✓ marks a module you have opened.',
    'PUT IT ALL TOGETHER: the Room Builder, a sandbox that combines them all.',
    'GUIDED LESSON (top) explains every control. SEE WHAT’S LEFT (bottom) lists what you have not opened yet.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Inside a module: the display on top, readouts on its frame, controls in the dock at the bottom, notes to scroll below.',
    'The strip under a module’s title moves between modules; ‹ leaves the lab.',
    'Tap ⓘ beside any module’s title to have that screen explained. Long-press a control for its guided-lesson entry.',
  ],
  changes: [
    'Modules 1–3: sound hitting surfaces — reflection, absorption, diffusion.',
    'Modules 4–5: sound bending — through warm and cool air, and around obstacles.',
    'Modules 6–8: waves adding and cancelling — interference, comb filtering, standing waves.',
    'Modules 9–13: loudspeakers. Modules 14–15: echoes and reverberation. All run on one room engine.',
  ],
  teaches: [
    'How sound reflects, is absorbed, scatters, bends and combines.',
    'Why one loudspeaker sounds different at every seat.',
    'The physics behind everyday fixes: moving a mic, treating a wall, delaying a speaker.',
    'Every display is an illustrative model, made to show the idea — not to measure a real room.',
  ],
  tryThis: [
    'New to acoustics? Work through the modules in order — each one builds on the last.',
    'Start with Reflection Visualizer: drag the speaker and the listener and watch the paths redraw.',
    'Finish in the Room Builder: recreate a problem you met in an earlier module.',
  ],
};

export const WAVE_SCREEN_GUIDES: Record<WaveModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  reflection: {
    seeing: [
      'A room from above, 8 m × 6 m, walls named by material (CONCRETE to start). Drag the speaker (source) or the listener.',
      'RAYS: amber = the direct sound, blue = one bounce, faint = two bounces.',
      'PRESSURE: rings, and a pulse with one dot per path. ARRIVALS: each arrival’s delay and level.',
      'Readouts: DIRECT and 1ST REFL (arrival times), REFL LVL (1st reflection vs direct), LOSS/BNC (lost per bounce).',
    ],
    control: [
      'Drag the speaker or the listener; every ray and number re-solves at once.',
      'FREQ fader (63 Hz–8 kHz): changes how much the walls absorb, not where the paths go.',
      'MAT key: one material for all four walls — concrete, glass, wood, drywall, curtains, acoustic foam or fiberglass. Long-press foam or fiberglass for a photo.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS on or off.',
    ],
    changes: [
      'Move the speaker or listener: the paths change length, so the times change — sound covers about 34 cm per millisecond.',
      'Angle in = angle out, measured from the normal (the line square to the wall).',
      'A reflection always arrives later AND quieter: a longer trip, and the wall keeps a share.',
      'MAT and FREQ change REFL LVL and LOSS/BNC, not the paths. Soft walls take mids and highs but let bass bounce back.',
    ],
    teaches: [
      'The law of reflection, measured from the normal — never from the wall’s surface.',
      'The image source: a reflection acts as if it came from a mirror-image speaker behind the wall — a drawing method, not a real source.',
      'Every bounce costs energy, depending on material and frequency.',
      'A reflection’s extra distance is a time delay — the cause of comb filtering (Module 7).',
    ],
    tryThis: [
      'Drag the listener right up to a wall: 1ST REFL nears DIRECT and REFL LVL rises toward 0 dB — a strong, early reflection.',
      'At 1 kHz switch MAT from CONCRETE to FIBERGLASS: the rays stay put, REFL LVL drops about 20 dB and LOSS/BNC reads about 20 dB.',
      'Keep FIBERGLASS and slide FREQ to the bottom: LOSS/BNC falls to about 1.5 dB — bass bounces back even off soft walls.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  absorption: {
    seeing: [
      'A 7 m × 5 m room from above; all four walls share one material (DRYWALL to start). A glinting inner edge reflects; a matte one absorbs.',
      'Drag the speaker or listener. RAYS: amber direct, blue reflections. Pulse dots turn from red to blue as the walls soak them up.',
      'Readouts: α @ (frequency) — share absorbed, 0 to 1. 1 BOUNCE — energy left after one bounce. α 125 Hz / α 4 kHz — low vs high.',
    ],
    control: [
      'FREQ fader (63 Hz–8 kHz): the frequency being studied.',
      'MAT key: concrete, glass, drywall, wood, curtains, carpet, acoustic foam, fiberglass or audience — every wall takes it, and each option has a one-line description. Long-press foam or fiberglass for a photo.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS. Drag the speaker or listener to move the paths.',
    ],
    changes: [
      'More absorption → higher α, less left after a bounce, shorter RT60 (below the display: how long the room takes to fall 60 dB).',
      'Porous materials (foam, fiberglass, curtains, carpet) lose α at low frequencies: they work where air moves fastest, a quarter wavelength off the wall — 69 cm at 125 Hz.',
      'Drywall and glass flex at low frequencies: they absorb some bass and reflect the highs.',
    ],
    teaches: [
      'Absorption depends on frequency: thin porous materials tame mids and highs, not bass.',
      'Bass control needs thickness, an air gap, or tuned bass traps.',
      'Absorption works INSIDE a room; keeping sound in or out is isolation — another job.',
      'Too much absorption makes a room sound dead.',
    ],
    tryThis: [
      'Pick ACOUSTIC FOAM: α 125 Hz reads 0.11 and α 4 kHz reads 0.99 — the same panel, nearly useless low, nearly perfect high.',
      'At 125 Hz switch between DRYWALL and ACOUSTIC FOAM: drywall absorbs more bass (α 0.29 against 0.11).',
      'Pick FIBERGLASS and sweep FREQ down: α stays near 1 to about 500 Hz, then falls to 0.29.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  diffusion: {
    seeing: [
      'A concrete room from above, 7 m × 5 m. The top wall carries a DIFFUSER: wells of different depths. Drag the speaker or the listener.',
      'RAYS: a working diffuser breaks the mirror reflection into a fan of thin, dim rays; below its range it stays one ray.',
      'Readouts: TOP WALL, DEPTH, MIN ƒ (the lowest frequency it scatters) and @ (frequency): MIRROR, SCATTER or BELOW ƒ.',
    ],
    control: [
      'DEPTH fader (0.05–0.60 m): how deep the wells are; they deepen on the panel as you slide.',
      'FREQ fader (125 Hz–8 kHz): the frequency being studied.',
      'DIFFUSER key: fit or remove the panel (off = plain concrete).',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS. Drag the speaker and the listener.',
    ],
    changes: [
      'Deeper wells reach lower: MIN ƒ ≈ speed of sound ÷ (2 × depth) — about 860 Hz at 0.20 m.',
      'Below MIN ƒ the waves are too long to notice the wells: the panel acts like a flat wall (BELOW ƒ).',
      'Above it, the reflection spreads in many directions and smears slightly in time — no hard slap.',
      'ENERGY RETURNED (below the display) stays the same on or off: scattering spreads energy, it does not remove it.',
    ],
    teaches: [
      'Diffusion SPREADS reflected energy; absorption REMOVES it.',
      'A diffuser’s well depth sets its lowest working frequency.',
      'Diffusion keeps a room lively while breaking up harsh, mirror-like reflections.',
      'Listeners need some distance from a diffuser for the sound to blend.',
    ],
    tryThis: [
      'At 1 kHz tap DIFFUSER off and on: one bright ray becomes a fan of dim ones — the same energy, spread out.',
      'Slide DEPTH to 0.05 m: MIN ƒ jumps to about 3.4 kHz and the readout says BELOW ƒ — at 1 kHz the panel is now a mirror.',
      'Leave DEPTH there and raise FREQ past MIN ƒ: the fan of rays comes back.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  refraction: {
    seeing: [
      'Outdoors, side view: a PA speaker on a pole 2 m up at left. A listener stands 150 m away (marked 150 m).',
      'Rays fan out from the speaker; the amber one leaves level. Sky tint, thermometer strip and WARM AIR / COOL AIR labels show the warmer layer.',
      'HEIGHT ×20: heights stretched so the bend shows. Readouts: c GROUND, c @60m (speed and temperature 60 m up), BEND, H @150 m (amber ray’s height at the listener).',
    ],
    control: [
      'GRAD fader: LAPSE (cooler air higher up, a sunny day) → NEUTRAL → INVERSION (warmer air higher up, night or over water). It starts on INVERSION. At NEUTRAL with the wind CALM, the display reads UNIFORM AIR.',
      'WIND fader: CALM up to 12 m/s aloft, blowing from the speaker toward the listener. Arrows and a WIND label appear.',
    ],
    changes: [
      'Sound is faster in warm air: the part of a wavefront in warmer air pulls ahead, bending the path toward cooler air.',
      'INVERSION: rays curve DOWN; H @150 m falls, even to GROUND. LAPSE: rays curve UP, over the listener.',
      'c @60m moves only from about 338 to 348 m/s (343 at the ground) — enough to bend sound.',
      'WIND also bends rays DOWN: it is stronger higher up, so downwind the sound’s speed grows with height.',
    ],
    teaches: [
      'Refraction: sound bends when its speed changes with height — the air acts like a lens.',
      'Why sound carries at night and over water: cool air below warm air bends it back down.',
      'Why a show fades on a hot afternoon: warm ground air bends sound up and away.',
      'Why sound carries farther downwind: the wind blows harder higher up, so it bends sound back down, as an inversion does.',
    ],
    tryThis: [
      'Push GRAD fully to INVERSION: the amber ray curves down and H @150 m reads GROUND.',
      'Pull GRAD fully to LAPSE: the rays lift away and H @150 m reads about 4.6 m — over the listener.',
      'Stay on LAPSE and raise WIND to 12 m/s: H @150 m falls from about 4.6 m to about 3.4 m — the wind aloft pulls the rays down.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  diffraction: {
    seeing: [
      'Outdoors, from the side, to true scale: a speaker, a wall (barrier) and a listener — each 10 m from the wall, 1.5 m up.',
      'Rings spread from the speaker; past the wall’s top a second set bends down behind it. The SHADOW ZONE darkens where the loss is greater.',
      'Readouts: λ (wavelength), BARRIER, FRESNEL N (how many half-wavelengths longer the path over the top is) and LOSS @ (frequency).',
    ],
    control: [
      'FREQ fader (63 Hz–8 kHz): the rings tighten as it rises. At high frequencies RING GAP > λ appears — the real wavelength is too fine to draw ring by ring.',
      'BARRIER fader (2–8 m): the wall’s height, drawn to scale.',
    ],
    changes: [
      'Low frequencies are metres long — as big as the wall — so they wrap over the edge: a modest LOSS.',
      'High frequencies are centimetres long; the detour is many wavelengths: a deep shadow.',
      'A taller wall lengthens the detour: FRESNEL N and LOSS rise, most of all for highs.',
      'The glow at the listener shows it: warm = little loss, blue = a lot. The loss is never total.',
    ],
    teaches: [
      'Diffraction: waves bend around objects about their own size or smaller.',
      'Lows wrap around barriers; highs cast shadows.',
      'A shadow zone is not silence — mostly it is a loss of highs.',
      'Why a pillar in front of a PA dulls the highs behind it while the bass carries on.',
    ],
    tryThis: [
      'With BARRIER at 4 m, slide FREQ from bottom to top: LOSS goes from under 9 dB to about 28 dB — about 19 dB more shadow for the highs, from the same wall.',
      'At 1 kHz raise BARRIER from 2 m to 8 m: FRESNEL N climbs and the shadow darkens.',
      'Below the display, compare LOW REF — LOSS @ 80 Hz with HIGH REF — LOSS @ 8 kHz: that gap is the shadow.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  interference: {
    seeing: [
      'An 8 m × 6 m open space from above: two speakers (S1 left, S2 right) and a listener. No walls, so only the two direct sounds meet.',
      'WAVE FIELD: loudness at this frequency — red where the waves add, blue streaks where they cancel. PRESSURE: rings from both speakers.',
      'Readouts: S1 PATH, S2 PATH, Δ PATH (their difference in wavelengths, λ) and vs 1 SPKR (the pair vs one speaker: up to +6 dB, or NULL).',
    ],
    control: [
      'Drag either speaker or the listener.',
      'FREQ fader (63 Hz–2 kHz). DELAY fader (0–10 ms): holds back S2’s sound.',
      'POL Ø S2 key: flips S2’s polarity — its push becomes a pull.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS.',
    ],
    changes: [
      'Δ PATH a whole number (0, 1, 2…): the waves arrive in step and add — about +6 dB.',
      'Δ PATH a whole number plus a half (0.5, 1.5…): they arrive opposed and cancel — toward NULL.',
      'Higher FREQ = shorter wavelength, so the bands crowd together; lower spreads them out.',
      'DELAY and POL Ø shift S2’s timing, so the pattern slides with nothing moved.',
    ],
    teaches: [
      'Interference: sources add where they arrive in step and cancel where they arrive opposed.',
      'A null belongs to one place AND one frequency.',
      'Two sources give +6 dB only where they arrive in phase.',
      'Why engineers walk a venue instead of trusting one listening spot.',
    ],
    tryThis: [
      'At the start the listener is equally far from both: Δ PATH 0.00 λ, vs 1 SPKR about +6 dB. Turn on POL Ø S2 — it drops to NULL.',
      'Turn POL Ø S2 off and drag the listener sideways: vs 1 SPKR swings between +6 dB and NULL as Δ PATH passes 0.5 λ.',
      'Back at the start, at 500 Hz, set DELAY to 1.0 ms: half a cycle late, S2 cancels as if its polarity were flipped.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  comb: {
    seeing: [
      'Top: a speaker, a microphone and one hard wall at right; the other sides are open, so the mic hears the direct sound plus one reflection.',
      'Bottom: the response at the mic, 20 Hz–20 kHz (0 dB = direct alone). The dips are notches, like a comb’s teeth.',
      'Readouts: Δt (how much later the reflection lands), 1ST NULL, SPACING (between notches), MIC→WALL.',
    ],
    control: [
      'WALL fader (3–10 m): moves the hard wall farther away.',
      '← MIC / MIC → keys: nudge the mic 0.15 m (about six inches) per press. You can also drag the mic.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS.',
    ],
    changes: [
      'At each frequency the two copies add (in step) or cancel (half a cycle apart).',
      '1ST NULL = 1 ÷ (2 × Δt); the rest repeat every SPACING = 1 ÷ Δt.',
      'Mic nearer the wall: Δt shrinks, so the notches spread and move up. Farther: they crowd together.',
      'WALL farther away: the reflection is later and weaker, so the notches crowd and get shallower.',
    ],
    teaches: [
      'Comb filtering: a sound plus a delayed copy of itself makes evenly spaced notches.',
      'It is time and position, not tone: EQ cannot fix it; moving the mic or treating the surface can.',
      'A tiny move shifts every notch.',
      'It is delay plus sum, not a room resonance (that is Module 8).',
    ],
    tryThis: [
      'At the start (mic 0.50 m from the wall): Δt ≈ 2.91 ms, 1ST NULL ≈ 172 Hz. Press MIC → once: every notch jumps higher.',
      'Press ← MIC a few times: the notches crowd together as the delay grows.',
      'Slide WALL all the way out: the comb flattens — the reflection is late and weak.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  standing: {
    seeing: [
      'A 5 m × 4 m concrete room from above, filled with one room mode. The speaker is in a corner; the listener can be dragged.',
      'Red = antinodes, where pressure swings hardest. Dark blue = nodes, where it barely moves. The pattern stays put.',
      'Readouts: MODE (nx,ny) and its frequency, TYPE (AXIAL: two walls; TANGENTIAL: all four), PRESSURE (% of max at the listener), VERDICT (NODE / ANTINODE / BETWEEN).',
    ],
    control: [
      'WIDTH fader (2–10 m): the room’s left-to-right size. DEPTH fader (2–10 m): its top-to-bottom size.',
      'MODE key: (1,0), (0,1), (1,1), (2,0), (2,1) or (3,0) — half-wavelengths across the width, then down the depth.',
      'Drag the listener through the pattern.',
    ],
    changes: [
      'Drag the listener: the speaker plays the same, yet PRESSURE runs from 0 % on a node to 100 % on an antinode (every corner is one).',
      'Change WIDTH or DEPTH: the frequency moves. (1,0) fits half a wavelength across, so wider = lower.',
      'Higher mode numbers: higher frequencies, more node lines. Materials do not set these — dimensions do.',
    ],
    teaches: [
      'Room modes: at certain low frequencies, reflections pile up into a pattern that stands still.',
      'On a node a mic or seat misses that note; on an antinode it gets too much.',
      'Dimensions set the modes; bass traps damp them but never remove them.',
      'Modes rule the low end; above the Schroeder frequency (below the display) they blur into reverberation.',
    ],
    tryThis: [
      'At the start the listener is mid-room on (1,0): VERDICT NODE, about 34 Hz. Drag it to the left or right wall — ANTINODE.',
      'Pick (2,0): the middle becomes an ANTINODE; the nodes sit a quarter of the way in from the left and right walls.',
      'On (1,0), slide WIDTH from 5 m to 10 m: the frequency halves, from about 34 Hz to about 17 Hz.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  coverage: {
    seeing: [
      'Open space from above (14 m × 10 m, no walls): one loudspeaker at the top aimed down, and a listener.',
      'HEAT: loudness at this frequency — red loud, blue quiet. The dashed lines are the coverage edges, 6 dB down from straight ahead.',
      'Readouts: NOM COV (rated angle), EFF @ (frequency) (the real angle now), λ, vs ON-AXIS (listener vs a spot straight ahead, same distance).',
    ],
    control: [
      'FREQ fader (80 Hz–8 kHz). AIM fader (−60° to +60°): turns the speaker.',
      'COV key: the rated pattern — 40°, 60°, 90° or 120°.',
      'Drag the listener anywhere. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Higher FREQ: the dashed edges swing in and EFF narrows — highs beam, lows spread.',
      'In this model the rated angle holds near 1 kHz: wider below, narrower above.',
      'Off to the side the highs go first: vs ON-AXIS falls more at high frequencies.',
      'AIM turns the whole pattern. Outside the high-frequency edges a seat sounds dull, even with good bass.',
    ],
    teaches: [
      'Directivity: a loudspeaker’s coverage narrows as frequency rises.',
      'On-axis and off-axis sound differ; coverage is about off-axis.',
      'Lows spread almost everywhere.',
      'Aim the high-frequency pattern at the audience, not the cabinet at the room.',
    ],
    tryThis: [
      'Drag the listener well off to one side and sweep FREQ up: vs ON-AXIS barely moves at first, then drops as the highs beam away.',
      'At 8 kHz switch COV between 40° and 120°: EFF and the red wedge change width.',
      'Slide FREQ to the bottom at 90°: EFF opens past 300° — the bass goes nearly everywhere, even behind the speaker.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  linearray: {
    seeing: [
      'A side view of a venue: distance runs left to right (20 m), height up the screen (9 m); the audience floor runs along the bottom.',
      'At left hangs the line array: boxes at true size, tilted by the splay. The standing person is the listener — drag them.',
      'HEAT: red loud, blue quiet. Readouts: BOXES, LEN (array length), λ, LF CTRL (YES when the array is at least one wavelength long).',
    ],
    control: [
      'FREQ fader (60 Hz–8 kHz).',
      'ARRAY key: BOXES (2–8), SPLAY (PER BOX) (0°–8° between neighbours) and HEIGHT (HANG DEPTH) — how far down from the top the array hangs (0.40–3.00 m).',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Close boxes act as one tall source when the wavelength is long; more boxes = longer LEN = control down to lower notes.',
      'When λ is longer than the array (LF CTRL: NO), the lows spill everywhere.',
      'SPLAY fans the boxes: too little gives a tight beam that misses the near seats; too much leaves gaps or lobes.',
      'HEIGHT moves the array, changing where its beam lands.',
    ],
    teaches: [
      'An array’s length controls its lows; its splay shapes its coverage.',
      'Arrays couple (join together) at low frequencies and beam at high ones.',
      'Stacking boxes is about geometry, not just level.',
      'Pattern control needs an array at least one wavelength long.',
    ],
    tryThis: [
      'With 4 boxes (about 2 m), slide FREQ down until LF CTRL flips to NO — around 170 Hz, where λ matches the array.',
      'Set BOXES to 8 and repeat: control now reaches down to about 90 Hz.',
      'At 4 kHz slide SPLAY from 0° to 8°: the red beam fans out across the floor.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  delayalign: {
    seeing: [
      'Open space from above (16 m × 10 m): a subwoofer at upper left, a main speaker to its right, and a listener. Both play the crossover frequency.',
      'HEAT: red where the two add, blue streaks where they cancel. PRESSURE: rings and dots show when each sound lands.',
      'Readouts: REQ (the delay the main needs for this seat), SET (your delay), OFF BY (the gap), SUM (0.0 dB = perfectly in step).',
    ],
    control: [
      'DELAY fader (0–20 ms): holds back the main speaker.',
      'XOVER fader (80–120 Hz): the frequency both speakers play.',
      'ALIGN key: MAIN POLARITY Ø (labelled THE WRONG TOOL) and AUTO-ALIGN, which sets DELAY to REQ for this seat.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'At the start the sub is farther from the seat, so its sound lands later; delaying the main by the difference lines them up.',
      'As OFF BY nears 0, SUM rises toward 0.0 dB and the blue null closes.',
      'Move the listener and REQ changes: an alignment is exact at one spot, close nearby, never everywhere.',
      'A polarity flip turns the wave over but does not move it in time: right at one frequency, wrong at the next.',
    ],
    teaches: [
      'Time alignment: matching arrival times so a sub and a main add instead of cancel.',
      'Alignment is TIME, not distance — processing delay is invisible to a tape measure.',
      'Polarity and delay are different tools.',
      'An alignment has to be checked at more than one seat.',
    ],
    tryThis: [
      'At the start OFF BY reads about −6.96 ms. Tap AUTO-ALIGN: OFF BY goes to about 0 and SUM to about 0.0 dB.',
      'Now drag the listener toward the main speaker: REQ changes and SUM slips below 0 dB — one seat fits best.',
      'Set DELAY back to 0 and try MAIN POLARITY Ø; sweep XOVER: the flip helps some frequencies and hurts others.',
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  cardioidsub: {
    seeing: [
      'Open space from above: FRONT SUB and REAR SUB, 1.2 m apart; the rear label shows its delay (and Ø when flipped). AUDIENCE ↓ is toward the bottom.',
      'The listener is the FRONT probe (drag it); REAR MIC is fixed 3 m behind the stack. HEAT: red loud, blue quiet.',
      'Readouts: DELAY (on the rear sub), FRONT and REAR (the level at each probe), F − R (front minus back).',
    ],
    control: [
      'DELAY fader (0–8 ms): delays the rear sub. FREQ fader (40–120 Hz).',
      'MODE key: the CARDIOID and WRONG WAY presets, REAR POLARITY Ø INVERT, and SOLO FRONT SUB (mutes the rear sub).',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'CARDIOID: the rear sub is delayed by the 1.2 m crossing time (about 3.5 ms) and flipped; behind, both arrive together but opposite and largely cancel.',
      'In front the rear sound lands later, so they mostly add; FRONT varies a little with frequency.',
      'WRONG WAY: same delay, normal polarity — the null flips onto the audience, deepest near 71 Hz.',
      'SOLO FRONT SUB: one sub, an even circle — nothing to cancel against.',
    ],
    teaches: [
      'Two subs, one delay and one polarity flip: bass forward, cancelled behind.',
      'Directional bass needs at least two sources — one sub alone cannot be cardioid.',
      'Spacing, delay and polarity must match, or the null lands in the wrong place.',
      'Rear rejection is limited by frequency band and geometry.',
    ],
    tryThis: [
      'Tap CARDIOID: blue forms behind the stack and F − R jumps from about 0 dB to about 15 dB.',
      'With CARDIOID on, sweep FREQ from 40 to 120 Hz: REAR stays near −20 dB while FRONT moves only a little.',
      'Tap WRONG WAY near 71 Hz: FRONT drops. Then tap SOLO FRONT SUB: F − R falls to about 3 dB — just distance.',
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  beamsteer: {
    seeing: [
      'Open space from above (24 m × 14 m): a row of subwoofers 2 m apart across the top, and a listener.',
      'Dashed line = the steering angle. Amber bar on each box = its delay (longer = later). HEAT: the red beam is where the energy goes.',
      'Readouts: STEER, Δt/BOX (the delay step between boxes), GRATING (NONE or IN FIELD), vs STRAIGHT (listener vs the unsteered array).',
    ],
    control: [
      'STEER fader (−60° to +60°). FREQ fader (40–120 Hz).',
      'BOXES key: 4, 5 or 6 boxes.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Δt = spacing × sin(angle) ÷ speed of sound. Each box starts a little after its neighbour, so the wavefront tilts toward the later boxes.',
      'The boxes never move — only their timing changes.',
      'More boxes: a longer array and a narrower beam.',
      'High frequency + big angle: grating lobes — extra beams once the wavelength is short next to the 2 m spacing.',
    ],
    teaches: [
      'A steady delay step tilts an array’s beam without tilting the boxes.',
      'Steering redirects energy; it does not widen coverage.',
      'Steering depends on frequency — steer too far and grating lobes appear.',
    ],
    tryThis: [
      'Set STEER to 20°: Δt/BOX reads about 1.99 ms, the bars form a staircase and the beam swings toward the delayed end.',
      'Watch vs STRAIGHT at the centre seat fall as the beam leaves it.',
      'Raise FREQ to 120 Hz and STEER past 30°: GRATING reads IN FIELD.',
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  echo: {
    seeing: [
      'Top: a big space from above — source at left, listener, surfaces labelled (ROCK in the canyon). The highlighted line is the far-wall echo path.',
      'Bottom: the timeline — each stem an arrival (taller = louder): grey direct, amber within 50 ms, red later. FAR WALL marks the echo.',
      'Readouts: DIRECT, GAP (to the first reflection), 1ST REFL (FUSES or ECHO), FAR WALL (its delay after the direct sound).',
    ],
    control: [
      'ROOM key: CANYON 60 m, GYM 24 m, CHURCH 30 m or WAREHOUSE 40 m, each with a short description.',
      'Drag the listener anywhere. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Hearing blends a reflection within about 50 ms into the direct sound — fullness, not a repeat: FUSES.',
      'Later, and loud enough, it is a separate repeat: an echo.',
      'In everyday rooms the nearest surface answers first and fuses; a distant hard wall answers late — the echo.',
      'Many late returns packed close together become reverberation (Module 15).',
    ],
    teaches: [
      'Fused reflection vs separate echo, and the roughly 50 ms line between them (the precedence, or Haas, effect).',
      'An echo needs enough delay AND enough level.',
      'The first reflection is usually not the echo.',
      'Echo = separate repeats; reverberation = a dense, continuous tail.',
    ],
    tryThis: [
      'Pick GYM: GAP about 12 ms FUSES, while FAR WALL returns about 117 ms later — an echo. Both at once.',
      'Pick CANYON: even the side rock is far enough that 1ST REFL reads ECHO; the far rock face answers about 290 ms later.',
      'In any space, drag the listener up to a side wall: GAP shrinks and 1ST REFL flips to FUSES.',
    ],
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  reverb: {
    seeing: [
      'Top: a 12 m × 9 m room from above with a source and a listener. Walls are concrete; treated walls turn to fiberglass (the top one starts treated).',
      'Bottom: the decay — level against time. Amber = this room, dim = all concrete. A playhead moves with the pulse.',
      'Readouts: RT 125, RT 500, RT 2K (time to fall 60 dB at low, mid and high) and GAP (direct sound to first reflection).',
    ],
    control: [
      'ABSORB fader: how many of the four walls are fiberglass, from 0/4 to 4/4.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Each treated wall soaks up more at every bounce: the RT values fall and the amber tail drops below the dim one.',
      'RT 2K falls far more than RT 125 — fiberglass takes mids and highs better than bass.',
      'GAP depends on where the listener stands, not on the material.',
      'Reverb builds: direct sound, a few early reflections, then a dense fading tail.',
    ],
    teaches: [
      'Reverberation is a build-up, not a single thing.',
      'RT60: the time sound takes to fall 60 dB after the source stops.',
      'Porous absorption shortens the highs more than the lows.',
      'Rooms with the same RT60 can still sound different — early reflections matter.',
    ],
    tryThis: [
      'Slide ABSORB to 0/4: RT 500 reads about 2.2 s. At 4/4 it falls below 0.4 s.',
      'At 4/4 compare RT 125 (about 0.9 s) with RT 2K (about 0.36 s): the bass rings longest.',
      'Drag the listener right up to a wall: GAP shrinks to a millisecond or two.',
    ],
  },

  // ── ◎ ─────────────────────────────────────────────────────────────────────
  builder: {
    seeing: [
      'A room from above — 12 m × 8 m, drywall to start — with one loudspeaker and a listener. A selected source wears an amber ring.',
      'HEAT: loudness at the FREQ setting. Outside, the rings carry on; each wall’s tag reads THROUGH −N dB — what that wall stops.',
      'Readouts: ROOM, LVL @ (frequency) at the listener, 1ST ARR (first arrival), RT60 (at 500 Hz).',
    ],
    control: [
      'Drag any source or the listener; tap a source to select it.',
      'FREQ fader (40 Hz–8 kHz): the frequency the whole picture shows.',
      'ROOM key: ROOM WIDTH and ROOM DEPTH (3–30 m). WALLS key: pick TOP, RIGHT, BOTTOM or LEFT, then its material.',
      'SRC key: add a POINT, SPEAKER or SUB (up to four). For the selected one: LEVEL, DELAY, POLARITY Ø INVERT — plus AIM and coverage for a speaker — or remove it.',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Everything from the other modules happens at once: reflections, absorption, interference, modes, coverage.',
      'A wall’s material changes its reflections, RT60 and THROUGH figure — concrete stops far more than curtains or foam.',
      'Lower FREQ: walls let more through, and a small room shows bright and dark mode bands.',
      'The outside view is a simple teaching model; real isolation depends on construction and gaps.',
    ],
    teaches: [
      'How the lab’s separate effects combine in a real room.',
      'Diagnosis: matching a symptom (a boom at one seat, a hollow sound near a wall, dull highs at the back) to its cause.',
      'Absorption is not isolation (keeping sound in): soft walls tame reflections but let bass out.',
      'Position is the cheapest fix: moving a source or listener often beats EQ.',
    ],
    tryThis: [
      'Shrink the room to about 4 × 3 m and set FREQ between 40 and 120 Hz: mode bands appear. Make two walls FIBERGLASS: RT60 falls.',
      'Add two SUBs 1.2 m apart; delay the rear one about 3.5 ms with POLARITY Ø INVERT. At about 60 Hz: energy forward, quiet behind.',
      'Make one wall CURTAINS and one CONCRETE, then sweep FREQ down: the curtain lets nearly everything through.',
    ],
  },
};
