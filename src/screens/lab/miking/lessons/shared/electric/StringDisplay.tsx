/**
 * StringDisplay — HOW AN ELECTRIC STRING INSTRUMENT MAKES ITS SIGNAL, drawn
 * from stringModel.ts (an IDEAL string; LESSON_JOURNEY §7). FULLY SILENT.
 *
 *   top     one string between its two fixed ends (the nut — or a steel's
 *           bar — and the bridge), at rest (dashed) and displaced in ONE
 *           vibration shape (harmonic n), drawn many times larger than it
 *           moves. The still points (nodes) are marked. The pickups sit
 *           under the string at their places; the chosen one is lit.
 *   bottom  how strongly the chosen pickup senses each of the first eight
 *           harmonics, |sin(nπq/L)| — the pickup's PLACE alone, nothing else.
 *
 * Nothing moves by itself (D8): the learner SWINGS the shape by hand.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { modeShape, nodesOf, pickupWeight } from './stringModel.ts';
import type { PickupSpot } from './electricSpec.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const STRING = '#d6d9df';
const GREY = '#5d6068';
export const HARMONICS = 8;

export type StringDisplayProps = {
  w: number;
  h: number;
  /** The full scale (nut to bridge), mm. */
  L: number;
  /** A steel's bar, mm from the nut (null = an open string from the nut). */
  bar: number | null;
  n: number;
  /** 0…1 of one cycle: the shape is drawn at cos(2π·swing). */
  swing: number;
  pickups: readonly PickupSpot[];
  lit: string;
  accessibilityLabel: string;
};

