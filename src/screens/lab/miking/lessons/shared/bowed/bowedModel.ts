/**
 * THE BOWED FAMILY IN THE ENGINE (charter §2 layer 2): the solids, the
 * moving envelopes, the reference surfaces and the clip attachments one
 * posture compiles to — built from bowedSpec.ts and posture.ts, so the
 * drawing, the collisions, the zones and the readouts agree.
 *
 * ENVELOPES (violin/GEOMETRY_PROPOSAL.md §3, all ILLUSTRATIVE):
 *   • the BOW's sweep — a two-sided FAN through the contact point, across the
 *     strings both ways (the stick reaches the tip side at the frog and the
 *     frog side at the tip), tilted ±25° for the string crossings, as long
 *     as the bow (the bass: its sourced hair). Its thickness along the
 *     strings covers the contact's travel; it starts at the bridge, which
 *     the bow cannot cross. Rounded 25 mm: the stick and hair (≈ 12) plus
 *     the spread of the outer strings (≈ 13) — the proposal's ±40 slab drawn
 *     tighter so the space under the strings stays open (CORRECTIONS_LOG B-06);
 *   • the BOW HAND's travel — a one-sided fan on the frog side, rounded by
 *     the hand (80; the bass 90, proposal);
 *   • the BOW ARM — shoulder → elbow → hand at the frog, the middle and the
 *     tip of a stroke;
 *   • the LEFT HAND along the fingerboard (±70, proposal);
 *   • the bassist's PLUCKING hand (x′ 60–300 above the bridge, ±60);
 *   • the player's head, torso and legs; the chair; the endpin and a 150 mm
 *     keep-out round its tip.
 * No mic, gooseneck or stand may enter any of them (the lessons' safety
 * rule); the engine stops the mic and names the part.
 *
 * Pure: plain data.
 */
