/**
 * FRAME M objects, drawn (charter §2 layer 3; §6 look): the measurement
 * family's real equipment for every scene and page of F11–F16 — a small
 * two-way TEST LOUDSPEAKER on its stand, an OMNI TEST SOURCE (the
 * twelve-sided loudspeaker ball) on its stand, the person running the
 * measurement (the shared player figure), the FIELD CALIBRATOR with its
 * coupler and 1/4 in adapter, the MEASUREMENT MIC drawn large for the
 * bench, the POWER boxes, and the operator KEEP-AWAY ring.
 *
 * House look: upper-left light, gradients for form, rim highlights, the
 * palette's quiet greys so nothing competes with the mic, its zones and its
 * readouts. Generic objects only — no maker's likeness, no logos. Sizes are
 * drawing defaults (measureSpec.ts) unless a source gives one. Every path is
 * built once per size (memo); nothing moves by itself.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import type { PlayerPose } from '../players/playerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
export const make = (): SkPath => Skia.Path.Make();
export const rectP = (p: SkPath, x0: number, y0: number, x1: number, y1: number, r = 0): SkPath => {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
};

const EDGE = '#07080a';

/* ── the TEST LOUDSPEAKER: a small two-way box on a stand ── */

/** A two-way test loudspeaker: its front baffle at x = `front`, the box
 *  `depth` deep, between `top` and `bottom` (y) and ±`half` across (z);
 *  woofer and tweeter centres on the baffle (y, radius). The stand: a column
 *  under the box to the floor at `floorY`, on a weighted base. */
export type TestSpeakerGeom = { front: number; depth: number; top: number; bottom: number; half: number; woofer: { y: number; r: number }; tweeter: { y: number; r: number }; floorY: number; z?: number; facing?: 1 | -1; stand?: boolean };

function buildSpeaker(g: TestSpeakerGeom, view: ViewId) {
  const s = g.facing ?? 1;
  const back = g.front - s * g.depth;
  const z0 = g.z ?? 0;
  const box = make();
  if (view === 'side') rectP(box, back, g.top, g.front, g.bottom, 18);
  else rectP(box, back, z0 - g.half, g.front, z0 + g.half, 16);
  // The baffle's edge band (the front panel, a shade lighter).
  const baffle = make();
  if (view === 'side') rectP(baffle, g.front - s * 22, g.top + 4, g.front, g.bottom - 4, 6);
  else rectP(baffle, g.front - s * 22, z0 - g.half + 4, g.front, z0 + g.half - 4, 6);
  // The drivers in profile: each cone's surround and dust cap stands proud of
  // the baffle by a few mm (side view); from above, the same across the width.
  const cones = make();
  const caps = make();
  for (const d of [g.woofer, g.tweeter]) {
    const c = view === 'side' ? d.y : z0;
    const proud = d.r > 40 ? 14 : 8;
    const p = make();
    p.moveTo(g.front, c - d.r);
    p.quadTo(g.front + s * proud * 1.6, c - d.r * 0.85, g.front + s * proud, c - d.r * 0.55);
    p.lineTo(g.front + s * proud * 0.6, c);
    p.lineTo(g.front + s * proud, c + d.r * 0.55);
    p.quadTo(g.front + s * proud * 1.6, c + d.r * 0.85, g.front, c + d.r);
    p.close();
    cones.addPath(p);
    rectP(caps, g.front, c - d.r * 0.32, g.front + s * proud * 1.15, c + d.r * 0.32, d.r * 0.2);
  }
  // A reflex port slot under the woofer (side view) and the stand.
  const port = make();
  if (view === 'side') rectP(port, g.front - s * 4, g.bottom - 46, g.front + s * 3, g.bottom - 22, 4);
  const colX = back + s * (g.depth * 0.5);
  const stand = make();
  const plate = make();
  if (g.stand === false) {
    // no stand: the box alone (an icon)
  } else if (view === 'side') {
    rectP(stand, colX - 26, g.bottom, colX + 26, g.floorY - 26, 6);
    rectP(plate, colX - 190, g.floorY - 26, colX + 190, g.floorY, 8);
  } else {
    rectP(plate, colX - 190, z0 - 170, colX + 190, z0 + 170, 22);
    stand.addCircle(colX, z0, 28);
  }
  return { box, baffle, cones, caps, port, stand, plate };
}

