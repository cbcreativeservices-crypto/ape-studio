/**
 * PairComb — the SIMPLIFIED sum of two pickups of one source, 20 Hz–20 kHz on
 * a log axis: a delay Δt between them, their levels, and the sign of the
 * sum (polarity). Shared by the Speaker-cabinet module (front + open-back
 * mics) and Lab 4's amplified-chain lessons (front + rear, and a mic + a DI).
 * Moved here from lessons/spk/pages.tsx unchanged (2026-10-05).
 *
 * A simplified picture, said on its badge: one point source per pickup, free
 * field, no room — it shows only the shared part of the two signals, never
 * what a real pair sounds like. Static per render (D8).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { C20, COMB_FLOOR_DB, EQUAL_PATH_MM, combDb, notchesHz } from '../../../engine/physics/twoMic.ts';

/** The pair's sum: the front mic hears the front of the cone; the rear mic
 *  the back of it — the SAME motion, opposite in sign (a simplified picture:
 *  each mic hears only its own side; one point source each; free field). */
export function PairComb({ w, h, dtMs, gA, gB, sEff, label }: { w: number; h: number; dtMs: number; gA: number; gB: number; sEff: 1 | -1; label: string }) {
  const F0 = 20;
  const F1 = 20000;
  const TOP = 6;
  const padL = 30;
  const padT = 8;
  const gw = Math.max(40, w - padL - 8);
  const gh = Math.max(40, h - padT - 20);
  const xOf = (f: number) => padL + (Math.log10(f / F0) / Math.log10(F1 / F0)) * gw;
  const yOf = (d: number) => padT + ((TOP - d) / (TOP - COMB_FLOOR_DB)) * gh;
  const { curve, ticks, grid } = useMemo(() => {
    const c = Skia.Path.Make();
    for (let i = 0; i < 256; i++) {
      const f = F0 * Math.pow(F1 / F0, i / 255);
      const d = combDb(f, dtMs, gA, gB, sEff);
      if (i === 0) c.moveTo(padL + (i / 255) * gw, yOf(d));
      else c.lineTo(padL + (i / 255) * gw, yOf(d));
    }
    const t = Skia.Path.Make();
    if (Math.abs(dtMs) * C20 >= EQUAL_PATH_MM) {
      for (const f of notchesHz(dtMs, sEff, F1, 64)) {
        if (f < F0) continue;
        t.moveTo(xOf(f), padT + gh - 7);
        t.lineTo(xOf(f), padT + gh);
      }
    }
    const g = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      g.moveTo(xOf(f), padT);
      g.lineTo(xOf(f), padT + gh);
    }
    for (const d of [0, -10, -20, -30]) {
      g.moveTo(padL, yOf(d));
      g.lineTo(padL + gw, yOf(d));
    }
    return { curve: c, ticks: t, grid: g };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtMs, gA, gB, sEff, w, h]);
  const fill = useMemo(() => {
    const p = curve.copy();
    p.lineTo(padL + gw, padT + gh);
    p.lineTo(padL, padT + gh);
    p.close();
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve]);
  return (
    <View style={[styles.combWrap, { width: w }]}>
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
            <Path path={curve} style="stroke" strokeWidth={2} color="#6fa8ff" />
          </Group>
          <Path path={ticks} style="stroke" strokeWidth={2} color="#ffc64d" />
        </Canvas>
        {[
          [100, '100'],
          [1000, '1k'],
          [10000, '10k'],
        ].map(([f, t]) => (
          <Text key={t as string} style={[styles.axis, { left: xOf(f as number) - 14, top: padT + gh + 3 }]}>
            {t as string}
          </Text>
        ))}
        <Text style={[styles.axis, styles.dbAxis, { top: yOf(0) - 7 }]}>0 dB</Text>
        <Text style={[styles.axis, styles.dbAxis, { top: yOf(-30) - 7 }]}>−30</Text>
      </View>
      <Text style={styles.combBadge}>A simplified picture · not a measurement of any cabinet · Hz, log scale</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  combWrap: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, backgroundColor: '#0c0c0f', paddingBottom: 4 },
  axis: { position: 'absolute', width: 28, textAlign: 'center', color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9 },
  dbAxis: { left: 0, width: 28, textAlign: 'right' },
  combBadge: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.8, textAlign: 'center', paddingTop: 2 },
});
