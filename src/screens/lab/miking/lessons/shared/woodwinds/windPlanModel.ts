/**
 * THE WOODWIND SECTION PLAN — where Lab 3's woodwinds sit (LESSON_JOURNEY
 * §8: "a plan at the source's real scale, neighbours as illustrated real
 * objects, the player's space as a keep-out, STAGE / STUDIO variants"). One
 * plan for every woodwind lesson; each lesson lights its own player. Pure
 * (no Skia): WindPlan.tsx draws from these numbers and the plans' overlap
 * test (test/mikingPlanCollisions_20261015) reads the same ones.
 *
 * PLAN frame (mm), seen from above, the lessons' own TOP view: u = x (the
 * players' left, screen right), v = z (toward the conductor and the
 * audience, DOWN the screen). A player at slot (u, v) is the lesson-frame
 * drawing translated there — the same art, the same scale.
 *
 * The layout is the usual one seen from the conductor: flutes front left,
 * oboes front right, clarinets behind the flutes, bassoons behind the oboes;
 * the piccolo at the end of the flutes, the bass clarinet at the end of the
 * clarinets. Every POSITION is a DRAWING DEFAULT (a typical layout).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; a personal headphone mixer per performer in every studio plan):
 * the chairs stand far enough apart for a headphone mixer on its stand at
 * each player's left (the side away from a flute's reach); the back row sits
 * far enough behind the front row for its music stands and its own floor
 * wedges (the lessons' wedge 1.45 m in front of the player) to stand between
 * the rows; the PA stacks stand on the deck's downstage corners and one row
 * of audience chairs faces the stage beyond the deck's edge. STUDIO: no
 * wedges; each row's mixers feed the CONTROL ROOM along their own lanes
 * behind the row, and the conductor's from beside the podium.
 */
import type { VariantId, Vec3, Wedge } from '../../../engine/model/types.ts';
import { bassClarinetLayout, bassoonLayout, fluteLayout, frameAt, straightReedLayout, type Layout } from './windPosture.ts';
import { BASSOON, CLARINET, OBOE, PICCOLO, bassClarinetSpec, fluteSpec, radiusAt } from './windSpec.ts';
import { aboveRotation } from '../../../../../../features/lab/headIconGeometry.ts';
import { chairFoots, foot, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { CUE_MIXER, cueFootprints, type CueRig, type CueStation } from '../monitoring/cueMix.ts';

export type PlanPt = { u: number; v: number };
export type SlotId = 'picc' | 'fl2' | 'fl1' | 'ob1' | 'ob2' | 'bcl' | 'cl2' | 'cl1' | 'bsn1' | 'bsn2';
export type Kind = 'flute' | 'piccolo' | 'clarinet' | 'oboe' | 'bassClarinet' | 'bassoon';
export type WindScene = 'kit' | 'stage' | 'studio';

const FRONT = 0;
const BACK = -2200;
export const SLOTS: Readonly<Record<SlotId, { at: PlanPt; kind: Kind; label: string }>> = {
  picc: { at: { u: -3150, v: FRONT }, kind: 'piccolo', label: 'PICCOLO' },
  fl2: { at: { u: -1850, v: FRONT }, kind: 'flute', label: 'FLUTE 2' },
  fl1: { at: { u: -550, v: FRONT }, kind: 'flute', label: 'FLUTE 1' },
  ob1: { at: { u: 500, v: FRONT }, kind: 'oboe', label: 'OBOE 1' },
  ob2: { at: { u: 1550, v: FRONT }, kind: 'oboe', label: 'OBOE 2' },
  bcl: { at: { u: -2550, v: BACK }, kind: 'bassClarinet', label: 'BASS CLARINET' },
  cl2: { at: { u: -1500, v: BACK }, kind: 'clarinet', label: 'CLARINET 2' },
  cl1: { at: { u: -450, v: BACK }, kind: 'clarinet', label: 'CLARINET 1' },
  bsn1: { at: { u: 700, v: BACK }, kind: 'bassoon', label: 'BASSOON 1' },
  bsn2: { at: { u: 2000, v: BACK }, kind: 'bassoon', label: 'BASSOON 2' },
};
export const FRONT_ROW: readonly SlotId[] = ['picc', 'fl2', 'fl1', 'ob1', 'ob2'];
export const BACK_ROW: readonly SlotId[] = ['bcl', 'cl2', 'cl1', 'bsn1', 'bsn2'];

/** A shared music stand in front of each pair (between them); the bass
 *  clarinet's a little farther out, past its bell. */
export const STANDS: readonly { id: string; at: PlanPt; pair: readonly SlotId[] }[] = [
  { id: 'stand.fl', at: { u: -1200, v: FRONT + 760 }, pair: ['fl1', 'fl2'] },
  { id: 'stand.picc', at: { u: -3150, v: FRONT + 760 }, pair: ['picc'] },
  { id: 'stand.ob', at: { u: 1025, v: FRONT + 760 }, pair: ['ob1', 'ob2'] },
  { id: 'stand.cl', at: { u: -975, v: BACK + 760 }, pair: ['cl1', 'cl2'] },
  { id: 'stand.bcl', at: { u: -2550, v: BACK + 900 }, pair: ['bcl'] },
  { id: 'stand.bsn', at: { u: 1350, v: BACK + 760 }, pair: ['bsn1', 'bsn2'] },
];
/** A music stand from above (WindPlan): the desk 500 wide, tilted toward the
 *  players, on a tripod with feet 230 from the post. */
export const STAND_DESK = { half: 250, back: -30, front: 14 } as const;
export const STAND_LEG = 230;
export const STAND_LEG_ANGLES = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 - (2 * Math.PI) / 3] as const;