export function TestSpeaker({ g, view }: { g: TestSpeakerGeom; view: ViewId }) {
  const p = useMemo(() => buildSpeaker(g, view), [g, view]);
  const b = p.box.getBounds();
  return (
    <Group>
      {/* the stand first (under the box from above), then the cabinet */}
      <Path path={p.plate}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + b.height * 3)} colors={['#3f434b', '#202227']} />
      </Path>
      <Path path={p.plate} style="stroke" strokeWidth={4} color={EDGE} />
      <Path path={p.stand}>
        <LinearGradient start={vec(b.x, 0)} end={vec(b.x + b.width, 0)} colors={['#9da2ac', '#575b63', '#2b2d32']} />
      </Path>
      <Path path={p.stand} style="stroke" strokeWidth={3} color={EDGE} />
      <Group transform={[{ translateX: -10 }, { translateY: 14 }]}>
        <Path path={p.box} color="#000" opacity={0.45}>
          <BlurMask blur={18} style="normal" />
        </Path>
      </Group>
      <Path path={p.box}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#4b4f58', '#2a2c32', '#16171a']} />
      </Path>
      <Path path={p.baffle}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#5d626c', '#33363d']} />
      </Path>
      <Path path={p.port} color="#050506" />
      <Path path={p.cones}>
        <LinearGradient start={vec(b.x + b.width, b.y)} end={vec(b.x + b.width + 30, b.y + b.height)} colors={['#6b707a', '#2b2e34', '#121316']} />
      </Path>
      <Path path={p.caps}>
        <LinearGradient start={vec(b.x + b.width, b.y)} end={vec(b.x + b.width + 20, b.y + b.height)} colors={['#c3c8d1', '#555963']} />
      </Path>
      <Path path={p.box} style="stroke" strokeWidth={4} color={EDGE} />
      {/* rim light on the upper-left edge */}
      <Path path={p.box} style="stroke" strokeWidth={2} color="#c9cfda" opacity={0.18} />
    </Group>
  );
}

/* ── the OMNI TEST SOURCE: a twelve-sided loudspeaker ball on a stand ── */

/** The ball's centre `c` (u, v in the view), its radius `r`, and (side view)
 *  the floor under its stand. Twelve faces, a driver in each: seen from any
 *  side, a pentagon in the middle ringed by five more and the rim's halves. */
function buildDodeca(cu: number, cv: number, r: number, floorV: number | null) {
  const outline = make();
  const faces = make();
  const drivers = make();
  // The silhouette of a regular dodecahedron seen face-on: a decagon.
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cu + Math.cos(a) * r;
    const y = cv + Math.sin(a) * r;
    if (i === 0) outline.moveTo(x, y);
    else outline.lineTo(x, y);
  }
  outline.close();
  // The front face: a pentagon of circumradius r·0.45, its five neighbours between it and the rim.
  const inner: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    inner.push({ x: cu + Math.cos(a) * r * 0.45, y: cv + Math.sin(a) * r * 0.45 });
  }
  faces.moveTo(inner[0].x, inner[0].y);
  for (let i = 1; i < 5; i++) faces.lineTo(inner[i].x, inner[i].y);
  faces.close();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    faces.moveTo(inner[i].x, inner[i].y);
    faces.lineTo(cu + Math.cos(a) * r, cv + Math.sin(a) * r);
  }
  drivers.addCircle(cu, cv, r * 0.24);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5;
    drivers.addCircle(cu + Math.cos(a) * r * 0.66, cv + Math.sin(a) * r * 0.66, r * 0.17);
  }
  const stand = make();
  if (floorV !== null) {
    rectP(stand, cu - 16, cv + r * 0.9, cu + 16, floorV - 60, 5);
    // a tripod's three legs (two seen from the side)
    stand.moveTo(cu - 12, floorV - 380);
    stand.lineTo(cu - 420, floorV);
    stand.lineTo(cu - 400, floorV);
    stand.lineTo(cu + 4, floorV - 360);
    stand.close();
    stand.moveTo(cu + 12, floorV - 380);
    stand.lineTo(cu + 420, floorV);
    stand.lineTo(cu + 400, floorV);
    stand.lineTo(cu - 4, floorV - 360);
    stand.close();
  } else {
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const leg = make();
      leg.moveTo(cu, cv);
      leg.lineTo(cu + Math.cos(a) * 420, cv + Math.sin(a) * 420);
      stand.addPath(leg);
    }
  }
  return { outline, faces, drivers, stand };
}

