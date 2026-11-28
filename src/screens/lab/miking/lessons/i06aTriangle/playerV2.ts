/**
 * I06a TRIANGLE — the player in the approved look (figure roll-out, D78,
 * 2026-11-24; shared/metal/metalFigureV2). Pure.
 *
 * HELD (researched: Interlochen's percussion director "on my ring finger and
 * my thumb, like you're holding a glass of water or making a C"; the common
 * method: the clip's back on the thumb, its front on the middle finger, the
 * index on top to steady it, the ring and little fingers free to damp): the
 * LEFT hand holds the clip in front of the chest at about the shoulders'
 * height, the palm toward the clip from its left, the thumb round its back
 * (the player's side), the middle finger round its front, the index on top,
 * the ring and little fingers hanging relaxed beside the line, near the
 * triangle. The RIGHT hand holds the beater lightly near its end like a stick
 * (the approved stick grip: the thumb's pad on one side, the fingers round the
 * other), striking the base from the player's side.
 * MOUNTED: a beater in each hand (the front view draws both; the side view's
 * second beater lies exactly behind the first; from above only one is drawn,
 * so there the left arm hangs).
 *
 * Who plays (cast.ts ROLES 'metal.triangle'): Mei.
 */
import { v3, type V3 } from '../shared/players/handModel.ts';
import { armToDrawn, fittedArm, frameOf, gripMetalArm, hangArm, metalFig, standing, stickBack, type MetalArm, type MetalFig, type MetalView, type RodLook } from '../shared/metal/metalFigureV2.ts';
import { BEATER_BACK_DIR, drawnWrist } from '../shared/metal/metalHands.ts';
import { CLIP, CLIP_Y } from './geometry.ts';
import { HELD_BEATER, MOUNTED_BEATER, mirrorZ, type Beater3 } from './beaters.ts';

/** The player's neck over x = −362 (the old figure's), facing the audience. */
export const TRI_BODY = standing({ x0: -362, z0: 0, yaw: 0, nod: 8 });

/** The clip's centre (its block 22 × 22 × 34 mm). */
export const CLIP_C: V3 = v3(0, CLIP_Y + CLIP.h / 2, 0);
const CW = CLIP.w / 2;
const PAD = 7.5;

/** The left hand round the clip ("a C"). From above the whole hand lies over the triangle hanging below it (its
 *  cut under the clip); from the side and the audience the parts beyond the clip go behind it. */
export function clipArm(view: MetalView = 'side'): MetalArm {
  const C = CLIP_C;
  const along = v3(0.78, -0.36, 0.5);
  const knuckles = v3(C.x + 4, C.y + 2, C.z - 30);
  const a = Math.hypot(along.x, along.y, along.z);
  const o = v3(knuckles.x - (along.x / a) * 98, knuckles.y - (along.y / a) * 98, knuckles.z - (along.z / a) * 98);
  const f = frameOf(o, along, v3(-0.2, 0, -1), 'L');
  const arm = fittedArm(
    TRI_BODY,
    'L',
    f,
    [
      v3(C.x + 3, C.y - CLIP.h / 2 - PAD + 1, C.z - 3), // the index on top of the clip
      v3(C.x + CW + PAD, C.y - 2, C.z - 2), // the middle finger round its front
      { curl: 0.55, abd: 0.04 },
      { curl: 0.45, abd: 0.1 },
    ],
    v3(C.x - CW - PAD, C.y - 1, C.z - 3), // the thumb round its back
    { out: 150, down: 200, back: 60, maxWrist: 32, slide: 40, curl: 1.0 },
  );
  // (the thumb behind the clip from the audience, the fingers round its front; the palm beyond it from the side)
  return { ...arm, cutPt: view === 'top' ? v3(C.x, C.y + 80, C.z) : C };
}

/** (family batch 2026-11-25) from the player's right: the authored clip hand (figureV2/metalHandClipSide), its
 *  anchor on the clip's center, the arm laid to its wrist. */
export function clipSideArm(): MetalArm {
  const at = { u: CLIP_C.x, v: CLIP_C.y };
  const w = drawnWrist('clipSide', at, 0, false);
  return armToDrawn(TRI_BODY, 'L', clipArm('side'), 'side', { kind: 'clipSide', at, rot: 0, mirror: false }, w.cuff, w.fore);
}

/** (family batch 2026-11-25) from the player's right: the authored beater hand (figureV2/metalHandBeaterBack), its
 *  fulcrum where the posed grip closes (32 mm in from the grip end), turned so the beater leaves it along the
 *  lesson's own beater; the arm laid to its wrist. */
export function beaterSideArm(b: Beater3): MetalArm {
  const posed = beaterArm('R', b);
  const l = Math.hypot(b.tip.x - b.grip.x, b.tip.y - b.grip.y, b.tip.z - b.grip.z);
  const at = { u: b.grip.x + ((b.tip.x - b.grip.x) * 32) / l, v: b.grip.y + ((b.tip.y - b.grip.y) * 32) / l };
  const rot = Math.atan2(b.tip.y - b.grip.y, b.tip.x - b.grip.x) - Math.atan2(BEATER_BACK_DIR.v, BEATER_BACK_DIR.u);
  const w = drawnWrist('beaterBack', at, rot, false);
  return armToDrawn(TRI_BODY, 'R', posed, 'side', { kind: 'beaterBack', at, rot, mirror: false }, w.cuff, w.fore);
}

/** The beater held lightly near its end: the hand closes 32 mm in from the grip end (its cap just shows). */
export function beaterArm(hand: 'R' | 'L', b: Beater3): MetalArm {
  const g = b.grip;
  const t = b.tip;
  const l = Math.hypot(t.x - g.x, t.y - g.y, t.z - g.z);
  const k = 32 / l;
  const fulcrum = v3(g.x + (t.x - g.x) * k, g.y + (t.y - g.y) * k, g.z + (t.z - g.z) * k);
  // (review 2: the beater passes THROUGH the closed hand — the approved held grip, as M06 timpani)
  return gripMetalArm(TRI_BODY, hand, fulcrum, v3(t.x, t.y, t.z), v3(g.x, g.y, g.z), stickBack(TRI_BODY, hand), BEATER_LOOK);
}

/** The steel beater as art.tsx draws it (6 mm, STEEL). */
const BEATER_LOOK: RodLook = { d: 6, color: '#c9d0da', edge: '#555d6a' };

/** The player for one view of one way of playing. */
export function triFig(view: MetalView, variant: string): MetalFig {
  const held = variant !== 'mounted';
  return metalFig(`tri|${variant}|${view}`, view, () => {
    // (family batch 2026-11-25: from the player's right the clip hand and the beater hand are authored drawings)
    if (held) return { b: TRI_BODY, L: view === 'side' ? clipSideArm() : clipArm(view), R: view === 'side' ? beaterSideArm(HELD_BEATER) : beaterArm('R', HELD_BEATER) };
    const L = view === 'top' ? hangArm(TRI_BODY, 'L', true) : beaterArm('L', { grip: mirrorZ(MOUNTED_BEATER.grip), tip: mirrorZ(MOUNTED_BEATER.tip) });
    return { b: TRI_BODY, L, R: view === 'side' ? beaterSideArm(MOUNTED_BEATER) : beaterArm('R', MOUNTED_BEATER) };
  });
}