export const STAGE = {
  /** The conductor on the podium (900 × 760), facing the section (−v). */
  conductor: { u: 0, v: 2500, r: 380 },
  podium: { u0: -450, u1: 450, v0: 2170, v1: 2930 },
  /** STUDIO: the main pair on its tall stand, between the section and the
   *  podium, the mics above the conductor's line. */
  main: { u: 0, v: 1580 },
  /** The PA stacks (a sub with a two-way top, 560 × 700, facing the
   *  audience) on the deck's downstage corners. */
  pa: [
    { u: -3450, v: 2950 },
    { u: 2700, v: 2950 },
  ],
  /** The deck's downstage edge; one row of audience chairs beyond it. */
  deckEdge: 3350,
  audienceV: 3350,
  chairRowV: 3800,
  hall: { u0: -3950, u1: 3200, v0: -2850, v1: 4150 },
} as const;
/** The studio room's inner wall faces (WindPlan draws the wall 70 thick
 *  outside them). */
export const STUDIO_ROOM = { u0: -3900, u1: 3150, v0: -3150, v1: 3250 } as const;
export const PLAN_BOX = {
  section: { u0: -3750, u1: 3050, v0: -2750, v1: 1150 },
  wide: { u0: -4000, u1: 3250, v0: -3250, v1: 4200 },
} as const;
/** The main pair's stand from above: the tripod's feet 380 from the post
 *  (30 behind the bar), the bar 320 across with a mic at each end. */
export const MAIN_LEG = 380;
export const PA_BOX = { hu: 280, hv: 350 } as const;

/** One row of audience chairs facing the stage (−v), a centre aisle kept. */
export function windChairs(): { x: number; y: number; rotation: number }[] {
  const out: { x: number; y: number; rotation: number }[] = [];
  for (let u = -3480; u <= 2800; u += 520) if (Math.abs(u) > 400) out.push({ x: u, y: STAGE.chairRowV, rotation: aboveRotation(0, -1) });
  return out;
}

/** A lesson-frame point (x, z) as a plan point for the slot `own`. */
export function toPlan(own: SlotId, p: { x: number; z: number }): PlanPt {
  const o = SLOTS[own].at;
  return { u: o.u + p.x, v: o.v + p.z };
}

/**
 * A seated (or standing) woodwind player from above, in the lesson frame
 * (the lips at the origin): the head, shoulders, arms and hands, the legs
 * and feet, the chair, and the instrument along its centre line at its
 * drawn radius (a bass clarinet's peg too) — the box WindScene's top view
 * fills.
 */
