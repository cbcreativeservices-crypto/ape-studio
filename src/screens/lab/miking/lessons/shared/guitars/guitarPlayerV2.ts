/**
 * THE GUITAR FAMILY'S PLAYER IN THE NEW LOOK (figure V2, wave 3 set 3c of
 * D78, 2026-11-24). Pure: no React, no Skia.
 *
 * The same player the lessons already pose (guitarPlayer.ts: every joint read
 * from the scene's model — the head envelope, the picking arm's capsule and
 * hand box, the fretting hand's box, the posture and the floor) is read as
 * ONE 3-D skeleton and drawn by the shared "player who holds an instrument"
 * renderer (figureV2/familyV2: the approved cast person face-on or from
 * above, the approved sleeve on each arm, every posed hand drawn in the
 * approved hand language, the person again over the instrument wherever its
 * parts lie nearer the viewer).
 *
 * Frames. Upright (frame G): x along the strings toward the headstock, y
 * across (the bass side −y, up in the picture), z off the top toward the
 * audience; the front picture is (u, v) = (x, y), the top picture (x, z).
 * Lap (frame G with the instrument face up): the side picture is (x, −zG),
 * the top picture (x, yG); read into the renderer's frame as (x, −zG, yG).
 * So for every posture the body's joint is (u of either picture, v of the
 * side picture, v of the top picture).
 *
 * The hands: the fretting hand is the posed hand of handPoses.fretFront (each
 * pad on its string behind its fret, the thumb behind the neck), the picking
 * hand the instrument's own technique (pluckHands.ts), the lap steel's bar
 * and picking hands handPoses.lapBarHand / lapPickHand — all kept exactly.
 */
