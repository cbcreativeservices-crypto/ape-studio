/**
 * Mastering Lab STAGES — the drawings pinned on the rack glass. All of them
 * are width-driven SVG in 360-unit design space, so FULL SCREEN zooms the
 * whole picture (text included — SVG text scales with its viewBox; the few
 * React Native overlays use the stage text scale). Every label ≥ 11 units,
 * which is ≥ 9 pt on a 390-wide phone (the Amp lab's measured 0.88 ratio).
 *
 * Amplitude anywhere here is coloured by features/tools/levelColor — the
 * one app-wide ramp (waveform columns, loudness blocks, level bars).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { MIDLINE_BLUE, levelColor, levelColorForDb, splColorForDba } from '../../../features/tools/levelColor';
import { eqResponseDb, type EqBandSpec } from '../../../features/lab/fxViz';
import { GearInSvg, type GlyphKind } from '../soundsystems/art/gearArt';
import { PEAK_RED } from './kit';
import { linToDb, perceivedBalanceShift, type Overview, type PathDevice, type SeqBlock } from './masteringEngine';
import { CONTROL_ITEMS, type ControlItem } from './masteringContent';

export const W = 360;
/** Smallest label in design units (≈ 9.7 pt on a 390-wide phone). */
export const FONT = 11;
const F2 = 12.5;
/** Secondary labels: still ≥ 9 pt at the narrowest phone glass (0.88 × 10.5). */
const FONT_S = 10.5;

const ink = {
  box: '#151518',
  boxLit: '#1b1a12',
  stroke: colors.steelBorder,
  text: colors.textSecondary,
  dim: colors.textMuted,
  amber: colors.amber,
  cyan: colors.cyan,
  green: colors.green,
};

/* ── 1 · where mastering fits ────────────────────────────────────────────── */

export const PIPELINE = ['RECORDING', 'EDITING', 'MIXING', 'MASTERING', 'DISTRIBUTION'] as const;
export const PIPELINE_SHORT = ['REC', 'EDIT', 'MIX', 'MASTER', 'DISTRIB'] as const;
export const PIPELINE_WORK: readonly string[] = [
  'Capture the performances',
  'Choose takes, tidy, align',
  'Balance the tracks into a stereo mix',
  'Evaluate and prepare the approved mix',
  'Deliver to each destination',
];
export const PIPELINE_ASPECT = 360 / 132;

