/**
 * Room Design & Monitoring Lab — the model's physics against textbook closed
 * forms AND against the app's own calculators (the source of truth): speed
 * of sound, axial / tangential / oblique modes (Rayleigh), modal pressure,
 * the image-source reflection points and their delays, SBIR, Sabine and
 * Eyring, exact unit conversion, stereo symmetry, the non-rectangle label,
 * suggestions, the layout diff and the measured comparison.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The calculator workspaces import their siblings without an extension (Metro
// resolves them); Node needs it spelled out — the calc tests' own hook.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const {
  analyze,
  basstrapAt,
  bounds,
  ceilingHeightAt,
  clampInside,
  coincidentModes,
  compareMeasured,
  defaultDesign,
  defaultLayout,
  defaultRoom,
  diffLayouts,
  firstReflections,
  fmtLen,
  fromMetres,
  FT,
  IN,
  isRectangular,
  mirrorAcrossEdge,
  modeFrequency,
  modePressure,
  placementConflicts,
  polygonArea,
  resizeRoom,
  roomModes,
  roomVolume,
  rt60Bands,
  SABINE_K,
  sbirNotches,
  shapeVertices,
  speedOfSound,
  stereoGeometry,
  SURFACES,
  surfaceList,
  SYM_TOL,
  toMetres,
  treatmentAlpha,
  treatmentAtReflection,
} = await import('../src/screens/lab/roomdesign/roomModel.ts');
type RoomDesign = import('../src/screens/lab/roomdesign/roomModel.ts').RoomDesign;
const { speedOfSoundAir } = await import('../src/screens/lab/calc/calcUnits.ts');
const { WORKSPACES_ROOMS_MUSIC } = await import('../src/screens/lab/calc/workspaces/roomsMusic.ts');
const { WORKSPACES_ROOMS_ADVANCED } = await import('../src/screens/lab/calc/workspaces/roomsAdvanced.ts');

const near = (a: number, b: number, tol = 1e-6, what = '') => assert.ok(Math.abs(a - b) <= tol, `${what} ${a} ≉ ${b} (tol ${tol})`);

/** The 5 × 4 × 2.5 m room the calculator's own example quotes. */
function design(): RoomDesign {
  const d = defaultDesign('metric');
  return d;
}

describe('speed of sound — the calculator’s function, not a copy', () => {
  it('is the same function as calcUnits.speedOfSoundAir', () => {
    assert.equal(speedOfSound, speedOfSoundAir);
    near(speedOfSound(20), 343.215, 1e-3);
    near(speedOfSound(0), 331.3, 1e-9);
  });
});

