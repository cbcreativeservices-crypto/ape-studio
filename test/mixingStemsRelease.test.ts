/**
 * The mixing labs' stem cache — retain/release semantics.
 *
 * sessionStems() memoizes ~15.4 MB of Float32Array, and as of 2026-09-11 both
 * mixing lab screens hold it through retainSessionStems() and drop it when the
 * last one unmounts. Two things have to hold for that to be safe, and neither
 * is obvious from reading the screens:
 *
 *   1. The two labs share ONE cache, so a release must be COUNTED. If leaving
 *      the Advanced lab could drop stems the Beginning lab is still using, the
 *      symptom would be a stall in a screen the learner never left — the kind
 *      of bug nobody traces back to a navigation event.
 *   2. Re-synthesis after a release must be byte-identical, or the lab's whole
 *      claim breaks: the learner would hear a different backing track after
 *      leaving and returning, and the pinned engine tests would drift.
 *
 * Cache identity is the observable used here: sessionStems() hands back the
 * very same object while memoized, and a fresh one after a release.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  releaseSessionStems,
  retainSessionStems,
  sessionStems,
} from '../src/screens/lab/mixing/audio/mixAudio.ts';
import { TRACK_IDS } from '../src/screens/lab/mixing/engine/mixModel.ts';

/** Start each case from a known state: nothing held, nothing cached. */
function reset(): void {
  // Drain any holders a previous case left, then clear.
  for (let i = 0; i < 8; i++) retainSessionStems()();
  releaseSessionStems();
}

describe('stem cache — one screen', () => {
  it('memoizes while held: the same call gives back the same object', () => {
    reset();
    const release = retainSessionStems();
    const a = sessionStems();
    const b = sessionStems();
    assert.equal(a, b, 'a held cache must not re-synthesize');
    release();
  });

  it('drops the stems when the only screen leaves', () => {
    reset();
    const release = retainSessionStems();
    const held = sessionStems();
    release();
    assert.notEqual(sessionStems(), held, 'the cache should have been released on unmount');
  });
});

describe('stem cache — both labs share it', () => {
  it('the first lab to leave must NOT drop stems the second is still using', () => {
    reset();
    const releaseBeginning = retainSessionStems();
    const releaseAdvanced = retainSessionStems();
    const held = sessionStems();

    releaseBeginning();
    assert.equal(
      sessionStems(),
      held,
      'leaving one mixing lab threw away the stems the other one is still on screen with',
    );

    releaseAdvanced();
    assert.notEqual(sessionStems(), held, 'the last screen out should drop the cache');
  });

  it('a cleanup that runs twice does not unbalance the count', () => {
    // React can run an effect cleanup more than once — StrictMode's
    // mount/unmount/mount in development is the everyday case. A double
    // decrement would take the count below the number of live screens and drop
    // the cache out from under a screen that is still there.
    reset();
    const releaseBeginning = retainSessionStems();
    const releaseAdvanced = retainSessionStems();
    const held = sessionStems();

    releaseBeginning();
    releaseBeginning();
    releaseBeginning();
    assert.equal(sessionStems(), held, 'a repeated cleanup unbalanced the holder count');

    releaseAdvanced();
    assert.notEqual(sessionStems(), held);
  });
});

describe('stem cache — what the learner hears cannot change', () => {
  it('re-synthesis after a release is byte-identical', () => {
    reset();
    const release = retainSessionStems();
    const before = sessionStems();
    // Copy: the released object stays alive, but copying makes the comparison
    // independent of anything the renderer might do to the originals.
    const snapshot = TRACK_IDS.map((id) => Float32Array.from(before[id]));
    release();

    const after = sessionStems();
    assert.notEqual(after, before, 'this case is meaningless unless the cache actually dropped');
    TRACK_IDS.forEach((id, t) => {
      const was = snapshot[t];
      const now = after[id];
      assert.equal(now.length, was.length, `${id} changed length across a release`);
      for (let i = 0; i < was.length; i++) {
        if (now[i] !== was[i]) {
          assert.fail(
            `${id} sample ${i} changed across a release: ${was[i]} -> ${now[i]} — ` +
              'the backing track must be the same every time the lab is entered',
          );
        }
      }
    });
    releaseSessionStems();
  });
});
