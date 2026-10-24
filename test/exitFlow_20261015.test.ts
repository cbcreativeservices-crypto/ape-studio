/**
 * Exit flow (membership cancellation + account deletion), 2026-10-15 — built
 * behind a switch (src/config/exitFlow.ts), switched ON 2026-10-24 for the
 * final store build. Behaviour of the server calls: exitFlowOn_20261024.
 *
 * Logic is tested directly (survey.ts and membershipState.ts are import-free
 * apart from entitlementExpiry); the screens load React Native, so they are
 * pinned by source text in the house style.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// Extensionless relative imports inside src resolve to .ts / .tsx.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier) && context.parentURL) {
      const base = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const sw = await import('../src/config/exitFlow.ts');
const survey = await import('../src/features/exit/survey.ts');
const ms = await import('../src/features/exit/membershipState.ts');

const SETTINGS = 'src/screens/settings/SettingsScreen.tsx';
const CANCEL = 'src/screens/exit/CancelMembershipScreen.tsx';
const DELETE = 'src/screens/exit/DeleteAccountFlowScreen.tsx';
const API = 'src/features/exit/api.ts';

const FUTURE = new Date(Date.now() + 20 * 86400000).toISOString();
const PAST = new Date(Date.now() - 20 * 86400000).toISOString();

describe('the switch', () => {
  // Switched ON 2026-10-24 (owner: the exit flow ships in the final store build, ON).
  it('is ON in every build (release included); the dev-only preview flag stays inert', () => {
    assert.equal(sw.EXIT_FLOW_ENABLED, true);
    assert.equal(sw.exitFlowEnabled(), true);
    assert.match(code('src/config/exitFlow.ts'), /export const EXIT_FLOW_ENABLED = true;/);
    assert.match(code('src/config/exitFlow.ts'), /const DEV_PREVIEW_EXIT_FLOW = false;/);
    assert.match(code('src/config/exitFlow.ts'), /return dev && DEV_PREVIEW_EXIT_FLOW;/);
  });

  it('the OFF side (rollback only) is Settings exactly as before: Manage membership → Paywall, and the DELETE ACCOUNT hold button', () => {
    const s = code(SETTINGS);
    // The old branches are the OFF side of each switch.
    assert.match(s, /\) : \(\s*<>\s*\{tierKnown && isMember \? \(\s*<Pressable[\s\S]*?navigate\('Paywall'\)/);
    assert.match(s, /exitFlowEnabled\(\) \? \([\s\S]*?\) : \(\s*<SettingsSection title="DELETE ACCOUNT" danger>[\s\S]*?<DeleteAccountButton onDeleted=/);
    // Nothing new is reachable without the switch.
    for (const route of ['MembershipBilling', 'DeleteAccountFlow']) {
      const at = s.indexOf(`navigate('${route}')`);
      assert.ok(at > 0, route);
      assert.ok(s.lastIndexOf('exitFlowEnabled()', at) > 0 && at - s.lastIndexOf('exitFlowEnabled()', at) < 900, `${route} sits behind the switch`);
    }
    // The old hold-to-delete button is untouched by this work.
    assert.match(code('src/features/settings/DeleteAccountButton.tsx'), /supabase\.rpc\('delete_my_account'\)/);
  });

  it('ON shows the two entries; delete lives under Account and privacy, never behind the cancel flow', () => {
    const s = read(SETTINGS);
    assert.match(s, /Membership and billing<\/Text>/);
    assert.match(s, /<SettingsSection title="ACCOUNT AND PRIVACY">[\s\S]*?navigate\('DeleteAccountFlow'\)/);
  });

  it('the new screens are lazy routes (out of the app-start graph)', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    for (const [route, file] of [
      ['MembershipBilling', 'MembershipBillingScreen'],
      ['CancelMembership', 'CancelMembershipScreen'],
      ['DeleteAccountFlow', 'DeleteAccountFlowScreen'],
    ]) {
      assert.match(nav, new RegExp(`${route}: lazyScreen\\(\\(\\) => require\\('\\.\\./screens/exit/${file}'\\)`));
      assert.match(nav, new RegExp(`name="${route}" getComponent=\\{Lazy\\.${route}\\}`));
      assert.doesNotMatch(nav, new RegExp(`^import .*screens/exit/${file}`, 'm'));
    }
  });
});

describe('survey content', () => {
  it('Question 1 reason codes are exactly the spec list; privacy is deletion only', () => {
    assert.deepEqual(
      [...survey.REASON_CODES],
      ['budget', 'temporary_break', 'goal_completed', 'content_gap', 'technical_problem', 'usability', 'expectations', 'alternative_resource', 'privacy'],
    );
    assert.ok(!survey.reasonsFor('cancel').some((r: { code: string }) => r.code === 'privacy'));
    assert.ok(survey.reasonsFor('delete').some((r: { code: string }) => r.code === 'privacy'));
    assert.equal(survey.REASONS[0].label, 'It does not fit my budget right now');
    assert.equal(survey.EXIT_FLOW_VERSION, 1);
  });

  it('follow-up branches; a blank first answer gets "Do you expect to return?"', () => {
    assert.equal(survey.followUpFor(null).prompt, 'Do you expect to return?');
    for (const r of ['budget', 'temporary_break', 'goal_completed', 'alternative_resource']) {
      assert.equal(survey.followUpFor(r).id, 'return');
    }
    assert.equal(survey.followUpFor('technical_problem').prompt, 'What went wrong?');
    assert.equal(survey.followUpFor('content_gap').prompt, 'Which area were you looking for?');
    assert.equal(survey.followUpFor('usability').prompt, 'Where did you get stuck?');
    assert.equal(survey.followUpFor('expectations').prompt, 'Which area fell short?');
    assert.equal(survey.followUpFor('privacy').choices.length, 3);
  });

  it('thank-you omits a missing name and the feedback sentence when nothing was answered', () => {
    assert.match(survey.thankYou('Ana', true), /^Thank you, Ana, for being part of/);
    assert.match(survey.thankYou('Ana', true), /Your feedback helps us understand what to improve\./);
    assert.equal(survey.thankYou(null, false).includes('feedback'), false);
    assert.match(survey.thankYou('  ', false), /^Thank you for being part of/);
  });

  it('certificate choice texts are the owner-approved ones', () => {
    assert.deepEqual(
      survey.CERT_CHOICES.map((c: { code: string }) => c.code),
      ['delete_all', 'keep_record'],
    );
    // Shortened 2026-10-15 (owner: the delete screen was too long to read).
    assert.match(survey.CERT_CHOICES[0].label, /^Delete everything\. No one can verify your certificates afterwards\.$/);
    assert.match(survey.CERT_CHOICES[1].label, /^Keep a verification record: only your name, certificate, date and code stay/);
  });
  it('deletion asks five reasons, and a follow-up only for "did not work well"', () => {
    assert.equal(survey.reasonsFor('delete').length, 5);
    assert.equal(survey.deleteFollowUpFor('budget'), null);
    assert.equal(survey.deleteFollowUpFor(null), null);
    assert.equal(survey.deleteFollowUpFor('expectations').choices.length, 4);
  });
});

describe('membership state', () => {
  const store = (extra: object) => ({ product: 'academy', status: 'active', expires_at: FUTURE, source: 'app_store', ...extra });

  it('renewal unknown when the columns are missing or null — never "renews" or "ends"', () => {
    const v = ms.membershipView([store({})], false);
    assert.equal(v.state, 'active');
    assert.equal(v.cards[0].kind, 'unknown');
    assert.equal(ms.membershipView([store({ will_renew: null })], true).cards[0].kind, 'unknown');
  });

  it('renewing / renewal off / lifetime / granted / lapsed / none', () => {
    assert.equal(ms.membershipView([store({ will_renew: true, plan: 'monthly' })], true).cards[0].kind, 'renewing');
    assert.equal(ms.membershipView([store({ will_renew: false })], true).cards[0].kind, 'renewal_off');
    assert.equal(ms.membershipView([store({ expires_at: '2099-12-31T00:00:00Z' })], true).cards[0].kind, 'lifetime');
    assert.equal(ms.membershipView([store({ source: 'access_code' })], true).cards[0].kind, 'granted');
    assert.equal(ms.membershipView([store({ expires_at: PAST })], true).state, 'lapsed');
    assert.equal(ms.membershipView([], true).state, 'none');
    assert.equal(ms.providerOf('play_store'), 'google');
  });

  it('C4 only on will_renew === false for that provider', () => {
    assert.equal(ms.cancellationVerified([store({ will_renew: false })], true, 'apple'), true);
    assert.equal(ms.cancellationVerified([store({ will_renew: true })], true, 'apple'), false);
    assert.equal(ms.cancellationVerified([store({ will_renew: null })], true, 'apple'), false);
    assert.equal(ms.cancellationVerified([store({ will_renew: false })], false, 'apple'), false, 'columns missing = not confirmed');
    assert.equal(ms.cancellationVerified([store({ will_renew: false })], true, 'google'), false, 'other provider');
    assert.equal(ms.cancellationVerified([], true, 'apple'), false);
  });

  it('missing-column and missing-function errors are recognised', () => {
    assert.ok(ms.isMissingColumnError({ code: '42703', message: 'column entitlements.plan does not exist' }));
    assert.ok(!ms.isMissingColumnError({ code: '42501', message: 'permission denied' }));
    assert.ok(ms.isMissingFunctionError({ code: 'PGRST202' }));
  });
});

describe('cancel flow screen', () => {
  const s = code(CANCEL);
  it('the cancel control is rendered on C1–C3 and enabled with no answers', () => {
    assert.match(s, /STEPS_WITH_CANCEL_CONTROL: readonly CancelStep\[\] = \['c1', 'c2', 'c3'\]/);
    const dock = s.slice(s.indexOf('{showCancelControl ? ('), s.indexOf('</KeyboardAvoidingView>'));
    assert.match(dock, /<Btn label=\{continueToCancelLabel\(provider\)\} kind="danger" onPress=\{continueToStore\}/);
    assert.doesNotMatch(dock, /disabled=/, 'never disabled');
    assert.match(dock, /FEEDBACK_NOTICE/);
    // continueToStore never looks at the answers before opening the store.
    const fn = s.slice(s.indexOf('const continueToStore'), s.indexOf('const keepMembership'));
    assert.doesNotMatch(fn, /if \(!?reason|if \(!?followup/);
    assert.match(fn, /openSubscriptions\(provider, 'cancel'\)/);
    assert.equal(survey.FEEDBACK_NOTICE, 'Your selected answers are shared with us when you continue or cancel.');
  });

  it('C4 success only after the server confirms; otherwise the not-confirmed face', () => {
    assert.match(s, /if \(res\.ok && cancellationVerified\(res\.rows, res\.renewalKnown, provider\)\) \{[\s\S]*?setVerify\('verified'\)/);
    assert.match(s, /step === 'c4' && verify === 'verified'/);
    assert.match(s, /C4_NOT_CONFIRMED/);
    assert.match(s, /AppState\.addEventListener\('change'/);
    // Opening the store page sets PENDING, never verified.
    const fn = s.slice(s.indexOf('const continueToStore'), s.indexOf('const keepMembership'));
    assert.doesNotMatch(fn, /setVerify\('verified'\)/);
  });

  it('C3 offers Cancel and Keep with neither preselected, and no pause', () => {
    assert.match(s, /<Btn label="Cancel membership"/);
    assert.match(s, /<Btn label="Keep my membership"/);
    assert.doesNotMatch(s, /[Pp]ause/);
  });
});

describe('delete flow', () => {
  it('certificate choice has no default and gates Delete', () => {
    const s = code(DELETE);
    assert.match(s, /useState<KeepChoice \| null>\(null\)/);
    const gate = ms.deleteEnabled;
    assert.equal(gate({ password: 'pw', needsCertChoice: true, certChoice: null, busy: false }), false);
    assert.equal(gate({ password: 'pw', needsCertChoice: true, certChoice: 'delete_all', busy: false }), true);
    assert.equal(gate({ password: 'pw', needsCertChoice: true, certChoice: 'keep_record', busy: false }), true);
    assert.equal(gate({ password: '', needsCertChoice: true, certChoice: 'keep_record', busy: false }), false);
    assert.equal(gate({ password: 'pw', needsCertChoice: false, certChoice: null, busy: false }), true);
    assert.match(s, /disabled=\{!canDelete\}/);
    // An unknown credential read still asks.
    assert.match(s, /const needsCertChoice = hasCredential !== false;/);
  });

  it('delete calls the RPC with p_keep_credentials and HOLDS when keeping a record is not deployed', () => {
    assert.deepEqual(ms.deleteRpcArgs('keep_record'), { p_keep_credentials: true });
    assert.deepEqual(ms.deleteRpcArgs('delete_all'), { p_keep_credentials: false });
    const a = code(API);
    const fn = a.slice(a.indexOf('async function callDelete'), a.indexOf('export async function finishAccountErasure'));
    assert.match(fn, /supabase\.rpc\('delete_my_account', deleteRpcArgs\(choice\)\)/);
    assert.ok(fn.indexOf("if (choice === 'keep_record') throw new KeepRecordUnavailable") < fn.indexOf("supabase.rpc('delete_my_account')"));
    assert.match(a, /withDeadline\(async \(\) => await callDelete\(choice\), 'delete_my_account'\)/);
    assert.match(a, /if \(\(await lookUpDeletedAccount\(\)\) !== 'gone'\) throw unanswered;/);
  });

  it('the device side is the hold button\'s path: sign out, then the wipe on the queue', () => {
    const a = code(API);
    assert.match(
      a,
      /markIntentionalSignOut\(\);\s*await signOutThisDevice\(\);\s*await runAfterAccountSync\(async \(\) => \{\s*await clearLocalAccountData\(\);\s*resetAllLocalStores\(\);\s*\}\);/,
    );
  });

  it('password re-entry before delete, a deliberate confirmDialog, answers sent without an account', () => {
    const s = code(DELETE);
    assert.ok(s.indexOf('await confirmCurrentPassword(password)') < s.indexOf('await deleteMyAccount('));
    assert.match(s, /confirmDialog\(\s*'Delete your account\?'[\s\S]*?\{ destructive: true \}/);
    const after = s.slice(s.indexOf("if (outcome === 'deleted')"));
    assert.match(after.slice(0, 600), /submitExitFeedback\(\{ flow: 'delete', reason, followup \}\)/);
    const auth = code('src/features/auth/api.ts');
    assert.match(auth, /export async function confirmCurrentPassword[\s\S]*?signInWithPassword\(\{ email: user\.email!, password \}\)/);
  });
});
