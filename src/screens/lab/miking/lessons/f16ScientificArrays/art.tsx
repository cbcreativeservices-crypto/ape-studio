/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — the look (charter §2 layer
 * 3): the controlled room in section and plan — the floor with its taped
 * array axes and the marked origin (ticks every 25 cm along the baseline),
 * the test source on its stand at the centre point, the side point taped on
 * the floor, the walls, and you standing back — then the lesson's own pages.
 * FULLY SILENT; nothing moves by itself.
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make, Operator, rectP, TestSpeaker } from '../shared/measure/MeasureArt';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { CENTRE_PT, F16_OP_SIDE, F16_OP_TOP, FLOOR16, OP16, ROOM16, SIDE_PT, SRC16 } from './geometry.ts';
import { F16_PAGES, F16_STEP_COUNTS } from './pages';

const TAPE = '#e8c547';
const EDGE = '#07080a';

function buildRoom(view: ViewId) {
  const floor = make();
  const walls = make();
  const tape = make();
  const ticks = make();
  const xmark = make();
  if (view === 'side') {
    rectP(floor, ROOM16.back - 200, FLOOR16, ROOM16.front + 200, FLOOR16 + 60);
    rectP(walls, ROOM16.back - 200, -1000, ROOM16.back, FLOOR16 + 60);
    rectP(walls, ROOM16.front, -1000, ROOM16.front + 200, FLOOR16 + 60);
    // The axis toward the source taped on the floor (seen edge-on: a strip), the origin's tick.
    rectP(tape, -60, FLOOR16 - 6, CENTRE_PT.x, FLOOR16, 2);
    rectP(ticks, -6, FLOOR16 - 40, 6, FLOOR16, 2);
  } else {
    rectP(floor, ROOM16.back, -ROOM16.half, ROOM16.front, ROOM16.half);
    rectP(walls, ROOM16.back - 200, -ROOM16.half - 200, ROOM16.front + 200, -ROOM16.half);
    rectP(walls, ROOM16.back - 200, ROOM16.half, ROOM16.front + 200, ROOM16.half + 200);
    rectP(walls, ROOM16.back - 200, -ROOM16.half, ROOM16.back, ROOM16.half);
    rectP(walls, ROOM16.front, -ROOM16.half, ROOM16.front + 200, ROOM16.half);
    // The two axes taped on the floor: the baseline (z) and the axis toward the source (x).
    rectP(tape, -12, -1300, 12, 1300, 3);
    rectP(tape, -300, -12, CENTRE_PT.x, 12, 3);
    for (let z = -1250; z <= 1250; z += 250) rectP(ticks, -40, z - 6, 40, z + 6, 2);
    // The side point: a taped cross on the floor.
    xmark.moveTo(SIDE_PT.x - 120, SIDE_PT.z - 120);
    xmark.lineTo(SIDE_PT.x + 120, SIDE_PT.z + 120);
    xmark.moveTo(SIDE_PT.x - 120, SIDE_PT.z + 120);
    xmark.lineTo(SIDE_PT.x + 120, SIDE_PT.z - 120);
  }
  return { floor, walls, tape, ticks, xmark };
}

function Room({ view }: { view: ViewId }) {
  const p = useMemo(() => buildRoom(view), [view]);
  return (
    <Group>
      <Path path={p.floor}>
        <LinearGradient start={vec(ROOM16.back, view === 'side' ? FLOOR16 : -ROOM16.half)} end={vec(ROOM16.front, view === 'side' ? FLOOR16 + 60 : ROOM16.half)} colors={['#2c2d31', '#1d1e22']} />
      </Path>
      <Path path={p.walls}>
        <LinearGradient start={vec(ROOM16.back, 0)} end={vec(ROOM16.front, 0)} colors={['#45464c', '#2b2c30']} />
      </Path>
      <Path path={p.tape} color={TAPE} opacity={0.75} />
      <Path path={p.ticks} color={TAPE} />
      <Path path={p.xmark} style="stroke" strokeWidth={26} strokeCap="round" color={TAPE} opacity={0.8} />
      {view === 'top' ? (
        <Group>
          <Circle cx={0} cy={0} r={90} style="stroke" strokeWidth={16} color={TAPE} />
          <Circle cx={0} cy={0} r={22} color={TAPE} />
          <Circle cx={SIDE_PT.x} cy={SIDE_PT.z} r={170} style="stroke" strokeWidth={10} color={TAPE} opacity={0.4}>
            <DashPathEffect intervals={[30, 24]} />
          </Circle>
        </Group>
      ) : (
        <Path path={rectP(make(), -90, FLOOR16 - 14, 90, FLOOR16, 4)} color={TAPE} />
      )}
      <TestSpeaker g={SRC16} view={view} />
      <Operator pose={view === 'side' ? F16_OP_SIDE : F16_OP_TOP} />
      <Path path={p.walls} style="stroke" strokeWidth={4} color={EDGE} opacity={0.6} />
    </Group>
  );
}

