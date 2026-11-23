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
import { Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { partLook, type HandLayers, type HandPart } from '../hand/anatomy/drawAnatomy.ts';
import { LIGHT, lerp, perp, unit, sub, dot, type Pt } from './geom.ts';
import { MAT, NAIL, type Material } from './palette.ts';
import { rimOf, type ArtPaths, type HandBuilt, type SkPath } from './paths.ts';

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
            <Blur mm={rim * 0.32} />
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
              <Blur mm={1.6} />
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
      <Blur mm={blur} />
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
          <Blur mm={1.6} />
        </Path>
      </Group>
      <Path path={path} color={mat.deep} opacity={opacity}>
        <Blur mm={1.4} />
      </Path>
    </Group>
  );
}

/* ── the hand ── */

const SKIN = MAT.skin;
/** Warmer, redder skin at the knuckles and the fingertips. */
const WARM = '#b8665a';

/** The hand's one light: a fixed span (≈ a hand's length) round the hand's
 *  centre, so every part of a hand — and both hands of one person — share it
 *  and re-filling a part never shows a seam. */
function skinFill(L: HandLayers) {
  const b = L.box;
  const m = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
  const R = 70;
  return <LinearGradient start={vec(m.u + LIGHT.u * R, m.v + LIGHT.v * R)} end={vec(m.u - LIGHT.u * R, m.v - LIGHT.v * R)} colors={[SKIN.form[0], SKIN.form[1], SKIN.form[2], SKIN.form[3]]} positions={[0, 0.3, 0.68, 1]} />;
}

/** One part's form inside the hand: the same skin (no seam), a core shadow
 *  that follows it as a cylinder (darker where it turns under, between the
 *  fingers), a soft lit edge, the knuckle light. No outline of its own. */
function PartForm({ p, L, shade }: { p: HandPart; L: HandLayers; shade: number }) {
  const look = partLook(p.path, 2.4, p.kind === 'palm' ? 14 : 9);
  return (
    <Group>
      <Path path={p.path}>{skinFill(L)}</Path>
      <Group clip={p.path}>
        <Path path={look.core} color={SKIN.deep} opacity={p.kind === 'palm' ? 0.38 : 0.5}>
          <Blur mm={p.kind === 'palm' ? 6 : 3.2} />
        </Path>
        <Path path={look.rim} color={SKIN.rim} opacity={0.3}>
          <Blur mm={1.4} />
        </Path>
        {shade > 0.005 ? <Path path={p.path} color="#1a0f0a" opacity={shade} /> : null}
        <Path path={p.soft} style="stroke" strokeWidth={4} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={2} />
        </Path>
        <Path path={p.glints} style="stroke" strokeWidth={3.5} strokeCap="round" color={SKIN.rim} opacity={0.32}>
          <Blur mm={1.6} />
        </Path>
        {p.back ? (
          <Path path={p.lines} style="stroke" strokeWidth={1.4} strokeCap="round" color={SKIN.deep} opacity={0.35}>
            <Blur mm={0.8} />
          </Path>
        ) : null}
      </Group>
    </Group>
  );
}

/** A nail where one faces the viewer: a little pinker and lighter than the
 *  skin, with a soft highlight along its curve — never a pale sticker. */
function NailV2({ path }: { path: SkPath }) {
  return (
    <Group>
      <Path path={path} color={NAIL.fill} opacity={0.16} />
      <Group clip={path}>
        <Group transform={[{ translateX: -LIGHT.u * 1.2 }, { translateY: -LIGHT.v * 1.2 }]}>
          <Path path={path} color={SKIN.deep} opacity={0.18}>
            <Blur mm={0.8} />
          </Path>
        </Group>
        <Group transform={[{ translateX: LIGHT.u * 1.4 }, { translateY: LIGHT.v * 1.4 }]}>
          <Path path={path} style="stroke" strokeWidth={1} color="#fff3ea" opacity={0.1}>
            <Blur mm={0.6} />
          </Path>
        </Group>
      </Group>
    </Group>
  );
}

