/**
 * M07a CONCERT BASS DRUM — the look (charter §2 layer 3), drawn ONLY from the
 * anchors in geometry.ts, in millimetres of the view's (u, v): side u = x,
 * v = y; top u = x, v = z. The player stands at the RIGHT (+x).
 *
 * Both views are CUTAWAYS, the kick's way (M01 art.tsx): the side view cut at
 * z = 0, the top view at y = 0 — ply cut faces brightest, the far inner wall
 * dim, the hoops' end grain on the cut and their far halves edge-on, the
 * T-rods and lugs at the silhouette. The tilting stand is drawn where the cut
 * leaves it visible: the far upright and the base under the drum (side), the
 * rails and casters beside it (top). The mallet is in the player's hand
 * (illustrative). Nothing moves (D8); every path is built once per view.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { Mallet } from '../shared/concert/Mallets';
import { CAVITY, CHROME, CHROME_DARK, FLOOR, HEAD_CALF, HEAD_COATED, HOOP_CUT, HOOP_FAR, INK, PLY, PLY_LINE, make, oval, rect, rrect, seg, type SkPath } from '../shared/concert/paths.ts';
import { HOOP, HOOP_X, MALLET, STAND } from './geometry.ts';
import { D, FLOOR_Y, MID_X, R, SPEC } from './model.ts';

const T = SPEC.tShell.mm;
const RIN = R - T;

type Built = ReturnType<typeof build>;
const cache: Partial<Record<ViewId, Built>> = {};

function build(view: ViewId) {
  const x0 = -D;
  const x1 = 0;
  const wallTop = rect(make(), x0, -R, x1, -RIN);
  const wallBot = rect(make(), x0, RIN, x1, R);
  const plyLines = make();
  for (let i = 1; i < SPEC.plies; i++) {
    const t = (T * i) / SPEC.plies;
    seg(plyLines, x0, -R + t, x1, -R + t);
    seg(plyLines, x0, R - t, x1, R - t);
  }
  const outerEdge = seg(seg(make(), x0, -R, x1, -R), x0, R, x1, R);
  const innerEdge = seg(seg(make(), x0, -RIN, x1, -RIN), x0, RIN, x1, RIN);
  const gloss = seg(seg(make(), x0, -R + 0.7, x1, -R + 0.7), x0, R - 0.7, x1, R - 0.7);
  const cavity = rect(make(), x0, -RIN, x1, RIN);
  const grain = make();
  for (let k = 1; k < 16; k++) {
    const y = RIN * Math.cos((Math.PI * k) / 16);
    seg(grain, x0, y, x1, y);
  }
  const shadeP = rect(make(), -46, -RIN, 0, RIN);
  const shadeF = rect(make(), x0, -RIN, x0 + 46, RIN);
  const hoopFar = rect(rect(make(), HOOP_X.playing[0], -HOOP.rIn, HOOP_X.playing[1], HOOP.rIn), HOOP_X.far[0], -HOOP.rIn, HOOP_X.far[1], HOOP.rIn);
  const hoopCut = make();
  for (const [a, b] of [HOOP_X.playing, HOOP_X.far]) {
    rrect(hoopCut, a, -HOOP.rOut, b, -HOOP.rIn, 2.5);
    rrect(hoopCut, a, HOOP.rIn, b, HOOP.rOut, 2.5);
  }
  const playing = rect(make(), -2.5, -R - 2, 2.5, R + 2);
  const far = rect(make(), -D - 2.5, -R - 2, -D + 2.5, R + 2);
  // Silhouette hardware: a claw on each hoop, a T-rod to a lug (both edges).
  const rods = make();
  const tees = make();
  const lugs = make();
  const claws = make();
  const rr = HOOP.rOut + 12;
  for (const sg of [-1, 1]) {
    for (const end of [0, 1]) {
      const X = (x: number) => (end === 0 ? x : -D - x);
      const out = HOOP_X.playing[1];
      rrect(claws, X(out + 4), sg * (HOOP.rOut + 1), X(-6), sg * (HOOP.rOut + 6), 1.5);
      rrect(tees, X(out + 16), sg * (rr - 8), X(out + 8), sg * (rr + 8), 2);
      seg(rods, X(out + 9), sg * rr, X(-60), sg * rr);
      rrect(lugs, X(-48), sg * R, X(-84), sg * (R + 26), 7);
    }
  }
  // The stand (drawing defaults), as the cut leaves it visible.
  const legs = make();
  const base = make();
  const wheels = make();
  if (view === 'side') {
    rrect(legs, MID_X - 16, R + 30, MID_X + 16, STAND.railY, 8);
    rrect(base, STAND.x0 - 20, STAND.railY - 14, STAND.x1 + 20, STAND.railY + 14, 7);
    for (const x of [STAND.x0, STAND.x1]) oval(wheels, x, FLOOR_Y - STAND.casterR, STAND.casterR, STAND.casterR);
  } else {
    for (const sz of [-1, 1]) {
      rrect(base, STAND.x0 - 20, sz * STAND.z - 18, STAND.x1 + 20, sz * STAND.z + 18, 9);
      oval(legs, MID_X, sz * STAND.z, 30, 30);
      for (const x of [STAND.x0, STAND.x1]) rrect(wheels, x - 34, sz * STAND.z - 24, x + 34, sz * STAND.z + 24, 12);
    }
  }
  const floor = rect(make(), -3000, FLOOR_Y, 3000, FLOOR_Y + 600);
  const floorEdge = seg(make(), -3000, FLOOR_Y, 3000, FLOOR_Y);
  const shadow = oval(make(), MID_X, FLOOR_Y + 2, STAND.x1 - STAND.x0, 12);
  const topShadow = rrect(make(), HOOP_X.far[0] + 10, -HOOP.rOut + 14, HOOP_X.playing[1] + 10, HOOP.rOut + 14, 30);
  return { wallTop, wallBot, plyLines, outerEdge, innerEdge, gloss, cavity, grain, shadeP, shadeF, hoopFar, hoopCut, playing, far, rods, tees, lugs, claws, legs, base, wheels, floor, floorEdge, shadow, topShadow };
}

const get = (v: ViewId): Built => (cache[v] ??= build(v));

function StandArt({ g }: { g: Built }) {
  return (
    <>
      <Path path={g.legs}>
        <LinearGradient start={vec(MID_X - 20, 0)} end={vec(MID_X + 20, 0)} colors={CHROME} />
      </Path>
      <Path path={g.legs} style="stroke" strokeWidth={1} color={INK} />
      <Path path={g.base}>
        <LinearGradient start={vec(0, -20)} end={vec(0, 20)} colors={['#6b707b', '#3a3d45', '#1b1c21']} />
      </Path>
      <Path path={g.base} style="stroke" strokeWidth={1} color={INK} />
      <Path path={g.wheels} color="#141519" />
      <Path path={g.wheels} style="stroke" strokeWidth={3} color="#6c717c" />
    </>
  );
}

export function ConcertBassDrumArt({ view }: { view: ViewId; variant: VariantId }) {
  const g = get(view);
  const side = view === 'side';
  return (
    <Group>
      {side ? (
        <>
          <Path path={g.floor}>
            <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 60)} colors={FLOOR} />
          </Path>
          <Path path={g.shadow} color="#000" opacity={0.6}>
            <BlurMask blur={10} style="normal" />
          </Path>
          <Path path={g.floorEdge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
          <StandArt g={g} />
        </>
      ) : (
        <>
          <Path path={g.topShadow} color="#000" opacity={0.55}>
            <BlurMask blur={16} style="normal" />
          </Path>
          <StandArt g={g} />
        </>
      )}
      <Path path={g.hoopFar}>
        <LinearGradient start={vec(HOOP_X.playing[0], 0)} end={vec(HOOP_X.playing[1], 0)} colors={HOOP_FAR} />
      </Path>
      <Path path={g.cavity}>
        <LinearGradient start={vec(0, -RIN)} end={vec(0, RIN)} colors={CAVITY} positions={[0, 0.16, 0.38, 0.62, 0.86, 1]} />
      </Path>
      <Path path={g.cavity}>
        <RadialGradient c={vec(-D * 0.7, -RIN * 0.45)} r={D * 1.6} colors={['rgba(255,214,160,0.08)', 'rgba(255,214,160,0)']} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={0.9} color="#d9a766" opacity={0.12} />
      <Path path={g.shadeP}>
        <LinearGradient start={vec(0, 0)} end={vec(-46, 0)} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>
      <Path path={g.shadeF}>
        <LinearGradient start={vec(-D, 0)} end={vec(-D + 46, 0)} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>
      <Path path={g.wallTop}>
        <LinearGradient start={vec(0, -R)} end={vec(0, -RIN)} colors={PLY} />
      </Path>
      <Path path={g.wallBot}>
        <LinearGradient start={vec(0, R)} end={vec(0, RIN)} colors={PLY} />
      </Path>
      <Path path={g.plyLines} style="stroke" strokeWidth={0.35} color={PLY_LINE} opacity={0.75} />
      <Path path={g.outerEdge} style="stroke" strokeWidth={1.4} color="#140b05" />
      <Path path={g.gloss} style="stroke" strokeWidth={1.1} color="#ffe2ae" opacity={0.55} />
      <Path path={g.innerEdge} style="stroke" strokeWidth={1} color={INK} opacity={0.9} />
      <Path path={g.playing}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={HEAD_COATED} />
      </Path>
      <Path path={g.far}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={HEAD_CALF} />
      </Path>
      <Path path={g.hoopCut}>
        <LinearGradient start={vec(HOOP_X.playing[0], 0)} end={vec(HOOP_X.playing[1], 0)} colors={HOOP_CUT} />
      </Path>
      <Path path={g.hoopCut} style="stroke" strokeWidth={1} color={INK} />
      <Path path={g.lugs}>
        <LinearGradient start={vec(0, -R - 26)} end={vec(0, R + 26)} colors={CHROME} />
      </Path>
      <Path path={g.lugs} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={g.rods} style="stroke" strokeWidth={4.4} strokeCap="round" color={CHROME_DARK} />
      <Path path={g.rods} style="stroke" strokeWidth={1.5} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.claws} color="#b6bbc5" />
      <Path path={g.tees} color="#c6cad4" />
      <Path path={g.tees} style="stroke" strokeWidth={0.8} color={INK} />
      {side ? (
        <>
          <Circle cx={MID_X} cy={0} r={22} color="#2a2c32" opacity={0.85} />
          <Circle cx={MID_X} cy={0} r={22} style="stroke" strokeWidth={2} color="#8a8f99" opacity={0.85} />
          <Mallet kind="bass" grip={{ x: MALLET.grip.x, y: MALLET.grip.y }} head={{ x: MALLET.head.x, y: MALLET.head.y }} />
        </>
      ) : (
        <Mallet kind="bass" grip={{ x: MALLET.grip.x, y: MALLET.grip.z }} head={{ x: MALLET.head.x, y: MALLET.head.z }} />
      )}
    </Group>
  );
}

export function concertBassDrumLabels(view: ViewId): ArtLabel[] {
  const out: ArtLabel[] = [
    { id: 'playing', text: 'PLAYING HEAD', short: 'PLAYING', u: 30, v: -HOOP.rOut - 40, align: 'left' },
    { id: 'far', text: 'FAR HEAD', short: 'FAR', u: -D - 30, v: -HOOP.rOut - 40, align: 'right' },
  ];
  if (view === 'side') {
    out.push({ id: 'stand', text: 'STAND (BRAKES LOCKED)', short: 'STAND', u: MID_X, v: FLOOR_Y - 120, align: 'center', tone: 'illustrative' });
    out.push({ id: 'mallet', text: 'MALLET', u: 600, v: -300, align: 'center', tone: 'illustrative' });
    out.push({ id: 'player', text: 'PLAYER →', u: 960, v: 220, align: 'right', tone: 'muted' });
    out.push({ id: 'pivot', text: 'PIVOT', u: MID_X + 40, v: 36, align: 'left', tone: 'muted' });
  } else {
    out.push({ id: 'player', text: 'PLAYER →', u: 960, v: -560, align: 'right', tone: 'muted' });
    out.push({ id: 'cond', text: 'CONDUCTOR ↓', short: 'COND. ↓', u: MID_X, v: 1080, align: 'center', tone: 'muted' });
    out.push({ id: 'rods', text: 'RODS ON BOTH HEADS', short: 'RODS', u: MID_X, v: HOOP.rOut + 110, align: 'center', tone: 'illustrative' });
  }
  return out;
}

export function concertBassDrumHitTest(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  if (Math.abs(u) <= tol + 3 && Math.abs(v) <= R + tol) return 'cbd.playing';
  if (Math.abs(u + D) <= tol + 3 && Math.abs(v) <= R + tol) return 'cbd.far';
  if (u >= 40 && u <= MALLET.grip.x + tol && Math.abs(v - (view === 'side' ? MALLET.head.y : MALLET.head.z)) <= 60 + tol) return 'cbd.mallet';
  if (view === 'side') {
    if (u >= STAND.x0 - 30 && u <= STAND.x1 + 30 && v >= R + 20 && v <= FLOOR_Y + tol) return 'cbd.stand';
  } else if (u >= STAND.x0 - 30 && u <= STAND.x1 + 30 && Math.abs(Math.abs(v) - STAND.z) <= 40 + tol) return 'cbd.stand';
  if (u >= HOOP_X.playing[0] - tol && u <= HOOP_X.playing[1] + tol && Math.abs(v) <= HOOP.rOut + tol) return 'cbd.hoopP';
  if (u > -D && u < 0 && Math.abs(v) >= R - 4 && Math.abs(v) <= R + 44 + tol) return 'cbd.rods';
  if (u > -D && u < 0 && Math.abs(v) <= R) return 'cbd.shell';
  return null;
}

export type { SkPath };
