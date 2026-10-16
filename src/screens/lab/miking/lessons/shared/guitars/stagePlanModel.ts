/**
 * The plucked-string family's STAGE AND STUDIO plan layout (StagePlan.tsx
 * draws it) — pure, so the plans' overlap test
 * (test/mikingPlanCollisions_20261015) reads the same numbers the drawing uses.
 *
 * Frame: the lesson frame from above — u = x (toward the neck), v = z (+v
 * toward the audience, down the glass). Positions are a typical layout,
 * ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: "no collisions or impossible layering in
 * ANY plan"): every object is laid out from the variant actually drawn (a lap
 * resonator and an upright one have different players); the DI box stands on
 * the floor just outside the player's keep-clear space; the PA stacks stand
 * on the deck's downstage corners, upstage of the audience edge; the edge
 * runs downstage of every wedge; a shared band mic stands off the rug. In a
 * STUDIO no wedges: the player's personal headphone mixer at their picking-
 * hand side (away from the neck), fed from the CONTROL ROOM on the room's
 * left wall (monitoring/cueMix.ts).
 */
import type { ViewBox } from '../../../engine/model/types.ts';
import { shapeBox } from '../../../engine/geometry/contentFrame.ts';
import type { GuitarScene } from './guitarModel.ts';
import { guitarPlayerPose } from './guitarPlayer.ts';
import { foot, kitPieceFootsTurned, rectAround, rectOfCircle, rectOfPts, unionRect, wedgeFoot, type PlanCable, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';
import type { Wedge } from '../../../engine/model/types.ts';

type XZ = { x: number; z: number };
export type PlanKind = 'wedge' | 'vocal' | 'chair' | 'di' | 'bassAmp' | 'kit' | 'pa' | 'player' | 'audience' | 'room' | 'shared';
export type PlanObject = { id: string; kind: PlanKind; at: XZ; faces?: XZ; scene: 'kit' | 'stage' | 'studio' | 'all'; r?: number };
export type GuitarPlanScene = 'stage' | 'studio';

/** What a lesson's plan holds round the player, and where its audience edge is. */
export type GuitarPlanOpts = { chair: boolean; vocal: boolean; di: boolean; shared?: boolean; stageEdgeZ: number };

/** The lessons' plans (lesson id → what is drawn). C05A/C05B: the wedge sits
 *  1.7 m out, so the deck runs to 2.0 m (the edge downstage of the wedge). */
export const GUITAR_PLANS = {
  C01: { chair: true, vocal: true, di: true, stageEdgeZ: 1650 },
  C03: { chair: true, vocal: false, di: true, stageEdgeZ: 1650 },
  C05A: { chair: false, vocal: true, di: false, shared: true, stageEdgeZ: 2000 },
  C05B: { chair: false, vocal: true, di: false, shared: true, stageEdgeZ: 2000 },
  C05C: { chair: true, vocal: true, di: true, stageEdgeZ: 1650 },
  C07: { chair: true, vocal: true, di: true, stageEdgeZ: 1650 },
} as const satisfies Record<string, GuitarPlanOpts>;

/** The wide (stage / studio) box and the studio's walls (drawn 60 thick,
 *  centred 200 in from the box). */
export const GUITAR_WIDE: ViewBox = { u0: -2400, u1: 2600, v0: -2750, v1: 2700 };
export const WALL = { inset: 200, stroke: 60 } as const;
export const GUITAR_ROOM: PlanRect = { u0: GUITAR_WIDE.u0 + WALL.inset + WALL.stroke / 2, u1: GUITAR_WIDE.u1 - WALL.inset - WALL.stroke / 2, v0: GUITAR_WIDE.v0 + WALL.inset + WALL.stroke / 2, v1: GUITAR_WIDE.v1 - WALL.inset - WALL.stroke / 2 };

/** True sizes of the drawn objects (mm, from above). */
export const SIZES = {
  chair: { half: 220, front: 200, back: 250, backDepth: 60 },
  di: { hu: 60, hv: 75 },
  vocalBase: 125,
  sharedBase: 150,
  amp: { hu: 320, hv: 190 },
  pa: { top: 300, bottom: 240, hv: 220 },
} as const;

/** The stage kit (the plan's five-piece kit from above), offsets from its
 *  kick (mm): drums and cymbals. */
export const KIT_DRUMS = [
  { dx: 0, dz: 0, r: 280 },
  { dx: -380, dz: 140, r: 180 },
  { dx: -180, dz: -240, r: 130 },
  { dx: 140, dz: -260, r: 150 },
  { dx: 420, dz: 120, r: 205 },
] as const;
export const KIT_CYMBALS = [
  { dx: -600, dz: -60, r: 180 },
  { dx: -320, dz: -480, r: 205 },
  { dx: 560, dz: -380, r: 255 },
] as const;
/** The drum rim drawn round each head. */
export const KIT_RIM = 12;
/** The stage kit is the SHARED five-piece kit at true size with its drummer
 *  (kitScene KitTop), turned to face the audience (+z, down the glass) —
 *  expert review 2026-10-15: the old stand-in drew the kick as a round head
 *  from above and had no throne, stands or drummer. `at` = the kit's
 *  centre; its origin (the kick's batter head) sits here. */
export const KIT_TURN = Math.PI / 2;
export function kitOriginAt(at: XZ): { u: number; v: number } {
  const B = { u: -135, v: 20 }; // kitPlanModel PLAN_BOX.kit's centre, before the turn
  return { u: at.x + B.v, v: at.z - B.u };
}

export const STAGE_AT = {
  kit: { x: -900, z: -1700 },
  bassAmp: { x: 1500, z: -1250 },
  /** The PA stacks' centres along u; their v sits just upstage of the edge. */
  paU: [-2000, 2100],
  /** PA front face → audience edge (mm of deck in front of the stacks). */
  paToEdge: 40,
} as const;
/** Where THE ROOM is named: open floor upstage right of the player. */
export const ROOM_AT = { x: 1400, z: -1500 } as const;

/** The plan's frame for one variant: the player's torso back edge (plan v),
 *  the player's space (the hatch), the rug and the jack at the tail. */
export function planFrame(sc: GuitarScene) {
  const g = sc.g;
  const fit = sc.fit;
  const lap = sc.o.lap;
  const torsoZ0 = lap ? fit.torso.min.y : fit.torso.min.z;
  const head = sc.o.P(fit.head.c);
  const chairZ = head.z - 40;
  const spaceU0 = Math.min(g.tail, fit.torso.min.x) - 60;
  // The hatch takes in the player (to the feet), the chair and the whole
  // instrument (to the headstock's end).
  const space: PlanRect = { u0: spaceU0, u1: g.L + g.spec.neck.headLen.mm + 40, v0: Math.min(torsoZ0 - 60, chairZ - SIZES.chair.back - 30), v1: Math.max(320, playerRect(sc).v1 + 20) };
  const rug: PlanRect = { u0: g.tail - 700, u1: g.L + 500, v0: torsoZ0 - 450, v1: 800 };
  const tailJack = { x: g.tail - 20, z: lap ? 0 : -g.depth / 2 };
  return { torsoZ0, head, chairZ, space, rug, tailJack };
}

/** A typical plan round a string player (lesson frame x, z), built from the
 *  variant drawn. */
export function stringsPlan(sc: GuitarScene, opts: { chair: boolean; vocal: boolean; di: boolean; shared?: boolean; stageEdgeZ?: number }): PlanObject[] {
  const F = planFrame(sc);
  const m = sc.o.P(sc.fit.mouth);
  const out: PlanObject[] = [{ id: 'player', kind: 'player', at: { x: F.head.x, z: F.head.z }, scene: 'all', r: 320 }];
  if (opts.chair) out.push({ id: 'chair', kind: 'chair', at: { x: F.head.x, z: F.chairZ }, scene: 'kit', r: 220 });
  // The vocal stand's base in front of the player's knees; its boom reaches up to the mouth.
  if (opts.vocal) out.push({ id: 'vocal', kind: 'vocal', at: { x: m.x, z: m.z + 90 }, faces: { x: m.x - 60, z: 520 }, scene: 'kit', r: 140 });
  // The DI on the floor just outside the player's space, on the tail side.
  if (opts.di) out.push({ id: 'di', kind: 'di', at: { x: F.space.u0 - 160, z: 260 }, scene: 'kit', r: 120 });
  // The shared band mic stands off the rug, in front of the player.
  if (opts.shared) out.push({ id: 'shared', kind: 'shared', at: { x: 300, z: F.rug.v1 + SIZES.sharedBase + 80 }, scene: 'stage', r: 160 });
  const edge = opts.stageEdgeZ ?? 1650;
  const paV = edge - STAGE_AT.paToEdge - SIZES.pa.hv;
  out.push(
    { id: 'bassAmp', kind: 'bassAmp', at: STAGE_AT.bassAmp, scene: 'stage', r: 330 },
    { id: 'kit', kind: 'kit', at: STAGE_AT.kit, scene: 'stage', r: 800 },
    { id: 'paL', kind: 'pa', at: { x: STAGE_AT.paU[0], z: paV }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: STAGE_AT.paU[1], z: paV }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: edge + 260 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: ROOM_AT, scene: 'studio', r: 300 },
  );
  return out;
}

