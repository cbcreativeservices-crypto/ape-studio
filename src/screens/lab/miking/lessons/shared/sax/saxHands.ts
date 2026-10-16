/**
 * THE SAXOPHONIST'S HANDS ON THE KEYS (figure pass 3, owner 2026-10-15:
 * "check that the hand is correctly positioned, placed, bent, fingers and
 * digits accounted for"). Pure: no React, no Skia — the tests measure the
 * very hands SaxArt paints (PlayerFigure.drawHand3).
 *
 * The shared adult hand (players/handModel.ts), placed by the posture
 * (saxPosture.ts `hands`: the wrist, the way the hand points, its back, its
 * thumb — the joints the keep-outs use) and turned about its wrist until
 * every pad is on its key (the woodwinds' fit, windHands.fitHold):
 *   • the LEFT hand ABOVE the right, on the upper stack: its palm on the
 *     player's-left side of the body, the index, middle and ring fingers'
 *     pads on the B, A and G pearls, the little finger by the G♯ / low-key
 *     table, the thumb on its thumb rest at the back with its tip on the
 *     octave key;
 *   • the RIGHT hand on the lower stack: its palm on the player's-right side,
 *     the index, middle and ring pads on the F, E and D pearls, the little
 *     finger on the low C / E♭ keys, the thumb under the thumb hook at the
 *     back;
 *   • the wrists natural (within 64° of the forearm), the horn hanging on its
 *     strap at the player's right side.
 * The pearls, the low-key spatulas, the thumb hook and the octave thumb
 * button are the art's own parts (saxDraw.ts, SaxArt.tsx); the left little
 * finger's G♯ table is drawn where the finger falls (a touch, as a real
 * table's spatulas sit under it). Every hold dimension is a drawing default.
 */
