/**
 * THE KEYS AND PERCUSSION SEATS' HOLDS (figure V2, wave 6 of D78, Ensembles2,
 * 2026-11-24). Pure: no React, no Skia.
 *
 * The ensemble lessons draw a held instrument's player as the family figure on
 * a solved hold (ensembleHands.ts holdOf: one 3-D hand per arm, in the player's
 * frame — x right, y up from the standing surface, z forward). The seats the
 * Lab 5 holds did not cover get theirs here, the way the Players builder solved
 * them for the instrument lessons (shared/piano/pianistPlanV2 keysArm: each pad
 * on its key, the hand arched, the wrist level; the stick grip of the timpanist
 * and the mallet players: the stick across the palm from the heel out between
 * the thumb and the index, the fingers under it, the thumb's pad along its
 * side, the stick a continuation of the forearm):
 *   • piano, celesta — the hands ARCHED over five white keys (the right from
 *     just right of the middle up, the left a little below), the thumb along
 *     its key;
 *   • keys — the stage keyboard player STANDING at the keyboard on its X stand (BandArt: the keys 310–430 mm
 *     ahead, their top ≈ 966 mm): upright, the upper arms hanging a little forward, the forearms nearly level
 *     out to the hands arched on the keys as at the piano (an upright adult's elbows cannot come lower than
 *     about 1100 mm, so the forearms fall gently, ≈ 15–20°, to keys at that height);
 *   • harp — the hands on either side of the strings, the palms toward them,
 *     the thumbs up, the fingers curled from a pluck;
 *   • congas — the hands FLAT on the two heads (an open tone: the fingers
 *     together on the head, the palm near the rim);
 *   • perctable — the hands resting on the padded table's edge;
 *   • timpani — a mallet in each hand, its head a hand's width in from the rim
 *     nearest the player on the two middle drums (seating.ts TIMPANI_MALLETS,
 *     owner 2026-11-22);
 *   • percussion — the bass drum's player a beater in the right hand toward the
 *     right head, the left hand open near the left head to damp; the snare's
 *     player a stick in each hand over the snare;
 *   • marimba, vibraphone — a mallet in each hand, the heads over the bars.
 * Hand positions are the old drawings' (SeatingArt planSeat / elevSeat) where
 * they agreed, the instruments' own numbers where they did not; no instrument,
 * mic or measured point moves.
 */
