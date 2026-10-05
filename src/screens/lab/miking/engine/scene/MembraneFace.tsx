/**
 * MembraneFace — a drumhead seen face-on (from the player's side), showing
 * ONE vibration shape of an IDEAL clamped membrane (engine/physics/membrane.ts,
 * the Cymatics / Drum Tuning Bessel tables). HOW IT SOUNDS, step 2.
 *
 * What is drawn, and how honestly:
 *   • the head, its wood hoop and the claws at each tension rod (count from
 *     the lesson: Yamaha's 10 per head, owner-confirmed; the rod PHASE is the lesson's
 *     placeholder, so the claws are ILLUSTRATIVE positions);
 *   • the shape's displacement at one instant as BANDS — blue moving toward
 *     you, amber away — with a + / − mark in every region, so colour is never
 *     the only signal (charter §8); the band edges are levels of the exact
 *     J_n(j r)·cos(nθ), not a picture of them;
 *   • the still (nodal) lines EXACTLY where the model puts them: diameters at
 *     (2k+1)π/2n from the strike direction, rings at the interior zeros of J_n;
 *   • the beater's strike point, above the centre by the lesson's distance.
 * Nothing moves by itself (D8): SWING is a fader the learner drags.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../geometry/frame.ts';
import { shapeAt, shapePeak, stillDiameters, stillRings, type HeadShape } from '../physics/membrane.ts';
import { StaticLabels, type StaticLabel } from './StaticLabels';

const BLUE = ['rgba(111,168,255,0.16)', 'rgba(111,168,255,0.32)', 'rgba(111,168,255,0.5)', 'rgba(111,168,255,0.72)'];
const AMBER = ['rgba(255,198,77,0.16)', 'rgba(255,198,77,0.32)', 'rgba(255,198,77,0.5)', 'rgba(255,198,77,0.72)'];
const LEVELS = [0.12, 0.35, 0.6, 0.85];
const NR = 30;
const NT = 96;

export type MembraneFaceProps = {
  w: number;
  h: number;
  /** Head diameter, mm, and tension-rod count. */
  diameterMm: number;
  rods: number;
  shape: HeadShape;
  /** Strike distance from the centre, mm (drawn straight UP from the centre). */
  strikeMm: number;
  /** −1 … 1: where in its cycle the shape is drawn (0 = passing through flat). */
  swing: number;
  accessibilityLabel: string;
  /** A head that is not the kick's coated film on a wood hoop (the hand-drum
   *  family): the rim drawn UNDER the head (replaces the hoop and its shadow),
   *  the hardware drawn OVER it (replaces the claws and T-rods), the head's
   *  gradient, and the strike mark's word (default BEATER). All in mm. */
  look?: { under?: ReactElement; over?: ReactElement; head?: string[]; strikeLabel?: string };
};

type SkPath = ReturnType<typeof Skia.Path.Make>;

