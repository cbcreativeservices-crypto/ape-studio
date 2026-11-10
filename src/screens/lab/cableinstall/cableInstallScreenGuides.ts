/**
 * Cable Dressing & Installation Lab — "explain this screen" content (owner
 * 2026-10-31, the Screen Guide roll-out; waveScreenGuides.ts is the standard).
 * One guide per stage (keyed by CiModuleId), plus the lab's own screens: the
 * intro (home), the Rule-or-Myth card between stages, the end screen
 * (what's left / complete) and the field check.
 *
 * Every line was written against the stage's own code (scenes/*, data/*,
 * engine/*): the names are the on-screen names (section titles, keys, chips,
 * readout words), and every number quoted in TRY THIS is what the screen
 * prints at that setting — route scores from engine/routeEval (rankRoutes),
 * bend readouts from MechScene's radiusDia/fmtDia (start 0.95, − EASE = −0.08),
 * exposure bands from EmiScene's exposureFor, spans from the SupportsScene and
 * CeilingScene spacing checks, coil twist from FloorScene's sign sum. Change a
 * stage's labels, data or formulas → update its guide here;
 * test/screenGuide_cableinstall_20261031.test.ts pins the shape.
 *
 * STEPPED: each section is one step and fits a 375×812 phone with no
 * scrolling — held to SCREEN_GUIDE_BUDGET (types.ts). Only Stage 11 (fire)
 * is a Rack Unit; every other screen is a scrolling page, so its steps sit in
 * a bottom card.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no gear brand names; no "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { CiModuleId } from './registry';

/** The intro (step 0). */
export const CI_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Why professional cable installation is a chain of decisions, from route and support to separation, labels and inspection, and that every rule has a named source.',
    start: 'Watch the drawing install itself, from the stage box to the rack, and follow the power feed. Open WHAT YOU’LL LEARN, then tap START LAB.',
  },
  seeing: [
    'This is the lab’s opening screen. Watch the drawing install a whole job: stage box, a floor run under a protector, wall raceway, conduit, ceiling tray and rack.',
    'Find the power feed. It runs on its own path, kept apart from the signal cables; Stage 10 shows why.',
    'Below the drawing you read what professional installation involves. Local codes always govern the real job.',
  ],
  control: [
    'Tap the big button to open the first stage you haven’t finished. It reads START LAB while that is Stage 1, otherwise RESUME — MODULE and its number. With every stage done, START LAB reopens Stage 1.',
    'WHAT YOU’LL LEARN opens or closes the objectives. SOURCES / STANDARDS › lists the codes and standards this lab draws on.',
    'In the strip under the title, ‹ PREV and NEXT › step between stages. Tap its middle for the stage list, with WHAT\'S LEFT at the end.',
    'Every stage is open at any time. Tap ⓘ on any stage to have that screen explained.',
  ],
  changes: [
    'Each stage is one step of the job, tagged above its title: WHY, KNOW, PLAN, PROTECT, SUPPORT, DRESS, WALLS, OVERHEAD, FLOOR, SIGNAL, BUILDING, IDENTIFY, then FINAL · INSPECT.',
    'Each builds on the ones before: you know the cable, plan its route, protect, carry and dress it, then label it and inspect the whole job.',
    'Between stages, a RULE OR MYTH? card may test a common job-site belief.',
  ],
  teaches: [
    'Installation is a chain of decisions — route, support, protection, separation, identity, inspection — not neat-looking wire.',
    'Every rule has a source, and each verdict names it: CODE / REGULATION, INDUSTRY STANDARD, MANUFACTURER REQUIREMENT or PROFESSIONAL PRACTICE.',
    'What a cable carries, which you met in the two connector labs, decides how it must be routed, protected and kept apart.',
  ],
  tryThis: [
    'Watch the opening drawing to the end: every run follows a real pathway, and the power feed arrives on the far side, away from signal.',
    'Open WHAT YOU’LL LEARN and read the six objectives — the FINAL inspection draws on every one.',
    'New to installation? Take the stages in order — each one adds the next step of the job.',
  ],
};

