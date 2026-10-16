/**
 * THE BRASS PLANS' LAYOUT (A01 trumpet, A02 trombone — BrassSettingPage
 * draws it) — pure, so the plans' overlap test reads the same numbers the
 * drawing uses (test/mikingPlanCollisions_20261015).
 *
 * Frame: the lesson's plan — u = x toward the audience, v = z to the
 * player's right; the player's bell rim at the origin. Positions are a
 * typical layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; a personal headphone mixer per performer in every studio): every
 * object keeps ≥ 40 mm of floor from the next; the section's players stand
 * a real spacing apart; nothing stands in the trombone slide's reach; the
 * studio (no wedges) gives each performer — the player, the neighbours, the
 * singer and the drummer — a headphone mixer at their station, fed from the
 * CONTROL ROOM at the room's edge (monitoring/cueMix.ts).
 */
import type { ViewBox, Wedge } from '../../../engine/model/types.ts';
import { SLIDE_7TH } from './brassSpec.ts';
import type { HornPose } from './brassPosture.ts';
import { foot, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueStation, type CueWall } from '../monitoring/cueMix.ts';
import { drummerHead, kitFoots, MAIN_PAIR, pairRect, placePts, placedRect, singerFoots, singerHead, standRect, studioRoom, MUSIC_STAND } from './hornPlanFoot.ts';

export type XZ = { x: number; z: number };
/** A performer's personal headphone mixer (studio): its stand's centre and
 *  any corner its feed passes on the way to its lane. */
export type PlanMix = { at: XZ; via?: readonly XZ[] };

/** One object on the plan. */
export type BrassPlanObject = {
  id: string;
  kind: 'self' | 'brass' | 'stand' | 'kit' | 'pair' | 'singer';
  at: XZ;
  /** Turn on the plan, degrees (from +x toward +z). */
  yaw?: number;
  r: number;
  pose?: HornPose;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
  /** A performer's headphone mixer in the studio. */
  mix?: PlanMix;
};

/** A lesson's plan: the player's pose, the objects, the two boxes, and the
 *  studio's distribution point. */
export type BrassPlanLayout = {
  P: HornPose;
  objects: readonly BrassPlanObject[];
  near: ViewBox;
  wide: ViewBox;
  /** The studio's distribution point(s): each serves the performers named
   *  in `who` (one CONTROL ROOM label; a second box carries none). */
  cue: readonly PlanRigSpec[];
};
/** One distribution point at the studio room's edge and who it serves. */
export type PlanRigSpec = { id?: string; wall: CueWall; hubAt: number; layout?: 'wall' | 'row'; rowSide?: 1 | -1; hubLabel?: string | null; who: readonly string[] };

export type BrassScene = 'kit' | 'stage' | 'studio';

