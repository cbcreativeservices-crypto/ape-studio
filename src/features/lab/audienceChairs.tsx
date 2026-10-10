/**
 * AUDIENCE CHAIRS — an audience is drawn as its empty chairs, never as heads
 * (owner 2026-10-10: "do not use heads with the chairs as audiences"; chairs
 * only, at TRUE size — "not huge heads like Easter Island").
 *
 * Real stacking-chair dimensions, in millimetres: 460 wide, 430 seat depth,
 * seat 450 high, back 880 high. Plans draw in mm, so a plan chair is 1:1; the
 * side view scales by the caller's px-per-metre.
 *
 * Skia-only: load it only from modules that are themselves Skia-gated.
 */
import { Group, Path, Skia } from '@shopify/react-native-skia';
import { aboveRotation } from './headIconGeometry';

type SkPath = ReturnType<typeof Skia.Path.Make>;

export const CHAIR_MM = { w: 460, seatD: 430, backD: 60, seatH: 450, backH: 880 } as const;
/** Centre-to-centre spacing of chairs in a row (a seat plus elbow room). */
export const CHAIR_PITCH_MM = 520;

const rrect = (p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) =>
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0), r, r));

/**
 * Chairs from ABOVE, each turned by `rotation` — the same convention as
 * aboveRotation(dx, dy): the sitter faces +y before turning, so the backrest
 * is on the −y side.
 */
export function makeChairsTop(at: readonly { x: number; y: number; rotation: number }[]): { seats: SkPath; backs: SkPath } {
  const seats = Skia.Path.Make();
  const backs = Skia.Path.Make();
  const { w, seatD, backD } = CHAIR_MM;
  for (const a of at) {
    const seat = Skia.Path.Make();
    rrect(seat, -w / 2, -seatD / 2, w / 2, seatD / 2, 50);
    const back = Skia.Path.Make();
    rrect(back, -w / 2, -seatD / 2 - backD, w / 2, -seatD / 2 + 10, 26);
    const m = Skia.Matrix();
    m.translate(a.x, a.y);
    m.rotate(a.rotation);
    seat.transform(m);
    back.transform(m);
    seats.addPath(seat);
    backs.addPath(back);
  }
  return { seats, backs };
}

/** One row of chairs across v ∈ [v0, v1] at depth u, all facing −u (the stage). */
export function chairRowFacingStage(u: number, v0: number, v1: number): { x: number; y: number; rotation: number }[] {
  const n = Math.max(1, Math.floor((v1 - v0) / CHAIR_PITCH_MM) + 1);
  const span = (n - 1) * CHAIR_PITCH_MM;
  const start = (v0 + v1) / 2 - span / 2;
  return Array.from({ length: n }, (_, i) => ({ x: u, y: start + i * CHAIR_PITCH_MM, rotation: aboveRotation(-1, 0) }));
}

/** Draw makeChairsTop output: a dark seat with a light rim, the backrest solid. */
export function ChairsTop({ seats, backs, color, strokeWidth = 10, opacity = 1 }: { seats: SkPath; backs: SkPath; color: string; strokeWidth?: number; opacity?: number }) {
  return (
    <Group opacity={opacity}>
      <Path path={seats} color="#24262c" />
      <Path path={seats} style="stroke" strokeWidth={strokeWidth} color={color} />
      <Path path={backs} color={color} />
    </Group>
  );
}

/**
 * Chairs in SIDE profile, standing on the floor at each (x, y = floor), the
 * sitter facing LEFT (the backrest on the right). `mpp` = px per metre.
 * Line art: front leg, seat, rear leg rising into the backrest.
 */
export function makeChairsSide(at: readonly { x: number; y: number }[], mpp: number): SkPath {
  const p = Skia.Path.Make();
  const k = mpp / 1000; // px per mm
  const half = (CHAIR_MM.seatD / 2) * k;
  const seat = CHAIR_MM.seatH * k;
  const back = CHAIR_MM.backH * k;
  for (const { x, y } of at) {
    // front leg
    p.moveTo(x - half + 0.6, y);
    p.lineTo(x - half + 0.6, y - seat);
    // seat (with a slight rake down toward the back)
    p.moveTo(x - half, y - seat);
    p.lineTo(x + half, y - seat + 0.04 * seat);
    // rear leg up into the backrest, raked back
    p.moveTo(x + half - 0.6, y);
    p.lineTo(x + half, y - seat + 0.04 * seat);
    p.lineTo(x + half + 0.12 * half, y - back);
  }
  return p;
}

/** Draw makeChairsSide output. */
export function ChairsSide({ path, color, strokeWidth, opacity = 1 }: { path: SkPath; color: string; strokeWidth: number; opacity?: number }) {
  return <Path path={path} style="stroke" strokeWidth={strokeWidth} strokeCap="round" strokeJoin="round" color={color} opacity={opacity} />;
}
