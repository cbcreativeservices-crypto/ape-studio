/**
 * EnvelopeChart — the one drawing every page of the Sound Envelope lab uses:
 * envelope curve over time with the A / D / S / R regions labeled, an
 * optional waveform shaped by it, rise-time markers, peak and average lines,
 * and an optional SWEEP — a playhead that rides the shape, slowed for
 * visibility and badged with the slow-down (the owner's "animate a waveform
 * and its envelope instead of playing sounds").
 *
 * Everything is computed from envelopeModel — nothing is hand-drawn, and the
 * caption under the chart says so: ILLUSTRATIVE MODEL, not a measurement.
 *
 * COLOUR: the waveform carries the app-wide amplitude ramp (blue at the mid
 * line → green → yellow → orange as the excursion grows) through a vertical
 * userSpaceOnUse gradient, so its colour tracks its level exactly as the
 * tools' waveforms do. The envelope's own peak is pinned to the ORANGE band
 * of the ramp, never red: red means clipping, and a teaching shape does not
 * clip. Region chrome (A/D/S/R) is deliberately NEUTRAL so no tint can be
 * misread as a level.
 *
 * MOTION: animated SVG primitive props only (x1/x2, cx/cy) through Reanimated
 * — the rule learned on the Harmonograph. Rest pose carried as static props.
 */
