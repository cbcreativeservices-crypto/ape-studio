/**
 * The signal-flow boards of DJ screens 23 and 24 after the lab-art grade of
 * 2026-10-19 ("plain boxes with tiny icons; seven power cords 2–4 px apart"):
 * every card shows its device and the device grows into the card as the
 * zoom grows; every power cord keeps its own lane (10 board units ≥ 7.5 pt
 * at 390 wide), its own pattern, and never crosses another except where the
 * board hops it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { B23, B24, TILE_SIZE, WALL_PLATE, board23Cords, board24Cords, cardLayout, cordCrossings, parallelGap, stripOutletY, wallOutlet, type CardSpec, type CordGeo } from '../src/screens/lab/dj/art/eventBoardGeometry.ts';

/** A conservative label-face measure (per mm of font size): caps ≈ 0.56 em,
 *  narrow glyphs less — wider than Oswald SemiBold, so a pass here fits. */
const width = (t: string) => {
  let em = 0;
  for (const c of t) em += ' .,:·’'.includes(c) ? 0.24 : 'I1'.includes(c) ? 0.3 : 'MW'.includes(c) ? 0.72 : 0.56;
  return em;
};
/** 9 pt in mm at 390 wide (board scale ≈ 0.79 pt/mm), and at FULL SCREEN 3×
 *  (the words grow by √3 while the board grows 3×). */
const LM_1X = 9 / 0.79;
const LM_3X = (9 * Math.sqrt(3)) / (0.86 * 3);

const CARDS: (CardSpec & { name: string })[] = [
  { name: '23 laptop', x: 0, y: 0, w: 108, h: 58, title: 'DJ 2 LAPTOP', sub: 'PLAYING', art: { kind: 'laptop' }, reserve: ['PLAYING'] },
  { name: '23 deck', x: 0, y: 202, w: 108, h: 56, title: 'DECK B', sub: 'BACKUP PLAYING', art: { kind: 'player' }, reserve: ['BACKUP'] },
  { name: '23 channel', x: 162, y: 134, w: 84, h: 124, title: 'CH 2', sub: ['HUM', 'USB 2'], art: { kind: 'channel' }, tap: 'ch2', onAir: true, reserve: ['USB 2', 'ON AIR'] },
  { name: '23 mix', x: 266, y: 0, w: 44, h: 258, title: 'MIX', art: { kind: 'master' }, tap: 'bus' },
  { name: '23 PA', x: 328, y: 0, w: 84, h: 58, title: 'PA', art: { kind: 'speaker' }, tap: 'crowd' },
  { name: '23 booth', x: 328, y: 78, w: 84, h: 58, title: 'BOOTH', art: { kind: 'monitors' }, tap: 'booth' },
  { name: '23 phones', x: 328, y: 156, w: 84, h: 54, title: 'PHONES', art: { kind: 'phones' }, tap: 'phonesL' },
  { name: '23 wall', ...B23.WALL, title: 'WALL SOCKET', sub: 'ANOTHER CIRCUIT', art: { kind: 'wall' } },
  { name: '24 mic', x: 0, y: 0, w: 100, h: 64, title: 'MIC', sub: 'OFF', art: { kind: 'mic' } },
  { name: '24 deck', x: 0, y: 74, w: 100, h: 100, title: 'DECK B', sub: 'FILE ERROR', art: { kind: 'player' }, reserve: ['PLAYING'] },
  { name: '24 mic ch', x: 140, y: 0, w: 84, h: 64, title: 'MIC CH', sub: 'TO REC OFF', art: { kind: 'micch' }, extTap: 'mic' },
  { name: '24 channel', x: 140, y: 74, w: 84, h: 100, title: 'CH 1', sub: ['PHONO', '+12 dB'], art: { kind: 'channel' }, tap: 'ch1', reserve: ['PHONO', 'X-F A'] },
  { name: '24 mix', x: 240, y: 0, w: 42, h: 284, title: 'MIX', art: { kind: 'master' }, tap: 'bus' },
  { name: '24 recorder', x: 298, ...B24.ROW.rec, w: B24.OUT_W, title: 'RECORDER', sub: 'CLIPPING', art: { kind: 'recorder' }, extTap: 'recL', reserve: ['CLIPPING'] },
  { name: '24 PA', x: 298, ...B24.ROW.paL, w: B24.OUT_W, title: 'PA L', sub: 'NO CABLE', art: { kind: 'speaker' }, tap: 'masterL', reserve: ['CABLE'] },
  { name: '24 booth', x: 298, ...B24.ROW.bth, w: B24.OUT_W, title: 'BOOTH', sub: 'OFF', art: { kind: 'monitors' }, tap: 'booth' },
  { name: '24 phones', x: 298, ...B24.ROW.ph, w: B24.OUT_W, title: 'PHONES', art: { kind: 'phones' }, tap: 'phonesL' },
];