export function PipelineStage({ width, height, index }: { width: number; height: number; index: number }) {
  const n = PIPELINE.length;
  const bw = 64;
  const gap = (W - 8 - bw * n) / (n - 1);
  const y = 14;
  const bh = 40;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} 132`}>
      {PIPELINE.map((name, i) => {
        const x = 4 + i * (bw + gap);
        const lit = i === index;
        const master = i === 3;
        return (
          <G key={name}>
            <Rect x={x} y={y} width={bw} height={bh} rx={6} fill={lit ? ink.boxLit : ink.box} stroke={lit ? ink.amber : master ? 'rgba(255,198,77,.45)' : ink.stroke} strokeWidth={lit ? 1.6 : 1} />
            <SvgText x={x + bw / 2} y={y + bh / 2 + 4} fontSize={name.length > 9 ? FONT_S : FONT} fill={lit ? ink.amber : ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
              {name.length > 9 ? name.slice(0, 7) + '.' : name}
            </SvgText>
            {i < n - 1 ? <Path d={`M${x + bw + 1} ${y + bh / 2} l${gap - 3} 0 m-4 -3 l4 3 l-4 3`} stroke={i < index ? ink.amber : ink.stroke} strokeWidth={1.4} fill="none" /> : null}
          </G>
        );
      })}
      {/* the mix as a bundle of tracks becoming ONE stereo file at mastering */}
      <G>
        {[0, 1, 2, 3, 4].map((t) => (
          <Line key={t} x1={16} y1={74 + t * 5} x2={150} y2={74 + t * 5} stroke={ink.cyan} strokeWidth={1.2} opacity={0.5 + t * 0.08} />
        ))}
        <Path d="M150 74 C 175 74 175 86 200 86 M150 94 C 175 94 175 86 200 86" stroke={ink.cyan} strokeWidth={1.2} fill="none" />
        <Line x1={200} y1={84} x2={296} y2={84} stroke={ink.green} strokeWidth={1.6} />
        <Line x1={200} y1={88} x2={296} y2={88} stroke={ink.green} strokeWidth={1.6} />
        <Path d="M296 80 l10 0 l-5 6 z" fill={ink.green} transform="translate(0,2)" />
        <SvgText x={16} y={110} fontSize={FONT} fill={ink.cyan} fontFamily={fonts.barlowMedium}>many tracks (the mix)</SvgText>
        <SvgText x={W - 6} y={110} fontSize={FONT} fill={ink.green} textAnchor="end" fontFamily={fonts.barlowMedium}>ONE stereo file (the master)</SvgText>
      </G>
      <SvgText x={W / 2} y={126} fontSize={F2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.barlowMedium}>
        {PIPELINE_WORK[index]}
      </SvgText>
    </Svg>
  );
}

/* ── the programme overview (LISTEN pages) ───────────────────────────────── */

export const WAVE_ASPECT = 360 / 200;

/**
 * The rendered version on a REAL time base: min/max columns of the mono
 * fold over 0…10 s, coloured per column on the amplitude ramp, the limiter's
 * gain-reduction trace above, the ceiling marked, the playhead riding the
 * sounding clip (a SharedValue — never React state per frame).
 */
export function WaveOverviewStage({ width, height, ov, grDb, maxGrDb, ceilingDb, label, matchDb, progress, playing }: {
  width: number;
  height: number;
  ov: Overview | null;
  grDb?: number[];
  maxGrDb?: number;
  ceilingDb?: number | null;
  label: string;
  matchDb?: number;
  progress: SharedValue<number>;
  playing: boolean;
}) {
  const H = 200;
  const grTop = 14;
  const grH = 30;
  const top = 54;
  const bot = 170;
  const mid = (top + bot) / 2;
  const half = (bot - top) / 2;
  const x0 = 28;
  const x1 = W - 8;
  const cols = ov?.hi.length ?? 0;
  const cw = cols ? (x1 - x0) / cols : 0;
  const seconds = ov?.seconds ?? 10;
  const ceilY = ceilingDb != null ? mid - half * Math.pow(10, ceilingDb / 20) : null;
  const s = width / W; // design → pixels
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (x0 + progress.value * (x1 - x0)) * s }],
    opacity: playing ? 1 : 0,
  }));
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {/* gain-reduction strip */}
        <SvgText x={x0} y={grTop + 8} fontSize={FONT} fill={ink.dim} fontFamily={fonts.oswaldMedium}>GAIN REDUCTION</SvgText>
        <SvgText x={x1} y={grTop + 8} fontSize={FONT} fill={maxGrDb ? ink.amber : ink.dim} textAnchor="end" fontFamily={fonts.mono}>
          {maxGrDb ? `max −${maxGrDb.toFixed(1)} dB` : 'none'}
        </SvgText>
        <Rect x={x0} y={grTop + 12} width={x1 - x0} height={grH - 12} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
        {grDb && grDb.length ? grDb.map((g, c) => {
          if (g <= 0) return null;
          const hh = Math.min(1, g / 12) * (grH - 12);
          const n = grDb.length;
          return <Rect key={c} x={x0 + (c / n) * (x1 - x0)} y={grTop + 12} width={Math.max(1, (x1 - x0) / n)} height={hh} fill={levelColor(Math.min(1, g / 12))} />;
        }) : null}
        {/* waveform */}
        <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
        {[0, -6, -12].map((db) => {
          const dy = half * Math.pow(10, db / 20);
          return (
            <G key={db}>
              <Line x1={x0} y1={mid - dy} x2={x1} y2={mid - dy} stroke="#1f1f24" strokeWidth={0.6} />
              <Line x1={x0} y1={mid + dy} x2={x1} y2={mid + dy} stroke="#1f1f24" strokeWidth={0.6} />
              <SvgText x={x0 - 3} y={mid - dy + 3.5} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db}</SvgText>
            </G>
          );
        })}
        {ov ? ov.hi.map((hi, c) => {
          const lo = ov.lo[c];
          const yT = mid - hi * half;
          const yB = mid - lo * half;
          return <Rect key={c} x={x0 + c * cw} y={yT} width={Math.max(0.8, cw)} height={Math.max(0.8, yB - yT)} fill={levelColor(ov.level[c])} />;
        }) : (
          <SvgText x={(x0 + x1) / 2} y={mid + 4} fontSize={F2} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>press ▶ on a version — the render draws here</SvgText>
        )}
        <Line x1={x0} y1={mid} x2={x1} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={0.9} />
        {ceilY != null ? (
          <G>
            <Line x1={x0} y1={ceilY} x2={x1} y2={ceilY} stroke={PEAK_RED} strokeWidth={0.8} strokeDasharray="3,2" />
            <Line x1={x0} y1={2 * mid - ceilY} x2={x1} y2={2 * mid - ceilY} stroke={PEAK_RED} strokeWidth={0.8} strokeDasharray="3,2" />
            <SvgText x={x1 - 2} y={ceilY - 2} fontSize={FONT_S} fill={PEAK_RED} textAnchor="end" fontFamily={fonts.mono}>ceiling {ceilingDb} dBFS</SvgText>
          </G>
        ) : null}
        {/* time axis */}
        {Array.from({ length: Math.floor(seconds) + 1 }, (_, t) => (
          <G key={t}>
            <Line x1={x0 + (t / seconds) * (x1 - x0)} y1={bot} x2={x0 + (t / seconds) * (x1 - x0)} y2={bot + 4} stroke={ink.dim} strokeWidth={0.8} />
            {t % 2 === 0 ? <SvgText x={x0 + (t / seconds) * (x1 - x0)} y={bot + 14} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{t}s</SvgText> : null}
          </G>
        ))}
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>
        {matchDb != null && matchDb !== 0 ? (
          <SvgText x={x1} y={H - 4} fontSize={FONT} fill={ink.cyan} textAnchor="end" fontFamily={fonts.mono}>played at {matchDb.toFixed(1)} dB · matched</SvgText>
        ) : matchDb === 0 && ov ? (
          <SvgText x={x1} y={H - 4} fontSize={FONT} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>played as rendered</SvgText>
        ) : null}
      </Svg>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: top * s, width: Math.max(1, 1.2 * s), height: (bot - top) * s, backgroundColor: colors.textPrimary }, headStyle]} />
    </View>
  );
}

/* ── 2 · who has control of that? ───────────────────────────────────────── */

export const CONTROL_ASPECT = 360 / 150;

export function ControlMapStage({ width, height, item }: { width: number; height: number; item: ControlItem }) {
  const stages: { id: ControlItem['stage']; name: string; x: number; w: number; role: 'mix' | 'master' }[] = [
    { id: 'tracks', name: 'TRACKS', x: 6, w: 78, role: 'mix' },
    { id: 'bus', name: 'MIX BUS', x: 96, w: 72, role: 'mix' },
    { id: 'master', name: 'STEREO MASTER', x: 180, w: 86, role: 'master' },
    { id: 'delivery', name: 'DELIVERY', x: 278, w: 76, role: 'master' },
  ];
  const y = 44;
  const bh = 40;
  const ownerColor = item.owner === 'mix' ? ink.cyan : item.owner === 'master' ? ink.green : ink.amber;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} 150`}>
      <SvgText x={6} y={16} fontSize={FONT} fill={ink.cyan} fontFamily={fonts.oswaldMedium}>MIXING ENGINEER</SvgText>
      <Line x1={6} y1={20} x2={168} y2={20} stroke={ink.cyan} strokeWidth={1} />
      <SvgText x={180} y={16} fontSize={FONT} fill={ink.green} fontFamily={fonts.oswaldMedium}>MASTERING ENGINEER</SvgText>
      <Line x1={180} y1={20} x2={354} y2={20} stroke={ink.green} strokeWidth={1} />
      {stages.map((st, i) => {
        const lit = st.id === item.stage;
        const c = st.role === 'mix' ? ink.cyan : ink.green;
        return (
          <G key={st.id}>
            <Rect x={st.x} y={y} width={st.w} height={bh} rx={6} fill={lit ? ink.boxLit : ink.box} stroke={lit ? ownerColor : ink.stroke} strokeWidth={lit ? 1.8 : 1} />
            <SvgText x={st.x + st.w / 2} y={y + bh / 2 + 4} fontSize={st.name.length > 9 ? FONT_S : FONT} fill={lit ? ownerColor : c} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{st.name}</SvgText>
            {i < stages.length - 1 ? <Path d={`M${st.x + st.w + 1} ${y + bh / 2} l${stages[i + 1].x - st.x - st.w - 3} 0 m-4 -3 l4 3 l-4 3`} stroke={ink.stroke} strokeWidth={1.3} fill="none" /> : null}
          </G>
        );
      })}
      {/* the tracks inside the first box, the single stereo pair after it */}
      {[0, 1, 2, 3].map((t) => <Line key={t} x1={14} y1={52 + t * 7} x2={76} y2={52 + t * 7} stroke={ink.cyan} strokeWidth={0.8} opacity={0.45} />)}
      <SvgText x={6} y={112} fontSize={F2} fill={ink.text} fontFamily={fonts.barlowMedium}>{item.label}</SvgText>
      <Rect x={6} y={120} width={W - 12} height={22} rx={4} fill={ink.box} stroke={ownerColor} strokeWidth={1} />
      <SvgText x={W / 2} y={135} fontSize={FONT} fill={ownerColor} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
        {item.owner === 'mix' ? 'ADDRESSED IN THE MIX' : item.owner === 'master' ? 'ADDRESSED IN MASTERING' : 'EITHER — WITH DIFFERENT REACH'}
      </SvgText>
    </Svg>
  );
}

