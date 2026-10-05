/**
 * THE ELECTRIC PIANOS — drawing GEOMETRY (charter §2 layer 2): the outlines
 * every exterior drawing, hit test and label reads, built from keysSpec.ts
 * and wurliModel.ts. Pure; tested. mm.
 *
 *   tine piano, FRONT   u = z (across, bass at the left), v = y (floor 0, up −)
 *   tine piano, TOP     u = z, v = depth (the player's edge at the bottom, +)
 *   reed piano, FRONT   the player's view: u = z, v = y (frame W)
 *   reed piano, TOP     u = z, v = −x of frame W (the player at the bottom)
 *
 * Keys: a pattern of white and black keys at the drawing default's width;
 * the count is the instrument's (61, sourced) for the tine piano and only a
 * pattern for the reed piano (its key count is not stated in the lesson).
 */
import { RHODES, WHITE_KEY, WURLI } from './keysSpec.ts';
import { C_BASS, FACE_TOP, W } from './wurliModel.ts';

export type Rect = { u0: number; v0: number; u1: number; v1: number };
/** A keyboard's keys between a0 and a1 (across), front at bFront, back at
 *  bBack: rectangles in (a, b). `first` = the first white key's note (0 = C … 6 = B). */
export type KeyRects = { whites: Rect[]; blacks: Rect[] };

const HAS_BLACK = [true, true, false, true, true, true, false];

export function keyRects(a0: number, nWhite: number, kw: number, bFront: number, bBack: number, first: number): KeyRects {
  const whites: Rect[] = [];
  const blacks: Rect[] = [];
  const len = bFront - bBack;
  for (let i = 0; i < nWhite; i++) {
    whites.push({ u0: a0 + i * kw, v0: bBack, u1: a0 + (i + 1) * kw, v1: bFront });
    const note = (first + i) % 7;
    if (i < nWhite - 1 && HAS_BLACK[note]) {
      const c = a0 + (i + 1) * kw;
      blacks.push({ u0: c - kw * 0.29, v0: bBack, u1: c + kw * 0.29, v1: bBack + len * 0.62 });
    }
  }
  return { whites, blacks };
}

/* ── the tine piano (the 61-key passive model; size a drawing default) ── */
const RW = RHODES.stage.w.mm;
const RD = RHODES.stage.d.mm;
const RH = RHODES.stage.h.mm;
const CHEEK = (RW - RHODES.stage.whites * WHITE_KEY.mm) / 2;

export const RHODES_FRONT = (() => {
  const keyTop = -RHODES.keyTop.mm;
  const bottom = keyTop + 100;
  const top = bottom - RH;
  const half = RW / 2;
  return {
    half,
    cheek: CHEEK,
    top,
    bottom,
    keyTop,
    /** The keys' front faces and the foreshortened tops above them. */
    keyFace: { u0: -half + CHEEK, v0: keyTop, u1: half - CHEEK, v1: keyTop + 20 },
    keyTops: { u0: -half + CHEEK, v0: keyTop - 22, u1: half - CHEEK, v1: keyTop },
    nameRail: { u0: -half + CHEEK, v0: keyTop - 60, u1: half - CHEEK, v1: keyTop - 22 },
    lid: { u0: -half + 12, v0: top, u1: half - 12, v1: keyTop - 60 },
    slip: { u0: -half + CHEEK, v0: keyTop + 20, u1: half - CHEEK, v1: bottom },
    knobs: [-half + CHEEK + 40, -half + CHEEK + 92],
    jack: -half + CHEEK + 150,
    legs: [-half + 90, half - 90],
    pedal: { u: 140, w: 110, h: 50 },
  };
})();

export const RHODES_TOP = (() => {
  const half = RW / 2;
  const front = RD / 2;
  const keysFront = front - 12;
  const keysBack = keysFront - 150;
  return {
    half,
    front,
    back: -RD / 2,
    keys: keyRects(-half + CHEEK, RHODES.stage.whites, WHITE_KEY.mm, keysFront, keysBack, 0),
    keysBox: { u0: -half + CHEEK, v0: keysBack, u1: half - CHEEK, v1: keysFront },
    nameRail: { u0: -half + CHEEK, v0: keysBack - 34, u1: half - CHEEK, v1: keysBack },
    lid: { u0: -half + 14, v0: -RD / 2 + 14, u1: half - 14, v1: keysBack - 34 },
    knobs: [-half + CHEEK + 40, -half + CHEEK + 92],
    jack: -half + CHEEK + 150,
    railV: keysBack - 17,
  };
})();

/* ── the reed piano (frame W; every size a drawing default) ── */
const WH = WURLI.w.mm / 2;
/** White keys across the keyboard as a pattern (A at the left). */
const WURLI_WHITES = 38;
const WKW = (2 * (WH - 40)) / WURLI_WHITES;

