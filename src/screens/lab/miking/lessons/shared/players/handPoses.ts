/**
 * HANDS POSED ON INSTRUMENTS (figure pass 3, owner 2026-10-15) — the shared
 * hand model (handModel.ts) placed and solved for each way a player holds an
 * instrument. Pure: the tests check these very hands (every pad on its
 * string, key or button; the thumb where the instrument's technique puts it;
 * the wrist within 70° of the forearm).
 *
 * The picture's 2-D views are lifted to 3-D as (u, v, d): u and v the view's
 * own millimetres, d toward the viewer (0 = the instrument's playing face).
 */
import { BODY, type Hand, type Pt } from './playerPose.ts';
import { fitHand, handFrame, handOn, h3, HAND, reachThumb, thumbJoints, v3, type HandSkeleton, type HandView, type V3 } from './handModel.ts';

/** The picture plane as a view: u, v as they are; d toward the viewer. */
export const FLAT_VIEW: HandView = (p) => ({ u: p.x, v: p.y, d: p.z });

/** A guitar-family neck seen from the front, for the fretting hand: the board's
 *  centre line v, its half-width, the fret stops (u, index first), the depth of
 *  the neck behind the board, the strings and whether the thumb's tip shows over
 *  the top edge (steel strings, a strap) or stays behind the neck (classical). */
export type FrontBoard = { v: number; half: number; tips: number[]; strings?: number; neckDepth?: number; thumbOver?: boolean };

/**
 * THE CHORD the fretting hand holds (index … little): which of the four stops
 * (`stop`, index nearest the headstock) and which string (`s`, a fraction
 * across the board from the TOP edge — the lowest string, nearest the
 * player's face — to the bottom, snapped to the real strings), and `hover`
 * (mm) for a finger held just off the strings. THE C-MAJOR SHAPE every
 * player learns first: the index on the second string from the bottom at the
 * first stop, the middle on the middle string a fret further, the ring on the
 * second string from the top a fret further again — a staircase, no finger
 * hiding another; the little finger relaxed, curled just over the strings
 * beside the ring finger, as it rests in that chord.
 */
export const FRET_SHAPE = [
  { stop: 0, s: 0.8, hover: 0 },
  { stop: 1, s: 0.4, hover: 0 },
  { stop: 2, s: 0.2, hover: 0 },
  { stop: 3, s: 0.55, hover: 16 },
] as const;
/** The digits that press (index, middle, ring) — and the thumb behind the neck. */
export const FRET_CONTACT = [0, 1, 2, 4] as const;

/**
 * THE FRETTING HAND'S PLACE seen from the front (figure pass 3): the knuckle
 * row 28 mm under the board's bottom edge, level with its face, under the
 * middle of the stops the chord uses; the hand pointing from the wrist to the
 * knuckles toward the AUDIENCE, UP and a little toward the HEADSTOCK (the
 * palm under the neck, as a player holds a guitar resting on the thigh), so
 * the fingers rise over the bottom edge and arch back down onto the strings.
 * Found by a sweep (every pad within 1 mm, the middle joints bent 40–60°,
 * the 3-D wrist ≈ 57°).
 */
export const FRET_KNUCKLE = { below: 28, front: 0 } as const;
/** The hand's slant (its along-axis: up, toward the audience, toward the headstock). */
const FRET_UP = 0.4;
const FRET_TILT = 0.15;
const fretAlong = (sgn: number) => h3.unit(v3(sgn * FRET_TILT, -FRET_UP, Math.sqrt(1 - FRET_UP * FRET_UP - FRET_TILT * FRET_TILT)));
/** Depth (mm, toward the audience from the board's face) of a seated or
 *  standing player's shoulder joint behind a guitar-family instrument held
 *  against the body: the instrument's depth and the chest's half-depth. */
export const FRET_SHOULDER_D = -210;
/** Which way the fretting elbow hangs (beside the body, a little out and back). */
export const FRET_ELBOW_POLE = { out: 0.15, back: 0.5 } as const;

/**
 * Where a FRETTING hand's wrist and knuckle row are, seen from the front. The
 * wrist is a palm's length (96 mm) behind the knuckle row along the hand — at
 * `wristUV` in the picture if the family's model already put it there (its
 * depth then follows from the palm's length), else along the house slant.
 */
