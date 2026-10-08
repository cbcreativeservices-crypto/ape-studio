/**
 * Owner decisions X1–X6 (2026-10-08), applied across the Miking labs — locks.
 *   X1 one distance rule: long distances round on the scaled tier, feet ≥ 3 m
 *   X2 "suggest", never "we recommend you begin", in learner text
 *   X3 short dock / bezel word values; the full word stays in a11y
 *   X4 STARTING SETUPS: "Each one is drawn where the mic goes"
 *   X5 polarityDelay / hearingDiag: one distractor reworded, keys unchanged
 *   X6 label pass: no crossing leaders in the level-of-detail layout
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fmtLen, fmtLenScaled, fmtSigned } from '../src/screens/lab/miking/engine/model/units.ts';
import { dockShort } from '../src/screens/lab/miking/engine/rack/dockWords.ts';
import { polarityDelay, hearingDiag } from '../src/screens/lab/miking/lessons/shared/bowed/bowedItems.ts';
import { segsCross, segHitsRect } from '../src/screens/lab/miking/engine/scene/labelLayout.ts';

const MIKING = join(import.meta.dirname, '../src/screens/lab/miking');
const files = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : []; });
const ALL = files(MIKING).map((p) => [p, readFileSync(p, 'utf8')] as const);

describe('X1 — one distance rule', () => {
  it('short distances keep 5 mm and inches', () => {
    assert.equal(fmtLen(62), '≈ 6 cm (2.4 in)');
    assert.equal(fmtLen(65), '≈ 6.5 cm (2.6 in)');
  });
  it('a metre and more rounds on the scaled tier; feet from 3 m', () => {
    assert.equal(fmtLen(1240), '≈ 1.25 m (49 in)');
    assert.equal(fmtLen(2990), '≈ 3 m (9.8 ft)');
    assert.equal(fmtLen(4565), '≈ 4.55 m (14.9 ft)');
    assert.equal(fmtLen(7810), '≈ 7.8 m (25.6 ft)');
    assert.equal(fmtLen(10005), '≈ 10 m (33 ft)');
    assert.equal(fmtLen(35049), '≈ 35 m (115 ft)');
    assert.equal(fmtSigned(-10005, 'in', 'out'), '≈ 10 m (33 ft) out');
  });
  it('no long distance claims millimetres or prints hundreds of inches', () => {
    for (let mm = 1000; mm < 120000; mm += 137) {
      const s = fmtLen(mm);
      assert.doesNotMatch(s, /\.\d{3} m/, s);
      if (mm >= 3100) assert.match(s, / ft\)$/, s);
    }
  });
  it('fmtLenScaled is the same rule', () => {
    for (const mm of [40, 864, 1376, 9999, 42000]) assert.equal(fmtLenScaled(mm), fmtLen(mm));
  });
});

describe('X2 — "suggest" in the starting-points sense', () => {
  it('no "we recommend you begin" and no "recommended starting point" in the Miking source', () => {
    for (const [p, s] of ALL) {
      assert.doesNotMatch(s, /we recommend you begin/i, p);
      assert.doesNotMatch(s, /recommended starting/i, p);
    }
  });
});

describe('X3 — short dock words, full words read aloud', () => {
  it('the owner’s short forms', () => {
    assert.equal(dockShort('SUPERCARDIOID'), 'SUPER');
    assert.equal(dockShort('SUPERCARDI'), 'SUPER');
    assert.equal(dockShort('CARDIOID'), 'CARD');
    assert.equal(dockShort('FIGURE-8'), 'FIG-8');
    assert.equal(dockShort('HYPERCARDIOID'), 'HYPER');
    assert.equal(dockShort('IN ZONE'), 'IN');
    assert.equal(dockShort('FRONT–BACK'), 'FRONT');
    assert.equal(dockShort('THE CONGA'), 'CONGA');
    assert.equal(dockShort('DYN · CARD'), 'DYN·CARD');
  });
  it('numbers are never shortened', () => {
    for (const v of ['≈ 25 cm', '≈ 1.28 kHz', '≈ 0°', '1 / 6', '−3.0 dB']) assert.equal(dockShort(v), v);
  });
  it('MikingRack applies it once and keeps the full word for accessibility', () => {
    const rack = readFileSync(join(MIKING, 'engine/rack/MikingRack.tsx'), 'utf8');
    assert.match(rack, /params=\{shortDockParams\(spec\.params\)\}/);
    assert.match(rack, /bezel: shortBezel\(spec\.bezel\)/);
    assert.match(rack, /valueA11y: p\.valueA11y \?\? p\.valueLabel/);
    const unit = readFileSync(join(import.meta.dirname, '../src/screens/lab/rack/RackUnit.tsx'), 'utf8');
    assert.match(unit, /p\.valueA11y \?\? p\.valueLabel/);
    const bezel = readFileSync(join(import.meta.dirname, '../src/screens/lab/rack/BezelReadouts.tsx'), 'utf8');
    assert.match(bezel, /it\.vA11y \?\? it\.v/);
  });
});

describe('X4 — STARTING SETUPS prompt', () => {
  it('drawn where the mic goes', () => {
    const s = readFileSync(join(MIKING, 'pages/PSetups.tsx'), 'utf8');
    assert.match(s, /Each one is drawn where the mic goes/);
    assert.doesNotMatch(s, /drawn on the instrument:/);
  });
});

describe('X5 — the shared items lose the R14 pattern', () => {
  const opening = (s: string) => s.split(/[\s:—,]/)[0];
  for (const it2 of [polarityDelay('x'), hearingDiag('x', { noun: 'voice', moving: 'the hands' } as never)]) {
    it(`${it2.prompt.slice(0, 40)}…: the two wrong answers no longer share an opening`, () => {
      const wrong = it2.options.filter((o) => o !== it2.correct);
      assert.equal(wrong.length, 2);
      assert.notEqual(opening(wrong[0]), opening(wrong[1]));
      for (const w of wrong) assert.ok(it2.why[w], `why for ${w}`);
    });
  }
  it('keys unchanged', () => {
    assert.equal(polarityDelay('x').correct, 'Nothing: polarity flips the sign; the delay stays the same');
    assert.equal(hearingDiag('x', { noun: 'voice', moving: '' } as never).correct, 'Nothing — that is the mic’s distortion limit, not a hearing limit');
  });
  it('no lesson keeps the old polarity distractor (lesson-own hearing items with their own nouns are left as written)', () => {
    for (const [p, s] of ALL) assert.doesNotMatch(s, /It doubles, because the inverted copy/, p);
  });
});

describe('X6 — leaders never cross', () => {
  it('segment helpers', () => {
    assert.equal(segsCross({ x1: 0, y1: 0, x2: 10, y2: 10 }, { x1: 0, y1: 10, x2: 10, y2: 0 }), true);
    assert.equal(segsCross({ x1: 0, y1: 0, x2: 10, y2: 0 }, { x1: 0, y1: 5, x2: 10, y2: 5 }), false);
    assert.equal(segHitsRect({ x1: 0, y1: 5, x2: 20, y2: 5 }, { x0: 8, x1: 12, y0: 0, y1: 10 }), true);
  });
  it('the named labels moved (F12 AIR UNIT, F13 SEATS, B11 PERIMETER BOOM) and venue labels point at their part', () => {
    assert.match(readFileSync(join(MIKING, 'lessons/f12SoundLevel/art.tsx'), 'utf8'), /text: 'AIR UNIT', u: 1400, v: -2650/);
    assert.match(readFileSync(join(MIKING, 'lessons/f13RoomAcoustics/art.tsx'), 'utf8'), /text: 'SEATS', u: 5650, v: F13_FLOOR - 2400/);
    assert.match(readFileSync(join(MIKING, 'lessons/b11Athletes/scene.tsx'), 'utf8'), /'PERIMETER BOOM', short: 'BOOM', u: OPERATOR\.feet\.x, v: -700/);
    assert.match(readFileSync(join(MIKING, 'lessons/shared/sports/sportsArt.tsx'), 'utf8'), /point: planUV\(m\.p\)/);
  });
});
