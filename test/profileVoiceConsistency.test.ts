/**
 * GUARD — the Profile screen speaks in ONE voice.
 *
 * Owner 2026-09-22, reviewing the Profile screen: the app changed person
 * halfway down a single page. The screen is titled MY PROFILE and the directory
 * beside it already said MY AREAS OF AUDIO & ACOUSTICS, HOW I'M INVOLVED and
 * ABOUT MY WORK — but this screen answered with YOUR CERTIFICATES, YOUR
 * PROGRAMS, YOUR NUMBERS, YOUR USER NAME, WHAT YOU WORK IN, ON YOUR PUBLIC PAGE
 * and BEFORE YOU CAN BE LISTED.
 *
 * THE RULE THIS PINS:
 *  - A LABEL naming something that belongs to the user is FIRST person:
 *    "My Certificates", "What I Work In".
 *  - Explanatory BODY copy stays SECOND person ("Your display name will be
 *    visible…") — that is the app talking TO them, and first person reads
 *    bizarrely in a sentence. This guard therefore checks labels only.
 *  - THIRD person is correct only about OTHER members. `ExploreView`'s
 *    "HOW THEY'RE INVOLVED" filters other people's profiles and is NOT an
 *    inconsistency — the test below asserts it stays that way, because
 *    "fixing" it to first person would make a filter claim to be about you.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const profile = read('src', 'screens', 'profile', 'ProfileScreen.tsx');

/** The rule is spelled out in a comment in the file; don't match on that. */
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = stripComments(profile);

describe('Profile screen voice', () => {
  test('no section title addresses the user in the second person', () => {
    const titles = [...code.matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
    const bad = titles.filter((t) => /\b(YOUR|YOU)\b/i.test(t));
    assert.deepEqual(
      bad,
      [],
      `second-person section titles: ${bad.join(', ')} — labels for the user's own things are first person ("My Progress", "What I Work In")`,
    );
  });

  test('no group label addresses the user in the second person', () => {
    const labels = [...code.matchAll(/styles\.groupLabel[^>]*>\s*([^<{]+?)\s*</g)].map((m) => m[1]);
    const bad = labels.filter((t) => /\b(YOUR|YOU)\b/i.test(t));
    assert.deepEqual(bad, [], `second-person group labels: ${bad.join(', ')}`);
  });

  test('the first-person labels are actually present', () => {
    // Guards against the labels being deleted rather than corrected.
    for (const want of ['MY CERTIFICATES', 'MY PROGRAMS', 'MY NUMBERS', 'MY USER NAME', 'WHAT I WORK IN']) {
      assert.ok(code.includes(want), `expected the label ${want}`);
    }
  });

  test("the directory's Explore filter stays third person", () => {
    // It filters OTHER members. First person here would be a real error, so
    // this is pinned deliberately rather than left to judgement.
    const explore = read('src', 'screens', 'directory', 'ExploreView.tsx');
    assert.match(
      explore,
      /HOW THEY’RE INVOLVED/,
      "Explore's role filter is about other members — it must not be reworded to first person",
    );
  });

  test('copy that names a control uses the control\'s own label', () => {
    // "…specialties, how you're involved and About My Work…" named one control
    // correctly and the other in a different voice, in the same sentence.
    const mine = read('src', 'screens', 'directory', 'MyProfileView.tsx');
    assert.ok(
      !/how you’re involved/i.test(mine),
      'MyProfileView still refers to the "How I’m Involved" control as "how you’re involved"',
    );
  });
});