export const controlItemById = (id: string): ControlItem => CONTROL_ITEMS.find((c) => c.id === id) ?? CONTROL_ITEMS[0];

/* ── 3 · monitoring level ────────────────────────────────────────────────── */

export const MONITOR_ASPECT = 360 / 170;

/** Log-frequency position across the plot. */
const fx = (f: number, x0: number, x1: number) => x0 + ((Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * (x1 - x0);

/**
 * How the ear's balance shifts with monitoring level — a MODEL of the
 * equal-loudness picture (bass reads weaker quietly, bigger loudly), beside
 * a level bar on the SPL safety ramp.
 */
export function MonitorLevelStage({ width, height, levelDb }: { width: number; height: number; levelDb: number }) {
  const H = 170;
  const x0 = 34;
  const x1 = 300;
  const top = 18;
  const bot = 140;
  const midY = (top + bot) / 2;
  const yOf = (db: number) => midY - (db / 12) * ((bot - top) / 2);
  const { bassDb, trebleDb } = perceivedBalanceShift(levelDb);
  // Smooth curve: bassDb at 50 Hz tapering to 0 at ~700 Hz, trebleDb from ~3 kHz up.
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const f = 20 * Math.pow(1000, i / 60);
    const lf = Math.max(0, Math.min(1, (Math.log10(700) - Math.log10(f)) / (Math.log10(700) - Math.log10(50))));
    const hf = Math.max(0, Math.min(1, (Math.log10(f) - Math.log10(2500)) / (Math.log10(12000) - Math.log10(2500))));
    const db = bassDb * lf * lf + trebleDb * hf;
    pts.push(`${i === 0 ? 'M' : 'L'}${fx(f, x0, x1).toFixed(1)} ${yOf(db).toFixed(1)}`);
  }
  const barX = 322;
  const barTop = 18;
  const barBot = 136;
  const lvl = Math.max(0, Math.min(1, (levelDb - 40) / 60));
  const barY = barBot - lvl * (barBot - barTop);
  const tint = splColorForDba(levelDb);
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      {[-12, -6, 0, 6, 12].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x1} y2={yOf(db)} stroke={db === 0 ? MIDLINE_BLUE : '#1f1f24'} strokeWidth={db === 0 ? 1 : 0.6} />
          <SvgText x={x0 - 3} y={yOf(db) + 3.5} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db > 0 ? `+${db}` : db}</SvgText>
        </G>
      ))}
      {[50, 100, 1000, 10000].map((f) => (
        <G key={f}>
          <Line x1={fx(f, x0, x1)} y1={top} x2={fx(f, x0, x1)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={fx(f, x0, x1)} y={bot + 12} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{f >= 1000 ? `${f / 1000}k` : f}</SvgText>
        </G>
      ))}
      <Path d={pts.join(' ')} stroke={ink.amber} strokeWidth={2} fill="none" />
      <SvgText x={x0 + 4} y={top + 12} fontSize={FONT} fill={ink.text} fontFamily={fonts.oswaldMedium}>APPARENT BALANCE vs 1 kHz · dB</SvgText>
      <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>
        {`bass ${bassDb > 0 ? '+' : ''}${bassDb.toFixed(1)} · treble ${trebleDb > 0 ? '+' : ''}${trebleDb.toFixed(1)} dB`}
      </SvgText>
      <SvgText x={x0 + 4} y={bot + 24} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>equal-loudness model vs a moderate reference</SvgText>
      {/* the level bar on the SPL safety ramp */}
      <Rect x={barX} y={barTop} width={18} height={barBot - barTop} rx={3} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      {Array.from({ length: 24 }, (_, i) => {
        const segH = (barBot - barTop) / 24;
        const l = i / 23;
        const lit = l <= lvl;
        return <Rect key={i} x={barX + 2} y={barBot - (i + 1) * segH + 0.6} width={14} height={segH - 1.2} rx={1} fill={lit ? splColorForDba(40 + l * 60) : '#141418'} />;
      })}
      <Line x1={barX - 4} y1={barY} x2={barX + 22} y2={barY} stroke={colors.textPrimary} strokeWidth={1.2} />
      <SvgText x={barX + 9} y={barBot + 14} fontSize={FONT} fill={tint} textAnchor="middle" fontFamily={fonts.mono}>{Math.round(levelDb)}</SvgText>
      <SvgText x={barX + 9} y={barBot + 28} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>dB SPL</SvgText>
    </Svg>
  );
}

