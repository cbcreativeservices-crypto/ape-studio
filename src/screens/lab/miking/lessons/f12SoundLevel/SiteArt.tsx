/**
 * F12 — the SITE, drawn (charter §2 layer 3): a house by a road, in section
 * (the 'side' view: x across, height up) and in plan ('top': x across, z
 * along the facade). The lawn and its grass, the house with its gable roof,
 * windows and foundation, its facade toward the road, the air-handling unit
 * beside it, a paved path, the road with its kerb and edge line, and the
 * power line on its poles along the verge with its 3 m (10 ft) keep-out ring
 * (section). Quiet colours (nothing competes with the meter, its zones and
 * its readouts), upper-left light. All sizes from geometry.ts; nothing moves.
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../engine/model/types.ts';
import { make, rectP } from '../shared/measure/MeasureArt';
import { F12_VIEWS, HOUSE, HVAC, POWER, ROAD } from './geometry.ts';

const PATH_Z = { z0: -2500, z1: -1900 };

function buildSide() {
  const b = F12_VIEWS.side;
  const soil = rectP(make(), b.u0 - 500, 0, b.u1 + 500, b.v1 + 400);
  const grass = make();
  for (let x = b.u0 - 400; x < ROAD.x0; x += 90) {
    grass.moveTo(x, 0);
    grass.lineTo(x + 25, -70 - ((x * 7) % 50));
  }
  const road = rectP(make(), ROAD.x0, 0, b.u1 + 500, 140);
  const kerb = rectP(make(), ROAD.x0 - 160, -140, ROAD.x0, 60, 20);
  // The house in section: the side wall with siding, a foundation band, two storeys of windows, a gable roof.
  const wall = rectP(make(), HOUSE.x0, -HOUSE.eaves, HOUSE.x1, 0);
  const siding = make();
  for (let y = -HOUSE.eaves + 220; y < -320; y += 220) {
    siding.moveTo(HOUSE.x0 + 10, y);
    siding.lineTo(HOUSE.x1 - 10, y);
  }
  const found = rectP(make(), HOUSE.x0, -320, HOUSE.x1, 0);
  const windows = make();
  for (const [x0, x1] of [[-5800, -4600], [-2800, -1600]] as const) {
    rectP(windows, x0, -4500, x1, -3300, 30);
    rectP(windows, x0, -2050, x1, -850, 30);
  }
  const mullions = make();
  for (const [x0, x1] of [[-5800, -4600], [-2800, -1600]] as const) {
    for (const [y0, y1] of [[-4500, -3300], [-2050, -850]] as const) {
      mullions.moveTo((x0 + x1) / 2, y0);
      mullions.lineTo((x0 + x1) / 2, y1);
      mullions.moveTo(x0, (y0 + y1) / 2);
      mullions.lineTo(x1, (y0 + y1) / 2);
    }
  }
  const roof = make();
  roof.moveTo(HOUSE.x0 - 300, -HOUSE.eaves + 60);
  roof.lineTo((HOUSE.x0 + HOUSE.x1) / 2, -HOUSE.ridge);
  roof.lineTo(HOUSE.x1 + 300, -HOUSE.eaves + 60);
  roof.lineTo(HOUSE.x1 + 300, -HOUSE.eaves + 200);
  roof.lineTo((HOUSE.x0 + HOUSE.x1) / 2, -HOUSE.ridge + 160);
  roof.lineTo(HOUSE.x0 - 300, -HOUSE.eaves + 200);
  roof.close();
  const gable = make();
  gable.moveTo(HOUSE.x0, -HOUSE.eaves);
  gable.lineTo((HOUSE.x0 + HOUSE.x1) / 2, -HOUSE.ridge + 160);
  gable.lineTo(HOUSE.x1, -HOUSE.eaves);
  gable.close();
  const hvac = rectP(make(), HVAC.x0, -HVAC.h, HVAC.x1, 0, 40);
  const louvres = make();
  for (let y = -HVAC.h + 120; y < -60; y += 90) {
    louvres.moveTo(HVAC.x0 + 60, y);
    louvres.lineTo(HVAC.x1 - 60, y);
  }
  const fan = rectP(make(), HVAC.x0 + 90, -HVAC.h - 70, HVAC.x1 - 90, -HVAC.h, 30);
  // The pole, its cross-arm, an insulator and the conductor (seen end-on: the line runs along the road).
  const pole = make();
  pole.moveTo(POWER.x - 130, 0);
  pole.lineTo(POWER.x - 95, -POWER.h - 900);
  pole.lineTo(POWER.x + 95, -POWER.h - 900);
  pole.lineTo(POWER.x + 130, 0);
  pole.close();
  const arm = rectP(make(), POWER.x - 750, -POWER.h - 420, POWER.x + 750, -POWER.h - 300, 20);
  const insul = rectP(make(), POWER.x - 45, -POWER.h - 300, POWER.x + 45, -POWER.h - 70, 20);
  return { soil, grass, road, kerb, wall, siding, found, windows, mullions, roof, gable, hvac, louvres, fan, pole, arm, insul };
}

function buildTop() {
  const b = F12_VIEWS.top;
  const lawn = rectP(make(), b.u0 - 500, b.v0 - 500, ROAD.x0, b.v1 + 500);
  const stripes = make();
  for (let z = b.v0 - 500; z < b.v1 + 500; z += 1200) rectP(stripes, b.u0 - 500, z, ROAD.x0 - 200, z + 600);
  const path = rectP(make(), 0, PATH_Z.z0, ROAD.x0 - 160, PATH_Z.z1);
  const road = rectP(make(), ROAD.x0, b.v0 - 500, b.u1 + 500, b.v1 + 500);
  const kerb = rectP(make(), ROAD.x0 - 160, b.v0 - 500, ROAD.x0, b.v1 + 500);
  const edgeLine = make();
  edgeLine.moveTo(ROAD.x0 + 250, b.v0 - 500);
  edgeLine.lineTo(ROAD.x0 + 250, b.v1 + 500);
  const centre = make();
  centre.moveTo(ROAD.x1 - 60, b.v0 - 500);
  centre.lineTo(ROAD.x1 - 60, b.v1 + 500);
  const mid = (HOUSE.x0 + HOUSE.x1) / 2;
  const roofA = rectP(make(), HOUSE.x0 - 300, HOUSE.z0 - 300, mid, HOUSE.z1 + 300);
  const roofB = rectP(make(), mid, HOUSE.z0 - 300, HOUSE.x1 + 250, HOUSE.z1 + 300);
  const tiles = make();
  for (let x = HOUSE.x0 - 100; x < HOUSE.x1 + 250; x += 260) {
    tiles.moveTo(x, HOUSE.z0 - 300);
    tiles.lineTo(x, HOUSE.z1 + 300);
  }
  const ridge = make();
  ridge.moveTo(mid, HOUSE.z0 - 300);
  ridge.lineTo(mid, HOUSE.z1 + 300);
  const step = rectP(make(), 0, PATH_Z.z0 - 100, 700, PATH_Z.z1 + 100, 30);
  const hvac = rectP(make(), HVAC.x0, HVAC.z0, HVAC.x1, HVAC.z1, 50);
  const fanR = Math.min(HVAC.x1 - HVAC.x0, HVAC.z1 - HVAC.z0) * 0.38;
  const fanC = { x: (HVAC.x0 + HVAC.x1) / 2, z: (HVAC.z0 + HVAC.z1) / 2 };
  const guard = make();
  for (const k of [0.35, 0.7, 1]) guard.addCircle(fanC.x, fanC.z, fanR * k);
  const wire = make();
  wire.moveTo(POWER.x, b.v0 - 500);
  wire.lineTo(POWER.x, b.v1 + 500);
  return { lawn, stripes, path, road, kerb, edgeLine, centre, roofA, roofB, tiles, ridge, step, hvac, guard, fanC, fanR, wire };
}

export function SiteArt({ view }: { view: ViewId }) {
  const s = useMemo(() => (view === 'side' ? buildSide() : null), [view]);
  const t = useMemo(() => (view === 'top' ? buildTop() : null), [view]);
  if (s) {
    return (
      <Group>
        <Path path={s.soil}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 900)} colors={['#2c2a24', '#1a1915']} />
        </Path>
        <Path path={s.road}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 140)} colors={['#3a3b3f', '#24252a']} />
        </Path>
        <Path path={s.kerb} color="#6a6b70" />
        <Path path={s.grass} style="stroke" strokeWidth={22} strokeCap="round" color="#3d5a35" opacity={0.85} />
        {/* the house */}
        <Path path={s.gable}>
          <LinearGradient start={vec(HOUSE.x0, -HOUSE.ridge)} end={vec(HOUSE.x1, -HOUSE.eaves)} colors={['#5d5a54', '#3d3b37']} />
        </Path>
        <Path path={s.wall}>
          <LinearGradient start={vec(HOUSE.x0, -HOUSE.eaves)} end={vec(HOUSE.x1, 0)} colors={['#625f58', '#45433e', '#33312d']} />
        </Path>
        <Path path={s.siding} style="stroke" strokeWidth={18} color="#2b2a27" opacity={0.6} />
        <Path path={s.found} color="#2a2927" />
        <Path path={s.windows}>
          <LinearGradient start={vec(HOUSE.x0, -4500)} end={vec(HOUSE.x1, -850)} colors={['#3d5068', '#1f2a38']} />
        </Path>
        <Path path={s.windows} style="stroke" strokeWidth={60} color="#d9d6cc" opacity={0.75} />
        <Path path={s.mullions} style="stroke" strokeWidth={40} color="#d9d6cc" opacity={0.7} />
        <Path path={s.roof}>
          <LinearGradient start={vec(HOUSE.x0, -HOUSE.ridge)} end={vec(HOUSE.x1, -HOUSE.eaves)} colors={['#6b4a3a', '#3e2a21']} />
        </Path>
        <Path path={s.roof} style="stroke" strokeWidth={40} color="#0b0b0c" />
        <Path path={s.wall} style="stroke" strokeWidth={40} color="#0b0b0c" />
        {/* the air unit */}
        <Path path={s.hvac}>
          <LinearGradient start={vec(HVAC.x0, -HVAC.h)} end={vec(HVAC.x1, 0)} colors={['#a3a7ae', '#62666e']} />
        </Path>
        <Path path={s.louvres} style="stroke" strokeWidth={22} color="#2c2e33" />
        <Path path={s.fan} color="#2c2e33" />
        <Path path={s.hvac} style="stroke" strokeWidth={30} color="#0b0b0c" />
        {/* the power line's pole, cross-arm and conductor, with its keep-out */}
        <Path path={s.pole}>
          <LinearGradient start={vec(POWER.x - 130, 0)} end={vec(POWER.x + 130, 0)} colors={['#6e5a44', '#3f3225']} />
        </Path>
        <Path path={s.arm} color="#4a3b2c" />
        <Path path={s.insul} color="#9fb4c4" />
        <Circle cx={POWER.x} cy={-POWER.h} r={60} color="#c9ccd2" />
        <Circle cx={POWER.x} cy={-POWER.h} r={POWER.keep} color="#ff6b5e" opacity={0.07} />
        <Circle cx={POWER.x} cy={-POWER.h} r={POWER.keep} style="stroke" strokeWidth={40} color="#ff6b5e" opacity={0.8}>
          <DashPathEffect intervals={[220, 160]} />
        </Circle>
      </Group>
    );
  }
  if (!t) return <Group />;
  return (
    <Group>
      <Path path={t.lawn}>
        <LinearGradient start={vec(-2000, -7000)} end={vec(7000, 5000)} colors={['#2f4329', '#24331f']} />
      </Path>
      <Path path={t.stripes} color="#3a5233" opacity={0.25} />
      <Path path={t.path} color="#5c5a55" />
      <Path path={t.road}>
        <LinearGradient start={vec(ROAD.x0, 0)} end={vec(ROAD.x1, 0)} colors={['#36373b', '#2a2b2f']} />
      </Path>
      <Path path={t.kerb} color="#77787d" />
      <Path path={t.edgeLine} style="stroke" strokeWidth={100} color="#d9d6cc" opacity={0.8} />
      <Path path={t.centre} style="stroke" strokeWidth={110} color="#e8c547" opacity={0.85}>
        <DashPathEffect intervals={[1800, 1200]} />
      </Path>
      <Path path={t.step} color="#77746d" />
      {/* the roof from above: two planes either side of the ridge, lit from the upper left */}
      <Path path={t.roofA}>
        <LinearGradient start={vec(HOUSE.x0, HOUSE.z0)} end={vec(HOUSE.x1, HOUSE.z1)} colors={['#7a5544', '#5a3d30']} />
      </Path>
      <Path path={t.roofB}>
        <LinearGradient start={vec(HOUSE.x0, HOUSE.z0)} end={vec(HOUSE.x1, HOUSE.z1)} colors={['#4f362b', '#3a2820']} />
      </Path>
      <Path path={t.tiles} style="stroke" strokeWidth={22} color="#2a1c16" opacity={0.55} />
      <Path path={t.ridge} style="stroke" strokeWidth={80} color="#24180f" />
      <Path path={t.roofA} style="stroke" strokeWidth={40} color="#0b0b0c" />
      <Path path={t.roofB} style="stroke" strokeWidth={40} color="#0b0b0c" />
      <Path path={t.hvac}>
        <LinearGradient start={vec(HVAC.x0, HVAC.z0)} end={vec(HVAC.x1, HVAC.z1)} colors={['#a3a7ae', '#5f636b']} />
      </Path>
      <Circle cx={t.fanC.x} cy={t.fanC.z} r={t.fanR} color="#24262b" />
      <Path path={t.guard} style="stroke" strokeWidth={18} color="#8a8e96" />
      <Path path={t.hvac} style="stroke" strokeWidth={30} color="#0b0b0c" />
      <Path path={t.wire} style="stroke" strokeWidth={70} color="#0b0b0c" />
      <Path path={t.wire} style="stroke" strokeWidth={36} color="#c9ccd2" />
      {POWER.poles.map((z) => (
        <Group key={z}>
          <Circle cx={POWER.x} cy={z} r={170} color="#5b4a37" />
          <Circle cx={POWER.x} cy={z} r={170} style="stroke" strokeWidth={30} color="#0b0b0c" />
        </Group>
      ))}
    </Group>
  );
}
