/**
 * Cable & Connector Fundamentals — "explain this screen" content (Screen
 * Guide rollout 2026-10-31, after the Wave Physics pilot). One guide per
 * lesson step, keyed by CableLessonId (data/lessons.ts). The lab has no
 * separate home screen: it opens on its first lesson, and Lesson 12 is both
 * the final check and the lab's own what's-left screen.
 *
 * Every line was written against the lesson's own code (lessons/*.tsx and
 * data/*.ts): the names are the on-screen names (eyebrows, chip labels,
 * card section titles, verdict words), and every TRY THIS outcome is what the
 * data makes the screen show (fixed pair / scenario / cable order, the
 * tester's measured maps). Change a lesson's labels or data → update its
 * guide here; test/screenGuide_cable_20261031.test.ts pins the shape.
 *
 * These are reading screens (no Rack Unit): the guide host runs with regions
 * off, so every step sits in a bottom card. Budgets as SCREEN_GUIDE_BUDGET.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no gear brand names (the twist-lock loudspeaker and locking power
 * families are described, not named); no "N of total"; no build notes.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { CableLessonId } from './cableTypes';

export const CABLE_SCREEN_GUIDES: Record<CableLessonId, ScreenGuide> = {
  // ── Lesson 1 ──────────────────────────────────────────────────────────────
  l01_what_travels: {
    seeing: [
      'The amber banner: a connector’s shape does not prove the connection is correct or safe.',
      'WHAT CAN TRAVEL THROUGH A CABLE?: twelve category chips, from MIC-LEVEL AUDIO to POWER + DATA TOGETHER. The card below explains the one you tapped.',
      'WHAT MUST TRAVEL HERE?: one source → destination pair at a time, nine in all, with its own count in the heading.',
    ],
    control: [
      'Tap any category chip to read its card. MIC-LEVEL AUDIO is open first.',
      'In the check, tap what has to travel between the two devices. Wrong picks show NOT QUITE and stay open — keep trying.',
      'A right pick shows CORRECT, or ALSO DEFENSIBLE when a second answer can be argued. Then NEXT PAIR ›; the last pair shows FINISH CHECK ✓.',
      'The strip under the title moves between lessons; its readout opens CONTENTS. The header ‹ leaves the lab.',
    ],
    changes: [
      'The answer depends on what leaves the source: its level and its kind. The wrong-pick hint points you there.',
      'A mic makes a few thousandths of a volt. A power amplifier makes whole volts to over a hundred, with real current. Data, clock and power are different things again.',
      'The lesson’s credit lands only when all nine pairs are solved.',
    ],
    teaches: [
      'The twelve things that travel on cables in an audio system.',
      'Why professionals name WHAT travels before they think about connectors.',
      'The opening lesson of this lab, after the signal labs. Every later lesson — anatomy, connectors, selection, safety — builds on these categories.',
    ],
    tryThis: [
      'Tap LOUDSPEAKER-LEVEL AUDIO, then MIC-LEVEL AUDIO: compare the two cards — the biggest and the smallest signal in the room.',
      'On Mixer → Powered loudspeaker, pick LOUDSPEAKER-LEVEL AUDIO: NOT QUITE — think about the LEVEL and the KIND of what leaves the mixer. Where is this speaker’s amplifier?',
      'On Audio interface → Computer, pick POWER + DATA TOGETHER: ALSO DEFENSIBLE — many interfaces draw their power back up the same cable that carries the audio.',
    ],
  },

  // ── Lesson 2 ──────────────────────────────────────────────────────────────
  l02_anatomy: {
    seeing: [
      'THE CONNECTOR, PART BY PART: eleven chips, from PLUG and JACK to STRAIN RELIEF.',
      'INSIDE THE CABLE: seven layer chips, from CABLE JACKET to FIBER CORE & CLADDING. A card defines the chip you tapped.',
      'SEVEN CONSTRUCTIONS: a to-scale drawing of a cut cable end, with a count of builds fully peeled.',
      'KNOWLEDGE CHECK: three questions at the bottom.',
    ],
    control: [
      'Tap any part or layer chip to read its definition.',
      'Pick a construction: BALANCED PAIR (first), INSTRUMENT, SPEAKER, AC POWER, ETHERNET, COAX or FIBER.',
      'PEEL THE FIRST LAYER ›, then PEEL DEEPER ›: one layer comes off per tap, outside to inside. Each layer joins the numbered list with its job. A fully peeled chip earns a ✓.',
      'Answer the three questions; wrong picks stay open.',
    ],
    changes: [
      'Each tap names one more layer, outside to inside — the order a knife would meet them — with that layer’s job.',
      'Each build matches its job: a quiet mic signal gets a shield and a twisted pair; speaker current gets heavy conductors; light gets a core and cladding.',
      'After the last layer, FULLY PEELED — WHAT YOU CANNOT SEE FROM OUTSIDE adds the hidden detail.',
    ],
    teaches: [
      'The words every spec sheet uses: plug and jack, contacts, shell, latch, locking, strain relief.',
      'What each layer inside a jacket does, and why builds differ.',
      'It follows Lesson 1’s “what travels”. Lesson 3 uses these words to read real connectors.',
    ],
    tryThis: [
      'Peel BALANCED PAIR to the end: JACKET, SHIELD, INSULATION, then TWISTED PAIR — four layers.',
      'Peel SPEAKER: just three layers and no SHIELD. Its signal is so large that picked-up noise does not matter.',
      'Peel COAX: the SHIELD wraps a DIELECTRIC around one CENTER CONDUCTOR — and the shield is also the return path.',
    ],
  },

  // ── Lesson 3 ──────────────────────────────────────────────────────────────
  l03_analog: {
    seeing: [
      'THE ANALOG FAMILY: seven connectors drawn at one true scale. PINOUT INK KEY: the contact colors — always read with the printed label.',
      'WHY THIS ONE MATTERS, then the connector card: photo, ⚠ cautions, and sections from CONTACTS & USES to INSPECT & TEST.',
      'BALANCED VS UNBALANCED: a drawing of noise cancelling. Then four questions and ALSO RECOGNIZE.',
    ],
    control: [
      'Tap a chip or a connector in the drawing: 3-PIN XLR (first), 1/4-INCH TS, 1/4-INCH TRS, 3.5 MM TRS, 3.5 MM TRRS, RCA, COMBO XLR/TRS.',
      'Tap a section title to open or close it; CONTACTS & USES starts open. MALE / FEMALE / CABLE switch the photo where shown.',
      '⤢ FULL SCREEN under a drawing enlarges it.',
      'Solve all four questions; wrong picks stay open. ALSO RECOGNIZE browses patch, multipin and compact connectors.',
    ],
    changes: [
      'The card shows only verified facts. Each wiring is tagged STANDARD, CONVENTION or EQUIPMENT-DEPENDENT.',
      'One shell can carry several jobs, so a card can list more than one wiring.',
      'Balanced: the same noise lands on both legs of the twisted pair, and the input keeps only their difference — the noise cancels. Unbalanced: the noise stays in.',
    ],
    teaches: [
      'What each contact on XLR, TS, TRS, TRRS, RCA and the combo jack does.',
      'XLR is not automatically a mic; TRS is not automatically stereo or balanced.',
      'Balance comes from equal impedance (how a circuit resists an AC signal, in ohms) on two legs. Builds on Lesson 2’s words; Lesson 4 tests look-alike pairs.',
    ],
    tryThis: [
      'Pick 1/4-INCH TRS: CONTACTS & USES lists three wirings — balanced mono, unbalanced stereo, and a console insert.',
      'Pick 3.5 MM TRRS: two wiring orders (CTIA/AHJ and OMTP) swap the mic and ground on identical plugs.',
      'Pick RCA: WHY THIS ONE MATTERS says coaxial digital needs real 75-ohm cable — the analog lead fits but is not built for it.',
    ],
  },

  // ── Lesson 4 ──────────────────────────────────────────────────────────────
  l04_same_plug: {
    seeing: [
      'One look-alike pair at a time — ten in all, counted in the heading.',
      'For most pairs, THE PLUG BOTH CABLES WEAR draws the shared plug once, and cards A and B (C for the TRS case) show each cable cut open at one scale. Where the difference is not in the copper, the cards are text only.',
      'WHY THEY LOOK ALIKE, the question “Interchangeable?”, and three answers: YES, NO, IT DEPENDS.',
    ],
    control: [
      'Tap YES, NO or IT DEPENDS. A wrong pick shows NOT QUITE with a hint and stays open — try again.',
      'After CORRECT, read THE HONEST RESULT OF CHOOSING WRONG, then tap NEXT LOOK-ALIKE ›. The last pair shows FINISH CHECK ✓.',
      'The pairs come in a fixed order. The lesson’s credit lands when all ten are called.',
    ],
    changes: [
      'YES is never right: fit is not the test.',
      'NO when the difference is built into the cable, connector or system — gauge, shield, impedance, keying, or a protocol (a port’s data language) the device cannot change. Some add “One way only”: the better cable can do the lesser job.',
      'IT DEPENDS only when the same cable serves either job and a setting at both ends decides it (TRS assignment, optical S/PDIF vs ADAT).',
    ],
    teaches: [
      'Identical connectors can hide cables built for different jobs.',
      'Impedance (how a cable resists and shapes an AC signal, built to a set value: 50, 75, 110, 120 ohm) and conductor size matter where the plug says nothing.',
      'Some swaps work one way only. Builds on Lesson 3’s connector cards; Lesson 5 turns to loudspeakers.',
    ],
    tryThis: [
      'On the first pair (TS instrument cable vs TS speaker cable), tap YES: NOT QUITE — fit is never the test. Look again at what is behind each shell.',
      'Reach the XLR analog vs AES3 (two-channel digital audio on XLR) pair and compare cards A and B: one plug, a different cable cut open behind it.',
      'Reach the TRS pair: a third card, C, appears — one plug drawn once, three cables behind it: balanced mono, unbalanced stereo and an insert lead.',
    ],
  },

  // ── Lesson 5 ──────────────────────────────────────────────────────────────
  l05_loudspeaker: {
    seeing: [
      'THE FOUR DIFFERENT CONNECTIONS: four cards, each with WHAT TRAVELS and CONNECTORS THAT SERVE IT.',
      'THE LOUDSPEAKER CONNECTORS: six chips, a + / − ink key and the connector card.',
      'INSTRUMENT CABLE VS LOUDSPEAKER CABLE: both cut open at one scale, then SAME PLUG — DIFFERENT CABLE.',
      'ROUTING PICKS: five links to cable, counted in the heading.',
    ],
    control: [
      'Tap a connector chip: the first two are the 2-pole and 4-pole twist-lock connectors (2-pole open first), then BINDING POST, BANANA PLUG, BARE WIRE, LEGACY 1/4-INCH TS.',
      'Tap a card section title to open it. ALSO RECOGNIZE shows one more loudspeaker connector.',
      'ROUTING PICKS: for each source → destination, tap the level and cable. Wrong picks stay open; NEXT SCENARIO › moves on, and the last shows FINISH CHECK ✓.',
    ],
    changes: [
      'A powered loudspeaker has its own amplifier: it takes line level, plus its own mains cord.',
      'A passive loudspeaker has none: it takes the amplifier’s output — whole volts to over a hundred, with real current — on heavy conductors.',
      'On that current, a thin instrument cable heats, loses level and can fail. A 4-pole lead carries two circuits, for a bi-amplified box.',
    ],
    teaches: [
      'Line level, speaker level and mains: three separate jobs around one loudspeaker.',
      'Why an instrument cable must never stand in for a speaker cable.',
      'How powered and passive loudspeakers are fed. Follows Lesson 4’s look-alikes; Lesson 6 turns to digital and network links.',
    ],
    tryThis: [
      'Mixer → Powered loudspeaker: pick a SPEAKER LEVEL option — NOT QUITE. The hint: the amplifier is INSIDE this cabinet, so what does its SIGNAL input need?',
      'Power amplifier → Passive loudspeaker (full-range): pick the INSTRUMENT cable — NOT QUITE. This current needs two heavier unshielded conductors, not a shielded signal cable.',
      'Compare the two cut ends: one small conductor inside a braid shield, against two heavy conductors with no shield.',
    ],
  },

  // ── Lesson 6 ──────────────────────────────────────────────────────────────
  l06_digital: {
    seeing: [
      'The amber lead: matching ports do not prove two devices compatible.',
      'THE CONNECTORS — BROWSE ALL TEN: family chips, connector chips, an ink key, the connector card and ALSO RECOGNIZE.',
      'WHAT THE RECORDS TEACH: seven short cards, one per connector type, like USB — THE PLUG DOES NOT DEFINE THE CABLE or MIDI — INSTRUCTIONS, NOT AUDIO. They always show in full.',
      'KNOWLEDGE CHECK: four questions.',
    ],
    control: [
      'Tap a family chip — USB, NETWORK, COAX & OPTICAL, AV & CONTROL — and its first connector opens.',
      'Then tap a connector: USB-A, USB-B, USB MICRO-B, USB-C; ETHERNET 8P8C and, beside it, its locking-shell version; BNC, TOSLINK; HDMI, MIDI DIN-5.',
      'Tap a card section title to open it — CONNECTING IT holds the direction rules.',
      'Solve all four questions; wrong picks stay open.',
    ],
    changes: [
      'A connector is not a protocol (the agreed data language both devices must speak): one port shape can carry systems that cannot talk to each other.',
      'A link works only when the protocol, the cable class and the direction agree at both ends.',
      'TOSLINK carries light, not electricity. MIDI carries instructions, not sound. HDMI audio return works only between ports marked ARC or eARC.',
    ],
    teaches: [
      'Why fit proves nothing about data compatibility.',
      'USB host and device ends, network plugs shared by many systems, 50 vs 75 ohm BNC, and one-way MIDI.',
      'Follows Lesson 5’s loudspeaker links; Lesson 7 covers power and electrical safety.',
    ],
    tryThis: [
      'Read ETHERNET — ONE PLUG, MANY SYSTEMS, then tap NETWORK → ETHERNET 8P8C and compare its card: office networks, audio networks and digital snakes share one plug.',
      'Tap USB, then USB-C, and open CABLE BEHIND IT: two identical-looking USB-C cables can differ in data speed and power rating.',
      'Tap AV & CONTROL, then MIDI DIN-5, and open CONNECTING IT: data runs OUT → IN only, so two-way talk between two devices needs two cables.',
    ],
  },

  // ── Lesson 7 ──────────────────────────────────────────────────────────────
  l07_power: {
    seeing: [
      'TWO KINDS OF POWER: AC MAINS and LOW-VOLTAGE DC.',
      'THREE CONDUCTORS, THREE ROLES: a drawn wall-plug face (NEMA 5-15) and a role card.',
      'POWER CONNECTOR BROWSER · 10 RECORDS: three families, each card led by ⚠ cautions.',
      'THE NEVER LIST in red, RECOGNIZE — NEVER HANDLE, then five questions.',
    ],
    control: [
      'Tap a blade or the pin on the drawing, or its chip: NARROW BLADE (first), WIDE BLADE, ROUND PIN.',
      'Family chips: WALL & IEC, then the middle chip (the locking stage-power family), then DC & NEGOTIATED. Then a connector, from WALL PLUG and IEC C13/C14 to USB-C POWER and PoE.',
      'RECOGNIZE — NEVER HANDLE: NEMA TWIST-LOCK, STAGE PIN, CAM FEEDER, MULTICIRCUIT — for viewing only.',
      'Solve all five questions; wrong picks stay open.',
    ],
    changes: [
      'The narrow blade is line (hot), the energized conductor. The wide blade is neutral, the return.',
      'The round pin is protective earth: it gives fault current a safe path, so it is never removed or bypassed.',
      'A DC plug shows nothing about voltage, polarity or current — only the printed labels do. The wrong supply can destroy equipment.',
    ],
    teaches: [
      'How to identify power connectors and the role of each conductor.',
      'Where the line sits: identification is yours; mains wiring and repair belong to qualified persons.',
      'Follows Lesson 6; Lesson 8 puts every connection type together to select cables.',
    ],
    tryThis: [
      'Tap ROUND PIN: Protective earth — the fault-current path that protects people. Never removed, never bypassed.',
      'Tap DC & NEGOTIATED, then DC BARREL, and open CABLE BEHIND IT: nothing on the plug shows voltage, polarity or current.',
      'Read THE NEVER LIST: a ground-lift adapter is never the cure for hum — hum is diagnosed on the signal side, and the safety earth always stays.',
    ],
  },

  // ── Lesson 8 ──────────────────────────────────────────────────────────────
  l08_selection: {
    seeing: [
      'FOURTEEN CONNECTIONS TO CABLE: one chip per real connection, from MIC → MIXER to DC SUPPLY → DEVICE. ✓ marks a solved one.',
      'The DECISION heading counts the steps of the open connection.',
      'A card names the two ends and asks one question at a time: what travels, which connector, then the cable or ports, then the requirement that keeps it reliable and safe.',
    ],
    control: [
      'Tap a connection chip to work it. Progress is kept when you switch.',
      'Tap an answer. Wrong picks stay open with a hint; CORRECT or ALSO DEFENSIBLE explains why.',
      'NEXT DECISION › goes on; SOLVE CONNECTION ✓ closes the last step. NEXT CONNECTION › jumps to the next unsolved chip.',
    ],
    changes: [
      'Each answer narrows the next: what travels decides the connector, and the connector plus the job decide the cable or the ports.',
      'The last step is the requirement: a safe sequence, locking, compatibility, or a cable rating.',
      'Credit lands when all fourteen connections are solved.',
    ],
    teaches: [
      'One method for any connection: what travels, connector, cable or ports, requirement.',
      'Where several answers work, the trade-offs between them.',
      'Draws on Lessons 1–7. Lesson 9 covers handling and inspection.',
    ],
    tryThis: [
      'Work MIC → MIXER to its last step and pick NOTHING — XLR IS HOT-SAFE: NOT QUITE. The hint: a live channel pops, and +48 V phantom power has its own extra rule.',
      'On GUITAR → DI, the last step offers TS plugs on a jacket reading SPEAKER. Pick YES — THE PLUGS MATCH: NOT QUITE — what does a missing shield do to a tiny signal?',
      'Start MIXER → POWERED SPKR, then switch away and back: the step you reached is still there.',
    ],
  },

  // ── Lesson 9 ──────────────────────────────────────────────────────────────
  l09_handling: {
    seeing: [
      'CORRECT PRACTICES: twelve habit chips, from GRIP THE BODY to DEFECTIVE = OUT, and a card for the one you tapped.',
      'THE INSPECTION EYE: the names of cable faults and what each looks like.',
      'THE INSPECTION SCENE: twelve cables and connectors described in words, one at a time, counted in the heading.',
    ],
    control: [
      'Tap any practice chip to read the habit and why it matters.',
      'In the scene, judge each item: FAULT or OK. A wrong call shows NOT QUITE and stays open — look again.',
      'After CORRECT, NEXT ITEM › moves on. The last item shows FINISH INSPECTION ✓.',
    ],
    changes: [
      'A fault judged right comes with its disposition: repair by a qualified person, relabel, or remove from service.',
      'An OK item is passed for a stated reason — not because it looked fine at a glance.',
      'Credit lands when all twelve are judged correctly.',
    ],
    teaches: [
      'The handling habits that keep cables reliable: grip, latch, support, coil over-under, keep signal apart from mains.',
      'The names of faults, so the eye can find them.',
      'Follows Lesson 8. Next, the Virtual Cable Tester proves faults the eye cannot see.',
    ],
    tryThis: [
      'Tap COIL OVER-UNDER, then NO KNOTS, NO TIGHT BENDS: both cards describe damage built up inside a cable — permanent twists, and pairs that lose their geometry.',
      'Tap SIGNAL APART FROM MAINS: where signal and mains must meet, they cross at right angles.',
      'The second scene item is a power cord with only two poles. Tap FAULT: NOT QUITE — the nudge asks whether this cord was ever built with a third contact.',
    ],
  },

  // ── Tester ────────────────────────────────────────────────────────────────
  l10_tester: {
    seeing: [
      'VIRTUAL CABLE TESTER: eight leads on a bench, with a count cleared. The badge says it is simulated — a training model, not a live measurement.',
      'Once a test runs: INSIDE THE CABLE, a drawn wiring trace, and the continuity map — PATH, EXPECTED and MEASURED.',
      'A ✓ marks a reading that matches; ✕ … FAULT marks one that does not.',
    ],
    control: [
      'Tap a lead chip, A to H: three XLR mic leads, then TS, TRS, a loudspeaker lead (F), NETWORK and POWER.',
      'CONNECT BOTH ENDS ›, then RUN TEST ›. The map fills row by row.',
      'NAME THE FAULT: tap the cause. DECIDE THE DISPOSITION: PASSES — RETURN TO SERVICE, RELABEL IT AND KEEP USING IT, REPAIR (QUALIFIED PERSON), THEN RETEST, or REMOVE FROM SERVICE.',
      'Wrong picks stay open. When all eight are cleared, PRACTICE AGAIN ↻ runs the bench again.',
    ],
    changes: [
      'A continuity tester checks for a path between two contacts: CLOSED means connected, OPEN means not. Every test is de-energized: unplugged from all gear and power.',
      'DROPS ON FLEX: the path breaks when the cable bends. SPLIT: each pin lands right, but its wires come from two different twisted pairs.',
      'The pattern of ✕ rows is the fault. A cable that passes audio can still be wired wrong — only the map proves it.',
    ],
    teaches: [
      'How to read a continuity map and name the fault from it.',
      'What happens to a faulty cable: return, repair and retest, or remove from service.',
      'Follows Lesson 9’s visual inspection; the Final System Challenge comes next.',
    ],
    tryThis: [
      'Test cable A: every row ✓ — each MEASURED value matches EXPECTED.',
      'Test cable B: Pin 2 → Pin 2 reads OPEN and Pin 2 → Pin 3 reads CLOSED. What does that pattern say about pins 2 and 3?',
      'Test cable H: Round → EARTH reads OPEN. Which conductor is that, and what job does it do?',
    ],
  },

  // ── Challenge ─────────────────────────────────────────────────────────────
  l11_challenge: {
    seeing: [
      'TWO SYSTEMS TO CABLE, END TO END: tabs for SHOW A (a small live show) and STUDIO B (a small recording studio).',
      'Each opens with its scene and a stage list; ▸ marks the stage you are on and ✓ a solved one.',
      'SHOW A: SIGNAL PATH, POWER-UP SEQUENCE, FAULT HUNT. STUDIO B: SIGNAL PATH, DATA & CONTROL, FAULT HUNT.',
    ],
    control: [
      'Tap SHOW A or STUDIO B. Each keeps its own progress.',
      'Path stages: for each connection, answer WHAT TRAVELS HERE?, then the cable (or direction) question. NEXT CONNECTION › moves on; FINISH STAGE ✓ ends it.',
      'POWER-UP SEQUENCE: tap the equipment in order (tap again to remove), then CONFIRM ORDER. Stages open in order; finish one to reach the next.',
      'FAULT HUNT: tap the faulty line, then answer NAME WHY IT FAILS. PRACTICE AGAIN ↻ replays a finished show.',
    ],
    changes: [
      'Sources and processors power up first; amplification last, so nothing upstream is amplified into the room as it wakes. Power-down runs in reverse.',
      'A wrong order is cleared for another try.',
      'In FAULT HUNT, an OK line explains why it is sound; a faulty one asks why it fails. Data and control picks ask about direction too.',
    ],
    teaches: [
      'How a whole system is cabled: every source to every destination, signal kept apart from power.',
      'The safe power-up and power-down order.',
      'It draws on every lesson before it. The Final Knowledge Check comes last.',
    ],
    tryThis: [
      'In SHOW A’s POWER-UP SEQUENCE, put Powered main loudspeakers first and confirm: the order is refused and cleared.',
      'Swap the network switch and the computer in your order: either way round can be accepted — the source group’s order is flexible; only where amplification goes is fixed.',
      'In STUDIO B’s DATA & CONTROL, answer WHAT TRAVELS HERE? and the next question reads WHICH WAY AROUND? — data has direction.',
    ],
  },

  // ── Final check / what's left ─────────────────────────────────────────────
  l12_final: {
    seeing: [
      'LAB PROGRESS and a WHAT’S LEFT list: each step not yet done, with what remains. When all is done: LAB COMPLETE.',
      'GENERAL: ten questions across the whole lab.',
      'CRITICAL SAFETY: seven questions — each one must be answered correctly.',
      'REVIEW CONNECTORS › and RETRY FINAL CHALLENGE › at the bottom.',
    ],
    control: [
      'Tap a WHAT’S LEFT row to jump to that step. Rows for this page say what is left below.',
      'Tap an answer. Wrong picks stay open until you find the right one.',
      'REVIEW CONNECTORS › goes to Lesson 3; RETRY FINAL CHALLENGE › to the challenge.',
      'Here the strip’s readout says WHAT’S LEFT; the header ‹ leaves the lab.',
    ],
    changes: [
      'Each safety question records its own credit the moment it is solved. The GENERAL set records once all ten are solved.',
      'The lab completes only when every lesson check, the tester, both challenges and all seventeen questions are done.',
      'Credit already earned is never removed.',
    ],
    teaches: [
      'The whole lab in one check: identification, routing, construction, contact roles and troubleshooting.',
      'Some rules are not judgment calls: protective earth, damaged cords, speaker outputs and mains work.',
      'Next lab: Audio Connectors & Cable Selection applies this to real systems.',
    ],
    tryThis: [
      'Tap any WHAT’S LEFT row: you jump straight to that step.',
      'Answer a CRITICAL SAFETY question wrong first: it stays open, and the lab cannot complete until it is right.',
      'Tap REVIEW CONNECTORS ›: the lab jumps back to Lesson 3, THE ANALOG FAMILY, with its connector cards.',
    ],
  },
};
