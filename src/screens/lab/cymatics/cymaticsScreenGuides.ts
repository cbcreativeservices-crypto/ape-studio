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
  seeing: [
    'A live plate on top: sand settling onto one of its figures (SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTRE-DRIVEN).',
    'NEW HERE? START HERE › opens module 1. Then four studios: Chladni Plate, Liquid Cymatics, Membrane & Loudspeaker, and the Pattern Gallery & Art Studio.',
    'LEARN & EXPERIMENT: the eight modules. Below them CHECK YOUR UNDERSTANDING, SEE WHAT’S LEFT › and the GUIDED LESSON row.',
  ],
  control: [
    'Tap NEW HERE? START HERE › for What Is Cymatics?, or an OPEN THE … STUDIO › button for a free-play instrument.',
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'CHECK YOUR UNDERSTANDING: answer every question correctly to complete the lab. A wrong answer can be tried again straight away.',
    'SEE WHAT’S LEFT › lists the modules you have not opened yet. ‹ leaves the lab; ⓘ on any module or studio explains that screen.',
  ],
  changes: [
    'Modules 1–3 build the central idea: a plate answers only at its own resonances, and the plate — not the tone — decides which.',
    'Modules 4–6 set it beside harmonic series, musical ratios and other vibrating things. Module 7 sorts evidence from myth; module 8 runs seventeen experiments in the studios.',
    'Every pattern is a simulation from a physics model, labelled with how exact it is.',
  ],
  teaches: [
    'Why sand gathers on the still lines (nodes), and why figures appear only near a resonance.',
    'That a frequency has no shape of its own: the same tone draws different figures, or none, on different objects.',
    'How plates, liquids, drumheads and loudspeaker cones vibrate. The lab sits in Sound Visualization, beside the Harmonograph.',
  ],
  tryThis: [
    'New here? Tap NEW HERE? START HERE › and take the modules in order — module 3, Change One Thing, is the lab’s central test.',
    'Watch the plate on top: sand walks off the moving regions and settles on the still lines of one mode.',
    'Open the Chladni Plate Studio: the sand is still until you press ▶, and at its opening 240 Hz it only shivers. Tap a mode in FREQ › JUMP TO A MODE and a figure forms.',
  ],
};

// ── WHAT'S LEFT (LabEndScreen, progress mode) ────────────────────────────────
export const CYMATICS_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the Cymatics modules you have not opened yet, each with a › to jump straight in.',
    'Modules already opened fold into one ✓ DONE line; REVIEW ▾ opens them. With every module opened the title reads ALL MODULES OPENED.',
  ],
  control: [
    'Tap a row to open that module.',
    'PRACTICE AGAIN FROM THE START reopens What Is Cymatics?; it never clears anything.',
    'DONE · BACK TO LABS leaves this screen.',
  ],
  changes: [
    'A module counts as done once you open it. Nothing here is graded or timed.',
    'The studios are not rows here. The lab’s credit comes from CHECK YOUR UNDERSTANDING — on the lab home, and on each studio’s CHECK tab.',
  ],
  teaches: [
    'Where you stand in the lab. Every module stays open for practice.',
  ],
  tryThis: [
    'A module still listed? Tap it and work through it.',
    'Every module opened? Answer CHECK YOUR UNDERSTANDING on the lab home to complete the lab.',
  ],
};

