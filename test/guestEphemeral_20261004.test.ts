/**
 * guestEphemeral — owner rulings 2026-10-04 (receipt key guestEphemeral).
 *
 * 1. "Guest data is ALWAYS deleted, Career Finder included." The guest
 *    (`total`) wipe keeps ONLY the glossary and calculator meters, the device
 *    id, and the device-level onboarding / intro "seen" family (plus the mic
 *    calibration, the dev overrides, and an ACCOUNT's unsent graded work,
 *    which a guest can never create). Guest Mode no longer writes the Career
 *    Finder record back.
 * 2. "The app should open with no user work if in guest mode." A launch whose
 *    session read CONFIRMS no account runs the guest wipe; an UNKNOWN read
 *    (stalled / failed / offline refresh) wipes nothing (K1); a member's
 *    launch wipes nothing; Guest Mode entry claims the launch wipe so a late
 *    answer can never wipe work done after it.
 * 3. Free guest topics: the gate (studyMethodLocked) opens only Pro Audio
 *    Safety (gs3060) and DAW Fundamentals (gs3970) for a known guest; every
 *    study stage on them carries the "not saved" reminder, with wording that
 *    does not promise a carry study and quizzes do not have; a guest cannot
 *    sit a quiz (the server refuses without an account), so the quiz opening
 *    says so instead of BEGIN leading to "account record not found".
 *
 * Behavioural harness: the REAL wipe sweep, the REAL accountLocalSync, the
 * REAL session ledger and safeSessionResult, a fake AsyncStorage and a fake
 * supabase auth. Every other module the wipe imports is a generated no-op
 * stub (they are not what this receipt is about).
 *
 * R2: every case marked [R2] was run against the HEAD copies of the changed
 * files and FAILED (see the report).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// ── fakes ────────────────────────────────────────────────────────────────
type Auth = {
  listeners: ((event: string, session: unknown) => void)[];
  /** What the next getSession() does: answer a session, or fail (unknown). */
  next: { session: unknown } | 'fail' | { pending: Promise<unknown> };
};
const AS = new Map<string, string>();
const auth: Auth = { listeners: [], next: { session: null } };
const g = globalThis as Record<string, unknown>;
g.__GE_AS__ = AS;
g.__GE_AUTH__ = auth;
g.__DEV__ = false;

const dataMod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = dataMod(`
  const s = globalThis.__GE_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
    async multiRemove(ks) { for (const k of ks) s.delete(k); },
  };`);
const FAKE_SUPABASE = dataMod(`
  const a = globalThis.__GE_AUTH__;
  export const supabase = { auth: {
    onAuthStateChange(cb) { a.listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    getSession() { const n = a.next; if (n === 'fail') return Promise.reject(new Error('stalled')); if (n.pending) return n.pending.then((session) => ({ data: { session }, error: null })); return Promise.resolve({ data: { session: n.session }, error: null }); },
  } };`);
const REACT = dataMod(`
  export function useEffect(fn) { fn(); }
  export function useState(v) { return [v, () => {}]; }
  export default { useEffect, useState };`);

const WIPE = 'src/features/account/clearLocalAccountData.ts';
const WIPE_URL = pathToFileURL(join(ROOT, WIPE)).href;
const WIPE_SRC = readFileSync(join(ROOT, WIPE), 'utf8');
const REAL_FROM_WIPE = new Set(['../storage/localStoreRegistry']);
function stubFor(spec: string): string {
  const esc = spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const m = WIPE_SRC.match(new RegExp(`import \\{([^}]+)\\} from '${esc}'`));
  const names = (m?.[1] ?? '').split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean);
  return dataMod(names.map((n) => `export function ${n}() {}`).join('\n'));
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const short = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return short(FAKE_AS);
    if (specifier === 'react') return short(REACT);
    if (/\/lib\/supabase$/.test(specifier)) return short(FAKE_SUPABASE);
    if (context.parentURL === WIPE_URL && specifier.startsWith('.') && !REAL_FROM_WIPE.has(specifier)) {
      return short(stubFor(specifier));
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(c))) return short(c.href);
      }
    }
    return nextResolve(specifier, context);
  },
});
const settle = async () => {
  for (let k = 0; k < 6; k++) {
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise<void>((r) => setImmediate(r));
  }
};

const wipe = await import('../src/features/account/clearLocalAccountData.ts');
const sync = await import('../src/features/account/accountLocalSync.ts');
const carry = await import('../src/features/lab/sessionCarry.ts');