describe('room modes — Rayleigh, and parity with the Room Modes calculator', () => {
  const c = speedOfSound(20);
  it('axial fundamentals of 5 × 4 × 2.5 m are 34.3 / 42.9 / 68.6 Hz (the calculator’s example)', () => {
    near(modeFrequency(c, 5, 4, 2.5, 1, 0, 0), 34.32, 0.01);
    near(modeFrequency(c, 5, 4, 2.5, 0, 1, 0), 42.90, 0.01);
    near(modeFrequency(c, 5, 4, 2.5, 0, 0, 1), 68.64, 0.01);
    // f = n·c/(2L) exactly
    near(modeFrequency(c, 5, 4, 2.5, 3, 0, 0), (3 * c) / 10, 1e-9);
  });
  it('tangential and oblique follow (c/2)·√(Σ(n/L)²)', () => {
    near(modeFrequency(c, 5, 4, 2.5, 1, 1, 0), (c / 2) * Math.sqrt(1 / 25 + 1 / 16), 1e-9);
    near(modeFrequency(c, 5, 4, 2.5, 1, 1, 0), 54.94, 0.01);
    near(modeFrequency(c, 5, 4, 2.5, 1, 1, 1), 87.92, 0.01);
  });
  it('matches the Room Modes (Axial) calculator workspace row for row', () => {
    const ws = WORKSPACES_ROOMS_MUSIC.find((w) => w.id === 'roommodes')!;
    const fn = ws.functions.find((f) => f.key === 'axial')!;
    const table = fn.table!({ len: 5, wid: 4, hei: 2.5, temp: 20 });
    const ours = roomModes(c, 5, 4, 2.5, 4, 100000).filter((m) => m.kind === 'axial');
    for (const row of table.rows) {
      const f = Number(row[0]);
      const dim = row[1];
      const ord = Number(row[2]);
      const mine = ours.find((m) => m.axis === dim && (m.nx || m.ny || m.nz) === ord);
      assert.ok(mine, `calculator row ${row.join(' ')} has no model mode`);
      near(mine!.f, f, Math.max(0.006, f * 6e-4), `calculator ${dim}${ord}`); // the calculator prints 4 significant figures
    }
  });
  it('lists every mode under the ceiling, ascending, typed by how many indices are non-zero', () => {
    const modes = roomModes(c, 5, 4, 2.5, 4, 300);
    assert.ok(modes.length > 20);
    for (let i = 1; i < modes.length; i++) assert.ok(modes[i].f >= modes[i - 1].f);
    for (const m of modes) {
      const nz = (m.nx ? 1 : 0) + (m.ny ? 1 : 0) + (m.nz ? 1 : 0);
      assert.equal(m.kind, nz === 1 ? 'axial' : nz === 2 ? 'tangential' : 'oblique');
      assert.ok(m.f <= 300);
    }
    assert.equal(modes[0].kind, 'axial');
    near(modes[0].f, 34.32, 0.01);
  });
  it('flags coincident modes within 5 % — a 4 × 4 room stacks (1,0,0) on (0,1,0)', () => {
    const modes = roomModes(c, 4, 4, 2.5);
    const pairs = coincidentModes(modes);
    assert.ok(pairs.some(([a, b]) => a.f === b.f && a.kind === 'axial' && b.kind === 'axial'));
    // …and the calculator's own example: in 5 × 4 × 2.5 the fourth length
    // mode and the second height mode stack at 137.3 Hz (a 2:1 ratio).
    const stacked = coincidentModes(roomModes(c, 5, 4, 2.5)).find(([a, b]) => a.kind === 'axial' && b.kind === 'axial' && Math.abs(a.f - 137.29) < 0.01 && Math.abs(b.f - 137.29) < 0.01);
    assert.ok(stacked, 'L4 and H2 coincide');
  });
  it('a 5.1 × 3.7 × 2.3 room (no simple ratios) has no exactly coincident axial pair', () => {
    const modes = roomModes(c, 5.1, 3.7, 2.3).filter((m) => m.kind === 'axial');
    assert.equal(coincidentModes(modes).filter(([a, b]) => Math.abs(a.f - b.f) < 1e-9).length, 0);
  });
  it('modal pressure: 1 at boundaries and corners, 0 at the half point of the first mode, cos² product', () => {
    assert.equal(modePressure(5, 4, 2.5, { nx: 1, ny: 0, nz: 0 }, 0, 0, 0), 1);
    assert.equal(modePressure(5, 4, 2.5, { nx: 2, ny: 3, nz: 1 }, 5, 4, 2.5), 1);
    near(modePressure(5, 4, 2.5, { nx: 1, ny: 0, nz: 0 }, 2.5, 1, 1), 0, 1e-12);
    near(modePressure(5, 4, 2.5, { nx: 2, ny: 0, nz: 0 }, 1.25, 1, 1), 0, 1e-12);
    near(modePressure(5, 4, 2.5, { nx: 1, ny: 1, nz: 0 }, 1, 1, 0), Math.abs(Math.cos(Math.PI / 5) * Math.cos(Math.PI / 4)), 1e-12);
  });
});

