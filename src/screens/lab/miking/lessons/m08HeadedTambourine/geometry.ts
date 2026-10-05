/**
 * M08 HEADED TAMBOURINE — where things are (charter §2 layer 2), BUILT from
 * the poses in model.ts: every solid, surface, line and keep-out follows the
 * pose of its state, so the drawing, the zones and the collision agree.
 */
import type { Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Vec3 } from '../../engine/model/types.ts';
import { frontX, JINGLE_OUT, POSES, R, TAMB_DIMS, type Pose } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DRAW = ill('a drawing default (headed_tambourine/GEOMETRY_PROPOSAL.md); no source gives it');
const neg = (v: Vec3): Vec3 => ({ x: -v.x, y: -v.y, z: -v.z });
const add = (a: Vec3, b: Vec3, s = 1): Vec3 => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });

const DEPTH = TAMB_DIMS.depth.mm;
const FT = TAMB_DIMS.frameT.mm;
const HELD = ['held', 'shaken'];

function instrumentParts(p: Pose, suffix: string, vars: string[]): Part[] {
  const into = neg(p.n);
  return [
    { id: `tb.head${suffix}`, label: 'head', short: 'head', role: 'The skin stretched over one face of the frame. Struck by the hand, the fist, the knee or a stick, it adds a low and mid body to the jingles.', moving: true, clearance: TAMB_DIMS.headClear, prov: TAMB_DIMS.d.prov, variants: vars, solid: { kind: 'slab', c: p.c, axis: into, r: R, x0: -0.5, x1: 0.5 } },
    { id: `tb.frame${suffix}`, label: 'frame (shell)', short: 'frame', role: 'The wooden ring the head is fixed to, open at the back. The player holds it — and, shaken, it moves.', moving: true, prov: TAMB_DIMS.d.prov, variants: vars, solid: { kind: 'tube', c: p.c, axis: into, rIn: R - FT, rOut: R, x0: 0, x1: DEPTH } },
    { id: `tb.jingles${suffix}`, label: 'jingle pairs (a staggered double row)', short: 'jingles', role: 'Pairs of thin metal discs loose on pins in slots round the frame, in two staggered rows. Every stroke and shake throws them against each other: the bright, metallic part of the sound.', moving: true, prov: { kind: 'sourced', src: 'YMH-CPCAT', quote: 'staggered double row, silver jingles' }, variants: vars, solid: { kind: 'tube', c: p.c, axis: into, rIn: R, rOut: R + JINGLE_OUT, x0: 5, x1: DEPTH - 5 } },
  ];
}

const M = POSES.mounted;
const parts: Part[] = [
  ...instrumentParts(POSES.held, '', HELD),
  ...instrumentParts(M, 'M', ['mounted']),
  { id: 'tb.mount', label: 'mount and stand', short: 'mount', role: 'A stand holding the tambourine flat for stick playing. Use only a compatible mount, with the owner’s agreement — and expect some mechanical noise from it.', prov: DRAW, variants: ['mounted'], solid: { kind: 'capsule', a: { x: -R - 30, y: M.c.y + 30, z: 0 }, b: { x: -R - 30, y: -40, z: 0 }, r: 12 } },
];

const surfaces = (p: Pose, v: string): ReferenceSurface[] => {
  const head = v === 'mounted' ? 'tb.headM' : 'tb.head';
  const frame = v === 'mounted' ? 'tb.frameM' : 'tb.frame';
  const rim = add(p.c, p.e1, R + JINGLE_OUT);
  const out: ReferenceSurface[] = [
    { id: `front.${v}`, partId: frame, label: 'the tambourine', point: { x: frontX(p), y: p.c.y, z: 0 }, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'in front of', key: 'FROM' }, variants: [v] },
    { id: `head.${v}`, partId: head, label: 'the head', point: p.c, normal: p.n, variants: [v] },
  ];
  if (v !== 'mounted') out.push({ id: `edge.${v}`, partId: frame, label: 'the rim', point: rim, normal: p.e1, variants: [v] });
  return out;
};
const lines = (p: Pose, v: string): RefLine[] => {
  const out: RefLine[] = [
    { id: `level.${v}`, label: 'its centre line', point: { x: 0, y: p.c.y, z: 0 }, dir: { x: 1, y: 0, z: 0 }, variants: [v] },
    { id: `axis.${v}`, label: 'the head’s axis', point: p.c, dir: p.n, variants: [v] },
  ];
  if (v !== 'mounted') out.push({ id: `rimLine.${v}`, label: 'the rim’s edge line', point: add(p.c, p.e1, R + JINGLE_OUT), dir: p.e1, variants: [v] });
  return out;
};

