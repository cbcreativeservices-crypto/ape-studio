/**
 * SystemMap — a live sound system drawn as a MAP with branches, the way a
 * system tech draws it: three lanes (stage · stage outputs · house), the
 * FOH path and the monitor path leaving the console separately, the
 * network return for a digital stagebox as a double dashed link. Signal-
 * present LEDs on every station chase with programme; a broken station
 * darkens everything downstream of it.
 *
 * Nodes are placed on a column/lane grid so the map reads at phone width:
 * five columns 68 apart, three lanes 84 apart in a 354 × 288 box (room above
 * the first lane for the bowed runs).
 *
 * Pure react-native-svg; LEDs and flow animate through Reanimated shared
 * values (primitive props only), and collapse to a steady state under
 * reduced motion.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import type { SignalLevel } from '../../../../features/soundsystems/types';
import { GearInSvg, INK, type GlyphKind } from './gearArt';
import { CABLE_COLORS } from './VenueView';
import { useProgrammeLevel } from './motion';

const ACircle = Animated.createAnimatedComponent(Circle);

export type MapState = 'ok' | 'none' | 'hot' | 'clip' | 'flag' | 'unknown';

export type MapNode = {
  id: string;
  kind: GlyphKind;
  label: string;
  /** 0 = stage lane (top), 1 = stage outputs, 2 = house (bottom). */
  lane: 0 | 1 | 2;
  /** 0..4 across. Fractional columns are fine (a node between two). */
  col: number;
  state?: MapState;
  /** A short reading under the label. */
  value?: string;
  /** Not reached by signal (downstream of a break) — LEDs dark. */
  dark?: boolean;
};

export type MapEdge = {
  from: string;
  to: string;
  level: SignalLevel | 'air';
  /** Both directions (the network return, the snake's returns). */
  both?: boolean;
  /** Draw dashed (a network or radio link). */
  dashed?: boolean;
  /** Drawn dark: the signal does not pass here. */
  dead?: boolean;
  /** Edge label at the midpoint. */
  label?: string;
};

export const MAP_W = 354;
const COLS = [38, 106, 174, 242, 310];
const LANES = [56, 140, 224];
export const MAP_H = 288;

export function mapXY(n: { lane: 0 | 1 | 2; col: number }): { x: number; y: number } {
  const c = Math.max(0, Math.min(4, n.col));
  const i = Math.floor(c);
  const f = c - i;
  const x = i >= 4 ? COLS[4] : COLS[i] + (COLS[i + 1] - COLS[i]) * f;
  return { x, y: LANES[n.lane] };
}

const STATE_COLOR: Record<MapState, string> = {
  ok: colors.greenBright,
  none: '#5a5f6a',
  hot: colors.amber,
  clip: colors.red,
  flag: colors.orange,
  unknown: '#3a3f4a',
};

/** How high a same-lane edge bows to clear the stations it passes over. */
const BOW = 62;

/** A straight run between two stations, leaving their rings clear. A run
 *  along one lane that would pass THROUGH another station bows over it
 *  instead — a straight line under a station would read as a chain the
 *  signal does not make. */
function edgePath(a: { x: number; y: number }, b: { x: number; y: number }, offset = 0, bow = false): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const r = 24;
  if (bow) {
    const ax = a.x + Math.sign(dx) * r * 0.7;
    const ay = a.y - r * 0.7;
    const bx = b.x - Math.sign(dx) * r * 0.7;
    const by = b.y - r * 0.7;
    return `M ${ax} ${ay} Q ${(ax + bx) / 2} ${a.y - BOW + offset} ${bx} ${by}`;
  }
  const ax = a.x + (dx / len) * r + nx * offset;
  const ay = a.y + (dy / len) * r + ny * offset;
  const bx = b.x - (dx / len) * r + nx * offset;
  const by = b.y - (dy / len) * r + ny * offset;
  return `M ${ax} ${ay} L ${bx} ${by}`;
}

/** The chevron's anchor and direction: the midpoint of a straight run, or
 *  the crown of a bow. */
function edgeMid(a: { x: number; y: number }, b: { x: number; y: number }, bow: boolean): { x: number; y: number; ux: number; uy: number } {
  if (bow) return { x: (a.x + b.x) / 2, y: a.y - (BOW + 17) / 2, ux: Math.sign(b.x - a.x), uy: 0 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ux: dx / len, uy: dy / len };
}

