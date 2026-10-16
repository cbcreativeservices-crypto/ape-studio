/**
 * THE LOW-BRASS PLANS' LAYOUT (A03 horn, A04a tuba, A04b euphonium —
 * LowBrassSettingPage draws it) — pure, so the plans' overlap test reads the
 * same numbers the drawing uses (test/mikingPlanCollisions_20261015).
 *
 * Frame: the lesson's plan — u = x toward the audience, v = z to the
 * player's right; the origin on the floor under the player's seat. The
 * player's own drawing follows the lesson's variant (the bell up or to the
 * front), so a plan is one case per orientation. Positions are a typical
 * layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; a personal headphone mixer per performer in every studio): the
 * player's space (the hatch: the legs and feet, the bell and the hands, a
 * horn's "bells up") holds nothing else; the music stand stands beyond it;
 * neighbours sit a real spacing apart; in the studio (no wedges) every
 * performer — the player, the neighbours, a pianist at the piano — has a
 * headphone mixer at their station, fed from the CONTROL ROOM at the room's
 * edge (monitoring/cueMix.ts).
 */
import type { ViewBox, Wedge } from '../../../engine/model/types.ts';
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';
import { brassScene, CHAIR, type BrassScene } from './lowBrassScene.ts';
import { foot, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueStation } from '../monitoring/cueMix.ts';
import { MAIN_PAIR, MUSIC_STAND, pairRect, placePts, placedRect, standRect, studioRoom } from '../brass/hornPlanFoot.ts';
import { rigsOf, type PlanMix, type PlanRigSpec, type XZ } from '../brass/brassPlanModel.ts';

export type { PlanMix, PlanRigSpec, XZ } from '../brass/brassPlanModel.ts';

export type PlanObject = {
  id: string;
  kind: 'self' | 'brass' | 'stand' | 'piano' | 'pair' | 'wall';
  /** Where it sits (lesson frame, plan: x toward the audience, z to the player's right). */
  at: XZ;
  /** Turn on the plan (deg, from +x toward +z). */
  yaw?: number;
  /** Its tap radius (mm). */
  r: number;
  /** Another brass player: which instrument and bell. */
  spec?: LowBrassSpec;
  orient?: Orient;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
  /** A performer's headphone mixer in the studio (the piano: its pianist). */
  mix?: PlanMix;
};

/** A lesson's plan: the instrument, the objects, the two boxes, and the
 *  studio's distribution point(s). */
export type LowBrassPlanLayout = {
  spec: LowBrassSpec;
  objects: readonly PlanObject[];
  near: ViewBox;
  wide: ViewBox;
  cue: readonly PlanRigSpec[];
};

export type LowBrassPlanScene = 'kit' | 'stage' | 'studio';