/* ── 3 · build a monitoring path ─────────────────────────────────────────── */

export const PATH_ASPECT = 360 / 150;

const GLYPH_FOR: Record<PathDevice, GlyphKind> = {
  daw: 'playback',
  dac: 'processor',
  monitorCtl: 'console',
  amp: 'amp',
  passive: 'passiveSpeaker',
  active: 'poweredSpeaker',
};
const SHORT_FOR: Record<PathDevice, string> = { daw: 'DAW', dac: 'DAC', monitorCtl: 'MON CTL', amp: 'POWER AMP', passive: 'PASSIVE', active: 'ACTIVE' };

/** The chain the learner assembled, drawn with the Sound Systems gear art:
 *  five slots, arrows between filled ones, a verdict strip underneath. */
export function MonitorPathStage({ width, height, chain, ok, notes }: { width: number; height: number; chain: readonly PathDevice[]; ok: boolean; notes: readonly string[] }) {
  const slots = 5;
  const sw = (W - 12) / slots;
  const cy = 60;
  const problem = notes.find((n) => !n.startsWith('No '));
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} 150`}>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.dim} fontFamily={fonts.oswaldMedium}>PLAYBACK → CONVERSION → LEVEL → AMPLIFICATION → AIR</SvgText>
      {Array.from({ length: slots }, (_, i) => {
        const d = chain[i];
        const cx = 6 + i * sw + sw / 2;
        return (
          <G key={i}>
            <Rect x={6 + i * sw + 3} y={28} width={sw - 6} height={70} rx={6} fill={d ? ink.box : '#0d0d10'} stroke={d ? (ok ? ink.green : ink.amber) : ink.stroke} strokeWidth={d ? 1.3 : 0.8} strokeDasharray={d ? undefined : '3,3'} />
            {d ? <GearInSvg kind={GLYPH_FOR[d]} id={`mp-${i}-${d}`} x={cx} y={cy} size={46} /> : <SvgText x={cx} y={cy + 4} fontSize={FONT} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{`SLOT ${i + 1}`}</SvgText>}
            <SvgText x={cx} y={92} fontSize={FONT_S} fill={d ? ink.text : ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{d ? SHORT_FOR[d] : '—'}</SvgText>
            {d && chain[i + 1] ? <Path d={`M${6 + (i + 1) * sw - 3} ${cy} l6 0 m-3 -3 l3 3 l-3 3`} stroke={ink.green} strokeWidth={1.3} fill="none" /> : null}
          </G>
        );
      })}
      <Rect x={6} y={108} width={W - 12} height={34} rx={5} fill={ok ? '#0f1d14' : '#17130d'} stroke={ok ? ink.green : ink.amber} strokeWidth={1} />
      <SvgText x={12} y={122} fontSize={FONT} fill={ok ? ink.green : ink.amber} fontFamily={fonts.oswaldMedium}>{ok ? 'PATH COMPLETE' : chain.length ? 'CHECK THE CHAIN' : 'EMPTY CHAIN'}</SvgText>
      <SvgText x={12} y={136} fontSize={FONT_S} fill={ink.text} fontFamily={fonts.barlowRegular}>{(ok ? 'Every stage in order — real systems vary in how boxes share the jobs.' : problem ?? notes[0] ?? '').slice(0, 64)}</SvgText>
    </Svg>
  );
}

/* ── 4 · the tool shelf ──────────────────────────────────────────────────── */

export const TOOL_ASPECT = 360 / 180;

export type ToolView = 'playback' | 'monitor' | 'eq' | 'dyn' | 'stereo' | 'meters' | 'analog';

/** Dynamics law: input dB → output dB for a compressor / limiter. */
export function dynamicsLawDb(inDb: number, thresholdDb: number, ratio: number): number {
  return inDb <= thresholdDb ? inDb : thresholdDb + (inDb - thresholdDb) / ratio;
}

/** Mid/side correlation for a width multiplier on a programme whose side
 *  energy is `sideRatio` of its mid energy (0.5 is a typical mix). */
export function widthCorrelation(widthMult: number, sideRatio = 0.5): number {
  const m = 1;
  const s = sideRatio * Math.max(0, widthMult);
  return (m * m - s * s) / (m * m + s * s);
}

export function ToolStage({ width, height, view, amount, ov }: { width: number; height: number; view: ToolView; amount: number; ov: Overview | null }) {
  const H = 180;
  const x0 = 34;
  const x1 = W - 10;
  const top = 18;
  const bot = 150;
  const midY = (top + bot) / 2;
  const curve = useMemo(() => {
    if (view !== 'eq' && view !== 'analog') return '';
    const bands: EqBandSpec[] = view === 'eq'
      ? [{ type: 'lowShelf', freq: 200, q: 0.7, gainDb: -amount * 3 }, { type: 'highShelf', freq: 2500, q: 0.7, gainDb: amount * 3 }]
      : [{ type: 'peak', freq: 120, q: 0.6, gainDb: amount * 3 }, { type: 'highShelf', freq: 8000, q: 0.5, gainDb: amount * 2.5 }];
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const f = 20 * Math.pow(1000, i / 80);
      const db = eqResponseDb(bands, f);
      pts.push(`${i === 0 ? 'M' : 'L'}${fx(f, x0, x1).toFixed(1)} ${(midY - (db / 12) * ((bot - top) / 2)).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [view, amount]);

  const frame = (title: string) => (
    <>
      <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      <SvgText x={x0 + 4} y={top + 12} fontSize={FONT} fill={ink.text} fontFamily={fonts.oswaldMedium}>{title}</SvgText>
    </>
  );

  if (view === 'eq' || view === 'analog') {
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame(view === 'eq' ? 'TILT EQ · broad tonal shaping' : 'ANALOG EQ · a different hand, same decision')}
        {[-12, -6, 0, 6, 12].map((db) => (
          <G key={db}>
            <Line x1={x0} y1={midY - (db / 12) * ((bot - top) / 2)} x2={x1} y2={midY - (db / 12) * ((bot - top) / 2)} stroke={db === 0 ? MIDLINE_BLUE : '#1f1f24'} strokeWidth={db === 0 ? 1 : 0.6} />
            <SvgText x={x0 - 3} y={midY - (db / 12) * ((bot - top) / 2) + 3.5} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db > 0 ? `+${db}` : db}</SvgText>
          </G>
        ))}
        {[100, 1000, 10000].map((f) => (
          <G key={f}>
            <Line x1={fx(f, x0, x1)} y1={top} x2={fx(f, x0, x1)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
            <SvgText x={fx(f, x0, x1)} y={bot + 12} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{f >= 1000 ? `${f / 1000}k` : f}</SvgText>
          </G>
        ))}
        <Path d={curve} stroke={view === 'eq' ? ink.amber : colors.orange} strokeWidth={2} fill="none" />
        <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`${view === 'eq' ? 'tilt' : 'colour'} ${amount > 0 ? '+' : ''}${(amount * 3).toFixed(1)} dB`}</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>{view === 'eq' ? 'one move on every element — compare at matched level' : 'neither analog nor digital is "better" — different tools'}</SvgText>
      </Svg>
    );
  }
  if (view === 'dyn') {
    const ratio = 1 + amount * 19; // 1:1 … 20:1
    const thr = -12;
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const inDb = -60 + i;
      const out = dynamicsLawDb(inDb, thr, ratio);
      pts.push(`${i === 0 ? 'M' : 'L'}${(x0 + ((inDb + 60) / 60) * (x1 - x0)).toFixed(1)} ${(bot - ((out + 60) / 60) * (bot - top)).toFixed(1)}`);
    }
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame(ratio >= 10 ? 'LIMITER · a ceiling on peaks' : 'COMPRESSOR · gentle control')}
        <Line x1={x0} y1={bot} x2={x1} y2={top} stroke="#1f1f24" strokeWidth={0.8} strokeDasharray="3,3" />
        <Path d={pts.join(' ')} stroke={levelColor(Math.min(1, amount))} strokeWidth={2} fill="none" />
        <Line x1={x0 + ((thr + 60) / 60) * (x1 - x0)} y1={top} x2={x0 + ((thr + 60) / 60) * (x1 - x0)} y2={bot} stroke={ink.amber} strokeWidth={0.8} strokeDasharray="2,2" />
        <SvgText x={x0 + ((thr + 60) / 60) * (x1 - x0) - 3} y={bot - 6} fontSize={FONT_S} fill={ink.amber} textAnchor="end" fontFamily={fonts.mono}>thr {thr} dB</SvgText>
        <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`ratio ${ratio.toFixed(1)} : 1`}</SvgText>
        <SvgText x={(x0 + x1) / 2} y={bot + 12} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>input dB →</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>past the threshold the output rises slower — peaks down</SvgText>
      </Svg>
    );
  }
  if (view === 'stereo') {
    const wmult = amount * 2; // 0 … 2
    const corr = widthCorrelation(wmult);
    const cx = (x0 + x1) / 2;
    const cy = midY;
    const r = (bot - top) / 2 - 10;
    const rx = r * Math.min(1, 0.15 + wmult * 0.5);
    const ry = r;
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('STEREO WIDTH · with the mono check')}
        <Line x1={cx} y1={top + 4} x2={cx} y2={bot - 4} stroke="#1f1f24" strokeWidth={0.6} />
        <Line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#1f1f24" strokeWidth={0.6} />
        <G transform={`rotate(45 ${cx} ${cy})`}>
          <Path d={`M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`} fill={levelColor(0.45)} opacity={0.22} stroke={levelColor(0.5)} strokeWidth={1.4} />
        </G>
        <SvgText x={cx} y={top + 26} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>M</SvgText>
        <SvgText x={cx - r - 2} y={cy + 3} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>L</SvgText>
        <SvgText x={cx + r + 2} y={cy + 3} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.mono}>R</SvgText>
        {/* correlation bar */}
        <Rect x={x0 + 6} y={bot - 22} width={100} height={10} rx={2} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
        <Rect x={x0 + 6 + 50} y={bot - 22} width={corr * 50} height={10} fill={corr < 0 ? PEAK_RED : levelColor(0.5)} />
        <SvgText x={x0 + 6} y={bot - 26} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.mono}>−1</SvgText>
        <SvgText x={x0 + 106} y={bot - 26} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>+1</SvgText>
        <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`width ×${wmult.toFixed(2)} · correlation ${corr.toFixed(2)}`}</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={corr < 0.3 ? PEAK_RED : ink.dim} fontFamily={fonts.barlowRegular}>{corr < 0.3 ? 'wide here, hollow in mono — the fold cancels the sides' : 'model: side energy half the mid — check the real fold'}</SvgText>
      </Svg>
    );
  }
  if (view === 'meters') {
    const peak = -12 + amount * 12;
    const lufs = -24 + amount * 12;
    const bar = (x: number, db: number, lo: number, lbl: string, tint: string) => {
      const l = Math.max(0, Math.min(1, (db - lo) / -lo));
      const h = (bot - top - 42) * l;
      return (
        <G key={lbl}>
          <Rect x={x} y={top + 30} width={34} height={bot - top - 42} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
          <Rect x={x + 1} y={bot - 12 - h} width={32} height={h} fill={tint} />
          <SvgText x={x + 17} y={bot - 1} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{lbl}</SvgText>
          <SvgText x={x + 17} y={top + 26} fontSize={FONT_S} fill={tint} textAnchor="middle" fontFamily={fonts.mono}>{db.toFixed(1)}</SvgText>
        </G>
      );
    };
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('METERS · verify, never guess')}
        {bar(x0 + 20, peak, -60, 'PEAK', levelColorForDb(peak))}
        {bar(x0 + 70, peak + 0.6, -60, 'TRUE PK', peak + 0.6 > 0 ? PEAK_RED : levelColorForDb(peak + 0.6))}
        {bar(x0 + 120, lufs, -36, 'LUFS', levelColorForDb(lufs, -36, 0))}
        <Rect x={x0 + 180} y={top + 30} width={120} height={bot - top - 42} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
        {ov ? ov.hi.map((hi, c) => {
          const n = ov.hi.length;
          const cw2 = 118 / n;
          const h = (bot - top - 42) * ov.level[c];
          return <Rect key={c} x={x0 + 181 + c * cw2} y={bot - 12 - h} width={Math.max(0.6, cw2)} height={h} fill={levelColor(ov.level[c])} opacity={0.9} />;
        }) : <SvgText x={x0 + 240} y={midY} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>spectrum / history</SvgText>}
        <SvgText x={x0 + 240} y={bot - 1} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PROGRAMME LEVEL HISTORY</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>louder moves every meter — numbers verify, never decide</SvgText>
      </Svg>
    );
  }
  if (view === 'monitor') {
    const chain: PathDevice[] = ['daw', 'dac', 'monitorCtl', 'active'];
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('MONITORING CHAIN · trust what you hear')}
        {chain.map((d, i) => (
          <G key={d}>
            <GearInSvg kind={GLYPH_FOR[d]} id={`ts-${d}`} x={x0 + 40 + i * 76} y={midY - 4} size={50} />
            <SvgText x={x0 + 40 + i * 76} y={midY + 30} fontSize={FONT_S} fill={ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{SHORT_FOR[d]}</SvgText>
            {i < chain.length - 1 ? <Path d={`M${x0 + 68 + i * 76} ${midY - 4} l12 0 m-4 -3 l4 3 l-4 3`} stroke={ink.green} strokeWidth={1.3} fill="none" /> : null}
          </G>
        ))}
        <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>{`listening level ${Math.round(70 + amount * 20)} dB SPL — keep it moderate and repeatable`}</SvgText>
      </Svg>
    );
  }
  // playback / editing: the programme with a fade drawn at the tail
  const fadeSec = amount * 4;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      {frame('PLAYBACK & EDITING · fades, tops and tails')}
      {ov ? ov.hi.map((hi, c) => {
        const n = ov.hi.length;
        const cw2 = (x1 - x0 - 8) / n;
        const t = (c / n) * ov.seconds;
        const fadeG = fadeSec > 0 && t > ov.seconds - fadeSec ? (ov.seconds - t) / fadeSec : 1;
        const yT = midY - hi * fadeG * (bot - top - 40) / 2;
        const yB = midY - ov.lo[c] * fadeG * (bot - top - 40) / 2;
        return <Rect key={c} x={x0 + 4 + c * cw2} y={yT} width={Math.max(0.6, cw2)} height={Math.max(0.6, yB - yT)} fill={levelColor(ov.level[c] * fadeG)} />;
      }) : <SvgText x={(x0 + x1) / 2} y={midY} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>the programme draws here after the first render</SvgText>}
      <Line x1={x0 + 4} y1={midY} x2={x1 - 4} y2={midY} stroke={MIDLINE_BLUE} strokeWidth={0.8} />
      {fadeSec > 0 ? <Line x1={x1 - 4 - (fadeSec / 10) * (x1 - x0 - 8)} y1={top + 20} x2={x1 - 4} y2={midY} stroke={ink.amber} strokeWidth={1} strokeDasharray="3,2" /> : null}
      <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`fade-out ${fadeSec.toFixed(1)} s`}</SvgText>
      <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>editing the stereo programme: fades, gaps, tops and tails</SvgText>
    </Svg>
  );
}