describe('image-source reflections', () => {
  const room = defaultRoom('metric'); // 4 wide (x) × 5 long (y), 2.5 high
  const c = speedOfSound(20);
  const spk = { role: 'L' as const, x: 1, y: 1, z: 1.2, toeDeg: 0 };
  const lis = { x: 2, y: 3, earZ: 1.2 };
  it('mirrors a point across a wall line', () => {
    const img = mirrorAcrossEdge({ x: 1, y: 1 }, room.vertices, 3); // left wall x = 0
    near(img.x, -1, 1e-12);
    near(img.y, 1, 1e-12);
  });
  it('left-wall reflection point, path and delay are the textbook numbers', () => {
    const refl = firstReflections(room, spk, lis, c);
    const left = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    assert.ok(left);
    near(left.point.x, 0, 1e-9);
    near(left.point.y, 1 + 2 / 3, 1e-9, 'y of the reflection point');
    near(left.pathLen, Math.hypot(3, 2), 1e-9);
    near(left.directLen, Math.hypot(1, 2), 1e-9);
    near(left.delayMs, ((Math.hypot(3, 2) - Math.hypot(1, 2)) / c) * 1000, 1e-9);
    near(left.delayMs, 3.99, 0.01);
  });
  it('floor and ceiling reflections use the ±z images', () => {
    const refl = firstReflections(room, spk, lis, c);
    const floor = refl.find((r) => r.surface.kind === 'floor')!;
    const ceil = refl.find((r) => r.surface.kind === 'ceiling')!;
    const dh = Math.hypot(1, 2);
    near(floor.pathLen, Math.hypot(dh, 2.4), 1e-9);
    near(floor.point.x, 1.5, 1e-9);
    near(floor.point.y, 2, 1e-9);
    assert.equal(floor.point.z, 0);
    near(ceil.pathLen, Math.hypot(dh, 2.6), 1e-9);
    near(ceil.point.z, 2.5, 1e-9);
    near(floor.delayMs, 3.04, 0.01);
    assert.ok(floor.delayMs < ceil.delayMs);
  });
  it('one reflection per wall that the image path actually crosses, sorted by delay', () => {
    const refl = firstReflections(room, spk, lis, c);
    const walls = refl.filter((r) => r.surface.kind === 'wall');
    assert.ok(walls.length >= 3 && walls.length <= 4);
    for (let i = 1; i < refl.length; i++) assert.ok(refl[i].delayMs >= refl[i - 1].delayMs);
    for (const r of refl) assert.ok(r.levelDb < 0, 'a reflection is always below the direct sound');
  });
  it('a reflection point covered by an enabled absorber reads treatedBy; disabled does not', () => {
    const refl = firstReflections(room, spk, lis, c);
    const left = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    const panel = treatmentAtReflection(left, room);
    assert.equal(panel.kind, 'absorber');
    assert.equal(panel.wall, 3);
    const withPanel = firstReflections(room, spk, lis, c, [panel]);
    assert.equal(withPanel.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!.treatedBy, panel.id);
    const off = firstReflections(room, spk, lis, c, [{ ...panel, enabled: false }]);
    assert.equal(off.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!.treatedBy, undefined);
    // and the absorbed bounce is quieter than the bare drywall one
    assert.ok(withPanel.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!.levelDb < left.levelDb);
  });
});

describe('SBIR — the quarter-wave boundary notch', () => {
  it('f = c/(4d): 0.9 m from the front wall → ~95 Hz', () => {
    const room = defaultRoom('metric');
    const c = speedOfSound(20);
    const n = sbirNotches(room, { role: 'L', x: 1.2, y: 0.9, z: 1.2, toeDeg: 0 }, c);
    const front = n.find((x) => x.surface === 'front wall')!;
    near(front.distance, 0.9, 1e-9);
    near(front.notchHz, c / 3.6, 1e-9);
    near(front.notchHz, 95.3, 0.1);
    const floor = n.find((x) => x.surface === 'floor')!;
    near(floor.notchHz, c / 4.8, 1e-9);
  });
});

