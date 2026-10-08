/**
 * THE VENUE, drawn (charter §2 layer 3; the seat plan is venue.ts): a small
 * venue in section ('side': x down the room, height up) and in plan ('top').
 * The audience floor, the raised stage with its front skirt, the wall behind
 * the stage and the rear wall with its door, ten rows of seats with a centre
 * aisle, the standing area behind them; the two mains on their stands at the
 * stage's corners, the front fill on the lip, the subwoofer on the floor.
 * Built by Lab 6 group 5 (F14); shared, so a later system lesson draws the
 * same room. Quiet colours, upper-left light; sizes from venue.ts. Nothing
 * moves.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { make, rectP, TestSpeaker, type TestSpeakerGeom } from './MeasureArt';
import { VENUE } from './venue.ts';

const V = VENUE;
const EDGE = '#07080a';

const mainGeom = (z: number): TestSpeakerGeom => ({ front: V.main.x, depth: V.main.depth, top: -V.main.h - V.main.top, bottom: -V.main.h + V.main.bottom, half: V.main.half, woofer: { y: -V.main.h + 120, r: 190 }, tweeter: { y: -V.main.h - 200, r: 55 }, floorY: -V.stage.deck, z });
const FILL_G: TestSpeakerGeom = { front: V.fill.x, depth: V.fill.depth, top: -V.stage.deck - V.fill.h, bottom: -V.stage.deck, half: V.fill.half, woofer: { y: -V.stage.deck - 105, r: 72 }, tweeter: { y: -V.stage.deck - 235, r: 18 }, floorY: -V.stage.deck, stand: false };

/* ── the subwoofer: a deep cabinet, one large driver, a port slot ── */

function buildSub(view: ViewId) {
  const { x0, x1, h, half } = V.sub;
  const box = make();
  if (view === 'side') rectP(box, x0, -h, x1, 0, 26);
  else rectP(box, x0, -half, x1, half, 26);
  const baffle = make();
  if (view === 'side') rectP(baffle, x1 - 26, -h + 6, x1, -6, 8);
  else rectP(baffle, x1 - 26, -half + 6, x1, half - 6, 8);
  // The large cone in profile, standing a little proud of the baffle; a port slot beside it.
  const cone = make();
  const c = view === 'side' ? -h * 0.52 : 0;
  const r = 230;
  cone.moveTo(x1, c - r);
  cone.quadTo(x1 + 34, c - r * 0.85, x1 + 22, c - r * 0.55);
  cone.lineTo(x1 + 14, c);
  cone.lineTo(x1 + 22, c + r * 0.55);
  cone.quadTo(x1 + 34, c + r * 0.85, x1, c + r);
  cone.close();
  const cap = rectP(make(), x1, c - r * 0.3, x1 + 26, c + r * 0.3, r * 0.2);
  const port = make();
  if (view === 'side') rectP(port, x1 - 6, -h + 22, x1 + 3, -h + 62, 4);
  else rectP(port, x1 - 6, half - 150, x1 + 3, half - 40, 4);
  const feet = make();
  if (view === 'side') {
    rectP(feet, x0 + 30, -16, x0 + 110, 0, 4);
    rectP(feet, x1 - 110, -16, x1 - 30, 0, 4);
  }
  return { box, baffle, cone, cap, port, feet };
}

export function SubCab({ view }: { view: ViewId }) {
  const p = useMemo(() => buildSub(view), [view]);
  const b = p.box.getBounds();
  return (
    <Group>
      <Group transform={[{ translateX: -14 }, { translateY: 18 }]}>
        <Path path={p.box} color="#000" opacity={0.45}>
          <BlurMask blur={22} style="normal" />
        </Path>
      </Group>
      <Path path={p.feet} color="#15161a" />
      <Path path={p.box}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#45484f', '#25272c', '#121316']} />
      </Path>
      <Path path={p.baffle}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#575b64', '#2f3238']} />
      </Path>
      <Path path={p.port} color="#050506" />
      <Path path={p.cone}>
        <LinearGradient start={vec(b.x + b.width, b.y)} end={vec(b.x + b.width + 40, b.y + b.height)} colors={['#666b75', '#2a2d33', '#111215']} />
      </Path>
      <Path path={p.cap}>
        <LinearGradient start={vec(b.x + b.width, b.y)} end={vec(b.x + b.width + 30, b.y + b.height)} colors={['#b9bec8', '#4c5058']} />
      </Path>
      <Path path={p.box} style="stroke" strokeWidth={6} color={EDGE} />
      <Path path={p.box} style="stroke" strokeWidth={3} color="#c9cfda" opacity={0.16} />
    </Group>
  );
}

