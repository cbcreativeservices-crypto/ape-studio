/**
 * THE SHARED CYMBAL FAMILY — the look (charter §2 layer 3), drawn from
 * cymbalSpec.ts at the Kick's illustration standard: bronze gradients for
 * form, light from the upper left, a rim highlight, the lathing (tone
 * grooves) as fine alternating rings, soft contact shadows, chrome hardware.
 *
 *   CymbalSide      the plate's profile from the side (bow rising to the bell,
 *                   the bell hollow underneath), tilted on its stand, with the
 *                   mounting stack: tilter, bottom felt, sleeve, top felt,
 *                   wing nut.
 *   CymbalTop       from above: lathed bronze (an ellipse when tilted), the
 *                   bell, the felt and the wing nut; optional bell / bow / edge
 *                   rings for naming the playing areas.
 *   BoomStandSide / BoomStandTop   a boom cymbal stand: tripod, two-stage tube,
 *                   height clutch, boom joint, boom with its counterweight.
 *   HiHatSide / HiHatTop   the pair (closed or open), clutch and pull rod, seat,
 *                   two-stage stand, tripod and pedal.
 *   SwingEnvelope   the ± swing at the edge a mic keeps clear of (side view).
 *   CymbalModeFace  a cymbal face-on in one vibration shape (HOW IT SOUNDS):
 *                   blue + / amber − bands, the still lines, the stick's spot.
 *
 * Rules kept (the kick's): nothing here moves by itself (D8 — CymbalModeFace's
 * swing is a value the learner drags); every static path is built ONCE per
 * spec and option and cached at module scope; no brand mark or logo; the
 * hardware sizes are drawing defaults and stay where the spec puts them.
 * All coordinates are millimetres of the view's (u, v).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { useKeepOutsAtRest } from '../../../engine/scene/keepOuts.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { KIT, KIT_FLOOR_Y } from '../kitPlanModel.ts';
import {
  BOOM_STAND,
  CYMBAL_HARDWARE as HW,
  CYMBAL_SWING,
  HIHAT_HARDWARE as HH,
  KIT_PLACED_CYMBALS,
  boomStandPoints,
  cymbalAreas,
  hihatStandPoints,
  surfaceHeight,
  type CymbalSpec,
} from './cymbalSpec.ts';
import { cymbalShapeAt, cymbalShapePeak, cymbalStillDiameters, cymbalStillRings, type CymbalShape } from './cymbalModes.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const DEG = Math.PI / 180;

/* ── palette ── */
const INK = '#08080a';
/** Cast bronze, lit from the upper left (a B20-style warm gold; cosmetic). */
const BRONZE = ['#fbe3a6', '#e2b25c', '#b9852f', '#80561a', '#4f3410'];
const BRONZE_EDGE = '#5e3e12';
/** A darker bronze for the face-on shapes (bands drawn over it). */
const BRONZE_MUTED = ['#8a7552', '#6a5638', '#4a3a24', '#2e2416'];
const BELL = ['#fff3cf', '#efc677', '#b6842f', '#6e4914'];
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
const FELT = ['#4a3b52', '#2a2230', '#17121b'];
export const CYMBAL_PALETTE = { BRONZE, BELL, CHROME } as const;

const make = () => Skia.Path.Make();
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number) {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}

/* ═════════════════════════ SIDE: the plate and its mounting ═════════════════════════ */

function buildSide(spec: CymbalSpec, inverted: boolean) {
  const R = spec.d.mm / 2;
  const T = spec.drawT.mm;
  const rise = spec.rise.mm;
  const sgn = inverted ? 1 : -1; // up the screen is −y for a cymbal face-up
  const N = 72;
  // The plate: the top surface across, then the underside back (offset by
  // the drawn thickness; the bell is hollow underneath).
  const plate = make();
  for (let i = 0; i <= N; i++) {
    const x = -R + (2 * R * i) / N;
    const y = sgn * surfaceHeight(spec, x);
    if (i === 0) plate.moveTo(x, y);
    else plate.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const x = -R + (2 * R * i) / N;
    plate.lineTo(x, sgn * (surfaceHeight(spec, x) - T));
  }
  plate.close();
  // The upper-left rim light along the top surface (left half), and a fainter
  // sheen across the bell.
  const rim = make();
  for (let i = 0; i <= N / 2; i++) {
    const x = -R + (R * i) / (N / 2) * 0.96;
    const y = sgn * surfaceHeight(spec, x) + (inverted ? 0.6 : -0.6);
    if (i === 0) rim.moveTo(x, y);
    else rim.lineTo(x, y);
  }
  // Lathing seen edge-on: faint ticks along the bow (light catching the grooves).
  const lathe = make();
  const bellR = spec.bellD.mm / 2;
  for (let x = -R + 9; x < R - 6; x += 9) {
    if (Math.abs(x) < bellR) continue;
    const y = sgn * surfaceHeight(spec, x);
    seg(lathe, x, y - sgn * 0.2, x, y - sgn * (T - 0.6));
  }
  return { plate, rim, lathe, R, rise, T };
}

