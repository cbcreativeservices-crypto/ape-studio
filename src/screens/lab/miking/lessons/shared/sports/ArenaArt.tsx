/**
 * ARENA ART — the drawings Lab 7 part 2, group 3 (lab7-g6) adds to the venue
 * plan (VenueArt.tsx imports these; nothing here imports VenueArt):
 *
 *   SURFACE_G3   a synthetic running track, a mat, a ring's canvas, an
 *                arena's sand footing, pool water and a circuit's asphalt
 *   TokensArt    a HORSE and a CAR seen from above (owner decision D7-3,
 *                default: plan silhouettes only — no detailed animal or car
 *                art, no team marks): drawn at their real size (a horse
 *                about 2.6 m nose to tail, a car about 4.6 × 1.9 m), never
 *                smaller than a readable mark
 *   G3MicGlyph   the stereo pairs on a plan — a near-coincident ORTF pair, a
 *                spaced pair, Mid-Side (a forward small condenser over a
 *                side-address figure-8) — and a HYDROPHONE with its cable;
 *                fixed screen size, a mark (not to scale)
 *   hydroCloseUp the hydrophone's container cut through: still water, the
 *                sensor hanging in it on its cable, the cable strain-relieved
 *                over the rim to the dry side, every connector and the
 *                recorder there (D7-4 default: kept, "every connector on the
 *                dry side"); no dimension printed (drawing defaults)
 *
 * Static Skia, lit from the upper left; marks keep their weight at any zoom
 * (`px` = mm per screen pixel).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import type { FieldInset } from '../field/FieldStage';
import { DEG, dirFromDeg, planUV, type P2, type SurfaceG3, type Token, type VenueScene } from './venuePlan.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();

export const SURFACE_G3: Record<SurfaceG3, { around: [string, string]; play: [string, string]; stripe?: string }> = {
  track: { around: ['#3a4a33', '#28351f'], play: ['#b5583f', '#86392a'] },
  mat: { around: ['#3a3b40', '#2a2b30'], play: ['#3768ad', '#244b83'] },
  canvas: { around: ['#2c2d33', '#1d1e22'], play: ['#d3d7dd', '#a9afb8'] },
  sand: { around: ['#3a4a33', '#28351f'], play: ['#c4a676', '#957a50'] },
  water: { around: ['#5b636e', '#3d434c'], play: ['#4aa3d4', '#1d6c9d'] },
  asphalt: { around: ['#3a4f2f', '#27371f'], play: ['#55585e', '#383a3f'] },
};

/* ═════════ the plan silhouettes (D7-3) ═════════ */

/** A smooth closed outline through points (quadratic curves between
 *  midpoints) — the silhouettes' skin. */
function smoothClosed(pts: readonly { x: number; y: number }[]): SkPath {
  const p = make();
  const n = pts.length;
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const m0 = mid(pts[n - 1], pts[0]);
  p.moveTo(m0.x, m0.y);
  for (let i = 0; i < n; i++) {
    const c = pts[i];
    const m = mid(c, pts[(i + 1) % n]);
    p.quadTo(c.x, c.y, m.x, m.y);
  }
  p.close();
  return p;
}
/** One side of a symmetric outline (x along the body, y = half-width; +x
 *  forward), mirrored into a closed loop. Units: metres. */
function mirrored(half: readonly [number, number][]): { x: number; y: number }[] {
  const top = half.map(([x, y]) => ({ x, y }));
  const bottom = half
    .slice()
    .reverse()
    .filter(([, y]) => y > 0)
    .map(([x, y]) => ({ x, y: -y }));
  return [...top, ...bottom];
}

/** A horse from above, facing +x (metres): tail, quarters, barrel,
 *  shoulders, neck and head. */
const HORSE_HALF: readonly [number, number][] = [
  [-1.46, 0],
  [-1.3, 0.06],
  [-1.08, 0.1],
  [-1.02, 0.22],
  [-0.88, 0.31],
  [-0.55, 0.34],
  [-0.05, 0.36],
  [0.32, 0.33],
  [0.5, 0.27],
  [0.62, 0.2],
  [0.86, 0.15],
  [1.04, 0.15],
  [1.2, 0.13],
  [1.44, 0.1],
  [1.6, 0.07],
  [1.67, 0],
];
/** A car from above, facing +x (metres): a closed race or rally car. */
const CAR_HALF: readonly [number, number][] = [
  [-2.3, 0],
  [-2.3, 0.8],
  [-2.1, 0.94],
  [-0.6, 0.95],
  [1.2, 0.92],
  [1.95, 0.82],
  [2.3, 0.55],
  [2.35, 0],
];

