/**
 * EXIT FLOW — switched ON for the final store build (owner 2026-10-24:
 * "nothing should be postponed if we can do it now").
 *
 * Pins, against the LIVE server contract (Comp A, verified 2026-10-23;
 * signatures re-read from pg_proc 2026-10-24):
 *   submit_exit_feedback(p_flow, p_flow_version, p_reason, p_followup,
 *                        p_comment, p_platform, p_app_version) → void
 *   delete_my_account(p_keep_credentials boolean) → jsonb
 *
 *  1. The switch is ON and the Settings entry points render (hidden only for a
 *     KNOWN guest — a guest has no account).
 *  2. Cancel: the answers go to submit_exit_feedback FIRST, then the store's
 *     own subscription page opens for the billing provider / platform.
 *  3. Delete: p_keep_credentials is true / false from the certificate choice.
 *  4. Errors and timeouts are honest: no "saved" / "deleted" without a success
 *     result from the server (or the auth server's "this account is gone").
 *
 * features/exit/api.ts runs for real here; every module it imports that needs
 * React Native or the network is stubbed. The screens load React Native, so
 * they are pinned by source text in the house style.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const C = 'const C = () => globalThis.__EXIT_ON__;';
const STUBS: Record<string, string> = {
  'exit-on:rn': `${C}
    export const Linking = { openURL: (u) => C().openURL(u) };
    export const Platform = { get OS() { return C().os; } };`,
  'exit-on:constants': `export default { expoConfig: { version: '9.9.9' } };`,
  'exit-on:sb': `${C}
    function from(table) {
      const q = { table, cols: null };
      const b = {
        select(cols) { q.cols = cols; return b; },
        eq() { return b; },
        then(res, rej) { return Promise.resolve(C().select(q)).then(res, rej); },
      };
      return b;
    }
    export const supabase = { rpc: (name, args) => C().rpc(name, args), from };`,
  'exit-on:confirm': `${C}
    export function notify(title, body) { C().notified.push(title); }
    export function confirmDialog() {}`,
  'exit-on:telemetry': `${C}
    export function trackEvent(name, props) { C().events.push(name); }`,
  'exit-on:intentional': `${C}
    export function markIntentionalSignOut() { C().calls.push('mark'); }`,
  'exit-on:auth': `${C}
    export async function lookUpDeletedAccount() { C().calls.push('lookup'); return C().lookup; }
    export async function signOutThisDevice() { C().calls.push('signout'); }`,
  'exit-on:wipe': `${C}
    export async function clearLocalAccountData() { C().calls.push('clear'); }
    export function resetAllLocalStores() { C().calls.push('reset'); }`,
  'exit-on:sync': `${C}
    export async function runAfterAccountSync(fn) { C().calls.push('queue'); return await fn(); }`,
  'exit-on:userrow': `export async function myUserRow() { return null; }`,
  'exit-on:creds': `export async function fetchMyCredentials() { return []; }`,
};
const MAP: [RegExp, string][] = [
  [/^react-native$/, 'exit-on:rn'],
  [/^expo-constants$/, 'exit-on:constants'],
  [/(^|\/)lib\/supabase$/, 'exit-on:sb'],
  [/(^|\/)lib\/confirm$/, 'exit-on:confirm'],
  [/(^|\/)telemetry\/telemetry$/, 'exit-on:telemetry'],
  [/(^|\/)auth\/intentionalSignOut$/, 'exit-on:intentional'],
  [/^\.\.\/auth\/api$/, 'exit-on:auth'],
  [/(^|\/)account\/clearLocalAccountData$/, 'exit-on:wipe'],
  [/(^|\/)account\/accountLocalSync$/, 'exit-on:sync'],
  [/(^|\/)account\/myUserRow$/, 'exit-on:userrow'],
  [/^\.\.\/credentials\/api$/, 'exit-on:creds'],
];
registerHooks({
  resolve(specifier, context, next) {
    for (const [re, url] of MAP) if (re.test(specifier)) return { url, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier) && context.parentURL?.startsWith('file:')) {
      const base = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    return next(url, context);
  },
});

type Rpc = { name: string; args: unknown };
function ctl(over: Partial<Record<string, any>> = {}) {
  const c = {
    os: 'ios',
    rpcs: [] as Rpc[],
    rpcAnswer: (_name: string, _args: unknown): unknown => ({ data: null, error: null }),
    rpc(name: string, args: unknown) {
      c.rpcs.push({ name, args });
      return Promise.resolve().then(() => c.rpcAnswer(name, args));
    },
    selects: [] as { table: string; cols: string }[],
    selectAnswer: (): unknown => ({ data: [], error: null }),
    select(q: { table: string; cols: string }) {
      c.selects.push(q);
      return c.selectAnswer();
    },
    opened: [] as string[],
    openFails: false,
    openURL(u: string) {
      if (c.openFails) return Promise.reject(new Error('no handler'));
      c.opened.push(u);
      return Promise.resolve(true);
    },
    notified: [] as string[],
    events: [] as string[],
    calls: [] as string[],
    lookup: 'unknown' as 'gone' | 'exists' | 'unknown',
    ...over,
  };
  g.__EXIT_ON__ = c;
  return c;
}

const sw = await import('../src/config/exitFlow.ts');
const api = await import('../src/features/exit/api.ts');
const ms = await import('../src/features/exit/membershipState.ts');
const survey = await import('../src/features/exit/survey.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const SETTINGS = 'src/screens/settings/SettingsScreen.tsx';
const CANCEL = 'src/screens/exit/CancelMembershipScreen.tsx';
const DELETE = 'src/screens/exit/DeleteAccountFlowScreen.tsx';
const BILLING = 'src/screens/exit/MembershipBillingScreen.tsx';
const API = 'src/features/exit/api.ts';

const FUTURE = new Date(Date.now() + 20 * 86400000).toISOString();

describe('1 · the switch is ON and Settings shows the entry points', () => {
  it('EXIT_FLOW_ENABLED is true and exitFlowEnabled() answers true without __DEV__', () => {
    assert.equal(sw.EXIT_FLOW_ENABLED, true);
    assert.equal(g.__DEV__, false);
    assert.equal(sw.exitFlowEnabled(), true);
  });

  it('Settings: the ON side carries Membership and billing + Account and privacy, hidden only for a KNOWN guest', () => {
    const s = code(SETTINGS);
    assert.match(s, /import \{ exitFlowEnabled \} from '\.\.\/\.\.\/config\/exitFlow';/);
    // MEMBERSHIP section: ON → the Membership and billing row (not for a known guest).
    assert.match(
      s,
      /\{exitFlowEnabled\(\) \? \(\s*tierKnown && isGuest \? null : \(\s*<Pressable[\s\S]{0,200}?navigate\('MembershipBilling'\)[\s\S]{0,300}?Membership and billing<\/Text>/,
    );
    // Bottom of Settings: ON → ACCOUNT AND PRIVACY › Delete account and personal data.
    assert.match(
      s,
      /\{tierKnown && isGuest \? null : exitFlowEnabled\(\) \? \(\s*<SettingsSection title="ACCOUNT AND PRIVACY">\s*<Pressable[\s\S]{0,200}?navigate\('DeleteAccountFlow'\)[\s\S]{0,300}?Delete account and personal data<\/Text>/,
    );
  });

  it('the three exit routes are registered (lazy) and typed', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    const types = read('src/navigation/types.ts');
    for (const r of ['MembershipBilling', 'CancelMembership', 'DeleteAccountFlow']) {
      assert.match(nav, new RegExp(`<Stack\\.Screen name="${r}" getComponent=\\{Lazy\\.${r}\\}`));
      assert.match(types, new RegExp(`\\b${r}: `));
    }
    assert.match(types, /CancelMembership: \{ provider: 'apple' \| 'google'; endsAt: string \| null \};/);
    assert.match(nav, /name="DeleteAccountFlow"[^\n]*gestureEnabled: false/);
  });
});

describe('2 · cancel: submit_exit_feedback first, then the store subscription page', () => {
  beforeEach(() => ctl());

  it('submit_exit_feedback is called with exactly the live signature', async () => {
    const c = ctl({ os: 'android' });
    const ok = await api.submitExitFeedback({ flow: 'cancel', reason: 'budget', followup: 'likely' });
    assert.equal(ok, true);
    assert.equal(c.rpcs.length, 1);
    assert.equal(c.rpcs[0].name, 'submit_exit_feedback');
    assert.deepEqual(c.rpcs[0].args, {
      p_flow: 'cancel',
      p_flow_version: 1,
      p_reason: 'budget',
      p_followup: 'likely',
      p_comment: null,
      p_platform: 'android',
      p_app_version: '9.9.9',
    });
    assert.deepEqual(Object.keys(c.rpcs[0].args as object).sort(), [
      'p_app_version', 'p_comment', 'p_flow', 'p_flow_version', 'p_followup', 'p_platform', 'p_reason',
    ]);
    assert.ok(c.events.includes('feedback_submitted'));
  });

  it('a comment is trimmed and capped at 500 (the server CHECK)', async () => {
    const c = ctl();
    await api.submitExitFeedback({ flow: 'delete', reason: null, followup: null, comment: `  ${'x'.repeat(600)}  ` });
    assert.equal(((c.rpcs[0].args as Record<string, string>).p_comment).length, 500);
  });

  it('the cancel survey can never send `privacy` (the server answers 22023 invalid_reason)', () => {
    assert.ok(!survey.reasonsFor('cancel').some((r: { code: string }) => r.code === 'privacy'));
  });

  it('a server error (22023) or a bounded-client timeout is NOT "saved": false, no telemetry, never throws', async () => {
    let c = ctl({ rpcAnswer: () => ({ data: null, error: { code: '22023', message: 'invalid_reason' } }) });
    assert.equal(await api.submitExitFeedback({ flow: 'cancel', reason: 'privacy', followup: null }), false);
    assert.ok(!c.events.includes('feedback_submitted'));
    c = ctl({
      rpcAnswer: () => {
        throw new Error('submit_exit_feedback timeout after 30000ms');
      },
    });
    assert.equal(await api.submitExitFeedback({ flow: 'cancel', reason: 'budget', followup: null }), false);
    assert.ok(!c.events.includes('feedback_submitted'));
  });

  it('the store page is the billing provider’s own subscription settings (Apple / Google Play)', async () => {
    let c = ctl({ os: 'ios' });
    assert.equal(await api.openSubscriptions('apple', 'cancel'), true);
    assert.deepEqual(c.opened, ['itms-apps://apps.apple.com/account/subscriptions']);
    c = ctl({ os: 'android' });
    assert.equal(await api.openSubscriptions('google', 'cancel'), true);
    assert.deepEqual(c.opened, ['https://play.google.com/store/account/subscriptions?package=com.cbcreativeservices.apestudio']);
    // No verified provider: this phone's store.
    c = ctl({ os: 'android' });
    await api.openSubscriptions(null, 'membership');
    assert.match(c.opened[0], /^https:\/\/play\.google\.com\/store\/account\/subscriptions/);
    c = ctl({ os: 'ios' });
    await api.openSubscriptions(null, 'membership');
    assert.equal(c.opened[0], 'itms-apps://apps.apple.com/account/subscriptions');
    // An Apple subscription seen on an Android phone: Apple's web page, never Google Play.
    c = ctl({ os: 'android' });
    await api.openSubscriptions('apple', 'cancel');
    assert.equal(c.opened[0], 'https://apps.apple.com/account/subscriptions');
  });

  it('a store page that will not open says so (notify) and answers false', async () => {
    const c = ctl({ openFails: true });
    assert.equal(await api.openSubscriptions('apple', 'cancel'), false);
    assert.deepEqual(c.notified, ['Manage subscription']);
    assert.ok(!c.events.includes('billing_management_opened'));
  });

  it('the screen sends the answers BEFORE it opens the store, bounded, and opens it whatever the send did', () => {
    const s = code(CANCEL);
    const fn = s.slice(s.indexOf('const continueToStore'), s.indexOf('const keepMembership'));
    const send = fn.indexOf('const sent = sendAnswersOnce();');
    const wait = fn.indexOf("await softDeadline(() => sent, false, 'exit answers before store', ANSWERS_BEFORE_STORE_MS)");
    const open = fn.indexOf("await openSubscriptions(provider, 'cancel')");
    assert.ok(send >= 0 && wait > send && open > wait, 'send → bounded wait → store page');
    assert.match(s, /export const ANSWERS_BEFORE_STORE_MS = 4000;/);
    assert.match(s, /return submitExitFeedback\(\{ flow: 'cancel', reason, followup \}\);/);
    // The control stays a latched press, and opening the store never claims success.
    assert.match(s, /const continueToStore = useLatchedPress\(async \(\) => \{/);
    assert.doesNotMatch(fn, /setVerify\('verified'\)/);
  });
});

describe('3 · delete: p_keep_credentials from the certificate choice', () => {
  it('keep a verification record → true; delete everything → false; one RPC, then sign-out and the wipe', async () => {
    for (const [choice, keep] of [
      ['keep_record', true],
      ['delete_all', false],
    ] as const) {
      const c = ctl();
      assert.equal(await api.deleteMyAccount(choice), 'deleted');
      assert.equal(c.rpcs.length, 1);
      assert.equal(c.rpcs[0].name, 'delete_my_account');
      assert.deepEqual(c.rpcs[0].args, { p_keep_credentials: keep });
      assert.deepEqual(c.calls, ['mark', 'signout', 'queue', 'clear', 'reset']);
    }
  });

  it('the screen passes the person’s choice; with no certificate it is delete-everything', () => {
    const s = code(DELETE);
    assert.match(s, /await deleteMyAccount\(needsCertChoice \? certChoice : 'delete_all'\)/);
    assert.match(s, /useState<KeepChoice \| null>\(null\)/, 'nothing preselected');
    assert.match(s, /prompt=\{CERT_QUESTION\}\s*choices=\{CERT_CHOICES\}\s*value=\{certChoice\}\s*onChange=\{setCertChoice\}/);
  });
});

describe('4 · honest failures: no "done" without a success result', () => {
  it('a server error deletes nothing on the device and reports failed', async () => {
    const c = ctl({ rpcAnswer: () => ({ data: null, error: { code: 'P0001', message: 'not_authenticated' } }) });
    assert.equal(await api.deleteMyAccount('delete_all'), 'failed');
    assert.deepEqual(c.calls, []);
  });

  it('a timeout (the bounded client) is "deleted" ONLY when the auth server says the account is gone', async () => {
    const stall = () => {
      throw new Error('delete_my_account timeout after 30000ms');
    };
    let c = ctl({ rpcAnswer: stall, lookup: 'unknown' });
    assert.equal(await api.deleteMyAccount('keep_record'), 'failed');
    assert.deepEqual(c.calls, ['lookup'], 'nothing signed out or wiped');
    c = ctl({ rpcAnswer: stall, lookup: 'exists' });
    assert.equal(await api.deleteMyAccount('keep_record'), 'failed');
    c = ctl({ rpcAnswer: stall, lookup: 'gone' });
    assert.equal(await api.deleteMyAccount('keep_record'), 'deleted');
    assert.deepEqual(c.calls, ['lookup', 'mark', 'signout', 'queue', 'clear', 'reset']);
  });

  it('keeping a record is never silently downgraded to delete-everything', async () => {
    const c = ctl({ rpcAnswer: (_n: string, args: unknown) => (args ? { error: { code: 'PGRST202' } } : { error: null }) });
    assert.equal(await api.deleteMyAccount('keep_record'), 'keep_unavailable');
    assert.equal(c.rpcs.length, 1, 'the no-argument delete was never called');
    assert.deepEqual(c.calls, []);
  });

  it('the delete call is bounded, and the app uses the one bounded Supabase client', () => {
    const a = code(API);
    assert.match(a, /withDeadline\(async \(\) => await callDelete\(choice\), 'delete_my_account'\)/);
    assert.match(a, /'submit_exit_feedback',\s*10000,/);
    assert.match(a, /import \{ supabase \} from '\.\.\/\.\.\/lib\/supabase';/);
    assert.doesNotMatch(a, /createClient/);
  });

  it('D3 "Your account has been deleted" only after deleteMyAccount answered deleted', () => {
    const s = code(DELETE);
    assert.equal(s.split("setStep('d3')").length - 1, 1, 'one way into D3');
    const branch = s.slice(s.indexOf("if (outcome === 'deleted') {"));
    const d3 = branch.indexOf("setStep('d3')");
    assert.ok(d3 > 0 && d3 < branch.indexOf("if (outcome === 'keep_unavailable')"), 'D3 only inside the deleted branch');
    // A wrong password stops before any delete.
    const once = s.slice(s.indexOf('const runDeleteOnce'));
    assert.ok(once.indexOf('if (authMsg)') < once.indexOf('await deleteMyAccount('));
    // The final control is a latched press behind a destructive confirmDialog.
    assert.match(s, /const askConfirm = useLatchedPress\(/);
  });

  it('a failed membership read is not shown as "no membership"', async () => {
    let c = ctl({ selectAnswer: () => ({ data: null, error: { code: '42501', message: 'permission denied' } }) });
    assert.deepEqual(await api.readMembership(), { ok: false });
    c = ctl({ selectAnswer: () => ({ data: [{ product: 'academy', status: 'active', source: 'app_store', will_renew: true }], error: null }) });
    const r = await api.readMembership();
    assert.equal(r.ok, true);
    assert.match(c.selects[0].cols, /plan, will_renew, renewal_checked_at/);
    assert.match(code(BILLING), /load\.state === 'failed' \? \(\s*<Section>\s*<Text style=\{ui\.body\}>\{MEMBERSHIP_NOT_CONFIRMED\}/);
  });
});

describe('5 · lifetime and granted memberships have nothing to cancel', () => {
  const store = (extra: object) => ({ product: 'academy', status: 'active', expires_at: FUTURE, source: 'play_store', ...extra });

  it('lifetime / granted / renewal-off offer no cancel; renewing and renewal-not-confirmed do', () => {
    const life = ms.membershipView([store({ plan: 'lifetime', expires_at: '2099-12-31T00:00:00Z' })], true);
    assert.equal(life.cards[0].kind, 'lifetime');
    assert.equal(ms.cancellableCard(life), null);
    assert.equal(ms.cancellableCard(ms.membershipView([store({ source: 'access_code' })], true)), null);
    assert.equal(ms.cancellableCard(ms.membershipView([store({ will_renew: false })], true)), null);
    assert.equal(ms.cancellableCard(ms.membershipView([store({ will_renew: true })], true))?.kind, 'renewing');
    // will_renew null = unknown (existing members until their next restore or store notice): still billed.
    assert.equal(ms.cancellableCard(ms.membershipView([store({ will_renew: null })], true))?.kind, 'unknown');
    assert.deepEqual(ms.providersStillBilling(life), []);
  });

  it('the lifetime card says so and carries no cancel control', () => {
    const s = code(BILLING);
    const life = s.slice(s.indexOf("case 'lifetime':"), s.indexOf("case 'granted':"));
    assert.match(life, /Lifetime membership — no renewal to cancel/);
    assert.doesNotMatch(life, /CancelMembership/);
    const off = s.slice(s.indexOf("case 'renewal_off':"), s.indexOf("case 'unknown':"));
    assert.doesNotMatch(off, /CancelMembership/);
  });

  it('the billing page shows no plans or prices (members never see an upsell)', () => {
    const s = code(BILLING);
    assert.doesNotMatch(s, /navigate\('Paywall'|\$\d|per month|per year|Upgrade|Join/);
  });
});
