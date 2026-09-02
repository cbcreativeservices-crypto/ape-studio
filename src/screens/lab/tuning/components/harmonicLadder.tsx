/**
 * HarmonicLadder + comparison (spec Stage 1 §8, ch.4): two stacked ladders
 * of harmonics 1–8 (or as many as the compared pair needs) on a
 * log-frequency axis, non-participating harmonics muted, the two compared
 * partials emphasized, joined when they coincide and bracketed when they
 * don't. Everything derives from the two fundamentals — no separate table
 * of harmonic frequencies exists.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { harmonicFrequency, partialDifferenceHz, ratioToCents } from '../../../../features/tuning/tuningMath';
import { ROLE } from './primitives';

const W = 340;
const H = 150;

export function HarmonicComparison({
  rootHz, upperHz, rootHarmonic, upperHarmonic, rootLabel = 'root', upperLabel = 'major third',
}: {
  rootHz: number;
  upperHz: number;
  /** The compared harmonic numbers (e.g. 5 of the root, 4 of the third). */
  rootHarmonic: number;
  upperHarmonic: number;
  rootLabel?: string;
  upperLabel?: string;
}) {
  // Draw at least 8 harmonics, and always enough to include the compared pair.
  const maxH = Math.max(8, rootHarmonic, upperHarmonic);
  const fLo = rootHz * 0.9;
  const fHi = rootHz * (maxH + 1);
  const x = (f: number) => 16 + ((Math.log(f) - Math.log(fLo)) / (Math.log(fHi) - Math.log(fLo))) * (W - 32);
  const pa = harmonicFrequency(rootHz, rootHarmonic);
  const pb = harmonicFrequency(upperHz, upperHarmonic);
  const diffHz = partialDifferenceHz(pb, pa);
  const diffCents = ratioToCents(pb / pa);
  const aligned = Math.abs(diffCents) < 0.05;
  // Descriptive distance colour: gold within 8 ¢, orange beyond. Red is
  // reserved for a failure to close (comma / wolf), never for "not 5/4".
  const gapRole = Math.abs(diffCents) < 8 ? ROLE.near : ROLE.far;
  const rowY = [46, 108];
  const summary = `Harmonic ladders. Root ${rootLabel} harmonic ${rootHarmonic} at ${pa.toFixed(2)} hertz; ${upperLabel} harmonic ${upperHarmonic} at ${pb.toFixed(2)} hertz; ${aligned ? 'same frequency, exact alignment' : `difference ${diffHz.toFixed(2)} hertz, ${diffCents.toFixed(2)} cents`}.`;
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={summary}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {[0, 1].map((row) => {
          const f0 = row === 0 ? rootHz : upperHz;
          const hi = row === 0 ? rootHarmonic : upperHarmonic;
          return (
            <Svg key={row}>
              <SvgText x={8} y={rowY[row] - 26} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>
                {row === 0 ? rootLabel.toUpperCase() : upperLabel.toUpperCase()} · f = {f0.toFixed(2)} Hz
              </SvgText>
              <Line x1={16} y1={rowY[row]} x2={W - 16} y2={rowY[row]} stroke="rgba(255,255,255,0.12)" />
              {Array.from({ length: maxH }, (_, k) => {
                const n = k + 1;
                const f = f0 * n;
                if (f > fHi) return null;
                const on = n === hi;
                return (
                  <Svg key={n}>
                    <Line x1={x(f)} y1={rowY[row] - (on ? 18 : 10)} x2={x(f)} y2={rowY[row]} stroke={on ? (aligned ? ROLE.exact : row === 0 ? ROLE.active : ROLE.operation) : colors.textMutedDeep} strokeWidth={on ? 3 : 1.2} opacity={on ? 1 : 0.5} />
                    <SvgText x={x(f)} y={rowY[row] + 12} fontSize={9} fill={on ? colors.textPrimary : colors.textMutedDeep} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{n}</SvgText>
                  </Svg>
                );
              })}
            </Svg>
          );
        })}
        {/* the comparison: joined when aligned, bracketed when apart */}
        {aligned ? (
          <Line x1={x(pa)} y1={rowY[0]} x2={x(pb)} y2={rowY[1] - 18} stroke={ROLE.exact} strokeWidth={2} />
        ) : (
          <>
            <Line x1={x(pa)} y1={rowY[0] + 16} x2={x(pa)} y2={rowY[1] - 22} stroke={ROLE.active} strokeDasharray="2,2" />
            <Line x1={x(pb)} y1={rowY[0] + 16} x2={x(pb)} y2={rowY[1] - 22} stroke={ROLE.operation} strokeDasharray="2,2" />
            <Line x1={x(pa)} y1={78} x2={x(pb)} y2={78} stroke={gapRole} strokeWidth={2} />
          </>
        )}
        <SvgText x={W - 8} y={12} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium}>LOG-FREQUENCY AXIS</SvgText>
      </Svg>
      <View style={styles.readout}>
        <Text style={styles.line}>
          {rootLabel} harmonic {rootHarmonic}: <Text style={{ color: ROLE.active }}>{pa.toFixed(2)} Hz</Text>
        </Text>
        <Text style={styles.line}>
          {upperLabel} harmonic {upperHarmonic}: <Text style={{ color: aligned ? ROLE.exact : ROLE.operation }}>{pb.toFixed(2)} Hz</Text>
        </Text>
        <Text style={[styles.line, { color: aligned ? ROLE.exact : gapRole, fontFamily: fonts.oswaldMedium }]}>
          {aligned ? '● SAME FREQUENCY — 0 Hz · 0 ¢' : `Difference between compared partials: ${diffHz > 0 ? '+' : ''}${diffHz.toFixed(2)} Hz · ${diffCents > 0 ? '+' : ''}${diffCents.toFixed(2)} ¢`}
        </Text>
      </View>
    </View>
  );
}

