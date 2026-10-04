/**
 * guestCareer — owner decisions 2026-10-04 (receipt key guestCareer).
 *
 * 1. GUEST LAB CREDIT: "a guest who signs in yes carries, but not if they
 *    sign out or close app first. guest always wipes data for privacy."
 *    The same-session carry already worked (test/guestSessionCarry20261001).
 *    The gap: between a sign-in and that sign-in's device wipe, the lab
 *    credit store still held the device's PREVIOUS occupant's units — a
 *    guest who closed the app before signing in (their units were stored,
 *    and the boot read loaded them), or work done after a sign-out — and
 *    `mark_lab_complete` sent in that window credited them to the account
 *    just signed into. Now nothing is credited until the wipe has run.
 * 2. GUEST SAVE REMINDER before they begin: the words, the once-per-activity
 *    rule, who sees it, and where it is wired.
 * 3. CAREER FINDER on createLocalStore: the old record loads untouched, the
 *    three faces, and a change made while the record was unreadable is
 *    written on top of it once it can be read (it used to be lost).
 *
 * R2: every behavioural case marked [R2] was run against the HEAD copies of
 * the changed files and FAILED (see the report).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string>; failGet: boolean };
const kv: Kv = { map: new Map(), failGet: false };
/** The session the next rpc goes out under ('' = none), and a gate that
 *  holds rpc answers (an offline boot retry). */
