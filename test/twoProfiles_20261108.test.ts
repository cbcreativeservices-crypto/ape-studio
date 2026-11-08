/**
 * Two profiles, two names (owner 2026-11-08): the forum gate names the Audio
 * Community profile and its MY PROFILE button, and the Profile tab's strip
 * names the Pro Registry. "My Profile" alone sent the owner to the Registry
 * page while the forum stayed shut.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { refusalText, refusalNeedsProfile } from '../src/features/forum/rules.ts';

test('forum profile refusals name the Audio Community profile and the MY PROFILE button', () => {
  for (const code of ['profile_unpublished', 'adult_attestation']) {
    assert.equal(refusalNeedsProfile(code), true);
    const t = refusalText(code);
    assert.match(t, /Audio Community profile/);
    assert.match(t, /Tap MY PROFILE/);
    assert.doesNotMatch(t, /in My Profile/);
  }
});

test('the Profile tab strip names the Pro Registry', () => {
  const s = readFileSync('src/screens/profile/ProfileScreen.tsx', 'utf8').replace(/\r\n/g, '\n');
  assert.match(s, /`Pro Registry: \$\{missing\.length\} detail/);
});
