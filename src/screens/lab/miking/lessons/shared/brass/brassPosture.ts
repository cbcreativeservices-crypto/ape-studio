/**
 * THE BRASS FAMILY'S POSTURE — one horn and its standing player, built in
 * frame H (brassSpec.ts) and turned into the LESSON frame, which keeps the
 * floor level: origin = the bell rim's centre, +x toward the audience, +y
 * down, +z to the player's right.
 *
 * Everything the art draws, the solids collide with and the zones are
 * measured from comes from here, so they agree:
 *   • the TUBES — every length of tubing as a centre line and a radius
 *     (bell tail, bell bow, leadpipe, tuning slides, valve slides; the
 *     trombone's slide legs, crook, bell section and gooseneck; the bass
 *     trombone's valve loops);
 *   • the VALVES (three piston casings and their buttons) or the ROTORS (the
 *     bass trombone's two, with the left thumb's triggers);
 *   • the SLIDE drawn at a position, and its travel to 7th (DERIVED);
 *   • the PLAYER — the bowed family's skeleton type, so the shared figure
 *     draws it — standing, lips on the mouthpiece, the hands on the horn
 *     (and the slide arm at 1st, 4th and 7th);
 *   • the HANDS (figure pass 3) — the shared 3-D hand (players/handModel.ts)
 *     posed on the horn: every pad on its button, hook, casing, tube or
 *     brace, the thumbs where the technique puts them, clear of the metal,
 *     the wrists within 70° of adult forearms (brassHands.ts lists them).
 *
 * Every placement that no source gives is a drawing default (the proposal's
 * numbers where it has them: trumpet/GEOMETRY_PROPOSAL.md §2, §4;
 * trombone/GEOMETRY_PROPOSAL.md §1–§2). Lips 1550 mm above the floor
 * (proposal §4, standing). Pure.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import type { Skeleton } from '../bowed/posture.ts';
import { elbowOf } from '../bowed/posture.ts';
import { fitHand, HAND, handFrame, handOn, inFrame, THUMB_REST, type DigitGoal, type HandSkeleton } from '../players/handModel.ts';
import { SLIDE, SLIDE_7TH, slideTravel, TENOR, type BrassSpec } from './brassSpec.ts';

const D = Math.PI / 180;
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export type TubeTone = 'brass' | 'nickel' | 'dark';
/** A length of tube: its centre line (lesson frame) and its outside radius. */
export type Tube = { id: string; part: string; pts: Vec3[]; r: number; tone?: TubeTone };

export type HornPose = {
  spec: BrassSpec;
  /** Frame H → lesson frame (the bell's dip turned about z). */
  H: (p: Vec3) => Vec3;
  /** The bell axis (unit, lesson frame): the way the bell fires. */
  axis: Vec3;
  /** "Up" across the bell (unit, lesson frame; −y when level). */
  up: Vec3;
  /** The floor's y (lesson frame). */
  floorY: number;
  tubes: Tube[];
  /** Piston casings: centre, radius, half-height along `up`, and the button on top. */
  valves: { c: Vec3; r: number; h: number; button: Vec3 }[];
  /** The bass trombone's rotors (axis ∥ z) and its thumb triggers. */
  rotors: { c: Vec3; r: number }[];
  triggers: Vec3[];
  mouthpiece: { cup: Vec3; shank: Vec3; r: number };
  lips: Vec3;
  /** The trombone's slide: travel drawn, the crook's centre at that travel,
   *  the brace (the right hand's grip), and the legs' y and z. */
  slide: null | { s: number; crook: Vec3; brace: Vec3; outerFrom: Vec3; legs: [number, number]; z: number; receiver: Vec3 };
  player: Skeleton;
  /** The right (slide) arm at 1st, 4th and 7th position. */
  slideArm: { hand: Vec3; elbow: Vec3; s: number }[];
  /** FIGURE PASS 3: each hand posed bone by bone on the horn (players/handModel.ts, lesson frame). */
  hands: { L: BrassHand; R: BrassHand };
};

/**
 * A hand posed on the horn (figure pass 3, owner 2026-10-15): the skeleton,
 * the elbow its forearm comes from, the digits that touch what they play
 * (0 index … 3 little, 4 thumb — each pad within millimetres of its key,
 * button, tube or brace) and where the thumb works.
 */
export type BrassHand = { sk: HandSkeleton; elbow: Vec3; contact: number[]; thumb: string };

/** The drawn arm (figure pass 3): an adult's upper arm (shoulder joint →
 *  elbow) and forearm (elbow → wrist crease), the house figure's lengths. */
export const ARM = { upper: 300, fore: 265 } as const;

