/**
 * labsSystems — overnight toddler pass 1 (2026-10-24).
 *
 * DJ Systems Lab goalStore: the what's-left rows ("Left: …" / "Every goal is
 * met — open it once more to count it.") come from a module-level map of the
 * goals each screen still had unmet on its last visit THIS SESSION. It was
 * never dropped by the account wipe, so after a sign-out and a different
 * account's sign-in in the same app session, the next learner's what's-left
 * screen listed the PREVIOUS learner's remaining goals — and a screen the
 * previous learner had fully met read "Every goal is met" for someone who had
 * never opened it. The store now registers its reset with the wipe registry.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { leftLine, reportGoals } from '../src/screens/lab/dj/booth/goalStore.ts';
import { resetRegisteredLocalStores } from '../src/features/storage/localStoreRegistry.ts';

describe('DJ goal reports do not survive the account wipe', () => {
  it('a screen the departing learner met fully reads every goal for the next account', () => {
    const labels = ['Power up safely', 'Fix the silent start', 'Pass the check'];
    reportGoals('NIGHT1-TEST', labels, [true, true, true]);
    assert.match(leftLine('NIGHT1-TEST', labels), /Every goal is met/);
    resetRegisteredLocalStores(); // the account wipe (resetAllLocalStores runs this)
    assert.equal(leftLine('NIGHT1-TEST', labels), 'Left: Power up safely · Fix the silent start · Pass the check');
  });
});
