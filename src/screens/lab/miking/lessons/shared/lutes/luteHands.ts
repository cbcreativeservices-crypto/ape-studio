/**
 * THE LUTE PLAYERS' HANDS AND ARMS (figure pass 3, owner 2026-10-15: "check
 * that the hand is correctly positioned, placed, bent, fingers and digits
 * accounted for"). Pure: no React, no Skia — the drawing (lutePlayers.tsx,
 * through PlayerFigure.drawHand3) paints these very skeletons and the tests
 * measure them (`handCases`).
 *
 * Every hand is the shared adult hand (players/handModel.ts) posed in 3-D in
 * the ENGINE frame (+x the player's left, +y down, +z toward the audience),
 * so ONE pose serves the front view and the view from above. Targets are
 * written in each instrument's own frame (luteModel: +x along the strings
 * toward the pegs, +y across the board, +z out of the board) and mapped by
 * the scene's posture.
 *
 * THE TECHNIQUES
 *   • OUD (fretless): the left hand under the neck, the knuckle row just
 *     below the board's lower edge, the fingers arched over it with their
 *     pads on the courses at first-position stops, the thumb behind the neck.
 *     The right hand holds the RISHA (the long plectrum) between the thumb's
 *     pad (on top) and the side of the curled index (under it), the other
 *     fingers loosely curled; the wrist floats over the strings toward the
 *     main rose; the forearm lies over the body's upper edge.
 *   • SITAR: the left hand's index and middle press the main string on two
 *     neighbouring arched frets (pads just on the nut side of each fret,
 *     ready to pull the string across the fret), the ring and little fingers
 *     relaxed and curled off the board, the thumb on the back of the neck.
 *     The right hand wears the MIZRAB (the wire plectrum) on the index
 *     fingertip; its thumb rests on the neck's upper edge just above the
 *     gourd; the forearm lies over the gourd's upper rim.
 *   • VEENA: the right forearm lies along the resonator's top, the hand
 *     pointing up the strings toward the neck, its back up, the thumb toward
 *     the far side; the index and middle pads on two melody strings by the
 *     neck's start, the ring curled, the little finger over the board's NEAR
 *     edge (where a veena carries its tala strings — this drawing still shows
 *     them on the audience side: an open item). The left hand: the true
 *     technique (the arm passing beneath the neck, the fingers coming over
 *     the far edge) cannot be reached by an adult arm in this scene (the neck
 *     ≈ 390 mm in front of the shoulder joint and ≈ 230 below it) — the hand
 *     comes to the neck from the player's side: the knuckle row beside the
 *     near edge, the index and middle arching over onto the near (main)
 *     string at two frets on their wax, the ring and little curled, the
 *     thumb's pad on the near edge.
 *
 * THE ARMS: an adult's — upper arm 310 mm (shoulder joint → elbow), forearm
 * 255 mm (elbow → wrist crease) — solved in 3-D from the scene's shoulders to
 * each hand's wrist (the elbow hangs toward a pole: down, out to the side).
 * The fit's elbows (luteModel.ts, which feed the plucking-arm keep-outs and
 * the setting plan's footprint) are these solutions, rounded to the mm.
 */
import {
  fitHand,
  handFrame,
  handOn,
  h3,
  HAND,
  reachThumb,
  THUMB_REST,
  thumbJoints,
  v3,
  type DigitGoal,
  type FingerPose,
  type HandSkeleton,
  type V3,
} from "../players/handModel.ts";
import { sceneOfKind, type LuteKind, type LuteScene } from "./luteModel.ts";

/** An adult's arm (mm): shoulder joint → elbow, elbow → wrist crease. */
export const LUTE_ARM = { upper: 310, fore: 255 } as const;