export const CI_SCREEN_GUIDES: Record<CiModuleId, ScreenGuide> = {
  // ── STAGE 1 · WHY ─────────────────────────────────────────────────────────
  why: {
    intro: {
      learning: 'Why a neat-looking install can still be wrong: an installation is judged on safety, reliability, signal, service, protection and workmanship together.',
      start: 'Open all six cards under SIX THINGS RIDING ON EVERY RUN. Then study the four close-ups and approve the one you would sign off.',
    },
    seeing: [
      'SIX THINGS RIDING ON EVERY RUN: what every cable run puts at stake — SAFETY, RELIABILITY, SIGNAL INTEGRITY, SERVICEABILITY, MECHANICAL PROTECTION, PROFESSIONAL WORKMANSHIP.',
      'WHICH INSTALLATION WOULD YOU APPROVE? shows four close-ups: A — THE SHOWPIECE, B — THE PROFESSIONAL, C — THE PILE, D — THE BLOCKADE.',
      'After a pick, each close-up shows its verdict and the NEAT ≠ CORRECT card appears.',
    ],
    control: [
      'Tap a consequence card to open it; a ✓ marks it read.',
      'Tap a close-up’s name, drawing or caption to approve it. FULL SCREEN enlarges the drawing, with its APPROVE button underneath.',
      'Under each verdict, ▸ WHY? opens the reason; the colored tag opens the sources behind it.',
      'After a wrong pick only B stays tappable. Open all six cards and approve B to finish the stage. Approved B first? Open the rest, then tap MARK STAGE COMPLETE ✓.',
    ],
    changes: [
      'A looks best, but its ties are cinched so hard the cables go oval. Crushing damages a cable inside before the outside shows it.',
      'D is tidy but dressed across the vent grille and service panel: heat builds up and nobody can reach the gear.',
      'C has nothing supported or traceable. B is plainer: gentle bends, labeled ends, supported weight, reachable connectors.',
    ],
    teaches: [
      'Neat is not the same as correct: an install is judged on safety, reliability, signal, service, protection and workmanship together.',
      'Appearance follows from doing those six right — it never replaces them.',
      'Damage you can’t see still counts: a crushed cable or a blocked vent fails later, after the job already looks finished.',
    ],
    tryThis: [
      'Make your call, then read A’s verdict: restraints cinched so tight they deform every cable in the loom. The neatest close-up is not the one to sign off.',
      'After your first pick, every close-up shows its verdict. Read D’s: tidy in the wrong place, over cooling and service access, is still wrong.',
      'Under B’s verdict, tap the colored tag to see which kind of authority stands behind that rule.',
    ],
  },

  // ── STAGE 2 · KNOW ────────────────────────────────────────────────────────
  know: {
    intro: {
      learning: 'Why the installation method follows the cable: what it carries, how long it stays, where it runs and what can damage it.',
      start: 'Tap Microphone cable, then Fiber-optic cable, and compare their CHECK BEFORE ROUTING lists. Then start SCENARIO DRILL — WHAT ARE YOU INSTALLING? below.',
    },
    seeing: [
      'THE CABLE WORKBENCH holds 14 cable types, each with a color swatch and PERMANENT, TEMPORARY or PERM · TEMP.',
      'Open a card to see the cable cut back in a photo, a SECTION drawing, what it carries, and its CHECK BEFORE ROUTING list.',
      'SCENARIO DRILL — WHAT ARE YOU INSTALLING?: three real runs, four calls each. The colors are training tints; real cable colors vary.',
    ],
    control: [
      'Tap a cable’s name to open or close its card; a ✓ marks it read. Browsing is free and not scored, but the drill below draws on it.',
      'For each run in the drill, answer 1 · WHAT CABLE IS THIS?, 2 · TEMPORARY OR PERMANENT?, 3 · THE LIKELY PATHWAY? and 4 · THE KEY RISK?',
      'Each answer locks when you make it; the next question opens under its verdict.',
      'Answer all three runs to finish the stage. Its score comes from your own calls.',
    ],
    changes: [
      'Each verdict names the right cable and what it carries, so a wrong call still shows the answer.',
      'After the four calls, THEN THE PAPERWORK shows your score on that run and the records it needs.',
      'The same signal can need different methods: a one-night snake rides the floor; a permanent line lives in a building pathway.',
    ],
    teaches: [
      'Installation method follows cable type and use: what it carries, how long it stays, where it goes, what can hurt it.',
      'Mic lines carry tiny signals that pick up noise; snakes face traffic; crushing spoils a data cable’s pair geometry (the even twist of each wire pair).',
      'Every run needs its records as well as its route: the paperwork is part of knowing what you installed.',
    ],
    tryThis: [
      'Open Microphone cable, then Fiber-optic cable: compare their CHECK BEFORE ROUTING lists — different cables, different worries.',
      'For the one-night concert run, answer 2 · TEMPORARY OR PERMANENT? and read the verdict: temporary changes the solutions, not the standard of care.',
      'For the permanent network run, watch THE KEY RISK: pair geometry, spoiled by crushing and over-tension (pulling too hard).',
    ],
  },

  // ── STAGE 3 · PLAN ────────────────────────────────────────────────────────
  route: {
    intro: {
      learning: 'Why the shortest cable route is often not the best one: safety, protection, pathway quality and future service all count, and length barely does.',
      start: 'Switch to X-RAY to see the runs hidden in walls and above the ceiling. Then read the three route cards and tap the one you would pull.',
    },
    seeing: [
      'You’re planning two installations, each a building section drawn to scale (FULL SCREEN adds the badge Scale: 20 units = 1 m · person 1.75 m). CABLE: names what is pulled.',
      'Three candidate routes, A, B and C, each in its own color. Each route card gives its path and relative length (×1.0 = shortest).',
      'After a pick: THE VERDICT — ALL THREE ROUTES, SCORED — six score bars and an overall /100 for each route.',
    ],
    control: [
      'FINISHED shows the space as people see it, hidden runs dashed. X-RAY strips the surfaces: in-wall and above-ceiling runs draw solid.',
      'WHICH ROUTE DO YOU PULL?: tap a route card (or PULL A, B or C in full screen). The pick locks for that installation.',
      'Under the verdict: each flag on your route, with ▸ WHY? and its source tag.',
      'Decide both installations to finish the stage; its score averages the two routes you chose.',
    ],
    changes: [
      'Each route starts at 100 in every area and loses points for its flags: a public walkway, another trade’s space, sharp edges, motor loads.',
      'Length barely counts — only past 1.5× the shortest does it cost a little workmanship.',
      'A serious safety flag earns ✕ REJECTED — SAFETY, whatever the overall number. Your pick installs itself; the others fade back.',
    ],
    teaches: [
      'The shortest route is not always the best route: safety, protection, pathway quality and future service count too.',
      'Cable belongs in pathways built for it — not another trade’s space, a floor or a ceiling grid.',
      'Plan for the cable’s whole life, not the pull day: the runs hidden in walls and ceilings are the hardest to reach later.',
    ],
    tryThis: [
      'After your stage-to-rack pick, read THE VERDICT: Across the hallway floor (×1.0, the shortest) finishes LAST at 62/100, with ✕ REJECTED — SAFETY.',
      'Before you pick, switch to X-RAY: the runs inside the wall and above the ceiling draw solid — the parts nobody sees later.',
      'After your amp-room pick: the shortest, over the ceiling grid, scores 63/100 — and the duct route, at 78/100, is rejected too.',
    ],
  },

  // ── STAGE 4 · PROTECT ─────────────────────────────────────────────────────
  mech: {
    intro: {
      learning: 'Why every cable has its own minimum bend, pulling limit and safe strap tension, and how a cable is damaged inside before the outside shows it.',
      start: 'On the coax card, tap − EASE until the bend clears the dashed arc, then tap CHECK BEND. Then try each pull event and watch the tension meter.',
    },
    seeing: [
      'A · BEND RADIUS: one corner, four cables — mic, twisted-pair data, coaxial, fiber-optic — each with its own SIMULATED SPEC card.',
      'The drawing shows the bend; a dashed arc marks the spec minimum. A bend that’s too tight glows red with a strain mark.',
      'B · PULLING: a tension meter on a relative scale, 0 to 150, limit at 100. C · RESTRAINT: a strap on a four-cable bundle, in zone LOOSE, SECURE or EXCESSIVE.',
    ],
    control: [
      'Use each cable’s BEND TIGHTNESS fader, or − EASE / + TIGHTEN (each tap about 1.5 diameters). The readout gives the bend in cable diameters, then the spec.',
      'CHECK BEND tests that cable against its spec; it reads MEETS SPEC ✓ when it passes.',
      'Try each pull event: Steady smooth pull, Pull harder through the snag, Hard yank around the corner, Pull it through by the connector.',
      'Set the strap with the STRAP TENSION fader, or SET LOOSE, SET SECURE, SET EXCESSIVE.',
      'The stage is done when all four bends meet spec, you’ve tried all four pulls and the strap sits at SECURE.',
    ],
    changes: [
      'Every cable starts too tight on a first run (about 2 diameters): you see the failure.',
      'Simulated specs: mic ≥ 6×, data ≥ 4×, coax ≥ 10×, fiber ≥ 15×; real limits come from each cable’s documents. Same corner, different spec.',
      'A snag spikes tension to 140; a yank, 120. Pulling by the connector reads 80 but loads the termination (where cable meets connector).',
      'Over-tight straps crush cables oval, inside first.',
    ],
    teaches: [
      'Bend, tension and restraint limits belong to each specific cable, so you check its documentation first.',
      'Pull with steady force on the cable, never the connector; stop and clear a snag instead of pulling harder.',
      'Ties are not banned: a restraint must hold the bundle without crushing it.',
    ],
    tryThis: [
      'From the first-run start, tap − EASE five times on the coax card: about 9.5× — under its ≥ 10× spec. One more tap gives about 11×, and CHECK BEND passes.',
      'Tap Pull it through by the connector: the meter reads 80, under the limit, and the verdict still flags it. The force lands on the termination.',
      'Tap SET EXCESSIVE: the zone reads EXCESSIVE and the cables ovalize. Ease STRAP TENSION back into SECURE.',
    ],
  },

  // ── STAGE 5 · SUPPORT ─────────────────────────────────────────────────────
  supports: {
    intro: {
      learning: 'Why cable hangs only on purpose-built supports fixed to structure, and why sag grows with the square of the gap between supports.',
      start: 'Read the four cards in A · FOUR JOBS, then work through B · THE SORT. In C · SUPPORT SPACING, place one J-hook at P3 and watch the sag.',
    },
    seeing: [
      'A · FOUR JOBS shows SUPPORT, PATHWAY, PROTECTION and MANAGEMENT, each card with a hardware drawing.',
      'B · THE SORT shows 17 items, one at a time: would you hang cable on this? A photo of the real thing follows your call.',
      'C · SUPPORT SPACING is a 12-unit span with five candidate positions. The cable sags live between supports, under a MAX SAG ½ UNIT line.',
    ],
    control: [
      'In the sort tap APPROVE or REJECT, then NEXT ITEM › (FINISH SORT › on the last). Approved hardware shows the jobs it does.',
      'You pass the sort with 14 correct. After the last item: RETRY THE SORT, or RUN THE SORT AGAIN once passed.',
      'In the spacing exercise tap P1 to P5 (2u to 10u) to place or remove a J-hook (a hook-shaped support fixed to structure), then CHECK SPACING.',
      'Pass the sort and meet the spacing spec to finish the stage.',
    ],
    changes: [
      'Sag grows with the square of the unsupported span: double the span, four times the dip. Past the limit the drawing shows its deepest dip and glows strained.',
      'The spec allows at most 4 units between supports; a longer span draws strained. Extra supports pass, but cost hardware.',
      'Pipes, tiles, grid wires and other systems’ conduit are rejected: they belong to another trade or hold up the ceiling.',
    ],
    teaches: [
      'Hardware is chosen by its job: supports carry weight, pathways set the route, protection blocks damage, management organizes.',
      'Cable rides only on purpose-built supports anchored to structure, spaced to the support system’s documents.',
      'Because sag grows with the square of the span, a small change in support spacing makes a big change in sag.',
    ],
    tryThis: [
      'Place one J-hook at P3 (6u) and watch, before any check: both 6-unit spans dip past the MAX SAG ½ UNIT line and glow strained.',
      'Swap it for P2 and P4 (4u, 8u) and tap CHECK SPACING: each span dips just to the line, and the verdict calls it the documented every-4-unit design.',
      'Then try P1, P3 and P5 (2u, 6u, 10u): it meets the 4-unit maximum too, with more hardware than the design needs.',
    ],
  },

  // ── STAGE 6 · DRESS ───────────────────────────────────────────────────────
  rack: {
    intro: {
      learning: 'Why a rack is dressed for the next service call: labels identify, managers hold, slack moves, airflow stays clear, and power stays apart from signal by plan.',
      start: 'In PHASE A — INSPECT, tap the amber rings or open ▸ SUSPECT LIST and find what’s wrong. Ten finds unlock PHASE B — DRESS.',
    },
    seeing: [
      'RACK is a rear view: patch panel between horizontal managers, switch, DSP (digital signal processor), interface, amplifier, power distribution, vertical managers.',
      'You work through four phases: PHASE A — INSPECT, PHASE B — DRESS, PHASE C — SERVICE, PHASE D — MAINTAIN.',
      'In Phase A amber rings mark places to inspect. A find shows ⚑, its rule and a FIX line, and a counter tracks finds.',
    ],
    control: [
      'A: tap a spot on the rack, or open ▸ SUSPECT LIST and go location by location. 10 finds unlock RACK CONDEMNED — NOW DRESS IT RIGHT ›.',
      'B: pick a group — AC POWER, ANALOG AUDIO, NETWORK, LOUDSPEAKER OUT, CONTROL, FIBER — then where it dresses: left or right vertical manager, top cable entry or horizontal manager. Reassign until it matches; each off-plan placement costs score.',
      'C: tap DSP INPUT 7 on the rack or in the input list, then REPLACE THIS CABLE ✓.',
      'D: choose an approach — STRIP THE RACK, CUT THE DRESSING, USE THE DRESSING or FORCE IT.',
    ],
    changes: [
      'In B each loom draws itself down the manager you choose. With all six placed, each shows ✓ or ✕ against THIS PROJECT\'S PLAN.',
      'Here signal dresses left, AC power and speaker outputs right. The side is a project choice; what matters is a plan that keeps classes apart for noise and tracing.',
      'In C the one cable lights from its A-007 label at the rack entry to the DSP; every other loom dims.',
    ],
    teaches: [
      'A rack is dressed for the service call: labels identify, managers hold, slack moves, airflow and access stay clear.',
      'Power and signal follow a plan that keeps them apart, which limits noise pickup and keeps each cable easy to trace.',
      'Good dressing turns a fault into one traced cable and a quick swap, without disturbing the cables that still work.',
    ],
    tryThis: [
      'Phase B opens after 10 finds. Read THIS PROJECT\'S PLAN before placing: AC POWER goes to the right vertical manager, away from the signal on the left.',
      'After the Phase C swap, read THE SAME JOB, BEFORE: the identical fault on the Phase A rack. Compare how much harder it is to find and fix there.',
      'In Phase D read all four approaches before you pick: only one frees the switch without disturbing the cables that still work.',
    ],
  },

  // ── STAGE 7 · WALLS ───────────────────────────────────────────────────────
  walls: {
    intro: {
      learning: 'Why you verify a wall before going through it, and how a door or a raw edge damages cable a little at a time, often unseen.',
      start: 'Start with 1 · SURFACE RACEWAY and pick a route to the wall device. At 2 · WALL PENETRATION, turn X-RAY WALL VIEW on before you choose.',
    },
    seeing: [
      'ROOM is one wall elevation: a rack, a wall device, baseboard raceway, a doorway and an unfinished opening.',
      'X-RAY WALL VIEW reveals studs and in-wall runs, and reminds you that no view shows a fire rating.',
      'You work through four short scenarios: 1 · SURFACE RACEWAY, 2 · WALL PENETRATION, 3 · THE DOORWAY, 4 · SHARP EDGE.',
    ],
    control: [
      'X-RAY WALL VIEW: ON / OFF switches the in-wall view.',
      '1: pick one of three raceway routes to the wall device.',
      '2: for each wall — ordinary, fire-rated, unknown — pick the action, then NEXT WALL ›.',
      '3: pick an answer for TEMPORARY (a two-day event) and for PERMANENT (a system that stays).',
      '4: pick the fix for the raw edge. You can correct a wrong pick, at a cost to the score. All four right completes the stage.',
    ],
    changes: [
      'The chosen raceway route installs itself; the rejected ones fade back.',
      'A threshold protector drops in and the pinched cable relaxes; a bushing straightens the folded cable at the raw edge.',
      'A door pinches cable thousands of times; a raw edge rubs with every small movement. The damage adds up, often unseen.',
    ],
    teaches: [
      'Verify a wall before penetrating it — unknown means unknown, never “probably ordinary”.',
      'A rated wall needs its listed penetration system; an ordinary one still gets a sleeve or bushing.',
      'At a doorway, temporary changes the solution, not the standard of care: a two-day run still needs protecting from the door.',
    ],
    tryThis: [
      'In scenario 2, turn X-RAY WALL VIEW on at the unknown wall: studs appear, but nothing shows a rating. Decide what you would need to know before you penetrate it.',
      'At 3 · THE DOORWAY, before you pick, weigh “Wedge the door open for the event”: if that door is a fire door, a wedge defeats it.',
      'At 4 · SHARP EDGE, weigh “Wrap the edge in tape and move on” against “Install a bushing / grommet on the opening”: tape creeps and quits; the edge stays.',
    ],
  },

  // ── STAGE 8 · OVERHEAD ────────────────────────────────────────────────────
  ceiling: {
    intro: {
      learning: 'Why cable above a suspended ceiling needs its own supports from structure, never the tiles, grid, pipes or ducts that belong to other systems.',
      start: 'With ABOVE CEILING · AS FOUND showing, tap the markers or open the SUSPECT LIST to find the problems. Six finds unlock CONTINUE TO THE INSTALL ›.',
    },
    seeing: [
      'CEILING is a cutaway of a suspended ceiling: deck, joists, hanger wires, grid and tiles, a duct, the sprinkler main, conduit, a light, a tray, J-hooks.',
      'ABOVE CEILING · AS FOUND shows a previous contractor’s work; FINISHED VIEW shows the same section done right.',
      'EXERCISE 1 · FIND THE PROBLEMS: eight marked defects. EXERCISE 2 · INSTALL THE ROUTE: a new run you place.',
    ],
    control: [
      'ABOVE CEILING · AS FOUND / FINISHED VIEW switches the view.',
      'Exercise 1: tap a marker, or open the SUSPECT LIST. 6 finds unlock CONTINUE TO THE INSTALL ›.',
      'Exercise 2: first 1 · PICK THE PATHWAY / SUPPORT, then 2 · PLACE J-HOOKS ON THE 12-UNIT SPAN. Tap U1 to U11; U0 and U12 are already in.',
      'Tap CHECK SPACING (it shows how many hooks are placed), then CONFIRM THE ROUTE ✓.',
    ],
    changes: [
      'Sag grows with the square of the unsupported span: a span over 4 units glows and dips below the dashed ½-unit sag line.',
      'With every span 4 units or less the run settles even. Confirming installs the bundle to the bushed wall sleeve.',
      'Tiles, grid, sprinkler pipe, lights and ducts belong to other systems. Loading them puts the cable and the building at risk.',
    ],
    teaches: [
      'Above the tiles is other people’s infrastructure: a cable gets its own supports from structure.',
      'Spacing comes from the supplied system spec, every tile must still lift, and service loops stay reachable.',
      'The space above a ceiling is hidden and shared, so a bad run there stays unseen until something fails or someone needs access.',
    ],
    tryThis: [
      'In Exercise 2 (after 6 finds and the pathway pick) place one hook at U6 and watch: both spans of 6 units dip below the dashed sag line.',
      'Swap U6 for U4 and U8 and tap CHECK SPACING: every span is 4 units or less, and CONFIRM THE ROUTE ✓ appears.',
      'After the finds, switch to FINISHED VIEW: the same section with every defect corrected.',
    ],
  },

  // ── STAGE 9 · FLOOR ───────────────────────────────────────────────────────
  floor: {
    intro: {
      learning: 'Why temporary event runs keep walking and exit routes clear, why floor protection must suit the real traffic, and how over-under coiling stores no twist.',
      start: 'Make the three STAGE CRAFT calls and watch the STAGE PLAN redraw itself. Then pick a route for THE FOH RUN and read every verdict card.',
    },
    seeing: [
      'STAGE CRAFT — CLEAN UP THE DECK: a top-down STAGE PLAN. It starts messy and redraws itself as you make three calls.',
      'THE FOH RUN (front of house, the mix position) and BACKSTAGE: three route options each. After a pick, all three are judged, each with an OVERALL score.',
      'STRIKE — COIL THE SNAKE OVER-UNDER draws a coil loop by loop, with a TWIST meter.',
    ],
    control: [
      'Stage craft: make three calls — mic lines to the vocal stands, the spare mic-cable length, monitor feeds to the wedges. After a wrong call, SHOW THE PROFESSIONAL WAY redraws it.',
      'FOH run and backstage: tap a route to pick it; verdict cards then judge every option.',
      'Coil: six loops with OVER LOOP (natural lay) and UNDER LOOP (reverse), alternating from OVER. A wrong coil offers RESTART THE COIL.',
    ],
    changes: [
      'Each over loop adds a turn of twist and each under loop takes one away; alternating cancels it.',
      'TWIST reads NONE — loops cancel; LOW; BUILDING; or HIGH — will fight deployment.',
      'A route with a serious safety flag carries ✕ REJECTED — SAFETY, even with a passable OVERALL score. Protection must suit the real traffic.',
    ],
    teaches: [
      'Keep walking and exit routes clear; cross only where needed, with protection suited to the loads.',
      'A cable ramp does not by itself make a crossing acceptable: where it sits and what crosses it matter too.',
      'Over-under coiling stores no twist, so the cable pays out straight at the next setup instead of kinking.',
    ],
    tryThis: [
      'After your FOH pick, read the verdict cards: the center aisle shows OVERALL 75 and still reads ✕ REJECTED — SAFETY, because that aisle is the exit route.',
      'Coil and watch TWIST: one OVER LOOP reads LOW; the UNDER LOOP after it reads NONE — loops cancel. Three overs in a row would climb to HIGH.',
      'After your BACKSTAGE pick: the doormat crossing shows OVERALL 77 and is rejected; the vehicle-rated protector shows OVERALL 100.',
    ],
  },

  // ── STAGE 10 · SIGNAL ─────────────────────────────────────────────────────
  emi: {
    intro: {
      learning: 'Why no single separation distance keeps signal cable quiet: noise pickup depends on the source, distance, balancing, shielding and how power and signal routes cross.',
      start: 'At the start, EXPOSURE reads MODERATE. Tap ◂ CLOSER once and watch it rise, then tap BALANCED PAIR and watch it fall.',
    },
    seeing: [
      'THE CONCEPT FIELD: a cross-section — a noise source at left, its coupling field (where its noise can jump into a cable), your signal cable. It shows the idea, not measured values.',
      'EXPOSURE reads LOW, MODERATE or HIGH, beside the source, BALANCED or UNBALANCED, and CLOSE, MID or FAR.',
      'THE REAL LEVERS — NOT A MAGIC NUMBER lists seven levers. THE CROSSING — POWER ROUTE MEETS SIGNAL ROUTE gives four choices.',
    ],
    control: [
      'Pick a source: AC FEEDER (the start), TRANSFORMER, MOTOR, DIMMER RACK, NETWORK CABLE.',
      'Move the DISTANCE fader, or tap ◂ CLOSER / FARTHER ▸ — a quarter of the range per tap. It starts at MID.',
      'Switch BALANCED PAIR / UNBALANCED; it starts UNBALANCED.',
      'THE CROSSING: tap a card for its verdict. Move the cable, switch the balancing and make a sound crossing choice to finish the stage.',
    ],
    changes: [
      'Exposure rises with the source’s strength and falls fast with distance.',
      'A balanced pair picks up noise almost equally on both wires, and the input cancels what is equal — so exposure drops.',
      'A long close parallel run shares the most length with the source; a near-perpendicular crossing shares almost none.',
    ],
    teaches: [
      'No single separation number exists: coupling depends on LEVEL, BALANCING, SHIELDING, CURRENT, DISTANCE, GEOMETRY and GROUNDING.',
      'A shield stops electric-field pickup; low-frequency magnetic hum needs twisting and distance.',
      'That is why power and signal are kept apart in racks and pathways, and cross near a right angle where they must meet.',
    ],
    tryThis: [
      'At the start (AC FEEDER, MID, UNBALANCED) EXPOSURE reads MODERATE. Tap ◂ CLOSER once: CLOSE, and HIGH.',
      'Stay CLOSE and tap BALANCED PAIR: EXPOSURE falls to MODERATE — balancing helps; distance still matters.',
      'Pick DIMMER RACK, UNBALANCED, at MID: HIGH. Tap FARTHER ▸ twice: LOW, even unbalanced.',
    ],
  },

  // ── STAGE 11 · BUILDING (Rack Unit) ───────────────────────────────────────
  fire: {
    intro: {
      learning: 'Why a ceiling cavity isn’t automatically a plenum, and why a cable through a rated wall needs a tested, listed firestop system, not just sealant.',
      start: 'Tap 1 DUCTED CAVITY in the dock and answer its question. Then tap 2 OPEN-RETURN CAVITY and compare how the air moves in each space.',
    },
    seeing: [
      'The display is a building section to scale, from the equipment-room rack to three numbered spaces.',
      'Red-hatched wall = a marked rated assembly; cyan arrows = moving air; amber dashes = your proposed route; violet = this run’s cable.',
      'Below it is the card in play: 1 · IDENTIFY EACH SPACE, then 2 · ONE RATED-WALL PENETRATION. READING THE SECTION holds the full key.',
    ],
    control: [
      'Use the dock keys: 1 DUCTED CAVITY, 2 OPEN-RETURN CAVITY, 3 RISER. Tap one to route the cable toward that space, again to clear it; ✓ = identified.',
      'Answer the selected space’s question; the verdict, ▸ WHY? and its source follow.',
      'With all three identified, the walk-through opens: five questions at the sleeve, each answered once.',
      'FULL SCREEN enlarges the section and keeps the dock with it.',
    ],
    changes: [
      'Each key reroutes the amber dashes on the section; each penetration answer adds its step to the drawing.',
      'In space 1 the return air runs in a duct; in space 2 the open cavity is the air path — so the cable rules differ.',
      'A riser links floors: the cable’s rating and the floor penetration’s treatment both matter.',
    ],
    teaches: [
      'A ceiling cavity is not automatically a plenum (a space carrying the building’s supply or return air): how air moves is read from the building documents.',
      'Firestopping is a listed system — a design tested as one unit: assembly, cables and materials together — not red sealant.',
      'Rated work is checked against the listed system and the authority having jurisdiction (the official or office that approves the work).',
    ],
    tryThis: [
      'At 1 DUCTED CAVITY, spot the trap answer “A plenum — every ceiling cavity is one”: here the return air runs in a duct, so each space must be identified first.',
      'Tap 2 OPEN-RETURN CAVITY and compare it with space 1: here the cavity itself carries the return air, so what may run in it is limited.',
      'At question 4, the answer “Yes — the label says fire rated” is the trap: a label is not a system. Only the listed system matched to this wall and bundle counts.',
    ],
  },

  // ── STAGE 12 · IDENTIFY ───────────────────────────────────────────────────
  label: {
    intro: {
      learning: 'Why a cable’s identity is labels at both ends plus records that match reality, and why service slack is planned, not left over.',
      start: 'In A · SERVICE CALL, tap CABLE 1 to CABLE 4 and try to tell them apart. Then in B · ASSIGN IDENTITY, read each code before you place it.',
    },
    seeing: [
      'SYSTEM shows one installed run — rack, patch panel, wall sleeve, stage box — with three identical audio cables and one network cable.',
      'You work through four phases: A · SERVICE CALL, B · ASSIGN IDENTITY, C · TRACE TEST, D · SERVICE LOOPS.',
      'After the trace: THE OTHER HALF OF IDENTITY — THE RECORDS, the cable schedule with A-012’s row lit.',
    ],
    control: [
      'A: tap CABLE 1 to CABLE 4 to inspect them. Every one is unlabeled.',
      'B: pick ORIGIN — STAGE END, DESTINATION — RACK END and CABLE ID, then tap APPLY LABELS — BOTH ENDS.',
      'C: find A-012 among the four labeled cables. Slide the schedule sideways to see every column.',
      'D: set the STORED SLACK fader — TOO LITTLE, INTENTIONAL or EXCESSIVE — then tap CONFIRM STORED SLACK. It locks at INTENTIONAL; confirming in another zone counts as a miss.',
    ],
    changes: [
      'Without labels every cable looks the same, so one fault means tracing by hand.',
      'With labels at both ends the same fault is found in seconds, and the schedule says where the run goes.',
      'Too little slack means a re-pull after one bad termination; too much becomes a pile that blocks the pathway.',
    ],
    teaches: [
      'Identity is labels at both ends plus records that match reality.',
      'A naming scheme must be unique, consistent and readable; each project sets its own.',
      'Service slack is planned, reachable and sized for re-termination (cutting off a bad connector and fitting a new one).',
    ],
    tryThis: [
      'In B read the codes before you pick: R1-PP2-12 is Rack 1, Patch Panel 2, Port 12 — the rack end, so it never goes under ORIGIN — STAGE END.',
      'In D drag STORED SLACK to the far end: EXCESSIVE, an unmanaged pile. Ease back to INTENTIONAL before you confirm.',
      'In the records, read A-012’s note: its service loop sits at pull box PB-3.',
    ],
  },

  // ── FINAL · INSPECT ───────────────────────────────────────────────────────
  inspect: {
    intro: {
      learning: 'How an inspection ties the whole job together: you find a fault, name its class, and the class points to the rule and then to the fix.',
      start: 'Open ▸ FINDINGS LIST and work zone by zone. For each finding, pick its class under 1 · CLASSIFY, then pick the fix under 2 · CORRECT.',
    },
    seeing: [
      'FACILITY WALK is one building — STAGE, FLOOR, WALL / DOOR, RACK, CEILING / TRAY, EQUIP ROOM — with numbered defect markers.',
      'Each attempt draws 15 to 18 defects from a pool of 25. After the walk comes the KNOWLEDGE CHECK.',
      'An open finding shows its label, a photo where one exists (AS FOUND ON THE WALK), and two steps: 1 · CLASSIFY, then 2 · CORRECT.',
    ],
    control: [
      'Tap a numbered marker, or open ▸ FINDINGS LIST.',
      '1 · CLASSIFY: choose Safety, Support, Routing, Mechanical, Signal, Fire / Building, Labeling or Serviceability.',
      '2 · CORRECT: choose the fix among plausible decoys. If your fix is wrong, you can choose again.',
      'Work through about four in five findings to reach SIGN OFF THE INSPECTION ✓, then solve every KNOWLEDGE CHECK question.',
    ],
    changes: [
      'A wrong class is logged under the real one for part of the score; the right class and fix earn the full score.',
      'Critical findings weigh more than minor ones. Safety and fire findings both feed Safety, the heaviest area in OVERALL.',
      'Each new attempt draws a different set, so a repeat tests judgment, not memory.',
    ],
    teaches: [
      'Inspection is finding, naming and fixing — the whole loop from plan to label, in one building.',
      'Naming a fault points to the rule behind it, and the rule points to the fix.',
      'Faults are not equal: a critical safety or fire fault outweighs a minor one, however neat the rest of the job looks.',
    ],
    tryThis: [
      'Open ▸ FINDINGS LIST and work zone by zone, the way an inspector walks a building.',
      'When a finding opens with a photo (AS FOUND ON THE WALK), judge the photo before the label: the real thing, not its name.',
      'Once FINAL INSPECTION COMPLETE appears, tap NEW INSPECTION ATTEMPT ↻: a different set of defects is drawn.',
    ],
  },
};

