/**
 * Lab Common Mistakes on a glossary card (owner-approved 2026-11-23; Comp A
 * brief 2026-11-24): 56 of the 175 lab lines are hidden ON GLOSSARY CARDS
 * ONLY, and the section ends with one plain line.
 *
 * The hide list matches on EXACT strings. If a line's wording is edited in
 * guidedLessons/content.ts, this test fails, so the line cannot silently
 * come back on glossary cards: update the string in
 * glossaryHiddenLabMistakes.ts to the new wording.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { LAB_LESSONS } from '../src/features/lab/guidedLessons/content.ts';
import {
  GLOSSARY_HIDDEN_LAB_MISTAKES,
  glossaryLabMistakes,
  glossaryLabMistakesClosing,
} from '../src/features/lab/guidedLessons/glossaryHiddenLabMistakes.ts';
import type { LabId } from '../src/features/lab/guidedLessons/types.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/** The approved list: lab id → 1-based positions in that lab's list. */
const APPROVED: Record<string, number[]> = {
  eq: [4],
  delay: [1, 5, 6],
  reverb: [5],
  flanger: [2, 4],
  phaser: [6],
  compression: [4],
  gate: [4],
  limiter: [4],
  distortion: [1, 4, 5, 6],
  noise: [2, 3, 4],
  phase: [4],
  harmonic: [2, 3, 5],
  oscillator: [1, 3, 6],
  stereo: [1, 5],
  harmonograph: [3, 4, 5, 6],
  chain: [2, 3, 5],
  bass: [2],
  autotune: [2, 3],
  fm: [2, 4, 6],
  binaural: [2, 3, 4, 5],
  modular: [3, 5],
  foundations: [5, 6],
  mic: [2],
  speaker: [4, 5],
  tube: [2, 4],
  cymatics: [2, 5],
  meter: [6],
};

const hiddenEntries = Object.entries(GLOSSARY_HIDDEN_LAB_MISTAKES) as [LabId, readonly string[]][];

describe('glossary card: hidden lab Common Mistakes (owner 2026-11-23)', () => {
  it('hides exactly 56 lines, across 27 labs', () => {
    assert.equal(hiddenEntries.reduce((n, [, list]) => n + list.length, 0), 56);
    assert.equal(hiddenEntries.length, 27);
  });

  it('every hidden string exists, once, in its own lab’s list', () => {
    for (const [id, list] of hiddenEntries) {
      const lesson = LAB_LESSONS[id];
      assert.ok(lesson, `no lab "${id}"`);
      assert.equal(new Set(list).size, list.length, `${id}: a string is listed twice`);
      for (const s of list) {
        assert.equal(
          lesson.commonMistakes.filter((m) => m === s).length,
          1,
          `${id}: this hidden line is no longer in the lab's Common Mistakes word for word ` +
            `(was its wording edited in content.ts? then update glossaryHiddenLabMistakes.ts): ${s}`,
        );
      }
    }
  });

  it('the hidden lines are the approved ones (lab id and position)', () => {
    assert.deepEqual(Object.keys(GLOSSARY_HIDDEN_LAB_MISTAKES).sort(), Object.keys(APPROVED).sort());
    for (const [id, list] of hiddenEntries) {
      const positions = list.map((s) => LAB_LESSONS[id].commonMistakes.indexOf(s) + 1).sort((a, b) => a - b);
      assert.deepEqual(positions, APPROVED[id], id);
    }
  });

  it('the labs keep all 175 lines: content.ts is not trimmed', () => {
    const all = Object.values(LAB_LESSONS).reduce((n, l) => n + (l.commonMistakes?.length ?? 0), 0);
    assert.equal(all, 175);
    assert.equal(Object.keys(LAB_LESSONS).length, 30);
  });

  it('a card shows the rest, in the lab’s own order; every lab keeps at least one line', () => {
    let shown = 0;
    for (const lesson of Object.values(LAB_LESSONS)) {
      const visible = glossaryLabMistakes(lesson);
      const hidden = GLOSSARY_HIDDEN_LAB_MISTAKES[lesson.id] ?? [];
      assert.equal(visible.length, lesson.commonMistakes.length - hidden.length, lesson.id);
      assert.ok(visible.length >= 1, `${lesson.id}: nothing left to show`);
      assert.deepEqual(visible, lesson.commonMistakes.filter((s) => !hidden.includes(s)), lesson.id);
      shown += visible.length;
    }
    assert.equal(shown, 175 - 56);
  });

  it('Valve’s lab (Vacuum Tube Fundamentals) shows lines 1, 3, 5 and 6', () => {
    const tube = LAB_LESSONS.tube;
    assert.deepEqual(glossaryLabMistakes(tube), [1, 3, 5, 6].map((n) => tube.commonMistakes[n - 1]));
  });

  it('the closing line is the owner’s, word for word', () => {
    assert.equal(LAB_LESSONS.tube.name, 'Vacuum Tube Fundamentals');
    assert.equal(
      glossaryLabMistakesClosing(LAB_LESSONS.tube.name),
      'More common mistakes for this topic are in the Vacuum Tube Fundamentals lab.',
    );
  });

  it('the glossary card uses the filtered list and ends the section with the plain closing line', () => {
    const src = read('src/screens/glossary/GlossaryScreen.tsx');
    assert.match(src, /glossaryLabMistakes\(labLesson\)\.map\(/);
    assert.doesNotMatch(src, /labLesson\.commonMistakes\.map\(/, 'the card must not print the unfiltered list');
    const section = /COMMON MISTAKES · \{labLesson\.name\.toUpperCase\(\)\} LAB<\/Text>([\s\S]*?)<\/View>/.exec(src);
    assert.ok(section, 'the lab section is still on the card');
    assert.match(section[1], /<Text style=\{\[styles\.detailBody, styles\.labMistakesClosing\]\}>\{glossaryLabMistakesClosing\(labLesson\.name\)\}<\/Text>\s*$/);
    assert.doesNotMatch(section[1], /onPress/, 'the closing line is plain text, not tappable');
  });

  it('the hide list is used by the glossary card only (the labs never import it)', () => {
    const sheet = read('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
    assert.doesNotMatch(sheet, /glossaryHiddenLabMistakes/);
    assert.doesNotMatch(read('src/features/lab/guidedLessons/content.ts'), /glossaryHiddenLabMistakes/);
  });
});
