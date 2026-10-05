/**
 * M08 HEADED TAMBOURINE — the technical truth (charter §2 layer 1). Keys
 * point into docs/labs/miking/headed_tambourine/SOURCES.md.
 *
 * FRAME (the hand-drum frame H, congas/GEOMETRY_PROPOSAL.md): origin ON THE
 * FLOOR under the instrument's hold; +x toward the mic and the audience (the
 * player stands at −x); +y DOWN; +z the player's right.
 *
 * THREE STATES (variants): HELD and struck, the frame at the 45° hold the
 * player's teacher describes (head up and toward the mic); SHAKEN, the same
 * hold with the frame swinging side to side; MOUNTED, the head flat on a
 * stand, struck with sticks. Each state is a POSE of one instrument (a
 * centre, a head normal n pointing out of the head) — the frame, the zones
 * and the keep-outs are built from it, so they always agree.
 *
 * Owner ruling 2026-10-04: `src`, `quote`, every `prov` and the unknowns are
 * the internal record; the learner sees starting points only.
 */
import type { Dim, DocumentedZone, Provenance, Vec3, VariantId } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

const IN = 25.4;

export const TAMB_DIMS = {
  d: { mm: 10 * IN, prov: src('YMH-CPCAT', '10" … staggered double row … skin head (YT-100)') } as Dim,
  depth: placeholder(55, 'frame depth'),
  frameT: placeholder(6, 'frame (shell) thickness'),
  /** Jingle pairs: a staggered double row is sourced; 8 slots per row and
   *  Ø 50 mm discs are drawing defaults. */
  slots: placeholder(8, 'jingle slots per row'),
  jingleD: placeholder(50, 'jingle disc diameter'),
  /** The 45° hold (PAS: "hold the tambourine with one hand at a 45-degree angle"). */
  holdDeg: { mm: 45, prov: src('PAS-ROD', 'To begin, hold the tambourine with one hand at a 45-degree angle.') } as Dim,
  /** The held centre's height (proposal: (0, −1150, 0), drawing default). */
  holdH: placeholder(1150, 'the held tambourine’s height in front of the player'),
  /** The mounted head's height (drawing default). */
  mountH: placeholder(900, 'a mounted tambourine’s height'),
  /** "6 to 12 inches from instrument" (all three of the maker's booklets). */
  near: { mm: 6 * IN, prov: src('S-DRUMS', 'One microphone placed 6 to 12 inches from instrument') } as Dim,
  far: { mm: 12 * IN, prov: src('S-DRUMS', 'One microphone placed 6 to 12 inches from instrument') } as Dim,
  /** The motion envelopes (ILLUSTRATIVE): the shake ±150 lateral (proposal). */
  shake: { mm: 150, prov: ill('shake travel ±150 mm lateral (proposal drawing default)') } as Dim,
  headClear: { mm: 6, prov: ill('head excursion: no source gives a number') } as Dim,
} as const;

export const R = TAMB_DIMS.d.mm / 2;
/** The jingles stand out past the frame this far (drawing default). */
export const JINGLE_OUT = 12;

export type Pose = { c: Vec3; n: Vec3; e1: Vec3; e2: Vec3 };
const k = Math.SQRT1_2;
/** Poses: c = the head's centre; n = out of the head; e1 = the head plane's
 *  "forward/down" direction; e2 = +z. */
export const POSES: Readonly<Record<'held' | 'shaken' | 'mounted', Pose>> = {
  held: { c: { x: 0, y: -TAMB_DIMS.holdH.mm, z: 0 }, n: { x: k, y: -k, z: 0 }, e1: { x: k, y: k, z: 0 }, e2: { x: 0, y: 0, z: 1 } },
  shaken: { c: { x: 0, y: -TAMB_DIMS.holdH.mm, z: 0 }, n: { x: k, y: -k, z: 0 }, e1: { x: k, y: k, z: 0 }, e2: { x: 0, y: 0, z: 1 } },
  mounted: { c: { x: 0, y: -TAMB_DIMS.mountH.mm, z: 0 }, n: { x: 0, y: -1, z: 0 }, e1: { x: 1, y: 0, z: 0 }, e2: { x: 0, y: 0, z: 1 } },
};
export const poseOf = (v: VariantId): Pose => POSES[(v === 'shaken' || v === 'mounted' ? v : 'held') as 'held'];

const add = (a: Vec3, b: Vec3, s = 1): Vec3 => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
/** The instrument's front-most x (the rim and jingles toward the mic). */
export function frontX(p: Pose): number {
  return p.c.x + (R + JINGLE_OUT) * Math.abs(p.e1.x);
}

