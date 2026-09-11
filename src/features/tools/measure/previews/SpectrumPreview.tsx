/**
 * A SAVED RTA trace, redrawn as the spectrum it was captured as.
 *
 * The library used to render this measurement as the text row
 * "BANDS: 31 × 1/3 octave". The band centers and their levels were in the
 * payload the whole time — what was missing was the drawing (owner, device
 * pass 2026-09-11: "snapshots are not images… the whole idea of capturing the
 * spectrogram").
 *
 * WHAT IT MATCHES IN THE LIVE TOOL (src/screens/tools/RtaScreen.tsx), so a
 * saved capture reads as the same instrument rather than a document about it:
 *   • The frequency axis is the live RTA's: ONE EVEN-WIDTH BAR PER BAND. The
 *     stored centers are octave / third-octave, i.e. already log-spaced, so
 *     even index spacing IS the log axis — no resampling onto a pixel-log axis,
 *     which would have to interpolate levels the measurement never took.
 *   • Decade labels come from the live tool's own targets (63 · 250 · 1k · 4k ·
 *     16k), matched to the NEAREST stored band and dropped when that band is
 *     more than half an octave away — the same rule, so a label never points at
 *     a band it does not belong to.
 *   • Bars carry the app-wide amplitude ramp (levelColor's LOUDNESS_STOPS),
 *     which is what the live RTA draws with COLORS on. The gradient is anchored
 *     in userSpaceOnUse to the PIXELS of 0 dBFS and −90 dBFS exactly as
 *     RtaScreen's `rtaBarFillMidi` is, so a given dBFS is always the same
 *     colour no matter how the window below is framed: the colour states the
 *     true level even when the geometry is zoomed.
 *
 * HONESTY:
 *   • Only stored values are drawn. No interpolation, no smoothing, no
 *     peak-hold (the payload carries none, so none is invented).
 *   • The dB window is derived FROM THIS RECORD's own levels, and the caption
 *     prints the window it actually drew — an old trace is never silently
 *     re-scaled against today's display floor.
 *   • The unit is dBFS, said out loud as uncalibrated and relative (the tool's
 *     own words), unless the record was captured on a calibrated input.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { CalibrationStatus, SpectrumTracePayload } from '../types';
import { LOUDNESS_STOPS } from '../../levelColor';
import { PreviewFrame, PREVIEW_GRID, PREVIEW_H, TickLabel } from './previewKit';

/** Decade-ish labels the live RTA prints, in its order (RtaScreen
 *  LABEL_TARGETS). Copied rather than imported — the screen does not export
 *  them, and the axis rule is what matters, not the constant's home. */
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;
/** The live tool's colour anchors for the MIDI level ramp: 0 dBFS is the hot
 *  end, −90 dBFS the display floor (RtaScreen ZERO_Y → FLOOR_DB). */
const RAMP_TOP_DB = 0;
const RAMP_BOTTOM_DB = -90;
/** Sentinel guard: the derived-band code marks an unresolvable band −999
 *  (sixthOctave NO_LEVEL), and nothing acoustic lives below −200 dBFS. Such a
 *  value is excluded rather than drawn or allowed to set the window. */
const NO_LEVEL_BELOW_DB = -200;

const GUTTER = 27; // dB labels
const LABEL_H = 13; // frequency labels
const PLOT_TOP = 6;

