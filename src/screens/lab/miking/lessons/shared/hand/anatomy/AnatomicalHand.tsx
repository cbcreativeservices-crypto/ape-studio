/**
 * THE MIKING HAND — the paint (hands redesign 2026-10-24). Draws the parts
 * of drawAnatomy.handLayers back to front in the house figure's skin and
 * light (PlayerFigure FIGURE_SKIN: the head's own tone, lit from the upper
 * left):
 *   • each part filled across the WHOLE hand's light (one light, no part
 *     lighter than its neighbour for no reason), its core shadow soft on the
 *     lower right, its lit edge soft on the upper left — so every finger
 *     reads as a round form, not a flat strip;
 *   • parts farther from the viewer a little darker (the fingers behind the
 *     index, the fingers wrapped round the far side of what is held);
 *   • a fine inner edge where a part lies over another, the outer contour
 *     at the house weight;
 *   • the knuckle creases, the light on the knuckle heads, the nails;
 *   • where the hand holds something (`cut`), a soft contact shadow of the
 *     fingers in front falls on it.
 * `part`: 'behind' paints only what lies behind the held object's plane
 * (draw it BEFORE the object), 'front' the rest (AFTER it), 'all' both.
 */
import { useMemo, type ReactNode } from 'react';
import { BlurMask, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { FIGURE_SKIN, NAIL } from '../../players/PlayerFigure';
import type { HandSkeleton, HandView, V3 } from '../../players/handModel.ts';
import { handLayers, partLook, type HandLayers, type HandPart } from './drawAnatomy.ts';

const SKIN = FIGURE_SKIN;
/** The hand's own light: the figure skin's three lighter steps (the
 *  darkest step made a hand's fingers read as another material). */
const RAMP = [SKIN.ramp[0], SKIN.ramp[1], SKIN.ramp[2]];
const POS = [0, 0.55, 1];

type SkPath = HandLayers['front'];

/** Contours kept off the art's own forearm (`under`): the hand meets it at
 *  the wrist crease with a faint fold, never a drawn seam. */
function OffArm({ under, children }: { under?: SkPath | null; children: ReactNode }) {
  if (!under) return <>{children}</>;
  return (
    <Group clip={under} invertClip>
      {children}
    </Group>
  );
}

function PartPaint({ p, L, shade, edge, under }: { p: HandPart; L: HandLayers; shade: number; edge: number; under?: SkPath | null }) {
  const big = p.kind === 'palm';
  // The palm mass stops where the art's own forearm lies under it: the
  // forearm's rounded end is the wrist crease (a hand painted over the arm
  // in its own light read as a pale patch with a hard edge).
  const path = useMemo(() => (big && under ? (Skia.Path.MakeFromOp(p.path, under, PathOp.Difference) ?? p.path) : p.path), [big, under, p.path]);
  const look = useMemo(() => partLook(path), [path]);
  const b = L.box;
  const g0 = vec(b.x, b.y);
  const g1 = vec(b.x + b.width, b.y + b.height);
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={g0} end={g1} colors={RAMP} positions={POS} />
      </Path>
      <Group clip={path}>
        <OffArm under={big ? under : null}>
          <Path path={look.core} color={SKIN.core} opacity={0.42}>
            <BlurMask blur={4.2} style="normal" />
          </Path>
          <Path path={look.rim} opacity={big ? 0.3 : 0.5}>
            <LinearGradient start={g0} end={vec(b.x + b.width * 0.75, b.y + b.height * 0.75)} colors={[SKIN.rim, 'rgba(255,255,255,0)']} />
            <BlurMask blur={2.6} style="normal" />
          </Path>
        </OffArm>
        {shade > 0.005 ? <Path path={path} color="#120c08" opacity={shade} /> : null}
        <Path path={p.lines} style="stroke" strokeWidth={1.05 * edge} strokeCap="round" color={SKIN.ramp[3]} opacity={0.85} />
        <Path path={p.soft} style="stroke" strokeWidth={4.5 * edge} strokeCap="round" color={SKIN.ramp[3]} opacity={0.45}>
          <BlurMask blur={2.2} style="normal" />
        </Path>
        <Path path={p.glints} style="stroke" strokeWidth={4 * edge} strokeCap="round" color={SKIN.rim} opacity={0.26}>
          <BlurMask blur={2} style="normal" />
        </Path>
      </Group>
      <OffArm under={under}>
        <Path path={path} style="stroke" strokeWidth={1.1 * edge} strokeJoin="round" color={SKIN.edge} opacity={0.6} />
      </OffArm>
      {p.nail ? (
        <Group opacity={NAIL.opacity * 0.8}>
          <Path path={p.nail} color={NAIL.fill} />
          <Path path={p.nail} style="stroke" strokeWidth={0.8 * edge} color={NAIL.edge} opacity={0.75} />
        </Group>
      ) : null}
    </Group>
  );
}

