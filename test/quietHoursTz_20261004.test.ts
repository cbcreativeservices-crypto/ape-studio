/**
 * QUIET HOURS — the client plumbing (Comp A's contract, 2026-10-04):
 *  - every community_notify_prefs_set call carries p_tz = the phone's IANA
 *    zone (Intl.DateTimeFormat().resolvedOptions().timeZone);
 *  - once at app start (per account and zone, per run) the call with ONLY
 *    p_tz set, so a member who never opens Settings has the right zone;
 *  - a zone the server refuses ("unknown time zone") never blocks a save: it
 *    is retried once without p_tz;
 *  - what the server returns is mirrored for the local reminders, and a
 *    change re-books them;
 *  - Settings → MESSAGES & REQUESTS → Quiet hours: switch + FROM / TO, the
 *    owner's default ON 10:00 PM – 7:00 AM, saved once per closed picker.
 *
 * communityPush.ts runs for real against a recording supabase stub.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
g.__DEV__ = false;
g.__QT_AS__ = new Map<string, string>();
g.__QT_CALLS__ = [] as { fn: string; args: Record<string, unknown> }[];
g.__QT_RESYNC__ = 0;
/** Next answers for community_notify_prefs_set, in order (default: a row). */
g.__QT_ANSWERS__ = [] as { data: unknown; error: unknown }[];

const ROW = { push_enabled: false, notify_messages: true, notify_requests: true, show_preview: false, quiet_enabled: true, quiet_start: '22:00:00', quiet_end: '07:00:00', quiet_tz: 'America/Chicago' };
g.__QT_ROW__ = ROW;

