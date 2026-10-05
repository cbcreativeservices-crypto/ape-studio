/**
 * THE SHARED CYMBAL FAMILY, Lab 2 additions — the look of cymbalFx.ts at the
 * Kick's illustration standard (bronze gradients, upper-left light, a rim
 * highlight, lathing, chrome hardware), beside CymbalArt.tsx (unchanged):
 *
 *   ChinaSide / ChinaTop    the China, upright or inverted, on its stand's
 *                           tilter: flat-topped cup, falling shoulder, the
 *                           valley and the upturned lip (all drawing defaults).
 *   SplashArmSide / Top     the 10 in splash on its Z-shaped arm, clamped to
 *                           the tom holder's post.
 *   PiggybackSide / Top     the 8 in splash inverted on top of the 18 in crash,
 *                           felts between, one rod and one wing nut.
 *
 * Nothing moves (D8). Coordinates: mm of the view's (u, v).
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, FillType, Group, LinearGradient, Path, RadialGradient, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { KIT_PLACED_CYMBALS, surfaceHeight, CYMBAL_HARDWARE as HW } from './cymbalSpec.ts';
import { CymbalSide, CymbalTop } from './CymbalArt';
import { CHINA_18, CHINA_TOP, PIGGY_GAP, SPLASH_10, SPLASH_8, chinaAreas, chinaHeight, splashArmPoints, type FxPlaced } from './cymbalFx.ts';
import { MountStack, PlanRing, PlanShadow, PlateSide, SwingFan, plateTransform } from './CymbalKitArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const DEG = Math.PI / 180;
const BRONZE = ['#fbe3a6', '#e2b25c', '#b9852f', '#80561a', '#4f3410'];
const BRONZE_EDGE = '#5e3e12';
const BELL = ['#fff3cf', '#efc677', '#b6842f', '#6e4914'];
const make = () => Skia.Path.Make();
const oval = (cx: number, cy: number, rx: number, ry: number) => {
  const p = make();
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
};

/* ═════════════ the China ═════════════ */

/** The China from the side on its tilter (`place.inverted`: cup down, lip up). */
export function ChinaSide({ place, swing = false, dim = 1 }: { place: FxPlaced; swing?: boolean; dim?: number }) {
  const inv = !!place.inverted;
  const T = CHINA_18.drawT.mm;
  // Upright: the bottom felt meets the cup's underside, the top felt sits on
  // the cup. Inverted: the cup's outside rests on the bottom felt, the top
  // felt on the cup's inner floor.
  const seat = inv ? CHINA_TOP : -(CHINA_TOP - T);
  const top = inv ? CHINA_TOP - T : -CHINA_TOP;
  const overClip = useMemo(() => oval(0, top - 12, 26, 26), [top]);
  return (
    <Group opacity={dim} transform={plateTransform(place.c, place.tiltDeg)}>
      {swing ? <SwingFan R={CHINA_18.d.mm / 2} rise={CHINA_TOP} /> : null}
      <MountStack seat={seat} top={top} />
      <PlateSide spec={CHINA_18} height={chinaHeight} inverted={inv} keyId="china18" />
      {/* the felt and wing nut again over the plate (they sit on it) */}
      <Group clip={overClip}>
        <MountStack seat={seat} top={top} />
      </Group>
    </Group>
  );
}

let chinaTopPaths: { disc: SkPath; valley: SkPath; lip: SkPath; cup: SkPath; rings: SkPath; cupRings: SkPath } | null = null;
function chinaTop(ct: number) {
  const R = CHINA_18.d.mm / 2;
  const A = chinaAreas();
  const disc = oval(0, 0, R * ct, R);
  const valley = make();
  valley.addOval(Skia.XYWHRect(-A.lip[0] * ct - 3, -A.lip[0] - 3, (A.lip[0] + 3) * 2 * ct, (A.lip[0] + 3) * 2));
  const lip = make();
  lip.addOval(Skia.XYWHRect(-R * ct, -R, 2 * R * ct, 2 * R));
  lip.addOval(Skia.XYWHRect(-A.lip[0] * ct, -A.lip[0], 2 * A.lip[0] * ct, 2 * A.lip[0]));
  lip.setFillType(FillType.EvenOdd);
  const cup = oval(0, 0, A.cup[1] * ct, A.cup[1]);
  const rings = make();
  for (let q = A.cup[1] + 6; q < R - 4; q += 6) rings.addOval(Skia.XYWHRect(-q * ct, -q, 2 * q * ct, 2 * q));
  const cupRings = make();
  for (let q = 7; q < A.cup[1] - 4; q += 7) cupRings.addOval(Skia.XYWHRect(-q * ct, -q, 2 * q * ct, 2 * q));
  return { disc, valley, lip, cup, rings, cupRings };
}

