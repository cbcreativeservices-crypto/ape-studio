/**
 * HUNT 13 — Area 9 (community + careers + awards), 2026-10-04.
 * Each block is a receipt that FAILS on 642fb8a2.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('H13-1 Career Finder: a ★ on an unreadable record is never shown as SAVED (K2, hunt 12 leftover)', () => {
  it('Results: the family button says NOT SAVED while the store cannot save', () => {
    const src = read('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(src, /const saving = useCareerFinderSaving\(\);/);
    assert.match(src, /\{saved \? \(saving \? '★ SAVED' : '★ NOT SAVED'\) : '☆ SAVE'\}/);
    assert.doesNotMatch(src, /\{saved \? '★ SAVED' : '☆ SAVE'\}/);
  });

  it('Hub: families starred on an unreadable record are not listed under SAVED FAMILIES', () => {
    const src = read('src/screens/careerfinder/CareerFinderScreen.tsx');
    assert.match(src, /\{saving \? 'SAVED FAMILIES' : 'STARRED FAMILIES — NOT SAVED ON THIS PHONE'\}/);
  });

  it('Family page: a filled ★ that was not written says so', () => {
    const src = read('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.match(src, /const saving = useCareerFinderSaving\(\);/);
    assert.match(src, /\{saved && !saving \? <Text[^>]*>STARRED — NOT SAVED ON THIS PHONE<\/Text> : null\}/);
    // The hook sits above the "not in the index" early return (hook order).
    assert.ok(src.indexOf('const saving = useCareerFinderSaving();') < src.indexOf('if (!fam) {'));
  });
});

describe('H13-2 Award progress: a rejected read is a failed read, not an endless spinner (K2)', () => {
  const src = read('src/screens/awards/AwardProgressScreen.tsx');
  const at = src.indexOf('const load = useCallback(async () => {');
  const body = src.slice(at, src.indexOf('}, [awardType, awardId]);', at));

  it('fetchAwardProgress is caught inside load(), so the focus effect always clears the spinner', () => {
    assert.match(body, /let p: AwardProgress \| null;\s*try \{\s*p = await fetchAwardProgress\(awardType, awardId\);\s*\} catch \{\s*p = null;\s*\}/);
    assert.doesNotMatch(body, /const p = await fetchAwardProgress/);
  });

  it('fetchAwardProgress really can reject for a signed-in learner (why the catch is needed)', () => {
    const api = read('src/features/awards/api.ts');
    assert.match(api, /if \(!req\.ok\) throw req\.e;/);
  });
});

describe('H13-3 Pro Registry: a name the strict re-read returns is shown (K2, correction to hunt 12)', () => {
  it('the second read\'s name lands on the tile instead of "Add your Registry name"', () => {
    const src = read('src/screens/directory/DirectoryScreen.tsx');
    assert.match(src, /const remote = await fetchMyRegistryName\(\);\s*\n\s*if \(alive && remote\) setRegistryName\(remote\);/);
  });
});
