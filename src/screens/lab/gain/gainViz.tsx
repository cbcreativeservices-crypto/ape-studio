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
 *
 * RACK UNIT (2026-08-23, APE_LAB_UX_PROPOSAL): ChainStage renders the whole
 * chain as meter columns inside the pinned stage glass, height-parametric —
 * faders move to the dock, so the columns carry meters/LEDs/collapsed slots
 * only. stageTint/stageStatus feed the bezel readouts.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
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
              {i > 0 ? (
                <Text style={[styles.stageArrow, c.node.distorted && { color: '#ff5f4e' }]}>▸</Text>
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

/** One stage row (owner 2026-08-10 layout): the left ¾ is the data panel —
 *  LEDs / meter / slider / readouts, two rows tall. The right ¼ is a column:
 *  top row the DEVICE itself (a generic rack box carrying the device name),
 *  bottom row the patch cable dropping straight down into the next device. */
export function DeviceCard({
  name,
  kind,
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
    <View style={styles.stageRow}>
      {/* ── left ¾ — data / controls panel ── */}
      <View style={[styles.panel, xray && styles.panelXray, !last && styles.panelGap]}>{children}</View>
      {/* ── right ¼ — the device box, then its output cable ── */}
      <View style={styles.rightCol}>
        <View style={[styles.deviceBox, xray && styles.deviceBoxXray]}>
          <View style={[styles.screw, { top: 3, left: 3 }]} />
          <View style={[styles.screw, { top: 3, right: 3 }]} />
          <View style={[styles.screw, { bottom: 3, left: 3 }]} />
          <View style={[styles.screw, { bottom: 3, right: 3 }]} />
          <StageIcon kind={kind} size={18} />
          <Text style={styles.deviceName} numberOfLines={1} adjustsFontSizeToFit>
            {name.toUpperCase()}
          </Text>
        </View>
        {!last ? <DeviceCable /> : <View style={styles.cableCol} />}
      </View>
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

/** The straight vertical patch cable from this device's output into the next
 *  device below: chrome TRS plugs seated at each end, insulated sheath with a
 *  sheen + the app's slim red signal tracer. Pure Views so it stretches to
 *  whatever height the row leaves it. */
function DeviceCable() {
  return (
    <View style={styles.cableCol}>
      <View style={styles.plug}>
        <View style={styles.plugSheen} />
        <View style={[styles.plugRing, { bottom: 1.5 }]} />
      </View>
      <View style={styles.cableSheath}>
        <View style={styles.cableCore} />
        <View style={styles.cableSheen} />
        <View style={styles.cableTracer} />
      </View>
      <View style={styles.plug}>
        <View style={styles.plugSheen} />
        <View style={[styles.plugRing, { top: 1.5 }]} />
      </View>
    </View>
  );
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
        <GradientView colors={rampColors(fill)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.hFill, { width: pct(fill) }]} />
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

  // stage rows — left ¾ data panel, right ¼ device + cable (owner 2026-08-10)
  stageRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  panel: { flex: 3, borderRadius: 10, borderWidth: 1.5, borderColor: '#34363e', backgroundColor: '#1a1c22', paddingVertical: 7, paddingHorizontal: 12, gap: 5, justifyContent: 'center' },
  panelXray: { borderColor: 'rgba(127,212,255,.55)', backgroundColor: '#10151b' },
  panelGap: { marginBottom: 10 },
  rightCol: { flex: 1, alignSelf: 'stretch' },
  deviceBox: { flex: 1, borderRadius: 8, borderWidth: 1.5, borderColor: '#34363e', backgroundColor: '#22242c', alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 8, paddingVertical: 4 },
  deviceBoxXray: { borderColor: 'rgba(127,212,255,.55)', backgroundColor: '#131a21' },
  screw: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#55555f', borderWidth: 0.5, borderColor: '#0c0c0f' },
  deviceName: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, color: colors.textPrimary, textAlign: 'center' },

  // the drop cable (right column, 2nd row)
  cableCol: { flex: 1, alignItems: 'center' },
  plug: { width: 9, height: 8, borderRadius: 2, backgroundColor: '#c8ccd4', borderWidth: 0.6, borderColor: '#8b8f97', overflow: 'hidden' },
  plugSheen: { position: 'absolute', left: 1.5, top: 0.5, bottom: 0.5, width: 1.6, borderRadius: 0.8, backgroundColor: '#eef1f5', opacity: 0.85 },
  plugRing: { position: 'absolute', left: 0, right: 0, height: 0.9, backgroundColor: '#0d0d0f' },
  cableSheath: { flex: 1, width: 7, borderRadius: 3.5, backgroundColor: '#0b0b0d', overflow: 'hidden', marginVertical: -1 },
  cableCore: { position: 'absolute', top: 1, bottom: 1, left: 1, right: 1, borderRadius: 2.5, backgroundColor: '#2c2f36' },
  cableSheen: { position: 'absolute', left: 1.6, top: 2, bottom: 2, width: 1.2, borderRadius: 0.6, backgroundColor: '#5a5f6a', opacity: 0.55 },
  cableTracer: { position: 'absolute', left: 3, top: 2, bottom: 2, width: 1, backgroundColor: '#c23a2d', opacity: 0.7 },

  // device LEDs — inline in the header (compact) so no separate row
  ledRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
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