const sideCache = new Map<string, ReturnType<typeof buildSide>>();
function sidePaths(spec: CymbalSpec, inverted = false) {
  const key = `${spec.id}:${inverted ? 1 : 0}`;
  let p = sideCache.get(key);
  if (!p) {
    p = buildSide(spec, inverted);
    sideCache.set(key, p);
  }
  return p;
}

/** The mounting stack on a cymbal stand's tilter, local to the cymbal (the
 *  edge plane at y = 0, its normal up the screen). */
function buildMount(spec: CymbalSpec) {
  const rise = spec.rise.mm;
  const T = spec.drawT.mm;
  const fT = HW.feltT.mm;
  const fR = HW.feltD.mm / 2;
  const sl = HW.sleeve.mm / 2;
  const bellTop = -rise;
  const under = bellTop + T; // the underside of the bell's top
  const top = rrect(make(), -fR, bellTop - fT, fR, bellTop, 2.5);
  const bottom = rrect(make(), -fR, under, fR, under + fT, 2.5);
  const sleeve = rrect(make(), -sl, bellTop - fT - 3, sl, under + fT + 2, 1.5);
  const rod = rrect(make(), -HW.rod.mm / 2, bellTop - fT - HW.wingH.mm - 6, HW.rod.mm / 2, under + fT + HW.tilterH.mm, 1);
  const tilter = rrect(make(), -HW.tilterD.mm / 2, under + fT, HW.tilterD.mm / 2, under + fT + HW.tilterH.mm, 4);
  // The wing nut: a hub with two rounded wings.
  const w = HW.wingW.mm / 2;
  const wy = bellTop - fT;
  const wing = make();
  wing.moveTo(-5, wy);
  wing.cubicTo(-w, wy - 2, -w - 2, wy - HW.wingH.mm, -w * 0.55, wy - HW.wingH.mm);
  wing.cubicTo(-w * 0.3, wy - HW.wingH.mm, -6, wy - HW.wingH.mm * 0.45, -5, wy - 6);
  wing.lineTo(5, wy - 6);
  wing.cubicTo(6, wy - HW.wingH.mm * 0.45, w * 0.3, wy - HW.wingH.mm, w * 0.55, wy - HW.wingH.mm);
  wing.cubicTo(w + 2, wy - HW.wingH.mm, w, wy - 2, 5, wy);
  wing.close();
  return { top, bottom, sleeve, rod, tilter, wing, tilterBottom: under + fT + HW.tilterH.mm };
}
const mountCache = new Map<string, ReturnType<typeof buildMount>>();

/** The plate alone (local: edge plane at y = 0, face up the screen). */
function Plate({ spec, inverted = false }: { spec: CymbalSpec; inverted?: boolean }) {
  const g = sidePaths(spec, inverted);
  const R = g.R;
  return (
    <>
      <Path path={g.plate}>
        <LinearGradient start={vec(-R, -g.rise)} end={vec(R, g.rise * 0.4)} colors={BRONZE} positions={[0, 0.22, 0.5, 0.78, 1]} />
      </Path>
      <Path path={g.lathe} style="stroke" strokeWidth={0.7} color="#fff1c6" opacity={0.28} />
      <Path path={g.rim} style="stroke" strokeWidth={1.1} color="#fff6dc" opacity={0.75} />
      <Path path={g.plate} style="stroke" strokeWidth={0.9} color={BRONZE_EDGE} />
    </>
  );
}

/**
 * A cymbal from the side on its stand's tilter: the edge-plane centre at
 * (cx, cy), tilted `tiltDeg` toward the drummer. `mount` draws the felts,
 * sleeve, wing nut and tilter.
 */
export function CymbalSide({ spec, cx, cy, tiltDeg, mount = true, plate = true, dim = 1 }: { spec: CymbalSpec; cx: number; cy: number; tiltDeg: number; mount?: boolean; plate?: boolean; dim?: number }) {
  let m = mountCache.get(spec.id);
  if (!m) {
    m = buildMount(spec);
    mountCache.set(spec.id, m);
  }
  return (
    <Group opacity={dim} transform={[{ translateX: cx }, { translateY: cy }, { rotate: -tiltDeg * DEG }]}>
      {mount ? (
        <>
          <Path path={m.rod} color="#6c717c" />
          <Path path={m.tilter}>
            <LinearGradient start={vec(-HW.tilterD.mm / 2, 0)} end={vec(HW.tilterD.mm / 2, 0)} colors={CHROME} />
          </Path>
          <Path path={m.tilter} style="stroke" strokeWidth={0.7} color={INK} />
          <Path path={m.bottom}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 12)} colors={FELT} />
          </Path>
        </>
      ) : null}
      {plate ? <Plate spec={spec} /> : null}
      {mount ? (
        <>
          <Path path={m.sleeve} color="#d8dbe0" opacity={0.9} />
          <Path path={m.top}>
            <LinearGradient start={vec(0, -spec.rise.mm - 10)} end={vec(0, -spec.rise.mm)} colors={FELT} />
          </Path>
          <Path path={m.wing}>
            <LinearGradient start={vec(-HW.wingW.mm / 2, 0)} end={vec(HW.wingW.mm / 2, 0)} colors={CHROME} />
          </Path>
          <Path path={m.wing} style="stroke" strokeWidth={0.7} color={INK} />
        </>
      ) : null}
    </Group>
  );
}

