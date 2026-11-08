/**
 * Bug pass 2 (2026-11-08), group "profile": CODE-2-11, CODE-2-13, S-2, plus
 * the checker's follow-up (CHECK_P2_profile.md).
 *
 *  CODE-2-11  MY INSTRUCTOR: the registry-name read awaited before the code
 *             popup opened, and Profile is a tab, so a slow read opened the
 *             (global) popup or notify over Study / My Progress. Follow-up: a
 *             failed STOP's notice waits for Profile instead of opening over
 *             another tab, and is never dropped.
 *  CODE-2-13  A verified employer whose two reads both failed got no section at
 *             all: a failed read shown as "nothing here". Follow-up: the cold
 *             offline launch, through a device-kept, per-account kind.
 *  S-2        "x of N topics complete", "163 of 166 topics", the whole-academy
 *             percentage and bar, the header "· 98%" and the field "x / y":
 *             learner progress, so D117 (never "N of total", never a measure
 *             or bar toward everything) applies.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__BP2P_AS__ = AS;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__BP2P_AS__;
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(ks) { return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async multiSet(kvs) { for (const [k, v] of kvs) s.set(k, v); },
       async multiRemove(ks) { for (const k of ks) s.delete(k); },
     };`,
  );
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { academyTopicsDone, myProgressSummary, topicsDoneHint } = await import('../src/features/profile/progressWords.ts');
const { employerSectionFace, knownVerifierKind } = await import('../src/features/profile/employerFace.ts');
const { createFocusGate } = await import('../src/features/profile/focusGate.ts');
const mem = await import('../src/features/profile/verifierKindMemory.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments removed, so a comment that quotes the old text does not count. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// ── S-2 ────────────────────────────────────────────────────────────────────

test('S-2: a progress row says what was done, never "N of total"', () => {
  assert.equal(topicsDoneHint(null, 12), '—', 'unread progress is not a zero');
  assert.equal(topicsDoneHint(0, 12), 'Not started yet');
  assert.equal(topicsDoneHint(1, 12), '1 topic done');
  assert.equal(topicsDoneHint(3, 12), '3 topics done');
  assert.equal(topicsDoneHint(12, 12), 'All 12 topics done');
  for (const s of [topicsDoneHint(3, 12), topicsDoneHint(11, 12)]) assert.doesNotMatch(s, /\d+ (of|\/) \d+/);
});

test('S-2: the whole-academy line is a count keyed on the COUNT, never the floored percentage', () => {
  assert.equal(academyTopicsDone(null), '—', 'unread is not "Not started yet"');
  assert.equal(academyTopicsDone(0), 'Not started yet');
  // 1 of 166 floors to 0%: it read "Not started yet" over finished work.
  assert.equal(academyTopicsDone(1), '1 topic done');
  assert.equal(academyTopicsDone(163), '163 topics done');
  for (const n of [null, 0, 1, 163]) assert.doesNotMatch(academyTopicsDone(n), /%/);
});

test('S-2: the MY PROGRESS header carries goals, and the count only with the opt-in', () => {
  assert.equal(myProgressSummary(3, false, 163), '3 goals');
  assert.equal(myProgressSummary(1, false, 163), '1 goal');
  assert.equal(myProgressSummary(3, true, 163), '3 goals · 163 topics done');
  assert.equal(myProgressSummary(3, true, null), '3 goals · —');
  assert.equal(myProgressSummary(0, false, 163), '');
  assert.equal(myProgressSummary(0, true, 1), '1 topic done');
  for (const s of [myProgressSummary(3, true, 163), myProgressSummary(0, true, 0)]) assert.doesNotMatch(s, /%/);
});

test('S-2: ProfileScreen shows no percentage, no bar, no header %, no "x of N" and no "x / y"', () => {
  const s = code('src/screens/profile/ProfileScreen.tsx');
  assert.doesNotMatch(s, /\} of \$\{total\}/, 'CatalogRow still says "x of N topics complete"');
  assert.doesNotMatch(s, /completeCount\} of \$\{profile\.topicTotal\}/, 'the whole-academy line still says "163 of 166"');
  assert.doesNotMatch(s, /overallPct/, 'a whole-academy percentage is still read on Profile');
  assert.doesNotMatch(s, /pctClamped/, 'the bar value is still computed');
  assert.doesNotMatch(s, /progressTrack|progressFill/, 'the bar toward everything is still drawn');
  assert.doesNotMatch(s, /% complete/, 'a "% complete" text (or the bar accessibility value) remains');
  assert.doesNotMatch(s, /aria-valuenow|accessibilityValue=\{\{ min: 0, max: 100/, 'the bar accessibility value remains');
  assert.doesNotMatch(s, /\?\? '—'\} \/ \$\{/, 'the field summary still says "x / y"');
  assert.doesNotMatch(s, /Whole-curriculum progress/);
  assert.match(s, /<Text style=\{styles\.rowLabel\}>Across the whole academy<\/Text>/);
  assert.match(s, /academyTopicsDone\(profile \? profile\.completeCount : null\)/);
  assert.match(s, /summary=\{myProgressSummary\(goalCount, showBigPicture, profile \? profile\.completeCount : null\)\}/);
  assert.match(s, /\? topicsDoneHint\(done, total\)/);
  assert.match(s, /\? topicsDoneHint\(catalogDone\(fieldGs\), fieldGs\.length\)/);
});

// ── CODE-2-13 ──────────────────────────────────────────────────────────────

test('CODE-2-13: a known verified account whose reads failed gets the couldn’t-check face', () => {
  const base = { loaded: true, hasApp: false, verified: false, verifyFailed: true };
  // Before the fix this was hidden: `!app && !verified` returned null.
  assert.equal(employerSectionFace({ ...base, knownKind: 'employer' }), 'unreadable');
  assert.equal(employerSectionFace({ ...base, knownKind: 'instructor' }), 'unreadable');
  // A learner (no known kind) offline still sees nothing: no employer UI.
  assert.equal(employerSectionFace({ ...base, knownKind: null }), 'hidden');
  assert.equal(employerSectionFace({ ...base, verifyFailed: false, knownKind: 'employer' }), 'hidden');
  assert.equal(employerSectionFace({ ...base, loaded: false, knownKind: 'employer' }), 'hidden');
  assert.equal(employerSectionFace({ ...base, hasApp: true, knownKind: null }), 'show');
  assert.equal(employerSectionFace({ ...base, verified: true, verifyFailed: false, knownKind: null }), 'show');
});

test('CODE-2-13: only a real verifier kind counts as evidence', () => {
  for (const k of ['employer', 'company', 'institution', 'instructor']) assert.equal(knownVerifierKind(k), k);
  for (const k of [undefined, '', 'none', 'unknown', 'admin']) assert.equal(knownVerifierKind(k), null);
});

test('CODE-2-13 follow-up: the device keeps only what the server confirmed, per account', async () => {
  AS.clear();
  mem.verifierKindStoreForTests.reset();
  await mem.verifierKindStoreForTests.hydrate();
  assert.equal(mem.verifierKindStoreForTests.get(), null);
  // 'unknown' (a failed read) writes nothing.
  await mem.recordVerifierAnswer('u1', 'unknown');
  assert.equal(AS.has(mem.VERIFIER_KIND_KEY), false);
  // A confirmed kind is kept for THIS account.
  assert.equal(await mem.recordVerifierAnswer('u1', 'employer'), true);
  assert.deepEqual(JSON.parse(AS.get(mem.VERIFIER_KIND_KEY)!), { uid: 'u1', kind: 'employer' });
  assert.equal(mem.rememberedKindFor(mem.verifierKindStoreForTests.get(), 'u1'), 'employer');
  // Another account, no account, or a stalled session: no evidence.
  assert.equal(mem.rememberedKindFor(mem.verifierKindStoreForTests.get(), 'u2'), null);
  assert.equal(mem.rememberedKindFor(mem.verifierKindStoreForTests.get(), null), null);
  // A clean 'none' forgets it (the key is removed).
  await mem.recordVerifierAnswer('u1', 'none');
  assert.equal(AS.has(mem.VERIFIER_KIND_KEY), false);
  assert.equal(mem.verifierKindStoreForTests.get(), null);
});

test('CODE-2-13 follow-up: a cold launch reads the saved kind back; the account wipe drops it', async () => {
  AS.clear();
  AS.set('ape:profile:lastVerifierKind', JSON.stringify({ uid: 'u1', kind: 'instructor' }));
  mem.verifierKindStoreForTests.reset(); // a fresh launch: nothing in memory
  // Unread is no evidence: nothing is claimed before the device answers.
  assert.equal(mem.rememberedKindFor(mem.verifierKindStoreForTests.get(), 'u1'), null);
  await mem.verifierKindStoreForTests.hydrate();
  assert.equal(mem.rememberedKindFor(mem.verifierKindStoreForTests.get(), 'u1'), 'instructor');
  // Sign-out / account switch: the registered wipe reaches this store.
  registry.resetRegisteredLocalStores();
  assert.equal(mem.verifierKindStoreForTests.get(), null);
  // A damaged blob is never a claim.
  assert.throws(() => mem.parseSavedVerifierKind({ uid: 'u1', kind: 'none' }));
  assert.throws(() => mem.parseSavedVerifierKind({ kind: 'employer' }));
  assert.equal(mem.nextSavedVerifierKind(null, 'u1', 'unknown'), null);
});

test('CODE-2-13 follow-up: the key is swept by the account wipe (on no KEEP list)', () => {
  const clear = read('src/features/account/clearLocalAccountData.ts');
  assert.ok(!clear.includes(mem.VERIFIER_KIND_KEY), 'the saved verifier kind must not survive sign-out');
});

test('CODE-2-13: EmployerSection uses the face, the saved kind, TRY AGAIN, and hides the apply link when unreadable', () => {
  const s = read('src/screens/profile/EmployerSection.tsx');
  assert.doesNotMatch(s, /if \(!loaded \|\| \(!app && !verified\)\) return null;/, 'the silent-vanish guard is back');
  assert.match(s, /who === 'none' \? null : who === 'unknown' \? knownVerifierKind\(getFeedbackIdentity\(\)\.role\) : who/);
  // Written only from a server answer, for the account read now.
  assert.match(s, /if \(me && who !== 'unknown'\) void recordVerifierAnswer\(me, who\);/);
  // Used only when the check failed and nothing in memory knows the kind; re-renders when it lands.
  assert.match(s, /const remembered = useRememberedVerifierKind\(uid\);/);
  assert.match(s, /if \(verifyFailed && !verifierKind && remembered\) setVerifierKind\(remembered\);/);
  assert.match(s, /employerSectionFace\(\{ loaded, hasApp: !!app, verified, verifyFailed, knownKind: verifierKind \}\)/);
  const early = s.indexOf("if (face === 'hidden') return null;");
  assert.ok(early > 0);
  for (const hook of ['useLatchedPress(() => load())', 'useRememberedVerifierKind(uid)', 'useEffect(() => {\n    if (verifyFailed']) {
    assert.ok(s.indexOf(hook) > 0 && s.indexOf(hook) < early, `${hook} must run before the early return`);
  }
  assert.match(s, /const checkFailedShown = !verified && app\?\.status !== 'pending' && app\?\.status !== 'rejected' && verifyFailed;/);
  assert.match(s, /\{checkFailedShown \? \(\s*<Pressable[^>]*onPress=\{retry\}[\s\S]{0,120}TRY AGAIN ›/);
  assert.match(s, /\{!verified && !unreadable \? \(/);
  // Verified-only rows still wait for a server-confirmed `verified`.
  assert.match(s, /\{verified && verifierKind === 'instructor' \? <InstructorCodeRow \/> : null\}/);
  assert.match(s, /\{verified \? <KindSwitchRow/);
});

// ── CODE-2-11 ──────────────────────────────────────────────────────────────

test('CODE-2-11: an answer nobody waits for opens only while focused, read when it lands', () => {
  let focused = true;
  const shown: string[] = [];
  const gate = createFocusGate(() => focused);
  gate.ifFocused(() => shown.push('popup'));
  assert.deepEqual(shown, ['popup']);
  // The member switched tabs while the read was out: dropped, and not later.
  focused = false;
  gate.ifFocused(() => shown.push('name first'));
  assert.equal(gate.hasPending(), false);
  focused = true;
  gate.onFocus();
  assert.deepEqual(shown, ['popup']);
});

test('CODE-2-11 follow-up: a failed stop never opens over another tab, and is never dropped', () => {
  let focused = false;
  const shown: string[] = [];
  const gate = createFocusGate(() => focused);
  gate.nowOrOnFocus(() => shown.push('stop not confirmed (1)'));
  gate.nowOrOnFocus(() => shown.push('stop not confirmed (2)'));
  assert.deepEqual(shown, [], 'nothing opens while another tab is in front');
  assert.equal(gate.hasPending(), true);
  focused = true;
  gate.onFocus();
  assert.deepEqual(shown, ['stop not confirmed (2)'], 'shown once, the newest, when Profile is back');
  gate.onFocus();
  assert.equal(shown.length, 1, 'not twice');
  gate.nowOrOnFocus(() => shown.push('in front'));
  assert.deepEqual(shown.at(-1), 'in front', 'shown at once while Profile is in front');
});

test('CODE-2-11: InstructorShareSection routes every post-await surface through the gate', () => {
  const s = read('src/screens/profile/InstructorShareSection.tsx');
  assert.match(s, /const isFocused = useIsFocused\(\);\s*const focusedRef = useRef\(isFocused\);\s*focusedRef\.current = isFocused;/);
  assert.match(s, /const \[gate\] = useState\(\(\) => createFocusGate\(\(\) => focusedRef\.current\)\);/);
  assert.match(s, /const notifyOnProfile: typeof notify = \(\.\.\.a\) => gate\.ifFocused\(\(\) => notify\(\.\.\.a\)\);/);
  assert.match(s, /const openPopupOnProfile = \(\) => gate\.ifFocused\(openPopup\);/);
  const start = s.slice(s.indexOf('const startShare = useLatchedPress'), s.indexOf('const summary ='));
  const bind = start.search(/const notify = notifyOnProfile;\s*const openPopup = openPopupOnProfile;/);
  assert.ok(bind > 0 && bind < start.indexOf('await fetchMyRegistryName()'));
  const stop = s.slice(s.indexOf('const stop = useLatchedPress'), s.indexOf('const onToggle ='));
  assert.match(stop, /gate\.nowOrOnFocus\(\(\) => notify\(SHARE_COPY\.notConfirmedTitle, body\)\);/);
  assert.doesNotMatch(stop, /^\s*notify\(/m, 'stop still calls the global notify directly');
  assert.match(s, /useFocusEffect\(\s*useCallback\(\(\) => \{[\s\S]{0,160}gate\.onFocus\(\);/);
});