const fmtHz = (hz: number): string =>
  hz >= 1000
    ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1).replace(/\.0$/, '')} kHz`
    : `${Math.round(hz)} Hz`;

/** Nearest band index per labelled center, skipped when over half an octave
 *  off and de-duplicated by index — the live tool's `bandLabels`, unchanged. */
function bandLabels(centers: number[]): { i: number; text: string }[] {
  const out: { i: number; text: string }[] = [];
  for (const hz of LABEL_TARGETS) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      if (centers[i] <= 0) continue;
      const d = Math.abs(Math.log2(centers[i] / hz));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best >= 0 && bestDist <= 0.5 && !out.some((l) => l.i === best)) {
      out.push({ i: best, text: hz >= 1000 ? `${hz / 1000}k` : `${hz}` });
    }
  }
  return out;
}

export function SpectrumPreview({
  payload,
  height = PREVIEW_H,
  onPress,
  calibrationStatus = 'uncalibrated',
}: {
  payload: SpectrumTracePayload;
  height?: number;
  onPress?: () => void;
  /** From the RECORD, not from today's input. Absent means the honest default
   *  every engine tool saves: an uncalibrated phone mic. */
  calibrationStatus?: CalibrationStatus;
}) {
  // Pair up defensively: the two arrays are written together by the save path,
  // but a truncated or hand-edited record must not throw, and a non-finite
  // level must not become a bar or drag the window with it.
  const bands = useMemo(() => {
    const n = Math.min(payload.bandsHz.length, payload.levelsDb.length);
    const out: { hz: number; db: number }[] = [];
    for (let i = 0; i < n; i++) {
      const hz = payload.bandsHz[i];
      const db = payload.levelsDb[i];
      if (!Number.isFinite(hz) || hz <= 0) continue;
      if (!Number.isFinite(db) || db <= NO_LEVEL_BELOW_DB) continue;
      out.push({ hz, db });
    }
    return out;
  }, [payload.bandsHz, payload.levelsDb]);

  /** The dB window THIS record is drawn against, rounded out to 5 dB and never
   *  narrower than 10 dB — so an all-identical trace draws a readable flat row
   *  instead of a full-height wall, and the caption can state a real number. */
  const win = useMemo(() => {
    if (bands.length === 0) return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const b of bands) {
      if (b.db < lo) lo = b.db;
      if (b.db > hi) hi = b.db;
    }
    const top = Math.ceil(hi / 5) * 5;
    const bottom = Math.min(Math.floor(lo / 5) * 5, top - 10);
    return { top, bottom };
  }, [bands]);

  // The frame is fluid; measure it. Bars placed against a guessed width would
  // put the decade labels under the wrong bands.
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const plotBottom = height - LABEL_H;
  const chartW = Math.max(0, w - GUTTER - 4);
  const yForDb = (db: number): number => {
    if (!win) return plotBottom;
    const span = win.top - win.bottom || 1;
    return PLOT_TOP + ((win.top - db) / span) * (plotBottom - PLOT_TOP);
  };

  /** Three to four round rules inside the window — enough to read a level
   *  against, quiet enough that the measurement stays the brightest thing. */
  const rules = useMemo(() => {
    if (!win) return [] as number[];
    const span = win.top - win.bottom;
    const step = span > 60 ? 30 : span > 30 ? 20 : span > 15 ? 10 : 5;
    const out: number[] = [];
    for (let db = Math.ceil(win.bottom / step) * step; db <= win.top; db += step) out.push(db);
    return out;
  }, [win]);

  const labels = useMemo(() => bandLabels(bands.map((b) => b.hz)), [bands]);
  const barW = bands.length > 0 && chartW > 0 ? chartW / bands.length : 0;
  const pad = barW > 3 ? 1 : 0.5;

  const fracText = payload.fraction === 1 ? '1/1 OCT' : '1/3 OCT';
  const unit =
    calibrationStatus === 'calibrated' ? 'dB (calibrated input)' : 'dBFS (uncalibrated · relative)';

  // Typographic minus in COPY (the live screens' convention); the dB gutter
  // keeps the plain hyphen the live RTA's gutter prints.
  const capDb = (db: number) => String(db).replace('-', '−');
  const caption = win
    ? `${fracText} · ${bands.length} bands · ${fmtHz(bands[0].hz)}–${fmtHz(bands[bands.length - 1].hz)} log axis · ` +
      `${capDb(win.top)} to ${capDb(win.bottom)} ${unit} · ${payload.averaging} averaging · smoothing ${payload.smoothing}`
    : `${fracText} · no band levels stored in this record · ${payload.averaging} averaging · smoothing ${payload.smoothing}`;

  const a11y = useMemo(() => {
    if (bands.length === 0) {
      return `Saved RTA trace, ${payload.fraction === 1 ? 'one-octave' : 'one-third-octave'} bands. No band levels are stored in this record, so there is nothing to draw.`;
    }
    let loud = bands[0];
    let quiet = bands[0];
    for (const b of bands) {
      if (b.db > loud.db) loud = b;
      if (b.db < quiet.db) quiet = b;
    }
    const spoken = (hz: number) =>
      hz >= 1000 ? `${(hz / 1000).toFixed(1)} kilohertz` : `${Math.round(hz)} hertz`;
    // Spelled, not signed: a screen reader reading "-34" aloud is unreliable.
    const spokenDb = (db: number) =>
      `${db < 0 ? 'minus ' : ''}${Math.abs(Math.round(db))} decibels`;
    const unitSpoken =
      calibrationStatus === 'calibrated'
        ? 'Levels are calibrated decibels.'
        : 'Levels are dBFS — uncalibrated and relative, not sound pressure level.';
    return (
      `Saved RTA trace: ${bands.length} ${payload.fraction === 1 ? 'one-octave' : 'one-third-octave'} bands ` +
      `from ${spoken(bands[0].hz)} to ${spoken(bands[bands.length - 1].hz)}. ` +
      `Loudest band ${spoken(loud.hz)} at ${spokenDb(loud.db)}; quietest ${spoken(quiet.hz)} at ${spokenDb(quiet.db)}. ` +
      unitSpoken
    );
  }, [bands, payload.fraction, calibrationStatus]);

  return (
    <PreviewFrame caption={caption} height={height} onPress={onPress} a11yLabel={a11y}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {w > 0 && win != null && chartW > 0 ? (
          <Svg width={w} height={height}>
            <Defs>
              {/* The app-wide amplitude ramp, anchored to the dB axis in
                  userSpaceOnUse — not to the bar — exactly as the live RTA
                  anchors it. 0 dBFS is red, −90 dBFS blue, and a short bar can
                  therefore only ever show the cool end. */}
              <LinearGradient
                id="savedRtaBar"
                x1="0"
                y1={yForDb(RAMP_TOP_DB)}
                x2="0"
                y2={yForDb(RAMP_BOTTOM_DB)}
                gradientUnits="userSpaceOnUse"
              >
                {LOUDNESS_STOPS.map((s) => (
                  <Stop key={s.pos} offset={String(s.pos)} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            {rules.map((db) => (
              <Line
                key={db}
                x1={GUTTER}
                x2={w - 2}
                y1={yForDb(db)}
                y2={yForDb(db)}
                stroke={PREVIEW_GRID}
                strokeWidth={db === 0 ? 1 : 0.75}
                strokeOpacity={db === 0 ? 0.9 : 0.5}
              />
            ))}
            {bands.map((b, i) => {
              const x = GUTTER + i * barW + pad;
              const bw = Math.max(1, barW - pad * 2);
              const top = yForDb(b.db);
              return (
                <Rect
                  key={`${b.hz}-${i}`}
                  x={x}
                  y={top}
                  width={bw}
                  height={Math.max(1, plotBottom - top)}
                  fill="url(#savedRtaBar)"
                  fillOpacity={0.96}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>
      {/* dB gutter — the window this record is drawn against. */}
      {win != null &&
        rules.map((db) => <TickLabel key={db} text={String(db)} x={3} y={yForDb(db) - 6} />)}
      {/* Frequency labels under the bands they belong to. */}
      {win != null &&
        barW > 0 &&
        labels.map((l) => (
          <TickLabel
            key={l.text}
            text={l.text}
            x={Math.max(GUTTER, Math.min(w - 18, GUTTER + (l.i + 0.5) * barW - 8))}
            y={plotBottom + 1}
          />
        ))}
    </PreviewFrame>
  );
}