function tokenPaths(kind: Token['kind']) {
  if (kind === 'horse') {
    const body = smoothClosed(mirrored(HORSE_HALF));
    const mane = make();
    mane.moveTo(0.5, 0);
    mane.quadTo(0.8, 0.01, 1.04, 0);
    const tail = make();
    tail.moveTo(-1.04, 0);
    tail.quadTo(-1.24, 0.04, -1.42, 0);
    const ears = make();
    for (const s of [1, -1]) {
      ears.moveTo(1.02, s * 0.06);
      ears.lineTo(1.16, s * 0.12);
      ears.lineTo(1.03, s * 0.14);
      ears.close();
    }
    return { body, details: [{ p: mane, w: 0.07, c: '#2a1a10' }, { p: tail, w: 0.09, c: '#24160d' }], fills: [{ p: ears, c: '#4a2e1c' }], colors: ['#a06a3f', '#7a4a28', '#4d2d18'] as const, len: 3.1, minPx: 44 };
  }
  const body = smoothClosed(mirrored(CAR_HALF));
  const glass = make();
  glass.moveTo(0.95, 0.72);
  glass.lineTo(0.45, 0.78);
  glass.lineTo(0.45, -0.78);
  glass.lineTo(0.95, -0.72);
  glass.close();
  glass.moveTo(-1.05, 0.7);
  glass.lineTo(-1.35, 0.66);
  glass.lineTo(-1.35, -0.66);
  glass.lineTo(-1.05, -0.7);
  glass.close();
  const roof = make();
  roof.addRRect(Skia.RRectXY(Skia.XYWHRect(-1.05, -0.74, 1.5, 1.48), 0.12, 0.12));
  const tyres = make();
  for (const x of [1.35, -1.4]) for (const y of [0.98, -0.98]) tyres.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 0.33, y - 0.13, 0.66, 0.26), 0.06, 0.06));
  const wing = make();
  wing.addRect(Skia.XYWHRect(-2.42, -0.9, 0.2, 1.8));
  return { body, details: [], fills: [{ p: tyres, c: '#111214' }, { p: wing, c: '#202227' }, { p: roof, c: '#d9dde3' }, { p: glass, c: '#1b2a38' }], colors: ['#e2463a', '#b12a22', '#6e1712'] as const, len: 4.8, minPx: 36 };
}

function TokenArt({ t, px }: { t: Token; px: number }) {
  const g = useMemo(() => tokenPaths(t.kind), [t.kind]);
  const o = planUV(t.p);
  const d = dirFromDeg(t.dirDeg);
  const ang = Math.atan2(-d.y, d.x); // screen angle of the facing
  // Real size in mm; never smaller than a readable mark.
  const s = Math.max(1000, (g.minPx * px) / g.len);
  return (
    <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: ang }, { scale: s }]}>
      <Group transform={[{ translateX: -0.08 }, { translateY: 0.1 }]}>
        <Path path={g.body} color="#000" opacity={0.45}>
          <BlurMask blur={0.08} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(-1, -1)} end={vec(1, 1)} colors={[...g.colors]} />
      </Path>
      {g.fills.map((f, i) => (
        <Path key={i} path={f.p} color={f.c} />
      ))}
      {g.details.map((q, i) => (
        <Path key={`d${i}`} path={q.p} style="stroke" strokeWidth={q.w} strokeCap="round" color={q.c} />
      ))}
      <Path path={g.body} style="stroke" strokeWidth={Math.max(0.02, (1.1 * px) / s)} color="#0b0c0f" opacity={0.8} />
    </Group>
  );
}

/** Every token on a plan (nothing when the scene has none). */
export function TokensArt({ scene, px }: { scene: VenueScene; px: number }) {
  if (!scene.tokens?.length) return null;
  return (
    <Group>
      {scene.tokens.map((t) => (
        <TokenArt key={t.id} t={t} px={px} />
      ))}
    </Group>
  );
}

/* ═════════ the stereo pairs and the hydrophone on a plan ═════════ */