/* ── 5 · the workflow ────────────────────────────────────────────────────── */

export const FLOW_ASPECT = 360 / 150;

export const WORKFLOW_STEPS: readonly { id: string; name: string; short: string; detail: string }[] = [
  { id: 'receive', name: 'Receive and inspect', short: 'INSPECT', detail: 'Format, version, sample rate, bit depth, channel layout, notes, references, delivery requirements.' },
  { id: 'listen', name: 'Listen before processing', short: 'LISTEN', detail: 'The whole mix, start to end. Strengths, concerns, against the goals and references.' },
  { id: 'decide', name: 'Decide whether it is ready', short: 'DECIDE', detail: 'What mastering can address vs what needs a revision — and say so now, not after.' },
  { id: 'change', name: 'Make considered changes', short: 'CHANGE', detail: 'Only when it serves the goal. Compare against the unprocessed mix at matched level.' },
  { id: 'sequence', name: 'Sequence and shape', short: 'SEQUENCE', detail: 'Order, spacing, fades, consistency across the set.' },
  { id: 'deliver', name: 'Prepare deliverables', short: 'DELIVER', detail: 'By destination — verify the current spec rather than assume one setting.' },
  { id: 'qc', name: 'Quality-check the exports', short: 'QC', detail: 'Reopen and audition: beginning, end, fades, channel count, naming, metadata, requested limits.' },
];

