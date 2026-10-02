/**
 * Room Design & Monitoring Lab — toddler + cat bug pass 2 of 3 (2026-10-01).
 * Each block is the receipt for one fix (or one correction of a pass-1 fix):
 * it failed with the pass-1 sources and passes now — model behaviour where
 * the bug lives in the model; a source guard where it lives in a view the
 * node runner cannot mount.
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

type Model = typeof import('../src/screens/lab/roomdesign/roomModel.ts');
type RoomDesign = import('../src/screens/lab/roomdesign/roomModel.ts').RoomDesign;
type Layout = import('../src/screens/lab/roomdesign/roomModel.ts').Layout;
type Treatment = import('../src/screens/lab/roomdesign/roomModel.ts').Treatment;
type Reflection = import('../src/screens/lab/roomdesign/roomModel.ts').Reflection;
const M = (await import('../src/screens/lab/roomdesign/roomModel.ts')) as Record<string, unknown> & Model;
const G = (await import('../src/screens/lab/roomdesign/planGeom.ts')) as Record<string, unknown> & typeof import('../src/screens/lab/roomdesign/planGeom.ts');
const C = (await import('../src/screens/lab/roomdesign/labCtx.ts')) as Record<string, unknown>;
const { analyze, bounds, ceilingHeightAt, clampInside, defaultDesign, polygonIsValidRoom, repairDesign, resizeDesign, roomModes, shapeVertices, zCapAt } = M;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab/roomdesign/';
const fn = <T>(name: string, from: Record<string, unknown> = M): T => {
  assert.equal(typeof from[name], 'function', `${name} exists`);
  return from[name] as T;
};

/* ─────────────────────────── corrections of pass 1 ─────────────────────────── */

describe('CORRECTION (zCapAt): a plan drag or a FRONT / LISTENER lane keeps heights under the local ceiling', () => {
  // Pass 1 capped the side drag, the HEIGHT lane and room edits only.
  const sloped = (): RoomDesign => {
    const d = defaultDesign();
    return { ...d, room: { ...d.room, ceiling: 'sloped', height: 2.5, heightLow: 2.0 } };
  };
  it('the bug: the plan drag path (clampInside only) carries a 2.3 m tweeter under a 2.0 m rear ceiling', () => {
    const d = sloped();
    const l = d.layouts[0];
    const tall: Layout = { ...l, speakers: l.speakers.map((s) => ({ ...s, z: 2.3 })) };
    // What MONITORING / EXPLORE onDrag wrote: x / y only.
    const dragged: Layout = { ...tall, speakers: tall.speakers.map((s) => (s.role === 'L' ? { ...s, ...clampInside({ x: s.x, y: 4.7 }, d.room, s) } : s)) };
    const L = dragged.speakers.find((s) => s.role === 'L')!;
    assert.ok(L.z > zCapAt(d.room, L.y), 'above the drawn ceiling before the cap');
    const capLayoutHeights = fn<(l: Layout, r: RoomDesign['room']) => Layout>('capLayoutHeights');
    const capped = capLayoutHeights(dragged, d.room);
    for (const s of capped.speakers) assert.ok(s.z <= zCapAt(d.room, s.y) + 1e-9, `${s.role} z ${s.z}`);
    assert.ok(capped.listener.earZ <= zCapAt(d.room, capped.listener.y) + 1e-9);
    assert.equal(capLayoutHeights(d.layouts[0], d.room), d.layouts[0], 'a legal layout comes back as the same object');
  });
  it('MONITORING and EXPLORE route every position write through it', () => {
    for (const m of ['modMonitoring', 'modExplore']) {
      const s = strip(read(`${LAB}modules/${m}.tsx`));
      assert.match(s, /const setLayout = \(fn: \(l: Layout\) => Layout\) => update\(\(d\) => \(\{ \.\.\.d, layouts: d\.layouts\.map\(\(l, i\) => \(i === d\.active \? capLayoutHeights\(fn\(l\), d\.room\) : l\)\) \}\)\);/, m);
    }
  });
});

