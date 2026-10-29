/**
 * The HAND PLANS' layout (HandPlan.tsx draws it) — pure, so the plans'
 * overlap test (test/mikingPlanCollisions_20261015) reads the same numbers
 * the drawing uses. Used by M12 Tonbak, M13 Tabla, I06a/b/c, I12 and
 * A10/A11 (HandSetting in handPages.tsx).
 *
 * Frame: the lesson's own top view (u = x toward the audience, right on
 * screen; v = z, the player's right, down on screen), mm. Positions are a
 * typical layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: "no collisions or impossible layering in
 * ANY plan"): the louder neighbors sit UPSTAGE of the player, behind them
 * (clear of a dancer's route), their amp behind them; the PA stands on the
 * deck's downstage corners, clear of the front row; the front row keeps a
 * centre aisle (where its name sits) and the whole row stays inside the
 * plan; the wedges are the shared floor wedge (KitPlan WedgePlan, 600 × 420),
 * and a wedge with no glyph (A10's harp amp, drawn by the lesson) is not
 * drawn twice. STUDIO (owner 2026-10-15): no wedges — each performer's
 * personal headphone mixer at their station, fed from the CONTROL ROOM at
 * the room's edge (monitoring/cueMix.ts); the room holds the whole
 * performer (and a dancer's whole route).
 */