export function lowBrassShown(L: LowBrassPlanLayout, scene: LowBrassPlanScene): PlanObject[] {
  return L.objects.filter((o) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit' && o.kind !== 'self'));
}

/* ── the player's space (the hatch) ── */
export type SpacePart = { kind: 'cap'; a: XZ; b: XZ; r: number } | { kind: 'rect'; x0: number; x1: number; z0: number; z1: number; r: number };
/** The player's space in plan: the legs and feet over the chair (a rounded
 *  box from the chair's back to just past the toes), the bell and the hand in
 *  it (a capsule from the body to the rim), and a horn's "bells up". */
export function spaceParts(s: BrassScene): SpacePart[] {
  const parts: SpacePart[] = [
    { kind: 'rect', x0: CHAIR.back.min.x - 20, x1: s.J.toeR.x + 90, z0: -(s.J.toeR.z + 100), z1: s.J.toeR.z + 100, r: 120 },
    { kind: 'cap', a: { x: s.J.pelvis.x, z: s.J.pelvis.z }, b: { x: s.bell.rim.x, z: s.bell.rim.z }, r: s.bell.R + 110 },
  ];
  if (s.bellsUp) parts.push({ kind: 'cap', a: { x: s.bell.rim.x, z: s.bell.rim.z }, b: { x: s.bellsUp.x, z: s.bellsUp.z }, r: s.bell.R + 60 });
  return parts;
}
export function spacePartRect(p: SpacePart): PlanRect {
  return p.kind === 'rect' ? { u0: p.x0, u1: p.x1, v0: p.z0, v1: p.z1 } : { u0: Math.min(p.a.x, p.b.x) - p.r, u1: Math.max(p.a.x, p.b.x) + p.r, v0: Math.min(p.a.z, p.b.z) - p.r, v1: Math.max(p.a.z, p.b.z) + p.r };
}

/** The seated player's body from above (shoulders, arms, thighs, the head):
 *  the joints' box with the body's own thickness round it. */
const BODY_PAD = 80;

/** A seated low-brass player, their chair and their instrument (one
 *  assembly), placed at `at` / `yaw`; the player's space as keep-clear. */
export function lowBrassPlayerFoots(s: BrassScene, at: XZ, yaw: number, id: string, group: string, space: boolean): PlanFoot[] {
  const J = Object.values(s.J).filter((q): q is { x: number; y: number; z: number } => !!q && typeof q === 'object');
  const out = [foot(`${id}:player`, 'player', placedRect(at, yaw, J, BODY_PAD), { group })];
  const ch = CHAIR;
  out.push(foot(`${id}:chair`, 'chair', placedRect(at, yaw, [{ x: ch.back.min.x, z: ch.seat.min.z }, { x: ch.seat.max.x, z: ch.seat.max.z }], 10), { group }));
  const R = s.bell.R;
  const pts: XZ[] = [...s.tubes.flatMap((t) => t.pts.map((q) => ({ x: q.x, z: q.z }))), ...s.valves.map((q) => q.c), { x: s.bell.rim.x - R, z: s.bell.rim.z - R }, { x: s.bell.rim.x + R, z: s.bell.rim.z + R }];
  if (s.bellsUp) pts.push({ x: s.bellsUp.x - R, z: s.bellsUp.z - R }, { x: s.bellsUp.x + R, z: s.bellsUp.z + R });
  out.push(foot(`${id}:instrument`, 'instrument', placedRect(at, yaw, pts, 20), { group }));
  if (space)
    spaceParts(s).forEach((p, i) => {
      const r = spacePartRect(p);
      out.push(
        foot(
          `${id}:space${i}`,
          'keepClear',
          placedRect(at, yaw, [
            { x: r.u0, z: r.v0 },
            { x: r.u1, z: r.v1 },
          ]),
          { group, zone: true },
        ),
      );
    });
  return out;
}

/** A grand piano from above (LowBrassSettingPage GrandPiano: the case 2100
 *  long, 1500 wide, the keys toward −x of its own frame) and its bench in
 *  front of the keys (≈ 760 × 360). */
export const PIANO = { case: { x0: -150, x1: 2060, z: 750 }, bench: { x0: -640, x1: -280, z: 380 } } as const;
export function pianoFoots(id: string, at: XZ, yaw: number): PlanFoot[] {
  const c = PIANO.case;
  const b = PIANO.bench;
  return [
    foot(`${id}:case`, 'piano', placedRect(at, yaw, [{ x: c.x0, z: -c.z }, { x: c.x1, z: -c.z }, { x: c.x1, z: c.z }, { x: c.x0, z: c.z }], 6), { group: id }),
    foot(`${id}:bench`, 'chair', placedRect(at, yaw, [{ x: b.x0, z: -b.z }, { x: b.x1, z: -b.z }, { x: b.x1, z: b.z }, { x: b.x0, z: b.z }]), { group: id }),
  ];
}
/** The pianist's place: the bench's centre (no figure is drawn; the
 *  headphones rest on the bench). */
export function pianistSeat(at: XZ, yaw: number): { u: number; v: number } {
  return placePts(at, yaw, [{ x: (PIANO.bench.x0 + PIANO.bench.x1) / 2, z: 0 }])[0];
}

/** A wall (or stage shell) seen edge-on, hatched behind (LowBrassSettingPage Wall). */
export function wallFoot(id: string, at: XZ, yaw: number, len: number): PlanFoot {
  return foot(id, 'wall', placedRect(at, yaw, [{ x: -200, z: -len / 2 }, { x: 0, z: len / 2 + 120 }]));
}

const sceneOf = (L: LowBrassPlanLayout, o: PlanObject, orient: Orient): BrassScene => (o.kind === 'self' ? brassScene(L.spec, orient) : brassScene(o.spec!, o.orient ?? o.spec!.orients[0]));

export function lowBrassPerformerOf(o: PlanObject): { id: string; group: string } | null {
  if (o.kind === 'self') return { id: 'player', group: 'player' };
  if (o.kind === 'brass' || o.kind === 'piano') return { id: o.id, group: o.id };
  return null;
}

export function lowBrassRoom(L: LowBrassPlanLayout): PlanRect {
  return studioRoom(L.wide);
}

/** The studio headphone mix: a personal mixer per performer. */
export function lowBrassCue(L: LowBrassPlanLayout, orient: Orient): CueRig[] {
  const stations = new Map<string, CueStation>();
  for (const o of lowBrassShown(L, 'studio')) {
    const who = lowBrassPerformerOf(o);
    if (!who || !o.mix) continue;
    const yaw = o.yaw ?? 0;
    let head: { u: number; v: number };
    let facing = (yaw * Math.PI) / 180;
    if (o.kind === 'piano') head = pianistSeat(o.at, yaw);
    else {
      const s = sceneOf(L, o, orient);
      head = placePts(o.kind === 'self' ? { x: 0, z: 0 } : o.at, yaw, [s.J.head])[0];
      facing = (yaw * Math.PI) / 180;
    }
    stations.set(who.id, { id: who.id, at: { u: o.mix.at.x, v: o.mix.at.z }, head, facing, via: o.mix.via?.map((q) => ({ u: q.x, v: q.z })) });
  }
  return rigsOf(L.cue, lowBrassRoom(L), stations);
}

export function lowBrassPerformers(L: LowBrassPlanLayout, scene: LowBrassPlanScene): { id: string; group: string }[] {
  return lowBrassShown(L, scene)
    .map(lowBrassPerformerOf)
    .filter((x): x is { id: string; group: string } => !!x);
}

/** Every object's footprint on the plan (mm), for the player's `orient`. */
export function lowBrassFoots(L: LowBrassPlanLayout, scene: LowBrassPlanScene, orient: Orient, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [];
  for (const o of lowBrassShown(L, scene)) {
    const yaw = o.yaw ?? 0;
    if (o.kind === 'self') out.push(...lowBrassPlayerFoots(sceneOf(L, o, orient), { x: 0, z: 0 }, 0, 'player', 'player', true));
    else if (o.kind === 'brass' && o.spec) out.push(...lowBrassPlayerFoots(sceneOf(L, o, orient), o.at, yaw, o.id, o.id, false));
    else if (o.kind === 'stand') out.push(foot(o.id, 'musicStand', standRect(o.at, yaw, MUSIC_STAND.lowBrass)));
    else if (o.kind === 'pair') out.push(foot(o.id, 'mainPair', pairRect(o.at, yaw, MAIN_PAIR.lowBrass)));
    else if (o.kind === 'piano') out.push(...pianoFoots(o.id, o.at, yaw));
    else if (o.kind === 'wall') out.push(wallFoot(o.id, o.at, yaw, o.r * 2));
  }
  if (scene === 'stage') for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  if (scene === 'studio') for (const rig of lowBrassCue(L, orient)) out.push(...cueFootprints(rig));
  return out;
}
