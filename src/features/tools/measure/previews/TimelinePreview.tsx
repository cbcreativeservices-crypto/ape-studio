/**
 * A SAVED SPL logging session, redrawn as the level-over-time curve it was.
 *
 * The library used to render this measurement as text rows ("AVG 72.3 dBA").
 * The timeline was in the payload the whole time — what was missing was the
 * drawing (owner, device pass 2026-09-11).
 *
 * WHAT IS DRAWN IS ONLY WHAT WAS STORED:
 *   • one vertex per stored point, joined by straight segments — no smoothing,
 *     which would flatter a noisy capture, and no resampling, which would invent
 *     resolution the log does not have. Short logs also get a dot per point, so
 *     it is visible that these — and only these — are the measured values.
 *   • a non-finite entry is a hole in the log and is drawn as a hole; the curve
 *     is never bridged across it.
 *   • both axes come from the RECORD: the time axis from `durationSec` /
 *     `timelineStepSec`, the level axis from the logged values themselves. An old
 *     session is never redrawn against today's RANGE chip.
 *
 * VISUAL LANGUAGE — the same instrument as SplMeterScreen: the unit follows the
 * record's weighting exactly as the live screen's `splUnit` does (A → dBA,
 * C → dBC, Z → dB SPL — NEVER dBFS, which that screen reserves for genuine
 * digital readings), the calibration wording is the live screen's own
 * ("field-calibrated (approximate)" / "uncalibrated estimate"), and level is
 * coloured on the app's acoustic amplitude ramp (`splColorForDba`) so quiet
 * reads blue and loud reads red here exactly as it does on the meter.
 */
