// Owner 2026-11-22: the first-run landing shows the MENU callout to a newcomer,
// worded "YOUR MENU" (not "NEW: YOUR MENU": nothing is new to a first-time user).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('Landing: the MENU callout greets a first-time user', () => {
  it('the landing passes firstRun to the menu', () => {
    assert.match(read('src/screens/onboarding/OnboardingLandingScreen.tsx'), /<ScreenCircleMenu here=\{null\} firstRun \/>/);
  });
  it('firstRun reads YOUR MENU; everywhere else keeps NEW: YOUR MENU', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /\{firstRun \? 'YOUR MENU' : 'NEW: YOUR MENU'\}/);
    assert.match(m, /<MenuLayer here=\{here\} hidden=\{false\} insets=\{insets\} go=\{go\} firstRun=\{firstRun\} \/>/);
  });
});
