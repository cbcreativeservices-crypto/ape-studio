/**
 * THE ENSEMBLE PLAYERS' ARMS AND HANDS ON THEIR INSTRUMENTS (Miking figure
 * pass 3, owner 2026-10-15: "a separate pass … looking at all string
 * instruments that have a neck or wind instruments with keys to check that the
 * hand is correctly positioned, placed, bent, fingers and digits accounted
 * for"). Pure: no React, no Skia — SeatingArt.tsx and BandArt.tsx draw these
 * very hands (PlayerFigure.drawHand3) and the tests measure them (handCases).
 *
 * ONE HOLD PER INSTRUMENT, IN THE PLAYER'S OWN FRAME. Every ensemble player
 * of a kind holds the instrument the same way, so the hold is solved once, in
 * the player's frame — x to the player's RIGHT, y UP from the floor the player
 * sits or stands on, z FORWARD (mm; the same numbers as SeatingArt's
 * Q(right, fwd, up)) — and every view (the plan, the hall, the section) is a
 * projection of it: the hands sit on the instrument from every side.
 *
 * Each arm: the shoulder joint, the ELBOW solved for an adult arm (upper arm
 * 305 mm, forearm 255 mm) toward its pole, the wrist, and the hand
 * (handModel.handOn / fitHand) with every pad that plays ON what it plays —
 * a string at its stop, a key, a valve button, the bow's stick — and the
 * thumb where the technique puts it (behind the neck, under the frog, on the
 * thumb rest, under the leadpipe).
 *
 * The brass elbows HANG (figure review 2026-10-15 open item: the trumpet and
 * trombone hold points put the elbows at shoulder height): the horn is held up
 * to the lips by the hands, the upper arms down beside the body.
 */
import { curled, fitHand, h3, handFrame, handOn, HAND, jointBendsDeg, reachThumb, thumbJoints, THUMB_REST, v3, wristBendDeg, type DigitGoal, type HandFrame, type HandSkeleton, type ThumbGoal, type ThumbPose, type V3 } from '../players/handModel.ts';
import { BASS_34, BOWED, fbHalf, fingerboardZ, stationsOf, stringZ, type BowedSpec } from '../bowed/bowedSpec.ts';
import { GUITAR_POSE, type GuitarKind } from './bandStage.ts';

const { add, sub, mul, dot, len, unit } = h3;
/** A point in the player's frame, written as SeatingArt writes it: Q(right, fwd, up). */
export const L3 = (right: number, fwd: number, up: number): V3 => v3(right, up, fwd);
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));

/** The adult arm (mm, joint to joint): the house figure's. */
export const ARM3 = { upper: 305, fore: 255 } as const;
/** The shoulder joints (seated: the shoulder line at 1050, the joints 40 below it; standing 1450). */
export const SHOULDER = { seated: 1010, standing: 1410, half: 200 } as const;

/** The elbow of an arm from the shoulder S to the wrist W, bent toward `pole`
 *  (an adult arm; a wrist out of reach leaves the arm straight toward it). */
export function elbowOf(S: V3, W: V3, pole: V3): V3 {
  const U = ARM3.upper;
  const F = ARM3.fore;
  const d = sub(W, S);
  const L = Math.min(len(d), U + F - 1);
  const u = unit(d);
  const a = (U * U - F * F + L * L) / (2 * L);
  const hh = Math.sqrt(Math.max(0, U * U - a * a));
  const q = unit(sub(pole, mul(u, dot(pole, u))));
  return add(add(S, mul(u, a)), mul(q, hh));
}
/** How far the upper arm hangs below the horizontal (degrees). */
export const upperArmDropDeg = (S: V3, E: V3): number => (Math.asin(Math.max(-1, Math.min(1, (S.y - E.y) / (len(sub(E, S)) || 1)))) * 180) / Math.PI;

/** WHICH HAND a skeleton is. The player's frame (x right, y up, z forward) is
 *  left-handed, so a RIGHT hand's (along × toward-the-little-finger) lies
 *  along its back (the dorsal side): + for a right hand, − for a left. */
export const chirality = (sk: HandSkeleton): number => Math.sign(dot(cross(sk.frame.x, sk.frame.y), sk.frame.z));

/** A whole skeleton moved by d (a standing player playing a seated part: the horn 400 mm higher). */
function shiftSk(sk: HandSkeleton, d: V3): HandSkeleton {
  const mv = (p: V3) => add(p, d);
  const dg = (g: HandSkeleton['thumb']) => ({ ...g, joints: g.joints.map(mv) });
  return { ...sk, frame: { ...sk.frame, o: mv(sk.frame.o) }, fingers: sk.fingers.map(dg), thumb: dg(sk.thumb), palm: sk.palm.map(mv) };
}

/** A hand fitted to its pads quickly: the frame turned (handModel.fitHand)
 *  with the thumb at rest, then the thumb solved onto its own target — or
 *  onto the best of several (the places along the neck or the key work the
 *  thumb may rest: the one it reaches). */
function fit(start: HandFrame, fingers: readonly DigitGoal[], thumb: ThumbGoal | V3[], o: { curl?: number; dipRatio?: number; keep?: (f: HandFrame) => number; slide?: number } = {}): HandSkeleton {
  const sk = fitHand(start, fingers, THUMB_REST, { maxWrist: 66, ...o });
  if (!Array.isArray(thumb)) return handOn(sk.frame, fingers, thumb, o.dipRatio);
  // The thumb tries the few places nearest where it rests (a full solve each).
  const rest = thumbJoints(sk.frame, THUMB_REST).joints[3];
  const order = [...thumb].sort((p, q) => len(sub(p, rest)) - len(sub(q, rest)));
  let best = order[0];
  let bm = Infinity;
  for (let i = 0; i < order.length; i++) {
    // (The rest only when the nearest five leave the thumb off its place.)
    if (i >= 5 && bm <= 2.5) break;
    const m = reachThumb(sk.frame, order[i]).miss;
    if (m < bm - 0.05) {
      bm = m;
      best = order[i];
    }
  }
  return handOn(sk.frame, fingers, best, o.dipRatio);
}
/** Places round p: p + i·s·u + j·s·w (i, j = −n … n). */
const around = (p: V3, u: V3, w: V3, s: number, n = 2): V3[] => {
  const out: V3[] = [p];
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) if (i || j) out.push(add(p, add(mul(u, i * s), mul(w, j * s))));
  return out;
};
/** A `keep` that holds the hand near its starting orientation (it may roll and lean a little). */
const near = (f0: HandFrame, k = 2500) => (g: HandFrame) => k * (1 - dot(g.x, f0.x)) + k * (1 - dot(g.z, f0.z));