/** The China from above: the lathed shoulder, the dark valley ring, the
 *  lip (lighter: it turns toward the light), the flat cup. */
export function ChinaTop({ place, highlight = false, dim = 1 }: { place: FxPlaced; highlight?: boolean; dim?: number }) {
  const ct = Math.cos(place.tiltDeg * DEG);
  const g = (chinaTopPaths ??= chinaTop(ct));
  const R = CHINA_18.d.mm / 2;
  const cupR = chinaAreas().cup[1];
  return (
    <Group>
      <Group opacity={dim} transform={[{ translateX: place.c.x }, { translateY: place.c.z }]}>
        <PlanShadow cx={0} cz={0} R={R} />
        <Path path={g.disc}>
          <RadialGradient c={vec(-R * 0.38 * ct, -R * 0.42)} r={R * 1.75} colors={BRONZE} positions={[0, 0.2, 0.48, 0.78, 1]} />
        </Path>
        <Path path={g.disc} opacity={0.45}>
          <SweepGradient c={vec(0, 0)} colors={['rgba(255,244,214,0)', 'rgba(255,244,214,0.5)', 'rgba(255,244,214,0)', 'rgba(255,244,214,0)', 'rgba(255,244,214,0.28)', 'rgba(255,244,214,0)']} positions={[0, 0.16, 0.3, 0.62, 0.7, 0.8]} />
        </Path>
        <Path path={g.rings} style="stroke" strokeWidth={1.3} color="#4f3410" opacity={0.25} />
        {/* the lip turns up toward the light: a brighter band outside the valley */}
        <Path path={g.lip} color="#fff0c4" opacity={0.2} />
        <Path path={g.valley} style="stroke" strokeWidth={5} color="#3a260a" opacity={0.75} />
        <Path path={g.cup}>
          <RadialGradient c={vec(-cupR * 0.3 * ct, -cupR * 0.35)} r={cupR * 1.5} colors={place.inverted ? ['#9a6c26', '#6e4914', '#3e2a0c'] : BELL} />
        </Path>
        <Path path={g.cupRings} style="stroke" strokeWidth={1} color="#6e4914" opacity={0.35} />
        <Path path={g.cup} style="stroke" strokeWidth={2.4} color={BRONZE_EDGE} />
        <Circle cx={0} cy={0} r={HW.feltD.mm / 2} color="#2a2230" />
        <Circle cx={0} cy={0} r={7} color="#c8ccd4" />
        <Path path={g.disc} style="stroke" strokeWidth={3} color={BRONZE_EDGE} />
      </Group>
      {highlight ? <PlanRing cx={place.c.x} cz={place.c.z} R={R} tiltDeg={place.tiltDeg} /> : null}
    </Group>
  );
}

/* ═════════════ the splash on its arm ═════════════ */

function armPath(view: 'side' | 'top'): SkPath {
  const a = splashArmPoints();
  const v = (p: { x: number; y: number; z: number }) => (view === 'side' ? p.y : p.z);
  const p = make();
  p.moveTo(a.clamp.x, v(a.clamp));
  p.lineTo(a.up.x, v(a.up));
  p.lineTo(a.elbow.x, v(a.elbow));
  p.lineTo(a.tilter.x, v(a.tilter));
  return p;
}
const armCache: Partial<Record<'side' | 'top', SkPath>> = {};

/** The Z-shaped rod (Ø 9.5 mm) and its multi-clamp on the tom holder's post. */
export function SplashArm({ view, dim = 1 }: { view: 'side' | 'top'; dim?: number }) {
  const p = (armCache[view] ??= armPath(view));
  const a = splashArmPoints();
  const cv = view === 'side' ? a.clamp.y : a.clamp.z;
  const clamp = useMemo(() => {
    const q = make();
    q.addRRect(Skia.RRectXY(Skia.XYWHRect(a.clamp.x - 22, cv - 32, 44, 64), 8, 8));
    return q;
  }, [a.clamp.x, cv]);
  return (
    <Group opacity={dim}>
      <Path path={p} style="stroke" strokeWidth={14} strokeCap="round" strokeJoin="round" color="#16171b" />
      <Path path={p} style="stroke" strokeWidth={9.5} strokeCap="round" strokeJoin="round" color="#a9aeb8" />
      <Path path={p} style="stroke" strokeWidth={2.4} strokeCap="round" strokeJoin="round" color="#f2f4f8" opacity={0.6} />
      {/* the multi-clamp */}
      <Path path={clamp}>
        <LinearGradient start={vec(a.clamp.x - 22, 0)} end={vec(a.clamp.x + 22, 0)} colors={['#2a2c32', '#c8ccd4', '#6c717c', '#2a2c32']} />
      </Path>
      <Circle cx={a.clamp.x + 26} cy={cv} r={7} color="#2a2c32" />
    </Group>
  );
}

