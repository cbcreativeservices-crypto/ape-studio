/**
 * ACCOUNT + COMMERCE — overnight toddler pass 1 (2026-10-24).
 *
 * 1. OnboardingLandingScreen `choose` — ONE CHOICE PER VISIT.
 *    Every choice leaves the page (safeGoBack, replace, or the Paywall pushed
 *    over it), but `choose` then carried on regardless: after the first tap had
 *    already popped the page, a second tap in the same moment (a double tap,
 *    or two buttons under two fingers) found `safeGoBack` refused (the page is
 *    no longer focused) and STILL ran its `navigationRef.navigate(...)` — so
 *    GLOSSARY + LABS opened both, stacked; and SEE MEMBERSHIP PLANS after a
 *    first choice re-armed the landing return and opened the Paywall over the
 *    destination, whose purchase then `replace`d the one-time landing page
 *    back on screen. A tap on a page that is no longer the focused screen now
 *    does nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('landing: a choice is refused once the page is no longer the focused screen', () => {
  const s = src('src/screens/onboarding/OnboardingLandingScreen.tsx');
  const start = s.indexOf('const choose = (c: OnboardingChoice) => {');
  assert.ok(start > 0, 'choose() found');
  const body = s.slice(start, s.indexOf('\n  };\n', start));
  const guard = body.indexOf('if (!navigation.isFocused()) return;');
  assert.ok(guard > 0, 'choose() returns when the landing is no longer focused');
  // The guard comes AFTER the preview hook and BEFORE any navigation.
  assert.ok(body.indexOf('if (onChoose) return onChoose(c);') < guard, 'preview onChoose stays first');
  for (const nav of ['armLandingReturn();', "navigation.replace('IntroVideo'", 'safeGoBack(navigation);', 'nav.navigate(']) {
    const at = body.indexOf(nav);
    assert.ok(at > guard, `${nav} runs only after the focus guard`);
  }
});
