/**
 * EventFlow — the SIGNAL-FLOW BOARD of the troubleshooting screens (23, 24):
 * every source, channel, bus and output of the event as a card on one
 * board, joined by the routes the render actually takes, each card with its
 * LIVE meter (the render's own tap). It is the engineer's method drawn:
 * follow the signal from the source and find the LAST live meter — the
 * fault sits just after it.
 *
 * A board is DATA, so its cards and routes are clean diagrams (charter §2:
 * abstract data may stay abstract) — but each card carries a small drawing
 * of the real object (a laptop, a player, a mic, a speaker, headphones, a
 * recorder), never a bare box standing for it. Text is 9 pt or more at
 * every size (useLabelMm) and grows with the full-screen zoom.
 *
 * SECOND VISUAL REVIEW 2026-10-18 (findings 20, 21): every card measures
 * its words and wraps a line that does not fit (never runs past its edge);
 * the meter ladder has its own slot; a route's label sits on its own lane
 * on a plate; prediction tags sit off the junctions; power cords are ONE
 * line each, in their own lanes, hopping where they cross, with a plug
 * body at the outlet (`Cords`).
 */
import { useContext, useMemo, type ReactNode } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Oval, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { LedColumn } from './parts';
import { useTapDb } from './motion';
import { useExtTapDb } from './eventMotion';
import type { Tap } from '../engine/djRender';
import type { EvTap } from '../engine/djEventRender';
import { SceneFontsContext, SceneText, useLabelMm } from './sceneText';

export type FlowIcon = 'laptop' | 'player' | 'mic' | 'mixer' | 'speaker' | 'monitor' | 'phones' | 'recorder' | 'strip' | 'wall';
export type FlowState = 'live' | 'idle' | 'cut' | 'hum' | 'clip';

export type FlowNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  icon?: FlowIcon;
  /** Its meter: the render's tap (a booth tap, or an event tap with `ext`). */
  tap?: Tap;
  extTap?: EvTap;
  state?: FlowState;
  onAir?: boolean;
  /** ADDITIVE: an outlet card (a strip, a wall socket) draws a socket at
   *  each of these x (board units) along its top edge — where the cords end. */
  sockets?: readonly number[];
};

export type FlowLink = { from: string; to: string; state: FlowState; label?: string; tag?: number; bend?: number; fromY?: number; toY?: number };

const STATE_COL: Record<FlowState, string> = { live: INK.blue, idle: '#4a4d54', cut: INK.peak, hum: INK.amber, clip: INK.peak };

/* ── tiny drawings of the real objects (LOD for a 24 × 18 icon box) ───── */

