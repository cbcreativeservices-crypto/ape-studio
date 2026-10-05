/**
 * SMALL-PERCUSSION FAMILY — a HAND, drawn (charter §3: real objects, lit from
 * the upper left, with a rim). The geometry is hands.ts (pure, tested); this
 * only fills and strokes it, in the scene's millimetres.
 *
 * Order (front to back is the reverse): the forearm (a shirt cuff, then
 * skin), the hand's body, the fingers behind the held object, the object
 * (`held`, drawn between), the nearest finger, the thumb, nails, creases and
 * a soft highlight on the knuckles. `heldBehind` puts the object behind the
 * whole hand instead (a fist seen from its back: the object passes behind).
 *
 * Paths are built once per hand placement (useMemo); nothing moves (D8).
 */
import { useMemo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { nailOutline, placePt, smoothPathD, tubeOutline, type HandGeo, type Placement, type Pt } from './hands.ts';

/** Skin, lit from the upper left; a warm rim; nail and crease tones. */
export const SKIN = ['#f6d4b4', '#e2ae87', '#c48a63', '#93603f'];
export const SKIN_RIM = '#5a3624';
const NAIL = '#f7e2d4';
const NAIL_RIM = '#c4957b';
const CREASE = '#9a6544';
/** A shirt sleeve (dark slate), lit from the upper left. */
export const SLEEVE = ['#5d6b82', '#3f4b5f', '#262e3b'];
export const SLEEVE_RIM = '#141820';

const fromD = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();

function bbox(pts: readonly Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    if (p[0] < x0) x0 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[0] > x1) x1 = p[0];
    if (p[1] > y1) y1 = p[1];
  }
  return { x0, y0, x1, y1 };
}

type Built = {
  body: ReturnType<typeof fromD>;
  bodyEdge: ReturnType<typeof fromD>;
  back: ReturnType<typeof fromD>[];
  front: ReturnType<typeof fromD>[];
  thumb: ReturnType<typeof fromD>;
  nails: ReturnType<typeof fromD>;
  creases: ReturnType<typeof fromD>;
  shine: ReturnType<typeof fromD>;
  box: { x0: number; y0: number; x1: number; y1: number };
};

function build(g: HandGeo, pl: Placement): Built {
  const place = (pts: readonly Pt[]) => pts.map((p) => placePt(p, pl));
  const bodyPts = place(g.body);
  const body = fromD(smoothPathD(bodyPts));
  // The body's outline without its wrist edge (the forearm covers it).
  const bodyEdge = fromD(smoothPathD(bodyPts.slice(1, -1), false));
  const sorted = [...g.fingers].sort((a, b) => a.layer - b.layer);
  const nearest = sorted[sorted.length - 1];
  const back = sorted.filter((f) => f !== nearest).map((f) => fromD(smoothPathD(place(tubeOutline(f.pts, f.w0, f.w1)))));
  const front = [fromD(smoothPathD(place(tubeOutline(nearest.pts, nearest.w0, nearest.w1))))];
  const thumb = fromD(smoothPathD(place(tubeOutline(g.thumb.pts, g.thumb.w0, g.thumb.w1))));
  const nails = Skia.Path.Make();
  for (const f of [...g.fingers, g.thumb]) if (f.nail) nails.addPath(fromD(smoothPathD(place(nailOutline(f)))));
  const creases = Skia.Path.Make();
  for (const c of g.creases) creases.addPath(fromD(smoothPathD(place(c), false)));
  // A soft highlight along the knuckles (light from the upper left).
  const shine = Skia.Path.Make();
  if (g.knuckles.length > 1) shine.addPath(fromD(smoothPathD(place(g.knuckles.map((k) => [k[0] - 2, k[1] - 4] as Pt)), false)));
  const all = [...bodyPts, ...place(nearest.pts), ...place(g.thumb.pts)];
  return { body, bodyEdge, back, front, thumb, nails, creases, shine, box: bbox(all) };
}

export type HandProps = {
  geo: HandGeo;
  pl: Placement;
  /** The forearm, from the elbow side (view mm) to the wrist (pl.at). */
  forearm?: { from: Pt; w: number; sleeve?: number };
  /** The held object, drawn between the fingers behind it and the nearest
   *  finger (or behind the whole hand with heldBehind). */
  held?: ReactNode;
  heldBehind?: boolean;
  /** The thumb on the FAR side of the hand (seen from the little-finger
   *  side): drawn behind the body, mostly hidden. */
  farThumb?: boolean;
  opacity?: number;
};

