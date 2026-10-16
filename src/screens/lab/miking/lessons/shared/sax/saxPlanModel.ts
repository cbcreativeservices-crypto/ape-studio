/**
 * THE SAXOPHONE PLANS' LAYOUT (A05a–A05d — SaxSettingPage draws it) — pure,
 * so the plans' overlap test reads the same numbers the drawing uses
 * (test/mikingPlanCollisions_20261015).
 *
 * Frame: the lesson's plan — u = x toward the audience, v = z to the
 * player's right; the reed tip at the origin (the player stands just behind
 * it). The page draws the STANDING player. Positions are a typical layout,
 * ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; a personal headphone mixer per performer in every studio): the
 * bell's swing (the hatch) holds nothing else; the music stand stands clear
 * of the player and the wedge; the section's players stand a real spacing
 * apart, clear of the side wedge; in the studio (no wedges) every performer
 * — the player, the section, the drummer — has a headphone mixer at their
 * station, fed from the CONTROL ROOM at the room's edge (monitoring/cueMix.ts).
 */
import type { ViewBox, Wedge } from '../../../engine/model/types.ts';
import { centre, type SaxPosture } from './saxPosture.ts';
import { pathOf, radiusAt } from './saxSpec.ts';
import { swingShape } from './saxModel.ts';
import { foot, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueStation } from '../monitoring/cueMix.ts';
import { drummerHead, kitFoots, MAIN_PAIR, MUSIC_STAND, pairRect, placePts, placedRect, standRect, studioRoom } from '../brass/hornPlanFoot.ts';
import { rigsOf, type PlanMix, type PlanRigSpec, type XZ } from '../brass/brassPlanModel.ts';

export type { PlanMix, PlanRigSpec, XZ } from '../brass/brassPlanModel.ts';

/** One object on the plan: what it is, where (lesson frame, top view), how
 *  big for a tap, and — for another saxophonist — their posture. */
export type SaxPlanObject = {
  id: string;
  kind: 'self' | 'sax' | 'stand' | 'kit' | 'pair';
  at: XZ;
  yaw?: number;
  r: number;
  posture?: SaxPosture;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
  /** A performer's headphone mixer in the studio (the kit: its drummer). */
  mix?: PlanMix;
};

/** A lesson's plan (the player's posture is the family's STANDING one). */
export type SaxPlanLayout = {
  objects: readonly SaxPlanObject[];
  near: ViewBox;
  wide: ViewBox;
  cue: readonly PlanRigSpec[];
};

export type SaxPlanScene = 'kit' | 'stage' | 'studio';

export function saxShown(L: SaxPlanLayout, scene: SaxPlanScene): SaxPlanObject[] {
  return L.objects.filter((o) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit' && o.kind !== 'self'));
}

/** The bell's swing in plan (the hatched sector) as its box. */
export function swingRect(P: SaxPosture): PlanRect | null {
  const s = swingShape(P);
  if (s.kind !== 'sector') return null;
  const pts: XZ[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = s.a0 + ((s.a1 - s.a0) * i) / 24;
    pts.push({ x: s.c.x + s.r1 * Math.cos(a), z: s.c.z + s.r1 * Math.sin(a) }, { x: s.c.x + s.r0 * Math.cos(a), z: s.c.z + s.r0 * Math.sin(a) });
  }
  return placedRect({ x: 0, z: 0 }, 0, pts);
}

/** The standing player's body from above (shoulders, arms, the head, the
 *  feet): the joints' box with the body's own thickness round it. */
const BODY_PAD = 80;

/** A saxophonist and their horn (one assembly) at `at` / `yaw`; the bell's
 *  swing as keep-clear for the lesson's own player (drawn hatched). */
export function saxPlayerFoots(P: SaxPosture, at: XZ, yaw: number, id: string, group: string, swing: boolean): PlanFoot[] {
  const J = Object.values(P.player).filter((q): q is { x: number; y: number; z: number } => !!q && typeof q === 'object');
  const out = [foot(`${id}:player`, 'player', placedRect(at, yaw, J, BODY_PAD), { group })];
  const S = pathOf(P.row);
  const pts: XZ[] = [];
  let rMax = 0;
  for (let u = 0; u <= S.U; u += 10) {
    const q = centre(P, u);
    pts.push({ x: q.x, z: q.z });
    rMax = Math.max(rMax, u < S.bellStart ? radiusAt(P.row, u) : 0);
  }
  const rim = centre(P, S.U);
  const R = P.row.rimR.v;
  pts.push({ x: rim.x - R, z: rim.z - R }, { x: rim.x + R, z: rim.z + R });
  out.push(foot(`${id}:horn`, 'instrument', placedRect(at, yaw, pts, rMax + 25), { group }));
  const sw = swing ? swingRect(P) : null;
  if (sw)
    out.push(
      foot(
        `${id}:swing`,
        'keepClear',
        placedRect(at, yaw, [
          { x: sw.u0, z: sw.v0 },
          { x: sw.u1, z: sw.v1 },
        ]),
        { group, zone: true },
      ),
    );
  return out;
}

export function saxPerformerOf(o: SaxPlanObject): { id: string; group: string } | null {
  if (o.kind === 'self') return { id: 'player', group: 'player' };
  if (o.kind === 'sax' || o.kind === 'kit') return { id: o.id, group: o.id };
  return null;
}

export function saxRoom(L: SaxPlanLayout): PlanRect {
  return studioRoom(L.wide);
}

/** The studio headphone mix: a personal mixer per performer. */
export function saxCue(L: SaxPlanLayout, P: SaxPosture): CueRig[] {
  const stations = new Map<string, CueStation>();
  for (const o of saxShown(L, 'studio')) {
    const who = saxPerformerOf(o);
    if (!who || !o.mix) continue;
    const yaw = o.yaw ?? 0;
    const head = o.kind === 'kit' ? drummerHead(o.at) : placePts(o.kind === 'self' ? { x: 0, z: 0 } : o.at, yaw, [(o.kind === 'self' ? P : o.posture!).player.head])[0];
    stations.set(who.id, { id: who.id, at: { u: o.mix.at.x, v: o.mix.at.z }, head, facing: (yaw * Math.PI) / 180, via: o.mix.via?.map((q) => ({ u: q.x, v: q.z })) });
  }
  return rigsOf(L.cue, saxRoom(L), stations);
}

export function saxPerformers(L: SaxPlanLayout, scene: SaxPlanScene): { id: string; group: string }[] {
  return saxShown(L, scene)
    .map(saxPerformerOf)
    .filter((x): x is { id: string; group: string } => !!x);
}

/** Every object's footprint on the plan (mm). */
export function saxFoots(L: SaxPlanLayout, P: SaxPosture, scene: SaxPlanScene, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [];
  for (const o of saxShown(L, scene)) {
    const yaw = o.yaw ?? 0;
    if (o.kind === 'self') out.push(...saxPlayerFoots(P, { x: 0, z: 0 }, 0, 'player', 'player', true));
    else if (o.kind === 'sax' && o.posture) out.push(...saxPlayerFoots(o.posture, o.at, yaw, o.id, o.id, false));
    else if (o.kind === 'stand') out.push(foot(o.id, 'musicStand', standRect(o.at, yaw, MUSIC_STAND.shared)));
    else if (o.kind === 'pair') out.push(foot(o.id, 'mainPair', pairRect(o.at, yaw, MAIN_PAIR.shared)));
    else if (o.kind === 'kit') out.push(...kitFoots(o.at, o.id));
  }
  if (scene === 'stage') for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  if (scene === 'studio') for (const rig of saxCue(L, P)) out.push(...cueFootprints(rig));
  return out;
}