export function WorkflowStage({ width, height, index }: { width: number; height: number; index: number }) {
  const n = WORKFLOW_STEPS.length;
  const bw = 44;
  const gap = (W - 12 - bw * n) / (n - 1);
  const y = 30;
  const bh = 36;
  const cur = WORKFLOW_STEPS[index];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} 150`}>
      <SvgText x={6} y={16} fontSize={FONT} fill={ink.dim} fontFamily={fonts.oswaldMedium}>A COMMON WORKFLOW · order and scope vary by project</SvgText>
      {WORKFLOW_STEPS.map((s, i) => {
        const x = 6 + i * (bw + gap);
        const lit = i === index;
        const past = i < index;
        return (
          <G key={s.id}>
            <Rect x={x} y={y} width={bw} height={bh} rx={5} fill={lit ? ink.boxLit : ink.box} stroke={lit ? ink.amber : past ? ink.green : ink.stroke} strokeWidth={lit ? 1.6 : 1} />
            <SvgText x={x + bw / 2} y={y + 15} fontSize={FONT_S} fill={lit ? ink.amber : past ? ink.green : ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{i + 1}</SvgText>
            <SvgText x={x + bw / 2} y={y + 29} fontSize={FONT_S} fill={lit ? ink.amber : ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{s.short}</SvgText>
            {i < n - 1 ? <Line x1={x + bw + 1} y1={y + bh / 2} x2={x + bw + gap - 1} y2={y + bh / 2} stroke={past ? ink.green : ink.stroke} strokeWidth={1.2} /> : null}
          </G>
        );
      })}
      <Rect x={6} y={80} width={W - 12} height={62} rx={6} fill={ink.box} stroke="rgba(255,198,77,.35)" strokeWidth={1} />
      <SvgText x={14} y={98} fontSize={F2} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{`${index + 1} · ${cur.name.toUpperCase()}`}</SvgText>
      {wrapWords(cur.detail, 58).slice(0, 2).map((line, i) => (
        <SvgText key={i} x={14} y={116 + i * 14} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowRegular}>{line}</SvgText>
      ))}
    </Svg>
  );
}

/** Greedy word wrap for SVG labels. */
export function wrapWords(text: string, maxChars: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}

/* ── 6 · translation ─────────────────────────────────────────────────────── */

export const TRANSLATION_ASPECT = 360 / 170;

export type PlaybackSystem = { id: string; name: string; bands: EqBandSpec[]; note: string; mono?: boolean };

/** Rough bandwidth models of playback systems — ILLUSTRATIVE shapes for a
 *  translation picture, not measurements of any product. */
export const PLAYBACK_SYSTEMS: readonly PlaybackSystem[] = [
  { id: 'mains', name: 'Main monitors (treated room)', bands: [], note: 'The reference: full range, the room under control. Decisions are made here.' },
  { id: 'phones', name: 'Headphones', bands: [{ type: 'peak', freq: 3000, q: 1.2, gainDb: 2 }, { type: 'lowShelf', freq: 100, q: 0.7, gainDb: 1.5 }], note: 'Detail and no room — but bass and image are judged differently on them. A check.' },
  { id: 'small', name: 'Small speaker', bands: [{ type: 'highPass', freq: 150, q: 0.7, gainDb: 0 }, { type: 'peak', freq: 2500, q: 1, gainDb: 3 }], note: 'Little below 150 Hz; the mids carry everything. Does the kick still exist as a pattern?' },
  { id: 'phone', name: 'Phone speaker (mono)', bands: [{ type: 'highPass', freq: 400, q: 0.8, gainDb: 0 }, { type: 'peak', freq: 3500, q: 1, gainDb: 4 }], note: 'Mono and no low end. Width disappears; anything that only lived in the sides goes with it.', mono: true },
  { id: 'car', name: 'Car', bands: [{ type: 'lowShelf', freq: 120, q: 0.7, gainDb: 5 }, { type: 'highShelf', freq: 6000, q: 0.7, gainDb: -3 }], note: 'Bass-heavy, dull, noisy. Vocals and top end have to survive the road noise.' },
];

export function TranslationStage({ width, height, system, programmeDb }: { width: number; height: number; system: PlaybackSystem; programmeDb: { f: number; db: number }[] }) {
  const H = 170;
  const x0 = 34;
  const x1 = W - 10;
  const top = 18;
  const bot = 140;
  const yOf = (db: number) => bot - ((Math.max(-48, Math.min(6, db)) + 48) / 54) * (bot - top);
  const ref = programmeDb.map((p, i) => `${i === 0 ? 'M' : 'L'}${fx(p.f, x0, x1).toFixed(1)} ${yOf(p.db).toFixed(1)}`).join(' ');
  const heard = programmeDb.map((p, i) => `${i === 0 ? 'M' : 'L'}${fx(p.f, x0, x1).toFixed(1)} ${yOf(p.db + eqResponseDb(system.bands, p.f)).toFixed(1)}`).join(' ');
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      {[0, -12, -24, -36].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x1} y2={yOf(db)} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={x0 - 3} y={yOf(db) + 3.5} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db}</SvgText>
        </G>
      ))}
      {[100, 1000, 10000].map((f) => (
        <G key={f}>
          <Line x1={fx(f, x0, x1)} y1={top} x2={fx(f, x0, x1)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={fx(f, x0, x1)} y={bot + 12} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{f >= 1000 ? `${f / 1000}k` : f}</SvgText>
        </G>
      ))}
      {programmeDb.length ? <Path d={ref} stroke={ink.dim} strokeWidth={1.2} fill="none" strokeDasharray="3,2" /> : null}
      {programmeDb.length ? <Path d={heard} stroke={system.mono ? colors.orange : ink.amber} strokeWidth={2} fill="none" /> : null}
      <SvgText x={x0 + 4} y={top + 12} fontSize={FONT} fill={ink.text} fontFamily={fonts.oswaldMedium}>{`PROGRAMME SPECTRUM · as heard on: ${system.name.toUpperCase()}`}</SvgText>
      <SvgText x={x1 - 4} y={top + 26} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>dashed = the master as mastered</SvgText>
      {system.mono ? <SvgText x={x1 - 4} y={top + 38} fontSize={FONT_S} fill={colors.orange} textAnchor="end" fontFamily={fonts.mono}>MONO FOLD</SvgText> : null}
      <SvgText x={x0} y={H - 4} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>{system.note.length > 58 ? system.note.slice(0, 56) + '…' : system.note}</SvgText>
    </Svg>
  );
}

/* ── 7 · the delivery sheet ──────────────────────────────────────────────── */

export const SHEET_ASPECT = 360 / 200;

export function DeliverySheetStage({ width, height, title, brief, items, confirmed }: { width: number; height: number; title: string; brief: string; items: readonly string[]; confirmed: ReadonlySet<number> }) {
  const H = 200;
  const done = items.filter((_, i) => confirmed.has(i)).length;
  const complete = done === items.length;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={8} y={6} width={W - 16} height={H - 12} rx={6} fill="#141416" stroke={complete ? ink.green : ink.stroke} strokeWidth={1.2} />
      <Rect x={8} y={6} width={W - 16} height={26} rx={6} fill={complete ? '#0f1d14' : '#1a1812'} />
      <SvgText x={16} y={23} fontSize={F2} fill={complete ? ink.green : ink.amber} fontFamily={fonts.oswaldMedium}>{`DELIVERY CHECKLIST · ${title.toUpperCase()}`}</SvgText>
      <SvgText x={W - 16} y={23} fontSize={FONT} fill={complete ? ink.green : ink.dim} textAnchor="end" fontFamily={fonts.mono}>{`${done} / ${items.length}`}</SvgText>
      {wrapWords(brief, 70).slice(0, 2).map((line, i) => (
        <SvgText key={i} x={16} y={46 + i * 13} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>{line}</SvgText>
      ))}
      {items.map((it, i) => {
        const on = confirmed.has(i);
        const y = 80 + i * 22;
        return (
          <G key={i}>
            <Rect x={16} y={y - 9} width={11} height={11} rx={2} fill={on ? ink.green : 'none'} stroke={on ? ink.green : ink.dim} strokeWidth={1} />
            {on ? <Path d={`M18.5 ${y - 3.5} l3 3 l5 -6`} stroke="#000" strokeWidth={1.6} fill="none" /> : null}
            <SvgText x={33} y={y} fontSize={FONT} fill={on ? ink.text : ink.dim} fontFamily={fonts.barlowRegular}>{it.length > 62 ? it.slice(0, 60) + '…' : it}</SvgText>
          </G>
        );
      })}
      <SvgText x={16} y={H - 12} fontSize={FONT} fill={complete ? ink.green : ink.amber} fontFamily={fonts.oswaldMedium}>{complete ? 'CONFIRMED — READY TO EXPORT TO THIS SPEC' : 'CONFIRM EVERY LINE BEFORE EXPORTING'}</SvgText>
    </Svg>
  );
}

/* ── 8 · the sequence ────────────────────────────────────────────────────── */

export const SEQ_ASPECT = 360 / 140;

export function SequenceStage({ width, height, blocks, totalSec, maxStepLu, crossfade }: { width: number; height: number; blocks: readonly SeqBlock[]; totalSec: number; maxStepLu: number; crossfade: boolean }) {
  const H = 140;
  const x0 = 10;
  const x1 = W - 10;
  const top = 30;
  const bot = 100;
  const xs = (t: number) => x0 + (t / Math.max(1, totalSec)) * (x1 - x0);
  const lufsLevel = (l: number) => Math.max(0, Math.min(1, (l + 30) / 24)); // −30…−6 LUFS on the ramp
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <SvgText x={x0} y={16} fontSize={FONT} fill={ink.dim} fontFamily={fonts.oswaldMedium}>RUNNING ORDER · length × loudness</SvgText>
      <SvgText x={x1} y={16} fontSize={FONT} fill={maxStepLu > 6 ? ink.amber : ink.text} textAnchor="end" fontFamily={fonts.mono}>{`largest step ${maxStepLu.toFixed(1)} LU`}</SvgText>
      <Line x1={x0} y1={bot + 2} x2={x1} y2={bot + 2} stroke={ink.stroke} strokeWidth={0.8} />
      {blocks.map((b, i) => {
        const bx0 = xs(b.startSec);
        const bx1 = xs(b.endSec);
        const h = 20 + lufsLevel(b.lufs) * (bot - top - 20);
        const tint = levelColor(lufsLevel(b.lufs));
        const fadeW = Math.min(bx1 - bx0, (b.fadeOutSec / Math.max(1, totalSec)) * (x1 - x0));
        return (
          <G key={b.id}>
            <Rect x={bx0} y={bot - h} width={Math.max(2, bx1 - bx0 - fadeW)} height={h} fill={tint} opacity={0.75} />
            {fadeW > 0 ? <Polygon points={`${bx1 - fadeW},${bot - h} ${bx1},${bot} ${bx1 - fadeW},${bot}`} fill={tint} opacity={0.75} /> : null}
            {crossfade && i < blocks.length - 1 ? <Rect x={bx1 - 3} y={bot - 12} width={6} height={12} fill={ink.cyan} opacity={0.8} /> : null}
            <SvgText x={(bx0 + bx1) / 2} y={bot - h - 4} fontSize={FONT_S} fill={tint} textAnchor="middle" fontFamily={fonts.mono}>{`${b.lufs.toFixed(1)}`}</SvgText>
            <SvgText x={(bx0 + bx1) / 2} y={bot + 14} fontSize={FONT_S} fill={ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b.title.toUpperCase().slice(0, 14)}</SvgText>
          </G>
        );
      })}
      <SvgText x={x0} y={H - 6} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>{`total ${Math.floor(totalSec / 60)}:${String(Math.round(totalSec % 60)).padStart(2, '0')} · LUFS estimates · ${crossfade ? 'crossfades on' : 'gaps between tracks'}`}</SvgText>
      <Circle cx={x1 - 4} cy={H - 9} r={2} fill={ink.green} />
    </Svg>
  );
}

/** Convenience: a dB → ramp tint for stage text (exported for modules). */
export const dbTint = (db: number) => levelColorForDb(db);
export { linToDb };
