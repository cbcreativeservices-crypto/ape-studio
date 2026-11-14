/**
 * COMMUNITY + CAREERS + AWARDS — full-app bug run 1 (2026-10-01 evening).
 *
 * Each block FAILED against the pre-fix tree (R2: checked by restoring the old
 * file aside and re-running).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { FAMILIES } from '../src/features/careerfinder/families.ts';
import { furtherEducation } from '../src/features/careerfinder/educationNote.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

type Raw = { t: string; alt?: string[]; prep: number; reg?: 1; pe?: 1 };
const index = JSON.parse(read('src/data/careerIndex.json')) as { enums: { preparation: string[] }; careers: Raw[] };

/** Same title / alternate matching the screens use (careerIndex.ts). */
function noteForExample(title: string): string | null {
  const t = title.toLowerCase();
  for (const c of index.careers) {
    if (c.t.toLowerCase() !== t && !(c.alt ?? []).some((a) => a.toLowerCase() === t)) continue;
    const n = furtherEducation({ regulated: c.reg === 1, professionalEngineer: c.pe === 1, preparation: index.enums.preparation[c.prep] });
    if (n) return n;
  }
  return null;
}

describe('C1: career examples disclose degrees and the PE licence, not only licensed titles', () => {
  const examples = FAMILIES.flatMap((f) => [...f.examples]);

  it('the PE-licensed consulting titles on the family cards are disclosed', () => {
    for (const t of ['Acoustical Consultant', 'Noise-Control Engineer', 'Vibration Consultant']) {
      assert.ok(examples.includes(t), `${t} is a family example`);
      assert.match(noteForExample(t) ?? '', /Professional Engineer license/, t);
    }
  });

  it('graduate-degree titles are disclosed with the index’s own preparation text', () => {
    assert.match(noteForExample('Music Librarian') ?? '', /MLS\/MLIS/);
    // Updated for the Comp A Career Finder text review (2026-11-14), on the owner's word: "assign an
    // agent in the background to work on this". The screen shows the curly apostrophe now (Pattern 9).
    assert.match(noteForExample('Audio Archivist') ?? '', /Master['’]s/);
    assert.match(noteForExample('Acoustics Research Scientist') ?? '', /doctorate/);
  });

  it('a licensed title keeps its own note and does not get a second one', () => {
    assert.equal(noteForExample('Audiologist'), null);
  });

  it('a title with an open pathway is not marked', () => {
    assert.equal(noteForExample('Recording Engineer'), null);
  });

  for (const screen of ['src/screens/careerfinder/CareerFinderResultsScreen.tsx', 'src/screens/careerfinder/CareerFamilyScreen.tsx']) {
    it(`${screen.split('/').pop()} prints the note under the examples`, () => {
      const src = read(screen);
      assert.match(src, /furtherEducationForTitle\(e\)/);
      // Comp A text review 2026-11-14 (owner: "assign an agent in the background to work on this"):
      // one shared sentence, dash → period (Pattern 7). The screen prints the constant.
      assert.match(src, /\{EDUCATION_NOT_REPLACED\}/);
      assert.match(read('src/features/careerfinder/educationNote.ts'), /EDUCATION_NOT_REPLACED = 'Academy study does not replace it\. Check what is required where you live\.'/);
    });
  }
});

describe('D1: the Registry GRADUATE badge reads earned credentials, not finished topics', () => {
  const src = read('src/screens/directory/DirectoryScreen.tsx');
  it('isGraduate is not derived from enrolled bundles at 100%', () => {
    assert.doesNotMatch(src, /useEnrollmentProgress/);
    assert.doesNotMatch(src, /const isGraduate = bundles\.some/);
  });
  it('it comes from fetchMyCredentials, fenced to the live account', () => {
    assert.match(src, /fetchMyCredentials\(\)\.then\(/);
    assert.match(src, /if \(alive\) setCredCount\(rows\.length\)/);
    assert.match(src, /const isGraduate = credCount != null && credCount > 0/);
  });
  it('an unknown count draws no badge rather than guessing USER', () => {
    assert.match(src, /credCount != null \? <Text style=\{styles\.registryStatus\}>/);
  });
});
