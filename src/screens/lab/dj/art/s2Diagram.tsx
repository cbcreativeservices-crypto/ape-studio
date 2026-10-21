/**
 * s2Diagram — the signal-flow MAPS of the Stage 2 screens (Screen 13's
 * effect routing, 16's laptop rig, 18's digital vinyl): abstract by nature,
 * so clean geometry is right, styled in the house language (dark glass
 * boxes, lit when live; soft glow on live wires). Authored in the scene's
 * millimetres like the gear, so the labels and the zoom stay aligned.
 *
 * SIGNAL KINDS are told apart by PATTERN and colour and named in a legend
 * (never colour alone — charter §8): AUDIO solid blue; CONTROL dashed amber;
 * CLOCK / TIMING dotted green; POWER a double rail; a LOOP solid red.
 * A wire is lit only when the booth's real state says that signal is there.
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, Path, RoundedRect, Skia, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { useMotion } from './motion';
import { SceneText } from './sceneText';
import type { Box } from '../geometry/boothGeometry';

export type SigKind = 'audio' | 'control' | 'clock' | 'power' | 'loop';
export const SIG_COLOUR: Record<SigKind, string> = { audio: '#6fa8ff', control: '#ffc64d', clock: '#5bff85', power: '#c9a2ff', loop: '#ff5a48' };
export const SIG_WORD: Record<SigKind, string> = { audio: 'AUDIO', control: 'CONTROL', clock: 'TIMING', power: 'POWER', loop: 'LOOP' };

function polyPath(pts: readonly [number, number][]): SkPath {
  const p = Skia.PathBuilder.Make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  return p.detach();
}

function arrowHead(pts: readonly [number, number][], s: number): SkPath {
  const [x1, y1] = pts[pts.length - 1];
  const [x0, y0] = pts[pts.length - 2];
  const a = Math.atan2(y1 - y0, x1 - x0);
  const p = Skia.PathBuilder.Make();
  p.moveTo(x1, y1);
  p.lineTo(x1 - Math.cos(a - 0.45) * s, y1 - Math.sin(a - 0.45) * s);
  p.lineTo(x1 - Math.cos(a + 0.45) * s, y1 - Math.sin(a + 0.45) * s);
  p.close();
  return p.detach();
}

/** The map's background, for the keyline gaps where one wire crosses over
 *  another (charter §2: a crossing never reads as a junction). */
export const MAP_BG = '#0c0d10';

/** A short keyline along the wire through each crossing point `over` (it
 *  must lie on the wire): drawn UNDER this wire, it cuts the wire beneath. */
function crossingGaps(pts: readonly [number, number][], over: readonly [number, number][], half: number): SkPath {
  const p = Skia.PathBuilder.Make();
  for (const [cx, cy] of over) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1e-6) continue;
      const t = ((cx - x0) * (x1 - x0) + (cy - y0) * (y1 - y0)) / (len * len);
      const d = Math.abs((cx - x0) * (y1 - y0) - (cy - y0) * (x1 - x0)) / len;
      if (t < -0.01 || t > 1.01 || d > 0.3) continue;
      const ux = (x1 - x0) / len;
      const uy = (y1 - y0) / len;
      p.moveTo(cx - ux * half, cy - uy * half);
      p.lineTo(cx + ux * half, cy + uy * half);
      break;
    }
  }
  return p.detach();
}

/** One signal's wire (mm). `live` lights it; `flow` (decorative motion,
 *  passed only when allowed) runs a slow dash along a live AUDIO, CONTROL or LOOP wire
 *  — an overlay of where the signal goes, claiming no speed.
 *  `over` (ADDITIVE, visual review 2 #5): the points where this wire passes
 *  OVER another — each gets a keyline gap in the wire beneath. */
