/**
 * THE FIELD SITES, DRAWN (Lab 6 group 2; sites.ts holds the data): real
 * places in frame G, in PLAN ('top': u = x toward the scene, v = z the
 * array's right) and in ELEVATION ('side': u = x, v = y, everything seen
 * from the array's left, far things fainter). Illustrated, never primitive
 * stand-ins: lobed tree canopies lit from the upper left with their shadows,
 * a stream with its banks, ripples and stones, a gravel path, paving, a road
 * with its kerbs, lane lines and arrows, a building's roof and facade, a
 * café's parasols, a hedgerow, cars and a bus from above, people (the shared
 * standing figure), birds, a flock and a large animal, setback rings.
 *
 * Small living things are drawn at a readable size (`token`): a bird's
 * wingspan as about a metre, never a speck — the lessons say once that
 * animals are drawn larger. Everything else is at the site's drawn size.
 * Static (D8): nothing moves by itself. Mm throughout; strokes in mm.
 */
import { useMemo, type ReactElement } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { operatorSide, operatorTop } from '../measure/measureModel.ts';
import { seeded } from '../foley/StageArt';
import { bandPolygon, type FieldSite, type GroundKind, type SiteFeature, type XZ } from './sites.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const DEG = Math.PI / 180;

function polyPath(pts: readonly (readonly [number, number])[], close = true): SkPath {
  const p = make();
  pts.forEach(([a, b], i) => (i === 0 ? p.moveTo(a, b) : p.lineTo(a, b)));
  if (close) p.close();
  return p;
}
function rectP(p: SkPath, x0: number, y0: number, x1: number, y1: number, r = 0): SkPath {
  const R = Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
  if (r > 0) p.addRRect(Skia.RRectXY(R, r, r));
  else p.addRect(R);
  return p;
}

/* ── palette (muted; the mics, zones and readouts stay brightest) ── */
const GROUND: Readonly<Record<GroundKind, readonly [string, string]>> = {
  forest: ['#2b3424', '#1d2419'],
  meadow: ['#3a4a2a', '#2a3720'],
  lawn: ['#34492c', '#263822'],
  paving: ['#4d4c49', '#3a3936'],
  asphalt: ['#333438', '#26272b'],
};
const CANOPY = ['#5f7f45', '#3f5c2e', '#273b1d'];
const WATER = ['#4f7fa6', '#2f5677', '#1e3a52'];
const BANK = '#4a3b28';
const GRAVEL = ['#8a7f6a', '#6c6352'];
const PAVED = ['#77756f', '#5d5b56'];
const INK = '#0b0b0c';
const LANE_WHITE = '#d9d6cc';
const LANE_YELLOW = '#e8c547';
const RING = '#ff6b5e';

/** Circles merged into one outline (a true union: no inner seams). */
function unionCircles(circles: readonly [number, number, number][]): SkPath {
  let acc: SkPath | null = null;
  for (const [x, y, r] of circles) {
    const c = make();
    c.addCircle(x, y, r);
    acc = acc ? Skia.Path.MakeFromOp(acc, c, PathOp.Union) ?? acc : c;
  }
  return acc ?? make();
}
/** A lobed canopy outline seen from above. */
function canopyPath(cx: number, cz: number, R: number, seed: number): SkPath {
  const rnd = seeded(seed);
  const circles: [number, number, number][] = [[cx, cz, R * 0.72]];
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd() * 0.5;
    const d = R * (0.42 + rnd() * 0.12);
    circles.push([cx + Math.cos(a) * d, cz + Math.sin(a) * d, R * (0.42 + rnd() * 0.1)]);
  }
  return unionCircles(circles);
}
/** Leaf clumps inside a canopy (lighter dabs, upper-left heavier). */
function leafDabs(cx: number, cz: number, R: number, seed: number): SkPath {
  const rnd = seeded(seed * 7 + 3);
  const p = make();
  for (let k = 0; k < 22; k++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.85;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    p.addCircle(x, z, R * (0.07 + rnd() * 0.06));
  }
  return p;
}

function Tree({ f, view, seed }: { f: Extract<SiteFeature, { kind: 'tree' }>; view: ViewId; seed: number }) {
  const [cx, cz] = f.c;
  const R = f.canopy;
  const plan = useMemo(() => ({ c: canopyPath(cx, cz, R, seed), d: leafDabs(cx, cz, R, seed) }), [cx, cz, R, seed]);
  const elev = useMemo(() => {
    const top = -f.h;
    const bottom = -f.h + R * 1.5;
    const rnd = seeded(seed + 11);
    const lobes: [number, number, number][] = [[cx, top + R * 0.8, R * 0.78]];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + 0.3;
      lobes.push([cx + Math.cos(a) * R * 0.6, top + R * 0.8 + Math.sin(a) * R * 0.5, R * (0.36 + rnd() * 0.12)]);
    }
    const crown = unionCircles(lobes);
    const trunk = make();
    trunk.moveTo(cx - f.trunk * 1.3, 0);
    trunk.lineTo(cx - f.trunk * 0.6, bottom);
    trunk.lineTo(cx + f.trunk * 0.6, bottom);
    trunk.lineTo(cx + f.trunk * 1.3, 0);
    trunk.close();
    const bark = make();
    for (let y = bottom + 300; y < -200; y += 420) {
      bark.moveTo(cx - f.trunk * 0.7, y);
      bark.lineTo(cx - f.trunk * 0.2, y + 160);
    }
    return { crown, trunk, bark, top, bottom };
  }, [cx, R, f.h, f.trunk, seed]);
  if (view === 'top') {
    return (
      <Group>
        <Group transform={[{ translateX: R * 0.22 }, { translateY: R * 0.26 }]}>
          <Path path={plan.c} color="#000000" opacity={0.32} />
        </Group>
        <Path path={plan.c}>
          <RadialGradient c={vec(cx - R * 0.35, cz - R * 0.35)} r={R * 1.6} colors={CANOPY} />
        </Path>
        <Path path={plan.d} color="#7d9b5c" opacity={0.35} />
        <Path path={plan.c} style="stroke" strokeWidth={R * 0.03} color="#14200f" opacity={0.85} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={elev.trunk}>
        <LinearGradient start={vec(cx - f.trunk * 1.3, 0)} end={vec(cx + f.trunk * 1.3, 0)} colors={['#6e5640', '#4a3826', '#2c2017']} />
      </Path>
      <Path path={elev.bark} style="stroke" strokeWidth={f.trunk * 0.12} color="#20170f" opacity={0.7} />
      <Path path={elev.crown}>
        <RadialGradient c={vec(cx - R * 0.4, elev.top + R * 0.4)} r={R * 1.9} colors={CANOPY} />
      </Path>
      <Path path={elev.crown} style="stroke" strokeWidth={R * 0.025} color="#14200f" opacity={0.8} />
    </Group>
  );
}

