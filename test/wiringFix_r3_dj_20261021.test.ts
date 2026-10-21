/**
 * Wiring round 3, DJ Systems Lab (owner-approved 2026-10-21) — each fix's
 * ratchet: the wrong model, wording or drawing fails here if it comes back.
 *   DJ-R3-PHONES  the booth monitor fed from the mixer's PHONES jack instead
 *                 of BOOTH OUT (replaces "booth TRS far end into PHONES",
 *                 which joined two outputs of one mixer): the BOOTH cable's
 *                 MIXER end moves, its far end stays in its monitor, and the
 *                 monitor PLAYS the headphone feed (PHONES knob, CUE; heard
 *                 as L − R since DJ-R4-PHONES, test/wiringFix_r4_dj_20261021);
 *                 Screen 4 draws it from the PHONES jack.
 *   DJ-R3-ADAPTER Screen 20's unbalanced 20 m run is a jack lead with an XLR
 *                 adapter at the stage box (XLR-to-jack lead from MASTER OUT).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, PHONES_MONITOR, PLUGS, builtBooth, connect, hotPatchSpeakers, jacksHeld, powerThump, speakerCabled, speakerFeed, wrongJob, type Booth, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { MAP_BODIES, MAP_PLUGS, PHONES_BOOTH_LANE, PLUG_R, farKindOf, fixedEnd, fixedKindOf, jackPt, plugEnds, routeOf } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
import * as D from '../src/screens/lab/dj/geometry/dressGeometry.ts';
import { renderBooth, clearDeckCache } from '../src/screens/lab/dj/engine/djRender.ts';
import { setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';
type State = Partial<Record<PlugId, JackId | null>>;
type P = readonly [number, number];

const WIRED: State = Object.fromEntries(MAP_PLUGS.map((p) => [p, BUILT_PLUGS[p]]));
/** The booth after connect() (the model's own one-plug-per-jack rule). */
const movedState = (p: PlugId, j: JackId): State => {
  const b = connect(builtBooth(), p, j)!;
  return Object.fromEntries(MAP_PLUGS.map((q) => [q, b.plugs[q]]));
};

