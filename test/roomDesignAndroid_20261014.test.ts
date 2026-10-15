/**
 * Room Design & Monitoring Lab — the Android emulator pass (2026-10-14).
 * One block per finding: model behaviour where the bug lives in the model,
 * a source guard where it lives in a view the node runner cannot mount.
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

const M = await import('../src/screens/lab/roomdesign/roomModel.ts');
const { analyze, defaultDesign, defaultLayout, editActiveLayout, EDITED_LAYOUT, fmtDelta, placementConflicts, roomRatioLine, signedSeconds, START_LAYOUT, stereoGeometry } = M;
type Layout = import('../src/screens/lab/roomdesign/roomModel.ts').Layout;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab/roomdesign/';

describe('Module 2: the room ratio is labelled as what it is (sorted, not L:W:H)', () => {
  it('a 5 × 4 × 2.5 m room names its order: height : width : length', () => {
    assert.equal(roomRatioLine(5, 4, 2.5), 'Room ratio, smallest : middle : largest — 1 : 1.60 : 2.00 (height : width : length)');
    assert.equal(roomRatioLine(5, 4, 0), '');
  });
  it('the bezel key no longer says L:W:H', () => {
    const src = strip(read(`${LAB}modules/modCreate.tsx`));
    assert.doesNotMatch(src, /'L:W:H'/);
    assert.match(src, /k: 'RATIO S:M:L'/);
    assert.match(src, /roomRatioLine\(b\.length, b\.width, analysis\.modalDims\.H\)/);
    assert.doesNotMatch(src, /length : width : height ratio/);
  });
});

describe('Module 3: a seat that is not in front of the speakers is no triangle', () => {
  it('the default layout is in front', () => {
    const d = defaultDesign();
    assert.equal(stereoGeometry(d.room, d.layouts[0])!.inFront, true);
  });
  it('speakers 4.00 m out, seat 40 cm out: inFront false, no angle advice, a plain check line', () => {
    const d = defaultDesign();
    const l = d.layouts[0];
    const behind: Layout = { ...l, speakers: l.speakers.map((s) => ({ ...s, y: 4.0 })), listener: { ...l.listener, y: 0.4 } };
    const dd = { ...d, layouts: [behind] };
    const g = stereoGeometry(dd.room, behind)!;
    assert.equal(g.inFront, false);
    const a = analyze(dd);
    assert.ok(!a.suggestions.some((s) => /listening angle is/.test(s.text)), 'no "listening angle is N°" advice');
    assert.ok(a.suggestions.some((s) => /not in front of both speakers/.test(s.text)));
    assert.ok(placementConflicts(dd, a).some((c) => /behind the listening position/.test(c.text)));
  });
  it('the module and the plan say so instead of "within tolerance" / an angle', () => {
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    assert.match(mon, /st && !st\.inFront \?/);
    assert.match(mon, /No stereo triangle: the listener is not in front of both speakers/);
    assert.match(mon, /st\.inFront \? \{ k: 'ANGLE'/);
    const plan = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(plan, /'NO TRIANGLE'/);
  });
});

describe('Module 3/4: SPREAD re-centres, and LAYOUT → START is the start layout exactly', () => {
  it('SPREAD sets the pair about the ROOM centre line, level', () => {
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    assert.match(mon, /const mx = \(b\.minX \+ b\.maxX\) \/ 2;/);
    assert.doesNotMatch(mon, /const mx = \(l0\.x \+ r0\.x\) \/ 2;/);
  });
  it('an edit while START is active lands in EDITED; START keeps the start positions', () => {
    const d = defaultDesign();
    const start = d.layouts[0];
    const drag = (l: Layout): Layout => ({ ...l, speakers: l.speakers.map((s) => (s.role === 'L' ? { ...s, x: s.x + 0.29 } : s)) });
    const e1 = editActiveLayout(d, drag);
    assert.equal(e1.layouts[0], start, 'START is untouched (same object)');
    assert.equal(e1.layouts[e1.active].name, EDITED_LAYOUT);
    assert.equal(e1.layouts.length, 2);
    // A second frame edits EDITED in place, no third slot.
    const e2 = editActiveLayout(e1, drag);
    assert.equal(e2.layouts.length, 2);
    assert.ok(Math.abs(e2.layouts[e2.active].speakers[0].x - (start.speakers[0].x + 0.58)) < 1e-9);
    // LAYOUT → START: exactly where the positions began.
    const back = { ...e2, active: 0 };
    assert.equal(back.layouts[0].name, START_LAYOUT);
    assert.deepEqual(back.layouts[0], defaultLayout(d.room));
    // Editing from START again overwrites the EDITED slot, never START.
    const e3 = editActiveLayout(back, drag);
    assert.equal(e3.layouts.length, 2);
    assert.deepEqual(e3.layouts[0], defaultLayout(d.room));
  });
  it('an option slot is edited in place', () => {
    const d = defaultDesign();
    const withA = { ...d, layouts: [d.layouts[0], { ...d.layouts[0], name: 'Option A' }], active: 1 };
    const e = editActiveLayout(withA, (l) => ({ ...l, listener: { ...l.listener, y: l.listener.y + 0.1 } }));
    assert.equal(e.layouts.length, 2);
    assert.equal(e.active, 1);
    assert.equal(e.layouts[0], withA.layouts[0]);
  });
});

describe('cosmetic: no negative zero, labels that fit, the right side-wall label', () => {
  it('VS BARE never prints −0.00', () => {
    assert.equal(signedSeconds(-0.001), '±0.00 s');
    assert.equal(signedSeconds(0), '±0.00 s');
    assert.equal(signedSeconds(0.123), '+0.12 s');
    assert.equal(signedSeconds(-0.2), '−0.20 s');
    const treat = strip(read(`${LAB}modules/modTreatment.tsx`));
    assert.match(treat, /k: 'VS BARE', v: .*signedSeconds\(mid\(now\) - mid\(bare\)\)/);
    assert.doesNotMatch(treat, /'VS NONE'/);
  });
  it('a difference that rounds to zero carries no sign', () => {
    assert.equal(fmtDelta(-0.001, 'metric'), '0 cm');
    assert.equal(fmtDelta(0.12, 'metric'), '+12 cm');
    assert.equal(fmtDelta(-0.12, 'metric'), '−12 cm');
  });
  it('dock keys fit: SEAT, and two-line SIDE VIEW / ADD FIRST', () => {
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    assert.match(mon, /label: 'SEAT'/);
    assert.doesNotMatch(mon, /label: 'LISTENER'/);
    for (const m of ['modMonitoring', 'modCreate']) assert.match(strip(read(`${LAB}modules/${m}.tsx`)), /label: 'SIDE VIEW', labelLines: 2/, m);
    assert.match(strip(read(`${LAB}modules/modTreatment.tsx`)), /'ADD FIRST',\s*labelLines: 2/);
  });
  it('the centre speaker draws no side-wall label; the surrounds no front-wall label', () => {
    const plan = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(plan, /if \(sp\.role === 'C'\) continue;/);
    assert.match(plan, /if \(!surround && f\.t >= 0 && f\.t <= 1\)/);
  });
  it('the typed dimensions open the SHAPE tray', () => {
    const src = strip(read(`${LAB}modules/modCreate.tsx`));
    assert.ok(src.indexOf('TYPE THE DIMENSIONS') < src.indexOf('<TrayHeading>UNITS'), 'dimensions above UNITS');
  });
});
