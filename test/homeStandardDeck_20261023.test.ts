/**
 * Owner 2026-10-23: "we DO NOT have custom home screens". Home Setup is hidden
 * for launch (owner 2026-09-19); the Home screen must obey the same switch, so
 * a member with a saved Home list still gets the standard deck — MY
 * ENROLLMENTS, Pro Audio Safety and DAW Fundamentals included.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const rd = (p: string) => readFileSync(join(import.meta.dirname, '..', ...p.split('/')), 'utf8').replace(/\r\n/g, '\n');
const home = rd('src/screens/courses/CourseSelectionScreen.tsx');
const enroll = rd('src/screens/enrollment/EnrollmentScreen.tsx');
const flag = rd('src/features/home/homeCardsStore.ts');

describe('Home shows the standard deck while Home Setup is hidden', () => {
  it('one shared switch, still ON for launch', () => {
    assert.match(flag, /export const HOME_SETUP_HIDDEN_FOR_LAUNCH = true;/);
    assert.match(enroll, /import \{ HOME_SETUP_HIDDEN_FOR_LAUNCH \} from '\.\.\/\.\.\/features\/home\/homeCardsStore';/);
    assert.doesNotMatch(enroll, /const HOME_SETUP_HIDDEN_FOR_LAUNCH/);
  });
  it('the custom member deck is gated on the switch', () => {
    assert.match(home, /if \(!HOME_SETUP_HIDDEN_FOR_LAUNCH && entitlement === 'academy' && \(homeGs\.length > 0 \|\| homeBundleKeys\.length > 0\)\)/);
  });
  it('the standard deck carries My Enrollments, Pro Audio Safety and DAW Fundamentals', () => {
    assert.match(home, /\{ kind: 'enrollments', id: 'enrollments' \}/);
    assert.match(home, /id: 'free-3060',\n\s*gs: 3060,/);
    assert.match(home, /id: 'free-3970',\n\s*gs: 3970,/);
  });
});
