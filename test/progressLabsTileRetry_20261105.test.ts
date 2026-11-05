/**
 * My Progress LABS tile, unreadable face (bug hunt 2026-11-05, S3). The note
 * said "Tap to retry" while a tap only opened the Labs list. The tile now has
 * a real Retry that reads the record again, and the tile head still opens the
 * list (with its support note), so a read that keeps failing never leaves a
 * dead tile. A failed read is still never shown as empty.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const home = readFileSync(
  new URL('../src/screens/achievements/AchievementsHomeScreen.tsx', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n');

const unreadableFace = () => {
  const start = home.indexOf("labs.status === 'unreadable' ? (");
  const end = home.indexOf('labs.labs.length === 0', start);
  assert.ok(start > 0 && end > start, 'the LABS tile unreadable face was not found');
  return home.slice(start, end);
};

describe('LABS tile: what the unreadable face says is what it does', () => {
  it('no words promise a retry from tapping the tile', () => {
    assert.doesNotMatch(home, /Tap to retry/);
  });

  it('a real Retry control calls the retry of useCompletedLabs', () => {
    assert.match(home, /const \{ state: labs, retry: retryLabs \} = useCompletedLabs\(\);/);
    assert.match(unreadableFace(), /<StudioButton label="Retry"[^>]*onPress=\{retryLabs\}/);
  });

  it('Retry is not nested in the tile press: only the head opens the list', () => {
    assert.match(home, /onPress=\{\(\) => navigation\.navigate\('Labs'\)\}\n\s+headOnly=\{labs\.status === 'unreadable'\}/);
  });

  it('a failed read is never shown as the empty note', () => {
    assert.doesNotMatch(unreadableFace(), /TROPHY_CASE_EMPTY/);
    assert.match(unreadableFace(), /Couldn’t read your lab record\./);
  });
});