export function windPlayerRect(L: Layout): PlanRect {
  const pts: [number, number, number][] = [];
  const at = (p: { x: number; z: number }, pad: number) => pts.push([p.x, p.z, pad]);
  const B = L.body;
  at(B.head.c, B.head.r);
  at(B.neck, 60);
  for (const p of [B.shoulderL, B.shoulderR]) at(p, 70);
  for (const h of [L.handL, L.handR]) {
    at(h.elbow, 45);
    at(h.wrist, 40);
    at({ x: h.wrist.x + h.dir.x * 120, z: h.wrist.z + h.dir.z * 120 }, 30);
  }
  for (const p of [B.hipL, B.hipR]) at(p, 80);
  for (const p of [B.kneeL, B.kneeR]) at(p, 70);
  for (const p of [B.ankleL, B.ankleR, B.toeL, B.toeR]) at(p, 50);
  if (L.chair) {
    for (const p of [L.chair.seat.min, L.chair.seat.max, L.chair.back.min, L.chair.back.max]) at(p, 0);
    for (const [a, b] of L.chair.legs) {
      at(a, 8);
      at(b, 8);
    }
  }
  for (let s = 0; s <= L.spec.end; s += 10) at(frameAt(L, s).p, radiusAt(L.spec, s) + 8);
  if (L.peg) {
    at(L.peg.a, 10);
    at(L.peg.b, 10);
  }
  return { u0: Math.min(...pts.map((p) => p[0] - p[2])), u1: Math.max(...pts.map((p) => p[0] + p[2])), v0: Math.min(...pts.map((p) => p[1] - p[2])), v1: Math.max(...pts.map((p) => p[1] + p[2])) };
}

/** The stand's footprint: its desk and its tripod's feet. */
export function standRect(at: PlanPt): PlanRect {
  const legs = STAND_LEG_ANGLES.map((a) => ({ u: at.u + Math.cos(a) * STAND_LEG, v: at.v + Math.sin(a) * STAND_LEG }));
  return { u0: Math.min(at.u - STAND_DESK.half, ...legs.map((p) => p.u)) - 6, u1: Math.max(at.u + STAND_DESK.half, ...legs.map((p) => p.u)) + 6, v0: Math.min(at.v + STAND_DESK.back, ...legs.map((p) => p.v)) - 6, v1: Math.max(at.v + STAND_DESK.front, ...legs.map((p) => p.v)) + 6 };
}
/** The main pair's footprint: the tripod's feet, the bar and its mics. */
export function mainRect(): PlanRect {
  const m = STAGE.main;
  const legs = STAND_LEG_ANGLES.map((a) => ({ u: m.u + Math.cos(a) * MAIN_LEG, v: m.v + 30 + Math.sin(a) * MAIN_LEG }));
  return { u0: Math.min(m.u - 171, ...legs.map((p) => p.u)) - 11, u1: Math.max(m.u + 171, ...legs.map((p) => p.u)) + 11, v0: m.v - 120, v1: Math.max(...legs.map((p) => p.v)) + 11 };
}

/** The player's layout in a slot: the lesson's own (its variant) in its
 *  own seat, the family's seated default in every other. */
export type LayoutOf = (slot: SlotId) => Layout;

/** A lesson's plan: its own seat, its own drawing per variant (its seated
 *  default first), and the words for its own player. */
export type WindPlanConfig = {
  own: SlotId;
  layoutOf: (variant: VariantId) => Layout;
  ownLabel: string;
};

/* the neighbours' layouts (the family's seated defaults), built on first use */
const KIND_LAYOUTS: Partial<Record<Kind, Layout>> = {};
export function layoutOfKind(k: Kind): Layout {
  return (KIND_LAYOUTS[k] ??=
    k === 'flute'
      ? fluteLayout(fluteSpec('metal'), 'seated')
      : k === 'piccolo'
        ? fluteLayout(PICCOLO, 'seated')
        : k === 'clarinet'
          ? straightReedLayout(CLARINET, 'seated', 35)
          : k === 'oboe'
            ? straightReedLayout(OBOE, 'seated', 40)
            : k === 'bassClarinet'
              ? bassClarinetLayout(bassClarinetSpec('eflat'))
              : bassoonLayout('seated', BASSOON));
}
/** Every seat's layout for a lesson's variant. */
export function windLayouts(cfg: WindPlanConfig, variant: VariantId): LayoutOf {
  const ownL = cfg.layoutOf(variant);
  return (slot) => (slot === cfg.own ? ownL : layoutOfKind(SLOTS[slot].kind));
}

/**
 * STUDIO — the headphone mix (monitoring/cueMix.ts). Each player's mixer
 * stands at their left, just clear of their reach, level with their
 * shoulders; the conductor's beside the podium. Each row's feeds run back
 * to their own lanes behind the row and along them to the CONTROL ROOM on
 * the right wall (the front row's lanes between the rows, the back row's
 * behind its chairs); the conductor's straight across.
 */