/** The swing a struck cymbal makes on its felts (side view): the plate's
 *  outline rocked ± the swing at the edge, as a translucent fan — the space
 *  a mic keeps clear of. */
export function SwingEnvelope({ spec, cx, cy, tiltDeg }: { spec: CymbalSpec; cx: number; cy: number; tiltDeg: number }) {
  const R = spec.d.mm / 2;
  const ang = Math.atan2(CYMBAL_SWING.mm, R) / DEG;
  const fan = useMemo(() => {
    const p = make();
    // Each half of the plate sweeps a thin wedge about the centre.
    for (const s of [-1, 1]) {
      p.moveTo(0, 0);
      p.lineTo(s * R * Math.cos(ang * DEG), -R * Math.sin(ang * DEG) - spec.rise.mm * 0.2);
      p.lineTo(s * R * Math.cos(ang * DEG), R * Math.sin(ang * DEG));
      p.close();
    }
    return p;
  }, [R, ang, spec.rise.mm]);
  // Not at rest in the placement scene (keepOuts.ts, owner ruling 2026-10-05).
  const keep = useKeepOutsAtRest();
  if (!keep) return null;
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: -tiltDeg * DEG }]}>
      <Path path={fan} color="#8a8f9c" opacity={0.16} />
      <Path path={fan} style="stroke" strokeWidth={1.6} color="#8a8f9c" opacity={0.55}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
    </Group>
  );
}

/* ═════════════════════════ TOP: lathed bronze from above ═════════════════════════ */

function buildTop(spec: CymbalSpec, tiltDeg: number) {
  const R = spec.d.mm / 2;
  const ct = Math.cos(tiltDeg * DEG);
  const bellR = spec.bellD.mm / 2;
  const disc = oval(make(), 0, 0, R * ct, R);
  // Lathing: fine rings, alternately catching and losing the light.
  const ringsLight = make();
  const ringsDark = make();
  let k = 0;
  for (let q = bellR + 4; q < R - 3; q += 5.5) {
    oval(k % 2 ? ringsDark : ringsLight, 0, 0, q * ct, q);
    k++;
  }
  const bell = oval(make(), 0, 0, bellR * ct, bellR);
  const bellRings = make();
  for (let q = 8; q < bellR - 3; q += 6) oval(bellRings, 0, 0, q * ct, q);
  // The wing nut from above: a hub and two wings across.
  const w = HW.wingW.mm / 2;
  const wing = make();
  rrect(wing, -w, -6, w, 6, 6);
  const felt = oval(make(), 0, 0, (HW.feltD.mm / 2) * ct, HW.feltD.mm / 2);
  return { R, ct, bellR, disc, ringsLight, ringsDark, bell, bellRings, wing, felt };
}
const topCache = new Map<string, ReturnType<typeof buildTop>>();
function topPaths(spec: CymbalSpec, tiltDeg: number) {
  const key = `${spec.id}:${tiltDeg}`;
  let p = topCache.get(key);
  if (!p) {
    p = buildTop(spec, tiltDeg);
    topCache.set(key, p);
  }
  return p;
}

/**
 * A cymbal from above at (cx, cz): lathed bronze, the bell, the felt and the
 * wing nut. `areas` rings the bell, bow and edge (for naming them);
 * `highlight` rings the whole cymbal in amber; `dim` < 1 lets the drums below
 * show through (a cymbal hangs over them).
 */