export function OmniSource({ cu, cv, r, floorV }: { cu: number; cv: number; r: number; floorV: number | null }) {
  const p = useMemo(() => buildDodeca(cu, cv, r, floorV), [cu, cv, r, floorV]);
  return (
    <Group>
      {floorV !== null ? (
        <Path path={p.stand}>
          <LinearGradient start={vec(cu - 200, 0)} end={vec(cu + 200, 0)} colors={['#a0a5ae', '#4f535b', '#24262b']} />
        </Path>
      ) : (
        <Path path={p.stand} style="stroke" strokeWidth={22} strokeCap="round" color="#3a3d44" />
      )}
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.14 }]}>
        <Path path={p.outline} color="#000" opacity={0.5}>
          <BlurMask blur={r * 0.16} style="normal" />
        </Path>
      </Group>
      <Path path={p.outline}>
        <RadialGradient c={vec(cu - r * 0.35, cv - r * 0.4)} r={r * 1.5} colors={['#6a6f79', '#33363d', '#141518']} />
      </Path>
      <Path path={p.faces} style="stroke" strokeWidth={Math.max(2, r * 0.03)} color="#0b0c0e" opacity={0.9} />
      <Path path={p.drivers}>
        <RadialGradient c={vec(cu - r * 0.2, cv - r * 0.25)} r={r} colors={['#8d929b', '#3a3d44', '#1a1b1f']} />
      </Path>
      <Path path={p.drivers} style="stroke" strokeWidth={Math.max(1.5, r * 0.02)} color="#08080a" />
      <Path path={p.outline} style="stroke" strokeWidth={Math.max(2.5, r * 0.035)} color={EDGE} />
      <Circle cx={cu - r * 0.42} cy={cv - r * 0.48} r={r * 0.18} color="#ffffff" opacity={0.12}>
        <BlurMask blur={r * 0.12} style="normal" />
      </Circle>
    </Group>
  );
}

/* ── the person running the measurement ── */

export function Operator({ pose, dim = 0.9 }: { pose: PlayerPose; dim?: number }) {
  return (
    <Group>
      <PlayerBehind pose={pose} dim={dim} />
      <PlayerInFront pose={pose} dim={dim} hands={pose.view !== 'above'} />
    </Group>
  );
}

/* ── the KEEP-AWAY ring about a capsule (a drawing default radius) ── */

export function KeepAwayRing({ cu, cv, r, ok, px }: { cu: number; cv: number; r: number; ok: boolean; px: number }) {
  return (
    <Group>
      <Circle cx={cu} cy={cv} r={r} color={ok ? '#5bff85' : '#ff6b5e'} opacity={0.06} />
      <Circle cx={cu} cy={cv} r={r} style="stroke" strokeWidth={2 * px} color={ok ? '#5bff85' : '#ff6b5e'} opacity={0.8}>
        <DashPathEffect intervals={[8 * px, 6 * px]} />
      </Circle>
    </Group>
  );
}

/* ── the FIELD CALIBRATOR, its coupler cavity, and the 1/4 in adapter ── */

/** The calibrator body drawn on its axis along +x from its coupler mouth at
 *  (x0, cy): `len` long, `dia` across; `adapter` adds the 1/4 in sleeve in
 *  the mouth; `seated` = how far the capsule sits in (mm, for the cut-away). */
function buildCalibrator(x0: number, cy: number, len: number, dia: number, adapter: boolean) {
  const r = dia / 2;
  const body = make();
  rectP(body, x0, cy - r, x0 + len, cy + r, r * 0.35);
  const cavity = make();
  rectP(cavity, x0 - 1, cy - r * 0.32, x0 + len * 0.28, cy + r * 0.32, 3);
  const ring = make();
  rectP(ring, x0 + len * 0.3, cy - r * 1.02, x0 + len * 0.36, cy + r * 1.02, 3);
  const key = make();
  rectP(key, x0 + len * 0.55, cy - r * 0.55, x0 + len * 0.78, cy - r * 0.2, 4);
  const led = { x: x0 + len * 0.86, y: cy - r * 0.38 };
  const sleeve = make();
  if (adapter) {
    rectP(sleeve, x0 - 2, cy - r * 0.32, x0 + len * 0.22, cy - r * 0.14, 2);
    rectP(sleeve, x0 - 2, cy + r * 0.14, x0 + len * 0.22, cy + r * 0.32, 2);
  }
  return { body, cavity, ring, key, led, sleeve, r };
}

