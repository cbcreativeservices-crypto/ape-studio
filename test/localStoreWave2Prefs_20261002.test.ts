/**
 * Wave 2 (pattern catalog 2026-10-02, class P1) — the device preferences and
 * first-use flags: a storage read that THROWS must not become an empty value
 * that a save then writes over the real one, and must fail toward the SAFE
 * side for that key (a "seen" flag is not re-shown; Low-Light holds overlays
 * back; consent asks; a schedule the user built is not cancelled).
 *
 * Driven for real on a fake AsyncStorage whose reads can be made to THROW (all
 * keys, or chosen ones) or HELD mid-flight. React is stubbed so the Low-Light
 * hooks run their effects inline; supabase, the notification module and the
 * native pieces are stubbed.
 *
 * R2 (recorded in the wave-2 report): every test marked [R2] FAILED against
 * the hand-rolled file it replaced (copied aside, restored, run, put back).
 * Tests marked [confirm] pin a failure direction that was already safe.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__W2_AS__ = AS;
g.__W2_FAIL__ = null; // null | true (every key) | Set<string> of keys
g.__W2_HOLD__ = null;
g.__W2_SETS__ = [] as string[];
g.__W2_REMOVES__ = [] as string[];
g.__W2_NOTIF__ = [] as string[];
g.__DEV__ = false;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);

const FAKE_AS = mod(`
  const s = globalThis.__W2_AS__;
  const fails = (k) => { const f = globalThis.__W2_FAIL__; return f === true || (f instanceof Set && f.has(k)); };
  export default {
    async getItem(k) {
      if (fails(k)) throw new Error('storage read failed');
      const v = s.has(k) ? s.get(k) : null;
      const h = globalThis.__W2_HOLD__; if (h) await h;
      return v;
    },
    async setItem(k, v) { globalThis.__W2_SETS__.push(k); s.set(k, String(v)); },
    async removeItem(k) { globalThis.__W2_REMOVES__.push(k); s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
  };`);
// Hooks run their effect at once; state setters are inert.
const REACT = mod(`
  export function useState(v) { return [typeof v === 'function' ? v() : v, () => {}]; }
  export function useEffect(fn) { fn(); }
  export function useRef(v) { return { current: v }; }
  export function useCallback(fn) { return fn; }
  export function useMemo(fn) { return fn(); }
  export function useSyncExternalStore(sub, get) { return get(); }
  export default { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore };`);
const RN = mod(`
  export const Platform = { OS: 'ios', select: (o) => o.ios ?? o.default };
  export const AccessibilityInfo = { addEventListener() { return { remove() {} }; }, isReduceMotionEnabled: async () => false };
  export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`);
const SUPABASE = mod(`export const supabase = {
  auth: { async getSession() { return { data: { session: null } }; } },
  async rpc() { return { data: null, error: null }; },
  from() { throw new Error('no table reads in this test'); },
};`);
const PUSH = mod(`
  const log = globalThis.__W2_NOTIF__;
  const N = {
    SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval', CALENDAR: 'calendar' },
    AndroidImportance: { DEFAULT: 3 },
    async getAllScheduledNotificationsAsync() { return [{ identifier: 'ape.notif.dailyStudy' }]; },
    async cancelScheduledNotificationAsync(id) { log.push('cancel:' + id); },
    async scheduleNotificationAsync(r) { log.push('schedule:' + r.identifier); },
    async setNotificationChannelAsync() {},
    async getPermissionsAsync() { return { status: 'granted' }; },
    async requestPermissionsAsync() { return { status: 'granted' }; },
  };
  export function getNotifications() { return N; }`);
const CURATED = mod(`
  export const MISUNDERSTOOD_TERMS = []; export const ODD_TERMS = [];
  export function curatedEntryForDate() { return null; }`);
const MEMBER = mod(`export function memberStanding() { return 'member'; }`);
const MY_ROW = mod(`export async function myUserRow() { return null; }`);
const SESSION = mod(`
  export async function hasSafeSession() { return false; }
  export async function safeUser() { return null; }
  export const SESSION_TIMEOUT_MS = 1;`);
const CONSTANTS = mod(`export default { expoConfig: { version: '9.9.9' } };`);
const OPTIONAL = mod(`export function optionalModule(name) { return globalThis.__W2_OPTIONAL__?.[name] ?? null; }`);
const AUDIO_OUT = mod(`export function isMicActive() { return false; }`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    if (specifier === 'react-native') return stub(RN);
    if (specifier === 'expo-constants') return stub(CONSTANTS);
    if (/lib\/supabase$/.test(specifier)) return stub(SUPABASE);
    if (/lib\/getSessionSafe$/.test(specifier)) return stub(SESSION);
    if (/notifications\/push$/.test(specifier) || specifier === './push') return stub(PUSH);
    if (/curatedTermLists$/.test(specifier)) return stub(CURATED);
    if (/commercial\/memberStanding$/.test(specifier)) return stub(MEMBER);
    if (/account\/myUserRow$/.test(specifier)) return stub(MY_ROW);
    if (/capture\/optionalModule$/.test(specifier)) return stub(OPTIONAL);
    if (/audio\/audioOutputStore$/.test(specifier)) return stub(AUDIO_OUT);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const celebration = await import('../src/features/celebration/celebrationSeen.ts');
const lowLight = await import('../src/features/settings/lowLight.ts');
const suppress = await import('../src/features/dev/popupSuppressStore.ts');
const settings = await import('../src/features/settings/store.ts');
const schedule = await import('../src/features/notifications/localSchedule.ts');
const review = await import('../src/features/review/reviewPrompt.ts');
const perm = await import('../src/features/permissions/permissionStore.ts');
const bigPicture = await import('../src/features/profile/bigPicturePref.ts');
const autoOffline = await import('../src/features/glossary/autoOfflinePref.ts');
const legacy = await import('../src/features/directory/legacyMigration.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function fresh(seed: Record<string, string> = {}): void {
  AS.clear();
  for (const [k, v] of Object.entries(seed)) AS.set(k, v);
  g.__W2_FAIL__ = null;
  g.__W2_HOLD__ = null;
  (g.__W2_SETS__ as string[]).length = 0;
  (g.__W2_REMOVES__ as string[]).length = 0;
  (g.__W2_NOTIF__ as string[]).length = 0;
}
const failReads = (...keys: string[]) => {
  g.__W2_FAIL__ = keys.length ? new Set(keys) : true;
};
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ── celebrationSeen (on the shared safe store) ──────────────────────────────
describe('celebrationSeen: a failed read re-celebrates nothing and overwrites nothing', () => {
  const KEY = 'ape:celebrationsSeen:v1';
  it('[R2] a read that THROWS leaves the record unread: no celebration, no write over the history', async () => {
    fresh({ [KEY]: JSON.stringify(['t1:flashcards-complete', 't2:topic-complete']) });
    celebration.__resetCelebrationsSeenForTests();
    failReads(KEY);
    await celebration.loadCelebrationsSeen();
    assert.equal(celebration.hasLoaded(), false, 'a failed read is not a loaded (empty) record — callers must not celebrate');
    celebration.markSeen('t3', 'matching-complete');
    await settle();
    assert.equal(celebration.wasSeen('t3', 'matching-complete'), true, 'the mark still holds for this run');
    assert.deepEqual(
      JSON.parse(AS.get(KEY)!),
      ['t1:flashcards-complete', 't2:topic-complete'],
      'the stored history must not be replaced by a one-item set',
    );
    // The read recovers: the queued mark lands ON TOP of the real history.
    g.__W2_FAIL__ = null;
    await celebration.loadCelebrationsSeen();
    await settle();
    assert.equal(celebration.hasLoaded(), true);
    assert.equal(celebration.wasSeen('t1', 'flashcards-complete'), true);
    assert.deepEqual(new Set(JSON.parse(AS.get(KEY)!)), new Set(['t1:flashcards-complete', 't2:topic-complete', 't3:matching-complete']));
  });

  it('a garbled record is set aside, not silently dropped', async () => {
    fresh({ [KEY]: '{not json' });
    celebration.__resetCelebrationsSeenForTests();
    await celebration.loadCelebrationsSeen();
    assert.equal(celebration.hasLoaded(), true);
    assert.equal(AS.get(`${KEY}:damaged`), '{not json');
  });
});

// ── Low-Light ───────────────────────────────────────────────────────────────
describe('Low-Light: a failed read holds overlays back instead of turning the mode OFF', () => {
  it('[R2] a read that THROWS: overlays suppressed, the wash not painted, the store re-reads later', async () => {
    fresh({ 'ape:lowLight': '1', 'ape:lowLightAt': String(Date.now()) });
    lowLight.resetLowLight();
    failReads('ape:lowLight');
    lowLight.useLowLight(); // a mounted hook starts the read
    await settle();
    assert.equal(lowLight.isLowLightUnreadable?.(), true, 'the failure must be visible');
    assert.equal(suppress.areOverlaysSuppressed(), true, 'overlays must hold back — the user may have Low-Light on');
    assert.equal(lowLight.getLowLight(), false, 'the dim wash is not painted on a guess');
    // Storage recovers: the next mount reads the real value.
    g.__W2_FAIL__ = null;
    lowLight.useLowLight();
    await settle();
    assert.equal(lowLight.isLowLightUnreadable?.(), false);
    assert.equal(lowLight.getLowLight(), true, 'the stored ON is restored once readable');
  });

  it('[R2] a read in flight across the account wipe does not restore the departing user’s mode', async () => {
    fresh({ 'ape:lowLight': '1', 'ape:lowLightAt': String(Date.now()) });
    lowLight.resetLowLight();
    let release!: () => void;
    g.__W2_HOLD__ = new Promise<void>((r) => {
      release = r;
    });
    lowLight.useLowLight(); // A's read goes out…
    await settle();
    lowLight.resetLowLight(); // …the wipe lands…
    g.__W2_HOLD__ = null;
    release(); // …A's '1' comes back
    await settle();
    assert.equal(lowLight.getLowLight(), false, 'the next person must not be handed a silenced app');
  });

  it('an explicit switch while unreadable is a known value: overlays follow it', async () => {
    fresh();
    lowLight.resetLowLight();
    failReads('ape:lowLight');
    lowLight.useLowLight();
    await settle();
    assert.equal(suppress.areOverlaysSuppressed(), true);
    lowLight.setLowLight(false);
    assert.equal(lowLight.isLowLightUnreadable?.(), false);
    assert.equal(suppress.areOverlaysSuppressed(), false);
    lowLight.resetLowLight();
  });
});

// ── settings record + the notification schedule ────────────────────────────
describe('settings: a failed read never writes defaults over the record or cancels reminders', () => {
  const stored = {
    ...settings.DEFAULT_LOCAL_SETTINGS,
    haptics: false,
    notifyDailyStudy: true,
    notifyTime: { ...settings.DEFAULT_LOCAL_SETTINGS.notifyTime, notifyDailyStudy: '06:30' },
  };

  it('[R2] a save after a failed read keeps every field the user did not touch', async () => {
    fresh({ 'ape:settings': JSON.stringify(stored) });
    settings.resetLocal();
    failReads('ape:settings');
    const shown = await settings.loadLocalSettings(); // the screen gets a stand-in
    g.__W2_FAIL__ = null; // storage answers again by the time of the tap
    await settings.saveLocalSettings({ ...shown, micReleaseOnBackground: false }); // one toggle
    const saved = JSON.parse(AS.get('ape:settings')!);
    assert.equal(saved.micReleaseOnBackground, false, 'the tap is kept');
    assert.equal(saved.haptics, false, 'haptics OFF must not be reset to the default');
    assert.equal(saved.notifyDailyStudy, true, 'a reminder the user switched on must not be switched off');
    assert.equal(saved.notifyTime.notifyDailyStudy, '06:30', 'the chosen time must survive');
    settings.resetLocal();
  });

  it('[R2] while the record is still unreadable a save writes nothing', async () => {
    fresh({ 'ape:settings': JSON.stringify(stored) });
    settings.resetLocal();
    failReads('ape:settings');
    const shown = await settings.loadLocalSettings();
    await settings.saveLocalSettings({ ...shown, haptics: true });
    assert.deepEqual(JSON.parse(AS.get('ape:settings')!), stored, 'the stored record is untouched');
    assert.equal(settings.hapticsEnabled(), true, 'the choice still applies this session');
    settings.resetLocal();
  });

  it('[R2] the boot reschedule after a failed read leaves the device schedule alone', async () => {
    fresh({ 'ape:settings': JSON.stringify(stored) });
    settings.resetLocal();
    failReads('ape:settings');
    const s = await settings.loadLocalSettings();
    await schedule.syncLocalNotifications(s);
    assert.deepEqual(g.__W2_NOTIF__, [], 'nothing may be cancelled on the strength of a stand-in');
    settings.resetLocal();
  });

  it('[R2] a failed read of the phone master switch neither cancels nor re-books', async () => {
    fresh({ 'ape:notif:phoneEnabled': '0' });
    schedule.setLocalSettingsUnreadable?.(false);
    failReads('ape:notif:phoneEnabled');
    await schedule.syncLocalNotifications({ ...settings.DEFAULT_LOCAL_SETTINGS, notifyDailyStudy: true });
    assert.deepEqual(g.__W2_NOTIF__, [], 'a silenced phone must not get reminders back from a read that failed');
  });

  it('[R2] a failed read of the pending new-terms shot does not delete it', async () => {
    const pending = JSON.stringify({ n: 7, fireAt: Date.now() + 86_400_000 });
    fresh({ 'ape:notif:pendingNewTerms': pending });
    schedule.setLocalSettingsUnreadable?.(false);
    failReads('ape:notif:pendingNewTerms');
    await schedule.syncLocalNotifications({ ...settings.DEFAULT_LOCAL_SETTINGS, notifyNewTerms: true });
    assert.equal(AS.get('ape:notif:pendingNewTerms'), pending, 'the accumulated count must survive');
    assert.ok(!(g.__W2_REMOVES__ as string[]).includes('ape:notif:pendingNewTerms'));
  });
});

// ── store-review counters ───────────────────────────────────────────────────
describe('reviewPrompt: a failed read never wipes the "already asked" stamp', () => {
  const KEY = 'ape:review:v1';
  it('[R2] a session recorded on a failed read writes nothing; a success does not ask', async () => {
    const real = { sessions: 40, activeDays: ['2026-09-01'], highValueEvents: 9, lastRequestedVersion: '9.9.9', lastRequestedAt: 1 };
    fresh({ [KEY]: JSON.stringify(real) });
    let asked = 0;
    g.__W2_OPTIONAL__ = {
      'expo-store-review': { isAvailableAsync: async () => true, hasAction: async () => true, requestReview: async () => void asked++ },
    };
    failReads(KEY);
    await review.recordAppSession();
    assert.equal(await review.noteHighValueEvent('quiz_passed' as never), false);
    assert.deepEqual(JSON.parse(AS.get(KEY)!), real, 'the stored counters and stamp are untouched');
    assert.equal(asked, 0, 'no prompt on unknown counters');
  });
});

// ── confirmed-safe directions (no behaviour change) ─────────────────────────
describe('[confirm] the preferences whose failed read was already the safe side', () => {
  it('consent ask-mode: a failed read asks, caches nothing, writes nothing', async () => {
    fresh({ 'ape:perm:camera': 'never' });
    perm.resetAskModeCache();
    failReads('ape:perm:camera');
    assert.equal(await perm.getAskMode('camera'), 'ask');
    g.__W2_FAIL__ = null;
    assert.equal(await perm.getAskMode('camera'), 'never', 'not cached: the next call reads again');
    assert.deepEqual(g.__W2_SETS__, []);
  });

  it('big-picture totals: a failed read is OFF; autoOffline: a failed read is ON; neither writes', async () => {
    fresh({ 'ape:profile:showBigPicture': '1', 'ape:glossary:autoOffline': '0' });
    failReads();
    assert.equal(await bigPicture.loadShowBigPicture(), false);
    assert.equal(await autoOffline.autoOfflineEnabled(), true);
    assert.deepEqual(g.__W2_SETS__, []);
  });

  it('directory carry-over: a failed read offers again and writes nothing', async () => {
    fresh({ 'ape:directoryMigrated': '1' });
    failReads();
    assert.equal(await legacy.alreadyMigrated(), false);
    assert.deepEqual(g.__W2_SETS__, []);
  });
});

// ── the seen-flags kept in components (source receipts: React Native screens) ─
describe('seen-flags in components fail toward NOT re-showing', () => {
  it('[R2] TopicWelcomeSheet: a failed read counts as SEEN (no welcome on every visit)', () => {
    const s = read('src/features/intro/TopicWelcomeSheet.tsx');
    assert.match(s, /seen = \(await AsyncStorage\.getItem\(seenKey\(uid, topicId\)\)\) != null;\s*\} catch \{[\s\S]*?seen = true;\s*\}/);
  });
  it('[R2] StudyFsOverlay: a failed read retires the guide for the mount (no "1" written over a "2")', () => {
    const s = read('src/components/StudyFsOverlay.tsx');
    assert.match(s, /\.catch\(\(\) => \{\s*guideCount\.current = 2;\s*\}\)/);
  });
  it('[confirm] ScreenIntroOverlay: a failed read shows nothing and only dismiss writes the flag', () => {
    const s = read('src/features/intro/ScreenIntroOverlay.tsx');
    assert.match(s, /INTRO_STORAGE_PREFIX \+ key\);\s*if \(alive && seen == null\) setVisible\(true\);[\s\S]*?\}\)\(\)\.catch\(\(\) => \{\}\);/);
    assert.equal((s.match(/AsyncStorage\.setItem\(/g) ?? []).length, 1, 'one write, in dismiss');
  });
  it('[confirm] firstOpen: the flag is written only after a read that answered "absent"', () => {
    const s = read('src/features/startHere/firstOpen.ts');
    assert.ok(s.indexOf('if (seen) return false;') < s.indexOf("setItem(FIRST_OPEN_KEY, '1')"));
    assert.match(s, /\} catch \{\s*return false; \/\/ storage unavailable/);
  });
});
