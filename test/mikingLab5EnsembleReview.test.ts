/**
 * Miking Lab 5 ENSEMBLE lessons (E08–E16) — the 2026-10-07 two-expert review
 * (docs/labs/reviews/REVIEW_2026_10_07_lab5-ensemble.md). Pins what that
 * review fixed:
 *
 *   E09   the vocal mic is never called "the closest mic" on a band stage
 *         (the lesson's own kick, snare and amp mics sit 4–5 cm out; the
 *         vocal "within 10 cm"): it goes right AT THE LIPS, because the
 *         voice is the quietest source
 *   E16   standing trumpets are the drawing, not "the common layout": the
 *         learner words say the highest riser, seated in many bands
 *   E08–  no distractor gives itself away with "ever / always / never"
 *   E16   (LESSON_JOURNEY §5)
 *   rack  the stage-plot bezel names its 10·log10(NOM) readout in plain
 *         words ("MARGIN LOST"), not the acronym
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';

const IDS = ['E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16'];
const lesson = (id: string) => lessonById(id) as EnsembleLesson;

describe('Lab 5 ensemble review (2026-10-07)', () => {
  it('E09: the vocal mic is not "the closest mic"; it sits at the lips', () => {
    const text = JSON.stringify(lesson('E09'));
    assert.doesNotMatch(text, /closest mic|mic is the closest/i);
    const item = lesson('E09').scenarios.find((s) => s.id === 'bd.meet.2');
    assert.ok(item);
    assert.match(item.prompt, /lips/);
  });

  it('E16: standing trumpets are drawn, not taught as the common layout', () => {
    const L = lesson('E16');
    const seated = L.orient.find((o) => o.title === 'HOW IT IS SEATED');
    assert.ok(seated);
    assert.doesNotMatch(seated.text, /trumpets standing/);
    assert.match(seated.text, /seated in many bands/);
    const rec = L.scenarios.find((s) => s.id === 'bb.rec.2');
    assert.ok(rec);
    assert.doesNotMatch(rec.prompt, /stand on/);
    // "more forward" read as both "toward the band" and "away from it": the
    // pair moves UP and a little FARTHER OUT, in plain words.
    assert.doesNotMatch(JSON.stringify(L), /forward view/);
  });

  it('no distractor in E08–E16 carries ever / always / never', () => {
    const bad: string[] = [];
    for (const id of IDS) {
      const L = lesson(id);
      const items = [...L.scenarios, ...L.diagnostic, ...L.symptoms];
      for (const q of items)
        for (const o of q.options) if (o !== q.correct && /\b(ever|always|never)\b/i.test(o)) bad.push(`${id} ${q.id}: ${o}`);
    }
    assert.deepEqual(bad, []);
  });

  it('the stage-plot bezel says MARGIN LOST, not the NOM acronym', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(src, /'NOM COST'/);
    assert.match(src, /k: 'MARGIN LOST'/);
  });
});