import type { VariantId, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { chairRowFacingStage, frontRowAt } from '../../../../../../features/lab/audienceChairsModel.ts';
import { chairFoots, foot, rectAround, unionRect, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueWall } from '../monitoring/cueMix.ts';
import { AMP as A10_AMP, H0 as A10_H0 } from '../../a10Harmonica/model.ts';
import { BODY as A11_BODY } from '../../a11Accordion/model.ts';
import { frameW, GONG, PLAYER as GONG_PLAYER, radiusOf } from '../../i12Gong/model.ts';
import { FC } from '../../i06bFingerCymbals/model.ts';

export type HandScene = 'stage' | 'studio';

/* ── the stage ── */

/** The plan boxes (mm). The stage reaches past the front row's chairs and
 *  the side fills' far edges; the studio room holds the whole performer. */
export const HAND_STAGE_BOX: ViewBox = { u0: -1300, u1: 4250, v0: -1800, v1: 2000 };
/** The stage deck's downstage edge (the audience floor beyond). */
export const DECK_EDGE_U = 2400;
/** A head icon in this plan, crown→chin, mm (a real head ≈ 230 mm). */
export const PLAN_HEAD_MM = 230;
/** The louder neighbors: two seated players upstage of the player, on the
 *  player's left (−v), seen as head icons facing the audience (+u). */
export const BAND_HEADS = [
  { u: -820, v: -1350 },
  { u: -820, v: -720 },
] as const;
/** Their amp, behind them (upstage) between them, facing the audience:
 *  a combo seen from above, 240 deep × 460 wide. */
export const BAND_AMP: PlanRect = { u0: -1260, u1: -1020, v0: -1265, v1: -805 };
/** The PA: a compact stack on each of the deck's downstage corners (400 × 400). */
export const PA_RECTS: readonly PlanRect[] = [
  { u0: DECK_EDGE_U - 440, u1: DECK_EDGE_U - 40, v0: -1720, v1: -1320 },
  { u0: DECK_EDGE_U - 440, u1: DECK_EDGE_U - 40, v0: 1520, v1: 1920 },
];
/** The front row (true-size chairs facing the stage) and its centre aisle. */
export const AUDIENCE_ROW = { u: frontRowAt(DECK_EDGE_U), v0: -1500, v1: 1700, aisleV: 100, aisle: 300 } as const;
export const outsideAisle = (c: { y: number }) => Math.abs(c.y - AUDIENCE_ROW.aisleV) >= AUDIENCE_ROW.aisle;
export function handChairs(): { x: number; y: number; rotation: number }[] {
  return chairRowFacingStage(AUDIENCE_ROW.u, AUDIENCE_ROW.v0, AUDIENCE_ROW.v1).filter(outsideAisle);
}
const headRect = (h: { u: number; v: number }): PlanRect => ({ u0: h.u - 125, u1: h.u + 125, v0: h.v - 125, v1: h.v + 125 });

/* ── the studio ── */

/** The studio room's inner wall faces (the wall is drawn 40 mm thick
 *  outside them). A dancer's route needs the long room. */
export const HAND_ROOM: PlanRect = { u0: -1250, u1: 1800, v0: -1400, v1: 1050 };
export const HAND_ROOM_DANCE: PlanRect = { u0: -1250, u1: 1800, v0: -1750, v1: 1750 };
const grow = (r: PlanRect, d: number): ViewBox => ({ u0: r.u0 - d, u1: r.u1 + d, v0: r.v0 - d, v1: r.v1 + d });

/* ── the lessons ── */

export type HandLessonId = 'M12' | 'M13' | 'I06a' | 'I06b' | 'I06c' | 'I12' | 'A10' | 'A11';
export const HAND_LESSON_IDS: readonly HandLessonId[] = ['M12', 'M13', 'I06a', 'I06b', 'I06c', 'I12', 'A10', 'A11'];
export const isHandLesson = (id: string): id is HandLessonId => (HAND_LESSON_IDS as readonly string[]).includes(id);
/** The finger cymbals' DANCE: the dancer moves along a route across the stage. */
export const isDance = (id: string, v: VariantId) => id === 'I06b' && v === 'dance';

export function handPlanBox(id: string, scene: HandScene, v: VariantId): ViewBox {
  return scene === 'stage' ? HAND_STAGE_BOX : grow(handRoom(id, v), 150);
}
export function handRoom(id: string, v: VariantId): PlanRect {
  return isDance(id, v) ? HAND_ROOM_DANCE : HAND_ROOM;
}

/** The performer's group (they and what they hold or sit on: one assembly). */
export const PLAYER_GROUP = 'player';
/** The metal family's standing player (shared/metal playerTop + reach). */
const METAL_PLAYER: PlanRect = { u0: -560, u1: -240, v0: -290, v1: 290 };
/** The dance: the route's half length, where the two faint ghosts stand. */
const ROUTE = FC.route.mm;

/** The gong in its frame (I12): the plate with its swing, the top bar and
 *  the two feet, front to back. */
function gongFoots(v: VariantId): PlanFoot[] {
  const R = radiusOf(v);
  const W = frameW(v) / 2;
  const F = GONG.feet.mm / 2;
  const P = GONG.post.mm / 2;
  const sw = GONG.swing.mm;
  const g = { group: 'gong' };
  return [
    foot('gong', 'instrument', { u0: -GONG.rim.mm - sw, u1: (v === 'bossed' ? GONG.bossH.mm : GONG.dome.mm) + sw, v0: -R, v1: R }, g),
    foot('gongBar', 'frame', { u0: -P, u1: P, v0: -W - P, v1: W + P }, g),
    foot('gongFoot0', 'frame', { u0: -F, u1: F, v0: -W - P, v1: -W + P }, g),
    foot('gongFoot1', 'frame', { u0: -F, u1: F, v0: W - P, v1: W + P }, g),
  ];
}

/** The performer (and what they hold, play or sit on) from above: the plan
 *  items' own boxes, the drawing's true extents. */
export function performerFoots(id: HandLessonId, v: VariantId): PlanFoot[] {
  const g = { group: PLAYER_GROUP };
  switch (id) {
    case 'M12':
      return [
        foot('player', 'player', { u0: -720, u1: -240, v0: -300, v1: 300 }, g),
        foot('chair', 'chair', { u0: -420, u1: 220, v0: -340, v1: 300 }, g),
        foot('drum', 'instrument', { u0: -200, u1: 200, v0: -460, v1: 120 }, g),
      ];
    case 'M13':
      return [
        foot('player', 'player', { u0: -780, u1: -200, v0: -480, v1: 480 }, g),
        foot('bayan', 'instrument', { u0: -160, u1: 200, v0: -320, v1: -30 }, g),
        foot('dayan', 'instrument', { u0: -160, u1: 200, v0: 30, v1: 290 }, g),
      ];
    case 'I06a':
      return [foot('player', 'player', METAL_PLAYER, g), foot('triangle', 'instrument', { u0: -100, u1: 70, v0: -200, v1: 200 }, g)];
    case 'I06c':
      return [foot('player', 'player', METAL_PLAYER, g), foot('row', 'instrument', { u0: -60, u1: 60, v0: -220, v1: 260 }, g)];
    case 'I06b':
      if (isDance(id, v)) {
        // The dancer mid-route with both hands out, and the same dancer
        // shown faintly at two other points of the route.
        return [
          foot('player', 'player', { u0: -560, u1: 110, v0: -380, v1: 380 }, g),
          foot('ghost0', 'player', { u0: -560, u1: -200, v0: -ROUTE * 0.75 - 260, v1: -ROUTE * 0.75 + 260 }, g),
          foot('ghost1', 'player', { u0: -560, u1: -200, v0: ROUTE * 0.75 - 260, v1: ROUTE * 0.75 + 260 }, g),
          foot('route', 'route', { u0: -60, u1: 60, v0: -ROUTE, v1: ROUTE }, { ...g, zone: true }),
          // the dancer's moving space along the route: nothing else stands in it
          foot('danceSpace', 'keepClear', { u0: -560, u1: 120, v0: -ROUTE - 60, v1: ROUTE + 60 }, { ...g, zone: true }),
        ];
      }
      return [foot('player', 'player', METAL_PLAYER, g), foot('pair', 'instrument', { u0: -240, u1: 110, v0: -170, v1: 210 }, g)];
    case 'I12': {
      // The player beside the struck face, facing it (the mallet is in the air).
      const P = GONG_PLAYER;
      return [foot('player', 'player', { u0: P.x - 160, u1: P.x + 170, v0: P.z - 260, v1: P.z + 260 }, g), ...gongFoots(v)];
    }
    case 'A10': {
      // The player in front of their harp amp and off its axis; the amp (the
      // lesson's own drawing at the origin) is its own object.
      const H = A10_H0;
      return [
        foot('player', 'player', { u0: H.x - 330, u1: H.x + 160, v0: H.z - 270, v1: H.z + 270 }, g),
        foot('harpAmp', 'amp', { u0: A10_AMP.box.x0, u1: A10_AMP.box.x1, v0: A10_AMP.box.z0, v1: A10_AMP.box.z1 }),
      ];
    }
    case 'A11':
      // The standing player with the accordion; the bass side's whole pull.
      return [foot('player', 'player', { u0: A11_BODY.backX - 30, u1: 40, v0: -880, v1: 260 }, g)];
  }
}

/** The performer's head (the headphones go on it) and the way they face. */
export function performerHead(id: HandLessonId, v: VariantId): { u: number; v: number; facing: number } {
  void v;
  switch (id) {
    case 'M12':
      return { u: -470, v: 0, facing: 0 };
    case 'M13':
      return { u: -570, v: 0, facing: 0 };
    case 'I06a':
    case 'I06b':
    case 'I06c':
      return { u: -360, v: 0, facing: 0 };
    case 'I12':
      return { u: GONG_PLAYER.x, v: GONG_PLAYER.z, facing: Math.PI };
    case 'A10':
      return { u: A10_H0.x - 90, v: A10_H0.z, facing: 0 };
    case 'A11':
      return { u: A11_BODY.headC.x, v: A11_BODY.headC.z, facing: 0 };
  }
}

/** Where each performer's headphone mixer stands, and the wall its feed
 *  runs to: beside them on the side away from the hands' work (the drum's
 *  head, the struck face, the mallet, the keyboard and the bass side), clear
 *  of them, inside the room. */
const STATION: Record<HandLessonId, { at: { u: number; v: number }; wall: CueWall }> = {
  // the player's left (the drum's head faces their right)
  M12: { at: { u: -470, v: -720 }, wall: 'v0' },
  // the player's left, beside the knee
  M13: { at: { u: -570, v: -720 }, wall: 'v0' },
  // the player's left (the striking hand is on the right)
  I06a: { at: { u: -400, v: -620 }, wall: 'v0' },
  I06b: { at: { u: -400, v: -620 }, wall: 'v0' },
  I06c: { at: { u: -400, v: -620 }, wall: 'v0' },
  // behind the player (the mallet works toward the gong)
  I12: { at: { u: GONG_PLAYER.x + 380, v: GONG_PLAYER.z }, wall: 'u1' },
  // behind the player, between them and their amp
  A10: { at: { u: A10_H0.x - 540, v: A10_H0.z }, wall: 'v0' },
  // behind the player (the keyboard on the right, the bass side on the left)
  A11: { at: { u: -700, v: -200 }, wall: 'u0' },
};
/** The dancer's mixer: behind the route, out of the moving space. */
const DANCE_STATION = { at: { u: -880, v: -300 }, wall: 'u0' as CueWall };

/** The studio headphone mix: one station (the one performer). */
export function handCue(id: HandLessonId, v: VariantId): CueRig {
  const s = isDance(id, v) ? DANCE_STATION : STATION[id];
  const head = performerHead(id, v);
  return {
    room: handRoom(id, v),
    wall: s.wall,
    hubAt: s.wall === 'v0' || s.wall === 'v1' ? s.at.u : s.at.v,
    stations: [{ id: 'player', at: s.at, head: { u: head.u, v: head.v }, facing: head.facing }],
  };
}

/** The wedges the stage draws (a wedge with no glyph is the lesson's own
 *  drawing, e.g. A10's harp amp). */
export const drawnWedges = (wedges: readonly Wedge[]) => wedges.filter((w) => w.glyph !== 'none');
const isSideFill = (w: Pick<Wedge, 'id'>) => w.id !== 'wedge';

/** Every object's footprint on the plan (mm). */
export function handFoots(id: HandLessonId, scene: HandScene, v: VariantId, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [...performerFoots(id, v)];
  if (scene === 'stage') {
    BAND_HEADS.forEach((h, i) => out.push(foot(`bandHead${i}`, 'bandHead', headRect(h))));
    out.push(foot('bandAmp', 'amp', BAND_AMP));
    for (const w of drawnWedges(wedges)) out.push(isSideFill(w) ? { ...wedgeFoot(w), kind: 'sideFill' } : wedgeFoot(w));
    PA_RECTS.forEach((r, i) => out.push(foot(`pa${i}`, 'pa', r)));
    out.push(...chairFoots(handChairs()));
  } else {
    out.push(...cueFootprints(handCue(id, v)));
  }
  return out;
}

/** The plan box of a scene object the plan draws itself (its tap and
 *  highlight box, and where its name sits): the wedge, the side fill, the
 *  band, the audience and the room's wall. Null for the lesson's own items. */
export function handObjectRect(itemId: string, scene: HandScene, lessonId: string, v: VariantId, wedges: readonly Wedge[], wallSide: -1 | 1 = -1): PlanRect | null {
  if (scene === 'stage') {
    if (itemId === 'band') return unionRect([...BAND_HEADS.map(headRect), BAND_AMP]);
    if (itemId === 'audience') return unionRect(chairFoots(handChairs()));
    const w = drawnWedges(wedges).find((q) => q.id === itemId);
    if (w) return wedgeFoot(w);
    return null;
  }
  if (itemId === 'room') {
    const r = handRoom(lessonId, v);
    return wallSide < 0 ? { u0: r.u0, u1: r.u1, v0: r.v0 - 60, v1: r.v0 + 60 } : { u0: r.u0, u1: r.u1, v0: r.v1 - 60, v1: r.v1 + 60 };
  }
  return null;
}

/** The audience's name sits in the front row's aisle. */
export const AUDIENCE_LABEL_AT = { u: AUDIENCE_ROW.u, v: AUDIENCE_ROW.aisleV } as const;

void rectAround;