/** The Rule-or-Myth interstitial between two stages. */
export const CI_MYTH_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How to test a job-site rule of thumb against its real source: a code, a standard, the cable maker’s requirement or professional practice.',
    start: 'Read the statement in quotes. Before you tap TRUE or FALSE, name the authority you would check, then compare it with the tag that appears.',
  },
  seeing: [
    'A RULE OR MYTH? card sits between two stages: one statement in quotes, with TRUE and FALSE.',
    'After you answer, you see ✓ Right or ✕ It’s TRUE / FALSE, the reason, and an authority tag.',
    'The tag names what stands behind the answer: a code, a standard, the cable maker’s requirement or professional practice.',
  ],
  control: [
    'Tap TRUE or FALSE; your answer locks.',
    'Tap the tag to see the sources behind the rule. CONTINUE › (or NEXT ›) moves on to the next stage.',
    'Your answer is not scored: it changes no stage score.',
  ],
  changes: [
    'Each statement is a common job-site belief. The reveal shows what really governs: a code, a standard, the cable maker’s spec or good practice.',
    'When you finish a stage, NEXT › may show a card first; each card appears once per run.',
    'There are fewer cards than gaps between stages, so the last stages may show none. REPEAT LAB brings them back.',
  ],
  teaches: [
    'A rule of thumb is only as good as its source: check it against the code, standard or cable maker’s document it claims to come from.',
    'Many “always” and “never” rules are myths: the real requirement depends on the cable, the space and the documents.',
    'Knowing which authority stands behind a rule tells you where to look it up on a real job.',
  ],
  tryThis: [
    'Before answering, name the authority you would check — then compare it with the tag that appears.',
    'After answering, tap the tag: the sources list shows where the real rule lives.',
  ],
};