/** The objects a scene shows (stage and studio also show the near plan's). */
export function brassShown(L: BrassPlanLayout, scene: BrassScene): BrassPlanObject[] {
  return L.objects.filter((o) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit' && o.kind !== 'self'));
}

const isPt = (q: unknown): q is { x: number; z: number } => !!q && typeof q === 'object' && 'x' in q && 'z' in q;
/** The standing player from above (the shared figure: shoulders, arms,
 *  head) — the joints' box with the body's own thickness round it. */
const BODY_PAD = 90;

/** The slide's reach to 7th position (the dashed space BrassPlan draws). */
export function slideReach(P: HornPose): PlanRect | null {
  if (!P.slide) return null;
  const s = P.slide;
  return { u0: s.outerFrom.x - s.s - 20, u1: s.crook.x - s.s + SLIDE_7TH + 60, v0: s.z - 80, v1: s.z + 90 };
}

/** A horn player and their horn (one assembly), placed at `at` / `yaw`;
 *  a trombone's slide reach as its keep-clear space. */
export function brassPlayerFoots(P: HornPose, at: XZ, yaw: number, id: string, group: string): PlanFoot[] {
  const joints = Object.entries(P.player)
    .filter(([k, q]) => k !== 'face' && isPt(q))
    .map(([, q]) => q as XZ);
  const body = placedRect(at, yaw, joints, BODY_PAD);
  const R = P.spec.bell.mm / 2;
  const tubes = P.tubes.flatMap((t) => t.pts.map((q) => ({ x: q.x, z: q.z })));
  const horn = placedRect(at, yaw, [...tubes, { x: -200, z: -R }, { x: 10, z: R }], 25);
  const out = [foot(`${id}:player`, 'player', body, { group }), foot(`${id}:horn`, 'instrument', horn, { group })];
  const reach = slideReach(P);
  if (reach)
    out.push(
      foot(
        `${id}:reach`,
        'keepClear',
        placedRect(at, yaw, [
          { x: reach.u0, z: reach.v0 },
          { x: reach.u1, z: reach.v1 },
        ]),
        { group, zone: true },
      ),
    );
  return out;
}

/** The performer id and footprint group of an object (null: not a performer). */
export function brassPerformerOf(o: BrassPlanObject): { id: string; group: string } | null {
  if (o.kind === 'self') return { id: 'player', group: 'player' };
  if (o.kind === 'brass' || o.kind === 'singer' || o.kind === 'kit') return { id: o.id, group: o.id };
  return null;
}

/** The performer's head on the plan and the way the face points. */
function headOf(L: BrassPlanLayout, o: BrassPlanObject): { head: { u: number; v: number }; facing: number } {
  const yaw = o.yaw ?? 0;
  if (o.kind === 'kit') return { head: drummerHead(o.at), facing: 0 };
  if (o.kind === 'singer') return { head: singerHead(o.at, yaw), facing: (yaw * Math.PI) / 180 };
  const P = o.kind === 'self' ? L.P : o.pose!;
  const at = o.kind === 'self' ? { x: 0, z: 0 } : o.at;
  return { head: placePts(at, yaw, [P.player.head])[0], facing: Math.atan2(P.player.face.z, P.player.face.x) + (yaw * Math.PI) / 180 };
}

/** The studio room's inner wall faces. */
export function brassRoom(L: BrassPlanLayout): PlanRect {
  return studioRoom(L.wide);
}

/** The studio headphone mix: one personal mixer per performer the plan
 *  draws, each fed back to the CONTROL ROOM at the room's edge. */
export function brassCue(L: BrassPlanLayout): CueRig[] {
  const stations = new Map<string, CueStation>();
  for (const o of brassShown(L, 'studio')) {
    const who = brassPerformerOf(o);
    if (!who || !o.mix) continue;
    const { head, facing } = headOf(L, o);
    stations.set(who.id, { id: who.id, at: { u: o.mix.at.x, v: o.mix.at.z }, head, facing, via: o.mix.via?.map((q) => ({ u: q.x, v: q.z })) });
  }
  return rigsOf(L.cue, brassRoom(L), stations);
}

/** The rigs of a plan from its rig specs and its performers' stations. */
export function rigsOf(specs: readonly PlanRigSpec[], room: PlanRect, stations: ReadonlyMap<string, CueStation>): CueRig[] {
  return specs.map((r) => ({ id: r.id, room, wall: r.wall, hubAt: r.hubAt, layout: r.layout, rowSide: r.rowSide, hubLabel: r.hubLabel, stations: r.who.map((id) => stations.get(id)).filter((x): x is CueStation => !!x) }));
}

/** The performers a scene draws (each needs a mixer in the studio). */
export function brassPerformers(L: BrassPlanLayout, scene: BrassScene): { id: string; group: string }[] {
  return brassShown(L, scene)
    .map(brassPerformerOf)
    .filter((x): x is { id: string; group: string } => !!x);
}

/** Every object's footprint on the plan (mm). */
export function brassFoots(L: BrassPlanLayout, scene: BrassScene, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [];
  for (const o of brassShown(L, scene)) {
    const yaw = o.yaw ?? 0;
    if (o.kind === 'self') out.push(...brassPlayerFoots(L.P, { x: 0, z: 0 }, 0, 'player', 'player'));
    else if (o.kind === 'brass' && o.pose) out.push(...brassPlayerFoots(o.pose, o.at, yaw, o.id, o.id));
    else if (o.kind === 'stand') out.push(foot(o.id, 'musicStand', standRect(o.at, yaw, MUSIC_STAND.shared)));
    else if (o.kind === 'pair') out.push(foot(o.id, 'mainPair', pairRect(o.at, yaw, MAIN_PAIR.shared)));
    else if (o.kind === 'singer') out.push(...singerFoots(o.id, o.at, yaw, o.id));
    else if (o.kind === 'kit') out.push(...kitFoots(o.at, o.id));
  }
  if (scene === 'stage') for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  if (scene === 'studio') for (const rig of brassCue(L)) out.push(...cueFootprints(rig));
  return out;
}