// The phone's zone, as the engine reports it.
let zone: string | undefined = 'America/Chicago';
const RealDTF = Intl.DateTimeFormat;
(Intl as { DateTimeFormat: unknown }).DateTimeFormat = function (...a: unknown[]) {
  const f = new (RealDTF as unknown as new (...x: unknown[]) => Intl.DateTimeFormat)(...a);
  const ro = f.resolvedOptions.bind(f);
  return Object.assign(f, { resolvedOptions: () => ({ ...ro(), timeZone: zone as string }) });
} as unknown;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__QT_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
  };`);
const STUBS: Record<string, string> = {
  'react-native': mod(`export const Platform = { OS: 'ios' };`),
  'lib/supabase': mod(`export const supabase = {
    auth: { async getSession() { return { data: { session: { user: { id: 'auth-1' } } } }; } },
    async rpc(fn, args) {
      globalThis.__QT_CALLS__.push({ fn, args: args ?? {} });
      if (fn === 'community_notify_prefs_set') {
        const next = globalThis.__QT_ANSWERS__.shift();
        if (next) return next;
        const row = { ...globalThis.__QT_ROW__ };
        if (args?.p_quiet_enabled != null) row.quiet_enabled = args.p_quiet_enabled;
        if (args?.p_quiet_start != null) row.quiet_start = args.p_quiet_start + ':00';
        if (args?.p_quiet_end != null) row.quiet_end = args.p_quiet_end + ':00';
        globalThis.__QT_ROW__ = row;
        return { data: [row], error: null };
      }
      if (fn === 'community_notify_prefs_get') return { data: [globalThis.__QT_ROW__], error: null };
      if (fn === 'push_device_release') return { data: null, error: null };
      return { data: null, error: null };
    },
  };`),
  'lib/getSessionSafe': mod(`export async function safeSessionResult(p) { return { result: await p, timedOut: false }; }`),
  'commercial/realAccount': mod(`export function isRealAccount(s) { return !!s?.user?.id; }`),
  'account/deviceIdentity': mod(`export async function getDeviceId() { return 'dev-1'; }`),
  './push': mod(`export function getNotifications() { return null; } export async function getExpoPushTokenOnly() { return null; }`),
  './localSchedule': mod(`export function resyncLocalNotifications() { globalThis.__QT_RESYNC__++; }
    export async function rememberQuietWindow(w) {
      const k = JSON.stringify(w);
      if (globalThis.__QT_MIRROR__ === k) return false;
      globalThis.__QT_MIRROR__ = k;
      return true;
    }`),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (context.parentURL?.includes('features/notifications/')) {
      for (const [tail, url] of Object.entries(STUBS)) {
        if (specifier === tail || specifier.endsWith('/' + tail.replace(/^\.\//, ''))) return { url, shortCircuit: true };
      }
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const cp = await import('../src/features/notifications/communityPush.ts');
const qh = await import('../src/features/notifications/quietHours.ts');

const calls = () => g.__QT_CALLS__ as { fn: string; args: Record<string, unknown> }[];
const sets = () => calls().filter((c) => c.fn === 'community_notify_prefs_set');
const settle = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 30; i++) await Promise.resolve();
};

describe('quiet hours — p_tz plumbing', () => {
  it('the device zone comes from Intl; a missing or odd one is not sent', () => {
    assert.equal(qh.deviceTimeZone(), 'America/Chicago');
    zone = undefined;
    assert.equal(qh.deviceTimeZone(), null);
    zone = 'not a zone!';
    assert.equal(qh.deviceTimeZone(), null);
    zone = 'America/Chicago';
  });

  it('the RPC arguments: every one present, NULL = unchanged, p_tz always carried', () => {
    assert.deepEqual(cp.prefsSetArgs({ messages: false }, 'Europe/London'), {
      p_push_enabled: null,
      p_messages: false,
      p_requests: null,
      p_show_preview: null,
      p_quiet_enabled: null,
      p_quiet_start: null,
      p_quiet_end: null,
      p_tz: 'Europe/London',
    });
    const q = cp.prefsSetArgs({ quiet: { start: '23:00' } }, null);
    assert.equal(q.p_quiet_start, '23:00');
    assert.equal(q.p_quiet_end, null);
    assert.equal(q.p_tz, null);
  });

  it('a Settings save sends p_tz with the change, and shows what the SERVER returned', async () => {
    calls().length = 0;
    const r = await cp.saveCommunityPrefs({ quiet: { start: '23:15' } });
    assert.equal(sets().length, 1);
    assert.equal(sets()[0].args.p_tz, 'America/Chicago');
    assert.equal(sets()[0].args.p_quiet_start, '23:15');
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.quiet, { enabled: true, start: '23:15', end: '07:00' });
  });

  it('a zone the server refuses is retried once WITHOUT p_tz, so the change still saves', async () => {
    calls().length = 0;
    (g.__QT_ANSWERS__ as unknown[]).push({ data: null, error: { code: '22023', message: 'unknown time zone' } });
    const r = await cp.saveCommunityPrefs({ quiet: { enabled: false } });
    assert.equal(sets().length, 2);
    assert.equal(sets()[0].args.p_tz, 'America/Chicago');
    assert.equal(sets()[1].args.p_tz, null);
    assert.equal(sets()[1].args.p_quiet_enabled, false);
    assert.ok(r.ok);
  });

  it('any other failure is a failed save (no retry, nothing shown as saved)', async () => {
    calls().length = 0;
    (g.__QT_ANSWERS__ as unknown[]).push({ data: null, error: { code: '08006', message: 'network' } });
    const r = await cp.saveCommunityPrefs({ quiet: { enabled: true } });
    assert.equal(sets().length, 1);
    assert.equal(r.ok, false);
  });

  it('app start: the call with ONLY p_tz, once per account and zone per run', async () => {
    cp.resetCommunityDeviceSync();
    calls().length = 0;
    await cp.syncQuietTimeZone('auth-1');
    await cp.syncQuietTimeZone('auth-1');
    assert.equal(sets().length, 1);
    assert.deepEqual(sets()[0].args, { p_tz: 'America/Chicago' });
    zone = 'America/New_York'; // the member travelled
    await cp.syncQuietTimeZone('auth-1');
    assert.equal(sets().length, 2);
    assert.deepEqual(sets()[1].args, { p_tz: 'America/New_York' });
    await cp.syncQuietTimeZone('auth-2');
    assert.equal(sets().length, 3, 'another account sends its own');
    zone = 'America/Chicago';
  });

  it('app start: a transient failure is tried again; a refused zone is not', async () => {
    cp.resetCommunityDeviceSync();
    calls().length = 0;
    (g.__QT_ANSWERS__ as unknown[]).push({ data: null, error: { code: '08006', message: 'network' } });
    await cp.syncQuietTimeZone('auth-1');
    await cp.syncQuietTimeZone('auth-1');
    assert.equal(sets().length, 2, 'retried after a network failure');
    cp.resetCommunityDeviceSync();
    (g.__QT_ANSWERS__ as unknown[]).push({ data: null, error: { code: '22023', message: 'unknown time zone' } });
    await cp.syncQuietTimeZone('auth-1');
    await cp.syncQuietTimeZone('auth-1');
    assert.equal(sets().length, 3, 'a refused zone is not re-sent this run');
  });

  it('the launch sync (syncCommunityDevice) sends the zone before anything else', async () => {
    cp.resetCommunityDeviceSync();
    calls().length = 0;
    await cp.syncCommunityDevice();
    assert.equal(calls()[0]?.fn, 'community_notify_prefs_set');
    assert.deepEqual(calls()[0]?.args, { p_tz: 'America/Chicago' });
  });

  it('the server window is mirrored for the local reminders; a change re-books them', async () => {
    g.__QT_RESYNC__ = 0;
    await cp.saveCommunityPrefs({ quiet: { enabled: true, start: '21:30', end: '06:45' } });
    await settle();
    const stored = JSON.parse((g.__QT_MIRROR__ as string | undefined) ?? 'null');
    assert.deepEqual(stored, { enabled: true, start: '21:30', end: '06:45' });
    assert.equal(g.__QT_RESYNC__, 1);
    await cp.fetchCommunityPrefs();
    await settle();
    assert.equal(g.__QT_RESYNC__, 1, 'the same window again re-books nothing');
  });
});

describe('quiet hours — Settings section (source receipts)', () => {
  const c = read('src/features/notifications/CommunityNotifySection.tsx');
  const q = read('src/features/notifications/quietHours.ts');

  it('the owner’s copy and default', () => {
    assert.match(q, /label: 'Quiet hours'/);
    assert.match(q, /hint: 'Alerts wait until this time ends, then arrive together\. Messages still come in; only the alert is held\.'/);
    assert.match(q, /fromLabel: 'FROM'/);
    assert.match(q, /toLabel: 'TO'/);
    assert.equal(qh.clock12(qh.DEFAULT_QUIET.start), '10:00 PM');
    assert.equal(qh.clock12(qh.DEFAULT_QUIET.end), '7:00 AM');
  });

  it('a switch plus FROM / TO; every write latched; the picker saves once, on close, only a change', () => {
    assert.match(c, /<Toggle\s+on=\{quiet\.enabled\}[\s\S]*?onChange=\{\(v\) => write\(\(\) => setOne\(\{ quiet: \{ enabled: v \} \}\)\)\}/);
    assert.match(c, /\(\['start', 'end'\] as const\)\.map/);
    assert.match(c, /<NotifyScheduleModal[\s\S]*?mode="time"[\s\S]*?onClose=\{\(\) => closePicker\(quiet\)\}/);
    assert.match(c, /if \(!p \|\| p\.draft === quiet\[p\.which\]\) return;\s*write\(\(\) => setOne\(\{ quiet: \{ \[p\.which\]: p\.draft \} \}\)\);/);
    assert.match(c, /const write = \(task: \(\) => Promise<void>\) => \{\s*void latch\.run\(/);
  });

  it('a failed change is told after the popup has gone (handoff), never as a raw Alert', () => {
    assert.match(c, /handoff\(\(\) => notify\(C\.noticeTitle, C\.changeFailed\)\)/);
    assert.doesNotMatch(c, /Alert\.alert/);
  });

  it('the times shown are the server’s (showSaved from a write result)', () => {
    assert.match(c, /setLoad\(\{ status: 'ok', prefs: saved\.prefs, quiet: saved\.quiet \}\)/);
  });
});
