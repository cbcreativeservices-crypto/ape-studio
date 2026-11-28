/**
 * THE METAL-PERCUSSION PLAYER IN THE APPROVED LOOK (figure roll-out, D78,
 * 2026-11-24): the triangle (I06a), finger cymbals (I06b), bar chimes (I06c)
 * and gong (I12) players as ONE 3-D standing skeleton per picture, drawn by the
 * family figure (figureV2/familyV2 famPlan: the cast person in profile, face-on
 * or from above, the approved sleeves, each posed hand in the approved look).
 * Pure: no React, no Skia.
 *
 * Nothing of the instrument moves: every clip, strap, beater, mallet, cymbal,
 * strike point and label stays where each lesson's art draws it. Only the person
 * is new — the body standing where the old figure stood, each hand posed on what
 * that picture shows it holding (each view builds its own skeleton from the
 * points its own drawing uses, so a hand always lands on the drawn object):
 *
 *   triangle (researched: the clip held in the non-playing hand like a glass,
 *            "a C": the clip's back on the thumb, its front on the middle
 *            finger, the index on top, the ring and little fingers free to damp;
 *            the beater held lightly near its end like a stick, the other
 *            fingers loose round it);
 *   finger cymbals, orchestral: each cymbal hung by its strap, pinched between
 *            the thumb's pad and the index finger's pad above the bell;
 *            dance: a zill on the thumb and one on the middle finger of each
 *            hand, the hands raised, the thumb and middle finger closing;
 *   bar chimes: the left hand at the long end, the fingers hanging down, the
 *            backs of the fingers brushing the bars (the sweep), the right arm
 *            relaxed at the side;
 *   gong:    standing beside the gong, turned toward it, a soft heavy mallet in
 *            the right hand near the end of its handle in a relaxed full grip,
 *            the arm reaching with the elbow softly bent; the left arm hangs.
 *
 * Frame (each lesson's own): +x toward the audience, +y DOWN, floor y = 0, +z the
 * player's right. Views: side (u = x, v = y, toward the viewer +z), top (u = x,
 * v = z), front from the audience (u = −z, v = y, toward the viewer +x). The
 * family figure draws 'side' as (x, y, z) and 'front' as its own frame (u = x
 * across, the viewer at +z): a picture is given to it in that frame by turning
 * the world (front: (x, y, z) → (−z, y, x)).
 */
