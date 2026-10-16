/**
 * THE WIND PLANS' FURNITURE — pure footprints (no Skia) of the objects the
 * brass, low-brass and saxophone "Starting setups" plans draw from above,
 * from the SAME numbers their drawings use (collision pass 2026-10-15, owner:
 * "no collisions or impossible layering in ANY plan").
 *
 * Plan frame: u = the lesson's x (toward the audience), v = its z; mm. An
 * object is placed at `at` and turned by `yaw` degrees (from +x toward +z),
 * exactly as the plans' <Group> transforms place it.
 */
import { DRUMMER } from '../kitScene/kitSceneModel.ts';
import { cueHub, type CueRig } from '../monitoring/cueMix.ts';
import { foot, kitPieceFoots, labelPlaces, rectOfPts, type PlanFoot, type PlanPt, type PlanRect } from '../planFoot.ts';

const DEG = Math.PI / 180;

/** Local (x, z) points turned by `yaw` (deg) and moved to `at`. */
export function placePts(at: { x: number; z: number }, yaw: number, pts: readonly { x: number; z: number }[]): PlanPt[] {
  const c = Math.cos(yaw * DEG);
  const s = Math.sin(yaw * DEG);
  return pts.map((p) => ({ u: at.x + p.x * c - p.z * s, v: at.z + p.x * s + p.z * c }));
}
/** The box of local points once placed, grown by `pad` (a stroke's half-width). */
export function placedRect(at: { x: number; z: number }, yaw: number, pts: readonly { x: number; z: number }[], pad = 0): PlanRect {
  const r = rectOfPts(placePts(at, yaw, pts));
  return { u0: r.u0 - pad, u1: r.u1 + pad, v0: r.v0 - pad, v1: r.v1 + pad };
}
/** A tripod's three feet (legs at 30°, 150°, 270° of the object's frame). */
export function tripod(r: number): { x: number; z: number }[] {
  return [0, 1, 2].map((k) => {
    const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  });
}

/** A music stand from above (the shared MusicStand: a 120 × 500 desk with
 *  its ledge, three legs of 260; the low-brass copy: 110 × 480, legs 250). */
export const MUSIC_STAND = {
  shared: { desk: { x0: -60, x1: 64, z: 250 }, leg: 260 },
  lowBrass: { desk: { x0: -62, x1: 55, z: 240 }, leg: 250 },
} as const;
export function standRect(at: { x: number; z: number }, yaw: number, d: { desk: { x0: number; x1: number; z: number }; leg: number }): PlanRect {
  const desk = [
    { x: d.desk.x0, z: -d.desk.z },
    { x: d.desk.x1, z: -d.desk.z },
    { x: d.desk.x1, z: d.desk.z },
    { x: d.desk.x0, z: d.desk.z },
  ];
  return placedRect(at, yaw, [...desk, ...tripod(d.leg)], 7);
}

/** A main pair on its tall stand from above (the shared MainPair: legs 300,
 *  a 280 bar, two mics angled out; the low-brass copy: legs 280, bar 260). */
export const MAIN_PAIR = {
  shared: { leg: 300, bar: 140, micAt: 120, mic: 130 },
  lowBrass: { leg: 280, bar: 130, micAt: 110, mic: 120 },
} as const;
export function pairRect(at: { x: number; z: number }, yaw: number, d: { leg: number; bar: number; micAt: number; mic: number }): PlanRect {
  const m = d.mic * Math.SQRT1_2;
  const pts = [...tripod(d.leg), { x: 0, z: -d.bar }, { x: 0, z: d.bar }, { x: -20 - m, z: -(d.micAt + m) }, { x: -20 - m, z: d.micAt + m }, { x: -20, z: -d.micAt }, { x: -20, z: d.micAt }];
  return placedRect(at, yaw, pts, 13);
}

/** A singer at a vocal mic (BrassSettingPage SingerTop): the shoulders (a
 *  240 × 460 oval) and the head, facing +x to the mic on its round-legged
 *  stand (legs 220 about x = 330). Two parts of one assembly. */
export function singerFoots(id: string, at: { x: number; z: number }, yaw: number, group: string): PlanFoot[] {
  return [
    foot(`${id}:body`, 'player', placedRect(at, yaw, [{ x: -120, z: -230 }, { x: 120, z: 230 }, { x: 110, z: 0 }]), { group }),
    foot(`${id}:mic`, 'micStand', placedRect(at, yaw, [{ x: 330 + 220, z: 0 }, { x: 330 - 110, z: 190.5 }, { x: 330 - 110, z: -190.5 }, { x: 110, z: -22 }, { x: 110, z: 22 }], 7), { group }),
  ];
}
/** The singer's head (FigureHead at x = 10 of the singer's frame). */
export function singerHead(at: { x: number; z: number }, yaw: number): PlanPt {
  return placePts(at, yaw, [{ x: 10, z: 0 }])[0];
}

/** The shared kit (KitTop: the drums, cymbals, stands, throne and the seated
 *  drummer), unturned, its kick's batter head at `at`. */
export function kitFoots(at: { x: number; z: number }, group = 'kit'): PlanFoot[] {
  return kitPieceFoots({ u: at.x, v: at.z }, group);
}
/** The drummer's head on the plan (the kit drawn with its drummer). */
export function drummerHead(at: { x: number; z: number }): PlanPt {
  return { u: at.x + DRUMMER.headTop.x, v: at.z + DRUMMER.headTop.z };
}

/** The studio room's inner wall faces: the plan's wide box inset by 60, its
 *  walls drawn 60 thick on that line (inner face 90 in). */
export function studioRoom(wide: { u0: number; u1: number; v0: number; v1: number }): PlanRect {
  return { u0: wide.u0 + 90, u1: wide.u1 - 90, v0: wide.v0 + 90, v1: wide.v1 - 90 };
}

/** The solid footprint of one plan object: its own id, or every part of
 *  its group (a player and their horn, a kit's pieces). */
export function ownRect(fs: readonly PlanFoot[], idOrGroup: string): PlanRect | null {
  const mine = fs.filter((f) => !f.zone && (f.id === idOrGroup || f.group === idOrGroup));
  if (!mine.length) return null;
  return { u0: Math.min(...mine.map((f) => f.u0)), u1: Math.max(...mine.map((f) => f.u1)), v0: Math.min(...mine.map((f) => f.v0)), v1: Math.max(...mine.map((f) => f.v1)) };
}

/** A plan label set just outside its object's footprint (below, right,
 *  left, above — labelPlaces), pointing back at the object (`point`) when the
 *  layout has to move it into free space. `s` = the plan's px per mm ÷ the
 *  text scale. `places`: a turned stage plan passes its turn's (planTurn). */
export function besideLabel<T extends { id: string; text: string }>(l: T, own: PlanRect | null, point: PlanPt, s: number, places_: typeof labelPlaces = labelPlaces): T & { u: number; v: number; align: 'left' | 'center' | 'right'; alts: { u: number; v: number; align: 'left' | 'center' | 'right' }[]; point: PlanPt } {
  const places = own ? places_(own, s) : [{ u: point.u, v: point.v + 200, align: 'center' as const }];
  return { ...l, u: places[0].u, v: places[0].v, align: places[0].align, alts: places.slice(1), point };
}

/** Where a headphone-mix label's object is (its `point`): a mixer's centre,
 *  or the distribution point's box. */
export function cuePoint(rig: CueRig, labelId: string): PlanPt {
  const st = rig.stations.find((x) => `cueMix:${x.id}` === labelId);
  if (st) return st.at;
  const r = cueHub(rig).rect;
  return { u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 };
}