function Stream({ f, view }: { f: Extract<SiteFeature, { kind: 'stream' }>; view: ViewId }) {
  const g = useMemo(() => {
    const body = polyPath(bandPolygon(f.pts, f.width / 2));
    const bank = polyPath(bandPolygon(f.pts, f.width / 2 + 260));
    const ripples = make();
    const rnd = seeded(19);
    for (let i = 1; i < f.pts.length; i++) {
      const [ax, az] = f.pts[i - 1];
      const [bx, bz] = f.pts[i];
      for (let t = 0.1; t < 1; t += 0.18) {
        const x = ax + (bx - ax) * t + (rnd() - 0.5) * f.width * 0.5;
        const z = az + (bz - az) * t;
        ripples.moveTo(x - 260, z - 300);
        ripples.quadTo(x, z + 120, x + 260, z - 300);
      }
    }
    const stones = make();
    for (let k = 0; k < 9; k++) {
      const i = 1 + Math.floor(rnd() * (f.pts.length - 1));
      const [ax, az] = f.pts[i - 1];
      const [bx, bz] = f.pts[i];
      const t = rnd();
      const side = rnd() < 0.5 ? -1 : 1;
      stones.addOval(Skia.XYWHRect(ax + (bx - ax) * t + side * f.width * 0.42 - 160, az + (bz - az) * t - 110, 320 + rnd() * 200, 220));
    }
    return { body, bank, ripples, stones };
  }, [f]);
  if (view === 'side') {
    // In elevation: the water's surface in its channel, a little below the ground.
    const xs = f.pts.map((p) => p[0]);
    const x0 = Math.min(...xs) - f.width / 2;
    const x1 = Math.max(...xs) + f.width / 2;
    const ch = make();
    ch.moveTo(x0 - 300, 0);
    ch.quadTo(x0, 450, (x0 + x1) / 2, 520);
    ch.quadTo(x1, 450, x1 + 300, 0);
    ch.close();
    return (
      <Group>
        <Path path={ch} color={BANK} />
        <Path path={rectP(make(), x0 + 100, 260, x1 - 100, 420)}>
          <LinearGradient start={vec(0, 260)} end={vec(0, 420)} colors={[WATER[0], WATER[2]]} />
        </Path>
      </Group>
    );
  }
  return (
    <Group>
      <Path path={g.bank} color={BANK} />
      <Path path={g.body}>
        <LinearGradient start={vec(f.pts[0][0] - f.width, f.pts[0][1])} end={vec(f.pts[0][0] + f.width, f.pts[0][1])} colors={WATER} />
      </Path>
      <Path path={g.ripples} style="stroke" strokeWidth={60} strokeCap="round" color="#a9cbe6" opacity={0.45} />
      <Path path={g.stones} color="#6b6a63" />
      <Path path={g.stones} style="stroke" strokeWidth={30} color={INK} opacity={0.6} />
      <Path path={g.body} style="stroke" strokeWidth={50} color="#173044" opacity={0.8} />
    </Group>
  );
}

function PathBand({ f, view }: { f: Extract<SiteFeature, { kind: 'path' }>; view: ViewId }) {
  const g = useMemo(() => {
    const band = polyPath(bandPolygon(f.pts, f.width / 2));
    const tex = make();
    const rnd = seeded(31);
    if (f.surface === 'gravel') {
      for (let i = 1; i < f.pts.length; i++) {
        const [ax, az] = f.pts[i - 1];
        const [bx, bz] = f.pts[i];
        const L = Math.hypot(bx - ax, bz - az);
        const n = Math.floor(L / 260);
        for (let k = 0; k < n; k++) {
          const t = rnd();
          const off = (rnd() - 0.5) * f.width * 0.85;
          const nx = -(bz - az) / L;
          const nz = (bx - ax) / L;
          tex.addCircle(ax + (bx - ax) * t + nx * off, az + (bz - az) * t + nz * off, 40 + rnd() * 50);
        }
      }
    } else {
      for (let i = 1; i < f.pts.length; i++) {
        const [ax, az] = f.pts[i - 1];
        const [bx, bz] = f.pts[i];
        const L = Math.hypot(bx - ax, bz - az);
        const nx = -(bz - az) / L;
        const nz = (bx - ax) / L;
        for (let d = 900; d < L; d += 900) {
          const x = ax + ((bx - ax) * d) / L;
          const z = az + ((bz - az) * d) / L;
          tex.moveTo(x - nx * f.width * 0.5, z - nz * f.width * 0.5);
          tex.lineTo(x + nx * f.width * 0.5, z + nz * f.width * 0.5);
        }
      }
    }
    return { band, tex };
  }, [f]);
  if (view === 'side') {
    const xs = f.pts.map((p) => p[0]);
    return <Path path={rectP(make(), Math.min(...xs) - f.width / 2, -30, Math.max(...xs) + f.width / 2, 60)} color={f.surface === 'gravel' ? GRAVEL[1] : PAVED[1]} />;
  }
  const c = f.surface === 'gravel' ? GRAVEL : PAVED;
  return (
    <Group>
      <Path path={g.band}>
        <LinearGradient start={vec(-20000, -20000)} end={vec(20000, 20000)} colors={[c[0], c[1]]} />
      </Path>
      {f.surface === 'gravel' ? <Path path={g.tex} color="#b3a68c" opacity={0.45} /> : <Path path={g.tex} style="stroke" strokeWidth={30} color="#3a3936" opacity={0.7} />}
      <Path path={g.band} style="stroke" strokeWidth={40} color={INK} opacity={0.45} />
    </Group>
  );
}

