/**
 * FIGURE V2 — the paint (D78, 2026-11-22): how every part of a V2 figure is
 * lit. One key light from the upper left (geom.LIGHT), the drums' own.
 *   • <Form>: a mass shaded ACROSS its form — a limb as a cylinder round its
 *     axis (highlight, light, half-tone, core shadow, reflected light), a soft
 *     lit edge on the side toward the light, a fine edge only a shade darker
 *     than the mass (no black outline: the edges are values);
 *   • <Soft>: a soft shadow or light (one blur);
 *   • <HandV2>: the anatomical hand (hand/anatomy) in the same skin and light,
 *     split at the held stick's plane so the stick passes through the grip.
 * Reusable by every figure (the roll-out after the owner approves).
 */
import type { ReactNode } from 'react';
import { BlurMask, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { partLook, type HandLayers, type HandPart } from '../hand/anatomy/drawAnatomy.ts';
import { LIGHT, lerp, perp, unit, sub, dot, type Pt } from './geom.ts';
import { MAT, NAIL, type Material } from './palette.ts';
import { rimOf, type HandBuilt, type SkPath } from './paths.ts';

/** The ends of a gradient ACROSS the axis a→b, `w` each side, from the side
 *  that faces the light to the side away from it. */
export function across(a: Pt, b: Pt, w: number): [Pt, Pt] {
  let n = perp(unit(sub(b, a)));
  if (dot(n, LIGHT) < 0) n = { u: -n.u, v: -n.v };
  const m = lerp(a, b, 0.5);
  return [
    { u: m.u + n.u * w, v: m.v + n.v * w },
    { u: m.u - n.u * w, v: m.v - n.v * w },
  ];
}

export type FormProps = {
  path: SkPath;
  mat: Material;
  /** The form's axis and half-width (a limb, the torso); or `round` (a head, a fist). */
  axis?: [Pt, Pt];
  w?: number;
  round?: { c: Pt; r: number };
  /** Width of the lit edge (mm); 0 = none. */
  rim?: number;
  /** The fine edge's weight (mm); 0 = none. */
  edge?: number;
  /** An extra fall-off away from the light (0 … 1), e.g. a long garment. */
  fall?: number;
  /** Where this mass lies over the same garment (a sleeve over the shirt):
   *  its edge there is only a soft seam, not a part's outline. */
  over?: SkPath | null;
  children?: ReactNode;
};

/** One mass, shaded across its form. Children paint inside it (clipped). */
export function Form({ path, mat, axis, w = 40, round, rim = 6, edge = 1, fall = 0, over = null, children }: FormProps) {
  const b = path.getBounds();
  let fill: ReactNode;
  if (round) {
    const c = {
      u: round.c.u + LIGHT.u * round.r * 0.45,
      v: round.c.v + LIGHT.v * round.r * 0.45,
    };
    fill = <RadialGradient c={vec(c.u, c.v)} r={round.r * 1.55} colors={mat.form} positions={mat.pos} />;
  } else if (axis) {
    const [s, e] = across(axis[0], axis[1], w);
    fill = <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />;
  } else {
    fill = <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={mat.form} positions={mat.pos} />;
  }
  return (
    <Group>
      <Path path={path}>{fill}</Path>
      <Group clip={path}>
        {fall > 0 ? (
          <Path path={path}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['rgba(0,0,0,0)', `rgba(0,0,0,${fall})`]} />
          </Path>
        ) : null}
        {children}
        {rim > 0 ? (
          <Path path={rimOf(path, rim)} color={mat.rim} opacity={0.36}>
            <BlurMask blur={rim * 0.32} style="normal" />
          </Path>
        ) : null}
      </Group>
      {edge > 0 && !over ? <Path path={path} style="stroke" strokeWidth={edge} color={mat.edge} opacity={0.55} /> : null}
      {edge > 0 && over ? (
        <>
          <Group clip={over} invertClip>
            <Path path={path} style="stroke" strokeWidth={edge} color={mat.edge} opacity={0.55} />
          </Group>
          <Group clip={over}>
            <Path path={path} style="stroke" strokeWidth={edge * 2.4} color={mat.deep} opacity={0.12}>
              <BlurMask blur={1.6} style="normal" />
            </Path>
          </Group>
        </>
      ) : null}
    </Group>
  );
}

/** A soft shadow (or light) shape. */
export function Soft({ path, color = '#000', opacity = 0.4, blur = 8, clip }: { path: SkPath; color?: string; opacity?: number; blur?: number; clip?: SkPath }) {
  const p = (
    <Path path={path} color={color} opacity={opacity}>
      <BlurMask blur={blur} style="normal" />
    </Path>
  );
  return clip ? <Group clip={clip}>{p}</Group> : p;
}

