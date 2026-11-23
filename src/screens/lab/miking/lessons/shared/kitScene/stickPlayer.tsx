/**
 * THE DRUMMER WHO HOLDS THE LESSON'S STICKS (art grading fix 2026-10-16:
 * "sticks float with no hand in every side and event view"; stick technique
 * fix 2026-11-22, owner: "It should look like normal stick tech. usage").
 * The kit scene's seated drummer (the shared PlayerFigure on the same throne)
 * playing one picture's stroke (kitStrokes.ts): both hands and the body are
 * solved ONCE in 3-D (stickPose.ts) and drawn in the side view (x, y) and
 * from above (x, z), so the two views of a stick always agree.
 *
 * A stick is the real 406 mm stick projected: the butt under the heel of the
 * hand, the fulcrum in the fist, the bead on the strike. Nothing stretches.
 *
 * A strike view in a close-up frame (a cymbal's or a drum's own frame) draws
 * the same drummer moved so its bead lands on the close-up's tip, so the arm
 * enters from the frame's edge attached to a body outside it — a crop of a
 * person, never a loose arm.
 */
import { Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { figureCovers, PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { pt, type PlayerPose } from '../players/playerPose.ts';
import { drummerPose, viewDrummer, type DrummerSpec, type Stick2, type ViewDrummer } from './stickPose.ts';
import { CLOSEUP_CYMBAL, CLOSEUP_DRUM } from './kitStrokes.ts';
import { ThroneSide, ThroneTop } from './KitSceneArt';
import { HiHatPedalTop } from '../cymbals/CymbalArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P3 = { x: number; y: number; z: number };
type P2 = { x: number; y: number };

const viewOf = (v: ViewId): 'side' | 'top' => (v === 'side' ? 'side' : 'top');

/** The drummer playing `spec`, drawn in a view (pose + both sticks). */
export function stickDrummer(view: ViewId, spec: DrummerSpec): ViewDrummer {
  return viewDrummer(drummerPose(spec), viewOf(view));
}

/* ── the drawing ── */

const make = () => Skia.Path.Make();
const stickCache = new Map<string, { body: SkPath; bead: SkPath; len: number; ang: number }>();
function stickPaths(s: Stick2) {
  const key = `${s.butt.x},${s.butt.y},${s.to.x},${s.to.y}`;
  let g = stickCache.get(key);
  if (!g) {
    // A hickory stick (DrumArt's Stick): Ø 14 at the butt, a shoulder, a
    // bead — from its butt (under the heel of the hand) to the bead, the
    // 406 mm stick as this view sees it.
    const len = Math.max(30, Math.hypot(s.to.x - s.butt.x, s.to.y - s.butt.y));
    const body = make();
    body.moveTo(0, -7);
    body.lineTo(len * 0.78, -6);
    body.quadTo(len * 0.93, -3.2, len - 9, -2.6);
    body.lineTo(len - 9, 2.6);
    body.quadTo(len * 0.93, 3.2, len * 0.78, 6);
    body.lineTo(0, 7);
    body.close();
    const bead = make();
    bead.addOval(Skia.XYWHRect(len - 11, -4.4, 12, 8.8));
    g = { body, bead, len, ang: Math.atan2(s.to.y - s.butt.y, s.to.x - s.butt.x) };
    stickCache.set(key, g);
  }
  return g;
}

/** One stick, from its butt to its bead. */
export function HeldStick({ s }: { s: Stick2 }) {
  const g = stickPaths(s);
  return (
    <Group transform={[{ translateX: s.butt.x }, { translateY: s.butt.y }, { rotate: g.ang }]}>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -7)} end={vec(0, 7)} colors={['#f3dcae', '#d9b277', '#a87b42', '#6e4a22']} />
      </Path>
      <Path path={g.bead}>
        <RadialGradient c={vec(g.len - 7, -1.5)} r={7} colors={['#fff2d6', '#d9b277', '#8a5e2e']} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={0.8} color="#3a240e" opacity={0.8} />
    </Group>
  );
}

/**
 * The drummer and both sticks, layered so each fist closes over its own
 * stick: the left stick, the body (legs, torso, head, far arm), the right
 * stick, the near arm and the hands. `dim` < 1 lets the drummer recede (the
 * lesson's cymbal stays the brightest thing). `part`: 'all', or from above
 * the 'legs' under the drums and the 'upper' body over them.
 */
