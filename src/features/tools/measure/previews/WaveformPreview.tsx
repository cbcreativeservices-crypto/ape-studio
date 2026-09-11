/**
 * A SAVED waveform snapshot, redrawn as the waveform it was captured as.
 *
 * The library used to render this measurement as the text row
 * "PEAK −6.2 dBFS". The envelope itself was in the payload the whole time —
 * what was missing was the drawing (owner, device pass 2026-09-11: "snapshots
 * are not images… the whole idea of capturing the spectrogram").
 *
 * WHAT IS DRAWN IS ONLY WHAT WAS STORED:
 *   • `envelope` is a MIN/MAX pair per bucket, so it draws as a filled band
 *     between the two — never as a single line through the middle, which would
 *     throw away half the measurement and imply a sample path nobody recorded.
 *   • Each bucket is held FLAT across its own column (the live tool's
 *     sample-and-hold, owner 2026-08-01) — interpolating between bucket centres
 *     would slew flat tops into triangles and invent resolution the capture does
 *     not have.
 *   • The vertical scale is stated in the caption and taken from the RECORD's
 *     own envelope, so an old snapshot is never redrawn against today's zoom.
 *
 * VISUAL LANGUAGE — the same instrument as WaveformScreen, not a document about
 * it: MIDI-0 blue zero line (levelColor.ts: the mid line is ALWAYS MIDLINE_BLUE),
 * the shared amplitude ramp keyed to TRUE amplitude in panel pixels, dashed
 * full-scale rules with a `0dB` tick, and the live tool's red clip lane at the
 * top of the panel.
 *
 * HONESTY: these are digital levels — dBFS — from an uncalibrated phone mic, and
 * they are labelled as relative, never presented as SPL (live screen: "Levels
 * are RELATIVE (uncalibrated)"). Peak is never clamped; it may exceed 0 dBFS
 * (finding F1).
 */
