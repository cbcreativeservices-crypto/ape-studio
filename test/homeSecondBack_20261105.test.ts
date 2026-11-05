/**
 * BACK on Home asks once before leaving the app (owner 2026-11-05, Pixel): a
 * sideways swipe from the edge is Android's back gesture, so a swipe at Home's
 * carousel left the app by accident.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { SECOND_BACK_MS, secondBackToExit } from '../src/lib/focusedBack.ts';

function setup() {
  let t = 1000;
  let hints = 0;
  const back = secondBackToExit(() => { hints += 1; }, () => t);
  return { back, hints: () => hints, wait: (ms: number) => { t += ms; } };
}

describe('secondBackToExit', () => {
  it('the first BACK stays in the app and shows the hint', () => {
    const s = setup();
    assert.equal(s.back(), true);
    assert.equal(s.hints(), 1);
  });

  it('a second BACK inside the window leaves, with no second hint', () => {
    const s = setup();
    s.back();
    s.wait(SECOND_BACK_MS - 1);
    assert.equal(s.back(), false);
    assert.equal(s.hints(), 1);
  });

  it('a late second BACK starts over', () => {
    const s = setup();
    s.back();
    s.wait(SECOND_BACK_MS + 1);
    assert.equal(s.back(), true);
    assert.equal(s.hints(), 2);
  });

  it('after leaving, coming back to the app needs two again', () => {
    const s = setup();
    s.back();
    s.back();
    s.wait(10);
    assert.equal(s.back(), true);
  });
});

describe('Home wiring', () => {
  const src = readFileSync(new URL('../src/screens/courses/CourseSelectionScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

  it('runs on Android only, through the house BACK helper', () => {
    assert.match(src, /useBackWhileFocused\(Platform\.OS === 'android', homeBack\)/);
  });

  it('says the approved words', () => {
    assert.match(src, /'Swipe back again to leave'/);
  });
});
