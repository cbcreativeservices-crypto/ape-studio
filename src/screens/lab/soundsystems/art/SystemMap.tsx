/**
 * SystemMap — a live sound system drawn as a one-line diagram, the way a
 * system tech draws it: three COLUMNS (stage · console + racks · loudspeakers),
 * each read top to bottom — the column's inputs at the top, its outputs at
 * the bottom — and the hand-off from one column to the next drawn as a
 * cable running ACROSS at the row where the signal passes on (owner,
 * TestFlight 2026-09-28: "3 columns rather than 3 rows … horizontal cables
 * showing at which point they pass signal on"). The FOH path and the monitor
 * path leave the console separately; a digital stagebox's network link is a
 * double dashed run. Signal-present LEDs on every station chase with
 * programme; a broken station darkens everything downstream of it.
 *
 * Routing rules (every cable is orthogonal — a drawing, not a doodle):
 *   · station → the station directly below it: a straight drop.
 *   · station → a station further down its own column (a console's aux
 *     sends past the FOH rack, three sources into one stagebox): the cable
 *     leaves the bottom, runs down a trunk beside the column and turns back
 *     in at the top of the station it feeds — nearer feeds on the inner lane,
 *     so trunks never cross.
 *   · station → the next column: leaves the right edge, and when the rows
 *     differ it jogs up or down in the gutter — the farther feed on the inner
 *     lane, so gutters never cross either.
 *   · every cable ends in an arrowhead at the station it feeds; a two-way
 *     link (the network, the snake's returns) carries one at each end.
 *
 * The box is 354 × 240 (aspect 1.475) so it fills a phone's glass edge to
 * edge and draws at ~0.97 px per unit; MAP_FS is 10 units, so every word on
 * it reads at 9 pt or more inline (owner 2026-09-25) and FULL SCREEN zooms
 * the same drawing. A cable's label (MAIN L/R, AUX 1 · PRE, NETWORK) is
 * printed in the card of the station it FEEDS, in the cable's colour, and a
 * probed station's reading takes the same line.
 *
 * Pure react-native-svg; LEDs animate through Reanimated shared values
 * (primitive props only) and collapse to a steady state under reduced motion.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
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
  /** 0 = STAGE (left), 1 = CONSOLE · RACKS (middle), 2 = LOUDSPEAKERS (right). */
  col: 0 | 1 | 2;
  /** 0 at the top of the column (its inputs) … 4 at the bottom (its outputs). */
  row: number;
  state?: MapState;
  /** A short reading printed in the card (a probe's result). */
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
  /** The cable's name, printed in the card of the station it feeds. */
  label?: string;
};

export const MAP_W = 354;
export const MAP_H = 240;
/** Every word on the map, in map units (× ~0.97 on a phone ≥ 9.3 pt). */
const MAP_FS = 10;
/** Card geometry: three columns of 90-wide cards, 24-unit gutters for the
 *  cross cables, 18-unit margins for the outer trunks. */
const CW = 90;
const CH = 32;
const GUT = 24;
const MARGIN = 18;
const COL_X = [MARGIN, MARGIN + CW + GUT, MARGIN + 2 * (CW + GUT)];
const ROW_Y0 = 20;
const ROW_PITCH = 44;
const ROWS = 5;
const GLYPH = 22;
/** Lane spacing for parallel trunks / jogs. */
const LANE = 5;

type Box = { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; col: number; row: number };

function nodeBox(n: { col: 0 | 1 | 2; row: number }): Box {
  const col = Math.max(0, Math.min(2, n.col));
  const row = Math.max(0, Math.min(ROWS - 1, n.row));
  const x0 = COL_X[col];
  const y0 = ROW_Y0 + row * ROW_PITCH;
  return { x0, y0, x1: x0 + CW, y1: y0 + CH, cx: x0 + CW / 2, cy: y0 + CH / 2, col, row };
}

/** A station's centre, for anything that wants to point at it. */
export function mapXY(n: { col: 0 | 1 | 2; row: number }): { x: number; y: number } {
  const b = nodeBox(n);
  return { x: b.cx, y: b.cy };
}

