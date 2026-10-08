/**
 * F02 CLOTHING AND BODY MOVEMENT — the look (charter §2 layer 3), drawn from
 * the model only (geometry.ts): side u = x, v = y (from the artist's right);
 * top u = x, v = z.
 *
 *   HELD  the artist standing, a leather jacket gathered between the hands
 *         at chest height, its body and a sleeve hanging below — a real
 *         garment with its collar, zip and seams, lit from the upper left.
 *   WORN  the artist walking in place in the jacket: the jacket's body over
 *         the torso, the near sleeve over the near arm.
 *   LIVE  the held jacket at a fixed station, the station's front rail and
 *         the PA beside the stage.
 * The stage floor is plain boards (no pit). Static (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { poseCovers } from '../shared/foley/performer.ts';
import { BoothArt, PitSection, StageFloorPlan } from '../shared/foley/StageArt';
import { liveBooth } from '../shared/foley/stage.ts';
import { PoleOperatorArt } from '../shared/fieldmics/FieldMicArt';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { make } from '../shared/concert/paths.ts';
import { F02_MODEL, FLOOR, JACKET, posesOf, WEARER } from './geometry.ts';
import { F02_ZONES } from './model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const V = F02_MODEL.views;
const BOOTH = liveBooth(FLOOR);
export const LEATHER = ['#8a5a36', '#64391d', '#432410', '#2a1608'];
const SEAM = '#1c0f06';

function smoothClosed(pts: readonly [number, number][]): SkPath {
  const p = make();
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[n - 1], pts[0]);
  p.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  p.close();
  return p;
}

/** The held jacket (side: folded over the hands and hanging; top: gathered across the hands). */
export function HeldJacket({ view }: { view: ViewId }) {
  const g = useMemo(() => {
    if (view === 'side') {
      const body = smoothClosed([
        [-70, -40],
        [-10, -62],
        [70, -36],
        [92, 60],
        [80, 200],
        [96, JACKET.hangs],
        [20, JACKET.hangs + 20],
        [-60, JACKET.hangs - 10],
        [-90, 180],
        [-96, 40],
      ]);
      const sleeve = smoothClosed([
        [40, 40],
        [90, 70],
        [140, 260],
        [150, 400],
        [110, 410],
        [92, 270],
        [50, 120],
      ]);
      const folds = make();
      folds.moveTo(-60, 10);
      folds.quadTo(0, 40, 70, 0);
      folds.moveTo(-70, 120);
      folds.quadTo(-10, 150, 60, 110);
      folds.moveTo(-50, 230);
      folds.quadTo(10, 260, 70, 240);
      const zip = make();
      zip.moveTo(-20, -50);
      zip.cubicTo(-30, 100, -10, 220, 0, JACKET.hangs + 10);
      return { body, sleeve, folds, zip };
    }
    const A = JACKET.across;
    const body = smoothClosed([
      [-60, -A],
      [30, -A - 20],
      [70, -A / 2],
      [60, 0],
      [72, A / 2],
      [30, A + 20],
      [-60, A],
      [-80, 0],
    ]);
    const sleeve = smoothClosed([
      [20, A - 20],
      [140, A + 10],
      [200, A + 60],
      [170, A + 100],
      [30, A + 40],
    ]);
    const folds = make();
    for (const z of [-A * 0.6, -A * 0.2, A * 0.2, A * 0.6]) {
      folds.moveTo(-50, z);
      folds.quadTo(0, z + 18, 55, z - 6);
    }
    const zip = make();
    zip.moveTo(-70, 0);
    zip.lineTo(66, 0);
    return { body, sleeve, folds, zip };
  }, [view]);
  const b = g.body.getBounds();
  return (
    <Group>
      <Path path={g.sleeve}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#6e4527', '#432410', '#2a1608']} />
      </Path>
      <Path path={g.sleeve} style="stroke" strokeWidth={2.4} color={SEAM} />
      <Path path={g.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={LEATHER} />
      </Path>
      <Path path={g.folds} style="stroke" strokeWidth={5} strokeCap="round" color="#1f1006" opacity={0.6} />
      <Group transform={[{ translateX: -2 }, { translateY: -3 }]}>
        <Path path={g.folds} style="stroke" strokeWidth={2.4} strokeCap="round" color="#c89a6e" opacity={0.45} />
      </Group>
      <Path path={g.zip} style="stroke" strokeWidth={3.2} color="#c7ccd4" opacity={0.75}>
        <DashPathEffect intervals={[5, 3]} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={2.6} color={SEAM} />
    </Group>
  );
}

/** The worn jacket, side view: its body over the torso, the near sleeve over the near arm. */
function WornJacket({ part }: { part: 'body' | 'sleeve' }) {
  const b = WEARER;
  const g = useMemo(() => {
    const n = b.neck;
    const body = smoothClosed([
      [n.x + 30, n.y + 10],
      [n.x + 120, n.y + 80],
      [n.x + 140, n.y + 300],
      [n.x + 135, n.y + 590],
      [n.x - 165, n.y + 595],
      [n.x - 175, n.y + 300],
      [n.x - 150, n.y + 60],
      [n.x - 60, n.y + 5],
    ]);
    const sleeve = make();
    sleeve.moveTo(b.shR.x, b.shR.y + 20);
    sleeve.lineTo(b.elR.x, b.elR.y);
    sleeve.lineTo(b.wrR.x + (b.elR.x - b.wrR.x) * 0.18, b.wrR.y + (b.elR.y - b.wrR.y) * 0.18);
    const zip = make();
    zip.moveTo(n.x + 110, n.y + 70);
    zip.lineTo(n.x + 132, n.y + 585);
    const hem = make();
    hem.moveTo(n.x + 135, n.y + 560);
    hem.lineTo(n.x - 165, n.y + 565);
    return { body, sleeve, zip, hem };
  }, [b]);
  if (part === 'sleeve') {
    return (
      <Group>
        <Path path={g.sleeve} style="stroke" strokeWidth={128} strokeCap="round" strokeJoin="round" color={SEAM} />
        <Path path={g.sleeve} style="stroke" strokeWidth={122} strokeCap="round" strokeJoin="round">
          <LinearGradient start={vec(b.shR.x - 80, b.shR.y)} end={vec(b.wrR.x + 80, b.wrR.y)} colors={LEATHER} />
        </Path>
        <Group transform={[{ translateX: -10 }, { translateY: -6 }]}>
          <Path path={g.sleeve} style="stroke" strokeWidth={10} strokeCap="round" strokeJoin="round" color="#c89a6e" opacity={0.3} />
        </Group>
      </Group>
    );
  }
  const bb = g.body.getBounds();
  return (
    <Group>
      <Path path={g.body}>
        <LinearGradient start={vec(bb.x, bb.y)} end={vec(bb.x + bb.width, bb.y + bb.height)} colors={LEATHER} />
      </Path>
      <Path path={g.zip} style="stroke" strokeWidth={4} color="#c7ccd4" opacity={0.7}>
        <DashPathEffect intervals={[6, 4]} />
      </Path>
      <Path path={g.hem} style="stroke" strokeWidth={4} color={SEAM} opacity={0.8} />
      <Path path={g.body} style="stroke" strokeWidth={2.6} color={SEAM} />
    </Group>
  );
}

export function ClothingArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const P = posesOf(variant);
  const live = variant === 'live';
  const worn = variant === 'worn';
  if (view === 'top') {
    const t = V.top!;
    return (
      <Group>
        <StageFloorPlan u0={t.u0 - 200} u1={t.u1 + 200} v0={t.v0 - 200} v1={t.v1 + 200} />
        {live ? <BoothArt view="top" rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
        <PlayerBehind pose={P.top} />
        {worn ? null : <HeldJacket view="top" />}
        <PlayerInFront pose={P.top} />
      </Group>
    );
  }
  const s = V.side!;
  return (
    <Group>
      <PitSection surface="concrete" floorY={FLOOR} u0={s.u0 - 200} u1={s.u1 + 200} pit={false} />
      {live ? <BoothArt view="side" floorY={FLOOR} rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
      <PlayerBehind pose={P.side} />
      {worn ? <WornJacket part="body" /> : null}
      {worn ? null : <HeldJacket view="side" />}
      <PlayerInFront pose={P.side} />
      {worn ? <WornJacket part="sleeve" /> : null}
    </Group>
  );
}

export function clothingLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const live = variant === 'live';
  const worn = variant === 'worn';
  const out: ArtLabel[] = [];
  if (view === 'side') {
    out.push(worn ? { id: 'jacket', text: 'SLEEVE PAST THE BODY', short: 'SLEEVE', u: 260, v: 260, align: 'left', at: { u: 20, v: 60 } } : { id: 'jacket', text: 'LEATHER JACKET', short: 'JACKET', u: 260, v: 230, align: 'left', at: { u: 90, v: 160 } });
    if (!worn) out.push({ id: 'fold', text: 'THE FOLD', u: 240, v: -150, align: 'left', at: { u: 30, v: -20 } });
    if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 420, align: 'center', at: { u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 330 } });
    return out;
  }
  out.push({ id: 'jacket', text: worn ? 'JACKET, WORN' : 'JACKET, HELD', short: 'JACKET', u: 260, v: -320, align: 'left', at: { u: 40, v: -120 } });
  if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x - 260, v: BOOTH.pa.p.z, align: 'right', at: { u: BOOTH.pa.p.x - 200, v: BOOTH.pa.p.z } });
  return out;
}