export function StringDisplay({ w, h, L, bar, n, swing, pickups, lit, accessibilityLabel }: StringDisplayProps) {
  const ts = useStageTextScale();
  const padL = 34;
  const padR = 26;
  const top = Math.round(h * 0.06) + 16 * ts;
  const stringH = Math.max(90, h * 0.5);
  const yS = top + stringH * 0.42;
  const amp = Math.min(stringH * 0.34, 46);
  const x0 = padL;
  const x1 = w - padR;
  // u along the string from the nut (0) to the bridge (L) → screen x.
  const X = (u: number) => x0 + (u / L) * (x1 - x0);
  const b = bar ?? 0;
  const Ls = L - b; // the speaking length
  const litQ = pickups.find((p) => p.id === lit)?.fromBridge ?? pickups[0].fromBridge;
  const c = Math.cos(2 * Math.PI * swing);
  const { shape, rest, ticks } = useMemo(() => {
    const sh = Skia.Path.Make();
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const xFromBridge = (Ls * i) / N;
      const u = L - xFromBridge;
      const y = yS - amp * modeShape(n, xFromBridge, Ls) * c;
      if (i === 0) sh.moveTo(X(u), y);
      else sh.lineTo(X(u), y);
    }
    const r = Skia.Path.Make();
    r.moveTo(X(b), yS);
    r.lineTo(X(L), yS);
    const t = Skia.Path.Make();
    for (let k = 0; k < 8; k++) {
      const u = (L * k) / 8;
      t.moveTo(X(u), yS + amp + 18);
      t.lineTo(X(u), yS + amp + 22);
    }
    return { shape: sh, rest: r, ticks: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, L, b, n, c, amp, yS]);
  const nodes = nodesOf(n, Ls).map((xb) => L - xb);
  // The bottom: one bar per harmonic for the lit pickup.
  const chartTop = top + stringH + 22 * ts;
  const chartH = Math.max(40, h - chartTop - 22 * ts);
  const bw = (x1 - x0) / HARMONICS;
  const bars = Array.from({ length: HARMONICS }, (_, i) => pickupWeight(i + 1, litQ, Ls));
  const labels: StaticLabel[] = [
    { id: 'nut', text: bar == null ? 'NUT' : 'BAR', u: X(b), v: yS - amp - 14 * ts, align: 'center', tone: bar == null ? 'muted' : 'amber' },
    { id: 'bridge', text: 'BRIDGE', u: X(L) - 2, v: yS - amp - 14 * ts, align: 'right', tone: 'muted' },
    ...pickups.map((p) => ({ id: `pu.${p.id}`, text: p.short, u: X(L - p.fromBridge), v: yS + amp + 34 * ts, align: 'center' as const, tone: p.id === lit ? ('amber' as const) : ('muted' as const) })),
    { id: 'chart', text: `WHAT THE ${pickups.find((p) => p.id === lit)?.short ?? 'PICKUP'} PICKUP SENSES, BY HARMONIC`, short: 'BY HARMONIC', u: x0, v: chartTop - 12 * ts, align: 'left', tone: 'illustrative' },
    ...bars.map((_, i) => ({ id: `h${i}`, text: `${i + 1}`, u: x0 + bw * (i + 0.5), v: chartTop + chartH + 10 * ts, align: 'center' as const, tone: i + 1 === n ? ('amber' as const) : ('muted' as const) })),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        {/* A dark fingerboard strip under the string, for depth. */}
        <RoundedRect x={x0 - 8} y={yS - amp - 6} width={x1 - x0 + 16} height={2 * amp + 12} r={10}>
          <LinearGradient start={vec(0, yS - amp)} end={vec(0, yS + amp)} colors={['#17181c', '#101114', '#0b0b0d']} />
        </RoundedRect>
        {/* The part behind a steel's bar does not sound (dimmed). */}
        {bar != null && bar > 0 ? <Line p1={vec(X(0), yS)} p2={vec(X(b), yS)} color={GREY} strokeWidth={1.4} opacity={0.6} /> : null}
        <Path path={rest} style="stroke" strokeWidth={1.2} color="#7d828e" opacity={0.8}>
          <DashPathEffect intervals={[6, 5]} />
        </Path>
        {/* Pickups under the string, the lit one in amber, its sensing line. */}
        {pickups.map((p) => {
          const x = X(L - p.fromBridge);
          const on = p.id === lit;
          return (
            <Group key={p.id}>
              <RoundedRect x={x - 9} y={yS + amp + 6} width={18} height={20} r={6}>
                <LinearGradient start={vec(0, yS + amp + 6)} end={vec(0, yS + amp + 26)} colors={on ? ['#5a4a1c', '#2c240d', '#141006'] : ['#2a2b30', '#121316', '#060607']} />
              </RoundedRect>
              <RoundedRect x={x - 9} y={yS + amp + 6} width={18} height={20} r={6} style="stroke" strokeWidth={on ? 2.5 : 1} color={on ? AMBER : GREY} />
              {on ? (
                <Line p1={vec(x, yS - amp - 4)} p2={vec(x, yS + amp + 6)} color={AMBER} strokeWidth={1.4} opacity={0.75}>
                  <DashPathEffect intervals={[4, 4]} />
                </Line>
              ) : null}
            </Group>
          );
        })}
        {/* The vibrating shape (drawn larger), and its still points. */}
        <Path path={shape} style="stroke" strokeWidth={4.5} color="#0b0b0d" />
        <Path path={shape} style="stroke" strokeWidth={2.4} color={STRING} />
        {nodes.map((u, i) => (
          <Circle key={`n${i}`} cx={X(u)} cy={yS} r={4.2} color={BLUE} />
        ))}
        {/* The ends: nut (or the bar) and the bridge saddle. */}
        <RoundedRect x={X(b) - (bar == null ? 3 : 7)} y={yS - (bar == null ? 10 : 12)} width={bar == null ? 6 : 14} height={bar == null ? 20 : 24} r={bar == null ? 2 : 7}>
          <LinearGradient start={vec(X(b) - 7, 0)} end={vec(X(b) + 7, 0)} colors={bar == null ? ['#efe8d6', '#cfc6b0', '#9e957f'] : ['#f2f4f8', '#9aa0ab', '#3a3d45']} />
        </RoundedRect>
        <RoundedRect x={X(L) - 4} y={yS - 10} width={10} height={20} r={2}>
          <LinearGradient start={vec(X(L) - 4, 0)} end={vec(X(L) + 6, 0)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
        </RoundedRect>
        {/* The chart: how much the lit pickup senses of each harmonic. */}
        <Line p1={vec(x0, chartTop + chartH)} p2={vec(x1, chartTop + chartH)} color="#4a4c58" strokeWidth={1} />
        {bars.map((v, i) => {
          const bh = Math.max(1.5, v * chartH);
          const on = i + 1 === n;
          return (
            <RoundedRect key={`b${i}`} x={x0 + bw * i + bw * 0.18} y={chartTop + chartH - bh} width={bw * 0.64} height={bh} r={3}>
              <LinearGradient start={vec(0, chartTop)} end={vec(0, chartTop + chartH)} colors={on ? ['#ffd88a', '#c98d1a'] : ['rgba(111,168,255,0.9)', 'rgba(111,168,255,0.35)']} />
            </RoundedRect>
          );
        })}
        {[0, 1, 2, 3].map((k) => (
          <Line key={`t${k}`} p1={vec(x0, chartTop + chartH - (chartH * (k + 1)) / 4)} p2={vec(x1, chartTop + chartH - (chartH * (k + 1)) / 4)} color="#2e2f38" strokeWidth={1} />
        ))}
        <Path path={ticks} style="stroke" strokeWidth={1} color="#2e2f38" />
      </Canvas>
      <StaticLabels labels={labels} xf={{ view: 'side', s: 1, ox: 0, oy: 0 }} scale={ts} w={w} />
    </View>
  );
}