export function CymbalTop({ spec, cx, cz, tiltDeg, highlight = false, dim = 1, areas = false, mount = true }: { spec: CymbalSpec; cx: number; cz: number; tiltDeg: number; highlight?: boolean; dim?: number; areas?: boolean; mount?: boolean }) {
  const g = topPaths(spec, tiltDeg);
  const { R, ct, bellR } = g;
  const a = cymbalAreas(spec);
  return (
    <Group transform={[{ translateX: cx }, { translateY: cz }]}>
      <Group opacity={dim}>
        <Group transform={[{ translateX: 16 }, { translateY: 22 }]}>
          <Path path={g.disc} color="#000" opacity={0.42}>
            <BlurMask blur={18} style="normal" />
          </Path>
        </Group>
        <Path path={g.disc}>
          <RadialGradient c={vec(-R * 0.38 * ct, -R * 0.42)} r={R * 1.75} colors={BRONZE} positions={[0, 0.2, 0.48, 0.78, 1]} />
        </Path>
        {/* the lathe's light: a sweep of brighter grooves toward the upper left */}
        <Path path={g.disc} opacity={0.5}>
          <SweepGradient c={vec(0, 0)} colors={['rgba(255,244,214,0)', 'rgba(255,244,214,0.55)', 'rgba(255,244,214,0)', 'rgba(255,244,214,0)', 'rgba(255,244,214,0.3)', 'rgba(255,244,214,0)']} positions={[0, 0.16, 0.3, 0.62, 0.7, 0.8]} />
        </Path>
        <Path path={g.ringsLight} style="stroke" strokeWidth={1.4} color="#fff0c4" opacity={0.2} />
        <Path path={g.ringsDark} style="stroke" strokeWidth={1.4} color="#4f3410" opacity={0.28} />
        <Path path={g.bell}>
          <RadialGradient c={vec(-bellR * 0.35 * ct, -bellR * 0.4)} r={bellR * 1.5} colors={BELL} />
        </Path>
        <Path path={g.bellRings} style="stroke" strokeWidth={1} color="#6e4914" opacity={0.3} />
        <Path path={g.bell} style="stroke" strokeWidth={1.5} color={BRONZE_EDGE} opacity={0.6} />
        {mount ? (
          <>
            <Path path={g.felt} color="#2a2230" />
            <Path path={g.wing}>
              <LinearGradient start={vec(-HW.wingW.mm / 2, -6)} end={vec(HW.wingW.mm / 2, 6)} colors={CHROME} />
            </Path>
            <Circle cx={0} cy={0} r={7} color="#c8ccd4" />
            <Circle cx={0} cy={0} r={7} style="stroke" strokeWidth={1} color={INK} />
          </>
        ) : (
          <Circle cx={0} cy={0} r={HW.hole.mm / 2} color="#140d05" />
        )}
        {/* the rim: a dark outer edge with a light catch on the upper left */}
        <Path path={g.disc} style="stroke" strokeWidth={3} color={BRONZE_EDGE} />
        <Group clip={g.disc}>
          <Circle cx={-R * 0.12 * ct} cy={-R * 0.12} r={R} style="stroke" strokeWidth={2.4} color="#fff6dc" opacity={0.35} />
        </Group>
        {areas ? (
          <>
            <Path path={oval(make(), 0, 0, a.bow[1] * ct, a.bow[1])} style="stroke" strokeWidth={3} color="#ffffff" opacity={0.7}>
              <DashPathEffect intervals={[12, 9]} />
            </Path>
            <Path path={oval(make(), 0, 0, a.bell[1] * ct, a.bell[1])} style="stroke" strokeWidth={3} color="#ffffff" opacity={0.7}>
              <DashPathEffect intervals={[12, 9]} />
            </Path>
          </>
        ) : null}
      </Group>
      {highlight ? <Path path={oval(make(), 0, 0, (R + 40) * ct, R + 40)} style="stroke" strokeWidth={9} color="#ffc64d" /> : null}
    </Group>
  );
}

/* ═════════════════════════ STANDS ═════════════════════════ */

/** A tripod from the side: two legs splayed to the floor and the hub. */
function tripodSide(p: SkPath, x: number, floorY: number, reach: number, hubH: number) {
  seg(p, x, floorY - hubH, x - reach, floorY);
  seg(p, x, floorY - hubH, x + reach, floorY);
  seg(p, x, floorY - hubH, x + reach * 0.3, floorY);
  return p;
}

function buildBoomSide(id: 'crash1' | 'crash2' | 'ride') {
  const s = boomStandPoints(id);
  const floorY = KIT_FLOOR_Y;
  const legs = tripodSide(make(), s.foot.x, floorY, BOOM_STAND.legReach.mm + 40, 150);
  const lower = seg(make(), s.foot.x, floorY - 150, s.foot.x, (floorY + s.joint.y) / 2 + 40);
  const upper = seg(make(), s.foot.x, (floorY + s.joint.y) / 2 + 40, s.joint.x, s.joint.y);
  // The boom from the joint to the tilter, and on past the joint to its weight.
  const dx = s.tilter.x - s.joint.x;
  const dy = s.tilter.y - s.joint.y;
  const l = Math.hypot(dx, dy) || 1;
  const back = { x: s.joint.x - (dx / l) * 140, y: s.joint.y - (dy / l) * 140 };
  const boom = seg(make(), back.x, back.y, s.tilter.x, s.tilter.y);
  const clutchY = (floorY + s.joint.y) / 2 + 40;
  return { legs, lower, upper, boom, joint: s.joint, back, clutchY, foot: s.foot };
}
const boomSideCache = new Map<string, ReturnType<typeof buildBoomSide>>();

