/**
 * DJ-02 (owner 2026-10-20, "Yes, allow and explain"): moves that FIT on
 * real gear but do the wrong job are allowed in the PATCH tray and explained.
 * The headphone plug in a powered speaker's combo input is silent in the
 * render (never a hazard) and drawn from its break mark to the plate's input.
 * DJ-R3-PHONES (owner 2026-10-21) REPLACED the old "booth TRS far end into
 * PHONES" move (two outputs joined — unrealistic): the BOOTH cable's MIXER end
 * now moves to the PHONES jack, its far end stays in its booth monitor, and
 * the monitor plays the headphone feed (pinned in
 * test/wiringFix_r3_dj_20261021.test.ts). The existing moves keep their
 * lanes, routes and flags (test/djCables.test.ts).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, PLUGS, builtBooth, connect, hotPatchSpeakers, wrongJob, type Booth, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { FLAG, MAP_BODIES, MAP_PLUGS, PLUG_R, farKindOf, fixedKindOf, jackPt, plugEnds, routeOf } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
import * as D from '../src/screens/lab/dj/geometry/dressGeometry.ts';
import { renderBooth, clearDeckCache } from '../src/screens/lab/dj/engine/djRender.ts';
import { setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
type State = Partial<Record<PlugId, JackId | null>>;

const MOVES: [PlugId, JackId][] = [
  ['bth.trsL', 'mix.phones'], ['bth.trsR', 'mix.phones'],
  ['phones', 'paL.in'], ['phones', 'paR.in'], ['phones', 'boothL.in'], ['phones', 'boothR.in'],
];
const WIRED: State = Object.fromEntries(MAP_PLUGS.map((p) => [p, BUILT_PLUGS[p]]));
const moved = (p: PlugId, j: JackId): State => {
  const st: State = { ...WIRED };
  for (const q of MAP_PLUGS) if (q !== p && st[q] === j) st[q] = null;
  st[p] = j;
  return st;
};
const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number, m = 0) => x > b.x + m && x < b.x + b.w - m && y > b.y + m && y < b.y + b.h - m;

function playing(): Booth {
  let b = builtBooth();
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 0.12 + 16 * (240 / 122) } } };
  b = setPlaying(b, 0, 'A', true);
  return { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } } };
}

describe('DJ-02: the tray allows the physical fits and explains the wrong job', () => {
  it('the booth TRS plugs fit the PHONES jack; the headphone plug fits every speaker input', () => {
    for (const [p, j] of MOVES) {
      assert.ok(PLUGS[p].fits.includes(j), `${p} → ${j} offered`);
      assert.ok(connect(builtBooth(), p, j), `${p} → ${j} connects`);
    }
  });
  it('each is explained as the wrong job, in the owner’s words; the right moves are not', () => {
    // DJ-R3-PHONES: the booth move is now the mixer end in PHONES — it plays
    // DJ-R4-PHONES: it plays, thin — the balanced input subtracts the sides
    assert.match(wrongJob('bth.trsL', 'mix.phones')!, /^It fits, and it plays — but thin and hollow\./);
    assert.match(wrongJob('bth.trsR', 'mix.phones')!, /Booth monitors belong on BOOTH OUT\.$/);
    for (const j of ['paL.in', 'paR.in', 'boothL.in', 'boothR.in'] as const) assert.match(wrongJob('phones', j)!, /^It fits — but headphones are a listening device, not a source: nothing plays/);
    for (const p of MAP_PLUGS) if (BUILT_PLUGS[p]) assert.equal(wrongJob(p, BUILT_PLUGS[p]), null, `${p} in its built jack`);
    assert.equal(wrongJob('bth.trsL', 'paL.in'), null);
    assert.equal(wrongJob('phones', null), null);
    const tray = read('src/screens/lab/dj/trays.tsx');
    assert.match(tray, /wrongJob\(sel, at\) \? <Text style=\{styles\.wrong\}>\{`WRONG JOB — \$\{wrongJob\(sel, at\)\}`\}/);
  });
});

describe('DJ-02: the render treats them as producing nothing — never a hazard', () => {
  clearDeckCache();
  it('DJ-R3-PHONES: a booth cable moved to PHONES — the headphones are out (one plug per jack), the phone plays no headphones', () => {
    const b = { ...connect(playing(), 'bth.trsL', 'mix.phones')!, perspective: 'PHONES' as const };
    assert.equal(b.plugs.phones, null, 'one plug per jack: the headphones came out');
    const r = renderBooth(b, 0, 1);
    assert.ok(r.playback.l.every((v) => v === 0) && r.playback.r.every((v) => v === 0), 'no headphones: the PHONES perspective is silent');
    assert.ok(r.limiterDb > -0.01, 'no limiter action: no hazard');
  });
  it('the headphone plug in a speaker input: that speaker is silent; nothing loud anywhere', () => {
    for (const j of ['paL.in', 'paR.in'] as const) {
      const b = connect(playing(), 'phones', j)!;
      const r = renderBooth(b, 0, 1);
      // the crowd hears only the other PA
      const side = j === 'paL.in' ? r.playback.l : r.playback.r;
      assert.ok(side.every((v) => v === 0), `${j}: that side of the room is silent`);
      assert.ok(r.limiterDb > -6, 'no hazard level');
      assert.deepEqual(hotPatchSpeakers(playing(), 'phones', j), [], 'the headphone plug never flags a bang');
    }
    for (const j of ['boothL.in', 'boothR.in'] as const) {
      const b = { ...connect(playing(), 'phones', j)!, perspective: 'BOOTH' as const };
      const r = renderBooth(b, 0, 1);
      const side = j === 'boothL.in' ? r.playback.l : r.playback.r;
      assert.ok(side.every((v) => v === 0), `${j}: that monitor is silent`);
    }
  });
  it('DJ-R3-PHONES: the map draws a booth cable in the PHONES jack as carrying the headphone feed', () => {
    assert.match(read('src/screens/lab/dj/art/SystemMap.tsx'), /if \(p\.startsWith\('bth\.'\)\) return at === 'mix\.phones' \? Math\.max\(last\.rmsDb\.phonesL, last\.rmsDb\.phonesR\) > -90 : last\.rmsDb\.booth > -90;/);
  });
});

describe('DJ-02: Screen 4 draws each move on a real route', () => {
  const mixer = MAP_BODIES[1];
  it('DJ-R3-PHONES: the booth run starts in the PHONES jack on the front edge, ends in its monitor, and never crosses a rear panel', () => {
    for (const [p, mon] of [['bth.trsL', 'boothL.in'], ['bth.trsR', 'boothR.in']] as const) {
      const st = moved(p, 'mix.phones');
      const r = D.drawnRun4(p, st);
      assert.ok(Math.hypot(r[0][0] - D.phonesJack4.x, r[0][1] - D.phonesJack4.y) < 0.01, `${p} starts at phonesJack4`);
      const end = r[r.length - 1];
      const b = jackPt(mon);
      assert.ok(Math.hypot(end[0] - b.x, end[1] - b.y) < 0.01, `${p} ends in ${mon}`);
      for (const [x, y] of r) for (const body of MAP_BODIES.slice(0, 3)) assert.ok(!inside(body, x, y), `${p} on a rear panel at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      // the map's own route starts in the map's jack
      const m = routeOf(p, 'mix.phones');
      assert.deepEqual(m[0], [jackPt('mix.phones').x, jackPt('mix.phones').y]);
    }
  });
  it('the headphone cable runs from its break mark to the plate’s input, over no rear panel', () => {
    for (const j of ['paL.in', 'paR.in', 'boothL.in', 'boothR.in'] as const) {
      const r = D.drawnRun4('phones', moved('phones', j));
      assert.deepEqual(r[0], [D.PHONES_BREAK.x, D.PHONES_BREAK.y]);
      const b = jackPt(j);
      const end = r[r.length - 1];
      assert.ok(Math.hypot(end[0] - b.x, end[1] - b.y) < 0.01, `ends in ${j}`);
      for (const [x, y] of r) for (const body of [...MAP_BODIES.slice(0, 4), D.FRONT4]) assert.ok(!inside(body, x, y, 0.5), `phones → ${j} over the gear at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
  });
  it('the dressed runs keep one plug radius from every plug they do not own', () => {
    const bad: string[] = [];
    for (const [p, j] of MOVES) {
      const st = moved(p, j);
      const plugs: { owner: PlugId; x: number; y: number; r: number }[] = [];
      for (const q of MAP_PLUGS) {
        // each plug where it is drawn (DJ-R3-PHONES: a moved booth cable's plugs are in PHONES and its monitor)
        const e = plugEnds(q, st[q] ?? null, D.jackPt4);
        if (e.fixed) plugs.push({ owner: q, ...e.fixed, r: PLUG_R[fixedKindOf(q)] });
        if (e.far) plugs.push({ owner: q, ...e.far, r: PLUG_R[farKindOf(q)] });
      }
      for (const q of MAP_PLUGS) {
        const run = D.drawnRun4(q, st);
        for (const pl of plugs) if (pl.owner !== q && D.distToPolyline(run, pl.x, pl.y) < pl.r) bad.push(`${p} → ${j}: ${q} passes ${pl.owner}'s plug`);
      }
    }
    assert.deepEqual(bad, []);
  });
  it('the moved cable carries its flag, off the gear and every cable, on the phone, full screen and at 3×', () => {
    const tw = (t: string, k = 1) => {
      let em = 0;
      for (const c of t) em += 'MW'.includes(c) ? 0.74 : " .,:;·'’|!I1()".includes(c) ? 0.3 : 0.55;
      return em * 10 * k + t.length * 0.6 * k;
    };
    const ov = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const bad: string[] = [];
    for (const [p, j] of MOVES) {
      const st = moved(p, j);
      const cables = D.cableObstacles4(st);
      const hanging = MAP_PLUGS.filter((q) => !st[q]).map((q) => D.loosePlugBox4(q, st)); // DJ-R2-11: a freed MASTER R drapes clear of deck A's leads
      for (const [view, s, k, shown] of [['phone', 0.327, 1, [p]], ['full 1×', 0.37, 1, MAP_PLUGS], ['full 3×', 1.08, Math.sqrt(3), MAP_PLUGS]] as const) {
        const fb = D.followBox4(p, st, 345 / 318);
        for (const box of [undefined, view === 'phone' ? fb : undefined]) {
          const sc = box ? 345 / fb.w : s;
          const placed = D.patchLabels4(st, shown, () => false, sc, k, tw, { focus: [p], view: box });
          const at = `${p} → ${j}, ${view}${box ? ' (cable view)' : ''}`;
          if (!placed.some((q) => q.id === p)) bad.push(`${at}: no flag`);
          for (const q of placed) {
            for (const b of [...MAP_BODIES, D.FRONT4, D.patchTitleBox4(sc, k, tw), ...hanging]) if (ov(q, b) > 0.5) bad.push(`${at}: ${q.id} on the gear`);
            for (const o of placed) if (o !== q && ov(q, o) > 0) bad.push(`${at}: ${q.id} on ${o.id}`);
            for (const c of cables) if (D.cableInBox(c.pts, q, c.half) > 0) bad.push(`${at}: ${q.id} on the ${c.id} cable`);
          }
        }
      }
    }
    assert.deepEqual(bad, []);
  });
  it('every existing flag spot is unchanged', () => {
    assert.deepEqual(FLAG['bth.trsL'], [600, 508]);
    assert.deepEqual(FLAG['bth.trsR'], [384, 516]);
    assert.deepEqual(FLAG.phones, [330, 704]);
    assert.deepEqual(FLAG['mst.xlrL'], [160, 492]);
  });
});
