/**
 * lesson07 data — "Power Connectors & Electrical Safety" (owner spec §5.7).
 * Pure data, zero React.
 *
 * SAFETY-CRITICAL: every factual statement below is drawn from (or derived
 * verbatim-faithfully from) the VERIFIED connector records in
 * connectors.power.ts and connectors.recognition.ts — per-item source notes
 * inline. Nothing here is a new claim. Scope is identification, inspection
 * and safe use ONLY — no wiring instruction anywhere.
 */
import type { ConnectorId } from '../cableTypes';
import type { ConnectorInk } from '../connectorInks';

// ─────────────────────────────────────────────────────────────────────────────
// (a) Lead card — AC mains vs low-voltage DC

export type L07Lead = { title: string; body: string };

export const L07_LEAD: L07Lead[] = [
  {
    // Sources: lesson01 ac_mains category blurb (ratified lesson copy) +
    // mains_wall.constructionNote (three conductors: line/neutral/earth).
    title: 'AC MAINS',
    body:
      'Wall power — the building’s electrical system. In a grounded cord it rides three conductors: line, neutral and protective earth. It runs the equipment, it is dangerous to handle carelessly, and it never shares a connector with signal.',
  },
  {
    // Sources: lesson01 dc_power category blurb + dc_barrel.constructionNote
    // ("nothing in the cord or the plug indicates voltage, polarity or
    // current — only the printed labels do") + dc_barrel caution ("the wrong
    // supply destroys equipment even where it cannot shock anyone").
    title: 'LOW-VOLTAGE DC',
    body:
      'Power for small devices, delivered by adapters and supplies. Voltage, polarity and current capacity must all match the device — and nothing on the plug tells you any of them; only the printed labels do. The wrong supply destroys equipment even where the voltage is too low to harm a person.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// (b) Card browser — the 10 core power records in three families

export type L07GroupId = 'wall_iec' | 'powercon' | 'dc_negotiated';

export type L07Entry = { id: ConnectorId; chip: string };

export type L07Group = {
  id: L07GroupId;
  label: string;
  /** One-line family framing — sourced from the family's own records. */
  blurb: string;
  connectors: L07Entry[];
};

export const POWER_GROUPS: L07Group[] = [
  {
    id: 'wall_iec',
    label: 'WALL & IEC',
    // Source: iec_c13_c14.constructionNote ("The coupler tells you nothing
    // about the voltage or the gauge behind it; the printed rating on the
    // cord jacket does") + friction locking on all five records.
    blurb:
      'Friction-retained mains connections. The coupler shape never tells you the voltage or the cord rating behind it — the printed markings do.',
    connectors: [
      { id: 'mains_wall', chip: 'WALL PLUG' },
      { id: 'iec_c13_c14', chip: 'IEC C13/C14' },
      { id: 'iec_c19_c20', chip: 'IEC C19/C20' },
      { id: 'iec_c5_c6', chip: 'IEC C5/C6' },
      { id: 'iec_c7_c8', chip: 'IEC C7/C8' },
    ],
  },
  {
    id: 'powercon',
    label: 'powerCON',
    // Sources: powercon_xx.constructionNote ("the locking shell changes
    // reliability, not the stakes"), both records' notInterchangeableWith
    // (families do not intermate) and hotPlug (de-energize first default).
    blurb:
      'Locking stage mains — the lock changes reliability, not the stakes. The two families do not intermate despite the shared name, and the beginner default for both is the same: de-energize before connecting or disconnecting.',
    connectors: [
      { id: 'powercon_xx', chip: 'powerCON 20 A' },
      { id: 'powercon_true1', chip: 'powerCON TRUE1' },
    ],
  },
  {
    id: 'dc_negotiated',
    label: 'DC & NEGOTIATED',
    // Sources: dc_barrel.pinouts verifyAgainst (labels govern),
    // usb_c_power.advantages ("voltage rises only after both ends agree"),
    // poe.advantages ("a compliant source powers only devices that ask for it").
    blurb:
      'Low-voltage power, three disciplines: a barrel connector trusts its printed labels, USB-C raises voltage only after negotiation, and compliant PoE powers only devices that ask for it.',
    connectors: [
      { id: 'dc_barrel', chip: 'DC BARREL' },
      { id: 'usb_c_power', chip: 'USB-C POWER' },
      { id: 'poe', chip: 'PoE' },
    ],
  },
];

/** Every diagram ink used across the ten power records' pinouts (legend). */
export const L07_INKS: ConnectorInk[] = [
  'lineHot',
  'neutral',
  'groundEarth',
  'dcPos',
  'dcNeg',
  'dataA',
  'dataB',
];

// ─────────────────────────────────────────────────────────────────────────────
// (c) The never list — flat statements, each sourced from record
//     commonMistakes / cautions / inspectionPoints. Order per owner spec.

export const NEVER_ITEMS: string[] = [
  // mains_wall.commonMistakes (ground pin removal/adaptation)
  'Removing, bending back or adapting away a ground pin so a plug will fit.',
  // mains_wall.commonMistakes (ground-lift adapter; hum solved on signal side)
  'Using a three-to-two “ground-lift” adapter to cure hum. Hum is diagnosed on the signal side — the safety earth is never the thing removed.',
  // mains_wall.commonMistakes + inspectionPoints (damaged cord in service)
  'Using a power cable with visible damage — cracked jacket, exposed conductors, heat marks.',
  // nema_twist_lock / stage_pin cautions ("never tape it up", "never tape or improvise")
  'Taping over serious damage and returning a cable to service.',
  // mains_wall.commonMistakes (cord-yanking)
  'Pulling a plug out by its cable instead of gripping the plug body.',
  // mains_wall.commonMistakes (wet hands / rain while energized)
  'Handling energized connectors with wet hands or in rain.',
  // mains_wall.commonMistakes + powercon_xx.commonMistakes (standing water)
  'Making or leaving power connections in standing water.',
  // mains_wall.inspectionPoints (missing/bent/heat-marked contacts leave service)
  'Using a connector with missing, bent or burned contacts.',
  // powercon_xx.directionality ("never force, never adapt") + iec records
  // ("never modify a coupler to force the fit"; keying protects the wiring)
  'Forcing a connector into a mating part it was not built for, or adapting across keyed families to make it fit.',
  // mains_wall.commonMistakes (male-to-male mains cable)
  'Building or using a male-to-male mains cable — for any purpose. The free end carries live, exposed pins the instant the other end is plugged in.',
  // mains_wall.safety.cautions ("Never defeat polarization or grounding";
  // GFCI required in damp/outdoor locations) + keying-protection claims.
  // Derived phrasing — flagged for owner review.
  'Bypassing any built-in protection — polarization, grounding, connector keying — or powering a damp or outdoor location without the GFCI protection it requires.',
  // powercon_xx.commonMistakes ("a loudspeaker connector is never used for
  // mains, and a mains connector is never used for loudspeakers")
  'Using a signal or loudspeaker connector for mains power, or a mains connector for loudspeakers — in either direction.',
  // mains_wall.safety.cautions ("Internal wiring, termination or repair of any
  // mains plug, cord or receptacle is qualified-person work — never beginner work")
  'Internal wiring, termination or repair of any mains connector by anyone but a qualified person.',
];

// ─────────────────────────────────────────────────────────────────────────────
// (d) Qualified-person recognition — the four records whose tier badge
//     renders the boundary. Viewing only; no exercises.

export const QP_CONNECTORS: L07Entry[] = [
  { id: 'nema_twist_lock', chip: 'NEMA TWIST-LOCK' },
  { id: 'stage_pin', chip: 'STAGE PIN' },
  { id: 'cam_type', chip: 'CAM FEEDER' },
  { id: 'socapex_style', chip: 'MULTICIRCUIT' },
];

/** Lead sentence for the qualified-person section (derived from the four
 *  records' shared cautions: recognize, keep clear, report — never handle). */
export const QP_LEAD =
  'Four more power connectors live on real stages and job sites. Your job at this level is complete when you can name each one and what it carries. Connecting, disconnecting and repairing them belongs to qualified persons — the badge on every card marks that boundary.';

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge check — 4 questions; ALL must be solved for unit credit.
// (Lesson 12 owns the persisted SAFETY_UNITS — these gate only l07_power.)

export type L07Check = {
  question: string;
  options: string[];
  correctIdx: number;
  reveal: string;
  wrongHint?: string;
};

export const L07_CHECKS: L07Check[] = [
  {
    // Source: mains_wall.commonMistakes (ground-lift adapter; hum solved on
    // the signal side) + pinout note ("Never removed, never bypassed").
    question:
      'A rack hums whenever it connects to the PA. A three-to-two “ground-lift” adapter on its power cord would silence it. What is the correct move?',
    options: [
      'Use the adapter — a clean signal matters most during the show',
      'Diagnose the hum on the signal side; the protective earth stays',
      'Remove the ground pin so no adapter is needed',
      'Lift the ground only until the hum is fixed properly',
    ],
    correctIdx: 1,
    reveal:
      'Hum is solved on the signal side — isolation transformers and proper grounding practice — never by defeating the safety earth. The earth pin is what keeps a fault from energizing the equipment chassis.',
    wrongHint: 'The protective earth is a life-safety path. Is any amount of hum worth removing it?',
  },
  {
    // Source: iec_c13_c14.commonMistakes ("damaged mains cords leave service
    // immediately") + mains_wall.commonMistakes ("because it still works").
    question:
      'An IEC power cord has a cracked coupler, but the amplifier it feeds powers up and runs fine. What happens to the cord?',
    options: [
      'It stays in service — it demonstrably works',
      'Tape the crack and keep it as a backup',
      'It leaves service immediately',
      'Downgrade it to low-power duty only',
    ],
    correctIdx: 2,
    reveal:
      'Damaged mains cords leave service immediately — cracked couplers, heat marks and loose strain reliefs disqualify a cord even when the equipment still powers up. “It still works” is not a safety test.',
    wrongHint: 'Powering up proves the circuit conducts. It proves nothing about what the damage does next.',
  },
  {
    // Source: the central lab principle (CORE_PRINCIPLE) + iec_c13_c14
    // ("treating a cord that fits as proof…") + dc_barrel ("physical fit
    // proves nothing").
    question: 'A power connector slides into an inlet with a perfect fit. What has the fit proven?',
    options: [
      'The voltage is correct for the equipment',
      'The cord is rated for the load',
      'The connection is safe to energize',
      'Only that the shapes mate — nothing else',
    ],
    correctIdx: 3,
    reveal:
      'A connector fitting into a receptacle does not prove the connection is correct or safe. The same coupler ships on cords of different gauges and regional voltages; identical barrels ship on supplies of different voltages and polarities. Ratings and labels govern — never the fit.',
    wrongHint: 'Identical plugs ship on very different cords and supplies. What does the shape alone actually tell you?',
  },
  {
    // Source: mains_wall.safety.cautions ("Internal wiring, termination or
    // repair … is qualified-person work — never beginner work").
    question: 'A mains plug on a stage cable needs rewiring. Who does that work?',
    options: [
      'Anyone careful, once the cable is unplugged',
      'Whoever is free when it fails',
      'A qualified person — and no one else',
      'A beginner, if a qualified person watches',
    ],
    correctIdx: 2,
    reveal:
      'Internal wiring, termination or repair of any mains plug, cord or receptacle is qualified-person work — never beginner work. Unplugging the cable makes it safe to inspect and report, not to rewire.',
    wrongHint: 'Being careful is not the standard here. Qualification is.',
  },
];

/** CheckDoneBanner copy once all four are genuinely solved. */
export const L07_DONE =
  'Lesson check complete — the earth stays connected, damaged cords retire, a good fit proves nothing, and mains wiring stays with qualified persons.';

/** Lesson takeaway (LessonBanner idiom) — derived from the power records'
 *  shared cautions and inspection discipline. */
export const L07_LESSON =
  'Treat power connectors with respect, not fear: know what each one carries, inspect before use, keep the protective earth intact, retire damage on sight — and leave everything inside a mains connector to a qualified person.';