function Layer({ L, back, edge, shadow, under }: { L: HandLayers; back: boolean; edge: number; shadow: boolean; under?: SkPath | null }) {
  const parts = L.parts.filter((p) => p.back === back);
  const outline = back ? L.behind : L.front;
  if (!parts.length || !outline) return null;
  // Depth shading: the nearest part plain, the farthest ≈ 18 % darker (and
  // the parts behind the held object a further step down).
  const d0 = Math.min(...L.parts.map((p) => p.depth));
  const d1 = Math.max(...L.parts.map((p) => p.depth));
  const span = Math.max(20, d1 - d0);
  return (
    <Group>
      {shadow ? (
        <Group transform={[{ translateX: 2.2 }, { translateY: 3.2 }]}>
          <Path path={outline} color="#000" opacity={0.34}>
            <BlurMask blur={3.2} style="normal" />
          </Path>
        </Group>
      ) : null}
      {parts.map((p, i) => (
        <PartPaint key={i} p={p} L={L} edge={edge} under={under} shade={((d1 - p.depth) / span) * 0.2 + (back ? 0.16 : 0)} />
      ))}
      <OffArm under={under}>
        <Path path={outline} style="stroke" strokeWidth={1.9 * edge} strokeJoin="round" color={SKIN.edge} opacity={0.95} />
      </OffArm>
    </Group>
  );
}

export type AnatomicalHandProps = {
  sk: HandSkeleton;
  view: HandView;
  /** The forearm's picture direction (radians): the wrist runs back along it. */
  fore?: number;
  foreshortened?: boolean;
  /** The held object's plane (parts behind it painted by part="behind"). */
  cut?: { p: V3; n: V3 };
  part?: 'all' | 'behind' | 'front';
  /** A bare forearm drawn by the art (the wrist is not cut at a cuff). */
  bare?: boolean;
  /** That forearm's outline: no contour is drawn over it (the wrist crease
   *  is a faint fold). Implies `bare`. */
  under?: SkPath | null;
  /** The line weights (× the default): lighter for a hand drawn large. */
  edge?: number;
  /** The contact shadow of the fingers in front of what they hold (default: on when there is a cut). */
  shadow?: boolean;
};

/** The one Miking hand: a posed skeleton, drawn at the house standard. */
export function AnatomicalHand({ sk, view, fore, foreshortened, cut, part = 'all', bare, under, edge = 1, shadow }: AnatomicalHandProps) {
  const isBare = bare ?? !!under;
  const L = useMemo(() => handLayers(sk, view, { fore, foreshortened, cut, bare: isBare }), [sk, view, fore, foreshortened, cut, isBare]);
  const sh = shadow ?? !!cut;
  return (
    <Group>
      {part !== 'front' ? <Layer L={L} back edge={edge} shadow={false} under={under} /> : null}
      {part !== 'behind' ? <Layer L={L} back={false} edge={edge} shadow={sh} under={under} /> : null}
    </Group>
  );
}
