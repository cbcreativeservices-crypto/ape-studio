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

/**
 * The held jacket (side: held up by the shoulders and hanging; top: gathered
 * across the hands). Art pass 2026-10-10 — the side view was a rounded sack
 * with a tail. A leather jacket of the usual cut (chest 560 mm flat, 650 mm
 * collar to hem, sleeve 640 mm; drawing defaults of the class), held at the
 * shoulders and partly gathered, so it hangs JACKET.hangs below the hands.
 * From the artist's right it is seen edge-on: the stand collar, the near
 * shoulder, the body's two panels hanging apart toward the hem, the zipped
 * front edge (toward the artist's front, +x), the knitted-look waistband, and
 * the near sleeve hanging from its shoulder seam with its cuff zip.
 */
export function HeldJacket({ view }: { view: ViewId }) {
  const g = useMemo(() => {
    if (view === 'side') {
      const H = JACKET.hangs;
      const body = smoothClosed([
        [-44, -54],
        [10, -66],
        [58, -40],
        [84, 40],
        [104, 170],
        [118, H - 10],
        [120, H + 8],
        [-74, H + 14],
        [-78, H - 10],
        [-84, 180],
        [-70, 50],
      ]);
      // The waistband: a 40 mm band across the hem.
      const band = make();
      band.moveTo(-78, H - 22);
      band.quadTo(20, H - 12, 119, H - 26);
      band.lineTo(122, H + 12);
      band.quadTo(20, H + 26, -76, H + 16);
      band.close();
      // The stand collar, folded over the hands' grip.
      const collar = smoothClosed([
        [-50, -60],
        [-10, -92],
        [46, -82],
        [62, -50],
        [20, -40],
        [-30, -40],
      ]);
      // The near sleeve from its shoulder seam: 150 mm at the top, 105 at
      // the cuff, an elbow bend, the cuff band.
      // (Hung behind the zipped front edge, which stays in view.)
      const sleeve = smoothClosed([
        [-12, -20],
        [44, -24],
        [62, 90],
        [68, 200],
        [80, 300],
        [86, H + 70],
        [-14, H + 76],
        [-12, 300],
        [-22, 190],
        [-32, 80],
      ]);
      const cuff = make();
      cuff.moveTo(-13, H + 34);
      cuff.lineTo(85, H + 30);
      const folds = make();
      folds.moveTo(0, 60);
      folds.quadTo(26, 110, 30, 170);
      folds.moveTo(6, 220);
      folds.quadTo(36, 250, 72, 240);
      folds.moveTo(-60, 90);
      folds.quadTo(-40, 160, -50, 240);
      folds.moveTo(-6, -30);
      folds.quadTo(30, -8, 70, -18); // the shoulder seam
      const zip = make();
      zip.moveTo(58, -42);
      zip.cubicTo(84, 40, 104, 170, 118, H - 22);
      const cuffZip = make();
      cuffZip.moveTo(80, H + 36);
      cuffZip.lineTo(84, H + 70); // the cuff zip
      const pull = make();
      pull.addRRect(Skia.RRectXY(Skia.XYWHRect(56, -40, 10, 24), 3, 3));
      cuff.addPath(cuffZip);
      return { body, sleeve, folds, zip, band, collar, cuff, pull };
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
    return { body, sleeve, folds, zip, band: null, collar: null, cuff: null, pull: null };
  }, [view]);
  const b = g.body.getBounds();
  return (
    <Group>
      {g.collar ? null : (
        <>
          <Path path={g.sleeve}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#6e4527', '#432410', '#2a1608']} />
          </Path>
          <Path path={g.sleeve} style="stroke" strokeWidth={2.4} color={SEAM} />
        </>
      )}
      <Path path={g.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={LEATHER} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={2.6} color={SEAM} />
      {g.band ? (
        <>
          <Path path={g.band} color="#2e190b" />
          <Path path={g.band} style="stroke" strokeWidth={2} color={SEAM} />
        </>
      ) : null}
      {g.collar ? (
        <>
          {/* Side: the near sleeve hangs over the body from its shoulder seam. */}
          <Path path={g.sleeve}>
            <LinearGradient start={vec(0, -30)} end={vec(130, JACKET.hangs + 80)} colors={['#946240', '#6a3f20', '#45250f', '#2a1608']} />
          </Path>
          <Path path={g.sleeve} style="stroke" strokeWidth={2.4} color={SEAM} />
          <Path path={g.cuff!} style="stroke" strokeWidth={2.2} color={SEAM} />
          <Path path={g.collar}>
            <LinearGradient start={vec(-50, -92)} end={vec(60, -40)} colors={['#7a4c2c', '#4a2912', '#2a1608']} />
          </Path>
          <Path path={g.collar} style="stroke" strokeWidth={2.2} color={SEAM} />
        </>
      ) : null}
      <Path path={g.folds} style="stroke" strokeWidth={5} strokeCap="round" color="#1f1006" opacity={0.6} />
      <Group transform={[{ translateX: -2 }, { translateY: -3 }]}>
        <Path path={g.folds} style="stroke" strokeWidth={2.4} strokeCap="round" color="#c89a6e" opacity={0.45} />
      </Group>
      <Path path={g.zip} style="stroke" strokeWidth={3.2} color="#c7ccd4" opacity={0.75}>
        <DashPathEffect intervals={[5, 3]} />
      </Path>
      {g.pull ? <Path path={g.pull} color="#c7ccd4" /> : null}
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
