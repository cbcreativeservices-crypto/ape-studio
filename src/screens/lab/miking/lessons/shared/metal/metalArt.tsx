/**
 * SUSPENDED METAL — shared drawing pieces for Lab 2's triangle, finger
 * cymbals, bar chimes and gong (charter §2 layer 3; the Kick standard: real
 * objects, gradients lit from the upper left, rim highlights, the palette).
 *
 *   rod        a metal rod along a polyline: a dark under-stroke, the body,
 *              a lit edge toward the upper left and a thin specular line —
 *              so a 12.7 mm steel rod reads as round steel, not a line;
 *   player     a standing player as quiet line art (a bald head — the house
 *              style), from the side, from above and from the front, so the
 *              instrument stays the subject;
 *   standing   a floor band for the side and front views.
 *
 * Paths are built once per call site (useMemo / module caches); nothing
 * moves by itself (D8).
 */
import type { ReactElement } from 'react';
import { BlurMask, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

export type SkPath = ReturnType<typeof Skia.Path.Make>;
export const make = (): SkPath => Skia.Path.Make();

/** Palettes (light → dark). */
export const STEEL = ['#f4f7fb', '#c9d0da', '#8d96a4', '#555d6a', '#2b3038'] as const;
export const BRASS = ['#fff0c2', '#f0cf7a', '#c99a3e', '#8a6420', '#4d360f'] as const;
export const BRONZE = ['#f6dcae', '#d6a65e', '#a8743a', '#6e4a22', '#3e2912'] as const;
export const ALU = ['#fbfcfe', '#dfe4ec', '#b4bcc8', '#7f8896', '#4a515c'] as const;
export const GOLD_ALU = ['#fff4cf', '#f1d68e', '#cfa955', '#94722e', '#5a4317'] as const;
export const WOOD = ['#e2b47a', '#b77d43', '#7c4c22', '#4a2a10'] as const;
export const INK = '#5a5f6a';

/** A polyline as a path. */
export function polyPath(pts: readonly (readonly [number, number])[], close = false): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
  return p;
}

/**
 * A ROUND METAL ROD along a path (drawn in mm): under-stroke, body, a lit
 * edge offset toward the upper left, and a specular line. `pal` = 5 stops.
 */
export function Rod({ path, d, pal, shadow = true }: { path: SkPath; d: number; pal: readonly string[]; shadow?: boolean }): ReactElement {
  const o = d * 0.18;
  return (
    <Group>
      {shadow ? (
        <Group transform={[{ translateX: d * 0.5 }, { translateY: d * 0.8 }]}>
          <Path path={path} style="stroke" strokeWidth={d * 1.1} strokeCap="round" strokeJoin="round" color="#000" opacity={0.45}>
            <BlurMask blur={d * 0.7} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Path path={path} style="stroke" strokeWidth={d * 1.08} strokeCap="round" strokeJoin="round" color={pal[4]} />
      <Path path={path} style="stroke" strokeWidth={d * 0.86} strokeCap="round" strokeJoin="round" color={pal[2]} />
      <Group transform={[{ translateX: -o }, { translateY: -o }]}>
        <Path path={path} style="stroke" strokeWidth={d * 0.42} strokeCap="round" strokeJoin="round" color={pal[1]} />
        <Path path={path} style="stroke" strokeWidth={d * 0.13} strokeCap="round" strokeJoin="round" color={pal[0]} opacity={0.9} />
      </Group>
    </Group>
  );
}

/** A floor band (side and front views): the floor at v = 0, below it dark. */
export function Floor({ u0, u1 }: { u0: number; u1: number }): ReactElement {
  const floor = make();
  floor.addRect(Skia.XYWHRect(u0, 0, u1 - u0, 900));
  const edge = make();
  edge.moveTo(u0, 0);
  edge.lineTo(u1, 0);
  return (
    <Group>
      <Path path={floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 80)} colors={['#202128', '#141519', '#0b0b0e']} />
      </Path>
      <Path path={edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
    </Group>
  );
}

/**
 * A standing player, line art, in frame H (+x toward the audience, +y down,
 * floor y = 0, +z the player's right): chest front plane at x = −250, head
 * centre at h 1650.
 *   side  (u = x, v = y): in profile, facing +x;
 *   top   (u = x, v = z): shoulders and head from above;
 *   front (u = −z, v = y): seen from the audience.
 * `arms` adds the forearms reaching forward to two hand points.
 */
export function playerSide(hands: readonly (readonly [number, number])[] = []): SkPath {
  const p = make();
  p.addCircle(-360, -1650, 95);
  p.moveTo(-420, -1555);
  p.cubicTo(-470, -1400, -470, -1150, -440, -950); // back
  p.lineTo(-430, -500);
  p.lineTo(-440, -20); // back leg
  p.lineTo(-330, -20);
  p.moveTo(-300, -1540);
  p.cubicTo(-250, -1420, -240, -1300, -255, -1150); // chest
  p.cubicTo(-265, -1050, -300, -980, -320, -950);
  p.moveTo(-330, -950);
  p.lineTo(-300, -500);
  p.lineTo(-260, -20); // front leg
  p.lineTo(-150, -20);
  for (const [hx, hy] of hands) {
    p.moveTo(-380, -1450); // shoulder
    p.cubicTo(-380, -1250, -320, (hy - 1450) / 2 + 20, hx - 60, hy + 40);
    p.lineTo(hx, hy);
  }
  return p;
}

export function playerTop(hands: readonly (readonly [number, number])[] = []): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(-470, -240, 230, 480));
  p.addCircle(-360, 0, 92);
  for (const [hx, hz] of hands) {
    const sz = hz >= 0 ? 200 : -200;
    p.moveTo(-330, sz);
    p.cubicTo(-250, sz * 1.05, (hx - 250) / 2, (hz + sz) / 2, hx, hz);
  }
  return p;
}

