/**
 * The lute family's STAGE AND STUDIO plan layout (LutePlan.tsx draws it) —
 * pure, so the plans' overlap test (test/mikingPlanCollisions_20261015) reads
 * the same numbers the drawing uses.
 *
 * Frame: the engine frame from above — u = x (toward the neck), v = z (+v
 * toward the audience, down the glass). Positions are a typical layout,
 * ILLUSTRATIVE (lutesContent.ts sets them).
 *
 * The player's space (the hatch) takes in the player — legs and hands — and
 * the whole instrument (the oud's pegbox, the sitar's and veena's neck ends);
 * every accompanist sits outside it, on the rug. In a STUDIO (owner
 * 2026-10-15) no wedges or side-fill: a personal headphone mixer at EACH
 * performer — the player and every accompanist drawn — fed back from the
 * CONTROL ROOM at the room's edge (monitoring/cueMix.ts).
 */
import type { ViewBox, Wedge } from '../../../engine/model/types.ts';
import { shapeBox } from '../../../engine/geometry/contentFrame.ts';
import type { LuteScene } from './luteModel.ts';
import { oudPlan, sitarPlan, veenaPlan, LUTE_STAGE, type LutePlanObject } from './lutesContent.ts';
import { foot, rectAround, rectOfCircle, rectOfPts, unionRect, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueStation } from '../monitoring/cueMix.ts';

export type LutePlanScene = 'stage' | 'studio';

/** The lessons' plans: which layout, and the close-up box. */
export const LUTE_PLANS = {
  C13: { kind: 'oud', near: { u0: -620, u1: 1400, v0: -720, v1: 720 } },
  C14: { kind: 'sitar', near: { u0: -860, u1: 1500, v0: -1320, v1: 640 } },
  C15: { kind: 'veena', near: { u0: -560, u1: 1880, v0: -1250, v1: 640 } },
} as const satisfies Record<string, { kind: LuteScene['kind']; near: ViewBox }>;

export function lutePlanObjects(sc: LuteScene): LutePlanObject[] {
  return sc.kind === 'oud' ? oudPlan(sc) : sc.kind === 'sitar' ? sitarPlan(sc) : veenaPlan(sc);
}

/** The wide (stage / studio) box and the studio's walls (drawn 60 thick,
 *  centred 200 in from the box). */
export const LUTE_WIDE: ViewBox = { u0: -2400, u1: 2600, v0: -2500, v1: 2700 };
export const LUTE_WALL = { inset: 200, stroke: 60 } as const;
export const LUTE_ROOM: PlanRect = { u0: LUTE_WIDE.u0 + LUTE_WALL.inset + LUTE_WALL.stroke / 2, u1: LUTE_WIDE.u1 - LUTE_WALL.inset - LUTE_WALL.stroke / 2, v0: LUTE_WIDE.v0 + LUTE_WALL.inset + LUTE_WALL.stroke / 2, v1: LUTE_WIDE.v1 - LUTE_WALL.inset - LUTE_WALL.stroke / 2 };

/** True sizes of the drawn objects (mm, from above). */
export const LUTE_SIZES = {
  chair: { half: 220, front: 200, back: 250, backDepth: 60 },
  vocalBase: 125,
  pa: { top: 300, bottom: 240, hv: LUTE_STAGE.paHalf },
  sideFill: { along: 340, across: 420 },
} as const;

/**
 * The accompanists as drawn (offsets from the object's `at`): the seated
 * player's head (and the shoulders' half-width `w`), and the plan box of the
 * player with their instrument — a seated percussionist's knees and drums, a
 * tanpura's gourd.
 */
export const ACCOMPANIST = {
  riq: { head: { dx: 0, dz: -60 }, w: 210, box: { u0: -215, u1: 215, v0: -170, v1: 315 } },
  tabla: { head: { dx: 0, dz: -170 }, w: 220, box: { u0: -240, u1: 280, v0: -280, v1: 205 } },
  tanpura: { head: { dx: 40, dz: -20 }, w: 210, box: { u0: -340, u1: 255, v0: -130, v1: 235 } },
  mridangam: { head: { dx: 0, dz: -200 }, w: 220, box: { u0: -350, u1: 350, v0: -305, v1: 145 } },
} as const;
export type AccKind = keyof typeof ACCOMPANIST;
const isAcc = (k: string): k is AccKind => k in ACCOMPANIST;

