/**
 * THE PARABOLIC DISH, drawn (frame D of parabolic.ts: millimetres, the vertex
 * at the origin, the axis along +u toward the target, across = v). A clear
 * polycarbonate bowl lit from the upper left, its rolled rim, the hub at the
 * vertex with a pistol grip under it, the boom along the axis to the element
 * at the focus — the capsule FACING THE BOWL, as the maker specifies — an
 * optional wind cover across the mouth, and the operator's hand on the grip.
 * Built once by group 2 (lab7-g5); B12–B16 draw the dish with it. Static.
 *
 *   DishSection   the dish in section (a cut along its axis)
 *   DishRays      the ray overlay — parallel arrivals (blue), their
 *                 reflections (amber) meeting at the focus on the axis or
 *                 missing it off the axis (parabolic.reflectRay), and the low
 *                 sound's direct path to the element (a separate dashed arrow)
 *   ArcOperator   the operator from above with the dish (B12's turn arc)
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { profile, raySet, halfWidthAt, type Dish } from './parabolic.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { standing, topPose } from '../foley/performer.ts';
import { v3 } from '../foley/frameF.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#8fbcff';

/** The shell's drawn thickness (mm) — a drawing default. */
const SHELL = 14;

export function DishSection({ dish, px, elementOffset = 0, wind = false, cutaway = true }: { dish: Dish; px: number; elementOffset?: number; wind?: boolean; cutaway?: boolean }) {
  const g = useMemo(() => {
    const inner = profile(dish, 48);
    // The shell: the inner curve, then back along the outer curve (offset along −normal).
    const shell = make();
    inner.forEach((q, i) => (i === 0 ? shell.moveTo(q.x, q.y) : shell.lineTo(q.x, q.y)));
    for (let i = inner.length - 1; i >= 0; i--) {
      const q = inner[i];
      const nx = 1;
      const ny = -q.y / (2 * dish.f);
      const l = Math.hypot(nx, ny);
      shell.lineTo(q.x - (nx / l) * SHELL, q.y - (ny / l) * SHELL);
    }
    shell.close();
    const R = halfWidthAt(dish, dish.depth);
    // The rolled rim: a small bead at each lip.
    const rim = make();
    rim.addCircle(dish.depth, -R, 9);
    rim.addCircle(dish.depth, R, 9);
    // The hub at the vertex and the boom along the axis to the element.
    const hub = make();
    hub.addRRect(Skia.RRectXY(Skia.XYWHRect(-46, -34, 44, 68), 10, 10));
    const boom = make();
    boom.moveTo(-4, 0);
    boom.lineTo(dish.f + elementOffset + 14, 0);
    // The element at the focus: a small omni capsule body FACING the bowl (−u).
    const elem = make();
    elem.addRRect(Skia.RRectXY(Skia.XYWHRect(dish.f + elementOffset - 4, -10, 46, 20), 6, 6));
    const grille = make();
    grille.addRRect(Skia.RRectXY(Skia.XYWHRect(dish.f + elementOffset - 6, -9, 10, 18), 4, 4));
    // A pistol grip under the hub, and a short cable from its base.
    const grip = make();
    grip.moveTo(-40, 24);
    grip.lineTo(-62, 190);
    grip.lineTo(-24, 196);
    grip.lineTo(-8, 30);
    grip.close();
    const cable = make();
    cable.moveTo(-44, 196);
    cable.cubicTo(-50, 260, -110, 260, -150, 300);
    // The wind cover across the mouth (a fur rim, drawn as a fuzzy band).
    const fur = make();
    for (let y = -R; y <= R; y += 14) {
      fur.moveTo(dish.depth + 6, y);
      fur.lineTo(dish.depth + 22 + ((y / 14) % 2 === 0 ? 6 : 0), y + 6);
    }
    return { shell, rim, hub, boom, elem, grille, grip, cable, fur, R };
  }, [dish, elementOffset]);
  return (
    <Group>
      <Path path={g.cable} style="stroke" strokeWidth={9} strokeCap="round" color="#0b0c0f" />
      <Path path={g.grip}>
        <LinearGradient start={vec(-62, 30)} end={vec(-8, 196)} colors={['#3b3f47', '#1b1d22', '#0c0d10']} />
      </Path>
      <Path path={g.shell} color={cutaway ? '#9fb4c8' : '#7f93a6'} opacity={0.55} />
      <Path path={g.shell}>
        <LinearGradient start={vec(0, -g.R)} end={vec(dish.depth, g.R)} colors={['#e6eef6', '#9fb3c6', '#5d7083']} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={Math.max(1.2, 1.4 * px)} color="#e6eef6" opacity={0.8} />
      <Path path={g.rim} color="#d8dee6" />
      <Path path={g.hub}>
        <LinearGradient start={vec(-46, -34)} end={vec(-2, 34)} colors={['#5b5f69', '#2a2c32', '#121317']} />
      </Path>
      <Path path={g.boom} style="stroke" strokeWidth={10} strokeCap="round" color="#0b0c0f" />
      <Path path={g.boom} style="stroke" strokeWidth={6} strokeCap="round" color="#7c808a" />
      <Path path={g.elem}>
        <LinearGradient start={vec(dish.f, -10)} end={vec(dish.f + 40, 10)} colors={['#4a4e57', '#1d1e23']} />
      </Path>
      <Path path={g.grille} color="#c9a24a" />
      {wind ? <Path path={g.fur} style="stroke" strokeWidth={5} strokeCap="round" color="#8b7f6f" opacity={0.75} /> : null}
    </Group>
  );
}

