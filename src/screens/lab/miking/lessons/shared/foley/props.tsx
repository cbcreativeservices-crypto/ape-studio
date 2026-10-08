/**
 * FOLEY PROPS — the drawings (charter §2 layer 3), true size in mm, the
 * sounding part at the local origin (props.ts holds the numbers). Real
 * objects lit from the upper left, never stand-ins:
 *
 *   KeyRing      a steel ring and four keys (two brass, two steel) hanging
 *                from it — side and plan.
 *   PaperSheet   an A4 sheet on a table, its edge lifting — side and plan.
 *   FoleyDoor    a door on its wheeled Foley stand: the leaf, the frame, the
 *                lever handle and latch; in plan its swing arc and the two
 *                pinch points (dashed, amber: keep-clear marks).
 *   Chair        a wooden chair: seat, back, four legs — side and plan.
 *   PaddedBlock  a padded block (leather over foam) for a safe impact.
 *   Basin        a shallow basin of water on a non-slip mat; in plan the
 *                splash envelope (dashed, illustrative).
 *   BrushBoard   a fabric-covered board and a dry brush on it.
 * Static (D8); textures are combined Paths.
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { make, oval, rect, rrect } from '../concert/paths.ts';
import { BASIN, CHAIR, DOOR, PROP_DIMS, doorEdge, splashRadius } from './propGeom.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const STEEL = ['#f2f4f8', '#b9bec8', '#6b707b', '#3a3d45'];
const BRASS = ['#f6e2a0', '#d2b05a', '#9a7a2c', '#5e4612'];
const WOOD = ['#c99a62', '#9a6b3b', '#6e4824', '#4a2e16'];
const WOOD_LINE = '#2b1a0c';
const AMBER = '#ffc64d';

function Shaded({ path, colors, line = '#101012', w = 2 }: { path: SkPath; colors: string[]; line?: string; w?: number }) {
  const b = path.getBounds();
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={colors} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={w} color={line} />
    </Group>
  );
}

function keyShape(len: number, angle: number, cx: number, cy: number): SkPath {
  // A key: a round bow at the ring, a blade with bitting teeth.
  const p = make();
  p.addCircle(0, 9, 9);
  rrect(p, -3.5, 16, 3.5, len, 1.5);
  for (let y = len * 0.55; y < len - 4; y += 6) rect(p, 3, y, 7, y + 3);
  const m = Skia.Matrix();
  m.translate(cx, cy);
  m.rotate(angle);
  p.transform(m);
  return p;
}

/** The key ring held at its top (the origin): ring and four keys. */
export function KeyRing({ view, swing = 0 }: { view: ViewId; swing?: number }) {
  const g = useMemo(() => {
    const ring = make();
    ring.addCircle(0, 16, 15);
    const hole = make();
    hole.addCircle(0, 16, 11);
    const L = PROP_DIMS.key.mm;
    const keys = [-0.5, -0.15, 0.2, 0.55].map((a, i) => keyShape(L - (i % 2) * 8, a + swing * 0.4, Math.sin(a) * 10, 28 + Math.cos(a) * 4));
    return { ring, hole, keys };
  }, [swing]);
  const flat = view === 'top';
  return (
    <Group transform={flat ? [{ scaleY: 0.45 }] : []}>
      {g.keys.map((k, i) => (
        <Shaded key={i} path={k} colors={i % 2 ? STEEL : BRASS} w={1.2} />
      ))}
      <Path path={g.ring} style="stroke" strokeWidth={4} color="#2a2c32" />
      <Path path={g.ring} style="stroke" strokeWidth={2.4}>
        <LinearGradient start={vec(-15, 0)} end={vec(15, 32)} colors={STEEL} />
      </Path>
    </Group>
  );
}