/** One hand and its arm, ENGINE frame. */
export type LuteArm = { shoulder: V3; elbow: V3; wrist: V3; sk: HandSkeleton };
/** A plectrum (the risha, the mizrab's wire): its back end, its striking tip. */
export type Plectrum = {
  kind: "risha" | "mizrab" | "picks";
  back: V3;
  tip: V3;
  width: number;
};
export type LuteHandsPose = {
  fret: LuteArm;
  pluck: LuteArm & { plectrum: Plectrum | null };
  /** Digits that touch what they play (index 0 … little 3, thumb 4). */
  fretContact: number[];
  pluckContact: number[];
};

const I = (sc: LuteScene, x: number, y: number, z: number): V3 =>
  sc.posture.P(v3(x, y, z));
const ID = (sc: LuteScene, x: number, y: number, z: number): V3 =>
  sc.posture.D(v3(x, y, z));
/** An engine point back in the instrument's frame (the posture is a rotation). */
function toInst(sc: LuteScene, e: V3): V3 {
  const o = sc.posture.P(v3(0, 0, 0));
  const d = h3.sub(e, o);
  return v3(
    h3.dot(d, ID(sc, 1, 0, 0)),
    h3.dot(d, ID(sc, 0, 1, 0)),
    h3.dot(d, ID(sc, 0, 0, 1)),
  );
}

/**
 * THE ELBOW of an adult arm from the shoulder to the wrist: the two-bone
 * solution (upper arm, forearm) turned toward `pole` (the way the elbow
 * hangs). A wrist out of reach straightens the arm toward it.
 */
export function elbowOf(
  shoulder: V3,
  wrist: V3,
  pole: V3,
  U: number = LUTE_ARM.upper,
  F: number = LUTE_ARM.fore,
): V3 {
  const d = h3.sub(wrist, shoulder);
  const L = Math.min(h3.len(d), U + F - 1);
  const u = h3.unit(d);
  const a = (U * U - F * F + L * L) / (2 * L);
  const hh = Math.sqrt(Math.max(0, U * U - a * a));
  const q = h3.unit(h3.sub(pole, h3.mul(u, h3.dot(pole, u))));
  return h3.add(h3.add(shoulder, h3.mul(u, a)), h3.mul(q, hh));
}

/* ═══════════════════════════ the stopping hand ═══════════════════════════ */

/**
 * A STOPPING HAND on a neck (all three lutes hold the neck the same way:
 * the palm on the board's +y side, the fingers rising over that edge and
 * coming down onto the strings, the thumb behind the neck). Instrument frame:
 * `stops` each finger's pad (or a curl for a finger that rests), `thumb` its
 * pad, `knuckles` the middle knuckle, `along` the hand's direction wrist →
 * knuckles. The hand is turned about its own length until the pads land.
 */
export function stoppingHand(
  sc: LuteScene,
  o: {
    stops: DigitGoal[];
    thumb: [number, number, number];
    knuckles: [number, number, number];
    along: [number, number, number];
    dorsal?: [number, number, number];
    elbow: [number, number, number];
  },
): LuteArm {
  const A = h3.unit(v3(...o.along));
  const K = v3(...o.knuckles);
  const wI = h3.sub(K, h3.mul(A, HAND.fingers[1].mcp.x - 2));
  const wrist = I(sc, wI.x, wI.y, wI.z);
  const along = ID(sc, A.x, A.y, A.z);
  // The palm toward the neck: the back of the hand out on the +y side and
  // forward, square to the hand (unless given); the thumb toward the nut (+x).
  const dI = o.dorsal ? v3(...o.dorsal) : v3(0, A.z, -A.y);
  const f0 = handFrame(wrist, along, ID(sc, dI.x, dI.y, dI.z), ID(sc, 1, 0, 0));
  const pads = o.stops.map((g) => (isV3(g) ? I(sc, g.x, g.y, g.z) : g));
  const thumb = I(sc, ...o.thumb);
  const shoulder = sc.fit.shoulderL;
  const elbow = elbowOf(shoulder, wrist, h3.sub(v3(...o.elbow), shoulder));
  const x0 = f0.x;
  const z0 = f0.z;
  const sk = fitHand(f0, pads, thumb, {
    elbow,
    maxWrist: 66,
    curl: 1.25,
    dipRatio: 0.7,
    keep: (g) => 2500 * (1 - h3.dot(g.x, x0)) + 2500 * (1 - h3.dot(g.z, z0)),
  });
  return { shoulder, elbow, wrist, sk };
}
const isV3 = (g: unknown): g is V3 =>
  typeof (g as V3).x === "number" && typeof (g as V3).z === "number";