/** A length of metal the hand must not pass through (a tube, a casing, a brace). */
export type Metal = { a: Vec3; b: Vec3; r: number };
function segDist(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const L2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
  const t = L2 > 1e-9 ? Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y + (p.z - a.z) * ab.z) / L2)) : 0;
  const q = add(a, scale(ab, t));
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
/**
 * How far a posed hand passes INTO the metal (sum of squared mm): each bone
 * sampled along its length at its own half-width, the palm's core and the
 * wrist. A contact digit's last bone may press its pad onto what it plays.
 */
export function handInMetal(sk: HandSkeleton, metal: readonly Metal[], contact: readonly number[] = [], skipThumb = false): number {
  let pen = 0;
  const probe = (p: Vec3, r: number) => {
    for (const m of metal) {
      const d = segDist(p, m.a, m.b) - (r + m.r);
      if (d < 0) pen += d * d;
    }
  };
  [...sk.fingers, sk.thumb].forEach((dg, di) => {
    if (skipThumb && di === 4) return;
    for (let k = 0; k < 3; k++) {
      const touching = k === 2 && contact.includes(di);
      for (const t of touching ? [0.1, 0.4] : [0.15, 0.5, 0.85]) {
        const ra = dg.name === 'thumb' && k === 0 ? dg.r[0] + 3 : dg.r[k];
        probe(add(dg.joints[k], scale(sub(dg.joints[k + 1], dg.joints[k]), t)), (ra * (1 - t) + dg.r[k + 1] * t) * 0.9);
      }
    }
  });
  for (const [x, y] of [[20, 0], [45, -16], [45, 16], [75, -24], [75, 0], [75, 22]] as const) probe(inFrame(sk.frame, x, y, 0), 12);
  return pen;
}

/** The metal of a horn pose (its tubes, casings and buttons). */
export function metalOf(tubes: readonly Tube[], valves: HornPose['valves'], up: Vec3): Metal[] {
  const out: Metal[] = [];
  for (const t of tubes) for (let i = 0; i < t.pts.length - 1; i++) out.push({ a: t.pts[i], b: t.pts[i + 1], r: t.r });
  for (const vv of valves) {
    out.push({ a: add(vv.c, scale(up, vv.h)), b: add(vv.c, scale(up, -vv.h)), r: vv.r });
    out.push({ a: add(vv.c, scale(up, vv.h)), b: vv.button, r: 3 });
  }
  return out;
}

/**
 * A hand fitted to the horn and its arm solved with it: the hand is turned
 * (and moved a little) about its wrist until every pad lands, the wrist
 * within 68° of the forearm, clear of the metal; the elbow then follows the
 * wrist (an adult upper arm and forearm, bent toward `pole`) — twice, so the
 * hand and the arm agree.
 */
export function poseHand(start: ReturnType<typeof handFrame>, fingers: readonly DigitGoal[], thumb: Vec3, shoulder: Vec3, pole: Vec3, metal: readonly Metal[], contact: number[], o: { curl?: number; slide?: number; dorsal?: Vec3; dorsalW?: number; keep?: (sk: HandSkeleton) => number; polish?: boolean; freeFirst?: boolean } = {}): { sk: HandSkeleton; elbow: Vec3 } {
  // Only the metal near the hand counts (a hand spans ≈ 190 mm from its wrist).
  const near = metal.filter((m) => segDist(start.o, m.a, m.b) < 260);
  let elbow = elbowOf(shoulder, start.o, ARM.upper, ARM.fore, pole);
  const dz = o.dorsal ? norm(o.dorsal) : null;
  // While the hand is turned, the thumb is held in reach of its target (its
  // saddle joint 45–88 mm from the pad's place: the thumb is ≈ 101 mm long)
  // and solved once at the end — its full search is the costly part.
  const T = HAND.thumb;
  const thumbKeep = (f: ReturnType<typeof handFrame>) => {
    const c = inFrame(f, T.cmc.x, T.cmc.y, T.cmc.z);
    const d = Math.hypot(thumb.x - c.x, thumb.y - c.y, thumb.z - c.z);
    return 6 * (Math.max(0, d - 88) ** 2 + Math.max(0, 45 - d) ** 2);
  };
  const noThumb = [...contact, 4];
  let frame = start;
  // (`freeFirst`: a first turn without the metal, so a hand that starts
  // tangled in a crowded spot can reach its places before it is kept clear.)
  const rounds = o.freeFirst ? 3 : 2;
  for (let round = 0; round < rounds; round++) {
    const clear = !o.freeFirst || round > 0;
    frame = fitHand(round === 0 ? start : frame, fingers, THUMB_REST, {
      elbow,
      slide: o.slide ?? 24,
      curl: o.curl ?? 1.1,
      keep: (f) => {
        const h = handOn(f, fingers, THUMB_REST);
        let c = (clear ? 40 * handInMetal(h, near, noThumb, true) : 0) + thumbKeep(f);
        if (dz) c += (o.dorsalW ?? 1500) * (1 - (f.z.x * dz.x + f.z.y * dz.y + f.z.z * dz.z));
        if (o.keep) c += o.keep(h);
        return c;
      },
    }).frame;
    elbow = elbowOf(shoulder, frame.o, ARM.upper, ARM.fore, pole);
  }
  // A last, fine turn with the thumb solved on its target (the pads and the
  // thumb land together) — only when a pad has not landed already.
  const missed = handOn(frame, fingers, thumb).miss;
  if (o.polish !== false && noThumb.some((d) => missed[d] > 2)) {
    frame = fitHand(frame, fingers, thumb, {
      elbow,
      slide: 6,
      curl: o.curl ?? 1.1,
      keep: (f) => {
        const h = handOn(f, fingers, THUMB_REST);
        let c = 40 * handInMetal(h, near, noThumb, true);
        if (dz) c += (o.dorsalW ?? 1500) * (1 - (f.z.x * dz.x + f.z.y * dz.y + f.z.z * dz.z));
        if (o.keep) c += o.keep(h);
        return c;
      },
    }).frame;
    elbow = elbowOf(shoulder, frame.o, ARM.upper, ARM.fore, pole);
  }
  return { sk: handOn(frame, fingers, thumb), elbow };
}
/** Each posed hand is solved once per horn (and per hand) — the search is
 *  the costly part; the pose is pure, so it is the same every time. */