export type Arm3 = {
  side: 'L' | 'R';
  shoulder: V3;
  elbow: V3;
  /** The wrist (= sk.frame.o): the sleeve ends here. */
  wrist: V3;
  sk: HandSkeleton;
  /** The digits that must touch what they play (0 index … 3 little, 4 thumb). */
  contact: number[];
  /** Where the thumb is ('behind' the neck, under the frog, on the thumb rest …). */
  thumb: string;
  /** A point of the instrument the hand holds: the hand is split at the plane
   *  through it facing the viewer (what lies beyond it is painted behind the instrument). */
  at: V3;
  /** Hidden from every side (the horn player's right hand inside the bell). */
  hidden?: boolean;
};
export type Hold = {
  L: Arm3 | null;
  R: Arm3 | null;
  /** Instrument points the drawings take from the hold (a bow's frog and tip, a pick). */
  pts?: Record<string, V3>;
};

/**
 * THE ELBOW of an arm whose hand is placed: of every elbow an adult arm allows
 * (turned round the shoulder–wrist line), the one that keeps the wrist
 * straightest — the forearm in line with the hand — outside the body, on its
 * own side, below the shoulder; `drop` asks the upper arm to hang that many
 * degrees below the horizontal (the brass: the elbows beside the body).
 */
export function bestElbow(S: V3, W: V3, along: V3, side: number, o: { drop?: number; dropW?: number; high?: boolean; outboard?: number } = {}): V3 {
  const u = unit(sub(W, S));
  let p1 = cross(u, v3(0, 1, 0));
  if (len(p1) < 1e-3) p1 = v3(1, 0, 0);
  p1 = unit(p1);
  const p2 = unit(cross(u, p1));
  let best = elbowOf(S, W, v3(side * 0.3, -1, 0));
  let bc = Infinity;
  for (let i = 0; i < 72; i++) {
    const th = (i / 72) * Math.PI * 2;
    const E = elbowOf(S, W, add(mul(p1, Math.cos(th)), mul(p2, Math.sin(th))));
    const fore = unit(sub(W, E));
    const wb = (Math.acos(Math.max(-1, Math.min(1, dot(fore, along)))) * 180) / Math.PI;
    const drop = upperArmDropDeg(S, E);
    let c = 0.02 * wb * wb + (wb > 60 ? 60 * (wb - 60) ** 2 : 0);
    if (!o.high && drop < 0) c += 300 * drop * drop;
    if (o.drop !== undefined) c += (o.dropW ?? 2) * (drop - o.drop) ** 2;
    // Never inside the chest or behind the back; on its own side of the body.
    if (Math.abs(E.x) < 196 && E.z > -125 && E.z < 122 && E.y > S.y - 560) c += 5e4;
    if (side * E.x < 40) c += 30 * (40 - side * E.x) ** 2;
    // …and never winged out far past the shoulder.
    const wing = side * E.x - (SHOULDER.half + 90);
    if (wing > 0) c += 0.1 * wing * wing;
    // (`outboard`: beside the body — at least this far outside the shoulder joint.)
    if (o.outboard !== undefined) {
      const ob = side * E.x - (SHOULDER.half + o.outboard);
      if (ob < 0) c += 2 * ob * ob;
    }
    if (c < bc) {
      bc = c;
      best = E;
    }
  }
  return best;
}
function arm(side: 'L' | 'R', S: V3, sk: HandSkeleton, contact: number[], thumb: string, at: V3, o: { drop?: number; dropW?: number; high?: boolean; outboard?: number } = {}): Arm3 {
  const wrist = sk.frame.o;
  return { side, shoulder: S, elbow: bestElbow(S, wrist, sk.frame.x, side === 'L' ? -1 : 1, o), wrist, sk, contact, thumb, at };
}
const shoulders = (standing: boolean) => {
  const y = standing ? SHOULDER.standing : SHOULDER.seated;
  return { L: v3(-SHOULDER.half, y, 0), R: v3(SHOULDER.half, y, 0) };
};

/* ═══════════════ a NECK: fretted or stopped ═══════════════ */

/** A neck in the player's frame: `o` the board's face on its center line at
 *  the hand's middle stop; `a` toward the headstock or scroll; `e` across the
 *  board toward the edge the fingers come over; `n` out of the board's face
 *  (the strings' side). Stops along `a` from `o` (index first, toward the
 *  headstock), the board's half-width, the strings, the neck's depth behind
 *  the face, where each finger presses (`press`: [stop, string from the far
 *  edge 0 … 1]) and how the hand leans (`lean`: along = a·k0 − e·k1 + n·k2). */
type Neck = { o: V3; a: V3; e: V3; n: V3; stops: number[]; half: number; strings: number; depth: number; press: readonly (readonly [number, number])[]; lean: readonly [number, number, number]; thumbOver?: boolean; padD?: number; knuckleUp?: number; edge?: number };

/**
 * THE FRETTING / STOPPING HAND (handPoses.fretFront's recipe, in 3-D): the
 * knuckle row 28 mm beyond the near edge, level with the board's face; the
 * hand leaning up toward the strings' side; each finger rising over the edge
 * and its pad coming down onto its string just behind its stop (index nearest
 * the headstock); the thumb behind the neck opposite the index and middle
 * fingers — its tip just over the far edge on a steel-string guitar.
 */
function neckHand(nk: Neck): HandSkeleton {
  const at = (s: number, w: number, d: number) => add(nk.o, add(mul(nk.a, s), add(mul(nk.e, w), mul(nk.n, d))));
  const stringW = (f: number) => {
    const t = nk.strings <= 1 ? 0.5 : Math.round(f * (nk.strings - 1)) / (nk.strings - 1);
    return -nk.half * 0.8 + t * nk.half * 1.6;
  };
  const pads = nk.press.map(([st, f]) => at(nk.stops[st], stringW(f), nk.padD ?? 9.5));
  const mid = nk.stops.reduce((s, x) => s + x, 0) / nk.stops.length;
  const knuckles = at(mid, nk.half + (nk.edge ?? 28), nk.knuckleUp ?? 0);
  const [k0, k1, k2] = nk.lean;
  const along = unit(add(mul(nk.a, k0), add(mul(nk.e, -k1), mul(nk.n, k2))));
  const wrist = sub(knuckles, mul(along, HAND.fingers[1].mcp.x - 4));
  // The back of the hand toward the near edge's side and the strings' face.
  const dorsal = add(mul(nk.e, dot(along, nk.n)), mul(nk.n, -dot(along, nk.e)));
  const f0 = handFrame(wrist, along, dorsal, nk.a);
  const s01 = (nk.stops[0] + nk.stops[1]) / 2;
  // The thumb's pad on the back of the neck behind the index and middle
  // fingers (or its tip just over the far edge): the place there it reaches.
  const thumb = nk.thumbOver ? around(at(s01 + 6, -nk.half - 3, -nk.depth * 0.4), nk.a, nk.n, 7) : around(at(s01 + 6, -nk.half * 0.1, -nk.depth - 11), nk.a, nk.e, 7);
  return fit(f0, pads, thumb, { curl: 1.3, dipRatio: 0.7, keep: near(f0, 3000) });
}

