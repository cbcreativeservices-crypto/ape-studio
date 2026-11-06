/**
 * Lab 5 ensemble pages, gap pass G2 (S2, 2026-11-05). A control passes only if
 * the learner can SEE what it promises: on E04 Starting Setups, FROM ABOVE,
 * ONE MIC · CARDIOID against ONE MIC · OMNI changed nothing in the picture.
 *
 *   PLAN      one mic on a stand (and two back to back) shows its pickup shape
 *             from above on all three pages: setups, worked example, placement
 *   KEPT      a stereo pair, seen from above, stays without lobes, as before:
 *             at stage scale they would hide the capsules
 *   OMNI      a lone omni has no front, so it gets no amber aim line, and its
 *             circle is what replaces the heart
 *   AIMED     an omni in an array keeps its line: the words say it is aimed
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { ARRAYS, arrayCapsules, type ArrayPresetId } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { gain } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { v3 } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';

const dir = 'src/screens/lab/miking/lessons/shared/ensemble';
const read = (f: string) => readFileSync(join(process.cwd(), dir, f), 'utf8').replace(/\r\n/g, '\n');
const pages = read('ensemblePages.tsx');
const art = read('ArrayArt.tsx');
const ids = Object.keys(ARRAYS) as ArrayPresetId[];

/** The rule as ensemblePages.tsx states it, run against the real preset table. */
function patternFromAbove(id: ArrayPresetId): boolean {
  const m = /const patternFromAbove = \(id\?: ArrayPresetId\) => (.+);\n/.exec(pages);
  assert.ok(m, 'ensemblePages.tsx states the rule once, as patternFromAbove');
  return new Function('id', 'ARRAYS', `return ${m[1]};`)(id, ARRAYS) as boolean;
}

describe('one mic shows its pickup shape from above', () => {
  it('every single-mic rig and the back-to-back pair draw lobes in plan', () => {
    for (const id of ['one', 'oneOmni', 'oneFig8', 'b2b'] as const) assert.equal(patternFromAbove(id), true, id);
  });

  it('stereo pairs and trees keep the plan view they had', () => {
    const on = ids.filter(patternFromAbove).sort();
    assert.deepEqual(on, ['b2b', 'one', 'oneFig8', 'oneOmni']);
  });

  it('no page turns lobes off from above without asking the rule', () => {
    assert.ok(!/lobes=\{(view|wk\.view) !== 'plan'\}/.test(pages), 'a bare plan-off flag is the bug');
    const flags = pages.match(/lobes=\{[^}]*\}/g) ?? [];
    assert.equal(flags.length, 3);
    for (const f of flags) assert.match(f, /patternFromAbove\(/);
  });

  it('cardioid to omni is a different shape: a heart becomes a circle', () => {
    const at = (id: ArrayPresetId) => {
      const q = arrayCapsules(id, {}, { c: v3(0, 0, 0), face: 0, tilt: 0 })[0];
      const toward = (deg: number) => Math.abs(gain(q.pattern, deg));
      return { front: toward(0), side: toward(90), back: toward(180) };
    };
    const c = at('one');
    const o = at('oneOmni');
    assert.ok(c.front > 0.99 && c.back < 0.01, 'the heart has a null at the back');
    assert.ok(Math.abs(o.front - o.back) < 1e-9 && Math.abs(o.front - o.side) < 1e-9, 'the omni is a circle');
  });
});

describe('the aim line says where a mic points', () => {
  it('a lone omni has no aim line in the rig', () => {
    assert.match(art, /const aimP = make\(\);\n\s+for \(const q of caps\) \{\n\s+if \(soloOmni\(spec\.id, q\)\) continue;/);
    assert.match(art, /const soloOmni = \(id: ArrayPresetId, q: Capsule\) => ARRAYS\[id\]\.family === 'single' && q\.pattern === 'omni';/);
  });

  it('the rule picks the one rig that needs it and keeps the aimed omnis', () => {
    const solo = ids.filter((id) => ARRAYS[id].family === 'single' && arrayCapsules(id, {}, { c: v3(0, 0, 0) }).some((q) => q.pattern === 'omni'));
    assert.deepEqual(solo, ['oneOmni']);
    assert.equal(ARRAYS.ab.family, 'spaced');
    assert.equal(ARRAYS.tree.family, 'tree');
  });
});
