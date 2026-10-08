/**
 * THE AUDIENCE VENUE — the look (Lab 7 group 3; B08). Real objects lit from
 * the upper left; the venue plan itself is Lab 7b group 2's (shared/sports/
 * VenueArt — a section drawn as seats without people). Static (D8).
 *
 *   CoverageWedge   a PA cluster's coverage on the plan: a soft wedge from
 *                   the cabinet into the audience — a simplified picture of
 *                   where it is aimed, never a measured dispersion.
 *   SurroundHead    a self-contained five-capsule surround mic from above:
 *                   three capsules across the front (L, C, R), two toward the
 *                   rear (Ls, Rs), its FRONT arrow; channel labels only.
 *   AmbiHead        a four-capsule first-order Ambisonic mic from above: the
 *                   capsules on a small tetrahedron (front-left-up, front-
 *                   right-down, back-left-down, back-right-up), its FRONT mark
 *                   and arrow; capsule labels only — no decode is drawn.
 *   ImmersiveScene  the immersive step's display, labelled.
 */
import { useMemo } from 'react';
import { Circle, Group, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { SoundCanvas } from '../smallperc/soundKit';
import { dirFromDeg, planUV, type P2 } from '../sports/venuePlan.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const AMBER = '#ffc64d';

/** A PA's coverage wedge on the plan: from the cabinet at `c`, centred on
 *  `dirDeg` (as dirFromDeg), ±`halfDeg`, out to `reach` m. */
export function CoverageWedge({ c, dirDeg, halfDeg, reach, px, hot = false }: { c: P2; dirDeg: number; halfDeg: number; reach: number; px: number; hot?: boolean }) {
  const p = useMemo(() => {
    const path = make();
    const o = planUV(c);
    path.moveTo(o.u, o.v);
    for (let k = 0; k <= 24; k++) {
      const d = dirFromDeg(dirDeg - halfDeg + (2 * halfDeg * k) / 24);
      const q = planUV({ x: c.x + d.x * reach, y: c.y + d.y * reach });
      path.lineTo(q.u, q.v);
    }
    path.close();
    return path;
  }, [c, dirDeg, halfDeg, reach]);
  const o = planUV(c);
  const tip = planUV({ x: c.x + dirFromDeg(dirDeg).x * reach, y: c.y + dirFromDeg(dirDeg).y * reach });
  return (
    <Group>
      <Path path={p} opacity={hot ? 0.34 : 0.2}>
        <LinearGradient start={vec(o.u, o.v)} end={vec(tip.u, tip.v)} colors={['#ff8a5c', 'rgba(255,138,92,0)']} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.4 * px} color="#ff8a5c" opacity={hot ? 0.7 : 0.4} />
    </Group>
  );
}

/* ── the immersive tokens (from above, mm; the front is UP the screen) ── */

function Capsule({ x, y, dir, r = 9, l = 46 }: { x: number; y: number; dir: number; r?: number; l?: number }) {
  // A small pencil capsule pointing along `dir` (radians, screen), its grille at the front.
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: dir }]}>
      <RoundedRect x={-l} y={-r} width={l} height={2 * r} r={r * 0.6}>
        <LinearGradient start={vec(0, -r)} end={vec(0, r)} colors={['#9aa1ad', '#4b5058', '#23262b']} />
      </RoundedRect>
      <RoundedRect x={-8} y={-r - 0.5} width={9} height={2 * r + 1} r={3} color="#c9ced6" />
      <Circle cx={2} cy={0} r={2.2} color={AMBER} />
    </Group>
  );
}

function FrontArrow({ y0, y1 }: { y0: number; y1: number }) {
  const p = make();
  p.moveTo(0, y0);
  p.lineTo(0, y1);
  p.moveTo(-12, y1 + 16);
  p.lineTo(0, y1);
  p.lineTo(12, y1 + 16);
  return <Path path={p} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" color={AMBER} />;
}