describe('CORRECTION (evictedBySave): the eviction is judged on the store’s own list', () => {
  it('the host computes it from rawSaved (repaired `saved` can be shorter — the store still trims its own list)', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /const evicts = useMemo\(\(\) => evictedBySave\(rawSaved, design, MAX_SAVED_DESIGNS\), \[rawSaved, design\]\);/);
    assert.match(host, /saved,\s*evicts,/);
    for (const m of ['modReview', 'modExplore']) assert.doesNotMatch(strip(read(`${LAB}modules/${m}.tsx`)), /evictedBySave\(/, m);
  });
});

describe('CORRECTION (store resolves false on a failed write): the lab says so in words', () => {
  it('the words: a device that could not store it — never "not signed in", never a bare "Not saved."', () => {
    assert.equal(typeof C.SAVE_FAILED, 'string', 'SAVE_FAILED exists');
    const t = C.SAVE_FAILED as string;
    assert.doesNotMatch(t, /not signed in|preview/i);
    assert.match(t, /could not store/);
  });
  it('EXPLORE: a signed-in member (resolved, not a guest) reaches SAVE_FAILED, not the signed-out line', () => {
    const s = strip(read(`${LAB}modules/modExplore.tsx`));
    assert.match(s, /const asGuest = guest;/);
    assert.match(s, /: asGuest\s*\? 'Kept for this session only — you are not signed in, so designs are not saved\.'\s*: SAVE_FAILED,/);
  });
  it('REVIEW: a failed write says SAVE_FAILED (a pre-resolve tap says it is still checking)', () => {
    const s = strip(read(`${LAB}modules/modReview.tsx`));
    assert.doesNotMatch(s, /'Not saved\.'/);
    assert.match(s, /: !known \? SAVE_NOT_YET : SAVE_FAILED,/);
  });
});

/* ─────────────────────────────── new findings ─────────────────────────────── */

describe('a "Saved" line never outlives the design it was about', () => {
  it('after any edit (OPTION B, a LOAD, a drag) it says the design changed since', () => {
    const saveLine = fn<(m: { text: string; ok: boolean; at: unknown } | null, d: unknown) => string | null>('saveLine', C);
    const a = { id: 1 };
    const b = { id: 1 };
    assert.equal(saveLine({ text: 'Saved on this device.', ok: true, at: a }, a), 'Saved on this device.');
    assert.match(saveLine({ text: 'Saved on this device.', ok: true, at: a }, b)!, /changed since/);
    assert.match(saveLine({ text: 'Not saved — x', ok: false, at: a }, b)!, /^Not saved/, 'a failure stays visible');
    assert.equal(saveLine(null, a), null);
  });
  it('EXPLORE and REVIEW render the kept line through saveLine', () => {
    assert.match(strip(read(`${LAB}modules/modExplore.tsx`)), /const line = saveLine\(msg, design\);/);
    assert.match(strip(read(`${LAB}modules/modReview.tsx`)), /const savedLine = saveLine\(savedMsg, design\);/);
  });
});

describe('WIDTH / LENGTH at full scale never push the far wall past 15 m', () => {
  it('a room whose left and front walls were dragged in stays a valid, saveable plan when widened to the maximum', () => {
    const d = defaultDesign();
    // Both left corners dragged to x = 3 m, both front corners to y = 2 m.
    const moved: RoomDesign = { ...d, room: { ...d.room, shape: 'irregular', vertices: [{ x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 5 }, { x: 3, y: 5 }] } };
    const big = resizeDesign(resizeDesign(moved, 15, 3), 15, 15);
    const b = bounds(big.room);
    assert.ok(b.maxX <= 15 + 1e-9 && b.maxY <= 15 + 1e-9, `far corner ${b.maxX}, ${b.maxY}`);
    assert.ok(Math.abs(b.width - 15) < 1e-9 && Math.abs(b.length - 15) < 1e-9);
    assert.ok(polygonIsValidRoom(big.room.vertices), 'corner drags still accepted afterwards');
    assert.ok(repairDesign(JSON.parse(JSON.stringify(big))), 'a SAVE of it still lists under SAVED DESIGNS');
    const L = big.layouts[0].speakers[0];
    assert.ok(L.x >= b.minX && L.x <= b.maxX && L.y >= b.minY && L.y <= b.maxY, 'the layout moved with the plan');
  });
  it('a plan already at the origin grows exactly as before', () => {
    const d = defaultDesign();
    const big = resizeDesign(d, 6, 7.5);
    assert.deepEqual(bounds(big.room), { minX: 0, minY: 0, maxX: 6, maxY: 7.5, width: 6, length: 7.5 });
  });
});

