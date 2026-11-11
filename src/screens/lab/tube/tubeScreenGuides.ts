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

/** The shared tail every module's dock carries (TUBE REF ›, FULL SCREEN), one
 *  wording for all; `control` names the module's own long-press control
 *  ('a control' where a module has several). */
const dockTail = (control: string) =>
  `TUBE REF › opens the Tube Reference library, and ⤢ FULL SCREEN enlarges the drawing. Long-press ${control} to read its Guided Lesson entry.`;

export const TUBE_SCREEN_GUIDES: Record<TubeSectionId, ScreenGuide> = {
  // ── 1 · What's inside ────────────────────────────────────────────────────
  inside: {
    intro: {
      learning: 'What each part of a vacuum tube does — heater, cathode, plate, grids, glass and vacuum — and why the tube stops working when one is missing.',
      start: 'In PARTS, tap CONTROL GRID and watch CURRENT jump to WIDE OPEN. Then tap HIDE ALL and add the parts back one at a time, reading the line below the drawing each time.',
    },
    seeing: [
      'You’re looking inside a cut-open vacuum tube: a pentode, with three grids, heater, cathode and plate inside the glass. Colors match the Tube Reference cards. It’s an illustration, not measured data.',
      'Watch PARTS (parts showing), EMISSION (are electrons leaving the cathode?) and CURRENT: NONE, METERED or WIDE OPEN.',
      'Hide a part and the line below names what broke; under it, a note on the last part you tapped.',
    ],
    control: [
      'Use the PARTS key: one chip per part, in build order — GLASS, VACUUM, HEATER, CATHODE, PLATE, CONTROL GRID, SCREEN GRID, SUPPRESSOR. Tap a chip to hide or show that part.',
      'HIDE ALL leaves only the glass. SHOW ALL puts every part back.',
      'Tap ⚡ E-VIEW to swap the drawing for the Electron View: the electron cloud, its flow and the grid’s field.',
      dockTail('a control'),
      'Use the strip under the title to move between modules. ‹ leaves the lab.',
    ],
    changes: [
      'Hide a part and the readouts (in ⚡ E-VIEW, the electrons too) show its job. The line below names the first missing part, in build order.',
      'No HEATER or CATHODE: nothing boils electrons off; EMISSION reads OFF.',
      'No GLASS or VACUUM: air fills it; electrons keep hitting gas molecules, so CURRENT reads NONE.',
      'No PLATE: nothing pulls electrons across. No CONTROL GRID: nothing controls the flow; it runs WIDE OPEN.',
    ],
    teaches: [
      'Each part has one job: the heater warms the cathode, the cathode releases electrons, the vacuum lets them travel freely, and the plate collects them.',
      'Heater, cathode and plate in a vacuum already make a working tube, a diode. The control grid is what lets a small signal steer that flow.',
      'The screen grid and the suppressor came later, to fix side effects of the grids before them.',
    ],
    tryThis: [
      'Tap CONTROL GRID: CURRENT jumps from METERED to WIDE OPEN. Full current flows, but nothing is left to shape it into a signal.',
      'Tap GLASS: VACUUM goes dark with it. EMISSION stays ON, but CURRENT reads NONE. In air, electrons keep hitting gas molecules and barely get anywhere.',
      'If SHOW ALL is showing, tap it, then tap HIDE ALL. Add the parts back in build order and read what each one fixes in the line below the drawing.',
    ],
  },

  // ── 2 · Electron flow ───────────────────────────────────────────────────
  flow: {
    intro: {
      learning: 'Why a tube needs heat before it passes any current: a hot cathode boils off electrons and the plate collects them. That’s why tube gear needs warm-up time.',
      start: 'Slide WARM-UP slowly from 0% to 100%. Watch STAGE climb through its steps, and note where PLATE I first moves off 0%.',
    },
    seeing: [
      'You’re watching one tube warm up, slowed down: the heater glows, an electron cloud gathers around the cathode, then streams to the plate. Real electrons are invisible, countless and far faster.',
      'HEAT shows how warm the heater is. STAGE shows the warm-up step, 1 to 5. PLATE I is the plate current, as a share of full.',
      'The numbered line below the drawing describes each step, from 1 · Cold to 5 · Steady current.',
    ],
    control: [
      'Slide the WARM-UP fader (0–100%) to set how hot the heater is. Its readout adds cold, warming… or conducting.',
      dockTail('WARM-UP'),
    ],
    changes: [
      'Below 15% the heater is cold and nothing moves.',
      'As it warms, the cathode boils off electrons (thermionic emission) and the positive plate collects them. At first it’s a trickle too small to read: PLATE I 0%.',
      'Above 70%, emission climbs and PLATE I with it, to 100% at full heat. The cathode now makes more than the plate takes. The extra waits as a cloud (space charge), and the plate voltage sets the current.',
    ],
    teaches: [
      'No heat, no electrons, no current, no sound. That’s why tube gear needs time to warm up before it works properly.',
      'Thermionic emission: a hot cathode releases electrons, and a positive plate pulls them across.',
      'Why the vacuum matters: electrons fly freely only because nothing is in their way.',
    ],
    tryThis: [
      'Slide WARM-UP to 50%: STAGE shows step 3 and PLATE I stays 0%. Electrons are boiling off, but the trickle reaching the plate is too small to read.',
      'Push WARM-UP past 85%: the line reaches 5 · Steady current and PLATE I passes 50%. At 100%, PLATE I reads 100%.',
      'Slide back below 70%: PLATE I drops to 0%, even though the heater still glows.',
    ],
  },

  // ── 3 · The control grid ────────────────────────────────────────────────
  grid: {
    intro: {
      learning: 'How the control grid works: its negative field pushes electrons back, so a very small grid voltage controls a much larger plate current. That is amplification.',
      start: 'Set GRID V to 50% and read PLATE I. Slide to 75% and compare. Then slide below 15% and watch GRID read CUT OFF.',
    },
    seeing: [
      'You see the cathode, the control grid and the plate. Electrons stream from the cathode to the plate through the gaps in the grid.',
      'GRID reads CUT OFF, PARTIAL or FULL FLOW. PLATE I is the plate current, as a share of full.',
      'Below the drawing, CHECK YOURSELF asks how the grid does its job.',
    ],
    control: [
      'Slide the GRID V fader (0–100%) to set the grid’s voltage. 0% is the most negative, 100% the least. Its readout adds cut off — no current flows, partly negative, or barely negative — full flow.',
      'Tap ⚡ E-VIEW to add the grid’s repelling field lines.',
      dockTail('GRID V'),
    ],
    changes: [
      'The grid sits slightly negative. Electrons are negative too, so its field pushes them back toward the cathode.',
      'Lower GRID V (more negative) means a stronger push and less PLATE I. At 15% and below the tube is cut off, and PLATE I reads 0%.',
      'Raise it and the stream swells, faster than the voltage rises, to 100% at the top. The grid wires never move: the field does the work.',
    ],
    teaches: [
      'Amplification: a very small voltage at the grid controls a much larger current through the tube.',
      'The grid works through its electric field, not by blocking electrons like a shutter.',
      'Plate current doesn’t follow grid voltage in a straight line: just above cutoff it grows slowly, then faster as the grid gets less negative.',
    ],
    tryThis: [
      'Start at 50%: PLATE I reads 26%. Slide to 75%: it reads about 59%. That’s more than double the current for a quarter of the fader’s travel.',
      'Slide below 15%: GRID reads CUT OFF and PLATE I reads 0%.',
      'Turn on ⚡ E-VIEW and ride GRID V down: the field arrows grow longer as the grid goes more negative.',
    ],
  },

  // ── 4 · Signal amplification ────────────────────────────────────────────
  amplify: {
    intro: {
      learning: 'How one tube stage amplifies: a small signal at the grid steers a large current, a resistor turns it into a large voltage, and the output comes out upside-down.',
      start: 'Watch the grid dots and the electron stream inside the glass pulse together. Then pick one moment and compare the input wave with the output wave: where one is up, the other is down.',
    },
    seeing: [
      'This is one small tube stage. A small input wave rides a blue wire into the grid at the left; a large wave leaves the plate on an amber wire at the right.',
      'Inside the glass, the grid dots pulse with the input, and the cathode-to-plate electron stream thickens and thins with them.',
      'Compare IN GRID with OUT PLATE: at GAIN ~×7, the output is drawn about seven times taller; real preamp stages often give far more.',
    ],
    control: [
      'There’s nothing to adjust here. This screen is a picture to watch.',
      'TUBE REF › opens the Tube Reference library, and ⤢ FULL SCREEN enlarges the drawing.',
    ],
    changes: [
      'Your signal never touches the big current. It wiggles the grid, and the grid controls the much larger stream.',
      'Grid up, more current; grid down, less. That current flows through a resistor, so the plate voltage swings with it: a large copy of the input.',
      'The copy is upside-down, because more current makes the plate voltage drop. Most real tube stages flip the signal this way.',
    ],
    teaches: [
      'How a tube amplifies: a small signal controls a large current, and a resistor turns that current into a large voltage.',
      'Why one tube stage turns the signal upside-down: more current through the resistor leaves less voltage at the plate.',
      'Most tube mic preamps, guitar amps and compressors are built from stages like this one.',
    ],
    tryThis: [
      'Watch the grid dots swell and the electron stream thicken together. The small input is letting more current through.',
      'Pick one moment and look straight across both graphs: where the input is up, the output is down.',
      'Tap ⤢ FULL SCREEN: the blue wire ends at the grid, and the amber wire leaves from the plate at the top.',
    ],
  },

  // ── 5 · Why high voltage ────────────────────────────────────────────────
  highv: {
    intro: {
      learning: 'Why tube circuits run at hundreds of volts: a strong plate voltage pulls a dense electron stream and leaves headroom, room for a big signal to swing.',
      start: 'Open SUPPLY and choose HIGH-VOLTAGE SUPPLY (B+). Watch PULL and STREAM change, then switch back to SMALL SUPPLY and compare the arrows.',
    },
    seeing: [
      'You see the cathode and the plate, with the plate’s pull drawn as arrows. Longer arrows and more electrons crossing mean a stronger pull.',
      'SUPPLY reads SMALL or B+ HIGH, PULL reads WEAK or STRONG, and STREAM reads SPARSE or DENSE.',
    ],
    control: [
      'Open the SUPPLY key and choose SMALL SUPPLY or HIGH-VOLTAGE SUPPLY (B+). The tray stays open, so you can switch back and forth and watch the drawing react.',
      dockTail('SUPPLY'),
    ],
    changes: [
      'A small plate voltage makes a weak field. Few electrons cross, and slowly: there’s too little current, and no room for a big signal to swing.',
      'Hundreds of volts on the plate, the B+ supply, sweep the cloud across: a dense, fast stream with headroom (room to swing).',
      'PULL and STREAM follow SUPPLY because the field’s strength sets the current.',
    ],
    teaches: [
      'Why tube circuits run at hundreds of volts: the plate needs a strong field to pull enough current and leave headroom.',
      'Safety: the B+ supply and its filter capacitors hold a charge that can kill, even after the amp is unplugged.',
      'Servicing, measuring and biasing a tube amp are work for a qualified technician.',
    ],
    tryThis: [
      'Switch SUPPLY to HIGH-VOLTAGE SUPPLY (B+): PULL reads STRONG and STREAM reads DENSE.',
      'Switch back to SMALL SUPPLY and compare the arrow lengths and the number of electrons crossing.',
    ],
  },

  // ── 6 · Tube types ──────────────────────────────────────────────────────
  types: {
    intro: {
      learning: 'Why there are three main tube types: each adds one grid to fix the last one’s weakness, from the triode to the tetrode’s screen grid and the pentode’s suppressor.',
      start: 'Open TYPE and step from TRIODE · 1 GRID to TETRODE · 2 GRIDS to PENTODE · 3 GRIDS. Watch NEW name the grid each type adds, and read its strength and weakness below.',
    },
    seeing: [
      'You see the tube cut open as a TRIODE, TETRODE or PENTODE. The newest grid glows in its own color. In ⚡ E-VIEW, red dots are secondary electrons, knocked off the plate.',
      'TYPE and GRIDS (1, 2 or 3 GRIDS) name the tube. NEW names the grid this type adds: G1 CONTROL, G2 SCREEN or G3 SUPPR.',
      'Below: ADDS says what the new grid is, then the type’s strength and its weakness.',
    ],
    control: [
      'Open the TYPE key: TRIODE · 1 GRID, TETRODE · 2 GRIDS or PENTODE · 3 GRIDS. Each option shows that type’s strength, and the tray stays open while the drawing rebuilds.',
      'Tap ⚡ E-VIEW to see the electron cloud and its flow instead of the physical drawing.',
      dockTail('TYPE'),
    ],
    changes: [
      'TRIODE: one control grid. Simple and linear, but the plate’s field reaches back through the grid, limiting gain.',
      'TETRODE: a positive screen grid shields the control grid and speeds the stream. But when the plate’s voltage swings below the screen’s, electrons knocked off the plate (red) are stolen by the screen.',
      'PENTODE: a suppressor grid beside the plate turns those strays back to the plate.',
    ],
    teaches: [
      'Each tube type adds one grid to fix the weakness of the type before it.',
      'Why the triode is the classic preamp tube and the pentode a classic output tube.',
      'Many power tubes in the Tube Reference are beam tetrodes: beam-forming plates turn the strays back instead of a third grid.',
    ],
    tryThis: [
      'Turn on ⚡ E-VIEW, then step from TRIODE to TETRODE: red dots appear. They’re secondary electrons, knocked off the plate and stolen by the screen grid.',
      'Step to PENTODE: NEW reads G3 SUPPR, and the red dots now die at the suppressor grid.',
      'Turn ⚡ E-VIEW off and step through the three types again: the newest grid glows in its own color each time.',
    ],
  },

  // ── 7 · Bias ────────────────────────────────────────────────────────────
  bias: {
    intro: {
      learning: 'What bias is: the resting point on the tube’s curve that the signal swings around, and why too negative or too positive flattens one side of the wave.',
      start: 'Slide BIAS to the far left and watch ZONE and the bottom of the output wave. Then slide to the far right, and finish back at 50%.',
    },
    seeing: [
      'On the left is a transfer curve: grid voltage in, plate current out. A dot rides it to mark the idle point.',
      'On the right is the plate current that results, drawn right way up — not the flipped plate voltage you saw in Signal Amplification.',
      'BIAS shows the idle point. ZONE reads CUTOFF, LINEAR or SATURATION.',
      'Below: the zone in words, why biasing a real amp is technician work, and CHECK YOURSELF.',
    ],
    control: [
      'Slide the BIAS fader (0–100%) to set where the tube idles with no signal. Its readout adds too negative, correct or too positive, and turns red outside the safe middle.',
      dockTail('BIAS'),
    ],
    changes: [
      'Bias sets where on the curve the tube rests. The signal swings up and down around that point.',
      'Below 22% (too negative), the stream shuts off for part of the swing, so the bottom of the wave flatlines: CUTOFF.',
      'Above 80% (too positive), the top hits the ceiling and flattens: SATURATION. In between, the whole swing rides the straight part: LINEAR.',
    ],
    teaches: [
      'Bias is the idle point. It decides whether the whole wave is amplified cleanly.',
      'Too negative flattens the bottom of the wave; too positive flattens the top.',
      '“Biasing an amp” after a tube change means setting that idle point inside a live chassis at lethal voltage. It’s work for a qualified technician.',
    ],
    tryThis: [
      'Slide BIAS to the far left: ZONE reads CUTOFF and the bottom of the output wave flatlines.',
      'Slide to the far right: ZONE reads SATURATION, and now the top flattens instead.',
      'Bring it back to 50%: ZONE reads LINEAR and the whole wave returns.',
    ],
  },

  // ── 8 · Saturation ──────────────────────────────────────────────────────
  sat: {
    intro: {
      learning: 'What “tube sound” mostly is: soft clipping. Pushed hard, a tube rounds its peaks instead of chopping them off, adding low, gentle harmonics that blend with the note.',
      start: 'At DRIVE 20%, compare the input and output waves. Then slide past 30% and past 70%, watching STATE and the peaks of the output wave.',
    },
    seeing: [
      'On the left, the tube’s transfer curve sits against a straight dashed line, the ideal. On the right are the input wave and the output wave.',
      'DRIVE shows how hard the tube is pushed. STATE reads CLEAN, WARMING or SATURATED.',
    ],
    control: [
      'Slide the DRIVE fader (0–100%) to set the signal level into the tube. Its readout adds clean — straight-line region, warming — peaks rounding, or saturated — soft clipping.',
      dockTail('DRIVE'),
    ],
    changes: [
      'Low DRIVE: the wave rides the straight middle of the curve and comes out the same shape.',
      'More DRIVE: the peaks reach the bend. The tube can only open so far, so each extra bit of input buys less output, and the peaks round over.',
      'Rounding (soft clipping) adds mostly low, gentle harmonics: extra tones at whole-number multiples of the note’s frequency. Hard clipping shears peaks flat and adds harsh high ones.',
    ],
    teaches: [
      '“Tube sound” is mostly soft clipping: peaks rounded, not chopped off.',
      'Harmonics are extra tones at whole-number multiples of a note’s frequency. Low ones blend with the note; strong high ones sound harsh.',
      'Rounding the peaks also squeezes the loudest moments, a gentle kind of compression.',
    ],
    tryThis: [
      'At the start (20%), STATE reads CLEAN: the input and output waves have the same shape.',
      'Slide past 30%: STATE reads WARMING and the output peaks begin to round.',
      'Push past 70%: STATE reads SATURATED, and the left plot shows the swing reaching into the bend.',
    ],
  },

  // ── 9 · Tube vs transistor ──────────────────────────────────────────────
  versus: {
    intro: {
      learning: 'How a tube and a transistor do the same job, a small signal controlling a large one, with different physics, and why each still has its place.',
      start: 'Compare the transistor at TRUE SIZE with the tube beside it. Then look at ENLARGED · CUT OPEN and follow the blue pulses up the middle leg.',
    },
    seeing: [
      'On the left, a tube: electrons crossing a vacuum. On the right, a transistor at TRUE SIZE, and ENLARGED · CUT OPEN, with carriers (moving charges) crossing its junctions.',
      'In the transistor, blue pulses climbing the middle leg are the small base current that controls the flow.',
      'Read TUBE VACUUM and TRANSISTOR JUNCTION, then compare the two side by side below.',
    ],
    control: [
      'There’s nothing to adjust: this screen is a picture to compare. TUBE REF › opens the Tube Reference library, and ⤢ FULL SCREEN enlarges the drawing.',
      'FINISH › on the strip, or FINISH · SEE WHAT’S LEFT › at the end of the reading, opens the list of modules you haven’t opened yet.',
    ],
    changes: [
      'Both do the same job, a small signal controlling a large one, with different physics.',
      'Tube: an electron cloud crosses a vacuum, controlled by a grid’s field, at hundreds of volts. It glows, needs warm-up and wears out.',
      'Transistor: carriers (moving charges) cross semiconductor junctions, controlled by a tiny base current, at a few volts. It’s instant-on, tiny and long-lasting.',
    ],
    teaches: [
      'Why transistors won on size, cost and reliability, and why tubes survive where their soft overload is the sound.',
      'Neither is simply “better”: you choose by the job.',
      'Every amplifier, tube or transistor, works the same way: a small signal steers a large current that comes from the power supply.',
    ],
    tryThis: [
      'Compare the true-size transistor with the tube beside it, then look inside the cut-open view.',
      'Follow the blue base pulses up the middle leg to the thin blue base layer: the small current in control.',
      'Find the controlling signal in each drawing: the grid’s field in the tube, the blue base current in the transistor.',
    ],
  },
};