/** The five-capsule surround head from above (mm): the front is −v. */
export function SurroundHead() {
  const bars = useMemo(() => {
    const p = make();
    p.moveTo(-95, -20);
    p.lineTo(95, -20);
    p.moveTo(0, -20);
    p.lineTo(0, 70);
    p.moveTo(-60, 70);
    p.lineTo(60, 70);
    return p;
  }, []);
  const up = -Math.PI / 2;
  return (
    <Group>
      <Path path={bars} style="stroke" strokeWidth={14} strokeCap="round" color="#15161a" />
      <Path path={bars} style="stroke" strokeWidth={9} strokeCap="round" color="#5b616c" />
      <Circle cx={0} cy={25} r={22}>
        <RadialGradient c={vec(-8, 16)} r={30} colors={['#7d838e', '#33363d', '#15161a']} />
      </Circle>
      <Capsule x={-95} y={-26} dir={up - 0.5} />
      <Capsule x={0} y={-40} dir={up} />
      <Capsule x={95} y={-26} dir={up + 0.5} />
      <Capsule x={-60} y={76} dir={Math.PI / 2 + 0.7} />
      <Capsule x={60} y={76} dir={Math.PI / 2 - 0.7} />
      <FrontArrow y0={-90} y1={-150} />
    </Group>
  );
}

/** The four-capsule Ambisonic head from above (mm): the front is −v; the
 *  capsules that point UP drawn lit, the ones that point DOWN shaded. */
export function AmbiHead() {
  const caps: { x: number; y: number; up: boolean }[] = [
    { x: -30, y: -30, up: true },
    { x: 30, y: -30, up: false },
    { x: -30, y: 30, up: false },
    { x: 30, y: 30, up: true },
  ];
  return (
    <Group>
      <Circle cx={0} cy={0} r={46}>
        <RadialGradient c={vec(-14, -16)} r={60} colors={['#8a909b', '#3a3e45', '#16171b']} />
      </Circle>
      <Circle cx={0} cy={0} r={46} style="stroke" strokeWidth={2} color="#0a0b0d" />
      {caps.map((c, i) => (
        <Group key={i}>
          <Circle cx={c.x} cy={c.y} r={17} color={c.up ? '#c9ced6' : '#6c727c'} />
          <Circle cx={c.x} cy={c.y} r={17} style="stroke" strokeWidth={1.6} color="#0a0b0d" />
          <Circle cx={c.x} cy={c.y} r={4} color={c.up ? AMBER : '#a37c2a'} />
        </Group>
      ))}
      {/* the front mark on the body */}
      <RoundedRect x={-5} y={-58} width={10} height={14} r={3} color="#e8eef5" />
      <FrontArrow y0={-90} y1={-150} />
    </Group>
  );
}

export const IMMERSIVE_BOX = { u0: -190, u1: 190, v0: -190, v1: 150 };

export function ImmersiveScene({ w, h, kind, accessibilityLabel }: { w: number; h: number; kind: 'surround5' | 'ambi4'; accessibilityLabel: string }) {
  const labels: StaticLabel[] =
    kind === 'surround5'
      ? [
          { id: 'f', text: 'FRONT', u: 18, v: -165, align: 'left', tone: 'amber' },
          { id: 'L', text: 'L', u: -150, v: -40, align: 'center' },
          { id: 'C', text: 'C', u: 0, v: -100, align: 'center' },
          { id: 'R', text: 'R', u: 150, v: -40, align: 'center' },
          { id: 'Ls', text: 'Ls', u: -112, v: 118, align: 'center' },
          { id: 'Rs', text: 'Rs', u: 112, v: 118, align: 'center' },
        ]
      : [
          { id: 'f', text: 'FRONT MARK', short: 'FRONT', u: 18, v: -165, align: 'left', tone: 'amber' },
          { id: 'a', text: 'FLU', u: -82, v: -40, align: 'center' },
          { id: 'b', text: 'FRD', u: 82, v: -40, align: 'center' },
          { id: 'c', text: 'BLD', u: -82, v: 48, align: 'center' },
          { id: 'd', text: 'BRU', u: 82, v: 48, align: 'center' },
          { id: 'n', text: 'FROM ABOVE · LIT = POINTS UP', short: 'FROM ABOVE', u: 0, v: 130, align: 'center', tone: 'muted' },
        ];
  return (
    <SoundCanvas w={w} h={h} box={IMMERSIVE_BOX} label={accessibilityLabel} labels={labels}>
      {kind === 'surround5' ? <SurroundHead /> : <AmbiHead />}
    </SoundCanvas>
  );
}
