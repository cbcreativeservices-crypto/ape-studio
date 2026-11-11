/**
 * Cymatics Lab: Sound Made Visible — "explain this screen" content (Screen
 * Guide rollout 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * Every screen the learner reaches, keyed the way its host picks it:
 *   CYMATICS_HOME_GUIDE      CymaticsHomeScreen (the lab home);
 *   CYMATICS_END_GUIDE       the WHAT'S LEFT screen (LabEndScreen, "progress"
 *                            mode) — shown by the home AND by the module host;
 *   CYMATICS_SCREEN_GUIDES   CymaticsModuleScreen, one per CymaticsModuleId;
 *   CYMATICS_STUDIO_GUIDES   the three LabShell studios' EXPLORE tab
 *                            (Plate, Liquid, Membrane & Loudspeaker);
 *   CYMATICS_LEARN_GUIDES /  the studios' LEARN and CHECK tabs (the same
 *   CYMATICS_CHECK_GUIDE     'cymatics' lesson and check in all three; LEARN's
 *                            TRY THIS is per studio, using only its own keys);
 *   CYMATICS_GALLERY_GUIDES  GalleryScreen, one per mode (browse / open /
 *                            art / compare).
 * The Harmonograph has its own file (../harmonographScreenGuides.ts).
 *
 * Every name is the on-screen name read from the screen's own code (bezel
 * keys, dock labels, tray chips, card titles), and every number in TRY THIS
 * is what the model prints at that setting — worked out from
 * features/cymatics/plateModes.ts, faraday.ts and membrane.ts at each screen's
 * own defaults and re-run by test/screenGuide_cymatics_20261031.test.ts:
 *   Plate (240 mm aluminium square, 1 mm, free, damping Low, centre-driven):
 *     excitable modes 103.7 (2,0)+(0,2) · 191.1 (2,2) · 501.0 (4,0)+(0,4) Hz;
 *     the studio opens on 240 Hz = BETWEEN, 0 %; JUMP TO A MODE lands (2,2)
 *     on 191.1 Hz (rounded) = AT, 98 %; steel at 191.1 Hz = 6 %.
 *   Liquid (water, 4 mm, Ø100 mm, pinned, 40 Hz): threshold 0.16 g;
 *     0.25 g = STABLE STANDING PATTERN 1.59×, 20.0 Hz f/2; 0.15 g = SMALL
 *     RIPPLES; 0.60 g = UNSTABLE MOTION; glycerin–water 0.53 g threshold.
 *   Membrane (Ø355 mm, 3 kN/m, 10 mil, strike r 0.25): (0,1) 199.6 Hz,
 *     91 % when landed (DRIVE 199.6 Hz); 6 kN/m → 282 Hz; 180 Hz = 9 %; the
 *     200 mm woofer at 199.6 Hz = PISTON BAND.
 *   Nodes square: 7 excitable modes in the first 24 (the disc: 15), so the
 *     tray lists "up to eight". Harmony: TRY THIS runs in order, so the beat
 *     is quoted at BASE 220 Hz: |2 × 666.6 − 3 × 440| = 13.2 Hz at +1 %.
 * Change a label, a range or a default → update this file; the test pins the
 * names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The Evidence vs Myth guide never gives a verdict
 * away (the module is commit-first).
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { CymaticsModuleId } from './modules/registry';

// ── THE LAB HOME ─────────────────────────────────────────────────────────────
export const CYMATICS_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Why sand gathers on a vibrating plate’s still lines, and why a frequency has no shape of its own: the object, not the tone, decides the figure.',
    start: 'Watch the plate at the top: sand leaves the moving regions and settles on the still lines. Then tap NEW HERE? START HERE › to open What Is Cymatics?',
  },
  seeing: [
    'At the top, sand settles onto one figure of a live plate, labeled SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN.',
    'NEW HERE? START HERE › opens module 1. Then four studios: Chladni Plate, Liquid Cymatics, Membrane & Loudspeaker, and the Pattern Gallery & Art Studio.',
    'LEARN & EXPERIMENT holds the eight modules; below them, CHECK YOUR UNDERSTANDING, SEE WHAT’S LEFT › and GUIDED LESSON.',
  ],
  control: [
    'Tap NEW HERE? START HERE › for What Is Cymatics?, or an OPEN THE … STUDIO › button for a free-play instrument.',
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'In CHECK YOUR UNDERSTANDING, answer every question correctly to complete the lab. You can try a wrong answer again right away.',
    'SEE WHAT’S LEFT › lists the modules you haven’t opened yet. ‹ leaves the lab; ⓘ on any module or studio explains that screen.',
  ],
  changes: [
    'Modules 1–3 build the central idea: a plate answers only at its own resonances, and the plate, not the tone, decides which.',
    'Modules 4–6 set it beside harmonic series, musical ratios and other vibrating things. Module 7 sorts evidence from myth. Module 8 runs seventeen experiments in the studios.',
    'Every pattern is a simulation from a physics model, labeled with how exact it is.',
  ],
  teaches: [
    'Why sand gathers on the still lines (nodes), and why figures appear only near a resonance.',
    'That a frequency has no shape of its own: the same tone draws different figures, or none, on different objects.',
    'How plates, liquids, drumheads and loudspeaker cones vibrate, and what is actually moving in each.',
  ],
  tryThis: [
    'New here? Tap NEW HERE? START HERE › and take the modules in order. Module 3, Change One Thing, is the lab’s central test.',
    'Watch the plate on top: sand walks off the moving regions and settles on the still lines of one mode.',
    'Open the Chladni Plate Studio and press ▶. At its opening 240 Hz the sand only shivers. Tap a mode in FREQ › JUMP TO A MODE and a figure forms.',
  ],
};

// ── WHAT'S LEFT (LabEndScreen, progress mode) ────────────────────────────────
export const CYMATICS_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Which parts of the lab’s story are still ahead: plates and their modes, harmonic series, musical ratios, other vibrating systems, and evidence versus myth.',
    start: 'Tap any row to open that module, or tap REVIEW ▾ to see the ones you’ve opened. PRACTICE AGAIN FROM THE START reopens What Is Cymatics? and clears nothing.',
  },
  seeing: [
    'WHAT’S LEFT lists the Cymatics modules you haven’t opened yet. Each row has a › to jump straight in.',
    'Modules you’ve opened fold into one ✓ DONE line; REVIEW ▾ shows them. Once you’ve opened every module, the title reads ALL MODULES OPENED.',
  ],
  control: [
    'Tap a row to open that module.',
    'Tap PRACTICE AGAIN FROM THE START to reopen What Is Cymatics? It never clears anything.',
    'DONE · BACK TO LABS leaves this screen.',
  ],
  changes: [
    'A module counts as done once you open it. Nothing here is graded or timed.',
    'The studios aren’t rows here. To complete the lab, answer CHECK YOUR UNDERSTANDING, on the lab home or on any studio’s CHECK tab.',
  ],
  teaches: [
    'Every module adds to one question: what decides the figure a vibrating object makes? Modules 1–3 explore it on plates; 4–6 set it beside harmonic series, musical ratios and other vibrating things; 7 sorts evidence from myth.',
  ],
  tryThis: [
    'Is Change One Thing still listed? Open it first: it is where you test whether the plate or the tone decides the figure.',
    'Every module opened? Answer CHECK YOUR UNDERSTANDING on the lab home to complete the lab.',
  ],
};

// ── THE EIGHT MODULES (CymaticsModuleScreen) ─────────────────────────────────
export const CYMATICS_SCREEN_GUIDES: Record<CymaticsModuleId, ScreenGuide> = {
  // ── 1 · What Is Cymatics? (reading page) ──────────────────────────────────
  intro: {
    intro: {
      learning: 'Sound is a pressure wave, and a plate shows its vibration only at a resonance: sand leaves the moving parts and gathers on the still lines, the nodes.',
      start: 'Watch PRESSURE WAVE first. Then tap At resonance · 104 Hz above the sand plate and watch a figure form. Tap Off resonance · 80.9 Hz and the sand only shivers.',
    },
    seeing: [
      'PRESSURE WAVE shows air molecules bunching and spreading. SAND ON THE PLATE shows a driven plate, and PHASE VIEW shows which parts move which way.',
      'Above the sand plate: At resonance · 104 Hz and Off resonance · 80.9 Hz. In the RESPONSE vs FREQUENCY · CALCULATED strip, each tall bar is a resonance and the white line is your drive.',
      'The page ends with BEFORE YOU GO ON — A QUESTION.',
    ],
    control: [
      'The sand plate starts on Off resonance · 80.9 Hz. Tap At resonance · 104 Hz to move the drive onto a resonance. Only the frequency changes, never the drive level, so any difference you see comes from frequency alone.',
      'Tap ⤢ FULL SCREEN under any figure to see it large. The sand plate keeps its two chips there.',
      'Tap OPEN CHANGE ONE THING › to test your answer to the closing question in module 3. Use the strip under the title to move between modules.',
    ],
    changes: [
      'At 104 Hz the drive sits on the lowest mode this plate can be driven into. A small push makes a big motion, and the sand snaps onto the still lines.',
      'At 80.9 Hz the same push barely moves the plate. The sand only shivers and no figure forms.',
      'In PHASE VIEW, amber rises while violet falls. Neighbors across a still line always move in opposite directions.',
    ],
    teaches: [
      'Sound is a pressure wave. Each air molecule only moves back and forth around its own place: the wave travels, the air doesn’t.',
      'A node is a place of least movement, where sand gathers. An antinode is a place of most movement, where sand is thrown off.',
      'An object has normal modes: natural ways to vibrate, each with its own frequency and its own still lines.',
    ],
    tryThis: [
      'Tap At resonance · 104 Hz and wait: the sand settles into a figure within seconds. Then tap Off resonance · 80.9 Hz: the sand only shivers.',
      'Answer the closing question in your head before you tap OPEN CHANGE ONE THING ›. Then test your answer there.',
    ],
  },

  // ── 2 · Nodes, Antinodes & Modes (rack) ───────────────────────────────────
  nodes: {
    intro: {
      learning: 'Every stable Chladni figure is one normal mode of the plate: its nodal lines stay still, and the regions on either side move in opposite directions.',
      start: 'Turn on PLAY or SILENT so the plate moves. Open FREQ and tap a higher mode in JUMP TO A MODE, then count LINES. Set VIEW to Phase to see the opposite motion.',
    },
    seeing: [
      'The plate on the glass, a square to start, drawn the way VIEW sets: Node lines first, or Phase, Heat map, Sand or 3D plate.',
      'MODE names the mode, DRIVE gives the frequency in Hz and LINES counts the nodal lines. RES says if you’re AT a mode, APPROACHING one, BETWEEN modes or BELOW the first.',
      'It opens on the first mode: DRIVE 104 Hz, MODE (2,0)+(0,2), LINES 2, RES AT.',
    ],
    control: [
      'FREQ (30 Hz–3 kHz) sets the drive. It moves in finer steps near each mode, so you can ride onto one. Its tray, JUMP TO A MODE, lists the plate’s lowest modes, up to eight. Off a mode, LAND ON jumps to the next mode up.',
      'SHAPE switches between Square plate and Circular plate. A new shape lands the drive on its first mode.',
      'VIEW draws the same motion five ways. Node lines show where the plate is still, Phase shows which parts move opposite each other, and Heat map shows how far each point moves.',
      'Nothing moves until you turn on PLAY, which drives the plate with a tone you hear, or SILENT, which drives it without sound.',
    ],
    changes: [
      'On a mode, that one mode answers strongly: you get a clean figure, RES AT and a bright heat map.',
      'Ride off it and several modes answer weakly at once. The figure dissolves, RES reads BETWEEN and the heat map goes dark.',
      'Higher modes generally carry more nodal lines, so the figures get finer. A new shape brings a whole new family of figures.',
    ],
    teaches: [
      'Each stable Chladni figure is one normal mode. Its nodal lines are where the plate doesn’t move.',
      'Neighbors across a nodal line move in opposite directions: one rises while the other falls.',
      'A pattern belongs to a resonance, not to a frequency. Between resonances, no clean figure forms.',
    ],
    tryThis: [
      'Open FREQ and tap 3 · 501 Hz · (4,0) + (0,4) in JUMP TO A MODE. LINES goes from 2 to 4: a higher mode, more still lines.',
      'Switch SHAPE to Circular plate. DRIVE lands on 89.8 Hz and MODE reads (2,0): 2 diameters, 0 circles.',
      'Turn SILENT on, set VIEW to Heat map, then ride FREQ slowly off the mode. The map goes dark as RES leaves AT.',
    ],
  },

  // ── 3 · Change One Thing (rack, no fader) ─────────────────────────────────
  change: {
    intro: {
      learning: 'The figure belongs to the object, not the tone: change one thing about a plate and the same locked tone may stop being a resonance.',
      start: 'Read PREDICT FIRST and settle on an answer. Then flick B through its options and watch what A and B read. When REVEAL HOW TO READ IT › appears, tap it.',
    },
    seeing: [
      'Two plates share one glass: A · ALUMINUM and B · STEEL to start. One tone drives both, and it never changes.',
      'LOCKED shows that tone, set on plate A’s second mode: 191 Hz to start. A and B each read AT, APPROACHING, BETWEEN or BELOW.',
      'Below, PREDICT FIRST asks this comparison’s question. The button under it opens once you’ve changed B.',
    ],
    control: [
      'VARY picks the one thing that differs: Material, Size, Thickness, Shape, Driver position, Support or Damping. The line under each option is the question you predict.',
      'The A and B keys set each plate. Hold A and flick B through its options. Picking a new VARY resets both plates.',
      'VIEW: Sand + heat (to start), Heat map, Node lines or Sand. There’s no frequency fader: the tone is locked so the plates are the only thing that changes.',
      'Once B has changed, CHANGE B FIRST — THEN READ IT becomes REVEAL HOW TO READ IT ›.',
    ],
    changes: [
      'The tone stays put. Each plate either has a mode there (AT, bright map, sand on lines) or doesn’t (BETWEEN, dark map).',
      'Double the size and every mode drops to a quarter; double the thickness and every mode doubles. A new material moves them too (Solid wood also re-orders them), so the tone stops matching.',
      'Damping doesn’t move a resonance. It widens it and lowers its peak.',
    ],
    teaches: [
      'The lab’s central finding: the figure belongs to the object, not to the tone. A frequency has no shape of its own.',
      'Change only one thing and any difference must come from that one thing. That makes it a fair test.',
      'A metal plate’s resonances are very sharp, so even a small change to the plate makes a fixed tone miss.',
    ],
    tryThis: [
      'Predict first: will steel keep the figure? A reads AT, B reads BETWEEN. Even a near-twin metal misses this sharp resonance.',
      'VARY Damping and set B to High. B stays AT: damping blurs a resonance but doesn’t move it.',
      'VARY Thickness. A is 0.5 mm and LOCKED reads 95.6 Hz. B at 1 mm reads BETWEEN, because its modes sit twice as high.',
    ],
  },

  // ── 4 · Harmonics vs Plate Modes (rack) ───────────────────────────────────
  harmonics: {
    intro: {
      learning: 'Strings and air columns vibrate in a harmonic series, whole-number multiples that blend into one pitch; drumheads and plates don’t, so Chladni figures aren’t chords.',
      start: 'Pick LADDER › String and tap MODE 2: RATIO reads 2.00×. Then pick Circular membrane, tap its MODE 2 and compare the RATIO.',
    },
    seeing: [
      'Four ladders share one axis, 1f to 6f: String, Air column (open), Circular membrane and Free metal plate. Each rung is one natural frequency.',
      'Each ladder is tagged HARMONIC (green) or INHARMONIC (red). Every first rung sits at 110 Hz, so you can compare the steps directly.',
      'LADDER, RATIO, FREQ and FAMILY (HARMONIC or INHARM.) describe the rung you picked.',
    ],
    control: [
      'LADDER: pick what vibrates. Its row lights up.',
      'MODE: pick one rung of that ladder, such as Mode 2 · 2.00× · 220 Hz. It plays as a sine tone and its rung lights white, so you hear each natural frequency on its own.',
      'PLAY stops the tone, or starts it again on the last rung.',
    ],
    changes: [
      'String and open air column: rungs at exactly 2×, 3×, 4×… These whole-number steps blend into one clear pitch.',
      'Membrane: 1.59×, 2.14×, 2.30×… Plate: 1.73×, 2.33×, 3.91×… They aren’t whole numbers, so there’s no single clear pitch.',
      'A chord is built from notes in simple ratios. Plate modes don’t follow them, so a Chladni figure isn’t a picture of a chord.',
    ],
    teaches: [
      'A harmonic series is a set of frequencies at whole-number multiples of the lowest one. Strings and air columns have one.',
      'A drum’s pitch is vaguer than a string’s because its modes aren’t whole-number multiples.',
      'Chladni figures show resonance and normal modes, not musical harmony.',
    ],
    tryThis: [
      'LADDER on String, MODE 2: RATIO 2.00×, FREQ 220 Hz. That’s exactly an octave above 110 Hz.',
      'LADDER on Circular membrane, MODE 2: RATIO 1.59×, FREQ 175 Hz, between whole numbers.',
      'Play String mode 2, then Free metal plate mode 2 (1.73×). Listen: the plate’s step lands off the string’s neat ratios.',
    ],
  },

  // ── 5 · Harmony in Motion (rack) ──────────────────────────────────────────
  harmony: {
    intro: {
      learning: 'Musical harmony comes from ratios between frequencies, not from any one frequency, and pulling a ratio slightly off makes beats.',
      start: 'Press PLAY to hear the fifth. Ride BASE and watch INTERVAL stay put. Then set VIEW to Lissajous figure and ride DETUNE up from locked.',
    },
    seeing: [
      'VIEW draws the two tones three ways: Wave addition (A, B and A + B stacked), Lissajous figure (B drawn against A) or Spectrum (two lines).',
      'It opens on a perfect fifth: A 220 Hz, B 330 Hz, a 2 : 3 ratio.',
      'A and B give each tone in Hz and its nearest note. INTERVAL names the interval, such as P5. BEAT shows beats per second, only when detuned.',
    ],
    control: [
      'BASE (55–440 Hz) moves both tones together and keeps their ratio.',
      'DETUNE (0 to +3 % on B) pulls B off the exact ratio. At the bottom it reads locked — no beats.',
      'RATIO picks one of seven ratios, from 1 : 1 unison to 5 : 7 tritone (near). VIEW switches between Wave addition, Lissajous figure and Spectrum.',
      'PLAY sounds the pair, so you hear what the picture shows.',
    ],
    changes: [
      'BASE scales both tones by the same factor, so the ratio, the figure and the interval stay the same.',
      'DETUNE breaks the ratio. The Lissajous figure no longer closes and keeps turning. In Wave addition, A + B is drawn across about two and a half beats, so you see its shape cycle.',
      'That cycle is the beat. For a ratio n₁ : n₂, the summed shape repeats |n₁ × f₂ − n₂ × f₁| times a second: the number BEAT shows.',
    ],
    teaches: [
      'Musical harmony is about ratios between frequencies, not any one frequency.',
      'Beats are the summed shape cycling; BEAT counts cycles per second. Zero beats means the ratio is exact: in tune.',
      'Two pure sines a detuned fifth apart beat only faintly. Real instruments have matching harmonics, so their beat is plain.',
      'Plate modes aren’t in simple ratios, so ratios are a separate subject from Chladni figures.',
    ],
    tryThis: [
      'Ride BASE from 110 to 220 Hz: A reads 440 Hz, B 660 Hz, and INTERVAL is still P5. The figure doesn’t change.',
      'Set VIEW to Lissajous figure, then ride DETUNE to about +1.00 %. At BASE 220 Hz, BEAT reads about 13.2 Hz and the figure starts to turn.',
      'Ride DETUNE back to locked, then pick RATIO 1 : 2 — octave. The figure closes and holds still: simple ratios close, detuned ones drift.',
    ],
  },

  // ── 6 · Other Cymatic Systems (rack) ──────────────────────────────────────
  systems: {
    intro: {
      learning: 'In strings, air columns, water, loudspeakers, bells and levitators, the visible pattern usually marks the still places of one of that system’s own modes.',
      start: 'With A string showing, ride HARMONIC up and count NODES. Then step SYSTEM to An air column, then A water surface, and compare what is moving.',
    },
    seeing: [
      'A drawing of the system you picked. It starts on A string: a standing wave, with its still points as blue dots.',
      'SYSTEM steps through six: A string, An air column, A water surface, A loudspeaker with particles on it, Bells, gongs and cymbals, Acoustic levitation.',
      'SYSTEM, MODE, NODES and FAMILY (HARMONIC, INHARM. or 1-D wave) describe what you’re looking at.',
    ],
    control: [
      'SYSTEM: pick what vibrates. Each option says what that is.',
      'HARMONIC (harmonics 1 to 5) works for the string and the air column only. It hides for the other systems.',
      'For the water, the loudspeaker and the bells, a dock key opens the full studio: LIQUID ›, SPEAKER › or PLATES ›.',
    ],
    changes: [
      'String: harmonic n has n loops and n + 1 still points, counting both ends.',
      'Open pipe: pressure stays still at both open ends and swings inside. Close one end and the pipe drops about an octave and keeps only odd harmonics.',
      'The water ripples at HALF the shake rate. The bell flexes in its lowest (2,0) mode, with four still meridians: lines running from its top down to the rim.',
    ],
    teaches: [
      'Most visible vibration patterns mark the still places (nodes) of one of the system’s own modes.',
      'Strings and air columns are harmonic, so they have a clear pitch. Membranes, plates and bells are not.',
      'In acoustic levitation, beads hang where the pressure barely changes: the pressure nodes of a standing wave.',
    ],
    tryThis: [
      'With A string, ride HARMONIC to the top. MODE reads 5f and NODES 6: five loops, six still points.',
      'Switch to An air column at harmonic 3. NODES reads 4: both open ends plus two inside.',
      'Pick A water surface and watch: the dish shakes at one rate, and the surface ripples at half of it.',
    ],
  },

  // ── 7 · Evidence vs Myth (reading page, commit-first) ─────────────────────
  myth: {
    intro: {
      learning: 'How to tell what cymatic patterns genuinely show from claims that go past the physics, and why a simulated pattern is labeled as one.',
      start: 'Read the first claim and tap EVIDENCE, DEPENDS or MYTH before you read anything else. Then read the reason on the card.',
    },
    seeing: [
      'Six claims about cymatics, each on its own card with three buttons: EVIDENCE, DEPENDS and MYTH.',
      'Once you pick, the card shows the verdict and the reason. It’s marked YOU HAD IT, or YOU SAID with your pick.',
      'At the end, HOW THIS LAB STAYS HONEST explains what each label on a pattern means.',
    ],
    control: [
      'Tap a verdict on each card. You commit first, then read the evidence. You can’t change a pick on this visit.',
      'When all six are answered, a closing line gives your score and points you to the ones you missed.',
      'Nothing here is saved: it’s a check for you alone.',
    ],
    changes: [
      'The verdict shows only after you commit, so a surprise has a chance to stick.',
      'EVIDENCE means real, measurable physics. DEPENDS means true only in part. MYTH means not supported by the evidence.',
    ],
    teaches: [
      'What the patterns genuinely show, and how to spot a claim that goes past the physics.',
      'A simulation shows what a physics model predicts. That’s why every pattern in this lab carries a SIMULATION label naming its model.',
      'A claim can start from real physics and still stretch it further than the evidence goes.',
    ],
    tryThis: [
      'Answer all six before reading any reason. Then re-read the cards marked YOU SAID.',
      'Afterwards, open any studio and read the label under its display: SIMULATION, and how the pattern was worked out.',
    ],
  },

  // ── 8 · Guided Experiments (menu) ─────────────────────────────────────────
  experiments: {
    intro: {
      learning: 'How a fair experiment runs (predict, change one thing, observe) and how it shows on plates, liquids and drums that the object, not the tone, sets the pattern.',
      start: 'Tap START THE SERIES › to open experiment 1, Find the first visible resonance. Read its PREDICT FIRST question and settle on an answer before you touch anything.',
    },
    seeing: [
      'Seventeen experiments: ten on the Chladni plate, four in the liquid dish and three on the drumhead and loudspeaker.',
      'Each card gives a number, title and goal, a PREDICT FIRST question, ▸ PREVIEW THE … STEPS, and SET UP THE PLATE ›, DISH › or DRUM ›.',
      'START THE SERIES › at the top opens experiment 1, Find the first visible resonance.',
    ],
    control: [
      'START THE SERIES › opens experiment 1 in the Plate Studio, already set up.',
      'SET UP … › opens one experiment in its studio. ▸ PREVIEW shows its steps here first.',
      'In the studio, the experiment card sits above the notes. Tap I’VE MADE MY PREDICTION, check each step as you do it, tap REVEAL LOOK FOR › to see what to watch for, then EXPERIMENT › to move on.',
    ],
    changes: [
      'Each experiment opens its studio with the object and the frequency already set, so you start at the exact moment it describes.',
      'LOOK FOR unlocks only after you predict and check at least one step, so you commit before you see the answer. Your checks stay on this device.',
    ],
    teaches: [
      'A fair experiment runs in order: predict, change one thing, observe.',
      'The central discovery, that the object and not the tone sets the pattern, holds on plates, liquids and drums alike.',
    ],
    tryThis: [
      'Tap START THE SERIES ›, run experiment 1, then use EXPERIMENT › to carry on without coming back here.',
      'Before any SET UP, read its PREDICT FIRST line and settle on an answer.',
    ],
  },
};

// ── THE THREE STUDIOS — EXPLORE (LabShell rack) ──────────────────────────────
export type CymaticsStudioId = 'plate' | 'liquid' | 'membrane';

export const CYMATICS_STUDIO_GUIDES: Record<CymaticsStudioId, ScreenGuide> = {
  // ── Chladni Plate Studio ──────────────────────────────────────────────────
  plate: {
    intro: {
      learning: 'Which plate properties set the resonances: material, size, thickness, edges, damping and driver position decide which figure a tone draws, or whether one forms at all.',
      start: 'It opens on 240 Hz, between modes. Open FREQ and tap 191 Hz · (2,2) in JUMP TO A MODE. Then press ▶ and watch the sand settle on the still lines.',
    },
    seeing: [
      'The plate from above, a 240 mm aluminum square to start, drawn the way VIEW sets. Until you drive it, PRESS ▶ PLAY TO DRIVE THE PLATE sits on top.',
      'DRIVE is the tone in Hz. RESPONSE is how hard the plate moves, in %. MODE names the mode, and RES reads AT, NEAR, BETWEEN or BELOW.',
      'LAB NOTES holds the resonance card, WHAT THIS PLATE IS (its lowest modes and their ratios) and the SIMULATION notes.',
    ],
    control: [
      'SAVE in the header sends this exact setup to the Pattern Gallery. ▶ plays the drive tone.',
      'FREQ (30 Hz–3 kHz) moves in finer steps near each mode, and ‹ −0.1% / +0.1% › creep onto a sharp one. JUMP TO A MODE lands on a mode; off a mode, LAND ON jumps to the next one up.',
      'PLATE: shape (and the SOLVED SHAPES), material, size, damping, thickness, edges. DRIVE: driver position, clamp, Sweep the modes, Slow motion, Silent drive, SECOND TONE.',
      'VIEW: Particles, Heat map, Particles + heat, Phase, Node lines, 3D plate, Cross-section. LEVEL sets the drive strength. SAND: amount, grain size, ⟲ Reset sand, friction.',
    ],
    changes: [
      'On a mode the plate moves a lot for a little push: RESPONSE climbs, RES reads AT and sand gathers on the still lines.',
      'Change the plate and every mode moves. Stiffer, lighter or thicker rings higher; bigger rings lower. The same DRIVE can stop being a resonance.',
      'LEVEL sets how far the plate moves, not which mode. A driver sitting on a nodal line can’t wake that mode.',
    ],
    teaches: [
      'A plate’s resonances are set by the plate itself, so the frequency alone never names the figure.',
      'Plate modes are inharmonic: their ratios are not 1 : 2 : 3 : 4.',
      'More level makes the same figure move harder. Only a new frequency or a new plate gives a new figure.',
    ],
    tryThis: [
      'It opens on 240 Hz: RES BETWEEN, RESPONSE 0%. Open FREQ and tap 191 Hz · (2,2) in JUMP TO A MODE: RES AT, RESPONSE 98%.',
      'Stay there and switch PLATE › MATERIAL to Steel. RESPONSE falls to 6% and RES reads BETWEEN: the plate changed, not the tone.',
      'Switch MATERIAL back to Aluminum, then press ▶ (or DRIVE › Silent drive). With VIEW on Particles, the sand settles onto the (2,2) figure.',
    ],
  },

  // ── Liquid Cymatics Studio ────────────────────────────────────────────────
  liquid: {
    intro: {
      learning: 'Faraday waves: a liquid shaken up and down forms standing waves at half the shake frequency, but only once the shake passes a threshold set by damping.',
      start: 'It opens at 40.0 Hz and 0.25 g with a STABLE STANDING PATTERN. Read RESP: half the drive. Then lower SHAKE to about 0.15 g and watch the pattern go.',
    },
    seeing: [
      'A dish of liquid on a shaker, drawn the way VIEW sets (Liquid surface to start): water, 4 mm deep, in a 100 mm round dish.',
      'DRIVE is the shake frequency. RESP is the rate the surface moves at, marked f/2 once patterns form. SHAKE is in g, and a/a꜀ is your shake divided by the threshold.',
      'LAB NOTES holds the stage ladder from FLAT SURFACE up to SPLASHING, the THRESHOLD line, WHAT THIS RIG IS and RIG SAFETY.',
    ],
    control: [
      'SHAKE (0.02–1.5 g) is the fader you start on, with ‹ −5% / +5% › steps. FREQ (10–200 Hz) sets the shake rate; its tray, DRIVE AT TWICE A DISH MODE, puts the half-rate waves on one of the dish’s own modes.',
      'LIQUID: eight liquids, plus temperature. DISH: container, size, depth, wall height, bottom and rim contact.',
      'DRIVE: waveform, Sweep 15 → 150 Hz, Slow motion, Silent drive, SECOND FREQUENCY. VIEW: The rig, Liquid surface, Height map, Contours, Refraction, 3D surface, Cross-section.',
      'SAVE in the header sends the setup to the gallery. ▶ plays the drive tone.',
    ],
    changes: [
      'Below the threshold the liquid rides the platform, with small ripples at the drive rate.',
      'Past it (a/a꜀ above 1) the surface breaks into standing Faraday waves at HALF the drive frequency. More shake climbs the ladder toward chaos.',
      'Thicker liquid, a shallower layer or a wetted rim damps the waves, so the threshold rises. A higher drive frequency gives shorter waves and a higher threshold.',
    ],
    teaches: [
      'A surface shaken up and down answers at half the shake frequency. That’s a subharmonic, and these waves are called Faraday waves.',
      'A pattern needs enough push to beat damping: a threshold, not just a frequency.',
      'The pattern depends on the liquid, the depth and the dish, not on the frequency alone.',
    ],
    tryThis: [
      'It opens at 40.0 Hz and 0.25 g: STABLE STANDING PATTERN, a/a꜀ 1.59×, RESP 20.0 Hz f/2, half the drive.',
      'Lower SHAKE to about 0.15 g: SMALL RIPPLES, and RESP reads 40.0 Hz f. Raise it to about 0.60 g: UNSTABLE MOTION.',
      'Back at 0.25 g, switch LIQUID to Glycerin–water 50/50: SMALL RIPPLES. Its threshold, about 0.53 g, is now above your shake.',
    ],
  },

  // ── Membrane & Loudspeaker Studio ─────────────────────────────────────────
  membrane: {
    intro: {
      learning: 'Why a bare drumhead’s pitch is vague and a timpani’s is clear, how tension and strike point shape a drum, and how a loudspeaker cone breaks up.',
      start: 'It opens at 180 Hz, just below the first mode. Open FREQ and tap 200 Hz · (0,1) in JUMP TO A MODE. Then set HEAD › TENSION to 6 kN/m and watch FUNDAMENTAL.',
    },
    seeing: [
      'A drumhead from above: a 14-inch snare-size head at 3 kN/m to start. VIEW › Loudspeaker shows a cone cutaway and front view.',
      'Drum: DRIVE, FUNDAMENTAL (lowest mode), MODE, RESPONSE. Loudspeaker: DRIVE, fs (its resonance), ka (cone size against wavelength: 1 when the rim’s circumference is one wavelength), STAGE.',
      'LAB NOTES: the resonance card and TUNING, or the cone’s stage ladder, and the SIMULATION notes.',
    ],
    control: [
      'FREQ (20 Hz–6 kHz) sets the drive. Its tray is JUMP TO A MODE, or JUMP TO A CONE STAGE while the loudspeaker shows.',
      'HEAD: head material, diameter, tension, damping, Open shell or Timpani kettle. STRIKE: Sweep, Slow motion, Silent drive and WHERE THE MALLET LANDS (or Drag on drum).',
      'CONE: six drivers and Show the loudspeaker. VIEW: The drum, Heat map, Phase, Node lines, 3D head, Cross-section, Loudspeaker. LEVEL sets the drive strength.',
      'SAVE in the header sends the setup to the gallery. ▶ plays the drive tone.',
    ],
    changes: [
      'A tighter head rings higher; a bigger or heavier one rings lower.',
      'A bare head’s modes sit near 1 : 1.59 : 2.14, not whole numbers, so there’s no clear pitch. The kettle pulls the main modes near 1 : 1.5 : 2, so you hear a pitch.',
      'Where you strike decides which modes wake: a center strike wakes only modes with no diameters. A cone moves as one piston above its resonance, then flexes, then breaks up.',
    ],
    teaches: [
      'A bare drum’s modes aren’t whole-number multiples, so its pitch is vague. A timpani’s kettle pulls them close to 1 : 1.5 : 2, so its pitch is clear.',
      'Tension raises every mode and size lowers them; the strike point picks which modes you hear.',
      'A loudspeaker cone moves as one piston at first, and breaks up into its own modes higher up.',
    ],
    tryThis: [
      'It opens at 180 Hz with RESPONSE 9 %. Open FREQ and tap 200 Hz · (0,1) in JUMP TO A MODE: RESPONSE 91 %, MODE (0,1).',
      'Set HEAD › TENSION to 6 kN/m. FUNDAMENTAL rises from 200 Hz to 282 Hz: double the tension, about 1.41× (√2) the pitch.',
      'Tap CONE › Show the loudspeaker. With DRIVE still at 199.6 Hz, the ladder reads PISTON BAND — THE CONE MOVES AS ONE.',
    ],
  },
};

// ── THE STUDIOS' LEARN AND CHECK TABS (same lesson and check in all three) ───
export const CYMATICS_LEARN_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The lab’s vocabulary (node, antinode, mode, resonance, damping, Faraday wave, breakup) and why level and frequency, or frequency and figure, are easy to mix up.',
    start: 'Scroll to the LEVEL entry and read it. Then tap EXPLORE, raise LEVEL on a mode, and check that the figure stays the same.',
  },
  seeing: [
    'The LEARN tab is the Cymatics guided lesson as one page to read. Nothing here plays or moves.',
    'It starts with the lab’s idea, then CONTROLS: one entry for each part of the plate, liquid, drum, loudspeaker and gallery screens.',
    'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: how size, thickness and material set a plate’s modes.',
  ],
  control: [
    'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live studio.',
    'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet. Long-press a dock key or a readout to see just its entry.',
  ],
  changes: [
    'Nothing on this page moves. When something on EXPLORE surprises you, find its CONTROLS entry here: it says what that part changes and why.',
    'FORMULA / CONCEPT shows why a thicker plate rings higher and a bigger one lower: frequency follows h/L² · √(E/ρ).',
  ],
  teaches: [
    'The words for the lab: node (least movement), antinode (most movement), mode, resonance, damping, Faraday wave, breakup.',
    'The common mix-ups, level versus frequency and frequency versus figure, and why each happens.',
  ],
  tryThis: [
    'In the Plate Studio, read the LEVEL entry. Then on EXPLORE raise LEVEL on a mode: the plate moves more, but the figure stays the same.',
    'Read the MATERIAL entry. Then on EXPLORE switch PLATE › MATERIAL and watch the same frequency stop being a resonance.',
  ],
};

/** The LEARN tab per studio: one lesson, but each studio's TRY THIS uses only
 *  that studio's own controls (the Liquid Studio has SHAKE and LIQUID, no
 *  LEVEL or plate material; the Membrane Studio's material is HEAD MATERIAL).
 *  Each studio also has its own intro card; every other section is the shared
 *  lesson's (Guided Lessons return 2026-11-08). */
