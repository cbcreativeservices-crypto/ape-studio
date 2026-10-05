/**
 * THE SPEAKER FAMILY — technical truth (charter §2 layer 1), shared by every
 * lesson that mics an amplified speaker: the Speaker-cabinet & Leslie module
 * now, and the guitar, bass, harmonica, Rhodes and Wurlitzer lessons later.
 * Pure TypeScript (no React Native), so the tests reach it.
 *
 * Sources: docs/labs/miking/speaker_leslie/SOURCES.md (keys CEL-V30,
 * MAR-MX112, MAR-1960A, AMP-410, HAM-122H, HAM-TRAD) and GEOMETRY_PROPOSAL.md
 * (frames C and L, the drawing defaults). Every number has a provenance; an
 * UNKNOWN the drawing cannot exist without is a PLACEHOLDER (`placeholder:
 * true`, a "drawing default, not a published figure"), never a readout.
 *
 * FRAME C (a conventional cabinet): origin = the centre of the ACTIVE
 * speaker's cone at the baffle's front plane; +x out of the cabinet toward
 * the mic; +y DOWN; +z to the listener's right when facing the cabinet.
 * Lengths in mm. The grille cloth stands proud of the baffle at x = GRILLE_X.
 *
 * FRAME L (the rotary cabinet): origin = the centre of the cabinet's
 * footprint on the floor; +x out of the FRONT face (the face opposite the
 * rear control panel: a drawing default); +y down (floor y = 0); +z to the
 * right when facing the front.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const derived = (note: string): Provenance => ({ kind: 'trial', src: 'DERIVED', note });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/** 1 in = 25.4 mm exactly. */
export const IN = 25.4;

/* ── the 12-in guitar speaker (one well-documented 12-in driver as the reference) ── */
export const SPEAKER_12 = {
  dNom: { mm: 305, prov: src('CEL-V30', 'Nominal Diameter 305mm / 12in') } as Dim,
  dFrame: { mm: 309, prov: src('CEL-V30', 'Diameter 309mm / 12.2in') } as Dim,
  dCut: { mm: 283, prov: src('CEL-V30', 'Cut-out diameter 283mm / 11.1in') } as Dim,
  overallDepth: { mm: 135, prov: src('CEL-V30', 'Overall depth 135mm / 5.3in') } as Dim,
  chassisDepth: { mm: 97, prov: src('CEL-V30', 'Chassis depth (inc gasket) 97mm / 3.79in') } as Dim,
  magnetD: { mm: 156, prov: src('CEL-V30', 'Magnet structure diameter 156mm / 6.1in') } as Dim,
  pcd: { mm: 297, prov: src('CEL-V30', 'Mounting hole PCD 297mm / 11.7in') } as Dim,
  holes: { mm: 4, prov: src('CEL-V30', 'Number of mounting holes 4') } as Dim,
  voiceCoilD: { mm: 44, prov: src('CEL-V30', 'Voice coil diameter 44mm / 1.75in') } as Dim,
  /** The visible cone edge, surround included = the cut-out radius. */
  rCone: { mm: 283 / 2, prov: derived('D_cut / 2 (GEOMETRY_PROPOSAL A2)') } as Dim,
  rDust: placeholder(50, 'dust-cap radius (not on the datasheet): drawing default 50'),
  rSurroundIn: placeholder(128, 'the surround’s inner edge: drawing default 128'),
  /** How far the cone's apex (the voice coil) sits behind the flange plane. */
  coneDepth: placeholder(58, 'cone depth: drawing default 58 (inside the 97 mm chassis depth)'),
  /** The dust cap's dome height in front of the cone at r = rDust. */
  domeH: placeholder(16, 'dust-cap dome height: drawing default 16'),
} as const;

/** The three lateral spots on one speaker the lesson compares (GEOMETRY A2):
 *  the centre, the dust-cap / cone boundary, and toward the edge. */
export const CONE_SPOTS = {
  centre: 0,
  boundary: SPEAKER_12.rDust.mm,
  edge: SPEAKER_12.rSurroundIn.mm - 10,
} as const;

/** Grille cloth plane (stands proud of the baffle): a drawing default. */
export const GRILLE_X = placeholder(15, 'how far the grille cloth stands proud of the baffle: drawing default 15');
/** Panel thickness of every cabinet wall: a drawing default. */
export const PANEL = placeholder(18, 'cabinet panel thickness: drawing default 18');