/** Shown in this scene: the wide plans also show the close-up's objects. */
export function shownIn(o: { scene: string }, scene: 'kit' | 'stage' | 'studio'): boolean {
  return o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit');
}

/** The instrument's plan box (its parts' solids in this variant, from above). */
export function instrumentRect(sc: GuitarScene, parts: readonly { solid?: unknown; variants?: readonly string[] }[]): PlanRect {
  const rs: PlanRect[] = [];
  for (const p of parts) {
    if (!p.solid || (p.variants && !p.variants.includes(sc.variant.id))) continue;
    const b = shapeBox(p.solid as Parameters<typeof shapeBox>[0]);
    if (b) rs.push({ u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z });
  }
  return unionRect(rs);
}

/** The player figure's plan box: torso, legs (feet), head and the arms. */
export function playerRect(sc: GuitarScene): PlanRect {
  const f = sc.fit;
  const bx = (b: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }) => {
    const m = sc.o.box(b);
    return { u0: m.min.x, u1: m.max.x, v0: m.min.z, v1: m.max.z };
  };
  const pose = guitarPlayerPose(sc, 'top');
  const joints = rectOfPts([pose.shoulderR, pose.shoulderL, pose.elbowR, pose.elbowL, pose.kneeR, pose.kneeL, pose.footR, pose.footL, pose.hipR, pose.hipL].map((p) => ({ u: p.u, v: p.v })));
  const head = sc.o.P(f.head.c);
  const rs = [bx(f.torso), bx(f.legs), rectOfCircle({ u: head.x, v: head.z }, f.head.r), { u0: joints.u0 - 50, u1: joints.u1 + 50, v0: joints.v0 - 50, v1: joints.v1 + 50 }];
  if (f.feet) rs.push(bx(f.feet));
  return unionRect(rs);
}