function Icon({ kind, x, y, s }: { kind: FlowIcon; x: number; y: number; s: number }) {
  const g = (children: ReactNode) => <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>{children}</Group>;
  switch (kind) {
    case 'laptop':
      return g(
        <Group>
          <RoundedRect x={2} y={0} width={20} height={12} r={1.2}>
            <LinearGradient start={vec(2, 0)} end={vec(22, 12)} colors={['#3a3d43', '#1a1b1f']} />
          </RoundedRect>
          <RoundedRect x={3.4} y={1.3} width={17.2} height={9.4} r={0.6}>
            <LinearGradient start={vec(0, 1)} end={vec(0, 11)} colors={['#14304a', '#08121d']} />
          </RoundedRect>
          <Path path={Skia.Path.MakeFromSVGString('M0 13 L24 13 L22 16 L2 16 Z')!}>
            <LinearGradient start={vec(0, 13)} end={vec(0, 16)} colors={['#6f757e', '#2a2c31']} />
          </Path>
        </Group>,
      );
    case 'player':
      return g(
        <Group>
          <RoundedRect x={3} y={0} width={18} height={18} r={1.6}>
            <LinearGradient start={vec(3, 0)} end={vec(21, 18)} colors={['#3a3d43', '#16171a']} />
          </RoundedRect>
          <Circle cx={12} cy={11} r={5.4} color="#0b0c0e" />
          <Circle cx={12} cy={11} r={5.4} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.3)" />
          <RoundedRect x={8} y={2} width={8} height={3.4} r={0.5} color="#14304a" />
        </Group>,
      );
    case 'mic':
      return g(
        <Group>
          <Path path={Skia.Path.MakeFromSVGString('M8 9 L22 6 L22 12 Z')!}>
            <LinearGradient start={vec(0, 6)} end={vec(0, 12)} colors={['#7c818a', '#1b1c20']} />
          </Path>
          <Circle cx={6} cy={9} r={5.5}>
            <RadialGradient c={vec(4.4, 7.2)} r={7} colors={['#c9ced5', '#3a3d43']} />
          </Circle>
        </Group>,
      );
    case 'speaker':
    case 'monitor':
      return g(
        <Group>
          <Path path={Skia.Path.MakeFromSVGString('M5 0 L19 0 L18 18 L6 18 Z')!}>
            <LinearGradient start={vec(5, 0)} end={vec(19, 18)} colors={['#34373d', '#121316']} />
          </Path>
          <RoundedRect x={8} y={2.4} width={8} height={3} r={1} color="#060607" />
          <Circle cx={12} cy={11.6} r={4.6} color="#0b0c0e" />
          <Circle cx={12} cy={11.6} r={4.6} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.22)" />
          <Circle cx={12} cy={11.6} r={1.4} color="#5a5e66" />
        </Group>,
      );
    case 'phones':
      return g(
        <Group>
          <Path path={Skia.Path.MakeFromSVGString('M4 11 C4 1 20 1 20 11')!} style="stroke" strokeWidth={2} color="#5a5e66" />
          <Oval x={1.6} y={8} width={6} height={9} color="#1d1f23" />
          <Oval x={16.4} y={8} width={6} height={9} color="#1d1f23" />
        </Group>,
      );
    case 'recorder':
      return g(
        <Group>
          <RoundedRect x={6} y={0} width={12} height={18} r={2}>
            <LinearGradient start={vec(6, 0)} end={vec(18, 18)} colors={['#3a3d43', '#121316']} />
          </RoundedRect>
          <RoundedRect x={7.4} y={5} width={9.2} height={6} r={0.6} color="#14304a" />
          <Circle cx={12} cy={14.4} r={1.8} color="#b3281e" />
        </Group>,
      );
    case 'mixer':
      return g(
        <Group>
          <RoundedRect x={4} y={0} width={16} height={18} r={1.6}>
            <LinearGradient start={vec(4, 0)} end={vec(20, 18)} colors={['#3a3d43', '#16171a']} />
          </RoundedRect>
          {[8, 16].map((cx) => (
            <Group key={cx}>
              <Circle cx={cx} cy={4} r={1.4} color="#9aa0a8" />
              <Line p1={vec(cx, 8)} p2={vec(cx, 15)} color="#050506" strokeWidth={1} />
            </Group>
          ))}
        </Group>,
      );
    case 'strip':
      return g(
        <Group>
          <RoundedRect x={0} y={6} width={24} height={7} r={1.6} color="#1d1f23" />
          {[4, 10, 16].map((cx) => (
            <RoundedRect key={cx} x={cx} y={7.6} width={4} height={3.8} r={0.8} color="#050506" />
          ))}
          <RoundedRect x={20.4} y={7.8} width={2.6} height={3.4} r={0.6} color={INK.red} />
        </Group>,
      );
    case 'wall':
      return g(
        <Group>
          <RoundedRect x={5} y={1} width={14} height={16} r={1.6}>
            <LinearGradient start={vec(5, 1)} end={vec(19, 17)} colors={['#e6e9ee', '#9aa0a8']} />
          </RoundedRect>
          <Circle cx={12} cy={9} r={4.4} color="#c9ccd2" />
          <Circle cx={10.4} cy={8.4} r={0.8} color="#2a2c31" />
          <Circle cx={13.6} cy={8.4} r={0.8} color="#2a2c31" />
        </Group>,
      );
  }
}

