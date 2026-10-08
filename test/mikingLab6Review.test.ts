/**
 * Miking Lab 6 (F01–F16) — the 2026-10-08 two-expert review
 * (docs/labs/miking/REVIEW_LAB6_2026_10_08.md). Pins what that review fixed:
 *
 *   F16   the ultrasonic "what else do you check" item keys the mic and the
 *         filter only when the stated rate already covers the calls (its
 *         rate ÷ 2 is above 60 kHz) — it used to say 96 kHz, which does not
 *   F04   a mic's pad is taught as the fix once the preamp gain is already
 *         right down — never "only if the overload is at the mic itself"
 *         (a mic pad lowers the level into the preamp too)
 *   F09   20·log10(90 / 21) is said as about 13 dB
 *   F02–  the two.4 items no longer key the one option without "Yes:"
 *   F04   (a pattern a learner can answer without the idea)
 *   all   the implausible fillers the review replaced stay gone, and no
 *         non-critical key says must / always / never (starting-points voice)
 *   F07/  technique is never "must": the boom is turned with the head, the
 *   F09   dish needs precise aim
 *   F13   "unlimited output" (read as "as loud as it goes") stays gone
 *   F10   the drill's GAIN dock value is the number only (it was cropped)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import type { DiagnosticItem, Lesson, MikingScenario, Symptom } from '../src/screens/lab/miking/engine/model/types.ts';
import { learnerStrings } from './_mikingItemRules.ts';

const IDS = Array.from({ length: 16 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`);
const lesson = (id: string) => lessonById(id) as Lesson;
type Item = MikingScenario | Symptom | DiagnosticItem;
const items = (L: Lesson): Item[] => [...L.scenarios, ...L.symptoms, ...L.diagnostic];
const item = (id: string, itemId: string) => {
  const q = items(lesson(id)).find((s) => s.id === itemId);
  assert.ok(q, `${id} ${itemId}`);
  return q;
};

describe('Lab 6 review (2026-10-08)', () => {
  it('F16: the detector rate in ar.mix.2 already covers 60 kHz calls, so "the mic and filter" is the one best answer', () => {
    const q = item('F16', 'ar.mix.2');
    const rate = Number(/(\d+) kHz for calls/.exec(q.prompt)?.[1]);
    assert.ok(rate / 2 > 60, `rate ${rate} kHz keeps only below ${rate / 2} kHz`);
    assert.match(q.correct, /mic and filter/);
  });

  it('F04: the pad item does not claim a mic pad helps only at the mic', () => {
    const q = item('F04', 'f04.mic.3');
    assert.doesNotMatch(JSON.stringify(q), /Only if the overload is at the mic itself/);
    assert.match(q.prompt, /gain turned right down/);
    assert.match(q.explain, /before the preamp/);
  });

  // Owner 2026-10-08 (L6A): read to the capsule, the wide-shot boom is 110 cm.
  it('F09: the boom/body-mic gap is said as about 14 dB (20·log10(110/21) = 14.4)', () => {
    assert.equal(Math.round(20 * Math.log10(110 / 21)), 14);
    assert.match(item('F09', 'loc.mix.1').explain, /about 14 dB/);
  });

  it('F02–F04 two.4: no option says "Yes:" (the key was the odd one out)', () => {
    for (const [id, q] of [['F02', 'f02.two.4'], ['F03', 'f03.two.4'], ['F04', 'f04.two.4']] as const)
      for (const o of item(id, q).options) assert.doesNotMatch(o, /^Yes\b/, `${id} ${q}: ${o}`);
  });

  it('the replaced fillers stay gone; the F09 boom key is a tendency, not a "must"', () => {
    const FILLERS = /^(Its price|A strip of tape|It wants food: offer some|Waterproofing|Inside the splash is fine if the mic is cheap|Much higher first, then much lower later|Left–right movement of it)$/;
    const bad: string[] = [];
    for (const id of IDS) for (const q of items(lesson(id))) for (const o of q.options) if (FILLERS.test(o)) bad.push(`${id} ${q.id}: ${o}`);
    assert.deepEqual(bad, []);
    assert.doesNotMatch(item('F09', 'q.1').correct, /\bmust\b/);
  });

  it('F07/F09: technique is said as practice, not as "must"', () => {
    const text = [...learnerStrings(lesson('F09')), ...learnerStrings(lesson('F07'))].join('\n');
    assert.doesNotMatch(text, /boom must follow|must follow the head|must be turned with the head|must be aimed precisely/);
  });

  it('F13: the headroom key says "no output limiter", not "unlimited output"', () => {
    assert.doesNotMatch(JSON.stringify(lesson('F13')), /unlimited output/);
    assert.match(item('F13', 'ra.prac.gain').correct, /no output limiter/);
  });

  it('F10: the drill’s GAIN dock value is the number only', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/f10SpatialField/pages.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(src, /formatShort: \(\) => `T\$\{sel/);
  });
});
