/**
 * Miking Labs — ENGINE-WIDE guards on every lesson's checks (review Lab 1,
 * 2026-10-05, C2 / M1 / M2). They read every lesson in the registry, so a
 * lesson added to any lab later is held to them without a new test:
 *
 *   1. No length cue: in every check, symptom and quick-check item the
 *      correct option is at most 1.25 × the mean length of the others; per
 *      lesson the correct option is the longest in at most a quarter of all
 *      its items, and in at most 2 of its 6 quick-check items (chance with
 *      three options; "never the longest" would be a cue of its own). No
 *      wrong option carries an absolute word (always / any / never / every).
 *   2. No answer-pattern cue:
 *      • yes/no-style items (a "Yes…" and a "No…/Not…" option): neither
 *        "Yes" nor "No" is the key in more than 70 % of them, lab-wide;
 *      • where a "Yes…" option is offered, it is the key in ≥ 30 % (C2's
 *        ratchet: "Yes" used to be right in 0 of 67);
 *      • where a "No…/Not…" option is offered, it is the key in ≤ 70 %;
 *      • the slot the answer is SHOWN in (the cards shuffle) holds it in at
 *        most half of the items — engine-wide, per lab and per lesson
 *        (at most 60 % there, a lesson being a small sample).
 *   3. One explanation of an opposite-side mic's polarity: every lesson that
 *      talks about the polarity of a bottom, opening or rear mic quotes
 *      OPPOSITE_SIDES_POLARITY verbatim, and no lesson says to never invert
 *      a mic because of where it sits, or calls inverting it a rule.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MikingLabId } from '../src/screens/lab/miking/engine/model/types.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { optionOrder, shownSlotOf } from '../src/screens/lab/miking/engine/model/itemOrder.ts';
import { OPPOSITE_SIDES_POLARITY } from '../src/screens/lab/miking/engine/model/sharedItems.ts';
import { learnerStrings } from './_mikingItemRules.ts';

type Item = { id: string; options: readonly string[]; correct: string };
type Row = { lesson: string; lab: MikingLabId; item: Item; quick: boolean };

const ROWS: Row[] = [];
const BY_LESSON = new Map<string, Lesson>();
for (const meta of LESSONS) {
  const l = lessonById(meta.id);
  if (!l) continue;
  BY_LESSON.set(meta.id, l);
  for (const item of [...l.scenarios, ...l.symptoms]) ROWS.push({ lesson: meta.id, lab: meta.labId, item, quick: false });
  for (const item of l.diagnostic) ROWS.push({ lesson: meta.id, lab: meta.labId, item, quick: true });
}
const LABS = [...new Set(ROWS.map((r) => r.lab))];
const tag = (r: Row) => `${r.lesson} ${r.item.id}`;

const others = (s: Item) => s.options.filter((o) => o !== s.correct);
const meanOthers = (s: Item) => others(s).reduce((a, o) => a + o.length, 0) / others(s).length;
const isLongest = (s: Item) => others(s).every((o) => o.length < s.correct.length);
const YES = /^Yes\b/;
const NO = /^(No|Not)\b/;
const pct = (n: number, d: number) => `${n}/${d} (${Math.round((100 * n) / d)} %)`;

describe('miking checks: no length cue (every lesson, every lab)', () => {
  it('the registry serves lessons to guard', () => assert.ok(ROWS.length > 600 && LABS.length >= 2));
  it('the correct option is at most 1.25 × the mean length of the others', () => {
    const bad = ROWS.filter((r) => r.item.correct.length > 1.25 * meanOthers(r.item)).map((r) => `${tag(r)} ${(r.item.correct.length / meanOthers(r.item)).toFixed(2)}`);
    assert.deepEqual(bad, []);
  });
  it('no wrong option gives itself away with an absolute word', () => {
    const bad = ROWS.flatMap((r) => others(r.item).filter((o) => /\b(always|any|never|every)\b/i.test(o)).map((o) => `${tag(r)}: "${o}"`));
    assert.deepEqual(bad, []);
  });
  it('per lesson, the correct option is the longest in at most a quarter of its items', () => {
    const bad: string[] = [];
    for (const id of BY_LESSON.keys()) {
      const rows = ROWS.filter((r) => r.lesson === id);
      const n = rows.filter((r) => isLongest(r.item)).length;
      if (n > rows.length / 4) bad.push(`${id}: ${pct(n, rows.length)}`);
    }
    assert.deepEqual(bad, []);
  });
  it('per lesson, the quick check’s key is the longest in at most 2 of its items', () => {
    const bad: string[] = [];
    for (const id of BY_LESSON.keys()) {
      const rows = ROWS.filter((r) => r.lesson === id && r.quick);
      const longest = rows.filter((r) => isLongest(r.item)).map((r) => r.item.id);
      if (longest.length > 2) bad.push(`${id}: ${longest.join(', ')}`);
    }
    assert.deepEqual(bad, []);
  });
});

describe('miking checks: no answer-pattern cue', () => {
  for (const lab of LABS) {
    const rows = ROWS.filter((r) => r.lab === lab);
    it(`${lab}: yes/no items — neither “Yes” nor “No” is the key in more than 70 %`, () => {
      const yn = rows.filter((r) => r.item.options.some((o) => YES.test(o)) && r.item.options.some((o) => NO.test(o)));
      const y = yn.filter((r) => YES.test(r.item.correct)).length;
      const n = yn.filter((r) => NO.test(r.item.correct)).length;
      assert.ok(y <= 0.7 * yn.length, `Yes is the key in ${pct(y, yn.length)}`);
      assert.ok(n <= 0.7 * yn.length, `No is the key in ${pct(n, yn.length)}`);
    });
    it(`${lab}: where a “Yes…” option is offered it is the key in at least 30 %`, () => {
      const withYes = rows.filter((r) => r.item.options.some((o) => YES.test(o)));
      const y = withYes.filter((r) => YES.test(r.item.correct)).length;
      assert.ok(y >= 0.3 * withYes.length, `Yes is the key in ${pct(y, withYes.length)}`);
    });
    it(`${lab}: where a “No…/Not…” option is offered it is the key in at most 70 %`, () => {
      const withNo = rows.filter((r) => r.item.options.some((o) => NO.test(o)));
      const n = withNo.filter((r) => NO.test(r.item.correct)).length;
      assert.ok(n <= 0.7 * withNo.length, `No/Not is the key in ${pct(n, withNo.length)}`);
    });
  }
  const slotShare = (rows: Row[]) => {
    const count = new Map<number, number>();
    for (const r of rows) {
      const s = shownSlotOf(r.item);
      count.set(s, (count.get(s) ?? 0) + 1);
    }
    return Math.max(...count.values()) / rows.length;
  };
  it('the shown order is a permutation of the options, stable for an item', () => {
    for (const r of ROWS) {
      const o = optionOrder(r.item);
      assert.deepEqual([...o].sort((a, b) => a - b), r.item.options.map((_, i) => i), tag(r));
      assert.deepEqual(optionOrder(r.item), o, tag(r));
    }
  });
  it('no shown slot holds the answer in more than half of the items (all labs, each lab)', () => {
    assert.ok(slotShare(ROWS) <= 0.5, `all: ${slotShare(ROWS).toFixed(2)}`);
    for (const lab of LABS) {
      const share = slotShare(ROWS.filter((r) => r.lab === lab));
      assert.ok(share <= 0.5, `${lab}: ${share.toFixed(2)}`);
    }
  });
  it('per lesson, no shown slot holds the answer in more than 60 % of its items', () => {
    for (const id of BY_LESSON.keys()) {
      const share = slotShare(ROWS.filter((r) => r.lesson === id));
      assert.ok(share <= 0.6, `${id}: ${share.toFixed(2)}`);
    }
  });
  it('the same item id in two lessons does not pin the answer to one slot', () => {
    const q6 = ROWS.filter((r) => /(^|\.)q\.6$/.test(r.item.id));
    assert.ok(q6.length >= 10);
    assert.ok(new Set(q6.map((r) => shownSlotOf(r.item))).size >= 2);
  });
});

/** A sentence about the polarity of a mic on the far side of a moving surface. */
const SIDE = /\b(bottom mic|bottom snare mic|bottom tom mic|below the drum|low mic|opening mic|rear mic|top and (a )?bottom)\b/i;
const POL = /\b(polarity|invert\w*|flip\w*)\b/i;