export function StickDrummerArt({ view, spec, dim = 0.5, part = 'all' }: { view: ViewId; spec: DrummerSpec; dim?: number; part?: 'all' | 'legs' | 'upper' }) {
  const d = stickDrummer(view, spec);
  if (part === 'legs')
    return (
      <Group>
        <Group opacity={dim}>
          <ThroneTop />
        </Group>
        {/* the hi-hat pedal on the floor, so the left shoe stands on it */}
        <HiHatPedalTop />
        <PlayerBehind pose={d.pose} part="legs" dim={dim} />
      </Group>
    );
  return (
    <Group>
      {view === 'side' ? (
        <Group opacity={dim}>
          <ThroneSide />
        </Group>
      ) : null}
      <Group opacity={Math.min(1, dim + 0.2)}>
        <HeldStick s={d.farStick} />
      </Group>
      <PlayerBehind pose={d.pose} dim={dim} part={view === 'side' ? 'all' : 'upper'} />
      <HeldStick s={d.stick} />
      <PlayerInFront pose={d.pose} dim={dim} />
    </Group>
  );
}

/** Just the near (stick) hand and arm again, over a nearer cymbal that covered
 *  the drummer, so the fist still closes over its stick. */
export function StickHandOver({ view, spec, dim = 0.5 }: { view: ViewId; spec: DrummerSpec; dim?: number }) {
  const d = stickDrummer(view, spec);
  return (
    <Group>
      <HeldStick s={d.stick} />
      <PlayerInFront pose={d.pose} dim={dim} />
    </Group>
  );
}

/** Distance from (u, v) to a drawn stick (butt → bead). */
export function stickDist(s: Stick2, u: number, v: number): number {
  const dx = s.to.x - s.butt.x;
  const dy = s.to.y - s.butt.y;
  const q = Math.max(0, Math.min(1, ((u - s.butt.x) * dx + (v - s.butt.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - (s.butt.x + q * dx), v - (s.butt.y + q * dy));
}

/** The labels' occupancy (LessonArt.figureAt): the drawn drummer and both
 *  sticks, so no name or leader sits on the player. */
export function stickDrummerCovers(view: ViewId, spec: DrummerSpec, u: number, v: number, tol: number): boolean {
  const d = stickDrummer(view, spec);
  for (const s of [d.stick, d.farStick]) if (stickDist(s, u, v) <= 10 + tol) return true;
  return poseCovers(d.pose, view, u, v, tol);
}

/** From above the pose is authored chest toward +v and turned to face +x
 *  about the neck (PlayerFigure's aboveTurn): undo the turn. */
function poseCovers(pose: PlayerPose, view: ViewId, u: number, v: number, tol: number): boolean {
  const n = pose.neck;
  const p = view === 'side' ? pt(u, v) : pt(n.u - (v - n.v), n.v + (u - n.u));
  return figureCovers(pose, p.u, p.v, tol);
}

/** Where the right stick runs (for a lesson's own occupancy / labels / tests). */
export function heldStickSeg(view: ViewId, spec: DrummerSpec): Stick2 {
  return stickDrummer(view, spec).stick;
}

/* ── the close-ups ── */

type CloseKind = 'drum' | 'cymbal';
const closeSpec = (k: CloseKind) => (k === 'drum' ? CLOSEUP_DRUM : CLOSEUP_CYMBAL);

/** The close-up's pose: the stick arm as the kit drummer's, the other arm
 *  hanging at the side (out of the close-up: no second stick crossing the
 *  frame's corner). */
const strikePoseCache = new Map<CloseKind, PlayerPose>();
function strikePose(k: CloseKind): PlayerPose {
  const hit = strikePoseCache.get(k);
  if (hit) return hit;
  const p = stickDrummer('side', closeSpec(k)).pose;
  const sh = p.shoulderL;
  const out: PlayerPose = { ...p, elbowL: pt(sh.u + 10, sh.v + 280), handL: { wrist: pt(sh.u + 20, sh.v + 540), dir: Math.PI / 2, kind: 'rest' } };
  strikePoseCache.set(k, out);
  return out;
}

/** The close-up's shift: the kit drummer moved so its bead lands on `tip`. */
function closeShift(tip: P2, k: CloseKind): P2 {
  const s = stickDrummer('side', closeSpec(k)).stick;
  return { x: tip.x - s.to.x, y: tip.y - s.to.y };
}

/**
 * A strike close-up (a cymbal's or a drum's own frame, the plate or head
 * level at the origin): the same drummer, moved so its stick's bead lands on
 * `tip` — the arm enters from the frame's left edge attached to the body
 * outside it. `kind` picks the stroke: a drum (≈ 11° to the head, the M02
 * stroke) or a cymbal (15° to a level plate).
 */
export function StrikeArm({ tip, dim = 0.55, kind = 'cymbal', dowel = false }: { tip: P2; dim?: number; kind?: CloseKind; dowel?: boolean }) {
  const sh = closeShift(tip, kind);
  const pose = strikePose(kind);
  const s = stickDrummer('side', closeSpec(kind)).stick;
  return (
    <Group transform={[{ translateX: sh.x }, { translateY: sh.y }]}>
      <PlayerBehind pose={pose} dim={dim} />
      {dowel ? <Dowel s={s} /> : <HeldStick s={s} />}
      <PlayerInFront pose={pose} dim={dim} />
    </Group>
  );
}

/** A timbale stick: a straight hickory dowel (16 in / 406 mm, Ø 11 mm), no
 *  bead and no taper, from its butt to its tip (the same held stick, drawn
 *  as a dowel). */
const dowelCache = new Map<string, { body: SkPath; len: number; ang: number }>();
export function Dowel({ s }: { s: Stick2 }) {
  const key = `${s.butt.x},${s.butt.y},${s.to.x},${s.to.y}`;
  let g = dowelCache.get(key);
  if (!g) {
    const len = Math.max(30, Math.hypot(s.to.x - s.butt.x, s.to.y - s.butt.y));
    const body = make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(0, -5.5, len, 11), 5.5, 5.5));
    g = { body, len, ang: Math.atan2(s.to.y - s.butt.y, s.to.x - s.butt.x) };
    dowelCache.set(key, g);
  }
  return (
    <Group transform={[{ translateX: s.butt.x }, { translateY: s.butt.y }, { rotate: g.ang }]}>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -5.5)} end={vec(0, 5.5)} colors={['#f0d7a6', '#d2a868', '#a87b42', '#6e4a22']} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={0.8} color="#3a240e" opacity={0.8} />
    </Group>
  );
}