function Scene({ view }: { view: ViewId }) {
  return <Room view={view} />;
}

const S = SRC16;
const HITS: SceneHits = {
  side: [
    { id: 'src', u0: S.front - 30, u1: S.front + S.depth, v0: S.top, v1: S.bottom },
    { id: 'src.stand', u0: S.front + S.depth / 2 - 190, u1: S.front + S.depth / 2 + 190, v0: S.bottom, v1: FLOOR16 },
    { id: 'origin', u0: -90, u1: 90, v0: FLOOR16 - 40, v1: FLOOR16 },
    { id: 'axes', u0: 90, u1: S.front - 300, v0: FLOOR16 - 8, v1: FLOOR16 },
    { id: 'op', u0: OP16.x - 260, u1: OP16.x + 260, v0: FLOOR16 - 1800, v1: FLOOR16 },
  ],
  top: [
    { id: 'src', u0: S.front - 30, u1: S.front + S.depth, v0: -S.half, v1: S.half },
    { id: 'src.stand', u0: S.front + S.depth / 2 - 190, u1: S.front + S.depth / 2 + 190, v0: -170, v1: 170 },
    { id: 'origin', u0: -95, u1: 95, v0: -95, v1: 95 },
    { id: 'axes', u0: -40, u1: 40, v0: -1300, v1: 1300 },
    { id: 'axes', u0: -300, u1: S.front - 200, v0: -20, v1: 20 },
    { id: 'side', u0: SIDE_PT.x - 130, u1: SIDE_PT.x + 130, v0: SIDE_PT.z - 130, v1: SIDE_PT.z + 130 },
    { id: 'op', u0: OP16.x - 280, u1: OP16.x + 280, v0: OP16.z - 280, v1: OP16.z + 280 },
  ],
};

const LABELS = {
  side: [
    { id: 'src', text: 'TEST SOURCE', short: 'SOURCE', u: S.front + S.depth / 2, v: S.top - 260, align: 'center' as const, at: { u: S.front + S.depth / 2, v: S.top } },
    { id: 'origin', text: 'ORIGIN', u: 0, v: FLOOR16 - 260, align: 'center' as const, at: { u: 0, v: FLOOR16 - 40 } },
    { id: 'op', text: 'YOU', u: OP16.x, v: FLOOR16 - 1900, align: 'center' as const },
  ],
  top: [
    { id: 'src', text: 'TEST SOURCE', short: 'SOURCE', u: S.front + S.depth / 2, v: -500, align: 'center' as const, at: { u: S.front + 100, v: -S.half } },
    { id: 'origin', text: 'ORIGIN', u: -420, v: 260, align: 'right' as const, at: { u: -70, v: 70 } },
    { id: 'axes', text: 'BASELINE AXIS', short: 'BASELINE', u: 160, v: -1150, align: 'left' as const, at: { u: 40, v: -1100 } },
    { id: 'side', text: 'SIDE POINT', u: SIDE_PT.x, v: SIDE_PT.z + 330, align: 'center' as const },
    { id: 'op', text: 'YOU', u: OP16.x, v: OP16.z - 380, align: 'center' as const },
  ],
};

export const F16_ART: LessonArt = {
  Instrument: Scene,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  pages: F16_PAGES,
  stepCounts: F16_STEP_COUNTS,
};