/** The PA stack's plan box at its centre (a trapezoid's bounds). */
const paRect = (at: XZ): PlanRect => ({ u0: at.x - SIZES.pa.top, u1: at.x + SIZES.pa.top, v0: at.z - SIZES.pa.hv, v1: at.z + SIZES.pa.hv });

/** The studio headphone mix: the player's mixer on the picking-hand side
 *  (away from the neck), clear of the player's space, fed straight from the
 *  CONTROL ROOM on the room's left wall. */
export function guitarCue(sc: GuitarScene): CueRig {
  const F = planFrame(sc);
  const at = { u: F.space.u0 - 230, v: F.head.z - 70 };
  return {
    room: GUITAR_ROOM,
    wall: 'u0',
    hubAt: at.v,
    stations: [{ id: 'player', at, head: { u: F.head.x, v: F.head.z }, facing: Math.PI / 2 }],
  };
}

/** The DI cable's run outside the player's space (its start inside the
 *  space, at the tail jack, is the player's own). */
export function diCable(sc: GuitarScene, di: XZ): PlanCable {
  const F = planFrame(sc);
  const t = (F.space.u0 - F.tailJack.x) / (di.x - F.tailJack.x);
  const exit = { u: F.space.u0, v: F.tailJack.z + t * (di.z - SIZES.di.hv - F.tailJack.z) };
  return { id: 'diCable', kind: 'instrumentCable', pts: [exit, { u: di.x, v: di.z - SIZES.di.hv }], from: 'space', to: 'di' };
}

/** Every object's footprint on the plan (mm). */
export function guitarPlanFoots(sc: GuitarScene, parts: readonly { solid?: unknown; variants?: readonly string[] }[], objects: readonly PlanObject[], scene: GuitarPlanScene, wedges: readonly Wedge[]): PlanFoot[] {
  const F = planFrame(sc);
  const g = 'player';
  const out: PlanFoot[] = [foot('player', 'player', playerRect(sc), { group: g }), foot('instrument', 'instrument', instrumentRect(sc, parts), { group: g })];
  out.push(foot('space', 'keepClear', F.space, { group: g, zone: true }));
  out.push(foot('rug', 'rug', F.rug, { zone: true }));
  const C = SIZES.chair;
  for (const o of objects.filter((q) => shownIn(q, scene))) {
    if (o.kind === 'chair') out.push(foot('chair', 'chair', { u0: o.at.x - C.half, u1: o.at.x + C.half, v0: o.at.z - C.back, v1: o.at.z + C.front }, { group: g }));
    else if (o.kind === 'vocal') out.push(foot('vocal', 'micStand', rectOfCircle({ u: o.faces!.x, v: o.faces!.z }, SIZES.vocalBase)));
    else if (o.kind === 'shared') out.push(foot('shared', 'micStand', rectOfCircle({ u: o.at.x, v: o.at.z }, SIZES.sharedBase)));
    else if (o.kind === 'di') out.push(foot('di', 'dibox', { u0: o.at.x - SIZES.di.hu, u1: o.at.x + SIZES.di.hu, v0: o.at.z - SIZES.di.hv, v1: o.at.z + SIZES.di.hv }));
    else if (o.kind === 'bassAmp') out.push(foot('bassAmp', 'amp', rectAround({ u: o.at.x, v: o.at.z }, 2 * SIZES.amp.hu, 2 * SIZES.amp.hv)));
    else if (o.kind === 'pa') out.push(foot(o.id, 'pa', paRect(o.at)));
    else if (o.kind === 'kit') out.push(...kitPieceFootsTurned(kitOriginAt(o.at), 1, 'kit'));
  }
  if (scene === 'stage') {
    for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  } else out.push(...cueFootprints(guitarCue(sc)));
  return out;
}

/** The plan's cables (the DI run outside the player's space). */
export function guitarPlanCables(sc: GuitarScene, objects: readonly PlanObject[], scene: GuitarPlanScene): PlanCable[] {
  const di = objects.find((o) => o.kind === 'di' && shownIn(o, scene));
  return di ? [diCable(sc, di.at)] : [];
}
