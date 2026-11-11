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
  intro: {
    learning: 'The big ideas of room acoustics, in order: how sound bounces, is absorbed, scatters, bends and adds up, and why one loudspeaker sounds different at every seat.',
    start: 'Tap Reflection Visualizer to read its one-line description, then tap OPEN. Inside any module, tap ⓘ beside the title to have that screen explained.',
  },
  seeing: [
    'This is the Wave Physics menu: experiments on how sound travels, bounces, bends and adds up.',
    'THE 15 MODULES lists one experiment per row. A ✓ marks each one you’ve opened.',
    'PUT IT ALL TOGETHER opens the Room Builder, where every effect from the modules happens in one room.',
    'GUIDED LESSON at the top explains every control. SEE WHAT’S LEFT at the bottom lists the modules you haven’t opened yet.',
  ],
  control: [
    'Tap a module’s name to read its one-line description, then tap OPEN to start it.',
    'Every module is laid out the same way: the display on top with readouts on its frame, the controls in the dock at the bottom, and notes to scroll below.',
    'Use the strip under a module’s title to move between modules. Tap ‹ to leave the lab.',
    'Tap ⓘ beside a module’s title to have that screen explained. Long-press any control to read its guided-lesson entry.',
  ],
  changes: [
    'Modules 1–3: sound hitting surfaces. It reflects, is absorbed or is scattered.',
    'Modules 4–5: sound bending, through warm and cool air and around obstacles.',
    'Modules 6–8: waves adding and canceling, in interference, comb filtering and standing waves.',
    'Modules 9–13 aim and combine loudspeakers. Modules 14–15 show reflections becoming echoes and reverberation.',
  ],
  teaches: [
    'How sound reflects, is absorbed, scatters, bends and combines, indoors and out.',
    'Why one loudspeaker sounds different at every seat.',
    'The physics behind everyday fixes: moving a mic, treating a wall, delaying a speaker.',
    'Each display is drawn to show why something happens, not to measure a real room. Real rooms add furniture, people and leaks.',
  ],
  tryThis: [
    'New to acoustics? Take the modules in order. Each one builds on the last, starting from a single bounce off a wall.',
    'Start with Reflection Visualizer: drag the speaker and the listener and watch every path redraw.',
    'Finish in the Room Builder: rebuild a problem you met in an earlier module, such as a boom at one seat, and find its cause.',
  ],
};

