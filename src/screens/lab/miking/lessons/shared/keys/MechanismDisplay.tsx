/**
 * HOW AN ELECTRIC PIANO MAKES ITS SIGNAL, drawn (LESSON_JOURNEY §6 stage 2).
 * An INSIDE VIEW only — a cut through one note, never an instruction to open
 * the instrument. FULLY SILENT: shown, never played; nothing loops (D8).
 *
 *   tine   one note of the tine piano: the key, the hammer, the TINE screwed
 *          into its block with the TONEBAR above it (a tuning fork), and the
 *          magnetic PICKUP facing the tine's tip
 *   reed   one note of the reed piano: the key, the hammer, a flat steel REED
 *          clamped at one end, its tip moving past the charged PICKUP PLATE
 *
 * Five events, numbered (an explanatory overlay), revealed by `reveal`
 * (stepped, or played ONCE by the page): ① the key goes down; ② the hammer
 * flies up and strikes; ③ the bar swings in its first shape (the two extreme
 * shapes drawn as ghosts, motion drawn far larger than it is); ④ the pickup
 * senses the motion: a small electrical signal; ⑤ the signal leaves for the
 * amplifier. `swing` (0..1, moved by hand) sets the bar's position and draws
 * the pickup's signal up to that moment on the scope below; `tremolo` (reed)
 * shows the instrument's "vibrato": a LEVEL that pulses, not a pitch.
 *
 * Mechanism sizes: keysSpec.ts (the tine's length, the escapement and the
 * hammer tip are the maker's service figures; everything else is a drawing
 * default).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { SPK } from '../speakers/SpeakerArt';
import { KEYS } from './KeysArt';
import { REED, TINE, cantileverShape, tipSwing } from './keysSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
function poly(pts: readonly (readonly [number, number])[]): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  p.close();
  return p;
}
function rr(p: SkPath, u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 8) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

export type MechKind = 'tine' | 'reed';
export const MECH_STEPS = 5;

/* ── geometry (mm; u along the key, the player at the LEFT; v = y, down +) ── */
const L_TINE = TINE.tineL.mm;
const L_REED = REED.reedL.mm;
export const MECH = {
  tine: {
    L: L_TINE,
    strikeU: -L_TINE * 0.34,
    /** The drawn swing of the tip (mm) — far larger than it really moves. */
    amp: 7,
    pickupFace: -L_TINE - TINE.pickupGap.mm,
  },
  reed: {
    L: L_REED,
    strikeU: -L_REED * 0.62,
    amp: 6,
    plate: { u0: -L_REED - 8, u1: -L_REED + 16, v0: -9, v1: 5 },
  },
  keyFront: -270,
  keyBack: 92,
  keyV: 92,
  fulcrumU: -40,
  hammerPivot: { u: 72, v: 70 },
} as const;

/** Each mechanism's frame: the box drawn and the scope under it (the reed is
 *  small, so its view is closer; the key runs off the left edge). */
export const MECH_FRAME = {
  tine: { box: { u0: -185, u1: 112, v0: -58, v1: 216 }, scope: { u0: -172, u1: 100, v0: 132, v1: 192 } },
  reed: { box: { u0: -122, u1: 72, v0: -54, v1: 186 }, scope: { u0: -112, u1: 62, v0: 118, v1: 166 } },
} as const;

/** The key's turn (radians) when pressed, about its balance point. */
const KEY_TURN = 0.06;
/** The hammer's turn (radians) from rest to the strike. */
function hammerTurn(kind: MechKind): number {
  const S = MECH[kind];
  const piv = MECH.hammerPivot;
  // The tip's top at rest sits 18 mm below the bar; the turn closes that gap.
  const r = Math.hypot(S.strikeU - piv.u, 0 - piv.v);
  return 18 / r;
}

/** The bar's centre line at a swing `y` of the tip (the first shape). */
function barLine(L: number, y: number): SkPath {
  const p = make();
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const u = -s * L;
    const v = y * cantileverShape(s);
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  }
  return p;
}