export const WURLI_FRONT = (() => ({
  half: WH,
  keyTop: W.keyTopY,
  /** The keys seen from the seated player: tops (foreshortened) and front faces. */
  keyTops: { u0: -WH + 40, v0: W.keyTopY - 26, u1: WH - 40, v1: W.keyTopY },
  keyFace: { u0: -WH + 40, v0: W.keyTopY, u1: WH - 40, v1: W.keyBottomY },
  keys: keyRects(-WH + 40, WURLI_WHITES, WKW, W.keyTopY, W.keyTopY - 26, 5),
  /** The lid's front slope as the player sees it (foot to top). */
  face: { u0: -WH + 6, v0: W.caseTopY, u1: WH - 6, v1: W.faceFootY },
  /** The case below the keys. */
  body: { u0: -WH, v0: W.keyBottomY, u1: WH, v1: W.caseBottomY },
  /** Each grille: an oval seen face-on but tilted back (its height foreshortened). */
  grilles: [-W.spkZ, W.spkZ].map((z) => ({ u: z, v: C_BASS.y, a: 112, b: 112 * 0.5 * Math.cos(W.tilt) })),
  legs: [-W.legZ, W.legZ],
  knobs: [-WH + 22, -WH + 22],
  pedal: { u: 100, w: 100, h: 60 },
}))();

export const WURLI_TOP = (() => {
  // u = z; v = −x (the player at the bottom, +v).
  const keysFront = -W.keyFrontX;
  const keysBack = -W.faceFootX;
  return {
    half: WH,
    caseFront: -W.slipX,
    caseBack: -W.caseBackX,
    keys: keyRects(-WH + 40, WURLI_WHITES, WKW, keysFront, keysBack, 5),
    /** The lid's top and its front slope seen from above. */
    lidTop: { u0: -WH + 6, v0: -FACE_TOP.x, u1: WH - 6, v1: -W.caseBackX - 6 },
    slope: { u0: -WH + 6, v0: -W.faceFootX, u1: WH - 6, v1: -FACE_TOP.x },
    grilles: [-W.spkZ, W.spkZ],
  };
})();

/** The part under (u, v) in the tine piano's FRONT or TOP view. */
export function rhodesHit(view: 'front' | 'top', u: number, v: number, tol: number): string | null {
  if (view === 'front') {
    const F = RHODES_FRONT;
    if (Math.abs(u - F.pedal.u) <= F.pedal.w / 2 + tol && v >= -F.pedal.h - tol && v <= tol) return 'rh.pedal';
    if (Math.abs(Math.abs(u) - Math.abs(F.legs[1])) <= 30 + tol && v > F.bottom && v <= 0) return 'rh.legs';
    if (Math.abs(u - F.jack) <= 18 + tol && v >= F.nameRail.v0 - tol && v <= F.nameRail.v1 + tol) return 'rh.jack';
    if (F.knobs.some((k) => Math.abs(u - k) <= 20 + tol) && v >= F.nameRail.v0 - tol && v <= F.nameRail.v1 + tol) return 'rh.controls';
    if (v >= F.keyTops.v0 - tol && v <= F.keyFace.v1 + tol && Math.abs(u) <= F.half - F.cheek) return 'rh.keys';
    if (v >= F.top - tol && v <= F.nameRail.v0 && Math.abs(u) <= F.half) return 'rh.harp';
    return null;
  }
  const T = RHODES_TOP;
  if (Math.abs(u - T.jack) <= 18 + tol && Math.abs(v - T.railV) <= 18 + tol) return 'rh.jack';
  if (T.knobs.some((k) => Math.abs(u - k) <= 20 + tol) && Math.abs(v - T.railV) <= 20 + tol) return 'rh.controls';
  if (v >= T.keysBox.v0 - tol && v <= T.keysBox.v1 + tol && Math.abs(u) <= T.half) return 'rh.keys';
  if (v >= T.back - tol && v <= T.nameRail.v0 && Math.abs(u) <= T.half) return 'rh.harp';
  return null;
}

/** The part under (u, v) in the reed piano's FRONT view (the player's side). */
export function wurliFrontHit(u: number, v: number, tol: number): string | null {
  const F = WURLI_FRONT;
  if (Math.abs(u - F.pedal.u) <= F.pedal.w / 2 + tol && v >= -F.pedal.h - tol && v <= tol) return 'wur.pedal';
  for (const g of F.grilles) if (((u - g.u) / (g.a + tol)) ** 2 + ((v - g.v) / (g.b + tol)) ** 2 <= 1) return 'wur.grille';
  if (u <= -F.half + 50 + tol && v >= F.keyTops.v0 - 40 && v <= F.keyFace.v1 && u >= -F.half - tol) return 'wur.controls';
  if (v >= F.keyTops.v0 - tol && v <= F.keyFace.v1 + tol && Math.abs(u) <= F.half - 40) return 'wur.keys';
  if (v >= F.face.v0 - tol && v < F.face.v1 && Math.abs(u) <= F.half) return 'wur.lid';
  if (v > F.keyFace.v1 && v <= F.body.v1 + tol && Math.abs(u) <= F.half) return 'wur.case';
  if (F.legs.some((z) => Math.abs(u - z) <= 24 + tol) && v > F.body.v1 && v <= 0) return 'wur.legs';
  return null;
}