export const WAVE_SCREEN_GUIDES: Record<WaveModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  reflection: {
    intro: {
      learning: 'How sound bounces off walls: the angle in equals the angle out, and every bounce arrives later and quieter than the direct sound.',
      start: 'Drag the listener toward a wall and watch 1ST REFL catch up with DIRECT. Then change MAT to FIBERGLASS and see REFL LVL drop.',
    },
    seeing: [
      'You’re looking down on an 8 m × 6 m room, each wall named by its material: CONCRETE to start. Drag the speaker or the listener.',
      'RAYS: amber is the direct sound, blue bounces once, faint bounces twice.',
      'PRESSURE: rings, with one pulse dot per path. ARRIVALS: when each path lands, and how loud.',
      'DIRECT and 1ST REFL: arrival times. REFL LVL: first reflection vs direct. LOSS/BNC: level lost per bounce.',
    ],
    control: [
      'Drag the speaker or the listener: every ray and readout updates as you move.',
      'FREQ fader (63 Hz–8 kHz): picks the frequency. It changes how much the walls absorb, not where the paths go.',
      'MAT key: one material for all four walls: concrete, glass, wood, drywall, curtains, acoustic foam or fiberglass. Long-press foam or fiberglass to see a photo.',
      'LAYERS key: turn PRESSURE, WAVE FIELD, RAYS and ARRIVALS on or off.',
    ],
    changes: [
      'Move the speaker or listener: path lengths change, so times change. Sound covers about 34 cm per millisecond.',
      'Each ray leaves a wall at the angle it hit, measured from the normal: the line square to the wall.',
      'A reflection always arrives later and quieter: a longer trip, and the wall keeps a share.',
      'MAT and FREQ change REFL LVL and LOSS/BNC, never the paths. Soft walls take mids and highs but return the bass.',
    ],
    teaches: [
      'The law of reflection: angle in equals angle out, measured from the normal, never from the wall’s surface.',
      'The image source: a reflection acts as if it came from a mirror-image speaker behind the wall. It’s a way to draw the path, not a real source.',
      'Every bounce costs energy; how much depends on material and frequency.',
      'A reflection’s extra distance is a time delay: the cause of comb filtering (Module 7).',
    ],
    tryThis: [
      'Drag the listener right up to a wall: 1ST REFL nears DIRECT and REFL LVL rises toward 0 dB. Near a wall, the reflection is early and almost as strong as the direct sound.',
      'At 1 kHz, switch MAT from CONCRETE to FIBERGLASS: the rays stay put, but REFL LVL drops about 20 dB and LOSS/BNC reads about 20 dB.',
      'Keep FIBERGLASS and slide FREQ to the bottom: LOSS/BNC falls to about 1.5 dB. Bass bounces back even off soft walls.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  absorption: {
    intro: {
      learning: 'In Reflection every bounce lost energy. Here you see how much each material absorbs (α, 0 to 1) at each frequency, and why thin soft panels barely touch bass.',
      start: 'Set MAT to ACOUSTIC FOAM and compare α 125 Hz with α 4 kHz. Then slide FREQ and watch α @ and 1 BOUNCE.',
    },
    seeing: [
      'You’re looking down on a 7 m × 5 m room with all four walls in one material: DRYWALL to start. A glinting inner edge reflects; a matte one absorbs.',
      'RAYS: amber direct, blue reflections. The pulse dots turn from red to blue as the walls soak them up.',
      'α @ is the share absorbed, 0 to 1. 1 BOUNCE is the energy left after one bounce. α 125 Hz and α 4 kHz compare low and high.',
    ],
    control: [
      'FREQ fader (63 Hz–8 kHz): picks the frequency you’re studying.',
      'MAT key: concrete, glass, drywall, wood, curtains, carpet, acoustic foam, fiberglass or audience. Every wall takes your choice, and each option has a one-line description. Long-press foam or fiberglass to see a photo.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS. Drag the speaker or listener to move the paths.',
    ],
    changes: [
      'More absorption gives a higher α, less left after a bounce and a shorter RT60 (below the display): the time the room takes to fall 60 dB.',
      'Porous materials (foam, fiberglass, curtains, carpet) lose α at low frequencies. They work where air moves fastest, a quarter wavelength off the wall: 69 cm at 125 Hz.',
      'Drywall and glass flex at low frequencies, so they absorb some bass and reflect the highs.',
    ],
    teaches: [
      'Absorption depends on frequency: thin porous materials tame mids and highs, not bass.',
      'Bass control needs thickness, an air gap or tuned bass traps.',
      'Absorption works inside a room. Keeping sound in or out is isolation, a different job.',
      'Too much absorption makes a room sound dead.',
    ],
    tryThis: [
      'Pick ACOUSTIC FOAM: α 125 Hz reads 0.11 and α 4 kHz reads 0.99. The same panel is nearly useless low and nearly perfect high.',
      'At 125 Hz, switch between DRYWALL and ACOUSTIC FOAM: drywall absorbs more bass (α 0.29 against 0.11).',
      'Pick FIBERGLASS and sweep FREQ down: α stays near 1 down to about 500 Hz, then falls to 0.29.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  diffusion: {
    intro: {
      learning: 'How a diffuser spreads a reflection in many directions instead of absorbing it, and why its well depth sets the lowest frequency it can scatter.',
      start: 'At 1 kHz, tap DIFFUSER off and on and watch one bright ray become a fan of dim ones. Then slide DEPTH and watch MIN ƒ move.',
    },
    seeing: [
      'You’re looking down on a 7 m × 5 m concrete room. The top wall carries a DIFFUSER: wells of different depths. Drag the speaker or the listener.',
      'Watch the RAYS off the top wall: a working diffuser breaks the mirror reflection into a fan of thin, dim rays. Below its range, it stays one ray.',
      'The frame reads TOP WALL, DEPTH, MIN ƒ (the lowest frequency it scatters) and @ (frequency): MIRROR, SCATTER or BELOW ƒ.',
    ],
    control: [
      'DEPTH fader (0.05–0.60 m): sets how deep the wells are. Watch them deepen on the panel as you slide.',
      'FREQ fader (125 Hz–8 kHz): picks the frequency you’re studying.',
      'DIFFUSER key: fits or removes the panel. Off leaves plain concrete.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS. Drag the speaker and the listener.',
    ],
    changes: [
      'Deeper wells reach lower: MIN ƒ ≈ speed of sound ÷ (2 × depth), about 860 Hz at 0.20 m.',
      'Below MIN ƒ the waves are too long to notice the wells, so the panel acts like a flat wall (BELOW ƒ).',
      'Above it, the reflection spreads in many directions and smears slightly in time: no hard slap.',
      'ENERGY RETURNED (below the display) stays the same on or off: scattering spreads energy, it doesn’t remove it.',
    ],
    teaches: [
      'Diffusion spreads reflected energy; absorption removes it.',
      'A diffuser’s well depth sets its lowest working frequency.',
      'Diffusion keeps a room lively while breaking up harsh, mirror-like reflections.',
      'A listener needs some distance from a diffuser for the scattered sound to blend.',
    ],
    tryThis: [
      'At 1 kHz, tap DIFFUSER off and on: one bright ray becomes a fan of dim ones. It’s the same energy, spread out.',
      'Slide DEPTH to 0.05 m: MIN ƒ jumps to about 3.4 kHz and the readout says BELOW ƒ. At 1 kHz the panel is now a mirror.',
      'Leave DEPTH there and raise FREQ past MIN ƒ: the fan of rays comes back.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  refraction: {
    intro: {
      learning: 'Why sound bends when air temperature or wind changes with height, so it carries far on a cool night or over water and fades on a hot afternoon.',
      start: 'Push GRAD fully to INVERSION and watch the amber ray curve down to the listener. Then pull GRAD to LAPSE and see H @150 m climb over their head.',
    },
    seeing: [
      'You’re outdoors, seen from the side: a PA speaker on a pole 2 m up at left, and a listener 150 m away.',
      'Follow the amber ray: it leaves level. The sky tint, thermometer strip and WARM AIR / COOL AIR labels show the warmer layer.',
      'HEIGHT ×20: heights are stretched to show the bend. Readouts: c GROUND, c @60m (speed and temperature 60 m up), BEND, and H @150 m (the amber ray’s height at the listener).',
    ],
    control: [
      'GRAD fader: how temperature changes with height, from LAPSE (cooler air higher up, a sunny day) through NEUTRAL to INVERSION (warmer air higher up, night or over water). It starts on INVERSION. At NEUTRAL with the wind CALM, the display reads UNIFORM AIR.',
      'WIND fader: from CALM up to 12 m/s aloft, blowing from the speaker toward the listener. Arrows and a WIND label appear.',
    ],
    changes: [
      'Sound is faster in warm air: the part of a wavefront in warmer air pulls ahead, bending the path toward cooler air.',
      'INVERSION: rays curve down, and H @150 m falls, even to GROUND. LAPSE: rays curve up, over the listener.',
      'c @60m moves only from about 338 to 348 m/s (343 at the ground): enough to bend sound.',
      'WIND also bends rays down: it blows harder higher up, so downwind the sound’s speed grows with height.',
    ],
    teaches: [
      'Refraction: sound bends when its speed changes with height, so the air acts like a lens.',
      'Why sound carries at night and over water: cool air below warm air bends it back down.',
      'Why a show fades on a hot afternoon: warm air near the ground bends sound up and away.',
      'Why sound carries farther downwind: the stronger wind higher up bends sound back down, as an inversion does.',
    ],
    tryThis: [
      'Push GRAD fully to INVERSION: the amber ray curves down and H @150 m reads GROUND. This is why distant sound seems close on a cool night.',
      'Pull GRAD fully to LAPSE: the rays lift away and H @150 m reads about 4.6 m, over the listener’s head.',
      'Stay on LAPSE and raise WIND to 12 m/s: H @150 m falls from about 4.6 m to about 3.4 m. The wind aloft pulls the rays down.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  diffraction: {
    intro: {
      learning: 'Why low frequencies wrap around a wall while high frequencies cast a shadow behind it: whether a wave bends depends on its wavelength against the obstacle’s size.',
      start: 'With BARRIER at 4 m, slide FREQ from bottom to top and watch LOSS @ climb. Then raise BARRIER and watch FRESNEL N and the SHADOW ZONE grow.',
    },
    seeing: [
      'You’re outdoors, looking from the side, drawn to scale: a speaker, a wall (the barrier) and a listener, each 10 m from the wall and 1.5 m up.',
      'Rings spread from the speaker; past the wall’s top a second set bends down behind it. The SHADOW ZONE darkens where more sound is lost.',
      'Readouts: λ (wavelength), BARRIER, FRESNEL N (how many half-wavelengths longer the path over the top is) and LOSS @ (frequency).',
    ],
    control: [
      'FREQ fader (63 Hz–8 kHz): the rings tighten as it rises. At high frequencies RING GAP > λ appears: the real wavelength is too short to draw ring by ring, so the rings you see are spaced wider than it.',
      'BARRIER fader (2–8 m): the wall’s height, drawn to scale.',
    ],
    changes: [
      'Low frequencies are meters long, as big as the wall, so they wrap over the edge: a modest LOSS.',
      'High frequencies are centimeters long, so the detour is many wavelengths: a deep shadow.',
      'A taller wall lengthens the detour: FRESNEL N and LOSS rise, most of all for the highs.',
      'The glow at the listener shows it: warm means little loss, blue means a lot. The loss is never total.',
    ],
    teaches: [
      'Diffraction: waves bend around objects about their own size or smaller.',
      'Lows wrap around barriers; highs cast shadows.',
      'A shadow zone isn’t silence. Mostly it’s a loss of highs, so the sound behind a wall is duller, not gone.',
      'Why a pillar in front of a PA dulls the highs behind it while the bass carries on.',
    ],
    tryThis: [
      'With BARRIER at 4 m, slide FREQ from bottom to top: LOSS goes from under 9 dB to about 28 dB. The same wall gives the highs about 19 dB more shadow.',
      'At 1 kHz, raise BARRIER from 2 m to 8 m: FRESNEL N climbs and the shadow darkens.',
      'Below the display, compare LOW REF — LOSS @ 80 Hz with HIGH REF — LOSS @ 8 kHz: that gap is the shadow.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  interference: {
    intro: {
      learning: 'How two speakers playing the same sound add where their waves arrive in step and cancel where they arrive opposed, so loudness changes from place to place.',
      start: 'Note vs 1 SPKR at the start, then turn on POL Ø S2 and watch it drop to NULL. Turn it off and drag the listener sideways through the red and blue bands.',
    },
    seeing: [
      'From above, an 8 m × 6 m open space: two speakers (S1 left, S2 right) and a listener. With no walls, only the two direct sounds meet.',
      'WAVE FIELD: loudness at this frequency, red where the waves add, blue streaks where they cancel. PRESSURE: rings from both speakers.',
      'Readouts: S1 PATH, S2 PATH, Δ PATH (their difference in wavelengths, λ) and vs 1 SPKR (the pair vs one speaker: up to +6 dB, or NULL).',
    ],
    control: [
      'Drag either speaker or the listener.',
      'FREQ fader (63 Hz–2 kHz). DELAY fader (0–10 ms): holds back S2’s sound.',
      'POL Ø S2 key: flips S2’s polarity, so its push becomes a pull.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS.',
    ],
    changes: [
      'Δ PATH a whole number (0, 1, 2…): the waves arrive in step and add, about +6 dB.',
      'Δ PATH a whole number plus a half (0.5, 1.5…): they arrive opposed and cancel, toward NULL.',
      'Higher FREQ means a shorter wavelength, so the bands crowd together; lower spreads them out.',
      'DELAY shifts S2 in time, so the bands slide; POL Ø turns its wave over, so add and cancel bands swap. Nothing moves.',
    ],
    teaches: [
      'Interference: sources add where they arrive in step and cancel where they arrive opposed.',
      'A null belongs to one place and one frequency: move, or change the frequency, and it shifts.',
      'Two sources give +6 dB only where they arrive in phase.',
      'Why engineers walk a venue instead of trusting one listening spot.',
    ],
    tryThis: [
      'At the start the listener is equally far from both: Δ PATH 0.00 λ, vs 1 SPKR about +6 dB. Turn on POL Ø S2: it drops to NULL.',
      'Turn POL Ø S2 off and drag the listener sideways: vs 1 SPKR swings between +6 dB and NULL as Δ PATH passes 0.5 λ.',
      'Back at the start, at 500 Hz, set DELAY to 1.0 ms: half a cycle late, S2 cancels as if its polarity were flipped.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  comb: {
    intro: {
      learning: 'Why a sound plus one delayed reflection of itself cuts evenly spaced notches into the response, and why moving the mic a few inches moves every notch.',
      start: 'Read Δt and 1ST NULL at the start. Press MIC → once and watch every notch jump higher, then press ← MIC a few times and watch them crowd together.',
    },
    seeing: [
      'Top: a speaker, a microphone and one hard wall at right. The other sides are open, so the mic hears the direct sound plus one reflection.',
      'Bottom: the response at the mic, 20 Hz–20 kHz (0 dB = the direct sound alone). The dips are notches, like a comb’s teeth.',
      'Δt is how much later the reflection lands. Then 1ST NULL, SPACING (between notches) and MIC→WALL.',
    ],
    control: [
      'WALL fader (3–10 m): moves the hard wall farther away.',
      '← MIC and MIC → keys: nudge the mic 0.15 m (about six inches) per press. You can also drag the mic.',
      'LAYERS key: PRESSURE, WAVE FIELD, RAYS and ARRIVALS.',
    ],
    changes: [
      'At each frequency the two copies add (in step) or cancel (half a cycle apart), just as two speakers did in Interference.',
      '1ST NULL = 1 ÷ (2 × Δt); the rest repeat every SPACING = 1 ÷ Δt.',
      'Mic nearer the wall: Δt shrinks, so the notches spread out and move up. Farther: they crowd together.',
      'WALL farther away: the reflection is later and weaker, so the notches crowd and get shallower.',
    ],
    teaches: [
      'Comb filtering: a sound plus a delayed copy of itself makes evenly spaced notches.',
      'It comes from time and position, not tone. EQ can’t fix it; moving the mic or treating the surface can.',
      'A move of a few inches shifts every notch.',
      'It’s delay plus sum, not a room resonance (that’s Module 8).',
    ],
    tryThis: [
      'At the start the mic is 0.50 m from the wall: Δt ≈ 2.91 ms, 1ST NULL ≈ 172 Hz. Press MIC → once: every notch jumps higher.',
      'Press ← MIC a few times: the notches crowd together as the delay grows.',
      'Slide WALL all the way out: the comb flattens, because the reflection is late and weak.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  standing: {
    intro: {
      learning: 'Why certain low notes build into a pattern that stands still in a room, loud at antinodes and nearly gone at nodes, and why the room’s size sets those notes.',
      start: 'With the listener mid-room, read VERDICT and PRESSURE, then drag it to the left or right wall. Then slide WIDTH and watch the mode’s frequency move.',
    },
    seeing: [
      'You’re looking down on a 5 m × 4 m concrete room filled with one room mode. The speaker sits in a corner; drag the listener.',
      'Red marks antinodes, where pressure swings hardest. Dark blue marks nodes, where it barely moves. The pattern stays put.',
      'Readouts: MODE (two numbers) and frequency; TYPE (AXIAL: two walls; TANGENTIAL: all four); PRESSURE (% of max at the listener); VERDICT (NODE / ANTINODE / BETWEEN).',
    ],
    control: [
      'WIDTH fader (2–10 m): the room’s left-to-right size. DEPTH fader (2–10 m): its top-to-bottom size.',
      'MODE key: (1,0), (0,1), (1,1), (2,0), (2,1) or (3,0). The first number counts half-wavelengths across the width, the second down the depth.',
      'Drag the listener through the pattern.',
    ],
    changes: [
      'Drag the listener: the speaker plays the same, yet PRESSURE runs from 0 % on a node to 100 % on an antinode. Every corner is an antinode.',
      'Change WIDTH or DEPTH and the frequency moves. (1,0) fits half a wavelength across, so a wider room means a lower note.',
      'Higher mode numbers mean higher frequencies and more node lines. Dimensions set these, not materials.',
    ],
    teaches: [
      'Room modes: at certain low frequencies, reflections pile up into a pattern that stands still.',
      'On a node, a mic or seat misses that note; on an antinode, it gets too much.',
      'Dimensions set the modes; bass traps damp them but never remove them.',
      'Modes rule the low end. Above the Schroeder frequency (below the display) they blur into reverberation.',
    ],
    tryThis: [
      'At the start the listener is mid-room on (1,0): VERDICT NODE, about 34 Hz. Drag it to the left or right wall: ANTINODE.',
      'Pick (2,0): the middle becomes an ANTINODE, and the nodes sit a quarter of the way in from the left and right walls.',
      'On (1,0), slide WIDTH from 5 m to 10 m: the frequency halves, from about 34 Hz to about 17 Hz.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  coverage: {
    intro: {
      learning: 'Why a loudspeaker’s coverage narrows as frequency rises: lows spread almost everywhere and highs beam, so a seat outside the pattern hears dull sound.',
      start: 'Drag the listener well off to one side, then sweep FREQ up and watch vs ON-AXIS fall. Then, at 8 kHz, switch COV and watch the dashed edges move.',
    },
    seeing: [
      'You’re looking down on a 14 m × 10 m open space with no walls: one loudspeaker at the top, aimed down, and a listener.',
      'HEAT: loudness at this frequency, red loud, blue quiet. The dashed lines are the coverage edges, 6 dB down from straight ahead.',
      'Readouts: NOM COV (rated angle), EFF @ (frequency) (the real angle now), λ, and vs ON-AXIS (the listener against a spot straight ahead, same distance).',
    ],
    control: [
      'FREQ fader (80 Hz–8 kHz). AIM fader (−60° to +60°): turns the speaker.',
      'COV key: the rated pattern: 40°, 60°, 90° or 120°.',
      'Drag the listener anywhere. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Raise FREQ: the dashed edges swing in and EFF narrows. Highs beam; lows spread.',
      'This speaker meets its rated angle near 1 kHz: wider below, narrower above.',
      'Off to the side the highs go first, so vs ON-AXIS falls more at high frequencies.',
      'AIM turns the whole pattern. Outside the high-frequency edges a seat sounds dull, even with good bass.',
    ],
    teaches: [
      'Directivity: a loudspeaker’s coverage narrows as frequency rises.',
      'On-axis and off-axis sound differ; coverage is about what the off-axis seats hear.',
      'Lows spread almost everywhere, even behind the speaker.',
      'Aim the high-frequency pattern at the audience, not the cabinet at the room.',
    ],
    tryThis: [
      'Drag the listener well off to one side and sweep FREQ up: vs ON-AXIS barely moves at first, then drops as the highs beam away.',
      'At 8 kHz, switch COV between 40° and 120°: EFF and the red wedge change width.',
      'At 90°, slide FREQ to the bottom: EFF opens past 300°. The bass goes nearly everywhere, even behind the speaker.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  linearray: {
    intro: {
      learning: 'Why a line array’s length sets how low it can control and its splay sets where its coverage lands: the boxes join at low frequencies and beam at high ones.',
      start: 'With 4 boxes, slide FREQ down until LF CTRL flips to NO. Then open ARRAY, set BOXES to 8 and do it again.',
    },
    seeing: [
      'You’re looking at a venue from the side: distance runs left to right (20 m), height up the screen (9 m), and the audience floor along the bottom.',
      'The line array hangs at left, boxes at real size, tilted by the splay. The standing person is the listener: drag them.',
      'HEAT: red loud, blue quiet. Readouts: BOXES, LEN (array length), λ, and LF CTRL (YES when the array is at least one wavelength long).',
    ],
    control: [
      'FREQ fader (60 Hz–8 kHz).',
      'ARRAY key: BOXES (2–8); SPLAY (PER BOX), the angle between neighbors (0°–8°); and HEIGHT (HANG DEPTH), how far down from the top the array hangs (0.40–3.00 m).',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'When the wavelength is long, close boxes act as one tall source. More boxes give a longer LEN and control down to lower notes.',
      'When λ is longer than the array (LF CTRL: NO), the lows spill everywhere.',
      'SPLAY fans the boxes. Too little gives a tight beam that misses the near seats; too much leaves gaps or lobes.',
      'HEIGHT moves the array, changing where its beam lands.',
    ],
    teaches: [
      'An array’s length controls its lows; its splay shapes its coverage.',
      'Arrays couple (join together) at low frequencies and beam at high ones.',
      'Adding boxes changes the shape of the coverage, not just how loud it is.',
      'Pattern control needs an array at least one wavelength long.',
    ],
    tryThis: [
      'With 4 boxes (about 2 m), slide FREQ down until LF CTRL flips to NO: around 170 Hz, where λ matches the array.',
      'Set BOXES to 8 and repeat: control now reaches down to about 90 Hz. Twice the length, about half the frequency.',
      'At 4 kHz, slide SPLAY from 0° to 8°: the red beam fans out across the floor.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  delayalign: {
    intro: {
      learning: 'Why a sub and a main speaker add only when their sounds arrive together, and why a delay, not a polarity flip, lines them up for one seat.',
      start: 'Read OFF BY and SUM at the start, then open ALIGN and tap AUTO-ALIGN. Then drag the listener toward the main speaker and watch REQ and SUM change.',
    },
    seeing: [
      'You’re looking down on a 16 m × 10 m open space: a subwoofer at upper left, a main speaker to its right, and a listener. Both play the crossover frequency.',
      'HEAT: red where the two add, blue streaks where they cancel. PRESSURE: rings and dots show when each sound lands.',
      'Readouts: REQ (the delay the main needs for this seat), SET (your delay), OFF BY (the gap), SUM (0.0 dB = perfectly in step).',
    ],
    control: [
      'DELAY fader (0–20 ms): holds back the main speaker.',
      'XOVER fader (80–120 Hz): the crossover frequency, which both speakers play.',
      'ALIGN key: MAIN POLARITY Ø (labeled THE WRONG TOOL) and AUTO-ALIGN, which sets DELAY to REQ for this seat.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'At the start the sub is farther from the seat, so its sound lands later. Delaying the main by the difference lines them up.',
      'As OFF BY nears 0, SUM rises toward 0.0 dB and the blue null closes.',
      'Move the listener and REQ changes: an alignment is exact at one spot, close nearby, never everywhere.',
      'A polarity flip turns the wave upside down but doesn’t move it in time: right at one frequency, wrong at the next.',
    ],
    teaches: [
      'Time alignment: matching arrival times so a sub and a main add instead of cancel.',
      'Alignment is time, not distance: delay inside a processor adds time no tape measure can see.',
      'Polarity and delay are different tools: a flip can’t fix a delay.',
      'An alignment has to be checked at more than one seat.',
    ],
    tryThis: [
      'At the start OFF BY reads about −6.96 ms. Tap AUTO-ALIGN: OFF BY goes to about 0 and SUM to about 0.0 dB.',
      'Now drag the listener toward the main speaker: REQ changes and SUM slips below 0 dB. One seat fits best.',
      'Set DELAY back to 0, try MAIN POLARITY Ø and sweep XOVER: the flip helps some frequencies and hurts others.',
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  cardioidsub: {
    intro: {
      learning: 'How two subs, one delay and one polarity flip send bass forward and cancel it behind, and why getting one of the three wrong puts the null on the audience.',
      start: 'Note F − R, then open MODE and tap CARDIOID: watch blue form behind the stack. Then tap WRONG WAY and watch FRONT drop.',
    },
    seeing: [
      'You’re looking down on FRONT SUB and REAR SUB, 1.2 m apart. The rear label shows its delay (and Ø when flipped). AUDIENCE ↓ points toward the bottom.',
      'The listener is the FRONT probe: drag it. REAR MIC is fixed 3 m behind the stack. HEAT: red loud, blue quiet.',
      'Readouts: DELAY (on the rear sub), FRONT and REAR (the level at each probe) and F − R (front minus back).',
    ],
    control: [
      'DELAY fader (0–8 ms): delays the rear sub. FREQ fader (40–120 Hz).',
      'MODE key: the CARDIOID and WRONG WAY presets, REAR POLARITY Ø INVERT, and SOLO FRONT SUB, which mutes the rear sub.',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'CARDIOID delays the rear sub by the 1.2 m crossing time (about 3.5 ms) and flips it. Behind, both arrive together but opposite and largely cancel.',
      'In front the rear sound lands later, so they mostly add; FRONT varies a little with frequency.',
      'WRONG WAY: same delay, normal polarity. The null flips onto the audience, deepest near 71 Hz.',
      'SOLO FRONT SUB: one sub, an even circle: nothing to cancel against.',
    ],
    teaches: [
      'Two subs, one delay and one polarity flip: bass forward, canceled behind.',
      'Directional bass needs at least two sources: one sub alone can’t be cardioid.',
      'Spacing, delay and polarity must match, or the null lands in the wrong place.',
      'Rear rejection works over a limited frequency band and depends on the geometry.',
    ],
    tryThis: [
      'Tap CARDIOID: blue forms behind the stack and F − R jumps from about 0 dB to about 15 dB.',
      'With CARDIOID on, sweep FREQ from 40 to 120 Hz: REAR stays near −20 dB while FRONT moves only a little.',
      'Tap WRONG WAY near 71 Hz: FRONT drops. Then tap SOLO FRONT SUB: F − R falls to about 3 dB, which is just distance.',
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  beamsteer: {
    intro: {
      learning: 'How a steady delay step from box to box tilts a row of subs’ beam without moving them, and why steering too far at higher frequencies creates extra beams.',
      start: 'Set STEER to 20° and watch the amber delay bars form a staircase as the beam swings. Then raise FREQ to 120 Hz and push STEER past 30°.',
    },
    seeing: [
      'You’re looking down on a 24 m × 14 m open space: a row of subwoofers 2 m apart across the top, and a listener.',
      'The dashed line is the steering angle. The amber bar on each box is its delay: longer means later. HEAT: the red beam is where the energy goes.',
      'Readouts: STEER, Δt/BOX (the delay step between boxes), GRATING (NONE or IN FIELD) and vs STRAIGHT (the listener against the unsteered array).',
    ],
    control: [
      'STEER fader (−60° to +60°). FREQ fader (40–120 Hz).',
      'BOXES key: 4, 5 or 6 boxes.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Δt = spacing × sin(angle) ÷ speed of sound. Each box starts a little after its neighbor, so the wavefront tilts toward the later boxes.',
      'The boxes never move; only their timing changes.',
      'More boxes make a longer array and a narrower beam.',
      'High frequency plus a big angle gives grating lobes: extra beams, once the wavelength is short next to the 2 m spacing.',
    ],
    teaches: [
      'A steady delay step tilts an array’s beam without tilting the boxes.',
      'Steering sends energy in a new direction; it doesn’t widen coverage.',
      'Steering depends on frequency: steer too far and grating lobes send energy where you didn’t aim it.',
    ],
    tryThis: [
      'Set STEER to 20°: Δt/BOX reads about 1.99 ms, the bars form a staircase and the beam swings toward the delayed end.',
      'Put the listener straight in front of the middle of the row, then raise STEER: vs STRAIGHT falls as the beam leaves that seat.',
      'Raise FREQ to 120 Hz and STEER past 30°: GRATING reads IN FIELD.',
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  echo: {
    intro: {
      learning: 'Why a reflection within about 50 ms blends into the sound you hear first, while a later, loud enough one is heard as a separate echo.',
      start: 'Open ROOM and pick GYM, then compare GAP with FAR WALL on the timeline. Then pick CANYON and see 1ST REFL read ECHO.',
    },
    seeing: [
      'Top: a big space from above: the source at left, the listener and labeled surfaces (ROCK in the canyon). The highlighted line is the far-wall echo path.',
      'Bottom: the timeline. Each stem is an arrival, taller is louder: gray direct, amber within 50 ms, red later. FAR WALL marks the echo.',
      'Readouts: DIRECT, GAP (to the first reflection), 1ST REFL (FUSES or ECHO) and FAR WALL (its delay after the direct sound).',
    ],
    control: [
      'ROOM key: CANYON 60 m, GYM 24 m, CHURCH 30 m or WAREHOUSE 40 m, each with a short description.',
      'Drag the listener anywhere. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Your hearing blends a reflection within about 50 ms into the direct sound, as fullness rather than a repeat: FUSES.',
      'Later, and loud enough, it’s heard as a separate repeat: an echo.',
      'In everyday rooms the nearest surface answers first and fuses; a distant hard wall answers late, and that’s the echo.',
      'Many late returns packed close together become reverberation (Module 15).',
    ],
    teaches: [
      'Fused reflection vs separate echo, and the roughly 50 ms line between them (the precedence, or Haas, effect).',
      'An echo needs enough delay and enough level.',
      'The first reflection is usually not the echo.',
      'An echo is a separate repeat; reverberation is a dense, continuous tail.',
    ],
    tryThis: [
      'Pick GYM: GAP is about 12 ms and FUSES, while FAR WALL returns about 117 ms later as an echo. You get both at once.',
      'Pick CANYON: even the side rock is far enough that 1ST REFL reads ECHO. The far rock face answers about 290 ms later.',
      'In any space, drag the listener up to a side wall: GAP shrinks and 1ST REFL flips to FUSES.',
    ],
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  reverb: {
    intro: {
      learning: 'How reverberation builds from the direct sound through early reflections to a fading tail, what RT60 measures, and why soft walls shorten the highs more than the bass.',
      start: 'Slide ABSORB to 0/4 and read RT 500, then slide it to 4/4 and read it again. At 4/4, compare RT 125 with RT 2K.',
    },
    seeing: [
      'Top: a 12 m × 9 m room from above with a source and a listener. The walls are concrete; a treated wall turns to fiberglass, and the top one starts treated.',
      'Bottom: the decay, level against time. Amber is this room, dim is the all-concrete room. A playhead moves with the pulse.',
      'Readouts: RT 125, RT 500 and RT 2K (time to fall 60 dB at low, mid and high) and GAP (direct sound to first reflection).',
    ],
    control: [
      'ABSORB fader: how many of the four walls are fiberglass, from 0/4 to 4/4.',
      'Drag the listener. LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Each treated wall soaks up more at every bounce: the RT values fall and the amber tail drops below the dim one.',
      'RT 2K falls far more than RT 125: fiberglass takes mids and highs better than bass, as you saw in Absorption.',
      'GAP depends on where the listener stands, not on the material.',
      'Reverb builds: the direct sound, a few early reflections, then a dense fading tail.',
    ],
    teaches: [
      'Reverberation is a build-up of many reflections, not a single thing.',
      'RT60: the time sound takes to fall 60 dB after the source stops.',
      'Porous absorption shortens the highs more than the lows, so the bass rings longest.',
      'Rooms with the same RT60 can still sound different: early reflections matter.',
    ],
    tryThis: [
      'Slide ABSORB to 0/4: RT 500 reads about 2.2 s. At 4/4 it falls below 0.4 s.',
      'At 4/4, compare RT 125 (about 0.9 s) with RT 2K (about 0.36 s): the bass rings longest.',
      'Drag the listener right up to a wall: GAP shrinks to a millisecond or two.',
    ],
  },

  // ── ◎ ─────────────────────────────────────────────────────────────────────
  builder: {
    intro: {
      learning: 'How reflection, absorption, interference, room modes and coverage all happen at once in one room, and how to trace a problem at a seat back to its cause.',
      start: 'Open ROOM and shrink the room to about 4 × 3 m, then set FREQ between 40 and 120 Hz and look for mode bands. Then use WALLS to make two walls FIBERGLASS.',
    },
    seeing: [
      'You’re looking down on a 12 m × 8 m room, drywall to start, with one loudspeaker and a listener. A selected source wears an amber ring.',
      'HEAT: loudness at the FREQ setting. Outside, the rings carry on; each wall’s tag reads THROUGH −N dB: what that wall stops.',
      'Readouts: ROOM, LVL @ (frequency) at the listener, 1ST ARR (first arrival) and RT60 (at 500 Hz).',
    ],
    control: [
      'Drag any source or the listener; tap a source to select it.',
      'FREQ fader (40 Hz–8 kHz): the frequency the whole picture shows.',
      'ROOM key: ROOM WIDTH and ROOM DEPTH (3–30 m). WALLS key: pick TOP, RIGHT, BOTTOM or LEFT, then its material.',
      'SRC key: add a POINT, SPEAKER or SUB (up to four). For the selected one: LEVEL, DELAY, POLARITY Ø INVERT, plus AIM and coverage for a speaker, or remove it.',
      'LAYERS key: PRESSURE, HEAT, RAYS and ARRIVALS.',
    ],
    changes: [
      'Everything from the other modules happens at once: reflections, absorption, interference, modes, coverage.',
      'A wall’s material changes its reflections, RT60 and THROUGH figure. Concrete stops far more than curtains or foam.',
      'Lower FREQ: walls let more through, and a small room shows bright and dark mode bands.',
      'THROUGH shows only the trend: real isolation depends on how a wall is built and on sealed gaps.',
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