/* ── the room ── */

function buildSide() {
  const floor = rectP(make(), V.room.back - 200, 0, V.room.rear + 200, 110);
  const boards = make();
  for (let x = 0; x < V.room.rear; x += 300) {
    boards.moveTo(x, 6);
    boards.lineTo(x, 104);
  }
  const deck = rectP(make(), V.stage.x0, -V.stage.deck, V.stage.x1, 0);
  const deckTop = rectP(make(), V.stage.x0, -V.stage.deck, V.stage.x1, -V.stage.deck + 70);
  const skirt = make();
  for (let y = -V.stage.deck + 110; y < -20; y += 90) {
    skirt.moveTo(V.stage.x1 - 30, y);
    skirt.lineTo(V.stage.x1, y + 40);
  }
  const walls = make();
  rectP(walls, V.room.back - 200, -3600, V.room.back, 110);
  rectP(walls, V.room.rear, -3600, V.room.rear + 200, 110);
  const door = rectP(make(), V.room.rear - 70, -2100, V.room.rear, 0, 8);
  // A seat in profile per row (the near seats): a pan, a back, a leg.
  const seats = make();
  for (const x of V.rows) {
    const s = make();
    s.moveTo(x - 230, -450);
    s.lineTo(x + 230, -450);
    s.lineTo(x + 230, -400);
    s.lineTo(x + 270, -400);
    s.lineTo(x + 300, -880);
    s.lineTo(x + 250, -890);
    s.lineTo(x + 215, -470);
    s.lineTo(x - 230, -470);
    s.close();
    seats.addPath(s);
    rectP(seats, x - 30, -420, x + 30, 0, 8);
  }
  // The standing area's rail: a low barrier at its front edge.
  const rail = make();
  rectP(rail, V.standing.x0 - 300, -1050, V.standing.x0 - 260, 0, 10);
  rectP(rail, V.standing.x0 - 340, -1080, V.standing.x0 - 220, -1030, 12);
  return { floor, boards, deck, deckTop, skirt, walls, door, seats, rail };
}

function buildTop() {
  const H = V.room.half;
  const floor = rectP(make(), V.room.back, -H, V.room.rear, H);
  const boards = make();
  for (let z = -H + 300; z < H; z += 300) {
    boards.moveTo(0, z);
    boards.lineTo(V.room.rear, z);
  }
  const deck = rectP(make(), V.stage.x0, -H, V.stage.x1, H);
  const deckBoards = make();
  for (let x = V.stage.x0 + 250; x < V.stage.x1; x += 250) {
    deckBoards.moveTo(x, -H);
    deckBoards.lineTo(x, H);
  }
  const walls = make();
  rectP(walls, V.room.back - 200, -H - 200, V.room.rear + 200, -H);
  rectP(walls, V.room.back - 200, H, V.room.rear + 200, H + 200);
  rectP(walls, V.room.back - 200, -H, V.room.back, H);
  rectP(walls, V.room.rear, -H, V.room.rear + 200, -1400);
  rectP(walls, V.room.rear, -400, V.room.rear + 200, H);
  const leaf = make();
  leaf.moveTo(V.room.rear, -400);
  leaf.lineTo(V.room.rear - 1000, -400);
  const seats = make();
  const backs = make();
  for (const x of V.rows)
    for (const z of V.seatsZ) {
      rectP(seats, x - 230, z - 230, x + 230, z + 230, 50);
      rectP(backs, x + 160, z - 230, x + 260, z + 230, 30);
    }
  const standing = rectP(make(), V.standing.x0, -H + 200, V.standing.x1, H - 200, 40);
  const rail = rectP(make(), V.standing.x0 - 320, -H + 200, V.standing.x0 - 240, H - 200, 20);
  return { floor, boards, deck, deckBoards, walls, leaf, seats, backs, standing, rail };
}

