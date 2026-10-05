/**
 * The PLAYER round a lute, as a muted figure (charter §6: neighbours recede)
 * — the house line-art bald head (reference_head_icon_spec), the torso, the
 * arms and hands, the legs: on a chair for the oud, cross-legged on the floor
 * for the sitar and the veena. Drawn from the scene's fit (luteModel.ts), the
 * same numbers the keep-outs are built from. Nothing moves (D8).
 *
 * The LOOK is the shared player's (players/PlayerFigure, clarity pass
 * 2026-10-05): every body mass painted with FigureMass (form gradient, lit rim,
 * core shadow, contour), the hands with fingers (handShape), the head in line
 * art (LineHead) — so a lute player reads like the guitar family's players.
 * The geometry below is unchanged: the same joints, the same widths.
 */
import { Group, Line, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { ViewId } from '../../../engine/model/types.ts';
import type { LuteScene } from './luteModel.ts';
import { DEG, ep, make, PAL, rr, smooth, type Pt, type SkPath } from './luteDraw';
import { FIGURE_TONES, FigureMass, handShape, headAbove, headFront, limb as limbPath, LineHead } from '../players/PlayerFigure';

/** A head in the house line-art spec. Front: the face to the audience, its
 *  neck column down to `neckY` (default just below the jaw). Above: the
 *  cranium and the nose's tip toward +v (the audience). */
export function Head({ cx, cy, r, above = false, neckY }: { cx: number; cy: number; r: number; above?: boolean; neckY?: number }) {
  const head = useMemo(() => (above ? headAbove({ u: cx, v: cy }, r) : headFront({ u: cx, v: cy }, r, neckY ?? cy + r * 1.35)), [cx, cy, r, above, neckY]);
  return <LineHead head={head} c={{ u: cx, v: cy }} r={r} />;
}

/** A body mass (the torso, a leg) at the shared figure standard. */
function Fig({ path, tone = 'shirt' }: { path: SkPath; tone?: 'shirt' | 'trousers' }) {
  return <FigureMass path={path} tone={tone} />;
}

/** An arm (a sleeve) through joints, `w` wide: one tapered outline. */
export function Limb({ pts, w }: { pts: Pt[]; w: number }) {
  const path = useMemo(() => limbPath(pts.map(([u, v]) => ({ u, v })), pts.map((_, i) => (w / 2) * (1 - (0.18 * i) / Math.max(1, pts.length - 1)))), [pts, w]);
  return <FigureMass path={path} tone="shirt" />;
}

/** A hand seen from its back, the fingers together, pointing `rot`°. */
export function Hand({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  const h = useMemo(() => {
    const dir = rot * DEG;
    // The shared hand is true size (about 15 cm long): scaled to this
    // figure's hand radius so the drawing's proportions are kept.
    const k = r / 40;
    const hs = handShape({ wrist: { u: -70, v: 0 }, dir: 0, kind: 'rest' });
    return { hs, k, dir };
  }, [r, rot]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: h.dir }, { scale: h.k }]}>
      <FigureMass path={h.hs.path} tone="skin" contour={2} />
      <Path path={h.hs.lines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} />
    </Group>
  );
}

/** Fingers laid across a neck at `at` (view coords), the neck running along `dir`. */
export function Fingers({ at, dir, across, n = 3 }: { at: Pt; dir: Pt; across: number; n?: number }) {
  const l = Math.hypot(dir[0], dir[1]) || 1;
  const d: Pt = [dir[0] / l, dir[1] / l];
  const a = Math.atan2(d[1], d[0]);
  const p = useMemo(() => {
    let out: SkPath | null = null;
    for (let k = 0; k < n; k++) {
      const f = limbPath(
        [
          { u: -k * 24, v: across / 2 },
          { u: -k * 24 - 2, v: 0 },
          { u: -k * 24, v: -across / 2 },
        ],
        [8.5, 8, 7],
      );
      out = out ? Skia.Path.MakeFromOp(out, f, PathOp.Union) ?? out : f;
    }
    return out ?? make();
  }, [n, across]);
  return (
    <Group transform={[{ translateX: at[0] }, { translateY: at[1] }, { rotate: a }]}>
      <FigureMass path={p} tone="skin" contour={1.8} />
    </Group>
  );
}

/* ═══════════════════════ the figure behind the instrument ═══════════════════════ */