/** The instrument's plan box (its parts' solids, from above). */
export function luteInstrumentRect(parts: readonly { solid?: unknown }[]): PlanRect {
  const rs: PlanRect[] = [];
  for (const p of parts) {
    if (!p.solid) continue;
    const b = shapeBox(p.solid as Parameters<typeof shapeBox>[0]);
    if (b) rs.push({ u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z });
  }
  return unionRect(rs);
}

/** The player figure's plan box: torso, legs, head, both hands and arms. */
export function lutePlayerRect(sc: LuteScene): PlanRect {
  const f = sc.fit;
  const bx = (b: { min: { x: number; z: number }; max: { x: number; z: number } }): PlanRect => ({ u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z });
  const joints = rectOfPts([f.shoulderR, f.shoulderL, f.elbowR, f.elbowL, f.kneeR, f.kneeL, f.pluckHand, f.fretHand].map((p) => ({ u: p.x, v: p.z })));
  return unionRect([bx(f.torso), bx(f.legs), bx(f.pluckBox), bx(f.fretBox), rectOfCircle({ u: f.head.c.x, v: f.head.c.z }, f.head.r), { u0: joints.u0 - 50, u1: joints.u1 + 50, v0: joints.v0 - 50, v1: joints.v1 + 50 }]);
}

/** The player's space (the hatch): the player, the chair and the whole instrument. */
export function luteSpace(sc: LuteScene, parts: readonly { solid?: unknown }[]): PlanRect {
  const p = lutePlayerRect(sc);
  const ins = luteInstrumentRect(parts);
  const chair = lutePlanObjects(sc).find((o) => o.kind === 'chair');
  const v0 = Math.min(p.v0, ins.v0, chair ? chair.at.z - LUTE_SIZES.chair.back : Infinity) - 60;
  return { u0: Math.min(p.u0, ins.u0) - 60, u1: Math.max(p.u1, ins.u1) + 80, v0, v1: Math.max(p.v1, ins.v1, 200) + 40 };
}

/** A rug's plan rect. */
export const rugRect = (o: LutePlanObject): PlanRect => {
  const h = o.half ?? { x: o.r ?? 1100, z: (o.r ?? 1100) * 0.62 };
  return { u0: o.at.x - h.x, u1: o.at.x + h.x, v0: o.at.z - h.z, v1: o.at.z + h.z };
};

/** Shown in this scene: the wide plans also show the close-up's objects. */
export function luteShownIn(o: { scene: string }, scene: 'kit' | 'stage' | 'studio'): boolean {
  return o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit');
}

/** An accompanist's head (where the headphones sit). */
export const accHead = (o: LutePlanObject) => {
  const a = ACCOMPANIST[o.kind as AccKind];
  return { u: o.at.x + a.head.dx, v: o.at.z + a.head.dz };
};

/**
 * The studio headphone mix: one mixer per performer — the player's on the
 * plucking-hand side (away from the neck), each accompanist's on their far
 * side — outside every keep-clear space, fed back to the CONTROL ROOM. The
 * oud and the veena: the box on the upstage wall, every feed straight up to
 * its own lane. The sitar: on the left wall (the tanpura sits behind the
 * player); the tabla's feed runs up past everything before it turns.
 */