describe('TRACE follows the path it named, through every re-sort', () => {
  const design = (): RoomDesign => defaultDesign();
  it('the bug: the reflection list re-sorts on a drag, so an index names another path', () => {
    const d = design();
    const a0 = analyze(d);
    const reflectionKey = fn<(r: Reflection) => string>('reflectionKey');
    const idx = a0.reflections.findIndex((r) => reflectionKey(r) === 'L:ceiling');
    assert.ok(idx >= 0);
    // Listener dragged back toward the rear wall: the desk bounce drops out
    // and every later path shifts down the list.
    const l = d.layouts[0];
    const moved: RoomDesign = { ...d, layouts: [{ ...l, listener: { ...l.listener, x: 2, y: 4.2 } }] };
    const a1 = analyze(moved);
    assert.notEqual(reflectionKey(a1.reflections[idx]), 'L:ceiling', 'the old index now points at another path');
    assert.ok(a1.reflections.some((r) => reflectionKey(r) === 'L:ceiling'), 'the traced path still exists, by key');
  });
  it('nextTraceKey cycles the DRAWN paths by key; a vanished key restarts at the first', () => {
    const d = design();
    const a = analyze(d);
    const reflectionKey = fn<(r: Reflection) => string>('reflectionKey');
    const nextTraceKey = fn<(shown: Reflection[], cur: string | null) => string | null>('nextTraceKey');
    const keys = a.reflections.map(reflectionKey);
    assert.equal(new Set(keys).size, keys.length, 'keys are unique');
    assert.equal(nextTraceKey(a.reflections, null), keys[0]);
    assert.equal(nextTraceKey(a.reflections, keys[0]), keys[1]);
    assert.equal(nextTraceKey(a.reflections, keys[keys.length - 1]), keys[0]);
    assert.equal(nextTraceKey(a.reflections, 'gone'), keys[0]);
    assert.equal(nextTraceKey([], null), null);
  });
  it('in multichannel TRACE only visits paths the plan draws (L, R, the selected speaker)', () => {
    const planReflections = fn<(r: Reflection[], s: { role: string }[], sel?: string | null) => Reflection[]>('planReflections');
    const fake = (speaker: string) => ({ speaker, surface: { kind: 'floor' } }) as unknown as Reflection;
    const all = ['L', 'R', 'C', 'LS', 'RS'].map(fake);
    const spk = ['L', 'R', 'C', 'LS', 'RS', 'SUB'].map((role) => ({ role }));
    assert.deepEqual(planReflections(all, spk, 'listener').map((r) => r.speaker), ['L', 'R']);
    assert.deepEqual(planReflections(all, spk, 'LS').map((r) => r.speaker), ['L', 'R', 'LS']);
    assert.equal(planReflections(all.slice(0, 2), spk.slice(0, 2)).length, 2, 'stereo draws everything');
  });
  it('EXPLORE holds the trace by key and the plan draws through the same rule', () => {
    const ex = strip(read(`${LAB}modules/modExplore.tsx`));
    assert.doesNotMatch(ex, /traceIdx/);
    assert.match(ex, /const key = nextTraceKey\(shown, traceState\?\.key \?\? null\);/);
    assert.match(ex, /analysis\.reflections\.findIndex\(\(r\) => reflectionKey\(r\) === traceState\.key\)/);
    assert.match(strip(read(`${LAB}RoomPlanView.tsx`)), /const shownReflections = planReflections\(analysis\.reflections, lay\.speakers, selected\);/);
  });
});

