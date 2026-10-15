/**
 * Speech & Voice Lab — the measurement-style charts (redraw 2026-10-14, owner:
 * "the whole speech lab's animations all need upgrading to higher standards").
 *
 *  • TraceSvg / TraceChart — a WAVEFORM the way a DAW draws one: real audio at
 *    a real sample rate (speechSignals), min/max per column as one filled
 *    envelope, painted by the app's symmetric amplitude ramp (blue mid line →
 *    red at ±full scale), with a millisecond time axis.
 *  • SpectrumSvg / SpectrumBars — an analyser-style spectrum in dB (relative,
 *    48 dB window) on a log-frequency axis. Each bar is painted by the vertical
 *    LOUDNESS ramp so its TOP shows its level, matching the ramp-coloured dB
 *    scale (owner standard 2026-08-05). When the data changes the bars glide to
 *    the new shape on the UI thread (one animated path; reduced motion = jump).
 */
import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { LOUDNESS_STOPS, WAVE_LEVEL_STOPS, levelColor } from '../../../features/tools/levelColor';
import { useAnimationsAllowed } from '../../../features/settings/a11y';
import { ExpandableFigure } from '../kit/ExpandableFigure';

const F = fonts.barlowMedium;
const APath = Animated.createAnimatedComponent(Path);