/** Deck A playing, its fader up — nothing cued. */
function playing(): Booth {
  let b = builtBooth();
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 0.12 + 16 * (240 / 122) } } };
  b = setPlaying(b, 0, 'A', true);
  return { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } } };
}
const peak = (a: Float32Array) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('DJ-R3-PHONES — the model', () => {
  it('a BOOTH cable’s mixer end moves to PHONES; its far end stays in ITS monitor, which it holds', () => {
    assert.deepEqual(PHONES_MONITOR, { 'bth.trsL': 'boothL.in', 'bth.trsR': 'boothR.in' });
    for (const [p, mon] of Object.entries(PHONES_MONITOR) as [PlugId, JackId][]) {
      assert.ok(PLUGS[p].fits.includes('mix.phones'));
      assert.deepEqual(jacksHeld(p, 'mix.phones'), ['mix.phones', mon]);
      const b = connect(builtBooth(), p, 'mix.phones')!;
      assert.equal(b.plugs[p], 'mix.phones');
      assert.equal(b.plugs.phones, null, 'one plug per jack: the headphones come out');
      assert.deepEqual(speakerFeed(b, mon.slice(0, -3) as 'boothL'), { out: 'PHONES', side: p.endsWith('L') ? 'L' : 'R' });
      assert.ok(speakerCabled(b, mon.slice(0, -3) as 'boothL'), 'still cabled to the mixer (a power switch can thump it)');
      assert.ok(powerThump(b, 'mixer'));
      // another plug into that monitor's input frees the booth cable
      const c = connect(b, 'mst.xlrL', mon)!;
      assert.equal(c.plugs[p], null);
      // the headphones back into PHONES free it too
      assert.equal(connect(b, 'phones', 'mix.phones')!.plugs[p], null);
    }
    // a booth cable left in another speaker's input, moved to PHONES, bumps whatever was in its own monitor
    const x = connect(connect(builtBooth(), 'mst.xlrL', 'boothL.in')!, 'bth.trsL', 'mix.phones')!;
    assert.equal(x.plugs['mst.xlrL'], null);
  });
  it('the "two outputs joined" move and its wording are gone; the new wording is the owner-approved line', () => {
    const t = wrongJob('bth.trsL', 'mix.phones')!;
    // DJ-R4-PHONES (owner 2026-10-21, "model it realistically"): the line now says why it sounds thin — the balanced input subtracts the two sides
    assert.equal(t, 'It fits, and it plays — but thin and hollow. The headphone jack is stereo: left on the tip, right on the ring. The monitor’s balanced input subtracts one from the other, so it plays left minus right. Anything in the middle (kick, bass, vocal) cancels out. Only the sides are left, and a mono track goes almost silent. It also follows your headphone cue and the PHONES knob, not BOOTH. Booth monitors belong on BOOTH OUT.');
    assert.equal(wrongJob('bth.trsR', 'mix.phones'), t);
    for (const f of ['model/djModel.ts', 'trays.tsx', 'art/SystemMap.tsx', 'geometry/mapGeometry.ts', 'geometry/dressGeometry.ts']) {
      assert.doesNotMatch(read(DJ + f), /joined two outputs|other end is in BOOTH OUT/, f);
    }
    // the headphones' fits-but-wrong-job moves stay
    for (const j of ['paL.in', 'paR.in', 'boothL.in', 'boothR.in'] as const) assert.match(wrongJob('phones', j)!, /^It fits — but headphones are a listening device/);
  });
  it('the tray offers it as the MIXER END and says where both ends are', () => {
    const tray = read(`${DJ}trays.tsx`);
    assert.match(tray, /label=\{j === 'mix\.phones' && PHONES_MONITOR\[sel\] \? 'MIXER END → PHONES' :/);
    assert.match(tray, /`Mixer PHONES jack \(moved from BOOTH OUT\) → \$\{JACK_NAMES\[PHONES_MONITOR\[sel\]!\]\}`/);
  });
  it('hot-patching the mixer end on a live monitor is flagged (BOOTH or PHONES level up)', () => {
    const b = playing();
    assert.deepEqual(hotPatchSpeakers(b, 'bth.trsL', 'mix.phones'), ['boothL']);
    const at = connect(b, 'bth.trsL', 'mix.phones')!;
    assert.deepEqual(hotPatchSpeakers({ ...at, mixer: { ...at.mixer, booth: 0 } }, 'bth.trsL', 'boothL.in'), ['boothL'], 'the PHONES level is up');
    assert.deepEqual(hotPatchSpeakers({ ...at, mixer: { ...at.mixer, booth: 0, phones: 0 } }, 'bth.trsL', 'boothL.in'), []);
  });
});

describe('DJ-R3-PHONES — the render: the monitor plays the HEADPHONE cue', () => {
  clearDeckCache();
  const moved = (p: PlugId = 'bth.trsL') => ({ ...connect(playing(), p, 'mix.phones')!, perspective: 'BOOTH' as const });
  it('nothing cued: the moved monitor is silent although deck A plays to the room; the other monitor plays the booth mix', () => {
    const r = renderBooth(moved(), 0, 1);
    assert.equal(peak(r.playback.l), 0, 'BOOTH L follows the (empty) cue');
    assert.ok(peak(r.playback.r) > 0.01, 'BOOTH R still on BOOTH OUT');
  });
  it('press CUE on the next track (deck B, fader down): the monitor plays it too', () => {
    let b = moved();
    // DJ-R4-PHONES: the monitor hears L − R, so cue deck B where it has side
    // content (16 bars in: panned hats and shaker); at its kick-only intro the
    // centre cancels and the monitor is all but silent (test/wiringFix_r4_dj)
    b = { ...b, decks: { ...b.decks, B: { ...b.decks.B, posSec: 0.12 + 16 * (240 / 122) } } };
    b = setPlaying(b, 0, 'B', true);
    b = { ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: 0, cue: true } } };
    const r = renderBooth(b, 0, 1);
    assert.ok(peak(r.playback.l) > 0.005, 'the cued track (its sides) is in the booth monitor');
    // and the crowd never hears it (fader down)
    const crowd = renderBooth({ ...b, perspective: 'CROWD' }, 0, 1);
    const solo = renderBooth({ ...b, perspective: 'CROWD', ch: { ...b.ch, 2: { ...b.ch[2], cue: false } } }, 0, 1);
    assert.equal(crowd.rmsDb.crowd.toFixed(3), solo.rmsDb.crowd.toFixed(3));
  });
  it('it follows the PHONES knob, not BOOTH; it hears L − R (DJ-R4-PHONES: was the stereo feed summed)', () => {
    let b = moved();
    b = { ...b, mixer: { ...b.mixer, cueMix: 1 } }; // the headphones' MASTER side: the mix
    const r = renderBooth(b, 0, 1);
    assert.ok(peak(r.playback.l) > 0.001, 'the mix’s sides reach it');
    const noBooth = renderBooth({ ...b, mixer: { ...b.mixer, booth: 0 } }, 0, 1);
    assert.ok(Math.abs(peak(noBooth.playback.l) - peak(r.playback.l)) < 1e-6, 'the BOOTH knob does nothing to it');
    const noPhones = renderBooth({ ...b, mixer: { ...b.mixer, phones: 0 } }, 0, 1);
    assert.equal(peak(noPhones.playback.l), 0, 'the PHONES knob down: silent');
    const src = read(`${DJ}engine/djRender.ts`);
    // DJ-R4-PHONES: the summed feed is gone; both renders share the L − R helper
    assert.doesNotMatch(src, /pMono/);
    assert.match(src, /PHONES: \{ L: pDiff, R: pDiff \}/);
    assert.match(read(`${DJ}engine/djEventRender.ts`), /PHONES: \{ L: pDiff, R: pDiff \}/);
  });
  it('the map and the room light it from the headphone feed', () => {
    let b = moved();
    b = { ...b, mixer: { ...b.mixer, cueMix: 1 } };
    const r = renderBooth(b, 0, 1);
    assert.equal(D.speakerLit(b, r, 'boothL'), true);
    assert.equal(D.speakerLit(moved(), renderBooth(moved(), 0, 1), 'boothL'), false, 'nothing cued: unlit');
  });
});