export function DWire({ pts, kind, live, arrow = true, w = 1.5, flow = false, over }: { pts: readonly [number, number][]; kind: SigKind; live: boolean; arrow?: boolean; w?: number; flow?: boolean; over?: readonly [number, number][] }) {
  const path = useMemo(() => polyPath(pts), [pts]);
  const head = useMemo(() => (arrow && pts.length >= 2 ? arrowHead(pts, w * 3.6) : null), [arrow, pts, w]);
  const gaps = useMemo(() => (over && over.length ? crossingGaps(pts, over, 3.2) : null), [pts, over]);
  const c = SIG_COLOUR[kind];
  const dim = live ? 1 : 0.32;
  return (
    <Group>
      {gaps ? <Path path={gaps} style="stroke" strokeWidth={w + 2.8} color={MAP_BG} strokeCap="butt" /> : null}
    <Group opacity={dim}>
      {live ? (
        <Path path={path} style="stroke" strokeWidth={w * 3.2} color={c} opacity={0.28} strokeCap="round" strokeJoin="round">
          <BlurMask blur={w * 1.4} style="normal" />
        </Path>
      ) : null}
      {kind === 'power' ? (
        <Group>
          <Path path={path} style="stroke" strokeWidth={w * 1.9} color={c} strokeJoin="round" />
          <Path path={path} style="stroke" strokeWidth={w * 0.8} color="#0b0c0f" strokeJoin="round" />
        </Group>
      ) : (
        <Path path={path} style="stroke" strokeWidth={kind === 'clock' ? w * 1.2 : w} color={c} strokeCap={kind === 'clock' ? 'round' : 'butt'} strokeJoin="round">
          {kind === 'control' ? <DashPathEffect intervals={[w * 4, w * 2.6]} /> : kind === 'clock' ? <DashPathEffect intervals={[0.01, w * 2.6]} /> : null}
        </Path>
      )}
      {head ? <Path path={head} color={c} /> : null}
      {live && flow && (kind === 'audio' || kind === 'loop' || kind === 'control') ? <Flow path={path} w={w} colour={kind === 'loop' ? '#ffd0c8' : kind === 'control' ? '#fff0c0' : c} /> : null}
    </Group>
    </Group>
  );
}

function Flow({ path, w, colour }: { path: SkPath; w: number; colour: string }) {
  const { clock } = useMotion();
  const phase = useDerivedValue(() => -((clock.value * 22) % 30));
  return (
    <Path path={path} style="stroke" strokeWidth={w * 1.1} color={colour} opacity={0.9} strokeCap="round">
      <DashPathEffect intervals={[3, 27]} phase={phase} />
    </Path>
  );
}

export type NodeTone = 'plain' | 'amber' | 'blue' | 'red' | 'green';
const TONE_EDGE: Record<NodeTone, string> = { plain: 'rgba(255,255,255,0.22)', amber: INK.amber, blue: INK.blue, red: INK.red, green: INK.green };

/**
 * A block of the map (mm): dark glass with a lit rim when `live`; `slot` =
 * an empty place where a block COULD go (a dashed outline). The title is
 * drawn `size` mm tall (≥ 9 pt on a phone at the screens' zoom, or the
 * callouts carry it).
 */
export function DNode({ b, title, sub, live = false, tone = 'plain', slot = false, size = 9.4 }: { b: Box; title: string; sub?: string; live?: boolean; tone?: NodeTone; slot?: boolean; size?: number }) {
  const edge = TONE_EDGE[tone];
  const r = Math.min(4, b.h * 0.25);
  return (
    <Group>
      {slot ? (
        <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.22)">
          <DashPathEffect intervals={[3, 2.4]} />
        </RoundedRect>
      ) : (
        <Group>
          <RoundedRect x={b.x + 0.8} y={b.y + 1.4} width={b.w} height={b.h} r={r} color="rgba(0,0,0,0.6)">
            <BlurMask blur={1.6} style="normal" />
          </RoundedRect>
          <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} color={live ? '#101a28' : '#121317'} />
          {live ? (
            <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} style="stroke" strokeWidth={2.2} color={edge} opacity={0.35}>
              <BlurMask blur={2} style="normal" />
            </RoundedRect>
          ) : null}
          <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} style="stroke" strokeWidth={live ? 1 : 0.7} color={live ? edge : 'rgba(255,255,255,0.18)'} />
        </Group>
      )}
      <SceneText x={b.x + b.w / 2} y={b.y + b.h / 2 + (sub ? -size * 0.12 : size * 0.36)} size={size} text={title} color={slot ? INK.printDim : live ? INK.white : INK.print} face="label" align="center" />
      {sub ? <SceneText x={b.x + b.w / 2} y={b.y + b.h / 2 + size * 0.95} size={size * 0.86} text={sub} color={live ? edge : INK.printDim} face="label" align="center" /> : null}
    </Group>
  );
}

/** The legend of signal kinds (mm): a short sample of each wire and its name. */
export function DLegend({ x, y, kinds, size = 6.6 }: { x: number; y: number; kinds: readonly SigKind[]; size?: number }) {
  let cx = x;
  return (
    <Group>
      {kinds.map((k) => {
        const x0 = cx;
        cx += 16 + SIG_WORD[k].length * size * 0.55 + 8;
        return (
          <Group key={k}>
            <DWire pts={[[x0, y], [x0 + 13, y]]} kind={k} live arrow={false} w={1.4} />
            <SceneText x={x0 + 16} y={y + size * 0.36} size={size} text={SIG_WORD[k]} color={SIG_COLOUR[k]} face="label" />
          </Group>
        );
      })}
    </Group>
  );
}
