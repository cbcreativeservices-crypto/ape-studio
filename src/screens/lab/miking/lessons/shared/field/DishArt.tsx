/**
 * THE PARABOLIC DISH, DRAWN (Lab 6 group 2; dish.ts holds the model): the
 * reflector cut through its axis at TRUE size — the bowl drawn from its own
 * equation z = r² / (4f), the capsule on its holder AT THE FOCUS, FACING THE
 * DISH, the rim's lip, the handle and pistol grip behind the vertex, and a
 * small fur windscreen over the capsule. In the local frame the axis runs
 * along +u (the dish opens toward the target on the right), the vertex at
 * the origin, the focus at u = f; v across.
 *
 *   <DishSection/>   the reflector, its capsule and its grip (static)
 *   <DishWaves/>     sound arriving from the target as straight wavefronts
 *                    λ apart (the calculator's c), and — where the wavelength
 *                    is shorter than the dish — the rays the bowl sends to
 *                    the focus; where it is longer, the fronts simply pass
 *                    the dish ("little help"): a simplified picture
 * Static (D8).
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { SdcMic } from '../../../../../../features/lab/micDrawings';
import { seeded } from '../foley/StageArt';
import { helpBelowHz, profileZ, wavelengthMm, type Dish } from './dish.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();

/** The bowl's shell thickness and lip (mm, drawing defaults). */
const SHELL = 6;
const LIP = 14;

function bowl(d: Dish): { outer: SkPath; inner: SkPath; shell: SkPath } {
  const R = d.D / 2;
  const n = 40;
  const inner = make();
  const outer = make();
  for (let k = 0; k <= n; k++) {
    const r = -R + (2 * R * k) / n;
    const u = profileZ(r, d.f);
    if (k === 0) inner.moveTo(u, r);
    else inner.lineTo(u, r);
  }
  // The shell: the inner curve, the lip, and back along an offset curve.
  const shell = make();
  for (let k = 0; k <= n; k++) {
    const r = -R + (2 * R * k) / n;
    const u = profileZ(r, d.f);
    if (k === 0) shell.moveTo(u, r);
    else shell.lineTo(u, r);
  }
  const uR = profileZ(R, d.f);
  shell.lineTo(uR + LIP * 0.2, R + LIP);
  for (let k = n; k >= 0; k--) {
    const r = -R + (2 * R * k) / n;
    const u = profileZ(r, d.f) - SHELL;
    const rr = r + Math.sign(r) * LIP * (Math.abs(r) / R) * 0.9;
    shell.lineTo(u, rr);
  }
  shell.lineTo(uR + LIP * 0.2, -R - LIP);
  shell.close();
  for (let k = 0; k <= n; k++) {
    const r = -R + (2 * R * k) / n;
    const u = profileZ(r, d.f) - SHELL;
    if (k === 0) outer.moveTo(u, r);
    else outer.lineTo(u, r);
  }
  return { outer, inner, shell };
}

