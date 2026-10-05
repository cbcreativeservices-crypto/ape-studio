/**
 * THE WHOLE KIT AS ONE SCENE — the technical truth for Lab 1's kit-level
 * lessons (M09 overheads, M10 room, M11 complete kit). It reads the shared
 * 5-piece kit (kitPlanModel.ts), the shared drum family (drums/drumSpec.ts),
 * M01's owner-approved kick (m01Kick/geometry.ts) and the shared cymbal
 * family (cymbals/cymbalSpec.ts) — it adds nothing to them, only puts them
 * in ONE frame as an InstrumentModel the engine can place mics in.
 *
 * Frame: the KIT frame K (kit/GEOMETRY_PROPOSAL.md §1): origin the kick's
 * batter-head centre, +x audience, +y DOWN, +z the drummer's right; floor
 * y = 290.4. Pure; tested (test/mikingKitScene.test.ts via the lessons).
 *
 * SOLIDS are deliberately lean (the drag tests every solid on every
 * sub-step): each drum is ONE closed cylinder out to its lugs, each cymbal a
 * disc with its swing as clearance (cymbalSpec), each stand a capsule. No
 * mic in these lessons goes inside a drum, so no interior is modelled.
 *
 * THE DRUMMER (overheads/GEOMETRY_PROPOSAL.md §4, ILLUSTRATIVE drawing
 * defaults): a capsule from the throne seat (h 500) to the head top
 * (h 1300), radius 250, and the sticks' reach — a sphere of radius 700 about
 * the right shoulder (h 1150). Both are keep-outs (envelopes).
 */