import { fitHand, handFrame, handOn, h3, HAND, THUMB_REST, v3, type DigitGoal, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { bestElbow, SHOULDER, type Arm3, type Hold } from './ensembleHands.ts';
import { BASS_DRUM_STATION, TIMPANI_HEAD_H, TIMPANI_MALLETS, TIMPANI_MALLET_MM } from './seating.ts';
import { CONGA_DIMS } from '../../m04aCongas/model.ts';
import { ROWS } from '../mallets/malletSpec.ts';

const { add, sub, mul, dot, len, unit } = h3;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
/** (right, forward, up) → the player's frame. */
const L = (right: number, fwd: number, up: number): V3 => v3(right, up, fwd);

export type Kind2 = 'piano' | 'celesta' | 'keys' | 'harp' | 'congas' | 'perctable' | 'timpani' | 'percussion' | 'percussion2' | 'marimba' | 'vibraphone';
export const KIND2: readonly Kind2[] = ['piano', 'celesta', 'keys', 'harp', 'congas', 'perctable', 'timpani', 'percussion', 'percussion2', 'marimba', 'vibraphone'];

/** A stick the hand holds (mallet, beater, snare stick): its butt, the fulcrum in the fist, its head, the head's
 *  radius and look. */
export type Stick = { butt: V3; fulcrum: V3; head: V3; headR: number; kind: 'mallet' | 'yarn' | 'beater' | 'stick' };
export type Hold2 = Hold & { sticks: Stick[] };

const shoulders = (standing: boolean) => {
  const y = standing ? SHOULDER.standing : SHOULDER.seated;
  return { L: v3(-SHOULDER.half, y, 0), R: v3(SHOULDER.half, y, 0) };
};
function armOf(side: 'L' | 'R', S: V3, sk: HandSkeleton, contact: number[], thumb: string, at: V3): Arm3 {
  const wrist = sk.frame.o;
  return { side, shoulder: S, elbow: bestElbow(S, wrist, sk.frame.x, side === 'L' ? -1 : 1), wrist, sk, contact, thumb, at };
}

/* ── the hand arched over keys (keysArm's recipe, in the ensemble's frame) ── */
const WHITE = 23.5;
function keysHand(side: 'L' | 'R', S: V3, keyFront: number, keyTop: number): Arm3 {
  const s = side === 'R' ? 1 : -1;
  const x0 = s * 60;
  const xk = (k: number) => x0 + s * k * WHITE;
  const inn = [46, 54, 50, 36];
  const pad = (k: number, d: number): V3 => L(xk(k) - s * (k - 2.2) * 3, keyFront + d, keyTop + 6);
  const fingers: DigitGoal[] = [pad(1, inn[0]), pad(2, inn[1]), pad(3, inn[2]), pad(4, inn[3])];
  const thumb = L(xk(0) - s * 6, keyFront + 12, keyTop + 9);
  const along = unit(L(0, 1, -0.06));
  const wrist0 = L(xk(2.2), keyFront - 108, keyTop + 68);
  const elbow0 = bestElbow(S, sub(wrist0, mul(along, 20)), along, s);
  const sk = fitHand(handFrame(wrist0, along, v3(0, 1, 0), L(-s, 0, 0)), fingers, thumb, { elbow: elbow0, maxWrist: 22, slide: 14, curl: 1.0 });
  return armOf(side, S, sk, [0, 1, 2, 3, 4], 'along its key', L(xk(2), keyFront + 40, keyTop));
}

/* ── a hand flat on a surface (a conga head, a table): the fingers together, nearly straight ── */
function flatHand(side: 'L' | 'R', S: V3, at: V3, point: V3, surfaceY: number, curl = 0.18, slope = 0.08): Arm3 {
  const s = side === 'R' ? 1 : -1;
  const along = unit(sub(point, v3(0, 0, 0)));
  const a = unit(v3(along.x, -slope, along.z));
  // the hand's middle over `at`: the wrist a palm's length behind it, the back up, the palm on the surface
  const wrist = add(v3(at.x, surfaceY + 22, at.z), mul(a, -70));
  const f = handFrame(wrist, a, v3(0, 1, 0), v3(-s * a.z, 0, s * a.x));
  const sk = handOn(f, [{ curl, abd: -0.06 }, { curl, abd: -0.02 }, { curl, abd: 0.02 }, { curl, abd: 0.07 }], { ...THUMB_REST, yaw: 0.5, pitch: 0.2 });
  return armOf(side, S, sk, [], 'beside the index', v3(at.x, surfaceY, at.z));
}

/* ── the harp: the palm toward the strings, the thumb up, the fingers curled from a pluck ── */
function harpHand(side: 'L' | 'R', S: V3, at: V3): Arm3 {
  const s = side === 'R' ? 1 : -1;
  // (the hand carries on the forearm's line from the shoulder: the wrist straight)
  const along = unit(sub(at, add(S, L(s * 40, 0, -60))));
  const wrist = sub(at, mul(along, 75));
  const dorsal = v3(s, 0, 0);
  const f = handFrame(add(wrist, v3(s * 18, 0, 0)), along, dorsal, v3(0, 1, 0));
  const sk = handOn(f, [{ curl: 0.75 }, { curl: 0.85 }, { curl: 0.95 }, { curl: 1.05 }], { ...THUMB_REST, yaw: 0.3, pitch: 0.55, mcp: 0.1, ip: 0.1 });
  return armOf(side, S, sk, [], 'up, ready to pluck', at);
}

/* ── the stick grip: the stick across the palm from the heel out between the thumb and the index ── */
function stickHand(side: 'L' | 'R', S: V3, fulcrum: V3, head: V3, r = 7): Arm3 {
  const s = side === 'R' ? 1 : -1;
  const b = unit(sub(head, fulcrum));
  // (palm down, the back of the hand up; the hand's axis about 40° off the stick, out toward its own side)
  const outH = unit(v3(s, 0, 0));
  const up0 = v3(0, 1, 0);
  const up = unit(sub(up0, mul(b, dot(up0, b))));
  const out = unit(sub(outH, add(mul(b, dot(outH, b)), mul(up, dot(outH, up)))));
  const along = unit(add(mul(b, Math.cos(0.7)), mul(out, Math.sin(0.7))));
  const P = (tb: number, to: number, tu: number) => add(fulcrum, add(mul(b, tb), add(mul(out, to), mul(up, tu))));
  const pad = 8;
  // the four fingers round the stick's far side and under it, back toward the butt; the thumb's pad along its side
  const fingers: DigitGoal[] = [P(-6, -r - pad * 0.4, -r - pad * 0.5), P(-24, -r - pad * 0.5, -r - pad * 0.4), P(-40, -r - pad * 0.4, -r - pad * 0.3), P(-54, -r - pad * 0.2, -r - pad * 0.2)];
  const thumb = P(14, -r - 4, r * 0.4);
  const knuckles = P(-24, r + 10, r + 14);
  const wrist = sub(knuckles, mul(along, HAND.fingers[1].mcp.x - 4));
  const f0 = handFrame(wrist, along, up, mul(out, -1));
  const sk = fitHand(f0, fingers, thumb, { curl: 1.15, slide: 24, maxWrist: 40, elbow: bestElbow(S, wrist, along, s) });
  return armOf(side, S, sk, [0, 1, 4], 'along the stick', fulcrum);
}
const stickOf = (fulcrum: V3, head: V3, length: number, headR: number, kind: Stick['kind']): Stick => {
  const b = unit(sub(head, fulcrum));
  const tail = length - len(sub(head, fulcrum));
  return { butt: sub(fulcrum, mul(b, Math.max(40, tail))), fulcrum, head, headR, kind };
};

const cache = new Map<string, Hold2>();

/** The hold of a keys or percussion seat (null: not one of them). `second`: the percussion section's second
 *  station (the snare and cymbal) — the first is the bass drum's. */
export function hold2Of(kind: string, second = false): Hold2 | null {
  const k = (kind === 'percussion' && second ? 'percussion2' : kind) as Kind2;
  if (!(KIND2 as readonly string[]).includes(k)) return null;
  const hit = cache.get(k);
  if (hit) return hit;
  const out = solve(k);
  cache.set(k, out);
  return out;
}

function solve(k: Kind2): Hold2 {
  switch (k) {
    case 'piano':
    case 'celesta': {
      const S = shoulders(false);
      // (the old drawings' hands: about 360 mm ahead, 750–760 up — the key fronts a little behind them)
      const front = k === 'piano' ? 300 : 290;
      const top = k === 'piano' ? 735 : 725;
      return { L: keysHand('L', S.L, front, top), R: keysHand('R', S.R, front, top), sticks: [] };
    }
    case 'keys': {
      const S = shoulders(true);
      return { L: keysHand('L', S.L, 310, 966), R: keysHand('R', S.R, 310, 966), sticks: [] };
    }
    case 'harp': {
      const S = shoulders(false);
      return { L: harpHand('L', S.L, L(-100, 300, 1100)), R: harpHand('R', S.R, L(80, 260, 1000)), sticks: [] };
    }
    case 'congas': {
      // (the player leans in a little over the drums: the shoulders 110 mm lower and 90 mm forward — 30 in drums
      // stand below an upright player's reach)
      const S0 = shoulders(true);
      const S = { L: add(S0.L, v3(0, -110, 90)), R: add(S0.R, v3(0, -110, 90)) };
      const H = CONGA_DIMS.height.mm;
      // (each hand on its drum's head: the conga at the player's left, the tumba at the right; the palm near the
      // rim nearest the player, the fingers toward the middle)
      return { L: flatHand('L', S.L, L(-165, 330, 0), L(0.15, 1, 0), H, 0.18, 0.3), R: flatHand('R', S.R, L(165, 330, 0), L(-0.15, 1, 0), H, 0.18, 0.3), sticks: [] };
    }
    case 'perctable': {
      const S = shoulders(true);
      return { L: flatHand('L', S.L, L(-170, 290, 0), L(0.2, 1, 0), 880, 0.4, 0.4), R: flatHand('R', S.R, L(150, 290, 0), L(-0.2, 1, 0), 880, 0.4, 0.4), sticks: [] };
    }
    case 'timpani': {
      const S = shoulders(true);
      // each mallet's head on its drum a hand's width in from the near rim; the hand back along the mallet,
      // its length (360 mm) from the head, above the drum
      const sticks = TIMPANI_MALLETS.map((m) => {
        const head = L(m.head.u, -m.head.v, TIMPANI_HEAD_H + 18);
        const hp = L(m.hand.u, -m.hand.v, 0);
        const dh = Math.hypot(hp.x - head.x, hp.z - head.z);
        const rise = Math.sqrt(Math.max(0, (TIMPANI_MALLET_MM - 70) ** 2 - dh * dh));
        const fulcrum = v3(hp.x, head.y + rise, hp.z);
        return stickOf(fulcrum, head, TIMPANI_MALLET_MM, 18, 'mallet');
      });
      const [l, r] = sticks[0].head.x < sticks[1].head.x ? sticks : [sticks[1], sticks[0]];
      return { L: stickHand('L', S.L, l.fulcrum, l.head), R: stickHand('R', S.R, r.fulcrum, r.head), sticks: [l, r] };
    }
    case 'percussion': {
      const S = shoulders(true);
      // the beater (a 380 mm shaft, a fleece head ≈ 80 mm across) toward the right head, at about its middle
      const BD = BASS_DRUM_STATION;
      const head = L(BD.depth / 2 + 40, BD.ahead - 40, BD.up + 60);
      const fulcrum = L(190, 330, 980);
      const beater = stickOf(fulcrum, head, 380, 40, 'beater');
      // the left hand open beside the left head, ready to damp it
      const left = flatHand('L', S.L, L(-150, 380, 0), L(0.3, 1, 0), 950, 0.3);
      return { L: left, R: stickHand('R', S.R, fulcrum, head, 8), sticks: [beater] };
    }
    case 'percussion2': {
      const S = shoulders(true);
      // a stick in each hand over the snare (its head 820 mm up, 480 ahead, a little to the left)
      const tipL = L(-185, 470, 835);
      const tipR = L(-75, 470, 835);
      const fl = L(-150, 120, 960);
      const fr = L(40, 120, 960);
      const a = stickOf(fl, tipL, 410, 6, 'stick');
      const b = stickOf(fr, tipR, 410, 6, 'stick');
      return { L: stickHand('L', S.L, fl, tipL, 7), R: stickHand('R', S.R, fr, tipR, 7), sticks: [a, b] };
    }
    case 'marimba':
    case 'vibraphone': {
      const S = shoulders(true);
      const hb = (k === 'marimba' ? ROWS.marimba43 : ROWS.vibe).hBars.mm;
      const hy = hb + 140;
      const mk = (sx: number) => {
        const fulcrum = L(sx * 220, 300, hy);
        const head = L(sx * 300, 460, hb + 30);
        return stickOf(fulcrum, head, 380, 22, k === 'marimba' ? 'yarn' : 'mallet');
      };
      const l = mk(-1);
      const r = mk(1);
      return { L: stickHand('L', S.L, l.fulcrum, l.head, 6), R: stickHand('R', S.R, r.fulcrum, r.head, 6), sticks: [l, r] };
    }
  }
}

/**
 * (Ensembles3, 2026-11-24) THE BOW ARM INSIDE THE PLAYER'S OWN SPACE. A seated cellist's chair is ≈ 0.9 m from its
 * neighbour's on the quartet's and the orchestra's arcs; with the bow drawn out to its middle the frog — and the bow
 * hand on it — stood 320 mm out to the player's right, over the next player's instrument from above. The same hand
 * and bow, slid along the bow's own line until the contact point is `frogToContact` mm from the frog (the stroke
 * near the frog, a down-bow's start): the bow still crosses the strings at the same contact point, only the hand
 * and the elbow move in toward the player. Pure: a translated hand, its elbow re-solved.
 */
export function bowNearFrog(h: Hold, frogToContact: number): Hold {
  const R = h.R;
  const pts = h.pts;
  if (!R || !pts?.frog || !pts.contact || !pts.tip) return h;
  const now = len(sub(pts.contact, pts.frog));
  if (now <= frogToContact) return h;
  const b = unit(sub(pts.contact, pts.frog));
  const d = mul(b, now - frogToContact);
  const sk = shiftHand(R.sk, d);
  const wrist = sk.frame.o;
  const arm: Arm3 = { ...R, sk, wrist, at: add(R.at, d), elbow: bestElbow(R.shoulder, wrist, sk.frame.x, 1, { drop: 50, dropW: 1 }) };
  return { ...h, R: arm, pts: { ...pts, frog: add(pts.frog, d), tip: add(pts.tip, d) } };
}
function shiftHand(sk: HandSkeleton, d: V3): HandSkeleton {
  const m = (p: V3) => add(p, d);
  return {
    ...sk,
    frame: { ...sk.frame, o: m(sk.frame.o) },
    fingers: sk.fingers.map((f) => ({ ...f, joints: f.joints.map(m) })),
    thumb: { ...sk.thumb, joints: sk.thumb.joints.map(m) },
    palm: sk.palm.map(m),
  };
}

/** (tests) a hold's hands: every arm present, every wrist within reach of its shoulder. */
export function reachOk(h: Hold): boolean {
  for (const a of [h.L, h.R]) {
    if (!a) return false;
    if (len(sub(a.wrist, a.shoulder)) > 305 + 255 + 2) return false;
  }
  return true;
}
void cross;