import { fitHand, h3, handOn, THUMB_REST, v3, type DigitGoal, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { stickHold } from '../figureV2/grip.ts';
import { solveArm3 } from '../figureV2/playersPlan.ts';
import { gripArm3, type GripArm3 } from '../figureV2/playersGrip.ts';
import type { FamArmIn, FamSkeleton, FamView } from '../figureV2/familyV2';

const { add, sub, mul, dot, len, unit } = h3;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const DEG = Math.PI / 180;
const DOWN = v3(0, 1, 0);

export type MetalView = 'side' | 'top' | 'front';

/* ── the standing body ── */

/** Where the player stands: the neck over (x0, z0), facing `yaw` (0 = +x, the audience; 90° = +z). */
export type Stance = { x0: number; z0: number; yaw: number; nod?: number };

export type Body = { s: FamSkeleton; fwd: V3; right: V3; at: (f: number, h: number, r: number) => V3 };

/** The standing adult (drawing defaults on the old figure's own masses: the head at 1640, the collar 1490,
 *  the shoulders 1445, the belt 935, the chest front 112 ahead of the neck). */
export function standing(st: Stance): Body {
  const c = Math.cos(st.yaw * DEG);
  const sn = Math.sin(st.yaw * DEG);
  const fwd = v3(c, 0, sn);
  const right = v3(-sn, 0, c);
  const at = (f: number, h: number, r: number): V3 => v3(st.x0 + f * c - r * sn, -h, st.z0 + f * sn + r * c);
  const n = (st.nod ?? 6) * DEG;
  const s: FamSkeleton = {
    head: at(17, 1640, 0),
    headR: 110,
    face: unit(add(mul(fwd, Math.cos(n)), mul(DOWN, Math.sin(n)))),
    neck: at(0, 1490, 0),
    chest: at(12, 1260, 0),
    pelvis: at(-8, 960, 0),
    shoulderR: at(-16, 1445, 186),
    shoulderL: at(-16, 1445, -186),
    hipR: at(-10, 935, 100),
    hipL: at(-10, 935, -100),
    kneeR: at(10, 495, 98),
    kneeL: at(4, 495, -98),
    ankleR: at(20, 85, 102),
    ankleL: at(14, 85, -102),
    toeR: at(150, 22, 110),
    toeL: at(144, 22, -110),
  };
  return { s, fwd, right, at };
}

/* ── hands ── */

/** An anatomical hand frame: `along` wrist → knuckles, `dorsal` the back's way (made square to it). Frame H
 *  is left-handed in its numbers (percGrip): a right hand's toward-little = back × along, a left's = along × back. */
export function frameOf(o: V3, along: V3, dorsal: V3, hand: 'R' | 'L'): HandFrame {
  const x = unit(along);
  const z = unit(sub(dorsal, mul(x, dot(dorsal, x))));
  const y = hand === 'R' ? cross(z, x) : cross(x, z);
  return { o, x, y, z };
}

/** The elbow's hint: down and back from the shoulder, a little out on the arm's own side. */
function elbowHint(b: Body, sh: V3, side: 1 | -1, o: { back?: number; down?: number; out?: number } = {}): V3 {
  return add(sh, add(mul(b.fwd, -(o.back ?? 90)), add(mul(DOWN, o.down ?? 320), mul(b.right, side * (o.out ?? 70)))));
}

/** One solved arm. `cutAt`: a held stick's axis; `cutPt`: the middle of a small held object (a clip, a strap):
 *  the hand's parts beyond it (from the viewer) are painted behind what it holds, the rest over it. `front`
 *  false: the hand holds nothing and lies behind the instrument. */
export type MetalArm = { sk: HandSkeleton; elbow: V3; shoulder: V3; front?: boolean; cutAt?: { a: V3; b: V3 }; cutPt?: V3; handElsewhere?: boolean; grip?: MetalGrip; drawn?: DrawnHand };

/**
 * (family batch 2026-11-25) A hand drawn as AUTHORED 2-D ART (figureV2/metalHand*.tsx) instead of the posed 3-D
 * hand: which drawing (`kind`), where its anchor lands on the page (the picture's own mm: the held thing's point),
 * its turn and whether it is the mirror image. The arm is solved so its sleeve ends at the drawing's wrist and its
 * forearm runs the drawing's way; the hand is painted by MetalPlayerV2 (behind and in front of what it holds).
 */
export type DrawnHand = { kind: string; at: { u: number; v: number }; rot: number; mirror: boolean };

/** A picture's page point of a 3-D point (u, v) and its depth toward the viewer, each view. */
export function projectView(view: MetalView, p: V3): { u: number; v: number; d: number } {
  if (view === 'top') return { u: p.x, v: p.z, d: -p.y };
  if (view === 'front') return { u: -p.z, v: p.y, d: p.x };
  return { u: p.x, v: p.y, d: p.z };
}
/** The 3-D point at page (u, v), depth d (the inverse of projectView). */
export function unprojectView(view: MetalView, u: number, v: number, d: number): V3 {
  if (view === 'top') return v3(u, -d, v);
  if (view === 'front') return v3(d, v, -u);
  return v3(u, v, d);
}

/**
 * The arm re-solved for an authored hand: the wrist where the drawing's wrist is on the page (`cuff`, the depth of
 * the posed hand's wrist kept), the elbow chosen round its circle so the forearm runs on the page as near the
 * drawing's forearm (`fore`, a page direction from the wrist toward the elbow) as an adult arm allows — never above
 * the shoulder, never across the chest. The posed skeleton is carried along unchanged (moved to the new wrist), so
 * every measure of the posed hand stays as it was; the family draws the sleeve to the wrist only.
 */
export function armToDrawn(b: Body, hand: 'R' | 'L', a: MetalArm, view: MetalView, drawn: DrawnHand, cuff: { u: number; v: number }, fore: { u: number; v: number }): MetalArm {
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const side = hand === 'R' ? 1 : -1;
  const W0 = a.sk.frame.o;
  const W = unprojectView(view, cuff.u, cuff.v, projectView(view, W0).d);
  const n = unit(sub(W, sh));
  const e1 = unit(Math.abs(n.y) < 0.9 ? sub(DOWN, mul(n, dot(DOWN, n))) : sub(b.fwd, mul(n, dot(b.fwd, n))));
  const e2 = cross(n, e1);
  const fl = Math.hypot(fore.u, fore.v) || 1;
  let best: { elbow: V3; wrist: V3; score: number } | null = null;
  for (let k = 0; k < 96; k++) {
    const t = (k / 96) * Math.PI * 2;
    const hint = add(sh, add(mul(e1, 400 * Math.cos(t)), mul(e2, 400 * Math.sin(t))));
    const s = solveArm3(sh, W, hint);
    const pe = projectView(view, s.elbow);
    const pw = projectView(view, s.wrist);
    const du = pe.u - pw.u;
    const dv = pe.v - pw.v;
    const dl = Math.hypot(du, dv) || 1;
    // (how far the forearm's page direction is from the drawing's; a foreshortened forearm counts for less)
    const cosA = (du * fore.u + dv * fore.v) / (dl * fl);
    let score = (1 - cosA) * Math.min(1, dl / 120);
    if (s.elbow.y < sh.y - 40) score += 2; // never an elbow above the shoulder
    const lateral = dot(sub(s.elbow, b.s.neck), b.right) * side;
    if (lateral < 120) score += 2; // never an elbow across the chest
    if (dot(sub(s.elbow, sh), b.fwd) < -260) score += 1; // never far behind the back
    if (!best || score < best.score) best = { elbow: s.elbow, wrist: s.wrist, score };
  }
  const d = sub(best!.wrist, W0);
  const mv = (q: V3) => add(q, d);
  const sk: HandSkeleton = { ...a.sk, frame: { ...a.sk.frame, o: mv(a.sk.frame.o) }, fingers: a.sk.fingers.map((g) => ({ ...g, joints: g.joints.map(mv) })), thumb: { ...a.sk.thumb, joints: a.sk.thumb.joints.map(mv) }, palm: a.sk.palm.map(mv) };
  return { ...a, sk, elbow: best!.elbow, handElsewhere: true, drawn };
}

/** How a held rod looks where it shows between the fingers (the lesson's own beater or handle: its width, its
 *  colour and its edge). */
export type RodLook = { d: number; color: string; edge: string };
/** (review 2 of the metal set, 2026-11-24: "the mallet handle drawn OVER the fingers, a rod in front of a fist")
 *  A hand CLOSED ROUND its beater or mallet: the approved held grip (playersGrip gripArm3 → heldHands placeGrip),
 *  the shaft passing through the fist — between the thumb's pad and the index, the other fingers curled round,
 *  its end in the palm. `a`–`b` the rod's piece the hand closes on (from its butt toward its head). */
export type MetalGrip = { g: GripArm3; a: V3; b: V3; look: RodLook };

/**
 * A hand closed round a beater or a mallet (the M06 timpani way): `fist` the rod's centre in the middle of the
 * fist, `head` a point on the rod toward its head, `butt` its grip end; `back` where the back of the hand faces.
 * The arm is solved from the shoulder (both bones their lengths); the family draws the sleeve to the wrist and the
 * hand is the approved grip (MetalPlayerV2 GripHands).
 */
export function gripMetalArm(b: Body, hand: 'R' | 'L', fist: V3, head: V3, butt: V3, back: V3, look: RodLook, o: { ulnar?: number; tilt?: number; elbowHint?: V3 } = {}): MetalArm {
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const g = gripArm3({ hand, fist, toward: head, shoulder: sh, back, fwd: b.fwd, right: b.right, centre: b.s.neck, R: look.d / 2, ...o });
  const sk = handOn(frameOf(g.wrist, sub(fist, g.wrist), back, hand), [{ curl: 0.3 }, { curl: 0.3 }, { curl: 0.3 }, { curl: 0.3 }]);
  // (the rod's piece in the hand: from its butt to 60 mm past the fist toward the head)
  const s = unit(sub(head, fist));
  return { sk, elbow: g.elbow, shoulder: sh, front: false, handElsewhere: true, grip: { g, a: butt, b: add(fist, mul(s, 60)), look } };
}

/** The back of a hand on a stick held between palm-down and thumb-up (the timpani grip, 55° from palm-down): up
 *  and out on the hand's own side. */
export const stickBack = (b: Body, hand: 'R' | 'L', deg = 55): V3 => add(mul(DOWN, -Math.cos(deg * DEG)), mul(b.right, (hand === 'R' ? 1 : -1) * Math.sin(deg * DEG)));

/**
 * The back of a RIGHT hand reaching out along its forearm to a rod (a gong mallet held at arm's length): the hand's
 * line carries the forearm's line on from the shoulder (the grip model's knuckle-ward axis e₂ = back × rod set to
 * the shoulder → fist direction square to the rod), so the wrist lies back toward the shoulder, never out beside
 * the fist. Turned so the back faces up rather than down where the two can be chosen.
 */
export function reachBack(b: Body, fist: V3, head: V3): V3 {
  const s = unit(sub(head, fist));
  const d = sub(fist, b.s.shoulderR);
  const e2 = unit(sub(d, mul(s, dot(d, s))));
  return cross(s, e2);
}

/** A hand on a stick, a beater or a mallet's handle (the approved stick grip, grip.ts): the fulcrum where the
 *  hand closes, the stick toward `bead`; the arm solved from the shoulder (an adult arm, the elbow hanging down
 *  and back). `level` 0–1: the forearm that much nearer the level than the stick. */
export function stickArm(b: Body, hand: 'R' | 'L', fulcrum: V3, bead: V3, o: { back?: number; out?: number; down?: number; level?: number } = {}): MetalArm {
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const s = unit(sub(bead, fulcrum));
  const flat = unit(v3(s.x, 0, s.z));
  const k = o.level ?? 0;
  const wd = unit(add(mul(s, 1 - k), mul(flat, k)));
  const w0 = sub(fulcrum, mul(wd, 100));
  const { elbow, wrist } = solveArm3(sh, w0, elbowHint(b, sh, hand === 'R' ? 1 : -1, o));
  const hold = stickHold({ hand, elbow, wrist, fulcrum, bead });
  return { sk: hold.sk, elbow, shoulder: sh, cutAt: { a: fulcrum, b: bead } };
}

/**
 * A hand FITTED to what it holds (handModel.fitHand: each pad on its target, the fingers in a natural curl,
 * the wrist within `maxWrist`° of the forearm), the arm solved from the shoulder to the fitted wrist — twice
 * round, so the forearm and the hand agree.
 */
export function fittedArm(
  b: Body,
  hand: 'R' | 'L',
  start: HandFrame,
  fingers: readonly DigitGoal[],
  thumb: V3 | typeof THUMB_REST,
  o: { back?: number; out?: number; down?: number; maxWrist?: number; slide?: number; curl?: number; dipRatio?: number } = {},
): MetalArm {
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const hint = elbowHint(b, sh, hand === 'R' ? 1 : -1, o);
  let f = start;
  let sk = handOn(f, fingers, thumb, o.dipRatio);
  let elbow = solveArm3(sh, f.o, hint).elbow;
  for (let i = 0; i < 3; i++) {
    sk = fitHand(f, fingers, thumb, { elbow, maxWrist: o.maxWrist ?? 35, slide: o.slide ?? 30, curl: o.curl ?? 0.9, dipRatio: o.dipRatio });
    f = sk.frame;
    elbow = solveArm3(sh, f.o, hint).elbow;
  }
  return { sk, elbow, shoulder: sh };
}

/** An arm to a wrist whose hand the lesson draws itself (the approved hand-drum hand): the sleeve ends at that
 *  wrist; `along` / `dorsal` the hand's way there (only the cuff's direction reads them). */
export function solveArmTo(b: Body, hand: 'R' | 'L', W: V3, along: V3, dorsal: V3, o: { back?: number; out?: number; down?: number } = {}): MetalArm {
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const { elbow } = solveArm3(sh, W, elbowHint(b, sh, hand === 'R' ? 1 : -1, o));
  const sk = handOn(frameOf(W, along, dorsal, hand), [{ curl: 0.3 }, { curl: 0.3 }, { curl: 0.3 }, { curl: 0.3 }]);
  return { sk, elbow, shoulder: sh, front: false, handElsewhere: true };
}

/** A hand hanging at the side, relaxed: the back of the hand outward, the thumb forward, the fingers gently
 *  curled (the arm a little forward of straight down). */
export function hangArm(b: Body, hand: 'R' | 'L', under = false): MetalArm {
  const side = hand === 'R' ? 1 : -1;
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const out = mul(b.right, side);
  // (a relaxed hanging arm is never quite straight: the elbow a little back, the forearm a little forward;
  // `under` — from above — the hand kept under the shoulder's cloth, never poking out beside the chest)
  const elbow = add(sh, add(mul(DOWN, 303), add(mul(b.fwd, under ? -40 : -32), mul(out, under ? 6 : 26))));
  const wrist = add(elbow, add(mul(DOWN, 244), add(mul(b.fwd, under ? 58 : 80), mul(out, under ? 0 : 12))));
  const along = unit(add(mul(DOWN, 1), add(mul(b.fwd, 0.2), mul(out, -0.04))));
  const f = frameOf(wrist, along, out, hand);
  const sk = handOn(f, [{ curl: 0.32, abd: -0.04 }, { curl: 0.36, abd: 0 }, { curl: 0.4, abd: 0.03 }, { curl: 0.44, abd: 0.07 }], { yaw: 0.5, pitch: 0.45, mcp: 0.2, ip: 0.2 });
  return { sk, elbow, shoulder: sh, front: false };
}

/* ── turning a picture into the family figure's frame ── */

type M3 = (p: V3) => V3;
export const IDENT: M3 = (p) => p;
/** From the audience: the family figure's face-on frame (u = x across, the viewer at +z) ← (−z, y, x). */
export const TO_FRONT: M3 = (p) => v3(-p.z, p.y, p.x);

const mapSk = (sk: HandSkeleton, m: M3): HandSkeleton => {
  const d = (q: V3) => sub(m(q), m(v3(0, 0, 0)));
  const dg = (g: HandSkeleton['thumb']) => ({ ...g, joints: g.joints.map(m), dorsal: g.dorsal.map(d) });
  return { frame: { o: m(sk.frame.o), x: d(sk.frame.x), y: d(sk.frame.y), z: d(sk.frame.z) }, fingers: sk.fingers.map(dg), thumb: dg(sk.thumb), palm: sk.palm.map(m), miss: sk.miss };
};
const mapS = (s: FamSkeleton, m: M3): FamSkeleton => {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(s)) out[k] = typeof v === 'number' ? v : k === 'face' ? sub(m(v as V3), m(v3(0, 0, 0))) : m(v as V3);
  return out as FamSkeleton;
};