const handCache = new Map<string, { sk: HandSkeleton; elbow: Vec3 }>();
function cached(key: string, solve: () => { sk: HandSkeleton; elbow: Vec3 }) {
  let h = handCache.get(key);
  if (!h) {
    h = solve();
    handCache.set(key, h);
  }
  return h;
}
/** A posed hand moved by d (the slide hand riding with the brace). */
function shiftHand(sk: HandSkeleton, d: Vec3): HandSkeleton {
  const mv = (p: Vec3) => add(p, d);
  const dig = (g: HandSkeleton['thumb']) => ({ ...g, joints: g.joints.map(mv) });
  return { ...sk, frame: { ...sk.frame, o: mv(sk.frame.o) }, fingers: sk.fingers.map(dig), thumb: dig(sk.thumb), palm: sk.palm.map(mv) };
}
/** The middle of the palm (the hand's grip point, for the keep-outs). */
const palmMid = (sk: HandSkeleton): Vec3 => inFrame(sk.frame, 62, 0, 0);
/** Standing heights above the floor (mm) — a drawing default adult. */
const H_ = { lips: 1550, head: 1630, neck: 1475, shoulder: 1420, chest: 1270, pelvis: 965, hip: 950, knee: 510, ankle: 82, toe: 24 };

/*
 * THE ELBOWS (figure pass 3): each follows its hand's wrist — an adult upper
 * arm (300) and forearm (265) bent toward a pole — so the drawn forearm ends
 * at the posed hand's wrist at its true length. (Before, a "hanging" elbow
 * 215 mm below the shoulder reached the hand point with a 390–460 mm
 * "forearm": the hand drawn at its end made the forearm far too long.) A
 * trumpeter's elbows come up and forward to valves held at the lips — the
 * right ≈ 25° below level, the left ≈ 45°; a trombonist's left elbow comes
 * in under the hand at the chin; at 1st position the slide arm folds, the
 * forearm rising to the brace.
 */

/** The shoulder joints of the standing player (as standingPlayer places them). */
function shouldersOf(lips: Vec3, floorY: number, zMid: number, shoulderFwd: number) {
  const y = floorY - H_.shoulder;
  return { L: v(lips.x - 130, y, zMid - 185), R: v(lips.x - 130 + shoulderFwd, y, zMid + 185) };
}

/** The player standing, lips at `lips`, facing +x; the hands (their palms)
 *  and the elbows supplied (solved with the posed hands). */
