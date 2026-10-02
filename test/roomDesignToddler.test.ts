/**
 * Room Design & Monitoring Lab — toddler + cat bug pass 1 of 3 (2026-10-01).
 * Each block is the receipt for one fix: it failed before the fix and passes
 * after it (model behaviour where the bug lives in the model; a source guard
 * where it lives in a view the node runner cannot mount).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const M = (await import('../src/screens/lab/roomdesign/roomModel.ts')) as Record<string, unknown> & typeof import('../src/screens/lab/roomdesign/roomModel.ts');
const { analyze, bounds, ceilingHeightAt, defaultDesign, edgePoint, keepDesignInside, pointInPolygon, polygonArea, shapeVertices, surfaceList } = M;
type RoomDesign = import('../src/screens/lab/roomdesign/roomModel.ts').RoomDesign;
type Treatment = import('../src/screens/lab/roomdesign/roomModel.ts').Treatment;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab/roomdesign/';

const absorber = (wall: number, pos = 0.5): Treatment => ({ id: `a${wall}`, kind: 'absorber', wall, pos, width: 0.6, height: 1.2, thickness: 0.1, z: 1.2, enabled: true });

/** SHAPE → IRREGULAR (six walls), panels on walls 5 and 6, then SHAPE →
 *  RECTANGLE: the plan has four walls but the panels still name walls 4/5. */
function irregularThenRect(): RoomDesign {
  const d = defaultDesign();
  const irr: RoomDesign = { ...d, room: { ...d.room, shape: 'irregular', vertices: shapeVertices('irregular', 4, 5) } };
  const treated: RoomDesign = {
    ...irr,
    room: { ...irr.room, openings: [...irr.room.openings, { id: 'o5', kind: 'window', wall: 5, pos: 0.5, width: 1, height: 1, sill: 1 }] },
    treatment: [absorber(5), absorber(4), { ...absorber(0), id: 'bt', kind: 'basstrap', wall: 5, pos: undefined }],
  };
  return { ...treated, room: { ...treated.room, shape: 'rect', vertices: shapeVertices('rect', 4, 5) } };
}

