/**
 * lesson02 data — "Cable & Connector Anatomy" (owner spec §5.2).
 * The shared vocabulary (connector parts + cable layers) and the seven
 * cable cross-sections as ordered outside→inside layer lists. Pure data,
 * zero React.
 *
 * FACT DISCIPLINE: definitions are generic textbook-level anatomy — no
 * ratings, no pinouts (those live in the verified connector records). Every
 * construction description is consistent with — and where possible derived
 * verbatim-faithfully from — the records' constructionNote fields and the
 * CableSectionId layer comments in cableTypes.ts.
 */
import type { CableSectionId } from '../cableTypes';
import type { CheckSpec } from '../../foundations/bits';

// ─────────────────────────────────────────────────────────────────────────────
// Term explorer (§5.2a) — two groups: on the connector / inside the cable

export type AnatomyTerm = {
  id: string;
  label: string;
  def: string;
};

/** Connector-side vocabulary (generic anatomy; consistent with the Locking
 *  methods and strain-relief notes in the verified records). */
export const CONNECTOR_TERMS: AnatomyTerm[] = [
  {
    id: 'plug',
    label: 'PLUG',
    def: 'The connector on the end of a cable — the part you hold and insert. “Plug” names the cable-mounted half of a connection, whatever its shape.',
  },
  {
    id: 'jack',
    label: 'JACK',
    def: 'The fixed connector a plug goes into, mounted on equipment or a panel. Plug and jack are a pair: one travels with the cable, the other stays put.',
  },
  {
    id: 'socket_receptacle',
    label: 'SOCKET / RECEPTACLE',
    def: 'Other names for the fixed, receiving side of a connection. “Receptacle” is the formal word — heard most around power connectors — but all three name the half that stays mounted.',
  },
  {
    id: 'male_female',
    label: 'MALE / FEMALE CONTACTS',
    def: 'Male contacts are exposed pins that insert; female contacts are the sprung openings that receive them. The words describe the CONTACTS, not the outer body — a connector shell can enclose contacts of either kind.',
  },
  {
    id: 'pins_numbers',
    label: 'PINS & CONTACT NUMBERS',
    def: 'Pins are a connector’s individual metal contacts. Each carries a number, usually molded or printed beside it, so documentation can name one contact unambiguously. What a numbered pin DOES belongs to that connector’s verified pinout — never to the shape alone.',
  },
  {
    id: 'tip_ring_sleeve',
    label: 'TIP / RING / SLEEVE',
    def: 'The contact regions of a phone-style plug, separated by insulating bands: the tip at the point, the sleeve along the barrel, and any rings between them. TS, TRS and TRRS count those regions. The names describe POSITION on the plug — not what signal each region carries.',
  },
  {
    id: 'shell',
    label: 'SHELL',
    def: 'The connector’s outer body. It protects the contacts, gives your hand a grip surface, and takes the mechanical abuse so the electrical parts don’t have to.',
  },
  {
    id: 'latch',
    label: 'LATCH',
    def: 'A spring catch that holds a mated connector seated until it is deliberately released — press the release tab, THEN pull. A latched connector that will not pull free is doing its job, not stuck.',
  },
  {
    id: 'locking',
    label: 'LOCKING MECHANISM',
    def: 'Any design that keeps a connection from pulling apart: latches, twist-locks, screw rings, bayonets, push-pull sleeves. Each has its own confirm-and-release action — knowing the mechanism means knowing how to check it is engaged and how to undo it without force.',
  },
  {
    id: 'termination',
    label: 'SOLDER / SCREW / CRIMP',
    def: 'Termination: how the cable’s conductors attach to the connector’s contacts — melted into a soldered joint, clamped under a screw, or compressed inside a crimped sleeve by a matched tool. Done well, all three are reliable; done badly, the termination is where the connection fails.',
  },
  {
    id: 'strain_relief',
    label: 'STRAIN RELIEF',
    def: 'The part that grips the cable jacket where it enters the connector, so pulling and flexing load the tough jacket instead of the delicate terminations. It is often the single biggest factor in how long a cable lives.',
  },
];

/** Cable-side vocabulary (generic anatomy; consistent with the records'
 *  constructionNote fields). */
