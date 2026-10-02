/**
 * Drum Tuning Lab — the SIGNAL drawings: the rendered strike on its real
 * time base, its partials, the pitch-bend trace, and the "See the
 * vibration" head view. Width-driven SVG in 360-unit design space, labels
 * ≥ 11 units (≥ 9 pt on a 390-wide phone). Amplitude is coloured on the
 * app-wide ramp (features/tools/levelColor); the peak readout red is the
 * app standard.
 *
 * NEVER STYLISED (owner): the waveform is a min/max overview of the actual
 * synthesized buffer; the envelope is measured from it; the playhead and
 * the vibration view ride a SharedValue advanced per frame while the clip
 * sounds — never React state per frame.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { MIDLINE_BLUE, levelColor } from '../../../features/tools/levelColor';
import { besselJ } from '../../../features/cymatics/plateModes';
import { J_ZEROS } from '../../../features/cymatics/faraday';
import { isoLines, polylinesToPath } from '../../../features/cymatics/contours';
import { PEAK_RED } from '../mastering/kit';
import { textBoost, tinyFit, type Overview, type Partial, type PitchTrace } from './drumEngine';
import { F2, FONT, FONT_S, W, ink } from './stagesDrum';

/* ── the strike on its time base ─────────────────────────────────────────── */

export const WAVE_H = 200;
export const WAVE_ASPECT = W / WAVE_H;

/**
 * The rendered hit: min/max columns over the clip's real seconds, coloured
 * per column on the amplitude ramp; the measured RMS envelope (dB) drawn
 * over it; the T60 marker; the playhead riding the sounding clip.
 */
/** A GOAL drawn on the time axis (Chapter 5): the sustain the goal asks for,
 *  as a shaded zone the T60 mark has to land in. */
export type WaveTarget = { kind: 'max' | 'min'; t: number; label: string; met: boolean | null };

