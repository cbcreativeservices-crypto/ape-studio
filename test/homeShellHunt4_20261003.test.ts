/**
 * HOME + SHELL, toddler HUNT 4 (2026-10-03). One receipt per item.
 *
 *  1. Start Here's NEXT STEPS access tags (FREE / MEMBERS · FREE LOOK INSIDE /
 *     MEMBERS) wait for a membership read that actually PRODUCED a tier —
 *     the shared `useUpsellAllowed()` (final round A's rule) — not for
 *     `resolved`, which flips even when the read FAILED. A signed-in member
 *     with no cached tier whose read failed reads 'anonymous' and was shown
 *     the membership tags.
 *
 * R2: FAILED against NextSteps.tsx as it was at 35e4652e (copied aside,
 * restored, run, put back).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { tierOf, upsellAllowed } from '../src/features/commercial/tier.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(ROOT + p, 'utf8').replace(/\r\n/g, '\n');

describe('1. Start Here NEXT STEPS tags wait for a tier that was actually read', () => {
  it('the rule itself: a member whose read failed (boot anonymous, resolved) gets no upsell', () => {
    // What a failed read leaves: `resolved` true, entitlement still the boot
    // 'anonymous', `tierKnown` false.
    const tier = tierOf('anonymous', true);
    assert.equal(tier, 'guest'); // why `resolved` alone was wrong for copy
    assert.equal(upsellAllowed(tier, false), false);
    // A real guest (read answered) still sees the tags.
    assert.equal(upsellAllowed(tier, true), true);
  });

  it('NextSteps gates its tags on useUpsellAllowed, never on `resolved`', () => {
    const s = read('src/screens/startHere/NextSteps.tsx');
    assert.match(s, /import \{ useUpsellAllowed \} from '\.\.\/\.\.\/features\/commercial\/useTier'/);
    assert.match(s, /const upsell = useUpsellAllowed\(\);/);
    assert.match(s, /const a = upsell \? accessTag\(s\.access\) : '';/);
    assert.doesNotMatch(s, /!resolved \? '' : accessTag/);
    assert.doesNotMatch(s, /useEntitlement\(\)/);
  });
});