/** Where the strike close-up's held stick runs, in the close-up's frame. */
export function strikeArmStick(tip: P2, kind: CloseKind = 'cymbal'): Stick2 {
  const s = stickDrummer('side', closeSpec(kind)).stick;
  const sh = closeShift(tip, kind);
  const m = (p: P2) => ({ x: p.x + sh.x, y: p.y + sh.y });
  return { butt: m(s.butt), from: m(s.from), to: m(s.to) };
}

/* ── a lesson frame moved from the kit frame ── */

/**
 * The same drummer in a LESSON frame that is the kit frame moved by
 * `origin` (a drum lesson centred on its own drum: M02 the snare, M03 a tom).
 * 'phantom': the receded drummer behind the drawing; 'hand': the stick, near
 * arm and fist drawn again on top.
 */
export function LessonDrummer({ view, spec, origin, layer }: { view: ViewId; spec: DrummerSpec; origin: P3; layer: 'phantom' | 'legs' | 'upper' | 'hand' }) {
  const t = view === 'side' ? [{ translateX: -origin.x }, { translateY: -origin.y }] : [{ translateX: -origin.x }, { translateY: -origin.z }];
  return (
    <Group transform={t}>
      {layer === 'phantom' ? <StickDrummerArt view={view} spec={spec} dim={0.34} /> : layer === 'hand' ? <StickHandOver view={view} spec={spec} dim={0.5} /> : <StickDrummerArt view={view} spec={spec} part={layer} />}
    </Group>
  );
}

/** Label occupancy for LessonDrummer (u, v in the lesson frame). */
export function lessonDrummerCovers(view: ViewId, spec: DrummerSpec, origin: P3, u: number, v: number, tol: number): boolean {
  return stickDrummerCovers(view, spec, u + origin.x, v + (view === 'side' ? origin.y : origin.z), tol);
}