describe('a drag follows its own finger: a second finger (the lane, the glass) never moves the item', () => {
  // RN's responder system starts negotiation at the lowest common ancestor,
  // so the lane is never asked while the plan holds the gesture — and the
  // holder receives EVERY touch's moves; PanResponder dx is their centroid.
  it('fingerOffset tracks the starting touch only, and reports when it lifts', () => {
    const fingerAt = fn<(e: object) => { id: unknown; px: number; py: number }>('fingerAt', G);
    const fingerOffset = fn<(e: object, f: object, fb: { dx: number; dy: number }) => { dx: number; dy: number } | 'lifted'>('fingerOffset', G);
    const f = fingerAt({ identifier: 3, pageX: 100, pageY: 200 });
    // Finger 3 still; finger 4 (on the lane) travels 120 pt: the centroid
    // fallback says 60 — the item must not move.
    const both = { identifier: 4, pageX: 220, pageY: 600, touches: [{ identifier: 3, pageX: 100, pageY: 200 }, { identifier: 4, pageX: 220, pageY: 600 }] };
    assert.deepEqual(fingerOffset(both, f, { dx: 60, dy: 0 }), { dx: 0, dy: 0 });
    const own = { identifier: 3, pageX: 130, pageY: 190, touches: [{ identifier: 3, pageX: 130, pageY: 190 }, { identifier: 4, pageX: 220, pageY: 600 }] };
    assert.deepEqual(fingerOffset(own, f, { dx: 15, dy: -5 }), { dx: 30, dy: -10 });
    const lifted = { identifier: 4, pageX: 240, pageY: 600, touches: [{ identifier: 4, pageX: 240, pageY: 600 }] };
    assert.equal(fingerOffset(lifted, f, { dx: 70, dy: 0 }), 'lifted');
    assert.deepEqual(fingerOffset({ identifier: 3 }, f, { dx: 7, dy: 8 }), { dx: 7, dy: 8 }, 'no touch list → the PanResponder offset');
  });
  it('the plan and the side view drive the drag with it (gs.dx no longer moves the item)', () => {
    for (const f of ['RoomPlanView', 'RoomSideView']) {
      const s = strip(read(`${LAB}${f}.tsx`));
      assert.match(s, /finger: fingerAt\(e\.nativeEvent\)/, f);
      assert.match(s, /const off = fingerOffset\(e\.nativeEvent, d\.finger, \{ dx: gs\.dx, dy: gs\.dy \}\);/, f);
      assert.match(s, /off === 'lifted'/, f);
      assert.doesNotMatch(s, /gs\.dx \/ st\.s/, f);
    }
  });
});