function Road({ f, view, z0, z1 }: { f: Extract<SiteFeature, { kind: 'road' }>; view: ViewId; z0: number; z1: number }) {
  if (view === 'side') {
    return (
      <Group>
        <Path path={rectP(make(), f.x0, 0, f.x1, 160)}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 160)} colors={['#3a3b3f', '#24252a']} />
        </Path>
        <Path path={rectP(make(), f.x0 - 150, -150, f.x0, 60, 20)} color="#77787d" />
        <Path path={rectP(make(), f.x1, -150, f.x1 + 150, 60, 20)} color="#77787d" />
      </Group>
    );
  }
  const w = (f.x1 - f.x0) / f.lanes.length;
  const lines = make();
  for (let i = 1; i < f.lanes.length; i++) {
    lines.moveTo(f.x0 + i * w, z0);
    lines.lineTo(f.x0 + i * w, z1);
  }
  const edges = make();
  edges.moveTo(f.x0 + 200, z0);
  edges.lineTo(f.x0 + 200, z1);
  edges.moveTo(f.x1 - 200, z0);
  edges.lineTo(f.x1 - 200, z1);
  const arrows = make();
  f.lanes.forEach((dir, i) => {
    const cx = f.x0 + (i + 0.5) * w;
    for (let z = z0 + 4000; z < z1 - 2000; z += 9000) {
      const tip = z + dir * 1100;
      arrows.moveTo(cx, z - dir * 900);
      arrows.lineTo(cx, tip);
      arrows.moveTo(cx - 450, tip - dir * 600);
      arrows.lineTo(cx, tip);
      arrows.lineTo(cx + 450, tip - dir * 600);
    }
  });
  return (
    <Group>
      <Path path={rectP(make(), f.x0, z0, f.x1, z1)}>
        <LinearGradient start={vec(f.x0, 0)} end={vec(f.x1, 0)} colors={['#37383c', '#2a2b2f']} />
      </Path>
      <Path path={rectP(make(), f.x0 - 160, z0, f.x0, z1)} color="#77787d" />
      <Path path={rectP(make(), f.x1, z0, f.x1 + 160, z1)} color="#77787d" />
      <Path path={edges} style="stroke" strokeWidth={110} color={LANE_WHITE} opacity={0.75} />
      <Path path={lines} style="stroke" strokeWidth={120} color={f.lanes.length > 1 && f.lanes[0] !== f.lanes[1] ? LANE_YELLOW : LANE_WHITE} opacity={0.85}>
        <DashPathEffect intervals={[3000, 2000]} />
      </Path>
      <Path path={arrows} style="stroke" strokeWidth={150} strokeCap="round" strokeJoin="round" color={LANE_WHITE} opacity={0.55} />
    </Group>
  );
}

function Sidewalk({ f, view, z0, z1 }: { f: Extract<SiteFeature, { kind: 'sidewalk' }>; view: ViewId; z0: number; z1: number }) {
  if (view === 'side') return <Path path={rectP(make(), f.x0, -150, f.x1, 60)} color="#6a6964" />;
  const joints = make();
  for (let z = z0; z < z1; z += 1500) {
    joints.moveTo(f.x0, z);
    joints.lineTo(f.x1, z);
  }
  joints.moveTo((f.x0 + f.x1) / 2, z0);
  joints.lineTo((f.x0 + f.x1) / 2, z1);
  return (
    <Group>
      <Path path={rectP(make(), f.x0, z0, f.x1, z1)}>
        <LinearGradient start={vec(f.x0, z0)} end={vec(f.x1, z1)} colors={['#7a7973', '#65645f']} />
      </Path>
      <Path path={joints} style="stroke" strokeWidth={35} color="#45443f" opacity={0.8} />
    </Group>
  );
}

function Building({ f, view }: { f: Extract<SiteFeature, { kind: 'building' }>; view: ViewId }) {
  if (view === 'side') {
    const wins = make();
    for (let y = -f.h + 900; y < -1800; y += 2600) for (let x = f.x0 + 600; x < f.x1 - 600; x += 1500) rectP(wins, x, y, x + 900, y + 1500, 40);
    return (
      <Group>
        <Path path={rectP(make(), f.x0, -f.h, f.x1, 0)}>
          <LinearGradient start={vec(f.x0, -f.h)} end={vec(f.x1, 0)} colors={['#6a655d', '#4a4640', '#34312d']} />
        </Path>
        <Path path={wins}>
          <LinearGradient start={vec(f.x0, -f.h)} end={vec(f.x1, 0)} colors={['#4b6178', '#22303f']} />
        </Path>
        <Path path={rectP(make(), f.x1 - 120, -f.h, f.x1, 0)} color="#8a857c" opacity={0.8} />
        <Path path={rectP(make(), f.x0, -f.h, f.x1, 0)} style="stroke" strokeWidth={50} color={INK} />
      </Group>
    );
  }
  const roof = rectP(make(), f.x0, f.z0, f.x1, f.z1);
  const parapet = rectP(make(), f.x0 + 250, f.z0 + 250, f.x1 - 250, f.z1 - 250);
  const units = make();
  for (let z = f.z0 + 3000; z < f.z1 - 1500; z += 7000) rectP(units, f.x0 + 1200, z, f.x0 + 2600, z + 1600, 80);
  const door = f.door != null ? rectP(make(), f.x1 - 60, f.door - 900, f.x1 + 240, f.door + 900, 40) : null;
  return (
    <Group>
      <Path path={roof}>
        <LinearGradient start={vec(f.x0, f.z0)} end={vec(f.x1, f.z1)} colors={['#5c5a56', '#44423e']} />
      </Path>
      <Path path={parapet} style="stroke" strokeWidth={120} color="#2d2c29" opacity={0.85} />
      <Path path={units}>
        <LinearGradient start={vec(f.x0, 0)} end={vec(f.x0 + 2600, 0)} colors={['#9a9ea6', '#5c6068']} />
      </Path>
      {/* the facade: a lit edge facing the plaza */}
      <Path path={rectP(make(), f.x1 - 160, f.z0, f.x1, f.z1)} color="#a39d92" />
      {door ? <Path path={door} color="#3b2c20" /> : null}
      <Path path={roof} style="stroke" strokeWidth={60} color={INK} />
    </Group>
  );
}