function standingPlayer(lips: Vec3, floorY: number, zMid: number, handL: Vec3, handR: Vec3, shoulderFwd: number, elbowL: Vec3, elbowR: Vec3): Skeleton {
  const Y = (h: number) => floorY - h;
  const x0 = lips.x;
  const head = v(x0 - 78, Y(H_.head), zMid);
  const neck = v(x0 - 110, Y(H_.neck), zMid);
  const chest = v(x0 - 150, Y(H_.chest), zMid);
  const pelvis = v(x0 - 150, Y(H_.pelvis), zMid);
  const shoulderL = v(x0 - 130, Y(H_.shoulder), zMid - 185);
  const shoulderR = v(x0 - 130 + shoulderFwd, Y(H_.shoulder), zMid + 185);
  return {
    head,
    headR: 105,
    face: norm(v(1, 0.18, 0)),
    neck,
    chest,
    pelvis,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL: v(x0 - 150, Y(H_.hip), zMid - 95),
    hipR: v(x0 - 150, Y(H_.hip), zMid + 95),
    kneeL: v(x0 - 125, Y(H_.knee), zMid - 105),
    kneeR: v(x0 - 125, Y(H_.knee), zMid + 105),
    ankleL: v(x0 - 155, Y(H_.ankle), zMid - 115),
    ankleR: v(x0 - 155, Y(H_.ankle), zMid + 115),
    toeL: v(x0 + 15, Y(H_.toe), zMid - 150),
    toeR: v(x0 + 15, Y(H_.toe), zMid + 150),
  };
}

/** An arc of points (frame H) about c, radius r, in the x–y plane, a0 → a1 (deg from +x toward +y). */
function arcXY(c: Vec3, r: number, a0: number, a1: number, n = 10): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D;
    out.push(v(c.x + r * Math.cos(a), c.y + r * Math.sin(a), c.z));
  }
  return out;
}
/** A smooth joining curve from a to b (frame H), leaving along da and arriving along db. */
function bend(a: Vec3, da: Vec3, b: Vec3, db: Vec3, k: number, n = 12): Vec3[] {
  const p1 = add(a, scale(norm(da), k));
  const p2 = sub(b, scale(norm(db), k));
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(add(add(scale(a, u * u * u), scale(p1, 3 * u * u * t)), add(scale(p2, 3 * u * t * t), scale(b, t * t * t))));
  }
  return out;
}

/* ── the VALVED horns: trumpet, flugelhorn ── */