type Rpc = { session: string; gate: Promise<void> | null; offline: boolean; calls: { lab: string; session: string; ok: boolean }[] };
const rpc: Rpc = { session: '', gate: null, offline: false, calls: [] };
const g = globalThis as unknown as { __gcKv: Kv; __gcRpc: Rpc; __DEV__: boolean };
g.__gcKv = kv;
g.__gcRpc = rpc;
g.__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__gcKv; export default {
    getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  // The request carries the session it was SENT with; the server credits that
  // account. An answer may be held (offline) by the gate.
  supabase: `export const supabase = { rpc: async (name, args) => {
    const r = globalThis.__gcRpc; const session = r.session;
    if (r.gate) await r.gate;
    if (r.offline) throw new Error('network');
    const ok = !!session;
    r.calls.push({ lab: args.p_lab_key, session, ok });
    return ok ? { data: { audio_fundamentals_complete: false }, error: null } : { data: null, error: { message: 'user_not_found' } };
  } };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
  careerIndex: `export const familyFieldOf = () => null;`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (n: string) => ({ url: `gc-stub:${n}`, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub('async-storage');
    if (/\/lib\/supabase$/.test(specifier)) return stub('supabase');
    if (/\/study\/sync$/.test(specifier)) return stub('sync');
    if (/\/review\/reviewPrompt$/.test(specifier)) return stub('reviewPrompt');
    // careerIndex reads a 217 KB JSON; the store only needs familyFieldOf.
    if (specifier === './careerIndex' && context.parentURL?.includes('careerfinder')) return stub('careerIndex');
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('gc-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('gc-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => {
  for (let i = 0; i < 8; i++) await tick();
};

const carry = await import('../src/features/lab/sessionCarry.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

/** accountLocalSync's order: note the identity at the event, wipe if it
 *  changed, then settle the hand-off. `beforeWipe` runs in the window
 *  between the event and its wipe (a lab screen mounting, a boot retry). */
async function authEvent(identity: string, wipe: boolean, beforeWipe?: () => Promise<void> | void): Promise<void> {
  rpc.session = identity;
  carry.noteSessionIdentity(identity);
  if (beforeWipe) await beforeWipe();
  if (wipe) {
    for (const k of [...kv.map.keys()]) if (k.startsWith('ape:')) kv.map.delete(k);
    registry.resetRegisteredLocalStores();
    completion.resetLocal();
  }
  await carry.settleSessionCarry();
  await settle();
}
const credited = (uid: string) => rpc.calls.filter((c) => c.ok && c.session === uid).map((c) => c.lab);

// ── 1. guest lab credit ─────────────────────────────────────────────────────

// LAUNCH 2 of a phone whose LAUNCH 1 was a guest who completed two labs and
// closed the app without signing in: their units are on the device.
carry.__resetSessionCarryForTests();
kv.map.set(
  'ape:labProgress',
  JSON.stringify({ units: { af_amplitude: ['reviewed'], af_sound_playground: ['reviewed'] }, sent: [], af: false }),
);
// Offline at boot: the boot retry's first answer is held.
let releaseBoot!: () => void;
rpc.gate = new Promise<void>((r) => (releaseBoot = r));
// INITIAL_SESSION with no account (the guest identity) — then the store loads
// at boot and its retry goes out with no session.
carry.noteSessionIdentity('');
await carry.settleSessionCarry();
const completion = await import('../src/features/lab/labCompletion.ts');
await settle();
const bootCalls = rpc.calls.length;

describe('1. guest lab credit carries only within the session', () => {
  it('[R2] a guest who CLOSED THE APP before signing in: the stored units are never credited to the account signed into next', async () => {
    // The person signs in on launch 2 while the boot retry is still out.
    await authEvent('uid-next', true, async () => {
      rpc.gate = null;
      releaseBoot(); // the boot retry's first answer lands (no session: refused)…
      await settle(); // …and it moves on to the second completed lab, inside the window
    });
    await settle();
    assert.equal(bootCalls, 0, 'precondition: the first boot answer was held');
    assert.ok(rpc.calls.some((c) => c.session === ''), 'precondition: the boot retry ran with no session');
    assert.deepEqual(credited('uid-next'), [], 'a previous launch’s guest units were credited to the new account');
    assert.equal(completion.isLabDone('af_amplitude') || completion.isLabDone('af_sound_playground'), false, 'the wipe emptied them');
  });

  it('[R2] work done after a SIGN-OUT is never credited to the next account, even if a lab re-checks before the wipe', async () => {
    carry.__resetSessionCarryForTests();
    kv.map.clear();
    rpc.calls.length = 0;
    await authEvent('uid-a', true); // member A signs in
    await authEvent('', true); // A signs out (owner = null: nothing carried from here)
    completion.markLabReviewed('af_signal_chain'); // done after the sign-out
    await settle();
    assert.deepEqual(credited(''), [], 'precondition: no account to credit');
    await authEvent('uid-b', true, async () => {
      // A lab screen mounting in the window re-checks completion.
      completion.registerLabUnits('af_signal_chain', ['reviewed']);
      await settle();
    });
    assert.deepEqual(credited('uid-b'), [], 'work done after A signed out was credited to B');
    assert.equal(completion.isLabDone('af_signal_chain'), false);
  });

  it('control: a SAME-SESSION guest who signs in is credited (after the wipe, by the hand-off)', async () => {
    carry.__resetSessionCarryForTests();
    kv.map.clear();
    rpc.calls.length = 0;
    await authEvent('', false); // a guest launch
    completion.markLabReviewed('af_amplitude');
    await settle();
    await authEvent('uid-c', true, async () => {
      completion.registerLabUnits('af_amplitude', ['reviewed']); // a re-check in the window waits
      await settle();
      assert.deepEqual(credited('uid-c'), [], 'nothing is sent before the wipe');
    });
    assert.deepEqual(credited('uid-c'), ['af_amplitude'], 'the guest’s own session work reaches the account');
    assert.ok(completion.isLabDone('af_amplitude'));
  });

  it('control: a member whose completion was held back in the window gets it once their (no-op) device sync settles', async () => {
    carry.__resetSessionCarryForTests();
    kv.map.clear();
    rpc.calls.length = 0;
    // The member finished a lab OFFLINE: recorded, not sent.
    await authEvent('uid-m', true);
    rpc.offline = true;
    completion.markLabReviewed('af_amplitude');
    await settle();
    rpc.offline = false;
    rpc.calls.length = 0;
    // Their next launch: the first auth answer is noted, a retry runs before
    // its (no-op, same person) device sync settles, then the settle.
    carry.__resetSessionCarryForTests();
    rpc.session = 'uid-m';
    carry.noteSessionIdentity('uid-m');
    completion.registerLabUnits('af_amplitude', ['reviewed']);
    await settle();
    assert.equal(carry.sessionWipePending(), true);
    assert.deepEqual(credited('uid-m'), [], 'held while the device sync is pending');
    await carry.settleSessionCarry();
    await settle();
    assert.deepEqual(credited('uid-m'), ['af_amplitude'], 'sent once the device is theirs');
  });

  it('the wiring: fireComplete waits on the pending wipe, and retries on settle', () => {
    const s = read('src/features/lab/labCompletion.ts');
    assert.match(s, /async function fireComplete\(labKey: string\): Promise<void> \{\s*if \(sent\.has\(labKey\)\) return;[\s\S]{0,900}?if \(sessionWipePending\(\)\) return;\s*const gen = completionGen;/);
    assert.match(s, /^onSessionCarrySettled\(\(\) => \{\s*void retryUnsent\(\);\s*\}\);/m);
    const c = read('src/features/lab/sessionCarry.ts');
    assert.match(c, /syncPending = false;\s*for \(const l of \[\.\.\.settledListeners\]\)/);
  });
});

// ── 2. the guest save reminder ──────────────────────────────────────────────

// Loaded per test (not at the top), so on a tree without the module each case
// fails on its own instead of stopping the file (R2).
type Rules = typeof import('../src/features/lab/guestReminderRules.ts');
let rules: Rules;

describe('2. the guest save reminder before they begin', () => {
  beforeEach(async () => {
    carry.__resetSessionCarryForTests();
    rules = await import('../src/features/lab/guestReminderRules.ts');
    rules.resetGuestReminders();
  });

  it('[R2] the words: not saved or credited; signing in THIS session keeps it; closing first erases it', () => {
    assert.equal(rules.GUEST_REMINDER_TITLE, 'You’re not signed in');
    assert.equal(rules.GUEST_REMINDER_SIGN_IN, 'Sign in');
    assert.equal(rules.GUEST_REMINDER_CONTINUE, 'Continue as guest');
    assert.equal(
      rules.guestReminderBody('credit', true),
      'Your progress in this session won’t be saved or credited unless you sign in. Sign in before you close the app and what you did this session is kept. Close the app first and it’s erased.',
    );
    // Start Here earns no credit for anyone: "saved" only.
    assert.equal(
      rules.guestReminderBody('progress', true),
      'Your progress in this session won’t be saved unless you sign in. Sign in before you close the app and what you did this session is kept. Close the app first and it’s erased.',
    );
    // After a sign-out this session the ledger is closed: no promise that
    // signing in later keeps what is done now.
    assert.equal(rules.guestReminderBody('credit', false), 'Your progress won’t be saved or credited. Sign in first to keep it.');
    assert.doesNotMatch(rules.guestReminderBody('credit', false), /kept|before you close/);
    assert.equal(rules.guestReminderNote('credit', true), 'Not signed in — progress here isn’t saved or credited. Sign in before you close the app to keep it.');
    assert.equal(rules.guestReminderNote('progress', false), 'Not signed in — progress here isn’t saved. Sign in first to keep it.');
    // No upsell, no jargon.
    for (const w of [rules.guestReminderBody('credit', true), rules.guestReminderNote('credit', true)]) {
      assert.doesNotMatch(w, /free|member|upgrade|subscri|academy/i);
    }
  });

  it('[R2] only a KNOWN guest: never unknown, never a members-only preview, never a member or free account', () => {
    assert.equal(rules.remindAsGuest('guest', true), true);
    assert.equal(rules.remindAsGuest('guest', false), false, 'a signed-in learner whose check failed reads "guest" by tier — useGuestWording says no');
    for (const t of ['unknown', 'preview', 'free', 'member'] as const) assert.equal(rules.remindAsGuest(t, true), false, t);
  });

  it('[R2] once per activity per guest session; a new guest session (sign-out, fresh Guest Mode) or the wipe reminds again', () => {
    assert.equal(rules.claimGuestReminder('lab:af_wave_physics'), true);
    assert.equal(rules.claimGuestReminder('lab:af_wave_physics'), false, 'a module of the same lab does not remind again');
    assert.equal(rules.claimGuestReminder('lab:af_amplitude'), true, 'another activity does');
    carry.restartGuestSession(); // Guest Mode again: a new guest session
    assert.equal(rules.claimGuestReminder('lab:af_wave_physics'), true);
    assert.equal(rules.claimGuestReminder('lab:af_wave_physics'), false);
    registry.resetRegisteredLocalStores(); // the account wipe
    assert.equal(rules.claimGuestReminder('lab:af_wave_physics'), true);
  });

  it('[R2] the component: a centred house popup after the push, inline in Low-Light, decided by useGuestWording', () => {
    const s = read('src/features/lab/GuestStartReminder.tsx');
    assert.match(s, /const asGuest = remindAsGuest\(tier, wording\.guest\);/);
    assert.match(s, /const wording = useGuestWording\(\);/);
    assert.match(s, /const suppressed = useOverlaysSuppressed\(\);/);
    // The popup: the house confirm (AppDialog hosts itself in an open Modal —
    // never Modal over Modal), Sign in / Continue as guest.
    assert.match(s, /confirmDialog\(GUEST_REMINDER_TITLE, guestReminderBody\(kind, sessionCarryOpen\(\)\), GUEST_REMINDER_SIGN_IN, signIn, \{\s*cancelText: GUEST_REMINDER_CONTINUE,\s*\}\);/);
    assert.doesNotMatch(s, /from 'react-native'[^;]*\bModal\b|Alert\.alert/);
    // Never auto-appears in Low-Light (checked at effect time AND at show time).
    assert.match(s, /if \(!asGuest \|\| !focused \|\| suppressed\) return;/);
    assert.match(s, /if \(areOverlaysSuppressed\(\)\) return;\s*\/\/[^\n]*\n\s*if \(!claimGuestReminder\(activity\)\) return;/);
    // …after the native push ends (iOS refuses a presentation mid-push).
    assert.match(s, /addListener\?\.\('transitionEnd'/);
    // Low-Light: the inline note instead, only for a known guest.
    assert.match(s, /if \(!asGuest \|\| !suppressed\) return null;/);
    assert.match(s, /guestReminderNote\(kind, sessionCarryOpen\(\)\)/);
  });

  it('[R2] wired where a guest can begin credited work: the shared lab shells and the free labs', () => {
    const sites: [string, RegExp][] = [
      ['src/screens/lab/LabShell.tsx', /<GuestStartReminder activity=\{`lab:\$\{labId\}`\}/],
      ['src/screens/lab/kit/PagedLab.tsx', /<GuestStartReminder activity=\{`paged:\$\{labId\}`\} kind=\{creditLabKey \? 'credit' : 'progress'\}/],
      ['src/screens/lab/wave/WaveLabHomeScreen.tsx', /<GuestStartReminder activity="lab:af_wave_physics" \/>/],
      ['src/screens/lab/wave/WaveModuleScreen.tsx', /<GuestStartReminder activity="lab:af_wave_physics"/],
      ['src/screens/lab/foundations/FoundationsCourseScreen.tsx', /<GuestStartReminder activity=\{`lab:\$\{FOUNDATIONS_LAB_KEY\}`\} \/>/],
      ['src/screens/lab/amplitude/AmplitudeOrientation.tsx', /<GuestStartReminder activity="lab:af_amplitude" \/>\s*<AmplitudeColorBody alsoReviewLab \/>/],
      ['src/screens/startHere/StartHereScreen.tsx', /<GuestStartReminder activity="startHere" kind="progress"/],
    ];
    for (const [file, re] of sites) assert.match(read(file), re, file);
    // The free labs a guest can open live (not a members-only preview) are
    // exactly these three, plus Start Here — if the catalog frees another,
    // it must get the reminder too (LabShell / PagedLab carry it already).
    const cat = read('src/screens/lab/labCatalog.ts');
    const fundamentals = cat.slice(cat.indexOf("id: 'sound',"), cat.indexOf("id: 'mixingworkflow',"));
    const free = [...fundamentals.matchAll(/\{ name: '[^']+', blurb: '(?:[^'\\]|\\.)*', route: '(\w+)'(?:, params: \{[^}]*\})?(, key: '\w+')?( ?, member: true)?/g)]
      .filter((m) => !m[3])
      .map((m) => m[1]);
    assert.deepEqual(free.sort(), ['AmplitudeLab', 'FoundationsCourse', 'WaveLab']);
  });
});

// ── 3. Career Finder on the house store ─────────────────────────────────────

const finder = await import('../src/features/careerfinder/store.ts');
const { QUESTIONS } = await import('../src/features/careerfinder/questions.ts');
const KEY = 'ape:careerfinder:v1';
const stored = () => JSON.parse(kv.map.get(KEY) ?? 'null');

describe('3. Career Finder data on createLocalStore', () => {
  beforeEach(async () => {
    kv.map.clear();
    kv.failGet = false;
    finder.resetLocal();
    await settle();
  });

  it('an existing record (the only key it ever had) loads with every field — no migration, nothing lost', async () => {
    const old = {
      version: 'career-finder-v1',
      responses: { [QUESTIONS[0].id]: 4, [QUESTIONS[1].id]: null, [QUESTIONS[2].id]: 1 },
      index: 3,
      completed: true,
      completedAt: '2026-09-20T10:00:00.000Z',
      dimensionScores: { LIV: 0.75 },
      rankedFamilyIds: ['live-sound', 'broadcast'],
      saved: ['live-sound', 'mastering'],
      feedback: { answer: 'somewhat', note: 'close', at: '2026-09-20T10:05:00.000Z' },
    };
    kv.map.set(KEY, JSON.stringify(old));
    finder.resetLocal();
    await finder.hydrateCareerFinder();
    assert.deepEqual(finder.getCareerFinder(), old);
    assert.equal(finder.careerFinderFace(), 'ready');
    // A change writes the same key, same shape, everything else kept.
    finder.toggleSavedFamily('broadcast');
    await settle();
    assert.deepEqual(stored(), { ...old, saved: ['live-sound', 'mastering', 'broadcast'] });
  });

  it('[R2] three faces: loading → ready (a truly empty first visit) / unreadable', async () => {
    finder.resetLocal();
    assert.equal(finder.careerFinderFace(), 'loading');
    await finder.hydrateCareerFinder();
    assert.equal(finder.careerFinderFace(), 'ready');
    assert.equal(finder.answeredCount(), 0);
    kv.failGet = true;
    finder.resetLocal();
    await finder.hydrateCareerFinder();
    assert.equal(finder.careerFinderFace(), 'unreadable');
    assert.equal(finder.isCareerFinderSaving(), false, '★ NOT SAVED / "not being saved" wording');
  });

  it('[R2] a ★ and an answer given while the record was UNREADABLE are never written over it — and land on top of it once it reads', async () => {
    kv.map.set(KEY, JSON.stringify({
      version: 'career-finder-v1', responses: { [QUESTIONS[0].id]: 3 }, index: 1, completed: false, completedAt: null,
      dimensionScores: null, rankedFamilyIds: null, saved: ['mastering'], feedback: null,
    }));
    kv.failGet = true;
    finder.resetLocal();
    await finder.hydrateCareerFinder();
    assert.equal(finder.careerFinderFace(), 'unreadable');
    const before = kv.map.get(KEY);
    finder.toggleSavedFamily('broadcast');
    finder.answerQuestion(QUESTIONS[1].id, 2 as never);
    await settle();
    assert.equal(kv.map.get(KEY), before, 'nothing written over the record that could not be read');
    assert.deepEqual(finder.getCareerFinder().saved, ['broadcast'], 'the screen shows the ★ (worded NOT SAVED)');
    assert.equal(finder.isCareerFinderSaving(), false);
    // Storage answers again; the next read applies this session's changes ON
    // TOP of the stored record and writes them.
    kv.failGet = false;
    await finder.hydrateCareerFinder();
    await settle();
    assert.equal(finder.careerFinderFace(), 'ready');
    assert.equal(finder.isCareerFinderSaving(), true);
    assert.deepEqual(stored().saved, ['mastering', 'broadcast']);
    assert.deepEqual(stored().responses, { [QUESTIONS[0].id]: 3, [QUESTIONS[1].id]: 2 });
  });

  it('[R2] a ★ tapped before the read lands decides from what was shown, and never undoes a stored ★ (HEAD flipped it OFF)', async () => {
    kv.map.set(KEY, JSON.stringify({
      version: 'career-finder-v1', responses: {}, index: 0, completed: false, completedAt: null,
      dimensionScores: null, rankedFamilyIds: null, saved: ['broadcast'], feedback: null,
    }));
    finder.resetLocal();
    finder.toggleSavedFamily('broadcast'); // shown ☆ while loading → intent: ADD
    await settle();
    assert.deepEqual(stored().saved, ['broadcast'], 'a blind flip would have removed it');
  });

  it('the account wipe reaches it (registered at creation) and the next read is the swept key', async () => {
    finder.toggleSavedFamily('live-sound');
    await settle();
    assert.deepEqual(finder.getCareerFinder().saved, ['live-sound']);
    kv.map.delete(KEY);
    registry.resetRegisteredLocalStores();
    await finder.hydrateCareerFinder();
    assert.deepEqual(finder.getCareerFinder().saved, []);
  });

  it('[R2] on the house store: no direct AsyncStorage in the Finder; the ratchet list no longer names it', () => {
    const s = read('src/features/careerfinder/store.ts');
    assert.match(s, /const store = createLocalStore<FinderRecord>\(\{ key: KEY, empty: EMPTY, parse: clean \}\);/);
    assert.doesNotMatch(s, /import AsyncStorage|AsyncStorage\./);
    assert.doesNotMatch(read('test/failedSaveNotice_20261003.test.ts'), /'features\/careerfinder\/store\.ts'/);
    assert.doesNotMatch(read('test/failedSaveNoticeLegacy_20261003.test.ts'), /'features\/careerfinder\/store\.ts'/);
  });

  it('[R2] the screens: hub says "Loading", quiz seeds once the record is KNOWN, results have all three faces', () => {
    const hub = read('src/screens/careerfinder/CareerFinderScreen.tsx');
    assert.match(hub, /face === 'loading' \? \(\s*<Text style=\{styles\.note\} accessibilityLiveRegion="polite">Loading your answers…<\/Text>/);
    assert.match(read('src/screens/careerfinder/CareerFinderQuizScreen.tsx'), /const hydrated = useCareerFinderFace\(\) !== 'loading';/);
    const res = read('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(res, /'Loading your results…'/);
    assert.match(res, /'Your saved answers and results could not be read on this phone, so there is nothing to show yet\. Go back and open the Career Finder again to retry\.'/);
    assert.match(res, /'No results yet — answer the questions first\.'/);
    // Hunt 13's ★ honesty is kept.
    assert.match(res, /saved \? \(saving \? '★ SAVED' : '★ NOT SAVED'\) : '☆ SAVE'/);
    assert.match(read('src/screens/careerfinder/CareerFamilyScreen.tsx'), /STARRED — NOT SAVED ON THIS PHONE/);
  });
});