const MIXER_R = Math.max(CUE_MIXER.baseR, Math.hypot(CUE_MIXER.w, CUE_MIXER.d) / 2);
export const MIXER_SIDE = 50 + MIXER_R;
export function windCue(layoutOf: LayoutOf): CueRig[] {
  const st = (id: SlotId): CueStation => {
    const s = SLOTS[id].at;
    const L = layoutOf(id);
    const r = windPlayerRect(L);
    return { id, at: { u: s.u + r.u1 + MIXER_SIDE, v: s.v - 150 }, head: { u: s.u + L.body.head.c.x, v: s.v + L.body.head.c.z }, facing: Math.PI / 2 };
  };
  const row = (ids: readonly SlotId[], id: string, back: number, hubLabel?: null): CueRig => ({
    id,
    room: STUDIO_ROOM,
    wall: 'u1',
    layout: 'row',
    rowSide: -1,
    hubAt: 0,
    ...(hubLabel === null ? { hubLabel: null } : {}),
    stations: ids.map((i) => {
      const s = st(i);
      return { ...s, via: [{ u: s.at.u, v: back }] };
    }),
  });
  const c = STAGE.conductor;
  return [
    row(FRONT_ROW, 'front', FRONT - 250),
    row(BACK_ROW, 'back', BACK - 200, null),
    {
      id: 'podium',
      room: STUDIO_ROOM,
      wall: 'u1',
      hubAt: 2450,
      hubLabel: null,
      stations: [{ id: 'conductor', at: { u: STAGE.podium.u1 + 50 + MIXER_R, v: 2450 }, head: { u: c.u, v: c.v + 40 }, facing: -Math.PI / 2 }],
    },
  ];
}

/** Every object's footprint on the plan (mm). `wedges`: the lesson's own,
 *  in its lesson frame (the own slot is their origin). */
export function windFoots(own: SlotId, layoutOf: LayoutOf, scene: WindScene, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [];
  for (const id of Object.keys(SLOTS) as SlotId[]) {
    const s = SLOTS[id].at;
    const r = windPlayerRect(layoutOf(id));
    out.push(foot(id, 'player', { u0: s.u + r.u0, u1: s.u + r.u1, v0: s.v + r.v0, v1: s.v + r.v1 }, { group: id }));
  }
  for (const s of STANDS) out.push(foot(s.id, 'stand', standRect(s.at)));
  if (scene === 'kit') return out;
  out.push(foot('podium', 'podium', STAGE.podium, { group: 'conductor' }));
  if (scene === 'stage') {
    const o = SLOTS[own].at;
    for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w, { x: o.u, y: 0, z: o.v } as Vec3));
    STAGE.pa.forEach((p, i) => out.push(foot(`pa${i}`, 'pa', { u0: p.u - PA_BOX.hu, u1: p.u + PA_BOX.hu, v0: p.v - PA_BOX.hv, v1: p.v + PA_BOX.hv })));
    out.push(...chairFoots(windChairs()));
  } else {
    out.push(foot('main', 'mainPair', mainRect()));
    for (const rig of windCue(layoutOf)) out.push(...cueFootprints(rig));
  }
  return out;
}

/** The plan object under (u, v); `tol` in mm. The stage's things first. */
export function planHit(u: number, v: number, tol: number, opts: { scene: WindScene; wedges: readonly { id: string; at: PlanPt }[] }): string | null {
  const near = (c: PlanPt, r: number) => Math.hypot(u - c.u, v - c.v) <= r + tol;
  if (opts.scene === 'stage') {
    for (const w of opts.wedges) if (near(w.at, 360)) return w.id;
    if (STAGE.pa.some((p) => near(p, 420))) return 'pa';
    if (v >= STAGE.audienceV - tol) return 'audience';
  }
  if (opts.scene !== 'kit' && near(STAGE.conductor, STAGE.conductor.r)) return 'conductor';
  if (opts.scene === 'studio' && near(STAGE.main, 360)) return 'main';
  for (const s of STANDS) if (near(s.at, 230)) return s.id;
  let best: { id: string; d: number } | null = null;
  for (const [id, s] of Object.entries(SLOTS)) {
    // A player's footprint: the chair and body round (0, −120), the
    // instrument out in front or to the side.
    const d = Math.hypot(u - (s.at.u + (s.kind === 'flute' || s.kind === 'piccolo' ? -180 : 0)), v - (s.at.v - 40));
    if (d <= 520 + tol && (!best || d < best.d)) best = { id, d };
  }
  if (best) return best.id;
  const R = STUDIO_ROOM;
  if (opts.scene === 'studio' && (u <= R.u0 + 300 + tol || u >= R.u1 - 300 - tol || v <= R.v0 + 300 + tol || v >= R.v1 - 300 - tol)) return 'room';
  return null;
}