/** A boom cymbal stand from the side (the kit plan's foot; drawing defaults). */
export function BoomStandSide({ id, dim = 1 }: { id: 'crash1' | 'crash2' | 'ride'; dim?: number }) {
  let g = boomSideCache.get(id);
  if (!g) {
    g = buildBoomSide(id);
    boomSideCache.set(id, g);
  }
  return (
    <Group opacity={dim}>
      <Path path={g.legs} style="stroke" strokeWidth={10} strokeCap="round" color="#1d1e23" />
      <Path path={g.legs} style="stroke" strokeWidth={6} strokeCap="round" color="#8a8f99" />
      <Path path={g.lower} style="stroke" strokeWidth={BOOM_STAND.tube.mm + 4} strokeCap="round" color="#16171b" />
      <Path path={g.lower} style="stroke" strokeWidth={BOOM_STAND.tube.mm} strokeCap="round" color="#7d828d" />
      <Path path={g.upper} style="stroke" strokeWidth={BOOM_STAND.tube.mm - 2} strokeCap="round" color="#16171b" />
      <Path path={g.upper} style="stroke" strokeWidth={BOOM_STAND.tube.mm - 7} strokeCap="round" color="#aeb3bd" />
      <Group transform={[{ translateX: -2 }, { translateY: 0 }]}>
        <Path path={g.upper} style="stroke" strokeWidth={2.2} strokeCap="round" color="#eef1f6" opacity={0.55} />
      </Group>
      <Path path={g.boom} style="stroke" strokeWidth={BOOM_STAND.boom.mm + 3} strokeCap="round" color="#16171b" />
      <Path path={g.boom} style="stroke" strokeWidth={BOOM_STAND.boom.mm - 3} strokeCap="round" color="#9aa0ab" />
      {/* the counterweight on the boom's back end */}
      <Circle cx={g.back.x} cy={g.back.y} r={BOOM_STAND.counterweight.mm / 2}>
        <RadialGradient c={vec(g.back.x - 8, g.back.y - 8)} r={BOOM_STAND.counterweight.mm * 0.7} colors={['#6c717c', '#2a2c32', '#121317']} />
      </Circle>
      {/* height clutch and the boom joint */}
      <Circle cx={g.foot.x} cy={g.clutchY} r={12} color="#16171b" />
      <Circle cx={g.foot.x} cy={g.clutchY} r={12} style="stroke" strokeWidth={2} color="#9aa0ab" />
      <Circle cx={g.joint.x} cy={g.joint.y} r={16}>
        <RadialGradient c={vec(g.joint.x - 5, g.joint.y - 5)} r={20} colors={['#eef1f6', '#7d828d', '#2a2c32']} />
      </Circle>
      <Circle cx={g.joint.x} cy={g.joint.y} r={16} style="stroke" strokeWidth={1.4} color={INK} />
    </Group>
  );
}

/** A boom cymbal stand from above: the tripod, the tube, the boom. */
export function BoomStandTop({ id, dim = 1 }: { id: 'crash1' | 'crash2' | 'ride'; dim?: number }) {
  const g = useMemo(() => {
    const s = boomStandPoints(id);
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 6 + (k * 2 * Math.PI) / 3;
      seg(legs, s.foot.x, s.foot.z, s.foot.x + Math.cos(a) * BOOM_STAND.legReach.mm, s.foot.z + Math.sin(a) * BOOM_STAND.legReach.mm);
    }
    const dx = s.tilter.x - s.joint.x;
    const dz = s.tilter.z - s.joint.z;
    const l = Math.hypot(dx, dz) || 1;
    const back = { x: s.joint.x - (dx / l) * 140, z: s.joint.z - (dz / l) * 140 };
    return { legs, boom: seg(make(), back.x, back.z, s.tilter.x, s.tilter.z), foot: s.foot, back };
  }, [id]);
  return (
    <Group opacity={dim}>
      <Path path={g.legs} style="stroke" strokeWidth={11} strokeCap="round" color="#16171b" />
      <Path path={g.legs} style="stroke" strokeWidth={7} strokeCap="round" color="#7a7f8a" />
      <Path path={g.boom} style="stroke" strokeWidth={13} strokeCap="round" color="#16171b" />
      <Path path={g.boom} style="stroke" strokeWidth={8} strokeCap="round" color="#5b5f69" />
      <Circle cx={g.back.x} cy={g.back.z} r={BOOM_STAND.counterweight.mm / 2} color="#2a2c32" />
      <Circle cx={g.foot.x} cy={g.foot.z} r={16}>
        <RadialGradient c={vec(g.foot.x - 5, g.foot.z - 5)} r={20} colors={['#c8ccd4', '#5b5f69', '#1d1e23']} />
      </Circle>
    </Group>
  );
}

/* ═════════════════════════ HI-HAT ═════════════════════════ */