export function valvedPose(spec: BrassSpec): HornPose {
  const dip = spec.dip.mm * D;
  const ax = v(Math.cos(dip), Math.sin(dip), 0);
  const upH = v(Math.sin(dip), -Math.cos(dip), 0); // frame H −y in the lesson frame
  const H = (p: Vec3): Vec3 => add(add(scale(ax, p.x), scale(upH, -p.y)), v(0, 0, p.z));
  const O = spec.overall.mm;
  const F = spec.flare.mm;
  const tr = spec.bore.mm / 2 + 1.2; // tube outside radius
  const flugel = spec.id === 'flugelhorn';
  // Drawing defaults, scaled from the proposal's trumpet (O 480: valves at −300).
  const xv = flugel ? -O * 0.6 : -O * 0.625; // the middle valve
  const pitch = 26; // casing spacing
  const yv = 22; // casing centre, below the bell axis
  const hv = 52; // casing half-height
  const zLead = 20; // the leadpipe, on the player's right of the valves
  const zBell = -20; // the bell tail, on the left
  const cupX = -O - (flugel ? 72 : 0);
  const yLead = -6;
  const bowX = flugel ? -O + 30 : -O + 42; // the bell bow, near the mouthpiece end
  const tubes: Tube[] = [];
  const T = (id: string, part: string, ptsH: Vec3[], r = tr, tone?: TubeTone) => tubes.push({ id, part, pts: ptsH.map(H), r, tone });
  // The bell tail: from the flare's start back to the bow (drawn by the bell itself in front of −F).
  T('bellTail', 'br.bell', [v(-F, 0, zBell * 0.4), v(bowX, 0, zBell)]);
  // The bell bow: a U down and forward under the valves.
  T('bellBow', 'br.bell', arcXY(v(bowX, 46, zBell), 46, 270, 90, 14));
  T('bellReturn', 'br.valves', [v(bowX, 92, zBell), v(xv - pitch - 12, 92, zBell * 0.5), v(xv - pitch, yv + hv - 6, 0)]);
  // The leadpipe: from the receiver forward past the valves to the main tuning slide.
  const recX = cupX + (flugel ? 62 : 70);
  const leadEnd = flugel ? xv - pitch - 40 : -O * 0.24;
  T('leadpipe', 'br.leadpipe', [v(recX, yLead, zLead), v(leadEnd, yLead, zLead)], tr * 0.92);
  if (!flugel) {
    // The main tuning slide: a U at the front, under the bell flare's start.
    T('mainSlide', 'br.slides', [...arcXY(v(leadEnd, yLead + 38, zLead), 38, 270, 450, 14).map((p) => v(leadEnd + (p.x - leadEnd), p.y, zLead)), v(xv + pitch + 6, yLead + 76, zLead * 0.6), v(xv + pitch, yv + 10, 0)]);
  } else {
    // A flugelhorn's tuning slide sits in the leadpipe: down into the valves.
    T('mainSlide', 'br.slides', bend(v(leadEnd, yLead, zLead), v(1, 0, 0), v(xv - pitch - 12, yv + 6, zLead * 0.5), v(1, 0.4, 0), 26));
  }
  // Valve slides: the 1st in front, the 3rd behind with its ring, the 2nd short, below.
  T('slide1', 'br.slides', [v(xv + pitch, yv + 30, 6), v(xv + pitch + 58, yv + 30, 6), v(xv + pitch + 58, yv + 58, 6), v(xv + pitch, yv + 58, 6)], tr * 0.9, 'nickel');
  T('slide3', 'br.slides', [v(xv - pitch, yv + 34, 6), v(xv - pitch - 76, yv + 34, 6), v(xv - pitch - 76, yv + 64, 6), v(xv - pitch, yv + 64, 6)], tr * 0.9, 'nickel');
  T('slide2', 'br.slides', [v(xv - 6, yv + hv, 4), v(xv - 6, yv + hv + 22, 4), v(xv + 6, yv + hv + 22, 4), v(xv + 6, yv + hv, 4)], tr * 0.85, 'nickel');
  // The finger hook (figure pass 3): a small ring standing on the leadpipe
  // just ahead of the 3rd valve, where the right little finger rests.
  const hookX = xv + pitch + 24;
  const hookTop = yLead - 22;
  const leadR = tr * 0.92;
  T('hook', 'br.leadpipe', [v(hookX - 6, yLead - leadR, zLead), v(hookX - 6, hookTop, zLead), v(hookX + 6, hookTop, zLead), v(hookX + 6, yLead - leadR, zLead)], 2, 'nickel');
  // The flare's start to the valves (the bell tube passing on the left).
  const valves = [-1, 0, 1].map((k) => {
    const c = H(v(xv + k * pitch, yv, 0));
    return { c, r: 12, h: hv, button: H(v(xv + k * pitch, yv - hv - 22, 0)) };
  });
  const cup = H(v(cupX, yLead, zLead));
  const shank = H(v(recX + 8, yLead, zLead));
  const lips = H(v(cupX - 8, yLead, zLead));
  const floorY = lips.y + H_.lips;
  // THE HANDS (figure pass 3, owner 2026-10-15), posed bone by bone and
  // fitted to the horn — frame-H targets turned into the lesson frame:
  const Hd = (d: Vec3): Vec3 => sub(H(d), H(v(0, 0, 0)));
  const metal = metalOf(tubes, valves, upH);
  const sh = shouldersOf(lips, floorY, lips.z, 0);
  const btnY = yv - hv - 22;
  //  • RIGHT: the index, middle and ring PADS on the 1st, 2nd and 3rd valve
  //    buttons (the 1st nearest the player), each pressing the pearl from
  //    above; the little finger on the finger hook; the THUMB under the
  //    leadpipe between the 1st and 2nd casings. The hand rises from the
  //    wrist beside the leadpipe, its back toward the player's right, the
  //    fingers arching over the casings onto the buttons.
  const padsR: DigitGoal[] = [-1, 0, 1].map((k) => H(v(xv + k * pitch, btnY - 3.4 - 7.6, 1)));
  padsR.push(H(v(hookX, hookTop - 2 - 6.9, zLead)));
  // (Its pad on the leadpipe's lower right, ≈ 68° round from straight below.
  // A flugelhorn's leadpipe ends behind the valves, where its tuning slide
  // turns down into them: the thumb rests against the casings there, at the
  // leadpipe's height, between the 1st and 2nd valves.)
  const ua = (68 * Math.PI) / 180;
  const under = Hd(v(0, (leadR + 9.6) * Math.cos(ua), (leadR + 9.6) * Math.sin(ua)));
  const thumbR = flugel ? H(v(xv - pitch / 2, yLead - 4, 12 + 9.6)) : add(H(v(xv - pitch / 2, yLead, zLead)), under);
  // (Art fix 2026-10-16, grading: "the valve hand floats above the caps like
  // a mitten".) The hand stands on the player's right of the valves, the
  // wrist low beside the casings, the knuckles just above and to the right
  // of the buttons: the fingers arch IN over the buttons from the side (a
  // trumpeter's curved fingers), so the back of the hand faces the player's
  // right and never rises far above the pearls.
  const alongR = norm(Hd(v(0.12, -0.7, -0.7)));
  const dorsalR = Hd(v(0.05, -0.55, 0.83));
  const fR = handFrame(sub(H(v(xv - 8, btnY + 4, 32)), scale(alongR, 96)), alongR, dorsalR, Hd(v(-1, 0, 0)));
  const R = cached(`${spec.id}:R`, () => poseHand(fR, padsR, thumbR, sh.R, v(0, 1, 0.7), metal, [0, 1, 2, 3, 4], { curl: 1.8, slide: 30, dorsal: dorsalR, dorsalW: 300 }));
  //  • LEFT: the hand round the valve casings below the bell tube — its palm
  //    against their left side, the index, middle and ring fingers wrapped
  //    round the front of the 3rd casing (pads on its far side), the little
  //    finger curled under; the THUMB up on the left of the 1st casing, at
  //    the 1st slide's saddle under the bell tube.
  const xF = xv + pitch;
  const padsL: DigitGoal[] = [H(v(xF + 14, yv - 8, 14)), H(v(xF + 14, yv + 8, 14)), H(v(xF + 14, yv + 23, 14)), { curl: 0.5 }];
  const thumbL = H(v(xv - pitch + 6, 18, -21.6));
  const alongL = norm(Hd(v(0.8, -0.5, 0.3)));
  const dorsalL = Hd(v(0, 0, -1));
  const fL = handFrame(sub(H(v(xF - 10, yv + 30, -26)), scale(alongL, 96)), alongL, dorsalL, Hd(v(-0.3, -1, 0)));
  const L = cached(`${spec.id}:L`, () => poseHand(fL, padsL, thumbL, sh.L, v(0, 1, -0.45), metal, [0, 1, 2, 4], { curl: 1.2, slide: 25, dorsal: dorsalL }));
  const handL = palmMid(L.sk);
  const handR = palmMid(R.sk);
  const player = standingPlayer(lips, floorY, lips.z, handL, handR, 0, L.elbow, R.elbow);
  return {
    spec,
    H,
    axis: ax,
    up: upH,
    floorY,
    tubes,
    valves,
    rotors: [],
    triggers: [],
    mouthpiece: { cup, shank, r: tr * 1.55 },
    lips,
    slide: null,
    player,
    slideArm: [],
    hands: {
      L: { sk: L.sk, elbow: L.elbow, contact: [0, 1, 2, 4], thumb: 'the 1st slide saddle, under the bell tube' },
      R: { sk: R.sk, elbow: R.elbow, contact: [0, 1, 2, 3, 4], thumb: 'under the leadpipe, between the 1st and 2nd valves' },
    },
  };
}