/** The what's-left screen (LabEndScreen, mode "progress", noun "section"). */
export const TUBE_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the tube story: parts, warm-up, the grid, gain, high voltage, tube types, bias, saturation and transistors, and the core ideas the lab’s check asks about.',
    start: 'Open any module still listed under WHAT’S LEFT, or tap the CHECK row and answer CHECK YOUR UNDERSTANDING. Use REVIEW ▾ to reopen a module you found hard.',
  },
  seeing: [
    'WHAT’S LEFT lists the modules you haven’t opened yet. Last on the list is the CHECK row. LAB COMPLETE appears once every module is opened and the check is passed.',
    'Opened modules, and the check once passed, fold into one ✓ DONE row. REVIEW ▾ lists them. CHECK YOUR UNDERSTANDING holds the lab’s short quiz.',
  ],
  control: [
    'Tap a module’s row to open it. Tap the CHECK row to scroll this screen up to the check.',
    'Answer the CHECK YOUR UNDERSTANDING questions. A wrong pick explains itself and lets you try another.',
    'PRACTICE AGAIN FROM THE START opens What’s Inside. It never clears what you’ve done.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A module counts once you open it, and its row moves from the list to the ✓ row.',
    'The check counts once every answer is right, and it stays passed when you practice again.',
    'If your progress can’t be read, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'The core ideas: what warm-up does inside a tube, and how the grid’s voltage changes the electron stream.',
    'Also what bias sets, how a tube distorts when pushed past its straight region, and why a switched-off tube amp can still be dangerous inside.',
  ],
  tryThis: [
    'Before the check, open the first module still on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard, such as Tube Bias or Tube Saturation.',
  ],
};

