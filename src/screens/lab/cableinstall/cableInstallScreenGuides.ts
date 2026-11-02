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
  seeing: [
    'The lab’s opening screen. The drawing installs itself: stage box, floor run under a protector, wall raceway, conduit, ceiling tray and rack — the power feed kept apart.',
    'Below it: what professional installation involves, and a note that local codes always govern.',
    'START LAB (or RESUME — MODULE and a number) opens your next stage. WHAT YOU’LL LEARN lists the six objectives.',
  ],
  control: [
    'The big button opens the first stage you have not finished: START LAB while that is Stage 1, otherwise RESUME — MODULE and its number. With every stage done, START LAB reopens Stage 1.',
    'WHAT YOU’LL LEARN opens or closes the objectives. SOURCES / STANDARDS › lists the codes and standards this lab draws on.',
    'The strip under the title: ‹ PREV and NEXT › step between stages; tap its middle for the stage list, with WHAT\'S LEFT at the end.',
    'Every stage is open at any time. Tap ⓘ on any stage to have that screen explained.',
  ],
  changes: [
    'Each stage is one step of the job, tagged above its title: WHY, KNOW, PLAN, PROTECT, SUPPORT, DRESS, WALLS, OVERHEAD, FLOOR, SIGNAL, BUILDING, IDENTIFY, then FINAL · INSPECT.',
    'Each builds on the ones before: know the cable, plan its route, protect, carry and dress it, then label it and inspect the whole job.',
    'A RULE OR MYTH? card may appear between stages.',
  ],
  teaches: [
    'Installation is a chain of decisions — route, support, protection, separation, identity, inspection — not neat-looking wire.',
    'Each verdict names its authority: CODE / REGULATION, INDUSTRY STANDARD, MANUFACTURER REQUIREMENT or PROFESSIONAL PRACTICE.',
    'It follows the two connector labs (what each cable carries) and comes before the Patchbay and Gain Staging labs.',
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
    seeing: [
      'SIX THINGS RIDING ON EVERY RUN: SAFETY, RELIABILITY, SIGNAL INTEGRITY, SERVICEABILITY, MECHANICAL PROTECTION, PROFESSIONAL WORKMANSHIP.',
      'WHICH INSTALLATION WOULD YOU APPROVE?: four close-ups — A — THE SHOWPIECE, B — THE PROFESSIONAL, C — THE PILE, D — THE BLOCKADE.',
      'After a pick, each close-up shows its verdict and the NEAT ≠ CORRECT card appears.',
    ],
    control: [
      'Tap a consequence card to open it; a ✓ marks it reviewed. Opening all six is part of this stage’s credit.',
      'Tap a close-up’s name, drawing or caption to approve it. FULL SCREEN enlarges the drawing, with its APPROVE button underneath.',
      'Under each verdict, ▸ WHY? opens the reason; the coloured tag opens the sources behind it.',
      'After a wrong pick only B stays tappable. With all six cards open, approving B completes the stage. Approved B first? Open the rest, then tap MARK STAGE COMPLETE ✓.',
    ],
    changes: [
      'A looks best, but its ties are cinched so hard the cables go oval: crushing damages a cable inside before the outside shows it.',
      'D is tidy but dressed across the vent grille and service panel: heat builds up and nobody can reach the gear.',
      'C has nothing supported or traceable. B is plainer: gentle bends, labeled ends, supported weight, reachable connectors.',
    ],
    teaches: [
      'Neat is not the same as correct: an install is judged on safety, reliability, signal, service, protection and workmanship together.',
      'Appearance follows from doing those six right — it never replaces them.',
      'The lab’s rhythm starts here: your call, the verdict, WHY?, then the source. Next, Stage 2 asks what each cable is.',
    ],
    tryThis: [
      'Make your call, then read A’s verdict: restraints cinched so tight they deform every cable in the loom. The neatest close-up is not the one to sign off.',
      'After your first pick every close-up shows its verdict — read D’s: tidy in the wrong place, over cooling and service access, is still wrong.',
      'Under B’s verdict tap the coloured tag: it shows which kind of authority stands behind that rule.',
    ],
  },

  // ── STAGE 2 · KNOW ────────────────────────────────────────────────────────
  know: {
    seeing: [
      'THE CABLE WORKBENCH: 14 cable types, each with a colour swatch and PERMANENT, TEMPORARY or PERM · TEMP.',
      'An open card: a photo of the cable cut back, a SECTION drawing, what it carries, and its CHECK BEFORE ROUTING list.',
      'SCENARIO DRILL — WHAT ARE YOU INSTALLING?: three real runs, four calls each. Colours are training tints; field colours vary.',
    ],
    control: [
      'Tap a cable’s name to open or close its card; a ✓ marks it reviewed. Browsing is free and not scored; the drill below draws on it.',
      'For each run in the drill answer 1 · WHAT CABLE IS THIS?, 2 · TEMPORARY OR PERMANENT?, 3 · THE LIKELY PATHWAY? and 4 · THE KEY RISK?',
      'Each answer locks when you make it; the next question opens under its verdict.',
      'All three runs answered completes the stage. Its score comes from your own calls.',
    ],
    changes: [
      'Each verdict names the right cable and what it carries, so a wrong call still shows the answer.',
      'After the four calls, THEN THE PAPERWORK shows your score on that run and the records it needs.',
      'The same signal can need different methods: a one-night snake rides the floor; a permanent line lives in a building pathway.',
    ],
    teaches: [
      'Installation method follows cable type and use: what it carries, how long it stays, where it goes, what can hurt it.',
      'Mic lines carry tiny signals that pick up noise; snakes face traffic; crushing spoils a data cable’s pair geometry (the even twist of each wire pair).',
      'After Stage 1’s why, this is the what. Stage 3 plans where it goes.',
    ],
    tryThis: [
      'Open Microphone cable, then Fiber-optic cable: compare their CHECK BEFORE ROUTING lists — different cables, different worries.',
      'For the one-night concert run, answer 2 · TEMPORARY OR PERMANENT? and read the verdict: temporary changes the solutions, not the standard of care.',
      'For the permanent network run, watch THE KEY RISK: pair geometry, spoiled by crushing and over-tension.',
    ],
  },

  // ── STAGE 3 · PLAN ────────────────────────────────────────────────────────
  route: {
    seeing: [
      'Two installations, each a building section drawn to scale (FULL SCREEN adds the badge Scale: 20 units = 1 m · person 1.75 m). CABLE: names what is pulled.',
      'Three candidate routes, A, B and C, each in its own colour; a card per route gives its path and relative length (×1.0 = shortest).',
      'After a pick: THE VERDICT — ALL THREE ROUTES, SCORED — six score bars and an overall /100 per route.',
    ],
    control: [
      'FINISHED shows the space as people see it, hidden runs dashed. X-RAY strips the surfaces: in-wall and above-ceiling runs draw solid.',
      'WHICH ROUTE DO YOU PULL?: tap a route card (or PULL A, B or C in full screen). The pick locks for that installation.',
      'Under the verdict: each flag on your route, with ▸ WHY? and its source tag.',
      'Deciding both installations completes the stage; its score averages the two routes you chose.',
    ],
    changes: [
      'Each route starts at 100 in every area and loses points for its flags: a public walkway, another trade’s space, sharp edges, motor loads.',
      'Length barely counts — only past 1.5× the shortest does it cost a little workmanship.',
      'A serious safety flag earns ✕ REJECTED — SAFETY, whatever the overall number. Your pick installs itself; the others fade back.',
    ],
    teaches: [
      'The shortest route is not always the best route: safety, protection, pathway quality and future service count too.',
      'Cable belongs in pathways built for it — not another trade’s space, a floor or a ceiling grid.',
      'Plan for the cable’s whole life, not the pull day. With the cable known (Stage 2), Stage 4 protects it along the route.',
    ],
    tryThis: [
      'After your stage-to-rack pick, read THE VERDICT: Across the hallway floor (×1.0, the shortest) finishes LAST at 62/100, with ✕ REJECTED — SAFETY.',
      'Before you pick, switch to X-RAY: the runs inside the wall and above the ceiling draw solid — the parts nobody sees later.',
      'After your amp-room pick: the shortest, over the ceiling grid, scores 63/100 — and the duct route, at 78/100, is rejected too.',
    ],
  },

  // ── STAGE 4 · PROTECT ─────────────────────────────────────────────────────
  mech: {
    seeing: [
      'A · BEND RADIUS: one corner, four cables — mic, twisted-pair data, coaxial, fiber-optic — each with its own SIMULATED SPEC card.',
      'The drawing shows the bend; a dashed arc marks the spec minimum. Too tight, it glows red with a strain mark.',
      'B · PULLING: a tension meter, 0 to 150, limit at 100. C · RESTRAINT: a strap on a four-cable bundle, zone LOOSE, SECURE or EXCESSIVE.',
    ],
    control: [
      'BEND TIGHTNESS fader per cable, or − EASE / + TIGHTEN (each tap about 1.5 diameters). Its readout: the bend in cable diameters, then the spec.',
      'CHECK BEND tests that cable against its spec; it reads MEETS SPEC ✓ when it passes.',
      'Pull events: Steady smooth pull, Pull harder through the snag, Hard yank around the corner, Pull it through by the connector.',
      'STRAP TENSION fader, or SET LOOSE, SET SECURE, SET EXCESSIVE.',
      'Credit: all four bends meet spec, all four pulls tried, the strap landed SECURE.',
    ],
    changes: [
      'On a first run every cable starts too tight — about 2 diameters — to show the failure.',
      'Simulated specs: mic ≥ 6×, data ≥ 4×, coax ≥ 10×, fiber ≥ 15×; real limits come from each cable’s documents. Same corner, different spec.',
      'A snag spikes tension to 140; a yank, 120. Pulling by the connector reads 80 but loads the termination (where cable meets connector).',
      'Over-tight straps crush cables oval, inside first.',
    ],
    teaches: [
      'Bend, tension and restraint limits belong to each specific cable — checking its documentation comes first.',
      'Pull with steady force on the cable, never the connector; stop and clear a snag.',
      'Ties are not banned; a restraint must hold without crushing. Stage 5 picks the hardware that carries the cable.',
    ],
    tryThis: [
      'From the first-run start, tap − EASE five times on the coax card: about 9.5× — under its ≥ 10× spec. One more tap gives about 11×, and CHECK BEND passes.',
      'Tap Pull it through by the connector: the meter reads 80, under the limit — and the verdict still flags it.',
      'Tap SET EXCESSIVE: the zone reads EXCESSIVE and the cables ovalize. Ease STRAP TENSION back into SECURE.',
    ],
  },

  // ── STAGE 5 · SUPPORT ─────────────────────────────────────────────────────
  supports: {
    seeing: [
      'A · FOUR JOBS: SUPPORT, PATHWAY, PROTECTION and MANAGEMENT, each card with a hardware drawing.',
      'B · THE SORT: 17 items, one at a time — would you hang cable on this? A photo of the real thing follows your call.',
      'C · SUPPORT SPACING: a 12-unit span, five candidate positions; the cable sags live between supports, under a MAX SAG ½ UNIT line.',
    ],
    control: [
      'In the sort tap APPROVE or REJECT, then NEXT ITEM › (FINISH SORT › on the last). Approved hardware shows the jobs it does.',
      'The pass mark is 14 correct. After the last item: RETRY THE SORT, or RUN THE SORT AGAIN once passed.',
      'In the spacing exercise tap P1 to P5 (2u to 10u) to place or remove a J-hook (a hook-shaped support fixed to structure), then CHECK SPACING.',
      'Credit: pass the sort and meet the spacing spec.',
    ],
    changes: [
      'Sag grows fast with the unsupported span (in real cable, with its square). Past the limit the drawing shows its deepest dip and glows strained.',
      'The spec allows at most 4 units between supports; a longer span draws strained. Extra supports pass, but cost hardware.',
      'Pipes, tiles, grid wires and other systems’ conduit are rejected: they belong to another trade or hold up the ceiling.',
    ],
    teaches: [
      'Hardware is chosen by its job: supports carry weight, pathways set the route, protection blocks damage, management organizes.',
      'Cable rides only on purpose-built supports anchored to structure, spaced to the support system’s documents.',
      'Stage 4 protected the cable; this carries it. Stage 6 dresses it in the rack.',
    ],
    tryThis: [
      'Place one J-hook at P3 (6u) and watch, before any check: both 6-unit spans dip past the MAX SAG ½ UNIT line and glow strained.',
      'Swap it for P2 and P4 (4u, 8u) and tap CHECK SPACING: each span dips just to the line, and the verdict calls it the documented every-4-unit design.',
      'Then try P1, P3 and P5 (2u, 6u, 10u): it meets the 4-unit maximum too, with more hardware than the design needs.',
    ],
  },

  // ── STAGE 6 · DRESS ───────────────────────────────────────────────────────
  rack: {
    seeing: [
      'RACK: a rear view — patch panel between horizontal managers, switch, DSP (digital signal processor), interface, amplifier, power distribution, vertical managers.',
      'Four phases on it: PHASE A — INSPECT, PHASE B — DRESS, PHASE C — SERVICE, PHASE D — MAINTAIN.',
      'In Phase A amber rings mark places to inspect; a find shows ⚑, its rule and a FIX line, and a counter tracks finds.',
    ],
    control: [
      'A: tap a spot on the rack, or open ▸ SUSPECT LIST and go location by location. 10 finds unlock RACK CONDEMNED — NOW DRESS IT RIGHT ›.',
      'B: pick a group — AC POWER, ANALOG AUDIO, NETWORK, LOUDSPEAKER OUT, CONTROL, FIBER — then where it dresses: left or right vertical manager, top cable entry or horizontal manager. Reassign until it matches; each off-plan placement costs score.',
      'C: tap DSP INPUT 7 on the rack or in the input list, then REPLACE THIS CABLE ✓.',
      'D: choose an approach — STRIP THE RACK, CUT THE DRESSING, USE THE DRESSING or FORCE IT.',
    ],
    changes: [
      'In B each loom draws itself down the manager you choose; with all six placed, each shows ✓ or ✕ against THIS PROJECT\'S PLAN.',
      'Here signal dresses left, AC power and speaker outputs right. The side is a project choice; what matters is a plan, with classes kept apart for noise and tracing.',
      'In C the one cable lights from its A-007 label at the rack entry to the DSP; every other loom dims.',
    ],
    teaches: [
      'A rack is dressed for the service call: labels identify, managers hold, slack moves, airflow and access stay clear.',
      'Power and signal follow a plan that keeps them apart.',
      'Good dressing turns a fault into one traced cable and a quick swap. It builds on Stages 4–5; Stage 12 adds labels and records.',
    ],
    tryThis: [
      'Phase B opens after 10 finds. Read THIS PROJECT\'S PLAN before placing: AC POWER goes to the right vertical manager, away from the signal on the left.',
      'After the Phase C swap, read THE SAME JOB, BEFORE: the identical fault on the Phase A rack.',
      'In Phase D read all four approaches before you pick: only one frees the switch without disturbing the cables that still work.',
    ],
  },

  // ── STAGE 7 · WALLS ───────────────────────────────────────────────────────
  walls: {
    seeing: [
      'ROOM: one wall elevation — a rack, a wall device, baseboard raceway, a doorway and an unfinished opening.',
      'X-RAY WALL VIEW reveals studs and in-wall runs — and the reminder that no view shows a fire rating.',
      'Four short scenarios: 1 · SURFACE RACEWAY, 2 · WALL PENETRATION, 3 · THE DOORWAY, 4 · SHARP EDGE.',
    ],
    control: [
      'X-RAY WALL VIEW: ON / OFF switches the in-wall view.',
      '1: pick one of three raceway routes to the wall device.',
      '2: for each wall — ordinary, fire-rated, unknown — pick the action, then NEXT WALL ›.',
      '3: pick an answer for TEMPORARY (a two-day event) and for PERMANENT (a system that stays).',
      '4: pick the fix for the raw edge. Wrong picks can be corrected, at a cost to the score; all four right completes the stage.',
    ],
    changes: [
      'The chosen raceway route installs itself; the rejected ones fade back.',
      'A threshold protector drops in and the pinched cable relaxes; a bushing straightens the folded cable at the raw edge.',
      'A door pinches cable thousands of times; a raw edge rubs with every small movement. The damage adds up, often unseen.',
    ],
    teaches: [
      'Verify a wall before penetrating it — unknown means unknown, never "probably ordinary".',
      'A rated wall needs its listed penetration system; an ordinary one still gets a sleeve or bushing.',
      'Temporary changes the solution, not the standard of care. After Stages 3–5, Stage 8 goes above the ceiling.',
    ],
    tryThis: [
      'In scenario 2, turn X-RAY WALL VIEW on at the unknown wall: studs appear, but nothing shows a rating. Then pick Verify the assembly before penetrating.',
      'At 3 · THE DOORWAY, before you pick, weigh “Wedge the door open for the event”: if that door is a fire door, a wedge defeats it.',
      'At 4 · SHARP EDGE, weigh Wrap the edge in tape and move on against Install a bushing / grommet on the opening: tape creeps and quits; the edge stays.',
    ],
  },

  // ── STAGE 8 · OVERHEAD ────────────────────────────────────────────────────
  ceiling: {
    seeing: [
      'CEILING: a cutaway of a suspended ceiling — deck, joists, hanger wires, grid and tiles, a duct, the sprinkler main, conduit, a light, a tray, J-hooks.',
      'ABOVE CEILING · AS FOUND shows a previous contractor’s work; FINISHED VIEW, the same section done right.',
      'EXERCISE 1 · FIND THE PROBLEMS: eight marked defects. EXERCISE 2 · INSTALL THE ROUTE: a new run.',
    ],
    control: [
      'ABOVE CEILING · AS FOUND / FINISHED VIEW switches the view.',
      'Exercise 1: tap a marker, or open the SUSPECT LIST. 6 finds unlock CONTINUE TO THE INSTALL ›.',
      'Exercise 2: 1 · PICK THE PATHWAY / SUPPORT, then 2 · PLACE J-HOOKS ON THE 12-UNIT SPAN — tap U1 to U11; U0 and U12 are already in.',
      'CHECK SPACING (it shows how many are placed), then CONFIRM THE ROUTE ✓.',
    ],
    changes: [
      'Sag grows with the square of the unsupported span: a span over 4 units glows and dips below the dashed ½-unit sag line.',
      'With every span 4 units or less the run settles even; confirming installs the bundle to the bushed wall sleeve.',
      'Tiles, grid, sprinkler pipe, lights and ducts belong to other systems — loading them puts the cable and the building at risk.',
    ],
    teaches: [
      'Above the tiles is other people’s infrastructure: a cable gets its own supports from structure.',
      'Spacing comes from the supplied system spec, every tile must still lift, and service loops stay reachable.',
      'After walls (Stage 7), this is overhead. Stage 9 covers floors and events.',
    ],
    tryThis: [
      'In Exercise 2 (after 6 finds and the pathway pick) place one hook at U6 and watch: both spans of 6 units dip below the dashed sag line.',
      'Swap U6 for U4 and U8 and tap CHECK SPACING: every span is 4 units or less, and CONFIRM THE ROUTE ✓ appears.',
      'After the finds, switch to FINISHED VIEW: the same section with every defect corrected.',
    ],
  },

  // ── STAGE 9 · FLOOR ───────────────────────────────────────────────────────
  floor: {
    seeing: [
      'STAGE CRAFT — CLEAN UP THE DECK: a top-down STAGE PLAN that starts messy and redraws itself as you make three calls.',
      'THE FOH RUN (front of house, the mix position) and BACKSTAGE: three route options each; after a pick, all three are judged, each with an OVERALL score.',
      'STRIKE — COIL THE SNAKE OVER-UNDER: a coil that draws loop by loop, with a TWIST meter.',
    ],
    control: [
      'Stage craft: three calls — mic lines to the vocal stands, the spare mic-cable length, monitor feeds to the wedges. After a wrong call, SHOW THE PROFESSIONAL WAY redraws it.',
      'FOH run and backstage: tap a route to pick it; verdict cards then judge every option.',
      'Coil: six loops with OVER LOOP (natural lay) and UNDER LOOP (reverse), alternating from OVER. A wrong coil offers RESTART THE COIL.',
    ],
    changes: [
      'Each over loop adds a turn of twist and each under loop takes one away; alternating cancels it.',
      'TWIST reads NONE — loops cancel, LOW, BUILDING or HIGH — will fight deployment.',
      'A route with a serious safety flag carries ✕ REJECTED — SAFETY, even with a passable OVERALL score. Protection must suit the real traffic.',
    ],
    teaches: [
      'Keep walking and exit routes clear; cross only where needed, with protection suited to the loads.',
      'A cable ramp does not by itself make a crossing acceptable. Over-under coiling stores no twist, so the cable pays out straight.',
      'After permanent pathways (Stages 7–8), this is temporary event work. Stage 10 turns to interference.',
    ],
    tryThis: [
      'After your FOH pick, read the verdict cards: the center aisle shows OVERALL 75 and still reads ✕ REJECTED — SAFETY — that aisle is the exit route.',
      'Coil and watch TWIST: one OVER LOOP reads LOW; the UNDER LOOP after it reads NONE — loops cancel. Three overs in a row would climb to HIGH.',
      'After your BACKSTAGE pick: the doormat crossing shows OVERALL 77 and is rejected; the vehicle-rated protector shows OVERALL 100.',
    ],
  },

  // ── STAGE 10 · SIGNAL ─────────────────────────────────────────────────────
  emi: {
    seeing: [
      'THE CONCEPT FIELD: a cross-section — a noise source at left, its coupling field (where its noise can jump into a cable), your signal cable. A concept, not measurements.',
      'EXPOSURE reads LOW, MODERATE or HIGH, beside the source, BALANCED or UNBALANCED, and CLOSE, MID or FAR.',
      'THE REAL LEVERS — NOT A MAGIC NUMBER lists seven levers. THE CROSSING — POWER ROUTE MEETS SIGNAL ROUTE: four choices.',
    ],
    control: [
      'Source keys: AC FEEDER (the start), TRANSFORMER, MOTOR, DIMMER RACK, NETWORK CABLE.',
      'DISTANCE fader, or ◂ CLOSER / FARTHER ▸ — a quarter of the range per tap. It starts at MID.',
      'BALANCED PAIR / UNBALANCED; it starts UNBALANCED.',
      'THE CROSSING: tap a card for its verdict. Credit: move the cable, switch the balancing, and make a sound crossing choice.',
    ],
    changes: [
      'Exposure rises with the source’s strength and falls fast with distance.',
      'A balanced pair picks up noise almost equally on both wires, and the input cancels what is equal — so exposure drops.',
      'A long close parallel run shares the most length; a near-perpendicular crossing shares almost none.',
    ],
    teaches: [
      'No single separation number exists: coupling depends on LEVEL, BALANCING, SHIELDING, CURRENT, DISTANCE, GEOMETRY and GROUNDING.',
      'A shield stops electric-field pickup; low-frequency magnetic hum needs twisting and distance.',
      'Stage 6 kept classes apart in the rack; this is why. Stage 11 covers building spaces.',
    ],
    tryThis: [
      'At the start (AC FEEDER, MID, UNBALANCED) EXPOSURE reads MODERATE. Tap ◂ CLOSER once: CLOSE, and HIGH.',
      'Stay CLOSE and tap BALANCED PAIR: EXPOSURE falls to MODERATE — balancing helps; distance still matters.',
      'Pick DIMMER RACK, UNBALANCED, at MID: HIGH. Tap FARTHER ▸ twice: LOW, even unbalanced.',
    ],
  },

  // ── STAGE 11 · BUILDING (Rack Unit) ───────────────────────────────────────
  fire: {
    seeing: [
      'The display: a building section to scale, from the equipment-room rack to three numbered spaces.',
      'Red-hatched wall = a marked rated assembly; cyan arrows = moving air; amber dashes = your proposed route; violet = this run’s cable.',
      'Below it, the card in play: 1 · IDENTIFY EACH SPACE, then 2 · ONE RATED-WALL PENETRATION. READING THE SECTION holds the full key.',
    ],
    control: [
      'Dock keys: 1 DUCTED CAVITY, 2 OPEN-RETURN CAVITY, 3 RISER. Tap one to route the cable toward that space, again to clear it; ✓ = identified.',
      'Answer the selected space’s question; the verdict, ▸ WHY? and its source follow.',
      'With all three identified, the walk-through opens: five questions at the sleeve, each answered once.',
      'FULL SCREEN enlarges the section, with the dock along.',
    ],
    changes: [
      'Each key reroutes the amber dashes on the section; each penetration answer adds its step to the drawing.',
      'In space 1 the return air runs in a duct; in space 2 the open cavity is the air path — so the cable rules differ.',
      'A riser links floors: the cable’s rating and the floor penetration’s treatment both matter.',
    ],
    teaches: [
      'A ceiling cavity is not automatically a plenum (a space the building’s return air flows through): how air moves is read from the building documents.',
      'Firestopping is a listed system — a design tested as one unit: assembly, cables and materials together — not red sealant.',
      'Rated work is verified against the listed system and the authority having jurisdiction. Stage 12 makes it all traceable.',
    ],
    tryThis: [
      'At 1 DUCTED CAVITY, spot the trap answer “A plenum — every ceiling cavity is one”: here the return air runs in a duct, so each space must be identified first.',
      'Tap 2 OPEN-RETURN CAVITY and compare it with space 1: here the cavity itself carries the return air, so what may run in it is limited.',
      'At question 4, the answer “Yes — the label says fire rated” is the trap: a label is not a system. Only the listed system matched to this wall and bundle counts.',
    ],
  },

  // ── STAGE 12 · IDENTIFY ───────────────────────────────────────────────────
  label: {
    seeing: [
      'SYSTEM: one installed run — rack, patch panel, wall sleeve, stage box — with three identical audio cables and one network cable.',
      'Four phases: A · SERVICE CALL, B · ASSIGN IDENTITY, C · TRACE TEST, D · SERVICE LOOPS.',
      'After the trace: THE OTHER HALF OF IDENTITY — THE RECORDS, the cable schedule with A-012’s row lit.',
    ],
    control: [
      'A: tap CABLE 1 to CABLE 4 to inspect them — every one is unlabeled.',
      'B: pick ORIGIN — STAGE END, DESTINATION — RACK END and CABLE ID, then APPLY LABELS — BOTH ENDS.',
      'C: find A-012 among the four labeled cables; slide the schedule sideways for every column.',
      'D: STORED SLACK fader — TOO LITTLE, INTENTIONAL or EXCESSIVE — then CONFIRM STORED SLACK. It locks at INTENTIONAL; a confirm in another zone counts as a miss.',
    ],
    changes: [
      'Without labels every cable looks the same, so one fault means tracing by hand.',
      'With labels at both ends the same fault is found in seconds, and the schedule says where the run goes.',
      'Too little slack means a re-pull after one bad termination; too much becomes a pile that blocks the pathway.',
    ],
    teaches: [
      'Identity is labels at both ends plus records that match reality.',
      'A naming scheme must be unique, consistent and readable; each project sets its own.',
      'Service slack is planned, reachable and sized for re-termination. Stage 6 relied on this; the FINAL inspection checks it.',
    ],
    tryThis: [
      'In B read the codes before you pick: R1-PP2-12 is Rack 1, Patch Panel 2, Port 12 — the rack end, so it never goes under ORIGIN — STAGE END.',
      'In D drag STORED SLACK to the far end: EXCESSIVE, an unmanaged pile. Ease back to INTENTIONAL before you confirm.',
      'In the records, read A-012’s note: its service loop sits at pull box PB-3.',
    ],
  },

  // ── FINAL · INSPECT ───────────────────────────────────────────────────────
  inspect: {
    seeing: [
      'FACILITY WALK: one building — STAGE, FLOOR, WALL / DOOR, RACK, CEILING / TRAY, EQUIP ROOM — with numbered defect markers.',
      'Each attempt draws 15 to 18 defects from a pool of 25. After the walk: the KNOWLEDGE CHECK.',
      'The open finding shows its label, a photo where one exists (AS FOUND ON THE WALK), and two steps: 1 · CLASSIFY, then 2 · CORRECT.',
    ],
    control: [
      'Tap a numbered marker, or open ▸ FINDINGS LIST.',
      '1 · CLASSIFY: Safety, Support, Routing, Mechanical, Signal, Fire / Building, Labeling or Serviceability.',
      '2 · CORRECT: choose the fix among plausible decoys; a wrong fix lets you choose again.',
      'Process about four in five findings for SIGN OFF THE INSPECTION ✓, then solve every KNOWLEDGE CHECK question.',
    ],
    changes: [
      'A wrong class is logged under the real one, for part credit; the right class and fix earn it all.',
      'Critical findings weigh more than minor ones, and safety and fire findings both feed Safety — the heaviest area in OVERALL.',
      'Each new attempt draws a different set: repeats test judgment, not memory.',
    ],
    teaches: [
      'Inspection is finding, naming and fixing — the whole loop from plan to label, in one building.',
      'Naming a fault points to the rule behind it, and the rule points to the fix.',
      'The knowledge check asks for scenario judgment. It draws on every stage; NEXT then shows your results.',
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
  seeing: [
    'A RULE OR MYTH? card between two stages: one statement in quotes, with TRUE and FALSE.',
    'After your answer: ✓ Right or ✕ It’s TRUE / FALSE, the reason, and an authority tag.',
    'The tag names what stands behind the answer: a code, a standard, the cable maker’s requirement or professional practice.',
  ],
  control: [
    'Tap TRUE or FALSE; the answer locks.',
    'The tag opens the sources behind the rule. CONTINUE › (or NEXT ›) moves on to the next stage.',
    'Your answer is not scored: it changes no stage score.',
  ],
  changes: [
    'Each statement is a common job-site belief. The reveal shows what really governs: a code, a standard, the cable maker’s spec or good practice.',
    'When you finish a stage, NEXT › may show a card first; each appears once per run.',
    'There are fewer cards than stage boundaries, so the last stages may show none. REPEAT LAB brings them back.',
  ],
  teaches: [
    'How to test a rule of thumb against its real source.',
    'Many "always" and "never" rules are myths: the real requirement depends on the cable, the space and the documents.',
    'Each card checks a belief against the stage you just finished, before the next stage builds on it.',
  ],
  tryThis: [
    'Before answering, name the authority you would check — then compare it with the tag that appears.',
    'After answering, tap the tag: the sources list shows where the real rule lives.',
  ],
};

/** The end screen: WHAT IS LEFT, or COMPLETE. */
export const CI_COMPLETE_GUIDE: ScreenGuide = {
  seeing: [
    'The end screen: CABLE DRESSING & INSTALLATION — COMPLETE, or WHAT IS LEFT with each unfinished stage listed.',
    'KNOWLEDGE PROFILE · OVERALL and its number, then one row per area scored so far — Safety, Cable Protection, Routing & Support and more — five blocks each.',
    'Buttons: VIEW FIELD CHECK, REVIEW RESULTS, REPEAT LAB, RETURN TO TRAINING.',
  ],
  control: [
    'Tap a STAGE row to jump straight to it. CREDITED marks a stage already saved from an earlier run.',
    'VIEW FIELD CHECK opens the installation checklist. REVIEW RESULTS, shown when an area is under 80, opens the stage that trains your weakest area.',
    'REPEAT LAB starts a fresh practice run — credit you earned is never removed. RETURN TO TRAINING leaves the lab.',
  ],
  changes: [
    'Each area’s score comes from the stages that exercised it; the most recent stage counts most.',
    'Five blocks per area, one for each 20 points, rounded. Safety carries the most weight in OVERALL.',
    'REPEAT LAB clears this run’s area scores and starts again at Stage 1; stage credit already saved stays.',
  ],
  teaches: [
    'Where your installation judgment is strong, and which area to revisit.',
    'The field check condenses the job: before pulling, during installation, dressing, finish.',
    'Next in the course: Patchbay Signal Flow & Normalling, where these labeled, dressed lines meet the patchbay.',
  ],
  tryThis: [
    'If an area reads under 80, tap REVIEW RESULTS: it opens the stage that trains that area.',
    'Open VIEW FIELD CHECK and match its four headings to the stages you worked through.',
  ],
};

/** The field-check reward (from the end screen). */
export const CI_FIELD_CHECK_GUIDE: ScreenGuide = {
  seeing: [
    'CABLE INSTALLATION FIELD CHECK: four groups — BEFORE PULLING, DURING INSTALLATION, DRESSING, FINISH.',
    'Each line is one short field step, under the heading for that part of the job.',
    'A training summary — not a substitute for project documents, manufacturer requirements or codes.',
  ],
  control: [
    'Scroll down the list; there is nothing to set or answer here.',
    'The □ boxes are not tappable and nothing here is saved; it is a list to take to the job.',
    '‹ RETURN TO RESULTS goes back to the end screen.',
  ],
  changes: [
    'Nothing here moves or scores: this screen is a summary, not an exercise.',
    'Each line condenses one stage’s lesson into a field step: verify, protect, organize, label, document.',
    'The order follows the job: checks before the pull, care during it, dressing after, records at the finish.',
  ],
  teaches: [
    'The order of real work, from checking the cable type before pulling to updating the as-built drawings after.',
    'The headings track the stages: BEFORE PULLING draws on Stages 2–5 and 11; DURING INSTALLATION on 4, 5 and 7–9; DRESSING on 6, 10 and 12; FINISH on 12 and the FINAL.',
    'The project documents, the cable maker’s requirements and local codes still govern every real job.',
  ],
  tryThis: [
    'Match the BEFORE PULLING lines to stages: cable type (Stage 2), route (3), environment (11), capacity (3 and 5), the cable maker’s requirements (4).',
    'Under FINISH, find "records must match reality" — the lesson of Stage 12’s cable schedule.',
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
