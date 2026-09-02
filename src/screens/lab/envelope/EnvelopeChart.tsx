/**
 * EnvelopeChart — the one drawing every page of the Sound Envelope lab uses:
 * envelope curve over time with the A / D / S / R regions labeled, an
 * optional waveform shaped by it, rise-time marker, peak and average lines.
 * Everything is computed from envelopeModel — nothing is hand-drawn.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { adsrCurve, adsrTotalMs, riseTimeMs, shapedWave, peakAbs, rms, type Adsr } from '../../../features/envelope/envelopeModel';
import { levelColorForDb, MIDLINE_BLUE } from '../../../features/tools/levelColor';

const W = 340;

export function EnvelopeChart({
  adsr, height = 150, showWave = true, showRegions = true, showRise = false, showPeakAvg = false, title,
}: {
  adsr: Adsr;
  height?: number;
  showWave?: boolean;
  showRegions?: boolean;
  showRise?: boolean;
  showPeakAvg?: boolean;
  title?: string;
}) {
  const H = height;
  const top = 18, bottom = H - 22;
  const total = Math.max(1, adsrTotalMs(adsr));
  const x = (ms: number) => 10 + (ms / total) * (W - 20);
  const y = (v: number) => bottom - v * (bottom - top);
  const { t, v } = adsrCurve(adsr, 200);
  const env = Array.from(t, (ms, i) => `${x(ms).toFixed(1)},${y(v[i]).toFixed(1)}`).join(' ');
  const wave = showWave ? shapedWave(adsr, 600, Math.max(12, Math.min(80, Math.round(total / 25)))) : null;
  const mid = (top + bottom) / 2;
  const wavePts = wave ? Array.from(wave, (s, i) => `${(10 + (i / (wave.length - 1)) * (W - 20)).toFixed(1)},${(mid - s * (bottom - top) / 2).toFixed(1)}`).join(' ') : '';
  const aEnd = adsr.attackMs, dEnd = aEnd + adsr.decayMs, sEnd = dEnd + adsr.holdMs;
  const rise = riseTimeMs(adsr);
  const pk = wave ? peakAbs(wave) : 1;
  const av = wave ? rms(wave) : 0.7;
  const a11y = `Envelope: attack ${adsr.attackMs} ms, decay ${adsr.decayMs} ms, sustain ${Math.round(adsr.sustain * 100)} percent, release ${adsr.releaseMs} ms, total ${Math.round(total)} ms.${showRise ? ` Rise time ${rise.toFixed(1)} ms.` : ''}${showPeakAvg ? ` Peak ${pk.toFixed(2)}, average ${av.toFixed(2)}.` : ''}`;
  const regions = [
    { from: 0, to: aEnd, label: 'A', color: colors.gold },
    { from: aEnd, to: dEnd, label: 'D', color: colors.orange },
    { from: dEnd, to: sEnd, label: 'S', color: colors.green },
    { from: sEnd, to: total, label: 'R', color: colors.blue },
  ];
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {showRegions
          ? regions.map((r) => r.to > r.from ? (
              <G key={r.label}>
                <Rect x={x(r.from)} y={top - 4} width={Math.max(0.5, x(r.to) - x(r.from))} height={bottom - top + 8} fill={r.color} opacity={0.07} />
                <Line x1={x(r.to)} y1={top - 6} x2={x(r.to)} y2={bottom + 2} stroke={r.color} strokeWidth={0.8} strokeDasharray="3,3" opacity={0.7} />
                <SvgText x={(x(r.from) + x(r.to)) / 2} y={H - 8} fontSize={9.5} fill={r.color} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{r.label}</SvgText>
              </G>
            ) : null)
          : null}
        {showWave ? (
          <>
            <Line x1={10} y1={mid} x2={W - 10} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={1} opacity={0.6} />
            <Polyline points={wavePts} fill="none" stroke={levelColorForDb(-8, -40, 0)} strokeWidth={0.9} opacity={0.8} />
          </>
        ) : null}
        <Polyline points={env} fill="none" stroke={colors.cyanBright} strokeWidth={2.2} />
        {showRise ? (
          <>
            <Line x1={10} y1={y(0.1)} x2={x(aEnd)} y2={y(0.1)} stroke={colors.gold} strokeDasharray="2,2" />
            <Line x1={10} y1={y(0.9)} x2={x(aEnd)} y2={y(0.9)} stroke={colors.gold} strokeDasharray="2,2" />
            <SvgText x={x(aEnd) + 4} y={y(0.9) + 3} fontSize={8.5} fill={colors.gold} fontFamily={fonts.barlowMedium}>90%</SvgText>
            <SvgText x={x(aEnd) + 4} y={y(0.1) + 3} fontSize={8.5} fill={colors.gold} fontFamily={fonts.barlowMedium}>10%</SvgText>
            <SvgText x={x(aEnd) + 4} y={y(0.5) + 3} fontSize={9} fill={colors.gold} fontFamily={fonts.oswaldMedium}>rise {rise.toFixed(1)} ms</SvgText>
          </>
        ) : null}
        {showPeakAvg && wave ? (
          <>
            <Line x1={10} y1={mid - pk * (bottom - top) / 2} x2={W - 10} y2={mid - pk * (bottom - top) / 2} stroke={colors.red} strokeWidth={1.2} />
            <SvgText x={W - 12} y={mid - pk * (bottom - top) / 2 - 3} fontSize={8.5} fill={colors.red} textAnchor="end" fontFamily={fonts.barlowMedium}>peak</SvgText>
            <Line x1={10} y1={mid - av * (bottom - top) / 2} x2={W - 10} y2={mid - av * (bottom - top) / 2} stroke={colors.green} strokeWidth={1.2} strokeDasharray="4,2" />
            <SvgText x={W - 12} y={mid - av * (bottom - top) / 2 - 3} fontSize={8.5} fill={colors.green} textAnchor="end" fontFamily={fonts.barlowMedium}>average (RMS)</SvgText>
          </>
        ) : null}
        <SvgText x={W - 8} y={12} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.barlowMedium}>{Math.round(total)} ms →</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 },
});