function HandSide({ hand, back, under }: { hand: HandBuilt; back: boolean; under: SkPath | null }) {
  const L = hand.L;
  const parts = L.parts.filter((p) => p.back === back);
  const form = back ? hand.formBack : hand.formFront;
  if (!parts.length || !form) return null;
  const d0 = Math.min(...L.parts.map((p) => p.depth));
  const d1 = Math.max(...L.parts.map((p) => p.depth));
  const span = Math.max(20, d1 - d0);
  return (
    <Group>
      {/* the skin form first, as one silhouette */}
      <Path path={form}>{skinFill(L)}</Path>
      {parts.map((p, i) => (
        <Group key={i}>
          <PartForm p={p} L={L} shade={((d1 - p.depth) / span) * 0.1 + (back ? 0.07 : 0)} />
          {p.kind === 'palm' ? (
            <Group clip={p.path}>
              {/* the back of the hand toward the light, the palm's face turning under */}
              <Path path={p.path}>
                <LinearGradient start={vec(hand.palmAxis.a.u, hand.palmAxis.a.v)} end={vec(hand.palmAxis.b.u, hand.palmAxis.b.v)} colors={['rgba(255,236,222,0.16)', 'rgba(0,0,0,0)', 'rgba(52,28,18,0.32)']} />
              </Path>
              <Path path={hand.formsLight} color={SKIN.rim} opacity={0.3}>
                <Blur mm={6} />
              </Path>
              <Path path={hand.formsDark} color={SKIN.deep} opacity={0.3}>
                <Blur mm={6} />
              </Path>
              <Path path={hand.tendons} style="stroke" strokeWidth={3.2} strokeCap="round" color={SKIN.rim} opacity={0.22}>
                <Blur mm={1.6} />
              </Path>
              <Path path={hand.palmLines} style="stroke" strokeWidth={1.8} strokeCap="round" color={SKIN.deep} opacity={0.32}>
                <Blur mm={0.9} />
              </Path>
            </Group>
          ) : null}
        </Group>
      ))}
      <Group clip={form}>
        <Path path={back ? hand.warmBack : hand.warmFront} color={WARM} opacity={0.22}>
          <Blur mm={3.5} />
        </Path>
        {/* where a finger lies over its neighbour, and each joint's crease: soft */}
        {back ? null : (
          <>
            <Path path={hand.creases} style="stroke" strokeWidth={2.6} strokeCap="round" color={SKIN.deep} opacity={0.3}>
              <Blur mm={1.3} />
            </Path>
            <Path path={hand.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.edge} opacity={0.32} />
          </>
        )}
      </Group>
      {parts.map((p, i) => (p.nail ? <NailV2 key={`n${i}`} path={p.nail} /> : null))}
      {/* the silhouette's edge: only a shade darker, and none over the art's own forearm */}
      <Group clip={under ?? undefined} invertClip={!!under}>
        <Path path={form} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Group>
    </Group>
  );
}

/** A hand holding a stick (paths.HandBuilt): the stick passes THROUGH the
 *  grip — the fingers wrapped behind it first, its shadow on them, the stick,
 *  then the thumb and the fingers in front with their shadow on the stick. */
export function HandV2({ hand, under, stick }: { hand: HandBuilt; under: SkPath | null; stick?: ReactNode }) {
  const frontShadow = (
    <Group clip={hand.stickBody}>
      <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
        <Path path={hand.formFront} color="#000" opacity={0.45}>
          <Blur mm={2.6} />
        </Path>
      </Group>
    </Group>
  );
  if (hand.endOn)
    return (
      <Group>
        {stick ?? null}
        <HandSide hand={hand} back under={under} />
        <HandSide hand={hand} back={false} under={under} />
        {stick && hand.buttShow ? <Group clip={hand.buttShow}>{stick}</Group> : null}
      </Group>
    );
  return (
    <Group>
      <HandSide hand={hand} back under={under} />
      {/* the stick's shadow on the fingers wrapped behind it */}
      {hand.formBack ? (
        <Group clip={hand.formBack}>
          <Group transform={[{ translateX: -LIGHT.u * 4 }, { translateY: -LIGHT.v * 4 }]}>
            <Path path={hand.stickLine} style="stroke" strokeWidth={14} strokeCap="round" color="#000" opacity={0.35}>
              <Blur mm={2.5} />
            </Path>
          </Group>
        </Group>
      ) : null}
      {stick ?? null}
      {/* the front fingers' shadow where they close on the stick */}
      {frontShadow}
      <HandSide hand={hand} back={false} under={under} />
    </Group>
  );
}

/* ── the authored hand (authoredHands.ts) ── */

