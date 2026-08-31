/**
 * gainViz — the Gain Staging Lab's visual system (owner spec + edit pass
 * 2026-08-07).
 *
 * RACK UNIT (2026-08-23, APE_LAB_UX_PROPOSAL): ChainStage renders the whole
 * chain as meter columns inside the pinned stage glass, height-parametric —
 * faders move to the dock, so the columns carry meters/LEDs/collapsed slots
 * only. stageTint/stageStatus feed the bezel readouts. Real-gear honesty:
 * a column set to 'leds' shows only its SIG/CLIP LEDs — you don't get to see
 * the level inside; X-Ray reveals every meter in the chain at once.
 *
 * Meters colour by the app MIDI ramp (levelColor): blue = too low, green =
 * healthy, yellow/red = hot/overload.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
import { DragSlider } from '../foundations/bits';
import {
  meterFill,
  LOW_EDGE,
  ZONE_CLIP_FILL,
  ZONE_HOT_FILL,
  ZONE_LOW_FILL,
  type ChainNode,
  type StageKind,
} from './gainEngine';

const pct = (x: number): `${number}%` => `${Number((x * 100).toFixed(1))}%`;

/** Region label — the SOURCE is never scolded for being quiet (owner
 *  2026-08-07): a mic-level source is SUPPOSED to be quiet. */
function regionLabelFor(node: ChainNode): string {
  if (node.kind === 'source' && node.region === 'low') return 'QUIET SOURCE';
  switch (node.region) {
    case 'low': return 'TOO LOW';
    case 'healthy': return 'HEALTHY';
    case 'hot': return 'HOT';
    default: return 'OVERLOAD';
  }
}

/** Source descriptor under the source column (owner wording). */
export function sourceDesc(node: ChainNode): string {
  return node.region === 'low'
    ? 'a quiet instrument/source'
    : node.region === 'healthy'
      ? 'a moderate source'
      : node.region === 'hot'
        ? 'a loud source'
        : 'a very loud source';
}

// ───────────────────────────────────────────── vertical 3-zone meter ────────
const VM_H = 118;
const VM_W = 18;

export function StageMeterV({ node, height = VM_H }: { node: ChainNode; height?: number }) {
  const fill = meterFill(node.level);
  const col = levelColor(fill);
  return (
    <View style={styles.vWrap}>
      <View style={[styles.vTrack, { height }]}>
        {/* zones, bottom-up: too-low · healthy · hot/over */}
        <View style={[styles.vZone, { bottom: 0, height: pct(ZONE_LOW_FILL), backgroundColor: '#13233f' }]} />
        <View style={[styles.vZone, { bottom: pct(ZONE_LOW_FILL), height: pct(ZONE_HOT_FILL - ZONE_LOW_FILL), backgroundColor: '#122a17' }]} />
        <View style={[styles.vZone, { bottom: pct(ZONE_HOT_FILL), height: pct(1 - ZONE_HOT_FILL), backgroundColor: '#2a1410' }]} />
        <GradientView colors={rampColors(fill)} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[styles.vFill, { height: pct(fill) }]} />
        {/* Cumulative noise floor — grey hiss eating the meter from below.
            This is the visual referent for the too-low lesson (learning pass
            2026-08-31): pile on late gain and watch the hiss ride up. */}
        {meterFill(node.noise) > 0.005 ? (
          <View style={[styles.vNoise, { height: pct(meterFill(node.noise)) }]} />
        ) : null}
        <View style={[styles.vCeil, { bottom: pct(ZONE_CLIP_FILL) }]} />
      </View>
      {node.stageClipped ? (
        <Text style={styles.clipBadge}>CLIP</Text>
      ) : node.distorted ? (
        <Text style={styles.distBadge}>DIST</Text>
      ) : (
        <Text style={[styles.vRegion, { color: col }]}>{regionLabelFor(node)}</Text>
      )}
    </View>
  );
}

// ───────────────────────────────────── rack stage (Rack Unit, 2026-08-23) ───
/** Meter-tint helper for bezel cells / dock faders (the MIDI ramp). */
export function stageTint(node: ChainNode): string {
  return levelColor(meterFill(node.level));
}

/** Compact bezel status cell for a node — spread into a BezelItem. */
export function stageStatus(node: ChainNode): { v: string; tint: string } {
  if (node.stageClipped) return { v: 'CLIP', tint: '#ff5f4e' };
  if (node.distorted) return { v: 'DIST', tint: '#ff7a1e' };
  if (node.region === 'low') return { v: 'LOW', tint: '#6f9bff' };
  if (node.region === 'hot') return { v: 'HOT', tint: '#ffc64d' };
  return { v: 'OK', tint: '#3fae52' };
}

