/**
 * DJ-02 (owner 2026-10-20, "Yes, allow and explain"): two moves that FIT on
 * real gear but do the wrong job — the BOOTH TRS plug in the mixer's 6.35 mm
 * PHONES jack, and the headphone plug in a powered speaker's combo input —
 * are allowed in the PATCH tray, explained as the wrong job, silent in the
 * render (never a hazard), and drawn on Screen 4 with real routes: the booth
 * run into the jack on the FRONT EDGE without crossing the mixer's rear
 * panel, the headphone cable from its break mark to the plate's input. The
 * existing moves keep their lanes, routes and flags (test/djCables.test.ts).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, PLUGS, builtBooth, connect, hotPatchSpeakers, wrongJob, type Booth, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { FLAG, MAP_BODIES, MAP_PLUGS, PLUG_R, farKindOf, fixedEnd, fixedKindOf, jackPt, routeOf } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
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
    assert.match(wrongJob('bth.trsL', 'mix.phones')!, /^It fits — but that jack is an output: two outputs tied together, nothing plays/);
    assert.match(wrongJob('bth.trsR', 'mix.phones')!, /booth line belongs in a booth monitor/);
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
  it('a booth line in the PHONES jack: the headphones are out, nothing plays in them, the monitor it left is silent', () => {
    const b = { ...connect(playing(), 'bth.trsL', 'mix.phones')!, perspective: 'PHONES' as const };
    assert.equal(b.plugs.phones, null, 'one plug per jack: the headphones came out');
    const r = renderBooth(b, 0, 1);
    assert.ok(Math.max(r.rmsDb.phonesL, r.rmsDb.phonesR) < -100 || r.playback.l.every((v) => v === 0), 'nothing in the headphones');
    assert.ok(r.playback.l.every((v) => v === 0) && r.playback.r.every((v) => v === 0), 'the phone plays silence');
    const booth = renderBooth({ ...b, perspective: 'BOOTH' }, 0, 1);
    let peak = 0;
    for (const v of booth.playback.l) peak = Math.max(peak, Math.abs(v));
    assert.equal(peak, 0, 'BOOTH L (the left of the booth pair) hears nothing from the jack it left');
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
  it('the map draws a booth line in the PHONES jack as carrying nothing', () => {
    assert.match(read('src/screens/lab/dj/art/SystemMap.tsx'), /if \(p\.startsWith\('bth\.'\)\) return at !== 'mix\.phones' && last\.rmsDb\.booth > -90;/);
  });
});

describe('DJ-02: Screen 4 draws each move on a real route', () => {
  const mixer = MAP_BODIES[1];
  it('the booth run ends in the PHONES jack on the front edge and never crosses the mixer’s rear panel after leaving it', () => {
    for (const p of ['bth.trsL', 'bth.trsR'] as const) {
      const st = moved(p, 'mix.phones');
      const r = D.drawnRun4(p, st);
      const a = fixedEnd(p)!;
      assert.ok(Math.hypot(r[0][0] - a.x, r[0][1] - a.y) < 0.01, `${p} starts at its jack`);
      const end = r[r.length - 1];
      assert.ok(Math.hypot(end[0] - D.phonesJack4.x, end[1] - D.phonesJack4.y) < 0.01, `${p} ends at phonesJack4`);
      let left = false;
      for (const [x, y] of r) {
        if (!inside(mixer, x, y)) left = true;
        else assert.ok(!left, `${p} re-enters the mixer's rear panel at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      }
      assert.ok(left);
      // it comes down the gap beside the mixer, clear of deck B's panel too
      for (const [x, y] of r) assert.ok(!inside(MAP_BODIES[0], x, y), `${p} on deck B's panel`);
      // the map's own route ends in the map's jack
      const m = routeOf(p, 'mix.phones');
      assert.deepEqual(m[m.length - 1], [jackPt('mix.phones').x, jackPt('mix.phones').y]);
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
        const a = fixedEnd(q)!;
        if (PLUGS[q].kind !== 'phones') plugs.push({ owner: q, x: a.x, y: a.y, r: PLUG_R[fixedKindOf(q)] });
        const to = st[q];
        if (to) plugs.push({ owner: q, ...D.jackPt4(to), r: PLUG_R[farKindOf(q)] });
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
      const hanging = MAP_PLUGS.filter((q) => !st[q]).map(D.loosePlugBox4);
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
