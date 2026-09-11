/**
 * A SAVED RT60 capture, redrawn as the decay curve it was measured as.
 *
 * The library used to render this measurement as a text row about how many
 * points the curve had. The curve itself was in the payload the whole time —
 * what was missing was the drawing (owner, device pass 2026-09-11).
 *
 * WHAT IT MATCHES IN THE LIVE TOOL (src/screens/tools/Rt60Screen.tsx), so a
 * saved capture reads as the same instrument:
 *   • The same 0 → −60 dB window, mapped the same way (y = db / −60), with the
 *     same clamp — a stored point outside the window is pinned to the edge
 *     rather than left to run off it, and the caption names the window so the
 *     clamp is disclosed rather than hidden.
 *   • The same amplitude ramp on the trace and its underfill: levelColor
 *     sampled hot-at-0-dB → blue-at-the-floor, anchored to the dB axis in
 *     userSpaceOnUse, so a given dB is always the same colour. The live tool's
 *     rt60DecayRamp, rebuilt from the same helper.
 *   • The same dashed-amber fit-region markers — but only the markers for THE
 *     METHOD THIS RECORD WAS FIT WITH, so the picture shows the region that
 *     actually produced this number rather than all three possibilities.
 *
 * WHY THE NOISE FLOOR IS DRAWN AND NOT SUMMARISED: where the curve meets the
 * floor is the whole reason a fit can be unreliable. It gets its own rule and
 * a shaded region beneath it, in the frame's neutral ink — deliberately OUTSIDE
 * the amplitude ramp, because it is a reference level about trust, not a level
 * to be read off the colour.
 *
 * HONESTY:
 *   • Every plotted point is a stored point. No resampling, no smoothing, and
 *     a gap in the stored curve stays a gap — the path breaks rather than
 *     bridging across missing samples as though they had been measured.
 *   • RT60 is never shown without its method (§13 "always labeled"), and an
 *     invalid band is named as invalid rather than dropped from the count.
 *   • `confidence` is a raw R² goodness-of-fit, printed as R² — never as a
 *     percentage, which would read as a probability it is not.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { ImpulseResponsePayload } from '../types';
import { levelColor } from '../../levelColor';
import { colors } from '../../../../theme/tokens';
import { PreviewFrame, PREVIEW_H, PREVIEW_INK, TickLabel } from './previewKit';

/** The live tool's decay window (Rt60Screen CURVE_FLOOR_DB). */
const FLOOR_DB = -60;
/** The live tool's trace ramp, ordered TOP (0 dB, hot) → floor (silence, blue). */
const DECAY_RAMP = Array.from({ length: 7 }, (_, i) => levelColor(1 - i / 6));

const PLOT_TOP = 4;
const LABEL_H = 13;
const PAD_X = 2;

/** The dB bounds of the fit each method reads between (Rt60Screen's caption:
 *  "The T20 fit reads −5→−25 dB; T30 reads −5→−35 dB"). EDT is the early-decay
 *  fit over the first 10 dB. */
const FIT_REGION: Record<'T20' | 'T30' | 'EDT', number[]> = {
  T20: [-5, -25],
  T30: [-5, -35],
  EDT: [0, -10],
};
const FIT_TEXT: Record<'T20' | 'T30' | 'EDT', string> = {
  T20: 'T20 fit reads −5→−25 dB',
  T30: 'T30 fit reads −5→−35 dB',
  EDT: 'EDT fit reads 0→−10 dB',
};