export function ChartTitle({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{children}</Text>;
}

/* ── waveform ──────────────────────────────────────────────────────────── */

/** Per-column [min, max] of a signal (the DAW overview). */
export function columnsMinMax(x: Float64Array, cols: number): { lo: Float64Array; hi: Float64Array } {
  const lo = new Float64Array(cols), hi = new Float64Array(cols);
  for (let c = 0; c < cols; c++) {
    const a = Math.floor((c * x.length) / cols), b = Math.max(a + 1, Math.floor(((c + 1) * x.length) / cols));
    let mn = Infinity, mx = -Infinity;
    for (let i = a; i < b && i < x.length; i++) { mn = Math.min(mn, x[i]); mx = Math.max(mx, x[i]); }
    lo[c] = mn === Infinity ? 0 : mn;
    hi[c] = mx === -Infinity ? 0 : mx;
  }
  return { lo, hi };
}

function msStep(durMs: number): number {
  return durMs <= 40 ? 5 : durMs <= 120 ? 20 : 50;
}

/** The waveform drawing alone at (w, h) — for a page that swaps drawings in
 *  ONE ExpandableFigure (the problem simulator). */
export function TraceSvg({ wave, durMs, height = 120, a11y, w, h }: { wave: Float64Array; durMs: number; height?: number; a11y: string; w: number; h: number }) {
  const W = 340, H = height, x0 = 10, x1 = W - 10, top = 16, bottom = H - 17, mid = (top + bottom) / 2, amp = (bottom - top) / 2;
  const gid = `trace${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const d = useMemo(() => {
    const cols = Math.round(x1 - x0);
    const { lo, hi } = columnsMinMax(wave, cols);
    const minT = 0.35 / amp; // a silent column still draws a hairline
    let top_ = '', bot = '';
    for (let c = 0; c < cols; c++) {
      const x = (x0 + c + 0.5).toFixed(1);
      const a = Math.max(hi[c], lo[c] + minT), b = lo[c];
      top_ += `${c === 0 ? 'M' : 'L'}${x} ${(mid - a * amp).toFixed(1)}`;
      bot = `L${x} ${(mid - b * amp).toFixed(1)}` + bot;
    }
    return `${top_}${bot}Z`;
  }, [wave, amp, mid, x0, x1]);
  const step = msStep(durMs);
  const ticks: number[] = [];
  for (let t = 0; t <= durMs + 1e-9; t += step) ticks.push(t);
  const tx = (t: number) => x0 + (t / durMs) * (x1 - x0);
  return (
    <View accessible accessibilityLabel={a11y} style={{ width: w, height: h }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id={gid} x1={0} y1={mid - amp} x2={0} y2={mid + amp} gradientUnits="userSpaceOnUse">
            {WAVE_LEVEL_STOPS.map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {ticks.map((t) => <Line key={`g${t}`} x1={tx(t)} y1={top} x2={tx(t)} y2={bottom} stroke="rgba(255,255,255,0.05)" />)}
        <Line x1={x0} y1={mid - amp} x2={x1} y2={mid - amp} stroke="rgba(255,95,78,0.28)" strokeDasharray="3,3" />
        <Line x1={x0} y1={mid + amp} x2={x1} y2={mid + amp} stroke="rgba(255,95,78,0.28)" strokeDasharray="3,3" />
        {/* ⛔ ZERO LINE BEHIND THE TRACE, faint (owner 2026-10-14). Drawn on top,
            it cut through every big swing (a plosive's air blast) and read as a
            second wave the voice rides on — bad teaching. It is only the
            zero-pressure reference: the waveform is ONE signal swinging around it. */}
        <Line x1={x0} y1={mid} x2={x1} y2={mid} stroke="rgba(255,255,255,0.14)" strokeWidth={0.6} />
        <Path d={d} fill={`url(#${gid})`} stroke={`url(#${gid})`} strokeWidth={0.4} strokeLinejoin="round" />
        {ticks.map((t, i) => (
          <SvgText key={t} x={tx(t)} y={H - 5} fontSize={9} fill={colors.textMuted} textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'} fontFamily={F}>{i === ticks.length - 1 ? `${t} ms` : `${t}`}</SvgText>
        ))}
        <SvgText x={W - 10} y={11} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>dashed = full scale (the loudest a recorder takes)</SvgText>
      </Svg>
    </View>
  );
}

export function TraceChart({ wave, durMs, height = 120, title, a11y, controls }: { wave: Float64Array; durMs: number; height?: number; title?: string; a11y: string; controls?: ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      {title ? <ChartTitle>{title}</ChartTitle> : null}
      <ExpandableFigure aspect={340 / height} title="WAVEFORM" controls={controls} render={(w, h) => <TraceSvg wave={wave} durMs={durMs} height={height} a11y={a11y} w={w} h={h} />} />
    </View>
  );
}

/* ── spectrum ──────────────────────────────────────────────────────────── */

export const SPECTRUM_FLOOR_DB = -48;

export type SpectrumProps = {
  hz: Float64Array;
  /** Linear 0..1 magnitudes (shown in dB re 1) … */
  mag?: Float64Array;
  /** … or dB relative to the display top (0 dB). */
  db?: Float64Array;
  /** A second, faint spectrum drawn behind (the "clean" reference). */
  ghost?: Float64Array;
  ghostDb?: Float64Array;
  /** Highlighted region [lo, hi] Hz. */
  band?: [number, number];
  /** `excess`: energy that is there and should not be (hot tint). `loss`:
   *  energy that is missing (cool tint). */
  bandKind?: 'excess' | 'loss';
  bandLabel?: string;
  height?: number;
  a11y: string;
};

function levels(mag?: Float64Array, db?: Float64Array): number[] {
  const src = db ? Array.from(db) : Array.from(mag ?? [], (m) => 20 * Math.log10(Math.max(1e-6, m)));
  return src.map((v) => Math.max(0, Math.min(1, (v - SPECTRUM_FLOOR_DB) / -SPECTRUM_FLOOR_DB)));
}

function barsD(lv: readonly number[], x0: number, bw: number, top: number, bottom: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < lv.length; i++) {
    if (lv[i] < 0.004) continue;
    const y = bottom - lv[i] * (bottom - top);
    d += 'M' + (x0 + i * bw + 0.5).toFixed(1) + ' ' + bottom.toFixed(1) + 'V' + y.toFixed(1) + 'H' + (x0 + (i + 1) * bw - 0.5).toFixed(1) + 'V' + bottom.toFixed(1) + 'Z';
  }
  return d === '' ? 'M0 0' : d;
}

/** A spectrum as one step outline (bar tops joined), for a reference curve. */
function stepD(lv: readonly number[], x0: number, bw: number, top: number, bottom: number): string {
  const y = (v: number) => (bottom - Math.max(0, v) * (bottom - top)).toFixed(1);
  let d = `M${x0.toFixed(1)} ${y(lv[0])}`;
  for (let i = 0; i < lv.length; i++) d += `V${y(lv[i])}H${(x0 + (i + 1) * bw).toFixed(1)}`;
  return d;
}