describe('units — exact conversion both ways', () => {
  it('1 ft = 0.3048 m and 1 in = 0.0254 m, by definition', () => {
    assert.equal(FT, 0.3048);
    assert.equal(IN, 0.0254);
    near(toMetres(10, 'imperial'), 3.048, 1e-12);
    near(fromMetres(3.048, 'imperial'), 10, 1e-12);
    assert.equal(toMetres(2.5, 'metric'), 2.5);
    near(fromMetres(toMetres(7.25, 'imperial'), 'imperial'), 7.25, 1e-12);
  });
  it('formats feet and inches, metres and centimetres', () => {
    assert.equal(fmtLen(3.048, 'imperial'), '10′ 0″');
    assert.equal(fmtLen(0.0254 * 6.5, 'imperial'), '6.5″');
    assert.equal(fmtLen(3.66, 'metric'), '3.66 m');
    assert.equal(fmtLen(0.12, 'metric'), '12 cm');
    assert.equal(fmtLen(1.2, 'metric', { small: true }), '120 cm');
  });
});

describe('stereo geometry and symmetry', () => {
  it('the default layout is the equilateral starting point: 60°, equal paths, on the centre line', () => {
    const d = design();
    const g = stereoGeometry(d.room, d.layouts[0])!;
    near(g.angleDeg, 60, 0.5);
    near(g.pathDiff, 0, 1e-9);
    near(g.axisOffset, 0, 1e-9);
    near(g.wallL.side, g.wallR.side, 1e-9);
    near(g.wallL.front, 0.9, 1e-9);
    near(g.heightDiff, 0, 1e-9);
  });
  it('an off-axis listener breaks the symmetry past the tolerance and is flagged', () => {
    const d = design();
    const lay = { ...d.layouts[0], listener: { ...d.layouts[0].listener, x: d.layouts[0].listener.x + 0.2 } };
    const g = stereoGeometry(d.room, lay)!;
    near(g.axisOffset, 0.2, 1e-9);
    assert.ok(g.pathDiff > SYM_TOL);
    const a = analyze({ ...d, layouts: [lay] });
    assert.ok(a.suggestions.some((s) => /centre line/.test(s.text) && s.tier === 'CALCULATED' && s.level === 'try'));
    assert.ok(a.suggestions.some((s) => /apart in distance to the ears/.test(s.text)));
  });
  it('a listener behind the speakers is a placement conflict', () => {
    const d = design();
    const lay = { ...d.layouts[0], listener: { ...d.layouts[0].listener, y: 0.5 } };
    const a = analyze({ ...d, layouts: [lay] });
    const c = placementConflicts({ ...d, layouts: [lay] }, a);
    assert.ok(c.some((x) => /collapsed/.test(x.text)));
  });
});

