/**
 * Room Design lab — SUGGESTED SETUPS (owner request + plan agreed 2026-11-14,
 * Downloads/2026-11-14_ROOM_DESIGN_SUGGESTED_SETUPS_PLAN). Receipts for the
 * search (suggestSetups.ts):
 *   1. the default room gets three setups — bass, image, least change — each
 *      beating the current layout on its own goal, adding no new "!" item and
 *      no new placement problem, and standing ≥ 25 cm from the others;
 *   2. the worked example in the plan: the default seat (46%) lands on 3
 *      length-mode peaks/nulls up to 150 Hz; the bass setup lands on 1;
 *   3. every position is usable: inside the walls, speakers ≥ 20 cm clear,
 *      nothing in furniture; the desk moves only in A/B, never in least change;
 *   4. a sub the lab calls "mid-room" goes to a front corner in the bass setup;
 *      multichannel centre and surrounds follow the seat;
 *   5. no impossible number: a goal that cannot improve says so in words; no
 *      "NaN", "Infinity", "undefined" or negative length ever reaches a row;
 *   6. one physics: the search reads roomModel (the calculator's speed of
 *      sound) and the shared FIELD_RANGE_M, and states no constant of its own.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as M from '../src/screens/lab/roomdesign/roomModel.ts';
import { goalScore, layoutSeparation, setupMetrics, SETUP_MIN_DIFF_M, suggestSetups, FLAG_LEVEL, type Setup } from '../src/screens/lab/roomdesign/suggestSetups.ts';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const checksOf = (flags: string[]) => flags.filter((f) => FLAG_LEVEL[f as keyof typeof FLAG_LEVEL] === 'check');
const allText = (s: Setup) => [s.title, s.goalLine, ...s.moves, ...s.better, ...s.why, ...s.tradeoffs, ...s.rows.flatMap((r) => [r.label, r.before, r.after])].join('\n');

function assertUsable(s: Setup, d: M.RoomDesign) {
  const room = s.design.room;
  const lay = s.layout;
  assert.ok(M.pointInPolygon(lay.listener, room.vertices), `${s.letter}: seat inside`);
  for (const sp of lay.speakers) {
    assert.ok(M.pointInPolygon(sp, room.vertices), `${s.letter}: ${sp.role} inside`);
    if (sp.role !== 'SUB') {
      let near = Infinity;
      for (let i = 0; i < room.vertices.length; i++) {
        const e = M.distToEdge(sp, room.vertices, i);
        if (e.t >= 0 && e.t <= 1) near = Math.min(near, e.dist);
      }
      assert.ok(near >= 0.2 - 1e-9, `${s.letter}: ${sp.role} ${near.toFixed(2)} m from a wall`);
    }
    assert.ok(sp.z <= M.zCapAt(room, sp.y) + 1e-9, `${s.letter}: ${sp.role} under the ceiling`);
  }
  for (const f of room.features) assert.ok(M.pointInPolygon(f, room.vertices), `${s.letter}: ${f.kind} inside`);
  assert.equal(s.metrics.conflicts.length, 0, `${s.letter}: ${s.metrics.conflicts.join(' | ')}`);
  assert.equal(s.design.treatment, d.treatment, 'treatment untouched');
}

function assertHonest(s: Setup) {
  const t = allText(s);
  assert.doesNotMatch(t, /NaN|Infinity|undefined|\[object/, `${s.letter}: an impossible value in the text`);
  assert.doesNotMatch(t, /(^|[\s(])-\d/m, `${s.letter}: a negative number`);
  assert.doesNotMatch(t, /\brecommend/i, 'house word is "suggest"');
}

describe('1. the default room: three genuinely different, genuinely better setups', () => {
  const d = M.defaultDesign();
  const r = suggestSetups(d);
  it('three setups in goal order, lettered A, B, C', () => {
    assert.equal(r.blocked, null);
    assert.deepEqual(r.setups.map((s) => s.goal), ['bass', 'image', 'least']);
    assert.deepEqual(r.setups.map((s) => s.letter), ['A', 'B', 'C']);
    assert.deepEqual(r.missing, []);
  });
  it('each beats the current layout on its own goal, with no new "!" item and no new placement problem', () => {
    const baseChecks = checksOf(r.base.flags);
    for (const s of r.setups) {
      const now = goalScore(s.goal, r.base).slice(0, 2);
      const then = goalScore(s.goal, s.metrics).slice(0, 2);
      const i = now.findIndex((v, k) => v !== then[k]);
      assert.ok(i >= 0 && then[i] < now[i], `${s.letter} ${s.goal}: ${now} → ${then}`);
      for (const c of checksOf(s.metrics.flags)) assert.ok(baseChecks.includes(c), `${s.letter} adds "${c}"`);
      assert.ok(s.metrics.conflicts.length <= r.base.conflicts.length);
    }
  });
  it('every pair is genuinely different: 25 cm apart (seat or a speaker), or only one of them moves the desk', () => {
    assert.equal(SETUP_MIN_DIFF_M, 0.25);
    for (let i = 0; i < r.setups.length; i++)
      for (let j = i + 1; j < r.setups.length; j++) {
        const [x, y] = [r.setups[i], r.setups[j]];
        assert.ok(layoutSeparation(x.layout, y.layout) >= 0.25 || !!x.deskMoved !== !!y.deskMoved, `${x.letter}/${y.letter}`);
      }
  });
  it('each has a drawing design, moves, 2–3 "better" lines, a why, trade-offs and before/after rows', () => {
    for (const s of r.setups) {
      assert.equal(s.design.layouts.length, 1);
      assert.equal(s.design.active, 0);
      assert.equal(s.design.layouts[0].speakers.length, s.layout.speakers.length);
      assert.ok(s.moves.length >= 1);
      assert.ok(s.better.length >= 1 && s.better.length <= 3, `${s.letter}: ${s.better.length} better lines`);
      assert.ok(s.why.length >= 1);
      assert.ok(s.tradeoffs.length >= 1, 'the closing honesty line at least');
      assert.ok(s.tradeoffs.at(-1)!.includes('generic speaker spread'));
      assert.ok(s.rows.length >= 8);
      assertHonest(s);
      assertUsable(s, d);
    }
  });
  it('the search is deterministic', () => {
    const again = suggestSetups(d);
    assert.deepEqual(again.setups.map((s) => s.layout), r.setups.map((s) => s.layout));
  });
});

describe('2. the plan’s worked example (default room, 4 × 5 × 2.5 m)', () => {
  const d = M.defaultDesign();
  const r = suggestSetups(d);
  it('now: seat at 46%, 3 of 4 length modes ≤ 150 Hz hit — 34.3 Hz null, 68.6 Hz peak, 137.3 Hz peak', () => {
    assert.equal(Math.round(r.base.seatPct), 46);
    assert.equal(r.base.bassModes, 4);
    assert.deepEqual(r.base.bassHits.map((h) => `${M.fmtHz(h.f)} ${h.zone}`), ['34.3 Hz null', '68.6 Hz peak', '137.3 Hz peak']);
  });
  it('setup A (smoothest bass): 1 hit, the first length mode out of its null, speakers under 50 cm from the front wall', () => {
    const a = r.setups[0];
    assert.equal(a.metrics.bassHits.length, 1);
    assert.equal(a.metrics.firstLength!.zone, 'between');
    assert.ok(a.metrics.frontDist < 0.5);
    assert.ok(a.better[0].startsWith('Bass dips and peaks at your seat: 3 → 1'));
    assert.ok(a.deskMoved, 'A may move the desk (owner Q2)');
    assert.ok(a.moves.some((m) => m.startsWith('Move the desk with it:')));
  });
  it('setup B (image): equilateral 60°, on the center line, matched, fewer strong early wall reflections', () => {
    const b = r.setups[1];
    const st = b.metrics.stereo!;
    assert.equal(Math.round(st.angleDeg), 60);
    assert.ok(Math.abs(st.axisOffset) < 0.01);
    assert.ok(st.pathDiff < 0.005);
    assert.ok(b.metrics.earlyStrong < r.base.earlyStrong);
    assert.ok(Math.abs(st.heightDiff) < 0.01, 'tweeters at ear height');
  });
  it('setup C (least change): the desk never moves and the "!" count drops', () => {
    const c = r.setups[2];
    assert.equal(c.deskMoved, null);
    assert.deepEqual(c.design.room.features, d.room.features);
    assert.ok(checksOf(c.metrics.flags).length < checksOf(r.base.flags).length);
  });
});

describe('3. other rooms and setups', () => {
  it('an off-center seat: least change clears the center-line and L/R items', () => {
    const d = M.defaultDesign();
    d.layouts[0] = { ...d.layouts[0], listener: { ...d.layouts[0].listener, x: 2.3, y: 2.6 } };
    const r = suggestSetups(d);
    assert.ok(r.base.flags.includes('off-center') && r.base.flags.includes('lr-mismatch'));
    const c = r.setups.find((s) => s.goal === 'least')!;
    assert.ok(!c.metrics.flags.includes('off-center') && !c.metrics.flags.includes('lr-mismatch'));
    for (const s of r.setups) assertUsable(s, d);
  });
  it('stereo + sub with the sub mid-room: the bass setup moves it to a front corner; image and least keep it', () => {
    const d = M.defaultDesign();
    d.monitoring = { ...d.monitoring, config: 'stereo_sub' };
    d.layouts[0] = { ...d.layouts[0], speakers: [...d.layouts[0].speakers, { role: 'SUB', x: 2, y: 2.5, z: 0.25, toeDeg: 0 }] };
    const r = suggestSetups(d);
    const a = r.setups.find((s) => s.goal === 'bass')!;
    const sub = a.layout.speakers.find((s) => s.role === 'SUB')!;
    assert.ok(M.subBoundaries(a.design.room, sub).count >= 3, 'two walls and the floor');
    assert.ok(a.moves.some((m) => m.startsWith('Move the subwoofer')));
    for (const s of r.setups.filter((x) => x.goal !== 'bass')) assert.deepEqual(s.layout.speakers.find((x) => x.role === 'SUB'), d.layouts[0].speakers.find((x) => x.role === 'SUB'));
  });
  it('multichannel: the center stays between L and R and the surrounds follow the seat', () => {
    const d = M.defaultDesign();
    d.monitoring = { ...d.monitoring, config: 'multichannel' };
    const l0 = d.layouts[0];
    const L = l0.speakers[0];
    const R = l0.speakers[1];
    d.layouts[0] = {
      ...l0,
      speakers: [L, R, { role: 'C', x: 2, y: L.y, z: L.z, toeDeg: 0 }, { role: 'LS', ...M.surroundPosition(d.room, l0, 'LS'), z: L.z, toeDeg: 0 }, { role: 'RS', ...M.surroundPosition(d.room, l0, 'RS'), z: R.z, toeDeg: 0 }],
    };
    const r = suggestSetups(d);
    assert.ok(r.setups.length >= 1);
    for (const s of r.setups) {
      const sp = (role: string) => s.layout.speakers.find((x) => x.role === role)!;
      assert.ok(Math.abs(sp('C').x - (sp('L').x + sp('R').x) / 2) < 1e-9, `${s.letter}: C centered`);
      const want = M.surroundPosition(s.design.room, { ...s.layout, speakers: [sp('L'), sp('R')] }, 'LS');
      assert.ok(Math.hypot(sp('LS').x - want.x, sp('LS').y - want.y) < 1e-6, `${s.letter}: LS on the ±110° circle`);
      assert.ok(s.moves.some((m) => m.includes('surround')));
    }
  });
  it('imperial rooms speak inches and feet', () => {
    const r = suggestSetups(M.defaultDesign('imperial'));
    for (const s of r.setups) {
      assert.doesNotMatch(s.moves.join(' '), /\b\d+ cm\b|\d\.\d\d m\b/);
      assertHonest(s);
    }
    assert.match(r.setups[0].moves[0], /″/);
  });
  it('a non-rectangular plan or a sloped ceiling: the mode rows are ESTIMATED and a trade-off says LESS reliable', () => {
    const irr = M.defaultDesign();
    irr.room = { ...irr.room, shape: 'irregular', vertices: M.shapeVertices('irregular', 4, 5) };
    const sl = M.defaultDesign();
    sl.room = { ...sl.room, ceiling: 'sloped', heightLow: 2.1 };
    for (const d of [irr, sl]) {
      const r = suggestSetups(d);
      assert.ok(r.setups.length >= 1);
      for (const s of r.setups) {
        assert.equal(s.rows.find((x) => x.label.startsWith('Bass dips'))!.tier, 'ESTIMATED');
        assert.ok(s.tradeoffs.some((t) => t.includes('LESS reliable')));
        assertUsable(s, d);
        assertHonest(s);
      }
    }
  });
  it('the largest room the lab allows (15 × 15 m, midfield) still answers', () => {
    const big = M.resizeDesign({ ...M.defaultDesign(), monitoring: { config: 'stereo', field: 'midfield', model: '' } }, 15, 15);
    const t0 = Date.now();
    const r = suggestSetups(big);
    assert.ok(Date.now() - t0 < 4000, 'within a few seconds even under node --test');
    assert.ok(r.setups.length >= 1);
    // A and B are built inside the class the learner chose; least change
    // keeps the learner's own distances.
    for (const s of r.setups.filter((x) => x.goal !== 'least')) {
      const dist = s.metrics.stereo!.distL;
      assert.ok(dist >= 1.8 - 1e-6 && dist <= 4.2 + 1e-6, `${s.letter}: ${dist.toFixed(2)} m stays midfield`);
    }
  });
});

describe('4. what cannot be improved is said in words', () => {
  it('no left/right pair: the mode is blocked with a sentence, and nothing else', () => {
    const d = M.defaultDesign();
    d.layouts[0] = { ...d.layouts[0], speakers: d.layouts[0].speakers.filter((s) => s.role !== 'R') };
    const r = suggestSetups(d);
    assert.equal(r.setups.length, 0);
    assert.match(r.blocked!, /left and a right speaker/);
  });
  it('a seat already at the bass optimum: the bass goal is missing, with a sentence and no number it cannot stand behind', () => {
    const first = suggestSetups(M.defaultDesign()).setups[0];
    const d = { ...M.defaultDesign(), room: first.design.room, layouts: [first.layout], active: 0 };
    const r = suggestSetups(d);
    assert.ok(!r.setups.some((s) => s.goal === 'bass'));
    const m = r.missing.find((x) => x.goal === 'bass')!;
    assert.match(m.text, /^Smoother bass: /);
    assert.doesNotMatch(m.text, /NaN|undefined|Infinity/);
  });
  it('a tiny room still offers what it can and explains the rest; letters stay with their goals', () => {
    const r = suggestSetups(M.resizeDesign(M.defaultDesign(), 2.2, 2.6));
    assert.equal(r.setups.length + r.missing.length, 3);
    for (const s of r.setups) assert.equal(s.letter, { bass: 'A', image: 'B', least: 'C' }[s.goal]);
    for (const m of r.missing) assert.ok(m.text.length > 30 && !/NaN|undefined/.test(m.text));
  });
  it('every metric row is a value or words — never NaN, never "−0"', () => {
    const r = suggestSetups(M.defaultDesign());
    for (const s of r.setups) for (const row of s.rows) for (const v of [row.before, row.after]) assert.match(v, /^(\d|≈ \d|none|no |on |in |between)/, `${row.label}: "${v}"`);
  });
});

describe('5. one physics, one set of constants', () => {
  const src = code('src/screens/lab/roomdesign/suggestSetups.ts');
  it('reads the model, the calculator speed of sound and the shared field ranges; states no constant of its own', () => {
    assert.match(src, /from '\.\/roomModel\.ts'/);
    assert.doesNotMatch(src, /331\.3|343(\.\d)?\b|speedOfSound/, 'c comes from analyze()');
    assert.match(src, /FIELD_RANGE_M\[d\.monitoring\.field\]/);
    assert.match(src, /SBIR_MAX_HZ/);
    assert.match(src, /SYM_TOL/);
    assert.match(src, /earlyUntreatedWallReflections\(a\.reflections\)/);
    assert.match(src, /placementConflicts\(d, a\)/);
  });
  it('FIELD_RANGE_M lives in roomModel; the plan view re-exports the same object', () => {
    assert.deepEqual(M.FIELD_RANGE_M, { nearfield: [0.8, 1.8], midfield: [1.8, 4.2], other: null });
    assert.match(code('src/screens/lab/roomdesign/RoomPlanView.tsx'), /export \{ FIELD_RANGE_M \};/);
  });
  it('the flags use suggest()’s own thresholds', () => {
    const d = M.defaultDesign();
    const m = setupMetrics(d);
    const a = M.analyze(d);
    // The default design: suggest() raises the length-mode "!" and the
    // front-wall "▸"; the flags agree.
    assert.ok(a.suggestions.some((s) => s.level === 'check' && s.text.includes('null of the L-axis mode')));
    assert.ok(a.suggestions.some((s) => s.level === 'try' && s.text.includes('from the front wall')));
    assert.deepEqual([...m.flags].sort(), ['front-notch', 'length-mode']);
  });
});

describe('6. the screen guide’s TRY THIS numbers are what the search prints for the default design', () => {
  it('A: DIPS+PEAKS 3→1, seat 35%, speakers 36 cm from the front wall · B: STRONG <15ms 2→0 at 60° · C: chair and speakers 30 cm toward the front wall, WARNINGS ! 1→0', async () => {
    const { ROOM_SCREEN_GUIDES } = await import('../src/screens/lab/roomdesign/roomdesignScreenGuides.ts');
    const t = ROOM_SCREEN_GUIDES.suggest.tryThis.join('\n');
    const r = suggestSetups(M.defaultDesign());
    const [a, b, c] = r.setups;
    const checks = (f: string[]) => checksOf(f).length;
    assert.equal(`${r.base.bassHits.length}→${a.metrics.bassHits.length}`, '3→1');
    assert.equal(`${Math.round(a.metrics.seatPct)}%`, '35%');
    assert.equal(M.fmtLen(a.metrics.frontDist, 'metric', { small: true }), '36 cm');
    assert.equal(`${r.base.earlyStrong}→${b.metrics.earlyStrong}`, '2→0');
    assert.equal(Math.round(b.metrics.stereo!.angleDeg), 60);
    assert.deepEqual(c.moves, ['Move your chair 30 cm toward the front wall.', 'Move the left speaker 30 cm toward the front wall.', 'Move the right speaker 30 cm toward the front wall.']);
    assert.equal(c.deskMoved, null);
    assert.equal(`${checks(r.base.flags)}→${checks(c.metrics.flags)}`, '1→0');
    for (const s of ['DIPS+PEAKS reads 3→1', '35%', '36 cm', 'STRONG <15ms reads 2→0', '60°', '30 cm toward the front wall', 'WARNINGS ! reads 1→0']) assert.ok(t.includes(s), s);
  });
});

describe('7. audio review (2026-11-14): no win by a hair, and the near-wall caveats', () => {
  const rooms: [string, M.RoomDesign][] = [
    ['4 × 5', M.defaultDesign()],
    ['4.5 × 6', M.resizeDesign(M.defaultDesign(), 4.5, 6)],
    ['5 × 7 midfield', M.resizeDesign({ ...M.defaultDesign(), monitoring: { config: 'stereo', field: 'midfield', model: '' } }, 5, 7)],
    ['3 × 4', M.resizeDesign(M.defaultDesign(), 3, 4)],
  ];
  it('a setup that claims the first length mode cleared sits at 30–70% of its pressure, not just past 20%', async () => {
    const { DIP_BELOW, PEAK_ABOVE } = await import('../src/screens/lab/roomdesign/suggestSetups.ts');
    for (const [name, d] of rooms) {
      for (const s of suggestSetups(d).setups) {
        if (s.better.some((b) => b.includes('first length mode')) || s.better.some((b) => b.startsWith('First length mode'))) {
          assert.ok(s.metrics.firstLengthP! >= DIP_BELOW && s.metrics.firstLengthP! <= PEAK_ABOVE, `${name} ${s.letter}: p = ${s.metrics.firstLengthP}`);
        }
      }
    }
  });
  it('speakers moved close to the front wall carry the rear-port and boundary-gain trade-off; woofers stay ≥ 35 cm from it', async () => {
    const { FRONT_CLEAR_M } = await import('../src/screens/lab/roomdesign/suggestSetups.ts');
    const a = suggestSetups(M.defaultDesign()).setups[0];
    assert.ok(a.metrics.frontDist < 0.5);
    assert.ok(a.tradeoffs.some((t) => t.includes('rear-port clearance') && t.includes('boundary')));
    for (const [, d] of rooms) for (const s of suggestSetups(d).setups) assert.ok(s.metrics.frontDist >= FRONT_CLEAR_M - 1e-9 || s.goal === 'least');
  });
  it('the estimated notch is rounded, never "101.9 Hz"', () => {
    const a = suggestSetups(M.defaultDesign()).setups[0];
    const row = a.rows.find((r) => r.label.startsWith('Front-wall bass cancellation'))!;
    assert.equal(row.before, '≈ 100 Hz');
    assert.equal(row.after, '≈ 260 Hz');
  });
});

describe('8. TRY THIS SETUP (owner Q3): a kept slot beside START, START never touched', () => {
  it('fills OPTION A, then OPTION B, then asks (null); a replace changes only that slot; the moved desk comes along', async () => {
    const { applySetup, freeTrySlot } = await import('../src/screens/lab/roomdesign/suggestSetups.ts');
    const d0 = M.defaultDesign();
    const [a, b, c] = suggestSetups(d0).setups;
    const start = JSON.stringify(d0.layouts[0]);
    assert.equal(freeTrySlot(d0), 'Option A');
    const d1 = applySetup(d0, a, 'Option A');
    assert.deepEqual(d1.layouts.map((l) => l.name), ['Start', 'Option A']);
    assert.equal(d1.active, 1);
    assert.deepEqual(d1.layouts[1].listener, a.layout.listener);
    assert.equal(d1.room, a.design.room, 'the desk moved with setup A');
    assert.equal(freeTrySlot(d1), 'Option B');
    const d2 = applySetup(d1, b, 'Option B');
    assert.equal(d2.active, 2);
    assert.equal(freeTrySlot(d2), null, 'both full: the report asks');
    const d3 = applySetup(d2, c, 'Option A');
    assert.deepEqual(d3.layouts.map((l) => l.name), ['Start', 'Option A', 'Option B']);
    assert.equal(d3.active, 1);
    assert.deepEqual(d3.layouts[1].speakers, c.layout.speakers);
    assert.deepEqual(d3.layouts[2], d2.layouts[2], 'OPTION B untouched');
    for (const d of [d1, d2, d3]) assert.equal(JSON.stringify(d.layouts[0]), start, 'START untouched');
    // The applied layout is a copy: editing it never writes into the setup.
    d3.layouts[1].speakers[0].x = 99;
    assert.notEqual(c.layout.speakers[0].x, 99);
  });
});

describe('9. bug test (2026-11-14): no empty card, even after TRY; Explore’s early count explained', () => {
  it('every setup has at least one "better" line — in several rooms and after chaining TRY three times', async () => {
    const { applySetup } = await import('../src/screens/lab/roomdesign/suggestSetups.ts');
    const starts = [M.defaultDesign(), M.resizeDesign(M.defaultDesign(), 4.5, 6), M.resizeDesign(M.defaultDesign(), 3, 4), M.resizeDesign({ ...M.defaultDesign(), monitoring: { config: 'stereo', field: 'midfield', model: '' } }, 5, 7)];
    for (const d0 of starts) {
      let d = d0;
      for (let step = 0; step < 4; step++) {
        const r = suggestSetups(d);
        for (const s of r.setups) assert.ok(s.better.length >= 1 && s.better.every((b) => b.length > 10), `step ${step} ${s.letter}: no better line`);
        if (!r.setups.length) break;
        d = applySetup(d, r.setups[step % r.setups.length], step % 2 ? 'Option B' : 'Option A');
      }
    }
  });
  it('when a setup adds weak early reflections, the trade-offs say what Explore will count', () => {
    const r = suggestSetups(M.defaultDesign());
    for (const s of r.setups) {
      if (s.metrics.earlyAll > r.base.earlyAll) assert.ok(s.tradeoffs.some((t) => t.includes("Explore's EARLY <15ms")), s.letter);
    }
  });
});

describe('10. bug test (2026-11-14): the what’s-left row says how Suggested setups counts', () => {
  it('roomCounts names it; the host gives it the "report" goal line', async () => {
    const { roomCounts, moduleGoalDetail } = await import('../src/screens/lab/foundations/endRows.ts');
    assert.match(roomCounts(), /Suggested setups once you open a setup’s report or try one/);
    assert.match(moduleGoalDetail('report', undefined), /^Still to do: open a setup’s report, or try one\./);
    assert.match(code('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx'), /moduleGoalDetail\(m\.id === 'suggest' \? 'report' : m\.rack \? 'work' : 'next'/);
    // …and the work that counts it: opening a report (markWork) or TRY (update).
    const mod = code('src/screens/lab/roomdesign/modules/modSuggest.tsx');
    assert.match(mod, /const openReport = \(i: number, ask = false\) => \{\s*setAskOnOpen\(ask\);\s*setPick\(i\);\s*markWork\(\);/);
  });
});
