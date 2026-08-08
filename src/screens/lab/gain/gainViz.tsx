/**
 * gainViz — the Gain Staging Lab's visual system (owner spec + edit pass
 * 2026-08-07).
 *
 * TWO layouts:
 *  • ChainColumns — lessons 1–5: stages as COLUMNS left→right (signal path
 *    INPUT ▸ … ▸ OUTPUT across the top), each column a vertical 3-zone meter +
 *    a VERTICAL fader (MIDI-coloured); fixed stages carry a FIXED tag so it's
 *    obvious where there is no user control.
 *  • DeviceCard + CableLink — modules 6–8: the chain as REAL-WORLD-styled rack
 *    devices (screws, nameplate, jack labels) stacked top→down, patched
 *    OUTPUT → INPUT with the red TRS cable idiom from the dashboard's
 *    "matching" MethodIcon (dark-red sheath #6e1a12 + #ff5a48 core + silver
 *    connectors). Real-gear honesty: with Signal X-Ray OFF a device shows only
 *    its SIG/CLIP LEDs — you don't get to see the level inside; X-Ray ON
 *    reveals every meter in the chain at once.
 *
 * Meters colour by the app MIDI ramp (levelColor): blue = too low, green =
 * healthy, yellow/red = hot/overload.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor } from '../../../features/tools/levelColor';
import { DragSlider } from '../foundations/bits';
import { VerticalFader } from '../eq/modules/eqBits';
import {
  computeChain,
  meterFill,
  verdictFor,
  LOW_EDGE,
  ZONE_CLIP_FILL,
  ZONE_HOT_FILL,
  ZONE_LOW_FILL,
  type ChainNode,
  type Stage,
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

export function StageMeterV({ node }: { node: ChainNode }) {
  const fill = meterFill(node.level);
  const col = levelColor(fill);
  return (
    <View style={styles.vWrap}>
      <View style={styles.vTrack}>
        {/* zones, bottom-up: too-low · healthy · hot/over */}
        <View style={[styles.vZone, { bottom: 0, height: pct(ZONE_LOW_FILL), backgroundColor: '#13233f' }]} />
        <View style={[styles.vZone, { bottom: pct(ZONE_LOW_FILL), height: pct(ZONE_HOT_FILL - ZONE_LOW_FILL), backgroundColor: '#122a17' }]} />
        <View style={[styles.vZone, { bottom: pct(ZONE_HOT_FILL), height: pct(1 - ZONE_HOT_FILL), backgroundColor: '#2a1410' }]} />
        <View style={[styles.vFill, { height: pct(fill), backgroundColor: col }]} />
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

// ───────────────────────────────────────────── columns layout (M1–M5) ───────
export type ColumnControl = {
  value: number; // 0..1
  onChange: (t: number) => void;
  readout: string;
};

export function StageColumn({
  name,
  kind,
  node,
  control,
  note,
}: {
  name: string;
  kind: StageKind;
  node: ChainNode;
  control?: ColumnControl;
  /** Line under the column (e.g. the source descriptor). */
  note?: string;
}) {
  const tint = levelColor(meterFill(node.level));
  return (
    <View style={styles.col}>
      <StageIcon kind={kind} size={26} />
      <Text style={styles.colName}>{name}</Text>
      <View style={styles.colMeterRow}>
        <StageMeterV node={node} />
        {control ? (
          <VerticalFader value={control.value} onChange={control.onChange} label="" tint={tint} />
        ) : null}
      </View>
      {control ? (
        <Text style={[styles.colReadout, { color: tint }]}>{control.readout}</Text>
      ) : (
        <View style={styles.fixedTag}>
          <Text style={styles.fixedTagText}>FIXED</Text>
        </View>
      )}
      {note ? <Text style={styles.colNote}>{note}</Text> : null}
    </View>
  );
}

