/**
 * Mastering Lab — the GEAR on the glass (art fix 2026-10-16, after the lab-art
 * grading: "gear drawn as generic icons … iconic gear (squares for monitors,
 * a laptop glyph, empty slot placeholders)").
 *
 * Everything here is drawn as the equipment a mastering engineer sits at, at
 * its own TRUE proportions:
 *   • rack faceplates — 1U (482.6 × 44.45 mm, 10.86 : 1) and 2U (482.6 ×
 *     88.9 mm, 5.43 : 1), ears with their slots, the knobs at the lab's REAL
 *     settings (the same numbers the renderer runs) and the value printed
 *     beside each, the way a recall sheet writes it;
 *   • a loudness meter: short-term trace, integrated, short-term max, true
 *     peak against the −1 dBTP line (over it reads peak red #ff5a48);
 *   • the monitoring path: a 16 : 9 display running the DAW, a half-rack 1U
 *     converter, a desktop monitor controller, a 2U power amplifier, 1 : 1.6
 *     two-way monitors — joined by their own cables (USB, balanced line,
 *     speaker pair), never merged.
 * Knobs, buttons and the house palette come from the Advanced Mixing art
 * (mixing/advArt) so the two labs draw one studio.
 *
 * TEXT: every word is ≥ FONT_S (10.5 design units, ≥ 9 pt on a phone at the
 * stages' 360-unit width); callers pass `ts` (the short-phone boost) and it
 * scales every font here. Legends sit on the gear where the maker prints
 * them; nothing is written across a line or an object it does not belong to.
 */
import type { ReactNode } from 'react';
import { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, levelColorForDb } from '../../../features/tools/levelColor';
import { Btn, Knob, Monitor } from '../mixing/advArt';
import { PEAK_RED } from './kit';
import { GEAR_DRAW_W, TP_WARN_DBTP, type LoudnessHistory, type PathDevice } from './masteringEngine';

/** The smallest word (design units): the stages' FONT_S. */
const FS = 10.5;

/** 19-inch rack: panel width ÷ height for 1U and 2U. */
export const RACK_1U = 482.6 / 44.45;
export const RACK_2U = 482.6 / 88.9;

const PANEL = '#1d1f25';
const PANEL_OFF = '#141519';
const EDGE = '#4a4e57';
const INK = '#a6a6ad';
const DIM = '#6f737d';
const AMBER = colors.amber;

export type FaceCell = { name: string; val: string; frac: number; stepped?: boolean };
export type FaceStyle = 'digital' | 'analog';

