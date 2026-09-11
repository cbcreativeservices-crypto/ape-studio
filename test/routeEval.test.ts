/**
 * Cable Dressing & Installation Lab — routeEval + score tests, plus the
 * Calculator-Workflow entitlement table (untested-math QA night 2026-09-11).
 *
 * These are scoring rules rather than physics, so the checks are the rules the
 * spec states: the §22 weights, the "shortest ≠ best" structure, and the
 * 2026-08-31 ruling that a route with a serious safety violation is REJECTED
 * outright rather than quietly ranked one point behind.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateRoute, rankRoutes, type CiRouteOption } from '../src/screens/lab/cableinstall/engine/routeEval.ts';
import {
  CI_DIM_META, CI_DIMS, SEVERITY_COST, clamp01, clamp100,
  overallScore, mergeDims, inspectionDimScores, masteryBlocks, weakestDim,
} from '../src/screens/lab/cableinstall/engine/score.ts';
import { WORKFLOW_LIMITS } from '../src/screens/lab/calc/workflowModel.ts';

const route = (over: Partial<CiRouteOption> = {}): CiRouteOption =>
  ({ id: 'r', name: 'R', path: '', relLength: 1, flags: [], ...over });

describe('the §22 scorecard weights', () => {
  it('sum to exactly 1 — the overall score is a true weighted average', () => {
    assert.equal(CI_DIMS.reduce((a, d) => a + CI_DIM_META[d].weight, 0), 1);
  });
  it('rank safety highest and workmanship lowest (critical ≫ cosmetic)', () => {
    const w = (d: keyof typeof CI_DIM_META) => CI_DIM_META[d].weight;
    assert.ok(w('safety') > w('routing'));
    assert.ok(w('routing') > w('protection'));
    assert.ok(w('workmanship') === Math.min(...CI_DIMS.map((d) => w(d))));
    assert.ok(w('safety') === Math.max(...CI_DIMS.map((d) => w(d))));
    for (const d of CI_DIMS) assert.ok(CI_DIM_META[d].weight > 0 && CI_DIM_META[d].label.length > 0, d);
  });
  it('severity costs escalate, and info costs nothing', () => {
    assert.equal(SEVERITY_COST.info, 0);
    assert.ok(SEVERITY_COST.minor < SEVERITY_COST.major);
    assert.ok(SEVERITY_COST.major < SEVERITY_COST.critical);
    assert.equal(SEVERITY_COST.critical / SEVERITY_COST.minor, 5);
  });
});

describe('clamp helpers', () => {
  it('clamp01 keeps a fraction in 0..1', () => {
    assert.equal(clamp01(-3), 0);
    assert.equal(clamp01(0.42), 0.42);
    assert.equal(clamp01(9), 1);
  });
  it('clamp100 keeps a score in 0..100 and rounds to a whole point', () => {
    assert.equal(clamp100(-5), 0);
    assert.equal(clamp100(120), 100);
    assert.equal(clamp100(50.4), 50);
    assert.equal(clamp100(50.5), 51);
    for (const v of [-1e9, 0, 33.33, 1e9]) {
      const c = clamp100(v);
      assert.ok(Number.isInteger(c) && c >= 0 && c <= 100, `${v} → ${c}`);
    }
  });
});

describe('overallScore', () => {
  const near = (a: number, b: number) => assert.equal(a, b);
  it('a perfect card is 100 and an empty card is 0 — never NaN', () => {
    assert.equal(overallScore(Object.fromEntries(CI_DIMS.map((d) => [d, 100]))), 100);
    assert.equal(overallScore(Object.fromEntries(CI_DIMS.map((d) => [d, 0]))), 0);
    assert.equal(overallScore({}), 0);
  });
  it('renormalizes over the dimensions actually exercised', () => {
    const dims = { safety: 60, routing: 80, signal: 100 };
    const w = CI_DIM_META;
    near(overallScore(dims),
      Math.round((60 * w.safety.weight + 80 * w.routing.weight + 100 * w.signal.weight)
        / (w.safety.weight + w.routing.weight + w.signal.weight)));
  });
  it('a zero in SAFETY costs more than a zero in WORKMANSHIP (that is the point of weights)', () => {
    const all = Object.fromEntries(CI_DIMS.map((d) => [d, 100]));
    assert.ok(overallScore({ ...all, safety: 0 }) < overallScore({ ...all, workmanship: 0 }));
  });
  it('never leaves 0..100 for any card', () => {
    for (const v of [0, 1, 37, 99, 100]) {
      const s = overallScore(Object.fromEntries(CI_DIMS.map((d) => [d, v])));
      assert.ok(s >= 0 && s <= 100, `${v} → ${s}`);
    }
  });
});

describe('evaluateRoute', () => {
  it('a flawless route scores 100 on every dimension it exercises, with no notes', () => {
    const v = evaluateRoute(route());
    for (const d of Object.keys(v.dims)) assert.equal(v.dims[d as keyof typeof v.dims], 100, d);
    assert.deepEqual(v.overallNotes, []);
    assert.deepEqual(v.ruleIds, []);
  });
  it('a flag costs its own dimension cost × 100, and nothing else', () => {
    const v = evaluateRoute(route({ flags: [{ ruleId: 'a', dim: 'routing', cost: 0.35, note: 'n' }] }));
    assert.equal(v.dims.routing, 65);
    assert.equal(v.dims.safety, 100);
    assert.equal(v.dims.signal, 100);
  });
  it('a full-cost safety flag takes safety to zero — it cannot go negative', () => {
    const v = evaluateRoute(route({ flags: [{ ruleId: 'a', dim: 'safety', cost: 1, note: 'across the hallway floor' }] }));
    assert.equal(v.dims.safety, 0);
    assert.equal(evaluateRoute(route({ flags: [{ ruleId: 'a', dim: 'safety', cost: 3, note: 'n' }] })).dims.safety, 0);
  });
  it('a positive flag praises without ever pushing a dimension over 100', () => {
    const v = evaluateRoute(route({ flags: [{ ruleId: 'p', dim: 'safety', cost: 1, note: 'good', positive: true }] }));
    assert.equal(v.dims.safety, 100);
  });
  it('flags stack on the same dimension', () => {
    const v = evaluateRoute(route({
      flags: [
        { ruleId: 'a', dim: 'routing', cost: 0.2, note: 'a' },
        { ruleId: 'b', dim: 'routing', cost: 0.3, note: 'b' },
      ],
    }));
    assert.equal(v.dims.routing, 50);
  });
  it('every flag contributes its learner-facing note, in order', () => {
    const v = evaluateRoute(route({
      flags: [
        { ruleId: 'a', dim: 'routing', cost: 0.1, note: 'first' },
        { ruleId: 'b', dim: 'safety', cost: 0.1, note: 'second' },
      ],
    }));
    assert.deepEqual(v.overallNotes, ['first', 'second']);
  });
  it('rule ids are deduped so the same rule is never explained twice', () => {
    const v = evaluateRoute(route({
      flags: [
        { ruleId: 'same', dim: 'routing', cost: 0.1, note: 'a' },
        { ruleId: 'same', dim: 'safety', cost: 0.1, note: 'b' },
        { ruleId: 'other', dim: 'signal', cost: 0.1, note: 'c' },
      ],
    }));
    assert.deepEqual(v.ruleIds, ['same', 'other']);
  });
  it('SHORTEST ≠ BEST: length alone never touches safety, protection, routing or signal', () => {
    const long = evaluateRoute(route({ relLength: 4 }));
    assert.equal(long.dims.safety, 100);
    assert.equal(long.dims.protection, 100);
    assert.equal(long.dims.routing, 100);
    assert.equal(long.dims.signal, 100);
    assert.equal(long.dims.serviceability, 100);
  });
  it('length is free up to 1.5×, then a MILD workmanship cost with an explanation', () => {
    assert.equal(evaluateRoute(route({ relLength: 1 })).dims.workmanship, 100);
    assert.equal(evaluateRoute(route({ relLength: 1.5 })).dims.workmanship, 100);
    assert.equal(evaluateRoute(route({ relLength: 1 })).overallNotes.length, 0);
    assert.equal(evaluateRoute(route({ relLength: 2 })).dims.workmanship, 90);
    assert.equal(evaluateRoute(route({ relLength: 2 })).overallNotes.length, 1);
    assert.match(evaluateRoute(route({ relLength: 2 })).overallNotes[0], /not a defect by itself/);
  });
  it('the length cost grows with length and bottoms out at 0, never below', () => {
    let prev = 101;
    for (const rl of [1.5, 2, 3, 5, 10, 50]) {
      const w = evaluateRoute(route({ relLength: rl })).dims.workmanship!;
      assert.ok(w <= prev && w >= 0, `relLength ${rl} → ${w}`);
      prev = w;
    }
    assert.equal(evaluateRoute(route({ relLength: 100 })).dims.workmanship, 0);
  });
  it('does not score DOCUMENTATION — a route choice cannot label a cable', () => {
    assert.equal(evaluateRoute(route()).dims.documentation, undefined);
  });
});

describe('rankRoutes', () => {
  const clean = route({ id: 'clean' });
  const hallwayFloor = route({
    id: 'hallway',
    flags: [{ ruleId: 'trip', dim: 'safety', cost: 1, note: 'across the hallway floor' }],
  });
  const mediocre = route({
    id: 'mediocre',
    flags: [
      { ruleId: 'a', dim: 'routing', cost: 0.3, note: 'a' },
      { ruleId: 'b', dim: 'serviceability', cost: 0.3, note: 'b' },
      { ruleId: 'c', dim: 'workmanship', cost: 0.4, note: 'c' },
    ],
  });

  it('ranks best first, and returns every option exactly once', () => {
    const r = rankRoutes([hallwayFloor, mediocre, clean]);
    assert.equal(r.length, 3);
    assert.deepEqual(r.map((x) => x.option.id), ['clean', 'mediocre', 'hallway']);
    for (let i = 1; i < r.length; i++) assert.ok(r[i].overall <= r[i - 1].overall);
  });
  it('the 2026-08-31 fix stays fixed: the hallway-floor route no longer beats a legal one', () => {
    const r = rankRoutes([hallwayFloor, mediocre]);
    assert.equal(r[0].option.id, 'mediocre');
    assert.ok(r[0].overall > r[1].overall);
  });
  it('and it is REJECTED outright — a verdict, not just a number', () => {
    const r = rankRoutes([hallwayFloor, mediocre, clean]);
    assert.equal(r.find((x) => x.option.id === 'hallway')!.safetyReject, true);
    assert.equal(r.find((x) => x.option.id === 'mediocre')!.safetyReject, false);
    assert.equal(r.find((x) => x.option.id === 'clean')!.safetyReject, false);
  });
  it('the rejection threshold is a serious safety flag — cost ≥ 0.5', () => {
    const at = (cost: number) =>
      rankRoutes([route({ flags: [{ ruleId: 'x', dim: 'safety', cost, note: 'n' }] })])[0].safetyReject;
    assert.equal(at(0.49), false);
    assert.equal(at(0.5), true);
    assert.equal(at(1), true);
  });
  it('only NEGATIVE safety flags reject — praise never does', () => {
    assert.equal(
      rankRoutes([route({ flags: [{ ruleId: 'x', dim: 'safety', cost: 1, note: 'n', positive: true }] })])[0].safetyReject,
      false);
  });
  it('a big cost on a NON-safety dimension does not trigger the safety rejection', () => {
    assert.equal(
      rankRoutes([route({ flags: [{ ruleId: 'x', dim: 'workmanship', cost: 1, note: 'n' }] })])[0].safetyReject,
      false);
  });
  it('overall scores are whole numbers in 0..100', () => {
    for (const x of rankRoutes([hallwayFloor, mediocre, clean, route({ relLength: 9 })])) {
      assert.ok(Number.isInteger(x.overall) && x.overall >= 0 && x.overall <= 100, `${x.overall}`);
    }
  });
  it('an empty option list ranks to an empty list', () => assert.deepEqual(rankRoutes([]), []));
});

describe('score.ts — the rest of the scorecard', () => {
  it('mergeDims averages a dimension in, and adopts one it had not seen', () => {
    assert.deepEqual(mergeDims({ safety: 100 }, { safety: 50 }), { safety: 75 });
    assert.deepEqual(mergeDims({}, { safety: 50 }), { safety: 50 });
    assert.deepEqual(mergeDims({ safety: 80 }, {}), { safety: 80 });
  });
  it('mergeDims honours the weight of the incoming result', () => {
    assert.deepEqual(mergeDims({ safety: 100 }, { safety: 0 }, 3), { safety: 25 });
  });
  it('inspection scoring: found and correctly categorized is full marks', () => {
    assert.deepEqual(
      inspectionDimScores([{ dim: 'safety', severity: 'critical', found: true, categorizedRight: true }]),
      { safety: 100 });
  });
  it('found but miscategorized earns 60 %; missed earns nothing', () => {
    assert.deepEqual(
      inspectionDimScores([{ dim: 'safety', severity: 'critical', found: true, categorizedRight: false }]),
      { safety: 60 });
    assert.deepEqual(
      inspectionDimScores([{ dim: 'safety', severity: 'minor', found: false, categorizedRight: true }]),
      { safety: 0 });
  });
  it('missing a CRITICAL defect costs far more than catching a minor one earns', () => {
    const s = inspectionDimScores([
      { dim: 'safety', severity: 'critical', found: false, categorizedRight: true },
      { dim: 'safety', severity: 'minor', found: true, categorizedRight: true },
    ]);
    assert.equal(s.safety, Math.round((1 / (SEVERITY_COST.critical + 1)) * 100));
    assert.ok(s.safety! < 25);
  });
  it('an INFO item still counts for something rather than dividing by zero', () => {
    assert.deepEqual(
      inspectionDimScores([{ dim: 'safety', severity: 'info', found: true, categorizedRight: true }]),
      { safety: 100 });
  });
  it('a dimension with no results is simply absent, not a fabricated zero', () => {
    assert.deepEqual(inspectionDimScores([]), {});
    assert.equal(inspectionDimScores([{ dim: 'safety', severity: 'minor', found: true, categorizedRight: true }]).routing,
      undefined);
  });
  it('masteryBlocks maps 0..100 onto 0..5 and clamps outside it', () => {
    assert.equal(masteryBlocks(0), 0);
    assert.equal(masteryBlocks(100), 5);
    assert.equal(masteryBlocks(50), 3); // round(2.5) = 3
    assert.equal(masteryBlocks(-50), 0);
    assert.equal(masteryBlocks(500), 5);
    let prev = -1;
    for (let v = 0; v <= 100; v += 1) {
      const b = masteryBlocks(v);
      assert.ok(b >= prev && b >= 0 && b <= 5, `${v} → ${b}`);
      prev = b;
    }
  });
  it('weakestDim only speaks below 80 — advice a learner can trust (2026-08-31)', () => {
    assert.equal(weakestDim({ safety: 92, routing: 94 }), null);
    assert.equal(weakestDim({ safety: 80, routing: 85 }), null);
    assert.equal(weakestDim({ safety: 79, routing: 85 }), 'safety');
    assert.equal(weakestDim({ safety: 79, routing: 60 }), 'routing');
    assert.equal(weakestDim({}), null);
  });
});

describe('Calculator workflow entitlement limits', () => {
  it('creating custom workflows is ACADEMY-ONLY (owner 2026-08-06)', () => {
    assert.equal(WORKFLOW_LIMITS.anonymous.savedWorkflows, 0);
    assert.equal(WORKFLOW_LIMITS.free.savedWorkflows, 0);
    assert.equal(WORKFLOW_LIMITS.lapsed.savedWorkflows, 0);
    assert.equal(WORKFLOW_LIMITS.academy.savedWorkflows, null); // null = unlimited
  });
  it('academy is unlimited on every count and gets every template', () => {
    assert.equal(WORKFLOW_LIMITS.academy.savedProjects, null);
    assert.equal(WORKFLOW_LIMITS.academy.savedResults, null);
    assert.equal(WORKFLOW_LIMITS.academy.templates, 'all');
    assert.equal(WORKFLOW_LIMITS.academy.canResume, true);
  });
  it('free accounts can still run templates, resume, and save results', () => {
    assert.equal(WORKFLOW_LIMITS.free.canResume, true);
    assert.equal(WORKFLOW_LIMITS.free.savedResults, 10);
    assert.equal(WORKFLOW_LIMITS.free.savedProjects, 3);
  });
  it('a LAPSED member is treated as free, never worse', () => {
    assert.deepEqual(WORKFLOW_LIMITS.lapsed, WORKFLOW_LIMITS.free);
  });
  it('anonymous is the most restricted tier and cannot resume', () => {
    assert.equal(WORKFLOW_LIMITS.anonymous.canResume, false);
    assert.equal(WORKFLOW_LIMITS.anonymous.savedProjects, 0);
    assert.equal(WORKFLOW_LIMITS.anonymous.savedResults, 0);
  });
  it('no tier is ever accidentally given a NEGATIVE allowance', () => {
    for (const [tier, l] of Object.entries(WORKFLOW_LIMITS)) {
      for (const k of ['savedWorkflows', 'savedProjects', 'savedResults'] as const) {
        const v = l[k];
        assert.ok(v === null || v >= 0, `${tier}.${k} = ${v}`);
      }
      assert.ok(['selected', 'all'].includes(l.templates), tier);
    }
  });
});
