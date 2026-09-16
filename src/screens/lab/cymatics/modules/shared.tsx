/**
 * Cymatics modules — shared bits: prose styles, a live plate demo card
 * (Skia-gated), and a tiny response-curve strip drawn with plain Views so it
 * needs no Skia.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { levelColor } from '../../../../features/tools/levelColor';
import { effectiveQ, modeResponse, plateModes, readResonance, sampleField, type PlateMode, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { requireVizPlate, skiaAvailable } from '../skiaGate';
import type { PlateViewMode } from '../vizPlate';

export const P = StyleSheet.create({
  h: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber, marginTop: 6 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  strong: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textPrimary },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bullet: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, lineHeight: 21 },
  numTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber, width: 26, lineHeight: 22 },
});

/** A live plate parked on one of its modes (or at an arbitrary Hz). */
export function PlateDemo({
  width,
  spec,
  hz,
  view,
  running,
  slowMo = false,
  particles = 1800,
  height,
}: {
  width: number;
  spec: PlateSpec;
  hz: number;
  view: PlateViewMode;
  running: boolean;
  slowMo?: boolean;
  particles?: number;
  height?: number;
}) {
  const viz = skiaAvailable ? requireVizPlate() : null;
  const N = 48;
  const { grid, strength } = useMemo(() => {
    const modes = plateModes(spec, 14);
    const Q = effectiveQ(spec.material, spec.damping);
    return { grid: sampleField(spec, modes, hz, Q, N), strength: readResonance(hz, modes, Q).strength };
  }, [spec, hz]);
  const h = height ?? Math.round(width * 0.66);
  if (!viz) {
    return (
      <View style={[styles.fallback, { width, height: h }]}>
        <Text style={P.caption}>Live plate needs the current app build (Skia).</Text>
      </View>
    );
  }
  return (
    <viz.PlateView
      width={width}
      height={h}
      spec={spec}
      grid={grid}
      N={N}
      strength={strength}
      amplitude={0.8}
      view={view}
      running={running}
      slowMo={slowMo}
      particleCount={particles}
      particleSize={0.4}
      friction={0.4}
      resetToken={0}
      sectionY={0.5}
      dragTarget={null}
    />
  );
}

/** Excitable modes of a spec (drive > 5 %). */
export function excitableModes(spec: PlateSpec, count = 14): PlateMode[] {
  return plateModes(spec, count).filter((m) => m.drive > 0.05);
}

/** A response-vs-frequency strip: bars coloured by the house level ramp, the
 *  drive frequency marked. Plain Views — no Skia needed. */
export function ResponseStrip({ width, modes, Q, hz, fMin, fMax }: { width: number; modes: PlateMode[]; Q: number; hz: number; fMin: number; fMax: number }) {
  const bars = 40;
  const vals = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      const f = fMin * Math.pow(fMax / fMin, (i + 0.5) / bars);
      let best = 0;
      for (const m of modes) best = Math.max(best, (modeResponse(f, m.hz, Q) * m.drive) / (Q * Math.max(m.drive, 1e-6)));
      out.push(Math.min(1, best));
    }
    return out;
  }, [modes, Q, fMin, fMax]);
  const mark = Math.max(0, Math.min(1, Math.log(hz / fMin) / Math.log(fMax / fMin)));
  const bw = (width - 4) / bars;
  return (
    <View style={{ width, height: 54 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 1, paddingHorizontal: 2 }}>
        {vals.map((v, i) => (
          <View key={i} style={{ width: bw - 1, height: 4 + v * 40, backgroundColor: levelColor(Math.max(0.05, v)), borderRadius: 1 }} />
        ))}
      </View>
      <View style={{ position: 'absolute', left: 2 + mark * (width - 4) - 1, top: 0, width: 2, height: 46, backgroundColor: '#ffffff' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={P.badge}>{Math.round(fMin)} Hz</Text>
        <Text style={P.badge}>RESPONSE vs FREQUENCY</Text>
        <Text style={P.badge}>{Math.round(fMax)} Hz</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#0b0b10' },
});
