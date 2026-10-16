/**
 * THE KIT PLAN'S SURROUNDINGS — pure layout (no Skia) for KitPlan.tsx: the
 * plan boxes, the stage lip and the audience marks, the studio room, the rug,
 * the footprint of every object the plan draws, the studio headphone mix
 * and the plan's hit test. KitPlan.tsx draws from these same numbers, and
 * the overlap test (test/mikingPlanCollisions_20261015, planCases/kitPlan.ts)
 * reads them. The kit itself is kitPlanModel.ts (unchanged).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; a personal headphone mixer per performer in every studio plan):
 *   • the stage lip and the audience marks moved downstage of the downstage
 *     wedge (it straddled the lip and an arrow);
 *   • the drummer's fill stands beside the kit, not over the floor tom and
 *     the ride (kitStage.ts KIT_FILL);
 *   • the studio room grew round the whole kit — the hi-hat, the crash's
 *     boom legs and the ride's feet went through the walls and the panels;
 *   • the rug covers every stand's feet;
 *   • STUDIO: no wedges; the drummer's headphone mixer on its stand at the
 *     drummer's right, behind the floor tom, the phones resting on the
 *     throne (no drummer is drawn: the throne implies one), fed from the
 *     CONTROL ROOM box on the wall behind the drummer.
 * Positions are a typical layout, ILLUSTRATIVE.
 */
import type { Vec3, Wedge } from '../../engine/model/types.ts';
import { KIT, KIT_CYMBALS, KIT_DRUMS, PLAN_BOX, planHitTest } from './kitPlanModel.ts';
import { foot, kitPieceFoots, rectOfCircle, rectOfPts, unionRect, wedgeFoot, type PlanFoot, type PlanPt, type PlanRect } from './planFoot.ts';
import { cueFootprints, type CueRig } from './monitoring/cueMix.ts';
import { CHINA_INVERTED, CHINA_UPRIGHT, SPLASH_ARM, SPLASH_PIGGY } from './cymbals/cymbalFx.ts';

export type KitPlanWhere = 'kit' | 'stage' | 'studio';

/** The stage: the deck's downstage edge (a dashed line) and the audience
 *  marks beyond it (three arrows, `audienceU` = their tips − 40). */
export const KITPLAN_STAGE = { lipU: 1670, audienceU: 1900 } as const;
/** The audience arrows' extent (a marking on the floor plan, not an object). */
// the arrows at v = 0, ±320 (drawn turned, their name sits clear beside them)
export const AUDIENCE_MARK: PlanRect = { u0: KITPLAN_STAGE.audienceU - 170, u1: KITPLAN_STAGE.audienceU + 40, v0: -360, v1: 360 };

/** The studio room's inner wall faces (drawn 40 mm thick, absorber panels
 *  46 mm deep on the long walls): a drum room round the whole kit. */
export const KITPLAN_ROOM: PlanRect = { u0: -1400, u1: 1600, v0: -1080, v1: 1130 };

/** The plan boxes: the kit alone (room for its names round it), and the
 *  kit on a stage / in its room (both drawn in the same box). */
export const KITPLAN_BOX = {
  kit: { u0: Math.min(PLAN_BOX.kit.u0, -1250), u1: Math.max(PLAN_BOX.kit.u1, 950), v0: Math.min(PLAN_BOX.kit.v0, -1060), v1: Math.max(PLAN_BOX.kit.v1, 1130) },
  wide: { u0: -1460, u1: 1990, v0: -1130, v1: 1180 },
} as const;

/** The drum rug under the kit: every stand's feet on it. */
export const KITPLAN_RUG: PlanRect = { u0: -1110, u1: 720, v0: -970, v1: 1050 };

/** The hi-hat stand's tripod (KitPlan HiHatArt: legs to r + 110 at 90°,
 *  210°, 330°) and the floor tom's legs (drumSpec: 3 legs, 120 past the
 *  shell, from 30°), their feet. */
export function kitStandFoots(at: PlanPt = { u: 0, v: 0 }, group = 'kit'): PlanFoot[] {
  const h = KIT_CYMBALS.hihat;
  const hr = h.d / 2 + 110;
  const hat = [90, 210, 330].map((a) => ({ u: at.u + h.c.x + Math.cos((a * Math.PI) / 180) * hr, v: at.v + h.c.z + Math.sin((a * Math.PI) / 180) * hr }));
  const fl = KIT_DRUMS.floor;
  const legs = fl.spec.legs!;
  const fr = fl.spec.d.mm / 2 + legs.spread.mm;
  const ft = Array.from({ length: legs.n.mm }, (_, k) => {
    const a = ((legs.phaseDeg.mm + (k * 360) / legs.n.mm) * Math.PI) / 180;
    return { u: at.u + fl.c.x + Math.cos(a) * fr, v: at.v + fl.c.z + Math.sin(a) * fr };
  });
  const grow = (r: PlanRect, d: number): PlanRect => ({ u0: r.u0 - d, u1: r.u1 + d, v0: r.v0 - d, v1: r.v1 + d });
  return [foot(`${group}:hihatLegs`, 'kitPiece', grow(rectOfPts(hat), 10), { group }), foot(`${group}:floorLegs`, 'kitPiece', grow(rectOfPts(ft), 10), { group })];
}

/** Every piece of the kit (kitPieceFoots + the stands' legs) and the
 *  drummer's keep-clear space (the hatch). */