export function fretWrist(bd: FrontBoard, wristUV?: Pt): { wrist: V3; knuckles: V3 } {
  const tips = bd.tips;
  const used = FRET_SHAPE.map((f) => tips[Math.min(f.stop, tips.length - 1)]);
  const tu = used.reduce((a, b) => a + b, 0) / used.length;
  const sgn = Math.sign(tips[0] - tips[tips.length - 1]) || 1;
  const knuckles = v3(tu, bd.v + bd.half + FRET_KNUCKLE.below, FRET_KNUCKLE.front);
  const palm = HAND.fingers[1].mcp.x - 4;
  if (wristUV) {
    const flat = Math.hypot(knuckles.x - wristUV.u, knuckles.y - wristUV.v);
    return { wrist: v3(wristUV.u, wristUV.v, knuckles.z - Math.sqrt(Math.max(0, palm * palm - flat * flat))), knuckles };
  }
  return { wrist: h3.sub(knuckles, h3.mul(fretAlong(sgn), palm)), knuckles };
}

/**
 * THE FRETTING ARM in 3-D, for a family that draws its player from the front:
 * the hand placed by fretWrist, the shoulder `shoulderD` behind the board's
 * face, the elbow solved for an adult arm (upper arm 300 mm, forearm 255 mm)
 * hanging down and out from the shoulder. The picture shows the forearm
 * FORESHORTENED — it reaches forward from the elbow beside the body to the
 * hand under the neck, as it does seen from the audience.
 */
export function fretArm3(shoulder: Pt, bd: FrontBoard, shoulderD = FRET_SHOULDER_D): { shoulder: V3; elbow: V3; wrist: V3; knuckles: V3 } {
  const sgn = Math.sign(bd.tips[0] - bd.tips[bd.tips.length - 1]) || 1;
  const { wrist, knuckles } = fretWrist(bd);
  const S = v3(shoulder.u, shoulder.v, shoulderD);
  const U = 300;
  const F = 255;
  const d = h3.sub(wrist, S);
  const L = Math.min(h3.len(d), U + F - 1);
  const u = h3.unit(d);
  const a = (U * U - F * F + L * L) / (2 * L);
  const hh = Math.sqrt(Math.max(0, U * U - a * a));
  const pole = v3(sgn * FRET_ELBOW_POLE.out, 1, -FRET_ELBOW_POLE.back); // down, a little out to the side, back
  const q = h3.unit(h3.sub(pole, h3.mul(u, h3.dot(pole, u))));
  return { shoulder: S, elbow: h3.add(h3.add(S, h3.mul(u, a)), h3.mul(q, hh)), wrist, knuckles };
}

/**
 * THE FRETTING HAND seen from the FRONT (guitar, bass guitar, banjo, mandolin,
 * ukulele, lutes): the hand below the neck, its back toward the audience and
 * a little down, the knuckle row just under the board's bottom edge; each
 * finger rises from its knuckle over the edge and its pad comes DOWN onto a
 * string just behind its fret (index nearest the headstock, one finger per
 * fret); the thumb behind the neck, opposite the index and middle fingers —
 * its tip just over the top edge on a steel-string instrument, hidden behind
 * the neck on a classical guitar or a bass. `h.wrist`: where the family's
 * model put the wrist (the sleeve ends there).
 */
