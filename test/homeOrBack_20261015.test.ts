/**
 * Owner rule 2026-10-14: "Always prefer the Home icon when the next back level
 * goes there. Only use the back arrow when the user is into the third, fourth
 * and deeper levels."
 *
 * 1. backLeadsHome — decided from the route actually under the screen.
 * 2. The screens opened straight from Home use the shared HomeOrBackKey (or,
 *    beside CompactBrandBar's HOME, drop the ‹ via useBackLeadsHome).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const { backLeadsHome } = await import('../src/lib/backLeadsHome.ts');

const main = (tab: string, nested?: object) => ({
  key: 'main-1',
  name: 'Main',
  state: {
    index: ['Home', 'Study', 'Tools', 'Profile'].indexOf(tab),
    routes: [
      { key: 'home-1', name: 'Home' },
      { key: 'study-1', name: 'Study', state: nested },
      { key: 'tools-1', name: 'Tools' },
      { key: 'profile-1', name: 'Profile' },
    ],
  },
});

describe('backLeadsHome', () => {
  it('opened from Home: the Main shell under it is on the Home tab', () => {
    const state = { index: 1, routes: [main('Home'), { key: 'calc-1', name: 'CalcLab' }] };
    assert.equal(backLeadsHome(state, 'calc-1'), true);
  });

  it('Main with no state yet is its initial tab, Home', () => {
    const state = { index: 1, routes: [{ key: 'm', name: 'Main' }, { key: 'calc-1', name: 'CalcLab' }] };
    assert.equal(backLeadsHome(state, 'calc-1'), true);
  });

  it('opened from the Study tab (a Dashboard inside it): back arrow', () => {
    const study = { index: 0, routes: [{ key: 'd', name: 'Dashboard' }] };
    const state = { index: 1, routes: [main('Study', study), { key: 'calc-1', name: 'CalcLab' }] };
    assert.equal(backLeadsHome(state, 'calc-1'), false);
  });

  it('two levels deep (Home → Awards → AwardProgress): back arrow', () => {
    const state = {
      index: 2,
      routes: [main('Home'), { key: 'aw', name: 'Awards' }, { key: 'ap', name: 'AwardProgress' }],
    };
    assert.equal(backLeadsHome(state, 'ap'), false);
    assert.equal(backLeadsHome(state, 'aw'), true);
  });

  it('a screen still mounted UNDER another reads its own predecessor', () => {
    const state = {
      index: 2,
      routes: [main('Home'), { key: 'cf', name: 'CareerFinder' }, { key: 'q', name: 'CareerFinderQuiz' }],
    };
    assert.equal(backLeadsHome(state, 'cf'), true);
    assert.equal(backLeadsHome(state, 'q'), false);
  });

  it('a stack root, an unknown key, or no state: back arrow (never guesses Home)', () => {
    const state = { index: 0, routes: [{ key: 'x', name: 'Dashboard' }] };
    assert.equal(backLeadsHome(state, 'x'), false);
    assert.equal(backLeadsHome(state, 'nope'), false);
    assert.equal(backLeadsHome(undefined, 'x'), false);
    assert.equal(backLeadsHome(state, undefined), false);
  });
});

describe('screens opened from Home use the shared Home-or-back key', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8');
  for (const p of [
    'screens/lab/calc/CalcLabScreen.tsx',
    'screens/awards/AwardProgressScreen.tsx',
    'screens/careerfinder/kit.tsx',
    'screens/startHere/StartHereScreen.tsx',
  ]) {
    it(p, () => {
      const s = read(p);
      assert.match(s, /<HomeOrBackKey\b/, `${p} lost the HomeOrBackKey`);
    });
  }
  it('Learning Labs drops its ‹ when back is Home (CompactBrandBar carries HOME)', () => {
    const s = read('screens/lab/AudioLearningScreen.tsx');
    assert.match(s, /useBackLeadsHome\(\)/);
    assert.match(s, /backIsHome \? null :/);
  });
  it('the Home face is the Glossary HOME key and the press stays the caller’s back step', () => {
    const s = read('components/nav/HomeOrBackKey.tsx');
    assert.match(s, /<NavIcon icon="Home" lit \/>/);
    assert.match(s, /accessibilityLabel="Home"/);
    assert.doesNotMatch(s, /popTo\(|navigate\(/, 'the key must not invent its own destination');
  });
});