/* ═══════════════ the BOW HOLD ═══════════════ */

/**
 * THE BOW HOLD at the frog: the hand pronated over the stick, its back up, the
 * fingers draped over the stick toward the far side, leaning toward the tip;
 * the stick under the index's and middle's middle joints; the thumb bent, its
 * tip under the stick at the frog, opposite the middle finger; the little
 * finger's tip ON TOP of the stick (violin, viola) — rounder, down on the
 * stick's far side (cello, bass). `c` the grip point on the stick, `b` the
 * stick toward the tip, `out` across it away from the player's body, `up`.
 */
function bowHand(c: V3, b: V3, out0: V3, up0: V3, stickR: number, round: boolean): HandSkeleton {
  const out = unit(sub(out0, mul(b, dot(out0, b))));
  const up = unit(sub(up0, add(mul(b, dot(up0, b)), mul(out, dot(up0, out)))));
  const P = (tb: number, to: number, tu: number) => add(c, add(mul(b, tb), add(mul(out, to), mul(up, tu))));
  const pad = 8;
  const fingers: DigitGoal[] = [
    P(30, stickR + pad * 0.6, -stickR - pad * 0.7), // index: draped over, its pad on the far side, toward the tip
    P(10, stickR + pad * 0.7, -stickR - pad * 0.6), // middle: opposite the thumb
    P(-10, stickR + pad * 0.8, -stickR - pad * 0.3), // ring: on the frog's far side
    round ? P(-28, stickR + pad * 0.6, -pad * 0.2) : P(-28, -1, stickR + pad), // little: on top (violin), or round on the far side
  ];
  const thumb = around(P(9, -stickR * 0.4, -stickR - 8.5), b, out, 3.5, 3);
  // The hand's frame: from the wrist (toward the body, above the stick) over
  // the stick and down its far side, leaning toward the tip; its back up.
  const along = unit(add(mul(out, 0.8), add(mul(up, -0.42), mul(b, 0.38))));
  const knuckles = P(-6, -14, stickR + 16);
  const wrist = sub(knuckles, mul(along, HAND.fingers[1].mcp.x - 4));
  const dorsal = unit(add(mul(up, 0.85), mul(out, 0.42)));
  const f0 = handFrame(wrist, along, dorsal, b);
  return fit(f0, fingers, thumb, { curl: round ? 1.0 : 0.8, dipRatio: 0.6, keep: near(f0, 1500), slide: 30 });
}

/* ═══════════════ a KEYED WIND held in both hands ═══════════════ */

/**
 * A HAND ON A KEYED WIND's body (clarinet, oboe, bassoon, saxophone): the
 * hand comes from its own side of the body (`side`, unit, out of the body
 * toward that hand), the fingers across the front, their pads on the keys or
 * holes of the front face (`front`), the thumb on the back (the thumb rest,
 * the octave or register key); the index nearest the mouthpiece (`toMouth`).
 * `top` a point on the body's axis, `a` down the body (away from the
 * mouthpiece), holes (index, middle, ring) at those distances along `a`, the
 * little finger on its side key `little` further on, the thumb at `thumbAt`.
 */
function windHand(top: V3, a: V3, front: V3, side: V3, r: number, holes: readonly number[], little: number, thumbAt: number, rise = 0): HandSkeleton {
  const fr = unit(sub(front, mul(a, dot(front, a))));
  const sd = unit(sub(side, add(mul(a, dot(side, a)), mul(fr, dot(side, fr)))));
  const ax = (s: number, w: number, f: number) => add(top, add(mul(a, s), add(mul(sd, w), mul(fr, f))));
  const pad = 8;
  const fingers: DigitGoal[] = [...holes.map((s) => ax(s, -r * 0.1, r + pad * 0.9)), ax(little, r * 0.62, (r + pad) * 0.8)];
  const thumb = around(ax(thumbAt, r * 0.15, -r - pad), a, sd, 7);
  const mid = (holes[0] + holes[2]) / 2;
  const knuckles = ax(mid, r + 24, r * 0.55);
  // (`rise`: the hand leans up toward the mouthpiece — a left hand reaching across to the upper stack.)
  const along = unit(add(mul(sd, -0.62), add(mul(fr, 0.72), mul(a, 0.1 - rise))));
  const wrist = sub(knuckles, mul(along, HAND.fingers[1].mcp.x - 4));
  const d0 = add(mul(sd, 0.72), mul(fr, 0.62));
  const dorsal = unit(sub(d0, mul(along, dot(d0, along))));
  const f0 = handFrame(wrist, along, dorsal, mul(a, -1));
  return fit(f0, fingers, thumb, { curl: 1.0, dipRatio: 0.65, keep: near(f0, 1200), slide: 25 });
}

/* ═══════════════ the holds ═══════════════ */

const DEG = Math.PI / 180;

/** A bowed instrument's points in the player's frame (frame B: x along the
 *  axis from the bridge toward the scroll, y across, z out of the top). */
function bowedFrame(spec: BowedSpec, tail: V3, d: V3, roll: number, sideHint: V3) {
  const st = stationsOf(spec);
  const n0 = unit(sub(v3(0, 1, 0), mul(d, d.y)));
  // The board's face toward the player's front when the axis stands upright (cello, bass).
  const nUp = Math.abs(d.y) > 0.8 ? unit(sub(v3(0, 0, 1), mul(d, d.z))) : n0;
  let s0 = unit(cross(d, nUp));
  if (dot(s0, sideHint) < 0) s0 = mul(s0, -1);
  const n = unit(add(mul(nUp, Math.cos(roll)), mul(s0, Math.sin(roll))));
  const s = unit(sub(mul(s0, Math.cos(roll)), mul(nUp, Math.sin(roll))));
  const B = (x: number, y = 0, z = 0) => add(tail, add(mul(d, x - st.tailX), add(mul(s, y), mul(n, z))));
  return { st, n, s, B };
}

/** The bowed instruments as SeatingArt draws them (Q(right, fwd, up)): the
 *  violin and viola under the chin, the cello between the knees, the bass
 *  standing at the player's left front. */