function Cafe({ f, view }: { f: Extract<SiteFeature, { kind: 'cafe' }>; view: ViewId }) {
  const R = 1100;
  if (view === 'side') {
    return (
      <Group>
        {f.tables.map(([x], i) => (
          <Group key={i} opacity={0.85}>
            <Path path={polyPath([[x - R, -2200], [x, -2650], [x + R, -2200]])} color="#b9473c" />
            <Path path={rectP(make(), x - 25, -2200, x + 25, 0)} color="#8a8e96" />
            <Path path={rectP(make(), x - 380, -760, x + 380, -720)} color="#7a6a58" />
          </Group>
        ))}
      </Group>
    );
  }
  return (
    <Group>
      <Path path={rectP(make(), f.x0, f.z0, f.x1, f.z1, 200)} color="#3c3a35" opacity={0.6} />
      {f.tables.map(([x, z], i) => {
        const oct = make();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          if (k === 0) oct.moveTo(x + Math.cos(a) * R, z + Math.sin(a) * R);
          else oct.lineTo(x + Math.cos(a) * R, z + Math.sin(a) * R);
        }
        oct.close();
        const ribs = make();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          ribs.moveTo(x, z);
          ribs.lineTo(x + Math.cos(a) * R, z + Math.sin(a) * R);
        }
        return (
          <Group key={i}>
            <Group transform={[{ translateX: 160 }, { translateY: 200 }]}>
              <Path path={oct} color="#000000" opacity={0.3} />
            </Group>
            <Path path={oct}>
              <RadialGradient c={vec(x - 350, z - 350)} r={R * 1.5} colors={i % 2 ? ['#e0e2e6', '#9da2aa'] : ['#d9564a', '#8f2d25']} />
            </Path>
            <Path path={ribs} style="stroke" strokeWidth={30} color={INK} opacity={0.35} />
            <Path path={oct} style="stroke" strokeWidth={35} color={INK} opacity={0.75} />
          </Group>
        );
      })}
    </Group>
  );
}

function Hedge({ f, view }: { f: Extract<SiteFeature, { kind: 'hedge' }>; view: ViewId }) {
  const g = useMemo(() => {
    const circles: [number, number, number][] = [];
    const rnd = seeded(47);
    for (let i = 1; i < f.pts.length; i++) {
      const [ax, az] = f.pts[i - 1];
      const [bx, bz] = f.pts[i];
      const L = Math.hypot(bx - ax, bz - az);
      for (let d = 0; d < L; d += f.width * 0.5) {
        circles.push([ax + ((bx - ax) * d) / L + (rnd() - 0.5) * 300, az + ((bz - az) * d) / L, f.width * (0.45 + rnd() * 0.15)]);
      }
    }
    return unionCircles(circles);
  }, [f]);
  if (view === 'side') {
    const xs = f.pts.map((p) => p[0]);
    const x0 = Math.min(...xs) - f.width / 2;
    const x1 = Math.max(...xs) + f.width / 2;
    return <Path path={rectP(make(), x0, -f.h, x1, 0, 600)} color="#2f4422" />;
  }
  return (
    <Group>
      <Group transform={[{ translateX: 300 }, { translateY: 350 }]}>
        <Path path={g} color="#000000" opacity={0.3} />
      </Group>
      <Path path={g}>
        <LinearGradient start={vec(-10000, -10000)} end={vec(10000, 10000)} colors={['#4d6a37', '#2c4320']} />
      </Path>
      <Path path={g} style="stroke" strokeWidth={50} color="#152110" opacity={0.6} />
    </Group>
  );
}