describe('absorption — Sabine and Eyring, the calculators’ own formulas', () => {
  it('Sabine RT60 = 0.161·V/A from the surface list, per band', () => {
    const room = defaultRoom('metric');
    const bands = rt60Bands(room, []);
    const lines = surfaceList(room, []);
    const V = roomVolume(room);
    bands.forEach((b, i) => {
      const A = lines.reduce((s, l) => s + l.area * l.alpha[i], 0);
      near(b.sabine, (SABINE_K * V) / A, 1e-9, `band ${b.hz}`);
      near(b.absorption, A, 1e-9);
    });
    assert.equal(SABINE_K, 0.161);
  });
  it('agrees with the Reverberation Time (Sabine) calculator for the same V and A', () => {
    const ws = WORKSPACES_ROOMS_MUSIC.find((w) => w.id === 'sabine')!;
    const fn = ws.functions.find((f) => f.key === 'rtFromVA')!;
    const room = defaultRoom('metric');
    const b500 = rt60Bands(room, []).find((b) => b.hz === 500)!;
    const rows = fn.compute({ vol: roomVolume(room), absA: b500.absorption });
    const rt = rows.find((r) => r.label === 'RT60') as { value: number };
    near(rt.value, b500.sabine, 1e-9);
  });
  it('agrees with the Eyring calculator for the same V, S and ā', () => {
    const ws = WORKSPACES_ROOMS_ADVANCED.find((w) => w.id === 'eyring')!;
    const fn = ws.functions.find((f) => f.key === 'eyring')!;
    const room = defaultRoom('metric');
    const lines = surfaceList(room, []);
    const S = lines.reduce((s, l) => s + l.area, 0);
    const b500 = rt60Bands(room, []).find((b) => b.hz === 500)!;
    const rows = fn.compute({ vol: roomVolume(room), surf: S, aBar: b500.meanAlpha });
    const ey = rows.find((r) => r.label === 'RT60 (EYRING)') as { value: number };
    near(ey.value, b500.eyring, 1e-9);
    assert.ok(b500.eyring < b500.sabine, 'Eyring is always shorter than Sabine');
  });
  it('treatment lowers the decay and the surface list conserves area', () => {
    const room = defaultRoom('metric');
    const bare = rt60Bands(room, []);
    const traps = room.vertices.map((_, i) => basstrapAt(room, i));
    const treated = rt60Bands(room, traps);
    assert.ok(treated[0].sabine < bare[0].sabine, '125 Hz comes down with corner traps');
    assert.ok(treated[2].sabine < bare[2].sabine);
    // A wall panel REPLACES wall area: floor + ceiling + walls − openings is unchanged by it.
    const sumBare = surfaceList(room, []).reduce((s, l) => s + l.area, 0);
    const panel = { id: 'p', kind: 'absorber' as const, wall: 3, pos: 0.5, width: 0.6, height: 1.2, thickness: 0.1, z: 1.2, enabled: true };
    const sumPanel = surfaceList(room, [panel]).reduce((s, l) => s + l.area, 0);
    near(sumPanel, sumBare, 1e-9);
  });
  it('porous absorption grows with thickness at 125 Hz and is already ~1 at 2 kHz; a rug is carpet', () => {
    const thin = treatmentAlpha({ kind: 'absorber', thickness: 0.05 }, 0);
    const thick = treatmentAlpha({ kind: 'absorber', thickness: 0.2 }, 0);
    assert.ok(thin < thick);
    assert.ok(treatmentAlpha({ kind: 'absorber', thickness: 0.05 }, 4) > 0.95);
    assert.equal(treatmentAlpha({ kind: 'rug', thickness: 0.01 }, 2), SURFACES.carpet.alpha[2]);
    for (const k of ['absorber', 'basstrap', 'cloud', 'diffuser', 'rug', 'gobo'] as const) {
      for (let b = 0; b < 6; b++) {
        const a = treatmentAlpha({ kind: k, thickness: 0.1 }, b);
        assert.ok(a >= 0 && a <= 1, `${k} band ${b}: ${a}`);
      }
    }
  });
});

describe('geometry', () => {
  it('shapes: the rectangle is rectangular; angled, irregular and curved are not — and say so', () => {
    const room = defaultRoom('metric');
    assert.equal(isRectangular(room), true);
    for (const shape of ['angled', 'irregular', 'curved'] as const) {
      const r = { ...room, shape, vertices: shapeVertices(shape, 4, 5), curvedWall: shape === 'curved' ? 2 : undefined };
      assert.equal(isRectangular(r), false, shape);
      const a = analyze({ ...design(), room: r });
      assert.equal(a.rectangular, false);
      assert.ok(a.suggestions.some((s) => /not a rectangle/.test(s.text) && s.tier === 'ESTIMATED'), `${shape} carries the less-reliable note`);
      // the bounding box is what the modes used
      near(a.modalDims.W, bounds(r).width, 1e-9);
      near(a.modalDims.L, bounds(r).length, 1e-9);
    }
  });
  it('area, volume, resize and the sloped ceiling', () => {
    const room = defaultRoom('metric');
    near(polygonArea(room.vertices), 20, 1e-9);
    near(roomVolume(room), 50, 1e-9);
    const big = resizeRoom(room, 6, 7.5);
    near(bounds(big).width, 6, 1e-9);
    near(bounds(big).length, 7.5, 1e-9);
    const sloped = { ...room, ceiling: 'sloped' as const, height: 3, heightLow: 2 };
    near(ceilingHeightAt(sloped, 0), 3, 1e-9);
    near(ceilingHeightAt(sloped, 5), 2, 1e-9);
    near(roomVolume(sloped), 20 * 2.5, 1e-6, 'a linear slope averages to its midpoint');
  });
  it('clampInside keeps a dragged point inside the plan', () => {
    const room = defaultRoom('metric');
    const p = clampInside({ x: -3, y: 9 }, room, { x: 1, y: 1 });
    assert.ok(p.x >= 0 && p.x <= 4 && p.y >= 0 && p.y <= 5);
    const alcove = { ...room, shape: 'irregular' as const, vertices: shapeVertices('irregular', 4, 5) };
    const prev = { x: 1, y: 1 };
    assert.deepEqual(clampInside({ x: 3.8, y: 4.8 }, alcove, prev), prev, 'a point in the alcove is rejected');
  });
});

