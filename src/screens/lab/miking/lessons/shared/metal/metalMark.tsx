/**
 * The chosen part on the suspended metal's face-on drawing (MEET IT, "The
 * parts"; owner 2026-11-05). The old marks were low tints UNDER the art: a
 * finger cymbal's was 9 px and hidden by the bell, a triangle's clip sat behind
 * the fist, the gong's boss behind the mallet head, a dancer's strap had none.
 *
 * A mark is an outline ON TOP of the whole drawing, so the player's hands and
 * the metal cannot hide it, sized in pixels of the rack's stage on a 375 pt
 * phone: the shared scene's floors (PlacementScene MARK_*; a test holds them
 * equal, this file stays out of the heavy scene's import graph). A dark edge
 * under the amber keeps it readable on brass and bronze.
 *
 * mmPerPx and the mark data are pure; the tests reach them directly.
 */
import type { ReactElement } from 'react';
import { Circle, Group, Path, RoundedRect } from '@shopify/react-native-skia';
import type { ViewBox } from '../../../engine/model/types.ts';
import { HIGHLIGHT, polyPath } from './metalArt';

export const FRONT_MARK_MIN_PX = 44;
export const FRONT_MARK_THIN_PX = 16;
export const FRONT_MARK_LINE_PX = 3;
/** The rack's stage on a 375 pt phone, and the stage's own fit padding. */
export const STAGE_W = 353;
export const STAGE_H = 290;
const PAD = 6;

/** Millimetres of the drawing in one pixel of that stage (fitXform's scale, inverted). */
export const mmPerPx = (b: ViewBox) => Math.max((b.u1 - b.u0) / (STAGE_W - 2 * PAD), (b.v1 - b.v0) / (STAGE_H - 2 * PAD));

type Pt = readonly [number, number];
export type FrontMark =
  /** An outline round a spot; `band`, a thick ring ON the circle (a rim). */
  | { kind: 'ring'; u: number; v: number; r: number; band?: number }
  /** A capsule `w` wide along a rod, a cord, a handle. */
  | { kind: 'run'; a: Pt; b: Pt; w: number }
  /** A closed outline round an irregular group. */
  | { kind: 'shape'; pts: readonly Pt[] };

const FILL = 0.2;
const DARK = '#000000';

function Run({ a, b, w, line }: { a: Pt; b: Pt; w: number; line: number }): ReactElement {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const near = -w / 2;
  const width = len + w;
  const r = w / 2;
  return (
    <Group transform={[{ translateX: a[0] }, { translateY: a[1] }, { rotate: Math.atan2(b[1] - a[1], b[0] - a[0]) }]}>
      <RoundedRect x={near} y={near} width={width} height={w} r={r} color={HIGHLIGHT} opacity={FILL} />
      <RoundedRect x={near} y={near} width={width} height={w} r={r} style="stroke" strokeWidth={line * 1.8} color={DARK} opacity={0.5} />
      <RoundedRect x={near} y={near} width={width} height={w} r={r} style="stroke" strokeWidth={line} color={HIGHLIGHT} />
    </Group>
  );
}

function Ring({ u, v, r, band, line }: { u: number; v: number; r: number; band?: number; line: number }): ReactElement {
  if (band) {
    return (
      <Group>
        <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={band + line * 1.8} color={DARK} opacity={0.5} />
        <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={band} color={HIGHLIGHT} opacity={0.75} />
      </Group>
    );
  }
  return (
    <Group>
      <Circle cx={u} cy={v} r={r} color={HIGHLIGHT} opacity={FILL} />
      <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={line * 1.8} color={DARK} opacity={0.5} />
      <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={line} color={HIGHLIGHT} />
    </Group>
  );
}

function Shape({ pts, line }: { pts: readonly Pt[]; line: number }): ReactElement {
  const p = polyPath(pts.map(([u, v]) => [u, v] as [number, number]));
  p.close();
  return (
    <Group>
      <Path path={p} color={HIGHLIGHT} opacity={FILL} />
      <Path path={p} style="stroke" strokeWidth={line * 1.8} strokeJoin="round" color={DARK} opacity={0.5} />
      <Path path={p} style="stroke" strokeWidth={line} strokeJoin="round" color={HIGHLIGHT} />
    </Group>
  );
}

/** Drawn LAST in the front art's group, over the player and the metal. */
export function FrontMarks({ marks, box }: { marks: readonly FrontMark[]; box: ViewBox }): ReactElement | null {
  if (!marks.length) return null;
  const line = FRONT_MARK_LINE_PX * 1.2 * mmPerPx(box);
  return (
    <Group>
      {marks.map((m, i) =>
        m.kind === 'ring' ? <Ring key={i} u={m.u} v={m.v} r={m.r} band={m.band} line={line} /> : m.kind === 'run' ? <Run key={i} a={m.a} b={m.b} w={m.w} line={line} /> : <Shape key={i} pts={m.pts} line={line} />,
      )}
    </Group>
  );
}
