/**
 * DRUM LUGS of believable length and position, with their tension rods (owner
 * 2026-11-23, on the kit picture: "make the lugs on the drums longer, they
 * are usually not that short and immediate right below the drum rims").
 *
 * Drawing defaults, not maker figures: a tom or snare lug casing ≈ 45–65 mm,
 * a bass drum's ≈ 70–90 mm, its top at least 25 mm below the hoop; a deep
 * drum one row per head with bare shell between; a snare of ordinary depth one
 * double-ended casing spanning most of the shell. Every tension rod is drawn
 * from the hoop into its lug.
 *
 * And (same day): "show just a little bit more of the bass drum beater" — the
 * kit picture draws the beater part-way through its swing, its felt clear of
 * the nearer floor tom.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { FLOOR_16x16, KICK_22x18, SNARE_14x55, TOM_10x7, TOM_12x8, type DrumSpec } from '../src/screens/lab/miking/lessons/shared/drums/drumSpec.ts';
import { CONCERT_SNARE_14x65 } from '../src/screens/lab/miking/lessons/shared/drums/concertSpec.ts';
import { KICK_GEOM } from '../src/screens/lab/miking/lessons/m01Kick/geometry.ts';
import { KIT_DRUMS } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const DRUMS: [string, DrumSpec, 'tom' | 'snare' | 'kick'][] = [
  ['14 × 5.5 snare', SNARE_14x55, 'snare'],
  ['10 × 7 rack tom', TOM_10x7, 'tom'],
  ['12 × 8 rack tom', TOM_12x8, 'tom'],
  ['16 × 16 floor tom', FLOOR_16x16, 'tom'],
  ['22 × 18 kick', KICK_22x18, 'kick'],
  ['14 × 6½ concert snare', CONCERT_SNARE_14x65, 'snare'],
];

describe('lug casings: believable length and position (drawing defaults)', () => {
  for (const [name, s, kind] of DRUMS) {
    it(`${name}: the casing's length, set down from the hoop`, () => {
      const len = s.lug.len.mm;
      const D = s.depth.mm;
      if (s.lug.double) {
        // one double-ended casing spanning most of the shell between the hoops
        assert.ok(len >= 0.4 * D && Math.abs(len - (D - 2 * s.lug.inset.mm)) < 1e-9, `${len} of ${D}`);
      } else if (kind === 'kick') {
        assert.ok(len >= 70 && len <= 90, `${len}`);
      } else {
        assert.ok(len >= 45 && len <= 65, `${len}`);
      }
      // the top at least 25 mm below the hoop (the hoop runs `below` past the head)
      assert.ok(s.lug.inset.mm - s.hoop.below.mm >= 25, `top ${s.lug.inset.mm - s.hoop.below.mm} mm below the hoop`);
      if (!s.lug.double) assert.ok(2 * (s.lug.inset.mm + len) < D, 'one row per head, bare shell between');
      // a drawing default, said so
      assert.equal(s.lug.len.prov.kind, 'unknown');
      assert.equal(s.lug.inset.prov.kind, 'unknown');
    });
  }
  it('the kit-scene, M01 and concert bass drums use a bass drum’s casing', () => {
    assert.match(read('shared/kitScene/KitSceneArt.tsx'), /const LI = KICK_22x18\.lug\.inset\.mm;\n\s*const LL = KICK_22x18\.lug\.len\.mm;/);
    assert.match(read('m01Kick/art.tsx'), /const LUG = \{ inset: KICK_22x18\.lug\.inset\.mm, len: KICK_22x18\.lug\.len\.mm \};/);
    assert.match(read('m07aConcertBassDrum/art.tsx'), /rrect\(lugs, X\(-60\), sg \* R, X\(-140\), sg \* \(R \+ 26\), 10\);/);
  });
});

describe('tension rods run from the hoop into the lug', () => {
  const art = read('shared/drums/DrumArt.tsx');
  it('the cut-open drum: each rod from the hoop ear to its lug’s end', () => {
    assert.match(art, /if \(row\.rodTop\) seg\(rods, sgn \* rodX, -up \+ 2, sgn \* rodX, row\.y0 \+ 5\);/);
    assert.match(art, /if \(row\.rodBottom\) seg\(rods, sgn \* rodX, D \+ up - 2, sgn \* rodX, row\.y1 - 5\);/);
  });
  it('the drum seen whole: each rod from the hoop to its lug’s end', () => {
    assert.match(art, /if \(row\.rodTop\) seg\(rods, x, -up \+ 2, x, row\.y0 \+ 4\);/);
    assert.match(art, /if \(row\.rodBottom\) seg\(rods, x, D \+ up - 2, x, row\.y1 - 4\);/);
  });
  it('the kick from above, the kit kick, M01 and the concert bass drum: the T-rod ends in the lug', () => {
    assert.match(art, /seg\(rods, X\(-up - 6\), zr, X\(li \+ 6\), zr\);/);
    assert.match(read('shared/kitScene/KitSceneArt.tsx'), /seg\(rods, G\.hoopX\.batter\[1\] \+ 2, y, LI \+ 5, y\);/);
    assert.match(read('m01Kick/art.tsx'), /seg\(h\.rods, X\(outer - 10\), v\(rRod\), X\(LUG\.inset \+ 8\), v\(rRod\)\);/);
    assert.match(read('m07aConcertBassDrum/art.tsx'), /seg\(rods, X\(out \+ 9\), sg \* rr, X\(-66\), sg \* rr\);/);
  });
  it('a lug casing is a rounded, tapered body with a highlight, not a square nub', () => {
    assert.match(art, /export function lugCasing\(/);
    assert.match(art, /lugHi/);
  });
});

describe('the kick beater shows in the kit picture', () => {
  it('drawn part-way through its swing, its felt clear of the floor tom (side view)', async () => {
    const src = read('shared/kitScene/KitSceneArt.tsx');
    const m = src.match(/export const BEATER_PLAY = ([0-9.]+);/);
    assert.ok(m, 'BEATER_PLAY');
    const f = Number(m![1]);
    assert.ok(f > 0 && f < 1, 'between the strike and M01’s rest (inside the swing)');
    const b = KICK_GEOM.beater;
    const a = b.strikeAngle + (b.restAngle - b.strikeAngle) * f;
    const head = { x: b.axle.x + b.len * Math.cos(a), y: b.axle.y + b.len * Math.sin(a) };
    const fl = KIT_DRUMS.floor;
    const floorRight = fl.c.x + fl.spec.d.mm / 2 + 12; // shell + hoop
    assert.ok(head.x - b.headR > floorRight + 10, `felt at x ${head.x.toFixed(0)} (floor tom to ${floorRight.toFixed(0)})`);
    assert.ok(head.x + b.headR < KICK_GEOM.hoopX.batter[0], 'not through the kick’s hoop');
  });
});