// ── THE EIGHT MODULES (CymaticsModuleScreen) ─────────────────────────────────
export const CYMATICS_SCREEN_GUIDES: Record<CymaticsModuleId, ScreenGuide> = {
  // ── 1 · What Is Cymatics? (reading page) ──────────────────────────────────
  intro: {
    seeing: [
      'A reading page with three live figures: PRESSURE WAVE (air molecules bunching and spreading), SAND ON THE PLATE, and PHASE VIEW.',
      'Above the sand plate: two chips, At resonance · 104 Hz and Off resonance · 80.9 Hz. Under it: a RESPONSE vs FREQUENCY · CALCULATED strip — each tall bar is a resonance; the white line marks the drive.',
      'It ends with BEFORE YOU GO ON — A QUESTION.',
    ],
    control: [
      'Off resonance · 80.9 Hz is chosen first. Tap At resonance · 104 Hz: only the frequency changes, never the drive level.',
      '⤢ FULL SCREEN under a figure opens it large; the sand plate’s two chips come with it.',
      'OPEN CHANGE ONE THING › jumps to module 3 to test the closing question. The strip under the title moves between modules.',
    ],
    changes: [
      'At 104 Hz the drive sits on the plate’s first mode it can wake: the plate moves a lot for a little push, and the sand snaps onto the still lines.',
      'At 80.9 Hz the same push barely moves the plate, so no figure forms.',
      'PHASE VIEW: amber rises while violet falls — neighbours across a still line move in opposite directions.',
    ],
    teaches: [
      'Sound is a pressure wave; each air molecule only moves back and forth around its place.',
      'Node = least movement (sand gathers there). Antinode = most movement (sand is thrown off).',
      'Normal modes: each with its own frequency and still lines. Module 1; Nodes, Antinodes & Modes is next.',
    ],
    tryThis: [
      'Tap At resonance · 104 Hz and watch: the sand settles into a figure within seconds. Tap Off resonance · 80.9 Hz: it only shivers.',
      'Answer the closing question in your head before you tap OPEN CHANGE ONE THING ›.',
    ],
  },

  // ── 2 · Nodes, Antinodes & Modes (rack) ───────────────────────────────────
  nodes: {
    seeing: [
      'The plate on the glass (a square to start), drawn by VIEW: Node lines to start, or Phase, Heat map, Sand or 3D plate.',
      'Readouts: MODE (the mode’s name), DRIVE (Hz), LINES (how many nodal lines) and RES — AT, APPROACHING, BETWEEN or BELOW.',
      'It opens on the first mode: DRIVE 104 Hz, MODE (2,0)+(0,2), LINES 2, RES AT.',
    ],
    control: [
      'FREQ fader (30 Hz–3 kHz), stretched around each mode so you can ride onto it. Its tray, JUMP TO A MODE, lists the plate’s lowest modes (up to eight); off a mode, LAND ON jumps to the next mode up.',
      'SHAPE key: Square plate or Circular plate. A new shape lands the drive on its first mode.',
      'VIEW key: five ways to draw the same motion.',
      'PLAY drives the plate with the tone you hear; SILENT drives it without sound. Nothing moves until one is on.',
    ],
    changes: [
      'On a mode, that one mode answers strongly: a clean figure, RES AT, a bright heat map.',
      'Ride off it and several modes answer weakly at once: the figure dissolves, RES reads BETWEEN and the heat map goes dark.',
      'Higher modes generally carry more nodal lines — finer figures. A new shape brings a whole new family of figures.',
    ],
    teaches: [
      'Each stable Chladni figure is one normal mode; nodal lines are where the plate does not move.',
      'Neighbours across a nodal line move in opposite directions (the Phase view).',
      'A pattern belongs to a resonance, not to a frequency. Module 2; Change One Thing is next.',
    ],
    tryThis: [
      'Open FREQ and tap 3 · 501 Hz · (4,0) + (0,4) in JUMP TO A MODE: LINES goes from 2 to 4 — a higher mode, more still lines.',
      'Switch SHAPE to Circular plate: DRIVE lands on 89.8 Hz and MODE reads (2,0): 2 diameters, 0 circles.',
      'Turn SILENT on, set VIEW to Heat map, then ride FREQ slowly off the mode: the map goes dark as RES leaves AT.',
    ],
  },

  // ── 3 · Change One Thing (rack, no fader) ─────────────────────────────────
  change: {
    seeing: [
      'Two plates on one glass, tagged A and B (A · ALUMINUM and B · STEEL to start). One tone drives both, and it never changes.',
      'Readouts: LOCKED (the tone, set to plate A’s second mode — 191 Hz to start), then A and B, each reading AT, APPROACHING, BETWEEN or BELOW.',
      'Below: PREDICT FIRST with this comparison’s question, then a button that unlocks once B has moved.',
    ],
    control: [
      'VARY key: the one thing that differs — Material, Size, Thickness, Shape, Driver position, Support or Damping. Each option’s line is its prediction question.',
      'A and B keys: each plate’s setting. Flick B through its options while A holds. A new VARY starts A and B again.',
      'VIEW key: Sand + heat (to start), Heat map, Node lines or Sand. There is no frequency fader — the tone is locked on purpose.',
      'Once B has changed, CHANGE B FIRST — THEN READ IT becomes REVEAL HOW TO READ IT ›.',
    ],
    changes: [
      'The tone stays put. Each plate either has a mode there (AT, bright map, sand on lines) or not (BETWEEN, dark map).',
      'Size and thickness shift every mode by an exact scaling law; a new material moves them too (Solid wood also re-orders them), so the same tone stops matching.',
      'Damping does not move a resonance; it widens and weakens it.',
    ],
    teaches: [
      'The lab’s central finding: the figure belongs to the object, not to the tone.',
      'Why one controlled change makes a fair test.',
      'A metal plate’s resonances are very sharp, so a small shift misses one. Module 3; Harmonics vs Plate Modes is next.',
    ],
    tryThis: [
      'Predict first: will steel keep the figure? A reads AT, B reads BETWEEN — even a near-twin material misses this sharp resonance.',
      'VARY Damping and set B to High: B stays AT — damping blurs a resonance but does not move it.',
      'VARY Thickness: A is 0.5 mm and LOCKED reads 95.6 Hz; B at 1 mm reads BETWEEN.',
    ],
  },

  // ── 4 · Harmonics vs Plate Modes (rack) ───────────────────────────────────
  harmonics: {
    seeing: [
      'Four ladders on one axis (1f to 6f): String, Air column (open), Circular membrane, Free metal plate. Each rung is one natural frequency.',
      'Each ladder is tagged HARMONIC (green) or INHARMONIC (red). Every ladder’s first rung is set to 110 Hz so the ratios compare.',
      'Readouts: LADDER, RATIO, FREQ and FAMILY (HARMONIC or INHARM.).',
    ],
    control: [
      'LADDER key: pick what vibrates; its row lights up.',
      'MODE key: each rung of that ladder, e.g. Mode 2 · 2.00× · 220 Hz. Tapping one plays it as a sine tone and lights its rung white.',
      'PLAY: stop the tone, or start it again on the last rung.',
    ],
    changes: [
      'String and open air column: rungs at exactly 2×, 3×, 4×… — whole-number steps that blend into one clear pitch.',
      'Membrane: 1.59×, 2.14×, 2.30×… Plate: 1.73×, 2.33×, 3.91×… Not whole numbers, so no single clear pitch.',
      'That is why a Chladni figure is not a picture of a chord.',
    ],
    teaches: [
      'What a harmonic series is, and which vibrating things have one.',
      'Why a drum’s pitch is vaguer than a string’s.',
      'Chladni figures show resonance and normal modes, not musical harmony. Module 4; Harmony in Motion is next.',
    ],
    tryThis: [
      'LADDER on String, MODE 2: RATIO 2.00×, FREQ 220 Hz — exactly an octave above 110 Hz.',
      'LADDER on Circular membrane, MODE 2: RATIO 1.59×, FREQ 175 Hz — between whole numbers.',
      'Play String mode 2, then Free metal plate mode 2 (1.73×): the plate’s step lands off the string’s neat ratios.',
    ],
  },

  // ── 5 · Harmony in Motion (rack) ──────────────────────────────────────────
  harmony: {
    seeing: [
      'One glass, three VIEWs: Wave addition (A, B and A + B stacked), Lissajous figure (B drawn against A) or Spectrum (two lines).',
      'It opens on a perfect fifth: A 220 Hz, B 330 Hz.',
      'Readouts: A and B (Hz and nearest note), INTERVAL (e.g. P5) and BEAT (Hz, only when detuned).',
    ],
    control: [
      'BASE fader (55–440 Hz): moves both tones together, keeping the ratio.',
      'DETUNE fader (0 to +3 % on B): pulls B off the exact ratio. At the bottom it reads locked — no beats.',
      'RATIO key: seven ratios, from 1 : 1 unison to 5 : 7 tritone (near). VIEW key: Wave addition, Lissajous figure or Spectrum.',
      'PLAY sounds the pair.',
    ],
    changes: [
      'BASE scales both tones by the same factor, so the ratio, the figure and the interval stay the same.',
      'DETUNE breaks the ratio: the Lissajous figure no longer closes and keeps turning; in Wave addition, A + B is drawn across about two and a half beats so its shape is seen cycling.',
      'That cycle is the beat: the summed wave’s shape repeats |n₁ × f₂ − n₂ × f₁| times a second — the number BEAT shows.',
    ],
    teaches: [
      'Musical harmony is about ratios between frequencies, not any one frequency.',
      'What beats are, and why zero beats means in tune.',
      'Ratios are a separate subject from plate modes. Module 5; Other Cymatic Systems is next.',
    ],
    tryThis: [
      'Ride BASE from 110 to 220 Hz: A reads 440 Hz, B 660 Hz, INTERVAL still P5 — and the figure does not change.',
      'Set VIEW to Lissajous figure, then ride DETUNE to about +1.00 %: at BASE 220 Hz, BEAT reads about 13.2 Hz and the figure starts to turn.',
      'Ride DETUNE back to locked, then RATIO 1 : 2 — octave: the figure closes and holds still. Simple ratios close; detuned ones drift.',
    ],
  },

  // ── 6 · Other Cymatic Systems (rack) ──────────────────────────────────────
  systems: {
    seeing: [
      'A drawing of the chosen system, starting with A string: a standing wave, its still points as blue dots.',
      'SYSTEM steps through six: A string, An air column, A water surface, A loudspeaker with particles on it, Bells, gongs and cymbals, Acoustic levitation.',
      'Readouts: SYSTEM, MODE, NODES and FAMILY (HARMONIC, INHARM. or 1-D wave).',
    ],
    control: [
      'SYSTEM key: pick what vibrates; each option says what that is.',
      'HARMONIC fader (string and air column only): harmonics 1 to 5. It hides for the other systems.',
      'For the water, the loudspeaker and the bells, a dock key opens the full studio: LIQUID ›, SPEAKER › or PLATES ›.',
    ],
    changes: [
      'String: harmonic n has n loops and n + 1 still points, counting both ends.',
      'Open pipe: pressure stays still at both open ends and swings inside. Close one end and the pipe drops about an octave, keeping only odd harmonics.',
      'The water ripples at HALF the shake rate. The bell flexes in its lowest (2,0) mode, with four still meridians.',
    ],
    teaches: [
      'Most visible vibration patterns mark the still places (nodes) of one of the system’s own modes.',
      'Strings and air columns are harmonic, so they have a clear pitch; membranes, plates, bells and dishes are not.',
      'Levitated beads hang where the pressure barely changes. Module 6; Evidence vs Myth is next.',
    ],
    tryThis: [
      'With A string, ride HARMONIC to the top: MODE reads 5f and NODES 6 — five loops, six still points.',
      'Switch to An air column at harmonic 3: NODES reads 4 — both open ends plus two inside.',
      'Pick A water surface and watch: the dish shakes at one rate, the surface ripples at half of it.',
    ],
  },

  // ── 7 · Evidence vs Myth (reading page, commit-first) ─────────────────────
  myth: {
    seeing: [
      'Six claims about cymatics, each on its own card with three buttons: EVIDENCE, DEPENDS and MYTH.',
      'Once you pick, the card shows the verdict — marked YOU HAD IT, or YOU SAID and your pick — and the reason.',
      'At the end: HOW THIS LAB STAYS HONEST, on what each label on a pattern means.',
    ],
    control: [
      'Tap a verdict on each card. You commit first, then read the evidence; a pick cannot be changed on this visit.',
      'When all six are answered, a closing line gives your score and points you to the misses.',
      'Nothing here is saved or credited — it is a self-check.',
    ],
    changes: [
      'The verdict shows only after you commit, so a surprise has a chance to stick.',
      'EVIDENCE: real, measurable physics. DEPENDS: true only in part. MYTH: not supported by the evidence.',
    ],
    teaches: [
      'How to tell what the patterns genuinely show from claims that go past the physics.',
      'Why every pattern in this lab carries a SIMULATION label naming its model.',
      'Module 7; Guided Experiments is next.',
    ],
    tryThis: [
      'Answer all six before reading any reason, then re-read the cards marked YOU SAID.',
      'Afterwards open any studio and read the label under its display: SIMULATION, and how the pattern was worked out.',
    ],
  },

  // ── 8 · Guided Experiments (menu) ─────────────────────────────────────────
  experiments: {
    seeing: [
      'A menu of seventeen experiments: ten on the Chladni plate, four in the liquid dish, three on the drumhead and loudspeaker.',
      'Each card: number, title and goal, a PREDICT FIRST question, ▸ PREVIEW THE … STEPS, and SET UP THE PLATE ›, DISH › or DRUM ›.',
      'START THE SERIES › at the top opens experiment 1, Find the first visible resonance.',
    ],
    control: [
      'START THE SERIES › opens experiment 1 in the Plate Studio, already set up.',
      'SET UP … › opens one experiment in its studio. ▸ PREVIEW shows its steps here first.',
      'In the studio the experiment card sits above the notes: I’VE MADE MY PREDICTION, steps to tick, REVEAL LOOK FOR ›, and EXPERIMENT › to move on.',
    ],
    changes: [
      'Each experiment opens its studio with the object and the frequency already set, so you start at the moment it describes.',
      'Ticks are kept on this device. LOOK FOR unlocks after you predict and tick at least one step.',
    ],
    teaches: [
      'How a fair experiment runs: predict, change one thing, observe.',
      'The central discovery, tested on plates, liquids and drums.',
      'The last module; the series ends by pointing you to Evidence vs Myth.',
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
    seeing: [
      'The plate from above (a 240 mm aluminum square to start), drawn by VIEW. While nothing drives it, PRESS ▶ PLAY TO DRIVE THE PLATE sits on top.',
      'Readouts: DRIVE (Hz), RESPONSE (how hard the plate moves, %), MODE (the mode it is on) and RES — AT, NEAR, BETWEEN or BELOW.',
      'LAB NOTES: the resonance card, WHAT THIS PLATE IS (its lowest modes and their ratios) and the SIMULATION notes.',
    ],
    control: [
      'Header: SAVE sends this exact setup to the Pattern Gallery; ▶ plays the drive tone.',
      'FREQ fader (30 Hz–3 kHz, stretched around each mode), ‹ −0.1% / +0.1% › fine steps, and JUMP TO A MODE. Off a mode, LAND ON jumps to the next mode up.',
      'PLATE: shape (and the SOLVED SHAPES), material, size, damping, thickness, edges. DRIVE: driver position, clamp, Sweep the modes, Slow motion, Silent drive, SECOND TONE.',
      'VIEW: Particles, Heat map, Particles + heat, Phase, Node lines, 3D plate, Cross-section. LEVEL: drive strength. SAND: amount, grain size, ⟲ Reset sand, friction.',
    ],
    changes: [
      'On a mode the plate moves a lot for a little push: RESPONSE climbs, RES reads AT and sand gathers on the still lines.',
      'Change the plate and every mode moves — stiffer, lighter or thicker rings higher; bigger rings lower — so the same DRIVE can stop being a resonance.',
      'LEVEL sets how far the plate moves, not which mode. A driver on a nodal line cannot wake that mode.',
    ],
    teaches: [
      'Which plate properties set the resonances, and why the frequency alone never names the figure.',
      'Plate modes are inharmonic: their ratios are not 1 : 2 : 3 : 4.',
      'The lab’s main instrument: modules 1–3 prepare it, and ten guided experiments run here.',
    ],
    tryThis: [
      'It opens on 240 Hz: RES BETWEEN, RESPONSE 0%. Open FREQ and tap 191 Hz · (2,2) in JUMP TO A MODE: RES AT, RESPONSE 98%.',
      'Stay there and switch PLATE › MATERIAL to Steel: RESPONSE falls to 6% and RES reads BETWEEN — the plate changed, not the tone.',
      'Switch MATERIAL back to Aluminum, then press ▶ (or DRIVE › Silent drive): with VIEW on Particles the sand settles onto the (2,2) figure.',
    ],
  },

  // ── Liquid Cymatics Studio ────────────────────────────────────────────────
  liquid: {
    seeing: [
      'A dish of liquid on a shaker (water, 4 mm deep, 100 mm round to start), drawn by VIEW — Liquid surface to start.',
      'Readouts: DRIVE (shake frequency), RESP (how fast the surface answers; f/2 once patterns form), SHAKE (in g) and a/a꜀ (shake ÷ threshold).',
      'LAB NOTES: the stage ladder from FLAT SURFACE up to SPLASHING, the THRESHOLD line, WHAT THIS RIG IS and RIG SAFETY.',
    ],
    control: [
      'SHAKE fader (0.02–1.5 g, on the lane when you arrive) with ‹ −5% / +5% › steps. FREQ fader (10–200 Hz) with DRIVE AT TWICE A DISH MODE.',
      'LIQUID: eight liquids, plus temperature. DISH: container, size, depth, wall height, bottom and rim contact.',
      'DRIVE: waveform, Sweep 15 → 150 Hz, Slow motion, Silent drive, SECOND FREQUENCY. VIEW: The rig, Liquid surface, Height map, Contours, Refraction, 3D surface, Cross-section.',
      'Header: SAVE sends the setup to the gallery; ▶ plays the drive tone.',
    ],
    changes: [
      'Below the threshold the liquid rides the platform: small ripples at the drive rate.',
      'Past it (a/a꜀ above 1) the surface breaks into standing Faraday waves at HALF the drive frequency; more shake climbs the ladder toward chaos.',
      'Thicker liquid, a shallower layer or a wetted rim damps the waves, so the threshold rises. A higher drive frequency gives shorter waves and a higher threshold.',
    ],
    teaches: [
      'Faraday waves: a surface shaken up and down answers at half the shake frequency (a subharmonic).',
      'A pattern needs enough push to beat damping — a threshold, not just a frequency.',
      'The pattern depends on the liquid, the depth and the dish, not on the frequency alone. Four guided experiments run here.',
    ],
    tryThis: [
      'It opens at 40.0 Hz and 0.25 g: STABLE STANDING PATTERN, a/a꜀ 1.59×, RESP 20.0 Hz f/2 — half the drive.',
      'Lower SHAKE to about 0.15 g: SMALL RIPPLES, and RESP reads 40.0 Hz f. Raise it to about 0.60 g: UNSTABLE MOTION.',
      'Back at 0.25 g, switch LIQUID to Glycerin–water 50/50: SMALL RIPPLES — its threshold, about 0.53 g, is now above your shake.',
    ],
  },

  // ── Membrane & Loudspeaker Studio ─────────────────────────────────────────
  membrane: {
    seeing: [
      'A drumhead from above (a 14" snare-size head at 3 kN/m to start), drawn by VIEW. Loudspeaker swaps in a cone cutaway plus the cone seen from the front.',
      'Drum readouts: DRIVE, FUNDAMENTAL (the lowest mode), MODE and RESPONSE. Loudspeaker: DRIVE, f_s (its resonance), ka (cone size against wavelength) and STAGE.',
      'LAB NOTES: the resonance card and TUNING, or the cone’s stage ladder, plus the SIMULATION notes.',
    ],
    control: [
      'FREQ fader (20 Hz–6 kHz) with JUMP TO A MODE — JUMP TO A CONE STAGE while the loudspeaker shows.',
      'HEAD: head material, diameter, tension, damping, Open shell or Timpani kettle. STRIKE: Sweep, Slow motion, Silent drive and WHERE THE MALLET LANDS (or Drag on drum).',
      'CONE: six drivers and Show the loudspeaker. VIEW: The drum, Heat map, Phase, Node lines, 3D head, Cross-section, Loudspeaker. LEVEL: drive strength.',
      'Header: SAVE sends the setup to the gallery; ▶ plays the drive tone.',
    ],
    changes: [
      'A tighter head rings higher, a bigger or heavier one lower.',
      'A bare head’s modes sit near 1 : 1.59 : 2.14 — not whole numbers, so no clear pitch. The kettle pulls the main modes near 1 : 1.5 : 2, so a pitch is heard.',
      'The strike point decides which modes wake: a centre strike wakes only the modes with no diameters. A cone moves as one piston above its resonance, then flexes, then breaks up.',
    ],
    teaches: [
      'Why a bare drum has a vague pitch and a timpani a clear one.',
      'How tension, size and strike point shape a drum’s sound.',
      'How a loudspeaker cone changes from piston to breakup. Three guided experiments run here.',
    ],
    tryThis: [
      'It opens at 180 Hz with RESPONSE 9 %. Open FREQ and tap 200 Hz · (0,1) in JUMP TO A MODE: RESPONSE 91 %, MODE (0,1).',
      'Set HEAD › TENSION to 6 kN/m: FUNDAMENTAL rises from 200 Hz to 282 Hz — double the tension, about 1.41× the pitch.',
      'Tap CONE › Show the loudspeaker: with DRIVE still at 199.6 Hz the ladder reads PISTON BAND — THE CONE MOVES AS ONE.',
    ],
  },
};

// ── THE STUDIOS' LEARN AND CHECK TABS (same lesson and check in all three) ───
export const CYMATICS_LEARN_GUIDE: ScreenGuide = {
  seeing: [
    'The LEARN tab: the Cymatics guided lesson as one page to read. Nothing here plays or moves.',
    'First the lab’s idea, then CONTROLS: one entry for each part of the plate, liquid, drum, loudspeaker and gallery screens.',
    'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — how size, thickness and material set a plate’s modes.',
  ],
  control: [
    'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live studio.',
    'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet; long-press a dock key or a readout for just its entry.',
  ],
  changes: [
    'Nothing on this page moves — it is the reference for what EXPLORE shows.',
    'Each CONTROLS entry names a part of a studio screen and says what it does.',
  ],
  teaches: [
    'The words for the lab: node, antinode, mode, resonance, damping, Faraday wave, breakup.',
    'The common mix-ups — level versus frequency, frequency versus figure — and why each happens.',
  ],
  tryThis: [
    'In the Plate Studio: read the Drive level entry, then on EXPLORE raise LEVEL on a mode — the plate moves more, the figure stays the same.',
    'Read the Material entry, then on EXPLORE switch PLATE › MATERIAL and watch the same frequency stop being a resonance.',
  ],
};

/** The LEARN tab per studio: one lesson, but each studio's TRY THIS uses only
 *  that studio's own controls (the Liquid Studio has SHAKE and LIQUID, no
 *  LEVEL or plate material; the Membrane Studio's material is HEAD MATERIAL). */
export const CYMATICS_LEARN_GUIDES: Record<CymaticsStudioId, ScreenGuide> = {
  plate: CYMATICS_LEARN_GUIDE,
  liquid: {
    ...CYMATICS_LEARN_GUIDE,
    tryThis: [
      'In the Liquid Studio: read the Faraday waves entry, then on EXPLORE lower SHAKE to about 0.15 g — the half-frequency pattern gives way to SMALL RIPPLES.',
      'Read the Liquid entry, then at 0.25 g switch LIQUID to Glycerin–water 50/50: the thicker liquid raises the threshold, so only SMALL RIPPLES remain.',
    ],
  },
  membrane: {
    ...CYMATICS_LEARN_GUIDE,
    tryThis: [
      'In the Membrane Studio: read the Drive level entry, then on EXPLORE raise LEVEL on a mode — the head moves more, the figure stays the same.',
      'Read the Tension and size entry, then set HEAD › TENSION to 6 kN/m: FUNDAMENTAL rises from 200 Hz to 282 Hz.',
    ],
  },
};

export const CYMATICS_CHECK_GUIDE: ScreenGuide = {
  seeing: [
    'CHECK YOUR UNDERSTANDING: five questions on what sets a figure, where sand gathers, drive level, the liquid’s half-frequency waves and damping.',
    'Each question turns to ✓ once you get it right. The same check sits on the lab home.',
  ],
  control: [
    'Tap an answer. Wrong: NOT QUITE — TRY ANOTHER, with the explanation — read it, then pick again. Right: CORRECT, with the same explanation.',
  ],
  changes: [
    'Answer every question correctly and the lab is complete; it counts toward every certificate that needs it. A wrong answer costs nothing and there is no score.',
  ],
  teaches: [
    'Whether the lab’s core ideas stuck: resonance, nodes, level versus frequency, Faraday waves, damping.',
  ],
  tryThis: [
    'Unsure? Try it on EXPLORE first, then come back and answer.',
    'A wrong pick shows the explanation — read it before you try again.',
  ],
};

/** The LabShell `guide` for a studio: EXPLORE, LEARN and CHECK each explained. */
export function cymaticsStudioGuide(studio: CymaticsStudioId): (mode: 'learn' | 'explore' | 'check') => ScreenGuide {
  return (mode) => (mode === 'learn' ? CYMATICS_LEARN_GUIDES[studio] : mode === 'check' ? CYMATICS_CHECK_GUIDE : CYMATICS_STUDIO_GUIDES[studio]);
}

// ── PATTERN GALLERY & ART STUDIO (one route, four modes) ─────────────────────
export type CymaticsGalleryMode = 'browse' | 'open' | 'art' | 'compare';

export const CYMATICS_GALLERY_GUIDES: Record<CymaticsGalleryMode, ScreenGuide> = {
  browse: {
    seeing: [
      'PATTERN GALLERY & ART STUDIO: every pattern you saved from the three studios, as a card of line art.',
      'Filter chips: All, Plate, Dish, Drum, ★ Favourites. Nothing saved yet? NOTHING SAVED YET says how, with links to each studio.',
    ],
    control: [
      'Tap a card to open it. Long-press a card to make it a favourite.',
      'Compare… starts picking: tap two to four cards, then COMPARE ›.',
      '‹ goes back. ⓘ GUIDED LESSON at the bottom covers the gallery and the art studio.',
    ],
    changes: [
      'Each card is redrawn from the saved numbers through the studio’s own physics — nothing is stored as a picture.',
      'Your colouring is kept apart from the numbers, so colouring never changes the science.',
    ],
    teaches: [
      'A saved pattern is a repeatable experiment: its exact settings come back.',
      'Two saves that differ in one thing show the lab’s central discovery in your own data.',
    ],
    tryThis: [
      'In the Plate Studio, SAVE a figure, change only the material, SAVE again — then compare the two here.',
      'Tap ★ Favourites to keep your best figures in one place.',
    ],
  },
  open: {
    seeing: [
      'One saved pattern: its figure as line art with its SIMULATION label, NAME and NOTES fields, and a table of the settings it came from.',
      'Below: EXPORT — Art print or Lab print, as a PNG card, Transparent PNG, PDF or SVG, with a PAGE size.',
    ],
    control: [
      'Open in studio › brings back this exact setup. Colour › opens the art board.',
      'Duplicate, ★ Favourite and Delete (it asks first). Type to rename it or add notes.',
      'EXPORT: pick the sheet and the format, then SHARE, SAVE or PRINT.',
    ],
    changes: [
      'The figure is recomputed from the saved state each time, so Open in studio › gives back exactly what you saw.',
      'Every exported sheet carries its SIMULATION label.',
    ],
    teaches: [
      'A pattern is a set of physical settings, not a picture.',
    ],
    tryThis: [
      'Tap Open in studio ›, change one setting, SAVE, and compare the two.',
      'Write in NOTES what you were testing — it stays with the pattern.',
    ],
  },
  art: {
    seeing: [
      'ART STUDIO: your figure on an art board, split into regions by its nodal lines.',
      'Readouts: REGIONS (how many areas), FILLED, UNDO and REDO (steps you can go back or forward).',
    ],
    control: [
      'Tap a region on the figure to fill it.',
      'FILL: colours, Custom colour…, Erase, Undo, Redo, Clear all fills. STYLE: Solid or Gradient, and the colour of the nodal lines.',
      'WEIGHT fader: line thickness, down to hidden. PAPER: the background. SYM (Off, or 2- to 8-fold): fill a region and its rotated partners together.',
    ],
    changes: [
      'A fill never crosses a nodal line: each region is a part of the plate that moves together.',
      'Gradient shades each region from its centre (the antinode) to its edge (the still line).',
      'Colouring is saved apart from the pattern’s numbers.',
    ],
    teaches: [
      'Regions between nodal lines move together; neighbours move in opposite directions.',
      'A figure’s symmetry comes from the object’s shape and the mode.',
    ],
    tryThis: [
      'On a square-plate figure such as (2,2), set SYM to 4-fold and fill a region off the centre: its three rotated partners fill with it.',
      'Choose Gradient in STYLE: each region reads like height — the colour in the middle, darker at the still line.',
    ],
  },
  compare: {
    seeing: [
      'COMPARE: the two to four patterns you picked, side by side, with a table of their settings and a one-line verdict under it.',
      'Then EXPORT, to print or share the comparison.',
    ],
    control: [
      'Edit selection ‹ goes back to change the picks. What am I looking at? opens the lesson entry.',
      'EXPORT: Art print or Lab print, and a format.',
    ],
    changes: [
      'Where only one setting differs, any change in the figure comes from that setting.',
    ],
    teaches: [
      'The same tone makes different figures on different objects — shown with your own saves.',
    ],
    tryThis: [
      'Compare two saves that differ only in material: the table shows one row changed, the figures show what it did.',
      'Compare a plate, a dish and a drum: three objects, three different answers.',
    ],
  },
};
