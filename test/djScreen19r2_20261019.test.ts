/**
 * DJ Systems Lab — Screen 19 regrade fixes, round 2 (2026-10-19): the mic
 * at true size against the combo jack, labels in clear air, the panel given
 * the space, and the room plan (shared with screen 20) with no device on
 * another. The art modules load Skia, so the drawing checks read the
 * sources (as the other DJ ratchets do); the plan's footprints are pure
 * (model/djRoom) and are measured directly.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOM, boothRow, footprintBox, footprintsOverlap, planFootprints, type Footprint, type Placement, type SubPlace } from '../src/screens/lab/dj/model/djRoom.ts';

const root = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'dj');
const gear = readFileSync(join(root, 'art', 'MicGear.tsx'), 'utf8');
const p19 = readFileSync(join(root, 'pages', 'p19Mic.tsx'), 'utf8');
const plan = readFileSync(join(root, 'art', 'PlanView.tsx'), 'utf8');

const num = (re: RegExp, s = gear): number => {
  const m = s.match(re);
  assert.ok(m, `found ${re}`);
  return Number(m![1]);
};

describe('Screen 19: the mic at true size, sized from the combo jack', () => {
  const jack1 = num(/mic1: \{ x: \d+, y: \d+, d: (\d+) \}/);
  const jack2 = num(/mic2: \{ x: \d+, y: \d+, d: (\d+) \}/);
  const tail = { DYNAMIC: num(/tail: \{ DYNAMIC: (\d+)/), CONDENSER: num(/tail: \{[^}]*CONDENSER: (\d+)/), WIRELESS: num(/tail: \{[^}]*WIRELESS: (\d+)/) };
  const R = { DYNAMIC: num(/grilleR: \{ DYNAMIC: (\d+)/), CONDENSER: num(/grilleR: \{[^}]*CONDENSER: (\d+)/), WIRELESS: num(/grilleR: \{[^}]*WIRELESS: (\d+)/) };
  it('both combo inputs are one part, about 24 mm across', () => {
    assert.equal(jack1, jack2);
    assert.ok(jack1 >= 23 && jack1 <= 25, `${jack1} mm`);
  });
  it('a wired handheld is 160–180 mm overall: about 7 jacks long, its grille about 2 jacks across', () => {
    for (const d of ['DYNAMIC', 'CONDENSER'] as const) {
      const overall = R[d] + tail[d];
      assert.ok(overall >= 160 && overall <= 180, `${d} ${overall} mm`);
      assert.ok(overall / jack1 >= 6.6 && overall / jack1 <= 7.5, `${d} ${(overall / jack1).toFixed(2)} jacks long`);
      assert.ok((2 * R[d]) / jack1 >= 1.85 && (2 * R[d]) / jack1 <= 2.15, `${d} grille ${((2 * R[d]) / jack1).toFixed(2)} jacks`);
    }
  });
  it('the wireless transmitter is a real handheld transmitter (220–260 mm), never the 250 mm wired mic of round 1', () => {
    const overall = R.WIRELESS + tail.WIRELESS;
    assert.ok(overall >= 220 && overall <= 260, `${overall} mm`);
  });
  it('the page draws the mic from MIC_TRUE at the panel’s own mm scale in BOTH views (no s= on it)', () => {
    const tag = p19.match(/<HandheldMic [^>]*\/>/);
    assert.ok(tag);
    assert.match(tag![0], /tail=\{tail\}/);
    assert.doesNotMatch(tag![0], /\bs=\{/);
    assert.match(p19, /const tail = MIC_TRUE\.tail\[m\.device\];/);
    assert.match(p19, /onMic\(d, MIC_TRUE\.tail\[d\] \+ MIC_PLUG_LEN\)/, 'the lead leaves the true tail');
  });
  it('the mic still lies on the table (resting on its ball and its tail)', () => {
    assert.match(p19, /y: st\.contactY - R, ang: Math\.asin\(\(R - TAIL_R\[d\]\) \/ REST\[d\]\)/);
    assert.match(p19, /<TableTop /);
  });
});

describe('Screen 19: labels in clear air, the panel given the space', () => {
  it('the receiver’s callout sits straight above its switch (no diagonal across the face)', () => {
    assert.match(p19, /id: 'rx', text: rxLines\.join\(': '\), lines: rxLines, at: swAt, dx: 0\.5,/);
    assert.doesNotMatch(p19, /antennas[^\n]*RX_H \+ 150/, 'the air above the receiver is not one big obstacle');
  });
  it('TALK OVER and MIC ON stand in rows straight above their keys', () => {
    assert.match(p19, /id: 'to', [^\n]*dx: 0, dy: above\(1, 1, toAt\.y\)/);
    assert.match(p19, /id: 'on', [^\n]*dx: 0, dy: above\(1, 0, onAt\.y\)/);
  });
  it('the meter scale and names are 10 pt, one name per row (never staggered)', () => {
    assert.match(p19, /function MeterScale[\s\S]*?useLabelMm\(10\)/);
    assert.match(p19, /function MeterNames[\s\S]*?useLabelMm\(10\)/);
    assert.doesNotMatch(p19, /i % 2 === 0 \? MET\.y/);
  });
  it('the meters fill the top-left as a horizontal block; the wired frame is cut to the panel and its sends label', () => {
    assert.match(p19, /<LedColumn x=\{0\} y=\{0\} w=\{M\.thick\} h=\{M\.len\}/);
    assert.match(p19, /rotate: Math\.PI \/ 2/);
    const w = num(/const w = wireless \? (\d+) : \d+;/, p19);
    const wired = num(/const w = wireless \? \d+ : (\d+);/, p19);
    assert.ok(wired <= 340, `wired frame ${wired} mm (was 390): the panel is drawn larger`);
    assert.ok(w <= 520, `wireless frame ${w} mm (was 630)`);
  });
});

/* ── the room plan ───────────────────────────────────────────────────── */

