/**
 * The privacy notice (owner 2026-11-20) [MD:D72].
 *
 * GUEST: every GUEST MODE sign-in shows a popup on the main menu about our
 * stance on tracking, then "Got it", then the intro video again.
 * ACCOUNT: the account version once per account (a brand-new account sees it
 * before its first video; an existing account sees it alone, once).
 * These pins keep the owner-approved words, the order (popup BEFORE video),
 * the house helpers, and the facts the words promise.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const intros = read('src/features/intro/screenIntros.ts');
const notice = read('src/features/intro/PrivacyNotice.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');
const home = read('src/screens/courses/CourseSelectionScreen.tsx');
const api = read('src/features/profile/api.ts');
const wipe = read('src/features/account/clearLocalAccountData.ts');
const telemetry = read('src/features/telemetry/telemetry.ts');

describe('privacy notice: the owner-approved words (2026-11-20)', () => {
  it('title, shared opening and closing, both middles, and GOT IT, word for word', () => {
    for (const line of [
      "title: 'Your Privacy, Our Promise'",
      'We believe privacy is a right, not a setting. You came here to learn audio, not to be studied yourself.',
      'So we do not track people. We never sell or share anyone’s information, we show no ads, and we never follow you across other apps or websites.',
      'Guest Mode lives by that promise: every guest sign-in erases everything from before on this phone, including lab work, scores and settings. Only a weekly count of free lookups stays, with no name on it.',
      'Students with an account are tracked as little as possible: just your email, your membership, and your progress and scores, so your work follows you to any device.',
      'Your account lives by that promise. We keep only what your learning needs: your email, your membership, and your progress and scores, so your work follows you to any device, plus anything you choose to post or share.',
      'For everyone, crash reports and usage counts are anonymous. They exist only to help us fix and improve the Academy.',
      "button: 'Got it'",
    ]) {
      assert.ok(intros.includes(line), `missing: ${line}`);
    }
  });
});

describe('privacy notice: the facts behind the words', () => {
  it('"never follow you across apps": no advertising id, no user binding in telemetry', () => {
    assert.match(telemetry, /NO advertising id/);
    assert.match(telemetry, /sendDefaultPii: false/);
    assert.doesNotMatch(telemetry, /Sentry\.setUser\(/);
  });
  it('"only a weekly count of free lookups stays": the guest keep list holds no work', () => {
    const keep = wipe.match(/const GUEST_KEEP[\s\S]*?\]\);/)?.[0] ?? '';
    assert.ok(keep.includes("'ape:glossaryUsageLocal'") && keep.includes("'ape:calc:usageLocal'"));
    for (const work of ['progress', 'quiz', 'score', 'lab:', 'favorites', 'career']) {
      assert.ok(!keep.toLowerCase().includes(work), `GUEST_KEEP now keeps "${work}" — the popup's promise is no longer true`);
    }
  });
});

describe('guest notice: when it shows', () => {
  it('owed by EVERY real guest sign-in, after the wipe, never by the web dev auto-guest', () => {
    const owe = auth.indexOf('.oweGuestStart()');
    assert.ok(owe > auth.indexOf('await clearLocalAccountData({ total: true })'), 'owed after the wipe');
    assert.ok(owe < auth.indexOf('toHome();\n    } catch'), 'owed before going Home');
    assert.match(auth, /if \(!auto\) \{[\s\S]{0,300}oweGuestStart\(\)/);
    assert.match(auth, /await enterGuest\(\{ auto: true \}\)/);
  });
  it('the popup comes BEFORE the video: the launch waits while one is owed, then for the fade', () => {
    assert.match(home, /const privacyFirst = \(guestPrivacyOwed && privacyGuest\) \|\| accountPrivacyOwed;/);
    assert.match(home, /introVideoLaunched \|\| privacyFirst\) return undefined;/);
    assert.match(home, /const wait = rootModalHoldMs\(\);/);
    assert.match(home, /hold=\{aboutOpen \|\| upgradeOpen \|\| exploreArea != null\}/);
  });
  it('the video plays again for each guest sign-in (launch latch released, device flag bypassed)', () => {
    assert.match(home, /onGuestStart\(\(\) => \{\n  introVideoLaunched = false;\n\}\);/);
    assert.match(home, /const videoDue = introVideo\.visible \|\| guestVideo;/);
    assert.match(home, /settleGuestIntroVideo\(\);/);
  });
  it('house helpers: guest wording, latched GOT IT, hold + rootModalHoldMs, Low-Light defers, no raw Alert', () => {
    assert.match(notice, /useLatchedPress\(onGotIt\)/);
    assert.match(notice, /rootModalHoldMs\(\)/);
    assert.match(notice, /onRequestClose=\{gotIt\}/);
    assert.doesNotMatch(notice, /Alert\.alert/);
    assert.match(home, /const privacyWording = useGuestWording\(\);/);
    assert.match(home, /!homeFocused \|\| homeSuppressed\s*\? null/);
    // Loaded on demand: the app-start graph cap (perfStartTrim).
    assert.match(home, /require\('\.\.\/\.\.\/features\/intro\/PrivacyNotice'\)/);
  });
});

describe('account notice: once per account', () => {
  it("server mark first (Comp A), this phone's per-account flag as the fallback, never on an unknown session", () => {
    assert.match(api, /supabase\.rpc\('my_privacy_notice_seen'\)/);
    assert.match(api, /supabase\.rpc\('mark_privacy_notice_seen'\)/);
    assert.match(home, /if \(timedOut \|\| !isRealAccount\(sess\.session\) \|\| !sess\.session\)/);
    assert.match(home, /INTRO_STORAGE_PREFIX \+ accountPrivacyIntroKey\(uid\)/);
    assert.match(home, /if \(onDevice != null\) \{\s*if \(onAccount === false\) void markPrivacyNoticeSeenOnAccount\(\);/);
  });
  it('only once the tier says ACCOUNT; GOT IT marks the phone and the account', () => {
    assert.match(home, /!privacyGuest && privacyWording\.account == null && accountPrivacy\.state === 'show'/);
    assert.match(home, /if \(uid\) markIntroSeen\(accountPrivacyIntroKey\(uid\)\);\s*void markPrivacyNoticeSeenOnAccount\(\);/);
  });
});