describe('screens 23 and 24 — every card shows its device, and it fills the card as you zoom', () => {
  for (const n of CARDS) {
    it(`${n.name}: words fit at 9 pt; the device keeps its shape, stays inside, and grows at 3×`, () => {
      const a = cardLayout(n, LM_1X, width);
      const z = cardLayout(n, LM_3X, width);
      for (const L of [a, z]) {
        assert.ok(L.fits, `${n.name}: words fit`);
        assert.ok(L.art, `${n.name}: has its device`);
        const t = TILE_SIZE[n.art!.kind];
        assert.ok(Math.abs(L.art!.w / L.art!.h - t.w / t.h) < 1e-6, 'the device is never stretched');
        assert.ok(L.art!.x >= n.x + 2.9 && L.art!.x + L.art!.w <= n.x + n.w + 0.01 && L.art!.y >= n.y + 2.9 && L.art!.y + L.art!.h <= n.y + n.h - 2.9, 'inside its card');
      }
      if (n.art!.kind !== 'wall') {
        const share = (L: typeof a) => (L.art!.w * L.art!.h) / (n.w * n.h);
        assert.ok(share(z) >= share(a) - 1e-9, `${n.name}: the device takes no less of the card at 3×`);
        assert.ok(share(z) >= 0.12, `${n.name}: at 3× the device fills a real part of the card (${share(z).toFixed(2)})`);
      }
    });
  }
});

/** Every pair of cords: parallel runs ≥ 10 apart, crossings counted. */
function audit(cords: CordGeo[]) {
  let crossings = 0;
  let gap = Infinity;
  for (let i = 0; i < cords.length; i++)
    for (let j = i + 1; j < cords.length; j++) {
      crossings += cordCrossings(cords[i].pts, cords[j].pts).length;
      gap = Math.min(gap, parallelGap(cords[i].pts, cords[j].pts));
    }
  return { crossings, gap };
}

describe('screen 23 — the power cords', () => {
  for (const charger of ['WALL', 'STRIP', 'NONE'] as const) {
    it(`DJ 2's charger on ${charger}: own lanes ≥ 10 apart, one hop at most, own patterns, plugs seated`, () => {
      const cords = board23Cords(charger);
      const { crossings, gap } = audit(cords);
      assert.ok(gap >= 10, `lane gap ${gap}`);
      assert.ok(crossings <= 1, `crossings ${crossings}`);
      assert.equal(new Set(cords.map((c) => c.pattern)).size, cords.length, 'every cord its own pattern');
      const sy = stripOutletY(B23.STRIP);
      const wallTop = wallOutlet({ ...B23.WALL, title: '' }, 'top');
      for (const c of cords) {
        const [ex, ey] = c.pts[c.pts.length - 1];
        const onStrip = ey === sy && Object.values(B23.OUT).includes(ex);
        const inWall = ex === wallTop[0] && ey === wallTop[1];
        assert.ok(onStrip || inWall, `${c.id} ends in an outlet`);
        if (inWall) assert.ok(c.flag, `${c.id}: off the strip, it carries its own flag`);
      }
    });
  }
  it('the outlets are named in order: DJ 2 left of DJ 1, so their cords never cross', () => {
    assert.ok(B23.OUT.lap2 < B23.OUT.lap1 && B23.OUT.lap1 < B23.OUT.mixer);
  });
});

describe('screen 24 — the seven power cords', () => {
  for (const wall of [false, true]) {
    it(`PA L on the ${wall ? 'wall' : 'strip'}: seven cords, own lanes ≥ 10 apart, no crossings, own patterns`, () => {
      const cords = board24Cords(wall);
      assert.equal(cords.length, 7);
      const { crossings, gap } = audit(cords);
      assert.ok(gap >= 10, `lane gap ${gap}`);
      assert.equal(crossings, 0);
      assert.equal(new Set(cords.map((c) => c.pattern)).size, 7, 'every cord its own pattern');
      const xs = cords.map((c) => c.pts[c.pts.length - 1][0]);
      for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) assert.ok(Math.abs(xs[i] - xs[j]) >= 10, 'outlets apart');
    });
  }
  it('the strip names every cord under its outlet in two staggered rows: neighbours in a row are ≥ 50 apart', () => {
    const named = Object.values(B24.OUT).sort((a, b) => a - b);
    for (let i = 2; i < named.length; i++) assert.ok(named[i] - named[i - 2] >= 50, `outlets ${named[i - 2]} and ${named[i]}`);
  });
  it('the wall plate sits beside PA L, clear of the output cards, its receptacle on PA L’s lane', () => {
    assert.ok(B24.WALL_AT.x >= B24.OUT_X + B24.OUT_W + 8);
    const [x] = wallOutlet({ ...B24.WALL_AT, w: WALL_PLATE.w, h: WALL_PLATE.h, title: '', bare: true }, 'bottom');
    assert.equal(x, B24.OUT.paL);
  });
});