function buildHiHatSide(open: boolean) {
  const p = KIT_PLACED_CYMBALS.hihat;
  const st = hihatStandPoints();
  const floorY = KIT_FLOOR_Y;
  const c = p.c;
  const rise = p.spec.rise.mm;
  const gap = open ? HH.openGap.mm : HH.closedGap.mm;
  const legs = tripodSide(make(), c.x, floorY, HH.legSpread.mm * 0.62, 170);
  const lower = seg(make(), c.x, floorY - 170, c.x, floorY - 430);
  const upper = seg(make(), c.x, floorY - 430, c.x, st.seat.y);
  const rod = seg(make(), c.x, c.y + gap + rise + HH.seat.mm + 10, c.x, c.y - rise - HH.clutchH.mm - 24);
  const seat = rrect(make(), c.x - 22, c.y + gap + rise - 2, c.x + 22, c.y + gap + rise + HH.seat.mm, 6);
  // The clutch on the rod above the top cymbal: two felts, the body, the lock screw.
  const cy0 = c.y - rise;
  const clutch = rrect(make(), c.x - HH.clutchD.mm / 2, cy0 - HH.clutchH.mm, c.x + HH.clutchD.mm / 2, cy0 - HH.clutchH.mm * 0.35, 5);
  const felts = make();
  rrect(felts, c.x - 18, cy0 - 9, c.x + 18, cy0, 2);
  rrect(felts, c.x - 18, cy0 - HH.clutchH.mm * 0.35, c.x + 18, cy0 - HH.clutchH.mm * 0.35 + 9, 2);
  const screw = rrect(make(), c.x + HH.clutchD.mm / 2, cy0 - HH.clutchH.mm * 0.78, c.x + HH.clutchD.mm / 2 + 16, cy0 - HH.clutchH.mm * 0.6, 3);
  // The pedal toward the drummer (−x): footboard, heel plate, linkage.
  const ped = KIT.hihatPedal;
  const foot = make();
  foot.moveTo(ped.u0, floorY - 14);
  foot.lineTo(ped.u1, floorY - 52);
  foot.lineTo(ped.u1 + 8, floorY - 40);
  foot.lineTo(ped.u0 + 4, floorY - 4);
  foot.close();
  const heel = rrect(make(), ped.u0 - 30, floorY - 16, ped.u0 + 30, floorY, 4);
  const link = seg(make(), ped.u1, floorY - 48, c.x, floorY - 120);
  return { legs, lower, upper, rod, seat, clutch, felts, screw, foot, heel, link, c, gap };
}
const hhSideCache = new Map<string, ReturnType<typeof buildHiHatSide>>();

/** The hi-hat from the side: pair, clutch, rod, stand, tripod, pedal. */
export function HiHatSide({ open = false, dim = 1 }: { open?: boolean; dim?: number }) {
  const key = open ? 'o' : 'c';
  let g = hhSideCache.get(key);
  if (!g) {
    g = buildHiHatSide(open);
    hhSideCache.set(key, g);
  }
  const spec = KIT_PLACED_CYMBALS.hihat.spec;
  return (
    <Group opacity={dim}>
      <Path path={g.legs} style="stroke" strokeWidth={10} strokeCap="round" color="#1d1e23" />
      <Path path={g.legs} style="stroke" strokeWidth={6} strokeCap="round" color="#8a8f99" />
      <Path path={g.link} style="stroke" strokeWidth={4} color="#2a2c32" />
      <Path path={g.foot}>
        <LinearGradient start={vec(KIT.hihatPedal.u0, 0)} end={vec(KIT.hihatPedal.u1, 0)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      <Path path={g.foot} style="stroke" strokeWidth={1} color={INK} />
      <Path path={g.heel} color="#2a2c32" />
      <Path path={g.lower} style="stroke" strokeWidth={HH.lowerTube.mm + 4} strokeCap="round" color="#16171b" />
      <Path path={g.lower} style="stroke" strokeWidth={HH.lowerTube.mm} strokeCap="round" color="#7d828d" />
      <Path path={g.upper} style="stroke" strokeWidth={HH.upperTube.mm + 3} strokeCap="round" color="#16171b" />
      <Path path={g.upper} style="stroke" strokeWidth={HH.upperTube.mm - 3} strokeCap="round" color="#aeb3bd" />
      <Path path={g.rod} style="stroke" strokeWidth={HH.pullRod.mm} strokeCap="round" color="#c6cad4" />
      <Path path={g.seat}>
        <LinearGradient start={vec(g.c.x - 22, 0)} end={vec(g.c.x + 22, 0)} colors={CHROME} />
      </Path>
      {/* the bottom cymbal (face down), then the top one */}
      <Group transform={[{ translateX: g.c.x }, { translateY: g.c.y + g.gap }]}>
        <Plate spec={spec} inverted />
      </Group>
      <Group transform={[{ translateX: g.c.x }, { translateY: g.c.y }]}>
        <Plate spec={spec} />
      </Group>
      <Path path={g.felts}>
        <LinearGradient start={vec(0, g.c.y - 80)} end={vec(0, g.c.y)} colors={FELT} />
      </Path>
      <Path path={g.clutch}>
        <LinearGradient start={vec(g.c.x - HH.clutchD.mm / 2, 0)} end={vec(g.c.x + HH.clutchD.mm / 2, 0)} colors={CHROME} />
      </Path>
      <Path path={g.clutch} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={g.screw} color="#2a2c32" />
    </Group>
  );
}

/** The hi-hat from above: the top cymbal with its clutch, the tripod and
 *  the pedal toward the throne (the kit plan's). */
export function HiHatTop({ highlight = false, dim = 1 }: { highlight?: boolean; dim?: number }) {
  const p = KIT_PLACED_CYMBALS.hihat;
  const g = useMemo(() => {
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3;
      seg(legs, p.c.x, p.c.z, p.c.x + Math.cos(a) * HH.legSpread.mm, p.c.z + Math.sin(a) * HH.legSpread.mm);
    }
    const ped = KIT.hihatPedal;
    return { legs, pedal: rrect(make(), ped.u0, ped.v - ped.halfW, ped.u1, ped.v + ped.halfW, 14), heel: rrect(make(), ped.u0 - 10, ped.v - ped.halfW + 6, ped.u0 + 60, ped.v + ped.halfW - 6, 8) };
  }, [p]);
  const ped = KIT.hihatPedal;
  return (
    <Group opacity={dim}>
      <Path path={g.legs} style="stroke" strokeWidth={11} strokeCap="round" color="#16171b" />
      <Path path={g.legs} style="stroke" strokeWidth={7} strokeCap="round" color="#9aa0ab" />
      <Path path={g.pedal}>
        <LinearGradient start={vec(ped.u0, ped.v - ped.halfW)} end={vec(ped.u1, ped.v + ped.halfW)} colors={['#c8ccd4', '#6c717c', '#2a2c32']} />
      </Path>
      <Path path={g.heel} color="#1d1e23" opacity={0.8} />
      <CymbalTop spec={p.spec} cx={p.c.x} cz={p.c.z} tiltDeg={0} highlight={highlight} mount={false} />
      <Group transform={[{ translateX: p.c.x }, { translateY: p.c.z }]}>
        <Circle cx={0} cy={0} r={HH.clutchD.mm / 2 + 4} color="#2a2230" />
        <Circle cx={0} cy={0} r={HH.clutchD.mm / 2}>
          <RadialGradient c={vec(-5, -5)} r={HH.clutchD.mm} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
        </Circle>
        <Circle cx={0} cy={0} r={HH.pullRod.mm / 2 + 1} color="#2a2c32" />
      </Group>
    </Group>
  );
}

