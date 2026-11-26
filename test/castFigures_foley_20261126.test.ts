/**
 * CAST FIGURES — the Foley area (F01–F16), sweep of 2026-11-26. Every person in
 * the area is already a cast member; this sweep fixed the performer from above:
 *   • the walker (F01) mid-stride, and F02's wearer walking in place, show
 *     their legs from above — the forward shoe
 *     ahead of the chest, the back one behind it, as its side view's stride;
 *   • a performer bent over a table (F03 paper, F04 block, pour and brush)
 *     shows the back running down from the shoulders to the waist, and the
 *     seat and shoes behind it, from above — not upright shoulders alone;
 *   • an upright performer (F03 keys, door, chair; F05) keeps the approved
 *     standing look from above (the legs under the shoulders).
 * Nothing moved: the bodies, the props, the labels and every measured point are
 * as they were (the plan's arms and hands untouched).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const FV = await import('../src/screens/lab/miking/lessons/shared/foley/foleyV2.ts');
const F01G = await import('../src/screens/lab/miking/lessons/f01Footsteps/geometry.ts');
const F02G = await import('../src/screens/lab/miking/lessons/f02Clothing/geometry.ts');
const F03G = await import('../src/screens/lab/miking/lessons/f03Props/geometry.ts');
const F04G = await import('../src/screens/lab/miking/lessons/f04Impacts/geometry.ts');
const F05G = await import('../src/screens/lab/miking/lessons/f05Perspective/geometry.ts');

const L = 'src/screens/lab/miking/lessons/';

describe('cast figures — Foley (2026-11-26)', () => {
  it('the legs show from above only where the side view shows a stride or a bend', () => {
    assert.equal(FV.legsFromAbove(F01G.WALKER), true, 'the walker mid-stride');
    for (const v of ['paper']) assert.equal(FV.legsFromAbove(F03G.bodyOf(v)), true, `F03 ${v}`);
    for (const v of ['impact', 'water', 'texture']) assert.equal(FV.legsFromAbove(F04G.bodyOf(v)), true, `F04 ${v}`);
    for (const v of ['keys', 'door', 'chair', 'live']) assert.equal(FV.legsFromAbove(F03G.bodyOf(v)), false, `F03 ${v} stands upright`);
    assert.equal(FV.legsFromAbove(F05G.ARTIST), false, 'F05 stands upright');
  });

  it('a performer bent over the table shows the back down to the waist from above', () => {
    const b = F03G.bodyOf('paper');
    const plan = FV.foleyTopPlan(b, FV.PROPS_HOLD.paper);
    const hipX = (b.hipR.x + b.hipL.x) / 2;
    const backmost = Math.min(...plan.torso.map((p: { u: number }) => p.u));
    // (the shoulders lean ≈ 260 mm ahead of the hips; the shirt now reaches back to the waist over them)
    assert.ok(backmost <= hipX + 40, `the back reaches the waist (${backmost.toFixed(0)} vs hips ${hipX.toFixed(0)})`);
    // the upright performer's shoulders are unchanged
    const k = FV.foleyTopPlan(F03G.bodyOf('keys'), FV.PROPS_HOLD.keys);
    const kb = F03G.bodyOf('keys');
    assert.ok(Math.min(...k.torso.map((p: { u: number }) => p.u)) > (kb.hipR.x + kb.hipL.x) / 2 - 200, 'the upright slab as before');
  });

  it('the lessons draw the legs from above at their call sites', () => {
    assert.match(read(`${L}f01Footsteps/art.tsx`), /<PlayerTopV2 plan=\{walkerTop\(\)\} who=\{FOLEY_PERFORMER\} bareArms legs \/>/);
    // (the legs drawn before the table — a toe under its edge stays under the top — the upper body after the props)
    for (const f of ['f03Props', 'f04Impacts']) {
      const src = read(`${L}${f}/art.tsx`);
      const legs = src.indexOf('{legsFromAbove(bodyOf(variant)) ? <PlayerTopV2 plan={topOf(variant)} who={FOLEY_PERFORMER} part="legs" legs /> : null}');
      const table = src.indexOf('<TableArt view="top"', legs);
      const upper = src.indexOf('part="upper"', table);
      assert.ok(legs > 0 && table > legs && upper > table, `${f}: legs, then the table, then the upper body`);
    }
    // F02 worn (walking in place): the plan's own legs under the figure from above
    assert.match(read(`${L}f02Clothing/clothingV2.tsx`), /<DrummerTopLegsV2 plan=\{personTopPlan\(WORN_TOP_POSE, WEARER_WHO, \{ jacket: true \}\)\} \/>\s*<\/FigureLook>\s*<PersonTopV2 pose=\{WORN_TOP_POSE\}/);
    assert.equal(FV.legsFromAbove(F02G.WEARER), true, 'F02 walking in place');
  });
});
