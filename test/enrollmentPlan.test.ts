/**
 * Bundle enrol / remove set math (bug hunt 2026-09-29).
 *
 * Topics are shared between credentials. Enrolling a second credential used to
 * unload EVERY one of its topics — including a shared topic the user had
 * loaded for the first one — and removing a credential removed topics another
 * enrolled credential still contained.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { freshGs, removableOnBundleDrop } from '../src/features/enrollment/enrollmentPlan.ts';

describe('freshGs — only NEW topics are set unloaded on a bundle enrol', () => {
  it('skips topics already enrolled (a shared, loaded topic is left alone)', () => {
    assert.deepEqual(freshGs([10, 20], [20, 30, 40]), [30, 40]);
  });
  it('keeps order and drops duplicates in the bundle list', () => {
    assert.deepEqual(freshGs([], [5, 3, 5, 1]), [5, 3, 1]);
  });
  it('is empty when everything is already enrolled', () => {
    assert.deepEqual(freshGs(new Set([1, 2]), [2, 1]), []);
  });
});

describe('removableOnBundleDrop — a remove leaves topics other bundles hold', () => {
  it('keeps a topic another enrolled bundle still contains', () => {
    assert.deepEqual(removableOnBundleDrop([1, 2, 3], [[2], [9, 3]]), [1]);
  });
  it('keeps the mandatory free topics', () => {
    const free = (gs: number) => gs === 3060;
    assert.deepEqual(removableOnBundleDrop([3060, 7], [], free), [7]);
  });
  it('removes everything when no other bundle overlaps', () => {
    assert.deepEqual(removableOnBundleDrop([4, 5], [[6]]), [4, 5]);
  });
});
