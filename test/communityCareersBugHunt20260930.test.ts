/**
 * GUARDS — community / careers / help / onboarding fixes from the 2026-09-30
 * toddler-and-cat bug hunt.
 *
 *  C1  The conversation sheet wrote a slow fetch (or the reload after a SEND)
 *      for conversation A under conversation B's name.
 *  C2  An accepted SENT request is a two-way conversation, and its card had
 *      no BLOCK or REPORT.
 *  C3  DELETE COMMUNITY PROFILE, then any tab switch, re-saved the blank
 *      profile through the flush-on-leave and re-created what was deleted.
 *  C4  A failed featured-credential write left the chip lit, silently.
 *  C5  The guided setup allowed a 60-character display name; the editor, and
 *      the member sheet header, hold 30.
 *  C6  The Registry QR survived an account switch.
 *  C7  The report queue let an older tab's list land under the current tab.
 *  C8  Career Finder: answer-then-tap on Q28 finished twice; the auto-advance
 *      beat finished the Finder after the user had left.
 *  C9  Career Finder hub: CONTINUE named a different question than it opened.
 *  C10 Career Finder results: the feedback note was lost on back.
 *  C11 Help: "Replay onboarding hints" had no rejection handler.
 *  C12 The About attract text kept breathing in Low-Light.
 *  C13 useScreenIntro's storage read had no rejection handler.
 *
 * Source-text checks (the screens import React Native, which will not load
 * under node), in the same style as appShellBugHunt20260929.
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
const between = (s: string, from: string, to: string) => {
  const a = s.indexOf(from);
  assert.ok(a >= 0, `missing ${from}`);
  const b = s.indexOf(to, a + from.length);
  assert.ok(b > a, `missing ${to} after ${from}`);
  return s.slice(a, b);
};

describe('community directory', () => {
  const requests = code('src/screens/directory/RequestsView.tsx');

  test('C1: a thread load only lands while that thread is still open', () => {
    const load = between(requests, 'const load = useCallback(async () => {\n    if (!thread) return;', '}, [thread]);');
    assert.match(load, /openId\.current !== id\) return/);
    assert.match(load, /if \(openId\.current === id\) setAllow/);
  });

  test('C2: an accepted outgoing conversation can be blocked and reported', () => {
    const outgoing = between(requests, 'const OutgoingCard = memo(', 'export function RequestsView');
    const accepted = between(outgoing, "t.status === 'accepted'", ': null}');
    assert.match(accepted, /<ThreadModeration /);
    const mod = between(requests, 'function ThreadModeration(', 'const OutgoingCard');
    assert.match(mod, /blockThread\(t\.id, true\)/);
    assert.match(mod, /<ReportLink /);
  });

  const editor = code('src/screens/directory/MyProfileView.tsx');

  test('C3: deleting marks the blank profile as already sent', () => {
    const del = between(editor, 'deleteCommunityProfile().then(', 'setP(EMPTY_COMMUNITY_PROFILE);');
    assert.match(del, /lastSent\.current = EMPTY_COMMUNITY_PROFILE/);
    assert.match(del, /pRef\.current = EMPTY_COMMUNITY_PROFILE/);
  });

  test('C4: a featured-credential write reports and rolls back on failure', () => {
    const pick = between(editor, 'setFeaturedCredentials(ids)', '});');
    assert.match(pick, /setErr\(r\.error\)/);
    assert.match(pick, /featuredCredentialIds: prevIds/);
  });

  test('C5: the guided setup bounds the display name like the editor', () => {
    const max = Number(/const DISPLAY_NAME_MAX = (\d+);/.exec(editor)?.[1]);
    assert.ok(max > 0);
    const guide = code('src/screens/directory/ProfileSetupFlow.tsx');
    const name = between(guide, "{step === 'name' ? (", ') : null}');
    assert.match(name, new RegExp(`maxLength=\\{${max}\\}`));
  });

  test('C6: the Registry QR is cleared before each account read', () => {
    const src = code('src/screens/directory/DirectoryScreen.tsx');
    const eff = between(src, 'setQrToken(null);', '}, [accountConfirmed]);');
    assert.match(eff, /if \(!alive\) return;/);
    assert.match(eff, /alive = false/);
  });

  test('C7: only the latest report-queue read lands', () => {
    const src = code('src/screens/admin/ReportsAdminScreen.tsx');
    const load = between(src, 'const load = useCallback(async () => {', '}, [tab]);');
    assert.match(load, /if \(id !== loadReq\.current\) return;/);
  });
});

describe('career finder', () => {
  test('C8: finish runs once and the beat does nothing after leaving', () => {
    const src = code('src/screens/careerfinder/CareerFinderQuizScreen.tsx');
    const finish = between(src, 'const finish = useCallback(() => {', '}, [navigation]);');
    assert.match(finish, /if \(finished\.current\) return;\s*finished\.current = true;/);
    const choose = between(src, 'const choose = (value: Response) => {', '\n  };');
    assert.match(choose, /if \(!navigation\.isFocused\(\)\) return;/);
  });

  test('C9: the hub CONTINUE label uses the quiz resume rule', () => {
    const src = code('src/screens/careerfinder/CareerFinderScreen.tsx');
    assert.match(src, /firstUnansweredIndex\(rec\)/);
    assert.match(src, /QUESTION \$\{Math\.min\(QUESTION_COUNT, resumeAt \+ 1\)\}/);
    assert.doesNotMatch(src, /QUESTION \$\{Math\.min\(QUESTION_COUNT, rec\.index \+ 1\)\}/);
  });

  test('C10: the feedback note is saved on the way out', () => {
    const src = code('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(src, /const fb = getCareerFinder\(\)\.feedback;\s*if \(fb && fb\.note !== noteRef\.current\) setCareerFinderFeedback\(fb\.answer, noteRef\.current\)/);
  });
});

describe('help and onboarding', () => {
  test('C11: replay hints handles a failed reset', () => {
    const src = code('src/screens/help/HelpScreen.tsx');
    const call = between(src, 'Promise.all([resetCoachMarks()', 'accessibilityRole="button"');
    assert.match(call, /notify\('Couldn’t reset hints'/);
  });

  test('C12: the About attract text is gated on Low-Light', () => {
    const src = code('src/features/onboarding/AttractCue.tsx');
    const text = between(src, 'export function AttractText(', 'const styles');
    assert.match(text, /const suppressed = useOverlaysSuppressed\(\);/);
    assert.match(text, /active && !suppressed && animationsAllowed\(\)/);
  });

  test('C13: the intro seen-read cannot reject unhandled', () => {
    const src = code('src/features/intro/ScreenIntroOverlay.tsx');
    assert.match(src, /INTRO_STORAGE_PREFIX \+ key\);\s*if \(alive && seen == null\) setVisible\(true\);\s*\}\)\(\)\.catch\(\(\) => \{\}\);/);
  });
});
