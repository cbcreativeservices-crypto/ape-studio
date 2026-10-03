/**
 * FINAL ROUND, part A (2026-10-02, owner rule D48: consistency and learning
 * outcomes). One receipt per item.
 *
 *  1. upsellAllowed waits for `tierKnown` — a member whose read FAILED reads
 *     'guest' on the `resolved`-based tier and must still see no upsell.
 *  2. Career Finder, Career Family and About use the shared useUpsellAllowed().
 *  3. Career Finder store: corrupt JSON is set aside under `:damaged`; the
 *     "answers are saved" wording follows the read result.
 *  4. Home's "commitment" intro is held until the tier is known.
 *  5. The onboarding flags and the Home attract cues survive an account wipe.
 *  6. Settings → Redeem: a granted code whose tier refresh did not land says
 *     so (the Paywall's ratified wording), never "your access is active".
 *  7. Tool SAVE waits for the tier: CHECKING…, never a save before the tier
 *     is known and never a lock for a member.
 *
 * R2: every block FAILED against the files as they were at c9c65b5f (copied
 * aside, restored, run, put back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(ROOT + p, 'utf8').replace(/\r\n/g, '\n');

// ── fake AsyncStorage for the Career Finder store (behavioural) ─────────────
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__FRA_AS__ = AS;
g.__FRA_FAIL__ = false;
const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__FRA_AS__;
  export default {
    async getItem(k) { if (globalThis.__FRA_FAIL__) throw new Error('storage read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
  };`);
const REACT = mod(`
  export function useSyncExternalStore(_s, get) { return get(); }
  export default { useSyncExternalStore };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    // careerIndex imports JSON; the store only needs familyFieldOf at completion.
    if (specifier === './careerIndex') return stub(mod('export const familyFieldOf = () => null;'));
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

// ── 1 ───────────────────────────────────────────────────────────────────────
describe('1. upsell copy waits until the tier is actually known', () => {
  it('a resolved-but-unknown tier (a member whose read failed reads "guest") allows no upsell', async () => {
    const { tierOf, upsellAllowed } = await import('../src/features/commercial/tier.ts');
    const failedMember = tierOf('anonymous', true);
    assert.equal(failedMember, 'guest', 'precondition: the resolved-based tier reads guest');
    assert.equal((upsellAllowed as (t: string, k: boolean) => boolean)(failedMember, false), false);
    assert.equal((upsellAllowed as (t: string, k: boolean) => boolean)(failedMember, true), true, 'a KNOWN guest still sees it');
    assert.equal((upsellAllowed as (t: string, k: boolean) => boolean)('member', true), false);
  });
  it('the screen hook reads tierKnown from the provider', () => {
    const s = read('src/features/commercial/useTier.ts');
    assert.match(s, /export function useUpsellAllowed\(\): boolean \{\s*const \{ tierKnown \} = useEntitlement\(\);\s*return upsellAllowed\(useTier\(\), tierKnown\);/);
  });
});

// ── 2 ───────────────────────────────────────────────────────────────────────
describe('2. the career screens and About use the shared tier', () => {
  for (const f of ['src/screens/careerfinder/CareerFinderScreen.tsx', 'src/screens/careerfinder/CareerFamilyScreen.tsx', 'src/screens/about/AboutHomeSheet.tsx']) {
    it(f, () => {
      const s = read(f);
      assert.match(s, /const upsell = useUpsellAllowed\(\);/);
      assert.doesNotMatch(s, /\bisMember\b/, 'no direct isMember branch for free/member copy');
    });
  }
});

// ── 3 ───────────────────────────────────────────────────────────────────────
describe('3. Career Finder store', () => {
  it('corrupt JSON is set aside under :damaged and the store may write (house rule)', async () => {
    AS.clear();
    AS.set('ape:careerfinder:v1', '{"version":"career-finder-v1","responses":{');
    const store = await import('../src/features/careerfinder/store.ts');
    await store.hydrateCareerFinder();
    await settle();
    assert.equal(AS.get('ape:careerfinder:v1:damaged'), '{"version":"career-finder-v1","responses":{', 'the damaged blob was not set aside');
    assert.equal(store.isCareerFinderHydrated(), true);
    assert.equal((store as unknown as { isCareerFinderSaving: () => boolean }).isCareerFinderSaving(), true);
  });
  it('a failed READ reports not-saving, and the wording follows it', async () => {
    const store = await import('../src/features/careerfinder/store.ts');
    store.resetLocal();
    g.__FRA_FAIL__ = true;
    await store.hydrateCareerFinder();
    await settle();
    g.__FRA_FAIL__ = false;
    assert.equal((store as unknown as { isCareerFinderSaving: () => boolean }).isCareerFinderSaving(), false);
    store.resetLocal();
    const quiz = read('src/screens/careerfinder/CareerFinderQuizScreen.tsx');
    assert.match(quiz, /backLabel=\{saving \? 'Leave the questions\. Your answers are saved\.' : 'Leave the questions\. Your answers could not be saved on this phone\.'\}/);
    assert.match(read('src/screens/careerfinder/CareerFinderScreen.tsx'), /\{saving \? 'saved on this phone' : 'not saved on this phone'\}/);
    assert.match(read('src/screens/curriculum/CurriculumScreen.tsx'), /\$\{finderSaving \? 'Your answers are saved\.' : 'Your answers could not be saved on this phone\.'\}/);
  });
});

// ── 4 ───────────────────────────────────────────────────────────────────────
describe('4. the commitment intro is held until the tier is known', () => {
  it('hold={!tierKnown}, tierKnown from the screen’s useEntitlement()', () => {
    const s = read('src/screens/courses/CourseSelectionScreen.tsx');
    assert.match(s, /<ScreenIntroOverlay introKey="commitment" delayMs=\{8000\} sessionOnly=\{entitlement !== 'academy'\} hold=\{!tierKnown\} \/>/);
    // Tier sweep 2026-10-03: isMember left this destructure (the Membership
    // link now reads useUpsellAllowed); tierKnown is still the screen's own.
    assert.match(s, /const \{ commercialMode, entitlement, caps, resolved, setCommercialMode, setEntitlement, tierKnown \} = useEntitlement\(\);/);
  });
});

// ── 5 ───────────────────────────────────────────────────────────────────────
describe('5. device-level first-use keys survive the account wipe', () => {
  it('isOnboardingFlag keeps ape:onboarding:* and ape:homeAttract2', () => {
    const s = read('src/features/account/clearLocalAccountData.ts');
    const start = s.indexOf('function isOnboardingFlag(k: string): boolean {');
    assert.ok(start >= 0);
    const end = s.indexOf('\n}\n', start);
    const body = s.slice(s.indexOf('{', start) + 1, end);
    const isOnboardingFlag = new Function('k', body) as (k: string) => boolean;
    assert.equal(isOnboardingFlag('ape:onboarding:complete'), true);
    assert.equal(isOnboardingFlag('ape:onboarding:visited'), true);
    assert.equal(isOnboardingFlag('ape:homeAttract2'), true);
    assert.equal(isOnboardingFlag('ape:intro:commitment'), true, 'the existing family still kept');
    assert.equal(isOnboardingFlag('ape:careerfinder:v1'), false, 'account data is still swept');
  });
});

// ── 6 ───────────────────────────────────────────────────────────────────────
describe('6. Settings → Redeem says the truth when the refresh did not land', () => {
  it('asks for the tier, and a granted code without academy gets the honest wording', () => {
    const s = read('src/screens/settings/SettingsScreen.tsx');
    assert.match(s, /const tier = res\.ok \? await refreshEntitlement\(\) : false;/);
    assert.match(s, /const lagging = res\.status === 'granted' && tier !== 'academy';/);
    assert.match(s, /lagging \? REDEEM_GRANTED_NOT_REFRESHED : res\.message/);
  });
  it('the wording reuses the Paywall’s ratified sentence verbatim', () => {
    const a = read('src/features/commercial/accessCode.ts');
    const sentence = 'We couldn’t refresh your access on this device yet — it will unlock shortly, or restart the app.';
    assert.ok(a.includes(`'Your code was accepted and your membership is recorded. ${sentence}'`));
    assert.ok(read('src/screens/commercial/PaywallScreen.tsx').includes(sentence), 'the Paywall still says it');
  });
});

// ── 7 ───────────────────────────────────────────────────────────────────────
describe('7. tool SAVE waits for the tier', () => {
  const s = read('src/screens/tools/ToolLockUi.tsx');
  const gate = s.slice(s.indexOf('export function useSaveGate()'), s.indexOf('export function useFullScreenGate()'));
  it('known = a read produced it, or a remembered server tier (free/member); checking otherwise', () => {
    assert.match(gate, /const tier = tierOf\(entitlement, resolved\);\s*const known = tierKnown \|\| tier === 'free' \|\| tier === 'member';/);
    // Owner ruling 2026-10-03: once the provider gives up it is `unconfirmed`, not checking.
    assert.match(gate, /const checking = !isMember && !known && !tierReadFailed;/);
    assert.match(gate, /const locked = !isMember;/);
    assert.doesNotMatch(gate, /const locked = useToolsLocked\(\);/,'not the resolved-only lock, which is OPEN before the read');
  });
  it('the label reads CHECKING… and the tap does nothing while checking', () => {
    assert.match(gate, /label: \(base: string\) => \(checking \? 'CHECKING…' : unconfirmed \? base : locked \? `🔒 \$\{base\}` : base\)/);
    assert.match(gate, /prompt: \(\) => \{\s*if \(checking\) return;/);
  });
  it('the Multimeter sheet keeps its draft while checking', () => {
    const mm = read('src/screens/tools/MultiMeterScreen.tsx');
    assert.match(mm, /if \(saveGate\.checking\) return;[\s\S]{0,260}?if \(saveGate\.unconfirmed\) \{\s*saveGate\.prompt\(\);\s*return;\s*\}\s*if \(saveGate\.locked\) \{\s*\/\/ Close the sheet FIRST/);
  });
});