export const BOWED_POSE = {
  violin: { tail: L3(-60, 40, 1060), d: unit(L3(-Math.sin(38 * DEG), Math.cos(38 * DEG), 0.12)) },
  viola: { tail: L3(-60, 40, 1060), d: unit(L3(-Math.sin(38 * DEG), Math.cos(38 * DEG), 0.12)) },
  // Upright (figure pass 3): the cello's back against the chest at the upper
  // bout, leaning ≈ 17° back and a little left so the neck passes the left
  // ear in front of the shoulder (the old axis leaned 19° back from 330 mm
  // ahead and ran the neck through the chest).
  cello: { tail: L3(0, 400, 120), d: unit(L3(-0.22, -0.242, 0.945)) },
  // The bass (the 3/4 orchestra size, BASS_34 — lab art fix 2026-10-16)
  // standing at the player's left front, leaning ≈ 13° back toward the player,
  // its ENDPIN ON THE FLOOR: the tail block where the endpin and its collar
  // (mounted at the rib's middle) reach the boards, so the bridge is at the top of the thigh and the nut
  // at eye level (the old pose hung a full-size bass from its bridge at
  // 830 mm: the endpin 70 mm off the floor and the scroll 2.26 m up).
  bass: { tail: L3(-40, 560, ((BASS_34.endpin?.mm ?? 0) + (BASS_34.collar?.mm ?? 0)) * 0.975 + (BASS_34.rib.mm / 2) * 0.21), d: unit(L3(-0.07, -0.21, 0.975)) },
} as const;

/** A bowed instrument's frame as the hold poses it (the drawings use the same
 *  one, so the hands sit on the drawn board): frame-B (x along, y across to the
 *  highest string, z out of the top) into the player's frame. */
export function bowedFrameOf(k: 'violin' | 'viola' | 'cello' | 'bass') {
  const spec = ensembleBowed(k);
  const P0 = BOWED_POSE[k];
  const under = k === 'violin' || k === 'viola';
  return { spec, d: P0.d, ...bowedFrame(spec, P0.tail, P0.d, under ? 28 * DEG : 0, v3(1, 0, 0)) };
}

/** The spec the ensembles draw and pose (the bass is the 3/4 size). */
export const ensembleBowed = (k: 'violin' | 'viola' | 'cello' | 'bass'): BowedSpec => (k === 'bass' ? BASS_34 : BOWED[k]);

/** An upright instrument's neck as the hands see it (the drawings follow
 *  it): the fingerboard's face from the neck's heel to the nut — raised off
 *  the top plate by the board's height — and the scroll beyond. */
export function boardLine(k: 'cello' | 'bass'): { heel: V3; nut: V3; scroll: V3 } {
  const spec = ensembleBowed(k);
  const P0 = BOWED_POSE[k];
  const { st, B } = bowedFrame(spec, P0.tail, P0.d, 0, v3(1, 0, 0));
  return { heel: B(st.neckX, 0, fingerboardZ(spec, st.neckX)), nut: B(st.nutX, 0, fingerboardZ(spec, st.nutX)), scroll: B(st.scrollX, 0, fingerboardZ(spec, st.nutX) * 0.6) };
}

function bowedHold(k: 'violin' | 'viola' | 'cello' | 'bass', plucked: boolean): Hold {
  const spec = ensembleBowed(k);
  const P0 = BOWED_POSE[k];
  const under = k === 'violin' || k === 'viola';
  const standing = k === 'bass';
  const S = shoulders(standing);
  // Under the chin the top faces up, rolled ≈ 28° toward the E string (the
  // player's right); upright the top faces the audience.
  const { st, n, s, B } = bowedFrame(spec, P0.tail, P0.d, under ? 28 * DEG : 0, under ? v3(1, 0, 0) : v3(1, 0, 0));
  // Stops (mm below the nut): first position, a finger a tone or a semitone apart.
  const L = spec.string.mm;
  // (The bass in third position — the hand at the player's face — index, middle, and the ring and little fingers together a tone above.)
  const semis = under ? [2, 4, 5, 7] : k === 'cello' ? [2, 3, 4, 5] : [5, 5.8, 6.5, 7];
  const stopX = semis.map((q) => st.nutX - L * (1 - Math.pow(2, -q / 12)));
  const midX = (stopX[0] + stopX[3]) / 2;
  const fz = fingerboardZ(spec, midX);
  const half = fbHalf(spec, midX);
  // Under the chin the knuckles sit along the E-string side a little above
  // the board, the hand reaching ACROSS it and the fingers arching over and
  // DOWN onto the strings — the palm toward the neck, the backs of the curled
  // fingers toward the audience, never an open palm raised (lead review
  // 2026-10-15); upright over the player's left edge.
  const e = under ? s : mul(s, -1);
  // Upright, the knuckles stand out in front of the board's left edge and the
  // fingers arch back DOWN onto the strings (the backs of the curled fingers
  // toward the audience, not a spread hand).
  const lean: [number, number, number] = under ? [0.15, 0.85, 0.5] : k === 'cello' ? [0.15, 0.9, 0.4] : [0.3, 0.8, 0.5];
  const kUp = under ? 22 : k === 'cello' ? 20 : 0;
  const edge = under ? 28 : k === 'cello' ? 18 : 10;
  const lsk = neckHand({ o: B(midX, 0, fz), a: P0.d, e, n, stops: stopX.map((x) => x - midX), half, strings: 4, depth: under ? 22 : k === 'cello' ? 38 : 52, press: under ? [[0, 0.67], [1, 0.67], [2, 0.33], [3, 0.33]] : [[0, 0.33], [1, 0.33], [2, 0.33], [3, 0.67]], lean, padD: (stringZ(spec, midX) - fz) + 7, knuckleUp: kUp, edge });
  // (Upright, the left elbow is held up and out — the cellist's and bassist's arm.)
  const left = arm('L', S.L, lsk, [0, 1, 2, 3, 4], 'behind', B(midX, 0, fz), under ? {} : { high: true });
  // The bow: its grip point (the frog), the stick toward the contact point.
  const contact = B(st.contactX, 0, stringZ(spec, st.contactX));
  const frog = under ? L3(230, 225, 985) : k === 'cello' ? L3(320, 330, 560) : L3(300, 400, 740);
  if (plucked) {
    // Pizzicato (a jazz or folk bass): the index and middle fingers pull the
    // strings over the fingerboard's end, the thumb anchored on the board's edge.
    const x = st.fbEndX + 40;
    const pz = fingerboardZ(spec, x);
    const ph = fbHalf(spec, x);
    const pads: DigitGoal[] = [B(x + 10, ph * 0.25, stringZ(spec, x) + 6), B(x - 18, ph * 0.55, stringZ(spec, x) + 6), { curl: 0.55 }, { curl: 0.6 }];
    const thumbT = B(x + 30, -ph - 6, pz - 6);
    const along = unit(add(mul(s, -0.85), add(mul(n, 0.25), mul(P0.d, -0.45))));
    const kn = B(x - 4, ph + 30, pz + 30);
    const f0 = handFrame(sub(kn, mul(along, 92)), along, unit(add(mul(n, 0.9), mul(s, 0.3))), P0.d);
    const rsk = fit(f0, pads, thumbT, { curl: 0.8, keep: near(f0, 800), slide: 40 });
    return { L: left, R: arm('R', S.R, rsk, [0, 1], 'on the board’s edge', B(x, 0, pz)), pts: { contact } };
  }
  const b = unit(sub(contact, frog));
  const out = under ? v3(0.15, 0, 1) : v3(0.05, 0, 1);
  const stickR = k === 'violin' || k === 'viola' ? 4 : 5;
  const rsk = bowHand(frog, b, out, v3(0, 1, 0), stickR, !under);
  const tip = add(frog, mul(b, spec.bow.mm - 20));
  return { L: left, R: arm('R', S.R, rsk, [1, 3, 4], 'under the frog', frog, { drop: under ? 30 : 50, dropW: 1 }), pts: { frog, tip, contact } };
}