import { BODY } from '../players/playerPose.ts';
import { fitHand, h3, handFrame, v3, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { FRET_PAD_D, FRET_SHOULDER_D, fretArm3, fretFront } from '../players/handPoses.ts';
import type { GuitarScene } from './guitarModel.ts';
import { fretTips, guitarPlayerPose, lapHands } from './guitarPlayer.ts';
import { pickHandOf, type PickStyle } from './pluckHands.ts';
import type { FamArmIn, FamIn, FamSkeleton, FamView } from '../figureV2/familyV2';
import type { CastMember } from '../figureV2/cast';
import { solveArm3 } from '../figureV2/playersPlan.ts';

/**
 * THE FRETTING HAND AND ARM, re-fitted (follow-up 2026-11-24). The passed fretting hand's PADS (each on its
 * string just behind its fret) and its thumb's pad (behind the neck) are kept exactly; the hand is fitted to
 * them again from an adult arm hanging from the left shoulder, so the wrist stays easy (≤ 28° off the forearm;
 * it was bent 33–55°) and the forearm runs up and forward from the elbow to the neck instead of straight at
 * the audience (on the ukulele and the mandolin the hand sat on a disc of sleeve, face-on). Of the reaches
 * and elbows that land every pad, the one whose forearm runs most across the picture.
 */
/**
 * Where the fretting elbow may hang (Guitars4, 2026-11-24 — reviewer: "from above, the fretting arm on banjo,
 * mandolin and ukulele is a straight rod, on the ukulele sticking up and out at 45° past the head"; the elbow
 * had been solved BEHIND the shoulder, 70–160 mm back). Every elbow that joins the shoulder to the kept wrist
 * with an adult arm lies on one circle round the shoulder–wrist line; it is sampled all the way round and each
 * point scored as a player's arm hangs: the upper arm down and a little FORWARD from the shoulder (never back
 * past it), the elbow by the side (not swung out like a wing, not inside the ribs), the forearm running out
 * from it along under the neck to the hand. The best few are then fitted with the hand (wrist easy).
 */
function fretElbowHints(shoulder: V3, w0: V3, along: V3, midX: number): V3[] {
  const n = h3.unit(h3.sub(w0, shoulder));
  const a0 = h3.unit(h3.sub(v3(0, 1, 0), h3.mul(n, n.y)));
  const b0 = h3.unit(v3(n.y * a0.z - n.z * a0.y, n.z * a0.x - n.x * a0.z, n.x * a0.y - n.y * a0.x));
  const side = Math.sign(shoulder.x - midX) || 1;
  const scored: { e: V3; c: number }[] = [];
  for (let k = 0; k < 48; k++) {
    const t = (k / 48) * Math.PI * 2;
    const hint = h3.add(shoulder, h3.add(h3.mul(a0, 200 * Math.cos(t)), h3.mul(b0, 200 * Math.sin(t))));
    const e = solveArm3(shoulder, w0, hint).elbow;
    const fore = h3.unit(h3.sub(w0, e));
    const bend = (Math.acos(Math.max(-1, Math.min(1, h3.dot(fore, along)))) * 180) / Math.PI;
    const back = Math.max(0, shoulder.z + 15 - e.z);
    const front = Math.max(0, e.z - (w0.z - 15));
    const out = Math.max(0, side * (e.x - shoulder.x) - 70);
    const inward = Math.max(0, side * (shoulder.x - e.x) - 25);
    const lift = Math.max(0, shoulder.y + 220 - e.y);
    const c = 0.06 * back * back + 0.08 * front * front + 0.03 * out * out + 0.06 * inward * inward + 0.02 * lift * lift + (bend > 40 ? 2 * (bend - 40) ** 2 : 0);
    scored.push({ e, c });
  }
  scored.sort((p, q) => p.c - q.c);
  return scored.slice(0, 4).map((q) => h3.sub(q.e, shoulder));
}

function fretRefit(shoulder: V3, sk: HandSkeleton, midX?: number): { sk: HandSkeleton; elbow: V3 } {
  const pads = sk.fingers.map((f) => f.joints[f.joints.length - 1]);
  const thumb = sk.thumb.joints[sk.thumb.joints.length - 1];
  const thumbSide = h3.mul(sk.frame.y, -1);
  let best: { sk: HandSkeleton; elbow: V3; c: number } | null = null;
  // (the wrist stays where the passed hand has it — under the neck on the treble side, behind it, so the fingers
  // come round from below onto the board; only the elbow and the hand's turn are sought)
  const w0 = sk.frame.o;
  const hints = midX === undefined
    ? [v3(60, 300, -60), v3(140, 260, -40), v3(0, 320, 40), v3(100, 300, 60), v3(220, 200, 0), v3(-100, 300, 0)]
    : fretElbowHints(shoulder, w0, sk.frame.x, midX);
  for (const hint of hints) {
    const elbow = solveArm3(shoulder, w0, h3.add(shoulder, hint)).elbow;
    const fore = h3.unit(h3.sub(w0, elbow));
    for (const k of [0.25, 0.4, 0.55, 0.7, 0.85]) {
      const along = h3.unit(h3.add(h3.mul(fore, k), h3.mul(sk.frame.x, 1 - k)));
      const dz = sk.frame.z;
      const dorsal = h3.unit(h3.sub(dz, h3.mul(along, h3.dot(dz, along))));
      const fit = fitHand(handFrame(w0, along, dorsal, thumbSide), pads, thumb, { elbow, maxWrist: 29, slide: 34, curl: 1.1 });
      const miss = fit.miss.reduce((a, m) => a + m * m, 0);
      const f2 = h3.unit(h3.sub(fit.frame.o, elbow));
      const lift = Math.max(0, shoulder.y + 200 - elbow.y);
      // (the elbow by the side, never swung in across the body)
      const inward = Math.max(0, shoulder.x - 40 - elbow.x);
      const bend = (Math.acos(Math.max(-1, Math.min(1, h3.dot(f2, fit.frame.x)))) * 180) / Math.PI;
      const back = midX === undefined ? 0 : Math.max(0, shoulder.z + 15 - elbow.z);
      const c = miss * 30 + 0.05 * inward * inward + 120 * f2.z * f2.z + 0.01 * lift * lift + (bend > 30 ? 20 * (bend - 30) ** 2 : 0) + 0.06 * back * back;
      if (!best || c < best.c) best = { sk: fit, elbow, c };
    }
  }
  return { sk: best!.sk, elbow: best!.elbow };
}

/** A skeleton moved (every point; the frame's axes and the bones' normals are directions and stay). */
export function shiftSk(sk: HandSkeleton, d: V3): HandSkeleton {
  const m = (q: V3) => h3.add(q, d);
  return {
    ...sk,
    frame: { ...sk.frame, o: m(sk.frame.o) },
    fingers: sk.fingers.map((f) => ({ ...f, joints: f.joints.map(m) })),
    thumb: { ...sk.thumb, joints: sk.thumb.joints.map(m) },
    palm: sk.palm.map(m),
  };
}
/** A skeleton read through a linear map of the frame (the lap steel's (x, −z, y)). */
function mapSk(sk: HandSkeleton, f: (q: V3) => V3): HandSkeleton {
  const dir = (q: V3) => {
    const a = f(q);
    const o = f(v3(0, 0, 0));
    return h3.sub(a, o);
  };
  return {
    ...sk,
    frame: { o: f(sk.frame.o), x: dir(sk.frame.x), y: dir(sk.frame.y), z: dir(sk.frame.z) },
    fingers: sk.fingers.map((d) => ({ ...d, joints: d.joints.map(f), dorsal: d.dorsal.map(dir) })),
    thumb: { ...sk.thumb, joints: sk.thumb.joints.map(f), dorsal: sk.thumb.dorsal.map(dir) },
    palm: sk.palm.map(f),
  };
}
const LAP = (q: V3): V3 => v3(q.x, -q.z, q.y);

/**
 * The fretting hand as the audience sees it, turned a little (handPoses.fretView, the passed illustrator's
 * quarter turn, art fix round 3 2026-10-16 — graded "fingers standing up like a claw" seen dead square): a
 * finger that rises toward the viewer and comes back down onto its string is drawn with whatever stands in
 * front of the strings' plane shifted toward the headstock and down, so its arch over the board shows; every pad
 * stays exactly on its string and fret. Applied to the skeleton (a shear in depth) so the renderer's square
 * projection draws it so; from above the hand is not sheared.
 */
function shearSk(sk: HandSkeleton, sgn: number, zPad: number, k = 0.45, m = 0.18): HandSkeleton {
  const f = (q: V3) => v3(q.x + sgn * k * (q.z - zPad), q.y + m * (q.z - zPad), q.z);
  const out = mapSk(sk, f);
  // (review 2026-11-24, KeysGuitar2: seen square the fretting fingers read as straight columns standing on the
  // board. Each finger's middle and end joints rise toward the audience above the line from its knuckle to its pad
  // — that rise is the finger's arch over the strings; it is drawn turned a little more (toward the headstock and
  // down, as the quarter turn above), so each finger reads as a curved digit coming over the board's treble edge.
  // The knuckle and the pad do not move: every pad stays on its string behind its fret.)
  const KF = 0.9;
  const MF = 0.35;
  const arch = (d: HandSkeleton['fingers'][number], d0: HandSkeleton['fingers'][number]) => {
    const a = d0.joints[0];
    const b = d0.joints[d0.joints.length - 1];
    const joints = d.joints.map((q, i) => {
      if (i === 0 || i === d.joints.length - 1) return q;
      const t = i / (d.joints.length - 1);
      const rise = d0.joints[i].z - (a.z + (b.z - a.z) * t);
      return rise > 0 ? v3(q.x + sgn * KF * rise, q.y + MF * rise, q.z) : q;
    });
    return { ...d, joints };
  };
  return { ...out, fingers: out.fingers.map((d, i) => arch(d, sk.fingers[i])) };
}

/** The picking technique each instrument is played with (researched; the lesson's own words). */
export function pickStyleOf(sc: GuitarScene): PickStyle {
  const id = sc.variant.spec.id.toLowerCase();
  const sp = sc.variant.spec;
  if (sp.body.pot) return 'banjo';
  if (/bass/.test(id)) return 'bass';
  if (/uke|ukulele/.test(id)) return 'uke';
  if (sp.strings.nylon) return 'classical';
  if (/reso/.test(id)) return 'fingerpicks';
  return 'flat';
}

export type GuitarFamParts = { s: FamSkeleton; L: FamArmIn; R: FamArmIn; seated: boolean };

const cache = new Map<string, GuitarFamParts>();

/** The player's skeleton and posed arms in the renderer's frame, for one view's cut planes. */
export function guitarFamParts(sc: GuitarScene, view: 'front' | 'top'): GuitarFamParts {
  const key = `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}|${view}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const F = guitarPlayerPose(sc, 'side');
  const T = guitarPlayerPose(sc, 'top');
  const g = sc.g;
  const lap = !!sc.o.lap;
  const seated = sc.variant.posture !== 'standing';
  // (a joint: u from the side picture, v from it, depth from the top picture)
  const J = (f: { u: number; v: number }, t: { u: number; v: number }) => v3(f.u, f.v, t.v);
  const ankle = (f: { u: number; v: number }, t: { u: number; v: number }) => v3(f.u, sc.floorY - 80, t.v);
  const toe = (f: { u: number; v: number }, t: { u: number; v: number }) => v3(f.u, sc.floorY - 28, t.v + 120);
  const s: FamSkeleton = {
    head: J(F.head.c, T.head.c),
    headR: F.head.r,
    // (looking at the neck: toward the audience, down a little and toward the headstock)
    face: h3.unit(v3(0.3, 0.3, 1)),
    neck: J(F.neck, T.neck),
    pelvis: J({ u: (F.hipR.u + F.hipL.u) / 2, v: (F.hipR.v + F.hipL.v) / 2 }, { u: 0, v: (T.hipR.v + T.hipL.v) / 2 }),
    shoulderL: J(F.shoulderL, T.shoulderL),
    shoulderR: J(F.shoulderR, T.shoulderR),
    hipL: J(F.hipL, T.hipL),
    hipR: J(F.hipR, T.hipR),
    kneeL: J(F.kneeL, T.kneeL),
    kneeR: J(F.kneeR, T.kneeR),
    ankleL: ankle(F.footL, T.footL),
    ankleR: ankle(F.footR, T.footR),
    toeL: toe(F.footL, T.footL),
    toeR: toe(F.footR, T.footR),
  };
  let L: FamArmIn;
  let R: FamArmIn;
  if (!lap) {
    const tips = fretTips(g.L);
    const tipMid = (tips[1] + tips[2]) / 2;
    const half = g.boardHalf(tipMid);
    const H = g.h(tipMid);
    const board = { v: 0, half, tips, strings: g.spec.strings.courses };
    const arm = fretArm3(F.shoulderL, board, FRET_SHOULDER_D);
    const sk0 = fretFront({ wrist: { u: arm.wrist.x, v: arm.wrist.y }, dir: 0, kind: 'fret', board });
    const up = v3(0, 0, H);
    const sgn = Math.sign(tips[0] - tips[tips.length - 1]) || 1;
    // (banjo, mandolin, ukulele: the elbow sought all round, hanging forward — fretElbowHints)
    const small = !!sc.variant.spec.body.pot || /mando|uke/i.test(sc.variant.spec.id);
    const rf = fretRefit(s.shoulderL, shiftSk(sk0, up), small ? s.neck.x : undefined);
    void arm.elbow;
    const sk1 = rf.sk;
    L = {
      sk: view === 'front' ? shearSk(sk1, sgn, H + FRET_PAD_D) : sk1,
      elbow: rf.elbow,
      shoulder: s.shoulderL,
      // the thumb behind the neck: from the front everything 16 mm behind the board's face is behind the neck;
      // from above everything below the neck's top edge is under it
      cut: view === 'front' ? { p: v3(0, 0, H - 16), n: v3(0, 0, 1) } : { p: v3(0, -half, 0), n: v3(0, -1, 0) },
    };
    const pk = pickHandOf(sc, pickStyleOf(sc), F);
    R = { sk: pk.sk, elbow: pk.elbow, shoulder: s.shoulderR, cut: null };
  } else {
    const l3 = lapHands(sc);
    L = { sk: mapSk(l3.L, LAP), elbow: LAP(l3.elbowL), shoulder: s.shoulderL, cut: null };
    R = { sk: mapSk(l3.R, LAP), elbow: LAP(l3.elbowR), shoulder: s.shoulderR, cut: null };
  }
  const out = { s, L, R, seated };
  cache.set(key, out);
  return out;
}

/** Pushed far behind (front) or far below (from above): where a joint's depth only orders the drawing. */
const FAR = 9999;
const skCache = new Map<string, FamSkeleton>();
/**
 * The skeleton as the renderer orders it against the instrument (the person is drawn whole behind the
 * instrument, then again over it wherever its parts lie nearer the viewer): the arms and the hands keep their
 * true depths; the body and legs only order the drawing — face-on the head, the body and the legs lie behind
 * the instrument held against them (their depth is not drawn, the picture is (x, y)); from above the legs lie
 * under it (their height is not drawn, the picture is (x, z)).
 */
function orderedSkeleton(key: string, s: FamSkeleton, view: FamView): FamSkeleton {
  const k = `${key}|${view}`;
  const hit = skCache.get(k);
  if (hit) return hit;
  const back = (q: V3) => v3(q.x, q.y, -FAR);
  const down = (q: V3) => v3(q.x, FAR, q.z);
  const legs = view === 'front' ? back : down;
  const out: FamSkeleton = {
    ...s,
    ...(view === 'front' ? { head: back(s.head), neck: back(s.neck), pelvis: back(s.pelvis), chest: back(h3.mul(h3.add(s.neck, s.pelvis), 0.5)) } : {}),
    hipL: legs(s.hipL),
    hipR: legs(s.hipR),
    kneeL: legs(s.kneeL),
    kneeR: legs(s.kneeR),
    ankleL: legs(s.ankleL),
    ankleR: legs(s.ankleR),
    toeL: legs(s.toeL),
    toeR: legs(s.toeR),
  };
  skCache.set(k, out);
  return out;
}

/** The renderer's input for a view: the scene's player as `who`. */
export function guitarFamIn(sc: GuitarScene, view: 'side' | 'top', who: CastMember): FamIn {
  const fv: FamView = view === 'side' ? 'front' : 'top';
  const p = guitarFamParts(sc, fv);
  const key = `guitar|${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}`;
  return {
    key,
    s: orderedSkeleton(key, p.s, fv),
    view: fv,
    who,
    seated: p.seated,
    floorY: sc.floorY,
    arms: { L: p.L, R: p.R },
  };
}

/** (the shoulders' half-width the renderer draws: the old pose's) */
export const GUITAR_SHOULDER_HALF = BODY.shoulderHalf;