export function playerFront(hands: readonly (readonly [number, number])[] = []): SkPath {
  const p = make();
  p.addCircle(0, -1650, 95);
  p.moveTo(-60, -1550);
  p.lineTo(-60, -1500);
  p.moveTo(60, -1550);
  p.lineTo(60, -1500);
  p.moveTo(-210, -1460);
  p.cubicTo(-120, -1500, 120, -1500, 210, -1460); // shoulders
  p.moveTo(-190, -1440);
  p.lineTo(-160, -950);
  p.lineTo(160, -950);
  p.lineTo(190, -1440); // torso
  p.moveTo(-120, -950);
  p.lineTo(-120, -20);
  p.moveTo(120, -950);
  p.lineTo(120, -20);
  for (const [hu, hv] of hands) {
    const su = hu >= 0 ? 210 : -210;
    p.moveTo(su, -1450);
    p.cubicTo(su * 1.15, -1250, (su + hu) / 2, hv + 120, hu, hv);
  }
  return p;
}

/** The player's line art, drawn quietly behind the instrument. */
export function PlayerInk({ path, faint = false }: { path: SkPath; faint?: boolean }): ReactElement {
  return <Path path={path} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={INK} opacity={faint ? 0.35 : 0.6} />;
}

/**
 * A hand from the side, line art, pinching a strap or a clip at (u, v):
 * the fingers curled over the top, the thumb under — about life size (a
 * palm ~80 mm). `flip` mirrors it (a hand from the other side).
 */
export function handPinch(u: number, v: number, flip = false): SkPath {
  const s = flip ? -1 : 1;
  const p = make();
  // the back of the hand and the wrist, coming down from the arm
  p.moveTo(u + s * 95, v - 70);
  p.cubicTo(u + s * 70, v - 60, u + s * 40, v - 48, u + s * 18, v - 30);
  // curled fingers over the top, ending at the pinch
  p.cubicTo(u + s * 4, v - 22, u - s * 10, v - 18, u - s * 8, v - 6);
  p.cubicTo(u - s * 6, v + 2, u + s * 2, v + 4, u + s * 6, v);
  // the thumb underneath, back to the palm
  p.moveTo(u + s * 6, v + 6);
  p.cubicTo(u + s * 20, v + 18, u + s * 48, v + 10, u + s * 70, v - 12);
  p.lineTo(u + s * 100, v - 30);
  return p;
}

/** A hand's line art: a little stronger than the body's, still quiet. */
export function HandInk({ path }: { path: SkPath }): ReactElement {
  return <Path path={path} style="stroke" strokeWidth={3.2} strokeCap="round" strokeJoin="round" color="#9aa0ad" opacity={0.75} />;
}

/** A highlight halo for a tapped part (amber, under the part). */
export const HIGHLIGHT = '#ffc64d';