/** The end screen: WHAT IS LEFT, or COMPLETE. */
export const CI_COMPLETE_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Where your installation judgment is strong and which area to revisit, with every area scored across the stages and Safety weighted most.',
    start: 'Read KNOWLEDGE PROFILE · OVERALL and look for any area under 80. Tap REVIEW RESULTS to open the stage that trains it, or VIEW FIELD CHECK for the job checklist.',
  },
  seeing: [
    'The end screen reads CABLE DRESSING & INSTALLATION — COMPLETE, or WHAT IS LEFT with each unfinished stage listed.',
    'KNOWLEDGE PROFILE · OVERALL shows its number, then one row per area scored so far — Safety, Cable Protection, Routing & Support and more — with five blocks each.',
    'The buttons are VIEW FIELD CHECK, REVIEW RESULTS, REPEAT LAB and RETURN TO TRAINING.',
  ],
  control: [
    'Tap a STAGE row to jump straight to it. CREDITED marks a stage already saved from an earlier run.',
    'VIEW FIELD CHECK opens the installation checklist. REVIEW RESULTS appears when an area is under 80 and opens the stage that trains your weakest area.',
    'REPEAT LAB starts a fresh practice run; stages you’ve completed stay saved. RETURN TO TRAINING leaves the lab.',
  ],
  changes: [
    'Each area’s score comes from the stages that exercised it; the most recent stage counts most.',
    'Each area has five blocks, one for each 20 points, rounded. Safety carries the most weight in OVERALL.',
    'REPEAT LAB clears this run’s area scores and starts again at Stage 1; stages already saved stay saved.',
  ],
  teaches: [
    'Where your installation judgment is strong, and which area — Safety, Cable Protection, Routing & Support or another — needs another look.',
    'Safety outweighs every other area: an unsafe run is rejected however well the rest is done.',
    'A real job runs in four parts: before pulling, during installation, dressing, and the finish.',
  ],
  tryThis: [
    'If an area reads under 80, tap REVIEW RESULTS: it opens the stage that trains that area.',
    'Open VIEW FIELD CHECK and match its four headings to the stages you worked through.',
  ],
};