/** Band label in the live tool's words ("125 Hz", "4 kHz"). */
const fmtBand = (hz: number): string => (hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`);
const fmtFloor = (db: number): string => `noise floor ${Math.round(db)} dB`.replace('-', '−');

export function DecayPreview({
  payload,
  height = PREVIEW_H,
  onPress,
}: {
  payload: ImpulseResponsePayload;
  height?: number;
  onPress?: () => void;
}) {
  const plotBottom = height - LABEL_H;
  const plotH = Math.max(1, plotBottom - PLOT_TOP);
  /** The live mapping, offset into the frame: 0 dB at the top, −60 at the
   *  bottom, clamped to the window exactly as Rt60Screen clamps it. */
  const yForDb = (db: number): number =>
    PLOT_TOP + (Math.max(FLOOR_DB, Math.min(0, db)) / FLOOR_DB) * plotH;

  // The frame is fluid; measure it before drawing a time axis the caption is
  // about to state in seconds.
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const chartW = Math.max(0, w - PAD_X * 2);

  const curve = payload.decayDb;
  const stepSec = payload.decayStepSec;
  const hasStep = Number.isFinite(stepSec) && stepSec > 0;
  const totalSec = hasStep ? curve.length * stepSec : null;

  /** Contiguous runs of FINITE stored points, as separate sub-paths. A run of
   *  one point draws nothing: a single sample is not a line, and stretching it
   *  into one would assert a slope that was never measured. */
  const segments = useMemo(() => {
    if (chartW <= 0 || curve.length < 2) return [] as { line: string; fill: string }[];
    const out: { line: string; fill: string }[] = [];
    let d = '';
    let firstX = 0;
    let lastX = 0;
    let count = 0;
    const flush = () => {
      if (count >= 2) {
        out.push({
          line: d,
          fill: `${d}L${lastX.toFixed(1)} ${plotBottom.toFixed(1)} L${firstX.toFixed(1)} ${plotBottom.toFixed(1)}Z`,
        });
      }
      d = '';
      count = 0;
    };
    for (let i = 0; i < curve.length; i++) {
      const db = curve[i];
      if (!Number.isFinite(db)) {
        flush();
        continue;
      }
      const x = PAD_X + (i / (curve.length - 1)) * chartW;
      const y = yForDb(db);
      if (count === 0) firstX = x;
      lastX = x;
      d += `${count === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      count += 1;
    }
    flush();
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve, chartW, plotBottom, plotH]);

  // ---- Per-band verdict (§13: a band is valid, or it is named invalid) ----
  const bandSummary = useMemo(() => {
    const rows = payload.perBand ?? [];
    const valid = rows.filter((b) => b.rt60Sec != null && Number.isFinite(b.rt60Sec) && b.rt60Sec > 0);
    const invalid = rows.filter((b) => !(b.rt60Sec != null && Number.isFinite(b.rt60Sec) && b.rt60Sec > 0));
    const r2 = valid.map((b) => b.confidence).filter((c) => Number.isFinite(c));
    return {
      total: rows.length,
      valid: valid.length,
      invalidNames: invalid.map((b) => fmtBand(b.bandHz)),
      r2Lo: r2.length > 0 ? Math.min(...r2) : null,
      r2Hi: r2.length > 0 ? Math.max(...r2) : null,
    };
  }, [payload.perBand]);

  /** R² as R², never a percent — and a range only when there is a range. */
  const r2Text =
    bandSummary.r2Lo == null || bandSummary.r2Hi == null
      ? ''
      : bandSummary.r2Lo === bandSummary.r2Hi
        ? `R² ${bandSummary.r2Lo.toFixed(2)}`
        : `R² ${bandSummary.r2Lo.toFixed(2)}–${bandSummary.r2Hi.toFixed(2)}`;

  const bandText =
    bandSummary.total === 0
      ? 'no per-band fits stored'
      : bandSummary.valid === 0
        ? `no band gave a valid fit (${bandSummary.total} bands) — invalid: ${bandSummary.invalidNames.join(', ')}`
        : bandSummary.invalidNames.length === 0
          ? `${bandSummary.valid} of ${bandSummary.total} bands valid, ${r2Text}`
          : `${bandSummary.valid} of ${bandSummary.total} bands valid, ${r2Text} · invalid: ${bandSummary.invalidNames.join(', ')}`;

  const nf = payload.noiseFloorDb;
  const nfFinite = nf != null && Number.isFinite(nf);
  const nfInWindow = nfFinite && (nf as number) <= 0 && (nf as number) >= FLOOR_DB;
  const nfText = !nfFinite
    ? 'noise floor not recorded'
    : nfInWindow
      ? fmtFloor(nf as number)
      : `${fmtFloor(nf as number)} (outside the plotted window)`;

  const method = payload.method;
  const fitText = FIT_TEXT[method] ?? `${String(method)} fit`;
  const spanText =
    segments.length === 0
      ? 'no decay curve stored'
      : totalSec != null
        ? `0 to −60 dB over ${totalSec.toFixed(2)} s (${Math.round(stepSec * 1000)} ms steps)`
        : '0 to −60 dB · time step not recorded';

  const caption = `Schroeder decay · ${spanText} · ${fitText} · ${nfText} · ${bandText}`;

  const a11y = useMemo(() => {
    const head =
      segments.length === 0
        ? 'Saved RT60 capture: no decay curve is stored in this record, so there is nothing to draw.'
        : totalSec != null
          ? `Saved RT60 capture: broadband Schroeder decay plotted from 0 to minus 60 decibels over ${totalSec.toFixed(2)} seconds.`
          : 'Saved RT60 capture: broadband Schroeder decay plotted from 0 to minus 60 decibels; the time step is not recorded.';
    // Spelled, not signed: a screen reader reading "-52" aloud is unreliable.
    const spokenDb = (db: number) => `${db < 0 ? 'minus ' : ''}${Math.abs(Math.round(db))} decibels`;
    const floor = !nfFinite
      ? 'The noise floor was not recorded.'
      : `The noise floor sits at ${spokenDb(nf as number)}${nfInWindow ? '' : ', outside the plotted window'}.`;
    const bandsSpoken =
      bandSummary.total === 0
        ? 'No per-band fits are stored.'
        : bandSummary.valid === 0
          ? `None of the ${bandSummary.total} octave bands gave a valid fit: ${bandSummary.invalidNames.join(', ')} are all invalid.`
          : bandSummary.invalidNames.length === 0
            ? `All ${bandSummary.total} octave bands gave a valid fit${r2Text ? `, ${r2Text}` : ''}.`
            : `${bandSummary.valid} of ${bandSummary.total} octave bands gave a valid fit${r2Text ? `, ${r2Text}` : ''}; invalid: ${bandSummary.invalidNames.join(', ')}.`;
    return `${head} ${fitText}. ${floor} ${bandsSpoken}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length, totalSec, nfFinite, nfInWindow, nf, bandSummary, r2Text, fitText]);

  return (
    <PreviewFrame caption={caption} height={height} onPress={onPress} a11yLabel={a11y}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            <Defs>
              {/* The live tool's rt60DecayRamp: hot where the energy is, cooling
                  to blue as the room dies away, pinned to the dB axis so a given
                  dB is always the same colour. */}
              <LinearGradient
                id="savedDecayRamp"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={PLOT_TOP}
                x2="0"
                y2={plotBottom}
              >
                {DECAY_RAMP.map((c, i) => (
                  <Stop key={i} offset={i / (DECAY_RAMP.length - 1)} stopColor={c} />
                ))}
              </LinearGradient>
              <LinearGradient
                id="savedDecayFill"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={PLOT_TOP}
                x2="0"
                y2={plotBottom}
              >
                {DECAY_RAMP.map((c, i) => (
                  <Stop
                    key={i}
                    offset={i / (DECAY_RAMP.length - 1)}
                    stopColor={c}
                    stopOpacity={0.26 * (1 - i / (DECAY_RAMP.length - 1))}
                  />
                ))}
              </LinearGradient>
            </Defs>

            {/* Below the noise floor nothing can be trusted — shade it, so the
                point at which the curve arrives there is visible rather than
                inferred. */}
            {nfInWindow ? (
              <Rect
                x={0}
                y={yForDb(nf as number)}
                width={w}
                height={Math.max(0, plotBottom - yForDb(nf as number))}
                fill={PREVIEW_INK}
                fillOpacity={0.12}
              />
            ) : null}

            {/* Fit-region markers for THIS record's method — dashed amber, the
                live tool's weight and dash. */}
            {(FIT_REGION[method] ?? []).map((db) => (
              <Line
                key={db}
                x1={PAD_X}
                x2={w - PAD_X}
                y1={yForDb(db)}
                y2={yForDb(db)}
                stroke={colors.amber}
                strokeOpacity={0.45}
                strokeWidth={0.9}
                strokeDasharray="5 4"
              />
            ))}

            {/* The measured decay: underfill, glow halo, crisp core. */}
            {segments.map((s, i) => (
              <Path key={`f${i}`} d={s.fill} fill="url(#savedDecayFill)" />
            ))}
            {segments.map((s, i) => (
              <Path
                key={`h${i}`}
                d={s.line}
                fill="none"
                stroke="url(#savedDecayRamp)"
                strokeWidth={5}
                strokeOpacity={0.18}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {segments.map((s, i) => (
              <Path
                key={`c${i}`}
                d={s.line}
                fill="none"
                stroke="url(#savedDecayRamp)"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* The noise floor itself, on top of the trace — neutral ink, well
                outside the amplitude ramp, because it is a trust reference and
                not a level to read off the colour. */}
            {nfInWindow ? (
              <Line
                x1={0}
                x2={w}
                y1={yForDb(nf as number)}
                y2={yForDb(nf as number)}
                stroke={PREVIEW_INK}
                strokeWidth={1.2}
                strokeDasharray="2 3"
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
      {nfInWindow ? (
        <TickLabel
          text={fmtFloor(nf as number)}
          x={4}
          y={Math.min(plotBottom - 11, yForDb(nf as number) + 2)}
        />
      ) : null}
      <TickLabel text="0 s" x={3} y={plotBottom + 1} />
      {totalSec != null ? (
        <TickLabel text={`${totalSec.toFixed(1)} s`} x={Math.max(3, w - 34)} y={plotBottom + 1} />
      ) : null}
    </PreviewFrame>
  );
}
