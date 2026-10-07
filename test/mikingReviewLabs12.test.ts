/**
 * Miking Labs 1–2 — the 2026-10-07 audio-engineer + learning-design review of
 * the restructured pages (docs/labs/reviews/REVIEW_2026_10_07_labs12.md).
 * Pinned here:
 *   • a complete kit's ONE MIC is one mic over the kit, not the kick mic;
 *   • a spaced overhead pair is drawn as a PAIR, never as two lone mics;
 *   • no TWO MICS role on a small hand-held / struck source whose lesson says
 *     one spot is usually enough (the second angle stays as ANOTHER START);
 *   • the rack-tom CLOSE · LIVE start is the clip-on; the djembe on the floor
 *     and the finger cymbals each have a farther view;
 *   • the cymbals' over-and-under pair is offered in every setup that has both;
 *   • pair titles: a named pair keeps its name; a shared "(…)" is said once;
 *   • the quick check never asks about the air-coupling step MEET IT leaves
 *     out, and a replacement item never repeats one the check already asks;
 *   • MEET IT / STARTING SETUPS name the kit, not a mic role.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { coreSetups, pairTitle, SETUP_PICKS, startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { pageOf, quickCheckOf, isRetired } from '../src/screens/lab/miking/engine/restructure.ts';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';

const L = (id: string): Lesson => lessonById(id)!;
const setups = (id: string, v: string) => startingSetups(L(id), v, MIC_TYPES);

describe('review labs 1–2: starting setups a working engineer would start from', () => {
  it('M11: ONE MIC is the whole-kit mic over the middle of the kit', () => {
    for (const v of ['studio', 'live']) {
      const s = setups('M11', v);
      assert.equal(s[0].role, 'one');
      assert.equal(s[0].mics[0].zoneId, 'oh.mono');
      const pair = s.find((x) => x.role === 'pair')!;
      assert.equal(pair.title, 'A kick mic and one overhead');
    }
  });
  it('M09: the spaced pair is one setup with two mics', () => {
    for (const v of ['studio', 'live']) {
      const s = setups('M09', v);
      const spaced = s.find((x) => x.title === 'A spaced pair over the kit');
      assert.ok(spaced, v);
      assert.equal(spaced!.mics.length, 2);
      assert.deepEqual(spaced!.mics.map((m) => m.zoneId).sort(), ['oh.ab.hat', 'oh.ab.ride']);
      // never a lone half of the pair
      assert.ok(!s.some((x) => x.mics.length === 1 && /^oh\.ab\./.test(x.mics[0].zoneId ?? '')), v);
    }
  });
  it('small hand percussion: no TWO MICS role; the other angle is still drawn', () => {
    for (const id of ['M08', 'I03a', 'I04', 'I05a', 'I05b', 'I05c', 'I05d', 'I10']) {
      assert.equal(SETUP_PICKS[id]?.pair, null, id);
      let drawn = 0;
      for (const v of L(id).model.variants) {
        const s = setups(id, v.id);
        assert.ok(!s.some((x) => x.role === 'pair'), `${id}/${v.id}`);
        drawn = Math.max(drawn, s.length);
      }
      assert.ok(drawn >= 2, id);
    }
    assert.ok(!setups('I06b', 'orchestral').some((x) => x.mics.length > 1));
  });
  it('the close and the farther roles where the lesson words give them', () => {
    assert.equal(setups('M03', 'rack').find((x) => x.role === 'close')!.mics[0].zoneId, 'tom2.clip');
    assert.equal(setups('M05', 'floor').find((x) => x.role === 'distant')!.mics[0].zoneId, 'dj.top.far');
    assert.equal(coreSetups(setups('M05', 'floor')).length, 2);
    assert.equal(setups('I06b', 'orchestral').find((x) => x.role === 'distant')!.mics[0].zoneId, 'fc.B');
    assert.equal(setups('I06b', 'dance').find((x) => x.role === 'distant')!.mics[0].zoneId, 'fc.far');
    assert.equal(setups('I10', 'pedal').find((x) => x.role === 'close')!.mics[0].zoneId, 'gl.near');
  });
  it('cymbals: the over-and-under pair is offered in both setups', () => {
    for (const [id, vs] of [['I01a', ['closed', 'open']], ['I01c', ['crash1', 'crash2']], ['I01e', ['upright', 'inverted']]] as const) {
      for (const v of vs) assert.ok(setups(id, v).some((x) => x.role === 'pair'), `${id}/${v}`);
    }
  });
  it('pair titles: a named pair keeps its name; a shared "(…)" is said once', () => {
    assert.equal(setups('I07', 'motor').find((x) => x.role === 'pair')!.title, 'A spaced pair over the keyboard');
    assert.equal(pairTitle('Just below the top edge (rear port)', 'Behind the box (rear port)'), 'Just below the top edge + behind the box (rear port)');
    assert.equal(pairTitle('Over the rim', 'Below it'), 'Over the rim + below it');
    for (const id of ['I02', 'I03b']) {
      for (const v of L(id).model.variants) {
        const p = setups(id, v.id).find((x) => x.role === 'pair');
        if (p) assert.equal((p.title.match(/\(/g) ?? []).length <= 1, true, p.title);
      }
    }
  });
});

describe('review labs 1–2: the quick check and the page words', () => {
  it('no quick-check item on the air-coupling step MEET IT leaves out', () => {
    for (const [id, item] of [['M01', 'q.4'], ['M03', 'q.4'], ['M07a', 'cbd.q.3'], ['M07b', 'cs.q.4'], ['M07a', 'cbd.snd.1']] as const) {
      assert.ok(isRetired(id, item), `${id} ${item}`);
    }
    for (const id of ['M01', 'M03', 'M07a', 'M07b']) {
      for (const d of quickCheckOf(L(id))) assert.ok(!/air inside do to|coupled/i.test(d.prompt + d.options.join(' ')), `${id}: ${d.prompt}`);
    }
  });
  it('a replacement item never repeats an idea the check already asks', () => {
    const ids = (id: string) => quickCheckOf(L(id)).map((d) => d.id);
    assert.ok(!ids('M02').includes('qc.sn.snd.1'));
    assert.ok(!ids('I11b').includes('qc.wu.snd.2'));
    assert.ok(!ids('M07a').includes('qc.cbd.snd.2'));
  });
  it('MEET IT and STARTING SETUPS name the drum kit for the kit-level lessons', () => {
    for (const id of ['M09', 'M10', 'M11']) {
      assert.match(pageOf(L(id), 'meet').goal, /^Meet the drum kit /);
      assert.match(pageOf(L(id), 'setups').goal, /on the drum kit,/);
    }
    assert.match(pageOf(L('M01'), 'meet').goal, /^Meet the kick /);
  });
  it('timbales clip-on line is plain words', () => {
    const z = L('M04c').zones.find((q) => q.id === 'tb.clip.large')!;
    assert.ok(!/confirms the count/.test(z.tendency));
  });
});
