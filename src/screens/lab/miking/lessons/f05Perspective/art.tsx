/**
 * F05 FOLEY PERSPECTIVE — the look (charter §2 layer 3), on group 1's Foley
 * stage pieces (lessons/shared/foley): the stage floor, the artist carrying a
 * key ring at hand level, the marked 2 m path (spike tape at its ends and
 * its middle, arrows for the direction of travel), and LIVE: the station's
 * rail and the PA. Side u = x, v = y (from the artist's right); top u = x,
 * v = z. Static (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { poseCovers } from '../shared/foley/performer.ts';
import { BoothArt, PitSection, StageFloorPlan } from '../shared/foley/StageArt';
import { liveBooth } from '../shared/foley/stage.ts';
import { KeyRing } from '../shared/foley/props';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { ARTIST_SIDE, ARTIST_TOP, F05_FLOOR, F05_MODEL, HALF_PATH, LANE } from './geometry.ts';
import { F05_ZONES } from './model.ts';

const TOP = F05_MODEL.views.top!;
const SIDE = F05_MODEL.views.side!;
const BOOTH = liveBooth(F05_FLOOR);

/** The marked path in plan: spike tape at both ends and the middle, a dashed line, arrows. */
export function PathMarks() {
  const g = useMemo(() => {
    const tape = Skia.Path.Make();
    for (const z of [HALF_PATH, 0, -HALF_PATH]) {
      tape.moveTo(-120, z);
      tape.lineTo(120, z);
    }
    const line = Skia.Path.Make();
    line.moveTo(0, HALF_PATH);
    line.lineTo(0, -HALF_PATH);
    const arrows = Skia.Path.Make();
    for (const z of [HALF_PATH * 0.55, -HALF_PATH * 0.45]) {
      arrows.moveTo(-60, z + 70);
      arrows.lineTo(0, z - 30);
      arrows.lineTo(60, z + 70);
    }
    return { tape, line, arrows };
  }, []);
  return (
    <Group>
      <Path path={g.line} style="stroke" strokeWidth={18} color="#ffc64d" opacity={0.55}>
        <DashPathEffect intervals={[90, 60]} />
      </Path>
      <Path path={g.arrows} style="stroke" strokeWidth={18} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.7} />
      <Path path={g.tape} style="stroke" strokeWidth={40} color="#e8e2c8" opacity={0.9} />
    </Group>
  );
}

/** The stage seen from above, for the lesson's own pages (no artist: the keys move alone there). */
export function F05StagePlan({ live = false }: { live?: boolean }) {
  return (
    <Group>
      <StageFloorPlan u0={TOP.u0 - 1500} u1={TOP.u1 + 1500} v0={TOP.v0 - 1500} v1={TOP.v1 + 1500} />
      {live ? <BoothArt view="top" rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
      <PathMarks />
    </Group>
  );
}

export function PerspectiveArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const live = variant === 'live';
  if (view === 'top') {
    return (
      <Group>
        <StageFloorPlan u0={TOP.u0 - 200} u1={TOP.u1 + 200} v0={TOP.v0 - 200} v1={TOP.v1 + 200} />
        {live ? <BoothArt view="top" rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
        <PathMarks />
        <PlayerBehind pose={ARTIST_TOP} />
        <KeyRing view="top" />
        <PlayerInFront pose={ARTIST_TOP} />
      </Group>
    );
  }
  return (
    <Group>
      <PitSection surface="concrete" floorY={F05_FLOOR} u0={SIDE.u0 - 200} u1={SIDE.u1 + 200} pit={false} />
      {live ? <BoothArt view="side" floorY={F05_FLOOR} rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
      <PlayerBehind pose={ARTIST_SIDE} />
      <KeyRing view="side" />
      <PlayerInFront pose={ARTIST_SIDE} />
    </Group>
  );
}

export function perspectiveLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const live = variant === 'live';
  const out: ArtLabel[] = [];
  if (view === 'side') {
    out.push({ id: 'keys', text: 'KEY RING', short: 'KEYS', u: 260, v: -260, align: 'left', at: { u: 0, v: 30 } });
    if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 420, align: 'center', at: { u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 330 } });
    return out;
  }
  out.push({ id: 'keys', text: 'KEYS', u: 260, v: -200, align: 'left', at: { u: 0, v: 0 } });
  out.push({ id: 'path', text: 'MARKED PATH · 2 M', short: 'PATH', u: LANE.x1 + 140, v: HALF_PATH + 260, align: 'left', tone: 'muted', at: { u: 120, v: HALF_PATH } });
  if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x - 260, v: BOOTH.pa.p.z, align: 'right', at: { u: BOOTH.pa.p.x - 200, v: BOOTH.pa.p.z } });
  return out;
}

export function perspectiveHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const live = variant === 'live';
  if (Math.hypot(u, v - (view === 'side' ? 40 : 0)) <= 60 + tol) return 'f05.keys';
  if (live) {
    if (view === 'side' && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && v >= BOOTH.pa.p.y - 340 - tol && v <= BOOTH.pa.p.y + 340 + tol) return 'f05.pa';
    if (view === 'top' && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && Math.abs(v - BOOTH.pa.p.z) <= 300 + tol) return 'f05.pa';
    const onRail = view === 'side' ? v >= F05_FLOOR - BOOTH.rail.h - tol && v <= F05_FLOOR + tol : Math.abs(v) <= 1400 + tol;
    if (onRail && u >= BOOTH.rail.x - tol && u <= BOOTH.rail.x + 60 + tol) return 'f05.booth';
  }
  if (poseCovers(view === 'side' ? ARTIST_SIDE : ARTIST_TOP, u, v, tol)) return 'f05.artist';
  if (view === 'top' && Math.abs(u) <= 130 + tol && Math.abs(v) <= HALF_PATH + 30 + tol) return 'f05.path';
  return null;
}

export const F05_ART: LessonArt = {
  Instrument: PerspectiveArt,
  labels: perspectiveLabels,
  hitTest: perspectiveHitTest,
  figureAt: (view, _variant, u, v, tol) => poseCovers(view === 'side' ? ARTIST_SIDE : ARTIST_TOP, u, v, tol),
  labelObstacles: voiceLabelObstacles(F05_ZONES),
  labelsYieldToMic: true,
};