/** The whole chain as columns, with the signal path labeled across the top. */
export function ChainColumns({
  source,
  stages,
  sourceRange = [-40, -6],
  onSource,
  onGain,
  sourceNote,
}: {
  source: number;
  stages: Stage[];
  sourceRange?: [number, number];
  onSource?: (v: number) => void;
  onGain?: (key: string, v: number) => void;
  sourceNote?: boolean;
}) {
  const nodes = computeChain(source, stages);
  const [lo, hi] = sourceRange;
  return (
    <View style={styles.colsPanel}>
      {/* Signal path header: INPUT ▸ … ▸ OUTPUT */}
      <View style={styles.pathRow}>
        <Text style={styles.pathEnd}>INPUT</Text>
        <View style={styles.pathLine} />
        <Text style={styles.pathArrowBig}>▸</Text>
        <View style={styles.pathLine} />
        <Text style={styles.pathEnd}>OUTPUT</Text>
      </View>
      <View style={styles.colsRow}>
        <StageColumn
          name="SOURCE"
          kind="source"
          node={nodes[0]}
          control={
            onSource
              ? {
                  value: (source - lo) / (hi - lo),
                  onChange: (t) => onSource(Math.round(lo + t * (hi - lo))),
                  readout: 'LEVEL',
                }
              : undefined
          }
          note={sourceNote ? sourceDesc(nodes[0]) : undefined}
        />
        {stages.map((st, i) => (
          <View key={st.key} style={styles.colWithArrow}>
            <Text style={[styles.colArrow, nodes[i + 1].distorted && { color: '#ff5f4e' }]}>▸</Text>
            <StageColumn
              name={st.name.toUpperCase()}
              kind={st.kind}
              node={nodes[i + 1]}
              control={
                st.adjustable && onGain
                  ? {
                      value: (st.gain - st.min) / (st.max - st.min),
                      onChange: (t) => onGain(st.key, Math.round(st.min + t * (st.max - st.min))),
                      readout: `${st.gain >= 0 ? '+' : ''}${st.gain} dB`,
                    }
                  : undefined
              }
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────────────────────────────────────────── device cards (M6–M8) ─────────
/** Clip LED pair — all a real device shows you from the outside. */
export function DeviceLeds({ node }: { node: ChainNode }) {
  const sig = node.level > LOW_EDGE;
  const clip = node.stageClipped;
  return (
    <View style={styles.ledRow}>
      <View style={styles.ledItem}>
        <View style={[styles.led, sig && styles.ledSig]} />
        <Text style={styles.ledLabel}>SIG</Text>
      </View>
      <View style={styles.ledItem}>
        <View style={[styles.led, clip && styles.ledClip]} />
        <Text style={styles.ledLabel}>CLIP</Text>
      </View>
    </View>
  );
}

/** A rack-unit-styled device: screws, nameplate, jack labels, and whatever the
 *  module puts on its face (LEDs · meter · slider). */
export function DeviceCard({
  name,
  kind,
  first,
  last,
  xray,
  onPress,
  children,
}: {
  name: string;
  kind: StageKind;
  first?: boolean;
  last?: boolean;
  /** X-Ray styling: scan-blue border + darkened face while revealed. */
  xray?: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const body = (
    <View style={[styles.device, xray && styles.deviceXray]}>
      {/* corner screws */}
      <View style={[styles.screw, { top: 5, left: 5 }]} />
      <View style={[styles.screw, { top: 5, right: 5 }]} />
      <View style={[styles.screw, { bottom: 5, left: 5 }]} />
      <View style={[styles.screw, { bottom: 5, right: 5 }]} />
      {/* jack labels — the signal path in/out of this box */}
      {!first ? <Text style={[styles.jack, styles.jackIn]}>● INPUT</Text> : null}
      {!last ? <Text style={[styles.jack, styles.jackOut]}>OUTPUT ●</Text> : null}
      <View style={styles.deviceHead}>
        <StageIcon kind={kind} size={30} />
        <View style={styles.namePlate}>
          <Text style={styles.deviceName}>{name.toUpperCase()}</Text>
        </View>
      </View>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name} device`}>
        {body}
      </Pressable>
    );
  }
  return body;
}

/** Horizontal 3-zone meter for a device face (X-Ray / revealed view). */
export function DeviceMeter({ node, showLevel }: { node: ChainNode; showLevel?: boolean }) {
  const fill = meterFill(node.level);
  const col = levelColor(fill);
  return (
    <View style={styles.hWrap}>
      <View style={styles.hTrack}>
        <View style={[styles.hZone, { left: 0, width: pct(ZONE_LOW_FILL), backgroundColor: '#13233f' }]} />
        <View style={[styles.hZone, { left: pct(ZONE_LOW_FILL), width: pct(ZONE_HOT_FILL - ZONE_LOW_FILL), backgroundColor: '#122a17' }]} />
        <View style={[styles.hZone, { left: pct(ZONE_HOT_FILL), width: pct(1 - ZONE_HOT_FILL), backgroundColor: '#2a1410' }]} />
        <View style={[styles.hFill, { width: pct(fill), backgroundColor: col }]} />
        <View style={[styles.hCeil, { left: pct(ZONE_CLIP_FILL) }]} />
      </View>
      <View style={styles.hUnder}>
        {node.stageClipped ? (
          <Text style={styles.clipBadge}>CLIP</Text>
        ) : node.distorted ? (
          <Text style={styles.distBadge}>DISTORTED</Text>
        ) : (
          <Text style={[styles.vRegion, { color: col }]}>{regionLabelFor(node)}</Text>
        )}
        {showLevel ? <Text style={styles.hVerdict}>{verdictFor(node)}</Text> : null}
      </View>
    </View>
  );
}

/** The patch cable OUTPUT → INPUT between two devices — mirrors the
 *  dashboard "matching" MethodIcon's red TRS cable (silver connectors,
 *  #6e1a12 sheath, #ff5a48 core). */
export function CableLink() {
  return (
    <View style={styles.cableWrap}>
      <Svg width="100%" height={40} viewBox="0 0 320 40" preserveAspectRatio="xMaxYMid meet">
        {/* TRS plug leaving the OUTPUT above */}
        <Rect x={247} y={1} width={16} height={5} rx={2.5} fill="#d0d4da" />
        <Rect x={249} y={1.6} width={10} height={1.2} rx={0.6} fill="#eef1f5" />
        <Rect x={251.5} y={1} width={1.2} height={5} fill="#101010" />
        <Rect x={255} y={1} width={1.2} height={5} fill="#101010" />
        {/* cable: sheath + bright core (the matching-icon idiom) */}
        <Path d="M255 6 C 302 12, 302 28, 255 34" stroke="#6e1a12" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M255 6 C 302 12, 302 28, 255 34" stroke="#ff5a48" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        {/* TRS plug entering the INPUT below */}
        <Rect x={247} y={34} width={16} height={5} rx={2.5} fill="#d0d4da" />
        <Rect x={249} y={34.6} width={10} height={1.2} rx={0.6} fill="#eef1f5" />
        <Rect x={251.5} y={34} width={1.2} height={5} fill="#101010" />
        <Rect x={255} y={34} width={1.2} height={5} fill="#101010" />
      </Svg>
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
      hitSlop={6}
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
  vRegion: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.4 },
  clipBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: '#fff', backgroundColor: '#c62f22', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' },
  distBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.5, color: '#ff7a1e' },

  // columns
  colsPanel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 10 },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pathEnd: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },
  pathLine: { flex: 1, height: 1, backgroundColor: '#3a4150' },
  pathArrowBig: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber },
  colsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  colWithArrow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  colArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#4a5060', paddingHorizontal: 1, marginTop: 60 },
  col: { alignItems: 'center', gap: 5, flexShrink: 1 },
  colName: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: colors.textPrimary, textAlign: 'center' },
  colMeterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  colReadout: { fontFamily: fonts.mono, fontSize: 10 },
  colNote: { fontFamily: fonts.barlowRegular, fontSize: 9.5, lineHeight: 12, color: colors.textSub, textAlign: 'center', maxWidth: 84 },
  fixedTag: { borderRadius: 4, borderWidth: 1, borderColor: '#33353d', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#101014' },
  fixedTagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.8, color: colors.textSub },

  // devices
  device: { borderRadius: 10, borderWidth: 1.5, borderColor: '#34363e', backgroundColor: '#1a1c22', paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  deviceXray: { borderColor: 'rgba(127,212,255,.55)', backgroundColor: '#10151b' },
  screw: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#55555f', borderWidth: 0.5, borderColor: '#0c0c0f' },
  jack: { position: 'absolute', fontFamily: fonts.mono, fontSize: 8, color: '#8b8f97' },
  jackIn: { top: 3, right: 14 },
  jackOut: { bottom: 3, right: 14 },
  deviceHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  namePlate: { borderRadius: 4, borderWidth: 1, borderColor: '#2b2d35', backgroundColor: '#101216', paddingHorizontal: 8, paddingVertical: 3 },
  deviceName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textPrimary },

  // device LEDs
  ledRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  ledItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  led: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#23252d', borderWidth: 1, borderColor: '#0c0c0f' },
  ledSig: { backgroundColor: '#3fae52' },
  ledClip: { backgroundColor: '#ff3b2a' },
  ledLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textSub },

  // horizontal device meter
  hWrap: { gap: 3 },
  hTrack: { height: 13, borderRadius: 4, overflow: 'hidden', backgroundColor: '#0c0d11', borderWidth: 1, borderColor: '#23252d' },
  hZone: { position: 'absolute', top: 0, bottom: 0 },
  hFill: { position: 'absolute', top: 1, bottom: 1, left: 0, borderRadius: 2, opacity: 0.95 },
  hCeil: { position: 'absolute', top: -1, bottom: -1, width: 2, backgroundColor: '#ff5f4e' },
  hUnder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hVerdict: { fontFamily: fonts.barlowRegular, fontSize: 10.5, color: colors.textSub, flexShrink: 1 },

  // cable
  cableWrap: { height: 40 },

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
