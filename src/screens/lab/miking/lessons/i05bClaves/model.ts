/**
 * I05b CLAVES — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/claves/SOURCES.md and shaker/SOURCES.md §0; geometry from
 * claves/GEOMETRY_PROPOSAL.md on the small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). The SUPPORTED clave lies across the player's
 * front (along z) in the left hand, cradled over curled fingers — the hand's
 * hollow under it (PAS-ECV02's grip); its middle is P0, the strike point. The
 * STRIKING clave, held like a drumstick in the right hand, strikes that middle
 * with its edge. TWO STATES are the construction (a source control): SOLID
 * and HOLLOWED — the same drawing size (no maker prints one).
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { add, armTo, drawingDefault, IN, mul, P0, src, targetZone, unit, v3, type Arm } from '../shared/smallperc/geom.ts';

export const CLV_DIMS = {
  len: drawingDefault(200, 'clave length (no maker prints a size)'),
  d: drawingDefault(25, 'clave diameter'),
  /** The striker's arc: ±25° about the wrist, 150 mm radius (proposal). */
  arc: drawingDefault(150, 'the striker’s stroke radius about the wrist'),
  near: { mm: 300, prov: { kind: 'trial', src: 'LESSON-CLAVES', note: 'approximately 30–60 cm (1–2 ft) from the center of the normal striking area' } } as Dim,
  far: { mm: 600, prov: { kind: 'trial', src: 'LESSON-CLAVES', note: 'approximately 30–60 cm (1–2 ft) from the center of the normal striking area' } } as Dim,
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export const CR = CLV_DIMS.d.mm / 2;
export const CL = CLV_DIMS.len.mm;

export type ClvState = {
  id: 'solid' | 'hollow';
  /** The supported clave: centre (P0 minus its radius) along z. */
  rest: Vec3;
  /** The striker: its two ends, and the contact point on the supported clave. */
  striker: { a: Vec3; b: Vec3 };
  cradle: Arm;
  strike: Arm;
};

function state(id: 'solid' | 'hollow'): ClvState {
  const rest = v3(P0.x, P0.y + CR, P0.z);
  // The striker comes down from above and behind, its edge on the middle.
  const hand = v3(-150, P0.y - 140, 70);
  const contact = v3(P0.x + 6, P0.y - 2, 0);
  const dir = unit(v3(contact.x - hand.x, contact.y - hand.y, contact.z - hand.z));
  const a = add(hand, mul(dir, -45));
  const b = add(a, mul(dir, CL));
  return {
    id,
    rest,
    striker: { a, b },
    cradle: armTo('L', v3(-120, rest.y + 40, -55), v3(-8, rest.y + 22, -12)),
    strike: armTo('R', v3(hand.x - 82, hand.y + 30, hand.z + 25), hand),
  };
}

export const STATES: Readonly<Record<'solid' | 'hollow', ClvState>> = { solid: state('solid'), hollow: state('hollow') };
export const stateOf = (v: VariantId): ClvState => STATES[v === 'hollow' ? 'hollow' : 'solid'];

/** The striker's stroke (and the space between the two claves): a capsule
 *  from the strike point up through the striker's arc. */
export function motionOf(s: ClvState): { a: Vec3; b: Vec3; r: number } {
  return { a: v3(P0.x, P0.y - 15, 0), b: v3(P0.x - 70, P0.y - 175, 40), r: 55 };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = CLV_DIMS.near.mm;
const FAR = CLV_DIMS.far.mm;
const BAND = 'Start about 30–60 cm (1–2 ft) from the middle of the striking area';

function zonesFor(v: 'solid' | 'hollow'): DocumentedZone[] {
  const tag = v === 'solid' ? ' (solid pair)' : ' (hollowed pair)';
  return [
    targetZone({
      id: `clv.front.${v}`,
      label: `In front of the striking area${tag}`,
      band: `${BAND}, in front of it and roughly level, aimed at it — never between the two claves.`,
      kind: 'trial',
      src: 'LESSON-CLAVES',
      quote: 'approximately 30–60 cm (1–2 ft) from the center of the normal striking area and aimed at that area',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [0, 25],
      aimTol: 30,
      startD: 420,
      startA: 6,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 100 },
      tendency: 'The click and the short woody ring together; closer favours the click and the direct sound, farther lets them cohere with the room.',
      checks: ['Both hands’ full motion', 'Click against body', 'Stand or hand noise'],
    }),
    targetZone({
      id: `clv.above.${v}`,
      label: `Higher, angled down at the striking area${tag}`,
      band: `${BAND}, a little higher and in front, angled down at it — clear of the striker’s arc.`,
      kind: 'trial',
      src: 'LESSON-CLAVES',
      quote: 'Changes in microphone angle may alter attack and spill; verify the particular mic and pair rather than applying a fixed on-axis rule.',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [30, 55],
      aimTol: 30,
      startD: 420,
      startA: 40,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 100 },
      tendency: 'A different balance of click, body and spill than the level spot — compare at matched level, with both hands moving.',
      checks: ['The striker’s highest point', 'Click against body', 'Neighbours the mic now faces'],
    }),
  ];
}

/* ── SUGGESTED STARTING POINTS (lesson L19-L22; corrections CV-xx). ── */
export const CLV_ZONES: DocumentedZone[] = [...zonesFor('solid'), ...zonesFor('hollow')];