/** One authored part: the hand's one skin light (no seam), its own cylinder
 *  turning across its axis, a soft lit edge; it casts a soft shadow on what
 *  lies under it — the separation between neighbouring forms is that shadow,
 *  never an outline. */
function ArtPart({ path, axis, kind, box, within, lift = 0, outline = 0, casts, castBlur = 2.6, edge, shade }: { path: SkPath; axis: [Pt, Pt]; kind: string; box: { x: number; y: number; width: number; height: number }; within: SkPath; lift?: number; outline?: number; casts?: number; castBlur?: number; edge?: SkPath | null; shade?: [Pt, Pt] | null }) {
  const m = { u: box.x + box.width / 2, v: box.y + box.height / 2 };
  // (mostly from above: the top planes lit, the under planes turning away)
  const Ld = { u: -0.32, v: -0.95 };
  const R = 56;
  const w = kind === 'palm' ? 40 : kind === 'wrist' ? 24 : 10;
  const [s0, e0] = across(axis[0], axis[1], w);
  const body = (
    <Group>
      <Group clip={within}>
        <Group transform={[{ translateX: -LIGHT.u * 2.6 }, { translateY: -LIGHT.v * 2.6 }]}>
          <Path path={path} color="#2a160e" opacity={casts ?? (shade ? 0 : kind === 'palm' || kind === 'wrist' ? 0 : 0.5)}>
            <Blur mm={castBlur} />
          </Path>
        </Group>
      </Group>
      <Path path={path}>
        <LinearGradient start={vec(m.u + Ld.u * R, m.v + Ld.v * R)} end={vec(m.u - Ld.u * R, m.v - Ld.v * R)} colors={['#cfb19b', SKIN.form[1], SKIN.form[2], '#7f5d4c']} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Group clip={path}>
        {shade ? (
          // (in the hand's soft shade: a step darker under the hand's edge, the skin's own tone toward its outer edge)
          <Path path={path}>
            <LinearGradient start={vec(shade[0].u, shade[0].v)} end={vec(shade[1].u, shade[1].v)} colors={['rgba(52,26,16,0.24)', 'rgba(52,26,16,0.06)', 'rgba(255,238,226,0.08)']} positions={[0, 0.55, 1]} />
          </Path>
        ) : (
        <Path path={path}>
          <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={kind === 'digit' ? ['rgba(255,238,226,0.32)', 'rgba(255,238,226,0.06)', 'rgba(52,26,16,0.24)', 'rgba(52,26,16,0.58)'] : ['rgba(255,238,226,0.22)', 'rgba(255,238,226,0.04)', 'rgba(52,26,16,0.16)', 'rgba(52,26,16,0.42)']} positions={[0, 0.3, 0.7, 1]} />
        </Path>
        )}
        <Path path={rimOf(path, 2.4)} color={SKIN.rim} opacity={0.3 + lift}>
          <Blur mm={1.2} />
        </Path>
        {lift > 0 ? <Path path={path} color={SKIN.rim} opacity={lift} /> : null}
      </Group>
      {/* a finger's one outline: where it lies over its neighbour, the one dark crease between them */}
      {outline > 0 ? <Path path={edge ?? path} style="stroke" strokeWidth={1.1} strokeJoin="round" strokeCap="round" color={SKIN.edge} opacity={shade ? outline * 0.6 : outline} /> : null}
    </Group>
  );
  return body;
}