/** The Tube Reference list (TubeReferenceScreen). */
export const TUBE_REFERENCE_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The common audio tubes grouped by job: preamp triodes, power tubes, directly-heated triodes and rectifiers, and why one tube can go by several names.',
    start: 'Type ECC83 in the search box and see which row stays. Clear it with ✕, then try rectifier, then octal.',
  },
  seeing: [
    'This is the Tube Reference library: 40 tubes in four families — PREAMP & SMALL-SIGNAL TRIODES, POWER PENTODES & BEAM TETRODES, DIRECTLY-HEATED TRIODES and RECTIFIERS.',
    'Each row gives the card number, the tube’s name with its other names and related tubes, its job and its base (the socket it plugs into).',
    'An equivalent is the same tube. A “family” tube is a close relative, not always a direct swap.',
  ],
  control: [
    'Type in the search box: a name (12AX7), an equivalent (ECC83), a base (octal) or a job (rectifier). ✕ clears it.',
    'Tap a row to open that tube’s two-page card. A locked row explains how to open it.',
    '‹ takes you back to the lab.',
  ],
  changes: [
    'The list filters as you type, and a family with no match disappears.',
    'Families group tubes by job or construction. Preamp triodes give voltage gain up front. Power tubes drive the output transformer. Directly-heated triodes use the filament as the cathode. Rectifiers turn AC into DC for the B+ supply.',
  ],
  teaches: [
    'The jobs tubes do in audio gear: small-signal gain, output power and the DC supply, each with its own family.',
    'One tube can go by several names: 12AX7, ECC83 and 7025 are the same tube.',
    'Card ratings come from published data sheets; check them against your amp’s own manual. Tube amps hold deadly voltages even unplugged. Only a qualified technician should work inside one.',
  ],
  tryThis: [
    'Search ECC83: only the 12AX7 row is left. It’s the same tube under its European name.',
    'Search rectifier: only the RECTIFIERS family is left.',
    'Search octal: every tube on the 8-pin octal base is listed.',
  ],
};

