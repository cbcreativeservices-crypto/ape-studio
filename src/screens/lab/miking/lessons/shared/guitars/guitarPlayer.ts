/**
 * THE GUITAR FAMILY'S PLAYER — the shared player's joints for a guitar scene
 * (pure; tests reach it). Every joint is read from the scene's MODEL: the
 * head envelope, the picking arm's capsule and hand box, the fretting hand's
 * box, the posture and the floor (guitarModel.playerFit). So the drawn hands
 * sit where the mic is stopped, and a change to the model moves the drawing.
 *
 * Posture, in the engine's views (guitarModel's frames):
 *   • UPRIGHT, FRONT (side view, u = x, v = y): seated with the lower bout on
 *     the right thigh, or standing on a strap; the picking forearm over the
 *     lower bout from an elbow resting on its upper edge; the fretting hand's
 *     fingers arched over the board in four neighbouring fret spaces, the
 *     wrist below the neck, the thumb behind it.
 *   • UPRIGHT, ABOVE (top view, u = x, v = z): the shoulders behind the
 *     back, the forearm reaching over the top, the hand round the neck.
 *   • LAP (a square neck face up): seen from the audience (side view, v = −zG)
 *     leaning over the instrument across the thighs, the picking hand over
 *     the coverplate, the bar hand on a steel bar across the strings; and from
 *     above (top view, v = yG), seated on the bass side.
 */
import { fretX } from './guitarSpec.ts';
import type { GuitarScene } from './guitarModel.ts';
import { angleOf, BODY, pt, toward, type Hand, type PlayerPose, type Pt } from '../players/playerPose.ts';

/** Four neighbouring fret spaces within a hand's reach (≤ 100 mm), lowest
 *  first, and the point just behind each fret where a fingertip stops. */
export function fretTips(L: number): number[] {
  let n0 = 2;
  while (n0 < 12 && fretX(L, n0) - fretX(L, n0 + 3) > 100) n0++;
  const out: number[] = [];
  for (let n = n0; n < n0 + 4; n++) out.push(fretX(L, n) + 0.28 * (fretX(L, n - 1) - fretX(L, n)));
  return out;
}

/** Where a lap player's steel bar rests (drawing default: over the 7th fret). */
export const barX = (L: number) => fretX(L, 7);

const handAt = (elbow: Pt, centre: Pt, kind: Hand['kind'], back = BODY.handLen * 0.42): Hand => {
  const dir = angleOf(elbow, centre);
  return { wrist: pt(centre.u - Math.cos(dir) * back, centre.v - Math.sin(dir) * back), dir, kind };
};

/** The elbow of an arm from `s` to the wrist `w` (upper arm `U`, forearm `F`,
 *  mm in the view), bent DOWNWARD (toward +v): the two-bone solution; a wrist
 *  out of reach straightens the arm toward it. */
export function hangingElbow(s: Pt, w: Pt, U: number, F: number, flip = false): Pt {
  const dx = w.u - s.u;
  const dy = w.v - s.v;
  const d = Math.hypot(dx, dy);
  if (d < 1) return pt(s.u, s.v + U);
  const ux = dx / d;
  const uy = dy / d;
  if (d >= U + F - 1) return pt(s.u + ux * U, s.v + uy * U);
  const a = (U * U - F * F + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, U * U - a * a));
  // The perpendicular pointing down (+v).
  let px = -uy;
  let py = ux;
  if ((py < 0) !== flip) {
    px = -px;
    py = -py;
  }
  return pt(s.u + ux * a + px * h, s.v + uy * a + py * h);
}

/** The angle (deg) between two directions (rad). */
const bendDeg = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) * (180 / Math.PI);

/**
 * The FRETTING ARM for a hand whose knuckle row is at `k` (owner 2026-10-10:
 * the wrist bent ≈ 130°). The hand on the neck is fixed by the board; the
 * palm runs a palm's length (95 mm) from the knuckle row to the wrist, and
 * the elbow hangs from the shoulder (adult upper arm and forearm, bent down).
 * The palm's direction is chosen so the wrist bends ≈ 50° from the forearm
 * (the least bend when no direction reaches that).
 */
export function fretArm(s: Pt, k: Pt): { wrist: Pt; elbow: Pt; bend: number } {
  let best: { wrist: Pt; elbow: Pt; bend: number; cost: number } | null = null;
  for (let deg = -160; deg <= -5; deg += 5) {
    const d = (deg * Math.PI) / 180;
    const wrist = pt(k.u - Math.cos(d) * 95, k.v - Math.sin(d) * 95);
    // The elbow: the two-bone solutions, or hanging by the side with the arm
    // coming toward the viewer (both bones then shorter in the picture).
    const elbows = [hangingElbow(s, wrist, 285, 255, false), hangingElbow(s, wrist, 285, 255, true)];
    for (const du of [-40, 0, 40, 80]) for (const dv of [200, 240, 280]) {
      const e = pt(s.u + du, s.v + dv);
      if (Math.hypot(du, dv) <= 285 && Math.hypot(wrist.u - e.u, wrist.v - e.v) <= 255) elbows.push(e);
    }
    for (const elbow of elbows) {
      const bend = bendDeg(d, angleOf(elbow, wrist));
      // ≈ 50° of bend; the elbow hanging (below the shoulder) and never
      // across the chest (the player's left arm is on the viewer's right);
      // among equals, the palm nearer pointing up the neck.
      const cost = Math.abs(bend - 50) + 0.15 * Math.abs(deg + 100) + (elbow.v < s.v + 180 ? 60 : 0) + (elbow.u < s.u - 120 ? 60 : 0) + (elbow.u > s.u + 160 ? 60 : 0);
      if (!best || cost < best.cost) best = { wrist, elbow, bend, cost };
    }
  }
  return best!;
}

