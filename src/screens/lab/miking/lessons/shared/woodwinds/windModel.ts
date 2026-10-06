/**
 * THE WOODWIND FAMILY IN THE ENGINE (charter §2 layer 2): the solids, the
 * reference surfaces, the radiating regions and the clip attachments one
 * posture compiles to — built from windSpec.ts and windPosture.ts, so the
 * drawing, the collisions, the zones and the readouts agree.
 *
 * KEEP-OUTS (all ILLUSTRATIVE; no source gives a clearance — the lessons'
 * safety words: "never place a stand or boom where a turning head or flute
 * can strike it", "keep stands, clips and cables clear of fingers, keywork,
 * pads, joints and the player's face"):
 *   • the instrument, each piece as capsules along its centre line, with a
 *     20 mm clearance for the instrument's own movement;
 *   • the player's head (and breath), torso, shoulders, both arms, both
 *     hands on the keys, the legs and feet; the chair; the bass clarinet's
 *     floor peg and a keep-out round its foot.
 * The engine shows a keep-out only when a mic runs into it (it stops and
 * names the part) — nothing is hatched on the drawing until then.
 *
 * Pure: plain data.
 */
import type { Dim, InstrumentModel, Part, Provenance, RadiatingRegion, ReferenceSurface, RefLine, Rim, Shape3, Variant, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { add, scale } from '../../../engine/geometry/vec.ts';
import { frameAt, samples, type Layout } from './windPosture.ts';
import { holeS, radiusAt, type WindSpec } from './windSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('the player’s body and hold: drawing defaults (no source gives a player’s geometry)');
const cap = (a: Vec3, b: Vec3, r: number): Shape3 => ({ kind: 'capsule', a, b, r });

/** What a lesson says about its own instrument's parts. */
export type WindPartWords = {
  /** One sentence per piece id (windSpec pieces). */
  roles: Readonly<Record<string, string>>;
  /** The keys and tone holes (no solid: the hands cover them). */
  keys: string;
  /** The player's end: the embouchure hole and lip plate, or the reed. */
  exciter: { label: string; short: string; role: string };
  /** The far end (the foot or the bell), when it is its own part. */
  hands: string;
  player: string;
  head: string;
};

export type WindModelOpts = {
  id: string;
  name: string;
  views: { side: ViewBox; top: ViewBox };
  /** Views whose drawing reaches past the modelled parts (contentFrame.ts). */
  fitAuthored?: InstrumentModel['fitAuthored'];
  words: WindPartWords;
  surfaces: ReferenceSurface[];
  rims: Rim[];
  lines?: RefLine[];
  regions: RadiatingRegion[];
  variants: Variant[];
  /** The instrument's own clearance (illustrative). */
  clearance?: number;
};

export const CLEAR: Dim = { mm: 20, prov: ill('a 20 mm keep-out round the instrument for its movement as the player breathes and phrases (drawing default)') };

/** The instrument's pieces as capsule solids along the centre line. */
export function instrumentParts(L: Layout, w: WindPartWords): Part[] {
  const spec = L.spec;
  const parts: Part[] = [];
  for (const pc of spec.pieces) {
    const step = pc.id === 'bell' ? 30 : 60;
    const ss = samples(L, pc.s0, pc.s1, step);
    for (let i = 0; i < ss.length - 1; i++) {
      const a = ss[i];
      const b = ss[i + 1];
      const r = Math.max(radiusAt(spec, a.s + 0.5), radiusAt(spec, b.s - 0.5));
      parts.push({
        id: i === 0 ? `ww.${pc.id}` : `ww.${pc.id}.${i}`,
        label: pc.label,
        short: pc.label.split(' ')[0] === 'double' ? 'reed' : pc.label.replace(/ joint$/, '').replace(/ and reed$/, ''),
        role: w.roles[pc.id] ?? `The ${pc.label}.`,
        prov: spec.length.prov,
        clearance: CLEAR,
        ...(i === 0 ? {} : { listIn: [] as string[] }),
        solid: cap(a.f.p, b.f.p, r),
      });
    }
  }
  return parts;
}

/** The player: head, torso, arms, hands, legs, chair, peg (all solids). */
export function playerParts(L: Layout, w: WindPartWords): Part[] {
  const B = L.body;
  const neckMid = add(B.neck, { x: 0, y: -40, z: 10 });
  const pelvis = { x: 0, y: (B.hipL.y + B.hipR.y) / 2, z: (B.hipL.z + B.hipR.z) / 2 };
  const parts: Part[] = [
    { id: 'ww.head', label: 'the player’s head', short: 'head', role: w.head, prov: PLAYER, solid: cap(B.head.c, B.head.c, B.head.r) },
    { id: 'ww.player', label: 'the player', short: 'player', role: w.player, prov: PLAYER, solid: cap(pelvis, neckMid, 150) },
    { id: 'ww.shoulders', label: 'the player', short: 'player', role: 'Shoulders.', prov: PLAYER, listIn: [], solid: cap(B.shoulderL, B.shoulderR, 62) },
    { id: 'ww.hands', label: 'the hands on the keys', short: 'hands', role: w.hands, prov: PLAYER, moving: true, solid: cap(L.handL.wrist, add(L.handL.wrist, scale(L.handL.dir, 120)), 48) },
    { id: 'ww.handR', label: 'the hands on the keys', short: 'hands', role: w.hands, prov: PLAYER, moving: true, listIn: [], solid: cap(L.handR.wrist, add(L.handR.wrist, scale(L.handR.dir, 120)), 48) },
  ];
  for (const [k, s, e, h] of [
    ['L', B.shoulderL, L.handL.elbow, L.handL.wrist],
    ['R', B.shoulderR, L.handR.elbow, L.handR.wrist],
  ] as const) {
    parts.push({ id: `ww.arm${k}1`, label: 'the player’s arms', short: 'arms', role: 'The arms hold the instrument up; the elbows move as the player breathes and phrases.', prov: PLAYER, moving: true, listIn: [], solid: cap(s, e, 52) });
    parts.push({ id: `ww.arm${k}2`, label: 'the player’s arms', short: 'arms', role: 'The forearm.', prov: PLAYER, moving: true, listIn: [], solid: cap(e, h, 44) });
  }
  for (const [k, a, b, r] of [
    ['thighL', B.hipL, B.kneeL, 76],
    ['thighR', B.hipR, B.kneeR, 76],
    ['shinL', B.kneeL, B.ankleL, 56],
    ['shinR', B.kneeR, B.ankleR, 56],
    ['footL', B.ankleL, B.toeL, 46],
    ['footR', B.ankleR, B.toeR, 46],
  ] as const) {
    parts.push({ id: `ww.${k}`, label: 'the player’s legs and feet', short: 'legs', role: 'Keep stand bases and cables clear of the legs and feet.', prov: PLAYER, listIn: [], solid: cap(a, b, r) });
  }
  if (L.chair) {
    parts.push({ id: 'ww.chair', label: 'the chair', short: 'chair', role: 'A firm chair without arms. Keep a stand’s base off its legs.', prov: PLAYER, solid: { kind: 'box', min: L.chair.seat.min, max: L.chair.seat.max } });
    parts.push({ id: 'ww.chairBack', label: 'the chair', short: 'chair', role: 'The chair’s back.', prov: PLAYER, listIn: [], solid: { kind: 'box', min: L.chair.back.min, max: L.chair.back.max } });
    L.chair.legs.forEach(([a, b], i) => parts.push({ id: `ww.chairLeg${i}`, label: 'the chair', short: 'chair', role: 'A chair leg.', prov: PLAYER, listIn: [], solid: cap(a, b, 14) }));
  }
  if (L.peg) {
    parts.push({ id: 'ww.peg', label: 'the floor peg', short: 'peg', role: 'A metal rod from the bow to the floor carries the instrument’s weight. Keep stand bases and cables off it — a knock on the peg reaches the mic as a thump.', prov: ill('the peg: a drawing default'), solid: cap(L.peg.a, L.peg.b, 7) });
    parts.push({ id: 'ww.pegFoot', label: 'the floor peg', short: 'peg', role: 'A keep-out round the peg’s foot.', prov: ill('a 120 mm keep-out round the peg’s foot (drawing default)'), listIn: [], solid: cap(L.peg.b, L.peg.b, 120) });
  }
  return parts;
}

/** The family's model for one layout (one posture / one design). */
export function windModel(L: Layout, o: WindModelOpts): InstrumentModel {
  const parts: Part[] = [...instrumentParts(L, o.words)];
  const ex = L.spec.family === 'edge' ? 0 : 20;
  parts.push({ id: 'ww.exciter', label: o.words.exciter.label, short: o.words.exciter.short, role: o.words.exciter.role, prov: L.spec.length.prov, solid: cap(frameAt(L, -10).p, frameAt(L, ex).p, 4) });
  parts.push({ id: 'ww.keys', label: 'keys and tone holes', short: 'keys', role: o.words.keys, prov: ill('the tone holes: the semitone rule (DERIVED); the keys: drawing defaults') });
  parts.push(...playerParts(L, o.words));
  const front = L.body.floorY;
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: o.regions,
    surfaces: o.surfaces,
    lines: o.lines ?? [{ id: 'axis', label: 'the instrument’s centre line', point: frameAt(L, 0).p, dir: frameAt(L, L.spec.end * 0.5).t }],
    envelopes: [],
    variants: o.variants,
    defaultVariant: o.variants[0].id,
    views: o.views,
    ...(o.fitAuthored ? { fitAuthored: o.fitAuthored } : {}),
    // A mic may face the player (the usual way), or look forward from behind
    // the head: the aim may swing all the way round.
    aimAzLimit: 180,
    aimHome: { az: -90, el: 0 },
    viewTags: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
    yFloor: { mm: front, prov: { kind: 'unknown', needed: 'the player’s height above the floor (a posture drawing default)' }, placeholder: true },
    // Nothing counts as "inside" a woodwind: a degenerate interior far away.
    interior: { x0: 0, x1: 1, rIn: 0.5, c: { x: 0, y: -5000, z: 0 } },
    rims: o.rims,
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
    // A stand's boom runs level, straight back from the mic's tail; a mic
    // pointing nearly straight down hangs from a boom on the audience side.
    mountRule: { boom: 'level', fallback: { x: 0, y: 0, z: 1 }, length: 420 },
  };
}