import type { Dim, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, Vec3, ViewBox, MicPose } from '../../../engine/model/types.ts';
import { add, angleBetween, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { archAt, fbHalf, fingerboardZ, halfWidth, stringYs, stringZ, type BowedSpec } from './bowedSpec.ts';
import { anchorsOf, toLesson, type BPoint, type Posture } from './posture.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('the player’s body: a drawing default (no source gives a player’s reach)');
const D = Math.PI / 180;

/** The capsule a limb is drawn and collided as. */
const cap = (a: Vec3, b: Vec3, r: number): Shape3 => ({ kind: 'capsule', a, b, r });

export type BowedModelOpts = {
  id: string;
  name: string;
  /** Which hand works the strings: a bow, or a plucking hand. */
  right: 'bow' | 'pluck';
  views: { side: ViewBox; top: ViewBox };
  /** The clip/holder attachment points (frame B). */
  attach: { id: string; label: string; at: BPoint }[];
  /** The "front" each target surface's cone is measured about (unit). */
  front: Vec3;
  /** The instrument's own clearance (illustrative). */
  clearance: Dim;
  /** Extra surfaces a lesson measures from. */
  surfaces?: ReferenceSurface[];
  variants?: InstrumentModel['variants'];
};

/** The parts list, the envelopes and the surfaces of one posture. */
export function bowedModel(P: Posture, o: BowedModelOpts): InstrumentModel {
  const { spec, st, ax, player: pl } = P;
  const B = (p: BPoint) => toLesson(ax, p);
  const A = anchorsOf(P);
  const rib = spec.rib.mm;
  const sizeProv: Provenance = spec.body.prov;
  const ddProv = (d: Dim): Provenance => d.prov;
  const xl = st.tailX + spec.body.mm * spec.stations.lower;
  const xu = st.tailX + spec.body.mm * spec.stations.upper;
  const zBack = -rib - spec.archBack.mm;
  const clr = o.clearance;

  /* the instrument */
  const parts: Part[] = [
    {
      id: 'bw.body',
      label: `${spec.name} body (top, ribs and back)`,
      short: 'body',
      role: 'The hollow wooden box: an arched spruce top, maple ribs and back. The bridge drives the top; the top and back, and the air inside, radiate most of the sound.',
      prov: sizeProv,
      clearance: clr,
      solid: { kind: 'slab', c: B({ x: xl, y: 0, z: 0 }), axis: ax.z, r: spec.lower.mm / 2, x0: zBack, x1: spec.archTop.mm },
    },
    {
      id: 'bw.bodyUpper',
      label: `${spec.name} body (top, ribs and back)`,
      short: 'body',
      role: 'The upper bouts of the body.',
      prov: sizeProv,
      clearance: clr,
      listIn: [],
      solid: { kind: 'slab', c: B({ x: xu, y: 0, z: 0 }), axis: ax.z, r: spec.upper.mm / 2, x0: zBack, x1: spec.archTop.mm * 0.9 },
    },
    {
      // The waist between the two bouts' discs: a rounded bar across.
      id: 'bw.bodyWaist',
      label: `${spec.name} body (top, ribs and back)`,
      short: 'body',
      role: 'The waist (the C-bouts) of the body.',
      prov: sizeProv,
      clearance: clr,
      listIn: [],
      solid: cap(B({ x: st.tailX + spec.body.mm * spec.stations.waist, y: -spec.middle.mm * 0.42, z: (spec.archTop.mm + zBack) / 2 }), B({ x: st.tailX + spec.body.mm * spec.stations.waist, y: spec.middle.mm * 0.42, z: (spec.archTop.mm + zBack) / 2 }), (spec.archTop.mm - zBack) / 2),
    },
    {
      id: 'bw.fholes',
      label: 'f-holes',
      short: 'f-holes',
      role: 'The two openings cut in the top beside the bridge. They let the top move more freely and let the air inside breathe in and out.',
      prov: ddProv(spec.fholeY),
    },
    {
      id: 'bw.bridge',
      label: 'bridge',
      short: 'bridge',
      role: 'A thin maple bridge, held in place only by the strings’ pressure. It carries their vibration to the top. Never clamp anything to it, and never move it.',
      prov: ddProv(spec.bridgeH),
      clearance: clr,
      solid: { kind: 'slab', c: B({ x: 0, y: 0, z: spec.bridgeH.mm - spec.bridgeW.mm / 2 }), axis: ax.x, r: spec.bridgeW.mm / 2, x0: -3, x1: 3 },
    },
    {
      id: 'bw.strings',
      label: 'strings',
      short: 'strings',
      role: `Four strings — ${spec.strings.join(', ')}, lowest to highest — from the tailpiece over the bridge to the nut. The bow or the fingers set them vibrating.`,
      prov: ddProv(spec.bridgeH),
    },
    {
      id: 'bw.fingerboard',
      label: 'fingerboard',
      short: 'fingerboard',
      role: 'The ebony board under the strings. The left hand stops the strings against it; its far end overhangs the top.',
      prov: ddProv(spec.fbEnd),
      clearance: clr,
      solid: cap(B({ x: st.fbEndX, y: 0, z: fingerboardZ(spec, st.fbEndX) - fbHalf(spec, st.fbEndX) * 0.7 }), B({ x: st.nutX, y: 0, z: fingerboardZ(spec, st.nutX) - fbHalf(spec, st.nutX) * 0.7 }), fbHalf(spec, st.fbEndX) * 0.75),
    },
    {
      id: 'bw.neck',
      label: 'neck, pegbox and scroll',
      short: 'scroll',
      role: 'The neck carries the fingerboard; the pegs in the pegbox tune the strings; the carved scroll ends it.',
      prov: spec.overall.prov,
      clearance: clr,
      solid: cap(B({ x: st.neckX, y: 0, z: -fbHalf(spec, st.neckX) * 0.4 }), B({ x: st.scrollX - fbHalf(spec, st.nutX) * 0.9, y: 0, z: fingerboardZ(spec, st.nutX) - fbHalf(spec, st.nutX) * 1.4 }), fbHalf(spec, st.nutX) * 1.05),
    },
    {
      id: 'bw.tailpiece',
      label: 'tailpiece',
      short: 'tailpiece',
      role: 'Anchors the strings behind the bridge. A holder that grips two strings sits between it and the bridge.',
      prov: ill('tailpiece span: proposal drawing default'),
      clearance: clr,
      solid: cap(B({ x: spec.tailpiece[0], y: 0, z: stringZ(spec, spec.tailpiece[0]) * 0.55 }), B({ x: spec.tailpiece[1], y: 0, z: stringZ(spec, spec.tailpiece[1]) - 7 }), spec.bridgeW.mm * 0.3),
    },
  ];
  // The strings as solids (thin): tailpiece end → bridge top → nut, each.
  stringYs(spec, 0).forEach((y0, i) => {
    const yT = stringYs(spec, spec.tailpiece[1])[i];
    const yN = stringYs(spec, st.nutX)[i];
    const tp = B({ x: spec.tailpiece[1], y: yT, z: stringZ(spec, spec.tailpiece[1]) });
    const br = B({ x: 0, y: y0, z: spec.bridgeH.mm - Math.abs(y0) * 0.12 });
    const nut = B({ x: st.nutX, y: yN, z: stringZ(spec, st.nutX) });
    parts.push({ id: `bw.str${i}a`, label: 'strings', short: 'strings', role: 'A string.', prov: ddProv(spec.bridgeH), listIn: [], moving: true, solid: cap(tp, br, 2) });
    parts.push({ id: `bw.str${i}b`, label: 'strings', short: 'strings', role: 'A string.', prov: ddProv(spec.bridgeH), listIn: [], moving: true, solid: cap(br, nut, 2) });
  });
  if (spec.id === 'violin' || spec.id === 'viola') {
    parts.push({
      id: 'bw.chinrest',
      label: 'chin rest',
      short: 'chin rest',
      role: 'The player’s jaw rests here, on the bass side of the tailpiece. A shoulder rest under the back holds the instrument up.',
      prov: ill('chin rest: a drawing default'),
      clearance: clr,
      solid: cap(B({ x: st.tailX + 22, y: -spec.lower.mm * 0.12, z: spec.archTop.mm * 0.6 + 10 }), B({ x: st.tailX + 48, y: -spec.lower.mm * 0.36, z: spec.archTop.mm * 0.5 + 10 }), 16),
    });
  }
  if (P.endpinTip) {
    const collar = B({ x: st.tailX - (spec.collar?.mm ?? 0), y: 0, z: -rib / 2 });
    parts.push({
      id: 'bw.endpin',
      label: 'endpin',
      short: 'endpin',
      role: 'The metal spike that holds the instrument up off the floor. Keep stands, cables and feet well clear of its point.',
      prov: ddProv(spec.endpin!),
      solid: cap(collar, P.endpinTip, 7),
    });
    parts.push({
      id: 'bw.endpinFloor',
      label: 'the endpin’s point on the floor',
      short: 'endpin',
      role: 'Keep a stand’s base well away from the endpin’s point.',
      prov: ill('a 150 mm keep-out round the endpin’s tip (proposal)'),
      listIn: [],
      solid: cap(P.endpinTip, P.endpinTip, 150),
    });
  }

  /* the player and the moving envelopes */
  const bow = P.bow;
  const bowR = (spec.bowHair?.mm ?? spec.bow.mm) + (spec.bowHair ? 20 : 0);
  const handR = spec.id === 'bass' ? 90 : 80;
  const sweepC = add(bow.contact, scale(ax.x, 0));
  const halfAlong = st.contactHalf + 10;
  const along = scale(ax.x, 1);
  if (o.right === 'bow') {
    parts.push({
      id: 'bw.bow',
      label: 'the bow’s path',
      short: 'bow path',
      role: 'The bow crosses the strings both ways — its tip side reaches out when the frog is at the strings, and the frog side when the tip is — tilting to reach each string. Nothing may stand in this sweep.',
      moving: true,
      prov: ill(spec.bowHair ? 'bow hair sourced; the sweep ±25°, the stick’s thickness and the contact travel are drawing defaults' : 'bow length, the sweep ±25° and the contact travel are drawing defaults'),
      solid: { kind: 'fan', c: sweepC, axis: along, u: ax.y, v: ax.z, r: bowR, ang: 25 * D, halfW: halfAlong, round: 25, twoSided: true },
    });
    parts.push({
      id: 'bw.bowHand',
      label: 'the bow hand’s path',
      short: 'bow hand',
      role: 'The hand holding the frog travels the whole length of the bow on the player’s bow side, from the strings out to arm’s length.',
      moving: true,
      prov: ill('the bow hand: a drawing default (proposal: a sphere at each end)'),
      // The hand rides above the stick (its centre 60 mm out from the
      // strings) and overhangs the bridge a little at most.
      solid: { kind: 'fan', c: add(add(sweepC, scale(ax.x, 40)), scale(ax.z, 60)), axis: along, u: bow.dir, v: ax.z, r: bowR + 20, ang: 25 * D, halfW: st.contactHalf + 50, round: handR - 10 },
    });
  } else {
    parts.push({
      id: 'bw.pluck',
      label: 'the plucking hand’s path',
      short: 'pluck hand',
      role: 'The plucking fingers work the strings a little above the bridge, up to the end of the fingerboard, pulling each string sideways.',
      moving: true,
      prov: ill('env.ub.pluck: x′ 60–300 above the bridge, ±60 (proposal drawing default)'),
      solid: cap(B({ x: 60, y: 0, z: stringZ(spec, 60) }), B({ x: 300, y: 0, z: stringZ(spec, 300) }), 60),
    });
  }
  // The bow arm: shoulder → elbow → hand, at three points of a stroke.
  const arm = o.right === 'bow' ? P.strokes : [{ hand: pl.handR, elbow: pl.elbowR }];
  arm.forEach((s, i) => {
    parts.push({ id: `bw.armR${i}a`, label: o.right === 'bow' ? 'the bow arm' : 'the right arm', short: o.right === 'bow' ? 'bow arm' : 'arm', role: o.right === 'bow' ? 'The bow arm swings from the shoulder as the bow travels — from close to the body at the frog to out at arm’s length at the tip.' : 'The right arm reaches the strings from the player’s side.', moving: true, prov: PLAYER, listIn: i === 1 || o.right === 'pluck' ? undefined : [], solid: cap(pl.shoulderR, s.elbow, 55) });
    parts.push({ id: `bw.armR${i}b`, label: o.right === 'bow' ? 'the bow arm' : 'the right arm', short: o.right === 'bow' ? 'bow arm' : 'arm', role: 'The forearm and hand.', moving: true, prov: PLAYER, listIn: [], solid: cap(s.elbow, s.hand, 50) });
  });
  parts.push({
    id: 'bw.leftHand',
    label: 'the left hand’s path',
    short: 'left hand',
    role: 'The left hand stops the strings anywhere along the fingerboard and shifts up and down it.',
    moving: true,
    prov: ill('env.bw.leftHand: the fingerboard, ±70 round the neck (proposal)'),
    solid: cap(B({ x: st.fbEndX + 40, y: 0, z: fingerboardZ(spec, st.fbEndX + 40) - 10 }), B({ x: st.nutX - 10, y: 0, z: fingerboardZ(spec, st.nutX) - 10 }), 70),
  });
  parts.push({ id: 'bw.armL1', label: 'the left arm', short: 'left arm', role: 'The left arm reaches the neck.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.elbowL, 50) });
  parts.push({ id: 'bw.armL2', label: 'the left arm', short: 'left arm', role: 'The left forearm.', prov: PLAYER, listIn: [], solid: cap(pl.elbowL, pl.handL, 45) });
  parts.push({
    id: 'bw.player',
    label: 'the player',
    short: 'player',
    role: P.kind === 'seated' ? 'The cellist sits behind the instrument, its back against the chest, knees beside the lower bouts.' : P.kind === 'standing' ? 'The bassist stands behind the instrument, its back resting against the body.' : 'The player holds the instrument between the jaw and the shoulder, and moves with the music.',
    prov: PLAYER,
    solid: cap(pl.pelvis, pl.neck, 150),
  });
  parts.push({ id: 'bw.head', label: 'the player’s head', short: 'head', role: 'The player’s head — and their breath. Keep a close mic pointing away from it.', prov: PLAYER, listIn: [], solid: cap(pl.head, pl.head, pl.headR) });
  parts.push({ id: 'bw.shoulders', label: 'the player', short: 'player', role: 'Shoulders.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.shoulderR, 65) });
  for (const [k, a, b, r] of [
    ['thighL', pl.hipL, pl.kneeL, 75],
    ['thighR', pl.hipR, pl.kneeR, 75],
    ['shinL', pl.kneeL, pl.ankleL, 55],
    ['shinR', pl.kneeR, pl.ankleR, 55],
    ['footL', pl.ankleL, pl.toeL, 45],
    ['footR', pl.ankleR, pl.toeR, 45],
  ] as const) {
    parts.push({ id: `bw.${k}`, label: 'the player’s legs and feet', short: 'legs', role: 'The player’s legs and feet. Keep stand bases and cables clear of them.', prov: PLAYER, listIn: [], solid: cap(a, b, r) });
  }
  if (P.chair) {
    parts.push({ id: 'bw.chair', label: 'the chair', short: 'chair', role: 'A firm chair without arms.', prov: PLAYER, solid: { kind: 'box', min: P.chair.seat.min, max: P.chair.seat.max } });
    P.chair.legs.forEach(([a, b], i) => parts.push({ id: `bw.chairLeg${i}`, label: 'the chair', short: 'chair', role: 'A chair leg.', prov: PLAYER, listIn: [], solid: cap(a, b, 14) }));
  }

  /* reference surfaces and the line */
  const surfaces: ReferenceSurface[] = [
    { id: 'bridge', partId: 'bw.bridge', label: 'the bridge', point: A.bridgeTop, normal: o.front, target: true },
    ...(o.right === 'bow' ? [{ id: 'contact', partId: 'bw.strings', label: 'where the bow meets the strings', point: A.contact, normal: ax.z, target: true } satisfies ReferenceSurface] : []),
    { id: 'top', partId: 'bw.body', label: 'the top', point: A.bridgeFoot, normal: ax.z, plus: { words: 'in front of', key: 'FRONT OF' }, minus: { words: 'behind', key: 'BEHIND' } },
    { id: 'fhole', partId: 'bw.fholes', label: 'the f-hole', point: A.fholeT, normal: ax.z, target: true },
    ...(o.surfaces ?? []),
  ];
  const lines: RefLine[] = [{ id: 'strings', label: 'the strings', point: A.bridgeTop, dir: ax.x }];

  // A degenerate interior deep inside the body: nothing is "inside" a
  // bowed instrument for a mic (its body is a solid here).
  const interiorAxis = ax.z;
  const rims: Rim[] = o.attach.map((a) => ({ id: a.id, label: a.label, c: B(a.at), axis: interiorAxis, r: 0 }));
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: [
      { id: 'r.contact', partId: 'bw.strings', label: o.right === 'bow' ? 'where the bow meets the strings' : 'where the fingers pluck', anchor: o.right === 'bow' ? A.contact : B({ x: 200, y: 0, z: stringZ(spec, 200) }), prov: ill('the contact drawn at the middle of its travel'), note: o.right === 'bow' ? 'The bow drives the string here: the rosin and hair noise — the bow’s articulation — starts here.' : 'The fingers set the strings moving here: the pluck’s attack starts here.' },
      { id: 'r.bridge', partId: 'bw.bridge', label: 'the bridge', anchor: A.bridgeTop, prov: ill('the bridge’s top'), note: 'The strings rock the bridge, and the bridge drives the top.' },
      { id: 'r.top', partId: 'bw.body', label: 'the top and back', anchor: A.topCentre, prov: sizeProv, note: 'The top and back plates radiate most of the sound, each part differently at each pitch.' },
      { id: 'r.fhole', partId: 'bw.fholes', label: 'the f-holes', anchor: A.fholeT, prov: ill('the treble f-hole’s middle'), note: 'The air inside breathes in and out through the f-holes, strongest in the low notes.' },
    ],
    surfaces,
    lines,
    envelopes: [],
    variants: o.variants ?? [{ id: 'play', label: 'PLAYING', blurb: 'The player in a normal playing position.' }],
    defaultVariant: (o.variants ?? [{ id: 'play' }])[0].id,
    views: o.views,
    // A clip's capsule may face the audience side (toward the bridge or an
    // f-hole from in front of it): the aim may swing all the way round.
    aimAzLimit: 180,
    yFloor: { mm: P.floorY, prov: { kind: 'unknown', needed: 'the instrument’s height above the floor (a posture drawing default)' }, placeholder: true },
    interior: { x0: zBack + 10, x1: zBack + 11, rIn: 1, c: B({ x: xl, y: 0, z: 0 }), axis: interiorAxis },
    rims,
    ports: Object.fromEntries((o.variants ?? [{ id: 'play' }]).map((v) => [v.id, null])),
  };
}

/* ── zone helpers (geometry only; the lessons write the words) ── */

/** A pose at `p`, aimed at `target`. */
export function aimAt(p: Vec3, target: Vec3): MicPose {
  const u = norm(sub(target, p));
  // aimVec(az, el) = (−cos az cos el, −sin el, sin az cos el).
  const el = -Math.asin(Math.max(-1, Math.min(1, u.y))) / D;
  const az = Math.atan2(u.z, -u.x) / D;
  return { p, az, el };
}

/** A point `d` mm from `from` along a direction (normalised). */
export function along(from: Vec3, dir: Vec3, d: number): Vec3 {
  return add(from, scale(norm(dir), d));
}

/**
 * A target zone's SECTION in one view (u, v mm): the region `r0`…`r1` from
 * the target point whose direction lies within `coneMax`° of `axis` (and on
 * the `toward` side), cut through the target's plane in that view.
 */
export function zoneSection(view: 'side' | 'top', target: Vec3, axis: Vec3, coneMax: number, r0: number, r1: number, toward?: Vec3): { poly: [number, number][] }[] {
  const n = 180;
  const ok: boolean[] = [];
  const dirs: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = view === 'side' ? { x: Math.cos(a), y: Math.sin(a), z: 0 } : { x: Math.cos(a), y: 0, z: Math.sin(a) };
    dirs.push(d);
    ok.push(angleBetween(d, axis) <= coneMax + 1e-9 && (!toward || dot(d, toward) >= 0));
  }
  // The longest run of directions inside (wrapping round).
  let start = ok.findIndex((x, i) => x && !ok[(i - 1 + n) % n]);
  if (start < 0) {
    if (!ok[0]) {
      // The cone misses this plane: draw the target's disc of r1 (seen end-on).
      return [];
    }
    start = 0;
  }
  const run: number[] = [];
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (!ok[i]) break;
    run.push(i);
  }
  const uv = (p: Vec3): [number, number] => [p.x, view === 'side' ? p.y : p.z];
  const pts: [number, number][] = [];
  for (const i of run) pts.push(uv(add(target, scale(dirs[i], r1))));
  for (let k = run.length - 1; k >= 0; k--) pts.push(uv(add(target, scale(dirs[run[k]], r0))));
  return [{ poly: pts }];
}

/** A small round zone (a sphere of radius r about a point) in one view. */
export function zoneDisc(view: 'side' | 'top', c: Vec3, r: number): { poly: [number, number][] }[] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    pts.push([c.x + r * Math.cos(a), (view === 'side' ? c.y : c.z) + r * Math.sin(a)]);
  }
  return [{ poly: pts }];
}

/** The distance from a point to a direction's cone axis (for tests). */
export function offAxisDeg(from: Vec3, p: Vec3, axis: Vec3): number {
  return angleBetween(sub(p, from), axis);
}

export const _len = len;
export { archAt, halfWidth };