function Bench({ f, view }: { f: Extract<SiteFeature, { kind: 'bench' }>; view: ViewId }) {
  const [x, z] = f.c;
  if (view === 'side') {
    // Seen end-on (art pass 2026-10-10 — it was a plank floating in the air):
    // a park bench of the usual class, seat 450 mm up and 450 deep, its back
    // raked to 820 mm, on a cast end frame (front leg, rear leg rising into
    // the back support, armrest); the slats cut across, facing +x.
    const frame = make();
    frame.addPath(polyPath([[x + 170, 0], [x + 215, 0], [x + 235, -450], [x + 195, -450]]));
    frame.addPath(polyPath([[x - 215, 0], [x - 170, 0], [x - 200, -450], [x - 270, -830], [x - 305, -825], [x - 245, -450]]));
    frame.addPath(polyPath([[x - 240, -430], [x + 240, -430], [x + 240, -395], [x - 235, -395]]));
    frame.addPath(polyPath([[x - 225, -640], [x + 220, -630], [x + 225, -605], [x + 215, -440], [x + 190, -440], [x + 195, -605], [x - 220, -612]]));
    const slats = make();
    for (let k = 0; k < 4; k++) rectP(slats, x - 230 + k * 120, -470, x - 230 + k * 120 + 95, -432, 8);
    for (let k = 0; k < 3; k++) {
      const t = 0.2 + k * 0.3;
      const cx = x - 215 - t * 70;
      const cy = -480 - t * 340;
      slats.addPath(polyPath([[cx - 22, cy - 45], [cx + 14, cy - 50], [cx + 26, cy + 45], [cx - 10, cy + 50]]));
    }
    return (
      <Group>
        <Path path={frame} color="#2b2d31" />
        <Path path={frame} style="stroke" strokeWidth={10} color={INK} opacity={0.7} />
        <Path path={slats}>
          <LinearGradient start={vec(x - 250, -850)} end={vec(x + 250, -400)} colors={['#a57b4e', '#6e4d2d']} />
        </Path>
        <Path path={slats} style="stroke" strokeWidth={8} color={INK} opacity={0.7} />
      </Group>
    );
  }
  const slats = make();
  for (let k = 0; k < 4; k++) rectP(slats, x - 250 + k * 130, z - f.len / 2, x - 250 + k * 130 + 100, z + f.len / 2, 20);
  return (
    <Group>
      <Path path={slats}>
        <LinearGradient start={vec(x - 250, z)} end={vec(x + 250, z)} colors={['#a57b4e', '#6e4d2d']} />
      </Path>
      <Path path={slats} style="stroke" strokeWidth={18} color={INK} opacity={0.7} />
    </Group>
  );
}