/* ── a card ───────────────────────────────────────────────────────────── */

/** Split `text` into lines that fit `room` (mm) at `size` mm in the label
 *  face: one line when it fits, else at the best space; never cut. */
function wrapMm(text: string, size: number, room: number, width: (t: string) => number): string[] {
  if (!text) return [];
  if (width(text) * size <= room) return [text];
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best: string[] = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(width(a), width(b));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

/** The text room of a card (mm from its text x to its meter slot). */
export function cardTextBox(n: FlowNode): { x: number; room: number; iconS: number } {
  const iconS = n.icon ? Math.min(1, (Math.min(n.h, 34) - 6) / 18, n.w / 90) : 0;
  const x = n.x + (n.icon ? 4 + 24 * iconS + 2 : 5);
  // the meter has its own slot on the right (it never sits under words)
  const right = n.x + n.w - (n.tap || n.extTap ? 13 : 4);
  return { x, room: right - x, iconS };
}

export function FlowCard({ n, tag }: { n: FlowNode; tag?: { num: number; verdict?: 'right' | 'wrong' | null } }) {
  const lm = useLabelMm(9);
  const f = useContext(SceneFontsContext);
  const font = f.label;
  // width of a string per mm of font size
  const width = (t: string) => (font ? font.getTextWidth(t) / 10 : t.length * 0.52);
  const ring = n.state ? STATE_COL[n.state] : 'rgba(255,255,255,0.14)';
  const tb = cardTextBox(n);
  const title = wrapMm(n.title, lm, tb.room, width);
  const sub = wrapMm(n.sub ?? '', lm, tb.room, width);
  const lh = lm * 1.12;
  const subCol = n.state === 'cut' || n.state === 'clip' ? '#ff8a7e' : n.state === 'hum' ? INK.amber : INK.printDim;
  return (
    <Group>
      <RoundedRect x={n.x + 1.5} y={n.y + 2.5} width={n.w} height={n.h} r={5} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </RoundedRect>
      <RoundedRect x={n.x} y={n.y} width={n.w} height={n.h} r={5}>
        <LinearGradient start={vec(n.x, n.y)} end={vec(n.x, n.y + n.h)} colors={['#1c1d22', '#111215']} />
      </RoundedRect>
      <RoundedRect x={n.x} y={n.y} width={n.w} height={n.h} r={5} style="stroke" strokeWidth={n.state === 'cut' || n.state === 'clip' || n.state === 'hum' ? 1.6 : 0.9} color={ring} />
      {n.onAir ? (
        <RoundedRect x={n.x - 1} y={n.y - 1} width={n.w + 2} height={n.h + 2} r={6} style="stroke" strokeWidth={2.4} color={INK.red} opacity={0.5}>
          <BlurMask blur={2.4} style="normal" />
        </RoundedRect>
      ) : null}
      {n.sockets?.map((sx) => (
        <Group key={sx}>
          <RoundedRect x={sx - 3.6} y={n.y + 2} width={7.2} height={6} r={1.4} color="#050506" />
          <RoundedRect x={sx - 3.6} y={n.y + 2} width={7.2} height={6} r={1.4} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.18)" />
        </Group>
      ))}
      {n.icon ? <Icon kind={n.icon} x={n.x + 3} y={n.y + (n.sockets ? n.h - 3 - 18 * tb.iconS : 3)} s={tb.iconS} /> : null}
      {title.map((t, i) => (
        <SceneText key={`t${i}`} x={tb.x} y={n.y + (n.sockets ? n.h - 4 - lh * (title.length + sub.length - 1) : 3 + lm) + i * lh} size={lm} text={t} color={INK.white} face="label" />
      ))}
      {sub.map((t, i) => (
        <SceneText key={`s${i}`} x={tb.x} y={n.y + (n.sockets ? n.h - 4 - lh * (sub.length - 1) : 4 + lm + lh * title.length) + i * lh} size={lm} text={t} color={subCol} face="label" />
      ))}
      {n.onAir ? <SceneText x={tb.x + tb.room} y={n.y + n.h - 4} size={lm} text="ON AIR" color="#ff6b5e" face="label" align="right" /> : null}
      {n.tap ? <TapMeter tap={n.tap} x={n.x + n.w - 9} y={n.y + 4} h={n.h - 8} /> : n.extTap ? <ExtMeter tap={n.extTap} x={n.x + n.w - 9} y={n.y + 4} h={n.h - 8} /> : null}
      {tag ? <Tag x={n.x - 3} y={n.y - 3} num={tag.num} verdict={tag.verdict ?? null} /> : null}
    </Group>
  );
}

