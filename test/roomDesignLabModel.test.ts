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
  channelGeometry,
  clampInside,
  coincidentModes,
  compareMeasured,
  defaultDesign,
  defaultLayout,
  defaultRoom,
  depthLimitHz,
  diffLayouts,
  directivityDb,
  firstReflections,
  fmtLen,
  freeOpeningSlot,
  fromMetres,
  FT,
  IN,
  isRectangular,
  keepDesignInside,
  MEASURED_OUT_OF_RANGE,
  mirrorAcrossEdge,
  modeFrequency,
  modePressure,
  placementConflicts,
  pointInPolygon,
  polygonArea,
  polygonIsSimple,
  polygonIsValidRoom,
  pushInside,
  resizeDesign,
  resizeRoom,
  roomModes,
  roomVolume,
  rt60Bands,
  rtImbalance,
  SABINE_K,
  sbirNotches,
  shapeVertices,
  speedOfSound,
  START_LAYOUT,
  stereoGeometry,
  subBoundaries,
  SURFACES,
  surfaceList,
  surroundPosition,
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
    const modes = roomModes(c, 5, 4, 2.5, undefined, 300);
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
  it('the list is COMPLETE up to 300 Hz: per-axis nMax = ceil(2·dim·maxHz/c) (audio review 9)', () => {
    const modes = roomModes(c, 5, 4, 2.5);
    // 5 m length: n·c/10 ≤ 300 → n ≤ 8.74, so eight length axials (the old order-4 cap stopped at 137 Hz)
    assert.deepEqual(modes.filter((m) => m.axis === 'L').map((m) => m.nx), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(modes.filter((m) => m.axis === 'W').map((m) => m.ny), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(modes.filter((m) => m.axis === 'H').map((m) => m.nz), [1, 2, 3, 4]);
    // every mode the equation allows under 300 Hz is there, none above
    let count = 0;
    for (let nx = 0; nx <= 9; nx++) for (let ny = 0; ny <= 8; ny++) for (let nz = 0; nz <= 5; nz++) if (nx + ny + nz > 0 && modeFrequency(c, 5, 4, 2.5, nx, ny, nz) <= 300) count++;
    assert.equal(modes.length, count);
    // the explicit order cap still caps (the calculator-parity test uses it)
    assert.equal(roomModes(c, 5, 4, 2.5, 2, 100000).filter((m) => m.axis === 'L').length, 2);
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
  it('near-coincident is restricted like the calculator: one axial in the pair, both ≤ 150 Hz (audio review 10)', () => {
    const modes = roomModes(c, 5, 4, 2.5);
    const pairs = coincidentModes(modes);
    assert.ok(pairs.length >= 3 && pairs.length < 20, `${pairs.length} pairs — it used to flag 98 of 109`);
    for (const [a, b] of pairs) {
      assert.ok(a.kind === 'axial' || b.kind === 'axial');
      assert.ok(a.f <= 150 && b.f <= 150);
    }
    // the default room's first pair is the exact 2:1 stack (2,0,0) = (0,0,1) = 68.6 Hz, named as such
    const [m1, m2] = pairs[0];
    near(m1.f, 68.64, 0.01);
    near(m2.f, 68.64, 0.01);
    const s = analyze(design()).suggestions.find((x) => /both land at 68\.6 Hz/.test(x.text))!;
    assert.ok(s, 'the pair is named, not "68.6 Hz and 68.6 Hz"');
    assert.match(s.text, /axial \(0,0,1\) and axial \(2,0,0\)|axial \(2,0,0\) and axial \(0,0,1\)/);
    assert.match(s.text, /5\.00 m length is exactly 2 × the 2\.50 m height/);
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
  it('the wall reflection point sits at fraction u of the climb from the speaker (audio review 12: hit.u, not 1 − u)', () => {
    // tweeter 1.0 m, ears 1.4 m: the left wall is a third of the way along the image path
    const refl = firstReflections(room, { ...spk, z: 1.0 }, { ...lis, earZ: 1.4 }, c);
    const left = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    near(left.point.z, 1.0 + 0.4 / 3, 1e-9, 'a third of the 0.4 m climb');
    const front = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 0)!;
    // image (1, −1) → listener (2, 3): y = 0 at u = 1/4
    near(front.point.z, 1.0 + 0.4 / 4, 1e-9);
  });
  it('one reflection per wall that the image path actually crosses, sorted by delay', () => {
    const refl = firstReflections(room, spk, lis, c);
    const walls = refl.filter((r) => r.surface.kind === 'wall');
    assert.ok(walls.length >= 3 && walls.length <= 4);
    for (let i = 1; i < refl.length; i++) assert.ok(refl[i].delayMs >= refl[i - 1].delayMs);
    for (const r of refl) assert.ok(r.levelDb < 0, 'a reflection is always below the direct sound');
  });
  it('directivity D(θ): 0 to 30°, −3 at 60°, −6 at 90°, −12 at 135°, −15 at 180°, linear between (audio review 5)', () => {
    assert.equal(directivityDb(0), 0);
    assert.equal(directivityDb(30), 0);
    near(directivityDb(45), -1.5, 1e-9);
    assert.equal(directivityDb(60), -3);
    assert.equal(directivityDb(90), -6);
    assert.equal(directivityDb(135), -12);
    assert.equal(directivityDb(180), -15);
    near(directivityDb(136), -12.0667, 1e-3);
  });
  it('toe-in moves the reflection levels: the default front-wall bounce leaves at 136° and reads ≈ −18.5 dB, below the side wall', () => {
    const d = design();
    const L = d.layouts[0].speakers[0];
    const refl = firstReflections(d.room, L, d.layouts[0].listener, speedOfSound(20));
    const front = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 0)!;
    const side = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    near(front.offAxisDeg, 136, 0.5);
    near(front.levelDb, -18.5, 0.1);
    near(side.levelDb, -13.9, 0.1);
    assert.ok(front.levelDb < side.levelDb, 'the front-wall bounce (behind the speaker) is now weaker than the side wall');
    // straight ahead (no toe-in): the side wall's departure angle shrinks and its level rises
    const straight = firstReflections(d.room, { ...L, toeDeg: 0 }, d.layouts[0].listener, speedOfSound(20));
    const side0 = straight.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    assert.ok(side0.offAxisDeg < side.offAxisDeg);
    assert.ok(side0.levelDb > side.levelDb);
  });
  it('the desk top is a modelled reflection (audio review 4): image at 2h − z, the strongest early bounce in the default room', () => {
    const d = design();
    const a = analyze(d);
    const desk = a.reflections.find((r) => r.surface.kind === 'desk' && r.speaker === 'L')!;
    assert.ok(desk, 'the default layout bounces off the desk');
    near(desk.point.z, 0.74, 1e-9);
    // tweeter 1.2 and ears 1.2 → the bounce is at the midpoint of the run
    const L = d.layouts[0].speakers[0];
    const lis = d.layouts[0].listener;
    near(desk.point.x, (L.x + lis.x) / 2, 1e-9);
    near(desk.pathLen, Math.hypot(1.6, 2 * (1.2 - 0.74)), 1e-9);
    near(desk.delayMs, 0.72, 0.01);
    assert.equal(a.reflections[0].surface.kind, 'desk', 'it arrives first');
    assert.ok(desk.levelDb > -3, `≈ −1.6 dB: ${desk.levelDb}`);
    assert.ok(a.suggestions.some((s) => /desk top bounces/.test(s.text)));
    assert.equal(treatmentAtReflection(desk, d.room), null, 'nothing in the kit treats a desk top');
    // move the desk away and the bounce goes
    const noDesk = analyze({ ...d, room: { ...d.room, features: [] } });
    assert.ok(!noDesk.reflections.some((r) => r.surface.kind === 'desk'));
  });
  it('in a non-convex plan a path that would pass through another wall is dropped (audio review 18)', () => {
    const alcove = { ...room, shape: 'irregular' as const, vertices: shapeVertices('irregular', 4, 5) };
    // The alcove removes the rear-right corner (x > 2.96, y > 3.1). A speaker
    // deep in the room's right half and a listener in the left: the image
    // in the alcove's far wall would cross the alcove's inner wall.
    const refl = firstReflections(alcove, { role: 'L', x: 2.5, y: 4.5, z: 1.2, toeDeg: 0 }, { x: 0.5, y: 1, earZ: 1.2 }, c);
    for (const r of refl) {
      if (r.surface.kind !== 'wall') continue;
      // the two legs stay inside the plan: sample along each
      const S = { x: 2.5, y: 4.5 };
      const Lp = { x: 0.5, y: 1 };
      for (let k = 0.1; k < 1; k += 0.2) {
        assert.ok(pointInPolygon({ x: S.x + (r.point.x - S.x) * k, y: S.y + (r.point.y - S.y) * k }, alcove.vertices), `leg 1 of wall ${r.surface.edge + 1} crosses a wall`);
        assert.ok(pointInPolygon({ x: r.point.x + (Lp.x - r.point.x) * k, y: r.point.y + (Lp.y - r.point.y) * k }, alcove.vertices), `leg 2 of wall ${r.surface.edge + 1} crosses a wall`);
      }
    }
  });
  it('a reflection point covered by an enabled absorber reads treatedBy; disabled does not', () => {
    const refl = firstReflections(room, spk, lis, c);
    const left = refl.find((r) => r.surface.kind === 'wall' && r.surface.edge === 3)!;
    const panel = treatmentAtReflection(left, room)!;
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

describe('SBIR — the first cancellation AT THE SEAT from the image-source path difference (audio review 2)', () => {
  const c = speedOfSound(20);
  it('default room: floor Δ 1.284 m → 133.6 Hz, side wall Δ 1.887 m → 90.9 Hz, front wall Δ 1.685 m → 101.9 Hz', () => {
    const d = design();
    const L = d.layouts[0].speakers[0];
    const n = sbirNotches(d.room, L, d.layouts[0].listener, c);
    const floor = n.find((x) => x.surface === 'floor')!;
    const side = n.find((x) => x.surface === 'wall 4')!;
    const front = n.find((x) => x.surface === 'front wall')!;
    near(floor.pathDiff, 1.284, 0.001);
    near(floor.notchHz, 133.6, 0.1);
    near(side.pathDiff, 1.887, 0.001);
    near(side.notchHz, 90.9, 0.1);
    near(front.pathDiff, 1.685, 0.001);
    near(front.notchHz, 101.9, 0.1);
    near(front.distance, 0.9, 1e-9, 'the perpendicular distance is still reported');
    for (const x of n) near(x.notchHz, c / (2 * x.pathDiff), 1e-9);
    // c/(4d) is only the on-axis special case: it would have said 95.3 / 71.5 / 71.5
    assert.ok(Math.abs(front.notchHz - c / 3.6) > 5);
  });
  it('the sub is never in the list, and notches above 300 Hz are not shown (audio review 3)', () => {
    const d = design();
    assert.deepEqual(sbirNotches(d.room, { role: 'SUB', x: 0.45, y: 0.45, z: 0.25, toeDeg: 0 }, d.layouts[0].listener, c), []);
    const a = analyze({ ...d, layouts: [{ ...d.layouts[0], speakers: [...d.layouts[0].speakers, { role: 'SUB', x: 0.45, y: 0.45, z: 0.25, toeDeg: 0 }] }] });
    assert.ok(!a.sbir.some((s) => s.speaker === 'SUB'));
    for (const s of a.sbir) assert.ok(s.notchHz <= 300);
    // a tweeter 10 cm off the floor would notch far above 300 Hz — dropped
    const low = sbirNotches(d.room, { ...d.layouts[0].speakers[0], z: 0.1 }, d.layouts[0].listener, c);
    assert.ok(!low.some((s) => s.surface === 'floor'));
  });
  it('a floor sub near a corner gets boundary GAIN: front wall, side wall and floor within λ/4', () => {
    const d = design();
    const b = subBoundaries(d.room, { role: 'SUB', x: 0.3, y: 0.3, z: 0.2, toeDeg: 0 });
    assert.equal(b.count, 3);
    assert.deepEqual(b.names, ['front wall', 'wall 4', 'floor']);
    assert.equal(subBoundaries(d.room, { role: 'SUB', x: 2, y: 2.5, z: 0.2, toeDeg: 0 }).count, 1);
  });
  it('the front-wall suggestion merges L and R when they stand at the same distance (cognitive review 15) and speaks the seat notch', () => {
    const a = analyze(design());
    const s = a.suggestions.filter((x) => /front wall/.test(x.text) && /cancellation/.test(x.text));
    assert.equal(s.length, 1, 'one merged line, not two verbatim duplicates');
    assert.match(s[0].text, /^Both speakers are 90 cm from the front wall/);
    assert.match(s[0].text, /101\.9 Hz/);
    assert.match(s[0].text, /woofer/);
    assert.match(s[0].text, /under about 0\.5 m/);
    assert.match(s[0].text, /over about 2 m/);
  });
});

describe('multichannel — ITU-R BS.775 (audio review 8)', () => {
  it('the surrounds land on the L/R radius at ±110° behind the seat, equidistant', () => {
    const d = design();
    const lay = d.layouts[0];
    const LS = surroundPosition(d.room, lay, 'LS');
    const RS = surroundPosition(d.room, lay, 'RS');
    near(Math.hypot(LS.x - lay.listener.x, LS.y - lay.listener.y), 1.6, 1e-9);
    near(LS.x + RS.x, 2 * lay.listener.x, 1e-9, 'mirrored');
    assert.ok(LS.y > lay.listener.y, 'behind the seat');
    const full = { ...lay, speakers: [...lay.speakers, { role: 'LS' as const, ...LS, z: 1.2, toeDeg: 0 }, { role: 'RS' as const, ...RS, z: 1.2, toeDeg: 0 }, { role: 'C' as const, x: 2, y: 0.9, z: 1.2, toeDeg: 0 }] };
    const g = channelGeometry(full);
    const by = (r: string) => g.find((x) => x.role === r)!;
    near(by('L').angleDeg, 30, 1e-6);
    near(by('LS').angleDeg, 110, 1e-6);
    near(by('RS').angleDeg, 110, 1e-6);
    assert.equal(by('LS').side, 'L');
    assert.equal(by('RS').side, 'R');
    assert.deepEqual(by('LS').flags, []);
    assert.deepEqual(by('RS').flags, []);
    near(by('C').angleDeg, 0, 1e-6);
    assert.ok(by('C').flags.some((f) => /nearer than L/.test(f)), 'the centre on the front line is nearer than L — flagged');
  });
  it('a surround at 141° (the old spawn) is flagged', () => {
    const d = design();
    const lay = d.layouts[0];
    const g = channelGeometry({ ...lay, speakers: [...lay.speakers, { role: 'LS', x: 1.2, y: lay.listener.y + 1.0, z: 1.2, toeDeg: 20 }] });
    const ls = g.find((x) => x.role === 'LS')!;
    assert.ok(ls.angleDeg > 135);
    assert.ok(ls.flags.some((f) => /outside 100–120°/.test(f)));
  });
  it('a surround stays inside a small room', () => {
    const d = design();
    const lay = { ...d.layouts[0], listener: { ...d.layouts[0].listener, x: 0.4 } };
    const LS = surroundPosition(d.room, lay, 'LS');
    assert.ok(pointInPolygon(LS, d.room.vertices));
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
  });
  it('imperial rounds the inches first and carries 12 → 1 ft: never "1′ 12″" or "12.0″" (audio review 11)', () => {
    assert.equal(fmtLen(0.0254 * 11.97, 'imperial'), '1′ 0″');
    assert.equal(fmtLen(0.0254 * 23.6, 'imperial'), '2′ 0″');
    assert.equal(fmtLen(0.0254 * 23.4, 'imperial'), '1′ 11″');
    assert.equal(fmtLen(0.0254 * 11.94, 'imperial'), '11.9″');
    assert.equal(fmtLen(-0.0254 * 6.5, 'imperial'), '-6.5″');
  });
  it('`small` prefers cm / inches only below 1 m; above it metres (cognitive review 12: no "731 cm")', () => {
    assert.equal(fmtLen(7.31, 'metric', { small: true }), '7.31 m');
    assert.equal(fmtLen(10.11, 'metric', { small: true }), '10.11 m');
    assert.equal(fmtLen(0.9, 'metric', { small: true }), '90 cm');
    assert.equal(fmtLen(0.9, 'imperial', { small: true }), '35.4″');
    assert.equal(fmtLen(1.2, 'imperial', { small: true }), '3′ 11″');
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
  it('porous absorption grows with thickness at 125 Hz and is already ~1 at 2 kHz; a rug is a THICK rug with underlay', () => {
    const thin = treatmentAlpha({ kind: 'absorber', thickness: 0.05 }, 0);
    const thick = treatmentAlpha({ kind: 'absorber', thickness: 0.2 }, 0);
    assert.ok(thin < thick);
    assert.ok(treatmentAlpha({ kind: 'absorber', thickness: 0.05 }, 4) > 0.95);
    assert.equal(treatmentAlpha({ kind: 'rug', thickness: 0.01 }, 0), 0.14);
    assert.equal(treatmentAlpha({ kind: 'rug', thickness: 0.01 }, 1), 0.37);
    assert.equal(treatmentAlpha({ kind: 'rug', thickness: 0.01 }, 2), 0.6);
    assert.ok(treatmentAlpha({ kind: 'rug', thickness: 0.01 }, 0) > SURFACES.carpet.alpha[0], 'more than bare carpet in the lows');
    for (const k of ['absorber', 'basstrap', 'cloud', 'diffuser', 'rug', 'gobo'] as const) {
      for (let b = 0; b < 6; b++) {
        const a = treatmentAlpha({ kind: k, thickness: 0.1 }, b);
        assert.ok(a >= 0 && a <= 1, `${k} band ${b}: ${a}`);
      }
    }
  });
  it('thickness caps the PRODUCT, not the multiplier: 5 cm 0.11/0.30/0.69 · 10 cm 0.29/0.60/0.98 · 20 cm 0.77/0.99/0.99 (audio review 1)', () => {
    const at = (t: number, b: number) => Number(treatmentAlpha({ kind: 'absorber', thickness: t }, b).toFixed(2));
    assert.deepEqual([at(0.05, 0), at(0.05, 1), at(0.05, 2)], [0.11, 0.3, 0.69]);
    assert.deepEqual([at(0.1, 0), at(0.1, 1), at(0.1, 2)], [0.29, 0.6, 0.98]);
    assert.deepEqual([at(0.2, 0), at(0.2, 1), at(0.2, 2)], [0.77, 0.99, 0.99]);
    assert.ok(at(0.4, 0) > at(0.1, 0), 'a 40 cm panel is no longer frozen at the 10 cm value');
    const trap = (t: number, b: number) => Number(treatmentAlpha({ kind: 'basstrap', thickness: t }, b).toFixed(2));
    assert.deepEqual([trap(0.1, 0), trap(0.1, 1)], [0.55, 0.8]);
    assert.equal(trap(0.3, 0), 0.99);
    const cloud = (t: number, b: number) => Number(treatmentAlpha({ kind: 'cloud', thickness: t }, b).toFixed(2));
    assert.deepEqual([cloud(0.1, 0), cloud(0.1, 1)], [0.41, 0.72]);
    assert.equal(cloud(0.2, 0), 0.99);
    // the quarter-wave rule for "works down to"
    near(depthLimitHz(0.1, 343.2), 858, 0.5);
    near(depthLimitHz(0.3, 343.2), 286, 0.5);
  });
  it('a bass/treble decay imbalance is called out: thin panels everywhere (safety review 3)', () => {
    const room = defaultRoom('metric');
    // enough 2.5 cm panels to deaden the mids and highs while 125 Hz stays long
    const thin = [0, 1, 2, 3].flatMap((w) => [0.2, 0.5, 0.8].map((pos, i) => ({ id: `t${w}${i}`, kind: 'absorber' as const, wall: w, pos, width: 1.2, height: 2.2, thickness: 0.025, z: 1.2, enabled: true })));
    const d = { ...design(), treatment: thin };
    const a = analyze(d);
    const imb = rtImbalance(a.rt60)!;
    assert.ok(imb.ratio > 1.5, `125 Hz decays ${imb.ratio.toFixed(2)}× the 2 kHz decay`);
    assert.ok(a.rt60Mid <= 0.4);
    const s = a.suggestions.find((x) => /decays about/.test(x.text))!;
    assert.ok(s, 'the imbalance suggestion fires');
    assert.equal(s.level, 'check');
    assert.match(s.text, /Add depth \(corner traps, thicker panels\), not more thin panels/);
    // the bare room is balanced enough: no such line
    assert.ok(!analyze(design()).suggestions.some((x) => /decays about/.test(x.text)));
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
  it('clampInside keeps a dragged point inside the plan — a point outside the polygon slides to the nearest inside point', () => {
    const room = defaultRoom('metric');
    const p = clampInside({ x: -3, y: 9 }, room, { x: 1, y: 1 });
    assert.ok(p.x >= 0 && p.x <= 4 && p.y >= 0 && p.y <= 5);
    const alcove = { ...room, shape: 'irregular' as const, vertices: shapeVertices('irregular', 4, 5) };
    const prev = { x: 1, y: 1 };
    const q = clampInside({ x: 3.8, y: 4.8 }, alcove, prev);
    assert.ok(pointInPolygon(q, alcove.vertices), 'a point in the alcove is pushed back inside');
    assert.ok(Math.hypot(q.x - 3.8, q.y - 4.8) < 1.2, 'to the NEAREST inside point, not back to where it was');
  });
  it('a sloped, vaulted or mixed ceiling takes the ESTIMATED path even over a rectangular plan (audio review 6)', () => {
    const d = design();
    assert.equal(isRectangular(d.room), true);
    for (const ceiling of ['sloped', 'vaulted', 'mixed'] as const) {
      const r = { ...d.room, ceiling, heightLow: 2.2 };
      assert.equal(isRectangular(r), false, ceiling);
      const a = analyze({ ...d, room: r });
      assert.equal(a.rectangular, false);
      const s = a.suggestions.find((x) => /mean ceiling height/.test(x.text))!;
      assert.ok(s, `${ceiling} says it used the mean ceiling height`);
      assert.equal(s.tier, 'ESTIMATED');
      assert.match(s.text, new RegExp(`${ceiling} ceiling`));
    }
  });
  it('polygon validity: a bow-tie or a < 1 m² plan is refused; corners stay within 15 m (safety review 5)', () => {
    assert.equal(polygonIsSimple([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 0, y: 5 }]), true);
    assert.equal(polygonIsSimple([{ x: 0, y: 0 }, { x: 4, y: 5 }, { x: 4, y: 0 }, { x: 0, y: 5 }]), false, 'a bow-tie crosses itself');
    assert.equal(polygonIsValidRoom([{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: 0, y: 1 }]), false, 'half a square metre');
    assert.equal(polygonIsValidRoom([{ x: 0, y: 0 }, { x: 16, y: 0 }, { x: 16, y: 5 }, { x: 0, y: 5 }]), false, 'past 15 m');
    assert.equal(polygonIsValidRoom(shapeVertices('irregular', 4, 5)), true);
    assert.equal(polygonIsValidRoom(shapeVertices('angled', 4, 5)), true);
  });
  it('pushInside: inside stays put; outside lands at the nearest inside point', () => {
    const v = defaultRoom('metric').vertices;
    assert.deepEqual(pushInside({ x: 1, y: 1 }, v), { x: 1, y: 1 });
    const p = pushInside({ x: -1, y: 2 }, v);
    near(p.x, 0.15, 1e-9);
    near(p.y, 2, 1e-9);
    assert.ok(pointInPolygon(pushInside({ x: 9, y: 9 }, v), v));
  });
  it('resizeDesign scales the layouts and the furniture together and keeps everything inside (cognitive review 1)', () => {
    const d = design();
    const big = resizeDesign(d, 8, 12.4);
    const lay = big.layouts[0];
    near(lay.listener.x, d.layouts[0].listener.x * 2, 1e-9);
    near(lay.listener.y, d.layouts[0].listener.y * 2.48, 1e-9);
    near(big.room.features[0].y, 1.55 * 2.48, 1e-9);
    assert.ok(big.room.features[0].y < lay.listener.y, 'the desk is still in front of the listener');
    for (const s of lay.speakers) assert.ok(pointInPolygon(s, big.room.vertices));
    assert.ok(pointInPolygon(lay.listener, big.room.vertices));
    // shrinking to 2 × 2 pushes the speakers in rather than leaving them outside
    const small = resizeDesign(d, 2, 2);
    for (const s of small.layouts[0].speakers) assert.ok(pointInPolygon(s, small.room.vertices));
    assert.ok(pointInPolygon(small.layouts[0].listener, small.room.vertices));
  });
  it('keepDesignInside pushes a speaker left outside by a reshape back in, and placementConflicts names one that is not (safety review 5, cognitive review 2)', () => {
    const d = design();
    const angled = { ...d, room: { ...d.room, shape: 'angled' as const, vertices: shapeVertices('angled', 4, 5) } };
    const wide = { ...angled, layouts: [{ ...angled.layouts[0], speakers: angled.layouts[0].speakers.map((s) => ({ ...s, x: s.role === 'L' ? 0.1 : 3.9, y: 0.3 })) }] };
    const a = analyze(wide);
    const c = placementConflicts(wide, a);
    assert.ok(c.some((x) => /L speaker is outside the room outline/.test(x.text)));
    assert.ok(c.some((x) => /R speaker is outside the room outline/.test(x.text)));
    const fixed = keepDesignInside(wide);
    for (const s of fixed.layouts[0].speakers) assert.ok(pointInPolygon(s, fixed.room.vertices), s.role);
    assert.ok(!placementConflicts(fixed, analyze(fixed)).some((x) => /outside the room outline/.test(x.text)));
  });
  it('freeOpeningSlot avoids the opening already on the wall (cognitive review 9)', () => {
    const room = defaultRoom('metric'); // window at 0.55 on wall 2 (edge 1), door at 0.78 on wall 3 (edge 2)
    const w = freeOpeningSlot(room, 1, 1.2);
    assert.equal(w.wall, 1);
    const len = 5;
    assert.ok(Math.abs(w.pos * len - 0.55 * len) >= 1.2 + 0.1, 'clear of the existing window');
    const dr = freeOpeningSlot(room, 2, 0.9);
    assert.equal(dr.wall, 2);
    assert.ok(Math.abs(dr.pos * 4 - 0.78 * 4) >= 0.9 + 0.1);
    // a wall that is full moves on to the next one
    const full = { ...room, openings: [0.2, 0.4, 0.6, 0.8].map((pos, i) => ({ id: `o${i}`, kind: 'window' as const, wall: 1, pos, width: 0.9, height: 1, sill: 1 })) };
    assert.notEqual(freeOpeningSlot(full, 1, 1.2).wall, 1);
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
  it('per-axis null copy (audio 7, safety 1, cognitive 3): only the LENGTH axis says "move"; the centre-line width null is OK; the height null is ⓘ', () => {
    const a = analyze(design()); // centred, seated: null of L1, W1 and H1
    assert.deepEqual(a.listenerZones.map((z) => `${z.mode.axis}:${z.zone}`), ['L:null', 'W:null', 'H:null']);
    const L = a.suggestions.find((s) => /L-axis mode 34\.3 Hz/.test(s.text))!;
    assert.equal(L.level, 'check');
    assert.match(L.text, /Move fore\/aft — try the seat at roughly 35–40 % of the room length/);
    const W = a.suggestions.find((s) => /every odd width mode/.test(s.text))!;
    assert.equal(W.level, 'ok', 'the width null on the centre line is the accepted trade, not a warning');
    assert.match(W.text, /here 42\.9 Hz/);
    assert.match(W.text, /Keep the symmetry/);
    const H = a.suggestions.find((s) => /first height mode/.test(s.text))!;
    assert.equal(H.level, 'info');
    assert.match(H.text, /not a reason to move/);
    assert.ok(a.suggestions.some((s) => s.level === 'info' && /SHAPE of each mode, not how strongly the speakers excite it/.test(s.text)), 'the map-shows-shape note');
    // never "move off the centre line" for the width axis
    assert.ok(!a.suggestions.some((s) => /W-axis/.test(s.text) && /move the position/.test(s.text)));
    // "!" first, then "▸", then "✓", then ⓘ; measuring closes the list
    const order = { check: 0, try: 1, ok: 2, info: 3 } as const;
    const body = a.suggestions.slice(0, -1);
    for (let i = 1; i < body.length; i++) assert.ok(order[body[i].level] >= order[body[i - 1].level], `${body[i - 1].level} before ${body[i].level}`);
    assert.equal(a.suggestions[a.suggestions.length - 1].tier, 'MEASURED');
  });
  it('the measured fields are bounded: RT60 0.05–3 s, resonance 20–300 Hz (safety review 14)', () => {
    const d = { ...design(), measured: { rt60Mid: 7, modeHz: 1200 } };
    const m = compareMeasured(d, analyze(d));
    assert.equal(m.length, 2);
    for (const x of m) assert.ok(x.text.includes(MEASURED_OUT_OF_RANGE), x.text);
    const ok = compareMeasured({ ...d, measured: { rt60Mid: 0.5, modeHz: 48 } }, analyze(d));
    for (const x of ok) assert.ok(!x.text.includes(MEASURED_OUT_OF_RANGE));
  });
  it('the desk conflict fires when a monitor STANDS ON the desk (audio review 4: z > h, not z < h + 0.05)', () => {
    const d = design();
    const onDesk = { ...d.layouts[0], speakers: d.layouts[0].speakers.map((s) => ({ ...s, x: s.role === 'L' ? 1.5 : 2.5, y: 1.55, z: 0.74 + 0.25 })) };
    const dd = { ...d, layouts: [onDesk] };
    const c = placementConflicts(dd, analyze(dd));
    assert.ok(c.some((x) => /L speaker stands on the desk/.test(x.text)), c.map((x) => x.text).join('\n'));
    // high on stands behind the desk's footprint edge: no desk conflict
    const stands = { ...d.layouts[0], speakers: d.layouts[0].speakers.map((s) => ({ ...s, z: 1.5 })) };
    assert.ok(!placementConflicts({ ...d, layouts: [stands] }, analyze({ ...d, layouts: [stands] })).some((x) => /desk/.test(x.text)));
    // the wall-clearance line carries the port / boundary-switch advice (safety review 10)
    const tight = { ...d.layouts[0], speakers: d.layouts[0].speakers.map((s) => ({ ...s, y: 0.1 })) };
    const tc = placementConflicts({ ...d, layouts: [tight] }, analyze({ ...d, layouts: [tight] }));
    assert.ok(tc.some((x) => /clearance the maker specifies behind a rear port/.test(x.text)));
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
  it('defaultLayout places L and R symmetric at tweeter = ear height, in the START slot', () => {
    const l = defaultLayout(defaultRoom('metric'));
    const L = l.speakers.find((s) => s.role === 'L')!;
    const R = l.speakers.find((s) => s.role === 'R')!;
    near(L.x + R.x, 4, 1e-9);
    assert.equal(L.z, l.listener.earZ);
    assert.equal(l.name, START_LAYOUT);
    assert.equal(START_LAYOUT, 'Start');
    assert.equal(defaultDesign().layouts[0].name, 'Start');
  });
});