function Cone({ c, view }: { c: XZ; view: ViewId }) {
  const [x, z] = c;
  if (view === 'side') {
    // A 700 mm traffic cone (art pass 2026-10-10): the square base 360 mm
    // across, the tapered body to a rounded tip, two reflective collars.
    const body = polyPath([[x - 140, -40], [x - 34, -680], [x - 20, -700], [x + 20, -700], [x + 34, -680], [x + 140, -40]]);
    const collars = make();
    collars.addPath(polyPath([[x - 110, -290], [x - 82, -460], [x + 82, -460], [x + 110, -290]]));
    collars.addPath(polyPath([[x - 66, -540], [x - 54, -610], [x + 54, -610], [x + 66, -540]]));
    return (
      <Group>
        <Path path={rectP(make(), x - 180, -40, x + 180, 0, 6)} color="#2a2a2a" />
        <Path path={body}>
          <LinearGradient start={vec(x - 140, 0)} end={vec(x + 140, 0)} colors={['#ffb070', '#f07a2c', '#b8501a']} />
        </Path>
        <Path path={collars}>
          <LinearGradient start={vec(x - 110, 0)} end={vec(x + 110, 0)} colors={['#ffffff', '#e4e2dc', '#a9a7a2']} />
        </Path>
        <Path path={body} style="stroke" strokeWidth={8} color={INK} opacity={0.6} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={rectP(make(), x - 210, z - 210, x + 210, z + 210, 30)} color="#2a2a2a" />
      <Circle cx={x} cy={z} r={170}>
        <RadialGradient c={vec(x - 60, z - 60)} r={240} colors={['#ffb070', '#e0661c']} />
      </Circle>
      <Circle cx={x} cy={z} r={100} style="stroke" strokeWidth={40} color="#eceae4" />
      <Circle cx={x} cy={z} r={40} color="#9a3d0e" />
    </Group>
  );
}

function Barrier({ f, view }: { f: Extract<SiteFeature, { kind: 'barrier' }>; view: ViewId }) {
  if (view === 'side') {
    return (
      <Group>
        <Path path={rectP(make(), f.x - 60, -1000, f.x + 60, 0)} color="#c9ccd2" />
        <Path path={rectP(make(), f.x - 140, -1000, f.x + 140, -860)} color="#d6453a" />
      </Group>
    );
  }
  const seg = make();
  const white = make();
  for (let z = f.z0; z < f.z1; z += 2000) {
    rectP(seg, f.x - 120, z + 100, f.x + 120, z + 1900, 40);
    for (let k = 0; k < 3; k++) rectP(white, f.x - 120, z + 400 + k * 500, f.x + 120, z + 650 + k * 500);
  }
  return (
    <Group>
      <Path path={seg} color="#d6453a" />
      <Path path={white} color="#eceae4" />
      <Path path={seg} style="stroke" strokeWidth={25} color={INK} opacity={0.7} />
    </Group>
  );
}

/** A car from above (heading: deg in plan from +x toward +z), 4.4 × 1.8 m. */
function Car({ c, heading, view, bus = false }: { c: XZ; heading: number; view: ViewId; bus?: boolean }) {
  const [x, z] = c;
  const L = bus ? 12000 : 4400;
  const W = bus ? 2550 : 1800;
  if (view === 'side') {
    const H = bus ? 3100 : 1450;
    const body = make();
    rectP(body, x - L / 2, -H * 0.62, x + L / 2, -260, 220);
    const cab = make();
    if (bus) rectP(cab, x - L / 2 + 200, -H, x + L / 2 - 200, -H * 0.6, 260);
    else {
      cab.moveTo(x - L * 0.28, -H * 0.6);
      cab.lineTo(x - L * 0.16, -H);
      cab.lineTo(x + L * 0.14, -H);
      cab.lineTo(x + L * 0.3, -H * 0.6);
      cab.close();
    }
    return (
      <Group opacity={0.92}>
        <Path path={cab}>
          <LinearGradient start={vec(0, -H)} end={vec(0, -H * 0.6)} colors={['#7d93a8', '#3c4c5c']} />
        </Path>
        <Path path={body}>
          <LinearGradient start={vec(0, -H * 0.62)} end={vec(0, -260)} colors={bus ? ['#e0c25a', '#a68a2c'] : ['#8b98a8', '#4b5562']} />
        </Path>
        <Circle cx={x - L * 0.32} cy={-330} r={330} color="#1a1b1e" />
        <Circle cx={x + L * 0.32} cy={-330} r={330} color="#1a1b1e" />
      </Group>
    );
  }
  const body = make();
  rectP(body, -L / 2, -W / 2, L / 2, W / 2, bus ? 300 : 520);
  const glass = make();
  if (bus) {
    rectP(glass, L / 2 - 900, -W / 2 + 180, L / 2 - 200, W / 2 - 180, 160);
  } else {
    glass.moveTo(L * 0.12, -W / 2 + 200);
    glass.lineTo(L * 0.3, -W / 2 + 260);
    glass.lineTo(L * 0.3, W / 2 - 260);
    glass.lineTo(L * 0.12, W / 2 - 200);
    glass.close();
    glass.moveTo(-L * 0.24, -W / 2 + 230);
    glass.lineTo(-L * 0.34, -W / 2 + 280);
    glass.lineTo(-L * 0.34, W / 2 - 280);
    glass.lineTo(-L * 0.24, W / 2 - 230);
    glass.close();
  }
  const roof = make();
  if (bus) for (let k = 0; k < 3; k++) rectP(roof, -L / 2 + 1500 + k * 3500, -500, -L / 2 + 2500 + k * 3500, 500, 120);
  else rectP(roof, -L * 0.22, -W / 2 + 260, L * 0.11, W / 2 - 260, 260);
  return (
    <Group transform={[{ translateX: x }, { translateY: z }, { rotate: heading * DEG }]}>
      <Group transform={[{ translateX: 200 }, { translateY: 240 }]}>
        <Path path={body} color="#000000" opacity={0.35} />
      </Group>
      <Path path={body}>
        <LinearGradient start={vec(-L / 2, -W / 2)} end={vec(L / 2, W / 2)} colors={bus ? ['#efd06a', '#b2932f'] : ['#9aa6b5', '#56616e']} />
      </Path>
      <Path path={roof} color={bus ? '#d9dade' : '#6f7b89'} opacity={0.9} />
      <Path path={glass}>
        <LinearGradient start={vec(0, -W / 2)} end={vec(0, W / 2)} colors={['#a8c2da', '#3b5470']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={50} color={INK} />
    </Group>
  );
}

/** A bird from above or the side, drawn about `span` mm across (larger than life). */
function Bird({ c, h, heading, view, span = 1100, calling = false }: { c: XZ; h: number; heading: number; view: ViewId; span?: number; calling?: boolean }) {
  const s = span / 1000;
  const wing = useMemo(() => {
    const p = make();
    // From above: body along +x (head forward), wings out to ±z.
    p.moveTo(420, 0);
    p.quadTo(300, -90, 120, -110);
    p.quadTo(-80, -500, -200, -520);
    p.quadTo(-160, -200, -260, -90);
    p.lineTo(-480, -150);
    p.lineTo(-420, 0);
    p.lineTo(-480, 150);
    p.lineTo(-260, 90);
    p.quadTo(-160, 200, -200, 520);
    p.quadTo(-80, 500, 120, 110);
    p.quadTo(300, 90, 420, 0);
    p.close();
    return p;
  }, []);
  const perched = useMemo(() => {
    const p = make();
    // From the side: a perched songbird facing −u (toward the listener at the left).
    p.moveTo(-430, -200);
    p.quadTo(-360, -330, -230, -300);
    p.quadTo(-80, -260, 120, -170);
    p.lineTo(480, -60);
    p.lineTo(170, -30);
    p.quadTo(40, 120, -160, 60);
    p.quadTo(-330, 0, -380, -120);
    p.close();
    return p;
  }, []);
  const [x, z] = c;
  if (view === 'side') {
    return (
      <Group transform={[{ translateX: x }, { translateY: -h }, { scale: s }]}>
        <Path path={perched}>
          <LinearGradient start={vec(-400, -300)} end={vec(400, 100)} colors={['#c98a4a', '#6b4424']} />
        </Path>
        <Circle cx={-300} cy={-230} r={28} color="#0d0d0d" />
        <Path path={polyPath([[-430, -215], [-560, -195], [-430, -175]])} color="#e3b04a" />
        <Path path={perched} style="stroke" strokeWidth={22} color={INK} />
        {calling ? <Path path={(() => { const p = make(); for (const r of [260, 420]) { p.addArc(Skia.XYWHRect(-560 - r, -230 - r, 2 * r, 2 * r), 150, 60); } return p; })()} style="stroke" strokeWidth={40} strokeCap="round" color="#ffc64d" opacity={0.9} /> : null}
      </Group>
    );
  }
  return (
    <Group transform={[{ translateX: x }, { translateY: z }, { rotate: heading * DEG }, { scale: s }]}>
      <Group transform={[{ translateX: 60 }, { translateY: 80 }]}>
        <Path path={wing} color="#000000" opacity={0.35} />
      </Group>
      <Path path={wing}>
        <LinearGradient start={vec(-300, -400)} end={vec(300, 400)} colors={['#d39a5c', '#7a4f2b']} />
      </Path>
      <Circle cx={330} cy={0} r={70} color="#5a3b20" />
      <Path path={wing} style="stroke" strokeWidth={24} color={INK} />
      {calling ? (
        <Group>
          <Circle cx={0} cy={0} r={720} style="stroke" strokeWidth={46} color="#ffc64d" opacity={0.8}>
            <DashPathEffect intervals={[120, 120]} />
          </Circle>
        </Group>
      ) : null}
    </Group>
  );
}

function Flock({ f, view }: { f: Extract<SiteFeature, { kind: 'flock' }>; view: ViewId }) {
  const offs: XZ[] = [[0, 0], [-1600, -1300], [-1600, 1300], [-3100, -2500], [-3000, 2600], [-4500, -900], [-4300, 1500]];
  const rot = (o: XZ): XZ => {
    const a = f.heading * DEG;
    return [f.c[0] + o[0] * Math.cos(a) - o[1] * Math.sin(a), f.c[1] + o[0] * Math.sin(a) + o[1] * Math.cos(a)];
  };
  if (view === 'side') return <Bird c={f.c} h={f.h} heading={0} view="side" span={1300} />;
  return (
    <Group>
      {offs.map((o, i) => (
        <Bird key={i} c={rot(o)} h={f.h} heading={f.heading} view="top" span={1300} />
      ))}
    </Group>
  );
}

function Bison({ f, view }: { f: Extract<SiteFeature, { kind: 'bison' }>; view: ViewId }) {
  const [x, z] = f.c;
  if (view === 'side') {
    const body = make();
    body.moveTo(x - 1500, -900);
    body.quadTo(x - 1300, -1950, x - 200, -1900);
    body.quadTo(x + 700, -1700, x + 1300, -1100);
    body.lineTo(x + 1250, -500);
    body.lineTo(x - 1450, -500);
    body.close();
    const head = make();
    head.addOval(Skia.XYWHRect(x - 2050, -1500, 800, 750));
    const legs = make();
    for (const lx of [x - 1100, x - 700, x + 600, x + 950]) rectP(legs, lx - 110, -560, lx + 110, 0, 40);
    return (
      <Group>
        <Path path={legs} color="#2a1d12" />
        <Path path={body}>
          <LinearGradient start={vec(x - 1500, -1900)} end={vec(x + 1300, -500)} colors={['#7a5232', '#3d2716']} />
        </Path>
        <Path path={head} color="#3a2414" />
        <Path path={body} style="stroke" strokeWidth={40} color={INK} />
      </Group>
    );
  }
  const body = make();
  body.addOval(Skia.XYWHRect(-1500, -650, 3000, 1300));
  const hump = make();
  hump.addOval(Skia.XYWHRect(-900, -620, 1300, 1240));
  const head = make();
  head.addOval(Skia.XYWHRect(-2150, -380, 800, 760));
  return (
    <Group transform={[{ translateX: x }, { translateY: z }, { rotate: (f.heading + 180) * DEG }]}>
      <Group transform={[{ translateX: 250 }, { translateY: 280 }]}>
        <Path path={body} color="#000000" opacity={0.35} />
      </Group>
      <Path path={body}>
        <RadialGradient c={vec(-500, -300)} r={1900} colors={['#8a6040', '#4a301c']} />
      </Path>
      <Path path={hump} color="#3e2717" opacity={0.85} />
      <Path path={head} color="#2f1d10" />
      <Path path={body} style="stroke" strokeWidth={40} color={INK} />
    </Group>
  );
}

function Ring({ f, view }: { f: Extract<SiteFeature, { kind: 'ring' }>; view: ViewId }) {
  if (view === 'side') {
    return (
      <Group>
        <Path path={rectP(make(), f.c[0] - f.r, -200, f.c[0] + f.r, 0)} color={RING} opacity={0.12} />
        <Path path={polyPath([[f.c[0] - f.r, -4200], [f.c[0] - f.r, 0]], false)} style="stroke" strokeWidth={120} color={RING} opacity={0.85}>
          <DashPathEffect intervals={[500, 350]} />
        </Path>
      </Group>
    );
  }
  return (
    <Group>
      <Circle cx={f.c[0]} cy={f.c[1]} r={f.r} color={RING} opacity={0.07} />
      <Circle cx={f.c[0]} cy={f.c[1]} r={f.r} style="stroke" strokeWidth={160} color={RING} opacity={0.85}>
        <DashPathEffect intervals={[900, 600]} />
      </Circle>
    </Group>
  );
}

function Person({ f, view }: { f: Extract<SiteFeature, { kind: 'person' }>; view: ViewId }) {
  const [x, z] = f.c;
  const dim = f.role === 'public' ? 0.75 : 0.95;
  if (view === 'side') {
    const pose = operatorSide(x, 0, Math.cos(f.heading * DEG) >= 0 ? 1 : -1);
    return (
      <Group>
        <PlayerBehind pose={pose} dim={dim} />
        <PlayerInFront pose={pose} dim={dim} />
      </Group>
    );
  }
  const pose = operatorTop(x, z, 1);
  return (
    <Group transform={[{ translateX: x }, { translateY: z }, { rotate: f.heading * DEG }, { translateX: -x }, { translateY: -z }]}>
      <PlayerBehind pose={pose} dim={dim} />
      <PlayerInFront pose={pose} dim={dim} />
    </Group>
  );
}

function Ground({ f, view, seed }: { f: Extract<SiteFeature, { kind: 'ground' }>; view: ViewId; seed: number }) {
  const tex = useMemo(() => {
    const p = make();
    const rnd = seeded(seed);
    const area = ((f.x1 - f.x0) * (f.z1 - f.z0)) / 1e6;
    if (f.ground === 'paving') {
      for (let x = f.x0; x < f.x1; x += 1200) {
        p.moveTo(x, f.z0);
        p.lineTo(x, f.z1);
      }
      for (let z = f.z0; z < f.z1; z += 1200) {
        p.moveTo(f.x0, z);
        p.lineTo(f.x1, z);
      }
      return p;
    }
    const n = Math.min(900, Math.floor(area * (f.ground === 'forest' ? 0.9 : 1.2)));
    for (let k = 0; k < n; k++) {
      const x = f.x0 + rnd() * (f.x1 - f.x0);
      const z = f.z0 + rnd() * (f.z1 - f.z0);
      if (f.ground === 'forest') p.addOval(Skia.XYWHRect(x, z, 180 + rnd() * 160, 90 + rnd() * 80));
      else {
        p.moveTo(x, z);
        p.lineTo(x + 120 + rnd() * 120, z - 160 - rnd() * 120);
      }
    }
    return p;
  }, [f, seed]);
  const c = GROUND[f.ground];
  if (view === 'side') {
    const soil = rectP(make(), f.x0, 0, f.x1, 1400);
    const top = make();
    const rnd = seeded(seed + 5);
    if (f.ground === 'forest' || f.ground === 'meadow' || f.ground === 'lawn') {
      for (let x = f.x0; x < f.x1; x += 110) {
        top.moveTo(x, 0);
        top.lineTo(x + 30, -(f.ground === 'lawn' ? 60 : 120) - rnd() * (f.ground === 'meadow' ? 260 : 90));
      }
    }
    return (
      <Group>
        <Path path={soil}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 1400)} colors={f.ground === 'paving' || f.ground === 'asphalt' ? ['#3c3b38', '#222220'] : ['#2f2a20', '#17150f']} />
        </Path>
        <Path path={top} style="stroke" strokeWidth={26} strokeCap="round" color={c[0]} opacity={0.95} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={rectP(make(), f.x0, f.z0, f.x1, f.z1)}>
        <LinearGradient start={vec(f.x0, f.z0)} end={vec(f.x1, f.z1)} colors={[c[0], c[1]]} />
      </Path>
      {f.ground === 'paving' ? (
        <Path path={tex} style="stroke" strokeWidth={40} color="#2f2e2b" opacity={0.6} />
      ) : f.ground === 'forest' ? (
        <Path path={tex} color="#5c4a2c" opacity={0.35} />
      ) : (
        <Path path={tex} style="stroke" strokeWidth={34} strokeCap="round" color="#5f7a42" opacity={0.4} />
      )}
    </Group>
  );
}

/** Draw order: ground, water and paths, built things, people and animals, trees over all (plan). */
const ORDER: Readonly<Record<SiteFeature['kind'], number>> = {
  ground: 0,
  ring: 1,
  stream: 2,
  sidewalk: 2,
  road: 2,
  path: 3,
  cafe: 4,
  building: 4,
  hedge: 5,
  bench: 5,
  cone: 6,
  barrier: 6,
  car: 7,
  bus: 7,
  person: 8,
  bison: 8,
  tree: 9,
  bird: 10,
  flock: 10,
};

export function SiteArt({ site, view, hide = [] }: { site: FieldSite; view: ViewId; hide?: readonly SiteFeature['kind'][] }): ReactElement {
  const items = useMemo(() => {
    const list = site.features.map((f, i) => ({ f, i })).filter(({ f }) => !hide.includes(f.kind));
    // Elevation: far (large |z|) features first and dimmer; trees after the ground but before people.
    return list.sort((a, b) => (view === 'side' ? sideRank(a.f) - sideRank(b.f) : ORDER[a.f.kind] - ORDER[b.f.kind]));
  }, [site, view, hide]);
  const z0 = site.box.z0;
  const z1 = site.box.z1;
  return (
    <Group>
      {items.map(({ f, i }) => {
        const key = `${f.kind}${i}`;
        switch (f.kind) {
          case 'ground':
            return <Ground key={key} f={f} view={view} seed={i * 13 + 1} />;
          case 'tree':
            return (
              <Group key={key} opacity={view === 'side' ? farDim(f.c[1]) : 1}>
                <Tree f={f} view={view} seed={i * 7 + 2} />
              </Group>
            );
          case 'stream':
            return <Stream key={key} f={f} view={view} />;
          case 'path':
            return <PathBand key={key} f={f} view={view} />;
          case 'road':
            return <Road key={key} f={f} view={view} z0={z0} z1={z1} />;
          case 'sidewalk':
            return <Sidewalk key={key} f={f} view={view} z0={z0} z1={z1} />;
          case 'building':
            return <Building key={key} f={f} view={view} />;
          case 'cafe':
            return <Cafe key={key} f={f} view={view} />;
          case 'hedge':
            return <Hedge key={key} f={f} view={view} />;
          case 'bench':
            return <Bench key={key} f={f} view={view} />;
          case 'cone':
            return <Cone key={key} c={f.c} view={view} />;
          case 'barrier':
            return <Barrier key={key} f={f} view={view} />;
          case 'person':
            return (
              <Group key={key} opacity={view === 'side' ? farDim(f.c[1]) : 1}>
                <Person f={f} view={view} />
              </Group>
            );
          case 'car':
            return <Car key={key} c={f.c} heading={f.heading} view={view} />;
          case 'bus':
            return <Car key={key} c={f.c} heading={f.heading} view={view} bus />;
          case 'bird':
            return <Bird key={key} c={f.c} h={f.h} heading={f.heading} view={view} calling={f.calling} />;
          case 'flock':
            return <Flock key={key} f={f} view={view} />;
          case 'bison':
            return <Bison key={key} f={f} view={view} />;
          case 'ring':
            return <Ring key={key} f={f} view={view} />;
        }
        return null;
      })}
    </Group>
  );
}

/** Elevation: the ground first, then far things before near ones. */
function sideRank(f: SiteFeature): number {
  if (f.kind === 'ground') return -1e9;
  if (f.kind === 'ring') return -1e8;
  const z = 'c' in f ? Math.abs(f.c[1]) : 0;
  const base = f.kind === 'tree' ? 0 : f.kind === 'bird' || f.kind === 'flock' ? 2e6 : 1e6;
  return base - z;
}
/** Elevation: far things a little dimmer (depth). */
function farDim(z: number): number {
  return Math.max(0.55, 1 - Math.abs(z) / 40000);
}

/** One drawn bird / car, for a page's own scene (a moving source on the path tool). */
export { Bird as SiteBird, Car as SiteCar, Person as SitePerson, Flock as SiteFlock };