/** The ray overlay (a simplified picture): `n` parallel arrivals `offDeg` off
 *  the axis, reflected; the reflections drawn to their closest approach to
 *  the focus and a little beyond. `low`: the low sound's direct path. */
export function DishRays({ dish, offDeg, px, low = true, n = 7 }: { dish: Dish; offDeg: number; px: number; low?: boolean; n?: number }) {
  const g = useMemo(() => {
    const rays = raySet(dish, offDeg, n);
    const inc = make();
    const ref = make();
    const t = (offDeg * Math.PI) / 180;
    for (const r of rays) {
      const start = { x: r.hit.x + Math.cos(t) * (dish.depth + 520 - r.hit.x), y: r.hit.y + Math.sin(t) * (dish.depth + 520 - r.hit.x) };
      inc.moveTo(start.x, start.y);
      inc.lineTo(r.hit.x, r.hit.y);
      const end = { x: r.at.x + r.dir.x * 40, y: r.at.y + r.dir.y * 40 };
      ref.moveTo(r.hit.x, r.hit.y);
      ref.lineTo(end.x, end.y);
    }
    const direct = make();
    direct.moveTo(dish.depth + 560, -150);
    direct.lineTo(dish.f + 52, -14);
    const head = make();
    const ux = dish.f + 52 - (dish.depth + 560);
    const uy = -14 - -150;
    const l = Math.hypot(ux, uy);
    const hx = ux / l;
    const hy = uy / l;
    const tip = { x: dish.f + 52, y: -14 };
    head.moveTo(tip.x - hx * 26 - hy * 14, tip.y - hy * 26 + hx * 14);
    head.lineTo(tip.x, tip.y);
    head.lineTo(tip.x - hx * 26 + hy * 14, tip.y - hy * 26 - hx * 14);
    return { inc, ref, direct, head };
  }, [dish, offDeg, n]);
  return (
    <Group>
      <Path path={g.inc} style="stroke" strokeWidth={1.6 * px} color={BLUE} opacity={0.8} />
      <Path path={g.ref} style="stroke" strokeWidth={1.6 * px} color={AMBER} opacity={0.9} />
      <Circle cx={dish.f} cy={0} r={4 * px} style="stroke" strokeWidth={1.4 * px} color={AMBER} />
      {low ? (
        <Group>
          <Path path={g.direct} style="stroke" strokeWidth={2 * px} color="#6fa8ff" opacity={0.85}>
            <DashPathEffect intervals={[7 * px, 5 * px]} />
          </Path>
          <Path path={g.head} style="stroke" strokeWidth={2 * px} strokeCap="round" color="#6fa8ff" />
        </Group>
      ) : null}
    </Group>
  );
}

/* The operator from above holding the dish in front (facing +u). Drawing
 * defaults: the shared standing adult, the dish's grip at the chest. */
const OP = standing({ floorY: 0, x: -520, wrR: v3(-120, -1250, 120), wrL: v3(-150, -1260, -150), kindR: 'grip', kindL: 'grip' });
const OP_TOP = topPose(OP);
/** The operator and the dish from above at the origin, facing +u (the dish
 *  axis). Rotate the group to aim. Real scale (mm). */
export function OperatorWithDish({ dish }: { dish: Dish }) {
  const g = useMemo(() => {
    const R = halfWidthAt(dish, dish.depth);
    const bowl = make();
    for (let i = 0; i <= 24; i++) {
      const y = -R + (2 * R * i) / 24;
      const x = (y * y) / (4 * dish.f) - 60;
      if (i === 0) bowl.moveTo(x, y);
      else bowl.lineTo(x, y);
    }
    return { bowl };
  }, [dish]);
  return (
    <Group>
      <PlayerBehind pose={OP_TOP} />
      <PlayerInFront pose={OP_TOP} />
      <Path path={g.bowl} style="stroke" strokeWidth={30} strokeCap="round" color="#0b0c0f" />
      <Path path={g.bowl} style="stroke" strokeWidth={20} strokeCap="round">
        <LinearGradient start={vec(0, -300)} end={vec(0, 300)} colors={['#e6eef6', '#9fb3c6', '#5d7083']} />
      </Path>
      <Circle cx={dish.f - 60} cy={0} r={14} color="#1d1f24" />
      <Circle cx={dish.f - 60} cy={0} r={14} style="stroke" strokeWidth={4} color="#c9a24a" />
    </Group>
  );
}