describe('SHAPE to fewer walls never strands a panel or an opening on a wall that is gone', () => {
  it('keepDesignInside (run on every room edit) brings every wall index back onto the plan', () => {
    const fixed = keepDesignInside(irregularThenRect());
    const n = fixed.room.vertices.length;
    for (const t of fixed.treatment) assert.ok(t.wall != null && t.wall >= 0 && t.wall < n, `${t.id} on wall ${t.wall}`);
    for (const o of fixed.room.openings) assert.ok(o.wall >= 0 && o.wall < n, `${o.id} on wall ${o.wall}`);
  });
  it('the plan can place every panel (the glyph read v[wall].x — a TypeError, a red screen in EXPLORE / TREATMENT / REVIEW)', () => {
    const fixed = keepDesignInside(irregularThenRect());
    for (const t of fixed.treatment.filter((x) => x.kind === 'absorber')) {
      const p = edgePoint(fixed.room.vertices, t.wall!, t.pos!);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  });
  it('an opening the plan draws is an opening the absorption sum counts (it was drawn on wall %n but dropped from the model)', () => {
    const fixed = keepDesignInside(irregularThenRect());
    const lines = surfaceList(fixed.room, fixed.treatment);
    assert.equal(lines.filter((l) => /^Window on wall/.test(l.label)).length, 2, 'both windows counted');
  });
});

describe('furniture and free-standing treatment stay in the room when dragged off the edge', () => {
  it('a desk dragged far outside the plan (a fast drag off the glass) is brought back inside', () => {
    const d = defaultDesign();
    const out: RoomDesign = { ...d, room: { ...d.room, features: d.room.features.map((f) => ({ ...f, x: 40, y: -12 })) } };
    const fixed = keepDesignInside(out);
    for (const f of fixed.room.features) assert.ok(pointInPolygon(f, fixed.room.vertices), `${f.kind} at ${f.x},${f.y}`);
  });
  it('moveTreatment (the TREATMENT drag) keeps a rug, a cloud and a gobo inside; a wall panel still slides along its wall', () => {
    const d = defaultDesign();
    const moveTreatment = M.moveTreatment as (t: Treatment, p: { x: number; y: number }, room: RoomDesign['room']) => Treatment;
    assert.equal(typeof moveTreatment, 'function');
    for (const kind of ['rug', 'cloud', 'gobo'] as const) {
      const t: Treatment = { id: kind, kind, x: 2, y: 2, width: 1.2, height: 1.2, thickness: 0.1, z: 1, enabled: true };
      const moved = moveTreatment(t, { x: -30, y: 55 }, d.room);
      assert.ok(pointInPolygon({ x: moved.x!, y: moved.y! }, d.room.vertices), `${kind} at ${moved.x},${moved.y}`);
    }
    const slid = moveTreatment(absorber(1, 0.5), { x: 9, y: 4 }, d.room);
    assert.equal(slid.wall, 1);
    assert.ok(Math.abs(slid.pos! - 0.8) < 1e-9);
    const screen = strip(read(`${LAB}modules/modTreatment.tsx`));
    assert.match(screen, /ts\.map\(\(t\) => \(t\.id === tid \? moveTreatment\(t, p, room\) : t\)\)/, 'the drag goes through moveTreatment');
  });
});

describe('heights stay under the ceiling that is actually there', () => {
  const vaulted = (): RoomDesign => {
    const d = defaultDesign();
    return { ...d, room: { ...d.room, ceiling: 'vaulted', height: 4, heightLow: 2 } };
  };
  it('zCapAt follows the local ceiling (a vaulted room is low at the front where the speakers stand)', () => {
    const zCapAt = M.zCapAt as (room: RoomDesign['room'], y: number) => number;
    assert.equal(typeof zCapAt, 'function');
    const d = vaulted();
    assert.ok(Math.abs(zCapAt(d.room, 0.9) - (ceilingHeightAt(d.room, 0.9) - 0.1)) < 1e-9);
    assert.ok(zCapAt(d.room, 2.5) > zCapAt(d.room, 0.9), 'higher under the crown');
  });
  it('keepDesignInside never leaves a tweeter above the local ceiling, and never pulls one down under a FLAT ceiling to the unused low-point value', () => {
    const d = vaulted();
    const high: RoomDesign = { ...d, layouts: d.layouts.map((l) => ({ ...l, speakers: l.speakers.map((s) => ({ ...s, z: 3.9 })) })) };
    const fixed = keepDesignInside(high);
    for (const s of fixed.layouts[0].speakers) assert.ok(s.z <= ceilingHeightAt(fixed.room, s.y) - 0.1 + 1e-9, `${s.role} z ${s.z}`);
    // Flat 2.5 m ceiling (heightLow 2.2 is unused): a 2.3 m tweeter is legal.
    const flat = defaultDesign();
    const tall: RoomDesign = { ...flat, layouts: flat.layouts.map((l) => ({ ...l, speakers: l.speakers.map((s) => ({ ...s, z: 2.3 })) })) };
    assert.equal(keepDesignInside(tall).layouts[0].speakers[0].z, 2.3);
  });
  it('MONITORING side drag and HEIGHT lane clamp to the local ceiling, not the high point', () => {
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    const side = mon.slice(mon.indexOf('const onSideDrag'), mon.indexOf('const bezel'));
    assert.match(side, /zCapAt\(room, /);
    assert.doesNotMatch(side, /room\.height - 0\.1/);
    const lane = mon.slice(mon.indexOf('const setHeight'), mon.indexOf('const H_MAX'));
    assert.match(lane, /zCapAt\(room, /);
  });
});

describe('extreme rooms: absorption never counts more rug or cloud than there is floor or ceiling', () => {
  it('a 2.4 m rug in a 1.2 m × 1.2 m room adds no phantom floor area', () => {
    const d = defaultDesign();
    const room = { ...d.room, vertices: shapeVertices('rect', 1.2, 1.2), openings: [], features: [] };
    const rug: Treatment = { id: 'rug', kind: 'rug', x: 0.6, y: 0.6, width: 2.4, height: 2.4, thickness: 0.01, z: 0, enabled: true };
    const cloud: Treatment = { ...rug, id: 'cl', kind: 'cloud', z: 2.2, thickness: 0.1 };
    const lines = surfaceList(room, [rug, cloud]);
    const area = polygonArea(room.vertices);
    const floor = lines.filter((l) => /^Floor|rug/i.test(l.label)).reduce((s, l) => s + l.area, 0);
    const ceil = lines.filter((l) => /^Ceiling/.test(l.label)).reduce((s, l) => s + l.area, 0);
    assert.ok(Math.abs(floor - area) < 1e-9, `floor + rug ${floor} vs ${area}`);
    assert.ok(Math.abs(ceil - area) < 1e-9, `ceiling + cloud ${ceil} vs ${area}`);
  });
});

describe('a damaged saved design is repaired or dropped, never crashes LOAD / COMPARE', () => {
  const repairDesign = () => M.repairDesign as (raw: unknown) => RoomDesign | null;
  it('fills what is missing, drops what is unusable, keeps the id', () => {
    assert.equal(typeof repairDesign(), 'function');
    const d = defaultDesign();
    const broken = JSON.parse(JSON.stringify(d));
    delete broken.room.openings;
    delete broken.room.features;
    delete broken.monitoring;
    delete broken.measured;
    broken.room.floor = 'lava';
    broken.layouts[0].speakers = 'nope';
    broken.active = 7;
    broken.treatment = [{ id: 'x', kind: 'absorber', wall: 1, pos: 0.5, width: 'big' }, absorber(1)];
    const fixed = repairDesign()(broken);
    assert.ok(fixed);
    assert.equal(fixed!.id, d.id);
    assert.deepEqual(fixed!.room.openings, []);
    assert.deepEqual(fixed!.room.features, []);
    assert.equal(fixed!.room.floor, d.room.floor);
    assert.equal(fixed!.active, 0);
    assert.equal(fixed!.treatment.length, 1);
    assert.doesNotThrow(() => analyze(fixed!));
  });
  it('an unchanged design comes back equal (a healthy save is untouched)', () => {
    const d = defaultDesign();
    assert.deepEqual(repairDesign()(JSON.parse(JSON.stringify(d))), d);
  });
  it('a design with no usable plan is dropped', () => {
    const d = JSON.parse(JSON.stringify(defaultDesign()));
    d.room.vertices = [{ x: 0, y: 0 }, { x: 'a', y: 1 }, { x: 1, y: null }];
    assert.equal(repairDesign()(d), null);
    assert.equal(repairDesign()(null), null);
    assert.equal(repairDesign()('x'), null);
  });
  it('the host hands the modules repaired designs only (LOAD and COMPARE read `saved`)', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /const saved = useMemo\(\(\) => rawSaved\.map\(repairDesign\)\.filter\(\(x\): x is RoomDesign => x != null\), \[rawSaved\]\);/);
  });
});

describe('saving is honest before the tier is known and for a guest', () => {
  it('saveCurrent never touches the store while blocked: a pre-resolve or guest save sat in the in-memory list and then showed under SAVED DESIGNS as if it were on the device', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    const save = host.slice(host.indexOf('saveCurrent:'), host.indexOf('loadSaved:'));
    // (pass 3: saveCurrent resolves { ok, at } — the gate's answer is ok: false)
    // Owner ruling 2026-10-01: a guest's SAVE never touches the store either —
    // it is HELD by the sign-in hand-off ledger (never for a preview).
    assert.match(save, /if \(!resolved\) return Promise\.resolve\(\{ ok: false, at: design \}\);/);
    assert.match(save, /if \(guest\) return Promise\.resolve\(\{ ok: false, at: design, held: !preview && holdRoomDesignForSession\(design\) \}\);/);
    assert.ok(save.indexOf('return Promise.resolve({ ok: false') < save.indexOf('saveRoomDesign('), 'the gate comes before the store');
  });
});