export function Hand({ geo, pl, forearm, held, heldBehind, farThumb, opacity = 1 }: HandProps) {
  const b = useMemo(() => build(geo, pl), [geo, pl]);
  const arm = useMemo(() => {
    if (!forearm) return null;
    const p = Skia.Path.Make();
    p.moveTo(forearm.from[0], forearm.from[1]);
    // End just inside the wrist so the hand's body covers the cap.
    const dx = pl.at[0] - forearm.from[0];
    const dy = pl.at[1] - forearm.from[1];
    const l = Math.hypot(dx, dy) || 1;
    p.lineTo(pl.at[0] + (dx / l) * 6, pl.at[1] + (dy / l) * 6);
    const sl = forearm.sleeve ?? 0;
    const sleeve = Skia.Path.Make();
    if (sl > 0) {
      sleeve.moveTo(forearm.from[0], forearm.from[1]);
      sleeve.lineTo(forearm.from[0] + (dx / l) * sl, forearm.from[1] + (dy / l) * sl);
    }
    return { p, sleeve, sl, from: forearm.from, to: pl.at, w: forearm.w };
  }, [forearm, pl]);
  const g0 = vec(b.box.x0, b.box.y0);
  const g1 = vec(b.box.x1, b.box.y1);
  const thumbEl = (
    <>
      <Path path={b.thumb}>
        <LinearGradient start={g0} end={g1} colors={SKIN} />
      </Path>
      <Path path={b.thumb} style="stroke" strokeWidth={1.5} color={SKIN_RIM} />
    </>
  );
  return (
    <Group opacity={opacity}>
      {heldBehind ? held : null}
      {arm ? (
        <>
          <Path path={arm.p} style="stroke" strokeWidth={arm.w + 3.2} strokeCap="round" color={SKIN_RIM} />
          <Path path={arm.p} style="stroke" strokeWidth={arm.w} strokeCap="round">
            <LinearGradient start={vec(arm.from[0], arm.from[1] - arm.w)} end={vec(arm.to[0], arm.to[1] + arm.w)} colors={SKIN} />
          </Path>
          {arm.sl > 0 ? (
            <>
              <Path path={arm.sleeve} style="stroke" strokeWidth={arm.w + 14} strokeCap="butt" color={SLEEVE_RIM} />
              <Path path={arm.sleeve} style="stroke" strokeWidth={arm.w + 10} strokeCap="butt">
                <LinearGradient start={vec(arm.from[0], arm.from[1] - arm.w)} end={vec(arm.from[0], arm.from[1] + arm.w)} colors={SLEEVE} />
              </Path>
            </>
          ) : null}
        </>
      ) : null}
      {farThumb ? thumbEl : null}
      <Path path={b.body}>
        <LinearGradient start={g0} end={g1} colors={SKIN} />
      </Path>
      <Path path={b.bodyEdge} style="stroke" strokeWidth={1.6} color={SKIN_RIM} />
      {b.back.map((p, i) => (
        <Group key={i}>
          <Path path={p}>
            <LinearGradient start={g0} end={g1} colors={SKIN} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={1.4} color={SKIN_RIM} />
        </Group>
      ))}
      {heldBehind ? null : held}
      {b.front.map((p, i) => (
        <Group key={i}>
          <Path path={p}>
            <LinearGradient start={g0} end={g1} colors={SKIN} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={1.5} color={SKIN_RIM} />
        </Group>
      ))}
      {farThumb ? null : thumbEl}
      <Path path={b.nails} color={NAIL} opacity={farThumb ? 0 : 1} />
      <Path path={b.nails} style="stroke" strokeWidth={0.8} color={NAIL_RIM} />
      <Path path={b.creases} style="stroke" strokeWidth={1.1} strokeCap="round" color={CREASE} opacity={0.8} />
      <Path path={b.shine} style="stroke" strokeWidth={3} strokeCap="round" color="#fff3e6" opacity={0.35} />
    </Group>
  );
}
