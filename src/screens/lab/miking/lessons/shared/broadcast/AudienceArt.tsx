/**
 * THE AUDIENCE VENUE — the look (Lab 7 group 3; B08). Real objects lit from
 * the upper left; the venue plan itself is Lab 7b group 2's (shared/sports/
 * VenueArt — a section drawn as seats without people). Static (D8).
 *
 *   CoverageWedge   a PA cluster's coverage on the plan: a soft wedge from
 *                   the cabinet into the audience — a simplified picture of
 *                   where it is aimed, never a measured dispersion.
 *   PatternLobe     a pattern's shape round a mic, white dashed (the Field
 *                   Reporter's LobeTop look): a shape, never a range.
 *   nearSeatSide    the corner box of ONE PERSON OR THE CROWD: the plan cannot
 *                   show height, so the same mic from the side, over the rows.
 *   paAngleSide     the corner box of FACES, NOT THE PA: the mic's height, tilt
 *                   and pattern from the side, the PA opened out to one side
 *                   and the section to the other. Read-only; seats and heads
 *                   stay simple.
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
import { Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import type { PatternId } from '../../../engine/model/types.ts';
import { gain } from '../../../engine/physics/polar.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { Aim, Dim, type FieldInset } from '../field/FieldStage';
import { SoundCanvas } from '../smallperc/soundKit';
import { PlanPath } from '../sports/VenueArt';
import { MM, dirFromDeg, fmtM1, planUV, type P2 } from '../sports/venuePlan.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const SEAT = '#5a6474';
const HEAD = '#c9ced6';

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

/** A pattern's shape round (u, v), its front along the screen angle `dir`
 *  (radians): the Field Reporter's dashed shape (reporterPages LobeTop). */