const STATE_COLOR: Record<MapState, string> = {
  ok: colors.greenBright,
  none: '#5a5f6a',
  hot: colors.amber,
  clip: colors.red,
  flag: colors.orange,
  unknown: '#3a3f4a',
};

type Pt = { x: number; y: number };

/** The orthogonal route of one cable (see the header). `k` is the cable's
 *  lane when it shares a trunk or a gutter with others. */
function routeEdge(a: Box, b: Box, k: number): Pt[] {
  if (a.col === b.col) {
    if (b.row === a.row + 1) return [{ x: a.cx, y: a.y1 }, { x: b.cx, y: b.y0 }];
    if (b.row === a.row - 1) return [{ x: a.cx, y: a.y0 }, { x: b.cx, y: b.y1 }];
    if (b.row === a.row) return [{ x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }];
    // A trunk beside the column: the outer side (left for the stage and the
    // racks, right for the loudspeakers — their left gutter is busy with the
    // cables arriving from the racks).
    const right = a.col === 2;
    const exitX = right ? a.x1 - 8 : a.x0 + 8;
    const lane = right ? a.x1 + 7 + LANE * k : a.x0 - 7 - LANE * k;
    // Entries 9 apart so two arrowheads into one station stand clear.
    const entryX = right ? b.x1 - 18 + 9 * k : b.x0 + 18 - 9 * k;
    const turnY = b.y0 - 10 + 3 * k;
    return [
      { x: exitX, y: a.y1 },
      { x: exitX, y: a.y1 + 6 },
      { x: lane, y: a.y1 + 6 },
      { x: lane, y: turnY },
      { x: entryX, y: turnY },
      { x: entryX, y: b.y0 },
    ];
  }
  if (b.col > a.col) {
    if (b.row === a.row) return [{ x: a.x1, y: a.cy }, { x: b.x0, y: b.cy }];
    const lane = a.x1 + 5 + LANE * k;
    return [{ x: a.x1, y: a.cy }, { x: lane, y: a.cy }, { x: lane, y: b.cy }, { x: b.x0, y: b.cy }];
  }
  if (b.row === a.row) return [{ x: a.x0, y: a.cy }, { x: b.x1, y: b.cy }];
  const lane = a.x0 - 5 - LANE * k;
  return [{ x: a.x0, y: a.cy }, { x: lane, y: a.cy }, { x: lane, y: b.cy }, { x: b.x1, y: b.cy }];
}

/** The same orthogonal polyline shifted `d` units (horizontals down,
 *  verticals right) — the second line of a two-way link. */
function offsetPoly(pts: Pt[], d: number): Pt[] {
  const n = pts.length;
  if (n < 2) return pts;
  const horiz = (i: number) => Math.abs(pts[i + 1].y - pts[i].y) < 1e-6;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? horiz(i - 1) : undefined;
    const next = i < n - 1 ? horiz(i) : undefined;
    const h = prev === undefined ? next : prev;
    if (prev !== undefined && next !== undefined && prev !== next) out.push({ x: pts[i].x + d, y: pts[i].y + d });
    else out.push(h ? { x: pts[i].x, y: pts[i].y + d } : { x: pts[i].x + d, y: pts[i].y });
  }
  return out;
}

const polyPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

/** The arrowhead: its tip ON the station's edge, pointing along the cable's
 *  last run. Wider than the run and edged in the map's dark, so it reads as
 *  an arrow rather than a thickening of the line (owner 2026-09-25). */
function chevron(tipAt: Pt, from: Pt, color: string, key: string) {
  const dx = tipAt.x - from.x;
  const dy = tipAt.y - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const L = 7.5;
  const W = 4.2;
  const bx = tipAt.x - ux * L;
  const by = tipAt.y - uy * L;
  const pts = `${tipAt.x},${tipAt.y} ${bx - uy * W},${by + ux * W} ${bx + uy * W},${by - ux * W}`;
  return <Polygon key={key} points={pts} fill={color} stroke="#05060a" strokeWidth={0.9} strokeLinejoin="round" />;
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
      {/* not probed: a larger dark lamp with a readable '?' in it */}
      <ACircle cx={x} cy={y} r={state === 'unknown' ? 6.4 : 3.6} fill={color} stroke="#000" strokeWidth={0.6} animatedProps={props} />
      {state === 'unknown' ? <SvgText x={x} y={y + 3.4} fontSize={MAP_FS} fill={INK.metalHi} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">?</SvgText> : null}
    </G>
  );
}