function Ears({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const ew = w * 0.045;
  const slot = (cx: number, cy: number) => <Rect key={`${cx}-${cy}`} x={cx - ew * 0.24} y={cy - 1.3} width={ew * 0.48} height={2.6} rx={1.3} fill="#07080a" stroke="#3a3e46" strokeWidth={0.4} />;
  const holes = h > 40 ? [y + h * 0.2, y + h * 0.8] : [y + h / 2];
  return (
    <G>
      <Rect x={x} y={y} width={ew} height={h} fill="#26282e" />
      <Rect x={x + w - ew} y={y} width={ew} height={h} fill="#26282e" />
      {holes.map((cy) => slot(x + ew / 2, cy))}
      {holes.map((cy) => slot(x + w - ew / 2, cy))}
    </G>
  );
}

/**
 * One rack processor, face-on. `units` 1 → knob with its legend and value
 * stacked to its right; 2 → legend above the knob, value under it. The title
 * block carries the maker-style name and the BYPASS button (lit red when the
 * unit is bypassed — then the panel goes dark and the values read "—").
 * `meter` is a gain-reduction LED row (1U) or column (2U), lit to `db`.
 */
export function RackFace({
  x,
  y,
  w,
  units,
  title,
  cells,
  meter,
  bypassed,
  style = 'digital',
  ts = 1,
}: {
  x: number;
  y: number;
  w: number;
  units: 1 | 2;
  title: readonly string[];
  cells: readonly FaceCell[];
  meter?: { label: string; db: number; steps: readonly number[] } | null;
  bypassed?: boolean;
  style?: FaceStyle;
  ts?: number;
}) {
  const h = w / (units === 1 ? RACK_1U : RACK_2U);
  const ew = w * 0.045;
  const ix0 = x + ew + 3;
  const ix1 = x + w - ew - 3;
  const fs = FS * ts;
  const on = !bypassed;
  const panel = style === 'analog' ? (on ? '#34404c' : '#252c34') : on ? PANEL : PANEL_OFF;
  const cap = style === 'analog' ? (on ? '#d8cfb4' : '#6e6a5e') : on ? '#b8892b' : '#3c3a33';
  // the title block holds the name AND the BYP legend beside its button
  const titleW = Math.max(9 + 3 * fs * 0.55, ...title.map((t) => t.length * fs * 0.5)) + 6;
  const meterW = meter ? (units === 1 ? 54 : 30) : 0;
  const cellsX0 = ix0 + titleW + 4;
  const cellsX1 = ix1 - meterW - (meter ? 4 : 0);
  const cw = (cellsX1 - cellsX0) / Math.max(1, cells.length);
  const cy = y + h / 2;
  const r = units === 1 ? Math.min(7.5, h * 0.24) : Math.min(10, h * 0.19);
  return (
    <G>
      <Rect x={x + 1} y={y + 1.5} width={w} height={h} rx={1.5} fill="#000" opacity={0.45} />
      <Rect x={x} y={y} width={w} height={h} rx={1.5} fill={panel} stroke={on ? EDGE : '#2a2d33'} strokeWidth={0.8} />
      <Line x1={x + ew} y1={y + 0.9} x2={x + w - ew} y2={y + 0.9} stroke="#fff" strokeWidth={0.5} opacity={0.1} />
      <Ears x={x} y={y} w={w} h={h} />
      {/* the title block: the unit's name and its bypass button */}
      {(units === 1 ? title.slice(0, 1) : title).map((t, i) => (
        <SvgText key={t} x={ix0} y={units === 1 ? cy - 2 : y + 15 * ts + i * (fs + 1)} fontSize={fs} fill={on ? INK : DIM} fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>
          {t}
        </SvgText>
      ))}
      <Btn x={ix0} y={units === 1 ? cy + 3 : y + h - 13 * ts} s={6} lit={on ? null : PEAK_RED} />
      <SvgText x={ix0 + 9} y={units === 1 ? cy + 9.5 * ts : y + h - 7 * ts} fontSize={fs} fill={on ? DIM : PEAK_RED} fontFamily={fonts.oswaldMedium}>
        BYP
      </SvgText>
      {cells.map((c, k) => {
        const kx = units === 1 ? cellsX0 + k * cw + r + 2 : cellsX0 + k * cw + cw / 2;
        const ky = units === 1 ? cy : y + h * 0.5 + 1;
        return (
          <G key={c.name}>
            <Knob cx={kx} cy={ky} r={r} frac={c.frac} cap={cap} dim={!on} detent={c.stepped} />
            {units === 1 ? (
              <G>
                <SvgText x={kx + r + 4} y={cy - 2} fontSize={fs} fill={on ? INK : DIM} fontFamily={fonts.oswaldMedium}>{c.name}</SvgText>
                <SvgText x={kx + r + 4} y={cy + 9.5 * ts} fontSize={fs} fill={on ? AMBER : DIM} fontFamily={fonts.mono}>{on ? c.val : '—'}</SvgText>
              </G>
            ) : (
              <G>
                <SvgText x={kx} y={ky - r - 5} fontSize={fs} fill={on ? INK : DIM} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{c.name}</SvgText>
                <SvgText x={kx} y={ky + r + 4 + fs * 0.8} fontSize={fs} fill={on ? AMBER : DIM} textAnchor="middle" fontFamily={fonts.mono}>{on ? c.val : '—'}</SvgText>
              </G>
            )}
          </G>
        );
      })}
      {meter ? <GrLeds x={ix1 - meterW} y={y} h={h} w={meterW} units={units} meter={meter} on={on} fs={fs} /> : null}
    </G>
  );
}

/** A gain-reduction LED meter: lit to `db` on its own scale, each LED on the
 *  house amplitude ramp (GR 12 dB = the top of the ramp). */
function GrLeds({ x, y, w, h, units, meter, on, fs }: { x: number; y: number; w: number; h: number; units: 1 | 2; meter: { label: string; db: number; steps: readonly number[] }; on: boolean; fs: number }) {
  const n = meter.steps.length;
  if (units === 1) {
    const lw = (w - 2) / n;
    return (
      <G>
        <SvgText x={x} y={y + h / 2 - 2} fontSize={fs} fill={on ? INK : DIM} fontFamily={fonts.oswaldMedium}>{meter.label}</SvgText>
        {meter.steps.map((s, i) => {
          const lit = on && meter.db >= s;
          return <Rect key={s} x={x + i * lw} y={y + h / 2 + 2} width={lw - 1.2} height={5} rx={0.8} fill={lit ? levelColor(Math.min(1, s / 12)) : '#2a2c33'} />;
        })}
      </G>
    );
  }
  const top = y + 8;
  const bot = y + h - 16;
  const lh = (bot - top) / n;
  return (
    <G>
      {meter.steps.map((s, i) => {
        const lit = on && meter.db >= s;
        return <Rect key={s} x={x + 8} y={top + i * lh} width={12} height={lh - 1.2} rx={0.8} fill={lit ? levelColor(Math.min(1, s / 12)) : '#2a2c33'} />;
      })}
      <SvgText x={x + 14} y={y + h - 5} fontSize={fs} fill={on ? INK : DIM} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{meter.label}</SvgText>
    </G>
  );
}

const logFrac = (v: number, lo: number, hi: number) => Math.max(0, Math.min(1, Math.log(v / lo) / Math.log(hi / lo)));
const linFrac = (v: number, lo: number, hi: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
const sgn = (v: number, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;

/** The lab's peak limiter (masteringEngine.peakLimiter), 1U: INPUT drive,
 *  CEILING, RELEASE, and a GR LED row lit to the deepest reduction. */
export function LimiterFace({ x, y, w, driveDb, ceilingDb, releaseMs, maxGrDb, bypassed, ts }: { x: number; y: number; w: number; driveDb: number; ceilingDb: number; releaseMs: number; maxGrDb: number; bypassed?: boolean; ts?: number }) {
  return (
    <RackFace
      x={x}
      y={y}
      w={w}
      units={1}
      title={['LIMITER']}
      bypassed={bypassed}
      ts={ts}
      cells={[
        { name: 'INPUT', val: `${sgn(driveDb)} dB`, frac: linFrac(driveDb, 0, 18) },
        { name: 'CEILING', val: `${sgn(ceilingDb)} dB`, frac: linFrac(ceilingDb, -12, 0) },
        { name: 'RELEASE', val: `${Math.round(releaseMs)} ms`, frac: logFrac(releaseMs, 1, 1000) },
      ]}
      meter={{ label: 'GR', db: maxGrDb, steps: [1, 2, 3, 4, 6, 8, 10, 12] }}
    />
  );
}

/** The lab's tilt EQ as a 1U mastering processor (masteringEngine.tiltEq:
 *  RBJ shelves, 200 Hz down by tilt/2 and 2.5 kHz up by tilt/2, Q 0.7), its
 *  OUTPUT trim, and the safety limiter that holds any boost (SAFETY_CEILING). */
export function TiltEqFace({ x, y, w, tiltDb, trimDb, ceilingDb, bypassed, ts }: { x: number; y: number; w: number; tiltDb: number; trimDb: number; ceilingDb: number | null; bypassed?: boolean; ts?: number }) {
  const lf = -tiltDb / 2;
  const hf = tiltDb / 2;
  const cells: FaceCell[] = [
    { name: 'LF 200 Hz', val: `${sgn(lf, 2)} dB`, frac: linFrac(lf, -6, 6), stepped: true },
    { name: 'HF 2.5 kHz', val: `${sgn(hf, 2)} dB`, frac: linFrac(hf, -6, 6), stepped: true },
    { name: 'OUTPUT', val: `${sgn(trimDb)} dB`, frac: linFrac(trimDb, -6, 6), stepped: true },
  ];
  if (ceilingDb != null) cells.push({ name: 'SAFETY', val: `${sgn(ceilingDb)} dB`, frac: linFrac(ceilingDb, -12, 0) });
  return <RackFace x={x} y={y} w={w} units={1} title={['EQ']} bypassed={bypassed} ts={ts} cells={cells} />;
}

/* ── the loudness meter ──────────────────────────────────────────────────── */

const LU_LO = -36;
const LU_HI = 0;
const TP_LO = -24;
const TP_HI = 3;

/**
 * A loudness meter as the session sees it after a pass of the whole song:
 * the SHORT-TERM trace (3 s) on the programme's real time base, the
 * INTEGRATED value as a dashed line (its number in the right gutter, beside
 * the line, never on it), bars for short-term max and integrated on the LUFS
 * scale, and a TRUE-PEAK bar on its own dBTP scale with the −1 dBTP line —
 * the bar and its number turn peak red above it.
 */
export function LoudnessMeterFace({ x, y, w, h, hist, ts = 1 }: { x: number; y: number; w: number; h: number; hist: LoudnessHistory | null; ts?: number }) {
  const fs = FS * ts;
  const barTop = y + 26 * ts;
  const barBot = y + h - 30 * ts;
  const yLu = (v: number) => barBot - linFrac(v, LU_LO, LU_HI) * (barBot - barTop);
  const yTp = (v: number) => barBot - linFrac(v, TP_LO, TP_HI) * (barBot - barTop);
  const bw = 16;
  const bx = [x + 30, x + 52, x + 108];
  const plotX0 = x + 150;
  const plotX1 = x + w - 44;
  const tpOver = hist != null && hist.truePeakDb > TP_WARN_DBTP;
  const tpTint = hist == null ? DIM : tpOver ? PEAK_RED : levelColorForDb(hist.truePeakDb, TP_LO, 0);
  const bar = (bxx: number, v: number | null, yOf: (v: number) => number, tint: string) => (
    <G>
      <Rect x={bxx} y={barTop} width={bw} height={barBot - barTop} rx={1.5} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {v != null && Number.isFinite(v) ? <Rect x={bxx + 1.5} y={yOf(v)} width={bw - 3} height={Math.max(0, barBot - 1 - yOf(v))} rx={1} fill={tint} /> : null}
    </G>
  );
  const stPts = hist
    ? hist.st
        .map((v, i) => (v == null ? null : { x: plotX0 + ((i + 1) / hist.st.length) * (plotX1 - plotX0), y: yLu(v) }))
        .filter((p): p is { x: number; y: number } => p != null)
    : [];
  return (
    <G>
      {/* the meter's own face */}
      <Rect x={x} y={y} width={w} height={h} rx={5} fill="#121318" stroke="#30343c" strokeWidth={0.9} />
      <SvgText x={x + 8} y={y + 15 * ts} fontSize={fs} fill={INK} fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>LOUDNESS METER</SvgText>
      <SvgText x={x + w - 8} y={y + 15 * ts} fontSize={fs} fill={DIM} textAnchor="end" fontFamily={fonts.mono}>BS.1770-style estimate</SvgText>
      {/* LUFS scale (left of the two loudness bars) */}
      {[-36, -24, -12, 0].map((v) => (
        <SvgText key={v} x={bx[0] - 4} y={yLu(v) + 3.5} fontSize={fs} fill={DIM} textAnchor="end" fontFamily={fonts.mono}>{v === 0 ? '0' : `${v}`.replace('-', '−')}</SvgText>
      ))}
      {bar(bx[0], hist ? hist.stMax : null, yLu, hist ? levelColorForDb(hist.stMax, LU_LO, LU_HI) : DIM)}
      {bar(bx[1], hist ? hist.integrated : null, yLu, hist ? levelColorForDb(hist.integrated, LU_LO, LU_HI) : DIM)}
      <SvgText x={bx[0] + bw / 2} y={barBot + 12 * ts} fontSize={fs} fill={INK} textAnchor="middle" fontFamily={fonts.oswaldMedium}>S</SvgText>
      <SvgText x={bx[1] + bw / 2} y={barBot + 12 * ts} fontSize={fs} fill={INK} textAnchor="middle" fontFamily={fonts.oswaldMedium}>I</SvgText>
      {/* true peak, its own dBTP scale, the −1 line */}
      {bar(bx[2], hist ? hist.truePeakDb : null, yTp, tpTint)}
      <Line x1={bx[2] - 3} y1={yTp(TP_WARN_DBTP)} x2={bx[2] + bw + 3} y2={yTp(TP_WARN_DBTP)} stroke={PEAK_RED} strokeWidth={1.2} />
      {[-24, -12, -6, 0].map((v) => (
        <SvgText key={v} x={bx[2] - 5} y={yTp(v) + 3.5} fontSize={fs} fill={DIM} textAnchor="end" fontFamily={fonts.mono}>{v === 0 ? '0' : `${v}`.replace('-', '−')}</SvgText>
      ))}
      <SvgText x={bx[2] + bw + 5} y={yTp(TP_WARN_DBTP) + 3.5} fontSize={fs} fill={PEAK_RED} fontFamily={fonts.mono}>−1</SvgText>
      <SvgText x={bx[2] + bw / 2} y={barBot + 12 * ts} fontSize={fs} fill={INK} textAnchor="middle" fontFamily={fonts.oswaldMedium}>TP</SvgText>
      {/* the short-term history on the programme's time base */}
      <Rect x={plotX0} y={barTop} width={plotX1 - plotX0} height={barBot - barTop} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {[-24, -12].map((v) => <Line key={v} x1={plotX0} y1={yLu(v)} x2={plotX1} y2={yLu(v)} stroke="#1a1e26" strokeWidth={0.6} />)}
      {hist ? (
        <G>
          {stPts.slice(1).map((p, i) => (
            <Line key={i} x1={stPts[i].x} y1={stPts[i].y} x2={p.x} y2={p.y} stroke={levelColorForDb(LU_LO + ((barBot - p.y) / (barBot - barTop)) * (LU_HI - LU_LO), LU_LO, LU_HI)} strokeWidth={1.8} strokeLinecap="round" />
          ))}
          <Line x1={plotX0} y1={yLu(hist.integrated)} x2={plotX1} y2={yLu(hist.integrated)} stroke={INK} strokeWidth={0.9} strokeDasharray="3,2" />
          <SvgText x={plotX1 + 4} y={yLu(hist.integrated) + 3.5} fontSize={fs} fill={INK} fontFamily={fonts.mono}>I</SvgText>
        </G>
      ) : (
        <SvgText x={(plotX0 + plotX1) / 2} y={(barTop + barBot) / 2 + 4} fontSize={fs} fill={DIM} textAnchor="middle" fontFamily={fonts.mono}>▶ DRAW MIX</SvgText>
      )}
      <SvgText x={plotX0} y={barBot + 12 * ts} fontSize={fs} fill={DIM} fontFamily={fonts.mono}>0 s</SvgText>
      <SvgText x={plotX1} y={barBot + 12 * ts} fontSize={fs} fill={DIM} textAnchor="end" fontFamily={fonts.mono}>{hist ? `${Math.round(hist.seconds)} s` : ''}</SvgText>
      <SvgText x={(plotX0 + plotX1) / 2} y={barBot + 12 * ts} fontSize={fs} fill={DIM} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SHORT-TERM, 3 s</SvgText>
      {/* the numbers, as the meter prints them */}
      <SvgText x={x + 8} y={y + h - 6 * ts} fontSize={fs} fill={hist ? AMBER : DIM} fontFamily={fonts.mono}>
        {hist ? `I ${fmtDb(hist.integrated)} LUFS · S max ${fmtDb(hist.stMax)}` : 'I — LUFS · S max —'}
      </SvgText>
      <SvgText x={x + w - 8} y={y + h - 6 * ts} fontSize={fs} fill={tpTint} textAnchor="end" fontFamily={fonts.mono}>
        {hist ? `TP ${fmtDb(hist.truePeakDb)} dBTP` : 'TP —'}
      </SvgText>
    </G>
  );
}

const fmtDb = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;

/* ── the monitoring path ─────────────────────────────────────────────────── */

/** Each device's drawn height for its width (its true aspect). */
export function gearDrawH(kind: PathDevice): number {
  const w = GEAR_DRAW_W[kind];
  switch (kind) {
    case 'daw':
      return w * (9 / 16) + 4 + 9; // the screen + bezel, then the stand
    case 'dac':
      return w / 4.9; // half-rack 1U, 216 × 44 mm
    case 'monitorCtl':
      return w * 0.62; // desktop controller seen from the front and a little above
    case 'amp':
      return w / RACK_2U + 0; // 2U
    default:
      return w * 1.6; // two-way monitor, 1 : 1.6
  }
}

/** One device of the monitoring path, its top-left at (x, y). */
export function GearFront({ kind, x, y }: { kind: PathDevice; x: number; y: number }) {
  const w = GEAR_DRAW_W[kind];
  const h = gearDrawH(kind);
  if (kind === 'daw') {
    // A 16 : 9 display on a stand, the DAW's arrange window on screen:
    // transport bar, five track lanes with their clips, the playhead.
    const sh = w * (9 / 16) + 4;
    const sx = x + 2;
    const sy = y + 2;
    const sw = w - 4;
    const ssh = sh - 4;
    const lanes = 5;
    const lh = (ssh - 5) / lanes;
    const clips: [number, number, string][] = [[0.05, 0.6, '#3e6fb8'], [0.05, 0.9, '#2f8f63'], [0.2, 0.75, '#b8892b'], [0.05, 0.45, '#8a4fb0'], [0.35, 0.95, '#c4372a']];
    return (
      <G>
        <Rect x={x + w / 2 - 3} y={y + sh} width={6} height={6} fill="#2a2d34" />
        <Rect x={x + w / 2 - 12} y={y + sh + 6} width={24} height={3} rx={1.2} fill="#33363e" />
        <Rect x={x} y={y} width={w} height={sh} rx={2} fill="#17181c" stroke="#4a4e57" strokeWidth={0.8} />
        <Rect x={sx} y={sy} width={sw} height={ssh} fill="#0c0d10" />
        <Rect x={sx} y={sy} width={sw} height={4} fill="#22252c" />
        {Array.from({ length: lanes }, (_, i) => {
          const ly = sy + 5 + i * lh;
          const [a, b, c] = clips[i];
          return (
            <G key={i}>
              <Rect x={sx} y={ly} width={7} height={lh - 0.8} fill="#1d2027" />
              <Rect x={sx + 8 + a * (sw - 9)} y={ly + 0.5} width={(b - a) * (sw - 9)} height={lh - 1.8} rx={0.6} fill={c} opacity={0.75} />
              <Rect x={sx + 8 + a * (sw - 9)} y={ly + 0.5} width={(b - a) * (sw - 9)} height={1.2} fill={c} />
            </G>
          );
        })}
        <Line x1={sx + 8 + 0.42 * (sw - 9)} y1={sy + 4} x2={sx + 8 + 0.42 * (sw - 9)} y2={sy + ssh} stroke="#e8e8e8" strokeWidth={0.6} />
      </G>
    );
  }
  if (kind === 'dac') {
    // Half-rack 1U converter: power, sample-rate LEDs, LOCK, the output level.
    return (
      <G>
        <Rect x={x + 0.8} y={y + 1.2} width={w} height={h} rx={1.2} fill="#000" opacity={0.45} />
        <Rect x={x} y={y} width={w} height={h} rx={1.2} fill="#24262c" stroke="#4a4e57" strokeWidth={0.7} />
        <Circle cx={x + 5} cy={y + h / 2} r={1.6} fill={colors.green} />
        {[0, 1, 2].map((i) => <Rect key={i} x={x + 12 + i * 6} y={y + h / 2 - 1.2} width={3.6} height={2.4} rx={0.6} fill={i === 1 ? AMBER : '#3a3c44'} />)}
        <Rect x={x + 32} y={y + h / 2 - 1.2} width={3.6} height={2.4} rx={0.6} fill={colors.green} />
        <Knob cx={x + w - 9} cy={y + h / 2} r={3.8} frac={0.7} cap="#8d9099" />
      </G>
    );
  }
  if (kind === 'monitorCtl') {
    // Desktop monitor controller: the top panel (seen from a little above)
    // with the big level knob, source and speaker buttons; the front lip.
    const top = h * 0.72;
    return (
      <G>
        <Path d={`M${x + 4} ${y} L${x + w - 4} ${y} L${x + w} ${y + top} L${x} ${y + top} Z`} fill="#26282e" stroke="#4a4e57" strokeWidth={0.7} />
        <Rect x={x} y={y + top} width={w} height={h - top} rx={1} fill="#1b1d22" stroke="#4a4e57" strokeWidth={0.7} />
        <Circle cx={x + w * 0.62} cy={y + top * 0.52} r={top * 0.36} fill="#000" opacity={0.4} />
        <Knob cx={x + w * 0.62} cy={y + top * 0.48} r={top * 0.34} frac={0.55} cap="#8d9099" />
        {[0, 1, 2].map((i) => <Btn key={i} x={x + 6} y={y + 4 + i * 6.5} s={4.6} lit={i === 0 ? colors.green : null} />)}
        {[0, 1].map((i) => <Btn key={i} x={x + 13} y={y + 4 + i * 6.5} s={4.6} lit={i === 0 ? AMBER : null} />)}
        <Circle cx={x + w - 5} cy={y + top + (h - top) / 2} r={1.1} fill={colors.green} />
      </G>
    );
  }
  if (kind === 'amp') {
    // 2U stereo power amplifier: rack handles, two input attenuators, the
    // signal / clip LEDs, the power switch.
    return (
      <G>
        <Rect x={x + 0.8} y={y + 1.2} width={w} height={h} rx={1} fill="#000" opacity={0.45} />
        <Rect x={x} y={y} width={w} height={h} rx={1} fill="#202227" stroke="#4a4e57" strokeWidth={0.7} />
        {[x + 4.5, x + w - 4.5].map((hx) => <Rect key={hx} x={hx - 1.3} y={y + 1.5} width={2.6} height={h - 3} rx={1.2} fill="#5a5e68" stroke="#2a2c33" strokeWidth={0.4} />)}
        <Knob cx={x + 15} cy={y + h / 2} r={4.2} frac={0.8} cap="#8d9099" detent />
        <Knob cx={x + 28} cy={y + h / 2} r={4.2} frac={0.8} cap="#8d9099" detent />
        {[0, 1].map((ch) => [0, 1, 2].map((i) => <Rect key={`${ch}${i}`} x={x + 38 + i * 5} y={y + 3.5 + ch * 4} width={3.4} height={2.2} rx={0.5} fill={i < 2 ? colors.green : '#3a2020'} />))}
        <Rect x={x + w - 18} y={y + h / 2 - 3} width={7} height={6} rx={1} fill="#111215" stroke="#5a5e68" strokeWidth={0.5} />
        <Rect x={x + w - 16.5} y={y + h / 2 - 2} width={4} height={2.4} rx={0.4} fill="#c4372a" />
      </G>
    );
  }
  // A two-way monitor face-on (advArt Monitor, 1 : 1.6); the active one has
  // its power LED on the baffle — the amplifier lives in the cabinet.
  return (
    <G>
      <Monitor x={x} y={y} w={w} />
      {kind === 'active' ? <Circle cx={x + w / 2} cy={y + w * 1.6 - 3} r={1.1} fill={colors.green} /> : null}
    </G>
  );
}

export const GEAR_NAME: Record<PathDevice, string> = { daw: 'DAW', dac: 'DAC', monitorCtl: 'MON CTL', amp: 'POWER AMP', passive: 'PASSIVE', active: 'ACTIVE' };

/** The cable between two neighbouring devices, by what it carries. USB
 *  (data) leaves the DAW only into a device that converts it — the D/A
 *  converter or a monitor controller with one built in. Anywhere else the
 *  DAW box stands for computer + interface, whose analog output is a line
 *  cable (MA-02, wiring 2026-10-20: never USB into an amp or a monitor). */
function cableFor(a: PathDevice, b: PathDevice): 'usb' | 'line' | 'speaker' {
  if (a === 'daw') return b === 'dac' || b === 'monitorCtl' ? 'usb' : 'line';
  if (a === 'amp' && b === 'passive') return 'speaker';
  return 'line';
}

/**
 * The learner's chain drawn as gear: each device at its true aspect, its
 * name under it, its own cable to the next (USB grey, balanced line blue-
 * grey, the speaker pair red and black). The `ghost` (the DEVICE key's
 * choice, not yet connected) is drawn faint after the chain with its name in
 * amber; an empty chain draws only the ghost.
 */
export function ChainArt({ chain, ghost, xs, cy, ts = 1 }: { chain: readonly PathDevice[]; ghost?: PathDevice; xs: readonly number[]; cy: number; ts?: number }) {
  const fs = FS * ts;
  const all = ghost ? [...chain, ghost] : [...chain];
  const nameY = cy + 34 + fs * 0.7;
  const out: ReactNode[] = [];
  all.forEach((k, i) => {
    const x = xs[i];
    const w = GEAR_DRAW_W[k];
    const h = gearDrawH(k);
    const isGhost = ghost != null && i === chain.length;
    out.push(
      <G key={`g${i}`} opacity={isGhost ? 0.4 : 1}>
        <GearFront kind={k} x={x} y={cy - h / 2} />
      </G>,
    );
    // The ghost's label is two short lines ("NEXT ›" over the name), so it
    // never runs past the glass edge or into its neighbour's name.
    out.push(
      <SvgText key={`n${i}`} x={x + w / 2} y={nameY} fontSize={fs} fill={isGhost ? AMBER : INK} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
        {isGhost ? 'NEXT ›' : GEAR_NAME[k]}
      </SvgText>,
    );
    if (isGhost) {
      out.push(
        <SvgText key={`m${i}`} x={x + w / 2} y={nameY + fs + 1} fontSize={fs} fill={AMBER} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
          {GEAR_NAME[k]}
        </SvgText>,
      );
    }
    if (i > 0 && !isGhost) {
      const a = all[i - 1];
      const x0 = xs[i - 1] + GEAR_DRAW_W[a];
      const x1 = x;
      const kind = cableFor(a, k);
      if (kind === 'speaker') {
        out.push(
          <G key={`c${i}`}>
            <Line x1={x0} y1={cy - 1.4} x2={x1} y2={cy - 1.4} stroke="#c4372a" strokeWidth={1.3} />
            <Line x1={x0} y1={cy + 1.4} x2={x1} y2={cy + 1.4} stroke="#1a1a1c" strokeWidth={1.3} />
            <Line x1={x0} y1={cy + 1.4} x2={x1} y2={cy + 1.4} stroke="#6a6d75" strokeWidth={0.4} />
          </G>,
        );
      } else {
        out.push(<Line key={`c${i}`} x1={x0} y1={cy} x2={x1} y2={cy} stroke={kind === 'usb' ? '#8a8e98' : '#6f8fb8'} strokeWidth={1.4} />);
      }
      out.push(<Polygon key={`a${i}`} points={`${x1},${cy} ${x1 - 3.6},${cy - 2.4} ${x1 - 3.6},${cy + 2.4}`} fill={kind === 'speaker' ? '#c4372a' : kind === 'usb' ? '#8a8e98' : '#6f8fb8'} />);
    }
  });
  return <G>{out}</G>;
}