describe('DJ-R3-PHONES — Screen 4 draws it from the PHONES jack', () => {
  const crossings = (a: readonly P[], b: readonly P[]): P[] => {
    const out: P[] = [];
    for (let i = 1; i < a.length; i++) for (let k = 1; k < b.length; k++) {
      const [x1, y1] = a[i - 1], [x2, y2] = a[i], [x3, y3] = b[k - 1], [x4, y4] = b[k];
      const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
      if (Math.abs(d) < 1e-9) continue;
      const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
      const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      if (Math.abs(d) / (Math.hypot(x2 - x1, y2 - y1) * Math.hypot(x4 - x3, y4 - y3)) < 0.5) continue;
      out.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]);
    }
    return out;
  };
  /** every 1 mm along a polyline */
  const sample = (r: readonly P[]): P[] => {
    const out: P[] = [r[0]];
    for (let i = 1; i < r.length; i++) {
      const n = Math.max(1, Math.ceil(Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])));
      for (let j = 1; j <= n; j++) out.push([r[i - 1][0] + ((r[i][0] - r[i - 1][0]) * j) / n, r[i - 1][1] + ((r[i][1] - r[i - 1][1]) * j) / n]);
    }
    return out;
  };
  const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;

  for (const [p, mon] of Object.entries(PHONES_MONITOR) as [PlugId, JackId][]) {
    it(`${p}: from the PHONES jack on the front edge to its monitor's plate; BOOTH OUT empty; no rear panel crossed`, () => {
      const st = movedState(p, 'mix.phones');
      const r = D.run4(p, st);
      assert.deepEqual(r[0], [D.phonesJack4.x, D.phonesJack4.y]);
      assert.deepEqual(r[r.length - 1], [jackPt(mon).x, jackPt(mon).y]);
      const e = plugEnds(p, 'mix.phones', D.jackPt4);
      assert.deepEqual(e.fixed, D.phonesJack4, 'the mixer-end plug is drawn IN the PHONES jack');
      assert.deepEqual(e.far, jackPt(mon));
      const booth = fixedEnd(p)!;
      assert.ok(sample(r).every(([x, y]) => Math.hypot(x - booth.x, y - booth.y) > PLUG_R.trs + 4), 'nothing at the BOOTH OUT socket');
      // (it leaves the PHONES jack straight down off the front edge's face)
      for (const [x, y] of sample(r)) for (const b of [...MAP_BODIES.slice(0, 4), D.FRONT4]) {
        if (b === D.FRONT4 && Math.abs(x - D.phonesJack4.x) < 2 && y >= D.phonesJack4.y) continue;
        assert.ok(!inside(b, x, y), `${p} over the gear at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      }
      // its own lane, pulled tight (no shared sag with its old partner)
      assert.ok(r.some(([, y]) => y === PHONES_BOOTH_LANE));
      const top = sample(r).filter(([x, y]) => y < 526 && y > 500 && Math.abs(x - 363) > 16 && Math.abs(x - jackPt(mon).x) > 16);
      assert.ok(top.length > 0 && top.every(([, y]) => y <= PHONES_BOOTH_LANE + 1e-9), 'across the top it stays on its lane: no sag onto the panels');
      // the map's own route starts in the map's PHONES jack and ends in the monitor
      const m = routeOf(p, 'mix.phones');
      assert.deepEqual(m[0], [jackPt('mix.phones').x, jackPt('mix.phones').y]);
      assert.deepEqual(m[m.length - 1], [jackPt(mon).x, jackPt(mon).y]);
    });
    it(`${p}: ≥ 4 mm (edge to edge) from every other dressed run except where it crosses, and one plug radius from every plug it does not own`, () => {
      const st = movedState(p, 'mix.phones');
      const r = D.run4(p, st);
      const bad: string[] = [];
      for (const q of MAP_PLUGS) {
        if (q === p) continue;
        const o = D.drawnRun4(q, st);
        const xs = crossings(r, o);
        let worst = Infinity;
        for (const pt of sample(r)) {
          if (xs.some((c) => Math.hypot(c[0] - pt[0], c[1] - pt[1]) < 14)) continue;
          worst = Math.min(worst, D.distToPolyline(o, pt[0], pt[1]) - D.cableHalf4(p) - D.cableHalf4(q));
        }
        if (worst < 4) bad.push(`${q}: ${worst.toFixed(2)} mm`);
        const e = plugEnds(q, st[q] ?? null, D.jackPt4);
        if (e.fixed && D.distToPolyline(r, e.fixed.x, e.fixed.y) < PLUG_R[fixedKindOf(q)]) bad.push(`over ${q}'s fixed plug`);
        if (e.far && D.distToPolyline(r, e.far.x, e.far.y) < PLUG_R[farKindOf(q)]) bad.push(`over ${q}'s far plug`);
        // and no other run passes over this cable's two plugs
        for (const [k, pt] of [['phones jack', D.phonesJack4], ['monitor', jackPt(mon)]] as const) {
          if (D.distToPolyline(o, pt.x, pt.y) < PLUG_R.trs) bad.push(`${q} over the ${k} plug`);
        }
      }
      assert.deepEqual(bad, []);
    });
  }
});