export function SplashArmSide({ place, swing = false }: { place: FxPlaced; swing?: boolean }) {
  return (
    <Group>
      <SplashArm view="side" />
      {swing ? (
        <Group transform={plateTransform(place.c, place.tiltDeg)}>
          <SwingFan R={SPLASH_10.d.mm / 2} rise={SPLASH_10.rise.mm} />
        </Group>
      ) : null}
      <CymbalSide spec={SPLASH_10} cx={place.c.x} cy={place.c.y} tiltDeg={place.tiltDeg} />
    </Group>
  );
}
export function SplashArmTop({ place, highlight = false }: { place: FxPlaced; highlight?: boolean }) {
  return (
    <Group>
      <SplashArm view="top" />
      <CymbalTop spec={SPLASH_10} cx={place.c.x} cz={place.c.z} tiltDeg={place.tiltDeg} highlight={highlight} />
    </Group>
  );
}

/* ═════════════ the piggyback: an 8 in splash inverted on the 18 in crash ═════════════ */

export function PiggybackSide({ splash, swing = false, dim = 1 }: { splash: FxPlaced; swing?: boolean; dim?: number }) {
  const host = KIT_PLACED_CYMBALS.crash2;
  const hs = host.spec;
  const r2 = hs.rise.mm;
  const t2 = hs.drawT.mm;
  const r8 = SPLASH_8.rise.mm;
  const t8 = SPLASH_8.drawT.mm;
  const gap = PIGGY_GAP.mm;
  // In the crash's frame (up the screen = −y): the crash's bell top at −r2,
  // the splash's edge plane at −(r2 + gap), its inverted bell's floor at
  // −(r2 + gap) + r8 − t8 (where the top felt and the wing nut sit).
  const seat = -(r2 - t2);
  const top = -(r2 + gap) + r8 - t8;
  const midFelt = useMemo(() => {
    const p = make();
    const fR = HW.feltD.mm / 2;
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-fR * 0.8, -(r2 + gap) + r8, fR * 1.6, gap - r8), 2, 2));
    return p;
  }, [r2, gap, r8]);
  const overClip = useMemo(() => oval(0, top - 12, 26, 26), [top]);
  const edge = useMemo(() => {
    const p = make();
    p.moveTo(-SPLASH_8.d.mm / 2, -(r2 + gap));
    p.lineTo(SPLASH_8.d.mm / 2, -(r2 + gap));
    return p;
  }, [r2, gap]);
  return (
    <Group opacity={dim} transform={plateTransform(host.c, host.tiltDeg)}>
      {swing ? <SwingFan R={hs.d.mm / 2} rise={r2} /> : null}
      <MountStack seat={seat} top={top} />
      <PlateSide spec={hs} height={(r) => surfaceHeight(hs, r)} keyId={hs.id} />
      <Path path={midFelt}>
        <LinearGradient start={vec(0, -(r2 + gap))} end={vec(0, -r2)} colors={['#4a3b52', '#2a2230', '#17121b']} />
      </Path>
      <Group transform={[{ translateY: -(r2 + gap) }]}>
        <PlateSide spec={SPLASH_8} height={(r) => surfaceHeight(SPLASH_8, r)} inverted keyId="splash8" />
      </Group>
      <Group clip={overClip}>
        <MountStack seat={seat} top={top} />
      </Group>
      <Path path={edge} style="stroke" strokeWidth={1} color="#fff6dc" opacity={0.3}>
        <DashPathEffect intervals={[4, 6]} />
      </Path>
    </Group>
  );
}

export function PiggybackTop({ splash, highlight = false }: { splash: FxPlaced; highlight?: boolean }) {
  const host = KIT_PLACED_CYMBALS.crash2;
  return (
    <Group>
      <CymbalTop spec={host.spec} cx={host.c.x} cz={host.c.z} tiltDeg={host.tiltDeg} mount={false} />
      <CymbalTop spec={SPLASH_8} cx={splash.c.x} cz={splash.c.z} tiltDeg={splash.tiltDeg} highlight={highlight} />
    </Group>
  );
}
