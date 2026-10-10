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
import { useMemo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { MIDLINE_BLUE, levelColor, levelColorForDb, splColorForDba } from '../../../features/tools/levelColor';
import { eqResponseDb, type EqBandSpec } from '../../../features/lab/fxViz';
import { GearInSvg, type GlyphKind } from '../soundsystems/art/gearArt';
import { HeadIconSvg } from '../../../features/lab/headIconsSvg';
import { MonitorPlan } from '../roomdesign/studioPlanArt';
import { ExpandableFigure } from '../kit/ExpandableFigure';
import { PEAK_RED } from './kit';
import { XF_OVERLAP_SEC, fitFontBoost, linToDb, perceivedBalanceShift, type Overview, type PathDevice, type PathGrade, type SeqBlock } from './masteringEngine';
import { CONTROL_ITEMS, type ControlItem } from './masteringContent';

export const W = 360;
/** Smallest label in design units (≈ 9.7 pt on a 390-wide phone). */
export const FONT = 11;
const F2 = 12.5;
/** Secondary labels: still ≥ 9 pt at the narrowest phone glass (0.88 × 10.5). */
export const FONT_S = 10.5;

/**
 * The 9 pt floor on a SHORT phone. The four drawings that are taller than
 * about 360 / 2 (the tool shelf, the translation plot, the delivery sheet and
 * the sequence) are height-limited once the rack drops the glass a size
 * (iPhone SE, 667 pt tall): FONT_S then lands at 7.8–8.5 pt. Those stages
 * scale their fonts — and the character budget they wrap to — by this boost
 * (1 everywhere else; see masteringEngine.fitFontBoost, node-tested).
 */
const boostFor = (width: number) => fitFontBoost(width, W, FONT_S);

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

export const PIPELINE = ['RECORDING', 'EDITING', 'MIXING', 'MASTERING', 'RELEASE'] as const;
export const PIPELINE_SHORT = ['REC', 'EDIT', 'MIX', 'MASTER', 'RELEASE'] as const;
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
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} 132`}>
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
export function WaveOverviewStage({ width, height, ov, grDb, maxGrDb, ceilingDb, label, matchDb, progress, playing, pending, preparing, onTap }: {
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
  /** A version is queued (rendering): a tap on the glass cancels it, the
   *  same as the dock's STOP key; it used to queue the play again. */
  pending?: boolean;
  /** A quiet pre-render is under way (useMasterPlayback `preparing`): the
   *  glass says so honestly; a tap joins it and plays when it lands. */
  preparing?: boolean;
  /** TAP-TO-TOGGLE (house rule, the tools' displays): a tap on the glass
   *  plays the shown version or stops it — in FULL SCREEN too, where the
   *  same render is drawn. The dock keys stay the named transport. */
  onTap?: () => void;
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
    <Pressable
      style={{ width, height }}
      onPress={onTap}
      disabled={!onTap}
      accessibilityRole={onTap ? 'button' : undefined}
      accessibilityLabel={onTap ? (playing || pending ? `Stop ${label}` : preparing ? `Preparing the audio. Play ${label} when ready` : `Play ${label}`) : undefined}
    >
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
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
          <SvgText x={(x0 + x1) / 2} y={mid + 4} fontSize={F2} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>{preparing ? 'preparing the audio… ▶ plays as soon as it is ready' : 'press ▶ on a version — the render draws here'}</SvgText>
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
    </Pressable>
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
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} 150`}>
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
  const curveFor = (b: number, t: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const f = 20 * Math.pow(1000, i / 60);
      const lf = Math.max(0, Math.min(1, (Math.log10(700) - Math.log10(f)) / (Math.log10(700) - Math.log10(50))));
      const hf = Math.max(0, Math.min(1, (Math.log10(f) - Math.log10(2500)) / (Math.log10(12000) - Math.log10(2500))));
      const db = b * lf * lf + t * hf;
      pts.push(`${i === 0 ? 'M' : 'L'}${fx(f, x0, x1).toFixed(1)} ${yOf(db).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const pts = [curveFor(bassDb, trebleDb)];
  // Ghost curves at three fixed levels, so the live curve has company.
  const ghosts = [65, 83, 95].map((l) => {
    const s = perceivedBalanceShift(l);
    return { l, d: curveFor(s.bassDb, s.trebleDb), y: yOf(s.bassDb * 0.9) };
  });
  const barX = 322;
  const barTop = 18;
  const barBot = 136;
  const lvl = Math.max(0, Math.min(1, (levelDb - 40) / 60));
  const barY = barBot - lvl * (barBot - barTop);
  const tint = splColorForDba(levelDb);
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
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
      {ghosts.map((g) => (
        <G key={g.l}>
          <Path d={g.d} stroke={splColorForDba(g.l)} strokeWidth={1} fill="none" opacity={0.45} strokeDasharray="3,3" />
          <SvgText x={x0 + 6} y={g.y + (g.l === 83 ? -3 : g.l === 65 ? 11 : -3)} fontSize={FONT_S} fill={splColorForDba(g.l)} opacity={0.8} fontFamily={fonts.mono}>{`${g.l} dB`}</SvgText>
        </G>
      ))}
      <Path d={pts[0]} stroke={ink.amber} strokeWidth={2} fill="none" />
      <SvgText x={x0 + 4} y={top + 12} fontSize={FONT} fill={ink.text} fontFamily={fonts.oswaldMedium}>APPARENT BALANCE vs 1 kHz · dB</SvgText>
      <SvgText x={x1 - 4} y={bot - 6} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>
        {`bass ${bassDb > 0 ? '+' : ''}${bassDb.toFixed(1)} · treble ${trebleDb > 0 ? '+' : ''}${trebleDb.toFixed(1)} dB`}
      </SvgText>
      <SvgText x={x0 + 4} y={bot + 24} fontSize={FONT} fill={ink.dim} fontFamily={fonts.barlowRegular}>50 Hz · ISO 226-style model, simplified · vs 83 dB SPL (C)</SvgText>
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
      <SvgText x={barX + 9} y={barBot + 28} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>dB SPL (C)</SvgText>
    </Svg>
  );
}

/* ── 3 · build a monitoring path ─────────────────────────────────────────── */

export const PATH_ASPECT = 360 / 164;

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
export const PATH_ASPECT_H = 164;

/** The three-state verdict (cognitive review 2026-10-01, finding 5):
 *  COMPLETE (green) · WORKS · MINIMAL (amber) · CHECK THE CHAIN (amber) ·
 *  EMPTY. The one-line reason comes from the engine and wraps to two. */
export function MonitorPathStage({ width, height, chain, grade, reason, next }: {
  width: number;
  height: number;
  chain: readonly PathDevice[];
  grade: PathGrade;
  reason: string;
  /** The device the DEVICE key has chosen but not yet connected: drawn as a
   *  ghost in the next free slot, so choosing changes the picture before
   *  + CONNECT does (every dock control changes the display). */
  next?: PathDevice;
}) {
  const slots = 5;
  const sw = (W - 12) / slots;
  const cy = 60;
  const tone = grade === 'complete' ? ink.green : grade === 'empty' ? ink.dim : ink.amber;
  const fill = grade === 'complete' ? '#0f1d14' : grade === 'empty' ? '#121215' : '#17130d';
  const headline = grade === 'complete' ? 'PATH COMPLETE' : grade === 'minimal' ? 'WORKS · MINIMAL' : grade === 'fail' ? 'CHECK THE CHAIN' : 'EMPTY CHAIN';
  const lines = wrapWords(reason, 60).slice(0, 2);
  const ghostAt = next && !chain.includes(next) && chain.length < slots ? chain.length : -1;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${PATH_ASPECT_H}`}>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.dim} fontFamily={fonts.oswaldMedium}>PLAYBACK → CONVERSION → LEVEL → AMPLIFICATION → AIR</SvgText>
      {Array.from({ length: slots }, (_, i) => {
        const d = chain[i];
        const cx = 6 + i * sw + sw / 2;
        const ghost = i === ghostAt ? next : undefined;
        return (
          <G key={i}>
            <Rect x={6 + i * sw + 3} y={28} width={sw - 6} height={70} rx={6} fill={d ? ink.box : '#0d0d10'} stroke={d ? tone : ghost ? ink.amber : ink.stroke} strokeWidth={d ? 1.3 : 0.8} strokeDasharray={d ? undefined : '3,3'} />
            {d ? (
              <GearInSvg kind={GLYPH_FOR[d]} id={`mp-${i}-${d}`} x={cx} y={cy} size={46} />
            ) : ghost ? (
              <G opacity={0.4}>
                <GearInSvg kind={GLYPH_FOR[ghost]} id={`mp-ghost-${ghost}`} x={cx} y={cy} size={46} />
              </G>
            ) : (
              <SvgText x={cx} y={cy + 4} fontSize={FONT} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{`SLOT ${i + 1}`}</SvgText>
            )}
            <SvgText x={cx} y={92} fontSize={FONT_S} fill={d ? ink.text : ghost ? ink.amber : ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{d ? SHORT_FOR[d] : ghost ? `${SHORT_FOR[ghost]}?` : '—'}</SvgText>
            {d && chain[i + 1] ? <Path d={`M${6 + (i + 1) * sw - 3} ${cy} l6 0 m-3 -3 l3 3 l-3 3`} stroke={ink.green} strokeWidth={1.3} fill="none" /> : null}
          </G>
        );
      })}
      <Rect x={6} y={108} width={W - 12} height={50} rx={5} fill={fill} stroke={tone} strokeWidth={1} />
      <SvgText x={12} y={122} fontSize={FONT} fill={tone} fontFamily={fonts.oswaldMedium}>{headline}</SvgText>
      {lines.map((l, i) => (
        <SvgText key={i} x={12} y={136 + i * 13} fontSize={FONT_S} fill={ink.text} fontFamily={fonts.barlowRegular}>{l}</SvgText>
      ))}
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
 *  LEVEL (amplitude) is `sideRatio` of its mid level (0.5 is a typical mix). */
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
  // The 9 pt floor on a short phone (see boostFor): 1 at or above 1 : 1.
  const bst = boostFor(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
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
      <SvgText x={x0 + 4} y={top + 12} fontSize={fs} fill={ink.text} fontFamily={fonts.oswaldMedium}>{title}</SvgText>
    </>
  );

  if (view === 'eq' || view === 'analog') {
    return (
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame(view === 'eq' ? 'TILT EQ · broad tonal shaping' : 'ANALOG EQ · a different hand, same decision')}
        {[-12, -6, 0, 6, 12].map((db) => (
          <G key={db}>
            <Line x1={x0} y1={midY - (db / 12) * ((bot - top) / 2)} x2={x1} y2={midY - (db / 12) * ((bot - top) / 2)} stroke={db === 0 ? MIDLINE_BLUE : '#1f1f24'} strokeWidth={db === 0 ? 1 : 0.6} />
            <SvgText x={x0 - 3} y={midY - (db / 12) * ((bot - top) / 2) + 3.5} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db > 0 ? `+${db}` : db}</SvgText>
          </G>
        ))}
        {[100, 1000, 10000].map((f) => (
          <G key={f}>
            <Line x1={fx(f, x0, x1)} y1={top} x2={fx(f, x0, x1)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
            <SvgText x={fx(f, x0, x1)} y={bot + 12} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{f >= 1000 ? `${f / 1000}k` : f}</SvgText>
          </G>
        ))}
        <Path d={curve} stroke={view === 'eq' ? ink.amber : colors.orange} strokeWidth={2} fill="none" />
        <SvgText x={x1 - 4} y={bot - 6} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`${view === 'eq' ? 'tilt' : 'colour'} ±${Math.abs(amount * 3).toFixed(1)} dB at the ends · ${amount > 0 ? 'brighter' : amount < 0 ? 'warmer' : 'flat'}`}</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>{view === 'eq' ? 'one move on every element — compare at matched level' : 'neither analog nor digital is "better" — different tools'}</SvgText>
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
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame(ratio >= 10 ? 'LIMITER · a ceiling on peaks' : 'COMPRESSOR · gentle control')}
        {[-48, -36, -24, -12, 0].map((db) => {
          const xi = x0 + ((db + 60) / 60) * (x1 - x0);
          const yo = bot - ((db + 60) / 60) * (bot - top);
          return (
            <G key={db}>
              <Line x1={xi} y1={bot} x2={xi} y2={bot - 4} stroke={ink.dim} strokeWidth={0.8} />
              <SvgText x={xi} y={bot + 12} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{db}</SvgText>
              <Line x1={x0} y1={yo} x2={x0 + 4} y2={yo} stroke={ink.dim} strokeWidth={0.8} />
              <SvgText x={x0 - 3} y={yo + 3.5} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db}</SvgText>
            </G>
          );
        })}
        <Line x1={x0} y1={bot} x2={x1} y2={top} stroke="#1f1f24" strokeWidth={0.8} strokeDasharray="3,3" />
        <Path d={pts.join(' ')} stroke={levelColor(Math.min(1, amount))} strokeWidth={2} fill="none" />
        <Line x1={x0 + ((thr + 60) / 60) * (x1 - x0)} y1={top} x2={x0 + ((thr + 60) / 60) * (x1 - x0)} y2={bot} stroke={ink.amber} strokeWidth={0.8} strokeDasharray="2,2" />
        <SvgText x={x0 + ((thr + 60) / 60) * (x1 - x0) - 3} y={top + 26} fontSize={fsS} fill={ink.amber} textAnchor="end" fontFamily={fonts.mono}>thr {thr} dB</SvgText>
        <SvgText x={x1 - 4} y={bot - 6} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`ratio ${ratio.toFixed(1)} : 1`}</SvgText>
        <SvgText x={x1 - 4} y={bot + 12} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>in dB →</SvgText>
        <SvgText x={x0 + 6} y={top + 26} fontSize={fsS} fill={ink.dim} fontFamily={fonts.mono}>↑ out dB</SvgText>
        {/* ≤ 316 units at 11 (the old line ran to x 424 of 360 and was cut
            off mid-word on every phone and in full screen). */}
        <SvgText x={x0} y={H - 4} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>a static curve (no attack, release or knee) · peaks down past thr</SvgText>
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
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('STEREO WIDTH · with the mono check')}
        <Line x1={cx} y1={top + 4} x2={cx} y2={bot - 4} stroke="#1f1f24" strokeWidth={0.6} />
        <Line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#1f1f24" strokeWidth={0.6} />
        <G transform={`rotate(45 ${cx} ${cy})`}>
          <Path d={`M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`} fill={levelColor(0.45)} opacity={0.22} stroke={levelColor(0.5)} strokeWidth={1.4} />
        </G>
        <SvgText x={cx} y={top + 26} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>M</SvgText>
        <SvgText x={cx - r - 2} y={cy + 3} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>L</SvgText>
        <SvgText x={cx + r + 2} y={cy + 3} fontSize={fsS} fill={ink.dim} fontFamily={fonts.mono}>R</SvgText>
        {/* correlation bar */}
        <Rect x={x0 + 6} y={bot - 22} width={100} height={10} rx={2} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
        <Rect x={x0 + 6 + 50} y={bot - 22} width={corr * 50} height={10} fill={corr < 0 ? PEAK_RED : levelColor(0.5)} />
        <SvgText x={x0 + 6} y={bot - 26} fontSize={fsS} fill={ink.dim} fontFamily={fonts.mono}>−1</SvgText>
        <SvgText x={x0 + 106} y={bot - 26} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>+1</SvgText>
        <SvgText x={x1 - 4} y={bot - 6} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`width ×${wmult.toFixed(2)} · correlation ${corr.toFixed(2)}`}</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={fs} fill={corr < 0.3 ? PEAK_RED : ink.dim} fontFamily={fonts.barlowRegular}>{corr < 0.3 ? 'wide here, hollow in mono — the fold cancels the sides' : 'model: side level half the mid — check the real fold'}</SvgText>
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
          <SvgText x={x + 17} y={bot - 1} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{lbl}</SvgText>
          <SvgText x={x + 17} y={top + 26} fontSize={fsS} fill={tint} textAnchor="middle" fontFamily={fonts.mono}>{db.toFixed(1)}</SvgText>
        </G>
      );
    };
    return (
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('METERS · verify, never guess')}
        {bar(x0 + 20, peak, -60, 'PEAK', levelColorForDb(peak))}
        {bar(x0 + 70, peak + 0.6, -60, 'TP MODEL', peak + 0.6 > 0 ? PEAK_RED : levelColorForDb(peak + 0.6))}
        {bar(x0 + 120, lufs, -36, 'LUFS', levelColorForDb(lufs, -36, 0))}
        <Rect x={x0 + 180} y={top + 30} width={120} height={bot - top - 42} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
        {ov ? ov.hi.map((hi, c) => {
          const n = ov.hi.length;
          const cw2 = 118 / n;
          const h = (bot - top - 42) * ov.level[c];
          return <Rect key={c} x={x0 + 181 + c * cw2} y={bot - 12 - h} width={Math.max(0.6, cw2)} height={h} fill={levelColor(ov.level[c])} opacity={0.9} />;
        }) : <SvgText x={x0 + 240} y={midY} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>spectrum / history</SvgText>}
        <SvgText x={x0 + 240} y={bot - 1} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PROGRAMME LEVEL HISTORY</SvgText>
        <SvgText x={x0} y={H - 16} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>TP MODEL = peak +0.6 · typically 0.3–1 dB over on dense material</SvgText>
        <SvgText x={x0} y={H - 4} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>louder moves every meter — numbers verify, never decide</SvgText>
      </Svg>
    );
  }
  if (view === 'monitor') {
    const chain: PathDevice[] = ['daw', 'dac', 'monitorCtl', 'active'];
    return (
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        {frame('MONITORING CHAIN · trust what you hear')}
        {chain.map((d, i) => (
          <G key={d}>
            <GearInSvg kind={GLYPH_FOR[d]} id={`ts-${d}`} x={x0 + 40 + i * 76} y={midY - 4} size={50} />
            <SvgText x={x0 + 40 + i * 76} y={midY + 30} fontSize={fsS} fill={ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{SHORT_FOR[d]}</SvgText>
            {i < chain.length - 1 ? <Path d={`M${x0 + 68 + i * 76} ${midY - 4} l12 0 m-4 -3 l4 3 l-4 3`} stroke={ink.green} strokeWidth={1.3} fill="none" /> : null}
          </G>
        ))}
        <SvgText x={x0} y={H - 4} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>{`listening level ${Math.round(70 + amount * 20)} dB SPL (C) — keep it moderate and repeatable`}</SvgText>
      </Svg>
    );
  }
  // playback / editing: the programme with a fade drawn at the tail
  const fadeSec = amount * 4;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      {frame('PLAYBACK & EDITING · fades, tops and tails')}
      {ov ? ov.hi.map((hi, c) => {
        const n = ov.hi.length;
        const cw2 = (x1 - x0 - 8) / n;
        const t = (c / n) * ov.seconds;
        const fadeG = fadeSec > 0 && t > ov.seconds - fadeSec ? (ov.seconds - t) / fadeSec : 1;
        const yT = midY - hi * fadeG * (bot - top - 40) / 2;
        const yB = midY - ov.lo[c] * fadeG * (bot - top - 40) / 2;
        return <Rect key={c} x={x0 + 4 + c * cw2} y={yT} width={Math.max(0.6, cw2)} height={Math.max(0.6, yB - yT)} fill={levelColor(ov.level[c] * fadeG)} />;
      }) : <SvgText x={(x0 + x1) / 2} y={midY} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>the programme draws here after the first render</SvgText>}
      <Line x1={x0 + 4} y1={midY} x2={x1 - 4} y2={midY} stroke={MIDLINE_BLUE} strokeWidth={0.8} />
      {fadeSec > 0 ? <Line x1={x1 - 4 - (fadeSec / 10) * (x1 - x0 - 8)} y1={top + 20} x2={x1 - 4} y2={midY} stroke={ink.amber} strokeWidth={1} strokeDasharray="3,2" /> : null}
      <SvgText x={x1 - 4} y={bot - 6} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>{`fade-out ${fadeSec.toFixed(1)} s`}</SvgText>
      <SvgText x={x0} y={H - 4} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>editing the stereo programme: fades, gaps, tops and tails</SvgText>
    </Svg>
  );
}