import { useId, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import type { WaveformSnapshotPayload } from '../types';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../levelColor';
import { colors, fonts } from '../../../../theme/tokens';
import { PreviewFrame, PREVIEW_GRID, PREVIEW_H, PREVIEW_INK, TickLabel } from './previewKit';

/** Amplitude at −0.1 dBFS — the live tool's own clipping predicate
 *  (SplMeterScreen `isClipping`), so "clipped" means one thing app-wide. */
const CLIP_AMP = Math.pow(10, -0.1 / 20);
/** Vertical inset: leaves the clip-tick lane clear at the top, as the live
 *  oscilloscope's PAD_V does. */
const PAD_V = 10;

/** Honest dBFS formatting — NEVER clamps; peak can exceed 0 dBFS (F1).
 *  Mirrors WaveformScreen's fmtDb. */
const fmtDb = (v: number) => {
  if (!Number.isFinite(v)) return '—';
  const n = Math.abs(v) < 0.05 ? 0 : v;
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}`;
};

type Entry = { min: number; max: number };

const usable = (e: Entry | undefined) =>
  !!e && Number.isFinite(e.min) && Number.isFinite(e.max);

export function WaveformPreview({
  payload,
  height = PREVIEW_H,
  onPress,
}: {
  payload: WaveformSnapshotPayload;
  height?: number;
  onPress?: () => void;
}) {
  const gid = `wfPrev${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setSize((s) => (s && s.w === width && s.h === h ? s : { w: width, h }));
  };

  const env = Array.isArray(payload.envelope) ? payload.envelope : [];
  const clippedRuns = Number.isFinite(payload.clippedRuns) ? payload.clippedRuns : 0;

  /** Facts about the STORED envelope — computed once, used by the caption, the
   *  spoken label and the drawing, so they cannot disagree. */
  const stats = useMemo(() => {
    let drawn = 0;
    let lo = Infinity;
    let hi = -Infinity;
    let touchedFs = false;
    for (const e of env) {
      if (!usable(e)) continue;
      drawn++;
      const a = Math.min(e.min, e.max);
      const b = Math.max(e.min, e.max);
      if (a < lo) lo = a;
      if (b > hi) hi = b;
      if (b >= CLIP_AMP || a <= -CLIP_AMP) touchedFs = true;
    }
    const observed = drawn > 0 ? Math.max(Math.abs(lo), Math.abs(hi)) : 0;
    return {
      drawn,
      lo: drawn > 0 ? lo : 0,
      hi: drawn > 0 ? hi : 0,
      touchedFs,
      // Samples can exceed ±1 (F1): the drawing autoscales to the observed max,
      // exactly as the live scope does, and says so in the caption.
      scaleMax: Math.max(1.05, observed),
    };
  }, [env]);

  const hasData = stats.drawn > 0;
  const durSec = Number.isFinite(payload.durationSec) && payload.durationSec > 0 ? payload.durationSec : null;
  // Bucket length is the record's OWN duration divided by the points it stored —
  // never today's engine bucket size.
  const stepMs = durSec != null && env.length > 0 ? (durSec / env.length) * 1000 : null;

  const geo = useMemo(() => {
    if (!size || !hasData || size.w <= 0 || size.h <= 0) return null;
    const { w, h } = size;
    const half = h / 2;
    const reach = Math.max(4, half - PAD_V);
    const rawY = (v: number) => half - (v * reach) / stats.scaleMax;
    const y = (v: number) => Math.min(h - 1, Math.max(1, rawY(v)));
    const colW = w / env.length;

    // One filled band per CONTIGUOUS run of usable entries (top edge L→R, bottom
    // edge R→L). A non-finite entry is a hole in the measurement, so it is drawn
    // as a hole — never bridged, which would invent a level that was not stored.
    const bands: string[] = [];
    let i = 0;
    while (i < env.length) {
      if (!usable(env[i])) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < env.length && usable(env[j + 1])) j++;
      let top = '';
      const bot: string[] = [];
      for (let k = i; k <= j; k++) {
        const e = env[k];
        let yHi = y(Math.max(e.min, e.max));
        let yLo = y(Math.min(e.min, e.max));
        if (yLo - yHi < 1) {
          // Hairline floor so near-silence still draws a visible 1 px band —
          // the live scope's own convention, not an invented level.
          yHi -= 0.5;
          yLo += 0.5;
        }
        const x0 = (k * colW).toFixed(1);
        const x1 = ((k + 1) * colW).toFixed(1);
        // Each bucket is HELD FLAT across its own column (sample-and-hold): the
        // measurement says what the level was over that span, not how it got there.
        top += `${k === i ? 'M' : 'L'}${x0} ${yHi.toFixed(1)}L${x1} ${yHi.toFixed(1)}`;
        bot.push(`L${x1} ${yLo.toFixed(1)}L${x0} ${yLo.toFixed(1)}`);
      }
      bot.reverse();
      bands.push(`${top}${bot.join('')}Z`);
      i = j + 1;
    }

    // Clip lane — one red tick over every bucket whose STORED envelope reaches
    // digital full scale. The live scope draws exactly this, per real bucket.
    const ticks: number[] = [];
    for (let k = 0; k < env.length; k++) {
      const e = env[k];
      if (!usable(e)) continue;
      if (Math.max(e.min, e.max) >= CLIP_AMP || Math.min(e.min, e.max) <= -CLIP_AMP) {
        ticks.push((k + 0.5) * colW);
      }
    }

    return {
      w,
      h,
      half,
      // Gradient axis in panel pixels: red at ±full scale, MIDI-0 blue at the
      // zero line, so colour tracks TRUE amplitude at any draw scale.
      gradY0: half - reach / stats.scaleMax,
      gradY1: half + reach / stats.scaleMax,
      yFsTop: y(1),
      yFsBot: y(-1),
      bands,
      ticks,
      tickW: Math.max(1.5, colW * 0.8),
    };
  }, [size, hasData, env, stats.scaleMax]);

  const clipped = clippedRuns > 0 || stats.touchedFs;
  const peakTxt = `${fmtDb(payload.peakDbfs)} dBFS`;

  const timePart = durSec != null ? `${durSec.toFixed(1)} s` : 'duration not recorded';
  const stepPart = stepMs != null ? ` @ ${stepMs < 10 ? stepMs.toFixed(1) : Math.round(stepMs)} ms` : '';
  const clipPart = clippedRuns > 0 ? ` · ${clippedRuns} clipped ${clippedRuns === 1 ? 'run' : 'runs'}` : '';
  const caption = hasData
    ? `${timePart} · ${stats.drawn} envelope points${stepPart} · vertical ±${stats.scaleMax.toFixed(2)} of full scale · peak ${peakTxt} · relative (uncalibrated)${clipPart}`
    : `No usable envelope stored · ${timePart} · peak ${peakTxt} · relative (uncalibrated)${clipPart}`;

  const a11y = hasData
    ? `Saved waveform snapshot. ${durSec != null ? `${durSec.toFixed(1)} seconds, ` : ''}` +
      `${stats.drawn} stored envelope points${stepMs != null ? ` at ${stepMs < 10 ? stepMs.toFixed(1) : Math.round(stepMs)} milliseconds each` : ''}. ` +
      `Peak ${peakTxt}, relative and uncalibrated. ` +
      `Envelope runs from ${stats.lo.toFixed(2)} to ${stats.hi.toFixed(2)} of full scale. ` +
      `${clippedRuns > 0 ? `${clippedRuns} clipped ${clippedRuns === 1 ? 'run' : 'runs'}.` : 'No clipped runs.'}`
    : `Saved waveform snapshot. No usable envelope was stored with this record. ` +
      `Peak ${peakTxt}, relative and uncalibrated. ` +
      `${clippedRuns > 0 ? `${clippedRuns} clipped ${clippedRuns === 1 ? 'run' : 'runs'}.` : 'No clipped runs.'}`;

  return (
    <PreviewFrame caption={caption} height={height} onPress={onPress} a11yLabel={a11y}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {geo ? (
          <Svg width={geo.w} height={geo.h}>
            <Defs>
              <LinearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={geo.gradY0} x2={0} y2={geo.gradY1}>
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            {/* ±full scale (0 dBFS). Red once the capture actually reached the
                ceiling — the live tool's clip cue is colour, not a sentence. */}
            <Line
              x1={0}
              x2={geo.w}
              y1={geo.yFsTop}
              y2={geo.yFsTop}
              stroke={clipped ? colors.red : PREVIEW_GRID}
              strokeWidth={1}
              strokeDasharray="3 5"
              strokeOpacity={clipped ? 0.75 : 0.6}
            />
            <Line
              x1={0}
              x2={geo.w}
              y1={geo.yFsBot}
              y2={geo.yFsBot}
              stroke={clipped ? colors.red : PREVIEW_GRID}
              strokeWidth={1}
              strokeDasharray="3 5"
              strokeOpacity={clipped ? 0.75 : 0.6}
            />
            {/* The zero line — MIDI-0 blue, always (levelColor.ts). */}
            <Line x1={0} x2={geo.w} y1={geo.half} y2={geo.half} stroke={MIDLINE_BLUE} strokeWidth={1} />
            {geo.bands.map((d, i) => (
              <Path key={i} d={d} fill={`url(#${gid})`} opacity={0.92} />
            ))}
            {geo.ticks.map((x, i) => (
              <Line key={i} x1={x} x2={x} y1={3} y2={11} stroke={colors.red} strokeWidth={geo.tickW} />
            ))}
          </Svg>
        ) : null}
        {geo ? <TickLabel text="0dB" x={3} y={Math.max(1, geo.yFsTop - 11)} /> : null}
        {geo ? <TickLabel text="−∞" x={3} y={geo.half - 5} /> : null}
        {/* clippedRuns is a whole-capture count, so it is shown even when no
            stored bucket in this window reached the ceiling. */}
        {clippedRuns > 0 ? <Text style={styles.clipBadge}>CLIP ×{clippedRuns}</Text> : null}
        {!hasData ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No usable envelope was stored with this snapshot.</Text>
          </View>
        ) : null}
      </View>
    </PreviewFrame>
  );
}

const styles = StyleSheet.create({
  clipBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.red,
  },
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