/** What the family figure needs for one picture (the person is added by the drawing). */
export type MetalFig = {
  key: string;
  view: FamView;
  s: FamSkeleton;
  arms: { L: FamArmIn; R: FamArmIn };
  floorY: number;
  /** the hands closed round a rod, in the family figure's frame */
  grips: { L?: MetalGrip; R?: MetalGrip };
  /** (family batch 2026-11-25) the hands drawn as authored 2-D art (page mm; none: the posed hand) */
  drawn: { L?: DrawnHand; R?: DrawnHand };
};

/** A grip turned into the family figure's frame (the turn is a rotation: the hand's handedness is kept). */
function mapGrip(mg: MetalGrip | undefined, m: M3): MetalGrip | undefined {
  if (!mg) return undefined;
  const d = (q: V3) => sub(m(q), m(v3(0, 0, 0)));
  const g = mg.g;
  return {
    ...mg,
    a: m(mg.a),
    b: m(mg.b),
    g: { ...g, shoulder: m(g.shoulder), elbow: m(g.elbow), fist: m(g.fist), wrist: m(g.wrist), rod: d(g.rod), back: d(g.back), mirror: g.mirror ? { c: m(g.mirror.c), n: d(g.mirror.n) } : null },
  };
}

/** The toward-the-viewer direction in the family figure's own frame. */
export const towardOf = (v: FamView): V3 => (v === 'top' ? v3(0, -1, 0) : v3(0, 0, 1));

