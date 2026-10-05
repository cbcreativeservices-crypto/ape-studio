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
    // The fretting arm hangs from the shoulder; the elbow below the neck.
    const elbowL = toward(shoulderL, pt(shoulderL.u + 60, Math.max(sv + 300, half + 60)), 300);
    const handL: Hand = { wrist: pt(tipMid + 34, half + 82), dir: -Math.PI / 2 - 0.22, kind: 'fret', board: { v: 0, half, tips } };
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
    const handR = handAt(elbowR, pt(f.arm.b.x + 6, f.arm.b.z + 26), 'above');
    const elbowL = pt(Math.max(shoulderL.u + 40, tipMid - 120), hz + 190);
    const handL: Hand = { wrist: pt(tipMid + 20, -g.depth * 0.25 - 70), dir: Math.PI / 2, kind: 'above', board: { v: 0, half: 26, tips } };
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