export type G3MicKind = 'ortf' | 'ab' | 'ms' | 'hydrophone';
export const G3_KINDS: readonly G3MicKind[] = ['ortf', 'ab', 'ms', 'hydrophone'];
export const isG3Kind = (k: string): k is G3MicKind => (G3_KINDS as readonly string[]).includes(k);
/** A stereo pair or an array: it aims into an area, not at one point. */
export const isPairKind = (k: string): boolean => k === 'ortf' || k === 'ab' || k === 'ms';

/** A pair glyph at a plan point, aimed at `aimDeg` (as dirFromDeg), drawn at a
 *  fixed screen size (`sizePx` long) — a mark, not to scale. */
export function G3MicGlyph({ at, aimDeg, kind, px, sizePx = 30, tint }: { at: P2; aimDeg: number; kind: G3MicKind; px: number; sizePx?: number; tint?: string }) {
  const o = planUV(at);
  const d = dirFromDeg(aimDeg);
  const screen = Math.atan2(-d.y, d.x);
  const rot = screen + Math.PI / 2;
  const k = (sizePx * px) / 104;
  if (kind === 'hydrophone') return <HydroGlyph u={o.u} v={o.v} rot={rot} k={(sizePx * px) / 120} />;
  if (kind === 'ms')
    return (
      <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: rot }, { scale: k }]}>
        <Group transform={[{ translateX: 0 }, { translateY: 34 }, { rotate: Math.PI / 2 }]}>
          <MikingMicArt art="sideLdc" r={22} len={96} cross={44} tint={tint} />
        </Group>
        <MikingMicArt art="sdc" r={10.5} len={104} tint={tint} />
      </Group>
    );
  // ORTF: two small condensers splayed ±55°, close together; spaced: two parallel, apart.
  const pair = kind === 'ortf' ? [-55, 55].map((a) => ({ a, dx: (a < 0 ? -1 : 1) * 16 })) : [0, 0].map((a, i) => ({ a, dx: i === 0 ? -46 : 46 }));
  return (
    <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: rot }, { scale: k }]}>
      <Path
        path={(() => {
          const b = make();
          b.addRRect(Skia.RRectXY(Skia.XYWHRect(-60, 22, 120, 9), 3, 3));
          return b;
        })()}
        color="#2b2d33"
      />
      {pair.map((q, i) => (
        <Group key={i} transform={[{ translateX: q.dx }, { translateY: 0 }, { rotate: q.a * DEG }, { scale: 0.8 }]}>
          <MikingMicArt art="sdc" r={10.5} len={104} tint={tint} />
        </Group>
      ))}
    </Group>
  );
}

/** A hydrophone from above: a moulded sensor body, its strain boot and the
 *  cable trailing behind. Local front = −y. */
function HydroGlyph({ u, v, rot, k }: { u: number; v: number; rot: number; k: number }) {
  const g = useMemo(() => {
    const body = make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-16, -40, 32, 62), 15, 15));
    const boot = make();
    boot.moveTo(-9, 22);
    boot.lineTo(9, 22);
    boot.lineTo(5, 44);
    boot.lineTo(-5, 44);
    boot.close();
    const cable = make();
    cable.moveTo(0, 44);
    cable.cubicTo(6, 70, -8, 92, 2, 120);
    return { body, boot, cable };
  }, []);
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: rot }, { scale: k }]}>
      <Path path={g.cable} style="stroke" strokeWidth={5} strokeCap="round" color="#15161a" />
      <Path path={g.boot} color="#26282e" />
      <Path path={g.body}>
        <LinearGradient start={vec(-16, -40)} end={vec(16, 22)} colors={['#5d636e', '#2b2e35', '#121317']} />
      </Path>
      <Circle cx={-5} cy={-26} r={4} color="#8d95a1" opacity={0.6} />
    </Group>
  );
}

/* ═════════ the hydrophone's container, cut through (the setups' corner box) ═════════ */

/** Section units: mm, u across the container (0 = its left wall), v = −height
 *  above the floor. Every size is a drawing default (never printed). */
const SEC = { w: 900, h: 600, water: 500, depth: 250, wall: 18, dryU: 1260 } as const;

export function hydroCloseUp(at: FieldInset['at']): FieldInset {
  return {
    view: 'side',
    box: { u0: -100, u1: SEC.dryU + 560, v0: -SEC.h - 240, v1: 160 },
    at,
    draw: (px) => <HydroSection px={px} />,
    labels: [
      { id: 'w', text: 'STILL WATER', short: 'WATER', u: SEC.w / 2, v: -SEC.water / 2 + 120, align: 'center', tone: 'muted' },
      { id: 'd', text: 'DRY SIDE', short: 'DRY', u: SEC.dryU + 180, v: -SEC.h - 150, align: 'center', tone: 'amber' },
    ],
  };
}