import type { Dim, Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, RefLine, ReferenceSurface, Variant, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { KICK_GEOM } from '../../m01Kick/geometry.ts';
import { KIT, KIT_DRUMS, KIT_FLOOR_Y, yAt, type KitDrumId } from '../kitPlanModel.ts';
import { drumSolids, frameOf, hoopRadii, pointOn, type PlacedDrum } from '../drums/drumSpec.ts';
import { cymbalAnchors, cymbalSolids, hihatAirRing, KIT_PLACED_CYMBALS } from '../cymbals/cymbalSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });

/* ── anchors (kit/GEOMETRY_PROPOSAL.md §2; overheads/GEOMETRY_PROPOSAL.md §1) ── */

/** The kick's batter-head centre: the frame's origin (O). */
export const O: Vec3 = { x: 0, y: 0, z: 0 };
/** The snare's batter-head centre (S0): the overheads' "target spot". */
export const S0: Vec3 = KIT_DRUMS.snare.c;
/** The floor tom's batter centre and its rim's top (h_hoop 10 above the head). */
export const FT_C: Vec3 = KIT_DRUMS.floor.c;
export const FT_RIM_H = KIT_FLOOR_Y - FT_C.y + KIT_DRUMS.floor.spec.hoop.above.mm;
/** The kick's front (resonant) head centre. */
export const KICK_FRONT: Vec3 = { x: KICK_GEOM.L, y: 0, z: 0 };
/** The kit centre in plan: the midpoint of O and S0 (a drawing default; the
 *  mono overhead's plan point and the room's C_k). */
export const KIT_CENTRE = { x: (O.x + S0.x) / 2, z: (O.z + S0.z) / 2 };
/** The drummer (drawing defaults, overheads proposal §1). */
export const DRUMMER = {
  headTop: { x: -720, y: yAt(KIT.drummer.headTopH), z: -110 } as Vec3,
  shoulderR: { x: KIT.drummer.rightShoulder.x, y: yAt(KIT.drummer.rightShoulder.h), z: KIT.drummer.rightShoulder.z } as Vec3,
  seatH: KIT.throne.seatH,
  bodyR: 250,
  reach: 700,
};

/** Height above the floor of a K point. */
export const heightOf = (p: Vec3): number => KIT_FLOOR_Y - p.y;

/* ── parts ── */

/** A drum as ONE closed cylinder out to its lugs (no interior: these lessons
 *  never put a mic inside a drum). */
function drumBlock(d: PlacedDrum): Part['solid'] {
  const f = frameOf(d);
  const { rOut } = hoopRadii(d.spec);
  const r = Math.max(rOut, f.R + d.spec.lug.out.mm);
  return { kind: 'slab', c: d.c, axis: f.axis, r, x0: -d.spec.hoop.above.mm, x1: f.depth + d.spec.hoop.above.mm };
}

/** The kick as one closed cylinder (hoop to hoop), its pedal as a box. */
const KICK_BLOCK = { kind: 'slab', c: O, r: KICK_GEOM.hoopOut, x0: KICK_GEOM.hoopX.batter[0], x1: KICK_GEOM.hoopX.reso[1] } as const;

/** The double tom holder on the kick (KitPlan's PLAN_HARDWARE.tomPost): a
 *  post from the kick's shell top and an arm to each rack tom's shell. */
export const TOM_POST = { u: 230, v: -110 };
function tomMount(): { post: Part['solid']; arms: Part['solid'][] } {
  const top: Vec3 = { x: TOM_POST.u, y: -KICK_GEOM.R, z: TOM_POST.v };
  const head: Vec3 = { x: TOM_POST.u, y: yAt(780), z: TOM_POST.v };
  const arms = (['tom1', 'tom2'] as const).map((id) => {
    const d = KIT_DRUMS[id];
    const p = pointOn(frameOf(d), d.spec.d.mm / 2, 0, d.spec.depth.mm * 0.5);
    return { kind: 'capsule', a: head, b: { x: (p.x + head.x) / 2, y: p.y, z: (p.z + head.z) / 2 }, r: 11 } as Part['solid'];
  });
  return { post: { kind: 'capsule', a: top, b: head, r: 14 }, arms };
}

export type KitPartRoles = Partial<Record<string, string>>;

const DEFAULT_ROLES: Record<string, string> = {
  'kit.kick': 'The bass drum, on the floor in the middle: the beater strikes its batter head; the front head faces the audience.',
  'kit.snare': 'The snare, between the player’s knees: the backbeat. Overhead distances are usually measured to its centre.',
  'kit.tom1': 'The smaller rack tom, on the holder over the kick, tilted toward the player.',
  'kit.tom2': 'The larger rack tom, on the holder over the kick, tilted toward the player.',
  'kit.floor': 'The floor tom, on its own legs at the player’s right.',
  'cym.hihat': 'The hi-hats: two cymbals face to face on a stand, opened and closed by the player’s left foot.',
  'cym.crash1': 'A crash cymbal over the hi-hat side, struck on its edge for accents.',
  'cym.crash2': 'A larger crash over the toms, on the player’s right.',
  'cym.ride': 'The ride cymbal, over the floor tom: played on its bow and bell for time.',
  'kit.throne': 'The throne — the player’s seat. The space around it is the player’s.',
};

const LABELS: Record<string, { label: string; short: string }> = {
  'kit.kick': { label: '22 × 18 in kick drum', short: 'kick' },
  'kit.snare': { label: '14 × 5.5 in snare drum', short: 'snare' },
  'kit.tom1': { label: '10 × 7 in rack tom', short: '10 in tom' },
  'kit.tom2': { label: '12 × 8 in rack tom', short: '12 in tom' },
  'kit.floor': { label: '16 × 16 in floor tom', short: 'floor tom' },
  'cym.hihat': { label: '14 in hi-hats', short: 'hi-hats' },
  'cym.crash1': { label: '16 in crash', short: '16 in crash' },
  'cym.crash2': { label: '18 in crash', short: '18 in crash' },
  'cym.ride': { label: '20 in ride', short: 'ride' },
  'kit.throne': { label: 'throne', short: 'throne' },
};

const SIZE_PROV: Provenance = { kind: 'sourced', src: 'ZIL-K / YMH-RC / TAMA-SSC', quote: 'the standard 5-piece kit sizes (kit/SOURCES.md §a)' };
const LAYOUT_PROV = ill('a typical right-handed layout; positions and heights are drawing defaults (kit/GEOMETRY_PROPOSAL.md §2)');

/** The kit's parts (sizes sourced, layout illustrative). `roles` replaces
 *  the default one-line roles (each lesson says what a part means for ITS
 *  mics). */
export function kitParts(roles: KitPartRoles = {}): Part[] {
  const role = (id: string) => roles[id] ?? DEFAULT_ROLES[id];
  const part = (id: string, solid: Part['solid'], extra: Partial<Part> = {}): Part => ({ id, label: LABELS[id].label, short: LABELS[id].short, role: role(id), solid, prov: SIZE_PROV, ...extra });
  const drums: Part[] = (['snare', 'tom1', 'tom2', 'floor'] as KitDrumId[]).map((k) => part(`kit.${k}`, drumBlock(KIT_DRUMS[k])));
  const cyms = cymbalSolids();
  const cymParts: Part[] = cyms
    .filter((c) => c.id.startsWith('cym.'))
    .map((c) => part(c.id, c.shape, { moving: true, clearance: { mm: c.clearance, prov: unk(c.id === 'cym.hihat' ? 'the hi-hats’ opening travel (12.7 mm, a trial reading)' : 'the swing a struck cymbal makes (± 60 mm, a drawing default)'), placeholder: true } as Dim }));
  // Stands, the tom holder, the pedals and the throne's post: solids a mic
  // stays clear of, not parts to name (listIn: none).
  const hidden = (id: string, label: string, short: string, solid: Part['solid']): Part => ({ id, label, short, role: '', solid, prov: LAYOUT_PROV, listIn: [] });
  const stands: Part[] = cyms.filter((c) => !c.id.startsWith('cym.')).map((c) => hidden(c.id, c.label, c.id.startsWith('boom.') ? 'cymbal boom' : 'stand', c.shape));
  const mount = tomMount();
  const snareBottom = S0.y + KIT_DRUMS.snare.spec.depth.mm + KIT_DRUMS.snare.spec.hoop.above.mm;
  const ft = frameOf(KIT_DRUMS.floor);
  const ftLegs: Part[] = [0, 1, 2].map((k) => {
    const L = KIT_DRUMS.floor.spec.legs!;
    const th = L.phaseDeg.mm + (k * 360) / L.n.mm;
    const top = pointOn(ft, ft.R + 14, th, ft.depth * 0.3);
    const foot = pointOn(ft, ft.R + L.spread.mm, th, 0);
    return hidden(`leg.floor${k}`, 'floor-tom leg', 'leg', { kind: 'capsule', a: top, b: { x: foot.x, y: KIT_FLOOR_Y, z: foot.z }, r: L.r.mm });
  });
  return [
    part('kit.kick', KICK_BLOCK as Part['solid']),
    ...drums,
    ...cymParts,
    part('kit.throne', { kind: 'slab', c: { x: KIT.throne.c.u, y: yAt(KIT.throne.seatH), z: KIT.throne.c.v }, axis: { x: 0, y: 1, z: 0 }, r: KIT.throne.r, x0: 0, x1: 80 }),
    ...stands,
    hidden('mount.post', 'tom holder', 'tom holder', mount.post),
    ...mount.arms.map((a, i) => hidden(`mount.arm${i}`, 'tom holder arm', 'tom arm', a)),
    hidden('stand.snare', 'snare stand', 'snare stand', { kind: 'capsule', a: { x: S0.x, y: snareBottom + 40, z: S0.z }, b: { x: S0.x, y: KIT_FLOOR_Y, z: S0.z }, r: 15 }),
    hidden('stand.throne', 'throne post', 'throne', { kind: 'capsule', a: { x: KIT.throne.c.u, y: yAt(KIT.throne.seatH - 80), z: KIT.throne.c.v }, b: { x: KIT.throne.c.u, y: KIT_FLOOR_Y, z: KIT.throne.c.v }, r: 22 }),
    hidden('kit.pedal', 'kick pedal', 'pedal', { kind: 'box', min: { x: KICK_GEOM.pedal.x0, y: KICK_GEOM.pedal.top, z: -45 }, max: { x: KICK_GEOM.pedal.x1, y: KIT_FLOOR_Y, z: 45 } }),
    hidden('hihat.pedal', 'hi-hat pedal', 'pedal', { kind: 'box', min: { x: KIT.hihatPedal.u0, y: KIT_FLOOR_Y - 60, z: KIT.hihatPedal.v - KIT.hihatPedal.halfW }, max: { x: KIT.hihatPedal.u1, y: KIT_FLOOR_Y, z: KIT.hihatPedal.v + KIT.hihatPedal.halfW } }),
    ...ftLegs,
  ];
}

/** The keep-outs: the drummer's body and the sticks' reach; the hi-hat's
 *  air-burst ring. */
export function kitEnvelopes(): Envelope[] {
  const seat = { x: KIT.throne.c.u, y: yAt(DRUMMER.seatH + DRUMMER.bodyR), z: KIT.throne.c.v };
  const head = { x: DRUMMER.headTop.x, y: DRUMMER.headTop.y + DRUMMER.bodyR, z: DRUMMER.headTop.z };
  return [
    { id: 'env.drummer', label: 'the drummer', shape: { kind: 'capsule', a: seat, b: head, r: DRUMMER.bodyR }, prov: ill('a seated body from the throne (h 500) to the head top (h 1300), radius 250 — drawing defaults, not a published figure') },
    { id: 'env.sticks', label: 'the sticks’ reach', shape: { kind: 'capsule', a: DRUMMER.shoulderR, b: DRUMMER.shoulderR, r: DRUMMER.reach }, prov: ill('a 700 mm reach about the right shoulder (h 1150) — a drawing default for the sticks and arms') },
    { id: 'env.hihatAir', label: 'the hi-hat’s air burst', shape: hihatAirRing(KIT_PLACED_CYMBALS.hihat), prov: { kind: 'sourced', src: 'DPA-HH', quote: 'there’s a lot of air pressure moving out from the sides' } },
  ];
}

/** Sound sources (the two-mic page's SOURCE; the arrival-time readouts). */
export function kitRegions(notes: Partial<Record<string, string>> = {}): RadiatingRegion[] {
  const r = (id: string, partId: string, label: string, anchor: Vec3, note: string): RadiatingRegion => ({ id, partId, label, anchor, prov: LAYOUT_PROV, note: notes[id] ?? note });
  const tom = (k: KitDrumId) => KIT_DRUMS[k].c;
  return [
    r('src.snare', 'kit.snare', 'snare', S0, 'The snare’s batter head, at its centre.'),
    r('src.kick', 'kit.kick', 'kick', O, 'The kick’s batter head, at its centre.'),
    r('src.hihat', 'cym.hihat', 'hi-hats', KIT_PLACED_CYMBALS.hihat.c, 'The hi-hats, at their centre.'),
    r('src.tom1', 'kit.tom1', '10 in tom', tom('tom1'), 'The 10 in rack tom’s batter head.'),
    r('src.tom2', 'kit.tom2', '12 in tom', tom('tom2'), 'The 12 in rack tom’s batter head.'),
    r('src.floor', 'kit.floor', 'floor tom', tom('floor'), 'The floor tom’s batter head.'),
    r('src.crash1', 'cym.crash1', '16 in crash', cymbalAnchors('crash1').centre, 'The 16 in crash, at its centre.'),
    r('src.crash2', 'cym.crash2', '18 in crash', cymbalAnchors('crash2').centre, 'The 18 in crash, at its centre.'),
    r('src.ride', 'cym.ride', 'ride', cymbalAnchors('ride').centre, 'The ride, at its centre.'),
  ];
}

/** Reference surfaces every kit-level lesson can measure from. */
export const KIT_SURFACES: ReferenceSurface[] = [
  { id: 'snare', partId: 'kit.snare', label: 'the snare head', point: S0, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
  { id: 'ftRim', partId: 'kit.floor', label: 'the floor-tom rim', point: { x: FT_C.x, y: yAt(FT_RIM_H), z: FT_C.z }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
  { id: 'kickFront', partId: 'kit.kick', label: 'the kick’s front head', point: KICK_FRONT, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'in front of', key: 'IN FRONT OF' }, minus: { words: 'behind', key: 'BEHIND' } },
];

/** Reference lines: the snare's centre line (vertical), the kick's axis and
 *  the kit's centre line (vertical through the midpoint of kick and snare). */
export const KIT_LINES: RefLine[] = [
  { id: 'snareLine', label: 'the snare’s centre line', point: S0, dir: { x: 0, y: 1, z: 0 } },
  { id: 'kickAxis', label: 'the kick’s axis', point: O, dir: { x: 1, y: 0, z: 0 } },
  { id: 'kitLine', label: 'the kit’s centre line', point: { x: KIT_CENTRE.x, y: 0, z: KIT_CENTRE.z }, dir: { x: 0, y: 1, z: 0 } },
];

const DEG = Math.PI / 180;
/** The aim (az, el) that points a mic's front from p toward q (the engine's
 *  aimVec convention); straight up or down keeps az at 0. */
export function aimToward(p: Vec3, q: Vec3): { az: number; el: number } {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const dz = q.z - p.z;
  const l = Math.hypot(dx, dy, dz);
  const el = Math.asin(Math.max(-1, Math.min(1, -dy / l))) / DEG;
  const az = Math.abs(el) > 89.9 ? 0 : Math.atan2(dz, -dx) / DEG;
  return { az, el };
}

export type KitModelOpts = {
  id: string;
  name: string;
  variants: Variant[];
  defaultVariant: string;
  views: Partial<Record<ViewId, ViewBox>>;
  viewsByVariant?: InstrumentModel['viewsByVariant'];
  roles?: KitPartRoles;
  regionNotes?: Partial<Record<string, string>>;
  /** The source the two-mic page opens on (default the snare). */
  firstRegion?: string;
  /** Extra parts (a lesson's room walls, a stage's monitors). */
  extraParts?: Part[];
  extraEnvelopes?: Envelope[];
  surfaces?: ReferenceSurface[];
  lines?: RefLine[];
};

/** The kit as an InstrumentModel for one lesson. */
export function kitModel(o: KitModelOpts): InstrumentModel {
  return {
    id: o.id,
    name: o.name,
    parts: [...kitParts(o.roles), ...(o.extraParts ?? [])],
    regions: (() => {
      const rs = kitRegions(o.regionNotes);
      const i = o.firstRegion ? rs.findIndex((r) => r.id === o.firstRegion) : -1;
      return i > 0 ? [rs[i], ...rs.slice(0, i), ...rs.slice(i + 1)] : rs;
    })(),
    surfaces: o.surfaces ?? KIT_SURFACES,
    lines: o.lines ?? KIT_LINES,
    envelopes: [...kitEnvelopes(), ...(o.extraEnvelopes ?? [])],
    variants: o.variants,
    defaultVariant: o.defaultVariant,
    views: o.views,
    viewsByVariant: o.viewsByVariant,
    yFloor: { mm: KIT_FLOOR_Y, prov: unk('the floor line (M01’s floor; do the kick’s hoops touch the floor?)'), placeholder: true },
    // No mic in a kit-level lesson goes inside a drum: an empty interior.
    interior: { x0: 0, x1: 0, rIn: 0, c: O },
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
    boomHub: { x: KIT_CENTRE.x, y: 0, z: KIT_CENTRE.z },
  };
}

/** Plain distance (mm). */
export function distMm(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
