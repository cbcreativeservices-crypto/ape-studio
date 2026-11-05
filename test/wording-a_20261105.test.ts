/**
 * Group wording-a, November 5, 2026 full app bug test, report items 9, 12, 15,
 * 23 and 25 (owner accepted the recommendations).
 *
 * Item 9: Help must not read as if My Custom List were free.
 * Item 12: verified account text must not promise a directory that is hidden
 * until the next store build.
 * Item 15: topic blurbs claim knowledge, never skills ("You learn how...").
 * Item 23: the link goes to the Finder's intro page, not into the questions.
 * Item 25: the instructor sharing date uses the US format.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('wording-a', () => {
  it('item 9: both Help answers say the list methods come with membership', () => {
    const help = read('src/features/help/helpContent.ts');
    assert.match(help, /My Custom List is the exception: with membership, all of its methods are open from the start\./);
    assert.match(help, /With membership, all of its study methods \(flashcards, fill-in-the-blank, matching and scenarios\) are open from the start/);
    assert.doesNotMatch(help, /(?<!with membership, )(?<!With membership, )[Aa]ll of its (study )?methods/);
  });

  it('item 12: neither verified account promises being found', () => {
    const v = read('src/features/employer/verifierKind.ts');
    assert.doesNotMatch(v, /right people find you/);
    assert.doesNotMatch(v, /members can see this/i);
    assert.match(v, /Your employer account is active\. Choose what you are looking for\. Your choices are kept on your account\./);
    assert.match(v, /Your instructor account is active\. Choose what you teach and what you offer\. Your choices are kept on your account\./);
  });

  it('item 15: the four blurbs claim knowledge and keep their facts', () => {
    const t = read('src/data/topicAbout.ts');
    for (const gone of [
      /helps you build an accurate mental model/,
      /the habit of reasoning from first principles/,
      /You start connecting what you hear/,
      /helps you approach acoustic conditions/,
      /You build a stronger sense of how measurement choices/,
      /You also develop the habit of questioning a result/,
      /You develop familiarity with the workflow, communication, and judgment/,
    ]) {
      assert.doesNotMatch(t, gone);
    }
    for (const kept of [
      /you learn how reasoning from first principles works/,
      /how frequency, wavelength, amplitude, and the speed of sound relate to one another/,
      /You learn how what you hear connects to where it sits spectrally/,
      /the octave structure that organizes the audible range/,
      /You learn how acoustic conditions are approached systematically rather than by trial and error/,
      /a room's intended use/,
      /whether the finding holds up when checked another way/,
      /so that measurement becomes a tool for judgment rather than a substitute for it/,
      /You learn how the workflow, communication, and judgment of recording dialogue to picture fit together/,
      /how perspective-matching thinking lets studio recordings sit in location scenes/,
      /what goes wrong in sessions where actors, technology, or picture changes complicate the plan/,
    ]) {
      assert.match(t, kept);
    }
  });

  it('item 23: the family page link names where it goes', () => {
    const s = read('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.match(s, /<TextLink label="Back to the Career Finder" onPress=\{goToFinder\} muted \/>/);
    assert.doesNotMatch(s, /Retake the Career Finder/);
  });

  it('item 25: the sharing date reads "Oct 27, 2026"', () => {
    const s = read('src/features/instructor/shareRules.ts');
    assert.doesNotMatch(s, /en-GB/);
    assert.match(s, /toLocaleDateString\('en-US', \{ month: 'short', day: 'numeric', year: 'numeric' \}\)/);
  });
});
