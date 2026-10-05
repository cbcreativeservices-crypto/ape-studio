/**
 * A12 ACOUSTIC PIPE ORGAN — the look (charter §2 layer 3): the shared organ
 * drawings (shared/organ/OrganArt.tsx) placed for the placement scene, the
 * MEET page's façade, and the sound page's three pictures:
 *   PipesFigure     an open pipe and a stopped pipe with their pressure
 *                   swing drawn inside (pipeModel.pipePressure) — same pitch
 *                   at half the length, or an octave apart at the same length
 *   ArrivalsFigure  the nave from above with straight paths from each
 *                   division to a listening position and their arrival times
 *   NaveFigure      the nave cut along its length with one lengthwise
 *                   resonance near a pedal note, and the pair's position on it
 * Every one is a simplified picture, said once on its badge. Static (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { FrontArt } from '../shared/metal/metalPages';
import { HIGHLIGHT, OrganFacade, OrganSide, OrganTop } from '../shared/organ/OrganArt';
import { arrivalMs, navePressure, pipePressure } from '../shared/organ/pipeModel.ts';
import { CASE, CONSOLE, DIVISIONS, divisionPoint, NAVE, ORGAN, PA, type DivisionId } from './model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';

/* ═══════════════ the placement scene ═══════════════ */

function labels(view: ViewId, variant: VariantId): ArtLabel[] {
  return view === 'side'
    ? [
        { id: 'case', text: 'ORGAN CASE', short: 'CASE', u: 600, v: -10400, align: 'left', at: { u: -800, v: -9800 } },
        { id: 'console', text: 'CONSOLE', u: (CONSOLE.x0 + CONSOLE.x1) / 2, v: -2300, align: 'center', tone: 'muted' },
        { id: 'pews', text: 'PEWS', u: 12000, v: -1400, align: 'center', tone: 'muted' },
        ...(variant === 'service' ? [{ id: 'pa', text: 'PA', u: PA.x, v: -PA.h1 - 400, align: 'center' as const, tone: 'muted' as const }] : []),
      ]
    : [
        { id: 'case', text: 'ORGAN CASE', short: 'CASE', u: -1250, v: -CASE.zHalf - 900, align: 'center', at: { u: -1250, v: -CASE.zHalf } },
        { id: 'aisle', text: 'AISLES · KEEP CLEAR', short: 'AISLES', u: 15500, v: -(ORGAN.aisleZ0.mm + ORGAN.aisleZ1.mm) / 2, align: 'center', tone: 'illustrative' },
        { id: 'console', text: 'CONSOLE', u: (CONSOLE.x0 + CONSOLE.x1) / 2, v: CONSOLE.z0 - 500, align: 'center', tone: 'muted' },
      ];
}

function hit(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  if (u <= tol && u >= CASE.x0 - tol && (view === 'side' ? v >= CASE.top - tol : Math.abs(v) <= CASE.zHalf + tol)) return 'org.case';
  if (u >= CONSOLE.x0 - tol && u <= CONSOLE.x1 + tol && (view === 'side' ? v >= -CONSOLE.h - 300 : v >= CONSOLE.z0 - tol && v <= CONSOLE.z1 + tol)) return 'org.console';
  return null;
}

export const A12_ART: LessonArt = {
  Instrument: ({ view, variant }: { view: ViewId; variant: VariantId }) => (view === 'side' ? <OrganSide variant={variant} /> : <OrganTop variant={variant} />),
  labels,
  hitTest: hit,
};

/* ═══════════════ the MEET page: the façade ═══════════════ */

const FACADE_BOX = { u0: -5200, u1: 5200, v0: -11200, v1: 700 };

function facadeLabels(): ArtLabel[] {
  const P = DIVISIONS.pedal;
  return [
    { id: 'swell', text: 'SWELL · SHUTTERS', short: 'SWELL', u: 0, v: DIVISIONS.swell.y0 - 500, align: 'center', at: { u: 0, v: DIVISIONS.swell.y0 + 200 } },
    { id: 'great', text: 'GREAT', u: 0, v: -3150, align: 'center', tone: 'muted' },
    { id: 'pedalL', text: 'PEDAL', u: -(P.z0 + P.z1) / 2, v: -500, align: 'center', tone: 'muted' },
    { id: 'pedalR', text: 'PEDAL', u: (P.z0 + P.z1) / 2, v: -500, align: 'center', tone: 'muted' },
    { id: 'positive', text: 'POSITIVE', u: 0, v: 400, align: 'center', at: { u: 0, v: -1000 } },
  ];
}