export function guitarPlayerPose(sc: GuitarScene, view: 'side' | 'top'): PlayerPose {
  const f = sc.fit;
  const g = sc.g;
  const sp = g.spec;
  const hx = f.head.c.x;
  const r = f.head.r;
  const tips = fretTips(g.L);
  const tipMid = (tips[1] + tips[2]) / 2;
  const half = g.boardHalf(tipMid);
  const lap = sc.o.lap;

  if (!lap && view === 'side') {
    const hy = f.head.c.y;
    const neck = pt(hx, hy + 150);
    const sv = neck.v + 22;
    const shoulderR = pt(hx - BODY.shoulderHalf, sv);
    const shoulderL = pt(hx + BODY.shoulderHalf, sv);
    // The picking elbow rests on the upper edge of the lower bout, over the
    // arm envelope's near end; the hand over the strings at its far end.
    const ex = f.arm.a.x + 10;
    const edgeV = sp.body.pot ? -Math.sqrt(Math.max(0, (sp.body.pot.d.mm / 2) ** 2 - (ex - sp.body.pot.cx.mm) ** 2)) : -g.halfW(ex, 'bass');
    const elbowR = pt(ex, Math.max(edgeV - 16, sv + 80));
    const handR = handAt(elbowR, pt(f.arm.b.x + 8, f.arm.b.y + 6), 'pick');
    // The fretting arm (owner 2026-10-10: the wrist bent ≈ 130°, the forearm
    // coming down to a hand pointing straight up). The hand ON the neck stays
    // — the four fingertips on their frets and the knuckle row under the
    // board's edge (the 'fret' hand builds them from the board) — while the
    // elbow and forearm move: the elbow hangs from the shoulder (an adult
    // upper arm, bent down), and the palm lies under the neck from the
    // knuckle row back toward the body, its wrist a palm's length (95 mm)
    // away, turned ≈ 55° from the forearm — never past 70°.
    const knuckles = pt(tipMid + 4, half + 32); // the 'fret' hand's knuckle-row centre, 20 mm under it
    const arm = fretArm(shoulderL, knuckles);
    // A short neck held close in front of the shoulder (mandolin, soprano
    // ukulele): no elbow an adult arm can reach gets the wrist under 70° in
    // this flat picture (the forearm comes toward the viewer) — the drawing
    // keeps its earlier arm there.
    const ok = arm.bend <= 70;
    const handL: Hand = ok
      ? { wrist: arm.wrist, dir: angleOf(arm.wrist, knuckles), kind: 'fret', board: { v: 0, half, tips } }
      : { wrist: pt(tipMid + 34, half + 82), dir: -Math.PI / 2 - 0.22, kind: 'fret', board: { v: 0, half, tips } };
    const elbowL = ok ? arm.elbow : toward(shoulderL, pt(shoulderL.u + 60, Math.max(sv + 300, half + 60)), 300);
    const seated = sc.variant.posture === 'seated';
    const hipV = neck.v + (seated ? 470 : 500);
    const floor = sc.floorY;
    const hipR = pt(hx - 112, hipV);
    const hipL = pt(hx + 112, hipV);
    const kneeR = seated ? pt(hx - 140, hipV + 48) : pt(hx - 100, hipV + 440);
    const kneeL = seated ? pt(hx + 140, hipV + 48) : pt(hx + 100, hipV + 440);
    const footR = pt(seated ? hx - 168 : hx - 118, floor);
    const footL = pt(seated ? hx + 176 : hx + 118, floor);
    const strapTo = seated ? null : sp.body.pot ? pt(g.edge + 12, -g.boardHalf(g.edge) - 6) : pt(g.edge - 14, -g.halfW(g.edge - 14, 'bass') + 4);
    return { view: 'front', posture: seated ? 'seated' : 'standing', head: { c: pt(hx, hy), r }, neck, shoulderR, shoulderL, elbowR, elbowL, handR, handL, hipR, hipL, kneeR, kneeL, footR, footL, floor, strapTo };
  }

  if (!lap) {
    // From above: v = z (+z toward the audience, down the glass).
    const hz = f.head.c.z;
    const neck = pt(hx, hz + 18);
    const shoulderR = pt(hx - BODY.shoulderHalf, hz + 22);
    const shoulderL = pt(hx + BODY.shoulderHalf, hz + 22);
    const elbowR = pt(f.arm.a.x, 24);
    // CLASH SWEEP 2026-10-10 (owner at 3×): the strumming hand is a loose
    // fist holding the pick (the front view's hand), seen from above — its
    // pick side on the strings, not an open hand 6–13 cm out in the air.
    // The fist is ≈ 86 mm across (BODY.handW): its centre half that in front
    // of the top, so the pick edge meets the strings' plane.
    const handR = handAt(elbowR, pt(f.arm.b.x + 6, f.arm.b.z - 8), 'pick');
    const elbowL = pt(Math.max(shoulderL.u + 40, tipMid - 120), hz + 190);
    // The fretting hand from above: the palm behind the neck, the fingers
    // over its edge, the fingertips STOPPING on the strings at the board
    // (the 'above' hand reaches ≈ 180 mm from its wrist to the fingertips) —
    // they ran ≈ 7 cm past the fingerboard into the air before.
    const handL: Hand = { wrist: pt(tipMid + 20, g.h(tipMid) + 2 - 180), dir: Math.PI / 2, kind: 'above', board: { v: 0, half: 26, tips } };
    const seated = sc.variant.posture === 'seated';
    const hipR = pt(hx - 106, hz + 70);
    const hipL = pt(hx + 106, hz + 70);
    const kneeR = seated ? pt(hx - 125, f.legs.max.z - 80) : pt(hx - 100, hz + 110);
    const kneeL = seated ? pt(hx + 125, f.legs.max.z - 80) : pt(hx + 100, hz + 110);
    const footR = seated ? pt(kneeR.u - 10, kneeR.v + 70) : pt(hx - 112, (f.feet?.max.z ?? hz + 260) - 20);
    const footL = seated ? pt(kneeL.u + 10, kneeL.v + 70) : pt(hx + 112, (f.feet?.max.z ?? hz + 260) - 20);
    return { view: 'above', posture: seated ? 'seated' : 'standing', head: { c: pt(hx, hz), r }, neck, shoulderR, shoulderL, elbowR, elbowL, handR, handL, hipR, hipL, kneeR, kneeL, footR, footL, floor: null };
  }

  // LAP. The bar over the 7th fret, resting on the strings.
  const bx = barX(g.L);
  const D = g.depth;
  if (view === 'side') {
    // Engine side view of the lap posture: v = −zG (the top faces up, −v).
    const hv = -f.head.c.z;
    const neck = pt(hx, hv + 150);
    const sv = neck.v + 22;
    const shoulderR = pt(hx - BODY.shoulderHalf, sv);
    const shoulderL = pt(hx + BODY.shoulderHalf, sv);
    const strings = -g.h(g.edge);
    const elbowR = pt(hx - 236, sv + 170);
    const handR = handAt(elbowR, pt(40, strings - 46), 'pick');
    const elbowL = pt(Math.min(hx + 270, bx - 30), sv + 175);
    const handL: Hand = { ...handAt(elbowL, pt(bx, strings - 58), 'bar'), board: { v: strings - 11, half: 11, tips: [bx] } };
    const hipV = Math.max(D + 50, neck.v + 470);
    const floor = sc.floorY;
    return {
      view: 'front',
      posture: 'lap',
      head: { c: pt(hx, hv), r },
      neck,
      shoulderR,
      shoulderL,
      elbowR,
      elbowL,
      handR,
      handL,
      hipR: pt(hx - 112, hipV),
      hipL: pt(hx + 112, hipV),
      kneeR: pt(hx - 140, hipV + 48),
      kneeL: pt(hx + 140, hipV + 48),
      footR: pt(hx - 168, floor),
      footL: pt(hx + 176, floor),
      floor,
    };
  }
  // Lap from above: v = yG (the player on the bass side, −v).
  const lh = g.lowerH;
  const hv = f.head.c.y;
  const neck = pt(hx, hv + 18);
  const shoulderR = pt(hx - BODY.shoulderHalf, hv + 24);
  const shoulderL = pt(hx + BODY.shoulderHalf, hv + 24);
  const elbowR = pt(hx - 230, -lh - 40);
  const handR = handAt(elbowR, pt(34, -8), 'above');
  const elbowL = pt(Math.min(hx + 250, bx - 40), -lh - 30);
  const handL: Hand = { ...handAt(elbowL, pt(bx + 10, -6), 'bar'), board: { v: 0, half: 38, tips: [bx] } };
  return {
    view: 'above',
    posture: 'lap',
    head: { c: pt(hx, hv), r },
    neck,
    shoulderR,
    shoulderL,
    elbowR,
    elbowL,
    handR,
    handL,
    hipR: pt(hx - 106, hv + 80),
    hipL: pt(hx + 106, hv + 80),
    kneeR: pt(hx - 125, lh + 60),
    kneeL: pt(hx + 125, lh + 60),
    footR: pt(hx - 135, lh + 130),
    footL: pt(hx + 135, lh + 130),
    floor: null,
  };
}