/** A resting finger, gently curled (radians at each joint). */
const REST = (mcp: number, pip: number, abd = 0): FingerPose => ({
  abd,
  mcp,
  pip,
  dip: pip * 0.7,
});

function oudFret(sc: LuteScene): LuteArm {
  const g = sc.oud!;
  // The courses at x (course 0 the single bass, nearest the player's face).
  const c = (x: number, k: number) => g.courseYs(x)[k].y;
  // Pads press the course to the board (board face z = 8, pad ≈ 7 mm round).
  const pz = 15;
  // First position on the fretless neck (the nut at 600): the index a whole
  // tone down (≈ 64 mm), the middle a minor third (≈ 95), the ring a major
  // third (≈ 124) on the next course; the little lifted, curled over the board.
  return stoppingHand(sc, {
    stops: [
      v3(536, c(536, 4), pz),
      v3(505, c(505, 3), pz),
      v3(476, c(476, 4), pz),
      REST(0.75, 1.15, 0.12),
    ],
    thumb: [522, -4, -45],
    knuckles: [500, g.boardHalf(500) + 24, 4],
    along: [0.12, -0.42, 0.9],
    elbow: [560, 10, -250],
  });
}

function sitarFret(sc: LuteScene): LuteArm {
  const g = sc.sitar!;
  const main = (x: number) => g.playedYs(x)[0];
  // The arched frets stand 24 mm over the neck; the pad presses the main
  // string onto the fret's crown just on the nut side of it. Two frets a
  // semitone apart (the index on the higher one toward the nut).
  const pz = 33;
  const f1 = g.frets[5]; // 466
  const f2 = g.frets[6]; // 440
  return stoppingHand(sc, {
    stops: [
      v3(f1 + 16, main(f1 + 16), pz),
      v3(f2 + 14, main(f2 + 14), pz),
      REST(0.55, 1.2, 0.04),
      REST(0.6, 1.3, 0.14),
    ],
    thumb: [f1 - 15, 16, -g.neck.depth - 10],
    knuckles: [f1 - 24, g.neck.half + 8, 0],
    along: [0.1, -0.59, 0.8],
    elbow: [420, -120, -300],
  });
}

function veenaFret(sc: LuteScene): LuteArm {
  const g = sc.veena!;
  const main = (x: number) => g.melodyYs(x)[0];
  // The frets stand on their wax ≈ 12 mm over the neck; the strings at ≈ 17.
  const pz = 23;
  const f1 = g.frets[5]; // 608
  const f2 = g.frets[6]; // 574
  // From the player's side (see the module note): the wrist raised toward
  // the player, the knuckle row beside the neck's near edge, the fingers
  // arching over that edge onto the near (main) string; the thumb's pad on
  // the near edge, a little up the neck.
  return stoppingHand(sc, {
    stops: [
      v3(f1 + 14, main(f1 + 14), pz),
      v3(f2 + 14, main(f2 + 14), pz),
      REST(0.7, 1.25, 0.04),
      REST(0.75, 1.35, 0.14),
    ],
    thumb: [f1 + 20, -40, 16],
    knuckles: [f1 - 14, -45, 28],
    along: [0.1, 0.75, -0.654],
    dorsal: [0, -0.654, -0.75],
    elbow: [600, -50, -300],
  });
}

/* ═══════════════════════════ the plucking hand ═══════════════════════════ */

/**
 * A plucking hand: a frame (instrument-frame directions), finger poses, the
 * thumb to a target worked out from the fingers, then the whole hand slid so
 * its striking point lands on `strike` (instrument frame).
 */
