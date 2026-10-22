/**
 * Wiring fixes, round 8 — Miking + Mixing (owner go 2026-10-21). One ratchet
 * per finding:
 *
 *   R7-MIK-01  the electric pianos' plans draw their DI's cables: the tine
 *              piano's jack → DI → combo, the reed piano's AUX OUT → DI, the
 *              DI's XLR → TO STAGE BOX / TO WALL PANEL — own lanes, clear of
 *              every object and the keep-clear zone, none crossing another.
 *   R7-MIK-02  a word never sits across a zone's outline (clearOfFoots blocks
 *              each zone edge); a LEADER may still cross it.
 *   R7-MIK-03  the press box's isolated outputs are MALE XLR faces (shell
 *              ring, insert, three pins), not plain discs.
 *   R7-MIK-04  the clavinet's passive pickup → a DI or an instrument (Hi-Z)
 *              input; the DI's balanced mic-level output → a mic input.
 *   R7-MIX-01  TermsArt: the sends leave at the send knob, below the VCA row.
 *   R7-MIX-02  the depth vocabulary: a send-fed return runs 100 % wet.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { KEYS_BOX, KEYS_XLR_TO, keysAmpInput, keysCables, keysCue, keysDiJacks, keysFoots, keysKeep, keysOutJack, keysRoom, keyboardRect, type KeysRig, type KeysScene } from '../src/screens/lab/miking/lessons/shared/keys/keysPlanModel.ts';
import { keysCases } from '../src/screens/lab/miking/lessons/shared/planCases/keys.ts';
import { cueCables } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';
import { clearOfFoots, foot, segmentHitsRect, segmentsCross, type PlanCable } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { C12_LESSON } from '../src/screens/lab/miking/lessons/c12Clavinet/lesson.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const LESSON: Record<KeysRig, string> = { rhodes: 'I11a', wurli: 'I11b' };
const last = (k: PlanCable) => k.pts[k.pts.length - 1];

describe('R7-MIK-01: the electric pianos’ plans draw the DI’s cables', () => {
  for (const rig of ['rhodes', 'wurli'] as const) {
    for (const scene of ['stage', 'studio'] as const satisfies readonly KeysScene[]) {
      it(`${rig} ${scene}: the chain, end to end, each cable its own lane`, () => {
        const ks = keysCables(rig, scene);
        const by = (id: string) => ks.find((k) => k.id === id)!;
        const J = keysDiJacks(rig);
        if (rig === 'rhodes') {
          assert.deepEqual(ks.map((k) => k.id), ['keysOut', 'diThru', 'diXlr']);
          assert.deepEqual(by('keysOut').pts[0], keysOutJack('rhodes'), 'from the keyboard’s jack');
          assert.deepEqual(last(by('keysOut')), J.input, 'the keys go INTO the DI');
          assert.deepEqual(by('diThru').pts[0], J.thru);
          assert.deepEqual(last(by('diThru')), keysAmpInput(), 'the THRU feeds the combo’s input');
          assert.equal(by('diThru').to, 'amp');
        } else {
          assert.deepEqual(ks.map((k) => k.id), ['auxOut', 'diXlr']);
          assert.deepEqual(by('auxOut').pts[0], keysOutJack('wurli'), 'from the AUX OUT');
          assert.deepEqual(last(by('auxOut')), J.input, 'the AUX OUT goes INTO the DI');
          const kb = keyboardRect('wurli');
          const o = keysOutJack('wurli');
          assert.ok(o.u > kb.u0 && o.u < kb.u1 && o.v > kb.v0 && o.v < kb.v0 + 150, 'the AUX jack is under the case at the bass end');
        }
        const x = by('diXlr');
        assert.equal(x.kind, 'xlr');
        assert.deepEqual(x.pts[0], J.xlr);
        const end = last(x);
        if (scene === 'stage') assert.equal(end.u, KEYS_BOX[rig].stage.u0, 'upstage, off the plan (the stage box)');
        else {
          const R = keysRoom(rig);
          assert.ok([R.u0, R.u1].includes(end.u) || [R.v0, R.v1].includes(end.v), 'at a wall (the wall panel)');
        }
        assert.equal(KEYS_XLR_TO[scene], scene === 'stage' ? 'TO STAGE BOX' : 'TO WALL PANEL');
        // no two cables cross (the cue feed included, in the studio)
        const all = [...ks, ...(scene === 'studio' ? cueCables(keysCue(rig)) : [])];
        const bad: string[] = [];
        for (let a = 0; a < all.length; a++)
          for (let b = a + 1; b < all.length; b++)
            for (let i = 0; i + 1 < all[a].pts.length; i++)
              for (let j = 0; j + 1 < all[b].pts.length; j++) if (segmentsCross(all[a].pts[i], all[a].pts[i + 1], all[b].pts[j], all[b].pts[j + 1])) bad.push(`${all[a].id} × ${all[b].id}`);
        assert.deepEqual(bad, []);
        // none through an object or the keep-clear zone (but its own ends)
        const fs = keysFoots(rig, scene, lessonById(LESSON[rig])!.live.wedges);
        for (const k of ks)
          for (let i = 0; i + 1 < k.pts.length; i++)
            for (const f of fs) {
              if (f.id === k.from || f.id === k.to || (f.zone && f.kind !== 'keepClear')) continue;
              assert.ok(!segmentHitsRect(k.pts[i], k.pts[i + 1], f, 2), `${k.id} through ${f.id}`);
            }
        // and clear of the keep-clear zone's outline by more than a cable's
        // width (the tine piano's first leg lies on the instrument, from its
        // jack on the name rail just behind the keys)
        const K = keysKeep(rig);
        for (const k of ks) for (let i = k.from === 'keyboard' ? 1 : 0; i + 1 < k.pts.length; i++) assert.ok(!segmentHitsRect(k.pts[i], k.pts[i + 1], { u0: K.u0 - 40, u1: K.u1 + 40, v0: K.v0 - 40, v1: K.v1 + 40 }), `${k.id} hugs the keep-clear zone`);
      });
    }
  }
  it('the plan cases carry the cables (the collision test checks them)', () => {
    const cs = keysCases();
    assert.equal(cs.length, 4);
    for (const c of cs) assert.ok(c.cables.some((k) => k.kind === 'xlr'), `${c.lesson} ${c.scene}: no XLR`);
  });
  it('KeysPlan draws them, with the backline’s DI box, and names the XLR’s destination', () => {
    const s = read('src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx');
    assert.match(s, /keysCables\(rig, scene\)/);
    assert.match(s, /<PlanDiBox \/>/);
    assert.match(s, /KEYS_XLR_TO\[scene\]/);
    assert.match(s, /T\.cables\(\[\.\.\.cables, /);
  });
});

describe('R7-MIK-02: words are fully inside or fully outside a zone’s outline', () => {
  const zone = foot('keepClear', 'keepClear', { u0: 0, u1: 1000, v0: 0, v1: 1000 }, { zone: true });
  const c = clearOfFoots([zone]);
  it('a word across an edge is not clear', () => {
    assert.equal(c(900, 400, 1100, 480), false);
    assert.equal(c(400, -40, 600, 40), false);
    assert.equal(c(-100, 400, 5, 480), false, 'within the outline’s stroke');
  });
  it('a word fully inside or fully outside is clear', () => {
    assert.equal(c(300, 300, 600, 380), true);
    assert.equal(c(1100, 300, 1400, 380), true);
  });
  it('a leader may cross the outline (to a part inside the zone)', () => {
    assert.equal(c.leaders(900, 400, 1100, 480), true);
    const s = read('src/screens/lab/miking/engine/scene/StaticLabels.tsx');
    assert.match(s, /leaderClearOf\(clearOf\.leaders \?\? clearOf, xf\)/);
  });
});

describe('R7-MIK-03: the press box’s outputs are male XLR faces', () => {
  const s = read('src/screens/lab/miking/lessons/shared/broadcast/RoutingPanel.tsx');
  it('drawn by xlrMaleFace (shell ring, insert, three pins), never the female socket', () => {
    assert.match(s, /case 'pressBox':[\s\S]*?xlrMaleFace\(/);
    assert.doesNotMatch(s, /xlrFace\(/);
    assert.match(s, /setFillType\(FillType\.EvenOdd\)/, 'the shell is a ring, not a disc');
    const fn = s.slice(s.indexOf('function xlrMaleFace'), s.indexOf('function deviceArt'));
    assert.equal((fn.match(/\[-?0(\.\d+)?, -?0\.\d+\]/g) ?? []).length, 3, 'three pins');
  });
});

describe('R7-MIK-04: the clavinet’s passive pickup and the DI', () => {
  const s = read('src/screens/lab/miking/lessons/c12Clavinet/lesson.ts') + read('src/screens/lab/miking/lessons/c12Clavinet/copy.ts');
  it('a DI or an instrument (Hi-Z) input — never "line input"', () => {
    assert.doesNotMatch(s, /line input|line or instrument input|line or mic-level input/);
    assert.ok((s.match(/instrument \(Hi-Z\) input/g) ?? []).length >= 6);
  });
  it('the DI’s balanced mic-level output goes to a mic input', () => {
    const di = C12_LESSON.setting.items.find((i) => i.id === 'di')!;
    assert.match(di.note, /balanced mic-level output to a mic input/);
  });
  it('the quiz still marks an option it shows', () => {
    assert.match(s, /correct: 'A DI or an instrument \(Hi-Z\) input, never a mic input with phantom'/);
    assert.match(s, /options: \[[^\]]*'A DI or an instrument \(Hi-Z\) input, never a mic input with phantom'/);
  });
});

describe('R7-MIX-01 / R7-MIX-02: Mixing', () => {
  it('TermsArt: the sends leave at the send knob, under the VCA row (advArt Strip)', () => {
    const s = read('src/screens/lab/mixing/begArt.tsx');
    assert.match(s, /const sendY = chs\[0\]\.y \+ 5 \+ 15 \+ 6\.5;/);
    const a = read('src/screens/lab/mixing/advArt.tsx');
    assert.match(a, /let cy = y \+ 5;[\s\S]*?VCA \$\{p\.vca\}[\s\S]*?cy \+= 15;[\s\S]*?cy=\{cy \+ 6\.5\}/);
  });
  it('the depth vocabulary: a send-fed return runs 100 % wet', () => {
    assert.match(read('src/screens/lab/mixing/pagesC.tsx'), /On a send-fed return, set the reverb 100 % wet; the send sets how much room\./);
  });
});