function famArm(a: MetalArm, m: M3, fv: FamView): FamArmIn {
  let cut: FamArmIn['cut'] = null;
  if (a.cutAt) {
    const A = m(a.cutAt.a);
    const B = m(a.cutAt.b);
    const ax = unit(sub(B, A));
    const t = towardOf(fv);
    const n = unit(sub(t, mul(ax, dot(t, ax))));
    cut = { p: mul(add(A, B), 0.5), n };
  } else if (a.cutPt) cut = { p: m(a.cutPt), n: towardOf(fv) };
  return { sk: mapSk(a.sk, m), elbow: m(a.elbow), shoulder: m(a.shoulder), cut, front: a.front ?? true, handElsewhere: a.handElsewhere ?? false };
}

const figCache = new Map<string, MetalFig>();
/** One picture's figure (memoised by key: the family figure's plan cache keys on its identity). */
export function metalFig(key: string, view: MetalView, build: () => { b: Body; L: MetalArm; R: MetalArm; m?: M3; fv?: FamView }): MetalFig {
  const hit = figCache.get(key);
  if (hit) return hit;
  const { b, L, R, m: m0, fv: fv0 } = build();
  const m = m0 ?? (view === 'front' ? TO_FRONT : IDENT);
  const fv: FamView = fv0 ?? view;
  // (an authored hand replaces the posed grip too: only one hand is ever drawn on an arm)
  const fig: MetalFig = {
    key,
    view: fv,
    s: mapS(b.s, m),
    arms: { L: famArm(L, m, fv), R: famArm(R, m, fv) },
    floorY: 0,
    grips: { L: L.drawn ? undefined : mapGrip(L.grip, m), R: R.drawn ? undefined : mapGrip(R.grip, m) },
    drawn: { L: L.drawn, R: R.drawn },
  };
  figCache.set(key, fig);
  return fig;
}

/* ── the measures the tests and the study page read ── */

/** The forearm's drawn length, the wrist's bend (deg) and the upper arm's length of a solved arm. */
export function armMeasures(a: MetalArm): { upper: number; fore: number; wristBend: number; miss: number } {
  const fore = len(sub(a.sk.frame.o, a.elbow));
  const bend = (Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(a.sk.frame.o, a.elbow)), a.sk.frame.x)))) * 180) / Math.PI;
  return { upper: len(sub(a.elbow, a.shoulder)), fore, wristBend: bend, miss: Math.max(...a.sk.miss) };
}

/** Which way a skeleton's hand is (+1 right, −1 left) in frame H's numbers. */
export const handednessOf = (sk: HandSkeleton): number => Math.sign(dot(cross(sk.frame.x, sk.frame.y), sk.frame.z));
