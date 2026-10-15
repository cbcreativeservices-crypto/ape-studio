/**
 * Sound Systems hold items (2026-10-14).
 *
 *  A. "Redraw only the station that changed" — on Learn page 1 a STATION
 *     fader step re-rendered the whole SystemMap (~200 SVG elements, a gear
 *     glyph and its gradients per card) and took 1.5–2.5 s on the emulator.
 *     The map is now a memoised STATIC layer (backplate, columns, cables)
 *     plus memoised per-station CARDS whose props are primitives + a
 *     `selected` boolean, so a step re-renders the old and the new card only.
 *  B. HOLD #7 — the console's dB faders use a mixing-console taper (unity
 *     ~75 % up, +10 at the top, the scale closing up toward OFF), not a
 *     linear-in-dB lane.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const { CONSOLE_TAPER, dbToPos, faderKnots, posToDb, posToDbSnapped } = await import('../src/features/soundsystems/faderTaper.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/** Every fader range the console dock uses (pagesRoute / pagesOperate). */
const RANGES: [number, number][] = [
  [-60, 10],
  [-60, 6],
  [-30, 6],
];

describe('HOLD #7 — console-fader taper', () => {
  it('a full-range fader (−60 OFF … +10) sits on the reference scale', () => {
    const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
    near(dbToPos(10, -60, 10), 1);
    near(dbToPos(0, -60, 10), 0.75);
    near(dbToPos(-10, -60, 10), 0.55);
    near(dbToPos(-20, -60, 10), 0.4);
    near(dbToPos(-30, -60, 10), 0.28);
    near(dbToPos(-40, -60, 10), 0.18);
    // −60 is the engine's OFF floor (−∞) — the bottom of the travel.
    near(dbToPos(-60, -60, 10), 0);
  });

  it('the reference scale is the one asked for', () => {
    const m = new Map(CONSOLE_TAPER.map(([d, p]) => [d, p]));
    assert.equal(m.get(10), 1);
    assert.equal(m.get(0), 0.75);
    assert.equal(m.get(-10), 0.55);
    assert.equal(m.get(-20), 0.4);
    assert.equal(m.get(-30), 0.28);
    assert.equal(m.get(-40), 0.18);
    assert.equal(m.get(-60), 0.08);
  });

  it('below the OFF floor a wider fader still puts −60 near 8 %', () => {
    assert.ok(Math.abs(dbToPos(-60, -90, 10) - 0.08) < 1e-9);
    assert.equal(dbToPos(-90, -90, 10), 0);
  });

  for (const [min, max] of RANGES) {
    it(`[${min}, ${max}]: min at 0, max at 1, strictly monotonic, exact round trip`, () => {
      assert.equal(dbToPos(min, min, max), 0);
      assert.equal(dbToPos(max, min, max), 1);
      assert.equal(posToDb(0, min, max), min);
      assert.equal(posToDb(1, min, max), max);
      // clamped outside the range (a send parked at −90 reads the bottom)
      assert.equal(dbToPos(min - 30, min, max), 0);
      assert.equal(dbToPos(max + 5, min, max), 1);
      let prev = -1;
      for (let d = min; d <= max; d += 0.25) {
        const p = dbToPos(d, min, max);
        assert.ok(p > prev, `dbToPos not increasing at ${d}`);
        prev = p;
        assert.ok(Math.abs(posToDb(p, min, max) - d) < 1e-9, `round trip ${d}`);
      }
      let prevDb = -Infinity;
      for (let i = 0; i <= 1000; i++) {
        const p = i / 1000;
        const d = posToDb(p, min, max);
        assert.ok(d > prevDb, `posToDb not increasing at ${p}`);
        prevDb = d;
        assert.ok(Math.abs(dbToPos(d, min, max) - p) < 1e-9, `inverse round trip ${p}`);
      }
      // every whole dB is reachable through the 1 dB snap, and lands on itself
      for (let d = min; d <= max; d++) assert.equal(posToDbSnapped(dbToPos(d, min, max), min, max), d);
      // knots ascend in both columns
      const k = faderKnots(min, max);
      for (let i = 1; i < k.length; i++) assert.ok(k[i][0] > k[i - 1][0] && k[i][1] > k[i - 1][1]);
    });
  }

  it('unity sits about three quarters up on every console range', () => {
    for (const [min, max] of RANGES) {
      const u = dbToPos(0, min, max);
      assert.ok(u >= 0.72 && u <= 0.86, `[${min}, ${max}] unity at ${u}`);
    }
  });

  it('dbFader maps through the taper (value, snap, home) — not the linear lane', () => {
    const s = read('src/screens/lab/soundsystems/consoleDock.tsx');
    assert.match(s, /from '\.\.\/\.\.\/\.\.\/features\/soundsystems\/faderTaper'/);
    assert.match(s, /const snap = \(p: number\) => posToDbSnapped\(p, opts\.min, opts\.max, 1\)/);
    assert.match(s, /value: dbToPos\(opts\.db, opts\.min, opts\.max\)/);
    assert.match(s, /home: opts\.home != null \? dbToPos\(opts\.home, opts\.min, opts\.max\) : undefined/);
    assert.doesNotMatch(s, /lanePos|laneVal/);
  });
});

describe('SystemMap — redraw only the station that changed', () => {
  const s = read('src/screens/lab/soundsystems/art/SystemMap.tsx');

  it('the static layer (backplate, columns, cables) is React.memo with a value comparator', () => {
    assert.match(s, /const MapStatic = memo\(/);
    assert.match(s, /samePlacement\(p\.nodes, q\.nodes\) && sameEdges\(p\.edges, q\.edges\)/);
    assert.match(s, /<MapStatic nodes=\{nodes\} edges=\{edges\}/);
  });

  it('each station card is React.memo on primitives + a selected boolean', () => {
    assert.match(s, /const MapCard = memo\(/);
    assert.match(s, /selected=\{selectedId === n\.id\}/);
    assert.match(s, /p\.selected === q\.selected && p\.tagText === q\.tagText && p\.tagColor === q\.tagColor/);
    assert.match(s, /sameNode\(p\.node, q\.node\)/);
  });

  it('the cards get one stable tap handler and a memoised feed-tag map', () => {
    assert.match(s, /const stableTap = useCallback\(\(id: string\) => tapRef\.current\?\.\(id\), \[\]\)/);
    assert.match(s, /onTap=\{onTap \? stableTap : undefined\}/);
    assert.match(s, /const feedTag = useMemo\(/);
    assert.match(s, /const DEFAULT_COLS/);
  });

  it('the LED programme animation is untouched (UI-thread shared value)', () => {
    assert.match(s, /const programme = useProgrammeLevel\(running\);/);
    assert.match(s, /<Led x=\{bx\.x0 \+ 1\} y=\{bx\.y0 \+ 1\} state=\{state\} dark=\{!!n\.dark\} programme=\{programme\} \/>/);
  });

  it('SystemMap itself is memoised', () => {
    assert.match(s, /export const SystemMap = memo\(function SystemMap/);
  });

  it('Learn page 1 hands the map a stable onTap and memoised dock params', () => {
    const a = read('src/screens/lab/soundsystems/pagesLearnA.tsx');
    assert.match(a, /const tap = useCallback\(\(id: string\) => \{/);
    assert.match(a, /setSeen\(\(s\) => \(s\.has\(id\) \? s : new Set\(s\)\.add\(id\)\)\)/);
    assert.match(a, /const params = useMemo<DockParam\[\]>\(\(\) => \[/);
    assert.match(a, /\], \[map\.nodes, sel, v, tap, set\]\);/);
  });
});