export function Calibrator({ x0, cy, len, dia, adapter, lit, levelDb }: { x0: number; cy: number; len: number; dia: number; adapter: boolean; lit: boolean; levelDb: number }) {
  const p = useMemo(() => buildCalibrator(x0, cy, len, dia, adapter), [x0, cy, len, dia, adapter]);
  return (
    <Group>
      <Group transform={[{ translateX: -4 }, { translateY: 6 }]}>
        <Path path={p.body} color="#000" opacity={0.45}>
          <BlurMask blur={6} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={vec(0, cy - p.r)} end={vec(0, cy + p.r)} colors={['#3c4f68', '#24324a', '#121a27']} />
      </Path>
      <Path path={p.ring}>
        <LinearGradient start={vec(0, cy - p.r)} end={vec(0, cy + p.r)} colors={['#d9dde4', '#7e838d', '#2d3036']} />
      </Path>
      <Path path={p.cavity} color="#050608" />
      {adapter ? (
        <Path path={p.sleeve}>
          <LinearGradient start={vec(0, cy - p.r)} end={vec(0, cy + p.r)} colors={['#e6c77a', '#8a6b2a']} />
        </Path>
      ) : null}
      <Path path={p.key}>
        <LinearGradient start={vec(0, cy - p.r)} end={vec(0, cy)} colors={['#8e939c', '#454950']} />
      </Path>
      <Circle cx={p.led.x} cy={p.led.y} r={2.4} color={lit ? '#5bff85' : '#20302a'} />
      {lit ? (
        <Circle cx={p.led.x} cy={p.led.y} r={5} color="#5bff85" opacity={0.35}>
          <BlurMask blur={3} style="normal" />
        </Circle>
      ) : null}
      <Path path={p.body} style="stroke" strokeWidth={1.4} color={EDGE} />
      <Path path={p.body} style="stroke" strokeWidth={0.8} color="#b8c6dc" opacity={0.25} />
      {/* the level selector's two marks (94 / 114): the chosen one lit */}
      <Circle cx={x0 + len * 0.62} cy={cy + p.r * 0.45} r={2} color={levelDb === 94 ? '#ffc64d' : '#5c6068'} />
      <Circle cx={x0 + len * 0.72} cy={cy + p.r * 0.45} r={2} color={levelDb === 114 ? '#ffc64d' : '#5c6068'} />
    </Group>
  );
}

/* ── a measurement chain's boxes: polarization supply, constant-current
 *    conditioner, a mic input with phantom power, an analyzer ── */

export type BoxKind = 'polarization' | 'ccp' | 'phantom' | 'analyzer' | 'recorder' | 'meter';

function buildBox(kind: BoxKind, x: number, y: number, w: number, h: number) {
  const face = make();
  rectP(face, x, y, x + w, y + h, Math.min(w, h) * 0.08);
  const jacks = make();
  const knobs = make();
  const screen = make();
  const leds: { x: number; y: number }[] = [];
  if (kind === 'analyzer' || kind === 'recorder' || kind === 'meter') {
    rectP(screen, x + w * 0.1, y + h * 0.12, x + w * 0.9, y + h * 0.58, 3);
    for (const k of [0.25, 0.5, 0.75]) knobs.addCircle(x + w * k, y + h * 0.78, Math.min(w, h) * 0.07);
  } else {
    for (const k of [0.28, 0.72]) jacks.addCircle(x + w * k, y + h * 0.62, Math.min(w, h) * 0.12);
    knobs.addCircle(x + w * 0.5, y + h * 0.32, Math.min(w, h) * 0.1);
    leds.push({ x: x + w * 0.16, y: y + h * 0.24 });
  }
  return { face, jacks, knobs, screen, leds };
}

/** One piece of chain equipment, face-on (the chain rack's display). */
export function ChainBox({ kind, x, y, w, h, tint }: { kind: BoxKind; x: number; y: number; w: number; h: number; tint?: string }) {
  const p = useMemo(() => buildBox(kind, x, y, w, h), [kind, x, y, w, h]);
  const body = kind === 'phantom' ? ['#3d3f46', '#26282d'] : kind === 'polarization' ? ['#41505f', '#253039'] : kind === 'ccp' ? ['#4a4a3e', '#2b2b24'] : ['#33373f', '#1b1d22'];
  return (
    <Group>
      <Group transform={[{ translateX: -3 }, { translateY: 5 }]}>
        <Path path={p.face} color="#000" opacity={0.45}>
          <BlurMask blur={5} style="normal" />
        </Path>
      </Group>
      <Path path={p.face}>
        <LinearGradient start={vec(x, y)} end={vec(x + w * 0.4, y + h)} colors={body} />
      </Path>
      <Path path={p.screen} color="#0c1214" />
      <Path path={p.jacks}>
        <RadialGradient c={vec(x + w * 0.4, y + h * 0.55)} r={w * 0.5} colors={['#c7ccd4', '#5a5e66']} />
      </Path>
      <Path path={p.jacks} style="stroke" strokeWidth={1} color={EDGE} />
      <Path path={p.knobs}>
        <RadialGradient c={vec(x + w * 0.4, y + h * 0.3)} r={w * 0.5} colors={['#a9aeb7', '#3e4148']} />
      </Path>
      {p.leds.map((l) => (
        <Circle key={`${l.x}`} cx={l.x} cy={l.y} r={2.2} color={tint ?? '#5bff85'} />
      ))}
      <Path path={p.face} style="stroke" strokeWidth={1.4} color={tint ?? EDGE} opacity={tint ? 0.9 : 1} />
    </Group>
  );
}