describe('REVIEW: the saved list prints the plan size, not the far corner', () => {
  it('uses the bounding box width × length (a room whose left wall was dragged in read its old width)', () => {
    const review = strip(read(`${LAB}modules/modReview.tsx`));
    assert.doesNotMatch(review, /vertices\.reduce\(\(m, p\) => Math\.max\(m, p\.x\), 0\)/);
    assert.match(review, /const bb = bounds\(d\.room\);/);
    // the arithmetic it now prints
    const v = [{ x: 1, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 1, y: 5 }];
    assert.equal(bounds({ vertices: v }).width, 3);
  });
});

describe('the plan and the side view drop a drag when the glass changes size under it', () => {
  it('rotation or a full-screen re-fit mid-drag ends the drag instead of mapping the old finger through the new transform', () => {
    for (const f of ['RoomPlanView', 'RoomSideView']) {
      const s = strip(read(`${LAB}${f}.tsx`));
      // (pass 2 adds `|| off === 'lifted'` — the drag's own finger leaving)
      assert.match(s, /if \(d\.s !== st\.s \|\| d\.gw !== st\.gw \|\| d\.gh !== st\.gh[ |)]/, f);
    }
  });
});

describe('MONITORING: the side view draws the sub at its driver height (HEIGHT → SUB moved nothing on the picture)', () => {
  it('the sub box is centred on toSide(sp), not pinned to the floor', () => {
    const s = strip(read(`${LAB}RoomSideView.tsx`));
    const sub = s.slice(s.indexOf("if (sp.role === 'SUB')"), s.indexOf('const ww = spkSize'));
    assert.doesNotMatch(sub, /toSide\(\{ y: sp\.y, z: 0 \}\);\s*return/);
    assert.match(sub, /const cy = Math\.min\(q\.y, floorY - sz \/ 2\);/);
    assert.match(sub, /y=\{cy - sz \/ 2\}/);
  });
});

