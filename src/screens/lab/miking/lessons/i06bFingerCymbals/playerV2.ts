/**
 * I06b FINGER CYMBALS — the player in the approved look (figure roll-out,
 * D78, 2026-11-24; shared/metal/metalFigureV2). Pure.
 *
 * ORCHESTRAL (the lesson's own drawing and words: one cymbal held flat by its
 * strap, the other above it, tipped edge-first, dropped onto it; PAS: "held
 * parallel to the floor"): each cymbal hangs by its leather strap pinched
 * between the thumb's pad and the index finger's pad just above the bell, the
 * other fingers loosely curled — the left hand on the held cymbal from the
 * player's left, the right hand on the tipped one from the right. (The
 * face-on page keeps the approved hand-drum pinch hands at true size: they
 * wear the drummer's skin and sleeve, so the drummer plays this lesson.)
 * DANCE (the lesson's drawing: a pair on each hand, one on the thumb and one on
 * a finger): the hands raised before the shoulders, the palms toward the
 * audience, the fingers out and up, the thumb on top, the thumb's pad and the
 * middle finger's pad each under its cymbal's bell, closing toward each other;
 * the other fingers relaxed.
 * Each view's hands land on that view's own drawn cymbals and straps.
 *
 * Who plays (cast.ts ROLES 'metal.fingerCymbals'): the drummer.
 */
import { v3, type V3 } from '../shared/players/handModel.ts';
import { armToDrawn, fittedArm, frameOf, hangArm, metalFig, standing, type Body, type MetalArm, type MetalFig, type MetalView } from '../shared/metal/metalFigureV2.ts';
import { drawnWrist, turnFor, ZILL_EDGE_MIDDLE, ZILL_PALM_MIDDLE } from '../shared/metal/metalHands.ts';
import { P } from '../shared/figureV2/geom.ts';
import { DROP_C, DROP_TILT, HAND_L, HAND_R } from './geometry.ts';
import { FC, P0 } from './model.ts';

export const FC_BODY = standing({ x0: -362, z0: 0, yaw: 0, nod: 12 });
/** The dancer (the head a little up: the hands are raised). */
const DANCE_BODY = standing({ x0: -362, z0: 0, yaw: 0, nod: 0 });

/** The strap loop's top above a cymbal's centre (CymbalEdge's loop). */
const STRAP_TOP = -FC.h.mm * 0.7 - 6.5;
/** The strap's top on a cymbal at `c`, tipped `deg` in the picture's plane (side: (x, y); from the audience: (−z, y)). */
const strapAt = (c: V3, deg: number, plane: 'xy' | 'zy'): V3 => {
  const a = (deg * Math.PI) / 180;
  const du = -Math.sin(a) * STRAP_TOP;
  const dv = Math.cos(a) * STRAP_TOP;
  return plane === 'xy' ? v3(c.x + du, c.y + dv, c.z) : v3(c.x, c.y + dv, c.z - du);
};

/** A hand pinching a strap at `S` between the thumb's pad (the player's side) and the index's (the audience's),
 *  coming from the player's left (`hand` 'L') or right, the back of the hand up. */
export function pinchArm(b: Body, hand: 'R' | 'L', S: V3): MetalArm {
  const s = hand === 'R' ? 1 : -1;
  const o = v3(S.x - 62, S.y - 58, S.z + s * 112);
  const along = v3(S.x - o.x + 10, S.y - o.y + 30, S.z - o.z);
  const f = frameOf(o, along, v3(0, -1, 0), hand);
  const arm = fittedArm(b, hand, f, [v3(S.x + 6.5, S.y + 1, S.z), { curl: 0.7, abd: 0 }, { curl: 0.8, abd: 0.04 }, { curl: 0.85, abd: 0.1 }], v3(S.x - 6.5, S.y + 1, S.z), {
    out: 110,
    down: 260,
    back: 60,
    maxWrist: 30,
    slide: 40,
  });
  return { ...arm, cutPt: S };
}

/** A hand with a cymbal on the thumb and one on the middle finger: each pad 11 mm in from its cymbal's centre
 *  toward the hand (under the bell), the other fingers relaxed. `side` +1: the player's right. */