/** A device as a guest left it last launch: their work, plus what must stay. */
const KEPT_FOR_GUEST = {
  'ape:glossaryUsageLocal': '{"n":9}',
  'ape:calc:usageLocal': '{"n":3}',
  'ape:deviceId': 'install-1',
  'ape:intro:appWelcome': '1',
  'ape:coach:flashcards': '5',
  'ape:fcFsGuide': '2',
  'ape:onboarding:complete': '1',
  'ape:homeFirstOpenDone': '1',
  'ape:splCalOffset': '1.5',
};
const GUEST_WORK = {
  'ape:careerfinder:v1': '{"responses":{"q1":4}}',
  'ape:labProgress': '{"units":{"af_amplitude":["reviewed"]}}',
  'ape:localMethod:ach-3060:flashcards': '{"a":1}',
  'ape:production:preprod:v1': '{"projects":[1]}',
  'ape:cymatics:patterns:v1': '[1]',
  'ape:bm:glossary': '["t1"]',
  'ape:glossaryFavs': '["t2"]',
  'ape:roomdesign:v1': '{"rooms":[1]}',
  'ape:enrollmentList': '[{"gs":3060}]',
  'ape:settings': '{"x":1}',
  'ape:profile:showBigPicture': '1',
  'ape:glossary:autoOffline': '0',
  'ape:lab:stageCollapsed': '1',
  'ape:glossaryDeviceKeyConsent': '{"at":1}',
};
function seedGuestDevice(marker: string | null = '') {
  AS.clear();
  for (const [k, v] of Object.entries({ ...KEPT_FOR_GUEST, ...GUEST_WORK })) AS.set(k, v);
  if (marker !== null) AS.set('ape:localUserId', marker);
}
const left = (keys: Record<string, string>) => Object.keys(keys).filter((k) => AS.has(k));

describe('1. the guest wipe keeps exactly the meters, the device id and the onboarding family', () => {
  it('[R2] Guest Mode (total): every work key goes, Career Finder included; meters, device id and seen flags stay', async () => {
    seedGuestDevice();
    await wipe.clearLocalAccountData({ total: true });
    assert.deepEqual(left(GUEST_WORK), [], 'guest work left on the device');
    assert.deepEqual(left(KEPT_FOR_GUEST), Object.keys(KEPT_FOR_GUEST), 'a kept key was wiped');
    assert.equal(AS.get('ape:glossaryUsageLocal'), '{"n":9}');
    assert.equal(AS.get('ape:calc:usageLocal'), '{"n":3}');
  });

  it('[R2] an ACCOUNT’s unsent graded work survives the guest wipe (a guest can never create it)', async () => {
    AS.clear();
    AS.set('ape:finalExamQueue', '[{"user":"u1"}]');
    AS.set('ape:attemptDraft:att-1', '{"answers":{}}');
    await wipe.clearLocalAccountData({ total: true });
    assert.equal(AS.get('ape:finalExamQueue'), '[{"user":"u1"}]');
    assert.equal(AS.get('ape:attemptDraft:att-1'), '{"answers":{}}');
  });

  it('an ACCOUNT switch is unchanged: KEEP (display prefs included) + onboarding + drafts stay, work goes', async () => {
    seedGuestDevice();
    await wipe.clearLocalAccountData();
    assert.deepEqual(left(GUEST_WORK).sort(), ['ape:glossary:autoOffline', 'ape:lab:stageCollapsed', 'ape:profile:showBigPicture']);
    assert.deepEqual(left(KEPT_FOR_GUEST), Object.keys(KEPT_FOR_GUEST));
  });

  it('keepsThroughWipe: the exact guest allowlist', () => {
    const guestKeeps = [...Object.keys(KEPT_FOR_GUEST), 'ape:finalExamQueue', 'ape:attemptDraft:x', 'ape:dev:entitlement'];
    for (const k of guestKeeps) assert.equal(wipe.keepsThroughWipe(k, { total: true }), true, k);
    for (const k of Object.keys(GUEST_WORK)) assert.equal(wipe.keepsThroughWipe(k, { total: true }), false, k);
    assert.equal(wipe.keepsThroughWipe('sb-xyz-auth-token', { total: true }), true, 'never touches non-ape keys');
  });
});

