/**
 * THE BOWED FAMILY'S PLANS — pure layout (no Skia), so the plans' overlap
 * test (test/mikingPlanCollisions_20261015) reads the same numbers the
 * drawing (BowedSettingPage.tsx BowedPlan) uses.
 *
 * Plan frame = the lesson frame from above: u = x (the audience to the
 * right, +x), v = z, mm. Every position is a typical layout, ILLUSTRATIVE
 * (never a measurement).
 *
 * Footprints: a string player is ONE assembly (the body, the chair, the
 * instrument and its bow — `group`); the bow's sweep (or the plucking hand's
 * path) is the player's keep-clear space. A neighbour drawn turned (`yaw`)
 * is turned the same way here.
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan; STUDIO = a personal headphone mixer per performer, fed from the
 * CONTROL ROOM at the room's edge — monitoring/cueMix.ts).
 */
import type { Vec3, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { add, scale, sub } from '../../../engine/geometry/vec.ts';
import { archAt, outline, stringZ } from './bowedSpec.ts';
import { toLesson, type Posture } from './posture.ts';
import { foot, kitPieceFoots, rectOfCircle, wedgeFoot, type PlanFoot, type PlanPt, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';
import { pianistAt } from '../piano/pianoSpec.ts';
import { DRUMMER } from '../kitScene/kitSceneModel.ts';

const D = Math.PI / 180;

/** One object on the plan: what it is, where (lesson frame, top view), how
 *  big for a tap, and — for another string player — their posture. */
export type PlanObject = {
  id: string;
  kind: 'self' | 'bowed' | 'stand' | 'piano' | 'kit' | 'pair';
  at: { x: number; z: number };
  /** Turn on the plan, degrees (from +x toward +z). */
  yaw?: number;
  r: number;
  posture?: Posture;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
};

/** The bow as DRAWN for an under-chin player: at the end of a down-bow
 *  (BowedArt drawnPosture — the same numbers). */
export function drawnBow(P: Posture): { tip: Vec3; frog: Vec3; hand: Vec3; elbow: Vec3 } {
  if (P.kind !== 'underChin' || P.strokes.length < 3) return { tip: P.bow.tip, frog: P.bow.frog, hand: P.player.handR, elbow: P.player.elbowR };
  const b = P.bow;
  const frog = add(b.contact, scale(b.dir, b.hair));
  const tip = sub(frog, scale(b.dir, b.hair + (P.spec.bow.mm - b.hair) * 0.12));
  return { tip, frog, hand: P.strokes[2].hand, elbow: P.strokes[2].elbow };
}

type Pad = { x: number; z: number; r: number };
/** The player, the chair, the instrument and the drawn bow from above, as
 *  padded points (lesson frame x, z; r = the half-width drawn there). */
function playerPads(P: Posture, bow: boolean): Pad[] {
  const out: Pad[] = [];
  const at = (p: Vec3, r: number) => out.push({ x: p.x, z: p.z, r });
  const S = P.player;
  const db = drawnBow(P);
  at(S.head, S.headR);
  at(S.neck, 70);
  at(S.chest, 140);
  at(S.pelvis, 140);
  at(S.shoulderL, 75);
  at(S.shoulderR, 75);
  at(S.elbowL, 50);
  at(bow ? db.elbow : S.elbowR, 50);
  at(S.handL, 60);
  at(bow ? db.hand : S.handR, 60);
  at(S.hipL, 90);
  at(S.hipR, 90);
  at(S.kneeL, 75);
  at(S.kneeR, 75);
  at(S.ankleL, 55);
  at(S.ankleR, 55);
  at(S.toeL, 55);
  at(S.toeR, 55);
  if (P.chair) {
    at(P.chair.seat.min, 0);
    at(P.chair.seat.max, 0);
    at({ x: P.chair.seat.min.x, y: 0, z: P.chair.seat.max.z }, 0);
    at({ x: P.chair.seat.max.x, y: 0, z: P.chair.seat.min.z }, 0);
    for (const [a, b] of P.chair.legs) {
      at(a, 10);
      at(b, 10);
    }
  }
  // The instrument: its outline at the back, the rib edge and the top, the
  // neck and the scroll, the endpin.
  const { spec, st, ax } = P;
  for (const [x, y] of outline(spec)) for (const z of [-spec.rib.mm, 0, archAt(spec, x, y)]) at(toLesson(ax, { x, y, z }), 4);
  for (let x = st.neckX; x <= st.scrollX; x += 20) at(toLesson(ax, { x, y: 0, z: stringZ(spec, Math.min(x, st.nutX)) }), 40);
  if (P.endpinTip) at(P.endpinTip, 15);
  if (bow) for (let k = 0; k <= 10; k++) at(add(db.tip, scale(sub(db.frog, db.tip), k / 10)), 14);
  return out;
}

const padRect = (ps: readonly Pad[]): PlanRect => ({ u0: Math.min(...ps.map((p) => p.x - p.r)), u1: Math.max(...ps.map((p) => p.x + p.r)), v0: Math.min(...ps.map((p) => p.z - p.r)), v1: Math.max(...ps.map((p) => p.z + p.r)) });

/** A point turned by `yaw` (degrees, +x toward +z — Skia's rotate) and moved to `at`. */
export function place(at: { x: number; z: number }, yaw: number, p: { x: number; z: number }): PlanPt {
  const c = Math.cos(yaw * D);
  const s = Math.sin(yaw * D);
  return { u: at.x + p.x * c - p.z * s, v: at.z + p.x * s + p.z * c };
}
function placedRect(at: { x: number; z: number }, yaw: number, ps: readonly Pad[]): PlanRect {
  const q = ps.map((p) => ({ ...place(at, yaw, p), r: p.r }));
  return { u0: Math.min(...q.map((p) => p.u - p.r)), u1: Math.max(...q.map((p) => p.u + p.r)), v0: Math.min(...q.map((p) => p.v - p.r)), v1: Math.max(...q.map((p) => p.v + p.r)) };
}

/** The player's plan box (lesson frame). */
export function bowedPlayerRect(P: Posture, bow = true, at = { x: 0, z: 0 }, yaw = 0): PlanRect {
  return yaw === 0 && at.x === 0 && at.z === 0 ? padRect(playerPads(P, bow)) : placedRect(at, yaw, playerPads(P, bow));
}

/** The bow's sweep (BowedArt sweepPaths' fans, from above) as a plan box. */
export function sweepRect(P: Posture): PlanRect {
  const { st, ax, spec, bow } = P;
  const R = (spec.bowHair?.mm ?? spec.bow.mm) + (spec.bowHair ? 20 : 0);
  const halfW = st.contactHalf + 10;
  const round = 25;
  const ps: Pad[] = [];
  for (const sd of [1, -1])
    for (let i = 0; i <= 14; i++) {
      const a = -25 * D + (50 * D * i) / 14;
      const dir = add(scale(ax.y, Math.cos(a) * sd), scale(ax.z, Math.sin(a)));
      for (const w of [-halfW, halfW]) {
        const p = add(add(bow.contact, scale(dir, R + round)), scale(ax.x, w));
        ps.push({ x: p.x, z: p.z, r: 0 });
      }
    }
  for (const w of [-halfW, halfW]) {
    const c = add(bow.contact, scale(ax.x, w));
    ps.push({ x: c.x, z: c.z, r: round });
  }
  return padRect(ps);
}
/** The plucking hand's path (BowedArt pluckPath) as a plan box. */
export function pluckRect(P: Posture): PlanRect {
  const a = toLesson(P.ax, { x: 60, y: 0, z: stringZ(P.spec, 60) });
  const b = toLesson(P.ax, { x: 300, y: 0, z: stringZ(P.spec, 300) });
  return padRect([
    { x: a.x, z: a.z, r: 60 },
    { x: b.x, z: b.z, r: 60 },
  ]);
}


/* ── the neighbours that are not string players ── */

/** The grand piano (GrandPiano, local frame): the key fronts at x = −150,
 *  the case to x = 2100, across y 0 … 1500. */
export const PIANO_BOX = { x0: -160, x1: 2100, y0: 0, y1: 1500 } as const;
/** The pianist on the bench (PianoArt Pianist, top view), placed across the
 *  keyboard's middle: the key fronts and the pedals (piano frame). */
export const PIANIST = { xKey: -150, pedalX: 60, y: 750 } as const;
const PN = pianistAt(PIANIST.xKey, PIANIST.pedalX);
/** The pianist's head from above (Pianist's pose: 18 behind the neck). */
const PIANIST_HEAD = { x: PN.head.x - 28, z: PIANIST.y };
/** The pianist and the bench from above (piano frame): the bench, the body,
 *  the arms out to the keys and the feet under the keybed. */
const PIANIST_BOX = { x0: PN.bench.x0 - 10, x1: PN.head.x - 10 + 560, y0: PIANIST.y - PN.bench.hw - 10, y1: PIANIST.y + PN.bench.hw + 10 };
/** The music stand from above (MusicStand): the desk ±250 and the tripod's
 *  feet at 260 round the post. */
export const STAND_R = 262;
/** The main pair's tripod (MainPair): feet 300 round the post. */
export const PAIR_R = 300;

function rectCorners(r: { x0: number; x1: number; y0: number; y1: number }, at: { x: number; z: number }, yaw: number): PlanRect {
  const q = [
    { x: r.x0, z: r.y0 },
    { x: r.x1, z: r.y0 },
    { x: r.x1, z: r.y1 },
    { x: r.x0, z: r.y1 },
  ].map((p) => place(at, yaw, p));
  return { u0: Math.min(...q.map((p) => p.u)), u1: Math.max(...q.map((p) => p.u)), v0: Math.min(...q.map((p) => p.v)), v1: Math.max(...q.map((p) => p.v)) };
}
/** A footprint in a local frame, turned by yaw and moved to at: a square
 *  (a drum, a cymbal, a stand's feet) keeps its round size about its turned
 *  centre; any other box turns by its corners. */
function placeRect(f: PlanRect, at: { x: number; z: number }, yaw: number): PlanRect {
  const w = f.u1 - f.u0;
  const h = f.v1 - f.v0;
  if (Math.abs(w - h) < 1) {
    const c = place(at, yaw, { x: (f.u0 + f.u1) / 2, z: (f.v0 + f.v1) / 2 });
    return { u0: c.u - w / 2, u1: c.u + w / 2, v0: c.v - h / 2, v1: c.v + h / 2 };
  }
  return rectCorners({ x0: f.u0, x1: f.u1, y0: f.v0, y1: f.v1 }, at, yaw);
}

/* ── one lesson's plan ── */

/** Where a performer's headphone mixer stands in the studio (lesson frame),
 *  and any corners its feed passes on the way to its lane. */
export type CueSpot = { at: { x: number; z: number }; via?: readonly { x: number; z: number }[] };
export type BowedPlanLayout = {
  P: Posture;
  /** What works the strings: the bow (its sweep hatched) or a plucking hand. Default bow. */
  hands?: 'bow' | 'pluck';
  objects: readonly PlanObject[];
  /** The plan boxes (lesson frame, mm): around the player, and the wider room. */
  near: ViewBox;
  wide: ViewBox;
  /** STUDIO: each performer's headphone mixer (by performer id: 'self', a
   *  neighbour's id, `${kit}:drummer`, `${piano}:pianist`) and the CONTROL
   *  ROOM's distribution point on a wall. */
  cue: { wall: CueRig['wall']; hubAt: number; layout?: CueRig['layout']; rowSide?: 1 | -1; spots: Readonly<Record<string, CueSpot>> };
};

/** The studio room's inner wall faces: the wide box less the drawn wall
 *  (BowedPlan draws it 60 in, 60 thick). */
export function bowedRoom(L: Pick<BowedPlanLayout, 'wide'>): PlanRect {
  const b = L.wide;
  return { u0: b.u0 + 90, u1: b.u1 - 90, v0: b.v0 + 90, v1: b.v1 - 90 };
}

/** The objects a scene shows (BowedPlan's own rule: the 'kit' neighbours
 *  stay on the stage and in the studio). */
export function bowedShown(L: Pick<BowedPlanLayout, 'objects'>, scene: 'kit' | 'stage' | 'studio'): PlanObject[] {
  return L.objects.filter((o) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit' && o.kind !== 'self'));
}

export type BowedPerformer = { id: string; group: string; head: PlanPt; facing: number };
const facingOf = (f: Vec3, yaw: number) => Math.atan2(f.z, f.x) + yaw * D;

/** Every performer the plan draws: the player, each string neighbour, the
 *  drummer at a kit, the pianist at a piano. */
export function bowedPerformers(L: Pick<BowedPlanLayout, 'P' | 'objects'>): BowedPerformer[] {
  const out: BowedPerformer[] = [{ id: 'self', group: 'self', head: { u: L.P.player.head.x, v: L.P.player.head.z }, facing: facingOf(L.P.player.face, 0) }];
  for (const o of L.objects) {
    const yaw = o.yaw ?? 0;
    if (o.kind === 'bowed' && o.posture) out.push({ id: o.id, group: o.id, head: place(o.at, yaw, { x: o.posture.player.head.x, z: o.posture.player.head.z }), facing: facingOf(o.posture.player.face, yaw) });
    if (o.kind === 'kit') out.push({ id: `${o.id}:drummer`, group: o.id, head: place(o.at, yaw, { x: DRUMMER.headTop.x, z: DRUMMER.headTop.z }), facing: yaw * D });
    if (o.kind === 'piano') out.push({ id: `${o.id}:pianist`, group: o.id, head: place(o.at, yaw, PIANIST_HEAD), facing: yaw * D });
  }
  return out;
}

/** The studio headphone mix: a mixer for every performer, fed from the
 *  CONTROL ROOM on the layout's wall. */
export function bowedCue(L: BowedPlanLayout): CueRig {
  const stations = bowedPerformers(L).map((p) => {
    const s = L.cue.spots[p.id];
    if (!s) throw new Error(`bowed plan: no headphone mixer for ${p.id}`);
    return { id: p.id, at: { u: s.at.x, v: s.at.z }, head: p.head, facing: p.facing, ...(s.via ? { via: s.via.map((q) => ({ u: q.x, v: q.z })) } : {}) };
  });
  return { room: bowedRoom(L), wall: L.cue.wall, hubAt: L.cue.hubAt, ...(L.cue.layout ? { layout: L.cue.layout } : {}), ...(L.cue.rowSide ? { rowSide: L.cue.rowSide } : {}), stations };
}

/** Every object's footprint on the plan (mm). */
export function bowedFoots(L: BowedPlanLayout, scene: 'kit' | 'stage' | 'studio', wedges: readonly Wedge[]): PlanFoot[] {
  const bow = L.hands !== 'pluck';
  const out: PlanFoot[] = [foot('self', 'player', bowedPlayerRect(L.P, bow), { group: 'self' }), foot('self:sweep', 'keepClear', bow ? sweepRect(L.P) : pluckRect(L.P), { group: 'self', zone: true })];
  for (const o of bowedShown(L, scene)) {
    const yaw = o.yaw ?? 0;
    if (o.kind === 'bowed' && o.posture) out.push(foot(o.id, 'player', bowedPlayerRect(o.posture, true, o.at, yaw), { group: o.id }));
    else if (o.kind === 'stand') out.push(foot(o.id, 'stand', rectOfCircle({ u: o.at.x, v: o.at.z }, STAND_R)));
    else if (o.kind === 'pair') out.push(foot(o.id, 'mainPair', rectOfCircle({ u: o.at.x, v: o.at.z }, PAIR_R)));
    else if (o.kind === 'piano') {
      out.push(foot(o.id, 'piano', rectCorners(PIANO_BOX, o.at, yaw), { group: o.id }));
      out.push(foot(`${o.id}:pianist`, 'player', rectCorners(PIANIST_BOX, o.at, yaw), { group: o.id }));
    } else if (o.kind === 'kit') for (const f of kitPieceFoots({ u: 0, v: 0 }, o.id)) out.push({ ...f, ...placeRect(f, o.at, yaw) });
  }
  if (scene === 'stage') for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
  if (scene === 'studio') out.push(...cueFootprints(bowedCue(L)));
  return out;
}