/* ═════════════════════════ FACE-ON: a vibration shape ═════════════════════════ */

const BLUE_BANDS = ['rgba(111,168,255,0.18)', 'rgba(111,168,255,0.34)', 'rgba(111,168,255,0.52)', 'rgba(111,168,255,0.74)'];
const AMBER_BANDS = ['rgba(255,190,70,0.2)', 'rgba(255,190,70,0.38)', 'rgba(255,190,70,0.58)', 'rgba(255,190,70,0.8)'];
const LEVELS = [0.12, 0.35, 0.6, 0.85];

function modeBands(sh: CymbalShape, R: number, swing: number, r0Frac: number): { pos: SkPath[]; neg: SkPath[] } {
  const pos = LEVELS.map(() => make());
  const neg = LEVELS.map(() => make());
  const pk = cymbalShapePeak(sh);
  const NR = 26;
  const NT = 96;
  for (let i = 0; i < NR; i++) {
    const r0 = r0Frac + ((1 - r0Frac) * i) / NR;
    const r1 = r0Frac + ((1 - r0Frac) * (i + 1)) / NR;
    const rm = (r0 + r1) / 2;
    for (let k = 0; k < NT; k++) {
      const t0 = (k / NT) * 2 * Math.PI;
      const t1 = ((k + 1) / NT) * 2 * Math.PI;
      const v = (cymbalShapeAt(sh, rm, (t0 + t1) / 2) / pk) * swing;
      const a = Math.abs(v);
      let bin = -1;
      for (let b = LEVELS.length - 1; b >= 0; b--) if (a >= LEVELS[b]) { bin = b; break; }
      if (bin < 0) continue;
      const p = v > 0 ? pos[bin] : neg[bin];
      // θ from the strike direction, which points straight DOWN the screen
      // (the stick comes from the player, at the bottom).
      const pt = (r: number, t: number) => ({ x: -Math.sin(t) * r * R, y: Math.cos(t) * r * R });
      const a0 = pt(r0, t0);
      const a1 = pt(r1, t0);
      const b1 = pt(r1, t1);
      const b0 = pt(r0, t1);
      p.moveTo(a0.x, a0.y);
      p.lineTo(a1.x, a1.y);
      p.lineTo(b1.x, b1.y);
      p.lineTo(b0.x, b0.y);
      p.close();
    }
  }
  return { pos, neg };
}

export type CymbalModeFaceProps = {
  w: number;
  h: number;
  spec: CymbalSpec;
  shape: CymbalShape;
  /** The stick's spot, mm from the centre (drawn straight DOWN from it). */
  strikeMm: number;
  /** −1 … 1: where in its cycle the shape is drawn (0 = passing through flat). */
  swing: number;
  accessibilityLabel: string;
};

/**
 * A cymbal seen face-on from above, ringing in one vibration shape: the
 * displacement at one instant as bands (blue toward you, amber away, with a
 * + / − mark in every region so colour is never the only signal), the still
 * lines exactly where the model puts them, the bell (held by the felts) and
 * the stick's spot. Nothing moves by itself: SWING is a fader.
 */