export function PatternLobe({ u, v, dir, pattern, r, px }: { u: number; v: number; dir: number; pattern: PatternId; r: number; px: number }) {
  const p = useMemo(() => {
    const path = make();
    for (let k = 0; k <= 72; k++) {
      const th = (k / 72) * Math.PI * 2;
      const g = Math.abs(gain(pattern, (th * 180) / Math.PI));
      const x = u + Math.cos(dir + th) * g * r;
      const y = v + Math.sin(dir + th) * g * r;
      if (k === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.close();
    return path;
  }, [u, v, dir, pattern, r]);
  return (
    <Group>
      <Path path={p} color="#e8eef5" opacity={0.08} />
      <Path path={p} style="stroke" strokeWidth={1.6 * px} color="#e8eef5" opacity={0.75}>
        <DashPathEffect intervals={[6 * px, 4 * px]} />
      </Path>
    </Group>
  );
}

/* ── the side views (u = metres out, in mm; v = −height; the floor at v = 0) ── */

function SideFloor({ u0, u1 }: { u0: number; u1: number }) {
  return <RoundedRect x={u0} y={0} width={u1 - u0} height={1500} r={0} color="#343840" />;
}

/** One row of seats from the side, a plain head at the faces' height. */
function SideRow({ u, faceMm, px }: { u: number; faceMm: number; px: number }) {
  const w = Math.max(120, 1.4 * px);
  return (
    <Group>
      <RoundedRect x={u - 260} y={-900} width={w} height={900} r={w / 2} color={SEAT} />
      <RoundedRect x={u - 260} y={-500} width={Math.max(420, 4 * px)} height={w} r={w / 2} color={SEAT} />
      <Circle cx={u} cy={-faceMm} r={Math.max(140, 2.2 * px)} color={HEAD} />
    </Group>
  );
}

/** The real pencil mic from the side, enlarged to read in a corner box. */
function SideMic({ u, hMm, ang, px }: { u: number; hMm: number; ang: number; px: number }) {
  return (
    <Group transform={[{ translateX: u }, { translateY: -hMm }, { rotate: ang + Math.PI / 2 }, { scale: (20 * px) / 104 }]}>
      <MikingMicArt art="sdc" r={10.5} len={104} />
    </Group>
  );
}

/** ONE PERSON OR THE CROWD from the side: the mic hung from the bar over the
 *  rows, its height, and the same red and amber paths as the plan. Metres in;
 *  `y` = how far out from the stage's edge. */
export function nearSeatSide({ y, h, nearY, midY, faceH, pattern, at }: { y: number; h: number; nearY: number; midY: number; faceH: number; pattern: PatternId; at: FieldInset['at'] }): FieldInset {
  const U = y * MM;
  const H = h * MM;
  const faceMm = faceH * MM;
  const ang = Math.atan2(-(faceH - h), midY - y);
  // The nearest seat and the middle of the section are both on a row.
  const rows = Array.from({ length: 7 }, (_, i) => (nearY + (i * (midY - nearY)) / 3) * MM);
  return {
    view: 'side',
    box: { u0: -800, u1: 6400, v0: -5400, v1: 800 },
    at,
    draw: (px) => (
      <Group>
        <SideFloor u0={-800} u1={6400} />
        <RoundedRect x={-800} y={-700} width={800} height={700} r={0} color="#4a4238" />
        {rows.map((u) => (
          <SideRow key={u} u={u} faceMm={faceMm} px={px} />
        ))}
        <RoundedRect x={1000} y={-5100} width={1200} height={Math.max(100, 3 * px)} r={Math.max(50, 1.5 * px)} color="#8a909b" />
        <PlanPath a={{ x: y, y: 5.05 }} b={{ x: y, y: h }} px={px} color="#8a909b" width={1.4} />
        <PatternLobe u={U} v={-H} dir={ang} pattern={pattern} r={1900} px={px} />
        <PlanPath a={{ x: midY, y: faceH }} b={{ x: y, y: h }} px={px} color={AMBER} width={2} />
        <PlanPath a={{ x: nearY, y: faceH }} b={{ x: y, y: h }} px={px} color={RED} width={2.6} />
        <Circle cx={nearY * MM} cy={-faceMm} r={6 * px} style="stroke" strokeWidth={2 * px} color={RED} />
        <Circle cx={midY * MM} cy={-faceMm} r={6 * px} style="stroke" strokeWidth={2 * px} color={AMBER} />
        <Dim a={{ u: U - 420, v: 0 }} b={{ u: U - 420, v: -H }} px={px} />
        <SideMic u={U} hMm={H} ang={ang} px={px} />
      </Group>
    ),
    labels: [
      { id: 'sv', text: 'FROM THE SIDE', short: 'SIDE', u: 3700, v: 420, align: 'center', tone: 'muted' },
      { id: 'h', text: fmtM1(h), u: U - 560, v: -H / 2 - 150, align: 'right' },
    ],
  };
}

/** FACES, NOT THE PA from the side: the mic on the floor line at u = 0, the
 *  PA opened out to the left and the section to the right (each at its true
 *  plan distance from the mic), the tilt and the pattern on the mic. TURN is
 *  the plan's. Metres in. */
export function paAngleSide({ hMic, rPa, hPa, rFaces, faceH, aimRun, aimRise, pattern, at }: { hMic: number; rPa: number; hPa: number; rFaces: number; faceH: number; aimRun: number; aimRise: number; pattern: PatternId; at: FieldInset['at'] }): FieldInset {
  const H = hMic * MM;
  const uPa = -rPa * MM;
  const uF = rFaces * MM;
  const faceMm = faceH * MM;
  const ang = Math.atan2(-aimRise, aimRun);
  const u0 = Math.min(uPa - 1400, -3900);
  const u1 = uF + 3400;
  const rows = Array.from({ length: 9 }, (_, i) => uF + (i - 5) * 1000);
  return {
    view: 'side',
    box: { u0, u1, v0: -8300, v1: 700 },
    at,
    draw: (px) => (
      <Group>
        <SideFloor u0={u0} u1={u1} />
        {rows.map((u) => (
          <SideRow key={u} u={u} faceMm={faceMm} px={px} />
        ))}
        <RoundedRect x={uPa - 450} y={-hPa * MM - 800} width={900} height={1600} r={140} color="#2a2d33" />
        <RoundedRect x={uPa - 450} y={-hPa * MM - 800} width={900} height={1600} r={140} style="stroke" strokeWidth={1.4 * px} color="#ff8a5c" />
        <PlanPath a={{ x: 0, y: 0 }} b={{ x: 0, y: hMic }} px={px} color="#8a909b" width={1.6} />
        <PlanPath a={{ x: -rPa, y: hPa }} b={{ x: 0, y: hMic }} px={px} color={RED} width={2.2} />
        <Aim from={{ u: 0, v: -H }} dir={{ u: Math.cos(ang), v: Math.sin(ang) }} len={4700} px={px} />
        <Circle cx={uF} cy={-faceMm} r={6 * px} style="stroke" strokeWidth={2 * px} color={AMBER} />
        <Dim a={{ u: -520, v: 0 }} b={{ u: -520, v: -H }} px={px} />
        <SideMic u={0} hMm={H} ang={ang} px={px} />
        <PatternLobe u={0} v={-H} dir={ang} pattern={pattern} r={3400} px={px} />
      </Group>
    ),
    labels: [
      { id: 'p', text: `SIDE · ${pattern === 'supercardioid' ? 'SUPERCARDIOID' : 'CARDIOID'}`, short: pattern === 'supercardioid' ? 'SUPER' : 'CARD', u: u0 + (u1 - u0) * 0.62, v: -7700, align: 'center', tone: 'muted' },
      { id: 'pa', text: 'PA', u: uPa - 350, v: -hPa * MM + 1450, align: 'center', tone: 'muted' },
      { id: 'f', text: 'FACES', u: uF, v: -2700, align: 'center', tone: 'amber' },
      { id: 'h', text: fmtM1(hMic), u: -640, v: -H / 2 - 300, align: 'right' },
    ],
  };
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
          { id: 'L', text: 'L', u: -128, v: -70, align: 'center' },
          { id: 'C', text: 'C', u: 24, v: -66, align: 'left' },
          { id: 'R', text: 'R', u: 128, v: -70, align: 'center' },
          { id: 'Ls', text: 'Ls', u: -96, v: 108, align: 'center' },
          { id: 'Rs', text: 'Rs', u: 96, v: 108, align: 'center' },
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
