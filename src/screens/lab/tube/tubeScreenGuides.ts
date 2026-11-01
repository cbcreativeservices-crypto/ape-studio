/**
 * Vacuum Tube Fundamentals — "explain this screen" content (owner 2026-10-31,
 * the Screen Guide rollout, Electronics group). One guide per module (keyed by
 * the section key in VacuumTubeLabScreen's SECTIONS), one for the what's-left
 * screen, and one each for the Tube Reference list and a tube's card — the
 * two screens the dock's TUBE REF › key opens.
 *
 * Every line was written against the screen's own code (VacuumTubeLabScreen,
 * gridModel, tube/viz, TubeReferenceScreen, TubeCardScreen, tubeRefs): the
 * names are the on-screen names (dock labels, bezel keys and words, chip
 * labels, tray options, buttons), and every number in TRY THIS is what the
 * screen prints at that setting (gridModel's plate-current law, the warm-up
 * stages, the bias / drive thresholds). Change a module's labels, ranges or
 * thresholds → update its guide here; test/screenGuide_tube_20261031.test.ts
 * pins the shape, the names and the numbers.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; claims KNOWLEDGE, never skills; no gear maker
 * names (tube type numbers such as 12AX7 are the screen's own names); no
 * "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The section keys of VacuumTubeLabScreen's SECTIONS, in lab order. */
export type TubeSectionId = 'inside' | 'flow' | 'grid' | 'amplify' | 'highv' | 'types' | 'bias' | 'sat' | 'versus';

/** The shared tail every module's dock carries (TUBE REF ›, FULL SCREEN). */
const DOCK_TAIL = 'TUBE REF › opens the Tube Reference library. ⤢ FULL SCREEN enlarges the drawing. Long-press a control for its guided-lesson entry.';