export const CYMATICS_LEARN_GUIDES: Record<CymaticsStudioId, ScreenGuide> = {
  plate: {
    ...CYMATICS_LEARN_GUIDE,
    intro: {
      learning: 'The lab’s vocabulary, and why size, thickness and material, not the drive level, decide where a plate’s modes sit and which figure a tone draws.',
      start: 'Read the LEVEL entry, then the MATERIAL entry. Tap EXPLORE, raise LEVEL on a mode, then switch PLATE › MATERIAL and watch the resonance go.',
    },
  },
  liquid: {
    ...CYMATICS_LEARN_GUIDE,
    intro: {
      learning: 'The lab’s vocabulary, and why a shaken liquid answers at half the drive frequency only once the shake passes a threshold that the liquid itself sets.',
      start: 'Read the Faraday waves entry. Then tap EXPLORE and lower SHAKE to about 0.15 g: the half-frequency pattern gives way to SMALL RIPPLES.',
    },
    tryThis: [
      'In the Liquid Studio, read the Faraday waves entry. Then on EXPLORE lower SHAKE to about 0.15 g: the half-frequency pattern gives way to SMALL RIPPLES.',
      'Read the LIQUID entry. Then at 0.25 g switch LIQUID to Glycerin–water 50/50: the thicker liquid raises the threshold, so only SMALL RIPPLES remain.',
    ],
  },
  membrane: {
    ...CYMATICS_LEARN_GUIDE,
    intro: {
      learning: 'The lab’s vocabulary, and why a drumhead’s pitch follows its tension and size: double the tension raises every mode by about 1.41×.',
      start: 'Read the Tension and size entry. Then tap EXPLORE and set HEAD › TENSION to 6 kN/m: FUNDAMENTAL rises from 200 Hz to 282 Hz.',
    },
    tryThis: [
      'In the Membrane Studio, read the LEVEL entry. Then on EXPLORE raise LEVEL on a mode: the head moves more, but the figure stays the same.',
      'Read the Tension and size entry. Then set HEAD › TENSION to 6 kN/m: FUNDAMENTAL rises from 200 Hz to 282 Hz. Double the tension gives about 1.41× the pitch.',
    ],
  },
};