function TapMeter({ tap, x, y, h }: { tap: Tap; x: number; y: number; h: number }) {
  const l = useTapDb(tap);
  const hd = useTapDb(tap, 'hold');
  return <LedColumn x={x} y={y} w={4} h={h} level={l} hold={hd} />;
}
function ExtMeter({ tap, x, y, h }: { tap: EvTap; x: number; y: number; h: number }) {
  const l = useExtTapDb(tap);
  const hd = useExtTapDb(tap, 'hold');
  return <LedColumn x={x} y={y} w={4} h={h} level={l} hold={hd} />;
}

/** A numbered marker (the prediction tags), with its verdict after a check. */
export function Tag({ x, y, num, verdict }: { x: number; y: number; num: number; verdict: 'right' | 'wrong' | null }) {
  const lm = useLabelMm(9);
  const r = lm * 0.75;
  const col = verdict === 'right' ? INK.green : verdict === 'wrong' ? INK.peak : INK.amber;
  return (
    <Group>
      <Circle cx={x} cy={y} r={r + 1} color="#050506" />
      <Circle cx={x} cy={y} r={r} color={col} />
      <SceneText x={x} y={y + lm * 0.36} size={lm} text={String(num)} color="#0b0b0d" face="label" align="center" />
    </Group>
  );
}

/** A route between two cards (right edge of `from` → left edge of `to`).
 *  Its label sits ON the wire, centred in the lane between the cards, on a
 *  dark plate; its prediction tag sits just after the source, above the
 *  wire (never on a junction). */