export function clothingHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const live = variant === 'live';
  const worn = variant === 'worn';
  const P = posesOf(variant);
  if (view === 'side') {
    if (!worn && u >= -110 - tol && u <= 160 + tol && v >= -70 - tol && v <= JACKET.hangs + 80 + tol) return Math.hypot(u, v) < 70 + tol ? 'f02.hands' : 'f02.jacketHeld';
    if (worn && u >= WEARER.neck.x - 180 - tol && u <= WEARER.neck.x + 150 + tol && v >= WEARER.neck.y - tol && v <= WEARER.neck.y + 600 + tol) return 'f02.jacketWorn';
    if (live && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && v >= BOOTH.pa.p.y - 340 - tol && v <= BOOTH.pa.p.y + 340 + tol) return 'f02.pa';
    if (live && u >= BOOTH.rail.x - tol && u <= BOOTH.rail.x + 60 + tol && v >= FLOOR - BOOTH.rail.h - tol) return 'f02.booth';
    if (poseCovers(P.side, u, v, tol)) return 'f02.artist';
    return null;
  }
  if (!worn && Math.abs(u) <= 110 + tol && Math.abs(v) <= JACKET.across + 40 + tol) return 'f02.jacketHeld';
  if (live && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && Math.abs(v - BOOTH.pa.p.z) <= 300 + tol) return 'f02.pa';
  if (live && u >= BOOTH.rail.x - tol && u <= BOOTH.rail.x + 60 + tol) return 'f02.booth';
  if (poseCovers(P.top, u, v, tol)) return worn ? 'f02.jacketWorn' : 'f02.artist';
  return null;
}

export const F02_ART: LessonArt = {
  Instrument: ClothingArt,
  labels: clothingLabels,
  hitTest: clothingHitTest,
  figureAt: (view, variant, u, v, tol) => poseCovers(view === 'side' ? posesOf(variant).side : posesOf(variant).top, u, v, tol),
  labelObstacles: voiceLabelObstacles(F02_ZONES),
  labelsYieldToMic: true,
  PoleOperator: PoleOperatorArt,
};