function chevron(m: { x: number; y: number; ux: number; uy: number }, color: string, both?: boolean) {
  const { ux, uy } = m;
  const tip = (px: number, py: number, s: number) => `${px + ux * 4 * s},${py + uy * 4 * s} ${px - ux * 3 * s - uy * 3},${py - uy * 3 * s + ux * 3} ${px - ux * 3 * s + uy * 3},${py - uy * 3 * s - ux * 3}`;
  return (
    <>
      <Polygon points={tip(m.x, m.y, 1)} fill={color} opacity={0.9} />
      {both ? <Polygon points={tip(m.x - ux * 12, m.y - uy * 12, -1)} fill={color} opacity={0.9} /> : null}
    </>
  );
}

function Led({ x, y, state, dark, programme }: { x: number; y: number; state: MapState; dark: boolean; programme: SharedValue<number> }) {
  const color = state === 'unknown' ? '#1a1d24' : STATE_COLOR[state];
  const props = useAnimatedProps(() => {
    if (dark || state === 'none') return { opacity: 0.18 };
    if (state === 'unknown') return { opacity: 1 };
    if (state === 'clip') return { opacity: programme.value > 0.82 ? 1 : 0.3 };
    return { opacity: 0.45 + 0.55 * (programme.value > 0.3 ? 1 : 0) };
  });
  return (
    <G>
      <ACircle cx={x} cy={y} r={7.5} fill={color} opacity={0.2} animatedProps={props} />
      <ACircle cx={x} cy={y} r={3.6} fill={color} stroke="#000" strokeWidth={0.6} animatedProps={props} />
      {state === 'unknown' ? <SvgText x={x} y={y + 2.4} fontSize={6.5} fill={INK.metalHi} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">?</SvgText> : null}
    </G>
  );
}

export function SystemMap({ nodes, edges, selectedId, onTap, a11y, running = true, laneLabels }: { nodes: readonly MapNode[]; edges: readonly MapEdge[]; selectedId?: string | null; onTap?: (id: string) => void; a11y: string; running?: boolean; laneLabels?: readonly [string, string, string] }) {
  const programme = useProgrammeLevel(running);
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, mapXY(n)])), [nodes]);
  const lanes = laneLabels ?? ['STAGE', 'CONSOLE · RACKS', 'LOUDSPEAKERS'];
  /** Does a straight run along the lane from a to b pass under another station? */
  const blocked = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.abs(a.y - b.y) < 1 && [...pos.values()].some((q) => Math.abs(q.y - a.y) < 1 && q.x > Math.min(a.x, b.x) + 1 && q.x < Math.max(a.x, b.x) - 1);
  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ aspectRatio: MAP_W / MAP_H }}>
        <Rect x={0} y={0} width={MAP_W} height={MAP_H} rx={12} fill="#0e1015" stroke={colors.hairline} strokeWidth={0.8} />
        {/* lanes */}
        {LANES.map((y, i) => (
          <G key={i}>
            <Line x1={8} y1={y + 42} x2={MAP_W - 8} y2={y + 42} stroke="#1c1f27" strokeWidth={0.8} />
            <SvgText x={10} y={y - 30} fontSize={6.5} fill="#4a505c" fontFamily={fonts.oswaldMedium} letterSpacing={1.6}>{lanes[i]}</SvgText>
          </G>
        ))}
        {/* edges */}
        {edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const color = e.level === 'air' ? '#8a8b93' : CABLE_COLORS[e.level];
          const bow = blocked(a, b);
          const d = edgePath(a, b, 0, bow);
          const d2 = e.both ? edgePath(a, b, 3, bow) : null;
          const mid = edgeMid(a, b, bow);
          const dead = !!e.dead;
          return (
            <G key={i} opacity={dead ? 0.3 : 1}>
              <Path d={d} stroke="#05060a" strokeWidth={4.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={d} stroke={color} strokeWidth={e.both ? 1.6 : 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={e.dashed || e.level === 'wireless' ? '3 4' : dead ? '2 4' : undefined} />
              {d2 ? <Path d={d2} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeDasharray="3 4" /> : null}
              {e.level === 'air' ? <Path d={d} stroke="#fff" strokeWidth={0.5} fill="none" opacity={0.25} strokeDasharray="1 3" /> : null}
              {chevron(mid, color, e.both)}
              {e.label ? (() => {
                if (bow) return <SvgText x={mid.x + 8} y={mid.y + 2} fontSize={5} fill={color} fontFamily={fonts.oswaldMedium} textAnchor="start" letterSpacing={0.6}>{e.label}</SvgText>;
                if (Math.abs(mid.uy) < 0.3) return <SvgText x={mid.x} y={mid.y - 6} fontSize={5} fill={color} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>{e.label}</SvgText>;
                const ly = b.y - 30;
                const t = (ly - a.y) / (b.y - a.y);
                const lx = a.x + t * (b.x - a.x);
                const right = mid.ux < 0;
                return <SvgText x={lx + (right ? 6 : -6)} y={ly + 2} fontSize={5} fill={color} fontFamily={fonts.oswaldMedium} textAnchor={right ? 'start' : 'end'} letterSpacing={0.6}>{e.label}</SvgText>;
              })() : null}
            </G>
          );
        })}
        {/* nodes */}
        {nodes.map((n) => {
          const { x, y } = pos.get(n.id)!;
          const sel = selectedId === n.id;
          const state = n.state ?? 'ok';
          const ring = state === 'unknown' ? '#3a3f4a' : STATE_COLOR[state];
          return (
            <G key={n.id}>
              <Circle cx={x} cy={y} r={24} fill="#13161d" stroke={sel ? colors.cyanBright : ring} strokeWidth={sel ? 2 : 1.1} opacity={n.dark ? 0.6 : 1} />
              {state !== 'ok' && state !== 'unknown' ? <Circle cx={x} cy={y} r={24} fill={ring} opacity={0.1} /> : null}
              <GearInSvg kind={n.kind} id={`sm-${n.id}`} x={x} y={y} size={34} dim={!!n.dark || state === 'none'} power={n.dark || state === 'none' ? 'off' : 'on'} />
              <Led x={x + 18} y={y - 18} state={state} dark={!!n.dark} programme={programme} />
              <SvgText x={x} y={y + 33} fontSize={7} fill={sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.5}>
                {n.label.toUpperCase()}
              </SvgText>
              {n.value ? (
                <SvgText x={x} y={y + 41} fontSize={6.5} fill={ring} fontFamily={fonts.mono} textAnchor="middle">{n.value}</SvgText>
              ) : null}
              {onTap ? <Circle cx={x} cy={y + 6} r={30} fill="transparent" onPress={() => onTap(n.id)} accessibilityLabel={`${n.label}${state === 'unknown' ? ', not probed — tap to probe' : `, reads ${state === 'ok' ? 'healthy' : state === 'none' ? 'no signal' : state}`}${n.value ? `, ${n.value}` : ''}${sel ? ', selected' : ''}`} /> : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** The reading key under a bench — colours paired with words. */
export function ReadingKey() {
  const rows: { s: MapState; w: string }[] = [
    { s: 'ok', w: 'signal present' },
    { s: 'none', w: 'no signal' },
    { s: 'hot', w: 'hot' },
    { s: 'clip', w: 'clipping' },
    { s: 'flag', w: 'wrong / flagged' },
    { s: 'unknown', w: 'not probed' },
  ];
  return (
    <View style={styles.key} accessibilityRole="list">
      {rows.map((r) => (
        <View key={r.s} style={styles.keyItem} accessible accessibilityLabel={`${r.w} reading`}>
          <View style={[styles.dot, { backgroundColor: STATE_COLOR[r.s] }]} />
          <Text style={styles.keyText}>{r.w}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── the canonical maps ──────────────────────────────────────────────────── */

export type MapVariant = { input: 'snake' | 'stagebox'; house: 'passive' | 'powered' };

/** Chapter 1's map: three sources into the stage input, the console, the
 *  FOH path (in one of two builds) and the monitor path. */
export function chapterOneMap(v: MapVariant): { nodes: MapNode[]; edges: MapEdge[] } {
  const stagebox = v.input === 'stagebox';
  const nodes: MapNode[] = [
    { id: 'mic', kind: 'vocalMic', label: 'Vocal mic', lane: 0, col: 0 },
    { id: 'di', kind: 'di', label: 'Bass → DI', lane: 0, col: 1 },
    { id: 'pb', kind: 'playback', label: 'Playback', lane: 0, col: 2 },
    { id: 'box', kind: stagebox ? 'stagebox' : 'snake', label: stagebox ? 'Stagebox' : 'Snake', lane: 0, col: 3.5 },
    { id: 'con', kind: 'console', label: 'Console', lane: 1, col: 2.1 },
    ...(v.house === 'passive'
      ? [
          { id: 'proc', kind: 'processor', label: 'Processor', lane: 1, col: 3.15 } as MapNode,
          { id: 'amp', kind: 'amp', label: 'Amps', lane: 1, col: 4 } as MapNode,
          { id: 'top', kind: 'passiveSpeaker', label: 'Tops', lane: 2, col: 3 } as MapNode,
          { id: 'sub', kind: 'passiveSub', label: 'Subs', lane: 2, col: 4 } as MapNode,
        ]
      : [
          { id: 'top', kind: 'poweredSpeaker', label: 'Powered tops', lane: 2, col: 3 } as MapNode,
          { id: 'sub', kind: 'poweredSub', label: 'Powered sub', lane: 2, col: 4 } as MapNode,
        ]),
    { id: 'iemtx', kind: 'iemTx', label: 'IEM TX', lane: 1, col: 0 },
    { id: 'mamp', kind: 'amp', label: 'Monitor amp', lane: 1, col: 0.9 },
    { id: 'wedge', kind: 'wedge', label: 'Wedge', lane: 2, col: 0.5 },
    { id: 'ear', kind: 'listener', label: 'Listener', lane: 2, col: 2 },
  ];
  const inLevel: SignalLevel = 'mic';
  const edges: MapEdge[] = [
    { from: 'mic', to: 'box', level: inLevel },
    { from: 'di', to: 'box', level: 'mic' },
    { from: 'pb', to: 'box', level: 'line' },
    { from: 'box', to: 'con', level: stagebox ? 'digital' : 'mic', both: true, dashed: stagebox, label: stagebox ? 'NETWORK · BOTH WAYS' : 'MULTICORE + RETURNS' },
    ...(v.house === 'passive'
      ? ([
          { from: 'con', to: 'proc', level: 'line', label: 'MAIN L/R' },
          { from: 'proc', to: 'amp', level: 'line' },
          { from: 'amp', to: 'top', level: 'speaker' },
          { from: 'amp', to: 'sub', level: 'speaker', label: 'LOW' },
        ] as MapEdge[])
      : ([
          { from: 'con', to: 'top', level: 'line', label: 'MAIN L/R' },
          { from: 'con', to: 'sub', level: 'line', label: 'SUB OUT' },
        ] as MapEdge[])),
    { from: 'con', to: 'mamp', level: 'line', label: 'AUX 1 · PRE' },
    { from: 'mamp', to: 'wedge', level: 'speaker' },
    { from: 'con', to: 'iemtx', level: 'line', label: 'AUX 2 · stereo' },
    { from: 'top', to: 'ear', level: 'air' },
  ];
  return { nodes, edges };
}

/** The bench's house path as a map: nine stations, console drawn once with
 *  IN and OUT readings. Labels/kinds can be overridden per fault (a monitor
 *  fault walks aux → monitor amp → wedge → performer). */
export function benchMap(labels: Partial<Record<string, string>>, kinds: Partial<Record<string, GlyphKind>>): { nodes: MapNode[]; edges: MapEdge[] } {
  const L = (id: string, d: string) => labels[id] ?? d;
  const K = (id: string, d: GlyphKind) => kinds[id] ?? d;
  const nodes: MapNode[] = [
    { id: 'source', kind: K('source', 'vocalMic'), label: L('source', 'Source'), lane: 0, col: 0 },
    { id: 'cable', kind: K('cable', 'snake'), label: L('cable', 'Cable'), lane: 0, col: 1 },
    { id: 'stagebox', kind: K('stagebox', 'stagebox'), label: L('stagebox', 'Stage input'), lane: 0, col: 2 },
    { id: 'consoleIn', kind: 'console', label: L('consoleIn', 'Console IN'), lane: 1, col: 1 },
    { id: 'consoleOut', kind: 'console', label: L('consoleOut', 'Console OUT'), lane: 1, col: 2 },
    { id: 'processor', kind: K('processor', 'processor'), label: L('processor', 'Processor'), lane: 1, col: 3 },
    { id: 'amp', kind: K('amp', 'amp'), label: L('amp', 'Amplifier'), lane: 1, col: 4 },
    { id: 'speaker', kind: K('speaker', 'passiveSpeaker'), label: L('speaker', 'Loudspeaker'), lane: 2, col: 3.5 },
    { id: 'listener', kind: K('listener', 'listener'), label: L('listener', 'Listener'), lane: 2, col: 2.2 },
  ];
  const edges: MapEdge[] = [
    { from: 'source', to: 'cable', level: 'mic' },
    { from: 'cable', to: 'stagebox', level: 'mic' },
    { from: 'stagebox', to: 'consoleIn', level: 'digital', dashed: true },
    { from: 'consoleIn', to: 'consoleOut', level: 'line' },
    { from: 'consoleOut', to: 'processor', level: 'line' },
    { from: 'processor', to: 'amp', level: 'line' },
    { from: 'amp', to: 'speaker', level: 'speaker' },
    { from: 'speaker', to: 'listener', level: 'air' },
  ];
  return { nodes, edges };
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  key: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.5, borderColor: '#000' },
  keyText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
});