export function FlowRoute({ a, b, l, tagVerdict }: { a: FlowNode; b: FlowNode; l: FlowLink; tagVerdict?: 'right' | 'wrong' | null }) {
  const lm = useLabelMm(9);
  const f = useContext(SceneFontsContext);
  const x0 = a.x + a.w;
  const y0 = l.fromY ?? a.y + a.h / 2;
  const x1 = b.x;
  const y1 = l.toY ?? b.y + b.h / 2;
  const path = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const dx = (x1 - x0) * 0.5;
    p.moveTo(x0, y0);
    p.cubicTo(x0 + dx + (l.bend ?? 0), y0, x1 - dx + (l.bend ?? 0), y1, x1, y1);
    return p.detach();
  }, [x0, y0, x1, y1, l.bend]);
  const col = STATE_COL[l.state];
  const mx = (x0 + x1) / 2 + (l.bend ?? 0) * 0.75;
  const my = (y0 + y1) / 2;
  const lines = l.label ? l.label.split('\n') : [];
  const tw = lines.length ? Math.max(...lines.map((t) => (f.label ? (f.label.getTextWidth(t) * lm) / 10 : t.length * lm * 0.52))) : 0;
  const plateH = lines.length * lm * 1.1 + lm * 0.35;
  return (
    <Group>
      {l.state === 'live' || l.state === 'hum' ? (
        <Path path={path} style="stroke" strokeWidth={5} color={col} opacity={0.3} strokeCap="round">
          <BlurMask blur={2.4} style="normal" />
        </Path>
      ) : null}
      <Path path={path} style="stroke" strokeWidth={l.state === 'idle' ? 1.2 : 1.8} color={col} strokeCap="round">
        {l.state === 'cut' || l.state === 'idle' ? <DashPathEffect intervals={l.state === 'cut' ? [4, 3] : [2, 3]} /> : null}
      </Path>
      {l.state === 'cut' ? (
        <Group>
          <Line p1={vec(mx - 3.5, my - 3.5)} p2={vec(mx + 3.5, my + 3.5)} color={INK.peak} strokeWidth={2} strokeCap="round" />
          <Line p1={vec(mx - 3.5, my + 3.5)} p2={vec(mx + 3.5, my - 3.5)} color={INK.peak} strokeWidth={2} strokeCap="round" />
        </Group>
      ) : null}
      {lines.length ? (
        <Group>
          <RoundedRect x={mx - tw / 2 - 2} y={my - plateH / 2} width={tw + 4} height={plateH} r={2} color="rgba(10,11,13,0.92)" />
          <RoundedRect x={mx - tw / 2 - 2} y={my - plateH / 2} width={tw + 4} height={plateH} r={2} style="stroke" strokeWidth={0.5} color={col} opacity={0.7} />
          {lines.map((t, i) => (
            <SceneText key={i} x={mx} y={my - plateH / 2 + lm * 0.95 + i * lm * 1.1} size={lm} text={t} color={l.state === 'live' ? '#8fbcff' : l.state === 'hum' ? INK.amber : INK.print} face="label" align="center" />
          ))}
        </Group>
      ) : null}
      {l.tag != null ? <Tag x={mx} y={my - (lines.length ? plateH / 2 : 0) - lm * 0.95} num={l.tag} verdict={tagVerdict ?? null} /> : null}
    </Group>
  );
}

/** A whole board. */
export function FlowBoard({ nodes, links, tags }: { nodes: readonly FlowNode[]; links: readonly FlowLink[]; tags?: Readonly<Record<string, { num: number; verdict?: 'right' | 'wrong' | null }>> }) {
  const by = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  return (
    <Group>
      {links.map((l, i) => (by[l.from] && by[l.to] ? <FlowRoute key={`${l.from}-${l.to}-${i}`} a={by[l.from]} b={by[l.to]} l={l} tagVerdict={l.tag != null ? tags?.[`link:${l.tag}`]?.verdict : undefined} /> : null))}
      {nodes.map((n) => (
        <FlowCard key={n.id} n={n} tag={tags?.[n.id]} />
      ))}
    </Group>
  );
}

export const flowBoxes = (nodes: readonly FlowNode[]) => nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h }));

/* ── power cords (visual review 2026-10-18, findings 20 / 21) ─────────────
 * ONE line per cord, each on its own lane (the caller lays the lanes 6 mm
 * apart), a HOP wherever a cord crosses one drawn before it (a junction dot
 * never appears: cords never join), and a plug body at the outlet end. A
 * cord in a ground loop glows amber. */

export type Cord = { id: string; pts: readonly [number, number][]; tone?: 'plain' | 'hum' | 'off'; plug?: boolean };

const HOP_R = 2.6;

/** Crossings of segment a (axis-aligned) with segment b (perpendicular). */
function crossAt(a0: readonly [number, number], a1: readonly [number, number], b0: readonly [number, number], b1: readonly [number, number]): [number, number] | null {
  const aH = Math.abs(a0[1] - a1[1]) < 1e-6;
  const bH = Math.abs(b0[1] - b1[1]) < 1e-6;
  if (aH === bH) return null;
  const [h0, h1, v0, v1] = aH ? [a0, a1, b0, b1] : [b0, b1, a0, a1];
  const x = v0[0];
  const y = h0[1];
  const inH = x > Math.min(h0[0], h1[0]) + HOP_R && x < Math.max(h0[0], h1[0]) - HOP_R;
  const inV = y > Math.min(v0[1], v1[1]) + HOP_R && y < Math.max(v0[1], v1[1]) - HOP_R;
  return inH && inV ? [x, y] : null;
}