/* ── the cabinets (outer boxes SOURCED; driver layout a drawing default) ── */
export type CabKind = '1x12' | '4x12' | 'bass410';
export type CabSpec = {
  kind: CabKind;
  label: string;
  short: string;
  /** Outer size: width (z) × height (y) × depth (x), mm. */
  w: Dim;
  h: Dim;
  d: Dim;
  /** Driver centres relative to the baffle's centre (y down, z right), and
   *  each driver's nominal size. The FIRST is the active (miked) speaker. */
  drivers: { y: number; z: number; nominal: number }[];
  layoutProv: Provenance;
  /** A small horn between the top pair (bass cabinet): centre and size. */
  horn?: { y: number; z: number; w: number; h: number; prov: Provenance };
  /** The upper half of the front angled back (an "angled" 4×12): degrees. */
  angledTop?: Dim;
  /** Which backs the drawing offers for this cabinet. */
  backs: readonly ('closed' | 'open')[];
  backProv: Provenance;
};

export const CABINETS: Record<CabKind, CabSpec> = {
  '1x12': {
    kind: '1x12',
    label: '1 × 12 in cabinet',
    short: '1×12',
    w: { mm: 500, prov: src('MAR-MX112', 'Width 500 mm / 19.7"') },
    h: { mm: 470, prov: src('MAR-MX112', 'Height 470 mm / 18.5"') },
    d: { mm: 290, prov: src('MAR-MX112', 'Depth 290 mm / 11.4"') },
    drivers: [{ y: 0, z: 0, nominal: 12 }],
    layoutProv: ill('the one speaker drawn centred on the baffle (drawing default)'),
    backs: ['closed', 'open'],
    backProv: ill('the back type of the referenced 1×12 is not stated; both are drawn so the lesson can compare them'),
  },
  '4x12': {
    kind: '4x12',
    label: '4 × 12 in cabinet (angled front)',
    short: '4×12',
    w: { mm: 770, prov: src('MAR-1960A', 'Width 770 mm / 30.3"') },
    h: { mm: 755, prov: src('MAR-1960A', 'Height 755 mm / 29.7"') },
    d: { mm: 365, prov: src('MAR-1960A', 'Depth 365 mm / 14.4"') },
    // Lower right first (the active one), then the others: a 2 × 2 grid at
    // ±190 (z) and ±185 (y) from the baffle centre (drawing default).
    drivers: [
      { y: 185, z: 190, nominal: 12 },
      { y: 185, z: -190, nominal: 12 },
      { y: -185, z: 190, nominal: 12 },
      { y: -185, z: -190, nominal: 12 },
    ],
    layoutProv: ill('2 × 2 grid, centres ±190 / ±185 from the baffle centre: drawing default (GEOMETRY A3)'),
    angledTop: placeholder(8, 'the angle of the upper front: drawing default 8°'),
    backs: ['closed'],
    backProv: ill('back type not stated on the maker’s page: drawn closed (drawing default)'),
  },
  bass410: {
    kind: 'bass410',
    label: 'Bass cabinet, 4 × 10 in + horn',
    short: 'BASS 4×10',
    w: { mm: 30 * IN, prov: src('AMP-410', 'DIMENSIONS (H x W x D) 24" x 30" x 19"') },
    h: { mm: 24 * IN, prov: src('AMP-410', 'DIMENSIONS (H x W x D) 24" x 30" x 19"') },
    d: { mm: 19 * IN, prov: src('AMP-410', 'DIMENSIONS (H x W x D) 24" x 30" x 19"') },
    drivers: [
      { y: 150, z: 170, nominal: 10 },
      { y: 150, z: -170, nominal: 10 },
      { y: -150, z: 170, nominal: 10 },
      { y: -150, z: -170, nominal: 10 },
    ],
    layoutProv: ill('2 × 2 grid, centres ±170 / ±150 from the baffle centre: drawing default (GEOMETRY A3)'),
    horn: { y: -150, z: 0, w: 66, h: 66, prov: ill('"1 high frequency horn" (AMP-410); its position between the top pair and its size are drawing defaults') },
    backs: ['closed'],
    backProv: ill('drawn closed (drawing default)'),
  },
};

/** A speaker of `nominal` inches drawn with the 12-in reference's proportions. */
export function speakerScale(nominal: number): number {
  return (nominal * IN) / SPEAKER_12.dNom.mm;
}

/** A cabinet laid out in frame C (origin at the active speaker). Pure. */
export type CabLayout = {
  spec: CabSpec;
  /** The baffle centre, relative to the active speaker. */
  centre: { y: number; z: number };
  box: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
  floorY: number;
  /** Every driver's centre in frame C (the active one is at the origin). */
  drivers: { y: number; z: number; nominal: number; active: boolean }[];
  horn: { y: number; z: number; w: number; h: number } | null;
};

