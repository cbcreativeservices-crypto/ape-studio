/**
 * FIGURE V2 — the measurement and site operators (wave 3 set 3b of D78,
 * 2026-11-24): F11, F14 (reading the log sheet), F15, F16 (standing at rest),
 * F11's keep-away step, and the plaza's people of F06. Pins that the measured
 * points did not move (the operators' places, the board), that the new figure
 * is the cast's, that each hand on the board closes round its side edge, and
 * that every call site of these lessons opts in (a lesson converted WHOLE).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const M = R(await import('../src/screens/lab/miking/lessons/shared/measure/measureModel.ts'));
const OV = R(await import('../src/screens/lab/miking/lessons/shared/measure/operatorV2.ts'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const G11 = R(await import('../src/screens/lab/miking/lessons/f11MeasurementMics/geometry.ts'));
const G14 = R(await import('../src/screens/lab/miking/lessons/f14SystemMeasurement/geometry.ts'));
const G15 = R(await import('../src/screens/lab/miking/lessons/f15Machinery/geometry.ts'));
const G16 = R(await import('../src/screens/lab/miking/lessons/f16ScientificArrays/geometry.ts'));

const near = (a: number, b: number, tol = 0.2) => Math.abs(a - b) <= tol;

describe('figure V2 operators: the measured points stay', () => {
  it('the operators stand where they stood (collars, side and above)', () => {
    const n = [G11.F11_OP_SIDE.neck, G14.F14_OP_SIDE.neck, G15.F15_OP_SIDE.neck, G16.F16_OP_SIDE.neck, G15.F15_OP_TOP.neck, G16.F16_OP_TOP.neck];
    const want = [[2600, -255.9], [2700, -1455.9], [-1250, -755.9], [-1100, -255.9], [-1250, -1350], [-1100, -1500]];
    n.forEach((q: { u: number; v: number }, i: number) => assert.ok(near(q.u, want[i][0]) && near(q.v, want[i][1]), `operator ${i} moved: ${q.u}, ${q.v}`));
  });
  it('the log sheet is where the lessons always drew it', () => {
    const s11 = M.sheetOf(G11.F11_OP_SIDE);
    const s14 = M.sheetOf(G14.F14_OP_SIDE);
    assert.ok(s11.kind === 'side' && near(s11.low.u, 2258.8) && near(s11.low.v, -25.7) && near(s11.high.u, 2075.2) && near(s11.high.v, -287.8));
    assert.ok(s14.kind === 'side' && near(s14.low.u, 2358.8) && near(s14.low.v, -1225.7) && near(s14.high.u, 2175.2) && near(s14.high.v, -1487.8));
  });
});

describe('figure V2 operators: the person and the hands', () => {
  it('the operator is the cast member of the role; the plaza shows five different people', () => {
    assert.equal(OV.MEASURE_OP.id, CAST.CAST[CAST.ROLES['operator.measure']].id);
    const ids = [0, 1, 2, 3, 4].map((k) => CAST.castFor(`site.public${k}` as never).id);
    assert.equal(new Set(ids).size, 5);
  });
  it('each hand closes round a side edge of the board, near its lower corner, the wrist bent no more than the grip allows', () => {
    for (const [side, top] of [[G11.F11_OP_SIDE, G11.F11_OP_TOP], [G14.F14_OP_SIDE, G14.F14_OP_TOP]] as const) {
      const a = OV.readingArms(side, top);
      const s = M.sheetOf(side);
      assert.equal(s.kind, 'side');
      for (const arm of [a.near, a.far]) {
        const f = arm.hold.fulcrum;
        // on the board's line (side view), GRIP_UP from its lower edge
        const up = Math.hypot(f.x - s.low.u, f.y - s.low.v);
        assert.ok(near(up, OV.GRIP_UP, 0.5), `grip ${up} mm up the edge`);
        // at a side edge across (half the board's width, less half its thickness)
        assert.ok(near(Math.abs(f.z - top.neck.v), M.CLIPBOARD.w / 2 - M.CLIPBOARD.thick / 2, 0.5));
        assert.ok(arm.hold.bend <= 44, `wrist bend ${arm.hold.bend}`);
      }
      // the two hands on opposite edges, the near one toward the side camera
      assert.ok(a.near.hold.fulcrum.z > a.far.hold.fulcrum.z);
      // facing −x, the camera sees the person's LEFT side: the near hand is the left
      assert.equal(a.near.hand, (side.facing ?? 1) > 0 ? 'R' : 'L');
    }
  });
  it('the side and top views draw both hands closed round the board (review 2026-11-24: one skin, the board through the fist)', () => {
    const sp = OV.readingSide(G11.F11_OP_SIDE, G11.F11_OP_TOP);
    const tp = OV.readingTop(G11.F11_OP_SIDE, G11.F11_OP_TOP);
    // (the thumb is its own part, or — where it lies behind the board — the palm's own mound)
    for (const g of [sp.near, sp.far, tp.near, tp.far]) assert.ok(g && g.order.includes('MIC') && g.parts.some((q) => q.name === 'palm') && g.parts.some((q) => q.name === 'fingers'));
    // the closed grips sit exactly on the old grip points (nothing the lesson measures moved), in reach
    for (const side of [G11.F11_OP_SIDE, G14.F14_OP_SIDE]) {
      const a = OV.readingArms(side, side === G11.F11_OP_SIDE ? G11.F11_OP_TOP : G14.F14_OP_TOP);
      const near3 = (p: { x: number; y: number; z: number }, q: { x: number; y: number; z: number }) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < 1e-6;
      assert.ok(near3(a.gripNear.fist, a.near.hold.fulcrum) && near3(a.gripFar.fist, a.far.hold.fulcrum));
      assert.equal(a.gripNear.far || a.gripFar.far, false);
    }
    const rest = OV.operatorRestPlan(G15.F15_OP_SIDE);
    assert.equal(rest.arms.near.placed?.art.view, 'restSide');
  });
});

describe('figure V2 operators: every call site opts in (a lesson converted whole)', () => {
  it('F11, F14, F15, F16 pass v2 to every operator they draw', () => {
    const f11 = read(`${L}/f11MeasurementMics/art.tsx`);
    assert.match(f11, /<ReadingOperator [^>]*v2=\{v2\} pair=\{\{ side: F11_OP_SIDE, top: F11_OP_TOP \}\}/);
    assert.match(read(`${L}/f11MeasurementMics/pages.tsx`), /v2: V2,/);
    assert.match(read(`${L}/shared/measure/KeepAway.tsx`), /<Operator pose=\{pose\} v2=\{v2\}/);
    assert.match(read(`${L}/f14SystemMeasurement/art.tsx`), /<ReadingOperator [^>]*v2=\{v2\} pair=\{\{ side: F14_OP_SIDE, top: F14_OP_TOP \}\}/);
    assert.match(read(`${L}/f15Machinery/FanArt.tsx`), /<Operator pose=\{view === 'side' \? F15_OP_SIDE : F15_OP_TOP\} v2=\{v2\} \/>/);
    assert.match(read(`${L}/f16ScientificArrays/art.tsx`), /<Operator pose=\{view === 'side' \? F16_OP_SIDE : F16_OP_TOP\} v2=\{v2\} \/>/);
    for (const f of ['f11MeasurementMics/art.tsx', 'f14SystemMeasurement/art.tsx', 'f15Machinery/FanArt.tsx', 'f16ScientificArrays/art.tsx', 'f06Ambience/art.tsx']) assert.match(read(`${L}/${f}`), /export const V2 = figureV2On\('sidePlayers'\);/, f);
  });
  it('F06 draws its plaza people and the swept voice in the new look', () => {
    const pages = read(`${L}/f06Ambience/pages.tsx`);
    assert.equal((pages.match(/<SiteArt [^>]*v2=\{V2\}/g) ?? []).length, 2);
    assert.match(pages, /<SitePerson [^>]*v2=\{V2\} who=\{VOICE\}/);
    assert.match(read(`${L}/f06Ambience/art.tsx`), /<SiteArt [^>]*v2=\{v2\} \/>/);
  });
  it('F02 and F08 (once blocked by the boom-pole operator) are converted whole by builder Foley3', () => {
    // (the operator and the rest: test/figureV2Foley3_20261124)
    assert.match(read(`${L}/f08Passby/art.tsx`), /v2=\{v2\}/);
    assert.match(read(`${L}/f08Passby/pages.tsx`), /SitePerson[^>]*v2=\{V2\}/);
  });
});