/** Every crossing between two orthogonal polylines (pure; for the tests). */
export function cordCrossings(a: readonly [number, number][], b: readonly [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
    const c = crossAt(a[i - 1], a[i], b[j - 1], b[j]);
    if (c) out.push(c);
  }
  return out;
}

/** The cord's path with a hop at each of `hops` (points on its segments). */
function hopPath(pts: readonly [number, number][], hops: readonly [number, number][]) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const horiz = Math.abs(ay - by) < 1e-6;
    const dir = horiz ? Math.sign(bx - ax) : Math.sign(by - ay);
    const on = hops
      .filter(([hx, hy]) => (horiz ? Math.abs(hy - ay) < 1e-6 && (hx - ax) * dir > 0 && (bx - hx) * dir > 0 : Math.abs(hx - ax) < 1e-6 && (hy - ay) * dir > 0 && (by - hy) * dir > 0))
      .sort((u, v) => (horiz ? (u[0] - v[0]) * dir : (u[1] - v[1]) * dir));
    for (const [hx, hy] of on) {
      if (horiz) {
        p.lineTo(hx - HOP_R * dir, hy);
        p.quadTo(hx, hy - HOP_R * 2, hx + HOP_R * dir, hy);
      } else {
        p.lineTo(hx, hy - HOP_R * dir);
        p.quadTo(hx + HOP_R * 2, hy, hx, hy + HOP_R * dir);
      }
    }
    p.lineTo(bx, by);
  }
  return p.detach();
}

export function Cords({ cords }: { cords: readonly Cord[] }) {
  const drawn = useMemo(
    () =>
      cords.map((c, i) => {
        const hops: [number, number][] = [];
        for (let j = 0; j < i; j++) hops.push(...cordCrossings(c.pts as [number, number][], cords[j].pts as [number, number][]));
        return { c, path: hopPath(c.pts, hops) };
      }),
    [cords],
  );
  return (
    <Group>
      {drawn.map(({ c, path }) => {
        const col = c.tone === 'hum' ? INK.amber : c.tone === 'off' ? '#3a3d43' : '#7d828b';
        const end = c.pts[c.pts.length - 1];
        const prev = c.pts[c.pts.length - 2] ?? end;
        const down = end[1] >= prev[1];
        return (
          <Group key={c.id}>
            {/* a dark keyline under each cord: a crossing reads as a gap */}
            <Path path={path} style="stroke" strokeWidth={4.2} color="#0b0b0d" strokeCap="round" strokeJoin="round" />
            {c.tone === 'hum' ? (
              <Path path={path} style="stroke" strokeWidth={5} color={INK.amber} opacity={0.35} strokeCap="round" strokeJoin="round">
                <BlurMask blur={2.2} style="normal" />
              </Path>
            ) : null}
            <Path path={path} style="stroke" strokeWidth={1.6} color={col} strokeCap="round" strokeJoin="round" />
            {c.plug !== false ? (
              <Group transform={[{ translateX: end[0] }, { translateY: end[1] }, { rotate: down ? 0 : Math.PI }]}>
                {/* a mains plug body seated in its socket: the body, its two pins */}
                <RoundedRect x={-3} y={-7.5} width={6} height={6} r={1.2}>
                  <LinearGradient start={vec(-3, -7.5)} end={vec(3, -1.5)} colors={c.tone === 'hum' ? ['#ffd98a', '#9a7420'] : ['#5a5e66', '#1d1f23']} />
                </RoundedRect>
                <Line p1={vec(-1.4, -1.5)} p2={vec(-1.4, 0.6)} color="#c9ccd2" strokeWidth={0.8} />
                <Line p1={vec(1.4, -1.5)} p2={vec(1.4, 0.6)} color="#c9ccd2" strokeWidth={0.8} />
              </Group>
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}