/** A guitar-family instrument held face-on (bandStage.GUITAR_POSE, or the
 *  big band's archtop): its tail, the axis rising to the player's left, the
 *  top facing forward. */
type GuitarLike = { lean?: [number, number, number]; tail: V3; a: V3; face: number; L: number; neck: number; half: number; strings: number; thumbOver: boolean; fret: number; pick: { s: number; t: number }; lower: number };
const GUITARS: Record<GuitarKind | 'archtop', GuitarLike> = (() => {
  const of = (k: GuitarKind, half: number, strings: number, thumbOver: boolean, fret: number): GuitarLike => {
    const G = GUITAR_POSE[k];
    const an = G.ang * DEG;
    return { tail: L3(G.tailR, G.fwd, G.tailUp), a: v3(-Math.cos(an), Math.sin(an), 0), face: G.fwd, L: G.L, neck: G.neck, half, strings, thumbOver, fret, pick: { s: G.L * 0.55, t: -0.3 }, lower: { eguitar: 165, ebass: 175, aguitar: 200, mandolin: 125 }[k] };
  };
  const an = Math.atan2(170, 460);
  return {
    eguitar: { ...of('eguitar', 22, 6, false, 30), lean: [0.35, 0.4, 0.85] },
    // (Far out along a long neck the hand turns toward it with the forearm.)
    ebass: { ...of('ebass', 24, 4, false, 31), lean: [0.72, 0.3, 0.63] },

    // (On the thigh the neck is low: the hand reaches it from above, so it leans less.)
    aguitar: { ...of('aguitar', 24, 6, false, 28), lean: [0.3, 0.12, 0.95] },
    mandolin: of('mandolin', 15, 4, false, 20),
    // The big band's archtop on the lap (SeatingArt 'guitar'): the body at
    // Q(60, 170, 700), the neck from Q(−100, 180, 760) to Q(−560, 170, 930).
    archtop: { tail: L3(250, 170, 630), a: unit(v3(-Math.cos(an), Math.sin(an), 0)), face: 170, L: 380, neck: 470, half: 22, strings: 6, thumbOver: false, fret: 30, pick: { s: 200, t: -0.25 }, lower: 190 },
  };
})();

function guitarHold(k: GuitarKind | 'archtop'): Hold {
  const G = GUITARS[k];
  const standing = k === 'eguitar' || k === 'ebass';
  const S = shoulders(standing);
  const a = G.a;
  const top = v3(a.y, -a.x, 0); // toward the board's top edge (the player's face)
  const e = mul(top, -1); // the bottom edge: the fingers come over it
  const n = v3(0, 0, 1);
  const face = G.face + 6;
  const sF = G.L + G.neck * 0.55;
  const o = add(add(G.tail, mul(a, sF)), v3(0, 0, face - G.tail.z));
  const sp = G.fret;
  const lsk = neckHand({ o, a, e, n, stops: [1.5 * sp, 0.5 * sp, -0.5 * sp, -1.5 * sp], half: G.half, strings: G.strings, depth: k === 'ebass' ? 24 : 22, press: [[0, 0.8], [1, 0.4], [2, 0.6], [3, 0.2]], lean: G.lean ?? [0.15, 0.4, 0.9], thumbOver: G.thumbOver });
  // (The thumb behind the neck, opposite the index and middle fingers.)
  const left = arm('L', S.L, lsk, [0, 1, 2, 3, 4], G.thumbOver ? 'over the top edge' : 'behind', o);
  // The right hand over the strings: a pick between the thumb and the index
  // (a bass: the index and middle fingers plucking, the thumb on the pickup).
  const pk = add(add(G.tail, mul(a, G.pick.s)), add(mul(top, G.pick.t * G.lower), v3(0, 0, face - G.tail.z)));
  const down = unit(add(mul(e, 0.75), mul(a, 0.35)));
  if (k === 'ebass') {
    const pads: DigitGoal[] = [add(pk, add(mul(top, -8), v3(0, 0, 8))), add(pk, add(mul(top, -20), add(mul(a, -14), v3(0, 0, 8)))), { curl: 0.55 }, { curl: 0.6 }];
    const thumbT = add(pk, add(mul(top, 30), add(mul(a, 30), v3(0, 0, 9))));
    const along = unit(add(down, v3(0, 0, -0.35)));
    const f0 = handFrame(sub(add(pk, v3(0, 0, 30)), mul(along, 150)), along, unit(add(v3(0, 0, 1), mul(top, 0.3))), a);
    const rsk = fit(f0, pads, thumbT, { curl: 0.9, keep: near(f0, 800), slide: 45 });
    return { L: left, R: arm('R', S.R, rsk, [0, 1], 'on the pickup', pk, { drop: 55, dropW: 1 }), pts: { pick: pk } };
  }
  // A pick held between the thumb's pad and the side of the index's last bone.
  const along = unit(add(down, v3(0, 0, -0.25)));
  // The back of the hand toward the audience and up, the thumb on top (toward the neck).
  const f0 = handFrame(add(sub(pk, mul(down, 118)), v3(0, 0, 34)), along, unit(add(v3(0, 0, 0.8), mul(top, 0.75))), a);
  // A loose fist: the fingers curled under the index, not folded into the palm.
  const fingers: DigitGoal[] = [{ abd: -0.05, mcp: 0.6, pip: 1.35, dip: 0.55 }, { abd: 0, mcp: 0.7, pip: 1.3, dip: 0.8 }, { abd: 0.06, mcp: 0.75, pip: 1.3, dip: 0.8 }, { abd: 0.14, mcp: 0.8, pip: 1.3, dip: 0.8 }];
  const sk0 = handOn(f0, fingers);
  const ix = sk0.fingers[0].joints;
  const onIdx = add(lerp3(ix[2], ix[3], 0.45), mul(f0.y, -HAND.fingers[0].r[2] - 2));
  const rsk = handOn(f0, fingers, add(onIdx, mul(f0.y, -9)));
  const pickC = add(onIdx, mul(f0.y, -4));
  const pickTip = add(pickC, mul(unit(add(mul(f0.z, -0.55), mul(f0.x, 0.55))), 20));
  return { L: left, R: arm('R', S.R, rsk, [4], 'on the pick', pk, { drop: 55, dropW: 1 }), pts: { pick: pickC, pickTip } };
}

