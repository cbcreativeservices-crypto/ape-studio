/**
 * FINAL FIX ROUND D (2026-10-03) — owner recommendations under D48, "favor
 * consistency and learning outcomes".
 *
 * 1. A stalled session read was "signed out": Redeem told a signed-in member to
 *    sign in, and the tube card said "needs an active Academy sign-in". The
 *    helper now has `safeSessionResult()` ({ result, timedOut }); both sites
 *    say "couldn't reach your account" / reason 'network'.
 * 2. Profile's publish manifest stated "0 certificates you have earned" after
 *    a FAILED credentials read. A failed read is now remembered (credsFailed).
 * 3. fetchConceptById returned null for an error AND for "no row", so a
 *    deleted concept offered a RETRY that could never work.
 * 4. push.ts: clearLastNotificationResponseAsync() had no catch.
 * 5. localSchedule: the seen term count was advanced before the pending
 *    new-terms record was persisted, so a refused write lost the rise.
 * 6. Glossary screen: a server limit-reached on an 'open' gate said "still
 *    being checked" while the popup said MEMBERSHIP_NOT_CONFIRMED.
 * 7. Glossary fallback meter's "already charged" set lived per MOUNT; the
 *    ruling is per SESSION ("once opened, free for the session").
 *
 * R2: every test fails against the HEAD files.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// ── 1 ──────────────────────────────────────────────────────────────────────
test('1 · safeSessionResult says when the session read did not come back', async () => {
  const mod = (await import('../src/lib/getSessionSafe.ts')) as Record<string, unknown>;
  const fn = mod.safeSessionResult as
    | ((p: Promise<{ data: { session: unknown } }>, w: string) => Promise<{ result: { data: { session: unknown } }; timedOut: boolean }>)
    | undefined;
  assert.equal(typeof fn, 'function', 'no way to tell a stalled read from "signed out"');
  const ok = await fn!(Promise.resolve({ data: { session: { user: { id: 'u1' } } } }), 'test');
  assert.equal(ok.timedOut, false);
  assert.deepEqual(ok.result.data.session, { user: { id: 'u1' } });
  const signedOut = await fn!(Promise.resolve({ data: { session: null } }), 'test');
  assert.equal(signedOut.timedOut, false, 'a real "no session" is not a stall');
  const rejected = await fn!(Promise.reject(new Error('keychain')), 'test');
  assert.equal(rejected.timedOut, true);
  assert.equal(rejected.result.data.session, null, 'still falls back to no session');
  // The original helper keeps its behaviour for every existing caller.
  const plain = await (mod.safeSession as (p: Promise<unknown>, w: string) => Promise<{ data: { session: unknown } }>)(
    Promise.reject(new Error('keychain')),
    'test',
  );
  assert.deepEqual(plain, { data: { session: null } });
});

test('1 · safeSessionResult reports a STALL as timedOut', { timeout: 15000 }, async () => {
  const mod = (await import('../src/lib/getSessionSafe.ts')) as Record<string, unknown>;
  const fn = mod.safeSessionResult as ((p: Promise<unknown>, w: string) => Promise<{ timedOut: boolean }>) | undefined;
  assert.equal(typeof fn, 'function');
  const warn = console.warn;
  console.warn = () => {};
  try {
    const r = await fn!(new Promise(() => {}), 'test');
    assert.equal(r.timedOut, true);
  } finally {
    console.warn = warn;
  }
});

test('1 · Redeem says "couldn\'t reach your account" on a stalled read, not "sign in first"', () => {
  const s = stripComments(read('src/features/commercial/accessCode.ts'));
  assert.match(s, /safeSessionResult\(supabase\.auth\.getSession\(\), 'accessCode'\)/);
  assert.match(s, /if \(timedOut\) return result\('error', \{ message: SESSION_UNREACHED_MESSAGE \}\);/);
  assert.match(
    s,
    /SESSION_UNREACHED_MESSAGE =\s*'We couldn’t reach your account just now — check your connection and try again\.'/,
  );
  // The stall check runs BEFORE the signed-in check.
  assert.ok(s.indexOf('if (timedOut)') < s.indexOf("return result('not_authenticated')"));
});

test("1 · the tube card answers 'network' on a stalled read, not 'auth'", () => {
  const s = stripComments(read('src/screens/lab/tube/tubeRefs.ts'));
  const fn = s.slice(s.indexOf('export async function fetchTubePage('));
  assert.match(fn, /safeSessionResult\(supabase\.auth\.getSession\(\), 'lab\/tubeRefs'\)/);
  assert.match(fn, /if \(timedOut\) return \{ url: null, reason: 'network' \};/);
  assert.ok(fn.indexOf('if (timedOut)') < fn.indexOf("reason: 'auth'"));
});

// ── 2 ──────────────────────────────────────────────────────────────────────
test('2 · Profile: a failed credentials read is not "0 certificates you have earned"', () => {
  const s = read('src/screens/profile/ProfileScreen.tsx');
  assert.ok(!s.includes('fetchMyCredentials().then(setCredentials, () => {})'), 'the failure is still swallowed');
  assert.match(s, /const \[credsFailed, setCredsFailed\] = useState\(false\);/);
  // Hunt 8: the rejection is ticketed (only the newest read lands) — still remembered.
  assert.match(s, /\(\) => \{\s*if \(creds === credsTicket\.current\) setCredsFailed\(true\);\s*\}/);
  const man = s.slice(s.indexOf('ON MY PUBLIC PAGE'));
  assert.match(man.slice(0, 800), /\{credsFailed\s*\?\s*'· The certificates you have earned \(couldn’t be loaded just now\)'/);
});

// ── 3 ──────────────────────────────────────────────────────────────────────
test('3 · fetchConceptById throws on an error and returns null only for a missing row', () => {
  const s = read('src/features/notifications/weeklyConcept.ts');
  const fn = s.slice(s.indexOf('export async function fetchConceptById'));
  assert.ok(!/if \(error \|\| !data\)/.test(fn.slice(0, 800)), 'an error still reads as "no row"');
  assert.match(fn, /if \(error\) \{[\s\S]*?throw new Error/);
  assert.match(fn, /if \(!data\) return null;/);
});

test('3 · WeeklyConcept: a missing row says "no longer available"; RETRY only for errors', () => {
  const s = stripComments(read('src/screens/notifications/WeeklyConceptScreen.tsx'));
  const then = s.slice(s.indexOf('void fetchConceptById('), s.indexOf('.finally('));
  assert.ok(!/if \(!row\) setLoadError\(true\)/.test(then), 'a missing row still offers RETRY');
  assert.match(then, /\.catch\(\(\) => \{\s*if \(!cancelled\) setLoadError\(true\);/);
  assert.match(s, /This concept is no longer available\./);
});

// ── 4 ──────────────────────────────────────────────────────────────────────
test('4 · push: the cold-start clear cannot become an unhandled rejection', () => {
  const s = read('src/features/notifications/push.ts');
  assert.match(s, /void Notifications\.clearLastNotificationResponseAsync\(\)\.catch\(\(\) => \{\}\);/);
  assert.ok(!/clearLastNotificationResponseAsync\(\);/.test(s));
});

// ── 5 ──────────────────────────────────────────────────────────────────────
test('5 · reminders: the seen term count advances only after the pending record is stored', () => {
  const s = stripComments(read('src/features/notifications/localSchedule.ts'));
  const block = s.slice(s.indexOf('if (s.notifyNewTerms)'), s.indexOf('if (s.dailyTerms || s.notifyDailyDefinition)'));
  // Not written during detection any more…
  const detect = block.slice(0, block.indexOf('if (pendingReadFailed)'));
  const detectOnly = detect.includes('const advanceSeenCount') ? detect.slice(0, detect.indexOf('const advanceSeenCount')) : detect;
  assert.ok(!/setItem\(K_TERM_COUNT/.test(detectOnly),'the count is advanced before the pending record exists');
  // …but after the pending write, inside afterBooking (hunt 6 structure kept).
  const write = block.slice(block.indexOf('const record = JSON.stringify(pending);'));
  assert.match(
    write,
    /afterBooking = async \(\) => \{\s*await AsyncStorage\.setItem\(K_PENDING_NEW_TERMS, record\);\s*await advanceSeenCount\(\);/,
  );
  assert.match(block, /const advanceSeenCount = async \(\) => \{[\s\S]*?AsyncStorage\.setItem\(K_TERM_COUNT, String\(seenCount\)\)/);
  assert.match(s, /if \(afterBooking\) await afterBooking\(\);/, 'the after-booking write still runs last');
});

// ── 6 ──────────────────────────────────────────────────────────────────────
test('6 · Glossary: a refused open on a non-checking gate says MEMBERSHIP_NOT_CONFIRMED, like the popup', () => {
  const s = read('src/screens/glossary/GlossaryScreen.tsx');
  const br = s.slice(s.indexOf("if (r.fault === 'limit-reached') {"));
  const head = br.slice(0, 1200);
  assert.ok(!/tierReadFailed \? MEMBERSHIP_NOT_CONFIRMED : 'Your account is still being checked/.test(head), 'an open gate still hears "still being checked"');
  assert.match(head, /const checking = memberGate === 'checking';/);
  assert.match(head, /checking \? 'Your account is still being checked\. Try this term again in a moment\.' : MEMBERSHIP_NOT_CONFIRMED/);
  // The popup already maps every non-locked, non-checking gate to the same words.
  const p = read('src/features/glossary/GlossaryTermPopup.tsx');
  assert.match(p, /setPartial\(gate === 'locked' \? 'limit-reached' : gate === 'checking' \? 'checking' : 'unconfirmed'\)/);
  assert.match(p, /partial === 'unconfirmed'\s*\?\s*`This is the opening of the entry\. \$\{MEMBERSHIP_NOT_CONFIRMED\}`/);
});

// ── 7 ──────────────────────────────────────────────────────────────────────
test('7 · Glossary: the fallback meter\'s charged set is per session and per reader, not per mount', () => {
  const s = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.ok(!/useRef<Set<string>>\(new Set\(\)\)[^\n]*\n?[^\n]*consumed|const consumedRef = useRef/.test(s), 'still a per-mount ref');
  assert.match(s, /const consumed = SESSION_FALLBACK_CHARGED;/);
  assert.match(s, /if \(consumed\.has\(id\)\) return true;/);
  const g = read('src/features/glossary/glossaryGateway.ts');
  assert.match(g, /export const SESSION_FALLBACK_CHARGED = new Set<string>\(\);/);
  // Cleared on an identity change, beside the gateway's own session cache.
  const handler = g.slice(g.indexOf('supabase.auth.onAuthStateChange('));
  assert.match(handler.slice(0, 400), /READ_UNANSWERED\.clear\(\);\s*SESSION_FALLBACK_CHARGED\.clear\(\);/);
});