/* ── the SLIDE horns: tenor and bass trombone ── */

/** The trombone at slide travel `s` (mm; 0 = 1st position). */
export function slidePose(spec: BrassSpec, s = 0): HornPose {
  const H = (p: Vec3): Vec3 => p; // played level
  const tr = spec.bore.mm / 2 + 1.4;
  const F = spec.flare.mm;
  const zS = SLIDE.right.mm;
  const yU = SLIDE.below.mm; // the mouthpiece leg
  const yL = yU + SLIDE.spacing.mm; // the bell-side leg
  const ahead = SLIDE.ahead.mm;
  const cupX = ahead - SLIDE.closed.mm;
  const recX = cupX + 52;
  // The braces (figure pass 3): the inner slide's brace and the bell brace
  // just past the receiver, where the left hand holds; the outer slide's
  // brace (the right hand's grip) ≈ 50 mm in front of them at 1st — two
  // hands, side by side, never on one bar (both braces sat at one x before).
  const innerBraceX = recX + 10;
  const bellBraceX = recX + 12;
  const braceX = cupX + 110 + s; // the right hand's grip, on the outer slide
  const outerFrom = braceX - 22;
  const crookX = ahead + s;
  const back = -SLIDE.bellSection.mm;
  const bass = spec.id === 'bass';
  const tubes: Tube[] = [];
  const T = (id: string, part: string, pts: Vec3[], r = tr, tone?: TubeTone) => tubes.push({ id, part, pts, r, tone });
  // The bell section: tail back over the left shoulder to the tuning slide, and back to the gooseneck.
  T('bellTail', 'br.bell', [v(-F, 0, 0), v(back, 0, 0)], tr * 0.95);
  T('tuning', 'br.slides', [...arcXY(v(back, 32, 0), 32, 270, 90, 12), v(back + 10, 64, 0)], tr * 0.95, 'nickel');
  // The gooseneck: from the slide's bell-side leg, back and up across to the
  // return tube (it lies in the left hand's grip, with the inner slide).
  const gooseTo = v(recX - 36, 64, 0);
  T('gooseneck', 'br.bell', bend(v(recX + 6, yL, zS), v(-1, 0, 0), gooseTo, v(-1, 0, 0), 40, 14), tr * 0.95);
  T('bellReturn', 'br.bell', [gooseTo, v(back + 10, 64, 0)], tr * 0.95);
  // The inner slide (fixed): both legs from the receiver to the crook's travel.
  T('innerU', 'br.slide', [v(recX, yU, zS), v(outerFrom + 4, yU, zS)], tr * 0.9, 'nickel');
  T('innerL', 'br.slide', [v(recX + 6, yL, zS), v(outerFrom + 4, yL, zS)], tr * 0.9, 'nickel');
  // The outer slide (moves with s) and its crook.
  T('outerU', 'br.slide', [v(outerFrom, yU, zS), v(crookX, yU, zS)], tr * 1.05);
  T('outerL', 'br.slide', [v(outerFrom, yL, zS), v(crookX, yL, zS)], tr * 1.05);
  T('crook', 'br.slide', arcXY(v(crookX, (yU + yL) / 2, zS), (yL - yU) / 2, -90, 90, 14), tr * 1.05);
  // The braces: the slide's grip, the inner slide's brace and the bell brace.
  T('slideBrace', 'br.slide', [v(braceX, yU, zS), v(braceX, yL, zS)], 4.5, 'nickel');
  T('innerBrace', 'br.slide', [v(innerBraceX, yU, zS), v(innerBraceX, yL, zS)], 4, 'nickel');
  T('bellBrace', 'br.bell', [v(bellBraceX, yU - 4, zS - 4), v(bellBraceX, 4, 2)], 4, 'nickel');
  const rotors: { c: Vec3; r: number }[] = [];
  const triggers: Vec3[] = [];
  if (bass) {
    // Two rotors in the return tube behind the gooseneck, and their loops
    // hanging below the bell section (positions: drawing defaults).
    const r1 = v(back + 150, 64, 0);
    const r2 = v(back + 230, 64, 0);
    rotors.push({ c: r1, r: 21 }, { c: r2, r: 19 });
    T('loopF', 'br.valves', [r1, ...arcXY(v(r1.x + 10, r1.y + 78, -14), 78, 270, 630, 30).map((p) => v(p.x, p.y, p.z)), v(r1.x + 30, r1.y, -6)], tr * 0.95);
    T('loopGb', 'br.valves', [r2, ...arcXY(v(r2.x + 20, r2.y + 52, 18), 52, 250, 600, 24), v(r2.x + 26, r2.y, 8)], tr * 0.9);
    // The triggers' paddles where the left thumb rests by the bell brace
    // (figure pass 3: the thumb works them without leaving its hold).
    triggers.push(v(bellBraceX - 4, 90, 98), v(bellBraceX + 16, 100, 104));
  }
  const cup = v(cupX, yU, zS);
  const shank = v(recX + 6, yU, zS);
  const lips = v(cupX - 8, yU, zS);
  const floorY = lips.y + H_.lips;
  const handFor = (t: number) => v(cupX + 110 + t, (yU + yL) / 2 + 6, zS + 46);
  // THE HANDS (figure pass 3, owner 2026-10-15), posed bone by bone:
  const metal = metalOf(tubes, [], v(0, -1, 0));
  const sh = shouldersOf(lips, floorY, lips.z, 130);
  //  • LEFT — it holds the instrument: the INDEX along the mouthpiece
  //    receiver (its pad on the receiver's upper side), the middle, ring and
  //    little fingers round the inner slide's brace (pads on its far side),
  //    the THUMB round the bell brace above (on a bass trombone it rests
  //    there beside its triggers). A pistol grip: the hand points forward
  //    and up from a wrist under the chin, its back to the player's left.
  const bb = (t: number) => v(bellBraceX, yU - 4 + (4 - (yU - 4)) * t, zS - 4 + (2 - (zS - 4)) * t);
  const padsL: DigitGoal[] = [v(innerBraceX, yU + 1, zS - 16), v(innerBraceX, yU + 30, zS - 13), v(innerBraceX + 14, yL - 15, zS - 1), v(innerBraceX + 25, yL - 14, zS - 1)];
  const thumbL = bass ? add(triggers[0], v(-9, 0, 0)) : add(bb(0.22), v(-13.6, 0, 0));
  const alongL = norm(v(0.2, -0.95, 0.2));
  const fL = handFrame(sub(v(innerBraceX + 10, yL + 5, zS - 22), scale(alongL, 96)), alongL, v(0, 0, -1), v(-1, -0.3, 0));
  // (The gooseneck lies inside this grip, with the inner slide: not a clash.)
  const metalL = metal.filter((m) => !tubes.some((t) => t.id === 'gooseneck' && t.pts.some((q) => q === m.a)));
  const L = cached(`${spec.id}:L`, () => poseHand(fL, padsL, thumbL, sh.L, v(-0.3, 1, -0.6), metalL, [0, 1, 2, 3, 4], { curl: 1.2, slide: 30, dorsal: v(0, 0, -1), dorsalW: 800, freeFirst: true }));
  //  • RIGHT — light on the outer slide's brace: the thumb's pad behind it,
  //    the index and middle pads round its front, the ring and little
  //    fingers lightly on it below them; at 1st position the
  //    forearm rises from the elbow below, so the hand points up, its back
  //    to the player's right.
  const padsR: DigitGoal[] = [v(braceX + 8.8, yU + 16, zS - 8.8), v(braceX + 8.8, yU + 28, zS - 8.8), { curl: 0.6 }, { curl: 0.65 }];
  const thumbR = v(braceX - 12.5, yU + 25, zS + 2);
  const alongR = norm(v(0.3, -0.95, 0));
  const fR = handFrame(sub(v(braceX + 3, yU + 40, zS + 30), scale(alongR, 96)), alongR, v(0, 0, 1), v(-1, 0, 0));
  // Solved once with the slide at 1st; at another position the hand rides
  // with the brace (and the elbow follows it, straightening toward 7th). The
  // slide and its brace are the same on the bass trombone: one hold for both.
  if ((s !== 0 || spec.id !== TENOR.id) && !handCache.has(`${TENOR.id}:R`)) slidePose(TENOR, 0);
  const R0 = cached(`${TENOR.id}:R`, () => poseHand(fR, padsR, thumbR, sh.R, v(0, 1, 0.7), metal, [0, 1, 4], { curl: 1.2, slide: 30, dorsal: v(0, 0, 1), dorsalW: 800, freeFirst: true }));
  const skR = s === 0 ? R0.sk : shiftHand(R0.sk, v(s, 0, 0));
  const R = { sk: skR, elbow: s === 0 ? R0.elbow : elbowOf(sh.R, skR.frame.o, ARM.upper, ARM.fore, v(0, 1, 0.3)) };
  const handL = palmMid(L.sk);
  const player = standingPlayer(lips, floorY, lips.z, handL, palmMid(R.sk), 130, L.elbow, R.elbow);
  // The slide arm's keep-out at 1st, 4th and 7th (figure pass 3): the drawn
  // arm — the hand riding with the brace, the elbow solved for an adult arm
  // to its wrist (straight, pointing at it, where 7th is past the wrist's
  // reach and the fingertips hold the brace) — and the hand at the grip.
  const slideArm = [0, slideTravel(4), SLIDE_7TH].map((t) => {
    const hand = handFor(t);
    return { hand, elbow: t === 0 ? R0.elbow : elbowOf(player.shoulderR, add(R0.sk.frame.o, v(t, 0, 0)), ARM.upper, ARM.fore, v(0, 1, 0.3)), s: t };
  });
  return {
    spec,
    H,
    axis: v(1, 0, 0),
    up: v(0, -1, 0),
    floorY,
    tubes,
    valves: [],
    rotors,
    triggers,
    mouthpiece: { cup, shank, r: tr * 1.5 },
    lips,
    slide: { s, crook: v(crookX, (yU + yL) / 2, zS), brace: v(braceX, (yU + yL) / 2, zS), outerFrom: v(outerFrom, yU, zS), legs: [yU, yL], z: zS, receiver: v(recX, yU, zS) },
    player,
    slideArm,
    hands: {
      L: { sk: L.sk, elbow: L.elbow, contact: [0, 1, 2, 3, 4], thumb: bass ? 'on the F valve trigger' : 'round the bell brace' },
      R: { sk: R.sk, elbow: R.elbow, contact: [0, 1, 4], thumb: 'behind the outer slide brace' },
    },
  };
}

export function hornPose(spec: BrassSpec, s = 0): HornPose {
  return spec.kind === 'slide' ? slidePose(spec, s) : valvedPose(spec);
}

/** Sample points on the bell's surface ring at frame-H x (for the art and the solids). */
export function bellRing(P: HornPose, xH: number, r: number, n = 24): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(P.H(v(xH, r * Math.cos(a), r * Math.sin(a))));
  }
  return out;
}