export type MechanismDisplayProps = {
  w: number;
  h: number;
  kind: MechKind;
  /** 0 = at rest (page 1's inside view); 1 … 5 the events. */
  reveal: SharedValue<number> | null;
  shown: number;
  swing: number;
  tremolo?: boolean;
  highlight?: string | null;
  onTapPart?: (id: string) => void;
  accessibilityLabel: string;
};

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';

export function MechanismDisplay({ w, h, kind, reveal, shown, swing, tremolo = false, highlight = null, onTapPart, accessibilityLabel }: MechanismDisplayProps) {
  const ts = useStageTextScale();
  const FR = MECH_FRAME[kind];
  const B = FR.box;
  const xf = useMemo(() => fitXform('side', B, w, h, 6), [w, h, kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const S = MECH[kind];
  const tine = kind === 'tine';
  const still = useMemo(() => {
    const block = make();
    const tonebar = make();
    const rail = make();
    const grain = make();
    const pickup = make();
    const coil = make();
    const flange = make();
    const winding = make();
    const bracket = make();
    const screws: { u: number; v: number; r: number }[] = [];
    const field = make();
    const railRects: [number, number, number, number][] = [];
    if (tine) {
      // the tine block (steel), the tine swaged into its face; the tonebar
      // screwed down onto the block's top; the block on the harp's rail
      rr(block, 0, -13, 26, 13, 3);
      rr(tonebar, -TINE.tonebarL.mm, -24, 24, -15, 2.5);
      railRects.push([-6, 13, 44, 34]);
      screws.push({ u: 13, v: -26, r: 4.4 });
      // the pickup: a wound coil on its bobbin, the pole piece aimed along
      // the tine at its tip; held by a steel bracket on the pickup rail
      const f = (S as typeof MECH.tine).pickupFace;
      const pr = TINE.pickupD.mm / 2;
      pickup.addPath(poly([[f - 9, -pr], [f - 1.5, -pr], [f, -pr + 1.5], [f, pr - 1.5], [f - 1.5, pr], [f - 9, pr]]));
      rr(coil, f - 31, -11, f - 9, 11, 2);
      rr(flange, f - 35, -15, f - 31, 15, 1.2);
      rr(flange, f - 9, -15, f - 6, 15, 1.2);
      for (let i = 1; i < 9; i++) {
        const u = f - 31 + (22 * i) / 9;
        winding.moveTo(u, -10.5);
        winding.lineTo(u + 1.2, 10.5);
      }
      bracket.addPath(poly([[f - 30, 15], [f - 12, 15], [f - 12, 17], [f - 4, 17], [f - 4, 21], [f - 34, 21], [f - 34, 15]]));
      railRects.push([f - 44, 21, f + 2, 42]);
      screws.push({ u: f - 8, v: 19, r: 2.6 });
      for (const r of [8, 13, 18]) field.addArc(Skia.XYWHRect(f - r, -r, 2 * r, 2 * r), -60, 120);
    } else {
      // the reed bar (cut), the reed screwed to it; the pickup's comb plate
      // (one tooth beside the reed's tip, seen through) on its insulated mount
      rr(block, 0, -11, 34, 15, 3);
      railRects.push([-8, 15, 46, 34]);
      screws.push({ u: 12, v: -13, r: 4.4 });
      const P = (S as typeof MECH.reed).plate;
      rr(pickup, P.u0, P.v0, P.u1, P.v1, 2);
      rr(coil, P.u0 - 2, P.v0 - 26, P.u1 + 2, P.v0, 3);
      screws.push({ u: (P.u0 + P.u1) / 2, v: P.v0 - 13, r: 3 });
      for (const r of [6, 11, 16]) field.addArc(Skia.XYWHRect(P.u0 - 4 - r, -r, 2 * r, 2 * r), 120, 120);
    }
    // the wood's grain along the rails
    for (const [x0, y0, x1, y1] of railRects) {
      rr(rail, x0, y0, x1, y1, 3);
      for (let i = 1; i < 4; i++) {
        const y = y0 + ((y1 - y0) * i) / 4;
        grain.moveTo(x0 + 3, y);
        grain.cubicTo(x0 + (x1 - x0) * 0.3, y + 1.5, x0 + (x1 - x0) * 0.6, y - 1.5, x1 - 3, y);
      }
    }
    const scope = rr(make(), FR.scope.u0, FR.scope.v0, FR.scope.u1, FR.scope.v1, 6);
    const grid = make();
    const sc = FR.scope;
    const mid = (sc.v0 + sc.v1) / 2;
    grid.moveTo(sc.u0 + 6, mid);
    grid.lineTo(sc.u1 - 6, mid);
    for (let i = 1; i < 6; i++) {
      const u = sc.u0 + ((sc.u1 - sc.u0) * i) / 6;
      grid.moveTo(u, sc.v0 + 4);
      grid.lineTo(u, sc.v1 - 4);
    }
    const out = make();
    const fu = tine ? (S as typeof MECH.tine).pickupFace - 34 : (S as typeof MECH.reed).plate.u0;
    const fv = tine ? 0 : (S as typeof MECH.reed).plate.v0 - 26;
    out.moveTo(fu, fv);
    out.cubicTo(fu - 30, fv - 10, FR.box.u0 + 30, -30, FR.box.u0 + 6, -46);
    const outArrow = make();
    arrow(outArrow, FR.box.u0 + 40, -40, FR.box.u0 + 6, -46, 9);
    const strikeArrow = make();
    arrow(strikeArrow, S.strikeU + 16, 44, S.strikeU + 16, 10, 7);
    const keyArrow = make();
    arrow(keyArrow, FR.box.u0 + 20, 56, FR.box.u0 + 20, 80, 7);
    return { block, tonebar, rail, grain, pickup, coil, flange, winding, bracket, screws, field, scope, grid, out, outArrow, strikeArrow, keyArrow };
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the key and the hammer (rotated by the reveal) */
  // A key ≈ 22 deep in wood, the moulded key top over its front 135 mm with
  // its front lip; the balance rail (wood) under the pivot.
  const keyPath = useMemo(() => rr(make(), MECH.keyFront, MECH.keyV - 9, MECH.keyBack, MECH.keyV + 9, 2), []);
  const keyTop = useMemo(
    () =>
      poly([
        [MECH.keyFront - 2.5, MECH.keyV - 12],
        [MECH.keyFront + 135, MECH.keyV - 12],
        [MECH.keyFront + 135, MECH.keyV - 9],
        [MECH.keyFront + 1, MECH.keyV - 9],
        [MECH.keyFront + 1, MECH.keyV + 3],
        [MECH.keyFront - 2.5, MECH.keyV + 3],
      ]),
    [],
  );
  const keyGrain = useMemo(() => {
    const p = make();
    for (const dv of [-4, 1, 5]) {
      p.moveTo(MECH.keyFront + 140, MECH.keyV + dv);
      p.cubicTo(MECH.keyFront + 220, MECH.keyV + dv + 1.2, MECH.keyBack - 120, MECH.keyV + dv - 1.2, MECH.keyBack - 4, MECH.keyV + dv);
    }
    return p;
  }, []);
  const fulcrum = useMemo(() => rr(make(), MECH.fulcrumU - 16, MECH.keyV + 12.5, MECH.fulcrumU + 16, MECH.keyV + 25, 2), []);
  const piv = MECH.hammerPivot;
  const hammer = useMemo(() => {
    const arm = make();
    // from the pivot to under the strike point, then the tip on top
    arm.moveTo(piv.u + 6, piv.v + 6);
    arm.lineTo(S.strikeU + 8, 28);
    arm.lineTo(S.strikeU - 8, 28);
    arm.lineTo(S.strikeU - 8, 34);
    arm.lineTo(piv.u - 6, piv.v + 10);
    arm.close();
    const tip = rr(make(), S.strikeU - 8, 18 + 1.2, S.strikeU + 8, 18 + 1.2 + TINE.hammerTip.mm + 3, 2.5);
    return { arm, tip };
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const turn = hammerTurn(kind);
  const r = reveal;
  const keyXf = useDerivedValue(() => {
    const v = r ? r.value : 0;
    const k = clamp01(v);
    return [{ rotate: -KEY_TURN * k }];
  });
  const hammerXf = useDerivedValue(() => {
    const v = r ? r.value : 0;
    // up to the strike in event 2, falling back to rest on the held key after it
    const up = clamp01(v - 1);
    const back = clamp01(v - 2);
    const a = up * (1 - back * 0.75);
    return [{ rotate: turn * a }];
  });
  const o3 = useDerivedValue(() => clamp01((r ? r.value : 0) - 2));
  const o4 = useDerivedValue(() => clamp01((r ? r.value : 0) - 3));
  const o5 = useDerivedValue(() => clamp01((r ? r.value : 0) - 4));
  const o1 = useDerivedValue(() => clamp01(r ? r.value : 0) * ((r ? r.value : 0) >= 2.98 ? 0.35 : 1));
  const o2 = useDerivedValue(() => clamp01((r ? r.value : 0) - 1) * ((r ? r.value : 0) >= 2.98 ? 0.35 : 1));

  /* the bar: ghosts of its two extreme shapes, and where the hand has it */
  const vibrating = shown >= 3;
  const phase = swing * 3;
  const y = vibrating ? tipSwing(phase, S.amp) * (tremolo ? trem(phase) : 1) : 0;
  const bar = useMemo(() => barLine(S.L, y), [kind, y]); // eslint-disable-line react-hooks/exhaustive-deps
  // the tine's tuning spring: a small coil slid along the tine (it moves with it)
  const spring = useMemo(() => {
    const p = make();
    if (!tine) return p;
    for (let i = 0; i <= 6; i++) {
      const s = 0.74 + (i * 0.05) / 6;
      const u = -s * S.L;
      const v = y * cantileverShape(s);
      p.moveTo(u + 0.6, v - 2.6);
      p.lineTo(u - 0.6, v + 2.6);
    }
    return p;
  }, [tine, y]); // eslint-disable-line react-hooks/exhaustive-deps
  const ghosts = useMemo(() => {
    const a = barLine(S.L, S.amp);
    const b = barLine(S.L, -S.amp);
    return { a, b };
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const tonebar = useMemo(() => {
    if (!tine) return null;
    // the tonebar swings the opposite way, smaller (the fork's other leg)
    const yb = -0.3 * y;
    const p = make();
    const n = 16;
    const Lb = TINE.tonebarL.mm;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const u = -s * Lb;
      const v = -19.5 + yb * cantileverShape(s);
      if (i === 0) p.moveTo(u, v);
      else p.lineTo(u, v);
    }
    return p;
  }, [tine, y]);
  /* the scope: the pickup's signal up to this moment */
  const trace = useMemo(() => {
    const sc = FR.scope;
    const mid = (sc.v0 + sc.v1) / 2;
    const half = (sc.v1 - sc.v0) / 2 - 6;
    const p = make();
    const n = 160;
    const end = !vibrating || shown < 4 ? 0 : swing > 0 ? swing : 1;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * end;
      const ph = t * 3;
      const sgl = tipSwing(ph, 1) * (tremolo ? trem(ph) : 1);
      const u = sc.u0 + 6 + (sc.u1 - sc.u0 - 12) * (i / n) * end;
      const v = mid - sgl * half;
      if (i === 0) p.moveTo(u, v);
      else p.lineTo(u, v);
    }
    return p;
  }, [vibrating, swing, tremolo, shown]);
  const labels: StaticLabel[] = [];
  if (tine) {
    labels.push({ id: 'tine', text: 'TINE', u: -S.L * 0.6, v: 30, align: 'center', tone: 'amber' });
    labels.push({ id: 'tb', text: 'TONEBAR', u: -TINE.tonebarL.mm * 0.5, v: -36, align: 'center' });
    labels.push({ id: 'pu', text: 'PICKUP', u: (S as typeof MECH.tine).pickupFace - 20, v: -24, align: 'center', tone: 'amber' });
  } else {
    labels.push({ id: 'reed', text: 'STEEL REED', short: 'REED', u: -S.L * 0.45, v: -22, align: 'center', tone: 'amber' });
    labels.push({ id: 'pu', text: 'PICKUP PLATE (CHARGED)', short: 'PICKUP', u: (S as typeof MECH.reed).plate.u0 - 10, v: -48, align: 'right', tone: 'amber' });
  }
  labels.push({ id: 'ham', text: 'HAMMER', u: piv.u - 30, v: 50, align: 'center', tone: 'muted' });
  labels.push({ id: 'key', text: 'KEY', u: FR.box.u0 + 50, v: MECH.keyV - 22, align: 'center', tone: 'muted' });
  labels.push({ id: 'scope', text: 'THE PICKUP’S SIGNAL', short: 'SIGNAL', u: FR.scope.u0 + 4, v: FR.scope.v1 + 12, align: 'left', tone: 'muted' });
  if (shown >= 1) labels.push({ id: 's1', text: '① KEY DOWN', u: FR.box.u0 + 4, v: 46, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② HAMMER STRIKES', short: '② STRIKE', u: S.strikeU + 30, v: 56, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: tine ? '③ TINE AND TONEBAR RING' : '③ THE REED SWINGS', short: '③ SWINGS', u: tine ? -60 : -40, v: -46, align: 'center', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ PICKUP SENSES IT', short: '④ SENSED', u: FR.scope.u1, v: FR.scope.v0 - 10, align: 'right', tone: 'blue' });
  if (shown >= 5) labels.push({ id: 's5', text: '⑤ TO THE AMP', u: FR.box.u0 + 4, v: FR.box.v0 + 4, align: 'left', tone: 'amber' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: FR.box.u1 - 4, v: -46, align: 'right', tone: 'illustrative' });

  const hiPath = useMemo(() => {
    if (!highlight) return null;
    const p = make();
    if (highlight === 'k.bar') rr(p, -S.L - 8, -S.amp - 6, 4, S.amp + 6, 6);
    else if (highlight === 'k.tonebar') rr(p, -TINE.tonebarL.mm - 6, -30, 30, -9, 6);
    else if (highlight === 'k.pickup') {
      if (tine) rr(p, (S as typeof MECH.tine).pickupFace - 40, -19, (S as typeof MECH.tine).pickupFace + 6, 19, 6);
      else rr(p, (S as typeof MECH.reed).plate.u0 - 8, (S as typeof MECH.reed).plate.v0 - 32, (S as typeof MECH.reed).plate.u1 + 8, (S as typeof MECH.reed).plate.v1 + 6, 6);
    } else if (highlight === 'k.hammer') rr(p, S.strikeU - 16, 12, piv.u + 16, piv.v + 18, 8);
    else if (highlight === 'k.key') rr(p, MECH.keyFront - 6, MECH.keyV - 16, MECH.keyBack + 6, MECH.keyV + 30, 8);
    else if (highlight === 'k.block') rr(p, -10, -30, 50, 38, 8);
    else return null;
    return p;
  }, [highlight, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (sx: number, sy: number) => {
    if (!onTapPart) return;
    const u = (sx - xf.ox) / xf.s;
    const v = (sy - xf.oy) / xf.s;
    const id = mechHit(kind, u, v, 18 / xf.s);
    if (id) onTapPart(id);
  };

  const canvas = (
    <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]} clip={Skia.XYWHRect(B.u0, B.v0, B.u1 - B.u0, B.v1 - B.v0)}>
        {/* the inside of the case, dim; lit from the upper left */}
        <Path path={rr(make(), FR.box.u0 + 2, -54, FR.box.u1 - 2, 118, 10)}>
          <LinearGradient start={vec(0, -54)} end={vec(0, 118)} colors={[...KEYS.interior]} />
        </Path>
        <Path path={rr(make(), FR.box.u0 + 2, -54, FR.box.u1 - 2, 118, 10)}>
          <RadialGradient c={vec(-200, -40)} r={320} colors={['rgba(255,214,160,0.08)', 'rgba(255,214,160,0)']} />
        </Path>
        {/* the key on its balance rail: wood, a moulded key top over the
            front, the felt washer under it (the key pivots on the rail's pin) */}
        <Path path={fulcrum}>
          <LinearGradient start={vec(MECH.fulcrumU - 16, 0)} end={vec(MECH.fulcrumU + 16, 0)} colors={[...SPK.ply.slice(1, 4)]} />
        </Path>
        <Path path={fulcrum} style="stroke" strokeWidth={0.8} color={SPK.plyLine} opacity={0.8} />
        <Path path={rr(make(), MECH.fulcrumU - 8, MECH.keyV + 9, MECH.fulcrumU + 8, MECH.keyV + 12.5, 1)} color="#8e2f28" />
        <Group origin={vec(MECH.fulcrumU, MECH.keyV)} transform={keyXf}>
          <Path path={keyPath}>
            <LinearGradient start={vec(0, MECH.keyV - 9)} end={vec(0, MECH.keyV + 9)} colors={['#e2b57a', '#b07a42', '#6e431f']} />
          </Path>
          <Path path={keyGrain} style="stroke" strokeWidth={0.6} color="#5c3417" opacity={0.5} />
          <Path path={keyPath} style="stroke" strokeWidth={0.8} color="#2b170a" opacity={0.7} />
          <Path path={keyTop}>
            <LinearGradient start={vec(0, MECH.keyV - 12)} end={vec(0, MECH.keyV - 6)} colors={[...KEYS.ivory]} />
          </Path>
          <Path path={keyTop} style="stroke" strokeWidth={0.6} color="#7d796f" opacity={0.8} />
        </Group>
        {/* the hammer on its flange: a moulded arm, the strike tip on top */}
        <Path path={rr(make(), piv.u - 12, piv.v - 6, piv.u + 22, piv.v + 8, 3)}>
          <LinearGradient start={vec(0, piv.v - 6)} end={vec(0, piv.v + 8)} colors={[...SPK.ply.slice(1, 4)]} />
        </Path>
        <Group origin={vec(piv.u, piv.v)} transform={hammerXf}>
          <Path path={hammer.arm}>
            <LinearGradient start={vec(S.strikeU, 20)} end={vec(piv.u, piv.v)} colors={tine ? ['#55585f', '#2a2c32', '#121316'] : ['#c79a5e', '#8e5f2c', '#4e3014']} />
          </Path>
          <Path path={hammer.arm} style="stroke" strokeWidth={0.9} color="#08080a" opacity={0.7} />
          <Path path={hammer.tip}>
            <LinearGradient start={vec(0, 19)} end={vec(0, 30)} colors={tine ? ['#3a3a3a', '#1c1c1c', '#0a0a0a'] : ['#f2ede2', '#cfc6b4', '#8f8676']} />
          </Path>
          <Path path={hammer.tip} style="stroke" strokeWidth={0.8} color="#08080a" opacity={0.6} />
        </Group>
        <Circle cx={piv.u} cy={piv.v} r={4.5}>
          <RadialGradient c={vec(piv.u - 1.5, piv.v - 1.5)} r={6} colors={[...KEYS.chrome]} />
        </Circle>
        {/* the rails (wood), the block, its screw, the tonebar */}
        <Path path={still.rail}>
          <LinearGradient start={vec(0, 13)} end={vec(0, 42)} colors={[...SPK.ply.slice(1, 4)]} />
        </Path>
        <Path path={still.grain} style="stroke" strokeWidth={0.6} color={SPK.plyLine} opacity={0.45} />
        <Path path={still.rail} style="stroke" strokeWidth={0.8} color={SPK.plyLine} opacity={0.8} />
        <Path path={still.block}>
          <LinearGradient start={vec(0, -13)} end={vec(30, 15)} colors={[...SPK.steel]} />
        </Path>
        <Path path={still.block} style="stroke" strokeWidth={0.8} color="#08080a" opacity={0.6} />
        {tine && tonebar ? (
          <>
            <Path path={tonebar} style="stroke" strokeWidth={9} strokeCap="butt" color="#5d626c" />
            <Path path={tonebar} style="stroke" strokeWidth={7} strokeCap="butt" color="#9aa0ab" />
            <Path path={tonebar} style="stroke" strokeWidth={2} strokeCap="butt" color="#e6e9ef" opacity={0.7} />
            <Path path={rr(make(), 0, -24, 26, -13, 2)}>
              <LinearGradient start={vec(0, -24)} end={vec(0, -13)} colors={[...SPK.steel]} />
            </Path>
          </>
        ) : null}
        {still.screws.map((c, i) => (
          <Group key={i}>
            <Circle cx={c.u} cy={c.v} r={c.r}>
              <RadialGradient c={vec(c.u - c.r * 0.4, c.v - c.r * 0.4)} r={c.r * 1.5} colors={[...KEYS.chrome]} />
            </Circle>
            <Line p1={vec(c.u - c.r * 0.7, c.v)} p2={vec(c.u + c.r * 0.7, c.v)} color="#2a2c32" strokeWidth={1} />
          </Group>
        ))}
        {/* the pickup: bobbin flanges, the copper winding, the pole piece; or the comb's insulated mount */}
        <Path path={still.bracket}>
          <LinearGradient start={vec(0, 15)} end={vec(0, 21)} colors={[...SPK.steel]} />
        </Path>
        <Path path={still.coil}>
          <LinearGradient start={vec(0, -14)} end={vec(0, 14)} colors={tine ? ['#e09a55', '#a85f26', '#5a2c0c'] : ['#6e4a2c', '#4a2f1a', '#24160b']} />
        </Path>
        <Path path={still.winding} style="stroke" strokeWidth={0.7} color="#3a1a06" opacity={0.6} />
        <Path path={still.flange}>
          <LinearGradient start={vec(0, -15)} end={vec(0, 15)} colors={['#3a3b41', '#1a1b1f', '#08080a']} />
        </Path>
        {tine ? (
          <Path path={still.pickup}>
            <LinearGradient start={vec(0, -7)} end={vec(0, 7)} colors={[...SPK.steel]} />
          </Path>
        ) : null}
        {!tine ? <Path path={still.pickup} color="rgba(200,204,212,0.26)" /> : null}
        {!tine ? <Path path={still.pickup} style="stroke" strokeWidth={1.2} color="#c8ccd4" opacity={0.8} /> : null}
        {/* ③ ghosts of the two extreme shapes */}
        <Group opacity={o3}>
          <Path path={ghosts.a} style="stroke" strokeWidth={2.2} color={BLUE} opacity={0.45}>
            <DashPathEffect intervals={[5, 4]} />
          </Path>
          <Path path={ghosts.b} style="stroke" strokeWidth={2.2} color={BLUE} opacity={0.45}>
            <DashPathEffect intervals={[5, 4]} />
          </Path>
        </Group>
        {/* the bar where the hand has it */}
        <Path path={bar} style="stroke" strokeWidth={tine ? TINE.tineD.mm * 1.6 : 3} strokeCap="round" color="#aeb4c0" />
        <Path path={bar} style="stroke" strokeWidth={1} strokeCap="round" color="#ffffff" opacity={0.55} />
        {!tine ? <Circle cx={-S.L + 3} cy={y - 2.4} r={3.6} color="#b7b2a6" /> : null}
        {tine ? <Path path={spring} style="stroke" strokeWidth={0.9} color="#e6e9ef" /> : null}
        {/* ① ② the key and strike arrows */}
        <Group opacity={o1}>
          <Path path={still.keyArrow} style="stroke" strokeWidth={3} strokeCap="round" color={AMBER} />
        </Group>
        <Group opacity={o2}>
          <Path path={still.strikeArrow} style="stroke" strokeWidth={3} strokeCap="round" color={AMBER} />
        </Group>
        {/* ④ the pickup's field, ⑤ the signal out */}
        <Group opacity={o4}>
          <Path path={still.field} style="stroke" strokeWidth={1.6} color={BLUE} opacity={0.8}>
            <DashPathEffect intervals={[3, 3]} />
          </Path>
        </Group>
        <Group opacity={o5}>
          <Path path={still.out} style="stroke" strokeWidth={4} color="#202126" />
          <Path path={still.out} style="stroke" strokeWidth={1.6} color={AMBER} />
          <Path path={still.outArrow} style="stroke" strokeWidth={3} strokeCap="round" color={AMBER} />
        </Group>
        {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={2.8} color={AMBER} /> : null}
        {/* the scope */}
        <Path path={still.scope} color="#0b0c10" />
        <Path path={still.grid} style="stroke" strokeWidth={0.6} color="#2e3240" />
        <Path path={still.scope} style="stroke" strokeWidth={1.2} color="#3a3d48" />
        <Group opacity={o4}>
          <Path path={trace} style="stroke" strokeWidth={2.2} strokeJoin="round" color={AMBER} />
        </Group>
        <Line p1={vec(FR.scope.u0 + 6, FR.scope.v1 + 3)} p2={vec(FR.scope.u1 - 6, FR.scope.v1 + 3)} color="#2e3240" strokeWidth={0.8} />
      </Group>
    </Canvas>
  );
  return (
    <View style={{ width: w, height: h }}>
      {onTapPart ? (
        <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
          <View pointerEvents="none">{canvas}</View>
        </Pressable>
      ) : (
        canvas
      )}
      <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
    </View>
  );
}

/** The instrument's tremolo ("vibrato"): a slow pulse in LEVEL, not pitch. */
export function trem(phase: number): number {
  return 1 - 0.55 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 0.42 * phase));
}

/** The part under (u, v) of the inside view. */
export function mechHit(kind: MechKind, u: number, v: number, tol: number): string | null {
  const S = MECH[kind];
  if (kind === 'tine') {
    const f = MECH.tine.pickupFace;
    if (u >= f - 40 - tol && u <= f + 4 + tol && Math.abs(v) <= 16 + tol) return 'k.pickup';
    if (u >= -TINE.tonebarL.mm - tol && u <= 26 && v >= -30 - tol && v <= -12) return 'k.tonebar';
  } else {
    const P = MECH.reed.plate;
    if (u >= P.u0 - 4 - tol && u <= P.u1 + tol && v >= P.v0 - 28 - tol && v <= P.v1 + tol && !(u > -S.L + 4 && Math.abs(v) <= 3)) return 'k.pickup';
  }
  if (u >= -4 && u <= 46 + tol && v >= -14 - tol && v <= 36 + tol) return 'k.block';
  if (u >= -S.L - tol && u <= 0 && Math.abs(v) <= S.amp + tol) return 'k.bar';
  if (u >= S.strikeU - 14 && u <= MECH.hammerPivot.u + 12 && v >= 14 && v <= MECH.hammerPivot.v + 16 && v < MECH.keyV - 10) return 'k.hammer';
  if (u >= MECH.keyFront - tol && u <= MECH.keyBack + tol && Math.abs(v - MECH.keyV) <= 14 + tol) return 'k.key';
  return null;
}

/** The drawing's aspect (w ÷ h). */
export const MECH_ASPECT = (MECH_FRAME.tine.box.u1 - MECH_FRAME.tine.box.u0) / (MECH_FRAME.tine.box.v1 - MECH_FRAME.tine.box.v0);