export const TUBE_SCREEN_GUIDES: Record<TubeSectionId, ScreenGuide> = {
  // ── 1 · What's inside ────────────────────────────────────────────────────
  inside: {
    seeing: [
      'A vacuum tube drawn cut open — a pentode, the fullest kind: glass, heater, cathode, three grids and the plate. Each part wears the same color as on the Tube Reference cards.',
      'Readouts: PARTS (how many parts are showing), EMISSION (are electrons leaving the cathode?) and CURRENT — NONE, METERED or WIDE OPEN.',
      'Below: while a part is hidden, a line naming what broke; then a note on the last part tapped.',
    ],
    control: [
      'PARTS key: one chip per part, in build order — GLASS, VACUUM, HEATER, CATHODE, PLATE, CONTROL GRID, SCREEN GRID, SUPPRESSOR. Tap a chip to hide or show that part.',
      'HIDE ALL leaves only the glass; SHOW ALL puts everything back.',
      '⚡ E-VIEW swaps the physical drawing for the Electron View: the electron cloud, the flow and the grid’s field.',
      DOCK_TAIL,
      'The strip under the title moves between the modules; ‹ leaves the lab.',
    ],
    changes: [
      'Hide a part and the readouts — and, in ⚡ E-VIEW, the electrons — show what it was for. The line below names the first part missing, in build order.',
      'No HEATER or CATHODE: nothing boils electrons off, so EMISSION reads OFF.',
      'No GLASS or VACUUM: air fills the bottle and electrons scatter, so CURRENT reads NONE.',
      'No PLATE: nothing pulls electrons across. No CONTROL GRID: the flow runs WIDE OPEN.',
    ],
    teaches: [
      'What each part of a tube does, and why every one is needed.',
      'The build order: heat, an electron source and a collector make a working diode; each added grid controls that flow.',
      'The first module of Vacuum Tube Fundamentals, the first lab in Audio Electronics. Electron Flow comes next.',
      'The drawing is an illustrative model, not measured tube data.',
    ],
    tryThis: [
      'Tap CONTROL GRID: CURRENT jumps from METERED to WIDE OPEN — full current, but nothing left to shape it into a signal.',
      'Tap GLASS: VACUUM goes dark with it. EMISSION stays ON, but CURRENT reads NONE — electrons cannot cross air.',
      'Tap SHOW ALL if it shows, then HIDE ALL, and add parts back in build order, reading what each one fixes in the line below the display.',
    ],
  },

  // ── 2 · Electron flow ───────────────────────────────────────────────────
  flow: {
    seeing: [
      'One tube warming up, slowed and drawn: the heater glows, an electron cloud gathers round the cathode, then streams to the plate.',
      'Readouts: HEAT (how warm the heater is), STAGE (which warm-up step, out of five) and PLATE I — the plate current, as a share of full.',
      'Below the display, a numbered line describes the step, from 1 · Cold to 5 · Steady current.',
    ],
    control: [
      'WARM-UP fader (0–100%): how hot the heater is. Its readout adds cold, warming… or conducting.',
      DOCK_TAIL,
    ],
    changes: [
      'Below 15% the heater is cold and nothing moves.',
      'As it warms, the cathode boils off electrons (thermionic emission) and the positive plate collects them: at first a trickle too small to read (PLATE I 0%).',
      'Above 70% emission climbs steeply and PLATE I with it, to 100% at full heat. Then the cathode boils off more than the plate takes; the extra hangs back as a cloud (space charge) that sets steady current.',
    ],
    teaches: [
      'Why a tube does nothing until it is hot: no heat, no electrons, no current, no sound — the reason tube gear needs warm-up time.',
      'Why the vacuum matters: electrons fly freely only because nothing is in the way.',
      'It follows What’s Inside; The Control Grid comes next.',
      'The picture is conceptual and slowed: it gathers the dots by the cathode first so you can see them. Real electrons are invisible and countless.',
    ],
    tryThis: [
      'Slide WARM-UP to 50%: STAGE shows step 3 and PLATE I stays 0% — electrons are boiling off, but the trickle reaching the plate is too small to read.',
      'Push WARM-UP past 85%: the line reaches 5 · Steady current and PLATE I passes 50%. At 100%, PLATE I reads 100%.',
      'Slide back below 70%: PLATE I drops to 0% although the heater still glows.',
    ],
  },

  // ── 3 · The control grid ────────────────────────────────────────────────
  grid: {
    seeing: [
      'Cathode, control grid and plate, with electrons streaming from cathode to plate through the gaps in the grid.',
      'Readouts: GRID — CUT OFF, PARTIAL or FULL FLOW — and PLATE I, the plate current as a share of full.',
      'Below the display: CHECK YOURSELF, a question on how the grid does its job.',
    ],
    control: [
      'GRID V fader (0–100%): the grid’s voltage. 0% is the most negative, 100% the least. Its readout adds cut off — no current flows, partly negative or barely negative — full flow.',
      '⚡ E-VIEW adds the grid’s repelling field lines.',
      DOCK_TAIL,
    ],
    changes: [
      'The grid sits slightly negative. Electrons are negative too, so its field pushes them back toward the cathode.',
      'Lower GRID V (more negative): a stronger push, less PLATE I. At 15% and below the tube is cut off — PLATE I reads 0%.',
      'Higher: the stream swells, faster than the voltage rises, to 100% at the top. The wires never move — the field does the work.',
    ],
    teaches: [
      'Amplification: a very small voltage at the grid controls a much larger current through the tube.',
      'The grid works by its electric field, not by blocking electrons like a shutter.',
      'It follows Electron Flow; Signal Amplification comes next.',
    ],
    tryThis: [
      'Start at 50%: PLATE I reads 26%. Slide to 75%: it reads about 59% — more than double the current for a quarter of the lane.',
      'Slide below 15%: GRID reads CUT OFF and PLATE I reads 0%.',
      'Turn on ⚡ E-VIEW and ride GRID V down: the field arrows grow longer as the grid goes more negative.',
    ],
  },

  // ── 4 · Signal amplification ────────────────────────────────────────────
  amplify: {
    seeing: [
      'A small tube stage: a small input wave at the left rides a blue wire into the grid; a large wave leaves the plate on an amber wire at the right.',
      'Inside the glass, the grid dots pulse with the input and the cathode-to-plate electron stream thickens and thins with them.',
      'Readouts: GAIN ~×7 (the output is drawn about seven times taller), IN GRID and OUT PLATE.',
    ],
    control: [
      'Nothing to adjust here: this screen is a picture to watch.',
      'TUBE REF › opens the Tube Reference library. ⤢ FULL SCREEN enlarges the drawing.',
    ],
    changes: [
      'Your signal never touches the big current. It wiggles the grid, and the grid gates the much larger stream.',
      'Grid up → more current; grid down → less. That current flows through a resistor, so the plate voltage follows it — a large copy of the input.',
      'The copy is upside-down: more current makes the plate voltage drop. That flip is real tube behavior.',
    ],
    teaches: [
      'How a tube amplifies: a small signal controls a large current, and a resistor turns that current into a large voltage.',
      'Why one tube stage turns the signal upside-down.',
      'Most tube mic preamps, guitar amps and compressors repeat this picture. It follows The Control Grid; Why Tubes Need High Voltage comes next.',
    ],
    tryThis: [
      'Watch the grid dots swell and the electron stream thicken together — the small input is opening the valve.',
      'Compare the two waves at the same point across each graph: where the input is up, the output is down.',
      'Tap ⤢ FULL SCREEN: the blue lead ends at the grid; the amber lead leaves from the plate at the top.',
    ],
  },

  // ── 5 · Why high voltage ────────────────────────────────────────────────
  highv: {
    seeing: [
      'Cathode and plate, with the plate’s pull drawn as arrows: arrow length and electron count show how strong it is.',
      'Readouts: SUPPLY (SMALL or B+ HIGH), PULL (WEAK or STRONG) and STREAM (SPARSE or DENSE).',
    ],
    control: [
      'SUPPLY key: SMALL SUPPLY or HIGH-VOLTAGE SUPPLY (B+). The tray stays open, so you can switch back and forth while the drawing reacts.',
      DOCK_TAIL,
    ],
    changes: [
      'A small plate voltage makes a weak field: few electrons cross, slowly. Too little current, and no room for a big signal to swing.',
      'Hundreds of volts on the plate — the B+ supply — sweep the cloud across: a dense, fast stream with headroom (room to swing).',
      'PULL and STREAM change with SUPPLY: the field’s strength sets the current.',
    ],
    teaches: [
      'Why tube circuits run at hundreds of volts.',
      'Safety: the B+ rail and its filter capacitors hold a charge that can kill, even after the amp is unplugged. Servicing, measuring and biasing are qualified-technician work.',
      'It follows Signal Amplification; Triode · Tetrode · Pentode comes next.',
    ],
    tryThis: [
      'Switch SUPPLY to HIGH-VOLTAGE SUPPLY (B+): PULL reads STRONG and STREAM reads DENSE.',
      'Switch back to SMALL SUPPLY and compare the arrows and the number of electrons crossing.',
    ],
  },

  // ── 6 · Tube types ──────────────────────────────────────────────────────
  types: {
    seeing: [
      'The tube cut open as a TRIODE, TETRODE or PENTODE. The newest grid glows in its own color; in ⚡ E-VIEW, red dots are secondary electrons.',
      'Readouts: TYPE, GRIDS (1, 2 or 3 GRIDS) and NEW — the grid this type adds: G1 CONTROL, G2 SCREEN or G3 SUPPR.',
      'Below: ADDS (what the new grid is), then the type’s strength and its weakness.',
    ],
    control: [
      'TYPE key: TRIODE · 1 GRID, TETRODE · 2 GRIDS or PENTODE · 3 GRIDS. The tray stays open while the drawing rebuilds; each option shows that type’s strength.',
      '⚡ E-VIEW shows the electron cloud and flow instead of the physical drawing.',
      DOCK_TAIL,
    ],
    changes: [
      'TRIODE: one control grid. Simple and linear, but the plate’s field reaches back through it, limiting gain.',
      'TETRODE: a positive screen grid shields the control grid and speeds the stream. But electrons knock secondary electrons off the plate (red), and the screen steals them.',
      'PENTODE: a suppressor grid beside the plate turns those strays back.',
    ],
    teaches: [
      'Each tube type adds one grid to fix the last type’s weakness.',
      'Why the triode is the classic preamp tube and the pentode a classic output tube.',
      'Why many power tubes in the Tube Reference are beam tetrodes: beam-forming plates turn the strays back instead of a third grid.',
      'It follows Why Tubes Need High Voltage; Tube Bias comes next.',
    ],
    tryThis: [
      'Turn on ⚡ E-VIEW, then step from TRIODE to TETRODE: red dots appear — secondary electrons knocked off the plate and stolen by the screen grid.',
      'Step to PENTODE: NEW reads G3 SUPPR, and the red dots now die at the suppressor grid.',
      'Turn ⚡ E-VIEW off and step through the three types again: the newest grid glows in its own color.',
    ],
  },

  // ── 7 · Bias ────────────────────────────────────────────────────────────
  bias: {
    seeing: [
      'Left: a transfer curve (grid voltage in, plate current out) with a dot for the idle point riding it. Right: the output wave that results.',
      'Readouts: BIAS (the idle point) and ZONE — CUTOFF, LINEAR or SATURATION.',
      'Below: the zone in words, why biasing a real amp is technician work, and CHECK YOURSELF.',
    ],
    control: [
      'BIAS fader (0–100%): where the tube idles with no signal. Its readout adds too negative, correct or too positive, and turns red outside the safe middle.',
      DOCK_TAIL,
    ],
    changes: [
      'Bias sets where on the curve the tube rests; the signal swings around that point.',
      'Below 22%, too negative: the stream shuts off for part of the swing, so the bottom of the wave flatlines — CUTOFF.',
      'Above 80%, too positive: the top hits the ceiling and flattens — SATURATION. In between, the whole swing rides the straight part — LINEAR.',
    ],
    teaches: [
      'What bias is: the idle point that decides whether the whole wave is amplified cleanly.',
      'What “biasing an amp” after a tube change means — work done inside a live chassis at lethal voltage, by a qualified technician.',
      'It follows Triode · Tetrode · Pentode; Tube Saturation comes next.',
    ],
    tryThis: [
      'Slide BIAS to the far left: ZONE reads CUTOFF and the bottom of the output wave flatlines.',
      'Slide to the far right: ZONE reads SATURATION and the top flattens instead.',
      'Bring it back to 50%: ZONE reads LINEAR and the whole wave returns.',
    ],
  },

  // ── 8 · Saturation ──────────────────────────────────────────────────────
  sat: {
    seeing: [
      'Left: the tube’s transfer curve against a straight dashed line, the ideal. Right: the input wave and the output wave.',
      'Readouts: DRIVE (how hard the tube is pushed) and STATE — CLEAN, WARMING or SATURATED.',
    ],
    control: [
      'DRIVE fader (0–100%): the signal level into the tube. Its readout adds clean — straight-line region, warming — peaks rounding, or saturated — soft clipping.',
      DOCK_TAIL,
    ],
    changes: [
      'Low DRIVE: the wave rides the straight middle of the curve and comes out the same shape.',
      'More DRIVE: the peaks reach the bend. The tube can only open so far, so each extra bit of input buys less output — the peaks round over.',
      'Rounding (soft clipping) adds mostly low, gentle harmonics — extra tones at whole-number multiples of the note’s frequency. A hard limit shears peaks flat and adds harsh high ones.',
    ],
    teaches: [
      'What “tube sound” mostly is: soft clipping — peaks rounded, not chopped off.',
      'What harmonics are, and why low ones blend with the note while high ones sound harsh.',
      'It follows Tube Bias; Tube vs Transistor comes next.',
    ],
    tryThis: [
      'At the start (20%) STATE reads CLEAN: the input and output waves have the same shape.',
      'Slide past 30%: STATE reads WARMING and the output peaks begin to round.',
      'Push past 70%: STATE reads SATURATED and the left plot shows the swing reaching into the bend.',
    ],
  },

  // ── 9 · Tube vs transistor ──────────────────────────────────────────────
  versus: {
    seeing: [
      'Left: a tube, electrons crossing a vacuum. Right: a transistor at TRUE SIZE beside it, and ENLARGED · CUT OPEN, carriers crossing its junctions.',
      'In the transistor, blue pulses climbing the middle leg are the small base current that controls the flow.',
      'Readouts: TUBE VACUUM and TRANSISTOR JUNCTION. Below: the two compared side by side.',
    ],
    control: [
      'Nothing to adjust: this screen is a picture to compare. TUBE REF › opens the Tube Reference library; ⤢ FULL SCREEN enlarges the drawing.',
      'FINISH › on the strip, or FINISH · SEE WHAT’S LEFT › at the end of the reading, opens the list of modules you have not opened yet.',
    ],
    changes: [
      'Both do the same job — a small signal controlling a large one — with different physics.',
      'Tube: an electron cloud crosses a vacuum, gated by a grid’s field, at hundreds of volts. It glows, warms up and wears out.',
      'Transistor: carriers cross semiconductor junctions, gated by a tiny base current, at a few volts. Instant-on, tiny and long-lasting.',
    ],
    teaches: [
      'Why transistors won on size, cost and reliability, and why tubes survive where their soft overload IS the sound.',
      'Neither is simply “better”: pick by the job.',
      'The last module of this lab. Next in Audio Electronics, the Amplifier Principles Lab follows the same idea into transistor amplifiers.',
    ],
    tryThis: [
      'Compare the true-size transistor with the tube beside it, then look inside the cut-open view.',
      'Follow the blue base pulses up the middle leg to the thin blue base layer — the small current in control.',
      'Tap FINISH · SEE WHAT’S LEFT › to see any modules still to open.',
    ],
  },
};