export function SpectrumSvg({
  hz, mag, db, ghost, ghostDb, band, bandKind = 'excess', bandLabel, height = 130, a11y, w, h,
}: SpectrumProps & { w: number; h: number }) {
  const W = 340, H = height, x0 = 34, x1 = W - 8, top = 28, bottom = H - 20;
  const n = hz.length;
  const bw = (x1 - x0) / n;
  const lf0 = Math.log(hz[0]), lfn = Math.log(hz[n - 1]);
  const x = (f: number) => x0 + bw * (0.5 + ((Math.log(f) - lf0) / (lfn - lf0)) * (n - 1));
  const gid = `spec${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const target = useMemo(() => levels(mag, db), [mag, db]);
  const ghostLv = useMemo(() => (ghost || ghostDb ? levels(ghost, ghostDb) : null), [ghost, ghostDb]);
  const motionOk = useAnimationsAllowed();
  const shown = useRef(target);
  const from = useSharedValue<number[]>(target);
  const to = useSharedValue<number[]>(target);
  const t = useSharedValue(1);
  const rest = useRef(barsD(target, x0, bw, top, bottom)).current;
  useEffect(() => {
    const prev = shown.current;
    if (prev.length === target.length && prev.every((v, i) => Math.abs(v - target[i]) < 1e-6)) return;
    shown.current = target;
    from.value = prev;
    to.value = target;
    if (!motionOk || prev.length !== target.length) { t.value = 1; return; }
    t.value = 0;
    t.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [target, motionOk, from, to, t]);
  const bars = useAnimatedProps(() => {
    const a = from.value, b = to.value, k = t.value;
    const lv: number[] = [];
    for (let i = 0; i < b.length; i++) lv.push(i < a.length ? a[i] + (b[i] - a[i]) * k : b[i]);
    return { d: barsD(lv, x0, bw, top, bottom) };
  });
  const ticks = [50, 100, 200, 500, 1000, 2000, 5000, 10000].filter((f) => f > hz[0] * 0.95 && f < hz[n - 1] * 1.05);
  const dbTicks = [0, -12, -24, -36, -48];
  const yDb = (v: number) => bottom - ((v - SPECTRUM_FLOOR_DB) / -SPECTRUM_FLOOR_DB) * (bottom - top);
  const bandColor = bandKind === 'loss' ? colors.blue : colors.orange;
  return (
    <View accessible accessibilityLabel={a11y} style={{ width: w, height: h }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* the meter ramp pinned to the dB axis: 0 dB red … floor blue */}
          <LinearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={bottom}>
            {LOUDNESS_STOPS.map((s) => <Stop key={s.pos} offset={s.pos} stopColor={s.color} />)}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {band ? <Rect x={x(band[0])} y={top - 12} width={Math.max(1, Math.min(x1, x(band[1])) - x(band[0]))} height={bottom - top + 16} fill={bandColor} opacity={bandKind === 'loss' ? 0.1 : 0.12} /> : null}
        {dbTicks.map((v) => (
          <Line key={`l${v}`} x1={x0} y1={yDb(v)} x2={x1} y2={yDb(v)} stroke="rgba(255,255,255,0.06)" />
        ))}

        <APath animatedProps={bars} d={rest} fill={`url(#${gid})`} opacity={0.94} />
        {/* the reference (clean / other sound) as a grey outline ON TOP, so it
            stays visible where the bars cover it */}
        {ghostLv ? <Path d={stepD(ghostLv, x0, bw, top, bottom)} fill="none" stroke="#cfd0d8" strokeWidth={1.1} opacity={0.75} strokeLinejoin="round" /> : null}
        {dbTicks.map((v) => (
          <SvgText key={`t${v}`} x={x0 - 4} y={yDb(v) + 3} fontSize={9} fill={levelColor((v - SPECTRUM_FLOOR_DB) / -SPECTRUM_FLOOR_DB)} textAnchor="end" fontFamily={F}>{v === 0 ? '0 dB' : `${v}`}</SvgText>
        ))}
        {band && bandLabel ? <SvgText x={x(band[0]) + 4} y={top - 3} fontSize={9} fill={bandColor} fontFamily={fonts.oswaldMedium}>{bandLabel}</SvgText> : null}
        {ticks.map((t) => (
          <SvgText key={t} x={x(t)} y={H - 6} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>
        ))}
        <SvgText x={W - 8} y={12} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>0 dB = loudest band · illustrative</SvgText>
      </Svg>
    </View>
  );
}

export function SpectrumBars({ title, controls, ...rest }: SpectrumProps & { title?: string; controls?: ReactNode }) {
  const H = rest.height ?? 130;
  return (
    <View style={{ gap: 4 }}>
      {title ? <ChartTitle>{title}</ChartTitle> : null}
      <ExpandableFigure aspect={340 / H} title="SPECTRUM" controls={controls} render={(w, h) => <SpectrumSvg {...rest} w={w} h={h} />} />
    </View>
  );
}
