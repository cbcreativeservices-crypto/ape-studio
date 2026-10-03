/**
 * GUARDS — community / careers / awards, HUNT 4 (2026-10-03).
 *
 *  H1  Trophy Case → Certificates / Programs, for a member who has EARNED at
 *      least one. The "NEXT UP" read (fetchNearestCredential — three reads
 *      plus the award rule) failing set `failed`, but the error card is only
 *      drawn when the earned list is empty. So the waiting slot kept its
 *      LOADING face, "Finding your next certificate…", for good: a failure
 *      shown as a load that never ends, with nothing to retry. The slot now
 *      says it could not load and retries on tap.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('hunt 4 — community / careers / awards', () => {
  test('H1 a failed NEXT UP read is not shown as loading forever', () => {
    const v = code('src/screens/achievements/CredentialWall.tsx');
    // The NEXT UP read records its OWN failure (not only the shared flag the
    // error card reads, which is hidden once anything is earned).
    const load = v.slice(v.indexOf('const load = useCallback'), v.indexOf('useFocusEffect('));
    assert.match(load, /fetchNearestCredential\(kind\)[\s\S]*setNearestFailed\(true\)/, 'the NEXT UP failure is recorded');
    // The slot is told, and can retry.
    assert.match(v, /<WaitingSlot[^>]*failed=\{nearestFailed\}[^>]*onRetry=\{load\}/);
    const slot = v.slice(v.indexOf('function WaitingSlot('));
    const loadingBranch = slot.indexOf('if (!result) {');
    const failedBranch = slot.indexOf('if (!result && failed)');
    assert.ok(failedBranch >= 0 && failedBranch < loadingBranch, 'the failed face comes before the loading face');
    const failedFace = slot.slice(failedBranch, loadingBranch);
    assert.match(failedFace, /onPress=\{onRetry\}/, 'tapping retries');
    assert.doesNotMatch(failedFace, /Finding your next/, 'not the loading copy');
  });
});