describe('analysis bundle, suggestions and comparison', () => {
  it('never produces a single score; every suggestion carries a tier and ends on measuring', () => {
    const a = analyze(design());
    assert.ok(a.suggestions.length >= 3);
    for (const s of a.suggestions) assert.ok(['CALCULATED', 'ESTIMATED', 'MEASURED'].includes(s.tier));
    assert.equal(a.suggestions[a.suggestions.length - 1].tier, 'MEASURED');
    assert.ok(!JSON.stringify(a).toLowerCase().includes('score'));
  });
  it('the listener on a modal peak / null is named', () => {
    const d = design();
    const atWall = { ...d.layouts[0], listener: { ...d.layouts[0].listener, y: 4.8 } }; // the rear wall: every length mode peaks
    const a = analyze({ ...d, layouts: [atWall] });
    assert.ok(a.listenerZones.some((z) => z.zone === 'peak' && z.mode.axis === 'L'));
    assert.ok(a.suggestions.some((s) => /pressure maximum/.test(s.text)));
    const mid = { ...d.layouts[0], listener: { ...d.layouts[0].listener, y: 2.5 } }; // half way: the first length mode nulls
    const b = analyze({ ...d, layouts: [mid] });
    assert.ok(b.listenerZones.some((z) => z.zone === 'null' && z.mode.axis === 'L'));
  });
  it('diffLayouts reports what moved, and says so when nothing did', () => {
    const d = design();
    const same = { ...d, layouts: [d.layouts[0], { ...d.layouts[0], name: 'Option A' }] };
    assert.ok(/same layout/.test(diffLayouts(same, 0, 1)[0].text));
    const moved = { ...d, layouts: [d.layouts[0], { ...d.layouts[0], name: 'Option A', listener: { ...d.layouts[0].listener, x: d.layouts[0].listener.x + 0.3, y: d.layouts[0].listener.y + 0.4 } }] };
    const lines = diffLayouts(moved, 0, 1);
    assert.ok(lines.some((l) => /Listening position moved 50 cm/.test(l.text)), lines.map((l) => l.text).join('\n'));
    assert.ok(lines.some((l) => /path difference/.test(l.text)));
  });
  it('compareMeasured speaks in MEASURED and finds the nearest modelled mode', () => {
    const d = { ...design(), measured: { rt60Mid: 0.6, modeHz: 35 } };
    const a = analyze(d);
    const m = compareMeasured(d, a);
    assert.equal(m.length, 2);
    for (const x of m) assert.equal(x.tier, 'MEASURED');
    assert.ok(/34\.3 Hz/.test(m[1].text));
    assert.equal(compareMeasured({ ...d, measured: {} }, a).length, 0);
  });
  it('defaultLayout places L and R symmetric at tweeter = ear height', () => {
    const l = defaultLayout(defaultRoom('metric'));
    const L = l.speakers.find((s) => s.role === 'L')!;
    const R = l.speakers.find((s) => s.role === 'R')!;
    near(L.x + R.x, 4, 1e-9);
    assert.equal(L.z, l.listener.earZ);
  });
});