export type StageColSpec = {
  key: string;
  name: string;
  kind: StageKind;
  node: ChainNode;
  /** 'meter' (default) — the 3-zone meter; 'leds' — closed-face SIG/CLIP only
   *  (real-gear honesty, X-Ray OFF); 'hidden' — collapsed, tap to inspect. */
  display?: 'meter' | 'leds' | 'hidden';
  /** Gain readout under the column (stages whose fader rides the dock). */
  readout?: string;
  /** Show the FIXED tag under the column (no user control anywhere). */
  fixed?: boolean;
  onPress?: () => void;
  /** Scan-blue highlight (the inspected / X-Rayed column). */
  active?: boolean;
};

/** The pinned chain display for the Rack Unit stage: the whole signal path as
 *  columns inside the glass, height-parametric. Faders live on the dock — the
 *  columns show only what the signal is DOING at each point. */
export function ChainStage({ w, h, cols }: { w: number; h: number; cols: StageColSpec[] }) {
  const meterH = Math.max(44, h - 110);
  return (
    <View style={[styles.stageGlass, { width: w, height: h }]}>
      {/* Signal path header: INPUT ▸ … ▸ OUTPUT */}
      <View style={styles.pathRow}>
        <Text style={styles.pathEnd}>INPUT</Text>
        <View style={styles.pathLine} />
        <Text style={styles.pathArrowBig}>▸</Text>
        <View style={styles.pathLine} />
        <Text style={styles.pathEnd}>OUTPUT</Text>
      </View>
      <View style={styles.stageCols}>
        {cols.map((c, i) => {
          const display = c.display ?? 'meter';
          const inner = (
            <View style={[styles.stageCol, c.active && styles.stageColActive]}>
              <StageIcon kind={c.kind} size={20} />
              <Text style={styles.colName} numberOfLines={1} adjustsFontSizeToFit>
                {c.name}
              </Text>
              {display === 'meter' ? (
                <StageMeterV node={c.node} height={meterH} />
              ) : display === 'leds' ? (
                <View style={styles.slotWrap}>
                  <View style={[styles.slotBox, { height: meterH }]}>
                    <View style={[styles.led, c.node.level > LOW_EDGE && styles.ledSig]} />
                    <Text style={styles.slotLedLabel}>SIG</Text>
                    <View style={[styles.led, c.node.stageClipped && styles.ledClip, { marginTop: 8 }]} />
                    <Text style={styles.slotLedLabel}>CLIP</Text>
                  </View>
                  <Text style={styles.slotUnder}> </Text>
                </View>
              ) : (
                <View style={styles.slotWrap}>
                  <View style={[styles.slotBox, { height: meterH }]}>
                    <Text style={styles.slotQ}>?</Text>
                  </View>
                  <Text style={styles.slotUnder}>INSPECT</Text>
                </View>
              )}
              {c.readout ? (
                <Text style={[styles.colReadout, { color: stageTint(c.node) }]} numberOfLines={1}>
                  {c.readout}
                </Text>
              ) : c.fixed ? (
                <View style={styles.fixedTag}>
                  <Text style={styles.fixedTagText}>FIXED</Text>
                </View>
              ) : (
                <Text style={styles.colReadout}> </Text>
              )}
            </View>
          );
          return (
            <View key={c.key} style={styles.stageColWrap}>
              {/* Arrow tint guarded on display (fix 2026-08-31): a red arrow
                  between HIDDEN columns pointed straight at the Troubleshoot
                  fault. */}
              {i > 0 ? (
                <Text style={[styles.stageArrow, c.node.distorted && display !== 'hidden' && { color: '#ff5f4e' }]}>▸</Text>
              ) : null}
              {c.onPress ? (
                <Pressable
                  onPress={c.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} stage — tap to inspect`}
                  style={styles.stageColPress}
                >
                  {inner}
                </Pressable>
              ) : (
                inner
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ───────────────────────────────────────────── stage icons + button ─────────
/** Simple line-art equipment glyph per stage kind. */
export function StageIcon({ kind, size = 30 }: { kind: StageKind; size?: number }) {
  const s = size;
  const c = colors.textSecondary;
  return (
    <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {kind === 'source' && (
        <>
          <Rect x={12} y={4} width={8} height={14} rx={4} stroke={c} strokeWidth={1.6} />
          <Path d="M9 14a7 7 0 0 0 14 0" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={16} y1={21} x2={16} y2={26} stroke={c} strokeWidth={1.6} />
          <Line x1={11} y1={27} x2={21} y2={27} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
        </>
      )}
      {kind === 'preamp' && (
        <>
          <Rect x={4} y={9} width={24} height={14} rx={2} stroke={c} strokeWidth={1.6} />
          <Circle cx={11} cy={16} r={4} stroke={c} strokeWidth={1.5} />
          <Line x1={11} y1={16} x2={11} y2={12.5} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
          <Line x1={19} y1={13} x2={24} y2={13} stroke={c} strokeWidth={1.3} />
          <Line x1={19} y1={19} x2={24} y2={19} stroke={c} strokeWidth={1.3} />
        </>
      )}
      {(kind === 'eq' || kind === 'processor') && (
        <>
          <Rect x={4} y={7} width={24} height={18} rx={2} stroke={c} strokeWidth={1.6} />
          <Path d="M7 20 Q13 20 16 13 Q19 20 25 12" stroke={colors.amber} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'comp' && (
        <>
          <Rect x={4} y={7} width={24} height={18} rx={2} stroke={c} strokeWidth={1.6} />
          <Path d="M16 10 L16 20 M12 16 L16 21 L20 16" stroke={colors.amber} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'fader' && (
        <>
          <Line x1={16} y1={5} x2={16} y2={27} stroke={c} strokeWidth={1.6} />
          <Rect x={10} y={13} width={12} height={6} rx={1.5} fill="#22242c" stroke={colors.amber} strokeWidth={1.5} />
        </>
      )}
      {kind === 'bus' && (
        <>
          <Path d="M5 8 L14 16 M5 24 L14 16 M14 16 L27 16" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={14} cy={16} r={2.2} fill={c} />
        </>
      )}
      {kind === 'output' && (
        <>
          <Rect x={6} y={11} width={7} height={10} stroke={c} strokeWidth={1.6} />
          <Path d="M13 11 L21 6 L21 26 L13 21" stroke={c} strokeWidth={1.6} strokeLinejoin="round" fill="none" />
          <Path d="M24 12a6 6 0 0 1 0 8" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

/** Small tappable button used across the lab. `good` = the green variant. */
export function GainBtn({
  label,
  active,
  danger,
  good,
  onPress,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  good?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active != null ? { selected: active } : undefined}
      style={[styles.btn, active && styles.btnActive, danger && styles.btnDanger, good && styles.btnGood]}
    >
      <Text
        style={[styles.btnText, active && styles.btnTextActive, danger && styles.btnTextDanger, good && styles.btnTextGood]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Re-export the horizontal DragSlider so modules import everything from here.
export { DragSlider };

const styles = StyleSheet.create({
  // vertical meter
  vWrap: { alignItems: 'center', gap: 3, width: 34 },
  vTrack: { width: VM_W, height: VM_H, borderRadius: 4, overflow: 'hidden', backgroundColor: '#0c0d11', borderWidth: 1, borderColor: '#23252d' },
  vZone: { position: 'absolute', left: 0, right: 0 },
  vFill: { position: 'absolute', left: 1, right: 1, bottom: 0, borderRadius: 2, opacity: 0.95 },
  vCeil: { position: 'absolute', left: -1, right: -1, height: 2, backgroundColor: '#ff5f4e' },
  vNoise: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(158,158,168,0.42)' },
  vRegion: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.4 },
  clipBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: '#fff', backgroundColor: '#c62f22', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' },
  distBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.5, color: '#ff7a1e' },

  // signal path header + column labels
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pathEnd: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },
  pathLine: { flex: 1, height: 1, backgroundColor: '#3a4150' },
  pathArrowBig: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber },
  colName: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: colors.textPrimary, textAlign: 'center' },
  colReadout: { fontFamily: fonts.mono, fontSize: 10 },
  fixedTag: { borderRadius: 4, borderWidth: 1, borderColor: '#33353d', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#101014' },
  fixedTagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.8, color: colors.textSub },

  // rack stage — the chain as columns inside the pinned glass (2026-08-23)
  stageGlass: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  stageCols: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stageColWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  stageColPress: { flex: 1, minWidth: 0 },
  stageCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 2,
    minWidth: 0,
  },
  stageColActive: { borderColor: 'rgba(127,212,255,.55)', backgroundColor: '#10151b' },
  stageArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: '#4a5060', paddingHorizontal: 1 },
  slotWrap: { alignItems: 'center', gap: 3, width: 34 },
  slotBox: {
    width: 26,
    borderRadius: 4,
    backgroundColor: '#0c0d11',
    borderWidth: 1,
    borderColor: '#23252d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  slotQ: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textSub },
  slotUnder: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.4, color: colors.textSub },
  slotLedLabel: { fontFamily: fonts.mono, fontSize: 8, color: colors.textSub, marginTop: 2 },

  // SIG/CLIP LEDs (the closed-face 'leds' column display)
  led: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#23252d', borderWidth: 1, borderColor: '#0c0c0f' },
  ledSig: { backgroundColor: '#3fae52' },
  ledClip: { backgroundColor: '#ff3b2a' },

  // buttons
  btn: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  btnActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  btnDanger: { borderColor: 'rgba(198,47,34,.5)', backgroundColor: '#1c0f0d' },
  btnGood: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: '#0c1a10' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.7, color: colors.textSecondary },
  btnTextActive: { color: colors.amber },
  btnTextDanger: { color: '#ff7a6a' },
  btnTextGood: { color: colors.green },
});