/** A sheet of A4 on the table (its middle at the origin; the table top is y = 0). */
export function PaperSheet({ view, lift = 0.35 }: { view: ViewId; lift?: number }) {
  const W = PROP_DIMS.paperW.mm;
  const L = PROP_DIMS.paperL.mm;
  const g = useMemo(() => {
    const p = make();
    if (view === 'side') {
      // Edge-on: flat from the near end, the far end curling up as it is lifted.
      p.moveTo(-L / 2, -1.5);
      p.lineTo(0, -1.5);
      p.cubicTo(L * 0.25, -2, L * 0.4, -L * 0.25 * lift, L * 0.48, -L * 0.55 * lift);
      p.lineTo(L * 0.5, -L * 0.55 * lift + 3);
      p.cubicTo(L * 0.4, -L * 0.25 * lift + 3, L * 0.25, 1.5, 0, 1.5);
      p.lineTo(-L / 2, 1.5);
      p.close();
      return { p, shade: make() };
    }
    rect(p, -L / 2, -W / 2, L / 2, W / 2);
    const shade = make();
    rect(shade, L * 0.15, -W / 2, L / 2, W / 2);
    return { p, shade };
  }, [view, lift, L, W]);
  return (
    <Group>
      {view === 'top' ? (
        <Group transform={[{ translateX: 6 }, { translateY: 8 }]}>
          <Path path={g.p} color="#000" opacity={0.35}>
            <BlurMask blur={6} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Path path={g.p}>
        <LinearGradient start={vec(-L / 2, -W / 2)} end={vec(L / 2, W / 2)} colors={['#fbfaf6', '#ecebe4', '#cfcdc4']} />
      </Path>
      <Path path={g.shade} color="#8a8880" opacity={0.18} />
      <Path path={g.p} style="stroke" strokeWidth={1.4} color="#5d5c57" />
    </Group>
  );
}

/** The Foley door on its stand: the handle at the origin, the floor at `floorY`. `open` 0–1 (plan only). */
export function FoleyDoor({ view, floorY, open = 0, marks = true }: { view: ViewId; floorY: number; open?: number; marks?: boolean }) {
  const W = DOOR.W;
  const H = DOOR.H;
  const t = DOOR.t;
  const g = useMemo(() => {
    const top = floorY - H;
    if (view === 'side') {
      // Edge-on (the door's plane is x = 0): the leaf, the jamb behind it, the stand's base, the handle both sides.
      const leaf = make();
      rect(leaf, -t / 2, top, t / 2, floorY - 25);
      const jamb = make();
      rect(jamb, -t / 2 - 18, top - 60, t / 2 + 18, floorY - 60);
      const base = make();
      rrect(base, -420, floorY - 70, 420, floorY - 30, 10);
      const wheels = make();
      for (const x of [-380, 380]) wheels.addCircle(x, floorY - 20, 20);
      const handle = make();
      rrect(handle, -t / 2 - 70, -8, t / 2 + 70, 8, 6);
      rrect(handle, -t / 2 - 12, -24, t / 2 + 12, 24, 6);
      return { leaf, jamb, base, wheels, handle, arc: make(), pinch: make() };
    }
    // Plan: the leaf from the latch edge (z = 0) to the hinge (z = W), swung `open`.
    const e = doorEdge(open);
    const leaf = make();
    const ang = Math.atan2(e.z - W, e.x);
    const nx = -Math.sin(ang) * (t / 2);
    const nz = Math.cos(ang) * (t / 2);
    leaf.moveTo(e.x + nx, e.z + nz);
    leaf.lineTo(nx, W + nz);
    leaf.lineTo(-nx, W - nz);
    leaf.lineTo(e.x - nx, e.z - nz);
    leaf.close();
    const jamb = make();
    rect(jamb, -t / 2 - 18, -60, t / 2 + 18, -10);
    rect(jamb, -t / 2 - 18, W + 10, t / 2 + 18, W + 60);
    const base = make();
    rrect(base, -420, -90, 420, W + 90, 14);
    const handle = make();
    const hx = e.x + (Math.cos(ang) * DOOR.handleZ);
    const hz = e.z + Math.sin(ang) * DOOR.handleZ;
    rrect(handle, hx - 70, hz - 10, hx + 70, hz + 10, 6);
    const arc = make();
    arc.addArc(Skia.XYWHRect(-W, 0, 2 * W, 2 * W), 180, 90);
    const pinch = make();
    pinch.addCircle(0, W, 70);
    pinch.addCircle(0, 0, 60);
    return { leaf, jamb, base, wheels: make(), handle, arc, pinch };
  }, [view, floorY, open, W, H, t]);
  return (
    <Group>
      <Path path={g.base}>
        <LinearGradient start={vec(-420, 0)} end={vec(420, 0)} colors={['#4d515b', '#2a2c32', '#16171b']} />
      </Path>
      <Path path={g.base} style="stroke" strokeWidth={2} color="#08080a" />
      <Path path={g.wheels} color="#111215" />
      <Shaded path={g.jamb} colors={WOOD} line={WOOD_LINE} />
      <Shaded path={g.leaf} colors={['#b07e4a', '#8a5a2e', '#5e3a18']} line={WOOD_LINE} w={2.4} />
      <Shaded path={g.handle} colors={STEEL} w={1.6} />
      {view === 'top' && marks ? (
        <>
          <Path path={g.arc} style="stroke" strokeWidth={6} color={AMBER} opacity={0.8}>
            <DashPathEffect intervals={[18, 12]} />
          </Path>
          <Path path={g.pinch} style="stroke" strokeWidth={5} color={AMBER} opacity={0.85}>
            <DashPathEffect intervals={[8, 6]} />
          </Path>
        </>
      ) : null}
    </Group>
  );
}

/** A wooden chair: its front-right leg's floor contact at the origin (floor y = `floorY`). */
export function Chair({ view, floorY = 0, lift = 0 }: { view: ViewId; floorY?: number; lift?: number }) {
  const S = CHAIR.S;
  const B = CHAIR.back;
  const l = CHAIR.leg;
  const g = useMemo(() => {
    const parts = make();
    const seat = make();
    if (view === 'side') {
      const f = floorY - lift;
      rect(parts, -l, f - S + 30, l, f); // front leg
      rect(parts, -S + 20 - l, f - B, -S + 20 + l, f); // back leg and back post
      rect(parts, -S + 10, f - B, -S + 40, f - B + 260); // top rail
      rect(parts, -S + 30, f - 200, 0, f - 180); // stretcher
      rrect(seat, -S - 10, f - S, 30, f - S + 40, 8);
      return { parts, seat };
    }
    for (const [x, z] of [
      [0, 0],
      [0, -S + 20],
      [-S + 20, 0],
      [-S + 20, -S + 20],
    ] as const)
      rect(parts, x - l, z - l, x + l, z + l);
    rrect(seat, -S - 10, -S - 10 + 20, 30, 30, 20);
    rrect(parts, -S + 5, -S + 10, -S + 45, 20, 8); // the back rail seen from above
    return { parts, seat };
  }, [view, floorY, lift, S, B, l]);
  return (
    <Group>
      {view === 'top' ? (
        <Group transform={[{ translateX: 12 }, { translateY: 16 }]}>
          <Path path={g.seat} color="#000" opacity={0.4}>
            <BlurMask blur={12} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Shaded path={g.parts} colors={WOOD} line={WOOD_LINE} />
      <Shaded path={g.seat} colors={WOOD} line={WOOD_LINE} w={2.2} />
    </Group>
  );
}

/** A padded block (leather over foam): its striking face's middle at the origin, resting on a table top at y = 0. */
export function PaddedBlock({ view, lift = 0 }: { view: ViewId; lift?: number }) {
  const L = PROP_DIMS.blockL.mm;
  const g = useMemo(() => {
    const p = make();
    if (view === 'side') rrect(p, -L / 2, -60 - lift, L / 2, -lift, 14);
    else rrect(p, -L / 2, -50, L / 2, 50, 14);
    const seam = make();
    if (view === 'side') {
      seam.moveTo(-L / 2 + 10, -30 - lift);
      seam.lineTo(L / 2 - 10, -30 - lift);
    } else rrect(seam, -L / 2 + 10, -40, L / 2 - 10, 40, 10);
    return { p, seam };
  }, [view, lift, L]);
  return (
    <Group>
      <Shaded path={g.p} colors={['#7a3e2a', '#5a2a1a', '#3a180e']} line="#1a0a05" w={2} />
      <Path path={g.seam} style="stroke" strokeWidth={2} color="#e0b090" opacity={0.5}>
        <DashPathEffect intervals={[6, 5]} />
      </Path>
    </Group>
  );
}

/** A shallow basin of water: the water's surface middle at the origin; on a mat; in plan the splash envelope. */
export function Basin({ view, splash = true }: { view: ViewId; splash?: boolean }) {
  const R = BASIN.R;
  const D = BASIN.depth;
  const w = BASIN.water;
  const g = useMemo(() => {
    if (view === 'side') {
      const bowl = make();
      bowl.moveTo(-R, -(D - w));
      bowl.lineTo(R, -(D - w));
      bowl.lineTo(R * 0.85, w);
      bowl.lineTo(-R * 0.85, w);
      bowl.close();
      const water = make();
      water.moveTo(-R + 8, 0);
      water.lineTo(R - 8, 0);
      water.lineTo(R * 0.85 - 6, w - 6);
      water.lineTo(-R * 0.85 + 6, w - 6);
      water.close();
      const mat = make();
      rect(mat, -R - 160, w, R + 160, w + 8);
      return { bowl, water, mat, env: make() };
    }
    const bowl = oval(make(), 0, 0, R, R);
    const water = oval(make(), 0, 0, R - 18, R - 18);
    const mat = make();
    rrect(mat, -R - 160, -R - 160, R + 160, R + 160, 30);
    const env = oval(make(), 0, 0, splashRadius(), splashRadius());
    return { bowl, water, mat, env };
  }, [view, R, D, w]);
  return (
    <Group>
      <Path path={g.mat} color="#22301f" />
      <Path path={g.mat} style="stroke" strokeWidth={2} color="#0c120b" />
      <Shaded path={g.bowl} colors={['#e9edf1', '#b7bec6', '#7d858e']} line="#2b2f35" w={2.2} />
      <Path path={g.water}>
        {view === 'top' ? <RadialGradient c={vec(-40, -40)} r={R} colors={['#9fd2f0', '#4c8fb8', '#235a7e']} /> : <LinearGradient start={vec(0, 0)} end={vec(0, w)} colors={['#9fd2f0', '#4c8fb8', '#235a7e']} />}
      </Path>
      {view === 'top' && splash ? (
        <Path path={g.env} style="stroke" strokeWidth={6} color="#6fa8ff" opacity={0.8}>
          <DashPathEffect intervals={[16, 12]} />
        </Path>
      ) : null}
    </Group>
  );
}

/** A fabric-covered board on the table (its middle at the origin) and a dry brush at `brushX` along it. */
export function BrushBoard({ view, brushX = 0 }: { view: ViewId; brushX?: number }) {
  const W = PROP_DIMS.boardW.mm;
  const Dp = PROP_DIMS.boardD.mm;
  const g = useMemo(() => {
    const board = make();
    const weave = make();
    const brush = make();
    const bristles = make();
    if (view === 'side') {
      rect(board, -W / 2, 0, W / 2, 18);
      rrect(brush, brushX - 110, -70, brushX + 110, -30, 12);
      for (let x = brushX - 100; x <= brushX + 100; x += 8) {
        bristles.moveTo(x, -30);
        bristles.lineTo(x + 3, 0);
      }
    } else {
      rect(board, -W / 2, -Dp / 2, W / 2, Dp / 2);
      for (let x = -W / 2 + 10; x < W / 2; x += 12) {
        weave.moveTo(x, -Dp / 2);
        weave.lineTo(x, Dp / 2);
      }
      rrect(brush, brushX - 110, -40, brushX + 110, 40, 16);
    }
    return { board, weave, brush, bristles };
  }, [view, brushX, W, Dp]);
  return (
    <Group>
      <Shaded path={g.board} colors={['#8a7a5a', '#6a5a3e', '#4a3e28']} line="#1a140a" />
      <Path path={g.weave} style="stroke" strokeWidth={2} color="#2a2214" opacity={0.4} />
      <Path path={g.bristles} style="stroke" strokeWidth={2.2} color="#c8a46a" opacity={0.9} />
      <Shaded path={g.brush} colors={WOOD} line={WOOD_LINE} />
    </Group>
  );
}
