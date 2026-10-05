/**
 * CombPanel — the IDEAL two-mic sum |H(f)|, 20 Hz–20 kHz on a log axis
 * (blueprint §6.2). Rebuilt on the UI thread from the live poses during a
 * drag (no React work); the same geometry as the drawing feeds it.
 *
 * HONESTY (R7, lesson L97 "Do not present a simulated frequency curve as
 * empirical data"): a permanent IDEAL MODEL badge; one point source,
 * straight-line paths, free field; the drum is not modelled; an
 * inside/outside pair hears different surfaces, so this predicts only the
 * shared part of the sound. Abstract data → clean geometric drawing
 * (visual standards rule 2).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../../theme/tokens';
import type { MicPattern, Vec3 } from '../model/types.ts';
import { isModelled } from '../physics/polar.ts';
import { C20, COMB_FLOOR_DB, EQUAL_PATH_MM, combDb, deltaTms, effectivePolarity, micGain, notchesHz, pathDiffMm } from '../physics/twoMic.ts';
import { dist } from '../geometry/vec.ts';
import type { Rig } from './useRig.ts';

const F0 = 20;
const F1 = 20000;
const DB_TOP = 6;
const N = 256;
const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';

export function CombPanel({ rig, source, w, h, label }: { rig: Rig; source: Vec3; w: number; h: number; label: string }) {
  const a = rig.pose.A;
  const b = rig.pose.B;
  const mA = rig.mics.find((m) => m.slot === 'A');
  const mB = rig.mics.find((m) => m.slot === 'B');
  const patA: MicPattern = mA?.pattern ?? 'omni';
  const patB: MicPattern = mB?.pattern ?? 'omni';
  const pol: 1 | -1 = mB?.polarity ?? 1;
  const padL = 30;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const gw = Math.max(40, w - padL - padR);
  const gh = Math.max(40, h - padT - padB);
  const xOf = (f: number) => padL + (Math.log10(f / F0) / Math.log10(F1 / F0)) * gw;
  const yOf = (db: number) => padT + ((DB_TOP - db) / (DB_TOP - COMB_FLOOR_DB)) * gh;

  // SIGNED gains (review M8): a source in a mic's ideal rear lobe arrives
  // inverted, so the effective polarity — not the switch alone — picks the
  // notch set. Magnitudes go to combDb with that effective sign.
  const gains = useDerivedValue(() => {
    const pa = a.value;
    const pb = b.value;
    const gA = isModelled(patA) ? micGain(patA, pa, source) : 1000 / Math.max(1, dist(pa.p, source));
    const gB = isModelled(patB) ? micGain(patB, pb, source) : 1000 / Math.max(1, dist(pb.p, source));
    return { gA: Math.abs(gA), gB: Math.abs(gB), s: effectivePolarity(pol, gA, gB) };
  });
  const curve = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const pa = a.value;
    const pb = b.value;
    const g = gains.value;
    const dt = deltaTms(pathDiffMm(source, pa.p, pb.p));
    for (let i = 0; i < N; i++) {
      const f = F0 * Math.pow(F1 / F0, i / (N - 1));
      const db = combDb(f, dt, g.gA, g.gB, g.s);
      const x = padL + (i / (N - 1)) * gw;
      const y = padT + ((DB_TOP - db) / (DB_TOP - COMB_FLOOR_DB)) * gh;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  });
  const fill = useDerivedValue(() => {
    const p = curve.value.copy();
    p.lineTo(padL + gw, padT + gh);
    p.lineTo(padL, padT + gh);
    p.close();
    return p;
  });
  const ticks = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const dt = deltaTms(pathDiffMm(source, a.value.p, b.value.p));
    if (Math.abs(dt) * C20 < EQUAL_PATH_MM) return p;
    const ns = notchesHz(dt, gains.value.s, F1, 64);
    for (let i = 0; i < ns.length; i++) {
      if (ns[i] < F0) continue;
      const x = padL + (Math.log10(ns[i] / F0) / Math.log10(F1 / F0)) * gw;
      p.moveTo(x, padT + gh - 7);
      p.lineTo(x, padT + gh);
    }
    return p;
  });

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      p.moveTo(xOf(f), padT);
      p.lineTo(xOf(f), padT + gh);
    }
    for (const db of [0, -10, -20, -30]) {
      p.moveTo(padL, yOf(db));
      p.lineTo(padL + gw, yOf(db));
    }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  const fLabels: [number, string][] = [
    [100, '100'],
    [1000, '1k'],
    [10000, '10k'],
  ];
  return (
    <View style={[styles.wrap, { width: w }]}>
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
          <Path path={grid} style="stroke" strokeWidth={1} color="#2e2f38" />
          <Line p1={vec(padL, yOf(0))} p2={vec(padL + gw, yOf(0))} color="#4a4c58" strokeWidth={1}>
            <DashPathEffect intervals={[4, 4]} />
          </Line>
          <Group>
            <Path path={fill}>
              <LinearGradient start={vec(0, padT)} end={vec(0, padT + gh)} colors={['rgba(111,168,255,0.32)', 'rgba(111,168,255,0.02)']} />
            </Path>
            <Path path={curve} style="stroke" strokeWidth={2} color={BLUE} />
          </Group>
          <Path path={ticks} style="stroke" strokeWidth={2} color={AMBER} />
        </Canvas>
        {fLabels.map(([f, t]) => (
          <Text key={t} style={[styles.axis, { left: xOf(f) - 14, top: padT + gh + 3 }]}>
            {t}
          </Text>
        ))}
        <Text style={[styles.axis, styles.dbAxis, { top: yOf(0) - 7 }]}>0 dB</Text>
        <Text style={[styles.axis, styles.inStep, { top: yOf(0) - 15, left: padL + 4 }]}>0 dB = the two arrivals in step</Text>
        <Text style={[styles.axis, styles.dbAxis, { top: yOf(-30) - 7 }]}>−30</Text>
      </View>
      <Text style={styles.badge}>A simplified picture · not a measurement of this drum · Hz, log scale</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, backgroundColor: '#0c0c0f', paddingBottom: 4 },
  axis: { position: 'absolute', width: 28, textAlign: 'center', color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9 },
  dbAxis: { left: 0, width: 28, textAlign: 'right' },
  inStep: { width: 220, textAlign: 'left' },
  badge: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.8, textAlign: 'center', paddingTop: 2 },
});