import { useId, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import type { CalibrationStatus, SplLogPayload } from '../types';
import { splColorForDba } from '../../levelColor';
import { fonts } from '../../../../theme/tokens';
import { PreviewFrame, PREVIEW_GRID, PREVIEW_H, PREVIEW_INK, TickLabel } from './previewKit';

const PAD_V = 12;
/** Never draw a level axis tighter than this. A steady room really does log a
 *  near-flat line; stretching a 0.2 dB wobble over the full frame would turn
 *  measurement noise into a dramatic curve. */
const MIN_SPAN_DB = 6;
/** Dots per point only while they stay readable — beyond this the curve alone
 *  carries it. */
const MAX_DOTS = 60;

/** The live meter's own unit rule (SplMeterScreen `splUnit`). */
const unitFor = (w: SplLogPayload['weighting']) => (w === 'C' ? 'dBC' : w === 'A' ? 'dBA' : 'dB SPL');
const weightingWord = (w: SplLogPayload['weighting']) =>
  w === 'C' ? 'C-weighted' : w === 'A' ? 'A-weighted' : 'Z-weighted';
/** The live meter's own response label. */
const responseWord = (r: SplLogPayload['response']) => (r === 'fast' ? 'FAST' : 'SLOW');

export function TimelinePreview({
  payload,
  calibrationStatus,
  height = PREVIEW_H,
  onPress,
}: {
  payload: SplLogPayload;
  /** From the RECORD. Absent ⇒ described as an uncalibrated estimate, which is
   *  what the live meter says whenever no field offset is set. */
  calibrationStatus?: CalibrationStatus;
  height?: number;
  onPress?: () => void;
}) {
  const gid = `tlPrev${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setSize((s) => (s && s.w === width && s.h === h ? s : { w: width, h }));
  };

  const unit = unitFor(payload.weighting);
  const calWord =
    calibrationStatus === 'calibrated' ? 'field-calibrated (approximate)' : 'uncalibrated estimate';
  const avg = Number.isFinite(payload.avgDb) ? payload.avgDb : null;
  const peak = Number.isFinite(payload.peakDb) ? payload.peakDb : null;
  const durSec =
    Number.isFinite(payload.durationSec) && payload.durationSec > 0 ? payload.durationSec : null;
  const stepSec =
    Number.isFinite(payload.timelineStepSec) && payload.timelineStepSec > 0
      ? payload.timelineStepSec
      : null;

  const points = Array.isArray(payload.timeline) ? payload.timeline : [];

  /** Facts about the STORED timeline — one source for caption, spoken label and
   *  drawing. */
  const stats = useMemo(() => {
    let drawn = 0;
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of points) {
      if (!Number.isFinite(v)) continue;
      drawn++;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (drawn === 0) return { drawn: 0, lo: 0, hi: 0, axisLo: 0, axisHi: 0 };
    // The average line must land inside the frame, so it takes part in the axis.
    let aLo = avg != null ? Math.min(lo, avg) : lo;
    let aHi = avg != null ? Math.max(hi, avg) : hi;
    const span = aHi - aLo;
    if (span < MIN_SPAN_DB) {
      const c = (aHi + aLo) / 2;
      aLo = c - MIN_SPAN_DB / 2;
      aHi = c + MIN_SPAN_DB / 2;
    } else {
      const pad = span * 0.08;
      aLo -= pad;
      aHi += pad;
    }
    return { drawn, lo, hi, axisLo: aLo, axisHi: aHi };
  }, [points, avg]);

  const hasData = stats.drawn > 0;

  const geo = useMemo(() => {
    if (!size || !hasData || size.w <= 0 || size.h <= 0) return null;
    const { w, h } = size;
    const top = PAD_V;
    const bottom = h - PAD_V;
    const range = stats.axisHi - stats.axisLo || 1;
    const y = (db: number) =>
      Math.min(h - 1, Math.max(1, bottom - ((db - stats.axisLo) / range) * (bottom - top)));
    const n = points.length;
    const x = (i: number) => (n <= 1 ? w / 2 : (i / (n - 1)) * w);

    // Contiguous runs of finite points; gaps stay gaps.
    const runs: { d: string; dots: { x: number; y: number }[] }[] = [];
    let i = 0;
    while (i < n) {
      if (!Number.isFinite(points[i])) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < n && Number.isFinite(points[j + 1])) j++;
      let d = '';
      const dots: { x: number; y: number }[] = [];
      for (let k = i; k <= j; k++) {
        const px = x(k);
        const py = y(points[k]);
        d += `${k === i ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
        dots.push({ x: px, y: py });
      }
      runs.push({ d, dots });
      i = j + 1;
    }

    // Gradient sampled off the SHARED acoustic ramp across the drawn axis, so a
    // level's colour here is the level's colour on the meter.
    const stops = Array.from({ length: 9 }, (_, k) => {
      const t = k / 8;
      return { offset: t, color: splColorForDba(stats.axisHi - t * (stats.axisHi - stats.axisLo)) };
    });

    return {
      w,
      h,
      runs,
      stops,
      yAvg: avg != null ? y(avg) : null,
      avgColor: avg != null ? splColorForDba(avg) : PREVIEW_GRID,
      showDots: stats.drawn <= MAX_DOTS,
    };
  }, [size, hasData, points, stats.axisLo, stats.axisHi, stats.drawn, avg]);

  // The time axis states what is actually DRAWN: the points span
  // (count − 1) × step, which need not equal the session's own durationSec.
  // Labelling the axis with durationSec when the log stopped early would stretch
  // the record's time base to fit the frame.
  const spanSec = stepSec != null && points.length > 1 ? (points.length - 1) * stepSec : durSec;
  const durPart = spanSec != null ? `0–${spanSec.toFixed(1)} s` : 'duration not recorded';
  const stepPart =
    stepSec != null
      ? ` @ ${stepSec < 1 ? stepSec.toFixed(2) : stepSec.toFixed(1)} s per point`
      : ' · step not recorded';
  const tail = `${weightingWord(payload.weighting)} · ${responseWord(payload.response)} · ${calWord}`;

  const sessionPart = durSec != null ? `${durSec.toFixed(1)} s session` : 'duration not recorded';
  const caption = hasData
    ? `${durPart}${stepPart} · level axis ${stats.axisLo.toFixed(1)}–${stats.axisHi.toFixed(1)} ${unit} · ${tail}`
    : `No usable timeline stored · ${sessionPart}${avg != null ? ` · average ${avg.toFixed(1)} ${unit}` : ''} · ${tail}`;

  const avgSpoken = avg != null ? ` Average ${avg.toFixed(1)} ${unit}.` : '';
  const peakSpoken = peak != null ? ` Peak ${peak.toFixed(1)} ${unit}.` : '';
  const a11y = hasData
    ? `Saved sound level session. ${durSec != null ? `${durSec.toFixed(1)} seconds logged, ` : ''}` +
      `${stats.drawn} stored points${stepSec != null ? `, one every ${stepSec < 1 ? stepSec.toFixed(2) : stepSec.toFixed(1)} seconds` : ''}. ` +
      `Level ran from ${stats.lo.toFixed(1)} to ${stats.hi.toFixed(1)} ${unit}.${avgSpoken}${peakSpoken} ` +
      `${weightingWord(payload.weighting)}, ${responseWord(payload.response)} response, ${calWord}.`
    : `Saved sound level session. ${durSec != null ? `${durSec.toFixed(1)} seconds. ` : ''}` +
      `No usable level timeline was stored with this record.${avgSpoken}${peakSpoken} ` +
      `${weightingWord(payload.weighting)}, ${responseWord(payload.response)} response, ${calWord}.`;

  return (
    <PreviewFrame caption={caption} height={height} onPress={onPress} a11yLabel={a11y}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {geo ? (
          <Svg width={geo.w} height={geo.h}>
            <Defs>
              <LinearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={PAD_V} x2={0} y2={geo.h - PAD_V}>
                {geo.stops.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            {/* The session average — the reference the curve is read against. */}
            {geo.yAvg != null ? (
              <Line
                x1={0}
                x2={geo.w}
                y1={geo.yAvg}
                y2={geo.yAvg}
                stroke={geo.avgColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeOpacity={0.85}
              />
            ) : null}
            {geo.runs.map((r, i) => (
              <Path key={`p${i}`} d={r.d} fill="none" stroke={`url(#${gid})`} strokeWidth={1.6} />
            ))}
            {geo.showDots
              ? geo.runs.map((r, i) =>
                  r.dots.map((p, k) => (
                    <Circle key={`d${i}-${k}`} cx={p.x} cy={p.y} r={1.6} fill={`url(#${gid})`} />
                  )),
                )
              : null}
          </Svg>
        ) : null}
        {geo && geo.yAvg != null && avg != null ? (
          <TickLabel text={`AVG ${avg.toFixed(1)}`} x={3} y={Math.max(1, geo.yAvg - 12)} />
        ) : null}
        {!hasData ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No usable level timeline was stored with this session.</Text>
          </View>
        ) : null}
      </View>
    </PreviewFrame>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    color: PREVIEW_INK,
    textAlign: 'center',
  },
});