/** One tube's reference card (TubeCardScreen, the card view). */
export const TUBE_CARD_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How to read one tube’s card: its structure, pin layout, key ratings and safe substitutions, and why a study card never replaces the maker’s data sheet.',
    start: 'Read PAGE 1, then tap PAGE 2. Double-tap the card to zoom in on the pin layout, and use › at the top right to step to the next tube.',
  },
  seeing: [
    'This is one tube’s full-screen reference card: its structure, pin layout, key ratings, safe substitutions and what to watch for.',
    'The top bar shows the tube’s number and name, with its family below. Beside the page buttons is a short category: Preamp Triode, Power Output, Directly-Heated Triode or Rectifier.',
  ],
  control: [
    'PAGE 1 and PAGE 2 switch between the card’s two pages. ‹ and › at the top right step to the previous or next tube.',
    'Swipe the card sideways to flip pages in reading order: page 1, page 2, then the next tube.',
    'Pinch to zoom (up to 4×), double-tap to zoom in or back out, and drag to move around a zoomed card. Swiping works only when the card isn’t zoomed.',
    '‹ at the top left goes back to the tube list. RETRY reloads a card that didn’t load.',
  ],
  changes: [
    'Each card loads over your connection; LOADING shows while it arrives.',
    'Zoom in to read the small print, such as pin numbers and ratings, without changing page.',
  ],
  teaches: [
    'The pin layout shows which pin goes to each part: heater, cathode, grids and plate. The ratings show the limits the tube is built for.',
    'Which tubes can stand in for this one; a “family” tube isn’t always a direct swap.',
    'A card is a study reference, not a data sheet: ratings vary by maker and production run. Use the maker’s own data sheet for anything you build, service or power up.',
  ],
  tryThis: [
    'Tap PAGE 2, then swipe left: the next tube opens on its page 1.',
    'Double-tap the card to zoom in, drag to read the pin layout, then double-tap to zoom back out.',
  ],
};
