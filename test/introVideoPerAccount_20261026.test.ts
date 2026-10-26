/**
 * D2 (D99 item 7, owner 2026-10-26): the onboarding intro video plays once per
 * ACCOUNT, not once per device. The account's mark lives on the server
 * (Comp A: my_intro_video_seen / mark_intro_video_seen); with no answer the
 * app keeps today's per-device rule, so it is safe to ship before the server.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const api = read('src/features/profile/api.ts');
const home = read('src/screens/courses/CourseSelectionScreen.tsx');
const video = read('src/screens/onboarding/IntroVideoScreen.tsx');

test('the server mark is read and written through two RPCs, failing soft', () => {
  assert.match(api, /supabase\.rpc\('my_intro_video_seen'\)/);
  assert.match(api, /supabase\.rpc\('mark_intro_video_seen'\)/);
  // Not a boolean (missing function, error) → null → the device rule decides.
  assert.match(api, /if \(error \|\| typeof data !== 'boolean'\) return null;/);
});

test('Home asks the account BEFORE the video can launch', () => {
  assert.match(home, /if \(accountVideo !== 'free' \|\| !introVideo\.visible \|\| introVideoLaunched\) return;/);
  // A failed membership read must not hold the video forever.
  assert.match(home, /if \(!resolved\) \{\s*setAccountVideo\(null\);/);
  // seen on the account → remembered on this phone; seen on this phone → marks the account.
  assert.match(home, /if \(onAccount\) \{\s*if \(onDevice == null\) markIntroSeen\('introVideo'\);/);
  assert.match(home, /if \(onDevice != null\) \{\s*void markIntroVideoSeenOnAccount\(\);/);
  // Re-asked on every sign-in / sign-out (an account switch).
  assert.match(home, /event === 'SIGNED_IN' \|\| event === 'SIGNED_OUT'/);
});

test('a video played to the end marks the account too', () => {
  assert.match(video, /if \(played && !replay\) \{\s*dismiss\(\);\s*void markIntroVideoSeenOnAccount\(\);/);
});
