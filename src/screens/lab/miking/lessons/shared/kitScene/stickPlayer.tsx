/**
 * THE DRUMMER WHO HOLDS THE LESSON'S STICK (art grading fix 2026-10-16: "sticks
 * float with no hand in every side and event view"). The kit scene's seated
 * drummer (KitSceneArt's pose: the shared PlayerFigure, the same throne, head,
 * shoulders, hips, knees and pedal feet) with the RIGHT hand re-posed so its
 * fist holds a stick whose bead lands on the lesson's strike point; the left
 * hand keeps its stick on the snare.
 *
 * Geometry (drawing defaults, in the view's mm; the kit frame K):
 *   • the fist sits about a stick's playing length (≈ 30 cm of a 40.6 cm
 *     stick: the fulcrum a quarter of the way up from the butt) back from the
 *     tip, up and toward the player, never behind the chest, and within the
 *     arm's reach (projected upper arm + forearm); a far target straightens
 *     the arm toward it;
 *   • the elbow solves the two-bone arm (shoulder → elbow → wrist), bending
 *     down and back (side) or out to the drummer's right (above);
 *   • the stick runs from inside the fist (its butt hidden) to the tip.
 * The model's keep-outs (env.drummer, env.sticks) are unchanged: this is the
 * same drummer, drawn.
 *
 * A strike view in the cymbal's own frame (a close-up) draws the same drummer
 * mapped into that frame (`toLocal`), so the arm enters from the frame's edge
 * attached to a body outside it — a crop of a person, never a loose arm.
 */
import { Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { KIT, yAt } from '../kitPlanModel.ts';
import { figureCovers, PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { pt, type PlayerPose } from '../players/playerPose.ts';
import { DRUMMER, S0 } from './kitSceneModel.ts';
import { ThroneSide, ThroneTop } from './KitSceneArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P3 = { x: number; y: number; z: number };
type P2 = { x: number; y: number };

/** Fist to bead along the stick (mm): a 406 mm stick held a quarter up. */
const PLAY_LEN = 300;
/** Projected arm segments of the drawn drummer (its side pose). */
const SIDE_ARM = { upper: 232, fore: 290 };
/** Seen from above (a raised arm is seen nearly at full length). */
const TOP_ARM = { upper: 270, fore: 270 };

/** Two-bone IK in a plane: the elbow for shoulder S, wrist W, lengths a, b;
 *  `bend` +1/−1 picks the side (left/right of S→W). The wrist is pulled in
 *  to the reach when out of it. */
function solveArm(S: P2, W: P2, a: number, b: number, bend: number): { e: P2; w: P2 } {
  let dx = W.x - S.x;
  let dy = W.y - S.y;
  let d = Math.hypot(dx, dy) || 1;
  const reach = (a + b) * 0.985;
  let w = W;
  if (d > reach) {
    w = { x: S.x + (dx / d) * reach, y: S.y + (dy / d) * reach };
    dx = w.x - S.x;
    dy = w.y - S.y;
    d = reach;
  }
  d = Math.max(d, Math.abs(a - b) + 20);
  const ca = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const ang = Math.atan2(dy, dx) + bend * Math.acos(ca);
  return { e: { x: S.x + a * Math.cos(ang), y: S.y + a * Math.sin(ang) }, w };
}

export type StickDrummer = { pose: PlayerPose; stick: { from: P2; to: P2 }; farStick: { from: P2; to: P2 } };

const cache = new Map<string, StickDrummer>();

/** The drummer with the right stick's bead on `tip` (kit frame K), for the
 *  side view (u = x, v = y) or from above (u = x, v = z). */
export function stickDrummer(view: ViewId, tip: P3, back = 1): StickDrummer {
  const key = `${back}:${view}:${tip.x.toFixed(1)}:${tip.y.toFixed(1)}:${tip.z.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = KIT.throne;
  const head = { x: DRUMMER.headTop.x, y: DRUMMER.headTop.y + 112, z: DRUMMER.headTop.z };
  const tipSn = { x: S0.x + 40, y: S0.y - 8, z: S0.z + 10 };
  let out: StickDrummer;
  if (view === 'side') {
    const seatY = yAt(t.seatH);
    const hip = pt(t.c.u + 10, seatY - 90);
    const kneeR = pt(hip.u + 420, yAt(520));
    const S = { x: head.x - 12, y: head.y + 212 };
    // The fist: up and back from the tip toward the player, in front of the
    // chest (x ≥ S.x + 110), never lower than the tip's 14 cm above it.
    // The fist 15 cm above the strike and back toward the player; for a target
    // below the shoulder (the hats, the drums) never higher than just under
    // the shoulder — the stick then runs partly across the body (toward −z)
    // and its side view is short, as a real side view of a drummer shows it.
    const up = tip.y - 150 * back;
    const want = { x: Math.max(tip.x - 170 * back, S.x + 110), y: tip.y > S.y ? Math.max(up, S.y + 40) : up };
    const dWant = Math.hypot(tip.x - want.x, tip.y - want.y) || 1;
    // Keep the stick's projected length within its playing length.
    const k = dWant > PLAY_LEN ? PLAY_LEN / dWant : 1;
    const W0 = { x: tip.x + (want.x - tip.x) * k, y: tip.y + (want.y - tip.y) * k };
    const arm = solveArm(S, W0, SIDE_ARM.upper, SIDE_ARM.fore, 1);
    const W = arm.w;
    const dirR = Math.atan2(tip.y - W.y, tip.x - W.x);
    const wristL = pt(head.x + 184, yAt(840));
    const dirL = Math.atan2(tipSn.y - wristL.v, tipSn.x - wristL.u);
    const pose: PlayerPose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: pt(head.x, head.y), r: 110 },
      neck: pt(head.x - 18, head.y + 158),
      shoulderR: pt(S.x, S.y),
      shoulderL: pt(head.x - 26, head.y + 202),
      elbowR: pt(arm.e.x, arm.e.y),
      elbowL: pt(head.x + 20, head.y + 470),
      handR: { wrist: pt(W.x, W.y), dir: dirR, kind: 'grip' },
      handL: { wrist: wristL, dir: dirL, kind: 'grip' },
      hipR: hip,
      hipL: pt(hip.u - 10, hip.v - 4),
      kneeR,
      kneeL: pt(kneeR.u - 40, kneeR.v - 8),
      footR: pt(KIT.kick.pedal.u0 + 40, yAt(0)),
      footL: pt(KIT.hihatPedal.u0 + 100, yAt(0)),
      floor: yAt(0),
    };
    out = {
      pose,
      stick: { from: { x: W.x + Math.cos(dirR) * 20, y: W.y + Math.sin(dirR) * 20 }, to: { x: tip.x, y: tip.y } },
      farStick: { from: { x: wristL.u + Math.cos(dirL) * 20, y: wristL.v + Math.sin(dirL) * 20 }, to: { x: tipSn.x, y: tipSn.y } },
    };
  } else {
    // From above, authored chest toward +v round the neck, turned to face +x
    // (`facing` 0): (right, fwd) lands at world (neck + fwd, neck + right).
    const n = pt(head.x - 16, t.c.v);
    const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
    const fromWorld = (p: P2) => L(p.y - n.v, p.x - n.u);
    const dirOf = (dx: number, dz: number) => Math.atan2(dx, -dz);
    const S = { x: n.u, y: n.v + 200 }; // the right shoulder (world x, z)
    // The fist a playing length back from the tip toward the shoulder.
    const dx = tip.x - S.x;
    const dz = tip.z - S.y;
    const d = Math.hypot(dx, dz) || 1;
    const W0 = { x: tip.x - (dx / d) * Math.min(PLAY_LEN, d * 0.55), y: tip.z - (dz / d) * Math.min(PLAY_LEN, d * 0.55) };
    const arm = solveArm(S, W0, TOP_ARM.upper, TOP_ARM.fore, -1);
    const W = arm.w;
    const wL = { x: n.u + 200, z: n.v - 220 };
    const pose: PlayerPose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: L(0, -20), r: 110 },
      neck: n,
      shoulderR: L(200, 0),
      shoulderL: L(-200, 0),
      elbowR: fromWorld(arm.e),
      elbowL: L(-235, 30),
      handR: { wrist: fromWorld(W), dir: dirOf(tip.x - W.x, tip.z - W.y), kind: 'grip' },
      handL: { wrist: L(wL.z - n.v, wL.x - n.u), dir: dirOf(tipSn.x - wL.x, tipSn.z - wL.z), kind: 'grip' },
      hipR: L(106, -40),
      hipL: L(-106, -40),
      kneeR: L(190, 400),
      kneeL: L(-190, 400),
      footR: L(170, 470),
      footL: L(-190, 470),
      floor: null,
    };
    const aR = Math.atan2(tip.z - W.y, tip.x - W.x);
    const aL = Math.atan2(tipSn.z - wL.z, tipSn.x - wL.x);
    out = {
      pose,
      stick: { from: { x: W.x + Math.cos(aR) * 20, y: W.y + Math.sin(aR) * 20 }, to: { x: tip.x, y: tip.z } },
      farStick: { from: { x: wL.x + Math.cos(aL) * 20, y: wL.z + Math.sin(aL) * 20 }, to: { x: tipSn.x, y: tipSn.z } },
    };
  }
  cache.set(key, out);
  return out;
}

/* ── the drawing ── */

const make = () => Skia.Path.Make();
const stickCache = new Map<string, { body: SkPath; bead: SkPath; len: number; ang: number }>();
function stickPaths(s: { from: P2; to: P2 }) {
  const key = `${s.from.x},${s.from.y},${s.to.x},${s.to.y}`;
  let g = stickCache.get(key);
  if (!g) {
    // A hickory stick (DrumArt's Stick): Ø 14 at the butt, a shoulder, a bead.
    // Drawn from 60 mm behind the fist's grip point (the butt hidden in the
    // hand and under the heel) to the bead.
    const len = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) + 60;
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
    g = { body, bead, len, ang: Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x) };
    stickCache.set(key, g);
  }
  return g;
}

/** One stick, its bead on `to`, its butt tucked behind `from` (in the fist). */
export function HeldStick({ s }: { s: { from: P2; to: P2 } }) {
  const g = stickPaths(s);
  const bx = s.to.x - Math.cos(g.ang) * g.len;
  const by = s.to.y - Math.sin(g.ang) * g.len;
  return (
    <Group transform={[{ translateX: bx }, { translateY: by }, { rotate: g.ang }]}>
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
export function StickDrummerArt({ view, tip, dim = 0.5, part = 'all', back = 1 }: { view: ViewId; tip: P3; dim?: number; part?: 'all' | 'legs' | 'upper'; back?: number }) {
  const d = stickDrummer(view, tip, back);
  if (part === 'legs')
    return (
      <Group>
        <Group opacity={dim}>
          <ThroneTop />
        </Group>
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
export function StickHandOver({ view, tip, dim = 0.5 }: { view: ViewId; tip: P3; dim?: number }) {
  const d = stickDrummer(view, tip);
  return (
    <Group>
      <HeldStick s={d.stick} />
      <PlayerInFront pose={d.pose} dim={dim} />
    </Group>
  );
}

/** The labels' occupancy (LessonArt.figureAt): the drawn drummer and both
 *  sticks, so no name or leader sits on the player. */
export function stickDrummerCovers(view: ViewId, tip: P3, u: number, v: number, tol: number): boolean {
  const d = stickDrummer(view, tip);
  for (const s of [d.stick, d.farStick]) {
    const dx = s.to.x - s.from.x;
    const dy = s.to.y - s.from.y;
    const q = Math.max(0, Math.min(1, ((u - s.from.x) * dx + (v - s.from.y) * dy) / (dx * dx + dy * dy || 1)));
    if (Math.hypot(u - (s.from.x + q * dx), v - (s.from.y + q * dy)) <= 10 + tol) return true;
  }
  // From above the pose is authored chest toward +v and turned to face +x
  // about the neck (PlayerFigure's aboveTurn): undo the turn.
  const n = d.pose.neck;
  const p = view === 'side' ? pt(u, v) : pt(n.u - (v - n.v), n.v + (u - n.u));
  return figureCovers(d.pose, p.u, p.v, tol);
}

/** Where the right stick runs (for a lesson's own occupancy / tests). */
export function heldStickSeg(view: ViewId, tip: P3): { from: P2; to: P2 } {
  return stickDrummer(view, tip).stick;
}

/** The kit point the close-up strike views borrow the drummer's reach from:
 *  a stick raised to a 16 in crash's edge at the player's side (I01c's spot).
 *  The arm comes up from below-left, the fist up and back from the bead. */
const STRIKE_REF = { x: -234, y: -825, z: -455 };
/** The close-up shows the stick at its full playing length (≈ 30 cm). */
const STRIKE_BACK = 1.35;

/**
 * A strike close-up (a cymbal's own frame, the plate level at the origin): the
 * same drummer, moved so its stick's bead lands on `tip` — the arm enters
 * from the frame's left edge attached to the body outside it. `stickFrom`
 * gives where the held stick runs (for labels).
 */
export function StrikeArm({ tip, dim = 0.55 }: { tip: P2; dim?: number }) {
  const dx = tip.x - STRIKE_REF.x;
  const dy = tip.y - STRIKE_REF.y;
  const pose = strikePose();
  const s = stickDrummer('side', STRIKE_REF, STRIKE_BACK).stick;
  return (
    <Group transform={[{ translateX: dx }, { translateY: dy }]}>
      <PlayerBehind pose={pose} dim={dim} />
      <HeldStick s={s} />
      <PlayerInFront pose={pose} dim={dim} />
    </Group>
  );
}

/** The close-up's pose: the stick arm as the kit drummer's, the other arm
 *  hanging at the side (out of the close-up: no second stick crossing the
 *  frame's corner). */
let strikePoseCache: PlayerPose | null = null;
function strikePose(): PlayerPose {
  if (strikePoseCache) return strikePoseCache;
  const p = stickDrummer('side', STRIKE_REF, STRIKE_BACK).pose;
  const sh = p.shoulderL;
  strikePoseCache = { ...p, elbowL: pt(sh.u + 10, sh.v + 280), handL: { wrist: pt(sh.u + 20, sh.v + 540), dir: Math.PI / 2, kind: 'rest' } };
  return strikePoseCache;
}

/** Where the strike close-up's held stick runs, in the close-up's frame. */
export function strikeArmStick(tip: P2): { from: P2; to: P2 } {
  const s = stickDrummer('side', STRIKE_REF, STRIKE_BACK).stick;
  const dx = tip.x - STRIKE_REF.x;
  const dy = tip.y - STRIKE_REF.y;
  return { from: { x: s.from.x + dx, y: s.from.y + dy }, to: { x: s.to.x + dx, y: s.to.y + dy } };
}

/**
 * The same drummer in a LESSON frame that is the kit frame moved by
 * `origin` (a drum lesson centred on its own drum: M02 the snare, M03 a tom).
 * `tipK` is the bead in the KIT frame. 'phantom': the receded drummer behind
 * the drawing; 'hand': the stick, near arm and fist drawn again on top.
 */
export function LessonDrummer({ view, tipK, origin, layer }: { view: ViewId; tipK: P3; origin: P3; layer: 'phantom' | 'legs' | 'upper' | 'hand' }) {
  const t = view === 'side' ? [{ translateX: -origin.x }, { translateY: -origin.y }] : [{ translateX: -origin.x }, { translateY: -origin.z }];
  return (
    <Group transform={t}>
      {layer === 'phantom' ? <StickDrummerArt view={view} tip={tipK} dim={0.34} /> : layer === 'hand' ? <StickHandOver view={view} tip={tipK} dim={0.5} /> : <StickDrummerArt view={view} tip={tipK} part={layer} />}
    </Group>
  );
}

/** Label occupancy for LessonDrummer (u, v in the lesson frame). */
export function lessonDrummerCovers(view: ViewId, tipK: P3, origin: P3, u: number, v: number, tol: number): boolean {
  return stickDrummerCovers(view, tipK, u + origin.x, v + (view === 'side' ? origin.y : origin.z), tol);
}