import { useCallback, useEffect, useId, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, interpolate, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { adsrCurve, adsrTotalMs, riseTimes, shapedWave, peakAbs, rms, type Adsr } from '../../../features/envelope/envelopeModel';
import { LOUDNESS_STOPS, MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../features/tools/levelColor';

const W = 340;
const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);

/** Where the envelope's peak sits on the amplitude ramp: hot (orange), never
 *  red — red is reserved for clipping and a teaching shape never clips. */
const PEAK_ON_RAMP = 0.82;

/** Peak / average reference lines — deliberately OUTSIDE the amplitude ramp's
 *  hues so a reference line is never read as a level colour. */
const PEAK_LINE = colors.textPrimary;
const AVG_LINE = colors.purple;

export const CHART_HONESTY = 'ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT';

/** A label with a dark backing so it stays legible over the curves. */
function Tag({ x, y, text, anchor = 'start', color, size = 8.5, family = fonts.barlowMedium }: {
  x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; color: string; size?: number; family?: string;
}) {
  const w = text.length * size * 0.56 + 6;
  const h = size + 4;
  const rx = anchor === 'start' ? x - 3 : anchor === 'end' ? x - w + 3 : x - w / 2;
  return (
    <G>
      <Rect x={rx} y={y - size - 1} width={w} height={h} rx={2} fill="#0a0a0c" opacity={0.88} />
      <SvgText x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontFamily={family}>{text}</SvgText>
    </G>
  );
}

export function EnvelopeChart({
  adsr, height = 150, showWave = true, showRegions = true, showRise = false, showPeakAvg = false, title, sweep = false, reduceMotion = false, caption,
}: {
  adsr: Adsr;
  height?: number;
  showWave?: boolean;
  showRegions?: boolean;
  showRise?: boolean;
  showPeakAvg?: boolean;
  title?: string;
  /** Offer a "▶ SWEEP" control: a playhead rides the shape, slowed for
   *  visibility (badged). Hidden under reduced motion — the static chart is
   *  already the complete end state. */
  sweep?: boolean;
  reduceMotion?: boolean;
  /** Extra caption after the standing honesty line. */
  caption?: string;
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
  const halfH = (bottom - top) / 2;
  const wavePts = wave ? Array.from(wave, (s, i) => `${(10 + (i / (wave.length - 1)) * (W - 20)).toFixed(1)},${(mid - s * halfH).toFixed(1)}`).join(' ') : '';
  const aEnd = adsr.attackMs, dEnd = aEnd + adsr.decayMs, sEnd = dEnd + adsr.holdMs;
  const { t10, t90 } = riseTimes(adsr);
  const rise = t90 - t10;
  const pk = wave ? peakAbs(wave) : 1;
  const av = wave ? rms(wave) : 0.7;
  const gradId = `env${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  /* ── sweep: a playhead + a dot riding the envelope, slowed for visibility ── */
  const sweepMs = Math.round(Math.max(1600, Math.min(4000, total * 4)));
  const slow = sweepMs / total;
  const slowLabel = slow >= 1.5 ? `×${slow < 10 ? slow.toFixed(1) : slow.toFixed(0)} slower than real time` : 'about real time';
  const prog = useSharedValue(0);
  const [playing, setPlaying] = useState(false);
  const tFrac = Array.from(t, (ms) => ms / total);
  const yVals = Array.from(v, (val) => y(val));
  const headProps = useAnimatedProps(() => {
    const px = 10 + prog.value * (W - 20);
    return { x1: px, x2: px };
  });
  const dotProps = useAnimatedProps(() => ({
    cx: 10 + prog.value * (W - 20),
    cy: interpolate(prog.value, tFrac, yVals),
  }));
  const stopSweep = useCallback(() => {
    cancelAnimation(prog);
    prog.value = 0;
    setPlaying(false);
  }, [prog]);
  const startSweep = () => {
    cancelAnimation(prog);
    prog.value = 0;
    setPlaying(true);
    prog.value = withTiming(1, { duration: sweepMs, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(setPlaying)(false);
    });
  };
  // A shape change mid-sweep resets it: the playhead must never ride a curve
  // that no longer exists.
  const shapeKey = `${adsr.attackMs}|${adsr.decayMs}|${adsr.sustain}|${adsr.releaseMs}|${adsr.holdMs}|${adsr.attackShape ?? ''}|${adsr.decayShape ?? ''}`;
  useEffect(() => { stopSweep(); }, [shapeKey, stopSweep]);

  const a11y = `Envelope: attack ${adsr.attackMs} ms, decay ${adsr.decayMs} ms, sustain ${Math.round(adsr.sustain * 100)} percent, release ${adsr.releaseMs} ms, total ${Math.round(total)} ms.${showRise ? ` Rise time 10 to 90 percent ${rise.toFixed(1)} ms.` : ''}${showPeakAvg ? ` Peak ${pk.toFixed(2)}, average ${av.toFixed(2)} of the drawn full scale.` : ''} Illustrative model, not a measurement.`;
  const regions = [
    { from: 0, to: aEnd, label: 'A' },
    { from: aEnd, to: dEnd, label: 'D' },
    { from: dEnd, to: sEnd, label: 'S' },
    { from: sEnd, to: total, label: 'R' },
  ];
  const drawn = regions.filter((r) => r.to > r.from);

  return (
    <View style={{ gap: 4 }}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Defs>
            {/* Vertical amplitude ramp mapped to ±(peak / PEAK_ON_RAMP) so the
                envelope's peak lands in the orange band, never red. */}
            <LinearGradient id={gradId} x1={0} y1={mid - halfH / PEAK_ON_RAMP} x2={0} y2={mid + halfH / PEAK_ON_RAMP} gradientUnits="userSpaceOnUse">
              {WAVE_LEVEL_STOPS.map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
            </LinearGradient>
            {/* The ENVELOPE is a level contour (0 → 1), so it carries the same
                ramp, unipolar: silence-blue at the floor, its peak in the
                orange band (owner standard 2026-09-05 — it was flat cyan). */}
            <LinearGradient id={`${gradId}env`} x1={0} y1={y(1 / PEAK_ON_RAMP)} x2={0} y2={y(0)} gradientUnits="userSpaceOnUse">
              {LOUDNESS_STOPS.map((s) => <Stop key={s.pos} offset={s.pos} stopColor={s.color} />)}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          {showRegions
            ? drawn.map((r, i) => (
                <G key={r.label}>
                  <Rect x={x(r.from)} y={top - 4} width={Math.max(0.5, x(r.to) - x(r.from))} height={bottom - top + 8} fill="#ffffff" opacity={i % 2 ? 0.05 : 0.025} />
                  {i < drawn.length - 1 ? <Line x1={x(r.to)} y1={top - 6} x2={x(r.to)} y2={bottom + 2} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} strokeDasharray="3,3" /> : null}
                  <SvgText x={(x(r.from) + x(r.to)) / 2} y={H - 7} fontSize={10} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{r.label}</SvgText>
                </G>
              ))
            : null}
          {showWave ? (
            <>
              <Line x1={10} y1={mid} x2={W - 10} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={1} opacity={0.6} />
              <Polyline points={wavePts} fill="none" stroke={`url(#${gradId})`} strokeWidth={0.9} opacity={0.85} />
            </>
          ) : null}
          <Polyline points={env} fill="none" stroke={`url(#${gradId}env)`} strokeWidth={2.2} />
          {showRise ? (
            <>
              <Line x1={10} y1={y(0.1)} x2={W - 10} y2={y(0.1)} stroke={colors.gold} strokeDasharray="2,3" opacity={0.55} />
              <Line x1={10} y1={y(0.9)} x2={W - 10} y2={y(0.9)} stroke={colors.gold} strokeDasharray="2,3" opacity={0.55} />
              <Circle cx={x(t10)} cy={y(0.1)} r={2.6} fill={colors.gold} />
              <Circle cx={x(t90)} cy={y(0.9)} r={2.6} fill={colors.gold} />
              {/* both tags face INTO the 10–90 band, clear of the duration tag above and the A/D/S/R letters below */}
              <Tag x={W - 12} y={y(0.9) + 11} text="90 %" anchor="end" color={colors.gold} />
              <Tag x={W - 12} y={y(0.1) - 3} text="10 %" anchor="end" color={colors.gold} />
              <Tag x={12} y={12} text={`rise 10→90 %: ${rise.toFixed(1)} ms`} color={colors.gold} size={9} family={fonts.oswaldMedium} />
            </>
          ) : null}
          {showPeakAvg && wave ? (
            <>
              <Line x1={10} y1={mid - pk * halfH} x2={W - 10} y2={mid - pk * halfH} stroke={PEAK_LINE} strokeWidth={1.2} />
              <Tag x={12} y={mid - pk * halfH + 11} text="peak" color={PEAK_LINE} />
              <Line x1={10} y1={mid - av * halfH} x2={W - 10} y2={mid - av * halfH} stroke={AVG_LINE} strokeWidth={1.2} strokeDasharray="4,2" />
              {/* opposite corner from "peak": on a sustained shape the two lines sit ~19 px apart, too close for stacked tags */}
              <Tag x={W - 12} y={mid - av * halfH + 11} text="average (RMS)" anchor="end" color={AVG_LINE} />
            </>
          ) : null}
          {playing ? (
            <>
              <ALine animatedProps={headProps} x1={10} x2={10} y1={top - 6} y2={bottom + 2} stroke={colors.textPrimary} strokeWidth={1} opacity={0.7} />
              <ACircle animatedProps={dotProps} cx={10} cy={y(0)} r={3.6} fill={colors.cyanBright} stroke="#0a0a0c" strokeWidth={1} />
            </>
          ) : null}
          <Tag x={W - 8} y={12} text={`${Math.round(total)} ms →`} anchor="end" color={colors.textMuted} />
        </Svg>
      </View>
      {sweep && !reduceMotion ? (
        <View style={styles.sweepRow}>
          <Pressable
            onPress={playing ? stopSweep : startSweep}
            style={styles.sweepBtn}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Stop the sweep' : `Sweep a playhead across the shape, ${slowLabel}`}
          >
            <Text style={styles.sweepText}>{playing ? '■ STOP' : '▶ SWEEP THE SHAPE'}</Text>
          </Pressable>
          <Text style={styles.sweepNote}>{Math.round(total)} ms shown over {(sweepMs / 1000).toFixed(1)} s · {slowLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.caption}>{CHART_HONESTY} · vertical = relative level · horizontal = time{caption ? ` · ${caption}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 },
  caption: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1, lineHeight: 13 },
  sweepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 },
  sweepBtn: { minHeight: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  sweepText: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
  sweepNote: { flex: 1, minWidth: 140, color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