describe('big rooms stay smooth: no repeated mode lists, no re-diffed heat map, one analysis per drag frame', () => {
  const big = (): RoomDesign => {
    const d = resizeDesign(defaultDesign(), 15, 15);
    return { ...d, room: { ...d.room, height: 6 } };
  };
  it('the mode list of an unchanged room is computed once (it was ~4,300 modes rebuilt per analyze, ~6 ms jitless)', () => {
    const d = big();
    const a = analyze(d);
    assert.ok(a.modes.length > 4000, `${a.modes.length} modes`);
    const l = d.layouts[0];
    const dragged: RoomDesign = { ...d, layouts: [{ ...l, listener: { ...l.listener, x: l.listener.x + 0.3 } }] };
    assert.equal(analyze(dragged).modes, a.modes, 'a listener drag reuses the same list');
    assert.equal(roomModes(a.c, 15, 15, 6), a.modes);
    const taller: RoomDesign = { ...d, room: { ...d.room, height: 5.5 } };
    assert.notEqual(analyze(taller).modes, a.modes, 'a room change recomputes');
  });
  it('the heat map is keyed on values and painted by a memoised layer', () => {
    const s = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(s, /\}, \[mode\?\.nx, mode\?\.ny, mode\?\.nz, mode\?\.f, mL, mW, mH, b, v, earZ\]\);/);
    assert.match(s, /const HeatLayer = memo\(function HeatLayer/);
    assert.match(s, /\{heat \? <HeatLayer heat=\{heat\} T=\{T\} \/> : null\}/);
  });
  it('EXPLORE reuses the host analysis for the active option and memoises START’s; TREATMENT reuses the host analysis for the side the item is on', () => {
    const ex = strip(read(`${LAB}modules/modExplore.tsx`));
    assert.match(ex, /diffLayouts\(design, 0, design\.active, \{ from: startAnalysis \?\? undefined, to: analysis \}\)/);
    assert.match(ex, /const startAnalysis = useMemo\(/);
    const tr = strip(read(`${LAB}modules/modTreatment.tsx`));
    assert.match(tr, /const withoutSel = sel \? \(!sel\.enabled \? analysis : analyze\(/);
    assert.match(tr, /const withSel = sel \? \(sel\.enabled \? analysis : analyze\(/);
  });
  it('diffLayouts gives the same words with the analyses passed in', () => {
    const d0 = defaultDesign();
    const l = d0.layouts[0];
    const d: RoomDesign = { ...d0, layouts: [l, { ...l, name: 'Option A', listener: { ...l.listener, y: l.listener.y + 0.4 } }], active: 1 };
    const pre = { from: analyze(d, 0), to: analyze(d, 1) };
    assert.deepEqual(M.diffLayouts(d, 0, 1, pre), M.diffLayouts(d, 0, 1));
  });
  it('the host repairs the saved list when it changes, not on every render', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /if \(rawRef\.current\.length !== fresh\.length \|\| fresh\.some\(\(d, i\) => d !== rawRef\.current\[i\]\)\) rawRef\.current = fresh;/);
  });
});

describe('the side view never crops its under-floor readouts', () => {
  it('a 6 m ceiling on a 200 pt stage: the tweeter number stayed below the glass', () => {
    const sideLabelRows = fn<(floorY: number, gh: number, fs: number) => { ears: number; tweeter: number }>('sideLabelRows', G);
    for (const [len, gw, gh] of [[2, 350, 200], [5, 350, 250], [2, 350, 250]]) {
      const T = G.sideTransform(len, 6, gw, gh);
      const floorY = T.toPx({ x: 0, y: 0 }).y;
      assert.ok(floorY + 2 * 9.5 + 6 > gh - 3, `the old baseline ${floorY + 25} vs glass ${gh}`);
      const rows = sideLabelRows(floorY, gh, 9.5);
      assert.ok(rows.tweeter <= gh - 3, `tweeter baseline ${rows.tweeter} on ${gh}`);
      assert.ok(rows.tweeter - rows.ears >= 9.5 + 3 - 1e-9, 'two separate baselines');
    }
    const T = G.sideTransform(5, 2.5, 350, 250);
    const f = T.toPx({ x: 0, y: 0 }).y;
    assert.deepEqual(sideLabelRows(f, 250, 9.5), { ears: f + 12.5, tweeter: f + 25 }, 'a normal room is untouched');
    assert.match(strip(read(`${LAB}RoomSideView.tsx`)), /const rows = sideLabelRows\(floorL\.y, gh, fs\);/);
  });
});

describe('a ceiling cloud is drawn under the ceiling that is there', () => {
  it('under a sloped ceiling, or after CEILING is lowered, the side view hung it above the ceiling line', () => {
    const cloudHangZ = fn<(room: RoomDesign['room'], t: Pick<Treatment, 'y' | 'z' | 'thickness'>) => number>('cloudHangZ');
    const d = defaultDesign();
    const room = { ...d.room, ceiling: 'sloped' as const, height: 2.5, heightLow: 1.9 };
    const cloud = { y: 4.6, z: 2.25, thickness: 0.1 };
    assert.ok(cloud.z + cloud.thickness / 2 > ceilingHeightAt(room, cloud.y), 'the stored z pokes through');
    const z = cloudHangZ(room, cloud);
    assert.ok(z + cloud.thickness / 2 < ceilingHeightAt(room, cloud.y), `drawn at ${z}`);
    assert.equal(cloudHangZ(d.room, { y: 2, z: 2.25, thickness: 0.1 }), 2.25, 'a cloud already under a flat ceiling is unchanged');
    assert.match(strip(read(`${LAB}RoomSideView.tsx`)), /z: cloudHangZ\(room, t\) \+ t\.thickness \/ 2/);
  });
});

describe('MONITORING: seated ears never set under 0.6 m', () => {
  it('the HEIGHT lane (bottom 0.1 m) and the side drag share the ear floor', () => {
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    const lane = mon.slice(mon.indexOf('const setHeight'), mon.indexOf('const H_MAX'));
    assert.match(lane, /earZ: Math\.max\(EAR_MIN, Math\.min\(z, zCapAt\(room, l\.listener\.y\)\)\)/);
    assert.match(mon, /const EAR_MIN = 0\.6;/);
  });
});

void shapeVertices;