/** The striking hand (held), the shake's sweep (shaken), the sticks (mounted). */
const H = POSES.held;
const handA = add(add(H.c, H.n, 30), { x: 0, y: 0, z: 1 }, 60);
const handB = add(add(H.c, H.n, 140), { x: 0, y: 0, z: 1 }, 60);
const S = TAMB_DIMS.shake.mm;
const envelopes: Envelope[] = [
  { id: 'env.hand', label: 'the striking hand', shape: { kind: 'capsule', a: handA, b: handB, r: 85 }, prov: ill('the player’s striking hand over the head; no source gives its path'), variants: ['held'] },
  { id: 'env.shake', label: 'the shake’s sweep', shape: { kind: 'box', min: { x: H.c.x - 170, y: H.c.y - 130, z: -(R + JINGLE_OUT) - S - 20 }, max: { x: H.c.x + 125, y: H.c.y + 150, z: R + JINGLE_OUT + S + 20 } }, prov: TAMB_DIMS.shake.prov, variants: ['shaken'] },
  { id: 'env.sticks', label: 'the sticks’ reach', shape: { kind: 'sector', c: M.c, r0: 0, r1: R + 250, a0: 0.6 * Math.PI, a1: 1.4 * Math.PI, y0: M.c.y - 400, y1: M.c.y }, prov: ill('the sticks over the player’s half of the head; no source gives it'), variants: ['mounted'], clearance: 15 },
  { id: 'env.player', label: 'the player', shape: { kind: 'box', min: { x: -680, y: -1750, z: -300 }, max: { x: -240, y: 0, z: 300 } }, prov: ill('a standing player behind the instrument; no source gives the position') },
];

export const TAMB_MODEL: InstrumentModel = {
  id: 'headedTambourine10',
  name: '10 in headed tambourine',
  parts,
  regions: [
    { id: 'r.head', partId: 'tb.head', label: 'head', anchor: POSES.held.c, prov: TAMB_DIMS.d.prov, note: 'The struck head: the low and mid body of the sound, radiating from both faces (the back is open).', variants: HELD },
    { id: 'r.jingles', partId: 'tb.jingles', label: 'jingles', anchor: add(POSES.held.c, POSES.held.e1, R), prov: { kind: 'sourced', src: 'YMH-CPCAT', quote: 'staggered double row, silver jingles' }, note: 'The jingle pairs round the frame: the bright, metallic attack.', variants: HELD },
    { id: 'r.headM', partId: 'tb.headM', label: 'head', anchor: M.c, prov: TAMB_DIMS.d.prov, note: 'The struck head of the mounted tambourine.', variants: ['mounted'] },
    { id: 'r.jinglesM', partId: 'tb.jinglesM', label: 'jingles', anchor: add(M.c, M.e1, R), prov: { kind: 'sourced', src: 'YMH-CPCAT', quote: 'staggered double row, silver jingles' }, note: 'The jingle pairs round the frame.', variants: ['mounted'] },
  ],
  surfaces: [...surfaces(POSES.held, 'held'), ...surfaces(POSES.shaken, 'shaken'), ...surfaces(M, 'mounted')],
  lines: [...lines(POSES.held, 'held'), ...lines(POSES.shaken, 'shaken'), ...lines(M, 'mounted')],
  envelopes,
  variants: [
    { id: 'held', label: 'HELD, STRUCK', blurb: 'Held at about 45°, the head up and toward the mic, struck by the other hand.', phrase: 'held and struck' },
    { id: 'shaken', label: 'SHAKEN', blurb: 'The same hold, shaken side to side or rolled by thumb or finger: the jingles lead, and the frame moves.', phrase: 'shaken' },
    { id: 'mounted', label: 'MOUNTED', blurb: 'Held flat on a compatible mount and struck with sticks — the instrument stays put, but the mount adds its own noises.', phrase: 'on a mount' },
  ],
  defaultVariant: 'held',
  views: {
    side: { u0: -430, u1: 570, v0: -1480, v1: -760 },
    top: { u0: -430, u1: 570, v0: -460, v1: 460 },
  },
  // Held or shaken, the side view is framed 150 mm higher: the mic in front
  // sits level with the tambourine (y ≈ −1150), which in the shared frame put
  // it right under the top-right inset of the other view at phone width
  // (integrator, 2026-10-05). Mounted, the mic hangs above the head on a boom
  // rising to the right: that frame runs 200 mm further right instead, so the
  // mic body clears the inset (its boom may pass behind it).
  viewsByVariant: {
    held: { side: { u0: -430, u1: 570, v0: -1630, v1: -910 } },
    shaken: { side: { u0: -430, u1: 570, v0: -1630, v1: -910 } },
    mounted: { side: { u0: -430, u1: 770, v0: -1480, v1: -760 } },
  },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin') },
  interior: { x0: 0.5, x1: DEPTH, rIn: R - FT, c: POSES.held.c, axis: neg(POSES.held.n) },
  ports: { held: null, shaken: null, mounted: null },
};