const PLACES: Placement[] = ['CORNERS', 'STRAIGHT', 'BEHIND'];
const SUBS: SubPlace[] = ['TOPS', 'BOOTH'];
/** pt per cm at 390 wide: screen 19's ROOM frame is 1040 cm across a 356 pt
 *  glass; screen 20's whole room 1440 cm (height-bound, about 0.2). */
const S19 = 356 / num(/const ROOM_FRAME: Box = \{ x: -?\d+, y: -?\d+, w: (\d+)/, p19);
const VIEWS = [
  { name: 'screen 19', ptPerCm: S19, minPt: 20, monitorCap: Infinity, turntable: false },
  { name: 'screen 20', ptPerCm: 0.2, minPt: 18, monitorCap: 1.6, turntable: true },
  { name: 'screen 20 (wider glass)', ptPerCm: 0.247, minPt: 18, monitorCap: 1.6, turntable: true },
];
const tableFp: Footprint = { id: 'table', kind: 'mixer', cx: (ROOM.table.x + ROOM.table.w / 2) * 100, cy: (ROOM.table.y + ROOM.table.d / 2) * 100, w: ROOM.table.w * 100, d: ROOM.table.d * 100, ang: 0 };

describe('the room plan: no device stands on another (screens 19 and 20)', () => {
  it('the turntable stands on the table beside deck B, not on it or over the edge (round-1 dev(-92, 45, 35))', () => {
    const row = boothRow(true);
    const t = ROOM.table;
    for (const f of row) {
      const b = footprintBox(f);
      assert.ok(b.x >= t.x * 100 && b.x + b.w <= (t.x + t.w) * 100, `${f.id} within the table's width`);
      assert.ok(b.y >= t.y * 100 && b.y + b.h <= (t.y + t.d) * 100, `${f.id} within the table's depth`);
    }
    for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) assert.ok(!footprintsOverlap(row[i], row[j]), `${row[i].id} × ${row[j].id}`);
    assert.doesNotMatch(plan, /dev\(-92, 45, 35/);
    assert.match(plan, /boothRow\(turntable\)\.map\(dev\)/);
  });
  for (const v of VIEWS) {
    it(`${v.name}: every drawn device clear of every other, and the speakers clear of the table`, () => {
      for (const place of PLACES) for (const subPos of SUBS) for (const subs of [false, true]) {
        const fps = planFootprints({ place, subPos, subs, monitors: true, turntable: v.turntable, ptPerCm: v.ptPerCm, minPt: v.minPt, monitorCap: v.monitorCap });
        for (let i = 0; i < fps.length; i++) {
          for (let j = i + 1; j < fps.length; j++) {
            const a = fps[i];
            const b = fps[j];
            if (a.stack === b.id || b.stack === a.id || a.under || b.under) continue; // a top on its sub's pole; a sub under the booth
            assert.ok(!footprintsOverlap(a, b), `${v.name} ${place}/${subPos}/${subs}: ${a.id} overlaps ${b.id}`);
          }
          const f = fps[i];
          if ((f.kind === 'top' || f.kind === 'monitor' || f.kind === 'sub') && !f.under) assert.ok(!footprintsOverlap(f, tableFp), `${v.name} ${place}: ${f.id} over the booth table`);
        }
      }
    });
  }
  it('screen 19 draws every speaker at least 20 pt across at 390 wide, and the page asks for it', () => {
    const fps = planFootprints({ place: 'CORNERS', subPos: 'TOPS', subs: false, monitors: true, turntable: false, ptPerCm: S19, minPt: 20, monitorCap: Infinity });
    for (const f of fps) if (f.kind === 'top' || f.kind === 'monitor') assert.ok(Math.max(f.w, f.d) * S19 >= 20 - 1e-6, `${f.id} ${(Math.max(f.w, f.d) * S19).toFixed(1)} pt`);
    assert.match(p19, /const ROOM_SYMBOL_PT = 20;/);
    assert.match(p19, /symbolPt: ROOM_SYMBOL_PT/);
    assert.match(p19, /planObstacles\(ev\.venue\.place, ev\.venue\.subPos, false, true, fitView\(ROOM_FRAME, w, h - LEGEND_H \* k, 6\)\.s, ROOM_SYMBOL_PT\)/);
  });
  it('the plan’s label obstacles are the DRAWN speakers (no name sits on a symbol) and the tripod feet', () => {
    assert.match(plan, /const fps = planFootprints\(/);
    assert.match(plan, /out\.push\(footprintBox\(f, 4\)\)/);
    assert.match(plan, /box\(t\.L\.at, TRIPOD_R_CM \+ 6\)/);
  });
});