import { h3, handFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { fitHold, PAD, type PadGoal } from '../woodwinds/windHands.ts';
import { lowSpatulaU, pearlStations } from './saxDraw.ts';
import { centre, onTube, saxPosture, tubeDir, type SaxPosture } from './saxPosture.ts';
import { ALTO, BARITONE, holesOf, pathOf, radiusAt, SOPRANO, TENOR } from './saxSpec.ts';

/** Where a digit plays on the horn: a point on (or off) the tube at u, `ang`° round from the front, `out` mm off its surface. */
export type SaxTouch = { u: number; ang: number; out: number; kind: 'pearl' | 'spatula' | 'table' | 'thumbButton' | 'hook' };
export type SaxHand = { sk: HandSkeleton; elbow: V3; touches: SaxTouch[]; thumb: SaxTouch; pads: (V3 | null)[]; u: number };

/** The places each digit plays (index … little, thumb). */
export function saxPlan(P: SaxPosture, side: 'L' | 'R'): { fingers: SaxTouch[]; thumb: SaxTouch } {
  const H = holesOf(P.row).filter((h) => h.on === 'body');
  const n = H.length;
  // The pearls (saxDraw.pearlsOf): 7 mm off the tube at −8°.
  const st = pearlStations(P.row);
  const pearl = (q: { u: number }): SaxTouch => ({ u: q.u, ang: -8, out: 7, kind: 'pearl' });
  if (side === 'L')
    return {
      fingers: [pearl(st.L[0]), pearl(st.L[1]), pearl(st.L[2]), { u: st.L[2].u + 26, ang: -58, out: 9, kind: 'table' }],
      // The octave thumb button at the back, over the thumb rest (SaxArt's `ob`).
      thumb: { u: H[n - 3].u + 8, ang: 186, out: 8, kind: 'thumbButton' },
    };
  // The low C / E♭ spatulas (SaxArt: from lowSpatulaU, at 112°, 10 mm out).
  const low = lowSpatulaU(P.row);
  const rt = H[3]?.u ?? low - 120;
  return {
    fingers: [pearl(st.R[0]), pearl(st.R[1]), pearl(st.R[2]), { u: low + 8, ang: 112, out: 10, kind: 'spatula' }],
    // Under the thumb hook (SaxArt: at H[3], 182°, leaning out toward the bell): the pad on the tube just below it.
    thumb: { u: rt + 18, ang: 180, out: 0, kind: 'hook' },
  };
}

/** A touch's top and its outward direction. */
export function saxTouchAt(P: SaxPosture, t: SaxTouch): { p: V3; m: V3 } {
  return { p: onTube(P, t.u, t.ang, t.out), m: tubeDir(P, t.u, t.ang) };
}

/** How deep a point lies inside the horn near u, or inside the player's chest (mm; > 0 inside). */
const runCache = new WeakMap<SaxPosture, Map<number, { A: V3; B: V3; a: number }[]>>();
/** The centre line ±160 mm about u, as 32 mm pieces (sampled once). */
function runNear(P: SaxPosture, u: number) {
  let m = runCache.get(P);
  if (!m) {
    m = new Map();
    runCache.set(P, m);
  }
  let r = m.get(u);
  if (!r) {
    const U = pathOf(P.row).U;
    r = [];
    for (let a = Math.max(0, u - 160); a < Math.min(U, u + 160); a += 32) r.push({ A: centre(P, a), B: centre(P, Math.min(U, a + 32)), a });
    m.set(u, r);
  }
  return r;
}
function depthIn(P: SaxPosture, u: number, p: V3, r: number): number {
  let worst = -Infinity;
  for (const { A, B, a } of runNear(P, u)) {
    const d = h3.sub(B, A);
    const t = Math.max(0, Math.min(1, h3.dot(h3.sub(p, A), d) / Math.max(1e-6, h3.dot(d, d))));
    const q = h3.add(A, h3.mul(d, t));
    worst = Math.max(worst, radiusAt(P.row, a + 32 * t) + r - h3.len(h3.sub(p, q)));
  }
  // The chest: two capsules ≈ 110 mm deep each side of the breastbone.
  const pl = P.player;
  for (const z of [-55, 55]) {
    const A = { x: pl.chest.x, y: pl.neck.y + 50, z };
    const B = { x: pl.pelvis.x, y: pl.pelvis.y - 60, z };
    const d = h3.sub(B, A);
    const t = Math.max(0, Math.min(1, h3.dot(h3.sub(p, A), d) / h3.dot(d, d)));
    worst = Math.max(worst, 110 + r - h3.len(h3.sub(p, h3.add(A, h3.mul(d, t)))));
  }
  return worst;
}

/** One hand solved (the posture's frame turned about its wrist; a reviewer's sweep may slide it). */
export function solveSaxHand(P: SaxPosture, side: 'L' | 'R', opts: { slide?: number; turn?: number } = {}): SaxHand {
  const hd = P.hands[side];
  const plan = saxPlan(P, side);
  const elbow = side === 'L' ? P.player.elbowL : P.player.elbowR;
  const goals: PadGoal[] = plan.fingers.map((t) => {
    const { p, m } = saxTouchAt(P, t);
    // A pearl is pressed with the pad's centre on it (≤ 2.5 mm); a spatula anywhere along its length; the table where the finger falls.
    return { target: h3.add(p, h3.mul(m, PAD)), m, max: t.kind === 'pearl' ? 2.5 : t.kind === 'table' ? 10 : 7 };
  });
  const tt = saxTouchAt(P, plan.thumb);
  const r = fitHold({ frame: handFrame(hd.wrist, hd.along, hd.dorsal, hd.thumbSide), elbow, fingers: goals, thumb: h3.add(tt.p, h3.mul(tt.m, plan.thumb.kind === 'hook' ? 7.5 : PAD)), depth: (p, rr) => depthIn(P, hd.u, p, rr), slide: opts.slide, turn: opts.turn });
  const padOf = (q: SaxTouch) => {
    const a = saxTouchAt(P, q);
    return h3.add(a.p, h3.mul(a.m, q.kind === 'hook' ? 7.5 : PAD));
  };
  let thumb = plan.thumb;
  let t = r.thumbTo(padOf(thumb));
  // The right thumb's hook is drawn where the thumb falls behind the F and E
  // keys (within 40 mm and 50° of its nominal place), as a real hook sits.
  if (thumb.kind === 'hook' && t.miss > 1)
    for (const du of [-40, -20, 0, 20, 40])
      for (const da of [-50, -25, 0, 25, 50]) {
        const cand = { ...thumb, u: plan.thumb.u + du, ang: plan.thumb.ang + da };
        const q = r.thumbTo(padOf(cand));
        if (q.miss < t.miss - 0.5) {
          t = q;
          thumb = cand;
        }
      }
  return { sk: { ...r.sk, thumb: t.digit, miss: [...r.sk.miss.slice(0, 4), t.miss] }, elbow, touches: plan.fingers, thumb, pads: r.pads, u: hd.u };
}

const cache = new WeakMap<SaxPosture, { L: SaxHand; R: SaxHand }>();
/** Both hands for a posture (solved once). */
export function saxHands(P: SaxPosture): { L: SaxHand; R: SaxHand } {
  let h = cache.get(P);
  if (!h) {
    h = { L: solveSaxHand(P, 'L'), R: solveSaxHand(P, 'R') };
    cache.set(P, h);
  }
  return h;
}

/** Every posed saxophone hand (the figure-anatomy ratchet): A05a–d, standing and seated. */
export function handCases(): { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb: string }[] {
  const out: { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb: string }[] = [];
  for (const [id, row] of [['A05a soprano', SOPRANO], ['A05b alto', ALTO], ['A05c tenor', TENOR], ['A05d baritone', BARITONE]] as const)
    for (const kind of ['standing', 'seated'] as const) {
      const h = saxHands(saxPosture(row, kind));
      out.push({ name: `${id} ${kind} left`, sk: h.L.sk, elbow: h.L.elbow, contact: [0, 1, 2, 3, 4], thumb: 'on the thumb rest, its tip on the octave key' });
      out.push({ name: `${id} ${kind} right`, sk: h.R.sk, elbow: h.R.elbow, contact: [0, 1, 2, 3, 4], thumb: 'under the thumb hook' });
    }
  return out;
}