// ── 2. the launch wipe ─────────────────────────────────────────────────────
const fire = (event: string, session: unknown) => {
  for (const l of auth.listeners) l(event, session);
};
/** A fresh launch: a new subscription, a fresh claim, a fresh ledger. */
function launch() {
  auth.listeners.length = 0;
  // Optional call: the R2 run against HEAD (which has no claim) must fail on
  // BEHAVIOUR, not on a missing export.
  (sync as { __resetGuestLaunchWipeForTests?: () => void }).__resetGuestLaunchWipeForTests?.();
  carry.__resetSessionCarryForTests();
  sync.useAccountLocalSync();
}
const MEMBER = { user: { id: 'uid-member', is_anonymous: false } };
const ANON_KEY = { user: { id: 'uid-anon', is_anonymous: true } };

describe('2. a known guest’s launch opens with no user work (and K1 holds)', () => {
  beforeEach(() => {
    auth.next = { session: null };
  });

  it('[R2] a launch CONFIRMED to have no account wipes last launch’s guest work before anything is carried', async () => {
    seedGuestDevice('');
    launch();
    fire('INITIAL_SESSION', null); // re-read: answers "no session"
    await settle();
    assert.deepEqual(left(GUEST_WORK), [], 'last launch’s guest work was read back in');
    assert.deepEqual(left(KEPT_FOR_GUEST), Object.keys(KEPT_FOR_GUEST));
    assert.equal(AS.get('ape:localUserId'), '', 'the no-account marker is written back');
  });

  it('[R2] a guest holding the glossary’s anonymous key is a known guest too', async () => {
    seedGuestDevice('');
    launch();
    fire('INITIAL_SESSION', ANON_KEY);
    await settle();
    assert.deepEqual(left(GUEST_WORK), []);
  });

  it('K1: an UNKNOWN launch read (stalled / failed / offline refresh) wipes NOTHING', async () => {
    seedGuestDevice('uid-member'); // a member whose session read stalled
    auth.next = 'fail';
    launch();
    fire('INITIAL_SESSION', null);
    await settle();
    assert.deepEqual(left(GUEST_WORK), Object.keys(GUEST_WORK), 'a maybe-member was wiped');
    assert.equal(AS.get('ape:localUserId'), 'uid-member');
  });

  it('K1: a member’s launch wipes nothing', async () => {
    seedGuestDevice('uid-member');
    launch();
    fire('INITIAL_SESSION', MEMBER);
    await settle();
    assert.deepEqual(left(GUEST_WORK), Object.keys(GUEST_WORK));
  });

  it('a sign-in that lands before the launch read answers owns the decision: no guest wipe', async () => {
    seedGuestDevice('uid-member');
    let release!: (v: unknown) => void;
    // The launch re-read is slow; the member signs in before it answers.
    auth.next = { pending: new Promise((r) => (release = r)) };
    launch();
    fire('INITIAL_SESSION', null);
    fire('SIGNED_IN', MEMBER);
    release(null); // …then the stale launch read answers "no session"
    await settle();
    assert.deepEqual(left(GUEST_WORK), Object.keys(GUEST_WORK), 'the stale launch answer wiped a signed-in member');
    assert.equal(AS.get('ape:localUserId'), 'uid-member');
  });

  it('[R2] Guest Mode entry claims the launch wipe: a launch answer arriving after it never runs a second wipe', async () => {
    seedGuestDevice('');
    launch();
    assert.equal(sync.claimGuestLaunchWipe(), true, 'Guest Mode entry claims first');
    // Guest Mode's own wipe has run, and the guest starts new work…
    await wipe.clearLocalAccountData({ total: true });
    AS.set('ape:labProgress', '{"units":{"af_wave_physics":["w1"]}}');
    // …then the launch read answers late.
    fire('INITIAL_SESSION', null);
    await settle();
    assert.equal(AS.get('ape:labProgress'), '{"units":{"af_wave_physics":["w1"]}}', 'the late launch answer wiped the guest’s new work');
    assert.equal(sync.claimGuestLaunchWipe(), false, 'one per launch');
  });

  it('the wipe never races a carry: the hand-off settles on the same queue, after it', () => {
    const s = read('src/features/account/accountLocalSync.ts');
    assert.match(s, /const guestLaunch = launch && identity === '' && claimGuestLaunchWipe\(\);\s*chain = chain\.then\(\(\) => \(guestLaunch \? wipeGuestLaunch\(\) : syncLocalToIdentity\(identity\)\)\)\.catch\(\(\) => \{\}\);\s*chain = chain\.then\(\(\) => settleSessionCarry\(\)\)\.catch\(\(\) => \{\}\);/);
    // Only the launch's own answer can be a guest launch — never a sign-out
    // mid-session, never the TOKEN_REFRESHED recovery path.
    assert.match(s, /settle\(result\.data\.session as AnySession, true\);/);
    assert.match(s, /settle\(session, event === 'INITIAL_SESSION'\);/);
    assert.match(s, /if \(event === 'TOKEN_REFRESHED' && session && !decided\) \{\s*events \+= 1;\s*settle\(session\);/);
  });
});

describe('2b. Guest Mode entry', () => {
  const auth2 = read('src/screens/auth/AuthScreen.tsx');
  const guest = auth2.slice(auth2.indexOf('const enterGuest = async'), auth2.indexOf('const onCreateAccount'));
  it('[R2] keeps no Career Finder record and no amplitude-flag reset; claims the launch wipe before its queue', () => {
    assert.ok(!guest.includes('ape:careerfinder:v1'));
    assert.ok(!guest.includes('resetAmplitudeOrientation'));
    const claim = guest.indexOf('claimGuestLaunchWipe();');
    assert.ok(claim > 0 && claim < guest.indexOf('await runAfterAccountSync('));
  });
  it('[R2] the Career Finder never tells a known guest their answers stay on this phone', () => {
    const s = read('src/screens/careerfinder/CareerFinderScreen.tsx');
    assert.match(s, /const guest = useGuestWording\(\)\.guest;/);
    assert.match(s, /guestTrust: 'Free\. You’re not signed in, so your answers are erased when you close the app\. Sign in first to keep them\.'/);
    assert.match(s, /saving \? \(guest \? FINDER_INTRO\.guestTrust : upsell \? FINDER_INTRO\.trust : 'Your answers stay on this phone\.'\)/);
    assert.match(s, /saving \? \(guest \? 'kept until you close the app' : 'saved on this phone'\)/);
  });
});

// ── 3. free guest topics ───────────────────────────────────────────────────
const gate = await import('../src/features/commercial/studyGate.ts');
const rules = await import('../src/features/lab/guestReminderRules.ts');
const FREE = [3060, 3970]; // Pro Audio Safety, DAW Fundamentals & Session Management

describe('3. a guest touches only Pro Audio Safety and DAW Fundamentals', () => {
  it('VERIFY: a known guest is locked out of every other topic, and the ★ list', () => {
    const src = read('src/features/enrollment/enrollmentStore.ts');
    assert.match(src, /export const FREE_ENROLL_GS: readonly number\[\] = \[3060, 3970\];/);
    const guestAt = (gs: number | null) => gate.studyMethodLocked({ resolved: true, entitlement: 'anonymous', displayedGs: gs, freeGs: FREE });
    for (const gs of FREE) assert.equal(guestAt(gs), false, `free topic gs${gs} must open`);
    for (let gs = 3000; gs <= 4999; gs++) if (!FREE.includes(gs)) assert.equal(guestAt(gs), true, `gs${gs} opened for a guest`);
    assert.equal(guestAt(null), true, 'a pseudo-topic fails closed');
    assert.equal(gate.customListLocked({ resolved: true, entitlement: 'anonymous' }), true);
  });

  it('VERIFY: every study method and the quiz consult the gate before opening; the resume shortcut needs a confirmed member', () => {
    const d = read('src/screens/dashboard/DashboardScreen.tsx');
    // Method switch and quiz switch: the gate is the first thing each press does.
    assert.match(d, /onPress=\{\(\) => \{\s*\/\/ Locked\/paid topic \+ non-member → the study-access sheet\s*\/\/ instead of opening the study method\.\s*if \(actMembershipLocked\) \{\s*setUpgradeOpen\(true\);\s*return;\s*\}\s*const routeName = STUDY_ROUTES\[m\.key\];/);
    assert.match(d, /onPress=\{\(\) => \{\s*if \(actMembershipLocked\) \{\s*setUpgradeOpen\(true\);\s*return;\s*\}\s*\/\/ A KNOWN GUEST CANNOT SIT A QUIZ/);
    assert.match(d, /if \(customListLocked\) \{\s*setUpgradeOpen\(true\);/);
    // The only navigations into the study screens are those (plus a dev bypass).
    assert.equal((d.match(/navigation\.navigate\(routeName,/g) ?? []).length, 2);
    assert.equal((d.match(/navigation\.navigate\('Quiz',/g) ?? []).length, 1);
    const e = read('src/screens/enrollment/EnrollmentScreen.tsx');
    assert.match(e, /if \(lastLoc\?\.kind === 'method' && paidResolved\) \{/);
  });

  it('[R2] the study reminder never promises a carry (study progress is not carried into an account)', () => {
    for (const open of [true, false]) {
      const body = rules.guestReminderBody('study', open);
      assert.equal(body, 'Your study progress on this topic isn’t saved or credited while you’re not signed in. It’s erased when you close the app, and signing in later won’t keep it. Sign in first to keep your progress.');
      assert.doesNotMatch(body, /before you close the app/);
      assert.equal(rules.guestReminderNote('study', open), 'Not signed in — study progress here isn’t saved or credited. Sign in first to keep it.');
    }
    // The lab wording is unchanged.
    assert.match(rules.guestReminderBody('credit', true), /Sign in before you close the app and what you did this session is kept\./);
    // And study is truly not on the session ledger.
    for (const f of ['src/features/study/localProgress.ts', 'src/screens/study/FlashcardsScreen.tsx', 'src/screens/study/MatchingScreen.tsx', 'src/screens/study/FillInBlankScreen.tsx', 'src/screens/study/ScenariosScreen.tsx']) {
      assert.doesNotMatch(read(f), /holdSessionWork|registerSessionCarry/, f);
    }
  });

  it('[R2] every study stage shows it, once per stage per guest session, a known guest only', () => {
    const at: Record<string, string> = {
      'src/screens/study/FlashcardsScreen.tsx': '<GuestStartReminder activity="study:flashcards" kind="study" hold={!introsSettled} />',
      'src/screens/study/MatchingScreen.tsx': '<GuestStartReminder activity="study:matching" kind="study" />',
      'src/screens/study/FillInBlankScreen.tsx': '<GuestStartReminder activity="study:fill_in_blank" kind="study" />',
      'src/screens/study/ScenariosScreen.tsx': '<GuestStartReminder activity="study:scenarios" kind="study" style={{ alignSelf: \'stretch\' }} />',
    };
    for (const [f, tag] of Object.entries(at)) assert.ok(read(f).includes(tag), f);
    assert.equal(rules.remindAsGuest('guest', true), true);
    assert.equal(rules.remindAsGuest('guest', false), false, 'never a maybe-member (D52)');
    assert.equal(rules.remindAsGuest('member', false), false);
    rules.resetGuestReminders();
    assert.equal(rules.claimGuestReminder('study:flashcards'), true);
    assert.equal(rules.claimGuestReminder('study:flashcards'), false);
    // The component waits out a host's own intro (K10) and stays inline in Low-Light.
    const c = read('src/features/lab/GuestStartReminder.tsx');
    assert.match(c, /if \(!asGuest \|\| !focused \|\| suppressed \|\| hold\) return;/);
  });

  it('[R2] the quiz: a known guest is told it needs an account, every time, instead of BEGIN', () => {
    assert.equal(rules.GUEST_QUIZ_BODY, 'Topic quizzes are graded and recorded on an account, so you need to be signed in to take one. As a guest, a quiz result can’t be saved or credited.');
    const d = read('src/screens/dashboard/DashboardScreen.tsx');
    assert.match(d, /const quizAsGuest = remindAsGuest\(tierForTerms, guestWording\.guest\);/);
    const guestAt = d.indexOf('if (quizAsGuest) {');
    assert.ok(guestAt > 0 && guestAt < d.indexOf("'BEFORE YOU BEGIN',"));
    assert.match(d, /if \(quizAsGuest\) \{\s*confirmDialog\(\s*GUEST_REMINDER_TITLE,\s*GUEST_QUIZ_BODY,\s*GUEST_REMINDER_SIGN_IN,\s*\(\) => \(navigation as any\)\.navigate\('Auth'\),\s*\{ cancelText: GUEST_QUIZ_NOT_NOW \},\s*\);\s*return;\s*\}/);
    const q = read('src/screens/quiz/QuizScreen.tsx');
    assert.match(q, /\{startErrorCode === 'user_not_found' && quizAsGuest \? GUEST_QUIZ_START_REFUSED : startError\}/);
    assert.match(q, /const quizAsGuest = remindAsGuest\(useTier\(\), useGuestWording\(\)\.guest\);/);
  });
});

it('Career Finder never tells a guest their answers are "saved" (lead, 2026-10-04)', () => {
  const quiz = readFileSync(new URL('../src/screens/careerfinder/CareerFinderQuizScreen.tsx', import.meta.url), 'utf8');
  const cur = readFileSync(new URL('../src/screens/curriculum/CurriculumScreen.tsx', import.meta.url), 'utf8');
  assert.match(quiz, /guest \? 'Leave the questions\. Your answers are kept until you close the app\.'/);
  assert.match(cur, /finderGuest \? 'Your answers are kept until you close the app\.'/);
});
