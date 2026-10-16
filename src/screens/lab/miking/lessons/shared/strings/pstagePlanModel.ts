/**
 * The Lab 4 string-instrument plans' shared layout (PStagePlan.tsx draws it)
 * — pure, so the plans' overlap test (test/mikingPlanCollisions_20261015)
 * reads the same numbers the drawing uses. Used by C10 Harp, C11 Piano and
 * C12 Clavinet; each lesson's own planModel.ts places its spots.
 *
 * A PlanSpot is an item on the plan (lesson frame from above: u = x, v = z,
 * mm): where it sits, what it is drawn as, which scene shows it. Every glyph
 * is drawn about its own origin facing +u, then turned to `faces`.
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan): the floor wedge is the shared 2-way wedge at its true 600 × 420
 * (AGENTS D70 — it was a 320 × 540 stand-in), every glyph has a footprint
 * here, and the STUDIO draws no monitors on the floor — each performer's
 * personal headphone mixer instead (monitoring/cueMix.ts).
 */
import type { CueRig } from '../monitoring/cueMix.ts';
import { foot, rectAround, rectOfCircle, WEDGE_FOOT, type PlanFoot, type PlanRect } from '../planFoot.ts';

export type PlanGlyph = 'wedge' | 'singer' | 'stand' | 'pair' | 'mic' | 'amp' | 'pa' | 'band' | 'di' | 'chair' | 'none';
export type PlanScene = 'near' | 'stage' | 'studio';
/** An item on the plan: where it sits (lesson frame, plan x / z), what it is
 *  drawn as, and which scene shows it. `item` = the SettingItem it names.
 *  `half`: a band riser's half size (u, v) when not the default. `text`:
 *  the words when no SettingItem names it. */
export type PlanSpot = {
  item: string;
  glyph: PlanGlyph;
  x: number;
  z: number;
  faces?: { x: number; z: number };
  scene: 'near' | 'stage' | 'studio' | 'all';
  r: number;
  label?: { du: number; dv: number };
  half?: { u: number; v: number };
  text?: string;
};

/** The glyphs' true sizes from above (mm, facing +u). */
export const GLYPH = {
  /** The shared 2-way floor wedge (wedge2Way.tsx): 600 wide × 420 deep. */
  wedge: { d: WEDGE_FOOT.d, w: WEDGE_FOOT.w },
  /** A standing singer: shoulders 240 deep × 460 wide; the vocal mic's stand
   *  in front (the boom to 330, the mic to 370, a tripod base r 150). */
  singer: { body: { u0: -120, u1: 120, v0: -230, v1: 230 }, standAt: 330, micTo: 370, baseR: 150 },
  /** A seated player's chair (an empty seat glyph). */
  chair: { u0: -230, u1: 130, v0: -230, v1: 230 },
  /** A music stand: the desk edge-on (60 × 500) and its tripod (r 220). */
  stand: { deskD: 60, deskW: 500, baseR: 220 },
  /** Two pencil condensers on a stereo bar (400) on one tripod stand (r 260). */
  pair: { barD: 60, barW: 400, baseR: 260 },
  /** One condenser on a tripod stand (r 250): a room mic. */
  mic: { baseR: 250, body: { u0: -60, u1: 110, v0: -17, v1: 17 } },
  /** A combo amp from above (290 deep × 500 wide), grille at the front (+u). */
  amp: { u0: -290, u1: 0, v0: -250, v1: 250 },
  /** A two-way PA / side-fill cabinet (440 deep × 600 wide). */
  pa: { u0: -220, u1: 220, v0: -300, v1: 300 },
  /** A passive DI box on the floor (140 × 84). */
  di: { u0: -70, u1: 70, v0: -42, v1: 42 },
  /** The rest of the band: a riser outline (default 1800 × 2200). */
  band: { hu: 900, hv: 1100 },
} as const;

export const spotAngle = (s: Pick<PlanSpot, 'faces'>) => (s.faces ? Math.atan2(s.faces.z, s.faces.x) : 0);

/** The rect (in the glyph's own frame, facing +u) turned to `ang`: its
 *  axis-aligned box in the plan. */