/** Two sine traces drifting in phase plus their sum's envelope — an explanatory model. */
export function BeatingModel({ diffHz }: { diffHz: number }) {
  const W2 = 340, H2 = 90;
  const n = 170;
  const d = Math.abs(diffHz);
  // Draw over a window long enough to show ~1.5 beats when the difference is small.
  const windowS = d > 0.01 ? Math.min(1.5, 1.5 / d) : 1;
  const pts1: string[] = [], pts2: string[] = [], env: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * windowS;
    const xx = 6 + (i / n) * (W2 - 12);
    const p1 = Math.sin(2 * Math.PI * 12 * t / windowS);
    const p2 = Math.sin(2 * Math.PI * (12 * t / windowS + d * t));
    pts1.push(`${xx.toFixed(1)},${(H2 / 2 - p1 * 14).toFixed(1)}`);
    pts2.push(`${xx.toFixed(1)},${(H2 / 2 - p2 * 14).toFixed(1)}`);
    const e = Math.abs(Math.cos(Math.PI * d * t));
    env.push(`${xx.toFixed(1)},${(H2 / 2 - e * 34).toFixed(1)}`);
  }
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={`Beating model, explanatory and not a measurement: ${d < 0.01 ? 'no beating, the partials coincide' : `envelope rises and falls ${d.toFixed(2)} times per second`}`}>
      <Svg width="100%" height={H2} viewBox={`0 0 ${W2} ${H2}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W2} height={H2} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={6} y1={H2 / 2} x2={W2 - 6} y2={H2 / 2} stroke="rgba(255,255,255,0.1)" />
        <Polyline points={pts1.join(' ')} fill="none" stroke={ROLE.active} strokeWidth={1} opacity={0.8} />
        <Polyline points={pts2.join(' ')} fill="none" stroke={ROLE.operation} strokeWidth={1} opacity={0.8} />
        <Polyline points={env.join(' ')} fill="none" stroke={d < 0.01 ? ROLE.exact : ROLE.near} strokeWidth={2} />
        <SvgText x={W2 - 8} y={12} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium}>EXPLANATORY MODEL · NOT A MEASUREMENT</SvgText>
      </Svg>
      <Text style={styles.note}>
        Explanatory model, not a measurement: two partials {d < 0.01 ? 'at the same frequency stay in step — a steady envelope.' : `${d.toFixed(2)} Hz apart drift in and out of step, so their sum swells and fades about ${d.toFixed(2)} times per second.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { gap: 2 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