export const CYMATICS_CHECK_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the lab’s five core ideas fit together: what sets a figure, where sand settles, what drive level changes, how a shaken liquid answers, and what damping does.',
    start: 'Read the first question and settle on your answer before you tap. If you see NOT QUITE — TRY ANOTHER, read the explanation, then pick again.',
  },
  seeing: [
    'You’re at CHECK YOUR UNDERSTANDING: five questions on what sets a figure, where sand gathers, what drive level changes, the liquid’s half-frequency waves, and damping.',
    'Each question turns to ✓ once you get it right. The same check sits on the lab home.',
  ],
  control: [
    'Tap the answer you think is right. If it’s wrong, you see NOT QUITE — TRY ANOTHER with the explanation: read it, then pick again. If it’s right, you see CORRECT with the same explanation.',
  ],
  changes: [
    'Each explanation points back to something you can see in the studios, so a wrong pick shows you where to look. Answer every question correctly and the check is passed. A wrong answer costs nothing, and there is no score.',
  ],
  teaches: [
    'What decides which figure appears on a plate at a given tone.',
    'Why sand gathers where it does, and what drive level really changes on a plate.',
    'At what rate a shaken liquid’s surface answers, and what damping does to a resonance.',
  ],
  tryThis: [
    'Unsure about one? Switch to EXPLORE, test that exact idea in the studio, then come back to CHECK and answer from what you saw.',
    'A wrong pick shows the explanation. Read it before you try again: it names the clue you missed.',
  ],
};