export function pluckingHand(
  sc: LuteScene,
  o: {
    along: [number, number, number];
    dorsal: [number, number, number];
    thumbSide: [number, number, number];
    fingers: FingerPose[];
    /** The thumb's target from the posed fingers (hand at the origin). */
    thumb: (sk: HandSkeleton) => V3;
    /** The striking point from the posed hand. */
    striker: (sk: HandSkeleton) => V3;
    strike: [number, number, number];
    /** Where the elbow goes (engine point; the arm's solution turns toward it). */
    pole: V3;
  },
): LuteArm & { plectrum: null } {
  const along = ID(sc, ...o.along);
  const dorsal = ID(sc, ...o.dorsal);
  const ts = ID(sc, ...o.thumbSide);
  const f0 = handFrame(v3(0, 0, 0), along, dorsal, ts);
  const sk0 = handOn(f0, o.fingers);
  const target = I(sc, ...o.strike);
  const shift = h3.sub(target, o.striker(sk0));
  const f = { ...f0, o: shift };
  const sk1 = handOn(f, o.fingers);
  const t = reachThumb(f, o.thumb(sk1));
  const sk: HandSkeleton = {
    ...sk1,
    thumb: thumbJoints(f, t.pose),
    miss: [...sk1.miss.slice(0, 4), t.miss],
  };
  const shoulder = sc.fit.shoulderR;
  const wrist = f.o;
  return {
    shoulder,
    elbow: elbowOf(shoulder, wrist, h3.sub(o.pole, shoulder)),
    wrist,
    sk,
    plectrum: null,
  };
}

/** A point on a finger's last bone (t along it) pushed out to its side `s` (−1 the thumb side) by its half-width. */
function onSide(
  sk: HandSkeleton,
  i: number,
  t: number,
  s: number,
  extra = 0,
): V3 {
  const j = sk.fingers[i].joints;
  const p = h3.add(j[2], h3.mul(h3.sub(j[3], j[2]), t));
  return h3.add(p, h3.mul(sk.frame.y, s * (sk.fingers[i].r[2] + extra)));
}
/** A finger's pad: its tip pushed toward the palm side by its half-width. */
function padOf(sk: HandSkeleton, i: number): V3 {
  const d = sk.fingers[i];
  return h3.sub(d.joints[3], h3.mul(h3.unit(d.dorsal[2]), d.r[3] * 0.4));
}

function oudPluck(sc: LuteScene): LuteArm & { plectrum: Plectrum } {
  // The hand hangs from the floating wrist: pointing down the face (+y) and
  // toward the neck (+x), a little in, its back to the audience; the thumb
  // toward the neck.
  const fingers: FingerPose[] = [
    { abd: -0.06, mcp: 0.62, pip: 1.42, dip: 0.5 },
    { abd: 0.0, mcp: 0.62, pip: 1.3, dip: 0.75 },
    { abd: 0.07, mcp: 0.68, pip: 1.35, dip: 0.8 },
    { abd: 0.16, mcp: 0.74, pip: 1.4, dip: 0.85 },
  ];
  // The risha runs from inside the curled hand (its back end against the
  // palm, toward the heel) out between the thumb's pad and the side of the
  // index's middle bone (the pinch), its tip ≈ 56 mm past it, to the strings.
  const pinch = (sk: HandSkeleton) => {
    const j = sk.fingers[0].joints;
    return h3.add(
      h3.add(j[1], h3.mul(h3.sub(j[2], j[1]), 0.55)),
      h3.mul(sk.frame.y, -(sk.fingers[0].r[1] + 2.5)),
    );
  };
  const palmEnd = (sk: HandSkeleton) =>
    h3.add(h3.add(sk.frame.o, h3.mul(sk.frame.x, 46)), h3.mul(sk.frame.z, -20));
  const rishaDir = (sk: HandSkeleton) =>
    h3.unit(h3.sub(pinch(sk), palmEnd(sk)));
  const tipOf = (sk: HandSkeleton) =>
    h3.add(pinch(sk), h3.mul(rishaDir(sk), 56));
  const arm = pluckingHand(sc, {
    along: [0.7, 0.7, -0.141],
    dorsal: [0.25, -0.055, 0.967],
    thumbSide: [1, 0, 0],
    fingers,
    thumb: (sk) =>
      h3.add(h3.add(pinch(sk), h3.mul(sk.frame.y, -8)), h3.mul(sk.frame.z, 4)),
    striker: tipOf,
    strike: [180, -10, 14],
    pole: v3(-174, -380, -310),
  });
  return {
    ...arm,
    plectrum: {
      kind: "risha",
      back: palmEnd(arm.sk),
      tip: tipOf(arm.sk),
      width: 9,
    },
  };
}