/** The keyed winds as SeatingArt draws them (Q(right, fwd, up), seated). */
export const WIND = {
  // The clarinet and oboe from the lips down and forward.
  reed: { top: L3(0, 120, 1150), end: L3(0, 520, 640) },
  // (Held clear of the chest: the wing joint ≈ 150 mm in front of it.)
  bassoon: { boot: L3(160, 250, 520), bell: L3(-190, 200, 1740), bocal: L3(-9, 200, 1120) },
  sax: { top: L3(30, 170, 1060), bow: L3(120, 210, 560) },
  bariSax: { top: L3(30, 170, 1090), bow: L3(150, 240, 270) },
  tenorSax: { top: L3(60, 190, 1330), bow: L3(140, 230, 640) },
} as const;

function reedHold(k: 'oboe' | 'clarinet'): Hold {
  const S = shoulders(false);
  const { top, end } = WIND.reed;
  const a = unit(sub(end, top));
  const L = len(sub(end, top));
  const r = k === 'clarinet' ? 14 : 12;
  const front = v3(0, 0.62, 0.79); // the holes face away from the player
  const lsk = windHand(top, a, front, v3(-1, 0, 0), r, [0.2 * L, 0.2 * L + 26, 0.2 * L + 52], 0.2 * L + 76, 0.2 * L + 6);
  const rsk = windHand(top, a, front, v3(1, 0, 0), r, [0.55 * L, 0.55 * L + 26, 0.55 * L + 52], 0.55 * L + 76, 0.55 * L - 10);
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'on the thumb hole and register key', add(top, mul(a, 0.2 * L + 26))),
    R: arm('R', S.R, rsk, [0, 1, 2, 4], 'under the thumb rest', add(top, mul(a, 0.55 * L + 26))),
  };
}

function bassoonHold(): Hold {
  const S = shoulders(false);
  const { boot, bell } = WIND.bassoon;
  // Down the body from the wing joint toward the boot (index nearest the bocal).
  const a = unit(sub(boot, bell));
  const L = len(sub(boot, bell));
  const front = v3(0, 0, 1);
  const r = 22;
  const lsk = windHand(bell, a, front, v3(-0.8, 0, -0.2), r, [0.58 * L, 0.58 * L + 30, 0.58 * L + 60], 0.58 * L + 88, 0.58 * L + 20);
  const rsk = windHand(bell, a, front, v3(0.8, 0, -0.2), r, [0.8 * L, 0.8 * L + 30, 0.8 * L + 60], 0.8 * L + 88, 0.8 * L + 20);
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'on the wing joint’s thumb keys', add(bell, mul(a, 0.58 * L + 30))),
    R: arm('R', S.R, rsk, [0, 1, 2, 4], 'on the boot’s thumb keys', add(bell, mul(a, 0.8 * L + 30))),
  };
}

function saxHold(k: 'sax' | 'bariSax' | 'tenorSax'): Hold {
  const S = shoulders(k === 'tenorSax');
  const { top, bow } = WIND[k];
  const a = unit(sub(bow, top));
  const L = len(sub(bow, top));
  const r = k === 'bariSax' ? 30 : k === 'tenorSax' ? 24 : 20;
  // The pearls face forward and a little to the left (the body hangs at the player's right).
  const front = v3(-0.35, 0, 1);
  const lsk = windHand(top, a, front, v3(-1, 0, -0.2), r, [0.14 * L, 0.14 * L + 30, 0.14 * L + 60], 0.14 * L + 86, 0.14 * L - 8, 0.7);
  const rsk = windHand(top, a, front, v3(1, 0, -0.3), r, [0.56 * L, 0.56 * L + 30, 0.56 * L + 60], 0.56 * L + 86, 0.56 * L + 18);
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'on the thumb rest and octave key', add(top, mul(a, 0.14 * L + 30))),
    R: arm('R', S.R, rsk, [0, 1, 2, 4], 'under the thumb hook', add(top, mul(a, 0.56 * L + 30))),
  };
}

/** THE FLUTE across to the player's right (SeatingArt: Q(−40, 120, 1180) →
 *  Q(600, 160, 1190)): the left hand nearest the head joint, its palm toward
 *  the player, the flute resting on the base of its index, the fingers over
 *  the top onto the keys, the thumb on the B♭ thumb key behind; the right hand
 *  further along, its thumb under the flute, the fingers over the top from
 *  the player's side, the little finger on the D♯ key. */
export const FLUTE = { a: L3(-40, 120, 1180), b: L3(600, 160, 1190), r: 10 } as const;
function fluteHold(): Hold {
  const S = shoulders(false);
  const ax = unit(sub(FLUTE.b, FLUTE.a));
  const at = (x: number, up: number, fwd: number) => add(add(FLUTE.a, mul(ax, x)), v3(0, up, fwd));
  const r = FLUTE.r;
  const pad = 8;
  // The keys on top (≈ 230 mm and 400 mm from the head's end: a drawing default).
  const lp: DigitGoal[] = [at(225, r + pad, 0), at(252, r + pad, 0), at(279, r + pad, 0), at(300, r * 0.5 + pad, 9)];
  const lThumb = at(232, -r * 0.3, -r - pad);
  const lAlong = unit(v3(0.35, 0.9, 0.3));
  const lf0 = handFrame(sub(at(255, -20, 40), mul(lAlong, 80)), lAlong, v3(0.1, -0.15, 1), v3(-1, 0, 0));
  const lsk = fit(lf0, lp, lThumb, { curl: 1.1, keep: near(lf0, 1000), slide: 40 });
  const rp: DigitGoal[] = [at(404, r + pad, 0), at(430, r + pad, 0), at(456, r + pad, 0), at(494, r * 0.3 + pad, 10)];
  const rThumb = at(410, -r - pad, 2);
  const rAlong = unit(v3(-0.1, 0.75, 0.66));
  const rf0 = handFrame(sub(at(428, -8, -35), mul(rAlong, 85)), rAlong, v3(0.2, 0.3, -1), v3(-1, 0, 0));
  const rsk = fit(rf0, rp, rThumb, { curl: 1.0, keep: near(rf0, 1000), slide: 40 });
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'on the B♭ thumb key', at(252, 0, 0)),
    R: arm('R', S.R, rsk, [0, 1, 2, 3, 4], 'under the flute', at(428, 0, 0)),
  };
}

/* ═══════════════ BRASS: the elbows hang ═══════════════ */

/** The brass arms hang: the upper arm asked to hang 45° below the horizontal
 *  (as far as an adult arm still brings the hand to the horn at the lips). */
const HANG = { drop: 45, dropW: 3, outboard: -45 } as const;

/** The trumpet, level from the lips (SeatingArt: mouthpiece Q(0, 110, 1150),
 *  bell Q(0, 560, 1120)); the three valves on its axis 252, 284, 316 mm
 *  ahead, their buttons 62 mm above it. */
