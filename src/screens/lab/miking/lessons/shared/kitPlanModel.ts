/**
 * THE KIT — ONE shared 5-piece kit for every Lab 1 drum lesson (owner ruling
 * 2026-10-05: "one shared kit everywhere; the rack tom moves"). Source:
 * docs/labs/miking/kit/GEOMETRY_PROPOSAL.md §2 (positions, heights, tilts) and
 * kit/SOURCES.md §a (sizes). Pure; tested (test/mikingKit.test.ts).
 *
 * Frame: the KIT frame K = the kick's frame (kick/GEOMETRY_PROPOSAL.md §1):
 * origin the kick's batter-head centre, +x toward the audience, +y DOWN, +z
 * the drummer's right. Floor y = 290.4 (M01's floor). A height h above the
 * floor is y = 290.4 − h. The PLAN (top view) reads u = x, v = z.
 *
 * PROVENANCE: SIZES are sourced (maker catalogues); every POSITION, height
 * and tilt is a drawing default — a typical right-handed layout, drawn so the
 * picture makes sense (left-handed players mirror it: z ↦ −z). The kick and
 * its pedal are M01's own (owner-approved) geometry.
 */
import type { Vec3 } from '../../engine/model/types.ts';
import { KICK_GEOM } from '../m01Kick/geometry.ts';
import { FLOOR_16x16, SNARE_14x55, TOM_10x7, TOM_12x8, type PlacedDrum } from './drums/drumSpec.ts';

const IN = 25.4;
export const KIT_FLOOR_Y = 290.4;
/** Height above the floor → y. */
export const yAt = (h: number): number => KIT_FLOOR_Y - h;

export type KitDrumId = 'snare' | 'tom1' | 'tom2' | 'floor';
export type KitCymbalId = 'hihat' | 'crash1' | 'crash2' | 'ride';
export type KitCymbal = { id: KitCymbalId; label: string; d: number; c: Vec3; tiltDeg: number; pair?: boolean };

/** The kit's drums, placed (batter-head centre in K; tilt toward the drummer). */
export const KIT_DRUMS: Readonly<Record<KitDrumId, PlacedDrum>> = {
  snare: { spec: SNARE_14x55, c: { x: -390, y: yAt(640), z: -330 }, tiltDeg: 0 },
  tom1: { spec: TOM_10x7, c: { x: 130, y: yAt(850), z: -280 }, tiltDeg: 15 },
  tom2: { spec: TOM_12x8, c: { x: 150, y: yAt(850), z: 40 }, tiltDeg: 15 },
  floor: { spec: FLOOR_16x16, c: { x: -360, y: yAt(620), z: 380 }, tiltDeg: 0 },
};

/** Cymbal sizes are sourced (a maker's 4-piece pack: 14 in hi-hats, 16 and
 *  18 in crashes, 20 in ride); heights inside a maker's stand ranges; the
 *  rest are drawing defaults (kit/GEOMETRY_PROPOSAL.md §2–§3). `c` is the
 *  cymbal's centre (the top cymbal of the hi-hat pair). */
export const KIT_CYMBALS: Readonly<Record<KitCymbalId, KitCymbal>> = {
  hihat: { id: 'hihat', label: 'hi-hat', d: 14 * IN, c: { x: -470, y: yAt(850), z: -650 }, tiltDeg: 0, pair: true },
  crash1: { id: 'crash1', label: '16 in crash', d: 16 * IN, c: { x: -80, y: yAt(1150), z: -560 }, tiltDeg: 15 },
  crash2: { id: 'crash2', label: '18 in crash', d: 18 * IN, c: { x: 250, y: yAt(1200), z: 360 }, tiltDeg: 15 },
  ride: { id: 'ride', label: '20 in ride', d: 20 * IN, c: { x: -80, y: yAt(1000), z: 640 }, tiltDeg: 10 },
};
/** Cymbal profile and bell (drawing defaults: §3 of the kit proposal). */
export const CYMBAL_PROFILE = { rise: 0.08, bell: 0.2, swing: 60 } as const;

export const KIT = {
  floorY: KIT_FLOOR_Y,
  /** The kick and its pedal: M01's own geometry (owner-approved). */
  kick: {
    c: { x: 0, y: 0, z: 0 },
    R: KICK_GEOM.R,
    depth: KICK_GEOM.L,
    hoop: { u0: KICK_GEOM.hoopX.batter[0], u1: KICK_GEOM.hoopX.reso[1], halfW: KICK_GEOM.hoopOut },
    pedal: { u0: KICK_GEOM.pedal.x0, u1: KICK_GEOM.pedal.x1, halfW: 45 },
  },
  drums: KIT_DRUMS,
  cymbals: KIT_CYMBALS,
  throne: { c: { u: -770, v: -110 }, r: 175, seatH: 500 },
  hihatPedal: { u0: -760, u1: -500, v: -590, halfW: 45 },
  /** Drawing defaults for the drummer (the overheads lesson's envelope). */
  drummer: { headTopH: 1300, rightShoulder: { x: -700, h: 1150, z: 90 } },
  /** The player's space: the throne, the legs and both pedals. */
  playerSpace: [
    { u: -1000, v: -420 },
    { u: -720, v: -640 },
    { u: -470, v: -560 },
    { u: -360, v: -60 },
    { u: -110, v: -60 },
    { u: -110, v: 70 },
    { u: -560, v: 230 },
    { u: -1000, v: 230 },
  ],
  audienceU: 1640,
  room: { u0: -1120, u1: 1720, v0: -820, v1: 930 },
} as const;

/** Compatibility name (the geometry proposals call the plan KIT_PLAN). */
export const KIT_PLAN = KIT;