describe('DJ-R3-ADAPTER — Screen 20’s unbalanced run: a jack lead with an XLR adapter', () => {
  const p20 = read(`${DJ}pages/p20Pa.tsx`);
  it('names it in the chip, the tray note, the scene’s words and the why; the hum mechanism stays', () => {
    assert.match(p20, /<LabChip label="JACK LEAD \+ XLR ADAPTER" selected=\{v\.cable === 'UNBAL'\}/);
    assert.match(p20, /A jack lead with an XLR adapter — unbalanced: an XLR-to-jack lead from your MASTER OUT, its 6\.35 mm TS jack in a jack-to-XLR adapter at the stage box\. Every plug fits, but the TS jack ties pin 3 to pin 1, so the line no longer balances\./);
    assert.match(p20, /'a jack lead with an XLR adapter at the stage box — unbalanced'/);
    assert.match(p20, /why="This run is a jack lead with an XLR adapter — unbalanced: the 6\.35 mm TS jack ties pin 3 to pin 1, so its shield is also the music’s return wire — and over 20 m its shield also carries ground current between the booth’s earth and the stage’s earth: that is the hum\./);
    assert.doesNotMatch(p20, /XLR ENDS, UNBALANCED WIRING|e\.g\. an adaptor lead/);
    // the balanced run is unchanged
    assert.match(p20, /<LabChip label="XLR \(BALANCED\)" selected=\{v\.cable === 'XLR'\}/);
  });
  it('draws it: the mixer end an XLR (fits the male MASTER OUT), the far end a TS jack in an adapter seated in the stage box’s female XLR (C13)', () => {
    assert.match(p20, /kind: 'xlr', colour: '#3d4046', pts, plugged: true, live: true, label: `\$\{from === 'L' \? 'MST L' : 'MST R'\}\$\{unbal \? ' · UNBAL' : ''\}`, dashed: from === 'R', unbal, farAdapter: unbal \}\}/);
    const c = read(`${DJ}art/cables.tsx`);
    assert.match(c, /farAdapter\?: boolean;/);
    assert.match(c, /\{r\.plugged && r\.farAdapter \? \(\n\s*<AdapterFace cx=\{b\[0\]\} cy=\{b\[1\]\} colour=\{r\.colour\} \/>/);
    assert.match(c, /<PlugFace cx=\{cx\} cy=\{cy\} kind="xlr" colour=\{colour\} \/>/);
    assert.match(c, /kind="trs" colour=\{colour\} \/>/);
  });
});