export function DishSection({ dish, windscreen = true }: { dish: Dish; windscreen?: boolean }) {
  const g = useMemo(() => {
    const b = bowl(dish);
    // The capsule's holder: a rod from the vertex along the axis to the capsule.
    // (it passes beside the capsule to a clamp on the capsule's body, just
    // behind the focus — the capsule faces back into the dish).
    const rod = make();
    rod.addRRect(Skia.RRectXY(Skia.XYWHRect(0, -19, dish.f + 34, 8), 4, 4));
    rod.addRRect(Skia.RRectXY(Skia.XYWHRect(dish.f + 24, -19, 12, 28), 3, 3));
    // The handle behind the vertex, and a pistol grip under it.
    const handle = make();
    handle.addRRect(Skia.RRectXY(Skia.XYWHRect(-150, -22, 150, 44), 14, 14));
    const gripP = make();
    gripP.moveTo(-110, 22);
    gripP.lineTo(-70, 22);
    gripP.lineTo(-58, 170);
    gripP.quadTo(-80, 182, -104, 176);
    gripP.lineTo(-122, 34);
    gripP.close();
    const fur = make();
    const rnd = seeded(dish.D);
    for (let k = 0; k < 60; k++) {
      const a = rnd() * Math.PI * 2;
      const r0 = 34;
      const x = dish.f - 10 + Math.cos(a) * r0;
      const y = Math.sin(a) * r0 * 0.8;
      fur.moveTo(x, y);
      fur.lineTo(x + Math.cos(a) * (10 + rnd() * 10), y + Math.sin(a) * (10 + rnd() * 10));
    }
    const furBody = make();
    furBody.addOval(Skia.XYWHRect(dish.f - 46, -30, 76, 60));
    return { ...b, rod, handle, gripP, fur, furBody };
  }, [dish]);
  const R = dish.D / 2;
  return (
    <Group>
      {/* the handle and grip, behind the vertex */}
      <Path path={g.gripP}>
        <LinearGradient start={vec(-122, 0)} end={vec(-58, 0)} colors={['#4d515b', '#1c1d22']} />
      </Path>
      <Path path={g.handle}>
        <LinearGradient start={vec(0, -22)} end={vec(0, 22)} colors={['#7a7f89', '#3a3d44', '#1d1e22']} />
      </Path>
      <Path path={g.handle} style="stroke" strokeWidth={2} color="#060607" />
      {/* the reflector shell: lit along its inner face */}
      <Path path={g.shell}>
        <LinearGradient start={vec(0, -R)} end={vec(profileZ(R, dish.f), R)} colors={['#c9d4de', '#8c98a5', '#56606c']} />
      </Path>
      <Path path={g.inner} style="stroke" strokeWidth={2.4} color="#e8eef5" opacity={0.85} />
      <Path path={g.shell} style="stroke" strokeWidth={2.2} color="#0a0b0d" />
      {/* the holder and the capsule at the focus, facing the dish (−u) */}
      <Path path={g.rod} color="#3a3d44" />
      <Group transform={[{ translateX: dish.f }, { rotate: -Math.PI / 2 }]}>
        {/* the pencil's front at its origin, body toward +y: turned so the body runs to +u and the front faces −u (the dish) */}
        <SdcMic r={9} len={58} />
      </Group>
      {windscreen ? (
        <Group>
          <Path path={g.furBody} color="#8d8a83" opacity={0.55} />
          <Path path={g.fur} style="stroke" strokeWidth={1.2} strokeCap="round" color="#cfcbc1" opacity={0.7} />
        </Group>
      ) : null}
      {/* the focus */}
      <Circle cx={dish.f} cy={0} r={4} color="#ffc64d" />
    </Group>
  );
}

/** Sound from the target (from +u), λ apart, and what the bowl does with it. */
export function DishWaves({ dish, fHz, reach, px }: { dish: Dish; fHz: number; reach: number; px: number }) {
  const lam = wavelengthMm(fHz);
  const helps = fHz >= helpBelowHz(dish.D);
  const g = useMemo(() => {
    const R = dish.D / 2;
    const span = R * 1.6;
    const fronts = make();
    const uRim = profileZ(R, dish.f);
    // Straight fronts arriving from the right, from the rim's plane out to `reach`.
    for (let u = uRim + lam * 0.35; u < reach; u += lam) {
      fronts.moveTo(u, -span);
      fronts.lineTo(u, span);
    }
    const rays = make();
    if (helps) {
      for (const r of [-0.85, -0.55, -0.25, 0.25, 0.55, 0.85].map((k) => k * R)) {
        const u = profileZ(r, dish.f);
        rays.moveTo(reach, r);
        rays.lineTo(u, r);
        rays.lineTo(dish.f, 0);
      }
    }
    return { fronts, rays };
  }, [dish, lam, helps, reach]);
  return (
    <Group>
      <Path path={g.fronts} style="stroke" strokeWidth={2.2 * px} color="#6fa8ff" opacity={0.55} />
      {helps ? (
        <Path path={g.rays} style="stroke" strokeWidth={1.8 * px} strokeCap="round" color="#ffc64d" opacity={0.85}>
          <DashPathEffect intervals={[8 * px, 6 * px]} />
        </Path>
      ) : null}
    </Group>
  );
}

/** A small dish seen from above (rotationally the same shape), for a plan:
 *  its axis along `aimDeg` (plan, front-up drawing: 0 = up). */
export function DishGlyph({ dish, u, v, aimDeg, scale = 1 }: { dish: Dish; u: number; v: number; aimDeg: number; scale?: number }) {
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: ((aimDeg - 90) * Math.PI) / 180 }, { scale }]}>
      <DishSection dish={dish} windscreen={false} />
    </Group>
  );
}