export const CABLE_TERMS: AnatomyTerm[] = [
  {
    id: 'jacket',
    label: 'CABLE JACKET',
    def: 'The cable’s outermost layer: mechanical protection, and the cable’s identity. The printing on the jacket is how a cable tells you what it is — the plug on the end cannot.',
  },
  {
    id: 'conductors',
    label: 'CONDUCTORS',
    def: 'The metal paths, usually copper, that actually carry the signal or the power. Everything else in a cable exists to protect, separate and organize the conductors.',
  },
  {
    id: 'insulation',
    label: 'INSULATION',
    def: 'The non-conductive coating around each individual conductor. It keeps the metal paths from touching, and its coloring is how one conductor is told apart from another during termination.',
  },
  {
    id: 'shield',
    label: 'SHIELD (BRAID / FOIL / DRAIN)',
    def: 'A conductive layer wrapped around the conductors to intercept outside interference. A braid shield is woven wire; a foil shield is a thin metal film; a drain wire is a bare conductor running against a foil so the foil can be terminated cleanly. Cables may use braid, foil, or both.',
  },
  {
    id: 'twisted_pair',
    label: 'TWISTED PAIR',
    def: 'Two insulated conductors twisted around each other. The twist means interference reaches both conductors nearly equally — which is what lets the receiving equipment reject it.',
  },
  {
    id: 'dielectric',
    label: 'DIELECTRIC',
    def: 'The insulating spacer between a coaxial cable’s center conductor and its shield. Its material and exact dimensions set the cable’s electrical character — a property you cannot see from outside.',
  },
  {
    id: 'fiber',
    label: 'FIBER CORE & CLADDING',
    def: 'In an optical cable, the core is the light-carrying center; the cladding around it keeps the light trapped inside the core. There is no metal and no electrical current — the signal is light.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// The seven cross-sections (§5.2b) — ordered OUTSIDE → INSIDE layer reveals.
// Layer sets follow the CableSectionId comments in cableTypes.ts; every note
// is derived verbatim-faithfully from a verified record's constructionNote.

export type SectionLayer = {
  /** Layer name as revealed (outside → inside). */
  name: string;
  role: string;
};

export type CrossSection = {
  id: CableSectionId;
  /** Short selector-chip label. */
  chip: string;
  /** Full card title. */
  label: string;
  /** One line: what this build exists to do. */
  tagline: string;
  /** OUTSIDE → INSIDE. */
  layers: SectionLayer[];
  /** Takeaway shown once fully peeled — what you cannot see from outside. */
  note: string;
};

export const CROSS_SECTIONS: CrossSection[] = [
  {
    id: 'balanced_shielded',
    chip: 'BALANCED PAIR',
    label: 'BALANCED SHIELDED PAIR',
    tagline: 'The conventional build behind microphone and balanced line cables.',
    layers: [
      { name: 'JACKET', role: 'Outer protection — and the printed identity of the cable.' },
      {
        name: 'SHIELD',
        role: 'Braid, foil, or both, wrapped around everything inside; intercepts interference before it reaches the pair.',
      },
      { name: 'INSULATION', role: 'A color-coded coat on each of the two conductors.' },
      { name: 'TWISTED PAIR', role: 'Two conductors twisted together — the balanced pair that carries the signal.' },
    ],
    note:
      'This is the conventional microphone-cable build: two conductors for the balanced pair, plus an overall shield. The connector does not guarantee the construction — an unknown cable must be verified, not assumed.',
  },
  {
    id: 'instrument_unbalanced',
    chip: 'INSTRUMENT',
    label: 'UNBALANCED INSTRUMENT CABLE',
    tagline: 'Built to move a tiny high-impedance signal quietly.',
    layers: [
      { name: 'JACKET', role: 'Outer protection and the printed identity.' },
      { name: 'SHIELD', role: 'Surrounds the single conductor and doubles as the signal’s return path.' },
      { name: 'INSULATION', role: 'Keeps the center conductor centered and separated from the shield.' },
      { name: 'CENTER CONDUCTOR', role: 'One small-gauge conductor carrying the signal.' },
    ],
    note:
      'One small conductor inside a shield. Remember this build — a speaker cable can wear the identical plug and be built completely differently inside.',
  },
  {
    id: 'speaker_2c',
    chip: 'SPEAKER',
    label: '2-CONDUCTOR SPEAKER CABLE',
    tagline: 'Two heavier conductors built to move amplifier current.',
    layers: [
      { name: 'JACKET', role: 'Outer protection and the printed identity.' },
      { name: 'INSULATION', role: 'A heavy coat on each conductor; the marking tells the two apart.' },
      { name: 'TWO HEAVY CONDUCTORS', role: 'Sized for the current, the run length, and the load.' },
    ],
    note:
      'What is MISSING matters here: no shield anywhere in this build, and much heavier conductors than any signal cable. The plug does not tell you which cable you are holding — the jacket printing and the construction do.',
  },
  {
    id: 'ac_3c_grounded',
    chip: 'AC POWER',
    label: '3-CONDUCTOR GROUNDED AC CORD',
    tagline: 'Wall power on the move: line, neutral, and protective earth.',
    layers: [
      { name: 'JACKET', role: 'Tough outer cover; the printed rating on it governs what the cord may carry.' },
      { name: 'INSULATION', role: 'Each of the three conductors wears its own insulation, colored to a regional code.' },
      { name: 'THREE CONDUCTORS', role: 'Line, neutral, and protective earth.' },
    ],
    note:
      'Conductor colors are a regional code, not a worldwide one — recognition knowledge only. Cord wiring and plug termination are qualified-person work; this cross-section is for recognition, never for rewiring.',
  },
  {
    id: 'ethernet_4pair',
    chip: 'ETHERNET',
    label: '4-PAIR ETHERNET CABLE',
    tagline: 'Four twisted pairs, each twisted at its own rate.',
    layers: [
      { name: 'JACKET', role: 'Outer protection and the printed category marking.' },
      {
        name: 'FOUR TWISTED PAIRS',
        role: 'Each pair is twisted at its own rate to reject interference — pair integrity is what makes high speeds work.',
      },
      { name: 'INSULATION', role: 'Color-coded insulation identifies each conductor and the pair it belongs to.' },
      { name: 'CONDUCTORS', role: 'Eight copper paths, working as four pairs.' },
    ],
    note:
      'Terminations keep the untwisting as short as possible — pair integrity is the whole game. Cable CATEGORY sets the speed and distance the cable supports; the plug looks the same on all of them.',
  },
  {
    id: 'coax',
    chip: 'COAX',
    label: 'COAXIAL CABLE',
    tagline: 'One conductor centered inside its own return path.',
    layers: [
      { name: 'JACKET', role: 'Outer protection and the printed identity.' },
      { name: 'SHIELD', role: 'Wraps the dielectric completely — and is also the signal’s return path.' },
      {
        name: 'DIELECTRIC',
        role: 'The precisely sized insulator between shield and center conductor.',
      },
      { name: 'CENTER CONDUCTOR', role: 'The single conductor that carries the signal.' },
    ],
    note:
      'The geometry of this sandwich sets the cable’s characteristic impedance — a property you cannot see from outside and a continuity tester cannot measure. The printing on the jacket is what tells look-alike coax cables apart.',
  },
  {
    id: 'optical_fiber',
    chip: 'FIBER',
    label: 'OPTICAL FIBER',
    tagline: 'No metal, no current — the signal is pulses of light.',
    layers: [
      { name: 'JACKET & BUFFER', role: 'Protective outer layers around the fragile fiber.' },
      { name: 'CLADDING', role: 'Keeps the light trapped inside the core.' },
      { name: 'CORE', role: 'The light-carrying center.' },
    ],
    note:
      'No electrical conductor means immunity to hum, interference and ground loops — but kinks, tight bends and scratched end-faces, faults that would not bother a copper cable, can degrade or kill the signal.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge check (§5.2c) — three CheckQuestions; the lesson unit marks only
// when ALL THREE are genuinely solved.

export const L02_CHECKS: CheckSpec[] = [
  {
    question: 'Inside a cable, which layer exists to stop outside interference before it reaches the conductors?',
    options: ['The jacket', 'The shield', 'The insulation', 'The strain relief'],
    correctIdx: 1,
    reveal:
      'The shield — braid, foil, or both — is the conductive layer wrapped around the conductors to intercept interference. The jacket protects mechanically, insulation keeps conductors apart, and strain relief protects the termination.',
    wrongHint: 'Which layer is CONDUCTIVE and wraps around everything that carries signal?',
  },
  {
    question: 'Which construction is conventionally hiding under the jacket of a microphone cable?',
    options: [
      'A single conductor inside a shield',
      'Two heavy unshielded conductors',
      'A shielded twisted pair — two conductors plus an overall shield',
      'A light-carrying core inside cladding',
    ],
    correctIdx: 2,
    reveal:
      'Conventional microphone cable is a shielded twisted pair: two conductors for the balanced pair, plus an overall shield. One conductor in a shield is instrument cable; heavy unshielded conductors are speaker cable.',
    wrongHint: 'A mic signal travels as a balanced PAIR — count the conductors.',
  },
  {
    question:
      'Two cables wear identical ¼-inch plugs — one is instrument cable, one is speaker cable. What tells you which is which?',
    options: [
      'The plug — identical plugs mean identical cables',
      'The jacket printing and the construction inside',
      'The color of the jacket',
      'The direction it was plugged in',
    ],
    correctIdx: 1,
    reveal:
      'The plug does not tell you which one you are holding — the jacket printing and the construction do. That is this lesson’s rule at work: the connector does not define the cable.',
    wrongHint: 'The plug is the one thing the two cables SHARE. Look at what differs.',
  },
];

/** The lesson rule, verbatim per the owner spec (LessonBanner idiom). */
export const L02_RULE =
  'The connector does not define the cable. Two cables with identical plugs can be built completely differently inside.';