/** Folds (lens shapes): a darker crease with a little light on its upper edge. */
export function Folds({ path, mat, clip, opacity = 0.5 }: { path: SkPath; mat: Material; clip?: SkPath; opacity?: number }) {
  return (
    <Group clip={clip}>
      <Group transform={[{ translateX: LIGHT.u * 2.2 }, { translateY: LIGHT.v * 2.2 }]}>
        <Path path={path} color={mat.rim} opacity={opacity * 0.35}>
          <BlurMask blur={1.6} style="normal" />
        </Path>
      </Group>
      <Path path={path} color={mat.deep} opacity={opacity}>
        <BlurMask blur={1.4} style="normal" />
      </Path>
    </Group>
  );
}

/* ── the hand ── */

const SKIN = MAT.skin;

function HandPartV2({ p, L, shade, under }: { p: HandPart; L: HandLayers; shade: number; under: SkPath | null }) {
  const look = partLook(p.path, 2.6, 11);
  const b = L.box;
  // The hand's own light: its upper planes (the back of the hand, the tops of
  // the fingers) toward the key light, its under planes away.
  const m = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
  // One fixed span of light for every hand (≈ a hand's length), so two hands of one person read as the same skin.
  const R = 70;
  return (
    <Group>
      <Path path={p.path}>
        <LinearGradient start={vec(m.u + LIGHT.u * R, m.v + LIGHT.v * R)} end={vec(m.u - LIGHT.u * R, m.v - LIGHT.v * R)} colors={[SKIN.form[0], SKIN.form[1], SKIN.form[2], SKIN.form[3]]} positions={[0, 0.3, 0.68, 1]} />
      </Path>
      <Group clip={p.path}>
        <Path path={look.core} color={SKIN.deep} opacity={0.5}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={look.rim} color={SKIN.rim} opacity={0.34}>
          <BlurMask blur={1.6} style="normal" />
        </Path>
        {shade > 0.005 ? <Path path={p.path} color="#1a0f0a" opacity={shade} /> : null}
        <Path path={p.soft} style="stroke" strokeWidth={4} strokeCap="round" color={SKIN.deep} opacity={0.3}>
          <BlurMask blur={2} style="normal" />
        </Path>
        <Path path={p.lines} style="stroke" strokeWidth={0.9} strokeCap="round" color={SKIN.edge} opacity={0.55} />
        <Path path={p.glints} style="stroke" strokeWidth={3.5} strokeCap="round" color={SKIN.rim} opacity={0.3}>
          <BlurMask blur={1.6} style="normal" />
        </Path>
      </Group>
      <Group clip={under ?? undefined} invertClip={!!under}>
        <Path path={p.path} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.68} />
      </Group>
      {p.nail ? (
        <Group>
          <Path path={p.nail} color={NAIL.fill} opacity={0.7} />
          <Path path={p.nail} style="stroke" strokeWidth={0.6} color={NAIL.edge} opacity={0.6} />
        </Group>
      ) : null}
    </Group>
  );
}

function HandLayer({ L, back, under, shadow }: { L: HandLayers; back: boolean; under: SkPath | null; shadow: boolean }) {
  const parts = L.parts.filter((p) => p.back === back);
  const outline = back ? L.behind : L.front;
  if (!parts.length || !outline) return null;
  const d0 = Math.min(...L.parts.map((p) => p.depth));
  const d1 = Math.max(...L.parts.map((p) => p.depth));
  const span = Math.max(20, d1 - d0);
  return (
    <Group>
      {shadow ? (
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={outline} color="#000" opacity={0.3}>
            <BlurMask blur={2.6} style="normal" />
          </Path>
        </Group>
      ) : null}
      {parts.map((p, i) => (
        <HandPartV2 key={i} p={p} L={L} under={under} shade={((d1 - p.depth) / span) * 0.12 + (back ? 0.08 : 0)} />
      ))}
    </Group>
  );
}

/** A hand holding a stick: the stick passes THROUGH the grip (paths.HandBuilt). */
export function HandV2({ hand, under, stick }: { hand: HandBuilt; under: SkPath | null; stick?: ReactNode }) {
  if (hand.endOn)
    return (
      <Group>
        {stick ?? null}
        <HandLayer L={hand.L} back under={under} shadow={false} />
        <HandLayer L={hand.L} back={false} under={under} shadow />
        {stick && hand.buttShow ? <Group clip={hand.buttShow}>{stick}</Group> : null}
      </Group>
    );
  return (
    <Group>
      <HandLayer L={hand.L} back under={under} shadow={false} />
      {stick ?? null}
      <HandLayer L={hand.L} back={false} under={under} shadow />
    </Group>
  );
}