/** The title on each studio's CHECK tab. All three studios share one lab-wide
 *  check, so a question about the plate or the liquid is expected on any of them. */
export const CYMATICS_CHECK_TITLE = 'Covers the Whole Cymatics Lab';

/** The LabShell `guide` for a studio: EXPLORE, LEARN and CHECK each explained. */
export function cymaticsStudioGuide(studio: CymaticsStudioId): (mode: 'learn' | 'explore' | 'check') => ScreenGuide {
  return (mode) => (mode === 'learn' ? CYMATICS_LEARN_GUIDES[studio] : mode === 'check' ? CYMATICS_CHECK_GUIDE : CYMATICS_STUDIO_GUIDES[studio]);
}

// ── PATTERN GALLERY & ART STUDIO (one route, four modes) ─────────────────────
export type CymaticsGalleryMode = 'browse' | 'open' | 'art' | 'compare';

export const CYMATICS_GALLERY_GUIDES: Record<CymaticsGalleryMode, ScreenGuide> = {
  browse: {
    intro: {
      learning: 'Why a saved pattern is a repeatable experiment: each card is redrawn from the exact settings it came from, so two saves can be compared fairly.',
      start: 'Tap a card to open it, or long-press it to make it a favorite. To compare, tap Compare…, pick two to four cards, then tap COMPARE ›.',
    },
    seeing: [
      'This is the PATTERN GALLERY & ART STUDIO: every pattern you’ve saved from the three studios, each as a card of line art.',
      'The filter chips are All, Plate, Dish, Drum and ★ Favorites. Nothing saved yet? NOTHING SAVED YET tells you how, with links to each studio.',
    ],
    control: [
      'Tap a card to open it. Long-press a card to make it a favorite.',
      'Tap Compare… to start picking: tap two to four cards, then COMPARE ›.',
      '‹ goes back. ⓘ GUIDED LESSON at the bottom covers the gallery and the art studio.',
    ],
    changes: [
      'Each card is redrawn from its saved numbers through the studio’s own physics. Nothing is stored as a picture.',
      'Your coloring is kept apart from the numbers, so coloring never changes the science.',
    ],
    teaches: [
      'A saved pattern is a repeatable experiment: its exact settings come back.',
      'Two saves that differ in one thing show the lab’s central discovery in your own data: the object, not the tone, sets the figure.',
    ],
    tryThis: [
      'In the Plate Studio, SAVE a figure, change only the material, SAVE again. Then compare the two here.',
      'Long-press your clearest figure to make it a favorite, then tap the ★ Favorites chip: only your starred patterns stay on screen.',
    ],
  },
  open: {
    intro: {
      learning: 'Why a pattern is a set of physical settings, not a picture: the figure is worked out again from those settings every time you open it.',
      start: 'Read the settings table under the figure. Then tap Open in studio › to bring back this exact setup, or type in NOTES what you were testing.',
    },
    seeing: [
      'One saved pattern: its figure as line art with its SIMULATION label, the NAME and NOTES fields, and a table of the settings it came from.',
      'Below it, EXPORT: Art print or Lab print, as a PNG card, Transparent PNG, PDF or SVG, with a PAGE size.',
    ],
    control: [
      'Open in studio › brings back this exact setup. Color › opens the art board.',
      'Duplicate, ★ Favorite and Delete (it asks first). Type to rename the pattern or add notes.',
      'EXPORT: pick the sheet and the format, then SHARE, SAVE or PRINT.',
    ],
    changes: [
      'The figure is worked out again from the saved settings each time, so Open in studio › gives back exactly what you saw.',
      'Every exported sheet carries its SIMULATION label, because the figure comes from a physics model, not from a measured plate.',
    ],
    teaches: [
      'A pattern is a set of physical settings, not a picture.',
      'Change one setting and save again, and any difference between the two figures comes from that one setting.',
    ],
    tryThis: [
      'Tap Open in studio ›, change one setting, SAVE, and compare the two.',
      'Write in NOTES what you were testing. It stays with the pattern.',
    ],
  },
  art: {
    intro: {
      learning: 'How nodal lines split a figure into regions that each move together, with neighbors moving in opposite directions, and why the figure’s symmetry follows the object’s shape.',
      start: 'Tap a region on the figure to fill it. Then set SYM to 4-fold on a square-plate figure and fill one region: watch its rotated partners fill too.',
    },
    seeing: [
      'ART STUDIO: your figure on an art board, split into regions by its nodal lines.',
      'Readouts: REGIONS (how many areas there are), FILLED (how many you’ve colored), and UNDO and REDO (how many steps you can go back or forward).',
    ],
    control: [
      'Tap a region on the figure to fill it.',
      'FILL: colors, Custom color…, Erase, Undo, Redo, Clear all fills. STYLE: Solid or Gradient, and the color of the nodal lines.',
      'WEIGHT fader: line thickness, down to hidden. PAPER: the background. SYM (Off, or 2- to 8-fold) fills a region and its rotated partners together.',
    ],
    changes: [
      'A fill never crosses a nodal line: each region is a part of the plate that moves together.',
      'Gradient shades each region from its center (the antinode) to its edge (the still line).',
      'Coloring is saved apart from the pattern’s numbers.',
    ],
    teaches: [
      'Regions between nodal lines move together; neighbors move in opposite directions.',
      'A figure’s symmetry comes from the object’s shape and the mode.',
    ],
    tryThis: [
      'On a square-plate figure such as (2,2), set SYM to 4-fold and fill a region off the center: its three rotated partners fill with it.',
      'Choose Gradient in STYLE: each region reads like height, with the color in the middle and darker at the still line.',
    ],
  },
  compare: {
    intro: {
      learning: 'How to read a fair comparison: same tone and a different figure means the object changed; same object and a different figure means the frequency changed.',
      start: 'Read the settings table first and find the rows that differ. Then look at the figures and read the one-line verdict under the table.',
    },
    seeing: [
      'COMPARE: the two to four patterns you picked, side by side, with a table of their settings and a one-line verdict under it.',
      'Below that, EXPORT, to print or share the comparison.',
    ],
    control: [
      'Edit selection ‹ goes back to change the picks. What am I looking at? opens the lesson entry.',
      'EXPORT: Art print or Lab print, and a format.',
    ],
    changes: [
      'Where only one setting differs, any change in the figure comes from that setting.',
      'Where two or more settings differ, you can’t tell which one changed the figure.',
    ],
    teaches: [
      'The same tone makes different figures on different objects, shown with your own saves.',
      'Same tone and a different figure means the object changed; same object and a different figure means the frequency changed.',
    ],
    tryThis: [
      'Compare two saves that differ only in material: the table shows one row changed, the figures show what it did.',
      'Compare a plate, a dish and a drum: three objects, three different answers.',
    ],
  },
};