function sitarPluck(sc: LuteScene): LuteArm & { plectrum: Plectrum } {
  const g = sc.sitar!;
  // The hand over the strings just above the gourd: pointing across them
  // (+y) from the neck's upper edge, its back to the audience, the thumb
  // toward the nut (+x) resting on the upper edge.
  const fingers: FingerPose[] = [
    { abd: -0.04, mcp: 0.55, pip: 0.95, dip: 0.45 },
    { abd: 0.02, mcp: 0.85, pip: 1.45, dip: 0.9 },
    { abd: 0.08, mcp: 0.95, pip: 1.55, dip: 0.95 },
    { abd: 0.16, mcp: 1.05, pip: 1.6, dip: 0.98 },
  ];
  const arm = pluckingHand(sc, {
    along: [-0.1, 0.62, 0.78],
    dorsal: [0, -0.78, 0.62],
    thumbSide: [1, 0, 0],
    fingers,
    // The thumb's pad on the neck's upper edge, a little up the neck.
    thumb: () => I(sc, 196, -g.neck.half - 4, 6),
    // The mizrab's point: past the index's pad.
    striker: (sk) => {
      const j = sk.fingers[0].joints;
      return h3.add(j[3], h3.mul(h3.unit(h3.sub(j[3], j[2])), 9));
    },
    strike: [150, g.playedYs(150)[0], g.stringZ(150) + 1],
    pole: v3(-200, -150, -200),
  });
  const j = arm.sk.fingers[0].joints;
  const d = h3.unit(h3.sub(j[3], j[2]));
  return {
    ...arm,
    plectrum: {
      kind: "mizrab",
      back: h3.add(j[2], h3.mul(d, 4)),
      tip: h3.add(j[3], h3.mul(d, 9)),
      width: 3,
    },
  };
}

export function veenaPluck(
  sc: LuteScene,
  o: {
    wrist: [number, number, number];
    along: [number, number, number];
    pole: [number, number, number];
  } = VEENA_PLUCK,
): LuteArm & { plectrum: Plectrum } {
  const g = sc.veena!;
  // The forearm along the resonator's top, the hand pointing up the strings
  // toward the neck (+x) with its back up, the thumb toward the far side
  // (+y), the little finger toward the player. The index and middle pads
  // on two melody strings by the neck's start, the ring curled between, the
  // little finger over the board's near edge, toward the side (tala) strings.
  const A = h3.unit(v3(...o.along));
  const dI = h3.unit(h3.sub(v3(0, 0, 1), h3.mul(A, A.z)));
  const wrist = I(sc, ...o.wrist);
  const f0 = handFrame(
    wrist,
    ID(sc, A.x, A.y, A.z),
    ID(sc, dI.x, dI.y, dI.z),
    ID(sc, 0, 1, 0),
  );
  const pz = (x: number) => g.stringZ(x) + 6;
  const ys = g.melodyYs(140);
  const goals: DigitGoal[] = [
    I(sc, 150, ys[2], pz(150)),
    I(sc, 140, ys[1], pz(140)),
    { curl: 0.55, abd: 0.05 },
    I(sc, 104, -g.neck.half - 9, 2),
  ];
  // The thumb's pad down on the board's far edge, where its relaxed tip falls.
  const tN = toInst(sc, thumbJoints(f0, THUMB_REST).joints[3]);
  const thumb = I(sc, tN.x, Math.min(g.neck.half - 6, Math.max(18, tN.y)), 10);
  const shoulder = sc.fit.shoulderR;
  const elbow = elbowOf(shoulder, wrist, h3.sub(v3(...o.pole), shoulder));
  const x0 = f0.x;
  const sk = fitHand(f0, goals, thumb, {
    elbow,
    maxWrist: 60,
    curl: 0.9,
    keep: (f) => 1500 * (1 - h3.dot(f.x, x0)),
  });
  const j = sk.fingers[0].joints;
  const d = h3.unit(h3.sub(j[3], j[2]));
  return {
    shoulder,
    elbow,
    wrist,
    sk,
    plectrum: {
      kind: "picks",
      back: h3.add(j[2], h3.mul(d, 6)),
      tip: h3.add(j[3], h3.mul(d, 6)),
      width: 2,
    },
  };
}
/** The veena's plucking hand's place (instrument frame) and its elbow's way. */
export const VEENA_PLUCK = {
  wrist: [20, -20, 80] as [number, number, number],
  along: [1, 0.02, -0.3] as [number, number, number],
  pole: [-250, -100, -250] as [number, number, number],
};

