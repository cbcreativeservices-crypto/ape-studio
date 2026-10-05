/**
 * The PLAYER round a lute, as a muted figure (charter §6: neighbours recede)
 * — a minimal line-art bald head (the house head spec), the torso, the arms
 * and hands, the legs: on a chair for the oud, cross-legged on the floor for
 * the sitar and the veena. Drawn from the scene's fit (luteModel.ts), the
 * same numbers the keep-outs are built from. Nothing moves (D8).
 *
 * The visual language matches the guitar family's figures (GuitarArt.tsx);
 * its helpers are local there, so the few shapes are drawn here again rather
 * than reaching into another family's file.
 */
import { Circle, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import type { LuteScene } from './luteModel.ts';
import { DEG, ep, make, oval, PAL, rr, smooth, type Pt, type SkPath } from './luteDraw';

const FIG = PAL.fig as unknown as string[];
const SKIN = PAL.skin as unknown as string[];
const EDGE = PAL.figEdge;

export function Head({ cx, cy, r, above = false }: { cx: number; cy: number; r: number; above?: boolean }) {
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r * 0.92}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.3} colors={SKIN} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.92} style="stroke" strokeWidth={3} color={EDGE} />
      {above ? (
        <Line p1={vec(cx, cy + r * 0.88)} p2={vec(cx, cy + r * 1.12)} color={EDGE} strokeWidth={3} />
      ) : (
        <>
          <Path path={oval(cx - r * 0.95, cy + r * 0.05, r * 0.12, r * 0.22)} style="stroke" strokeWidth={2.4} color={EDGE} />
          <Path path={oval(cx + r * 0.95, cy + r * 0.05, r * 0.12, r * 0.22)} style="stroke" strokeWidth={2.4} color={EDGE} />
        </>
      )}
    </Group>
  );
}

function Fig({ path, from, to }: { path: SkPath; from: Pt; to: Pt }) {
  return (
    <>
      <Path path={path}>
        <LinearGradient start={vec(from[0], from[1])} end={vec(to[0], to[1])} colors={FIG} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={2.5} color={EDGE} opacity={0.9} />
    </>
  );
}

export function Limb({ pts, w }: { pts: Pt[]; w: number }) {
  const p = make();
  p.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) p.lineTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const m: Pt = i === pts.length - 2 ? pts[i + 1] : [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  const a = pts[0];
  const b = pts[pts.length - 1];
  return (
    <>
      <Path path={p} style="stroke" strokeWidth={w + 6} strokeCap="round" strokeJoin="round" color={EDGE} />
      <Path path={p} style="stroke" strokeWidth={w} strokeCap="round" strokeJoin="round">
        <LinearGradient start={vec(a[0] - w, a[1] - w)} end={vec(b[0] + w, b[1] + w)} colors={FIG} />
      </Path>
    </>
  );
}

export function Hand({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot * DEG }]}>
      <Path path={oval(0, 0, r * 1.15, r * 0.8)}>
        <RadialGradient c={vec(-r * 0.4, -r * 0.4)} r={r * 1.6} colors={SKIN} />
      </Path>
      <Path path={oval(-r * 0.7, -r * 0.55, r * 0.38, r * 0.24)} color={SKIN[1]} />
      <Path path={oval(0, 0, r * 1.15, r * 0.8)} style="stroke" strokeWidth={2.5} color={EDGE} />
    </Group>
  );
}

/** Fingers laid across a neck at `at` (view coords), the neck running along `dir`. */
export function Fingers({ at, dir, across, n = 3 }: { at: Pt; dir: Pt; across: number; n?: number }) {
  const l = Math.hypot(dir[0], dir[1]) || 1;
  const d: Pt = [dir[0] / l, dir[1] / l];
  const a = Math.atan2(d[1], d[0]);
  const p = make();
  for (let k = 0; k < n; k++) p.addRRect(Skia.RRectXY(Skia.XYWHRect(-k * 24 - 8, -across / 2, 16, across), 8, 8));
  return (
    <Group transform={[{ translateX: at[0] }, { translateY: at[1] }, { rotate: a }]}>
      <Path path={p}>
        <LinearGradient start={vec(-60, -across / 2)} end={vec(0, across / 2)} colors={SKIN} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={2} color={EDGE} />
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
        <Fig path={torso} from={[sR[0], sR[1]]} to={[sL[0], hipY]} />
        {legs.map((p, i) => (
          <Fig key={`leg${i}`} path={p} from={[sR[0] - 100, hipY]} to={[sL[0] + 100, floor]} />
        ))}
        {shoes.map((p, i) => (
          <Path key={`shoe${i}`} path={p} color="#121317" />
        ))}
        <Limb pts={[[sR[0] - 5, sR[1] + 20], eR]} w={88} />
        <Limb pts={[[sL[0] + 5, sL[1] + 20], eL]} w={88} />
        <Path path={rr(hc[0] - 34, hc[1] + f.head.r * 0.8, hc[0] + 34, sR[1] - 18, 10)} color={SKIN[1]} />
        <Head cx={hc[0]} cy={hc[1]} r={f.head.r} />
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
        <Fig key={`th${i}`} path={p} from={[kR[0], z1]} to={[kL[0], kL[1] + 60]} />
      ))}
      <Fig path={shoulders} from={[sR[0], z0]} to={[sL[0], z1]} />
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
