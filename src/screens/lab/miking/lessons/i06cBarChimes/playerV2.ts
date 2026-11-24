/**
 * I06c BAR CHIMES — the player in the approved look (figure roll-out, D78,
 * 2026-11-24; shared/metal/metalFigureV2). Pure.
 *
 * The sweep (the lesson: "the player's hand at the long end ready to sweep"):
 * the player stands behind the row, the LEFT hand at the long end with the
 * fingers hanging down and a little forward, the backs of the fingers (the
 * nails) brushing the bars from the player's side — the hand travels along the
 * row toward the short end; the right arm relaxed at the side. From the
 * audience (the face-on page and the stroke pictures) the hand is the approved
 * hand-drum hand at true size (the back of the left hand, the fingers down),
 * seen through the bars; this module gives its arm (the sleeve ends at its
 * wrist there).
 *
 * Who plays (cast.ts ROLES 'metal.barChimes'): the drummer (the approved
 * hand-drum hand wears his skin and sleeve).
 */
import { v3, type V3 } from '../shared/players/handModel.ts';
import { fittedArm, frameOf, hangArm, metalFig, solveArmTo, standing, type MetalArm, type MetalFig, type MetalView } from '../shared/metal/metalFigureV2.ts';
import { BC } from './model.ts';

export const BC_BODY = standing({ x0: -362, z0: 0, yaw: 0, nod: 14 });

/**
 * OWNER'S RULING (D78, the stroke a learner sees): the sweeping hand on the face-on page and in the stroke
 * pictures. true (the new default): the left hand hanging fingers DOWN behind the bars, the backs of the fingers
 * brushing them. false (the old picture): the hand fingers UP in front of the bars (the same approved hand-drum
 * hand; on the face-on page the player's sleeve then reaches it from its elbow). The side and top views keep the
 * hanging sweep either way.
 */
export const BC_SWEEP_FINGERS_DOWN = true;
const HALF = BC.rail.mm / 2;

/** The sweeping hand at the long end: the fingers' backs on the bars (x = 0, Ø 10). */
export function sweepArm(): MetalArm {
  const z0 = -HALF + 20;
  const y0 = -1182;
  const pad = -13; // the pads' centres, the nails toward the bars
  const o = v3(-132, -1318, z0 + 4);
  const f = frameOf(o, v3(0.78, 1, 0.02), v3(1, -0.7, 0), 'L');
  return fittedArm(BC_BODY, 'L', f, [v3(pad, y0 - 6, z0 + 22), v3(pad, y0, z0 + 6), v3(pad + 1, y0 + 2, z0 - 10), v3(pad + 2, y0 - 6, z0 - 25)], { yaw: 0.55, pitch: 0.5, mcp: 0.25, ip: 0.25 }, {
    out: 200,
    down: 40,
    back: 170,
    maxWrist: 48,
    slide: 40,
    curl: 0.35,
    dipRatio: 0.5,
  });
}

/**
 * From the audience: the arm to the approved hand-drum hand's wrist (`wrist`, page u = −z, v = y), the hand
 * itself drawn by the lesson (the sleeve ends at that wrist; the hand behind the bars, at x = −40). The elbow
 * out to the side and a little raised, so the forearm comes down into the hanging hand.
 */
export function frontSweepArm(wrist: readonly [number, number]): MetalArm {
  const W: V3 = v3(-40, wrist[1], -wrist[0]);
  return BC_SWEEP_FINGERS_DOWN
    ? solveArmTo(BC_BODY, 'L', W, v3(0.4, 1, -0.3), v3(1, -0.4, 0), { out: 260, down: -60, back: 0 })
    : solveArmTo(BC_BODY, 'L', v3(30, wrist[1], -wrist[0]), v3(0.2, -1, 0), v3(1, 0.2, 0), { out: 120, down: 300, back: 80 });
}

/** The player for one view. `frontWrist`: (from the audience) the hand-drum hand's wrist on the page. */
export function bcFig(view: MetalView, frontWrist?: readonly [number, number]): MetalFig {
  return metalFig(`bc|${view}|${frontWrist ? frontWrist.map((x) => x.toFixed(1)).join(',') : '-'}`, view, () => ({
    b: BC_BODY,
    L: view === 'front' && frontWrist ? frontSweepArm(frontWrist) : sweepArm(),
    R: hangArm(BC_BODY, 'R', view === 'top'),
  }));
}