/** The scene boxes (plan): the kit alone, and the kit on a stage / in a room. */
export const PLAN_BOX = {
  kit: { u0: -1050, u1: 780, v0: -880, v1: 920 },
  wide: { u0: -1150, u1: 1760, v0: -860, v1: 1150 },
} as const;

/** Every item the plan can name. A lesson's setting items map onto these
 *  (SettingItem.planIds). */
export type PlanId = 'kick' | 'pedal' | 'throne' | KitDrumId | KitCymbalId | 'audience' | 'room' | string;

/** Where an item's label sits on the plan (mm, u/v), clear of its drawing. */
export function planLabelAt(id: PlanId): { u: number; v: number; align: 'left' | 'center' | 'right' } | null {
  const K = KIT;
  const d = (k: KitDrumId) => KIT_DRUMS[k];
  switch (id) {
    case 'kick':
      return { u: K.kick.hoop.u1 * 0.5, v: K.kick.hoop.halfW + 70, align: 'center' };
    case 'pedal':
      return { u: K.kick.pedal.u0 + 40, v: K.kick.pedal.halfW + 70, align: 'center' };
    case 'throne':
      return { u: K.throne.c.u, v: K.throne.c.v + K.throne.r + 75, align: 'center' };
    case 'snare':
      return { u: d('snare').c.x + 30, v: d('snare').c.z + d('snare').spec.d.mm / 2 + 70, align: 'center' };
    case 'tom1':
      return { u: d('tom1').c.x + 190, v: d('tom1').c.z - 10, align: 'left' };
    case 'tom2':
      return { u: d('tom2').c.x + 205, v: d('tom2').c.z + 20, align: 'left' };
    case 'floor':
      return { u: d('floor').c.x, v: d('floor').c.z + d('floor').spec.d.mm / 2 + 75, align: 'center' };
    case 'hihat':
      return { u: K.cymbals.hihat.c.x, v: K.cymbals.hihat.c.z - K.cymbals.hihat.d / 2 - 40, align: 'center' };
    case 'crash1':
      return { u: K.cymbals.crash1.c.x + 40, v: K.cymbals.crash1.c.z - K.cymbals.crash1.d / 2 - 30, align: 'center' };
    case 'crash2':
      return { u: K.cymbals.crash2.c.x + 60, v: K.cymbals.crash2.c.z + K.cymbals.crash2.d / 2 + 50, align: 'center' };
    case 'ride':
      return { u: K.cymbals.ride.c.x + 120, v: K.cymbals.ride.c.z + K.cymbals.ride.d / 2 + 50, align: 'center' };
    case 'audience':
      return { u: K.audienceU + 40, v: 600, align: 'right' };
    case 'room':
      return { u: K.room.u0 + 40, v: K.room.v0 + 110, align: 'left' };
    default:
      return null;
  }
}

/** Point-in-polygon (even–odd), for the player's space. */
function inPoly(pts: readonly { u: number; v: number }[], u: number, v: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.v > v !== b.v > v && u < ((b.u - a.u) * (v - a.v)) / (b.v - a.v) + a.u) inside = !inside;
  }
  return inside;
}

export type PlanHitCtx = {
  wedges: { id: string; u: number; v: number }[];
  scene: 'kit' | 'stage' | 'studio';
};

/** The plan item under a point (mm); `tol` in mm. Order: the small things
 *  first, the drums before the cymbals above them. */
export function planHitTest(ctx: PlanHitCtx, u: number, v: number, tol: number): PlanId | null {
  const K = KIT;
  const near = (c: { x: number; z: number } | { u: number; v: number }, r: number) => {
    const cu = 'u' in c ? c.u : c.x;
    const cv = 'v' in c ? c.v : c.z;
    return Math.hypot(u - cu, v - cv) <= r + tol;
  };
  if (ctx.scene === 'stage') for (const w of ctx.wedges) if (Math.abs(u - w.u) <= 300 + tol && Math.abs(v - w.v) <= 300 + tol) return w.id;
  if (ctx.scene === 'stage' && u >= K.audienceU - 260 - tol) return 'audience';
  const pd = K.kick.pedal;
  if (u >= pd.u0 - tol && u <= pd.u1 + tol && Math.abs(v) <= pd.halfW + tol) return 'pedal';
  if (near(K.cymbals.hihat.c, K.cymbals.hihat.d / 2)) return 'hihat';
  const hp = K.hihatPedal;
  if (u >= hp.u0 - tol && u <= hp.u1 && Math.abs(v - hp.v) <= hp.halfW + tol) return 'hihat';
  for (const id of ['tom1', 'tom2', 'snare', 'floor'] as const) if (near(KIT_DRUMS[id].c, KIT_DRUMS[id].spec.d.mm / 2)) return id;
  if (near(K.throne.c, K.throne.r)) return 'throne';
  if (u >= K.kick.hoop.u0 - tol && u <= K.kick.hoop.u1 + tol && Math.abs(v) <= K.kick.hoop.halfW + tol) return 'kick';
  for (const id of ['crash1', 'crash2', 'ride'] as const) if (near(K.cymbals[id].c, K.cymbals[id].d / 2)) return id;
  if (inPoly(K.playerSpace, u, v)) return 'throne';
  if (ctx.scene === 'studio' && (u <= K.room.u0 + 60 + tol || u >= K.room.u1 - 60 - tol || v <= K.room.v0 + 60 + tol || v >= K.room.v1 - 60 - tol)) return 'room';
  return null;
}

/** A lesson frame's origin in K (a lesson drawn about its own drum). */
export function toLesson(origin: Vec3, p: Vec3): Vec3 {
  return { x: p.x - origin.x, y: p.y - origin.y, z: p.z - origin.z };
}