export const TRUMPET = { mouth: L3(0, 110, 1150), bell: L3(0, 560, 1120), valves: [252, 284, 316], button: 62, r: 16 } as const;
export const trumpetAxis = (z: number): V3 => {
  const { mouth, bell } = TRUMPET;
  const t = (z - mouth.z) / (bell.z - mouth.z);
  return lerp3(mouth, bell, t);
};
function trumpetHold(): Hold {
  const S = shoulders(false);
  const ax = (z: number, up = 0, right = 0) => add(trumpetAxis(z), v3(right, up, 0));
  const [v1, v2, v3z] = TRUMPET.valves;
  const pad = 7.5;
  // RIGHT HAND: the fingertips on the three buttons from above, the thumb
  // under the leadpipe between valves 1 and 2, the little finger beside the hook.
  const rp: DigitGoal[] = [ax(v1, TRUMPET.button + pad), ax(v2, TRUMPET.button + pad), ax(v3z, TRUMPET.button + pad), { curl: 0.7 }];
  const rThumb = around(ax((v1 + v2) / 2, -TRUMPET.r - pad, 6), v3(0, 0, 1), v3(1, 0, 0), 7);
  const rAlong = unit(v3(-0.82, 0.5, 0.1));
  const rf0 = handFrame(ax(v2, -62, 96), rAlong, unit(v3(0.45, 0.85, 0)), v3(0, 0, -1));
  const rsk = fit(rf0, rp, rThumb, { curl: 1.15, keep: near(rf0, 600), slide: 40 });
  // LEFT HAND: round the valve casings from the left and below, the thumb
  // round the first casing on the player's side, the fingers round the front
  // of the third (the ring finger at the third slide's ring).
  const lp: DigitGoal[] = [ax(v3z + 18, 34, 6), ax(v3z + 20, 14, 10), ax(v3z + 18, -6, 6), ax(v3z + 10, -24, 0)];
  const lThumb = around(ax(v1 - 16, 34, -16), v3(0, 0, 1), v3(0, 1, 0), 8);
  const lAlong = unit(v3(0.35, 0.35, 0.87));
  const lf0 = handFrame(ax(v1 - 6, -100, -40), lAlong, unit(v3(-0.92, 0.1, 0.36)), v3(0, 1, 0));
  const lsk = fit(lf0, lp, lThumb, { curl: 1.2, keep: near(lf0, 4000), slide: 20 });
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'round the first valve casing', ax(v2, 0), HANG),
    R: arm('R', S.R, rsk, [0, 1, 2, 4], 'under the leadpipe', ax(v2, 0), HANG),
  };
}

/** The trombone, tipped up TBN_TILT_DEG (8°) about its mouthpiece (SeatingArt:
 *  Q(−60, 110, 1150)), its slide straight ahead to the crook 900 mm out. The
 *  left hand holds the bell section by the mouthpiece; the right hand is light
 *  on the slide's brace at second position (≈ 400 mm out). */
export const TROMBONE = { mouth: L3(-60, 110, 1150), tiltDeg: 8, brace: 400, r: 14, braceR: 7 } as const;
export const tromboneAxis = (z: number): V3 => add(TROMBONE.mouth, v3(0, (z - TROMBONE.mouth.z) * Math.tan(TROMBONE.tiltDeg * DEG), z - TROMBONE.mouth.z));
function tromboneHold(): Hold {
  const S = shoulders(false);
  const ax = (z: number, up = 0, right = 0) => add(tromboneAxis(z), v3(right, up, 0));
  const r = TROMBONE.r;
  const pad = 8;
  // LEFT HAND: a fist round the slide's upper tube just ahead of the
  // mouthpiece, the index on the receiver nearest the lips, the fingers over
  // the tube from the left, the thumb along its top toward the bell brace.
  const lp: DigitGoal[] = [ax(178, r * 0.55 + pad * 0.7, r * 0.6), ax(204, r * 0.2, r + pad * 0.8), ax(226, -r * 0.2, r + pad * 0.8), ax(246, -r * 0.6, r + pad * 0.5)];
  const lThumb = ax(208, r + pad, -r * 0.8);
  const lAlong = unit(v3(0.42, 0.9, 0.08));
  const lf0 = handFrame(ax(210, -96, -40), lAlong, unit(v3(-0.9, 0.42, 0)), v3(0, 0, -1));
  const lsk = fit(lf0, lp, lThumb, { curl: 1.3, keep: near(lf0, 600), slide: 40 });
  // RIGHT HAND: the slide brace between the thumb (on its near side) and the
  // index and middle fingers (over its far side); ring and little curled under.
  const B = TROMBONE.brace;
  const braceC = ax(B, 0, 50);
  const br = TROMBONE.braceR;
  const rp: DigitGoal[] = [add(braceC, v3(-14, 6, br + pad)), add(braceC, v3(-2, 2, br + pad)), { curl: 0.75 }, { curl: 0.8 }];
  const rThumb = around(add(braceC, v3(-8, 2, -br - pad)), v3(1, 0, 0), v3(0, 1, 0), 6);
  const rAlong = unit(v3(-0.45, 0.85, 0.28));
  const rf0 = handFrame(add(braceC, v3(40, -128, -22)), rAlong, unit(v3(0.86, 0.45, 0)), v3(0, 0, -1));
  const rsk = fit(rf0, rp, rThumb, { curl: 1.1, keep: near(rf0, 600), slide: 40 });
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'over the bell brace', ax(212, 0), HANG),
    R: arm('R', S.R, rsk, [0, 1, 4], 'on the brace’s near side', braceC, HANG),
    pts: { brace: braceC },
  };
}

/** The horn at the player's right (SeatingArt: the coil round Q(220, 40, 820),
 *  the bell back and down at Q(260, −220, 760)): the left fingers on the
 *  valve levers on the coil's inner side, the thumb on its valve; the right
 *  hand cupped in the bell. */
function hornHold(): Hold {
  const S = shoulders(false);
  const lev = (i: number) => L3(104, 66 + i * 22, 1000);
  const pad = 8;
  const lp: DigitGoal[] = [add(lev(0), v3(0, pad + 4, 0)), add(lev(1), v3(0, pad + 4, 0)), add(lev(2), v3(0, pad + 4, 0)), { curl: 0.6 }];
  const lThumb = around(add(lev(0), v3(-6, -pad - 10, -14)), v3(0, 0, 1), v3(0, 1, 0), 8);
  const la = unit(v3(0.92, 0.25, 0.25));
  const lf0 = handFrame(add(lev(1), v3(-110, 6, -10)), la, v3(-0.2, 1, 0), v3(0, 0, -1));
  const lsk = fit(lf0, lp, lThumb, { curl: 1.1, keep: near(lf0, 600), slide: 40 });
  // The right hand in the bell: flat, the fingers together and a little
  // curved, its back against the bell's far wall.
  const bell = L3(250, -150, 770);
  const ra = unit(v3(0.15, -0.55, -0.82));
  const rf0 = handFrame(sub(bell, mul(ra, 60)), ra, v3(1, -0.2, 0), v3(0, -1, 0));
  const rsk = handOn(rf0, [{ curl: 0.18 }, { curl: 0.2 }, { curl: 0.22 }, { curl: 0.25 }], { yaw: 0.25, pitch: 0.1, mcp: 0.1, ip: 0.1 });
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'on its valve', lev(1)),
    R: { ...arm('R', S.R, rsk, [], 'along the fingers, in the bell', bell), hidden: true },
  };
}