export function zillArm(b: Body, hand: 'R' | 'L', thumbCym: V3, fingerCym: V3, handAt: V3): MetalArm {
  const s = hand === 'R' ? 1 : -1;
  const toward = (c: V3) => {
    const d = v3(handAt.x - c.x, handAt.y - c.y, handAt.z - c.z);
    const l = Math.hypot(d.x, d.y, d.z) || 1;
    return v3(c.x + (d.x / l) * 11, c.y + (d.y / l) * 11, c.z + (d.z / l) * 11);
  };
  const T = toward(thumbCym);
  const M = toward(fingerCym);
  const mid = v3((T.x + M.x) / 2, (T.y + M.y) / 2, (T.z + M.z) / 2);
  // (the hand points from the shoulder's side toward its cymbals and a little up, the palm turned in, the thumb on
  // top: the cymbals sit on the thumb's and the middle finger's tips, the other fingers curled out of the way)
  const sh = hand === 'R' ? b.s.shoulderR : b.s.shoulderL;
  const d = v3(mid.x - sh.x, 0, mid.z - sh.z);
  const dl = Math.hypot(d.x, d.z) || 1;
  const along = v3(d.x / dl, -0.45, d.z / dl);
  const al = Math.hypot(along.x, along.y, along.z);
  const o = v3(mid.x - (along.x / al) * 150, mid.y - (along.y / al) * 150, mid.z - (along.z / al) * 150);
  const f = frameOf(o, along, v3(0, -0.2, s), hand);
  return fittedArm(b, hand, f, [{ curl: 0.6, abd: -0.06 }, M, { curl: 0.75, abd: 0.06 }, { curl: 0.8, abd: 0.12 }], T, { out: 230, down: 200, back: 260, maxWrist: 30, slide: 45, curl: 0.6 });
}

/** The top of an edge-on cymbal's dome on the page (art.tsx CymbalEdge: the dome 0.7 h above the plate, turned
 *  `deg`), where the thumb's or the finger's pad sits. */
export function domeTop(u: number, v: number, deg: number): { u: number; v: number } {
  const a = (deg * Math.PI) / 180;
  const dh = FC.h.mm * 0.7;
  return { u: u + Math.sin(a) * dh, v: v - Math.cos(a) * dh };
}

/** From the audience, the pair on one hand as art.tsx draws it (dancePair): the thumb's dome top, the finger's. */
export function dancePairTops(hand: 'R' | 'L'): { thumb: { u: number; v: number }; finger: { u: number; v: number } } {
  const H = hand === 'R' ? HAND_R : HAND_L;
  const a = -H.z;
  const b = H.y;
  const s = a >= 0 ? 1 : -1;
  return { thumb: domeTop(a + s * 10, b - 20, s * 80), finger: domeTop(a + s * 34, b + 10, s * 100) };
}

/** (from the audience) the authored zill hand on its pair: the thumb's tip on the upper cymbal's dome, turned so
 *  the curled middle fingertip lands on the lower one; the arm laid to the drawing's wrist. */
export function zillPalmArm(hand: 'R' | 'L', posed: MetalArm): MetalArm {
  const { thumb, finger } = dancePairTops(hand);
  const mirror = hand === 'R';
  const rot = turnFor(P(0, 0), ZILL_PALM_MIDDLE, thumb, finger, mirror);
  const drawn = { kind: 'zillPalm', at: thumb, rot, mirror };
  const w = drawnWrist('zillPalm', thumb, rot, mirror);
  return armToDrawn(DANCE_BODY, hand, posed, 'front', drawn, w.cuff, w.fore);
}

/** (from the player's right) the authored zill hand seen along its little-finger edge, on the pair art.tsx draws
 *  for that hand (sideArt: the far hand at its own point, the near one 30 forward and 20 up). */
export function zillEdgeArm(hand: 'R' | 'L', posed: MetalArm): MetalArm {
  const a = hand === 'R' ? HAND_R.x + 30 : HAND_L.x;
  const b = hand === 'R' ? HAND_R.y - 20 : HAND_L.y;
  const thumb = domeTop(a + 8, b - 16, -70);
  const finger = domeTop(a + 14, b + 14, -110);
  const rot = turnFor(P(0, 0), ZILL_EDGE_MIDDLE, thumb, finger, false);
  const w = drawnWrist('zillEdge', thumb, rot, false);
  return armToDrawn(DANCE_BODY, hand, posed, 'side', { kind: 'zillEdge', at: thumb, rot, mirror: false }, w.cuff, w.fore);
}