/* ═══════════════════════════ the scene's hands ═══════════════════════════ */

const cache = new WeakMap<LuteScene, LuteHandsPose>();

/** Both hands and arms of a lute scene's player (cached per scene). */
export function luteHands(sc: LuteScene): LuteHandsPose {
  const hit = cache.get(sc);
  if (hit) return hit;
  const out: LuteHandsPose =
    sc.kind === "oud"
      ? {
          fret: oudFret(sc),
          pluck: oudPluck(sc),
          fretContact: [0, 1, 2, 4],
          pluckContact: [4],
        }
      : sc.kind === "sitar"
        ? {
            fret: sitarFret(sc),
            pluck: sitarPluck(sc),
            fretContact: [0, 1, 4],
            pluckContact: [4],
          }
        : {
            fret: veenaFret(sc),
            pluck: veenaPluck(sc),
            fretContact: [0, 1, 4],
            pluckContact: [0, 1, 3, 4],
          };
  cache.set(sc, out);
  return out;
}

/** The kinds, for callers that build their own scenes. */
export const LUTE_KINDS: readonly LuteKind[] = ["oud", "sitar", "veena"];

/**
 * EVERY POSED HAND of the lute family, for the anatomy tests (figure pass 3):
 * one pose per hand serves both views (it is posed in 3-D). `elbow` is the
 * arm's elbow in the same (engine) frame; `contact` the digits that touch
 * what they play (index 0 … little 3, thumb 4) — their pads land within
 * millimetres; `thumb` where the technique puts it.
 */
export function handCases(): {
  name: string;
  sk: HandSkeleton;
  elbow: V3;
  contact: number[];
  thumb?: "behind" | "free" | string;
}[] {
  const out: {
    name: string;
    sk: HandSkeleton;
    elbow: V3;
    contact: number[];
    thumb?: string;
  }[] = [];
  const THUMB: Record<LuteKind, { fret: string; pluck: string }> = {
    oud: { fret: "behind", pluck: "on the risha, over the index" },
    sitar: { fret: "behind", pluck: "on the neck’s upper edge" },
    veena: {
      fret: "on the neck’s near edge",
      pluck: "on the board’s far edge",
    },
  };
  for (const kind of LUTE_KINDS) {
    const H = luteHands(sceneOfKind(kind));
    out.push({
      name: `${kind} stopping hand (left)`,
      sk: H.fret.sk,
      elbow: H.fret.elbow,
      contact: H.fretContact,
      thumb: THUMB[kind].fret,
    });
    out.push({
      name: `${kind} plucking hand (right)`,
      sk: H.pluck.sk,
      elbow: H.pluck.elbow,
      contact: H.pluckContact,
      thumb: THUMB[kind].pluck,
    });
  }
  return out;
}