function turned(c: { u: number; v: number }, r: PlanRect, ang: number): PlanRect {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const pts = [
    [r.u0, r.v0],
    [r.u1, r.v0],
    [r.u0, r.v1],
    [r.u1, r.v1],
  ].map(([x, y]) => ({ u: c.u + x * ca - y * sa, v: c.v + x * sa + y * ca }));
  return { u0: Math.min(...pts.map((p) => p.u)), u1: Math.max(...pts.map((p) => p.u)), v0: Math.min(...pts.map((p) => p.v)), v1: Math.max(...pts.map((p) => p.v)) };
}

/** The footprints a spot's glyph stands on (none for 'none'). A singer is
 *  one group: the person and their vocal mic's stand. A riser is a floor
 *  zone. */
export function spotFoots(s: PlanSpot): PlanFoot[] {
  const c = { u: s.x, v: s.z };
  const ang = spotAngle(s);
  const id = s.item;
  switch (s.glyph) {
    case 'wedge':
      return [foot(id, 'wedge', rectAround(c, GLYPH.wedge.d, GLYPH.wedge.w, ang))];
    case 'singer': {
      const g = GLYPH.singer;
      const at = { u: c.u + Math.cos(ang) * g.standAt, v: c.v + Math.sin(ang) * g.standAt };
      return [foot(`${id}:body`, 'player', turned(c, g.body, ang), { group: id }), foot(`${id}:mic`, 'micStand', rectOfCircle(at, g.baseR), { group: id })];
    }
    case 'chair':
      return [foot(id, 'chair', turned(c, GLYPH.chair, ang), { group: id })];
    case 'stand':
      return [foot(id, 'musicStand', rectOfCircle(c, Math.max(GLYPH.stand.baseR, GLYPH.stand.deskW / 2)))];
    case 'pair':
      return [foot(id, 'micStand', rectOfCircle(c, GLYPH.pair.baseR))];
    case 'mic':
      return [foot(id, 'micStand', rectOfCircle(c, GLYPH.mic.baseR))];
    case 'amp':
      return [foot(id, 'amp', turned(c, GLYPH.amp, ang))];
    case 'pa':
      return [foot(id, s.item.startsWith('fill') ? 'sideFillStand' : 'pa', turned(c, GLYPH.pa, ang))];
    case 'di':
      return [foot(id, 'dibox', turned(c, GLYPH.di, ang))];
    case 'band': {
      const h = s.half ?? { u: GLYPH.band.hu, v: GLYPH.band.hv };
      return [foot(id, 'riser', { u0: c.u - h.u, u1: c.u + h.u, v0: c.v - h.v, v1: c.v + h.v }, { zone: true })];
    }
    default:
      return [];
  }
}

/** The spots a scene shows: its own, 'all', and (on the wide plans) the
 *  near ones too. */
export function spotsIn(spots: readonly PlanSpot[], scene: PlanScene): PlanSpot[] {
  return spots.filter((s) => s.scene === 'all' || s.scene === scene || (scene !== 'near' && s.scene === 'near'));
}

/** The studio room's inner wall faces for a wide plan box: the room is
 *  drawn 40 mm thick, 60 mm in from the box. */
export function roomOfBox(box: PlanRect): PlanRect {
  return { u0: box.u0 + 80, u1: box.u1 - 80, v0: box.v0 + 80, v1: box.v1 - 80 };
}

/** One plan as a lesson draws it: what the instrument and its player stand
 *  on (`own`, one group), the spots, and the studio's headphone mix. */
export type StringPlanLayout = {
  own: PlanFoot[];
  spots: PlanSpot[];
  room?: PlanRect;
  cue?: CueRig;
};

/** Every footprint on one plan (own + the scene's spots + the studio mix). */
export function stringPlanFoots(own: readonly PlanFoot[], spots: readonly PlanSpot[], scene: PlanScene, cueFoots: readonly PlanFoot[] = []): PlanFoot[] {
  return [...own, ...spotsIn(spots, scene).flatMap(spotFoots), ...(scene === 'studio' ? cueFoots : [])];
}