/** The dance pictures' cymbals: (thumb's, finger's) centres per hand, as each view draws them. */
function danceCyms(view: MetalView, hand: 'R' | 'L'): { t: V3; m: V3; at: V3 } {
  const H = hand === 'R' ? HAND_R : HAND_L;
  const sz = hand === 'R' ? 1 : -1;
  if (view === 'side') {
    // (side: the far hand at its own point, the near one 30 forward and 20 up — the old drawing's)
    const a = hand === 'R' ? H.x + 30 : H.x;
    const bb = hand === 'R' ? H.y - 20 : H.y;
    return { t: v3(a + 8, bb - 16, sz * 340), m: v3(a + 14, bb + 14, sz * 364), at: v3(a - 20, bb + 10, sz * 300) };
  }
  if (view === 'front') {
    // (from the audience: u = −z; the screen-right hand is the player's left, s = +1 there)
    const u = -H.z;
    const sg = u >= 0 ? 1 : -1;
    const t = v3(60, H.y - 20, -(u + sg * 10));
    const m = v3(60, H.y + 10, -(u + sg * 34));
    return { t, m, at: v3(30, H.y + 10, -(u - sg * 30)) };
  }
  return { t: v3(H.x + 20, H.y - 20, sz * 322), m: v3(H.x + 26, H.y + 8, sz * 344), at: v3(H.x - 10, H.y + 10, sz * 290) };
}

/** The player for one view of one way of playing. `ghostZ`: one of the dance route's faint dancers (from above). */
export function fcFig(view: MetalView, variant: string, ghostZ?: number): MetalFig {
  if (variant === 'dance') {
    if (ghostZ !== undefined) {
      return metalFig(`fc|ghost|${ghostZ}`, view, () => {
        const b = standing({ x0: -362, z0: ghostZ, yaw: 0, nod: 0 });
        return { b, L: hangArm(b, 'L', true), R: hangArm(b, 'R', true) };
      });
    }
    return metalFig(`fc|dance|${view}`, view, () => {
      const l = danceCyms(view, 'L');
      const r = danceCyms(view, 'R');
      const L = zillArm(DANCE_BODY, 'L', l.t, l.m, l.at);
      const R = zillArm(DANCE_BODY, 'R', r.t, r.m, r.at);
      // (family batch 2026-11-25: from the audience each hand is the authored zill hand, palm toward the audience;
      // from the side, the same hand seen along its little-finger edge)
      if (view === 'front') return { b: DANCE_BODY, L: zillPalmArm('L', L), R: zillPalmArm('R', R) };
      if (view === 'side') return { b: DANCE_BODY, L: zillEdgeArm('L', L), R: zillEdgeArm('R', R) };
      return { b: DANCE_BODY, L, R };
    });
  }
  return metalFig(`fc|held|${view}|${FC_LEFT_PINCH_FROM_ABOVE ? 'pinch' : 'under'}`, view, () => {
    const held = strapAt(v3(P0.x, P0.y, P0.z), 0, 'xy');
    const drop = strapAt(DROP_C, -DROP_TILT, 'xy');
    return { b: FC_BODY, L: FC_LEFT_PINCH_FROM_ABOVE ? pinchArm(FC_BODY, 'L', held) : underArm(FC_BODY), R: pinchArm(FC_BODY, 'R', drop) };
  });
}

/**
 * OWNER'S RULING (D78, the stroke a learner sees): the orchestral pair's LOWER (held-flat) cymbal in the left
 * hand. true (the new default, as the face-on page shows it): the strap pinched from above between the thumb's
 * and the index's pads. false (the old side view's place, the hand under the cymbal): the cymbal lying flat on
 * the left hand's fingers, the palm up, the thumb's pad on its rim from above (thumb opposite the fingers).
 */
export const FC_LEFT_PINCH_FROM_ABOVE = true;

/** (FC_LEFT_PINCH_FROM_ABOVE false) the left hand under the held cymbal, palm up, the plate on the fingers. */
export function underArm(b: Body): MetalArm {
  const y = P0.y + 4; // the flange's underside
  const along = v3(0.55, 0, 0.83);
  const o = v3(P0.x - 0.55 * 95 - 10, y + 22, P0.z - 0.83 * 95 - 6);
  const f = frameOf(o, along, v3(0, 1, 0), 'L');
  const arm = fittedArm(
    b,
    'L',
    f,
    [v3(P0.x + 14, y + 7, P0.z + 4), v3(P0.x + 4, y + 7, P0.z + 14), v3(P0.x - 8, y + 7, P0.z + 16), { curl: 0.35, abd: 0.12 }],
    v3(P0.x + 12, P0.y - 5, P0.z - 20), // the thumb's pad on the plate's rim from above
    { out: 120, down: 280, back: 60, maxWrist: 30, slide: 40, curl: 0.4, dipRatio: 0.5 },
  );
  return { ...arm, cutPt: v3(P0.x, P0.y - 2, P0.z) };
}

/** The ghosts' places on the dance route (from above). */
export const GHOST_Z = [-FC.route.mm * 0.75, FC.route.mm * 0.75] as const;