export function fretFront(h: Hand & { board: FrontBoard }): HandSkeleton {
  const bd = h.board;
  const nStr = bd.strings ?? 6;
  const tips = bd.tips;
  // The strings across the board (the outer ones ≈ 8 % in from the edges).
  const stringV = (s: number) => bd.v - bd.half * 0.84 + s * bd.half * 1.68;
  const snap = (s: number) => (nStr <= 1 ? 0.5 : Math.round(s * (nStr - 1)) / (nStr - 1));
  const pads = FRET_SHAPE.map((f) => v3(tips[Math.min(f.stop, tips.length - 1)], stringV(snap(f.s)), FRET_PAD_D + f.hover));
  const sgn = Math.sign(tips[0] - tips[tips.length - 1]) || 1; // toward the headstock
  const { wrist, knuckles } = fretWrist(bd, h.wrist);
  const along = h3.unit(h3.sub(knuckles, wrist));
  // The palm toward the neck (its back toward the audience and down, square
  // to the hand in the plane across the neck); the thumb toward the headstock.
  const f = handFrame(wrist, along, v3(0, along.z, -along.y), v3(sgn, 0, 0));
  const z0 = f.z;
  // The thumb's pad on the back of the neck (behind the index and middle
  // fingers), or its tip just over the top edge.
  const depth = bd.neckDepth ?? 24;
  const tIdx = (tips[0] + tips[1]) / 2 + sgn * 6;
  const thumb = bd.thumbOver ? v3(tIdx, bd.v - bd.half - 3, -depth * 0.4) : v3(tIdx, bd.v - bd.half * 0.1, -depth - 11);
  // Rolled about its own length until the pads land (the wrist and the
  // knuckle row stay where they are).
  const x0 = f.x;
  return fitHand(f, pads, thumb, {
    curl: 1.3,
    dipRatio: 0.7,
    keep: (g) => 3000 * (1 - h3.dot(g.x, x0)) + 3000 * (1 - h3.dot(g.z, z0)),
  });
}

/** A pad pressing a string: the pad's centre ≈ 9.5 mm in front of the board's face (string ≈ 3 mm over it, the pad ≈ 7 mm round). */
export const FRET_PAD_D = 9.5;

/**
 * THE PICKING HAND seen from the FRONT (a pick held over the strings): a loose
 * fist, the back of the hand toward the audience and a little up, the thumb
 * on the neck's side; the index curled less than the others with the pick
 * held flat between the side of its last bone and the thumb's pad, the pick's
 * point out past them DOWN ONTO THE STRINGS (`stringsD` mm in front of the
 * top); the other fingers curled loosely below. The hand points down the
 * strings' way (`h.dir`); its wrist sits where the family's model put it in
 * the picture, at the depth that brings the pick's point to the strings.
 */
export function pickFront(h: Hand, stringsD = 6): HandSkeleton & { pick: { a: V3; b: V3; tip: V3 } } {
  // Pointing down the strings' way and a little toward the audience: the curled fingers fold back toward the top,
  // so the wrist rides ≈ 40 mm over the strings (the forearm lies on the bout) and the pick's point reaches them.
  const along = h3.unit(v3(Math.cos(h.dir), Math.sin(h.dir), 0.3));
  const up = v3(0, -0.35, 1);
  const dorsal = h3.sub(up, h3.mul(along, h3.dot(up, along)));
  // The right hand from the front, pointing down to the strings: its thumb toward the neck (+u).
  const at = (d: number) => handFrame(v3(h.wrist.u, h.wrist.v, d), along, dorsal, v3(1, 0, 0));
  const fingers = [
    { abd: -0.06, mcp: 0.8, pip: 1.5, dip: 0.5 },
    { abd: 0.0, mcp: 0.85, pip: 1.6, dip: 0.95 },
    { abd: 0.06, mcp: 0.85, pip: 1.6, dip: 0.95 },
    { abd: 0.14, mcp: 0.9, pip: 1.65, dip: 1.0 },
  ];
  const pinchOf = (f: ReturnType<typeof at>) => {
    const ix = handOn(f, fingers).fingers[0].joints;
    return h3.add(h3.add(ix[2], h3.mul(h3.sub(ix[3], ix[2]), 0.5)), h3.mul(f.y, -(HAND.fingers[0].r[2] + 1.5)));
  };
  const pd = (f: ReturnType<typeof at>) => h3.unit(h3.add(h3.mul(f.z, -0.8), h3.mul(f.x, 0.45)));
  // The depth that puts the pick's point on the strings.
  const f0 = at(0);
  const tip0 = h3.add(pinchOf(f0), h3.mul(pd(f0), 17));
  const f = at(stringsD - tip0.z);
  const sk0 = handOn(f, fingers);
  const ix = sk0.fingers[0].joints;
  const pinch = pinchOf(f);
  // The thumb's pad on the pick, opposite the index.
  const t = reachThumb(f, h3.add(pinch, h3.mul(f.y, -10)));
  const sk = { ...sk0, thumb: thumbJoints(f, t.pose), miss: [...sk0.miss.slice(0, 4), t.miss] };
  const across = h3.unit(h3.sub(ix[3], ix[2]));
  const c = h3.add(pinch, h3.mul(f.y, -5));
  return { ...sk, pick: { a: h3.add(c, h3.mul(across, -9)), b: h3.add(c, h3.mul(across, 9)), tip: h3.add(c, h3.mul(pd(f), 17)) } };
}

