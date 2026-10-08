/**
 * Miking Lab 7 part 1 (B01–B08) — the 2026-10-08 two-expert review
 * (docs/labs/miking/REVIEW_LAB7A_2026_10_08.md). Pins what that review fixed:
 *
 *   all   no item keys the one option a test-wise learner can spot by its
 *         first word: two distractors both starting "Yes" (or "No") while the
 *         key does not (17 items rewritten as real questions)
 *   all   the implausible fillers the review replaced stay gone (a brand, a
 *         colour, overheating mics)
 *   B01–  the voice lessons no longer borrow the bowed family's instrument
 *   B07   words: "the loudest … of any position on the instrument", "two mics
 *         on one instrument", "a second mic (or the pickup)", "until the body
 *         comes back", "the loudest host passage"; the brand reason reads
 *         "on a news anchor", never "on a anchor"
 *   B01–  MEET IT is in person words (L7G2-18 / L7G3-17): no "what it is and
 *   B07   its parts … where its sound leaves it"; its credit is the same
 *         checks the engine would have built
 *   B03/  technique is a practice, not a "must": a directional mic "needs to
 *   B04   point"; the boom "moves farther away"; the side-of-frame key is not
 *         "Only when …" (its explanation says audition it, never ban it)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';
import type { DiagnosticItem, Lesson, MikingScenario, Symptom } from '../src/screens/lab/miking/engine/model/types.ts';
import { learnerStrings, itemRules } from './_mikingItemRules.ts';

const ALL = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08'];
const VOICE = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07'];
const lesson = (id: string) => lessonById(id) as Lesson;
type Item = MikingScenario | Symptom | DiagnosticItem;
const items = (L: Lesson): Item[] => [...L.scenarios, ...L.symptoms, ...L.diagnostic];
const item = (id: string, itemId: string) => {
  const q = items(lesson(id)).find((s) => s.id === itemId);
  assert.ok(q, `${id} ${itemId}`);
  return q;
};
const first = (s: string) => /^[A-Za-z]+/.exec(s)?.[0] ?? '';

describe('Lab 7 part 1 review (2026-10-08)', () => {
  it('no item’s distractors share a "Yes"/"No"/"Not" opening the key lacks', () => {
    const bad: string[] = [];
    for (const id of ALL)
      for (const q of items(lesson(id))) {
        const others = q.options.filter((o) => o !== q.correct).map(first);
        const w = others[0];
        if (/^(Yes|No|Not)$/.test(w) && others.every((x) => x === w) && first(q.correct) !== w) bad.push(`${id} ${q.id}`);
        if (/^(No|Not)$/.test(first(q.correct)) && others.every((x) => x === 'Yes')) bad.push(`${id} ${q.id} (lone No)`);
      }
    assert.deepEqual(bad, []);
  });

  it('the item rules still hold after the rewrites (length balance, no absolute distractors, a why each)', () => {
    for (const id of ALL) itemRules(lesson(id));
  });

  it('the replaced fillers stay gone', () => {
    const FILLERS = /^(The brand of the wind cover|The colour of the flag on the handle|The colour of the mute lights on the table bases|The mics overheat when they stay open|The colour of the room they sit in|It is the wrong brand for the venue)$/;
    const bad: string[] = [];
    for (const id of ALL) for (const q of items(lesson(id))) for (const o of q.options) if (FILLERS.test(o)) bad.push(`${id} ${q.id}: ${o}`);
    assert.deepEqual(bad, []);
  });

  it('B01–B07: no instrument words borrowed from the bowed family', () => {
    for (const id of VOICE) {
      const L = lesson(id);
      const text = learnerStrings({ s: L.scenarios, y: L.symptoms, d: L.diagnostic, t: L.setupTasks }).join('\n');
      assert.doesNotMatch(text, /on the instrument|on one instrument|\(or the pickup\)|the body comes back|loudest \w+ passage/, id);
      assert.doesNotMatch(text, /\bon a [aeiou]/i, `${id}: "on a" before a vowel`);
      const hollow = L.symptoms.find((s) => /hollow/.test(s.observation) && /mics? open/.test(s.observation));
      assert.ok(hollow, `${id}: the voice hollow symptom`);
    }
    assert.match(item('B01', 'b1.set.1').prompt, /the host’s loudest laugh or shout/);
    const b08 = learnerStrings(lesson('B08').setupTasks).join('\n');
    assert.doesNotMatch(b08, /\bon a [aeiou]/i);
  });

  it('B01–B07: MEET IT speaks of people, with the engine’s credit', () => {
    for (const id of VOICE) {
      const L = lesson(id);
      const meet = pageOf(L, 'meet');
      assert.doesNotMatch(meet.goal, /what it is and its parts|leaves it:/, id);
      assert.match(meet.goal, /^Meet the .+ in brief — who speaks/, id);
      const want = [...(L.pages.instrument?.credit.scenarios ?? []), ...(L.pages.sound?.credit.scenarios ?? [])];
      assert.deepEqual([...meet.credit.scenarios], want, id);
      assert.equal(meet.takeaway, L.pages.sound?.takeaway, id);
    }
  });

  it('B03/B04: technique as practice; the B04 side-of-frame key is not "Only when"', () => {
    const b03 = learnerStrings(lesson('B03')).join('\n');
    assert.doesNotMatch(b03, /must point at the speaking mouth/);
    for (const id of ALL) for (const q of items(lesson(id))) if (!('critical' in q && q.critical)) assert.doesNotMatch(q.correct, /\bmust\b/i, `${id} ${q.id}`);
    const side = item('B04', 'b4.place.3');
    assert.doesNotMatch(side.correct, /^Only\b/);
    assert.match(side.explain, /audition it/);
  });
});