/** The what's-left screen (LabEndScreen, mode "progress", noun "section"). */
export const TUBE_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the modules of this lab you have not opened yet. When none are left the title reads LAB COMPLETE.',
    'Opened modules fold into one ✓ DONE row; REVIEW ▾ lists them. CHECK YOUR UNDERSTANDING holds the lab’s short quiz.',
  ],
  control: [
    'Tap a module’s row to open it.',
    'Answer the CHECK YOUR UNDERSTANDING questions; a wrong pick explains itself and lets you try another.',
    'PRACTICE AGAIN FROM THE START opens What’s Inside — it never clears what you have done.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A module counts once you open it; its row moves from the list to the ✓ row.',
    'If your progress cannot be read, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'Which parts of the tube story — parts, warm-up, grid, gain, voltage, types, bias, saturation, transistors — are still to explore.',
    'Every module can be redone for practice at any time.',
  ],
  tryThis: [
    'Open the first module on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard.',
  ],
};

/** The Tube Reference list (TubeReferenceScreen). */
export const TUBE_REFERENCE_GUIDE: ScreenGuide = {
  seeing: [
    'The Tube Reference library: 40 tubes in four families — PREAMP & SMALL-SIGNAL TRIODES, POWER PENTODES & BEAM TETRODES, DIRECTLY-HEATED TRIODES and RECTIFIERS.',
    'Each row: the card number, the tube’s name with its other names and related tubes (an equivalent is the same tube; a “family” tube is a close relative, not always a direct swap), its job and its base (the socket it plugs into).',
  ],
  control: [
    'Search box: type a name (12AX7), an equivalent (ECC83), a base (octal) or a job (rectifier). ✕ clears it.',
    'Tap a row to open that tube’s two-page card (a locked row explains how to open it).',
    '‹ goes back to the lab.',
  ],
  changes: [
    'The list filters as you type; a family with no match disappears.',
    'Families group tubes by job or construction: preamp triodes give voltage gain up front, power tubes drive the output transformer, directly-heated triodes use the filament as the cathode, rectifiers turn AC into DC for the B+ supply.',
  ],
  teaches: [
    'The tubes behind most recorded music, grouped by the job each does.',
    'That one tube can go by several names: 12AX7, ECC83 and 7025 are the same tube.',
    'Card ratings come from published data sheets — check them against your amp’s own manual. Tube amps hold deadly voltages even unplugged; only a qualified technician should work inside one.',
  ],
  tryThis: [
    'Search ECC83: only the 12AX7 row is left — the same tube under its European name.',
    'Search rectifier: only the RECTIFIERS family is left.',
    'Search octal: every tube on the 8-pin octal base is listed.',
  ],
};