export function WaveStage({ width, height, ov, envDb, t60, seconds, label, progress, playing, idle, target }: {
  width: number;
  height: number;
  ov: Overview | null;
  envDb?: number[];
  t60?: number;
  seconds: number;
  label: string;
  progress: SharedValue<number>;
  playing: boolean;
  idle?: string;
  target?: WaveTarget | null;
}) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const f2 = F2 * bst;
  const top = 22;
  const bot = 150;
  const mid = (top + bot) / 2;
  const half = (bot - top) / 2;
  const x0 = 30;
  const x1 = W - 8;
  const cols = ov?.hi.length ?? 0;
  const cw = cols ? (x1 - x0) / cols : 0;
  const s = width / W;
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (x0 + progress.value * (x1 - x0)) * s }],
    opacity: playing ? 1 : 0,
  }));
  // Envelope line: dB (0 … −60) → y over the lower half of the box.
  const envPath = useMemo(() => {
    if (!envDb || !envDb.length) return '';
    const n = envDb.length;
    return envDb.map((db, i) => `${i === 0 ? 'M' : 'L'}${(x0 + (i / (n - 1)) * (x1 - x0)).toFixed(1)} ${(bot - Math.max(0, Math.min(1, (db + 60) / 60)) * (bot - top)).toFixed(1)}`).join('');
  }, [envDb]);
  const t60X = t60 != null ? x0 + Math.min(1, t60 / seconds) * (x1 - x0) : null;
  const ticks = Math.max(1, Math.floor(seconds * 2));
  const tX = target ? x0 + Math.min(1, target.t / seconds) * (x1 - x0) : null;
  const tTint = target ? (target.met == null ? ink.amber : target.met ? ink.green : ink.red) : ink.amber;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${WAVE_H}`}>
        <Rect x={0} y={0} width={W} height={WAVE_H} fill={ink.bg} />
        <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
        {/* the goal zone: where the T60 mark has to land */}
        {target && tX != null ? (
          <G>
            <Rect x={target.kind === 'max' ? x0 : tX} y={top} width={target.kind === 'max' ? tX - x0 : x1 - tX} height={bot - top} fill={tTint} opacity={0.1} />
            <Line x1={tX} y1={top} x2={tX} y2={bot} stroke={tTint} strokeWidth={0.9} strokeDasharray="2,2" />
            <SvgText x={target.kind === 'max' ? Math.max(x0 + 3, tX - 3) : Math.min(tX + 3, x1 - 90)} y={bot - 5} fontSize={fsS} fill={tTint} textAnchor={target.kind === 'max' ? 'end' : 'start'} fontFamily={fonts.barlowMedium}>{target.label}</SvgText>
          </G>
        ) : null}
        {[0, -6, -12].map((db) => {
          const dy = half * Math.pow(10, db / 20);
          return (
            <G key={db}>
              <Line x1={x0} y1={mid - dy} x2={x1} y2={mid - dy} stroke="#1f1f24" strokeWidth={0.6} />
              <Line x1={x0} y1={mid + dy} x2={x1} y2={mid + dy} stroke="#1f1f24" strokeWidth={0.6} />
              <SvgText x={x0 - 3} y={mid - dy + 3.5} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db}</SvgText>
            </G>
          );
        })}
        {ov ? ov.hi.map((hi, c) => {
          const lo = ov.lo[c];
          const yT = mid - hi * half;
          const yB = mid - lo * half;
          return <Rect key={c} x={x0 + c * cw} y={yT} width={Math.max(0.8, cw)} height={Math.max(0.8, yB - yT)} fill={levelColor(ov.level[c])} />;
        }) : (
          <SvgText x={(x0 + x1) / 2} y={mid + 4} fontSize={f2} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>{idle ?? 'making the sound…'}</SvgText>
        )}
        <Line x1={x0} y1={mid} x2={x1} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={0.9} />
        {envPath ? <Path d={envPath} stroke={colors.textPrimary} strokeWidth={1.1} fill="none" opacity={0.85} /> : null}
        {t60X != null && ov ? (
          <G>
            <Line x1={t60X} y1={top} x2={t60X} y2={bot} stroke={ink.green} strokeWidth={0.9} strokeDasharray="3,2" />
            {/* the label never runs off the glass: it flips to the left of the mark near the right edge */}
            <SvgText x={t60X > x1 - 78 ? t60X - 3 : t60X + 3} y={top + 11} fontSize={fs} fill={ink.green} textAnchor={t60X > x1 - 78 ? 'end' : 'start'} fontFamily={fonts.mono}>T60 ≈ {t60!.toFixed(2)} s</SvgText>
          </G>
        ) : null}
        {/* time axis; the last tick's label is anchored to its end so it stays on the glass */}
        {Array.from({ length: ticks + 1 }, (_, k) => {
          const t = (k / ticks) * seconds;
          const x = x0 + (t / seconds) * (x1 - x0);
          const last = k === ticks;
          return (
            <G key={k}>
              <Line x1={x} y1={bot} x2={x} y2={bot + 4} stroke={ink.dim} strokeWidth={0.8} />
              <SvgText x={x} y={bot + 14} fontSize={fsS} fill={ink.dim} textAnchor={last ? 'end' : k === 0 ? 'start' : 'middle'} fontFamily={fonts.mono}>{t.toFixed(1)}s</SvgText>
            </G>
          );
        })}
        {tiny ? null : <SvgText x={x0} y={WAVE_H - 20} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>}
        {tiny ? null : <SvgText x={x0} y={WAVE_H - 5} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowMedium}>real time base · white = loudness · green = gone</SvgText>}
      </Svg>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: top * s, width: Math.max(1, 1.2 * s), height: (bot - top) * s, backgroundColor: colors.textPrimary }, headStyle]} />
    </View>
  );
}

/* ── partials ────────────────────────────────────────────────────────────── */

export const PART_H = 190;
export const PART_ASPECT = W / PART_H;

const LO_HZ = 40;
const HI_HZ = 2500;

/** One partial's bar, drawn as a view so it can FADE WITH ITS OWN DECAY while
 *  the strike sounds (opacity = e^(−loss·t) at the clip position); at rest
 *  it stands at its starting amplitude. */
function PartialBar({ x, y, w, h, color, loss, seconds, progress, playing, s }: { x: number; y: number; w: number; h: number; color: string; loss: number; seconds: number; progress: SharedValue<number>; playing: boolean; s: number }) {
  const style = useAnimatedStyle(() => {
    const t = progress.value * seconds;
    return { opacity: playing ? Math.max(0.04, Math.exp(-loss * t)) : 0.88 };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x * s, top: y * s, width: w * s, height: h * s, backgroundColor: color }, style]} />;
}

/** The strike's partials on a log frequency axis: height by amplitude,
 *  colour on the ramp, split pairs drawn as two bars with the beat rate.
 *  While the strike sounds, every bar fades with its own decay. */
export function PartialsStage({ width, height, partials, fb, label, progress, playing, seconds }: { width: number; height: number; partials: readonly Partial[]; fb: number; label: string; progress?: SharedValue<number>; playing?: boolean; seconds?: number }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const x0 = 24;
  const x1 = W - 8;
  const top = 24;
  // The axis labels sit at bot + 12 and the title at PART_H − 18: the box
  // ends here so the two never share a line.
  const bot = 140;
  const xOf = (hz: number) => x0 + (Math.log2(Math.max(LO_HZ, Math.min(HI_HZ, hz)) / LO_HZ) / Math.log2(HI_HZ / LO_HZ)) * (x1 - x0);
  const peak = Math.max(1e-6, ...partials.map((p) => p.amp));
  const pairs = partials.filter((p) => p.pairHz > 0);
  const s = width / W;
  const zero = useSharedValue(0);
  const bars = partials.map((p) => {
    const a = p.amp / peak;
    const h = Math.max(2, a * (bot - top - 6));
    return { x: xOf(p.hz) - 2.5, y: bot - h, w: 5, h, a, color: levelColor(a), loss: p.loss, label: p.label.replace(/[ab]$/, '') };
  });
  return (
    <View style={{ width, height }}>
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${PART_H}`}>
      <Rect x={0} y={0} width={W} height={PART_H} fill={ink.bg} />
      <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      {[50, 100, 200, 500, 1000, 2000].map((hz) => (
        <G key={hz}>
          <Line x1={xOf(hz)} y1={top} x2={xOf(hz)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={xOf(hz)} y={bot + 12} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{hz >= 1000 ? `${hz / 1000}k` : hz}</SvgText>
        </G>
      ))}
      {bars.map((b, i) => (b.a > 0.28 ? <SvgText key={i} x={b.x + 2.5} y={b.y - 4} fontSize={fsS} fill={ink.text} textAnchor="middle" fontFamily={fonts.mono}>{b.label}</SvgText> : null))}
      {/* beat annotations: one per split pair */}
      {pairs.filter((p) => p.pairHz > 0).slice(0, 2).map((p, k) => (
        <SvgText key={k} x={x1 - 4} y={top + 12 + k * 13} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.mono}>
          {`${p.label.replace(/[ab]$/, '')} split ${Math.abs(p.pairHz).toFixed(1)} Hz → beats`}
        </SvgText>
      ))}
      {pairs.length === 0 ? <SvgText x={x1 - 4} y={top + 12} fontSize={fs} fill={ink.green} textAnchor="end" fontFamily={fonts.mono}>no split pairs · even head</SvgText> : null}
      <Line x1={xOf(fb)} y1={top} x2={xOf(fb)} y2={bot} stroke={ink.cyan} strokeWidth={0.8} strokeDasharray="3,2" />
      {/* the batter's own pitch, to the LEFT of its line so it never meets the split notes on the right */}
      <SvgText x={xOf(fb) - 3} y={top + 12} fontSize={fsS} fill={ink.cyan} textAnchor="end" fontFamily={fonts.mono}>batter {fb.toFixed(0)} Hz</SvgText>
      {tiny ? null : <SvgText x={x0} y={PART_H - 18} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>}
      {tiny ? null : <SvgText x={x0} y={PART_H - 5} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowMedium}>height = how loud it starts · bars fade with the hit</SvgText>}
    </Svg>
    {bars.map((b, i) => (
      <PartialBar key={i} x={b.x} y={b.y} w={b.w} h={b.h} color={b.color} loss={b.loss} seconds={seconds ?? 1} progress={progress ?? zero} playing={!!playing} s={s} />
    ))}
    </View>
  );
}

