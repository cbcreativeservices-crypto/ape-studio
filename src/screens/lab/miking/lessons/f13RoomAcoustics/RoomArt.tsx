/**
 * F13 — the ROOM, drawn (charter §2 layer 3): a rehearsal or small concert
 * room in section ('side': x down the room, height up) and in plan ('top').
 * The wooden floor, the walls and ceiling with their thickness, the door in
 * the rear wall, the side-wall curtains, the air-handling vent in the
 * ceiling, six rows of seats with an aisle; in the ROOM state the omni test
 * source on its stand at the performer position, in the PA state the two
 * house loudspeakers on tall stands. Quiet colours, upper-left light; sizes
 * from geometry.ts. Nothing moves.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { make, OmniSource, rectP, TestSpeaker, type TestSpeakerGeom } from '../shared/measure/MeasureArt';
import { F13_FLOOR, PA13, ROOM13, ROWS, SEATS_Z, SRC_R } from './geometry.ts';

const TOP = F13_FLOOR - ROOM13.ceiling;
const WALL = 160;

function buildSide() {
  const floor = rectP(make(), ROOM13.back - WALL, F13_FLOOR, ROOM13.front + WALL, F13_FLOOR + 90);
  const boards = make();
  for (let x = ROOM13.back + 150; x < ROOM13.front; x += 150) {
    boards.moveTo(x, F13_FLOOR + 4);
    boards.lineTo(x, F13_FLOOR + 86);
  }
  const ceiling = rectP(make(), ROOM13.back - WALL, TOP - 90, ROOM13.front + WALL, TOP);
  const walls = make();
  rectP(walls, ROOM13.back - WALL, TOP - 90, ROOM13.back, F13_FLOOR + 90);
  rectP(walls, ROOM13.front, TOP - 90, ROOM13.front + WALL, F13_FLOOR + 90);
  const door = rectP(make(), ROOM13.front - 60, F13_FLOOR - 2100, ROOM13.front, F13_FLOOR, 6);
  const vent = rectP(make(), 3600, TOP, 4400, TOP + 70, 10);
  const slats = make();
  for (let x = 3650; x < 4380; x += 90) {
    slats.moveTo(x, TOP + 10);
    slats.lineTo(x, TOP + 62);
  }
  // A seat in profile per row (the near seats): a seat pan, a back, a leg.
  const seats = make();
  for (const x of ROWS) {
    const s = make();
    s.moveTo(x - 230, F13_FLOOR - 450);
    s.lineTo(x + 230, F13_FLOOR - 450);
    s.lineTo(x + 230, F13_FLOOR - 400);
    s.lineTo(x + 270, F13_FLOOR - 400);
    s.lineTo(x + 300, F13_FLOOR - 880);
    s.lineTo(x + 250, F13_FLOOR - 890);
    s.lineTo(x + 215, F13_FLOOR - 470);
    s.lineTo(x - 230, F13_FLOOR - 470);
    s.close();
    seats.addPath(s);
    rectP(seats, x - 30, F13_FLOOR - 420, x + 30, F13_FLOOR, 8);
  }
  return { floor, boards, ceiling, walls, door, vent, slats, seats };
}

function buildTop() {
  const floor = rectP(make(), ROOM13.back, -ROOM13.half, ROOM13.front, ROOM13.half);
  const boards = make();
  for (let z = -ROOM13.half + 150; z < ROOM13.half; z += 150) {
    boards.moveTo(ROOM13.back, z);
    boards.lineTo(ROOM13.front, z);
  }
  const walls = make();
  rectP(walls, ROOM13.back - WALL, -ROOM13.half - WALL, ROOM13.front + WALL, -ROOM13.half);
  rectP(walls, ROOM13.back - WALL, ROOM13.half, ROOM13.front + WALL, ROOM13.half + WALL);
  rectP(walls, ROOM13.back - WALL, -ROOM13.half, ROOM13.back, ROOM13.half);
  rectP(walls, ROOM13.front, -ROOM13.half, ROOM13.front + WALL, ROOM13.door.z0);
  rectP(walls, ROOM13.front, ROOM13.door.z1, ROOM13.front + WALL, ROOM13.half);
  // The door leaf ajar 30° on its hinge (clash sweep 2026-10-10: drawn wide
  // open along the wall, it ran through the last row's aisle seat).
  const leaf = make();
  const dw = ROOM13.door.z1 - ROOM13.door.z0;
  const ajar = (30 * Math.PI) / 180;
  leaf.moveTo(ROOM13.front, ROOM13.door.z1);
  leaf.lineTo(ROOM13.front - dw * Math.sin(ajar), ROOM13.door.z1 - dw * Math.cos(ajar));
  // The curtains along the right-hand side wall: a folded line.
  const curtain = make();
  curtain.moveTo(1500, ROOM13.half - 60);
  for (let x = 1500, i = 0; x < 7600; x += 160, i++) curtain.quadTo(x + 80, ROOM13.half - (i % 2 ? 150 : 10), x + 160, ROOM13.half - 70);
  const seats = make();
  for (const x of ROWS) for (const z of SEATS_Z) rectP(seats, x - 230, z - 230, x + 230, z + 230, 50);
  const backs = make();
  for (const x of ROWS) for (const z of SEATS_Z) rectP(backs, x + 160, z - 230, x + 260, z + 230, 30);
  const vent = rectP(make(), 3600, -400, 4400, 400, 10);
  return { floor, boards, walls, leaf, curtain, seats, backs, vent };
}

const PA_GEOM = (z: number): TestSpeakerGeom => ({ front: PA13.x, depth: PA13.depth, top: F13_FLOOR - PA13.h - PA13.top, bottom: F13_FLOOR - PA13.h + PA13.bottom, half: PA13.half, woofer: { y: F13_FLOOR - PA13.h + 110, r: 130 }, tweeter: { y: F13_FLOOR - PA13.h - 150, r: 40 }, floorY: F13_FLOOR, z });

export function RoomArt13({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = useMemo(() => (view === 'side' ? buildSide() : null), [view]);
  const t = useMemo(() => (view === 'top' ? buildTop() : null), [view]);
  const pa = variant === 'pa';
  if (s) {
    return (
      <Group>
        <Path path={s.ceiling} color="#2d2e33" />
        <Path path={s.walls}>
          <LinearGradient start={vec(0, TOP)} end={vec(0, F13_FLOOR)} colors={['#3a3b40', '#26272b']} />
        </Path>
        <Path path={s.floor}>
          <LinearGradient start={vec(0, F13_FLOOR)} end={vec(0, F13_FLOOR + 90)} colors={['#5a4532', '#3a2c20']} />
        </Path>
        <Path path={s.boards} style="stroke" strokeWidth={6} color="#2a2018" />
        <Path path={s.door} color="#5d4a38" />
        <Path path={s.vent} color="#55585f" />
        <Path path={s.slats} style="stroke" strokeWidth={10} color="#2a2c31" />
        <Path path={s.seats}>
          <LinearGradient start={vec(0, F13_FLOOR - 900)} end={vec(0, F13_FLOOR)} colors={['#4b3a52', '#2c2231']} />
        </Path>
        <Path path={s.seats} style="stroke" strokeWidth={10} color="#0b0b0c" />
        {pa ? <TestSpeaker g={PA_GEOM(-PA13.z)} view="side" /> : <OmniSource cu={0} cv={0} r={SRC_R} floorV={F13_FLOOR} />}
      </Group>
    );
  }
  if (!t) return <Group />;
  return (
    <Group>
      <Path path={t.floor}>
        <LinearGradient start={vec(ROOM13.back, -ROOM13.half)} end={vec(ROOM13.front, ROOM13.half)} colors={['#4a3a2b', '#33281e']} />
      </Path>
      <Path path={t.boards} style="stroke" strokeWidth={6} color="#2a2018" opacity={0.7} />
      <Path path={t.vent} color="#44474d" opacity={0.6} />
      <Path path={t.seats}>
        <LinearGradient start={vec(2000, -3000)} end={vec(7500, 3000)} colors={['#4b3a52', '#33283a']} />
      </Path>
      <Path path={t.backs} color="#241b28" />
      <Path path={t.seats} style="stroke" strokeWidth={10} color="#0b0b0c" />
      <Path path={t.curtain} style="stroke" strokeWidth={70} color="#6b2f35" />
      <Path path={t.walls}>
        <LinearGradient start={vec(ROOM13.back, -ROOM13.half)} end={vec(ROOM13.front, ROOM13.half)} colors={['#45464c', '#2b2c30']} />
      </Path>
      <Path path={t.leaf} style="stroke" strokeWidth={40} color="#8a7058" />
      {pa ? (
        <>
          <TestSpeaker g={PA_GEOM(-PA13.z)} view="top" />
          <TestSpeaker g={PA_GEOM(PA13.z)} view="top" />
        </>
      ) : (
        <OmniSource cu={0} cv={0} r={SRC_R} floorV={null} />
      )}
    </Group>
  );
}
