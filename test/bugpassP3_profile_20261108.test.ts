/**
 * Bug pass 3 (2026-11-08, final pass), group "profile": CODE-3-06, CODE-3-08,
 * CODE-3-11.
 *
 *  CODE-3-06  MY INSTRUCTOR: a Stop sharing the server ACCEPTED, followed by a
 *             failed (or lagging) re-read, said "nothing has been changed".
 *             The certificate-name read failure borrowed the share-read line.
 *  CODE-3-08  Em dashes in the MY INSTRUCTOR member text (shareRules.ts).
 *  CODE-3-11  EmployerSection's load had no unmount or account-wipe fence: a
 *             load landing after sign-out wrote the old account's role into
 *             the feedback identity and its verifier kind back onto the device.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const rules = await import('../src/features/instructor/shareRules.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments removed, so a comment that quotes the old text does not count. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// ── CODE-3-06 ──────────────────────────────────────────────────────────────

test('CODE-3-06: an accepted stop is never reported as "nothing has been changed"', () => {
  const { stopOutcomeLine, SHARE_COPY } = rules;
  assert.equal(stopOutcomeLine({ ok: true }, 'off'), null, 'confirmed off: nothing to say');
  for (const now of ['error', 'on'] as const) {
    const line = stopOutcomeLine({ ok: true }, now);
    assert.equal(line, SHARE_COPY.stopUnconfirmed, `accepted stop, re-read ${now}`);
    assert.doesNotMatch(line!, /nothing has been changed/i);
    assert.match(line!, /request to stop sharing was sent/);
  }
  // A stop the server did NOT accept keeps its own error line.
  assert.equal(stopOutcomeLine({ ok: false, error: SHARE_COPY.notConfirmed }, 'error'), SHARE_COPY.notConfirmed);
  assert.equal(stopOutcomeLine({ ok: false, error: SHARE_COPY.notConfirmed }, 'on'), SHARE_COPY.notConfirmed);
});

test('CODE-3-06: the section line after an accepted stop, and the name-read line', () => {
  const { shareReadFailedLine, SHARE_COPY } = rules;
  assert.equal(shareReadFailedLine(false), SHARE_COPY.readFailed);
  assert.equal(shareReadFailedLine(true), SHARE_COPY.stopUnconfirmed);
  assert.doesNotMatch(shareReadFailedLine(true), /nothing has been changed/i);
  // The certificate-name read is about the NAME, not whether you are sharing.
  assert.match(SHARE_COPY.nameReadFailed, /name on your certificates/);
  assert.doesNotMatch(SHARE_COPY.nameReadFailed, /whether you are sharing/);
  assert.notEqual(SHARE_COPY.nameReadFailed, SHARE_COPY.readFailed);
});

test('CODE-3-06: InstructorShareSection uses the accurate lines', () => {
  const s = code('src/screens/profile/InstructorShareSection.tsx');
  const stop = s.slice(s.indexOf('const stop = useLatchedPress'), s.indexOf('const onToggle ='));
  assert.match(stop, /const body = stopOutcomeLine\(r, now\.state\);/);
  assert.match(stop, /if \(applied && r\.ok && now\.state === 'error'\) setStopSent\(true\);/);
  assert.doesNotMatch(stop, /SHARE_COPY\.readFailed/, 'an accepted stop must not borrow the read-failed line');
  // Still routed through the focus gate (bug pass 2, CODE-2-11).
  assert.match(stop, /gate\.nowOrOnFocus\(\(\) => notify\(SHARE_COPY\.notConfirmedTitle, body\)\);/);
  const start = s.slice(s.indexOf('const startShare = useLatchedPress'), s.indexOf('const summary ='));
  assert.match(start, /catch \{\s*notify\(SHARE_COPY\.notConfirmedTitle, SHARE_COPY\.nameReadFailed\);\s*return;\s*\}/);
  assert.doesNotMatch(start, /SHARE_COPY\.readFailed/);
  assert.match(s, /\{share\?\.state === 'error' \? <Text style=\{styles\.warn\}>\{shareReadFailedLine\(stopSent\)\}<\/Text> : null\}/);
  // A read that answers clears the note; a confirmed share clears it too.
  assert.match(s, /if \(s\.state !== 'error'\) setStopSent\(false\);/);
});

// ── CODE-3-08 ──────────────────────────────────────────────────────────────

test('CODE-3-08: no em dash in any MY INSTRUCTOR member text', () => {
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(rules.SHARE_COPY);
  const s = { instructorName: 'Ina S', school: 'Miramar College', grantedAt: '2026-10-27T12:00:00Z', instructorActive: true };
  strings.push(rules.sharingSince(s), rules.confirmLine(s), rules.stopLine(s), rules.whoLabel(s));
  for (const m of ['instructor code is not right', 'your own instructor code', 'sign in first', 'boom']) {
    strings.push(rules.shareErrorCopy(m));
  }
  assert.ok(strings.length > 30);
  for (const line of strings) assert.doesNotMatch(line, /—/, line);
  // The four lines the finding named still say what they said.
  assert.match(rules.SHARE_COPY.sees.join(' '), /have completed, including topics you completed before/);
  assert.match(rules.SHARE_COPY.readFailed, /reopen Profile\. Nothing has been changed\./);
  assert.match(rules.SHARE_COPY.inactive, /no longer verified, so nothing is being shared\./);
  assert.match(rules.SHARE_COPY.notConfirmed, /Check your connection\. This section shows what the server last said\./);
});

// ── CODE-3-11 ──────────────────────────────────────────────────────────────

test('CODE-3-11: the wipe count the fence reads is bumped by every account wipe', () => {
  const before = registry.localStoreWipeCount();
  registry.resetRegisteredLocalStores();
  assert.equal(registry.localStoreWipeCount(), before + 1);
});

test('CODE-3-11: EmployerSection load is fenced by unmount and by the account wipe', () => {
  const s = code('src/screens/profile/EmployerSection.tsx');
  assert.match(s, /import \{ localStoreWipeCount \} from '\.\.\/\.\.\/features\/storage\/localStoreRegistry';/);
  const load = s.slice(s.indexOf('const load = useCallback(async () => {'), s.indexOf('}, []);', s.indexOf('const load = useCallback')));
  // Captured BEFORE the first await.
  const cap = load.indexOf('const wipe = localStoreWipeCount();');
  assert.ok(cap > 0 && cap < load.indexOf('await'), 'the wipe count is captured before the reads go out');
  // Checked after EACH await, before anything is written.
  const fence = 'if (wipe !== localStoreWipeCount()) return readAgain();';
  const awaits = [...load.matchAll(/await /g)].map((m) => m.index!);
  assert.equal(awaits.length, 2);
  const fences = [...load.matchAll(/if \(wipe !== localStoreWipeCount\(\)\) return readAgain\(\);/g)].map((m) => m.index!);
  assert.equal(fences.length, 2, 'one fence per await');
  assert.ok(fences[0] > awaits[0] && fences[0] < awaits[1]);
  assert.ok(fences[1] > awaits[1]);
  for (const write of ['setFeedbackIdentity(', 'recordVerifierAnswer(', 'setVerifierKind(', 'setUid(']) {
    const at = load.indexOf(write);
    assert.ok(at > load.indexOf(fence), `${write} runs only after the wipe fence`);
  }
  assert.ok(load.indexOf('setPicked(mine)') > fences[1], 'the stored choices land only after the second fence');
  // Unmount: a load still out lands nowhere (the InstructorCodeRow pattern).
  assert.match(s, /useEffect\(\(\) => \{\s*void load\(\);\s*return \(\) => void \+\+loadTicket\.current;\s*\}, \[load\]\);/);
  // The newest-load check is kept (deep dive B3).
  assert.match(load, /if \(ticket !== loadTicket\.current\) return;/);
});

// ── Check P3 follow-ups (CHECK_P3_profile.md) ──────────────────────────────

test('check P3 R1: a stop that sent nothing (session already ended) never says "was sent"', () => {
  // stopSharingWithInstructor answers ok WITHOUT calling the server for a
  // guest session (api.ts), and the re-read then answers 'guest'.
  assert.equal(rules.stopOutcomeLine({ ok: true }, 'guest'), null);
  const api = code('src/features/instructor/api.ts');
  assert.match(api, /if \(w === 'guest'\) return \{ ok: true \};/, 'the premise: a guest stop is ok without a call');
});

test('check P3 R2: a load the wipe fence drops reads again, never leaves the section hidden', () => {
  const s = code('src/screens/profile/EmployerSection.tsx');
  const load = s.slice(s.indexOf('const load = useCallback(async () => {'), s.indexOf('}, []);', s.indexOf('const load = useCallback')));
  assert.match(load, /const readAgain = \(\) => \{\s*failedRef\.current = true;\s*void load\(\);\s*\};/);
  assert.doesNotMatch(load, /if \(wipe !== localStoreWipeCount\(\)\) return;/, 'no silent drop');
  // The ticket check runs first, so an unmounted (signed-out) section never reads again.
  for (const m of load.matchAll(/if \(wipe !== localStoreWipeCount\(\)\) return readAgain\(\);/g)) {
    const before = load.slice(Math.max(0, m.index! - 80), m.index!);
    assert.match(before, /if \(ticket !== loadTicket\.current\) return;\s*$/);
  }
});

test('check P3 R2: once the wipe count has moved, every registered reset has already run', () => {
  const seen: number[] = [];
  registry.registerLocalStoreReset(() => seen.push(registry.localStoreWipeCount()));
  const before = registry.localStoreWipeCount();
  registry.resetRegisteredLocalStores();
  // Bump and resets in one synchronous call: no await can land between them,
  // so the re-read sees the reset feedback identity and stores.
  assert.deepEqual(seen, [before + 1]);
  assert.equal(registry.localStoreWipeCount(), before + 1);
});

test('check P3 nit + note: the stop acts only on its own re-read, and "Reopen Profile" re-reads', () => {
  const s = code('src/screens/profile/InstructorShareSection.tsx');
  const stop = s.slice(s.indexOf('const stop = useLatchedPress'), s.indexOf('const onToggle ='));
  assert.match(stop, /const before = ticket\.current;\s*const now = await load\(\);\s*const applied = ticket\.current === before \+ 1;/);
  assert.match(stop, /if \(applied && r\.ok && now\.state === 'error'\) setStopSent\(true\);/);
  // An accepted stop whose re-read still said "on": the next focus re-reads.
  assert.match(stop, /if \(applied && r\.ok && now\.state === 'on'\) failed\.current = true;/);
  assert.match(s, /useFocusEffect\(\s*useCallback\(\(\) => \{[\s\S]{0,120}if \(failed\.current\) void load\(\);/);
  // load takes its ticket synchronously, before its first await.
  const load = s.slice(s.indexOf('const load = useCallback(async () => {'), s.indexOf('}, []);', s.indexOf('const load = useCallback')));
  assert.ok(load.indexOf('const mine = ++ticket.current;') < load.indexOf('await'));
});
