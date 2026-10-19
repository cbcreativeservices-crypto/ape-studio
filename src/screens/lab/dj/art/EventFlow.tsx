/**
 * EventFlow — the SIGNAL-FLOW BOARD of the troubleshooting screens (23, 24):
 * every source, channel, bus and output of the event as a card on one
 * board, joined by the routes the render actually takes, each card with its
 * LIVE meter (the render's own tap). It is the engineer's method drawn:
 * follow the signal from the source and find the LAST live meter — the
 * fault sits just after it.
 *
 * The routes are a clean diagram (charter §2: abstract data may stay
 * abstract), but every card SHOWS ITS DEVICE (art/eventTiles): the laptop with
 * its software, the player with its stick, the mixer's channel strip with its
 * selector and fader where the booth has them, the speakers, the headphones,
 * the recorder, the strip and the wall socket. `cardLayout` gives the words
 * the room they need at 9 pt and the device the rest — so zooming in (where
 * the words grow only by the square root) the device fills the card and its
 * detail shows: no empty card bodies at 3× (lab-art grade 2026-10-19).
 *
 * POWER CORDS (`Cords`; same grade: "seven cords in 2–4 px lanes"): one line
 * each, its own lane (callers lay lanes ≥ 10 board units apart: ≥ 6 pt at
 * 390 wide), its own PATTERN, a hop wherever it crosses one drawn before it
 * (cords never join), a plug body at the device and at the outlet; the
 * outlet strip prints each cord's NAME under its outlet (`StripCard`), and a
 * cord that ends anywhere else carries a flag. A cord in a ground loop glows
 * amber.
 */
import { useContext, useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { LedColumn } from './parts';
import { useTapDb } from './motion';
import { useExtTapDb } from './eventMotion';
import type { Tap } from '../engine/djRender';
import type { EvTap } from '../engine/djEventRender';
import { SceneFontsContext, SceneText, useLabelMm } from './sceneText';
import { TileDevice, WallPlate, type TileArt } from './eventTiles';
import { HOP_R, cardLayout, cordCrossings, stripOutletY, wallPlateAt, wrapMm, type CardLayout, type CordPattern } from './eventBoardGeometry';

export { cardLayout, cordCrossings, parallelGap, stripOutletY, wallOutlet, wallPlateAt, wrapMm, type CardLayout, type CordPattern } from './eventBoardGeometry';

export type FlowState = 'live' | 'idle' | 'cut' | 'hum' | 'clip';

/** An outlet on a strip card: its x (board units), and the name of the
 *  cord in it (printed under it) with an optional prediction tag. */
export type Outlet = { x: number; label?: string; tag?: number; tagVerdict?: 'right' | 'wrong' | null };

export type FlowNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** One line or several (each wraps on its own if it must). */
  sub?: string | readonly string[];
  /** The device the card shows. */
  art?: TileArt;
  /** Its meter: the render's tap (a booth tap, or an event tap with `ext`). */
  tap?: Tap;
  extTap?: EvTap;
  state?: FlowState;
  onAir?: boolean;
  /** A device with no card round it (the wall plate on screen 24). */
  bare?: boolean;
  /** Words the card must keep room for (its other states), so the device
   *  does not jump in size when the sub changes. Never drawn. */
  reserve?: readonly string[];
  /** More readouts (the channel's trim and fader, the speaker's input
   *  switch…), shown under the sub only where they fit whole — so they
   *  appear as the zoom gives the words room, filling the card with facts. */
  detail?: readonly string[];
  /** Where a prediction tag sits: the top-right corner (default) or the top-left. */
  tagAt?: 'tl' | 'tr';
  /** An OUTLET STRIP: drawn as the strip itself, its outlets at these x,
   *  each cord's name printed under its outlet; the title and sub sit from
   *  `textX` in the rows under the strip. */
  strip?: { outlets: readonly Outlet[]; textX: number; on: boolean };
};

export type FlowLink = { from: string; to: string; state: FlowState; label?: string; tag?: number; bend?: number; fromY?: number; toY?: number };

const STATE_COL: Record<FlowState, string> = { live: INK.blue, idle: '#4a4d54', cut: INK.peak, hum: INK.amber, clip: INK.peak };


/* ── a card ───────────────────────────────────────────────────────────── */

function useTextMeasure() {
  const f = useContext(SceneFontsContext);
  const font = f.label;
  return (t: string) => (font ? font.getTextWidth(t) / 10 : t.length * 0.52);
}