const NEAR = TAMB_DIMS.near.mm;
const FAR = TAMB_DIMS.far.mm;
const BOTH = ['orchSdc', 'orchDyn'];
const BAND = 'Start about 15–30 cm (6–12 in) from the tambourine';

/** A zone's start pose looking back along −dir from `dist` out along dir. */
function lookBack(from: Vec3, dir: Vec3, dist: number): { p: Vec3; az: number; el: number } {
  const p = add(from, dir, dist);
  // aimVec(az, el) = (−cos az cos el, −sin el, sin az cos el) = −dir
  const el = (Math.asin(Math.max(-1, Math.min(1, dir.y))) * 180) / Math.PI;
  const az = (Math.atan2(-dir.z, dir.x) * 180) / Math.PI;
  return { p, az: Math.round(az * 10) / 10, el: Math.round(el * 10) / 10 };
}

function heldZones(v: 'held' | 'shaken'): DocumentedZone[] {
  const P = POSES[v];
  const fx = frontX(P);
  const rim = add(P.c, P.e1, R + JINGLE_OUT);
  const mid = (NEAR + FAR) / 2;
  const front = lookBack({ x: fx, y: P.c.y, z: 0 }, { x: 1, y: 0, z: 0 }, mid);
  const head = lookBack(P.c, P.n, 270);
  const edge = lookBack(rim, P.e1, mid);
  const s = v === 'shaken' ? ' (shaken)' : '';
  return [
    {
      id: `tb.front.${v}`,
      label: `In front, level with it${s}`,
      band: `${BAND}, level with it and facing it — head and jingles together.`,
      kind: 'sourced',
      src: 'S-DRUMS',
      quote: 'One microphone placed 6 to 12 inches from instrument',
      refSurface: `front.${v}`,
      side: 'outside',
      distance: { min: NEAR, max: FAR },
      radial: { line: `level.${v}`, max: 130, prov: ill('"level with it": within 13 cm of the hold’s height and centre line (the lab’s band)') },
      aim: { maxOffAxis: 35, prov: ill('facing the instrument: the lab counts within 35°') },
      requires: { variant: v, micTypeIds: BOTH },
      drawn: { side: { u0: fx + NEAR, u1: fx + FAR, v0: P.c.y - 130, v1: P.c.y + 130 }, top: { u0: fx + NEAR, u1: fx + FAR, v0: -130, v1: 130 } },
      start: front,
      tendency: 'An integrated sound: the head’s low and mid body with the jingles’ sparkle. Check that the level stays steady as the instrument moves.',
      checks: ['The whole motion: strikes, shakes and rolls', 'Steady level as the frame moves toward and away', 'Peaks on the loudest accents'],
    },
    {
      id: `tb.head.${v}`,
      label: `Along the head’s axis, beyond the hand${s}`,
      band: `${BAND} along the head’s axis, at the far end of that range — beyond the striking hand — looking at the head.`,
      kind: 'trial',
      src: 'LESSON-TAMB',
      quote: 'orient the mic to hear the playing head as it is presented during strikes, while maintaining access for fingers, hand, or stick',
      refSurface: `head.${v}`,
      side: 'outside',
      distance: { min: 240, max: FAR },
      bandProv: ill('the far end of 6–12 in along the head’s axis, beyond the hand’s path (the lab’s band)'),
      radial: { line: `axis.${v}`, max: 110, prov: ill('on the head’s axis, within 11 cm (the lab’s band)') },
      aim: { maxOffAxis: 25, prov: ill('looking at the head: the lab counts within 25°') },
      requires: { variant: v, micTypeIds: BOTH },
      drawn: {
        side: { u0: P.c.x + 240 * P.n.x - 70, u1: P.c.x + FAR * P.n.x + 70, v0: P.c.y + FAR * P.n.y - 70, v1: P.c.y + 240 * P.n.y + 70 },
        top: { u0: P.c.x + 240 * P.n.x - 70, u1: P.c.x + FAR * P.n.x + 70, v0: -110, v1: 110 },
      },
      start: head,
      tendency: 'More of the struck head — its low and mid body — and less of the jingles’ edge. Check that the jingles are still there and that the hand never nears the mic.',
      checks: ['The striking hand’s whole path', 'Jingle character against head body', 'Hand noise on the head'],
    },
    {
      id: `tb.edge.${v}`,
      label: `Below the rim, looking up at the jingles${s}`,
      band: `${BAND}, below and in front of the rim, looking up at the jingles edge-on.`,
      kind: 'trial',
      src: 'LESSON-TAMB',
      quote: 'From a safe position with a clearer view of the rim/jingle region, compare against the integrated placement.',
      refSurface: `edge.${v}`,
      side: 'outside',
      distance: { min: NEAR, max: FAR },
      radial: { line: `rimLine.${v}`, max: 110, prov: ill('in line with the rim’s edge, within 11 cm (the lab’s band)') },
      aim: { maxOffAxis: 30, prov: ill('looking at the rim: the lab counts within 30°') },
      requires: { variant: v, micTypeIds: BOTH },
      drawn: {
        side: { u0: rim.x + NEAR * P.e1.x - 70, u1: rim.x + FAR * P.e1.x + 70, v0: rim.y + NEAR * P.e1.y - 70, v1: rim.y + FAR * P.e1.y + 70 },
        top: { u0: rim.x + NEAR * P.e1.x - 70, u1: rim.x + FAR * P.e1.x + 70, v0: -110, v1: 110 },
      },
      start: edge,
      tendency: 'A brighter, more metallic attack from the jingles — it can turn piercing or make the head strokes seem weak. If it is too bright, back off or turn the mic a little away.',
      checks: ['Brightness on the loudest shakes', 'The head strokes against the jingles', 'Keep hardware out of the shaking path'],
    },
  ];
}