export function SystemMap({ nodes, edges, selectedId, onTap, a11y, running = true, columnLabels }: { nodes: readonly MapNode[]; edges: readonly MapEdge[]; selectedId?: string | null; onTap?: (id: string) => void; a11y: string; running?: boolean; columnLabels?: readonly [string, string, string] }) {
  const programme = useProgrammeLevel(running);
  const box = useMemo(() => new Map(nodes.map((n) => [n.id, nodeBox(n)])), [nodes]);
  const cols = columnLabels ?? ['STAGE', 'CONSOLE · RACKS', 'LOUDSPEAKERS'];
  /** Lane per cable that shares a trunk or a gutter (see routeEdge). */
  const lanes = useMemo(() => {
    const groups = new Map<string, { i: number; len: number }[]>();
    edges.forEach((e, i) => {
      const a = box.get(e.from);
      const b = box.get(e.to);
      if (!a || !b) return;
      const len = Math.abs(b.row - a.row);
      if (a.col === b.col) {
        if (len > 1) (groups.get(`t${a.col}`) ?? groups.set(`t${a.col}`, []).get(`t${a.col}`)!).push({ i, len });
      } else if (len > 0) {
        const g = `g${Math.min(a.col, b.col)}`;
        (groups.get(g) ?? groups.set(g, []).get(g)!).push({ i, len });
      }
    });
    const out = new Map<number, number>();
    for (const [g, list] of groups) {
      // A trunk: the nearer feed takes the inner lane. A gutter jog: the
      // farther feed does — either way the runs nest and never cross.
      list.sort((p, q) => (g.startsWith('t') ? p.len - q.len : q.len - p.len));
      list.forEach((it, k) => out.set(it.i, k));
    }
    return out;
  }, [edges, box]);
  /** A cable's label, printed in the card of the station it feeds. */
  const feedTag = new Map<string, { text: string; color: string }>();
  for (const e of edges) if (e.label && !feedTag.has(e.to)) feedTag.set(e.to, { text: e.label, color: e.level === 'air' ? '#8a8b93' : CABLE_COLORS[e.level] });
  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ aspectRatio: MAP_W / MAP_H }}>
        <Rect x={0} y={0} width={MAP_W} height={MAP_H} rx={12} fill="#0e1015" stroke={colors.hairline} strokeWidth={0.8} />
        {/* the three columns: a faint zone each, its name across the top */}
        {COL_X.map((x0, i) => (
          <G key={i}>
            <Rect x={x0 - 3} y={16} width={CW + 6} height={MAP_H - 22} rx={6} fill="#111419" stroke="#1a1d25" strokeWidth={0.8} />
            <SvgText x={x0 + CW / 2} y={11.5} fontSize={MAP_FS} fill="#6a707c" fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>
              {cols[i]}
            </SvgText>
          </G>
        ))}
        {/* cables */}
        {edges.map((e, i) => {
          const a = box.get(e.from);
          const b = box.get(e.to);
          if (!a || !b) return null;
          const color = e.level === 'air' ? '#8a8b93' : CABLE_COLORS[e.level];
          const pts = routeEdge(a, b, lanes.get(i) ?? 0);
          const d = polyPath(pts);
          const pts2 = e.both ? offsetPoly(pts, 3) : null;
          const d2 = pts2 ? polyPath(pts2) : null;
          const dead = !!e.dead;
          const dash = e.dashed || e.level === 'wireless' ? '3 4' : dead ? '2 4' : undefined;
          return (
            <G key={i} opacity={dead ? 0.3 : 1}>
              {/* Runs are drawn thin (a cable, not a pipe) so the arrowhead
                  stands clear of them — owner 2026-09-25. */}
              <Path d={d} stroke="#05060a" strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {d2 ? <Path d={d2} stroke="#05060a" strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
              <Path d={d} stroke={color} strokeWidth={e.both ? 1.1 : 1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
              {d2 ? <Path d={d2} stroke={color} strokeWidth={1.1} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" /> : null}
              {e.level === 'air' ? <Path d={d} stroke="#fff" strokeWidth={0.5} fill="none" opacity={0.25} strokeDasharray="1 3" /> : null}
              {chevron(pts[pts.length - 1], pts[pts.length - 2], color, 'fwd')}
              {pts2 ? chevron(pts2[0], pts2[1], color, 'back') : null}
            </G>
          );
        })}
        {/* stations */}
        {nodes.map((n) => {
          const bx = box.get(n.id)!;
          const sel = selectedId === n.id;
          const state = n.state ?? 'ok';
          const ring = state === 'unknown' ? '#3a3f4a' : STATE_COLOR[state];
          const tag = n.value ? { text: n.value, color: ring } : feedTag.get(n.id);
          const lines = cardLines(mapLabel(n.label), tag?.text);
          const textX = bx.x0 + 26;
          const baseY = lines.length === 1 ? [bx.cy + 3.5] : lines.length === 2 ? [bx.y0 + 12.5, bx.y0 + 24.5] : [bx.y0 + 10.2, bx.y0 + 20.2, bx.y0 + 30.2];
          return (
            <G key={n.id}>
              <Rect x={bx.x0} y={bx.y0} width={CW} height={CH} rx={5} fill="#13161d" stroke={sel ? colors.cyanBright : ring} strokeWidth={sel ? 2 : 1.1} opacity={n.dark ? 0.6 : 1} />
              {state !== 'ok' && state !== 'unknown' ? <Rect x={bx.x0} y={bx.y0} width={CW} height={CH} rx={5} fill={ring} opacity={0.1} /> : null}
              <GearInSvg kind={n.kind} id={`sm-${n.id}`} x={bx.x0 + 13} y={bx.cy + 1} size={GLYPH} dim={!!n.dark || state === 'none'} power={n.dark || state === 'none' ? 'off' : 'on'} />
              <Led x={bx.x0 + 1} y={bx.y0 + 1} state={state} dark={!!n.dark} programme={programme} />
              {lines.map((line, k) => (
                <SvgText key={k} x={textX} y={baseY[k]} fontSize={MAP_FS} fill={line.tag ? tag!.color : sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="start" letterSpacing={line.tag ? 0 : 0.3}>
                  {line.text}
                </SvgText>
              ))}
              {onTap ? <Rect x={bx.x0 - 3} y={bx.y0 - 4} width={CW + 6} height={CH + 8} fill="transparent" onPress={() => onTap(n.id)} accessibilityLabel={`${n.label}${state === 'unknown' ? ', not probed — tap to probe' : `, reads ${state === 'ok' ? 'healthy' : state === 'none' ? 'no signal' : state}`}${n.value ? `, ${n.value}` : ''}${sel ? ', selected' : ''}`} /> : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** The text lines of a card: the station's name (broken onto two lines when
 *  it is wider than the card's text area — POWERED CABINET), then the cable
 *  name or the reading, in its own colour. Three lines at most. */
function cardLines(label: string, tag?: string): { text: string; tag: boolean }[] {
  const cut = label.indexOf(' ');
  const nameLines = label.length > 12 && cut > 0 ? [label.slice(0, cut), label.slice(cut + 1)] : [label];
  const out = nameLines.map((text) => ({ text, tag: false }));
  if (tag) out.push({ text: tag, tag: true });
  return out;
}

/** A station's name as the map prints it: upper case, without a
 *  parenthetical ("Powered cabinet (amp inside)" → POWERED CABINET) — the
 *  full name stays in the accessibility label, the probe list and the cards. */
function mapLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*/g, ' ').trim().toUpperCase();
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

/** Chapter 1's map: three sources into the stage input (the STAGE column's
 *  output, at its foot), across to the console at the head of the racks
 *  column, the FOH path down through processing and amplification (or
 *  straight across to powered boxes), the monitor path down to the monitor
 *  amp and the IEM transmitter, and every loudspeaker on its own cable in the
 *  third column — nothing daisy-chained. */
export function chapterOneMap(v: MapVariant): { nodes: MapNode[]; edges: MapEdge[] } {
  const stagebox = v.input === 'stagebox';
  const nodes: MapNode[] = [
    { id: 'mic', kind: 'vocalMic', label: 'Vocal mic', col: 0, row: 0 },
    { id: 'di', kind: 'di', label: 'Bass → DI', col: 0, row: 1 },
    { id: 'pb', kind: 'playback', label: 'Playback', col: 0, row: 2 },
    { id: 'box', kind: stagebox ? 'stagebox' : 'snake', label: stagebox ? 'Stagebox' : 'Snake', col: 0, row: 3 },
    { id: 'con', kind: 'console', label: 'Console', col: 1, row: 0 },
    ...(v.house === 'passive'
      ? [
          { id: 'proc', kind: 'processor', label: 'Processor', col: 1, row: 1 } as MapNode,
          { id: 'amp', kind: 'amp', label: 'Amps', col: 1, row: 2 } as MapNode,
          { id: 'top', kind: 'passiveSpeaker', label: 'Tops', col: 2, row: 1 } as MapNode,
          { id: 'sub', kind: 'passiveSub', label: 'Subs', col: 2, row: 2 } as MapNode,
        ]
      : [
          { id: 'top', kind: 'poweredSpeaker', label: 'Powered tops', col: 2, row: 1 } as MapNode,
          { id: 'sub', kind: 'poweredSub', label: 'Powered sub', col: 2, row: 2 } as MapNode,
        ]),
    { id: 'mamp', kind: 'amp', label: 'Monitor amp', col: 1, row: 3 },
    { id: 'iemtx', kind: 'iemTx', label: 'IEM TX', col: 1, row: 4 },
    { id: 'wedge', kind: 'wedge', label: 'Wedge', col: 2, row: 3 },
    { id: 'ear', kind: 'listener', label: 'Listener', col: 2, row: 4 },
  ];
  const inLevel: SignalLevel = 'mic';
  const edges: MapEdge[] = [
    { from: 'mic', to: 'box', level: inLevel },
    { from: 'di', to: 'box', level: 'mic' },
    { from: 'pb', to: 'box', level: 'line' },
    { from: 'box', to: 'con', level: stagebox ? 'digital' : 'mic', both: true, dashed: stagebox, label: stagebox ? 'NETWORK' : 'MULTICORE' },
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
    { from: 'con', to: 'iemtx', level: 'line', label: 'AUX 2 · STEREO' },
    { from: 'top', to: 'ear', level: 'air' },
    { from: 'sub', to: 'ear', level: 'air' },
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
    { id: 'source', kind: K('source', 'vocalMic'), label: L('source', 'Source'), col: 0, row: 0 },
    { id: 'cable', kind: K('cable', 'snake'), label: L('cable', 'Cable'), col: 0, row: 1 },
    { id: 'stagebox', kind: K('stagebox', 'stagebox'), label: L('stagebox', 'Stage input'), col: 0, row: 2 },
    { id: 'consoleIn', kind: 'console', label: L('consoleIn', 'Console IN'), col: 1, row: 0 },
    { id: 'consoleOut', kind: 'console', label: L('consoleOut', 'Console OUT'), col: 1, row: 1 },
    { id: 'processor', kind: K('processor', 'processor'), label: L('processor', 'Processor'), col: 1, row: 2 },
    { id: 'amp', kind: K('amp', 'amp'), label: L('amp', 'Amplifier'), col: 1, row: 3 },
    { id: 'speaker', kind: K('speaker', 'passiveSpeaker'), label: L('speaker', 'Loudspeaker'), col: 2, row: 3 },
    { id: 'listener', kind: K('listener', 'listener'), label: L('listener', 'Listener'), col: 2, row: 4 },
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