export function FlowCard({ n, tag }: { n: FlowNode; tag?: { num: number; verdict?: 'right' | 'wrong' | null } }) {
  const lm = useLabelMm(9);
  const width = useTextMeasure();
  if (n.strip) return <StripCard n={n} />;
  if (n.bare && n.art?.kind === 'wall') {
    const p = wallPlateAt(n);
    return <WallPlate x={p.x} y={p.y} />;
  }
  const L = cardLayout(n, lm, width);
  const ring = n.state ? STATE_COL[n.state] : 'rgba(255,255,255,0.14)';
  const subCol = n.state === 'cut' || n.state === 'clip' ? '#ff8a7e' : n.state === 'hum' ? INK.amber : INK.printDim;
  const base = lm * 0.95;
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
      {n.art && L.art ? (n.art.kind === 'wall' ? <WallPlate x={wallPlateAt(n).x} y={wallPlateAt(n).y} /> : <TileDevice art={n.art} b={L.art} />) : null}
      {L.title.lines.map((t, i) => (
        <SceneText key={`t${i}`} x={L.title.x} y={L.title.y + base + i * L.lh} size={lm} text={t} color={INK.white} face="label" />
      ))}
      {L.sub.lines.map((s, i) => (
        <SceneText key={`s${i}`} x={L.sub.x} y={L.sub.y + base + i * L.lh} size={lm} text={s.t} color={s.onAir ? '#ff6b5e' : subCol} face="label" />
      ))}
      {detailLines(n, L, lm, width).map((t, i) => (
        <SceneText key={`d${i}`} x={L.sub.x} y={L.sub.y + base + (L.sub.lines.length + 0.25 + i) * L.lh} size={lm} text={t} color={INK.printDim} face="label" />
      ))}
      {n.tap ? <TapMeter tap={n.tap} x={n.x + n.w - 9} y={n.y + 4} h={n.h - 8} /> : n.extTap ? <ExtMeter tap={n.extTap} x={n.x + n.w - 9} y={n.y + 4} h={n.h - 8} /> : null}
      {tag ? <Tag x={n.tagAt === 'tl' ? n.x - 2 : n.x + n.w + 2} y={n.y - 2} num={tag.num} verdict={tag.verdict ?? null} /> : null}
    </Group>
  );
}

/** The card's extra readouts that fit whole under its sub (none at 1× on a
 *  phone; more as the zoom gives the words room). */
function detailLines(n: FlowNode, L: CardLayout, lm: number, width: (t: string) => number): string[] {
  if (!n.detail?.length) return [];
  const right = n.x + n.w - 3 - (n.tap || n.extTap ? 10 : 0);
  const bottom = n.y + n.h - 3;
  const out: string[] = [];
  for (const t of n.detail) {
    const y = L.sub.y + (L.sub.lines.length + 0.25 + out.length + 1) * L.lh;
    if (y > bottom || L.sub.x + width(t) * lm > right) break;
    out.push(t);
  }
  return out;
}

/** An outlet strip: the long body, its lit switch, every outlet face (two
 *  blade slots and the earth hole), and under each used outlet the NAME of
 *  the cord in it — in two staggered rows so neighbours never touch. */