/** The field-check reward (from the end screen). */
export const CI_FIELD_CHECK_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The order of a real installation job, from checking the cable type before the pull to updating the records at the finish.',
    start: 'Scroll through the four groups, from BEFORE PULLING to FINISH. For each line, name the stage that taught it.',
  },
  seeing: [
    'CABLE INSTALLATION FIELD CHECK has four groups: BEFORE PULLING, DURING INSTALLATION, DRESSING, FINISH.',
    'Each line is one short field step, under the heading for that part of the job.',
    'It’s a training summary — not a substitute for project documents, manufacturer requirements or codes.',
  ],
  control: [
    'Scroll down the list; there is nothing to set or answer here.',
    'The □ boxes are not tappable and nothing here is saved. It is a list to take to the job.',
    '‹ RETURN TO RESULTS goes back to the end screen.',
  ],
  changes: [
    'Nothing here moves or scores: this screen is a summary, not an exercise.',
    'Each line condenses one stage’s lesson into a field step: verify, protect, organize, label, document.',
    'The order follows the job: checks before the pull, care during it, dressing after, records at the finish.',
  ],
  teaches: [
    'The order of real work, from checking the cable type before pulling to updating the as-built drawings (the record of what was really installed) after.',
    'Each group guards something: the plan before the pull, the cable during it, order and separation in dressing, traceability at the finish.',
    'The project documents, the cable maker’s requirements and local codes still govern every real job.',
  ],
  tryThis: [
    'Match the BEFORE PULLING lines to stages: cable type (Stage 2), route (3), environment (11), capacity (3 and 5), the cable maker’s requirements (4).',
    'Under FINISH, find “records must match reality” — the lesson of Stage 12’s cable schedule.',
  ],
};

/** Which guide the lab is showing. */
export type CiScreenKey = 'home' | CiModuleId | 'myth' | 'complete' | 'fieldCheck';

export function ciScreenGuide(key: CiScreenKey): ScreenGuide {
  if (key === 'home') return CI_HOME_GUIDE;
  if (key === 'myth') return CI_MYTH_GUIDE;
  if (key === 'complete') return CI_COMPLETE_GUIDE;
  if (key === 'fieldCheck') return CI_FIELD_CHECK_GUIDE;
  return CI_SCREEN_GUIDES[key];
}