/* ── the family's reference points (each lesson picks its own) ── */

/** A target point ON the instrument's key side at s (mm off the axis). */
export function keySidePoint(L: Layout, s: number, off = 0): Vec3 {
  const f = frameAt(L, s);
  return add(f.p, scale(f.n, radiusAt(L.spec, s) + off));
}

/** The middle of the tone-hole field (the first holes to the last). */
export function holeFieldS(spec: WindSpec): number {
  return (holeS(spec, 1) + holeS(spec, spec.holes.length)) / 2;
}

/** The radiating regions every woodwind shares (the lesson adds its words). */
export function windRegions(L: Layout, words: { holes: string; end: string; exciter?: string }): RadiatingRegion[] {
  const spec = L.spec;
  const holesAt = keySidePoint(L, holeFieldS(spec));
  const endAt = frameAt(L, spec.end).p;
  const out: RadiatingRegion[] = [
    { id: 'r.holes', partId: 'ww.keys', label: 'the open tone holes', anchor: holesAt, prov: ill('the middle of the hole field'), note: words.holes },
    { id: 'r.end', partId: spec.family === 'edge' ? `ww.${spec.pieces[spec.pieces.length - 1].id}` : 'ww.bell', label: spec.family === 'edge' ? 'the open foot' : 'the bell', anchor: endAt, prov: spec.length.prov, note: words.end },
  ];
  if (words.exciter) out.push({ id: 'r.exciter', partId: 'ww.exciter', label: spec.family === 'edge' ? 'the embouchure hole' : 'the reed', anchor: frameAt(L, 0).p, prov: ill('the player’s end'), note: words.exciter });
  return out;
}