/* ── the pitch-bend trace ────────────────────────────────────────────────── */

export const PITCH_H = 200;
export const PITCH_ASPECT = W / PITCH_H;

/**
 * Pitch over time of the (0,1) family: one line per coupled mode, its
 * opacity following its amplitude so the eye follows what the ear follows.
 * Reference lines: the batter's own (0,1) at 0 cents and the resonant
 * head's. The playhead rides the sounding clip.
 */
export function PitchStage({ width, height, traces, seconds, resoCents, progress, playing, label }: {
  width: number;
  height: number;
  traces: readonly PitchTrace[];
  seconds: number;
  resoCents: number | null;
  progress: SharedValue<number>;
  playing: boolean;
  label: string;
}) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const f2 = F2 * bst;
  const x0 = 40;
  const x1 = W - 8;
  const top = 22;
  const bot = 150;
  const LO = -300;
  const HI = 500;
  const yOf = (c: number) => bot - ((Math.max(LO, Math.min(HI, c)) - LO) / (HI - LO)) * (bot - top);
  const s = width / W;
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (x0 + progress.value * (x1 - x0)) * s }],
    opacity: playing ? 1 : 0,
  }));
  const segs = useMemo(
    () =>
      traces.map((tr) => {
        // Split the line into amplitude-tiered segments so opacity follows amp.
        const out: { d: string; a: number }[] = [];
        let d = '';
        let aAcc = 0;
        let n = 0;
        tr.pts.forEach((p, i) => {
          const x = x0 + (p.t / seconds) * (x1 - x0);
          d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${yOf(p.cents).toFixed(1)}`;
          aAcc += p.amp;
          n++;
          if (n >= 8 || i === tr.pts.length - 1) {
            out.push({ d, a: aAcc / n });
            d = `M${x.toFixed(1)} ${yOf(p.cents).toFixed(1)}`;
            aAcc = 0;
            n = 0;
          }
        });
        return { label: tr.label, segs: out };
      }),
    [traces, seconds],
  );
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${PITCH_H}`}>
        <Rect x={0} y={0} width={W} height={PITCH_H} fill={ink.bg} />
        <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
        {[-200, 0, 200, 400].map((c) => (
          <G key={c}>
            <Line x1={x0} y1={yOf(c)} x2={x1} y2={yOf(c)} stroke={c === 0 ? ink.cyan : '#1f1f24'} strokeWidth={c === 0 ? 0.9 : 0.6} strokeDasharray={c === 0 ? '3,2' : undefined} />
            <SvgText x={x0 - 3} y={yOf(c) + 3.5} fontSize={fsS} fill={c === 0 ? ink.cyan : ink.dim} textAnchor="end" fontFamily={fonts.mono}>{c > 0 ? `+${c}` : c}</SvgText>
          </G>
        ))}
        {resoCents != null ? (
          <G>
            <Line x1={x0} y1={yOf(resoCents)} x2={x1} y2={yOf(resoCents)} stroke={ink.green} strokeWidth={0.9} strokeDasharray="3,2" />
            <SvgText x={x1 - 3} y={yOf(resoCents) - 3} fontSize={fsS} fill={ink.green} textAnchor="end" fontFamily={fonts.mono}>reso head {resoCents >= 0 ? '+' : ''}{resoCents.toFixed(0)}¢</SvgText>
          </G>
        ) : null}
        <SvgText x={x0 + 3} y={yOf(0) - 3} fontSize={fsS} fill={ink.cyan} fontFamily={fonts.mono}>batter's own pitch = 0¢</SvgText>
        {segs.length ? segs.map((tr) => tr.segs.map((sg, k) => <Path key={`${tr.label}${k}`} d={sg.d} stroke={ink.amber} strokeWidth={2} fill="none" opacity={0.12 + 0.88 * Math.min(1, sg.a)} />)) : (
          <SvgText x={(x0 + x1) / 2} y={(top + bot) / 2 + 4} fontSize={f2} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>press ▶ STRIKE — the pitch trace draws here</SvgText>
        )}
        {Array.from({ length: Math.floor(seconds * 2) + 1 }, (_, k) => {
          const t = k / 2;
          const x = x0 + (t / seconds) * (x1 - x0);
          return (
            <G key={k}>
              <Line x1={x} y1={bot} x2={x} y2={bot + 4} stroke={ink.dim} strokeWidth={0.8} />
              <SvgText x={x} y={bot + 14} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{t.toFixed(1)}s</SvgText>
            </G>
          );
        })}
        {tiny ? null : <SvgText x={x0} y={PITCH_H - 20} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>}
        {tiny ? null : <SvgText x={x0} y={PITCH_H - 5} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowMedium}>cents vs the batter's pitch · brighter = louder</SvgText>}
      </Svg>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: top * s, width: Math.max(1, 1.2 * s), height: (bot - top) * s, backgroundColor: colors.textPrimary }, headStyle]} />
    </View>
  );
}