export function luteCue(sc: LuteScene, parts: readonly { solid?: unknown }[]): CueRig {
  const space = luteSpace(sc, parts);
  const head = { u: sc.fit.head.c.x, v: sc.fit.head.c.z };
  const facing = Math.PI / 2;
  const reach = 40 + 151 + 20; // clear of a box: the air, the stand's base, a margin
  const stations: CueStation[] = [{ id: 'player', at: { u: space.u0 - reach, v: head.v }, head, facing }];
  for (const o of lutePlanObjects(sc)) {
    if (!isAcc(o.kind)) continue;
    const a = ACCOMPANIST[o.kind];
    const h = accHead(o);
    // the tanpura player behind the sitar: the mixer on the left (clear of the player's mixer lane)
    const left = sc.kind === 'sitar' && o.kind === 'tanpura';
    const at = left ? { u: o.at.x + a.box.u0 - reach, v: h.v } : { u: o.at.x + a.box.u1 + reach, v: h.v };
    const st: CueStation = { id: o.kind, at, head: h, facing };
    stations.push(sc.kind === 'sitar' && o.kind === 'tabla' ? { ...st, via: [{ u: at.u, v: -1450 }] } : st);
  }
  if (sc.kind === 'sitar') return { room: LUTE_ROOM, wall: 'u0', hubAt: -300, stations };
  return { room: LUTE_ROOM, wall: 'v0', hubAt: sc.kind === 'oud' ? 500 : 700, stations };
}

/** The PA stack's plan box at its centre (a trapezoid's bounds). */
const paRect = (at: { x: number; z: number }): PlanRect => ({ u0: at.x - LUTE_SIZES.pa.top, u1: at.x + LUTE_SIZES.pa.top, v0: at.z - LUTE_SIZES.pa.hv, v1: at.z + LUTE_SIZES.pa.hv });

/** Every object's footprint on the plan (mm). `objects`: the plan's objects
 *  (lutePlanObjects), filtered here by the scene. */
export function lutePlanFoots(sc: LuteScene, parts: readonly { solid?: unknown }[], objects: readonly LutePlanObject[], scene: LutePlanScene, wedges: readonly Wedge[]): PlanFoot[] {
  const g = 'player';
  const out: PlanFoot[] = [foot('player', 'player', lutePlayerRect(sc), { group: g }), foot('instrument', 'instrument', luteInstrumentRect(parts), { group: g }), foot('space', 'keepClear', luteSpace(sc, parts), { group: g, zone: true })];
  const C = LUTE_SIZES.chair;
  for (const o of objects.filter((q) => luteShownIn(q, scene))) {
    if (o.kind === 'chair') out.push(foot('chair', 'chair', { u0: o.at.x - C.half, u1: o.at.x + C.half, v0: o.at.z - C.back, v1: o.at.z + C.front }, { group: g }));
    else if (o.kind === 'rug') out.push(foot('rug', 'rug', rugRect(o), { zone: true }));
    else if (o.kind === 'vocal') out.push(foot('vocal', 'micStand', rectOfCircle({ u: o.faces!.x, v: o.faces!.z }, LUTE_SIZES.vocalBase)));
    else if (isAcc(o.kind)) {
      const b = ACCOMPANIST[o.kind].box;
      out.push(foot(o.id, 'accompanist', { u0: o.at.x + b.u0, u1: o.at.x + b.u1, v0: o.at.z + b.v0, v1: o.at.z + b.v1 }, { group: `acc:${o.kind}` }));
    } else if (o.kind === 'sidefill') out.push(foot('sidefill', 'sideFill', rectAround({ u: o.at.x, v: o.at.z }, LUTE_SIZES.sideFill.along, LUTE_SIZES.sideFill.across, Math.atan2(o.faces?.z ?? 0, o.faces?.x ?? 1))));
    else if (o.kind === 'pa') out.push(foot(o.id, 'pa', paRect(o.at)));
  }
  if (scene === 'stage') {
    for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  } else out.push(...cueFootprints(luteCue(sc, parts)));
  return out;
}

/** The performers a plan draws (the studio needs a mixer for each). */
export function lutePerformers(sc: LuteScene): { id: string; group: string }[] {
  return [{ id: 'player', group: 'player' }, ...lutePlanObjects(sc).filter((o) => isAcc(o.kind)).map((o) => ({ id: o.kind, group: `acc:${o.kind}` }))];
}