/** Drawn BEFORE the instrument: torso, legs, the upper arms, the head. */
export function PlayerBack({ sc, view }: { sc: LuteScene; view: ViewId }) {
  const f = sc.fit;
  const hc = ep(view, f.head.c);
  const sR = ep(view, f.shoulderR);
  const sL = ep(view, f.shoulderL);
  const eR = ep(view, f.elbowR);
  const eL = ep(view, f.elbowL);
  if (view === 'side') {
    const hipY = f.hipY;
    const torso = smooth([
      [sR[0] - 30, sR[1] + 30],
      [sR[0] + 10, sR[1] - 12],
      [hc[0], sR[1] - 30],
      [sL[0] - 10, sL[1] - 12],
      [sL[0] + 30, sL[1] + 30],
      [sL[0] - 5, hipY],
      [sR[0] + 5, hipY],
    ]);
    const floor = sc.floorY;
    const legs: SkPath[] = [];
    const shoes: SkPath[] = [];
    if (f.seat === 'chair') {
      for (const k of [ep(view, f.kneeR), ep(view, f.kneeL)]) {
        legs.push(smooth([[k[0] - 62, k[1] - 40], [k[0] + 62, k[1] - 40], [k[0] + 52, floor - 34], [k[0] - 52, floor - 34]]));
        shoes.push(rr(k[0] - 70, floor - 40, k[0] + 64, floor, 18));
      }
    } else {
      // Cross-legged: the knees out to the sides, the shins crossing in front.
      const kR = ep(view, f.kneeR);
      const kL = ep(view, f.kneeL);
      legs.push(smooth([[kR[0] - 70, floor - 60], [kR[0] + 40, hipY - 30], [(kR[0] + kL[0]) / 2, hipY - 10], [kL[0] - 40, hipY - 30], [kL[0] + 70, floor - 60], [kL[0] + 30, floor - 6], [(kR[0] + kL[0]) / 2, floor - 30], [kR[0] - 30, floor - 6]]));
    }
    return (
      <Group>
        <Fig path={torso} />
        {legs.map((p, i) => (
          <Fig key={`leg${i}`} path={p} tone="trousers" />
        ))}
        {shoes.map((p, i) => (
          <FigureMass key={`shoe${i}`} path={p} tone="shoe" />
        ))}
        <Limb pts={[[sR[0] - 5, sR[1] + 20], eR]} w={88} />
        <Limb pts={[[sL[0] + 5, sL[1] + 20], eL]} w={88} />
        <Head cx={hc[0]} cy={hc[1]} r={f.head.r} neckY={sR[1] - 26} />
      </Group>
    );
  }
  // From above: the shoulders and arms, the legs, the head (the nose toward the audience).
  const z0 = f.torso.min.z;
  const z1 = f.torso.max.z;
  const shoulders = smooth([
    [sR[0] - 40, (z0 + z1) / 2 + 20],
    [sR[0], z0 + 30],
    [sL[0], z0 + 30],
    [sL[0] + 40, (z0 + z1) / 2 + 20],
    [sL[0] - 10, z1 + 4],
    [sR[0] + 10, z1 + 4],
  ]);
  const kR = ep(view, f.kneeR);
  const kL = ep(view, f.kneeL);
  const legs =
    f.seat === 'chair'
      ? [smooth([[kR[0] - 70, z1 - 10], [kR[0] + 70, z1 - 10], [kR[0] + 60, kR[1] + 40], [kR[0] - 60, kR[1] + 40]]), smooth([[kL[0] - 70, z1 - 10], [kL[0] + 70, z1 - 10], [kL[0] + 60, kL[1] + 40], [kL[0] - 60, kL[1] + 40]])]
      : [smooth([[kR[0] - 60, kR[1]], [(sR[0] + sL[0]) / 2, z1 - 20], [kL[0] + 60, kL[1]], [(kR[0] + kL[0]) / 2 + 60, Math.max(kR[1], kL[1]) + 110], [(kR[0] + kL[0]) / 2 - 60, Math.max(kR[1], kL[1]) + 110]])];
  return (
    <Group>
      {legs.map((p, i) => (
        <Fig key={`th${i}`} path={p} tone="trousers" />
      ))}
      <Fig path={shoulders} />
      <Limb pts={[[sR[0] + 10, (z0 + z1) / 2], eR]} w={82} />
      <Limb pts={[[sL[0] - 10, (z0 + z1) / 2], eL]} w={82} />
      <Head cx={hc[0]} cy={hc[1]} r={f.head.r * 0.95} above />
    </Group>
  );
}

/** Drawn AFTER the instrument: both forearms and hands. `fretDir` is the
 *  neck's direction in this view; `across` the neck's width there. */
export function PlayerHands({ sc, view, fretDir, across, pluckRot = 25 }: { sc: LuteScene; view: ViewId; fretDir: Pt; across: number; pluckRot?: number }) {
  const f = sc.fit;
  const eR = ep(view, f.elbowR);
  const eL = ep(view, f.elbowL);
  const pH = ep(view, f.pluckHand);
  const fH = ep(view, f.fretHand);
  return (
    <Group opacity={0.95}>
      <Limb pts={[eR, [pH[0] - 18, pH[1] - 8]]} w={74} />
      <Hand x={pH[0]} y={pH[1]} r={40} rot={pluckRot} />
      <Limb pts={[eL, [fH[0] + 4, fH[1] + across * 0.55]]} w={66} />
      <Hand x={fH[0] + 6} y={fH[1] + across * 0.55} r={36} rot={-10} />
      <Fingers at={fH} dir={fretDir} across={across * 1.3} />
    </Group>
  );
}

/** The floor line (front view) under the scene. */
export function FloorLine({ y, u0, u1, rug = false }: { y: number; u0: number; u1: number; rug?: boolean }) {
  return (
    <Group>
      <Path path={rr(u0, y, u1, y + 40, 0)}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + 40)} colors={['#2b2c31', '#141519']} />
      </Path>
      {rug ? (
        <Path path={rr(u0 + 60, y - 10, u1 - 60, y + 4, 4)}>
          <LinearGradient start={vec(u0, y - 10)} end={vec(u1, y + 4)} colors={PAL.rug as unknown as string[]} />
        </Path>
      ) : null}
      <Line p1={vec(u0, y)} p2={vec(u1, y)} color="#4a4d56" strokeWidth={3} />
    </Group>
  );
}