/* ── 5 · the workflow ────────────────────────────────────────────────────── */

export const FLOW_ASPECT = 360 / 162;

export const WORKFLOW_STEPS: readonly { id: string; name: string; short: string; detail: string }[] = [
  { id: 'receive', name: 'Receive and inspect', short: 'INSPECT', detail: 'Format, version, sample rate, bit depth, channel layout, notes, references, delivery requirements — and a peak meter and a DC-offset check before monitoring at level.' },
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
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} 162`}>
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
      <Rect x={6} y={80} width={W - 12} height={76} rx={6} fill={ink.box} stroke="rgba(255,198,77,.35)" strokeWidth={1} />
      <SvgText x={14} y={98} fontSize={F2} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{`${index + 1} · ${cur.name.toUpperCase()}`}</SvgText>
      {wrapWords(cur.detail, 60).slice(0, 3).map((line, i) => (
        <SvgText key={i} x={14} y={115 + i * 13} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowRegular}>{line}</SvgText>
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

export const TRANSLATION_ASPECT = 360 / 196;

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

export const TRANSLATION_H = 196;

export function TranslationStage({ width, height, system, programmeDb }: { width: number; height: number; system: PlaybackSystem; programmeDb: { f: number; db: number }[] }) {
  const H = TRANSLATION_H;
  const x0 = 34;
  const x1 = W - 10;
  const top = 18;
  const bot = 150;
  const isRef = system.bands.length === 0 && !system.mono;
  // The 9 pt floor on a short phone (see boostFor): 1 at or above 1 : 1.
  const bst = boostFor(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  // Boosted fonts take more width: wrap to fewer characters and space the
  // stacked lines by the boosted line height.
  const noteLines = wrapWords(system.note, Math.floor(62 / bst)).slice(0, 2);
  const lh = 13 * bst;
  const yOf = (db: number) => bot - ((Math.max(-48, Math.min(6, db)) + 48) / 54) * (bot - top);
  const ref = programmeDb.map((p, i) => `${i === 0 ? 'M' : 'L'}${fx(p.f, x0, x1).toFixed(1)} ${yOf(p.db).toFixed(1)}`).join(' ');
  const heard = programmeDb.map((p, i) => `${i === 0 ? 'M' : 'L'}${fx(p.f, x0, x1).toFixed(1)} ${yOf(p.db + eqResponseDb(system.bands, p.f)).toFixed(1)}`).join(' ');
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
      {[0, -12, -24, -36].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x1} y2={yOf(db)} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={x0 - 3} y={yOf(db) + 3.5} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>{db}</SvgText>
        </G>
      ))}
      {[100, 1000, 10000].map((f) => (
        <G key={f}>
          <Line x1={fx(f, x0, x1)} y1={top} x2={fx(f, x0, x1)} y2={bot} stroke="#1f1f24" strokeWidth={0.6} />
          <SvgText x={fx(f, x0, x1)} y={bot + 12} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>{f >= 1000 ? `${f / 1000}k` : f}</SvgText>
        </G>
      ))}
      {programmeDb.length && !isRef ? <Path d={ref} stroke={ink.dim} strokeWidth={1.2} fill="none" strokeDasharray="3,2" /> : null}
      {programmeDb.length ? <Path d={heard} stroke={system.mono ? colors.orange : ink.amber} strokeWidth={2} fill="none" /> : null}
      {/* The two-line title on a backing plate (clash sweep 2026-10-10): the
          programme curve peaks near 0 dB, right where the title sits, and ran
          through the words. */}
      <Rect x={x0 + 1} y={top + 1} width={Math.min(x1 - x0 - 90, 150 * bst)} height={14 + lh} rx={2} fill="#0b0b0e" opacity={0.86} />
      <SvgText x={x0 + 4} y={top + 12} fontSize={fs} fill={ink.text} fontFamily={fonts.oswaldMedium}>PROGRAMME SPECTRUM · as heard on</SvgText>
      <SvgText x={x0 + 4} y={top + 12 + lh} fontSize={fs} fill={system.mono ? colors.orange : ink.amber} fontFamily={fonts.oswaldMedium}>{system.name.toUpperCase()}</SvgText>
      {!isRef ? <SvgText x={x1 - 4} y={top + 12} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>dashed = as mastered</SvgText> : <SvgText x={x1 - 4} y={top + 12} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.mono}>the reference</SvgText>}
      {system.mono ? <SvgText x={x1 - 4} y={top + 12 + lh} fontSize={fsS} fill={colors.orange} textAnchor="end" fontFamily={fonts.mono}>MONO FOLD</SvgText> : null}
      {noteLines.map((l, i) => (
        <SvgText key={i} x={x0} y={H - 4 - (noteLines.length - 1 - i) * lh} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>{l}</SvgText>
      ))}
    </Svg>
  );
}

/* ── 7 · the delivery sheet ──────────────────────────────────────────────── */

export const SHEET_H = 250;
export const SHEET_ASPECT = 360 / SHEET_H;

/** Every line wraps to two (cognitive review 2026-10-01, finding 26) — the
 *  sheet is the checklist, so a cut line is a cut requirement. */
export function DeliverySheetStage({ width, height, title, brief, items, confirmed }: { width: number; height: number; title: string; brief: string; items: readonly string[]; confirmed: ReadonlySet<number> }) {
  const H = SHEET_H;
  const done = items.filter((_, i) => confirmed.has(i)).length;
  const complete = done === items.length;
  // The 9 pt floor on a short phone (see boostFor): 1 at or above 1 : 1.
  const bst = boostFor(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const f2 = F2 * bst;
  // Boosted (a short phone): the brief drops to one line, the item pitch and
  // the two-line spacing grow with the fonts, and the footer line goes — the
  // header count and the green frame already carry the state, and the well
  // keeps the instruction. Nothing is cropped; every item still wraps to two.
  const boosted = bst > 1.1;
  // Measured against the font (toddler pass 1): one boosted brief line
  // ended mid-sentence with nothing to say so — it now ends in an ellipsis
  // (the well prints the brief in full); and at 56 / bst the vinyl item
  // wrapped to THREE lines and lost "sibilance" to the slice. 58 / bst keeps
  // every item to two lines, the longest ending at x 326 of 360.
  const briefAll = wrapWords(brief, Math.floor(70 / bst));
  const briefLines = boosted && briefAll.length > 1 ? [`${briefAll[0]} …`] : briefAll.slice(0, 2);
  const itemsTop = 46 + briefLines.length * 13 * bst + 8; // 80 on a tall phone
  const itemChars = bst > 1 ? 58 : 56;
  const wrapped = items.map((it) => wrapWords(it, Math.floor(itemChars / bst)).slice(0, 2));
  const pitch = (items.length > 5 ? 25 : 28) * bst;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={8} y={6} width={W - 16} height={H - 12} rx={6} fill="#141416" stroke={complete ? ink.green : ink.stroke} strokeWidth={1.2} />
      <Rect x={8} y={6} width={W - 16} height={26} rx={6} fill={complete ? '#0f1d14' : '#1a1812'} />
      {/* The destination's first word: the full name is on the bezel's tray
          and in the well; the sheet keeps room for the count at the right. */}
      <SvgText x={16} y={23} fontSize={f2} fill={complete ? ink.green : ink.amber} fontFamily={fonts.oswaldMedium}>{`DELIVERY CHECKLIST · ${title.toUpperCase().split(' ')[0]}`}</SvgText>
      <SvgText x={W - 16} y={23} fontSize={fs} fill={complete ? ink.green : ink.dim} textAnchor="end" fontFamily={fonts.mono}>{`${done} / ${items.length}`}</SvgText>
      {briefLines.map((line, i) => (
        <SvgText key={i} x={16} y={46 + i * 13 * bst} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowRegular}>{line}</SvgText>
      ))}
      {wrapped.map((lines, i) => {
        const on = confirmed.has(i);
        const y = itemsTop + i * pitch;
        return (
          <G key={i}>
            <Rect x={16} y={y - 9} width={11} height={11} rx={2} fill={on ? ink.green : 'none'} stroke={on ? ink.green : ink.dim} strokeWidth={1} />
            {on ? <Path d={`M18.5 ${y - 3.5} l3 3 l5 -6`} stroke="#000" strokeWidth={1.6} fill="none" /> : null}
            {lines.map((l, k) => (
              <SvgText key={k} x={33} y={y + k * 12 * bst} fontSize={lines.length > 1 ? fsS : fs} fill={on ? ink.text : ink.dim} fontFamily={fonts.barlowRegular}>{l}</SvgText>
            ))}
          </G>
        );
      })}
      {boosted ? null : (
        <SvgText x={16} y={H - 10} fontSize={fs} fill={complete ? ink.green : ink.amber} fontFamily={fonts.oswaldMedium}>{complete ? 'CONFIRMED — READY TO EXPORT TO THIS SPEC' : 'CONFIRM EVERY LINE BEFORE EXPORTING'}</SvgText>
      )}
    </Svg>
  );
}

/* ── 8 · the sequence ────────────────────────────────────────────────────── */

export const SEQ_H = 236;
export const SEQ_ASPECT = 360 / SEQ_H;

/** The ±seconds each transition panel shows around a track boundary. */
export const SEQ_ZOOM_SEC = 15;

/**
 * Two strips (cognitive review 2026-10-01, finding 3): the whole running
 * order on top, and under it the THREE TRANSITIONS zoomed to ±15 s, where a
 * 0–6 s gap, a 5–12 s fade wedge and a crossfade overlap are all visible and
 * all move with the fader. With CROSSFADE on the gap is 0 and reads "XF".
 */
export function SequenceStage({ width, height, blocks, totalSec, maxStepLu, crossfade, gapSec }: { width: number; height: number; blocks: readonly SeqBlock[]; totalSec: number; maxStepLu: number; crossfade: boolean; gapSec: number }) {
  const H = SEQ_H;
  const x0 = 10;
  const x1 = W - 10;
  const top = 28;
  const bot = 84;
  const xs = (t: number) => x0 + (t / Math.max(1, totalSec)) * (x1 - x0);
  const lufsLevel = (l: number) => Math.max(0, Math.min(1, (l + 30) / 24)); // −30…−6 LUFS on the ramp
  // The 9 pt floor on a short phone (see boostFor): 1 at or above 1 : 1.
  const bst = boostFor(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  // The zoom strip.
  const zTop = 138;
  const zBot = 194;
  const n = blocks.length;
  const panels = Math.max(0, n - 1);
  const pGap = 8;
  const pw = panels ? (x1 - x0 - pGap * (panels - 1)) / panels : 0;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <SvgText x={x0} y={16} fontSize={fs} fill={ink.dim} fontFamily={fonts.oswaldMedium}>RUNNING ORDER · length × loudness</SvgText>
      <SvgText x={x1} y={16} fontSize={fs} fill={maxStepLu > 6 ? ink.amber : ink.text} textAnchor="end" fontFamily={fonts.mono}>{`largest step ${maxStepLu.toFixed(1)} LU`}</SvgText>
      <Line x1={x0} y1={bot + 2} x2={x1} y2={bot + 2} stroke={ink.stroke} strokeWidth={0.8} />
      {blocks.map((b, i) => {
        const bx0 = xs(b.startSec);
        const bx1 = xs(b.endSec);
        const h = 18 + lufsLevel(b.lufs) * (bot - top - 18);
        const tint = levelColor(lufsLevel(b.lufs));
        const fadeW = Math.min(bx1 - bx0, (b.fadeOutSec / Math.max(1, totalSec)) * (x1 - x0));
        return (
          <G key={b.id}>
            <Rect x={bx0} y={bot - h} width={Math.max(2, bx1 - bx0 - fadeW)} height={h} fill={tint} opacity={0.75} />
            {fadeW > 0 ? <Polygon points={`${bx1 - fadeW},${bot - h} ${bx1},${bot} ${bx1 - fadeW},${bot}`} fill={tint} opacity={0.75} /> : null}
            {crossfade && i < n - 1 ? <Rect x={bx1 - 3} y={bot - 12} width={6} height={12} fill={ink.cyan} opacity={0.8} /> : null}
            <SvgText x={(bx0 + bx1) / 2} y={bot - h - 4} fontSize={fsS} fill={tint} textAnchor="middle" fontFamily={fonts.mono}>{`${b.lufs.toFixed(1)}`}</SvgText>
            <SvgText x={(bx0 + bx1) / 2} y={bot + 14} fontSize={fsS} fill={ink.text} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b.title.toUpperCase().slice(0, 14)}</SvgText>
          </G>
        );
      })}
      <SvgText x={x0} y={bot + 14 + 13 * bst} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>{`total ${Math.floor(totalSec / 60)}:${String(Math.round(totalSec % 60)).padStart(2, '0')} · LUFS estimates · ${crossfade ? `crossfades on (${XF_OVERLAP_SEC} s overlap, gap 0)` : `${gapSec.toFixed(1)} s gaps between tracks`}`}</SvgText>
      {/* ── the transitions, zoomed ─────────────────────────────────────── */}
      <SvgText x={x0} y={zTop - 7} fontSize={fs} fill={ink.dim} fontFamily={fonts.oswaldMedium}>{`TRANSITIONS · ±${SEQ_ZOOM_SEC} s around each boundary`}</SvgText>
      {blocks.slice(0, -1).map((a, i) => {
        const b = blocks[i + 1];
        const px0 = x0 + i * (pw + pGap);
        const px1 = px0 + pw;
        const centre = a.endSec;
        const zx = (t: number) => px0 + ((t - (centre - SEQ_ZOOM_SEC)) / (2 * SEQ_ZOOM_SEC)) * pw;
        const clampX = (x: number) => Math.max(px0, Math.min(px1, x));
        const ha = 14 + lufsLevel(a.lufs) * (zBot - zTop - 20);
        const hb = 14 + lufsLevel(b.lufs) * (zBot - zTop - 20);
        const ta = levelColor(lufsLevel(a.lufs));
        const tb = levelColor(lufsLevel(b.lufs));
        const fadeStart = clampX(zx(a.endSec - a.fadeOutSec));
        const aEnd = clampX(zx(a.endSec));
        const bStart = clampX(zx(b.startSec));
        const gap = Math.max(0, b.startSec - a.endSec);
        return (
          <G key={a.id + b.id}>
            <Rect x={px0} y={zTop} width={pw} height={zBot - zTop} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={0.6} />
            {/* A: body then its fade wedge down to the boundary */}
            <Rect x={px0} y={zBot - ha} width={Math.max(0, fadeStart - px0)} height={ha} fill={ta} opacity={0.7} />
            <Polygon points={`${fadeStart},${zBot - ha} ${aEnd},${zBot} ${fadeStart},${zBot}`} fill={ta} opacity={0.7} />
            {/* B: starts after the gap (or inside the fade when crossfading) */}
            <Rect x={bStart} y={zBot - hb} width={Math.max(0, px1 - bStart)} height={hb} fill={tb} opacity={crossfade ? 0.55 : 0.7} />
            {crossfade ? <Rect x={bStart} y={zTop + 2} width={Math.max(1, aEnd - bStart)} height={zBot - zTop - 2} fill={ink.cyan} opacity={0.22} /> : null}
            {!crossfade && gap > 0 ? (
              <G>
                {/* the gap's dimension bracket, BELOW its "gap 2.0 s" label
                    (clash sweep 2026-10-10: its end ticks ran up through the
                    digits) */}
                <Line x1={aEnd} y1={zTop + 18} x2={bStart} y2={zTop + 18} stroke={ink.amber} strokeWidth={1} strokeDasharray="2,2" />
                <Line x1={aEnd} y1={zTop + 14} x2={aEnd} y2={zTop + 22} stroke={ink.amber} strokeWidth={1} />
                <Line x1={bStart} y1={zTop + 14} x2={bStart} y2={zTop + 22} stroke={ink.amber} strokeWidth={1} />
              </G>
            ) : null}
            <SvgText x={(aEnd + bStart) / 2} y={zTop + 10} fontSize={fsS} fill={crossfade ? ink.cyan : gap > 0 ? ink.amber : ink.dim} textAnchor="middle" fontFamily={fonts.mono}>
              {crossfade ? `XF ${XF_OVERLAP_SEC} s` : gap > 0 ? `gap ${gap.toFixed(1)} s` : 'butt — no gap'}
            </SvgText>
            <SvgText x={px0 + 3} y={zBot + 12 * bst} fontSize={fsS} fill={ta} fontFamily={fonts.oswaldMedium}>{a.title.toUpperCase().slice(0, 9)}</SvgText>
            <SvgText x={px1 - 3} y={zBot + 12 * bst} fontSize={fsS} fill={tb} textAnchor="end" fontFamily={fonts.oswaldMedium}>{b.title.toUpperCase().slice(0, 9)}</SvgText>
            <SvgText x={(px0 + fadeStart) / 2 + (fadeStart - px0 < 30 ? 0 : 0)} y={zBot + 24 * bst} fontSize={fsS} fill={ink.dim} textAnchor="start" fontFamily={fonts.mono}>{`fade ${a.fadeOutSec} s`}</SvgText>
          </G>
        );
      })}
      {/* Measured: the old "steps over 6 LU flagged" ended at x 373 of 360
          with the short-phone boost (iPhone SE) and lost its last word. */}
      <SvgText x={x0} y={H - 5} fontSize={fs} fill={ink.dim} fontFamily={fonts.barlowRegular}>wedge = fade · dashed = gap · blue = crossfade · steps &gt; 6 LU flagged</SvgText>
      <Circle cx={x1 - 4} cy={H - 9} r={2} fill={ink.green} />
    </Svg>
  );
}

/* ── read-page figures (visual-first, cognitive review finding 17) ───────── */

/**
 * A width-fitted figure inside a read page — on the shared ExpandableFigure
 * (house rule: FULL SCREEN on every display, inline figures included), so the
 * drawing opens at the whole phone with zoom, its honesty badge riding along.
 * SVG in design units: everything in it zooms with the step.
 */
export function ReadFigure({ aspect, render, title, badge = 'ILLUSTRATION · a model, not a measurement' }: { aspect: number; render: (w: number, h: number) => ReactNode; title?: string; badge?: string }) {
  return <ExpandableFigure aspect={aspect} render={render} title={title} badge={badge} />;
}

export const ROOM_FIG_ASPECT = 360 / 200;
/** The drawn room is 196 units wide = a 5.0 m mastering room (≈ 5.0 × 4.3 m),
 *  so 1 m = 39.2 units; the monitors and diffusers are drawn at that scale. */
const ROOM_U = 196 / 5.0;

/** A treated mastering room from above: the listening triangle, the
 *  first-reflection points on the side walls and ceiling line, bass traps in
 *  the corners, the listener off-centre of the length. Illustration. */
export function RoomDiagram({ width, height }: { width: number; height: number }) {
  const H = 200;
  const rx0 = 30;
  const rx1 = 226;
  const ry0 = 16;
  const ry1 = 184;
  const lx0 = 238; // legend swatch column
  const lt = 258; // legend text column (≈ 100 units of room)
  const cx = (rx0 + rx1) / 2;
  const spkY = ry0 + 46;
  const lx = cx - 46;
  const rxp = cx + 46;
  const listY = spkY + 80;
  const refl = (sx: number, wallX: number) => {
    // First reflection on a side wall for a speaker at (sx, spkY) and listener at (cx, listY):
    // mirror the listener across the wall and intersect the straight line.
    const mx = 2 * wallX - cx;
    const t = (wallX - sx) / (mx - sx);
    return spkY + t * (listY - spkY);
  };
  const lRef = refl(lx, rx0);
  const rRef = refl(rxp, rx1);
  // Aim each cabinet at the listener (30° for this equilateral triangle).
  const toeDeg = (Math.atan2(cx - lx, listY - spkY) * 180) / Math.PI;
  const trap = (x: number, y: number, rot: number) => <Polygon key={`${x}${y}`} points={`${x},${y} ${x + 22},${y} ${x},${y + 22}`} fill="#2a2418" stroke={ink.amber} strokeWidth={0.8} transform={`rotate(${rot} ${x} ${y})`} />;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={rx0} y={ry0} width={rx1 - rx0} height={ry1 - ry0} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={1.2} />
      {/* corner bass traps */}
      {trap(rx0, ry0, 0)}
      {trap(rx1, ry0, 90)}
      {trap(rx0, ry1, -90)}
      {trap(rx1, ry1, 180)}
      {/* absorption at the first-reflection points + behind the speakers */}
      <Rect x={rx0} y={lRef - 16} width={5} height={32} fill={ink.amber} opacity={0.8} />
      <Rect x={rx1 - 5} y={rRef - 16} width={5} height={32} fill={ink.amber} opacity={0.8} />
      <Rect x={cx - 60} y={ry0} width={120} height={5} fill={ink.amber} opacity={0.5} />
      {/* diffusion on the rear wall: three 1-D quadratic-residue panels
          (N = 7, wells n² mod 7 = 0 1 4 2 2 4 1), each 600 mm wide with
          ≈ 86 mm wells and a 200 mm maximum well depth, seen from above */}
      {[-1, 0, 1].map((p) => {
        const pw = 0.6 * ROOM_U;
        const x0 = cx + p * (pw + 2) - pw / 2;
        const depth = 0.2 * ROOM_U;
        const wellW = pw / 7;
        const face = ry1 - depth - 1.2; // the panel's room-side face
        return (
          <G key={p}>
            <Rect x={x0} y={face} width={pw} height={depth + 1.2} fill="#070a07" stroke={ink.green} strokeWidth={0.6} />
            {[0, 1, 4, 2, 2, 4, 1].map((n, i) => (
              // the solid behind each well: deeper wells leave less of it
              <Rect key={i} x={x0 + i * wellW} y={face + (n / 4) * depth} width={wellW} height={depth + 1.2 - (n / 4) * depth} fill="#2d4a2d" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <Line key={i} x1={x0 + (i + 1) * wellW} y1={face} x2={x0 + (i + 1) * wellW} y2={ry1} stroke={ink.green} strokeWidth={0.5} />
            ))}
          </G>
        );
      })}
      {/* reflection paths */}
      <Path d={`M${lx} ${spkY} L${rx0} ${lRef} L${cx} ${listY}`} stroke={ink.amber} strokeWidth={0.8} strokeDasharray="3,2" fill="none" opacity={0.7} />
      <Path d={`M${rxp} ${spkY} L${rx1} ${rRef} L${cx} ${listY}`} stroke={ink.amber} strokeWidth={0.8} strokeDasharray="3,2" fill="none" opacity={0.7} />
      {/* the triangle */}
      <Path d={`M${lx} ${spkY} L${rxp} ${spkY} L${cx} ${listY} Z`} stroke={ink.cyan} strokeWidth={1} fill="rgba(93,205,255,0.06)" />
      {/* The main monitors FROM ABOVE (this is a plan): each cabinet's top,
          330 W × 400 D mm at the room's scale, toed in 30° to face the
          listener — not front elevations stood in a plan. */}
      <G transform={`translate(${lx},${spkY}) rotate(${-toeDeg})`}>
        <MonitorPlan w={0.33 * ROOM_U} d={0.4 * ROOM_U} stroke="#6b707c" strokeWidth={0.9} />
      </G>
      <G transform={`translate(${rxp},${spkY}) rotate(${toeDeg})`}>
        <MonitorPlan w={0.33 * ROOM_U} d={0.4 * ROOM_U} stroke="#6b707c" strokeWidth={0.9} />
      </G>
      {/* The listener from above: the owner's ABOVE head icon, turned to face
          the speakers (up the screen) — head fix 2026-10-08. */}
      {/* `plate` (clash sweep 2026-10-10): the triangle and reflection paths
          meet at the listener's ears, so they run UNDER the head's dark
          plate instead of straight through the drawn head. */}
      <HeadIconSvg view="above" x={cx} y={listY} size={21.6} rotation={Math.PI} color="#a7aeb8" plate minStroke={1.2} /* 17 % smaller (owner 2026-10-10: in proportion to the room) */ />
      {/* legend */}
      <SvgText x={lx0} y={ry0 + 12} fontSize={FONT} fill={ink.text} fontFamily={fonts.oswaldMedium}>FROM ABOVE</SvgText>
      <Line x1={lx0} y1={ry0 + 26} x2={lx0 + 14} y2={ry0 + 26} stroke={ink.cyan} strokeWidth={1.2} />
      <SvgText x={lt} y={ry0 + 30} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>listening triangle</SvgText>
      <Rect x={lx0} y={ry0 + 38} width={14} height={5} fill={ink.amber} opacity={0.8} />
      <SvgText x={lt} y={ry0 + 46} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>absorber at the</SvgText>
      <SvgText x={lt} y={ry0 + 58} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>first reflection</SvgText>
      <Line x1={lx0} y1={ry0 + 72} x2={lx0 + 14} y2={ry0 + 72} stroke={ink.amber} strokeWidth={0.8} strokeDasharray="3,2" />
      <SvgText x={lt} y={ry0 + 76} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>reflection path</SvgText>
      <Polygon points={`${lx0},${ry0 + 84} ${lx0 + 14},${ry0 + 84} ${lx0},${ry0 + 98}`} fill="#2a2418" stroke={ink.amber} strokeWidth={0.8} />
      <SvgText x={lt} y={ry0 + 92} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>corner bass trap</SvgText>
      <Rect x={lx0} y={ry0 + 110} width={6} height={10} fill="#1f2a1f" stroke={ink.green} strokeWidth={0.6} />
      <Rect x={lx0 + 8} y={ry0 + 108} width={6} height={12} fill="#1f2a1f" stroke={ink.green} strokeWidth={0.6} />
      <SvgText x={lt} y={ry0 + 118} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>rear-wall diffusion</SvgText>
      <SvgText x={lx0} y={ry0 + 142} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>listener ≈ 38 % of</SvgText>
      <SvgText x={lx0} y={ry0 + 154} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowRegular}>the length (example)</SvgText>
    </Svg>
  );
}

export type DestinationArtKind = 'streaming' | 'cd' | 'vinyl' | 'broadcast' | 'alternates';
export const DEST_ART_ASPECT = 360 / 120;

/** One illustrated object per destination: a phone + player bar, a DDP
 *  fileset, a lacquer on the lathe, a broadcast slate, a stack of versions. */
export function DestinationArt({ width, height, kind }: { width: number; height: number; kind: DestinationArtKind }) {
  const H = 120;
  const cy = 60;
  const rx = 236; // the caption column
  const caption = (lines: string[], tint = ink.dim) => lines.map((l, i) => (
    <SvgText key={l} x={rx} y={cy - 6 + (i - (lines.length - 1) / 2) * 13 + 4} fontSize={FONT_S} fill={tint} fontFamily={fonts.mono}>{l}</SvgText>
  ));
  let body: ReactNode = null;
  if (kind === 'streaming') {
    // A current phone, 71.5 × 147 mm (k = 0.653 units/mm): near-edge-to-edge
    // screen (≈ 2.2 mm border), punch-hole camera, volume keys on the left
    // edge and the side key on the right, a music player on screen.
    const cx = 60;
    const k = 96 / 147;
    const pw = 71.5 * k;
    const ph = 96;
    const px0 = cx - pw / 2;
    const py0 = cy - ph / 2;
    const bz = 2.2 * k;
    const sx0 = px0 + bz;
    const sy0 = py0 + bz;
    const sw = pw - 2 * bz;
    const art = sw - 8;
    body = (
      <G>
        {/* side keys first, so the frame overlaps their roots */}
        <Rect x={px0 - 1} y={py0 + 26 * k} width={1.6} height={9 * k} rx={0.6} fill="#3a3c44" />
        <Rect x={px0 - 1} y={py0 + 38 * k} width={1.6} height={9 * k} rx={0.6} fill="#3a3c44" />
        <Rect x={px0 + pw - 0.6} y={py0 + 32 * k} width={1.6} height={14 * k} rx={0.6} fill="#3a3c44" />
        <Rect x={px0} y={py0} width={pw} height={ph} rx={10 * k} fill="#1b1c21" stroke="#5a5e68" strokeWidth={1.1} />
        <Rect x={sx0} y={sy0} width={sw} height={ph - 2 * bz} rx={8.6 * k} fill="#08080a" />
        <Circle cx={cx} cy={sy0 + 4.2} r={1.5} fill="#000" stroke="#26282e" strokeWidth={0.6} />
        {/* the player: cover art, title and artist lines, scrubber, transport */}
        <Rect x={cx - art / 2} y={sy0 + 10} width={art} height={art} rx={2} fill="#2b2418" />
        <Path d={`M${cx - art / 2} ${sy0 + 10 + art * 0.72} q ${art * 0.3} ${-art * 0.3} ${art * 0.55} ${-art * 0.08} t ${art * 0.45} ${-art * 0.2} l 0 ${art * 0.56 - 2} q 0 2 -2 2 l ${-art + 4} 0 q -2 0 -2 -2 z`} fill="#4a3a20" />
        <Circle cx={cx + art * 0.22} cy={sy0 + 10 + art * 0.28} r={art * 0.1} fill={ink.amber} opacity={0.75} />
        <Rect x={cx - art / 2} y={sy0 + 14 + art} width={art * 0.7} height={2.6} rx={1.3} fill="#c9ccd4" />
        <Rect x={cx - art / 2} y={sy0 + 19 + art} width={art * 0.45} height={2} rx={1} fill="#5a5e68" />
        <Rect x={cx - art / 2} y={sy0 + 26 + art} width={art} height={1.4} rx={0.7} fill="#3a3c44" />
        <Rect x={cx - art / 2} y={sy0 + 26 + art} width={art * 0.4} height={1.4} rx={0.7} fill={ink.cyan} />
        <Circle cx={cx - art / 2 + art * 0.4} cy={sy0 + 26.7 + art} r={1.6} fill="#e8e8e8" />
        <Path d={`M${cx - 13} ${sy0 + 34 + art} l 0 6 M${cx - 12.4} ${sy0 + 37 + art} l 4.4 -3 l 0 6 z`} stroke="#c9ccd4" strokeWidth={0.9} fill="#c9ccd4" />
        <Path d={`M${cx - 2.6} ${sy0 + 33.4 + art} l 6 3.6 l -6 3.6 z`} fill="#e8e8e8" />
        <Path d={`M${cx + 13} ${sy0 + 34 + art} l 0 6 M${cx + 12.4} ${sy0 + 37 + art} l -4.4 -3 l 0 6 z`} stroke="#c9ccd4" strokeWidth={0.9} fill="#c9ccd4" />
        <Rect x={cx - 9} y={py0 + ph - bz - 3.4} width={18} height={1.3} rx={0.65} fill="#5a5e68" />
        {/* the upload path to the distributor's cloud */}
        <Path d={`M${cx + 30} ${cy} l 50 0 m -5 -4 l 5 4 l -5 4`} stroke={ink.cyan} strokeWidth={1.2} fill="none" />
        <Path d={`M${cx + 96} ${cy - 10} c 0 -18 30 -18 30 0 c 14 -2 18 14 4 16 l -40 0 c -14 0 -14 -16 6 -16`} fill="#121216" stroke={ink.cyan} strokeWidth={1.2} />
        <SvgText x={cx + 112} y={cy + 22} fontSize={FONT_S} fill={ink.cyan} textAnchor="middle" fontFamily={fonts.mono}>distributor</SvgText>
        {caption(['24-bit WAV masters', '+ instrumentals,', 'ISRCs and titles'])}
      </G>
    );
  } else if (kind === 'cd') {
    body = (
      <G>
        <Path d={`M18 ${cy - 40} l 24 0 l 7 7 l 60 0 l 0 76 l -91 0 z`} fill="#1a1812" stroke={ink.amber} strokeWidth={1} />
        <SvgText x={26} y={cy - 24} fontSize={FONT_S} fill={ink.amber} fontFamily={fonts.mono}>DDP fileset</SvgText>
        {['01-Signal.wav', 'DDPID · DDPMS', 'PQDESCR', 'CDTEXT.BIN', 'checksum.md5'].map((f, i) => (
          <SvgText key={f} x={26} y={cy - 8 + i * 11} fontSize={FONT_S} fill={i === 0 ? ink.green : ink.text} fontFamily={fonts.mono}>{f}</SvgText>
        ))}
        {/* A 120 mm disc at 0.5 units/mm: Ø15 centre hole, clear hub to the
            Ø33 stacking ring, mirror band, then the data area Ø46–Ø116 with
            its diffraction sheen. */}
        <Circle cx={166} cy={cy} r={30} fill="#aeb9c4" stroke="#7d8794" strokeWidth={0.8} />
        <Circle cx={166} cy={cy} r={20.25} fill="none" stroke="#c4cfda" strokeWidth={17.5} />
        <Path d={`M166 ${cy} L${166 + 29 * Math.cos(-2.2)} ${cy + 29 * Math.sin(-2.2)} A29 29 0 0 1 ${166 + 29 * Math.cos(-1.7)} ${cy + 29 * Math.sin(-1.7)} Z`} fill="#e9f1fb" opacity={0.75} />
        <Path d={`M166 ${cy} L${166 + 29 * Math.cos(0.95)} ${cy + 29 * Math.sin(0.95)} A29 29 0 0 1 ${166 + 29 * Math.cos(1.45)} ${cy + 29 * Math.sin(1.45)} Z`} fill="#e9f1fb" opacity={0.55} />
        <Path d={`M166 ${cy} L${166 + 29 * Math.cos(-1.7)} ${cy + 29 * Math.sin(-1.7)} A29 29 0 0 1 ${166 + 29 * Math.cos(-1.45)} ${cy + 29 * Math.sin(-1.45)} Z`} fill="#c9a6e0" opacity={0.45} />
        <Path d={`M166 ${cy} L${166 + 29 * Math.cos(-2.45)} ${cy + 29 * Math.sin(-2.45)} A29 29 0 0 1 ${166 + 29 * Math.cos(-2.2)} ${cy + 29 * Math.sin(-2.2)} Z`} fill="#9fdcd2" opacity={0.4} />
        <Circle cx={166} cy={cy} r={11.5} fill="#cfd8e1" stroke="#9aa5b2" strokeWidth={0.5} />
        <Circle cx={166} cy={cy} r={8.4} fill="#7b8590" opacity={0.85} />
        <Circle cx={166} cy={cy} r={8.4} fill="none" stroke="#c9d1da" strokeWidth={0.7} />
        <Circle cx={166} cy={cy} r={3.75} fill="#0d0d10" stroke="#5f6873" strokeWidth={0.5} />
        <Circle cx={166} cy={cy} r={29} fill="none" stroke="#8f9aa6" strokeWidth={0.5} />
        <SvgText x={166} y={cy + 44} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.mono}>reference disc</SvgText>
        {caption(['16-bit / 44.1 kHz', 'SRC first, dither', 'LAST, once'])}
      </G>
    );
  } else if (kind === 'vinyl') {
    // A cutting lathe from ABOVE at 0.17 units/mm: a 14" (356 mm) lacquer on
    // the platter — black lacquer over aluminium, no label, a centre hole and
    // a drive-pin hole — with the 12" programme band being cut from Ø292 mm
    // inward (inner limit ≈ Ø120 mm). The cutter head rides a carriage on a
    // lead screw behind the platter, stylus on the disc's centre line, the
    // swarf suction tube beside it.
    const cx = 62;
    const k = 0.17;
    const rLac = (356 / 2) * k;
    const rPlat = rLac + 1.6;
    const rOut = (292 / 2) * k;
    const rIn = (120.6 / 2) * k;
    const rCut = rIn + (rOut - rIn) * 0.42; // where the stylus is now
    const sx = cx + rCut; // stylus x (on the centre line, right of the spindle)
    const grooves: number[] = [];
    for (let r = rOut; r > rCut; r -= 0.85) grooves.push(r);
    body = (
      <G>
        {/* the deck */}
        <Rect x={10} y={8} width={206} height={104} rx={4} fill="#1a1b20" stroke="#3a3c44" strokeWidth={1} />
        <Line x1={12} y1={9.4} x2={214} y2={9.4} stroke="#ffffff" strokeWidth={0.7} opacity={0.12} />
        {/* platter rim, then the lacquer */}
        <Circle cx={cx} cy={cy} r={rPlat} fill="#3a3c44" stroke="#5a5e68" strokeWidth={0.6} />
        <Circle cx={cx} cy={cy} r={rLac} fill="#0b0b0d" />
        {/* the cut band: concentric grooves with their grey sheen */}
        {grooves.map((r, i) => (
          <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={i % 3 === 0 ? '#3c3f47' : '#26282e'} strokeWidth={0.45} />
        ))}
        <Path d={`M${cx - rOut * 0.7} ${cy - rOut * 0.7} A${rOut} ${rOut} 0 0 1 ${cx + rOut * 0.2} ${cy - rOut * 0.98}`} stroke="#ffffff" strokeWidth={2.2} opacity={0.08} fill="none" />
        {/* inner-groove limit (dashed) and the lacquer's two holes */}
        <Circle cx={cx} cy={cy} r={rIn} fill="none" stroke={ink.amber} strokeWidth={0.6} strokeDasharray="2,2" opacity={0.8} />
        <Circle cx={cx} cy={cy} r={1.4} fill="#c9ccd4" />
        <Circle cx={cx + 0.5 * 25.4 * k * 1.2} cy={cy} r={0.8} fill="#2a2c33" />
        {/* lead screw + carriage rails behind the platter */}
        <Line x1={cx - 6} y1={cy - rPlat - 8} x2={212} y2={cy - rPlat - 8} stroke="#5a5e68" strokeWidth={1.4} />
        <Line x1={cx - 6} y1={cy - rPlat - 8} x2={212} y2={cy - rPlat - 8} stroke="#8a8e98" strokeWidth={0.5} strokeDasharray="1,1" />
        <Line x1={cx - 6} y1={cy - rPlat - 3} x2={212} y2={cy - rPlat - 3} stroke="#4a4e58" strokeWidth={1} />
        {/* the carriage, its arm out over the disc, the cutter head */}
        <Rect x={sx - 7} y={cy - rPlat - 12} width={14} height={12} rx={1.2} fill="#2c2e35" stroke="#6b707c" strokeWidth={0.7} />
        <Rect x={sx - 3} y={cy - rPlat} width={6} height={rPlat - 10} fill="#2c2e35" stroke="#6b707c" strokeWidth={0.6} />
        <Rect x={sx - 6} y={cy - 12} width={12} height={10} rx={1.5} fill="#3a3d45" stroke={ink.amber} strokeWidth={0.8} />
        <Circle cx={sx} cy={cy} r={1} fill={ink.amber} />
        {/* swarf suction tube from the stylus out to the side */}
        <Path d={`M${sx + 1.5} ${cy + 0.5} q 10 3 18 -2 t 22 -8 t 30 -6`} stroke="#8a8e98" strokeWidth={1.2} fill="none" opacity={0.8} />
        {/* the inner-groove note, with a leader to the inner limit */}
        <Line x1={cx + rIn + 0.5} y1={cy + 2} x2={cx + 50} y2={cy + 18} stroke={ink.amber} strokeWidth={0.6} opacity={0.8} />
        <SvgText x={cx + 52} y={cy + 22} fontSize={FONT_S} fill={ink.amber} fontFamily={fonts.mono}>↖ inner groove:</SvgText>
        <SvgText x={cx + 52} y={cy + 34} fontSize={FONT_S} fill={ink.amber} fontFamily={fonts.mono}>HF fidelity drops</SvgText>
        {/* Line-broken to fit the caption column (a slice to 20 characters
            cut "limiting" to "limit"). */}
        {caption(['lacquer on the lathe:', 'side length, bass', 'centring, less', 'limiting'])}
      </G>
    );
  } else if (kind === 'broadcast') {
    const x0 = 22;
    const by = cy - 18; // top of the board
    // seven 45° stripes per stick, 19 units apart
    const stripes = (yTop: number, yBot: number, flip: boolean) =>
      [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = x0 + 4 + i * 19;
        const pts = flip
          ? `${a + 10},${yBot} ${a + 19},${yBot} ${a + 9},${yTop} ${a},${yTop}`
          : `${a},${yBot} ${a + 9},${yBot} ${a + 19},${yTop} ${a + 10},${yTop}`;
        return <Polygon key={i} points={pts} fill="#e8e8e8" />;
      });
    body = (
      <G>
        {/* A timecode slate: the board, the fixed lower clapper stick and
            the hinged upper stick lifted ≈ 7°, both with 45° stripes. */}
        <Rect x={x0} y={by} width={150} height={70} rx={3} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={1.2} />
        <Rect x={x0} y={by - 10} width={150} height={10} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={1} />
        {stripes(by - 10, by, false)}
        <G transform={`rotate(-7 ${x0 + 2} ${by - 11})`}>
          <Rect x={x0} y={by - 21} width={150} height={10} fill="#0b0b0e" stroke={ink.stroke} strokeWidth={1} />
          {stripes(by - 21, by - 11, true)}
        </G>
        <Circle cx={x0 + 3} cy={by - 11} r={2.2} fill="#5a5e68" stroke="#8a8e98" strokeWidth={0.6} />
        {['SLATE · TC 01:00:00:00', 'SPOT 30 s · STEREO · 48 kHz', 'LOUDNESS: per the spec sent', 'TRUE PEAK: per the spec sent'].map((t, i) => (
          <SvgText key={t} x={x0 + 8} y={by + 16 + i * 13} fontSize={FONT_S} fill={i === 0 ? ink.amber : ink.text} fontFamily={fonts.mono}>{t}</SvgText>
        ))}
        {caption(["the post house's", 'document names the', 'standard and tolerance'])}
      </G>
    );
  } else {
    body = (
      <G>
        {['Main', 'Instrumental', 'Clean', 'TVmix'].map((v, i) => (
          <G key={v}>
            <Rect x={20 + i * 8} y={cy - 40 + i * 18} width={170} height={24} rx={3} fill={i === 0 ? '#1a1812' : '#121216'} stroke={i === 0 ? ink.amber : ink.stroke} strokeWidth={1} />
            <SvgText x={28 + i * 8} y={cy - 24 + i * 18} fontSize={FONT_S} fill={i === 0 ? ink.amber : ink.text} fontFamily={fonts.mono}>{`Artist_Title_${v}_24-48.wav`}</SvgText>
          </G>
        ))}
        {caption(['same session,', 'same chain, same', 'length and level'])}
      </G>
    );
  }
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={2} y={2} width={W - 4} height={H - 4} rx={8} fill="#0d0d10" stroke={ink.stroke} strokeWidth={0.6} />
      {body}
    </Svg>
  );
}

/** Convenience: a dB → ramp tint for stage text (exported for modules). */
export const dbTint = (db: number) => levelColorForDb(db);
export { linToDb };