describe('MONITORING: the NEARFIELD / MIDFIELD label never falls off the bottom of the glass', () => {
  it('flips above the head when the listener sits near the rear wall', () => {
    const s = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(s, /const below = lisPx\.y \+ 24 \+ fs \+ 3 \+ 4 <= gh;/);
  });
});

describe('FINISH: every material pick changes the picture (standards pass, corrected)', () => {
  it('the four plan floor fills are told apart (≥ 12 levels on some channel between every pair)', () => {
    const plan = read(`${LAB}RoomPlanView.tsx`);
    const block = plan.slice(plan.indexOf('FLOOR_TINT: Record<string, string> = {'), plan.indexOf('};', plan.indexOf('FLOOR_TINT: Record<string, string> = {')));
    const hex = [...block.matchAll(/'#([0-9a-f]{6})'/g)].map((m) => [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)));
    assert.equal(hex.length, 4);
    for (let i = 0; i < hex.length; i++)
      for (let j = i + 1; j < hex.length; j++) {
        const d = Math.max(...hex[i].map((c, k) => Math.abs(c - hex[j][k])));
        assert.ok(d >= 12, `floor ${i} vs ${j}: ${d} levels`);
      }
  });
  it('a CEILING material pick on the plan opens the side view, where the ceiling is drawn in that material', () => {
    const create = strip(read(`${LAB}modules/modCreate.tsx`));
    assert.match(create, /<SurfaceTray room=\{room\} setRoom=\{setRoom\} onCeilingMat=\{\(\) => view === 'plan' && setView\('side'\)\} \/>/);
    const tray = create.slice(create.indexOf('function SurfaceTray'));
    assert.match(tray, /ceilingMat: id \}\)\);\s*onCeilingMat\(\);/);
  });
});

describe('a save that pushes the oldest design out of a full library says so', () => {
  it('evictedBySave names the oldest-updated design when the library is full and this design is new to it', () => {
    const evictedBySave = M.evictedBySave as (saved: RoomDesign[], d: RoomDesign, max: number) => RoomDesign | null;
    assert.equal(typeof evictedBySave, 'function');
    const lib = [3, 1, 2].map((t) => ({ ...defaultDesign(), name: `d${t}`, updatedAt: t }));
    const fresh = defaultDesign();
    assert.equal(evictedBySave(lib, fresh, 3)?.name, 'd1');
    assert.equal(evictedBySave(lib, fresh, 4), null, 'room to spare');
    assert.equal(evictedBySave(lib, lib[0], 3), null, 're-saving a design already kept replaces it');
  });
  it('both SAVE buttons put it in their message', () => {
    // Pass 2: the host judges it on the store's own list (ctx.evicts); both
    // buttons name it.
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /evictedBySave\(rawSaved, design, MAX_SAVED_DESIGNS\)/);
    for (const m of ['modReview', 'modExplore']) {
      const s = strip(read(`${LAB}modules/${m}.tsx`));
      assert.match(s, /const gone = evicts\?\.name \?\? null;/, m);
      assert.match(s, /\$\{gone \? ` The library keeps \$\{MAX_SAVED_DESIGNS\}: the oldest, "\$\{gone\}", was removed to make room\.` : ''\}/, m);
    }
  });
});