function facadeHit(u: number, v: number, tol: number): string | null {
  const z = Math.abs(u);
  const inside = (d: DivisionId) => {
    const q = DIVISIONS[d];
    return z >= Math.min(Math.abs(q.z0), q.z0 < 0 ? 0 : q.z0) - tol && z <= Math.abs(q.z1) + tol && v >= q.y0 - tol && v <= q.y1 + tol;
  };
  if (z >= DIVISIONS.pedal.z0 - tol && z <= DIVISIONS.pedal.z1 + tol && v >= -10000 && v <= -400) return 'org.pedal';
  if (inside('swell')) return 'org.swell';
  if (inside('great')) return 'org.great';
  if (inside('positive')) return 'org.positive';
  if (z <= CASE.zHalf + tol && v >= -10300 && v <= tol) return 'org.case';
  return null;
}

export const ORGAN_FRONT: FrontArt = {
  box: () => FACADE_BOX,
  Art: ({ highlight }) => <OrganFacade hi={highlight} />,
  labels: () => facadeLabels(),
  hitTest: (_v, u, w, tol) => facadeHit(u, w, tol),
};

/* ═══════════════ HOW IT SOUNDS 1 · open and stopped pipes ═══════════════ */

const PIPE_BOX = { u0: 0, u1: 1000, v0: 0, v1: 700 };

/** One pipe with its pressure swing inside: mouth at the bottom (v1), length L (px of the box). */
function PipeWave({ u, w, v1, L, k, stopped }: { u: number; w: number; v1: number; L: number; k: number; stopped: boolean }): ReactElement {
  const body = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(u - w / 2, v1 - L, w, L), 6, 6));
  const band = make();
  const N = 60;
  const half = w * 0.38;
  for (let i = 0; i <= N; i++) {
    const xi = i / N;
    const a = pipePressure(xi, k, stopped) * half;
    const v = v1 - xi * L;
    if (i === 0) band.moveTo(u - a, v);
    else band.lineTo(u - a, v);
  }
  for (let i = N; i >= 0; i--) {
    const xi = i / N;
    band.lineTo(u + pipePressure(xi, k, stopped) * half, v1 - xi * L);
  }
  band.close();
  const mouth = make();
  mouth.moveTo(u - w * 0.3, v1 - 18);
  mouth.quadTo(u, v1 - 40, u + w * 0.3, v1 - 18);
  mouth.close();
  const foot = make();
  foot.moveTo(u - w / 2, v1);
  foot.lineTo(u + w / 2, v1);
  foot.lineTo(u + w * 0.14, v1 + 70);
  foot.lineTo(u - w * 0.14, v1 + 70);
  foot.close();
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={['#f4f6f9', '#cfd5de', '#9aa3b1', '#6b7380']} />
      </Path>
      <Path path={foot}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={['#cfd5de', '#9aa3b1', '#6b7380']} />
      </Path>
      <Path path={band} color={BLUE} opacity={0.55} />
      <Path path={mouth} color="#14161a" />
      {stopped ? <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(u - w / 2 - 8, v1 - L - 22, w + 16, 26), 6, 6)); return p; })()} color="#4a2c16" /> : null}
      <Path path={body} style="stroke" strokeWidth={2} color="#4a515c" />
    </Group>
  );
}

export type PipeCompare = 'samePitch' | 'sameLength';