describe('miking: one explanation of an opposite-side mic’s polarity', () => {
  it('the shared explanation says the four things', () => {
    assert.match(OPPOSITE_SIDES_POLARITY, /start opposite/);
    assert.match(OPPOSITE_SIDES_POLARITY, /never a rule/);
    assert.match(OPPOSITE_SIDES_POLARITY, /flips the sign/);
    assert.match(OPPOSITE_SIDES_POLARITY, /both states by ear/);
  });
  const mentions: string[] = [];
  for (const [id, l] of BY_LESSON) {
    const strings = learnerStrings(l);
    const talks = strings.some((s) => s.split(/(?<=[.!?])\s+/).some((t) => SIDE.test(t) && POL.test(t)));
    if (talks) mentions.push(id);
    it(`${id}: ${talks ? 'quotes the shared explanation' : 'does not discuss an opposite-side mic’s polarity'}; no “never invert”, no inverting rule`, () => {
      if (talks) assert.ok(strings.includes(OPPOSITE_SIDES_POLARITY) || strings.some((s) => s.includes(OPPOSITE_SIDES_POLARITY)), `${id} must quote OPPOSITE_SIDES_POLARITY`);
      for (const s of strings) {
        assert.doesNotMatch(s, /never invert/i, `${id}: "${s.slice(0, 80)}"`);
        assert.doesNotMatch(s, /rule of thumb/i, `${id}: "${s.slice(0, 80)}"`);
      }
      for (const s of [...l.scenarios, ...l.symptoms, ...l.diagnostic]) assert.doesNotMatch(s.correct, /\b(invert|flip)\w*\b.*\b(rule|always)\b/i, `${id} ${s.id}`);
    });
  }
  it('the lessons with a bottom, opening or rear mic all take part', () => {
    for (const id of ['M02', 'M03', 'M04a', 'M05', 'M07b', 'M12', 'SPK', 'C02']) assert.ok(mentions.includes(id), id);
  });
});