export function CymbalModeFace({ w, h, spec, shape, strikeMm, swing, accessibilityLabel }: CymbalModeFaceProps) {
  const R = spec.d.mm / 2;
  const bellR = spec.bellD.mm / 2;
  const textScale = useStageTextScale();
  const box = { u0: -R - 60, u1: R + 60, v0: -R - 30, v1: R + 70 };
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
  const field = useMemo(() => modeBands(shape, R, swing, 0.06), [shape, R, swing]);
  const still = useMemo(() => {
    const p = make();
    for (const a of cymbalStillDiameters(shape)) {
      p.moveTo(-Math.sin(a) * R, Math.cos(a) * R);
      p.lineTo(Math.sin(a) * R, -Math.cos(a) * R);
    }
    for (const r of cymbalStillRings(shape)) p.addCircle(0, 0, r * R);
    return p;
  }, [shape, R]);
  const lathe = useMemo(() => {
    const p = make();
    for (let q = bellR + 4; q < R - 3; q += 6) p.addCircle(0, 0, q);
    return p;
  }, [R, bellR]);
  const signs = useMemo(() => {
    const plus = make();
    const minus = make();
    if (Math.abs(swing) > 0.12) {
      const rings = [0.18, ...cymbalStillRings(shape), 1];
      for (let i = 0; i < rings.length - 1; i++) {
        const rm = rings[i] + (rings[i + 1] - rings[i]) * 0.62;
        const lobes = shape.n === 0 ? [0] : Array.from({ length: 2 * shape.n }, (_, k) => (k * Math.PI) / shape.n);
        for (const t of lobes) {
          const sg = Math.sign(cymbalShapeAt(shape, rm, t)) * Math.sign(swing);
          if (!sg) continue;
          const x = -Math.sin(t) * rm * R;
          const y = Math.cos(t) * rm * R;
          const p = sg > 0 ? plus : minus;
          p.moveTo(x - 14, y);
          p.lineTo(x + 14, y);
          if (sg > 0) {
            p.moveTo(x, y - 14);
            p.lineTo(x, y + 14);
          }
        }
      }
    }
    return { plus, minus };
  }, [shape, swing, R]);
  const labels: StaticLabel[] = [
    { id: 'stick', text: 'STICK', u: 34, v: strikeMm + 4, align: 'left', tone: 'amber' },
    { id: 'bell', text: 'BELL', u: 0, v: -bellR - 22, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Circle cx={12} cy={16} r={R + 4} color="#000" opacity={0.5}>
            <BlurMask blur={14} style="normal" />
          </Circle>
          {/* Muted bronze under the bands, so blue and amber both read. */}
          <Circle cx={0} cy={0} r={R}>
            <RadialGradient c={vec(-R * 0.38, -R * 0.42)} r={R * 1.75} colors={BRONZE_MUTED} />
          </Circle>
          <Path path={lathe} style="stroke" strokeWidth={1.2} color="#1c140a" opacity={0.35} />
          {field.pos.map((p, i) => (
            <Path key={`p${i}`} path={p} color={BLUE_BANDS[i]} />
          ))}
          {field.neg.map((p, i) => (
            <Path key={`n${i}`} path={p} color={AMBER_BANDS[i]} />
          ))}
          <Path path={still} style="stroke" strokeWidth={7} color="rgba(8,8,10,0.55)" />
          <Path path={still} style="stroke" strokeWidth={3.2} color="#ffffff">
            <DashPathEffect intervals={[16, 10]} />
          </Path>
          <Circle cx={0} cy={0} r={bellR}>
            <RadialGradient c={vec(-bellR * 0.35, -bellR * 0.4)} r={bellR * 1.5} colors={BELL} />
          </Circle>
          <Circle cx={0} cy={0} r={bellR} style="stroke" strokeWidth={1.5} color={BRONZE_EDGE} opacity={0.6} />
          <Circle cx={0} cy={0} r={HW.feltD.mm / 2} color="#2a2230" />
          <Circle cx={0} cy={0} r={7} color="#c8ccd4" />
          <Circle cx={0} cy={0} r={R} style="stroke" strokeWidth={3} color={BRONZE_EDGE} />
          {/* the stick's spot */}
          <Line p1={vec(-20, strikeMm)} p2={vec(20, strikeMm)} color="#ffc64d" strokeWidth={3} />
          <Circle cx={0} cy={strikeMm} r={18} style="stroke" strokeWidth={5} color="#ffc64d" />
          <Path path={signs.plus} style="stroke" strokeWidth={12} color="rgba(255,255,255,0.85)" strokeCap="round" />
          <Path path={signs.minus} style="stroke" strokeWidth={12} color="rgba(255,255,255,0.85)" strokeCap="round" />
          <Path path={signs.plus} style="stroke" strokeWidth={5.5} color="#123f8c" strokeCap="round" />
          <Path path={signs.minus} style="stroke" strokeWidth={5.5} color="#7a3a00" strokeCap="round" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