/**
 * LAP STEEL (C03 square neck; figure pass 3) — the instrument face up across
 * the lap, in its own frame: x along the strings toward the nut, y across
 * them (−y the player's side, the low strings), z up off the top. `zs`: the
 * strings' height over the top; `half`: the strings' half-spread there.
 *
 * THE BAR HAND (left): palm down over the bar, the fingers pointing across it
 * away from the player; the index lies along the top of the bar pressing it
 * down, the thumb (on the bridge side) and the middle finger (on the nut
 * side) grip its two sides, the ring and little fingers rest on the strings
 * BEHIND it — between the bar and the nut — to damp them. A bar of radius
 * `r` lies on the strings at `bx`.
 */
export function lapBarHand(o: { bx: number; zs: number; half: number; r?: number; elbow: V3 }): HandSkeleton {
  const r = o.r ?? 11;
  const zc = o.zs + r; // the bar's axis
  const f = handFrame(v3(o.bx + 6, -o.half - 80, zc + 58), v3(0.1, 1, -0.4), v3(0, 0, 1), v3(-1, 0, 0));
  const fingers = [
    v3(o.bx + 2, o.half * 0.3, zc + r + 8.5), // index: pad on the top of the bar
    v3(o.bx + r + 8.5, -o.half * 0.2, zc + 2), // middle: on the bar's nut side
    v3(o.bx + 36, -o.half * 0.15, o.zs + 8.5), // ring: resting on the strings behind the bar
    v3(o.bx + 50, -o.half * 0.5, o.zs + 8.5), // little: resting, nearer the player
  ];
  const thumb = v3(o.bx - r - 9.5, -o.half * 0.55, zc + 1); // on the bar's bridge side
  return fitHand(f, fingers, thumb, { elbow: o.elbow, slide: 60, curl: 0.9, keep: (g) => (g.z.z < 0.5 ? 3000 * (0.5 - g.z.z) ** 2 : 0) });
}

/**
 * THE PICKING HAND on a lap steel (right): arched over the strings just
 * toward the neck from the bridge (`xp`), palm down — the thumb (with its
 * thumb pick) on a low string, the index and middle (finger picks) on high
 * strings, the ring and little fingers planted on the top beyond the strings
 * (`topY`: their side's edge of the strings) to steady the hand.
 */
export function lapPickHand(o: { xp: number; zs: number; half: number; elbow: V3 }): HandSkeleton {
  const f = handFrame(v3(o.xp - 70, -o.half - 75, o.zs + 70), v3(0.35, 1, -0.45), v3(0, 0, 1), v3(1, 0, 0));
  const fingers = [
    v3(o.xp + 6, o.half * 0.25, o.zs + 8.5),
    v3(o.xp - 4, o.half * 0.7, o.zs + 8.5),
    v3(o.xp - 40, o.half + 22, 8.5),
    v3(o.xp - 58, o.half + 26, 8.5),
  ];
  const thumb = v3(o.xp + 16, -o.half * 0.55, o.zs + 9.5);
  return fitHand(f, fingers, thumb, { elbow: o.elbow, slide: 60, curl: 0.9, keep: (g) => (g.z.z < 0.5 ? 3000 * (0.5 - g.z.z) ** 2 : 0) });
}

/** The lap steel's views of its own frame: from the audience (the top faces up) and from above. */
export const LAP_SIDE: HandView = (q) => ({ u: q.x, v: -q.z, d: q.y });
export const LAP_TOP: HandView = (q) => ({ u: q.x, v: q.y, d: q.z });

/** The hand's reach and widths, for posers that place a hand by its palm. */
export const PALM_LEN = HAND.fingers[1].mcp.x;
export const HAND_LEN = BODY.handLen;
export type { Pt };