export function PipesFigure({ w, h, compare, k, accessibilityLabel }: { w: number; h: number; compare: PipeCompare; k: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', PIPE_BOX, w, h, 6), [w, h]);
  const L = 520;
  const Ls = compare === 'samePitch' ? L / 2 : L;
  const labels: StaticLabel[] = [
    { id: 'o', text: 'OPEN PIPE', u: 330, v: 670, align: 'center', tone: 'muted' },
    { id: 's', text: compare === 'samePitch' ? 'STOPPED · HALF THE LENGTH' : 'STOPPED · SAME LENGTH', short: 'STOPPED', u: 680, v: 670, align: 'center', tone: 'muted' },
    { id: 'p', text: 'BLUE = PRESSURE SWING · NARROW = STILL', short: 'BLUE = PRESSURE', u: 500, v: 30, align: 'center', tone: 'blue' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <PipeWave u={330} w={120} v1={600} L={L} k={k} stopped={false} />
          <PipeWave u={680} w={120} v1={600} L={Ls} k={k} stopped />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const PIPES_ASPECT = (PIPE_BOX.u1 - PIPE_BOX.u0) / (PIPE_BOX.v1 - PIPE_BOX.v0);

/* ═══════════════ HOW IT SOUNDS 2 · a distributed source ═══════════════ */

export type Listen = { id: string; label: string; short: string; p: { x: number; y: number; z: number } };
const ARR_BOX = { u0: -3000, u1: 24000, v0: -8200, v1: 12400 };
const PATH_IDS: { id: DivisionId; side: 1 | -1 }[] = [
  { id: 'great', side: 1 },
  { id: 'swell', side: 1 },
  { id: 'pedal', side: -1 },
  { id: 'pedal', side: 1 },
  { id: 'positive', side: 1 },
];

export function arrivals(p: { x: number; y: number; z: number }) {
  return PATH_IDS.map((d) => {
    const q = divisionPoint(d.id, d.side);
    return { id: d.id, side: d.side, ms: arrivalMs(Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z)) };
  });
}

export function ArrivalsFigure({ w, h, at, accessibilityLabel }: { w: number; h: number; at: Listen; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', ARR_BOX, w, h, 6), [w, h]);
  const paths = make();
  for (const d of PATH_IDS) {
    const q = divisionPoint(d.id, d.side);
    paths.moveTo(q.x, q.z);
    paths.lineTo(at.p.x, at.p.z);
  }
  const a = arrivals(at.p);
  const first = Math.min(...a.map((q) => q.ms));
  const labels: StaticLabel[] = [
    { id: 'at', text: at.short, u: at.p.x, v: at.p.z + 1100, align: 'center', tone: 'amber' },
    { id: 'head', text: 'ARRIVES AFTER THE FIRST, IN MS', short: 'LATER BY (MS)', u: -2800, v: 9200, align: 'left', tone: 'muted' },
    ...a.filter((q) => q.id !== 'pedal' || q.side === 1).map((q, i) => ({ id: `${q.id}${i}`, text: `${DIVISIONS[q.id].short} +${(q.ms - first).toFixed(1)}`, short: `+${(q.ms - first).toFixed(1)}`, u: -2800 + i * 6800, v: 11200, align: 'left' as const, tone: 'blue' as const })),
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <OrganTop variant="recording" />
          <Path path={paths} style="stroke" strokeWidth={70} color={BLUE} opacity={0.75}>
            <DashPathEffect intervals={[400, 260]} />
          </Path>
          <Circle cx={at.p.x} cy={at.p.z} r={320} color={AMBER} />
          <Circle cx={at.p.x} cy={at.p.z} r={320} style="stroke" strokeWidth={60} color="#1b1c20" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const ARRIVALS_ASPECT = (ARR_BOX.u1 - ARR_BOX.u0) / (ARR_BOX.v1 - ARR_BOX.v0);

/* ═══════════════ HOW IT SOUNDS 3 · the room and the pedal notes ═══════════════ */

const NAVE_BOX = { u0: -3000, u1: NAVE.x1 + 600, v0: -15000, v1: 2600 };

export function NaveFigure({ w, h, n, pairX, accessibilityLabel }: { w: number; h: number; n: number; pairX: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', NAVE_BOX, w, h, 6), [w, h]);
  const L = NAVE.x1;
  // The pressure swing along the nave drawn as a band over the floor.
  const band = make();
  const N = 240;
  const A = 2200;
  band.moveTo(0, 0);
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * L;
    band.lineTo(x, -navePressure(x / 1000, n, L / 1000) * A - 600);
  }
  band.lineTo(L, 0);
  band.close();
  const stills = make();
  for (let m = 0; m < n; m++) {
    const x = ((m + 0.5) * L) / n;
    stills.moveTo(x, 0);
    stills.lineTo(x, -3300);
  }
  const room = make();
  room.moveTo(-3000, 0);
  room.lineTo(L, 0);
  room.lineTo(L, NAVE.top);
  room.lineTo(-3000, NAVE.top);
  const here = navePressure(pairX / 1000, n, L / 1000);
  const labels: StaticLabel[] = [
    { id: 'pair', text: `THE PAIR · ${Math.round(here * 100)} %`, short: `${Math.round(here * 100)} %`, u: pairX, v: -4600, align: 'center', tone: 'amber' },
    { id: 'band', text: 'PRESSURE SWING OF ONE LENGTHWISE RESONANCE', short: 'PRESSURE SWING', u: L / 2, v: 1500, align: 'center', tone: 'blue' },
    { id: 'case', text: 'ORGAN', u: -1300, v: -11000, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <OrganSide variant="recording" />
          <Path path={room} style="stroke" strokeWidth={120} color="#4a4d56" />
          <Path path={band} color={BLUE} opacity={0.4} />
          <Path path={stills} style="stroke" strokeWidth={60} color="#ffffff" opacity={0.6}>
            <DashPathEffect intervals={[200, 160]} />
          </Path>
          <Path path={(() => { const p = make(); p.moveTo(pairX, -2440); p.lineTo(pairX, 0); return p; })()} style="stroke" strokeWidth={70} color="#8a8f9c" />
          <Circle cx={pairX} cy={-2440} r={300} color={AMBER} />
          <Path path={(() => { const p = make(); p.addRect(Skia.XYWHRect(-3000, -15000, 600, 1)); return p; })()} color={HIGHLIGHT} opacity={0} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const NAVE_ASPECT = (NAVE_BOX.u1 - NAVE_BOX.u0) / (NAVE_BOX.v1 - NAVE_BOX.v0);