/* ── see the vibration ───────────────────────────────────────────────────── */

export const VIB_H = 230;
export const VIB_ASPECT = W / VIB_H;

/** The signed displacement field of mode (n, s) with the pair blend `mix`
 *  (0 = cos nθ only; an uneven head mixes in the sin nθ twin). N×N over the
 *  unit square, NaN outside the disc — the Cymatics contours contract. */
export function modeField(n: number, s: number, mix: number, N: number): Float32Array {
  const j = J_ZEROS[n]?.[s - 1] ?? J_ZEROS[0][0];
  const out = new Float32Array(N * N);
  for (let jy = 0; jy < N; jy++) {
    const y = (jy + 0.5) / N;
    for (let ix = 0; ix < N; ix++) {
      const x = (ix + 0.5) / N;
      const dx = (x - 0.5) * 2;
      const dy = (y - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) {
        out[jy * N + ix] = NaN;
        continue;
      }
      const th = Math.atan2(dy, dx);
      out[jy * N + ix] = besselJ(n, j * r) * (Math.cos(n * th) * (1 - mix) + Math.sin(n * th) * mix);
    }
  }
  return out;
}

/**
 * "SEE THE VIBRATION": the head's displacement pattern for the mode the
 * learner is listening to — contour bands of the same J_n(kr)·cos nθ shape
 * the sound was built from (the Cymatics Lab's membrane maths and contour
 * tracer). The up-regions and down-regions swap brightness at a slow strobe
 * (the real motion is hundreds of times a second) and FADE WITH THE
 * MEASURED ENVELOPE of the rendered hit, so the picture and the sound decay
 * together.
 */
