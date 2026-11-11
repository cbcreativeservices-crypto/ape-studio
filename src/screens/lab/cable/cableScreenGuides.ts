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
    intro: {
      learning: 'Twelve different things travel on cables in an audio system, from a mic’s tiny signal to AC power, and you name which one before you choose any connector.',
      start: 'Tap MIC-LEVEL AUDIO, then LOUDSPEAKER-LEVEL AUDIO, and compare the two cards. Then go to WHAT MUST TRAVEL HERE? and pick what has to travel for the first pair.',
    },
    seeing: [
      'The amber banner is this lab’s first rule: a connector’s shape doesn’t prove the connection is correct or safe.',
      'Under WHAT CAN TRAVEL THROUGH A CABLE?, twelve chips run from MIC-LEVEL AUDIO to POWER + DATA TOGETHER. The card below explains the one you tapped.',
      'WHAT MUST TRAVEL HERE? gives you nine source → destination pairs, one at a time. The heading keeps count.',
    ],
    control: [
      'Tap any category chip to read its card. MIC-LEVEL AUDIO is open first.',
      'In WHAT MUST TRAVEL HERE?, tap what has to travel between the two devices. A wrong pick shows NOT QUITE and stays open, so keep trying.',
      'A right pick shows CORRECT, or ALSO DEFENSIBLE when a second answer can be argued. Tap NEXT PAIR › to go on; the last pair shows FINISH CHECK ✓.',
      'The strip under the title moves between lessons; its readout opens CONTENTS. The header ‹ leaves the lab.',
    ],
    changes: [
      'The answer depends on what leaves the source: its level (how big the signal is) and its kind. A wrong pick’s hint points you back there.',
      'A mic makes a few thousandths of a volt. A power amplifier makes whole volts to over a hundred, with real current. Data, clock and power are different things again.',
      'So you judge each pair by the devices at the two ends, never by the sockets on them.',
    ],
    teaches: [
      'Cables in an audio system carry twelve different kinds of thing, from a mic’s few thousandths of a volt to loudspeaker current, data, clock and AC power.',
      'Professionals name WHAT travels first, because its level and kind decide the cable. The connector comes after.',
      'One cable can carry two things at once, such as audio data and the power that runs the device.',
    ],
    tryThis: [
      'Tap LOUDSPEAKER-LEVEL AUDIO, then MIC-LEVEL AUDIO, and compare the two cards: the biggest and the smallest signal in the room.',
      'On Mixer → Powered loudspeaker, pick LOUDSPEAKER-LEVEL AUDIO. NOT QUITE: think about the LEVEL and the KIND of what leaves the mixer. Where is this speaker’s amplifier?',
      'On Audio interface → Computer, pick POWER + DATA TOGETHER. You get ALSO DEFENSIBLE: many interfaces take their power from the computer over the same cable that carries the audio.',
    ],
  },

  // ── Lesson 2 ──────────────────────────────────────────────────────────────
  l02_anatomy: {
    intro: {
      learning: 'The names of a connector’s parts and the layers inside a cable, and why a mic, speaker, power, network, coax or fiber cable is built differently.',
      start: 'Under SEVEN CONSTRUCTIONS, BALANCED PAIR is ready: tap PEEL THE FIRST LAYER ›, then PEEL DEEPER › until it’s bare. Then pick SPEAKER, peel it and see which layer is missing.',
    },
    seeing: [
      'THE CONNECTOR, PART BY PART has eleven chips, from PLUG and JACK to STRAIN RELIEF: the words spec sheets use.',
      'INSIDE THE CABLE has seven layer chips, from CABLE JACKET to FIBER CORE & CLADDING. A card defines the chip you tap.',
      'SEVEN CONSTRUCTIONS draws a cut cable end to scale and counts the builds you’ve fully peeled.',
      'KNOWLEDGE CHECK, three questions, sits at the bottom.',
    ],
    control: [
      'Tap any part or layer chip to read its definition.',
      'Pick a construction: BALANCED PAIR (open first), INSTRUMENT, SPEAKER, AC POWER, ETHERNET, COAX or FIBER.',
      'Tap PEEL THE FIRST LAYER ›, then PEEL DEEPER ›. Each tap takes one layer off, outside to inside, and adds it to the numbered list with its job. A build you’ve fully peeled gets a ✓.',
      'Answer the three KNOWLEDGE CHECK questions. A wrong pick stays open, so you can try again.',
    ],
    changes: [
      'Each tap names one more layer, outside to inside — the order a knife would meet them — with that layer’s job.',
      'Each build matches its job: a quiet mic signal gets a shield and a twisted pair; speaker current gets heavy conductors; light gets a core and cladding.',
      'After the last layer, FULLY PEELED — WHAT YOU CANNOT SEE FROM OUTSIDE adds the detail the jacket hides.',
    ],
    teaches: [
      'The words every spec sheet uses: plug and jack, contacts, shell, latch, locking, strain relief.',
      'Each layer inside a jacket has a job: it protects the cable, keeps noise out, insulates one conductor from another, or carries the signal.',
      'Builds differ because signals differ: a tiny signal needs protection from noise, a large current needs heavy copper, and light needs a core that guides it.',
    ],
    tryThis: [
      'Peel BALANCED PAIR to the end: JACKET, SHIELD, INSULATION, then TWISTED PAIR. Four layers look after one quiet signal.',
      'Peel SPEAKER: just three layers and no SHIELD. Its signal is strong and the speaker circuit is only a few ohms, so any noise it picks up stays tiny beside it.',
      'Peel COAX: the SHIELD wraps a DIELECTRIC around one CENTER CONDUCTOR, and the shield is also the signal’s return path.',
    ],
  },

  // ── Lesson 3 ──────────────────────────────────────────────────────────────
  l03_analog: {
    intro: {
      learning: 'What each contact on the common analog connectors does, why XLR doesn’t always mean mic or TRS always mean stereo, and how a balanced line cancels noise.',
      start: '3-PIN XLR is open: read CONTACTS & USES. Then tap 1/4-INCH TRS and count its wirings. Scroll down to BALANCED VS UNBALANCED to see the noise cancel.',
    },
    seeing: [
      'THE ANALOG FAMILY draws seven connectors at one scale, so you see their real sizes side by side. PINOUT INK KEY colors each contact; always read it with the printed label.',
      'Then WHY THIS ONE MATTERS and the connector card: photo, ⚠ cautions, and sections from CONTACTS & USES to INSPECT & TEST.',
      'BALANCED VS UNBALANCED shows noise cancelling. Four questions and ALSO RECOGNIZE follow.',
    ],
    control: [
      'Tap a chip or a connector in the drawing: 3-PIN XLR (open first), 1/4-INCH TS, 1/4-INCH TRS, 3.5 MM TRS, 3.5 MM TRRS, RCA, COMBO XLR/TRS.',
      'Tap a section title to open or close it; CONTACTS & USES starts open. MALE / FEMALE / CABLE switch the photo where shown.',
      'Tap ⤢ FULL SCREEN under a drawing to enlarge it.',
      'Solve all four questions; wrong picks stay open. ALSO RECOGNIZE browses patch, multipin and compact connectors.',
    ],
    changes: [
      'Each wiring on a card is tagged STANDARD, CONVENTION or EQUIPMENT-DEPENDENT, so you know whether to check the gear’s manual before you trust it.',
      'One shell can carry several jobs, so a card can list more than one wiring.',
      'Balanced: the same noise lands on both legs of the twisted pair, and the input keeps only their difference — the noise cancels. Unbalanced: the noise stays in.',
    ],
    teaches: [
      'What each contact on XLR, TS, TRS, TRRS, RCA and the combo jack does.',
      'XLR is not automatically a mic; TRS is not automatically stereo or balanced. The wiring and the gear decide.',
      'A line is balanced when its two legs have equal impedance (how a circuit resists an AC signal, in ohms). That match is what lets the noise cancel.',
    ],
    tryThis: [
      'Pick 1/4-INCH TRS: CONTACTS & USES lists three wirings — balanced mono, unbalanced stereo, and a console insert. One plug, three jobs.',
      'Pick 3.5 MM TRRS: two wiring orders (CTIA/AHJ and OMTP) swap the mic and ground on plugs that look identical.',
      'Pick RCA: WHY THIS ONE MATTERS says coaxial digital needs real 75-ohm cable. An analog RCA cable fits, but it isn’t built for it.',
    ],
  },

  // ── Lesson 4 ──────────────────────────────────────────────────────────────
  l04_same_plug: {
    intro: {
      learning: 'Identical plugs can hide cables built for different jobs: gauge, shield, impedance and protocol decide whether two look-alikes can swap, not whether they fit.',
      start: 'On the first pair, compare cards A and B, then answer “Interchangeable?” with YES, NO or IT DEPENDS. After CORRECT, read THE HONEST RESULT OF CHOOSING WRONG.',
    },
    seeing: [
      'Ten look-alike pairs, one at a time; the heading keeps count.',
      'For most pairs, THE PLUG BOTH CABLES WEAR draws the shared plug once, and cards A and B (C for the TRS case) show each cable cut open at one scale. When the difference isn’t in the copper, the cards are text only.',
      'WHY THEY LOOK ALIKE, the question “Interchangeable?”, and three answers: YES, NO, IT DEPENDS.',
    ],
    control: [
      'Tap YES, NO or IT DEPENDS. A wrong pick shows NOT QUITE with a hint and stays open, so try again.',
      'After CORRECT, read THE HONEST RESULT OF CHOOSING WRONG, then tap NEXT LOOK-ALIKE ›. The last pair shows FINISH CHECK ✓.',
      'The pairs always come in the same order. The check is done when you’ve called all ten.',
    ],
    changes: [
      'YES is never right: fit is not the test.',
      'NO when the difference is built into the cable, connector or system — gauge, shield, impedance, keying, or a protocol (a port’s data language) the device can’t change. Some pairs add “One way only”: the better one does the lesser job.',
      'IT DEPENDS only when the same cable serves either job and a setting at both ends decides it (TRS assignment, optical S/PDIF vs ADAT).',
    ],
    teaches: [
      'Identical connectors can hide cables built for different jobs.',
      'Impedance (how a cable resists and shapes an AC signal, built to a set value: 50, 75, 110, 120 ohm) and conductor size matter where the plug says nothing.',
      'Some swaps work one way only: the cable built for the harder job can do the easier one, but not the reverse.',
    ],
    tryThis: [
      'On the first pair (TS instrument cable vs TS speaker cable), tap YES: NOT QUITE — fit is never the test. Look again at what is behind each shell.',
      'Reach the XLR analog vs AES3 pair (AES3 is two-channel digital audio on XLR). Compare cards A and B: one plug, a different cable cut open behind it.',
      'Reach the TRS pair: a third card, C, appears — one plug drawn once, three cables behind it: balanced mono, unbalanced stereo and an insert cable.',
    ],
  },

  // ── Lesson 5 ──────────────────────────────────────────────────────────────
  l05_loudspeaker: {
    intro: {
      learning: 'Line level, speaker level and AC power are three separate jobs around one loudspeaker, and a powered loudspeaker is fed differently from a passive one.',
      start: 'Read THE FOUR DIFFERENT CONNECTIONS first. Then compare the two cut ends under INSTRUMENT CABLE VS LOUDSPEAKER CABLE, and work the first scenario in ROUTING PICKS.',
    },
    seeing: [
      'THE FOUR DIFFERENT CONNECTIONS: four cards, each with WHAT TRAVELS and CONNECTORS THAT SERVE IT.',
      'THE LOUDSPEAKER CONNECTORS: six chips, a + / − ink key for polarity, and the connector card.',
      'INSTRUMENT CABLE VS LOUDSPEAKER CABLE cuts both open at one scale, then SAME PLUG — DIFFERENT CABLE.',
      'ROUTING PICKS: five links for you to cable, counted in the heading.',
    ],
    control: [
      'Tap a connector chip. The first two are the 2-pole and 4-pole twist-lock connectors (2-pole opens first), then BINDING POST, BANANA PLUG, BARE WIRE and LEGACY 1/4-INCH TS.',
      'Tap a card section title to open it. ALSO RECOGNIZE shows one more loudspeaker connector.',
      'In ROUTING PICKS, tap the level and the cable for each source → destination. A wrong pick stays open; NEXT SCENARIO › moves on, and the last shows FINISH CHECK ✓.',
    ],
    changes: [
      'A powered loudspeaker has its own amplifier inside: it takes line level, plus its own power cord for AC power.',
      'A passive loudspeaker has none. It takes the amplifier’s output, whole volts to over a hundred with real current, on heavy conductors.',
      'On that current, a thin instrument cable heats, loses level and can fail. A 4-pole cable carries two circuits, for a bi-amplified box (fed by two amp channels).',
    ],
    teaches: [
      'Line level, speaker level and AC power are three separate jobs around one loudspeaker, each on its own cable.',
      'An instrument cable must never stand in for a speaker cable: its thin conductor can’t safely carry amplifier current.',
      'How a powered loudspeaker and a passive one are each fed, and why that decides the level and the cable.',
    ],
    tryThis: [
      'Mixer → Powered loudspeaker: pick a SPEAKER LEVEL option — NOT QUITE. The hint: the amplifier is INSIDE this cabinet, so what does its SIGNAL input need?',
      'Power amplifier → Passive loudspeaker (full-range): pick the INSTRUMENT cable. NOT QUITE: this current needs two heavier unshielded conductors, not a shielded signal cable.',
      'Compare the two cut ends: one small conductor inside a braid shield, against two heavy conductors with no shield. Which one is built for real current?',
    ],
  },

  // ── Lesson 6 ──────────────────────────────────────────────────────────────
  l06_digital: {
    intro: {
      learning: 'Matching ports don’t prove two devices can talk: a digital link works only when the protocol, the cable class and the direction agree at both ends.',
      start: 'Tap the USB family chip, then USB-C, and open CABLE BEHIND IT. Then read the WHAT THE CARDS TEACH cards before you try the four questions.',
    },
    seeing: [
      'The amber note at the top: matching ports do not prove two devices compatible.',
      'THE CONNECTORS — BROWSE ALL TEN: family chips, connector chips, an ink key, the connector card and ALSO RECOGNIZE.',
      'WHAT THE CARDS TEACH: seven short cards, like USB — THE PLUG DOES NOT DEFINE THE CABLE or MIDI — INSTRUCTIONS, NOT AUDIO. They always show in full.',
      'KNOWLEDGE CHECK: four questions.',
    ],
    control: [
      'Tap a family chip — USB, NETWORK, COAX & OPTICAL, AV & CONTROL — and its first connector opens.',
      'Then tap a connector: USB-A, USB-B, USB MICRO-B, USB-C; ETHERNET 8P8C and, beside it, its locking-shell version; BNC, TOSLINK; HDMI, MIDI DIN-5.',
      'Tap a card section title to open it. CONNECTING IT holds the direction rules: which end the data leaves and which end it enters.',
      'Solve all four questions; a wrong pick stays open.',
    ],
    changes: [
      'A connector is not a protocol (the agreed data language both devices must speak). One port shape can carry systems that cannot talk to each other.',
      'A link works only when the protocol, the cable class and the direction agree at both ends.',
      'TOSLINK carries light, not electricity. MIDI carries instructions, not sound. HDMI audio return works only between ports marked ARC or eARC.',
    ],
    teaches: [
      'A plug that fits proves nothing about data compatibility.',
      'USB has a host end and a device end, and one network plug is shared by many systems that can’t talk to each other.',
      'BNC comes in 50 and 75 ohm versions, and MIDI runs one way only.',
    ],
    tryThis: [
      'Read ETHERNET — ONE PLUG, MANY SYSTEMS, then tap NETWORK → ETHERNET 8P8C and compare its card: office networks, audio networks and digital snakes share one plug.',
      'Tap USB, then USB-C, and open CABLE BEHIND IT: two USB-C cables that look identical can differ in data speed and power rating.',
      'Tap AV & CONTROL, then MIDI DIN-5, and open CONNECTING IT: data runs OUT → IN only, so two-way talk between two devices needs two cables.',
    ],
  },

  // ── Lesson 7 ──────────────────────────────────────────────────────────────
  l07_power: {
    intro: {
      learning: 'How AC power differs from low-voltage DC, what each conductor in a wall plug does, and why the safety ground is never removed or bypassed.',
      start: 'Tap NARROW BLADE, WIDE BLADE and ROUND PIN on the drawn wall plug and read each role. Then read THE NEVER LIST in red.',
    },
    seeing: [
      'TWO KINDS OF POWER sets AC POWER beside LOW-VOLTAGE DC.',
      'THREE CONDUCTORS, THREE ROLES: a drawn North American wall-plug face (NEMA 5-15) and a role card for the part you tap.',
      'POWER CONNECTOR BROWSER · 10 CONNECTORS: three families, and every card opens with its ⚠ cautions.',
      'THE NEVER LIST in red, RECOGNIZE — NEVER HANDLE, then five questions.',
    ],
    control: [
      'Tap a blade or the pin on the drawing, or its chip: NARROW BLADE (first), WIDE BLADE, ROUND PIN.',
      'Tap a family chip: WALL & IEC, then the middle chip (the locking stage-power family), then DC & NEGOTIATED. Then tap a connector, from WALL PLUG and IEC C13/C14 to USB-C POWER and PoE.',
      'RECOGNIZE — NEVER HANDLE shows NEMA TWIST-LOCK, STAGE PIN, CAM FEEDER and MULTICIRCUIT. Look only: handling them belongs to qualified persons.',
      'Solve all five questions; a wrong pick stays open.',
    ],
    changes: [
      'On this North American plug the narrow blade is line (hot), the energized conductor; the wide blade is neutral, the return.',
      'The round pin is safety ground: it gives fault current a safe path, so it is never removed or bypassed.',
      'A DC plug shows nothing about voltage, polarity or current — only the printed labels do. The wrong supply can destroy equipment.',
    ],
    teaches: [
      'A power connector is identified by its shape and its printed labels, and each AC conductor has one role: line (hot), neutral or safety ground.',
      'Know your limit: identifying connectors is your part; AC wiring and repair belong to qualified persons.',
      'Hum is traced on the signal side; lifting the safety ground is never the cure.',
    ],
    tryThis: [
      'Tap ROUND PIN: Safety ground — the fault-current path that protects people. Never removed, never bypassed.',
      'Tap DC & NEGOTIATED, then DC BARREL, and open CABLE BEHIND IT: nothing on the plug shows voltage, polarity or current.',
      'Read THE NEVER LIST: a ground-lift adapter is never the cure for hum. Hum is diagnosed on the signal side, and the safety ground always stays.',
    ],
  },

  // ── Lesson 8 ──────────────────────────────────────────────────────────────
  l08_selection: {
    intro: {
      learning: 'One method works for any connection: name what travels, then the connector, then the cable or ports, then the requirement that keeps it reliable and safe.',
      start: 'Tap MIC → MIXER and answer each DECISION in turn. At the last step, think about what a live channel does before you pick.',
    },
    seeing: [
      'FOURTEEN CONNECTIONS TO CABLE: one chip per real connection, from MIC → MIXER to DC SUPPLY → DEVICE. A ✓ marks one you’ve solved.',
      'The DECISION heading shows which step of the open connection you’re on.',
      'A card names the two ends and asks one question at a time: what travels, which connector, then the cable or ports, then the requirement that keeps it reliable and safe.',
    ],
    control: [
      'Tap a connection chip to work it. Your progress is kept when you switch.',
      'Tap an answer. A wrong pick stays open with a hint; CORRECT or ALSO DEFENSIBLE explains why.',
      'NEXT DECISION › goes on; SOLVE CONNECTION ✓ closes the last step. NEXT CONNECTION › jumps to the next unsolved chip.',
    ],
    changes: [
      'Each answer narrows the next: what travels decides the connector, and the connector plus the job decide the cable or the ports.',
      'The last step is the requirement: a safe sequence, locking, compatibility, or a cable rating.',
      'ALSO DEFENSIBLE means a second answer can be argued too; the card explains the trade-off.',
    ],
    teaches: [
      'One method for any connection: what travels, connector, cable or ports, requirement.',
      'Where several answers work, each one comes with a trade-off.',
      'A connector that fits isn’t the whole answer: the job can still demand a safe sequence, a locking connector or a rated cable.',
    ],
    tryThis: [
      'Work MIC → MIXER to its last step and pick NOTHING — XLR IS HOT-SAFE. NOT QUITE: a live channel pops, and +48 V phantom power has its own extra rule.',
      'On GUITAR → DI, the last step offers TS plugs on a jacket reading SPEAKER. Pick YES — THE PLUGS MATCH. NOT QUITE: what does a missing shield do to a tiny signal?',
      'Start MIXER → POWERED SPKR, then switch away and back: the step you reached is still there.',
    ],
  },

  // ── Lesson 9 ──────────────────────────────────────────────────────────────
  l09_handling: {
    intro: {
      learning: 'The everyday habits that keep cables reliable, and the names of the faults you can spot by eye, so a damaged cable is caught before it fails.',
      start: 'Tap GRIP THE BODY and COIL OVER-UNDER to read why each habit matters. Then go to THE INSPECTION SCENE and judge the first item: FAULT or OK.',
    },
    seeing: [
      'CORRECT PRACTICES: twelve habit chips, from GRIP THE BODY to DEFECTIVE = OUT. A card explains the one you tap.',
      'THE INSPECTION EYE names the common cable faults and shows what each one looks like.',
      'THE INSPECTION SCENE: twelve cables and connectors described in words, one at a time; the heading keeps count.',
    ],
    control: [
      'Tap any practice chip to read the habit and why it matters.',
      'In the scene, judge each item: FAULT or OK. A wrong call shows NOT QUITE and stays open, so look again.',
      'After CORRECT, NEXT ITEM › moves on. The last item shows FINISH INSPECTION ✓.',
    ],
    changes: [
      'A fault you judge right comes with what happens to it next: repair by a qualified person, relabel, or remove from service.',
      'An OK item passes for a stated reason, not because it looked fine at a glance.',
      'Some damage builds up inside a cable where you can’t see it, so the habits that prevent it matter as much as the inspection.',
    ],
    teaches: [
      'The handling habits that keep cables reliable: grip the body, latch, support, coil over-under, and keep signal apart from AC power.',
      'The names of cable faults, so your eye knows what to look for.',
      'Some damage, like permanent twists or a pair that loses its geometry, starts inside the cable before anything shows on the outside.',
    ],
    tryThis: [
      'Tap COIL OVER-UNDER, then NO KNOTS, NO TIGHT BENDS: both cards describe damage built up inside a cable — permanent twists, and pairs that lose their geometry.',
      'Tap SIGNAL APART FROM AC POWER: where signal and AC power cables must meet, they cross at right angles.',
      'The second scene item is a power cord with only two poles. Tap FAULT: NOT QUITE — the nudge asks whether this cord was ever built with a third contact.',
    ],
  },

  // ── Tester ────────────────────────────────────────────────────────────────
  l10_tester: {
    intro: {
      learning: 'A continuity map shows how a cable is wired inside: its CLOSED and OPEN paths reveal faults the eye can’t see, even in a cable that still passes audio.',
      start: 'Tap cable A, then CONNECT BOTH ENDS › and RUN TEST ›, and watch the map fill. Then test cable B and compare its MEASURED column with EXPECTED.',
    },
    seeing: [
      'VIRTUAL CABLE TESTER: eight cables on a bench, with a count of those cleared. The badge says it’s simulated: a training model, not a live measurement.',
      'Once a test runs: INSIDE THE CABLE, a drawn wiring trace, and the continuity map — PATH, EXPECTED and MEASURED.',
      'A ✓ marks a reading that matches; ✕ … FAULT marks one that does not.',
    ],
    control: [
      'Tap a cable chip, A to H: three XLR mic cables, then TS, TRS, a loudspeaker cable (F), NETWORK and POWER.',
      'Tap CONNECT BOTH ENDS ›, then RUN TEST ›. The map fills row by row.',
      'Under NAME THE FAULT, tap the cause. Under DECIDE THE DISPOSITION, choose PASSES — RETURN TO SERVICE, RELABEL IT AND KEEP USING IT, REPAIR (QUALIFIED PERSON), THEN RETEST, or REMOVE FROM SERVICE.',
      'Wrong picks stay open. When all eight are cleared, PRACTICE AGAIN ↻ runs the bench again.',
    ],
    changes: [
      'A continuity tester checks for a path between two contacts: CLOSED means connected, OPEN means not. Every test is de-energized: unplugged from all gear and power.',
      'DROPS ON FLEX: the path breaks when the cable bends. SPLIT: every pin lands right, so plain continuity passes; only the Pair rows catch it.',
      'The ✕ rows show the fault. A cable that passes audio can still be wired wrong — only the map proves it.',
    ],
    teaches: [
      'A continuity map shows, contact by contact, whether a cable is wired as it should be; the pattern of ✕ rows names the fault.',
      'A tested cable goes back into service, is relabeled, is repaired by a qualified person and retested, or is removed from service.',
      'Some faults hide from a quick check: one only breaks when the cable bends, another passes plain continuity.',
    ],
    tryThis: [
      'Test cable A: every row ✓ — each MEASURED value matches EXPECTED. This is what a good cable looks like.',
      'Test cable B: Pin 2 → Pin 2 reads OPEN and Pin 2 → Pin 3 reads CLOSED. What does that pattern say about pins 2 and 3?',
      'Test cable H: Round → GROUND reads OPEN. Which conductor is that, and what job does it do?',
    ],
  },

  // ── Challenge ─────────────────────────────────────────────────────────────
  l11_challenge: {
    intro: {
      learning: 'How a whole system is cabled end to end, with signal kept apart from power, and the safe order to power it up and down.',
      start: 'Tap SHOW A and work SIGNAL PATH, answering WHAT TRAVELS HERE? for each connection. Then build the POWER-UP SEQUENCE and tap CONFIRM ORDER.',
    },
    seeing: [
      'TWO SYSTEMS TO CABLE, END TO END: tabs for SHOW A (a small live show) and STUDIO B (a small recording studio).',
      'Each opens with its scene and a stage list; ▸ marks the stage you’re on and ✓ one you’ve solved.',
      'SHOW A: SIGNAL PATH, POWER-UP SEQUENCE, FAULT HUNT. STUDIO B: SIGNAL PATH, DATA & CONTROL, FAULT HUNT.',
    ],
    control: [
      'Tap SHOW A or STUDIO B. Each keeps its own progress.',
      'In a path stage, answer WHAT TRAVELS HERE? for each connection, then the cable (or direction) question. NEXT CONNECTION › moves on; FINISH STAGE ✓ ends it.',
      'In POWER-UP SEQUENCE, tap the equipment in order (tap again to remove), then CONFIRM ORDER. Stages open in order: finish one to reach the next.',
      'In FAULT HUNT, tap the faulty line, then answer NAME WHY IT FAILS. PRACTICE AGAIN ↻ replays a finished show.',
    ],
    changes: [
      'Sources and processors power up first; amplification last, so nothing upstream is amplified into the room as it wakes. Power-down runs in reverse.',
      'A wrong order is cleared so you can try again.',
      'In FAULT HUNT, an OK line explains why it is sound; a faulty one asks why it fails. Data and control picks ask about direction too.',
    ],
    teaches: [
      'How a whole system is cabled: every source to every destination, signal kept apart from power.',
      'The safe power-up and power-down order, and why switching amplification on last and off first protects the room and the gear.',
      'Data has direction: a data or control link needs each end the right way around.',
    ],
    tryThis: [
      'In SHOW A’s POWER-UP SEQUENCE, put Powered main loudspeakers first and confirm: the order is refused and cleared. Why can’t they go first?',
      'Swap the network switch and the computer in your order: either way around can be accepted. The source group’s order is flexible; only where amplification goes is fixed.',
      'In STUDIO B’s DATA & CONTROL, answer WHAT TRAVELS HERE? and the next question reads WHICH WAY AROUND? — data has direction.',
    ],
  },

  // ── Final check / what's left ─────────────────────────────────────────────
  l12_final: {
    intro: {
      learning: 'A review of the whole lab: identification, routing, construction, contact roles and troubleshooting, plus the safety rules that are never judgment calls.',
      start: 'Look at WHAT’S LEFT and tap any row to finish that step. Then answer the ten GENERAL questions and the seven CRITICAL SAFETY questions.',
    },
    seeing: [
      'A WHAT’S LEFT list: each step not yet done, with what remains. When everything is done, you see LAB COMPLETE.',
      'GENERAL: ten questions across the whole lab.',
      'CRITICAL SAFETY: seven questions, and each one must be answered correctly.',
      'REVIEW CONNECTORS › and RETRY FINAL CHALLENGE › sit at the bottom.',
    ],
    control: [
      'Tap a WHAT’S LEFT row to jump to that step. A row for this page tells you what is still left further down.',
      'Tap an answer. A wrong pick stays open until you find the right one.',
      'REVIEW CONNECTORS › takes you to Lesson 3; RETRY FINAL CHALLENGE › to the challenge.',
      'Here the strip’s readout says WHAT’S LEFT; the header ‹ leaves the lab.',
    ],
    changes: [
      'Each CRITICAL SAFETY question counts the moment you solve it. The GENERAL set counts once all ten are solved.',
      'The lab completes only when every lesson check, the tester, both challenges and all seventeen questions are done.',
      'Safety questions must each be right because these rules protect people: a safety ground is either there or it isn’t.',
    ],
    teaches: [
      'The whole lab in one check: identification, routing, construction, contact roles and troubleshooting.',
      'Some rules are not judgment calls: safety ground, damaged cords, speaker outputs and AC power work.',
      'Every cable decision starts the same way: name what travels, then choose the connector and the cable to suit it.',
    ],
    tryThis: [
      'Tap any WHAT’S LEFT row: you jump straight to that step.',
      'Answer a CRITICAL SAFETY question wrong first: it stays open, and the lab can’t complete until it’s right.',
      'Tap REVIEW CONNECTORS ›: you jump back to Lesson 3, THE ANALOG FAMILY, with its connector cards.',
    ],
  },
};
