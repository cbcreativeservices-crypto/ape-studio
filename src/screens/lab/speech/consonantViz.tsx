/**
 * Speech & Voice Lab — page 5: a SPECTROGRAM of one syllable per consonant
 * family (redraw 2026-10-14; the old figure was one orange bar on a frequency
 * axis). Time runs left → right, frequency bottom → top, colour is level on
 * the app's heat ramp (black = nothing there, blue quiet → red loud).
 *
 * The audio is real (speechSignals.consonantSyllable: a formant synthesizer
 * plus shaped noise, 24 kHz), analysed the way a phonetics spectrograph does
 * it (14 ms Hann frames, so formants read as horizontal bands; +6 dB/octave
 * pre-emphasis). Cells of the same colour
 * band are merged into one path per band, so the whole picture is ~10 paths.
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { heatColor } from '../../../features/tools/levelColor';
import { SYLLABLE_MS, SYLLABLE_SR, consonantSyllable, spectrogramDb, type ConsonantFamilyId } from '../../../features/speech/speechSignals';
import { ExpandableFigure } from '../kit/ExpandableFigure';

const F = fonts.barlowMedium;
const COLS = 80, ROWS = 40, MAX_HZ = 8000, FLOOR_DB = -60, BUCKETS = 10;

/** Spectrogram cells grouped by colour band: one path string per band. */
export function spectrogramPaths(grid: Float64Array[], x0: number, x1: number, top: number, bottom: number): { color: string; d: string }[] {
  const cw = (x1 - x0) / COLS, rh = (bottom - top) / ROWS;
  const ds: string[] = Array.from({ length: BUCKETS }, () => '');
  for (let r = 0; r < ROWS; r++) {
    const y = bottom - (r + 1) * rh;
    let c = 0;
    while (c < COLS) {
      const t = (grid[r][c] - FLOOR_DB) / -FLOOR_DB;
      const b = Math.min(BUCKETS - 1, Math.floor(t * BUCKETS));
      let e = c + 1;
      while (e < COLS && Math.min(BUCKETS - 1, Math.floor(((grid[r][e] - FLOOR_DB) / -FLOOR_DB) * BUCKETS)) === b) e++;
      if (b >= 1) ds[b] += `M${(x0 + c * cw).toFixed(1)} ${y.toFixed(1)}h${((e - c) * cw + 0.15).toFixed(1)}v${(rh + 0.15).toFixed(2)}h${(-(e - c) * cw - 0.15).toFixed(1)}Z`;
      c = e;
    }
  }
  return ds.map((d, b) => ({ color: heatColor((b + 0.5) / BUCKETS), d })).filter((p) => p.d !== '');
}

export function ConsonantSpectrogram({ family, a11y, controls }: { family: ConsonantFamilyId; a11y: string; controls?: ReactNode }) {
  const W = 340, H = 156, x0 = 30, x1 = 332, top = 30, bottom = 128;
  const data = useMemo(() => {
    const syl = consonantSyllable(family);
    const grid = spectrogramDb(syl.wave, SYLLABLE_SR, COLS, ROWS, MAX_HZ, 14);
    return { syl, paths: spectrogramPaths(grid, x0, x1, top, bottom) };
  }, [family]);
  const tx = (s: number) => x0 + (s / (SYLLABLE_MS / 1000)) * (x1 - x0);
  const fy = (hz: number) => bottom - (hz / MAX_HZ) * (bottom - top);
  return (
    <ExpandableFigure aspect={W / H} title="SPECTROGRAM" controls={controls} render={(w, h) => (
      <View accessible accessibilityLabel={a11y} style={{ width: w, height: h }}>
        <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          <Rect x={x0} y={top} width={x1 - x0} height={bottom - top} fill="#000" />
          {data.paths.map((p) => <Path key={p.color} d={p.d} fill={p.color} />)}
          {/* frequency guides, behind nothing important: faint */}
          {[2000, 4000, 6000].map((f) => <Line key={f} x1={x0} y1={fy(f)} x2={x1} y2={fy(f)} stroke="rgba(255,255,255,0.08)" strokeDasharray="2,3" />)}
          {[0, 2000, 4000, 6000, 8000].map((f) => (
            <SvgText key={f} x={x0 - 3} y={fy(f) + (f === 8000 ? 6 : f === 0 ? 0 : 3)} fontSize={10} fill={colors.textMuted} textAnchor="end" fontFamily={F}>{f === 0 ? '0' : `${f / 1000}k`}</SvgText>
          ))}
          {/* the parts of the syllable */}
          {data.syl.segments.map((s, i) => {
            const a = tx(s.t0) + 1, b = tx(s.t1) - 1;
            return (
              <G2 key={s.label} a={a} b={b} label={s.label} last={i === data.syl.segments.length - 1} />
            );
          })}
          {[0, 100, 200, 300, 400].map((t, i, arr) => (
            <SvgText key={t} x={tx(t / 1000)} y={H - 14} fontSize={10} fill={colors.textMuted} textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'} fontFamily={F}>{i === arr.length - 1 ? `${t} ms` : `${t}`}</SvgText>
          ))}
          <SvgText x={x0} y={H - 3} fontSize={10} fill={colors.textMuted} fontFamily={F}>{`"${data.syl.text.toUpperCase()}" · black = silence · blue → red = quiet → loud`}</SvgText>
          <SvgText x={4} y={12} fontSize={10} fill={colors.textMuted} fontFamily={F}>Hz</SvgText>
        </Svg>
      </View>
    )} />
  );
}

/** A labelled span over one part of the syllable. */
function G2({ a, b, label }: { a: number; b: number; label: string; last: boolean }) {
  const mid = (a + b) / 2;
  return (
    <>
      <Line x1={a} y1={24} x2={b} y2={24} stroke={colors.textMuted} strokeWidth={0.8} />
      <Line x1={a} y1={21.5} x2={a} y2={26.5} stroke={colors.textMuted} strokeWidth={0.8} />
      <Line x1={b} y1={21.5} x2={b} y2={26.5} stroke={colors.textMuted} strokeWidth={0.8} />
      <SvgText x={mid} y={18} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>{label}</SvgText>
    </>
  );
}