function mountedZones(): DocumentedZone[] {
  const P = POSES.mounted;
  const fx = frontX(P);
  const mid = (NEAR + FAR) / 2;
  return [
    {
      id: 'tb.above.mounted',
      label: 'Above, on the far side from the player',
      band: `${BAND}, above it on the far side from the player, looking down at the head — outside the sticks’ reach.`,
      kind: 'sourced',
      src: 'S-DRUMS',
      quote: 'One microphone placed 6 to 12 inches from instrument',
      refSurface: 'head.mounted',
      side: 'outside',
      distance: { min: NEAR, max: FAR },
      radial: { line: 'axis.mounted', min: 0, max: R + 200, prov: ill('above the head or just past its rim (the lab’s band)') },
      aimAt: { surface: 'head.mounted', r: R, prov: ill('looking at the head: the axis meets it') },
      box: { min: { x: 0, y: -3000, z: -300 }, max: { x: 900, y: 0, z: 300 }, prov: ill('the far side from the player (away from the sticks)') },
      requires: { variant: 'mounted', micTypeIds: BOTH },
      drawn: { side: { u0: 0, u1: R + 200, v0: P.c.y - FAR, v1: P.c.y - NEAR }, top: { u0: 0, u1: R + 200, v0: -200, v1: 200 } },
      start: { p: { x: R + 60, y: P.c.y - mid, z: 0 }, az: 0, el: -50 },
      tendency: 'Head strokes and jingles together, the head a little forward. Check every stroke the player uses — and the mount’s own noises.',
      checks: ['The sticks’ whole path', 'Mechanical noise from the mount', 'Jingle decay after each stroke'],
    },
    {
      id: 'tb.front.mounted',
      label: 'In front, level with the rim',
      band: `${BAND}, level with the rim in front of it, facing the jingles edge-on.`,
      kind: 'trial',
      src: 'LESSON-TAMB',
      quote: 'Use a mic at a safe distance from the mounted drum and all hand/stick/pedal mechanism travel; assess head strike and jingle decay.',
      refSurface: 'front.mounted',
      side: 'outside',
      distance: { min: NEAR, max: FAR },
      radial: { line: 'level.mounted', max: 120, prov: ill('level with the rim, within 12 cm (the lab’s band)') },
      aim: { maxOffAxis: 35, prov: ill('facing the instrument: the lab counts within 35°') },
      requires: { variant: 'mounted', micTypeIds: BOTH },
      drawn: { side: { u0: fx + NEAR, u1: fx + FAR, v0: P.c.y - 120, v1: P.c.y + 120 }, top: { u0: fx + NEAR, u1: fx + FAR, v0: -120, v1: 120 } },
      start: lookBack({ x: fx, y: P.c.y, z: 0 }, { x: 1, y: 0, z: 0 }, mid),
      tendency: 'More of the jingles’ bright edge than from above — compare the two for the balance the music wants.',
      checks: ['Brightness against head body', 'The sticks’ reach past the rim', 'The mount and its cable'],
    },
  ];
}

/* ── RECOMMENDED STARTING POINTS (lesson L23-L37; corrections TB-01..TB-03). ── */
export const TAMB_ZONES: DocumentedZone[] = [...heldZones('held'), ...heldZones('shaken'), ...mountedZones()];