/** The authored hand on its stick, the stick through it in depth order. */
export function AuthoredHand({ a, stick }: { a: ArtPaths; stick?: ReactNode }) {
  const b = a.all.getBounds();
  const box = { x: b.x, y: b.y, width: b.width, height: b.height };
  const paint = (layer: 'back' | 'front') => {
    const ps = a.parts.filter((p) => p.layer === layer);
    if (!ps.length) return null;
    const form = layer === 'back' ? a.back : a.front;
    return (
      <Group>
        {ps.map((p, i) => (
          // (the nearest finger of the fist, its little finger, a step lighter: the form nearest the viewer and the light)
          <ArtPart key={`${layer}${i}`} path={p.path} axis={p.axis} kind={p.kind} box={box} within={a.all} lift={a.endOn && p.name === 'little' ? 0.16 : 0} outline={!a.endOn && p.kind === 'digit' ? 0.55 : 0} casts={a.stickUnder && p.kind === 'palm' ? 0.22 : undefined} castBlur={a.stickUnder && p.kind === 'palm' ? 6 : 2.6} edge={p.edge} shade={p.shade} />
        ))}
        {form ? (
          <Group clip={form}>
            {a.lights.map((l, i) => (
              <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={0.26}>
                <Blur mm={4} />
              </Path>
            ))}
            {a.darks.map((l, i) => (
              <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={0.3}>
                <Blur mm={5} />
              </Path>
            ))}
            <Path path={a.warm} color={WARM} opacity={0.22}>
              <Blur mm={3} />
            </Path>
            <Path path={a.creases} style="stroke" strokeWidth={2.4} strokeCap="round" color={SKIN.deep} opacity={0.3}>
              <Blur mm={1.1} />
            </Path>
            <Path path={a.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.edge} opacity={0.24} />
            {a.nails.map((n, i) => (
              <NailV2 key={`n${i}`} path={n} />
            ))}
          </Group>
        ) : null}
      </Group>
    );
  };
  const edge = <Path path={a.all} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />;
  if (a.endOn)
    return (
      <Group>
        {stick ?? null}
        {paint('back')}
        {paint('front')}
        {/* the little finger, nearest the viewer: its own clear edge over the palm */}
        {a.parts
          .filter((p) => p.name === 'little')
          .map((p, i) => (
            <Group key={`le${i}`} clip={a.all}>
              <Path path={p.path} style="stroke" strokeWidth={1} strokeJoin="round" color={SKIN.edge} opacity={0.45} />
            </Group>
          ))}
        {edge}
        {/* the butt comes toward the viewer out of the fist's opening: the round end of a
            wooden stick, its short shaft foreshortened, its contact shadow where the fingers close */}
        {a.stub && a.stubCap ? (
          <Group>
            <Group clip={a.all}>
              <Path path={a.stub} color="#000" opacity={0.42}>
                <Blur mm={3} />
              </Path>
            </Group>
            <Path path={a.stub}>
              <LinearGradient start={vec(a.stubCap.getBounds().x, a.stubCap.getBounds().y)} end={vec(a.stubCap.getBounds().x + 14, a.stubCap.getBounds().y + 14)} colors={['#f0d6a6', '#c79a5c', '#7d5426']} />
            </Path>
            <Path path={a.stub} style="stroke" strokeWidth={1} color="#3a240e" opacity={0.7} />
            <Path path={a.stubCap}>
              <RadialGradient c={vec(a.stubCap.getBounds().x + 6, a.stubCap.getBounds().y + 6)} r={9} colors={['#ecd3a4', '#d1aa72', '#a77a43']} />
            </Path>
            <Path path={a.stubCap} style="stroke" strokeWidth={0.9} color="#3a240e" opacity={0.65} />
          </Group>
        ) : null}
      </Group>
    );
  if (a.stickUnder)
    // From above (the back of the hand over its stick): the stick first, the
    // whole hand over it with its soft shadow on the stick.
    return (
      <Group>
        {stick ?? null}
        <Group clip={a.stickBody}>
          <Group transform={[{ translateX: -LIGHT.u * 4 }, { translateY: -LIGHT.v * 4 }]}>
            <Path path={a.all} color="#000" opacity={0.45}>
              <Blur mm={3} />
            </Path>
          </Group>
        </Group>
        {paint('back')}
        {paint('front')}
        {edge}
      </Group>
    );
  return (
    <Group>
      {paint('back')}
      {/* the stick's shadow on the palm */}
      {a.back ? (
        <Group clip={a.back}>
          <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
            <Path path={a.stickLine} style="stroke" strokeWidth={14} strokeCap="round" color="#2a160e" opacity={0.4}>
              <Blur mm={3} />
            </Path>
          </Group>
        </Group>
      ) : null}
      {stick ?? null}
      {/* the fingers' and thumb's shadow where they close on the stick */}
      <Group clip={a.stickBody}>
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={a.front} color="#000" opacity={0.5}>
            <Blur mm={2.4} />
          </Path>
        </Group>
      </Group>
      {paint('front')}
      {/* every form in front of the stick: opaque, with a clean edge where it lies over it */}
      <Group clip={a.stickBody}>
        <Path path={a.front} style="stroke" strokeWidth={1.1} strokeJoin="round" color={SKIN.edge} opacity={0.7} />
      </Group>
      {edge}
    </Group>
  );
}