export function kitFoots(at: PlanPt = { u: 0, v: 0 }, group = 'kit'): PlanFoot[] {
  return [...kitPieceFoots(at, group), ...kitStandFoots(at, group), foot(`${group}:space`, 'keepClear', rectOfPts(KIT.playerSpace.map((q) => ({ u: q.u + at.u, v: q.v + at.v }))), { group, zone: true })];
}

/** A cymbal the shared plan does not draw (a cymbal lesson's own, drawn
 *  over the plan in its place): its footprint, part of the kit. */
export type FxOwn = 'splash' | 'china';
export function fxFoot(own: FxOwn, variant: string): PlanFoot {
  const p = own === 'splash' ? (variant === 'piggy' ? SPLASH_PIGGY : SPLASH_ARM) : variant === 'inverted' ? CHINA_INVERTED : CHINA_UPRIGHT;
  return foot('kit:fx', 'kitPiece', rectOfCircle({ u: p.c.x, v: p.c.z }, p.spec.d.mm / 2), { group: 'kit' });
}

/** The drummer's head for the headphones: no drummer is drawn on the kit
 *  plan, so the phones rest on the throne. */
export const KIT_THRONE_HEAD: PlanPt = { u: KIT.throne.c.u, v: KIT.throne.c.v };
/** The headphone mixer on its stand: at the drummer's right, behind the
 *  floor tom's legs, clear of the drummer's space (≈ 0.6 m from the seat). */
export const KIT_CUE_AT: PlanPt = { u: -900, v: 470 };

/** The studio headphone mix for a drummer at this kit (`room`: the studio's
 *  inner walls; the box on the wall behind the drummer, level with the
 *  mixer, so its feed runs straight back). */
export function kitCue(room: PlanRect = KITPLAN_ROOM, head: PlanPt = KIT_THRONE_HEAD): CueRig {
  // no drummer drawn on the kit plan: the phones rest on the throne, face-on
  const alone = head === KIT_THRONE_HEAD;
  return { room, wall: 'u0', hubAt: KIT_CUE_AT.v, stations: [{ id: 'drummer', at: KIT_CUE_AT, head, facing: 0, ...(alone ? { alone } : {}) }] };
}

/** The lesson's drawn stage wedges on the plan (its frame moved by `offset`). */
export function planWedges(wedges: readonly Wedge[], offset: Vec3 = { x: 0, y: 0, z: 0 }): Wedge[] {
  return wedges.filter((wd) => wd.glyph !== 'none').map((wd) => ({ ...wd, p: { x: wd.p.x + offset.x, y: wd.p.y + offset.y, z: wd.p.z + offset.z } }));
}

/** Every object's footprint on the kit plan (mm). */
export function kitPlanFoots(scene: KitPlanWhere, wedges: readonly Wedge[], offset: Vec3 = { x: 0, y: 0, z: 0 }, extra: readonly PlanFoot[] = []): PlanFoot[] {
  const out: PlanFoot[] = [...kitFoots(), ...extra, foot('rug', 'rug', KITPLAN_RUG, { zone: true })];
  if (scene === 'stage') {
    for (const w of planWedges(wedges, offset)) out.push(wedgeFoot(w));
    out.push(foot('audience', 'audienceMark', AUDIENCE_MARK));
  }
  if (scene === 'studio') out.push(...cueFootprints(kitCue()));
  return out;
}

/** The footprint of a plan item (for its name's places), or null. */
export function planItemRect(foots: readonly PlanFoot[], id: string): PlanRect | null {
  if (id === 'pedal') return { u0: KIT.kick.pedal.u0, u1: KIT.kick.pedal.u1, v0: -KIT.kick.pedal.halfW, v1: KIT.kick.pedal.halfW };
  if (id === 'kick') return { u0: KIT.kick.hoop.u0, u1: KIT.kick.hoop.u1, v0: -KIT.kick.hoop.halfW, v1: KIT.kick.hoop.halfW };
  if (id === 'hihat') {
    const fs = foots.filter((f) => f.id === 'kit:hihat');
    return fs.length ? unionRect(fs) : null;
  }
  const f = foots.find((x) => x.id === id || x.id === `kit:${id}` || (id === 'cymbal.own' && x.id === 'kit:fx'));
  return f ? { u0: f.u0, u1: f.u1, v0: f.v0, v1: f.v1 } : null;
}

/** The plan item under a point (mm; `tol` mm): the stage's wedges and its
 *  audience side, the kit's pieces (kitPlanModel.planHitTest), the studio's
 *  walls. */
export function kitPlanHit(scene: KitPlanWhere, wedges: readonly { id: string; u: number; v: number }[], u: number, v: number, tol: number): string | null {
  if (scene === 'stage') {
    for (const w of wedges) if (Math.abs(u - w.u) <= 300 + tol && Math.abs(v - w.v) <= 300 + tol) return w.id;
    if (u >= KITPLAN_STAGE.lipU - tol) return 'audience';
  }
  const k = planHitTest({ wedges: [], scene: 'kit' }, u, v, tol);
  if (k) return k;
  const r = KITPLAN_ROOM;
  if (scene === 'studio' && (u <= r.u0 + 60 + tol || u >= r.u1 - 60 - tol || v <= r.v0 + 60 + tol || v >= r.v1 - 60 - tol)) return 'room';
  return null;
}