function HydroSection({ px }: { px: number }) {
  const g = useMemo(() => {
    const tank = make();
    tank.moveTo(0, -SEC.h);
    tank.lineTo(0, 0);
    tank.lineTo(SEC.w, 0);
    tank.lineTo(SEC.w, -SEC.h);
    const water = make();
    water.addRect(Skia.XYWHRect(SEC.wall / 2, -SEC.water, SEC.w - SEC.wall, SEC.water - SEC.wall / 2));
    const surf = make();
    surf.moveTo(SEC.wall / 2, -SEC.water);
    surf.lineTo(SEC.w - SEC.wall / 2, -SEC.water);
    const floor = make();
    floor.addRect(Skia.XYWHRect(-400, 0, 3200, 200));
    const wall = make();
    wall.addRect(Skia.XYWHRect(-400, -SEC.h - 600, 3200, SEC.h + 600));
    const sensorX = SEC.w * 0.46;
    const sensorV = -SEC.water + SEC.depth;
    const sensor = make();
    sensor.addRRect(Skia.RRectXY(Skia.XYWHRect(sensorX - 30, sensorV - 26, 60, 90), 28, 28));
    // The cable: up from the sensor, over the rim, clipped there, down and across to the dry side.
    const cable = make();
    cable.moveTo(sensorX, sensorV - 26);
    cable.cubicTo(sensorX, -SEC.h - 60, SEC.w * 0.8, -SEC.h - 90, SEC.w, -SEC.h - 30);
    cable.cubicTo(SEC.w + 200, -SEC.h + 40, SEC.w + 220, -40, SEC.w + 380, -26);
    cable.lineTo(SEC.dryU - 40, -26);
    const clip = make();
    clip.addRRect(Skia.RRectXY(Skia.XYWHRect(SEC.w - 30, -SEC.h - 60, 60, 70), 10, 10));
    const box = make();
    box.addRRect(Skia.RRectXY(Skia.XYWHRect(SEC.dryU, -260, 420, 260), 24, 24));
    const xlr = make();
    xlr.addRRect(Skia.RRectXY(Skia.XYWHRect(SEC.dryU - 70, -60, 80, 60), 12, 12));
    const dry = make();
    dry.addRRect(Skia.RRectXY(Skia.XYWHRect(SEC.dryU - 160, -SEC.h - 60, 640, SEC.h + 60), 30, 30));
    return { tank, water, surf, floor, wall, sensor, cable, clip, box, xlr, dry, sensorX, sensorV };
  }, []);
  return (
    <Group>
      <Path path={g.wall} color="#4b5b6d" />
      <Path path={g.floor} color="#3b3a37" />
      <Path path={g.dry} style="stroke" strokeWidth={1.6 * px} color="#ffc64d" opacity={0.75} />
      <Path path={g.water}>
        <LinearGradient start={vec(0, -SEC.water)} end={vec(0, 0)} colors={['#5fb3e0', '#1d6c9d']} />
      </Path>
      <Path path={g.surf} style="stroke" strokeWidth={2 * px} color="#d9f0ff" opacity={0.9} />
      <Path path={g.tank} style="stroke" strokeWidth={SEC.wall} color="#9aa3ad" strokeJoin="round" />
      <Path path={g.cable} style="stroke" strokeWidth={Math.max(12, 2.4 * px)} strokeCap="round" color="#15161a" />
      <Path path={g.clip} color="#6b707b" />
      <Path path={g.sensor}>
        <LinearGradient start={vec(g.sensorX - 30, g.sensorV - 26)} end={vec(g.sensorX + 30, g.sensorV + 64)} colors={['#5d636e', '#2b2e35', '#121317']} />
      </Path>
      <Path path={g.xlr} color="#2b2d33" />
      <Path path={g.box}>
        <LinearGradient start={vec(SEC.dryU, -260)} end={vec(SEC.dryU + 420, 0)} colors={['#4a4e57', '#24262c', '#121317']} />
      </Path>
      <Circle cx={SEC.dryU + 300} cy={-130} r={46} color="#0b0c0f" />
      <Circle cx={SEC.dryU + 300} cy={-130} r={46} style="stroke" strokeWidth={8} color="#5b5f69" />
    </Group>
  );
}