function StripCard({ n }: { n: FlowNode }) {
  const lm = useLabelMm(9);
  const width = useTextMeasure();
  const s = n.strip!;
  const lh = lm * 1.12;
  const bodyY = n.y + 3;
  const bodyH = 18;
  const oy = stripOutletY(n);
  const named = s.outlets.filter((o) => o.label).sort((a, b) => a.x - b.x);
  const row1 = n.y + bodyH + 5 + lm * 0.95;
  const T = wrapMm(n.title, lm, n.x + n.w - 4 - s.textX, width);
  const subs = n.sub == null ? [] : typeof n.sub === 'string' ? [n.sub] : n.sub;
  const S = subs.flatMap((t) => wrapMm(t, lm, n.x + n.w - 4 - s.textX, width));
  return (
    <Group>
      <RoundedRect x={n.x + 1.5} y={n.y + 2.5} width={n.w} height={n.h} r={5} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </RoundedRect>
      <RoundedRect x={n.x} y={n.y} width={n.w} height={n.h} r={5}>
        <LinearGradient start={vec(n.x, n.y)} end={vec(n.x, n.y + n.h)} colors={['#1c1d22', '#111215']} />
      </RoundedRect>
      <RoundedRect x={n.x} y={n.y} width={n.w} height={n.h} r={5} style="stroke" strokeWidth={0.9} color={n.state ? STATE_COL[n.state] : 'rgba(255,255,255,0.14)'} />
      {/* the strip's body */}
      <RoundedRect x={n.x + 3} y={bodyY + 1.4} width={n.w - 6} height={bodyH} r={4} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.6} style="normal" />
      </RoundedRect>
      <RoundedRect x={n.x + 2} y={bodyY} width={n.w - 4} height={bodyH} r={4}>
        <LinearGradient start={vec(0, bodyY)} end={vec(0, bodyY + bodyH)} colors={['#3e4148', '#24262b', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={n.x + 2.3} y={bodyY + 0.3} width={n.w - 4.6} height={bodyH - 0.6} r={3.8} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.14)" />
      {/* its lit switch, at the left end */}
      <RoundedRect x={n.x + 5} y={bodyY + 3} width={8} height={12} r={1.6} color="#0b0c0e" />
      {s.on ? (
        <RoundedRect x={n.x + 5} y={bodyY + 3} width={8} height={12} r={1.6} color="#ff5a3a" opacity={0.4}>
          <BlurMask blur={1.6} style="normal" />
        </RoundedRect>
      ) : null}
      <RoundedRect x={n.x + 6} y={bodyY + 4} width={6} height={10} r={1.2} color={s.on ? '#c4361f' : '#4a1a13'} />
      {s.outlets.map((o) => (
        <Group key={o.x}>
          <RoundedRect x={o.x - 5.4} y={oy - 6.6} width={10.8} height={13.2} r={3}>
            <LinearGradient start={vec(0, oy - 6.6)} end={vec(0, oy + 6.6)} colors={['#121316', '#1f2126']} />
          </RoundedRect>
          <RoundedRect x={o.x - 5.4} y={oy - 6.6} width={10.8} height={13.2} r={3} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.1)" />
          <RoundedRect x={o.x - 3.4} y={oy - 4.6} width={1.2} height={4.4} r={0.3} color="#000" />
          <RoundedRect x={o.x + 2.2} y={oy - 4.2} width={1.2} height={3.8} r={0.3} color="#000" />
          <Circle cx={o.x} cy={oy + 3.2} r={1.3} color="#000" />
        </Group>
      ))}
      {/* each cord's name under its outlet, in two staggered rows */}
      {named.map((o, i) => {
        const w = width(o.label!) * lm;
        const tagR = o.tag != null ? lm * 0.75 + 1.5 : 0;
        const total = w + tagR * 2;
        const cx = Math.max(n.x + 3 + total / 2, Math.min(n.x + n.w - 3 - total / 2, o.x));
        const y = row1 + (i % 2) * lh;
        const x0 = cx - total / 2;
        return (
          <Group key={`n${o.x}`}>
            <Line p1={vec(o.x, oy + 6.8)} p2={vec(o.x, y - lm * 0.95 - 0.8)} color="rgba(255,255,255,0.22)" strokeWidth={0.5} />
            {o.tag != null ? <Tag x={x0 + tagR - 0.5} y={y - lm * 0.36} num={o.tag} verdict={o.tagVerdict ?? null} /> : null}
            <SceneText x={x0 + tagR * 2} y={y} size={lm} text={o.label!} color={INK.print} face="label" />
          </Group>
        );
      })}
      {T.map((t, i) => (
        <SceneText key={`t${i}`} x={s.textX} y={row1 + i * lh} size={lm} text={t} color={INK.white} face="label" />
      ))}
      {S.map((t, i) => (
        <SceneText key={`s${i}`} x={s.textX} y={row1 + (T.length + i) * lh} size={lm} text={t} color={INK.printDim} face="label" />
      ))}
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
    if (Math.abs(y1 - y0) < 0.01) p.lineTo(x1, y1);
    else p.cubicTo(x0 + dx + (l.bend ?? 0), y0, x1 - dx + (l.bend ?? 0), y1, x1, y1);
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

/* ── power cords ──────────────────────────────────────────────────────── */

/** Each cord's own jacket pattern, so two cords are told apart by more than
 *  their place (charter §8: never by colour alone). */
const PATTERN: Record<CordPattern, { iv: number[]; cap: 'butt' | 'round'; w: number }> = {
  ribs: { iv: [1.2, 2.2], cap: 'butt', w: 0.9 },
  dash: { iv: [6, 3], cap: 'butt', w: 0.9 },
  dots: { iv: [0.01, 3.2], cap: 'round', w: 1.2 },
  dashdot: { iv: [6, 2.2, 0.01, 2.2], cap: 'round', w: 0.9 },
  long: { iv: [13, 3], cap: 'butt', w: 0.9 },
  short: { iv: [2.4, 2.4], cap: 'butt', w: 0.9 },
  pair: { iv: [3, 1.6, 3, 5.4], cap: 'butt', w: 0.9 },
};

export type Cord = {
  id: string;
  pts: readonly [number, number][];
  tone?: 'plain' | 'hum' | 'off';
  /** A plug body at the outlet end (default on). */
  plug?: boolean;
  pattern?: CordPattern;
  /** A name flag on the cord, at this point of it (for a cord that does not
   *  end on a strip, whose outlet prints its name). */
  flag?: { text: string; at: [number, number] };
};

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

/** A cord's name flag, on its own lane: 9 pt or more, growing with the zoom. */
function CordFlag({ x, y, text, hum }: { x: number; y: number; text: string; hum: boolean }) {
  const lm = useLabelMm(9);
  const f = useContext(SceneFontsContext);
  const w = (f.label ? (f.label.getTextWidth(text) * lm) / 10 : text.length * lm * 0.52) + lm * 0.7;
  const h = lm * 1.3;
  return (
    <Group>
      <RoundedRect x={x - w / 2} y={y - h / 2} width={w} height={h} r={h * 0.3} color="rgba(10,11,13,0.94)" />
      <RoundedRect x={x - w / 2} y={y - h / 2} width={w} height={h} r={h * 0.3} style="stroke" strokeWidth={lm * 0.1} color={hum ? INK.amber : '#7d828b'} />
      <SceneText x={x} y={y + lm * 0.36} size={lm} text={text} color={hum ? INK.amber : INK.print} face="label" align="center" />
    </Group>
  );
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
        const col = c.tone === 'hum' ? '#e0a93c' : c.tone === 'off' ? '#3a3d43' : '#6d727b';
        const pat = PATTERN[c.pattern ?? 'ribs'];
        const a = c.pts[0];
        const a1 = c.pts[1] ?? a;
        const angA = Math.atan2(a1[1] - a[1], a1[0] - a[0]);
        const end = c.pts[c.pts.length - 1];
        const prev = c.pts[c.pts.length - 2] ?? end;
        // the outlet plug's body sits on the side its cord comes from
        const angE = Math.atan2(prev[1] - end[1], prev[0] - end[0]);
        return (
          <Group key={c.id}>
            {/* a dark keyline under each cord: a crossing reads as a gap */}
            <Path path={path} style="stroke" strokeWidth={4.6} color="#0b0b0d" strokeCap="round" strokeJoin="round" />
            {c.tone === 'hum' ? (
              <Path path={path} style="stroke" strokeWidth={5.4} color={INK.amber} opacity={0.35} strokeCap="round" strokeJoin="round">
                <BlurMask blur={2.2} style="normal" />
              </Path>
            ) : null}
            <Path path={path} style="stroke" strokeWidth={2.8} color={col} strokeCap="round" strokeJoin="round" />
            <Path path={path} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.18)" strokeCap="round" strokeJoin="round" transform={[{ translateX: -0.5 }, { translateY: -0.6 }]} />
            <Path path={path} style="stroke" strokeWidth={pat.w} color={c.tone === 'off' ? 'rgba(160,166,176,0.4)' : 'rgba(205,210,218,0.8)'} strokeCap={pat.cap}>
              <DashPathEffect intervals={pat.iv} />
            </Path>
            {/* the plug at the device: a moulded connector at the card's edge */}
            <Group transform={[{ translateX: a[0] }, { translateY: a[1] }, { rotate: angA }]}>
              <RoundedRect x={-1.2} y={-3.4} width={5.4} height={6.8} r={1.2}>
                <LinearGradient start={vec(0, -3.4)} end={vec(0, 3.4)} colors={c.tone === 'hum' ? ['#ffd98a', '#9a7420'] : ['#4a4d54', '#16171a']} />
              </RoundedRect>
              <RoundedRect x={4.2} y={-2} width={2.4} height={4} r={0.8} color={c.tone === 'hum' ? '#9a7420' : '#16171a'} />
            </Group>
            {c.plug !== false ? (
              <Group transform={[{ translateX: end[0] }, { translateY: end[1] }, { rotate: angE - Math.PI / 2 }]}>
                {/* the mains plug seated in its outlet: the body over the
                    outlet face, the strain relief turning into the cord */}
                <RoundedRect x={-4.6 + 0.6} y={-5 + 0.9} width={9.2} height={10} r={2} color="rgba(0,0,0,0.6)">
                  <BlurMask blur={1} style="normal" />
                </RoundedRect>
                <RoundedRect x={-4.6} y={-5} width={9.2} height={10} r={2}>
                  <LinearGradient start={vec(-4.6, -5)} end={vec(4.6, 5)} colors={c.tone === 'hum' ? ['#ffd98a', '#9a7420'] : ['#4a4d54', '#1d1f23', '#0e0f11']} />
                </RoundedRect>
                <RoundedRect x={-4.6} y={-5} width={9.2} height={10} r={2} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.16)" />
                <RoundedRect x={-2} y={4.4} width={4} height={3.6} r={1} color={c.tone === 'hum' ? '#9a7420' : '#16171a'} />
              </Group>
            ) : null}
            {c.flag ? <CordFlag x={c.flag.at[0]} y={c.flag.at[1]} text={c.flag.text} hum={c.tone === 'hum'} /> : null}
          </Group>
        );
      })}
    </Group>
  );
}