export function cabLayout(kind: CabKind): CabLayout {
  const s = CABINETS[kind];
  const a = s.drivers[0];
  const centre = { y: -a.y, z: -a.z };
  const x1 = GRILLE_X.mm;
  const x0 = x1 - s.d.mm;
  const y0 = centre.y - s.h.mm / 2;
  const y1 = centre.y + s.h.mm / 2;
  const z0 = centre.z - s.w.mm / 2;
  const z1 = centre.z + s.w.mm / 2;
  return {
    spec: s,
    centre,
    box: { x0, x1, y0, y1, z0, z1 },
    // The cabinet stands on the floor (drawing default: not raised or tilted).
    floorY: y1,
    drivers: s.drivers.map((d, i) => ({ y: centre.y + d.y, z: centre.z + d.z, nominal: d.nominal, active: i === 0 })),
    horn: s.horn ? { y: centre.y + s.horn.y, z: centre.z + s.horn.z, w: s.horn.w, h: s.horn.h } : null,
  };
}

/* ── the rotary cabinet (one classic two-rotor model, the only one with
 *    published rotor speeds; no model name is shown to the learner) ── */
const H_LES = 1043;
const W_LES = 742;
export const LESLIE = {
  w: { mm: W_LES, prov: src('HAM-122H', 'W 74.2 X D 52.4 X H 104.3 cm') } as Dim,
  d: { mm: 524, prov: src('HAM-122H', 'W 74.2 X D 52.4 X H 104.3 cm') } as Dim,
  h: { mm: H_LES, prov: src('HAM-122H', 'W 74.2 X D 52.4 X H 104.3 cm') } as Dim,
  /** The woofer: "15" (38cm)", facing DOWN into the lower compartment. */
  woofer: { mm: 15 * IN, prov: src('HAM-122H', '15" (38cm)') } as Dim,
  /** Compartments and rotors read off the maker's internal-structure
   *  schematic (proportions, Medium): drawing defaults. */
  shelfY: placeholder(-0.62 * H_LES, 'the woofer shelf height (proportion read from the schematic): drawing default'),
  lowerTop: placeholder(-0.4 * H_LES, 'the top of the lower (rotor) compartment: drawing default'),
  plinth: placeholder(40, 'the plinth under the lower compartment: drawing default 40'),
  hornY: placeholder(-0.9 * H_LES, 'the horn rotor’s plane: drawing default'),
  hornReach: placeholder(0.4 * (W_LES / 2), 'how far each horn bell reaches from the axis: drawing default'),
  drumY: placeholder(-0.22 * H_LES, 'the low rotor’s plane: drawing default'),
  drumR: placeholder(0.4 * (W_LES / 2), 'the low rotor’s radius: drawing default'),
  /** Openings: count, size and faces UNKNOWN; drawn on all four faces. */
  upperLouvers: { y0: -1000, y1: -780, prov: { kind: 'unknown', needed: 'louver layout (count, size, faces): drawing default band' } as Provenance },
  lowerOpenings: { y0: -380, y1: -80, prov: { kind: 'unknown', needed: 'lower-opening layout: drawing default band' } as Provenance },
} as const;

/** The crossover between the horn and the low rotor (Hz). */
export const CROSSOVER_HZ = 800;
export const CROSSOVER_PROV: Provenance = src('HAM-122H', '"Horn Rotor Reproduces the treble (above 800 Hz) frequencies." "Low Rotor Reproduces the bass (below 800 Hz) frequencies."');

/** The four faces of the rotary cabinet in plan: the outward normal (x, z). */
export const LESLIE_FACES = [
  { id: 'front', label: 'front', n: { x: 1, z: 0 } },
  { id: 'right', label: 'right side', n: { x: 0, z: 1 } },
  { id: 'back', label: 'back', n: { x: -1, z: 0 } },
  { id: 'left', label: 'left side', n: { x: 0, z: -1 } },
] as const;
export type LeslieFace = (typeof LESLIE_FACES)[number]['id'];

/** The plan point on a face's outside, `d` mm out from its centre line. */
export function outsideFace(face: LeslieFace, d: number): { x: number; z: number } {
  const f = LESLIE_FACES.find((q) => q.id === face)!;
  const half = f.n.x !== 0 ? LESLIE.d.mm / 2 : LESLIE.w.mm / 2;
  return { x: f.n.x * (half + d), z: f.n.z * (half + d) };
}
