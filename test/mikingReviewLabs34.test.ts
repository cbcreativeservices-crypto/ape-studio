/**
 * Miking Labs 3 and 4 (Aerophones A*, Chordophones C*) — the audio-engineer
 * and learning review of 2026-10-07 on the restructured pages
 * (docs/labs/reviews/REVIEW_2026_10_07_labs34.md). Pinned here:
 *
 *   • every mic of every STARTING SETUP — a pair's too — is a type its zone
 *     takes (the upright bass pair drew a pencil condenser on a stand where
 *     its zone's miniature clips under the strings);
 *   • a starting point that IS a pair is drawn with both mics: the upright
 *     piano's split pair (TWO MICS), the grands' stereo pair (17 cm apart,
 *     110° between the axes) as ANOTHER START, the lever harp's upper and
 *     lower spots, the low-C bass clarinet's pair;
 *   • the drawn first mic is the one a working engineer starts with: a large
 *     condenser about 60 cm over a tuba's or euphonium's bell, a small
 *     condenser for the flugelhorn's farther studio start, a dynamic where
 *     the accordion card says "a dynamic";
 *   • an amp's other close spots at the grille are tone choices, not a
 *     "CLOSE · LIVE" setup; the bass amp's farther mic is drawn as the
 *     second mic it is;
 *   • the quick check never asks one idea twice when the lesson has another
 *     foundation check to offer.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { coreSetups, startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { quickCheckOf, sameQuestion } from '../src/screens/lab/miking/engine/restructure.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';

const ALL: Lesson[] = LESSONS.map((m) => lessonById(m.id)!);
const L = (id: string) => lessonById(id)!;
const setups = (id: string, v: string) => startingSetups(L(id), v, MIC_TYPES);
const angle = (a: { az: number; el: number }, b: { az: number; el: number }) => {
  const u = aimVec(a.az, a.el);
  const w = aimVec(b.az, b.el);
  return (Math.acos(Math.max(-1, Math.min(1, u.x * w.x + u.y * w.y + u.z * w.z))) * 180) / Math.PI;
};

describe('every setup mic is a type its zone takes (pairs included)', () => {
  for (const lesson of ALL) {
    it(lesson.id, () => {
      for (const v of lesson.model.variants) {
        for (const s of startingSetups(lesson, v.id, MIC_TYPES)) {
          for (const m of s.mics) {
            if (!m.zoneId) continue;
            const z = lesson.zones.find((q) => q.id === m.zoneId)!;
            assert.ok((z.requires?.micTypeIds ?? lesson.micTypeIds).includes(m.typeId), `${v.id} ${s.id}: ${m.typeId} in ${z.id}`);
            if (z.requires?.mount) assert.equal(MIC_TYPES[m.typeId].mount, z.requires.mount, `${s.id} mount`);
            assert.ok(MIC_TYPES[m.typeId].patterns.some((p) => p.id === m.pattern), `${s.id}: ${m.pattern} on ${m.typeId}`);
          }
        }
      }
    });
  }
  it('the upright bass pair starts with the miniature under the strings', () => {
    for (const id of ['C06a', 'C06b']) {
      const pair = setups(id, 'standing').find((s) => s.role === 'pair')!;
      assert.equal(pair.mics[0].zoneId, 'ub.under');
      assert.equal(pair.mics[0].typeId, 'strMini');
      assert.equal(MIC_TYPES[pair.mics[0].typeId].mount, 'clip');
    }
  });
});

describe('a starting point that is a pair is drawn with both mics', () => {
  it('the upright piano: a split pair over the open top, treble and bass, is its TWO MICS', () => {
    for (const v of ['upright', 'uprightFront']) {
      const pair = setups('C11', v).find((s) => s.role === 'pair')!;
      assert.ok(pair, v);
      const [a, b] = pair.mics;
      assert.equal(a.zoneId, 'up.top');
      assert.ok(a.pose.p.z > 300 && b.pose.p.z < -300, 'one over the treble, one over the bass');
      assert.equal(a.pose.p.y, b.pose.p.y);
    }
  });
  it('the grands: the stereo pair is two cardioids 17 cm apart, 110° between them, angled down toward the pianist', () => {
    for (const v of ['grand', 'baby']) {
      const st = setups('C11', v).find((s) => /stereo pair/i.test(s.title))!;
      assert.ok(st, v);
      assert.equal(st.role, 'more', 'ANOTHER START — the TWO MICS role stays the treble + bass pair');
      assert.equal(st.mics.length, 2);
      const [a, b] = st.mics;
      const gap = Math.hypot(a.pose.p.x - b.pose.p.x, a.pose.p.y - b.pose.p.y, a.pose.p.z - b.pose.p.z);
      assert.ok(Math.abs(gap - 170) < 2, `${gap}`);
      assert.ok(Math.abs(angle(a.pose, b.pose) - 110) < 2, `${angle(a.pose, b.pose)}`);
      // The pair's centre line points down and toward the pianist (−x).
      const u = aimVec(a.pose.az, a.pose.el);
      const w = aimVec(b.pose.az, b.pose.el);
      const mid = { x: u.x + w.x, y: u.y + w.y };
      assert.ok(mid.x < 0 && mid.y > 0);
      assert.ok(Math.abs((Math.atan2(mid.y, -mid.x) * 180) / Math.PI - 45) < 3, 'about 45° down');
      assert.ok(st.mics.every((m) => m.typeId === 'sdcCard' && m.pattern === 'cardioid'));
      assert.ok(!setups('C11', v).some((s) => s.role !== 'more' && s.mics.length === 1 && /stereo pair/i.test(s.title)), 'never one mic for a pair');
    }
  });
  it('the lever harp has its upper and lower spots as TWO MICS, as the pedal harp does', () => {
    for (const v of ['pedal', 'lever']) {
      const pair = setups('C10', v).find((s) => s.role === 'pair')!;
      assert.ok(pair, v);
      const [a, b] = pair.mics;
      assert.ok(a.pose.p.y < b.pose.p.y - 200, `${v}: A is the upper spot`);
      assert.ok(coreSetups(setups('C10', v)).length >= 3, v);
    }
  });
  it('the low-C bass clarinet keeps the blend + front pair the E-flat one has', () => {
    const pair = setups('A08b', 'lowc').find((s) => s.role === 'pair')!;
    assert.deepEqual(pair.mics.map((m) => m.zoneId), ['bcl.blend.c', 'bcl.front']);
    assert.equal(pair.mics[1].pattern, 'omni');
  });
});

describe('the first mic drawn is where a working engineer starts', () => {
  it('about 60 cm over an upward tuba or euphonium bell: a large condenser', () => {
    for (const id of ['A04a', 'A04b']) {
      const one = setups(id, 'up')[0];
      assert.equal(one.role, 'one');
      assert.equal(one.mics[0].typeId, 'lbLdc', id);
    }
  });
  it('the flugelhorn’s farther studio start: a small condenser', () => {
    const one = setups('A01', 'flugelhorn')[0];
    assert.equal(one.mics[0].zoneId, 'fh.far');
    assert.equal(one.mics[0].typeId, 'sdcCard');
  });
  it('the accordion card that says “a dynamic” draws a dynamic', () => {
    for (const v of ['in', 'mid', 'out']) {
      const s = setups('A11', v).find((q) => q.mics[0].zoneId === 'ac.grille')!;
      assert.match(s.title, /dynamic/);
      assert.equal(MIC_TYPES[s.mics[0].typeId].label.toLowerCase().includes('dynamic'), true);
    }
  });
});

describe('amps: close spots at the grille are tone choices; the bass amp’s farther mic is a second mic', () => {
  it('no CLOSE · LIVE setup on the guitar, steel and bass amps', () => {
    for (const id of ['C02', 'C04', 'C08']) {
      const v = L(id).model.variants[0].id;
      const list = setups(id, v);
      assert.ok(!list.some((s) => s.role === 'close'), id);
      assert.ok(list.some((s) => s.role === 'more' && /centre/i.test(s.title)), `${id}: the centre stays to explore`);
    }
  });
  it('the bass amp: a close mic with the farther mic as its TWO MICS', () => {
    const pair = setups('C08', 'closed').find((s) => s.role === 'pair')!;
    assert.deepEqual(pair.mics.map((m) => m.zoneId), ['bass.boundary', 'bass.far']);
  });
});

describe('the quick check asks each idea once', () => {
  for (const lesson of ALL) {
    it(lesson.id, () => {
      const qc = quickCheckOf(lesson);
      assert.equal(qc.length, Math.min(6, lesson.diagnostic.length));
      for (const r of qc.filter((d) => d.id.startsWith('qc.'))) {
        for (const d of qc) if (d !== r) assert.ok(!sameQuestion(d, r), `${lesson.id}: ${r.id} repeats ${d.id}`);
      }
    });
  }
  it('the similarity rule catches the 2026-10-07 repeats', () => {
    const md = { prompt: 'What does most of a mandolin’s radiating?', correct: 'The carved top, driven through the floating bridge' };
    const md2 = { prompt: 'Where does most of a mandolin’s sound come from?', correct: 'The carved top, driven through the floating bridge' };
    assert.ok(sameQuestion(md, md2));
    const hm = { prompt: 'What does a harmonica reed do to the air?', correct: 'Chops it into puffs as it swings through its slot' };
    const hm2 = { prompt: 'What actually makes the harmonica’s sound?', correct: 'Reeds swinging through their slots, chopping the air' };
    assert.ok(sameQuestion(hm, hm2));
    const other = { prompt: 'What must a stand mic stay out of, round a mandolin player?', correct: 'The picking arc, the fretting hand and the player’s turn' };
    assert.ok(!sameQuestion(md, other));
  });
});