export function VenueArt({ view }: { view: ViewId }) {
  const s = useMemo(() => (view === 'side' ? buildSide() : null), [view]);
  const t = useMemo(() => (view === 'top' ? buildTop() : null), [view]);
  if (s) {
    return (
      <Group>
        <Path path={s.walls}>
          <LinearGradient start={vec(0, -3600)} end={vec(0, 0)} colors={['#3a3b40', '#26272b']} />
        </Path>
        <Path path={s.floor}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 110)} colors={['#4f3c2c', '#33271c']} />
        </Path>
        <Path path={s.boards} style="stroke" strokeWidth={8} color="#2a2018" opacity={0.7} />
        <Path path={s.door} color="#5d4a38" />
        <Path path={s.deck}>
          <LinearGradient start={vec(0, -V.stage.deck)} end={vec(0, 0)} colors={['#2f3035', '#18191c']} />
        </Path>
        <Path path={s.deckTop}>
          <LinearGradient start={vec(0, -V.stage.deck)} end={vec(0, -V.stage.deck + 70)} colors={['#5a4a3a', '#3b3026']} />
        </Path>
        <Path path={s.skirt} style="stroke" strokeWidth={10} color="#101113" opacity={0.8} />
        <Path path={s.deck} style="stroke" strokeWidth={8} color={EDGE} />
        <Path path={s.seats}>
          <LinearGradient start={vec(0, -900)} end={vec(0, 0)} colors={['#4b3a52', '#2c2231']} />
        </Path>
        <Path path={s.seats} style="stroke" strokeWidth={12} color="#0b0b0c" />
        <Path path={s.rail}>
          <LinearGradient start={vec(V.standing.x0 - 340, 0)} end={vec(V.standing.x0 - 220, 0)} colors={['#a3a8b1', '#4d5159']} />
        </Path>
        <SubCab view="side" />
        <TestSpeaker g={mainGeom(-V.main.z)} view="side" />
        <TestSpeaker g={FILL_G} view="side" />
      </Group>
    );
  }
  if (!t) return <Group />;
  return (
    <Group>
      <Path path={t.floor}>
        <LinearGradient start={vec(0, -V.room.half)} end={vec(V.room.rear, V.room.half)} colors={['#4a3a2b', '#33281e']} />
      </Path>
      <Path path={t.boards} style="stroke" strokeWidth={8} color="#2a2018" opacity={0.6} />
      <Path path={t.standing}>
        <RadialGradient c={vec((V.standing.x0 + V.standing.x1) / 2, 0)} r={V.room.half} colors={['#3c3a36', '#2a2925']} />
      </Path>
      <Path path={t.deck}>
        <LinearGradient start={vec(V.stage.x0, -V.room.half)} end={vec(V.stage.x1, V.room.half)} colors={['#4e4033', '#33291f']} />
      </Path>
      <Path path={t.deckBoards} style="stroke" strokeWidth={8} color="#241c15" opacity={0.7} />
      <Path path={t.deck} style="stroke" strokeWidth={10} color={EDGE} />
      <Path path={t.seats}>
        <LinearGradient start={vec(2000, -4000)} end={vec(12000, 4000)} colors={['#4b3a52', '#33283a']} />
      </Path>
      <Path path={t.backs} color="#241b28" />
      <Path path={t.seats} style="stroke" strokeWidth={12} color="#0b0b0c" />
      <Path path={t.rail} color="#7d828c" />
      <Path path={t.walls}>
        <LinearGradient start={vec(V.room.back, -V.room.half)} end={vec(V.room.rear, V.room.half)} colors={['#45464c', '#2b2c30']} />
      </Path>
      <Path path={t.leaf} style="stroke" strokeWidth={50} color="#8a7058" />
      <SubCab view="top" />
      <TestSpeaker g={mainGeom(-V.main.z)} view="top" />
      <TestSpeaker g={mainGeom(V.main.z)} view="top" />
      <TestSpeaker g={{ ...FILL_G, z: 0 }} view="top" />
    </Group>
  );
}