/** The banded field at this swing: one path per (sign, level) bin. */
function bands(sh: HeadShape, R: number, swing: number): { pos: SkPath[]; neg: SkPath[] } {
  const pos = LEVELS.map(() => Skia.Path.Make());
  const neg = LEVELS.map(() => Skia.Path.Make());
  const pk = shapePeak(sh);
  for (let i = 0; i < NR; i++) {
    const r0 = i / NR;
    const r1 = (i + 1) / NR;
    const rm = (r0 + r1) / 2;
    for (let k = 0; k < NT; k++) {
      const t0 = (k / NT) * 2 * Math.PI;
      const t1 = ((k + 1) / NT) * 2 * Math.PI;
      // θ measured from the strike direction (straight up on screen).
      const v = (shapeAt(sh, rm, (t0 + t1) / 2) / pk) * swing;
      const a = Math.abs(v);
      let bin = -1;
      for (let b = LEVELS.length - 1; b >= 0; b--) if (a >= LEVELS[b]) { bin = b; break; }
      if (bin < 0) continue;
      const p = v > 0 ? pos[bin] : neg[bin];
      // Screen: angle 0 = up (−y), increasing clockwise.
      const pt = (r: number, t: number) => ({ x: Math.sin(t) * r * R, y: -Math.cos(t) * r * R });
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

/** Region centres (r of the largest |J_n| in each ring band, θ at each lobe's middle) for the + / − marks. */
function regionMarks(sh: HeadShape): { r: number; t: number; sign: number }[] {
  const rings = [0, ...stillRings(sh), 1];
  const out: { r: number; t: number; sign: number }[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    let best = rings[i];
    let bv = 0;
    for (let q = 1; q < 40; q++) {
      const r = rings[i] + ((rings[i + 1] - rings[i]) * q) / 40;
      const v = Math.abs(shapeAt(sh, r, 0));
      if (v > bv) {
        bv = v;
        best = r;
      }
    }
    // Ring shapes: the mark sits BELOW the centre, clear of the beater mark above it.
    const lobes = sh.n === 0 ? [Math.PI] : Array.from({ length: 2 * sh.n }, (_, k) => (k * Math.PI) / sh.n);
    for (const t of lobes) out.push({ r: sh.n === 0 && i === 0 ? Math.min(0.45, rings[1] * 0.5) : best, t, sign: Math.sign(shapeAt(sh, best, t)) });
  }
  return out;
}

export function MembraneFace({ w, h, diameterMm, rods, shape, strikeMm, swing, accessibilityLabel, look }: MembraneFaceProps) {
  const R = diameterMm / 2;
  const hoopIn = R + 3;
  const hoopOut = hoopIn + 9;
  const textScale = useStageTextScale();
  const box = { u0: -hoopOut - 70, u1: hoopOut + 70, v0: -hoopOut - 40, v1: hoopOut + 40 };
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
  const field = useMemo(() => bands(shape, R, swing), [shape, R, swing]);
  const still = useMemo(() => {
    const p = Skia.Path.Make();
    for (const a of stillDiameters(shape)) {
      p.moveTo(Math.sin(a) * R, -Math.cos(a) * R);
      p.lineTo(-Math.sin(a) * R, Math.cos(a) * R);
    }
    for (const r of stillRings(shape)) p.addCircle(0, 0, r * R);
    return p;
  }, [shape, R]);
  const hw = useMemo(() => {
    const claws = Skia.Path.Make();
    const rodsP = Skia.Path.Make();
    for (let k = 0; k < rods; k++) {
      const a = (k / rods) * 2 * Math.PI + Math.PI / rods;
      const c = Math.cos(a);
      const s = Math.sin(a);
      // A claw over the hoop and a T-rod handle outside it (positions ILLUSTRATIVE).
      const at = (r: number, side: number) => ({ x: s * r + c * side, y: -c * r + s * side });
      const q = [at(hoopIn - 6, -11), at(hoopOut + 18, -11), at(hoopOut + 18, 11), at(hoopIn - 6, 11)];
      claws.moveTo(q[0].x, q[0].y);
      for (const p of q.slice(1)) claws.lineTo(p.x, p.y);
      claws.close();
      const t0 = at(hoopOut + 18, 0);
      const t1 = at(hoopOut + 46, 0);
      rodsP.moveTo(t0.x, t0.y);
      rodsP.lineTo(t1.x, t1.y);
      const e0 = at(hoopOut + 46, -16);
      const e1 = at(hoopOut + 46, 16);
      rodsP.moveTo(e0.x, e0.y);
      rodsP.lineTo(e1.x, e1.y);
    }
    return { claws, rodsP };
  }, [rods, hoopIn, hoopOut]);
  const marks = useMemo(() => regionMarks(shape), [shape]);
  const labels: StaticLabel[] = [{ id: 'beater', text: look?.strikeLabel ?? 'BEATER', u: -30, v: -strikeMm, align: 'right', tone: 'amber' }];
  // + / − in every region, drawn as strokes (crisp at any size; colour is
  // never the only signal, charter §8).
  const signs = useMemo(() => {
    const plus = Skia.Path.Make();
    const minus = Skia.Path.Make();
    if (Math.abs(swing) > 0.12) {
      for (const m of marks) {
        const sg = m.sign * Math.sign(swing);
        const x = Math.sin(m.t) * m.r * R;
        const y = -Math.cos(m.t) * m.r * R;
        const p = sg > 0 ? plus : minus;
        p.moveTo(x - 16, y);
        p.lineTo(x + 16, y);
        if (sg > 0) {
          p.moveTo(x, y - 16);
          p.lineTo(x, y + 16);
        }
      }
    }
    return { plus, minus };
  }, [marks, swing, R]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {look?.under ?? (
            <>
              {/* shadow and hoop (wood: a cosmetic finish, not a sourced colour) */}
              <Circle cx={10} cy={14} r={hoopOut + 6} color="#000" opacity={0.55} />
              <Circle cx={0} cy={0} r={hoopOut}>
                <RadialGradient c={vec(-R * 0.4, -R * 0.45)} r={hoopOut * 1.5} colors={['#d9a766', '#9c6631', '#4a2a12']} />
              </Circle>
              <Circle cx={0} cy={0} r={hoopIn} color="#1a1008" />
            </>
          )}
          {/* the head, lit from the upper left (coated film by default) */}
          <Circle cx={0} cy={0} r={R}>
            <RadialGradient c={vec(-R * 0.35, -R * 0.4)} r={R * 1.6} colors={look?.head ?? ['#fbf8f0', '#ece5d5', '#cfc4ad']} />
          </Circle>
          {field.pos.map((p, i) => (
            <Path key={`p${i}`} path={p} color={BLUE[i]} />
          ))}
          {field.neg.map((p, i) => (
            <Path key={`n${i}`} path={p} color={AMBER[i]} />
          ))}
          {/* still lines: exact, white dashed over a dark keyline */}
          <Path path={still} style="stroke" strokeWidth={7} color="rgba(8,8,10,0.55)" />
          <Path path={still} style="stroke" strokeWidth={3.2} color="#ffffff">
            <DashPathEffect intervals={[16, 10]} />
          </Path>
          <Circle cx={0} cy={0} r={R} style="stroke" strokeWidth={3} color="#8a7f6c" />
          {look?.over ?? (
            <>
              {/* claws and T-rods (positions ILLUSTRATIVE) */}
              <Path path={hw.rodsP} style="stroke" strokeWidth={6} color="#c8ccd4" />
              <Path path={hw.claws} color="#9aa0ab" />
              <Path path={hw.claws} style="stroke" strokeWidth={2} color="#eef1f6" opacity={0.7} />
            </>
          )}
          {/* the strike point */}
          <Line p1={vec(0, -strikeMm - 20)} p2={vec(0, -strikeMm + 20)} color="#ffc64d" strokeWidth={3} />
          <Circle cx={0} cy={-strikeMm} r={20} style="stroke" strokeWidth={5} color="#ffc64d" />
          <Circle cx={0} cy={0} r={5} color="#5a5244" />
          <Path path={signs.plus} style="stroke" strokeWidth={13} color="rgba(255,255,255,0.85)" strokeCap="round" />
          <Path path={signs.minus} style="stroke" strokeWidth={13} color="rgba(255,255,255,0.85)" strokeCap="round" />
          <Path path={signs.plus} style="stroke" strokeWidth={6} color="#123f8c" strokeCap="round" />
          <Path path={signs.minus} style="stroke" strokeWidth={6} color="#7a4a00" strokeCap="round" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