/** The tuba upright in the lap (SeatingArt: the body round Q(0, 120, 900), the
 *  bell up from Q(40, 120, 1100)): the right fingers on the top-action valve
 *  buttons, the left hand round the tubing on the player's left. */
function tubaHold(): Hold {
  const S = shoulders(false);
  const btn = (i: number) => L3(118, 166 + i * 30, 1070);
  const pad = 8;
  const rp: DigitGoal[] = [add(btn(0), v3(0, pad, 0)), add(btn(1), v3(0, pad, 0)), add(btn(2), v3(0, pad, 0)), { curl: 0.7 }];
  const rThumb = add(btn(0), v3(-28, -40, -10));
  const ra = unit(v3(-0.75, 0.35, 0.55));
  const rf0 = handFrame(add(btn(1), v3(96, -30, -60)), ra, v3(0.3, 1, 0), v3(0, 0, -1));
  const rsk = fit(rf0, rp, rThumb, { curl: 1.1, keep: near(rf0, 600), slide: 40 });
  const tube = L3(-150, 200, 1000);
  const lp: DigitGoal[] = [add(tube, v3(10, 30, 22)), add(tube, v3(12, 8, 24)), add(tube, v3(10, -14, 22)), add(tube, v3(6, -34, 16))];
  const lThumb = add(tube, v3(12, 26, -22));
  const la = unit(v3(0.6, 0.2, 0.77));
  const lf0 = handFrame(add(tube, v3(-80, -10, -40)), la, v3(-0.8, 0.1, 0.6), v3(0, 1, 0));
  const lsk = fit(lf0, lp, lThumb, { curl: 1.2, keep: near(lf0, 600), slide: 40 });
  return {
    L: arm('L', S.L, lsk, [0, 1, 2, 4], 'round the tube', tube),
    R: arm('R', S.R, rsk, [0, 1, 2], 'under the valve block', btn(1), { drop: 30, dropW: 1 }),
  };
}

/* ═══════════════ the hold of a kind ═══════════════ */

export type HoldKind = 'violin' | 'viola' | 'cello' | 'bass' | 'bassPizz' | 'flute' | 'oboe' | 'clarinet' | 'bassoon' | 'horn' | 'trumpet' | 'trombone' | 'tuba' | 'sax' | 'bariSax' | 'tenorSax' | 'eguitar' | 'ebass' | 'aguitar' | 'mandolin' | 'guitar';
export const HOLD_KINDS: readonly HoldKind[] = ['violin', 'viola', 'cello', 'bass', 'bassPizz', 'flute', 'oboe', 'clarinet', 'bassoon', 'horn', 'trumpet', 'trombone', 'tuba', 'sax', 'bariSax', 'tenorSax', 'eguitar', 'ebass', 'aguitar', 'mandolin', 'guitar'];
const isHoldKind = (k: string): k is HoldKind => (HOLD_KINDS as readonly string[]).includes(k);

function solve(k: HoldKind): Hold {
  switch (k) {
    case 'violin':
    case 'viola':
    case 'cello':
    case 'bass':
      return bowedHold(k, false);
    case 'bassPizz':
      return bowedHold('bass', true);
    case 'flute':
      return fluteHold();
    case 'oboe':
    case 'clarinet':
      return reedHold(k);
    case 'bassoon':
      return bassoonHold();
    case 'horn':
      return hornHold();
    case 'trumpet':
      return trumpetHold();
    case 'trombone':
      return tromboneHold();
    case 'tuba':
      return tubaHold();
    case 'sax':
    case 'bariSax':
    case 'tenorSax':
      return saxHold(k);
    case 'guitar':
      return guitarHold('archtop');
    default:
      return guitarHold(k);
  }
}

const cache = new Map<string, Hold>();
/**
 * The hold of an ensemble kind (null: no instrument hand pose — keys,
 * percussion, the conductor, the singers keep their own). `lift`: a standing
 * player playing a part usually played seated (big-band trumpets): everything
 * that much higher. Solved once per kind and lift.
 */
export function holdOf(kind: string, lift = 0): Hold | null {
  if (!isHoldKind(kind)) return null;
  const key = `${kind}|${lift}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const base = cache.get(`${kind}|0`) ?? solve(kind);
  cache.set(`${kind}|0`, base);
  if (!lift) return base;
  const d = v3(0, lift, 0);
  const mv = (a: Arm3 | null): Arm3 | null => (a ? { ...a, shoulder: add(a.shoulder, d), elbow: add(a.elbow, d), wrist: add(a.wrist, d), sk: shiftSk(a.sk, d), at: add(a.at, d) } : null);
  const out: Hold = { L: mv(base.L), R: mv(base.R), pts: base.pts ? Object.fromEntries(Object.entries(base.pts).map(([n, p]) => [n, add(p, d)])) : undefined };
  cache.set(key, out);
  return out;
}

/* ═══════════════ the tests' view ═══════════════ */

/**
 * EVERY POSED HAND of the ensemble family (Lab 5: E02–E16), for the anatomy
 * ratchet (test/figureAnatomy): its skeleton and elbow in the player's frame,
 * the digits that must touch what they play, and where the thumb is. One per
 * kind and hand — every player of a kind holds it the same way (a standing
 * big-band trumpet is the same hold 400 mm higher).
 */
export function handCases(): { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string; hand: 'left' | 'right'; upperArmDropDeg: number; wristDeg: number }[] {
  const out: ReturnType<typeof handCases> = [];
  for (const k of HOLD_KINDS) {
    const h = holdOf(k)!;
    for (const a of [h.L, h.R]) {
      if (!a) continue;
      out.push({ name: `${k}.${a.side}`, sk: a.sk, elbow: a.elbow, contact: a.contact, thumb: a.thumb, hand: a.side === 'L' ? 'left' : 'right', upperArmDropDeg: upperArmDropDeg(a.shoulder, a.elbow), wristDeg: wristBendDeg(a.sk, a.elbow) });
    }
  }
  return out;
}

/** The finger bends of a hand (degrees, index … little, thumb): for reviews. */
export const bendsOf = (sk: HandSkeleton): number[][] => [...sk.fingers, sk.thumb].map(jointBendsDeg);
export { curled, type ThumbPose };
