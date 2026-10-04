/**
 * Miking — the M01 art pass (2026-10-04): what the drawing may and may not do.
 *
 *   • the hardware drawn in each cutaway comes from the model's rod angles:
 *     exactly the rods at the cut's silhouette, 2 per head per view (top and
 *     bottom in the side view, both sides in plan), never invented ones; the
 *     sourced COUNT is said in a label;
 *   • labels never overlap at the fit scale: a collision falls back to the
 *     short words, else drops the later label; a shortened ILLUSTRATIVE label
 *     keeps its ILLUSTRATIVE tag;
 *   • the static art builds its paths ONCE (module cache), not per render;
 *     no beater patch and no brand mark is drawn (neither is sourced);
 *   • a surface mic starts ON its surface (page 5's plate used to float).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { KICK_DIMS } from '../src/screens/lab/miking/lessons/m01Kick/model.ts';
import { KICK_GEOM, silhouetteRods } from '../src/screens/lab/miking/lessons/m01Kick/geometry.ts';
import { fitLabels, labelWidth } from '../src/screens/lab/miking/engine/scene/labelLayout.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const ART = read('src/screens/lab/miking/lessons/m01Kick/art.tsx');

describe('cutaway hardware comes from the model', () => {
  it('the sourced count is 10 per head, 36° apart', () => {
    assert.equal(KICK_DIMS.nRods.mm, 10);
    assert.equal(KICK_GEOM.rodAngles.length, 10);
  });
  for (const view of ['side', 'top'] as const) {
    it(`${view} view: exactly the 2 silhouette rods, one each side, from rodAngles`, () => {
      const rods = silhouetteRods(view);
      assert.equal(rods.length, 2);
      assert.deepEqual(rods.map((r) => r.sgn).sort(), [-1, 1]);
      for (const r of rods) assert.ok(KICK_GEOM.rodAngles.includes(r.phi));
      // Never a rod the cut removed: side keeps z ≤ 0, plan keeps y ≥ 0.
      for (const r of rods) {
        const a = (r.phi * Math.PI) / 180;
        if (view === 'side') assert.ok(Math.sin(a) <= 0.02);
        else assert.ok(Math.cos(a) >= -0.02);
      }
    });
  }
  it('the art states the count in words and marks it to confirm', () => {
    assert.match(ART, /'10 RODS PER HEAD · TO CONFIRM'/);
  });
});

describe('scene labels never overlap', () => {
  const xf = { view: 'side' as const, s: 0.2, ox: 100, oy: 100 };
  it('a colliding label falls back to its short form, else is dropped', () => {
    const out = fitLabels(
      [
        { u: 0, v: 0, text: 'BATTER HEAD', short: 'BATTER', align: 'right' as const },
        { u: 200, v: 0, text: 'FRONT HEAD (PORTED)', short: 'FRONT', align: 'right' as const },
        { u: 0, v: 0, text: 'ON TOP OF BATTER', align: 'center' as const },
        { u: 0, v: 400, text: 'FAR AWAY', align: 'center' as const },
      ],
      xf,
      1,
      400,
    );
    assert.deepEqual(
      out.map((l) => l.text),
      ['BATTER HEAD', 'FRONT', 'FAR AWAY'],
    );
  });
  it('labels that do not collide are all kept, in order', () => {
    const ls = [0, 200, 400].map((v) => ({ u: 0, v, text: `L${v}`, align: 'center' as const }));
    assert.deepEqual(fitLabels(ls, xf, 1, 400), ls);
  });
  it('a label is never wider than the canvas', () => {
    assert.ok(labelWidth('X'.repeat(200), 1.4, 300) <= 296);
  });
  it('every shortened ILLUSTRATIVE label keeps its tag', () => {
    for (const m of ART.matchAll(/text: '([^']*ILLUSTRATIVE[^']*)', short: '([^']*)'/g)) assert.match(m[2], /ILLUS/, `${m[1]} → ${m[2]}`);
  });
});

describe('the static art', () => {
  const body = ART.slice(ART.indexOf('export function KickArt('), ART.indexOf('function SidePedal('));
  it('builds its paths once per view, never during a render', () => {
    assert.match(ART, /built\[view\] \?\?=/);
    assert.ok(!/make\(\)|Skia\.Path\.Make\(\)/.test(body), 'KickArt must not allocate paths');
  });
  it('draws no beater patch and no brand mark (neither is sourced)', () => {
    const drawn = ART.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.ok(!/patch/i.test(drawn));
    assert.ok(!/(shure|sennheiser|akg|dpa|yamaha|tama|remo|pearl|evans)/i.test(drawn));
  });
  it('a surface mic starts on its surface', () => {
    assert.match(read('src/screens/lab/miking/engine/scene/useRig.ts'), /pinToSurface\(m\.pose, pn\.top/);
  });
});