/** One tube's reference card (TubeCardScreen, the card view). */
export const TUBE_CARD_GUIDE: ScreenGuide = {
  seeing: [
    'One tube’s full-screen reference card: its structure, pin layout, key ratings, safe substitutions and what to watch for.',
    'The bar on top shows the tube’s number and name, with its family below. Beside the page buttons, a short category: Preamp Triode, Power Output, Directly-Heated Triode or Rectifier.',
  ],
  control: [
    'PAGE 1 and PAGE 2 switch between the card’s two pages. ‹ and › at the top right step to the previous or next tube.',
    'Swipe the card sideways to flip pages in reading order: page 1, page 2, then the next tube.',
    'Pinch to zoom (up to 4×), double-tap to zoom in or back out, and drag to move round a zoomed card. Swiping works when the card is not zoomed.',
    '‹ at the top left goes back to the tube list. RETRY reloads a card that did not load.',
  ],
  changes: [
    'Each card loads from the library over your connection; LOADING shows while it arrives.',
    'Zooming in makes small print — pin numbers, ratings — readable without changing page.',
  ],
  teaches: [
    'How to read a tube’s pin layout and ratings, and which tubes can stand in for it.',
    'A card is a study reference, not a data sheet: ratings vary by maker and production run. Work from the maker’s own data sheet for anything you build, service or power up.',
  ],
  tryThis: [
    'Tap PAGE 2, then swipe left: the next tube opens on its page 1.',
    'Double-tap the card to zoom in, drag to read the pin layout, then double-tap to zoom back out.',
  ],
};