export function VibrationStage({ width, height, n, s, mix, hz, label, progress, envDb, seconds, playing }: {
  width: number;
  height: number;
  n: number;
  s: number;
  mix: number;
  hz: number;
  label: string;
  progress: SharedValue<number>;
  envDb: number[] | null;
  seconds: number;
  playing: boolean;
}) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const N = 44;
  const cx = 180;
  const cy = 118;
  const R = 92;
  const field = useMemo(() => modeField(n, s, mix, N), [n, s, mix]);
  const map = (p: { x: number; y: number }) => ({ x: cx - R + p.x * 2 * R, y: cy - R + p.y * 2 * R });
  const paths = useMemo(() => {
    const pos = [0.25, 0.5, 0.75].map((lv) => polylinesToPath(isoLines(field, N, 1, lv), map));
    const neg = [-0.25, -0.5, -0.75].map((lv) => polylinesToPath(isoLines(field, N, 1, lv), map));
    const nodal = polylinesToPath(isoLines(field, N, 1, 0), map);
    return { pos, neg, nodal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);
  const env = envDb ?? [];
  const sc = width / W;
  const upStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const i = Math.min(env.length - 1, Math.floor(p * env.length));
    const a = playing && env.length ? Math.pow(10, env[Math.max(0, i)] / 20) : 0.55;
    const strobe = 0.5 + 0.5 * Math.sin(p * seconds * 2 * Math.PI * 3);
    return { opacity: playing ? a * strobe : 0.55 };
  });
  const downStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const i = Math.min(env.length - 1, Math.floor(p * env.length));
    const a = playing && env.length ? Math.pow(10, env[Math.max(0, i)] / 20) : 0.55;
    const strobe = 0.5 - 0.5 * Math.sin(p * seconds * 2 * Math.PI * 3);
    return { opacity: playing ? a * strobe : 0.55 };
  });
  const base = (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${VIB_H}`}>
      <Rect x={0} y={0} width={W} height={VIB_H} fill={ink.bg} />
      <Circle cx={cx} cy={cy} r={R + 9} fill="none" stroke={ink.metal} strokeWidth={6} />
      <Circle cx={cx} cy={cy} r={R + 2} fill={ink.shellDark} />
      <Circle cx={cx} cy={cy} r={R} fill="#d8d3c2" />
      <Path d={paths.nodal} stroke={colors.textPrimary} strokeWidth={1.6} fill="none" />
      <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>
      <SvgText x={W - 6} y={14} fontSize={fs} fill={ink.cyan} textAnchor="end" fontFamily={fonts.mono}>({n},{s}) · {hz.toFixed(0)} Hz</SvgText>
      {tiny ? null : <SvgText x={W / 2} y={VIB_H - 6} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>white = still lines · fades with the hit</SvgText>}
    </Svg>
  );
  const over = (d: string[], color: string) => (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${VIB_H}`} pointerEvents="none">
      {d.map((p, k) => <Path key={k} d={p} stroke={color} strokeWidth={1} fill={color} fillOpacity={0.22 + k * 0.18} />)}
    </Svg>
  );
  return (
    <View style={{ width, height }}>
      {base}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height }, upStyle]}>{over(paths.pos, ink.amber)}</Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height }, downStyle]}>{over(paths.neg, ink.cyan)}</Animated.View>
    </View>
  );
}

export { PEAK_RED };
