/**
 * Owner 2026-10-10: the Electric Guitar lesson's START said "First, in brief,
 * the drum itself" — a lesson with no word set of its own fell back to the
 * drum words. The START sentence must name the lesson's own instrument.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

describe('START names the lesson’s own instrument, never the drum default', () => {
  it('every journeyIntro caller passes ownInstrumentWord, not the defaulted words', () => {
    for (const f of [
      'src/screens/lab/miking/lessons/shared/journeyPages.tsx',
      'src/screens/lab/miking/pages/PInstrument.tsx',
      'src/screens/lab/miking/lessons/shared/smallperc/pages/SInstrument.tsx',
    ]) {
      const s = read(f);
      assert.match(s, /journeyIntro\(lesson\.noun, ownInstrumentWord\(lesson\)\)/, f);
      assert.doesNotMatch(s, /journeyIntro\([^)]*words\.instrument/, f);
    }
  });
  it('ownInstrumentWord reads only the lesson’s own words or terms', () => {
    const s = read('src/screens/lab/miking/engine/model/copy.ts');
    assert.match(s, /export function ownInstrumentWord[\s\S]*?c\?\.words\?\.instrument \?\? \(c\?\.terms \? termsToWords\(c\.terms\)\.instrument : undefined\)/);
  });
});
